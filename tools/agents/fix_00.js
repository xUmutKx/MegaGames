// fix_00: reworked arcade and air hockey engines (same keys, same goals, more variety and juice).
window.__AG_fix_00 = (function () {
  var TAU = Math.PI * 2;
  function R(a, b) { return a + Math.random() * (b - a); }
  function hit(ax, ay, ar, bx, by, br) { return Math.hypot(ax - bx, ay - by) < ar + br; }
  function glow(c, b) { ctx2d.shadowColor = c; ctx2d.shadowBlur = b || 14; }
  function unglow() { ctx2d.shadowBlur = 0; }
  function bg(top, bot) {
    var g = ctx2d.createLinearGradient(0, 0, 0, H());
    g.addColorStop(0, top); g.addColorStop(1, bot);
    ctx2d.fillStyle = g; ctx2d.fillRect(0, 0, W(), H());
  }
  function stars(n) {
    var a = [];
    for (var i = 0; i < n; i++) a.push({ x: Math.random() * W(), y: Math.random() * H(), s: R(.5, 1.9), v: R(20, 70) });
    return a;
  }
  function moveStars(a, dt, k) {
    for (var i = 0; i < a.length; i++) {
      var s = a[i]; s.y += s.v * k * dt;
      if (s.y > H()) { s.y = -2; s.x = Math.random() * W(); }
    }
  }
  function drawStars(a) { for (var i = 0; i < a.length; i++) circle(a[i].x, a[i].y, a[i].s, "rgba(255,255,255,.55)"); }

  function banner(S) {
    if (!S.over) return;
    var w = Math.min(W() - 40, 340);
    rect((W() - w) / 2, H() / 2 - 60, w, 110, "rgba(8,10,20,.85)", 18);
    text(S.won ? "Cleared!" : "Game over", W() / 2, H() / 2 + 2, 28, "#fff", "center");
    text("Score " + S.score + "/" + S.goal, W() / 2, H() / 2 + 32, 15, "#aab4d4", "center");
  }

  // shared run state: score toward goal, lives, particles, popups, screen shake, win/lose timing
  function run(g, lives) {
    var S = { score: 0, goal: g.goal, lives: lives, over: false, won: false, shake: 0, parts: [], pops: [] };
    S.hud = function () { hud("Score " + S.score + "/" + S.goal + " • " + "❤️".repeat(Math.max(0, S.lives))); };
    S.pop = function (txt, x, y, c) { S.pops.push({ x: x, y: y, t: 0, txt: txt, c: c || C.gold }); };
    S.add = function (n, x, y, c) {
      if (S.over) return;
      S.score += n;
      if (x !== undefined) { S.pop("+" + n, x, y, c); fxBurst(S.parts, x, y, c || C.gold, 8, 140); }
      if (S.score >= S.goal) { S.over = true; S.won = true; setTimeout(completeMini, 450); }
    };
    S.hurt = function (msg, x, y) {
      if (S.over) return;
      S.lives--; S.shake = 12;
      if (x !== undefined) fxBurst(S.parts, x, y, C.red, 18, 220);
      if (S.lives <= 0) { S.over = true; setTimeout(function () { miniFail(g, msg); }, 450); }
    };
    S.tick = function (dt) {
      S.shake = Math.max(0, S.shake - dt * 30);
      fxUpdate(S.parts, dt, 0);
      for (var i = S.pops.length - 1; i >= 0; i--) {
        var p = S.pops[i]; p.t += dt; p.y -= 40 * dt;
        if (p.t > .8) S.pops.splice(i, 1);
      }
    };
    S.open = function () {
      ctx2d.save();
      if (S.shake > 0) ctx2d.translate(R(-S.shake, S.shake), R(-S.shake, S.shake));
    };
    S.close = function () {
      fxDraw(S.parts);
      for (var i = 0; i < S.pops.length; i++) {
        var p = S.pops[i];
        ctx2d.globalAlpha = Math.max(0, 1 - p.t / .8);
        text(p.txt, p.x, p.y, 16, p.c, "center", "900");
      }
      ctx2d.globalAlpha = 1;
      ctx2d.restore();
      banner(S);
    };
    return S;
  }

  // ===== STAR GUARD: auto-fire at three enemy kinds, grab triple-shot power-ups =====
  function guard(g) {
    var S = run(g, 3), st = stars(46), SY = H() - 70, tt = 0;
    var px = W() / 2, tx = px, shots = [], foes = [], pk = null, trip = 0, cd = 0, spT = .6, pkT = 9;
    function spawn() {
      var r = Math.random(), k = S.score > 10 && r < .3 ? "tank" : S.score > 3 && r < .55 ? "zig" : "drone";
      foes.push({ k: k, x: R(30, W() - 30), y: -30, vy: R(55, 85) + S.score * 2, hp: k === "tank" ? 3 : 1, r: k === "tank" ? 24 : 16, ph: R(0, TAU) });
    }
    return {
      update: function (dt) {
        dt = Math.min(dt, .05); S.hud(); S.tick(dt); tt += dt; moveStars(st, dt, 1);
        if (S.over) return;
        tx = clamp(tx + AX() * 480 * dt, 24, W() - 24); px += (tx - px) * Math.min(1, dt * 10);
        cd -= dt;
        if (cd <= 0) {
          cd = trip > 0 ? .15 : .24;
          shots.push({ x: px, y: SY - 22 });
          if (trip > 0) shots.push({ x: px - 14, y: SY - 16 }, { x: px + 14, y: SY - 16 });
        }
        trip -= dt;
        var i, j, b, f;
        for (i = 0; i < shots.length; i++) shots[i].y -= 700 * dt;
        spT -= dt;
        if (spT <= 0) { spawn(); spT = Math.max(.32, 1.1 - S.score * .03); }
        pkT -= dt;
        if (!pk && pkT <= 0) { pk = { x: R(40, W() - 40), y: -20 }; pkT = 12; }
        if (pk) {
          pk.y += 90 * dt;
          if (hit(px, SY, 18, pk.x, pk.y, 12)) { trip = 6; fxBurst(S.parts, pk.x, pk.y, C.yellow, 16, 200); pk = null; }
          else if (pk.y > H()) pk = null;
        }
        for (i = 0; i < foes.length; i++) {
          f = foes[i];
          f.y += f.vy * dt;
          if (f.k === "zig") f.x = clamp(f.x + Math.sin(tt * 3 + f.ph) * 95 * dt, 20, W() - 20);
          for (j = 0; j < shots.length; j++) {
            b = shots[j];
            if (!f.dead && !b.dead && hit(b.x, b.y, 3, f.x, f.y, f.r)) {
              b.dead = true; f.hp--; fxBurst(S.parts, b.x, b.y, C.cyan, 6, 120);
              if (f.hp <= 0) { f.dead = true; S.add(1, f.x, f.y, C.pink); }
            }
          }
          if (!f.dead && hit(px, SY, 18, f.x, f.y, f.r)) { f.dead = true; S.hurt("Rammed", f.x, f.y); }
          else if (!f.dead && f.y > SY + 30) { f.dead = true; S.hurt("Breach", f.x, SY + 30); }
        }
        foes = foes.filter(function (q) { return !q.dead; });
        shots = shots.filter(function (q) { return !q.dead && q.y > -10; });
      },
      pointer: function (x) { tx = clamp(x, 24, W() - 24); },
      draw: function () {
        S.open(); bg("#10163a", "#03040c"); drawStars(st);
        for (var i = 0; i < foes.length; i++) {
          var f = foes[i], col = f.k === "tank" ? C.orange : f.k === "zig" ? C.purple : C.pink;
          glow(col, 16); circle(f.x, f.y, f.r, col); unglow();
          circle(f.x, f.y, f.r * .45, "#0b0f1a");
          if (f.k === "tank") rect(f.x - 20, f.y - f.r - 10, 40 * f.hp / 3, 4, C.lime, 2);
        }
        for (i = 0; i < shots.length; i++) { glow(C.cyan, 10); rect(shots[i].x - 2, shots[i].y - 8, 4, 14, C.cyan, 2); unglow(); }
        if (pk) {
          glow(C.yellow, 18);
          polygon([[pk.x, pk.y - 12], [pk.x + 12, pk.y], [pk.x, pk.y + 12], [pk.x - 12, pk.y]], C.yellow);
          unglow();
          text("3", pk.x, pk.y + 5, 13, "#0b0f1a", "center", "900");
        }
        polygon([[px, SY + 8 + Math.random() * 10], [px - 6, SY + 12], [px + 6, SY + 12]], C.orange);
        glow(C.cyan, 18); polygon([[px, SY - 20], [px - 18, SY + 12], [px + 18, SY + 12]], C.cyan); unglow();
        circle(px, SY + 2, 4, "#0b0f1a");
        if (trip > 0) text("TRIPLE " + Math.ceil(trip), W() / 2, 100, 14, C.yellow, "center", "900");
        S.close();
      }
    };
  }

  // ===== COIN LANES: three lanes, coins to grab, cars to dodge, coin streaks build a combo =====
  function lanes(g) {
    var S = run(g, 3), PY = H() - 130, LW = Math.min(110, (W() - 40) / 3), tt = 0, road = 0;
    var L = 1, vx = W() / 2, obs = [], rowT = .5, lt = 0, combo = 0;
    function LX(i) { return W() / 2 + (i - 1) * LW; }
    function row() {
      var free = [0, 1, 2], n = Math.random() < .35 ? 2 : 1, k, m;
      for (k = 0; k < n; k++) obs.push({ lane: free.splice(Math.floor(Math.random() * free.length), 1)[0], y: -30, coin: false });
      for (m = 0; m < free.length; m++) if (Math.random() < .5) obs.push({ lane: free[m], y: -30, coin: true });
    }
    return {
      update: function (dt) {
        dt = Math.min(dt, .05); S.hud(); S.tick(dt); tt += dt;
        if (S.over) return;
        var sp = 300 + S.score * 6, d = AX(), i, o;
        road += sp * dt;
        if (Math.abs(d) > .5) { if (!lt) { L = clamp(L + (d > 0 ? 1 : -1), 0, 2); lt = 1; } } else lt = 0;
        vx += (LX(L) - vx) * Math.min(1, dt * 14);
        rowT -= dt;
        if (rowT <= 0) { row(); rowT = Math.max(.36, R(.5, .75) - S.score * .012); }
        for (i = 0; i < obs.length; i++) {
          o = obs[i];
          o.y += sp * dt;
          if (o.done) continue;
          if (Math.abs(o.y - PY) < 26 && o.lane === L) {
            o.done = true;
            if (o.coin) {
              combo++; S.add(1, LX(o.lane), PY - 30, C.yellow);
              if (combo >= 3) S.pop("x" + combo, vx, PY - 60, C.lime);
            } else { combo = 0; S.hurt("Crashed", LX(o.lane), PY); }
          } else if (o.y > H() + 30) o.done = true;
        }
        obs = obs.filter(function (q) { return !q.done; });
      },
      pointer: function (x) { L = clamp(L + (x < W() / 2 ? -1 : 1), 0, 2); },
      draw: function () {
        S.open(); bg("#0b0e22", "#05060d");
        var x0 = W() / 2 - 1.5 * LW, rw = 3 * LW, y, i, o, x, sx, fl;
        ctx2d.fillStyle = "#161a36"; ctx2d.fillRect(x0 - 8, 0, rw + 16, H());
        glow(C.cyan, 12); rect(x0 - 8, 0, 3, H(), C.cyan); rect(x0 + rw + 5, 0, 3, H(), C.cyan); unglow();
        var off = road % 60;
        for (y = off - 60; y < H(); y += 60) {
          rect(x0 + LW - 2, y, 4, 30, "rgba(255,255,255,.3)", 2);
          rect(x0 + 2 * LW - 2, y, 4, 30, "rgba(255,255,255,.3)", 2);
        }
        for (i = 0; i < obs.length; i++) {
          o = obs[i]; x = LX(o.lane);
          if (o.coin) {
            sx = Math.max(.15, Math.abs(Math.cos(tt * 5 + o.lane)));
            glow(C.gold, 14); ctx2d.save(); ctx2d.translate(x, o.y); ctx2d.scale(sx, 1);
            circle(0, 0, 13, C.gold); circle(0, 0, 7, "#fff3b0"); ctx2d.restore(); unglow();
          } else {
            glow(C.pink, 10); rect(x - LW / 2 + 18, o.y - 22, LW - 36, 44, C.pink, 10); unglow();
            rect(x - LW / 2 + 26, o.y - 12, LW - 52, 10, "rgba(10,12,30,.55)", 4);
            rect(x - LW / 2 + 22, o.y + 16, 8, 4, C.yellow, 2);
            rect(x + LW / 2 - 30, o.y + 16, 8, 4, C.yellow, 2);
          }
        }
        fl = 6 + Math.random() * 8;
        polygon([[vx - 6, PY + 22], [vx, PY + 22 + fl], [vx + 6, PY + 22]], C.orange);
        glow(C.cyan, 18); rect(vx - LW / 2 + 16, PY - 22, LW - 32, 44, C.cyan, 12); unglow();
        rect(vx - LW / 2 + 26, PY - 6, LW - 52, 12, "rgba(10,12,30,.6)", 4);
        S.close();
      }
    };
  }

  // ===== SWERVE RUSH: five lanes of traffic, passing a car scores, a close pass flashes Close! =====
  function swerve(g) {
    var S = run(g, 3), PY = H() - 130, LW = Math.min(76, (W() - 40) / 5), tt = 0, road = 0;
    var L = 2, vx = W() / 2, cars = [], st = .4, lt = 0;
    var COLS = [C.orange, C.yellow, C.lime, C.purple];
    function LX(i) { return W() / 2 + (i - 2) * LW; }
    function car(x, y, col, down) {
      var cw = LW - 18;
      rect(x - cw / 2, y - 22, cw, 44, col, 10);
      rect(x - cw / 2 + 7, down ? y + 2 : y - 14, cw - 14, 12, "rgba(10,12,30,.6)", 4);
      var lc = down ? C.yellow : C.red;
      glow(lc, 8); circle(x - cw / 2 + 6, y + 18, 3, lc); circle(x + cw / 2 - 6, y + 18, 3, lc); unglow();
    }
    return {
      update: function (dt) {
        dt = Math.min(dt, .05); S.hud(); S.tick(dt); tt += dt;
        if (S.over) return;
        var sp = 280 + S.score * 7, d = AX(), i, o;
        road += sp * dt;
        if (Math.abs(d) > .5) { if (!lt) { L = clamp(L + (d > 0 ? 1 : -1), 0, 4); lt = 1; } } else lt = 0;
        vx += (LX(L) - vx) * Math.min(1, dt * 16);
        st -= dt;
        if (st <= 0) {
          cars.push({ lane: Math.floor(Math.random() * 5), y: -40, k: R(.85, 1.15), col: COLS[Math.floor(Math.random() * COLS.length)], near: false });
          st = Math.max(.3, R(.4, .7) - S.score * .01);
        }
        for (i = 0; i < cars.length; i++) {
          o = cars[i];
          if (o.done) continue;
          o.y += sp * o.k * dt;
          if (Math.abs(o.lane - L) === 1 && Math.abs(o.y - PY) < 50) o.near = true;
          if (Math.abs(o.y - PY) < 30 && o.lane === L) { o.done = true; S.hurt("Crashed", LX(L), PY); }
          else if (o.y > PY + 30) {
            o.done = true; S.add(1, LX(o.lane), PY - 20, C.lime);
            if (o.near) S.pop("Close!", vx, PY - 50, C.cyan);
          }
        }
        cars = cars.filter(function (q) { return !q.done && q.y < H() + 50; });
      },
      pointer: function (x) { L = clamp(L + (x < W() / 2 ? -1 : 1), 0, 4); },
      draw: function () {
        S.open(); bg("#0b0e22", "#05060d");
        var x0 = W() / 2 - 2.5 * LW, rw = 5 * LW, s, y, ex, ln;
        ctx2d.fillStyle = "#151a33"; ctx2d.fillRect(x0 - 6, 0, rw + 12, H());
        for (s = 0; s < 2; s++) {
          ex = s ? x0 + rw : x0 - 6;
          for (y = (road % 40) - 40; y < H(); y += 40) rect(ex, y, 6, 20, (Math.floor((y + 80) / 40) % 2) ? C.red : C.white, 1);
        }
        var off = road % 50;
        for (ln = 1; ln < 5; ln++) for (y = off - 50; y < H(); y += 50) rect(x0 + ln * LW - 2, y, 4, 26, "rgba(255,255,255,.28)", 2);
        for (var i = 0; i < cars.length; i++) car(LX(cars[i].lane), cars[i].y, cars[i].col, true);
        glow(C.cyan, 18); car(vx, PY, C.cyan, false); unglow();
        S.close();
      }
    };
  }

  // ===== AIR HOCKEY: you vs CPU, walls, goal mouths, serve countdown, a CPU that predicts the puck =====
  function hockey(g) {
    var S = run(g, 1), T = 84, B = H() - 120, L = 18, Rt = W() - 18, MID = (T + B) / 2, GX = 58, PR = 24, PRAD = 10;
    var cpu = 0, puck = { x: W() / 2, y: MID, vx: 0, vy: 0 }, trail = [], serve = .9, dir = 1;
    var px = W() / 2, py = B - 40, tx = px, ty = py, pvx = 0, pvy = 0;
    var cx = W() / 2, cy = T + 40, cvx = 0, cvy = 0, cTgt = W() / 2, cTy = T + 40, cT = 0, flash = 0, flashC = C.cyan;
    S.hud = function () { hud("You " + S.score + "/" + g.goal + " • CPU " + cpu); };
    function center() { puck = { x: W() / 2, y: MID, vx: 0, vy: 0 }; trail = []; }
    function hitPad(x, y, vx, vy) {
      var dx = puck.x - x, dy = puck.y - y, d = Math.hypot(dx, dy), m = PR + PRAD;
      if (d >= m || d === 0) return;
      var nx = dx / d, ny = dy / d, sp = Math.min(820, Math.max(360, Math.hypot(puck.vx, puck.vy) + 80));
      puck.x = x + nx * m; puck.y = y + ny * m;
      puck.vx = nx * sp + vx * .4; puck.vy = ny * sp + vy * .4;
      S.shake = Math.max(S.shake, 3); fxBurst(S.parts, puck.x, puck.y, flashC, 8, 160);
      beep(520, 760, .05, "square", .05);
    }
    function goalFor(who) { // who = 1: you scored at the top mouth, -1: CPU scored at the bottom mouth
      flash = 1; flashC = who > 0 ? C.cyan : C.pink;
      fxBurst(S.parts, puck.x, puck.y, flashC, 26, 260); S.shake = 14; beep(260, 120, .3, "sawtooth", .08);
      if (who > 0) S.add(1, W() / 2, T + 30, C.cyan); else cpu++;
      if (cpu >= g.goal && !S.over) { S.over = true; S.won = false; setTimeout(function () { miniFail(g, "CPU wins"); }, 450); }
      dir = who > 0 ? -1 : 1; serve = .9; center();
    }
    function pad(x, y, c) {
      glow(c, 16); circle(x, y, PR, c); unglow();
      circle(x, y, PR * .5, "#0b1624"); circle(x - PR * .3, y - PR * .3, PR * .18, "rgba(255,255,255,.6)");
    }
    return {
      update: function (dt) {
        dt = Math.min(dt, .03); S.hud(); S.tick(dt); flash = Math.max(0, flash - dt * 2);
        if (S.over) return;
        var ox = px, oy = py, stp, cst, t, i, cs;
        // player paddle: joystick nudges the target, taps and drags set it directly
        tx = clamp(tx + AX() * 440 * dt, L + PR, Rt - PR); ty = clamp(ty + AY() * 360 * dt, MID + 10, B - PR);
        stp = 620 * dt; px += clamp(tx - px, -stp, stp); py += clamp(ty - py, -stp, stp);
        pvx = dt ? (px - ox) / dt : 0; pvy = dt ? (py - oy) / dt : 0;
        // CPU: re-reads the puck every 0.12s, so it can be out-thought, not just out-run
        cT -= dt;
        if (cT <= 0) {
          cT = .12; cTgt = W() / 2;
          if (puck.vy < 0) { t = (cy - puck.y) / puck.vy; if (t > 0) cTgt = puck.x + puck.vx * t; }
          cTgt = clamp(cTgt + R(-16, 16), L + PR, Rt - PR);
          cTy = puck.vy < 0 ? clamp(puck.y - 10, T + PR, MID - 12) : T + 40;
        }
        cs = (290 + S.score * 12) * dt;
        ox = cx; oy = cy;
        cx += clamp(cTgt - cx, -cs, cs); cy += clamp(cTy - cy, -cs, cs);
        cvx = dt ? (cx - ox) / dt : 0; cvy = dt ? (cy - oy) / dt : 0;
        if (serve > 0) {
          serve -= dt;
          if (serve <= 0) { puck.vx = R(-80, 80); puck.vy = dir * 320; }
        } else {
          puck.x += puck.vx * dt; puck.y += puck.vy * dt;
          var fr = Math.pow(.8, dt); puck.vx *= fr; puck.vy *= fr;
          var spd = Math.hypot(puck.vx, puck.vy);
          if (spd > 0 && spd < 120) { puck.vx *= 120 / spd; puck.vy *= 120 / spd; }
          if (puck.x < L + PRAD) { puck.x = L + PRAD; puck.vx = Math.abs(puck.vx) * .95; }
          if (puck.x > Rt - PRAD) { puck.x = Rt - PRAD; puck.vx = -Math.abs(puck.vx) * .95; }
          var inMouth = Math.abs(puck.x - W() / 2) < GX;
          if (puck.y < T + PRAD && !inMouth) { puck.y = T + PRAD; puck.vy = Math.abs(puck.vy) * .95; }
          if (puck.y > B - PRAD && !inMouth) { puck.y = B - PRAD; puck.vy = -Math.abs(puck.vy) * .95; }
          hitPad(px, py, pvx, pvy);
          hitPad(cx, cy, cvx, cvy);
          if (puck.y < T - 4) goalFor(1);
          else if (puck.y > B + 4) goalFor(-1);
        }
        trail.push({ x: puck.x, y: puck.y }); if (trail.length > 12) trail.shift();
        S.tick(0);
      },
      pointer: function (x, y) { tx = clamp(x, L + PR, Rt - PR); ty = clamp(y, MID + 10, B - PR); },
      draw: function () {
        S.open(); bg("#0c1828", "#05080f");
        glow("#2aa9ff", 12); rect(L - 6, T - 6, Rt - L + 12, B - T + 12, "#1a3a52", 16); unglow();
        rect(L, T, Rt - L, B - T, "#15334a", 12);
        line(L, MID, Rt, MID, "rgba(255,255,255,.22)", 2);
        strokeCircle(W() / 2, MID, 52, "rgba(255,255,255,.22)", 2);
        rect(W() / 2 - GX, T - 6, GX * 2, 8, C.pink, 3);
        rect(W() / 2 - GX, B - 2, GX * 2, 8, C.cyan, 3);
        if (flash > 0) { ctx2d.globalAlpha = flash * .35; rect(L, T, Rt - L, B - T, flashC, 12); ctx2d.globalAlpha = 1; }
        for (var i = 0; i < trail.length; i++) {
          var a = (i + 1) / trail.length;
          circle(trail[i].x, trail[i].y, PRAD * a, "rgba(180,230,255," + (a * .3).toFixed(2) + ")");
        }
        glow("#ffffff", 14); circle(puck.x, puck.y, PRAD, "#fff"); unglow();
        strokeCircle(puck.x, puck.y, PRAD - 3, "rgba(140,200,255,.8)", 2);
        pad(px, py, C.cyan); pad(cx, cy, C.pink);
        if (serve > 0) text(String(Math.ceil(serve)), W() / 2, MID + 70, 34, "rgba(255,255,255,.35)", "center", "900");
        S.close();
      }
    };
  }

  return {
    engines: { ar_guard: guard, ar_lanes: lanes, ar_swerve: swerve, airhockey: hockey },
    minis: [
      { id: "ar_guard", title: "Star Guard", icon: "🛸", cat: "ARCADE", desc: "Auto-fire at the swarm. Grab the yellow power-up for triple shots.", engine: "ar_guard", goal: 25, cfg: {} },
      { id: "ar_lanes", title: "Coin Lanes", icon: "🛣️", cat: "ARCADE", desc: "Grab coins, dodge the cars. Coin streaks build a combo.", engine: "ar_lanes", goal: 20, cfg: {} },
      { id: "ar_swerve", title: "Swerve Rush", icon: "🚗", cat: "ARCADE", desc: "Pass the traffic in five lanes. Close passes flash Close!", engine: "ar_swerve", goal: 25, cfg: {} },
      { id: "airhockey", title: "Air Hockey", icon: "🏒", cat: "SPORTS", desc: "Drive the puck into the CPU goal first. Three goals win.", engine: "airhockey", goal: 3 }
    ],
    aaa: []
  };
})();
