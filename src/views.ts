// Views (protocol 2): every search, filter, filter arrangement, sort and page control in SDK
// Explorer is SDK-owned. This module holds the declarations and the Views screen, which shows the
// instance and view it renders for and builds filters from fixture data it can change.
import {PERSON,resolveView,type Action,type Filter,type GroupLabel,type Node,type Row,type View,type ViewDeclaration} from '@toolbelt/sdk';
import type {State} from './scenarios';

/** Label kinds that can become filters. Each active kind is a declared filter `label-<id>`. */
export const LABEL_KINDS=[
 {id:'area',label:'Area',icon:'shapes',values:['Docs','Build','Design']},
 {id:'size',label:'Size',icon:'ruler',values:['Small','Medium','Large']},
 {id:'risk',label:'Risk',icon:'shield-alert',values:['Low','High']},
] as const;
export type LabelKind=(typeof LABEL_KINDS)[number]['id'];
export type TaskStatus='open'|'doing'|'blocked'|'done';
/** A fixture task. `due` is days from now (negative: overdue). */
export type Task={id:string,name:string,status:TaskStatus,due:number,points:number,labels:Record<LabelKind,string>};
export const TASKS:readonly Task[]=[
 {id:'t1',name:'Write the views guide',status:'open',due:2,points:3,labels:{area:'Docs',size:'Medium',risk:'Low'}},
 {id:'t2',name:'Fix the fixture build',status:'doing',due:-1,points:5,labels:{area:'Build',size:'Large',risk:'High'}},
 {id:'t3',name:'Sketch filter icons',status:'open',due:9,points:2,labels:{area:'Design',size:'Small',risk:'Low'}},
 {id:'t4',name:'Review release notes',status:'blocked',due:4,points:1,labels:{area:'Docs',size:'Small',risk:'High'}},
 {id:'t5',name:'Cache fixture packages',status:'doing',due:6,points:8,labels:{area:'Build',size:'Large',risk:'Low'}},
 {id:'t6',name:'Pick the accent palette',status:'done',due:-5,points:2,labels:{area:'Design',size:'Medium',risk:'Low'}},
 {id:'t7',name:'Proofread the README',status:'open',due:-2,points:1,labels:{area:'Docs',size:'Small',risk:'Low'}},
 {id:'t8',name:'Draw the empty states',status:'done',due:12,points:3,labels:{area:'Design',size:'Small',risk:'High'}},
];
const STATUS:{value:TaskStatus,label:string,dot:'sky'|'violet'|'red'|'emerald'}[]=[{value:'open',label:'Open',dot:'sky'},{value:'doing',label:'Doing',dot:'violet'},{value:'blocked',label:'Blocked',dot:'red'},{value:'done',label:'Done',dot:'emerald'}];
const ONGOING=['open','doing'];
const DUE_OPTIONS=[{value:'any',label:'Any time',description:'Every task',section:'Window'},{value:'week',label:'This week',description:'Due in the next 7 days',section:'Window'},{value:'overdue',label:'Overdue',description:'Past its due date',section:'Late'}];
/** The fixture lets two filters group rows; a third explains why it can't (`groupDisabled`). */
export const MAX_GROUP_LEVELS=2;
const DAY=86_400_000;
/** Due times count from plugin start, so unchanged trees stay identical and the SDK doesn't resend them. */
const START=Date.now();
export const SCREENS=['gallery','table','views','forms','output','lifecycle'] as const;
export const labelFilter=(kind:string)=>`label-${kind}`;

/** Every surface's view controls and where they start. Read at the handshake and on `declareViews()`. */
export function declarations(s:Pick<State,'labelKinds'>):Record<string,ViewDeclaration>{
 const labels=s.labelKinds.map(labelFilter);
 return {
  'screen:gallery':{search:true},
  'screen:table':{search:true,filters:{fixtures:[]},sort:{'capability-table':{key:'name',desc:false}},controls:{'fixture-scope':'focused'}},
  'screen:views':{search:true,filters:{status:[...ONGOING],...Object.fromEntries(labels.map(id=>[id,[]]))},sort:{'view-tasks':{key:'due',desc:false}},controls:{due:'any'},arrange:{order:['status',...labels],grouped:['status']}},
  'screen:forms':{search:true},
  'screen:output':{search:true},
  'screen:lifecycle':{search:true},
 };
}
/** The person's view with nothing chosen yet: the declared defaults. */
export const defaultView=(s:Pick<State,'labelKinds'>,id:string,instance=PERSON):View=>resolveView(declarations(s)[`screen:${id}`],{},instance);

