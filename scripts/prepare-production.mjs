import fs from "node:fs";
import { pathToFileURL } from "node:url";
import { parse } from "jsonc-parser";
export const generatedConfig = ".wrangler.production.generated.jsonc";
export function readConfig(path) {
  const errors = [];
  const config = parse(fs.readFileSync(path, "utf8"), errors, {
    allowTrailingComma: true,
  });
  if (errors.length) throw new Error("Invalid release configuration syntax.");
  return config;
}
export function validateTemplate(config) {
  const allowed = [
    "$schema",
    "name",
    "main",
    "compatibility_date",
    "compatibility_flags",
    "assets",
    "workers_dev",
    "preview_urls",
    "routes",
    "vars",
    "d1_databases",
  ];
  if (
    Object.keys(config).some((key) => !allowed.includes(key)) ||
    Object.keys(config.vars || {}).some((key) => key !== "DEPLOYMENT_ENV") ||
    config.compatibility_date !== "2026-10-01" ||
    JSON.stringify(config.compatibility_flags) !== '["nodejs_compat"]'
  )
    throw new Error(
      "Unexpected production template field or compatibility settings.",
    );
  if (
    config.name !== "infravel-production" ||
    config.main !== ".open-next/worker.js" ||
    config.vars?.DEPLOYMENT_ENV !== "production" ||
    config.workers_dev !== true ||
    config.preview_urls !== false ||
    !Array.isArray(config.routes) ||
    config.routes.length ||
    config.env ||
    config.triggers ||
    config.services ||
    config.account_id ||
    config.assets?.binding !== "ASSETS" ||
    config.assets?.directory !== ".open-next/assets" ||
    config.d1_databases?.length !== 1 ||
    config.d1_databases[0].binding !== "DB" ||
    config.d1_databases[0].database_name !== "infravel-production" ||
    config.d1_databases[0].migrations_dir !== "migrations"
  ) {
    throw new Error(
      "Production isolation or pre-cutover configuration check failed.",
    );
  }
}
export function productionConfig(template, staging, input) {
  validateTemplate(template);
  if (
    input.DEPLOYMENT_ENV !== "production" ||
    input.PRODUCTION_LAUNCH_PHASE !== "precutover"
  )
    throw new Error("Explicit production and pre-cutover mode required.");
  const id = input.PRODUCTION_D1_DATABASE_ID || "";
  const uuid =
    /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
  if (
    !uuid.test(id) ||
    id === "00000000-0000-0000-0000-000000000000" ||
    (staging.d1_databases || []).some(
      (db) => db.database_id?.toLowerCase() === id.toLowerCase(),
    )
  )
    throw new Error("A verified, separate production D1 ID is required.");
  let preview;
  try {
    preview = new URL(input.PRODUCTION_PREVIEW_URL);
  } catch {
    /* Fail closed below. */
  }
  if (
    !preview ||
    preview.protocol !== "https:" ||
    preview.username ||
    preview.password ||
    preview.port ||
    preview.search ||
    preview.hash ||
    preview.pathname !== "/" ||
    !/^infravel-production\.[a-z0-9-]+\.workers\.dev$/.test(preview.hostname)
  )
    throw new Error(
      "Expected the owner-confirmed production Worker preview origin.",
    );
  const key = input.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";
  if (!key || /^(1x|2x|3x)/i.test(key) || !/^[a-z0-9_-]{10,100}$/i.test(key))
    throw new Error(
      "A real production Turnstile site key is required, not a test key.",
    );
  if (
    !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(
      input.NEXT_PUBLIC_CONTACT_EMAIL || "",
    )
  )
    throw new Error("An owner-verified public contact email is required.");
  const config = structuredClone(template);
  if (input.PRODUCTION_ACCOUNT_ID) {
    if (!/^[a-f0-9]{32}$/i.test(input.PRODUCTION_ACCOUNT_ID))
      throw new Error("Invalid production account ID.");
    config.account_id = input.PRODUCTION_ACCOUNT_ID;
  }
  config.d1_databases[0].database_id = id;
  config.vars.TURNSTILE_HOSTNAMES = `infravel.dev,www.infravel.dev,${preview.hostname}`;
  return config;
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    const template = readConfig("wrangler.production.template.jsonc");
    if (process.argv.includes("--check-template")) {
      validateTemplate(template);
      if (template.d1_databases[0].database_id !== "")
        throw new Error("Template must not contain a resource ID.");
      console.log(
        "Production template isolation verified; no resources created or configuration generated.",
      );
    } else {
      const config = productionConfig(
        template,
        readConfig("wrangler.jsonc"),
        process.env,
      );
      fs.writeFileSync(
        generatedConfig,
        JSON.stringify(config, null, 2) + "\n",
        { mode: 0o600 },
      );
      console.log(
        "Local pre-cutover production config prepared. No remote action performed.",
      );
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
