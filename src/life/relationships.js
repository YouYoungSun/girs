import {personalScene} from './relationship-scenes.js';
import {continuation} from './continuations.js';
import {sharedScene} from './shared-scenes.js';
import {relationshipState,isRomantic,hasFuture,limitsRomance,names} from './relationship-state.js';
import {pick} from './helpers.js';
export {relationshipState,isRomantic,relationLabel} from './relationship-state.js';
export const routeRules={harin:{invite:7,confirm:9},sea:{invite:6,confirm:8},yujin:{invite:7,confirm:9},seoyun:{invite:3,confirm:9},isol:{invite:6,confirm:9}};
export const wounds=(id,flags=[])=>relationshipState(id,{flags})==='closed'?[1]:[];
export function relationshipTier(g,tier){if(!g.focus)return tier;const id=g.focus,s=relationshipState(id,g);if(s==='closed')return 'bad';if(s==='friend')return 'normal';if(s!=='romantic'&&['best','good'].includes(tier))return 'normal';if(s==='romantic')return tier==='best'&&g.seen.includes(`${id}-10`)&&hasFuture(id,g)?'best':'good';return tier;}
function groupScene(e,g){const restricted=id=>limitsRomance(id,g),choice=(i,label,response)=>{e.choices[i]=pick(label,response,e.choices[i].effects);};
 if(e.id==='group-3'&&restricted('seoyun'))choice(2,'문에 점심 휴식 중이라고 덧붙인다.','서윤이 도시락을 열었다. 세아와 하린도 앉아 점심을 나눠 먹었다.');
 if(e.id==='group-4'){if(restricted('sea'))e.choices[1].response='세아는 예쁜 잔부터 칭찬했다. 칭찬 금지 대회인데 또 한 번 탈락했다.';}
 if(e.id==='group-5'){if(restricted('harin'))choice(0,'하린의 시범을 보고 팬 각도를 맞춘다.','하린이 팬 손잡이의 각도를 짚어줬다. 유진의 노트에 조리 방법을 적고 함께 연습했다.');if(restricted('yujin'))e.choices[2].response='유진이 가운데 놓인 노트에 실패 원인을 적었다. 내가 팬 온도를 확인하고 하린이 다음 재료를 꺼냈다.';}
 if(e.id==='group-6'){if(restricted('isol')){e.text=e.text.replace('이솔은 이어폰을 귀에 꽂았다. 플레이어 전원은 꺼져 있었다.','이솔은 이어폰의 전원을 확인했다. 다음 작업에 쓸 장비였다.');choice(0,'이솔에게 이어폰 전원을 확인했는지 묻는다.','이솔이 재생 버튼을 눌렀다. 작동을 확인하고 다음 순서에게 질문을 넘겼다.');}if(restricted('harin'))e.choices[1].response='하린|“같이 일하는 시식단이지.”\n세아가 다음 질문으로 넘어갔다.';if(restricted('sea'))e.choices[2].response='세아|“새벽에 설거지 같이 해준 사람.”\n다음에는 다 같이 당번을 정하자는 이야기가 됐다.';}
 if(e.id==='group-7'&&restricted('yujin'))e.text=e.text.replace('서윤|“같이 있으면 잘 웃길래.”\n유진이 내 쪽을 한 번 봤다.','서윤|“둘 다 실내 작업이 많잖아.”\n유진이 편의점 간판을 가리켰다.');
 if(e.id==='group-8'){if(restricted('harin')){e.text='내 옷깃에 밀가루가 묻어 하린이 거울을 가리켰다. 내가 직접 털고 있을 때 세아와 유진이 내려왔다.\n세아|“간식 시간 맞춰 왔네.”\n유진이 컵을 가지러 갔다.';choice(1,'하린에게 가루가 더 남았는지 물어본다.','하린이 남은 위치를 짚어줬다. 나는 직접 털고 일행과 주방으로 갔다.');e.choices[0].response='유진이 컵을 들고 돌아왔다. 다 같이 주방에서 간식을 나눴다.';}if(restricted('sea'))choice(2,'세아에게도 밀가루가 묻었는지 알려준다.','세아가 거울을 확인하고 직접 털었다. 각자 정리를 마친 뒤 간식을 먹었다.');}
 if(e.id==='group-9'){if(!['yujin_card','isol_cat','seoyun_play'].every(f=>g.flags.includes(f))){e.title='각자 고른 물건';e.text='유진이 좋아하는 물건을 하나씩 가져오자고 했다.\n유진은 책갈피를, 이솔은 헤드폰을, 서윤은 나무 장식을 놓았다.\n유진|“언제부터 좋아했는지 말해보면 어떨까요?”\n오늘 처음 듣는 이야기들도 있었다.';choice(0,'물건을 고른 이유를 차례대로 듣는다.','셋의 이야기를 차례로 들었다. 다음에는 내 물건도 가져오기로 했다.');choice(1,'이솔에게 헤드폰을 고른 이유를 묻는다.','이솔은 착용감과 무게를 설명했다. 모두의 의견을 듣고 장비 고르는 기준을 이야기했다.');choice(2,'유진의 발표를 끝까지 듣는다.','유진이 책갈피를 쓰기 시작한 계절부터 설명했다. 나는 궁금한 점을 묻고 이야기를 들었다.');}else if(restricted('yujin'))e.choices[2].response='유진은 책갈피의 종이와 무늬를 설명했다. 각자 물건을 고르는 기준을 나누고 발표를 마쳤다.';}
 if(e.id==='group-10'){if(e.cast.some(restricted)){e.choices[1].response='각자 편한 자리에 앉았다. 서윤은 추운 사람에게 담요를 나눠주고 모두의 내일 일정을 확인했다.';}if(restricted('sea'))e.choices[2].response='세아가 고개를 끄덕였다. “기록집에 오늘 밤도 넣어야겠네.”\n유진이 메모할 페이지를 펼쳤다.';}
 return e;}
export function resolveScene(scene,g){if(!scene)return scene;let e=structuredClone(scene);if(names[e.lane]){
 const state=relationshipState(e.lane,g);if(state==='closed')e=continuation(e,g);else e=continuation(personalScene(e,g),g);
 return e;
 }if(e.lane==='group')return groupScene(e,g);return sharedScene(e,g);}
export const eventTime=day=>[7,9,18,19,23,26,27,28].includes(day)?'night':day===15?'afternoon':'morning';
export const freeTimeText=day=>eventTime(day)==='night'?'잠들기 전에 누구와 조금 더 이야기할까?':'공동 일정을 마쳤다. 오늘은 누구와 시간을 보낼까?';
