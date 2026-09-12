-- MEEPIAP Affiliate First Batch — STAGING ONLY
-- ใช้หลังต้องการอัปเดตชื่อ target 5 รายการใน D1 ขณะยังรอ Shopee Affiliate อนุมัติ
-- ปลอดภัย: ทุกแถวยังคง active=0 และไม่เปลี่ยน affiliate_url จากค่า pending
-- ห้ามเปิด active=1 จนกว่าจะมี Affiliate URL จริง + รูป/ราคา/ร้าน/ลิงก์สินค้าที่ตรวจแล้ว

UPDATE affiliate_products
SET name = 'Anker Zolo PowerBank 10,000mAh PD30W (A1680/A1688)',
    merchant = 'Anker Official Store',
    highlight = '10,000mAh + PD30W เหมาะสำหรับเทียบความจุ กำลังชาร์จ และราคาก่อนซื้อ',
    active = 0,
    updated_at = CURRENT_TIMESTAMP
WHERE slug = 'pending-promo-powerbank';

UPDATE affiliate_products
SET name = 'UGREEN Uno 65W RoboGaN 2 / Nexode 3-Port GaN Charger',
    merchant = 'Ugreen Flagship Store',
    highlight = 'GaN 65W เหมาะสำหรับเทียบกับหัวชาร์จ 20W/30W/45W ว่าจ่ายเพิ่มแล้วคุ้มหรือไม่',
    active = 0,
    updated_at = CURRENT_TIMESTAMP
WHERE slug = 'pending-promo-charger';

UPDATE affiliate_products
SET name = 'UGREEN Uno 100W USB-C to USB-C E-Marker Cable',
    merchant = 'Ugreen Flagship Store',
    highlight = 'สาย USB-C 100W สำหรับใช้คู่กับหัวชาร์จและ Power Bank กำลังสูง',
    active = 0,
    updated_at = CURRENT_TIMESTAMP
WHERE slug = 'pending-promo-cable';

UPDATE affiliate_products
SET name = 'UGREEN 10916 USB-C to 4-Port USB 3.0 Hub',
    merchant = 'JIB Official Store',
    highlight = 'USB-C Hub 4 พอร์ต เหมาะสำหรับเทียบจำนวนพอร์ต ความเร็ว และราคาสำหรับ notebook/office',
    active = 0,
    updated_at = CURRENT_TIMESTAMP
WHERE slug = 'pending-promo-usbhub';

UPDATE affiliate_products
SET name = 'TP-Link Tapo P110M Mini Smart Wi-Fi Plug with Energy Monitoring',
    merchant = 'Tapo Mall By Nava',
    highlight = 'Smart Plug ที่มี Energy Monitoring เหมาะสำหรับเทียบฟังก์ชัน smart home กับราคา',
    active = 0,
    updated_at = CURRENT_TIMESTAMP
WHERE slug = 'pending-promo-smartplug';

-- ตรวจผล: ทั้ง 5 รายการต้องยัง active=0
SELECT slug, name, merchant, active, affiliate_url
FROM affiliate_products
WHERE slug IN (
  'pending-promo-powerbank',
  'pending-promo-charger',
  'pending-promo-cable',
  'pending-promo-usbhub',
  'pending-promo-smartplug'
)
ORDER BY sort_order, slug;
