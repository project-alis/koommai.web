-- คุ้มไหม? V1.4: เตรียมรายการสินค้าไว้ล่วงหน้า ขณะ Shopee Affiliate อยู่ระหว่างตรวจสอบ
-- ปลอดภัยสำหรับ Production เพราะ active=0 ทุกแถว จึงไม่ถูก API นำไปแสดงบนหน้าเว็บ
-- affiliate_url ใช้ค่า PENDING เพื่อผ่าน NOT NULL เท่านั้น ห้ามเปิด active=1 ก่อนเปลี่ยนเป็นลิงก์ Affiliate จริง
-- image_url ตั้งเป็น NULL จนกว่าจะมีรูปสินค้าจริงจากรายการที่จะโปรโมต

INSERT OR IGNORE INTO affiliate_products
(slug, name, category, tool_key, display_price, reason, affiliate_url, active, sort_order, image_url, badge, highlight, merchant, image_alt)
VALUES
-- promo-check: คนที่กำลังเช็กโปรก่อนซื้อ
('pending-promo-powerbank', 'Power bank 10,000mAh', 'powerbank', 'promo-check', 'รอราคา', NULL, 'PENDING_SHOPEE_AFFILIATE', 0, 10, NULL, NULL, 'แบตสำรองสำหรับใช้ระหว่างวัน', 'Shopee', 'Power bank 10,000mAh'),
('pending-promo-charger', 'หัวชาร์จเร็ว USB-C', 'charger', 'promo-check', 'รอราคา', NULL, 'PENDING_SHOPEE_AFFILIATE', 0, 20, NULL, NULL, 'อุปกรณ์ชาร์จสำหรับมือถือและอุปกรณ์พกพา', 'Shopee', 'หัวชาร์จเร็ว USB-C'),
('pending-promo-cable', 'สายชาร์จ USB-C', 'cable', 'promo-check', 'รอราคา', NULL, 'PENDING_SHOPEE_AFFILIATE', 0, 30, NULL, NULL, 'สายชาร์จสำหรับใช้งานประจำหรือสำรอง', 'Shopee', 'สายชาร์จ USB-C'),
('pending-promo-smartplug', 'ปลั๊กอัจฉริยะ', 'smartplug', 'promo-check', 'รอราคา', NULL, 'PENDING_SHOPEE_AFFILIATE', 0, 40, NULL, NULL, 'ช่วยตั้งเวลาและควบคุมการเปิดปิดอุปกรณ์', 'Shopee', 'ปลั๊กอัจฉริยะ'),
('pending-promo-usbhub', 'USB Hub สำหรับโน้ตบุ๊ก', 'office', 'promo-check', 'รอราคา', NULL, 'PENDING_SHOPEE_AFFILIATE', 0, 50, NULL, NULL, 'เพิ่มพอร์ตสำหรับงานและอุปกรณ์เสริม', 'Shopee', 'USB Hub สำหรับโน้ตบุ๊ก'),
('pending-promo-stand', 'ขาตั้งมือถือหรือแท็บเล็ต', 'general', 'promo-check', 'รอราคา', NULL, 'PENDING_SHOPEE_AFFILIATE', 0, 60, NULL, NULL, 'อุปกรณ์เสริมที่เหมาะกับการทำงานและดูคอนเทนต์', 'Shopee', 'ขาตั้งมือถือหรือแท็บเล็ต'),

