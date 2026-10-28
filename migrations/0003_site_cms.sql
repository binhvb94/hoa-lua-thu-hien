-- Hoa Lua Thu Hien V1.3. Chay SAU 0001/0002 trong D1 cua Hoa Lua Thu Hien.
-- Du lieu website ban nhap va ban xuat ban duoc luu tach biet.
CREATE TABLE IF NOT EXISTS site_cms (
 id TEXT PRIMARY KEY CHECK (id='home'),
 published_json TEXT NOT NULL DEFAULT '{}',
 draft_json TEXT,
 draft_rev INTEGER NOT NULL DEFAULT 0,
 live_rev INTEGER NOT NULL DEFAULT 0,
 updated_at TEXT,
 published_at TEXT
);
INSERT OR IGNORE INTO site_cms (id,published_json,draft_json) VALUES ('home','{}',NULL);
CREATE TABLE IF NOT EXISTS site_publication_history (
 id TEXT PRIMARY KEY,
 old_json TEXT NOT NULL,
 new_json TEXT NOT NULL,
 published_at TEXT NOT NULL DEFAULT (datetime('now'))
);
