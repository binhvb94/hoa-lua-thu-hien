import {requireAdmin} from '../../../../lib/admin-auth.js';
import {send} from '../../../../lib/catalog.js';

const allowed = new Set(['new','shipping','delivered','cancelled']);
const escapeLike = s => s.replace(/[\\%_]/g,'\\$&');
export async function onRequestGet(ctx){
 const auth=await requireAdmin(ctx);if(auth.error)return auth.error;
 const url=new URL(ctx.request.url);
 const status=url.searchParams.get('status')||'all';
 if(status!=='all'&&!allowed.has(status))return send({ok:false,error:'Trạng thái đơn hàng không hợp lệ.'},400);
 const q=(url.searchParams.get('q')||'').trim().slice(0,100);
 const pageText=url.searchParams.get('page')||'1',page=Number(pageText);
 if(!Number.isSafeInteger(page)||page<1||page>500)return send({ok:false,error:'Trang không hợp lệ.'},400);
 const filters=[],params=[];
 if(status!=='all'){filters.push('status=?');params.push(status);}
 if(q){filters.push("(order_code LIKE ? ESCAPE '\\' OR customer_name LIKE ? ESCAPE '\\' OR phone LIKE ? ESCAPE '\\')");const match='%'+escapeLike(q)+'%';params.push(match,match,match);}
 const where=filters.length?' WHERE '+filters.join(' AND '):'';
 try{
  const [rows,count,summary]=await Promise.all([
   ctx.env.DB.prepare('SELECT id,order_code,customer_name,phone,total,status,created_at FROM orders'+where+' ORDER BY created_at DESC,id DESC LIMIT 20 OFFSET ?').bind(...params,(page-1)*20).all(),
   ctx.env.DB.prepare('SELECT COUNT(*) AS total FROM orders'+where).bind(...params).first(),
   ctx.env.DB.prepare('SELECT status,COUNT(*) AS n FROM orders GROUP BY status').all()
  ]);
  const counts={new:0,shipping:0,delivered:0,cancelled:0};
  for(const entry of summary.results||[])if(Object.hasOwn(counts,entry.status))counts[entry.status]=Number(entry.n)||0;
  return send({ok:true,orders:rows.results||[],total:Number(count?.total)||0,counts,page,pageSize:20});
 }catch(err){console.error('Orders listing:',err);return send({ok:false,error:'Chưa đọc được đơn hàng từ D1. Kiểm tra migration 0001.'},503)}
}
