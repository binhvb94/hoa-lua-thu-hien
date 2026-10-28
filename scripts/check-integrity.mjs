import {readFile,access} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const mustContain={
 'admin/index.html':['id="nav-orders"','id="nav-customers"','id="orders-work"','id="customers-work"','id="order-detail-backdrop"','id="nav-cms"','Nội dung website','id="cms-work"','id="cms-save"','id="cms-preview"','id="cms-publish"','/admin/admin.js'],
 'admin/admin.js':["from './admin-commerce.js'","from './site-cms.js'",'initCms({call,toast:notify})','openCms()'],
 'admin/site-cms.js':['export function initCms','export async function openCms','/site/draft','/site/publish','/site/discard','cms_preview=1'],
 'data/site-schema.js':['fontSizeDesktop','fontSizeMobile','Cỡ chữ','DEFAULT_SITE','SECTIONS','Marketing & Meta Pixel','pixelIds'],
 'site-frontend.js':['fontSizeDesktop','fontSizeMobile','window.SITE_CONFIG.pixelIds'],
 'styles.css':['.hero h1 em{white-space:nowrap','--cms-hero-heading-mobile'],
 'app.js':["fbq('trackSingle'",'cfg.pixelIds','consentKey'],
 'functions/api/site.js':['published'],
 'admin/admin-commerce.js':['export function initCommerce','loadOrders','loadCustomers','saveOrderStatus'],
 'functions/api/admin/orders/index.js':['onRequestGet','FROM orders'],
 'functions/api/admin/orders/[id].js':['onRequestGet','onRequestPatch','order_status_history'],
 'functions/api/admin/customers/index.js':['onRequestGet','FROM registrations'],
 'migrations/0004_orders_customers_admin.sql':['order_status_history'],
 'functions/api/admin/site/preview.js':['onRequestGet'],
 'functions/api/admin/site/publish.js':['onRequestPost'],
 'migrations/0003_site_cms.sql':['site_cms','site_publication_history'],
 'scripts/hash-password.mjs':['100000'],
 'functions/index.js':['publishedSite','X-Robots-Tag'],
 'functions/sitemap.xml.js':['sitemap','is_sample=0'],
 'functions/san-pham/[slug].js':['Product','priceCurrency','index, follow'],
 'functions/danh-muc/[slug].js':['seo-cards'],
 'lib/seo.js':['metaBlock','canonical','publishedSite'],
 'migrations/0005_product_seo.sql':['seo_title','seo_description'],
 'robots.txt':['Sitemap: https://hoaluathuhien.shop/sitemap.xml']
};
export async function checkCmsIntegrity(){
 for(const [file,needles] of Object.entries(mustContain)){
  const text=await readFile(join(root,file),'utf8');
  for(const expected of needles)if(!text.includes(expected))throw new Error(`THIẾU CMS: ${file} thiếu "${expected}". Không triển khai bản thiếu chức năng!`);
 }
 for(const file of ['functions/api/admin/products.js','functions/api/admin/login.js','admin/admin.css','lib/site-cms.js','data/products.js','assets/logo.svg','config.js'])await access(join(root,file));
 console.log('CMS + COMMERCE integrity OK: CMS + Meta Pixel + sản phẩm + đơn hàng + khách đăng ký độc lập.');
}
if(process.argv[1] && fileURLToPath(import.meta.url)===process.argv[1]){
 await checkCmsIntegrity();
}
