import { pathToFileURL } from "node:url";
export function productionOrigin(value, mode = "preview") {
  if (!["preview", "live"].includes(mode))
    throw new Error("Invalid smoke mode.");
  let url;
  try {
    url = new URL(value);
  } catch {
    /* Fail closed below. */
  }
  const host =
    mode === "live"
      ? url?.hostname === "infravel.dev"
      : /^infravel-production\.[a-z0-9-]+\.workers\.dev$/.test(
          url?.hostname || "",
        );
  if (
    !url ||
    url.protocol !== "https:" ||
    !host ||
    url.port ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw new Error("Unapproved production smoke origin.");
  return url;
}
export async function smokeProduction(
  value,
  { fetcher = fetch, mode = "preview", log = console.log } = {},
) {
  const base = productionOrigin(value, mode);
  const check = async (path, expected, { method = "GET", inspect } = {}) => {
    const response = await fetcher(new URL(path, base), {
      method,
      redirect: "manual",
      signal: AbortSignal.timeout(10_000),
    });
    try {
      if (response.status !== expected)
        throw new Error(`Production smoke failed: ${method} ${path} status.`);
      if (inspect) await inspect(response);
      log(`Production smoke: ${method} ${path} passed.`);
    } finally {
      await response.body?.cancel().catch(() => {});
    }
  };
  await check("/", 200, {
    inspect: async (response) => {
      for (const name of [
        "content-security-policy",
        "strict-transport-security",
        "x-content-type-options",
        "referrer-policy",
      ])
        if (!response.headers.get(name))
          throw new Error("Production security header missing.");
      const noindex = /noindex/i.test(
        response.headers.get("x-robots-tag") || "",
      );
      if ((mode === "live" && noindex) || (mode === "preview" && !noindex))
        throw new Error("Incorrect production/preview indexing policy.");
      const html = await response.text();
      if (
        (mode === "live" && /name="robots"[^>]*noindex/i.test(html)) ||
        !html.includes("infravel-lockup.webp") ||
        !html.includes("opengraph-image.jpg")
      )
        throw new Error("Production metadata or branding smoke failed.");
    },
  });
  for (const path of [
    "/services",
    "/about",
    "/work",
    "/contact",
    "/opspilot",
    "/insights",
    "/privacy",
    "/terms",
    "/icon.png",
    "/apple-icon.png",
    "/opengraph-image.jpg",
    "/sitemap.xml",
  ])
    await check(path, 200);
  await check("/robots.txt", 200, {
    inspect: async (response) => {
      const text = await response.text();
      if (!/^Allow:\s*\/$/im.test(text) || /^Disallow:\s*\/$/im.test(text))
        throw new Error("Production robots policy failed.");
    },
  });
  await check("/does-not-exist", 404);
  await check("/services/cicd-deployment-automation", 308, {
    inspect: (response) => {
      if (
        !response.headers
          .get("location")
          ?.endsWith("/services/cicd-pipeline-setup")
      )
        throw new Error("Legacy redirect failed.");
    },
  });
  // Unauthorized request only: never run notification retries or submit a lead.
  await check("/api/internal/notifications/retry", 401, { method: "POST" });
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  smokeProduction(process.env.PRODUCTION_PREVIEW_URL, {
    mode: process.env.PRODUCTION_SMOKE_MODE || "preview",
  }).catch(() => {
    console.error(
      "Production smoke failed. Raw response content and configuration are withheld; do not cut over.",
    );
    process.exitCode = 1;
  });
}
