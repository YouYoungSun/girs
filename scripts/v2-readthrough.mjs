import {readFile,writeFile} from 'node:fs/promises';
import {story} from '../src/v2/story.js';
import {createGame,currentNode,advance,choose,format} from '../src/v2/engine.js';
const [route,tier,out]=process.argv.slice(2);
const report=JSON.parse(await readFile(new URL('../docs/v2-path-audit.json',import.meta.url),'utf8'));
if (report.storyRevision!==story.revision) throw new Error('Regenerate the path audit for this revision');
const sample=report.paths.find(p=>p.route===route && p.ending===`${route}-ending-${tier}`);
if (!sample) throw new Error('Usage: node scripts/v2-readthrough.mjs harin best [output.md]');
let game=createGame('민우'),index=0,previous='',text=`# ${route} / ${tier}\n\n`;
for (let steps=0;steps<3000;steps++) {
  const node=currentNode(game);
  const heading=`${node.chapter} · ${node.title} · ${node.time} · ${node.place}`;
  if (heading!==previous) {text+=`\n## ${heading}\n\n`;previous=heading;}
  if (node.type==='choice') {
    const d=sample.decisions[index++];if (d.nodeId!==node.id) throw new Error('Audit is stale; regenerate it');
    const selected=node.options.findIndex(o=>o.id===d.choiceId);
    text+=`> 선택: ${format(node.options[selected].label,game)}\n\n`;game=choose(game,selected);
  } else {
    for (const block of node.blocks) text+=Array.isArray(block)?`**${format(block[0],game)}** ${format(block[1],game)}\n\n`:`${format(block,game)}\n\n`;
    if (node.type==='end') break;game=advance(game);
  }
}
if (out) await writeFile(out,text);else process.stdout.write(text);
