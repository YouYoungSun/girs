import {readFile,writeFile} from 'node:fs/promises';
import {routes} from '../src/v2/story.js';
import {createGame,currentNode,advance,choose,validGame} from '../src/v2/engine.js';
const folder=new URL('../docs/reference-notes/',import.meta.url);
const chapter=routes.find(r=>r.id==='harin').chapters.find(c=>c.id==='harin-2');
const renderBlock=b=>Array.isArray(b)?`**${b[0]}:** ${b[1]}`:b;
function reading(c) {
  let out=`# 하린 2장 · ${c.title}\n\n`;
  for (const item of c.items) {
    out+=`\n## ${item.time} · ${item.place}\n\n`;
    if (item.pages) item.pages.forEach((blocks,i)=>{out+=`〔화면 ${i+1}〕\n\n${blocks.map(renderBlock).join('\n\n')}\n\n`;});
    else if (item.type==='choice') {
      out+=`**선택 상황:** ${item.prompt}\n\n`;
      for (const option of item.options) {out+=`### ${option.label}\n\n`;option.response?.forEach(blocks=>{out+=blocks.map(renderBlock).join('\n\n')+'\n\n';});}
    }
  }
  return out;
}
const mode=process.argv[2];
if (mode==='before') {
  let game=createGame('민우');const saves=[];
  for (let step=0;step<1000;step++) {
    const node=currentNode(game);if(node.type==='end')break;
    if(node.chapter==='harin-2')saves.push(game);
    if (node.type==='choice') {const route=node.options.findIndex(o=>o.route==='harin');game=choose(game,route<0?0:route);} else game=advance(game);
  }
  await writeFile(new URL('harin-2-before.json',folder),JSON.stringify({chapter,saves},null,2));
  await writeFile(new URL('harin-2-before.md',folder),reading(chapter));
  console.log(`Before snapshot: ${saves.length} chapter bookmarks`);
} else if(mode==='after') {
  const before=JSON.parse(await readFile(new URL('harin-2-before.json',folder),'utf8'));
  const errors=before.saves.filter(g=>!validGame(g)).map(g=>g.nodeId);
  if(errors.length)throw Error('Existing bookmarks no longer validate: '+errors.join(', '));
  const shape=c=>c.items.map(i=>({id:i.id,pages:i.pages?.length,options:i.options?.map(o=>({id:o.id,set:o.set,responsePages:o.response?.length}))}));
  if(JSON.stringify(shape(chapter))!==JSON.stringify(shape(before.chapter)))throw Error('Page order/count or choice facts changed');
  await writeFile(new URL('harin-2-after.md',folder),reading(chapter));
  console.log(`After reading saved; ${before.saves.length} existing bookmarks preserved; page and choice shape unchanged`);
} else throw Error('Use before or after');
