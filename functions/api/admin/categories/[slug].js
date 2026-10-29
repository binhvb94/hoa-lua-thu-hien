import {send,categoryInput} from '../../../../lib/category-store.js';
import {requireAdmin,parseJson,audit} from '../../../../lib/admin-auth.js';
export async function onRequestPatch(ctx){
 const auth=await requireAdmin(ctx,true);if(auth.error)return auth.error;
 const slug=ctx.params.slug;
 try{
  const exists=await ctx.env.DB.prepare('SELECT slug FROM product_categories WHERE slug=? AND is_deleted=0').bind(slug).first();
  if(!exists)return send({ok:false,error:'Danh mục không tồn tại.'},404);
  const data=await parseJson(ctx.request),c=categoryInput(data,exists);
  if(c.slug!==slug)return send({ok:false,error:'Không thể đổi slug danh mục đang tồn tại để tránh hỏng link SEO.'},400);
  await ctx.env.DB.prepare("UPDATE product_categories SET name=?,description=?,image=?,seo_title=?,seo_description=?,seo_image=?,is_active=?,updated_at=datetime('now') WHERE slug=? AND is_deleted=0")
   .bind(c.name,c.description,c.image,c.seoTitle,c.seoDescription,c.seoImage,c.active?1:0,slug).run();
  await audit(ctx.env,'category-update',slug);return send({ok:true,category:c});
 }catch(e){return send({ok:false,error:e.message||'Không thể lưu danh mục.'},400)}
}
// Membership is independent of product deletion. Do not allow products to lose their only category.
export async function onRequestPut(ctx){
 const auth=await requireAdmin(ctx,true);if(auth.error)return auth.error;
 const slug=ctx.params.slug;
 try{
  const category=await ctx.env.DB.prepare('SELECT slug FROM product_categories WHERE slug=? AND is_deleted=0').bind(slug).first();
  if(!category)return send({ok:false,error:'Danh mục không tồn tại.'},404);
  const payload=await parseJson(ctx.request),ids=payload?.productIds;
  if(!Array.isArray(ids)||ids.length>500||ids.some(x=>typeof x!=='string'||!/^[A-Z0-9_-]{2,24}$/.test(x))||new Set(ids).size!==ids.length)return send({ok:false,error:'Danh sách sản phẩm không hợp lệ.'},400);
  const all=await ctx.env.DB.prepare('SELECT id,category FROM products WHERE is_deleted=0').all();
  const available=new Set(all.results.map(x=>x.id));if(ids.some(id=>!available.has(id)))return send({ok:false,error:'Một sản phẩm không còn tồn tại.'},409);
  const linked=await ctx.env.DB.prepare('SELECT product_id,category_slug FROM product_category_links').all();
  const memberships=new Map(all.results.map(p=>[p.id,new Set()]));
  for(const row of linked.results)memberships.get(row.product_id)?.add(row.category_slug);
  const wanted=new Set(ids),queries=[];
  for(const product of all.results){
   const current=memberships.get(product.id);const has=current.has(slug),need=wanted.has(product.id);
   if(has&&!need){current.delete(slug);if(current.size===0)return send({ok:false,error:`Sản phẩm ${product.id} chỉ thuộc danh mục này. Hãy gán sản phẩm sang một danh mục khác trước khi bỏ. `},400);
    queries.push(ctx.env.DB.prepare('DELETE FROM product_category_links WHERE product_id=? AND category_slug=?').bind(product.id,slug));
    if(product.category===slug)queries.push(ctx.env.DB.prepare('UPDATE products SET category=?,updated_at=datetime(\'now\') WHERE id=?').bind([...current][0],product.id));
   }
   if(!has&&need){queries.push(ctx.env.DB.prepare('INSERT OR IGNORE INTO product_category_links(product_id,category_slug) VALUES(?,?)').bind(product.id,slug));}
  }
  if(queries.length)await ctx.env.DB.batch(queries);
  await audit(ctx.env,'category-members',slug);return send({ok:true,assigned:ids.length});
 }catch(e){console.error(e);return send({ok:false,error:e.message||'Không thể lưu sản phẩm trong danh mục.'},400)}
}
export async function onRequestDelete(ctx){
 const auth=await requireAdmin(ctx,true);if(auth.error)return auth.error;
 const slug=ctx.params.slug;
 try{
  const used=await ctx.env.DB.prepare('SELECT COUNT(*) n FROM products WHERE category=? AND is_deleted=0').bind(slug).first();
  if(used.n>0)return send({ok:false,error:`Danh mục đang là danh mục chính của ${used.n} sản phẩm. Hãy chuyển sản phẩm sang danh mục khác trước khi xóa.`},409);
  const rows=await ctx.env.DB.prepare('SELECT product_id FROM product_category_links WHERE category_slug=?').bind(slug).all();
  for(const row of rows.results){const n=await ctx.env.DB.prepare('SELECT COUNT(*) n FROM product_category_links WHERE product_id=?').bind(row.product_id).first();if(n.n<=1)return send({ok:false,error:'Có sản phẩm chỉ thuộc danh mục này; hãy chuyển sang danh mục khác trước.'},409)}
  await ctx.env.DB.batch([ctx.env.DB.prepare('DELETE FROM product_category_links WHERE category_slug=?').bind(slug),ctx.env.DB.prepare("UPDATE product_categories SET is_deleted=1,is_active=0,updated_at=datetime('now') WHERE slug=? AND is_deleted=0").bind(slug)]);
  await audit(ctx.env,'category-delete',slug);return send({ok:true});
 }catch(e){console.error(e);return send({ok:false,error:'Không thể xóa danh mục.'},500)}
}
