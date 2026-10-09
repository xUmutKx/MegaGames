import re, collections, json
text = open('/root/projects/MegaGames/app/src/main/assets/mega.html', encoding='utf-8').read()
nonascii = r'([^\x00-\x7f]{1,5})'
pats = [
    re.compile(r'icon\s*:\s*["\']' + nonascii + r'["\']'),
    re.compile(r'\[\s*["\'][\w\-]+["\']\s*,\s*["\'][^"\']+["\']\s*,\s*["\']' + nonascii + r'["\']\s*,\s*["\'][A-Za-z0-9 ]+["\']'),
    re.compile(r'\b[A-Za-z]\(\s*[\w"\']+\s*,\s*["\'][\w\-]+["\']\s*,\s*["\'][^"\']+["\']\s*,\s*["\']' + nonascii + r'["\']'),
]
cnt = collections.Counter()
for p in pats:
    for m in p.finditer(text):
        cnt[m.group(1)] += 1
print(len(cnt), sum(cnt.values()))
print(json.dumps(sorted(cnt), ensure_ascii=False))
json.dump(sorted(cnt), open('/root/projects/MegaGames/tools/emoji_used.json', 'w'), ensure_ascii=False)
