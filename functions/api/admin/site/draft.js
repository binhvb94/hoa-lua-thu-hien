import {requireAdmin,parseJson,audit} from '../../../../lib/admin-auth.js';
import {siteRow,parseDocument,cleanSection,noStore,safeError} from '../../../../lib/site-cms.js';
export async function onRequestPost(ctx){
 const a=await requireAdmin(ctx,true);if(a.error)return a.error;
 try{
  const req=await parseJson(ctx.request,24000);
  const baseRev=req?.baseRevision;
  if(!Number.isInteger(baseRev)||baseRev<0)return noStore({ok:false,error:'Thiếu phiên bản chỉnh sửa.'},400);
  const values=cleanSection(req.section,req.values),row=await siteRow(ctx.env);
  if(row.draft_rev!==baseRev)return noStore({ok:false,error:'Bản nháp đã được sửa từ phiên khác. Hãy tải lại trước khi lưu.'},409);
  const document= parseDocument(row.draft_json===null?row.published_json:row.draft_json);
  document[req.section]=values;
  const str=JSON.stringify(document);
  if(str.length>60000)return noStore({ok:false,error:'Nội dung website vượt giới hạn cho phép.'},400);
  const result=await ctx.env.DB.prepare("UPDATE site_cms SET draft_json=?,draft_rev=draft_rev+1,updated_at=datetime('now') WHERE id='home' AND draft_rev=?")
    .bind(str,baseRev).run();
  if(!result.meta?.changes)return noStore({ok:false,error:'Nội dung đã bị thay đổi ở phiên khác. Hãy tải lại.'},409);
  await audit(ctx.env,'cms_draft',req.section).catch(err=>console.error('Audit CMS',err));
  return noStore({ok:true,draftRevision:baseRev+1});
 }catch(err){console.error('Save CMS draft',err);return noStore({ok:false,error:err.message||'Không thể lưu bản nháp.'},400)}
}
