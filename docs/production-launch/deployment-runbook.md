# Deployment runbook: prepare the production Worker, then stop

## Current main release preparation (supersedes the initial staging-release draft)

Owner confirms the existing production workers.dev preview, quotation/email and waitlist integration work. No more initial database migrations belong in the application release pipeline. `.github/workflows/production-release.yml.disabled` is the prepared replacement: manual dispatch from **main**, exact approved SHA, production environment review, release flag, pinned actions/account/DB, and fail-closed checks of actual GitHub environment protections and Pages Git deployment settings. It uploads/activates a Worker version using `versions upload --keep-vars` and `versions deploy`, which do not apply trigger/routing changes. Existing secret bindings are retained by installed Wrangler's `keepSecrets: true` upload path; runtime secret values never enter GitHub. Only the deployment API token is needed there. No D1 execute/migration/restore or secret-write command is present.

### Before main can receive any push

There is no Pages deployment command in the repository's main-push CI, but Cloudflare Pages Git integration is independent of Actions. Owner reported `infravel-dev` uses main. Its current automatic-production-deployment setting is not authenticated/verified here. **Do not push/merge main yet.** In Cloudflare `infravel-dev` -> Settings -> Builds & deployments -> Branch control, owner must separately approve disabling automatic production branch deployments, confirm existing deployment/attachments remain intact, and record its known-good deployment ID/pages.dev URL. Disable preview Git builds too if staging pushes must not cause any Pages build. This setting change is not performed by the agent or workflow. A repository workflow cannot suppress a Pages build that fires on the same main push. See [Pages branch controls](https://developers.cloudflare.com/pages/configuration/branch-build-controls/).

Read-only confirmation using an existing private API token (never print the raw Pages object):

```powershell
$releaseAccount = 'f6d4cc93a61d7012130cfbd39b3a84fd'
$releaseHeaders = @{ Authorization = "Bearer $env:CLOUDFLARE_API_TOKEN" }
$p = Invoke-RestMethod -Method Get -Uri "https://api.cloudflare.com/client/v4/accounts/$releaseAccount/pages/projects/infravel-dev" -Headers $releaseHeaders -MaximumRedirection 0
if (-not $p.success) { throw 'Pages inspection failed' }
$p.result | Select-Object name,production_branch,subdomain
$p.result.source.config | Select-Object deployments_enabled,production_deployments_enabled
# Require production_deployments_enabled=false or deployments_enabled=false.
```

In GitHub Settings -> Environments -> production configure sole required user reviewer `shekhar396`, intentionally allow self-review for this solo-founder project, disable admin bypass, and exactly one selected deployment branch policy `main` (type branch). The guard accepts either explicit boolean self-review setting, but fails closed on absent protection metadata or a missing/different/additional reviewer. This replaces earlier staging-only production-environment advice. Configure environment secret `CLOUDFLARE_API_TOKEN` scoped to the production account, Workers Scripts Edit and Pages Read, without DNS/zone write permissions. It is not a runtime Brevo/Turnstile secret. Environment public variables: production `TURNSTILE_SITE_KEY`, `CONTACT_EMAIL`, and the existing optional booking/founder values. Repository `ENABLE_PRODUCTION_RELEASE=true` is a second gate, not approval by itself. The metadata guard needs GitHub environment/policy read visibility; fail-closed permission errors must be resolved, not skipped. Protect main with reviewed PRs and required `Validate website / validate` CI; restrict direct pushes and admin bypass. Remote protections were not configured by this local preparation.

### Owner-reviewed staging-to-main PR commands (not executed)

Local refs inspected: main `d23fd98`, staging `7d2d2e3`; seven staging-only commits and one main-only commit. Remote-tracking refs are snapshots, not freshly fetched evidence. Uncommitted release preparation must first be reviewed, explicitly staged, committed and published by the owner; never include `.env.local` or the private production secrets file. No PR can contain those uncommitted files until then.

After Pages Git builds are paused and owner authorizes commit/push:

