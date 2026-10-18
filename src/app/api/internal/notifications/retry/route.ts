import { getEnv } from "@/lib/env";
import { retryNotifications } from "@/lib/notifications";
import { safeError, RequestError } from "@/lib/security";
export async function POST(request: Request) {
  try {
    const env = await getEnv();
    const provided = request.headers.get("authorization") || "";
    const expected = `Bearer ${env.RETRY_SECRET}`;
    const a = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(provided),
    );
    const b = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(expected),
    );
    const aa = new Uint8Array(a),
      bb = new Uint8Array(b);
    let mismatch = 0;
    for (let i = 0; i < aa.length; i++) mismatch |= aa[i] ^ bb[i];
    if (!env.RETRY_SECRET || mismatch)
      throw new RequestError(401, "Unauthorized.");
    return Response.json(await retryNotifications(env), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return safeError(e);
  }
}
