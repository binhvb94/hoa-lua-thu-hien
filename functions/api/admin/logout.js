import {send} from '../../../lib/catalog.js';
import {requireAdmin,cookieFor} from '../../../lib/admin-auth.js';
export async function onRequestPost(ctx){
 const auth=await requireAdmin(ctx,true);if(auth.error)return auth.error;
 await ctx.env.DB.prepare('DELETE FROM admin_sessions WHERE token_hash=?').bind(auth.user.token_hash).run();
 return new Response(JSON.stringify({ok:true}),{headers:{'Content-Type':'application/json','Cache-Control':'no-store','Set-Cookie':cookieFor(ctx.request,'',0)}});
}
