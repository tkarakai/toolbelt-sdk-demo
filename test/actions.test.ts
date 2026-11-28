// Protocol 3 contracts through the production SDK: declarations, every effect, both kinds of form,
// results, tags, navigation, per-instance hooks, refused views, allowed values, clearing a sort and
// declarations from data loaded in `start`.
import {expect,test} from 'bun:test';
import {PERSON,RESERVED_EVENTS,type Node} from '@toolbelt/sdk';
import {validateTree} from '@toolbelt/sdk/validation';
import {ACTIONS,FORMS} from '../src/declarations';
import {GUIDE} from '../src/actions';
import {SCREENS} from '../src/views';
import {find,manifest,started,walk,type Page} from './host';

const AGENT='agent:s1:actions';
const items=(p:Page)=>find(p,'table','act-items');
const card=(p:Page,id:string)=>find(p,'card',id);
const action=(p:Page,id:string)=>walk(p).flatMap(n=>n.type==='card'||n.type==='table'?[...(n.actions??[]),...(n.type==='table'?n.bulkActions??[]:[])]:[]).flatMap(a=>[a,...(a.menu??[])]).find(a=>a.id===id);

test('every action id and form is declared, used, and none is a built-in event name',async()=>{
 expect(manifest.agent.access).toBe('act');
 for(const cap of ['ui.split-action','navigate','ui.row-pane'])expect(manifest.capabilities.required).toContain(cap);
 const t=await started();
 try{
  const hello=t.host.messages.find(m=>m.type==='hello');if(hello?.type!=='hello')throw Error('No hello');
  expect(hello.declarations.actions).toEqual(ACTIONS);expect(hello.declarations.forms).toEqual(FORMS);
  for(const id of Object.keys(ACTIONS))expect(RESERVED_EVENTS as readonly string[]).not.toContain(id);
  expect(ACTIONS['restore-samples']).toEqual({effect:'write',agent:false});
  expect(FORMS['item-draft'].effect).toBe('view');expect(FORMS['item-pane'].effect).toBe('write');
  expect(new Set(Object.values(ACTIONS).map(a=>a.effect))).toEqual(new Set(['view','write','external','destructive']));
  // Every surface renders for the person and an agent without a rejection; dialogs open too.
  for(const id of SCREENS){await t.open(`screen:${id}`);await t.open(`screen:${id}`,'agent:check');}
  await t.open('quick');await t.open('floating');
  await t.event('screen:actions',PERSON,'new-item');await t.event('screen:gallery','agent:check','open-dialog');
  for(const page of ['form','list'])await t.event('floating',PERSON,`floating-page-${page}`);
  expect(t.host.rejected).toEqual([]);expect(t.host.invalid).toEqual([]);
  // Each declared id appears in some tree or toast: the declarations aren't stale.
  const trees=JSON.stringify([...SCREENS.flatMap(id=>[t.host.tree(`screen:${id}`),t.host.tree(`screen:${id}`,'agent:check')]),t.host.tree('quick'),t.host.tree('floating'),t.host.messages.filter(m=>m.type==='render'&&m.surface==='floating').map(m=>m.type==='render'&&m.tree)]);
  const toastButtons=['undo','undo-clear'];
  for(const id of Object.keys(ACTIONS))if(!toastButtons.includes(id))expect(trees).toContain(`"id":"${id}"`);
  for(const id of Object.keys(FORMS))expect(trees).toContain(`"id":"${id}"`);
 }finally{t.host.close();}
});

test('a view action changes only the instance that sent it',async()=>{
 const t=await started();
 try{
  await t.open('screen:actions');await t.open('screen:actions',AGENT);
  const r=await t.event('screen:actions',AGENT,'toggle-tip',{rowId:'effects'});
  expect(r).toMatchObject({handled:true});
  expect(JSON.stringify(t.page('screen:actions',AGENT))).toContain(`Tip for ${AGENT}`);
  expect(JSON.stringify(t.page('screen:actions'))).not.toContain('Tip for');
  expect(action(t.page('screen:actions',AGENT),'toggle-tip')?.label).toBe('Hide tip');
  expect(action(t.page('screen:actions'),'toggle-tip')?.label).toBe('Show tip');
 }finally{t.host.close();}
});

