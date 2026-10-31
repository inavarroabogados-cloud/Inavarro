# Evidencia del código comprimido

Procedencia: `portal-release.mjs:7`, blob SHA-256 `60623eb897d25fe3a319ff15938cb5c4c1cdf3e69a84b4c6c3ac48f82f6f47f1`.

Entradas `source/…` extraídas sin ejecutar el paquete. Numeración original, no líneas de este documento. No se incluyen archivos de configuración con valores ni datos de usuarios.

## source/src/client.ts

```text
1: import {createClient} from '@supabase/supabase-js';
2: const url=import.meta.env.VITE_SUPABASE_URL?.trim();const key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
3: export const configured=import.meta.env.VITE_AUTH_READY==='true'&&!!url&&url.startsWith('https://')&&!!key&&key.startsWith('sb_publishable_');
4: // Managed session and PKCE verifier storage, shared across tabs for email callbacks.
5: // Passwords, privileged keys and document data are never stored here.
6: export const supabase=configured?createClient(url!,key!,{auth:{flowType:'pkce',persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storage:window.localStorage}}):null;
7: export const googleConfigured=import.meta.env.VITE_GOOGLE_LOGIN_ENABLED==='true';
8: export const PRIVACY_VERSION='2026-10-12-password';
9: export function client(){if(!supabase)throw new Error('El acceso todavía no está configurado.');return supabase;}
10: export function check<R extends {data?:unknown;error:{message:string}|null}>(r:R):NonNullable<R['data']>{if(r.error)throw new Error(r.error.message);return r.data as NonNullable<R['data']>;}
```

## source/src/api.ts

```text
4: export async function portalRequest(path:string,options?:{method?:string;body?:BodyInit|null;headers?:Record<string,string>;cache?:string}){try{
5:  const u=await user();if(!u)throw new Error('Inicia sesión.');
6:  if(path==='/api/portal'&&!options?.method){check(await sb().rpc('claim_portal_grants'));const staff=check(await sb().from('portal_staff').select('user_id').eq('user_id',u.id));const owner=staff.length>0;const ack=check(await sb().from('portal_acknowledgments').select('version').eq('user_id',u.id).maybeSingle());const acknowledged=owner||ack?.version===PRIVACY_VERSION;const settings=check(await sb().from('portal_settings').select('documentation_ready').eq('id',1).single());if(!acknowledged)return response({owner,ready:false,acknowledged:false,cases:[],documents:[],grants:[],registrations:[]});
7:  const cases=check(await sb().from('portal_cases').select('*').order('updated',{ascending:false}));const documents=check(await sb().from('portal_documents').select('*').order('created',{ascending:false}));const grants=owner?check(await sb().from('portal_grants').select('*')):[];const registrations=owner?check(await sb().rpc('portal_registrations')):[];return response({owner,ready:settings.documentation_ready,acknowledged,cases,documents,grants,registrations});}
8:  if(path==='/api/portal'){const b=JSON.parse(String(options?.body));
9:  if(b.action==='acknowledge'){if(b.version!==PRIVACY_VERSION)throw new Error('Revisa la información vigente.');check(await sb().from('portal_acknowledgments').upsert({user_id:u.id,version:PRIVACY_VERSION}));}
10:  else if(b.action==='activateDocumentation'){if(b.reviewed!==true)throw new Error('Revisa primero la configuración de privacidad.');check(await sb().from('portal_settings').update({documentation_ready:true}).eq('id',1).select().single());}
11:  else if(b.action==='saveCase'){const c={reference:b.reference,title:b.title,status:b.status,summary:b.summary};if(b.id)check(await sb().from('portal_cases').update(c).eq('id',b.id).select().single());else check(await sb().from('portal_cases').insert(c).select().single());}
12:  else if(b.action==='grant'){const old=check(await sb().from('portal_grants').select('id').eq('case_id',b.caseId).eq('email',b.email.toLowerCase()).maybeSingle());if(old)check(await sb().from('portal_grants').update({active:1}).eq('id',old.id).select().single());else check(await sb().from('portal_grants').insert({case_id:b.caseId,email:b.email.toLowerCase(),active:1}).select().single());}
13:  else if(b.action==='revoke')check(await sb().from('portal_grants').update({active:0}).eq('id',b.id).select().single());
14:  else if(b.action==='shareDocument')check(await sb().from('portal_documents').update({shared:b.shared?1:0}).eq('id',b.id).select().single());
15:  else throw new Error('Acción no válida.');return response({ok:true});}
16:  if(path==='/api/documentos'){const form=options?.body;if(!(form instanceof FormData))throw new Error('Archivo no válido.');const file=form.get('file');if(!(file instanceof File)||!file.size||file.size>10485760||!['application/pdf','image/png','image/jpeg'].includes(file.type))throw new Error('Selecciona PDF, JPG o PNG de hasta 10 MB.');const head=new Uint8Array(await file.slice(0,8).arrayBuffer());if(!validSignature(file.type,head))throw new Error('El contenido no coincide con el formato del archivo.');const caseId=String(form.get('caseId'));const id=crypto.randomUUID();const objectPath=caseId+'/'+u.id+'/'+id;const ext=file.type==='application/pdf'?'.pdf':file.type==='image/png'?'.png':'.jpg';const name=file.name.replace(/[\x00-\x1f\x7f/\\]/g,'_').replace(/\.[^.]+$/,'').slice(0,170)+ext;check(await sb().storage.from('client-documents').upload(objectPath,file,{upsert:false,contentType:file.type,cacheControl:'0'}));try{check(await sb().from('portal_documents').insert({id,case_id:caseId,name,type:file.type,size:file.size,uploaded_by:u.id,shared:form.get('shared')==='true'?1:0,path:objectPath}).select('id').single());}catch(e){await sb().storage.from('client-documents').remove([objectPath]);throw e;}return response({ok:true,id});}
```

