import {characters} from '../story/helpers.js';
import {endingArt} from '../life/art.js';
import {releaseKey, validVersion, releaseStatus, fetchRelease} from '../release.js';
import {story, endings} from './story.js';
import {createGame, currentNode, advance, choose, validGame, readKey, getBacklog, format} from './engine.js';
import {read, write, loadGame, saveGame, unlocked, unlock, readSeen, markSeen, legacyArchive, exportLegacyArchive, reusedPreferences} from './storage.js';

const $ = id => document.getElementById(id);
const app = $('app'), modal = $('modal'), body = $('modal-body');
const reused = reusedPreferences();
const settings = {night:false, fontSize:18, ...reused.settings, ...read('settings', {})};
const jobs = {harin:'제빵사', sea:'바텐더', yujin:'기록 담당자', seoyun:'회관 운영자', isol:'음향기사'};
let game = null, view = 'home', skipTimer = null, toastTimer;
const character = id => characters.find(c => c.id === id);
const el = (tag, cls, text) => {const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n;};
function button(text, cls, fn) {const b = el('button', cls, text); b.type = 'button'; b.addEventListener('click', fn); return b;}
function portrait(id) {const c = character(id), img = el('img'); img.src = `./assets/${id === 'isol' ? 'isol-petite' : id}.png`; img.alt = c.name; img.draggable = false; return img;}
function toast(text) {$('toast').textContent = text; $('toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('visible'), 4500);}
function stopSkip() {clearInterval(skipTimer); skipTimer = null; const b = $('skip-button'); if (b) {b.textContent = '읽은 부분 넘기기'; b.setAttribute('aria-pressed','false');}}
function open(title, wide = false) {stopSkip(); body.replaceChildren(el('h2','modal-title',title)); body.firstChild.id = 'modal-title'; modal.classList.toggle('wide', wide); if (!modal.open) modal.showModal();}
const close = () => modal.close();
function applySettings() {document.documentElement.dataset.theme = settings.night ? 'night' : 'day'; document.documentElement.style.setProperty('--reading-size', `${Math.max(15, Math.min(25, Number(settings.fontSize) || 18))}px`); write('settings',settings);}
function nav() {$('continue-nav').disabled = !game && !loadGame(); $('collection-count').textContent = `${unlocked().length}/21`;}
function save() {if (game && !saveGame(game)) toast('저장하지 못했어요. 책갈피에서 기록 파일을 내보내주세요.'); nav();}
function focusPage() {const node = app.querySelector('.v2-prose, h1'); if (node) {node.tabIndex = -1; node.focus({preventScroll:true});}}
function blocks(items, container, context = game) {
  for (const item of items || []) {
    if (Array.isArray(item)) {const row = el('div','dialogue'); row.append(el('span','speaker',format(item[0], context)),el('p','',format(item[1], context))); container.append(row);}
    else container.append(el('p','narration',format(item, context)));
  }
}
function download(text, filename) {const url = URL.createObjectURL(new Blob([text],{type:'application/json'})), a = el('a'); a.href = url; a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(url),1000);}
function begin() {
  open('회관에서 부를 이름');
  const form = el('form','start-form'), label = el('label','','이름 또는 별명'), input = el('input');
  label.htmlFor = input.id = 'player-name'; input.maxLength = 12; input.required = true; input.autocomplete = 'off'; input.value = game?.name || read('playerName', reused.playerName || '');
  form.append(label,input,el('p','modal-description','공통 이야기에서 다섯 사람을 만난 뒤, 한 사람과의 이야기를 선택합니다. 등장인물과 주인공은 모두 성인입니다.'));
  if (loadGame()) form.append(el('p','save-warning','새로 시작하면 자동 책갈피가 바뀝니다. 남겨둘 이야기는 먼저 수동 책갈피에 저장해주세요.'));
  const submit = el('button','primary-button','여름 시작하기'); submit.type = 'submit'; form.append(submit);
  form.addEventListener('submit',event => {event.preventDefault(); try {game = createGame(input.value); write('playerName',game.name); close(); save(); render(); focusPage();} catch (error) {input.setCustomValidity(error.message); input.reportValidity();}});
  input.addEventListener('input',() => input.setCustomValidity('')); body.append(form); input.focus();
}
function home() {
  stopSkip(); view = 'home'; app.replaceChildren(); document.title = '여름의 마지막 페이지 · AFTERGLOW';
  const hero = el('section','hero v2-home'), copy = el('div','hero-copy');
  copy.append(el('div','eyebrow','AFTERGLOW · STORY EDITION'),el('h1','','같이 보내는 여름,\n한 사람과 이어질 이야기.'),el('p','hero-description','바닷가 달무리회관의 마지막 기록집을 맡게 된 당신.\n낯선 사람들과 일하고, 저녁을 먹고, 주말 약속을 잡습니다.\n함께할 사람을 고른 뒤에는 그 사람의 이야기가 이어집니다.'));
  const actions = el('div','hero-actions'); actions.append(button('새 이야기 시작','primary-button',begin));
  if (loadGame()) actions.append(button('이어 읽기','secondary-button',() => resume(loadGame())));
  copy.append(actions,el('p','v2-home-note','공통 3장 + 개인 7장 · 읽기 중심의 성인 일상 로맨스'));
  const art = el('div','v2-home-cast'); for (const c of characters) art.append(portrait(c.id)); hero.append(copy,art); app.append(hero);
  const heading = el('div','section-heading'); heading.append(el('h2','','함께 지낼 다섯 사람')); app.append(heading);
  const grid = el('div','character-grid'); for (const c of characters) {
    const card = button('','character-card',() => profile(c.id)); card.style.setProperty('--character',c.color); card.style.setProperty('--soft',c.soft);
    const art = el('div','card-portrait'); art.append(portrait(c.id)); const info = el('div','card-info'); info.append(el('span','card-job',`${c.age}세 · ${jobs[c.id]}`),el('h3','',c.name),el('p','',c.quote),el('span','card-link','인물 소개')); card.append(art,info); grid.append(card);
  } app.append(grid);
  const note = el('section','home-note'); note.append(el('div','','다른 선택은, 다음 여름에.'),el('p','','개인 루트에 들어가면 다른 사람의 연애 이야기는 이번 회차에서 닫힙니다.\n선택 전 책갈피를 불러오거나 새로 시작하면 다른 이야기를 만날 수 있습니다.')); app.append(note);
  if (Object.keys(legacyArchive() || {}).length) app.append(el('p','v2-legacy-note','v1 저장 기록은 보존되어 있습니다. 책갈피 메뉴에서 보관본을 내보낼 수 있어요. v2 이야기는 새로 시작합니다.'));
  nav();
}
function profile(id) {const c = character(id); open(c.name); const art = el('div','v2-profile-art'); art.append(portrait(id)); body.append(art,el('p','modal-description',`${c.age}세 · ${jobs[id]}`),el('p','modal-description',c.description),button('닫기','secondary-button',close));}
function resume(value) {if (!value || !validGame(value)) {toast('불러올 수 있는 v2 책갈피가 없어요.'); return;} stopSkip(); game = value; close(); save(); render(); focusPage();}
function render() {
  if (!game) return home();
  const node = currentNode(game); view = 'game'; app.replaceChildren();
  document.title = `${node.title} · 여름의 마지막 페이지`;
  const toolbar = el('div','reading-toolbar v2-toolbar'), left = el('div'), right = el('div');
  left.append(button('지난 내용','text-button',backlog),button('책갈피','text-button',saves));
  const skip = button(skipTimer ? '넘기기 멈추기' : '읽은 부분 넘기기','text-button',toggleSkip); skip.id = 'skip-button'; skip.disabled = node.type !== 'read'; skip.setAttribute('aria-pressed',String(!!skipTimer)); right.append(skip); toolbar.append(left,right); app.append(toolbar);
  const shell = el('div','v2-reading'), page = el('article','v2-page'), aside = el('aside','v2-scene');
  const owner = game.routeId && game.routeId !== 'group' ? character(game.routeId) : null;
  const chapterNumber = node.chapter?.match(/-(\d+)$/)?.[1];
  const chapterProgress = chapterNumber ? ` · ${chapterNumber} / ${owner ? 7 : 3}장` : '';
  page.append(el('div','eyebrow',(owner ? `${owner.name}의 이야기` : game.routeId === 'group' ? '함께 보낸 여름' : '공통 이야기')+chapterProgress),el('h1','v2-chapter',node.title));
  const context = el('p','v2-context',[node.time,node.place].filter(Boolean).join(' · ')); page.append(context);
  const prose = el('div','prose v2-prose'); prose.setAttribute('role','region'); prose.setAttribute('aria-label','이야기 본문'); prose.tabIndex = -1;
  if (node.type === 'end') {
    stopSkip(); const key = `${node.route}:${node.tier}`; unlock(node.route,node.tier); const snapshots = read('endingNames',{}); write('endingNames',{...snapshots,[key]:game.name}); nav();
    page.append(el('div','ending-badge',`${node.tier.toUpperCase()} ENDING`));
    page.append(endingPicture(node.route,node.tier)); blocks(node.blocks,prose); page.append(prose);
    const actions = el('div','ending-actions'); actions.append(button('엔딩 서가','primary-button',gallery),button('새 이야기 시작','secondary-button',begin),button('기록 내보내기','text-button',exportGame)); page.append(actions);
  } else if (node.type === 'read') {
    blocks(node.blocks,prose); prose.title = '다음 화면으로 · Enter / Space';
    prose.addEventListener('click',event => {if (event.target.closest('button,a') || window.getSelection()?.toString()) return; next();});
    const actions = el('div','v2-next'); actions.append(el('span','','Enter / Space로 계속'),button('다음 →','primary-button next-button',next)); page.append(prose,actions);
  } else if (node.type === 'choice') {
    stopSkip(); prose.append(el('p','narration',format(node.prompt || '어떻게 할까?',game))); page.append(prose);
    const choices = el('div','v2-choices'); choices.setAttribute('aria-label','이야기 선택');
    node.options.forEach((option,index) => {const b = button('','v2-choice',() => commit(index)); b.append(el('span','v2-choice-number',String(index+1)),el('span','',format(option.label,game))); choices.append(b);}); page.append(choices);
  }
  const cast = [...new Set(node.cast || [])].filter(id => character(id));
  if (cast.length) {const stage = el('div','v2-cast'); stage.dataset.count = cast.length; for (const id of cast) {const figure = el('figure'); figure.append(portrait(id),el('figcaption','',character(id).name)); stage.append(figure);} aside.append(stage);}
  if (owner) aside.append(el('p','v2-route-label',`${owner.name} 루트 진행 중`));
  aside.append(el('p','v2-reading-help',node.type === 'choice' ? '숫자 키 또는 버튼으로 선택합니다.' : '천천히 읽어도 괜찮아요.\n책갈피는 지금 화면을 기억합니다.'));
  shell.append(page,aside); app.append(shell);
}
function next() {if (currentNode(game)?.type !== 'read') return; const old = currentNode(game); try {const nextGame = advance(game); markSeen(readKey(old)); game = nextGame; save(); render(); if (!skipTimer) focusPage();} catch (error) {stopSkip(); toast(error.message);}}
function commit(index) {if (currentNode(game)?.type !== 'choice') return; try {game = choose(game,index); save(); render(); focusPage();} catch(error) {toast(error.message);}}
function toggleSkip() {
  if (skipTimer) return stopSkip();
  if (!readSeen().includes(readKey(currentNode(game)))) return toast('여기는 아직 읽지 않은 내용이에요.');
  skipTimer = setInterval(() => {if (modal.open || document.hidden || view !== 'game' || currentNode(game)?.type !== 'read' || !readSeen().includes(readKey(currentNode(game)))) {stopSkip(); return;} next();},130);
  const b = $('skip-button'); b.textContent = '넘기기 멈추기'; b.setAttribute('aria-pressed','true');
}
function backlog() {
  if (!game) return; open('지난 내용',true); const list = el('div','history-list');
  const entries = getBacklog(game), current = currentNode(game); if (current.type === 'read' || current.type === 'end') entries.push(current);
  let previous = '';
  for (const entry of entries) {if (entry.type === 'choice') {list.append(el('p','history-choice',`선택 · ${format(entry.selected.label,game)}`)); continue;}
    const section = el('section','v2-backlog-entry'); if (entry.chapter !== previous) {section.append(el('h3','',entry.title)); previous = entry.chapter;} blocks(entry.blocks,section); list.append(section);
  }
  if (!entries.length) list.append(el('p','empty-note','아직 읽은 내용이 없습니다.')); body.append(list); requestAnimationFrame(() => {modal.scrollTop = modal.scrollHeight;});
}
function endingPicture(route,tier) {const art = endingArt(route === 'group' ? null : route,tier), figure = el('figure','ending-art'), image = el('img'); image.src = art.src; image.alt = art.alt; image.width = 1280; image.height = 720; image.decoding = 'async'; image.addEventListener('error',() => {figure.replaceChildren(el('figcaption','','그림을 불러오지 못했어요. 이야기는 계속 읽을 수 있습니다.'));},{once:true}); figure.append(image); return figure;}
function gallery() {
  open('엔딩 서가',true); const owned = unlocked(), names = read('endingNames',{}); body.append(el('p','modal-description',`${owned.length} / 21 · v2에서 만난 결말만 열립니다.`));
  const grid = el('div','ending-gallery'); for (const c of [...characters,{id:'group',name:'함께 보낸 여름'}]) {
    const section = el('section','gallery-character'); section.append(el('h3','gallery-name',c.name));
    for (const end of endings.filter(n => n.route === c.id)) {const key = `${c.id}:${end.tier}`, has = owned.includes(key), b = button('','ending-tile',() => {if (!has) return; open(end.title,true); body.append(el('div','ending-badge',`${end.tier.toUpperCase()} ENDING`),endingPicture(c.id,end.tier)); const prose = el('div','modal-prose'); blocks(end.blocks,prose,{name:names[key] || read('playerName','당신')}); body.append(prose,button('서가로 돌아가기','secondary-button',gallery));});
      b.disabled = !has; if (has) b.append(endingPicture(c.id,end.tier)); b.append(el('span','',end.tier.toUpperCase()),el('strong','',has ? end.title : '아직 만나지 않은 결말')); section.append(b);
    } grid.append(section);
  } body.append(grid);
}
const date = value => new Date(value).toLocaleString('ko-KR',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
function saves() {
  open('책갈피',true); body.append(el('p','modal-description','같은 화면에서 이어 읽습니다. 다른 루트를 선택하려면 확정 이전 책갈피를 불러오세요.'));
  const list = el('div','save-list'); for (const [index,slot] of ['auto','slot1','slot2','slot3'].entries()) {
    const value = loadGame(slot), row = el('div','save-row'), desc = el('div'), actions = el('div','save-actions');
    desc.append(el('span','eyebrow',index === 0 ? '자동 책갈피' : `책갈피 ${index}`),el('h3','',value ? `${value.name} · ${currentNode(value).title}` : '빈 책갈피'));
    if (value) desc.append(el('p','',`${value.routeId && character(value.routeId) ? character(value.routeId).name+' 루트' : '공통 이야기'} · ${date(value.updatedAt)}`));
    if (index > 0) {const b = button(value ? '현재 위치로 덮어쓰기' : '여기에 저장','secondary-button',() => {if (!game) return; if (value) {open('이 책갈피를 바꿀까요?'); body.append(el('p','modal-description','기존 수동 책갈피의 위치가 현재 화면으로 바뀝니다.'),button('현재 화면 저장','primary-button',() => storeSlot(slot)),button('돌아가기','text-button',saves));} else storeSlot(slot);}); b.disabled = !game; actions.append(b);}
    if (value) actions.append(button('이어 읽기','primary-button',() => resume(value))); row.append(desc,actions); list.append(row);
  } body.append(list);
  const actions = el('div','file-actions'), out = button('현재 v2 기록 내보내기','text-button',exportGame); out.disabled = !game; const input = el('input'); input.type = 'file'; input.accept = '.json,application/json'; input.hidden = true; input.addEventListener('change',() => importGame(input.files?.[0])); actions.append(out,button('v2 기록 가져오기','text-button',() => input.click()),input);
  if (Object.keys(legacyArchive() || {}).length) actions.append(button('v1 저장 보관본 내보내기','text-button',() => download(exportLegacyArchive(),'afterglow-v1-archive.json'))); body.append(actions);
}
function storeSlot(slot) {if (game && saveGame(game,slot)) toast('현재 화면을 저장했어요.'); else toast('저장하지 못했어요. 기록 파일을 내보내주세요.'); saves();}
function exportGame() {if (game) download(JSON.stringify(game,null,2),`afterglow-v2-${game.routeId || 'common'}.json`);}
async function importGame(file) {
  if (!file) return; if (file.size > 4000000) return toast('저장 파일이 너무 큽니다.');
  try {const value = JSON.parse(await file.text()); if (value?.edition !== 'release-v2') return toast('v1 저장은 v2 이야기와 호환되지 않습니다. 기존 기록은 그대로 보존됩니다.'); if (!validGame(value)) return toast('유효한 v2 저장 파일이 아닙니다. 현재 기록은 바뀌지 않았어요.'); open('가져온 이야기에서 이어 읽을까요?'); body.append(el('p','modal-description',`${value.name} · ${currentNode(value).title}. 자동 책갈피가 이 위치로 바뀝니다.`),button('이어 읽기','primary-button',() => resume(value)),button('돌아가기','text-button',saves));} catch {toast('저장 파일을 읽지 못했어요. 현재 기록은 바뀌지 않았습니다.');}
}
function settingsView() {
  open('읽기 설정'); const row = el('label','setting-row'), range = el('input'), out = el('output','',`${settings.fontSize}px`); range.type = 'range'; range.min = '15'; range.max = '25'; range.value = settings.fontSize; range.id = 'font-size'; row.htmlFor = range.id; range.addEventListener('input',() => {settings.fontSize = Number(range.value); out.textContent = `${range.value}px`; applySettings();}); row.append(el('span','','글자 크기'),range,out); body.append(row);
  const night = el('label','setting-row'), check = el('input'); check.type = 'checkbox'; check.checked = !!settings.night; check.addEventListener('change',() => {settings.night = check.checked; applySettings();}); night.append(el('span','','밤에 읽기'),check); body.append(night,el('p','modal-description','Enter / Space: 다음 화면 · 숫자 키: 선택지 · 읽은 부분 넘기기는 새로운 문장과 모든 선택에서 멈춥니다.'));
}
function setupReleaseNotice() {
  const version = document.querySelector('meta[name="application-version"]')?.content; if (!validVersion(version)) return;
  const badge = $('game-version'), notice = $('release-notice'), reload = $('release-reload'); badge.textContent = `v${version}`; badge.setAttribute('aria-label',`현재 게임 버전 v${version}`);
  let previous = null, ignored = null, polling = false; try {previous = localStorage.getItem(releaseKey); localStorage.setItem(releaseKey,version);} catch {}
  const show = status => {if (!status || ignored === status.kind+status.version || notice.dataset.release === status.kind+status.version) return; $('release-message').textContent = status.message; reload.hidden = status.kind !== 'available'; notice.hidden = false; notice.dataset.release = status.kind+status.version;}; show(releaseStatus(version,null,previous));
  reload.addEventListener('click',() => window.location.reload()); $('release-dismiss').addEventListener('click',() => {ignored = notice.dataset.release; notice.hidden = true;});
  const check = async() => {if (polling || document.hidden) return; polling = true; try {show(releaseStatus(version,await fetchRelease(),null));} finally {polling = false;}}; check(); setInterval(check,60000); document.addEventListener('visibilitychange',() => {if (!document.hidden) check();}); window.addEventListener('focus',check);
}
$('home-link').addEventListener('click',event => {event.preventDefault(); home();}); $('continue-nav').addEventListener('click',() => resume(loadGame() || game)); $('saves-nav').addEventListener('click',saves); $('gallery-nav').addEventListener('click',gallery); $('settings-nav').addEventListener('click',settingsView); $('modal-close').addEventListener('click',close);
document.addEventListener('keydown',event => {
  if (modal.open || view !== 'game' || !game || event.repeat || event.ctrlKey || event.altKey || event.metaKey || event.target.closest('input,textarea,select,button,a')) return;
  const node = currentNode(game);
  if (node.type === 'read' && ['Enter',' '].includes(event.key)) {event.preventDefault(); next();}
  else if (node.type === 'choice' && /^[1-9]$/.test(event.key) && Number(event.key) <= node.options.length) {event.preventDefault(); commit(Number(event.key)-1);}
});
document.addEventListener('visibilitychange',() => {if (document.hidden) stopSkip();});
window.addEventListener('storage-unavailable',() => toast('브라우저에 저장할 수 없어요. 책갈피에서 기록 파일을 내보내주세요.'));
applySettings(); setupReleaseNotice(); home();
