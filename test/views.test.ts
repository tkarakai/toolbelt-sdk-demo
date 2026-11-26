// Protocol 2 views through the production SDK: SDK Explorer's real definition behind a fake host.
import {afterAll,expect,test} from 'bun:test';
import {PERSON,type HostMessage,type Node,type PluginMessage,type ViewState} from '@toolbelt/sdk';
import {fakeHost} from '@toolbelt/sdk/testing';
import {validateTree} from '@toolbelt/sdk/validation';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {sdkExplorer} from '../src/plugin';
import {initialState,type State} from '../src/scenarios';
import {SCREENS,TASKS,declarations} from '../src/views';

const data=mkdtempSync(join(tmpdir(),'sdk-demo-views-'));
Object.assign(process.env,{TOOLBELT_DATA_DIR:data,TOOLBELT_PACKAGE_ROOT:join(import.meta.dir,'..'),TOOLBELT_PLUGIN:'sdk-demo',TOOLBELT_PLUGIN_VERSION:'0.0.1'});
afterAll(()=>rmSync(data,{recursive:true,force:true}));
const manifest=await Bun.file(new URL('../toolbelt.json',import.meta.url)).json();
type Page=Extract<Node,{type:'page'}>;type Table=Extract<Node,{type:'table'}>;

/** A started plugin with helpers to open instances and read what it sent. */
async function started(state:State=initialState()){
 const host=fakeHost(sdkExplorer(state));
 const settle=()=>Bun.sleep(5);
 host.send({type:'hello',protocol:2,plugin:{id:'sdk-demo'},host:{name:'views fixture host',version:'0.6.0'},capabilities:[...manifest.capabilities.required]});
 await settle();
 const send=async(m:HostMessage)=>{host.send(m);await settle();};
 const renders=(surface:string,instance:string)=>host.messages.filter((m):m is Extract<PluginMessage,{type:'render'}>=>m.type==='render'&&m.surface===surface&&m.instance===instance);
 const page=(surface:string,instance=PERSON)=>{const r=renders(surface,instance).at(-1);if(!r||r.tree.type!=='page')throw Error(`No page rendered for ${surface} ${instance}`);return r.tree as Page;};
 const table=(p:Page,id:string)=>p.children.find((n):n is Table=>n.type==='table'&&n.id===id)!;
 const event=(surface:string,instance:string,name:string,payload?:unknown)=>send({type:'event',surface,instance,name,payload});
 return {host,state,send,renders,page,table,event,open:(surface:string,instance=PERSON,view?:ViewState)=>send({type:'open',surface,instance,...(view?{view}:{})})};
}

test('the manifest speaks protocol 2 and every screen has a declared view',async()=>{
 expect(manifest.protocol).toBe(2);expect(manifest.agent.access).toBe('read');expect(manifest.requires.host).toBe('>=0.6.0');
 expect(manifest.screens.map((s:{id:string})=>s.id)).toEqual([...SCREENS]);
 const {host}=await started();
 try{
  const hello=host.messages.find(m=>m.type==='hello');
  if(hello?.type!=='hello')throw Error('No hello');
  expect(hello.protocol).toBe(2);
  expect(Object.keys(hello.views??{}).sort()).toEqual(SCREENS.map(id=>`screen:${id}`).sort());
  expect(hello.views?.['screen:views']).toEqual({search:true,filters:{status:['open','doing'],'label-area':[]},sort:{'view-tasks':{key:'due',desc:false}},controls:{due:'any'},arrange:{order:['status','label-area'],grouped:['status']}});
 }finally{host.close();}
});

test('the SDK fills the Views page from the declared defaults',async()=>{
 const t=await started();
 try{
  await t.open('screen:views');
  const p=t.page('screen:views');
  expect(()=>validateTree(p)).not.toThrow();
  expect(p.search?.query).toBe('');
  const status=p.filters?.find(f=>f.id==='status');
  expect(status).toMatchObject({selected:['open','doing'],default:{values:['open','doing'],label:'Ongoing'},group:true});
  expect(p.filters?.find(f=>f.id==='label-area')).toMatchObject({selected:[],group:false});
  expect(p.controls?.[0]).toMatchObject({type:'choice',id:'due',value:'any'});
  const tasks=t.table(p,'view-tasks');
  expect(tasks.sort).toEqual({key:'due',desc:false});
  // Ongoing tasks only, by due date, grouped by status.
  const ongoing=TASKS.filter(x=>x.status==='open'||x.status==='doing').sort((a,b)=>a.due-b.due);
  expect(tasks.rows.map(r=>r.id)).toEqual(ongoing.map(x=>x.id));
  expect(tasks.rows.every(r=>Array.isArray(r.group)&&r.group.length===1)).toBe(true);
  expect(JSON.stringify(p)).toContain('Rendering for person');
 }finally{t.host.close();}
});

