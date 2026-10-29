// V1.3.6: giỏ hàng trên trang SEO dùng CHUNG localStorage với trang chủ.
// Giữ nguyên dữ liệu sản phẩm do server render, không tính giá từ client khi đặt COD:
// /api/orders vẫn lấy giá chính thức từ D1.
const CART_KEY='thuhien_cart_v1';
const variantKey=values=>values.map(x=>encodeURIComponent(x)).join('|');
let selectedVariant=null;
const CONSENT_KEY='thuhien_cookie_consent_v1';
const button=document.getElementById('seo-add');
const quantity=document.getElementById('seo-quantity');
const status=document.getElementById('seo-add-status');
let pixelIds=[];
let pixelInitialized=false;
const pixelEvents=new Set();
const consentBox=document.getElementById('seo-consent');
function consent(){try{return localStorage.getItem(CONSENT_KEY);}catch{return 'no';}}
function readCart(){
  try{
    const raw=JSON.parse(localStorage.getItem(CART_KEY)||'{}');
    if(!raw||typeof raw!=='object'||Array.isArray(raw))return {};
    const cart={};
    for(const [id,n] of Object.entries(raw))if(Number.isInteger(n)&&n>0)cart[id]=Math.min(n,20);
    return cart;
  }catch{return {};}
}
function initPixel(){
  if(pixelInitialized||consent()!=='yes'||!pixelIds.length)return;
  (function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)})(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
  for(const id of pixelIds)window.fbq('init',id);
  pixelInitialized=true;
}
function track(name,payload={}){
  if(!pixelInitialized||consent()!=='yes')return;
  for(const id of pixelIds){try{window.fbq('trackSingle',id,name,payload);}catch{}}
}
function trackOpen(){
  if(pixelEvents.has('view'))return;
  initPixel();
  if(!pixelInitialized)return;
  pixelEvents.add('view');
  track('PageView');
  track('ViewContent',{content_ids:[button.dataset.id],content_type:'product',content_name:button.dataset.name,contents:[{id:button.dataset.id,quantity:1,item_price:Number(button.dataset.price)}],value:Number(button.dataset.price),currency:'VND'});
}
async function loadPixelConfig(){
  try{
    const res=await fetch('/api/site',{cache:'no-store'});
    if(!res.ok)return;
    const json=await res.json();
    const m=json.site?.marketing||{};
    if(m.enabled==='yes')pixelIds=[...new Set(String(m.pixelIds||'').split(/[\r\n]+/).map(x=>x.trim()).filter(x=>/^\d{8,20}$/.test(x)))].slice(0,5);
  }catch{}
  trackOpen();
}
function setConsent(allow){
  try{localStorage.setItem(CONSENT_KEY,allow?'yes':'no');}catch{}
  if(consentBox)consentBox.hidden=true;
  if(allow)trackOpen();
  else if(pixelInitialized)location.reload();
}
document.getElementById('seo-consent-yes')?.addEventListener('click',()=>setConsent(true));
document.getElementById('seo-consent-no')?.addEventListener('click',()=>setConsent(false));
document.getElementById('seo-consent-settings')?.addEventListener('click',()=>{consentBox.hidden=false;});
if(consent()===null&&consentBox)consentBox.hidden=false;
const variantRoot=document.getElementById('seo-variants');
let variantConfig=null,selected=[];
if(variantRoot){try{variantConfig=JSON.parse(document.getElementById('seo-variants-data').textContent)}catch{};
 if(variantConfig?.axes?.length){selected=variantConfig.axes.map(()=>null);
  variantRoot.addEventListener('click',e=>{const b=e.target.closest('[data-variant-value]');if(!b||b.disabled)return;selected[Number(b.dataset.variantAxis)]=b.dataset.variantValue;updateSelection()});
  function updateSelection(){
   const key=selected.every(Boolean)?variantKey(selected):null;
   selectedVariant=variantConfig.items.find(v=>v.key===key)||null;
   variantRoot.querySelectorAll('[data-variant-value]').forEach(b=>b.classList.toggle('selected',selected[Number(b.dataset.variantAxis)]===b.dataset.variantValue));
   const stock=document.getElementById('seo-stock-status');const price=document.getElementById('seo-price');
   if(!selectedVariant){stock.textContent='Vui lòng chọn đủ phân loại.';button.disabled=true;return;}
   price.textContent=new Intl.NumberFormat('vi-VN').format(selectedVariant.price)+' ₫';
   stock.textContent=selectedVariant.stock>0?`Còn ${selectedVariant.stock.toLocaleString('vi-VN')} sản phẩm`:'Phân loại này đã hết hàng.';
   button.disabled=selectedVariant.stock<=0;
   if(selectedVariant.image){const thumb=[...document.querySelectorAll('[data-gallery-index]')].find(t=>t.querySelector('img')?.src===new URL(selectedVariant.image,location.origin).href);if(thumb)thumb.click();else{const img=document.getElementById('seo-gallery-main');if(img)img.src=selectedVariant.image}}
  }button.disabled=true;
 }
}
button?.addEventListener('click',()=>{
  const n=Number(quantity.value);
  if(!Number.isInteger(n)||n<1||n>20){status.textContent='Vui lòng chọn số lượng từ 1 đến 20.';quantity.focus();return;}
  if(variantConfig?.axes?.length&&!selectedVariant){status.textContent='Hãy chọn phân loại sản phẩm trước.';return;}
  const lineKey=selectedVariant?button.dataset.id+'@@'+encodeURIComponent(selectedVariant.key):button.dataset.id;
  const cart=readCart(),previous=cart[lineKey]||0;
  if(previous>=20){status.textContent='Giỏ hàng đã có tối đa 20 sản phẩm này.';return;}
  const available=selectedVariant?.stock??20;
  if(previous>=available){status.textContent='Số lượng đã đạt tồn kho của phân loại này.';return;}
  const added=Math.min(n,20-previous,available-previous);
  cart[lineKey]=previous+added;
  try{localStorage.setItem(CART_KEY,JSON.stringify(cart));}
  catch{status.textContent='Không thể lưu giỏ hàng trên trình duyệt này. Vui lòng thử lại.';return;}
  status.textContent=`Đã thêm ${added} sản phẩm vào giỏ. Bạn có thể xem giỏ hàng và hoàn tất đặt COD.`;
  const p=selectedVariant?.price??Number(button.dataset.price);
  track('AddToCart',{content_ids:[button.dataset.id],content_type:'product',content_name:button.dataset.name,contents:[{id:button.dataset.id,quantity:added,item_price:p}],value:p*added,currency:'VND'});
});
void loadPixelConfig();

