import {readFile,access} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const mustContain={
 'admin/index.html':['id="f-recommendation-mode"','id="verified-metrics"','id="nav-categories"','id="categories-work"','id="seo-favicon-preview"','data-seo-tab="sitewide"','id="nav-orders"','id="nav-customers"','id="orders-work"','id="customers-work"','id="order-detail-backdrop"','id="nav-cms"','Nội dung website','id="cms-work"','id="cms-save"','id="cms-preview"','id="cms-publish"','id="nav-seo"','id="seo-work"','/admin/admin.js'],
 'admin/admin.js':['loadReviewModeration',"from './categories-admin.js'","from './admin-commerce.js'","from './site-cms.js'",'initCms({call,toast:notify})','openCms()','initSeoAdmin','openSeoAdmin()'],
 'admin/seo-admin.js':['export function initSeoAdmin','/site/draft','/site/publish','cms_preview=1','seo-product-list'],
 'admin/site-cms.js':['export function initCms','export async function openCms','/site/draft','/site/publish','/site/discard','cms_preview=1'],
 'data/site-schema.js':['favicon','defaultShareImage','defaultShareTitle','defaultShareDescription','fontSizeDesktop','fontSizeMobile','Cỡ chữ','DEFAULT_SITE','SECTIONS','Marketing & Meta Pixel','pixelIds'],
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
 'functions/san-pham/[slug].js':['Product','priceCurrency','index, follow','id="seo-add"','/?mo_gio=1'],
 'seo-product.js':['thuhien_cart_v1','AddToCart','ViewContent','seo-quantity'],
 'functions/danh-muc/[slug].js':['product_category_links','seo-cards','categorySEO','cms_preview','sessionFromRequest'],
 'lib/seo.js':['metaBlock','canonical','publishedSite'],
 'migrations/0005_product_seo.sql':['seo_title','seo_description'],
 'admin/categories-admin.js':['initCategoryAdmin','openCategoryAdmin','cat-members'],
 'functions/api/admin/categories/index.js':['onRequestPost','onRequestGet'],
 'functions/api/admin/categories/[slug].js':['onRequestPatch','onRequestPut','onRequestDelete'],
 'functions/api/categories.js':['allCategories'],
 'migrations/0006_categories.sql':['product_categories','product_category_links'],
 'migrations/0007_verified_metrics_reviews.sql':['product_reviews','recommendation_mode'],
 'functions/api/reviews.js':['onRequestPost','order_code','delivered'],
 'lib/product-trust.js':['productTrustMap','recommendProducts'],
 'functions/san-pham/[slug].js':['Đề xuất cho bạn','seo-review-form','aggregateRating'],
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
