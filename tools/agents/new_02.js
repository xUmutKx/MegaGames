// Lane and tower defense: one grid engine, eight maps with their own mechanics.
window.__AG_new_02 = (function () {
  var GOLD = '#ffd15c';
  var TAU = Math.PI * 2;

  // Enemies walk the flow field toward the core. Flyers ignore the field and fly straight.
  var FOES = {
    grunt:  { name: 'Grunt', hp: 20, sp: 1.3, col: '#ff5570', r: 11, gold: 4, dmg: 1, kind: 'walker' },
    runner: { name: 'Sprinter', hp: 12, sp: 2.4, col: '#ffe36e', r: 9, gold: 3, dmg: 1, kind: 'runner' },
    brute:  { name: 'Brute', hp: 95, sp: 0.8, col: '#ff914d', r: 15, gold: 12, dmg: 2, armor: 0.3, kind: 'tank' },
    drone:  { name: 'Drone', hp: 26, sp: 1.5, col: '#55e6ff', r: 10, gold: 6, dmg: 1, fly: true, kind: 'drone' },
    titan:  { name: 'Titan', hp: 900, sp: 0.55, col: '#ff4fd8', r: 22, gold: 90, dmg: 5, armor: 0.2, regen: 5, boss: true, kind: 'boss' }
  };

  // target: 'all' | 'ground' | 'air'. Special fields: pierce, shell, heat, chain, slow, splash, income, amp, wall.
  var TOWERS = {
    bolt:    { name: 'Bolt', cost: 40, rng: 2.6, rate: 1.6, dmg: 9, target: 'all', kind: 'arrow', col: '#55e6ff' },
    cannon:  { name: 'Cannon', cost: 90, rng: 2.4, rate: 0.6, dmg: 40, splash: 0.9, target: 'ground', kind: 'cannon', col: '#ff914d' },
    gatling: { name: 'Gatling', cost: 60, rng: 2.0, rate: 4, dmg: 4, target: 'ground', kind: 'gatling', col: '#a8ff5c' },
    frost:   { name: 'Frost', cost: 70, rng: 2.2, rate: 1.0, dmg: 3, splash: 0.7, slow: { f: 0.45, t: 1.4 }, target: 'all', kind: 'frost', col: '#9ff6ff' },
    spark:   { name: 'Spark', cost: 80, rng: 2.2, rate: 1.1, dmg: 8, chain: { n: 3, r: 1.3 }, target: 'all', kind: 'spark', col: '#ffe36e' },
    flak:    { name: 'Flak', cost: 85, rng: 3.4, rate: 0.9, dmg: 16, splash: 0.6, target: 'air', kind: 'flak', col: '#ff4fd8' },
    rail:    { name: 'Rail', cost: 110, rng: 5.2, rate: 0.5, dmg: 45, pierce: true, target: 'all', kind: 'rail', col: '#ffd15c' },
    mortar:  { name: 'Mortar', cost: 95, rng: 3.4, rate: 0.4, dmg: 30, splash: 1.1, shell: 1.0, target: 'ground', kind: 'mortar', col: '#ff914d' },
    spiral:  { name: 'Spiral', cost: 100, rng: 2.6, rate: 2.4, dmg: 12, heat: { max: 9, cool: 1.8 }, target: 'all', kind: 'spiral', col: '#ff5570' },
    relay:   { name: 'Relay', cost: 50, amp: 0.35, kind: 'relay', col: '#a978ff' },
    mint:    { name: 'Mint', cost: 60, income: { g: 9, every: 5 }, kind: 'mint', col: GOLD },
    wall:    { name: 'Wall', cost: 8, wall: true, kind: 'wall', col: '#8a94b8' }
  };

  function lerp(a, b, t) { return a + (b - a) * t; }
  function cl(v, a, b) { return v < a ? a : v > b ? b : v; }
  function tint(hex, a) {
    var n = parseInt(hex.slice(1), 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }
  function segDist(px, py, ax, ay, bx, by) {
    var dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1;
    var t = cl(((px - ax) * dx + (py - ay) * dy) / l2, 0, 1);
    return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
  }

  function runDefense(g, cfg) {
    var map = cfg.map, COLS = map[0].length, ROWS = map.length, N = COLS * ROWS, th = cfg.theme;
    var kind = new Array(N), spawns = [], core = -1;
    for (var r0 = 0; r0 < ROWS; r0++) for (var c0 = 0; c0 < COLS; c0++) {
      var ch = map[r0].charAt(c0), idx = r0 * COLS + c0;
      kind[idx] = ch === '#' ? 'rock' : ch === '.' ? 'grass' : 'road';
      if (ch === 'S') spawns.push(idx);
      if (ch === 'C') core = idx;
    }
    var L = { cs: 40, ox: 0, oy: 0 };
    var S = {
      gold: cfg.gold, lives: cfg.lives, cleared: 0, wave: 0, kills: 0,
      phase: 'prep', prepT: cfg.prep, wt: 0, queue: [], foes: [], towers: [],
      occ: new Array(N).fill(null), field: [], sel: cfg.towers[0],
      cc: Math.floor(COLS / 2), cr: Math.floor(ROWS / 2), curT: 0,
      fx: [], beams: [], shells: [], pops: [], shake: 0, time: 0,
      tip: cfg.hint, tipT: 6, confirm: null, over: false
    };
    S.field = computeField();

    function layout() {
      var w = W(), h = H(), avail = h - 262;
      L.cs = Math.max(20, Math.min(Math.floor((w - 16) / COLS), Math.floor(avail / ROWS)));
      L.ox = Math.round((w - COLS * L.cs) / 2);
      L.oy = 112 + Math.max(0, Math.floor((avail - ROWS * L.cs) / 2));
    }
    function cx(i) { return L.ox + ((i % COLS) + 0.5) * L.cs; }
    function cy(i) { return L.oy + (((i / COLS) | 0) + 0.5) * L.cs; }
    function cur() { return S.cr * COLS + S.cc; }
    function setTip(s) { S.tip = s; S.tipT = 2.5; }
    function pop(x, y, t, c) { S.pops.push({ x: x, y: y, t: t, c: c, life: 0.9 }); }
    function beam(x0, y0, x1, y1, c, w) { S.beams.push({ x0: x0, y0: y0, x1: x1, y1: y1, c: c, w: w, life: 0.16 }); }
    function neighbours(i) {
      var c = i % COLS, r = (i / COLS) | 0, out = [];
      if (c > 0) out.push(i - 1);
      if (c < COLS - 1) out.push(i + 1);
      if (r > 0) out.push(i - COLS);
      if (r < ROWS - 1) out.push(i + COLS);
      return out;
    }

    // Walking cells: road always, grass only on maps where enemies may cross it. Towers and walls block.
    function passable(j) {
      if (kind[j] === 'rock' || S.occ[j]) return false;
      return kind[j] === 'road' || !!cfg.grassWalk;
    }
    function computeField() {
      var d = new Array(N).fill(Infinity), q = [core];
      d[core] = 0;
      for (var h = 0; h < q.length; h++) {
        var nb = neighbours(q[h]);
        for (var k = 0; k < nb.length; k++) {
          var j = nb[k];
          if (d[j] !== Infinity || !passable(j)) continue;
          d[j] = d[q[h]] + 1; q.push(j);
        }
      }
      return d;
    }
    function nextCell(i) {
      var best = -1, bd = S.field[i];
      if (bd === undefined || bd === Infinity) return -1;
      var nb = neighbours(i);
      for (var k = 0; k < nb.length; k++) {
        if (S.field[nb[k]] < bd) { bd = S.field[nb[k]]; best = nb[k]; }
      }
      return best;
    }
    function enemyOn(i) {
      for (var k = 0; k < S.foes.length; k++) {
        var e = S.foes[k];
        if (!e.fly && (e.c === i || e.n === i)) return true;
      }
      return false;
    }

    // ---------- enemies ----------
    function spawnFoe(key) {
      var def = FOES[key], si = spawns[(Math.random() * spawns.length) | 0];
      var hp = def.hp * (1 + 0.12 * (S.wave - 1));
      var e = { def: def, hp: hp, max: hp, fly: !!def.fly, c: si, n: -1, f: 0, p: 0, slowT: 0, slowF: 1, hitT: 0, bob: Math.random() * 6, x: cx(si), y: cy(si), gone: false };
      if (e.fly) {
        e.x0 = cx(si); e.y0 = cy(si); e.x1 = cx(core); e.y1 = cy(core);
        e.len = Math.hypot(e.x1 - e.x0, e.y1 - e.y0) || 1;
      } else {
        e.n = nextCell(si);
        if (e.n < 0) return;
      }
      S.foes.push(e);
    }
    function makeWave(n) {
      var q = [], pool = cfg.pool.filter(function (p) { return n >= p[1]; }), t = 0;
      var count = Math.min(40, 4 + n * 2), gap = Math.max(0.4, 1.2 - n * 0.05);
      for (var k = 0; k < count; k++) {
        q.push({ at: t, key: pool[(Math.random() * pool.length) | 0][0] });
        t += gap * (0.7 + Math.random() * 0.6);
      }
      if (cfg.bossEvery && n % cfg.bossEvery === 0) q.push({ at: t + 2, key: 'titan' });
      return q;
    }
    function startWave() {
      S.wave++; S.phase = 'fight'; S.wt = 0; S.queue = makeWave(S.wave);
      pop(L.ox + COLS * L.cs / 2, L.oy - 6, 'WAVE ' + S.wave, th.accent);
    }
    function leak(e) {
      e.gone = true;
      S.lives -= e.def.dmg;
      S.shake = 0.35;
      if (cfg.stealGold) S.gold = Math.max(0, S.gold - 15 * e.def.dmg);
      fxBurst(S.fx, cx(core), cy(core), '#ff5570', 16, 180);
      toast(cfg.stealGold ? 'Thieves took coins!' : 'Core hit!');
    }
    function stepFoe(e, dt) {
      var sf = e.slowT > 0 ? e.slowF : 1;
      if (e.slowT > 0) e.slowT -= dt;
      e.hitT = Math.max(0, e.hitT - dt);
      if (e.def.regen) e.hp = Math.min(e.max, e.hp + e.def.regen * dt);
      if (e.fly) {
        e.p += e.def.sp * L.cs / e.len * sf * dt;
        if (e.p >= 1) { leak(e); return; }
        e.x = lerp(e.x0, e.x1, e.p); e.y = lerp(e.y0, e.y1, e.p);
        return;
      }
      e.f += e.def.sp * sf * dt;
      while (e.f >= 1) {
        e.f -= 1; e.c = e.n;
        if (e.c === core) { leak(e); return; }
        e.n = nextCell(e.c);
        if (e.n < 0) { leak(e); return; }
      }
      e.x = lerp(cx(e.c), cx(e.n), e.f); e.y = lerp(cy(e.c), cy(e.n), e.f);
    }
    // Velocity in px/s, used to lead artillery shots.
    function velOf(e) {
      var sp = e.def.sp * L.cs * (e.slowT > 0 ? e.slowF : 1);
      if (e.fly) return [(e.x1 - e.x0) / e.len * sp, (e.y1 - e.y0) / e.len * sp];
      if (e.n < 0) return [0, 0];
      var dx = cx(e.n) - cx(e.c), dy = cy(e.n) - cy(e.c), l = Math.hypot(dx, dy) || 1;
      return [dx / l * sp, dy / l * sp];
    }
    function hurt(e, dmg) {
      if (e.gone) return;
      e.hp -= dmg * (1 - (e.def.armor || 0));
      e.hitT = 0.12;
      if (e.hp > 0) return;
      e.gone = true;
      S.gold += e.def.gold; S.kills++;
      fxBurst(S.fx, e.x, e.y, e.def.col, e.def.boss ? 40 : 12, 200);
      pop(e.x, e.y - 10, '+' + e.def.gold, GOLD);
      if (e.def.boss) { S.shake = 0.5; toast('Titan down!'); }
    }

    // ---------- towers ----------
    function makeTower(key, i) {
      var def = TOWERS[key];
      return { def: def, key: key, i: i, lv: 1, spent: def.cost, cd: 0, heat: 0, oh: 0, inc: 0, kick: 0, ang: -1.57, boost: 0 };
    }
    function towerRange(t) { return (t.def.rng + (t.lv - 1) * 0.35) * L.cs; }
    function towerDmg(t) { return t.def.dmg * (1 + 0.35 * (t.lv - 1)) * (1 + t.boost); }
    function canHit(def, e) { return def.target === 'all' || (def.target === 'air') === e.fly; }
    function upgradeCost(t) { return Math.floor(t.def.cost * 0.75 * t.lv); }

    // Damage everything near (x,y): full damage near the centre, half at the rim. Applies slow.
    function blast(x, y, rad, dmg, def) {
      for (var k = 0; k < S.foes.length; k++) {
        var e = S.foes[k];
        if (e.gone || !canHit(def, e)) continue;
        var d = Math.hypot(e.x - x, e.y - y);
        if (d > rad + e.def.r * 0.5) continue;
        hurt(e, d <= rad * 0.5 + e.def.r * 0.5 ? dmg : dmg * 0.5);
        if (def.slow && !e.gone) { e.slowT = def.slow.t; e.slowF = def.slow.f; }
      }
      fxBurst(S.fx, x, y, def.col, def.splash ? 10 : 4, def.splash ? 150 : 90);
    }
    function fire(t, e) {
      var def = t.def, dmg = towerDmg(t), tx = cx(t.i), ty = cy(t.i);
      t.kick = 1;
      if (def.heat) {
        t.heat += 1;
        if (t.heat >= def.heat.max) { t.oh = 2.5; t.heat = 0; pop(tx, ty - 16, 'OVERHEAT', '#ff5570'); }
      }
      if (def.pierce) {
        var ang = Math.atan2(e.y - ty, e.x - tx), R = towerRange(t);
        var ex = tx + Math.cos(ang) * R, ey = ty + Math.sin(ang) * R;
        beam(tx, ty, ex, ey, def.col, 5);
        for (var k = 0; k < S.foes.length; k++) {
          var f = S.foes[k];
          if (!f.gone && canHit(def, f) && segDist(f.x, f.y, tx, ty, ex, ey) < L.cs * 0.4 + f.def.r * 0.5) hurt(f, dmg);
        }
        S.shake = Math.max(S.shake, 0.08);
        return;
      }
      if (def.shell) {
        var v = velOf(e), T = def.shell;
        S.shells.push({ x0: tx, y0: ty, x1: e.x + v[0] * T, y1: e.y + v[1] * T, t: 0, dur: T, dmg: dmg, def: def });
        return;
      }
      blast(e.x, e.y, def.splash ? def.splash * L.cs : 0, dmg, def);
      beam(tx, ty, e.x, e.y, def.col, 2);
      if (def.chain) {
        var near = S.foes.filter(function (f) {
          return f !== e && !f.gone && canHit(def, f) && Math.hypot(f.x - e.x, f.y - e.y) <= def.chain.r * L.cs;
        }).sort(function (a, b) { return Math.hypot(a.x - e.x, a.y - e.y) - Math.hypot(b.x - e.x, b.y - e.y); });
        for (var j = 0; j < Math.min(def.chain.n, near.length); j++) {
          hurt(near[j], dmg * 0.6);
          beam(e.x, e.y, near[j].x, near[j].y, '#ffffff', 2);
        }
      }
    }
    function updTower(t, dt) {
      var def = t.def, tx = cx(t.i), ty = cy(t.i);
      t.kick = Math.max(0, t.kick - dt * 6);
      if (def.income) {
        t.inc += dt;
        if (t.inc >= def.income.every) {
          t.inc -= def.income.every; S.gold += def.income.g;
          pop(tx, ty - 14, '+' + def.income.g, GOLD);
        }
        return;
      }
      if (!def.rng) return;
      t.cd -= dt;
      if (def.heat) {
        t.heat = Math.max(0, t.heat - def.heat.cool * dt);
        if (t.oh > 0) { t.oh -= dt; return; }
      }
      var R2 = towerRange(t), R2sq = R2 * R2, best = null, bs = Infinity;
      for (var k = 0; k < S.foes.length; k++) {
        var e = S.foes[k];
        if (e.gone || !canHit(def, e)) continue;
        var dx = e.x - tx, dy = e.y - ty;
        if (dx * dx + dy * dy > R2sq) continue;
        var score = e.fly ? (1 - e.p) * 60 : S.field[e.c] - e.f;
        if (score < bs) { bs = score; best = e; }
      }
      if (!best) return;
      t.ang = Math.atan2(best.y - ty, best.x - tx);
      if (t.cd > 0) return;
      t.cd = 1 / def.rate;
      fire(t, best);
    }
    // Relay towers add damage to the turrets they touch.
    function updBoosts() {
      for (var k = 0; k < S.towers.length; k++) S.towers[k].boost = 0;
      for (var k2 = 0; k2 < S.towers.length; k2++) {
        var a = S.towers[k2];
        if (!a.def.amp) continue;
        var nb = neighbours(a.i);
        for (var m = 0; m < nb.length; m++) {
          var o = S.occ[nb[m]];
          if (o && o.def.dmg) o.boost += a.def.amp;
        }
      }
    }
    function sell(t) {
      var refund = Math.floor(t.spent * 0.6);
      S.gold += refund;
      S.occ[t.i] = null;
      S.towers.splice(S.towers.indexOf(t), 1);
      S.field = computeField();
      S.confirm = null;
      fxBurst(S.fx, cx(t.i), cy(t.i), GOLD, 10, 90);
      pop(cx(t.i), cy(t.i) - 10, '+' + refund, GOLD);
    }
    function placeTower(i) {
      var def = TOWERS[S.sel];
      if (kind[i] !== 'grass') { setTip('Build on green tiles'); return; }
      if (S.gold < def.cost) { setTip('Need ' + def.cost + ' gold for ' + def.name); return; }
      if (enemyOn(i)) { setTip('Wait, an enemy is there'); return; }
      var t = makeTower(S.sel, i);
      S.occ[i] = t;
      var f = computeField();
      for (var k = 0; k < spawns.length; k++) {
        if (f[spawns[k]] === Infinity) { S.occ[i] = null; setTip('That would seal the road'); return; }
      }
      S.field = f;
      S.gold -= def.cost;
      S.towers.push(t);
      fxBurst(S.fx, cx(i), cy(i), def.col, 12, 90);
      setTip(def.name + ' built');
    }
    function doAction() {
      var i = cur(), t = S.occ[i];
      if (!t) { placeTower(i); return; }
      if (t.def.wall) { setTip('Walls cannot be upgraded'); return; }
      if (t.lv >= 3) { setTip('Max level'); return; }
      var uc = upgradeCost(t);
      if (S.gold < uc) { setTip('Upgrade needs ' + uc + ' gold'); return; }
      S.gold -= uc; t.spent += uc; t.lv++;
      fxBurst(S.fx, cx(i), cy(i), t.def.col, 16, 120);
      pop(cx(i), cy(i) - 12, 'LV ' + t.lv, t.def.col);
    }
    function doSide() {
      var i = cur(), t = S.occ[i];
      if (!t) {
        var k = cfg.towers.indexOf(S.sel);
        S.sel = cfg.towers[(k + 1) % cfg.towers.length];
        setTip(TOWERS[S.sel].name + ': ' + TOWERS[S.sel].cost + ' gold');
        return;
      }
      if (S.confirm !== t) { S.confirm = t; setTip('Press B again to sell for ' + Math.floor(t.spent * 0.6) + ' gold'); return; }
      sell(t);
    }

    // ---------- drawing ----------
    function drawTower(t) {
      var def = t.def, k = def.kind, col = def.col, x = cx(t.i), y = cy(t.i), R = L.cs * 0.34;
      var a = t.ang, ca = Math.cos(a), sa = Math.sin(a), kick = t.kick, bl = R * (1.2 - kick * 0.25);
      ctx2d.save();
      ctx2d.shadowColor = col; ctx2d.shadowBlur = 10;
      circle(x, y, R, '#0d1222');
      ctx2d.shadowBlur = 0;
      strokeCircle(x, y, R, col, 2 + t.lv * 0.5);
      if (k === 'wall') {
        rect(x - R, y - R, R * 2, R * 2, '#3a4258');
        line(x - R, y, x + R, y, '#1d2233', 2); line(x, y - R, x, y, '#1d2233', 2); line(x - R * 0.5, y, x - R * 0.5, y + R, '#1d2233', 2);
      } else if (k === 'arrow') {
        line(x, y, x + ca * bl, y + sa * bl, col, 5);
        circle(x, y, R * 0.28, col);
      } else if (k === 'cannon') {
        line(x, y, x + ca * bl, y + sa * bl, '#2b2f3f', 12);
        line(x, y, x + ca * bl, y + sa * bl, col, 6);
        circle(x, y, R * 0.36, col);
      } else if (k === 'gatling') {
        for (var j = -1; j <= 1; j++) {
          var aa = a + j * 0.14 + S.time * 6;
          line(x, y, x + Math.cos(aa) * bl * 0.9, y + Math.sin(aa) * bl * 0.9, col, 3);
        }
        circle(x, y, R * 0.25, '#ffffff');
      } else if (k === 'frost') {
        var pulse = 0.5 + 0.5 * Math.sin(S.time * 4 + t.i);
        var pts = [];
        for (var h = 0; h < 6; h++) pts.push([x + Math.cos(h * 1.047 + S.time) * R * 0.75, y + Math.sin(h * 1.047 + S.time) * R * 0.75]);
        polygon(pts, tint(col, 0.35));
        circle(x, y, R * (0.2 + 0.08 * pulse), '#ffffff');
      } else if (k === 'spark') {
        line(x, y + R * 0.2, x, y - R * 1.0, '#3a4560', 6);
        circle(x, y - R * 1.05, R * 0.25, col);
        var px = x, py = y - R * 1.05;
        for (var s = 0; s < 3; s++) {
          var nx = x + (Math.random() - 0.5) * R * 2.2, ny = y - R * 1.05 + (Math.random() - 0.5) * R * 1.4;
          line(px, py, nx, ny, col, 1.5); px = nx; py = ny;
        }
      } else if (k === 'flak') {
        ctx2d.strokeStyle = col; ctx2d.lineWidth = 4;
        ctx2d.beginPath(); ctx2d.arc(x, y, R * 0.8, a - 0.9, a + 0.9); ctx2d.stroke();
        line(x, y, x + ca * R * 0.9, y + sa * R * 0.9, '#ffffff', 2);
        circle(x, y, R * 0.2, col);
      } else if (k === 'rail') {
        var charge = t.cd > 0 ? 1 - Math.min(1, t.cd * def.rate) : 1;
        line(x, y, x + ca * R * 1.7, y + sa * R * 1.7, col, 3);
        circle(x + ca * R * 1.7, y + sa * R * 1.7, 3 + charge * 3, '#ffffff');
        strokeCircle(x, y, R * 0.55, tint(col, 0.5 + 0.5 * charge), 2);
      } else if (k === 'mortar') {
        line(x, y, x + ca * R * 0.8, y + sa * R * 0.8, '#2b2f3f', 12);
        circle(x + ca * R * 0.8, y + sa * R * 0.8, R * 0.3 - kick * 2, col);
      } else if (k === 'mint') {
        for (var c2 = 0; c2 < 3; c2++) circle(x - 4 + c2 * 3, y + R * 0.3 - c2 * 4, R * 0.42, GOLD);
        strokeCircle(x - 4, y + R * 0.3, R * 0.42, '#ffffff', 1);
      } else if (k === 'relay') {
        var rp = 0.5 + 0.5 * Math.sin(S.time * 3 + t.i);
        var nb = neighbours(t.i);
        for (var q = 0; q < nb.length; q++) {
          var o = S.occ[nb[q]];
          if (o) line(x, y, cx(nb[q]), cy(nb[q]), tint(col, 0.45), 2);
        }
        polygon([[x, y - R * 0.8], [x + R * 0.7, y], [x, y + R * 0.8], [x - R * 0.7, y]], tint(col, 0.6 + 0.3 * rp));
      } else if (k === 'spiral') {
        var hf = t.heat / def.heat.max;
        ctx2d.strokeStyle = t.oh > 0 ? '#ff5570' : tint('#55e6ff', 1);
        ctx2d.lineWidth = 4;
        ctx2d.beginPath();
        ctx2d.arc(x, y, R * 0.8, -1.57, -1.57 + TAU * hf);
        ctx2d.stroke();
        circle(x, y, R * 0.3, t.oh > 0 && Math.floor(S.time * 8) % 2 ? '#ff5570' : col);
      }
      ctx2d.restore();
    }
    function drawFoe(e) {
      var d = e.def, x = e.x, y = e.y, R = d.r, col = d.col;
      var dx, dy;
      if (e.fly) { dx = e.x1 - e.x0; dy = e.y1 - e.y0; }
      else if (e.n >= 0) { dx = cx(e.n) - cx(e.c); dy = cy(e.n) - cy(e.c); }
      else { dx = 1; dy = 0; }
      var face = Math.atan2(dy, dx), bob = Math.sin(S.time * 10 + e.bob) * 1.5;
      ctx2d.save();
      if (e.fly) {
        ctx2d.globalAlpha = 0.25;
        circle(x, y + L.cs * 0.38, R * 0.9, '#000000');
        ctx2d.globalAlpha = 1;
        y -= L.cs * 0.25;
      }
      ctx2d.shadowColor = col; ctx2d.shadowBlur = d.boss ? 18 : 8;
      if (d.kind === 'walker') {
        var lg = Math.sin(S.time * 12 + e.bob) * 4;
        line(x - 4, y + R * 0.5, x - 4 + lg, y + R + 3, col, 3);
        line(x + 4, y + R * 0.5, x + 4 - lg, y + R + 3, col, 3);
        circle(x, y + bob, R, col);
        circle(x - R * 0.35, y + bob - 2, 2.5, '#0b0b14');
        circle(x + R * 0.35, y + bob - 2, 2.5, '#0b0b14');
      } else if (d.kind === 'runner') {
        var rr = R * 1.2;
        polygon([[x + Math.cos(face) * rr, y + Math.sin(face) * rr], [x + Math.cos(face + 2.4) * rr * 0.8, y + Math.sin(face + 2.4) * rr * 0.8], [x + Math.cos(face - 2.4) * rr * 0.8, y + Math.sin(face - 2.4) * rr * 0.8]], col);
      } else if (d.kind === 'tank') {
        rect(x - R, y - R + bob, R * 2, R * 2, col);
        strokeCircle(x, y + bob, R * 0.6, '#2b1a10', 3);
      } else if (d.kind === 'drone') {
        var spin = S.time * 20;
        line(x - R * 1.4 * Math.cos(spin), y - R * 0.4, x + R * 1.4 * Math.cos(spin), y - R * 0.4, col, 2);
        polygon([[x, y - R], [x + R, y], [x, y + R], [x - R, y]], col);
      } else {
        var bs = S.time * 0.8;
        for (var sp = 0; sp < 8; sp++) {
          var sa = bs + sp * 0.785;
          line(x + Math.cos(sa) * R * 0.9, y + Math.sin(sa) * R * 0.9, x + Math.cos(sa) * R * 1.4, y + Math.sin(sa) * R * 1.4, col, 3);
        }
        circle(x, y, R, col);
        circle(x, y, R * 0.45, '#ffffff');
      }
      if (e.hitT > 0) circle(x, y, R * 0.9, 'rgba(255,255,255,0.55)');
      if (e.slowT > 0) strokeCircle(x, y, R + 3, '#9ff6ff', 2);
      ctx2d.restore();
      if (e.hp < e.max) {
        var bw = Math.max(R * 2.2, 14), frac = cl(e.hp / e.max, 0, 1);
        rect(x - bw / 2, y - R - 9, bw, 3, '#000000');
        rect(x - bw / 2, y - R - 9, bw * frac, 3, col);
      }
    }
    function drawBoard() {
      var cs = L.cs, ox = L.ox, oy = L.oy;
      rect(ox - 4, oy - 4, COLS * cs + 8, ROWS * cs + 8, 'rgba(0,0,0,0.35)');
      for (var i = 0; i < N; i++) {
        var c = i % COLS, r = (i / COLS) | 0, x = ox + c * cs, y = oy + r * cs, k = kind[i];
        if (k === 'grass') {
          rect(x + 1, y + 1, cs - 2, cs - 2, th.grass[(c + r) % 2]);
        } else if (k === 'road') {
          rect(x, y, cs, cs, th.road[(c + r) % 2]);
          var nb = neighbours(i);
          var mark = [[x, y, cs, 2], [x, y + cs - 2, cs, 2], [x, y, 2, cs], [x + cs - 2, y, 2, cs]];
          var sides = [[c - 1, r], [c + 1, r], [c, r - 1], [c, r + 1]];
          for (var s = 0; s < 4; s++) {
            var sc = sides[s][0], sr = sides[s][1];
            var inside = sc >= 0 && sc < COLS && sr >= 0 && sr < ROWS;
            if (!inside || kind[sr * COLS + sc] !== 'road') rect(mark[s][0], mark[s][1], mark[s][2], mark[s][3], tint(th.accent, 0.55));
          }
        } else {
          rect(x + 1, y + 1, cs - 2, cs - 2, th.rock[1]);
          rect(x + 3, y + 3, cs - 6, cs - 10, th.rock[0]);
        }
      }
      var sp = 0.5 + 0.5 * Math.sin(S.time * 5);
      for (var q = 0; q < spawns.length; q++) {
        strokeCircle(cx(spawns[q]), cy(spawns[q]), cs * (0.22 + 0.06 * sp), th.spawn, 3);
        circle(cx(spawns[q]), cy(spawns[q]), cs * 0.12, th.spawn);
      }
      var kx = cx(core), ky = cy(core);
      ctx2d.save();
      ctx2d.shadowColor = th.core; ctx2d.shadowBlur = 18;
      polygon([[kx, ky - cs * 0.36], [kx + cs * 0.3, ky], [kx, ky + cs * 0.36], [kx - cs * 0.3, ky]], th.core);
      ctx2d.restore();
      polygon([[kx, ky - cs * 0.14], [kx + cs * 0.1, ky], [kx, ky + cs * 0.14], [kx - cs * 0.1, ky]], '#ffffff');
    }

    function update(dt) {
      if (S.over) return;
      dt = Math.min(dt, 0.05);
      layout();
      S.time += dt;
      S.shake = Math.max(0, S.shake - dt);
      S.tipT = Math.max(0, S.tipT - dt);

      var mx = AX(), my = AY();
      if (Math.abs(mx) > 0.5 || Math.abs(my) > 0.5) {
        S.curT -= dt;
        if (S.curT <= 0) {
          S.curT = 0.16;
          if (Math.abs(mx) > Math.abs(my)) S.cc = cl(S.cc + (mx > 0 ? 1 : -1), 0, COLS - 1);
          else S.cr = cl(S.cr + (my > 0 ? 1 : -1), 0, ROWS - 1);
        }
      } else S.curT = 0;
      if (pressed('a')) doAction();
      if (pressed('b')) doSide();
      if (pressed('c') && S.phase === 'prep') startWave();

      if (S.phase === 'prep') {
        S.prepT -= dt;
        if (S.prepT <= 0) startWave();
      } else {
        S.wt += dt;
        while (S.queue.length && S.queue[0].at <= S.wt) spawnFoe(S.queue.shift().key);
      }
      for (var k = 0; k < S.foes.length; k++) stepFoe(S.foes[k], dt);
      S.foes = S.foes.filter(function (e) { return !e.gone; });

      if (S.phase === 'fight' && !S.queue.length && !S.foes.length) {
        S.cleared++;
        var bonus = 20 + S.wave * 6;
        S.gold += bonus;
        pop(L.ox + COLS * L.cs / 2, L.oy + ROWS * L.cs / 2, 'WAVE CLEAR +' + bonus, GOLD);
        if (S.cleared >= g.goal) {
          S.over = true;
          completeMini();
          return;
        }
        S.phase = 'prep'; S.prepT = cfg.prep;
      }

      updBoosts();
      for (var m = 0; m < S.towers.length; m++) updTower(S.towers[m], dt);

      for (var a = S.shells.length - 1; a >= 0; a--) {
        var sh = S.shells[a];
        sh.t += dt;
        if (sh.t >= sh.dur) {
          blast(sh.x1, sh.y1, sh.def.splash * L.cs, sh.dmg, sh.def);
          S.shells.splice(a, 1);
        }
      }
      for (var b = S.beams.length - 1; b >= 0; b--) { S.beams[b].life -= dt; if (S.beams[b].life <= 0) S.beams.splice(b, 1); }
      for (var p = S.pops.length - 1; p >= 0; p--) { S.pops[p].life -= dt; if (S.pops[p].life <= 0) S.pops.splice(p, 1); }
      fxUpdate(S.fx, dt, 120);

      if (S.lives <= 0) {
        S.over = true;
        miniFail(g, 'The core fell after ' + S.cleared + ' waves');
        return;
      }
      hud('Waves ' + S.cleared + '/' + g.goal + ' | Gold ' + S.gold + ' | Lives ' + Math.max(0, S.lives));
    }

    function draw() {
      layout();
      var w = W(), h = H();
      var sx = S.shake > 0 ? (Math.random() - 0.5) * S.shake * 18 : 0;
      var sy = S.shake > 0 ? (Math.random() - 0.5) * S.shake * 18 : 0;
      ctx2d.save();
      ctx2d.translate(sx, sy);
      var gr = ctx2d.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, th.bg[0]);
      gr.addColorStop(1, th.bg[1]);
      ctx2d.fillStyle = gr;
      ctx2d.fillRect(-20, -20, w + 40, h + 40);
      for (var k = 0; k < 36; k++) {
        var sxp = (k * 97.3) % w, syp = (k * 53.7 + S.time * (3 + (k % 5))) % h;
        circle(sxp, syp, 1 + (k % 3) * 0.4, 'rgba(255,255,255,0.18)');
      }
      drawBoard();

      var ci = cur(), ct = S.occ[ci], ghost = TOWERS[S.sel];
      var shown = ct ? ct.def : ghost;
      if (shown.rng) {
        var R = ct ? towerRange(ct) : ghost.rng * L.cs;
        circle(cx(ci), cy(ci), R, tint(shown.col, 0.07));
        strokeCircle(cx(ci), cy(ci), R, tint(shown.col, 0.6), 2);
      }
      var ok = !ct && kind[ci] === 'grass' && S.gold >= ghost.cost;
      var ccol = ct ? '#ffffff' : kind[ci] === 'grass' ? (ok ? '#a8ff5c' : '#ffb84d') : '#ff5570';
      if (!ct && kind[ci] === 'grass') {
        ctx2d.globalAlpha = 0.45;
        if (ghost.kind === 'wall') rect(cx(ci) - L.cs * 0.34, cy(ci) - L.cs * 0.34, L.cs * 0.68, L.cs * 0.68, ghost.col);
        else circle(cx(ci), cy(ci), L.cs * 0.3, ghost.col);
        ctx2d.globalAlpha = 1;
      }

      var dr = [];
      for (var t = 0; t < S.towers.length; t++) dr.push(S.towers[t]);
      for (var q = 0; q < dr.length; q++) drawTower(dr[q]);
      for (var f = 0; f < S.foes.length; f++) drawFoe(S.foes[f]);

      for (var bi = 0; bi < S.beams.length; bi++) {
        var bm = S.beams[bi];
        ctx2d.globalAlpha = Math.max(0, bm.life / 0.16);
        line(bm.x0, bm.y0, bm.x1, bm.y1, bm.c, bm.w * 3);
        line(bm.x0, bm.y0, bm.x1, bm.y1, '#ffffff', bm.w);
        ctx2d.globalAlpha = 1;
      }
      for (var si = 0; si < S.shells.length; si++) {
        var s2 = S.shells[si], u = s2.t / s2.dur;
        circle(lerp(s2.x0, s2.x1, u), lerp(s2.y0, s2.y1, u) - Math.sin(Math.PI * u) * 40, 5, s2.def.col);
      }
      fxDraw(S.fx);
      for (var pi = 0; pi < S.pops.length; pi++) {
        var po = S.pops[pi];
        ctx2d.globalAlpha = Math.min(1, po.life * 2);
        text(po.t, po.x, po.y - (1 - po.life) * 22, 13, po.c, 'center', 800);
        ctx2d.globalAlpha = 1;
      }
      strokeCircle(cx(ci), cy(ci), L.cs * 0.5, ccol, 2);
      ctx2d.restore();

      var phase = S.phase === 'prep' ? 'Next wave in ' + Math.ceil(S.prepT) + 's  (C: call now)' : 'Wave ' + S.wave + ' is coming in';
      text(cfg.name + '  |  ' + phase, w / 2, 98, 12, '#e8ecff', 'center', 700);
      if (S.tipT > 0) text(S.tip, w / 2, H() - 148, 14, '#ffffff', 'center', 700);
      else text('[' + ghost.name + '] ' + ghost.cost + ' gold  |  A build  B next  C wave', w / 2, H() - 148, 13, ghost.col, 'center', 700);
    }

    return {
      update: update,
      draw: draw,
      pointer: function (x, y) {
        layout();
        var c = Math.floor((x - L.ox) / L.cs), r = Math.floor((y - L.oy) / L.cs);
        if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return;
        S.cc = c; S.cr = r;
        doAction();
      },
      stop: function () {}
    };
  }

  var CONFIGS = [
    {
      id: 'n02_serpent_road', title: 'Serpent Road', icon: '🐍', goal: 8, lives: 15, gold: 130, prep: 12,
      desc: 'Hold the snake-shaped road for 8 waves. Bolts fire fast single shots, Cannons blast splash, and Gatlings chew through ground foes.',
      hint: 'Enemies follow the road. Build on the green tiles.',
      map: ['S______', '......_', '......_', '......_', '_______', '_......', '_......', '_......', '______C'],
      theme: { bg: ['#0b1622', '#14203a'], grass: ['#15301f', '#183a26'], road: ['#4b3f5c', '#3f3450'], rock: ['#2a3046', '#1c2133'], accent: '#ffb84d', core: '#55e6ff', spawn: '#ff5570' },
      towers: ['bolt', 'cannon', 'gatling'],
      pool: [['grunt', 1], ['runner', 3], ['brute', 5]]
    },
    {
      id: 'n02_frost_ring', title: 'Frost Ring', icon: '❄️', goal: 9, lives: 15, gold: 140, prep: 12,
      desc: 'Freeze the ring road. Frost towers slow every foe in reach, Spark towers chain lightning, and armored Brutes fight back.',
      hint: 'Frost slows enemies. Sparks jump between nearby foes.',
      map: ['S______', '......_', '..###._', '..###._', '..###._', '......_', '......_', '......_', 'C______'],
      theme: { bg: ['#071a2e', '#0d2f4f'], grass: ['#1d3b4f', '#21465c'], road: ['#3f5a78', '#36506b'], rock: ['#2c4a63', '#1b3248'], accent: '#9ff6ff', core: '#9ff6ff', spawn: '#55e6ff' },
      towers: ['frost', 'spark', 'bolt'],
      pool: [['grunt', 1], ['runner', 2], ['brute', 4]]
    },
    {
      id: 'n02_skyline_guard', title: 'Skyline Guard', icon: '🛸', goal: 9, lives: 14, gold: 150, prep: 12,
      desc: 'Drones ignore the road and fly straight at the core. Flak towers hit only the air, Gatlings only the ground, so split your defence.',
      hint: 'Drones fly straight over the rocks. Flak hits only them.',
      map: ['S______', '......_', '.###.._', '.###.._', '......_', '......_', 'C______'],
      theme: { bg: ['#130b2a', '#2a1450'], grass: ['#1e2a3a', '#223246'], road: ['#50406a', '#463a5c'], rock: ['#3a2d52', '#281e3c'], accent: '#ff4fd8', core: '#ff4fd8', spawn: '#ff4fd8' },
      towers: ['flak', 'gatling', 'bolt'],
      pool: [['grunt', 1], ['drone', 2], ['runner', 4]]
    },
    {
      id: 'n02_maze_builder', title: 'Maze Builder', icon: '🧱', goal: 8, lives: 15, gold: 120, prep: 12, grassWalk: true,
      desc: 'There is no road here. Enemies cross the open grass, so wall off the gaps to make them wind past your turrets. The route can never be fully sealed.',
      hint: 'Walls steer enemies. You cannot seal every path.',
      map: ['S......', '.......', '#####.#', '.......', '.......', '#.#####', '.......', '.......', '......C'],
      theme: { bg: ['#0c1a10', '#16261a'], grass: ['#1f3a22', '#24432a'], road: ['#2c4a30', '#274229'], rock: ['#3a4a3a', '#243024'], accent: '#a8ff5c', core: '#a8ff5c', spawn: '#ffe36e' },
      towers: ['wall', 'bolt', 'cannon'],
      pool: [['grunt', 1], ['runner', 3]]
    },
    {
      id: 'n02_relay_lanes', title: 'Relay Lanes', icon: '🔗', goal: 10, lives: 15, gold: 160, prep: 12,
      desc: 'Relay towers boost every turret that touches them. Spiral towers overheat when they fire too long, so place them beside a Relay.',
      hint: 'Put Relays next to turrets. Spirals overheat.',
      map: ['S______', '......_', '_______', '_......', '_______', '......_', '......C'],
      theme: { bg: ['#101028', '#1c1c46'], grass: ['#243058', '#2a3764'], road: ['#5a4a78', '#4d3f6a'], rock: ['#3a2d52', '#281e3c'], accent: '#a978ff', core: '#a978ff', spawn: '#55e6ff' },
      towers: ['relay', 'spiral', 'bolt'],
      pool: [['grunt', 1], ['runner', 2], ['brute', 4], ['drone', 6]]
    },
    {
      id: 'n02_coin_orchard', title: 'Coin Orchard', icon: '🪙', goal: 8, lives: 12, gold: 100, prep: 14, stealGold: true,
      desc: 'Mint towers grow gold every few seconds, but thieves steal your coins when they slip past. Grow the orchard and keep the road clear.',
      hint: 'Mints pay out. Thieves steal coins when they get through.',
      map: ['.......', '.#.#.#.', '.......', 'S_____C', '.......', '.#.#.#.', '.......'],
      theme: { bg: ['#1a1206', '#2e210c'], grass: ['#2f4a1d', '#36551f'], road: ['#7a5b35', '#6b4f2c'], rock: ['#4a3a24', '#332716'], accent: GOLD, core: GOLD, spawn: '#ff914d' },
      towers: ['mint', 'bolt', 'cannon'],
      pool: [['grunt', 1], ['runner', 2]]
    },
    {
      id: 'n02_boss_lanes', title: 'Boss Lanes', icon: '👑', goal: 9, lives: 15, gold: 170, prep: 12, bossEvery: 3,
      desc: 'Two lanes merge into one core. Titans roll in every third wave with armor and regeneration. Rail towers pierce whole lines of enemies.',
      hint: 'Titans come every third wave. Rails pierce lines.',
      map: ['.......', 'S______', '......_', '......C', '......_', 'S______', '.......'],
      theme: { bg: ['#1a0a10', '#2e0f1e'], grass: ['#3a2030', '#44243a'], road: ['#5b3a4a', '#4f3140'], rock: ['#4a2a3a', '#341c2a'], accent: '#ff4fd8', core: '#ff4fd8', spawn: '#ffe36e' },
      towers: ['rail', 'gatling', 'mortar'],
      pool: [['grunt', 1], ['brute', 2]]
    },
    {
      id: 'n02_mortar_hills', title: 'Mortar Hills', icon: '💣', goal: 10, lives: 15, gold: 150, prep: 12,
      desc: 'Mortar shells land where enemies are heading, so lead your shots on the bends. Frost slows the crowd and Spirals fire fast.',
      hint: 'Mortars land ahead of the target. Lead your shots.',
      map: ['S______', '......_', '.###.._', '......_', '_______', '_......', 'C......'],
      theme: { bg: ['#101a10', '#1d2b1a'], grass: ['#2f4a2a', '#345231'], road: ['#6a5a40', '#5e4f38'], rock: ['#4a4a3a', '#33332a'], accent: '#ff914d', core: '#ff914d', spawn: '#ffe36e' },
      towers: ['mortar', 'frost', 'spiral'],
      pool: [['grunt', 1], ['brute', 3], ['drone', 4]]
    }
  ];

  var engines = {}, minis = [];
  CONFIGS.forEach(function (cfg) {
    engines[cfg.id] = function (g) { return runDefense(g, cfg); };
    minis.push({ id: cfg.id, title: cfg.title, icon: cfg.icon, cat: 'STRATEGY', desc: cfg.desc, engine: cfg.id, goal: cfg.goal });
  });
  return { engines: engines, minis: minis, aaa: [] };
})();
