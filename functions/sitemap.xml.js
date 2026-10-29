import {ORIGIN,xmlEscape} from '../lib/seo.js';
function date(value){const d=new Date(value||'');return Number.isNaN(d.getTime())?'':d.toISOString().slice(0,10)}
export async function onRequestGet({env}){
 if(!env.DB)return new Response('Database not configured',{status:503});
 try{
 const rs=await env.DB.prepare("SELECT slug,updated_at FROM products WHERE is_active=1 AND is_deleted=0 AND is_sample=0 ORDER BY updated_at DESC LIMIT 500").all();
 const cats=await env.DB.prepare("SELECT DISTINCT c.slug FROM product_categories c INNER JOIN product_category_links pc ON pc.category_slug=c.slug INNER JOIN products p ON p.id=pc.product_id WHERE c.is_active=1 AND c.is_deleted=0 AND p.is_active=1 AND p.is_deleted=0 AND p.is_sample=0 ORDER BY c.slug").all();
 const urls=[{u:ORIGIN+'/',last:''}];
 for(const c of cats.results)urls.push({u:`${ORIGIN}/danh-muc/${c.slug}/`,last:''});
 for(const p of rs.results)if(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug))urls.push({u:`${ORIGIN}/san-pham/${p.slug}/`,last:date(p.updated_at)});
 const xml='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+urls.map(x=>`<url><loc>${xmlEscape(x.u)}</loc>${x.last?`<lastmod>${x.last}</lastmod>`:''}</url>`).join('')+'</urlset>';
 return new Response(xml,{headers:{'Content-Type':'application/xml; charset=utf-8','Cache-Control':'public, max-age=300','X-Content-Type-Options':'nosniff'}});
 }catch(e){console.error('SEO sitemap:',e);return new Response('Sitemap temporarily unavailable',{status:503});}
}
