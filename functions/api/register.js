const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const clean=(val,max)=>typeof val==='string'?val.trim().replace(/[\u0000-\u001f\u007f]/g,' ').slice(0,max):'';
export async function onRequestPost({request,env}){
  if(env.ENABLE_REGISTRATION !== 'true')return json({ok:false,error:'Website chưa mở đăng ký.'},503);
  if(!env.DB)return json({ok:false,error:'Chưa cấu hình cơ sở dữ liệu D1 (binding DB).'},503);
  if((request.headers.get('content-type')||'').split(';')[0].trim().toLowerCase()!=='application/json')return json({ok:false,error:'Yêu cầu phải dùng JSON.'},415);
  if(Number(request.headers.get('content-length')||0)>10000)return json({ok:false,error:'Dữ liệu quá lớn.'},413);
  let body;try{body=await request.json()}catch{return json({ok:false,error:'JSON không hợp lệ.'},400)}
  const name=clean(body?.name,80),phone=clean(body?.phone,25).replace(/[.\s-]/g,''),email=clean(body?.email,150).toLowerCase();
  if(name.length<2||!/^(?:0\d{9}|\+84\d{9})$/.test(phone)|| (email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))return json({ok:false,error:'Họ tên, số điện thoại hoặc email không hợp lệ.'},400);
  if(body?.marketing_consent!==true)return json({ok:false,error:'Bạn cần đồng ý nhận thông tin trước khi đăng ký.'},400);
  const id=crypto.randomUUID();
  try{
    const result=await env.DB.prepare('INSERT OR IGNORE INTO registrations (id,full_name,phone,email,marketing_consent) VALUES (?,?,?,?,1)').bind(id,name,phone,email||null).run();
    const created=Number(result.meta?.changes||0)>0;
    return json({ok:true,created,registration_id:created?id:null});
  }catch(e){console.error('Registration insert:',e);return json({ok:false,error:'Chưa thể lưu thông tin. Vui lòng thử lại.'},500)}
}
