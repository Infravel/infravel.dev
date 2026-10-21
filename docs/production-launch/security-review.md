# Security, functionality, and business readiness review

Scope: local source/configuration at approved design baseline `7d2d2e3` plus the preparation changes. No penetration test, remote account inspection, dependency clean bill, legal opinion, or production certification is claimed.

## Findings and severity

| Severity | Finding | Status / required action |
| --- | --- | --- |
| Critical release blocker | Production database is still an all-zero placeholder; production routing/account state is unverified | No deployment allowed. Isolated template/generator refuse missing/zero/staging IDs; owner must verify real resources and ownership |
| High | No established protected production release path | Disabled manual draft prepared. Actual required reviewers, default-branch activation, selected staging branch, token scope, and self-review/bypass rules remain owner configuration tasks |
| High, verified by public inventory | Production approval environment missing | Complete GitHub public environment listing contains only staging; production GET returns 404. No production environment reviewer/branch approval rules are configured. See inventory.md |
| High, live observation | www HTTPS returned HTTP 525 twice | Owner must inspect existing origin TLS/domain/routing state and confirm the real rollback baseline. No cause is assumed and no live remediation was attempted; see inventory.md |
| Previously blocked release gate, now passed locally | Dependency audit completed after explicit owner approval | Registry verified as `https://registry.npmjs.org/`; `npm audit --audit-level=high` exited 0 with 0 vulnerabilities on 21 October 2026. Critical/high/moderate/low findings: all zero. No affected packages or production-impact advisories were reported; no remediation or dependency modification is indicated by this audit. Repeat for the reviewed release SHA; this is not a general application-security certification |
| High, fixed locally | Retry helper accepted any HTTPS destination for the bearer secret | Now accepts only the exact known staging/apex retry endpoints, refuses redirects, and emits validated counts only. No authenticated request was sent; existing remote settings were not changed |
| High | Real production D1/Turnstile/Brevo/recipient/retry validation missing | Tests mock providers. Confirm actual hostname/action/key pairing, sender authorization, recipient, both notification types, scheduling, schema, and recovery before routing customers |
| High | Legal/business drafts and verified public privacy contact unresolved | Owner/business/legal review required; no identity, address, registration, certification, or legal basis invented |
| Medium | Prefix-based JSON media-type acceptance admitted `application/jsonp` and other lookalikes | Fixed: exact media type with optional charset; tests cover accepted JSON and rejected lookalikes. Existing same-origin protections remain |
| Medium | No www canonical redirect and no independent production-preview noindex guarantee | Fixed locally: approved www→apex 308 preserves path/query; every workers.dev host receives noindex headers even with production mode. No live domain was attached |
| Medium | D1 rate-limit rows expire logically but are not automatically deleted | Privacy draft corrected. Define/authorize an operational cleanup, retention, capacity monitoring and deletion schedule; no remote deletion occurred |
| Medium | At-least-once notification delivery after uncertain provider acceptance | Inherited behavior preserved and tested. Lease fencing prevents concurrent normal sends/stale acknowledgments, but timeout/send-ack gaps can still duplicate business notifications; 23-hour window needs manual review |
| Medium | Backups/retention/restore evidence and operator monitoring unverified | Require encrypted exports, actual Time Travel retention, restore rehearsal, outbox review owner, alerting, and incident contacts |
| Medium | Existing staging dispatch lacks an explicit staging-branch job guard; retry scheduling is a single gated environment/URL | Production draft has its own branch/commit/target gates. Existing executable workflows remain unchanged; review staging dispatch and prepare separate production scheduling before launch |
| Low | Production/staging/public configuration can differ between build and runtime | Draft builds with explicit production public vars/config; production artifacts must not be replaced by a later staging build. No real resource ID or runtime secret was supplied |
| Low | CSP allows inline scripts/styles for the existing Next.js/Turnstile integration | Retained to avoid breaking behavior. Review nonce-based CSP as a separate tested hardening change; object-src none, frame-ancestors none, base-uri/form-action restrictions remain |
| Low | Browser storage/analytics consent and DNT scope require business review | Conversion events respect DNT; UTM session storage capture is separate. No blanket “cookie-free”, universal consent exemption, or jurisdictional compliance claim is made |

“Critical release blocker” describes the operational risk of proceeding with invalid/unverified production state, not a newly discovered exploitable vulnerability.

