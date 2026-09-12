# คุ้มไหม? V1.2 — SEO-first + Auto Product Cards + D1 quota-safe

เว็บไซต์ช่วยตัดสินใจก่อนซื้อ ก่อนขาย และก่อนจ่ายเงิน โดย V1 เริ่มด้วย 3 เครื่องมือ:
1. โปรนี้คุ้มจริงไหม?
2. ขายราคานี้เหลือกำไรไหม?
3. อันไหนถูกกว่าจริง?

## ใหม่ใน V1.2
- การ์ดสินค้า Affiliate สร้างอัตโนมัติจาก D1
- แสดง **รูปสินค้า + ป้ายแนะนำ + ชื่อ + ราคา + ข้อความ + ปุ่ม “ดูราคาวันนี้”** โดยไม่ต้องแก้ HTML ทีละสินค้า
- ถ้า `reason` ว่าง ระบบสร้างข้อความอัตโนมัติจาก `category` หรือ `highlight`
- ถ้า `badge` ว่าง ระบบสร้างป้าย “แนะนำ / ตัวเลือกน่าสนใจ / ดูเพิ่ม” ตามลำดับ
- ถ้าไม่มีรูปหรือรูปโหลดไม่ได้ ระบบใช้ภาพ placeholder ของ “คุ้มไหม?” อัตโนมัติ
- รูปใช้ `loading=lazy` เพื่อลดการโหลดและช่วย performance
- Affiliate click ใช้ `/go/:slug` เพื่อบันทึก click ก่อน redirect
- ถ้า D1 write quota เต็ม การบันทึก click ล้มเหลวจะไม่ขวาง redirect ไป Affiliate
- เพิ่มหน้า About / Privacy / Affiliate Disclosure / Contact เพื่อให้เว็บพร้อมใช้เป็นช่องทางจริงมากขึ้น

> V1.2 ยังไม่ได้ scrape รูปจาก Shopee/TikTok/Lazada อัตโนมัติ เพราะสิทธิ์ API ของแต่ละแพลตฟอร์มต้องตรวจตามบัญชีจริงก่อน ในช่วงแรกใส่ `image_url` และ Affiliate URL ลง D1 เพียงครั้งเดียว จากนั้นระบบแปะภาพ/ข้อความ/ปุ่มให้เองทุกหน้าที่เกี่ยวข้อง

## โครงสร้างฟรีบน Cloudflare
- Worker + Static Assets: หน้าเว็บและ API
- D1: เก็บสินค้า Affiliate และ Click
- Calculator: คำนวณใน Browser ไม่เขียน D1 ทุกครั้ง
- Project: `koommai`
- D1: `koommai-db`

Free quota ของ Cloudflare เป็นระดับ account จึงแชร์กับโปรเจกต์อื่น แต่ฐานข้อมูลควรแยกคนละ DB

## Deploy ครั้งแรก

### 1) สร้าง D1
```bash
npx wrangler d1 create koommai-db
```

คัดลอก `database_id` ที่ Cloudflare ให้มา แล้วแทน `REPLACE_AFTER_CREATE` ใน `wrangler.jsonc`

### 2) ติดตั้ง
```bash
npm install
```

### 3) ทดสอบ local DB
```bash
npm run db:local
```

### 4) Deploy
```bash
npm run deploy
```

คำสั่ง deploy จะ apply migrations แล้ว deploy Worker

## เพิ่มสินค้า 1 ครั้ง แล้วเว็บสร้างการ์ดให้เอง

ตัวอย่าง:

```sql
INSERT INTO affiliate_products
(
  slug,
  name,
  category,
  tool_key,
  display_price,
  image_url,
  merchant,
  badge,
  highlight,
  reason,
  affiliate_url,
  sort_order
)
VALUES
(
  'powerbank-sample',
  'Powerbank 10000mAh ตัวอย่าง',
  'powerbank',
  'promo-check',
  'ประมาณ 699 บาท',
  'https://example.com/product-image.jpg',
  'Marketplace',
  NULL,
  'ขนาดพกง่าย เหมาะกับการใช้งานระหว่างวัน',
  NULL,
  'https://YOUR-AFFILIATE-LINK-HERE',
  10
);
```

กรณีนี้ `reason=NULL` และ `badge=NULL` ระบบจะสร้างข้อความ/ป้ายให้เอง โดยใช้ `category` และ `highlight`

### tool_key ปัจจุบัน
- `promo-check`
- `profit-online`
- `unit-price`

### category ที่มีข้อความ Auto ให้แล้ว
- `powerbank`
- `charger`
- `cable`
- `smartplug`
- `office`
- `packaging`
- `label`
- อื่น ๆ จะใช้ข้อความทั่วไป

## SEO
- แต่ละเครื่องมือมี URL ของตัวเอง
- HTML หลักแสดงตั้งแต่ response แรก
- title / meta description แยกตาม Search Intent
- canonical URL เติมตามโดเมนจริงอัตโนมัติ
- `/sitemap.xml` และ `/robots.txt` สร้างจาก Worker
- Structured Data บนหน้าเครื่องมือ
- รูปสินค้า lazy-load
- Internal links ระหว่างเครื่องมือและบทความ

หลัง Deploy ให้เชื่อม Google Search Console และ Submit `/sitemap.xml`

## ก่อนสมัคร Affiliate
ควรแก้หน้า `/contact/` ให้เป็นอีเมลติดต่อจริงของคุณ และตรวจเนื้อหา About / Privacy / Affiliate Disclosure ให้ตรงกับวิธีใช้งานจริงของเว็บไซต์

## โครงสร้างไฟล์
```text
public/
  index.html
  tools/
  guides/
  about/
  privacy/
  affiliate-disclosure/
  contact/
  assets/
    app.js
    style.css
    favicon.svg
    product-placeholder.svg
worker/
  index.js
migrations/
  0001_init.sql
  0002_auto_product_cards.sql
wrangler.jsonc
```

## Phase ถัดไป
หลังสมัคร Shopee Affiliate และตรวจสิทธิ์ API ของบัญชีจริงแล้ว ค่อยเพิ่มโมดูลนำเข้าข้อมูลสินค้า/รูป/ราคาอัตโนมัติ โดยไม่ต้องเปลี่ยน UI การ์ดสินค้า เพราะ V1.2 เตรียมโครงสร้างไว้รองรับแล้ว
