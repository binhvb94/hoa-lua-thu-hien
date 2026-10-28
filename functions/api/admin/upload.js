import {send} from '../../../lib/catalog.js';
import {requireAdmin,audit} from '../../../lib/admin-auth.js';
export async function onRequestPost(ctx){
 const a=await requireAdmin(ctx,true);if(a.error)return a.error;
 if(!ctx.env.PRODUCT_IMAGES)return send({ok:false,error:'Chưa kết nối Cloudflare R2 (binding PRODUCT_IMAGES).'},503);
 const req=ctx.request;
 if(!req.headers.get('Content-Type')?.toLowerCase().startsWith('multipart/form-data'))return send({ok:false,error:'Cần tải lên một tệp ảnh.'},415);
 if(Number(req.headers.get('Content-Length')||0)>6*1024*1024)return send({ok:false,error:'Ảnh tối đa 5 MB.'},413);
 try{
   const data=await req.formData(),file=data.get('image');
   if(!(file instanceof File)||file.size===0||file.size>5*1024*1024)return send({ok:false,error:'Chọn tệp ảnh nhỏ hơn 5MB.'},400);
   const buf=await file.arrayBuffer(),bytes=new Uint8Array(buf);
   let ext='',type='';
   if(bytes.length>4 && bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff){ext='jpg';type='image/jpeg'}
   else if(bytes.length>8 && [137,80,78,71,13,10,26,10].every((b,i)=>bytes[i]===b)){ext='png';type='image/png'}
   else if(bytes.length>12 && String.fromCharCode(...bytes.slice(0,4))==='RIFF' && String.fromCharCode(...bytes.slice(8,12))==='WEBP'){ext='webp';type='image/webp'}
   if(!ext)return send({ok:false,error:'Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP hợp lệ.'},400);
   const key=`${crypto.randomUUID()}.${ext}`;
   await ctx.env.PRODUCT_IMAGES.put(key,buf,{httpMetadata:{contentType:type},customMetadata:{uploadedBy:'admin'}});
   await audit(ctx.env,'upload',key);
   return send({ok:true,url:`/media/${key}`});
 }catch(e){console.error('ADMIN image upload',e);return send({ok:false,error:'Không thể tải ảnh lên R2.'},500)}
}
