// V1.3.7 - Trang quản lý SEO riêng. Dữ liệu nháp dùng chung CMS hiện có.
import {SECTIONS} from '/data/site-schema.js';
const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const PAGES={
 sitewide:{title:'SEO toàn site · Favicon & ảnh chia sẻ',url:'/',keys:['favicon','defaultShareImage','defaultShareTitle','defaultShareDescription']},
 home:{title:'Trang chủ',url:'/',keys:['homeTitle','homeDescription','socialImage']},
 'hoa-lua':{title:'Danh mục hoa lụa',url:'/danh-muc/hoa-lua/',keys:['categoryHoaLuaTitle','categoryHoaLuaDescription','categoryHoaLuaImage']},
 'hoa-cao-su':{title:'Danh mục hoa cao su',url:'/danh-muc/hoa-cao-su/',keys:['categoryHoaCaoSuTitle','categoryHoaCaoSuDescription','categoryHoaCaoSuImage']},
 'hoa-decor':{title:'Danh mục hoa decor',url:'/danh-muc/hoa-decor/',keys:['categoryHoaDecorTitle','categoryHoaDecorDescription','categoryHoaDecorImage']}
};
const DOMAIN='https://hoaluathuhien.shop';
const defaults={
 home:['Hoa Lụa Thu Hiền | Hoa Lụa, Hoa Cao Su & Hoa Giả Decor','Hoa lụa, hoa cao su và hoa giả trang trí nhà cửa tại Hoa Lụa Thu Hiền. Chọn hoa decor tinh tế, xem mẫu và đặt hàng trực tuyến.'],
 'hoa-lua':['Hoa lụa đẹp | Hoa Lụa Thu Hiền','Khám phá những mẫu hoa lụa trang trí nhà cửa tại Hoa Lụa Thu Hiền. Xem hình ảnh, giá bán, chi tiết từng sản phẩm và đặt hàng trực tuyến.'],
 'hoa-cao-su':['Hoa cao su đẹp | Hoa Lụa Thu Hiền','Khám phá những mẫu hoa cao su trang trí nhà cửa tại Hoa Lụa Thu Hiền. Xem hình ảnh, giá bán, chi tiết từng sản phẩm và đặt hàng trực tuyến.'],
 'hoa-decor':['Hoa giả decor đẹp | Hoa Lụa Thu Hiền','Khám phá những mẫu hoa giả decor trang trí nhà cửa tại Hoa Lụa Thu Hiền. Xem hình ảnh, giá bán, chi tiết từng sản phẩm và đặt hàng trực tuyến.']
};
let call,toast,getProducts,onEditProduct,record=null,tab='home',pending=false,sending=false,values=null;
function hasChanges(){return pending}
function info(){
 const exists=record?.hasDraft;
 $('#seo-state').textContent=exists?'Có bản nháp chưa xuất bản':'Đang hiển thị bản chính thức';
 $('#seo-state').className='cms-status '+(exists?'pending':'live');
 $('#seo-unsaved').hidden=!pending;
 $('#seo-save').disabled=!pending||sending;
 $('#seo-preview').disabled=!record||pending||sending;
 $('#seo-publish').disabled=!exists||pending||sending;
 $('#seo-discard').disabled=!exists||pending||sending;
 $('#seo-version').textContent=record?`Đã xuất bản #${record.publishedRevision} · Bản nháp #${record.draftRevision}`:'';
}
function pageForm(){
 const cfg=PAGES[tab];if(!cfg)return;
 $('#seo-editor').hidden=false;$('#seo-products').hidden=true;
 $('#seo-page-label').textContent=cfg.title;
 $('#seo-page-link').href=cfg.url;
 $('#seo-page-link').textContent=DOMAIN+cfg.url;
 const el=$('#seo-fields');el.replaceChildren();
 for(const [index,key] of cfg.keys.entries()){
  const meta=SECTIONS.seo.fields[key];
  const label=document.createElement('label');label.className='seo-field';
  const head=document.createElement('span');head.textContent=meta.label;label.append(head);
  const isTextArea=meta.kind==='textarea';const input=document.createElement(isTextArea?'textarea':'input');input.dataset.key=key;input.value=values[key]??'';
  if(isTextArea){input.rows=3;input.maxLength=meta.max||180}else{input.type='text';input.maxLength=meta.max||900}
  input.placeholder=meta.kind==='seo-image'?'https://... hoặc /media/... (để trống dùng mặc định)':isTextArea?'Mô tả ngắn':'Để trống sẽ tự tạo';
  input.addEventListener('input',()=>{values[key]=input.value;pending=true;info();renderSnippet()});
  label.append(input);
  if(meta.kind==='seo-image'){
   const upload=document.createElement('div');upload.className='seo-upload-row';
   const file=document.createElement('input');file.type='file';file.accept='image/jpeg,image/png,image/webp';file.hidden=true;
   const button=document.createElement('button');button.type='button';button.className='ghost';button.textContent='↑ Tải ảnh chia sẻ lên R2';
   const hint=document.createElement('small');hint.textContent=key==='favicon'?'Favicon: PNG vuông 512×512 khuyên dùng · tối đa 5 MB.':'Ảnh chia sẻ: 1200×630 px khuyên dùng · tối đa 5 MB.';
   button.onclick=()=>file.click();file.addEventListener('change',async()=>{
    const f=file.files?.[0];if(!f)return;
    if(!['image/jpeg','image/png','image/webp'].includes(f.type)||f.size>5*1024*1024){toast('Chỉ chọn JPG/PNG/WebP tối đa 5 MB.',true);file.value='';return;}
    button.disabled=true;button.textContent='Đang tải ảnh...';
    try{const form=new FormData();form.append('image',f);const r=await call('/upload',{method:'POST',body:form});input.value=r.url;values[key]=r.url;pending=true;info();renderSnippet();toast('Ảnh đã lưu lên R2. Hãy lưu bản nháp để áp dụng.');}
    catch(err){toast(err.message,true)}finally{button.disabled=false;button.textContent='↑ Tải ảnh chia sẻ lên R2';file.value=''}
   });upload.append(button,hint,file);label.append(upload);
  }
  el.append(label);
 }
 renderSnippet();
}
function renderSnippet(){
 const cfg=PAGES[tab];if(!cfg)return;
 const isSitewide=tab==='sitewide';
 const rawTitle=isSitewide?(values?.defaultShareTitle?.trim()||values?.homeTitle?.trim()||defaults.home[0]):(values?.[cfg.keys[0]]?.trim()||defaults[tab][0]);
 const rawDesc=isSitewide?(values?.defaultShareDescription?.trim()||values?.homeDescription?.trim()||defaults.home[1]):(values?.[cfg.keys[1]]?.trim()||defaults[tab][1]);
 $('#seo-google-title').textContent=rawTitle;
 $('#seo-google-url').textContent=DOMAIN+cfg.url;
 $('#seo-google-desc').textContent=rawDesc;
 const titleLength=rawTitle.length,descLength=rawDesc.length;
 $('#seo-title-count').textContent=`${titleLength} ký tự · gợi ý 45–65`;
 $('#seo-desc-count').textContent=`${descLength} ký tự · gợi ý 120–160`;
 $('#seo-title-count').className=titleLength>70?'seo-too-long':'';
 $('#seo-desc-count').className=descLength>170?'seo-too-long':'';
 $('#seo-social-title').textContent=rawTitle;
 $('#seo-social-desc').textContent=rawDesc;
 const im=isSitewide?(values?.defaultShareImage?.trim()||''):(values?.[cfg.keys[2]]?.trim()||values?.defaultShareImage?.trim()||'');
 const image=$('#seo-social-image');
 image.hidden=!im;image.src=im||'/assets/logo.svg';
 const faviconPreview=document.querySelector('#seo-favicon-preview');if(faviconPreview){faviconPreview.hidden=!isSitewide;faviconPreview.src=values?.favicon||'/assets/logo.svg';}
}
function renderTabs(){
 for(const btn of document.querySelectorAll('[data-seo-tab]'))btn.classList.toggle('selected',btn.dataset.seoTab===tab);
 $('#seo-publish-bar').hidden=tab==='products';
 if(tab==='products'){
  $('#seo-editor').hidden=true;$('#seo-products').hidden=false;
  renderProducts();
 }else pageForm();
 info();
}
function renderProducts(){
 const list=getProducts()||[];
 const q=$('#seo-product-search').value.toLocaleLowerCase('vi').trim();
 const filtered=list.filter(p=>!q||(p.name+' '+p.id+' '+p.slug).toLocaleLowerCase('vi').includes(q));
 $('#seo-product-count').textContent=`${filtered.length} / ${list.length} sản phẩm`;
 $('#seo-product-list').innerHTML=filtered.map(p=>{
  const isIndexable=p.active&&!p.sample;
  return `<tr><td><strong>${esc(p.name)}</strong><small style="display:block">${esc(p.id)}</small></td><td><small>${esc(p.seoTitle||'Tự tạo từ tên sản phẩm')}</small><small style="display:block">${esc(p.seoDescription||'Tự tạo từ mô tả')}</small></td><td><span class="pill ${isIndexable?'active':'hidden'}">${isIndexable?'Có thể index':p.sample?'Mẫu: noindex':'Ẩn: không index'}</span></td><td><button type="button" class="action-btn" data-seo-edit="${esc(p.id)}">Sửa SEO</button> <a target="_blank" rel="noopener noreferrer" href="/san-pham/${encodeURIComponent(p.slug)}/">Xem trang ↗</a></td></tr>`
 }).join('');
 $('#seo-product-empty').hidden=filtered.length>0;
}
async function reload(){
 const result=await call('/site',{method:'GET'});record=result;
 // Giữ toàn bộ giá trị của nhóm SEO. Trường mới được bổ sung bằng mặc định từ API.
 values={...result.draft.seo};pending=false;renderTabs();
}
async function save(){
 if(!pending||sending)return;
 sending=true;info();
 try{await call('/site/draft',{method:'POST',body:JSON.stringify({section:'seo',values,baseRevision:record.draftRevision})});await reload();toast('Đã lưu bản nháp SEO. Khách hàng chưa nhìn thấy thay đổi.');}
 catch(err){toast(err.message,true)}finally{sending=false;info()}
}
async function publish(){
 if(pending||sending||!record?.hasDraft)return;
 if(!confirm('Xuất bản toàn bộ bản nháp CMS, bao gồm SEO và các nội dung khác đang chờ?'))return;
 sending=true;info();
 try{await call('/site/publish',{method:'POST',body:JSON.stringify({baseRevision:record.draftRevision})});await reload();toast('SEO đã xuất bản. Mở URL công khai để kiểm tra.');}
 catch(err){toast(err.message,true)}finally{sending=false;info()}
}
async function discard(){
 if(pending||sending||!record?.hasDraft)return;
 if(!confirm('HỦY TOÀN BỘ bản nháp CMS, không chỉ phần SEO? Bản đã xuất bản không đổi.'))return;
 sending=true;info();
 try{await call('/site/discard',{method:'POST',body:JSON.stringify({baseRevision:record.draftRevision})});await reload();toast('Đã hủy bản nháp CMS.');}
 catch(err){toast(err.message,true)}finally{sending=false;info()}
}
function preview(){
 if(pending||!record)return;
 if(tab==='products'){toast('Chọn một sản phẩm rồi bấm Xem trang.');return}
 const url=PAGES[tab].url+(PAGES[tab].url.includes('?')?'&':'?')+'cms_preview=1';
 window.open(url,'_blank','noopener');
}
export function initSeoAdmin(params){
 ({call,toast,getProducts,onEditProduct}=params);
 document.querySelectorAll('[data-seo-tab]').forEach(button=>button.addEventListener('click',()=>{
  if(pending&&!confirm('Bạn có thay đổi SEO chưa lưu. Bỏ thay đổi để chuyển tab?'))return;
  if(pending){values={...record.draft.seo};pending=false}
  tab=button.dataset.seoTab;renderTabs();
 }));
 $('#seo-save').addEventListener('click',save);
 $('#seo-publish').addEventListener('click',publish);
 $('#seo-discard').addEventListener('click',discard);
 $('#seo-preview').addEventListener('click',preview);
 $('#seo-reload').addEventListener('click',async()=>{if(pending&&!confirm('Bỏ thay đổi chưa lưu?'))return;try{await reload()}catch(e){toast(e.message,true)}});
 $('#seo-product-search').addEventListener('input',renderProducts);
 $('#seo-product-list').addEventListener('click',e=>{const id=e.target.closest('[data-seo-edit]')?.dataset.seoEdit;if(!id)return;const p=getProducts().find(p=>p.id===id);if(p)onEditProduct(p)});
}
export async function openSeoAdmin(){try{await reload()}catch(e){toast('Không tải được cấu hình SEO: '+e.message,true);}}
export {hasChanges as hasSeoChanges};
