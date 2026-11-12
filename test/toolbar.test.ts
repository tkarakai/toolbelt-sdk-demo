import {expect,test} from 'bun:test';
import {initialState,toolbarControls,event} from '../src/scenarios';
test('toolbar scope has explanations and reflects field events',()=>{
 const s=initialState();
 expect(toolbarControls(s,'table').controls?.[0]?.value).toBe('focused');
 event(s,'field',{form:'fixture-scope',field:'fixture-scope',value:'expanded'},{invalidate(){},badge(){},toast(){},copy(){}});
 const control=toolbarControls(s,'table').controls![0]!;
 expect(control.value).toBe('expanded');
 expect(control.options.every(o=>(o.tooltip?.length ?? 0)>0)).toBe(true);
 expect(toolbarControls(s,'gallery').controls).toBeUndefined();
});
