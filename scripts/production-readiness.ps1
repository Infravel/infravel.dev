# Owner execution only. Mutates only production schema/secrets/isolated Worker.
# Never changes Pages, DNS, routes, staging, Git or GitHub configuration.
[CmdletBinding()]
param(
  [string]$BackupDirectory = $env:PRODUCTION_BACKUP_DIRECTORY,
  [string]$PreviewUrl = $env:PRODUCTION_PREVIEW_URL,
  [string]$TurnstileSiteKey = $env:PRODUCTION_TURNSTILE_SITE_KEY,
  [string]$ContactEmail = $env:PRODUCTION_CONTACT_EMAIL,
  [string]$ProductionSecretsFile = $env:PRODUCTION_SECRETS_FILE,
  [switch]$PreviewIsolationVerified,
  [switch]$ProductionCredentialsVerified,
  [switch]$DeployPreview,
  [switch]$RecheckCode
)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
Set-Location -LiteralPath (Split-Path -Parent $PSScriptRoot)
# Derive the URL from existing configured names; never use a made-up suffix.
$template = Get-Content -LiteralPath wrangler.production.template.jsonc -Raw
$configuredStaging = Get-Content -LiteralPath scripts/smoke.mjs -Raw
$workerMatch = [regex]::Match($template, '"name"\s*:\s*"(infravel-production)"')
$subdomainMatch = [regex]::Match($configuredStaging, 'https://infravel-staging\.([a-z0-9-]+\.workers\.dev)')
if (-not $workerMatch.Success -or -not $subdomainMatch.Success) { throw 'Cannot determine configured Worker/subdomain' }
$configuredPreview = 'https://infravel-production.shkhrabdullah.workers.dev'
if (-not $PreviewUrl) { $PreviewUrl = $configuredPreview }
try {
    $previewUri = [System.Uri]::new($PreviewUrl.Trim(), [System.UriKind]::Absolute)
} catch {
    throw "Invalid production preview URL: $($_.Exception.Message)"
}
$previewHostMatch = [regex]::Match($previewUri.DnsSafeHost, '^([a-z0-9-]+)\.([a-z0-9-]+\.workers\.dev)$', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
if (
  $previewUri.Scheme -ne 'https' -or -not $previewUri.IsDefaultPort -or
  $previewUri.UserInfo -or $previewUri.AbsolutePath -ne '/' -or
  $previewUri.Query -or $previewUri.Fragment -or
  -not $previewHostMatch.Success -or
  $previewHostMatch.Groups[1].Value -ne $workerMatch.Groups[1].Value -or
  $previewHostMatch.Groups[2].Value -ne $subdomainMatch.Groups[1].Value
) { throw 'Preview URL must use the production Worker name and the configured workers.dev account subdomain, with HTTPS and no path/query/credentials' }
$PreviewUrl = $previewUri.GetLeftPart([UriPartial]::Authority)
# Generic NEXT_PUBLIC_* values are deliberately not adopted from staging/.env.local.
if (-not $TurnstileSiteKey) { $TurnstileSiteKey = Read-Host 'Verified production Turnstile PUBLIC key (widget must allow the preview hostname)' }
if (-not $ContactEmail) { $ContactEmail = Read-Host 'Approved public contact email' }
if (-not $BackupDirectory) { $BackupDirectory = Read-Host 'Existing encrypted backup directory outside repository' }
if ($DeployPreview -and (-not $PreviewIsolationVerified -or -not $ProductionCredentialsVerified)) {
  $facts = Read-Host 'Confirm no live routes/domains on infravel-production and production-only credentials with unchanged approved sender/recipient: type VERIFIED'
  if ($facts -cne 'VERIFIED') { throw 'Production isolation/credential facts not confirmed; stop' }
}
if ($DeployPreview -and -not $ProductionSecretsFile) {
  $ProductionSecretsFile = Read-Host 'Private production secrets JSON path outside repository (Enter only if production secrets already configured)'
}
function Run([string]$Exe, [string[]]$Arguments) {
  & $Exe @Arguments
  if ($LASTEXITCODE -ne 0) { throw "Command failed: $Exe (stop; do not rerun blindly)" }
}
function WrJson([string[]]$Arguments) {
  if ($Arguments[0] -eq 'secret') {
    $raw = & npx.cmd --no-install wrangler @Arguments --format json
  } else {
    $raw = & npx.cmd --no-install wrangler @Arguments --json
  }
  if ($LASTEXITCODE -ne 0) { throw 'Cloudflare metadata/query failed; stop' }
  return (($raw -join "`n") | ConvertFrom-Json)
}
function Query([string]$Sql) {
  $r = @(WrJson @('d1','execute','DB','--config','wrangler.production.d1.jsonc','--remote','--command',$Sql))
  if ($r.Count -ne 1 -or -not $r[0].success) { throw 'Unexpected SELECT response; stop' }
  return $r[0].results
}
function Test-ProductionWorker {
  # versions list retains Cloudflare's API error code (secret list rewrites it).
  # Capture errors privately; only the exact script endpoint + 10007 means absent.
  $previousPreference = $ErrorActionPreference
  try {
    $ErrorActionPreference = 'Continue'
    $output = & npx.cmd --no-install wrangler versions list --name infravel-production --config .wrangler.production.generated.jsonc --json 2>&1
    $status = $LASTEXITCODE
  } finally { $ErrorActionPreference = $previousPreference }
  $text = ($output | ForEach-Object { $_.ToString() }) -join "`n"
  if ($status -eq 0) {
    try { $null = ConvertFrom-Json -InputObject $text -ErrorAction Stop } catch { throw 'Invalid Worker metadata response; stop' }
    return $true
  }
  $endpoint = '/accounts/' + $env:PRODUCTION_ACCOUNT_ID + '/workers/scripts/infravel-production/versions'
  if ($text.Contains($endpoint) -and $text -match '\[code:\s*10007\]') { return $false }
  throw 'Production Worker lookup failed: authentication, permissions, network or API error; not classified as missing. Stop.'
}
function Assert-PreviewConfiguration {
  $config = Get-Content -LiteralPath .wrangler.production.generated.jsonc -Raw | ConvertFrom-Json
  if ($config.name -ne 'infravel-production' -or $config.account_id -ne $env:PRODUCTION_ACCOUNT_ID -or
      $config.workers_dev -ne $true -or @($config.routes).Count -ne 0 -or
      @($config.PSObject.Properties.Name | Where-Object { $_ -in @('route','custom_domains','env') }).Count -ne 0) {
    throw 'Production configuration is not an account-pinned isolated workers.dev target'
  }
}
if ((& git -c safe.directory='E:/Professional/Company Group/infravel/infravel.dev' branch --show-current) -ne 'staging') { throw 'Must run on staging' }
$env:WRANGLER_SEND_METRICS = 'false'
$env:NEXT_TELEMETRY_DISABLED = '1'
$env:CLOUDFLARE_ACCOUNT_ID = 'f6d4cc93a61d7012130cfbd39b3a84fd'
$env:PRODUCTION_ACCOUNT_ID = $env:CLOUDFLARE_ACCOUNT_ID
$env:DEPLOYMENT_ENV = 'production'
$env:PRODUCTION_LAUNCH_PHASE = 'precutover'
$env:PRODUCTION_D1_DATABASE_ID = 'ad4400ff-0e66-45e5-be77-f182cf4cb449'
$env:PRODUCTION_PREVIEW_URL = $PreviewUrl
$env:NEXT_PUBLIC_TURNSTILE_SITE_KEY = $TurnstileSiteKey
$env:NEXT_PUBLIC_CONTACT_EMAIL = $ContactEmail
$env:PRODUCTION_SMOKE_MODE = 'preview'
# Refuse Cloudflare environment/config selection overrides.
foreach ($key in @('CLOUDFLARE_ENV','WRANGLER_ENV','WRANGLER_CONFIG')) {
  if ([Environment]::GetEnvironmentVariable($key)) { throw "Remove conflicting $key before continuing" }
}
Run node @('scripts/check-production-d1.mjs')
Run node @('scripts/prepare-production.mjs')
Run node @('scripts/check-production.mjs')
Assert-PreviewConfiguration
Run npx.cmd @('--no-install','wrangler','whoami')
# Resolve all missing credentials before any database write or expensive build.
$secretPath = $null
$workerExists = $false
if ($DeployPreview) {
  $workerExists = Test-ProductionWorker
  if (-not $workerExists -and -not $ProductionSecretsFile) {
    $ProductionSecretsFile = Read-Host 'First deployment requires private production secrets JSON path outside repository'
    if ([string]::IsNullOrWhiteSpace($ProductionSecretsFile)) { throw 'New production Worker requires all six production secrets in a private JSON file' }
  }
}
if ($DeployPreview -and $ProductionSecretsFile) {
  $secretPath = (Resolve-Path -LiteralPath $ProductionSecretsFile).Path
  $localRoot = (Get-Location).Path.TrimEnd('\')
  if ($secretPath.StartsWith($localRoot + '\',[StringComparison]::OrdinalIgnoreCase)) { throw 'Production secret file must be outside repository' }
  try {
    if (-not (Test-Path -LiteralPath $secretPath -PathType Leaf)) { throw 'Not a file' }
    $secretObject = Get-Content -LiteralPath $secretPath -Raw | ConvertFrom-Json -ErrorAction Stop
  } catch { throw 'Production secrets JSON cannot be read or parsed; contents withheld' }
  $allowedSecrets = @('TURNSTILE_SECRET_KEY','RATE_LIMIT_SALT','BREVO_API_KEY','EMAIL_FROM','LEAD_NOTIFICATION_TO','RETRY_SECRET')
  if (@($secretObject.PSObject.Properties).Count -ne $allowedSecrets.Count) { throw 'Production JSON must contain exactly the six required secret names' }
  foreach ($entry in $secretObject.PSObject.Properties) {
    if ($entry.Name -notin $allowedSecrets -or $entry.Value -isnot [string] -or [string]::IsNullOrWhiteSpace($entry.Value)) { throw 'Invalid production secret file; values withheld' }
  }
  $secretObject = $null
  $verifiedSecretHash = (Get-FileHash -LiteralPath $secretPath -Algorithm SHA256).Hash
}
if ($DeployPreview -and $workerExists) {
  $secretNames = WrJson @('secret','list','--config','.wrangler.production.generated.jsonc')
  foreach ($key in @('TURNSTILE_SECRET_KEY','RATE_LIMIT_SALT','BREVO_API_KEY','EMAIL_FROM','LEAD_NOTIFICATION_TO','RETRY_SECRET')) {
    if ($key -notin $secretNames.name) { throw "Missing production secret name: $key" }
  }
}
$info = WrJson @('d1','info','DB','--config','wrangler.production.d1.jsonc')
if ($info.uuid -ne $env:PRODUCTION_D1_DATABASE_ID -or $info.name -ne 'infravel-production') { throw 'Database identity mismatch' }
$hashes = @{
  '0001_initial.sql' = '59EA91C790E3BD0BC377B9FE2CDE79C981091B0BD076C441C5AF28CFE6273335'
  '0002_waitlist_notifications.sql' = '27E343E70EC100B7C8FD0FE2B23B52511EBF785FCD0D1FDD469B02242CE47941'
}
$files = @(Get-ChildItem -LiteralPath migrations -Filter '*.sql' -File)
if ($files.Count -ne 2) { throw 'Unexpected migration set' }
foreach ($file in $files) {
  if (-not $hashes.ContainsKey($file.Name) -or (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash -ne $hashes[$file.Name]) { throw 'Reviewed migration bytes changed; stop' }
}
# SQL SELECT only: migrations list can CREATE its ledger in this Wrangler version.
$objects = @(Query 'SELECT type,name,tbl_name,sql FROM sqlite_master ORDER BY type,name;')
$userObjects = @($objects | Where-Object { $_.name -notmatch '^sqlite_' -and $_.name -ne '_cf_KV' })
$complete = $false
if (@($userObjects | Where-Object name -eq 'd1_migrations').Count -eq 1) {
  $ledger = @(Query 'SELECT name FROM d1_migrations ORDER BY id;')
  if (($ledger.name -join ',') -ne '0001_initial.sql,0002_waitlist_notifications.sql') { throw 'Partial/unexpected migration history; stop for reconciliation' }
  $complete = $true
} elseif ($userObjects.Count -ne 0) { throw 'Unexpected untracked schema; stop' }
# Backup path must already be owner-approved encrypted storage outside this repo.
$backupRoot = (Resolve-Path -LiteralPath $BackupDirectory).Path
$repoRoot = (Get-Location).Path.TrimEnd('\')
if ($backupRoot.TrimEnd('\') -eq $repoRoot -or $backupRoot.StartsWith($repoRoot + '\',[StringComparison]::OrdinalIgnoreCase)) { throw 'Backup must be outside repository' }
if (-not (Test-Path -LiteralPath $backupRoot -PathType Container)) { throw 'Backup directory missing' }
$stamp = (Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssfffZ')
$backup = Join-Path $backupRoot "infravel-production-$stamp.sql"
$bookmark = WrJson @('d1','time-travel','info','DB','--config','wrangler.production.d1.jsonc')
if (-not $bookmark.bookmark) { throw 'No recovery bookmark; stop' }
$bookmark | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $backupRoot "$stamp-bookmark.json")
Run npx.cmd @('--no-install','wrangler','d1','export','DB','--config','wrangler.production.d1.jsonc','--remote','--output',$backup)
if (-not (Test-Path -LiteralPath $backup) -or (Get-Item -LiteralPath $backup).Length -eq 0) { throw 'Backup export missing/empty' }
# Restore the export ONLY into an ephemeral in-memory LOCAL SQLite database.
$env:INFRAVEL_BACKUP_VERIFY_PATH = $backup
$env:INFRAVEL_BACKUP_EXPECT_COMPLETE = [string]$complete
@'
const fs = require('node:fs'); const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync(':memory:');
try {
  db.exec(fs.readFileSync(process.env.INFRAVEL_BACKUP_VERIFY_PATH, 'utf8'));
  if(db.prepare('PRAGMA integrity_check').get().integrity_check !== 'ok') throw Error('integrity');
  const tables=db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name <> '_cf_KV'").all().map(r=>r.name).sort();
  const expected=process.env.INFRAVEL_BACKUP_EXPECT_COMPLETE==='True' ? ['d1_migrations','leads','notification_outbox','opspilot_waitlist','rate_limits','waitlist_notification_outbox'].sort() : [];
  if(JSON.stringify(tables)!==JSON.stringify(expected)) throw Error('backup baseline mismatch');
}
catch { console.error('Local backup restoration verification failed; no SQL printed'); process.exitCode=1; }
finally { db.close(); }
'@ | & node
if ($LASTEXITCODE -ne 0) { throw 'Backup restore verification failed; stop before migrations' }
Remove-Item Env:INFRAVEL_BACKUP_VERIFY_PATH
Remove-Item Env:INFRAVEL_BACKUP_EXPECT_COMPLETE
(Get-FileHash -LiteralPath $backup -Algorithm SHA256).Hash | Set-Content -LiteralPath "$backup.sha256"
if (-not $complete) {
  # Recheck immediately before write; unexpected state must not be overwritten.
  $unexpected = @(Query "SELECT name FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' AND name <> '_cf_KV';")
  if ($unexpected.Count -ne 0) { throw 'Baseline changed since backup; stop' }
  Run npx.cmd @('--no-install','wrangler','d1','migrations','apply','DB','--config','wrangler.production.d1.jsonc','--remote')
}
$metadata = WrJson @('d1','execute','DB','--config','wrangler.production.d1.jsonc','--remote','--command','SELECT type,name,tbl_name,sql FROM sqlite_master ORDER BY type,name;')
ConvertTo-Json -InputObject @($metadata) -Depth 20 -Compress | & node scripts/verify-production-schema.mjs
if ($LASTEXITCODE -ne 0) { throw 'Post-migration schema mismatch' }
$ledger = @(Query 'SELECT name FROM d1_migrations ORDER BY id;')
if (($ledger.name -join ',') -ne '0001_initial.sql,0002_waitlist_notifications.sql') { throw 'Migration ledger mismatch' }
if (@(Query 'PRAGMA foreign_key_check;').Count -ne 0) { throw 'Foreign key violations' }
foreach ($table in @('leads','opspilot_waitlist','notification_outbox','waitlist_notification_outbox','rate_limits')) {
  $count = @(Query ("SELECT COUNT(*) AS n FROM " + $table + ';'))
  if ($count[0].n -ne 0) { throw 'Unexpected application records; stop without printing data' }
}
Write-Host 'Production baseline, recovery export, schema, ledger and zero application counts verified.'
if ($RecheckCode) {
  Run npm.cmd @('run','lint')
  Run npm.cmd @('run','typecheck')
  Run npm.cmd @('test')
} else {
  Write-Host 'Reusing completed lint/typecheck/99-test verification. Use -RecheckCode if application, JS scripts, tests or dependencies changed.'
}
$registry = (& npm.cmd config get registry).Trim()
if ($LASTEXITCODE -ne 0 -or $registry -ne 'https://registry.npmjs.org/') { throw 'Unexpected npm registry' }
Run npm.cmd @('audit','--audit-level=high','--registry=https://registry.npmjs.org/')
Run npx.cmd @('--no-install','opennextjs-cloudflare','build','--config','.wrangler.production.generated.jsonc')
Run npm.cmd @('run','check:worker')
if (-not $DeployPreview) { Write-Host 'Database and local checks complete; preview deployment not selected.'; return }
# Credentials were checked before database preparation; no redundant setup loop.
Run node @('scripts/check-production.mjs')
Assert-PreviewConfiguration
if ($secretPath) {
  if ((Get-FileHash -LiteralPath $secretPath -Algorithm SHA256).Hash -ne $verifiedSecretHash) { throw 'Production secrets file changed since validation; stop' }
}
# No live routes in this validated config. Only workers.dev may receive traffic.
if ($ProductionSecretsFile) {
  # Atomic initial upload avoids secret bulk creating an unchecked stub Worker.
  & npx.cmd --no-install wrangler deploy --config .wrangler.production.generated.jsonc --secrets-file $secretPath *> $null
  if ($LASTEXITCODE -ne 0) { throw 'Isolated deployment/secret upload failed; inspect privately, do not rerun blindly' }
} else {
  Run npx.cmd @('--no-install','wrangler','deploy','--config','.wrangler.production.generated.jsonc')
}
$secretNames = WrJson @('secret','list','--config','.wrangler.production.generated.jsonc')
foreach ($key in @('TURNSTILE_SECRET_KEY','RATE_LIMIT_SALT','BREVO_API_KEY','EMAIL_FROM','LEAD_NOTIFICATION_TO','RETRY_SECRET')) {
  if ($key -notin $secretNames.name) { throw 'Post-deployment production secret names incomplete' }
}
Run node @('scripts/smoke-production.mjs')
Write-Host 'Isolated preview deployed and HTTP smoke passed. Complete controlled integration checklist before launch GO. No cutover performed.'
