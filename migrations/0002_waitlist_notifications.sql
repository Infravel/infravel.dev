-- Separate outbox preserves the existing leads foreign key and quote delivery state.
CREATE TABLE waitlist_notification_outbox (
 id TEXT PRIMARY KEY,
 waitlist_id TEXT NOT NULL UNIQUE REFERENCES opspilot_waitlist(id) ON DELETE CASCADE,
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','processing','sent','failed')),
 attempts INTEGER NOT NULL DEFAULT 0,
 next_attempt_at INTEGER NOT NULL DEFAULT (unixepoch()),
 lease_until INTEGER,
 created_at INTEGER NOT NULL DEFAULT (unixepoch()),
 sent_at INTEGER
);
CREATE INDEX waitlist_outbox_due ON waitlist_notification_outbox(status,next_attempt_at);
