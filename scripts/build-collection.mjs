/** Build the collection mount only; never remove the portal or beta output. */
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function buildCollection({output,origin,indexable=false}){
 const source=path.join(root,'web/coleccion-juridica'),out=path.resolve(root,output),mount=path.join(out,'coleccion-juridica');
 if(origin&&new URL(origin).protocol!=='https:')throw Error('La URL pública debe ser HTTPS.');
 const catalog=JSON.parse(fs.readFileSync(path.join(source,'catalog.json'),'utf8'));
 if(catalog.games.length!==6||new Set(catalog.games.map(g=>g.slug)).size!==6)throw Error('Se requieren seis juegos distintos');
 const banks=new Map(),ids=new Set();
 for(const g of catalog.games){
  const bank=JSON.parse(fs.readFileSync(path.join(source,'data',g.slug+'.json'),'utf8'));
  if(bank.questions.length!==10)throw Error('Se requieren diez casos: '+g.slug);
  for(const q of bank.questions){if(ids.has(q.id)||q.options.length!==3||new Set(q.options).size!==3||!Number.isInteger(q.correct)||!q.options[q.correct]||!q.explanation||!q.nuance||!q.references.length||!q.consult||!q.territory||!q.verifiedDate||q.documentaryReview!=='codex-verified'||!q.difficulty)throw Error('Caso incompleto: '+q.id);ids.add(q.id);for(const r of q.references)if(!catalog.sources[r.source])throw Error('Fuente desconocida: '+r.source)}
  banks.set(g.slug,bank);
 }
 fs.mkdirSync(out,{recursive:true});fs.rmSync(mount,{recursive:true,force:true});fs.mkdirSync(mount,{recursive:true});
 fs.cpSync(source,mount,{recursive:true,filter:src=>!src.endsWith('.md')});
 // The editable source records what was actually reviewed. Internal editorial fields
 // are not part of the public bank or the game's interface.
 for(const [slug,bank] of banks){for(const q of bank.questions){delete q.humanReview;delete q.documentaryReview}fs.writeFileSync(path.join(mount,'data',slug+'.json'),JSON.stringify(bank,null,2)+'\n')}
 const publicCatalog={...catalog};delete publicCatalog.humanReview;delete publicCatalog.documentaryReview;fs.writeFileSync(path.join(mount,'catalog.json'),JSON.stringify(publicCatalog,null,2)+'\n');
 const original=fs.readFileSync(path.join(source,'index.html'),'utf8');
 function htmlFor(g,sources=false){let html=original;const title=g?g.title+' · iNavarro Abogados':sources?'Fuentes jurídicas · iNavarro Abogados':'Antes de que te pase, juega · iNavarro Abogados';const description=g?g.hook:'Seis historias jurídicas. Sesenta decisiones cotidianas. Una colección educativa de iNavarro Abogados.';html=html.replace(/<title>.*?<\/title>/,`<title>${esc(title)}</title>`).replace(/(<meta property="og:title" content=")[^"]*/,`$1${esc(title)}`).replace(/(<meta name="description" content=")[^"]*/,`$1${esc(description)}`).replace(/(<meta property="og:description" content=")[^"]*/,`$1${esc(description)}`).replace('name="robots" content="noindex,nofollow"',`name="robots" content="${indexable?'index,follow':'noindex,nofollow'}"`);if(origin){const url=new URL('/coleccion-juridica/'+(g?g.slug+'/':sources?'fuentes/':''),origin).href;const image=new URL('/coleccion-juridica/assets/'+(g?g.slug:'sucesiones')+'-og.png',origin).href;html=html.replace('</head>',`<link rel="canonical" href="${esc(url)}"><meta property="og:url" content="${esc(url)}"><meta property="og:image" content="${esc(image)}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"></head>`)}return html}
 fs.writeFileSync(path.join(mount,'index.html'),htmlFor());for(const g of catalog.games){fs.mkdirSync(path.join(mount,g.slug),{recursive:true});fs.writeFileSync(path.join(mount,g.slug,'index.html'),htmlFor(g))}fs.mkdirSync(path.join(mount,'fuentes'),{recursive:true});fs.writeFileSync(path.join(mount,'fuentes/index.html'),htmlFor(null,true));
 const commit=process.env.RENDER_GIT_COMMIT||execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();if(!/^[a-f0-9]{40}$/.test(commit))throw Error('Commit no válido');
 const files={};function hashes(dir){for(const n of fs.readdirSync(dir)){const p=path.join(dir,n);if(fs.statSync(p).isDirectory())hashes(p);else files[path.relative(out,p)]=createHash('sha256').update(fs.readFileSync(p)).digest('hex')}}hashes(mount);
 const manifest={type:indexable?'legal-collection-public':'legal-collection-review-only',commit,games:6,questions:60,administration:false,verifiedDate:catalog.verifiedDate,files};fs.writeFileSync(path.join(mount,'version.json'),JSON.stringify(manifest,null,2)+'\n');return manifest;
}
