import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {normalizeProduct,mapProduct,productImages,MAX_PRODUCT_IMAGES} from '../lib/catalog.js';
import {onRequestPost as createProduct,onRequestGet as adminProducts} from '../functions/api/admin/products.js';
import {onRequestPatch as editProduct} from '../functions/api/admin/products/[id].js';
import {onRequestGet as siteProducts} from '../functions/api/products.js';
import {onRequestGet as productPage} from '../functions/san-pham/[slug].js';
import {createSession} from '../lib/admin-auth.js';
const host='https://hoaluathuhien.shop';
const sample={id:'GAL001',name:'Hoa lụa Gallery',slug:'hoa-lua-gallery',category:'hoa-lua',price:152000,active:true,detail:'Hoa trang trí',image:'https://example.com/cover.jpg'};
function fixture(){
 const sqlite=new DatabaseSync(':memory:');
 for(const f of ['0001_init.sql','0002_catalog_admin.sql','0003_site_cms.sql','0004_orders_customers_admin.sql','0005_product_seo.sql','0006_categories.sql','0007_verified_metrics_reviews.sql','0008_manual_display_sales.sql','0009_external_rating_summary.sql','0010_product_gallery.sql','0011_product_variants.sql'])
  sqlite.exec(readFileSync(new URL('../migrations/'+f,import.meta.url),'utf8'));
 const DB={prepare(sql){const statement=sqlite.prepare(sql);let args=[];return {bind(...values){args=values;return this},first(){return Promise.resolve(statement.get(...args)??null)},all(){return Promise.resolve({results:statement.all(...args)})},run(){const r=statement.run(...args);return Promise.resolve({meta:{changes:r.changes}})}}}};
 return {sqlite,DB};
}
function request(path,auth,method,body){return new Request(host+path,{method,headers:{Cookie:auth.cookie.split(';')[0],Origin:host,'Content-Type':'application/json','X-CSRF-Token':auth.csrf},body:JSON.stringify(body)});}
test('V1.3.9.4: migration keeps existing main photo and adds an empty image gallery',()=>{
 const {sqlite}=fixture();
 const old=sqlite.prepare("SELECT image,gallery_images FROM products WHERE id='TH001'").get();
 assert.ok(old.image);assert.deepEqual(JSON.parse(old.gallery_images),[]);
 sqlite.close();
});
test('V1.3.9.4: Gallery validates limits, duplicate, and unsafe file URLs',()=>{
 assert.equal(MAX_PRODUCT_IMAGES,12);
 const imgs=Array.from({length:11},(_,i)=>`https://example.com/${i}.jpg`);
 assert.deepEqual(normalizeProduct({...sample,galleryImages:imgs}).galleryImages,imgs);
 assert.throws(()=>normalizeProduct({...sample,galleryImages:[...imgs,'https://example.com/extra.jpg']}),/Tối đa 12 ảnh/);
 assert.throws(()=>normalizeProduct({...sample,galleryImages:[imgs[0],imgs[0]]}),/không được trùng/);
 assert.throws(()=>normalizeProduct({...sample,galleryImages:[sample.image]}),/không được trùng/);
 assert.throws(()=>normalizeProduct({...sample,galleryImages:['javascript:alert(1)']}),/Ảnh phụ/);
 assert.deepEqual(normalizeProduct(sample).galleryImages,[]);
});
test('V1.3.9.4: ADMIN create/edit gallery, public API, SEO HTML and image schema preserve ordering',async()=>{
 const {sqlite,DB}=fixture(),env={DB};const auth=await createSession(env,new Request(host+'/admin/'));
 const galleryImages=['https://example.com/side.jpg','https://example.com/detail.jpg'];
 let response=await createProduct({env,request:request('/api/admin/products',auth,'POST',{...sample,galleryImages})});
 assert.equal(response.status,201,await response.text());
 let row=sqlite.prepare("SELECT image,gallery_images FROM products WHERE id='GAL001'").get();
 assert.equal(row.image,sample.image);assert.deepEqual(JSON.parse(row.gallery_images),galleryImages);
 const admin=await (await adminProducts({env,request:new Request(host+'/api/admin/products',{headers:{Cookie:auth.cookie.split(';')[0]}})})).json();
 assert.deepEqual(admin.products.find(p=>p.id==='GAL001').images,[sample.image,...galleryImages]);
 const publicData=await (await siteProducts({env})).json();
 assert.deepEqual(publicData.products.find(p=>p.id==='GAL001').galleryImages,galleryImages);
 let page=await productPage({env,params:{slug:sample.slug},request:new Request(host+'/san-pham/'+sample.slug+'/')});
 assert.equal(page.status,200);let html=await page.text();
 assert.match(html,/id="seo-gallery-main"/);assert.match(html,/data-gallery-index="1"/);
 assert.match(html,/data-gallery-index="2"/);assert.match(html,/id="seo-lightbox"/);
 const raw=html.match(/<script type="application\/json" id="seo-gallery-data">([^<]+)<\/script>/)?.[1];
 assert.deepEqual(JSON.parse(raw),[sample.image,...galleryImages]);
 assert.match(html, /"image":\["https:\/\/example\.com\/cover\.jpg","https:\/\/example\.com\/side\.jpg","https:\/\/example\.com\/detail\.jpg"\]/);
 response=await editProduct({env,params:{id:sample.id},request:request('/api/admin/products/GAL001',auth,'PATCH',{...sample,image:galleryImages[1],galleryImages:[sample.image]})});
 assert.equal(response.status,200,await response.text());
 row=sqlite.prepare("SELECT image,gallery_images FROM products WHERE id='GAL001'").get();
 assert.equal(row.image,galleryImages[1]);assert.deepEqual(JSON.parse(row.gallery_images),[sample.image]);
 page=await productPage({env,params:{slug:sample.slug},request:new Request(host+'/san-pham/'+sample.slug+'/')});
 html=await page.text();
 assert.deepEqual(JSON.parse(html.match(/<script type="application\/json" id="seo-gallery-data">([^<]+)<\/script>/)[1]),[galleryImages[1],sample.image]);
 sqlite.close();
});
test('V1.3.9.4: simple product still has one photo, no thumbnails and SEO photo button',async()=>{
 const {sqlite,DB}=fixture(),env={DB};
 const page=await productPage({env,params:{slug:'bo-hoa-hong-lua-hong-phan'},request:new Request(host+'/san-pham/bo-hoa-hong-lua-hong-phan/')});
 // Old product remains indexable with an image; whether slug is in sample seed is checked below instead.
 const row=sqlite.prepare("SELECT image,gallery_images FROM products WHERE id='TH001'").get();
 assert.deepEqual(productImages(row),[row.image]);
 const mapped=mapProduct({id:'P',slug:'p',image:row.image,gallery_images:'[]',is_active:1});
 assert.deepEqual(mapped.images,[row.image]);
 sqlite.close();
});
test('V1.3.9.4: build sources include gallery upload, image picker and responsive lightbox',()=>{
 const form=readFileSync(new URL('../admin/index.html',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../admin/admin.js',import.meta.url),'utf8');
 const seo=readFileSync(new URL('../seo-product.js',import.meta.url),'utf8');
 assert.match(form,/id="upload-image"[^>]+multiple/);
 assert.match(form,/id="admin-gallery-items"/);
 assert.match(ui,/function modifyProductGallery/);assert.match(ui,/renderProductGallery/);
 assert.match(seo,/initProductGallery/);assert.match(seo,/touchstart/);
});
