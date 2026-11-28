// The Actions tab (protocol 3): an action of every effect, a split button, an action that asks for
// text (`input`), a draft dialog (a `view` form) and rows edited in their pane (a `write` form), results
// (`data`, an error, not handled), navigation from an action, and panels showing the last events
// (id, origin, instance, outcome) and the open instances (`onOpen`/`onClose` for each one).
// Every item is an in-memory fixture: nothing leaves the plugin.
import {PERSON,type Action,type Context,type EventInfo,type EventResult,type Node,type Origin,type Row,type View} from '@toolbelt/sdk';

export type Priority='low'|'normal'|'high';
export type Item={id:string,title:string,note:string,priority:Priority,done:boolean,added:number};
export type Draft={title:string,priority:Priority};
/** One event as `onEvent` saw it, and what it answered. */
export type EventRecord={id:string,surface:string,name:string,instance:string,origin:Origin,agent?:string,outcome:string};
export type ActionsState={
 items:Item[],nextItem:number,
 /** Items Clear removed, until its toast's Undo puts them back. */
 cleared:Item[]|null,
 /** Each instance's New item draft while its dialog is open. */
 drafts:Record<string,Draft>,
 /** Instances showing the tip (a `view` action changes only the instance that sent it). */
 tips:string[],
 /** Newest first, at most `EVENT_LOG`. */
 eventLog:EventRecord[],
 /** Surface → open instance → who opened it, kept by `onOpen`/`onClose`. */
 instances:Record<string,Record<string,Origin>>,
 opened:number,closed:number,
};
type Effects=Pick<Context,'invalidate'|'toast'|'copy'|'navigate'>;

export const EVENT_LOG=8;
export const GUIDE='https://github.com/tkarakai/toolbelt/blob/main/docs/plugins.md#actions-forms-and-events';
const PRIORITIES:{value:Priority,label:string,dot:'slate'|'sky'|'red'}[]=[{value:'low',label:'Low',dot:'slate'},{value:'normal',label:'Normal',dot:'sky'},{value:'high',label:'High',dot:'red'}];
const START=Date.now();
const MINUTE=60_000;
const SAMPLES:Omit<Item,'added'>[]=[
 {id:'i1',title:'Water the fixture plant',note:'Every other day.',priority:'normal',done:false},
 {id:'i2',title:'Label the demo boxes',note:'',priority:'high',done:false},
 {id:'i3',title:'Archive last week’s fixtures',note:'Nothing real is archived.',priority:'low',done:true},
];
const samples=():Item[]=>SAMPLES.map((x,i)=>({...x,added:START-(SAMPLES.length-i)*7*MINUTE}));
export const initialActions=():ActionsState=>({items:samples(),nextItem:SAMPLES.length+1,cleared:null,drafts:{},tips:[],eventLog:[],instances:{},opened:0,closed:0});

const action=(id:string,label:string,extra:Partial<Action>={}):Action=>({id,label,...extra});
const priority=(v:unknown):Priority=>PRIORITIES.some(p=>p.value===v)?v as Priority:'normal';
const by=(r:Pick<EventRecord,'origin'|'agent'>)=>r.origin==='agent'?`agent${r.agent?` (${r.agent})`:''}`:'person';

/** The items the view lets through, in its sort order (unsorted: the order they were added). */
export function visibleItems(a:ActionsState,view:View):Item[]{
 const q=view.search.trim().toLowerCase();
 const rows=a.items.filter(i=>!q||`${i.title} ${i.note}`.toLowerCase().includes(q));
 const sort=view.sort['act-items'];
 if(!sort)return rows;
 const key=(i:Item):string|number=>sort.key==='priority'?PRIORITIES.findIndex(p=>p.value===i.priority):sort.key==='added'?i.added:sort.key==='state'?Number(i.done):i.title;
 return [...rows].sort((x,y)=>{const a=key(x),b=key(y);const o=typeof a==='number'&&typeof b==='number'?a-b:String(a).localeCompare(String(b));return sort.desc?-o:o;});
}

/** A row's pane: an inline property sheet (`item-pane`, a `write` form) that saves each field. */
const pane=(i:Item):Node[]=>[
 {type:'form',id:'item-pane',appearance:'inline',fields:[
  {type:'text',id:'title',label:'',value:i.title,heading:true,placeholder:'Untitled item'},
  {type:'select',id:'priority',label:'Priority',value:i.priority,options:PRIORITIES.map(({value,label})=>({value,label}))},
  {type:'text',id:'note',label:'Note',value:i.note,placeholder:'Add a note'},
 ]},
 {type:'text',text:`${i.id} · ${i.done?'done':'open'} · each field saves as it changes: a write form, journaled, and an agent filling it asks you first unless you granted changes.`,tone:'muted'},
];