/** Filters in the view's arrangement, keeping ids that came or went since it was saved valid. */
export function arrangement(view:View,ids:string[]):{order:string[],grouped:string[]}{
 const saved=view.arrange??{order:ids,grouped:[]};
 const order=[...saved.order.filter(id=>ids.includes(id)),...ids.filter(id=>!saved.order.includes(id))];
 return {order:[...new Set(order)],grouped:[...new Set(saved.grouped.filter(id=>ids.includes(id)))].slice(0,MAX_GROUP_LEVELS)};
}
const valueOf=(t:Task,filter:string):string=>filter==='status'?t.status:t.labels[filter.slice('label-'.length) as LabelKind]??'';
const labelOf=(filter:string,value:string)=>filter==='status'?STATUS.find(x=>x.value===value)?.label??value:value;
const matchesSearch=(t:Task,q:string)=>!q||[t.name,t.status,...Object.values(t.labels)].some(x=>x.toLowerCase().includes(q));
const inWindow=(t:Task,due:string)=>due==='week'?t.due>=0&&t.due<=7:due==='overdue'?t.due<0:true;

/** The tasks the view lets through, in its sort order. */
export function visibleTasks(s:Pick<State,'labelKinds'>,view:View):Task[]{
 const q=view.search.trim().toLowerCase(),filters=['status',...s.labelKinds.map(labelFilter)];
 const rows=TASKS.filter(t=>matchesSearch(t,q)&&inWindow(t,view.controls.due??'any')&&filters.every(f=>{const sel=view.filters[f]??[];return !sel.length||sel.includes(valueOf(t,f));}));
 const sort=view.sort['view-tasks'];
 if(!sort)return rows;
 const key=(t:Task):string|number=>sort.key==='name'?t.name:sort.key==='due'?t.due:sort.key==='points'?t.points:sort.key==='status'?STATUS.findIndex(x=>x.value===t.status):sort.key.startsWith('label-')?valueOf(t,sort.key):0;
 return [...rows].sort((a,b)=>{const x=key(a),y=key(b);const o=typeof x==='number'&&typeof y==='number'?x-y:String(x).localeCompare(String(y));return sort.desc?-o:o;});
}
const describe=(values:readonly string[]|undefined)=>values?.length?values.join(', '):'all';
/** One line per part of the view, as testers and agents read it. */
export function viewLines(view:View):{label:string,value:string}[]{
 const sorts=Object.entries(view.sort).map(([t,s])=>`${t}: ${s?`${s.key} ${s.desc?'↓':'↑'}`:'unsorted'}`);
 return [
  {label:'Instance',value:`${view.instance} · ${view.instance===PERSON?'every person’s screen (window, popover, paired devices)':'an agent’s private view'}`},
  {label:'Search',value:view.search?`“${view.search}”`:'none'},
  {label:'Filters',value:Object.entries(view.filters).map(([id,v])=>`${id}: ${describe(v)}`).join(' · ')||'none declared'},
  {label:'Sort',value:sorts.join(' · ')||'none declared'},
  {label:'Controls',value:Object.entries(view.controls).map(([id,v])=>`${id}: ${v}`).join(' · ')||'none declared'},
  {label:'Arrangement',value:view.arrange?`${view.arrange.grouped.length?`grouped by ${view.arrange.grouped.join(' › ')}`:'not grouped'} · order ${view.arrange.order.join(', ')}`:'not declared'},
 ];
}

