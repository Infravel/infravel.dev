import { afterEach, describe, expect, it, vi } from "vitest";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { database } from "../helpers/db";
import { submission } from "@/lib/submissions";
import { notify, retryNotifications } from "@/lib/notifications";
import type { Env } from "@/lib/env";
import type { NotificationKind } from "@/lib/notification-template";

afterEach(() => vi.restoreAllMocks());

function setup() {
  const { db, sqlite } = database();
  const env = {
    DB: db,
    BREVO_API_KEY: "test-key-not-real",
    EMAIL_FROM: "Infravel <hello@infravel.dev>",
    LEAD_NOTIFICATION_TO: "business@example.com",
  } as Env;
  const deps = {
    rateLimit: vi.fn().mockResolvedValue(undefined),
    verifyTurnstile: vi.fn().mockResolvedValue(undefined),
    notify: vi.fn().mockResolvedValue(false),
  };
  return { env, sqlite, deps };
}
function request(body: unknown) {
  return new Request("https://infravel.dev/api/quote", {
    method: "POST",
    headers: {
      Origin: "https://infravel.dev",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}
const customer = {
  name: "Fictional Customer",
  email: "customer@example.com",
  company: "Example & Co <team>",
  service: "cicd-pipeline-setup",
  requirements:
    "Our full project description includes a staging environment.\nPreserve this final line.",
  budget: "$2,500+",
  timeline: "Next month",
  interest: "Linux, Docker & Kubernetes",
  consent: true,
  attribution: { utm_source: "partner", utm_campaign: "cloud" },
  turnstileToken: "never-email-this-token",
};

describe.each(["quote", "waitlist"] as const)(
  "%s notification persistence",
  (kind: NotificationKind) => {
    const outbox =
      kind === "quote" ? "notification_outbox" : "waitlist_notification_outbox";
    it("reconstructs complete content on retry and sends only to the configured recipient", async () => {
      const { env, sqlite, deps } = setup();
      expect(
        (await submission(request(customer), env, kind, deps)).status,
      ).toBe(200);
      const id = String(sqlite.prepare(`SELECT id FROM ${outbox}`).get()?.id);
      const send = vi
        .spyOn(globalThis, "fetch")
        .mockResolvedValueOnce(new Response(null, { status: 503 }))
        .mockImplementation(async () =>
          Response.json({ messageId: "mocked-acceptance" }),
        );
      expect(await notify(env, id, fetch, kind)).toBe(false);
      expect(
        sqlite.prepare(`SELECT status,attempts FROM ${outbox}`).get(),
      ).toMatchObject({ status: "failed", attempts: 1 });
      sqlite.exec(`UPDATE ${outbox} SET next_attempt_at=unixepoch()-1`);
      expect(await retryNotifications(env)).toEqual({ checked: 1, sent: 1 });
      expect(await retryNotifications(env)).toEqual({ checked: 0, sent: 0 });
      expect(await notify(env, id, fetch, kind)).toBe(false);
      expect(send).toHaveBeenCalledTimes(2);
      const payloads = send.mock.calls.map(([, init]) =>
        JSON.parse(String(init?.body)),
      );
      expect(payloads[0]).toEqual(payloads[1]);
      const payload = payloads[1];
      expect(payload.sender).toEqual({
        name: "Infravel",
        email: "hello@infravel.dev",
      });
      expect(payload.to).toEqual([{ email: "business@example.com" }]);
      expect(payload.replyTo).toEqual({ email: customer.email });
      expect(payload).not.toHaveProperty("cc");
      expect(payload).not.toHaveProperty("bcc");
      for (const value of [
        customer.name,
        customer.email,
        customer.company,
        "partner",
        "cloud",
      ])
        expect(payload.textContent).toContain(value);
      expect(payload.htmlContent).toContain("Example &amp; Co &lt;team&gt;");
      if (kind === "quote") {
        for (const value of [
          customer.requirements,
          customer.budget,
          customer.timeline,
          "CI/CD Pipeline Setup",
        ])
          expect(payload.textContent).toContain(value);
        expect(payload.textContent).not.toContain(customer.interest);
      } else {
        expect(payload.textContent).toContain(customer.interest);
        expect(payload.textContent).toContain("Consented");
        expect(payload.textContent).not.toContain(customer.requirements);
        expect(payload.textContent).not.toContain("Budget");
      }
      expect(JSON.stringify(payload)).not.toContain(customer.turnstileToken);
      expect(JSON.stringify(payload)).not.toContain(env.BREVO_API_KEY);
    });

    it("fails closed for stored mailbox/header injection without sending or logging PII", async () => {
      const { env, sqlite, deps } = setup();
      await submission(request(customer), env, kind, deps);
      sqlite
        .prepare(
          `UPDATE ${kind === "quote" ? "leads" : "opspilot_waitlist"} SET email=?`,
        )
        .run("customer@example.com\r\nBcc: attacker@example.com");
      const id = String(sqlite.prepare(`SELECT id FROM ${outbox}`).get()?.id);
      const send = vi.fn();
      const log = vi.spyOn(console, "log");
      const error = vi.spyOn(console, "error");
      expect(await notify(env, id, send, kind)).toBe(false);
      expect(send).not.toHaveBeenCalled();
      expect(log).not.toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();
    });
  },
);

describe("waitlist outbox safety", () => {
  it("adds the waitlist outbox without changing existing data or enqueueing old registrations", () => {
    const sqlite = new DatabaseSync(":memory:");
    try {
      sqlite.exec(readFileSync("migrations/0001_initial.sql", "utf8"));
      sqlite
        .prepare(
          "INSERT INTO leads (id,name,email,service,requirements,notification_status) VALUES (?,?,?,?,?,?)",
        )
        .run(
          "existing-lead",
          customer.name,
          customer.email,
          customer.service,
          customer.requirements,
          "sent",
        );
      sqlite.exec(
        "INSERT INTO notification_outbox (id,lead_id,status,attempts,sent_at) VALUES ('existing-outbox','existing-lead','sent',2,123)",
      );
      sqlite
        .prepare(
          "INSERT INTO opspilot_waitlist (id,email,consent) VALUES (?,?,1)",
        )
        .run("existing-registration", customer.email);
      const before = ["leads", "notification_outbox", "opspilot_waitlist"].map(
        (table) => sqlite.prepare(`SELECT * FROM ${table}`).all(),
      );
      sqlite.exec(
        readFileSync("migrations/0002_waitlist_notifications.sql", "utf8"),
      );
      expect(
        ["leads", "notification_outbox", "opspilot_waitlist"].map((table) =>
          sqlite.prepare(`SELECT * FROM ${table}`).all(),
        ),
      ).toEqual(before);
      expect(
        sqlite
          .prepare("SELECT count(*) as n FROM waitlist_notification_outbox")
          .get()?.n,
      ).toBe(0);
      expect(() =>
        sqlite.exec(
          "INSERT INTO waitlist_notification_outbox (id,waitlist_id) VALUES ('orphan','missing')",
        ),
      ).toThrow();
    } finally {
      sqlite.close();
    }
  });

  it.each(["EMAIL_FROM", "LEAD_NOTIFICATION_TO"] as const)(
    "rejects multiple mailboxes in configured %s",
    async (key) => {
      const { env, sqlite, deps } = setup();
      await submission(request(customer), env, "waitlist", deps);
      env[key] = "business@example.com,attacker@example.com";
      const id = String(
        sqlite.prepare("SELECT id FROM waitlist_notification_outbox").get()?.id,
      );
      const send = vi.fn();
      expect(await notify(env, id, send, "waitlist")).toBe(false);
      expect(send).not.toHaveBeenCalled();
    },
  );

  it("rolls back registration when enqueueing fails", async () => {
    const { env, sqlite, deps } = setup();
    sqlite.exec("DROP TABLE waitlist_notification_outbox");
    expect(
      (await submission(request(customer), env, "waitlist", deps)).status,
    ).toBe(503);
    expect(
      sqlite.prepare("SELECT count(*) as n FROM opspilot_waitlist").get()?.n,
    ).toBe(0);
    expect(deps.notify).not.toHaveBeenCalled();
  });

  it("retains the registration and durable retry when immediate notification throws", async () => {
    const { env, sqlite, deps } = setup();
    deps.notify.mockRejectedValue(new Error("provider down"));
    expect(
      (await submission(request(customer), env, "waitlist", deps)).status,
    ).toBe(200);
    expect(
      sqlite.prepare("SELECT count(*) as n FROM opspilot_waitlist").get()?.n,
    ).toBe(1);
    expect(
      sqlite.prepare("SELECT status FROM waitlist_notification_outbox").get()
        ?.status,
    ).toBe("pending");
  });

  it("fences concurrent waitlist attempts and recovers an expired lease", async () => {
    const { env, sqlite, deps } = setup();
    await submission(request(customer), env, "waitlist", deps);
    const id = String(
      sqlite.prepare("SELECT id FROM waitlist_notification_outbox").get()?.id,
    );
    let release!: (value: Response) => void;
    const send = vi.fn<typeof fetch>().mockImplementation(
      () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    );
    const first = notify(env, id, send, "waitlist");
    await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(1));
    expect(await notify(env, id, send, "waitlist")).toBe(false);
    sqlite.exec(
      "UPDATE waitlist_notification_outbox SET lease_until=unixepoch()-1",
    );
    expect(
      await notify(
        env,
        id,
        vi.fn().mockResolvedValue(Response.json({ messageId: "new-lease" })),
        "waitlist",
      ),
    ).toBe(true);
    release(Response.json({ messageId: "stale" }));
    expect(await first).toBe(false);
    expect(
      sqlite
        .prepare("SELECT status,attempts FROM waitlist_notification_outbox")
        .get(),
    ).toMatchObject({ status: "sent", attempts: 2 });
  });
});
