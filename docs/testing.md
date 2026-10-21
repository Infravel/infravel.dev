# Testing

Run npm run lint, npm run typecheck, npm test, npm run build, npm run build:worker, npx playwright install chromium, npm run test:e2e, and npm audit --audit-level=high.

Vitest covers configuration, prices, URLs, attribution, validation, spam/origin/body checks, Turnstile results, SQL rate limits, atomic lead/outbox persistence, database rollback, Brevo success, unauthorized/rate-limited/provider failures, timeouts, missing configuration, retry scheduling, concurrent claims, expired leases, stale acknowledgments, D1 acknowledgment rollback and bookkeeping failure, and duplicate waitlist consent behavior. SQL executes against the real migration in Node SQLite through a small D1 test adapter, not a remote binding.

Playwright covers desktop/mobile navigation, required routes/links, service preselection, client validation, confirmed form success, and axe WCAG checks. Browser success tests explicitly mock widget/API responses; server behavior is covered separately by integration tests. Screenshots go to ignored test-results. Use E2E_BASE_URL for a separately running production server; default browser tests start Next dev.

Before launch, exercise a built Worker and real staging D1/Turnstile/Brevo. Validate actual CSP, origin/IP headers, delivery logs, and permissions. Automated checks do not replace keyboard, screen-reader, zoom, or legal review.

Lighthouse targets: performance 90+, accessibility/best practices/SEO 95+. Record actual staging results; targets are not promises. Staging intentionally disables indexing.
