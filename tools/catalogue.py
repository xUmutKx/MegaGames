import re, collections, json
t = open('/root/projects/MegaGames/app/src/main/assets/mega.html', encoding='utf-8').read()
items = []
for m in re.finditer(r'\{\s*id:\s*["\']([^"\']+)["\']\s*,\s*title:\s*["\']([^"\']+)["\']\s*,\s*icon:\s*["\']([^"\']+)["\']\s*,\s*cat:\s*["\']([^"\']+)["\']\s*,\s*desc:\s*["\']([^"\']*)["\']\s*,\s*engine:\s*["\']([^"\']+)["\']', t):
    items.append(dict(id=m.group(1), title=m.group(2), icon=m.group(3), cat=m.group(4), desc=m.group(5)[:90], engine=m.group(6)))
for m in re.finditer(r'\[\s*["\']([\w\-]+)["\']\s*,\s*["\']([^"\']+)["\']\s*,\s*["\']([^"\x00-\x7f]{1,5})["\']\s*,\s*["\']([A-Za-z ]+)["\']\s*,\s*["\']([^"\']*)["\']', t):
    items.append(dict(id=m.group(1), title=m.group(2), icon=m.group(3), cat=m.group(4), desc=m.group(5)[:90], engine='(table)'))
seen = {}
for i in items:
    seen.setdefault(i['id'], i)
items = list(seen.values())
cnt = collections.Counter(i['cat'] for i in items)
print(len(items), cnt.most_common())
eng = collections.Counter(i['engine'] for i in items)
print(eng.most_common(60))
json.dump(items, open('/root/projects/MegaGames/tools/catalogue.json', 'w'), ensure_ascii=False, indent=0)
