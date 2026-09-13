MEEPIAP / มีเพียบ — V1.4 Affiliate-ready patch (historical notes)

ไฟล์นี้ทำ 4 เรื่อง:
1) ปรับ About / Privacy / Affiliate Disclosure / Contact ให้เป็น Production-ready
2) ซ่อนข้อความ placeholder ภายในเกี่ยวกับ D1/Affiliate เมื่อยังไม่มีสินค้า active
3) เพิ่มหมวดข้อความแนะนำ household / pantry / pet / personal
4) เตรียม SQL 18 รายการสินค้าแบบ active=0 สำหรับรอ Shopee Affiliate อนุมัติ

อัป GitHub:
- ลากโฟลเดอร์ public, worker, examples ไปทับที่ root ของ repo
- Commit to main
- Cloudflare จะ Auto Deploy

ใส่ D1 (ทำแยกจาก GitHub):
- เปิด Cloudflare > D1 > koommai-db > Console
- เปิดไฟล์ examples/affiliate-products-pending.sql
- Copy ทั้งไฟล์ไป Execute
- รายการทั้งหมด active=0 จึงไม่แสดงหน้าเว็บ

หมายเหตุเรื่องรูปสินค้า:
- ยังไม่ใส่รูปปลอมหรือรูปที่ไม่ตรงสินค้า
- หลัง Shopee อนุมัติ ค่อยใส่ image_url ของรายการสินค้าจริงพร้อม affiliate_url จริง แล้ว active=1
