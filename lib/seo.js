import {mergedSite} from '../data/site-schema.js';
export const ORIGIN='https://hoaluathuhien.shop';
export const NAMES={'hoa-lua':'Hoa lụa','hoa-cao-su':'Hoa cao su','hoa-decor':'Hoa giả decor'};
export function htmlEscape(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
export function xmlEscape(value){return htmlEscape(value);}
export function absoluteImage(url){
 const src=String(url||'');
 if(/^\/media\/[a-zA-Z0-9._-]+$/.test(src))return ORIGIN+src;
 if(/^https:\/\/[^\s<>"']+$/.test(src))return src;
 return ORIGIN+'/assets/logo.svg';
}
export function plainText(source,limit=180){return String(source||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim().slice(0,limit);}
export function productSEO(p){
 const title=plainText(p.seo_title||`${p.name} | Hoa Lụa Thu Hiền`,85);
 const description=plainText(p.seo_description||p.detail||`${p.name} tại Hoa Lụa Thu Hiền. Xem ảnh, giá và đặt hàng trực tuyến.`,180);
 return {title,description};
}
export async function publishedSite(env){
 try{
  const row=await env.DB?.prepare("SELECT published_json,published_at FROM site_cms WHERE id='home'").first();
  if(!row)return mergedSite();
  const data=JSON.parse(row.published_json||'{}');
  return mergedSite(data);
 }catch{return mergedSite();}
}
export function siteSEO(site){return {title:plainText(site.seo?.homeTitle||'Hoa Lụa Thu Hiền | Hoa Lụa, Hoa Cao Su & Hoa Giả Decor',85),description:plainText(site.seo?.homeDescription||'Hoa lụa, hoa cao su, hoa giả decor đẹp cho không gian sống.',180),image:absoluteImage(site.seo?.socialImage||site.hero?.image)};}
export function textJSON(value){return JSON.stringify(value).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');}
export function metaBlock({title,description,url,image,kind='website',robots='index,follow',schema=[]}){
 const out=[`<meta name="robots" content="${htmlEscape(robots)}">`,`<link rel="canonical" href="${htmlEscape(url)}">`,
 `<meta name="description" content="${htmlEscape(description)}">`,`<meta property="og:type" content="${kind}">`,
 `<meta property="og:title" content="${htmlEscape(title)}">`,`<meta property="og:description" content="${htmlEscape(description)}">`,
 `<meta property="og:url" content="${htmlEscape(url)}">`,`<meta property="og:image" content="${htmlEscape(image)}">`,
 `<meta name="twitter:card" content="summary_large_image">`,
 `<meta name="twitter:title" content="${htmlEscape(title)}">`, `<meta name="twitter:description" content="${htmlEscape(description)}">`];
 for(const x of schema)out.push(`<script type="application/ld+json">${textJSON(x)}</script>`);
 return out.join('\n');
}
export function responseHTML(html,status=200,extra={}){return new Response(html,{status,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin',...extra}})};
export function isDuplicateHost(request){return new URL(request.url).hostname!=='hoaluathuhien.shop'};
export function shell({title,description,url,image,body,site,robots='index,follow',schema=[],kind='website',productScript=false}){
 const brand=htmlEscape(`${site.branding?.name||'Hoa Lụa'} ${site.branding?.accent||'Thu Hiền'}`);
 const tags=metaBlock({title,description,url,image,robots,schema,kind});
 return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#fcf8f5"><title>${htmlEscape(title)}</title>${tags}<link rel="icon" type="image/svg+xml" href="/assets/logo.svg"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap" rel="stylesheet"><link rel="stylesheet" href="/seo.css">${productScript?'<script type="module" src="/seo-product.js"></script>':''}</head><body><header class="seo-header"><a class="seo-brand" href="/"><img src="/assets/logo.svg" alt="" width="40" height="40"><span>${brand}<small>VẺ ĐẸP THEO NĂM THÁNG</small></span></a><nav><a href="/">Trang chủ</a><a href="/danh-muc/hoa-lua/">Hoa lụa</a><a href="/danh-muc/hoa-cao-su/">Hoa cao su</a><a href="/danh-muc/hoa-decor/">Hoa decor</a></nav></header>${body}${productScript?'<aside class="seo-consent" id="seo-consent" hidden><p>Hoa Lụa Thu Hiền chỉ kích hoạt Meta Pixel khi bạn đồng ý đo lường quảng cáo.</p><div><button type="button" id="seo-consent-no">Từ chối</button><button type="button" id="seo-consent-yes">Đồng ý Pixel</button></div></aside>':''}<footer class="seo-footer"><p>${brand} · Hoa lụa, hoa cao su và hoa giả decor</p><p><a href="/">Về trang chủ</a> · <a href="${htmlEscape(site.contact?.facebookUrl||'https://www.facebook.com/')}">Facebook</a></p>${productScript?'<button type="button" id="seo-consent-settings" class="seo-consent-settings">Quyền riêng tư & Pixel</button>':''}</footer></body></html>`;
}
export function safeSlug(v){return typeof v==='string'&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v)&&v.length<=180;}
