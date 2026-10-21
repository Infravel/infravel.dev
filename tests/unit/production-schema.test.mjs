import { it, expect } from "vitest";
import fs from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { spawnSync } from "node:child_process";

it("accepts reviewed schema and rejects missing indexes or extra application objects", () => {
  const db = new DatabaseSync(":memory:");
  try {
    for (const name of [
      "0001_initial.sql",
      "0002_waitlist_notifications.sql",
    ]) {
      db.exec(fs.readFileSync(`migrations/${name}`, "utf8"));
    }
    const rows = db
      .prepare("SELECT type,name,tbl_name,sql FROM sqlite_master")
      .all();
    const verify = (results) =>
      spawnSync(process.execPath, ["scripts/verify-production-schema.mjs"], {
        input: JSON.stringify([{ success: true, results }]),
        encoding: "utf8",
      }).status;
    expect(verify(rows)).toBe(0);
    expect(verify(rows.filter((r) => r.name !== "outbox_due"))).not.toBe(0);
    expect(
      verify([
        ...rows,
        {
          type: "table",
          name: "unexpected",
          tbl_name: "unexpected",
          sql: "CREATE TABLE unexpected(id TEXT)",
        },
      ]),
    ).not.toBe(0);
  } finally {
    db.close();
  }
});
