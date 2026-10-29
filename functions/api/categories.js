import {send,allCategories} from '../../lib/category-store.js';
import {publishedSite} from '../../lib/seo.js';
export async function onRequestGet({env}){
 if(!env.DB)return send({ok:false,error:'D1 chưa kết nối.'},503);
 try{
  const categories=await allCategories(env.DB);
  const site=await publishedSite(env);
  for(const c of categories){
   const legacyIndex={'hoa-lua':1,'hoa-cao-su':2,'hoa-decor':3}[c.slug];
   if(!c.image&&legacyIndex)c.image=site.categories?.[`image${legacyIndex}`]||'';
  }
  return send({ok:true,categories});
 }catch(e){console.error(e);return send({ok:false,error:'Chưa thiết lập bảng danh mục trong D1.'},503)}
}
