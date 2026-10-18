import fs from "node:fs";
import { parse } from "jsonc-parser";

const config = parse(fs.readFileSync("wrangler.jsonc", "utf8"));

if (
  !process.env.STAGING_URL?.startsWith("https://") ||
  !process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
  config.name !== "infravel-staging" ||
  config.vars?.DEPLOYMENT_ENV !== "staging" ||
  config.d1_databases?.[0]?.database_name !== "infravel-staging" ||
  !config.d1_databases?.[0]?.database_id ||
  config.d1_databases[0].database_id.startsWith("00000000")
) {
  throw new Error("Invalid staging Worker, URL, Turnstile, or D1 configuration.");
}

if (
  new URL(process.env.STAGING_URL).hostname !==
  "infravel-staging.shkhrabdullah.workers.dev"
) {
  throw new Error("Unexpected staging hostname.");
}

console.log("Staging configuration verified.");
