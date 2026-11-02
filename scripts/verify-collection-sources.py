"""Fetch official active sources and verify cited article presence; not a human legal review."""
import concurrent.futures, datetime, hashlib, html.parser, json, pathlib, re, urllib.request
ROOT=pathlib.Path(__file__).resolve().parents[1]
PUBLIC=ROOT/'web/coleccion-juridica'; OUT=ROOT/'docs/coleccion'; CACHE=pathlib.Path('/tmp/collection-laws'); CACHE.mkdir(exist_ok=True)
catalog=json.loads((PUBLIC/'catalog.json').read_text()); today=datetime.date.today().isoformat()
class Text(html.parser.HTMLParser):
 def __init__(self):super().__init__();self.parts=[]
 def handle_data(self,data):self.parts.append(data)
def fetch(item):
 key,source=item
 with urllib.request.urlopen(source['url'],timeout=50) as response:data=response.read();status=response.status
 assert status==200 and len(data)>10000,(key,status,len(data))
 (CACHE/(key+'.html')).write_bytes(data);parser=Text();parser.feed(data.decode());text=re.sub(r'\s+',' ',' '.join(parser.parts));(CACHE/(key+'.txt')).write_text(text)
 return {'id':key,'url':source['url'],'checkedAt':today,'status':status,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()},text
results=list(concurrent.futures.ThreadPoolExecutor(max_workers=6).map(fetch,catalog['sources'].items()));manifest=[x[0] for x in results];texts={a['id']:text for a,text in results};report=[]
for meta in catalog['games']:
 game=json.loads((PUBLIC/'data'/(meta['slug']+'.json')).read_text())
 for q in game['questions']:
  refs=[]
  for ref in q['references']:
   source=ref['source'];text=texts[source]
   if ref['articles'].startswith('disposición'):
    assert re.search('Disposición adicional primera',text,re.I);refs.append({'source':source,'article':ref['articles'],'existsInOfficialText':True});continue
   for part in ref['articles'].split(','):
    part=part.strip();m=re.match(r'(\d+)–(\d+)',part);arts=list(range(int(m[1]),int(m[2])+1)) if m else [int(re.match(r'\d+',part)[0])]
    for art in arts:
     found=re.search(r'(?:Artículo|Art\.)\s+'+str(art)+r'(?:\s+bis)?(?:\.|\s)',text,re.I)
     if not found and source=='imagen':found=re.search('Artículo '+{2:'segundo',7:'séptimo'}.get(art,'INVALID'),text)
     assert found,(q['id'],source,art)
     refs.append({'source':source,'article':str(art),'existsInOfficialText':True})
  report.append({'case':q['id'],'verifiedDate':q['verifiedDate'],'territory':q['territory'],'humanReview':q['humanReview'],'references':refs})
OUT.mkdir(exist_ok=True);(OUT/'fuentes-verificadas.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n');(OUT/'articulos-comprobados.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(len(manifest),'fuentes oficiales descargadas;',len(report),'casos con artículos localizados. No acredita revisión jurídica humana.')
