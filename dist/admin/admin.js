import {initCms,openCms,hasCmsChanges} from './site-cms.js';
const $ = s => document.querySelector(s);
const apiBase='/api/admin';
const categoryNames={'hoa-lua':'Hoa lụa','hoa-cao-su':'Hoa cao su','hoa-decor':'Hoa giả decor'};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND',maximumFractionDigits:0}).format(n||0);
let csrf='',allProducts=[],editing=null,slugTouched=false,toastTimer;
const fields={id:'#f-id',name:'#f-name',slug:'#f-slug',category:'#f-category',price:'#f-price',oldPrice:'#f-old-price',badge:'#f-badge',detail:'#f-detail',material:'#f-material',size:'#f-size',image:'#f-image',tone:'#f-tone',active:'#f-active'};
function notify(msg,error=false){const t=$('#toast');t.textContent=msg;t.className='show'+(error?' error':'');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.className='',4500)}
async function call(path,options={}){
 let response;try{response=await fetch(apiBase+path,{credentials:'same-origin',cache:'no-store',...options,headers:{...(options.body instanceof FormData?{}:{'Content-Type':'application/json'}),...(options.headers||{}),...(options.method&&options.method!=='GET'?{'X-CSRF-Token':csrf}:{})}})}catch{throw new Error('Không kết nối được máy chủ. Kiểm tra mạng và thử lại.')}
 let json;try{json=await response.json()}catch{throw new Error('Máy chủ trả dữ liệu không hợp lệ.')}
 if(!response.ok||!json.ok)throw new Error(json.error||`Lỗi ${response.status}`);
 return json;
}
function showScreen(authorized){$('#login-screen').hidden=authorized;$('#dashboard').hidden=!authorized}
async function verifySession(){
 try{const res=await fetch(apiBase+'/session',{cache:'no-store'});const status=await res.json();if(!status.configured){$('#login-hint').textContent='Chưa thiết lập D1 hoặc ADMIN_PASSWORD_HASH trên Cloudflare. Xem README trong bộ mã nguồn.';showScreen(false);return}if(status.authenticated){csrf=status.csrf;showScreen(true);await loadProducts()}else{showScreen(false)}}catch{$('#login-hint').textContent='Không kết nối được API quản trị. Kiểm tra Cloudflare Pages Functions.';showScreen(false)}
}
async function login(e){e.preventDefault();const b=$('#login-form button');b.disabled=true;$('#login-hint').textContent='Đang xác thực...';try{
 const r=await call('/login',{method:'POST',body:JSON.stringify({password:$('#password').value})});csrf=r.csrf;$('#password').value='';$('#login-hint').textContent='';showScreen(true);await loadProducts();notify('Đăng nhập thành công!');
 }catch(err){$('#login-hint').textContent=err.message}finally{b.disabled=false}}
