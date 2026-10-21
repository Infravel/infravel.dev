# Consolidated production readiness sprint

Current executable entry point: `.\scripts\production-readiness.ps1 -DeployPreview`. No placeholder parameters are required. The script derives `https://infravel-production.shkhrabdullah.workers.dev` from the configured production Worker name and staging account subdomain; this is not independent confirmation that a production deployment exists. It requests only absent real inputs, checks production credentials before database writes, and reuses completed lint/typecheck/unit verification unless `-RecheckCode` is selected. The actual production build, unresolved audit and remote state checks still run. Only a generic non-test local Turnstile key was found; production widget identity/allowed domains are unverified and that key is not adopted automatically. No Cloudflare API token is available here and Wrangler authentication still fails. Private secret values are never requested in chat or printed. Use production-specific process variables or the script's terminal prompts for the missing inputs.


21 October 2026, `staging`. **NO-GO for live cutover; owner execution required for remote phases.** The owner's latest verification establishes production identity, tested DB binding, an internal-only `_cf_KV` baseline with no migration ledger, and working apex/www. It supersedes older unknown-baseline and domain-error observations. This execution environment still cannot authenticate to Cloudflare (EPERM / fetch failure). No migration, backup export, secret update or preview deployment was performed here.

## One owner execution path

Use PowerShell from this repository with the already authenticated owner session and installed lockfile dependencies. The script is `scripts/production-readiness.ps1`. It does not log secret values, change staging/Pages/DNS/domains, activate workflows, or commit/push. It performs production schema writes and, with `-DeployPreview`, an isolated production Worker upload and optional secret upload under the owner's current sprint authorization.

Before starting:

- Select an existing encrypted, access-controlled backup directory **outside** the repository. The script verifies path separation, export existence/hash, a Time Travel bookmark, and a local in-memory restoration/integrity/schema-baseline check. It cannot verify filesystem encryption or guarantee a remote recovery rehearsal.
- Obtain the actual production `infravel-production.<account-subdomain>.workers.dev` origin and production Turnstile site key. Configure that exact preview hostname in the production Turnstile widget. Keep the verified Brevo sender and authorized business recipient unchanged. Generate independent production salt/retry credentials; do not copy staging secrets.
- For initial secret setup, have the approved credential manager create a private JSON file outside the repository containing exactly six nonempty string keys: `TURNSTILE_SECRET_KEY`, `RATE_LIMIT_SALT`, `BREVO_API_KEY`, `EMAIL_FROM`, `LEAD_NOTIFICATION_TO`, `RETRY_SECRET`. Never paste their values into a command, log or chat. Confirm the widget secret matches the production public key and Brevo sender/recipient are the already approved identities. This file is consumed directly through Wrangler `deploy --secrets-file` after local checks, avoiding an unchecked stub deployment from `secret bulk`. Keep the private file under the credential manager's retention policy.
- Inspect production Worker metadata if it exists: it must have no live custom domains, zone routes or traffic from Pages, and no additional required binding/configuration drift. Record the live Pages deployment ID/URL, both domain attachments, DNS/redirect/certificate state and a viable Pages rollback path. Do not detach or alter them. Only pass the two verification switches below after this review.

Run once (prompts collect public inputs and private file paths, never secret values):

```powershell
Set-Location -LiteralPath 'E:\Professional\Company Group\infravel\infravel.dev'
$backupDir = Read-Host 'Existing encrypted backup directory outside repository'
$previewOrigin = Read-Host 'Verified production Worker workers.dev HTTPS origin'
$productionSiteKey = Read-Host 'Production public Turnstile site key'
$publicContact = Read-Host 'Approved public contact email'
$privateSecretFile = Read-Host 'Private production-only JSON secrets path (outside repository)'
.\scripts\production-readiness.ps1 -BackupDirectory $backupDir -PreviewUrl $previewOrigin -TurnstileSiteKey $productionSiteKey -ContactEmail $publicContact -ProductionSecretsFile $privateSecretFile -PreviewIsolationVerified -ProductionCredentialsVerified -DeployPreview
```

If production secrets already exist and have been privately verified, omit `-ProductionSecretsFile`; the script checks remote names before deploy and preserves existing secrets. Omit `-DeployPreview` and its verification switches to stop after database and local validation. Do not change execution policy to bypass an organizational restriction; use the owner's approved execution environment.

The script pins account/production UUID, validates isolation, verifies both reviewed migration hashes, and accepts either the empty reviewed baseline or an exactly complete two-file ledger. It stops on partial history, untracked schema, failed backup, unexpected records or any command failure. It applies only missing initial migrations through Wrangler, compares resulting schema/index definitions with a local SQLite model built from the reviewed SQL, verifies exact migration history and foreign-key integrity, and requires zero application rows before preview integration tests. It does not call `migrations list` because that command can initialize the ledger. Do not rerun blindly after failure; inspect the recorded remote state first. Concurrent production writers must remain absent during baseline/migration verification.

