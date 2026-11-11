import test from 'node:test';
import assert from 'node:assert/strict';
import {sequence} from '../src/v2/graph.js';
import {makeEngine,readKey,STORY_REVISION} from '../src/v2/engine.js';
import * as storage from '../src/v2/storage.js';

function fixture() {
 const common=sequence('common',[{id:'arrival',title:'입주',items:[
  {id:'open',time:'첫날',place:'식탁',cast:['harin'],pages:[['처음 사건'],[['하린','두 번째 화면']]]},
  {id:'commit',type:'choice',prompt:'어떤 약속을 할까?',options:[
   {id:'harin',label:'하린과',route:'harin',set:{promised:true},response:[['약속 뒤 첫 사건'],['약속 뒤 두 번째 사건']],next:'branch'},
   {id:'group',label:'함께',route:'group',next:'group-end'},
  ]},
 ]}],'branch');
 return {start:'open-p1',nodes:{...common,
  branch:{id:'branch',type:'branch',owner:'harin',cases:[{when:{routeId:'harin',promised:true},next:'harin-read'}],otherwise:'forbidden'},
  'harin-read':{id:'harin-read',type:'read',owner:'harin',blocks:['우리 이야기'],next:'harin-end'},
  'harin-end':{id:'harin-end',type:'end',owner:'harin',route:'harin',tier:'best',blocks:['마지막']},
  'group-end':{id:'group-end',type:'end',owner:'group',route:'group',tier:'friendship',blocks:['함께']},
  forbidden:{id:'forbidden',type:'read',owner:'sea',blocks:['금지'],next:'harin-end'},
 }};
}
test('v2 authored pages and long choice responses link in order',()=>{
 const content=fixture(),e=makeEngine(content);let g=e.createGame(' 독자 ');
 assert.equal(g.name,'독자');assert.equal(g.nodeId,'open-p1');assert.equal(e.currentNode(g).type,'read');
 const initial=g;g=e.advance(g);assert.equal(initial.trail.length,0);assert.equal(g.nodeId,'open-p2');
 g=e.advance(g);assert.equal(g.nodeId,'commit');g=e.choose(g,0);
 assert.equal(g.routeId,'harin');assert.equal(g.nodeId,'commit-harin-p1');assert.deepEqual(g.facts,{promised:true});
 g=e.advance(g);assert.equal(g.nodeId,'commit-harin-p2');g=e.advance(g);assert.equal(g.nodeId,'harin-read');
 assert.ok(e.validGame(g));assert.equal(e.getBacklog(g)[2].selected.label,'하린과');
 const restored=JSON.parse(JSON.stringify(g));assert.deepEqual(e.currentNode(restored),e.currentNode(g));
 g=e.advance(g);assert.equal(e.currentNode(g).tier,'best');assert.ok(e.validGame(g));assert.throws(()=>e.advance(g));
});
test('v2 replay validation rejects injected route, facts, trail and bookmark position',()=>{
 const e=makeEngine(fixture());let g=e.createGame('검수');
 assert.ok(e.validGame(g));
 for (const patch of [{routeId:'harin'},{facts:{promised:true}},{nodeId:'harin-read'},{storyRevision:'old'},{trail:[{nodeId:'open-p2'}]}]) assert.equal(e.validGame({...g,...patch}),false);
 g=e.choose(e.advance(e.advance(g)),0);
 assert.ok(e.validGame(g));
 assert.equal(e.validGame({...g,routeId:'sea'}),false);
 assert.equal(e.validGame({...g,trail:g.trail.map((t,i)=>i===2?{...t,choiceId:'group'}:t)}),false);
 assert.equal(e.validGame({...g,facts:{promised:false}}),false);
 assert.throws(()=>e.currentNode({...g,nodeId:'forbidden'}));
});
test('v2 group ending, exact revision keys and empty authoring checks',()=>{
 const e=makeEngine(fixture());let g=e.createGame('검수');g=e.choose(e.advance(e.advance(g)),1);
 assert.equal(g.routeId,'group');assert.equal(e.currentNode(g).tier,'friendship');assert.ok(e.validGame(g));
 assert.equal(readKey({id:'a',variantId:'memory'}),`${STORY_REVISION}:a:memory`);
 assert.notEqual(readKey({id:'a'}),readKey({id:'a',variantId:'memory'}));
 assert.throws(()=>sequence('common',[{id:'c',items:[{id:'bad',pages:[]}]}],'end'));
 const linked=sequence('common',[{id:'c',title:'이어지는 장',items:[{id:'pick',type:'choice',options:[{id:'a',label:'A',response:[['후속']]},{id:'b',label:'B'}]},{id:'after',pages:[['다음 사건']]}]}],'finish');
 assert.equal(linked['pick-a-p1'].next,'after-p1');assert.equal(linked.pick.options[1].next,'after-p1');assert.equal(linked['after-p1'].next,'finish');
});

