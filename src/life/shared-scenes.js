import {pick} from './helpers.js';
import {names,limitsRomance,isRomantic,relationshipState} from './relationship-state.js';
// Replacements are local to an actor's reaction; other relationships keep their scene.
export function sharedScene(e,g){const limited=id=>limitsRomance(id,g),any=e.cast.some(limited);
 const replaceChoice=(i,label,response)=>{e.choices[i]={...pick(label,response,e.choices[i].effects),flag:null};};
 const sub=(a,b)=>{e.text=e.text.replace(a,b);};
 if(e.id==='day-7'&&(limited('harin')||g.bonds.harin<40))e.choices[0].response='하린|“반찬 좀 옮겨줄래?”\n옆에 앉아서 접시를 나눴다. 식탁에 남은 자리는 금세 찼다.';
 if(e.id==='day-8'){if(limited('sea'))replaceChoice(0,'세아에게 여분 수건을 찾아 건넨다.','세아는 수건을 받아 머리부터 닦았다. 다 같이 남은 빨래를 걷었다.');if(limited('seoyun'))replaceChoice(1,'서윤에게 마른 수건을 건넨다.','서윤이 고맙다고 하고 어깨를 닦았다. 나는 남은 빨래를 챙겼다.');if(limited('harin'))e.choices[2].response='하린이 마른 수건을 더 찾아왔다. 우리는 걷어온 빨래를 함께 정리했다.';}
 if(e.id==='day-9'){if(limited('yujin')){sub('첫 비명에 유진이 내 소매를 잡았다.','첫 비명에 유진이 쿠션을 끌어안았다.');replaceChoice(0,'유진에게 쿠션을 하나 더 건넨다.','유진이 쿠션을 받아 화면을 봤다. “연출이 갑작스럽네요.”\n각자 자리에서 영화를 끝까지 봤다.');}if(limited('isol'))replaceChoice(1,'이솔이 떨어뜨린 리모컨을 주워준다.','이솔이 리모컨을 받고 소리를 조금 줄였다. 공포영화 상영은 계속됐다.');}
 if(e.id==='day-10'&&(limited('harin')||g.bonds.harin<40)){e.text='단체방에 하린의 메시지가 떴다. ‘내일 아침 몇 명 먹어?’\n세아|“빵 남으면 나도.”\n하린|“남는다는 보장은 없는데요.”\n식사 인원을 세는 하린에게 내일 일어날 시간을 알려줬다.';replaceChoice(0,'내 몫도 부탁해. 늦잠 안 잘게.','하린이 식사 명단에 내 이름을 더했다. “늦으면 식은 거 먹어야 해.”');replaceChoice(1,'설거지는 내가 도울게.','하린은 알겠다고 하고 접시를 꺼냈다. 아침 당번 일을 나눴다.');}
 if(e.id==='day-11'){if(limited('seoyun'))replaceChoice(1,'전화 중인 서윤 몫의 아이스크림을 냉동실에 둔다.','서윤이 통화를 끝내고 자기 몫을 꺼냈다. 수리 기사 방문 시간을 단체방에 적었다.');if(limited('sea'))e.choices[2].response='세아|“숨긴 거? 내 아이스크림 냉동실 맨 뒤에 둔 거.”\n이솔이 바로 위치를 확인하러 일어났다.';}
 if(e.id==='day-12'){if(limited('seoyun'))replaceChoice(1,'서윤 씨 옷도 단체 사진에 잘 어울리네요.','서윤은 거울에 옷을 대보고 대여 목록에 적었다. “이걸로 할게.”');if(limited('isol'))replaceChoice(2,'이솔에게 소매를 접을 수 있는 집게를 건넨다.','이솔이 집게를 받아 소매를 고정했다. 단체 사진 의상 준비가 끝났다.');}
 if(e.id==='day-13'&&any){
 const notes=[limited('harin')?'아침 준비를 도와줘서 고맙다.':'아침 먹는 표정이 솔직해서 좋다.','얘기를 끝까지 들어준다.',limited('isol')?'장비 정리를 도와줘서 고맙다.':'옆에 있으면 덜 귀찮다.'];
 e.text='익명 칭찬 쪽지함을 열었다. 내 봉투에도 쪽지가 들어 있었다.\n'+notes.map(x=>'‘'+x+'’').join(' ')+'\n누가 썼는지 맞히는 대신 각자 받은 말을 읽었다.\n유진이 쪽지를 보관할 봉투를 더 가져왔다.';
 if(limited('isol'))replaceChoice(1,'칭찬 쪽지는 각자 간직하자고 한다.','이솔이 자기 쪽지를 봉투에 넣었다. 다른 사람의 글을 추궁하지 않고 쪽지함을 정리했다.');
 e.choices[0].response='각자 받은 쪽지를 봉투에 넣었다. 쓴 사람이 누구인지 발표하지 않고 간직하기로 했다.';
 }
 if(e.id==='day-14'){if(limited('isol'))sub('이솔은 대답 대신 내 발등에 물을 조금 찼다. 딱 대답 대신일 만큼만.','이솔은 물놀이 구역 표지판을 가리켰다. “수영은 저쪽.”');if(limited('yujin'))replaceChoice(1,'파라솔 아래 유진과 단체 사진을 확인한다.','유진이 해변의 풍경과 일행들 사진을 정리했다. 단체방에 잘 나온 것을 골라 올렸다.');}
 if(e.id==='day-15'&&limited('yujin')){sub('세아|“유진이한테만 화질 좋은 거 있네? 어디까지 확대해본 거야?”\n유진이 말을 삼켰다. 평화로운 점심이 깨지는 소리였다.','세아|“넘어지는 순간을 연사로 찍었네.”\n유진은 다른 사람들 사진도 단체방에 올렸다.');replaceChoice(0,'사진을 모두에게 나눠 보내달라고 한다.','유진이 사람별로 사진을 나눴다. 각자 마음에 드는 사진을 골라 저장했다.');}
 if(e.id==='day-16'&&limited('harin'))replaceChoice(1,'하린과 새 숟가락을 하나씩 꺼내 간을 본다.','각자 숟가락으로 맛을 보고 달걀을 더 넣었다. 세아가 이제 먹을 만하다고 했다.');
 if(e.id==='day-17'){if(limited('yujin'))replaceChoice(0,'유진에게 규칙표를 다시 보여달라고 한다.','유진이 가운데 놓인 규칙표를 짚었다. 모두에게 같은 규칙을 설명하고 게임을 계속했다.');if(relationshipState('isol',g)==='closed')replaceChoice(1,'이솔의 수를 보고 게임 규칙을 묻는다.','이솔은 공개된 패를 가리켰다. 단체 게임 안에서 가능한 수를 설명해줬다.');}
 if(e.id==='day-18'){if(limited('sea')){sub('세아|“누구랑 가고 싶은지 너무 오래 고민하면 다 상처받는다?”','세아|“분수대에서 삼십 분 뒤. 시간 잊지 마.”');replaceChoice(0,'세아와 장터 지도를 확인하고 이동한다.','세아가 집합 장소를 짚었다. 일행이 잘 보이는 넓은 길로 걸으며 부스를 구경했다.');}}
 if(e.id==='day-19'){if(limited('isol')){sub('이솔이 내 소매 끝을 아주 조금 잡았다. 이건 합리적인 판단일까.','이솔이 계단 쪽을 가리켰다. “바닥부터 비춰.”');replaceChoice(0,'이솔이 가리킨 바닥에 손전등을 비춘다.','바닥의 상자를 치우고 통로를 확보했다. 일행이 차례대로 이동했다.');}if(limited('sea')||limited('yujin'))replaceChoice(1,'세아와 유진이 지나갈 복도를 비춘다.','세 사람이 통로를 확인하며 걸었다. 손전등을 벽에 비춰 모두 발밑을 볼 수 있게 했다.');if(limited('seoyun'))e.choices[2].response='서윤이 차단기를 확인했다. 나는 번호를 읽을 수 있도록 손전등을 고정했다. 잠시 뒤 불이 돌아왔다.';}
 if(e.id==='day-20'&&any){sub('세아|“누가 누구 팔 잡았는지는 서로 묻지 말자.”','세아|“손전등은 다음에 두 개 더 사두자.”');sub('서윤이 웃다가 내 눈을 마주쳤다. 먼저 시선을 돌린 건 나였다.','서윤이 비상용품 목록에 손전등을 적었다.');}
 if(e.id==='day-21'){const close=['harin','sea','isol'].filter(id=>!limited(id)&&g.bonds[id]>=65);e.text='밖에서 돌아오니 현관에서 사람들이 저녁 준비를 하고 있었다.\n하린|“저녁 먹었어?”\n세아는 장보기 목록을 확인했고 이솔은 신발을 정리했다.'+(close.length?'\n'+close.map(id=>`${{harin:'하린은',sea:'세아는',isol:'이솔은'}[id]} 내가 들어오자 하던 일을 멈추고 먼저 다가왔다.`).join('\n'):'');if(limited('sea')||g.bonds.sea<65)replaceChoice(1,'세아에게 장보기 목록을 보내달라고 한다.','세아가 공용 목록을 보내줬다. 필요한 재료를 확인하고 주방에 전달했다.');if(limited('harin')||g.bonds.harin<65)e.choices[2].response='하린|“접시 하나 더 꺼내줘.”\n같이 식탁을 차렸다.';e.choices[0].response='식탁을 차리는 일을 도우며 돌아온 시간을 알렸다. 오늘 있었던 일을 다 함께 나눴다.';}
 if(e.id==='day-22'&&any){for(let i=0;i<3;i++){const targets=Object.keys(e.choices[i].effects);if(targets.some(limited))e.choices[i].response=['받은 사람이 쪽지를 읽고 고맙다고 했다. 선물을 편하게 써달라는 뜻으로 전했다.','다음 선물 교환 때는 함께 장을 보자는 이야기가 나왔다. 누군가의 데이트로 정하지는 않았다.','선물 교환을 마치고 포장지를 모았다. 마음에 들지 않으면 편하게 교환하기로 했다.'][i];}}
 if(e.id==='day-23'&&any){
 if(limited('harin'))sub('하린이 내 쪽을 봤다.','하린이 차를 한 잔 더 따랐다.');
 if(limited('seoyun'))sub('세아|“언니부터 실천해.”\n서윤이 마시던 차를 조금 흘렸다.','세아|“말하는 쪽도 용기가 필요하지.”\n서윤이 고개를 끄덕였다.');
 e.choices[0].response=[limited('sea')?'세아가 고개를 끄덕였다. “상대 대답도 그대로 들어줘야겠네.”':'세아의 장난스러운 표정이 잠깐 사라졌다.',limited('yujin')?'유진은 컵을 내려놓고 이야기를 들었다.':'유진은 눈을 들었다.',limited('seoyun')?'서윤은 차를 조금 더 따라줬다.':'서윤은 휴지를 찾다가 멈췄다.'].join('\n');
 if(limited('harin'))e.choices[1].response='아침을 먹었는지, 집에 왔는지 같은 거라고 답했다. 서로 관심을 표현하는 방식에 대해 이야기를 나눴다.';
 if(limited('isol'))e.choices[2].response='이솔|“남의 얘기도 할 수 있지.”\n식탁에 웃음이 돌았다. 다음 이야기로 넘어갔다.';
 }
 if(e.id==='day-24'){if(limited('yujin'))sub('세아|“개인 소장용 따로 찍었네.”','세아|“다음에는 타이머 십 초.”');if(limited('seoyun'))e.choices[1].response='서윤이 사진기 쪽을 보며 위치를 맞췄다. 다른 사람들도 빈자리를 채웠다. 이번에는 모두 얼굴이 보였다.';}
 if(e.id==='day-26'){if(limited('yujin')){sub('세아|“그럼 유진이만 외출.”','세아|“명칭 회의 시작됐네.”');sub('유진|“저도 데이트 할게요.”','유진|“저는 단체 외출이 좋아요.”');sub('유진이 말하고 나서 입을 가렸다. 이솔이 어깨를 떨었다. 하린은 내 얼굴을 보고 웃었다.','유진은 안내도를 펼쳤다. 하린과 이솔도 각자 보고 싶은 부스를 골랐다.');replaceChoice(1,'유진에게 보고 싶은 부스를 묻는다.','유진이 안내도에 전시 부스를 표시했다. 일행과 함께 동선을 정했다.');}if(limited('seoyun'))replaceChoice(2,'서윤에게 오늘은 운영 일을 쉬자고 한다.','서윤은 공용 일정을 확인한 뒤 휴대전화를 넣었다. 일행과 편하게 부스를 구경했다.');}
 if(e.id==='day-27'){if(limited('sea'))e.choices[0].response='세아가 분수대에서 휴대전화를 넣었다. “집합 시간 맞춰 왔네.”\n다른 일행이 도착할 때까지 부스 이야기를 나눴다.';if(limited('harin'))e.choices[1].response='하린은 빵집 앞에서 일행에게 보낼 사진을 찍고 있었다. 다 같이 들를 수 있는지 영업 시간을 확인했다.';if(limited('isol'))e.choices[2].response='이솔이 내 위치를 확인하고 일행의 집합 장소를 알려줬다. 분수대에서 모두 다시 만났다.';}
 if(e.id==='day-28'){if(e.cast.every(limited))sub('모두 웃는데, 내 쪽을 보는 시선 몇 개는 웃음보다 조금 오래 남았다.','누군가는 결과를 믿었고 누군가는 광고 문구를 읽었다. 각자 다른 반응에 웃음이 났다.');if(any)e.choices[0].response=[limited('harin')?'하린이 다음 사람에게 사이트를 돌려줬다.':'하린이 물컵을 들었다 놨다.',limited('sea')?'세아는 서로의 결과를 비교했다.':'세아는 웃음을 멈추지 않았다.',limited('yujin')?'유진은 같은 결과가 반복되는지 확인했다.':'유진은 나 대신 사이트를 봤다.',limited('isol')?'이솔은 광고 문구를 가리켰다.':'이솔은 내 발을 가볍게 툭 찼다.'].join('\n');if(limited('seoyun')||g.bonds.seoyun<65)e.choices[1].response='서윤|“재미로 보는 거지. 나는 내가 정할래.”\n그녀가 화면을 돌려 다른 결과도 보여줬다.';if(limited('isol'))e.choices[2].response='이솔이 같은 결과가 반복된 화면을 보여줬다. “확률이 아니라 고정 문구 같아.”\n휴대전화를 돌려주고 이야기를 마쳤다.';}
 if(e.id==='day-29'&&any)e.choices[1].response='세아가 공동 일정표를 가리켰다. “정리 끝나고 저녁 시간은 남겨두자.”\n개인 약속을 대신 정하지 않고 마지막 장터 준비를 마쳤다.';
 if(e.id==='day-30')e.text='마지막 손님이 돌아갔다. 하린은 포장을 정리하고 세아는 잔을 닦았다. 유진은 기록집 상자를 닫고 서윤은 열쇠를 챙겼다. 이솔이 방송을 마쳤다.\n서윤|“다들 고생했어. 밥 먹기 전까지 잠깐 쉴까?”\n한 달이 끝났다. 오늘은 마음을 전할 수도, 모두와 저녁을 먹을 수도 있다. 나는 누구와 어떤 시간을 보냈는지 생각했다.';
 return e;
}
