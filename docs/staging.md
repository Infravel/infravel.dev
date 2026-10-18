# Staging deployment

The default Wrangler target is `infravel-staging`, bound to the existing staging D1 ID. Migration `0001_initial.sql` has already been applied remotely. This email change needs no migration. Do not create another database or rerun initial setup. Turnstile is already configured; preserve it and existing secrets. Keep the Coming Soon production site, production database, DNS, and routes untouched.

Before any separately authorized deployment:

1. Review `npx wrangler secret list --name infravel-staging` locally (names only). Add **only** the missing `BREVO_API_KEY` using `npx wrangler secret put BREVO_API_KEY --name infravel-staging`; enter its value in the interactive prompt, never chat, tracked files, or command arguments. If already present, do not overwrite it without separate authorization.
2. Preserve existing `EMAIL_FROM` and `LEAD_NOTIFICATION_TO`. Verify privately that the sender is `Infravel <hello@infravel.dev>` and the recipient is a controlled staging inbox. If missing, add each with `npx wrangler secret put EMAIL_FROM --name infravel-staging` and `npx wrangler secret put LEAD_NOTIFICATION_TO --name infravel-staging`. Resolve any conflicting existing values separately; do not overwrite secrets. Confirm sender authorization in Brevo without changing DNS.
3. Preserve the existing Turnstile secrets, hostnames, rate-limit salt, and `RETRY_SECRET`. Add a retry secret only if absent, with `npx wrangler secret put RETRY_SECRET --name infravel-staging`. Retain its value privately for the external invoker. Do not remove legacy provider secrets as part of this change.
4. Verify build-time public variables and `DEPLOYMENT_ENV=staging`; pass lint, types, tests, Next build, and Worker build. See the current verification report for local platform limitations. Do not put the Brevo key in NEXT_PUBLIC variables or build configuration.
5. If scheduled retries are wanted after deployment, configure the GitHub `notifications` environment variable `NOTIFICATION_RETRY_URL` to the staging retry endpoint and secret `RETRY_SECRET` to the existing Worker value. Verify a manual invocation first, then enable repository variable `ENABLE_NOTIFICATION_RETRY=true`. The workflow must exist on the default branch; configuring it is separate from this local change. No remote scheduling state has been verified.

Deployment itself requires separate approval and is not performed by this task. After that deployment, exercise real staging Turnstile, quote persistence, Brevo acceptance, delivery logs, failure/retry, and duplicate waitlist behavior. Run `node scripts/smoke.mjs` with STAGING_URL; smoke checks alone do not prove integrations. Keep production unchanged.

## Remote smoke readiness

`scripts/smoke.mjs` accepts only the approved `https://infravel-staging.shkhrabdullah.workers.dev` origin and does not follow redirects. It polls the homepage for up to 90 seconds, waiting five seconds between unsuccessful attempts. Requests have a ten-second timeout capped by the remaining readiness budget. Logs contain attempt numbers, elapsed seconds, HTTP statuses, or fixed timeout/network categories; response bodies and raw exception messages are never printed.

After the first HTTP 200, all existing public-route checks and the unauthenticated retry check run strictly with ten-second request timeouts. Persistent readiness failures, subsequent route failures, and failed retry protection exit nonzero. This accommodates possible temporary readiness delays; it does not establish the cause of earlier post-deployment HTTP 500 responses or excuse persistent errors. No deployment-workflow change is needed.
