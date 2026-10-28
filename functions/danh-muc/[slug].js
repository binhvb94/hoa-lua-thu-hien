import {ORIGIN,publishedSite,absoluteImage,htmlEscape,shell,responseHTML,NAMES,isDuplicateHost} from '../../lib/seo.js';
export async function onRequestGet({env,params,request}){
 const key=params.slug;
 if(!Object.hasOwn(NAMES,key))return new Response('Không tìm thấy danh mục',{status:404,headers:{'X-Robots-Tag':'noindex'}});
 if(!env.DB)return new Response('Chưa kết nối cơ sở dữ liệu',{status:503});
 try{
 const rs=await env.DB.prepare('SELECT name,slug,image,price,detail,is_sample FROM products WHERE category=? AND is_active=1 AND is_deleted=0 ORDER BY sort_order ASC LIMIT 300').bind(key).all();
 const site=await publishedSite(env),category=NAMES[key],url=`${ORIGIN}/danh-muc/${key}/`,title=`${category} đẹp | Hoa Lụa Thu Hiền`,description=`Khám phá những mẫu ${category.toLowerCase()} trang trí nhà cửa tại Hoa Lụa Thu Hiền. Xem hình ảnh, giá bán, chi tiết từng sản phẩm và đặt hàng trực tuyến.`;
 const allSamples=rs.results.every(p=>p.is_sample),robots=isDuplicateHost(request)||allSamples?'noindex,follow':'index,follow';
 const cards=rs.results.map(p=>`<article class="seo-card"><a href="/san-pham/${encodeURIComponent(p.slug)}/"><img src="${htmlEscape(absoluteImage(p.image))}" alt="${htmlEscape(p.name)}" loading="lazy" width="500" height="500"><h2>${htmlEscape(p.name)}</h2></a><p>${htmlEscape((p.detail||'').slice(0,130))}</p><strong>${htmlEscape(new Intl.NumberFormat('vi-VN').format(p.price))} ₫</strong></article>`).join('');
 const body=`<main class="seo-main"><div class="breadcrumbs"><a href="/">Trang chủ</a> / ${htmlEscape(category)}</div><header class="seo-category-head"><span class="overline">BỘ SƯU TẬP THU HIỀN</span><h1>${htmlEscape(category)}</h1><p>${htmlEscape(description)}</p></header><section class="seo-cards">${cards||'<p>Chưa có sản phẩm đang hiển thị. Vui lòng quay lại sau.</p>'}</section></main>`;
 const breadcrumb={'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Trang chủ',item:ORIGIN+'/'},{'@type':'ListItem',position:2,name:category,item:url}]};
 return responseHTML(shell({title,description,url,image:absoluteImage(site.categories?.image1||site.hero?.image),site,body,robots,schema:[breadcrumb]}),200,robots.startsWith('noindex')?{'X-Robots-Tag':'noindex,follow'}:{});
 }catch(e){console.error('SEO category:',e);return new Response('Không thể tải danh mục',{status:503})}
}
