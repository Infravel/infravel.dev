import { pathToFileURL } from "node:url";

const stagingOrigin = "https://infravel-staging.shkhrabdullah.workers.dev";
const readinessMs = 90_000;
const intervalMs = 5_000;
const requestMs = 10_000;

function approvedBase(value) {
  try {
    const url = new URL(value);
    if (
      url.origin === stagingOrigin &&
      !url.username &&
      !url.password &&
      url.pathname === "/" &&
      !url.search &&
      !url.hash
    )
      return url;
  } catch {
    /* Never echo untrusted configuration. */
  }
  throw new Error("Set STAGING_URL to the approved staging Worker origin.");
}

function category(error) {
  if (error?.name === "TimeoutError" || error?.name === "AbortError")
    return "request-timeout";
  return "network-error";
}

export async function runSmoke(
  value,
  {
    fetcher = fetch,
    now = () => performance.now(),
    sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    log = console.log,
  } = {},
) {
  const base = approvedBase(value);
  async function status(path, method = "GET", timeout = requestMs) {
    const response = await fetcher(new URL(path, base), {
      method,
      redirect: "manual",
      signal: AbortSignal.timeout(Math.max(1, Math.ceil(timeout))),
    });
    // Do not read or log response bodies, including provider/runtime errors.
    await response.body?.cancel();
    return response.status;
  }
  const started = now();
  let ready = false;
  let attempt = 0;
  while (now() - started < readinessMs) {
    attempt++;
    let result;
    try {
      const code = await status(
        "/",
        "GET",
        Math.min(requestMs, readinessMs - (now() - started)),
      );
      result = `HTTP ${code}`;
      ready = code === 200;
    } catch (error) {
      result = category(error);
    }
    const elapsed = now() - started;
    log(
      `Readiness attempt ${attempt}: ${Math.floor(elapsed / 1000)}s elapsed, ${result}.`,
    );
    if (ready) break;
    const remaining = readinessMs - elapsed;
    if (remaining <= 0) break;
    await sleep(Math.min(intervalMs, remaining));
  }
  if (!ready)
    throw new Error("Smoke failed: homepage not ready within 90 seconds.");

  for (const path of [
    "/",
    "/services",
    "/contact",
    "/opspilot",
    "/insights",
    "/robots.txt",
    "/sitemap.xml",
  ]) {
    let code;
    try {
      code = await status(path);
    } catch (error) {
      throw new Error(`Smoke failed: ${path} (${category(error)})`);
    }
    log(`Smoke check: ${path} (HTTP ${code}).`);
    if (code !== 200) throw new Error(`Smoke failed: ${path} (${code})`);
  }
  let privateStatus;
  try {
    privateStatus = await status("/api/internal/notifications/retry", "POST");
  } catch (error) {
    throw new Error(`Smoke failed: retry authorization (${category(error)})`);
  }
  log(`Smoke check: retry authorization (HTTP ${privateStatus}).`);
  if (privateStatus !== 401)
    throw new Error("Notification retry route is not protected.");
  log(
    "Staging routes and retry authorization passed. Manually verify real Turnstile/D1/email round trips.",
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  runSmoke(process.env.STAGING_URL).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
