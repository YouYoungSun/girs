import {characters,common,routes,endings} from './story/index.js';
export const VERSION=1;
export const tiers=['best','good','normal','bad'];
export const clamp=n=>Math.max(0,Math.min(100,n));
export const endingTier=score=>score>=85?'best':score>=65?'good':score>=40?'normal':'bad';
export const character=id=>characters.find(c=>c.id===id);
export function createGame(name,focus){
  if(!character(focus))throw new Error('알 수 없는 이야기입니다.');
  const clean=String(name).trim().replace(/[\u0000-\u001f\u007f]/g,'').slice(0,12);
  if(!clean)throw new Error('이름을 입력해주세요.');
  return {version:VERSION,name:clean,focus,index:0,phase:'story',bonds:Object.fromEntries(characters.map(c=>[c.id,45])),flags:[],history:[],choice:null,updatedAt:Date.now()};
}
export const timeline=focus=>[...common,...routes[focus]];
export const currentScene=game=>timeline(game.focus)[game.index];
export function format(text,game){return text.replaceAll('{name}',game.name).replaceAll('{focus}',character(game.focus).short);}
export function sceneText(game){
  const s=currentScene(game);if(!s)return '';
  const parts=[];
  if(s.memory)parts.push(game.flags.includes(s.memory.flag)?s.memory.yes:s.memory.no);
  if(s.warm||s.cool)parts.push(game.bonds[game.focus]>=65?s.warm:s.cool);
  parts.push(s.text);return format(parts.filter(Boolean).join('\n'),game);
}
export function choiceOrder(game){
  // Stable per scene: reloading does not rearrange the choices.
  const key=game.index+characters.findIndex(c=>c.id===game.focus)*7;
  return [[1,0,2],[2,1,0],[0,2,1],[1,2,0],[2,0,1],[0,1,2]][key%6];
}
export function choose(game,index){
  if(game.phase!=='story')throw new Error('이미 선택한 장면입니다.');
  const s=currentScene(game),c=s?.choices[index];if(!c)throw new Error('선택지를 확인해주세요.');
  const next=structuredClone(game),target=s.target==='focus'||!s.target?game.focus:s.target;
  next.bonds[target]=clamp(next.bonds[target]+c.delta);
  if(c.flag&&!next.flags.includes(c.flag))next.flags.push(c.flag);
  next.history.push({index:game.index,title:s.title,day:s.day,text:sceneText(game),choice:format(c.label,game),response:format(c.response,game)});
  next.choice=index;next.phase='response';next.updatedAt=Date.now();return next;
}
export function advance(game){
  if(game.phase!=='response')throw new Error('먼저 선택해주세요.');
  const next=structuredClone(game);next.index++;next.choice=null;next.updatedAt=Date.now();
  next.phase=next.index===timeline(next.focus).length?'ending':'story';return next;
}
export const result=game=>({tier:endingTier(game.bonds[game.focus]),...endings[game.focus][endingTier(game.bonds[game.focus])]});
export function validGame(value){
  if(!value||value.version!==VERSION||!character(value.focus)||typeof value.name!=='string'||!value.name.trim()||value.name.length>12)return false;
  const total=timeline(value.focus).length;
  if(!Number.isInteger(value.index)||value.index<0||value.index>total||!['story','response','ending'].includes(value.phase))return false;
  if((value.phase==='ending')!==(value.index===total))return false;
  if(value.phase==='response'&&(!Number.isInteger(value.choice)||!currentScene(value)?.choices[value.choice]))return false;
  if(value.phase!=='response'&&value.choice!==null)return false;
  if(!value.bonds||characters.some(c=>!Number.isFinite(value.bonds[c.id])||value.bonds[c.id]<0||value.bonds[c.id]>100))return false;
  if(!Array.isArray(value.flags)||value.flags.some(x=>typeof x!=='string')||value.flags.length>100)return false;
  if(!Array.isArray(value.history)||value.history.length!==(value.phase==='response'?value.index+1:value.index))return false;
  return value.history.every((h,i)=>h&&typeof h==='object'&&h.index===i&&Number.isInteger(h.day)&&typeof h.title==='string'&&typeof h.text==='string'&&typeof h.choice==='string'&&typeof h.response==='string'&&h.text.length<20000&&h.response.length<10000);
}
