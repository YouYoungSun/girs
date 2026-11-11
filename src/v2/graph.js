// Authoring helpers only: the runtime consumes one explicit graph.
export function sequence(owner, chapters, finalNext) {
 const nodes = {};
 const put = node => {
  if (!node.id || nodes[node.id]) throw new Error(`Duplicate or missing node: ${node.id}`);
  nodes[node.id] = node;
 };
 const entry = item => item.pages ? `${item.id}-p1` : item.id;
 for (let ci=0;ci<chapters.length;ci++) {
  const chapter=chapters[ci];
  if (!Array.isArray(chapter.items)||!chapter.items.length) throw new Error(`Empty chapter: ${chapter.id}`);
  for (let i=0;i<chapter.items.length;i++) {
   const item=chapter.items[i];
   const next=i+1<chapter.items.length?entry(chapter.items[i+1]):ci+1<chapters.length?entry(chapters[ci+1].items[0]):finalNext;
   const base={owner,chapter:chapter.id,title:chapter.title,time:item.time??chapter.time??'',place:item.place??chapter.place??'',cast:item.cast??chapter.cast??[],variantId:item.variantId??chapter.variantId};
   if (item.pages) {
    if (!Array.isArray(item.pages)||!item.pages.length) throw new Error(`Empty scene: ${item.id}`);
    item.pages.forEach((blocks,p)=>{
     if (!Array.isArray(blocks)||!blocks.length) throw new Error(`Empty page: ${item.id}`);
     put({...base,type:'read',id:`${item.id}-p${p+1}`,blocks,next:p+1<item.pages.length?`${item.id}-p${p+2}`:item.next??next});
    });
   } else if (item.type==='choice') {
    if (!Array.isArray(item.options)||item.options.length<2||new Set(item.options.map(o=>o.id)).size!==item.options.length||item.options.some(o=>typeof o.id!=='string'||!o.id)) throw new Error(`Invalid options: ${item.id}`);
    const options=item.options.map(option=>{
     const {response,...rest}=option;
     const target=option.next??next;
     if (response!==undefined) {
      if (!Array.isArray(response)||!response.length) throw new Error(`Empty response: ${item.id}/${option.id}`);
      response.forEach((blocks,p)=>{
       if (!Array.isArray(blocks)||!blocks.length) throw new Error(`Empty response page: ${item.id}/${option.id}`);
       put({...base,cast:option.cast??base.cast,time:option.time??base.time,place:option.place??base.place,type:'read',id:`${item.id}-${option.id}-p${p+1}`,blocks,next:p+1<response.length?`${item.id}-${option.id}-p${p+2}`:target});
      });
      return {...rest,next:`${item.id}-${option.id}-p1`};
     }
     return {...rest,next:target};
    });
    put({...base,...item,options});
   } else {
    if (!['read','branch','end'].includes(item.type)) throw new Error(`Unknown item: ${item.id}`);
    put({...base,...item,...(item.type==='read'&&item.next===undefined?{next}:{}),...(item.type==='branch'&&item.otherwise===undefined?{otherwise:next}:{})});
   }
  }
 }
 return nodes;
}