```text
22: export async function prepareDocument(id:string){
23:  const d=check(await sb().from('portal_documents').select('path,name').eq('id',id).single());
24:  if(!d.path)throw new Error('El documento no tiene un archivo asociado. Avisa al despacho.');
25:  const result=await sb().storage.from('client-documents').download(d.path);
26:  if(result.error)throw new Error('No se pudo obtener el archivo: '+result.error.message);
27:  const blob=result.data;if(!blob?.size)throw new Error('El archivo recibido está vacío. Avisa al despacho.');
28:  return {blob,name:d.name};
29: }
30:
31: async function driveResult<T>(result:{data:T|null;error:unknown}):Promise<T>{
32:  if(result.error){const e=result.error as {context?:Response;message?:string};let message=e.message||'No se pudo conectar con Drive.';if(e.context){try{const b=await e.context.json();message=b.error||message;}catch{}}throw new Error(message);}return result.data as T;
33: }
34: export async function driveStatus(){return driveResult<{configured:boolean}>(await sb().functions.invoke('drive-documents?action=status',{method:'GET'}));}
35: export async function approveDriveDocument(id:string){return driveResult<{ok:boolean}>(await sb().functions.invoke('drive-documents',{body:{documentId:id,approved:true}}));}
```

## source/src/main.tsx

