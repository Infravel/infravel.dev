# Production configuration and infrastructure checklist

## Safe local inspection (no remote writes)

Use PowerShell in the repository. Do not print `.env.local`, `.dev.vars`, environment dumps, authorization headers, or secret values.

```powershell
git -c safe.directory='E:/Professional/Company Group/infravel/infravel.dev' status --short
git -c safe.directory='E:/Professional/Company Group/infravel/infravel.dev' branch --show-current
git -c safe.directory='E:/Professional/Company Group/infravel/infravel.dev' rev-parse HEAD
node scripts/prepare-production.mjs --check-template
node scripts/check-launch-draft.mjs
npm.cmd run lint
if ($LASTEXITCODE -ne 0) { throw 'Lint failed' }
npm.cmd run typecheck
if ($LASTEXITCODE -ne 0) { throw 'Typecheck failed' }
npm.cmd test
if ($LASTEXITCODE -ne 0) { throw 'Tests failed' }
npm.cmd run build
if ($LASTEXITCODE -ne 0) { throw 'Build failed' }
npm.cmd run build:worker
if ($LASTEXITCODE -ne 0) { throw 'Worker build failed' }
```

The existing `npm run build:worker` verifies the default staging bundle. The separate explicit-config production build is in the deployment runbook. Do not execute a deployment just to validate a bundle.

## Read-only remote inspection, only with authorized access

Current evidence: [read-only inventory](inventory.md). Public DNS and GitHub metadata were obtained; the Cloudflare session was expired, production approval environment was absent, and www HTTPS returned 525. Use that inventory's GET-only/manual steps to finish the authenticated checks. Do not infer missing Cloudflare resources from unavailable access.

These commands contact external services. Use an existing authorized login/token. No command below creates a resource. Review outputs privately; never paste raw API objects that could include build environment values.

```powershell
Resolve-DnsName infravel.dev
Resolve-DnsName www.infravel.dev
npx.cmd --no-install wrangler whoami
npx.cmd --no-install wrangler pages project list
npx.cmd --no-install wrangler d1 list
gh api repos/Infravel/infravel.dev/environments/production --jq '{name: .name, protection_types: [.protection_rules[].type], deployment_branch_policy: .deployment_branch_policy}'
```

In the Cloudflare dashboard record: correct account and active zone, Pages project `infravel-dev`, production branch/build settings, known-good deployment ID/pages.dev URL, apex/www custom domains, DNS record types/targets/proxy state, edge redirects, Workers routes/custom domains, TLS status, and export/rollback access. DNS results alone cannot establish Pages ownership or routing precedence. No such remote state was authenticated during this preparation.

## Infrastructure requirements (not provisioned)

