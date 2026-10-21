import { describe, it, expect, vi } from "vitest";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { runSmoke } from "../../scripts/smoke.mjs";

const base = "https://infravel-staging.shkhrabdullah.workers.dev";
function setup() {
  let clock = 0;
  const sleep = vi.fn(async (ms) => {
    clock += ms;
  });
  const log = vi.fn();
  const fetcher = vi.fn(
    async (url) =>
      new Response(null, {
        status:
          url.pathname === "/api/internal/notifications/retry" ? 401 : 200,
      }),
  );
  return {
    fetcher,
    sleep,
    log,
    now: () => clock,
    advance: (ms) => {
      clock += ms;
    },
  };
}
describe("staging deployment smoke", () => {
  it("immediately checks all routes and retry protection after readiness", async () => {
    const deps = setup();
    await runSmoke(base, deps);
    expect(deps.sleep).not.toHaveBeenCalled();
    expect(deps.fetcher.mock.calls.map(([url]) => url.pathname)).toEqual([
      "/",
      "/",
      "/services",
      "/contact",
      "/opspilot",
      "/insights",
      "/robots.txt",
      "/sitemap.xml",
      "/api/internal/notifications/retry",
    ]);
    for (const [url, options] of deps.fetcher.mock.calls) {
      expect(url.origin).toBe(base);
      expect(options.redirect).toBe("manual");
      expect(options.signal).toBeInstanceOf(AbortSignal);
    }
    expect(deps.fetcher.mock.calls.at(-1)[1].method).toBe("POST");
    expect(deps.log).toHaveBeenCalledWith(
      "Readiness attempt 1: 0s elapsed, HTTP 200.",
    );
  });
  it("recovers after transient HTTP responses and sanitized network errors", async () => {
    const deps = setup();
    deps.fetcher
      .mockResolvedValueOnce(new Response("private response", { status: 500 }))
      .mockRejectedValueOnce(new TypeError("secret/customer information"))
      .mockRejectedValueOnce(
        new DOMException("private timeout", "TimeoutError"),
      )
      .mockResolvedValueOnce(new Response(null, { status: 503 }));
    await runSmoke(base, deps);
    expect(deps.sleep.mock.calls).toEqual([[5000], [5000], [5000], [5000]]);
    expect(deps.log.mock.calls.slice(0, 5).map(([line]) => line)).toEqual([
      "Readiness attempt 1: 0s elapsed, HTTP 500.",
      "Readiness attempt 2: 5s elapsed, network-error.",
      "Readiness attempt 3: 10s elapsed, request-timeout.",
      "Readiness attempt 4: 15s elapsed, HTTP 503.",
      "Readiness attempt 5: 20s elapsed, HTTP 200.",
    ]);
    expect(JSON.stringify(deps.log.mock.calls)).not.toMatch(
      /private|secret|customer/,
    );
  });
  it.each(["http", "network"])(
    "fails persistent %s errors after 90 seconds without running route checks",
    async (kind) => {
      const deps = setup();
      if (kind === "http")
        deps.fetcher.mockResolvedValue(new Response(null, { status: 500 }));
      else deps.fetcher.mockRejectedValue(new Error("private network details"));
      await expect(runSmoke(base, deps)).rejects.toThrow(
        "homepage not ready within 90 seconds",
      );
      expect(deps.now()).toBe(90000);
      expect(deps.fetcher).toHaveBeenCalledTimes(18);
      expect(
        deps.fetcher.mock.calls.every(([url]) => url.pathname === "/"),
      ).toBe(true);
    },
  );
  it("caps the last request timeout at the remaining readiness budget", async () => {
    const deps = setup();
    const timeout = vi.spyOn(AbortSignal, "timeout");
    deps.fetcher.mockImplementation(async () => {
      deps.advance(7000);
      throw new DOMException("timeout", "TimeoutError");
    });
    try {
      await expect(runSmoke(base, deps)).rejects.toThrow("not ready");
      expect(timeout.mock.calls.at(-1)[0]).toBe(6000);
    } finally {
      timeout.mockRestore();
    }
  });
  it("keeps route failures strict even after the homepage recovers", async () => {
    const deps = setup();
    deps.fetcher
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 500 }));
    await expect(runSmoke(base, deps)).rejects.toThrow("Smoke failed: / (500)");
    expect(deps.sleep).not.toHaveBeenCalled();
  });
  it("sanitizes network failures during strict route checks", async () => {
    const deps = setup();
    deps.fetcher
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockRejectedValueOnce(new Error("private runtime details"));
    await expect(runSmoke(base, deps)).rejects.toThrow(
      "Smoke failed: / (network-error)",
    );
    expect(JSON.stringify(deps.log.mock.calls)).not.toContain("private");
  });
  it("exits nonzero from the CLI for an unapproved target without leaking its value", () => {
    const result = spawnSync(
      process.execPath,
      [fileURLToPath(new URL("../../scripts/smoke.mjs", import.meta.url))],
      {
        env: { STAGING_URL: "https://infravel.dev/?secret=private" },
        encoding: "utf8",
      },
    );
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("approved staging Worker origin");
    expect(result.stderr).not.toMatch(/private|secret|https:/);
  });
  it("fails when retry authorization is missing", async () => {
    const deps = setup();
    deps.fetcher.mockResolvedValue(new Response(null, { status: 200 }));
    await expect(runSmoke(base, deps)).rejects.toThrow("not protected");
  });
  it.each([
    undefined,
    "https://infravel.dev",
    "http://infravel-staging.shkhrabdullah.workers.dev",
    `${base}.evil.test`,
    `https://user:password@${new URL(base).host}`,
    `${base}/path`,
    `${base}?token=private`,
  ])(
    "rejects an unapproved target before making requests (%s)",
    async (value) => {
      const deps = setup();
      await expect(runSmoke(value, deps)).rejects.toThrow(
        "approved staging Worker origin",
      );
      expect(deps.fetcher).not.toHaveBeenCalled();
    },
  );
});
