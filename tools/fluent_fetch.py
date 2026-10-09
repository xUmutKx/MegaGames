import json, subprocess, unicodedata, difflib, os, sys

used = json.load(open('/root/projects/MegaGames/tools/emoji_used.json', encoding='utf-8'))
paths = json.load(open('/root/projects/MegaGames/tools/fluent_paths.json'))
byname = {p.split('/')[1].lower(): p for p in paths}
names = list(byname)
OUT = '/root/projects/MegaGames/app/src/main/assets/emoji'
os.makedirs(OUT, exist_ok=True)

OVERRIDE = {'🐈‍⬛': 'black cat', '👩‍🚀': 'woman astronaut', '⚡': 'high voltage', '⛏️': 'pick', '🎛️': 'control knobs',
            '🅿️': 'p button', '🔲': 'black square button', '🔳': 'white square button', '🟦': 'blue square',
            '🟪': 'purple square', '🟢': 'green circle', '🔴': 'red circle', '⚪': 'white circle', '⚫': 'black circle',
            '⭕': 'hollow red circle', '➗': 'divide', '❌': 'cross mark', '✂️': 'scissors', '🕴️': 'person in suit levitating',
            '🛣️': 'motorway', '🗺️': 'world map', '🔓': 'unlocked', '🔐': 'locked with key', '🔡': 'input latin lowercase',
            '🔤': 'input latin letters', '🔢': 'input numbers', '🕳️': 'hole', '👁️': 'eye', '🏴': 'black flag',
            '🥅': 'goal net', '🏎️': 'racing car', '🏍️': 'motorcycle', '⛷️': 'skier', '🏂': 'snowboarder',
            '⏳': 'hourglass not done', '🃏': 'joker', '🌍': 'globe showing europe-africa', '🎣': 'fishing pole', '🎯': 'bullseye',
            '🎱': 'pool 8 ball', '🎾': 'tennis', '🏀': 'basketball', '🏃': 'person running', '🏒': 'ice hockey', '🏓': 'ping pong',
            '🏰': 'castle', '💡': 'light bulb', '💥': 'collision', '📈': 'chart increasing', '🔍': 'magnifying glass tilted left',
            '🔦': 'flashlight', '🔪': 'kitchen knife', '🔫': 'water pistol', '🗡️': 'dagger', '🚴': 'person biking', '🧊': 'ice',
            '🧛': 'vampire', '🧙': 'mage', '👽': 'alien', '🐛': 'bug', '🐜': 'ant', '🦇': 'bat', '🥚': 'egg', '🧩': 'puzzle piece',
            '🍕': 'pizza', '🏮': 'red paper lantern', '🏚️': 'derelict house'}

OVERRIDE.update({'🧙': 'person mage', '🧛': 'person vampire', '🏃': 'person running', '🏂': 'snowboarder', '👩‍🚀': 'woman astronaut',
                 '🕴️': 'person in suit levitating', '🚴': 'person biking'})
OVERRIDE.update({'⭐': 'star', '🐸': 'frog', '🔓': 'unlocked', '🔴': 'red circle', '🤖': 'robot', '🦁': 'lion', '🦊': 'fox',
                 '🧠': 'brain', '👯': 'people with bunny ears', '🧟': 'person zombie'})
for stale in ('1f9d9', '1f6b4', '2b50', '1f438', '1f513', '1f534', '1f916', '1f981', '1f98a', '1f9e0', '1f46f', '1f9df'):  # earlier fuzzy matches picked the wrong picture
    try: os.remove('%s/%s.png' % (OUT, stale))
    except OSError: pass

def code(e):
    return '-'.join('%x' % ord(c) for c in e if c != '️')

def guess(e):
    if e in OVERRIDE and OVERRIDE[e] in byname:
        return OVERRIDE[e]
    base = [c for c in e if c != '️' and c != '‍']
    try:
        n = unicodedata.name(base[0]).lower()
    except ValueError:
        return None
    if n in byname:
        return n
    m = difflib.get_close_matches(n, names, n=1, cutoff=0.72)
    return m[0] if m else None

missing = []
for e in used:
    n = guess(e)
    f = '%s/%s.png' % (OUT, code(e))
    if n is None:
        missing.append(e); continue
    if os.path.exists(f):
        continue
    b = subprocess.run(['gh', 'api', 'repos/microsoft/fluentui-emoji/contents/' + byname[n].replace(' ', '%20'), '-H', 'Accept: application/vnd.github.raw'], capture_output=True)
    if b.returncode == 0 and b.stdout[:4] == b'\x89PNG':
        open(f, 'wb').write(b.stdout)
        print('ok', e, n, len(b.stdout), flush=True)
    else:
        print('FAIL', e, n, b.stderr[:100], flush=True)
        missing.append(e)
print('missing:', ''.join(missing))
