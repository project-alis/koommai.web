import { configured, currentSession, loginChallenge, verifyPassword, createSession, revokeSession, limitLogin, checkCsrf, verify, cookie, setCookie, same, LOGIN_COOKIE, SESSION_COOKIE } from './admin-auth.js';
import { TEXT_FIELDS, validateProduct, saveProduct, revision, ProductError } from './admin-products.js';
const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const csrf = token => '<input type="hidden" name="csrf" value="' + esc(token) + '">';
function response(body, status = 200, extras = {}) {
  return new Response(body, { status, headers: {
    'content-type':'text/html; charset=utf-8', 'cache-control':'no-store',
    'x-robots-tag':'noindex, nofollow', 'referrer-policy':'no-referrer', 'x-content-type-options':'nosniff',
    'content-security-policy':"default-src 'none'; style-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
    ...extras
  } });
}
function redirect(path) { return response(null, 303, { location:path }); }
function page(title, content, session = null, status = 200) {
  return response(`<!doctype html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${esc(title)} | MEEPIAP มีเพียบ</title><link rel="stylesheet" href="/assets/admin.css"></head><body>
    <header><a class="brand" href="/admin/">MEEPIAP <span>มีเพียบ</span></a><nav aria-label="เมนูหลังบ้าน"><a href="/">ดูเว็บไซต์</a>${session ? '<a href="/admin/products/">สินค้า</a><form method="post" action="/admin/logout/">' + csrf(session.csrf) + '<button class="secondary">ออกจากระบบ</button></form>' : ''}</nav></header>
    <main><p class="eyebrow">AFFILIATE PUBLISHER · PHASE 1</p><h1>${esc(title)}</h1>${content}</main></body></html>`, status);
}
function errorPage(message, status = 400, session = null) {
  return page('ดำเนินการไม่สำเร็จ', '<p role="alert">' + esc(message) + '</p><a href="/admin/products/">กลับไปหน้าสินค้า</a>', session, status);
}
async function formData(request) {
  if (!request.headers.get('content-type')?.startsWith('application/x-www-form-urlencoded')) throw Object.assign(new Error('รูปแบบข้อมูลไม่ถูกต้อง'), { status:415 });
  const reader = request.body?.getReader();
  if (!reader) throw Object.assign(new Error('ไม่พบข้อมูล'), { status:400 });
  const chunks = []; let length = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.length;
    if (length > 32768) { await reader.cancel(); throw Object.assign(new Error('ข้อมูลยาวเกินไป'), { status:413 }); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(length); let position = 0;
  for (const value of chunks) { bytes.set(value, position); position += value.length; }
  const form = new URLSearchParams(new TextDecoder().decode(bytes));
  if (new Set(form.keys()).size !== [...form.keys()].length) throw Object.assign(new Error('ข้อมูลซ้ำ'), { status:400 });
  return form;
}
async function loginPage(env, message = '', status = 200) {
  const challenge = await loginChallenge(env);
  const res = page('เข้าสู่ระบบหลังบ้าน', `<section class="login card">${message ? '<p role="alert">' + esc(message) + '</p>' : ''}<form method="post" action="/admin/login/">
    ${csrf(challenge.csrf)}<label for="password">รหัสผ่านผู้ดูแล</label><input type="password" id="password" name="password" autocomplete="current-password" maxlength="1024" required>
    <button type="submit">เข้าสู่ระบบ</button></form></section>`, null, status);
  res.headers.append('set-cookie', challenge.cookie);
  return res;
}
const labels = {
  name:'ชื่อสินค้า', slug:'Slug', category:'หมวดหมู่', tool_key:'เครื่องมือที่แนะนำสินค้า (tool_key)',
  merchant:'ร้านค้า', source_platform:'แพลตฟอร์มต้นทาง', source_url:'URL ต้นทาง', affiliate_url:'Affiliate URL',
  image_url:'URL รูปสินค้า', image_alt:'คำอธิบายรูป', display_price:'ข้อความราคา (ถ้ามี)',
  badge:'ป้ายสินค้า', highlight:'จุดเด่น', reason:'เหตุผลที่แนะนำ', shop_logo_url:'URL โลโก้ร้าน',
  current_price:'ราคาปัจจุบัน (บาท)', previous_price:'ราคาอ้างอิงเดิม (บาท)', popularity_score:'คะแนนความนิยม', sort_order:'ลำดับแสดงผล'
};
async function productForm(row, session, message = '', status = 200, version = null) {
  const edit = Boolean(row.id);
  const textInputs = Object.entries(TEXT_FIELDS).map(([field, max]) => {
    const large = ['highlight','reason'].includes(field);
    const required = ['name','slug','tool_key'].includes(field) ? ' required' : '';
    return '<div><label for="' + field + '">' + labels[field] + '</label>' +
      (large ? '<textarea rows="3"' : '<input type="' + (field.endsWith('_url') ? 'url' : 'text') + '"') +
      ' id="' + field + '" name="' + field + '" maxlength="' + max + '"' + required +
      (large ? '>' + esc(row[field]) + '</textarea>' : ' value="' + esc(row[field]) + '">') + '</div>';
  }).join('');
  const numericInputs = ['current_price','previous_price','popularity_score','sort_order'].map(field =>
    '<div><label for="' + field + '">' + labels[field] + '</label><input type="number" id="' + field + '" name="' + field + '" step="' + (field.includes('price') ? '.01' : '1') + '" value="' + esc(row[field] ?? '') + '"' + (field === 'sort_order' ? '' : ' min="0"') + '></div>').join('');
  return page(edit ? 'แก้ไขสินค้า' : 'เพิ่มสินค้า', `<p><a href="/admin/products/">← รายการสินค้า</a></p>${message ? '<p class="notice" role="alert">' + esc(message) + '</p>' : ''}
    <form class="card" method="post" action="${edit ? '/admin/products/' + row.id + '/' : '/admin/products/'}">${csrf(session.csrf)}
    ${edit ? '<input type="hidden" name="revision" value="' + esc(version ?? await revision(row)) + '">' : ''}
    <div class="fields">${textInputs}${numericInputs}<div><label for="active">สถานะ</label><select id="active" name="active"><option value="0"${Number(row.active) !== 1 ? ' selected' : ''}>ปิดใช้งาน</option><option value="1"${Number(row.active) === 1 ? ' selected' : ''}>เปิดใช้งาน</option></select></div></div>
    <p class="muted">ส่วนลดคำนวณจากราคาปัจจุบันและราคาอ้างอิงอัตโนมัติ สินค้าที่เปิดใช้งานต้องมี Affiliate URL แบบ HTTPS</p>
    <button type="submit">บันทึกสินค้า</button></form>`, session, status);
}
async function productsPage(url, env, session) {
  const q = (url.searchParams.get('q') || '').trim().slice(0,120);
  const rawPage = Number(url.searchParams.get('page') || 1);
  const currentPage = Number.isSafeInteger(rawPage) && rawPage > 0 ? Math.min(rawPage, 1000000) : 1;
  const search = '%' + q.replace(/[\\%_]/g, '\\$&') + '%';
  const where = " WHERE name LIKE ?1 ESCAPE '\\' OR slug LIKE ?1 ESCAPE '\\' OR category LIKE ?1 ESCAPE '\\' OR merchant LIKE ?1 ESCAPE '\\'";
  const total = await env.DB.prepare('SELECT COUNT(*) AS count FROM affiliate_products' + where).bind(search).first();
  const rows = await env.DB.prepare('SELECT * FROM affiliate_products' + where + ' ORDER BY sort_order ASC,id DESC LIMIT 50 OFFSET ?2').bind(search, (currentPage-1)*50).all();
  const items = await Promise.all(rows.results.map(async row => `<tr><td><a href="/admin/products/${row.id}/">${esc(row.name)}</a><small>${esc(row.slug)}</small></td><td>${esc(row.merchant || '—')}</td><td>${esc(row.category || '—')}</td><td>${row.current_price === null ? esc(row.display_price || '—') : esc(row.current_price)}</td><td>${row.active ? 'เปิด' : 'ปิด'}</td><td><form method="post" action="/admin/products/${row.id}/status/">
    ${csrf(session.csrf)}<input type="hidden" name="revision" value="${await revision(row)}"><input type="hidden" name="active" value="${row.active ? '0' : '1'}"><button class="secondary">${row.active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}</button></form></td></tr>`));
  const link = page => '/admin/products/?' + new URLSearchParams({ q, page });
  return page('จัดการสินค้า Affiliate', `<div class="toolbar"><form method="get" action="/admin/products/"><label class="sr-only" for="q">ค้นหาสินค้า</label><input id="q" name="q" maxlength="120" value="${esc(q)}" placeholder="ชื่อสินค้า, slug, หมวด หรือร้าน"><button>ค้นหา</button></form><a class="button" href="/admin/products/new/">เพิ่มสินค้า</a></div><p>พบ ${total.count} รายการ · หน้า ${currentPage}</p>
    <div class="table-wrap"><table><thead><tr><th>สินค้า</th><th>ร้าน</th><th>หมวด</th><th>ราคา</th><th>สถานะ</th><th>จัดการ</th></tr></thead><tbody>${items.join('') || '<tr><td colspan="6">ยังไม่พบสินค้า</td></tr>'}</tbody></table></div>
    <nav aria-label="แบ่งหน้า">${currentPage > 1 ? '<a href="' + esc(link(currentPage-1)) + '">← ก่อนหน้า</a>' : ''}${currentPage*50 < total.count ? '<a href="' + esc(link(currentPage+1)) + '">ถัดไป →</a>' : ''}</nav>`, session);
}
export async function handleAdmin(request, env) {
  try {
    const url = new URL(request.url);
    if (url.protocol !== 'https:') return errorPage('หลังบ้านต้องใช้งานผ่าน HTTPS', 426);
    if (!configured(env) || !env.DB) return errorPage('หลังบ้านยังไม่พร้อมใช้งาน กรุณาตั้งค่า ADMIN_PASSWORD_HASH และ SESSION_SECRET', 503);
    if (url.pathname === '/admin' && request.method === 'GET') return redirect('/admin/');
    const path = url.pathname;
    if (path === '/admin/login/') {
      if (request.method === 'GET') return await currentSession(request, env) ? redirect('/admin/') : await loginPage(env);
      if (request.method !== 'POST') return response(null, 405, { allow:'GET, POST' });
      const limited = await limitLogin(request, env);
      if (limited !== 200) return errorPage(limited === 429 ? 'ลองเข้าสู่ระบบบ่อยเกินไป กรุณารอหนึ่งนาที' : 'ระบบป้องกันการเข้าสู่ระบบยังไม่พร้อม', limited);
      const form = await formData(request);
      const challenge = await verify(cookie(request, LOGIN_COOKIE), 'login', env);
      if (!challenge || !checkCsrf(request, form, challenge)) return errorPage('คำขอไม่ถูกต้อง กรุณาเปิดหน้าเข้าสู่ระบบใหม่', 403);
      if (!await verifyPassword(form.get('password'), env.ADMIN_PASSWORD_HASH)) return await loginPage(env, 'รหัสผ่านไม่ถูกต้อง', 401);
      const old = await currentSession(request, env);
      if (old) await revokeSession(old, env);
      const res = redirect('/admin/');
      res.headers.append('set-cookie', await createSession(env));
      res.headers.append('set-cookie', setCookie(LOGIN_COOKIE, '', 0));
      return res;
    }
    const session = await currentSession(request, env);
    if (!session) {
      const res = redirect('/admin/login/');
      res.headers.append('set-cookie', setCookie(SESSION_COOKIE, '', 0));
      return res;
    }
    if (request.method === 'GET') {
      if (path === '/admin/') return page('หลังบ้าน MEEPIAP', '<section class="card"><h2>จัดการ Affiliate Products</h2><p>เพิ่มและแก้ไขสินค้าที่ใช้ในเว็บไซต์เดิม</p><a class="button" href="/admin/products/">เปิดรายการสินค้า →</a></section>', session);
      if (path === '/admin/products/') return await productsPage(url, env, session);
      if (path === '/admin/products/new/') return await productForm({ tool_key:'profit-online', popularity_score:0, sort_order:100, active:0 }, session);
      const match = path.match(/^\/admin\/products\/(\d+)\/$/);
      if (match) {
        const row = await env.DB.prepare('SELECT * FROM affiliate_products WHERE id=?').bind(Number(match[1])).first();
        return row ? await productForm(row, session, url.searchParams.has('saved') ? 'บันทึกเรียบร้อย' : '') : errorPage('ไม่พบสินค้า', 404, session);
      }
      if (path === '/admin/logout/') return response(null, 405, { allow:'POST' });
      return errorPage('ไม่พบหน้านี้', 404, session);
    }
    if (request.method !== 'POST') return response(null, 405, { allow:'GET, POST' });
    const form = await formData(request);
    if (!checkCsrf(request, form, session)) return errorPage('คำขอไม่ถูกต้อง กรุณาเปิดหน้าใหม่แล้วลองอีกครั้ง', 403, session);
    if (path === '/admin/logout/') {
      await revokeSession(session, env);
      const res = redirect('/admin/login/');
      res.headers.append('set-cookie', setCookie(SESSION_COOKIE, '', 0));
      return res;
    }
    const match = path.match(/^\/admin\/products\/(\d+)\/(status\/)?$/);
    if (path !== '/admin/products/' && !match) return errorPage('ไม่พบหน้านี้', 404, session);
    const previous = match ? await env.DB.prepare('SELECT * FROM affiliate_products WHERE id=?').bind(Number(match[1])).first() : null;
    if (match && !previous) return errorPage('ไม่พบสินค้า', 404, session);
    if (previous && !same(form.get('revision'), await revision(previous))) return errorPage('สินค้าถูกแก้ไขแล้ว กรุณาเปิดข้อมูลล่าสุดก่อนบันทึก', 409, session);
    let data;
    try {
      if (match?.[2]) {
        const active = form.get('active');
        if (!['0','1'].includes(active)) throw new ProductError('สถานะไม่ถูกต้อง');
        if (active === '1') {
          try {
            const target = new URL(previous.affiliate_url);
            if (target.protocol !== 'https:' || target.username || target.password) throw new Error();
          } catch { throw new ProductError('สินค้าที่เปิดใช้งานต้องมี Affiliate URL แบบ HTTPS'); }
        }
        data = { ...previous, active:Number(active) };
      } else data = validateProduct(form);
    } catch (error) {
      if (!(error instanceof ProductError)) throw error;
      return await productForm({ ...Object.fromEntries(form), id:previous?.id }, session, error.message, 400, form.get('revision'));
    }
    if (await env.DB.prepare('SELECT id FROM affiliate_products WHERE slug=? AND id<>?').bind(data.slug, previous?.id || 0).first()) return await productForm({ ...data, id:previous?.id }, session, 'Slug นี้มีอยู่แล้ว', 409, form.get('revision'));
    let result;
    try { result = await saveProduct(env.DB, data, previous); }
    catch (error) {
      if (String(error.message).includes('UNIQUE')) return errorPage('Slug นี้มีอยู่แล้ว', 409, session);
      throw error;
    }
    if (!result.meta.changes) return errorPage('ข้อมูลเปลี่ยนระหว่างบันทึก กรุณาเปิดใหม่', 409, session);
    return redirect('/admin/products/' + (previous?.id || result.meta.last_row_id) + '/?saved=1');
  } catch (error) {
    return errorPage(error.status ? error.message : 'ระบบหลังบ้านขัดข้องชั่วคราว กรุณาตรวจ migration และการตั้งค่า', error.status || 503);
  }
}
