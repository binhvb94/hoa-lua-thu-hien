import {ORIGIN,publishedSite,productSEO,absoluteImage,htmlEscape,textJSON,shell,responseHTML,safeSlug,isDuplicateHost} from '../../lib/seo.js';
export async function onRequestGet({env,params,request}){
 const slug=params.slug;
 if(!safeSlug(slug))return new Response('Không tìm thấy sản phẩm',{status:404,headers:{'X-Robots-Tag':'noindex'}});
 if(!env.DB)return new Response('Chưa kết nối cơ sở dữ liệu',{status:503});
 try{
  const p=await env.DB.prepare("SELECT id,name,slug,category,price,old_price,detail,material,size,image,seo_title,seo_description,is_sample FROM products WHERE slug=? AND is_active=1 AND is_deleted=0 LIMIT 1").bind(slug).first();
  if(!p)return new Response('Sản phẩm không có hoặc đã ngừng bán',{status:404,headers:{'X-Robots-Tag':'noindex'}});
  const site=await publishedSite(env),seo=productSEO(p),url=`${ORIGIN}/san-pham/${p.slug}/`,image=absoluteImage(p.image);
  const robots=isDuplicateHost(request)||p.is_sample?'noindex, follow':'index, follow';
  const category={'hoa-lua':'Hoa lụa','hoa-cao-su':'Hoa cao su','hoa-decor':'Hoa giả decor'}[p.category]||'Hoa trang trí';
  const price=new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND',maximumFractionDigits:0}).format(p.price);
  const schema={'@context':'https://schema.org','@type':'Product',name:p.name,image:[image],description:p.detail||seo.description,sku:p.id,brand:{'@type':'Brand',name:'Hoa Lụa Thu Hiền'},offers:{'@type':'Offer',url,priceCurrency:'VND',price:p.price,itemCondition:'https://schema.org/NewCondition'}};
  const breadcrumb={'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Trang chủ',item:ORIGIN+'/'},{'@type':'ListItem',position:2,name:category,item:ORIGIN+`/danh-muc/${p.category}/`},{'@type':'ListItem',position:3,name:p.name,item:url}]};
  const body=`<main class="seo-main"><div class="breadcrumbs"><a href="/">Trang chủ</a> / <a href="/danh-muc/${htmlEscape(p.category)}/">${htmlEscape(category)}</a> / ${htmlEscape(p.name)}</div><article class="seo-product"><div class="seo-image"><img src="${htmlEscape(image)}" alt="${htmlEscape(p.name)}" width="850" height="850" fetchpriority="high"></div><div class="seo-details"><span class="overline">${htmlEscape(category)} · ${htmlEscape(p.id)}</span><h1>${htmlEscape(p.name)}</h1><p class="price">${htmlEscape(price)}</p>${p.old_price&&p.old_price>p.price?`<p class="old-price">Giá trước đây: ${htmlEscape(new Intl.NumberFormat('vi-VN').format(p.old_price))} ₫</p>`:''}<p class="desc">${htmlEscape(p.detail||seo.description)}</p><dl><dt>Chất liệu</dt><dd>${htmlEscape(p.material||'Liên hệ cửa hàng')}</dd><dt>Kích thước</dt><dd>${htmlEscape(p.size||'Liên hệ cửa hàng')}</dd><dt>Tình trạng</dt><dd>Vui lòng liên hệ xác nhận tình trạng hàng</dd></dl><a class="seo-cta" href="/#san-pham/${encodeURIComponent(p.slug)}">Xem sản phẩm và thêm vào giỏ hàng →</a><p class="note">Thanh toán COD trên website. Phí giao hàng được xác nhận trước khi gửi.</p></div></article><section class="seo-related"><h2>Khám phá thêm</h2><p><a href="/danh-muc/${htmlEscape(p.category)}/">Xem thêm ${htmlEscape(category)}</a> · <a href="/">Tất cả sản phẩm</a></p></section></main>`;
  return responseHTML(shell({title:seo.title,description:seo.description,url,image,site,robots,schema:[schema,breadcrumb],body,kind:'product'}),200,robots.startsWith('noindex')?{'X-Robots-Tag':'noindex,follow'}:{});
 }catch(e){console.error('SEO product:',e);return new Response('Không thể tải thông tin sản phẩm',{status:503})}
}
