# Brevo update verification - 18 October 2026

- `npm run lint`: passed after excluding generated `.wrangler/**` bundles from ESLint.
- `npm run typecheck`: passed.
- `npm test`: 34 tests passed across 2 files. Brevo coverage includes request shape and 201/messageId acceptance, 401, 429 with Retry-After, 500, network timeout handling and eight-second abort configuration, retry due-time gating and successful replay, concurrent attempts, expired-lease recovery, stale acknowledgment fencing, D1 acknowledgment rollback, failed bookkeeping, failed claims, missing configuration, and uncertain provider responses.
- `npm run build`: passed. The final OpenNext build also reran the Next build successfully.
- `npm run build:worker`: passed; `.open-next/worker.js` generated. OpenNext warned that Windows is not fully supported; this is bundle verification, not a live Worker runtime test.
- Live Brevo / D1 / Turnstile tests and GitHub scheduling state were not verified. Tests use the existing migration in SQLite and mocked provider responses. The timeout test simulates a transport timeout; it does not wait on a real network request.
- `.env.local` and `.dev.vars` are ignored by Git. No credentials were requested, printed, added to source, or changed. No migration, deploy, DNS change, remote database modification, secret overwrite, commit, or push occurred. Existing forms and styling were preserved; privacy copy now names Brevo.
- Retry activation and exact staging-only secret setup: [staging](staging.md). Uncertain acceptance and possible duplicate sends: [email](email.md). The existing 23-hour review cutoff remains, without a provider deduplication guarantee.

The earlier implementation record below is historical; its browser/security checks were not rerun for this provider update.

# Verification record — 15 October 2026

## Implemented

All requested marketing routes, six typed/priced service pages, responsive navigation, conceptual technical diagrams, reference architectures, OpsPilot early-access registration, three technical articles, legal drafts, metadata/schema/OG image/sitemap/robots, legacy service redirects, configurable booking/email, and conversion events.

Server submissions validate JSON/origin/body limits, honeypot, Zod fields, shared D1 rate limits, and Turnstile success/hostname/action. Leads/outbox persist atomically before email; waitlist duplicates preserve existing profile/consent. Notification retries use atomic SQL leases and fenced acknowledgments with a bounded operational retry window; uncertain acceptance can still lead to duplicates (see email.md). No public lead listing or SaaS dashboard/auth/billing was added.

## Executed checks

| Check                                      | Result                                                                                       |
| ------------------------------------------ | -------------------------------------------------------------------------------------------- |
| ESLint                                     | Passed with TypeScript, React Hooks, and JSX accessibility rules                             |
| Strict TypeScript                          | Passed                                                                                       |
| Vitest                                     | 21 tests passed in 2 files                                                                   |
| Playwright desktop/mobile                  | 14 tests passed; clean-exit run used E2E_BASE_URL against the local server                   |
| Production-server browser subset           | 10 tests passed against next start                                                           |
| Conversion confirmation/privacy assertions | Both desktop/mobile quote tests passed after adding event assertions                         |
| axe WCAG checks                            | No violations in tested homepage/contact/OpsPilot states                                     |
| Viewports                                  | Homepage overflow checks passed at 375, 768, 1024, 1440px; mobile form screenshots inspected |
| Next production build                      | Passed                                                                                       |
| OpenNext Cloudflare build                  | Passed; .open-next/worker.js generated                                                       |
| npm security audit                         | Zero reported vulnerabilities after replacing the vulnerable lint preset and patching glob   |
| Git diff whitespace check                  | Passed; original static HTML/CSS files are unchanged                                         |
| Lighthouse local mobile simulation         | Performance 97, accessibility 100, best practices 100, SEO 66 (intentional staging noindex)  |

See lighthouse-summary.json. Lighthouse is a local simulated measurement, not deployed field evidence. Production indexing/SEO scoring is unmeasured. No guarantee is made about target scores in a real deployment.

## Verification limits / pending configuration

- Cloudflare account/Pages/DNS state was not inspected; Pages evidence comes from the original README.
- Historical 15 October setup had placeholder D1 IDs. Current staging has an existing D1 binding, remotely applied migration 0001, and configured Turnstile per owner context. No remote state was changed or independently verified during the Brevo update.
- Node SQLite executes the real schema and application SQL through a D1 test adapter. Genuine remote D1 behavior and permissions still need staging tests.
- Browser form success explicitly mocks Turnstile and submission APIs. No real lead or email was sent during browser tests.
- Local Wrangler migration failed because the Windows workerd process crashed with an access violation/stack overflow. Validate runtime/migrations in WSL/Linux or staging. OpenNext bundle generation itself passed.
- Wrangler deployment dry-run passed after allowing access to its host configuration directory: 8147.13 KiB bundle / 1988.30 KiB gzip, with expected staging bindings. No upload or deployment occurred. The local workerd runtime/migration failure remains separate from bundle verification.
- Optional Web Analytics, Analytics Engine conversions, booking URL, approved public email/founder details, and notification scheduling need configuration and live verification.
- Privacy/terms are clearly labeled drafts; contracting identity, legal contact, retention, consent procedure, and business copy need owner approval.
- Keyboard/focus behavior and automated accessibility checks are covered in part; a full screen-reader/WCAG audit has not been claimed.
- GitHub workflows were written but not executed remotely. The notification schedule is disabled unless its explicit repository variable is enabled. No production deployment workflow is included.

No commit, push, production deployment, domain reassignment, or DNS change was performed. Original Pages source is preserved. Complete launch-checklist.md before requesting production cutover approval.

## Phase handoff

1. Foundation: package/lockfile, Next/TypeScript/Tailwind/OpenNext/Wrangler config, src/config, layout/styles, audit guide. Builds and type checks passed; account inspection remains manual.
2. Marketing: src/app pages and src/components marketing/layout. Browser routes, navigation, viewports, and axe checks passed; founder/contact details await approval.
3. Lead generation: src/lib, src/app/api, forms, migrations, retry script/workflow. SQL-backed integration tests passed; real D1/Turnstile/email await credentials and Linux/staging verification.
4. Product/content: OpsPilot, insights content/templates, legal pages. Browser route/waitlist UI tests passed; legal drafts and product copy require business review.
5. Readiness: tests, CI/staging workflows, docs, security headers, SEO, dependency fixes. Automated local checks/builds passed as above; staging deployment and production authorization remain outstanding.
