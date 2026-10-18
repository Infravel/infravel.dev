# Approved Pages-to-Workers cutover

No production deployment, DNS edit, or push is authorized. No production deploy workflow is included.

Before approval, finish launch-checklist.md, record the existing Pages deployment/custom-domain/DNS state, confirm rollback access, and inspect how Pages builds main. Coordinate or disable Pages automatic builds before a future push containing the new package manifest to avoid unexpected framework detection.

Prepare production D1/secrets independently without changing the live domain. Set DEPLOYMENT_ENV=production at both build/runtime and use approved public contact, real widget keys, and reviewed legal copy. Staging and production need separate artifacts because public configuration is embedded at build time. Back up D1 before changes.

After explicit approval:

1. Migrate production D1 with `wrangler d1 migrations apply DB --env production --remote`.
2. Build with production settings, then `npx opennextjs-cloudflare deploy --env production`. The config has workers.dev disabled and no route; deployment alone does not claim infravel.dev.
3. Inspect the account-specific domain attachment method. Worker Custom Domains generally require releasing the hostname from Pages first. Do not attach conflicting domains or assume existing DNS stays unchanged.
4. In an approved window, detach the Pages custom domain, attach infravel.dev to the Worker, and apply only the dashboard-required DNS changes. Exact records depend on inspected account state and are deliberately not invented. Preserve the Pages project/deployment.
5. Verify HTTPS/TLS, required routes, both legacy redirects, CSP, robots/indexing, sitemap, OG image, genuine form persistence, notification delivery/retry, waitlist duplicates, and conversions.
6. Monitor errors, outbox backlog, D1 usage, and certificate state. Keep rollback ready.

A domain reassignment window may occur; uninterrupted cutover is not guaranteed. See rollback.md.
