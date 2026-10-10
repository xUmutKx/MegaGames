window.__AG_new_01 = (function () {
  function n01Sky(a, b) {
    var gr = ctx2d.createLinearGradient(0, 0, 0, H());
    gr.addColorStop(0, a); gr.addColorStop(1, b);
    ctx2d.fillStyle = gr; ctx2d.fillRect(0, 0, W(), H());
  }
  function n01Glow(x, y, r, col) {
    ctx2d.save();
    ctx2d.globalCompositeOperation = 'lighter';
    var gr = ctx2d.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)');
    ctx2d.fillStyle = gr;
    ctx2d.beginPath(); ctx2d.arc(x, y, r, 0, Math.PI * 2); ctx2d.fill();
    ctx2d.restore();
  }
  function n01Hearts(n, max, col) {
    for (var i = 0; i < max; i++) circle(22 + i * 20, 96, 6, i < n ? col : 'rgba(255,255,255,0.15)');
  }
  function n01Ang(a) {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
  }
  function n01Poly(pts, col, lw) {
    if (pts.length < 2) return;
    ctx2d.strokeStyle = col; ctx2d.lineWidth = lw || 2;
    ctx2d.beginPath(); ctx2d.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) ctx2d.lineTo(pts[i][0], pts[i][1]);
    ctx2d.stroke();
  }
  function n01Seg(px, py, ax, ay, bx, by) {
    var dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy;
    var t = L ? clamp(((px - ax) * dx + (py - ay) * dy) / L, 0, 1) : 0;
    return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
  }
  function n01Shake(s) { return [rand(-s, s) * 10, rand(-s, s) * 10]; }

  /* 1. Gravity Flip: floor/ceiling runner, tap flips gravity */
  function n01FlipRunner(g) {
    var goal = g.goal || 30, PH = 26, PX = W() * 0.28;
    function surf(s) { return s === 0 ? H() - 150 - PH / 2 : 110 + PH / 2; }
    var side = 0, py = surf(0), fromY = py, tw = 1, obs = [], parts = [], passed = 0, speed = 280, grid = 0, shake = 0, dead = false;
    function boom(reason) {
      dead = true; fxBurst(parts, PX, py, C.red, 30, 320); shake = 0.4;
      miniFail(g, reason);
    }
    function flip() {
      if (dead) return;
      fromY = py; tw = 0; side = 1 - side;
      fxBurst(parts, PX, py, C.cyan, 12, 170);
      beep(520, 880, 0.08, 'square', 0.05);
    }
    return {
      update: function (dt) {
        dt = Math.min(dt, 0.05);
        if (dead) return;
        if (pressed('a') || pressed('b') || pressed('c')) flip();
        if (tw < 1) tw = Math.min(1, tw + dt / 0.16);
        py = fromY + (surf(side) - fromY) * (tw * tw * (3 - 2 * tw));
        speed = Math.min(540, 280 + passed * 6);
        var i, o, w;
        for (i = 0; i < obs.length; i++) obs[i].x -= speed * dt;
        var last = obs[obs.length - 1];
        if (!last || last.x < W() - rand(230, 330)) obs.push({ x: W() + 40, side: Math.random() < 0.5 ? 0 : 1, n: randi(2, 3), passed: false });
        for (i = obs.length - 1; i >= 0; i--) {
          o = obs[i]; w = o.n * 22;
          if (!o.passed && o.x + w > PX - 13 && o.x < PX + 13) {
            if (o.side === 0 && py + PH / 2 > H() - 172) return boom('Floor spikes. Flip earlier.');
            if (o.side === 1 && py - PH / 2 < 132) return boom('Ceiling spikes. Flip earlier.');
          }
          if (!o.passed && o.x + w < PX - 13) {
            o.passed = true; passed++;
            fxBurst(parts, PX, py, C.green, 8, 120);
            hud(passed + ' / ' + goal);
            if (passed >= goal) { dead = true; completeMini(); return; }
          }
          if (o.x + w < -20) obs.splice(i, 1);
        }
        fxUpdate(parts, dt, 0);
        fxBurst(parts, PX - 12, py, C.purple, 1, 30);
        grid = (grid + speed * dt) % 40;
        shake = Math.max(0, shake - dt);
      },
      draw: function () {
        var s = shake > 0 ? n01Shake(shake) : [0, 0], x, i, k, o, x0;
        ctx2d.save(); ctx2d.translate(s[0], s[1]);
        n01Sky('#120833', '#05040f');
        rect(0, 0, W(), 110, '#1b0f40');
        rect(0, H() - 150, W(), 150, '#1b0f40');
        for (x = -grid; x < W(); x += 40) {
          rect(x, 116, 20, 3, 'rgba(169,120,255,0.35)');
          rect(x, H() - 144, 20, 3, 'rgba(169,120,255,0.35)');
        }
        n01Glow(W() / 2, 110, W() * 0.6, 'rgba(255,79,216,0.18)');
        n01Glow(W() / 2, H() - 150, W() * 0.6, 'rgba(255,79,216,0.18)');
        line(0, 110, W(), 110, C.pink, 3);
        line(0, H() - 150, W(), H() - 150, C.pink, 3);
        for (i = 0; i < obs.length; i++) {
          o = obs[i];
          for (k = 0; k < o.n; k++) {
            x0 = o.x + k * 22;
            if (o.side === 0) polygon([[x0, H() - 150], [x0 + 11, H() - 172], [x0 + 22, H() - 150]], C.red);
            else polygon([[x0, 110], [x0 + 11, 132], [x0 + 22, 110]], C.red);
          }
        }
        n01Glow(PX, py, 34, 'rgba(85,230,255,0.5)');
        rect(PX - 13, py - 13, 26, 26, C.cyan, true);
        rect(PX - 13, py - 13, 26, 6, 'rgba(255,255,255,0.45)', true);
        rect(PX + 3, py - 6, 6, 6, '#05070b', false);
        fxDraw(parts);
        ctx2d.restore();
      },
      pointer: function () { flip(); },
      stop: function () {}
    };
  }

  /* 2. Lane Dash: three-lane pseudo-3D highway, jump over low barriers */
  function n01LaneDash(g) {
    var goal = g.goal || 40, PZ = 0.92;
    var lane = 1, laneX = 1, air = 0, lives = 3, rows = [], dodged = 0, coins = 0, parts = [], shake = 0, dead = false, t = 0, stripe = 0, axL = false, axR = false, spacing = 0.3;
    function sc(z) { return 0.25 + 0.75 * z; }
    function ly(z) { return 130 + (H() - 250) * z; }
    function lcx(l, z) { return W() / 2 + (l - 1) * W() * 0.28 * sc(z); }
    function bx(b, z) { return W() / 2 + b * W() * 0.28 * sc(z); }
    function newRow() {
      var blk = [false, false, false], free = [0, 1, 2], nb = Math.random() < 0.45 ? 2 : 1, i, j, coin = -1;
      for (i = 0; i < nb; i++) { j = randi(0, free.length - 1); blk[free[j]] = true; free.splice(j, 1); }
      if (free.length && Math.random() < 0.6) coin = pick(free);
      return { z: 0, blk: blk, low: Math.random() < 0.4, coin: coin, judged: false, gotCoin: false };
    }
    function moveLane(d) { if (!dead) lane = clamp(lane + d, 0, 2); }
    function jump() {
      if (dead || air > 0) return;
      air = 0.55;
      fxBurst(parts, lcx(laneX, PZ), ly(PZ), C.cyan, 8, 140);
      beep(380, 760, 0.12, 'sine', 0.06);
    }
    return {
      update: function (dt) {
        dt = Math.min(dt, 0.05);
        if (dead) return;
        t += dt;
        var ax = AX(), speedZ, last, i, row, l;
        if (ax < -0.6) { if (!axL) { axL = true; moveLane(-1); } } else axL = false;
        if (ax > 0.6) { if (!axR) { axR = true; moveLane(1); } } else axR = false;
        if (pressed('a') || pressed('b') || pressed('c')) jump();
        laneX += (lane - laneX) * Math.min(1, dt * 14);
        air = Math.max(0, air - dt);
        speedZ = 0.5 + Math.min(0.45, dodged * 0.01);
        stripe = (stripe + speedZ * dt) % 0.2;
        last = rows[rows.length - 1];
        if (!last || last.z > spacing) { rows.push(newRow()); spacing = rand(0.26, 0.36); }
        for (i = 0; i < rows.length; i++) {
          row = rows[i];
          row.z += speedZ * dt;
          if (!row.judged && row.z >= PZ) {
            row.judged = true;
            if (row.blk[lane] && !(row.low && air > 0)) {
              lives--; shake = 0.35;
              fxBurst(parts, lcx(laneX, PZ), ly(PZ) - 30, C.red, 24, 260);
              beep(160, 60, 0.25, 'sawtooth', 0.08);
              if (lives <= 0) { dead = true; miniFail(g, 'Too many crashes. Stay in the open lanes.'); return; }
            } else {
              dodged++;
              if (row.coin === lane) { coins++; row.gotCoin = true; fxBurst(parts, lcx(laneX, PZ), ly(PZ) - 30, C.gold, 10, 120); }
              hud(dodged + ' / ' + goal);
              if (dodged >= goal) { dead = true; completeMini(); return; }
            }
          }
        }
        for (i = rows.length - 1; i >= 0; i--) if (rows[i].z > 1.12) rows.splice(i, 1);
        fxUpdate(parts, dt, 0);
        shake = Math.max(0, shake - dt);
      },
      draw: function () {
        var s = shake > 0 ? n01Shake(shake) : [0, 0], i, zz, row, z, x, y, w, h, col, l, b, sp, jh, px, py;
        ctx2d.save(); ctx2d.translate(s[0], s[1]);
        n01Sky('#2a0f4a', '#0b0620');
        n01Glow(W() / 2, 120, 120, 'rgba(255,79,216,0.35)');
        polygon([[W() / 2 - 14, 130], [W() / 2 + 14, 130], [W() + 200, H()], [-200, H()]], '#1a0b35');
        for (b = -1.5; b <= 1.5; b += 1) line(bx(b, 0), ly(0), bx(b, 1), ly(1), 'rgba(169,120,255,0.55)', 2);
        for (zz = stripe; zz < 1; zz += 0.2) {
          for (b = -0.5; b <= 0.5; b += 1) {
            line(bx(b, zz), ly(zz), bx(b, Math.min(1, zz + 0.06)), ly(Math.min(1, zz + 0.06)), C.pink, 2);
          }
        }
        for (i = rows.length - 1; i >= 0; i--) {
          row = rows[i]; z = row.z;
          if (z <= 0) continue;
          for (l = 0; l < 3; l++) {
            if (!row.blk[l]) continue;
            sp = sc(z); x = lcx(l, z); y = ly(z);
            w = W() * 0.2 * sp; h = (row.low ? 26 : 90) * sp;
            col = row.low ? C.orange : C.pink;
            n01Glow(x, y - h / 2, w * 0.8, row.low ? 'rgba(255,145,77,0.25)' : 'rgba(255,79,216,0.25)');
            rect(x - w / 2, y - h, w, h, '#2b0f3f');
            rect(x - w / 2, y - h, w, Math.max(3, h * 0.18), col);
          }
          if (row.coin >= 0 && !row.gotCoin) {
            sp = sc(z); x = lcx(row.coin, z); y = ly(z) - 40 * sp;
            n01Glow(x, y, 26 * sp, 'rgba(255,209,92,0.5)');
            circle(x, y, 9 * sp, C.gold);
          }
        }
        sp = sc(PZ); px = lcx(laneX, PZ); py = ly(PZ);
        jh = air > 0 ? Math.sin(Math.PI * (1 - air / 0.55)) * 90 : 0;
        circle(px, py + 6, 20 * sp, 'rgba(0,0,0,0.35)');
        n01Glow(px, py - 30 * sp - jh, 60 * sp, 'rgba(85,230,255,0.4)');
        rect(px - 18 * sp, py - 46 * sp - jh, 36 * sp, 36 * sp, C.cyan, true);
        rect(px - 18 * sp, py - 46 * sp - jh, 36 * sp, 10 * sp, C.white, true);
        circle(px - 12 * sp, py - 4 * sp, 5 * sp, '#05070b');
        circle(px + 12 * sp, py - 4 * sp, 5 * sp, '#05070b');
        fxDraw(parts);
        n01Hearts(lives, 3, C.pink);
        text('Coins ' + coins, W() - 16, 100, 14, C.gold, 'right');
        ctx2d.restore();
      },
      pointer: function () { jump(); },
      swipe: function (dx, dy) {
        if (dead) return;
        if (Math.abs(dx) > Math.abs(dy)) moveLane(dx < 0 ? -1 : 1);
        else if (dy < -30) jump();
      },
      stop: function () {}
    };
  }

  /* 3. Wall Hop: bounce between the walls of a shaft, avoid spike rows */
  function n01WallHop(g) {
    var goal = g.goal || 40, WL = 34, WR = W() - 34, PY = H() * 0.62;
    function xOf(s) { return s === 0 ? WL + 15 : WR - 15; }
    var tside = 0, px = xOf(0), fromX = px, tw = 1, rows = [], parts = [], passed = 0, speed = 240, scroll = 0, shake = 0, dead = false, gapY = 200;
    function crash() {
      dead = true; shake = 0.4; fxBurst(parts, px, PY, C.red, 30, 300);
      miniFail(g, 'Caught on the spikes. Switch walls before they arrive.');
    }
    function jump() {
      if (dead) return;
      fromX = px; tw = 0; tside = 1 - tside;
      fxBurst(parts, px, PY, C.cyan, 10, 160);
      beep(600, 900, 0.07, 'square', 0.05);
    }
    return {
      update: function (dt) {
        dt = Math.min(dt, 0.05);
        if (dead) return;
        var i, r, last, k;
        if (pressed('a') || pressed('b') || pressed('c')) jump();
        if (tw < 1) tw = Math.min(1, tw + dt / 0.2);
        px = fromX + (xOf(tside) - fromX) * (tw * tw * (3 - 2 * tw));
        speed = Math.min(460, 240 + passed * 5);
        scroll += speed * dt;
        last = rows[rows.length - 1];
        if (!last || last.y > gapY) { rows.push({ y: -30, side: Math.random() < 0.5 ? 0 : 1, len: rand(16, 30), checked: false }); gapY = rand(180, 240); }
        for (i = 0; i < rows.length; i++) rows[i].y += speed * dt;
        for (i = rows.length - 1; i >= 0; i--) {
          r = rows[i];
          if (!r.checked && r.y >= PY - 12 && r.y <= PY + 12) {
            if ((r.side === 0 && px - 13 < WL + r.len) || (r.side === 1 && px + 13 > WR - r.len)) { crash(); return; }
          }
          if (!r.checked && r.y > PY + 12) {
            r.checked = true; passed++;
            hud(passed + ' / ' + goal);
            fxBurst(parts, r.side === 0 ? WR : WL, r.y, C.yellow, 4, 90);
            if (passed >= goal) { dead = true; completeMini(); return; }
          }
        }
        for (i = rows.length - 1; i >= 0; i--) if (rows[i].y > H() + 40) rows.splice(i, 1);
        fxUpdate(parts, dt, 0);
        shake = Math.max(0, shake - dt);
      },
      draw: function () {
        var s = shake > 0 ? n01Shake(shake) : [0, 0], i, k, r, y, y0;
        ctx2d.save(); ctx2d.translate(s[0], s[1]);
        n01Sky('#0c1a2e', '#03050b');
        for (y = (scroll % 60) - 60; y < H(); y += 60) rect(W() / 2 - 2, y, 4, 30, 'rgba(85,230,255,0.08)');
        rect(0, 0, WL, H(), '#0f2238');
        rect(WR, 0, W() - WR, H(), '#0f2238');
        for (y = (scroll % 40) - 40; y < H(); y += 40) {
          rect(0, y, WL, 10, 'rgba(85,230,255,0.10)');
          rect(WR, y, W() - WR, 10, 'rgba(85,230,255,0.10)');
        }
        line(WL, 0, WL, H(), C.cyan, 3);
        line(WR, 0, WR, H(), C.cyan, 3);
        n01Glow(WL, H() / 2, 90, 'rgba(85,230,255,0.10)');
        n01Glow(WR, H() / 2, 90, 'rgba(85,230,255,0.10)');
        for (i = 0; i < rows.length; i++) {
          r = rows[i];
          for (k = -1; k <= 1; k++) {
            y0 = r.y + k * 12;
            if (r.side === 0) polygon([[WL, y0 - 6], [WL + r.len, y0], [WL, y0 + 6]], C.red);
            else polygon([[WR, y0 - 6], [WR - r.len, y0], [WR, y0 + 6]], C.red);
          }
        }
        n01Glow(px, PY, 36, 'rgba(85,230,255,0.45)');
        rect(px - 13, PY - 13, 26, 26, C.cyan, true);
        rect(px - 13, PY - 13, 26, 6, 'rgba(255,255,255,0.45)', true);
        fxDraw(parts);
        ctx2d.restore();
      },
      pointer: function () { jump(); },
      stop: function () {}
    };
  }

  /* 4. Wave Surfer: endless sine wave, jump rocks, duck under gates */
  function n01WaveSurfer(g) {
    var goal = g.goal || 40, PX = W() * 0.25, base = H() - 200;
    function gy(wx) { return base + Math.sin(wx * 0.012) * 12 + Math.sin(wx * 0.031) * 3; }
    var scroll = 0, speed = 270, obs = [], parts = [], passed = 0, lives = 2, inv = 0, py = gy(PX), vy = 0, air = false, duckT = 0, dead = false, t = 0, shake = 0, upHeld = false;
    function isDuck() { return duckT > 0 && !air; }
    function jump() {
      if (dead || air) return;
      vy = -600; air = true;
      fxBurst(parts, PX, py, C.cyan, 8, 120);
      beep(420, 820, 0.1, 'triangle', 0.06);
    }
    function hurt(msg) {
      if (inv > 0) return;
      lives--; inv = 1.2; shake = 0.35;
      fxBurst(parts, PX, py - 20, C.red, 24, 260);
      beep(180, 70, 0.25, 'sawtooth', 0.08);
      if (lives <= 0) { dead = true; miniFail(g, msg); }
    }
    return {
      update: function (dt) {
        dt = Math.min(dt, 0.05);
        if (dead) return;
        t += dt;
        var up = AY() < -0.5, down, gp, last, i, o, sx, gyo;
        if (pressed('a') || pressed('b') || pressed('c')) jump();
        if (up && !upHeld) jump();
        upHeld = up;
        down = AY() > 0.5 || key('s') || key('arrowdown');
        if (down) duckT = 0.12; else duckT = Math.max(0, duckT - dt);
        inv = Math.max(0, inv - dt);
        speed = Math.min(520, 270 + passed * 5);
        scroll += speed * dt;
        gp = gy(PX + scroll);
        if (!air) { py = gp; vy = 0; }
        else {
          vy += 1500 * dt; py += vy * dt;
          if (py >= gp && vy >= 0) { py = gp; vy = 0; air = false; }
        }
        if (!air && Math.random() < 0.5) fxBurst(parts, PX - 14, py, C.white, 1, 40);
        last = obs[obs.length - 1];
        if (!last || last.wx - scroll < W() - rand(200, 320)) obs.push({ wx: scroll + W() + 40, kind: Math.random() < 0.6 ? 'rock' : 'gate', passed: false });
        for (i = obs.length - 1; i >= 0; i--) {
          o = obs[i]; sx = o.wx - scroll; gyo = gy(o.wx);
          if (!o.passed && Math.abs(sx - PX) < (o.kind === 'rock' ? 20 : 26)) {
            if (o.kind === 'rock' && py > gyo - 20) { hurt('Hit a rock. Jump earlier.'); if (dead) return; }
            if (o.kind === 'gate' && py - (isDuck() ? 20 : 40) < gyo - 34 && py > gyo - 40) { hurt('Ran into a gate. Duck under it.'); if (dead) return; }
          }
          if (!o.passed && sx < PX - 30) {
            o.passed = true; passed++;
            hud(passed + ' / ' + goal);
            if (passed >= goal) { dead = true; completeMini(); return; }
          }
          if (sx < -60) obs.splice(i, 1);
        }
        fxUpdate(parts, dt, 0);
        shake = Math.max(0, shake - dt);
      },
      draw: function () {
        var s = shake > 0 ? n01Shake(shake) : [0, 0], x, i, o, sx, gyo, pts, ph;
        ctx2d.save(); ctx2d.translate(s[0], s[1]);
        n01Sky('#0b3350', '#04111f');
        n01Glow(W() * 0.72, 150, 110, 'rgba(255,145,77,0.35)');
        pts = [[0, H()]];
        for (x = 0; x <= W(); x += 10) pts.push([x, 360 + Math.sin((x + scroll * 0.3) * 0.02) * 30 + Math.sin((x + scroll * 0.3) * 0.05) * 8]);
        pts.push([W(), H()]);
        polygon(pts, '#0f3d5c');
        pts = [[0, H()]];
        for (x = 0; x <= W(); x += 6) pts.push([x, gy(x + scroll) + 26]);
        pts.push([W(), H()]);
        polygon(pts, '#083a57');
        pts = [[0, H()]];
        for (x = 0; x <= W(); x += 6) pts.push([x, gy(x + scroll)]);
        pts.push([W(), H()]);
        polygon(pts, '#0a4a6e');
        n01Poly(pts.slice(1, pts.length - 1), C.cyan, 3);
        for (i = 0; i < obs.length; i++) {
          o = obs[i]; sx = o.wx - scroll;
          if (sx < -40 || sx > W() + 40) continue;
          gyo = gy(o.wx);
          if (o.kind === 'rock') {
            polygon([[sx - 14, gyo + 2], [sx - 4, gyo - 26], [sx + 6, gyo - 16], [sx + 14, gyo + 2]], '#7b8ea3');
          } else {
            rect(sx - 23, gyo - 40, 4, 40, '#c9d3dd');
            rect(sx + 19, gyo - 40, 4, 40, '#c9d3dd');
            rect(sx - 23, gyo - 40, 46, 6, C.orange, true);
          }
        }
        ph = isDuck() ? 20 : 40;
        if (inv <= 0 || Math.floor(t * 12) % 2 === 0) {
          n01Glow(PX, py - ph / 2, 40, 'rgba(255,209,92,0.4)');
          rect(PX - 11, py - ph, 22, ph, C.yellow, true);
          rect(PX - 20, py - 5, 40, 5, C.pink, true);
        }
        fxDraw(parts);
        n01Hearts(lives, 2, C.yellow);
        ctx2d.restore();
      },
      pointer: function () { jump(); },
      stop: function () {}
    };
  }

  /* 5. Rune Slash: one stroke slices falling orbs, bombs must be avoided */
  function n01RuneSlash(g) {
    var goal = g.goal || 40, lives = 3, orbs = [], trails = [], parts = [], sliced = 0, combo = 0, spawnT = 0.6, t = 0, sx0 = 0, sy0 = 0, dead = false, shake = 0;
    function fail(msg) { dead = true; miniFail(g, msg); }
    function spawnOne(x, kind, vy) {
      orbs.push({
        x: x, y: 100, vx: rand(-40, 40), vy: vy, kind: kind,
        r: kind === 2 ? 18 : kind === 1 ? 15 : 14,
        col: kind === 1 ? C.gold : C.cyan, dead: false
      });
    }
    return {
      update: function (dt) {
        dt = Math.min(dt, 0.05);
        if (dead) return;
        t += dt;
        var i, o, k, r, vy, base, bombP, kind;
        spawnT -= dt;
        if (spawnT <= 0) {
          spawnT = Math.max(0.5, 1.15 - sliced * 0.012) * rand(0.8, 1.2);
          vy = rand(110, 170) + sliced * 1.5;
          r = Math.random();
          if (r < 0.2) {
            base = rand(100, W() - 100);
            for (k = 0; k < 3; k++) spawnOne(base + (k - 1) * 36, 0, vy);
          } else {
            bombP = Math.min(0.22, 0.06 + sliced * 0.003);
            kind = Math.random() < bombP ? 2 : (Math.random() < 0.15 ? 1 : 0);
            spawnOne(rand(40, W() - 40), kind, vy);
          }
        }
        for (i = 0; i < orbs.length; i++) { o = orbs[i]; o.x += o.vx * dt; o.y += o.vy * dt; }
        for (i = orbs.length - 1; i >= 0; i--) {
          o = orbs[i];
          if (o.dead || o.y > H() - 130) {
            if (!o.dead && o.kind !== 2) {
              lives--; combo = 0; shake = 0.25;
              fxBurst(parts, o.x, H() - 130, C.pink, 14, 180);
              if (lives <= 0) { fail('Too many orbs got through.'); return; }
            }
            orbs.splice(i, 1);
          }
        }
        for (i = trails.length - 1; i >= 0; i--) { trails[i].life -= dt; if (trails[i].life <= 0) trails.splice(i, 1); }
        fxUpdate(parts, dt, 200);
        shake = Math.max(0, shake - dt);
      },
      swipe: function (dx, dy) {
        if (dead) return;
        var x1 = sx0 + dx, y1 = sy0 + dy, i, o;
        trails.push({ x1: sx0, y1: sy0, x2: x1, y2: y1, life: 0.3 });
        for (i = 0; i < orbs.length; i++) {
          o = orbs[i];
          if (o.dead || n01Seg(o.x, o.y, sx0, sy0, x1, y1) > o.r + 4) continue;
          o.dead = true;
          if (o.kind === 2) {
            lives--; shake = 0.3; combo = 0;
            fxBurst(parts, o.x, o.y, C.red, 26, 260);
            beep(140, 60, 0.3, 'sawtooth', 0.08);
            if (lives <= 0) { fail('The bomb took your last heart.'); return; }
          } else {
            sliced++; combo++;
            fxBurst(parts, o.x, o.y, o.col, 16, 240);
            beep(700 + Math.min(combo, 10) * 30, 1200, 0.06, 'triangle', 0.05);
          }
        }
        hud(sliced + ' / ' + goal);
        if (!dead && sliced >= goal) { dead = true; completeMini(); }
      },
      pointer: function (x, y) { sx0 = x; sy0 = y; },
      draw: function () {
        var s = shake > 0 ? n01Shake(shake) : [0, 0], i, o, tr, mx;
        ctx2d.save(); ctx2d.translate(s[0], s[1]);
        n01Sky('#1d0c33', '#070311');
        for (i = 0; i < 20; i++) {
          mx = (i * 97) % W();
          circle(mx, 80 + ((i * 131 + t * (10 + (i % 5) * 4)) % (H() - 200)), 1.5, 'rgba(169,120,255,0.35)');
        }
        for (i = 0; i < orbs.length; i++) {
          o = orbs[i];
          if (o.kind === 2) {
            n01Glow(o.x, o.y, 34, 'rgba(255,85,112,0.35)');
            circle(o.x, o.y, o.r, '#2a0a14');
            strokeCircle(o.x, o.y, o.r + 1, C.red, 3);
            text('!', o.x, o.y + 6, 18, C.red, 'center', 900);
          } else {
            n01Glow(o.x, o.y, o.r * 2.6, o.kind === 1 ? 'rgba(255,209,92,0.5)' : 'rgba(85,230,255,0.45)');
            circle(o.x, o.y, o.r, o.col);
            circle(o.x - o.r * 0.3, o.y - o.r * 0.3, o.r * 0.35, 'rgba(255,255,255,0.8)');
          }
        }
        for (i = 0; i < trails.length; i++) {
          tr = trails[i];
          ctx2d.globalAlpha = Math.max(0, tr.life / 0.3);
          line(tr.x1, tr.y1, tr.x2, tr.y2, C.cyan, 9);
          line(tr.x1, tr.y1, tr.x2, tr.y2, C.white, 3);
        }
        ctx2d.globalAlpha = 1;
        fxDraw(parts);
        n01Hearts(lives, 3, C.pink);
        if (combo >= 3) text(combo + 'x COMBO', W() / 2, 130, 16, C.gold, 'center');
        ctx2d.restore();
      },
      stop: function () {}
    };
  }

  /* 6. Orbit Guard: spinning shield arc protects a core, tap reverses spin */
  function n01OrbitGuard(g) {
    var goal = g.goal || 50, cx = W() / 2, cy = (H() - 50) / 2, CORE = 40, SHR = 74, ARC = 0.66;
    var a = 0, dir = 1, lives = 3, enemies = [], parts = [], blocked = 0, spawnT = 1.2, t = 0, shake = 0, dead = false, flash = 0;
    var glowOf = { fast: 'rgba(255,85,112,0.45)', weave: 'rgba(168,255,92,0.45)', norm: 'rgba(77,163,255,0.45)' };
    var colOf = { fast: C.red, weave: C.lime, norm: C.blue };
    function flipDir() {
      if (dead) return;
      dir = -dir; flash = 0.2;
      beep(700, 500, 0.05, 'square', 0.05);
      fxBurst(parts, cx + Math.cos(a) * SHR, cy + Math.sin(a) * SHR, C.cyan, 10, 160);
    }
    return {
      update: function (dt) {
        dt = Math.min(dt, 0.05);
        if (dead) return;
        t += dt;
        var spd, r, type, i, e, d;
        if (pressed('a') || pressed('b') || pressed('c')) flipDir();
        spd = Math.min(4.2, 2.2 + blocked * 0.03);
        a = n01Ang(a + dir * spd * dt);
        spawnT -= dt;
        if (spawnT <= 0) {
          spawnT = Math.max(0.5, 1.5 - blocked * 0.02) * rand(0.8, 1.2);
          r = Math.random();
          type = r < 0.2 ? 'fast' : r < 0.35 ? 'weave' : 'norm';
          enemies.push({ th: rand(-Math.PI, Math.PI), r: 340, v: rand(80, 110) * (type === 'fast' ? 1.8 : 1), type: type, ph: rand(0, 6), judged: false, pass: false, dead: false });
        }
        for (i = enemies.length - 1; i >= 0; i--) {
          e = enemies[i];
          e.r -= e.v * dt;
          if (e.type === 'weave') e.th = n01Ang(e.th + Math.sin(t * 4 + e.ph) * 0.9 * dt);
          if (!e.judged && e.r <= SHR) {
            e.judged = true;
            d = n01Ang(e.th - a);
            if (Math.abs(d) < ARC / 2 + 0.1) {
              e.dead = true; blocked++;
              fxBurst(parts, cx + Math.cos(e.th) * SHR, cy + Math.sin(e.th) * SHR, colOf[e.type], 16, 200);
              hud(blocked + ' / ' + goal);
              if (blocked >= goal) { dead = true; completeMini(); return; }
            } else e.pass = true;
          }
          if (e.pass && !e.dead && e.r <= CORE) {
            e.dead = true; lives--; shake = 0.35;
            fxBurst(parts, cx, cy, C.red, 26, 260);
            beep(160, 60, 0.25, 'sawtooth', 0.08);
            if (lives <= 0) { dead = true; miniFail(g, 'The core was breached. Block with the shield!'); return; }
          }
          if (e.dead) enemies.splice(i, 1);
        }
        fxUpdate(parts, dt, 0);
        flash = Math.max(0, flash - dt);
        shake = Math.max(0, shake - dt);
      },
      draw: function () {
        var s = shake > 0 ? n01Shake(shake) : [0, 0], i, e, ex, ey;
        ctx2d.save(); ctx2d.translate(s[0], s[1]);
        n01Sky('#120a26', '#030209');
        strokeCircle(cx, cy, 120, 'rgba(169,120,255,0.12)', 1);
        strokeCircle(cx, cy, 200, 'rgba(169,120,255,0.10)', 1);
        strokeCircle(cx, cy, 280, 'rgba(169,120,255,0.08)', 1);
        n01Glow(cx, cy, 90, 'rgba(255,79,216,0.35)');
        circle(cx, cy, CORE, '#2a0f3f');
        strokeCircle(cx, cy, CORE, C.pink, 3);
        circle(cx, cy, 12 + Math.sin(t * 5) * 2, C.pink);
        ctx2d.save();
        ctx2d.lineCap = 'round';
        ctx2d.strokeStyle = flash > 0 ? C.white : C.cyan;
        ctx2d.lineWidth = 8;
        ctx2d.shadowColor = C.cyan; ctx2d.shadowBlur = 16;
        ctx2d.beginPath(); ctx2d.arc(cx, cy, SHR, a - ARC / 2, a + ARC / 2); ctx2d.stroke();
        ctx2d.restore();
        for (i = 0; i < enemies.length; i++) {
          e = enemies[i];
          ex = cx + Math.cos(e.th) * e.r; ey = cy + Math.sin(e.th) * e.r;
          n01Glow(ex, ey, 20, glowOf[e.type]);
          circle(ex, ey, 9, colOf[e.type]);
          circle(ex, ey, 4, C.white);
        }
        fxDraw(parts);
        n01Hearts(lives, 3, C.pink);
        ctx2d.restore();
      },
      pointer: function () { flipDir(); },
      stop: function () {}
    };
  }

  /* 7. Chain Hop: endless platform runner with double jump and saw blades */
  function n01ChainHop(g) {
    var goal = g.goal || 40, PX = W() * 0.25, plats = [], gems = [], parts = [], passed = 0, lives = 3, speed = 280, bg = 0, gemCount = 0;
    var py = H() * 0.6, prev = py, vy = 0, onG = false, jumps = 0, inv = 0, t = 0, dead = false, shake = 0;
    plats.push({ x: -60, w: W() + 200, y: H() * 0.6, saw: null, counted: false });
    function addPlat() {
      var last = plats[plats.length - 1];
      var gap = rand(70, 150) + Math.min(30, passed * 0.6);
      var w = Math.max(110, rand(150, 300) - Math.min(70, passed * 1.2));
      var y = clamp(last.y + rand(-70, 70), H() * 0.34, H() - 200);
      var x = last.x + last.w + gap;
      var saw = w > 210 && Math.random() < 0.5 ? { o: 0.5, d: Math.random() < 0.5 ? 1 : -1 } : null;
      plats.push({ x: x, w: w, y: y, saw: saw, counted: false });
      if (Math.random() < 0.55) gems.push({ x: last.x + last.w + gap / 2, y: Math.min(last.y, y) - 70, got: false, ph: rand(0, 6) });
    }
    function jump() {
      if (dead) return;
      if (onG || jumps === 0) {
        vy = -640; onG = false; jumps = 1;
        fxBurst(parts, PX, py, C.lime, 8, 120);
        beep(440, 880, 0.08, 'square', 0.05);
      } else if (jumps === 1) {
        vy = -560; jumps = 2;
        fxBurst(parts, PX, py, C.cyan, 12, 160);
        beep(600, 1000, 0.08, 'sine', 0.06);
      }
    }
    return {
      update: function (dt) {
        dt = Math.min(dt, 0.05);
        if (dead) return;
        t += dt;
        var i, p, under = null, saw, sx, gm, last;
        inv = Math.max(0, inv - dt);
        if (pressed('a') || pressed('b') || pressed('c')) jump();
        speed = Math.min(460, 280 + passed * 3);
        bg += speed * dt;
        for (i = 0; i < plats.length; i++) {
          p = plats[i];
          p.x -= speed * dt;
          if (p.saw) {
            p.saw.o += p.saw.d * dt * 0.35;
            if (p.saw.o > 0.9) { p.saw.o = 0.9; p.saw.d = -1; }
            if (p.saw.o < 0.1) { p.saw.o = 0.1; p.saw.d = 1; }
          }
        }
        for (i = 0; i < gems.length; i++) gems[i].x -= speed * dt;
        for (i = 0; i < plats.length; i++) {
          p = plats[i];
          if (p.x <= PX && p.x + p.w >= PX) { under = p; break; }
        }
        if (onG) {
          if (!under) onG = false; else py = under.y;
        }
        if (!onG) {
          vy += 1600 * dt; prev = py; py += vy * dt;
          if (under && vy >= 0 && prev <= under.y + 2 && py >= under.y) {
            py = under.y; vy = 0; onG = true; jumps = 0;
            fxBurst(parts, PX, py, C.lime, 5, 80);
          }
        }
        if (py > H() + 30) { dead = true; miniFail(g, 'Fell into the gap.'); return; }
        for (i = 0; i < plats.length; i++) {
          p = plats[i];
          if (!p.saw) continue;
          sx = p.x + p.saw.o * p.w;
          if (inv <= 0 && Math.abs(sx - PX) < 20 && py > p.y - 12) {
            lives--; inv = 1; shake = 0.3;
            fxBurst(parts, PX, py - 14, C.red, 22, 240);
            beep(160, 60, 0.25, 'sawtooth', 0.08);
            if (lives <= 0) { dead = true; miniFail(g, 'Shredded by the saw blades.'); return; }
          }
        }
        for (i = plats.length - 1; i >= 0; i--) {
          p = plats[i];
          if (!p.counted && p.x + p.w < PX - 10) {
            p.counted = true; passed++;
            hud(passed + ' / ' + goal);
            if (passed >= goal) { dead = true; completeMini(); return; }
          }
          if (p.x + p.w < -40) plats.splice(i, 1);
        }
        for (i = gems.length - 1; i >= 0; i--) {
          gm = gems[i];
          if (!gm.got && dist(gm.x, gm.y, PX, py - 16) < 26) {
            gm.got = true; gemCount++;
            fxBurst(parts, gm.x, gm.y, C.gold, 12, 160);
          }
          if (gm.got || gm.x < -30) gems.splice(i, 1);
        }
        last = plats[plats.length - 1];
        while (last.x + last.w < W() + 80) { addPlat(); last = plats[plats.length - 1]; }
        fxUpdate(parts, dt, 0);
        shake = Math.max(0, shake - dt);
      },
      draw: function () {
        var s = shake > 0 ? n01Shake(shake) : [0, 0], i, k, p, x, y, bh, sx, sy, ang, gm, bob, legs;
        ctx2d.save(); ctx2d.translate(s[0], s[1]);
        n01Sky('#2a0f3a', '#080414');
        for (i = 0; i < 14; i++) {
          x = ((i * 67 - bg * 0.15) % (W() + 80) + (W() + 80)) % (W() + 80) - 40;
          bh = 60 + (i * 37) % 80;
          rect(x, H() * 0.72 - bh, 42, H() - (H() * 0.72 - bh), '#1b0b33');
        }
        for (i = 0; i < plats.length; i++) {
          p = plats[i];
          if (p.x > W() + 10 || p.x + p.w < -10) continue;
          rect(p.x, p.y, p.w, H() - p.y, '#23104a');
          rect(p.x, p.y, p.w, 8, C.lime);
          rect(p.x, p.y + 8, p.w, 2, 'rgba(168,255,92,0.35)');
          for (k = 0; k < p.w; k += 36) rect(p.x + k + 6, p.y + 22, 16, 4, 'rgba(255,255,255,0.06)');
          if (p.saw) {
            sx = p.x + p.saw.o * p.w; sy = p.y - 14;
            n01Glow(sx, sy, 22, 'rgba(255,85,112,0.35)');
            circle(sx, sy, 12, '#7a1d2c');
            ang = t * 14;
            line(sx + Math.cos(ang) * 12, sy + Math.sin(ang) * 12, sx - Math.cos(ang) * 12, sy - Math.sin(ang) * 12, C.orange, 3);
            line(sx + Math.cos(ang + 1.57) * 12, sy + Math.sin(ang + 1.57) * 12, sx - Math.cos(ang + 1.57) * 12, sy - Math.sin(ang + 1.57) * 12, C.orange, 3);
          }
        }
        for (i = 0; i < gems.length; i++) {
          gm = gems[i];
          bob = Math.sin(t * 4 + gm.ph) * 4;
          n01Glow(gm.x, gm.y + bob, 18, 'rgba(255,209,92,0.5)');
          circle(gm.x, gm.y + bob, 7, C.gold);
        }
        legs = onG ? Math.sin(t * 24) * 4 : 0;
        if (inv <= 0 || Math.floor(t * 12) % 2 === 0) {
          n01Glow(PX, py - 16, 34, 'rgba(85,230,255,0.45)');
          rect(PX - 11, py - 30, 22, 26, C.cyan, true);
          rect(PX - 11, py - 30, 22, 7, C.white, true);
          rect(PX - 9 + legs, py - 4, 6, 4, C.blue);
          rect(PX + 3 - legs, py - 4, 6, 4, C.blue);
        }
        fxDraw(parts);
        n01Hearts(lives, 3, C.pink);
        text('Gems ' + gemCount, W() - 16, 100, 14, C.gold, 'right');
        ctx2d.restore();
      },
      pointer: function () { jump(); },
      stop: function () {}
    };
  }

  /* 8. Thrust Tunnel: chopper inside a squeezing cave, thrust against gravity */
  function n01ThrustTunnel(g) {
    var goal = g.goal || 50, PX = W() * 0.3;
    var cols = [], base = 0, scrollX = 0, speed = 220, travel = 0, ship = H() / 2, vy = 0, thrustT = 0, parts = [], shake = 0, t = 0, dead = false;
    var topY = H() * 0.3, botY = H() * 0.65, slope = 0, slopeLeft = 0;
    function genCol() {
      if (slopeLeft <= 0) { slope = rand(-2.5, 2.5); slopeLeft = randi(20, 60); }
      slopeLeft--;
      var gapMin = Math.max(130, 230 - travel * 0.03);
      topY = clamp(topY + slope + rand(-1, 1), 60, H() - 260);
      botY = clamp(botY + slope * 0.8 + rand(-1, 1), topY + gapMin, Math.min(H() - 90, topY + 320));
      cols.push({ top: topY, bot: botY });
    }
    function ensure(n) { while (base + cols.length < n) genCol(); }
    var k;
    for (k = 0; k < 60; k++) genCol();
    return {
      update: function (dt) {
        dt = Math.min(dt, 0.05);
        if (dead) return;
        t += dt;
        var thrust = AY() < -0.25 || key('w') || key('arrowup') || key(' ') || thrustT > 0;
        var idx, c, drop;
        thrustT = Math.max(0, thrustT - dt);
        vy += (760 - (thrust ? 1150 : 0)) * dt;
        vy = clamp(vy, -400, 400);
        ship += vy * dt;
        speed = Math.min(340, 220 + travel * 0.02);
        travel += speed * dt; scrollX += speed * dt;
        idx = Math.floor((scrollX + PX) / 8);
        ensure(idx + 100);
        c = cols[idx - base];
        if (c && (ship - 10 < c.top || ship + 10 > c.bot)) {
          dead = true; shake = 0.4;
          fxBurst(parts, PX, ship, C.red, 30, 300);
          miniFail(g, 'Clipped the cave wall.');
          return;
        }
        drop = idx - base - 150;
        if (drop > 0) { cols.splice(0, drop); base += drop; }
        if (thrust) fxBurst(parts, PX - 10, ship + 6, C.orange, 2, 90);
        fxUpdate(parts, dt, 0);
        shake = Math.max(0, shake - dt);
        var m = Math.floor(travel / 200);
        hud(m + ' / ' + goal);
        if (m >= goal) { dead = true; completeMini(); }
      },
      draw: function () {
        var s = shake > 0 ? n01Shake(shake) : [0, 0], i, x, c, topPts = [[0, 0]], botPts = [[0, H()]];
        ctx2d.save(); ctx2d.translate(s[0], s[1]);
        n01Sky('#0d0a24', '#040311');
        for (i = 0; i < 30; i++) {
          x = ((i * 113 - scrollX * 0.25) % W() + W()) % W();
          rect(x, (i * 71) % H(), 2, 2, 'rgba(255,255,255,0.4)');
        }
        for (x = 0; x <= W(); x += 8) {
          c = cols[Math.floor((scrollX + x) / 8) - base];
          topPts.push([x, c ? c.top : 0]);
          botPts.push([x, c ? c.bot : H()]);
        }
        topPts.push([W(), 0]); botPts.push([W(), H()]);
        polygon(topPts, '#1c0b2e');
        polygon(botPts, '#1c0b2e');
        n01Poly(topPts.slice(1, topPts.length - 1), C.pink, 3);
        n01Poly(botPts.slice(1, botPts.length - 1), C.pink, 3);
        n01Glow(PX, ship, 30, 'rgba(85,230,255,0.4)');
        polygon([[PX - 12, ship + 2], [PX - 26, ship + 6 + vy * 0.01], [PX - 12, ship + 8]], C.orange);
        circle(PX, ship, 10, C.cyan);
        circle(PX + 3, ship - 3, 3, C.white);
        line(PX - 18, ship - 11, PX + 18, ship - 11, C.white, 2);
        fxDraw(parts);
        ctx2d.restore();
      },
      pointer: function () { thrustT = 0.15; },
      stop: function () {}
    };
  }

  return {
    engines: {
      n01_flip_runner: n01FlipRunner,
      n01_lane_dash: n01LaneDash,
      n01_wall_hop: n01WallHop,
      n01_wave_surfer: n01WaveSurfer,
      n01_rune_slash: n01RuneSlash,
      n01_orbit_guard: n01OrbitGuard,
      n01_chain_hop: n01ChainHop,
      n01_thrust_tunnel: n01ThrustTunnel
    },
    minis: [
      { id: 'n01_flip_runner', title: 'Gravity Flip', icon: '🔄', cat: 'ACTION', desc: 'Run forever along a floor and a ceiling. Spikes come from both. Clear the gates and keep your nerve.', engine: 'n01_flip_runner', goal: 30 },
      { id: 'n01_lane_dash', title: 'Lane Dash', icon: '🛣️', cat: 'ACTION', desc: 'Race down a neon highway in three lanes. Switch lanes, hop low barriers, grab coins. Three crashes end the run.', engine: 'n01_lane_dash', goal: 40 },
      { id: 'n01_wall_hop', title: 'Wall Hop', icon: '🧗', cat: 'ACTION', desc: 'Scramble down a narrow shaft. Leap between the walls before the spike rows reach you.', engine: 'n01_wall_hop', goal: 40 },
      { id: 'n01_wave_surfer', title: 'Wave Surfer', icon: '🏄', cat: 'ACTION', desc: 'Ride an endless rolling wave. Jump the rocks, duck under the gates, and survive two hits.', engine: 'n01_wave_surfer', goal: 40 },
      { id: 'n01_rune_slash', title: 'Rune Slash', icon: '⚔️', cat: 'ACTION', desc: 'Orbs fall from the sky. Cut through them in one stroke. Avoid the bombs and let no more than three orbs fall.', engine: 'n01_rune_slash', goal: 40 },
      { id: 'n01_orbit_guard', title: 'Orbit Guard', icon: '🛡️', cat: 'ACTION', desc: 'A spinning shield arc guards the core. Reverse the spin at the right moment to catch every drone.', engine: 'n01_orbit_guard', goal: 50 },
      { id: 'n01_chain_hop', title: 'Chain Hop', icon: '🦘', cat: 'ACTION', desc: 'Leap across floating platforms that never stop. Double jump in mid-air, dodge saw blades, collect gems.', engine: 'n01_chain_hop', goal: 40 },
      { id: 'n01_thrust_tunnel', title: 'Thrust Tunnel', icon: '🚁', cat: 'ACTION', desc: 'Pilot a small chopper through a squeezing cave. Thrust against gravity and stay clear of the walls for 50 meters.', engine: 'n01_thrust_tunnel', goal: 50 }
    ],
    aaa: []
  };
})();
