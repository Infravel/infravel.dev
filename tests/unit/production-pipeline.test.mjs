import { describe, it, expect, vi } from "vitest";
import fs from "node:fs";
import yaml from "js-yaml";
import {
  verifyEnvironment,
  verifyPages,
  checkProductionRelease,
  requestMetadata,
  safeDiagnostic,
} from "../../scripts/check-production-release.mjs";

const environment = () => ({
  protection_rules: [
    {
      type: "required_reviewers",
      reviewers: [{ type: "User", reviewer: { login: "shekhar396" } }],
      prevent_self_review: false,
    },
  ],
  can_admins_bypass: false,
  deployment_branch_policy: {
    custom_branch_policies: true,
    protected_branches: false,
  },
});
describe("main production pipeline", () => {
  it("requires actual reviewer and main-only branch protections", () => {
    expect(() =>
      verifyEnvironment(environment(), [{ name: "main", type: "branch" }]),
    ).not.toThrow();
    for (const change of [
      { protection_rules: [] },
      { can_admins_bypass: true },
      { deployment_branch_policy: null },
    ]) {
      expect(() =>
        verifyEnvironment({ ...environment(), ...change }, [
          { name: "main", type: "branch" },
        ]),
      ).toThrow();
    }
    expect(() =>
      verifyEnvironment(environment(), [{ name: "staging", type: "branch" }]),
    ).toThrow();
    const selfReview = environment();
    selfReview.protection_rules[0].prevent_self_review = true;
    expect(() =>
      verifyEnvironment(selfReview, [{ name: "main", type: "branch" }]),
    ).not.toThrow();
  });
  it.each([
    { reviewers: [] },
    { reviewers: [{ type: "User", reviewer: { login: "another-user" } }] },
    { reviewers: [{ type: "Team", reviewer: { login: "shekhar396" } }] },
    {
      reviewers: [
        { type: "User", reviewer: { login: "shekhar396" } },
        { type: "User", reviewer: { login: "another-user" } },
      ],
    },
  ])(
    "rejects missing, substituted or alternative approvers: %j",
    ({ reviewers }) => {
      const config = environment();
      config.protection_rules[0].reviewers = reviewers;
      expect(() =>
        verifyEnvironment(config, [{ name: "main", type: "branch" }]),
      ).toThrow();
    },
  );
  it("rejects incomplete self-review metadata and additional deployment branches", () => {
    const config = environment();
    delete config.protection_rules[0].prevent_self_review;
    expect(() =>
      verifyEnvironment(config, [{ name: "main", type: "branch" }]),
    ).toThrow();
    expect(() =>
      verifyEnvironment(environment(), [
        { name: "main", type: "branch" },
        { name: "staging", type: "branch" },
      ]),
    ).toThrow();
  });
  it("blocks active or unknown Pages Git deployment settings", () => {
    expect(() =>
      verifyPages({
        name: "infravel-dev",
        source: { config: { production_deployments_enabled: false } },
      }),
    ).not.toThrow();
    for (const source of [
      undefined,
      {},
      { config: { production_deployments_enabled: true } },
    ]) {
      expect(() => verifyPages({ name: "infravel-dev", source })).toThrow();
    }
  });
  it("keeps the prepared main workflow manual, gated, and free of data or routing mutations", () => {
    const active = ".github/workflows/production-release.yml";
    const draft = fs.readFileSync(
      fs.existsSync(active) ? active : `${active}.disabled`,
      "utf8",
    );
    const workflow = yaml.load(draft);
    expect(Object.keys(workflow.on)).toEqual(["workflow_dispatch"]);
    expect(workflow.permissions.actions).toBe("read");
    expect(workflow.jobs.release.environment).toBe("production");
    expect(workflow.jobs.release.if).toContain("refs/heads/main");
    expect(workflow.jobs.release.if).not.toContain(
      "vars.ENABLE_PRODUCTION_RELEASE",
    );
    expect(workflow.jobs.release.steps[0].env.RELEASE_ENABLED).toBe(
      "${{ vars.ENABLE_PRODUCTION_RELEASE }}",
    );
    expect(workflow.jobs.release.steps[0].run).toContain(
      'test "$RELEASE_ENABLED" = true',
    );
    expect(workflow.jobs.release.env.PRODUCTION_ACCOUNT_ID).toBe(
      "${{ vars.CLOUDFLARE_ACCOUNT_ID }}",
    );
    expect(workflow.concurrency["cancel-in-progress"]).toBe(false);
    const commands = workflow.jobs.release.steps
      .map((s) => s.run || "")
      .join("\n");
    expect(commands).toContain("check-production-release.mjs");
    const shaCheck = workflow.jobs.release.steps.find(
      (step) => step.name === "Match approved main SHA",
    );
    expect(shaCheck.env.APPROVED_SHA).toBe("${{ inputs.approved_sha }}");
    expect(shaCheck.run).toContain('test "$APPROVED_SHA" = "$GITHUB_SHA"');
    expect(shaCheck.run).toContain(
      'test "$(git rev-parse HEAD)" = "$GITHUB_SHA"',
    );
    expect(commands).toContain("deploy-production-version.mjs");
    expect(commands).not.toMatch(
      /migrations apply|d1 execute|secret (put|bulk)|triggers deploy|wrangler pages/,
    );
    const helper = fs.readFileSync(
      "scripts/deploy-production-version.mjs",
      "utf8",
    );
    expect(helper).toMatch(/"versions",\s*"upload"/);
    expect(helper).toContain('"--keep-vars"');
    expect(helper).not.toMatch(
      /secrets-file|triggers.*deploy|migrations.*apply/,
    );
  });
});

