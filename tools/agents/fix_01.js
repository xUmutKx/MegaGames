window.__AG_fix_01 = (function () {
  /* Overrides for thin engines in slice_01. Same engine keys, same goal semantics. */

  // Triangle pointing along heading a.
  function tri(x, y, a, s, col) {
    polygon([
      [x + Math.cos(a) * s, y + Math.sin(a) * s],
      [x + Math.cos(a + 2.5) * s * 0.7, y + Math.sin(a + 2.5) * s * 0.7],
      [x + Math.cos(a - 2.5) * s * 0.7, y + Math.sin(a - 2.5) * s * 0.7]
    ], col);
  }
  function angDiff(d) { return Math.atan2(Math.sin(d), Math.cos(d)); }

  // Win now, or show the reason and fail after a short pause.
  function finish(g, ok, msg) {
    if (ok) { completeMini(); return; }
    toast(msg);
    setTimeout(function () { miniFail(g, msg); }, 450);
  }

  /* ---------- Air Traffic: steer planes onto the runway ---------- */
  function atcEngine(g) {
    var planes = [], fx = [], spawn = 0.8, landed = 0, lost = 0, sel = 0, over = false, t = 0;
    function rwX() { return W() / 2; }
    function rwY() { return H() * 0.62; }
    function inZone(p) {
      return Math.abs(p.x - rwX()) < 70 && p.y > rwY() - 44 && p.y < rwY() + 8 && Math.sin(p.a) > 0.2;
    }
    function spawnPlane() {
      var x = Math.random() < 0.5 ? -30 : W() + 30, y = rand(110, H() * 0.42);
      planes.push({ x: x, y: y, a: Math.atan2(rwY() - y, rwX() - x) + rand(-0.35, 0.35), sp: rand(62, 80) + landed * 1.5, tr: [] });
    }
    function end(ok, msg) { over = true; finish(g, ok, msg); }
    return {
      update: function (dt) {
        t += dt;
        if (over) { fxUpdate(fx, dt, 0); return; }
        spawn -= dt;
        if (spawn <= 0 && planes.length < 6) { spawnPlane(); spawn = Math.max(1.4, 3.2 - landed * 0.12); }
        if (pressed('b') && planes.length) sel = (sel + 1) % planes.length;
        if (sel >= planes.length) sel = 0;
        var jx = AX(), jy = AY(), jm = Math.hypot(jx, jy), ta = Math.atan2(jy, jx);
        planes.forEach(function (p, i) {
          if (i === sel && jm > 0.25) p.a += clamp(angDiff(ta - p.a), -2.8 * dt, 2.8 * dt);
          p.tr.push([p.x, p.y]); if (p.tr.length > 16) p.tr.shift();
          p.x += Math.cos(p.a) * p.sp * dt; p.y += Math.sin(p.a) * p.sp * dt;
        });
        if (pressed('a')) {
          var k = (planes[sel] && inZone(planes[sel])) ? sel : planes.findIndex(inZone);
          if (k >= 0) {
            var lp = planes[k];
            planes.splice(k, 1); landed++;
            fxBurst(fx, lp.x, lp.y, C.green, 14, 140);
            beep(660, 990, 0.12, 'sine', 0.25);
          }
        }
        for (var i = planes.length - 1; i >= 0; i--) {
          var q = planes[i];
          if (q.x < -80 || q.x > W() + 80 || q.y < 40 || q.y > rwY() + 50) { planes.splice(i, 1); lost++; }
        }
        for (var a = 0; a < planes.length; a++) for (var b = a + 1; b < planes.length; b++) {
          if (dist(planes[a].x, planes[a].y, planes[b].x, planes[b].y) < 20) {
            fxBurst(fx, (planes[a].x + planes[b].x) / 2, (planes[a].y + planes[b].y) / 2, C.red, 30, 220);
            return end(false, 'Mid-air collision');
          }
        }
        if (lost >= 3) return end(false, 'Too many planes lost');
        if (landed >= g.goal) return end(true);
        fxUpdate(fx, dt, 0);
        hud('Landed ' + landed + '/' + g.goal + ' • Lost ' + lost + '/3');
      },
      draw: function () {
        var sg = ctx2d.createLinearGradient(0, 0, 0, H());
        sg.addColorStop(0, '#060a1c'); sg.addColorStop(1, '#17264a');
        ctx2d.fillStyle = sg; ctx2d.fillRect(0, 0, W(), H());
        var rx = rwX(), ry = rwY(), c;
        for (c = 0; c < 4; c++) rect(0, 120 + c * 120, W(), 2, 'rgba(120,160,255,.05)');
        ctx2d.save(); ctx2d.globalAlpha = 0.2 + 0.12 * Math.sin(t * 4);
        rect(rx - 70, ry - 44, 140, 52, '#55ffb0', 8);
        ctx2d.restore();
        rect(rx - 62, ry - 4, 124, 14, '#2a3142', 2);
        for (var x = rx - 54; x < rx + 54; x += 18) rect(x, ry + 2, 9, 2, C.gold);
        planes.forEach(function (p, i) {
          ctx2d.save(); ctx2d.globalAlpha = 0.3;
          for (var j = 1; j < p.tr.length; j++) line(p.tr[j - 1][0], p.tr[j - 1][1], p.tr[j][0], p.tr[j][1], C.cyan, 2);
          ctx2d.restore();
          if (i === sel) strokeCircle(p.x, p.y, 18, C.gold, 2);
          tri(p.x, p.y, p.a, 12, inZone(p) ? C.green : C.cyan);
        });
        fxDraw(fx);
      },
      stop: function () {}
    };
  }

  /* ---------- Blackjack: bets, hidden hole card, double, blackjack pay ---------- */
  function blackjackEngine(g) {
    var RANKS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10, 11], BETS = [10, 25, 50];
    var shoe = [], hand = [], dh = [], chips = 100, bi = 0, bet = 0, dbl = false;
    var phase = 'bet', msg = '', mc = '#fff', rt = 0, over = false, fx = [], t = 0;

    function draw1() {
      if (shoe.length < 15) {
        shoe = [];
        for (var d = 0; d < 2; d++) for (var s = 0; s < 4; s++) for (var r = 0; r < RANKS.length; r++) shoe.push(RANKS[r]);
        for (var i = shoe.length - 1; i > 0; i--) { var j = randi(0, i), tmp = shoe[i]; shoe[i] = shoe[j]; shoe[j] = tmp; }
      }
      return shoe.pop();
    }
    function val(h) {
      var s = 0, aces = 0;
      for (var i = 0; i < h.length; i++) { s += h[i]; if (h[i] === 11) aces++; }
      while (s > 21 && aces > 0) { s -= 10; aces--; }
      return s;
    }
    function settle(text, col, delta) {
      chips = Math.max(0, chips + delta); msg = text; mc = col;
      if (delta > 0) fxBurst(fx, W() / 2, H() * 0.46, C.gold, 24, 200);
      bet = 0; dbl = false; phase = 'result'; rt = 1.6;
    }
    function dealerPlay() {
      while (val(dh) < 17) dh.push(draw1());
      var pv = val(hand), dv = val(dh), stake = bet * (dbl ? 2 : 1);
      if (dv > 21 || pv > dv) settle('YOU WIN +' + stake, C.green, stake);
      else if (pv === dv) settle('PUSH', '#ffffff', 0);
      else settle('DEALER WINS -' + stake, C.red, -stake);
    }
    function deal() {
      hand = [draw1(), draw1()]; dh = [draw1(), draw1()]; phase = 'play';
      var pb = val(hand) === 21, db = val(dh) === 21, bj = Math.floor(bet * 1.5);
      if (pb && db) settle('PUSH', '#ffffff', 0);
      else if (pb) settle('BLACKJACK +' + bj, C.gold, bj);
      else if (db) settle('DEALER BLACKJACK -' + bet, C.red, -bet);
    }

    return {
      update: function (dt) {
        t += dt;
        if (over) return;
        var a = pressed('a'), b = pressed('b'), c = pressed('c');
        if (phase === 'bet') {
          if (c) bi = (bi + 1) % BETS.length;
          while (bi > 0 && BETS[bi] > chips) bi--;
          if (a && chips >= BETS[bi]) { bet = BETS[bi]; deal(); }
        } else if (phase === 'play') {
          if (a) {
            hand.push(draw1());
            if (val(hand) > 21) settle('BUST -' + bet, C.red, -bet);
            else if (val(hand) === 21) dealerPlay();
          } else if (b) {
            dealerPlay();
          } else if (c && hand.length === 2 && chips >= bet) {
            dbl = true; hand.push(draw1());
            if (val(hand) > 21) settle('BUST -' + bet * 2, C.red, -bet * 2);
            else dealerPlay();
          }
        } else if (phase === 'result') {
          rt -= dt;
          if (rt <= 0) {
            if (chips < BETS[0]) { over = true; finish(g, false, 'Out of chips'); return; }
            if (chips >= g.goal) { over = true; finish(g, true); return; }
            phase = 'bet';
          }
        }
        fxUpdate(fx, dt, 0);
        hud('Chips ' + chips + '/' + g.goal + (phase === 'bet' ? ' • Bet ' + BETS[bi] : ''));
      },
      draw: function () {
        var bg = ctx2d.createLinearGradient(0, 0, 0, H());
        bg.addColorStop(0, '#0b2a1a'); bg.addColorStop(1, '#06160d');
        ctx2d.fillStyle = bg; ctx2d.fillRect(0, 0, W(), H());
        ctx2d.beginPath(); ctx2d.ellipse(W() / 2, H() * 0.5, W() * 0.46, H() * 0.36, 0, 0, Math.PI * 2);
        ctx2d.fillStyle = '#145c33'; ctx2d.fill();
        ctx2d.strokeStyle = 'rgba(255,255,255,.12)'; ctx2d.lineWidth = 3; ctx2d.stroke();
        function card(x, y, v, hidden) {
          if (hidden) {
            rect(x, y, 46, 64, '#2c4f9e', 6);
            for (var k = 0; k < 4; k++) rect(x + 8, y + 8 + k * 12, 30, 4, 'rgba(255,255,255,.25)', 2);
            return;
          }
          rect(x, y, 46, 64, '#fbfbf6', 6);
          text(v === 11 ? 'A' : String(v), x + 23, y + 40, 20, '#222', 'center', 900);
        }
        function row(list, y, hideSecond) {
          var x0 = W() / 2 - (list.length * 52 - 6) / 2;
          for (var i = 0; i < list.length; i++) card(x0 + i * 52, y, list[i], hideSecond && i === 1);
        }
        row(dh, H() * 0.2, phase === 'play');
        row(hand, H() * 0.54, false);
        if (dh.length) text(phase === 'play' ? '?' : String(val(dh)), W() / 2, H() * 0.2 - 10, 16, '#dfe', 'center', 800);
        if (hand.length) text(String(val(hand)), W() / 2, H() * 0.54 + 84, 16, '#fff', 'center', 800);
        if (phase === 'bet') {
          circle(W() / 2, H() * 0.46, 24, C.gold);
          text(String(BETS[bi]), W() / 2, H() * 0.46 + 5, 15, '#222', 'center', 900);
        }
        if (msg) text(msg, W() / 2, H() * 0.4, 22, mc, 'center', 900);
        fxDraw(fx);
      },
      stop: function () {}
    };
  }

  /* ---------- Battleship: duel with a hunting CPU, 4-3-3-2 fleets ---------- */
  function battleshipEngine(g) {
    var N = 8, LENS = [4, 3, 3, 2], TOTAL = LENS.reduce(function (a, b) { return a + b; }, 0);
    var t = 0, mine, theirs, cur = { x: 0, y: 0 }, cd = 0, turn = 0, tt = 0, over = false, fx = [], pend = [], pop = null;

    function geo() {
      var s = Math.floor(Math.min((W() - 40) / N, (H() - 270) / (2 * N)));
      return { s: s, ox: (W() - N * s) / 2, y0: 96, y1: 96 + N * s + 44 };
    }
    function board() {
      var b = { g: [], m: [], ships: LENS.map(function (l) { return { len: l, hits: 0 }; }), taken: 0 };
      for (var y = 0; y < N; y++) { b.g.push(Array(N).fill(-1)); b.m.push(Array(N).fill(0)); }
      LENS.forEach(function (len, si) {
        var ok = false;
        while (!ok) {
          var hor = Math.random() < 0.5, sx = randi(0, hor ? N - len : N - 1), sy = randi(0, hor ? N - 1 : N - len);
          ok = true;
          for (var i = 0; i < len; i++) if (b.g[sy + (hor ? 0 : i)][sx + (hor ? i : 0)] >= 0) ok = false;
          if (ok) for (i = 0; i < len; i++) b.g[sy + (hor ? 0 : i)][sx + (hor ? i : 0)] = si;
        }
      });
      return b;
    }
    // returns -1 already shot, 0 miss, 1 hit, 2 sunk
    function fire(b, x, y) {
      if (b.m[y][x]) return -1;
      var s = b.g[y][x];
      if (s < 0) { b.m[y][x] = 1; return 0; }
      b.m[y][x] = 2; b.taken++;
      var sh = b.ships[s]; sh.hits++;
      return sh.hits === sh.len ? 2 : 1;
    }
    // CPU: follow up unsunk hits first, otherwise hunt on a checkerboard parity
    function cpuPick() {
      for (var k = pend.length - 1; k >= 0; k--) {
        var h = pend[k], opts = [];
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) {
          var x = h.x + d[0], y = h.y + d[1];
          if (x >= 0 && x < N && y >= 0 && y < N && !mine.m[y][x]) opts.push([x, y]);
        });
        if (opts.length) return pick(opts);
      }
      var free = [], par = [];
      for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) if (!mine.m[y][x]) {
        free.push([x, y]); if ((x + y) % 2 === 0) par.push([x, y]);
      }
      return pick(par.length ? par : free);
    }
    function end(ok, msg) { over = true; finish(g, ok, msg); }
    function drawBoard(b, y0, hide, label, G) {
      var s = G.s, ox = G.ox;
      text(label, W() / 2, y0 - 10, 12, hide ? '#f88' : '#8bd', 'center', 800);
      for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
        var px = ox + x * s, py = y0 + y * s, sh = b.g[y][x];
        rect(px + 1, py + 1, s - 2, s - 2, 'rgba(120,190,255,.07)', 3);
        if (sh >= 0 && (!hide || b.ships[sh].hits === b.ships[sh].len)) rect(px + 3, py + 3, s - 6, s - 6, hide ? C.gold : '#7fa6c9', 4);
        if (b.m[y][x] === 1) circle(px + s / 2, py + s / 2, s * 0.12, '#e8f4ff');
        if (b.m[y][x] === 2) circle(px + s / 2, py + s / 2, s * 0.3, C.red);
      }
    }

    mine = board(); theirs = board();
    return {
      update: function (dt) {
        t += dt;
        if (over) { fxUpdate(fx, dt, 0); return; }
        if (pop) { pop.t -= dt; if (pop.t <= 0) pop = null; }
        var pa = pressed('a');
        if (turn === 0) {
          cd -= dt;
          var dx = Math.abs(AX()) > 0.35 ? Math.sign(AX()) : 0, dy = Math.abs(AY()) > 0.35 ? Math.sign(AY()) : 0;
          if (cd <= 0 && (dx || dy)) {
            cur.x = clamp(cur.x + dx, 0, N - 1); cur.y = clamp(cur.y + dy, 0, N - 1); cd = 0.16;
          }
          if (pa) {
            var r = fire(theirs, cur.x, cur.y);
            if (r >= 0) {
              var G = geo(), cx = G.ox + cur.x * G.s + G.s / 2, cy = G.y0 + cur.y * G.s + G.s / 2;
              if (r === 0) { fxBurst(fx, cx, cy, C.cyan, 6, 60); pop = { t: 1, txt: 'MISS', c: '#dfe' }; }
              else {
                fxBurst(fx, cx, cy, r === 2 ? C.gold : C.red, 18, 170);
                beep(220, 90, 0.2, 'sawtooth', 0.25);
                pop = { t: 1.1, txt: r === 2 ? 'SUNK!' : 'HIT', c: r === 2 ? C.gold : C.red };
              }
              turn = 1; tt = 0.9;
              if (theirs.taken >= TOTAL) return end(true);
            }
          }
        } else {
          tt -= dt;
          if (tt <= 0) {
            var q = cpuPick(), r2 = fire(mine, q[0], q[1]);
            if (r2 > 0) pend.push({ x: q[0], y: q[1] });
            pend = pend.filter(function (h) { var sh = mine.ships[mine.g[h.y][h.x]]; return sh.hits < sh.len; });
            turn = 0;
            if (mine.taken >= TOTAL) return end(false, 'Your fleet is sunk');
          }
        }
        fxUpdate(fx, dt, 0);
        hud('Hits ' + theirs.taken + '/' + TOTAL + ' • Lost ' + mine.taken + '/' + TOTAL);
      },
      draw: function () {
        clear('#06111f');
        var G = geo();
        drawBoard(theirs, G.y0, true, 'ENEMY WATERS', G);
        drawBoard(mine, G.y1, false, 'YOUR FLEET', G);
        if (turn === 0 && !over) strokeCircle(G.ox + cur.x * G.s + G.s / 2, G.y0 + cur.y * G.s + G.s / 2, G.s * 0.42, C.gold, 2);
        if (pop) text(pop.txt, W() / 2, G.y1 + N * G.s + 36, 24, pop.c, 'center', 900);
        fxDraw(fx);
      },
      stop: function () {}
    };
  }

  /* ---------- Hoop Master: aim with the stick, hold to charge, release to shoot ---------- */
  function basketEngine(g) {
    var t = 0, score = 0, lives = 3, over = false, ball = null, held = false, t0 = 0, power = 0;
    var aimA = -Math.PI / 2, fx = [], pop = null, shake = 0, trail = [], hy = 150;
    function sx() { return W() / 2; }
    function sy() { return H() - 170; }
    function hoopX() {
      var amp = score >= 2 ? Math.min(130, 20 + score * 14) : 0;
      return clamp(W() / 2 + Math.sin(t * (0.8 + score * 0.15)) * amp, 50, W() - 50);
    }
    function meter() { return 1 - Math.abs(((t - t0) * 0.9) % 2 - 1); }
    function simulate(p) {
      var pts = [], sp = 260 + 560 * p, x = sx(), y = sy(), vx = Math.cos(aimA) * sp, vy = Math.sin(aimA) * sp;
      for (var i = 0; i < 60; i++) {
        vy += 520 * 0.03; x += vx * 0.03; y += vy * 0.03;
        if (i % 3 === 0) pts.push([x, y]);
        if (y > H() - 110 || y < 0) break;
      }
      return pts;
    }
    return {
      update: function (dt) {
        t += dt;
        if (over) { fxUpdate(fx, dt, 0); return; }
        shake = Math.max(0, shake - dt * 3);
        if (pop) { pop.t -= dt; if (pop.t <= 0) pop = null; }
        fxUpdate(fx, dt, 0);
        var jx = AX(), jy = AY();
        if (!ball) {
          if (Math.hypot(jx, jy) > 0.3 && jy < -0.1) aimA = Math.atan2(jy, jx);
          if (IN.act.a && !held) { held = true; t0 = t; }
          if (held) power = meter();
          if (!IN.act.a && held) {
            held = false;
            var sp = 260 + 560 * power;
            ball = { x: sx(), y: sy(), vx: Math.cos(aimA) * sp, vy: Math.sin(aimA) * sp, age: 0, scored: false };
            trail = [];
          }
        } else {
          var b = ball, prevY = b.y;
          b.age += dt; b.vy += 520 * dt; b.x += b.vx * dt; b.y += b.vy * dt;
          trail.push([b.x, b.y]); if (trail.length > 14) trail.shift();
          var hx0 = hoopX();
          [-20, 20].forEach(function (off) {
            var rx = hx0 + off, d = dist(b.x, b.y, rx, hy) || 0.01;
            if (d < 13) {
              var nx = (b.x - rx) / d, ny = (b.y - hy) / d, dot = b.vx * nx + b.vy * ny;
              if (dot < 0) { b.vx -= 1.7 * dot * nx; b.vy -= 1.7 * dot * ny; b.vx *= 0.9; }
              b.x = rx + nx * 13; b.y = hy + ny * 13;
            }
          });
          if (!b.scored && prevY < hy && b.y >= hy && b.vy > 0 && Math.abs(b.x - hx0) < 17) {
            b.scored = true; score++;
            fxBurst(fx, b.x, hy, C.orange, 30, 220);
            beep(520, 880, 0.15, 'triangle', 0.3);
            pop = { t: 1.1, txt: score >= 3 ? 'SWISH x' + score : 'SWISH', c: C.gold };
            ball = null;
            if (score >= g.goal) { over = true; finish(g, true); return; }
          } else if (b.y > H() - 110 || b.x < -30 || b.x > W() + 30 || b.age > 4) {
            ball = null; lives--; shake = 0.4;
            pop = { t: 0.9, txt: 'MISS', c: C.red };
            beep(200, 120, 0.2, 'square', 0.2);
            if (lives <= 0) { over = true; finish(g, false, 'Out of lives'); return; }
          }
        }
        hud('Baskets ' + score + '/' + g.goal + ' • Lives ' + lives);
      },
      draw: function () {
        var bg = ctx2d.createLinearGradient(0, 0, 0, H());
        bg.addColorStop(0, '#1a0b2e'); bg.addColorStop(1, '#2b1446');
        ctx2d.fillStyle = bg; ctx2d.fillRect(0, 0, W(), H());
        ctx2d.save();
        ctx2d.translate(rand(-shake, shake) * 6, rand(-shake, shake) * 6);
        rect(0, H() - 110, W(), 110, '#2a1a10');
        line(0, H() - 110, W(), H() - 110, C.orange, 2);
        var hx0 = hoopX();
        rect(hx0 - 36, hy - 52, 72, 40, 'rgba(255,255,255,.14)', 6);
        rect(hx0 - 14, hy - 30, 28, 18, 'rgba(255,255,255,.08)', 3);
        ctx2d.beginPath(); ctx2d.ellipse(hx0, hy, 22, 6, 0, 0, Math.PI * 2);
        ctx2d.strokeStyle = C.orange; ctx2d.lineWidth = 4; ctx2d.stroke();
        for (var i = 0; i <= 4; i++) line(hx0 - 20 + i * 10, hy, hx0 - 12 + i * 6, hy + 24, 'rgba(255,255,255,.55)', 1.5);
        if (!ball) {
          simulate(held ? power : 0.5).forEach(function (p, k) {
            circle(p[0], p[1], 2.2, 'rgba(255,255,255,' + (0.7 - k * 0.01) + ')');
          });
          circle(sx(), sy(), 16, '#3ba0ff');
          line(sx(), sy(), sx() + Math.cos(aimA) * 46, sy() + Math.sin(aimA) * 46, C.gold, 3);
        }
        trail.forEach(function (p, k) { circle(p[0], p[1], 2 + k * 0.2, 'rgba(255,170,90,' + (k / trail.length * 0.5) + ')'); });
        if (ball) {
          circle(ball.x, ball.y, 10, C.orange);
          strokeCircle(ball.x, ball.y, 10, '#6b2a0a', 1.5);
          line(ball.x - 9, ball.y, ball.x + 9, ball.y, '#6b2a0a', 1);
          line(ball.x, ball.y - 9, ball.x, ball.y + 9, '#6b2a0a', 1);
        }
        if (held) {
          var mh = H() * 0.4, my = H() * 0.3;
          rect(W() - 30, my, 14, mh, 'rgba(255,255,255,.12)', 6);
          rect(W() - 30, my + mh * (1 - power), 14, mh * power, power > 0.8 ? C.red : C.green, 6);
        }
        if (pop) text(pop.txt, W() / 2, H() * 0.4 - (1 - pop.t) * 30, 26, pop.c, 'center', 900);
        fxDraw(fx);
        ctx2d.restore();
      },
      stop: function () {}
    };
  }

  /* ---------- Boulder Dash: falling rocks and diamonds, always solvable ---------- */
  function boulderEngine(g) {
    var CW = 12, CH = 9, need = g.goal;
    var grid = [], px = 1, py = 1, diamonds = 0, cd = 0, fallT = 0, over = false, fx = [], t = 0, shake = 0;

    function lay() {
      var s = Math.min(50, (W() - 30) / CW, (H() - 200) / CH);
      return { s: s, ox: (W() - s * CW) / 2, oy: 90 };
    }
    function cellX(x) { var L = lay(); return L.ox + x * L.s + L.s / 2; }
    function cellY(y) { var L = lay(); return L.oy + y * L.s + L.s / 2; }
    function at(x, y) { return grid[y] && grid[y][x] !== undefined ? grid[y][x] : '#'; }
    function build(bp, dp) {
      grid = [];
      for (var y = 0; y < CH; y++) {
        grid[y] = [];
        for (var x = 0; x < CW; x++) {
          var edge = x === 0 || y === 0 || x === CW - 1 || y === CH - 1, r = Math.random();
          grid[y][x] = edge ? '#' : (x + y < 3 ? '.' : (r < bp ? 'b' : (r < bp + dp ? 'd' : '.')));
        }
      }
      grid[1][1] = '.'; grid[CH - 2][CW - 2] = 'X';
    }
    // BFS from the start: boulders are walls; reports diamonds reachable and whether the exit is reachable
    function reach() {
      var seen = {}, q = [[1, 1]], dia = 0, exit = false;
      seen[CW + 1] = true;
      while (q.length) {
        var c = q.shift(), x = c[0], y = c[1], cell = grid[y][x];
        if (cell === 'd') dia++;
        if (cell === 'X') exit = true;
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) {
          var nx = x + d[0], ny = y + d[1], k = ny * CW + nx;
          if (seen[k] || at(nx, ny) === '#' || at(nx, ny) === 'b') return;
          seen[k] = true; q.push([nx, ny]);
        });
      }
      return { dia: dia, exit: exit };
    }
    function gen() {
      for (var tries = 0; tries < 60; tries++) {
        build(0.14, 0.12);
        var r = reach();
        if (r.exit && r.dia >= need) return;
      }
      // fallback: open room with enough diamonds, so the goal is always reachable
      build(0, 0);
      var free = [], y, x, i;
      for (y = 1; y < CH - 1; y++) for (x = 1; x < CW - 1; x++) if (grid[y][x] === '.' && !(x === 1 && y === 1)) free.push([x, y]);
      for (i = free.length - 1; i > 0; i--) { var j = randi(0, i), tmp = free[i]; free[i] = free[j]; free[j] = tmp; }
      for (i = 0; i < Math.min(free.length, need + 2); i++) grid[free[i][1]][free[i][0]] = 'd';
    }
    function crush() {
      over = true; shake = 0.5;
      fxBurst(fx, cellX(px), cellY(py), C.red, 24, 180);
      finish(g, false, 'Crushed by a boulder');
    }
    function fallTick() {
      for (var y = CH - 2; y >= 1; y--) for (var x = 1; x < CW - 1; x++) {
        var c = grid[y][x];
        if ((c === 'b' || c === 'd') && grid[y + 1][x] === '.') {
          grid[y + 1][x] = c; grid[y][x] = '.';
          if (x === px && y + 1 === py) return crush();
        }
      }
    }
    function step(dx, dy) {
      var nx = px + dx, ny = py + dy, c = at(nx, ny);
      if (c === '#') return;
      if (c === 'b') {
        if (dy !== 0 || at(nx + dx, ny) !== '.') return;
        grid[ny][nx + dx] = 'b'; grid[ny][nx] = '.';
      }
      px = nx; py = ny;
      if (grid[py][px] === 'd') {
        grid[py][px] = '.'; diamonds++;
        fxBurst(fx, cellX(px), cellY(py), C.gold, 12, 120);
        beep(880, 1320, 0.08, 'sine', 0.2);
      }
      if (grid[py][px] === 'X' && diamonds >= need) { over = true; finish(g, true); }
    }

    gen();
    return {
      update: function (dt) {
        t += dt;
        if (over) { fxUpdate(fx, dt, 0); return; }
        shake = Math.max(0, shake - dt * 3);
        fallT += dt;
        if (fallT >= 0.2) { fallT = 0; fallTick(); if (over) return; }
        cd -= dt;
        if (cd <= 0) {
          var jx = AX(), jy = AY();
          if (Math.abs(jx) > 0.35) { step(Math.sign(jx), 0); cd = 0.13; }
          else if (Math.abs(jy) > 0.35) { step(0, Math.sign(jy)); cd = 0.13; }
          if (over) return;
        }
        fxUpdate(fx, dt, 0);
        hud('💎 ' + diamonds + '/' + need);
      },
      draw: function () {
        var bg = ctx2d.createLinearGradient(0, 0, 0, H());
        bg.addColorStop(0, '#11161c'); bg.addColorStop(1, '#070a0d');
        ctx2d.fillStyle = bg; ctx2d.fillRect(0, 0, W(), H());
        var L = lay(), s = L.s, ox = L.ox, oy = L.oy, y, x;
        ctx2d.save();
        ctx2d.translate(rand(-shake, shake) * 5, rand(-shake, shake) * 5);
        for (y = 0; y < CH; y++) for (x = 0; x < CW; x++) {
          var c = grid[y][x], cx = ox + x * s, cy = oy + y * s;
          if (c === '#') {
            rect(cx, cy, s, s, '#3a4250', 2);
            rect(cx + 3, cy + 3, s - 6, s - 6, '#454d5e', 2);
            continue;
          }
          rect(cx, cy, s, s, 'rgba(255,255,255,.025)');
          if (c === 'b') {
            var gr = ctx2d.createRadialGradient(cx + s * 0.4, cy + s * 0.35, s * 0.05, cx + s / 2, cy + s / 2, s * 0.42);
            gr.addColorStop(0, '#d8d0c2'); gr.addColorStop(1, '#4a4438');
            circle(cx + s / 2, cy + s / 2, s * 0.38, gr);
          }
          if (c === 'd') {
            polygon([[cx + s / 2, cy + s * 0.2], [cx + s * 0.74, cy + s / 2], [cx + s / 2, cy + s * 0.8], [cx + s * 0.26, cy + s / 2]], '#7ef0ff');
            circle(cx + s * 0.44, cy + s * 0.4, s * 0.07, '#ffffff');
          }
          if (c === 'X') {
            var open = diamonds >= need;
            circle(cx + s / 2, cy + s / 2, open ? s * (0.4 + 0.05 * Math.sin(t * 5)) : s * 0.32, open ? 'rgba(85,255,154,.35)' : 'rgba(255,255,255,.06)');
            text(open ? 'EXIT' : 'X', cx + s / 2, cy + s * 0.62, open ? 10 : 16, open ? C.green : '#667', 'center', 900);
          }
        }
        circle(cellX(px), cellY(py), s * 0.3, C.cyan);
        strokeCircle(cellX(px), cellY(py), s * 0.3, '#ffffff', 2);
        fxDraw(fx);
        ctx2d.restore();
      },
      stop: function () {}
    };
  }

  return {
    engines: {
      atc: atcEngine,
      blackjack: blackjackEngine,
      battleship: battleshipEngine,
      basket: basketEngine,
      boulder: boulderEngine
    },
    minis: [
      { id: 'atc', title: 'Air Traffic', icon: '🛫', cat: 'ARCADE', desc: 'Steer inbound planes onto the runway. Three lost planes or a collision ends it.', engine: 'atc', goal: 8 },
      { id: 'blackjack', title: 'Blackjack', icon: '🃏', cat: 'ARCADE', desc: 'Bet, hit, stand or double. Reach the chip goal before you go broke.', engine: 'blackjack', goal: 300 },
      { id: 'battleship', title: 'Battleship', icon: '🚢', cat: 'PUZZLE', desc: 'Trade shots with a hunting enemy. Sink their whole fleet before yours goes down.', engine: 'battleship', goal: 1 },
      { id: 'basket', title: 'Hoop Master', icon: '🏀', cat: 'SPORTS', desc: 'Aim with the stick, hold to charge power, release to shoot. The hoop starts to move. Three misses ends it.', engine: 'basket', goal: 5 },
      { id: 'boulder', title: 'Boulder Dash', icon: '💎', cat: 'PUZZLE', desc: 'Collect the diamonds, push rocks aside, dodge falling boulders, reach the exit.', engine: 'boulder', goal: 5 }
    ]
  };
})();
