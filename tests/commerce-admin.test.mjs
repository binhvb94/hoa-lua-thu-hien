import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {createSession} from '../lib/admin-auth.js';
import {onRequestPost as placeOrder} from '../functions/api/orders.js';
import {onRequestPost as register} from '../functions/api/register.js';
import {onRequestGet as listOrders} from '../functions/api/admin/orders/index.js';
import {onRequestGet as getOrder,onRequestPatch as patchOrder} from '../functions/api/admin/orders/[id].js';
import {onRequestGet as listCustomers} from '../functions/api/admin/customers/index.js';

function dbFixture(){
 const sqlite=new DatabaseSync(':memory:');
 for(const migration of ['0001_init.sql','0002_catalog_admin.sql','0004_orders_customers_admin.sql','0011_product_variants.sql'])sqlite.exec(readFileSync(new URL('../migrations/'+migration,import.meta.url),'utf8'));
 const DB={prepare(sql){let bindings=[];return {bind(...values){bindings=values;return this;},async first(){return sqlite.prepare(sql).get(...bindings)||null;},async all(){return {results:sqlite.prepare(sql).all(...bindings)};},async run(){const m=sqlite.prepare(sql).run(...bindings);return {meta:{changes:m.changes}};}};}};
 return {DB,sqlite};
}
async function makeCall(handler,{env,path,method='GET',body,auth,extra={}}){
 const headers={Origin:'https://shop.test',...extra};if(body!==undefined)headers['Content-Type']='application/json';
 if(auth){headers.Cookie=auth.cookie.split(';')[0];headers['X-CSRF-Token']=auth.csrf;}
 const request=new Request('https://shop.test'+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
 const response=await handler({request,env,params:{id:path.split('/').at(-1)}});
 return {status:response.status,body:await response.json()};
}
test('Đơn COD được ghi vào orders, có chi tiết, cập nhật trạng thái với CSRF và lịch sử, không ảnh hưởng registrations',async()=>{
 const fixture=dbFixture();const env={DB:fixture.DB,ENABLE_ORDERS:'true',ENABLE_REGISTRATION:'true'};
 assert.equal(fixture.sqlite.prepare('SELECT COUNT(*) n FROM products').get().n,9);
 const unauth=await makeCall(listOrders,{env,path:'/api/admin/orders'});assert.equal(unauth.status,401);
 const unauthedCustomers=await makeCall(listCustomers,{env,path:'/api/admin/customers'});assert.equal(unauthedCustomers.status,401);
 const orderData={name:'Nguyễn Thu Hà',phone:'0912345678',address:'Số 12 phố Hoa, Nam Định',note:'Gọi trước khi giao',payment_method:'cod',items:[{id:'TH001',quantity:2}]};
 const created=await makeCall(placeOrder,{env,path:'/api/orders',method:'POST',body:orderData,extra:{'Idempotency-Key':'user-client-123456789'}});
 assert.equal(created.status,200);assert.equal(created.body.ok,true);assert.equal(created.body.total,378000);
 const duplicate=await makeCall(placeOrder,{env,path:'/api/orders',method:'POST',body:orderData,extra:{'Idempotency-Key':'user-client-123456789'}});assert.equal(duplicate.body.duplicate,true);
 const subscriber=await makeCall(register,{env,path:'/api/register',method:'POST',body:{name:'Cô Hà',phone:'0912345678',email:'ha@example.com',marketing_consent:true}});
 assert.equal(subscriber.body.created,true);
 assert.equal(fixture.sqlite.prepare('SELECT COUNT(*) n FROM orders').get().n,1);
 assert.equal(fixture.sqlite.prepare('SELECT COUNT(*) n FROM registrations').get().n,1);
 const auth=await createSession(env,new Request('https://shop.test/admin/'));
 const orders=await makeCall(listOrders,{env,path:'/api/admin/orders?status=new',auth});
 assert.equal(orders.body.orders.length,1);assert.equal(orders.body.orders[0].status,'new');
 assert.ok(!('address' in orders.body.orders[0])); // Không phơi bày quá nhiều dữ liệu trên trang danh sách
 const details=await makeCall(getOrder,{env,path:'/api/admin/orders/'+created.body.order_id,auth});
 assert.equal(details.body.order.customer_name,'Nguyễn Thu Hà');
 assert.equal(details.body.order.items[0].name,'Bó hoa hồng lụa hồng phấn');
 assert.equal(details.body.order.note,'Gọi trước khi giao');
 const cross=await makeCall(patchOrder,{env,path:'/api/admin/orders/'+created.body.order_id,method:'PATCH',body:{status:'shipping',expectedStatus:'new'}});assert.equal(cross.status,401);
 const patch=await makeCall(patchOrder,{env,path:'/api/admin/orders/'+created.body.order_id,auth,method:'PATCH',body:{status:'shipping',expectedStatus:'new'}});
 assert.equal(patch.status,200);assert.equal(patch.body.status,'shipping');
 const stale=await makeCall(patchOrder,{env,path:'/api/admin/orders/'+created.body.order_id,auth,method:'PATCH',body:{status:'delivered',expectedStatus:'new'}});assert.equal(stale.status,409);
 const details2=await makeCall(getOrder,{env,path:'/api/admin/orders/'+created.body.order_id,auth});assert.equal(details2.body.history.length,1);
 const customers=await makeCall(listCustomers,{env,path:'/api/admin/customers',auth});
 assert.equal(customers.body.customers.length,1);assert.equal(customers.body.customers[0].full_name,'Cô Hà');assert.equal(customers.body.customers[0].phone,'0912345678');
 assert.equal(fixture.sqlite.prepare('SELECT COUNT(*) n FROM registrations').get().n,1);
 assert.equal(fixture.sqlite.prepare('SELECT COUNT(*) n FROM orders').get().n,1);
 fixture.sqlite.close();
});
test('Lọc tìm kiếm escape wildcard và từ chối giá/quantity giả',async()=>{
 const fixture=dbFixture(),env={DB:fixture.DB,ENABLE_ORDERS:'true',ENABLE_REGISTRATION:'true'};
 const rejected=await makeCall(placeOrder,{env,path:'/api/orders',method:'POST',body:{name:'Khách thử',phone:'0912345678',address:'Địa chỉ giao hàng hợp lệ',payment_method:'cod',items:[{id:'TH001',quantity:99,price:1}]},extra:{'Idempotency-Key':'key-foobar-12345678'}});
 assert.equal(rejected.status,400);
 const auth=await createSession(env,new Request('https://shop.test/admin/'));
 const result=await makeCall(listOrders,{env,path:'/api/admin/orders?q=%25&status=all',auth});assert.equal(result.status,200);assert.equal(result.body.total,0);
 const result2=await makeCall(listCustomers,{env,path:'/api/admin/customers?q=%5F',auth});assert.equal(result2.status,200);
 fixture.sqlite.close();
});