```text
12:  useEffect(()=>{if(!supabase){setLoading(false);return;}const {data}=supabase.auth.onAuthStateChange((event,session)=>{setUser(session?.user||null);if(event==='PASSWORD_RECOVERY')setMode('recovery');if(event==='SIGNED_OUT'){setStaff(false);setMode('login');}});supabase.auth.getUser().then(({data,error})=>{if(error&&location.search.includes('code='))setError('El enlace no se ha podido validar. Solicita uno nuevo desde este navegador.');setUser(data.user);setLoading(false);});return()=>data.subscription.unsubscribe();},[]);
13:  useEffect(()=>{if(!user||mode==='recovery')return;let cancelled=false;setLoading(true);(async()=>{try{const rows=check(await client().from('portal_staff').select('user_id').eq('user_id',user.id));const isStaff=rows.length>0;if(cancelled)return;setStaff(isStaff);}catch{setError('No se ha podido comprobar tu acceso. Vuelve a iniciar sesión.');}finally{if(!cancelled)setLoading(false);}})();return()=>{cancelled=true};},[user?.id,mode]);
14:  const callback=(recover=false)=>new URL('/clientes/acceso/'+(recover?'?mode=recovery':''),location.origin).href;
15:  async function googleLogin(){setBusy(true);setError('');try{check(await client().auth.signInWithOAuth({provider:'google',options:{redirectTo:callback(),queryParams:{prompt:'select_account'}}}));}catch{setError('No se ha podido iniciar el acceso con Google. Vuelve a intentarlo.');setBusy(false);}}
16:  async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();const form=e.currentTarget,d=new FormData(form),email=String(d.get('email')||'').trim(),password=String(d.get('password')||'');setBusy(true);setError('');setNotice('');try{
17:   if(mode==='login'){check(await client().auth.signInWithPassword({email,password}));form.reset();}
18:   else if(mode==='signup'){if(!d.get('privacy'))throw new Error('Lee la información de privacidad antes de crear tu cuenta.');if(password.length<6||password.length>128)throw new Error('Usa una contraseña de entre 6 y 128 caracteres.');if(password!==d.get('confirm'))throw new Error('Las contraseñas no coinciden.');check(await client().auth.signUp({email,password,options:{emailRedirectTo:callback()}}));form.reset();setNotice('Si la solicitud puede completarse, recibirás un correo para confirmar la cuenta. Si ya tienes cuenta, inicia sesión o recupera tu contraseña. La cuenta no da acceso a expedientes hasta que el despacho te los asigne.');setMode('login');}
19:   else if(mode==='reset'){check(await client().auth.resetPasswordForEmail(email,{redirectTo:callback(true)}));form.reset();setNotice('Si existe una cuenta para ese correo, recibirás instrucciones para recuperar el acceso. Comprueba también la carpeta de spam.');}
20:   else{if(!user)throw new Error('El enlace ha caducado. Solicita uno nuevo.');if(password.length<6||password.length>128)throw new Error('Usa una contraseña de entre 6 y 128 caracteres.');if(password!==d.get('confirm'))throw new Error('Las contraseñas no coinciden.');check(await client().auth.updateUser({password}));check(await client().auth.signOut({scope:'global'}));history.replaceState(null,'',callback());setMode('login');form.reset();setNotice('Contraseña actualizada. Inicia sesión con tu nueva contraseña.');}
21:  }catch(e){const own=e instanceof Error?e.message:'';setError(/sending.*(?:confirmation|recovery|email)|smtp/i.test(own)?'No se ha podido enviar el correo de confirmación. El despacho debe corregir la configuración del servicio de correo.':/rate limit|too many requests|security purposes/i.test(own)?'Se han realizado demasiados intentos. Espera unos minutos antes de volver a probar.':/coinciden|6 y 128|Lee la información|caducado/.test(own)?own:mode==='login'?'No se ha podido iniciar sesión. Comprueba el correo, la contraseña y que hayas confirmado tu cuenta.':'No se ha completado la solicitud. Vuelve a intentarlo más tarde o contacta con el despacho.');}finally{setBusy(false);}}
```

## source/src/Portal.tsx

