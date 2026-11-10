import {characters,common,routes,endings} from './story/index.js';
import {createGame,currentScene,timeline,sceneText,choose,advance,result,character,format,choiceOrder,tiers,validGame} from './engine.js';
import {read,write,loadGame,saveGame,unlocked,unlock} from './storage.js';
const $=id=>document.getElementById(id), app=$('app'), modal=$('modal'), body=$('modal-body');
let game=null,view='home',toastTimer,audio;
const settings={night:false,fontSize:17,sound:false,...read('settings',{})};
const icons={arrow:'↗',heart:'♡',book:'▤'};
const node=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
function button(text,cls,fn){const b=node('button',cls,text);b.type='button';b.addEventListener('click',fn);return b;}
function image(c,cls=''){const img=node('img',cls);img.src=`./assets/${c.id}.png`;img.alt=`${c.name}의 도트 캐릭터`;img.draggable=false;return img;}
function updateSettings(){document.documentElement.dataset.theme=settings.night?'night':'day';document.documentElement.style.setProperty('--reading-size',`${Math.min(23,Math.max(15,Number(settings.fontSize)||17))}px`);write('settings',settings);}
function toast(text){$('toast').textContent=text;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),3200);}
function tone(){if(!settings.sound)return;try{audio ||= new(window.AudioContext||window.webkitAudioContext)();audio.resume().catch(()=>{});const o=audio.createOscillator(),g=audio.createGain();o.frequency.value=440;g.gain.setValueAtTime(.025,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.14);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+.14);}catch{}}
function openModal(title,wide=false){body.replaceChildren();body.append(node('h2','modal-title',title));$('modal-title')?.removeAttribute('id');body.firstChild.id='modal-title';modal.classList.toggle('wide',wide);if(!modal.open)modal.showModal();}
function closeModal(){modal.close();}
function top(){window.scrollTo({top:0,behavior:'instant'});}
function focusTitle(){const h=app.querySelector('h1');if(h){h.tabIndex=-1;h.focus({preventScroll:true});}}
function nav(){const auto=loadGame();$('continue-nav').disabled=!auto&&!game;$('collection-count').textContent=`${unlocked().length}/20`;}
function checkpoint(){saveGame(game);nav();}
function paraText(text,container,context=game){
  for(const raw of (context?format(text,context):text).split('\n').filter(Boolean)){
    const divider=raw.indexOf('|');
    if(divider>0&&divider<15){const row=node('div','dialogue');row.append(node('span','speaker',raw.slice(0,divider)),node('p','',raw.slice(divider+1)));container.append(row);}
    else container.append(node('p','narration',raw));
  }
}
function home(){
  view='home';app.replaceChildren();document.title='여름의 마지막 페이지 · AFTERGLOW';
  const hero=node('section','hero');const copy=node('div','hero-copy');
  copy.append(node('div','eyebrow','AN INTERACTIVE SUMMER NOVEL'),node('h1','','이 여름의 끝에서,\n너를 만나기로 했다.'),node('p','hero-description','바닷가의 작은 문화공간, 달무리회관.\n마지막 여름을 책으로 남기는 한 달 동안,\n당신의 선택은 누군가의 다음 페이지가 됩니다.'));
  const cta=node('div','hero-actions');cta.append(button('이야기 고르기 ↓','primary-button',()=>$('stories').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})),button('프롤로그 읽기','text-button',synopsis));copy.append(cta);
  const postcard=node('div','postcard');postcard.setAttribute('aria-hidden','true');postcard.innerHTML='<div class="postcard-stamp">YEOWOON<br>SUMMER 30</div><div class="sea-scene"><div class="sun"></div><div class="cloud c1"></div><div class="cloud c2"></div><div class="sea"></div><div class="island"></div><div class="building"><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="quay"></div><div class="plant"></div></div><div class="postcard-caption">TO. 아직 만나지 않은 당신에게<span>달무리회관에서 보내는 마지막 여름</span></div>';
  hero.append(copy,postcard);app.append(hero);
  const stories=node('section','stories');stories.id='stories';const heading=node('div','section-heading'),left=node('div');left.append(node('span','eyebrow','CHOOSE YOUR STORY'),node('h2','','어떤 마음을 만나볼까요?'));heading.append(left,node('p','','다섯 사람, 스무 개의 결말.\n첫 페이지를 함께할 사람을 골라주세요.'));stories.append(heading);
  const cards=node('div','character-grid');characters.forEach((c,i)=>{
    const card=button('','character-card',()=>profile(c.id));card.style.setProperty('--character',c.color);card.style.setProperty('--soft',c.soft);
    const portrait=node('div','card-portrait');portrait.append(node('span','card-number',`0${i+1}`),node('span','card-motif',c.tag),image(c));
    const info=node('div','card-info');info.append(node('span','card-job',`${c.age}세 · ${c.job}`),node('h3','',c.name),node('p','',c.quote),node('span','card-link','이 사람의 이야기 ↗'));card.append(portrait,info);cards.append(card);
  });stories.append(cards);app.append(stories);
  const note=node('section','home-note');note.append(node('span','small-book','▤'),node('div','','서두르지 않아도 괜찮아요.'),node('p','','선택할 때마다 자동으로 책갈피를 남겨요.\n잠깐 덮어두었다가, 마음이 가는 날 이어 읽으세요.'));app.append(note);nav();
}
function synopsis(){openModal('한 달 뒤, 이곳의 문이 닫힙니다.');const content=node('div','modal-prose');paraText('해변 마을 여운동의 달무리회관은 리모델링을 위해 일 년 동안 문을 닫습니다. 건물은 다시 열리지만, 그곳에서 일하던 사람들이 돌아온다는 보장은 없습니다.\n당신은 회관의 마지막 여름을 기록집으로 만드는 편집자입니다. 주어진 시간은 한 달. 빵을 굽고, 잔을 채우고, 사진을 정리하고, 문을 고치고, 소리를 모으는 다섯 사람의 일상 속으로 들어갑니다.\n먼저 모두와 만나는 공통편을 읽고, 고른 인물과 열두 번의 중요한 날을 함께합니다. 어떤 말은 다정해도 상대에게 닿지 않고, 어떤 침묵은 더 가까운 대답이 됩니다. 앞서 한 약속은 다음 장면에 돌아옵니다.\n캐릭터마다 Best·Good·Normal·Bad 네 가지 결말이 있습니다. 관계는 선택에 따라 변하며, 마지막 호감도 85 / 65 / 40을 경계로 결말이 나뉩니다. 누구의 진로도 사랑의 보상으로 대신 결정되지 않습니다.\n모든 등장인물은 성인입니다. 이름과 기록은 이 브라우저 안에만 남습니다. 책갈피 파일로 내려받아 다른 기기로 옮길 수도 있습니다.',content,null);body.append(content,button('마음에 드는 이야기 고르기','primary-button',()=>{closeModal();$('stories')?.scrollIntoView({behavior:'smooth'});}));}
function profile(id){
  const c=character(id);openModal(c.name,true);const layout=node('div','profile-layout');layout.style.setProperty('--character',c.color);layout.style.setProperty('--soft',c.soft);
  const art=node('div','profile-art');art.append(image(c));const details=node('div','profile-details');details.append(node('span','eyebrow',`${c.age}세 · ${c.job}`),node('blockquote','',c.quote),node('p','',c.description),node('p','profile-theme',c.theme),node('p','motifs',c.motif));
  const form=node('form','start-form'),label=node('label','','당신을 어떻게 부르면 좋을까요?');label.htmlFor='player-name';const input=node('input');input.id='player-name';input.name='playerName';input.maxLength=12;input.required=true;input.autocomplete='off';input.placeholder='이름 또는 별명 (최대 12자)';input.value=game?.name||read('playerName','');
  form.append(label,input);let skip;
  if(unlocked().length){const row=node('label','check-row');skip=node('input');skip.type='checkbox';row.append(skip,document.createTextNode('공통편은 기본 선택으로 건너뛰기'));form.append(row);}
  if(loadGame())form.append(node('p','save-warning','새 이야기를 시작하면 자동 책갈피가 바뀝니다. 현재 이야기는 책갈피 메뉴에 따로 저장할 수 있어요.'));
  const submit=node('button','primary-button',`${c.short}의 이야기 시작하기 ↗`);submit.type='submit';form.append(submit);
  form.addEventListener('submit',e=>{e.preventDefault();if(!input.value.trim()){input.setCustomValidity('불러드릴 이름을 입력해주세요.');input.reportValidity();return;}input.setCustomValidity('');game=createGame(input.value,id);if(skip?.checked)for(let i=0;i<common.length;i++)game=advance(choose(game,1));write('playerName',game.name);closeModal();checkpoint();renderGame();top();focusTitle();});input.addEventListener('input',()=>input.setCustomValidity(''));
  details.append(form);layout.append(art,details);body.append(layout);input.focus();
}
function stagePortrait(c,ending=false){const side=node('aside','reading-aside');side.style.setProperty('--character',c.color);side.style.setProperty('--soft',c.soft);const art=node('div','reading-portrait');art.append(node('div','portrait-circle'),image(c));side.append(art,node('p','aside-job',c.job),node('h2','',c.name));const bond=node('div','bond-panel');bond.append(node('div','bond-label',`${icons.heart} 마음의 거리`),node('strong','',`${game.bonds[c.id]} / 100`));const track=node('div','bond-track'),fill=node('div');fill.style.width=game.bonds[c.id]+'%';track.append(fill);bond.append(track);side.append(bond);if(!ending)side.append(node('p','aside-caption',`함께 읽는 이야기 · ${character(game.focus).short} 편`));return side;}
function renderGame(){
  if(!game){const loaded=loadGame();if(!loaded){home();return;}game=loaded;}
  if(game.phase==='ending'){renderEnding();return;}
  view='game';const s=currentScene(game),focus=character(game.focus),speaker=character(s.target&&s.target!=='focus'?s.target:game.focus);
  document.title=`${s.title} · 여름의 마지막 페이지`;app.replaceChildren();
  const toolbar=node('div','reading-toolbar');toolbar.append(button('← 표지로','text-button',()=>{home();top();}),node('span','',game.index<common.length?'PROLOGUE · 같은 여름의 시작':`${focus.short.toUpperCase()} · ${game.index-common.length<4?'서로를 읽는 시간':game.index-common.length<8?'마음이 머무는 자리':'다음 페이지의 우리'}`));const tools=node('div');tools.append(button('대화 기록','text-button',history),button('책갈피','text-button',saves));toolbar.append(tools);app.append(toolbar);
  const layout=node('section','reading-layout');layout.append(stagePortrait(speaker));const page=node('article','reading-page');
  const pageMeta=node('div','page-meta');pageMeta.append(node('span','',`DAY ${String(s.day).padStart(2,'0')} / 30`),node('span','',s.place));page.append(pageMeta,node('h1','',s.title));
  const chapter=node('p','chapter-index',`${game.index+1} / ${timeline(game.focus).length} 장면 · ${game.phase==='response'?'선택의 여운':'당신의 선택으로 이어지는 이야기'}`);page.append(chapter);
  const prose=node('div','prose');
  if(game.phase==='story'){
    paraText(sceneText(game),prose);page.append(prose);
    const choices=node('div','choices');choices.append(node('div','choice-heading','이 순간, 당신의 대답은?'));
    choiceOrder(game).forEach((actual,shown)=>{const c=s.choices[actual],b=button('','choice-button',()=>commitChoice(actual));b.dataset.choice=String(actual);b.append(node('span','choice-number',`0${shown+1}`),node('span','choice-label',format(c.label,game)),node('span','choice-arrow','↗'));choices.append(b);});page.append(choices);
  }else{
    const c=s.choices[game.choice];const selected=node('div','chosen-line');selected.append(node('span','eyebrow','YOUR WORDS'),node('p','',format(c.label,game)));page.append(selected);
    paraText(c.response,prose);page.append(prose);
    const delta=node('p','affection-feedback',c.delta>1?'조금 더 가까워졌습니다.':c.delta<0?'말 사이에 작은 거리가 생겼습니다.':'이 마음을 다음 장으로 가져갑니다.');page.append(delta);
    page.append(button(game.index===timeline(game.focus).length-1?'마지막 페이지 펼치기 →':'다음 장면으로 →','primary-button next-button',()=>{game=advance(game);checkpoint();renderGame();top();focusTitle();}));
  }
  const progress=node('div','reading-progress');const bar=node('div');bar.style.width=((game.index+(game.phase==='response'?.5:0))/timeline(game.focus).length*100)+'%';progress.append(bar);page.append(progress);layout.append(page);app.append(layout);nav();
}
function commitChoice(index){if(game?.phase!=='story')return;tone();game=choose(game,index);checkpoint();renderGame();top();focusTitle();}
function renderEnding(){
  view='ending';const c=character(game.focus),r=result(game);unlock(game.focus,r.tier);checkpoint();app.replaceChildren();document.title=`${r.title} · 여름의 마지막 페이지`;
  const layout=node('section','reading-layout ending-layout');layout.append(stagePortrait(c,true));const page=node('article','reading-page ending-page');page.append(node('div','ending-badge',`${r.tier.toUpperCase()} ENDING`),node('p','eyebrow',`${c.name} · ${r.subtitle}`),node('h1','',r.title));const prose=node('div','prose');paraText(r.text,prose);page.append(prose);
  const signature=node('div','ending-signature');signature.append(node('span','','여름의 마지막 페이지'),node('span','',`${game.name} × ${c.name} / ${r.tier.toUpperCase()}`));page.append(signature);
  const actions=node('div','ending-actions');actions.append(button('엔딩 서가에 꽂아두기 ↗','primary-button',gallery),button('다른 여름 만나러 가기','secondary-button',()=>{home();top();}),button('기록 파일 저장 ↓','text-button',exportGame));page.append(actions);layout.append(page);app.append(layout);nav();
}
function history(){openModal('우리가 나눈 문장들',true);if(!game||!game.history.length){body.append(node('p','empty-note','선택한 뒤에 장면과 대화가 여기에 남습니다.'));return;}const list=node('div','history-list');game.history.forEach(h=>{const d=node('details','history-item');d.append(node('summary','',`DAY ${String(h.day).padStart(2,'0')} · ${h.title}`));const p=node('div','modal-prose');paraText(h.text,p,null);p.append(node('p','history-choice','나의 선택 · '+h.choice));paraText(h.response,p,null);d.append(p);list.append(d);});body.append(list);}
function prettyDate(value){const d=new Date(value);return Number.isFinite(d.getTime())?d.toLocaleString('ko-KR',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}):'저장한 기록';}
function saves(){
  openModal('잠시 접어둔 페이지',true);body.append(node('p','modal-description','자동 책갈피와 별도로 세 곳에 저장할 수 있어요. 이 브라우저를 벗어날 땐 파일로 가져가세요.'));
  const list=node('div','save-list');['auto','slot1','slot2','slot3'].forEach((slot,i)=>{
    const saved=loadGame(slot),row=node('div','save-row'),desc=node('div');desc.append(node('span','eyebrow',i===0?'AUTO BOOKMARK':`BOOKMARK 0${i}`));
    if(saved){const c=character(saved.focus);desc.append(node('h3','',`${saved.name} · ${c.short} 편`),node('p','',`${saved.phase==='ending'?'엔딩':currentScene(saved).title} · ${prettyDate(saved.updatedAt)}`));}else desc.append(node('h3','empty-slot','아직 접어두지 않은 페이지'));
    const actions=node('div','save-actions');if(i>0){const b=button(saved?'덮어쓰기':'여기에 저장','secondary-button',()=>{if(!game)return;if(saved){confirmAction('이 책갈피를 바꿀까요?','기존 기록을 현재 읽는 위치로 바꿉니다.',()=>{saveSlot(slot);saves();});}else{saveSlot(slot);saves();}});b.disabled=!game;actions.append(b);}
    if(saved)actions.append(button('이어 읽기','primary-button',()=>{game=saved;closeModal();checkpoint();renderGame();top();focusTitle();}));row.append(desc,actions);list.append(row);
  });body.append(list);const actions=node('div','file-actions');const exportB=button('현재 기록 파일로 저장 ↓','text-button',exportGame);exportB.disabled=!game;const file=node('input');file.type='file';file.accept='.json,application/json';file.hidden=true;file.addEventListener('change',()=>importGame(file.files?.[0]));actions.append(exportB,button('저장 파일 가져오기 ↑','text-button',()=>file.click()),file);body.append(actions);
}
function saveSlot(slot){if(saveGame({...game,updatedAt:Date.now()},slot))toast('이 페이지에 책갈피를 남겼어요.');}
function confirmAction(title,text,fn){openModal(title);body.append(node('p','modal-description',text),button('계속하기','primary-button',fn),button('돌아가기','text-button',saves));}
function exportGame(){if(!game)return;const blob=new Blob([JSON.stringify(game,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=node('a');a.href=url;a.download=`afterglow-${game.focus}-day${currentScene(game)?.day||30}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
async function importGame(file){if(!file)return;if(file.size>500000){toast('파일이 너무 커요. 게임에서 저장한 JSON 파일을 골라주세요.');return;}try{const value=JSON.parse(await file.text());if(!validGame(value))throw new Error();confirmAction('이 파일에서 이어 읽을까요?',`${value.name} · ${character(value.focus).short} 편. 현재 자동 책갈피가 바뀝니다.`,()=>{game=value;closeModal();checkpoint();renderGame();top();focusTitle();});}catch{toast('저장 파일을 읽지 못했어요. 올바른 게임 기록인지 확인해주세요.');}}
function gallery(){
  openModal('여름이 남긴 스무 개의 여운',true);const owned=unlocked();body.append(node('p','modal-description',`${owned.length} / 20개의 마지막 페이지를 만났어요. 아직 만나지 않은 결말은 제목도 비밀로 남겨둘게요.`));const grid=node('div','ending-gallery');
  characters.forEach(c=>{const group=node('section','gallery-character');const heading=node('div','gallery-heading');heading.append(image(c),node('h3','',c.name));group.append(heading);tiers.forEach(tier=>{const has=owned.includes(c.id+':'+tier),b=button('','ending-tile',()=>{if(!has)return;openModal(endings[c.id][tier].title,true);body.append(node('div','ending-badge',`${c.name} · ${tier.toUpperCase()}`));const p=node('div','modal-prose');paraText(endings[c.id][tier].text,p,{name:read('playerName','당신'),focus:c.id});body.append(p,button('서가로 돌아가기','secondary-button',gallery));});b.disabled=!has;b.append(node('span','',tier.toUpperCase()),node('strong','',has?endings[c.id][tier].title:'아직 만나지 않은 결말'),node('small','',has?'다시 읽기 ↗':'미발견'));group.append(b);});grid.append(group);});body.append(grid);
}
function settingsModal(){
  openModal('나에게 편안한 읽기');const label=node('label','setting-row');label.htmlFor='font-range';label.append(node('span','','글자 크기'));const range=node('input');range.id='font-range';range.type='range';range.min='15';range.max='23';range.value=String(settings.fontSize);const output=node('output','',`${settings.fontSize}px`);range.addEventListener('input',()=>{settings.fontSize=Number(range.value);output.textContent=range.value+'px';updateSettings();});label.append(range,output);body.append(label);
  for(const [key,text]of[['night','밤에 읽기'],['sound','선택할 때 작은 효과음']]){const row=node('label','setting-row'),input=node('input');input.type='checkbox';input.checked=Boolean(settings[key]);input.addEventListener('change',()=>{settings[key]=input.checked;updateSettings();if(key==='sound')tone();});row.append(node('span','',text),input);body.append(row);}
  body.append(node('p','modal-description','키보드 1 · 2 · 3으로 선택하고 Enter로 다음 장면을 읽을 수 있어요. 선택은 되돌려지지 않으니 중요한 순간에는 책갈피를 남겨주세요.'));
}
$('home-link').addEventListener('click',e=>{e.preventDefault();home();top();});$('continue-nav').addEventListener('click',()=>{game=loadGame()||game;renderGame();top();focusTitle();});$('saves-nav').addEventListener('click',saves);$('gallery-nav').addEventListener('click',gallery);$('settings-nav').addEventListener('click',settingsModal);$('modal-close').addEventListener('click',closeModal);
modal.addEventListener('click',e=>{if(e.target===modal){const rect=modal.getBoundingClientRect();if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)closeModal();}});
window.addEventListener('storage-unavailable',()=>toast('브라우저 저장 공간을 쓸 수 없어요. 책갈피 메뉴에서 기록 파일을 저장해주세요.'));
document.addEventListener('keydown',e=>{if(modal.open||['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)||e.ctrlKey||e.metaKey||e.altKey||e.repeat)return;if(view==='game'&&game.phase==='story'&&['1','2','3'].includes(e.key)){e.preventDefault();commitChoice(choiceOrder(game)[Number(e.key)-1]);}else if(view==='game'&&game.phase==='response'&&e.key==='Enter'&&!e.target.closest('button,a')){e.preventDefault();app.querySelector('.next-button')?.click();}});
updateSettings();home();
