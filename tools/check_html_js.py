import re, subprocess, tempfile, os
html = open('/root/projects/MegaGames/app/src/main/assets/mega.html', encoding='utf-8').read()
scripts = re.findall(r'<script(?![^>]*src=)[^>]*>(.*?)</script>', html, re.S)
print(len(scripts), 'scripts')
bad = 0
for i, s in enumerate(scripts):
    f = '/root/projects/MegaGames/tools/_chk_%d.js' % i
    open(f, 'w', encoding='utf-8').write(s)
    r = subprocess.run(['node', '--check', f], capture_output=True, text=True)
    if r.returncode:
        bad += 1
        print('script', i, 'FAILED', r.stderr[:600])
    os.remove(f)
print('bad:', bad)
