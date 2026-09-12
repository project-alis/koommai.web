ALTER TABLE affiliate_products ADD COLUMN source_platform TEXT;
ALTER TABLE affiliate_products ADD COLUMN source_url TEXT;
ALTER TABLE affiliate_products ADD COLUMN current_price REAL;
ALTER TABLE affiliate_products ADD COLUMN previous_price REAL;
ALTER TABLE affiliate_products ADD COLUMN discount_percent REAL;
ALTER TABLE affiliate_products ADD COLUMN popularity_score INTEGER NOT NULL DEFAULT 0;
ALTER TABLE affiliate_products ADD COLUMN shop_logo_url TEXT;
ALTER TABLE affiliate_products ADD COLUMN last_checked_at TEXT;

CREATE INDEX IF NOT EXISTS idx_affiliate_products_home_feed
ON affiliate_products(active, popularity_score DESC, sort_order ASC);

CREATE INDEX IF NOT EXISTS idx_affiliate_products_merchant_active
ON affiliate_products(merchant, active);

CREATE INDEX IF NOT EXISTS idx_affiliate_products_source_url
ON affiliate_products(source_url);
