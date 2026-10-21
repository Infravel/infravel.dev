import { describe, it, expect, vi } from "vitest";
import fs from "node:fs";
import { sendNotificationRetry } from "../../scripts/retry-notifications.mjs";
import { spawnSync } from "node:child_process";
import {
  productionConfig,
  readConfig,
  validateTemplate,
} from "../../scripts/prepare-production.mjs";
import {
  productionOrigin,
  smokeProduction,
} from "../../scripts/smoke-production.mjs";

const template = () => readConfig("wrangler.production.template.jsonc");
const staging = readConfig("wrangler.jsonc");
// Synthetic unit-test fixtures, never written to a Wrangler deployment file.
const input = {
  DEPLOYMENT_ENV: "production",
  PRODUCTION_LAUNCH_PHASE: "precutover",
  PRODUCTION_D1_DATABASE_ID: "11111111-2222-4333-8444-555555555555",
  PRODUCTION_PREVIEW_URL: "https://infravel-production.example.workers.dev",
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: "0x4TEST-FIXTURE-NOT-A-REAL-KEY",
  NEXT_PUBLIC_CONTACT_EMAIL: "owner@example.com",
};
describe("production release isolation", () => {
  it("pins an explicitly supplied account and rejects malformed account IDs", () => {
    const result = productionConfig(template(), staging, {
      ...input,
      PRODUCTION_ACCOUNT_ID: "f6d4cc93a61d7012130cfbd39b3a84fd",
    });
    expect(result.account_id).toBe("f6d4cc93a61d7012130cfbd39b3a84fd");
    expect(() =>
      productionConfig(template(), staging, {
        ...input,
        PRODUCTION_ACCOUNT_ID: "invalid",
      }),
    ).toThrow();
  });
  it("produces only an isolated Worker with no live routes or secret values", () => {
    const result = productionConfig(template(), staging, input);
    expect(result.name).toBe("infravel-production");
    expect(result.routes).toEqual([]);
    expect(result.d1_databases[0].database_id).not.toBe(
      staging.d1_databases[0].database_id,
    );
    expect(result.vars.DEPLOYMENT_ENV).toBe("production");
    expect(result.vars.TURNSTILE_HOSTNAMES).toContain("www.infravel.dev");
    expect(template().d1_databases[0].database_id).toBe("");
  });
  it.each([
    ["DEPLOYMENT_ENV", "staging"],
    ["PRODUCTION_LAUNCH_PHASE", "live"],
    ["PRODUCTION_D1_DATABASE_ID", ""],
    ["PRODUCTION_D1_DATABASE_ID", "00000000-0000-0000-0000-000000000000"],
    ["PRODUCTION_D1_DATABASE_ID", staging.d1_databases[0].database_id],
    ["PRODUCTION_PREVIEW_URL", "https://infravel.dev"],
    ["PRODUCTION_PREVIEW_URL", "https://infravel-staging.example.workers.dev"],
    [
      "PRODUCTION_PREVIEW_URL",
      "https://infravel-production.example.workers.dev.evil.test",
    ],
    [
      "PRODUCTION_PREVIEW_URL",
      "https://user:password@infravel-production.example.workers.dev",
    ],
    ["NEXT_PUBLIC_TURNSTILE_SITE_KEY", "1x00000000000000000000AA"],
    ["NEXT_PUBLIC_CONTACT_EMAIL", "owner@example.com\r\nBcc: x@example.com"],
  ])("fails closed for invalid %s", (key, value) => {
    expect(() =>
      productionConfig(template(), staging, { ...input, [key]: value }),
    ).toThrow();
  });
  it("rejects routes, alternate bindings, secret-bearing vars, and nested environments", () => {
    for (const change of [
      { routes: [{ pattern: "infravel.dev", custom_domain: true }] },
      { env: { staging: {} } },
      { vars: { DEPLOYMENT_ENV: "production", BREVO_API_KEY: "not-real" } },
      { name: "infravel-staging" },
      { d1_databases: [{ binding: "DB", database_name: "infravel-staging" }] },
    ]) {
      expect(() => validateTemplate({ ...template(), ...change })).toThrow();
    }
  });
  it("keeps the production workflow inert and validates its manual controls", () => {
    const result = spawnSync(
      process.execPath,
      ["scripts/check-launch-draft.mjs"],
      { encoding: "utf8" },
    );
    expect(result.status, result.stdout + result.stderr).toBe(0);
    expect(fs.existsSync(".github/workflows/production-launch.yml")).toBe(
      false,
    );
  });
});

