// V1.3.8 - Quản lý danh mục động và sản phẩm trong danh mục.
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let call,toast,getProducts,reloadProducts,record=[],assignments={},activeSlug=null;
const slugify=s=>String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,80);
async function load(){const data=await call('/categories',{method:'GET'});record=data.categories||[];assignments=data.assignments||{};renderList();renderEditor();}
function renderList(){
 const el=$('#category-list');el.innerHTML=record.map(c=>`<button type="button" class="cat-pick ${activeSlug===c.slug?'selected':''}" data-cat="${esc(c.slug)}"><strong>${esc(c.name)}</strong><small>/${esc(c.slug)}/ · ${(assignments[c.slug]||[]).length} sản phẩm ${c.active?'':'· Đang ẩn'}</small></button>`).join('')+'<button type="button" class="cat-pick cat-new" data-cat="">＋ Thêm danh mục mới</button>';
}
function renderEditor(){
 const c=record.find(x=>x.slug===activeSlug)||null;
 $('#category-editor-title').textContent=c?'Sửa danh mục '+c.name:'Thêm danh mục mới';
 for(const id of ['slug','name','description','image','seoTitle','seoDescription','seoImage'])$('#cat-'+id).value=c?.[id]??'';
 $('#cat-slug').readOnly=!!c;$('#cat-active').checked=c?c.active:true;
 $('#cat-delete').hidden=!c;$('#cat-members-box').hidden=!c;
 const image=c?.image;$('#cat-image-preview').src=image||'/assets/logo.svg';
 if(c){const chosen=new Set(assignments[c.slug]||[]);const products=getProducts();
  $('#cat-members').innerHTML=products.map(p=>`<label class="cat-member"><input type="checkbox" value="${esc(p.id)}" ${chosen.has(p.id)?'checked':''}><img src="${esc(p.image)}" alt="" loading="lazy"><span><b>${esc(p.name)}</b><small>${esc(p.id)} · ${esc(p.category)}</small></span></label>`).join('')||'<p>Chưa có sản phẩm.</p>';
  $('#cat-member-count').textContent=`${chosen.size} sản phẩm đã gán`;
  $('#cat-members').onchange=()=>$('#cat-member-count').textContent=`${$('#cat-members').querySelectorAll('input:checked').length} sản phẩm đã chọn`;
 }
}
function collect(){const out={};for(const field of ['slug','name','description','image','seoTitle','seoDescription','seoImage'])out[field]=$('#cat-'+field).value.trim();out.active=$('#cat-active').checked;return out}
async function save(e){e.preventDefault();const c=record.find(x=>x.slug===activeSlug);const p=collect();
 try{const result=await call(c?'/categories/'+encodeURIComponent(c.slug):'/categories',{method:c?'PATCH':'POST',body:JSON.stringify(p)});activeSlug=result.category.slug;await load();toast('Đã lưu danh mục và SEO. URL danh mục được cập nhật ngay.');}
 catch(e){toast(e.message,true)}
}
async function saveMembers(){if(!activeSlug)return;
 const ids=Array.from($('#cat-members').querySelectorAll('input:checked')).map(x=>x.value);
 try{await call('/categories/'+encodeURIComponent(activeSlug),{method:'PUT',body:JSON.stringify({productIds:ids})});await reloadProducts();await load();toast('Đã cập nhật sản phẩm trong danh mục.');}
 catch(e){toast(e.message,true)}
}
async function remove(){if(!activeSlug||!confirm('Xóa danh mục này? Các sản phẩm và đơn hàng vẫn được giữ, nhưng URL danh mục sẽ trả 404.'))return;
 try{await call('/categories/'+encodeURIComponent(activeSlug),{method:'DELETE'});activeSlug=null;await load();toast('Đã xóa danh mục.');}catch(e){toast(e.message,true)}
}
async function uploadImage(which){const file=$('#cat-'+which+'-upload').files?.[0];if(!file)return;
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024){toast('Ảnh phải là JPG/PNG/WebP, tối đa 5 MB.',true);return}
 const form=new FormData();form.append('image',file);
 try{const response=await call('/upload',{method:'POST',body:form});$('#cat-'+which).value=response.url;if(which==='image')$('#cat-image-preview').src=response.url;toast('Đã tải ảnh lên R2. Bấm Lưu danh mục để áp dụng.')}catch(e){toast(e.message,true)}finally{$('#cat-'+which+'-upload').value=''}
}
export function initCategoryAdmin(params){({call,toast,getProducts,reloadProducts}=params);
 $('#category-list').addEventListener('click',e=>{const button=e.target.closest('[data-cat]');if(!button)return;activeSlug=button.dataset.cat||null;renderList();renderEditor()});
 $('#cat-name').addEventListener('input',()=>{if(!activeSlug)$('#cat-slug').value=slugify($('#cat-name').value)});
 $('#category-form').addEventListener('submit',save);
 $('#cat-members-save').addEventListener('click',saveMembers);
 $('#cat-delete').addEventListener('click',remove);
 for(const key of ['image','seoImage'])$('#cat-'+key+'-upload').addEventListener('change',()=>uploadImage(key));
 $('#cat-image').addEventListener('input',()=>{$('#cat-image-preview').src=$('#cat-image').value||'/assets/logo.svg'});
}
export async function openCategoryAdmin(){try{await load()}catch(e){toast('Danh mục chưa sẵn sàng: '+e.message,true)}}
export async function getAdminCategories(){const d=await call('/categories',{method:'GET'});return d.categories||[];}
