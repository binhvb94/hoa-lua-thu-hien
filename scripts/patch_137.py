from pathlib import Path
p=Path('/mnt/data/hlt_v137_work')
f=p/'data/site-schema.js'; s=f.read_text()
s=s.replace("    socialImage:{label:'Ảnh chia sẻ mạng xã hội (URL HTTPS hoặc ảnh R2, có thể để trống)',max:900},", "    socialImage:{label:'Ảnh chia sẻ trang chủ (URL HTTPS hoặc ảnh R2, có thể để trống)',kind:'seo-image',max:900},\n    categoryHoaLuaTitle:{label:'Hoa lụa – Tiêu đề SEO (để trống: tự tạo)',max:85},\n    categoryHoaLuaDescription:{label:'Hoa lụa – Mô tả SEO (để trống: tự tạo)',kind:'textarea',max:180},\n    categoryHoaLuaImage:{label:'Hoa lụa – Ảnh chia sẻ (tùy chọn)',kind:'seo-image',max:900},\n    categoryHoaCaoSuTitle:{label:'Hoa cao su – Tiêu đề SEO (để trống: tự tạo)',max:85},\n    categoryHoaCaoSuDescription:{label:'Hoa cao su – Mô tả SEO (để trống: tự tạo)',kind:'textarea',max:180},\n    categoryHoaCaoSuImage:{label:'Hoa cao su – Ảnh chia sẻ (tùy chọn)',kind:'seo-image',max:900},\n    categoryHoaDecorTitle:{label:'Hoa decor – Tiêu đề SEO (để trống: tự tạo)',max:85},\n    categoryHoaDecorDescription:{label:'Hoa decor – Mô tả SEO (để trống: tự tạo)',kind:'textarea',max:180},\n    categoryHoaDecorImage:{label:'Hoa decor – Ảnh chia sẻ (tùy chọn)',kind:'seo-image',max:900},")
s=s.replace("homeDescription:'Hoa lụa, hoa cao su và hoa giả trang trí nhà cửa tại Hoa Lụa Thu Hiền. Chọn hoa decor tinh tế, xem mẫu và đặt hàng trực tuyến.',socialImage:''", "homeDescription:'Hoa lụa, hoa cao su và hoa giả trang trí nhà cửa tại Hoa Lụa Thu Hiền. Chọn hoa decor tinh tế, xem mẫu và đặt hàng trực tuyến.',socialImage:'',categoryHoaLuaTitle:'',categoryHoaLuaDescription:'',categoryHoaLuaImage:'',categoryHoaCaoSuTitle:'',categoryHoaCaoSuDescription:'',categoryHoaCaoSuImage:'',categoryHoaDecorTitle:'',categoryHoaDecorDescription:'',categoryHoaDecorImage:''")
f.write_text(s)
f=p/'lib/site-cms.js';s=f.read_text();s=s.replace("if(section==='seo'&&key==='socialImage'&&str&&!validImage(str))", "if(section==='seo'&&meta.kind==='seo-image'&&str&&!validImage(str))");f.write_text(s)
f=p/'lib/seo.js';s=f.read_text();needle="export function siteSEO(site){";pos=s.index(needle)
s=s[:pos]+'''export const CATEGORY_SEO_KEYS={
 'hoa-lua':'categoryHoaLua',
 'hoa-cao-su':'categoryHoaCaoSu',
 'hoa-decor':'categoryHoaDecor'
};
export function categorySEO(site,key){
 const category=NAMES[key]||'Hoa trang trí';
 const field=CATEGORY_SEO_KEYS[key];
 const configured=site.seo||{};
 const fallbackTitle=`${category} đẹp | Hoa Lụa Thu Hiền`;
 const fallbackDesc=`Khám phá những mẫu ${category.toLowerCase()} trang trí nhà cửa tại Hoa Lụa Thu Hiền. Xem hình ảnh, giá bán, chi tiết từng sản phẩm và đặt hàng trực tuyến.`;
 const imageIndex={'hoa-lua':1,'hoa-cao-su':2,'hoa-decor':3}[key]||1;
 return {
  title:plainText(configured[field+'Title']||fallbackTitle,85),
  description:plainText(configured[field+'Description']||fallbackDesc,180),
  image:absoluteImage(configured[field+'Image']||site.categories?.['image'+imageIndex]||site.hero?.image)
 };
}
''' + s[pos:];f.write_text(s)
f=p/'functions/danh-muc/[slug].js';s=f.read_text();s=s.replace("htmlEscape,shell,responseHTML,NAMES,isDuplicateHost", "htmlEscape,shell,responseHTML,NAMES,isDuplicateHost,categorySEO")
s=s.replace("import {ORIGIN,publishedSite", "import {sessionFromRequest} from '../../lib/admin-auth.js';\nimport {siteRow,fullSite} from '../../lib/site-cms.js';\nimport {ORIGIN,publishedSite")
needle=" const site=await publishedSite(env),category=NAMES[key],url=`${ORIGIN}/danh-muc/${key}/`,title=`${category} đẹp | Hoa Lụa Thu Hiền`,description=`Khám phá những mẫu ${category.toLowerCase()} trang trí nhà cửa tại Hoa Lụa Thu Hiền. Xem hình ảnh, giá bán, chi tiết từng sản phẩm và đặt hàng trực tuyến.`;"
replacement=""" let site=await publishedSite(env);
 const isPreview=new URL(request.url).searchParams.has('cms_preview');
 if(isPreview){
  const session=await sessionFromRequest(env,request);
  if(!session)return new Response('Cần đăng nhập ADMIN để xem bản nháp.',{status:403,headers:{'X-Robots-Tag':'noindex,nofollow'}});
  site=fullSite(await siteRow(env),true);
 }
 const category=NAMES[key],url=`${ORIGIN}/danh-muc/${key}/`,meta=categorySEO(site,key),{title,description}=meta;"""
assert needle in s;s=s.replace(needle,replacement)
s=s.replace("const allSamples=rs.results.every(p=>p.is_sample),robots=isDuplicateHost(request)||allSamples?", "const allSamples=rs.results.every(p=>p.is_sample),robots=isPreview||isDuplicateHost(request)||allSamples?")
s=s.replace("image:absoluteImage(site.categories?.image1||site.hero?.image)","image:meta.image")
f.write_text(s)
f=p/'site-frontend.js';s=f.read_text();s=s.replace("const name=(b.name+' '+b.accent).trim();document.title=`${name} | Hoa đẹp cho mọi không gian`;", "const name=(b.name+' '+b.accent).trim();document.title=c.seo?.homeTitle?.trim()||`${name} | Hoa đẹp cho mọi không gian`;")
f.write_text(s)
f=p/'admin/site-cms.js';s=f.read_text();s=s.replace("const multiline=meta.kind==='textarea'||meta.kind==='pixel-ids';", "const multiline=meta.kind==='textarea'||meta.kind==='pixel-ids';")
s=s.replace(" if(meta.kind==='image'){", " if(meta.kind==='image'||meta.kind==='seo-image'){")
s=s.replace("   input.type='text';input.placeholder='https://... hoặc /media/...';", "   input.type='text';input.placeholder='https://... hoặc /media/...';")
s=s.replace("   const upload=document.createElement('button');upload.type='button';upload.className='ghost';upload.textContent='↑ Tải ảnh lên R2';", "   const upload=document.createElement('button');upload.type='button';upload.className='ghost';upload.textContent='↑ Tải ảnh lên R2';")
f.write_text(s)
print('patched core')
