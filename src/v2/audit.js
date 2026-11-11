// Symbolic traversal used by the content checks. It does not unlock endings.
const textLength = blocks => (blocks || []).reduce((n,b) => n + (Array.isArray(b) ? b[1] : b).length, 0);
export function traceEndings(story) {
  const pending = [{nodeId:story.start, routeId:null, facts:{}, decisions:[], pages:0, characters:0}];
  const visited = new Set(), found = new Map(), reached = new Set();
  let states = 0;
  while (pending.length) {
    let state = pending.pop(), hops = 0;
    for (;;) {
      if (++hops > 3000) throw new Error(`Story cycle near ${state.nodeId}`);
      const node = story.nodes[state.nodeId];
      if (!node) throw new Error(`Missing node: ${state.nodeId}`);
      reached.add(node.id);
      if (node.owner !== 'common' && node.owner !== state.routeId) throw new Error(`Route leak: ${state.routeId} -> ${node.id} (${node.owner})`);
      if (node.type === 'read') {state = {...state,nodeId:node.next,pages:state.pages+1,characters:state.characters+textLength(node.blocks)}; continue;}
      if (node.type === 'branch') {
        const c = node.cases.find(c => Object.entries(c.when || {}).every(([k,v]) => k === 'routeId' ? state.routeId === v : Object.hasOwn(state.facts,k) && state.facts[k] === v));
        state = {...state,nodeId:c?.next ?? node.otherwise}; continue;
      }
      if (node.type === 'end') {
        if (node.route !== state.routeId) throw new Error(`Wrong ending owner: ${node.id}`);
        const key = `${node.route}:${node.tier}`, sample = {...state,ending:node.id,characters:state.characters+textLength(node.blocks)};
        const record = found.get(key);
        if (!record) found.set(key,{...sample,minCharacters:sample.characters,maxCharacters:sample.characters,minChoices:sample.decisions.length,maxChoices:sample.decisions.length});
        else {record.minCharacters = Math.min(record.minCharacters,sample.characters); record.maxCharacters = Math.max(record.maxCharacters,sample.characters); record.minChoices = Math.min(record.minChoices,sample.decisions.length); record.maxChoices = Math.max(record.maxChoices,sample.decisions.length);}
        break;
      }
      if (node.type !== 'choice') throw new Error(`Unknown node: ${node.id}`);
      const key = JSON.stringify([node.id,state.routeId,Object.entries(state.facts).sort(([a],[b]) => a.localeCompare(b))]);
      if (visited.has(key)) break;
      visited.add(key); if (++states > 200000) throw new Error('Story traversal exceeds 200000 decision states');
      for (const option of node.options) {
        if (option.route !== undefined && state.routeId !== null) throw new Error(`Route changes after commitment: ${node.id}`);
        pending.push({...state,nodeId:option.next,routeId:option.route ?? state.routeId,facts:{...state.facts,...option.set},decisions:[...state.decisions,{nodeId:node.id,choiceId:option.id}]});
      }
      break;
    }
  }
  return {states,endings:[...found.values()],unreachable:Object.keys(story.nodes).filter(id=>!reached.has(id))};
}
