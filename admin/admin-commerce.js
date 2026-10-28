let api, toast, currentOrder=null, orderPage=1, customerPage=1, currentView='products';
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND',maximumFractionDigits:0}).format(Number(n)||0);
const labels={new:'Đặt hàng',shipping:'Đang giao',delivered:'Đã giao',cancelled:'Đơn hủy'};
export function statusLabel(s){return labels[s]||'Không xác định';}
function timeText(value){if(!value)return '—';const date=/^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d$/.test(value)?new Date(value.replace(' ','T')+'Z'):new Date(value);return Number.isNaN(date.getTime())?'—':new Intl.DateTimeFormat('vi-VN',{dateStyle:'short',timeStyle:'short',timeZone:'Asia/Ho_Chi_Minh'}).format(date)}
function pageControl(prefix,page,total){const pages=Math.max(1,Math.ceil(total/20));$(`#${prefix}-page`).textContent=`${page} / ${pages}`;$(`#${prefix}-prev`).disabled=page<=1;$(`#${prefix}-next`).disabled=page>=pages;}
async function loadOrders(){
 const params=new URLSearchParams({page:String(orderPage),q:$('#orders-search').value.trim(),status:$('#orders-status').value});
 try{
  const result=await api('/orders?'+params,{method:'GET'});
  if(currentView!=='orders')return;
  const counts=result.counts||{};for(const status of Object.keys(labels))$(`#order-count-${status}`).textContent=counts[status]||0;
  $('#orders-list').innerHTML=result.orders.map(o=>`<tr><td><strong>${esc(o.order_code)}</strong><small class="commerce-sub">${esc(timeText(o.created_at))}</small></td><td><strong>${esc(o.customer_name)}</strong><small class="commerce-sub">${esc(o.phone)}</small></td><td><strong>${money(o.total)}</strong></td><td><span class="pill order-${esc(o.status)}">${esc(statusLabel(o.status))}</span></td><td><button class="action-btn" data-order-view="${esc(o.id)}">Xem / Cập nhật</button></td></tr>`).join('');
  $('#orders-empty').hidden=result.orders.length>0;
  $('#orders-foot').textContent=`${result.total} đơn phù hợp · ${Object.values(counts).reduce((a,b)=>a+Number(b||0),0)} đơn tổng cộng`;
  pageControl('orders',orderPage,result.total);
 }catch(e){toast(e.message,true);$('#orders-list').replaceChildren();$('#orders-empty').hidden=false;$('#orders-foot').textContent='Không tải được đơn hàng.';}
}
async function loadCustomers(){
 const params=new URLSearchParams({page:String(customerPage),q:$('#customers-search').value.trim()});
 try{
  const result=await api('/customers?'+params,{method:'GET'});
  if(currentView!=='customers')return;
  $('#customers-total').textContent=result.total;
  $('#customers-list').innerHTML=result.customers.map(c=>`<tr><td><strong>${esc(c.full_name)}</strong></td><td>${esc(c.phone)}</td><td>${esc(c.email||'—')}</td><td><span class="pill ${c.marketing_consent?'active':'hidden'}">${c.marketing_consent?'Đã đồng ý':'Chưa đồng ý'}</span></td><td>${esc(timeText(c.created_at))}</td></tr>`).join('');
  $('#customers-empty').hidden=result.customers.length>0;
  $('#customers-foot').textContent=`${result.total} người đăng ký nhận tin (không liên kết với đơn hàng)`;
  pageControl('customers',customerPage,result.total);
 }catch(e){toast(e.message,true);$('#customers-list').replaceChildren();$('#customers-empty').hidden=false;$('#customers-foot').textContent='Không tải được danh sách đăng ký.';}
}
export async function openCommerce(view){currentView=view;await (view==='orders'?loadOrders():loadCustomers());}
export function closeCommercePanel(){currentOrder=null;const backdrop=$('#order-detail-backdrop');if(backdrop)backdrop.hidden=true;document.body.style.overflow='';}
async function viewOrder(id){
 try{
  const r=await api('/orders/'+encodeURIComponent(id),{method:'GET'});currentOrder=r.order;
  $('#order-detail-heading').textContent='Đơn '+r.order.order_code;
  const o=r.order;
  const lines=o.items.map(i=>`<tr><td>${esc(i.name||i.id)}</td><td>${Number(i.quantity)||0}</td><td>${money(i.price)}</td><td>${money(i.line_total)}</td></tr>`).join('');
  $('#order-detail-body').innerHTML=`
   <div class="order-detail-group"><h3>Thông tin khách đặt</h3><dl><dt>Họ tên</dt><dd>${esc(o.customer_name)}</dd><dt>Số điện thoại</dt><dd>${esc(o.phone)}</dd><dt>Địa chỉ giao hàng</dt><dd>${esc(o.address)}</dd><dt>Ghi chú</dt><dd>${esc(o.note||'Không có')}</dd></dl></div>
   <div class="order-detail-group"><h3>Thông tin đơn hàng</h3><dl><dt>Mã đơn</dt><dd>${esc(o.order_code)}</dd><dt>Ngày đặt</dt><dd>${esc(timeText(o.created_at))}</dd><dt>Thanh toán</dt><dd>${o.payment_method==='cod'?'COD – Thanh toán khi nhận hàng':esc(o.payment_method)}</dd></dl></div>
   <div class="order-detail-group"><h3>Danh sách sản phẩm</h3><div class="table-wrap"><table><thead><tr><th>SẢN PHẨM</th><th>SL</th><th>ĐƠN GIÁ</th><th>THÀNH TIỀN</th></tr></thead><tbody>${lines}</tbody></table></div><div class="order-totals"><span>Tạm tính</span><b>${money(o.subtotal)}</b><span>Phí giao hàng</span><b>${money(o.shipping_fee)}</b><span>Tổng đơn</span><strong>${money(o.total)}</strong></div></div>
   <div class="order-detail-group"><h3>Cập nhật trạng thái</h3><label class="field">Trạng thái đơn hàng<select id="order-detail-status">${Object.entries(labels).map(([k,v])=>`<option value="${k}" ${k===o.status?'selected':''}>${v}</option>`).join('')}</select></label><p class="commerce-note">Thay đổi trạng thái chỉ cập nhật đơn hàng. Không thay đổi danh sách khách đăng ký nhận tin.</p></div>
   <div class="order-detail-group"><h3>Lịch sử trạng thái</h3><div class="timeline">${r.history.length?r.history.map(h=>`<p>${esc(timeText(h.changed_at))}: ${esc(statusLabel(h.previous_status))} → <b>${esc(statusLabel(h.new_status))}</b></p>`).join(''):'<p>Chưa có lần cập nhật trạng thái.</p>'}</div></div>`;
  $('#order-detail-save').disabled=true;
  $('#order-detail-status').addEventListener('change',e=>{$('#order-detail-save').disabled=e.target.value===o.status;});
  $('#order-detail-backdrop').hidden=false;document.body.style.overflow='hidden';
 }catch(e){toast(e.message,true)}
}
async function saveOrderStatus(){
 if(!currentOrder)return;
 const next=$('#order-detail-status').value,old=currentOrder.status;
 if(next===old)return;
 if((next==='cancelled'||next==='delivered')&&!confirm(`Xác nhận chuyển đơn ${currentOrder.order_code} sang "${statusLabel(next)}"?`))return;
 const button=$('#order-detail-save');button.disabled=true;
 try{
  await api('/orders/'+encodeURIComponent(currentOrder.id),{method:'PATCH',body:JSON.stringify({status:next,expectedStatus:old})});
  const id=currentOrder.id;toast('Đã cập nhật đơn hàng sang: '+statusLabel(next));
  await loadOrders();await viewOrder(id);
 }catch(e){toast(e.message,true);await viewOrder(currentOrder.id);}
 finally{button.disabled=false;}
}
export function initCommerce({call,toast:notify}){
 api=call;toast=notify;
 let searchTimer;
 $('#orders-search').addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>{orderPage=1;loadOrders();},250)});
 $('#orders-status').addEventListener('change',()=>{orderPage=1;loadOrders()});
 $('#orders-refresh').addEventListener('click',loadOrders);
 $('#orders-prev').addEventListener('click',()=>{if(orderPage>1){orderPage--;loadOrders();}});
 $('#orders-next').addEventListener('click',()=>{orderPage++;loadOrders();});
 $('#orders-list').addEventListener('click',e=>{const target=e.target.closest('[data-order-view]');if(target)viewOrder(target.dataset.orderView);});
 $('#customers-search').addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>{customerPage=1;loadCustomers();},250)});
 $('#customers-refresh').addEventListener('click',loadCustomers);
 $('#customers-prev').addEventListener('click',()=>{if(customerPage>1){customerPage--;loadCustomers();}});
 $('#customers-next').addEventListener('click',()=>{customerPage++;loadCustomers();});
 $('#order-detail-close').addEventListener('click',closeCommercePanel);
 $('#order-detail-cancel').addEventListener('click',closeCommercePanel);
 $('#order-detail-save').addEventListener('click',saveOrderStatus);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#order-detail-backdrop').hidden)closeCommercePanel();});
 // Nếu ADMIN đang xem danh sách, đồng bộ dữ liệu mới sau tối đa khoảng 30 giây.
 setInterval(()=>{if(document.visibilityState==='visible'&&$('#order-detail-backdrop').hidden){if(currentView==='orders')loadOrders();else if(currentView==='customers')loadCustomers();}},30000);
}
