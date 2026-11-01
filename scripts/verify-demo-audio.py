#!/usr/bin/env python3
"""Read-only HTTP verifier. Public demonstration ONLY; never production or credentials."""
import argparse, hashlib, json, re, sys, urllib.error, urllib.parse, urllib.request

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--expect-commit',required=True)
    parser.add_argument('--url',default='https://esto-es-legal-demo.onrender.com')
    parser.add_argument('--local',action='store_true')
    args=parser.parse_args();url=urllib.parse.urlsplit(args.url)
    if not re.fullmatch('[a-f0-9]{40}',args.expect_commit):parser.error('Usa el SHA completo de 40 caracteres.')
    if url.username or url.password or url.query or url.fragment:parser.error('No se admiten credenciales ni parámetros.')
    if args.local:
        if url.hostname not in ['127.0.0.1','localhost'] or url.scheme!='http':parser.error('--local solo admite loopback HTTP.')
    elif url.hostname!='esto-es-legal-demo.onrender.com' or url.scheme!='https':parser.error('Solo se permite el servicio HTTPS de demostración; nunca producción.')
    origin=urllib.parse.urlunsplit((url.scheme,url.netloc,'','',''))
    class SameOrigin(urllib.request.HTTPRedirectHandler):
        def redirect_request(self,req,fp,code,msg,headers,newurl):
            other=urllib.parse.urlsplit(newurl)
            if (other.scheme,other.netloc)!=(url.scheme,url.netloc):raise ValueError('Redirección fuera del origen de demostración.')
            return super().redirect_request(req,fp,code,msg,headers,newurl)
    opener=urllib.request.build_opener(SameOrigin())
    def get(path,headers=None):
        with opener.open(urllib.request.Request(origin+path,headers=headers or {}),timeout=25) as res:
            data=res.read(5*1024*1024+1)
            if len(data)>5*1024*1024:raise ValueError('Respuesta demasiado grande.')
            return res.status,res.headers,data
    result={'origin':origin,'expectedCommit':args.expect_commit,'physicalIPhoneTested':False,'renderStateAndBuildLogsVerified':False,'checks':[]}
    try:
        status,headers,data=get('/preview-version.json');marker=json.loads(data)
        if marker.get('commit')!=args.expect_commit:raise ValueError('El SHA servido no es el esperado.')
        if marker.get('audioEngineVersion')!='media-files-v4':raise ValueError('Se está sirviendo otro motor de audio.')
        if marker.get('administration') is not False:raise ValueError('Marcador de aislamiento inválido.')
        files=marker.get('files',{})
        if not files or 'esto-es-legal/audio/test.wav' not in files:raise ValueError('Falta el inventario verificable de archivos.')
        for file,expected in files.items():
            if not re.fullmatch(r'esto-es-legal/[a-zA-Z0-9./-]+',file) or '..' in file:raise ValueError('Ruta no válida en el inventario.')
            status,headers,data=get('/'+file)
            if hashlib.sha256(data).hexdigest()!=expected:raise ValueError('Hash distinto: '+file)
            if file.endswith(('.mp3','.wav')) and not headers.get('Content-Type','').lower().startswith('audio/'):raise ValueError('MIME de audio no válido: '+file)
            result['checks'].append({'file':file,'status':status,'sha256Matches':True,'bytes':len(data)})
        status,headers,data=get('/esto-es-legal/audio/test.wav',{'Range':'bytes=0-15'})
        result['byteRange']={'status':status,'contentRange':headers.get('Content-Range'),'bytes':len(data),'supported':status==206 and len(data)==16}
        for path in ['/game-editor/','/administracion/','/clientes/','/.env']:
            try:get(path);raise ValueError('Una ruta excluida devuelve contenido: '+path)
            except urllib.error.HTTPError as error:
                if error.code not in [403,404]:raise
        result['publicFilesVerified']=True
    except Exception as error:
        result['publicFilesVerified']=False;result['error']=str(error)
    print(json.dumps(result,ensure_ascii=False,indent=2))
    return 0 if result['publicFilesVerified'] else 1
if __name__=='__main__':sys.exit(main())
