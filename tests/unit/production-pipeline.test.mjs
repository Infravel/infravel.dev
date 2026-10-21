import { describe, it, expect } from "vitest";
import fs from "node:fs";
import yaml from "js-yaml";
import {
  verifyEnvironment,
  verifyPages,
} from "../../scripts/check-production-release.mjs";

const environment = () => ({
  protection_rules: [
    {
      type: "required_reviewers",
      reviewers: [{ id: 1 }],
      prevent_self_review: true,
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
    selfReview.protection_rules[0].prevent_self_review = false;
    expect(() =>
      verifyEnvironment(selfReview, [{ name: "main", type: "branch" }]),
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