```powershell
git fetch origin
git switch staging
# Owner reviews/stages the existing release changes, including new files.
# Publish only after that review and explicit commit/push approval.
git merge --no-ff origin/main
# If conflicts occur, review both branches; never choose an entire side blindly.
# Rename the NEW main workflow only; leave production-launch.yml.disabled inert.
Move-Item -LiteralPath .github/workflows/production-release.yml.disabled -Destination .github/workflows/production-release.yml
# Validators support this exact rename and continue to require manual main gates.
npm run lint
npm run typecheck
npm test
# Review and commit the resolved/activated release, then:
git push origin staging
gh pr create --base main --head staging --title 'Release verified Infravel website to main' --body 'Prepare the verified production Worker release. Pages automatic deployments must be paused before merge. Worker deployment remains manual with production environment approval; no database migration or domain cutover.'
```

Review the full PR; require CI green and Pages-disabled evidence before owner approval. Merge through the reviewed PR (do not force-push or replace main). Exact owner merge command, after substituting the returned PR number and reviewed head SHA: `gh pr merge <PR_NUMBER> --merge --match-head-commit <REVIEWED_HEAD_SHA>`. Once merged, dispatch `gh workflow run production-release.yml --ref main -f approved_sha=<FULL_MERGED_MAIN_SHA>` and have required reviewer `shekhar396` approve the production environment (self-approval is explicitly authorized for this solo-founder project). These commands are documentation, not authorization to commit/push/merge/deploy. No PR was opened because its changes are currently uncommitted and publication is unauthorized.

PowerShell equivalents without guessed PR numbers or SHAs, only after the PR and its current head are reviewed:

```powershell
$reviewedHead = git rev-parse staging
if ($LASTEXITCODE -ne 0) { throw 'Reviewed staging SHA unavailable' }
gh pr merge staging --merge --match-head-commit $reviewedHead
if ($LASTEXITCODE -ne 0) { throw 'PR merge failed; stop' }
$mergedMain = gh api repos/Infravel/infravel.dev/git/ref/heads/main --jq .object.sha
if ($LASTEXITCODE -ne 0 -or $mergedMain -notmatch '^[a-f0-9]{40}$') { throw 'Merged main SHA unavailable' }
gh workflow run production-release.yml --ref main -f "approved_sha=$mergedMain"
if ($LASTEXITCODE -ne 0) { throw 'Production dispatch failed; stop' }
```

