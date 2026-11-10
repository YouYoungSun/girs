import {resolveScene,relationshipTier,relationshipState} from './life/relationships.js';
import {characters} from './story/helpers.js';
import {days} from './life/days.js';
import {visits} from './life/visits.js';
import {messageEvent} from './life/messages.js';
import {confessionEvent,finalResult} from './life/finale.js';
export {characters,days,visits};
export const VERSION=1,tiers=['best','good','normal','bad'];
export const character=id=>characters.find(c=>c.id===id);
export const clamp=n=>Math.max(0,Math.min(100,n));
export const endingTier=n=>n>=85?'best':n>=65?'good':n>=40?'normal':'bad';
export const format=(text,g)=>text.replaceAll('{name}',g.name);
export function createGame(name){
 const clean=String(name).trim().replace(/[\u0000-\u001f\u007f]/g,'').slice(0,12);
 if(!clean)throw new Error('이름을 입력해주세요.');
 return{version:VERSION,edition:"release-v1",name:clean,day:1,beat:'morning',phase:'story',eventId:'day-1',focus:null,choice:null,bonds:Object.fromEntries(characters.map(c=>[c.id,25])),flags:[],seen:[],history:[],updatedAt:Date.now()};
}
export function currentScene(g){
 if(g.beat==='morning'&&g.eventId===`day-${g.day}`)return resolveScene(days[g.day-1],g);
 if(g.beat==='free')return resolveScene(visits.find(e=>e.id===g.eventId),g);
 if(g.beat==='night'&&g.eventId?.startsWith('message-')){const parts=g.eventId.split('-'),id=parts[1];if(character(id)&&Number(parts[2])===g.day/7-1)return messageEvent(id,g.day/7-1,g.bonds[id],g);}
 if(g.beat==='confession'&&character(g.focus))return confessionEvent(g.focus,g.bonds[g.focus],g);
 return undefined;
}
export const relation=n=>n>=85?'당신을 특별하게 바라보는 사이':n>=65?'둘만의 약속이 생긴 사이':n>=40?'먼저 안부가 궁금한 사이':'서로 알아가는 사이';
const recalls={
 'day-7':['bread_blush','하린은 내 앞에 접시를 놓다가 눈이 마주치자 얼른 자기 자리로 돌아갔다. 시식 때 했던 말이 아직 남아 있는 모양이다.'],
 'day-9':['yujin_nerd','유진은 이 영화에 좋아하는 게임의 성우가 나온다며 작은 목소리로 알려줬다. 그 얘기는 나만 듣는 쪽이 좋았던 모양이다.'],
 'day-14':['shopping_rest','서윤은 가방을 내 쪽에 잠깐 맡기고 먼저 샌들을 벗었다. 지난 장보기 이후로 쉬는 일도 조금 익숙해진 것 같았다.'],
 'day-18':['board_isol','이솔이 게임 부스를 가리키며 내게만 말했다. “수업료 아이스크림, 오늘도 유효.” 먼저 약속을 기억해준 게 괜히 반가웠다.'],
 'day-24':['scary_sleeve','유진은 내 옆에 서려다 소매 끝을 봤다. 공포영화 얘기를 꺼내기도 전에 “그건 사고였어요”라고 작게 말했다.'],
 'day-27':['market_hand','세아는 지난번 야시장에서 잡았던 손을 기억하는지, 휴대전화 메시지에 손 그림 하나를 덧붙였다.'],
 'day-28':['less_annoying','이솔은 내 앞에만 사탕을 놓았다. “덜 귀찮게 하려고.” 익명 쪽지의 말투가 이번에는 바로 옆에서 들렸다.'],
};
export function sceneText(g){const e=currentScene(g);if(!e)return'';const memory=recalls[e.id];const blocked=memory&&characters.some(c=>memory[0].startsWith(c.id)||memory[1].includes(c.short)?['closed','friend','deferred'].includes(relationshipState(c.id,g)):false);return format((memory&&!blocked&&g.flags.includes(memory[0])?memory[1]+'\n':'')+e.text,g);}
export function choiceOrder(g){const key=[...g.eventId].reduce((n,c)=>n+c.charCodeAt(0),g.day);return [[1,0,2],[2,1,0],[0,2,1],[1,2,0],[2,0,1],[0,1,2]][key%6];}
export function availableVisits(g){
 if(g.phase!=='activity')return[];
 return [...characters.map(c=>c.id),'group'].map(lane=>{
   const e=visits.find(v=>v.lane===lane&&v.minDay<=g.day&&!g.seen.includes(v.id));
   return e?resolveScene(e,g):e;
 }).filter(Boolean);
}
export function visit(g,id){if(g.phase!=='activity'||!availableVisits(g).some(e=>e.id===id))throw new Error('지금은 갈 수 없는 곳입니다.');const n=structuredClone(g);n.phase='story';n.beat='free';n.eventId=id;n.choice=null;n.updatedAt=Date.now();return n;}
export function contact(g,id){if(g.phase!=='messagePick'||!character(id))throw new Error('지금은 연락할 수 없습니다.');const n=structuredClone(g);n.phase='story';n.beat='night';n.eventId=`message-${id}-${g.day/7-1}`;n.choice=null;n.updatedAt=Date.now();return n;}
export function choose(g,index){
 if(g.phase!=='story')throw new Error('이미 선택한 장면입니다.');
 const e=currentScene(g),c=e?.choices[index];if(!c)throw new Error('선택지를 확인해주세요.');
 const n=structuredClone(g);for(const[id,delta]of Object.entries(c.effects)){if(character(id))n.bonds[id]=clamp(n.bonds[id]+delta);}
 if(c.flag&&!n.flags.includes(c.flag))n.flags.push(c.flag);
 n.flags=n.flags.filter(f=>!(c.clearFlags||[]).includes(f));for(const f of c.setFlags||[])if(!n.flags.includes(f))n.flags.push(f);
 n.history.push({id:e.id,title:e.title,day:g.day,cast:e.cast,text:sceneText(g),choice:format(c.label,g),response:format(c.response,g)});
 if(!n.seen.includes(e.id))n.seen.push(e.id);
 n.phase='response';n.choice=index;n.updatedAt=Date.now();return n;
}
function nextDay(g){g.day++;g.beat='morning';g.phase='story';g.eventId=`day-${g.day}`;return g;}
export function advance(g){
 if(g.phase!=='response')throw new Error('먼저 선택해주세요.');
 const n=structuredClone(g);n.choice=null;n.updatedAt=Date.now();
 if(g.beat==='confession'){n.phase='ending';return n;}
 if(g.beat==='morning'){
   if(g.day===30){n.phase='confession';n.eventId=null;return n;}
   n.phase='activity';n.eventId=null;return n;
 }
 if(g.beat==='free'&&g.day%7===0){n.phase='messagePick';n.beat='night';n.eventId=null;return n;}
 return nextDay(n);
}
export function confess(g,id){
 if(g.phase!=='confession'||g.day!==30||g.focus!==null)throw new Error('마지막 날에만 마음을 전할 수 있습니다.');
 if(id!==null&&!character(id))throw new Error('누구를 만나러 갈까요?');
 const n=structuredClone(g);n.focus=id;n.choice=null;n.updatedAt=Date.now();
 if(id===null){n.phase='ending';n.eventId=null;n.beat='confession';return n;}
 n.beat='confession';n.phase='story';n.eventId=`confession-${id}`;return n;
}
export const result=g=>finalResult(g.focus,g.focus?relationshipTier(g,endingTier(g.bonds[g.focus])):'friendship',g.flags);
export function validGame(g){
 try{
 if(!g||g.version!==VERSION||g.edition!=="release-v1"||typeof g.name!=='string'||!g.name.trim()||g.name.length>12)return false;
 if(!Number.isInteger(g.day)||g.day<1||g.day>30||!['morning','free','night','confession'].includes(g.beat)||!['story','response','activity','messagePick','confession','ending'].includes(g.phase))return false;
 if(g.focus!==null&&(!character(g.focus)||g.day!==30||g.beat!=='confession'))return false;
 if(!g.bonds||characters.some(c=>!Number.isInteger(g.bonds[c.id])||g.bonds[c.id]<0||g.bonds[c.id]>100))return false;
 if(!Array.isArray(g.flags)||g.flags.length>200||g.flags.some(f=>typeof f!=='string'||f.length>80))return false;
 if(!Array.isArray(g.seen)||g.seen.length>100||new Set(g.seen).size!==g.seen.length||g.seen.some(f=>typeof f!=='string'))return false;
 if(!Array.isArray(g.history)||g.history.length>100||g.history.length!==g.seen.length)return false;
 if(!g.history.every((h,i)=>h&&h.id===g.seen[i]&&typeof h.title==='string'&&Number.isInteger(h.day)&&h.day>=1&&h.day<=g.day&&Array.isArray(h.cast)&&h.cast.every(id=>character(id))&&['text','choice','response'].every(k=>typeof h[k]==='string'&&h[k].length<20000)))return false;
 if(!Number.isFinite(g.updatedAt))return false;
 if(g.phase==='activity')return g.day<30&&g.beat==='morning'&&g.eventId===null&&g.choice===null&&g.seen.includes(`day-${g.day}`);
 if(g.phase==='messagePick')return g.day%7===0&&g.beat==='night'&&g.eventId===null&&g.choice===null;
 if(g.phase==='confession')return g.day===30&&g.beat==='morning'&&g.focus===null&&g.eventId===null&&g.choice===null;
 if(g.phase==='ending')return g.day===30&&g.beat==='confession'&&g.choice===null&&g.seen.includes('day-30')&&(g.focus!==null?g.eventId===`confession-${g.focus}`&&g.seen.includes(g.eventId):g.eventId===null);
 const e=currentScene(g);if(!e)return false;
 if(g.beat==='night'&&g.day%7!==0)return false;
 if(g.beat==='free'&&(e.minDay>g.day||g.day===30))return false;
 if(g.beat==='confession'&&(g.focus===null||g.eventId!==`confession-${g.focus}`))return false;
 if(g.phase==='story')return g.choice===null&&!g.seen.includes(e.id);
 return Number.isInteger(g.choice)&&!!e.choices[g.choice]&&g.seen.at(-1)===e.id&&g.history.at(-1).day===g.day;
 }catch{return false;}
}
