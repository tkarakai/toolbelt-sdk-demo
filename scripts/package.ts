import {$} from 'bun';import {createHash} from 'node:crypto';import{mkdirSync,readFileSync,writeFileSync}from'node:fs';
await $`bun scripts/build.ts`;mkdirSync('artifacts',{recursive:true});
const m=JSON.parse(readFileSync('toolbelt.json','utf8'));const asset=`toolbelt-sdk-demo-${m.version}-darwin-arm64.tar.gz`;
await $`tar --format ustar -czf ${'artifacts/'+asset} -C dist/package .`.env({...process.env,COPYFILE_DISABLE:'1'});
const bytes=readFileSync('artifacts/'+asset),sha256=createHash('sha256').update(bytes).digest('hex'),commit=(await $`git rev-parse HEAD`.text()).trim();
writeFileSync('artifacts/toolbelt-release.json',JSON.stringify({formatVersion:1,id:m.id,version:m.version,repo:m.repo,commit,packages:[{target:'darwin-arm64',asset,sha256,size:bytes.byteLength}]},null,2)+'\n');
writeFileSync(`artifacts/${asset}.sha256`,`${sha256}  ${asset}\n`);console.log(`${asset} ${sha256}`);
