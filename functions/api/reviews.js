import {send,clean} from '../../lib/catalog.js';
const allowedOrigin='https://hoaluathuhien.shop';
const normalizedPhone=x=>String(x||'').replace(/[.\s-]/g,'').replace(/^\+84/,'0');
export async function onRequestPost({request,env}){
 if(!env.DB)return send({ok:false,error:'Không có kết nối cơ sở dữ liệu.'},503);
 const origin=request.headers.get('Origin');
 if(origin!==allowedOrigin)return send({ok:false,error:'Yêu cầu không hợp lệ.'},403);
 if(!(request.headers.get('content-type')||'').toLowerCase().startsWith('application/json'))return send({ok:false,error:'Yêu cầu không hợp lệ.'},415);
 let body;try{body=await request.json()}catch{return send({ok:false,error:'Dữ liệu không hợp lệ.'},400)}
 const code=clean(body?.orderCode,60).toUpperCase();
 const phone=normalizedPhone(body?.phone);
 const productId=clean(body?.productId,24).toUpperCase();
 const rating=Number(body?.rating);
 const comment=clean(body?.comment,500);
 if(!/^TH[A-Z0-9]{8,45}$/.test(code)||!/^0\d{9}$/.test(phone)||!/^[A-Z0-9_-]{2,24}$/.test(productId)||!Number.isInteger(rating)||rating<1||rating>5||body?.confirm!==true)return send({ok:false,error:'Vui lòng điền đầy đủ mã đơn, điện thoại, số sao và xác nhận đánh giá thật.'},400);
 try{
  const order=await env.DB.prepare('SELECT id,phone,items_json,status FROM orders WHERE order_code=?').bind(code).first();
  if(!order||order.status!=='delivered'||normalizedPhone(order.phone)!==phone)return send({ok:false,error:'Chỉ người mua có đơn đã giao mới được gửi đánh giá. Kiểm tra mã đơn và số điện thoại.'},400);
  let items=[];try{items=JSON.parse(order.items_json)}catch{}
  if(!items.some(x=>x.id===productId))return send({ok:false,error:'Sản phẩm này không thuộc đơn hàng.'},400);
  const product=await env.DB.prepare('SELECT id FROM products WHERE id=? AND is_deleted=0').bind(productId).first();
  if(!product)return send({ok:false,error:'Sản phẩm không còn trên website.'},404);
  await env.DB.prepare('INSERT INTO product_reviews(id,product_id,order_id,rating,comment) VALUES (?,?,?,?,?)').bind(crypto.randomUUID(),productId,order.id,rating,comment).run();
  return send({ok:true,message:'Đã nhận đánh giá thật của bạn. Đánh giá sẽ hiển thị sau khi kiểm duyệt.'},201);
 }catch(e){
  if(/UNIQUE constraint/.test(String(e)))return send({ok:false,error:'Sản phẩm này đã được đánh giá từ đơn hàng đó.'},409);
  console.error('Review submit',e);return send({ok:false,error:'Không thể gửi đánh giá. Vui lòng thử lại.'},500);
 }
}
