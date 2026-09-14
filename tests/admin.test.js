import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import worker from '../worker/index.js';
import { passwordHash, randomToken, SESSION_COOKIE, LOGIN_COOKIE, verify, sign, hash } from '../worker/admin-auth.js';
import { database } from './d1.js';
const password = randomToken();
const encoded = await passwordHash(password);
function fixture(t, extra={}) {
  const DB=database(); t.after(()=>DB.sqlite.close());
  const env={DB,ADMIN_PASSWORD_HASH:encoded,SESSION_SECRET:randomToken(),ADMIN_LOGIN_LIMITER:{limit:async()=>({success:true})},
    ASSETS:{fetch:async request=>{
      const path=new URL(request.url).pathname;
      try { return new Response(readFileSync('public'+(path.endsWith('/')?path+'index.html':path),'utf8'),{headers:{'content-type':path.endsWith('/')?'text/html':'text/plain'}}); }
      catch { return new Response('Not found',{status:404}); }
    }},...extra};
  const call=(path,body,cookie='',headers={})=>worker.fetch(new Request('https://meepiap.com'+path,{
    method:body===undefined?'GET':'POST',headers:{cookie,'cf-connecting-ip':'203.0.113.10',
      ...(body===undefined?{}:{origin:'https://meepiap.com','content-type':'application/x-www-form-urlencoded'}),...headers},
    ...(body===undefined?{}:{body:new URLSearchParams(body).toString()})
  }),env);
  return {DB,env,call};
}
const cookiePair=(response,name)=>response.headers.getSetCookie().find(value=>value.startsWith(name+'='))?.split(';')[0];
const token=html=>html.match(/name="csrf" value="([^"]+)"/)?.[1];
const revision=html=>html.match(/name="revision" value="([^"]+)"/)?.[1];
async function login(f) {
  const page=await f.call('/admin/login/'); assert.equal(page.status,200);
  const csrf=token(await page.text()); const cookie=cookiePair(page,LOGIN_COOKIE);
  const result=await f.call('/admin/login/',{password,csrf},cookie); assert.equal(result.status,303);
  const session=cookiePair(result,SESSION_COOKIE);
  const home=await f.call('/admin/',undefined,session); assert.equal(home.status,200);
  return {cookie:session,csrf:token(await home.text()),response:result};
}
const product=(extra={})=>({name:'สายชาร์จ USB-C',slug:'usb-c-test',tool_key:'profit-online',category:'cable',merchant:'ร้านมีเพียบ',source_platform:'test',
  source_url:'https://example.com/product',affiliate_url:'https://example.com/affiliate',image_url:'https://example.com/image.jpg',
  current_price:'39',previous_price:'50',badge:'แนะนำ',highlight:'สายยาว 1 เมตร',reason:'รายละเอียดจากร้าน',
  popularity_score:'10',sort_order:'100',active:'1',...extra});
