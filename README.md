# OHOPIAP (โอ้โหเพียบ) — V1.7.2

OHOPIAP คือเว็บไซต์ช่วยตัดสินใจก่อนซื้อ ก่อนขาย และก่อนจ่าย โดยรีแบรนด์จากชื่อเดิม Koommai ใน V1.7 และปรับ Brand/UI เป็นภาษาไทยชัดเจนใน V1.7.1

## ฟังก์ชันหลัก
1. โปรนี้คุ้มจริงไหม?
2. ขายราคานี้เหลือกำไรไหม?
3. อันไหนถูกกว่าจริง?
4. Auto Product Cards จาก D1
5. Affiliate redirect ผ่าน `/go/:slug`
6. SEO pages, sitemap, robots.txt และ structured data
7. Affiliate readiness health check ผ่าน `/api/health`

## Brand
- Public brand: `โอ้โหเพียบ`
- International / domain identity: `OHOPIAP`
- Package: `ohopiap-web`
- คำว่า “คุ้มไหม?” ยังคงใช้ในบริบทของคำถาม/ฟีเจอร์ เช่น “โปรนี้คุ้มจริงไหม?” ไม่ใช่ชื่อแบรนด์

## V1.7.2 Affiliate Readiness
- แสดงสินค้า active เฉพาะรายการที่มี `affiliate_url` แบบ HTTPS จริง
- ค่า placeholder เช่น `PENDING_SHOPEE_AFFILIATE` จะไม่หลุดขึ้นหน้า Home/Search/Recommendations
- `/go/:slug` ตรวจสอบปลายทางก่อนบันทึก click และ redirect
- `/api/health` ใช้ตรวจว่า D1 schema พร้อมสำหรับ Affiliate fields และดูจำนวนสินค้ารวม/สินค้าที่พร้อมแสดง
- ไม่มี D1 migration ใหม่ใน V1.7.2

## Infrastructure
- Cloudflare Worker name: `ohopiap`
- Current workers.dev URL: `https://ohopiap.javis-github.workers.dev/`
- D1 binding: `DB`
- D1 database: `koommai-db`
- D1 database ID: `e629bb4c-0c0b-4e94-bba3-5032b3046114`
- API / Affiliate logic ใช้ Worker และ D1 database เดิม

Worker migration เป็น `ohopiap` สำเร็จแล้ว และ `/api/health` ยืนยันสถานะ `ok: true`, `db: true`, schema `affiliate-ready-v3` โดยมี pending products 18 รายการและ active 0 รายการ ณ วันที่ 12 กันยายน 2026

Canonical, og:url, sitemap และ robots.txt สร้างจาก request origin ใน `worker/index.js` จึงใช้ hostname `ohopiap.javis-github.workers.dev` โดยอัตโนมัติ

> ยังไม่ rename `koommai-db` หรือเปลี่ยน database ID เพียงเพื่อรีแบรนด์

## Development
```bash
npm install
npm run dev
```

## Production deploy
Cloudflare Workers Builds ที่เชื่อม GitHub ใช้:
```bash
npx wrangler deploy
```

คำสั่งนี้ **ไม่ได้ apply D1 migrations อัตโนมัติ** ดังนั้นถ้ามี migration ใหม่ ต้อง apply แยกก่อน deploy หรือใช้ workflow ที่กำหนดไว้โดยตั้งใจ

สำหรับ local/manual deployment เดิม `npm run deploy` ยังมีคำสั่ง apply migrations ตาม `package.json` แต่ไม่ใช่คำสั่งที่ Cloudflare Builds ใช้อยู่ใน production ตอนนี้

## Affiliate product data
Schema รองรับข้อมูลสินค้าจริงแล้ว เช่น:
- `affiliate_url`
- `source_url`
- `image_url`
- `merchant`
- `current_price`
- `previous_price`
- `discount_percent`
- `popularity_score`
- `last_checked_at`

ตัวอย่างสำหรับนำเข้าสินค้าอยู่ใน `examples/` โดยเฉพาะ `shopee-product-upsert-template.sql` และรายการ pending 18 กลุ่มสินค้าใน `affiliate-products-pending.sql`

## โครงสร้างหลัก
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
worker/
  index.js
migrations/
examples/
package.json
wrangler.jsonc
```

## ขั้นถัดไป
1. นำสินค้าจริงที่ได้รับสิทธิ์ใช้งาน + Affiliate URL เข้า D1 โดยเริ่ม `active=0`
2. ตรวจชื่อ รูป ราคา ร้าน และ redirect
3. ตั้ง `active=1` เฉพาะรายการที่ตรวจแล้ว
4. ตรวจ click tracking และหน้า Home/Search/Recommendations
5. เริ่มติดตาม Search Console และ click data เพื่อเลือกหมวดสินค้าที่ควรขยาย