| Item | Required configuration |
| --- | --- |
| Worker | Separate `infravel-production`; no staging replacement or Pages command |
| D1 | Separate `infravel-production`; owner-confirmed database UUID, not zero and not staging ID |
| Binding | `DB`, with both reviewed migrations from `migrations/` |
| Assets/runtime | `ASSETS` from `.open-next/assets`; `.open-next/worker.js`; `nodejs_compat`; compatibility date 2026-10-01 |
| Initial verification URL | Exact existing-account `https://infravel-production.<owner-confirmed-subdomain>.workers.dev`; no guessed account subdomain |
| Migration 0001 | `leads`, `opspilot_waitlist`, `notification_outbox`, `rate_limits`, constraints/indexes |
| Migration 0002 | Separate `waitlist_notification_outbox`; preserves existing records; no historical backfill |
| Production public build inputs | Real `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, verified `NEXT_PUBLIC_CONTACT_EMAIL`, `DEPLOYMENT_ENV=production` |
| Optional public inputs | Approved founder name, HTTPS booking URL, approved analytics token; absence is supported |
| Runtime vars | `DEPLOYMENT_ENV=production`, `TURNSTILE_HOSTNAMES` containing apex/www and the verified production Worker hostname during pre-cutover verification |
| Runtime secrets | `TURNSTILE_SECRET_KEY`, fresh production `RATE_LIMIT_SALT`, `BREVO_API_KEY`, unchanged verified `EMAIL_FROM`, authorized `LEAD_NOTIFICATION_TO`, fresh `RETRY_SECRET` |
| Optional binding | `CONVERSIONS` Analytics Engine only if separately approved/configured; absent returns 204 without event storage |

The generator writes runtime hostname vars only, never secrets. Public build values are embedded and require rebuilding when changed. Never put server secrets under `NEXT_PUBLIC_*`. Production D1, Turnstile, salt, retry secret, and notification operations must be separated from staging. Do not copy production customer data into a preview.

## Future resource-changing steps: approval required, NOT executed

1. Owner authorizes provisioning and verifies the target Cloudflare account. Create the production D1 using the command below; copy the actual returned ID privately into the GitHub **production** environment variable `PRODUCTION_D1_DATABASE_ID`. Never substitute the existing all-zero ID.

```powershell
# CREATES A REMOTE DATABASE. Do not run during preparation.
npx.cmd --no-install wrangler d1 create infravel-production
```

2. Create/confirm the separate production Worker service in the Cloudflare dashboard without attaching any custom domain. Record its actual workers.dev URL as `PRODUCTION_PREVIEW_URL`. Pages remains untouched. Do not dispatch the workflow until this service and its required secrets exist.
3. Create a production Turnstile widget or approve an existing production-specific widget. Configure allowed hostnames `infravel.dev`, `www.infravel.dev`, and the actual production Worker host for controlled pre-cutover checks. Verify action names `quote` and `waitlist`, correct key pairing, token rejection, and failure behavior. Test keys are refused by release tooling.
4. Verify Brevo sender/domain authorization and SPF/DKIM/DMARC with the account owner. Preserve the existing verified sender; confirm the one business notification inbox. No new recipient or customer auto-email is introduced. Store credentials as Worker secrets, never source variables.
5. Generate local configuration only after collecting real inputs. `Read-Host` values below are public resource/configuration data, not secret values.

```powershell
$env:DEPLOYMENT_ENV = 'production'
$env:PRODUCTION_LAUNCH_PHASE = 'precutover'
$env:PRODUCTION_D1_DATABASE_ID = Read-Host 'Verified production database UUID'
$env:PRODUCTION_PREVIEW_URL = Read-Host 'Actual production Worker HTTPS origin'
$env:NEXT_PUBLIC_TURNSTILE_SITE_KEY = Read-Host 'Production public widget key'
$env:NEXT_PUBLIC_CONTACT_EMAIL = Read-Host 'Owner-approved public contact email'
node scripts/prepare-production.mjs
if ($LASTEXITCODE -ne 0) { throw 'Production input validation failed' }
node scripts/check-production.mjs
if ($LASTEXITCODE -ne 0) { throw 'Generated production configuration failed validation' }
```

6. After separate secret-management authorization, use Wrangler's interactive prompts, one name at a time. Do not supply secret values as command arguments or paste existing sender/recipient values into logs. `secret put` updates remote state; verify the service/config target first and preserve already correct values.

```powershell
# REMOTE SECRET WRITES. Run only for missing or explicitly approved values.
npx.cmd --no-install wrangler secret put TURNSTILE_SECRET_KEY --config .wrangler.production.generated.jsonc
npx.cmd --no-install wrangler secret put RATE_LIMIT_SALT --config .wrangler.production.generated.jsonc
npx.cmd --no-install wrangler secret put BREVO_API_KEY --config .wrangler.production.generated.jsonc
npx.cmd --no-install wrangler secret put EMAIL_FROM --config .wrangler.production.generated.jsonc
npx.cmd --no-install wrangler secret put LEAD_NOTIFICATION_TO --config .wrangler.production.generated.jsonc
npx.cmd --no-install wrangler secret put RETRY_SECRET --config .wrangler.production.generated.jsonc
```

Wrangler secret-name listing can verify presence only, not valid values or authorization. Do not bulk-upload local `.env.local`/`.dev.vars`. Set the production notification retry endpoint and its secret in a separately reviewed scheduler environment; the existing notifications workflow is gated and is not evidence production retries are enabled. The 23-hour retry review window still requires an operator.

## Permissions and GitHub environment

Deployment token: only the approved account, Workers Scripts write, D1 write, and required account/subdomain read access. Confirm exact permissions against the account; account-scoped tokens may still affect other Workers/databases, so do not claim per-service isolation that the token system does not enforce. Do not grant Pages, DNS, or Worker Routes edit to the pre-cutover deployment token. A separate owner-controlled cutover identity needs the applicable zone/domain/route and DNS permissions; never reuse it in the initial workflow.

Before enabling the workflow, configure GitHub `production` required reviewers, selected `staging` branch, prevent self-review/admin bypass where supported, and environment-scoped Cloudflare account/token secrets. Verify repository plan support: a YAML `environment` label alone does not require approval. The `PRODUCTION_PROTECTION_VERIFIED=true` variable is an owner's attestation, not an automatic verification of GitHub policy. See [GitHub environment protections](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments).

Keep repository-level `ENABLE_PRODUCTION_LAUNCH` unset/false now. Only after all approval and backup prerequisites are satisfied may the owner set it and the production-environment attestations. No application secret is stored by the draft workflow.

| GitHub scope | Names |
| --- | --- |
| Repository variable | `ENABLE_PRODUCTION_LAUNCH` (unset/false during preparation) |
| Production environment variables | `PRODUCTION_D1_DATABASE_ID`, `PRODUCTION_PREVIEW_URL`, `TURNSTILE_SITE_KEY`, `CONTACT_EMAIL`, optional `FOUNDER_NAME`, `BOOKING_URL`, `CF_ANALYTICS_TOKEN` |
| Production environment owner attestations | `PRODUCTION_PROTECTION_VERIFIED`, `PRODUCTION_BACKUP_VERIFIED` (true only after actual verification) |
| Production environment secrets | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` |

Application runtime secrets belong on the production Worker, not in the public build inputs. Keep staging and production schedulers separate. The retry script accepts only the exact staging or apex `/api/internal/notifications/retry` URL, with no query/fragment/userinfo and no redirect following. It deliberately does not accept a temporary production Worker URL; pre-cutover authenticated retry testing is a separate owner-controlled action. Do not repoint or overwrite an existing staging scheduler as a shortcut to enabling production retries.
