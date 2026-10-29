import {send,normalizeProduct,mapProduct,productColumns} from '../../../lib/catalog.js';
import {requireAdmin,parseJson,audit} from '../../../lib/admin-auth.js';
export async function onRequestGet(ctx){
 const a=await requireAdmin(ctx);if(a.error)return a.error;
 try{const rows=await ctx.env.DB.prepare(`SELECT ${productColumns} FROM products WHERE is_deleted=0 ORDER BY sort_order,created_at DESC LIMIT 500`).all();const links=(await ctx.env.DB.prepare('SELECT product_id,category_slug FROM product_category_links').all()).results;const m=new Map();for(const x of links){if(!m.has(x.product_id))m.set(x.product_id,[]);m.get(x.product_id).push(x.category_slug)}return send({ok:true,products:rows.results.map(p=>({...mapProduct(p),categorySlugs:m.get(p.id)||[p.category]}))});}
 catch(e){console.error(e);return send({ok:false,error:'Chưa tạo bảng sản phẩm trong D1.'},503)}
}
export async function onRequestPost(ctx){
 const a=await requireAdmin(ctx,true);if(a.error)return a.error;
 try{
   const payload=await parseJson(ctx.request);const p=normalizeProduct(payload,null,new Set((await ctx.env.DB.prepare('SELECT slug FROM product_categories WHERE is_deleted=0 AND is_active=1').all()).results.map(c=>c.slug))); 
   const max=await ctx.env.DB.prepare('SELECT COUNT(*) AS n FROM products WHERE is_deleted=0').first();
   if(Number(max.n)>=500)return send({ok:false,error:'Đạt giới hạn 500 sản phẩm của phiên bản này.'},400);
   await ctx.env.DB.prepare('INSERT INTO products (id,slug,name,category,price,old_price,badge,detail,material,size,image,tone,is_active,is_sample,sort_order,seo_title,seo_description) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,0,(SELECT COALESCE(MAX(sort_order),0)+1 FROM products),?,?)')
   .bind(p.id,p.slug,p.name,p.category,p.price,p.oldPrice,p.badge,p.detail,p.material,p.size,p.image,p.tone,p.active?1:0,p.seoTitle,p.seoDescription).run();
   await ctx.env.DB.prepare('INSERT OR IGNORE INTO product_category_links(product_id,category_slug) VALUES (?,?)').bind(p.id,p.category).run();
   await audit(ctx.env,'create',p.id);
   return send({ok:true,product:p},201);
 }catch(e){if(/UNIQUE constraint/.test(String(e)))return send({ok:false,error:'Mã hoặc đường dẫn sản phẩm đã tồn tại.'},409);return send({ok:false,error:e.message||'Không thể thêm sản phẩm.'},400)}
}
