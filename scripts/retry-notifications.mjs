const url = process.env.NOTIFICATION_RETRY_URL;
if (!url?.startsWith("https://") || !process.env.RETRY_SECRET)
  throw new Error("Set HTTPS NOTIFICATION_RETRY_URL and RETRY_SECRET.");
const response = await fetch(url, {
  method: "POST",
  headers: { Authorization: `Bearer ${process.env.RETRY_SECRET}` },
  signal: AbortSignal.timeout(240000),
});
if (!response.ok) throw new Error(`Retry failed: ${response.status}`);
console.log(await response.json());
