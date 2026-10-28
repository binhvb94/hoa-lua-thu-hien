import { products as sampleProducts, categoryNames } from './data/products.js';
import {loadSiteContent, CMS_PREVIEW} from './site-frontend.js';
let products = [];

const cfg = window.SITE_CONFIG || {};
if (CMS_PREVIEW) cfg.previewMode = true;
const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));
const money = (num) => new Intl.NumberFormat('vi-VN', { style:'currency', currency:'VND', maximumFractionDigits:0 }).format(num);
const safeText = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const productById = (id) => products.find(p => p.id === id);
const productBySlug = (slug) => products.find(p => p.slug === slug);
const storeKey = 'thuhien_cart_v1';
const consentKey = 'thuhien_cookie_consent_v1';
let filter = 'all', search = '', sort = 'default', modal = null, lastFocus = null, selectedQty = 1;
let cart = readCart();
let pendingOrderKey = null;
let pixelInitialized = false;
let lastTrackedProduct = '';
let initialHashRouting = false;

function readCart() {
  try {
    const value = JSON.parse(localStorage.getItem(storeKey) || '{}');
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    const output = {};
    for (const [id, amount] of Object.entries(value)) if (Number.isInteger(amount) && amount > 0) output[id] = Math.min(amount, 20);
    return output;
  } catch { return {}; }
}
const cartItems = () => Object.entries(cart).map(([id, quantity]) => ({ product: productById(id), quantity })).filter(x => x.product);
const cartCount = () => cartItems().reduce((n, item) => n + item.quantity, 0);
const cartTotal = () => cartItems().reduce((n, item) => n + item.product.price * item.quantity, 0);
const pixelReady = () => pixelInitialized && typeof window.fbq === 'function';

