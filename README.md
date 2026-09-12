# MEEPIAP (มีเพียบ) — V1.7

MEEPIAP คือเว็บไซต์ช่วยตัดสินใจก่อนซื้อ ก่อนขาย และก่อนจ่าย โดยรีแบรนด์จากชื่อเดิม Koommai ใน V1.7

## ฟังก์ชันหลัก
1. โปรนี้คุ้มจริงไหม?
2. ขายราคานี้เหลือกำไรไหม?
3. อันไหนถูกกว่าจริง?
4. Auto Product Cards จาก D1
5. Affiliate redirect ผ่าน `/go/:slug`
6. SEO pages, sitemap, robots.txt และ structured data

## V1.7 Rebrand
- Brand: `MEEPIAP`
- Thai name: `มีเพียบ`
- Package: `meepiap-web`
- หน้าเว็บ, SEO title, PWA manifest, favicon, About, Privacy, Affiliate Disclosure, Contact, Tools และ Guides เปลี่ยนเป็นแบรนด์ใหม่
- คำว่า “คุ้มไหม?” ยังคงใช้ในบริบทของคำถาม/ฟีเจอร์ เช่น “โปรนี้คุ้มจริงไหม?” ไม่ใช่ชื่อแบรนด์

## Infrastructure ที่คงเดิมเพื่อความปลอดภัย
- Cloudflare Worker name: `koommai`
- D1 binding: `DB`
- D1 database: `koommai-db`
- D1 database ID: `e629bb4c-0c0b-4e94-bba3-5032b3046114`
- migrations และ schema เดิม
- API / Affiliate logic เดิมจาก V1.6

> V1.7 ไม่ต้องทำ D1 migration สำหรับการรีแบรนด์

## Development
```bash
npm install
npm run dev
```

## Deploy
```bash
npm run deploy
```

คำสั่ง deploy จะ apply migrations กับ `koommai-db` เดิมก่อน deploy Worker

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
package.json
wrangler.jsonc
```

## หมายเหตุสำหรับขั้นถัดไป
ยังไม่ควร rename `koommai-db` หรือเปลี่ยน database ID เพียงเพื่อรีแบรนด์ ส่วน Worker name และ GitHub repository name ควรพิจารณาแยกหลังจากทดสอบ V1.7 ผ่านและเตรียม production domain ของ MEEPIAP แล้ว
