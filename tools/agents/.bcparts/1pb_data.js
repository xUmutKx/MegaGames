  /* =================================================================
     POCKET BEASTS
     ================================================================= */
  const PT = { fire: { c: '#ff7a3d', e: '🔥' }, water: { c: '#4da3ff', e: '💧' }, leaf: { c: '#5fd36b', e: '🍃' }, spark: { c: '#ffd84a', e: '⚡' }, shadow: { c: '#9a6bd6', e: '🌙' }, norm: { c: '#b8b8c8', e: '⭐' } };
  const PEFF = { fire: { leaf: 2, shadow: 2, water: .5, fire: .5 }, water: { fire: 2, leaf: .5, water: .5 }, leaf: { water: 2, spark: 2, fire: .5, leaf: .5, shadow: .5 }, spark: { water: 2, leaf: .5, spark: .5, shadow: .5 }, shadow: { spark: 2, leaf: 2, shadow: .5, fire: .5 }, norm: {} };
  function effOf(a, d) { return (PEFF[a] && PEFF[a][d]) || 1; }
  const PM = {
    tackle: { n: 'Tackle', t: 'norm', p: 40, pp: 35, a: 100 }, quick: { n: 'Quick Dash', t: 'norm', p: 35, pp: 30, a: 100, pri: 1 },
    slam: { n: 'Body Slam', t: 'norm', p: 70, pp: 15, a: 95, st: ['par', .25] }, glare: { n: 'Glare', t: 'norm', p: 0, pp: 25, a: 100, sk: ['atk', -1, 0] },
    brace: { n: 'Brace Up', t: 'norm', p: 0, pp: 25, a: 100, sk: ['def', 1, 1] },
    ember: { n: 'Ember', t: 'fire', p: 40, pp: 25, a: 100, st: ['brn', .12] }, flare: { n: 'Flare Burst', t: 'fire', p: 75, pp: 10, a: 90, st: ['brn', .25] }, inferno: { n: 'Inferno Roar', t: 'fire', p: 105, pp: 5, a: 85, st: ['brn', .4] },
    jet: { n: 'Water Jet', t: 'water', p: 40, pp: 25, a: 100 }, tide: { n: 'Tide Crash', t: 'water', p: 75, pp: 10, a: 95 }, surge: { n: 'Deep Surge', t: 'water', p: 105, pp: 5, a: 85 },
    vine: { n: 'Vine Whip', t: 'leaf', p: 40, pp: 25, a: 100 }, razor: { n: 'Razor Leaf', t: 'leaf', p: 70, pp: 12, a: 95 }, spore: { n: 'Spore Nap', t: 'leaf', p: 0, pp: 10, a: 80, st: ['slp', 1] }, bloom: { n: 'Bloom Heal', t: 'leaf', p: 0, pp: 8, a: 100, heal: .5 }, solar: { n: 'Sun Lance', t: 'leaf', p: 105, pp: 5, a: 85 },
    zap: { n: 'Zap', t: 'spark', p: 40, pp: 25, a: 100, st: ['par', .1] }, fang: { n: 'Thunder Fang', t: 'spark', p: 70, pp: 12, a: 95, st: ['par', .3] }, web: { n: 'Static Web', t: 'spark', p: 0, pp: 15, a: 90, st: ['par', 1] }, bolt: { n: 'Mega Bolt', t: 'spark', p: 105, pp: 5, a: 85, st: ['par', .3] },
    claw: { n: 'Shade Claw', t: 'shadow', p: 40, pp: 25, a: 100 }, pulse: { n: 'Night Pulse', t: 'shadow', p: 70, pp: 12, a: 95 }, fog: { n: 'Toxic Fog', t: 'shadow', p: 0, pp: 12, a: 90, st: ['psn', 1] }, eclipse: { n: 'Eclipse', t: 'shadow', p: 105, pp: 5, a: 85 },
    struggle: { n: 'Struggle', t: 'norm', p: 35, pp: 99, a: 100 }
  };
  const PS = [
    { n: 'Embit', t: 'fire', c: ['#ff7a3d', '#ffd08a'], bw: .46, bh: .4, st: 0, ex: ['ears', 'tail'], b: [44, 52, 40, 60], cr: .7, xp: 60, evo: [14, 1], ls: [[1, 'tackle'], [1, 'ember'], [6, 'glare'], [10, 'quick'], [15, 'flare']] },
    { n: 'Cindrel', t: 'fire', c: ['#ff5a2a', '#ffc27a'], bw: .5, bh: .44, st: 1, ex: ['ears', 'tail', 'spike'], b: [60, 70, 54, 72], cr: .4, xp: 120, evo: [28, 2], ls: [[1, 'ember'], [1, 'glare'], [14, 'flare'], [20, 'slam'], [26, 'quick']] },
    { n: 'Pyrodon', t: 'fire', c: ['#d8321a', '#ffb347'], bw: .54, bh: .46, st: 2, ex: ['horn', 'tail', 'spike', 'wing'], b: [82, 98, 76, 88], cr: .2, xp: 200, evo: null, ls: [[1, 'flare'], [1, 'slam'], [1, 'glare'], [30, 'inferno']] },
    { n: 'Bubblo', t: 'water', c: ['#4da3ff', '#bfe3ff'], bw: .5, bh: .42, st: 0, ex: ['fin'], b: [50, 44, 48, 44], cr: .7, xp: 60, evo: [14, 4], ls: [[1, 'tackle'], [1, 'jet'], [6, 'brace'], [10, 'quick'], [15, 'tide']] },
    { n: 'Tidalon', t: 'water', c: ['#2f7fe0', '#aee0ff'], bw: .52, bh: .44, st: 1, ex: ['fin', 'tail'], b: [68, 62, 66, 58], cr: .4, xp: 120, evo: [28, 5], ls: [[1, 'jet'], [1, 'brace'], [14, 'tide'], [20, 'slam'], [26, 'glare']] },
    { n: 'Krakenite', t: 'water', c: ['#1b56b8', '#9fd2ff'], bw: .56, bh: .46, st: 2, ex: ['fin', 'horn', 'spike'], b: [95, 86, 88, 66], cr: .2, xp: 200, evo: null, ls: [[1, 'tide'], [1, 'slam'], [1, 'brace'], [30, 'surge']] },
    { n: 'Sproutle', t: 'leaf', c: ['#5fd36b', '#d8ffb0'], bw: .46, bh: .4, st: 0, ex: ['ears'], b: [48, 48, 50, 42], cr: .7, xp: 60, evo: [14, 7], ls: [[1, 'tackle'], [1, 'vine'], [6, 'glare'], [10, 'spore'], [15, 'razor']] },
    { n: 'Leafang', t: 'leaf', c: ['#3fb454', '#c8f59a'], bw: .5, bh: .44, st: 1, ex: ['ears', 'tail'], b: [64, 66, 64, 58], cr: .4, xp: 120, evo: [28, 8], ls: [[1, 'vine'], [1, 'spore'], [14, 'razor'], [20, 'bloom'], [26, 'slam']] },
    { n: 'Thornmaw', t: 'leaf', c: ['#238a3c', '#b6e87a'], bw: .56, bh: .46, st: 2, ex: ['spike', 'horn', 'tail'], b: [88, 92, 86, 62], cr: .2, xp: 200, evo: null, ls: [[1, 'razor'], [1, 'bloom'], [1, 'slam'], [30, 'solar']] },
    { n: 'Zapkit', t: 'spark', c: ['#ffd84a', '#fff4b0'], bw: .42, bh: .38, st: 0, ex: ['ears', 'tail'], b: [38, 50, 36, 78], cr: .7, xp: 60, evo: [14, 10], ls: [[1, 'tackle'], [1, 'zap'], [6, 'quick'], [10, 'web'], [15, 'fang']] },
    { n: 'Voltifox', t: 'spark', c: ['#f2b81c', '#fff0a0'], bw: .48, bh: .42, st: 1, ex: ['ears', 'tail', 'spike'], b: [60, 76, 56, 98], cr: .3, xp: 150, evo: null, ls: [[1, 'zap'], [1, 'web'], [1, 'fang'], [20, 'slam'], [28, 'bolt']] },
    { n: 'Gloomp', t: 'shadow', c: ['#9a6bd6', '#d9c2ff'], bw: .5, bh: .44, st: 0, ex: ['horn'], b: [52, 50, 44, 46], cr: .6, xp: 65, evo: [16, 12], ls: [[1, 'tackle'], [1, 'claw'], [8, 'fog'], [12, 'glare'], [16, 'pulse']] },
    { n: 'Umbrawl', t: 'shadow', c: ['#6a3fb0', '#c4a0ff'], bw: .54, bh: .46, st: 1, ex: ['horn', 'wing', 'tail'], b: [74, 80, 66, 74], cr: .25, xp: 160, evo: null, ls: [[1, 'claw'], [1, 'fog'], [1, 'pulse'], [24, 'slam'], [30, 'eclipse']] },
    { n: 'Mothlet', t: 'leaf', c: ['#a8e86a', '#fffbc0'], bw: .38, bh: .36, st: 0, ex: ['wing'], b: [40, 40, 38, 56], cr: .8, xp: 55, evo: [15, 14], ls: [[1, 'tackle'], [1, 'vine'], [6, 'web'], [10, 'quick'], [14, 'razor']] },
    { n: 'Luminoth', t: 'spark', c: ['#ffe36e', '#ffffff'], bw: .44, bh: .4, st: 1, ex: ['wing', 'wing'], b: [64, 70, 58, 86], cr: .3, xp: 150, evo: null, ls: [[1, 'zap'], [1, 'razor'], [1, 'fang'], [22, 'bloom'], [28, 'bolt']] },
    { n: 'Fluffin', t: 'norm', c: ['#e8c8a0', '#fff5e0'], bw: .52, bh: .44, st: 0, ex: ['ears'], b: [60, 46, 44, 40], cr: .85, xp: 55, evo: null, ls: [[1, 'tackle'], [1, 'glare'], [5, 'quick'], [9, 'brace'], [14, 'slam']] }
  ];
  const PITEM = { orb: { n: 'Catch Orb', p: 80, m: 1, d: 'Throw at wild beasts' }, gorb: { n: 'Great Orb', p: 220, m: 1.9, d: 'Better catch rate' }, potion: { n: 'Potion', p: 70, heal: 30, d: 'Heals 30 HP' }, spot: { n: 'Super Potion', p: 190, heal: 90, d: 'Heals 90 HP' }, cure: { n: 'Cure Spray', p: 60, d: 'Cures a status' }, revive: { n: 'Revive', p: 300, d: 'Revives to half HP' } };
  const PSTAT = { brn: ['BRN', '#ff7a3d'], psn: ['PSN', '#b06cff'], par: ['PAR', '#ffd84a'], slp: ['SLP', '#8fa3c8'] };
  function pbStats(b) { const s = PS[b.s], L = b.lv, f = k => Math.floor(2 * s.b[k] * L / 100) + 5; return { hp: Math.floor(2 * s.b[0] * L / 100) + L + 10, atk: f(1), def: f(2), spd: f(3) }; }
  function xpFor(L) { return Math.floor(L * L * L * .8); }
  function pbMake(si, lv) {
    const b = { s: si, lv, exp: xpFor(lv), hp: 1, mv: [], pp: [], st: null, slp: 0 };
    const known = []; for (const [l, m] of PS[si].ls) if (l <= lv && known.indexOf(m) < 0) known.push(m);
    b.mv = known.slice(-4); b.pp = b.mv.map(m => PM[m].pp); b.hp = pbStats(b).hp; return b;
  }
  function smult(s) { return s >= 0 ? (2 + s) / 2 : 2 / (2 - s); }
  function drawBeast(sp, x, y, s, flip, t, alpha) {
    const c = ctx2d; c.save(); c.translate(x, y); if (flip) c.scale(-1, 1); c.globalAlpha = alpha == null ? 1 : alpha;
    const stg = sp.st, bob = Math.sin(t * 3 + sp.n.length) * s * .025, k = 1 + stg * .12, c1 = sp.c[0], c2 = sp.c[1], tc = PT[sp.t].c;
    c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(0, s * .44, s * .4, s * .08, 0, 0, 6.283); c.fill();
    c.translate(0, bob);
    if (stg >= 2) { c.globalCompositeOperation = 'lighter'; glowDot(0, 0, s * .8, tc, .35 + .1 * Math.sin(t * 4)); c.globalCompositeOperation = 'source-over'; }
    const rx = s * sp.bw * k * .92, ry = s * sp.bh * k * .95, ex = sp.ex;
    const has = n => ex.indexOf(n) >= 0;
    // behind: tail, wings, fin back
    if (has('tail')) { c.save(); c.translate(rx * .8, ry * .3); c.rotate(-.5 + Math.sin(t * 3) * .15); const g = c.createLinearGradient(0, 0, s * .4, -s * .2); g.addColorStop(0, c1); g.addColorStop(1, c2); c.fillStyle = g; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(s * .3, -s * .1, s * .42, -s * .3); c.quadraticCurveTo(s * .25, 0, 0, s * .12); c.fill();
      if (sp.t === 'fire') { c.fillStyle = '#ffe27a'; c.beginPath(); c.arc(s * .4, -s * .32, s * .09 * k, 0, 6.283); c.fill(); glowDot(s * .4, -s * .32, s * .2, '#ff7a3d', .6); }
      if (sp.t === 'spark') { c.fillStyle = '#fff'; c.beginPath(); c.moveTo(s * .3, -s * .1); c.lineTo(s * .5, -s * .18); c.lineTo(s * .4, -s * .3); c.lineTo(s * .55, -s * .4); c.lineTo(s * .33, -s * .28); c.fill(); }
      c.restore(); }
    if (has('wing')) { const fl = Math.sin(t * 6) * .25; for (let i = -1; i <= 1; i += 2) { c.save(); c.translate(i * rx * .7, -ry * .1); c.rotate(i * (.5 + fl)); c.fillStyle = sp.t === 'shadow' ? '#3a2266' : c2; c.globalAlpha *= .9; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(i * s * .45, -s * .35, i * s * .55, s * .05); c.quadraticCurveTo(i * s * .3, s * .05, 0, s * .12); c.fill(); c.strokeStyle = tc; c.lineWidth = 1.5; c.stroke(); c.restore(); } }
    if (has('spike')) { c.fillStyle = tc; for (let i = 0; i < 3 + stg; i++) { const a = -2.4 + i * (1.5 / (2 + stg)) * 1.2; c.beginPath(); c.moveTo(Math.cos(a) * rx * .8, Math.sin(a) * ry * .8); c.lineTo(Math.cos(a) * rx * 1.25, Math.sin(a) * ry * 1.3 - s * .06); c.lineTo(Math.cos(a + .25) * rx * .8, Math.sin(a + .25) * ry * .8); c.fill(); } }
    if (has('ears')) { for (let i = -1; i <= 1; i += 2) { c.fillStyle = c1; c.beginPath(); c.moveTo(i * rx * .25, -ry * .75); c.lineTo(i * rx * .85, -ry * 1.5 * (sp.t === 'spark' ? 1.2 : 1)); c.lineTo(i * rx * .85, -ry * .3); c.fill(); c.fillStyle = c2; c.beginPath(); c.moveTo(i * rx * .45, -ry * .75); c.lineTo(i * rx * .78, -ry * 1.2); c.lineTo(i * rx * .78, -ry * .5); c.fill(); if (sp.t === 'spark') { c.fillStyle = '#333'; c.beginPath(); c.arc(i * rx * .85, -ry * (1.5 * 1.2 - .1), s * .03, 0, 6.283); c.fill(); } } }
    if (has('fin')) { c.fillStyle = tc; c.beginPath(); c.moveTo(-rx * .1, -ry * .9); c.quadraticCurveTo(0, -ry * 1.9, rx * .5, -ry * 1.0); c.quadraticCurveTo(rx * .2, -ry * .9, -rx * .1, -ry * .9); c.fill(); for (let i = -1; i <= 1; i += 2) { c.save(); c.translate(i * rx * .95, ry * .1); c.rotate(i * (.4 + Math.sin(t * 4) * .15)); c.fillStyle = c2; c.beginPath(); c.ellipse(i * s * .08, 0, s * .12, s * .06, 0, 0, 6.283); c.fill(); c.restore(); } }
    // body
    const bg = c.createRadialGradient(-rx * .3, -ry * .4, s * .05, 0, 0, rx * 1.2); bg.addColorStop(0, c2); bg.addColorStop(.35, c1); bg.addColorStop(1, 'rgba(20,10,30,.9)');
    c.fillStyle = bg; c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, 6.283); c.fill();
    c.fillStyle = c2; c.globalAlpha *= .8; c.beginPath(); c.ellipse(0, ry * .35, rx * .6, ry * .55, 0, 0, 6.283); c.fill(); c.globalAlpha = alpha == null ? 1 : alpha;
    if (has('horn')) { c.fillStyle = sp.t === 'shadow' ? '#e8dcff' : '#fff3d0'; for (let i = -1; i <= 1; i += 2) { c.beginPath(); c.moveTo(i * rx * .3, -ry * .85); c.quadraticCurveTo(i * rx * .8, -ry * 1.4, i * rx * .6, -ry * 1.9 * (1 + stg * .1)); c.quadraticCurveTo(i * rx * .45, -ry * 1.3, i * rx * .1, -ry * .8); c.fill(); } }
    // type crest
    if (sp.t === 'fire') { c.save(); c.translate(0, -ry * .95); c.fillStyle = '#ffd24a'; c.beginPath(); c.moveTo(0, -s * .2 * k); c.quadraticCurveTo(s * .12, -s * .06, 0, s * .03); c.quadraticCurveTo(-s * .12, -s * .06, 0, -s * .2 * k); c.fill(); glowDot(0, -s * .08, s * .22, '#ff7a3d', .5); c.restore(); }
    if (sp.t === 'leaf') { c.fillStyle = '#3fae4f'; for (let i = -1; i <= 1; i += 2) { c.save(); c.translate(0, -ry * .95); c.rotate(i * (.7 + Math.sin(t * 2) * .08)); c.beginPath(); c.ellipse(0, -s * .1 * k, s * .06, s * .13 * k, 0, 0, 6.283); c.fill(); c.restore(); } }
    if (sp.t === 'spark') { c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.moveTo(-rx * .2, -ry * .1); c.lineTo(0, -ry * .35); c.lineTo(-rx * .08, -ry * .35); c.lineTo(rx * .2, -ry * .65); c.stroke(); }
    if (sp.t === 'shadow') { c.fillStyle = 'rgba(180,120,255,.55)'; for (let i = 0; i < 3; i++) { const a = t * 1.3 + i * 2.1; c.beginPath(); c.arc(Math.cos(a) * rx * 1.1, -ry * .3 + Math.sin(a) * ry * .9, s * .035, 0, 6.283); c.fill(); } }
    if (sp.t === 'water') { c.fillStyle = 'rgba(255,255,255,.45)'; c.beginPath(); c.ellipse(-rx * .45, -ry * .45, rx * .16, ry * .1, -.6, 0, 6.283); c.fill(); }
    // face
    const bl = Math.sin(t * 1.7 + sp.n.length) > .96 ? .15 : 1, ey = -ry * .12, ed = rx * .42, er = s * .075;
    for (let i = -1; i <= 1; i += 2) { c.fillStyle = '#fff'; c.beginPath(); c.ellipse(i * ed, ey, er, er * bl * 1.15, 0, 0, 6.283); c.fill(); c.fillStyle = '#1a1020'; c.beginPath(); c.ellipse(i * ed + s * .015, ey + s * .01, er * .55, er * .7 * bl, 0, 0, 6.283); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(i * ed + s * .03, ey - s * .02, er * .22, 0, 6.283); c.fill(); }
    c.strokeStyle = '#2a1a30'; c.lineWidth = Math.max(1.5, s * .014); c.beginPath(); if (sp.t === 'shadow' || sp.t === 'fire') { c.arc(0, ry * .2, s * .07, .15, Math.PI - .15); } else c.arc(0, ry * .12, s * .06, .2, Math.PI - .2); c.stroke();
    if (sp.t === 'shadow' && stg >= 1) { c.fillStyle = '#fff'; c.beginPath(); c.moveTo(-s * .05, ry * .26); c.lineTo(-s * .03, ry * .36); c.lineTo(-s * .01, ry * .26); c.fill(); }
    c.fillStyle = 'rgba(255,120,140,.35)'; for (let i = -1; i <= 1; i += 2) { c.beginPath(); c.ellipse(i * rx * .66, ry * .2, s * .04, s * .025, 0, 0, 6.283); c.fill(); }
    c.restore();
  }
