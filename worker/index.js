const INDEXABLE_PATHS = [
  '/',
  '/tools/',
  '/tools/profit-online/',
  '/tools/promo-check/',
  '/tools/unit-price/',
  '/guides/',
  '/guides/discount-15-max-100/',
  '/guides/compare-unit-price/',
  '/guides/online-selling-profit/',
  '/about/',
  '/privacy/',
  '/affiliate-disclosure/',
  '/contact/'
];

const CATEGORY_COPY = {
  powerbank: 'เหมาะกับคนที่ต้องการแบตสำรองพกง่าย ใช้กับมือถือระหว่างวัน',
  charger: 'เหมาะกับคนที่กำลังหาอุปกรณ์ชาร์จไว้ใช้ประจำหรือพกเดินทาง',
  cable: 'ตัวเลือกอุปกรณ์เสริมที่ใช้คู่กับมือถือและอุปกรณ์ชาร์จได้',
  smartplug: 'เหมาะกับการตั้งเวลาเปิด-ปิดอุปกรณ์และช่วยติดตามการใช้ไฟ',
  office: 'เหมาะกับงานออฟฟิศและช่วยลดขั้นตอนงานจุกจิกประจำวัน',
  packaging: 'เหมาะกับร้านค้าออนไลน์ที่ต้องแพ็กและจัดส่งสินค้าเป็นประจำ',
  label: 'เหมาะกับร้านค้าออนไลน์ที่ต้องพิมพ์ฉลากหรือจัดการงานส่งของ',
  household: 'เหมาะกับการเทียบราคาต่อหน่วยของของใช้ประจำบ้านที่มีหลายขนาดแพ็ก',
  pantry: 'เหมาะกับการเทียบราคาต่อหน่วยของอาหารและเครื่องดื่มที่ขายหลายขนาด',
  pet: 'เหมาะกับการเทียบต้นทุนต่อหน่วยของอาหารและของใช้สำหรับสัตว์เลี้ยง',
  personal: 'เหมาะกับการเทียบราคาต่อหน่วยของของใช้ส่วนบุคคลที่มีหลายขนาด',
  general: 'เป็นตัวเลือกที่เกี่ยวข้องกับผลคำนวณของคุณ'
};

const DISCOVERY_TYPE_LABELS = {
  product: 'ของเพียบ',
  service: 'ซ่อมเพียบ',
  shop: 'ร้านเพียบ',
  secondhand: 'มือสองเพียบ',
  free: 'ฟรีเพียบ',
  food: 'กินเพียบ',
  place: 'ที่เพียบ'
};

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { 'content-type': 'application/json; charset=utf-8', ...(init.headers || {}) }
  });
}

function safeReferrerPath(request) {
  const ref = request.headers.get('referer');
  if (!ref) return null;
  try {
    const u = new URL(ref);
    return u.origin === new URL(request.url).origin ? u.pathname.slice(0, 200) : null;
  } catch { return null; }
}

function canonicalPath(pathname) {
  if (pathname === '/') return '/';
  return pathname.endsWith('/') ? pathname : `${pathname}/`;
}

function safeExternalUrl(value) {
  if (!value) return null;
  try {
    const u = new URL(value);
    return ['https:', 'http:'].includes(u.protocol) ? u.toString() : null;
  } catch { return null; }
}

function safeImageUrl(value) {
  return safeExternalUrl(value);
}

function autoReason(row) {
  if (row.reason?.trim()) return row.reason.trim();
  if (row.highlight?.trim()) return row.highlight.trim();
  const discount = Number(row.discount_percent || 0);
  if (discount >= 20) return `ราคาลดจากราคาอ้างอิงประมาณ ${Math.round(discount)}% จัดว่าเป็นช่วงราคาที่น่าจับตา`;
  if (discount >= 8) return `ราคาต่ำกว่าราคาอ้างอิงประมาณ ${Math.round(discount)}% ลองเทียบกับโปรและค่าส่งอีกครั้งก่อนซื้อ`;
  if (discount > 0) return `ส่วนต่างจากราคาอ้างอิงยังไม่มาก หากไม่รีบอาจรอโปรเพิ่มได้`;
  return CATEGORY_COPY[row.category] || CATEGORY_COPY.general;
}

function autoWorth(row, index = 0) {
  const d = Number(row.discount_percent || 0);
  if (d >= 20) return { badge: 'คุ้มมาก', state: 'good' };
  if (d >= 8) return { badge: 'ราคาดี', state: 'good' };
  if (d > 0) return { badge: 'ควรรอ', state: 'warn' };
  if (row.badge?.trim()) return { badge: row.badge.trim(), state: 'neutral' };
  return { badge: index === 0 ? 'น่าจับตา' : 'เช็กก่อนซื้อ', state: 'neutral' };
}

