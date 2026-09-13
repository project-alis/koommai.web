from pathlib import Path

p = Path('worker/index.js')
text = p.read_text(encoding='utf-8')

marker = "const DISCOVERY_SELECT = `SELECT ${DISCOVERY_FIELDS} FROM discovery_entities`;\n"
insert = """

let discoveryCorePromise = null;

async function ensureDiscoveryCore(env) {
  if (discoveryCorePromise) return discoveryCorePromise;
  discoveryCorePromise = (async () => {
    try {
      await env.DB.prepare('SELECT id FROM discovery_entities LIMIT 1').all();
      return true;
    } catch {}

    try {
      await env.DB.batch([
        env.DB.prepare(`CREATE TABLE IF NOT EXISTS discovery_entities (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          slug TEXT NOT NULL UNIQUE,
          entity_type TEXT NOT NULL CHECK(entity_type IN ('service','shop','secondhand','free','food','place')),
          category TEXT,
          name TEXT NOT NULL,
          description TEXT,
          image_url TEXT,
          source_name TEXT,
          source_url TEXT,
          outbound_url TEXT,
          phone TEXT,
          line_url TEXT,
          price_text TEXT,
          price_value REAL,
          latitude REAL,
          longitude REAL,
          district TEXT,
          province TEXT,
          verified INTEGER NOT NULL DEFAULT 0,
          featured INTEGER NOT NULL DEFAULT 0,
          active INTEGER NOT NULL DEFAULT 1,
          sort_order INTEGER NOT NULL DEFAULT 100,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`),
        env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_discovery_entities_active_type
          ON discovery_entities(active, entity_type, featured DESC, sort_order ASC)`),
        env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_discovery_entities_category
          ON discovery_entities(active, category)`),
        env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_discovery_entities_location
          ON discovery_entities(active, province, district)`),
        env.DB.prepare(`CREATE TABLE IF NOT EXISTS discovery_click_events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          entity_id INTEGER NOT NULL,
          action TEXT NOT NULL DEFAULT 'open',
          referrer_path TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(entity_id) REFERENCES discovery_entities(id)
        )`),
        env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_discovery_click_events_entity_created
          ON discovery_click_events(entity_id, created_at)`)
      ]);
      return true;
    } catch {
      discoveryCorePromise = null;
      return false;
    }
  })();
  return discoveryCorePromise;
}
"""

if 'async function ensureDiscoveryCore(env)' not in text:
    if marker not in text:
        raise SystemExit('DISCOVERY_SELECT marker not found')
    text = text.replace(marker, marker + insert, 1)

old = "  if (type !== 'product') {\n    const box = hasLocation ? locationBox(lat, lng, 30) : null;"
new = "  const discoveryCoreReady = type === 'product' ? true : await ensureDiscoveryCore(env);\n\n  if (type !== 'product' && discoveryCoreReady) {\n    const box = hasLocation ? locationBox(lat, lng, 30) : null;"
if old in text:
    text = text.replace(old, new, 1)
elif 'const discoveryCoreReady' not in text:
    raise SystemExit('Discovery core hook marker not found')

start_marker = "    if (url.pathname === '/api/health' && request.method === 'GET') {"
end_marker = "\n\n    if (url.pathname === '/api/discover'"
start = text.index(start_marker)
end = text.index(end_marker, start)
health = """    if (url.pathname === '/api/health' && request.method === 'GET') {
      let affiliateReady = false;
      let searchIndexReady = false;
      let counts = { total: 0, active: 0 };

      try {
        await env.DB.prepare(`
          SELECT source_platform, source_url, current_price, previous_price, discount_percent,
                 popularity_score, shop_logo_url, last_checked_at
          FROM affiliate_products
          LIMIT 1
        `).all();
        await env.DB.prepare(`SELECT id FROM click_events LIMIT 1`).all();
        const row = await env.DB.prepare(`
          SELECT COUNT(*) AS total,
                 SUM(CASE WHEN ${LIVE_PRODUCT_FILTER} THEN 1 ELSE 0 END) AS active
          FROM affiliate_products
        `).first();
        counts = { total: Number(row?.total || 0), active: Number(row?.active || 0) };
        affiliateReady = true;
      } catch {}

      const discoveryCoreReady = await ensureDiscoveryCore(env);
      if (discoveryCoreReady) {
        try {
          await env.DB.prepare(`SELECT rowid FROM discovery_entities_fts LIMIT 1`).all();
          searchIndexReady = true;
        } catch {}
      }

      const ok = affiliateReady && discoveryCoreReady;
      return json({
        ok,
        db: affiliateReady,
        schema: searchIndexReady ? 'meepiap-discovery-v1' : (discoveryCoreReady ? 'meepiap-discovery-core' : 'migration-required'),
        discovery: {
          core: discoveryCoreReady,
          search_index: searchIndexReady,
          search_mode: searchIndexReady ? 'fts5' : 'like-fallback'
        },
        products: counts
      }, {
        status: ok ? 200 : 503,
        headers: { 'cache-control': 'no-store' }
      });
    }"""
text = text[:start] + health + text[end:]

old_out = "    if (url.pathname.startsWith('/out/') && request.method === 'GET') {\n      const slug = decodeURIComponent(url.pathname.slice(5)).slice(0, 120);"
new_out = "    if (url.pathname.startsWith('/out/') && request.method === 'GET') {\n      if (!await ensureDiscoveryCore(env)) {\n        return new Response('ระบบลิงก์ขัดข้องชั่วคราว', { status: 503, headers: { 'x-robots-tag': 'noindex, nofollow' } });\n      }\n      const slug = decodeURIComponent(url.pathname.slice(5)).slice(0, 120);"
if old_out in text:
    text = text.replace(old_out, new_out, 1)

p.write_text(text, encoding='utf-8')
