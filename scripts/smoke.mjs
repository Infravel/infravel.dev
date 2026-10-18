const base = process.env.STAGING_URL;
if (!base?.startsWith("https://"))
  throw new Error("Set STAGING_URL to the approved staging Worker URL.");
for (const path of [
  "/",
  "/services",
  "/contact",
  "/opspilot",
  "/insights",
  "/robots.txt",
  "/sitemap.xml",
]) {
  const response = await fetch(new URL(path, base), {
    signal: AbortSignal.timeout(15000),
  });
  if (response.status !== 200)
    throw new Error(`Smoke failed: ${path} (${response.status})`);
}
const privateRoute = await fetch(
  new URL("/api/internal/notifications/retry", base),
  { method: "POST" },
);
if (privateRoute.status !== 401)
  throw new Error("Notification retry route is not protected.");
console.log(
  "Staging routes and retry authorization passed. Manually verify real Turnstile/D1/email round trips.",
);
