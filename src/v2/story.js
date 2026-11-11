import {sequence} from './graph.js';
import {commonChapters, commonEndings} from './common.js';
import {routesA} from './routes-a.js';
import {routesB} from './routes-b.js';
import {routesC} from './routes-c.js';

export const routes = [...routesA, ...routesB, ...routesC];
const nodes = {};
function merge(part) {
  for (const [id, node] of Object.entries(part)) {
    if (nodes[id]) throw new Error(`Duplicate story node: ${id}`);
    nodes[id] = node;
  }
}
merge(sequence('common', commonChapters, 'group-ending-friendship'));
for (const route of routes) {
  merge(sequence(route.id, route.chapters, `${route.id}-ending-normal`));
  for (const end of route.endings) merge({[end.id]: end});
}
for (const end of commonEndings) merge({[end.id]: end});
export const story = {revision: 'v2-1', start: 'common-1-start-p1', nodes};
export const endings = Object.values(nodes).filter(n => n.type === 'end');
export const chapterList = [...commonChapters, ...routes.flatMap(r => r.chapters)];
