import {clean,send} from './catalog.js';
const slugRegex=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const categoryColumns='slug,name,description,image,seo_title,seo_description,seo_image,is_active,is_deleted,sort_order';
export function categoryInput(data,existing=null){
 const slug=clean(data?.slug??existing?.slug,80).toLowerCase();
 const name=clean(data?.name,90),description=clean(data?.description,800);
 const image=clean(data?.image,900),seoTitle=clean(data?.seoTitle,85),seoDescription=clean(data?.seoDescription,180),seoImage=clean(data?.seoImage,900);
 if(slug.length<2||!slugRegex.test(slug))throw Error('Slug danh mục phải gồm chữ thường, số, dấu gạch ngang và dài ít nhất 2 ký tự.');
 if(name.length<2)throw Error('Tên danh mục phải dài ít nhất 2 ký tự.');
 for(const url of [image,seoImage])if(url&&!/^\/media\/[a-f0-9-]{36}\.(?:png|webp|jpg)$/.test(url)&&!/^https:\/\/[^\s<>"'\\]+$/.test(url))throw Error('Ảnh phải là ảnh R2 hoặc URL HTTPS hợp lệ.');
 return {slug,name,description,image,seoTitle,seoDescription,seoImage,active:data?.active===true||data?.active===1};
}
export const mapCategory=r=>({slug:r.slug,name:r.name,description:r.description||'',image:r.image||'',seoTitle:r.seo_title||'',seoDescription:r.seo_description||'',seoImage:r.seo_image||'',active:!!r.is_active,sortOrder:r.sort_order||0});
export async function allCategories(db,includeHidden=false){
 const result=await db.prepare(`SELECT ${categoryColumns} FROM product_categories WHERE is_deleted=0 ${includeHidden?'':'AND is_active=1'} ORDER BY sort_order,created_at LIMIT 150`).all();
 return result.results.map(mapCategory);
}
export async function productCategorySlugs(db,ids){
 if(ids.length===0)return new Map();
 const results=await db.prepare('SELECT product_id,category_slug FROM product_category_links ORDER BY created_at').all();
 const out=new Map(ids.map(id=>[id,[]]));
 for(const row of results.results)if(out.has(row.product_id))out.get(row.product_id).push(row.category_slug);
 return out;
}
export async function validateCategory(db,key){
 const row=await db.prepare('SELECT slug FROM product_categories WHERE slug=? AND is_deleted=0 AND is_active=1').bind(key).first();
 if(!row)throw new Error('Danh mục đã bị ẩn hoặc không tồn tại.');
}
export {send};