function loadPixel() {
  if(CMS_PREVIEW) return;
  const id = String(cfg.pixelId || '').trim();
  if (pixelInitialized || !/^\d{8,20}$/.test(id)) return;
  // Tải script Meta Pixel chỉ SAU khi khách đồng ý cookie.
  (function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)})(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
  window.fbq('init', id);
  pixelInitialized = true;
}
function track(eventName, payload = {}, opts = {}) {
  if(CMS_PREVIEW) return;
  if (!pixelReady() || localStorage.getItem(consentKey) !== 'yes') return;
  try { window.fbq('track', eventName, payload, opts); } catch (err) { console.warn('Meta Pixel:',err); }
}
function productParams(p, qty = 1) {
  return {content_ids:[p.id], content_type:'product', content_name:p.name, contents:[{id:p.id,quantity:qty,item_price:p.price}], value:p.price*qty, currency:'VND'};
}
function cartParams() {
  return {content_ids:cartItems().map(i=>i.product.id), content_type:'product', contents:cartItems().map(i=>({id:i.product.id,quantity:i.quantity,item_price:i.product.price})), num_items:cartCount(), value:cartTotal(), currency:'VND'};
}
function currentConsent() { return localStorage.getItem(consentKey); }
function setConsent(value) {
  localStorage.setItem(consentKey, value);
  $('#cookie-banner').hidden = true;
  if (value === 'yes') {
    loadPixel();
    if (pixelReady()) {
      track('PageView');
      const slug = decodeURIComponent(location.hash.replace(/^#san-pham\//, ''));
      if (location.hash.startsWith('#san-pham/') && productBySlug(slug)) track('ViewContent',productParams(productBySlug(slug)));
    }
  } else if (pixelInitialized) {
    // Meta không cung cấp cơ chế unload Pixel đáng tin cậy: reload để ngừng tải/đo lường.
    location.reload();
  }
}
function setupConsent() {
  if(CMS_PREVIEW) { $('#cookie-banner').hidden=true; return; }
  if (currentConsent() === 'yes') { loadPixel(); track('PageView'); }
  else if (!currentConsent()) $('#cookie-banner').hidden = false;
  $('#cookie-accept').addEventListener('click', () => setConsent('yes'));
  $('#cookie-decline').addEventListener('click', () => setConsent('no'));
  $('#privacy-open').addEventListener('click', () => {
    const answer = confirm('Meta Pixel chỉ được bật khi bạn đồng ý. Chọn OK để đồng ý đo lường quảng cáo, hoặc Cancel để từ chối. Bạn có thể thay đổi lựa chọn tại đây bất cứ lúc nào.');
    setConsent(answer ? 'yes' : 'no');
  });
}
function renderProducts() {
  let listing = products.filter(p => (filter === 'all' || p.category === filter) && (!search || (p.name+' '+p.detail+' '+categoryNames[p.category]).toLocaleLowerCase('vi').includes(search.toLocaleLowerCase('vi'))));
  if(sort === 'low') listing.sort((a,b)=>a.price-b.price);
  if(sort === 'high') listing.sort((a,b)=>b.price-a.price);
  $('#result-count').textContent = `${listing.length} sản phẩm`;
  $('#empty-products').hidden = listing.length > 0;
  $('#product-grid').innerHTML = listing.map(p => `<article class="product-card">
    <div class="product-img-wrap tone-${p.tone}" data-view="${p.id}" role="button" tabindex="0" aria-label="Xem ${safeText(p.name)}"><img src="${safeText(p.image)}" alt="${safeText(p.name)}" loading="lazy" onerror="this.style.opacity='.03'" />${p.badge ? `<span class="product-tag">${safeText(p.badge)}</span>` : ''}
      <div class="product-card-actions"><button class="quick-view" data-view="${p.id}" type="button">Xem chi tiết</button><button class="quick-add" data-add="${p.id}" type="button">+ Thêm giỏ</button></div></div>
    <div class="product-info"><span class="product-category">${categoryNames[p.category]}</span><button class="product-name" data-view="${p.id}" type="button">${safeText(p.name)}</button><div class="product-price">${money(p.price)} ${p.oldPrice ? `<del>${money(p.oldPrice)}</del>`:''}</div></div>
  </article>`).join('');
}
function setFilter(nextFilter) {
  filter = nextFilter;
  $$('.filter-btn').forEach(b=>b.classList.toggle('selected', b.dataset.filter===filter));
  renderProducts();
}
function renderCart() {
  localStorage.setItem(storeKey, JSON.stringify(cart));
  const count=cartCount();
  $('#cart-badge').textContent = count;
  $('#cart-count-title').textContent = `(${count})`;
  $('#cart-subtotal').textContent = money(cartTotal());
  $('#checkout-button').disabled = !count;
  $('#cart-lines').innerHTML = count ? cartItems().map(({product:p,quantity})=>`<div class="cart-line"><img src="${safeText(p.image)}" alt="${safeText(p.name)}" loading="lazy" onerror="this.style.opacity='.05'"><div><h4>${safeText(p.name)}</h4><strong>${money(p.price)}</strong><div class="qty-control"><button data-qty="${p.id}" data-change="-1" aria-label="Giảm số lượng ${safeText(p.name)}">−</button><span>${quantity}</span><button data-qty="${p.id}" data-change="1" aria-label="Tăng số lượng ${safeText(p.name)}">+</button></div></div><button class="remove-item" data-remove="${p.id}" aria-label="Xóa ${safeText(p.name)}">×</button></div>`).join(''):'<div class="cart-empty"><span>✿</span><strong>Giỏ hoa còn trống</strong><p>Thêm vài nhành hoa xinh vào giỏ nhé!</p></div>';
}
function addToCart(id, qty=1) {
  const product=productById(id);
  if (!product) return;
  const previous=cart[id] || 0;
  const newQuantity=Math.min(20,previous+qty);
  if (newQuantity <= previous) return;
  cart[id]=newQuantity;
  pendingOrderKey = null;
  renderCart();
  track('AddToCart',productParams(product,newQuantity-previous));
  openUI('cart');
}
function changeQty(id, delta) {
  if(!cart[id]) return;
  const next=cart[id]+delta;
  if(next<=0) delete cart[id]; else cart[id]=Math.min(20,next);
  pendingOrderKey = null;
  renderCart();
}
function openUI(kind) {
  if(modal && modal!==kind) closeUI(true);
  lastFocus = document.activeElement;
  modal=kind;
  const element = kind==='cart' ? $('#cart-drawer') : $(`#${kind}-modal`);
  if(!element) return;
  element.classList.add('open');
  element.setAttribute('aria-hidden','false');
  $('#overlay').hidden=false;
  document.body.classList.add('locked');
  if(kind==='search') setTimeout(()=>$('#search-input').focus(),30);
  else if(kind==='cart') $('#cart-drawer .close-btn').focus();
  else if(kind!=='success') element.querySelector('button')?.focus();
}
function closeUI(fromSwitch=false) {
  if(!modal) return;
  const old=modal;
  const element = old==='cart' ? $('#cart-drawer') : $(`#${old}-modal`);
  element?.classList.remove('open');
  element?.setAttribute('aria-hidden','true');
  modal=null;
  $('#overlay').hidden=true;
  document.body.classList.remove('locked');
  if(!fromSwitch) lastFocus?.focus?.();
  if(old==='product' && !fromSwitch && location.hash.startsWith('#san-pham/')) location.hash='bo-suu-tap';
}
function showProduct(p) {
  selectedQty=1;
  $('#product-modal-content').innerHTML=`<div class="product-detail"><div class="product-detail-photo tone-${p.tone}"><img src="${safeText(p.image)}" alt="${safeText(p.name)}" onerror="this.style.opacity='.03'"></div><div class="product-detail-copy"><span class="overline">${safeText(categoryNames[p.category])} / ${safeText(p.id)}</span><h2>${safeText(p.name)}</h2><div class="detail-price">${money(p.price)}${p.oldPrice?`<del>${money(p.oldPrice)}</del>`:''}</div><p>${safeText(p.detail)}</p><div class="detail-properties"><div><b>Chất liệu:</b> ${safeText(p.material)}</div><div><b>Kích thước:</b> ${safeText(p.size)}</div><div><b>Tình trạng:</b> Liên hệ xác nhận tồn kho</div></div><span class="overline">SỐ LƯỢNG</span><div class="detail-actions"><div class="detail-qty"><button id="detail-minus" aria-label="Giảm số lượng">−</button><span id="detail-quantity">1</span><button id="detail-plus" aria-label="Tăng số lượng">+</button></div><button id="detail-add" class="btn btn-primary">Thêm vào giỏ <span>→</span></button></div></div></div>`;
  $('#detail-minus').onclick=()=>{selectedQty=Math.max(1,selectedQty-1);$('#detail-quantity').textContent=selectedQty};
  $('#detail-plus').onclick=()=>{selectedQty=Math.min(20,selectedQty+1);$('#detail-quantity').textContent=selectedQty};
  $('#detail-add').onclick=()=>addToCart(p.id,selectedQty);
  if(modal!=='product') openUI('product');
  if(lastTrackedProduct!==p.id || modal==='product') {
    lastTrackedProduct=p.id;
    if (!initialHashRouting) track('PageView');
    track('ViewContent',productParams(p));
  }
}
function routeHash() {
  if(location.hash.startsWith('#san-pham/')) {
    let slug=''; try {slug=decodeURIComponent(location.hash.slice('#san-pham/'.length));} catch {return;}
    const p=productBySlug(slug);
    if(p) showProduct(p);
  } else if(modal==='product') closeUI();
}
function openProduct(id) {
  const p=productById(id);
  if(!p) return;
  if(location.hash===`#san-pham/${p.slug}`) showProduct(p);
  else location.hash=`san-pham/${p.slug}`;
}
function startCheckout() {
  if(!cartCount()) return;
  $('#checkout-summary-lines').innerHTML=cartItems().map(({product:p,quantity})=>`<div class="summary-item"><img src="${safeText(p.image)}" alt="" onerror="this.style.opacity='.05'"><span><strong>${safeText(p.name)}</strong><small>Số lượng: ${quantity}</small></span><b>${money(p.price*quantity)}</b></div>`).join('');
  $('#checkout-total').textContent=money(cartTotal());
  $('#order-status').textContent='';
  track('InitiateCheckout',cartParams());
  openUI('checkout');
}
async function sendJSON(path,data,extraHeaders={}) {
  let response;
  try {response=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json',...extraHeaders},body:JSON.stringify(data)});}
  catch {throw new Error('Không thể kết nối máy chủ. Vui lòng thử lại hoặc liên hệ trực tiếp qua Fanpage.');}
  let body;
  try {body=await response.json();} catch {throw new Error('Phản hồi từ máy chủ không hợp lệ. Hãy kiểm tra kết nối hosting.');}
  if(!response.ok || !body.ok) throw new Error(body.error || `Lỗi máy chủ (${response.status})`);
  return body;
}
async function submitOrder(evt) {
  evt.preventDefault();
  const form=evt.currentTarget, button=$('.order-submit',form), status=$('#order-status');
  if (cfg.previewMode) { status.textContent='Bản xem trước chưa tiếp nhận đơn hàng. Vui lòng nhắn Fanpage để được tư vấn.'; status.className='form-status error'; return; }
  if(!form.reportValidity() || !cartCount()) return;
  if(!pendingOrderKey) pendingOrderKey=(crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`);
  const payload={name:$('#order-name').value.trim(),phone:$('#order-phone').value.trim(),address:$('#order-address').value.trim(),note:$('#order-note').value.trim(),payment_method:'cod',items:cartItems().map(({product:p,quantity})=>({id:p.id,quantity}))};
  const eventDetails=cartParams();
  button.disabled=true;
  status.textContent='Đang ghi nhận đơn hàng...'; status.className='form-status';
  try {
    const result=await sendJSON('/api/orders',payload,{'Idempotency-Key':pendingOrderKey});
    // Chỉ bắn Purchase khi API đã lưu một đơn hợp lệ, không bắn trên click hoặc khi có lỗi.
    // Với COD: đây là đơn được tiếp nhận, KHÔNG có nghĩa là khách đã thanh toán.
    if(!result.duplicate) track('Purchase',{...eventDetails,value:result.total,currency:'VND',order_id:result.order_id},{eventID:`purchase-${result.order_id}`});
    $('#success-order-id').textContent=result.order_code;
    cart={};renderCart();pendingOrderKey=null;
    form.reset();
    openUI('success');
  } catch(e) {status.textContent=e.message;status.className='form-status error';}
  finally {button.disabled=false;}
}
async function submitRegistration(evt) {
  evt.preventDefault();
  const form=evt.currentTarget, button=$('.register-submit',form), status=$('#register-status');
  if (cfg.previewMode) { status.textContent='Bản xem trước chưa nhận đăng ký. Vui lòng liên hệ Fanpage.'; status.className='form-status error'; return; }
  if(!form.reportValidity()) return;
  button.disabled=true;status.textContent='Đang ghi nhận đăng ký...';status.className='form-status';
  try {
    const result=await sendJSON('/api/register',{name:$('#reg-name').value.trim(),phone:$('#reg-phone').value.trim(),email:$('#reg-email').value.trim(),marketing_consent:$('#register-consent').checked});
    if(result.created) {
      track('CompleteRegistration',{status:'registered',content_name:'Thanh vien Hoa Lua Thu Hien'},{eventID:`registration-${result.registration_id}`});
      status.textContent='Cảm ơn bạn! Đăng ký thành viên đã được ghi nhận.';form.reset();
    } else status.textContent='Số điện thoại này đã đăng ký rồi. Cảm ơn bạn đã đồng hành!';
    status.className='form-status success';
  } catch(e) {status.textContent=e.message;status.className='form-status error';}
  finally{button.disabled=false;}
}
function applyContactConfig() {
  if(cfg.facebookPage && /^https:\/\/(www\.)?facebook\.com\//i.test(cfg.facebookPage)) {
    $('#fb-link').href=cfg.facebookPage;
    $$('.floating-contact a').forEach(a=>a.href=cfg.facebookPage);
  }
  const phone=String(cfg.zaloPhone || '').replace(/[^\d]/g,'');
  if(/^0\d{9}$/.test(phone)) {$('#zalo-link').href=`https://zalo.me/${phone}`;$('#contact-phone').textContent=phone;}
  else {$('#zalo-link').href='#lien-he';$('#zalo-link').style.opacity='.6';$('#zalo-link').addEventListener('click',e=>{e.preventDefault();alert('Cần bổ sung số Zalo chính thức tại file config.js trước khi sử dụng.');});}
}
function setupEvents() {
  document.addEventListener('click', e=>{
    const add=e.target.closest('[data-add]'); if(add){e.preventDefault();e.stopPropagation();addToCart(add.dataset.add);return;}
    const view=e.target.closest('[data-view]');if(view){e.preventDefault();openProduct(view.dataset.view);return;}
    const qty=e.target.closest('[data-qty]');if(qty){changeQty(qty.dataset.qty,Number(qty.dataset.change));return;}
    const remove=e.target.closest('[data-remove]');if(remove){changeQty(remove.dataset.remove,-100);return;}
    const category=e.target.closest('[data-category-link]');if(category){search='';setFilter(category.dataset.categoryLink);}
    if(e.target.closest('[data-close]'))closeUI();
  });
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape' && modal)closeUI();
    if((e.key==='Enter'||e.key===' ') && e.target.matches('.product-img-wrap[data-view]')){e.preventDefault();openProduct(e.target.dataset.view);}
  });
  window.addEventListener('hashchange',routeHash);
  $('#overlay').addEventListener('click',()=>closeUI());
  $('#open-cart').addEventListener('click',()=>openUI('cart'));
  $('#open-search').addEventListener('click',()=>openUI('search'));
  $('#continue-shopping').addEventListener('click',()=>closeUI());
  $('#checkout-button').addEventListener('click',startCheckout);
  $('#checkout-form').addEventListener('submit',submitOrder);
  $('#register-form').addEventListener('submit',submitRegistration);
  $('#success-close').addEventListener('click',()=>closeUI());
  $('#open-menu').addEventListener('click',()=>{const m=$('#mobile-menu');m.hidden=!m.hidden;$('#open-menu').setAttribute('aria-expanded',String(!m.hidden));});
  $$('#mobile-menu a').forEach(a=>a.addEventListener('click',()=>{$('#mobile-menu').hidden=true;$('#open-menu').setAttribute('aria-expanded','false');}));
  $$('.filter-btn').forEach(b=>b.addEventListener('click',()=>{search='';setFilter(b.dataset.filter);}));
  $('#sort-products').addEventListener('change',e=>{sort=e.target.value;renderProducts();});
  $('#search-form').addEventListener('submit',e=>{
    e.preventDefault();search=$('#search-input').value.trim().slice(0,120);setFilter('all');
    if(search)track('Search',{search_string:search});
    closeUI();location.hash='bo-suu-tap';
  });
  $('#float-top').addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
}
async function loadCatalog(){
  try {
    const res=await fetch('/api/products',{cache:'no-store'});
    if(!res.ok)throw new Error('API chưa khả dụng');
    const data=await res.json();
    if(!data.ok||!Array.isArray(data.products))throw new Error('Danh mục không hợp lệ');
    products=data.products;
    const label=document.querySelector('.sample-disclaimer');
    if(label)label.textContent=products.some(p=>p.sample)?'* Một số sản phẩm/giá đang là dữ liệu minh họa. Vui lòng xác nhận trước khi đặt hàng.':'';
  }catch(e){
    if(cfg.previewMode)products=sampleProducts.map(p=>({...p,sample:true}));
    else products=[];
    const label=document.querySelector('.sample-disclaimer');
    if(label)label.textContent=cfg.previewMode?'* Chưa kết nối D1; đang hiển thị dữ liệu minh họa.':'Không thể tải danh mục sản phẩm. Vui lòng liên hệ cửa hàng.';
    console.warn('Product catalog:',e);
  }
  cart=Object.fromEntries(Object.entries(cart).filter(([id])=>products.some(p=>p.id===id)));
  renderProducts();renderCart();
}
async function init(){
  try{await loadSiteContent()}catch{return;}
  $('#copyright-year').textContent=String(new Date().getFullYear());
  if (cfg.previewMode) {
    $('#preview-banner').hidden=false;
    $('.register-submit').disabled=true;
    $('#register-status').textContent='Bản xem trước: đăng ký tạm khóa cho đến khi website hoàn thiện.';
    $('.order-submit').disabled=true;
    $('#order-status').textContent='Bản xem trước: chưa tiếp nhận đơn hàng.';
  }
  setupEvents();applyContactConfig();setupConsent();
  await loadCatalog();
  initialHashRouting = true; routeHash(); initialHashRouting = false;
}
init();
