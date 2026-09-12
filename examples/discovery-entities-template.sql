-- OHOPIAP Discovery V1 seed template
-- Replace all example values with real, permitted source data before running.

INSERT INTO discovery_entities (
  slug, entity_type, category, name, description,
  source_name, source_url, outbound_url,
  price_text, latitude, longitude, district, province,
  verified, featured, active, sort_order
) VALUES
(
  'example-phone-repair-bangkok',
  'service',
  'phone-repair',
  'ร้านซ่อมมือถือ ตัวอย่าง',
  'ข้อมูลตัวอย่างสำหรับทดสอบหน้าค้นหา OHOPIAP',
  'เจ้าของร้านส่งข้อมูล',
  'https://example.com/source',
  'https://example.com/contact',
  NULL,
  13.7563,
  100.5018,
  'เขตตัวอย่าง',
  'กรุงเทพมหานคร',
  0,
  1,
  0,
  10
),
(
  'example-free-desk-bangkok',
  'free',
  'furniture',
  'โต๊ะทำงานแจกฟรี ตัวอย่าง',
  'ตัวอย่างของส่งต่อสำหรับทดสอบโครงสร้างข้อมูล',
  'ผู้ใช้ส่งข้อมูล',
  'https://example.com/listing',
  'https://example.com/listing',
  'ฟรี',
  13.7563,
  100.5018,
  'เขตตัวอย่าง',
  'กรุงเทพมหานคร',
  0,
  0,
  0,
  100
);

-- Keep template rows inactive (active = 0).
-- Activate only after replacing them with real records whose display/linking rights are clear.
