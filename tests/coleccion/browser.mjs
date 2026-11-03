import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {spawn} from 'node:child_process';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const {default:AxeBuilder}=await import(process.env.AXE_MODULE||'@axe-core/playwright');
const root=new URL('../../',import.meta.url).pathname;
const origin=process.env.COLLECTION_TEST_ORIGIN||'http://127.0.0.1:3298';
const base=origin+'/coleccion-juridica/';
const shots=process.env.COLLECTION_TEST_OUTPUT||root+'docs/coleccion/';await fs.mkdir(shots,{recursive:true});
const catalog=JSON.parse(await fs.readFile(root+'web/coleccion-juridica/catalog.json'));
const report={flows:[],errors:[],accessibility:[],audio:{},limitations:['Chromium emulado; no iPhone/Safari físico','El progreso del audio no verifica la salida física del altavoz']};
const server=process.env.COLLECTION_TEST_ORIGIN?null:spawn('python3',['-m','http.server','3298','--bind','127.0.0.1','--directory',root+'dist'],{stdio:'ignore'});
await new Promise(r=>setTimeout(r,350));
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox'],...(process.env.COLLECTION_BROWSER_PROXY?{proxy:{server:process.env.COLLECTION_BROWSER_PROXY}}:{})});
try{
for(const width of (process.env.COLLECTION_TEST_MOBILE_ONLY?[390]:[390,1440])){
 console.log('Viewport',width);
 const context=await browser.newContext({viewport:{width,height:width===390?844:1000},hasTouch:width===390,permissions:['clipboard-read','clipboard-write']});
 const page=await context.newPage();let musicRequests=0;page.on('request',r=>{if(/audio\/music/.test(r.url()))musicRequests++});
 page.setDefaultTimeout(12000);
 page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text())});
 await page.goto(base);await page.locator('.game-card').last().waitFor();
 assert.equal(await page.locator('.game-card').count(),6);assert.equal(await page.locator('audio[data-channel=music]').count(),1);assert.equal(musicRequests,0,'Sin descarga musical antes del gesto');
 for(const img of await page.locator('main img').all()){await img.scrollIntoViewIfNeeded();await img.evaluate(x=>x.decode())}await page.evaluate(()=>scrollTo(0,0));
 await page.screenshot({path:shots+`portada-${width}.png`,fullPage:true});
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 const axe=async label=>{await page.waitForTimeout(400);const a=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();report.accessibility.push({width,label,violations:a.violations.map(x=>({id:x.id,impact:x.impact,nodes:x.nodes.map(n=>n.target)}))})};
 await axe('collection');
 await page.locator('.skip').focus();await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>document.activeElement.id),'main');
 for(const meta of catalog.games){
  console.log('Testing',meta.slug);
  const g=JSON.parse(await fs.readFile(root+'web/coleccion-juridica/data/'+meta.slug+'.json'));
  await page.goto(base+g.slug+'/');await page.locator('[data-action=start]').waitFor();assert.match(await page.title(),new RegExp(g.title.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  await page.reload();await page.locator('[data-action=start]').click();
  for(let i=0;i<10;i++){
   await page.locator('[data-answer]').first().waitFor();assert.equal(await page.locator('[data-answer]').count(),3);assert.equal(await page.locator('#case-title').innerText(),g.questions[i].title);
   const chosen=width===390?g.questions[i].correct:(g.questions[i].correct+1)%3;
   await page.locator(`[data-answer="${chosen}"]`).click();
   await page.locator('.answer').waitFor();
   assert.equal(await page.locator('[data-answer]:disabled').count(),3);
   assert.equal(await page.locator('.option.correct').count(),1);
   await page.locator('.references summary').click();
   const links=await page.locator('.references a').evaluateAll(xs=>xs.map(x=>x.href));assert(links.length>0&&links.every(x=>x.startsWith('https://www.boe.es/')));
   const c=await page.locator('.consult-link').getAttribute('href');assert(c.startsWith('https://wa.me/34634330504?text='));const msg=new URL(c).searchParams.get('text');assert(!msg.includes('puntos')&&!msg.includes('/10'));
   if(i===0&&g.slug==='sucesiones'){
    await page.screenshot({path:shots+`partida-${width}.png`,fullPage:true});await axe('question-feedback');
    const music=page.locator('audio[data-channel=music]');
    if(width===390){
     const first=await music.evaluate(a=>a.currentTime);await page.waitForTimeout(450);const second=await music.evaluate(a=>a.currentTime);report.audio={initial:first,after:second,progress:second>first,readyState:await music.evaluate(a=>a.readyState),elements:await page.locator('audio[data-channel=music]').count()};
     assert(report.audio.progress,'El reloj de reproducción debe avanzar');assert.equal(report.audio.elements,1);
     await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))});assert(await music.evaluate(a=>a.paused));
     await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'))});await page.waitForTimeout(200);
     report.audio.resumed=!await music.evaluate(a=>a.paused);assert(report.audio.resumed);
    }
    await page.locator('#sound').click();assert.equal(await page.locator('#sound').getAttribute('aria-pressed'),'false');assert.equal(await page.locator('#effects').getAttribute('aria-pressed'),'true');await page.locator('#effects').click();assert.equal(await page.locator('#effects').getAttribute('aria-pressed'),'false');
   }
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await page.locator('[data-action=next]').click();
  }
  await page.locator('.score-card').waitFor();assert.match(await page.locator('.score').innerText(),width===390?/10\s*\/ 10/:/0\s*\/ 10/);
  assert.equal(await page.locator('.learning details').count(),10);
  if(g.slug==='sucesiones'){
   await page.screenshot({path:shots+`resultado-${width}.png`,fullPage:true});await axe('result');
   await page.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async t=>{window.copied=t}}})});await page.locator('[data-action=copy]').click();assert.equal(await page.evaluate(()=>window.copied),base+g.slug+'/');
   await page.evaluate(()=>{Object.defineProperty(navigator,'share',{configurable:true,value:async data=>{window.shared=data}})});
   await page.locator('[data-action=share]').click();assert.match(await page.evaluate(()=>window.shared.text),/10/);assert.equal(await page.evaluate(()=>window.shared.url),base+g.slug+'/');
   await page.evaluate(()=>{Object.defineProperty(navigator,'share',{configurable:true,value:async()=>{throw new DOMException('Cancelled','AbortError')}})});await page.locator('[data-action=share]').click();
   await page.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('denied')}}})});await page.locator('[data-action=copy]').click();assert.equal(await page.locator('#copy-fallback input').inputValue(),base+g.slug+'/');
   const dl=page.waitForEvent('download');await page.locator('[data-action=download]').click();const download=await dl;assert.match(download.suggestedFilename(),/\.png$/);
   await page.locator('[data-action=similar]').click();assert(await page.locator('#consult-detail').isVisible());
   await page.locator('[data-action=restart]').click();assert.equal(await page.locator('#sound').getAttribute('aria-pressed'),'false');assert.match(await page.locator('.play-top').innerText(),/0 puntos/);assert.equal(await page.locator('audio[data-channel=music]').count(),1);
  }
  report.flows.push({width,game:g.slug,questions:10,score:width===390?10:0,passed:true});
 }
 await page.goto(base+'fuentes/');await page.locator('.sources-page').waitFor();assert(await page.locator('.source-list a').count()>=10);await page.getByText('Diagnóstico de audio en este dispositivo',{exact:true}).click();await page.locator('[data-action=diagnose-audio]').click();assert.match(await page.locator('#audio-diagnostic').innerText(),/media-files-v4/);
 await context.close();
}
const reduced=await browser.newContext({viewport:{width:320,height:700},reducedMotion:'reduce'});const p=await reduced.newPage();await p.goto(base);await p.locator('.game-card').first().waitFor();assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.equal(await p.locator('.game-card').first().evaluate(e=>getComputedStyle(e).animationName),'none');await reduced.close();
assert.deepEqual(report.errors,[]);assert(report.accessibility.every(a=>a.violations.length===0),'Revisar accesibilidad');
console.log(JSON.stringify(report,null,2));
}finally{await fs.writeFile(shots+'browser-results.json',JSON.stringify(report,null,2)+'\n');await browser.close();server?.kill()}
