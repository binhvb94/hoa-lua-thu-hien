import {send,normalizeProduct} from '../../../../lib/catalog.js';
import {requireAdmin,parseJson,audit} from '../../../../lib/admin-auth.js';
export async function onRequestPatch(ctx){
 const a=await requireAdmin(ctx,true);if(a.error)return a.error;
 const id=decodeURIComponent(ctx.params.id);
 try{
   const old=await ctx.env.DB.prepare('SELECT id FROM products WHERE id=? AND is_deleted=0').bind(id).first();
   if(!old)return send({ok:false,error:'Không tìm thấy sản phẩm.'},404);
   const p=normalizeProduct(await parseJson(ctx.request),old);
   if(p.id!==id)return send({ok:false,error:'Không thể đổi mã sản phẩm. Hãy tạo mã mới nếu cần.'},400);
   await ctx.env.DB.prepare('UPDATE products SET slug=?,name=?,category=?,price=?,old_price=?,badge=?,detail=?,material=?,size=?,image=?,tone=?,is_active=?,is_sample=0,seo_title=?,seo_description=?,updated_at=datetime(\'now\') WHERE id=?')
   .bind(p.slug,p.name,p.category,p.price,p.oldPrice,p.badge,p.detail,p.material,p.size,p.image,p.tone,p.active?1:0,p.seoTitle,p.seoDescription,id).run();
   await audit(ctx.env,'update',id);
   return send({ok:true,product:p});
 }catch(e){if(/UNIQUE constraint/.test(String(e)))return send({ok:false,error:'Đường dẫn sản phẩm đã được sử dụng.'},409);return send({ok:false,error:e.message||'Không thể sửa sản phẩm.'},400)}
}
export async function onRequestDelete(ctx){
 const a=await requireAdmin(ctx,true);if(a.error)return a.error;
 const id=decodeURIComponent(ctx.params.id);
 try{
   const updated=await ctx.env.DB.prepare('UPDATE products SET is_deleted=1,is_active=0,updated_at=datetime(\'now\') WHERE id=? AND is_deleted=0').bind(id).run();
   if(!updated.meta?.changes)return send({ok:false,error:'Sản phẩm không tồn tại.'},404);
   await audit(ctx.env,'delete',id);
   return send({ok:true});
 }catch(e){console.error(e);return send({ok:false,error:'Không thể xóa sản phẩm.'},500)}
}
