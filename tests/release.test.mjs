import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {releaseInfo,stampRelease} from '../scripts/release.mjs';
import {releaseStatus,fetchRelease,validVersion} from '../src/release.js';
const root=new URL('../',import.meta.url);
test('release comes from the package version and v2 stamping changes both visible badge and metadata',async()=>{
 const pkg=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8')),info=await releaseInfo(),html=await readFile(new URL('../index.html',import.meta.url),'utf8');assert.equal(info.version,pkg.version);const v2=stampRelease(html,{version:'2.0.0',label:'v2.0.0'});assert.match(v2,/<meta name="application-version" content="2\.0\.0"/);assert.match(v2,/<span id="game-version"[^>]*>v2\.0\.0<\/span>/);assert.doesNotMatch(v2,/>v1\.0\.0<\/span>/);
});
test('first load stays quiet; a new deployment requests reload before claiming the new version is running',()=>{
 assert.equal(releaseStatus('1.0.0','1.0.0',null),null);assert.equal(releaseStatus('1.0.0','1.0.0','1.0.0'),null);
 const pending=releaseStatus('1.0.0','2.0.0','1.0.0');assert.equal(pending.kind,'available');assert.match(pending.message,/v2\.0\.0/);assert.match(pending.message,/새로고침/);
 const applied=releaseStatus('2.0.0','2.0.0','1.0.0');assert.equal(applied.kind,'changed');assert.match(applied.message,/현재 버전으로 플레이/);
});
test('metadata failures and invalid versions never block playing',async()=>{
 for(const v of [null,'2','v2.0.0','<script>',''])assert.equal(validVersion(v),false);
 assert.equal(await fetchRelease(async()=>{throw Error('offline');}),null);
 assert.equal(await fetchRelease(async()=>({ok:false})),null);
 assert.equal(await fetchRelease(async()=>({ok:true,json:async()=>({version:'bad'})})),null);
 let options;assert.equal(await fetchRelease(async(_,o)=>{options=o;return {ok:true,json:async()=>({version:'2.0.0'})};}),'2.0.0');assert.equal(options.cache,'no-store');
});
test('dev server delivers a matching visible version and uncached release metadata',async()=>{
 const child=spawn(process.execPath,['scripts/serve.mjs'],{cwd:root,env:{...process.env,PORT:'0'},windowsHide:true,stdio:['ignore','pipe','pipe']});
 try{const port=await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('server timeout')),8000);child.once('error',e=>{clearTimeout(timeout);reject(e);});child.stdout.on('data',chunk=>{const m=String(chunk).match(/localhost:(\d+)/);if(m){clearTimeout(timeout);resolve(m[1]);}});child.once('exit',code=>{clearTimeout(timeout);reject(Error('server exited '+code));});});
 const base=`http://127.0.0.1:${port}`,response=await fetch(base+'/release.json'),data=await response.json(),html=await (await fetch(base)).text(),expected=await releaseInfo();assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');assert.deepEqual(data,expected);assert.ok(html.includes('content="'+expected.version+'"'));assert.ok(html.includes('>'+expected.label+'</span>'));
 }finally{child.kill();}
});