Local build/test checks run before preview deployment, and the audit checks the official npm registry explicitly without automatic dependency fixes. The preview config has a pinned account, production DB, allowed Turnstile hostnames, `routes: []`, no cron triggers, and workers.dev indexing protection. HTTP smoke sends no form submission or authenticated retry. Existing uncommitted changes are included in the build: review them before deploying; no claim of a binding-only release is made.

## Production GitHub protections

GitHub administrative authentication/reviewer identities are unavailable here. Prepare these in repository Settings -> Environments -> production: required owner/release reviewer, prevent self-review, disallow administrator bypass where supported, and selected deployment branch `staging`. Confirm plan support; if review controls are unavailable, use the manually supervised script and do not represent an unprotected automated workflow as approved. Keep staging credentials separate and use least-privilege production credentials in the production environment only. Store required secret names and public build inputs from the existing configuration checklist; do not copy values into documentation.

The full manual workflow remains `.github/workflows/production-launch.yml.disabled` with explicit SHA, migration, backup and environment gates. It is prepared but not executable. Activation requires a separately approved commit/publication plan: GitHub dispatch requires the definition on the default branch, while publishing changes to main may trigger the existing Pages build. No branch or Pages changes are authorized by this sprint. Manual preview deployment does not require activating that workflow.

## Controlled preview acceptance

After script success, use a browser at the isolated preview only. Submit one clearly marked `RELEASE VERIFICATION - NOT A CUSTOMER` quotation and one fictional waitlist registration with owner-controlled test addresses. Use the real production Turnstile widget with a fresh interactive token for each submission; do not bypass verification or log tokens. These are deliberate synthetic integration records, not real customer leads. Send notification only to the configured authorized inbox. No extra recipient, retry replay or bulk test is permitted.

Verify successful form response, exactly one stored record/outbox per submission, complete fictional email fields and safe reply link, verified sender/recipient, sent status, and no duplicate message. Read only synthetic IDs/counts/status for this evidence, never unrelated customer rows. Test Turnstile failure with an invalid token and verify no lead is created; rate limiting may still create technical counters. Record the synthetic IDs privately; do not automatically delete or reset data. Unit tests cover mocked notification retries; genuine retries need a controlled failed synthetic delivery, not replay of already sent notifications.

Verify representative pages/mobile, security headers, legacy redirects, 404, canonical/sitemap URLs, and workers.dev `noindex`. The www-to-apex production redirect cannot be proven against workers.dev; test it after separately approved routing. Live apex/www must continue serving the existing Pages site throughout preview. A successful smoke test is not proof of email/Turnstile validity; record browser and inbox evidence before launch GO.

## Final cutover procedure - separate approval only

1. Require successful schema/secret/preview integration evidence, recovery evidence, the preserved Pages deployment and routing snapshot, and explicit owner cutover approval. Stop production automation that could race the change. Do not delete Pages or either database.
2. Use the live inspected DNS/custom-domain state to execute [cutover and rollback](cutover-and-rollback.md), section C: release only each hostname's conflicting Pages attachment/record if required, then attach it to **infravel-production** via Worker Custom Domains. Review Cloudflare's proposed record changes before confirming. No guessed DNS target or generic record replacement is safe.
3. Wait for both domain/certificate statuses to be active. Verify apex HTTPS 200 and www 308 preserving path/query, HTTP-to-HTTPS without loops, apex indexable while workers.dev remains noindex, and representative pages/forms. The exact live smoke command is `node scripts/smoke-production.mjs` with `PRODUCTION_PREVIEW_URL=https://infravel.dev` and `PRODUCTION_SMOKE_MODE=live`.
4. On failure, restore only the recorded Pages hostname attachments/DNS/routing to the preserved deployment and verify the original site. Preserve accepted production data; never automatically restore D1 to fix a routing or code failure. D1 recovery requires a separate incident decision because it discards later writes.
5. Record real live routing in durable production configuration before subsequent deploys; do not reuse the empty-routes preview config blindly. Keep the old Pages deployment available through the agreed monitoring window.

The exact hostname replacement operations depend on the authenticated routing snapshot, unavailable here. The runbook specifies the control-plane procedure without inventing record IDs or promising zero interruption.

## Actual results and remaining owner actions

- Local lint, TypeScript, release/configuration checks and unit/integration tests passed; Worker/Next build and manifest regression passed using staging/test public inputs. This is not a validated production artifact.
- Official registry verification passed. This sprint's audit failed because the network endpoint was unavailable; earlier zero-vulnerability evidence is historical. Owner script repeats the audit and stops on failure.
- PowerShell syntax validation passed; remote execution and provider responses could not be exercised. Schema verifier tests reject missing indexes and unexpected application objects.
- Owner actions: execute the consolidated script with verified production inputs/private credentials; configure GitHub production protections before automated releases; provide controlled preview/inbox evidence and routing/rollback snapshot. No additional infrastructure audit is required if those gates pass.

No live launch, database migration, secret provisioning, production preview deployment, commit, push or final cutover was performed in this environment.
