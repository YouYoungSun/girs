import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,currentScene,choose,result,sceneText} from '../src/engine.js';
import {resolveScene,wounds,relationshipTier,freeTimeText} from '../src/life/relationships.js';
import {visits} from '../src/life/visits.js';
import {messageEvent} from '../src/life/messages.js';
import {finalResult} from '../src/life/finale.js';
import {endingArt} from '../src/life/art.js';
const ids=['harin','sea','yujin','seoyun','isol'];
for(const id of ids)test(`${id}: boundary choices, two hurts, staged repair and outcome`,()=>{
 let g=createGame('검수');g.bonds[id]=100;g.focus=id;
 assert.equal(relationshipTier(g,'best'),'good');g.seen.push(`${id}-7`);assert.equal(relationshipTier(g,'best'),'best');
 for(const n of [3,5]){g.focus=null;g.beat='free';g.phase='story';g.day=20;g.eventId=`${id}-${n}`;g.choice=null;const e=currentScene(g);assert.equal(e.choices[2].effects[id],-12);g=choose(g,2);}
 g.focus=id;assert.equal(result(g).tier,'bad');assert.equal(wounds(id,g.flags).length,2);assert.match(result(g).text,/연락/);
 for(const n of [6,7]){g.focus=null;g.phase='story';g.choice=null;g.eventId=`${id}-${n}`;g.day=28;const e=currentScene(g);assert.match(e.choices[0].label,/미안/);assert.equal(e.choices[0].effects[id],4);g=choose(g,0);}
 assert.equal(wounds(id,g.flags).length,0);g.focus=id;g.bonds[id]=100;assert.equal(result(g).tier,'best');
 g.flags=['hurt_'+id+'_1'];assert.equal(result(g).tier,'normal');assert.match(result(g).text,/풀지 못한/);
});
test('unearned props, towel, unknown lateness and low relationship messages are absent',()=>{
 const g=createGame('검수');const props=resolveScene(visits.find(e=>e.id==='group-9'),g);assert.doesNotMatch(props.text,/고양이 키링/);assert.doesNotMatch(props.choices[1].label,/고양이/);
 assert.doesNotMatch(messageEvent('sea',1,70,g).text,/수건/);
 assert.doesNotMatch(resolveScene(visits.find(e=>e.id==='seoyun-3'),g).text,/어제|20분/);
 for(const id of ids)for(let w=0;w<4;w++)assert.match(messageEvent(id,w,25,g).text,/공동 일정/);
});
test('night schedule never tells player daylight remains',()=>{for(const d of [7,9,18,19,23,26,27,28])assert.doesNotMatch(freeTimeText(d),/해가|오후/);});
test('all 21 art keys are unique and all Best scenes contain mutual romance',()=>{
 const paths=new Set();for(const id of ids)for(const tier of ['best','good','normal','bad']){const a=endingArt(id,tier);paths.add(a.src);assert.ok(a.alt);if(tier==='best')assert.match(finalResult(id,tier).text,/키스/);}
 paths.add(endingArt(null,'friendship').src);assert.equal(paths.size,21);
});
test('stored response remains pre-choice text even when score crosses variant threshold',()=>{
 let g=createGame('검수');g.bonds.harin=39;g.beat='free';g.eventId='harin-1';const expected=currentScene(g).choices[0].response;g=choose(g,0);assert.equal(g.history.at(-1).response,expected);assert.ok(g.bonds.harin>=40);
});

test('all game illustrations and preserved originals exist with valid file headers',async()=>{
 const {readFile}=await import('node:fs/promises');
 for(const [id,t] of [...ids.flatMap(id=>['best','good','normal','bad'].map(t=>[id,t])),[null,'friendship']]){
 const a=endingArt(id,t);const b=await readFile(new URL('../'+a.src.slice(2),import.meta.url));assert.equal(b.subarray(0,4).toString(),'RIFF');assert.equal(b.subarray(8,12).toString(),'WEBP');
 const png=await readFile(new URL(`../docs/ending-originals/${id||'group'}-${t}.png`,import.meta.url));assert.equal(png.subarray(1,4).toString(),'PNG');
 }
});
