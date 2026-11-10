import {mkdirSync,rmSync,cpSync,readFileSync,writeFileSync} from 'node:fs';
const out='dist/package';rmSync(out,{recursive:true,force:true});mkdirSync(out,{recursive:true});
const result=await Bun.build({entrypoints:['src/index.ts'],target:'bun'});if(!result.success)throw new AggregateError(result.logs,'Demo build failed');
await Bun.write(`${out}/index.js`,result.outputs[0]!);cpSync('assets',`${out}/assets`,{recursive:true});
writeFileSync(`${out}/toolbelt.json`,readFileSync('toolbelt.json'));writeFileSync(`${out}/NOTICE`,'SDK Explorer authored by Tamas Karakai. Public SDK dependency is bundled.\n');