async function logout(){try{await call('/logout',{method:'POST',body:'{}'})}catch{}csrf='';allProducts=[];showScreen(false);notify('Đã đăng xuất')}
async function loadProducts(){try{const r=await call('/products',{method:'GET'});allProducts=r.products||[];render()}catch(e){notify(e.message,true)}}
function render(){
 const s=$('#search').value.trim().toLocaleLowerCase('vi'),f=$('#status-filter').value;
 const list=allProducts.filter(p=>{
  const found=(!s||[p.name,p.id,p.material,p.category].join(' ').toLocaleLowerCase('vi').includes(s));
  return found&&(f==='all'||f==='active'&&p.active||f==='hidden'&&!p.active||f==='sample'&&p.sample)
 });
 $('#stat-total').textContent=allProducts.length;$('#stat-active').textContent=allProducts.filter(p=>p.active).length;$('#stat-hidden').textContent=allProducts.filter(p=>!p.active).length;
 $('#list-foot').textContent=`Đang hiển thị ${list.length} / ${allProducts.length} sản phẩm · Cập nhật lưu trực tiếp vào Cloudflare D1`;
 $('#empty-list').hidden=list.length>0;
 $('#product-list').innerHTML=list.map(p=>`<tr>
 <td><div class="product-cell"><img src="${esc(p.image)}" loading="lazy" alt=""><div><strong>${esc(p.name)}</strong><small>${esc(p.id)}${p.sample?' · SẢN PHẨM MẪU':''}</small></div></div></td>
 <td>${esc(categoryNames[p.category]||p.category)}</td><td>${money(p.price)}</td>
 <td><span class="pill ${p.active?'active':'hidden'}">${p.active?'● Đang bán':'○ Đang ẩn'}</span>${p.sample?' <span class="pill sample">MẪU</span>':''}</td>
 <td><button class="action-btn" data-edit="${esc(p.id)}">Sửa</button><button class="action-btn danger" data-delete="${esc(p.id)}">Xóa</button></td></tr>`).join('');
}
function slugify(s){return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,180)}
function nextId(){return 'TH'+Date.now().toString(36).toUpperCase().slice(-7)}
function openEditor(product){editing=product||null;slugTouched=!!product;$('#editor-title').textContent=product?'Chỉnh sửa sản phẩm':'Thêm sản phẩm mới';
 for(const [k,s] of Object.entries(fields)){
  const input=$(s),val=product?.[k];if(input.type==='checkbox')input.checked=product?Boolean(val):true;
  else input.value=val??(k==='id'?nextId():k==='category'?'hoa-lua':k==='tone'?'rose':'');
 }
 $('#f-id').readOnly=!!product;previewImage();$('#editor-backdrop').hidden=false;document.body.style.overflow='hidden';$('#f-name').focus();
}
function closeEditor(){$('#editor-backdrop').hidden=true;document.body.style.overflow='';$('#product-form').reset();editing=null}
function previewImage(){const url=$('#f-image').value.trim(),target=$('#image-preview');target.replaceChildren();
 if(url&&(/^https:\/\//i.test(url)||url.startsWith('/media/'))){const img=new Image();img.alt='Xem trước ảnh sản phẩm';img.src=url;img.onerror=()=>{target.textContent='Ảnh chưa có';};target.append(img)}else target.textContent='✿';}
async function resizeImage(file){if(file.size<=4.8*1024*1024)return file;
 const bitmap=await createImageBitmap(file);const factor=Math.min(1,1800/Math.max(bitmap.width,bitmap.height));
 const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*factor));canvas.height=Math.max(1,Math.round(bitmap.height*factor));canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close?.();
 const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',.82));if(!blob)throw new Error('Không thể xử lý ảnh. Vui lòng chọn ảnh JPG hoặc PNG khác.');return new File([blob],'anh-san-pham.webp',{type:'image/webp'});
}
async function uploadImage(e){const input=e.target,file=input.files?.[0];if(!file)return;
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)){notify('Chỉ hỗ trợ JPG, PNG, WebP.',true);input.value='';return;}
 const button=$('.upload-button');button.textContent='Đang tải ảnh...';try{
  const photo=await resizeImage(file);if(photo.size>5*1024*1024)throw new Error('Ảnh vẫn vượt 5 MB. Vui lòng giảm kích thước ảnh.');
  const form=new FormData();form.append('image',photo);const r=await call('/upload',{method:'POST',body:form});$('#f-image').value=r.url;previewImage();notify('Ảnh đã được tải lên Cloudflare R2.');
 }catch(err){notify(err.message,true)}finally{input.value='';button.textContent='↑ Tải ảnh từ điện thoại / máy tính';}
}
function collect(){const out={};for(const [k,s] of Object.entries(fields)){const v=$(s);out[k]=v.type==='checkbox'?v.checked:v.value.trim()}
 out.id=out.id.toUpperCase();out.price=Number(out.price);out.oldPrice=out.oldPrice?Number(out.oldPrice):null;return out;
}
async function saveProduct(e){e.preventDefault();const data=collect(),button=$('#save-product');if(!$('#product-form').reportValidity())return;
 button.disabled=true;button.textContent='Đang lưu...';try{
  const route=editing?`/products/${encodeURIComponent(editing.id)}`:'/products';await call(route,{method:editing?'PATCH':'POST',body:JSON.stringify(data)});
  const wasEditing=Boolean(editing);closeEditor();await loadProducts();notify(wasEditing?'Đã cập nhật sản phẩm.':'Đã thêm sản phẩm mới.');
 }catch(err){notify(err.message,true)}finally{button.disabled=false;button.textContent='Lưu sản phẩm →'}
}
async function removeProduct(id){const p=allProducts.find(x=>x.id===id);if(!p||!confirm(`Xóa "${p.name}" khỏi website và trang quản trị?\n\nĐơn hàng cũ vẫn được giữ. Hành động này không có nút hoàn tác.`))return;
 try{await call('/products/'+encodeURIComponent(id),{method:'DELETE'});await loadProducts();notify('Đã xóa sản phẩm khỏi danh mục.')}catch(err){notify(err.message,true)}
}
function wire(){
 initCms({call,toast:notify});
 const showView=async (view)=>{
  if(view==='products' && hasCmsChanges() && !confirm('Có chỉnh sửa chưa lưu. Rời trang nội dung?'))return;
  const cms=view==='cms';document.querySelector('#cms-work').hidden=!cms;document.querySelector('#san-pham').hidden=cms;document.querySelector('#product-stats').hidden=cms;document.querySelector('#admin-heading').textContent=cms?'Nội dung website':'Danh sách sản phẩm';
  document.querySelector('a[href="#san-pham"]').classList.toggle('active',!cms);document.querySelector('#nav-cms').classList.toggle('active',cms);
  if(cms)await openCms();
 };
 document.querySelector('#nav-cms').addEventListener('click',(e)=>{e.preventDefault();showView('cms')});
 document.querySelector('a[href="#san-pham"]').addEventListener('click',(e)=>{e.preventDefault();showView('products')});
 $('#year').textContent=String(new Date().getFullYear());$('#login-form').addEventListener('submit',login);
 $('#logout-top').addEventListener('click',logout);$('#logout-side').addEventListener('click',logout);
 $('#search').addEventListener('input',render);$('#status-filter').addEventListener('change',render);
 $('#new-product').addEventListener('click',()=>openEditor(null));
 $('#product-list').addEventListener('click',e=>{const edit=e.target.closest('[data-edit]'),del=e.target.closest('[data-delete]');if(edit)openEditor(allProducts.find(p=>p.id===edit.dataset.edit));if(del)removeProduct(del.dataset.delete)});
 $('#editor-close').addEventListener('click',closeEditor);$('#editor-cancel').addEventListener('click',closeEditor);
 $('#product-form').addEventListener('submit',saveProduct);$('#upload-image').addEventListener('change',uploadImage);
 $('#f-name').addEventListener('input',()=>{if(!slugTouched)$('#f-slug').value=slugify($('#f-name').value)});
 $('#f-slug').addEventListener('input',()=>{slugTouched=true});$('#f-image').addEventListener('input',previewImage);
 window.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#editor-backdrop').hidden)closeEditor()});
}
wire();verifySession();
