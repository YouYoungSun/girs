import {writeFile} from 'node:fs/promises';
import {days,visits} from '../src/engine.js';
const rows=[...days,...visits].map(e=>({id:e.id,title:e.title,place:e.place,cast:e.cast,minDay:e.minDay||Number(e.id.split('-')[1]),choices:e.choices.map(c=>({label:c.label,effects:c.effects,memory:c.flag}))}));
await writeFile('docs/story-map.json',JSON.stringify({note:'원본 사건 목록. 실제 표시 분기는 relationships.js 및 quiet-scenes.js, 메시지는 messages.js 참조. 개인 3·5 상처, 4·6·7 회복. 엔딩은 호감도·미해결 상처·마지막 개인 에피소드 경험으로 결정.',scenes:rows},null,2));
