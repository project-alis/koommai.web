export const TEXT_FIELDS = {
  name:200, slug:120, category:100, tool_key:100, merchant:200, source_platform:100,
  source_url:2048, affiliate_url:2048, image_url:2048, image_alt:200, display_price:100,
  badge:100, highlight:500, reason:1000, shop_logo_url:2048
};
export const FIELDS = [...Object.keys(TEXT_FIELDS), 'current_price','previous_price','popularity_score','sort_order','active','discount_percent'];
export class ProductError extends Error {}
export function validateProduct(form) {
  const result = {};
  for (const [field, limit] of Object.entries(TEXT_FIELDS)) {
    const value = form.get(field);
    if (value !== null && typeof value !== 'string') throw new ProductError('ข้อมูลไม่ถูกต้อง: ' + field);
    result[field] = (value || '').trim();
    if (result[field].length > limit) throw new ProductError('ข้อความยาวเกินไป: ' + field);
  }
  if (!result.name || !result.tool_key) throw new ProductError('กรุณาระบุชื่อสินค้าและ tool_key');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(result.slug)) throw new ProductError('Slug ใช้ตัวพิมพ์เล็ก a-z ตัวเลข และขีดกลางเท่านั้น');
  for (const field of ['source_url','affiliate_url','image_url','shop_logo_url']) {
    if (!result[field]) continue;
    try {
      const url = new URL(result[field]);
      if (url.protocol !== 'https:' || url.username || url.password) throw new Error();
      result[field] = url.href;
    } catch { throw new ProductError('URL ต้องเป็น HTTPS ที่ถูกต้อง: ' + field); }
  }
  for (const field of ['current_price','previous_price']) {
    const raw = form.get(field);
    if (raw === null || raw === '') { result[field] = null; continue; }
    if (!/^\d+(?:\.\d{1,2})?$/.test(raw) || Number(raw) > 1000000000) throw new ProductError('ราคาไม่ถูกต้อง: ' + field);
    result[field] = Number(raw);
  }
  for (const [field, fallback, minimum] of [['popularity_score',0,0],['sort_order',100,-1000000000]]) {
    const raw = form.get(field) ?? String(fallback);
    if (!/^-?\d+$/.test(raw) || !Number.isSafeInteger(Number(raw)) || Number(raw) < minimum || Number(raw) > 1000000000) throw new ProductError('จำนวนไม่ถูกต้อง: ' + field);
    result[field] = Number(raw);
  }
  if (!['0','1'].includes(form.get('active'))) throw new ProductError('สถานะไม่ถูกต้อง');
  result.active = Number(form.get('active'));
  if (result.active && !result.affiliate_url) throw new ProductError('สินค้าที่เปิดใช้งานต้องมี Affiliate URL แบบ HTTPS');
  result.discount_percent = result.previous_price > 0 && result.current_price !== null
    ? Math.max(0, Math.round((result.previous_price - result.current_price) / result.previous_price * 10000) / 100) : 0;
  return result;
}
export async function revision(row) {
  const bytes = new TextEncoder().encode(JSON.stringify([...FIELDS.map(field => row[field]), row.updated_at]));
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2,'0')).join('');
}
export async function saveProduct(db, data, previous = null) {
  if (!previous) {
    return db.prepare('INSERT INTO affiliate_products(' + FIELDS.join(',') + ') VALUES(' + FIELDS.map(() => '?').join(',') + ')').bind(...FIELDS.map(field => data[field])).run();
  }
  return db.prepare('UPDATE affiliate_products SET ' + FIELDS.map(field => field + '=?').join(',') +
    ",updated_at=strftime('%Y-%m-%d %H:%M:%f','now') WHERE id=? AND " +
    [...FIELDS, 'updated_at'].map(field => field + ' IS ?').join(' AND '))
    .bind(...FIELDS.map(field => data[field]), previous.id, ...FIELDS.map(field => previous[field]), previous.updated_at).run();
}