describe("production smoke boundaries", () => {
  it("never sends a retry secret to arbitrary, redirected, or malformed destinations", async () => {
    for (const url of [
      "https://evil.test/api/internal/notifications/retry",
      "https://infravel.dev.evil.test/api/internal/notifications/retry",
      "https://infravel.dev/api/internal/notifications/retry?token=private",
      "https://user:password@infravel.dev/api/internal/notifications/retry",
      "https://infravel.dev/other",
    ]) {
      const send = vi.fn();
      await expect(
        sendNotificationRetry(url, "test-only", send),
      ).rejects.toThrow();
      expect(send).not.toHaveBeenCalled();
    }
  });
  it("retains the known staging/production retry endpoints and returns counts only", async () => {
    for (const origin of [
      "https://infravel.dev",
      "https://infravel-staging.shkhrabdullah.workers.dev",
    ]) {
      const send = vi
        .fn()
        .mockResolvedValue(
          Response.json({ checked: 2, sent: 1, private: "must-not-log" }),
        );
      expect(
        await sendNotificationRetry(
          `${origin}/api/internal/notifications/retry`,
          "test-only",
          send,
        ),
      ).toEqual({ checked: 2, sent: 1 });
      expect(send.mock.calls[0][1].redirect).toBe("error");
      expect(send.mock.calls[0][1].headers).toEqual({
        Authorization: "Bearer test-only",
      });
    }
  });
  it("rejects invalid retry summaries and provider failures", async () => {
    for (const response of [
      Response.json({ checked: -1, sent: 10 }),
      Response.json({ checked: 1, sent: "private" }),
      new Response(null, { status: 503 }),
    ]) {
      await expect(
        sendNotificationRetry(
          "https://infravel.dev/api/internal/notifications/retry",
          "test-only",
          vi.fn().mockResolvedValue(response),
        ),
      ).rejects.toThrow();
    }
  });
  it("rejects arbitrary/staging origins and invalid mode before fetching", async () => {
    for (const url of [
      "https://infravel-staging.example.workers.dev",
      "http://infravel.dev",
      "https://evil.test",
      "https://infravel-production.example.workers.dev?token=private",
    ]) {
      const send = vi.fn();
      await expect(smokeProduction(url, { fetcher: send })).rejects.toThrow();
      expect(send).not.toHaveBeenCalled();
    }
    expect(() =>
      productionOrigin(input.PRODUCTION_PREVIEW_URL, "unknown"),
    ).toThrow();
    expect(productionOrigin("https://infravel.dev", "live").hostname).toBe(
      "infravel.dev",
    );
  });
  it("checks only public reads and an unauthorized retry probe, never sends a lead", async () => {
    const send = vi.fn(async (url) => {
      const headers = {
        "content-security-policy": "default-src 'self'",
        "strict-transport-security": "max-age=31536000",
        "x-content-type-options": "nosniff",
        "referrer-policy": "strict-origin-when-cross-origin",
        "x-robots-tag": "noindex, nofollow",
      };
      if (url.pathname === "/robots.txt")
        return new Response("User-agent: *\nAllow: /\nDisallow: /api/\n");
      if (url.pathname === "/does-not-exist")
        return new Response(null, { status: 404 });
      if (url.pathname === "/api/internal/notifications/retry")
        return new Response(null, { status: 401 });
      if (url.pathname === "/services/cicd-deployment-automation")
        return new Response(null, {
          status: 308,
          headers: { location: "/services/cicd-pipeline-setup" },
        });
      return new Response("infravel-lockup.webp opengraph-image.jpg", {
        headers,
      });
    });
    await smokeProduction(input.PRODUCTION_PREVIEW_URL, {
      fetcher: send,
      log: vi.fn(),
    });
    expect(
      send.mock.calls.filter(([, options]) => options.method === "POST"),
    ).toHaveLength(1);
    for (const [, options] of send.mock.calls) {
      expect(options.body).toBeUndefined();
      expect(options.headers).toBeUndefined();
      expect(options.redirect).toBe("manual");
    }
  });
  it("does not accept staging robots policy or indexable preview responses", async () => {
    const send = vi.fn(
      async () => new Response("infravel-lockup.webp opengraph-image.jpg"),
    );
    await expect(
      smokeProduction(input.PRODUCTION_PREVIEW_URL, {
        fetcher: send,
        log: vi.fn(),
      }),
    ).rejects.toThrow();
  });
});
