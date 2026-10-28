import {send,mapProduct,productColumns} from '../../lib/catalog.js';
export async function onRequestGet({env}){
  if(!env.DB)return send({ok:false,error:'Chưa kết nối cơ sở dữ liệu; đang hiển thị sản phẩm mẫu.'},503);
  try{
    const rows=await env.DB.prepare(`SELECT ${productColumns} FROM products WHERE is_deleted=0 AND is_active=1 ORDER BY sort_order ASC,created_at DESC LIMIT 300`).all();
    return send({ok:true,products:rows.results.map(mapProduct)});
  }catch(e){console.error('Public products:',e);return send({ok:false,error:'Không thể tải danh mục. Vui lòng thử lại.'},503);}
}
