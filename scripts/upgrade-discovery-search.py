from pathlib import Path
import re

path = Path('worker/index.js')
text = path.read_text(encoding='utf-8')

text = text.replace(
"""  const lat = Number(url.searchParams.get('lat'));
  const lng = Number(url.searchParams.get('lng'));
  const hasLocation = Number.isFinite(lat) && Number.isFinite(lng);
""",
"""  const latRaw = url.searchParams.get('lat');
  const lngRaw = url.searchParams.get('lng');
  const lat = latRaw === null ? Number.NaN : Number(latRaw);
  const lng = lngRaw === null ? Number.NaN : Number(lngRaw);
  const hasLocation = Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
"""
)

pattern = re.compile(r"""  if \(type !== 'product'\) \{\n    try \{\n      let sql = `\$\{DISCOVERY_SELECT\} WHERE active = 1`;.*?\n    \} catch \{\}\n  \}\n""", re.S)

replacement = r"""  if (type !== 'product') {
    try {
      const useFts = q.length >= 3;
      const entitySelect = useFts ? `
        SELECT d.id, d.slug, d.entity_type, d.category, d.name, d.description, d.image_url, d.source_name, d.source_url, d.outbound_url,
               d.phone, d.line_url, d.price_text, d.price_value, d.latitude, d.longitude, d.district, d.province,
               d.verified, d.featured, d.sort_order, d.updated_at
        FROM discovery_entities d
        JOIN discovery_fts ON discovery_fts.rowid = d.id
      ` : DISCOVERY_SELECT;
      const c = useFts ? 'd.' : '';
      let sql = `${entitySelect} WHERE ${c}active = 1`;
      const binds = [];
      let p = 1;

      if (type !== 'all') {
        sql += ` AND ${c}entity_type = ?${p}`;
        binds.push(type);
        p += 1;
      }

      if (q) {
        const like = `%${q}%`;
        if (useFts) {
          sql += ` AND (discovery_fts.name LIKE ?${p} OR discovery_fts.description LIKE ?${p} OR discovery_fts.category LIKE ?${p} OR discovery_fts.district LIKE ?${p} OR discovery_fts.province LIKE ?${p})`;
        } else {
          sql += ` AND (${c}name LIKE ?${p} OR ${c}description LIKE ?${p} OR ${c}category LIKE ?${p} OR ${c}district LIKE ?${p} OR ${c}province LIKE ?${p})`;
        }
        binds.push(like);
        p += 1;
      }

      if (hasLocation) {
        const latDelta = 0.6;
        const lngDelta = latDelta / Math.max(Math.cos(lat * Math.PI / 180), 0.2);
        sql += ` AND ${c}latitude BETWEEN ?${p} AND ?${p + 1} AND ${c}longitude BETWEEN ?${p + 2} AND ?${p + 3}`;
        binds.push(lat - latDelta, lat + latDelta, lng - lngDelta, lng + lngDelta);
        p += 4;
      }

      sql += ` ORDER BY ${c}featured DESC, ${c}verified DESC, ${c}sort_order ASC, ${c}id DESC LIMIT ${hasLocation ? 80 : 30}`;
      const stmt = env.DB.prepare(sql);
      const rows = binds.length ? await stmt.bind(...binds).all() : await stmt.all();
      (rows.results || []).forEach(row => items.push(discoveryEntityDto(row)));
    } catch {
      // Keep product results usable even if a discovery index is temporarily unavailable.
    }
  }
"""

text, count = pattern.subn(replacement, text, count=1)
if count != 1:
    raise SystemExit('Could not locate discovery entity search block')

path.write_text(text, encoding='utf-8')