```text
21:  {data.owner&&<details><summary>Actualizar información visible</summary><form key={current.id} onSubmit={e=>{e.preventDefault();const d=new FormData(e.currentTarget);action({action:'saveCase',id:current.id,reference:current.reference,title:current.title,status:d.get('status'),summary:d.get('summary')});}}><label>Estado<input name="status" defaultValue={current.status} required maxLength={80}/></label><label>Resumen para el cliente<textarea name="summary" defaultValue={current.summary} maxLength={4000}/></label><button disabled={busy}>Guardar actualización</button></form></details>}</article>
22:  {data.owner&&<section className="panel"><h3>Clientes autorizados</h3><p className="subtle">En documentos enlazados a Drive, los permisos de Google se gestionan también en Drive. Revocar aquí el acceso al portal no retira los permisos concedidos en Google.</p><p className="subtle">Asigna el correo que utiliza el cliente para iniciar sesión. El cliente debe crear su cuenta y confirmar ese correo. Esta asignación no envía ningún correo ni abre la gestión interna.</p>{data.grants.filter(g=>g.case_id===current.id).map(g=><div className="document row" key={g.id}><span>{g.email}<small className="subtle"> · {g.active?'Habilitado':'Revocado'}</small></span>{g.active===1&&<button className="danger" disabled={busy} onClick={()=>action({action:'revoke',id:g.id},'Acceso al expediente revocado.')}>Revocar</button>}</div>)}<form onSubmit={async e=>{e.preventDefault();const f=e.currentTarget;const d=new FormData(f);if(await action({action:'grant',caseId:current.id,email:d.get('email')},'Correo asignado. El cliente podrá acceder tras confirmar su correo.'))f.reset();}}><label>Correo del cliente<input type="email" name="email" required maxLength={254}/></label><button disabled={busy}>Asignar expediente</button></form></section>}
23:  <section className="panel"><h3>Documentación</h3>{data.documents.filter(d=>d.case_id===current.id).map(d=><div className="document" key={d.id} id={'document-'+d.id}><DocumentDownload id={d.id} name={d.name} driveFileId={data.owner?d.drive_file_id:null}/>{!data.owner&&!d.drive_file_id&&<p className="subtle">Recibido por el despacho. El traslado a Drive está pendiente de aprobación.</p>}<p className="subtle">{(d.size/1024/1024).toFixed(2)} MB · {new Date(d.created).toLocaleDateString('es-ES',{timeZone:'Atlantic/Canary'})}{data.owner?' · '+(d.shared?'Compartido con los clientes del expediente':'Privado para el despacho y quien lo aportó'):''}</p>{data.owner&&!d.drive_file_id&&<button className="secondary" disabled={busy} onClick={()=>action({action:'shareDocument',id:d.id,shared:d.shared!==1},d.shared?'Documento retirado del acceso compartido.':'Documento habilitado para los clientes asignados.')}>{d.shared?'Dejar de compartir':'Compartir con los clientes del expediente'}</button>}</div>)}{!data.documents.some(d=>d.case_id===current.id)&&<p className="subtle">Todavía no hay documentos disponibles.</p>}</section>
24:  <section className="panel"><h3>{data.owner?'Añadir documento':'Enviar documentación'}</h3><p className="subtle">PDF, JPG o PNG · Hasta 10 MB por archivo. Aporta únicamente la documentación necesaria para este asunto. El archivo se recibe primero en el portal; solo el despacho puede aprobar su traslado a Drive.</p><form onSubmit={upload} key={'file-'+current.id}><input type="hidden" name="caseId" value={current.id}/><label>Archivo<input type="file" name="file" accept=".pdf,.jpg,.jpeg,.png" required/></label>{data.owner&&<label className="check"><input type="checkbox" name="shared" value="true"/><span>Habilitar este documento para todos los clientes asignados al expediente.</span></label>}<p className="subtle">Responsable: Imanol Navarro Pérez. Finalidad: tramitar el encargo profesional. <a href="/privacidad-clientes/" target="_blank" rel="noopener noreferrer">Información de privacidad y derechos</a>.</p><button disabled={busy||!data.ready}>{busy?'Procesando…':data.ready?'Enviar documento':'Recepción pendiente de habilitación'}</button></form><p className="subtle">La confirmación acredita la recepción técnica, no su revisión ni presentación judicial. Para urgencias o plazos próximos, llama al despacho.</p></section></section>}</div>}</>;
```

