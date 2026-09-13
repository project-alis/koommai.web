# MEEPIAP / มีเพียบ — Affiliate Publisher V2, Phase 1

Production public origin: https://meepiap.com
Branch: `feature/meepiap-affiliate-publisher-v2`

This phase adds a private product back office to the existing Universal Discovery site. It does not introduce a new public publishing system.

## Audit and decisions

Audited baseline: `303313e62efa41a63a5dd56b2d88a129645ac00b`, the V2 branch and origin/main at audit time. Revenue V1 work belongs to a separate branch/worktree and is excluded.

Reviewed the repository file inventory, Worker routing, public homepage and assets, tools/guides, migrations 0001–0005, SQL examples, package/configuration, documentation and both GitHub workflows.

| Classification | Findings and treatment |
| --- | --- |
| Public Branding | Homepage, navigation, metadata, manifest and production URLs already use MEEPIAP / มีเพียบ and meepiap.com. Corrected the old brand in the fallback product SVG and app.js not-found message. No OHOPIAP / ohopiap / โอ้โหเพียบ branding remains in public runtime files. |
| Normal Thai Content | “คุ้มไหม?” remains in promo-check questions and ordinary guide copy, including energy monitoring and product advice. These are questions, not site names. |
| Code Identifier | Existing meepiap asset names and identifiers remain. Updated an obsolete Koommai CSS comment and old brand labels in historical README/example headings individually. |
| Infrastructure | The GitHub project path project-alis/koommai.web remains valid; no repository rename. Worker name meepiap, meepiap.com/www.meepiap.com routes and canonical redirect remain. |
| Database Resource | Binding DB, physical database koommai-db and its configured database_id remain unchanged. Existing migration names and table names are preserved. Historical README-V1.7 rebrand references document history. |

Search terms reviewed: OHOPIAP, ohopiap, โอ้โหเพียบ, Koommai, koommai, คุ้มไหม, MEEPIAP and meepiap. This report records historical terms for audit purposes; they are not public branding. No global replacement was performed.

## Architecture

- `worker/index.js` remains the public router. Only an admin routing hook and robots exclusion are added.
- `worker/admin.js` renders private HTML forms on the server. Admin requests always run through the Worker, including when static assets are enabled.
- `worker/admin-auth.js` handles Web Crypto password checks, signed cookies, D1 session revocation and native login rate limiting.
- `worker/admin-products.js` validates input and uses bound D1 statements. Conditional updates compare the previous editable values and timestamp to reject stale/concurrent overwrites.
- `public/assets/admin.css` provides the responsive admin layout without a JavaScript framework.
- Existing `affiliate_products` remains the only Product Master. No product copy or replacement table.
- Existing public APIs, /go redirects, discovery entities and FTS remain in their original implementation.

## Schema

New additive migration: `migrations/0006_affiliate_publisher_v2.sql`.

| Table | Purpose |
| --- | --- |
| clips | Clip metadata and draft/published/archived status, reserved for later phases |
| clip_products | Ordered clip-to-product relationship |
| collections | Collection metadata and status |
| collection_items | Ordered collection-to-product relationship |
| content_ideas | Ideas optionally linked to an existing product or clip |
| page_views | Future page attribution storage; no public tracking endpoint in Phase 1 |
| admin_sessions | Hash of random session ID, expiry and revocation time for server-enforced logout |

`click_events` gains nullable `clip_id`, `collection_id`, `source` and `campaign`, plus relationship/time indexes. The first two reference the new tables. The audited schema through 0005 has none of these columns. Existing inserts omit the new fields and continue to work.

There is no DROP, rename, data deletion, D1 recreation or modification to migrations 0001–0005. New relationship constraints preserve referenced products; Phase 1 deactivates products rather than deleting them.

## Routes

| Method | Route | Behavior |
| --- | --- | --- |
| GET | /admin/login/ | Signed login challenge and password form |
| POST | /admin/login/ | Rate limit, CSRF/origin check, password verification, session creation |
| GET | /admin/ | Authenticated home |
| POST | /admin/logout/ | CSRF check, server revocation and cookie expiration |
| GET | /admin/products/ | Search name/slug/category/merchant; 50 items per page |
| GET | /admin/products/new/ | New product form, inactive by default |
| POST | /admin/products/ | Create product |
| GET | /admin/products/:id/ | Edit form |
| POST | /admin/products/:id/ | Validate and update product |
| POST | /admin/products/:id/status/ | Activate/deactivate while preserving other stored values |

All admin HTML/responses use no-store, noindex/nofollow, CSP and no-referrer. Admin routes are excluded from robots and sitemap. Unauthorized access redirects to login. HTTP admin requests are rejected; use HTTPS.

Editable fields: name, slug, category, tool_key, merchant, source_platform, source_url, affiliate_url, image_url, image_alt, display_price, current_price, previous_price, badge, highlight, reason, shop_logo_url, popularity_score, sort_order and active. Discount percentage is derived from entered prices; created_at and last_checked_at are not user-editable.

Slugs use lowercase ASCII letters/numbers separated by hyphens. URLs must be HTTPS without credentials. Inactive drafts may have an empty affiliate URL. Activation requires a valid HTTPS affiliate URL. Price fields allow up to two decimal places and remain compatible with the existing REAL price columns. Changing a slug changes its /go URL; there is no alias system.

## Admin setup and secrets

