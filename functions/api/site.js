import {noStore,siteRow,fullSite,safeError} from '../../lib/site-cms.js';
export async function onRequestGet({env}){
 try{const row=await siteRow(env);return noStore({ok:true,site:fullSite(row,false),revision:row.live_rev,publishedAt:row.published_at});}
 catch(err){return safeError(err,'Không thể tải nội dung website.');}
}