```text
27: function DocumentDownload({id,name,driveFileId}:{id:string;name:string;driveFileId?:string|null}){
28:  const [url,setUrl]=useState(''),[type,setType]=useState(''),[error,setError]=useState(''),[loading,setLoading]=useState(false);
29:  useEffect(()=>()=>{if(url)URL.revokeObjectURL(url);},[url]);
30:  async function prepare(){setLoading(true);setError('');try{const {blob}=await prepareDocument(id);setType(blob.type.split(';')[0]);setUrl(URL.createObjectURL(blob));}catch(e){setError(e instanceof Error?e.message:'No se ha podido obtener el archivo.');}finally{setLoading(false);}}
31:  useEffect(()=>{if(new URLSearchParams(location.search).get('document')===id){void prepare();document.getElementById('document-'+id)?.scrollIntoView({block:'start'});}},[id]);
32:  const drive=driveFileId&&/^[A-Za-z0-9_-]+$/.test(driveFileId);
33:  return <><strong>{name}</strong><div className="row"><button type="button" className="document-link" disabled={loading} onClick={prepare}>{loading?'Cargando documento…':url?'Volver a cargar':'Ver documento aquí'}</button>{url&&<a href={url} download={name}>Descargar archivo</a>}{drive&&<a href={'https://drive.google.com/file/d/'+driveFileId+'/view'} target="_blank" rel="noopener noreferrer">Enlace de Drive</a>}</div>{url&&<section aria-label={'Vista previa de '+name}>{type.startsWith('image/')?<img src={url} alt={name} style={{display:'block',maxWidth:'100%',height:'auto',marginTop:16}}/>:type==='application/pdf'?<object data={url} type="application/pdf" width="100%" height="640"><a href={url} download={name}>Descargar PDF para abrirlo</a></object>:<p>No hay vista previa para este formato. Usa «Descargar archivo».</p>}</section>}{error&&<p className="notice error" role="alert">{error} {drive?'Puedes utilizar el enlace de Drive como alternativa.':''}</p>}</>;
```

## source/edge/handler.mjs

```text
20:       requireValue(!origin || origins.has(origin), 403, 'Origen no autorizado.');
21:       if (req.method === 'OPTIONS') return new Response(null, {status:204,headers});
22:       requireValue(['GET','POST'].includes(req.method), 405, 'Método no permitido.');
23:       const authorization = req.headers.get('authorization') || '';
24:       requireValue(/^Bearer \S+$/.test(authorization), 401, 'Inicia sesión.');
25:       const sbHeaders = {apikey:env.SUPABASE_ANON_KEY, authorization};
26:       const request = async (url, options, message = 'No se ha completado la operación.') => {
27:         const r = await http(url, options);
28:         requireValue(r.ok, r.status === 401 || r.status === 403 ? 403 : 502, message);
29:         return r;
30:       };
31:       const userResponse = await request(env.SUPABASE_URL + '/auth/v1/user', {headers:sbHeaders}, 'La sesión no es válida.');
32:       const user = await userResponse.json();
33:       requireValue(UUID.test(user.id), 401, 'La sesión no es válida.');
34:       const rows = async (query) => (await request(env.SUPABASE_URL + '/rest/v1/' + query, {headers:sbHeaders}, 'No tienes acceso a este expediente.')).json();
35:       const staff = (await rows('portal_staff?select=user_id&user_id=eq.' + user.id)).length > 0;
36:       if (req.method === 'POST') requireValue(staff,403,'Solo el despacho puede aprobar el traslado a Drive.');
37:       const configured = ['GOOGLE_DRIVE_CLIENT_ID','GOOGLE_DRIVE_CLIENT_SECRET','GOOGLE_DRIVE_REFRESH_TOKEN','GOOGLE_DRIVE_ROOT_FOLDER_ID','SUPABASE_SERVICE_ROLE_KEY'].every(k => !!env[k]);
38:       const url = new URL(req.url);
39:       if (req.method === 'GET' && url.searchParams.get('action') === 'status') {
40:         requireValue(staff, 403, 'Acceso reservado al despacho.');
41:         return json({configured});
42:       }
43:       requireValue(configured, 503, 'La conexión con Google Drive está pendiente de completar por el despacho.');
```

