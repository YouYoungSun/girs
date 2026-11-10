import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,choose} from '../src/engine.js';
import {loadGame,saveGame,unlock,unlocked} from '../src/storage.js';
const data=new Map();globalThis.localStorage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};globalThis.window={dispatchEvent:()=>{}};
test('v2 autosave and slots store all five independent bonds and do not alter v1 saves',()=>{
 data.set('afterglow:v1:auto','legacy');const g=choose(createGame('나'),2);assert.ok(saveGame(g));assert.ok(saveGame(g,'slot1'));assert.deepEqual(loadGame(),g);assert.deepEqual(loadGame('slot1'),g);assert.equal(data.get('afterglow:v1:auto'),'legacy');assert.equal(loadGame('slot2'),null);
 data.set('afterglow:v2:auto','bad-json');assert.equal(loadGame(),null);
});
test('collection deduplicates all 21 supported endings and ignores corrupt keys',()=>{
 unlock('isol','best');unlock('isol','best');unlock('group','friendship');unlock('bad','fake');assert.deepEqual(unlocked(),['isol:best','group:friendship']);
});
test('malformed collection entries cannot break the title screen',()=>{
 data.set('afterglow:v2:collection',JSON.stringify([{toString:null},null,42,'sea:good','sea:good']));assert.deepEqual(unlocked(),['sea:good']);
});
test('disabled storage reports failed save and never prevents playing',()=>{
 const old=globalThis.localStorage;globalThis.localStorage={getItem:()=>{throw new Error();},setItem:()=>{throw new Error();}};assert.equal(loadGame(),null);assert.equal(saveGame(createGame('윤슬')),false);globalThis.localStorage=old;
});
