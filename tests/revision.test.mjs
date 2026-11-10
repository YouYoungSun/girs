import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,visits,currentScene,choose,result,validGame} from '../src/engine.js';
import {routeRules,relationshipTier} from '../src/life/relationships.js';
import {endingArt} from '../src/life/art.js';import {readFile} from 'node:fs/promises';
const ids=Object.keys(routeRules);
for(const id of ids)test(`${id}: ten episodes, alternatives, confirmation, closure and Best`,()=>{
 const own=visits.filter(e=>e.lane===id);assert.equal(own.length,10);assert.deepEqual(own.map(e=>e.minDay),[1,3,5,7,10,13,16,20,24,27]);let g=createGame('검수');g.bonds[id]=100;g.focus=id;assert.equal(result(g).tier,'normal');
 const run=(n,i)=>{g.focus=null;g.phase='story';g.choice=null;g.beat='free';g.day=28;g.eventId=`${id}-${n}`;g=choose(g,i);};
 run(routeRules[id].invite,2);g.focus=id;assert.notEqual(result(g).tier,'bad');run(routeRules[id].confirm,0);g.focus=id;assert.equal(result(g).tier,'good');run(10,0);g.focus=id;assert.equal(result(g).tier,'best');
 g.flags=[];run(routeRules[id].invite,2);run(routeRules[id].confirm,2);g.focus=id;assert.equal(result(g).tier,'bad');assert.ok(!g.flags.includes(`rel2_${id}_romantic`));
});
test('formal v1 accepts only release edition',()=>{const g=createGame('검수');assert.equal(g.version,1);assert.ok(validGame(g));assert.ok(!validGame({...g,edition:undefined}));assert.ok(!validGame({...g,version:2}));});
test('all 21 ending images have real WebP headers',async()=>{for(const [id,tier]of [...ids.flatMap(id=>['best','good','normal','bad'].map(t=>[id,t])),[null,'friendship']]){const b=await readFile(new URL('../'+endingArt(id,tier).src.slice(2),import.meta.url));assert.equal(b.subarray(8,12).toString(),'WEBP');}});
