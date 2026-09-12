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

function safeImageUrl(value) {
  if (!value) return null;
  try {
    const u = new URL(value);
    return ['https:', 'http:'].includes(u.protocol) ? u.toString() : null;
  } catch { return null; }
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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/robots.txt') {
      return new Response(`User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /go/\nSitemap: ${url.origin}/sitemap.xml\n`, {
        headers: { 'content-type': 'text/plain; charset=utf-8' }
      });
    }

    if (url.pathname === '/sitemap.xml') {
      return new Response(sitemap(url.origin), {
        headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' }
      });
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
