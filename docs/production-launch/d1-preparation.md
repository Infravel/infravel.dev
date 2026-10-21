# Production D1 preparation — blocked before remote inventory

## Consolidated sprint - latest status

Owner verified the production identity/binding, internal-only `_cf_KV` baseline with no migration ledger, and working apex/www. These facts supersede older unknown-baseline/domain-failure observations. Current authorization covers guarded production backup/migrations, secret setup and isolated preview, but not live cutover, Pages/DNS changes, commits or pushes.

Cloudflare authentication still fails in this environment. No remote phase was executed. Use the single owner-executable `scripts/production-readiness.ps1` and [consolidated readiness report](readiness-sprint.md) for parameters, guards, integration checks and final cutover/rollback procedure. Local account-pinned generation support and schema comparison are prepared. Launch remains NO-GO until the owner script and controlled integration checks succeed. The current npm audit could not reach the official endpoint; historical zero-vulnerability results do not substitute for that release gate. Production workflow remains disabled.


## Production baseline verification - latest decision: NO-GO

21 October 2026. Local production administration validation passed. `wrangler.production.d1.jsonc` has exactly one binding, `DB` -> `infravel-production` / `ad4400ff-0e66-45e5-be77-f182cf4cb449`, pinned to account `f6d4cc93a61d7012130cfbd39b3a84fd`. Production differs from staging. No staging remote operation was attempted.

`wrangler whoami` failed with profile-log EPERM and `fetch failed`. Consequently production tables/indexes, row counts, migration ledger, foreign-key state and recovery baseline are **unverified**. No D1 query or migration ran. Owner-supplied existence/identity is not proof of an empty schema. Initial migration execution remains NO-GO pending results and explicit authorization.

**Correction to older read-only guidance:** installed Wrangler 4.151.0's `d1 migrations list` handler calls `initMigrationsTable`, which can CREATE the tracking table. Do not run it during a strictly read-only baseline check. Earlier listing examples below are superseded for this inspection. Use SELECT from an already existing ledger only; do not initialize or repair one.

### Exact owner PowerShell baseline commands (read-only)

Run from the repository on `staging`, using the owner's existing authenticated session. Do not paste tokens, enable debug tracing, or return customer records.

