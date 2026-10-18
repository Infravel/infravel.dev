import { describe, it, expect, vi } from "vitest";
import { database } from "../helpers/db";
import { submission } from "@/lib/submissions";
import {
  rateLimit,
  RequestError,
  readJson,
  verifyTurnstile,
} from "@/lib/security";
import { notify, retryNotifications } from "@/lib/notifications";
import type { Env } from "@/lib/env";
const quote = {
  name: "Test Engineer",
  email: "engineer@example.com",
  service: "docker-deployment",
  requirements: "We need a repeatable deployment workflow for our application.",
  turnstileToken: "token",
};
function setup() {
  const { db, sqlite } = database();
  const env = {
    DB: db,
    RATE_LIMIT_SALT: "test-only-salt",
    TURNSTILE_SECRET_KEY: "test-secret",
    TURNSTILE_HOSTNAMES: "infravel.dev",
  } as Env;
  const deps = {
    rateLimit,
    verifyTurnstile: vi.fn().mockResolvedValue(undefined),
    notify: vi.fn().mockResolvedValue(false),
  };
  return { env, sqlite, deps };
}
function request(body: unknown, url = "https://infravel.dev/api/quote") {
  return new Request(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://infravel.dev",
      "CF-Connecting-IP": "192.0.2.1",
    },
    body: JSON.stringify(body),
  });
}
describe("D1-backed submissions using SQLite migrations", () => {
  it("stores valid lead and outbox atomically", async () => {
    const { env, sqlite, deps } = setup();
    const res = await submission(request(quote), env, "quote", deps);
    expect(res.status).toBe(200);
    expect(sqlite.prepare("SELECT service FROM leads").get()).toMatchObject({
      service: "docker-deployment",
    });
    expect(
      sqlite.prepare("SELECT status FROM notification_outbox").get(),
    ).toMatchObject({ status: "pending" });
  });
  it("rejects invalid input before persistence", async () => {
    const { env, sqlite, deps } = setup();
    expect(
      (
        await submission(
          request({ ...quote, email: "bad" }),
          env,
          "quote",
          deps,
        )
      ).status,
    ).toBe(400);
    expect(sqlite.prepare("SELECT count(*) as n FROM leads").get()?.n).toBe(0);
  });
  it("rejects honeypot spam", async () => {
    const { env, deps } = setup();
    expect(
      (
        await submission(
          request({ ...quote, website: "spam" }),
          env,
          "quote",
          deps,
        )
      ).status,
    ).toBe(400);
    expect(deps.verifyTurnstile).not.toHaveBeenCalled();
  });
  it("rejects failed Turnstile checks", async () => {
    const { env, deps } = setup();
    deps.verifyTurnstile.mockRejectedValue(
      new RequestError(400, "Security check failed."),
    );
    expect((await submission(request(quote), env, "quote", deps)).status).toBe(
      400,
    );
  });
  it("rate limits across requests sharing a database", async () => {
    const { env, deps } = setup();
    for (let i = 0; i < 5; i++)
      expect(
        (await submission(request(quote), env, "quote", deps)).status,
      ).toBe(200);
    const res = await submission(request(quote), env, "quote", deps);
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("600");
  });
  it("does not expose database error details", async () => {
    const { env, sqlite, deps } = setup();
    sqlite.exec("DROP TABLE notification_outbox");
    const res = await submission(request(quote), env, "quote", deps);
    expect(res.status).toBe(503);
    expect(await res.text()).not.toContain("SQLITE");
    expect(sqlite.prepare("SELECT count(*) as n FROM leads").get()?.n).toBe(0);
  });
  it("retains a lead when notification throws", async () => {
    const { env, sqlite, deps } = setup();
    deps.notify.mockRejectedValue(new Error("provider down"));
    expect((await submission(request(quote), env, "quote", deps)).status).toBe(
      200,
    );
    expect(sqlite.prepare("SELECT count(*) as n FROM leads").get()?.n).toBe(1);
  });
  it("keeps duplicate waitlist registration private and preserves original consent", async () => {
    const { env, sqlite, deps } = setup();
    const body = {
      email: "TEST@example.com",
      turnstileToken: "x",
      consent: false,
    };
    const a = await submission(request(body), env, "waitlist", deps);
    const b = await submission(
      request({ ...body, email: "test@example.com", consent: true }),
      env,
      "waitlist",
      deps,
    );
    expect(await a.json()).toEqual(await b.json());
    expect(
      sqlite
        .prepare("SELECT count(*) as n,consent FROM opspilot_waitlist")
        .get(),
    ).toMatchObject({ n: 1, consent: 0 });
  });
  it("rejects cross-origin and oversized bodies", async () => {
    const { env, deps } = setup();
    expect(
      (
        await submission(
          request(quote, "https://other.test/api/quote"),
          env,
          "quote",
          deps,
        )
      ).status,
    ).toBe(403);
    await expect(
      readJson(request({ data: "x".repeat(17000) })),
    ).rejects.toMatchObject({ status: 413 });
  });
  it("rejects malformed and non-JSON requests", async () => {
    await expect(
      readJson(
        new Request("https://x.test", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "{",
        }),
      ),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      readJson(new Request("https://x.test", { method: "POST", body: "{}" })),
    ).rejects.toMatchObject({ status: 415 });
  });
});
describe("Turnstile verification", () => {
  it("requires success, expected hostname, and expected action", async () => {
    const { env } = setup();
    for (const result of [
      { success: false },
      { success: true, hostname: "evil.test", action: "quote" },
      { success: true, hostname: "infravel.dev", action: "waitlist" },
    ]) {
      await expect(
        verifyTurnstile(
          "x",
          request({}),
          env,
          "quote",
          vi.fn().mockResolvedValue(Response.json(result)),
        ),
      ).rejects.toMatchObject({ status: 400 });
    }
    await expect(
      verifyTurnstile(
        "x",
        request({}),
        env,
        "quote",
        vi.fn().mockResolvedValue(
          Response.json({
            success: true,
            hostname: "infravel.dev",
            action: "quote",
          }),
        ),
      ),
    ).resolves.toBeUndefined();
  });
});
describe("notification outbox", () => {
  async function saved() {
    const s = setup();
    await submission(request(quote), s.env, "quote", s.deps);
    Object.assign(s.env, {
      BREVO_API_KEY: "test",
      EMAIL_FROM: "Infravel <hello@infravel.dev>",
      LEAD_NOTIFICATION_TO: "owner@example.com",
    });
    const row = s.sqlite.prepare("SELECT id FROM notification_outbox").get();
    return { ...s, id: String(row?.id) };
  }
  it("records provider failure without losing the lead", async () => {
    const { env, sqlite, id } = await saved();
    expect(
      await notify(
        env,
        id,
        vi.fn().mockResolvedValue(new Response("", { status: 500 })),
      ),
    ).toBe(false);
    expect(
      sqlite.prepare("SELECT notification_status FROM leads").get()
        ?.notification_status,
    ).toBe("failed");
    expect(
      sqlite.prepare("SELECT attempts FROM notification_outbox").get()
        ?.attempts,
    ).toBe(1);
  });
  it("records Brevo acceptance and does not resend a sent item", async () => {
    const { env, sqlite, id } = await saved();
    const send = vi
      .fn()
      .mockResolvedValue(Response.json({ messageId: "mail" }, { status: 201 }));
    expect(await notify(env, id, send)).toBe(true);
    expect(await notify(env, id, send)).toBe(false);
    expect(send).toHaveBeenCalledTimes(1);
    const [url, options] = send.mock.calls[0];
    expect(url).toBe("https://api.brevo.com/v3/smtp/email");
    expect(options.headers).toEqual({
      "api-key": "test",
      "Content-Type": "application/json",
    });
    const payload = JSON.parse(options.body);
    expect(payload).toEqual({
      sender: { name: "Infravel", email: "hello@infravel.dev" },
      to: [{ email: "owner@example.com" }],
      replyTo: { email: quote.email },
      subject: "New Infravel quote request",
      textContent: expect.stringContaining("Lead "),
    });
    expect(payload.textContent).not.toContain(quote.requirements);
    expect(payload.textContent).not.toContain(quote.name);
    expect(
      sqlite.prepare("SELECT notification_status FROM leads").get()
        ?.notification_status,
    ).toBe("sent");
  });
  it("requires manual review after the operational retry window", async () => {
    const { env, sqlite, id } = await saved();
    sqlite
      .prepare(
        "UPDATE notification_outbox SET created_at=unixepoch()-86400 WHERE id=?",
      )
      .run(id);
    const send = vi.fn();
    expect(await notify(env, id, send)).toBe(false);
    expect(send).not.toHaveBeenCalled();
    expect(await retryNotifications(env)).toEqual({ checked: 0, sent: 0 });
  });
  it.each([401, 429, 500])(
    "schedules retries after provider status %s without disclosing its response",
    async (status) => {
      const { env, sqlite, id } = await saved();
      const before = Math.floor(Date.now() / 1000);
      const send = vi
        .fn()
        .mockResolvedValue(
          new Response("private provider details", {
            status,
            headers: { "Retry-After": "600" },
          }),
        );
      expect(await notify(env, id, send)).toBe(false);
      const row = sqlite.prepare("SELECT * FROM notification_outbox").get();
      expect(row).toMatchObject({
        status: "failed",
        attempts: 1,
        lease_until: null,
      });
      expect(Number(row?.next_attempt_at)).toBeGreaterThanOrEqual(
        before + (status === 429 ? 600 : 120),
      );
      expect(await notify(env, id, send)).toBe(false);
      expect(send).toHaveBeenCalledTimes(1);
      sqlite.exec(
        "UPDATE notification_outbox SET next_attempt_at=unixepoch()-1",
      );
      const fetchSpy = vi
        .spyOn(globalThis, "fetch")
        .mockResolvedValue(Response.json({ messageId: "retry" }));
      try {
        expect(await retryNotifications(env)).toEqual({ checked: 1, sent: 1 });
      } finally {
        fetchSpy.mockRestore();
      }
    },
  );
  it("uses an eight-second abort signal and schedules a timeout retry", async () => {
    const { env, sqlite, id } = await saved();
    const timeout = vi.spyOn(AbortSignal, "timeout");
    const send = vi
      .fn<typeof fetch>()
      .mockImplementation(async (_url, options) => {
        expect(options?.signal).toBeInstanceOf(AbortSignal);
        throw new DOMException("Timed out", "TimeoutError");
      });
    try {
      expect(await notify(env, id, send)).toBe(false);
      expect(timeout).toHaveBeenCalledWith(8000);
      expect(
        sqlite.prepare("SELECT status FROM notification_outbox").get()?.status,
      ).toBe("failed");
    } finally {
      timeout.mockRestore();
    }
  });
  it.each(["BREVO_API_KEY", "EMAIL_FROM", "LEAD_NOTIFICATION_TO"] as const)(
    "leaves work pending without %s",
    async (key) => {
      const { env, sqlite, id } = await saved();
      delete env[key];
      const send = vi.fn();
      expect(await notify(env, id, send)).toBe(false);
      expect(send).not.toHaveBeenCalled();
      expect(
        sqlite.prepare("SELECT status,attempts FROM notification_outbox").get(),
      ).toMatchObject({ status: "pending", attempts: 0 });
    },
  );
  it("prevents concurrent retries from sending the same item", async () => {
    const { env, id } = await saved();
    let release!: (response: Response) => void;
    const send = vi.fn<typeof fetch>().mockImplementation(
      () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    );
    const first = notify(env, id, send);
    await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(1));
    expect(await notify(env, id, send)).toBe(false);
    release(Response.json({ messageId: "one" }));
    expect(await first).toBe(true);
    expect(send).toHaveBeenCalledTimes(1);
  });
  it("recovers expired leases and fences stale acknowledgments", async () => {
    const { env, sqlite, id } = await saved();
    let release!: (response: Response) => void;
    const first = notify(
      env,
      id,
      vi.fn<typeof fetch>().mockImplementation(
        () =>
          new Promise((resolve) => {
            release = resolve;
          }),
      ),
    );
    await vi.waitFor(() => expect(release).toBeTypeOf("function"));
    sqlite.exec("UPDATE notification_outbox SET lease_until=unixepoch()-1");
    const second = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 500 }));
    expect(await notify(env, id, second)).toBe(false);
    release(Response.json({ messageId: "stale" }));
    expect(await first).toBe(false);
    expect(
      sqlite.prepare("SELECT status,attempts FROM notification_outbox").get(),
    ).toMatchObject({ status: "failed", attempts: 2 });
    expect(
      sqlite.prepare("SELECT notification_status FROM leads").get()
        ?.notification_status,
    ).toBe("failed");
  });
  it("does not mark uncertain provider responses sent", async () => {
    const { env, sqlite, id } = await saved();
    expect(
      await notify(env, id, vi.fn().mockResolvedValue(Response.json({}))),
    ).toBe(false);
    expect(
      sqlite.prepare("SELECT status FROM notification_outbox").get()?.status,
    ).toBe("failed");
  });
  it("retains retryable work after D1 acknowledgment rollback", async () => {
    const { env, sqlite, id } = await saved();
    sqlite.exec(
      "CREATE TRIGGER fail_ack BEFORE UPDATE OF status ON notification_outbox WHEN NEW.status='sent' BEGIN SELECT RAISE(ABORT, 'ack failure'); END",
    );
    const send = vi
      .fn()
      .mockResolvedValue(Response.json({ messageId: "accepted" }));
    expect(await notify(env, id, send)).toBe(false);
    expect(
      sqlite.prepare("SELECT status FROM notification_outbox").get()?.status,
    ).toBe("failed");
    expect(
      sqlite.prepare("SELECT notification_status FROM leads").get()
        ?.notification_status,
    ).toBe("failed");
  });
  it("leaves the lease recoverable if all post-send bookkeeping fails", async () => {
    const { env, sqlite, id } = await saved();
    const batch = vi
      .spyOn(env.DB, "batch")
      .mockRejectedValue(new Error("database unavailable"));
    try {
      expect(
        await notify(
          env,
          id,
          vi.fn().mockResolvedValue(Response.json({ messageId: "accepted" })),
        ),
      ).toBe(false);
      expect(
        sqlite
          .prepare("SELECT status,lease_until FROM notification_outbox")
          .get(),
      ).toMatchObject({
        status: "processing",
        lease_until: expect.any(Number),
      });
      expect(
        sqlite.prepare("SELECT notification_status FROM leads").get()
          ?.notification_status,
      ).toBe("pending");
    } finally {
      batch.mockRestore();
    }
  });
  it("never sends if claiming fails", async () => {
    const { env, sqlite, id } = await saved();
    sqlite.exec("DROP TABLE notification_outbox");
    const send = vi.fn();
    expect(await notify(env, id, send)).toBe(false);
    expect(send).not.toHaveBeenCalled();
  });
});
