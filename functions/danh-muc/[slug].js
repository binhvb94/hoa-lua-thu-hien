import {sessionFromRequest} from '../../lib/admin-auth.js';
import {siteRow,fullSite} from '../../lib/site-cms.js';
import {ORIGIN,publishedSite,absoluteImage,htmlEscape,shell,responseHTML,categorySEO,plainText,isDuplicateHost,safeSlug} from '../../lib/seo.js';
import {allCategories} from '../../lib/category-store.js';
import {productTrustMap,applyTrust} from '../../lib/product-trust.js';
export async function onRequestGet({env,params,request}){
 const key=params.slug;
 if(!safeSlug(key))return new Response('Danh mục không tồn tại',{status:404,headers:{'X-Robots-Tag':'noindex'}});
 if(!env.DB)return new Response('Chưa kết nối cơ sở dữ liệu',{status:503});
 try{
 const cat=await env.DB.prepare('SELECT * FROM product_categories WHERE slug=? AND is_deleted=0 AND is_active=1').bind(key).first();
 if(!cat)return new Response('Danh mục không tồn tại',{status:404,headers:{'X-Robots-Tag':'noindex'}});
 const rows=await env.DB.prepare('SELECT p.id,p.name,p.slug,p.image,p.price,p.detail,p.is_sample FROM products p INNER JOIN product_category_links pc ON p.id=pc.product_id WHERE pc.category_slug=? AND p.is_active=1 AND p.is_deleted=0 ORDER BY p.sort_order ASC LIMIT 300').bind(key).all();
 let site=await publishedSite(env);
 const isPreview=new URL(request.url).searchParams.has('cms_preview');
 if(isPreview){
  const session=await sessionFromRequest(env,request);
  if(!session)return new Response('Cần đăng nhập ADMIN để xem bản nháp.',{status:403,headers:{'X-Robots-Tag':'noindex,nofollow'}});
  site=fullSite(await siteRow(env),true);
 }
 const url=`${ORIGIN}/danh-muc/${key}/`,legacy=categorySEO(site,key);
 const isBuiltin=['hoa-lua','hoa-cao-su','hoa-decor'].includes(key);const title=plainText(cat.seo_title||(isBuiltin?legacy.title:'')||`${cat.name} | Hoa Lụa Thu Hiền`,85);
 const description=plainText(cat.seo_description||(isBuiltin?legacy.description:'')||cat.description||`Khám phá các mẫu ${cat.name} tại Hoa Lụa Thu Hiền.`,180);
 const image=absoluteImage(cat.seo_image||site.seo?.defaultShareImage||cat.image||legacy.image);
 const allSamples=rows.results.every(p=>p.is_sample),robots=isPreview||isDuplicateHost(request)||allSamples?'noindex,follow':'index,follow';
 const trust=await productTrustMap(env.DB);
 const cards=rows.results.map(row=>{const p=applyTrust(row,trust);return `<article class="seo-card"><a href="/san-pham/${encodeURIComponent(p.slug)}/"><img src="${htmlEscape(absoluteImage(p.image))}" alt="${htmlEscape(p.name)}" loading="lazy" width="500" height="500"><h2>${htmlEscape(p.name)}</h2></a><p>${htmlEscape((p.detail||'').slice(0,130))}</p><strong>${htmlEscape(new Intl.NumberFormat('vi-VN').format(p.price))} ₫</strong>${p.reviewCount?`<div class="product-trust-inline"><span class="star-meter" aria-hidden="true"><span>★★★★★</span><b style="width:${Math.round(p.ratingAverage*20)}%">★★★★★</b></span> ${p.ratingAverage.toFixed(2).replace('.',',')}/5 (${p.reviewCount})</div>`:''}${p.soldCount?`<div class="product-trust-inline">Đã bán ${p.soldCount} qua website</div>`:''}</article>`}).join('');
 const body=`<main class="seo-main"><div class="breadcrumbs"><a href="/">Trang chủ</a> / ${htmlEscape(cat.name)}</div><header class="seo-category-head"><span class="overline">BỘ SƯU TẬP THU HIỀN</span><h1>${htmlEscape(cat.name)}</h1><p>${htmlEscape(description)}</p></header><section class="seo-cards">${cards||'<p>Chưa có sản phẩm đang hiển thị. Vui lòng quay lại sau.</p>'}</section></main>`;
 const breadcrumb={'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Trang chủ',item:ORIGIN+'/'},{'@type':'ListItem',position:2,name:cat.name,item:url}]};
 const navCategories=await allCategories(env.DB);
 return responseHTML(shell({title,description,url,image,site,body,robots,schema:[breadcrumb],navigationCategories:navCategories}),200,robots.startsWith('noindex')?{'X-Robots-Tag':'noindex,follow'}:{});
 }catch(e){console.error('SEO category:',e);return new Response('Không thể tải danh mục',{status:503})}
}