```powershell
Set-Location -LiteralPath 'E:\Professional\Company Group\infravel\infravel.dev'
$env:WRANGLER_SEND_METRICS = 'false'
$env:CLOUDFLARE_ACCOUNT_ID = 'f6d4cc93a61d7012130cfbd39b3a84fd'
node scripts/check-production-d1.mjs
if ($LASTEXITCODE -ne 0) { throw 'Local target validation failed; stop' }
npx.cmd --no-install wrangler whoami
if ($LASTEXITCODE -ne 0) { throw 'Authentication failed; stop' }
# Confirm displayed account ID before continuing.
npx.cmd --no-install wrangler d1 info DB --config wrangler.production.d1.jsonc
if ($LASTEXITCODE -ne 0) { throw 'Database identity verification failed; stop' }
# STOP if info does not identify production UUID ad4400ff-0e66-45e5-be77-f182cf4cb449.
function Read-ProductionSql([string]$Sql) {
  $raw = & npx.cmd --no-install wrangler d1 execute DB --config wrangler.production.d1.jsonc --remote --command $Sql --json
  if ($LASTEXITCODE -ne 0) { throw 'Production SELECT failed; stop' }
  $parsed = ($raw -join "`n") | ConvertFrom-Json
  if (@($parsed).Count -ne 1 -or $parsed[0].success -ne $true) { throw 'Unexpected query response; stop' }
  return $parsed[0].results
}
$schema = @(Read-ProductionSql "SELECT type,name,tbl_name,sql FROM sqlite_master WHERE type IN ('table','index','view','trigger') ORDER BY type,name;")
$schema | Format-List type,name,tbl_name,sql
# Only schema definitions are printed; never SELECT * from application tables.
$tables = @($schema | Where-Object { $_.type -eq 'table' -and $_.name -notmatch '^(sqlite_|_cf_)' })
foreach ($table in $tables) {
  $quotedName = '"' + $table.name.Replace('"','""') + '"'
  $count = @(Read-ProductionSql ("SELECT COUNT(*) AS row_count FROM " + $quotedName + ";"))
  [pscustomobject]@{ Table = $table.name; RowCount = $count[0].row_count }
}
if (@($schema | Where-Object { $_.type -eq 'table' -and $_.name -eq 'd1_migrations' }).Count -eq 1) {
  # Standard Wrangler ledger columns; stop on schema differences, do not repair.
  Read-ProductionSql 'SELECT id,name,applied_at FROM d1_migrations ORDER BY id;'
} else {
  Write-Output 'No d1_migrations table exists; no tracking table was created.'
}
```

Return the matching account/database metadata (no credentials), schema definitions, table counts and applied migration filenames/timestamps. Any unexpected schema names, triggers/views or ledger definition must be reviewed privately if sensitive. No customer field values or database export should be shared. Counts inspect all discovered non-internal tables, not just expected leads; any unexpected table or nonzero application count blocks a claim of a pristine baseline. Unknown internal-looking objects should also be explained rather than blindly accepted. A parse/access failure is unknown, not empty. Recheck shortly before eventual migration if the database can receive writes.

### Migration order, conflicts and acceptance criteria

1. `0001_initial.sql`: creates `leads`, `opspilot_waitlist`, `notification_outbox`, `rate_limits`; explicit indexes `leads_created`, `waitlist_created`, `outbox_due`, `rate_limits_expiry`. Enables foreign keys; includes status/consent/length constraints, waitlist case-insensitive unique email and quote outbox unique foreign key.
2. `0002_waitlist_notifications.sql`: creates `waitlist_notification_outbox` and `waitlist_outbox_due`; depends on the waitlist table from 0001. No historical waitlist notification backfill.

Both files contain CREATE statements without IF NOT EXISTS. Any pre-existing named table/index conflicts with replay, even if empty. Partial schema, ledger/schema disagreement, unexpected objects, unknown applied migrations or customer records require reconciliation; do not drop objects, insert ledger rows, or edit migrations to force a pass. SQLite automatic indexes and verified Cloudflare internals must be distinguished from application objects. A valid already-applied migration must not be rerun. For an initial-schema GO, require a confirmed production identity, no unexplained application objects/data, no ledger conflicts, reviewed recovery evidence and separate owner migration approval. Existing correctly tracked schema means a different pending-migration assessment, not permission to replay both files.

Reviewed local file SHA-256 (repeat before approval):

- 0001: `59EA91C790E3BD0BC377B9FE2CDE79C981091B0BD076C441C5AF28CFE6273335`
- 0002: `27E343E70EC100B7C8FD0FE2B23B52511EBF785FCD0D1FDD469B02242CE47941`

### Backup and recovery prerequisites - procedure only, not performed

After confirming identity and baseline, record UTC time, schema/ledger results, migration hashes and an accountable operator. Verify actual storage backend and plan-specific Time Travel retention. Retrieve a pre-migration bookmark using `npx.cmd --no-install wrangler d1 time-travel info DB --config wrangler.production.d1.jsonc --json`; store it privately with the verified production identity. This is metadata, not an executed restore.

For a portable backup, choose an existing encrypted access-controlled directory outside this repository and use `npx.cmd --no-install wrangler d1 export DB --config wrangler.production.d1.jsonc --remote --output <absolute-private-backup.sql>`. Replace the path deliberately, fail on nonzero exit, record file hash, protect access and verify export completeness/usability privately. Exports may contain customer data: never paste or upload them. Even an empty database needs recorded baseline evidence. No export was performed in this pass.

Recovery requires a separately approved incident procedure: stop production writers/retries, preserve current evidence/bookmark, verify production UUID again, assess any writes since backup, obtain approval for data loss, and only then restore to the recorded pre-migration bookmark. Time Travel restore overwrites in place and cancels in-flight queries; never automatically restore after an application failure. Export recovery should be rehearsed only in a separately authorized disposable recovery database, never staging or live production. Revalidate schema, ledger and counts after recovery before resuming writers. A bookmark/export alone does not prove a successful recovery rehearsal. See [Cloudflare Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/).

Future migration command, **not executed and not approved**: `npx.cmd --no-install wrangler d1 migrations apply DB --config wrangler.production.d1.jsonc --remote`. The explicit config pins account/production UUID and the remote flag targets Cloudflare. Do not substitute root config, `--env production`, or staging. Stop here pending owner baseline results and separate authorization.


## Deployed staging runtime inspection ? blocked on access

Latest attempt on 21 October 2026: branch `staging`; `wrangler whoami` failed with profile-log EPERM and `fetch failed`. No authenticated binding/version metadata was available. **Production binding present/absent on the deployed Worker is UNKNOWN.** No deployment is proposed as necessary until the owner supplies metadata. If production is absent from all active versions and current settings, record that evidence and stop without redeploying.

Local configuration revalidated: exactly `DB` ? staging `d7229cbc-7449-4448-ab82-e814728b66d4`; no production UUID, additional D1, remote development override or nested environment. Production administration is separate. Lint, TypeScript, all 97 tests in eight files, staging gate, D1 validator and inactive-workflow validator passed. The staging gate used a recognized public Turnstile test key for local checks/build only; that is not confirmation of real deployment inputs.

Staging Next.js/OpenNext Worker build also passed, including all 30 static generation tasks and the Worker manifest regression check. Existing Windows OpenNext, Vite config-loader and experimental SQLite advisories remain; they did not fail validation. Build used a public test site key and is not approved for deployment.

### Owner read-only evidence collection

Use an existing authorized session in Dashboard ? correct account `f6d4cc93a61d7012130cfbd39b3a84fd` ? Workers & Pages ? `infravel-staging`. Inspect Bindings and Settings ? Variables and Secrets (names/types only). Record each D1 binding name/UUID, other resource-binding names/types/identities, and current deployment/version IDs and traffic percentages. Inspect every active version if traffic is split. Do not open D1 Studio, execute queries, edit bindings or trigger deployment. Confirm production UUID `ad4400ff-0e66-45e5-be77-f182cf4cb449` is absent regardless of binding name.

GET-only API alternative using an existing authorized token supplied privately in the process environment. Never echo it, enable tracing/transcripts, or print whole API objects:

```powershell
if (-not $env:CLOUDFLARE_API_TOKEN) { throw 'Existing authorized token required' }
$cfHeaders = @{ Authorization = "Bearer $env:CLOUDFLARE_API_TOKEN" }
$cfRoot = 'https://api.cloudflare.com/client/v4/accounts/f6d4cc93a61d7012130cfbd39b3a84fd'
function Get-StagingMetadata([string]$Suffix) {
  try {
    $r = Invoke-RestMethod -Method Get -Uri "$cfRoot/workers/scripts/infravel-staging$Suffix" -Headers $cfHeaders -MaximumRedirection 0 -ErrorAction Stop
    if (-not $r.success) { throw 'Read failed' }
    return $r.result
  } catch { throw 'Metadata GET failed; verify authorized access privately. Do not print raw response.' }
}
$settings = Get-StagingMetadata '/settings'
$settings.bindings | Select-Object name,type
$settings.bindings | Where-Object type -eq 'd1' | Select-Object name,type,id
$deployments = Get-StagingMetadata '/deployments'
$deployments.deployments | Select-Object id,created_on,source,strategy
# Deployments are returned newest first; verify the newest entry matches Dashboard.
$currentDeployment = @($deployments.deployments)[0]
if (-not $currentDeployment) { throw 'No current deployment identified; stop' }
$currentDeployment.versions | Select-Object version_id,percentage
foreach ($v in $currentDeployment.versions) {
  if ($v.version_id -notmatch '^[a-fA-F0-9-]{36}$') { throw 'Invalid version ID; stop' }
  $version = Get-StagingMetadata ("/versions/" + $v.version_id)
  $version.resources.bindings | Select-Object name,type
  $version.resources.bindings | Where-Object type -eq 'd1' | Select-Object name,type,id
}
```

Report only deployment/version identifiers, traffic percentages and D1 binding names/UUIDs, plus other binding/variable/secret **names/types**. An unavailable endpoint, unclear current version or incomplete response means unknown: use Dashboard or stop. Settings alone do not prove absence across a split deployment. No customer-data API is involved.

### Conditional remediation proposal ? not approved or executed

Only if metadata confirms production D1 remains exposed: reconcile the selected release with the deployed staging version and inspect all other bindings first. The local build includes existing uncommitted launch preparation, so deploying it is an application release too, not provably a binding-only change. Prefer a separately reviewed remediation artifact matching the existing deployed code; do not claim the current artifact preserves identical code. Do not execute the existing staging workflow for this task: it includes a database migration step.

Remote secret names/values and other binding preservation cannot be verified from the failed authentication. Before approval, confirm required `TURNSTILE_SECRET_KEY`, `RATE_LIMIT_SALT`, `BREVO_API_KEY`, `EMAIL_FROM`, `LEAD_NOTIFICATION_TO`, `RETRY_SECRET` names, and privately compare nonsecret variables including `TURNSTILE_HOSTNAMES` and `DEPLOYMENT_ENV`. Do not copy or re-upload secret values. `--keep-vars` preserves dashboard-managed plain-text/JSON variables; explicit local vars still apply, so confirm `DEPLOYMENT_ENV` is already staging. Wrangler retains existing secrets by default; installed Wrangler's upload path sets `keepSecrets: true`. Do not pass a secrets file. See [Wrangler deployment options](https://developers.cloudflare.com/workers/wrangler/commands/workers/).

`--keep-vars` does **not** preserve other resource binding types. Root declares ASSETS and staging DB; any additional required deployed bindings (for example optional CONVERSIONS analytics) must be reviewed and represented in a staging-only config before approval. Do not retain all D1 bindings to preserve other resources: that would retain the production exposure. Compare compatibility flags/date, asset configuration, observability, triggers and domain/route settings; stop on drift rather than overwrite unknown settings. Current metadata is unavailable, so no claim of preservation or minimal remediation readiness is made.

After successful metadata reconciliation, correct real staging build inputs and explicit owner approval, the candidate command sequence is:

```powershell
# FUTURE APPROVAL ONLY. No migrations; do not use the staging deployment workflow.
$env:CLOUDFLARE_ACCOUNT_ID = 'f6d4cc93a61d7012130cfbd39b3a84fd'
$env:DEPLOYMENT_ENV = 'staging'
node scripts/check-staging.mjs
if ($LASTEXITCODE -ne 0) { throw 'Staging validation failed; stop' }
# Rebuild the approved artifact with verified real staging public inputs.
npm.cmd run build:worker
if ($LASTEXITCODE -ne 0) { throw 'Worker build failed; stop' }
npx.cmd --no-install wrangler deploy --config wrangler.jsonc --name infravel-staging --keep-vars
if ($LASTEXITCODE -ne 0) { throw 'Staging deployment failed; stop' }
```

Expected D1 change only: remove the extra production binding, retain staging DB UUID. Worker code/assets would also be uploaded; preserve required non-D1 configuration only after the preceding comparison. Repeat the same GET metadata checks after any approved remediation, including all active versions, before declaring runtime isolation restored. No database migration, production deployment, Pages/DNS/domain operation or secret update is included. This command is conditional documentation, not approval to execute.


## Isolation remediation ? current local state

The root configuration now contains exactly one D1 binding: `DB` to staging UUID `d7229cbc-7449-4448-ab82-e814728b66d4`. Removed the unused `infravel_production` binding (`remote: true`) and obsolete nested production environment. This supersedes older exposure/placeholder statements below.

Root cause: a production database binding was placed in the default staging configuration rather than the separate production administration file. The originating command/operator cannot be established from the local diff. No application, script or workflow consumed that binding name; only the new negative regression fixture references it. Application code uses `DB`, but the extra binding was still a capability available to a deployed staging Worker and to authenticated local development using remote bindings. See [Cloudflare D1 local development](https://developers.cloudflare.com/d1/best-practices/local-development/). There is no evidence here that production data was accessed.

`assertStagingIsolation` now rejects extra bindings, substituted UUIDs, remote development overrides and nested environment configurations. Both staging and D1 validators invoke it; CI runs its regression tests through `npm test`. Staging deployment is restricted to `refs/heads/staging` and explicitly selects `wrangler.jsonc` for migration/deployment. Previously its manual dispatch lacked a branch guard and its D1 checks inspected only the first binding. CI and local runtime workflows contain no production deployment command. The retry workflow is an HTTP operation rather than a deployment: if separately enabled and pointed at the live apex, it can mutate the live notification outbox/send email. Its remote flag/URL were not inspected or changed.

Production administration commands in the runbook and inactive production workflow now use only `wrangler.production.d1.jsonc`; the inactive migration steps also validate it first. The future full Worker deployment still uses the generated application configuration. The production workflow remains `.disabled` and was not activated.

Local verification: lint, TypeScript, staging gate, D1 validator, deployment-template validator, disabled-workflow validator and release/isolation tests passed. No Wrangler remote command, migrations, deployment, secret change or database query occurred. Production database IDs remain owner-verified; existing deployed staging bindings are **not** established by local remediation. A prior deployment could retain the unwanted binding until a separately approved staging update removes it. Inspect deployed binding metadata read-only when authorized access is available; never infer live isolation from this local change. Limit staging credentials to staging resources where supported; no credential permissions were changed. Locally privileged operators can still explicitly select the production administration config. Production migration/runtime readiness remains pending.

Changed for isolation: `wrangler.jsonc`, `scripts/staging-isolation.mjs`, `scripts/check-staging.mjs`, `scripts/check-production-d1.mjs`, `tests/unit/staging-isolation.test.mjs`, `.github/workflows/staging.yml`, inactive production workflow, and production launch documentation including database administration commands in the deployment runbook. No application code changes.


21 October 2026, branch `staging`. The owner explicitly authorized creation of exactly one `infravel-production` database if verified absent, but not migrations or deployment.

## Current verification outcome

Owner verified via Wrangler and supplied these non-secret identifiers:

- Account: `f6d4cc93a61d7012130cfbd39b3a84fd`.
- Production: `infravel-production`, `ad4400ff-0e66-45e5-be77-f182cf4cb449`.
- Staging: `infravel-staging`, `d7229cbc-7449-4448-ab82-e814728b66d4`.

The UUIDs are different. Remote identity/existence is owner-attested, not independently queried from this environment. The previous failed authentication attempt is historical; no further remote commands were run.

Created `wrangler.production.d1.jsonc`, pinned to the supplied account with exactly one `DB` binding, production UUID, migration directory, no routes and no Worker entrypoint. This is a database-administration configuration, not a deployable application configuration. Created `scripts/check-production-d1.mjs` for repeatable local checks. Empty deployment template and deployment-generator safeguards are unchanged.

**Existing isolation conflict:** before this pass, root `wrangler.jsonc` already included `infravel_production` bound to production with `remote: true`, alongside staging `DB`. Preserved byte-for-byte as requested. The application consumes `DB`, but default staging development/config commands may expose production through the additional binding. Owner should separately review removal of that accidental cross-environment binding before further staging operations. Legacy `env.production.DB` remains all zeros; do not use it.

No database, secret, staging configuration, Pages project, domain, route, SSL setting, workflow or Worker was changed. No customer records were read or inserted. Owner reports www HTTPS now works; no HTTP recheck was performed.

## Migration review (static only)

Execution order is `0001_initial.sql`, then `0002_waitlist_notifications.sql`.

| Migration | Review |
| --- | --- |
| `0001_initial.sql` | Creates leads, waitlist, quote notification outbox, rate limits and indexes. Enables foreign keys; quote outbox references leads with cascade deletion. Name/message lengths and status/consent checks match the current application contract. Waitlist email has case-insensitive uniqueness. No seed data, credentials, destructive changes, or external calls. |
| `0002_waitlist_notifications.sql` | Adds a separate waitlist outbox and due-work index; foreign key references the previously created waitlist with cascade deletion. Preserves the quote outbox and lead state. No data backfill or customer insert. |

Application inserts/retry reads use these columns, including complete requirements, attribution, optional fields, timestamps, attempts and leases. Both migrations are additive and suitable for an empty, confirmed production database, subject to remote baseline verification. They are **not raw-SQL idempotent**: CREATE statements have no IF NOT EXISTS. Use Wrangler migration tracking, never blindly replay SQL. Existing untracked tables require reconciliation before applying; do not mask schema drift with IF NOT EXISTS. Migration 0002 does not backfill notifications for existing waitlist rows.

Stored names, email addresses, messages, attribution and consent are personal data. The schema adds no API keys, Turnstile tokens or passwords and embeds no customer data. Retention/deletion and expired rate-limit cleanup remain operational requirements; these migrations do not implement automatic expiry. Restrict access and protect any future exports. This static review does not prove live D1 compatibility or applied state.

## Prepared migration commands ? not executed

Configuration validation passed using `node scripts/check-production-d1.mjs`. Deployment-template validation passed and all 20 production-release tests passed. ESLint passed for the new checker. The new config's `DB` binding matches `src/lib/env.ts`; remote schema/migration history, permissions and applied state remain unverified. No application source changed; full builds/browser tests were not rerun.

The following commands target only the pinned D1 configuration. They are prepared for future approval, not an instruction to execute now. First reconfirm authenticated account identity and the production baseline/recovery evidence in the [deployment runbook](deployment-runbook.md). Migration listing is not used as proof of an empty schema.

```powershell
node scripts/check-production-d1.mjs
if ($LASTEXITCODE -ne 0) { throw 'Production D1 configuration invalid; stop' }
npx.cmd --no-install wrangler d1 migrations list DB --config wrangler.production.d1.jsonc --remote
if ($LASTEXITCODE -ne 0) { throw 'Migration-state inspection failed; stop' }
# STOP: obtain explicit production migration approval before running the next command.
npx.cmd --no-install wrangler d1 migrations apply DB --config wrangler.production.d1.jsonc --remote
if ($LASTEXITCODE -ne 0) { throw 'Migration failed; stop without deploying' }
```

Wrangler applies `0001_initial.sql` then `0002_waitlist_notifications.sql` through its migration ledger; do not manually replay the SQL. No production migration was executed.

## Remaining launch blockers

D1-only local preparation is ready for review. Deployment remains NO-GO. Full Worker configuration still needs the owner-confirmed preview origin, production Turnstile public site key and public contact email required by the existing generator. Do not substitute invented inputs. Runtime requires `TURNSTILE_HOSTNAMES`, `TURNSTILE_SECRET_KEY`, `RATE_LIMIT_SALT` and, for notifications/retries, `BREVO_API_KEY`, `EMAIL_FROM`, `LEAD_NOTIFICATION_TO`, `RETRY_SECRET`; remote presence/validity has not been checked or changed. Optional `CONVERSIONS` analytics is not required for D1 preparation. ASSETS belongs to the full deployment template, not this D1-only file.

Other blockers: resolve the root staging production-binding conflict, confirm production schema/ledger and recovery baseline, obtain migration authorization, establish production integrations, GitHub approval protections, and business/cutover approval. The deployment workflow remains disabled. Do not deploy using this D1-only config or the placeholder legacy production environment.
