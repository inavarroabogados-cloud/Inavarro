/** Isolated collection. Never runs the production build or modifies the beta. */
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..');
const branch=process.env.RENDER_GIT_BRANCH;
const origin=process.env.COLLECTION_PREVIEW_ORIGIN||process.env.RENDER_EXTERNAL_URL;
if(branch&&branch!=='feat/coleccion-juridica')throw Error('La colección requiere su rama independiente.');
if(['inavarro-abogados','esto-es-legal-demo'].includes(process.env.RENDER_SERVICE_NAME))throw Error('Servicio protegido: no se permite compilar esta revisión aquí.');
if(origin&&['inavarro-abogados.onrender.com','esto-es-legal-demo.onrender.com'].includes(new URL(origin).hostname))throw Error('No se permite usar el dominio de producción ni el de la beta.');
if(origin&&new URL(origin).protocol!=='https:')throw Error('La URL de revisión publicada debe ser HTTPS.');
const source=path.join(root,'web/coleccion-juridica'),out=path.join(root,'collection-preview-dist'),mount=path.join(out,'coleccion-juridica');
const catalog=JSON.parse(fs.readFileSync(path.join(source,'catalog.json'),'utf8'));
if(catalog.games.length!==6)throw Error('Se requieren seis juegos');
for(const g of catalog.games){const q=JSON.parse(fs.readFileSync(path.join(source,'data',g.slug+'.json'),'utf8')).questions;if(q.length!==10||q.some(q=>q.options.length!==3||!Number.isInteger(q.correct)||!q.options[q.correct]||!q.explanation||!q.nuance||!q.references.length||!q.consult||!q.territory||!q.verifiedDate||!q.humanReview||!q.difficulty))throw Error('Banco incompleto: '+g.slug)}
fs.mkdirSync(out,{recursive:true});
if(fs.readdirSync(out).some(n=>!['coleccion-juridica','index.html','robots.txt','preview-version.json','404.html'].includes(n)))throw Error('Salida con archivos ajenos a la colección');
fs.rmSync(mount,{recursive:true,force:true});
fs.mkdirSync(mount,{recursive:true});
fs.cpSync(source,mount,{recursive:true,filter:src=>!src.endsWith('.md')});
const original=fs.readFileSync(path.join(source,'index.html'),'utf8');
const esc=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function htmlFor(g){let html=original;if(g){const title=esc(g.title+' · iNavarro Abogados');html=html.replace(/<title>.*?<\/title>/,`<title>${title}</title>`).replace(/(<meta property="og:title" content=")[^"]*/,`$1${title}`).replace(/(<meta name="description" content=")[^"]*/,`$1${esc(g.hook)}`).replace(/(<meta property="og:description" content=")[^"]*/,`$1${esc(g.hook)}`)}if(origin){const url=new URL('/coleccion-juridica/'+(g?g.slug+'/':''),origin).href;const image=new URL('/coleccion-juridica/assets/'+(g?g.slug:'sucesiones')+'-og.png',origin).href;html=html.replace('</head>',`<link rel="canonical" href="${esc(url)}"><meta property="og:url" content="${esc(url)}"><meta property="og:image" content="${esc(image)}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"></head>`)}return html}
fs.writeFileSync(path.join(mount,'index.html'),htmlFor());
for(const g of catalog.games){fs.mkdirSync(path.join(mount,g.slug),{recursive:true});fs.writeFileSync(path.join(mount,g.slug,'index.html'),htmlFor(g))}
fs.mkdirSync(path.join(mount,'fuentes'),{recursive:true});fs.writeFileSync(path.join(mount,'fuentes/index.html'),original.replace('<title>Antes de que te pase, juega · iNavarro Abogados</title>','<title>Fuentes jurídicas · iNavarro Abogados</title>'));
fs.writeFileSync(path.join(out,'index.html'),'<html lang="es"><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><meta http-equiv="refresh" content="0;url=/coleccion-juridica/"><title>Colección en revisión</title><a href="/coleccion-juridica/">Abrir colección en revisión</a></html>');
fs.writeFileSync(path.join(out,'404.html'),'<html lang="es"><meta charset="utf-8"><title>Página no encontrada</title><h1>Página no encontrada</h1><a href="/coleccion-juridica/">Volver a la colección</a></html>');
fs.writeFileSync(path.join(out,'robots.txt'),'User-agent: *\nDisallow: /\n');
const files={};function hashes(dir){for(const n of fs.readdirSync(dir)){const p=path.join(dir,n);if(fs.statSync(p).isDirectory())hashes(p);else files[path.relative(out,p)]=createHash('sha256').update(fs.readFileSync(p)).digest('hex')}}hashes(mount);
fs.writeFileSync(path.join(out,'preview-version.json'),JSON.stringify({type:'legal-collection-review-only',commit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),games:6,questions:60,administration:false,productionBuild:false,files},null,2)+'\n');
console.log('Colección independiente compilada: collection-preview-dist. No se ha desplegado.');
