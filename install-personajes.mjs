import fs from 'node:fs';
import path from 'node:path';
export function installCharacters(root='dist') {
  const destination=path.join(root,'esto-es-legal');
  fs.cpSync('web/esto-es-legal',destination,{recursive:true});
  // Only explicit public entrypoints; never traverse or modify private account pages.
  for(const relative of ['index.html','enlaces/index.html','instagram/index.html']) {
    const file=path.join(root,relative);
    if(!fs.existsSync(file))continue;
    let html=fs.readFileSync(file,'utf8');
    if(html.includes('data-character-entry'))continue;
    const entry='<aside data-character-entry aria-label="Universo ¿ESTO ES LEGAL?" style="padding:24px 7%;background:#faf7f0;color:#263d4a;border-bottom:1px solid #ccd3cc"><strong>¿ESTO ES LEGAL?</strong><p>Conoce a Don Lex y sus seis compañeros: explora sus expresiones y animaciones.</p><a href="/esto-es-legal/" style="display:inline-block;padding:12px 0;color:#263d4a;text-decoration:underline">Conocer a los personajes ↗</a><small style="display:block">Galería del elenco · El juego todavía está en preparación.</small></aside>';
    html=html.replace(/(<main\b[^>]*>)/,'$1'+entry);
    fs.writeFileSync(file,html);
  }
}
installCharacters();
console.log('Elenco instalado en /esto-es-legal/ con recursos locales.');
