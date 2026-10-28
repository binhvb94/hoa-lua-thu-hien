import {requireAdmin} from '../../../../lib/admin-auth.js';
import {siteRow,fullSite,noStore,safeError} from '../../../../lib/site-cms.js';
export async function onRequestGet(ctx){
 const a=await requireAdmin(ctx);if(a.error)return a.error;
 try{const row=await siteRow(ctx.env);return noStore({ok:true,site:fullSite(row,true),hasDraft:row.draft_json!==null,draftRevision:row.draft_rev});}
 catch(err){return safeError(err,'Không thể xem trước nội dung.');}
}
