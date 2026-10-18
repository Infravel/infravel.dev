import type { Env } from "./env";
type Outbox = { id: string; lead_id: string; attempts: number };
const seconds = () => Math.floor(Date.now() / 1000);
// Keep the existing 23-hour operational review window; this is not deduplication.
const reviewWindow = 23 * 3600;
function mailbox(value: string) {
  const match = value.trim().match(/^(.*?)\s*<([^<>]+)>$/);
  return match
    ? { name: match[1].trim(), email: match[2].trim() }
    : { email: value.trim() };
}
export async function notify(
  env: Env,
  id: string,
  fetcher: typeof fetch = fetch,
): Promise<boolean> {
  if (!env.BREVO_API_KEY || !env.EMAIL_FROM || !env.LEAD_NOTIFICATION_TO)
    return false;
  let row: Outbox | null;
  try {
    const now = seconds();
    row = await env.DB.prepare(
      "UPDATE notification_outbox SET status='processing',lease_until=?,attempts=attempts+1 WHERE id=? AND next_attempt_at<=? AND (status IN ('pending','failed') OR (status='processing' AND lease_until<=?)) AND created_at>? RETURNING id,lead_id,attempts",
    )
      .bind(now + 90, id, now, now, now - reviewWindow)
      .first<Outbox>();
  } catch {
    return false; // A failed claim must never reach the provider.
  }
  if (!row) return false;
  let retryAfter = 0;
  try {
    const lead = await env.DB.prepare("SELECT email FROM leads WHERE id=?")
      .bind(row.lead_id)
      .first<{ email: string }>();
    if (!lead) throw new Error("Missing lead");
    // Recheck ownership after the read, before crossing the provider boundary.
    const owned = await env.DB.prepare(
      "UPDATE notification_outbox SET lease_until=? WHERE id=? AND status='processing' AND attempts=? AND lease_until>? RETURNING id",
    )
      .bind(seconds() + 90, id, row.attempts, seconds())
      .first();
    if (!owned) return false;
    const response = await fetcher("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": env.BREVO_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: mailbox(env.EMAIL_FROM),
        to: [mailbox(env.LEAD_NOTIFICATION_TO)],
        replyTo: { email: lead.email },
        subject: "New Infravel quote request",
        textContent: `Lead ${row.lead_id}\nReview the request in your private D1 workflow.`,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      if (response.status === 429) {
        const value = response.headers.get("Retry-After");
        const delay = value && /^\d+$/.test(value) ? Number(value) : 0;
        const date = value ? Date.parse(value) / 1000 : 0;
        retryAfter = Math.min(
          86400,
          Math.max(delay, Number.isFinite(date) ? date - seconds() : 0, 0),
        );
      }
      throw new Error("Provider rejected notification");
    }
    const result = (await response.json()) as { messageId?: unknown };
    if (typeof result.messageId !== "string" || !result.messageId.trim())
      throw new Error("Uncertain provider acceptance");
    // D1 batch is atomic. Fence BOTH updates with the claim generation and expiry.
    const acknowledgedAt = seconds();
    const results = await env.DB.batch([
      env.DB.prepare(
        "UPDATE leads SET notification_status='sent' WHERE id=? AND EXISTS (SELECT 1 FROM notification_outbox WHERE id=? AND status='processing' AND attempts=? AND lease_until>?)",
      ).bind(row.lead_id, id, row.attempts, acknowledgedAt),
      env.DB.prepare(
        "UPDATE notification_outbox SET status='sent',sent_at=?,lease_until=NULL WHERE id=? AND status='processing' AND attempts=? AND lease_until>?",
      ).bind(acknowledgedAt, id, row.attempts, acknowledgedAt),
    ]);
    return results.every(
      (result) => result.success && result.meta.changes === 1,
    );
  } catch {
    // Acceptance may be uncertain (timeout or send/ack gap). Never report sent.
    // If bookkeeping also fails, leave the lease for recovery after expiry.
    try {
      const failedAt = seconds();
      const next =
        failedAt +
        Math.max(
          retryAfter,
          Math.min(3600, 60 * 2 ** Math.min(row.attempts, 6)),
        );
      await env.DB.batch([
        env.DB.prepare(
          "UPDATE leads SET notification_status='failed' WHERE id=? AND EXISTS (SELECT 1 FROM notification_outbox WHERE id=? AND status='processing' AND attempts=? AND lease_until>?)",
        ).bind(row.lead_id, id, row.attempts, failedAt),
        env.DB.prepare(
          "UPDATE notification_outbox SET status='failed',next_attempt_at=?,lease_until=NULL WHERE id=? AND status='processing' AND attempts=? AND lease_until>?",
        ).bind(next, id, row.attempts, failedAt),
      ]);
    } catch {
      /* Retain persisted work without logging credentials or customer data. */
    }
    return false;
  }
}
export async function retryNotifications(env: Env) {
  const now = seconds();
  const rows = await env.DB.prepare(
    "SELECT id FROM notification_outbox WHERE next_attempt_at<=? AND created_at>? AND (status IN ('pending','failed') OR (status='processing' AND lease_until<=?)) ORDER BY created_at LIMIT 20",
  )
    .bind(now, now - reviewWindow, now)
    .all<{ id: string }>();
  let sent = 0;
  for (const row of rows.results) {
    if (await notify(env, row.id)) sent++;
  }
  return { checked: rows.results.length, sent };
}
