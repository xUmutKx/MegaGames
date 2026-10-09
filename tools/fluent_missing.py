import json, unicodedata, difflib
paths = json.load(open('/root/projects/MegaGames/tools/fluent_paths.json'))
names = [p.split('/')[1] for p in paths]
miss = "⏳⚪⚫✂️➗⭕🃏🅿️🌍🍕🎣🎯🎱🎾🏀🏂🏃🏍️🏒🏓🏚️🏮🏰🏴👁️💡💥📈🔍🔐🔡🔢🔦🔪🔫🕴️🗡️🚴🟦🥚🦇🧊🧙🧛🧩🐛🐜👽"
import re
seen = []
i = 0
chars = [c for c in miss if c != '️']
for c in chars:
    try:
        n = unicodedata.name(c).lower()
    except ValueError:
        n = '?'
    words = [w for w in re.split(r'[ \-]', n) if len(w) > 2]
    cand = [x for x in names if any(w in x for w in words)][:6]
    print(c, n, '->', cand)
