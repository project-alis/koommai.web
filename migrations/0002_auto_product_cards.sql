ALTER TABLE affiliate_products ADD COLUMN image_url TEXT;
ALTER TABLE affiliate_products ADD COLUMN badge TEXT;
ALTER TABLE affiliate_products ADD COLUMN highlight TEXT;
ALTER TABLE affiliate_products ADD COLUMN merchant TEXT;
ALTER TABLE affiliate_products ADD COLUMN image_alt TEXT;

CREATE INDEX IF NOT EXISTS idx_affiliate_products_category_active
ON affiliate_products(category, active, sort_order);
