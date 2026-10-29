import {send,categoryInput,categoryColumns,mapCategory,allCategories,productCategorySlugs} from '../../../../lib/category-store.js';
import {requireAdmin,parseJson,audit} from '../../../../lib/admin-auth.js';
export async function onRequestGet(ctx){
 const a=await requireAdmin(ctx);if(a.error)return a.error;
 try{
  const categories=await allCategories(ctx.env.DB,true);
  const r=await ctx.env.DB.prepare('SELECT product_id,category_slug FROM product_category_links').all();
  const assignments={};for(const c of categories)assignments[c.slug]=[];
  for(const x of r.results)if(assignments[x.category_slug])assignments[x.category_slug].push(x.product_id);
  return send({ok:true,categories,assignments});
 }catch(e){console.error(e);return send({ok:false,error:'Chưa chạy migration 0006_categories.sql trên D1.'},503)}
}
export async function onRequestPost(ctx){
 const a=await requireAdmin(ctx,true);if(a.error)return a.error;
 try{
  const c=categoryInput(await parseJson(ctx.request));
  const count=await ctx.env.DB.prepare('SELECT COUNT(*) n FROM product_categories WHERE is_deleted=0').first();
  if(count.n>=100)return send({ok:false,error:'Tối đa 100 danh mục.'},400);
  const deleted=await ctx.env.DB.prepare('SELECT slug FROM product_categories WHERE slug=? AND is_deleted=1').bind(c.slug).first();
  if(deleted){await ctx.env.DB.prepare("UPDATE product_categories SET name=?,description=?,image=?,seo_title=?,seo_description=?,seo_image=?,is_active=?,is_deleted=0,updated_at=datetime('now') WHERE slug=?").bind(c.name,c.description,c.image,c.seoTitle,c.seoDescription,c.seoImage,c.active?1:0,c.slug).run();await audit(ctx.env,'category-restore',c.slug);return send({ok:true,category:c},201)}
  await ctx.env.DB.prepare("INSERT INTO product_categories(slug,name,description,image,seo_title,seo_description,seo_image,is_active,sort_order) VALUES (?,?,?,?,?,?,?,?,(SELECT COALESCE(MAX(sort_order),0)+1 FROM product_categories))")
  .bind(c.slug,c.name,c.description,c.image,c.seoTitle,c.seoDescription,c.seoImage,c.active?1:0).run();
  await audit(ctx.env,'category-create',c.slug);return send({ok:true,category:c},201);
 }catch(e){if(/UNIQUE constraint/i.test(String(e)))return send({ok:false,error:'Slug danh mục đã tồn tại; chọn slug khác.'},409);return send({ok:false,error:e.message||'Không thể tạo danh mục.'},400)}
}
