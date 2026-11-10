import {test,expect} from 'bun:test';import type {Node,Context} from '@toolbelt/sdk';
import {COVERAGE,initialState,screen,quick,event,fields} from '../src/scenarios';
process.env.TOOLBELT_PLUGIN='sdk-demo';process.env.TOOLBELT_PLUGIN_VERSION='0.0.1';
const screens=['gallery','table','forms','output','lifecycle'];
function nodes(tree:Node,types=new Set<string>()){types.add(tree.type);if('children'in tree)tree.children.forEach(n=>nodes(n,types));if(tree.type==='page'&&tree.dialog)tree.dialog.children.forEach(n=>nodes(n,types));return types;}
test('every public SDK node has a rendered conformance scenario',()=>{const s=initialState(),seen=new Set<string>();s.hostCapabilities.push("ui.conversation");for(const id of screens)nodes(screen(id,s),seen);nodes(quick(s),seen);expect([...seen].sort()).toEqual(Object.keys(COVERAGE).sort());});
test('all field variants and required capabilities are present',()=>{expect(fields(initialState()).map(f=>f.type).sort()).toEqual(['environment','select','switch','text','text']);});
test('interaction routes table, field, dialog, clipboard, toast and badge events',()=>{const s=initialState(),messages:any[]=[];let invalidations=0;const c:Pick<Context,'invalidate'|'copy'|'badge'|'toast'>={invalidate(){invalidations++;},copy(text){messages.push(['copy',text]);},badge(v){messages.push(['badge',v]);},toast(...args){messages.push(['toast',...args]);}};
 event(s,'increment',{},c);expect(s.count).toBe(1);event(s,'field',{field:'name',value:'Grace'},c);expect(s.fields.name).toBe('Grace');
 event(s,'search',{query:'plain'},c);const t=screen('table',s);expect(t.type).toBe('page');if(t.type==='page'&&t.children[0]?.type==='table')expect(t.children[0].rows.map(r=>r.id)).toEqual(['plain']);
 event(s,'filter',{values:['parent']},c);expect(s.filter).toEqual(['parent']);event(s,'sort',{key:'value',desc:true},c);expect(s.sort).toEqual({key:'value',desc:true});
 event(s,'open-dialog',{},c);expect(s.dialog?.resizable).toBe(true);event(s,'dialog-close',{},c);expect(s.dialog).toBeUndefined();event(s,'defer',{},c);expect(s.defer).toBe(true);
 event(s,'copy',{},c);event(s,'toast',{},c);event(s,'clear-badge',{},c);event(s,'string-badge',{},c);expect(messages).toContainEqual(['copy','SDK Explorer fixture']);expect(messages).toContainEqual(['badge',null]);expect(messages).toContainEqual(['badge','demo']);expect(invalidations).toBeGreaterThan(10);
});
test('table sort events produce reordered rows in both directions',()=>{const s=initialState();s.sort={key:'value',desc:false};let tree=screen('table',s);if(tree.type!=='page'||tree.children[0]?.type!=='table')throw Error('Missing table');expect(tree.children[0].rows.map(r=>r.id)).toEqual(['plain','parent']);s.sort.desc=true;tree=screen('table',s);if(tree.type!=='page'||tree.children[0]?.type!=='table')throw Error('Missing table');expect(tree.children[0].rows.map(r=>r.id)).toEqual(['parent','plain']);});
