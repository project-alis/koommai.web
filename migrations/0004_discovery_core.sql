CREATE TABLE IF NOT EXISTS discovery_entities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  entity_type TEXT NOT NULL CHECK(entity_type IN ('service','shop','secondhand','free','food','place')),
  category TEXT,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  source_name TEXT,
  source_url TEXT,
  outbound_url TEXT,
  phone TEXT,
  line_url TEXT,
  price_text TEXT,
  price_value REAL,
  latitude REAL,
  longitude REAL,
  district TEXT,
  province TEXT,
  verified INTEGER NOT NULL DEFAULT 0,
  featured INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 100,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_discovery_entities_active_type
ON discovery_entities(active, entity_type, featured DESC, sort_order ASC);

CREATE INDEX IF NOT EXISTS idx_discovery_entities_category
ON discovery_entities(active, category);

CREATE INDEX IF NOT EXISTS idx_discovery_entities_location
ON discovery_entities(active, province, district);

CREATE TABLE IF NOT EXISTS discovery_click_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_id INTEGER NOT NULL,
  action TEXT NOT NULL DEFAULT 'open',
  referrer_path TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(entity_id) REFERENCES discovery_entities(id)
);

CREATE INDEX IF NOT EXISTS idx_discovery_click_events_entity_created
ON discovery_click_events(entity_id, created_at);
