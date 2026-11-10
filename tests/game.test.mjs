import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {characters,days,visits,createGame,currentScene,choose,advance,availableVisits,visit,contact,confess,result,validGame,sceneText,choiceOrder,endingTier} from '../src/engine.js';
import {messageEvent} from '../src/life/messages.js';
import {confessionEvent,finalResult,endingKeys} from '../src/life/finale.js';

function chooseFor(g,target,goal){const cs=currentScene(g).choices;const wanted=g.bonds[target]<goal;let winner=0;for(let i=1;i<cs.length;i++){const a=cs[i].effects[target]||0,b=cs[winner].effects[target]||0;if(wanted?a>b:a<b)winner=i;}return winner;}
function campaign(target,goal){
 let g=createGame('여름'),steps=0;
 while(g.phase!=='confession'){
   assert.ok(++steps<300,'calendar must terminate');assert.ok(validGame(g),JSON.stringify({day:g.day,phase:g.phase,beat:g.beat}));assert.equal(g.focus,null);
   if(g.phase==='story')g=choose(g,chooseFor(g,target,goal));
   else if(g.phase==='response')g=advance(g);
   else if(g.phase==='activity'){
     const choices=availableVisits(g);assert.ok(choices.length,'at least one unseen activity every day');
     const want=g.bonds[target]<goal;
     choices.sort((a,b)=>{
       const av=Math.max(...a.choices.map(c=>c.effects[target]||0)),bv=Math.max(...b.choices.map(c=>c.effects[target]||0));
       return want?bv-av:av-bv;
     });g=visit(g,choices[0].id);
   }else if(g.phase==='messagePick')g=contact(g,g.bonds[target]<goal?target:characters.find(c=>c.id!==target).id);
   else assert.fail(g.phase);
 }
 assert.ok(validGame(g));return g;
}
test('30 shared days, 45 optional episodes, 20 private chats, 21 endings',()=>{
 assert.equal(days.length,30);assert.equal(visits.length,45);assert.equal(visits.filter(v=>v.lane==='group').length,10);
 assert.equal(endingKeys.length,21);assert.equal(new Set([...days,...visits].map(e=>e.id)).size,75);
 for(const e of [...days,...visits,...characters.flatMap(c=>[0,1,2,3].map(w=>messageEvent(c.id,w,70))),...characters.map(c=>confessionEvent(c.id,70))]){
   assert.ok(e.text.length>50,e.id);assert.equal(e.choices.length,3);assert.ok(e.cast.length>=1);
   for(const id of e.cast)assert.ok(characters.some(c=>c.id===id));
   for(const c of e.choices){assert.ok(c.label.length>3);assert.ok(c.response.length>12,e.id);for(const[id,n]of Object.entries(c.effects)){assert.ok(characters.some(c=>c.id===id));assert.ok(Number.isInteger(n));}}
 }
});
for(const c of characters)test(`${c.name}: actual full-calendar choices reach all four endings`,()=>{
 const found=[];
 for(const goal of [96,70,48,0]){
   let g=campaign(c.id,goal);g=confess(g,c.id);assert.ok(validGame(g));g=choose(g,0);assert.ok(validGame(g));g=advance(JSON.parse(JSON.stringify(g)));assert.ok(validGame(g));
   const r=result(g);found.push(r.tier);assert.ok(r.text.length>100);assert.equal(g.day,30);
   assert.equal(g.history.filter(h=>h.id.startsWith('day-')).length,30);
   assert.equal(g.history.filter(h=>visits.some(v=>v.id===h.id)).length,29);
   assert.equal(g.history.filter(h=>h.id.startsWith('message-')).length,4);
 }
 assert.deepEqual(found,['best','good','normal','bad']);
});
test('final heroine is a manual choice, including somebody with lower affection',()=>{
 const g=campaign('harin',96);assert.equal(g.focus,null);const lower=[...characters].sort((a,b)=>g.bonds[a.id]-g.bonds[b.id])[0].id;assert.ok(g.bonds.harin>g.bonds[lower]);
 let selected=confess(g,lower);selected=advance(choose(selected,0));assert.equal(selected.focus,lower);assert.equal(result(selected).tier,endingTier(g.bonds[lower]));
 assert.throws(()=>confess(selected,'harin'));assert.throws(()=>confess(createGame('나'),'harin'));
});
test('friendship remains available even when somebody has maximum affection',()=>{
 const g=campaign('isol',96),end=confess(g,null);assert.ok(validGame(end));assert.equal(end.focus,null);assert.equal(result(end).tier,'friendship');assert.match(result(end).title,/여섯/);
});
test('shared choices can increase multiple bonds without penalizing others',()=>{
 let g=createGame('윤슬');const original=structuredClone(g);g=choose(g,2);
 assert.equal(original.bonds.harin,25);assert.equal(g.bonds.seoyun,28);assert.equal(g.bonds.harin,26);assert.equal(g.bonds.isol,26);assert.equal(g.focus,null);
});
test('visits are exclusive per free period, gated by date, and never repeat',()=>{
 let g=advance(choose(createGame('나'),0));const menu=availableVisits(g);assert.equal(menu.length,5);assert.ok(menu.every(e=>e.minDay<=1));
 g=visit(g,'harin-1');assert.throws(()=>visit(g,'sea-1'));assert.equal(g.focus,null);g=advance(choose(g,0));g=advance(choose(g,0));
 assert.equal(g.phase,'activity');assert.ok(!availableVisits(g).some(e=>e.id==='harin-1'));assert.throws(()=>visit(g,'harin-7'));
});
test('same-day group encounter and solo encounters share one calendar',()=>{
 const g=campaign('yujin',70);assert.ok(new Set(g.history.flatMap(h=>h.cast)).size===5);assert.ok(g.history.some(h=>h.cast.length>1));
 const free=g.history.filter(h=>visits.some(v=>v.id===h.id));assert.equal(new Set(free.map(h=>h.day)).size,29);
});
test('recall text changes when an earlier flag was earned',()=>{
 let g=createGame('윤슬');g.day=7;g.eventId='day-7';const before=sceneText(g);g.flags.push('bread_blush');assert.notEqual(sceneText(g),before);assert.match(sceneText(g),/시식/);
});
test('private messages and ending memories reflect relationship and chosen history',()=>{
 assert.notEqual(messageEvent('isol',2,25).text,messageEvent('isol',2,85).text);
 assert.notEqual(finalResult('isol','best',[]).text,finalResult('isol','best',['isol_cat']).text);
 assert.equal(finalResult('isol','bad',['isol_cat']).text,finalResult('isol','bad',[]).text);
});
test('save validation covers every actual phase and rejects malformed state',()=>{
 const g=createGame('윤슬');assert.ok(validGame(g));
 for(const bad of [null,{}, {...g,version:1}, {...g,day:31}, {...g,focus:'sea'}, {...g,beat:'bad'}, {...g,phase:'ending'}, {...g,phase:'response',choice:0}, {...g,history:[null]}, {...g,bonds:{...g.bonds,sea:NaN}}, {...g,seen:['not-an-event']}, {...g,flags:[null]}])assert.equal(validGame(bad),false);
 const r=choose(g,0);assert.ok(validGame(r));assert.throws(()=>choose(r,1));assert.throws(()=>advance(g));assert.ok(validGame(JSON.parse(JSON.stringify(r))));assert.deepEqual(choiceOrder(g),choiceOrder(JSON.parse(JSON.stringify(g))));
 assert.throws(()=>createGame('  '));
});
test('thresholds have no gaps and final confession tone does not fabricate affection',()=>{
 assert.equal(endingTier(85),'best');assert.equal(endingTier(84),'good');assert.equal(endingTier(65),'good');assert.equal(endingTier(64),'normal');assert.equal(endingTier(40),'normal');assert.equal(endingTier(39),'bad');
 const g=confess(campaign('sea',70),'sea');for(let i=0;i<3;i++)assert.deepEqual(choose(g,i).bonds,g.bonds);
});
test('new Isol PNG exists and the original design remains preserved',async()=>{
 const originals={harin:'',sea:'',yujin:'',seoyun:''};
 const revised=await readFile(new URL('../assets/isol-petite.png',import.meta.url));assert.equal(revised.subarray(1,4).toString(),'PNG');
 for(const id of Object.keys(originals)){const data=await readFile(new URL(`../assets/${id}.png`,import.meta.url));assert.equal(data.subarray(1,4).toString(),'PNG');}
 const old=await readFile(new URL('../assets/isol.png',import.meta.url));assert.notEqual(createHash('sha256').update(revised).digest('hex'),createHash('sha256').update(old).digest('hex'));
});
