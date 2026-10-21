import assert from "node:assert/strict";

export function assertStagingIsolation(config) {
  assert.equal(config.name, "infravel-staging");
  assert.equal(config.vars?.DEPLOYMENT_ENV, "staging");
  assert.deepEqual(
    config.d1_databases,
    [
      {
        binding: "DB",
        database_name: "infravel-staging",
        database_id: "d7229cbc-7449-4448-ab82-e814728b66d4",
        migrations_dir: "migrations",
      },
    ],
    "Staging must expose exactly its own DB, without remote development overrides.",
  );
  assert.equal(
    config.env,
    undefined,
    "Use separate production configuration, never a root environment override.",
  );
}
