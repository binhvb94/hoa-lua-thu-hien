import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {normalizeProduct} from '../lib/catalog.js';
import {productTrustMap,applyTrust,recommendProducts} from '../lib/product-trust.js';
import {onRequestPost as createProduct, onRequestGet as listAdminProducts} from '../functions/api/admin/products.js';
import {onRequestPatch as updateProduct} from '../functions/api/admin/products/[id].js';
import {onRequestGet as publicProducts} from '../functions/api/products.js';
import {onRequestGet as publicProductPage} from '../functions/san-pham/[slug].js';
import {onRequestGet as publicCategoryPage} from '../functions/danh-muc/[slug].js';
import {createSession} from '../lib/admin-auth.js';
function fixture(){
 const sqlite=new DatabaseSync(':memory:');
 for (const f of ['0001_init.sql','0002_catalog_admin.sql','0003_site_cms.sql','0004_orders_customers_admin.sql','0005_product_seo.sql','0006_categories.sql','0007_verified_metrics_reviews.sql','0008_manual_display_sales.sql']) sqlite.exec(readFileSync(new URL('../migrations/'+f,import.meta.url),'utf8'));
 const DB={prepare(sql){const stmt=sqlite.prepare(sql);let args=[];return {bind(...p){args=p;return this},first(){return Promise.resolve(stmt.get(...args)??null)},all(){return Promise.resolve({results:stmt.all(...args)})},run(){const r=stmt.run(...args);return Promise.resolve({meta:{changes:r.changes}})}}}};
 return {sqlite,DB};
}
const host='https://hoaluathuhien.shop';
const product={id:'MAN001',name:'Cành mộc lan thủ công',slug:'canh-moc-lan-thu-cong',category:'hoa-lua',price:152000,oldPrice:175000,image:'https://example.com/test.jpg',active:true,displaySoldCount:4725,detail:'Sản phẩm hoa giả trang trí'};
function req(url,auth,method,body){return new Request(host+url,{method,headers:{Cookie:auth.cookie.split(';')[0],Origin:host,'Content-Type':'application/json','X-CSRF-Token':auth.csrf},body:JSON.stringify(body)});}

test('manual sale count validates integer bounds and ignores legacy soldCount clients',()=>{
 const p=normalizeProduct({...product,soldCount:999999});
 assert.equal(p.displaySoldCount,4725);
 assert.equal(p.soldCount,undefined);
 for (const number of [-1,1.5,1e12,'abc']) assert.throws(()=>normalizeProduct({...product,displaySoldCount:number}),/Lượt bán hiển thị/);
});
test('ADMIN can save, edit and publish manual 4.725 count through public API and product SSR HTML',async()=>{
 const {sqlite,DB}=fixture();const env={DB};const auth=await createSession(env,new Request(host+'/admin/'));
 let r=await createProduct({env,request:req('/api/admin/products',auth,'POST',product)});
 assert.equal(r.status,201,await r.text());
 assert.equal(sqlite.prepare('SELECT display_sold_count AS n FROM products WHERE id=?').get('MAN001').n,4725);
 const admin=await listAdminProducts({env,request:new Request(host+'/api/admin/products',{headers:{Cookie:auth.cookie.split(';')[0]}})});
 const adminData=await admin.json();const adminItem=adminData.products.find(p=>p.id==='MAN001');
 assert.equal(adminItem.soldCount,4725);assert.equal(adminItem.actualSoldCount,0);assert.equal(adminItem.displaySoldCount,4725);
 const json=await (await publicProducts({env})).json();assert.equal(json.products.find(p=>p.id==='MAN001').soldCount,4725);
 let page=await publicProductPage({env,params:{slug:'canh-moc-lan-thu-cong'},request:new Request(host+'/san-pham/canh-moc-lan-thu-cong/')});
 assert.equal(page.status,200);assert.match(await page.text(),/4\.725 lượt bán/);
 let cat=await publicCategoryPage({env,params:{slug:'hoa-lua'},request:new Request(host+'/danh-muc/hoa-lua/')});
 assert.match(await cat.text(),/4\.725 lượt bán/);
 r=await updateProduct({env,params:{id:'MAN001'},request:req('/api/admin/products/MAN001',auth,'PATCH',{...product,displaySoldCount:123})});assert.equal(r.status,200,await r.text());
 const next=await (await publicProducts({env})).json();assert.equal(next.products.find(p=>p.id==='MAN001').soldCount,123);
 // Display metric never mutates real delivered order aggregates.
 assert.equal((await productTrustMap(DB)).get('MAN001')?.soldCount||0,0);
 sqlite.close();
});
test('best-selling recommendations use configured display metric, not COD records',()=>{
 const a={id:'A',name:'Hoa mẫu đơn',category:'hoa-lua'};
 const b={id:'B',name:'Hoa sen',category:'hoa-lua',active:true,soldCount:4725};
 const c={id:'C',name:'Hoa hồng',category:'hoa-lua',active:true,soldCount:500};
 assert.equal(recommendProducts(a,[a,b,c],'best_selling',1,()=>.5)[0].id,'B');
 const shown=applyTrust({id:'B',displaySoldCount:4725},new Map([['B',{soldCount:3,reviewCount:0,ratingAverage:0,ratingCounts:{1:0,2:0,3:0,4:0,5:0}}]]));
 assert.equal(shown.soldCount,4725);assert.equal(shown.actualSoldCount,3);
});
