# MEEPIAP — Affiliate First Batch (Staging)

สถานะ: **PREPARED / NOT LIVE**

ชุดนี้ใช้เตรียมสินค้า 5 รายการแรกสำหรับทดสอบ flow ของ MEEPIAP ระหว่างรอ Shopee Affiliate อนุมัติ

> กติกา: ยังไม่เปิด `active=1`, ยังไม่ใส่ Affiliate URL ปลอม, และราคาด้านล่างเป็นเพียง research snapshot ต้องตรวจใหม่ก่อนเปิดจริง

## 1) Power Bank
- Target: **Anker Zolo PowerBank 10,000mAh PD30W (A1680/A1688)**
- Pending slug: `pending-promo-powerbank`
- Category: `powerbank`
- Tool: `promo-check`
- Preferred merchant: `Anker Official Store`
- Research snapshot: พบรายการ 10,000mAh PD30W ใน Anker Official Store / Shopee ช่วงประมาณ ฿1,309 จากราคาอ้างอิง ฿1,598
- Why first: มีตัวแปรเทียบชัดเจนทั้ง mAh, Watt, จำนวนพอร์ต/สาย และราคา เหมาะกับ “ราคานี้คุ้มไหม?”

## 2) Charger
- Target: **UGREEN Uno 65W RoboGaN 2 / Nexode 3-port GaN Charger**
- Pending slug: `pending-promo-charger`
- Category: `charger`
- Tool: `promo-check`
- Preferred merchant: `Ugreen Flagship Store`
- Research snapshot: พบใน Ugreen Flagship Store ช่วงประมาณ ฿426–฿473 จากราคาอ้างอิง ฿1,590 (ราคามีการเปลี่ยนตามโปร)
- Why first: 65W ใช้เทียบกับ 20W/30W/45W ได้ดี และมีโจทย์ “จ่ายเพิ่มแล้วคุ้มไหม?” ชัดเจน

## 3) USB-C Cable
- Target: **UGREEN Uno 100W USB-C to USB-C E-Marker Cable**
- Pending slug: `pending-promo-cable`
- Category: `cable`
- Tool: `promo-check`
- Preferred merchant: `Ugreen Flagship Store`
- Research snapshot: พบใน Ugreen Flagship Store ช่วงประมาณ ฿179 จากราคาอ้างอิง ฿540
- Why first: ราคาต่ำ ตัดสินใจซื้อง่าย และเชื่อม ecosystem กับหัวชาร์จ/Power Bank ได้ทันที

## 4) USB Hub
- Target: **UGREEN 10916 USB-C to 4-Port USB 3.0 Hub**
- Pending slug: `pending-promo-usbhub`
- Category: `office`
- Tool: `promo-check`
- Preferred merchant: `JIB Official Store`
- Research snapshot: พบรายการตรงรุ่น 10916 ที่ประมาณ ฿530
- Why first: เทียบจำนวนพอร์ต, USB version, speed และราคาได้ง่าย เหมาะกับกลุ่ม notebook/office

## 5) Smart Plug
- Target: **TP-Link Tapo P110M Mini Smart Wi-Fi Plug with Energy Monitoring**
- Pending slug: `pending-promo-smartplug`
- Category: `smartplug`
- Tool: `promo-check`
- Preferred merchant: `Tapo Mall By Nava` หรือร้าน Mall/Official ที่มีของพร้อมส่งในวันที่เปิดจริง
- Research snapshot: พบรายการ P110M ประมาณ ฿459 ใน Tapo Mall By Nava; ตลาดมีหลายร้านและราคาต่างกัน จึงต้องเลือก seller ใหม่อีกครั้งก่อน activation
- Why first: ขยายจาก mobile accessory ไป smart home และมี feature comparison ที่ชัดเจน เช่น Energy Monitoring

## Activation checklist หลัง Shopee Affiliate อนุมัติ

สำหรับแต่ละรายการต้องมีข้อมูลจริงครบก่อนเปิด:

- Exact Shopee product URL
- Shopee Affiliate URL จริง
- Allowed product image URL
- Merchant / shop name
- Current price
- Previous/reference price (ถ้ามีและตรวจสอบได้)
- Discount percent (คำนวณจากราคาที่ตรวจแล้ว)
- `last_checked_at`
- ตรวจ `/go/:slug` redirect
- ตรวจ click ใน `click_events`
- ค่อยตั้ง `active=1`

## Safety rule

ห้ามใช้ราคาในไฟล์นี้เป็นข้อมูล live โดยอัตโนมัติ เพราะราคา Shopee เปลี่ยนตาม voucher, flash sale, user segment และเวลา ต้อง refresh จากแหล่งที่ได้รับสิทธิ์ใช้งานก่อนทุก activation
