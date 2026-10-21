# Infravel production launch preparation

## Authorized GitHub publication update

Owner confirms Pages automatic main deployments are disabled and existing production preview integrations work. Authenticated GitHub metadata confirms one required production reviewer, admin bypass disabled, and exactly one main-only branch policy. For the owner-approved solo-founder model, sole required user reviewer `shekhar396` may approve their own deployment (`prevent_self_review=false`). The guard still checks GitHub API protection metadata, rejects missing/substituted/alternative reviewers, requires admin bypass disabled and exactly the main-only branch policy. Manual dispatch and exact approved-SHA checks remain unchanged. This supersedes historical requirements for independent/self-review prevention below. Production variable names verified: CLOUDFLARE_ACCOUNT_ID, TURNSTILE_SITE_KEY, CONTACT_EMAIL, BOOKING_URL, FOUNDER_NAME, ENABLE_PRODUCTION_RELEASE; production secret name CLOUDFLARE_API_TOKEN is present. Values were not printed. The environment-scoped release flag is checked inside the approved job, not in its pre-environment job condition.

Workflow is now `.github/workflows/production-release.yml`, manual main-only with exact-SHA/environment gates; legacy initial-migration draft remains disabled. Publication to staging and PR creation are owner-authorized; merging, Worker deployment and live routing changes remain unauthorized. No Pages configuration or automatic Pages deployment is introduced by the PR. Earlier inactive-workflow and unverified-reviewer statements below are historical. Focused workflow/configuration checks, lint, TypeScript and unit/integration tests passed before publication.


## Latest release handoff

Owner confirms production preview, quotation/email and OpsPilot work. Main release pipeline is prepared in `.github/workflows/production-release.yml.disabled` (manual main-only, production reviewers, exact SHA, preserved DB/secrets/routing); it has not been published or activated. Lint, TypeScript and 102 tests passed. See the current main-release section of [deployment runbook](deployment-runbook.md) for exact PR/merge/dispatch instructions and [cutover and rollback](cutover-and-rollback.md) for future owner-only hostname API commands. This supersedes the historical staging-production workflow activation plan below.

**Main is not yet cleared for publication:** live Pages Git auto-deployment settings and GitHub reviewer/branch protections remain unverified from this environment. No repository Action directly deploys Pages on push, but the independently configured Pages Git integration can overwrite Coming Soon when main changes. Owner must first approve pausing/verify paused Pages automatic production builds while preserving its existing deployment, then configure the production environment for main. The new workflow checks both settings and fails closed, but cannot prevent an external Pages build caused by the initial main push. No remote change, PR publication, merge, commit, push, Worker deployment or cutover was performed.

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


Prepared locally on `staging`, 21 October 2026. Baseline: approved design commit `7d2d2e38d5a28e76bcfe925d23d540bc31681ffb`. No commit, push, merge, remote provisioning/migration, secret update, deployment, DNS/route change, Pages change, or Coming Soon interruption was performed.

**Recommendation: NO-GO for launch. Readiness: 50/100.** This is an evidence-based release checklist score, not a security certification or availability prediction.

| Area | Score | Evidence / gap |
| --- | --- | --- |
| Application safeguards | 18/20 | Protected submissions, validated input, atomic outboxes, fenced retries; inherited uncertain-send duplicate risk remains |
| Local verification | 18/20 | Tests/builds and owner-authorized npm audit passed; remote runtime/CI not established |
| Production infrastructure | 2/20 | Isolated template prepared; no real production D1/Worker/binding verified |
| Release controls | 8/20 | Manual workflow drafted but disabled; public GitHub inventory confirms the production environment is missing |
| Business/cutover/recovery | 4/20 | Runbooks prepared; legal/business approval, domain state, backup restoration, and live integration evidence missing |

## Launch blockers

Latest scoped D1 setup attempt: authentication/account verification failed; remote work stopped before D1 listing or creation. No production UUID or configuration was generated. See [D1 preparation and migration review](d1-preparation.md). Owner reports www HTTPS is now working; the earlier 525 observations below are historical and were not rechecked in this attempt.

