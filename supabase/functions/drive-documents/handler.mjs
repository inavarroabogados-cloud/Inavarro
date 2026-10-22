const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DRIVE_ID = /^[A-Za-z0-9_-]+$/;
const MAX_BYTES = 10 * 1024 * 1024;
const API = 'https://www.googleapis.com/drive/v3/files';
class Failure extends Error { constructor(status, message) { super(message); this.status = status; } }
function requireValue(ok, status, message) { if (!ok) throw new Failure(status, message); }
export function validSignature(type, b) {
  return type === 'application/pdf' ? new TextDecoder().decode(b.slice(0, 5)) === '%PDF-' :
    type === 'image/jpeg' ? b[0] === 255 && b[1] === 216 && b[2] === 255 :
    type === 'image/png' ? [137,80,78,71,13,10,26,10].every((v,i) => b[i] === v) : false;
}
export function createHandler(env, http = fetch) {
  const origins = new Set((env.ALLOWED_ORIGINS || 'https://inavarro-abogados.onrender.com').split(',').map(s => s.trim()));
  return async function handle(req) {
    const origin = req.headers.get('origin');
    const headers = {'Cache-Control':'no-store', 'Vary':'Origin'};
    if (origin && origins.has(origin)) Object.assign(headers, {'Access-Control-Allow-Origin':origin, 'Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info', 'Access-Control-Allow-Methods':'GET, POST, OPTIONS'});
    const json = (body, status = 200) => new Response(JSON.stringify(body), {status, headers:{...headers,'Content-Type':'application/json'}});
    try {
      requireValue(!origin || origins.has(origin), 403, 'Origen no autorizado.');
      if (req.method === 'OPTIONS') return new Response(null, {status:204,headers});
      requireValue(['GET','POST'].includes(req.method), 405, 'Método no permitido.');
      const authorization = req.headers.get('authorization') || '';
      requireValue(/^Bearer \S+$/.test(authorization), 401, 'Inicia sesión.');
      const sbHeaders = {apikey:env.SUPABASE_ANON_KEY, authorization};
      const request = async (url, options, message = 'No se ha completado la operación.') => {
        const r = await http(url, options);
        requireValue(r.ok, r.status === 401 || r.status === 403 ? 403 : 502, message);
        return r;
      };
      const userResponse = await request(env.SUPABASE_URL + '/auth/v1/user', {headers:sbHeaders}, 'La sesión no es válida.');
      const user = await userResponse.json();
      requireValue(UUID.test(user.id), 401, 'La sesión no es válida.');
      const rows = async (query) => (await request(env.SUPABASE_URL + '/rest/v1/' + query, {headers:sbHeaders}, 'No tienes acceso a este expediente.')).json();
      const staff = (await rows('portal_staff?select=user_id&user_id=eq.' + user.id)).length > 0;
      const configured = ['GOOGLE_DRIVE_CLIENT_ID','GOOGLE_DRIVE_CLIENT_SECRET','GOOGLE_DRIVE_REFRESH_TOKEN','GOOGLE_DRIVE_ROOT_FOLDER_ID','SUPABASE_SERVICE_ROLE_KEY'].every(k => !!env[k]);
      const url = new URL(req.url);
      if (req.method === 'GET' && url.searchParams.get('action') === 'status') {
        requireValue(staff, 403, 'Acceso reservado al despacho.');
        return json({configured});
      }
      requireValue(configured, 503, 'La conexión con Google Drive está pendiente de completar por el despacho.');
      const tokenResponse = await request('https://oauth2.googleapis.com/token', {method:'POST',body:new URLSearchParams({client_id:env.GOOGLE_DRIVE_CLIENT_ID,client_secret:env.GOOGLE_DRIVE_CLIENT_SECRET,refresh_token:env.GOOGLE_DRIVE_REFRESH_TOKEN,grant_type:'refresh_token'})}, 'El despacho debe volver a conectar Google Drive.');
      const token = (await tokenResponse.json()).access_token;
      requireValue(typeof token === 'string' && token.length > 0, 502, 'No se ha podido conectar con Google Drive.');
      const gh = {Authorization:'Bearer ' + token};
      if (req.method === 'GET') {
        const id = url.searchParams.get('id') || '';
        requireValue(UUID.test(id), 400, 'Documento no válido.');
        // The caller's RLS policies enforce live session, case assignment and document visibility.
        const docs = await rows('portal_documents?select=id,path,name,type,storage_provider,drive_file_id&id=eq.' + id);
        requireValue(docs.length === 1, 404, 'Documento no disponible.');
        const d = docs[0]; const fileId = d.storage_provider === 'google-drive' ? d.drive_file_id : ''; 
        requireValue(DRIVE_ID.test(fileId), 400, 'Este documento utiliza otro almacenamiento.');
        const metadata = await (await request(API + '/' + fileId + '?fields=id,trashed,appProperties', {headers:gh}, 'Documento no disponible en Drive.')).json();
        requireValue(!metadata.trashed && metadata.appProperties?.portal_document_id === id, 404, 'Documento no disponible.');
        const file = await request(API + '/' + fileId + '?alt=media', {headers:gh}, 'No se ha podido descargar el documento.');
        return new Response(file.body, {headers:{...headers,'Content-Type':d.type,'Content-Disposition':"attachment; filename*=UTF-8''" + encodeURIComponent(d.name),'X-Content-Type-Options':'nosniff'}});
      }
      requireValue(!(Number(req.headers.get('content-length')) > MAX_BYTES + 65536), 413, 'El archivo supera los 10 MB.');
      // Bound the request even if Content-Length is absent or misleading.
      const chunks = []; let size = 0; const reader = req.body?.getReader();
      requireValue(reader, 400, 'Archivo no válido.');
      while (true) { const {done,value} = await reader.read(); if (done) break; size += value.length; if (size > MAX_BYTES + 65536) { await reader.cancel(); throw new Failure(413,'El archivo supera los 10 MB.'); } chunks.push(value); }
      const form = await new Response(new Blob(chunks), {headers:{'Content-Type':req.headers.get('content-type') || ''}}).formData();
      const file = form.get('file'); const caseId = String(form.get('caseId') || '');
      requireValue(UUID.test(caseId), 400, 'Expediente no válido.');
      requireValue(file && typeof file !== 'string' && file.size > 0 && file.size <= MAX_BYTES, 400, 'Selecciona un archivo de hasta 10 MB.');
      requireValue(validSignature(file.type,new Uint8Array(await file.slice(0,8).arrayBuffer())), 400, 'Selecciona un PDF, JPG o PNG válido.');
      const cases = await rows('portal_cases?select=id,reference&id=eq.' + caseId);
      requireValue(cases.length === 1, 403, 'No tienes acceso a este expediente.');
      const settings = await rows('portal_settings?select=documentation_ready&id=eq.1');
      requireValue(settings[0]?.documentation_ready === true, 403, 'La recepción de documentación no está habilitada.');
      if (!staff) {
        const ack = await rows('portal_acknowledgments?select=version&user_id=eq.' + user.id);
        requireValue(ack.some(a => a.version === env.PORTAL_PRIVACY_VERSION), 403, 'Revisa la información de privacidad vigente.');
      }
      const root = env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
      requireValue(DRIVE_ID.test(root), 503, 'Carpeta de Drive no configurada.');
      const parent = await (await request(API + '/' + root + '?fields=id,mimeType,trashed,shared,capabilities(canAddChildren)',{headers:gh},'No se puede acceder a la carpeta del despacho.')).json();
      requireValue(parent.mimeType === 'application/vnd.google-apps.folder' && !parent.trashed && parent.capabilities?.canAddChildren && !parent.shared, 503, 'La carpeta del portal debe ser privada y permitir añadir documentos.');
      const q = "'" + root + "' in parents and trashed = false and mimeType = 'application/vnd.google-apps.folder' and appProperties has { key='portal_case_id' and value='" + caseId + "' }";
      const folders = await (await request(API + '?' + new URLSearchParams({q,fields:'files(id)',pageSize:'100'}),{headers:gh})).json();
      let folderId = folders.files?.[0]?.id;
      if (!folderId) {
        const folder = await (await request(API + '?fields=id',{method:'POST',headers:{...gh,'Content-Type':'application/json'},body:JSON.stringify({name:String(cases[0].reference || caseId).slice(0,120),mimeType:'application/vnd.google-apps.folder',parents:[root],appProperties:{portal_case_id:caseId}})})).json();
        folderId = folder.id;
      }
      requireValue(DRIVE_ID.test(folderId),502,'No se ha podido crear la carpeta del expediente.');
      const caseFolder = await (await request(API + '/' + folderId + '?fields=id,shared,trashed,parents,capabilities(canAddChildren)',{headers:gh})).json();
      requireValue(!caseFolder.shared && !caseFolder.trashed && caseFolder.parents?.includes(root) && caseFolder.capabilities?.canAddChildren,503,'La carpeta del expediente debe ser privada y pertenecer al portal.');
      const id = crypto.randomUUID();
      const ext = file.type === 'application/pdf' ? '.pdf' : file.type === 'image/png' ? '.png' : '.jpg';
      const name = file.name.replace(/[\x00-\x1f\x7f/\\]/g,'_').replace(/\.[^.]+$/,'').slice(0,170) + ext;
      const start = await request('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id',{method:'POST',headers:{...gh,'Content-Type':'application/json','X-Upload-Content-Type':file.type,'X-Upload-Content-Length':String(file.size)},body:JSON.stringify({name,mimeType:file.type,parents:[folderId],appProperties:{portal_document_id:id,portal_case_id:caseId}})},'No se ha podido iniciar la subida a Drive.');
      const location = start.headers.get('location');
      requireValue(location && new URL(location).origin === 'https://www.googleapis.com',502,'Destino de subida no válido.');
      const uploaded = await (await request(location,{method:'PUT',headers:{...gh,'Content-Type':file.type},body:file},'No se ha podido guardar el documento en Drive.')).json();
      requireValue(DRIVE_ID.test(uploaded.id),502,'Drive no ha confirmado el archivo.');
      try {
        // Recheck access after upload; only this server writes Drive metadata with the service key.
        requireValue((await rows('portal_cases?select=id&id=eq.' + caseId)).length === 1,403,'Se ha revocado el acceso al expediente.');
        const saved = await http(env.SUPABASE_URL + '/rest/v1/portal_documents',{method:'POST',headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify({id,case_id:caseId,name,type:file.type,size:file.size,uploaded_by:user.id,shared:staff && form.get('shared') === 'true' ? 1 : 0,path:caseId+'/'+user.id+'/'+id,storage_provider:'google-drive',drive_file_id:uploaded.id})});
        requireValue(saved.ok,502,'No se ha podido registrar el documento.');
      } catch (error) {
        // Never delete on an ambiguous database response: keep the private file for recovery.
        // The appProperties document ID lets the operator reconcile it without losing client data.
        throw error;
      }
      return json({ok:true,id});
    } catch (e) {
      return json({error:e instanceof Failure ? e.message : 'No se ha podido completar la operación. El despacho revisará la conexión.'}, e instanceof Failure ? e.status : 502);
    }
  };
}
