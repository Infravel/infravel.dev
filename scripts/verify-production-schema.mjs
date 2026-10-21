import fs from "node:fs";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";

// Compare metadata with the reviewed migrations in an ephemeral local database.
// stdin is Wrangler JSON containing sqlite_master metadata, never customer rows.
const response = JSON.parse(fs.readFileSync(0, "utf8"));
assert.equal(response.length, 1);
assert.equal(response[0].success, true);
const db = new DatabaseSync(":memory:");
try {
  for (const name of ["0001_initial.sql", "0002_waitlist_notifications.sql"]) {
    db.exec(fs.readFileSync(`migrations/${name}`, "utf8"));
  }
  const normalize = (rows) =>
    rows
      .filter(
        (r) =>
          !r.name.startsWith("_cf_") &&
          !r.name.startsWith("sqlite_") &&
          r.name !== "d1_migrations" &&
          r.tbl_name !== "d1_migrations",
      )
      .map(({ type, name, tbl_name, sql }) => ({
        type,
        name,
        tbl_name,
        sql: sql?.replace(/\s+/g, " ").trim().replace(/;$/, ""),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  const expected = db
    .prepare("SELECT type,name,tbl_name,sql FROM sqlite_master")
    .all();
  assert.deepEqual(normalize(response[0].results), normalize(expected));
  console.log(
    "Production application schema matches both reviewed migrations.",
  );
} finally {
  db.close();
}
