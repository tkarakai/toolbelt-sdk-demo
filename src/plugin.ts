import {dataDir,packageRoot,payload,type EventResult,type PluginDefinition} from '@toolbelt/sdk';
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {initialState,screen,quick,event,viewChanged,type State} from './scenarios';
import {declarations,savedLabelKinds,SCREENS} from './views';
import {floating,floatingEvent} from './floating';
import {ACTIONS,FORMS} from './declarations';
import {instanceClosed,instanceOpened,outcome,recordEvent} from './actions';
/**
 * SDK Explorer's definition (protocol 3). Every action id and form is declared with its effect; views
 * are SDK-owned, and their declarations come from data (label filters) that `start` loads, so the SDK
 * sends them again after `start` without a `declare()` call. The host saves the person's view, so only
 * the counter and the label kinds are persisted here.
 */
export function sdkExplorer(state:State=initialState()):PluginDefinition{
 const file=()=>join(dataDir(),'demo.json');
 const save=()=>writeFileSync(file(),JSON.stringify({count:state.count,labelKinds:state.labelKinds}));
 return {
  views:()=>declarations(state),
  actions:ACTIONS,
  forms:FORMS,
  start(c){
   state.hostCapabilities=[...c.capabilities];mkdirSync(dataDir(),{recursive:true});
   if(existsSync(file())){const saved=JSON.parse(readFileSync(file(),'utf8'));state.count=Number(saved.count)||0;state.labelKinds=savedLabelKinds(saved.labelKinds)??state.labelKinds;}
   state.packageFixture=readFileSync(payload("example.txt"),"utf8").trim();state.packagePath=packageRoot();c.badge(state.count);
  },
  prepare:async()=>({ready:!state.defer,...(state.defer?{reason:'SDK Explorer simulated unsafe operation. Turn off Defer in Lifecycle.'}:{})}),
  stop(){save();},
  render:{...Object.fromEntries(SCREENS.map(id=>[`screen:${id}`,(_c:unknown,view:Parameters<typeof screen>[2])=>screen(id,state,view)])),quick:()=>quick(state),floating:()=>floating(state.floating)},
  onView(surface,view,c){const r=viewChanged(state,surface,view);c.invalidate('screen:output','screen:lifecycle');return r;},
  onOpen(surface,c,{instance,origin}){instanceOpened(state.actions,surface,instance,origin);c.invalidate('screen:actions');},
  onClose(surface,c,{instance}){instanceClosed(state.actions,surface,instance);c.invalidate('screen:actions');},
  onEvent(surface,name,payload,c,info){
   let result:EventResult;
   try{result=surface==='floating'?(floatingEvent(state.floating,name,payload,c)?undefined:false):event(state,name,payload,c,info);}
   catch(error){recordEvent(state.actions,surface,name,info,outcome(undefined,error));c.invalidate('screen:actions');throw error;}
   recordEvent(state.actions,surface,name,info,outcome(result));c.invalidate('screen:actions');
   save();
   return result;
  },
 };
}
