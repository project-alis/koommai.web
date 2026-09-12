const INDEXABLE_PATHS = [
  '/',
  '/tools/profit-online/',
  '/tools/promo-check/',
  '/tools/unit-price/',
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
  return CATEGORY_COPY[row.category] || CATEGORY_COPY.general;
}

function autoBadge(row, index) {
  if (row.badge?.trim()) return row.badge.trim();
  if (index === 0) return 'แนะนำ';
  if (index === 1) return 'ตัวเลือกน่าสนใจ';
  return 'ดูเพิ่ม';
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

    if (url.pathname === '/api/recommendations' && request.method === 'GET') {
      const tool = (url.searchParams.get('tool') || '').slice(0, 60);
      if (!tool) return json({ items: [] });
      try {
        const rows = await env.DB.prepare(`
          SELECT id, slug, name, category, display_price, reason, image_url, badge, highlight, merchant, image_alt
          FROM affiliate_products
          WHERE tool_key = ?1 AND active = 1
          ORDER BY sort_order ASC, id DESC
          LIMIT 3
        `).bind(tool).all();
        const items = (rows.results || []).map((r, index) => ({
          name: r.name,
          category: r.category || 'general',
          display_price: r.display_price,
          reason: autoReason(r),
          badge: autoBadge(r, index),
          merchant: r.merchant || null,
          image_url: safeImageUrl(r.image_url),
          image_alt: r.image_alt || r.name,
          go_url: `/go/${encodeURIComponent(r.slug)}`
        }));
        return json({ items }, { headers: { 'cache-control': 'public, max-age=300, stale-while-revalidate=3600' } });
      } catch {
        // If the shared D1 Free quota is temporarily exhausted, calculators still work.
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
      } catch {
        // Never block affiliate redirect just because D1 write quota is exhausted.
      }

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
