import {requireAdmin,parseJson} from '../../../../lib/admin-auth.js';
import {send} from '../../../../lib/catalog.js';
const valid = new Set(['new','shipping','delivered','cancelled']);
const idOK = id=>typeof id==='string'&&/^[a-f0-9-]{36}$/i.test(id);
export async function onRequestGet(ctx){
 const auth=await requireAdmin(ctx);if(auth.error)return auth.error;
 const id=ctx.params.id;if(!idOK(id))return send({ok:false,error:'Mã đơn hàng không hợp lệ.'},400);
 try{
  const order=await ctx.env.DB.prepare('SELECT id,order_code,customer_name,phone,address,note,payment_method,items_json,subtotal,shipping_fee,total,status,created_at FROM orders WHERE id=?').bind(id).first();
  if(!order)return send({ok:false,error:'Không tìm thấy đơn hàng.'},404);
  const history=await ctx.env.DB.prepare('SELECT previous_status,new_status,changed_at FROM order_status_history WHERE order_id=? ORDER BY changed_at DESC,id DESC LIMIT 100').bind(id).all();
  let items=[];try{const decoded=JSON.parse(order.items_json);if(Array.isArray(decoded))items=decoded;}catch{console.error('Order items_json invalid:',id)}
  const {items_json,...publicOrder}=order;
  return send({ok:true,order:{...publicOrder,items},history:history.results||[]});
 }catch(err){console.error('Order detail:',err);return send({ok:false,error:'Không thể xem chi tiết đơn hàng. Kiểm tra migration 0004.'},503)}
}
export async function onRequestPatch(ctx){
 const auth=await requireAdmin(ctx,true);if(auth.error)return auth.error;
 const id=ctx.params.id;if(!idOK(id))return send({ok:false,error:'Mã đơn hàng không hợp lệ.'},400);
 let body;try{body=await parseJson(ctx.request,2000)}catch(e){return send({ok:false,error:e.message},400)}
 const next=body?.status,expected=body?.expectedStatus;
 if(!valid.has(next)||!valid.has(expected))return send({ok:false,error:'Trạng thái yêu cầu không hợp lệ.'},400);
 if(next===expected)return send({ok:false,error:'Vui lòng chọn trạng thái khác trạng thái hiện tại.'},400);
 try{
  const found=await ctx.env.DB.prepare('SELECT status FROM orders WHERE id=?').bind(id).first();
  if(!found)return send({ok:false,error:'Không tìm thấy đơn hàng.'},404);
  if(found.status!==expected)return send({ok:false,error:'Đơn hàng đã được cập nhật ở phiên khác. Hãy tải lại.'},409);
  const result=await ctx.env.DB.prepare('UPDATE orders SET status=? WHERE id=? AND status=?').bind(next,id,expected).run();
  if(Number(result.meta?.changes)!==1)return send({ok:false,error:'Trạng thái đã thay đổi. Hãy tải lại.'},409);
  // Trigger D1 0004 tự ghi nhật ký nguyên tử trong cùng lần UPDATE.
  return send({ok:true,id,status:next});
 }catch(err){console.error('Order status change:',err);return send({ok:false,error:'Không cập nhật được trạng thái đơn hàng.'},500)}
}