Routing is kept outside the version-release pipeline: **never** call `triggers deploy` as part of this workflow. Existing bindings other than DB/ASSETS and runtime variables should be compared with the verified preview before the first automated release; `--keep-vars` preserves remote variables but explicit local vars still apply. Current generated values preserve production mode and both live/preview Turnstile hosts. Secret retention is a verified tool behavior, not a new remote inspection. Keep existing production backups; version rollback does not roll back D1. See [Cloudflare deployment management](https://developers.cloudflare.com/workers/versions-and-deployments/deployment-management/).

All remote mutations below require a later, explicit authorization. None was run during preparation. Domain cutover is separate. Do not use the older `wrangler.jsonc --env production` commands: that environment still contains a placeholder D1 ID. Every release command below names the isolated generated configuration.

## 1. Approval and recovery prerequisites

- Confirm the exact reviewed staging release SHA, descended from approved design `7d2d2e3`, with clean source and no unexpected migrations/dependency changes. The current uncommitted preparation needs owner review and a separately authorized commit before any workflow run.
- Complete the configuration checklist, legal/business approval, dependency audit, and owner-controlled production resource provisioning. Verify the production Worker exists and is separate from staging/Pages. The initial configuration must have no live routes.
- Rehearse recovery with an access-controlled encrypted backup. Record account, database identity, migration history, timestamp/bookmark, verified export location, restoration evidence, known-good Pages deployment, and responsible operator privately. The workflow requires a non-secret backup evidence reference and `PRODUCTION_BACKUP_VERIFIED=true`; those attestations do not themselves prove restoration succeeded.
- Disable production notification scheduling until genuine endpoint/secret tests succeed. Never replay uncertain-acceptance notifications blindly.

### Sensitive read/export: future owner execution only

The following reads a remote database and writes a local export containing customer data. Choose an encrypted, access-controlled directory outside the repository. Do not upload the SQL or raw metadata to GitHub artifacts or chat. Both migrations are additive; do not restore/roll back D1 automatically after an application failure.

```powershell
$backupRoot = Read-Host 'Existing encrypted backup directory outside this repository'
if (-not (Test-Path -LiteralPath $backupRoot -PathType Container)) { throw 'Backup directory does not exist' }
$backupRoot = (Resolve-Path -LiteralPath $backupRoot).Path
$stamp = (Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssZ')
$backupSql = Join-Path $backupRoot "infravel-$stamp.sql"
$bookmarkFile = Join-Path $backupRoot "infravel-$stamp-bookmark.json"
npx.cmd --no-install wrangler d1 time-travel info DB --config wrangler.production.d1.jsonc --json > $bookmarkFile
if ($LASTEXITCODE -ne 0) { throw 'Recovery bookmark failed' }
npx.cmd --no-install wrangler d1 export DB --config wrangler.production.d1.jsonc --remote --output $backupSql
if ($LASTEXITCODE -ne 0) { throw 'Database export failed' }
```

Confirm the export is usable and escrowed before authorizing migrations. For a genuinely new empty database, record that fact and its baseline schema/bookmark instead of assuming there is no data. Check the account's actual Time Travel retention and restore procedure. See [Cloudflare D1 commands](https://developers.cloudflare.com/workers/wrangler/commands/d1/).

## 2. Local build and browser validation

First set the real nonsecret production inputs described in the checklist; scripts refuse missing/test/staging values. Generating a config only writes a local ignored file; it does not provision resources. Use an owner-approved npm audit authorization before the network audit, which sends dependency metadata to npm.

```powershell
node scripts/prepare-production.mjs
if ($LASTEXITCODE -ne 0) { throw 'Invalid production inputs' }
node scripts/check-production.mjs
if ($LASTEXITCODE -ne 0) { throw 'Invalid generated configuration' }
npm.cmd ci
if ($LASTEXITCODE -ne 0) { throw 'Lockfile install failed' }
npm.cmd run lint
if ($LASTEXITCODE -ne 0) { throw 'Lint failed' }
npm.cmd run typecheck
if ($LASTEXITCODE -ne 0) { throw 'Typecheck failed' }
npm.cmd test
if ($LASTEXITCODE -ne 0) { throw 'Tests failed' }
# NETWORK AUDIT: requires authorization for dependency metadata upload.
npm.cmd audit --audit-level=high
if ($LASTEXITCODE -ne 0) { throw 'Dependency audit blocks release' }
npx.cmd --no-install opennextjs-cloudflare build --config .wrangler.production.generated.jsonc
if ($LASTEXITCODE -ne 0) { throw 'Production Worker build failed' }
npm.cmd run check:worker
if ($LASTEXITCODE -ne 0) { throw 'Worker manifest check failed' }
```

Keep production and staging artifacts separate; rebuilding either overwrites `.next`/`.open-next`. Do not deploy a stale staging bundle after switching config/vars. No application secrets are needed for the build. Test the exact production artifact locally:

```powershell
$nodePath = (Get-Command node).Source
$previewProcess = Start-Process -FilePath $nodePath -ArgumentList @('node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3100') -WindowStyle Hidden -PassThru
try {
  $env:E2E_BASE_URL = 'http://127.0.0.1:3100'
  npx.cmd --no-install playwright test --workers=2
  if ($LASTEXITCODE -ne 0) { throw 'Browser tests failed' }
} finally {
  Stop-Process -Id $previewProcess.Id -ErrorAction SilentlyContinue
  Remove-Item Env:E2E_BASE_URL -ErrorAction SilentlyContinue
}
```

Use a free port; stop only the process you started. Browser tests mock form/provider calls. A real Worker runtime and genuine Turnstile/D1/Brevo checks remain separate requirements.

## 3. Inert GitHub workflow and future activation

The draft is `.github/workflows/production-launch.yml.disabled`. GitHub does not execute this extension. Do **not** rename, push, enable, or dispatch it during this preparation. The preparation validator and its unit test deliberately assert that no production workflow is executable; a future owner-reviewed activation change must update these inactive-only assertions and re-run all checks. Do not simply rename the file and bypass the resulting safety-test failure.

After owner approval, configure the production environment protections first, including the repository plan's support for required reviewers. Then establish a safe activation path: GitHub manual workflows need their definition on the repository's default branch. Do not merge the application into `main` or push a workflow there without first reviewing the existing Pages automatic-build behavior and obtaining separate authorization. This preparation changes neither branch nor Pages settings. See [GitHub manual workflow prerequisites](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow).

Once separately authorized and safely published as `production-launch.yml`, dispatch **staging**, never main. The workflow requires repository-level `ENABLE_PRODUCTION_LAUNCH=true`, exact full approved SHA, confirmation `DEPLOY_PRECUTOVER_WORKER`, explicit migration authorization, backup evidence reference, and production-environment review/backup attestations. Protect the production environment and source branch; do not treat a flag as a substitute for GitHub required reviewers.

The draft uses full action SHAs verified against the official [checkout v4.2.2](https://github.com/actions/checkout/commit/11bd71901bbe5b1630ceea73d27597364c9af683) and [setup-node v4.4.0](https://github.com/actions/setup-node/commit/49933ea5288caeca8642d1e84afbd3f7d6820020) releases. These are controlled versions, not a claim they are newest. Re-review action security before activation. `npm ci` uses the checked-in lockfile, no `npm audit fix` or dependency upgrade runs automatically, and credentials are exposed only to the remote metadata/migration/deploy steps.

### Ubuntu commands encoded in the draft

The following is documentation of the future approved mutation sequence, not a command to execute now. The draft fails before these steps if approvals/tests/audit/config/secrets checks fail.

```bash
set -euo pipefail
node scripts/check-production.mjs
# Read-only remote names/migration metadata; never print secret values.
npx --no-install wrangler secret list --config .wrangler.production.generated.jsonc > /tmp/infravel-secret-names.json
node scripts/check-production-secret-names.mjs /tmp/infravel-secret-names.json
npx --no-install wrangler d1 migrations list DB --config wrangler.production.d1.jsonc --remote
# REMOTE WRITES: only after reviewed backup/migration authorization.
npx --no-install wrangler d1 migrations apply DB --config wrangler.production.d1.jsonc --remote
npx --no-install opennextjs-cloudflare deploy --config .wrangler.production.generated.jsonc
# Read-only verification; no genuine form submission or authenticated retry.
node scripts/smoke-production.mjs
```

PowerShell equivalents for separately approved manual execution:

```powershell
npx.cmd --no-install wrangler d1 migrations list DB --config wrangler.production.d1.jsonc --remote
if ($LASTEXITCODE -ne 0) { throw 'Migration-state read failed' }
# REMOTE DATABASE WRITE:
npx.cmd --no-install wrangler d1 migrations apply DB --config wrangler.production.d1.jsonc --remote
if ($LASTEXITCODE -ne 0) { throw 'Migration failed; do not deploy' }
# REMOTE WORKER DEPLOYMENT, NO DOMAIN CUTOVER:
npx.cmd --no-install opennextjs-cloudflare deploy --config .wrangler.production.generated.jsonc
if ($LASTEXITCODE -ne 0) { throw 'Deployment failed; inspect partial state before retry' }
node scripts/smoke-production.mjs
if ($LASTEXITCODE -ne 0) { throw 'Smoke failed; do not cut over' }
```

## 4. Validate before domain cutover

The smoke script checks status, selected security headers, preview noindex, robots, known pages/assets, a 404, legacy redirect, and a deliberately unauthorized retry POST. It never sends a lead, supplies a retry secret, modifies data, or proves external integrations. Its origin guard refuses staging/arbitrary URLs and follows no redirects.

An owner must then submit controlled fictional inquiries/waitlist registrations through the real production widget and verify exact D1 records, complete business emails, correct recipient/sender/Reply-To, one waitlist notification for duplicate email registration, provider failure/retry, and oldest/stale outbox review. These are real data writes/emails and require explicit authorization and an agreed cleanup/retention plan. Confirm no customer data appears in logs. Record genuine validation evidence before moving traffic.

On failure: stop, keep apex/www on Pages, inspect migration/deployment history privately, and distinguish failed migration from successful migration plus failed deploy. Migrations may have partially progressed across files; do not blindly replay/revert or restore a database. The workflow emits fixed failure categories/outcomes, uploads no raw traces/logs/exports, and does not attempt automatic rollback. After pre-cutover verification, disable the launch flag. Do not reuse this empty-routes configuration after live domains are attached; first review a durable live-domain configuration and restricted deployment process.
