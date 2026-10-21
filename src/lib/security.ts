import type { Env } from "./env";
export class RequestError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function readJson(
  request: Request,
  limit = 16000,
): Promise<unknown> {
  if (
    request.headers
      .get("content-type")
      ?.toLowerCase()
      .split(";", 1)[0]
      .trim() !== "application/json"
  )
    throw new RequestError(415, "Use a JSON request.");
  if (Number(request.headers.get("content-length")) > limit)
    throw new RequestError(413, "Request is too large.");
  const reader = request.body?.getReader();
  if (!reader) throw new RequestError(400, "Request body is required.");
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > limit) {
        await reader.cancel();
        throw new RequestError(413, "Request is too large.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const all = new Uint8Array(size);
  let offset = 0;
  for (const c of chunks) {
    all.set(c, offset);
    offset += c.length;
  }
  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(all));
  } catch {
    throw new RequestError(400, "Malformed JSON request.");
  }
}
export function verifyOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin)
    throw new RequestError(403, "Request origin is not allowed.");
}
export async function rateLimit(
  request: Request,
  env: Env,
  kind: string,
  limit = 5,
) {
  if (!env.DB || !env.RATE_LIMIT_SALT)
    throw new RequestError(503, "Submissions are temporarily unavailable.");
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${env.RATE_LIMIT_SALT}:${kind}:${ip}`),
  );
  const key = Array.from(new Uint8Array(digest), (x) =>
    x.toString(16).padStart(2, "0"),
  ).join("");
  const now = Math.floor(Date.now() / 1000);
  const expires = now + 600;
  const row = await env.DB.prepare(
    "INSERT INTO rate_limits (key,count,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN expires_at<=? THEN 1 ELSE count+1 END, expires_at=CASE WHEN expires_at<=? THEN ? ELSE expires_at END RETURNING count",
  )
    .bind(key, expires, now, now, expires)
    .first<{ count: number }>();
  if (!row || row.count > limit)
    throw new RequestError(
      429,
      "Too many attempts. Please try again in ten minutes.",
    );
}
export async function verifyTurnstile(
  token: string,
  request: Request,
  env: Env,
  action: string,
  fetcher: typeof fetch = fetch,
) {
  if (!env.TURNSTILE_SECRET_KEY || !env.TURNSTILE_HOSTNAMES)
    throw new RequestError(
      503,
      "Security verification is temporarily unavailable.",
    );
  const body = new URLSearchParams({
    secret: env.TURNSTILE_SECRET_KEY,
    response: token,
  });
  const ip = request.headers.get("cf-connecting-ip");
  if (ip) body.set("remoteip", ip);
  let result: { success: boolean; hostname?: string; action?: string };
  try {
    const response = await fetcher(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body, signal: AbortSignal.timeout(8000) },
    );
    if (!response.ok) throw Error();
    result = await response.json();
  } catch {
    throw new RequestError(
      503,
      "Security verification is temporarily unavailable.",
    );
  }
  if (
    !result.success ||
    !result.hostname ||
    !env.TURNSTILE_HOSTNAMES.split(",")
      .map((x) => x.trim())
      .includes(result.hostname) ||
    result.action !== action
  )
    throw new RequestError(400, "Security check failed. Please try again.");
}
export function safeError(error: unknown) {
  const known = error instanceof RequestError;
  return Response.json(
    {
      ok: false,
      message: known
        ? error.message
        : "We could not save your request. Please try again later.",
    },
    {
      status: known ? error.status : 503,
      headers: {
        "Cache-Control": "no-store",
        ...(known && error.status === 429 ? { "Retry-After": "600" } : {}),
      },
    },
  );
}
