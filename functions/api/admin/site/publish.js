import {requireAdmin,parseJson,audit} from '../../../../lib/admin-auth.js';
import {siteRow,noStore} from '../../../../lib/site-cms.js';
export async function onRequestPost(ctx){
 const a=await requireAdmin(ctx,true);if(a.error)return a.error;
 try{
  const req=await parseJson(ctx.request,1000),row=await siteRow(ctx.env);
  if(!Number.isInteger(req?.baseRevision)||row.draft_rev!==req.baseRevision)return noStore({ok:false,error:'Bản nháp đã thay đổi. Hãy tải lại trước khi xuất bản.'},409);
  if(row.draft_json===null)return noStore({ok:false,error:'Chưa có bản nháp để xuất bản.'},409);
  const current=JSON.parse(row.draft_json);
  if(!current || typeof current!=='object'||Array.isArray(current))return noStore({ok:false,error:'Bản nháp lỗi, không thể xuất bản.'},400);
  const historyId=crypto.randomUUID();
  // D1 batch thực thi các câu lệnh trong một giao dịch: lưu lịch sử + xuất bản một cách nguyên tử.
  const results=await ctx.env.DB.batch([
    ctx.env.DB.prepare("INSERT INTO site_publication_history (id,old_json,new_json) SELECT ?,published_json,draft_json FROM site_cms WHERE id='home' AND draft_rev=? AND draft_json IS NOT NULL").bind(historyId,req.baseRevision),
    ctx.env.DB.prepare("UPDATE site_cms SET published_json=draft_json,draft_json=NULL,live_rev=live_rev+1,draft_rev=draft_rev+1,published_at=datetime('now'),updated_at=NULL WHERE id='home' AND draft_rev=? AND draft_json IS NOT NULL").bind(req.baseRevision)
  ]);
  if(!results?.[1]?.meta?.changes)return noStore({ok:false,error:'Xuất bản không thành công. Vui lòng tải lại.'},409);
  await audit(ctx.env,'cms_publish',historyId).catch(err=>console.error('Audit publish',err));
  return noStore({ok:true,publishedRevision:row.live_rev+1});
 }catch(err){console.error('Publish CMS',err);return noStore({ok:false,error:'Không thể xuất bản. Kiểm tra migration 0003 và thử lại.'},500)}
}
