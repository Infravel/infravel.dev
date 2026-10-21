import fs from "node:fs";
try {
  const entries = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
  const names = new Set(entries.map((entry) => entry.name));
  const required = [
    "TURNSTILE_SECRET_KEY",
    "RATE_LIMIT_SALT",
    "BREVO_API_KEY",
    "EMAIL_FROM",
    "LEAD_NOTIFICATION_TO",
    "RETRY_SECRET",
  ];
  if (required.some((name) => !names.has(name)))
    throw new Error(
      "Required production runtime secret names are missing. Check the configuration checklist; no values were inspected.",
    );
  console.log(
    "Required runtime secret names present; validity and sender authorization still require live checks.",
  );
} catch {
  console.error(
    "Production runtime secret-name validation failed; no values were printed.",
  );
  process.exitCode = 1;
}
