import { products } from '../../data/products.js';

const json = (body, status=200) => Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const clean = (val, max) => typeof val === 'string' ? val.trim().replace(/[\u0000-\u001f\u007f]/g,' ').slice(0,max) : '';
const phoneValid = s => /^(?:0\d{9}|\+84\d{9})$/.test(s.replace(/[.\s-]/g,''));

export async function onRequestPost({ request, env }) {
  if (env.ENABLE_ORDERS !== 'true') return json({ok:false,error:'Website chưa mở nhận đơn trực tuyến.'},503);
  if (!env.DB) return json({ok:false,error:'Chưa cấu hình cơ sở dữ liệu D1 (binding DB).'},503);
  if ((request.headers.get('content-type')||'').split(';')[0].trim().toLowerCase() !== 'application/json') return json({ok:false,error:'Yêu cầu phải dùng JSON.'},415);
  const len=Number(request.headers.get('content-length')||0);
  if(len>15000) return json({ok:false,error:'Dữ liệu vượt quá kích thước cho phép.'},413);
  let body;
  try {body=await request.json();} catch{return json({ok:false,error:'Dữ liệu JSON không hợp lệ.'},400);}
  const name=clean(body?.name,80),phone=clean(body?.phone,25),address=clean(body?.address,400),note=clean(body?.note,500);
  const items=body?.items;
  if(name.length<2 || !phoneValid(phone) || address.length<8) return json({ok:false,error:'Vui lòng kiểm tra họ tên, số điện thoại và địa chỉ giao hàng.'},400);
  if(body?.payment_method!=='cod') return json({ok:false,error:'Hiện chỉ hỗ trợ thanh toán khi nhận hàng (COD).'},400);
  if(!Array.isArray(items) || items.length===0 || items.length>25) return json({ok:false,error:'Giỏ hàng không hợp lệ.'},400);
  const seen=new Set(), verified=[];
  for(const item of items){
    if(!item || typeof item.id !== 'string' || !Number.isInteger(item.quantity) || item.quantity<1 || item.quantity>20 || seen.has(item.id)) return json({ok:false,error:'Số lượng hoặc sản phẩm không hợp lệ.'},400);
    const product=products.find(p=>p.id===item.id);
    if(!product) return json({ok:false,error:'Có sản phẩm không tồn tại trong danh mục.'},400);
    seen.add(item.id);
    verified.push({id:product.id,name:product.name,quantity:item.quantity,price:product.price,line_total:product.price*item.quantity});
  }
  const subtotal=verified.reduce((s,i)=>s+i.line_total,0);
  if(subtotal<=0 || subtotal>100000000) return json({ok:false,error:'Giá trị giỏ hàng không hợp lệ.'},400);
  const key=clean(request.headers.get('Idempotency-Key'),80);
  if(!/^[A-Za-z0-9-]{12,80}$/.test(key)) return json({ok:false,error:'Thiếu mã xác nhận đơn hàng hợp lệ.'},400);
  // Trả lại kết quả cũ khi request được gửi lại; không tạo thêm đơn.
  const existing=await env.DB.prepare('SELECT id, order_code, total FROM orders WHERE client_key=?').bind(key).first();
  if(existing)return json({ok:true,duplicate:true,order_id:existing.id,order_code:existing.order_code,total:existing.total});
  const id=crypto.randomUUID();
  const order_code='TH'+Date.now().toString(36).toUpperCase()+id.slice(0,4).toUpperCase();
  try{
    await env.DB.prepare(`INSERT INTO orders (id,client_key,order_code,customer_name,phone,address,note,payment_method,items_json,subtotal,shipping_fee,total,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id,key,order_code,name,phone,address,note,'cod',JSON.stringify(verified),subtotal,0,subtotal,'new').run();
    return json({ok:true,duplicate:false,order_id:id,order_code,total:subtotal});
  }catch(error){
    // Tránh lỗi trùng đơn khi 2 request đồng thời.
    const saved=await env.DB.prepare('SELECT id,order_code,total FROM orders WHERE client_key=?').bind(key).first();
    if(saved)return json({ok:true,duplicate:true,order_id:saved.id,order_code:saved.order_code,total:saved.total});
    console.error('Order insert:',error);
    return json({ok:false,error:'Không thể lưu đơn hàng. Vui lòng thử lại hoặc nhắn Fanpage.'},500);
  }
}
