import {requireAdmin} from '../../../../lib/admin-auth.js';
import {send} from '../../../../lib/catalog.js';
export async function onRequestGet(ctx){
 const auth=await requireAdmin(ctx);if(auth.error)return auth.error;
 const url=new URL(ctx.request.url),id=(url.searchParams.get('productId')||'').trim();
 if(!/^[A-Z0-9_-]{2,24}$/.test(id))return send({ok:false,error:'Mã sản phẩm không hợp lệ.'},400);
 try{
  const rows=await ctx.env.DB.prepare(`SELECT r.id,r.rating,r.comment,r.is_approved,r.created_at,o.order_code,o.status AS order_status
   FROM product_reviews r JOIN orders o ON o.id=r.order_id
   WHERE r.product_id=? ORDER BY r.created_at DESC LIMIT 100`).bind(id).all();
  return send({ok:true,reviews:rows.results||[]});
 }catch(e){console.error('Admin reviews',e);return send({ok:false,error:'Không tải được đánh giá.'},503)}
}