test('writes return data, the split button offers alternatives, and the external action opens nothing',async()=>{
 const t=await started();
 try{
  await t.open('screen:actions');
  const add=action(t.page('screen:actions'),'add-item');
  expect(add?.menu?.map(a=>a.id)).toEqual(['add-three','new-item']);
  const one=await t.event('screen:actions',PERSON,'add-item',{rowId:'effects'});
  expect(one).toMatchObject({handled:true,data:{id:'i4'}});
  const three=await t.event('screen:actions',PERSON,'add-three',{rowId:'effects'});
  expect(three.data).toEqual({ids:['i5','i6','i7']});
  expect(items(t.page('screen:actions')).rows.length).toBe(7);
  expect(action(t.page('screen:actions'),'open-guide')?.confirm).toContain('nothing leaves the plugin');
  const guide=await t.event('screen:actions',AGENT,'open-guide',{rowId:'effects'});
  expect(guide).toMatchObject({handled:true,data:{url:GUIDE,opened:false}});
  expect(guide.toasts[0]?.text).toContain('opens nothing');
 }finally{t.host.close();}
});

test('the destructive action confirms, and its toast\'s Undo brings the items back',async()=>{
 const t=await started();
 try{
  await t.open('screen:actions');
  const clear=action(t.page('screen:actions'),'clear-items');
  expect(clear).toMatchObject({tone:'destructive'});expect(clear?.confirm).toBeString();
  expect(action(t.page('screen:actions'),'item-delete')?.confirm).toBeString();
  const r=await t.event('screen:actions',PERSON,'clear-items',{rowId:'effects'});
  // The toast is tagged with the event, so ToolBelt knows who acted.
  expect(r.toasts).toHaveLength(1);
  expect(r.toasts[0]).toMatchObject({text:'Cleared 3 fixture items',action:{id:'undo-clear',label:'Undo',key:'cmd+z'}});
  expect(items(t.page('screen:actions')).rows).toEqual([]);
  expect(action(t.page('screen:actions'),'clear-items')?.disabled).toBe(true);
  await t.host.event('toast','undo-clear',undefined);
  // Sorted by title, as declared.
  expect(items(t.page('screen:actions')).rows.map(r=>r.id)).toEqual(['i3','i2','i1']);
  // A second Undo has nothing to restore: not handled.
  expect(await t.host.event('toast','undo-clear',undefined)).toMatchObject({handled:false});
 }finally{t.host.close();}
});

test('the New item dialog is a per-instance draft form, saved by a write that returns the id',async()=>{
 const t=await started();
 try{
  await t.open('screen:actions');await t.open('screen:actions',AGENT);
  await t.event('screen:actions',AGENT,'new-item',{rowId:'effects'});
  expect(t.page('screen:actions',AGENT).dialog?.id).toBe('new-item');
  expect(t.page('screen:actions').dialog).toBeUndefined();
  const save=()=>t.page('screen:actions',AGENT).dialog?.actions?.find(a=>a.id==='save-item');
  expect(save()?.disabled).toBe(true);
  await t.event('screen:actions',AGENT,'field',{form:'item-draft',field:'title',value:'Buy fixture string'});
  await t.event('screen:actions',AGENT,'field',{form:'item-draft',field:'priority',value:'high'});
  expect(save()?.disabled).toBe(false);
  expect(items(t.page('screen:actions')).rows).toHaveLength(3);
  const r=await t.event('screen:actions',AGENT,'save-item',{dialog:'new-item'});
  expect(r).toMatchObject({handled:true,data:{id:'i4'}});expect(r.toasts[0]?.text).toBe('Added “Buy fixture string”');
  expect(t.page('screen:actions',AGENT).dialog).toBeUndefined();
  expect(t.state.actions.items.find(i=>i.id==='i4')).toMatchObject({title:'Buy fixture string',priority:'high'});
  // Esc closes the person's draft without saving; Save without a draft is an error.
  await t.event('screen:actions',PERSON,'new-item',{rowId:'effects'});
  await t.event('screen:actions',PERSON,'dialog-close',{dialog:'new-item'});
  expect(t.page('screen:actions').dialog).toBeUndefined();
  expect(await t.event('screen:actions',PERSON,'save-item',{dialog:'new-item'})).toMatchObject({handled:true,error:'No New item draft is open'});
 }finally{t.host.close();}
});

