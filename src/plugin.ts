import {dataDir,packageRoot,payload,type PluginDefinition} from '@toolbelt/sdk';
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {initialState,screen,quick,event,viewChanged,type State} from './scenarios';
import {declarations,SCREENS} from './views';
/**
 * SDK Explorer's definition. Views are SDK-owned: the declarations come from data (label filters)
 * and every render gets its instance's view. The host saves the person's view, so only the
 * counter is persisted here.
 */
export function sdkExplorer(state:State=initialState()):PluginDefinition{
 const file=()=>join(dataDir(),'demo.json');
 const save=()=>writeFileSync(file(),JSON.stringify({count:state.count}));
 return {
  views:()=>declarations(state),
  start(c){state.hostCapabilities=[...c.capabilities];mkdirSync(dataDir(),{recursive:true});if(existsSync(file())){const saved=JSON.parse(readFileSync(file(),'utf8'));state.count=Number(saved.count)||0;}state.packageFixture=readFileSync(payload("example.txt"),"utf8").trim();state.packagePath=packageRoot();c.badge(state.count);},
  prepare:async()=>({ready:!state.defer,...(state.defer?{reason:'SDK Explorer simulated unsafe operation. Turn off Defer in Lifecycle.'}:{})}),
  stop(){save();},
  render:{...Object.fromEntries(SCREENS.map(id=>[`screen:${id}`,(_c:unknown,view:Parameters<typeof screen>[2])=>screen(id,state,view)])),quick:()=>quick(state)},
  onView(surface,view,c){viewChanged(state,surface,view);c.invalidate('screen:output','screen:lifecycle');},
  onEvent(_surface,name,payload,c,info){event(state,name,payload,c,info);save();},
 };
}