test('an edited chapter is unread again without invalidating the same saved page or resetting other chapters',()=>{
 const old=sequence('common',[{id:'c1',title:'외출',items:[{id:'morning',pages:[['이전 본문']]}]},{id:'c2',title:'다음 날',items:[{id:'later',pages:[['다음 이야기']]}]}],'end');
 const edited=sequence('common',[{id:'c1',title:'외출',variantId:'tone1',items:[{id:'morning',pages:[['수정된 본문']]}]},{id:'c2',title:'다음 날',items:[{id:'later',pages:[['다음 이야기']]}]}],'end');
 assert.notEqual(readKey(old['morning-p1']),readKey(edited['morning-p1']));
 assert.equal(readKey(old['later-p1']),readKey(edited['later-p1']));
 const before=makeEngine({start:'morning-p1',nodes:old}),after=makeEngine({start:'morning-p1',nodes:edited});
 const bookmark=JSON.parse(JSON.stringify(before.createGame('독자')));
 assert.ok(after.validGame(bookmark));assert.equal(after.currentNode(bookmark).blocks[0],'수정된 본문');
});
test('v2 validation replays the complete bounded trail',()=>{
 const e=makeEngine({start:'read',nodes:{read:{id:'read',type:'read',owner:'common',blocks:['반복'],next:'read'}}});
 const g=e.createGame('검수');g.trail=Array.from({length:3000},()=>({nodeId:'read'}));
 assert.ok(e.validGame(g));g.trail.push({nodeId:'read'});assert.equal(e.validGame(g),false);
});
test('v2 route can be committed only once and branch cycles are rejected',()=>{
 const s=fixture();s.nodes['harin-read']={id:'harin-read',type:'choice',owner:'harin',options:[{id:'switch',label:'갈아타기',route:'sea',next:'forbidden'},{id:'same',label:'재확정',route:'harin',next:'harin-end'}]};
 const e=makeEngine(s);let g=e.choose(e.advance(e.advance(e.createGame('검수'))),0);g=e.advance(e.advance(g));
 assert.throws(()=>e.choose(g,0));assert.throws(()=>e.choose(g,1));
 const cyclic={start:'loop',nodes:{loop:{id:'loop',type:'branch',owner:'common',cases:[],otherwise:'loop'}}};
 assert.throws(()=>makeEngine(cyclic).createGame('검수'));
});
test('v2 storage preserves v1 raw archive and isolates progress and seen keys',()=>{
 const data=new Map();globalThis.localStorage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),get length(){return data.size;},key:i=>[...data.keys()][i]};
 data.set('afterglow:release-v1:auto','{"old":true}');
 data.set('afterglow:release-v1:playerName','"이전 독자"');
 data.set('afterglow:release-v1:settings',JSON.stringify({night:true,fontSize:19,numbers:true,sound:true}));
 const before=storage.legacyArchive();
 assert.deepEqual(storage.reusedPreferences(),{playerName:'이전 독자',settings:{night:true,fontSize:19}});
 storage.write('auto',{schemaVersion:2});assert.equal(storage.loadGame(),null);
 storage.markSeen(`${STORY_REVISION}:read:default`);storage.markSeen(`${STORY_REVISION}:read:default`);assert.equal(storage.markSeen('old:read'),false);
 assert.deepEqual(storage.readSeen(),[`${STORY_REVISION}:read:default`]);
 storage.unlock('harin','best');storage.unlock('sea','friendship');assert.deepEqual(storage.unlocked(),['harin:best']);
 assert.deepEqual(storage.legacyArchive(),before);assert.equal(JSON.parse(storage.exportLegacyArchive()).entries['afterglow:release-v1:auto'],'{"old":true}');
 delete globalThis.localStorage;
});
