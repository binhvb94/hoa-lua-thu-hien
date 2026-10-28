export async function onRequestGet({params,env,request}){
 if(!env.PRODUCT_IMAGES)return new Response('Storage not configured',{status:503});
 const key=String(params.key||'');
 if(!/^[a-f0-9-]{36}\.(?:jpg|png|webp)$/.test(key))return new Response('Not found',{status:404});
 const obj=await env.PRODUCT_IMAGES.get(key);
 if(!obj)return new Response('Not found',{status:404});
 const headers=new Headers();
 obj.writeHttpMetadata(headers);
 headers.set('Content-Type',obj.httpMetadata?.contentType||'application/octet-stream');
 headers.set('Content-Disposition','inline');
 headers.set('Cache-Control','public,max-age=31536000,immutable');
 headers.set('X-Content-Type-Options','nosniff');
 return new Response(request.method==='HEAD'?null:obj.body,{headers});
}
export const onRequestHead=onRequestGet;
