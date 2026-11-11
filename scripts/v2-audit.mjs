import {writeFile} from 'node:fs/promises';
import {story,routes} from '../src/v2/story.js';
import {traceEndings} from '../src/v2/audit.js';
const result=traceEndings(story);
const report={
  storyRevision:story.revision,
  nodes:Object.keys(story.nodes).length,
  reachableEndings:result.endings.length,
  decisionStates:result.states,
  routes:routes.map(r=>({id:r.id,chapters:r.chapters.length})),
  note:'Each row is one reachable representative path. Characters include narration and dialogue, not speaker labels or unchosen alternatives. This is not a measured human playtime.',
  paths:result.endings.map(e=>({route:e.routeId,ending:e.ending,choices:e.decisions.length,readingPages:e.pages,characters:e.characters,decisions:e.decisions})),
};
await writeFile(new URL('../docs/v2-path-audit.json',import.meta.url),JSON.stringify(report,null,2));
console.table(report.paths.map(({route,ending,choices,readingPages,characters})=>({route,ending,choices,readingPages,characters})));
console.log(`${report.nodes} nodes; ${report.reachableEndings} endings; ${report.decisionStates} decision states`);
