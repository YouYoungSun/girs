const descriptions={
harin:{best:'앞치마 없이 앉아 한쪽이 탄 토스트를 맛보며 웃는 하린',good:'창가에서 빵을 나누는 하린',normal:'여러 사람의 빵 봉투를 포장하는 하린',bad:'넓은 주방에서 혼자 아침을 먹는 하린'},
sea:{best:'옆자리 어깨에 기대 쉬는 세아',good:'매운 음식을 먹다가 웃는 세아',normal:'바에서 손님들과 이야기하는 세아',bad:'마지막 잔을 치우는 세아'},
yujin:{best:'게임 승리 뒤 가까이 다가오는 유진',good:'영화관 옆자리에서 손을 가까이 둔 유진',normal:'단체 게임 모임에서 웃는 유진',bad:'두 번째 컨트롤러를 남겨두고 화면을 끄는 유진'},
seoyun:{best:'여행지 벤치에서 어깨에 기대 잠든 서윤',good:'공방에서 의자 치수를 재는 서윤',normal:'공동 공간에 의자를 놓는 서윤',bad:'한 사람 몫의 여행 가방 곁에 앉은 서윤'},
isol:{best:'이어폰을 나누고 어깨를 붙인 이솔의 뒷모습',good:'리듬 게임을 하며 크게 웃는 이솔',normal:'방파제 벤치에 따로 앉아 음악을 듣는 이솔',bad:'빈 옆자리 곁에서 녹음 장비를 정리하는 이솔'}};
export const endingArt=(focus,tier)=>({src:focus==='harin'&&tier==='best'?'./assets/endings/v1/harin-best-toast.webp':`./assets/endings/${focus?'v1/':''}${focus||'group'}-${tier}.webp`,alt:focus?descriptions[focus][tier]:'달무리회관의 여섯 자리가 차려진 저녁 식탁'});
