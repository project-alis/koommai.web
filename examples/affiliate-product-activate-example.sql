-- ใช้หลัง Shopee Affiliate อนุมัติแล้วเท่านั้น
-- เปลี่ยนข้อมูลตัวอย่างด้านล่างเป็นข้อมูลจากสินค้าจริงก่อน Execute

UPDATE affiliate_products
SET
  slug = 'real-product-slug',
  name = 'ชื่อสินค้าจริงตามหน้าร้าน',
  display_price = 'ดูราคาวันนี้',
  image_url = 'https://URL-รูปสินค้าจริง',
  affiliate_url = 'https://ลิงก์-Affiliate-จริง',
  merchant = 'Shopee',
  badge = 'แนะนำ',
  highlight = 'จุดเด่นสั้น ๆ ที่ตรวจสอบได้จากหน้าสินค้า',
  image_alt = 'ชื่อสินค้าจริง',
  active = 1,
  updated_at = CURRENT_TIMESTAMP
WHERE slug = 'pending-promo-powerbank';

-- ตรวจรายการที่เปิดใช้งาน
SELECT id, slug, name, tool_key, active, affiliate_url
FROM affiliate_products
WHERE active = 1
ORDER BY tool_key, sort_order;
