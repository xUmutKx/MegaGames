p = '/sdcard/Download/projects/MegaGames/tools/gi_map.py'
s = open(p, encoding='utf-8').read()
add = {"'🍭': [": "'spiral-lollipop', ", "'🎡': [": "'cog', ", "'🏍️': [": "'full-motorcycle-helmet', ", "'🏎️': [": "'race-car', ",
       "'🏓': [": "'ping-pong-bat', ", "'🏚️': [": "'castle-ruins', ", "'🐟': [": "'clownfish', ", "'🚗': [": "'race-car', ",
       "'🚦': [": "'traffic-lights-ready-to-go', ", "'🥚': [": "'big-egg', ", "'🧫': [": "'virus', ", "'🧸': [": "'bear-head', "}
for k, v in add.items():
    assert k in s, k
    s = s.replace(k, k + v, 1)
open(p, 'w', encoding='utf-8').write(s)
