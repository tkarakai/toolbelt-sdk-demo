import {expect,test} from 'bun:test';
import {rows} from '../src/scenarios';
test('Explorer demonstrates both bound and trailing summaries',()=>{
 const group=rows()[0].group;
 if(!Array.isArray(group))throw Error('Missing structured groups');
 expect(group[0]).toMatchObject({summary:{column:'value',value:'2 rows'}});
 expect(group[1]).toMatchObject({summary:{value:'2 rows'}});
 expect(typeof group[1]==='object'&&group[1].summary?.column).toBeUndefined();
});