-- profit-online: คนขายของออนไลน์
('pending-seller-mailer', 'ซองไปรษณีย์สำหรับแพ็กสินค้า', 'packaging', 'profit-online', 'รอราคา', NULL, 'PENDING_SHOPEE_AFFILIATE', 0, 10, NULL, NULL, 'วัสดุแพ็กสินค้าที่ใช้เป็นประจำ', 'Shopee', 'ซองไปรษณีย์สำหรับแพ็กสินค้า'),
('pending-seller-bubble', 'บับเบิลกันกระแทก', 'packaging', 'profit-online', 'รอราคา', NULL, 'PENDING_SHOPEE_AFFILIATE', 0, 20, NULL, NULL, 'ช่วยป้องกันสินค้าระหว่างขนส่ง', 'Shopee', 'บับเบิลกันกระแทก'),
('pending-seller-tape', 'เทปแพ็กกล่องและที่ตัดเทป', 'packaging', 'profit-online', 'รอราคา', NULL, 'PENDING_SHOPEE_AFFILIATE', 0, 30, NULL, NULL, 'อุปกรณ์พื้นฐานสำหรับงานแพ็กสินค้า', 'Shopee', 'เทปแพ็กกล่องและที่ตัดเทป'),
('pending-seller-label', 'สติกเกอร์ฉลากความร้อน', 'label', 'profit-online', 'รอราคา', NULL, 'PENDING_SHOPEE_AFFILIATE', 0, 40, NULL, NULL, 'เหมาะกับร้านที่พิมพ์ฉลากจัดส่งเป็นประจำ', 'Shopee', 'สติกเกอร์ฉลากความร้อน'),
('pending-seller-scale', 'เครื่องชั่งดิจิทัลสำหรับพัสดุ', 'office', 'profit-online', 'รอราคา', NULL, 'PENDING_SHOPEE_AFFILIATE', 0, 50, NULL, NULL, 'ช่วยประเมินน้ำหนักก่อนเลือกค่าจัดส่ง', 'Shopee', 'เครื่องชั่งดิจิทัลสำหรับพัสดุ'),
('pending-seller-printer', 'เครื่องพิมพ์ฉลากสำหรับร้านออนไลน์', 'label', 'profit-online', 'รอราคา', NULL, 'PENDING_SHOPEE_AFFILIATE', 0, 60, NULL, NULL, 'ช่วยลดขั้นตอนงานพิมพ์ใบปะหน้าพัสดุ', 'Shopee', 'เครื่องพิมพ์ฉลากสำหรับร้านออนไลน์'),

-- unit-price: คนที่ต้องการเทียบราคาต่อหน่วย
('pending-unit-tissue', 'กระดาษทิชชูแบบแพ็ก', 'household', 'unit-price', 'รอราคา', NULL, 'PENDING_SHOPEE_AFFILIATE', 0, 10, NULL, NULL, 'เหมาะกับการเทียบราคาต่อม้วนหรือต่อแพ็ก', 'Shopee', 'กระดาษทิชชูแบบแพ็ก'),
('pending-unit-detergent', 'ผลิตภัณฑ์ซักผ้าหลายขนาด', 'household', 'unit-price', 'รอราคา', NULL, 'PENDING_SHOPEE_AFFILIATE', 0, 20, NULL, NULL, 'เหมาะกับการเทียบราคาต่อน้ำหนักหรือปริมาตร', 'Shopee', 'ผลิตภัณฑ์ซักผ้าหลายขนาด'),
('pending-unit-dishwash', 'น้ำยาล้างจานหลายขนาด', 'household', 'unit-price', 'รอราคา', NULL, 'PENDING_SHOPEE_AFFILIATE', 0, 30, NULL, NULL, 'เหมาะกับการเทียบราคาต่อมิลลิลิตร', 'Shopee', 'น้ำยาล้างจานหลายขนาด'),
('pending-unit-water', 'น้ำดื่มแบบแพ็ก', 'pantry', 'unit-price', 'รอราคา', NULL, 'PENDING_SHOPEE_AFFILIATE', 0, 40, NULL, NULL, 'เหมาะกับการเทียบราคาต่อขวดหรือลิตร', 'Shopee', 'น้ำดื่มแบบแพ็ก'),
('pending-unit-petfood', 'อาหารสัตว์เลี้ยงหลายขนาด', 'pet', 'unit-price', 'รอราคา', NULL, 'PENDING_SHOPEE_AFFILIATE', 0, 50, NULL, NULL, 'เหมาะกับการเทียบราคาต่อกิโลกรัม', 'Shopee', 'อาหารสัตว์เลี้ยงหลายขนาด'),
('pending-unit-shampoo', 'แชมพูหรือของใช้ส่วนบุคคลหลายขนาด', 'personal', 'unit-price', 'รอราคา', NULL, 'PENDING_SHOPEE_AFFILIATE', 0, 60, NULL, NULL, 'เหมาะกับการเทียบราคาต่อมิลลิลิตร', 'Shopee', 'แชมพูหรือของใช้ส่วนบุคคลหลายขนาด');

-- ตรวจว่ามี 18 รายการและยังปิดทั้งหมด
SELECT id, slug, name, tool_key, category, active
FROM affiliate_products
WHERE slug LIKE 'pending-%'
ORDER BY tool_key, sort_order;
