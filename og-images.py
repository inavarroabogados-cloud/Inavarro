from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json
serif='/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf'
sans='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
def make(title,out):
    im=Image.new('RGB',(1200,630),'#18283e');d=ImageDraw.Draw(im)
    logo=Image.open('assets/marca.png').convert('RGBA');logo.thumbnail((96,96));im.paste(logo,(62,46),logo)
    d.text((182,57),'iNavarro Abogados',font=ImageFont.truetype(serif,44),fill='#f5f3ed')
    d.text((184,113),'TENERIFE · IMANOL NAVARRO PÉREZ',font=ImageFont.truetype(sans,19),fill='#c1cad6')
    d.line((64,180,1136,180),fill='#607692',width=2)
    lines=[];font=ImageFont.truetype(serif,48)
    for word in title.split():
        if not lines or d.textlength(lines[-1]+' '+word,font=font)>1060:lines.append(word)
        else:lines[-1]+=' '+word
    for i,line in enumerate(lines):d.text((64,228+i*65),line,font=font,fill='#f5f3ed')
    d.text((64,565),'SERVICIOS JURÍDICOS · ACTUALIDAD · ICATF 6738',font=ImageFont.truetype(sans,21),fill='#c1cad6')
    Path(out).parent.mkdir(parents=True,exist_ok=True);im.save(out,optimize=True)
make('Asesoramiento jurídico en Santa Cruz de Tenerife','dist/og-default.png')
for p in json.loads(Path('posts.json').read_text()):make(p['title'],'dist/noticias/'+p['slug']+'/og.png')
print('3 vistas sociales PNG generadas')
