import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {DEFAULT_SITE} from '../data/site-schema.js';
import {cleanSection} from '../lib/site-cms.js';
import {categorySEO} from '../lib/seo.js';
import {createSession} from '../lib/admin-auth.js';
import {onRequestGet as categoryRoute} from '../functions/danh-muc/[slug].js';
import {onRequestPost as saveDraft} from '../functions/api/admin/site/draft.js';
import {onRequestPost as publish} from '../functions/api/admin/site/publish.js';

function createDB(){
 const d=new DatabaseSync(':memory:');
 for(const f of ['0001_init.sql','0002_catalog_admin.sql','0003_site_cms.sql','0004_orders_customers_admin.sql','0005_product_seo.sql','0006_categories.sql','0007_verified_metrics_reviews.sql','0008_manual_display_sales.sql','0009_external_rating_summary.sql','0010_product_gallery.sql','0011_product_variants.sql'])d.exec(readFileSync(new URL('../migrations/'+f,import.meta.url),'utf8'));
 const DB={prepare(sql){const statement=d.prepare(sql);let args=[];return {bind(...v){args=v;return this},first(){return Promise.resolve(statement.get(...args)??null)},all(){return Promise.resolve({results:statement.all(...args)})},run(){const out=statement.run(...args);return Promise.resolve({meta:{changes:out.changes}})}}},async batch(statements){const out=[];for(const s of statements)out.push(await s.run());return out}};
 return {d,DB};
}
const url='/danh-muc/hoa-lua/';
const makeCtx=(env,extra='',cookie='')=>({env,params:{slug:'hoa-lua'},request:new Request('https://hoaluathuhien.shop'+url+extra,{headers:cookie?{Cookie:cookie}:{}})});

test('SEO ADMIN: schema accepts optional category fields and rejects unsafe social image',()=>{
 const seo={...DEFAULT_SITE.seo,categoryHoaLuaTitle:'Hoa lụa cho phòng khách',categoryHoaLuaDescription:'Hoa lụa trang trí đẹp',categoryHoaLuaImage:'/media/test-asset.webp'};
 assert.equal(cleanSection('seo',seo).categoryHoaLuaTitle,'Hoa lụa cho phòng khách');
 assert.throws(()=>cleanSection('seo',{...seo,categoryHoaLuaImage:'javascript:alert(1)'}));
 assert.throws(()=>cleanSection('seo',{...seo,categoryHoaLuaImage:'https://example.com/flower.jpg" onerror="bad'}));
 assert.equal(categorySEO({...DEFAULT_SITE,seo},'hoa-lua').title,'Hoa lụa cho phòng khách');
});

test('SEO ADMIN: category draft invisible to public; preview requires ADMIN; publish changes public HTML',async()=>{
 const {d,DB}=createDB();
 const env={DB};
 const auth=await createSession(env,new Request('https://hoaluathuhien.shop/admin/'));
 const cookie=auth.cookie.split(';')[0];
 const authRequest=new Request('https://hoaluathuhien.shop/api/admin/site/draft',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://hoaluathuhien.shop',Cookie:cookie,'X-CSRF-Token':auth.csrf},body:JSON.stringify({section:'seo',values:{...DEFAULT_SITE.seo,categoryHoaLuaTitle:'BẢN NHÁP SEO HOA LỤA',categoryHoaLuaDescription:'Mô tả SEO riêng của bản nháp',categoryHoaLuaImage:''},baseRevision:0})});
 const saved=await saveDraft({env,request:authRequest});
 assert.equal(saved.status,200,await saved.text());
 const live=await categoryRoute(makeCtx(env));
 assert.doesNotMatch(await live.text(),/BẢN NHÁP SEO HOA LỤA/);
 const notAuthorized=await categoryRoute(makeCtx(env,'?cms_preview=1'));
 assert.equal(notAuthorized.status,403);
 const preview=await categoryRoute(makeCtx(env,'?cms_preview=1',cookie));
 assert.equal(preview.status,200);
 assert.equal(preview.headers.get('x-robots-tag'),'noindex,follow');
 const html=await preview.text();
 assert.match(html,/<title>BẢN NHÁP SEO HOA LỤA<\/title>/);
 assert.match(html,/Mô tả SEO riêng của bản nháp/);
 const req=new Request('https://hoaluathuhien.shop/api/admin/site/publish',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://hoaluathuhien.shop',Cookie:cookie,'X-CSRF-Token':auth.csrf},body:JSON.stringify({baseRevision:1})});
 const result=await publish({env,request:req});
 assert.equal(result.status,200,await result.text());
 const updated=await categoryRoute(makeCtx(env));
 assert.match(await updated.text(),/<title>BẢN NHÁP SEO HOA LỤA<\/title>/);
 const stored=d.prepare("SELECT published_json FROM site_cms WHERE id='home'").get();
 assert.match(stored.published_json,/BẢN NHÁP SEO HOA LỤA/);
});

test('SEO ADMIN: HTML and JS build include dedicated menu and all three categories',()=>{
 const page=readFileSync(new URL('../admin/index.html',import.meta.url),'utf8');
 const app=readFileSync(new URL('../admin/admin.js',import.meta.url),'utf8');
 const panel=readFileSync(new URL('../admin/seo-admin.js',import.meta.url),'utf8');
 assert.match(page,/id="nav-seo"/);
 assert.match(page,/id="seo-work"/);
 assert.match(app,/openSeoAdmin\(\)/);
 for(const slug of ['hoa-lua','hoa-cao-su','hoa-decor'])assert.match(panel,new RegExp(slug));
});
