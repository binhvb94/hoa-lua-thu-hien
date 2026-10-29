// Điểm sao từ đánh giá có đơn đã giao và được duyệt.
// Doanh số COD được thống kê riêng, không đồng nhất với chỉ số bán đa kênh do ADMIN nhập.
export function roundRating(sum,total){return total?Math.round((sum/total)*100)/100:0;}
export function emptyStats(){return {soldCount:0,reviewCount:0,ratingAverage:0,ratingCounts:{1:0,2:0,3:0,4:0,5:0}};}
export async function productTrustMap(db){
 const output=new Map();
 // Cloudflare D1 hỗ trợ SQLite JSON1. orders.items_json ghi tại thời điểm đặt hàng.
 const saleRows=await db.prepare(`SELECT json_extract(i.value,'$.id') product_id,
  SUM(CAST(json_extract(i.value,'$.quantity') AS INTEGER)) sold
  FROM orders o, json_each(o.items_json) i
  WHERE o.status='delivered' GROUP BY product_id`).all();
 for(const x of saleRows.results||[]){if(!x.product_id)continue;const a=emptyStats();a.soldCount=Math.max(0,Number(x.sold)||0);output.set(x.product_id,a);}
 const reviewRows=await db.prepare(`SELECT r.product_id,r.rating,COUNT(*) n
  FROM product_reviews r JOIN orders o ON o.id=r.order_id
  WHERE r.is_approved=1 AND o.status='delivered'
  GROUP BY r.product_id,r.rating`).all();
 for(const x of reviewRows.results||[]){
  const id=x.product_id,rating=Number(x.rating),n=Number(x.n)||0;
  if(!id||rating<1||rating>5)continue;
  const a=output.get(id)||emptyStats();a.ratingCounts[rating]=n;
  output.set(id,a);
 }
 for(const entry of output.values()){
  entry.reviewCount=Object.values(entry.ratingCounts).reduce((x,y)=>x+y,0);
  entry.ratingAverage=roundRating(Object.entries(entry.ratingCounts).reduce((sum,[star,count])=>sum+Number(star)*count,0),entry.reviewCount);
 }
 return output;
}
export function applyTrust(p,map){
 const real=map.get(p.id)||emptyStats();
 const entered=Math.max(0,Math.trunc(Number(p.displaySoldCount??p.display_sold_count)||0));
 return {...p,...real,actualSoldCount:real.soldCount,displaySoldCount:entered,soldCount:entered};
}
const STOP=new Set(['hoa','canh','binh','cay','trang','tri','dep','cao','cap','san','pham','lua','gia','decor','thuhien','hang','chitiet','vietnam']);
export function keywords(p){return new Set(String([p.name,p.material,p.detail,p.size].join(' ')).toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').split(/[^a-z0-9]+/).filter(x=>x.length>=3&&!STOP.has(x)));}
function similarity(p,c){const a=keywords(p),b=keywords(c);let shared=0;for(const s of a)if(b.has(s))shared++;return shared*3+((c.categorySlugs||[c.category]).some(x=>(p.categorySlugs||[p.category]).includes(x))?3:0);}
export function recommendProducts(current,all,mode='mixed',limit=8,random=Math.random){
 const candidates=all.filter(c=>c.id!==current.id&&c.active!==false&&c.sample!==true);
 const compute=c=>{
  const similarityScore=similarity(current,c);
  const saleScore=Math.log1p(Math.max(0,c.soldCount||0));
  // Có ít đánh giá phải xếp sau sản phẩm được nhiều người xác thực.
  const rated=c.reviewCount?Math.max(0,(c.ratingAverage-3))*Math.log1p(c.reviewCount):0;
  if(mode==='best_selling')return saleScore*8+similarityScore*.15;
  if(mode==='top_rated')return rated*8+similarityScore*.15;
  if(mode==='similar')return similarityScore*8+saleScore*.3;
  return similarityScore*2+saleScore*2+rated*2;
 };
 const ranked=candidates.map(c=>({c,score:compute(c),rnd:random()})).sort((a,b)=>b.score-a.score||a.rnd-b.rnd);
 // Trộn trong nhóm có điểm gần nhau để không cố định 8 sản phẩm mỗi lần xem.
 const pool=ranked.slice(0,Math.min(ranked.length,Math.max(limit*2,limit)));
 const group=[];
 while(pool.length&&group.length<limit){
  const top=pool[0].score,near=Math.max(1,Math.min(pool.length,Math.ceil(pool.length/3)));
  const nearEqual=pool.slice(0,near).filter(x=>top-x.score<Math.max(1,top*.2));
  const choice=nearEqual.length?nearEqual[Math.floor(random()*nearEqual.length)]:pool[0];
  group.push(choice.c);pool.splice(pool.indexOf(choice),1);
 }
 return group;
}
