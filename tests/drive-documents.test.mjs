import test from 'node:test';
import assert from 'node:assert/strict';
import {createHandler} from '../supabase/functions/drive-documents/handler.mjs';
const user='11111111-1111-4111-8111-111111111111', caseId='22222222-2222-4222-8222-222222222222', docId='33333333-3333-4333-8333-333333333333';
const env={SUPABASE_URL:'https://project.supabase.co',SUPABASE_ANON_KEY:'public-test',SUPABASE_SERVICE_ROLE_KEY:'secret-test',GOOGLE_DRIVE_CLIENT_ID:'client-test',GOOGLE_DRIVE_CLIENT_SECRET:'client-secret-test',GOOGLE_DRIVE_REFRESH_TOKEN:'refresh-test',GOOGLE_DRIVE_ROOT_FOLDER_ID:'root123',PORTAL_PRIVACY_VERSION:'test-version'};
const response=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers});
function fixture(options={}) {
 const calls=[];let saved;
 const http=async(url,init={})=>{calls.push({url,init});
  if(url.endsWith('/auth/v1/user'))return response({id:user});
  if(url.includes('/rest/v1/portal_staff'))return response(options.staff?[{user_id:user}]:[]);
  if(url.includes('/rest/v1/portal_cases'))return response(options.allowed===false?[]:[{id:caseId,reference:'EXP-001'}]);
  if(url.includes('/rest/v1/portal_settings'))return response([{documentation_ready:options.ready!==false}]);
  if(url.includes('/rest/v1/portal_acknowledgments'))return response([{version:options.ack===false?'old':'test-version'}]);
  if(url.includes('/rest/v1/portal_documents')&&init.method==='POST'){saved=JSON.parse(init.body);return response({},options.failSave?500:201);}
  if(url.includes('/rest/v1/portal_documents'))return response(options.documentAllowed===false?[]:[{id:docId,path:caseId+'/'+user+'/'+docId,storage_provider:'google-drive',drive_file_id:'file123',name:'test.pdf',type:'application/pdf'}]);
  if(url.includes('oauth2.googleapis.com'))return response({access_token:'access-test'});
  if(url.includes('/upload/drive/v3/'))return response({},200,{location:'https://www.googleapis.com/upload-session'});
  if(url.endsWith('/upload-session'))return response({id:'file123'});
  if(url.includes('/drive/v3/files/root123?'))return response({mimeType:'application/vnd.google-apps.folder',shared:!!options.sharedRoot,capabilities:{canAddChildren:true}});
  if(url.includes('/drive/v3/files/casefolder123?'))return response({shared:false,parents:['root123'],capabilities:{canAddChildren:true}});
  if(url.includes('/drive/v3/files?'))return response({files:[{id:'casefolder123'}]});
  if(url.includes('/drive/v3/files/file123?alt=media'))return new Response('%PDF-fixture');
  if(url.includes('/drive/v3/files/file123?'))return response({appProperties:{portal_document_id:options.wrongId?'wrong':docId}});
  throw new Error('Unexpected mock endpoint '+url);
 };
 return {handle:createHandler({...env,...options.env},http),calls,get saved(){return saved;}};
}
function request({method='POST',headers={},body}={}){return new Request('https://project.supabase.co/functions/v1/drive-documents',{method,headers:{Authorization:'Bearer test-session',Origin:'https://inavarro-abogados.onrender.com',...headers},body});}
function upload(shared='true'){const f=new FormData();f.set('caseId',caseId);f.set('shared',shared);f.set('file',new Blob(['%PDF-test'],{type:'application/pdf'}),'prueba.pdf');return f;}
test('no session cannot touch Google or database',async()=>{const f=fixture();const r=await f.handle(request({headers:{Authorization:''},body:upload()}));assert.equal(r.status,401);assert.equal(f.calls.length,0);});
test('unapproved origin is rejected',async()=>{const f=fixture();assert.equal((await f.handle(request({headers:{Origin:'https://other.example'},body:upload()}))).status,403);assert.equal(f.calls.length,0);});
test('cross-case uploads do not write to Drive',async()=>{const f=fixture({allowed:false});assert.equal((await f.handle(request({body:upload()}))).status,403);assert.equal(f.calls.filter(c=>c.url.includes('drive/v3')).length,0);});
test('privacy acknowledgment and documentation gate are enforced',async()=>{for(const options of [{ack:false},{ready:false}]){const f=fixture(options);assert.equal((await f.handle(request({body:upload()}))).status,403);assert.equal(f.calls.filter(c=>c.url.includes('drive/v3')).length,0);}});
test('valid upload is private and client cannot share by forging form',async()=>{const f=fixture();const r=await f.handle(request({body:upload()}));assert.equal(r.status,200);assert.equal(f.saved.shared,0);assert.equal(f.saved.uploaded_by,user);assert.equal(f.saved.path,caseId+'/'+user+'/'+f.saved.id);assert.equal(f.saved.drive_file_id,'file123');assert.equal(f.calls.some(c=>c.url.includes('/permissions')),false);assert.equal(f.calls.some(c=>c.url.includes('/storage/')),false);});
test('staff can mark uploaded document as shared within its case',async()=>{const f=fixture({staff:true});assert.equal((await f.handle(request({body:upload()}))).status,200);assert.equal(f.saved.shared,1);});
test('a publicly/shared root is rejected before upload',async()=>{const f=fixture({sharedRoot:true});assert.equal((await f.handle(request({body:upload()}))).status,503);assert.equal(f.saved,undefined);});
test('wrong file signature is rejected',async()=>{const f=fixture();const form=upload();form.set('file',new Blob(['not-pdf'],{type:'application/pdf'}),'fake.pdf');assert.equal((await f.handle(request({body:form}))).status,400);assert.equal(f.saved,undefined);});
test('document downloads enforce row visibility and file identity',async()=>{for(const options of [{documentAllowed:false},{wrongId:true}]){const f=fixture(options);const req=new Request('https://project.supabase.co/functions/v1/drive-documents?id='+docId,{headers:{Authorization:'Bearer test-session'}});assert.equal((await f.handle(req)).status,404);assert.equal(f.calls.some(c=>c.url.includes('alt=media')),false);}});
test('authorized download streams without public Drive links',async()=>{const f=fixture();const r=await f.handle(new Request('https://project.supabase.co/functions/v1/drive-documents?id='+docId,{headers:{Authorization:'Bearer test-session'}}));assert.equal(r.status,200);assert.equal(await r.text(),'%PDF-fixture');assert.equal(r.headers.get('cache-control'),'no-store');});
test('missing OAuth credentials fails closed without fallback',async()=>{const f=fixture({env:{GOOGLE_DRIVE_REFRESH_TOKEN:''}});assert.equal((await f.handle(request({body:upload()}))).status,503);assert.equal(f.calls.some(c=>c.url.includes('googleapis.com')),false);});
test('ambiguous metadata failure preserves private uploaded file for reconciliation',async()=>{const f=fixture({failSave:true});assert.equal((await f.handle(request({body:upload()}))).status,502);assert.equal(f.calls.some(c=>c.init.method==='DELETE'),false);});
