import os, shutil, time

ROOT = '/sdcard/Download/projects/MegaGames'
P = ROOT + '/app/src/main/assets/mega.html'
D = ROOT + '/tools/games20'
LOGS = '/sdcard/Download/projects/_logs'
MARK = '/* ============ HUB UI ============ */'
GRAVITY_LINE_START = '{id:"gravity",icon:"\U0001F300"'

# (file id, JS const name, hub icon, title, tag, description)
GAMES = [
 ('bubblewrap', 'BubbleWrap', '\U0001F518', 'Bubble Wrap Pop', 'RELAX • POP', 'Pop every bubble on the sheet. It refills when you are done.'),
 ('sandgarden', 'SandGarden', '\U0001F3D6️', 'Sand Garden', 'RELAX • RAKE', 'Place stones and watch the raked lines bend around them.'),
 ('fidget', 'FidgetSpin', '\U0001F504', 'Fidget Spinner', 'RELAX • SPIN', 'Tap left or right to set the spinner turning.'),
 ('slime', 'SlimeStretch', '\U0001F7E2', 'Slime Stretch', 'RELAX • SQUISH', 'Poke the slime and watch it stretch and wobble back.'),
 ('zenripple', 'ZenRipple', '\U0001F4A7', 'Zen Ripple', 'RELAX • WATER', 'Drop stones into still water and watch the rings spread.'),
 ('kinetic', 'KineticSand', '⏳', 'Kinetic Sand', 'RELAX • SHAPE', 'Touch the sand to lift it, then let it fall and pile up.'),
 ('stickyball', 'StickyDrop', '\U0001F534', 'Sticky Drop', 'RELAX • STACK', 'Drop sticky balls onto the pile and build a tower.'),
 ('pottery', 'PotteryWheel', '\U0001F3FA', 'Pottery Wheel', 'RELAX • SHAPE', 'Touch the clay wall to push it into shape as the wheel turns.'),
 ('inkwater', 'InkWater', '\U0001F58B️', 'Ink in Water', 'RELAX • SWIRL', 'Drop ink into water and watch it swirl and spread.'),
 ('marblerun', 'MarbleRun', '⚪', 'Marble Run', 'RELAX • ROLL', 'Drop marbles from the top and watch them roll down the ramps.'),
 ('popcorn', 'PopcornPop', '\U0001F37F', 'Popcorn Pop', 'RELAX • HEAT', 'Warm the kernels by tapping near them until they pop.'),
 ('balloon', 'BalloonFloat', '\U0001F388', 'Balloon Float', 'RELAX • FLOAT', 'Release balloons and lift the ones drifting by.'),
 ('paintmix', 'PaintMix', '\U0001F3A8', 'Paint Mixing', 'RELAX • COLOUR', 'Drop paint and watch the colours blend where they meet.'),
 ('windchimes', 'WindChimes', '\U0001F390', 'Wind Chimes', 'RELAX • SOUND', 'Blow a gust across the chimes and listen to them ring.'),
 ('soapbubbles', 'SoapBubbles', '\U0001F9FC', 'Soap Bubbles', 'RELAX • FLOAT', 'Blow bubbles, then pop them with a tap for a little spark.'),
 ('snowglobe', 'SnowGlobe', '❄️', 'Snow Globe', 'RELAX • SHAKE', 'Shake the globe and watch the snow settle again.'),
 ('koipond', 'KoiPond', '\U0001F41F', 'Koi Pond', 'RELAX • FEED', 'Drop food on the pond and watch the koi come to feed.'),
 ('rainwindow', 'RainWindow', '\U0001F327️', 'Rain Window', 'RELAX • WIPE', 'Wipe the fogged glass clear and watch the rain behind it.'),
 ('ballpit', 'BallPit', '\U0001F7E3', 'Ball Pit', 'RELAX • STIR', 'Stir the colourful balls and drop new ones into the pit.'),
 ('lavalamp', 'LavaLamp', '\U0001F30B', 'Lava Lamp', 'RELAX • GLOW', 'Heat the blobs and watch them rise and sink slowly.'),
]

html = open(P, encoding='utf-8').read()
first = GAMES[0][1]
if ('const %s={' % first) in html:
    print('already spliced; nothing to do')
    raise SystemExit(0)

assert html.count(MARK) == 1, 'hub marker not found once'

# back up before touching the real file
os.makedirs(LOGS, exist_ok=True)
bak = LOGS + '/mega.html.games20-' + time.strftime('%Y%m%d%H%M%S') + '.bak'
shutil.copy2(P, bak)
print('backup', bak)

modules = []
for fid, name, *_ in GAMES:
    src = open(os.path.join(D, fid + '.js'), encoding='utf-8').read().rstrip() + '\n'
    assert ('const %s={' % name) in src, fid
    modules.append(src)
html = html.replace(MARK, '\n'.join(modules) + MARK)

# hub entries after the gravity entry (AAA list)
start = html.index(GRAVITY_LINE_START)
end = html.index('\n', start)
grav = html[start:end]
assert grav.endswith('}'), 'gravity entry shape changed'
assert html.count(GRAVITY_LINE_START) == 1
entries = ',\n'.join(
    '{id:"%s",icon:"%s",title:"%s",tag:"%s",desc:"%s"}' % (fid, icon, title, tag, desc)
    for fid, name, icon, title, tag, desc in GAMES)
html = html[:end] + ',\n' + entries + html[end:]

# key mapping in both module lookups
old_map = 'key==="gravity"?Gravity:'
assert html.count(old_map) == 2, html.count(old_map)
chain = ''.join('key==="%s"?%s:' % (fid, name) for fid, name, *_ in GAMES)
html = html.replace(old_map, old_map + chain)

open(P, 'w', encoding='utf-8').write(html)
print('spliced', len(GAMES), 'games; size', len(html))
