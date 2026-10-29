import {sessionFromRequest} from '../../lib/admin-auth.js';
import {siteRow,fullSite} from '../../lib/site-cms.js';
import {ORIGIN,publishedSite,absoluteImage,htmlEscape,shell,responseHTML,NAMES,isDuplicateHost,categorySEO} from '../../lib/seo.js';
export async function onRequestGet({env,params,request}){
 const key=params.slug;
 if(!Object.hasOwn(NAMES,key))return new Response('Không tìm thấy danh mục',{status:404,headers:{'X-Robots-Tag':'noindex'}});
 if(!env.DB)return new Response('Chưa kết nối cơ sở dữ liệu',{status:503});
 try{
 const rs=await env.DB.prepare('SELECT name,slug,image,price,detail,is_sample FROM products WHERE category=? AND is_active=1 AND is_deleted=0 ORDER BY sort_order ASC LIMIT 300').bind(key).all();
 let site=await publishedSite(env);
 const isPreview=new URL(request.url).searchParams.has('cms_preview');
 if(isPreview){
  const session=await sessionFromRequest(env,request);
  if(!session)return new Response('Cần đăng nhập ADMIN để xem bản nháp.',{status:403,headers:{'X-Robots-Tag':'noindex,nofollow'}});
  site=fullSite(await siteRow(env),true);
 }
 const category=NAMES[key],url=`${ORIGIN}/danh-muc/${key}/`,meta=categorySEO(site,key),{title,description}=meta;
 const allSamples=rs.results.every(p=>p.is_sample),robots=isPreview||isDuplicateHost(request)||allSamples?'noindex,follow':'index,follow';
 const cards=rs.results.map(p=>`<article class="seo-card"><a href="/san-pham/${encodeURIComponent(p.slug)}/"><img src="${htmlEscape(absoluteImage(p.image))}" alt="${htmlEscape(p.name)}" loading="lazy" width="500" height="500"><h2>${htmlEscape(p.name)}</h2></a><p>${htmlEscape((p.detail||'').slice(0,130))}</p><strong>${htmlEscape(new Intl.NumberFormat('vi-VN').format(p.price))} ₫</strong></article>`).join('');
 const body=`<main class="seo-main"><div class="breadcrumbs"><a href="/">Trang chủ</a> / ${htmlEscape(category)}</div><header class="seo-category-head"><span class="overline">BỘ SƯU TẬP THU HIỀN</span><h1>${htmlEscape(category)}</h1><p>${htmlEscape(description)}</p></header><section class="seo-cards">${cards||'<p>Chưa có sản phẩm đang hiển thị. Vui lòng quay lại sau.</p>'}</section></main>`;
 const breadcrumb={'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Trang chủ',item:ORIGIN+'/'},{'@type':'ListItem',position:2,name:category,item:url}]};
 return responseHTML(shell({title,description,url,image:meta.image,site,body,robots,schema:[breadcrumb]}),200,robots.startsWith('noindex')?{'X-Robots-Tag':'noindex,follow'}:{});
 }catch(e){console.error('SEO category:',e);return new Response('Không thể tải danh mục',{status:503})}
}
