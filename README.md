# Infravel

Founder-led DevOps consulting website built with Next.js App Router, TypeScript, Tailwind CSS, and OpenNext for Cloudflare Workers. Includes six configurable service packages, protected quote requests, OpsPilot waitlist, technical articles, and truthful reference architectures.

**Production remains unchanged.** Original static HTML/CSS is preserved. The previous README identifies Cloudflare Pages with automatic deployment from main. The new application is prepared for a separate Workers staging deployment. No push, production deploy, or DNS change is authorized.

Use Node 22.15+; run `npm ci` then `npm run dev`. On Windows use npm.cmd if PowerShell blocks npm.ps1. Copy .env.example to .env.local and .dev.vars.example to .dev.vars for local configuration. Forms stay disabled until Turnstile is configured; persistence requires D1. Missing email credentials preserve pending notifications. Transactional mail uses server-only BREVO_API_KEY with configurable EMAIL_FROM and LEAD_NOTIFICATION_TO. See [staging configuration](docs/staging.md) before deployment and [delivery/retry limits](docs/email.md); uncertain provider acceptance can cause duplicate notifications.

Checks: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run build:worker`, `npm run test:e2e`, `npm audit --audit-level=high`.

| Guide                                          | Purpose                                       |
| ---------------------------------------------- | --------------------------------------------- |
| [Audit and plan](docs/audit.md)                | Existing repository evidence and architecture |
| [Local development](docs/local-development.md) | UI and Worker preview                         |
| [Environment reference](docs/environment.md)   | Public variables, runtime secrets, GitHub     |
| [Cloudflare](docs/cloudflare.md)               | Configuration and account checks              |
| [D1](docs/d1.md)                               | Migrations, backup, recovery, retention       |
| [Turnstile](docs/turnstile.md)                 | Bot protection and live verification          |
| [Email](docs/email.md)                         | Brevo and persisted retries                   |
| [Staging](docs/staging.md)                     | Separate preview deployment                   |
| [Production](docs/production.md)               | Approval-controlled cutover                   |
| [Rollback](docs/rollback.md)                   | Restore app/domain and preserve leads         |
| [Analytics](docs/analytics.md)                 | Events and privacy                            |
| [Testing](docs/testing.md)                     | Coverage and limits                           |
| [Verification](docs/verification.md)           | Actual test/build results                     |
| [Launch checklist](docs/launch-checklist.md)   | Required owner/configuration review           |

Browser form success tests explicitly mock widget/API integrations. SQL integration tests execute the migration in SQLite. These do not establish a live remote round trip. No production deployment workflow is included; staging is manually dispatched and notifications scheduling is gated by configuration.
