import {definePlugin,dataDir} from '@toolbelt/sdk';
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {initialState,screen,quick,event} from './scenarios';
const state=initialState();const file=join(dataDir(),'demo.json');
definePlugin({start(c){mkdirSync(dataDir(),{recursive:true});if(existsSync(file)){const saved=JSON.parse(readFileSync(file,'utf8'));state.count=Number(saved.count)||0;}c.badge(state.count);},prepare:async()=>({ready:!state.defer,...(state.defer?{reason:'SDK Explorer simulated unsafe operation. Turn off Defer in Lifecycle.'}:{})}),stop(){writeFileSync(file,JSON.stringify({count:state.count}));},render:{'screen:gallery':()=>screen('gallery',state),'screen:table':()=>screen('table',state),'screen:forms':()=>screen('forms',state),'screen:output':()=>screen('output',state),'screen:lifecycle':()=>screen('lifecycle',state),quick:()=>quick(state)},onEvent(_surface,name,payload,c){event(state,name,payload,c);writeFileSync(file,JSON.stringify({count:state.count}));}});
