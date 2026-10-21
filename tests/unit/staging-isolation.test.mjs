import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { spawnSync } from "node:child_process";
import { assertStagingIsolation } from "../../scripts/staging-isolation.mjs";
import { readConfig } from "../../scripts/prepare-production.mjs";

describe("staging D1 isolation", () => {
  it("runs the staging deployment gate with valid public test inputs", () => {
    const result = spawnSync(process.execPath, ["scripts/check-staging.mjs"], {
      env: {
        ...process.env,
        STAGING_URL: "https://infravel-staging.shkhrabdullah.workers.dev",
        NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
      },
      encoding: "utf8",
    });
    expect(result.status, result.stderr).toBe(0);
  });
  it("validates the actual root and production administration configs offline", async () => {
    assertStagingIsolation(readConfig("wrangler.jsonc"));
    await import("../../scripts/check-production-d1.mjs");
  });
  it.each([
    "extra binding",
    "replaced UUID",
    "remote local binding",
    "environment override",
  ])("rejects %s", (mutation) => {
    const config = readConfig("wrangler.jsonc");
    const production = readConfig("wrangler.production.d1.jsonc")
      .d1_databases[0];
    if (mutation === "extra binding")
      config.d1_databases.push({
        ...production,
        binding: "infravel_production",
        remote: true,
      });
    if (mutation === "replaced UUID")
      config.d1_databases[0].database_id = production.database_id;
    if (mutation === "remote local binding")
      config.d1_databases[0].remote = true;
    if (mutation === "environment override")
      config.env = { staging: { d1_databases: [production] } };
    expect(() => assertStagingIsolation(config)).toThrow();
  });
  it("guards the staging deployment branch and explicitly selects its configuration", () => {
    const workflow = fs.readFileSync(".github/workflows/staging.yml", "utf8");
    expect(workflow).toContain("if: github.ref == 'refs/heads/staging'");
    expect(workflow).toContain("node scripts/check-staging.mjs");
    expect(workflow).toContain(
      "wrangler d1 migrations apply DB --config wrangler.jsonc --remote",
    );
    expect(workflow).toContain(
      "opennextjs-cloudflare deploy --config wrangler.jsonc",
    );
  });
});
