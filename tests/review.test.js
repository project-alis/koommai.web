
import test from 'node:test';
import assert from 'node:assert/strict';
import { pbkdf2Sync, randomBytes } from 'node:crypto';
import { configured, passwordHash, verifyPassword, randomToken } from '../worker/admin-auth.js';
import { database } from './d1.js';

test('new password hashes use 600000 iterations, random salts and match independent PBKDF2',async()=>{
 const password=randomToken(), first=await passwordHash(password), second=await passwordHash(password);
 assert.notEqual(first,second);
 const [algorithm,count,salt,digest]=first.split('$');
 assert.equal(algorithm,'pbkdf2-sha256');assert.equal(count,'600000');
 assert.equal(digest,pbkdf2Sync(password,Buffer.from(salt,'hex'),600000,32,'sha256').toString('hex'));
 assert.equal(await verifyPassword(password,first),true);
 assert.equal(await verifyPassword(password+'wrong',first),false);
});
test('verification honors encoded iterations and rejects weak, malformed or excessive configurations',async()=>{
 const password=randomToken(), salt=randomBytes(16).toString('hex');
 const encoded='pbkdf2-sha256$650000$'+salt+'$'+pbkdf2Sync(password,Buffer.from(salt,'hex'),650000,32,'sha256').toString('hex');
 const env={SESSION_SECRET:randomToken(),ADMIN_PASSWORD_HASH:encoded};
 assert.equal(configured(env),true);assert.equal(await verifyPassword(password,encoded),true);
 assert.equal(await passwordHash(password,salt,650000),encoded);
 for(const candidate of [encoded.replace('$650000$','$100000$'),encoded.replace('$650000$','$599999$'),encoded.replace('$650000$','$2000001$'),encoded.replace('$650000$','$0650000$'),encoded+'x',null,{},'']){
  assert.equal(configured({...env,ADMIN_PASSWORD_HASH:candidate}),false);
  assert.equal(await verifyPassword(password,candidate),false);
 }
 for(const count of [100000,599999,600000.5,Infinity,2000001])await assert.rejects(passwordHash(password,salt,count));
});
test('expanded 0006 fields persist; workflow statuses and nullable attribution are constrained',t=>{
 const db=database();t.after(()=>db.sqlite.close());const sql=db.sqlite;
 const required={
 clips:['slug','title','platform','source_url','caption','description','cover_image_url','status','published_at','created_at','updated_at'],
 clip_products:['clip_id','product_id','sort_order','note'],
 collections:['slug','title','description','cover_image_url','status','sort_order','created_at','updated_at'],
 collection_items:['collection_id','product_id','sort_order','note'],
 content_ideas:['product_id','clip_id','collection_id','title','hook','script','visual_sequence','on_screen_text','caption','hashtags','content_angle','status','created_at','updated_at'],
 page_views:['path','clip_id','collection_id','source','campaign','referrer_path','created_at'],
 click_events:['clip_id','collection_id','source','campaign']
 };
 for(const [table,fields] of Object.entries(required)){
  const columns=sql.prepare('PRAGMA table_info('+table+')').all();
  for(const name of fields)assert.ok(columns.some(c=>c.name===name),table+'.'+name);
 }
 sql.exec("INSERT INTO affiliate_products(slug,name,tool_key,affiliate_url) VALUES('product','Product','tool','https://example.com')");
 sql.exec("INSERT INTO clips(slug,title,caption,cover_image_url,status) VALUES('clip','Clip','Caption','https://example.com/cover','planned')");
 sql.exec("INSERT INTO collections(slug,title,cover_image_url,sort_order) VALUES('collection','Collection','https://example.com/cover',7)");
 sql.exec("INSERT INTO clip_products(clip_id,product_id,note) VALUES(1,1,'Clip note')");
 sql.exec("INSERT INTO collection_items(collection_id,product_id,note) VALUES(1,1,'Collection note')");
 sql.exec("INSERT INTO content_ideas(title) VALUES('Unassigned')");
 const empty=sql.prepare('SELECT * FROM content_ideas').get();
 assert.equal(empty.status,'idea');
 for(const name of ['product_id','clip_id','collection_id'])assert.equal(empty[name],null);
 sql.exec("INSERT INTO content_ideas(title,product_id,clip_id,collection_id,hook,script,visual_sequence,on_screen_text,caption,hashtags,content_angle) VALUES('Assigned',1,1,1,'Hook','Script','Sequence','Text','Caption','#tag','Angle')");
 const idea=sql.prepare('SELECT * FROM content_ideas WHERE id=2').get();
 for(const [field,value] of Object.entries({hook:'Hook',script:'Script',visual_sequence:'Sequence',on_screen_text:'Text',caption:'Caption',hashtags:'#tag',content_angle:'Angle'}))assert.equal(idea[field],value);
 for(const status of ['draft','planned','published','archived'])sql.prepare('UPDATE clips SET status=?').run(status);
 for(const status of ['idea','selected','producing','published','archived'])sql.prepare('UPDATE content_ideas SET status=?').run(status);
 assert.throws(()=>sql.exec("UPDATE clips SET status='invalid'"),/CHECK/);
 assert.throws(()=>sql.exec("UPDATE content_ideas SET status='draft'"),/CHECK/);
 assert.throws(()=>sql.exec("UPDATE content_ideas SET collection_id=999"),/FOREIGN KEY/);
 sql.exec("INSERT INTO page_views(path,referrer_path) VALUES('/','/tools/')");
 assert.equal(sql.prepare('SELECT referrer_path FROM page_views').get().referrer_path,'/tools/');
 assert.equal(sql.prepare('SELECT clip_id FROM page_views').get().clip_id,null);
 assert.equal(sql.prepare('SELECT note FROM clip_products').get().note,'Clip note');
 assert.equal(sql.prepare('SELECT note FROM collection_items').get().note,'Collection note');
 assert.equal(sql.prepare('SELECT sort_order FROM collections').get().sort_order,7);
 assert.deepEqual(sql.prepare('PRAGMA foreign_key_check').all(),[]);
});
