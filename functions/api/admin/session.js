import {send} from '../../../lib/catalog.js';
import {sessionFromRequest} from '../../../lib/admin-auth.js';
export async function onRequestGet({request,env}){
 if(!env.DB||!env.ADMIN_PASSWORD_HASH)return send({ok:false,configured:false,authenticated:false});
 const user=await sessionFromRequest(env,request);
 return send({ok:true,configured:true,authenticated:!!user,csrf:user?.csrf_token||null});
}
