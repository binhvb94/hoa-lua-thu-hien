import {SECTIONS} from '/data/site-schema.js';
const $=s=>document.querySelector(s);
const schemaKeys=Object.keys(SECTIONS);
let api=null,notify=null,current='branding',data=null,dirty=false,saving=false;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function cmsButtonState(){
 $('#cms-unsaved').hidden=!dirty;
 $('#cms-draft-status').textContent=data?.hasDraft?'Có bản nháp chưa xuất bản':'Đang hiển thị bản chính thức';
 $('#cms-draft-status').className=data?.hasDraft?'cms-status pending':'cms-status live';
 $('#cms-preview').disabled=!data||dirty||saving;
 $('#cms-publish').disabled=!data?.hasDraft||dirty||saving;
 $('#cms-discard').disabled=!data?.hasDraft||saving;
 $('#cms-save').disabled=!data||saving||!dirty;
}
function equals(x,y){return JSON.stringify(x)===JSON.stringify(y)}
function renderNav(){
 $('#cms-section-nav').replaceChildren();
 for(const [key,spec] of Object.entries(SECTIONS)){
  const btn=document.createElement('button');btn.type='button';btn.className='cms-section-button'+(current===key?' selected':'');
  const dot=document.createElement('span');dot.className='cms-dot'+(data?.hasDraft&&!equals(data.draft?.[key],data.published?.[key])?' changed':'');
  const label=document.createElement('span');label.textContent=spec.label;
  btn.append(dot,label);btn.addEventListener('click',()=>selectSection(key));$('#cms-section-nav').append(btn);
 }
}
function fieldNode(key,meta,value){
 const label=document.createElement('label');label.className='cms-field';
 const text=document.createElement('span');text.className='cms-field-name';text.textContent=meta.label;label.append(text);
 const multiline=meta.kind==='textarea';
 const input=document.createElement(meta.kind==='select'?'select':multiline?'textarea':'input');
 input.dataset.cmsKey=key;input.maxLength=meta.max||2000;input.value=value??'';
 if(meta.kind==='select'){for(const [val,text] of [['yes','Hiển thị'],['no','Tạm ẩn']]){const opt=document.createElement('option');opt.value=val;opt.textContent=text;input.append(opt)}input.value=value??'yes'}
 else if(multiline)input.rows=4;
 else input.type=meta.kind==='number'?'number':meta.kind==='color'?'color':meta.kind==='phone'?'tel':meta.kind==='url'?'url':'text';
 if(meta.kind==='number'){input.min=String(meta.minValue);input.max=String(meta.maxValue);input.step='1';input.inputMode='numeric';}
 if(meta.kind==='color'&&!/^#[\da-f]{6}$/i.test(input.value))input.value='#8d4157';
 if(meta.kind==='image'){
   input.type='text';input.placeholder='https://... hoặc /media/...';
   const wrap=document.createElement('div');wrap.className='cms-image-picker';
   const img=document.createElement('img');img.alt='Xem trước';img.loading='lazy';img.src=input.value||'/assets/logo.svg';
   const file=document.createElement('input');file.type='file';file.accept='image/jpeg,image/png,image/webp';file.className='cms-file';file.hidden=true;
   const upload=document.createElement('button');upload.type='button';upload.className='ghost';upload.textContent='↑ Tải ảnh lên R2';
   upload.onclick=()=>file.click();
   file.addEventListener('change',async()=>{
    const f=file.files?.[0];if(!f)return;
    if(!['image/jpeg','image/png','image/webp'].includes(f.type)||f.size>5*1024*1024){notify('Chỉ nhận JPG/PNG/WebP tối đa 5 MB.',true);file.value='';return;}
    upload.disabled=true;upload.textContent='Đang tải ảnh...';
    try{const form=new FormData();form.append('image',f);const resp=await api('/upload',{method:'POST',body:form});input.value=resp.url;img.src=resp.url;dirty=true;cmsButtonState();notify('Đã tải ảnh. Bấm Lưu bản nháp để giữ thay đổi.');}
    catch(err){notify(err.message,true)}finally{file.value='';upload.disabled=false;upload.textContent='↑ Tải ảnh lên R2'}
   });
   input.addEventListener('input',()=>{const src=input.value.trim();if(src&&(src.startsWith('/media/')||src.startsWith('https://')))img.src=src;});
   wrap.append(img,upload,file);label.append(wrap);
 }
 label.append(input);input.addEventListener('input',()=>{dirty=true;cmsButtonState()});return label;
}
function renderEditor(){
 if(!data)return;
 const spec=SECTIONS[current];$('#cms-section-title').textContent=spec.label;$('#cms-section-description').textContent=spec.description;
 const form=$('#cms-fields');form.replaceChildren();for(const [key,meta] of Object.entries(spec.fields))form.append(fieldNode(key,meta,data.draft[current][key]));
 renderNav();cmsButtonState();
}
function selectSection(key){
 if(!SECTIONS[key])return;
 if(dirty && !confirm('Bạn đang có thay đổi chưa lưu. Bỏ thay đổi để chuyển mục?'))return;
 current=key;dirty=false;renderEditor();
}
async function refresh(){
 data=await api('/site',{method:'GET'});dirty=false;renderEditor();
 $('#cms-revision').textContent=`Bản đã xuất bản #${data.publishedRevision} · Bản nháp #${data.draftRevision}`;
}
function collect(){const values={};$('#cms-fields').querySelectorAll('[data-cms-key]').forEach(el=>values[el.dataset.cmsKey]=el.value);return values}
async function saveDraft(){
 if(saving||!dirty)return false;
 saving=true;cmsButtonState();
 try{
  await api('/site/draft',{method:'POST',body:JSON.stringify({section:current,values:collect(),baseRevision:data.draftRevision})});
  await refresh();notify('Đã lưu bản nháp. Website khách hàng chưa thay đổi.');return true;
 }catch(err){notify(err.message,true);return false}
 finally{saving=false;cmsButtonState()}
}
function preview(){
 if(dirty){notify('Bạn cần bấm Lưu bản nháp trước khi xem trước.',true);return}
 window.open('/?cms_preview=1','_blank','noopener');
}
async function publish(){
 if(!data?.hasDraft || dirty ||saving)return;
 if(!confirm('XUẤT BẢN bản nháp hiện tại? Tất cả thay đổi đã lưu sẽ hiển thị công khai trên website ngay sau khi khách tải lại trang.'))return;
 saving=true;cmsButtonState();
 try{await api('/site/publish',{method:'POST',body:JSON.stringify({baseRevision:data.draftRevision})});await refresh();notify('Đã xuất bản thành công. Nội dung mới đã hiển thị công khai!')}
 catch(err){notify(err.message,true)}finally{saving=false;cmsButtonState()}
}
async function discard(){
 if(!data?.hasDraft||saving)return;
 if(!confirm('Hủy TOÀN BỘ bản nháp chưa xuất bản? Thay đổi đã lưu trong bản nháp sẽ mất. Bản chính thức không bị ảnh hưởng.'))return;
 saving=true;cmsButtonState();
 try{await api('/site/discard',{method:'POST',body:JSON.stringify({baseRevision:data.draftRevision})});await refresh();notify('Đã hủy bản nháp; bản công khai giữ nguyên.')}
 catch(err){notify(err.message,true)}finally{saving=false;cmsButtonState()}
}
export function initCms({call,toast}){
 api=call;notify=toast;
 $('#cms-save').addEventListener('click',saveDraft);
 $('#cms-preview').addEventListener('click',preview);
 $('#cms-publish').addEventListener('click',publish);
 $('#cms-discard').addEventListener('click',discard);
 $('#cms-reload').addEventListener('click',async()=>{if(dirty&&!confirm('Bỏ các thay đổi chưa lưu?'))return;try{await refresh()}catch(err){notify(err.message,true)}});
}
export async function openCms(){try{await refresh()}catch(err){data=null;$('#cms-fields').textContent='Không tải được CMS. Hãy kiểm tra migration 0003_site_cms.sql trong Cloudflare D1. '+err.message;notify(err.message,true)}}
export function hasCmsChanges(){return dirty}