## Application controls inspected

- Quote/contact and waitlist use the same bounded JSON reader, same-origin verification, honeypot, D1-backed salted-IP rate limit, schema validation, and server-side Turnstile check before persistence. Missing security configuration fails closed. No permissive CORS response is added; JSON POSTs require the exact request origin. Turnstile additionally validates success, configured hostname, and expected action. The hash is still personal-data-derived and should be treated accordingly; no raw IP storage is introduced by application code.
- Prepared D1 statements bind user data; table/column choices in notifications come from fixed program logic. Quote and waitlist outbox enqueue operations are atomic. Waitlist email uniqueness is case-insensitive; duplicate registration preserves original profile/consent and does not create another notification. There is no public lead listing.
- Notifications reconstruct explicit stored business fields, escape HTML, encode mailto links, validate reply mailboxes, preserve the verified sender and single configured recipient, and exclude tokens/arbitrary metadata. Provider failures, 429 Retry-After, bounded timeout, claims, leases, stale fences, missing settings, and acknowledgement failures are tested. Failure responses and application catch paths do not log customer content or provider bodies.
- The retry route requires a bearer secret, compares fixed-length digests, returns 401 without authorization and no-store responses. Scheduler gating is separate from code and has not been verified remotely. The generic smoke sends only an unauthorized probe, not a real retry.
- Secrets remain server-only bindings, Git-ignored local files, or future protected environment secrets. No secret value was requested, printed, written into templates, or updated remotely. Runtime secret-name checks can establish names only. The draft avoids raw browser traces/log/database artifact uploads; real email delivery tests are not automated against live accounts.
- Security headers include CSP, HSTS, nosniff, referrer policy, feature restrictions, and noindex outside production. Production robots disallow `/api/`; canonicals/schema/sitemap use the approved apex. Workers.dev HTTP noindex blocks preview indexing regardless of production-mode metadata. Host-conditional redirect/header rules are tested locally without following the public domains.
- Existing privacy/business content, prices, architecture, visual design, Cloudflare staging config, Pages source, and workflows are preserved except the explicitly corrected cleanup claim and launch-safety code changes.

## Owner business/legal checklist

Keep Privacy and Terms labeled drafts until approved. Confirm, rather than invent:

- Contracting business/legal identity, trading name, registration and address details where actually applicable; authorized signatory; public business and privacy contact; invoicing/tax/currency information.
- Applicable customer jurisdictions and governing-law/dispute language; review with qualified counsel as appropriate. This report supplies no jurisdiction-specific legal conclusions.
- Lawful purposes/bases, rights-request process and response ownership, withdrawal/deletion handling, international processing locations/safeguards, vendor contracts, and any required disclosures for Cloudflare, Turnstile, Brevo, business mailbox copies, and backups.
- Actual retention/deletion periods for leads, waitlist, D1 rate-limit records, email notifications, exports, and logs; approve a real process before claiming automatic cleanup. Decide how deleted data ages out of backups.
- Optional marketing consent wording/version, operational early-access communications, withdrawal handling, and suppression of previously opted-out contacts. Do not treat waitlist registration as blanket marketing permission.
- Session-storage campaign attribution, optional Cloudflare Web Analytics, DNT behavior, and any required preference/consent controls. The application has no general cookie banner; whether additional controls are required depends on approved actual processing and jurisdiction.
- Proposed pricing/support scope, exclusions, payment/refund/cancellation terms, intellectual property, confidentiality, liability, and truthful OpsPilot availability. No fabricated customers, certifications, SLA, office, registration, or trademark-clearance claims were added.

The public drafts explicitly defer business identity/jurisdiction and retention decisions. Local contact email is absent, so the fallback contact form is not evidence that a verified privacy contact is configured. “We do not sell” and other business representations require owner confirmation; repository review alone cannot verify organizational practice.

## Release evidence and limits

90 unit/integration tests passed locally, including production isolation, authenticated-retry target restrictions, and no-send smoke tests. All 26 browser tests and the Worker build also passed, as recorded in the launch README. Source inspection plus mocked tests do not prove live token verification, deliverability, remote database isolation, application capacity, protected GitHub environments, or active TLS/domain routing. Resolve all High findings and the operational Critical blocker, complete the owner checklist, and record separate approval before changing production.
