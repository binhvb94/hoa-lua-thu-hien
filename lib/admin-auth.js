import { send } from './catalog.js';
const encoder=new TextEncoder();
const cookieName = url => url.protocol==='https:' ? '__Host-hlth_admin' : 'hlth_admin_local';
function hex(bytes) {return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');}
export async function digest(value){return hex(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(value))));}
function randomToken(n=32){const b=crypto.getRandomValues(new Uint8Array(n));return hex(b);}
export async function verifyPassword(raw,stored){
  const m=/^pbkdf2_sha256\$(\d+)\$([a-f0-9]{32})\$([a-f0-9]{64})$/.exec(String(stored||''));
  if(!m||typeof raw!=='string'||raw.length>512)return false;
  const key=await crypto.subtle.importKey('raw',encoder.encode(raw),'PBKDF2',false,['deriveBits']);
  const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt:Uint8Array.from(m[2].match(/.{2}/g),x=>parseInt(x,16)),iterations:Number(m[1]),hash:'SHA-256'},key,256);
  const actual=new Uint8Array(bits),expected=Uint8Array.from(m[3].match(/.{2}/g),x=>parseInt(x,16));
  let mismatch=0;for(let i=0;i<actual.length;i++)mismatch|=actual[i]^expected[i];
  return mismatch===0;
}
export function validOrigin(request){const o=request.headers.get('Origin');return !o || o===new URL(request.url).origin;}
export function cookieFor(request,token,maxAge){const url=new URL(request.url);return `${cookieName(url)}=${token}; Path=/; HttpOnly; SameSite=Strict; ${url.protocol==='https:'?'Secure; ':''}Max-Age=${maxAge}`;}
export async function createSession(env,request){
  const token=randomToken(),csrf=randomToken(24),hash=await digest(token);
  const expires=new Date(Date.now()+12*60*60*1000).toISOString();
  await env.DB.prepare('INSERT INTO admin_sessions (token_hash,csrf_token,expires_at) VALUES (?,?,?)').bind(hash,csrf,expires).run();
  return {csrf,cookie:cookieFor(request,token,12*60*60)};
}
export async function sessionFromRequest(env,request){
  if(!env.DB)return null;
  const match=(request.headers.get('Cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(cookieName(new URL(request.url))+'='));
  const token=match?.split('=').slice(1).join('=');
  if(!token||!/^[a-f0-9]{64}$/.test(token))return null;
  const hash=await digest(token);
  const row=await env.DB.prepare('SELECT token_hash,csrf_token,expires_at FROM admin_sessions WHERE token_hash=?').bind(hash).first();
  if(!row||Date.parse(row.expires_at)<=Date.now())return null;
  return row;
}
export async function requireAdmin(context,mutating=false){
  if(!context.env.DB)return {error:send({ok:false,error:'Chưa kết nối Cloudflare D1.'},503)};
  const user=await sessionFromRequest(context.env,context.request);
  if(!user)return {error:send({ok:false,error:'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'},401)};
  if(mutating && (!validOrigin(context.request)||context.request.headers.get('X-CSRF-Token')!==user.csrf_token))return {error:send({ok:false,error:'Yêu cầu không hợp lệ. Tải lại trang và thử lại.'},403)};
  return {user};
}
export async function audit(env,action,id){await env.DB.prepare('INSERT INTO admin_audit_logs (id,action,product_id) VALUES (?,?,?)').bind(crypto.randomUUID(),action,id).run();}
export async function parseJson(request,limit=15000){
  if(!(request.headers.get('Content-Type')||'').toLowerCase().startsWith('application/json'))throw new Error('Dữ liệu phải là JSON.');
  if(Number(request.headers.get('Content-Length')||0)>limit)throw new Error('Dữ liệu vượt giới hạn.');
  const text=await request.text();if(text.length>limit)throw new Error('Dữ liệu vượt giới hạn.');
  try{return JSON.parse(text)}catch{throw new Error('JSON không hợp lệ.')}
}
