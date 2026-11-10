export const names={harin:'하린',sea:'세아',yujin:'유진',seoyun:'서윤',isol:'이솔'};
const key=(id,s)=>`rel2_${id}_${s}`;
export function relationshipState(id,g={flags:[]}){const f=g.flags||[];return ['closed','friend','deferred','romantic'].find(s=>f.includes(key(id,s)))||'acquaintance';}
export const isRomantic=(id,g)=>relationshipState(id,g)==='romantic';
export const hasFuture=(id,g)=>isRomantic(id,g)&&(g.flags||[]).includes(key(id,'future'));
export const limitsRomance=(id,g)=>['closed','friend','deferred'].includes(relationshipState(id,g));
export function withIntent(choice,id,state,future=false){return {...choice,setFlags:[...(choice.setFlags||[]),key(id,state),...(future?[key(id,'future')]:[])],clearFlags:[...(choice.clearFlags||[]),...['closed','friend','deferred','romantic','future'].map(s=>key(id,s))]};}
export function relationLabel(id,g){const s=relationshipState(id,g);return {closed:'개인적인 만남을 마친 사이',friend:'편한 친구로 지내는 사이',deferred:'서로의 마음을 알아가는 중',romantic:hasFuture(id,g)?'마음과 다음 약속을 나눈 사이':'서로의 호감을 확인한 사이'}[s]||((g.bonds?.[id]||0)>=40?'조금씩 가까워지는 사이':'서로 알아가는 사이');}
export const stateFlag=key;
