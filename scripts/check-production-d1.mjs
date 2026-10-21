import assert from "node:assert/strict";
import fs from "node:fs";
import { assertStagingIsolation } from "./staging-isolation.mjs";
import { readConfig } from "./prepare-production.mjs";

// Local assertions only: no Wrangler invocation, credentials or remote requests.
const config = readConfig("wrangler.production.d1.jsonc");
const staging = readConfig("wrangler.jsonc");
assert.deepEqual(config, {
  $schema: "node_modules/wrangler/config-schema.json",
  name: "infravel-production",
  account_id: "f6d4cc93a61d7012130cfbd39b3a84fd",
  compatibility_date: "2026-10-01",
  workers_dev: false,
  preview_urls: false,
  routes: [],
  d1_databases: [
    {
      binding: "DB",
      database_name: "infravel-production",
      database_id: "ad4400ff-0e66-45e5-be77-f182cf4cb449",
      migrations_dir: "migrations",
    },
  ],
});
assertStagingIsolation(staging);
const db = staging.d1_databases.find((entry) => entry.binding === "DB");
assert.equal(db.database_name, "infravel-staging");
assert.equal(db.database_id, "d7229cbc-7449-4448-ab82-e814728b66d4");
assert.notEqual(db.database_id, config.d1_databases[0].database_id);
assert.match(fs.readFileSync("src/lib/env.ts", "utf8"), /DB:\s*D1Database/);
for (const file of ["0001_initial.sql", "0002_waitlist_notifications.sql"]) {
  assert.ok(fs.existsSync(`migrations/${file}`));
}
console.log(
  "Production D1 account, UUID isolation, application DB binding and migration paths verified locally.",
);
