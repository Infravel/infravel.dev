# Rollback

Capture last-good Worker version, Pages deployment, DNS records, and D1 bookmark before cutover. Preserve Pages and the original static source.

For a compatible app regression, roll back the Worker in the dashboard or with `wrangler rollback <version-id> --env production`. Confirm version-specific public/runtime configuration and test forms afterward.

For a failed initial domain migration, remove the Worker domain attachment and restore the recorded Pages custom-domain/DNS configuration and successful deployment. Verify HTTPS and original routes. The old static form is inactive; reconcile any leads already saved by the Worker from D1.

Keep D1 data/outbox during application rollback. Do not drop tables to run older code. If data recovery is essential, pause writes, export current state, follow d1.md, and reconcile post-bookmark requests before reopening.
