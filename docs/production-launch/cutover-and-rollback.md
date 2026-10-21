# Pages-to-Workers cutover and rollback

Current owner evidence supersedes the historical inventory below: the production preview and quotation/email/waitlist functions work, and both live hostnames work. No routing changes have been made by the agent. See the current main-release section in [deployment runbook](deployment-runbook.md) before merging: Pages Git auto-deployment must first be paused under owner authorization.

## Exact owner API commands - future cutover authorization only

Do not execute these commands during preparation. Use a separate privately supplied cutover token with the required Pages/DNS/Worker-domain permissions; the GitHub release token must not have DNS write permissions. First preserve the live Pages deployment and original DNS. This procedure stops rather than deletes any record whose identity/target is unexpected. Cloudflare control-plane/certificate changes can interrupt traffic; the rollback operator must be present.

```powershell
$cutoverAccount = 'f6d4cc93a61d7012130cfbd39b3a84fd'
$cutoverHeaders = @{ Authorization = "Bearer $env:CLOUDFLARE_API_TOKEN" }
function CfRelease([string]$Method, [string]$Path, $Body = $null) {
  $request = @{ Method=$Method; Uri="https://api.cloudflare.com/client/v4$Path"; Headers=$cutoverHeaders; MaximumRedirection=0; ErrorAction='Stop' }
  if ($null -ne $Body) { $request.ContentType='application/json'; $request.Body=($Body | ConvertTo-Json -Depth 20 -Compress) }
  try { $response = Invoke-RestMethod @request; if (-not $response.success) { throw 'API failure' }; return $response.result }
  catch { throw 'Cutover API operation failed; stop and inspect privately. Do not rerun blindly.' }
}
$zones = @(CfRelease GET '/zones?name=infravel.dev&per_page=50')
if ($zones.Count -ne 1 -or $zones[0].account.id -ne $cutoverAccount) { throw 'Zone/account identity mismatch' }
$cutoverZone = $zones[0].id
$page = CfRelease GET "/accounts/$cutoverAccount/pages/projects/infravel-dev"
if ($page.source.config.production_deployments_enabled -ne $false -and $page.source.config.deployments_enabled -ne $false) { throw 'Pause Pages Git production builds before cutover' }
$snapshot = @{ ZoneId=$cutoverZone; PagesDeploymentId=$page.canonical_deployment.id; PagesSubdomain=$page.subdomain; Records=@{} }
foreach ($hostName in @('infravel.dev','www.infravel.dev')) {
  $records = @(CfRelease GET "/zones/$cutoverZone/dns_records?name=$hostName&per_page=100")
  if ($records.Count -ne 1 -or $records[0].type -ne 'CNAME' -or $records[0].content.TrimEnd('.') -ne $page.subdomain.TrimEnd('.')) {
    throw 'Expected one exact Pages CNAME per hostname; inspect actual records before any change'
  }
  $snapshot.Records[$hostName] = $records[0]
}
$snapshotPath = Read-Host 'Absolute snapshot JSON path in existing private backup directory'
if (Test-Path -LiteralPath $snapshotPath) { throw 'Do not overwrite an existing rollback snapshot' }
$snapshot | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath $snapshotPath
# STOP here unless explicit live cutover approval has now been granted.
foreach ($hostName in @('www.infravel.dev','infravel.dev')) {
  $null = CfRelease DELETE "/accounts/$cutoverAccount/pages/projects/infravel-dev/domains/$hostName"
  $remaining = @(CfRelease GET "/zones/$cutoverZone/dns_records?name=$hostName&per_page=100")
  foreach ($record in $remaining) {
    if ($record.id -ne $snapshot.Records[$hostName].id -or $record.type -ne 'CNAME' -or $record.content.TrimEnd('.') -ne $snapshot.PagesSubdomain.TrimEnd('.')) { throw 'Unexpected DNS after Pages detach; stop' }
    $null = CfRelease DELETE "/zones/$cutoverZone/dns_records/$($record.id)"
  }
  $null = CfRelease PUT "/accounts/$cutoverAccount/workers/domains" @{ hostname=$hostName; service='infravel-production'; environment='production'; zone_id=$cutoverZone }
}
```

Inspect Worker Custom Domains and certificates until both are active; run the section D smoke/redirect/SEO checks. A PUT response alone is not proof of TLS readiness. `www` redirects to apex, so there may be a transitional Coming Soon response until apex transfers. If the read-only snapshot differs from the narrowly supported CNAME case, stop and use the reviewed dashboard procedure in section C; never invent or delete an A/AAAA target.

Rollback after separate owner incident approval, using the same helper and saved snapshot (no D1 restore):

