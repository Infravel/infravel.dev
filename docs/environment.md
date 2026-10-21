# Environment reference

Secrets belong in Wrangler secrets (.dev.vars locally), never NEXT_PUBLIC values, source, screenshots, or CLI arguments. Public values are embedded at build time and require rebuilding.

| Value                          | Purpose                                                   |
| ------------------------------ | --------------------------------------------------------- |
| NEXT_PUBLIC_TURNSTILE_SITE_KEY | Widget key; absence disables forms                        |
| NEXT_PUBLIC_CONTACT_EMAIL      | Verified public email; hidden if absent                   |
| NEXT_PUBLIC_BOOKING_URL        | Optional HTTPS scheduling URL; absent falls back to quote |
| NEXT_PUBLIC_FOUNDER_NAME       | Optional approved public name                             |
| NEXT_PUBLIC_CF_ANALYTICS_TOKEN | Optional Web Analytics token                              |
| DEPLOYMENT_ENV                 | Set at build AND runtime; production enables indexing     |
| DB                             | Environment-specific D1 binding                           |
| TURNSTILE_SECRET_KEY           | Server Siteverify key                                     |
| TURNSTILE_HOSTNAMES            | Comma-separated allowed challenge hostnames               |
| RATE_LIMIT_SALT                | Required random, environment-specific salt                |
| BREVO_API_KEY                  | Server-only Brevo transactional API key                   |
| EMAIL_FROM                     | Named or bare sender; Infravel <hello@infravel.dev>       |
| LEAD_NOTIFICATION_TO           | Private notification recipient                            |
| RETRY_SECRET                   | Random bearer secret for notification retry               |
| CONVERSIONS                    | Optional Analytics Engine dataset binding                 |

GitHub staging environment secrets: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID. Variables: TURNSTILE_SITE_KEY, CONTACT_EMAIL, optional BOOKING_URL, STAGING_URL. Configure Worker runtime secrets separately. Use a staging-scoped Workers/D1 edit token. Production must use separate protected credentials; no production deployment workflow is included.

The notifications environment needs RETRY_SECRET and NOTIFICATION_RETRY_URL. Set repository ENABLE_NOTIFICATION_RETRY=true only after endpoint and secret verification. Nothing is scheduled from this local checkout.

Use existing staging settings; add only missing secrets and never overwrite configured values. See [staging instructions](staging.md). Missing Brevo settings leave outbox work pending. No additional D1 migration is required.
