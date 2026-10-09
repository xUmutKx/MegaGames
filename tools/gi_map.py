"""emoji -> game-icons.net slug candidates (first existing one wins). Prints misses."""
import json
paths = json.load(open('/sdcard/Download/projects/MegaGames/tools/gi_paths.json'))
bySlug = {}
for p in paths:
    bySlug.setdefault(p.split('/')[1][:-4], p)

M = {
 '⏱️': ['stopwatch', 'sands-of-time'], '⏳': ['sands-of-time', 'hourglass'], '☄️': ['meteor-impact', 'comet-spark', 'falling-star'],
 '☕': ['coffee-cup', 'coffee-mug', 'hot-meal'], '☢️': ['radioactive', 'nuclear-bomb'], '⚔️': ['crossed-swords', 'broadsword'],
 '⚗️': ['round-bottom-flask', 'potion-ball', 'erlenmeyer'], '⚡': ['lightning-bolt', 'lightning-helix', 'power-lightning'],
 '⚪': ['circle', 'plain-circle'], '⚫': ['black-ball', 'plain-circle'], '⚽': ['soccer-ball', 'soccer-kick'], '⚾': ['baseball-bat', 'baseball-glove'],
 '⛄': ['snowman'], '⛏️': ['pickaxe', 'mining'], '⛰️': ['mountains', 'mountaintop'], '⛳': ['golf-flag', 'golf-tee'], '⛷️': ['skier', 'skis'],
 '✂️': ['scissors', 'scissors-rock-paper'], '✈️': ['airplane', 'plane-wing', 'jet-fighter'], '✨': ['sparkles', 'sparkling-sabre', 'magic-swirl'],
 '❄️': ['snowflake-1', 'snowflake-2', 'snowflake'], '❌': ['cancel', 'crossed-bones'], '➗': ['divide', 'abacus'], '⭐': ['star-formation', 'star-medal', 'rank-3'],
 '⭕': ['ring', 'circle'], '🃏': ['joker', 'card-joker', 'card-random'], '🅿️': ['parking', 'car-key'], '🌀': ['spiral-arrow', 'maze', 'tornado'], '🌈': ['rainbow', 'rainbow-star'],
 '🌊': ['tidal-wave', 'waves', 'wave-crest'], '🌋': ['volcano'], '🌌': ['milky-way', 'galaxy', 'spiral-galaxy'], '🌍': ['earth-africa-europe', 'earth-america', 'globe'],
 '🌙': ['moon', 'crescent-moon', 'new-moon'], '🌳': ['oak', 'forest', 'pine-tree'], '🌾': ['wheat', 'barley'], '🍄': ['mushroom', 'mushroom-gills'],
 '🍉': ['watermelon-slice', 'watermelon'], '🍋': ['lemon', 'citrus-slice'], '🍎': ['apple-core', 'shiny-apple', 'apple'], '🍔': ['hamburger'],
 '🍕': ['pizza-slice', 'slice-of-pizza'], '🍖': ['meat', 'ham-shank', 'meat-cleaver'], '🍣': ['sushis', 'sushi'], '🍪': ['cookie', 'biscuit'],
 '🍬': ['candy', 'wrapped-sweet'], '🍭': ['spiral-lollipop', 'lollipop', 'candy'], '🍲': ['cooking-pot', 'stew', 'hot-meal'], '🍿': ['popcorn'], '🎂': ['birthday-cake', 'cake-slice'],
 '🎃': ['halloween-pumpkin', 'pumpkin-lantern'], '🎈': ['balloons', 'hot-air-balloon'], '🎉': ['party-popper', 'confetti', 'party-flags'],
 '🎛️': ['sound-on', 'dj-network', 'mixer'], '🎡': ['cog', 'ferris-wheel', 'roulette'], '🎣': ['fishing-pole', 'fishing-hook'], '🎨': ['paint-brush', 'palette', 'paint-bucket'],
 '🎯': ['bullseye', 'target-arrows', 'dart'], '🎰': ['pokerchip', 'slot-machine', 'pinball'], '🎱': ['pool-table-corner', 'eight-ball', 'billiards'],
 '🎲': ['perspective-dice-six-faces-random', 'dice-six-faces-six', 'rolling-dices'], '🎳': ['bowling-pin', 'bowling-propulsion'], '🎵': ['musical-notes', 'music-spell'],
 '🎹': ['piano-keys', 'musical-keyboard'], '🎾': ['tennis-ball', 'tennis-racket'], '🏀': ['basketball-ball', 'basketball-basket', 'basketball'],
 '🏂': ['snowboard', 'skier', 'skis'], '🏃': ['run', 'running-ninja', 'sprint'], '🏅': ['medal', 'laurel-crown', 'rank-1'], '🏍️': ['full-motorcycle-helmet', 'motorcycle', 'racing-car'],
 '🏎️': ['race-car', 'racing-car', 'sports-car', 'car'], '🏒': ['ice-hockey', 'hockey-stick', 'ice-skate'], '🏓': ['ping-pong-bat', 'ping-pong', 'table-tennis'], '🏗️': ['crane', 'construction'],
 '🏚️': ['castle-ruins', 'ruined-castle', 'burning-building', 'cabin'], '🏛️': ['greek-temple', 'parthenon', 'column'], '🏜️': ['desert', 'cactus', 'sun-desert'], '🏡': ['house', 'cottage', 'village'],
 '🏭': ['factory', 'smokestack', 'industrial-gear'], '🏮': ['lantern-flame', 'chinese-lantern', 'lantern'], '🏰': ['castle', 'medieval-city'], '🏴': ['pirate-flag', 'flying-flag', 'flag'],
 '🏹': ['bow-arrow', 'high-shot', 'archer'], '🐇': ['rabbit', 'rabbit-head'], '🐈‍⬛': ['cat', 'black-cat', 'cat-outline'], '🐉': ['dragon-head', 'dragon-breath', 'sea-dragon'],
 '🐍': ['snake', 'cobra', 'snake-bite'], '🐎': ['horse-head', 'galloping-horse', 'horseshoe'], '🐔': ['rooster', 'chicken', 'hen'], '🐗': ['boar', 'boar-tusks'],
 '🐛': ['caterpillar', 'worm-mouth', 'worms'], '🐜': ['ant', 'ant-head'], '🐟': ['clownfish', 'fish', 'sea-fish'], '🐢': ['turtle', 'tortoise'], '🐤': ['chick', 'duck-head', 'bird-twitter'],
 '🐥': ['chick', 'bird-house'], '🐦': ['bird-limb', 'dove', 'bird-twitter'], '🐧': ['penguin', 'penguin-head'], '🐰': ['rabbit', 'rabbit-head'], '🐱': ['cat', 'tiger-head'],
 '🐸': ['frog', 'frog-prince'], '🐿️': ['squirrel'], '👁️': ['eye-target', 'eye', 'third-eye'], '👑': ['crown', 'king'], '👤': ['person', 'pawn', 'man-in-the-box'],
 '👩‍🚀': ['astronaut-helmet', 'astronaut'], '👯': ['dancer', 'woman-elf-face', 'person'], '👻': ['ghost', 'floating-ghost'], '👽': ['alien-skull', 'alien-bug', 'alien-stare'],
 '👾': ['alien-bug', 'space-invader', 'alien-fire'], '💎': ['gem-pendant', 'diamond', 'cut-diamond'], '💡': ['light-bulb', 'bulb'], '💣': ['bomb', 'time-bomb'],
 '💥': ['explosion-rays', 'explosive-materials', 'impact-point'], '💰': ['two-coins', 'money-stack', 'coins', 'cash'], '📈': ['stairs-goal', 'growth', 'chart'], '📏': ['ruler', 'measure-tape'],
 '📦': ['wooden-crate', 'crate', 'cardboard-box'], '🔍': ['magnifying-glass', 'magnifying-glass-1'], '🔐': ['padlock', 'locked-box'], '🔓': ['padlock-open', 'unlocking'],
 '🔡': ['abc', 'spell-book'], '🔢': ['abacus', 'calculator', 'perspective-dice-six-faces-three'], '🔤': ['abc', 'spell-book', 'book-cover'], '🔦': ['flashlight', 'torch'],
 '🔧': ['wrench', 'spanner'], '🔨': ['hammer', 'claw-hammer', 'warhammer'], '🔪': ['meat-cleaver', 'kitchen-knives', 'chef-toque'], '🔫': ['revolver', 'pistol-gun', 'ray-gun'],
 '🔬': ['microscope'], '🔮': ['crystal-ball', 'crystal-shine'], '🔲': ['perspective-dice-six', 'checkered-flag', 'rubiks-cube'], '🔳': ['rubiks-cube', 'tic-tac-toe'], '🔴': ['ball', 'red-carpet'],
 '🕳️': ['hole', 'sinkhole'], '🕴️': ['spy', 'suspicious', 'person'], '🗡️': ['broadsword', 'dagger', 'sword-in-stone'], '🗺️': ['treasure-map', 'world', 'map'], '🗼': ['tower-bridge', 'tall-bridge', 'lighthouse'],
 '🚀': ['rocket', 'rocket-flight', 'missile-launcher'], '🚗': ['race-car', 'car', 'sports-car', 'pick-up-truck'], '🚚': ['delivery-drone', 'truck', 'tipper-truck', 'pick-up-truck'], '🚢': ['battleship', 'ship-bow', 'galleon'],
 '🚤': ['submarine', 'speedboat', 'sailboat'], '🚦': ['traffic-lights-ready-to-go', 'traffic-lights', 'traffic-light'], '🚴': ['bmx', 'bicycle', 'cycling'], '🛡️': ['shield', 'checked-shield', 'round-shield'], '🛣️': ['road', 'sunrise', 'straight-road'],
 '🛫': ['plane-departure', 'airplane-departure', 'jet-fighter'], '🛰️': ['satellite', 'sputnik'], '🛸': ['ufo', 'flying-saucer', 'ufo-1'], '🟢': ['plain-circle', 'circle'], '🟦': ['square', 'perspective-dice-six'], '🟪': ['square'],
 '🤖': ['robot-golem', 'robot-antennas', 'android-mask'], '🤿': ['diving-helmet', 'scuba-tanks', 'scuba-mask'], '🥅': ['soccer-field', 'goal-keeper', 'soccer-kick'], '🥊': ['boxing-glove', 'punch'], '🥚': ['big-egg', 'egg', 'spotted-egg'],
 '🥛': ['milk-carton', 'glass-of-milk', 'water-bottle'], '🥞': ['pancake', 'cake-slice'], '🦁': ['lion', 'lion-head'], '🦆': ['duck', 'duck-head', 'mallard'], '🦇': ['bat', 'vampire-bat'], '🦊': ['fox-head', 'fox'],
 '🦖': ['t-rex-skull', 't-rex', 'dinosaur-rex'], '🦘': ['kangaroo'], '🦠': ['virus', 'bacteria', 'germ'], '🦾': ['mechanical-arm', 'robot-arm', 'bionic-arm'], '🧀': ['cheese-wedge', 'cheese'], '🧊': ['ice-cube', 'ice-bolt'],
 '🧋': ['bubble-tea', 'coffee-cup'], '🧙': ['wizard-face', 'wizard-staff', 'witch-face'], '🧛': ['vampire-dracula', 'vampire-cape', 'fangs'], '🧟': ['shambling-zombie', 'zombie-head', 'zeus-sword'], '🧠': ['brain', 'brainstorm'],
 '🧩': ['jigsaw-piece', 'puzzle'], '🧪': ['test-tubes', 'chemical-drop', 'potion-ball'], '🧫': ['virus', 'petri-dish', 'bacteria'], '🧮': ['abacus'], '🧱': ['brick-wall', 'stone-wall', 'brick-pile'], '🧲': ['magnet', 'horseshoe'],
 '🧸': ['bear-head', 'teddy-bear', 'teddy'], '🪂': ['parachute', 'parachute-slow'], '🪐': ['ringed-planet', 'saturn', 'planet-core'], '🪖': ['military-fort', 'combat-helmet', 'army-helmet', 'helmet'], '🪜': ['ladder', 'rope-ladder'],
 '🪨': ['stone-block', 'rock', 'stone-pile', 'boulder'], '🪲': ['scarab-beetle', 'ladybug', 'beetle'], '🪼': ['jellyfish'], '🫧': ['bubbles', 'bubbling-beam', 'soap-bubble'],
}
out = {}
miss = []
for e, cands in M.items():
    hit = next((bySlug[c] for c in cands if c in bySlug), None)
    if hit: out[e] = hit
    else: miss.append((e, cands))
print(len(out), 'mapped;', len(miss), 'missing')
for e, c in miss: print(e, c)
json.dump(out, open('/sdcard/Download/projects/MegaGames/tools/gi_map.json', 'w'), ensure_ascii=False, indent=0)
