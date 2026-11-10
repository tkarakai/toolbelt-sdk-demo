import {mkdirSync,existsSync,writeFileSync} from 'node:fs';import{join}from'node:path';
import type {MigrationRequest} from '@toolbelt/sdk/package';
const request=JSON.parse(await Bun.stdin.text()) as MigrationRequest;
if(request.type!=='migrate'||request.toSchema!==1||!(request.fromSchema===null||request.fromSchema===1))throw Error('Unsupported demo schema transition');
console.log(JSON.stringify({type:'migration-progress',value:0.5,text:'Initialize disposable demo data'}));
mkdirSync(request.targetDir,{recursive:true});const file=join(request.targetDir,'demo.json');
if(!existsSync(file))writeFileSync(file,JSON.stringify({count:0}));
console.log(JSON.stringify({type:'migration-complete'}));