```powershell
$saved = Get-Content -LiteralPath $snapshotPath -Raw | ConvertFrom-Json
$cutoverZone = $saved.ZoneId
foreach ($hostName in @('infravel.dev','www.infravel.dev')) {
  $workerDomains = @(CfRelease GET "/accounts/$cutoverAccount/workers/domains?zone_name=infravel.dev")
  $matches = @($workerDomains | Where-Object { $_.hostname -eq $hostName -and $_.service -eq 'infravel-production' -and $_.zone_id -eq $cutoverZone })
  if ($matches.Count -gt 1) { throw 'Ambiguous Worker domain identity' }
  foreach ($entry in $matches) { $null = CfRelease DELETE "/accounts/$cutoverAccount/workers/domains/$($entry.id)" }
  $domains = @(CfRelease GET "/accounts/$cutoverAccount/pages/projects/infravel-dev/domains")
  if (-not @($domains | Where-Object name -eq $hostName).Count) { $null = CfRelease POST "/accounts/$cutoverAccount/pages/projects/infravel-dev/domains" @{ name=$hostName } }
  $original = $saved.Records.PSObject.Properties[$hostName].Value
  $existing = @(CfRelease GET "/zones/$cutoverZone/dns_records?name=$hostName&per_page=100")
  if ($existing.Count -eq 0) {
    $null = CfRelease POST "/zones/$cutoverZone/dns_records" @{ type=$original.type; name=$original.name; content=$original.content; ttl=$original.ttl; proxied=$original.proxied }
  } elseif ($existing.Count -ne 1 -or $existing[0].content -ne $original.content -or $existing[0].type -ne $original.type -or $existing[0].proxied -ne $original.proxied) {
    throw 'DNS conflict during rollback; stop for owner reconciliation'
  }
}
```

Confirm the Pages canonical deployment still equals the saved known-good ID, both Pages domains/certificates are active, HTTPS serves Coming Soon, and no other Worker route intercepts requests. If a new Pages deployment unexpectedly exists, stop and select the saved known-good deployment through the dashboard rollback action. Preserve production Worker versions, D1 and accepted submissions. All commands above are prepared only, not executed.

Inventory update: [public/read-only observations](inventory.md) now show apex HTTP 200, www HTTPS 525 twice, and no Coming Soon marker in the fetched apex HTML. The earlier owner-reported Coming Soon baseline below is not independently established as the current rollback deployment. Authenticated Pages/DNS/Worker state remains unavailable; confirm the actual serving deployment before any cutover or rollback action.

**PLAN ONLY. Separate owner approval is required for every live-domain change.** Current state comes from the owner's report: Pages project `infravel-dev` serves Coming Soon at `infravel.dev` and `www.infravel.dev`; staging works. Authenticated account/DNS/domain configuration is still unverified; public response checks are recorded in the inventory update above. Preserve that Pages project and its known-good deployment throughout.

## A. Ownership and conflict record (read-only)

Before scheduling a window, record the account/zone, registrar/nameserver control, current apex/www DNS types/targets/proxy state, Pages domain attachments/verification, exact known-good Pages deployment/pages.dev URL, TLS mode/certificate coverage, redirect rules, origin rules, and any Workers route/custom-domain entries. Inspect both hostnames separately. Check Pages Git integration and automatic builds before any future default-branch push. Export the current zone/routing settings securely and assign an operator who can restore them.

Resolve DNS and inspect HTTPS without following redirects blindly:

```powershell
Resolve-DnsName infravel.dev
Resolve-DnsName www.infravel.dev
curl.exe --head --max-redirs 0 https://infravel.dev/
curl.exe --head --max-redirs 0 'https://www.infravel.dev/services?source=review'
```

Ubuntu equivalents:

```bash
dig infravel.dev
dig www.infravel.dev
curl --head --max-redirs 0 https://infravel.dev/
curl --head --max-redirs 0 'https://www.infravel.dev/services?source=review'
```

These are network reads, not proof of Cloudflare ownership or routing configuration. Do not save raw authenticated API objects, cookies, or authorization headers in the release report.

## B. No-traffic readiness gate

Require production Worker workers.dev verification, all application migrations, required runtime secrets/hostname allowlists, complete real form/email checks, environment protection, security audit, reviewed legal content/contact details, verified backup/restore evidence, rollback operator, and explicit cutover approval. Record the deployed Worker version, reviewed release SHA, schema versions, and the Pages deployment to restore. Leave the Pages project attached until this gate passes.

The temporary production Worker URL remains noindex. Confirm production-mode metadata/robots separately for the intended apex host and keep staging noindex. Account ownership, plan limits, CPU/request budgets, D1 capacity, alerting, and notification scheduling must be suitable for real traffic. A successful build is not evidence of these properties.

## C. Owner-executed routing activation