```text
64:       const sources = await rows('portal_documents?select=*&id=eq.'+sourceId);
65:       requireValue(sources.length===1,404,'Documento no disponible.');
66:       const source = sources[0]; const caseId = source.case_id;
67:       if(source.storage_provider==='google-drive') return json({ok:true,id:sourceId,alreadyMigrated:true});
68:       const cases = await rows('portal_cases?select=id,reference&id=eq.'+caseId);
69:       requireValue(cases.length===1,403,'No tienes acceso a este expediente.');
70:       const original = await request(env.SUPABASE_URL+'/storage/v1/object/authenticated/client-documents/'+source.path.split('/').map(encodeURIComponent).join('/'),{headers:sbHeaders},'No se pudo recuperar el original. Se conserva pendiente de traslado.');
71:       const bytes = new Uint8Array(await original.arrayBuffer());
72:       requireValue(bytes.byteLength===source.size && bytes.byteLength<=MAX_BYTES && validSignature(source.type,bytes),400,'El original no coincide con el documento registrado.');
73:       const file = new File([bytes],source.name,{type:source.type});
74:       const serviceHeaders={apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY,'Content-Type':'application/json',Prefer:'return=minimal'};
75:       await request(env.SUPABASE_URL+'/rest/v1/portal_audit',{method:'POST',headers:serviceHeaders,body:JSON.stringify({user_id:user.id,action:'document.drive_approved',resource_id:sourceId})},'No se pudo registrar tu aprobación; el archivo permanece en el portal.');
76:       const root = env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
77:       requireValue(DRIVE_ID.test(root), 503, 'Carpeta de Drive no configurada.');
78:       const parent = await (await request(API + '/' + root + '?fields=id,mimeType,trashed,shared,capabilities(canAddChildren)',{headers:gh},'No se puede acceder a la carpeta del despacho.')).json();
79:       requireValue(parent.mimeType === 'application/vnd.google-apps.folder' && !parent.trashed && parent.capabilities?.canAddChildren && !parent.shared, 503, 'La carpeta del portal debe ser privada y permitir añadir documentos.');
```

```text
95:       const existingQuery = "'"+folderId+"' in parents and trashed=false and appProperties has { key='portal_document_id' and value='"+id+"' } and appProperties has { key='portal_case_id' and value='"+caseId+"' }";
96:       const existing = await (await request(API+'?'+new URLSearchParams({q:existingQuery,fields:'files(id)',pageSize:'2'}),{headers:gh})).json();
97:       requireValue((existing.files||[]).length<=1,409,'Hay más de una copia del documento; el despacho debe revisarlo.');
98:       let uploaded=existing.files?.[0];
99:       if(!uploaded){
100:       const start = await request('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id',{method:'POST',headers:{...gh,'Content-Type':'application/json','X-Upload-Content-Type':file.type,'X-Upload-Content-Length':String(file.size)},body:JSON.stringify({name,mimeType:file.type,parents:[folderId],appProperties:{portal_document_id:id,portal_case_id:caseId}})},'No se ha podido iniciar la subida a Drive.');
101:       const location = start.headers.get('location');
102:       requireValue(location && new URL(location).origin === 'https://www.googleapis.com',502,'Destino de subida no válido.');
103:       uploaded = await (await request(location,{method:'PUT',headers:{...gh,'Content-Type':file.type},body:file},'No se ha podido guardar el documento en Drive.')).json();
104:       requireValue(DRIVE_ID.test(uploaded.id),502,'Drive no ha confirmado el archivo.');
105:       }
106:       try {
107:         // Recheck access after upload; only this server writes Drive metadata with the service key.
108:         requireValue((await rows('portal_cases?select=id&id=eq.' + caseId)).length === 1,403,'Se ha revocado el acceso al expediente.');
109:         const saved = await http(env.SUPABASE_URL + '/rest/v1/portal_documents?id=eq.'+sourceId,{method:'PATCH',headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify({storage_provider:'google-drive',drive_file_id:uploaded.id})});
110:         requireValue(saved.ok,502,'No se ha podido registrar el documento.');
111:       } catch (error) {
112:         // Never delete on an ambiguous database response: keep the private file for recovery.
113:         // The appProperties document ID lets the operator reconcile it without losing client data.
114:         throw error;
115:       }
116:       return json({ok:true,id});
117:     } catch (e) {
118:       return json({error:e instanceof Failure ? e.message : 'No se ha podido completar la operación. El despacho revisará la conexión.'}, e instanceof Failure ? e.status : 502);
```
