# Cloudflare setup

Verify the real account before changes: Pages project, Git/build settings, custom domain, successful deployment ID, DNS records, TLS mode, redirects, WAF, billing, ownership, and rollback access. This implementation did not inspect the account.

The existing default target is `infravel-staging` with its staging D1 binding configured. Migration `0001_initial.sql` is already applied remotely. Preserve existing Turnstile and Wrangler secrets. No new database, migration, DNS change, or production action is needed for the Brevo switch. Follow [staging-only configuration](staging.md) to inspect secret names and add only missing Brevo settings through interactive prompts. Never overwrite an existing secret without separate authorization.

Keep nodejs_compat, .open-next/worker.js, and .open-next/assets. Do not deploy .next directly or use static Pages export for D1 APIs. Production is a separate protected environment; the current Coming Soon site remains untouched.

Account checks: HTTPS/TLS, widget hostname restrictions, WAF/rate limits, D1 budget alerts, least-privilege access, private logs. Validate CSP with real Turnstile/Analytics. CSP permits inline scripts/styles for Next hydration and JSON-LD; it blocks objects and framing. A future nonce policy requires deliberate rendering/cache changes.