function itemsTable(a:ActionsState,view:View,composer:boolean):Node{
 const rows:Row[]=visibleItems(a,view).map(i=>({
  id:i.id,
  cells:{title:{text:i.title,sub:i.note||undefined,style:i.done?{color:'muted'}:undefined},priority:{text:PRIORITIES.find(p=>p.value===i.priority)!.label,dot:PRIORITIES.find(p=>p.value===i.priority)!.dot},state:i.done?{text:'Done',tone:'success'}:'Open',added:{text:'',at:i.added}},
  actions:[i.done?'item-reopen':'item-done',...(composer?['item-rename']:[]),'item-copy','item-delete'],
  pane:pane(i),
 }));
 return {type:'table',id:'act-items',
  columns:[{key:'title',title:'Item',grow:true,minWidth:200,sortable:true},{key:'priority',title:'Priority',width:110,sortable:true},{key:'state',title:'State',width:90,sortable:true},{key:'added',title:'Added',width:110,optional:true,sortable:true,sortDesc:true}],
  rows,
  actions:[
   action('item-done','Mark done',{icon:'check',inline:true,key:'d',group:'state'}),
   action('item-reopen','Reopen',{icon:'rotate-ccw',inline:true,key:'d',group:'state'}),
   // Asks for the new title (`input`, ui.composer); without it, rename in the drawer.
   ...(composer?[action('item-rename','Rename…',{icon:'pencil',key:'r',group:'edit',input:{placeholder:'New title'}})]:[]),
   // Alternatives (`menu`): indented under the action in the row menu.
   action('item-copy','Copy title',{icon:'copy',group:'edit',menu:[action('item-copy-id','Copy id',{icon:'hash'})]}),
   action('item-delete','Delete',{icon:'trash-2',tone:'destructive',key:'x',confirm:'Delete this fixture item? It lives only in memory.',group:'delete'}),
  ],
  bulkActions:[action('items-done','Mark done',{icon:'check-check'})],
  empty:{title:'No fixture items',description:a.items.length?'Clear the search to see them.':'Add one, or Undo the clear from its toast.',icon:'list-todo'},
 };
}

function lastEvent(log:EventRecord[]):Node{
 const e=log[0];
 if(!e)return {type:'text',text:'No events yet. Press any action on any screen: its id, origin, instance and outcome show here.',tone:'muted'};
 return {type:'details',items:[
  {label:'Event',value:`${e.id} · ${e.name}`,mono:true},
  {label:'Surface',value:e.surface,mono:true},
  {label:'Origin',value:by(e),tone:e.origin==='agent'?'info':undefined},
  {label:'Instance',value:e.instance,mono:true},
  {label:'Outcome',value:e.outcome,mono:true,tone:e.outcome.startsWith('error')?'danger':e.outcome==='not handled'?'warning':'success'},
 ]};
}

function eventsTable(log:EventRecord[]):Node{
 return {type:'table',id:'act-events',
  columns:[{key:'name',title:'Event',grow:true,minWidth:160},{key:'origin',title:'Origin',width:120},{key:'instance',title:'Instance',width:150,optional:true,mono:true},{key:'outcome',title:'Outcome',width:180,mono:true}],
  rows:log.map(e=>({id:e.id,cells:{name:{text:e.name,sub:`${e.id} · ${e.surface}`},origin:by(e),instance:e.instance,outcome:{text:e.outcome,tone:e.outcome.startsWith('error')?'danger':e.outcome==='not handled'?'warning':undefined}}})),
  empty:{title:'No events yet',description:'Events show here, newest first.',icon:'activity'},
 };
}

function instancesList(a:ActionsState):Node{
 const items=Object.entries(a.instances).flatMap(([surface,of])=>Object.entries(of).map(([instance,origin])=>({id:`${surface} ${instance}`,title:surface,subtitle:instance,icon:origin==='agent'?'bot':'user',meta:origin})));
 return {type:'list',id:'act-instances',items,empty:{title:'Nothing open',description:'Instances appear as they open.',icon:'app-window'}};
}

/** The New item dialog: a draft form (`view`) and Save, which writes. */
function draftDialog(d:Draft):NonNullable<Extract<Node,{type:'page'}>['dialog']>{
 return {id:'new-item',title:'New item',description:'A draft in this instance only: typing changes nothing until Save. An agent fills it in its own copy without asking; Save asks.',
  children:[{type:'form',id:'item-draft',fields:[
   {type:'text',id:'title',label:'Title',value:d.title,placeholder:'What to do'},
   {type:'select',id:'priority',label:'Priority',value:d.priority,options:PRIORITIES.map(({value,label})=>({value,label}))},
  ]}],
  actions:[action('save-item','Save',{primary:true,disabled:!d.title.trim()})]};
}

