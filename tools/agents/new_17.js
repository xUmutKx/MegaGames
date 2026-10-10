// new_17: idle, clicker and upgrade-tree minigames (all engine keys and mini ids prefixed n17_)
window.__AG_new_17 = (function () {
  function fmt(n) {
    n = Math.floor(n || 0);
    if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e4) return (n / 1e3).toFixed(1) + 'K';
    return String(n);
  }
  function bar(x, y, w, h, frac, col) {
    rect(x, y, w, h, 'rgba(255,255,255,.12)', 1);
    rect(x, y, w * clamp(frac || 0, 0, 1), h, col, 1);
  }
  function gear(x, y, r, rot, col) {
    var pts = [], n = 12;
    for (var i = 0; i < n * 2; i++) {
      var a = rot + i * Math.PI / n, rr = i % 2 ? r * 0.8 : r;
      pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
    }
    polygon(pts, col);
    circle(x, y, r * 0.35, '#0a0d18');
  }
  function glow(x, y, r, col) {
    var gr = ctx2d.createRadialGradient(x, y, 2, x, y, r);
    gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)');
    circle(x, y, r, gr);
  }
  function outline(x, y, w, h, col) {
    ctx2d.strokeStyle = col; ctx2d.lineWidth = 2; ctx2d.strokeRect(x, y, w, h);
  }

  // Shared upgrade tree. defs: {id,name,desc,base,grow?,max?,req?,apply(level)}
  function makeShop(defs) {
    var sh = { defs: defs, lv: {}, cur: 0, rects: [] };
    sh.lvl = function (id) { return sh.lv[id] || 0; };
    sh.open = function (d) { return !d.req || sh.lvl(d.req) > 0; };
    sh.maxed = function (d) { return d.max !== undefined && sh.lvl(d.id) >= d.max; };
    sh.cost = function (d) { return Math.ceil(d.base * Math.pow(d.grow || 1.5, sh.lvl(d.id))); };
    sh.buy = function (i, cash) {
      var d = defs[i];
      if (!d || !sh.open(d) || sh.maxed(d)) return 0;
      var c = sh.cost(d);
      if (cash < c) return 0;
      sh.lv[d.id] = sh.lvl(d.id) + 1;
      d.apply(sh.lv[d.id]);
      return c;
    };
    sh.hit = function (x, y) {
      for (var i = 0; i < sh.rects.length; i++) {
        var r = sh.rects[i];
        if (x >= r[0] && x <= r[0] + r[2] && y >= r[1] && y <= r[1] + r[3]) return i;
      }
      return -1;
    };
    sh.draw = function (x, y, w, rowH, cash) {
      sh.rects = [];
      for (var i = 0; i < defs.length; i++) {
        var d = defs[i], ry = y + i * (rowH + 4), open = sh.open(d), max = sh.maxed(d);
        var c = sh.cost(d), can = open && !max && cash >= c;
        sh.rects.push([x, ry, w, rowH]);
        rect(x, ry, w, rowH, 'rgba(255,255,255,.07)', 1);
        if (i === sh.cur) outline(x, ry, w, rowH, C.cyan);
        var req = open ? '' : defs.filter(function (q) { return q.id === d.req; })[0];
        text(open ? d.name : 'Locked: ' + (req ? req.name : '?'), x + 10, ry + rowH * 0.42, 13, open ? '#fff' : '#667', 'left', 700);
        var lvTxt = d.max !== undefined ? ' (' + sh.lvl(d.id) + '/' + d.max + ')' : ' (Lv ' + sh.lvl(d.id) + ')';
        text(open ? d.desc + lvTxt : '', x + 10, ry + rowH * 0.82, 11, '#9aa8c0', 'left', 400);
        text(max ? 'MAX' : fmt(c), x + w - 10, ry + rowH * 0.6, 14, max ? C.gold : (can ? C.green : '#667'), 'right');
      }
    };
    return sh;
  }
  function timeLeft(t, limit) { return Math.max(0, Math.ceil(limit - t)); }

  // 1. Gearworks: tap the machine for gears, buy upgrades, time limit.
  function gameGearworks(g) {
    var gears = 0, total = 0, per = 1, mult = 1, crit = 0, auto = 0, t = 0, rot = 0, pulse = 0;
    var parts = [], pop = [], done = false, LIMIT = 300, cx = 0, cy = 250;
    var sh = makeShop([
      { id: 'sharp', name: 'Sharper Teeth', desc: '+1 gear per tap', base: 10, grow: 1.45, apply: function () { per += 1; } },
      { id: 'lucky', name: 'Lucky Bearing', desc: '+5% crit (x5 gears)', base: 60, grow: 1.9, max: 8, apply: function () { crit += 0.05; } },
      { id: 'oil', name: 'Auto Oiler', desc: '+1 gear per second', base: 80, grow: 1.5, apply: function () { auto += 1; } },
      { id: 'steam', name: 'Steam Boiler', desc: 'Tap power x2', base: 900, grow: 2.6, req: 'sharp', max: 4, apply: function () { mult *= 2; } },
      { id: 'belt', name: 'Conveyor Belt', desc: 'Auto output x2', base: 1200, grow: 2.3, req: 'oil', max: 3, apply: function () { auto *= 2; } },
      { id: 'mill', name: 'Second Mill', desc: '+12 gears per second', base: 6000, grow: 2, req: 'belt', apply: function () { auto += 12; } }
    ]);
    function gain(v) { gears += v; total += v; }
    function click() {
      var crit1 = Math.random() < crit;
      var v = per * mult * (crit1 ? 5 : 1);
      gain(v); pulse = 1;
      fxBurst(parts, cx + rand(-70, 70), cy + rand(-70, 70), crit1 ? C.gold : C.cyan, crit1 ? 16 : 6, 180);
      pop.push({ x: cx + rand(-40, 40), y: cy - 100, s: '+' + fmt(v), life: 0.8, c: crit1 ? C.gold : C.white });
      beep(crit1 ? 880 : 520, crit1 ? 1320 : 700, 0.05, 'square', 0.05);
    }
    return {
      update: function (dt) {
        if (done) return;
        t += dt; rot += (0.5 + pulse * 3) * dt; pulse = Math.max(0, pulse - dt * 2);
        if (auto > 0) gain(auto * dt);
        if (pressed('c')) click();
        if (pressed('b')) sh.cur = (sh.cur + 1) % sh.defs.length;
        if (pressed('a')) gears -= sh.buy(sh.cur, gears);
        for (var i = pop.length - 1; i >= 0; i--) { pop[i].y -= 40 * dt; pop[i].life -= dt; if (pop[i].life <= 0) pop.splice(i, 1); }
        fxUpdate(parts, dt, 60);
        if (total >= g.goal) { done = true; completeMini(); return; }
        if (t >= LIMIT) { done = true; miniFail(g, 'The shift ended with ' + fmt(total) + ' gears.'); return; }
        hud(fmt(total) + ' / ' + g.goal);
      },
      pointer: function (x, y) {
        if (done) return;
        if (dist(x, y, cx, cy) < 110) { click(); return; }
        var i = sh.hit(x, y);
        if (i >= 0) { sh.cur = i; gears -= sh.buy(i, gears); }
      },
      draw: function () {
        clear('#070a14');
        glow(cx, cy, 200, 'rgba(255,209,92,' + (0.12 + pulse * 0.2).toFixed(3) + ')');
        gear(cx, cy, 92 + pulse * 4, rot, pulse > 0.3 ? C.gold : '#c99a3a');
        gear(54, 170, 24, -rot * 1.5, '#2a3350');
        gear(W() - 56, 180, 32, rot, '#2a3350');
        text(fmt(gears) + ' gears', W() / 2, 104, 26, '#fff', 'center', 800);
        text('+' + fmt(auto) + '/s auto   x' + mult + ' tap   crit ' + Math.round(crit * 100) + '%', W() / 2, 128, 12, '#9aa8c0', 'center');
        text('Time ' + timeLeft(t, LIMIT) + 's', W() - 14, 150, 12, '#ffb36e', 'right', 700);
        for (var i = 0; i < pop.length; i++) {
          ctx2d.globalAlpha = clamp(pop[i].life / 0.8, 0, 1);
          text(pop[i].s, pop[i].x, pop[i].y, 18, pop[i].c, 'center', 800);
        }
        ctx2d.globalAlpha = 1;
        fxDraw(parts);
        text('Tap the machine or press C. A buys, B selects.', W() / 2, 366, 11, '#788', 'center');
        sh.draw(14, 378, W() - 28, 46, gears);
      },
      stop: function () { done = true; }
    };
  }

  // 2. Orchard Drop: catch falling fruit with a basket, grow trees and hire drones.
  function gameOrchard(g) {
    var caught = 0, cash = 0, missed = 0, t = 0, done = false, trees = 2, rate = 1, value = 1, golden = 0.0, bw = 84;
    var bx = 0, tx = null, drones = 0, droneT = 0, fruits = [], parts = [], timers = [0, 0, 0, 0, 0], sway = 0;
    var BASKET_Y = 424, GROUND = 440, LOSE = 10;
    var sh = makeShop([
      { id: 'tree', name: 'Plant a Tree', desc: '+1 tree (max 3 extra)', base: 30, grow: 1.9, max: 3, apply: function () { trees++; } },
      { id: 'prune', name: 'Pruning Shears', desc: 'Trees fruit 25% faster', base: 40, grow: 1.6, max: 6, apply: function () { rate *= 1.25; } },
      { id: 'soil', name: 'Rich Soil', desc: 'Each fruit worth +1', base: 60, grow: 1.7, apply: function () { value += 1; } },
      { id: 'wide', name: 'Wide Basket', desc: 'Basket 20% wider', base: 50, grow: 1.6, max: 4, apply: function () { bw *= 1.2; } },
      { id: 'gold', name: 'Golden Seeds', desc: '+8% golden fruit (x10)', base: 200, grow: 2.2, max: 4, apply: function () { golden += 0.08; } },
      { id: 'drone', name: 'Picker Drone', desc: 'Drone snags a fruit every 3s', base: 400, grow: 2, max: 3, apply: function () { drones++; } }
    ]);
    function spawnFruit(x, y) {
      var gold = Math.random() < golden;
      fruits.push({ x: x, y: y, vy: 70, gold: gold, v: gold ? value * 10 : value });
    }
    function catchFruit(f, auto) {
      caught++; cash += f.v;
      fxBurst(parts, f.x, BASKET_Y, f.gold ? C.gold : C.lime, f.gold ? 14 : 6, 150);
      if (!auto) beep(640, 900, 0.04, 'sine', 0.05);
    }
    return {
      update: function (dt) {
        if (done) return;
        t += dt; sway += dt;
        var ax = AX();
        if (ax) tx = null;
        if (tx !== null) { var d = tx - bx; bx += clamp(d, -520 * dt, 520 * dt); }
        bx = clamp(bx + ax * 380 * dt, bw / 2, W() - bw / 2);
        if (pressed('b')) sh.cur = (sh.cur + 1) % sh.defs.length;
        if (pressed('a')) cash -= sh.buy(sh.cur, cash);
        var n = trees;
        for (var i = 0; i < n; i++) {
          timers[i] += dt * rate;
          if (timers[i] > 1.6) { timers[i] = 0; spawnFruit(treeX(i), 190 + rand(-6, 6)); }
        }
        if (drones > 0) {
          droneT += dt;
          if (droneT >= 3 / drones && fruits.length) {
            droneT = 0;
            var lowest = fruits.reduce(function (a, b) { return a.y > b.y ? a : b; });
            fruits.splice(fruits.indexOf(lowest), 1);
            catchFruit(lowest, true);
          }
        }
        for (var j = fruits.length - 1; j >= 0; j--) {
          var f = fruits[j];
          f.vy = Math.min(320, f.vy + 180 * dt);
          f.y += f.vy * dt;
          if (f.y >= BASKET_Y - 10 && f.y <= BASKET_Y + 14 && Math.abs(f.x - bx) < bw / 2) { catchFruit(f, false); fruits.splice(j, 1); }
          else if (f.y > BASKET_Y + 14) { missed++; fxBurst(parts, f.x, GROUND, '#8a6a4a', 5, 90); fruits.splice(j, 1); }
        }
        fxUpdate(parts, dt, 120);
        if (caught >= g.goal) { done = true; completeMini(); return; }
        if (missed >= LOSE) { done = true; miniFail(g, 'Too many bruised fruit: ' + missed + ' dropped.'); return; }
        hud(caught + ' / ' + g.goal);
      },
      pointer: function (x, y) {
        if (done) return;
        var i = sh.hit(x, y);
        if (i >= 0) { sh.cur = i; cash -= sh.buy(i, cash); return; }
        if (y > 80 && y < 460) tx = clamp(x, bw / 2, W() - bw / 2);
      },
      draw: function () {
        clear('#0b1a12');
        var sky = ctx2d.createLinearGradient(0, 80, 0, 440);
        sky.addColorStop(0, '#1d3b5c'); sky.addColorStop(1, '#0d1f1a');
        rect(0, 80, W(), 360, sky);
        for (var i = 0; i < trees; i++) {
          var tx0 = treeX(i), sw = Math.sin(sway * 1.3 + i) * 3;
          rect(tx0 - 5, 178, 10, 30, '#5a3a22', 1);
          circle(tx0 + sw, 176, 36, '#2f7d46');
          circle(tx0 - 14 + sw, 186, 22, '#3b9a55');
          circle(tx0 + 16 + sw, 186, 22, '#3b9a55');
        }
        rect(0, GROUND, W(), H() - GROUND, '#3a2a1a', 1);
        for (var k = 0; k < fruits.length; k++) {
          var f = fruits[k];
          glow(f.x, f.y, 14, f.gold ? 'rgba(255,209,92,.35)' : 'rgba(255,120,80,.25)');
          circle(f.x, f.y, f.gold ? 7 : 6, f.gold ? C.gold : '#ff6b4a');
        }
        rect(bx - bw / 2, BASKET_Y, bw, 16, '#a0703c', 1);
        rect(bx - bw / 2 - 4, BASKET_Y - 6, bw + 8, 6, '#c08a50', 1);
        if (drones) { circle(bx, BASKET_Y - 40, 7, C.cyan); strokeCircle(bx, BASKET_Y - 40, 12, 'rgba(85,230,255,.4)', 2); }
        fxDraw(parts);
        text('Caught ' + caught + ' / ' + g.goal + '   Coins ' + fmt(cash), W() / 2, 104, 17, '#fff', 'center', 800);
        text('Dropped ' + missed + ' / ' + LOSE + '   Trees ' + trees, W() / 2, 126, 12, '#ffb36e', 'center');
        text('Stick or tap to move the basket. A buys.', W() / 2, 456 - 2, 10, '#788', 'center');
        sh.draw(14, 462, W() - 28, 32, cash);
      },
      stop: function () { done = true; }
    };
    function treeX(i) { return W() * (i + 1) / (trees + 1); }
  }

  // 3. Timing Mint: stop the needle in the sweet spot to stamp coins.
  function gameTimingMint(g) {
    var coins = 0, total = 0, strikes = 0, streak = 0, t = 0, ph = 0, spd = 0.9, zone = 0.24, base = 10;
    var streakCap = 5, maxStrikes = 3, cool = 0, done = false, parts = [], pop = [], lastQ = '';
    var sh = makeShop([
      { id: 'zone', name: 'Wider Sweet Spot', desc: 'Target zone +15%', base: 25, grow: 1.5, max: 5, apply: function () { zone *= 1.15; } },
      { id: 'slow', name: 'Dampened Needle', desc: 'Needle 10% slower', base: 40, grow: 1.6, max: 6, apply: function () { spd *= 0.9; } },
      { id: 'press', name: 'Gilded Press', desc: 'Base payout +10', base: 60, grow: 1.7, max: 6, apply: function () { base += 10; } },
      { id: 'streak', name: 'Streak Ledger', desc: 'Streak bonus cap +2', base: 120, grow: 1.8, max: 5, apply: function () { streakCap += 2; } },
      { id: 'shield', name: 'Second Chance', desc: '+1 allowed miss', base: 300, grow: 2.5, max: 2, apply: function () { maxStrikes++; } }
    ]);
    function needle() { var tri = ph % 2; return tri < 1 ? tri : 2 - tri; }
    function stamp() {
      if (cool > 0 || done) return;
      cool = 0.18;
      var p = needle(), off = Math.abs(p - 0.5);
      var sx = 30 + p * (W() - 60), sy = 300;
      if (off <= zone / 6) {
        var v = Math.round(base * 3 * (1 + Math.min(streak, streakCap) * 0.1));
        streak++; coins += v; total += v; lastQ = 'PERFECT';
        fxBurst(parts, sx, sy - 30, C.gold, 18, 200);
        pop.push({ x: W() / 2, y: 230, s: '+' + v, life: 0.8, c: C.gold });
        beep(900, 1400, 0.08, 'square', 0.06);
      } else if (off <= zone / 2) {
        var v2 = Math.round(base * (1 + Math.min(streak, streakCap) * 0.1));
        streak++; coins += v2; total += v2; lastQ = 'Good';
        fxBurst(parts, sx, sy - 30, C.cyan, 8, 140);
        pop.push({ x: W() / 2, y: 230, s: '+' + v2, life: 0.8, c: C.cyan });
        beep(620, 780, 0.06, 'square', 0.05);
      } else {
        strikes++; streak = 0; lastQ = 'Miss';
        fxBurst(parts, sx, sy - 30, C.red, 10, 160);
        beep(200, 120, 0.15, 'sawtooth', 0.06);
      }
    }
    return {
      update: function (dt) {
        if (done) return;
        t += dt; cool = Math.max(0, cool - dt);
        ph += dt * spd * (1 + t / 150);
        if (pressed('a')) stamp();
        if (pressed('b')) sh.cur = (sh.cur + 1) % sh.defs.length;
        if (pressed('c')) coins -= sh.buy(sh.cur, coins);
        for (var i = pop.length - 1; i >= 0; i--) { pop[i].y -= 50 * dt; pop[i].life -= dt; if (pop[i].life <= 0) pop.splice(i, 1); }
        fxUpdate(parts, dt, 80);
        if (total >= g.goal) { done = true; completeMini(); return; }
        if (strikes > maxStrikes) { done = true; miniFail(g, 'Three misses and the mint shut down.'); return; }
        hud(fmt(total) + ' / ' + g.goal);
      },
      pointer: function (x, y) {
        if (done) return;
        var i = sh.hit(x, y);
        if (i >= 0) { sh.cur = i; coins -= sh.buy(i, coins); return; }
        if (y > 80 && y < 440) stamp();
      },
      draw: function () {
        clear('#0a0e1a');
        glow(W() / 2, 170, 150, 'rgba(255,209,92,.18)');
        circle(W() / 2, 170, 56, '#b58a2e');
        circle(W() / 2, 170, 48, C.gold);
        strokeCircle(W() / 2, 170, 40, '#fff3b0', 2);
        text('MINT', W() / 2, 177, 18, '#5a3d10', 'center', 900);
        for (var i = 0; i < pop.length; i++) { ctx2d.globalAlpha = clamp(pop[i].life / 0.8, 0, 1); text(pop[i].s, pop[i].x, pop[i].y, 20, pop[i].c, 'center', 800); }
        ctx2d.globalAlpha = 1;
        var bx0 = 30, bw0 = W() - 60, by0 = 300, bh0 = 56;
        rect(bx0, by0, bw0, bh0, '#1a2238', 1);
        var zx = bx0 + bw0 * (0.5 - zone / 2), zw = bw0 * zone;
        rect(zx, by0, zw, bh0, 'rgba(85,255,154,.35)', 1);
        rect(bx0 + bw0 * (0.5 - zone / 6), by0, bw0 * zone / 3, bh0, 'rgba(255,209,92,.55)', 1);
        outline(bx0, by0, bw0, bh0, '#3a4a70');
        var nx = bx0 + needle() * bw0;
        rect(nx - 2, by0 - 10, 4, bh0 + 20, '#fff', 1);
        circle(nx, by0 - 12, 5, C.cyan);
        fxDraw(parts);
        text('Streak ' + streak + '   Misses ' + Math.max(0, strikes) + ' / ' + (maxStrikes + 1) + '   ' + lastQ, W() / 2, 100, 14, '#fff', 'center', 700);
        text('Stamp in the gold zone. Tap the bar or press A.', W() / 2, 380, 11, '#788', 'center');
        sh.draw(14, 396, W() - 28, 44, coins);
        text('C buys', W() - 14, 390, 10, '#788', 'right');
      },
      stop: function () { done = true; }
    };
  }

  // 4. Merge Foundry: fuse equal tiers on a small grid until a high tier appears.
  function gameMergeFoundry(g) {
    var COLS = 4, ROWS = 5, grid = [], sel = -1, best = 0, spawnT = 0, t = 0, merges = 0, done = false, parts = [];
    var cw = 0, gx0 = 0, gy0 = 150, TIERS = ['#5a6780', '#55e6ff', '#55ff9a', '#ffe36e', '#ff914d', '#ff4fd8', '#a978ff', '#4da3ff', '#ff5570', '#ffffff'];
    for (var i = 0; i < COLS * ROWS; i++) grid.push(0);
    function empties() { var e = []; for (var k = 0; k < grid.length; k++) if (!grid[k]) e.push(k); return e; }
    function hasPair() {
      for (var a = 0; a < grid.length; a++) {
        if (!grid[a]) continue;
        for (var b = a + 1; b < grid.length; b++) if (grid[b] === grid[a]) return true;
      }
      return false;
    }
    function spawn() {
      var e = empties();
      if (!e.length) return;
      var r = Math.random(), tier = r < 0.7 ? 1 : (r < 0.93 ? 2 : 3);
      grid[pick(e)] = tier;
    }
    function layout() {
      cw = Math.min((W() - 40) / COLS, 92);
      gx0 = (W() - cw * COLS) / 2;
    }
    return {
      update: function (dt) {
        if (done) return;
        layout();
        t += dt; spawnT += dt;
        if (spawnT >= Math.max(1.1, 1.8 - t * 0.004)) { spawnT = 0; spawn(); }
        if (!empties().length && !hasPair()) { done = true; miniFail(g, 'The foundry jammed with no pairs left.'); return; }
        fxUpdate(parts, dt, 40);
        if (best >= g.goal) { done = true; completeMini(); return; }
        hud('Best tier ' + best + ' / ' + g.goal);
      },
      pointer: function (x, y) {
        if (done) return;
        layout();
        var col = Math.floor((x - gx0) / cw), row = Math.floor((y - gy0) / cw);
        if (col < 0 || col >= COLS || row < 0 || row >= ROWS) { sel = -1; return; }
        var idx = row * COLS + col;
        if (!grid[idx]) { sel = -1; return; }
        if (sel < 0) { sel = idx; return; }
        if (sel === idx) { sel = -1; return; }
        if (grid[sel] === grid[idx]) {
          grid[idx]++; grid[sel] = 0; merges++;
          best = Math.max(best, grid[idx]);
          var cx = gx0 + (col + 0.5) * cw, cy = gy0 + (row + 0.5) * cw;
          fxBurst(parts, cx, cy, TIERS[grid[idx]], 22, 220);
          beep(440 + grid[idx] * 60, 880 + grid[idx] * 60, 0.1, 'triangle', 0.07);
          sel = -1;
        } else {
          sel = idx;
        }
      },
      draw: function () {
        layout();
        clear('#0b0f1c');
        var fl = ctx2d.createLinearGradient(0, gy0, 0, gy0 + ROWS * cw);
        fl.addColorStop(0, '#1a2140'); fl.addColorStop(1, '#0a0e1c');
        rect(gx0 - 6, gy0 - 6, COLS * cw + 12, ROWS * cw + 12, fl, 1);
        for (var i = 0; i < grid.length; i++) {
          var c = i % COLS, r = Math.floor(i / COLS);
          var x = gx0 + c * cw + 5, y = gy0 + r * cw + 5, s = cw - 10;
          rect(x, y, s, s, 'rgba(255,255,255,.05)', 1);
          if (!grid[i]) continue;
          var col = TIERS[Math.min(grid[i], TIERS.length - 1)];
          glow(x + s / 2, y + s / 2, s * 0.8, col);
          rect(x + 4, y + 4, s - 8, s - 8, col, 1);
          text(String(grid[i]), x + s / 2, y + s / 2 + 7, 22, '#0b0f1c', 'center', 900);
          if (i === sel) outline(x, y, s, s, '#fff');
        }
        fxDraw(parts);
        text('Best tier ' + best + '   Fusions ' + merges, W() / 2, 104, 18, '#fff', 'center', 800);
        text('Goal: forge tier ' + g.goal + '. Tap two equal tiles to fuse them.', W() / 2, 126, 12, '#9aa8c0', 'center');
        text('Tiers are 1 to 10. Tiles arrive every few seconds.', W() / 2, gy0 + ROWS * cw + 30, 11, '#788', 'center');
      },
      stop: function () { done = true; }
    };
  }

  // 5. Ant Colony: ants haul food home; tap a pile to scent it; hatch and upgrade the colony.
  function gameAntColony(g) {
    var food = 0, delivered = 0, t = 0, done = false, LIMIT = 300, cap = 1, spdMul = 1, scentTime = 6, pileMul = 1;
    var ants = [], piles = [], parts = [], NEST = { x: 0, y: 420 }, ph = 0, frontiers = 0;
    function newPile(p) {
      var x = rand(40, W() - 40), y = rand(130, 360);
      p = p || {};
      p.x = x; p.y = y; p.amt = Math.round(rand(14, 30) * pileMul); p.max = p.amt; p.scent = 0; p.respawn = undefined;
      return p;
    }
    function hatch() {
      ants.push({ x: NEST.x, y: NEST.y, st: 0, load: 0, tgt: null, seed: rand(0, 6) });
    }
    var sh = makeShop([
      { id: 'hatch', name: 'Hatch an Ant', desc: 'Spawn one more worker (max 27)', base: 15, grow: 1.12, max: 27, apply: function () { hatch(); } },
      { id: 'jaw', name: 'Stronger Jaws', desc: 'Carry +1 food', base: 60, grow: 1.6, max: 4, apply: function () { cap++; } },
      { id: 'legs', name: 'Quick Legs', desc: 'Ants 15% faster', base: 80, grow: 1.5, max: 5, apply: function () { spdMul *= 1.15; } },
      { id: 'scent', name: 'Long Scent', desc: 'Scents last 4s longer', base: 120, grow: 1.6, max: 4, apply: function () { scentTime += 4; } },
      { id: 'dig', name: 'Deep Caches', desc: 'Piles hold 50% more food', base: 250, grow: 2, max: 3, apply: function () { pileMul *= 1.5; } }
    ]);
    for (var i = 0; i < 3; i++) hatch();
    for (var k = 0; k < 5; k++) piles.push(newPile());
    function score(p, a) {
      var d = dist(a.x, a.y, p.x, p.y);
      return p.scent > 0 ? d * 0.5 : d;
    }
    function nearestPile(a) {
      var best = null, bs = Infinity;
      for (var i = 0; i < piles.length; i++) {
        var p = piles[i];
        if (p.amt <= 0) continue;
        var s = score(p, a);
        if (s < bs) { bs = s; best = p; }
      }
      return best;
    }
    return {
      update: function (dt) {
        if (done) return;
        t += dt; ph += dt;
        for (var r = 0; r < piles.length; r++) {
          var pl = piles[r];
          if (pl.scent > 0) pl.scent -= dt;
          if (pl.amt <= 0) {
            if (pl.respawn === undefined) pl.respawn = 2;
            pl.respawn -= dt;
            if (pl.respawn <= 0) newPile(pl);
          }
        }
        if (pressed('b')) sh.cur = (sh.cur + 1) % sh.defs.length;
        if (pressed('a')) food -= sh.buy(sh.cur, food);
        var sp = 58 * spdMul;
        for (var j = 0; j < ants.length; j++) {
          var a = ants[j];
          var tgt = a.st === 0 ? (a.tgt && a.tgt.amt > 0 ? a.tgt : (a.tgt = nearestPile(a))) : NEST;
          if (!tgt) continue;
          var dx = tgt.x - a.x, dy = tgt.y - a.y, d = Math.hypot(dx, dy) || 1;
          var wig = Math.sin(ph * 6 + a.seed) * 0.6;
          var ang = Math.atan2(dy, dx) + wig;
          a.x += Math.cos(ang) * sp * dt;
          a.y += Math.sin(ang) * sp * dt;
          if (a.st === 0 && d < 9) {
            var take = Math.min(cap, tgt.amt);
            tgt.amt -= take; a.load = take; a.st = 1; a.tgt = null;
          } else if (a.st === 1 && d < 16) {
            if (a.load > 0) {
              delivered += a.load; food += a.load;
              fxBurst(parts, a.x, a.y, C.lime, 4, 60);
            }
            a.load = 0; a.st = 0;
          }
        }
        fxUpdate(parts, dt, 0);
        if (delivered >= g.goal) { done = true; completeMini(); return; }
        if (t >= LIMIT) { done = true; miniFail(g, 'Winter came. The colony gathered ' + fmt(delivered) + ' food.'); return; }
        hud(fmt(delivered) + ' / ' + g.goal);
      },
      pointer: function (x, y) {
        if (done) return;
        var i = sh.hit(x, y);
        if (i >= 0) { sh.cur = i; food -= sh.buy(i, food); return; }
        if (y < 80 || y > 445) return;
        var hit = null;
        for (var k = 0; k < piles.length; k++) {
          if (piles[k].amt > 0 && dist(x, y, piles[k].x, piles[k].y) < 40) { hit = piles[k]; break; }
        }
        if (hit) { hit.scent = scentTime; fxBurst(parts, hit.x, hit.y, C.cyan, 8, 90); }
      },
      draw: function () {
        clear('#0c0a08');
        var gr = ctx2d.createRadialGradient(W() / 2, 300, 40, W() / 2, 300, 300);
        gr.addColorStop(0, '#2a1e12'); gr.addColorStop(1, '#0c0a08');
        rect(0, 80, W(), 370, gr);
        for (var i = 0; i < piles.length; i++) {
          var p = piles[i];
          if (p.amt <= 0) continue;
          var fr = p.amt / p.max;
          if (p.scent > 0) glow(p.x, p.y, 36, 'rgba(85,230,255,.35)');
          circle(p.x, p.y, 8 + 14 * fr, '#c9a24a');
          circle(p.x - 4, p.y - 3, 4 + 6 * fr, '#f2d27a');
          text(String(p.amt), p.x, p.y - 20, 11, '#fff', 'center', 700);
        }
        glow(NEST.x, NEST.y, 60, 'rgba(255,120,60,.25)');
        circle(NEST.x, NEST.y, 22, '#4a2a16');
        circle(NEST.x, NEST.y, 14, '#2b160b');
        for (var j = 0; j < ants.length; j++) {
          var a = ants[j];
          circle(a.x, a.y, 3, '#1a0f08');
          if (a.load > 0) circle(a.x + 2, a.y - 2, 2.2, C.gold);
        }
        fxDraw(parts);
        text('Delivered ' + delivered + ' / ' + g.goal + '   Ants ' + ants.length, W() / 2, 104, 17, '#fff', 'center', 800);
        text('Winter in ' + Math.max(0, Math.ceil(LIMIT - t)) + 's   Carry ' + cap + '   Stock ' + fmt(food), W() / 2, 126, 12, '#ffb36e', 'center');
        text('Tap a food pile to scent it. Ants flock to scent.', W() / 2, 456, 11, '#788', 'center');
        sh.draw(14, 466, W() - 28, 30, food);
      },
      stop: function () { done = true; }
    };
  }

  // 6. Star Rebirth: gather stardust, buy automation, then rebirth for permanent essence.
  function gameStarRebirth(g) {
    var dust = 0, total = 0, essence = 0, t = 0, done = false, LIMIT = 600, parts = [], tapPow = 1, tapMul = 1, auto = 0, autoMul = 1, rot = 0, pulse = 0;
    function gm() { return 1 + essence * 0.75; }
    function threshold() { return Math.round(300 * Math.pow(1.9, essence)); }
    function mkDefs() {
      return [
        { id: 'tap', name: 'Stardust Touch', desc: '+1 dust per tap', base: 10, grow: 1.4, apply: function () { tapPow += 1; } },
        { id: 'comet', name: 'Comet Drone', desc: '+2 dust per second', base: 40, grow: 1.5, apply: function () { auto += 2; } },
        { id: 'lens', name: 'Gravity Lens', desc: 'Taps x2', base: 150, grow: 2.2, max: 3, req: 'tap', apply: function () { tapMul *= 2; } },
        { id: 'nebula', name: 'Nebula Engine', desc: 'Automation x1.5', base: 300, grow: 2, max: 5, req: 'comet', apply: function () { autoMul *= 1.5; } }
      ];
    }
    var sh = makeShop(mkDefs());
    var rebirthRect = [W() / 2 - 105, 330, 210, 36];
    function tap() {
      var v = tapPow * tapMul * gm();
      dust += v; total += v; pulse = 1;
      fxBurst(parts, W() / 2 + rand(-50, 50), 260 + rand(-50, 50), C.yellow, 5, 160);
      beep(1000, 1200, 0.03, 'sine', 0.04);
    }
    function rebirth() {
      if (dust < threshold()) return;
      essence++;
      dust = 0; tapPow = 1; tapMul = 1; auto = 0; autoMul = 1;
      sh = makeShop(mkDefs());
      fxBurst(parts, W() / 2, 260, C.purple, 40, 320);
      beep(300, 900, 0.4, 'sawtooth', 0.07);
    }
    return {
      update: function (dt) {
        if (done) return;
        t += dt; rot += (0.4 + pulse * 2) * dt; pulse = Math.max(0, pulse - dt * 2.5);
        if (auto > 0) { var a = auto * autoMul * gm() * dt; dust += a; total += a; }
        if (pressed('c')) tap();
        if (pressed('b')) sh.cur = (sh.cur + 1) % sh.defs.length;
        if (pressed('a')) dust -= sh.buy(sh.cur, dust);
        fxUpdate(parts, dt, 30);
        if (essence >= g.goal) { done = true; completeMini(); return; }
        if (t >= LIMIT) { done = true; miniFail(g, 'The sky went dark with ' + essence + ' rebirths.'); return; }
        hud(essence + ' / ' + g.goal);
      },
      pointer: function (x, y) {
        if (done) return;
        if (x >= rebirthRect[0] && x <= rebirthRect[0] + rebirthRect[2] && y >= rebirthRect[1] && y <= rebirthRect[1] + rebirthRect[3]) { rebirth(); return; }
        if (dist(x, y, W() / 2, 260) < 110) { tap(); return; }
        var i = sh.hit(x, y);
        if (i >= 0) { sh.cur = i; dust -= sh.buy(i, dust); }
      },
      draw: function () {
        clear('#05040f');
        glow(W() / 2, 260, 180, 'rgba(169,120,255,' + (0.18 + pulse * 0.15).toFixed(3) + ')');
        var sr = 58 + pulse * 6;
        for (var k = 0; k < 8; k++) {
          var ang = rot + k * Math.PI / 4;
          line(W() / 2 + Math.cos(ang) * sr, 260 + Math.sin(ang) * sr, W() / 2 + Math.cos(ang) * (sr + 28), 260 + Math.sin(ang) * (sr + 28), 'rgba(255,227,110,.7)', 3);
        }
        circle(W() / 2, 260, sr, C.yellow);
        glow(W() / 2, 260, sr * 0.9, 'rgba(255,255,255,.35)');
        circle(W() / 2, 260, sr * 0.55, '#fff7d6');
        fxDraw(parts);
        var th = threshold();
        text('Dust ' + fmt(dust) + ' / Rebirth at ' + fmt(th), W() / 2, 104, 15, '#fff', 'center', 800);
        text('+' + fmt(auto * autoMul * gm()) + '/s   tap +' + fmt(tapPow * tapMul * gm()) + '   essence x' + gm().toFixed(2), W() / 2, 124, 12, '#c9b8ff', 'center');
        bar(W() / 2 - 120, 140, 240, 8, dust / th, C.purple);
        var rr = rebirthRect, can = dust >= th;
        rect(rr[0], rr[1], rr[2], rr[3], can ? '#7a4cff' : 'rgba(255,255,255,.08)', 1);
        text(can ? 'REBIRTH (+1 essence)' : 'Rebirth needs ' + fmt(th) + ' dust', W() / 2, rr[1] + 23, 13, can ? '#fff' : '#778', 'center', 800);
        text('Essence ' + essence + ' / ' + g.goal + '   Time ' + Math.max(0, Math.ceil(LIMIT - t)) + 's', W() / 2, 386, 12, '#ffb36e', 'center');
        sh.draw(14, 396, W() - 28, 46, dust);
      },
      stop: function () { done = true; }
    };
  }

  // 7. Dice Ladder: roll dice for pot, the multiplier climbs, bank before a 1 busts you.
  function gameDiceLadder(g) {
    var pot = 0, mult = 1, busts = 0, shields = 0, earned = 0, cash = 0, nd = 1, luck = 0, rung = 0.25;
    var vals = [1], rolling = 0, rollT = 0, done = false, parts = [], flash = '', flashT = 0, BUST_LIMIT = 4;
    var sh = makeShop([
      { id: 'dice', name: 'Extra Die', desc: '+1 die rolled (max 3)', base: 40, grow: 1.8, max: 3, apply: function () { nd++; } },
      { id: 'luck', name: 'Lucky Charm', desc: 'Reroll a 1 with 25% (max 3)', base: 60, grow: 1.7, max: 3, apply: function () { luck++; } },
      { id: 'rung', name: 'Ladder Rungs', desc: '+0.15 multiplier per roll', base: 50, grow: 1.6, max: 4, apply: function () { rung += 0.15; } },
      { id: 'shield', name: 'Bust Shield', desc: 'Absorb one bust', base: 120, grow: 2, max: 2, apply: function () { shields++; } }
    ]);
    while (vals.length < nd) vals.push(1);
    function roll() {
      if (rolling > 0 || done) return;
      rolling = 0.35;
      rollT = 0;
    }
    function resolve() {
      vals = [];
      for (var i = 0; i < nd; i++) {
        var v = randi(1, 6);
        if (v === 1 && Math.random() < luck * 0.25) v = randi(1, 6);
        vals.push(v);
      }
      if (vals.indexOf(1) >= 0) {
        if (shields > 0) { shields--; flash = 'Shield absorbed the 1!'; flashT = 1; beep(300, 500, 0.1, 'triangle', 0.05); }
        else {
          busts++; pot = 0; mult = 1; flash = 'BUST! Pot lost.'; flashT = 1.2;
          fxBurst(parts, W() / 2, 220, C.red, 24, 260);
          beep(260, 90, 0.35, 'sawtooth', 0.07);
        }
      } else {
        var sum = vals.reduce(function (a, b) { return a + b; }, 0);
        var gain = Math.round(sum * mult);
        pot += gain; mult += rung;
        flash = '+' + gain + ' to pot'; flashT = 0.9;
        fxBurst(parts, W() / 2, 220, C.lime, 10, 180);
        beep(520, 780, 0.07, 'square', 0.05);
      }
    }
    function bank() {
      if (pot <= 0 || done) return;
      earned += pot; cash += pot;
      flash = 'Banked ' + fmt(pot); flashT = 1;
      fxBurst(parts, W() / 2, 220, C.gold, 26, 240);
      beep(700, 1100, 0.12, 'triangle', 0.07);
      pot = 0; mult = 1;
    }
    return {
      update: function (dt) {
        if (done) return;
        if (rolling > 0) {
          rolling -= dt; rollT += dt;
          if (Math.floor(rollT * 20) !== Math.floor((rollT - dt) * 20)) for (var i = 0; i < nd; i++) vals[i] = randi(1, 6);
          if (rolling <= 0) { resolve(); if (busts >= BUST_LIMIT) { done = true; miniFail(g, 'Busted ' + busts + ' times.'); return; } }
        }
        if (pressed('a')) roll();
        if (pressed('c')) bank();
        if (pressed('b')) sh.cur = (sh.cur + 1) % sh.defs.length;
        if (flashT > 0) flashT -= dt;
        fxUpdate(parts, dt, 60);
        if (earned >= g.goal) { done = true; completeMini(); return; }
        hud(fmt(earned) + ' / ' + g.goal);
      },
      pointer: function (x, y) {
        if (done) return;
        if (x > W() / 2 - 120 && x < W() / 2 - 10 && y > 280 && y < 330) { roll(); return; }
        if (x > W() / 2 + 10 && x < W() / 2 + 120 && y > 280 && y < 330) { bank(); return; }
        var i = sh.hit(x, y);
        if (i >= 0) { sh.cur = i; cash -= sh.buy(i, cash); }
      },
      draw: function () {
        clear('#0d0a1c');
        glow(W() / 2, 220, 170, 'rgba(255,209,92,.12)');
        var n = vals.length, sz = 60, gap = 14, total = n * sz + (n - 1) * gap, x0 = W() / 2 - total / 2;
        for (var i = 0; i < n; i++) {
          var x = x0 + i * (sz + gap), y = 180 + (rolling > 0 ? Math.sin(rollT * 30 + i) * 4 : 0);
          rect(x, y, sz, sz, '#f4f1ff', 1);
          var v = vals[i], p = [];
          var c = sz / 2, o = sz * 0.26, m = sz / 2;
          var spots = { 1: [[c, c]], 2: [[o, o], [sz - o, sz - o]], 3: [[o, o], [c, c], [sz - o, sz - o]], 4: [[o, o], [sz - o, o], [o, sz - o], [sz - o, sz - o]], 5: [[o, o], [sz - o, o], [c, c], [o, sz - o], [sz - o, sz - o]], 6: [[o, o], [sz - o, o], [o, c], [sz - o, c], [o, sz - o], [sz - o, sz - o]] };
          (spots[v] || spots[1]).forEach(function (s) { circle(x + s[0], y + s[1], 5, '#1a1433'); });
        }
        fxDraw(parts);
        text('Pot ' + fmt(pot) + '   x' + mult.toFixed(2) + '   Busts ' + busts + ' / ' + BUST_LIMIT + '   Shields ' + shields, W() / 2, 104, 13, '#fff', 'center', 700);
        text('Banked ' + fmt(earned) + ' / ' + g.goal, W() / 2, 126, 12, '#ffb36e', 'center');
        if (flashT > 0) text(flash, W() / 2, 268, 16, flash.indexOf('BUST') >= 0 ? C.red : C.lime, 'center', 800);
        rect(W() / 2 - 120, 280, 110, 50, '#2f8f5a', 1);
        text('ROLL (A)', W() / 2 - 65, 311, 14, '#fff', 'center', 800);
        rect(W() / 2 + 10, 280, 110, 50, '#b8862a', 1);
        text('BANK (C)', W() / 2 + 65, 311, 14, '#fff', 'center', 800);
        text('Any 1 in a roll busts. Tap an upgrade to buy it.', W() / 2, 352, 11, '#788', 'center');
        sh.draw(14, 364, W() - 28, 56, cash);
      },
      stop: function () { done = true; }
    };
  }

  // 8. Crystal Drill: dig down, pick up crystals, refuel and sell at the surface.
  function gameCrystalDrill(g) {
    var D = 0, vx = 0, drillX = 0, fuel = 100, fuelMax = 100, load = 0, loadVal = 0, cap = 10, rad = 18;
    var valMul = 1, dig = 1, cash = 0, total = 0, items = [], nextRow = 200, parts = [], shake = 0, done = false, t = 0;
    var sh = makeShop([
      { id: 'bit', name: 'Sharper Bit', desc: 'Pickup radius +6', base: 30, grow: 1.5, max: 4, apply: function () { rad += 6; } },
      { id: 'tank', name: 'Bigger Tank', desc: 'Fuel capacity +30%', base: 50, grow: 1.6, max: 4, apply: function () { fuelMax *= 1.3; } },
      { id: 'cargo', name: 'Cargo Hold', desc: 'Holds +5 crystals', base: 40, grow: 1.5, max: 5, apply: function () { cap += 5; } },
      { id: 'auger', name: 'Turbo Auger', desc: 'Dig speed +20%', base: 80, grow: 1.7, max: 4, apply: function () { dig *= 1.2; } },
      { id: 'polish', name: 'Gem Polisher', desc: 'Crystal value x1.4', base: 120, grow: 1.9, max: 4, apply: function () { valMul *= 1.4; } }
    ]);
    fuel = fuelMax;
    function spawnRows() {
      while (nextRow < D + 700) {
        var n = randi(1, 3);
        for (var i = 0; i < n; i++) {
          var rock = Math.random() < 0.22;
          items.push({ x: rand(20, W() - 20), y: nextRow + rand(-10, 10), rock: rock, v: 1 + Math.floor(nextRow / 500), got: false });
        }
        nextRow += rand(34, 62);
      }
    }
    function sell() {
      if (load <= 0) return;
      total += loadVal; cash += loadVal;
      beep(660, 990, 0.12, 'triangle', 0.06);
      fxBurst(parts, drillX, 262, C.gold, 14, 200);
      load = 0; loadVal = 0;
    }
    return {
      update: function (dt) {
        if (done) return;
        t += dt; shake = Math.max(0, shake - dt * 3);
        var ay = AY(), ax = AX();
        if (pressed('b')) sh.cur = (sh.cur + 1) % sh.defs.length;
        if (pressed('a')) cash -= sh.buy(sh.cur, cash);
        vx = clamp(ax * 180, -180, 180);
        drillX = clamp(drillX + vx * dt, 16, W() - 16);
        // auto-descent, stick down digs faster, stick up climbs
        var vy = ay >= 0 ? 50 * dig + 140 * ay : 50 * dig + 200 * ay;
        D += vy * dt;
        fuel -= dt * (1 + Math.max(0, vy) / 90) * 0.9;
        if (D <= 0) {
          D = 0;
          sell();
          fuel = fuelMax;
        }
        spawnRows();
        for (var j = 0; j < items.length; j++) {
          var c = items[j];
          if (c.got) continue;
          var sy = 260 + (c.y - D);
          if (Math.abs(sy - 260) < rad + 10 && Math.abs(c.x - drillX) < rad + 6) {
            c.got = true;
            if (c.rock) { fuel -= 12; shake = 1; fxBurst(parts, c.x, sy, '#8a8f99', 12, 150); beep(120, 60, 0.2, 'sawtooth', 0.07); }
            else if (load < cap) { load++; loadVal += c.v * valMul * 10; fxBurst(parts, c.x, sy, C.cyan, 6, 120); beep(860, 1200, 0.04, 'sine', 0.04); }
          }
        }
        if (D > 0 && items.length > 400) items.splice(0, 200);
        fxUpdate(parts, dt, 30);
        if (fuel <= 0) { done = true; miniFail(g, 'Out of fuel ' + Math.round(D / 10) + ' m underground.'); return; }
        if (total >= g.goal) { done = true; completeMini(); return; }
        hud(fmt(total) + ' / ' + g.goal);
      },
      pointer: function (x, y) {
        if (done) return;
        var i = sh.hit(x, y);
        if (i >= 0) { sh.cur = i; cash -= sh.buy(i, cash); }
      },
      draw: function () {
        var depth = clamp(D / 1200, 0, 1);
        var bgc = depth < 0.01 ? '#3b8fd1' : '#1c120c';
        clear(bgc);
        if (D < 60) { var sg = ctx2d.createLinearGradient(0, 80, 0, 300); sg.addColorStop(0, '#6cc4ff'); sg.addColorStop(1, '#bfe9ff'); rect(0, 80, W(), 220, sg); }
        var grd = ctx2d.createLinearGradient(0, 300, 0, 680);
        grd.addColorStop(0, 'rgba(120,70,30,' + (0.6 + depth * 0.2).toFixed(2) + ')'); grd.addColorStop(1, 'rgba(40,10,50,0.9)');
        rect(0, 300, W(), 380, grd);
        var gy = 260 - D;
        if (gy > 80 && gy < 680) { rect(0, gy, W(), 680 - gy, '#4a3320', 1); line(0, gy, W(), gy, '#7bd06a', 3); }
        var ox = shake ? rand(-3, 3) : 0;
        ctx2d.save(); ctx2d.translate(ox, 0);
        for (var i = 0; i < items.length; i++) {
          var it = items[i];
          if (it.got) continue;
          var sy = 260 + (it.y - D);
          if (sy < 80 || sy > 680) continue;
          if (it.rock) { polygon([[it.x - 10, sy + 6], [it.x - 4, sy - 8], [it.x + 8, sy - 6], [it.x + 11, sy + 6]], '#6b6f78'); }
          else {
            glow(it.x, sy, 16, 'rgba(85,230,255,.3)');
            polygon([[it.x, sy - 8], [it.x + 7, sy], [it.x, sy + 8], [it.x - 7, sy]], it.v > 2 ? C.pink : C.cyan);
          }
        }
        ctx2d.restore();
        circle(drillX, 260, 13, '#d9dde6');
        polygon([[drillX - 9, 270], [drillX + 9, 270], [drillX, 290]], '#ffb36e');
        strokeCircle(drillX, 260, rad, 'rgba(255,255,255,.12)', 1);
        fxDraw(parts);
        text('Depth ' + Math.round(D / 10) + ' m   Cargo ' + load + ' / ' + cap + '   ' + fmt(loadVal) + ' value', W() / 2, 104, 14, '#fff', 'center', 800);
        text('Total sold ' + fmt(total) + ' / ' + g.goal + '   Coins ' + fmt(cash), W() / 2, 124, 12, '#ffe36e', 'center');
        bar(14, 140, W() - 28, 8, fuel / fuelMax, fuel / fuelMax > 0.25 ? '#55ff9a' : C.red);
        text('Fuel', 14, 136, 10, '#9aa8c0', 'left');
        text('Joystick: steer and dig down, pull up to surface and sell. Surface refuels.', W() / 2, 390, 10, '#dfe6ff', 'center');
        sh.draw(14, 398, W() - 28, 46, cash);
      },
      stop: function () { done = true; }
    };
  }

  return {
    engines: {
      n17_gearworks: gameGearworks,
      n17_orchard_drop: gameOrchard,
      n17_timing_mint: gameTimingMint,
      n17_merge_foundry: gameMergeFoundry,
      n17_ant_colony: gameAntColony,
      n17_star_rebirth: gameStarRebirth,
      n17_dice_ladder: gameDiceLadder,
      n17_crystal_drill: gameCrystalDrill
    },
    minis: [
      { id: 'n17_gearworks', title: 'Gearworks Tycoon', icon: '⚙️', cat: 'SIMULATION', desc: 'Tap the brass machine for gears, then buy teeth, oil, boilers and mills. Five minutes to reach the quota.', engine: 'n17_gearworks', goal: 2500 },
      { id: 'n17_orchard_drop', title: 'Orchard Drop', icon: '🍐', cat: 'SIMULATION', desc: 'Trees drop fruit. Steer the basket, plant more trees, hire a drone and catch golden pears before too many fall.', engine: 'n17_orchard_drop', goal: 400 },
      { id: 'n17_timing_mint', title: 'Timing Mint', icon: '🪙', cat: 'ARCADE', desc: 'A needle sweeps the bar. Stamp coins in the gold zone to build streaks. Three misses shut the mint down.', engine: 'n17_timing_mint', goal: 2500 },
      { id: 'n17_merge_foundry', title: 'Merge Foundry', icon: '🔶', cat: 'PUZZLE', desc: 'Fuse two equal tiles into the next tier on a tight grid. Forge tier 7 before the board jams.', engine: 'n17_merge_foundry', goal: 7 },
      { id: 'n17_ant_colony', title: 'Ant Colony', icon: '🐜', cat: 'SIMULATION', desc: 'Your ants haul food to the nest. Scent piles to pull the swarm, hatch more workers and beat winter.', engine: 'n17_ant_colony', goal: 600 },
      { id: 'n17_star_rebirth', title: 'Star Rebirth', icon: '⭐', cat: 'SIMULATION', desc: 'Gather stardust, automate the sky, then rebirth for permanent essence. Reach six rebirths before the night ends.', engine: 'n17_star_rebirth', goal: 6 },
      { id: 'n17_dice_ladder', title: 'Dice Ladder', icon: '🎲', cat: 'ARCADE', desc: 'Roll for a growing pot and bank before a 1 busts you. Buy extra dice, lucky charms and shields to climb higher.', engine: 'n17_dice_ladder', goal: 800 },
      { id: 'n17_crystal_drill', title: 'Crystal Drill', icon: '💎', cat: 'SIMULATION', desc: 'Dig deeper for bigger crystals, dodge rocks, and surface to sell and refuel. Upgrade the drill to sell 900 worth.', engine: 'n17_crystal_drill', goal: 900 }
    ],
    aaa: []
  };
})();