// Chỉ người sở hữu đơn đã giao mới gửi được đánh giá; ADMIN duyệt trước khi hiển thị.
document.getElementById('seo-review-form')?.addEventListener('submit',async event=>{
 event.preventDefault();const form=event.currentTarget;
 const submit=document.getElementById('seo-review-submit');
 const message=document.getElementById('seo-review-status');
 submit.disabled=true;message.textContent='Đang xác minh đơn hàng...';
 try{
  const response=await fetch('/api/reviews',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({
   productId:button?.dataset.id,orderCode:document.getElementById('review-order').value.trim(),
   phone:document.getElementById('review-phone').value.trim(),rating:Number(document.getElementById('review-rating').value),
   comment:document.getElementById('review-comment').value.trim(),confirm:document.getElementById('review-confirm').checked
  })});
  const result=await response.json();
  if(!response.ok||!result.ok)throw new Error(result.error||'Không gửi được đánh giá.');
  message.textContent=result.message;form.reset();
 }catch(e){message.textContent=e.message}finally{submit.disabled=false}
});

// V1.3.9.4 – Gallery ảnh sản phẩm, thumbnail / phóng to / phím / thao tác vuốt.
(function initProductGallery(){
 const root=document.getElementById('seo-gallery');if(!root)return;
 let images=[];try{images=JSON.parse(document.getElementById('seo-gallery-data')?.textContent||'[]')}catch{}
 if(!Array.isArray(images)||!images.length)return;
 const main=document.getElementById('seo-gallery-main');const thumbs=[...root.querySelectorAll('[data-gallery-index]')];
 const lightbox=document.getElementById('seo-lightbox'),large=document.getElementById('seo-lightbox-image');
 const count=document.getElementById('seo-lightbox-count'),counter=root.querySelector('.seo-gallery-counter');
 let current=0,lastFocus=null;
 function setImage(index){
  current=(index+images.length)%images.length;main.src=images[current];
  main.alt=`Ảnh sản phẩm ${current+1}/${images.length}`;
  thumbs.forEach((b,i)=>{b.classList.toggle('selected',i===current);b.setAttribute('aria-pressed',String(i===current))});
  if(counter&&images.length>1)counter.textContent=`${current+1} / ${images.length} ảnh`;
  if(!lightbox.hidden){large.src=images[current];large.alt=main.alt;count.textContent=`${current+1} / ${images.length}`;}
 }
 function open(){lastFocus=document.activeElement;lightbox.hidden=false;large.src=images[current];large.alt=main.alt;count.textContent=`${current+1} / ${images.length}`;document.body.classList.add('gallery-lightbox-open');lightbox.querySelector('.seo-lightbox-close').focus()}
 function close(){lightbox.hidden=true;large.removeAttribute('src');document.body.classList.remove('gallery-lightbox-open');lastFocus?.focus?.()}
 thumbs.forEach((b,i)=>b.addEventListener('click',()=>setImage(i)));
 root.querySelectorAll('[data-gallery-step]').forEach(b=>b.addEventListener('click',()=>setImage(current+Number(b.dataset.galleryStep))));
 document.getElementById('seo-gallery-open')?.addEventListener('click',open);
 lightbox.querySelector('.seo-lightbox-close').addEventListener('click',close);
 lightbox.querySelector('.seo-lightbox-prev').addEventListener('click',()=>setImage(current-1));
 lightbox.querySelector('.seo-lightbox-next').addEventListener('click',()=>setImage(current+1));
 lightbox.addEventListener('click',e=>{if(e.target===lightbox)close()});
 document.addEventListener('keydown',e=>{
  if(!lightbox.hidden){if(e.key==='Escape'){e.preventDefault();close()};if(e.key==='ArrowRight')setImage(current+1);if(e.key==='ArrowLeft')setImage(current-1);}
 });
 let x=0;for(const element of [root.querySelector('.seo-image'),large]){
  element?.addEventListener('touchstart',e=>{x=e.changedTouches[0].clientX},{passive:true});
  element?.addEventListener('touchend',e=>{const diff=e.changedTouches[0].clientX-x;if(Math.abs(diff)>45&&images.length>1)setImage(current+(diff<0?1:-1))},{passive:true});
 }
})();
