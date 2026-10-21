import { afterEach, describe, expect, it, vi } from "vitest";
import config from "../../next.config";
import robots from "@/app/robots";
import { readJson } from "@/lib/security";
afterEach(() => vi.unstubAllEnvs());
describe("launch security and indexing", () => {
  it("accepts JSON charset parameters but rejects lookalike media types", async () => {
    const request = (type: string) =>
      new Request("https://infravel.dev", {
        method: "POST",
        headers: { "content-type": type },
        body: "{}",
      });
    await expect(
      readJson(request("application/json; charset=utf-8")),
    ).resolves.toEqual({});
    for (const type of [
      "application/jsonp",
      "application/json-malicious",
      "text/plain",
    ]) {
      await expect(readJson(request(type))).rejects.toMatchObject({
        status: 415,
      });
    }
  });
  it("retains staging noindex and only allows crawling in production mode", () => {
    vi.stubEnv("DEPLOYMENT_ENV", "staging");
    expect(robots().rules).toMatchObject({ disallow: "/" });
    vi.stubEnv("DEPLOYMENT_ENV", "production");
    expect(robots().rules).toMatchObject({ allow: "/", disallow: "/api/" });
  });
  it("keeps workers.dev previews noindex even when built in production mode", async () => {
    vi.stubEnv("DEPLOYMENT_ENV", "production");
    const headers = await config.headers!();
    const preview = headers.find((rule) =>
      rule.has?.some((condition) => condition.type === "host"),
    );
    expect(preview?.headers).toContainEqual({
      key: "X-Robots-Tag",
      value: "noindex, nofollow",
    });
    expect(
      headers[0].headers.some((header) => header.key === "X-Robots-Tag"),
    ).toBe(false);
  });
  it("redirects only the approved www hostname while retaining the path", async () => {
    const redirects = await config.redirects!();
    expect(redirects).toContainEqual({
      source: "/:path*",
      has: [{ type: "host", value: "www.infravel.dev" }],
      destination: "https://infravel.dev/:path*",
      permanent: true,
    });
  });
});
