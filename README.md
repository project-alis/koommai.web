# MEEPIAP (มีเพียบ) — Discovery V1

**MEEPIAP — ค้นทีเดียว เจอเพียบ**

MEEPIAP คือ Universal Discovery สำหรับค้นของ ร้าน บริการซ่อม ของมือสอง ของฟรี ของกิน และดีลออนไลน์จากจุดเดียว โดยต่อยอดระบบ Affiliate/SEO เดิมและคง D1 เดิมไว้เพื่อไม่เพิ่มความเสี่ยงจากการย้ายฐานข้อมูล

## Brand
- Public brand: `มีเพียบ`
- International / domain identity: `MEEPIAP`
- Main domain: `https://meepiap.com`
- Package: `meepiap-web`
- Positioning: `ค้นทีเดียว เจอเพียบ`

## Discovery worlds
1. ของเพียบ
2. ซ่อมเพียบ
3. มือสองเพียบ
4. ฟรีเพียบ
5. ร้านเพียบ
6. กินเพียบ

หน้า Home เป็น mobile-first Discovery UI: Search ใหญ่, หมวดกดง่าย, Quick Search, Near Me, responsive cards และ reduced-motion support

## Core APIs
- `/api/discover` — ค้นสินค้า + Discovery entities จากจุดเดียว
- `/api/home-feed` — สินค้า Affiliate ที่พร้อมแสดง
- `/api/product-search` — ค้นสินค้า Affiliate
- `/api/recommendations` — คำแนะนำตาม tool
- `/api/health` — ตรวจ Affiliate DB + Discovery core + Search index
- `/go/:slug` — track click แล้ว redirect Affiliate
- `/out/:slug` — track click แล้ว redirect ร้าน/บริการ/ประกาศต้นทาง

## Search architecture
- Discovery core อยู่ใน `discovery_entities`
- Click tracking อยู่ใน `discovery_click_events`
- Migration `0005` เพิ่ม `search_terms` + SQLite FTS5
- Near Me ใช้ bounding box ก่อนคำนวณระยะจริงเพื่อลด D1 row reads
- ถ้า FTS5 ยังไม่ถูก apply ระบบจะ fallback เป็น LIKE search โดยไม่ทำให้หน้า Discovery ล่ม
- ถ้า migration `0004` ยังไม่ทัน Worker สามารถ bootstrap เฉพาะ Discovery core แบบ idempotent ได้เอง จากนั้น migration ปกติยังสามารถ apply ต่อภายหลังได้

## Affiliate safety
- แสดงสินค้า active เฉพาะรายการที่มี `affiliate_url` แบบ HTTPS จริง
- Placeholder Affiliate URL จะไม่ขึ้น Home/Search/Recommendations
- `/go/:slug` ตรวจสอบปลายทางก่อนบันทึก click และ redirect
- Affiliate safety flow เดิมยังคงอยู่ครบ

## Infrastructure
- Cloudflare Worker name: `meepiap`
- Custom domains: `meepiap.com`, `www.meepiap.com`
- `www` และ workers.dev redirect ไป `https://meepiap.com`
- D1 binding: `DB`
- D1 database: `koommai-db`
- D1 database ID: `e629bb4c-0c0b-4e94-bba3-5032b3046114`
- **ไม่ rename D1 เพียงเพื่อ rebrand**

`wrangler.jsonc` เป็น source of truth สำหรับ Worker, custom domain routes, assets และ D1 binding

## D1 migrations
```text
0001_init.sql
0002_auto_product_cards.sql
0003_home_feed.sql
0004_discovery_core.sql
0005_discovery_search_scale.sql
```

สำหรับ manual deploy:
```bash
npm install
npm run deploy
```

`npm run deploy` จะ apply D1 migrations ไปที่ `koommai-db` ก่อน `wrangler deploy`

Cloudflare Workers Builds ที่เชื่อม GitHub อาจใช้ `npx wrangler deploy` โดยตรงและไม่ apply D1 migrations อัตโนมัติ จึงมี runtime fallback สำหรับ Discovery core แต่ควร apply migrations `0004–0005` ให้ครบเมื่อมี D1 Edit permission เพื่อเปิด FTS5 เต็มรูปแบบ

## Data policy
- ไม่ scrape/เก็บรูปหรือข้อมูลภายนอกแบบไม่มีสิทธิ์
- ใช้ข้อมูลจากเจ้าของร้าน, ผู้ใช้ส่งข้อมูล, Affiliate feed/API ที่อนุญาต, Open Data หรือแหล่งที่มีสิทธิ์ชัดเจน
- รูปจำนวนมากควรเก็บใน R2 ไม่ใช่ D1
- ไม่มีข้อมูลจริงเพียงพอ = ไม่สร้างหน้า SEO จำนวนมากแบบ thin/doorway pages

## Production quality
Permanent CI อยู่ที่ `.github/workflows/ci.yml` และตรวจ:
- JavaScript syntax
- JSON syntax
- D1 migrations + FTS5 smoke test
- MEEPIAP brand audit
- UI asset wiring

## โครงสร้างหลัก
```text
public/
  index.html
  assets/
  tools/
  guides/
  about/
  privacy/
  affiliate-disclosure/
  contact/
worker/
  index.js
migrations/
examples/
package.json
wrangler.jsonc
```

## Next product priorities
1. ใส่ข้อมูลจริงชุดแรก: ซ่อมเพียบ + ของเพียบ + ฟรี/มือสองเพียบ
2. Apply D1 migrations `0004–0005` ใน production เพื่อเปิด FTS5 เต็มรูปแบบ
3. เพิ่ม R2 สำหรับรูปที่เราได้รับสิทธิ์ให้เก็บเอง
4. เปิด Claim ร้าน / เพิ่มข้อมูล / Save / Alert
5. ต่อ Google Search Console และเริ่มวัด query/click จริง