function displayPrice(row) {
  const current = Number(row.current_price);
  if (Number.isFinite(current) && current > 0) return `฿${new Intl.NumberFormat('th-TH', { maximumFractionDigits: 2 }).format(current)}`;
  return row.display_price || null;
}

function previousPrice(row) {
  const previous = Number(row.previous_price);
  if (Number.isFinite(previous) && previous > 0) return `฿${new Intl.NumberFormat('th-TH', { maximumFractionDigits: 2 }).format(previous)}`;
  return null;
}

function productDto(row, index = 0) {
  const worth = autoWorth(row, index);
  return {
    name: row.name,
    category: row.category || 'general',
    display_price: displayPrice(row),
    previous_price: previousPrice(row),
    discount_percent: Number(row.discount_percent || 0),
    reason: autoReason(row),
    badge: worth.badge,
    state: worth.state,
    merchant: row.merchant || row.source_platform || null,
    image_url: safeImageUrl(row.image_url),
    image_alt: row.image_alt || row.name,
    source_platform: row.source_platform || null,
    last_checked_at: row.last_checked_at || null,
    go_url: `/go/${encodeURIComponent(row.slug)}`
  };
}

function discoveryProductDto(row, index = 0) {
  const p = productDto(row, index);
  return {
    id: `product:${row.id}`,
    kind: 'product',
    type_label: DISCOVERY_TYPE_LABELS.product,
    slug: row.slug,
    name: p.name,
    category: p.category,
    description: p.reason,
    image_url: p.image_url,
    price_text: p.display_price,
    previous_price: p.previous_price,
    discount_percent: p.discount_percent,
    badge: p.badge,
    merchant: p.merchant,
    source_name: row.source_platform || p.merchant || 'Marketplace',
    location_text: null,
    latitude: null,
    longitude: null,
    verified: false,
    featured: Number(row.popularity_score || 0) > 0,
    action_url: p.go_url,
    action_label: 'ดูราคาวันนี้'
  };
}

function discoveryEntityDto(row) {
  const locationText = [row.district, row.province].filter(Boolean).join(', ') || null;
  return {
    id: `entity:${row.id}`,
    kind: row.entity_type,
    type_label: DISCOVERY_TYPE_LABELS[row.entity_type] || 'รายการเพียบ',
    slug: row.slug,
    name: row.name,
    category: row.category || 'general',
    description: row.description || null,
    image_url: safeImageUrl(row.image_url),
    price_text: row.price_text || (Number(row.price_value) > 0 ? `฿${new Intl.NumberFormat('th-TH').format(Number(row.price_value))}` : null),
    previous_price: null,
    discount_percent: 0,
    badge: Number(row.verified || 0) === 1 ? 'ยืนยันข้อมูลแล้ว' : null,
    merchant: null,
    source_name: row.source_name || null,
    location_text: locationText,
    latitude: Number.isFinite(Number(row.latitude)) ? Number(row.latitude) : null,
    longitude: Number.isFinite(Number(row.longitude)) ? Number(row.longitude) : null,
    verified: Number(row.verified || 0) === 1,
    featured: Number(row.featured || 0) === 1,
    action_url: (row.outbound_url || row.source_url) ? `/out/${encodeURIComponent(row.slug)}` : null,
    action_label: row.entity_type === 'service' ? 'ดูร้าน/ติดต่อ' : row.entity_type === 'secondhand' ? 'ดูประกาศ' : row.entity_type === 'free' ? 'ดูของฟรี' : 'ดูรายละเอียด'
  };
}