test('search, filter, sort, choice and arrangement events are applied by the SDK, not onEvent',async()=>{
 const t=await started();
 try{
  await t.open('screen:views');
  await t.event('screen:views',PERSON,'search',{query:'fixture'});
  await t.event('screen:views',PERSON,'filter',{filter:'status',values:['doing','blocked']});
  await t.event('screen:views',PERSON,'sort',{table:'view-tasks',key:'points',desc:true});
  await t.event('screen:views',PERSON,'field',{form:'due',field:'due',value:'week'});
  await t.event('screen:views',PERSON,'filter-arrange',{order:['label-area','status'],grouped:['label-area','status']});
  const views=t.host.messages.filter(m=>m.type==='view'&&m.surface==='screen:views'&&m.instance===PERSON);
  expect(views.length).toBe(5);
  expect(views.at(-1)).toMatchObject({view:{search:'fixture',filters:{status:['doing','blocked']},sort:{'view-tasks':{key:'points',desc:true}},controls:{due:'week'},arrange:{order:['label-area','status'],grouped:['label-area','status']}}});
  const p=t.page('screen:views');
  expect(()=>validateTree(p)).not.toThrow();
  expect(p.search?.query).toBe('fixture');expect(p.highlight).toEqual(['fixture']);
  expect(p.filters?.map(f=>[f.id,f.group])).toEqual([['label-area',true],['status',true]]);
  expect(p.filters?.find(f=>f.id==='status')?.selected).toEqual(['doing','blocked']);
  expect(p.controls?.[0]).toMatchObject({value:'week'});
  const tasks=t.table(p,'view-tasks');
  expect(tasks.sort).toEqual({key:'points',desc:true});
  // "Cache fixture packages" (doing, due in 6 days) is the only match: t2 is overdue.
  expect(tasks.rows.map(r=>r.id)).toEqual(['t5']);
  expect(tasks.rows[0]?.group).toEqual([{id:'label-area=Build',label:'Build'},{id:'label-area=Build/status=doing',label:'Doing'}]);
  // onView logged each change; none reached onEvent.
  expect(t.state.events.filter(e=>e.startsWith('view screen:views')).length).toBe(5);
  expect(t.state.events.some(e=>/^(search|filter|sort|field|filter-arrange)\b/.test(e))).toBe(false);
  // Undeclared ids still reach onEvent: the Forms field is plugin-owned form state.
  await t.open('screen:forms');
  await t.event('screen:forms',PERSON,'field',{form:'preferences',field:'name',value:'Grace'});
  expect(t.state.fields.name).toBe('Grace');
 }finally{t.host.close();}
});

test('Tables search, filter, sort and toolbar control are SDK-owned too',async()=>{
 const t=await started();
 try{
  await t.open('screen:table');
  await t.event('screen:table',PERSON,'filter',{filter:'fixtures',values:['plain']});
  await t.event('screen:table',PERSON,'sort',{table:'capability-table',key:'value',desc:true});
  await t.event('screen:table',PERSON,'field',{form:'fixture-scope',field:'fixture-scope',value:'expanded'});
  const p=t.page('screen:table');
  expect(p.filters?.[0]?.selected).toEqual(['plain']);
  expect(p.controls?.[0]).toMatchObject({id:'fixture-scope',value:'expanded'});
  const table=t.table(p,'capability-table');
  expect(table.sort).toEqual({key:'value',desc:true});expect(table.rows.map(r=>r.id)).toEqual(['plain']);
  expect(t.state.fields['fixture-scope']).toBeUndefined();
 }finally{t.host.close();}
});

