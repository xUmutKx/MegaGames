import re
P = '/sdcard/Download/projects/MegaGames/app/src/main/assets/mega.html'
html = open(P, encoding='utf-8').read()
new = open('/sdcard/Download/projects/MegaGames/tools/new_gravity.js', encoding='utf-8').read()

if 'const Gravity=' in html:
    raise SystemExit('already spliced')

marker = '/* ============ HUB UI ============ */'
assert html.count(marker) == 1
html = html.replace(marker, new + marker)

# Hub catalogue: add after the last AAA entry (Bastion).
m = re.search(r'\{id:"bastion",[^\n]*?\}(?=\n\])', html)
assert m, 'bastion entry not found'
entry = m.group(0)
add = ',\n{id:"gravity",icon:"🌀",title:"Gravity Flip",tag:"ARCADE • ONE TAP",desc:"Tap to flip gravity, dodge the spikes and grab the gold."}'
html = html.replace(entry, entry + add, 1)

old_map = 'key==="bastion"?Bastion:NeonFighter'
assert html.count(old_map) == 2, html.count(old_map)
html = html.replace(old_map, 'key==="bastion"?Bastion:key==="gravity"?Gravity:NeonFighter')

open(P, 'w', encoding='utf-8').write(html)
print('spliced', len(html))
