import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
// The installer is intentionally executed only after a portal build has created dist.
import {installCharacters} from '../install-personajes.mjs';
test('installer preserves private pages and is idempotent',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'inavarro-cast-'));
 try {
  fs.mkdirSync(path.join(dir,'clientes'),{recursive:true});
  const privateHtml='<main>PRIVATE SENTINEL</main>';
  fs.writeFileSync(path.join(dir,'clientes/index.html'),privateHtml);
  fs.writeFileSync(path.join(dir,'index.html'),'<main id="contenido">PORTAL SENTINEL</main>');
  installCharacters(dir);installCharacters(dir);
  const home=fs.readFileSync(path.join(dir,'index.html'),'utf8');
  assert.equal((home.match(/data-character-entry/g)||[]).length,1);
  assert.ok(home.includes('PORTAL SENTINEL'));
  assert.equal(fs.readFileSync(path.join(dir,'clientes/index.html'),'utf8'),privateHtml);
  const m=JSON.parse(fs.readFileSync(path.join(dir,'esto-es-legal/manifest.json')));
  assert.equal(m.characters.length,7);
  for(const c of m.characters){assert.equal(Object.keys(c.assets).length,6);for(const file of Object.values(c.assets))assert.ok(fs.existsSync(path.join(dir,'esto-es-legal',file)));for(const format of ['cuadrado','historia','horizontal'])for(const ext of ['svg','png'])assert.ok(fs.existsSync(path.join(dir,'esto-es-legal/exports',`${c.id}-${format}.${ext}`)));}
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