1. Agree a low-traffic window, stop unrelated deployments, freeze Pages automatic-build changes through a separately approved action if needed, and ensure the rollback operator is present. Do not delete the Pages project, its deployment, staging, or either database.
2. Recheck apex/www conflicts. Cloudflare Worker Custom Domains require an active owned zone and cannot be created on an existing CNAME hostname. The exact replacement steps depend on the inspected records; do not invent DNS targets or assume that editing a CNAME alone detaches Pages. See [Cloudflare Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/).
3. In the owner-approved order, release the relevant Pages custom-domain attachment and resolve only its conflicting DNS record if Cloudflare requires it. Preserve the recorded original. Attach the hostname to **infravel-production**, not `infravel-staging`, via Worker Settings → Domains & Routes → Add → Custom Domain. Review any DNS changes Cloudflare proposes before confirming.
4. Prefer validating `www` first in a controlled window, then apex, if the inspected routing state supports it. The new application redirects www to the apex with 308 while retaining path and query; until apex moves, redirected traffic will still reach Coming Soon. If this transitional state is unacceptable, perform both attachments in one window. Do not promise uninterrupted service or choose the order without inspecting the account.
5. Wait for both hostname/certificate states to be active. Verify HTTPS chain/hostname coverage and HTTP-to-HTTPS behavior; configure any required edge HTTPS redirect only under this separate approval. Do not weaken TLS or HSTS to hide a certificate error. Check both `http://` and `https://` versions and ensure no loop between Pages, edge rules, and the application canonical redirect.
6. Disable the pre-cutover workflow flag immediately after successful activation. Its generated `routes: []` configuration is **not for subsequent live deployments**. Review/record the real custom-domain routing in a durable production configuration before a future release; an empty-routes redeploy could conflict with externally managed routing. The launch token intentionally has no DNS/route write permissions.

The plan follows the platform's [Pages-to-Workers migration guidance](https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/), with an explicit preserved Pages rollback path. No DNS/custom-domain/Pages mutation commands are hidden in the draft workflow.

## D. Post-cutover read-only checks

```powershell
$env:PRODUCTION_PREVIEW_URL = 'https://infravel.dev'
$env:PRODUCTION_SMOKE_MODE = 'live'
node scripts/smoke-production.mjs
if ($LASTEXITCODE -ne 0) { throw 'Live smoke failed: start the incident/rollback decision' }
curl.exe --head --max-redirs 0 'https://www.infravel.dev/services?source=review'
curl.exe --head --max-redirs 0 http://infravel.dev/
curl.exe --head --max-redirs 0 http://www.infravel.dev/
```

```bash
PRODUCTION_PREVIEW_URL=https://infravel.dev PRODUCTION_SMOKE_MODE=live node scripts/smoke-production.mjs
curl --head --max-redirs 0 'https://www.infravel.dev/services?source=review'
curl --head --max-redirs 0 http://infravel.dev/
curl --head --max-redirs 0 http://www.infravel.dev/
```

Expected www response: 308 to `https://infravel.dev/services?source=review`. Check representative pages, contact/waitlist usability, image/icon/OG assets, canonical/sitemap URLs, robots and absence of apex noindex, security headers, legacy redirects, unknown-route 404, and retry endpoint 401 without authentication. Inspect Cloudflare error rates and database/outbox counts without logging customer fields. Genuine form/email post-cutover checks require the owner's explicit controlled-test authorization; do not infer them from a GET smoke.

Observe through the agreed initial monitoring window. Do not discard rollback resources merely because one browser loaded the homepage. State the observer, time, deployed version, and unresolved issues in the release record.

## E. Rollback decision and steps

Rollback triggers include sustained 5xx/runtime initialization failures, failed real form persistence, wrong database/sender/recipient, unacceptable duplicate notifications, security exposure, redirect loops, or certificate/domain activation failure. Stop changes and inform the owner immediately. For confirmed data exposure, restrict access and preserve evidence; a cosmetic Pages rollback alone is insufficient.

1. Owner authorizes rollback. Disable the production launch and notification retry automation gates to prevent competing changes. Preserve production D1, outboxes, accepted submissions, Worker versions, and logs under access controls. Do not delete or truncate data.
2. If only the Worker version is defective and schema is compatible, restore a previously verified production Worker version through the account's rollback mechanism. No automatic rollback command is prepared with a guessed version ID. Initial launch may have no previous production Worker version, so the Pages fallback must remain usable.
3. For Pages fallback, detach **only** the newly attached production Worker custom domains/routes as appropriate to the recorded configuration. Reattach the original apex/www hostnames to Pages project `infravel-dev`, selecting the preserved known-good deployment. Restore the exact recorded DNS/redirect state using the dashboard's required procedure and confirm ownership/certificates again. Do not replace unrelated mail/TXT/DNS records or remove the zone.
4. Verify HTTPS and the original Coming Soon response on apex/www, DNS resolution, redirect behavior, and absence of a route still intercepting the Pages origin. Preserve the production Worker for diagnosis; do not delete it or its database.
5. Do not roll D1 back merely because traffic returns to Pages. Reconcile every accepted lead and queued notification, especially uncertain provider acceptance. A database restore can discard legitimate writes and needs a separate incident decision, fresh export, tested restore target/bookmark, and reconciliation plan.

Potential interruption: hostname release/re-attachment, routing propagation, browser DNS caches, certificate activation, and cached permanent redirects can produce mixed responses or temporary failures. DNS TTL does not bound Cloudflare's control-plane or certificate completion time. No zero-downtime guarantee is made; retain the old Pages service and an agreed interruption/rollback threshold.
