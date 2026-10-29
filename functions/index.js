import {ORIGIN,publishedSite,siteSEO,htmlEscape,textJSON,isDuplicateHost,responseHTML} from '../lib/seo.js';
import {sessionFromRequest} from '../lib/admin-auth.js';
import {siteRow,fullSite} from '../lib/site-cms.js';
export async function onRequestGet({request,env}){
 const url=new URL(request.url);
 // Bảo toàn trang preview CMS. Chỉ ADMIN đã đăng nhập mới thấy dữ liệu nháp bằng API riêng.
 const preview=url.searchParams.has('cms_preview');
 const raw=await env.ASSETS.fetch(new Request(new URL('/',url.origin),{headers:request.headers}));
 if(!raw.ok)return raw;
 let html=await raw.text();
 let site=await publishedSite(env);
 if(preview){
  try{const session=await sessionFromRequest(env,request);if(session)site=fullSite(await siteRow(env),true);}
  catch(e){console.warn('Preview SEO: dùng bản đã xuất bản',String(e));}
 }
 const seo=siteSEO(site);
 const title=htmlEscape(seo.title),desc=htmlEscape(seo.description),image=htmlEscape(seo.image),shareTitle=htmlEscape(seo.shareTitle),shareDesc=htmlEscape(seo.shareDescription);
 const favicon=site.seo?.favicon||'/assets/logo.svg';const iconMime=/\.svg(?:$|\?)/.test(favicon)?'image/svg+xml':/\.webp(?:$|\?)/.test(favicon)?'image/webp':'image/png';
 const canonical=ORIGIN+'/';
 html=html.replace(/<title>[^<]*<\/title>/,`<title>${title}</title>`)
 .replace(/<meta name="description"[^>]*>/,`<meta name="description" content="${desc}" />`)
 .replace(/<meta property="og:title"[^>]*>/,`<meta property="og:title" content="${shareTitle}" />`)
 .replace(/<meta property="og:description"[^>]*>/,`<meta property="og:description" content="${shareDesc}" />`);
 const ld={ '@context':'https://schema.org','@type':'Organization',name:`${site.branding?.name||'Hoa Lụa'} ${site.branding?.accent||'Thu Hiền'}`,url:ORIGIN,logo: /^https:\/\//.test(site.branding?.logo||'')?site.branding.logo:ORIGIN+(site.branding?.logo||'/assets/logo.svg'),sameAs:[site.contact?.facebookUrl].filter(Boolean)};
 const website={'@context':'https://schema.org','@type':'WebSite',name:ld.name,url:ORIGIN};
 html=html.replace(/<link rel="icon"[^>]*>/,`<link rel="icon" type="${iconMime}" href="${htmlEscape(favicon)}">`);
 const extra=`<meta property="og:image" content="${image}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${image}"><meta name="twitter:title" content="${shareTitle}"><meta name="twitter:description" content="${shareDesc}"><script type="application/ld+json">${textJSON(ld)}</script><script type="application/ld+json">${textJSON(website)}</script>`;
 html=html.replace('</head>',`${extra}${preview||isDuplicateHost(request)?'<meta name="robots" content="noindex, nofollow">':'<meta name="robots" content="index, follow">'}</head>`);
 return responseHTML(html,200,preview||isDuplicateHost(request)?{'X-Robots-Tag':'noindex, nofollow'}:{});
}
