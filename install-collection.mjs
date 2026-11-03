/** Add one independent public collection without altering beta, portal or orientador. */
import fs from 'node:fs';
import {buildCollection} from './scripts/build-collection.mjs';
const config=JSON.parse(fs.readFileSync('config.json','utf8'));
const origin=process.env.SITE_ORIGIN||process.env.RENDER_EXTERNAL_URL||config.origin;
if(new URL(origin).origin!=='https://inavarro-abogados.onrender.com')throw Error('El instalador público requiere el dominio confirmado del despacho.');
buildCollection({output:'dist',origin,indexable:true});
const file='dist/index.html';let home=fs.readFileSync(file,'utf8');
if(!home.includes('id="legal-collection-launch"')){
 const banner='<aside id="legal-collection-launch" aria-label="Colección de juegos jurídicos" style="padding:30px 7%;background:#f1eadb;color:#172f41;border-bottom:1px solid #c7cec4"><p style="font-size:12px;letter-spacing:1px;font-weight:700">iNAVARRO · JUEGOS JURÍDICOS</p><h2 style="font:clamp(28px,5vw,46px)/1.15 Georgia,serif;margin:12px 0">Antes de que te pase, juega.</h2><p>Sucesiones, familia, vivienda, consumo, penal y extranjería. Seis historias, sesenta decisiones y una explicación tras cada respuesta.</p><a href="/coleccion-juridica/" style="display:inline-block;min-height:48px;padding:12px 20px;border-radius:10px;background:#172f41;color:#faf6ed;font-weight:700">Elegir un juego →</a><small style="display:block;margin-top:12px">Casos ficticios · Sin registro · Información divulgativa</small></aside>';
 if(!home.includes('<main id="contenido">'))throw Error('No se encuentra la entrada del portal');home=home.replace('<main id="contenido">','<main id="contenido">'+banner);fs.writeFileSync(file,home);
}
for(const hub of ['enlaces','instagram']){const file='dist/'+hub+'/index.html';if(!fs.existsSync(file))continue;let html=fs.readFileSync(file,'utf8');if(html.includes('href="/coleccion-juridica/"'))continue;const card='<a class="card" href="/coleccion-juridica/"><span><strong>Antes de que te pase, juega</strong><small>Seis juegos jurídicos · Diez decisiones por historia</small></span><span class="arrow" aria-hidden="true">→</span></a>';if(!html.includes('</nav>'))throw Error('No se encuentra la navegación de '+hub);fs.writeFileSync(file,html.replace('</nav>',card+'</nav>'))}
const sitemap='dist/sitemap.xml';if(fs.existsSync(sitemap)){let xml=fs.readFileSync(sitemap,'utf8');if(!xml.includes('/coleccion-juridica/')){const catalog=JSON.parse(fs.readFileSync('web/coleccion-juridica/catalog.json','utf8'));const routes=['',...catalog.games.map(g=>g.slug+'/'),'fuentes/'];const items=routes.map(route=>`<url><loc>${new URL('/coleccion-juridica/'+route,origin).href}</loc><lastmod>${catalog.verifiedDate}</lastmod></url>`).join('');if(!xml.includes('</urlset>'))throw Error('Sitemap no válido');fs.writeFileSync(sitemap,xml.replace('</urlset>',items+'</urlset>'))}}
console.log('Colección instalada en /coleccion-juridica/ y enlazada desde portada y enlaces; beta conservada.');
