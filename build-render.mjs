import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const origin=process.env.SITE_ORIGIN||process.env.RENDER_EXTERNAL_URL;
if(!origin)throw new Error('Set SITE_ORIGIN to the confirmed HTTPS deployment URL');
const url=new URL(origin);if(url.protocol!=='https:')throw new Error('HTTPS required');
const source='https://inavarro-noticias.creamaphid4.chatgpt.site';
const response=await fetch(source+'/data/news.json',{signal:AbortSignal.timeout(30000)});
if(!response.ok)throw new Error('Public news source unavailable: '+response.status);
const data=await response.json();
if(!Array.isArray(data.posts)||!data.lastChecked)throw new Error('Invalid public news data');
const c=JSON.parse(fs.readFileSync('config.json','utf8'));c.origin=url.origin;c.mainWebsite=url.origin+'/despacho/';c.lastChecked=data.lastChecked;
fs.writeFileSync('posts.json',JSON.stringify(data.posts,null,2)+'\n');
fs.writeFileSync('config.json',JSON.stringify(c,null,2)+'\n');
execFileSync(process.execPath,['build.mjs'],{stdio:'inherit'});
for(const p of data.posts){
 const pathname='/noticias/'+p.slug+'/og.png';
 const image=await fetch(source+pathname,{signal:AbortSignal.timeout(30000)});
 if(image.ok)fs.writeFileSync('dist'+pathname,Buffer.from(await image.arrayBuffer()));
 else fs.copyFileSync('dist/og-default.png','dist'+pathname);
}
console.log('Published '+data.posts.length+' verified news articles from the editorial source');
