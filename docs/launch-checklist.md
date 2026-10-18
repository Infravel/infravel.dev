# Launch checklist

- [ ] Review verification.md and unresolved limitations.
- [ ] Confirm real Pages/DNS/custom-domain/deployment state and rollback access.
- [ ] Approve copy, founder information, public contact, pricing, legal drafts, contracting identity, retention, and consent process.
- [ ] Resolve or explicitly risk-accept dependency advisories through a recorded business/security decision.
- [ ] Pass Ubuntu CI; retain test and build evidence.
- [ ] Configure independent staging/production D1 IDs and secrets; migrate and test constraints.
- [ ] Verify real staging Turnstile, quote persistence, email delivery/failure/retry, and waitlist duplicates.
- [ ] Configure optional booking and analytics, then verify conversion payload privacy.
- [ ] Review keyboard/mobile/zoom/focus/error announcements/reduced motion and run Lighthouse.
- [ ] Rehearse database recovery; assign outbox/stale-row review and expired rate-limit cleanup.
- [ ] Enable notification scheduling only after endpoint/secret verification.
- [ ] Verify staging noindex and production SEO, schema, headers, OG, sitemap, and legacy redirects.
- [ ] Protect GitHub environments and restrict Cloudflare tokens by environment.
- [ ] Obtain explicit approval before push, production deploy, DNS edit, or Pages domain reassignment.
- [ ] Complete approved cutover/live verification and retain rollback resources.

Do not add customer, certification, office, registration, uptime, staffing, or commercial outcome claims without verified evidence.

- [ ] Verify Brevo sender authorization, server-only BREVO_API_KEY, and preserved EMAIL_FROM / LEAD_NOTIFICATION_TO in staging; do not overwrite existing secrets.
- [ ] Review timeout / send-ack duplicate risk in email.md and demonstrate retry plus expired-lease recovery.
- [ ] Confirm actual GitHub retry environment and gate configuration; a checked-in schedule alone does not establish automatic retries.
- [ ] Preserve existing staging migration, Turnstile, and production Coming Soon resources.
