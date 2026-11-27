// The SDK Explorer's floating window (`ui.floating`): an ask bar with grouped suggestions that grows
// into a panel with a fixture conversation, a form or a long list. Nothing is sent anywhere: answers
// are canned, and "work" is a timer.
import type {Action,Context,Message,Node,Suggestion} from '@toolbelt/sdk';

export type FloatingPage='chat'|'form'|'list';
export type FloatingState={mode:'bar'|'panel',page:FloatingPage,messages:Message[],busy:boolean,fields:{title:string,size:string,pinned:boolean}};
type Effects=Pick<Context,'invalidate'|'toast'>;

/** How long simulated work keeps the sidebar item spinning. */
export const BUSY_MS=3000;
const START=Date.now();
const MINUTE=60_000;

export const initialFloating=():FloatingState=>({mode:'bar',page:'chat',messages:[],busy:false,fields:{title:'Fixture window',size:'medium',pinned:false}});

/** Earlier "chats", shown under Continue with the time they were last used. */
const RECENT=[{id:'floating-recent-1',label:'Which fixtures are overdue?',metaAt:START-12*MINUTE},{id:'floating-recent-2',label:'Summarize the demo queue',metaAt:START-26*60*MINUTE}];
const TRY:Suggestion[]=[
 {id:'floating-page-form',label:'Open a panel with a form',icon:'sliders-horizontal',group:'Try',meta:'Panel'},
 {id:'floating-page-list',label:'Open a long list that scrolls',icon:'list',group:'Try',meta:'40 rows'},
 {id:'floating-busy',label:'Simulate background work',icon:'loader',group:'Try',meta:`${BUSY_MS/1000} s`},
];
export const SUGGESTIONS:Suggestion[]=[...RECENT.map(r=>({...r,icon:'rotate-ccw-clock',group:'Continue'})),...TRY];

const answer=(question:string):Message=>({role:'assistant',author:'Explorer',text:`A canned answer to **${question.replace(/[*_`]/g,'')}**. Nothing was sent anywhere.\n\nMinimize this window (− or Esc) to shrink it into its sidebar item; ⌘J or the item brings it back.`,at:Date.now()});
const composer:Node={type:'composer',id:'floating-ask',single:true,placeholder:'Ask the Explorer…',action:{id:'floating-ask',label:'Ask'}};
const ROWS=Array.from({length:40},(_,i)=>({id:`row-${i+1}`,title:`Fixture row ${i+1}`,subtitle:i%3?'Disposable':'Pinned fixture',icon:i%3?'file':'pin',metaAt:START-i*37*MINUTE,actions:[{id:'floating-pick',label:'Pick',icon:'arrow-right'}]}));

/** The `floating` surface's tree. */
export function floating(f:FloatingState):Node{
 const actions:Action[]=[{id:'floating-new',label:'New chat',icon:'square-pen'},{id:'floating-page-form',label:'Form',icon:'sliders-horizontal'},{id:'floating-page-list',label:'List',icon:'list'},{id:'floating-busy',label:'Simulate work',icon:'loader'}];
 if(f.mode==='bar')return{type:'floating',mode:'bar',busy:f.busy,suggestions:SUGGESTIONS,children:[composer]};
 const subtitle={chat:'Fixture chat',form:'Form',list:'List'}[f.page];
 const children:Node[]=f.page==='chat'?[{type:'conversation',id:'floating-chat',empty:'Ask something below.',messages:f.messages},composer]
  :f.page==='form'?[{type:'text',text:'In a floating window, labels stack above their controls without a card. The panel scrolls like a page.',tone:'muted'},{type:'form',id:'floating-form',fields:[{type:'text',id:'title',label:'Title',value:f.fields.title},{type:'select',id:'size',label:'Size',value:f.fields.size,options:[{value:'small',label:'Small'},{value:'medium',label:'Medium'},{value:'large',label:'Large'}]},{type:'switch',id:'pinned',label:'Pinned',value:f.fields.pinned,description:'A fixture switch; nothing changes.'}]}]
  :[{type:'list',id:'floating-list',items:ROWS}];
 return{type:'floating',mode:'panel',subtitle,busy:f.busy,actions,children};
}

/** Events from the floating surface. Returns false for names it doesn't know. */
export function floatingEvent(f:FloatingState,name:string,payload:any,c:Effects):boolean{
 const recent=RECENT.find(r=>r.id===name);
 if(recent){f.mode='panel';f.page='chat';f.messages=[{role:'user',author:'You',text:recent.label,at:recent.metaAt},answer(recent.label)];}
 else switch(name){
  case'floating-ask':{const text=String(payload?.text??'').trim();if(!text)break;f.mode='panel';f.page='chat';f.messages.push({role:'user',author:'You',text,at:Date.now()},answer(text));break;}
  case'floating-new':f.mode='bar';f.page='chat';f.messages=[];break;
  case'floating-page-form':f.mode='panel';f.page='form';break;
  case'floating-page-list':f.mode='panel';f.page='list';break;
  case'floating-busy':if(f.busy)break;f.busy=true;setTimeout(()=>{f.busy=false;c.invalidate('floating');},BUSY_MS);c.toast('Working for a few seconds: minimize the window to see its sidebar item spin, then a dot.');break;
  case'floating-pick':c.toast(`Picked ${String(payload?.rowId??payload?.item??'a row')}`);break;
  case'field':{const field=String(payload?.field),value=payload?.value;if(field==='title'||field==='size')f.fields[field]=String(value??'');else if(field==='pinned')f.fields.pinned=value===true;break;}
  default:return false;
 }
 c.invalidate('floating');
 return true;
}
