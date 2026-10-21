import { pathToFileURL } from "node:url";

export async function sendNotificationRetry(value, secret, fetcher = fetch) {
  let url;
  try {
    url = new URL(value);
  } catch {
    /* Fail closed below. */
  }
  const origins = [
    "https://infravel-staging.shkhrabdullah.workers.dev",
    "https://infravel.dev",
  ];
  if (
    !url ||
    !origins.includes(url.origin) ||
    url.username ||
    url.password ||
    url.pathname !== "/api/internal/notifications/retry" ||
    url.search ||
    url.hash ||
    !secret
  )
    throw new Error(
      "Configure an approved notification retry endpoint and secret.",
    );
  const response = await fetcher(url, {
    method: "POST",
    redirect: "error",
    headers: { Authorization: `Bearer ${secret}` },
    signal: AbortSignal.timeout(240000),
  });
  if (!response.ok) throw new Error(`Retry failed: HTTP ${response.status}`);
  const result = await response.json();
  if (
    !Number.isInteger(result?.checked) ||
    !Number.isInteger(result?.sent) ||
    result.checked < 0 ||
    result.checked > 20 ||
    result.sent < 0 ||
    result.sent > result.checked
  )
    throw new Error("Unexpected notification retry summary.");
  return { checked: result.checked, sent: result.sent };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  sendNotificationRetry(
    process.env.NOTIFICATION_RETRY_URL,
    process.env.RETRY_SECRET,
  )
    .then((result) => console.log(result))
    .catch(() => {
      console.error(
        "Notification retry failed; verify the approved endpoint, authorization, and service health.",
      );
      process.exitCode = 1;
    });
}
