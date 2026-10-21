import fs from "node:fs";
import {
  generatedConfig,
  productionConfig,
  readConfig,
} from "./prepare-production.mjs";
try {
  const expected = productionConfig(
    readConfig("wrangler.production.template.jsonc"),
    readConfig("wrangler.jsonc"),
    process.env,
  );
  const actual = readConfig(generatedConfig);
  if (JSON.stringify(actual) !== JSON.stringify(expected))
    throw new Error(
      "Generated production config differs from validated inputs.",
    );
  for (const file of ["0001_initial.sql", "0002_waitlist_notifications.sql"]) {
    if (!fs.existsSync(`migrations/${file}`))
      throw new Error("Required migration missing.");
  }
  console.log(
    "Production config verified against explicit owner inputs; no staging binding or live route.",
  );
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
