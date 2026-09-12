# มีเพียบ (MEEPIAP) V1.7.1 UI

V1.7 rebranded the project from Koommai / คุ้มไหม? to MEEPIAP / มีเพียบ.

V1.7.1 refines the brand hierarchy for Thai users:
- Primary public-facing name: `มีเพียบ`
- International / domain name: `MEEPIAP`
- Domain target: `meepiap.com`
- Feature proposition remains: `ราคานี้…คุ้มไหม?`

UI direction remains the approved V1.7 visual mockup: cream/navy/orange/green, big price-check hero, Shopee search CTA, trust row, category chips, ranked auto-product cards, shops, tools and transparent data-source section.

## V1.7.1 scope
- Prioritize `มีเพียบ` in the header, footer and public page titles
- Keep `MEEPIAP` in metadata and as the international/domain identity
- Keep existing V1.7 layout and business features unchanged
- Keep existing D1 database, migrations, API and Affiliate logic unchanged
- Keep Cloudflare Worker deployment configuration unchanged

## Core files
- public/index.html
- public/site.webmanifest
- public/about/index.html
- public/privacy/index.html
- public/affiliate-disclosure/index.html
- public/contact/index.html
- public/tools/
- public/guides/
- public/404.html

No D1 migration is required. V1.6/V1.7 API, D1 and Affiliate logic stay unchanged.

Preview: append `?preview=1` to the site URL until real products are active.