test('agent instances render independently and never change the person\'s view',async()=>{
 const t=await started();
 try{
  await t.open('screen:views');await t.open('screen:views','agent:one');
  // The host can open an agent instance with a view to start from.
  await t.open('screen:views','agent:two',{filters:{status:[]},controls:{due:'overdue'}});
  const personBefore=t.renders('screen:views',PERSON).length;
  await t.event('screen:views','agent:one','search',{query:'guide'});
  // Only agent:one re-rendered; the person's last tree is unchanged.
  expect(t.renders('screen:views',PERSON).length).toBe(personBefore);
  expect(t.page('screen:views','agent:one').search?.query).toBe('guide');
  expect(t.table(t.page('screen:views','agent:one'),'view-tasks').rows.map(r=>r.id)).toEqual(['t1']);
  expect(t.page('screen:views').search?.query).toBe('');
  expect(t.table(t.page('screen:views','agent:two'),'view-tasks').rows.map(r=>r.id).sort()).toEqual(['t2','t6','t7']);
  for(const instance of ['agent:one','agent:two'])expect(JSON.stringify(t.page('screen:views',instance))).toContain(`Rendering for ${instance}`);
  expect(t.state.events[0]).toStartWith('view screen:views @agent:one');
  // Dialogs belong to whoever opened them.
  await t.event('screen:views',PERSON,'open-dialog');
  expect(t.page('screen:views').dialog?.id).toBe('fixture-dialog');
  expect(t.page('screen:views','agent:one').dialog).toBeUndefined();
  // The host setting the person's view (Restore, an agent showing something) re-renders it.
  await t.send({type:'view',surface:'screen:views',instance:PERSON,view:{search:'palette',controls:{due:'any'}}});
  expect(t.page('screen:views').search?.query).toBe('palette');
  expect(t.page('screen:views','agent:one').search?.query).toBe('guide');
 }finally{t.host.close();}
});

test('label filters come from data and are declared again when they change',async()=>{
 const t=await started();
 try{
  await t.open('screen:views');await t.open('screen:views','agent:one');
  await t.event('screen:views',PERSON,'add-label');
  const declared=()=>t.host.messages.filter((m):m is Extract<PluginMessage,{type:'views'}>=>m.type==='views').at(-1)?.views['screen:views'];
  expect(declared()?.filters).toEqual({status:['open','doing'],'label-area':[],'label-size':[]});
  expect(declared()?.arrange?.order).toEqual(['status','label-area','label-size']);
  // Both instances show the new filter, in their saved arrangement plus the new id.
  for(const instance of [PERSON,'agent:one'])expect(t.page('screen:views',instance).filters?.map(f=>f.id)).toEqual(['status','label-area','label-size']);
  await t.event('screen:views',PERSON,'filter',{filter:'label-size',values:['Large']});
  await t.event('screen:views',PERSON,'filter-arrange',{order:['label-size','status','label-area'],grouped:['label-size','status']});
  expect(t.table(t.page('screen:views'),'view-tasks').rows.map(r=>r.id).sort()).toEqual(['t2','t5']);
  // A third filter can't group: two levels is the fixture's limit.
  expect(t.page('screen:views').filters?.find(f=>f.id==='label-area')?.groupDisabled).toContain('2 levels');
  await t.event('screen:views',PERSON,'remove-label');
  expect(declared()?.filters).toEqual({status:['open','doing'],'label-area':[]});
  // The SDK dropped the filter's state; the arrangement's stale id is ignored when rendering.
  const p=t.page('screen:views');
  expect(()=>validateTree(p)).not.toThrow();
  expect(p.filters?.map(f=>[f.id,f.group])).toEqual([['status',true],['label-area',false]]);
  expect(t.table(p,'view-tasks').rows.length).toBeGreaterThan(2);
  expect(JSON.stringify(p)).toContain('Declared filters: status, label-area');
  // Every kind added, then none: the actions turn off at each end.
  for(let i=0;i<3;i++)await t.event('screen:views',PERSON,'add-label');
  const card=(p:Page)=>p.children.find(n=>n.type==='card'&&n.id==='view-from-data') as Extract<Node,{type:'card'}>;
  expect(card(t.page('screen:views')).actions?.find(a=>a.id==='add-label')?.disabled).toBe(true);
  for(let i=0;i<4;i++)await t.event('screen:views',PERSON,'remove-label');
  expect(card(t.page('screen:views')).actions?.find(a=>a.id==='remove-label')?.disabled).toBe(true);
  expect(t.page('screen:views').filters?.map(f=>f.id)).toEqual(['status']);
 }finally{t.host.close();}
});

test('every screen renders a valid tree for the person and for an agent',async()=>{
 const t=await started();
 try{
  for(const id of SCREENS){await t.open(`screen:${id}`);await t.open(`screen:${id}`,'agent:check');}
  for(const id of SCREENS)for(const instance of [PERSON,'agent:check'])expect(()=>validateTree(t.page(`screen:${id}`,instance))).not.toThrow();
  expect(Object.keys(declarations(t.state))).toEqual(SCREENS.map(id=>`screen:${id}`));
 }finally{t.host.close();}
});
