import {test,expect} from 'bun:test';import type {Context} from '@toolbelt/sdk';import {validateTree} from '@toolbelt/sdk/validation';
import {initialState,screen,event,optionsField,type State} from '../src/scenarios';
const c:Pick<Context,'invalidate'|'copy'|'badge'|'toast'|'declare'|'navigate'>={invalidate(){},copy(){},badge(){},toast(){},declare(){},navigate(){return true;}};
const withCaps=(...caps:string[])=>{const s=initialState();s.hostCapabilities.push(...caps);return s;};
const json=(s:State,id:string)=>JSON.stringify(screen(id,s));

test('the options field renders with ui.options-field and validates against the SDK schema',()=>{
 const s=withCaps('ui.options-field');const f=optionsField(s);
 expect(f).toMatchObject({type:'options',colors:true,reorder:true});
 expect(()=>validateTree(screen('forms',s))).not.toThrow();
 // Status colors each value and has no color of its own: the host gives its key a rainbow dot.
 expect(json(s,'forms')).toContain('"colors":{"Todo":"sky","Doing":"violet","Done":"emerald"}');
});

test('older hosts get a plain-text option list instead of the options field',()=>{
 const s=initialState();const f=optionsField(s);
 expect(f.type).toBe('text');expect(json(s,'forms')).not.toContain('"type":"options"');
 expect(()=>validateTree(screen('forms',s))).not.toThrow();
});

test('option edits keep keys and counts, key new items and color them',()=>{
 const s=withCaps('ui.options-field');
 // Medium renamed and moved first, Low removed, one item added without a key or color.
 event(s,'field',{field:'options',value:[{key:'o2',text:'Normal',color:'amber'},{key:'o1',text:'High',color:'red'},{text:'Someday'}]},c);
 expect(s.options.map(o=>[o.key,o.text,o.count])).toEqual([['o2','Normal',1],['o1','High',3],['o4','Someday',0]]);
 expect(s.options[2]!.color).toBeDefined();expect(['amber','red','slate','stone']).not.toContain(s.options[2]!.color);
 expect(s.fields.options).toBeUndefined();
});

test('the rainbow dot shows only where the host supports it',()=>{
 expect(json(withCaps('ui.options-field'),'gallery')).toContain('"color":"rainbow"');
 expect(json(initialState(),'gallery')).not.toContain('rainbow');
 expect(()=>validateTree(screen('gallery',withCaps('ui.options-field')))).not.toThrow();
});

test('notes add, edit and delete through the composer and timeline, with a plain-text fallback',()=>{
 const s=withCaps('ui.timeline','ui.composer');
 const tree=json(s,'output');expect(tree).toContain('"type":"timeline"');expect(tree).toContain('"type":"composer"');
 expect(()=>validateTree(screen('output',s))).not.toThrow();
 event(s,'add-note',{composer:'note-composer',text:'  A new note  '},c);expect(s.notes[0]!.text).toBe('A new note');
 const id=s.notes[0]!.id;event(s,'edit-note',{timeline:'notes-timeline',entryId:id,text:'Edited'},c);
 expect(s.notes[0]).toMatchObject({text:'Edited'});expect(s.notes[0]!.edited).toBeNumber();
 event(s,'delete-note',{timeline:'notes-timeline',entryId:id},c);expect(s.notes.some(n=>n.id===id)).toBe(false);
 event(s,'add-note',{text:'   '},c);expect(s.notes.length).toBe(2);
 // Timeline without the composer: no editor; neither capability: plain text.
 expect(json(withCaps('ui.timeline'),'output')).not.toContain('"type":"composer"');
 expect(json(withCaps('ui.timeline'),'output')).not.toContain('"edit"');
 const old=json(initialState(),'output');expect(old).toContain('Plain-text fallback');expect(old).not.toContain('"type":"timeline"');
});
