PRAGMA foreign_keys = ON;
CREATE TABLE leads (
 id TEXT PRIMARY KEY,
 name TEXT NOT NULL CHECK(length(name) BETWEEN 2 AND 100),
 email TEXT NOT NULL CHECK(length(email)<=254),
 company TEXT NOT NULL DEFAULT '',
 service TEXT NOT NULL,
 requirements TEXT NOT NULL CHECK(length(requirements) BETWEEN 30 AND 6000),
 timeline TEXT NOT NULL DEFAULT '',
 budget TEXT NOT NULL DEFAULT '',
 attribution TEXT NOT NULL DEFAULT '{}',
 created_at INTEGER NOT NULL DEFAULT (unixepoch()),
 notification_status TEXT NOT NULL DEFAULT 'pending' CHECK(notification_status IN ('pending','sent','failed'))
);
CREATE INDEX leads_created ON leads(created_at);
CREATE TABLE opspilot_waitlist (
 id TEXT PRIMARY KEY,
 email TEXT NOT NULL COLLATE NOCASE UNIQUE,
 name TEXT NOT NULL DEFAULT '',
 company TEXT NOT NULL DEFAULT '',
 interest TEXT NOT NULL DEFAULT '',
 consent INTEGER NOT NULL DEFAULT 0 CHECK(consent IN (0,1)),
 consent_version TEXT NOT NULL DEFAULT '2026-10-15',
 attribution TEXT NOT NULL DEFAULT '{}',
 created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX waitlist_created ON opspilot_waitlist(created_at);
CREATE TABLE notification_outbox (
 id TEXT PRIMARY KEY,
 lead_id TEXT NOT NULL UNIQUE REFERENCES leads(id) ON DELETE CASCADE,
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','processing','sent','failed')),
 attempts INTEGER NOT NULL DEFAULT 0,
 next_attempt_at INTEGER NOT NULL DEFAULT (unixepoch()),
 lease_until INTEGER,
 created_at INTEGER NOT NULL DEFAULT (unixepoch()),
 sent_at INTEGER
);
CREATE INDEX outbox_due ON notification_outbox(status,next_attempt_at);
CREATE TABLE rate_limits (
 key TEXT PRIMARY KEY,
 count INTEGER NOT NULL DEFAULT 1,
 expires_at INTEGER NOT NULL
);
CREATE INDEX rate_limits_expiry ON rate_limits(expires_at);
