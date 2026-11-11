import {validGame,STORY_REVISION} from './engine.js';
const PREFIX='afterglow:release-v2:';
const LEGACY='afterglow:release-v1:';
let warned=false;
export function read(key,fallback=null) {try {const raw=localStorage.getItem(PREFIX+key);return raw?JSON.parse(raw):fallback;} catch {return fallback;}}
export function write(key,value) {try {localStorage.setItem(PREFIX+key,JSON.stringify(value));return true;} catch {if (!warned) {warned=true;if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('storage-unavailable'));}return false;}}
export function loadGame(slot='auto') {const g=read(slot);return validGame(g)?g:null;}
export function saveGame(g,slot='auto') {return validGame(g)&&write(slot,g);}
const isEnding=id=>/^(harin|sea|yujin|seoyun|isol):(best|good|normal|bad)$/.test(id)||id==='group:friendship';
export function unlocked() {const list=read('collection',[]);return Array.isArray(list)?[...new Set(list.filter(x=>typeof x==='string'&&isEnding(x)))]:[];}
export function unlock(route,tier) {const list=unlocked(),id=`${route}:${tier}`;if (isEnding(id)&&!list.includes(id)) {list.push(id);write('collection',list);}return list;}
export function readSeen() {const seen=read('seen',[]);return Array.isArray(seen)?[...new Set(seen.filter(key=>typeof key==='string'&&key.startsWith(STORY_REVISION+':')&&key.length<250))]:[];}
export function markSeen(key) {if(typeof key!=='string'||!key.startsWith(STORY_REVISION+':')||key.length>=250)return false;const list=readSeen();if(!list.includes(key))list.push(key);return write('seen',list);}
export function legacyArchive() {
 const result={};
 try {for (let i=0;i<localStorage.length;i++) {const key=localStorage.key(i);if (key?.startsWith(LEGACY)) result[key]=localStorage.getItem(key);}} catch {return null;}
 return result;
}
export function exportLegacyArchive() {return JSON.stringify({format:'afterglow-v1-archive',entries:legacyArchive()},null,2);}
export function reusedPreferences() {
 const get=(key,fallback)=>{try {return JSON.parse(localStorage.getItem(LEGACY+key))??fallback;}catch{return fallback;}};
 const raw=get('settings',{}),name=get('playerName','');
 const settings={};
 if(raw&&typeof raw==='object') {if(typeof raw.night==='boolean')settings.night=raw.night;if(Number.isFinite(raw.fontSize))settings.fontSize=Math.max(15,Math.min(23,raw.fontSize));}
 return {playerName:typeof name==='string'?name.replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,12):'',settings};
}
