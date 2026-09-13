# MEEPIAP / มีเพียบ V1.6 — Consumer UI + Auto Product Feed

V1.6 เปลี่ยนหน้าแรกให้เป็นเว็บ consumer/price-check มากขึ้น: Hero ค้นหาสินค้า, หมวด, สินค้าน่าจับตา, ร้านยอดนิยม, และ Product Card ที่สร้างจาก D1 อัตโนมัติ

## สิ่งที่เพิ่ม
- `/api/home-feed` อ่านสินค้าที่ `active=1` เพื่อสร้างรูป/ชื่อ/ราคา/ร้าน/ป้ายความคุ้มค่า
- `/api/product-search?q=...` ค้นหาจากชื่อ หมวด ร้าน หรือ `source_url`
- ป้ายอัตโนมัติจาก `discount_percent`: 20%+ = คุ้มมาก, 8–19% = ราคาดี, 1–7% = ควรรอ
- ร้านยอดนิยมคำนวณจากจำนวนรายการ active ใน D1
- `/?preview=1` แสดงข้อมูลตัวอย่างเพื่อรีวิว UI โดยไม่มีลิงก์ซื้อจริง
- Migration `0003_home_feed.sql` เพิ่ม field สำหรับข้อมูล Shopee/Affiliate ที่จะเชื่อมภายหลัง

## เรื่อง Shopee
โค้ดนี้ **ไม่ scrape Shopee** และไม่ปลอมข้อมูลราคา การ์ดจริงจะใช้ข้อมูลที่ได้รับสิทธิ์ใช้งานแล้ว เช่น Affiliate/Open Platform/feed ที่บัญชีได้รับอนุมัติ หรือข้อมูลที่นำเข้าอย่างถูกต้อง หลังได้รับสิทธิ์ให้เติม `source_url`, `image_url`, ราคา และ `affiliate_url` แล้วตั้ง `active=1`.

## Deploy
อัป patch ทับ repo แล้ว Commit ตามปกติ Deploy command เดิมจะรัน migration 0003 ก่อน deploy Worker อัตโนมัติ

## Preview
หลัง deploy เปิด:
`https://YOUR_WORKER.workers.dev/?preview=1`
เพื่อดู Product Card แบบเต็มก่อนมีสินค้า Affiliate จริง