test('rows: a pane form that saves each field, an input action, a split menu and a bulk write',async()=>{
 const t=await started();
 try{
  await t.open('screen:actions');
  const table=items(t.page('screen:actions'));
  const row=table.rows.find(r=>r.id==='i1')!;
  expect(row.pane?.[0]).toMatchObject({type:'form',id:'item-pane',appearance:'inline'});
  expect(table.actions?.find(a=>a.id==='item-rename')?.input).toEqual({placeholder:'New title'});
  expect(table.actions?.find(a=>a.id==='item-copy')?.menu?.map(a=>a.id)).toEqual(['item-copy-id']);
  await t.event('screen:actions',PERSON,'field',{form:'item-pane',field:'note',value:'Twice a week',rowId:'i1'});
  await t.event('screen:actions',PERSON,'field',{form:'item-pane',field:'priority',value:'high',rowId:'i1'});
  expect(t.state.actions.items[0]).toMatchObject({note:'Twice a week',priority:'high'});
  expect(await t.event('screen:actions',PERSON,'field',{form:'item-pane',field:'title',value:'  ',rowId:'i1'})).toMatchObject({error:'A title can’t be empty'});
  await t.event('screen:actions',PERSON,'item-rename',{rowId:'i1',text:'Water the plants'});
  expect(t.state.actions.items[0]?.title).toBe('Water the plants');
  expect((await t.event('screen:actions',AGENT,'item-copy-id',{rowId:'i2'})).clipboard).toEqual(['i2']);
  expect((await t.event('screen:actions',PERSON,'item-copy',{rowId:'i2'})).clipboard).toEqual(['Label the demo boxes']);
  expect(await t.event('screen:actions',PERSON,'items-done',{rowIds:['i1','i2','i3']})).toMatchObject({data:{done:2}});
  expect(items(t.page('screen:actions')).rows.every(r=>r.actions?.includes('item-reopen'))).toBe(true);
  await t.event('screen:actions',PERSON,'item-delete',{rowId:'i3'});
  expect(t.state.actions.items.map(i=>i.id)).toEqual(['i1','i2']);
  expect(t.host.rejected).toEqual([]);
 }finally{t.host.close();}
});

test('results: an error, not handled, and the events panel with id, origin, instance and outcome',async()=>{
 const t=await started();
 try{
  await t.open('screen:actions');
  expect(await t.event('screen:actions',PERSON,'fail-on-purpose',{rowId:'results'})).toMatchObject({handled:true,error:'A fixture failure: nothing changed'});
  expect(await t.event('screen:actions',PERSON,'decline',{rowId:'results'})).toMatchObject({handled:false});
  const r=await t.event('screen:actions',AGENT,'add-item',{rowId:'effects'});
  const log=t.state.actions.eventLog;
  expect(log.map(e=>e.outcome)).toEqual(['data {"id":"i4"}','not handled','error: A fixture failure: nothing changed']);
  expect(log[0]).toMatchObject({id:r.id,name:'add-item',instance:AGENT,origin:'agent',agent:'Test Agent'});
  const panel=JSON.stringify(card(t.page('screen:actions'),'results'));
  for(const text of [r.id,AGENT,'agent (Test Agent)','data {\\"id\\":\\"i4\\"}','not handled','error: A fixture failure'])expect(panel).toContain(text);
  expect(find(t.page('screen:actions'),'table','act-events').rows.map(x=>x.id)).toEqual(log.map(e=>e.id));
 }finally{t.host.close();}
});

test('navigation from an action is tagged with its event',async()=>{
 const t=await started();
 try{
  await t.open('screen:actions');
  const r=await t.event('screen:actions',PERSON,'go-views',{rowId:'results'});
  expect(r).toMatchObject({handled:true});expect(r.navigations).toEqual([{screen:'views',select:'t2'}]);
  // Navigation sent outside a handler carries no event, so ToolBelt ignores it.
  t.host.context.navigate('views');await t.host.idle();
  expect(t.host.messages.filter(m=>m.type==='navigate').at(-1)).not.toHaveProperty('event');
 }finally{t.host.close();}
});

