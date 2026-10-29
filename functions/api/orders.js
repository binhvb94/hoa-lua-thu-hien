import {parseVariantConfig,isVariantProduct,variantSummary} from '../../lib/variants.js';
// Giá và trạng thái bán lấy trực tiếp từ D1, tuyệt đối không tin giá trên trình duyệt.

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
  const key=clean(request.headers.get('Idempotency-Key'),80);
  if(!/^[A-Za-z0-9-]{12,80}$/.test(key)) return json({ok:false,error:'Thiếu mã xác nhận đơn hàng hợp lệ.'},400);
  // Trả lại kết quả cũ khi request được gửi lại; không tạo thêm đơn.
  const existing=await env.DB.prepare('SELECT id, order_code, total FROM orders WHERE client_key=?').bind(key).first();
  if(existing)return json({ok:true,duplicate:true,order_id:existing.id,order_code:existing.order_code,total:existing.total});
  const seen=new Set(), verified=[], variantUpdates=[];
  for(const item of items){
    if(!item || typeof item.id !== 'string' || !Number.isInteger(item.quantity) || item.quantity<1 || item.quantity>20) return json({ok:false,error:'Số lượng hoặc sản phẩm không hợp lệ.'},400);
    const product=await env.DB.prepare('SELECT id,name,price,variant_config FROM products WHERE id=? AND is_active=1 AND is_deleted=0').bind(item.id).first();
    if(!product) return json({ok:false,error:'Có sản phẩm ngừng bán hoặc không tồn tại. Vui lòng tải lại trang.'},400);
    const conf=parseVariantConfig(product.variant_config),isVariant=isVariantProduct(conf);
    const variantKey=typeof item.variantKey==='string'?item.variantKey:'';
    const variant=isVariant?conf.items.find(v=>v.key===variantKey):null;
    if((isVariant&&!variant)||(!isVariant&&variantKey))return json({ok:false,error:'Hãy chọn phân loại sản phẩm hợp lệ.'},400);
    const lineKey=item.id+'@@'+variantKey;
    if(seen.has(lineKey))return json({ok:false,error:'Sản phẩm trùng phân loại trong giỏ.'},400);
    seen.add(lineKey);
    if(variant&&variant.stock<item.quantity)return json({ok:false,error:`Phân loại ${variantSummary(variant,conf)} chỉ còn ${variant.stock} sản phẩm.`},409);
    const price=variant?.price??product.price;
    verified.push({id:product.id,name:product.name,quantity:item.quantity,price,line_total:price*item.quantity,...(variant?{variantKey,variantName:variantSummary(variant,conf),sku:variant.sku||'',image:variant.image||''}:{})});
    if(variant){const index=conf.items.findIndex(v=>v.key===variantKey);variantUpdates.push({productId:product.id,key:variantKey,index,qty:item.quantity});}
  }
  const subtotal=verified.reduce((s,i)=>s+i.line_total,0);
  if(subtotal<=0 || subtotal>100000000) return json({ok:false,error:'Giá trị giỏ hàng không hợp lệ.'},400);
  const id=crypto.randomUUID();
  const order_code='TH'+Date.now().toString(36).toUpperCase()+id.slice(0,4).toUpperCase();
  try{
    const insert=env.DB.prepare(`INSERT INTO orders (id,client_key,order_code,customer_name,phone,address,note,payment_method,items_json,subtotal,shipping_fee,total,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id,key,order_code,name,phone,address,note,'cod',JSON.stringify(verified),subtotal,0,subtotal,'new');
    if(variantUpdates.length){
      // D1.batch runs a single transaction. The trigger in SQL 0011 aborts / rolls back the whole
      // order if an option disappeared or stock became insufficient between read and commit.
      if(typeof env.DB.batch!=='function')throw new Error('D1 batch is required for variant orders.');
      const updates=variantUpdates.map(({productId,key,index,qty})=>{
        const stockPath=`$.items[${index}].stock`,keyPath=`$.items[${index}].key`;
        return env.DB.prepare("UPDATE products SET variant_config=json_set(variant_config,?,CASE WHEN json_extract(variant_config,?)=? THEN COALESCE(json_extract(variant_config,?),0)-? ELSE -1 END),updated_at=datetime('now') WHERE id=?").bind(stockPath,keyPath,key,stockPath,qty,productId);
      });
      await env.DB.batch([...updates,insert]);
    } else await insert.run();
    return json({ok:true,duplicate:false,order_id:id,order_code,total:subtotal});
  }catch(error){
    // Tránh lỗi trùng đơn khi 2 request đồng thời.
    const saved=await env.DB.prepare('SELECT id,order_code,total FROM orders WHERE client_key=?').bind(key).first();
    if(saved)return json({ok:true,duplicate:true,order_id:saved.id,order_code:saved.order_code,total:saved.total});
    console.error('Order insert:',error);
    if(/VARIANT_OUT_OF_STOCK|constraint failed|SQLITE_CONSTRAINT/.test(String(error)))return json({ok:false,error:'Phân loại đã hết hàng hoặc tồn kho vừa thay đổi. Vui lòng tải lại trang.'},409);
    return json({ok:false,error:'Không thể lưu đơn hàng. Vui lòng thử lại hoặc nhắn Fanpage.'},500);
  }
}
