-- Additive Phase 1 migration; 0001-0005 and existing rows remain unchanged.
CREATE TABLE clips (
 id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT NOT NULL UNIQUE, title TEXT NOT NULL,
 platform TEXT NOT NULL DEFAULT 'tiktok' CHECK(platform IN ('tiktok','facebook','youtube','other')),
 source_url TEXT, caption TEXT, description TEXT, cover_image_url TEXT,
 status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','planned','published','archived')),
 published_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE clip_products (
 clip_id INTEGER NOT NULL REFERENCES clips(id), product_id INTEGER NOT NULL REFERENCES affiliate_products(id),
 sort_order INTEGER NOT NULL DEFAULT 100, note TEXT, PRIMARY KEY(clip_id,product_id)
);
CREATE INDEX idx_clip_products_product ON clip_products(product_id);
CREATE TABLE collections (
 id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT NOT NULL UNIQUE, title TEXT NOT NULL, description TEXT, cover_image_url TEXT,
 status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','archived')),
 sort_order INTEGER NOT NULL DEFAULT 100,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE collection_items (
 collection_id INTEGER NOT NULL REFERENCES collections(id), product_id INTEGER NOT NULL REFERENCES affiliate_products(id),
 sort_order INTEGER NOT NULL DEFAULT 100, note TEXT, PRIMARY KEY(collection_id,product_id)
);
CREATE INDEX idx_collection_items_product ON collection_items(product_id);
CREATE TABLE content_ideas (
 id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, notes TEXT,
 product_id INTEGER REFERENCES affiliate_products(id), clip_id INTEGER REFERENCES clips(id),
 collection_id INTEGER REFERENCES collections(id),
 hook TEXT, script TEXT, visual_sequence TEXT, on_screen_text TEXT, caption TEXT, hashtags TEXT, content_angle TEXT,
 status TEXT NOT NULL DEFAULT 'idea' CHECK(status IN ('idea','selected','producing','published','archived')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE page_views (
 id INTEGER PRIMARY KEY AUTOINCREMENT, path TEXT NOT NULL,
 clip_id INTEGER REFERENCES clips(id), collection_id INTEGER REFERENCES collections(id),
 source TEXT, campaign TEXT, referrer_path TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_page_views_path_created ON page_views(path,created_at);
-- Audited schema through 0005 has none of these columns. Old inserts omit them safely.
ALTER TABLE click_events ADD COLUMN clip_id INTEGER REFERENCES clips(id);
ALTER TABLE click_events ADD COLUMN collection_id INTEGER REFERENCES collections(id);
ALTER TABLE click_events ADD COLUMN source TEXT;
ALTER TABLE click_events ADD COLUMN campaign TEXT;
CREATE INDEX idx_click_events_clip_created ON click_events(clip_id,created_at);
CREATE INDEX idx_click_events_collection_created ON click_events(collection_id,created_at);
CREATE TABLE admin_sessions (
 id_hash TEXT PRIMARY KEY, expires_at INTEGER NOT NULL, revoked_at INTEGER,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_admin_sessions_expiry ON admin_sessions(expires_at);
