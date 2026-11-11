import test from 'node:test';
import assert from 'node:assert/strict';
import {story,endings,routes,chapterList} from '../src/v2/story.js';
import {traceEndings} from '../src/v2/audit.js';
import {createGame,currentNode,advance,choose,validGame,getBacklog,readKey} from '../src/v2/engine.js';
import {saveGame,loadGame} from '../src/v2/storage.js';

test('v2 canonical graph has five complete routes, all edges and authored text', () => {
  assert.equal(routes.length,5); assert.equal(chapterList.length,38); assert.equal(endings.length,21);
  for (const route of routes) {assert.equal(route.chapters.length,7,route.id); assert.deepEqual(new Set(route.endings.map(e=>e.tier)),new Set(['best','good','normal','bad']));}
  for (const [id,node] of Object.entries(story.nodes)) {
    assert.equal(node.id,id); assert.ok(['read','choice','branch','end'].includes(node.type),id);
    assert.ok(node.owner,id); assert.ok(node.title,id); assert.ok(node.chapter,id);
    if (['read','end'].includes(node.type)) {
      assert.ok(Array.isArray(node.blocks) && node.blocks.length,id);
      for (const b of node.blocks) assert.ok(typeof b==='string' && b.trim() || Array.isArray(b)&&b.length===2&&b.every(t=>typeof t==='string'&&t.trim()),id);
    }
    const edges = node.type==='read' ? [node.next] : node.type==='choice' ? node.options.map(o=>o.next) : node.type==='branch' ? [...node.cases.map(c=>c.next),node.otherwise] : [];
    for (const target of edges) assert.ok(story.nodes[target],`${id} -> ${target}`);
  }
});

const audit = traceEndings(story);
test('all 21 endings are reachable through the public engine with a locked route', () => {
  assert.equal(audit.endings.length,21);
  assert.deepEqual(audit.unreachable,[],'Unreachable authored scenes');
  for (const sample of audit.endings) {
    let game=createGame('검수자'), nextChoice=0, locked=null, count=0;
    while (currentNode(game).type!=='end') {
      assert.ok(++count<3000,sample.ending);
      const node=currentNode(game);
      if (game.routeId) {locked ||= game.routeId; assert.equal(game.routeId,locked); assert.ok(node.owner==='common'||node.owner===locked,node.id);}
      if (node.type==='read') game=advance(game);
      else {const decision=sample.decisions[nextChoice++]; assert.equal(decision.nodeId,node.id); game=choose(game,node.options.findIndex(o=>o.id===decision.choiceId));}
      if (count%40===0) assert.ok(validGame(JSON.parse(JSON.stringify(game))),node.id);
    }
    assert.equal(currentNode(game).id,sample.ending); assert.ok(validGame(game));
    assert.equal(getBacklog(game).length,game.trail.length);
    if (game.routeId!=='group') {assert.ok(nextChoice>=12&&nextChoice<=15,`${sample.ending}: ${nextChoice} choices`);}
    const other=routes.find(r=>r.id!==game.routeId).id;
    assert.throws(()=>currentNode({...game,nodeId:`${other}-1-start-p1`}));
    assert.equal(validGame({...game,routeId:other}),false);
  }
});

test('reading is continuous and branch pages have independent read keys', () => {
  let game=createGame('독자'),pages=0;
  while (currentNode(game).type==='read') {game=advance(game);pages++;}
  assert.ok(pages>=6,`Only ${pages} pages before first choice`);
  const reads=Object.values(story.nodes).filter(n=>n.type==='read');
  assert.equal(new Set(reads.map(readKey)).size,reads.length);
});

test('a later Harin refusal is revisited even after an earlier successful discussion',()=>{
  let game=createGame('검수자');
  for (let steps=0;steps<1500;steps++) {
    const node=currentNode(game);
    if (node.id==='harin-7-repair') break;
    assert.notEqual(node.type,'end','The latest unresolved conversation was skipped');
    if (node.type==='read') game=advance(game);
    else if (node.options.some(o=>o.route)) game=choose(game,node.options.findIndex(o=>o.route==='harin'));
    else if (node.id==='harin-6-feeling') game=choose(game,node.options.findIndex(o=>o.set?.harinRepair===false));
    else game=choose(game,0);
  }
  assert.equal(currentNode(game).id,'harin-7-repair');
  assert.equal(game.facts.harinDismiss,false); assert.equal(game.facts.harinRepair,false);
  for (const [id,tier] of [['repair','best'],['refuse','bad']]) {
    const node=currentNode(game);let branch=choose(game,node.options.findIndex(o=>o.id===id));
    while (currentNode(branch).type==='read') branch=advance(branch);
    assert.equal(currentNode(branch).tier,tier);assert.ok(validGame(branch));
  }
});

test('real bookmarks restore pages and choices without duplicating effects; pre-route saves can choose again',()=>{
  const previous=globalThis.localStorage,data=new Map([['afterglow:release-v1:auto','legacy-untouched']]);
  globalThis.localStorage={getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value)};
  try {
    let game=createGame('책갈피');
    while (currentNode(game).type==='read') game=advance(game);
    assert.ok(saveGame(game,'slot1'));
    const first=choose(loadGame('slot1'),0),second=choose(loadGame('slot1'),0);
    assert.deepEqual(first.facts,second.facts);assert.deepEqual(first.trail,second.trail);
    assert.equal(first.trail.length,game.trail.length+1);
    game=advance(first);assert.ok(saveGame(game));
    assert.equal(loadGame().nodeId,game.nodeId);assert.deepEqual(loadGame().trail,game.trail);
    for (let steps=0;steps<1000;steps++) {
      const node=currentNode(game);
      if (node.type==='choice'&&node.options.some(o=>o.route)) break;
      game=node.type==='read'?advance(game):choose(game,0);
    }
    assert.equal(game.routeId,null);assert.ok(saveGame(game,'slot2'));
    const node=currentNode(game);
    const harin=choose(loadGame('slot2'),node.options.findIndex(o=>o.route==='harin'));
    assert.equal(harin.routeId,'harin');assert.ok(validGame(harin));
    const before=loadGame('slot2');assert.equal(before.routeId,null);
    const sea=choose(before,node.options.findIndex(o=>o.route==='sea'));
    assert.equal(sea.routeId,'sea');assert.ok(validGame(sea));
    assert.equal(data.get('afterglow:release-v1:auto'),'legacy-untouched');
  } finally {if(previous===undefined)delete globalThis.localStorage;else globalThis.localStorage=previous;}
});
