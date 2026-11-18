"""Manual export. Private source never copied into the website."""
import json, sqlite3, pathlib, re, collections
ROOT=pathlib.Path(__file__).resolve().parents[1]
SOURCE=pathlib.Path('D:/приложение')
def norm(s): return re.sub(r'[\s.\-_/]', '', s.lower().replace('ё','е'))
def write(p,v):
 p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(v,ensure_ascii=False,separators=(',',':')),encoding='utf8')
def main():
 pointer=json.loads((SOURCE/'catalog-current.json').read_text('utf8'))
 source=(SOURCE/pointer['path']).resolve()
 if not source.is_relative_to((SOURCE/'catalog-versions').resolve()): raise ValueError('Invalid source')
 db=sqlite3.connect(source.as_uri()+'?mode=ro',uri=True)
 # Only these two columns may leave the private application.
 rows=db.execute("SELECT DISTINCT COALESCE(article,''),name FROM parts WHERE name IS NOT NULL AND name<>'' ORDER BY article,name")
 out=ROOT/'assets/catalog'; index=collections.defaultdict(list);exact=collections.defaultdict(dict)
 count=0;chunk=[]
 for article,name in rows:
  article=str(article).strip();name=str(name).strip()
  if not name:continue
  ident=count;count+=1;chunk.append([article,name])
  a=norm(article)
  keys={a[:3]} if len(a)>=3 else set()
  keys.update(norm(t)[:3] for t in re.findall(r'[\w./-]+',name.lower().replace('ё','е')) if len(norm(t))>=3)
  for key in keys:index[key].append(ident)
  if a:
   bucket=sum(ord(c) for c in a)%256
   exact[bucket].setdefault(a,[]).append(ident)
  if len(chunk)==1000:write(out/'rows'/f'{ident//1000}.json',chunk);chunk=[]
 if chunk:write(out/'rows'/f'{(count-1)//1000}.json',chunk)
 for key,ids in index.items():write(out/'index'/(''.join(f'{ord(c):04x}' for c in key)+'.json'),ids)
 for bucket,values in exact.items():write(out/'exact'/f'{bucket}.json',values)
 import datetime
 write(out/'meta.json',{'count':count,'updated':datetime.date.today().isoformat(),'chunkSize':1000})
 db.close();print(json.dumps({'positions':count,'indexFiles':len(index),'bytes':sum(p.stat().st_size for p in out.rglob('*.json'))}))
if __name__=='__main__':main()
