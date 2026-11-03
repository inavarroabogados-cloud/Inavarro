/** Independent review output. These guards remain specific to the preview. */
import fs from 'node:fs';
import {buildCollection} from './build-collection.mjs';
const origin=process.env.COLLECTION_PREVIEW_ORIGIN||process.env.RENDER_EXTERNAL_URL;
if(process.env.RENDER_GIT_BRANCH&&process.env.RENDER_GIT_BRANCH!=='feat/coleccion-juridica')throw Error('La revisión requiere su rama independiente.');
if(['inavarro-abogados','esto-es-legal-demo'].includes(process.env.RENDER_SERVICE_NAME)||origin&&['inavarro-abogados.onrender.com','esto-es-legal-demo.onrender.com'].includes(new URL(origin).hostname))throw Error('Servicio protegido: no se compila la revisión aquí.');
const out='collection-preview-dist';fs.mkdirSync(out,{recursive:true});if(fs.readdirSync(out).some(n=>!['coleccion-juridica','index.html','robots.txt','preview-version.json','404.html'].includes(n)))throw Error('Salida de revisión con archivos ajenos');
const manifest=buildCollection({output:out,origin,indexable:false});
fs.writeFileSync(out+'/index.html','<!doctype html><html lang="es"><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><meta http-equiv="refresh" content="0;url=/coleccion-juridica/"><title>Colección en revisión</title><a href="/coleccion-juridica/">Abrir colección en revisión</a></html>');fs.writeFileSync(out+'/robots.txt','User-agent: *\nDisallow: /\n');fs.writeFileSync(out+'/preview-version.json',JSON.stringify(manifest,null,2)+'\n');fs.writeFileSync(out+'/404.html','<!doctype html><html lang="es"><meta charset="utf-8"><title>Página no encontrada</title><h1>Página no encontrada</h1><a href="/coleccion-juridica/">Volver a la colección</a></html>');console.log('Colección de revisión compilada; no se ha desplegado.');