/** The Actions tab; `screen()` adds the page's search placeholder and highlight. */
export function actionsPage(a:ActionsState,view:View,capabilities:readonly string[]):Pick<Extract<Node,{type:'page'}>,'summary'|'children'|'dialog'>{
 const tip=a.tips.includes(view.instance);
 const draft=a.drafts[view.instance];
 const open=a.items.filter(i=>!i.done).length;
 // The person's screen shows everyone's events and every open instance. An agent's copy shows only its
 // own events: other instances opening or acting don't change its tree, so many agent copies don't
 // multiply renders (ToolBelt allows a plugin `LIMITS.rendersPerSecond` across all its instances).
 const person=view.instance===PERSON;
 const log=person?a.eventLog:a.eventLog.filter(e=>e.instance===view.instance);
 return {
  summary:`${open} open of ${a.items.length} items · ${view.instance}`,
  children:[
   {type:'card',id:'effects',title:'One action of every effect',description:'Each action id declares what it does. View changes only the instance that sent it, write changes the plugin’s data, external reaches outside it and destructive can’t be undone. An agent at Read and act runs view actions freely, asks before writes (unless you granted changes) and asks every time for external, destructive and confirmed actions.',
    actions:[
     action('toggle-tip',tip?'Hide tip':'Show tip',{icon:'lightbulb'}),
     action('add-item','Add item',{icon:'plus',primary:true,menu:[action('add-three','Add three',{icon:'list-plus'}),action('new-item','New item…',{icon:'square-pen'})]}),
     action('open-guide','Open the SDK guide',{icon:'external-link',confirm:'Open the SDK guide? SDK Explorer only says which page it would open: nothing leaves the plugin.'}),
     action('clear-items','Clear items',{icon:'trash-2',tone:'destructive',disabled:!a.items.length,confirm:'Remove every fixture item? Undo in the toast brings them back.'}),
     action('restore-samples','Restore samples',{icon:'rotate-ccw'}),
    ],
    children:[
     {type:'details',items:[
      {label:'Show tip',value:'view · this instance only, never asks',mono:true},
      {label:'Add item ▾',value:'write · split button: Add three (write), New item… (view, a draft dialog)',mono:true},
      {label:'Open the SDK guide',value:'external · confirm · says what it would open',mono:true},
      {label:'Clear items',value:'destructive · confirm · toast with Undo',mono:true},
      {label:'Restore samples',value:'write · agent: false (only you see it)',mono:true},
     ]},
     ...(tip?[{type:'text' as const,text:`Tip for ${view.instance}: only this instance shows it. Another person’s screen or an agent’s copy doesn’t, because Show tip is a view action.`,tone:'info' as const}]:[]),
    ]},
   {type:'card',id:'items',title:'Fixture items',description:`A sortable table in a card: the SDK keeps its sort in the view, and agents can return it to unsorted (sort: { "act-items": null }) to see the order items were added. Select a row to edit it in the drawer${capabilities.includes('ui.composer')?'; Rename asks for the new title':''}.`,
    children:[itemsTable(a,view,capabilities.includes('ui.composer'))]},
   {type:'card',id:'results',title:'Results and navigation',description:'onEvent answers each event: nothing (handled), false (not handled) or { data }. A thrown error is the event’s error. Toasts, clipboard text and navigation sent while it runs carry the event’s id, so ToolBelt sends them to whoever acted: an agent gets them in its result.',
    actions:[action('go-views','Show on Views',{icon:'arrow-right'}),action('fail-on-purpose','Fail on purpose',{icon:'circle-x'}),action('decline','Decline',{icon:'circle-slash'})],
    children:[lastEvent(log),eventsTable(log)]},
   person
    ?{type:'card',id:'instances',title:`Open instances · ${a.opened} opened, ${a.closed} closed`,description:'onOpen and onClose fire for every instance of every surface: every person’s screen shares “person”, and each agent acts in a copy of its own.',children:[instancesList(a)]}
    :{type:'card',id:'instances',title:'Your acting copy',description:`onOpen fired when ${view.instance} opened. The person’s screen lists every open instance and everyone’s events; this copy shows only its own.`,children:[]},
  ],
  ...(draft?{dialog:draftDialog(draft)}:{}),
 };
}

const addItem=(a:ActionsState,title:string,p:Priority='normal'):Item=>{const item:Item={id:`i${a.nextItem++}`,title,note:'',priority:p,done:false,added:Date.now()};a.items.push(item);return item;};
const find=(a:ActionsState,id:unknown)=>a.items.find(i=>i.id===id);

/**
 * Events of the Actions tab. Returns the event's result, or undefined for names it doesn't know.
 * Agents' events are handled as the person's: same checks, same outcome.
 */