1. Production D1 ID in the existing `wrangler.jsonc` is still all zeros. Do not use its `--env production` path. New production tooling requires an owner-confirmed separate ID and Worker origin; no IDs were invented.
2. Authenticated Cloudflare account ownership, Pages attachments, configured DNS targets, Worker routes, D1 existence and secret/migration state remain **unverified** because the available session is expired. The subsequent [read-only inventory](inventory.md) verified public DNS and apex HTTP 200, but observed **www HTTPS 525 twice**. Confirm the real live/rollback baseline; the apex HTML had no Coming Soon marker or Next.js assets. No live repair was attempted.
3. Public GitHub GETs confirmed the repository is public with default branch `main`; the complete environment listing contains only `staging`. The `production` environment is **missing**, so its required approval rules are not configured. Set up protections only under separate owner authorization; `.github/workflows/production-launch.yml.disabled` and the launch flag remain unchanged.
4. Resolved audit gate: after explicit owner approval, the configured registry was verified as `https://registry.npmjs.org/` and `npm audit --audit-level=high` completed against that registry with exit code 0 and **0 vulnerabilities** on 21 October 2026. Only standard dependency audit metadata was submitted; no source code, secrets, environment files, or customer data was uploaded. No dependency changes or `audit fix` occurred. Repeat this gate for the eventual reviewed release; the remaining infrastructure, integration, governance, and business blockers still make launch NO-GO.
5. Production Turnstile, verified Brevo sender/recipient, D1 persistence, both notification types/retries, backup restore, and scheduling need live evidence after separate authorization. Local tests mock external providers.
6. Public business/privacy contact and legal drafts require owner review. Local `.env.local` has a site key with no recognized test-key prefix, but no public contact email or `DEPLOYMENT_ENV`; `.dev.vars` is absent. No values were printed. These local observations do not establish remote configuration validity.

## Prepared material

- [Read-only production inventory and exact remaining verification steps](inventory.md)
- [Configuration and infrastructure checklist](configuration-checklist.md)
- [Deployment runbook](deployment-runbook.md)
- [Domain cutover and rollback](cutover-and-rollback.md)
- [Security and business/legal review](security-review.md)

The isolated configuration is **pre-cutover only**: production Worker at its owner-confirmed `workers.dev` URL, no live routes, no Pages operation, and no scheduled triggers. Production-preview HTTP responses remain `noindex` even with production build settings. The live apex domain becomes indexable only in a separately prepared production build/runtime, after the routing and legal checks pass.

## Complete changed-file inventory

- `.gitignore`: excludes generated deployment config and local backup directory.
- `wrangler.production.template.jsonc`: inert isolated Worker/D1 template, empty resource ID, no live routes.
- `scripts/prepare-production.mjs`: validates explicit owner inputs and generates only a local config; `--check-template` needs no resource inputs.
- `scripts/check-production.mjs`: verifies generated config matches the validated inputs and required migration files exist.
- `scripts/check-production-secret-names.mjs`: inspects names only, never values; makes no remote request itself.
- `scripts/retry-notifications.mjs`: restricts authenticated retries to the exact known staging/apex endpoints, refuses redirects, and logs validated counts only.
- `scripts/check-launch-draft.mjs`: parses and checks the disabled workflow and its activation boundaries.
- `scripts/smoke-production.mjs`: allowlisted, bounded read-only HTTP smoke checks plus an unauthorized retry probe; never creates a lead or sends an email.
- `.github/workflows/production-launch.yml.disabled`: reviewed-SHA/manual/environment/backup gates, lockfile install, audit, tests, explicit production build/config, migration/deploy steps, smoke and fixed failure reporting. Existing executable workflows are unchanged.
- `src/lib/security.ts`: rejects lookalike JSON media types while accepting charset parameters.
- `next.config.ts`: approved www-to-apex 308 redirect preserving path/query; workers.dev noindex header.
- `src/app/privacy/page.tsx`: corrects an unsupported claim that expired rate-limit rows are already automatically deleted.
- `tests/unit/production-release.test.mjs`, `tests/unit/launch-security.test.ts`, `tests/e2e/launch-security.spec.ts`: release isolation, origin restrictions, no-send smoke, media type, SEO/redirect/header regression coverage.
- The six files under `docs/production-launch/`: this README, the four linked runbooks/reviews, and the read-only inventory.

## Actual local verification

| Check | Result |
| --- | --- |
| ESLint | Passed |
| TypeScript | Passed |
| Unit/integration tests | 90 passed across 7 files; all provider requests mocked |
| Next.js production build | Passed; all 30 static generation tasks completed |
| OpenNext Worker build | Passed, including the generated manifest regression check |
| Browser suite | 26 passed on desktop/mobile; local production server, no live redirects followed |
| Template and disabled-workflow validation | Passed |
| Production-resource input validation | Tested in memory with clearly synthetic fixtures; real production inputs unavailable, deliberately not generated/deployed |
| Dependency audit | Passed after explicit owner approval: official npm registry, exit 0, 0 vulnerabilities across all severities; repeat for the release SHA |
| Live account/domain/D1/secrets validation | Not established; no remote changes made |

Later read-only inventory verified public DNS/HTTP and GitHub environment metadata, not authenticated Cloudflare account/resource ownership. See [inventory](inventory.md) for exact verified/missing/unknown distinctions and the existing www 525 finding. No additional application tests were needed for that documentation-only inventory.

The configuration scripts prove shape and separation, not Cloudflare ownership, credential authorization, resource existence, or business approval. Existing Vite/SQLite and Windows OpenNext advisories are not new dependency-audit results. Follow the runbooks only after each applicable approval; stop here for owner review.
