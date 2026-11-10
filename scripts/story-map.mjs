import {writeFile} from 'node:fs/promises';
import {days,visits,createGame} from '../src/engine.js';
import {resolveScene} from '../src/life/relationships.js';
import {stateFlag} from '../src/life/relationship-state.js';
const context=createGame('검수');
const record=e=>({id:e.id,title:e.title,place:e.place,cast:e.cast,minDay:e.minDay,text:e.text,choices:e.choices.map(c=>({label:c.label,response:c.response,effects:c.effects,memory:c.flag,setFlags:c.setFlags,clearFlags:c.clearFlags}))});
const rows=[...days,...visits].map(scene=>{
 const variants=[];
 for(const actor of scene.cast){for(const state of ['romantic','friend','deferred','closed']){
 const g={...context,flags:[stateFlag(actor,state)],bonds:{...context.bonds,[actor]:100}};
 variants.push({actor,state,...record(resolveScene(scene,g))});
 }}
 return {...record(resolveScene(scene,context)),variants};
});
await writeFile('docs/story-map.json',JSON.stringify({note:'실제 표시 장면 목록. variants는 각 인물 한 명의 상태를 바꿨을 때의 대조용 출력이며 도달 경로 자체를 의미하지 않는다. 실제 30일 경로 검수는 tests/story-paths.test.mjs 참조. 일상 만남은 연애로 간주하지 않으며 명시적 연애 수락 뒤에는 최소 Good, 명시적 친구 관계는 Normal, 개인 만남 종료는 Bad다.',scenes:rows},null,2));