test('onOpen and onClose fire for every instance, and the Instances card shows them',async()=>{
 const t=await started();
 try{
  await t.open('screen:actions');await t.open('screen:gallery');await t.open('screen:actions',AGENT);
  const list=()=>find(t.page('screen:actions'),'list','act-instances').items.map(i=>[i.title,i.subtitle,i.meta]);
  expect(list()).toEqual([['screen:actions','person','person'],['screen:actions',AGENT,'agent'],['screen:gallery','person','person']]);
  expect(card(t.page('screen:actions'),'instances').title).toBe('Open instances · 3 opened, 0 closed');
  await t.event('screen:actions',AGENT,'new-item',{rowId:'effects'});
  await t.host.closeInstance('screen:actions',AGENT);
  expect(list()).toEqual([['screen:actions','person','person'],['screen:gallery','person','person']]);
  expect(card(t.page('screen:actions'),'instances').title).toBe('Open instances · 3 opened, 1 closed');
  // The closed copy took its draft with it.
  expect(t.state.actions.drafts[AGENT]).toBeUndefined();
  expect(t.host.context.open.has('screen:actions')).toBe(true);
 }finally{t.host.close();}
});

test('agents\' copies change only with their own events or shared data, so many copies stay within the render rate',async()=>{
 const t=await started();
 try{
  await t.open('screen:actions');
  const agents=Array.from({length:12},(_,i)=>`agent:s${i}:actions`);
  for(const a of agents)await t.open('screen:actions',a);
  const count=(instance:string)=>t.renders('screen:actions',instance).length;
  const before=agents.map(count);
  // Another copy opening, a view action and an error re-render the person and the acting copy only.
  await t.open('screen:actions','agent:late:actions');
  await t.event('screen:actions','agent:late:actions','toggle-tip',{rowId:'effects'});
  await t.event('screen:actions','agent:late:actions','fail-on-purpose',{rowId:'results'});
  expect(agents.map(count)).toEqual(before);
  expect(JSON.stringify(card(t.page('screen:actions','agent:late:actions'),'results'))).toContain('error: A fixture failure');
  expect(JSON.stringify(card(t.page('screen:actions',agents[0]),'results'))).not.toContain('error: A fixture failure');
  expect(card(t.page('screen:actions','agent:late:actions'),'instances').title).toBe('Your acting copy');
  expect(JSON.stringify(card(t.page('screen:actions'),'results'))).toContain('agent:late:actions');
  // A write changes shared data: every copy shows it.
  await t.event('screen:actions','agent:late:actions','add-item',{rowId:'effects'});
  expect(agents.map(count)).toEqual(before.map(n=>n+1));
  expect(t.host.rejected).toEqual([]);expect(t.host.invalid).toEqual([]);
 }finally{t.host.close();}
});

test('the SDK fills the card table\'s sort, and clearing it shows items as they were added',async()=>{
 const t=await started();
 try{
  await t.open('screen:actions');
  await t.event('screen:actions',PERSON,'add-item',{rowId:'effects'});
  t.state.actions.items[3]!.title='A fixture added last';
  t.host.context.invalidate();await t.host.idle();
  const ids=()=>items(t.page('screen:actions')).rows.map(r=>r.id);
  // Declared sort: by title. The plugin doesn't set `sort` on the table; the SDK does.
  expect(items(t.page('screen:actions')).sort).toEqual({key:'title',desc:false});
  expect(ids()).toEqual(['i4','i3','i2','i1']);
  await t.event('screen:actions',PERSON,'sort',{table:'act-items',key:'priority',desc:true});
  expect(ids()).toEqual(['i2','i1','i4','i3']);
  // An agent (or the host) returns the table to unsorted.
  await t.open('screen:actions',AGENT,{sort:{'act-items':null}});
  expect(items(t.page('screen:actions',AGENT)).sort).toBeUndefined();
  expect(ids()).toEqual(['i2','i1','i4','i3']);
  expect(items(t.page('screen:actions',AGENT)).rows.map(r=>r.id)).toEqual(['i1','i2','i3','i4']);
  await t.event('screen:actions',PERSON,'sort',{table:'act-items',key:null,desc:false});
  expect(ids()).toEqual(['i1','i2','i3','i4']);
 }finally{t.host.close();}
});

