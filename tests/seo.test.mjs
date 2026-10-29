import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {onRequestGet as productRoute} from '../functions/san-pham/[slug].js';
import {onRequestGet as categoryRoute} from '../functions/danh-muc/[slug].js';
import {onRequestGet as siteIndex} from '../functions/index.js';
import {onRequestGet as sitemapRoute} from '../functions/sitemap.xml.js';
import {normalizeProduct,productColumns} from '../lib/catalog.js';

const db=new DatabaseSync(':memory:');
for(const f of ['0001_init.sql','0002_catalog_admin.sql','0003_site_cms.sql','0004_orders_customers_admin.sql','0005_product_seo.sql','0006_categories.sql','0007_verified_metrics_reviews.sql','0008_manual_display_sales.sql'])db.exec(readFileSync(new URL('../migrations/'+f,import.meta.url),'utf8'));
db.exec("UPDATE products SET is_sample=0 WHERE id='TH001'; UPDATE products SET is_active=0 WHERE id='TH002'; UPDATE products SET is_deleted=1 WHERE id='TH003';");
const DB={prepare(sql){const statement=db.prepare(sql);let args=[];return {bind(...values){args=values;return this},first(){return Promise.resolve(statement.get(...args)??null)},all(){return Promise.resolve({results:statement.all(...args)})},run(){return Promise.resolve(statement.run(...args))}}}};
const env={DB,ASSETS:{fetch:async()=>new Response(readFileSync(new URL('../index.html',import.meta.url),'utf8'),{headers:{'content-type':'text/html'}})}};
const ctx=(route,slug)=>({env,params:{slug},request:new Request('https://hoaluathuhien.shop'+route)});

