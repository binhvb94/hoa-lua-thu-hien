// Product option combinations: max. two independent axes, one SKU/price/stock/image per combination.
export const MAX_VARIANT_COMBINATIONS=60;
const tidy=(x,limit=60)=>typeof x==='string'?x.trim().replace(/[\u0000-\u001f\u007f]/g,' ').slice(0,limit):'';
const imageOK=x=>!x||(/^\/media\/[a-f0-9-]{36}\.(jpg|png|webp)$/.test(x)||/^https:\/\/[^\s<>"']{4,880}$/i.test(x));
export const variantKey=values=>values.map(x=>encodeURIComponent(x)).join('|');
export const emptyVariantConfig=()=>({axes:[],items:[]});
export function normalizeVariants(raw){
 if(raw==null||raw==='')return emptyVariantConfig();
 if(typeof raw!=='object'||Array.isArray(raw))throw Error('Dữ liệu phân loại không hợp lệ.');
 if(!Array.isArray(raw.axes)||!Array.isArray(raw.items)||raw.axes.length>2)throw Error('Chỉ hỗ trợ tối đa hai loại phân loại.');
 if(!raw.axes.length){if(raw.items.length)throw Error('Phân loại không có thuộc tính.');return emptyVariantConfig()}
 const axes=raw.axes.map((axis,i)=>{
  const name=tidy(axis?.name,40);if(!name)throw Error(`Nhập tên phân loại ${i+1}.`);
  if(!Array.isArray(axis.values)||!axis.values.length||axis.values.length>12)throw Error('Mỗi phân loại cần 1–12 lựa chọn.');
  const values=axis.values.map(v=>tidy(v,50));
  if(values.some(v=>!v)||new Set(values.map(v=>v.toLocaleLowerCase('vi'))).size!==values.length)throw Error(`Lựa chọn phân loại ${i+1} bị trùng hoặc trống.`);
  return {name,values};
 });
 if(axes.length===2&&axes[0].name.toLocaleLowerCase('vi')===axes[1].name.toLocaleLowerCase('vi'))throw Error('Hai phân loại phải khác tên.');
 const combinations=axes.reduce((a,axis)=>a.flatMap(values=>axis.values.map(v=>[...values,v])),[[]]);
 if(combinations.length>MAX_VARIANT_COMBINATIONS)throw Error(`Tối đa ${MAX_VARIANT_COMBINATIONS} tổ hợp phân loại.`);
 if(raw.items.length!==combinations.length)throw Error('Số tổ hợp biến thể không khớp phân loại.');
 const byKey=new Map();for(const item of raw.items){if(typeof item?.key!=='string'||byKey.has(item.key))throw Error('Tổ hợp phân loại bị trùng hoặc thiếu mã.');byKey.set(item.key,item)}
 const skuUsed=new Set();const items=combinations.map(values=>{
  const key=variantKey(values),p=byKey.get(key);if(!p)throw Error('Thiếu dữ liệu giá/tồn kho của một phân loại.');
  const price=Number(p.price),stock=Number(p.stock),sku=tidy(p.sku,60),image=tidy(p.image,900);
  if(!Number.isSafeInteger(price)||price<1000||price>100000000)throw Error(`Giá bán ${values.join(' / ')} phải từ 1.000 đến 100.000.000đ.`);
  if(!Number.isSafeInteger(stock)||stock<0||stock>1000000)throw Error(`Tồn kho ${values.join(' / ')} phải là số nguyên từ 0 đến 1.000.000.`);
  if(!imageOK(image))throw Error('Ảnh phân loại phải lấy từ R2 hoặc URL HTTPS.');
  if(sku){if(skuUsed.has(sku.toLowerCase()))throw Error('SKU phân loại phải duy nhất trong sản phẩm.');skuUsed.add(sku.toLowerCase())}
  return {key,values,price,stock,sku,image};
 });
 return {axes,items};
}
export function parseVariantConfig(raw){
 try{const parsed=typeof raw==='string'?JSON.parse(raw||'{}'):raw;return normalizeVariants(parsed)}catch{return emptyVariantConfig()}
}
export function publicVariantConfig(raw){return parseVariantConfig(raw)}
export const isVariantProduct=conf=>Boolean(conf?.axes?.length&&conf?.items?.length);
export const variantSummary=(item,conf)=>conf.axes.map((a,i)=>`${a.name}: ${item.values[i]}`).join(' · ');
