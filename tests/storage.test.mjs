import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,choose} from '../src/engine.js';
import {loadGame,saveGame,unlock,unlocked,read} from '../src/storage.js';
const values=new Map();globalThis.localStorage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)};
globalThis.window={dispatchEvent:()=>{}};
test('autosave and manual slots are independent and invalid data never resumes',()=>{
  const a=choose(createGame('여름','harin'),0),b=createGame('윤슬','sea');
  assert.ok(saveGame(a));assert.ok(saveGame(b,'slot1'));assert.deepEqual(loadGame(),a);assert.deepEqual(loadGame('slot1'),b);
  assert.equal(loadGame('slot2'),null);values.set('afterglow:v1:auto','{"version":1}');assert.equal(loadGame(),null);
  values.set('afterglow:v1:auto','broken-json');assert.equal(loadGame(),null);
});
test('ending collection is deduplicated and corrupt storage falls back',()=>{
  unlock('harin','best');unlock('harin','best');unlock('harin','good');assert.equal(unlocked().length,2);
  values.set('afterglow:v1:bad','{');assert.equal(read('bad','fallback'),'fallback');
});
test('storage failure does not crash gameplay and reports unsuccessful save',()=>{
  const original=globalThis.localStorage;globalThis.localStorage={getItem:()=>{throw new Error('blocked');},setItem:()=>{throw new Error('full');}};
  assert.equal(loadGame(),null);assert.equal(saveGame(createGame('여름','isol')),false);globalThis.localStorage=original;
});
