const variantKey=values=>values.map(x=>encodeURIComponent(x)).join('|');
const $=selector=>document.querySelector(selector);
const safe=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
let state={axes:[],items:[]},upload=null;
const axisTemplate=()=>({name:'',values:['']});
function combos(axes){return axes.reduce((list,axis)=>list.flatMap(base=>axis.values.filter(Boolean).map(value=>[...base,value])),[[]]);}
function allOptions(){return state.axes.map(a=>({...a,values:a.values.map(v=>v.trim()).filter(Boolean)}));}
function snapshotRows(){for(const tr of document.querySelectorAll('#variant-rows tr[data-key]')){
 const item=state.items.find(x=>x.key===tr.dataset.key);if(!item)continue;
 for(const prop of ['price','stock','sku','image']){const field=tr.querySelector(`[data-field="${prop}"]`);if(field)item[prop]=field.value;}
}}
function rebuildRows(){const axes=allOptions();const old=new Map(state.items.map(item=>[item.key,item]));const values=combos(axes);
 state.items=axes.every(x=>x.values.length)&&values.length<=60?values.map(v=>{const key=variantKey(v);return old.get(key)||{key,values:v,price:$('#f-price').value||'',stock:'0',sku:'',image:''}}):[];
 const select=[...new Set([...document.querySelectorAll('#admin-gallery-items img')].map(img=>img.src))];
 $('#variant-rows').innerHTML=state.items.map(item=>`<tr data-key="${safe(item.key)}"><td><b>${safe(item.values.join(' / '))}</b></td><td><input type="number" min="1000" max="100000000" step="1" required data-field="price" value="${safe(item.price)}" aria-label="Giá ${safe(item.values.join(' / '))}"></td><td><input type="number" min="0" max="1000000" step="1" required data-field="stock" value="${safe(item.stock)}" aria-label="Tồn kho ${safe(item.values.join(' / '))}"></td><td><input maxlength="60" data-field="sku" value="${safe(item.sku||'')}" placeholder="SKU"></td><td><div class="variant-image-cell"><select data-field="image" aria-label="Ảnh ${safe(item.values.join(' / '))}"><option value="">Ảnh bìa</option>${select.map(url=>`<option value="${safe(url)}" ${url===item.image?'selected':''}>${safe(url.split('/').pop().slice(0,25))}</option>`).join('')}${item.image&&!select.includes(item.image)?`<option value="${safe(item.image)}" selected>Ảnh đã tải</option>`:''}</select><button type="button" data-variant-upload="${safe(item.key)}" class="ghost">↑ Tải ảnh</button>${item.image?`<img src="${safe(item.image)}" alt="Ảnh phân loại">`:''}</div></td></tr>`).join('');
 $('#variant-combo-count').textContent=values.length>60?'Vượt 60 tổ hợp, cần giảm lựa chọn.':`${state.items.length} tổ hợp`;
}
function renderAxes(){const root=$('#variant-axes');root.innerHTML=state.axes.map((axis,i)=>`<div class="variant-axis"><div class="variant-axis-head"><b>Phân loại ${i+1}</b><button class="ghost" type="button" data-remove-axis="${i}" ${i===0?'disabled':''}>Xóa phân loại</button></div><label>Tên phân loại<input data-axis-name="${i}" maxlength="40" value="${safe(axis.name)}" placeholder="Ví dụ: Màu sắc / Chiều cao"></label><label>Các lựa chọn (mỗi dòng một lựa chọn)<textarea data-axis-values="${i}" rows="3" placeholder="Đỏ&#10;Xanh">${safe(axis.values.join('\n'))}</textarea></label></div>`).join('');$('#variant-add-axis').disabled=state.axes.length>=2;rebuildRows();}
function setEnabled(enabled){$('#variant-config-body').hidden=!enabled;if(enabled&&!state.axes.length)state.axes=[axisTemplate()];renderAxes()}
export function openVariantEditor(product){state=structuredClone(product?.variantConfig||{axes:[],items:[]});$('#variant-enabled').checked=!!state.axes?.length;setEnabled($('#variant-enabled').checked);}
export function refreshVariantImages(){if($('#variant-enabled')?.checked){snapshotRows();rebuildRows()}}
export function collectVariants(){if(!$('#variant-enabled').checked)return {axes:[],items:[]};snapshotRows();const axes=allOptions();return {axes,items:state.items.map(item=>({key:item.key,values:item.values,price:Number(item.price),stock:Number(item.stock),sku:item.sku||'',image:item.image||''}))};}
export function initVariantEditor({call,toast,resizeImage}){
 $('#variant-enabled').addEventListener('change',e=>{if(!e.target.checked){state={axes:[],items:[]};setEnabled(false)}else setEnabled(true)});
 $('#variant-add-axis').addEventListener('click',()=>{snapshotRows();if(state.axes.length<2){state.axes.push(axisTemplate());renderAxes()}});
 $('#variant-axes').addEventListener('click',e=>{const btn=e.target.closest('[data-remove-axis]');if(btn){snapshotRows();state.axes.splice(Number(btn.dataset.removeAxis),1);renderAxes()}});
 $('#variant-axes').addEventListener('change',e=>{const i=Number(e.target.dataset.axisName??e.target.dataset.axisValues);if(!Number.isInteger(i)||!state.axes[i])return;snapshotRows();if(e.target.hasAttribute('data-axis-name'))state.axes[i].name=e.target.value;else state.axes[i].values=e.target.value.split(/[\r\n,]+/).map(v=>v.trim()).filter(Boolean);renderAxes()});
 $('#variant-rows').addEventListener('change',snapshotRows);
 $('#variant-rows').addEventListener('click',e=>{const btn=e.target.closest('[data-variant-upload]');if(!btn)return;upload=btn.dataset.variantUpload;$('#variant-image-upload').click()});
 const input=document.createElement('input');input.type='file';input.id='variant-image-upload';input.accept='image/jpeg,image/png,image/webp';input.hidden=true;document.body.append(input);
 input.addEventListener('change',async()=>{const file=input.files?.[0];if(!file)return;try{if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Chỉ hỗ trợ JPG, PNG, WebP.');const photo=await resizeImage(file);if(photo.size>5*1024*1024)throw Error('Ảnh không được vượt 5 MB.');const fd=new FormData();fd.append('image',photo);const r=await call('/upload',{method:'POST',body:fd});snapshotRows();const item=state.items.find(x=>x.key===upload);if(item){item.image=r.url;rebuildRows();toast('Đã tải ảnh biến thể lên R2. Hãy lưu sản phẩm.');}}catch(err){toast(err.message,true)}finally{input.value='';upload=null}});
}
