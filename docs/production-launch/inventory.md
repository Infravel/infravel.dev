# Read-only production inventory

## Consolidated sprint - latest status

Owner verified the production identity/binding, internal-only `_cf_KV` baseline with no migration ledger, and working apex/www. These facts supersede older unknown-baseline/domain-failure observations. Current authorization covers guarded production backup/migrations, secret setup and isolated preview, but not live cutover, Pages/DNS changes, commits or pushes.

Cloudflare authentication still fails in this environment. No remote phase was executed. Use the single owner-executable `scripts/production-readiness.ps1` and [consolidated readiness report](readiness-sprint.md) for parameters, guards, integration checks and final cutover/rollback procedure. Local account-pinned generation support and schema comparison are prepared. Launch remains NO-GO until the owner script and controlled integration checks succeed. The current npm audit could not reach the official endpoint; historical zero-vulnerability results do not substitute for that release gate. Production workflow remains disabled.


## Isolation remediation ? current local state

The root configuration now contains exactly one D1 binding: `DB` to staging UUID `d7229cbc-7449-4448-ab82-e814728b66d4`. Removed the unused `infravel_production` binding (`remote: true`) and obsolete nested production environment. This supersedes older exposure/placeholder statements below.

Root cause: a production database binding was placed in the default staging configuration rather than the separate production administration file. The originating command/operator cannot be established from the local diff. No application, script or workflow consumed that binding name; only the new negative regression fixture references it. Application code uses `DB`, but the extra binding was still a capability available to a deployed staging Worker and to authenticated local development using remote bindings. See [Cloudflare D1 local development](https://developers.cloudflare.com/d1/best-practices/local-development/). There is no evidence here that production data was accessed.

`assertStagingIsolation` now rejects extra bindings, substituted UUIDs, remote development overrides and nested environment configurations. Both staging and D1 validators invoke it; CI runs its regression tests through `npm test`. Staging deployment is restricted to `refs/heads/staging` and explicitly selects `wrangler.jsonc` for migration/deployment. Previously its manual dispatch lacked a branch guard and its D1 checks inspected only the first binding. CI and local runtime workflows contain no production deployment command. The retry workflow is an HTTP operation rather than a deployment: if separately enabled and pointed at the live apex, it can mutate the live notification outbox/send email. Its remote flag/URL were not inspected or changed.

Production administration commands in the runbook and inactive production workflow now use only `wrangler.production.d1.jsonc`; the inactive migration steps also validate it first. The future full Worker deployment still uses the generated application configuration. The production workflow remains `.disabled` and was not activated.

Local verification: lint, TypeScript, staging gate, D1 validator, deployment-template validator, disabled-workflow validator and release/isolation tests passed. No Wrangler remote command, migrations, deployment, secret change or database query occurred. Production database IDs remain owner-verified; existing deployed staging bindings are **not** established by local remediation. A prior deployment could retain the unwanted binding until a separately approved staging update removes it. Inspect deployed binding metadata read-only when authorized access is available; never infer live isolation from this local change. Limit staging credentials to staging resources where supported; no credential permissions were changed. Locally privileged operators can still explicitly select the production administration config. Production migration/runtime readiness remains pending.

Changed for isolation: `wrangler.jsonc`, `scripts/staging-isolation.mjs`, `scripts/check-staging.mjs`, `scripts/check-production-d1.mjs`, `tests/unit/staging-isolation.test.mjs`, `.github/workflows/staging.yml`, inactive production workflow, and production launch documentation including database administration commands in the deployment runbook. No application code changes.


## Latest owner-verified D1 update

Owner verified account `f6d4cc93a61d7012130cfbd39b3a84fd` and production D1 `infravel-production` / `ad4400ff-0e66-45e5-be77-f182cf4cb449`. Production differs from staging `d7229cbc-7449-4448-ab82-e814728b66d4`. Local `wrangler.production.d1.jsonc` pins the account and production `DB`; `node scripts/check-production-d1.mjs` passed. This supersedes historical unknown-D1/blocked-configuration statements below, but does not establish fresh agent-authenticated remote evidence.

Root staging configuration already contains an extra production binding with `remote: true`; preserved and flagged for owner review. The full deployment config is still blocked on verified runtime/build inputs. No migrations, secrets, deployments or remote changes occurred. See [current D1 preparation report](d1-preparation.md) for exact migration commands and remaining risks. Launch remains NO-GO; prior inventory results below are historical.


Subsequent owner-authorized D1 preparation also stopped at failed authentication, before listing/creation. See [D1 preparation](d1-preparation.md). Owner now reports www HTTPS working; preserve the 525 results below as historical observations rather than a fresh availability claim.

21 October 2026. Working branch: `staging`. This inventory used local configuration reads, public DNS queries, unauthenticated HTTP GETs, GitHub public metadata GETs, and one unsuccessful `wrangler whoami` check. No resource was provisioned, migrated, deployed, rerouted, or changed. No credential values were printed. Earlier uncommitted preparation changes are preserved.

**Recommendation remains NO-GO.** The safest next step is owner-assisted authenticated Cloudflare inventory, not creation of a new database or domain cutover.

## Verified, missing, and unknown

| Item | Verified evidence | Status / owner action |
| --- | --- | --- |
| Account and zone ownership | DNS delegates to `olga.ns.cloudflare.com` and `giancarlo.ns.cloudflare.com` | Cloudflare DNS delegation verified; account/zone association and authorized ownership **not verified**. Confirm the active zone/account in an authenticated session |
| Apex public DNS | A: `104.21.39.103`, `172.67.144.52`; AAAA: `2606:4700:3031::6815:2767`, `2606:4700:3032::ac43:9034` | Public answers verified. Configured record type/content/proxy settings and origin remain unknown |
| www public DNS | Same public A/AAAA answers as apex; no CNAME answer was returned by the public query | Do not infer a missing CNAME: Cloudflare proxying/flattening can hide the configured target. Inspect actual zone DNS records |
| Apex HTTPS | HTTP 200 on two GETs; title `Infravel \| DevOps, CI/CD & Observability Engineering` | Response contains no recognized Coming Soon marker, `/_next/` asset reference, or approved `/brand/infravel-lockup.webp` URL. Confirm the actual deployed rollback baseline; this does not establish which project serves it |
| www HTTPS | HTTP **525** on two GETs | Existing live endpoint error observed. Owner must inspect its TLS/origin/custom-domain association before any launch; no repair attempted |
| HTTP redirects | Apex HTTP → 301 `https://infravel.dev/`; www HTTP → 301 `http://infravel.dev` | www HTTP currently takes a different path from www HTTPS. Record edge rules and avoid assuming canonical redirect consistency |
| Pages project `infravel-dev` and custom domains | Owner-reported only | **Unverified**, not missing. Confirm project, deployment ID, production branch, domain/certificate status, and current apex/www attachments |
| Workers, custom domains, zone routes | Local config names `infravel-staging` and proposed `infravel-production` | Remote existence/attachments **unknown**. Inspect account Worker list, account custom domains and zone routes; do not infer them from DNS/HTML |
| Separate production D1 | No authenticated D1 listing available | **Unknown whether it already exists. Do not create a duplicate**. Inventory all relevant account pages and confirm intended database identity/isolation |
| Legacy production configuration | `wrangler.jsonc` still contains the all-zero production D1 ID | Verified placeholder; not deployable. Its staging D1 UUID is only a local configured value, not a remote existence check |
| Prepared isolated configuration | `wrangler.production.template.jsonc` has empty `database_id`, `routes: []`; generated `.wrangler.production.generated.jsonc` is absent | Verified intentionally incomplete template, not a missing remote resource. Do not fill it until the real production database is identified |
| GitHub repository | Public API returned 200: `Infravel/infravel.dev`, public, default branch `main` | Verified public repository metadata |
| GitHub production approval environment | GET environment `production` → 404; complete public environment listing → 200, `total_count: 1`, only `staging` | **Production environment is missing in the observed public repository metadata**. Required production reviewers/branch protections therefore are not configured on that environment |
| Existing staging environment | Public listing: `protection_rules: []`, `deployment_branch_policy: null` | No environment protection rules/branch policy reported. This is distinct from any uninspected repository-wide branch protection |
| Production workflow | Local `.github/workflows/production-launch.yml.disabled`; local validator passes | Still inert. No workflow or approval protection was enabled |

Public DNS and HTTP are snapshots from this execution environment, not proof of legal domain ownership, Cloudflare account membership, origin target, worldwide availability, or configured record types. No Cloudflare resource can be declared absent from the failed authenticated inspection.

Cloudflare documents 525 as an SSL handshake failure between its edge and the origin. The observed status supports investigating TLS/origin/domain association, but does not identify the specific cause or authorize a change. See [Cloudflare Error 525](https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-5xx-errors/error-525/).

GitHub permits public environment metadata reads without authentication. The successful complete listing, together with the specific 404, is stronger evidence than an unauthenticated 404 alone. See [GitHub list environments](https://docs.github.com/en/rest/deployments/environments#list-environments).

## Access limitations

- No Cloudflare API token/account ID or GitHub token was present in the process or loaded local environment; values were never printed. GitHub CLI was unavailable. Public GitHub GETs nevertheless succeeded after network access was authorized.
- Wrangler 4.151.0 reported that its stored authentication had expired and the refresh server could not be reached; it stated stored credentials were left unchanged. Its attempt to write its default profile log also failed with a filesystem permission error. No further authenticated Cloudflare resource queries were attempted after this failure.
- Initial sandboxed HTTP reads failed. Authorized network-only GETs then established the public results above. No token was supplied to those requests; redirects were not followed, response cookies/auth headers were not logged, and only selected metadata/title indicators were retained.
- The owner must use an already valid authorized session or an existing read-only token from the approved secret manager for the remaining inventory. No login, token creation, permission change, or OAuth refresh is prescribed as part of the read-only commands below.

## Exact manual Cloudflare verification

### Dashboard: read-only inspection

1. Select the correct account; inspect account membership/roles and verify with the owner that this is the authorized account. Open Websites → `infravel.dev` → Overview; record active status, zone ID, account ID, nameservers, and registrar/ownership evidence where applicable. Do not edit settings.
2. Workers & Pages → `infravel-dev`: confirm project existence, production deployment ID/pages.dev URL, production branch and build settings. Open Custom domains and record apex/www attachments, verification and certificate status. Do not detach domains or trigger a build.
3. Zone → DNS → Records: filter the two exact hostnames and inspect A/AAAA/CNAME content, proxy state and TTL. Inspect existing redirect/origin rules and SSL/TLS status without editing them; cross-check the www 525 against domain and origin diagnostics.
4. Workers & Pages → Workers: inventory all relevant account pages; inspect `infravel-staging` and any production Worker. Open Settings → Domains & Routes. Also inspect the zone's Workers routes, since those are separate from account custom domains.
5. Storage & databases → D1: inventory names/UUIDs and identify any intended production database, including one with a different name. Confirm account and UUID differ from staging and inspect binding metadata, not customer rows. No migration or query execution is required.

### PowerShell: GET-only API alternative

Prerequisite: an existing authorized read-only `CLOUDFLARE_API_TOKEN` in the process, supplied privately by the owner's credential manager. Do not paste it into commands or enable HTTP tracing/transcripts. Required visibility covers account/zone metadata, DNS, Pages, Workers/custom domains/routes, and D1 metadata. Missing permissions mean **unknown**, not absent.

The following helper performs GETs only, rejects redirects, and suppresses raw API error details. Keep responses assigned; output only the explicit projections below, especially for Pages settings that can contain environment information.

```powershell
if (-not $env:CLOUDFLARE_API_TOKEN) { throw 'Existing authorized read-only token unavailable' }
$cfHeaders = @{ Authorization = "Bearer $env:CLOUDFLARE_API_TOKEN" }
function Get-CfInventory([string]$Path) {
  try {
    $response = Invoke-RestMethod -Method Get -Uri ("https://api.cloudflare.com/client/v4" + $Path) -Headers $cfHeaders -MaximumRedirection 0 -ErrorAction Stop
    if (-not $response.success) { throw 'Read failed' }
    return $response
  } catch { throw 'Cloudflare inventory GET failed; check authorized access privately. No raw response printed.' }
}

$zones = Get-CfInventory '/zones?name=infravel.dev&per_page=50'
$zones.result | Select-Object id,name,status,@{Name='AccountId';Expression={$_.account.id}},@{Name='AccountName';Expression={$_.account.name}}
$cfAccountId = Read-Host 'Owner-confirmed account ID from the zone association'
$cfZoneId = Read-Host 'Confirmed infravel.dev zone ID'
if ($cfAccountId -notmatch '^[a-fA-F0-9]{32}$' -or $cfZoneId -notmatch '^[a-fA-F0-9]{32}$') { throw 'Invalid resource ID format' }
$zone = Get-CfInventory "/zones/$cfZoneId"
if ($zone.result.name -ne 'infravel.dev' -or $zone.result.account.id -ne $cfAccountId) { throw 'Account/zone mismatch' }
$account = Get-CfInventory "/accounts/$cfAccountId"
$account.result | Select-Object id,name

$pages = Get-CfInventory "/accounts/$cfAccountId/pages/projects/infravel-dev"
$pages.result | Select-Object name,subdomain,production_branch
$pageDomains = Get-CfInventory "/accounts/$cfAccountId/pages/projects/infravel-dev/domains"
$pageDomains.result | Select-Object name,status

foreach ($dnsName in @('infravel.dev','www.infravel.dev')) {
  foreach ($recordType in @('A','AAAA','CNAME')) {
    $dns = Get-CfInventory "/zones/$cfZoneId/dns_records?name=$dnsName&type=$recordType&per_page=100&page=1"
    $dns.result | Select-Object name,type,content,proxied,ttl
    $dns.result_info | Select-Object page,total_pages,total_count
  }
}
$workers = Get-CfInventory "/accounts/$cfAccountId/workers/scripts"
$workers.result | Select-Object id,modified_on
$workerDomains = Get-CfInventory "/accounts/$cfAccountId/workers/domains?zone_name=infravel.dev"
$workerDomains.result | Select-Object hostname,service,environment,enabled,zone_name
$routes = Get-CfInventory "/zones/$cfZoneId/workers/routes"
$routes.result | Select-Object pattern,script
$databases = Get-CfInventory "/accounts/$cfAccountId/d1/database?per_page=100&page=1"
$databases.result | Select-Object uuid,name,created_at
$databases.result_info | Select-Object page,total_pages,total_count
```

For every list endpoint, inspect `result_info` and follow all remaining pages/cursors per the endpoint before concluding that a resource is absent. Repeat a paginated GET with `page=2`, etc., where supported; use the dashboard if pagination/permissions are unclear. Names alone do not establish which database is intended for production. The account domain endpoint is distinct from zone routes; see [Cloudflare list Worker domains](https://developers.cloudflare.com/api/resources/workers/subresources/domains/methods/list/).

Only after a production Worker has been identified from metadata, optionally inspect **settings**, never the script-content endpoint. This returns binding metadata; print only the D1 projection, never the entire settings object:

```powershell
$settings = Get-CfInventory "/accounts/$cfAccountId/workers/scripts/infravel-production/settings"
$settings.result.bindings | Where-Object { $_.type -eq 'd1' } | Select-Object name,type,id
```

Adapt the Worker name only to the actual confirmed production service. A 403/404 with incomplete permissions is not a definitive absence check. None of these commands creates a database, reads customer rows, changes a binding, or attaches a domain.

## Exact manual GitHub verification

Public GETs can reproduce the current environment inventory without a token:

```powershell
$ghHeaders = @{ Accept='application/vnd.github+json'; 'User-Agent'='Infravel-read-only-inventory' }
$repo = Invoke-RestMethod -Method Get -Headers $ghHeaders -Uri 'https://api.github.com/repos/Infravel/infravel.dev'
$repo | Select-Object full_name,private,default_branch
$environments = Invoke-RestMethod -Method Get -Headers $ghHeaders -Uri 'https://api.github.com/repos/Infravel/infravel.dev/environments?per_page=100'
$environments | Select-Object total_count
$environments.environments | Select-Object name,protection_rules,deployment_branch_policy
```

Current complete response: one environment, `staging`, with no environment rules/branch policy. The specific `/environments/production` GET returned 404. When a production environment is later separately authorized and configured, verify in repository Settings → Environments → production: required reviewers, prevention of self-review, admin-bypass setting, deployment branches restricted to staging, and required environment-secret **names**, never values. For API verification, GET `/repos/Infravel/infravel.dev/environments/production`; project only `name`, rule types/reviewer counts, self-review setting, bypass setting and branch policy. If custom branch policies are enabled, GET `/repos/Infravel/infravel.dev/environments/production/deployment-branch-policies` and inspect the names/types. Follow pagination. Do not issue PUT/PATCH/POST operations during inventory.

## Required owner actions and safest next step

1. **First, complete authenticated account/zone/Pages/DNS/Workers/D1 inventory using an existing valid session.** Confirm which existing production D1/Worker should be used before considering provisioning. Do not fill the generated config with a guessed UUID.
2. Investigate the existing www 525 and confirm the exact live/rollback deployment. Record proposed corrections for separate approval; do not weaken TLS, change records, or release domains during this inventory.
3. Separately approve/configure the missing GitHub production environment and its reviewer/branch controls before enabling any production workflow. Keep the `.disabled` workflow and launch flag unchanged now. Confirm the default-branch activation plan does not trigger an unwanted Pages build.
4. Reconcile verified resource IDs/hostname/bindings with the prepared template only after ownership and intended separation are established. Any local configuration change or remote setup is a later scoped step; inventory alone authorizes neither.

Local template and disabled-workflow checks passed again. This pass changes documentation only; application tests/builds were not rerun because application/configuration behavior was unchanged. The prior zero-vulnerability audit remains recorded; no new dependency audit or real email/form submission was performed.
