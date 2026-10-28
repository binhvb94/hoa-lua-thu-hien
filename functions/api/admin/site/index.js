import {requireAdmin} from '../../../../lib/admin-auth.js';
import {siteRow,fullSite,noStore,safeError} from '../../../../lib/site-cms.js';
export async function onRequestGet(ctx){
 const a=await requireAdmin(ctx);if(a.error)return a.error;
 try{const row=await siteRow(ctx.env);return noStore({ok:true,draft:fullSite(row,true),published:fullSite(row,false),hasDraft:row.draft_json!==null,draftRevision:row.draft_rev,publishedRevision:row.live_rev,updatedAt:row.updated_at,publishedAt:row.published_at});}
 catch(err){return safeError(err,'Không thể tải cấu hình website.');}
}
