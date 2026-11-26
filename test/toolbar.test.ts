import {expect,test} from 'bun:test';
import {initialState,toolbarControls} from '../src/scenarios';
import {defaultView} from '../src/views';
import {resolveView} from '@toolbelt/sdk';
import {declarations} from '../src/views';
test('toolbar scope has explanations and shows the view\'s value',()=>{
 const s=initialState();
 expect(toolbarControls(defaultView(s,'table'),'table').controls?.[0]?.value).toBe('focused');
 // The SDK applies the control's field event to the view; the control renders from it.
 const view=resolveView(declarations(s)['screen:table'],{controls:{'fixture-scope':'expanded'}},'person');
 const control=toolbarControls(view,'table').controls![0]!;
 expect(control).toMatchObject({type:'segmented',value:'expanded'});
 if(control.type!=='segmented')throw Error('Expected a segmented control');
 expect(control.options.every(o=>(o.tooltip?.length ?? 0)>0)).toBe(true);
 expect(toolbarControls(defaultView(s,'gallery'),'gallery').controls).toBeUndefined();
});
