CREATE TABLE IF NOT EXISTS affiliate_products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT,
  tool_key TEXT NOT NULL,
  display_price TEXT,
  reason TEXT,
  affiliate_url TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 100,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_affiliate_products_tool_active
ON affiliate_products(tool_key, active, sort_order);

CREATE TABLE IF NOT EXISTS click_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  tool_key TEXT,
  referrer_path TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(product_id) REFERENCES affiliate_products(id)
);

CREATE INDEX IF NOT EXISTS idx_click_events_product_created
ON click_events(product_id, created_at);

CREATE TABLE IF NOT EXISTS tool_config (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
