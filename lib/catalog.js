import {normalizeVariants,parseVariantConfig} from './variants.js';
export const categories = new Set(['hoa-lua','hoa-cao-su','hoa-decor']);
export const tones = new Set(['rose','cream','lilac']);
export const clean = (v,n) => typeof v === 'string' ? v.trim().replace(/[\u0000-\u001f\u007f]/g,' ').slice(0,n) : '';
export const send = (body,status=200) => Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export function normalizeProduct(payload,existing=null,allowedCategories=categories){
  const id=clean(payload?.id||existing?.id,24).toUpperCase();
  const name=clean(payload?.name,150);
  const slug=clean(payload?.slug,180).toLowerCase();
  const category=clean(payload?.category,40);
  const detail=clean(payload?.detail,1500);
  const seoTitle=clean(payload?.seoTitle,80);
  const seoDescription=clean(payload?.seoDescription,180);
  const material=clean(payload?.material,150);
  const size=clean(payload?.size,150);
  const image=clean(payload?.image,900);
  const galleryImages=normalizeGallery(payload?.galleryImages,image);
  const variantConfig=normalizeVariants(payload?.variantConfig);
  const badge=clean(payload?.badge,60);
  const tone=clean(payload?.tone,20)||'rose';
  const price=Number(payload?.price),oldPrice=payload?.oldPrice==null||payload?.oldPrice===''?null:Number(payload?.oldPrice);
  const active=payload?.active===true||payload?.active===1;
  const recommendationMode=clean(payload?.recommendationMode||'mixed',20);
  // Dữ liệu hiển thị chủ động nhập trong ADMIN; độc lập với doanh số COD ghi nhận trong D1.
  const displaySoldCount=payload?.displaySoldCount==null||payload.displaySoldCount===''?0:Number(payload.displaySoldCount);
  if(!Number.isSafeInteger(displaySoldCount)||displaySoldCount<0||displaySoldCount>999999999)throw new Error('Lượt bán hiển thị phải là số nguyên từ 0 đến 999.999.999.');
  const externalRatingCounts={};
  for(let rating=1;rating<=5;rating++){
    const v=payload?.externalRatingCounts?.[rating]??0;
    const count=v===''?0:Number(v);
    if(!Number.isSafeInteger(count)||count<0||count>1000000)throw new Error('Mỗi mức đánh giá phải là số nguyên từ 0 đến 1.000.000.');
    externalRatingCounts[rating]=count;
  }
  const externalRatingSource=clean(payload?.externalRatingSource,120);
  if(!['mixed','best_selling','top_rated','similar'].includes(recommendationMode))throw new Error('Chế độ đề xuất không hợp lệ.');
  if(!/^[A-Z0-9_-]{2,24}$/.test(id))throw new Error('Mã sản phẩm: 2–24 ký tự A-Z, 0-9, gạch nối hoặc gạch dưới.');
  if(name.length<3||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))throw new Error('Tên sản phẩm hoặc đường dẫn không hợp lệ.');
  if(!allowedCategories.has(category))throw new Error('Danh mục sản phẩm không hợp lệ.');
  if(!Number.isSafeInteger(price)||price<1000||price>100000000)throw new Error('Giá bán phải là số nguyên từ 1.000 đến 100.000.000đ.');
  if(oldPrice!==null&&(!Number.isSafeInteger(oldPrice)||oldPrice<price||oldPrice>100000000))throw new Error('Giá gốc phải lớn hơn hoặc bằng giá bán.');
  if(!validImage(image)) throw new Error('Ảnh phải là tệp đã tải lên hoặc đường dẫn HTTPS hợp lệ.');
  if(!tones.has(tone))throw new Error('Tông màu không hợp lệ.');
  return {id,name,slug,category,price,oldPrice,badge,detail,material,size,image,galleryImages,variantConfig,tone,active,seoTitle,seoDescription,recommendationMode,displaySoldCount,externalRatingCounts,externalRatingSource};
}
export const MAX_PRODUCT_IMAGES=12;
export const validImage=image=>typeof image==='string'&&(
 /^\/media\/[a-f0-9-]{36}\.(jpg|png|webp)$/.test(image)||/^https:\/\/[^\s<>"']{4,880}$/i.test(image)
);
export function normalizeGallery(images,primary){
 if(images==null)return [];
 if(!Array.isArray(images)||images.length>MAX_PRODUCT_IMAGES-1)throw new Error('Tối đa 12 ảnh mỗi sản phẩm (1 ảnh bìa và 11 ảnh phụ).');
 const seen=new Set([primary]);
 return images.map(img=>{
   if(typeof img!=='string'||!validImage(img.trim()))throw new Error('Ảnh phụ phải là đường dẫn HTTPS hoặc ảnh tải lên Cloudflare R2.');
   const u=img.trim();if(seen.has(u))throw new Error('Danh sách ảnh không được trùng nhau.');seen.add(u);return u;
 });
}
export function parseGallery(value){
 try{const parsed=JSON.parse(value||'[]');return Array.isArray(parsed)?parsed.filter(validImage).slice(0,MAX_PRODUCT_IMAGES-1):[];}catch{return []}
}
export function productImages(row){
 const main=row.image||'';const extras=Array.isArray(row.galleryImages)?row.galleryImages:parseGallery(row.gallery_images);
 return [...new Set([main,...extras].filter(validImage))].slice(0,MAX_PRODUCT_IMAGES);
}
export const mapProduct = r => ({id:r.id,slug:r.slug,name:r.name,category:r.category,price:r.price,oldPrice:r.old_price,badge:r.badge,detail:r.detail,material:r.material,size:r.size,image:r.image,galleryImages:parseGallery(r.gallery_images),images:productImages(r),variantConfig:parseVariantConfig(r.variant_config),tone:r.tone,active:!!r.is_active,sample:!!r.is_sample,sortOrder:r.sort_order,seoTitle:r.seo_title||'',seoDescription:r.seo_description||'',recommendationMode:r.recommendation_mode||'mixed',displaySoldCount:Math.max(0,Number(r.display_sold_count)||0),externalRatingCounts:Object.fromEntries([1,2,3,4,5].map(i=>[i,Math.max(0,Number(r['external_rating_'+i])||0)])),externalRatingSource:r.external_rating_source||''});
export const productColumns = 'id,slug,name,category,price,old_price,badge,detail,material,size,image,gallery_images,variant_config,tone,is_active,is_sample,sort_order,seo_title,seo_description,recommendation_mode,display_sold_count,external_rating_1,external_rating_2,external_rating_3,external_rating_4,external_rating_5,external_rating_source';
