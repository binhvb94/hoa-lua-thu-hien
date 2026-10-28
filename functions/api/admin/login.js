import {send} from '../../../lib/catalog.js';
import {validOrigin,verifyPassword,createSession,parseJson,digest} from '../../../lib/admin-auth.js';
export async function onRequestPost({request,env}){
  if(!validOrigin(request))return send({ok:false,error:'Nguồn truy cập không hợp lệ.'},403);
  if(!env.DB||!env.ADMIN_PASSWORD_HASH)return send({ok:false,error:'ADMIN chưa cấu hình D1 hoặc mật khẩu bảo mật.'},503);
  const ip=(request.headers.get('CF-Connecting-IP')||'unknown').slice(0,60);
  const key=await digest(ip);const cutoff=new Date(Date.now()-15*60*1000).toISOString();
  try{
    const state=await env.DB.prepare('SELECT failures,first_attempt FROM admin_login_attempts WHERE ip_hash=?').bind(key).first();
    if(state && state.first_attempt>=cutoff && state.failures>=5)return send({ok:false,error:'Đã vượt quá số lần thử. Vui lòng thử lại sau 15 phút.'},429);
    const body=await parseJson(request,2000);
    const pass=typeof body?.password==='string'?body.password:'';
    if(!await verifyPassword(pass,env.ADMIN_PASSWORD_HASH)){
      if(state&&state.first_attempt>=cutoff){await env.DB.prepare('UPDATE admin_login_attempts SET failures=failures+1 WHERE ip_hash=?').bind(key).run();}
      else await env.DB.prepare('INSERT INTO admin_login_attempts (ip_hash,failures,first_attempt) VALUES (?,1,?) ON CONFLICT(ip_hash) DO UPDATE SET failures=1,first_attempt=excluded.first_attempt').bind(key,new Date().toISOString()).run();
      return send({ok:false,error:'Mật khẩu không đúng.'},401);
    }
    await env.DB.prepare('DELETE FROM admin_login_attempts WHERE ip_hash=?').bind(key).run();
    const login=await createSession(env,request);
    return new Response(JSON.stringify({ok:true,csrf:login.csrf}),{headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Set-Cookie':login.cookie}});
  }catch(e){console.error('ADMIN login failure',e);return send({ok:false,error:e instanceof SyntaxError?'Dữ liệu không hợp lệ.':'Đăng nhập không thành công. Kiểm tra cấu hình cơ sở dữ liệu.'},400)}
}
