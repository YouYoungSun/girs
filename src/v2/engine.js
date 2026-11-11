import {story} from './story.js';
export const STORY_REVISION='v2-1';
export const ROUTES=['harin','sea','yujin','seoyun','isol','group'];
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const cleanName=name=>String(name??'').trim().replace(/[\u0000-\u001f\u007f]/g,'').slice(0,12);
export const format=(text,g)=>String(text).replaceAll('{name}',g.name);
export const readKey=node=>`${STORY_REVISION}:${node.id}:${node.variantId??'default'}`;
export function makeEngine(content) {
 const nodes=content.nodes;
 function guard(node,g) {
  if (!node) throw new Error('이야기의 다음 페이지를 찾지 못했어요.');
  if (node.owner && node.owner!=='common' && node.owner!==g.routeId) throw new Error('이번 이야기에서는 열리지 않는 개인 장면이에요.');
 }
 const matches=(when,g)=>Object.entries(when??{}).every(([key,value])=>key==='routeId'?g.routeId===value:own(g.facts,key)&&g.facts[key]===value);
 function resolve(g) {
  const visited=new Set();
  for (;;) {
   const node=nodes[g.nodeId];guard(node,g);
   if (node.type!=='branch') {
    if (!['read','choice','end'].includes(node.type)) throw new Error('알 수 없는 이야기 형식이에요.');
    if (node.type==='end'&&node.route!==g.routeId) throw new Error('현재 루트와 결말이 일치하지 않아요.');
    return g;
   }
   if (visited.has(node.id)) throw new Error('이야기의 조건 분기가 반복되고 있어요.');
   visited.add(node.id);
   g.nodeId=node.cases.find(c=>matches(c.when,g))?.next??node.otherwise;
  }
 }
 function createGame(name) {
  const clean=cleanName(name);if (!clean) throw new Error('불러드릴 이름을 입력해주세요.');
  return resolve({schemaVersion:2,edition:'release-v2',storyRevision:STORY_REVISION,name:clean,nodeId:content.start,routeId:null,facts:{},trail:[],updatedAt:Date.now()});
 }
 function currentNode(g) {const node=nodes[g.nodeId];guard(node,g);return node;}
 function step(g,index,now=Date.now(),copy=true) {
  const node=currentNode(g),n=copy?structuredClone(g):g;
  if (n.trail.length>=3000) throw new Error('이야기 기록의 허용 길이를 넘었어요.');
  if (node.type==='read'&&index===undefined) {
   n.trail.push({nodeId:node.id});n.nodeId=node.next;
  } else if (node.type==='choice'&&Number.isInteger(index)&&node.options[index]) {
   const option=node.options[index];
   if (option.route!==undefined) {
    if (!ROUTES.includes(option.route)||n.routeId!==null) throw new Error('확정한 루트는 이 회차에서 바꿀 수 없어요.');
    n.routeId=option.route;
   }
   for (const [key,value] of Object.entries(option.set??{})) {
    if (['__proto__','constructor','prototype','routeId'].includes(key)||!['string','number','boolean'].includes(typeof value)||typeof value==='number'&&!Number.isFinite(value)) throw new Error('잘못된 이야기 기억이에요.');
    n.facts[key]=value;
   }
   n.trail.push({nodeId:node.id,choiceId:option.id});n.nodeId=option.next;
  } else throw new Error('지금은 이 입력으로 진행할 수 없어요.');
  n.updatedAt=now;return resolve(n);
 }
 const advance=g=>step(g);
 const choose=(g,index)=>step(g,index);
 function validGame(g) {
  try {
   if (!g||g.schemaVersion!==2||g.edition!=='release-v2'||g.storyRevision!==STORY_REVISION||typeof g.name!=='string'||cleanName(g.name)!==g.name||!g.name||!Number.isFinite(g.updatedAt)||!Array.isArray(g.trail)||g.trail.length>3000||!g.facts||typeof g.facts!=='object'||Array.isArray(g.facts)) return false;
   let replay=createGame(g.name);
   for (const item of g.trail) {
    if (!item||typeof item!=='object'||Array.isArray(item)) return false;
    const node=currentNode(replay);
    if (node.id!==item.nodeId) return false;
    if (node.type==='read') {
     if (Object.keys(item).length!==1) return false;
     replay=step(replay,undefined,g.updatedAt,false);
    } else if (node.type==='choice') {
     if (Object.keys(item).length!==2||typeof item.choiceId!=='string') return false;
     const index=node.options.findIndex(o=>o.id===item.choiceId);
     if (index<0) return false;
     replay=step(replay,index,g.updatedAt,false);
    } else return false;
   }
   const keys=Object.keys(g.facts),expected=Object.keys(replay.facts);
   return replay.nodeId===g.nodeId&&replay.routeId===g.routeId&&keys.length===expected.length&&keys.every(key=>own(replay.facts,key)&&replay.facts[key]===g.facts[key]);
  } catch {return false;}
 }
 function getBacklog(g) {
  return g.trail.map(entry=>{
   const node=nodes[entry.nodeId];
   return node.type==='choice'?{...node,selected:node.options.find(o=>o.id===entry.choiceId)}:node;
  });
 }
 return {createGame,currentNode,advance,choose,validGame,getBacklog};
}
const runtime=makeEngine(story);
export const {createGame,currentNode,advance,choose,validGame,getBacklog}=runtime;
