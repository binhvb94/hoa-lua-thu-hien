import {SECTIONS,mergedSite} from '../data/site-schema.js';
import {send} from './catalog.js';
export function noStore(value,status=200){
 return new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store, max-age=0','X-Content-Type-Options':'nosniff'}});
}
export function parseDocument(raw){
 try{const v=JSON.parse(raw||'{}');return v&&typeof v==='object'&&!Array.isArray(v)?v:{}}catch{return {}};
}
export async function siteRow(env){
 if(!env.DB)throw new Error('Chưa kết nối D1.');
 const row=await env.DB.prepare("SELECT published_json,draft_json,draft_rev,live_rev,published_at,updated_at FROM site_cms WHERE id='home'").first();
 if(!row)throw new Error('Chưa chạy migration 0003_site_cms.sql.');
 return row;
}
function validImage(str){return str.startsWith('/media/')? /^\/media\/[A-Za-z0-9._-]{5,180}$/.test(str): /^https:\/\/[^\s/#?]+(?:[^\s]*)$/i.test(str) && !/[<>"'\\]/.test(str);}
export function cleanSection(section,values){
 const fields=SECTIONS[section]?.fields;
 if(!fields || !values || typeof values!=='object'||Array.isArray(values))throw new Error('Nhóm nội dung không hợp lệ.');
 if(Object.keys(values).some(k=>!Object.prototype.hasOwnProperty.call(fields,k)))throw new Error('Có trường dữ liệu không được phép.');
 const out={};
 for(const [key,meta] of Object.entries(fields)){
   if(typeof values[key]!=='string')throw new Error('Thiếu nội dung trường: '+meta.label);
   const str=values[key].trim();
   if(str.length>(meta.max||1000))throw new Error('Nội dung quá dài: '+meta.label);
   if(meta.kind==='number' && (!/^\d{2,3}$/.test(str) || Number(str)<meta.minValue || Number(str)>meta.maxValue))throw new Error('Cỡ chữ phải từ '+meta.minValue+' đến '+meta.maxValue+'px: '+meta.label);
   if(meta.kind==='select'&&!['yes','no'].includes(str))throw new Error('Trạng thái hiển thị không hợp lệ.');
   if(meta.kind==='color'&&!/^#[0-9a-fA-F]{6}$/.test(str))throw new Error('Màu sắc không hợp lệ.');
   if(meta.kind==='image' && !str)throw new Error('Hãy chọn ảnh cho: '+meta.label);
   if(meta.kind==='image' && str && !validImage(str))throw new Error('Ảnh cần là URL HTTPS hoặc /media/ hợp lệ: '+meta.label);
   if(section==='seo'&&meta.kind==='seo-image'&&str&&!(key==='favicon'&&str==='/assets/logo.svg')&&!validImage(str))throw new Error('Ảnh SEO phải là URL HTTPS hoặc ảnh /media/ hợp lệ.');
   if(meta.kind==='url' && str && (!/^https:\/\/[^\s/]+(?:\/[^\s]*)?$/i.test(str)||/[<>"'\\]/.test(str)))throw new Error('Đường dẫn phải bắt đầu bằng https://');
   if(meta.kind==='phone' && str && !/^0\d{9}$/.test(str))throw new Error('Số Zalo phải có 10 chữ số, bắt đầu bằng 0.');
   if(meta.kind==='pixel-ids'){
     const ids=str.split(/[\r\n]+/).map(v=>v.trim()).filter(Boolean);
     if(ids.length>5)throw new Error('Tối đa 5 Meta Pixel ID.');
     if(ids.some(id=>!/^\d{8,20}$/.test(id)))throw new Error('Mỗi Meta Pixel ID phải là dãy 8–20 chữ số, mỗi dòng một ID. Không dán mã script.');
     if(new Set(ids).size!==ids.length)throw new Error('Có Pixel ID bị trùng.');
     out[key]=ids.join('\n');continue;
   }
   out[key]=str;
 }
 return out;
}
export function safeError(err,defaultMessage){
 console.error('Site CMS error',err);
 return noStore({ok:false,error:err.message?.includes('migration')||err.message?.includes('D1')?err.message:defaultMessage},503);
}
export function fullSite(row,draft){
 return mergedSite(parseDocument(draft && row.draft_json?row.draft_json:row.published_json));
}
