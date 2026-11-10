import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {characters,common,routes,endings} from '../src/story/index.js';
import {createGame,choose,advance,result,currentScene,timeline,validGame,sceneText,choiceOrder,endingTier} from '../src/engine.js';

test('all five complete routes have 12 distinct scenes, 4 endings and valid choices',()=>{
  assert.equal(characters.length,5);assert.equal(common.length,6);
  for(const c of characters){
    assert.equal(routes[c.id].length,12);assert.equal(new Set(routes[c.id].map(s=>s.title)).size,12);
    assert.deepEqual(Object.keys(endings[c.id]),['best','good','normal','bad']);
    for(const s of timeline(c.id)){
      assert.ok(s.day>=1&&s.day<=30);assert.ok(s.text.length>200,`${c.id} / ${s.title} needs authored prose`);
      assert.equal(s.choices.length,3);
      for(const choice of s.choices){assert.ok(choice.label.length>3);assert.ok(choice.response.length>35);assert.ok(Number.isFinite(choice.delta));}
      for(const p of s.text.split('\n')){if(p.includes('|'))assert.ok(['하린','세아','유진','서윤','이솔','어머니'].includes(p.split('|')[0]));}
    }
    for(const end of Object.values(endings[c.id]))assert.ok(end.text.length>200);
  }
});

// Carry real, serialized game states through every scene. Scores alone determine endings,
// so merging states at the same focus score is sufficient to prove each tier is reachable.
for(const c of characters)test(`${c.name}: all four endings can be reached by actual choices and survive save/load`,()=>{
  let states=new Map([[45,createGame('여름',c.id)]]);
  for(let i=0;i<timeline(c.id).length;i++){
    const next=new Map();
    for(const game of states.values())for(let choice=0;choice<3;choice++){
      const response=choose(game,choice);
      assert.ok(validGame(response));
      const continued=advance(JSON.parse(JSON.stringify(response)));
      assert.ok(validGame(continued));next.set(continued.bonds[c.id],continued);
    }
    states=next;
  }
  const reached=new Set();
  for(const game of states.values()){
    assert.equal(game.phase,'ending');assert.equal(game.history.length,18);assert.equal(currentScene(game),undefined);
    const end=result(game);reached.add(end.tier);assert.ok(end.title);assert.ok(end.text);
  }
  assert.deepEqual([...reached].sort(),['bad','best','good','normal']);
});

test('a prior shared choice changes the later route prose',()=>{
  function arrive(choice){let g=createGame('윤슬','harin');for(let i=0;i<6;i++)g=advance(choose(g,i===1?choice:1));return g;}
  const remembered=arrive(0),other=arrive(1);
  assert.ok(remembered.flags.includes('harin_half'));assert.ok(!other.flags.includes('harin_half'));
  assert.notEqual(sceneText(remembered),sceneText(other));assert.match(sceneText(remembered),/반씩 먹는/);
});
test('high and low affection unlock different intermediate narration',()=>{
  let g=createGame('여름','sea');while(g.index<10)g=advance(choose(g,1));
  const high=structuredClone(g),low=structuredClone(g);high.bonds.sea=80;low.bonds.sea=30;
  assert.notEqual(sceneText(high),sceneText(low));
});
test('choices are applied once and original state is immutable',()=>{
  const g=createGame('여름','harin'),snapshot=JSON.stringify(g),next=choose(g,0);
  assert.equal(JSON.stringify(g),snapshot);assert.throws(()=>choose(next,0));assert.throws(()=>advance(g));
  assert.throws(()=>choose(g,9));assert.equal(next.history.length,1);
});
test('reload preserves choice order, phase, history and response',()=>{
  let g=createGame('윤슬','isol');g=advance(choose(g,1));const saved=JSON.parse(JSON.stringify(g));
  assert.deepEqual(choiceOrder(g),choiceOrder(saved));assert.deepEqual([...choiceOrder(saved)].sort(),[0,1,2]);
  const response=choose(saved,2);assert.ok(validGame(response));assert.equal(response.phase,'response');
  assert.equal(response.choice,2);assert.equal(response.history[1].response,currentScene(response).choices[2].response);
});
test('tier thresholds have no gaps',()=>{
  assert.equal(endingTier(85),'best');assert.equal(endingTier(84),'good');assert.equal(endingTier(65),'good');
  assert.equal(endingTier(64),'normal');assert.equal(endingTier(40),'normal');assert.equal(endingTier(39),'bad');
});
test('invalid imported files and incomplete states are rejected',()=>{
  const valid=createGame('윤슬','isol');assert.ok(validGame(valid));
  for(const v of [null,[],{}, {...valid,index:999}, {...valid,focus:'unknown'}, {...valid,phase:'ending'},
    {...valid,phase:'response',choice:0}, {...valid,bonds:{...valid.bonds,isol:NaN}}, {...valid,flags:[123]},
    {...valid,name:''}, {...valid,history:[{}]}, {...valid,version:99}])assert.equal(validGame(v),false);
  const response=choose(valid,0);assert.equal(validGame({...response,history:[null]}),false);
  assert.throws(()=>createGame('   ','harin'));assert.throws(()=>createGame('나','nobody'));
});
test('every choice flag that is recalled exists, and asset files are real PNGs',async()=>{
  const scenes=[...common,...Object.values(routes).flat()];const flags=new Set(scenes.flatMap(s=>s.choices.map(c=>c.flag).filter(Boolean)));
  for(const s of scenes)if(s.memory)assert.ok(flags.has(s.memory.flag),s.memory.flag);
  for(const c of characters){const bytes=await readFile(new URL(`../assets/${c.id}.png`,import.meta.url));assert.equal(bytes.subarray(1,4).toString(),'PNG');assert.ok(bytes.length>10000);}
});
