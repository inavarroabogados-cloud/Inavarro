import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const origin=process.env.SITE_ORIGIN||process.env.RENDER_EXTERNAL_URL;
if(!origin)throw new Error('Set SITE_ORIGIN to the confirmed HTTPS deployment URL');
const url=new URL(origin);if(url.protocol!=='https:')throw new Error('HTTPS required');
const c=JSON.parse(fs.readFileSync('config.json','utf8'));c.origin=url.origin;
fs.writeFileSync('config.json',JSON.stringify(c,null,2)+'\n');
execFileSync(process.execPath,['build.mjs'],{stdio:'inherit'});
