from pathlib import Path
import json,shutil
from PIL import Image, ImageOps, ImageDraw
root=Path(__file__).resolve().parents[1]
data=json.loads((root/'docs/ending-art.json').read_text(encoding='utf-8-sig'))
out=root/'assets/endings'; originals=root/'docs/ending-originals'; originals.mkdir(exist_ok=True)
thumbs=[]
for item in data['images']:
 key=f"{item['id']}-{item['tier']}"
 source=Path(item['source']);shutil.copy2(source,originals/(key+'.png'))
 im=Image.open(source).convert('RGB');im.save(out/(key+'.webp'),'WEBP',quality=90,method=6)
 thumb=ImageOps.pad(im,(320,180)); card=Image.new('RGB',(320,205),'#f6eee0');card.paste(thumb,(0,25));ImageDraw.Draw(card).text((8,7),key,fill='#302030');thumbs.append(card)
 dataitem={k:v for k,v in item.items() if k!='hint'}
 item['original']=f'docs/ending-originals/{key}.png';item['asset']=f'assets/endings/{key}.webp'
canvas=Image.new('RGB',(1280,1230),'#f6eee0')
for i,thumb in enumerate(thumbs):canvas.paste(thumb,((i%4)*320,(i//4)*205))
canvas.save(root/'docs/ending-contact-sheet.jpg')
(root/'docs/ending-art.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
print(f'{len(thumbs)} ending images copied and encoded; {sum(p.stat().st_size for p in out.glob("*.webp"))//1024} KB total')
