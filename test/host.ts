// SDK Explorer's real definition behind the SDK's fake host, which checks what ToolBelt checks:
// message validation and undeclared action or form ids (`invalid`, `rejected`).
import {PERSON,type Node,type PluginMessage,type ViewState} from '@toolbelt/sdk';
import {fakeHost} from '@toolbelt/sdk/testing';
import {mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {sdkExplorer} from '../src/plugin';
import {initialState,type State} from '../src/scenarios';

Object.assign(process.env,{TOOLBELT_PACKAGE_ROOT:join(import.meta.dir,'..'),TOOLBELT_PLUGIN:'sdk-demo',TOOLBELT_PLUGIN_VERSION:'0.0.1'});
export const manifest=await Bun.file(new URL('../toolbelt.json',import.meta.url)).json();
export type Page=Extract<Node,{type:'page'}>;export type Table=Extract<Node,{type:'table'}>;

/** Every node of a tree, depth first: children, page controls, dialogs and row panes. */
export function walk(tree:Node,out:Node[]=[]):Node[]{
 out.push(tree);
 if('children'in tree)tree.children.forEach(n=>walk(n,out));
 if(tree.type==='page'){tree.controls?.forEach(n=>walk(n,out));tree.dialog?.children.forEach(n=>walk(n,out));}
 if(tree.type==='table')for(const r of tree.rows)r.pane?.forEach(n=>walk(n,out));
 return out;
}
export const find=<T extends Node['type']>(tree:Node,type:T,id:string)=>walk(tree).find((n):n is Extract<Node,{type:T}>=>n.type===type&&'id'in n&&n.id===id)!;

/**
 * A started plugin with its own data folder (`saved` seeds `demo.json`; `close()` removes it), and helpers to open
 * instances, send events (an `agent:` instance's come from an agent) and read accepted trees.
 */
export async function started(state:State=initialState(),saved?:unknown){
 const data=mkdtempSync(join(tmpdir(),'sdk-demo-test-'));process.env.TOOLBELT_DATA_DIR=data;
 if(saved!==undefined)writeFileSync(join(data,'demo.json'),JSON.stringify(saved));
 const host=fakeHost(sdkExplorer(state));
 const close=host.close;host.close=()=>{close();rmSync(data,{recursive:true,force:true});};
 await host.hello([...manifest.capabilities.required,...manifest.capabilities.optional]);
 const renders=(surface:string,instance:string)=>host.messages.filter((m):m is Extract<PluginMessage,{type:'render'}>=>m.type==='render'&&m.surface===surface&&m.instance===instance);
 const page=(surface:string,instance=PERSON)=>{const t=host.tree(surface,instance);if(!t||t.type!=='page')throw Error(`No page accepted for ${surface} ${instance}: ${JSON.stringify(host.rejected)}`);return t as Page;};
 const table=(p:Page,id:string)=>find(p,'table',id);
 const event=(surface:string,instance:string,name:string,payload?:unknown)=>host.event(surface,name,payload,{instance,origin:instance===PERSON?'person':'agent',agent:'Test Agent'});
 return {host,state,data,renders,page,table,event,open:(surface:string,instance=PERSON,view?:ViewState)=>host.open(surface,instance,view)};
}
