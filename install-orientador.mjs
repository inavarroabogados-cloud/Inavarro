import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const mount='/y-ahora-que/';
const destination=path.join('dist',mount);
fs.mkdirSync(destination,{recursive:true});
execFileSync('tar',['-xzf','orientador-static.tar.gz','-C',destination],{stdio:'inherit'});
// Static hosts do not apply Next server headers. Provide the policies supported by HTML;
// frame-ancestors, HSTS and response headers still belong to hosting configuration.
const policy="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; base-uri 'self'; form-action 'self'";
function pages(directory,visitor){for(const entry of fs.readdirSync(directory,{withFileTypes:true})){const file=path.join(directory,entry.name);if(entry.isDirectory())pages(file,visitor);else if(entry.name.endsWith('.html'))visitor(file)}}
pages(destination,file=>{let html=fs.readFileSync(file,'utf8');if(!html.includes('http-equiv="Content-Security-Policy"'))html=html.replace('<head>','<head><meta http-equiv="Content-Security-Policy" content="'+policy+'"><meta name="referrer" content="no-referrer">');fs.writeFileSync(file,html)});
// Add the tool only to public generated pages, preserving client and administration pages.
pages('dist',file=>{const relative=path.relative('dist',file).split(path.sep).join('/');if(relative.startsWith('y-ahora-que/')||relative.startsWith('clientes/')||relative.startsWith('admin/'))return;let html=fs.readFileSync(file,'utf8');if(html.includes('href="'+mount+'"'))return;html=html.replace('<a href="/servicios/">Servicios</a>','<a href="'+mount+'">¿Y ahora qué? · Ordenar mi consulta</a> · <a href="/servicios/">Servicios</a>');if(relative==='index.html')html=html.replace('<main id="contenido">','<main id="contenido"><aside aria-label="Preparar una consulta" style="padding:22px 7%;background:#e9e9df;border-bottom:1px solid #ccd3cc"><strong>¿Y ahora qué?</strong> Ordena tu situación con cinco preguntas generales. <a href="'+mount+'">Ordenar mi consulta ↗</a><small style="display:block">Herramienta de demostración · Sin registro ni datos confidenciales</small></aside>');fs.writeFileSync(file,html)});
const home=fs.readFileSync(path.join(destination,'index.html'),'utf8');
if(!home.includes('Versión de demostración')||!home.includes('noindex'))throw new Error('La herramienta debe mantener su etiqueta demo y noindex');
console.log('Herramienta estática instalada en '+mount+'; portal y área privada conservados.');
