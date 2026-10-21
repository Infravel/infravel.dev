import { getEnv } from "@/lib/env";
import {
  readJson,
  verifyOrigin,
  rateLimit,
  safeError,
  RequestError,
} from "@/lib/security";
import { services } from "@/config/services";
const names = [
  "service_view",
  "quote_start",
  "quote_submit_success",
  "booking_click",
  "contact_email_click",
  "opspilot_waitlist_success",
];
export async function POST(request: Request) {
  try {
    verifyOrigin(request);
    const body = (await readJson(request, 1000)) as {
      event?: unknown;
      service?: unknown;
    };
    if (
      !body ||
      !names.includes(String(body.event)) ||
      (body.service !== undefined &&
        !services.some((s) => s.slug === body.service))
    )
      throw new RequestError(400, "Invalid event.");
    const env = await getEnv();
    if (!env.CONVERSIONS) return new Response(null, { status: 204 });
    await rateLimit(request, env, "events", 120);
    env.CONVERSIONS.writeDataPoint({
      blobs: [String(body.event), String(body.service || "")],
      indexes: [String(body.event)],
    });
    return new Response(null, { status: 204 });
  } catch (e) {
    return safeError(e);
  }
}