Use Node.js 24 or later. Passwords and secrets are never stored in source/configuration.

1. Run `npm install`.
2. Run `npm run admin:password-hash` in an interactive terminal. The helper hides input, requires a password of 16–1024 characters and confirmation, and outputs only a salted hash.
3. Generate a separate cryptographically random SESSION_SECRET with a password manager (at least 32 random bytes). Do not reuse a password or hash as this secret.
4. For local development only, put the hash and secret into the ignored `.dev.vars` file as quoted values named ADMIN_PASSWORD_HASH and SESSION_SECRET.
5. After explicit deployment approval, set Cloudflare Secrets interactively:
   ```sh
   npx wrangler secret put ADMIN_PASSWORD_HASH
   npx wrangler secret put SESSION_SECRET
   ```
   These commands modify production configuration and are documentation only in this checkpoint.

Password format is `pbkdf2-sha256$100000$<16-byte salt in hex>$<32-byte derived key in hex>`. Password verification uses Web Crypto PBKDF2/SHA-256 with 100,000 iterations and an equal-length constant-work comparison. Use a strong unique generated password; this single-admin design has no MFA.

Session cookies are HMAC-SHA-256 signed, host-only (__Host- prefix), HttpOnly, Secure and SameSite=Strict, with an eight-hour absolute expiry. D1 stores only a hash of the random session ID. Logout revokes the session server-side, so a captured old cookie cannot be replayed after logout. Rotating either secret invalidates existing sessions. Login challenges expire after ten minutes. Every write requires both a signed-session CSRF token and an exact same-origin Origin header.

ADMIN_LOGIN_LIMITER is a Cloudflare native rate-limit binding, five login POST attempts per IP per minute, with hashed IP keys. Missing binding, missing trusted CF-Connecting-IP, provider errors or missing secrets fail closed. Native limits apply per Cloudflare location and are not a global account lockout; distributed attack protection/MFA can be added later.

## Local migration and verification

Run from this branch's worktree:
```sh
npm install
npm run db:local
npm test
npm run check
npx wrangler deploy --dry-run --outdir .wrangler/dry-run
npx wrangler dev --local-protocol https
```

The dry run bundles locally and does not deploy. Local migrations use `--local`, never `--remote`. Accept the local development certificate when opening the admin UI. Native login protection requires the runtime to supply CF-Connecting-IP; local requests without it intentionally fail closed. Integration tests inject a mock binding and trusted test request header without adding a production bypass.

Tests use Node's in-memory SQLite with real migration SQL and a small D1 API adapter. They cover login/session/CSRF/logout, rate-limit failure paths, product CRUD/status, stale edits, escaping/validation, existing pages/APIs, and upgrades from a populated 0005 database. Cloudflare HTMLRewriter is a test double in Node route tests; live edge behavior and browser rendering still require staging verification.

CI runs `npm run check` and `npm test` on pull requests and pushes to main or the V2 branch. Tests need no Cloudflare credentials.

## Deployment procedure — requires separate approval

No production deployment, remote migration, secret modification or merge is part of this checkpoint.

1. Review the final commit/diff and confirm branch, D1 database identity and applied migration history. If production schema has diverged (e.g. any requested new column already exists), stop and reconcile before applying 0006.
2. Back up/export the current D1 database through the approved operational procedure.
3. Apply pending migrations to the existing database using `npx wrangler d1 migrations apply koommai-db --remote` only after approval. Never recreate the database.
4. Configure the two secrets through Cloudflare Secrets and verify the native rate-limit binding.
5. Deploy the reviewed Worker/assets through the existing approved deployment workflow. The existing `npm run deploy` script applies remote migrations before deploying; do not use it for local testing.
6. Verify HTTPS homepage, /tools/, /guides/, health, discovery search, affiliate home-feed/product-search/recommendations and a known /go URL. Verify unauthorized access, login, product edits, deactivation and logout with a controlled test product.

## Rollback

Roll back the Worker/assets to the previously known-good deployment. Leave the additive tables and columns in place; older code ignores them. Do not reverse the migration by dropping tables or delete existing product/click data. Product edits are live shared data and are not automatically undone by code rollback; restore individual values from the approved backup/history if required. Secret rotation can invalidate all admin sessions. The previous code's static 404 handling makes removed admin pages unavailable.

## Known limitations and excluded work

One administrator password, no roles, MFA, password recovery, edit audit log, media upload or bulk import. Product image fields are URLs. Expired/revoked session records remain in D1; retention cleanup needs an approved later policy. The small native IP rate limit is approximate/per-location. Public feeds use their existing caching behavior, so an update may take the existing cache lifetime to appear; /go checks current active state.

The six V2 publishing tables are foundations only. No TikTok /t/:slug landing, collection public page, clip/collection admin UI, AI generator, automatic SEO pages, commission integration, marketplace scraping, distribution integration or React/Next rewrite was added.

## Checkpoint verification

- npm test: 15 passed, 0 failed (including populated legacy migration upgrade).
- npm run check: passed.
- npm run db:local: migrations 0001–0006 applied successfully to local D1.
- Wrangler deploy --dry-run: bundle/configuration passed, no deployment.
- Additional direct Miniflare smoke attempt was inconclusive: the standalone harness did not complete runtime startup and was stopped. It is not counted as a passing runtime/browser test.
- No production requests, remote migrations, deployment, production secret writes or merge were performed.
