import {validGame} from './engine.js';
const PREFIX='afterglow:release-v1:';
let warned=false;
export function read(key,fallback=null){try{const raw=localStorage.getItem(PREFIX+key);return raw?JSON.parse(raw):fallback;}catch{return fallback;}}
export function write(key,value){try{localStorage.setItem(PREFIX+key,JSON.stringify(value));return true;}catch{if(!warned){warned=true;window.dispatchEvent(new CustomEvent('storage-unavailable'));}return false;}}
export function loadGame(slot='auto'){const value=read(slot);return validGame(value)?value:null;}
export function saveGame(game,slot='auto'){return validGame(game)&&write(slot,game);}
export function unlocked(){const list=read('collection',[]);return Array.isArray(list)?[...new Set(list.filter(x=>typeof x==='string'&&(/^(harin|sea|yujin|seoyun|isol):(best|good|normal|bad)$/.test(x)||x==='group:friendship')))]:[];}
export function unlock(focus,tier){const list=unlocked(),id=focus+':'+tier;if(!list.includes(id)){list.push(id);write('collection',list);}return list;}