export function actionsEvent(a:ActionsState,name:string,payload:any,c:Effects,{instance}:Pick<EventInfo,'instance'>):EventResult|'unknown'{
 switch(name){
  case'toggle-tip':a.tips=a.tips.includes(instance)?a.tips.filter(x=>x!==instance):[...a.tips,instance];return;
  case'add-item':{const item=addItem(a,`Fixture item ${a.nextItem}`);return {data:{id:item.id}};}
  case'add-three':return {data:{ids:[0,1,2].map(()=>addItem(a,`Fixture item ${a.nextItem}`).id)}};
  case'new-item':a.drafts[instance]={title:'',priority:'normal'};return;
  case'save-item':{const d=a.drafts[instance];if(!d)throw Error('No New item draft is open');const title=d.title.trim();if(!title)throw Error('The item needs a title');const item=addItem(a,title,d.priority);delete a.drafts[instance];c.toast(`Added “${item.title}”`,'success');return {data:{id:item.id}};}
  case'dialog-close':if(payload?.dialog!=='new-item')return 'unknown';delete a.drafts[instance];return;
  case'open-guide':c.toast(`Would open ${GUIDE}. SDK Explorer opens nothing.`);return {data:{url:GUIDE,opened:false}};
  case'clear-items':{if(!a.items.length)return false;a.cleared=a.items;a.items=[];c.toast(`Cleared ${a.cleared.length} fixture items`,'default',{id:'undo-clear',label:'Undo',key:'cmd+z'});return;}
  case'undo-clear':{if(!a.cleared)return false;const ids=new Set(a.items.map(i=>i.id));a.items=[...a.cleared.filter(i=>!ids.has(i.id)),...a.items];a.cleared=null;return;}
  case'restore-samples':a.items=samples();a.cleared=null;return;
  case'item-done':case'item-reopen':{const i=find(a,payload?.rowId);if(!i)throw Error('That item is gone');i.done=name==='item-done';return;}
  case'item-rename':{const i=find(a,payload?.rowId);if(!i)throw Error('That item is gone');const text=String(payload?.text??'').trim();if(!text)throw Error('A title can’t be empty');i.title=text;return;}
  case'item-copy':case'item-copy-id':{const i=find(a,payload?.rowId);if(!i)throw Error('That item is gone');c.copy(name==='item-copy'?i.title:i.id);return;}
  case'item-delete':{const i=find(a,payload?.rowId);if(!i)return false;a.items=a.items.filter(x=>x!==i);return;}
  case'items-done':{const ids:string[]=Array.isArray(payload?.rowIds)?payload.rowIds:[];let done=0;for(const id of ids){const i=find(a,id);if(i&&!i.done){i.done=true;done++;}}return {data:{done}};}
  case'go-views':c.navigate('views',{select:'t2'});return;
  case'fail-on-purpose':throw Error('A fixture failure: nothing changed');
  case'decline':return false;
  case'field':{
   if(payload?.form==='item-draft'){const d=a.drafts[instance];if(!d)return false;if(payload.field==='title')d.title=String(payload.value??'');else if(payload.field==='priority')d.priority=priority(payload.value);else return false;return;}
   if(payload?.form==='item-pane'){const i=find(a,payload.rowId);if(!i)return false;if(payload.field==='title'){const t=String(payload.value??'').trim();if(!t)throw Error('A title can’t be empty');i.title=t;}else if(payload.field==='note')i.note=String(payload.value??'');else if(payload.field==='priority')i.priority=priority(payload.value);else return false;return;}
   return 'unknown';
  }
  default:return 'unknown';
 }
}

/** What an event answered, as the events panel shows it. */
export function outcome(result:EventResult|undefined,error?:unknown):string{
 if(error!==undefined)return `error: ${String((error as Error)?.message??error)}`;
 if(result===false)return 'not handled';
 if(result&&typeof result==='object'&&'data'in result&&result.data!==undefined)return `data ${JSON.stringify(result.data)}`;
 return 'handled';
}
export function recordEvent(a:ActionsState,surface:string,name:string,info:Pick<EventInfo,'id'|'instance'|'origin'|'agent'>,result:string){
 a.eventLog=[{id:info.id,surface,name,instance:info.instance,origin:info.origin,...(info.agent?{agent:info.agent}:{}),outcome:result},...a.eventLog].slice(0,EVENT_LOG);
}
/** `onOpen`/`onClose`: every instance, the person's and each agent's. */
export function instanceOpened(a:ActionsState,surface:string,instance:string,origin:Origin){(a.instances[surface]??={})[instance]=origin;a.opened++;}
export function instanceClosed(a:ActionsState,surface:string,instance:string){const of=a.instances[surface];if(!of||!(instance in of))return;delete of[instance];if(!Object.keys(of).length)delete a.instances[surface];a.closed++;
 // A closed Actions instance takes its draft and tip with it (the person's instance is shared by every screen).
 if(surface==='screen:actions'){delete a.drafts[instance];a.tips=a.tips.filter(x=>x!==instance);}}
