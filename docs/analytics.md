# Analytics and conversions

Cloudflare Web Analytics is optional via NEXT_PUBLIC_CF_ANALYTICS_TOKEN. It is not treated as an undocumented custom-event API.

Custom conversions use POST /api/events and an optional Analytics Engine CONVERSIONS binding. Add `analytics_engine_datasets: [{binding: "CONVERSIONS", dataset: "infravel_staging_conversions"}]` to staging config, with a different dataset under env.production. Review current account plan/pricing first. Without a binding the endpoint returns 204 and records nothing.

Events: service_view, quote_start, quote_submit_success, booking_click, contact_email_click, opspilot_waitlist_success. Payloads contain only a fixed event name and optional approved service slug. They exclude form contents, names, emails, attribution strings, and URLs. The collector validates same origin, payload size, event names, and shared rate limits when enabled. Client tracking respects Do Not Track. Conversions are best effort and can be blocked or forged; accepted D1 records are authoritative.

Service views fire on service pages; quote start on first form interaction; success only after server ok:true; booking/email clicks only when configured. Approved UTM attribution uses session storage and is persisted with forms, not events.

Verify network payloads and dataset entries in staging. Failed forms must produce no success event. Compare accepted D1 counts with events directionally, allowing for blockers/repeated visits. Remove approved test registrations after checks.
