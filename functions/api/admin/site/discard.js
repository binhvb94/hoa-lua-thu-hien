import {requireAdmin,parseJson,audit} from '../../../../lib/admin-auth.js';
import {siteRow,noStore} from '../../../../lib/site-cms.js';
export async function onRequestPost(ctx){
 const a=await requireAdmin(ctx,true);if(a.error)return a.error;
 try{
  const req=await parseJson(ctx.request,1000),row=await siteRow(ctx.env);
  if(!Number.isInteger(req?.baseRevision)||row.draft_rev!==req.baseRevision)return noStore({ok:false,error:'Bản nháp đã đổi. Hãy tải lại.'},409);
  const r=await ctx.env.DB.prepare("UPDATE site_cms SET draft_json=NULL,draft_rev=draft_rev+1,updated_at=NULL WHERE id='home' AND draft_rev=?").bind(req.baseRevision).run();
  if(!r.meta?.changes)return noStore({ok:false,error:'Hãy tải lại bản mới nhất.'},409);
  await audit(ctx.env,'cms_discard','home').catch(err=>console.error('Audit discard',err));
  return noStore({ok:true});
 }catch(err){console.error('Discard CMS',err);return noStore({ok:false,error:'Không thể bỏ bản nháp.'},500)}
}
