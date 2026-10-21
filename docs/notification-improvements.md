# Inquiry and waitlist business notifications

Implemented locally on staging, 21 October 2026. No real email was sent, migration applied to Cloudflare, deployment performed, or commit/push created. Existing uncommitted UI refinements remain in place.

## Result and changed files

- `src/lib/notification-template.ts`: a shared Infravel HTML template and plain-text alternative. Quotes include name, email, optional company, readable service name, complete project description, optional budget and timeline, lead ID, UTC submission timestamp, form source, and collected UTM attribution. General contact inquiries use the existing `not-sure` service choice. Waitlist notifications contain only name/email/company/infrastructure interest/optional marketing consent, registration ID, timestamp, and collected source information. Empty optional fields are omitted.
- `src/lib/notifications.ts`: explicit stored-record reads reconstruct the same content for initial sends and retries. The configured sender is retained, and only the single configured `LEAD_NOTIFICATION_TO` mailbox receives the notification. Customer email appears as Reply-To and an encoded mailto link, never as a notification recipient. The existing Brevo endpoint, timeout, error handling, lease ownership checks, fenced acknowledgments, backoff, Retry-After support, 23-hour operational review window, and batch size of 20 remain.
- `src/lib/submissions.ts`: new waitlist registrations and their outbox entry persist in one atomic batch. Duplicate email registrations preserve the original profile and consent, return the same response, and enqueue/send nothing new. Immediate delivery failure leaves durable work available for retry. Quote submission behavior and all customer-facing form code/validation remain unchanged.
- `migrations/0002_waitlist_notifications.sql`: additive waitlist outbox with a unique foreign key to the registration and the same delivery/lease/retry fields as the quote outbox. No changes to existing tables or quote state.
- `tests/helpers/db.ts`, `tests/integration/submissions.test.ts`, `tests/integration/notification-content.test.ts`, and `tests/unit/notification-template.test.ts`: migrated in-memory SQLite, updated content assertions, and coverage for both notification kinds, retry reconstruction, concurrency, migration preservation, and injection prevention.
- `docs/email-previews/quote.html`, `quote.txt`, `waitlist.html`, and `waitlist.txt`: generated snapshot fixtures containing only fictional customers using example.com addresses. Tests compare these files with actual template output.

## Preview examples

Quote subject: New Infravel Quote Request — CI/CD Pipeline Setup

The quote preview is for Amira Example at Example Systems (amira@example.com), asking for a repeatable SaaS delivery pipeline including staging, automated checks, and handover. It includes the full two-line message, budget of $1,000–$2,500, a four-week timeline, fictional lead ID, timestamp, and newsletter campaign source.

Waitlist subject: New Infravel OpsPilot Waitlist Registration

The waitlist preview is for Sam Example at Example Cloud (sam@example.com), interested in Linux and Docker monitoring. Optional marketing consent is explicitly shown as not opted in. Quote-only fields are absent.

Open the HTML files locally in a browser to review the visual template. Plain-text files include their subjects and matching readable content. Browser checks at 390px and 720px found no horizontal overflow; the quote screenshot was visually reviewed. No external images, fonts, tracking pixels, or new logo artwork are used. Rendering in real Outlook/Gmail clients and live Brevo delivery were deliberately not tested.

## Security and delivery checks

- All dynamic HTML text and attribute content escapes ampersands, angle brackets, double quotes, and apostrophes. Message newlines are preserved; plain text retains the complete validated message, tested at the 6,000-character limit.
- Header controls are removed from display names and subjects. Customer/configured email addresses are revalidated and fail closed for control characters, multiple mailboxes, and injected mailto/header parameters. Subjects use trusted service labels rather than customer text. Mailto addresses are percent-encoded without user-supplied query parameters.
- Recipient selection comes exclusively from server configuration. No CC/BCC or customer delivery is introduced. Verified sender configuration and secrets are untouched.
- Notification content uses explicit business fields and allowlisted UTM keys only. Turnstile tokens, API keys, arbitrary attribution metadata, and internal credentials are not selected or included. No logging was added; injection failure paths were tested for no console logging of PII. As before, the form tells customers not to place secrets in their project messages; the complete customer-authored message is retained as requested.
- Sent items cannot be reclaimed, concurrent active claims cannot both send, stale acknowledgments are fenced, and expired leases can recover. Existing duplicate waitlist submissions produce one outbox row. The migration does not enqueue historical registrations or replay sent quote notifications.
- The inherited retry model has uncertain-acceptance cases (provider acceptance followed by timeout or a failed D1 acknowledgment). It is not an exactly-once delivery guarantee. This change retains that existing behavior and does not claim provider-level deduplication. Items beyond the existing 23-hour window still require operational review.

## Migration required before future rollout

The original `notification_outbox.lead_id` must reference `leads`, so a waitlist record cannot safely use that table. A separate additive outbox is necessary for durable waitlist retries without creating fake leads or rebuilding the existing outbox.

The migration has been added and tested **only in in-memory SQLite**. It has not been applied to local Wrangler databases, staging D1, or production D1. Before any separately authorized deployment of this code, apply migration 0002 to the target D1 database using the project's normal migration procedure. Deploying this code without that migration would prevent waitlist persistence and the combined retry query from succeeding. The migration changes no existing records, secrets, recipient configuration, or Cloudflare resources beyond the new table/index when it is eventually applied. It is compatible with the previous application code, so it can precede rollout. No historical email backfill is performed.

## Verification

- Lint: passed.
- TypeScript checks: passed.
- Unit/integration tests: 66 passed across 5 files, including all existing quote outbox regressions. Every provider request in these tests is mocked; no real emails were sent.
- Next.js production build: passed, including all 28 static generation tasks.
- OpenNext Worker build: passed, including the Worker manifest regression check.
- Local template browser previews: passed at 390px and 720px for both kinds.
- Git diff whitespace check: passed.

Existing Vite module-format/experimental SQLite warnings and the OpenNext Windows compatibility advisory do not prevent the checks from completing. No new dependency, production configuration, workflow, or customer-facing form change was introduced.