function distanceKm(aLat, aLng, bLat, bLng) {
  if (![aLat, aLng, bLat, bLng].every(Number.isFinite)) return null;
  const rad = (v) => v * Math.PI / 180;
  const dLat = rad(bLat - aLat);
  const dLng = rad(bLng - aLng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

async function serveHtmlWithSeo(request, env) {
  const url = new URL(request.url);
  const assetResponse = await env.ASSETS.fetch(request);
  const type = assetResponse.headers.get('content-type') || '';
  if (!type.includes('text/html') || assetResponse.status !== 200) return assetResponse;
  const canonical = `${url.origin}${canonicalPath(url.pathname)}`;
  return new HTMLRewriter()
    .on('head', {
      element(el) {
        el.append(`<link rel="canonical" href="${canonical}">`, { html: true });
        el.append(`<meta property="og:url" content="${canonical}">`, { html: true });
      }
    })
    .transform(assetResponse);
}

function sitemap(origin) {
  const lastmod = '2026-09-12';
  const urls = INDEXABLE_PATHS.map((path) => `  <url><loc>${origin}${path}</loc><lastmod>${lastmod}</lastmod></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
}

const PRODUCT_SELECT = `
  SELECT id, slug, name, category, tool_key, display_price, reason, image_url, badge, highlight, merchant, image_alt,
         source_platform, source_url, current_price, previous_price, discount_percent, popularity_score, shop_logo_url, last_checked_at
  FROM affiliate_products
`;

const DISCOVERY_SELECT = `
  SELECT id, slug, entity_type, category, name, description, image_url, source_name, source_url, outbound_url,
         phone, line_url, price_text, price_value, latitude, longitude, district, province,
         verified, featured, sort_order, updated_at
  FROM discovery_entities
`;

async function discover(request, env, url) {
  const q = (url.searchParams.get('q') || '').trim().slice(0, 120);
  const type = (url.searchParams.get('type') || 'all').trim().slice(0, 24);
  const lat = Number(url.searchParams.get('lat'));
  const lng = Number(url.searchParams.get('lng'));
  const hasLocation = Number.isFinite(lat) && Number.isFinite(lng);
  const items = [];

  if (type === 'all' || type === 'product') {
    try {
      let sql = `${PRODUCT_SELECT} WHERE active = 1`;
      const binds = [];
      if (q) {
        binds.push(`%${q}%`, q);
        sql += ` AND (name LIKE ?1 OR category LIKE ?1 OR merchant LIKE ?1 OR source_url = ?2)`;
      }
      sql += ` ORDER BY popularity_score DESC, sort_order ASC, id DESC LIMIT 18`;
      const stmt = env.DB.prepare(sql);
      const rows = q ? await stmt.bind(...binds).all() : await stmt.all();
      (rows.results || []).forEach((row, index) => items.push(discoveryProductDto(row, index)));
    } catch {}
  }

  if (type !== 'product') {
    try {
      let sql = `${DISCOVERY_SELECT} WHERE active = 1`;
      const binds = [];
      let p = 1;
      if (type !== 'all') {
        sql += ` AND entity_type = ?${p}`;
        binds.push(type);
        p += 1;
      }
      if (q) {
        const like = `%${q}%`;
        sql += ` AND (name LIKE ?${p} OR description LIKE ?${p} OR category LIKE ?${p} OR district LIKE ?${p} OR province LIKE ?${p})`;
        binds.push(like);
      }
      sql += ` ORDER BY featured DESC, verified DESC, sort_order ASC, id DESC LIMIT 30`;
      const stmt = env.DB.prepare(sql);
      const rows = binds.length ? await stmt.bind(...binds).all() : await stmt.all();
      (rows.results || []).forEach(row => items.push(discoveryEntityDto(row)));
    } catch {}
  }

  if (hasLocation) {
    items.forEach(item => {
      const d = distanceKm(lat, lng, Number(item.latitude), Number(item.longitude));
      item.distance_km = Number.isFinite(d) ? Math.round(d * 10) / 10 : null;
    });
    items.sort((a, b) => {
      const ad = Number.isFinite(a.distance_km) ? a.distance_km : Number.POSITIVE_INFINITY;
      const bd = Number.isFinite(b.distance_km) ? b.distance_km : Number.POSITIVE_INFINITY;
      if (ad !== bd) return ad - bd;
      return Number(b.featured) - Number(a.featured);
    });
  } else {
    items.sort((a, b) => Number(b.featured) - Number(a.featured));
  }

  return json({
    query: q,
    type,
    near: hasLocation,
    count: items.length,
    items: items.slice(0, 30)
  }, { headers: { 'cache-control': q || hasLocation ? 'no-store' : 'public, max-age=120' } });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/robots.txt') {
      return new Response(`User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /go/\nDisallow: /out/\nSitemap: ${url.origin}/sitemap.xml\n`, {
        headers: { 'content-type': 'text/plain; charset=utf-8' }
      });
    }

    if (url.pathname === '/sitemap.xml') {
      return new Response(sitemap(url.origin), {
        headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' }
      });
    }

    if (url.pathname === '/api/discover' && request.method === 'GET') {
      return discover(request, env, url);
    }

    if (url.pathname === '/api/home-feed' && request.method === 'GET') {
      try {
        const rows = await env.DB.prepare(`${PRODUCT_SELECT}
          WHERE active = 1
          ORDER BY popularity_score DESC, sort_order ASC, id DESC
          LIMIT 10
        `).all();
        const shopRows = await env.DB.prepare(`
          SELECT merchant, COUNT(*) AS count
          FROM affiliate_products
          WHERE active = 1 AND merchant IS NOT NULL AND TRIM(merchant) <> ''
          GROUP BY merchant
          ORDER BY count DESC, merchant ASC
          LIMIT 8
        `).all();
        return json({
          items: (rows.results || []).map(productDto),
          shops: (shopRows.results || []).map(r => ({ merchant: r.merchant, count: Number(r.count || 0) }))
        }, { headers: { 'cache-control': 'public, max-age=180, stale-while-revalidate=900' } });
      } catch {
        return json({ items: [], shops: [] }, { headers: { 'cache-control': 'public, max-age=30' } });
      }
    }

    if (url.pathname === '/api/product-search' && request.method === 'GET') {
      const q = (url.searchParams.get('q') || '').trim().slice(0, 180);
      if (!q) return json({ items: [] });
      try {
        const rows = await env.DB.prepare(`${PRODUCT_SELECT}
          WHERE active = 1 AND (
            name LIKE '%' || ?1 || '%' OR
            category LIKE '%' || ?1 || '%' OR
            merchant LIKE '%' || ?1 || '%' OR
            source_url = ?1
          )
          ORDER BY popularity_score DESC, sort_order ASC, id DESC
          LIMIT 8
        `).bind(q).all();
        return json({ items: (rows.results || []).map(productDto) }, { headers: { 'cache-control': 'no-store' } });
      } catch {
        return json({ items: [] }, { headers: { 'cache-control': 'no-store' } });
      }
    }

    if (url.pathname === '/api/recommendations' && request.method === 'GET') {
      const tool = (url.searchParams.get('tool') || '').slice(0, 60);
      if (!tool) return json({ items: [] });
      try {
        const rows = await env.DB.prepare(`${PRODUCT_SELECT}
          WHERE tool_key = ?1 AND active = 1
          ORDER BY sort_order ASC, id DESC
          LIMIT 3
        `).bind(tool).all();
        return json({ items: (rows.results || []).map(productDto) }, { headers: { 'cache-control': 'public, max-age=300, stale-while-revalidate=3600' } });
      } catch {
        return json({ items: [] }, { headers: { 'cache-control': 'public, max-age=60' } });
      }
    }

    if (url.pathname.startsWith('/go/') && request.method === 'GET') {
      const slug = decodeURIComponent(url.pathname.slice(4)).slice(0, 120);
      let product;
      try {
        product = await env.DB.prepare(`
          SELECT id, affiliate_url, tool_key
          FROM affiliate_products
          WHERE slug = ?1 AND active = 1
          LIMIT 1
        `).bind(slug).first();
      } catch {
        return new Response('ระบบลิงก์สินค้าขัดข้องชั่วคราว', { status: 503, headers: { 'x-robots-tag': 'noindex, nofollow' } });
      }
      if (!product) return new Response('ไม่พบลิงก์สินค้า', { status: 404, headers: { 'x-robots-tag': 'noindex, nofollow' } });
      try {
        await env.DB.prepare(`
          INSERT INTO click_events(product_id, tool_key, referrer_path)
          VALUES (?1, ?2, ?3)
        `).bind(product.id, product.tool_key, safeReferrerPath(request)).run();
      } catch {}
      return Response.redirect(product.affiliate_url, 302);
    }

    if (url.pathname.startsWith('/out/') && request.method === 'GET') {
      const slug = decodeURIComponent(url.pathname.slice(5)).slice(0, 120);
      let entity;
      try {
        entity = await env.DB.prepare(`
          SELECT id, outbound_url, source_url
          FROM discovery_entities
          WHERE slug = ?1 AND active = 1
          LIMIT 1
        `).bind(slug).first();
      } catch {
        return new Response('ระบบลิงก์ขัดข้องชั่วคราว', { status: 503, headers: { 'x-robots-tag': 'noindex, nofollow' } });
      }
      const target = safeExternalUrl(entity?.outbound_url || entity?.source_url);
      if (!entity || !target) return new Response('ไม่พบลิงก์รายการ', { status: 404, headers: { 'x-robots-tag': 'noindex, nofollow' } });
      try {
        await env.DB.prepare(`
          INSERT INTO discovery_click_events(entity_id, action, referrer_path)
          VALUES (?1, 'open', ?2)
        `).bind(entity.id, safeReferrerPath(request)).run();
      } catch {}
      return Response.redirect(target, 302);
    }

    if (request.method === 'GET' && (
      url.pathname === '/' ||
      url.pathname.startsWith('/tools/') ||
      url.pathname.startsWith('/guides/') ||
      url.pathname.startsWith('/about') ||
      url.pathname.startsWith('/privacy') ||
      url.pathname.startsWith('/affiliate-disclosure') ||
      url.pathname.startsWith('/contact')
    )) {
      return serveHtmlWithSeo(request, env);
    }

    return env.ASSETS.fetch(request);
  }
};
