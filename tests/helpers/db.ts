import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import type { D1Database } from "@cloudflare/workers-types";
export function database() {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(readFileSync("migrations/0001_initial.sql", "utf8"));
  function statement(sql: string, values: unknown[] = []) {
    return {
      bind: (...args: unknown[]) => statement(sql, args),
      async first() {
        return (
          sqlite.prepare(sql).get(...(values as (string | number | null)[])) ||
          null
        );
      },
      async all() {
        return {
          results: sqlite
            .prepare(sql)
            .all(...(values as (string | number | null)[])),
          success: true,
        };
      },
      async run() {
        const result = sqlite
          .prepare(sql)
          .run(...(values as (string | number | null)[]));
        return { success: true, meta: { changes: Number(result.changes) } };
      },
    };
  }
  const db = {
    prepare: statement,
    async batch(statements: ReturnType<typeof statement>[]) {
      sqlite.exec("BEGIN");
      try {
        const results = [];
        for (const s of statements) results.push(await s.run());
        sqlite.exec("COMMIT");
        return results;
      } catch (e) {
        sqlite.exec("ROLLBACK");
        throw e;
      }
    },
  } as unknown as D1Database;
  return { db, sqlite };
}
