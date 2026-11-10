export const ids=['harin','sea','yujin','seoyun','isol'];
export const pick=(label,response,effects={},flag=null)=>({label,response,effects,flag});
export const episode=(id,title,place,cast,text,choices,extra={})=>({id,title,place,cast,text,choices,...extra});
export const all=n=>Object.fromEntries(ids.map(id=>[id,n]));