/** The Views screen's toolbar and content; `screen()` adds the shared page parts. */
export function viewsPage(s:State,view:View,action:(id:string,label:string,extra?:Partial<Action>)=>Action):Pick<Extract<Node,{type:'page'}>,'search'|'filters'|'controls'|'summary'|'children'>{
 const active=LABEL_KINDS.filter(k=>s.labelKinds.includes(k.id));
 const ids=['status',...active.map(k=>labelFilter(k.id))];
 const {order,grouped}=arrangement(view,ids);
 const groupFlag=(id:string):Pick<Filter,'group'|'groupDisabled'>=>grouped.includes(id)?{group:true}:{group:false,...(grouped.length>=MAX_GROUP_LEVELS?{groupDisabled:`Up to ${MAX_GROUP_LEVELS} levels in this fixture`}:{})};
 const count=(f:string,v:string)=>TASKS.filter(t=>valueOf(t,f)===v).length;
 const byId:Record<string,Filter>={status:{id:'status',label:'Status',icon:'circle-dot',selected:view.filters.status??[],default:{values:ONGOING,label:'Ongoing'},options:STATUS.map(x=>({value:x.value,label:x.label,dot:x.dot,count:count('status',x.value)})),...groupFlag('status')}};
 for(const k of active){const id=labelFilter(k.id);byId[id]={id,label:k.label,icon:k.icon,selected:view.filters[id]??[],options:k.values.map(v=>({value:v,label:v,count:count(id,v)})),...groupFlag(id)};}
 const tasks=visibleTasks(s,view);
 const group=(t:Task):GroupLabel[]=>grouped.map((f,i)=>({id:grouped.slice(0,i+1).map(g=>`${g}=${valueOf(t,g)}`).join('/'),label:labelOf(f,valueOf(t,f))}));
 const rows:Row[]=tasks.map(t=>({id:t.id,...(grouped.length?{group:group(t),open:true}:{}),cells:{name:t.name,status:{text:labelOf('status',t.status),dot:STATUS.find(x=>x.value===t.status)!.dot},...Object.fromEntries(active.map(k=>[labelFilter(k.id),t.labels[k.id]])),due:{text:'',at:START+t.due*DAY,tone:t.due<0&&t.status!=='done'?'danger':undefined},points:t.points},details:[{label:'Task',value:t.name},{label:'Status',value:labelOf('status',t.status)},...active.map(k=>({label:k.label,value:t.labels[k.id]}))]}));
 const sort=view.sort['view-tasks'];
 const declared=declarations(s)['screen:views']!;
 return {
  search:{placeholder:'Search fixture tasks'},
  summary:`${tasks.length} of ${TASKS.length} tasks · ${view.instance}`,
  controls:[{type:'choice',id:'due',label:'Due',icon:'calendar',value:view.controls.due??'any',options:DUE_OPTIONS}],
  filters:order.map(id=>byId[id]!),
  children:[
   {type:'card',id:'view-state',title:`Rendering for ${view.instance}`,description:'The SDK keeps one view per open instance and calls render once for each. Every person’s screen shares “person”; each agent reads through an instance of its own, so its search and filters never change what you see.',tone:'info',children:[{type:'details',items:viewLines(view).map(l=>({...l,mono:l.label!=='Instance'}))}]},
   {type:'card',id:'view-from-data',title:'View controls from data',description:'Each label kind is a declared filter. Adding or removing one changes the declaration: the plugin calls ctx.declareViews(), the SDK sends it again and drops view state for filters that went away.',actions:[action('add-label','Add label filter',{icon:'plus',disabled:active.length===LABEL_KINDS.length}),action('remove-label','Remove label filter',{icon:'minus',disabled:!active.length})],children:[{type:'text',text:`Declared filters: ${Object.keys(declared.filters??{}).join(', ')}`,mono:true},{type:'text',text:`Label kinds: ${active.map(k=>k.label).join(', ')||'none'}`,tone:'muted'}]},
   {type:'table',id:'view-tasks',columns:[{key:'name',title:'Task',grow:true,minWidth:200,sortable:true},{key:'status',title:'Status',width:110,sortable:true},...active.map(k=>({key:labelFilter(k.id),title:k.label,width:100,sortable:true,optional:true})),{key:'due',title:'Due',width:110,sortable:true},{key:'points',title:'Points',align:'right' as const,mono:true,sortable:true,sortDesc:true}],rows,...(sort?{sort}:{}),empty:{title:'No tasks in this view',description:'Clear the search, reset filters or choose Any time.',icon:'list-filter'}},
  ],
 };
}

/** Adds the next label kind (`add-label`) or removes the last (`remove-label`). True when the declaration changed. */
export function editLabels(s:State,name:'add-label'|'remove-label'):boolean{
 if(name==='add-label'){const next=LABEL_KINDS.find(k=>!s.labelKinds.includes(k.id));if(!next)return false;s.labelKinds=[...s.labelKinds,next.id];return true;}
 if(!s.labelKinds.length)return false;s.labelKinds=s.labelKinds.slice(0,-1);return true;
}
