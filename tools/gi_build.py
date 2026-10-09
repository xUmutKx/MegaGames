"""Download the mapped game-icons.net SVGs (CC BY 3.0) and write them as Android vector drawables
(res/drawable/gi_<n>.xml) + assets/gi_map.json (emoji -> drawable name)."""
import json, re, subprocess, os
T = '/sdcard/Download/projects/MegaGames/'
m = json.load(open(T + 'tools/gi_map.json'))
D = T + 'app/src/main/res/drawable/'
cache = T + 'tools/gi_cache/'
os.makedirs(cache, exist_ok=True)
names = {}
ok = 0
for i, (emoji, path) in enumerate(sorted(m.items())):
    cp = cache + path.replace('/', '__')
    if not os.path.exists(cp):
        r = subprocess.run(['gh', 'api', 'repos/game-icons/icons/contents/' + path, '-H', 'Accept: application/vnd.github.raw'], capture_output=True, text=True)
        if r.returncode != 0 or '<svg' not in r.stdout:
            print('FAIL', emoji, path, r.stderr[:80]); continue
        open(cp, 'w').write(r.stdout)
    svg = open(cp).read()
    ds = re.findall(r'<path[^>]*?\bd="([^"]+)"', svg)
    ds = [d for d in ds if d.replace(' ', '') != 'M0 0h512v512H0z']
    if not ds: print('EMPTY', emoji, path); continue
    name = 'gi_' + re.sub(r'[^a-z0-9]', '_', path.split('/')[1][:-4].lower())
    body = ''.join('    <path android:fillColor="#FFFFFFFF" android:pathData="%s"/>\n' % d for d in ds)
    open(D + name + '.xml', 'w').write(
        '<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="96dp" android:height="96dp" '
        'android:viewportWidth="512" android:viewportHeight="512">\n' + body + '</vector>\n')
    names[emoji] = name; ok += 1
json.dump(names, open(T + 'app/src/main/assets/gi_map.json', 'w'), ensure_ascii=False)
print('written', ok, 'of', len(m))
