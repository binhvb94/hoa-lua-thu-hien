import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {normalizeVariants,variantKey} from '../lib/variants.js';
import {createSession} from '../lib/admin-auth.js';
import {onRequestPost as addProduct,onRequestGet as getProducts} from '../functions/api/admin/products.js';
import {onRequestPost as orderProduct} from '../functions/api/orders.js';
import {onRequestPatch as updateOrder} from '../functions/api/admin/orders/[id].js';
import {onRequestGet as productPage} from '../functions/san-pham/[slug].js';
const host='https://hoaluathuhien.shop';
const migrations=['0001_init.sql','0002_catalog_admin.sql','0003_site_cms.sql','0004_orders_customers_admin.sql','0005_product_seo.sql','0006_categories.sql','0007_verified_metrics_reviews.sql','0008_manual_display_sales.sql','0009_external_rating_summary.sql','0010_product_gallery.sql','0011_product_variants.sql'];
function fixture(){
 const sqlite=new DatabaseSync(':memory:');
 for(const f of migrations)sqlite.exec(readFileSync(new URL('../migrations/'+f,import.meta.url),'utf8'));
 function statement(sql){let args=[];return {bind(...a){args=a;return this},async first(){return sqlite.prepare(sql).get(...args)??null},async all(){return {results:sqlite.prepare(sql).all(...args)}},async run(){const r=sqlite.prepare(sql).run(...args);return {meta:{changes:r.changes}}}}}
 const DB={prepare:statement,async batch(statements){const result=[];sqlite.exec('BEGIN IMMEDIATE');try{for(const x of statements)result.push(await x.run());sqlite.exec('COMMIT');return result}catch(e){sqlite.exec('ROLLBACK');throw e}}};
 return {DB,sqlite};
}
const config={axes:[{name:'Màu sắc',values:['Đỏ','Xanh']},{name:'Chiều cao',values:['50cm','70cm']}],items:[]};
config.items=config.axes[0].values.flatMap((color,i)=>config.axes[1].values.map((size,j)=>({key:variantKey([color,size]),values:[color,size],price:100000+i*10000+j*5000,stock:2,sku:`SKU-${i}-${j}`,image:`https://example.com/${i}${j}.jpg`})));
const sample={id:'VAR001',slug:'san-pham-phan-loai',name:'Hoa lụa có phân loại',category:'hoa-lua',price:100000,active:true,image:'https://example.com/main.jpg',variantConfig:config};
function apiRequest(path,method,body,auth=null,key){return new Request(host+path,{method,headers:{'Content-Type':'application/json',Origin:host,...(key?{'Idempotency-Key':key}:{}),...(auth?{Cookie:auth.cookie.split(';')[0],'X-CSRF-Token':auth.csrf}:{})},body:JSON.stringify(body)})}
async function create(env,auth){const r=await addProduct({env,request:apiRequest('/api/admin/products','POST',sample,auth)});assert.equal(r.status,201,await r.text());}
const orderBody=(items)=>({name:'Hoa Trần',phone:'0912345678',address:'123 Phố Hoa Nam Định',payment_method:'cod',items});
test('product variants: validation, 2 axes and price/stock/SKU/image per combination',()=>{
 const o=normalizeVariants(config);assert.equal(o.items.length,4);assert.equal(o.items[3].price,115000);
 assert.throws(()=>normalizeVariants({...config,axes:[...config.axes,{name:'Mẫu',values:['A']}] }),/tối đa hai/);
 assert.throws(()=>normalizeVariants({...config,items:config.items.slice(1)}),/Số tổ hợp/);
 assert.throws(()=>normalizeVariants({...config,items:config.items.map((v,i)=>({...v,sku:'SAME'}))}),/duy nhất/);
 assert.throws(()=>normalizeVariants({...config,items:config.items.map((v,i)=>i?{...v}:{...v,stock:-1})}),/Tồn kho/);
 assert.deepEqual(normalizeVariants(null),{axes:[],items:[]});
});
test('product variants: admin stores variants, public API and SEO offers selectors',async()=>{
 const {DB,sqlite}=fixture(),env={DB};const auth=await createSession(env,new Request(host+'/admin/'));await create(env,auth);
 const row=sqlite.prepare("SELECT variant_config FROM products WHERE id='VAR001'").get();assert.deepEqual(JSON.parse(row.variant_config),config);
 const r=await (await getProducts({env,request:new Request(host+'/api/admin/products',{headers:{Cookie:auth.cookie.split(';')[0]}})})).json();assert.equal(r.products.find(p=>p.id==='VAR001').variantConfig.items.length,4);
 const page=await productPage({env,params:{slug:'san-pham-phan-loai'},request:new Request(host+'/san-pham/san-pham-phan-loai/')});assert.equal(page.status,200);const html=await page.text();
 assert.match(html,/id="seo-variants"/);assert.match(html,/Màu sắc/);assert.match(html,/Chiều cao/);assert.match(html,/id="seo-variants-data"/);assert.match(html,/data-variant-value="Đỏ"/);
 sqlite.close();
});
test('product variants: COD uses server variant price, stock decrements atomically and cancellation restores',async()=>{
 const {DB,sqlite}=fixture(),env={DB,ENABLE_ORDERS:'true'};const auth=await createSession(env,new Request(host+'/admin/'));await create(env,auth);
 const key1=config.items[0].key,key2=config.items[3].key;
 const req=apiRequest('/api/orders','POST',orderBody([{id:'VAR001',variantKey:key1,quantity:2,price:1},{id:'VAR001',variantKey:key2,quantity:1,price:1}]),null,'valid-variant-order-1234');
 const placed=await orderProduct({env,request:req});assert.equal(placed.status,200,await placed.clone().text());const body=await placed.json();assert.equal(body.total,315000);
 const order=sqlite.prepare('SELECT * FROM orders WHERE id=?').get(body.order_id);const items=JSON.parse(order.items_json);assert.equal(items.length,2);assert.equal(items[0].price,100000);assert.equal(items[1].price,115000);assert.equal(items[0].sku,'SKU-0-0');
 const stock=()=>JSON.parse(sqlite.prepare("SELECT variant_config FROM products WHERE id='VAR001'").get().variant_config).items.map(v=>v.stock);
 assert.deepEqual(stock(),[0,2,2,1]);
 const dup=await (await orderProduct({env,request:apiRequest('/api/orders','POST',orderBody([{id:'VAR001',variantKey:key1,quantity:2}]),null,'valid-variant-order-1234')})).json();assert.equal(dup.duplicate,true);assert.deepEqual(stock(),[0,2,2,1]);
 const soldOut=await orderProduct({env,request:apiRequest('/api/orders','POST',orderBody([{id:'VAR001',variantKey:key1,quantity:1}]),null,'valid-variant-order-5678')});assert.equal(soldOut.status,409);
 const changed=await updateOrder({env,params:{id:body.order_id},request:apiRequest('/api/admin/orders/'+body.order_id,'PATCH',{status:'cancelled',expectedStatus:'new'},auth)});assert.equal(changed.status,200,await changed.text());assert.deepEqual(stock(),[2,2,2,2]);
 const reopening=await updateOrder({env,params:{id:body.order_id},request:apiRequest('/api/admin/orders/'+body.order_id,'PATCH',{status:'new',expectedStatus:'cancelled'},auth)});assert.equal(reopening.status,200);assert.deepEqual(stock(),[0,2,2,1]);
 sqlite.close();
});
test('product variants: existing one-price products still accept COD without variantKey',async()=>{
 const {DB,sqlite}=fixture(),env={DB,ENABLE_ORDERS:'true'};
 const r=await orderProduct({env,request:apiRequest('/api/orders','POST',orderBody([{id:'TH001',quantity:1}]),null,'legacy-simple-order-1234')});assert.equal(r.status,200,await r.text());
 sqlite.close();
});
test('product variants: storefront/admin have selectors, thumbnails, variant fields',()=>{
 const frontend=readFileSync(new URL('../app.js',import.meta.url),'utf8'),editor=readFileSync(new URL('../admin/index.html',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../admin/product-variants.js',import.meta.url),'utf8'),seo=readFileSync(new URL('../seo-product.js',import.meta.url),'utf8');
 assert.match(editor,/id="variant-axes"/);assert.match(editor,/id="variant-rows"/);assert.match(ui,/data-variant-upload/);assert.match(ui,/variantKey/);
 assert.match(frontend,/variantKey/);assert.match(frontend,/variantFor/);assert.match(seo,/selectedVariant/);
});
