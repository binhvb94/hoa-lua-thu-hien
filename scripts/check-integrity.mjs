import {readFile,access} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const mustContain={
 'admin/index.html':['id="nav-cms"','Nội dung website','id="cms-work"','id="cms-save"','id="cms-preview"','id="cms-publish"','/admin/admin.js'],
 'admin/admin.js':["from './site-cms.js'",'initCms({call,toast:notify})','openCms()'],
 'admin/site-cms.js':['export function initCms','export async function openCms','/site/draft','/site/publish','/site/discard','cms_preview=1'],
 'data/site-schema.js':['fontSizeDesktop','fontSizeMobile','Cỡ chữ','DEFAULT_SITE','SECTIONS','Marketing & Meta Pixel','pixelIds'],
 'site-frontend.js':['fontSizeDesktop','fontSizeMobile','window.SITE_CONFIG.pixelIds'],
 'styles.css':['.hero h1 em{white-space:nowrap','--cms-hero-heading-mobile'],
 'app.js':["fbq('trackSingle'",'cfg.pixelIds','consentKey'],
 'functions/api/site.js':['published'],
 'functions/api/admin/site/preview.js':['onRequestGet'],
 'functions/api/admin/site/publish.js':['onRequestPost'],
 'migrations/0003_site_cms.sql':['site_cms','site_publication_history'],
 'scripts/hash-password.mjs':['100000']
};
export async function checkCmsIntegrity(){
 for(const [file,needles] of Object.entries(mustContain)){
  const text=await readFile(join(root,file),'utf8');
  for(const expected of needles)if(!text.includes(expected))throw new Error(`THIẾU CMS: ${file} thiếu "${expected}". Không triển khai bản thiếu chức năng!`);
 }
 for(const file of ['functions/api/admin/products.js','functions/api/admin/login.js','admin/admin.css','lib/site-cms.js','data/products.js','assets/logo.svg','config.js'])await access(join(root,file));
 console.log('CMS integrity OK: Nội dung website + quản lý sản phẩm + Meta Pixel (CMS, consent, trackSingle) + lưu nháp / xem trước / xuất bản.');
}
if(process.argv[1] && fileURLToPath(import.meta.url)===process.argv[1]){
 await checkCmsIntegrity();
}