async function create(f,auth,extra={}) {
  const response=await f.call('/admin/products/',{...product(extra),csrf:auth.csrf},auth.cookie);
  assert.equal(response.status,303);
  return Number(response.headers.get('location').match(/products\/(\d+)/)[1]);
}
test('admin login page is noindex, uncached, protected by CSP and signed CSRF cookie',async t=>{
  const f=fixture(t); const response=await f.call('/admin/login/'); const html=await response.text();
  assert.equal(response.status,200); assert.match(html,/noindex,nofollow/); assert.match(html,/MEEPIAP/);
  assert.equal(response.headers.get('x-robots-tag'),'noindex, nofollow');
  assert.equal(response.headers.get('cache-control'),'no-store'); assert.match(response.headers.get('content-security-policy'),/frame-ancestors 'none'/);
  assert.match(response.headers.get('set-cookie'),/HttpOnly; Secure; SameSite=Strict/);
  assert.ok(token(html));
});
test('unauthorized admin access redirects without exposing products',async t=>{
  const f=fixture(t);
  for(const path of ['/admin/','/admin/products/','/admin/products/new/','/admin/products/1/']){
    const response=await f.call(path); assert.equal(response.status,303); assert.equal(response.headers.get('location'),'/admin/login/');
  }
  assert.equal((await f.call('/admin/products/',product())).status,303);
  assert.equal(f.DB.sqlite.prepare('SELECT COUNT(*) n FROM affiliate_products').get().n,0);
});
test('valid login creates a signed HttpOnly Secure Strict expiring session',async t=>{
  const f=fixture(t);const auth=await login(f);
  const value=auth.response.headers.getSetCookie().find(v=>v.startsWith(SESSION_COOKIE+'='));
  assert.match(value,/HttpOnly; Secure; SameSite=Strict; Max-Age=28800/);
  const payload=await verify(auth.cookie.slice(SESSION_COOKIE.length+1),'session',f.env);
  assert.ok(payload); assert.equal(payload.exp-payload.iat,28800);
  assert.ok(f.DB.sqlite.prepare('SELECT id_hash FROM admin_sessions').get().id_hash!==payload.sid);
});
test('wrong password, bad CSRF and cross-origin login are rejected',async t=>{
  const f=fixture(t);const page=await f.call('/admin/login/');const csrf=token(await page.text());const cookie=cookiePair(page,LOGIN_COOKIE);
  assert.equal((await f.call('/admin/login/',{csrf,password:'incorrect'},cookie)).status,401);
  assert.equal((await f.call('/admin/login/',{csrf:'wrong',password},cookie)).status,403);
  assert.equal((await f.call('/admin/login/',{csrf,password},cookie,{origin:'https://attacker.example'})).status,403);
  assert.equal(f.DB.sqlite.prepare('SELECT COUNT(*) n FROM admin_sessions').get().n,0);
});
test('logout requires CSRF and revokes captured cookies on the server',async t=>{
  const f=fixture(t);const auth=await login(f);
  assert.equal((await f.call('/admin/logout/',undefined,auth.cookie)).status,405);
  assert.equal((await f.call('/admin/logout/',{},auth.cookie)).status,403);
  const response=await f.call('/admin/logout/',{csrf:auth.csrf},auth.cookie);
  assert.equal(response.status,303);assert.match(response.headers.get('set-cookie'),/Max-Age=0/);
  assert.equal((await f.call('/admin/',undefined,auth.cookie)).status,303);
});
test('tampered, expired and rotated-credential sessions cannot authenticate',async t=>{
  const f=fixture(t);const auth=await login(f);
  assert.equal((await f.call('/admin/',undefined,auth.cookie+'bad')).status,303);
  const payload=await verify(auth.cookie.slice(SESSION_COOKIE.length+1),'session',f.env);
  const expired=await sign({...payload,iat:payload.iat-30000,exp:payload.iat-1},f.env);
  assert.equal((await f.call('/admin/',undefined,SESSION_COOKIE+'='+expired)).status,303);
  f.env.ADMIN_PASSWORD_HASH=await passwordHash(randomToken());
  assert.equal((await f.call('/admin/',undefined,auth.cookie)).status,303);
});
test('missing secrets, missing limiter and excessive login attempts fail closed',async t=>{
  const f=fixture(t);const secret=f.env.SESSION_SECRET;
  delete f.env.SESSION_SECRET;assert.equal((await f.call('/admin/login/')).status,503);
  f.env.SESSION_SECRET=secret;
  delete f.env.ADMIN_LOGIN_LIMITER;assert.equal((await f.call('/admin/login/',{})).status,503);
  f.env.ADMIN_LOGIN_LIMITER={limit:async()=>({success:false})};assert.equal((await f.call('/admin/login/',{})).status,429);
  f.env.ADMIN_LOGIN_LIMITER={limit:async()=>{throw Error('offline');}};assert.equal((await f.call('/admin/login/',{})).status,503);
});
test('product list, search, create and edit use the existing product master',async t=>{
  const f=fixture(t);const auth=await login(f);
  assert.equal((await f.call('/admin/products/new/',undefined,auth.cookie)).status,200);
  const id=await create(f,auth);
  let row=f.DB.sqlite.prepare('SELECT * FROM affiliate_products WHERE id=?').get(id);
  assert.equal(row.current_price,39);assert.equal(row.discount_percent,22);assert.equal(row.tool_key,'profit-online');
  const list=await f.call('/admin/products/?q='+encodeURIComponent('สายชาร์จ'),undefined,auth.cookie);
  assert.match(await list.text(),/usb-c-test/);
  const noMatch=await f.call('/admin/products/?q=not-present',undefined,auth.cookie);
  assert.match(await noMatch.text(),/ยังไม่พบสินค้า/);
  const edit=await f.call('/admin/products/'+id+'/',undefined,auth.cookie);const version=revision(await edit.text());
  const response=await f.call('/admin/products/'+id+'/',{...product({name:'ชื่อใหม่',current_price:'35',sort_order:'5'}),csrf:auth.csrf,revision:version},auth.cookie);
  assert.equal(response.status,303);
  row=f.DB.sqlite.prepare('SELECT * FROM affiliate_products WHERE id=?').get(id);
  assert.equal(row.name,'ชื่อใหม่');assert.equal(row.current_price,35);assert.equal(row.sort_order,5);
});
test('activation toggles are CSRF-protected and preserve legacy endpoint filtering',async t=>{
  const f=fixture(t);const auth=await login(f);const id=await create(f,auth);
  const toggle=async active=>{
    const edit=await f.call('/admin/products/'+id+'/',undefined,auth.cookie);
    return f.call('/admin/products/'+id+'/status/',{active,csrf:auth.csrf,revision:revision(await edit.text())},auth.cookie);
  };
  assert.equal((await f.call('/go/usb-c-test')).status,302);
  assert.equal((await toggle('0')).status,303);
  assert.equal((await f.call('/go/usb-c-test')).status,404);
  assert.equal((await (await f.call('/api/home-feed')).json()).items.length,0);
  assert.equal((await toggle('1')).status,303);
  assert.equal((await f.call('/go/usb-c-test')).status,302);
  const click=f.DB.sqlite.prepare('SELECT * FROM click_events LIMIT 1').get();
  for(const column of ['clip_id','collection_id','source','campaign'])assert.equal(click[column],null);
});
test('write validation rejects duplicates, unsafe URLs, invalid prices and missing CSRF',async t=>{
  const f=fixture(t);const auth=await login(f);await create(f,auth);
  assert.equal((await f.call('/admin/products/',{...product(),csrf:auth.csrf},auth.cookie)).status,409);
  for(const extra of [{slug:'Bad Slug'},{affiliate_url:'javascript:alert(1)'},{affiliate_url:'http://example.com'},{image_url:'data:text/html,x'},{current_price:'-1'},{current_price:'NaN'},{sort_order:'1.5'},{name:''}]){
    assert.equal((await f.call('/admin/products/',{...product({slug:'new-product',...extra}),csrf:auth.csrf},auth.cookie)).status,400);
  }
  assert.equal((await f.call('/admin/products/',product({slug:'missing-csrf'}),auth.cookie)).status,403);
  assert.equal((await f.call('/admin/products/',{...product({slug:'cross-origin'}),csrf:auth.csrf},auth.cookie,{origin:'https://evil.example'})).status,403);
  assert.equal(f.DB.sqlite.prepare('SELECT COUNT(*) n FROM affiliate_products').get().n,1);
});
test('stored XSS is escaped in list and edit pages; stale forms cannot overwrite',async t=>{
  const f=fixture(t);const auth=await login(f);
  const id=await create(f,auth,{name:'<script>alert(1)</script>'});
  const list=await(await f.call('/admin/products/',undefined,auth.cookie)).text();
  assert.ok(list.includes('&lt;script&gt;'));assert.ok(!list.includes('<script>'));
  const form=await(await f.call('/admin/products/'+id+'/',undefined,auth.cookie)).text();
  const data={...product({name:'latest'}),csrf:auth.csrf,revision:revision(form)};
  assert.equal((await f.call('/admin/products/'+id+'/',data,auth.cookie)).status,303);
  assert.equal((await f.call('/admin/products/'+id+'/',{...data,name:'stale'},auth.cookie)).status,409);
  assert.equal(f.DB.sqlite.prepare('SELECT name FROM affiliate_products WHERE id=?').get(id).name,'latest');
});
test('existing public pages and all affiliate APIs remain available',async t=>{
  const f=fixture(t);const auth=await login(f);await create(f,auth);
  // Small HTMLRewriter test double: assets and handler routing are real; Cloudflare HTML rewriting is not emulated.
  const original=globalThis.HTMLRewriter;
  globalThis.HTMLRewriter=class{on(){return this;}transform(response){return response;}};
  try { for(const path of ['/','/tools/','/guides/'])assert.equal((await f.call(path)).status,200); }
  finally { globalThis.HTMLRewriter=original; }
  for(const path of ['/api/home-feed','/api/product-search?q=USB','/api/recommendations?tool=profit-online']){
    const response=await f.call(path);assert.equal(response.status,200);assert.equal((await response.json()).items.length,1);
  }
  const go=await f.call('/go/usb-c-test');assert.equal(go.status,302);assert.equal(go.headers.get('location'),'https://example.com/affiliate');
  assert.equal((await(await f.call('/api/health')).json()).discovery.search_mode,'fts5');
  assert.match(await(await f.call('/robots.txt')).text(),/Disallow: \/admin\//);
  assert.doesNotMatch(await(await f.call('/sitemap.xml')).text(),/\/admin\//);
});
test('additive migration upgrades populated legacy tables and retains old inserts',t=>{
  const db=database(5);t.after(()=>db.sqlite.close());
  db.sqlite.exec("INSERT INTO affiliate_products(slug,name,tool_key,affiliate_url) VALUES('existing','สินค้าเดิม','tool','https://example.com')");
  db.sqlite.exec("INSERT INTO click_events(product_id,tool_key) VALUES(1,'tool')");
  db.sqlite.exec("INSERT INTO discovery_entities(slug,entity_type,name,search_terms) VALUES('shop','shop','ร้านเดิม','กาแฟ')");
  db.sqlite.exec(readFileSync('migrations/0006_affiliate_publisher_v2.sql','utf8'));
  assert.equal(db.sqlite.prepare('SELECT name FROM affiliate_products').get().name,'สินค้าเดิม');
  assert.equal(db.sqlite.prepare('SELECT COUNT(*) n FROM click_events').get().n,1);
  for(const table of ['clips','clip_products','collections','collection_items','content_ideas','page_views','admin_sessions'])assert.ok(db.sqlite.prepare("SELECT name FROM sqlite_master WHERE name=?").get(table));
  const columns=db.sqlite.prepare('PRAGMA table_info(click_events)').all();
  for(const name of ['clip_id','collection_id','source','campaign'])assert.equal(columns.find(c=>c.name===name).notnull,0);
  db.sqlite.exec("INSERT INTO click_events(product_id,tool_key) VALUES(1,'tool')");
  assert.equal(db.sqlite.prepare('SELECT COUNT(*) n FROM click_events').get().n,2);
  assert.equal(db.sqlite.prepare("SELECT name FROM discovery_entities_fts WHERE discovery_entities_fts MATCH 'กาแฟ'").get().name,'ร้านเดิม');
  assert.deepEqual(db.sqlite.prepare('PRAGMA foreign_key_check').all(),[]);
});

test('status changes preserve nullable and legacy fields without revalidating unrelated content',async t=>{
  const f=fixture(t); const auth=await login(f);
  f.DB.sqlite.exec("INSERT INTO affiliate_products(slug,name,tool_key,affiliate_url,active) VALUES('Legacy_SLUG','ข้อมูลเดิม','old-tool','http://example.com',1)");
  const before=f.DB.sqlite.prepare('SELECT * FROM affiliate_products').get();
  const form=await(await f.call('/admin/products/'+before.id+'/',undefined,auth.cookie)).text();
  const response=await f.call('/admin/products/'+before.id+'/status/',{active:'0',csrf:auth.csrf,revision:revision(form)},auth.cookie);
  assert.equal(response.status,303);
  const after=f.DB.sqlite.prepare('SELECT * FROM affiliate_products').get();
  for(const field of Object.keys(before).filter(key=>!['active','updated_at'].includes(key)))assert.equal(after[field],before[field],field);
  const latest=await(await f.call('/admin/products/'+before.id+'/',undefined,auth.cookie)).text();
  assert.equal((await f.call('/admin/products/'+before.id+'/status/',{active:'1',csrf:auth.csrf,revision:revision(latest)},auth.cookie)).status,400);
  assert.equal(f.DB.sqlite.prepare('SELECT active FROM affiliate_products').get().active,0);
});

test('inactive drafts, literal search, oversized writes and missing database fail safely',async t=>{
  const f=fixture(t); const auth=await login(f);
  await create(f,auth,{active:'0',affiliate_url:''});
  assert.equal((await f.call('/go/usb-c-test')).status,404);
  const html=await(await f.call('/admin/products/?q='+encodeURIComponent("%' OR 1=1 --"),undefined,auth.cookie)).text();
  assert.match(html,/ยังไม่พบสินค้า/);
  assert.equal((await f.call('/admin/products/',{csrf:auth.csrf,name:'x'.repeat(33000)},auth.cookie)).status,413);
  assert.equal((await f.call('/admin/products/',{csrf:auth.csrf},auth.cookie,{'content-type':'application/json'})).status,415);
  f.env.DB={prepare(){throw Error('offline');}};
  const response=await f.call('/admin/products/',undefined,auth.cookie);
  assert.equal(response.status,503); assert.doesNotMatch(await response.text(),/offline/);
});
