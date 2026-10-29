import {requireAdmin,parseJson,audit} from '../../../../lib/admin-auth.js';
import {send} from '../../../../lib/catalog.js';
export async function onRequestPatch(ctx){
 const auth=await requireAdmin(ctx,true);if(auth.error)return auth.error;
 const id=ctx.params.id;if(!/^[a-f\d-]{36}$/i.test(id))return send({ok:false,error:'ID đánh giá không hợp lệ.'},400);
 let data;try{data=await parseJson(ctx.request,1000)}catch(e){return send({ok:false,error:e.message},400)}
 if(typeof data?.approved!=='boolean')return send({ok:false,error:'Trạng thái duyệt không hợp lệ.'},400);
 try{
  const result=await ctx.env.DB.prepare(`UPDATE product_reviews SET is_approved=?,reviewed_at=datetime('now')
   WHERE id=? AND EXISTS(SELECT 1 FROM orders WHERE orders.id=product_reviews.order_id AND orders.status='delivered')`).bind(data.approved?1:0,id).run();
  if(Number(result.meta?.changes)!==1)return send({ok:false,error:'Không tìm thấy đánh giá hoặc đơn chưa được giao.'},404);
  await audit(ctx.env,'review_moderate',id);
  return send({ok:true});
 }catch(e){console.error('Review moderation',e);return send({ok:false,error:'Không thể duyệt đánh giá.'},500)}
}
