import {mkdirSync,rmSync,cpSync,readFileSync,writeFileSync} from 'node:fs';
const out='dist/package';rmSync(out,{recursive:true,force:true});mkdirSync(out,{recursive:true});
const result=await Bun.build({entrypoints:['src/index.ts'],target:'bun'});if(!result.success)throw new AggregateError(result.logs,'Demo build failed');
await Bun.write(`${out}/index.js`,result.outputs[0]!);cpSync('assets',`${out}/assets`,{recursive:true});
writeFileSync(`${out}/toolbelt.json`,readFileSync('toolbelt.json'));writeFileSync(`${out}/NOTICE`,'SDK Explorer authored by Tamas Karakai. Public SDK dependency is bundled.\n');

const migration=await Bun.build({entrypoints:["src/migrate.ts"],target:"bun"});if(!migration.success)throw new AggregateError(migration.logs,"Migration build failed");await Bun.write(`${out}/migrate.js`,migration.outputs[0]!);cpSync("payload",`${out}/payload`,{recursive:true});
