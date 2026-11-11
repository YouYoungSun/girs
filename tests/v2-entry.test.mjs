import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {releaseInfo} from '../scripts/release.mjs';

test('v2 is the shipped entry and all new browser modules are served',async()=>{
  const child=spawn(process.execPath,['scripts/serve.mjs'],{cwd:new URL('../',import.meta.url),env:{...process.env,PORT:'0'},windowsHide:true,stdio:['ignore','pipe','pipe']});
  try {
    const port=await new Promise((resolve,reject)=>{
      const timeout=setTimeout(()=>reject(Error('server timeout')),8000);
      child.once('error',error=>{clearTimeout(timeout);reject(error);});
      child.stdout.on('data',chunk=>{const match=String(chunk).match(/localhost:(\d+)/);if(match){clearTimeout(timeout);resolve(match[1]);}});
      child.once('exit',code=>{clearTimeout(timeout);reject(Error('server exited '+code));});
    });
    const base=`http://127.0.0.1:${port}`;
    const html=await(await fetch(base)).text();
    assert.match(html,/src="\.\/src\/v2\/app\.js"/);
    assert.match(html,/href="\.\/src\/v2\/style\.css"/);
    assert.ok(html.includes('>'+ (await releaseInfo()).label +'</span>'));
    assert.doesNotMatch(html,/src="\.\/src\/app\.js"/);
    await Promise.all(['app.js','engine.js','storage.js','graph.js','story.js','common.js','routes-a.js','routes-b.js','routes-c.js','style.css'].map(async name=>{
      const response=await fetch(`${base}/src/v2/${name}`);assert.equal(response.status,200,name);assert.ok((await response.text()).length>100,name);
    }));
  } finally {child.kill();}
});