describe("production metadata API diagnostics", () => {
  const input = {
    GITHUB_REF: "refs/heads/main",
    GH_TOKEN: "private-gh-token",
    CLOUDFLARE_API_TOKEN: "private-cf-token",
  };
  const policy = {
    total_count: 1,
    branch_policies: [{ name: "main", type: "branch" }],
  };
  const json = (value) => new Response(JSON.stringify(value), { status: 200 });
  it("checks all three read-only endpoints using a valid solo-founder environment", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(json(environment()))
      .mockResolvedValueOnce(json(policy))
      .mockResolvedValueOnce(
        json({
          success: true,
          result: {
            name: "infravel-dev",
            source: {
              config: {
                deployments_enabled: true,
                production_deployments_enabled: false,
              },
            },
          },
        }),
      );
    await checkProductionRelease(input, { fetcher, log: vi.fn() });
    expect(fetcher).toHaveBeenCalledTimes(3);
    for (const [, options] of fetcher.mock.calls) {
      expect(options.method).toBe("GET");
      expect(options.redirect).toBe("error");
    }
  });
  it.each([401, 403, 404, 429, 500])(
    "reports environment HTTP %i and permission without disclosing body/token",
    async (status) => {
      const fetcher = vi
        .fn()
        .mockResolvedValue(
          new Response("sensitive-response-and-credentials", { status }),
        );
      const error = await requestMetadata(
        "environment",
        input.GH_TOKEN,
        fetcher,
      ).catch((e) => e);
      const diagnostic = safeDiagnostic(error);
      expect(diagnostic).toContain("[environment]");
      expect(diagnostic).toContain(`HTTP ${status}`);
      expect(diagnostic).toContain("GitHub Actions: read");
      expect(diagnostic).not.toMatch(
        /private-gh-token|sensitive-response-and-credentials/,
      );
    },
  );
  it("identifies branch-policy denial separately", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(json(environment()))
      .mockResolvedValueOnce(new Response("private", { status: 403 }));
    await expect(
      checkProductionRelease(input, { fetcher, log: vi.fn() }),
    ).rejects.toThrow(/\[policies\].*HTTP 403.*Actions: read/);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it("identifies Cloudflare Pages permission failure after valid GitHub checks", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(json(environment()))
      .mockResolvedValueOnce(json(policy))
      .mockResolvedValueOnce(
        new Response("private provider details", { status: 403 }),
      );
    await expect(
      checkProductionRelease(input, { fetcher, log: vi.fn() }),
    ).rejects.toThrow(/\[pages\].*HTTP 403.*Pages Read/);
  });
  it("reports missing credentials before sending a request", async () => {
    const fetcher = vi.fn();
    await expect(requestMetadata("pages", "", fetcher)).rejects.toThrow(
      /not requested.*missing CLOUDFLARE_API_TOKEN/,
    );
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("withholds raw network errors and malformed response bodies", async () => {
    const error = await requestMetadata(
      "environment",
      input.GH_TOKEN,
      vi.fn().mockRejectedValue(new Error("private-gh-token")),
    ).catch((e) => e);
    expect(safeDiagnostic(error)).toContain("HTTP unavailable");
    expect(safeDiagnostic(error)).not.toContain(input.GH_TOKEN);
    await expect(
      requestMetadata(
        "pages",
        input.CLOUDFLARE_API_TOKEN,
        vi.fn().mockResolvedValue(new Response("private-cf-token")),
      ),
    ).rejects.toThrow(/HTTP 200: invalid JSON/);
    expect(safeDiagnostic(new Error("private details"))).not.toContain(
      "private details",
    );
  });
  it("reports specific missing response fields and API failure envelopes", async () => {
    expect(() => verifyEnvironment({}, [])).toThrow(
      /HTTP 200.*protection_rules/,
    );
    expect(() => verifyPages({ name: "infravel-dev", source: {} })).toThrow(
      /HTTP 200.*source.config/,
    );
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(json(environment()))
      .mockResolvedValueOnce(json(policy))
      .mockResolvedValueOnce(
        json({
          success: false,
          errors: [{ message: "secret provider details" }],
        }),
      );
    await expect(
      checkProductionRelease(input, { fetcher, log: vi.fn() }),
    ).rejects.toThrow(/\[pages\].*HTTP 200.*success missing\/false/);
  });
});
