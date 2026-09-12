-- ตัวอย่างเท่านั้น: เปลี่ยน YOUR_AFFILIATE_URL และข้อมูลสินค้าให้เป็นของจริงก่อนรัน
-- อย่ารันไฟล์นี้ทั้งที่ยังเป็น placeholder

INSERT INTO affiliate_products
(slug, name, category, tool_key, display_price, reason, affiliate_url, active, sort_order, image_url, badge, highlight, merchant, image_alt)
VALUES
('sample-promo-item', 'ชื่อสินค้าจริง', 'general', 'promo-check', 'ประมาณ 299 บาท', 'ตัวเลือกที่เกี่ยวข้องกับคนกำลังเช็กโปร', 'YOUR_AFFILIATE_URL', 1, 10, 'https://YOUR_IMAGE_URL', 'แนะนำ', 'จุดเด่นสั้น ๆ', 'Shopee', 'ชื่อสินค้าจริง'),
('sample-seller-item', 'อุปกรณ์แพ็กร้านค้า', 'packaging', 'profit-online', 'ประมาณ 199 บาท', NULL, 'YOUR_AFFILIATE_URL', 1, 10, 'https://YOUR_IMAGE_URL', 'สำหรับร้านค้า', 'ช่วยงานแพ็กสินค้า', 'Shopee', 'อุปกรณ์แพ็กร้านค้า'),
('sample-compare-item', 'สินค้าที่เหมาะกับการเทียบราคา', 'general', 'unit-price', 'ดูราคาวันนี้', NULL, 'YOUR_AFFILIATE_URL', 1, 10, 'https://YOUR_IMAGE_URL', 'น่าสนใจ', 'เหมาะกับการเปรียบเทียบราคา', 'Shopee', 'สินค้าที่เหมาะกับการเทียบราคา');
