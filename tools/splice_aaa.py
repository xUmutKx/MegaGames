import re
P = '/root/projects/MegaGames/app/src/main/assets/mega.html'
html = open(P, encoding='utf-8').read()
new = open('/root/projects/MegaGames/tools/new_aaa.js', encoding='utf-8').read()

if 'const Horde=' in html:
    raise SystemExit('already spliced')

marker = '/* ============ HUB UI ============ */'
assert html.count(marker) == 1
html = html.replace(marker, new + '\n' + marker)

old_last = '{id:"fighter",icon:"🚀",title:"Neon Fighter 2D",tag:"AAA • SHOOTER",desc:"Wave shooter with powerups and bosses."}'
assert html.count(old_last) == 1
add = (',\n{id:"horde",icon:"🧟",title:"Horde Survivors",tag:"AAA • ACTION ROGUELITE",desc:"Survive endless hordes: auto-fire weapons, level-up cards, orbiting blades, chain lightning and titan bosses."}'
       ',\n{id:"bastion",icon:"🛡️",title:"Bastion Defense",tag:"AAA • TOWER DEFENSE",desc:"Build and upgrade archer, cannon, frost and tesla towers across 25 waves with boss fights."}')
html = html.replace(old_last, old_last + add)

old_map = 'key==="spellmerge"?SpellMerge:NeonFighter;'
assert html.count(old_map) == 2
html = html.replace(old_map, 'key==="spellmerge"?SpellMerge:key==="horde"?Horde:key==="bastion"?Bastion:NeonFighter;')

open(P, 'w', encoding='utf-8').write(html)
print('spliced', len(html))
