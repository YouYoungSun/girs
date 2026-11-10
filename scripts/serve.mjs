import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = resolve(process.argv.includes('--dist') ? 'dist' : '.');
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png', '.webp':'image/webp', '.json':'application/json' };
const server=createServer(async(req,res)=>{
  try {
    let path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
    if(path!==root&&!path.startsWith(root+sep)){res.writeHead(403).end();return;}
    if(path===root)path=resolve(root,'index.html');
    if(!types[extname(path)]){res.writeHead(404).end();return;}
    const data=await readFile(path);res.writeHead(200,{'Content-Type':types[extname(path)],'Cache-Control':'no-store'});res.end(data);
  }catch{res.writeHead(404).end('Not found');}
});
server.listen(Number(process.env.PORT||3001),'0.0.0.0',()=>console.log(`여름의 마지막 페이지 http://localhost:${server.address().port}`));
