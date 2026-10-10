window.__AG_fix_07 = (function () {
  /* Overrides: mancala (capture bug, real AI, layout), missile (city defence),
     lander (terrain, wind, fuel cans, held thrust). Keys and goals unchanged. */

  function f7Stars(n) {
    var s = [];
    for (var i = 0; i < n; i++) s.push([Math.random(), Math.random() * 0.6, rand(0.5, 1.6)]);
    return s;
  }

  /* ---------- Mancala ---------- */
  /* Pits 0..5 = player (bottom, left to right), 6 = player store,
     7..12 = CPU (top, pit 12 at left), 13 = CPU store. Pit p opposite is 12 - p. */
  function f7Sim(b, pit, side) {
    var nb = b.slice(), store = side === 1 ? 6 : 13, opp = side === 1 ? 13 : 6;
    var n = nb[pit], p = pit;
    nb[pit] = 0;
    while (n > 0) { p = (p + 1) % 14; if (p === opp) continue; nb[p]++; n--; }
    var extra = p === store, gain = 0;
    var mine = side === 1 ? p <= 5 : p >= 7;
    if (!extra && mine && nb[p] === 1 && nb[12 - p] > 0) {
      gain = nb[12 - p] + 1;
      nb[store] += gain;
      nb[12 - p] = 0; nb[p] = 0;
    }
    return { b: nb, extra: extra, gain: gain };
  }
  function f7SideEmpty(b, side) {
    var s = 0;
    if (side === 1) for (var i = 0; i <= 5; i++) s += b[i];
    else for (var j = 7; j <= 12; j++) s += b[j];
    return s === 0;
  }

  function f7Mancala(g) {
    var pits = [4, 4, 4, 4, 4, 4, 0, 4, 4, 4, 4, 4, 4, 0];
    var turn = 1, cx = 0, cd = 0, cpuT = 0.8, over = false, parts = [], last = -1, lastT = 0, hintOn = false;

    function sweep() {
      for (var i = 0; i <= 5; i++) { pits[6] += pits[i]; pits[i] = 0; }
      for (var j = 7; j <= 12; j++) { pits[13] += pits[j]; pits[j] = 0; }
    }
    function finish() {
      sweep();
      over = true;
      var msg;
      if (pits[6] > pits[13]) { beep(440, 880, 0.3, 'triangle', 0.2); completeMini(); return; }
      msg = pits[6] === pits[13] ? "Tie game" : "CPU wins " + pits[13] + " to " + pits[6];
      toast(msg);
      setTimeout(function () { miniFail(g, msg); }, 600);
    }
    function move(i) {
      var r = f7Sim(pits, i, turn);
      var px = colX(i), py = turn === 1 ? botY() : topY();
      if (r.gain) {
        fxBurst(parts, sx(turn === 1 ? 6 : 13), storeY(), C.gold, 14, 180);
        beep(660, 990, 0.12, 'sine', 0.15);
      } else beep(300, 360, 0.05, 'sine', 0.06);
      fxBurst(parts, px, py, C.cyan, 4, 60);
      pits = r.b;
      last = i; lastT = 0.35;
      if (!r.extra) turn = turn === 1 ? 2 : 1;
      if (f7SideEmpty(pits, 1) || f7SideEmpty(pits, 2)) finish();
    }
    function cpuChoose() {
      var best = -1, bestV = -1e9;
      for (var i = 7; i <= 12; i++) {
        if (!pits[i]) continue;
        var r = f7Sim(pits, i, 2);
        var v = r.gain * 2 + (r.extra ? 2.5 : 0) + Math.random() * 1.6;
        if (v > bestV) { bestV = v; best = i; }
      }
      return best;
    }
    function colX(i) { var s = f7PitS(); return ox() + i * s + s / 2; }
    function ox() { return (W() - 6 * f7PitS()) / 2; }
    function f7PitS() { return Math.min(54, (W() - 130) / 6); }
    function sx(store) { return store === 6 ? ox() + 6 * f7PitS() + f7PitS() * 0.9 : ox() - f7PitS() * 0.9; }
    function storeY() { return cy(); }
    function cy() { return H() / 2 - 10; }
    function botY() { return cy() + f7PitS() * 0.9; }
    function topY() { return cy() - f7PitS() * 0.9; }
    function pitAt(x, y) {
      var s = f7PitS(), rr = s * 0.5;
      for (var i = 0; i <= 5; i++) if (dist(x, y, colX(i), botY()) < rr) return i;
      return -1;
    }

    return {
      update: function (dt) {
        if (over) return;
        fxUpdate(parts, dt, 0);
        lastT -= dt;
        cd -= dt;
        if (cd <= 0) {
          var dx = Math.sign(AX());
          if (dx) { cx = (cx + dx + 6) % 6; cd = 0.16; }
        }
        if (turn === 1) {
          if (pressed("a") && pits[cx]) move(cx);
          if (pressed("b")) hintOn = !hintOn;
        } else if (!over) {
          cpuT -= dt;
          if (cpuT <= 0) {
            var c = cpuChoose();
            if (c >= 0) move(c);
            cpuT = 0.75;
          }
        }
        if (!over) {
          hud("You " + pits[6] + " • CPU " + pits[13] + " • " + (turn === 1 ? "Your move" : "CPU thinking"));
        }
      },
      pointer: function (x, y) {
        if (over || turn !== 1) return;
        var i = pitAt(x, y);
        if (i >= 0 && pits[i]) { cx = i; move(i); }
      },
      draw: function () {
        clear("#0b0e12");
        var s = f7PitS(), rr = s * 0.42, cyy = cy();
        // board
        ctx2d.save();
        var gr = ctx2d.createLinearGradient(0, cyy - s * 1.5, 0, cyy + s * 1.5);
        gr.addColorStop(0, "#2b1d12"); gr.addColorStop(1, "#4a3420");
        ctx2d.fillStyle = gr;
        ctx2d.fillRect(ox() - s * 1.4, cyy - s * 1.45, 6 * s + s * 2.8, s * 2.9);
        ctx2d.restore();
        // stores
        var sw = s * 0.7, sh = s * 2.1;
        rect(sx(13) - sw / 2, cyy - sh / 2, sw, sh, "#3a2a18", 12);
        rect(sx(6) - sw / 2, cyy - sh / 2, sw, sh, "#3a2a18", 12);
        text(pits[13], sx(13), cyy + 6, 18, C.pink, "center", 900);
        text(pits[6], sx(6), cyy + 6, 18, C.cyan, "center", 900);
        text("CPU", sx(13), cyy - sh / 2 - 8, 11, "#aab", "center", 700);
        text("YOU", sx(6), cyy - sh / 2 - 8, 11, "#aab", "center", 700);
        // pits
        for (var i = 0; i <= 5; i++) {
          var px = colX(i);
          // player pit i (bottom) and CPU pit 12 - i (top)
          var pb = botY(), pt = topY();
          circle(px, pb, rr, "#2a2f3a");
          circle(px, pt, rr, "#2a2f3a");
          if (turn === 1 && cx === i) strokeCircle(px, pb, rr + 4, C.gold, 3);
          if (hintOn && turn === 1 && pits[i]) {
            var hv = f7Sim(pits, i, 1);
            if (hv.extra || hv.gain) strokeCircle(px, pb, rr + 8, C.lime, 2);
          }
          if (last === i && lastT > 0) strokeCircle(px, pb, rr + 2, C.cyan, 2);
          if (last === 12 - i && lastT > 0) strokeCircle(px, pt, rr + 2, C.cyan, 2);
          text(pits[i], px, pb + 5, 14, "#fff", "center", 800);
          text(pits[12 - i], px, pt + 5, 14, "#fff", "center", 800);
        }
        if (turn === 2) strokeCircle(sx(13), cyy, s * 0.8, C.pink, 2);
        else strokeCircle(sx(6), cyy, s * 0.8, C.cyan, 2);
        fxDraw(parts);
      },
      stop: function () {}
    };
  }

  /* ---------- Missile (city defence) ---------- */
  function f7Missile(g) {
    var goal = g.goal || 15;
    var cityF = [0.1, 0.25, 0.4, 0.6, 0.75, 0.9];
    var cities, foes = [], shots = [], booms = [], parts = [], stars = f7Stars(46);
    var score = 0, ammo = 12, reload = 0, spawnT = 1.2, shake = 0, over = false, t = 0;
    var cross = { x: 0, y: 0 };

    function gy() { return H() - 160; }
    function layout() {
      cities = cityF.map(function (f) { return { x: W() * f, alive: true }; });
      cross.x = W() / 2; cross.y = gy() - 160;
    }
    function alive() { var a = []; for (var i = 0; i < cities.length; i++) if (cities[i].alive) a.push(cities[i]); return a; }
    function baseX() { return W() / 2; }
    function aimTarget() {
      var a = alive();
      if (!a.length) return { x: baseX(), y: gy() };
      var c = pick(a);
      return { x: c.x + rand(-6, 6), y: gy() };
    }
    function spawnFoe(x, y, mirv) {
      var tg = aimTarget(), sp = 40 + Math.min(70, score * 2.6);
      var dx = tg.x - x, dy = tg.y - y, d = Math.hypot(dx, dy) || 1;
      foes.push({ x: x, y: y, vx: dx / d * sp, vy: dy / d * sp, mirv: mirv, split: mirv ? rand(H() * 0.34, H() * 0.5) : 0, });
    }
    function boom(x, y, r) {
      booms.push({ x: x, y: y, r: 0, max: r || 44, life: 0.7 });
      fxBurst(parts, x, y, C.orange, 16, 200);
      shake = Math.max(shake, 5);
    }

    layout();

    return {
      update: function (dt) {
        if (over) return;
        dt = Math.min(dt, 0.05);
        t += dt;
        shake = Math.max(0, shake - dt * 30);
        fxUpdate(parts, dt, 40);

        // aim: joystick moves the crosshair
        cross.x = clamp(cross.x + AX() * 280 * dt, 20, W() - 20);
        cross.y = clamp(cross.y + AY() * 280 * dt, 90, gy() - 30);

        if (ammo < 12) { reload -= dt; if (reload <= 0) { ammo++; reload = 1.4; } }
        else reload = 1.4;
        if (pressed("a") && ammo > 0) {
          ammo--;
          shots.push({ x: baseX(), y: gy() - 14, tx: cross.x, ty: cross.y, spd: 520 });
          beep(780, 260, 0.12, 'square', 0.08);
        }

        for (var s = shots.length - 1; s >= 0; s--) {
          var sh = shots[s], dx = sh.tx - sh.x, dy = sh.ty - sh.y, d = Math.hypot(dx, dy);
          var step = sh.spd * dt;
          if (d <= step) { boom(sh.tx, sh.ty, 44); shots.splice(s, 1); }
          else { sh.x += dx / d * step; sh.y += dy / d * step; }
        }

        spawnT -= dt;
        if (spawnT <= 0) {
          var rate = Math.max(0.5, 1.7 - score * 0.04);
          spawnT = rate * rand(0.7, 1.2);
          var mirvOdds = score >= 4 ? Math.min(0.4, score * 0.02) : 0;
          spawnFoe(rand(30, W() - 30), 80, Math.random() < mirvOdds);
        }

        for (var f = foes.length - 1; f >= 0; f--) {
          var e = foes[f];
          e.x += e.vx * dt; e.y += e.vy * dt;
          if (e.mirv && e.y >= e.split) {
            fxBurst(parts, e.x, e.y, C.yellow, 8, 120);
            spawnFoe(e.x, e.y, false); spawnFoe(e.x, e.y, false);
            foes.splice(f, 1);
          } else if (e.y >= gy()) {
            var near = false;
            for (var k = 0; k < cities.length; k++) {
              if (cities[k].alive && Math.abs(cities[k].x - e.x) < 26) { cities[k].alive = false; near = true; }
            }
            boom(e.x, gy(), 30);
            if (near) toast("City lost");
            foes.splice(f, 1);
          }
        }

        for (var b = booms.length - 1; b >= 0; b--) {
          var bo = booms[b];
          bo.life -= dt;
          bo.r = bo.max * Math.min(1, (0.7 - bo.life) / 0.25);
          if (bo.life <= 0) booms.splice(b, 1);
        }
        // explosions destroy warheads in their radius
        for (var bb = 0; bb < booms.length; bb++) {
          var B = booms[bb];
          for (var q = foes.length - 1; q >= 0; q--) {
            var F = foes[q];
            if (F.y < gy() - 4 && dist(B.x, B.y, F.x, F.y) < B.r + 6) {
              foes.splice(q, 1);
              score++;
              fxBurst(parts, F.x, F.y, C.lime, 10, 150);
              if (score % 3 === 0) beep(520, 1040, 0.15, 'sine', 0.12);
            }
          }
        }

        if (!alive().length) {
          over = true;
          toast("All cities lost");
          beep(260, 60, 0.6, 'sawtooth', 0.15);
          setTimeout(function () { miniFail(g, "Cities lost"); }, 700);
          return;
        }
        if (score >= goal) { over = true; completeMini(); return; }
        hud("Downed " + score + "/" + goal + " • Ammo " + ammo + " • Cities " + alive().length);
      },
      pointer: function (x, y) {
        if (over) return;
        cross.x = clamp(x, 20, W() - 20);
        cross.y = clamp(y, 90, gy() - 30);
        if (ammo > 0) { IN.act.a = true; }
      },
      draw: function () {
        var g0 = ctx2d.createLinearGradient(0, 0, 0, H());
        g0.addColorStop(0, "#050510"); g0.addColorStop(1, "#1a0f2e");
        ctx2d.fillStyle = g0; ctx2d.fillRect(0, 0, W(), H());
        ctx2d.save();
        if (shake > 0) ctx2d.translate(rand(-shake, shake), rand(-shake, shake));
        for (var i = 0; i < stars.length; i++) {
          ctx2d.fillStyle = "rgba(255,255,255," + (0.3 + stars[i][2] * 0.2) + ")";
          ctx2d.fillRect(stars[i][0] * W(), stars[i][1] * H(), stars[i][2], stars[i][2]);
        }
        // ground
        var gr = ctx2d.createLinearGradient(0, gy(), 0, H());
        gr.addColorStop(0, "#2b3a2a"); gr.addColorStop(1, "#0e140e");
        ctx2d.fillStyle = gr;
        ctx2d.fillRect(0, gy(), W(), H() - gy());
        // cities
        for (var c = 0; c < cities.length; c++) {
          var ct = cities[c], cx0 = ct.x;
          if (!ct.alive) { rect(cx0 - 14, gy() - 4, 28, 6, "#332", 2); continue; }
          for (var w = 0; w < 4; w++) {
            var hh = 14 + ((c * 7 + w * 5) % 4) * 6;
            rect(cx0 - 20 + w * 11, gy() - hh, 9, hh, "#2a3e5a", 2);
            rect(cx0 - 18 + w * 11, gy() - hh + 4, 2, 2, C.yellow);
            rect(cx0 - 14 + w * 11, gy() - hh + 10, 2, 2, C.yellow);
          }
        }
        // base
        ctx2d.beginPath();
        ctx2d.moveTo(baseX() - 30, gy() + 2); ctx2d.lineTo(baseX() - 12, gy() - 22);
        ctx2d.lineTo(baseX() + 12, gy() - 22); ctx2d.lineTo(baseX() + 30, gy() + 2); ctx2d.closePath();
        ctx2d.fillStyle = "#33405a"; ctx2d.fill();
        // enemy trails and warheads
        for (var f = 0; f < foes.length; f++) {
          var e = foes[f];
          ctx2d.strokeStyle = e.mirv ? C.yellow : C.red; ctx2d.lineWidth = 1.5;
          ctx2d.beginPath(); ctx2d.moveTo(e.x - e.vx * 0.35, e.y - e.vy * 0.35); ctx2d.lineTo(e.x, e.y); ctx2d.stroke();
          circle(e.x, e.y, e.mirv ? 5 : 3.5, e.mirv ? C.yellow : C.red);
        }
        // player shots
        for (var s = 0; s < shots.length; s++) {
          var sh = shots[s];
          ctx2d.strokeStyle = C.cyan; ctx2d.lineWidth = 2;
          ctx2d.beginPath(); ctx2d.moveTo(baseX(), gy() - 14); ctx2d.lineTo(sh.x, sh.y); ctx2d.stroke();
          circle(sh.x, sh.y, 3, C.white);
        }
        // blasts
        for (var b = 0; b < booms.length; b++) {
          var bo = booms[b];
          ctx2d.save();
          ctx2d.globalCompositeOperation = "lighter";
          var rg = ctx2d.createRadialGradient(bo.x, bo.y, 0, bo.x, bo.y, Math.max(1, bo.r));
          rg.addColorStop(0, "rgba(255,240,180,0.95)"); rg.addColorStop(0.6, "rgba(255,120,60,0.5)"); rg.addColorStop(1, "rgba(255,60,0,0)");
          ctx2d.fillStyle = rg;
          ctx2d.beginPath(); ctx2d.arc(bo.x, bo.y, Math.max(1, bo.r), 0, Math.PI * 2); ctx2d.fill();
          ctx2d.restore();
        }
        fxDraw(parts);
        // crosshair
        strokeCircle(cross.x, cross.y, 12, C.cyan, 2);
        line(cross.x - 18, cross.y, cross.x - 6, cross.y, C.cyan, 2);
        line(cross.x + 6, cross.y, cross.x + 18, cross.y, C.cyan, 2);
        line(cross.x, cross.y - 18, cross.x, cross.y - 6, C.cyan, 2);
        line(cross.x, cross.y + 6, cross.x, cross.y + 18, C.cyan, 2);
        // ammo pips
        for (var a = 0; a < 12; a++) circle(baseX() - 66 + a * 11, gy() + 16, 3.5, a < ammo ? C.lime : "rgba(255,255,255,0.15)");
        ctx2d.restore();
      },
      stop: function () {}
    };
  }

  /* ---------- Lander (terrain, wind, fuel cans) ---------- */
  function f7Lander(g) {
    var goal = g.goal || 3;
    var TS = 10, gravity = 60, thrust = 130;
    var L, pts, pads, cans = [], landed = 0, parts = [], shake = 0, over = false, t = 0, canT = 2, wind = 0;

    function gy() { return H() - 170; }
    function terrainAt(x) { return pts[clamp(Math.round(x / TS), 0, pts.length - 1)]; }
    function makeTerrain() {
      var n = Math.ceil(W() / TS) + 2, ph = rand(0, 6), amp = 20 + Math.min(30, landed * 3);
      pts = [];
      for (var i = 0; i < n; i++) pts.push(gy() - amp * (0.5 + 0.5 * Math.sin(i * 0.19 + ph)) - amp * 0.3 * Math.sin(i * 0.61 + ph * 2));
      pads = [];
      var count = 1 + Math.min(2, Math.floor(landed / 2));
      for (var k = 0; k < count; k++) {
        var w = Math.max(50, 96 - landed * 4 - k * 6);
        var cxp = rand(w / 2 + 20, W() - w / 2 - 20);
        var i0 = Math.max(0, Math.round((cxp - w / 2) / TS)), i1 = Math.min(n - 1, Math.round((cxp + w / 2) / TS));
        var py = Infinity;
        for (var j = i0; j <= i1; j++) py = Math.min(py, pts[j]);
        for (var q = i0; q <= i1; q++) pts[q] = py;
        pads.push({ x0: cxp - w / 2, x1: cxp + w / 2, y: py });
      }
    }
    function reset() {
      L = { x: W() / 2, y: 90, vx: 0, vy: 0, a: 0, fuel: L ? Math.min(100, L.fuel + 25) : 100 };
      makeTerrain();
    }
    function crash(msg) {
      over = true;
      shake = 14;
      fxBurst(parts, L.x, L.y, C.orange, 30, 220);
      beep(200, 60, 0.5, 'sawtooth', 0.2);
      toast(msg);
      setTimeout(function () { miniFail(g, msg); }, 700);
    }

    reset();

    return {
      update: function (dt) {
        if (over) return;
        dt = Math.min(dt, 0.05);
        t += dt;
        shake = Math.max(0, shake - dt * 30);
        var amp = 10 + Math.min(40, landed * 4);
        wind = amp * (Math.sin(t * 0.6) + 0.5 * Math.sin(t * 1.7 + 1));

        if (Math.abs(AX()) > 0.1) L.a += AX() * 2.4 * dt;
        else L.a *= 1 - 1.2 * dt;
        L.a = clamp(L.a, -1.3, 1.3);

        var th = IN.act.a && L.fuel > 0 ? 1 : 0;
        if (th) {
          L.fuel = Math.max(0, L.fuel - 16 * dt);
          var nx = L.x - Math.sin(L.a) * 12, ny = L.y + Math.cos(L.a) * 12;
          fxBurst(parts, nx, ny, C.orange, 2, 90);
        }
        L.vx += (Math.sin(L.a) * thrust * th + wind) * dt;
        L.vy += (-Math.cos(L.a) * thrust * th + gravity) * dt;
        L.x = clamp(L.x + L.vx * dt, 12, W() - 12);
        if (L.x <= 12 || L.x >= W() - 12) L.vx = 0;
        L.y += L.vy * dt;
        if (L.y < 30) { L.y = 30; L.vy = Math.max(0, L.vy); }
        fxUpdate(parts, dt, 0);

        // fuel cans drift in the air
        canT -= dt;
        if (canT <= 0 && cans.length < 2) {
          canT = 4;
          cans.push({ x: rand(40, W() - 40), y: rand(120, gy() - 140), bob: rand(0, 6) });
        }
        for (var c = cans.length - 1; c >= 0; c--) {
          var can = cans[c];
          can.bob += dt;
          if (dist(L.x, L.y, can.x, can.y + Math.sin(can.bob * 2) * 4) < 26) {
            L.fuel = Math.min(100, L.fuel + 35);
            fxBurst(parts, can.x, can.y, C.cyan, 12, 140);
            beep(880, 1320, 0.1, 'sine', 0.12);
            cans.splice(c, 1);
          }
        }

        // ground contact
        if (L.y + 12 >= terrainAt(L.x)) {
          var pad = null;
          for (var p = 0; p < pads.length; p++) if (L.x >= pads[p].x0 && L.x <= pads[p].x1) pad = pads[p];
          var speed = Math.hypot(L.vx, L.vy);
          if (pad && Math.abs(L.vx) < 38 && Math.abs(L.vy) < 42 && Math.abs(L.a) < 0.28) {
            landed++;
            fxBurst(parts, L.x, L.y, C.lime, 24, 160);
            beep(520, 880, 0.25, 'sine', 0.2);
            toast("Pad landed");
            if (landed >= goal) {
              over = true;
              completeMini();
              return;
            }
            reset();
          } else {
            crash(!pad ? "Missed the pad" : (speed > 55 ? "Too fast" : "Too tilted"));
            return;
          }
        }
        hud("Pad " + landed + "/" + goal + " • Fuel " + Math.ceil(L.fuel) + " • Speed " + Math.round(Math.hypot(L.vx, L.vy)));
      },
      draw: function () {
        clear("#05070f");
        var sg = ctx2d.createLinearGradient(0, 0, 0, H());
        sg.addColorStop(0, "#05070f"); sg.addColorStop(1, "#131b33");
        ctx2d.fillStyle = sg; ctx2d.fillRect(0, 0, W(), H());
        ctx2d.save();
        if (shake > 0) ctx2d.translate(rand(-shake, shake), rand(-shake, shake));
        for (var i = 0; i < 50; i++) circle((i * 73) % W(), (i * 41) % (H() * 0.6), 1, "rgba(255,255,255,.5)");
        // moon
        var mg = ctx2d.createRadialGradient(W() * 0.82, 110, 4, W() * 0.82, 110, 46);
        mg.addColorStop(0, "#e8ecf5"); mg.addColorStop(1, "rgba(100,120,160,0)");
        ctx2d.fillStyle = mg; ctx2d.beginPath(); ctx2d.arc(W() * 0.82, 110, 46, 0, Math.PI * 2); ctx2d.fill();
        // terrain
        ctx2d.beginPath();
        ctx2d.moveTo(0, H());
        for (var k = 0; k < pts.length; k++) ctx2d.lineTo(k * TS, pts[k]);
        ctx2d.lineTo(W(), H());
        ctx2d.closePath();
        ctx2d.fillStyle = "#2a2f40"; ctx2d.fill();
        ctx2d.strokeStyle = "#5b6790"; ctx2d.lineWidth = 2; ctx2d.stroke();
        // pads
        var blink = Math.sin(t * 6) > 0;
        for (var p = 0; p < pads.length; p++) {
          var pd = pads[p];
          rect(pd.x0, pd.y - 5, pd.x1 - pd.x0, 6, blink ? C.lime : "#3a6a4a", 3);
          circle(pd.x0, pd.y - 8, 2.5, blink ? C.yellow : "#555");
          circle(pd.x1, pd.y - 8, 2.5, blink ? C.yellow : "#555");
        }
        // fuel cans
        for (var c = 0; c < cans.length; c++) {
          var can = cans[c], by = can.y + Math.sin(can.bob * 2) * 4;
          rect(can.x - 9, by - 11, 18, 22, "#1f5f73", 4);
          text("F", can.x, by + 5, 12, C.cyan, "center", 900);
        }
        // wind gauge
        var wl = clamp(wind * 1.2, -60, 60);
        text("Wind", 16, 110, 12, "#9ab", "left", 700);
        line(60, 104, 60 + wl, 104, wind > 0 ? C.orange : C.cyan, 3);
        // lander
        ctx2d.save();
        ctx2d.translate(L.x, L.y); ctx2d.rotate(L.a);
        if (IN.act.a && L.fuel > 0) {
          var fl = 10 + Math.sin(performance.now() / 40) * 4;
          polygon([[-5, 9], [0, 9 + fl], [5, 9]], "#ff9a3a");
        }
        polygon([[0, -15], [-9, 6], [9, 6]], C.cyan);
        polygon([[-9, 6], [-14, 14], [-8, 12]], "#8ab");
        polygon([[9, 6], [14, 14], [8, 12]], "#8ab");
        circle(0, -2, 3, "#0b2b3a");
        ctx2d.restore();
        fxDraw(parts);
        ctx2d.restore();
        // fuel bar
        rect(W() - 96, 88, 80, 8, "rgba(255,255,255,0.12)", 4);
        rect(W() - 96, 88, 80 * clamp(L.fuel / 100, 0, 1), 8, L.fuel < 25 ? C.red : C.lime, 4);
      },
      stop: function () {}
    };
  }

  return {
    engines: {
      mancala: f7Mancala,
      missile: f7Missile,
      lander: f7Lander
    },
    minis: [
      { id: "mancala", title: "Mancala", icon: "🕳️", cat: "PUZZLE", desc: "Sow seeds, capture across the row, fill your store before the CPU does.", engine: "mancala", goal: 1 },
      { id: "missile", title: "Missile Command", icon: "🚀", cat: "ACTION", desc: "Shoot interceptors at falling warheads to save your cities. Some split in the air.", engine: "missile", goal: 15 },
      { id: "lander", title: "Lunar Lander", icon: "🌙", cat: "ARCADE", desc: "Land on the pads through wind and rough ground. Grab fuel cans on the way.", engine: "lander", goal: 3 }
    ]
  };
})();
