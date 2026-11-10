from pathlib import Path
import json,shutil,sys
root=Path(__file__).resolve().parents[1];sys.path.insert(0,str(root/'.art-tools'))
from PIL import Image,ImageOps,ImageDraw
p=root/'docs/ending-art-v1.json';d=json.loads(p.read_text(encoding='utf-8-sig'));out=root/'assets/endings/v1';out.mkdir(parents=True,exist_ok=True);raw=root/'docs/ending-originals-v1';raw.mkdir(exist_ok=True)
sheet=Image.new('RGB',(1280,1025),'#f6eee0')
for n,r in enumerate(d['images']):
 key=f"{r['id']}-{r['tier']}";destRaw=root/r.get('original',f'docs/ending-originals-v1/{key}.png');destRaw.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(r['source'],destRaw);im=Image.open(r['source']).convert('RGB');dest=root/r.get('asset',f'assets/endings/v1/{key}.webp');dest.parent.mkdir(parents=True,exist_ok=True);im.save(dest,'WEBP',quality=90,method=6)
 tile=Image.new('RGB',(320,205),'#f6eee0');tile.paste(ImageOps.pad(im,(320,180)),(0,25));ImageDraw.Draw(tile).text((8,7),key,fill='#302030');sheet.paste(tile,((n%4)*320,(n//4)*205))
 r['asset']=dest.relative_to(root).as_posix();r['original']=destRaw.relative_to(root).as_posix()
sheet.save(root/'docs/ending-contact-sheet-v1.jpg');p.write_text(json.dumps(d,ensure_ascii=False,indent=2),encoding='utf-8');print('20 new CGs saved')
