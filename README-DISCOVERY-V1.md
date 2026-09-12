# MEEPIAP Discovery V1

## Positioning

**MEEPIAP — ค้นทีเดียว เจอเพียบ**

MEEPIAP evolves from a product/affiliate price-check site into a universal Thai discovery layer. A single query can surface multiple ways to solve the same need rather than only selling a new product.

Initial discovery worlds:

- 🛒 ของเพียบ — new products, deals, affiliate links
- 🔧 ซ่อมเพียบ — repair shops, technicians, services
- ♻️ มือสองเพียบ — second-hand listings
- 🎁 ฟรีเพียบ — giveaways, free items, free activities
- 🏪 ร้านเพียบ — local businesses and relevant shops
- 🍜 กินเพียบ — food and restaurants

## Product principle

For a query such as `ตู้เย็น`, MEEPIAP should eventually be able to show:

- new refrigerators / online deals
- second-hand refrigerators
- free/giveaway refrigerators
- refrigerator repair services
- nearby appliance stores

This is a discovery layer, not a copy of another marketplace or map database.

## Data model

Existing `affiliate_products` remains the source for online products and affiliate monetization.

Migration `0004_discovery_core.sql` adds `discovery_entities` for non-product discovery records and `discovery_click_events` for outbound click measurement.

Supported entity types:

- `service`
- `shop`
- `secondhand`
- `free`
- `food`
- `place`

Each entity may contain category, source, outbound URL, price, province/district and latitude/longitude. User location is only sent with a search request when the user explicitly chooses “ใกล้ฉัน”; it is not stored by this schema.

## APIs

### `GET /api/discover`

Parameters:

- `q` — search text
- `type` — `all`, `product`, `service`, `shop`, `secondhand`, `free`, `food`, or `place`
- `lat`, `lng` — optional coordinates used to sort entities with coordinates by distance

The endpoint merges existing Affiliate products with `discovery_entities`.

### `GET /out/:slug`

Tracks a discovery entity click then redirects to its allowed source/outbound URL.

Existing product affiliate redirect remains `GET /go/:slug`.

## Data sourcing rule

Do not scrape screenshots or permanently copy third-party marketplace/map content without permission. Prefer:

1. business-owner submissions,
2. affiliate/product feeds that permit display,
3. APIs/licensed datasets with clear terms,
4. public/open data with compatible licenses,
5. manually curated records that link back to the source.

Store only the data needed for MEEPIAP discovery and attribution.

## MVP rollout

Phase 1 keeps real Affiliate products as **ของเพียบ** and starts manually curated **ซ่อมเพียบ** records in one test area. This gives the strongest high-intent local use case without trying to populate every category at once.

After measuring search and outbound clicks, expand in this order:

1. ซ่อมเพียบ / services
2. ร้านเพียบ / local shops
3. มือสองเพียบ
4. ฟรีเพียบ
5. กินเพียบ

## Monetization paths

- Affiliate commission — products/deals
- Sponsored listing — shops/services
- Lead fee — repair/service businesses
- Promoted listing — second-hand listings
- Claim Business / Premium profile — local businesses
- Ads only after useful organic inventory exists

## Important

The D1 database remains `koommai-db` internally for migration safety. Renaming the database is not required for the MEEPIAP brand.
