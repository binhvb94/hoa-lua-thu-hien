// Chỉ lấy danh sách đăng ký nhận tin; KHÔNG JOIN với orders.
import {requireAdmin} from '../../../../lib/admin-auth.js';
import {send} from '../../../../lib/catalog.js';
const escapeLike=s=>s.replace(/[\\%_]/g,'\\$&');
export async function onRequestGet(ctx){
 const auth=await requireAdmin(ctx);if(auth.error)return auth.error;
 const url=new URL(ctx.request.url),q=(url.searchParams.get('q')||'').trim().slice(0,100);
 const page=Number(url.searchParams.get('page')||'1');
 if(!Number.isSafeInteger(page)||page<1||page>500)return send({ok:false,error:'Trang không hợp lệ.'},400);
 const where=q?" WHERE (full_name LIKE ? ESCAPE '\\' OR phone LIKE ? ESCAPE '\\' OR email LIKE ? ESCAPE '\\')":'';
 const match='%'+escapeLike(q)+'%',params=q?[match,match,match]:[];
 try{
  const [rows,count]=await Promise.all([
   ctx.env.DB.prepare('SELECT id,full_name,phone,email,marketing_consent,created_at FROM registrations'+where+' ORDER BY created_at DESC,id DESC LIMIT 20 OFFSET ?').bind(...params,(page-1)*20).all(),
   ctx.env.DB.prepare('SELECT COUNT(*) AS total FROM registrations'+where).bind(...params).first()
  ]);
  return send({ok:true,customers:rows.results||[],total:Number(count?.total)||0,page,pageSize:20});
 }catch(err){console.error('Newsletter customers:',err);return send({ok:false,error:'Không thể đọc khách đăng ký nhận tin từ D1.'},503)}
}
