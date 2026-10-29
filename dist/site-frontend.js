import {DEFAULT_SITE,mergedSite} from './data/site-schema.js';
const $ = (selector,root=document)=>root.querySelector(selector);
const $$ = (selector,root=document)=>[...root.querySelectorAll(selector)];
export const CMS_PREVIEW=new URLSearchParams(location.search).get('cms_preview')==='1';
function setText(selector,value){const el=$(selector);if(el)el.textContent=value||'';}
function setPhoto(selector,url,alt){const el=$(selector);if(el){el.src=url||'';if(alt)el.alt=alt;}}
function emphasis(selector,start,italic,end=''){
 const el=$(selector);if(!el)return;el.replaceChildren(document.createTextNode((start||'')+' '));
 const em=document.createElement('em');em.textContent=italic||'';el.append(em);
 if(end)el.append(document.createTextNode(' '+end));
}
function brandPart(name,accent,tagline){
 $$('.brand-copy strong').forEach(el=>{el.replaceChildren(document.createTextNode((name||'')+' '));const em=document.createElement('em');em.textContent=accent||'';el.append(em)});
 $$('.brand-copy small').forEach(el=>el.textContent=tagline||'');
}
export function renderSite(site){
 const c=mergedSite(site),b=c.branding,nav=c.navigation,h=c.hero,benefits=c.benefits,cat=c.categories,coll=c.collection,story=c.story,m=c.membership,contact=c.contact,foot=c.footer;
 // Cấu hình Pixel lấy từ bản CMS được xuất bản; ID chỉ gồm chữ số, không chấp nhận mã script.
 // Không đọc pixelId cũ trong config.js để thao tác xóa/tắt trong ADMIN có hiệu lực thật.
 const marketing=c.marketing||{};
 const ids=String(marketing.pixelIds||'').split(/[\r\n]+/).map(id=>id.trim()).filter(id=>/^\d{8,20}$/.test(id));
 window.SITE_CONFIG.pixelIds=marketing.enabled==='yes' ? [...new Set(ids)].slice(0,5) : [];
 brandPart(b.name,b.accent,b.tagline);
 const navTexts=[nav.home,nav.products,nav.story,nav.contact];
 $$('.desktop-nav a').forEach((el,i)=>{if(navTexts[i])el.textContent=navTexts[i]});
 $$('#mobile-menu a').forEach((el,i)=>{if(navTexts[i])el.textContent=navTexts[i]});
 for(const [section,enabled] of Object.entries(c.visibility)){
   const selectors={benefits:'.benefit-strip',categories:'.categories-section',story:'.editorial-section',membership:'.register-section',contact:'.contact-section'};
   const el=$(selectors[section]);if(el)el.hidden=enabled==='no';
   if(enabled==='no' && section==='story'){$$('a[href="#cau-chuyen"]').forEach(a=>a.hidden=true)}
   if(enabled==='no' && section==='contact'){$$('a[href="#lien-he"]').forEach(a=>a.hidden=true)}
 }
 $$('.brand-symbol img').forEach(img=>{img.src=b.logo||DEFAULT_SITE.branding.logo;});
 if(/^#[a-f\d]{6}$/i.test(b.primaryColor))document.documentElement.style.setProperty('--wine',b.primaryColor);
 setText('.announcement', '');
 const announce=$('.announcement');if(announce){announce.replaceChildren();const decoration=document.createElement('span');decoration.textContent='✦';announce.append(decoration,document.createTextNode(' '+b.announcement+' '));const d2=document.createElement('span');d2.textContent='✦';announce.append(d2);const link=document.createElement('a');link.href='#bo-suu-tap';link.textContent=b.announcementLink+' ↗';announce.append(link)}
 setText('.hero .eyebrow',h.eyebrow+' ✳');emphasis('.hero h1',h.titleStart,h.titleEm,h.titleEnd);
 // CMS: chỉ nhận số nguyên trong phạm vi cho phép, tuyệt đối không nối chuỗi CSS tùy ý.
 const titleDesktop=Number(h.fontSizeDesktop),titleMobile=Number(h.fontSizeMobile);
 if(Number.isInteger(titleDesktop)&&titleDesktop>=40&&titleDesktop<=80)document.documentElement.style.setProperty('--cms-hero-heading-desktop',titleDesktop+'px');
 if(Number.isInteger(titleMobile)&&titleMobile>=30&&titleMobile<=56)document.documentElement.style.setProperty('--cms-hero-heading-mobile',titleMobile+'px');
 setText('.hero-desc',h.description);setPhoto('.hero-image',h.image,h.imageAlt);
 const heroActions=$$('.hero-actions a');if(heroActions[0])heroActions[0].textContent=h.primaryLabel+' ↗';if(heroActions[1])heroActions[1].textContent=h.secondaryLabel+' →';
 setText('.hero-label span:last-child',h.badge);
 $$('.benefits>div').forEach((el,i)=>{const idx=i+1;const title=$('strong',el),subtitle=$('small',el);if(title)title.textContent=benefits['title'+idx];if(subtitle)subtitle.textContent=benefits['desc'+idx]});
 emphasis('.categories-section h2',cat.heading,cat.emphasis);setText('.categories-section .section-intro p',cat.description);
 for(let i=1;i<=3;i++)setPhoto(`.category-card-${i} .category-image img`,cat['image'+i]);
 setText('.products-heading .overline',coll.eyebrow);emphasis('.products-heading h2',coll.heading,coll.emphasis);setText('.products-heading p',coll.description);
 setText('.editorial-copy .overline',story.eyebrow);emphasis('.editorial-copy h2',story.heading,story.emphasis);
 const paragraphs=$$('.editorial-copy>p');if(paragraphs[0])paragraphs[0].textContent=story.paragraph1;if(paragraphs[1])paragraphs[1].textContent=story.paragraph2;
 setPhoto('.editorial-main img',story.image1);setPhoto('.editorial-small img',story.image2);setText('.editorial-copy .btn',story.cta+' ↗');
 setText('.register-section .overline',m.eyebrow);emphasis('.register-section h2',m.heading,m.emphasis);setText('.register-section .register-grid>div>p',m.description);
 setText('.contact-section .overline',contact.eyebrow);emphasis('.contact-section h2',contact.heading,contact.emphasis);setText('.contact-section .contact-grid>div>p',contact.description);
 setText('#fb-link small',contact.facebookLabel);setText('.footer-brand>p',foot.summary);setText('.footer-bottom>span:last-child',foot.signature);
 if(/^https:\/\//i.test(contact.facebookUrl)){
   window.SITE_CONFIG.facebookPage=contact.facebookUrl;
   const link=$('#fb-link');if(link)link.href=contact.facebookUrl;
   $$('.floating-contact a').forEach(a=>a.href=contact.facebookUrl);
   $$('.footer-col:last-child a').forEach(a=>{if(a.textContent.includes('Facebook'))a.href=contact.facebookUrl});
 }
 window.SITE_CONFIG.zaloPhone=contact.zaloPhone;
 const icon=document.querySelector('link[rel="icon"]');if(icon){icon.href=c.seo?.favicon||'/assets/logo.svg';icon.type=/\.svg(?:$|\?)/.test(icon.href)?'image/svg+xml':/\.webp(?:$|\?)/.test(icon.href)?'image/webp':'image/png';}
 const name=(b.name+' '+b.accent).trim();document.title=c.seo?.homeTitle?.trim()||`${name} | Hoa đẹp cho mọi không gian`;
 const og=$('meta[property="og:title"]');if(og)og.content=document.title;
}
function previewDenied(){
 document.body.replaceChildren();const box=document.createElement('main');box.style.cssText='max-width:580px;margin:17vh auto;padding:32px;font:16px/1.7 system-ui;text-align:center';
 const title=document.createElement('h1');title.textContent='Không thể mở bản xem trước';const text=document.createElement('p');text.textContent='Phiên ADMIN đã hết hạn hoặc cấu hình chưa sẵn sàng. Đăng nhập lại vào trang quản trị và mở Xem trước.';
 const link=document.createElement('a');link.href='/admin/';link.textContent='Trở về trang ADMIN';box.append(title,text,link);document.body.append(box);
}
export async function loadSiteContent(){
 if(CMS_PREVIEW){
   window.SITE_CONFIG.previewMode=true; // Không gửi đơn/đăng ký trong bản xem trước.
   const label=document.createElement('div');label.id='cms-preview-banner';label.textContent='✿ BẢN XEM TRƯỚC NỘI DUNG — CHƯA XUẤT BẢN · Chỉ ADMIN xem được';document.body.prepend(label);
 }
 try{
   const endpoint=CMS_PREVIEW?'/api/admin/site/preview':'/api/site';
   const res=await fetch(endpoint,{cache:'no-store',credentials:'same-origin'});
   if(!res.ok)throw new Error('Không đọc được nội dung '+res.status);
   const json=await res.json();if(!json.ok||!json.site)throw new Error('Nội dung không hợp lệ');
   renderSite(json.site);
 }catch(err){console.warn('Site content:',err);if(CMS_PREVIEW){previewDenied();throw err;}renderSite(DEFAULT_SITE);}
}
