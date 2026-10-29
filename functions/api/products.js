import {send,mapProduct,productColumns} from '../../lib/catalog.js';
import {productTrustMap,applyTrust} from '../../lib/product-trust.js';
export async function onRequestGet({env}){
  if(!env.DB)return send({ok:false,error:'Chưa kết nối cơ sở dữ liệu; đang hiển thị sản phẩm mẫu.'},503);
  try{
    const rows=await env.DB.prepare(`SELECT ${productColumns} FROM products WHERE is_deleted=0 AND is_active=1 ORDER BY sort_order ASC,created_at DESC LIMIT 300`).all();
    const links=(await env.DB.prepare('SELECT product_id,category_slug FROM product_category_links INNER JOIN product_categories c ON category_slug=c.slug WHERE c.is_active=1 AND c.is_deleted=0').all()).results;const map=new Map();for(const x of links){if(!map.has(x.product_id))map.set(x.product_id,[]);map.get(x.product_id).push(x.category_slug)}const trust=await productTrustMap(env.DB);return send({ok:true,products:rows.results.map(p=>applyTrust({...mapProduct(p),categorySlugs:map.get(p.id)||[p.category]},trust))});
  }catch(e){console.error('Public products:',e);return send({ok:false,error:'Không thể tải danh mục. Vui lòng thử lại.'},503);}
}
