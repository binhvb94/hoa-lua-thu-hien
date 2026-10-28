import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createSession} from '../lib/admin-auth.js';
import {cleanSection} from '../lib/site-cms.js';
import {DEFAULT_SITE} from '../data/site-schema.js';
import {onRequestGet as publicGet} from '../functions/api/site.js';
import {onRequestGet as adminGet} from '../functions/api/admin/site/index.js';
import {onRequestGet as previewGet} from '../functions/api/admin/site/preview.js';
import {onRequestPost as saveDraft} from '../functions/api/admin/site/draft.js';
import {onRequestPost as publish} from '../functions/api/admin/site/publish.js';
import {onRequestPost as discard} from '../functions/api/admin/site/discard.js';
function fakeDB(){
 const row={published_json:'{}',draft_json:null,draft_rev:0,live_rev:0,published_at:null,updated_at:null};
 const sessions=new Map(),history=[];
 const db={prepare(sql){let args=[];return {bind(...v){args=v;return this},async first(){
  if(sql.includes('FROM site_cms'))return {...row};
  if(sql.includes('FROM admin_sessions'))return sessions.get(args[0])||null;
  throw new Error('Unexpected first: '+sql);
 },async run(){
  if(sql.startsWith('INSERT INTO admin_sessions')){sessions.set(args[0],{token_hash:args[0],csrf_token:args[1],expires_at:args[2]});return {meta:{changes:1}}}
  if(sql.startsWith('INSERT INTO admin_audit_logs'))return {meta:{changes:1}};
  if(sql.includes('SET draft_json=?')){if(row.draft_rev!==args[1])return {meta:{changes:0}};row.draft_json=args[0];row.draft_rev++;return {meta:{changes:1}}}
  if(sql.includes('SET published_json=draft_json')){if(row.draft_rev!==args[0]||row.draft_json===null)return {meta:{changes:0}};row.published_json=row.draft_json;row.draft_json=null;row.live_rev++;row.draft_rev++;return {meta:{changes:1}}}
  if(sql.includes('SET draft_json=NULL')){if(row.draft_rev!==args[0])return {meta:{changes:0}};row.draft_json=null;row.draft_rev++;return {meta:{changes:1}}}
  if(sql.startsWith('INSERT INTO site_publication_history')){if(row.draft_rev===args[1]&&row.draft_json!==null)history.push({...row});return {meta:{changes:1}}}
  throw new Error('Unexpected run: '+sql);
 }}},async batch(list){const out=[];for(const stmt of list)out.push(await stmt.run());return out;}};
 return {db,row,history};
}
async function request(fn,env,path,method='GET',body,login){
 const headers={Origin:'https://shop.test'};
 if(login){headers.Cookie=login.cookie.split(';')[0];headers['X-CSRF-Token']=login.csrf;}
 if(body!==undefined)headers['Content-Type']='application/json';
 const req=new Request('https://shop.test'+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
 const res=await fn({request:req,env});return {status:res.status,json:await res.json()};
}
test('CMS: public sees published only; draft stays authenticated; publish atomic; discard',async()=>{
 const state=fakeDB(),env={DB:state.db};
 const login=await createSession(env,new Request('https://shop.test/admin/'));
 let result=await request(previewGet,env,'/api/admin/site/preview');assert.equal(result.status,401);
 result=await request(publicGet,env,'/api/site');assert.equal(result.json.site.hero.description,DEFAULT_SITE.hero.description);
 const changed={...DEFAULT_SITE.hero,description:'Bản nháp mới'};
 result=await request(saveDraft,env,'/api/admin/site/draft','POST',{section:'hero',values:changed,baseRevision:0},login);assert.equal(result.status,200);
 result=await request(publicGet,env,'/api/site');assert.equal(result.json.site.hero.description,DEFAULT_SITE.hero.description);
 result=await request(previewGet,env,'/api/admin/site/preview','GET',undefined,login);assert.equal(result.json.site.hero.description,'Bản nháp mới');
 result=await request(adminGet,env,'/api/admin/site','GET',undefined,login);assert.equal(result.json.hasDraft,true);
 result=await request(publish,env,'/api/admin/site/publish','POST',{baseRevision:0},login);assert.equal(result.status,409);
 result=await request(publish,env,'/api/admin/site/publish','POST',{baseRevision:1},login);assert.equal(result.status,200);
 assert.equal(state.history.length,1);
 result=await request(publicGet,env,'/api/site');assert.equal(result.json.site.hero.description,'Bản nháp mới');
 const changed2={...changed,description:'Chưa xuất bản lần 2'};
 result=await request(saveDraft,env,'/api/admin/site/draft','POST',{section:'hero',values:changed2,baseRevision:2},login);assert.equal(result.status,200);
 result=await request(discard,env,'/api/admin/site/discard','POST',{baseRevision:3},login);assert.equal(result.status,200);
 result=await request(publicGet,env,'/api/site');assert.equal(result.json.site.hero.description,'Bản nháp mới');
});
test('CMS validation denies HTML fields outside schema / unsafe URLs and missing CSRF',async()=>{
 assert.throws(()=>cleanSection('hero',{...DEFAULT_SITE.hero,image:'javascript:alert(1)'}));
 assert.throws(()=>cleanSection('hero',{...DEFAULT_SITE.hero,fontSizeDesktop:'999'}));
 assert.throws(()=>cleanSection('hero',{...DEFAULT_SITE.hero,fontSizeMobile:'12px'}));
 assert.equal(cleanSection('hero',{...DEFAULT_SITE.hero,fontSizeDesktop:'50',fontSizeMobile:'34'}).fontSizeDesktop,'50');
 assert.throws(()=>cleanSection('hero',{...DEFAULT_SITE.hero,unknown:'<script>'}));
 assert.throws(()=>cleanSection('visibility',{...DEFAULT_SITE.visibility,story:'bad-value'}));
 const state=fakeDB(),env={DB:state.db};
 const response=await request(saveDraft,env,'/api/admin/site/draft','POST',{section:'hero',values:DEFAULT_SITE.hero,baseRevision:0});
 assert.equal(response.status,401);
});
