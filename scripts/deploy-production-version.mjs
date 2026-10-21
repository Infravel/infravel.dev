import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";
import { readConfig } from "./prepare-production.mjs";

// Existing Worker only. No migrations, secret writes or trigger/domain operations.
const config = ".wrangler.production.generated.jsonc";
const c = readConfig(config);
assert.equal(process.env.GITHUB_REF, "refs/heads/main");
assert.equal(c.name, "infravel-production");
assert.equal(c.account_id, "f6d4cc93a61d7012130cfbd39b3a84fd");
assert.equal(c.d1_databases.length, 1);
assert.equal(c.d1_databases[0].binding, "DB");
assert.equal(
  c.d1_databases[0].database_id,
  "ad4400ff-0e66-45e5-be77-f182cf4cb449",
);
assert.deepEqual(c.routes, []);
const directory = fs.mkdtempSync(path.join(os.tmpdir(), "infravel-version-"));
const output = path.join(directory, "output.jsonl");
const run = (args, extra = {}) => {
  // This release helper runs only on the workflow's Linux runner.
  const result = spawnSync(
    process.execPath,
    ["node_modules/wrangler/bin/wrangler.js", ...args],
    {
      env: { ...process.env, ...extra },
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  if (result.status !== 0)
    throw new Error(
      "Production version operation failed; inspect privately. No automatic retry/rollback.",
    );
};
try {
  run(
    [
      "versions",
      "upload",
      "--config",
      config,
      "--name",
      "infravel-production",
      "--keep-vars",
      "--message",
      `main ${process.env.GITHUB_SHA}`,
    ],
    { WRANGLER_OUTPUT_FILE_PATH: output },
  );
  const entries = fs
    .readFileSync(output, "utf8")
    .trim()
    .split("\n")
    .map(JSON.parse);
  const uploaded = entries.filter((r) => r.type === "version-upload");
  assert.equal(uploaded.length, 1);
  assert.equal(uploaded[0].worker_name, "infravel-production");
  const id = uploaded[0].version_id;
  assert.match(
    id,
    /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i,
  );
  run(["versions", "deploy", `${id}@100%`, "--config", config, "--yes"]);
  console.log(
    `Production Worker version deployed: ${id}. D1, secrets and triggers unchanged.`,
  );
} finally {
  fs.rmSync(directory, { recursive: true, force: true });
}