test('the view lock makes onView refuse changes; the instance keeps its view',async()=>{
 const t=await started();
 try{
  await t.open('screen:views');
  await t.event('screen:views',PERSON,'lock-view',{rowId:'view-state'});
  const r=await t.event('screen:views',PERSON,'filter',{filter:'status',values:['done']});
  expect(r).toMatchObject({handled:false,error:'refused: the plugin refused this view'});
  expect(t.host.refusals.at(-1)).toMatchObject({surface:'screen:views',instance:PERSON,reason:'the plugin refused this view'});
  expect(t.page('screen:views').filters?.find(f=>f.id==='status')?.selected).toEqual(['open','doing']);
  const p=JSON.stringify(t.page('screen:views'));expect(p).toContain('Unlock view');expect(p).toContain('refused person');
  // An agent opening with a view while locked starts from the defaults.
  await t.open('screen:views','agent:locked',{search:'guide'});
  expect(t.page('screen:views','agent:locked').search?.query).toBe('');
  await t.event('screen:views',PERSON,'lock-view',{rowId:'view-state'});
  expect(await t.event('screen:views',PERSON,'filter',{filter:'status',values:['done']})).toMatchObject({handled:true});
  expect(t.page('screen:views').filters?.find(f=>f.id==='status')?.selected).toEqual(['done']);
 }finally{t.host.close();}
});

test('allowed values: an agent\'s view outside them is refused, a saved one loses them',async()=>{
 const t=await started();
 try{
  await t.open('screen:views','agent:bad',{controls:{due:'someday'}});
  expect(t.host.refusals.at(-1)).toMatchObject({instance:'agent:bad'});
  expect(t.host.refusals.at(-1)?.reason).toContain('someday');
  expect(t.page('screen:views','agent:bad').controls?.[0]).toMatchObject({value:'any'});
  expect(await t.event('screen:views','agent:bad','filter',{filter:'status',values:['archived']})).toMatchObject({handled:false});
  // The person's saved view keeps what's still allowed.
  await t.open('screen:views',PERSON,{filters:{status:['done','archived']},controls:{due:'someday'}});
  expect(t.page('screen:views').filters?.find(f=>f.id==='status')?.selected).toEqual(['done']);
  expect(t.page('screen:views').controls?.[0]).toMatchObject({value:'any'});
  expect(JSON.stringify(t.page('screen:views'))).toContain('Allowed values');
 }finally{t.host.close();}
});

test('label kinds loaded in start are declared again without declare()',async()=>{
 const t=await started(undefined,{count:4,labelKinds:['area','risk','unknown']});
 try{
  const hello=t.host.messages.find(m=>m.type==='hello');if(hello?.type!=='hello')throw Error('No hello');
  // The handshake reads views before start: the default label kind only.
  expect(Object.keys(hello.declarations.views['screen:views']?.filters??{})).toEqual(['status','label-area']);
  const sent=t.host.messages.filter(m=>m.type==='declarations');
  expect(sent).toHaveLength(1);
  expect(t.host.declarations.views['screen:views']?.filters).toEqual({status:['open','doing'],'label-area':[],'label-risk':[]});
  // Sent before ready, so the first render already has the saved filters.
  expect(t.host.messages.findIndex(m=>m.type==='declarations')).toBeLessThan(t.host.messages.findIndex(m=>m.type==='ready'));
  await t.open('screen:views');
  expect(t.page('screen:views').filters?.map(f=>f.id)).toEqual(['status','label-area','label-risk']);
  expect(t.state.count).toBe(4);
  // Adding one saves it for the next start.
  await t.event('screen:views',PERSON,'add-label',{rowId:'view-from-data'});
  expect(JSON.parse(await Bun.file(`${t.data}/demo.json`).text()).labelKinds).toEqual(['area','risk','size']);
 }finally{t.host.close();}
});

test('every new tree validates against the SDK schema',async()=>{
 const t=await started();
 try{
  await t.open('screen:actions');await t.event('screen:actions',PERSON,'new-item',{rowId:'effects'});await t.event('screen:actions',PERSON,'toggle-tip',{rowId:'effects'});
  const p:Node=t.page('screen:actions');
  expect(()=>validateTree(p)).not.toThrow();
 }finally{t.host.close();}
});
