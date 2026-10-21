import type { Env } from "./env";
import { quoteSchema, waitlistSchema } from "./validation";
import {
  readJson,
  verifyOrigin,
  rateLimit,
  verifyTurnstile,
  RequestError,
  safeError,
} from "./security";
import { notify } from "./notifications";
type Dependencies = {
  rateLimit: typeof rateLimit;
  verifyTurnstile: typeof verifyTurnstile;
  notify: typeof notify;
};
const defaults: Dependencies = { rateLimit, verifyTurnstile, notify };
export async function submission(
  request: Request,
  env: Env,
  kind: "quote" | "waitlist",
  deps: Dependencies = defaults,
) {
  try {
    verifyOrigin(request);
    const raw = await readJson(request);
    await deps.rateLimit(request, env, kind);
    if (raw && typeof raw === "object" && "website" in raw && raw.website)
      throw new RequestError(400, "Request could not be accepted.");
    const parsed = (kind === "quote" ? quoteSchema : waitlistSchema).safeParse(
      raw,
    );
    if (!parsed.success)
      return Response.json(
        {
          ok: false,
          message: "Check the highlighted fields.",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    const data = parsed.data;
    await deps.verifyTurnstile(data.turnstileToken, request, env, kind);
    const id = crypto.randomUUID();
    if (kind === "quote") {
      const q = quoteSchema.parse(data);
      const outbox = crypto.randomUUID();
      await env.DB.batch([
        env.DB.prepare(
          "INSERT INTO leads (id,name,email,company,service,requirements,timeline,budget,attribution) VALUES (?,?,?,?,?,?,?,?,?)",
        ).bind(
          id,
          q.name,
          q.email,
          q.company,
          q.service,
          q.requirements,
          q.timeline,
          q.budget,
          JSON.stringify(q.attribution),
        ),
        env.DB.prepare(
          "INSERT INTO notification_outbox (id,lead_id) VALUES (?,?)",
        ).bind(outbox, id),
      ]);
      // Persistence succeeds independently of notification provider or retry bookkeeping.
      try {
        await deps.notify(env, outbox);
      } catch {
        /* The persisted outbox remains available to retry. */
      }
    } else {
      const w = waitlistSchema.parse(data);
      // Do not disclose membership or overwrite an existing person's consent/profile.
      const outbox = crypto.randomUUID();
      const results = await env.DB.batch([
        env.DB.prepare(
          "INSERT INTO opspilot_waitlist (id,email,name,company,interest,consent,attribution) VALUES (?,?,?,?,?,?,?) ON CONFLICT(email) DO NOTHING",
        ).bind(
          id,
          w.email,
          w.name,
          w.company,
          w.interest,
          w.consent ? 1 : 0,
          JSON.stringify(w.attribution),
        ),
        // Only the newly inserted registration can enqueue work. Duplicates
        // retain the original profile/consent and never create another email.
        env.DB.prepare(
          "INSERT INTO waitlist_notification_outbox (id,waitlist_id) SELECT ?,id FROM opspilot_waitlist WHERE id=?",
        ).bind(outbox, id),
      ]);
      if (results[1].meta.changes === 1) {
        try {
          await deps.notify(env, outbox, undefined, "waitlist");
        } catch {
          /* The persisted outbox remains available to retry. */
        }
      }
    }
    return Response.json(
      {
        ok: true,
        message:
          kind === "quote"
            ? "Your request has been saved. Thank you — Infravel will review your project and follow up by email."
            : "Thank you. Your early-access interest has been recorded. Existing registrations are kept safely on the list.",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return safeError(error);
  }
}
