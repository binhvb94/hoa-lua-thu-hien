import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {normalizeProduct} from '../lib/catalog.js';
import {applyTrust,roundRating} from '../lib/product-trust.js';
import {onRequestPost as createProduct,onRequestGet as adminList} from '../functions/api/admin/products.js';
import {onRequestPatch as updateProduct} from '../functions/api/admin/products/[id].js';
import {onRequestGet as publicList} from '../functions/api/products.js';
import {onRequestGet as productPage} from '../functions/san-pham/[slug].js';
import {onRequestGet as categoryPage} from '../functions/danh-muc/[slug].js';
import {createSession} from '../lib/admin-auth.js';
const host='https://hoaluathuhien.shop';
const p={id:'REV001',name:'Hoa hồng lụa handmade',slug:'hoa-hong-lua-handmade',category:'hoa-lua',price:152000,image:'https://example.com/a.jpg',active:true,displaySoldCount:4725,externalRatingCounts:{1:0,2:0,3:0,4:4,5:10},externalRatingSource:'Fanpage Hoa Lụa Thu Hiền'};
function fixture(){
 const sqlite=new DatabaseSync(':memory:');
 for(const f of ['0001_init.sql','0002_catalog_admin.sql','0003_site_cms.sql','0004_orders_customers_admin.sql','0005_product_seo.sql','0006_categories.sql','0007_verified_metrics_reviews.sql','0008_manual_display_sales.sql','0009_external_rating_summary.sql'])sqlite.exec(readFileSync(new URL('../migrations/'+f,import.meta.url),'utf8'));
 const DB={prepare(sql){const stmt=sqlite.prepare(sql);let a=[];return {bind(...args){a=args;return this},first(){return Promise.resolve(stmt.get(...a)||null)},all(){return Promise.resolve({results:stmt.all(...a)})},run(){const r=stmt.run(...a);return Promise.resolve({meta:{changes:r.changes}})}}}};
 return {sqlite,DB};
}
function req(url,auth,method,body){return new Request(host+url,{method,headers:{Cookie:auth.cookie.split(';')[0],Origin:host,'Content-Type':'application/json','X-CSRF-Token':auth.csrf},body:JSON.stringify(body)});}
test('external rating breakdown computes average 4.71 and 14 count, separately from verified reviews',()=>{
 assert.equal(roundRating(10*5+4*4,14),4.71);
 const shown=applyTrust({...p},new Map());
 assert.equal(shown.reviewCount,14);assert.equal(shown.ratingAverage,4.71);assert.equal(shown.ratingKind,'manual_external');assert.equal(shown.verifiedReviewCount,0);
 assert.equal(shown.ratingCounts[4],4);assert.equal(shown.ratingCounts[5],10);
});
test('external aggregate requires a named source and positive integer counts',()=>{
 assert.throws(()=>normalizeProduct({...p,externalRatingSource:''}),/nguồn đánh giá/);
 for(const v of [-2,1.5,1000001,'abc'])assert.throws(()=>normalizeProduct({...p,externalRatingCounts:{5:v}}),/Mỗi mức đánh giá/);
 assert.equal(normalizeProduct({...p,externalRatingCounts:{},externalRatingSource:''}).externalRatingCounts[5],0);
});
test('admin create/update and public product/category SSR show independently sourced rating without inflated Google schema',async()=>{
 const {sqlite,DB}=fixture(),env={DB};const auth=await createSession(env,new Request(host+'/admin/'));
 let r=await createProduct({env,request:req('/api/admin/products',auth,'POST',p)});
 assert.equal(r.status,201,await r.text());
 const stored=sqlite.prepare('SELECT external_rating_5,external_rating_4,external_rating_source FROM products WHERE id=?').get(p.id);
 assert.deepEqual({...stored},{external_rating_5:10,external_rating_4:4,external_rating_source:'Fanpage Hoa Lụa Thu Hiền'});
 const rAdmin=await (await adminList({env,request:new Request(host+'/api/admin/products',{headers:{Cookie:auth.cookie.split(';')[0]}})})).json();
 const adminProduct=rAdmin.products.find(x=>x.id===p.id);
 assert.equal(adminProduct.ratingAverage,4.71);assert.equal(adminProduct.reviewCount,14);assert.equal(adminProduct.ratingKind,'manual_external');
 const result=await (await publicList({env})).json();
 assert.equal(result.products.find(x=>x.id===p.id).reviewCount,14);
 const page=await productPage({env,params:{slug:p.slug},request:new Request(host+'/san-pham/'+p.slug+'/')});
 assert.equal(page.status,200);const html=await page.text();
 assert.match(html,/4,71\/5/);assert.match(html,/14 đánh giá tổng hợp từ Fanpage Hoa Lụa Thu Hiền/);
 assert.doesNotMatch(html,/"aggregateRating"/); // shop-imported rating must not masquerade as verified Google reviews
 const cat=await categoryPage({env,params:{slug:'hoa-lua'},request:new Request(host+'/danh-muc/hoa-lua/')});
 assert.match(await cat.text(),/đánh giá tổng hợp/);
 r=await updateProduct({env,params:{id:p.id},request:req('/api/admin/products/'+p.id,auth,'PATCH',{...p,externalRatingCounts:{1:0,2:0,3:0,4:1,5:1}})});
 assert.equal(r.status,200,await r.text());
 const updated=await (await publicList({env})).json();const item=updated.products.find(x=>x.id===p.id);
 assert.equal(item.reviewCount,2);assert.equal(item.ratingAverage,4.5);
 sqlite.close();
});
