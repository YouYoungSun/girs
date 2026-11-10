const acceptance={
harin:'하린이 내 손을 잡았다. “나도 좋아해. 내일도 얼굴 보고 싶고, 서울 가서도 만나고 싶어.”\n나는 잡은 손에 힘을 조금 줬다. 하린도 웃었다.\n\n며칠 뒤, 서울에서 만난 날에는 내가 다시 토스트를 구웠다.\n',
sea:'세아가 내 눈을 보고 대답했다. “나도 좋아해. 이제 손님한테 하는 말이라고 못 우기겠네.”\n내가 웃자 그녀도 웃었다.\n\n그날은 마감이 끝난 뒤에도 함께 남았다.\n',
yujin:'유진이 안경을 고쳐 쓰고 나를 봤다. “저도 좋아해요. 지금 대답은, 고칠 데 없어요.”\n나도 웃으며 고개를 끄덕였다.\n\n다음 휴일, 우리는 새 협동 게임을 함께 끝까지 깼다.\n',
seoyun:'서윤이 내 손을 잡았다. “나도 좋아해. 다음 쉬는 날은 정말 너랑 보내고 싶어.”\n여행 이야기를 다시 꺼냈을 때 이번에는 둘 다 망설이지 않았다.\n\n약속한 휴일, 우리는 작은 가방을 하나씩 들고 바닷가 마을로 갔다.\n',
isol:'이솔이 바로 대답했다. “나도. 좋아해.”\n짧은 말 뒤에 그녀가 내 손을 잡았다. 이번에는 나도 놓지 않았다.\n\n다음에 만난 날, 우리는 녹음기 없이 방파제로 갔다.\n'};
const goodBridge={harin:'며칠 뒤, 첫 데이트 날.',sea:'며칠 뒤, 같이 저녁을 먹으러 나갔다.',yujin:'약속한 토요일, 둘이 영화관에 갔다.',seoyun:'다음 쉬는 날, 함께 공방에 갔다.',isol:'며칠 뒤, 첫 데이트 날.'};
export function endingTransition(focus,tier,text){if(tier==='best')return acceptance[focus]+text;if(tier==='good'){const at=text.indexOf('\n');return at<0?text:text.slice(0,at)+'\n\n'+goodBridge[focus]+'\n'+text.slice(at+1);}return text;}
