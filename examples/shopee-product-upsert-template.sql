-- V1.6 template: ใช้หลังมีข้อมูลสินค้าจริง/ลิงก์ Affiliate ที่ได้รับอนุญาตแล้ว
-- แทนค่าที่ขึ้นต้น YOUR_... ก่อน Execute และค่อยตั้ง active=1 เมื่อข้อมูลถูกต้องครบ

INSERT INTO affiliate_products (
  slug, name, category, tool_key, display_price, reason, affiliate_url, active, sort_order,
  image_url, badge, highlight, merchant, image_alt,
  source_platform, source_url, current_price, previous_price, discount_percent,
  popularity_score, shop_logo_url, last_checked_at
) VALUES (
  'YOUR_UNIQUE_SLUG',
  'YOUR_PRODUCT_NAME',
  'general',
  'promo-check',
  NULL,
  NULL,
  'YOUR_SHOPEE_AFFILIATE_URL',
  0,
  100,
  'YOUR_ALLOWED_PRODUCT_IMAGE_URL',
  NULL,
  NULL,
  'YOUR_SHOP_NAME',
  'YOUR_PRODUCT_NAME',
  'Shopee',
  'YOUR_SHOPEE_PRODUCT_URL',
  0,
  0,
  0,
  0,
  NULL,
  CURRENT_TIMESTAMP
)
ON CONFLICT(slug) DO UPDATE SET
  name=excluded.name,
  category=excluded.category,
  tool_key=excluded.tool_key,
  affiliate_url=excluded.affiliate_url,
  image_url=excluded.image_url,
  merchant=excluded.merchant,
  image_alt=excluded.image_alt,
  source_platform=excluded.source_platform,
  source_url=excluded.source_url,
  current_price=excluded.current_price,
  previous_price=excluded.previous_price,
  discount_percent=excluded.discount_percent,
  popularity_score=excluded.popularity_score,
  shop_logo_url=excluded.shop_logo_url,
  last_checked_at=excluded.last_checked_at,
  updated_at=CURRENT_TIMESTAMP;