test('SEO: migration preserves products + SEO fields, D1 catalog keeps existing features',()=>{
 assert.equal(db.prepare('SELECT count(*) AS n FROM products').get().n,9);
 assert.match(productColumns,/seo_title/);
 const p=normalizeProduct({id:'NEW01',name:'Hoa thêu tinh tế',slug:'hoa-theu',category:'hoa-lua',price:125000,image:'https://example.com/flower.jpg',seoTitle:'Hoa thêu cao cấp',seoDescription:'Hoa đẹp'},null);
 assert.equal(p.seoTitle,'Hoa thêu cao cấp');
});
test('SEO: product HTML has canonical, index, true price and JSON-LD; no JavaScript needed',async()=>{
 const res=await productRoute(ctx('/san-pham/bo-hoa-hong-lua-hong-phan/','bo-hoa-hong-lua-hong-phan'));
 assert.equal(res.status,200);
 const html=await res.text();
 assert.match(html,/<h1>Bó hoa hồng lụa hồng phấn<\/h1>/);
 assert.match(html,/<link rel="canonical" href="https:\/\/hoaluathuhien.shop\/san-pham\/bo-hoa-hong-lua-hong-phan\/">/);
 assert.match(html,/"@type":"Product"/);
 assert.match(html,/"price":189000/);
 assert.match(html,/"priceCurrency":"VND"/);
 assert.match(html,/thêm vào giỏ hàng/i);
});
test('SEO: nonexistent or hidden product is 404, sample is noindex, duplicate host is noindex',async()=>{
 const gone=await productRoute(ctx('/san-pham/binh-hoa-cam-tu-cau-pastel/','binh-hoa-cam-tu-cau-pastel'));
 assert.equal(gone.status,404);
 const hidden=await productRoute(ctx('/san-pham/canh-moc-lan-cao-su-trang-kem/','canh-moc-lan-cao-su-trang-kem'));
 assert.equal(hidden.status,404);
 const sample=await productRoute(ctx('/san-pham/bo-hoa-tulip-lua-kem/','bo-hoa-tulip-lua-kem'));
 assert.match(await sample.text(),/noindex, follow/);
 const duplicate=await productRoute({env,params:{slug:'bo-hoa-hong-lua-hong-phan'},request:new Request('https://hoa-lua-thu-hien.pages.dev/san-pham/bo-hoa-hong-lua-hong-phan/')});
 assert.equal(duplicate.headers.get('x-robots-tag'),'noindex,follow');
});
test('SEO: sitemap lists only active non sample products and published routes',async()=>{
 const res=await sitemapRoute({env});
 assert.equal(res.status,200);
 assert.match(res.headers.get('Content-Type'),/application\/xml/);
 const xml=await res.text();
 assert.match(xml,/https:\/\/hoaluathuhien.shop\/san-pham\/bo-hoa-hong-lua-hong-phan\//);
 assert.doesNotMatch(xml,/binh-hoa-cam-tu-cau-pastel/);
 assert.doesNotMatch(xml,/bo-hoa-tulip-lua-kem/);
 assert.match(xml,/https:\/\/hoaluathuhien.shop\/danh-muc\/hoa-lua\//);
 assert.doesNotMatch(xml,/\/admin\//);
});
test('SEO: category HTML has crawlable links, real content',async()=>{
 const res=await categoryRoute(ctx('/danh-muc/hoa-lua/','hoa-lua'));
 assert.equal(res.status,200);
 const html=await res.text();
 assert.match(html,/<h1>Hoa lụa<\/h1>/);
 assert.match(html,/href="\/san-pham\/bo-hoa-hong-lua-hong-phan\/"/);
});
test('SEO: published homepage metadata, markup, canonical; preview uses noindex',async()=>{
 const res=await siteIndex(ctx('/'));
 const html=await res.text();
 assert.equal(res.status,200);
 assert.match(html,/application\/ld\+json/);
 assert.match(html,/rel="canonical" href="https:\/\/hoaluathuhien.shop\//);
 assert.match(html,/name="robots" content="index, follow"/);
 const preview=await siteIndex({env,request:new Request('https://hoaluathuhien.shop/?cms_preview=1')});
 assert.equal(preview.headers.get('X-Robots-Tag'),'noindex, nofollow');
});

test('SEO: ADMIN saves custom SEO fields, and automatic fallback is available',async()=>{
 const {createSession}=await import('../lib/admin-auth.js');
 const {onRequestPost}=await import('../functions/api/admin/products.js');
 const {onRequestPatch}=await import('../functions/api/admin/products/[id].js');
 const {productSEO}=await import('../lib/seo.js');
 const auth=await createSession(env,new Request('https://hoaluathuhien.shop/admin/'));
 const make=(url,method,body)=>new Request(url,{method,headers:{Cookie:auth.cookie.split(';')[0],Origin:'https://hoaluathuhien.shop','Content-Type':'application/json','X-CSRF-Token':auth.csrf},body:JSON.stringify(body)});
 const record={id:'SEO100',name:'Bình hoa mẫu đơn cắm bàn',slug:'binh-mau-don-cam-ban',category:'hoa-lua',price:369000,image:'https://example.com/flower.jpg',active:true,seoTitle:'Bình hoa mẫu đơn trang trí đẹp',seoDescription:'Mẫu bình hoa mẫu đơn trang trí cao cấp dành cho bàn trà.'};
 const added=await onRequestPost({env,request:make('https://hoaluathuhien.shop/api/admin/products','POST',record)});
 assert.equal(added.status,201,await added.text().catch(()=>''));
 const saved=db.prepare("SELECT seo_title,seo_description FROM products WHERE id='SEO100'").get();
 assert.equal(saved.seo_title,record.seoTitle);
 const updated=await onRequestPatch({env,params:{id:'SEO100'},request:make('https://hoaluathuhien.shop/api/admin/products/SEO100','PATCH',{...record,seoTitle:'',seoDescription:''})});
 assert.equal(updated.status,200);
 const fallback=productSEO(db.prepare("SELECT * FROM products WHERE id='SEO100'").get());
 assert.equal(fallback.title,'Bình hoa mẫu đơn cắm bàn | Hoa Lụa Thu Hiền');
});


test('SEO: homepage preview metadata uses draft only for logged-in ADMIN',async()=>{
 const {createSession}=await import('../lib/admin-auth.js');
 const auth=await createSession(env,new Request('https://hoaluathuhien.shop/admin/'));
 const d={seo:{homeTitle:'SEO NHÁP RIÊNG',homeDescription:'Mô tả bản nháp, không công khai.',socialImage:''}};
 db.prepare("UPDATE site_cms SET draft_json=? WHERE id='home'").run(JSON.stringify(d));
 const live=await siteIndex({env,request:new Request('https://hoaluathuhien.shop/')});
 assert.doesNotMatch(await live.text(),/SEO NHÁP RIÊNG/);
 const preview=await siteIndex({env,request:new Request('https://hoaluathuhien.shop/?cms_preview=1',{headers:{Cookie:auth.cookie.split(';')[0]}})});
 assert.match(await preview.text(),/SEO NHÁP RIÊNG/);
 assert.equal(preview.headers.get('X-Robots-Tag'),'noindex, nofollow');
});
