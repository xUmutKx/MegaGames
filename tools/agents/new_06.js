window.__AG_new_06 = (function () {
  /* ---------- shared drawing helpers ---------- */
  function rr(x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx2d.beginPath();
    ctx2d.moveTo(x + r, y);
    ctx2d.lineTo(x + w - r, y);
    ctx2d.arcTo(x + w, y, x + w, y + r, r);
    ctx2d.lineTo(x + w, y + h - r);
    ctx2d.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx2d.lineTo(x + r, y + h);
    ctx2d.arcTo(x, y + h, x, y + h - r, r);
    ctx2d.lineTo(x, y + r);
    ctx2d.arcTo(x, y, x + r, y, r);
    ctx2d.closePath();
  }
  function box(x, y, w, h, r, c) { if (w <= 0 || h <= 0) return; rr(x, y, w, h, r); ctx2d.fillStyle = c; ctx2d.fill(); }
  function bar(x, y, w, h, f, c) {
    box(x, y, w, h, h / 2, 'rgba(255,255,255,.14)');
    if (f > 0) box(x, y, w * clamp(f, 0, 1), h, h / 2, c);
  }
  function ell(x, y, rx, ry, c) {
    ctx2d.save(); ctx2d.translate(x, y); ctx2d.scale(1, ry / rx); circle(0, 0, rx, c); ctx2d.restore();
  }
  function kitchen(top, bot) {
    var g = ctx2d.createLinearGradient(0, 0, 0, H());
    g.addColorStop(0, top); g.addColorStop(1, bot);
    ctx2d.fillStyle = g; ctx2d.fillRect(0, 0, W(), H());
    ctx2d.save(); ctx2d.globalAlpha = .06; ctx2d.strokeStyle = '#fff'; ctx2d.lineWidth = 1;
    for (var y = 0; y < H(); y += 28) {
      for (var x = ((y / 28) % 2) * 14 - 28; x < W(); x += 28) ctx2d.strokeRect(x, y, 28, 28);
    }
    ctx2d.restore();
  }
  function hex(c) { var n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function mix(a, b, t) {
    var A = hex(a), B = hex(b); t = clamp(t, 0, 1);
    return 'rgb(' + Math.round(A[0] + (B[0] - A[0]) * t) + ',' + Math.round(A[1] + (B[1] - A[1]) * t) + ',' + Math.round(A[2] + (B[2] - A[2]) * t) + ')';
  }
  function ramp(stops, t) {
    var n = stops.length - 1, f = clamp(t, 0, 1) * n, i = Math.min(n - 1, Math.floor(f));
    return mix(stops[i], stops[i + 1], f - i);
  }
  function pops() {
    var L = [];
    return {
      add: function (x, y, s, c) {
        L.push({ x: x, y: y, s: String(s), c: c || '#fff', t: 1 });
        if (L.length > 12) L.shift();
      },
      update: function (dt) {
        for (var i = L.length - 1; i >= 0; i--) {
          var q = L[i]; q.t -= dt; q.y -= 38 * dt;
          if (q.t <= 0) L.splice(i, 1);
        }
      },
      draw: function () {
        for (var i = 0; i < L.length; i++) {
          var q = L[i];
          ctx2d.globalAlpha = clamp(q.t * 1.6, 0, 1);
          text(q.s, q.x, q.y, 18, q.c, 'center', 900);
        }
        ctx2d.globalAlpha = 1;
      }
    };
  }
  // Shared horizontal selection step: a joystick push selects the next slot once per push.
  function selStep(st, ax, max) {
    if (Math.abs(ax) < .3) { st.moved = false; return; }
    if (!st.moved) { st.moved = true; st.sel = clamp(st.sel + (ax > 0 ? 1 : -1), 0, max); }
  }

  /* ---------- 1. Rhythm Chop ---------- */
  function gChop(g) {
    var done = false, pos = 0, dir = 1, n = 0, miss = 0, zc = .5, zone = .2, knife = 0, shake = 0, flash = 0, sliced = 0;
    var VEG = pick([['Carrot', '#ff8a3d'], ['Onion', '#eadcff'], ['Pepper', '#ff4d5e'], ['Cucumber', '#7fe07f']]);
    var fx = [], p = pops();
    zc = rand(.22, .78);
    return {
      update: function (dt) {
        if (done) return;
        hud('Chops ' + n + '/' + g.goal);
        var spd = Math.min(2.4, .8 + n * .06);
        pos += dir * spd * dt;
        if (pos >= 1) { pos = 1; dir = -1; } else if (pos <= 0) { pos = 0; dir = 1; }
        zone = Math.max(.07, .2 - n * .004);
        knife = Math.max(0, knife - dt * 5);
        shake = Math.max(0, shake - dt * 3);
        flash = Math.max(0, flash - dt);
        fxUpdate(fx, dt, 300); p.update(dt);
        if (pressed('a') || pressed('b') || pressed('c')) {
          var d = Math.abs(pos - zc);
          if (d <= zone / 2) {
            var perfect = d <= zone / 6;
            n++; sliced++; knife = 1; flash = .25;
            p.add(W() / 2, 250, perfect ? 'Perfect!' : 'Chop', perfect ? C.lime : C.white);
            fxBurst(fx, W() / 2 + rand(-30, 30), 330, perfect ? C.lime : C.yellow, perfect ? 22 : 12, 200);
            beep(520, perfect ? 960 : 720, .08, 'square', .18);
            zc = rand(.22, .78);
            if (n >= g.goal) { done = true; completeMini(); }
          } else {
            miss++; shake = 1; p.add(W() / 2, 250, 'Miss', C.red);
            beep(170, 90, .2, 'sawtooth', .2);
            if (miss >= 3) { done = true; miniFail(g, 'Three bad chops. The board is a mess.'); }
          }
        }
      },
      draw: function () {
        kitchen('#2b1d13', '#120b07');
        ctx2d.save();
        var sh = shake * 6; ctx2d.translate(rand(-sh, sh), rand(-sh, sh));
        var tx = 40, tw = W() - 80, ty = 190;
        box(tx - 12, ty - 20, tw + 24, 40, 20, 'rgba(0,0,0,.4)');
        box(tx + tw * (zc - zone / 2), ty - 10, tw * zone, 20, 10, flash > 0 ? C.lime : 'rgba(140,255,170,.6)');
        circle(tx + tw * pos, ty, 13, '#fff');
        strokeCircle(tx + tw * pos, ty, 18, C.cyan, 2);
        box(W() / 2 - 130, 300, 260, 120, 18, '#b57b48');
        box(W() / 2 - 130, 300, 260, 10, 6, 'rgba(255,255,255,.12)');
        ell(W() / 2 - 40, 360, 56, 36, VEG[1]);
        ell(W() / 2 - 40, 356, 44, 26, 'rgba(255,255,255,.18)');
        for (var i = 0; i < Math.min(sliced, 12); i++) {
          ell(W() / 2 + 30 + (i % 4) * 22, 338 + Math.floor(i / 4) * 12, 10, 6, VEG[1]);
        }
        var ky = 150 + 150 * knife;
        polygon([[W() / 2 - 6, ky - 70], [W() / 2 + 6, ky - 70], [W() / 2 + 6, ky], [W() / 2, ky + 18], [W() / 2 - 6, ky]], '#dfe6ee');
        box(W() / 2 - 10, ky - 100, 20, 34, 8, '#2b2b33');
        ctx2d.restore();
        text('Misses ' + miss + '/3', 24, 470, 15, C.red, 'left', 800);
        text(VEG[0], W() - 24, 470, 15, C.white, 'right', 800);
        p.draw(); fxDraw(fx);
      }
    };
  }

  /* ---------- 2. Pancake Toss ---------- */
  function gFlip(g) {
    var done = false, PW = 124, panX = W() / 2, panY = H() - 260;
    var px = panX, py = panY - 8, vy = 0, air = false, airT = 0, spin = 0, drift = 0, cool = 0, hide = false;
    var n = 0, lives = 3, fx = [], p = pops();
    return {
      update: function (dt) {
        if (done) return;
        hud('Flips ' + n + '/' + g.goal + '   Pancakes ' + lives);
        panX = clamp(panX + AX() * 340 * dt, PW / 2 + 16, W() - PW / 2 - 16);
        cool = Math.max(0, cool - dt);
        fxUpdate(fx, dt, 260); p.update(dt);
        if (!air) {
          px = panX; py = panY - 8;
          if (cool <= 0) hide = false;
          var pr = pressed('a');
          if (pr && !hide && cool <= 0) {
            air = true; airT = 0; spin = 0;
            vy = -rand(480, 560); drift = rand(-16, 16);
            beep(380, 620, .12, 'triangle', .2);
          }
        } else {
          airT += dt; spin += dt * 9;
          vy += 900 * dt; py += vy * dt; px += drift * dt;
          if (vy > 0 && py >= panY - 8) {
            air = false;
            if (Math.abs(px - panX) <= PW / 2 - 8) {
              n++; cool = .12;
              var big = airT > .95;
              p.add(panX, panY - 80, big ? 'Big flip!' : 'Flip', big ? C.gold : C.white);
              fxBurst(fx, panX, panY - 10, big ? C.gold : C.yellow, big ? 24 : 12, 230);
              beep(600, big ? 1000 : 820, .1, 'triangle', .2);
              if (n >= g.goal) { done = true; completeMini(); }
            } else {
              lives--; hide = true; cool = .8;
              p.add(px, panY - 40, 'Splat', C.red);
              fxBurst(fx, px, panY, '#f2c26b', 14, 160);
              beep(180, 70, .25, 'sawtooth', .2);
              if (lives <= 0) { done = true; miniFail(g, 'No pancakes left. Land them on the pan.'); }
            }
          }
        }
      },
      draw: function () {
        kitchen('#23202b', '#0c0a10');
        box(0, H() - 150, W(), 150, 0, '#1f1d24');
        box(panX - PW / 2, panY, PW, 16, 8, '#4a4b57');
        box(panX - PW / 2 + 6, panY + 3, PW - 12, 6, 3, '#6e7080');
        box(panX + PW / 2 - 4, panY + 4, 60, 9, 4, '#2c2d35');
        if (!hide) {
          var sy = air ? Math.max(.12, Math.abs(Math.cos(spin))) : 1;
          var lift = air ? clamp((panY - py) / 240, 0, 1) : 0;
          var cx = air ? px : panX, yy = air ? py : panY - 8;
          if (air) ell(panX, panY + 6, 40 * (1 - lift * .4), 6 * (1 - lift * .4), 'rgba(0,0,0,.35)');
          ell(cx, yy, 42, 11 * sy + 1.5, '#b8752c');
          ell(cx, yy - 1, 40, 10 * sy + 1, '#e9a84d');
          ell(cx - 8, yy - 2, 20, 4 * sy + 1, 'rgba(255,240,200,.35)');
        }
        p.draw(); fxDraw(fx);
      }
    };
  }

  /* ---------- 3. Ticket Rush ---------- */
  function gRush(g) {
    var ING = [['Bun', 'A', '#f2b35e'], ['Patty', 'B', '#8c4a2b'], ['Greens', 'C', '#6cd66c']];
    var keys = ['a', 'b', 'c'];
    var tickets = [], spawnT = 4, n = 0, strikes = 0, stack = [], done = false, fx = [], p = pops(), shake = 0;
    function makeTicket() {
      var len = randi(2, n >= 8 ? 4 : 3), rec = [], prev = -1;
      for (var i = 0; i < len; i++) {
        var r = randi(0, 2);
        if (r === prev) r = (r + 1) % 3;
        rec.push(r); prev = r;
      }
      var tl = Math.max(10, 18 - n * .3);
      return { rec: rec, tl: tl, max: tl };
    }
    tickets.push(makeTicket());
    return {
      update: function (dt) {
        if (done) return;
        hud('Served ' + n + '/' + g.goal + '   Strikes ' + strikes + '/3');
        fxUpdate(fx, dt, 200); p.update(dt);
        shake = Math.max(0, shake - dt * 4);
        for (var i = tickets.length - 1; i >= 0; i--) {
          tickets[i].tl -= dt;
          if (tickets[i].tl <= 0) {
            if (i === 0) stack = [];
            tickets.splice(i, 1);
            strikes++; shake = 1;
            p.add(W() / 2, 300, 'Ticket expired', C.red);
            if (strikes >= 3) { done = true; miniFail(g, 'Too many tickets expired.'); return; }
          }
        }
        spawnT -= dt;
        if (!tickets.length) spawnT = 0;
        if (spawnT <= 0 && tickets.length < 3) {
          tickets.push(makeTicket());
          spawnT = Math.max(3, 6 - n * .15);
        }
        for (var k = 0; k < 3; k++) {
          if (!pressed(keys[k])) continue;
          var act = tickets[0];
          if (!act) continue;
          if (act.rec[stack.length] === k) {
            stack.push(k);
            beep(600 + stack.length * 80, 700 + stack.length * 80, .06, 'square', .15);
            if (stack.length === act.rec.length) {
              tickets.shift(); stack = []; n++;
              fxBurst(fx, W() / 2, 400, C.gold, 26, 240);
              p.add(W() / 2, 340, 'Served!', C.gold);
              beep(700, 1100, .18, 'triangle', .2);
              if (n >= g.goal) { done = true; completeMini(); return; }
            }
          } else {
            stack = []; act.tl -= 2; shake = 1;
            p.add(W() / 2, 340, 'Wrong item', C.red);
            beep(170, 90, .2, 'sawtooth', .2);
          }
        }
      },
      draw: function () {
        kitchen('#1e2633', '#0b1017');
        ctx2d.save();
        var sh = shake * 5; ctx2d.translate(rand(-sh, sh), rand(-sh, sh));
        var act = tickets[0];
        if (act) {
          var len = act.rec.length, cw = 84, gap = 12, sx = W() / 2 - (len * cw + (len - 1) * gap) / 2;
          box(24, 92, W() - 48, 128, 14, '#f5ecd7');
          text('ORDER', 40, 116, 13, '#7a5a3a', 'left', 800);
          for (var i = 0; i < len; i++) {
            var x = sx + i * (cw + gap), r = ING[act.rec[i]];
            box(x, 130, cw, 56, 12, r[2]);
            if (i < stack.length) text('DONE', x + cw / 2, 164, 14, '#1a1410', 'center', 900);
            else text(r[0], x + cw / 2, 164, 14, '#1a1410', 'center', 800);
            if (i === stack.length) { rr(x, 130, cw, 56, 12); ctx2d.strokeStyle = C.white; ctx2d.lineWidth = 2; ctx2d.stroke(); }
          }
          bar(40, 204, W() - 80, 8, act.tl / act.max, act.tl < 4 ? C.red : C.lime);
          for (var j = 1; j < Math.min(3, tickets.length); j++) {
            var tk = tickets[j];
            box(24, 226 + (j - 1) * 30, W() - 48, 24, 8, '#e9dcc0');
            text('Next order: ' + tk.rec.length + ' items', 36, 243 + (j - 1) * 30, 13, '#5a4630', 'left', 800);
            bar(W() - 150, 236 + (j - 1) * 30, 116, 5, tk.tl / tk.max, C.gold);
          }
        }
        ell(W() / 2, 470, 120, 26, '#d9dde3');
        ell(W() / 2, 466, 104, 20, '#f2f4f7');
        for (var s = 0; s < stack.length; s++) {
          var c = ING[stack[s]][2];
          box(W() / 2 - 70, 446 - (s + 1) * 24, 140, 22, 10, c);
        }
        ctx2d.restore();
        for (var q = 0; q < 3; q++) {
          var kx = W() * (.2 + q * .3);
          box(kx - 48, 520, 96, 40, 12, ING[q][2]);
          text(ING[q][1] + '  ' + ING[q][0], kx, 545, 15, '#1a1410', 'center', 900);
        }
        p.draw(); fxDraw(fx);
      }
    };
  }

  /* ---------- 4. Golden Fryer ---------- */
  function gFryer(g) {
    var LN = 3, lanes = [], n = 0, burnt = 0, st = { sel: 0, moved: false }, done = false, fx = [], p = pops(), shake = 0;
    function reload(L) { L.d = 0; L.rate = rand(.24, .32) + Math.min(n, 20) * .006; L.wait = 0; }
    for (var i = 0; i < LN; i++) { lanes.push({ d: 0, rate: 0, wait: 0 }); reload(lanes[i]); }
    function laneX(i) { return W() / LN * (i + .5); }
    function fryColor(d) { return ramp(['#ffeaa0', '#f5b93c', '#c8781f', '#6b3412', '#1a0d06'], d / 1.1); }
    function pull(i) {
      var L = lanes[i];
      if (done || L.wait > 0) return;
      var d = L.d, cx = laneX(i);
      if (d < .5) {
        p.add(cx, 230, 'Too soon', C.white);
        L.wait = .5; L.d = 0;
        beep(300, 260, .08, 'sine', .12);
        return;
      }
      var golden = d >= .6 && d <= .85;
      n++; L.wait = .45; L.d = 0;
      fxBurst(fx, cx, 300, golden ? C.gold : C.yellow, 18, 200);
      p.add(cx, 230, golden ? 'Golden!' : 'Good', golden ? C.gold : C.white);
      beep(560, 860, .1, 'triangle', .2);
      if (n >= g.goal) { done = true; completeMini(); }
    }
    return {
      update: function (dt) {
        if (done) return;
        hud('Served ' + n + '/' + g.goal + '   Burnt ' + burnt + '/3');
        fxUpdate(fx, dt, 200); p.update(dt);
        shake = Math.max(0, shake - dt * 4);
        selStep(st, AX(), LN - 1);
        for (var i = 0; i < LN; i++) {
          var L = lanes[i];
          if (L.wait > 0) { L.wait -= dt; if (L.wait <= 0) reload(L); continue; }
          L.d += L.rate * dt;
          if (L.d >= 1.1) {
            burnt++; shake = 1;
            p.add(laneX(i), 230, 'Burnt!', C.red);
            beep(150, 70, .25, 'sawtooth', .2);
            L.d = 0; L.wait = .6;
            if (burnt >= 3) { done = true; miniFail(g, 'Too many burnt fries.'); return; }
          }
        }
        if (pressed('a')) pull(st.sel);
      },
      pointer: function (x, y) {
        if (done) return;
        var i = clamp(Math.floor(x / (W() / LN)), 0, LN - 1);
        st.sel = i;
        pull(i);
      },
      draw: function () {
        kitchen('#3b1d0c', '#140706');
        ctx2d.save();
        var sh = shake * 4; ctx2d.translate(rand(-sh, sh), rand(-sh, sh));
        box(0, 380, W(), 200, 0, 'rgba(255,140,60,.16)');
        for (var i = 0; i < LN; i++) {
          var L = lanes[i], cx = laneX(i), bw = 96, bh = 150, top = 200;
          if (i === st.sel) { rr(cx - bw / 2 - 6, top - 6, bw + 12, bh + 12, 16); ctx2d.strokeStyle = C.yellow; ctx2d.lineWidth = 3; ctx2d.stroke(); }
          box(cx - bw / 2, top, bw, bh, 12, '#5a5f6b');
          box(cx - bw / 2 + 6, top + 6, bw - 12, bh - 12, 8, '#2b1e18');
          if (L.wait <= 0) {
            var col = fryColor(L.d);
            for (var k = 0; k < 12; k++) {
              box(cx - 38 + (k % 4) * 22, top + 22 + Math.floor(k / 4) * 26 + (k % 2) * 3, 16, 8, 3, col);
            }
          }
          bar(cx - 40, 372, 80, 8, L.d / 1.1, fryColor(L.d));
        }
        ctx2d.restore();
        p.draw(); fxDraw(fx);
      }
    };
  }

  /* ---------- 5. Roll Cut (swipe down or A) ---------- */
  function gSushi(g) {
    var TYPES = ['#e4455f', '#ff9b5c', '#7fd47f', '#b8e27a'];
    var BX = W() / 2, RY = 330, rolls = [], halves = [], spawnT = .8, n = 0, missed = 0, combo = 0;
    var done = false, fx = [], p = pops(), flash = 0, belt = 0, speed = 120;
    function doCut() {
      if (done) return;
      var best = -1, bd = 999;
      for (var i = 0; i < rolls.length; i++) {
        var d = Math.abs(rolls[i].x - BX);
        if (d < bd) { bd = d; best = i; }
      }
      if (best < 0 || bd > 30) {
        combo = 0; beep(220, 160, .1, 'sine', .15);
        p.add(BX, 240, 'Off the line', C.white);
        return;
      }
      var r = rolls.splice(best, 1)[0], perfect = bd <= 8;
      combo = perfect ? combo + 1 : 1; n++; flash = .2;
      halves.push({ x: r.x, y: RY, c: r.c, vx: -70, vy: -110 }, { x: r.x, y: RY, c: r.c, vx: 70, vy: -110 });
      fxBurst(fx, BX, RY, r.c, 18, 200);
      p.add(BX, 240, perfect ? 'Perfect x' + combo : 'Clean', perfect ? C.lime : C.cyan);
      beep(900, 1200, .07, 'square', .15);
      if (n >= g.goal) { done = true; completeMini(); }
    }
    return {
      update: function (dt) {
        if (done) return;
        hud('Cuts ' + n + '/' + g.goal + '   Missed ' + missed + '/3');
        belt += dt; flash = Math.max(0, flash - dt);
        speed = Math.min(230, 120 + n * 5);
        spawnT -= dt;
        if (spawnT <= 0) {
          rolls.push({ x: -60, c: pick(TYPES) });
          spawnT = Math.max(.9, 1.5 - n * .03) + rand(0, .3);
        }
        for (var i = rolls.length - 1; i >= 0; i--) {
          var r = rolls[i];
          r.x += speed * dt;
          if (r.x > BX + 34) {
            rolls.splice(i, 1); missed++; combo = 0;
            p.add(BX, RY - 50, 'Missed', C.red);
            if (missed >= 3) { done = true; miniFail(g, 'Three rolls went by uncut.'); return; }
          }
        }
        for (var j = halves.length - 1; j >= 0; j--) {
          var h = halves[j];
          h.x += h.vx * dt; h.y += h.vy * dt; h.vy += 600 * dt;
          if (h.y > H() + 40) halves.splice(j, 1);
        }
        if (pressed('a')) doCut();
        fxUpdate(fx, dt, 260); p.update(dt);
      },
      swipe: function (dx, dy) {
        if (dy > 30 && dy > Math.abs(dx) * .6) doCut();
      },
      draw: function () {
        kitchen('#2e2116', '#110b07');
        box(0, RY - 36, W(), 72, 0, '#2a2a31');
        for (var s = -40 + ((belt * 60) % 40); s < W(); s += 40) box(s, RY - 36, 14, 72, 0, 'rgba(255,255,255,.05)');
        box(BX - 2, 200, 4, 260, 2, flash > 0 ? 'rgba(255,255,255,.9)' : 'rgba(255,255,255,.25)');
        for (var i = 0; i < rolls.length; i++) {
          var r = rolls[i];
          box(r.x - 48, RY - 20, 96, 40, 18, '#1d2b1d');
          box(r.x - 44, RY - 16, 88, 32, 15, '#f7f2e6');
          box(r.x - 20, RY - 8, 40, 16, 7, r.c);
        }
        for (var k = 0; k < halves.length; k++) {
          var h = halves[k];
          box(h.x - 22, h.y - 18, 44, 36, 16, '#f7f2e6');
          box(h.x - 22, h.y - 18, 44, 8, 6, '#1d2b1d');
          box(h.x - 14, h.y - 4, 28, 10, 5, h.c);
        }
        p.draw(); fxDraw(fx);
      }
    };
  }

  /* ---------- 6. Shaker Dots ---------- */
  function gSeason(g) {
    var CX = W() / 2, CY = H() / 2 - 30, R = 124, dots = [], spawnT = .6, n = 0, misses = 0, salt = 12;
    var sx = CX, sy = CY, done = false, fx = [], p = pops(), puff = 0;
    return {
      update: function (dt) {
        if (done) return;
        hud('Seasoned ' + n + '/' + g.goal + '   Missed ' + misses + '/5');
        sx = clamp(sx + AX() * 260 * dt, 30, W() - 30);
        sy = clamp(sy + AY() * 260 * dt, 110, H() - 130);
        salt = Math.min(12, salt + dt * 2.2);
        puff = Math.max(0, puff - dt);
        spawnT -= dt;
        if (spawnT <= 0 && dots.length < 9) {
          var a = rand(0, 6.283), rad = Math.sqrt(rand(0, 1)) * (R - 22);
          var life = rand(2.6, 3.4);
          dots.push({ x: CX + Math.cos(a) * rad, y: CY + Math.sin(a) * rad, life: life, max: life });
          spawnT = Math.max(.6, 1.2 - n * .02);
        }
        for (var i = dots.length - 1; i >= 0; i--) {
          var d = dots[i];
          d.life -= dt;
          if (d.life <= 0) {
            dots.splice(i, 1); misses++;
            p.add(d.x, d.y - 10, 'Missed', C.red);
            if (misses >= 5) { done = true; miniFail(g, 'Too many unseasoned spots.'); return; }
          }
        }
        if (pressed('a')) {
          if (salt >= 1) {
            salt -= 1; puff = .25;
            var hit = 0;
            for (var j = dots.length - 1; j >= 0; j--) {
              var q = dots[j];
              if (dist(sx, sy, q.x, q.y) <= 26) {
                fxBurst(fx, q.x, q.y, C.white, 6, 120);
                dots.splice(j, 1); hit++; n++;
              }
            }
            if (hit) {
              p.add(sx, sy - 30, hit > 1 ? 'x' + hit : '+1', C.lime);
              beep(880, 1100, .06, 'sine', .15);
              if (n >= g.goal) { done = true; completeMini(); return; }
            } else {
              beep(300, 260, .05, 'sine', .08);
            }
          } else {
            p.add(sx, sy - 30, 'Empty', C.orange);
          }
        }
        fxUpdate(fx, dt, 120); p.update(dt);
      },
      draw: function () {
        kitchen('#26303a', '#0e1217');
        circle(CX + 4, CY + 8, R + 10, 'rgba(0,0,0,.35)');
        circle(CX, CY, R + 6, '#eef2f6');
        circle(CX, CY, R - 14, '#dbe2ea');
        var gr = ctx2d.createRadialGradient(CX, CY, 10, CX, CY, R - 20);
        gr.addColorStop(0, '#e0734a'); gr.addColorStop(1, '#8a2f1d');
        ctx2d.fillStyle = gr; ctx2d.beginPath(); ctx2d.arc(CX, CY, R - 20, 0, Math.PI * 2); ctx2d.fill();
        for (var i = 0; i < dots.length; i++) {
          var d = dots[i], k = d.life / d.max;
          circle(d.x, d.y, 4, '#fff');
          strokeCircle(d.x, d.y, 5 + 10 * k, k < .3 ? C.red : C.yellow, 2);
        }
        if (puff > 0) circle(sx, sy + 14, 14 + (1 - puff / .25) * 16, 'rgba(255,255,255,' + (puff * 2).toFixed(2) + ')');
        box(sx - 18, sy - 26, 36, 46, 12, '#c8ced6');
        box(sx - 14, sy - 34, 28, 12, 6, '#8b93a0');
        for (var h = 0; h < 4; h++) circle(sx - 9 + h * 6, sy - 18, 1.6, '#333');
        fxDraw(fx);
        text('Salt', 40, H() - 160, 12, '#cfd8e3', 'left', 800);
        bar(40, H() - 150, W() - 80, 10, salt / 12, '#e8f1ff');
        p.draw();
      }
    };
  }

  /* ---------- 7. Patty Grill ---------- */
  function gGrill(g) {
    var SL = 4, slots = [], n = 0, strikes = 0, st = { sel: 0, moved: false }, done = false, fx = [], p = pops(), shake = 0;
    var GX = 14, GW = W() - 28, SW = GW / SL, GY = 300, GH = 150;
    function reload(s) { s.c = 0; s.rate = rand(.2, .27) + Math.min(n, 20) * .004; s.wait = 0; }
    for (var i = 0; i < SL; i++) { slots.push({ c: 0, rate: 0, wait: 0 }); reload(slots[i]); }
    function slotX(i) { return GX + (i + .5) * SW; }
    function strike(msg, i) {
      strikes++; shake = 1;
      p.add(slotX(i), GY - 14, msg, C.red);
      beep(170, 90, .2, 'sawtooth', .2);
      if (strikes >= 3) { done = true; miniFail(g, 'Three ruined patties. Watch the color.'); return true; }
      return false;
    }
    function pull(i) {
      var s = slots[i];
      if (done || s.wait > 0) return;
      var cx = slotX(i);
      if (s.c < .55) { s.wait = .5; s.c = 0; strike('Raw!', i); return; }
      if (s.c > .92) { s.wait = .5; s.c = 0; strike('Overdone!', i); return; }
      var perfect = s.c >= .66 && s.c <= .82;
      n++; s.wait = .5; s.c = 0;
      fxBurst(fx, cx, GY + 40, perfect ? C.gold : C.white, 16, 180);
      p.add(cx, GY - 14, perfect ? 'Juicy!' : 'Good', perfect ? C.gold : C.white);
      beep(700, 900, .08, 'triangle', .18);
      if (n >= g.goal) { done = true; completeMini(); }
    }
    return {
      update: function (dt) {
        if (done) return;
        hud('Served ' + n + '/' + g.goal + '   Ruined ' + strikes + '/3');
        fxUpdate(fx, dt, 200); p.update(dt);
        shake = Math.max(0, shake - dt * 4);
        selStep(st, AX(), SL - 1);
        for (var i = 0; i < SL; i++) {
          var s = slots[i];
          if (s.wait > 0) { s.wait -= dt; if (s.wait <= 0) reload(s); continue; }
          s.c += s.rate * dt;
          if (s.c >= 1.15) { s.c = 0; s.wait = .5; if (strike('Burnt!', i)) return; }
        }
        if (pressed('a')) pull(st.sel);
      },
      pointer: function (x, y) {
        if (done || y < GY - 60 || y > GY + GH + 60) return;
        var i = clamp(Math.floor((x - GX) / SW), 0, SL - 1);
        st.sel = i;
        pull(i);
      },
      draw: function () {
        kitchen('#201c24', '#0a090c');
        ctx2d.save();
        var sh = shake * 4; ctx2d.translate(rand(-sh, sh), rand(-sh, sh));
        box(GX - 4, GY - 6, GW + 8, GH + 12, 14, '#2e3138');
        box(GX, GY, GW, GH, 10, '#3a3e47');
        ctx2d.strokeStyle = '#22252c'; ctx2d.lineWidth = 3;
        for (var x = GX + 10; x < GX + GW; x += 12) line(x, GY + 4, x, GY + GH - 4, '#22252c', 3);
        if (st.sel >= 0) { rr(GX + st.sel * SW + 3, GY - 6, SW - 6, GH + 12, 12); ctx2d.strokeStyle = C.yellow; ctx2d.lineWidth = 3; ctx2d.stroke(); }
        for (var i = 0; i < SL; i++) {
          var s = slots[i], cx = slotX(i), cy = GY + GH / 2;
          if (s.wait <= 0) {
            var col = ramp(['#d9566a', '#a8562f', '#6a3a1f', '#2a1a12'], s.c / 1.15);
            ell(cx, cy, 34, 22, col);
            ell(cx - 6, cy - 6, 18, 9, 'rgba(255,255,255,.12)');
            line(cx - 18, cy - 8, cx + 4, cy + 10, 'rgba(0,0,0,.25)', 3);
            line(cx - 4, cy - 12, cx + 16, cy + 6, 'rgba(0,0,0,.25)', 3);
            bar(cx - 30, GY + GH + 14, 60, 8, s.c / 1.15, col);
            box(cx - 30 + 60 * .55 / 1.15, GY + GH + 14, 60 * .37 / 1.15, 8, 0, 'rgba(120,255,160,.55)');
          }
        }
        ctx2d.restore();
        fxDraw(fx);
        p.draw();
      }
    };
  }

  /* ---------- 8. Table Service ---------- */
  function gWaiter(g) {
    var DISH = [['Soup', '#4da3ff'], ['Noodles', '#ff914d'], ['Salad', '#6bdc6b']];
    var TBL = [{ x: W() * .22, y: 200 }, { x: W() * .5, y: 200 }, { x: W() * .78, y: 200 }];
    var SLOT = [W() * .2, W() * .5, W() * .8], dishes = [null, null, null];
    var wx = W() / 2, wy = 430, carry = -1, n = 0, strikes = 0, done = false, fx = [], p = pops(), spawnT = 1.5, shake = 0;
    for (var i = 0; i < 3; i++) { TBL[i].cust = null; TBL[i].cool = rand(.2, 1.2); }
    return {
      update: function (dt) {
        if (done) return;
        hud('Served ' + n + '/' + g.goal + '   Lost ' + strikes + '/4');
        fxUpdate(fx, dt, 200); p.update(dt);
        shake = Math.max(0, shake - dt * 4);
        wx = clamp(wx + AX() * 250 * dt, 24, W() - 24);
        wy = clamp(wy + AY() * 250 * dt, 250, 610);
        for (var t = 0; t < 3; t++) {
          var tb = TBL[t];
          if (tb.cust) {
            tb.cust.pat -= dt / tb.cust.dur;
            if (tb.cust.pat <= 0) {
              tb.cust = null; tb.cool = 2; strikes++;
              p.add(tb.x, tb.y - 50, 'Walked out', C.red);
              if (strikes >= 4) { done = true; miniFail(g, 'Too many customers walked out.'); return; }
            }
          } else {
            tb.cool -= dt;
            if (tb.cool <= 0) tb.cust = { want: randi(0, 2), pat: 1, dur: Math.max(12, 24 - n * .35) };
          }
        }
        spawnT -= dt;
        if (spawnT <= 0) {
          var empty = [];
          for (var k = 0; k < 3; k++) if (!dishes[k]) empty.push(k);
          if (empty.length) dishes[pick(empty)] = { type: randi(0, 2) };
          spawnT = Math.max(2.4, 3.6 - n * .03);
        }
        if (pressed('a')) {
          if (carry < 0) {
            var best = -1, bd = 56;
            for (var s = 0; s < 3; s++) {
              if (!dishes[s]) continue;
              var dd = Math.hypot(wx - SLOT[s], wy - 560);
              if (dd < bd) { bd = dd; best = s; }
            }
            if (best >= 0) {
              carry = dishes[best].type; dishes[best] = null;
              beep(500, 700, .07, 'sine', .15);
            }
          } else {
            var tb2 = -1, td = 64;
            for (var u = 0; u < 3; u++) {
              var d2 = Math.hypot(wx - TBL[u].x, wy - TBL[u].y);
              if (d2 < td) { td = d2; tb2 = u; }
            }
            if (tb2 >= 0) {
              var c = TBL[tb2].cust;
              if (c && c.want === carry) {
                n++; carry = -1; TBL[tb2].cust = null; TBL[tb2].cool = 1.2;
                fxBurst(fx, TBL[tb2].x, TBL[tb2].y - 10, C.gold, 22, 220);
                p.add(TBL[tb2].x, TBL[tb2].y - 50, 'Thank you!', C.gold);
                beep(760, 1040, .14, 'triangle', .2);
                if (n >= g.goal) { done = true; completeMini(); return; }
              } else if (c) {
                p.add(TBL[tb2].x, TBL[tb2].y - 50, 'Wrong dish', C.red);
                shake = 1;
                beep(170, 90, .2, 'sawtooth', .15);
              }
            }
          }
        }
      },
      draw: function () {
        kitchen('#4a3322', '#1f150e');
        ctx2d.save();
        var sh = shake * 4; ctx2d.translate(rand(-sh, sh), rand(-sh, sh));
        for (var x = 0; x < W(); x += 46) line(x, 0, x, H(), 'rgba(0,0,0,.12)', 2);
        box(16, 540, W() - 32, 46, 10, '#7b5a3c');
        box(16, 540, W() - 32, 8, 4, '#a9825a');
        for (var s = 0; s < 3; s++) {
          box(SLOT[s] - 26, 582, 52, 8, 4, 'rgba(0,0,0,.25)');
          if (dishes[s]) {
            var dc = DISH[dishes[s].type][1];
            box(SLOT[s] - 18, 510, 36, 20, 10, dc);
            ell(SLOT[s], 510, 18, 5, 'rgba(255,255,255,.3)');
          }
        }
        for (var t = 0; t < 3; t++) {
          var tb = TBL[t];
          ell(tb.x + 4, tb.y + 12, 40, 20, 'rgba(0,0,0,.35)');
          ell(tb.x, tb.y, 38, 20, '#8a6440');
          ell(tb.x, tb.y - 2, 34, 17, '#a57a50');
          if (tb.cust) {
            var cu = tb.cust, pc = cu.pat;
            circle(tb.x, tb.y - 44, 12, '#f2c7a0');
            box(tb.x - 14, tb.y - 32, 28, 22, 10, '#5d6fa6');
            bar(tb.x - 22, tb.y - 80, 44, 6, pc, pc > .35 ? C.lime : C.red);
            circle(tb.x + 26, tb.y - 72, 12, '#fff');
            circle(tb.x + 26, tb.y - 72, 8, DISH[cu.want][1]);
          }
        }
        circle(wx, wy - 12, 12, '#f1d7b5');
        box(wx - 13, wy, 26, 28, 10, '#f5f5f5');
        box(wx - 9, wy + 6, 18, 14, 4, '#d9dfe8');
        if (carry >= 0) {
          box(wx - 16, wy - 44, 32, 16, 8, DISH[carry][1]);
          text(DISH[carry][0][0], wx, wy - 33, 11, '#1a1410', 'center', 900);
        }
        ctx2d.restore();
        fxDraw(fx);
        p.draw();
      }
    };
  }

  /* ---------- 9. Pour Line ---------- */
  function gPour(g) {
    var GLW = 120, GLH = 210, GB = H() - 230, GX = W() / 2, px = W() / 2, py = H() - 360;
    var fill = 0, target = .5, tint = '#ffb84d', n = 0, spills = 0, done = false, fx = [], p = pops(), flash = 0;
    var TINTS = ['#ffb84d', '#ff5f7a', '#7ad7ff', '#b58cff', '#8dff9a'];
    var TARGETS = [.35, .42, .5, .58, .66, .74, .82];
    function newTarget() { target = pick(TARGETS); tint = pick(TINTS); fill = 0; }
    newTarget();
    return {
      update: function (dt) {
        if (done) return;
        hud('Drinks ' + n + '/' + g.goal + '   Spills ' + spills + '/3');
        px = clamp(px + AX() * 260 * dt, 60, W() - 60);
        flash = Math.max(0, flash - dt);
        fxUpdate(fx, dt, 260); p.update(dt);
        if (pressed('a')) {
          if (Math.abs(px - GX) <= GLW / 2 - 8) {
            fill = Math.min(1, fill + .03);
            flash = .15;
            if (fill >= .999) {
              spills++; fill = 0;
              p.add(GX, GB - GLH - 30, 'Overflow', C.red);
              beep(200, 100, .2, 'sawtooth', .2);
              if (spills >= 3) { done = true; miniFail(g, 'Three overflowing glasses.'); return; }
            } else {
              beep(360 + fill * 400, 380 + fill * 400, .04, 'sine', .06);
            }
          } else {
            p.add(px, GB - GLH - 40, 'Missed the glass', C.orange);
          }
        }
        if (pressed('b')) {
          if (Math.abs(fill - target) <= .025) {
            n++;
            fxBurst(fx, GX, GB - GLH * .5, tint, 24, 220);
            p.add(GX, GB - GLH - 30, 'Perfect pour!', C.gold);
            beep(760, 1040, .14, 'triangle', .2);
            newTarget();
            if (n >= g.goal) { done = true; completeMini(); return; }
          } else {
            p.add(GX, GB - GLH - 30, fill > target ? 'Too full' : 'Too light', C.white);
            beep(300, 260, .08, 'sine', .12);
          }
        }
      },
      draw: function () {
        kitchen('#2c1d35', '#0e0912');
        for (var i = 0; i < 6; i++) {
          box(20 + i * 64, 150, 26, 70, 10, 'rgba(200,220,255,.10)');
          box(28 + i * 64, 130, 10, 22, 4, 'rgba(200,220,255,.10)');
        }
        box(0, GB + 18, W(), 90, 0, '#4a2f1f');
        box(0, GB + 18, W(), 6, 0, '#7a5238');
        var top = GB - GLH, bandTop = GB - (target + .025) * GLH, bandBot = GB - (target - .025) * GLH;
        box(GX - GLW / 2 - 8, bandTop, GLW + 16, bandBot - bandTop, 2, 'rgba(255,230,120,.22)');
        line(GX - GLW / 2 - 8, GB - target * GLH, GX + GLW / 2 + 8, GB - target * GLH, C.yellow, 2);
        var lh = fill * GLH;
        box(GX - GLW / 2 + 8, GB - lh, GLW - 16, lh, 6, tint);
        polygon([[GX - GLW / 2, top], [GX + GLW / 2, top], [GX + GLW / 2 - 14, GB], [GX - GLW / 2 + 14, GB]], 'rgba(255,255,255,.10)');
        ctx2d.save();
        ctx2d.beginPath();
        ctx2d.moveTo(GX - GLW / 2, top); ctx2d.lineTo(GX + GLW / 2, top);
        ctx2d.lineTo(GX + GLW / 2 - 14, GB); ctx2d.lineTo(GX - GLW / 2 + 14, GB);
        ctx2d.closePath(); ctx2d.strokeStyle = 'rgba(255,255,255,.55)'; ctx2d.lineWidth = 3; ctx2d.stroke();
        ctx2d.restore();
        if (flash > 0) line(px, py + 22, px, GB - lh - 2, tint, 6);
        polygon([[px - 30, py - 26], [px + 30, py - 26], [px + 18, py + 18], [px - 18, py + 18]], '#dfe9f2');
        box(px - 6, py + 18, 12, 8, 3, '#dfe9f2');
        box(px + 24, py - 12, 10, 14, 5, '#dfe9f2');
        ctx2d.save();
        ctx2d.globalAlpha = .9;
        fxDraw(fx);
        ctx2d.restore();
        p.draw();
      }
    };
  }

  var engines = {
    n06_chop: gChop,
    n06_flip: gFlip,
    n06_rush: gRush,
    n06_fryer: gFryer,
    n06_sushi: gSushi,
    n06_season: gSeason,
    n06_grill: gGrill,
    n06_waiter: gWaiter,
    n06_pour: gPour
  };

  var minis = [
    { id: 'n06_chop', title: 'Rhythm Chop', icon: '🔪', cat: 'SIMULATION', desc: 'Stop the marker inside the green band to chop. Three bad chops end the shift.', engine: 'n06_chop', goal: 25 },
    { id: 'n06_flip', title: 'Pancake Toss', icon: '🥞', cat: 'SIMULATION', desc: 'Toss pancakes and slide the pan under them. Big flips get a gold pop.', engine: 'n06_flip', goal: 20 },
    { id: 'n06_rush', title: 'Ticket Rush', icon: '🧾', cat: 'SIMULATION', desc: 'Build each ticket in order from the buttons. Expired tickets cost a strike.', engine: 'n06_rush', goal: 12 },
    { id: 'n06_fryer', title: 'Golden Fryer', icon: '🍟', cat: 'SIMULATION', desc: 'Pull fries at the golden point, before they burn. Tap a basket or use A.', engine: 'n06_fryer', goal: 20 },
    { id: 'n06_sushi', title: 'Roll Cut', icon: '🍣', cat: 'SIMULATION', desc: 'Swipe down as a roll crosses the blade. Clean cuts build combos.', engine: 'n06_sushi', goal: 18 },
    { id: 'n06_season', title: 'Shaker Dots', icon: '🧂', cat: 'SIMULATION', desc: 'Salt the marked spots before they fade. Salt refills slowly, so spend it wisely.', engine: 'n06_season', goal: 25 },
    { id: 'n06_grill', title: 'Patty Grill', icon: '🍔', cat: 'SIMULATION', desc: 'Pull each patty from the grill in the green band. Raw, overdone or burnt costs a strike.', engine: 'n06_grill', goal: 16 },
    { id: 'n06_waiter', title: 'Table Service', icon: '🍜', cat: 'SIMULATION', desc: 'Carry dishes from the pass to the matching table before customers lose patience.', engine: 'n06_waiter', goal: 12 },
    { id: 'n06_pour', title: 'Pour Line', icon: '🍹', cat: 'SIMULATION', desc: 'Pour into the glass and stop inside the yellow band. Overflows cost a spill.', engine: 'n06_pour', goal: 8 }
  ];

  return { engines: engines, minis: minis, aaa: [] };
})();
