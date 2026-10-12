import {execFileSync} from 'node:child_process';
execFileSync('tar',['-xzf','assets.tar.gz'],{stdio:'inherit'});
execFileSync(process.execPath,['build-render.mjs'],{stdio:'inherit'});
