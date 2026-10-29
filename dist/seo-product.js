// V1.3.6: giỏ hàng trên trang SEO dùng CHUNG localStorage với trang chủ.
// Giữ nguyên dữ liệu sản phẩm do server render, không tính giá từ client khi đặt COD:
// /api/orders vẫn lấy giá chính thức từ D1.
const CART_KEY='thuhien_cart_v1';
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
button?.addEventListener('click',()=>{
  const n=Number(quantity.value);
  if(!Number.isInteger(n)||n<1||n>20){status.textContent='Vui lòng chọn số lượng từ 1 đến 20.';quantity.focus();return;}
  const cart=readCart(),previous=cart[button.dataset.id]||0;
  if(previous>=20){status.textContent='Giỏ hàng đã có tối đa 20 sản phẩm này.';return;}
  const added=Math.min(n,20-previous);
  cart[button.dataset.id]=previous+added;
  try{localStorage.setItem(CART_KEY,JSON.stringify(cart));}
  catch{status.textContent='Không thể lưu giỏ hàng trên trình duyệt này. Vui lòng thử lại.';return;}
  status.textContent=`Đã thêm ${added} sản phẩm vào giỏ. Bạn có thể xem giỏ hàng và hoàn tất đặt COD.`;
  const p=Number(button.dataset.price);
  track('AddToCart',{content_ids:[button.dataset.id],content_type:'product',content_name:button.dataset.name,contents:[{id:button.dataset.id,quantity:added,item_price:p}],value:p*added,currency:'VND'});
});
void loadPixelConfig();
