// new_11: stress-relief and fidget minigames (squish, pop, spin, breathe, sculpt, rake, puff)
window.__AG_new_11 = (function () {
  var TOP = 96;
  function bot() { return H() - 124; }
  function glow(x, y, r, c) {
    var g = ctx2d.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, c); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx2d.save(); ctx2d.globalCompositeOperation = 'lighter';
    circle(x, y, r, g); ctx2d.restore();
  }
  function domeFill(x, y, r, c1, c2) {
    var g = ctx2d.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
    g.addColorStop(0, c1); g.addColorStop(1, c2);
    circle(x, y, r, g);
  }
  function smooth(x) { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); }
  function segDist(px, py, x1, y1, x2, y2) {
    var dx = x2 - x1, dy = y2 - y1, L = dx * dx + dy * dy;
    var t = L ? clamp(((px - x1) * dx + (py - y1) * dy) / L, 0, 1) : 0;
    return dist(px, py, x1 + dx * t, y1 + dy * t);
  }

  // 1. Pocket Pop Sheet: pop every bubble on the sheet before time runs out.
  function gPocket(g) {
    var cols = 5, rows = 7, cells = [], n = 0, sheets = 0, left = 30 + g.goal * 1.5, parts = [], done = false, cw = 60, gx = 0, gy = 0, msg = 0;
    function layout() { cw = Math.min((W() - 40) / cols, 84); gx = (W() - cw * cols) / 2; gy = TOP + 20; }
    function fill() { cells = []; for (var i = 0; i < cols * rows; i++) cells.push({ p: 0, s: 0 }); }
    fill(); layout();
    return {
      update(dt) {
        if (done) return;
        left -= dt; msg = Math.max(0, msg - dt);
        if (left <= 0) { done = true; miniFail(g, 'The sheet was still full when time ran out.'); return; }
        cells.forEach(function (c) { if (c.p && c.s < 0.4) c.s += dt; });
        fxUpdate(parts, dt, 60);
        hud('Pops ' + n + ' / ' + g.goal + ' | ' + Math.ceil(left) + 's');
        if (n >= g.goal) { done = true; completeMini(); }
      },
      pointer(x, y) {
        if (done) return;
        layout();
        var c = Math.floor((x - gx) / cw), r = Math.floor((y - gy) / cw);
        if (c < 0 || c >= cols || r < 0 || r >= rows) return;
        var cell = cells[r * cols + c];
        if (cell.p) return;
        cell.p = 1; cell.s = 0; n++;
        var cx = gx + c * cw + cw / 2, cy = gy + r * cw + cw / 2;
        fxBurst(parts, cx, cy, C.cyan, 14, 160);
        beep(900 + rand(0, 300), 1400, 0.05, 'square', 0.12);
        if (cells.every(function (q) { return q.p; })) {
          sheets++; n += 3; msg = 1.2;
          beep(500, 1000, 0.25, 'sine', 0.2);
          fill();
        }
      },
      draw() {
        layout();
        clear('#0b0716');
        glow(W() / 2, H() / 2, W() * 0.7, 'rgba(60,40,120,0.5)');
        for (var i = 0; i < cells.length; i++) {
          var c = i % cols, r = Math.floor(i / cols);
          var x = gx + c * cw + cw / 2, y = gy + r * cw + cw / 2, rad = cw * 0.42, cell = cells[i];
          if (!cell.p) {
            glow(x, y, rad * 1.3, 'rgba(120,200,255,0.25)');
            domeFill(x, y, rad, '#bfeaff', '#2a7fb0');
            circle(x + rad * 0.25, y + rad * 0.3, rad * 0.25, 'rgba(255,255,255,0.18)');
          } else {
            ctx2d.globalAlpha = clamp(1 - cell.s * 2.5, 0, 1);
            circle(x, y, rad * (1 + cell.s * 2), '#7fd6ff');
            ctx2d.globalAlpha = 1;
            circle(x, y, rad * 0.85, '#1b2a3a');
            strokeCircle(x, y, rad * 0.85, '#2d4560', 2);
          }
        }
        fxDraw(parts);
        if (msg > 0) text('SHEET CLEARED +3', W() / 2, gy + rows * cw + 40, 20, C.yellow, 'center', 900);
        text('Sheets: ' + sheets, W() / 2, TOP - 8, 14, '#c9b8ff', 'center');
      },
      stop() { done = true; }
    };
  }

  // 2. Mochi Mash: squish the soft blob; each squish counts once the blob has relaxed.
  function gMochi(g) {
    var N = 28, R = 105, K = 26, D = 3.2, cx = W() / 2, cy = (TOP + bot()) / 2 - 20;
    var rx = [], ry = [], px = [], py = [], vx = [], vy = [];
    for (var i = 0; i < N; i++) {
      var a = i / N * Math.PI * 2;
      rx.push(Math.cos(a) * R); ry.push(Math.sin(a) * R);
      px.push(rx[i]); py.push(ry[i]); vx.push(0); vy.push(0);
    }
    var n = 0, cd = 0, left = 35 + g.goal * 2, parts = [], done = false, hue = 320;
    return {
      update(dt) {
        if (done) return;
        left -= dt; cd = Math.max(0, cd - dt);
        if (left <= 0) { done = true; miniFail(g, 'The mochi never stopped wobbling in time.'); return; }
        var h = Math.min(dt, 1 / 30);
        for (var i = 0; i < N; i++) {
          var l = (i + N - 1) % N, r = (i + 1) % N;
          var sx = (px[l] + px[r]) / 2 - px[i], sy = (py[l] + py[r]) / 2 - py[i];
          vx[i] += ((rx[i] - px[i]) * K + sx * 60 - vx[i] * D) * h;
          vy[i] += ((ry[i] - py[i]) * K + sy * 60 - vy[i] * D) * h;
          px[i] += vx[i] * h; py[i] += vy[i] * h;
        }
        fxUpdate(parts, dt, 120);
        hud('Squishes ' + n + ' / ' + g.goal + ' | ' + Math.ceil(left) + 's');
        if (n >= g.goal) { done = true; completeMini(); }
      },
      pointer(x, y) {
        if (done) return;
        var ox = x - cx, oy = y - cy;
        if (Math.hypot(ox, oy) > R * 1.25) return;
        var hit = false;
        for (var i = 0; i < N; i++) {
          var ax = cx + px[i], ay = cy + py[i];
          var d = dist(x, y, ax, ay);
          if (d < 95) {
            var k = (1 - d / 95) * 130, nx = (x - ax) / (d || 1), ny = (y - ay) / (d || 1);
            vx[i] += nx * k; vy[i] += ny * k;
            hit = true;
          }
        }
        if (hit && cd <= 0) {
          n++; cd = 0.35; hue = (hue + 37) % 360;
          fxBurst(parts, x, y, 'hsl(' + hue + ',90%,70%)', 16, 180);
          beep(260, 520, 0.12, 'sine', 0.2);
        }
      },
      draw() {
        clear('#140a1e');
        glow(cx, cy, R * 2, 'rgba(255,90,200,0.15)');
        ctx2d.beginPath();
        var sx0 = cx + (px[N - 1] + px[0]) / 2, sy0 = cy + (py[N - 1] + py[0]) / 2;
        ctx2d.moveTo(sx0, sy0);
        for (var i = 0; i < N; i++) {
          var j = (i + 1) % N;
          ctx2d.quadraticCurveTo(cx + px[i], cy + py[i], cx + (px[i] + px[j]) / 2, cy + (py[i] + py[j]) / 2);
        }
        var grd = ctx2d.createRadialGradient(cx - 30, cy - 40, 10, cx, cy, R * 1.2);
        grd.addColorStop(0, 'hsl(' + hue + ',95%,85%)'); grd.addColorStop(1, 'hsl(' + ((hue + 30) % 360) + ',80%,55%)');
        ctx2d.fillStyle = grd; ctx2d.fill();
        ctx2d.beginPath(); ctx2d.ellipse(cx + 22, cy - 34, 22, 10, -0.6, 0, Math.PI * 2);
        ctx2d.fillStyle = 'rgba(255,255,255,0.45)'; ctx2d.fill();
        ctx2d.beginPath(); ctx2d.ellipse(cx, cy + R + 26, R * 0.9, 12, 0, 0, Math.PI * 2);
        ctx2d.fillStyle = 'rgba(0,0,0,0.35)'; ctx2d.fill();
        fxDraw(parts);
        text('Tap the mochi to squish it', W() / 2, TOP + 14, 15, '#f3d9ff', 'center');
      },
      stop() { done = true; }
    };
  }

  // 3. Whirl Top: swipe or steer to keep the top spinning fast.
  function gWhirl(g) {
    var w = 0, ang = 0, spinT = 0, idle = 0, parts = [], done = false;
    return {
      update(dt) {
        if (done) return;
        w += (AX() * 6 + (pressed('a') ? 4 : 0)) * dt;
        w *= Math.exp(-0.35 * dt);
        w = clamp(w, -45, 45); ang += w * dt;
        if (Math.abs(w) > 10) spinT += dt;
        if (Math.abs(w) < 0.6) idle += dt; else idle = 0;
        if (idle > 4) { done = true; miniFail(g, 'The top wobbled to a stop.'); return; }
        if (Math.abs(w) > 12) {
          var a = rand(0, 6.283), cx = W() / 2, cy = (TOP + bot()) / 2;
          fxBurst(parts, cx + Math.cos(a) * 60, cy + Math.sin(a) * 60, C.gold, 2, 120);
        }
        fxUpdate(parts, dt, 0);
        hud('Spin ' + Math.floor(spinT) + ' / ' + g.goal + ' s');
        if (spinT >= g.goal) { done = true; completeMini(); }
      },
      swipe(dx) {
        if (done) return;
        w = clamp(w + clamp(dx * 0.12, -18, 18), -45, 45);
        beep(300 + Math.abs(w) * 10, 500, 0.08, 'triangle', 0.15);
      },
      draw() {
        var cx = W() / 2, cy = (TOP + bot()) / 2 - 20, R = 100;
        clear('#0c0f2a');
        glow(cx, cy, R * 2, 'rgba(120,100,255,0.25)');
        ctx2d.beginPath(); ctx2d.ellipse(cx, cy + 150, 120, 14, 0, 0, Math.PI * 2);
        ctx2d.fillStyle = 'rgba(0,0,0,0.4)'; ctx2d.fill();
        var speedGlow = clamp(Math.abs(w) / 30, 0, 1);
        for (var k = 0; k < 6; k++) {
          var a = ang + k * Math.PI / 3, a2 = a + Math.PI / 3;
          var tip = [cx + Math.cos(a) * R, cy + Math.sin(a) * R];
          var m = [cx + Math.cos(a + Math.PI / 6) * R * 0.3, cy + Math.sin(a + Math.PI / 6) * R * 0.3];
          var side = [cx + Math.cos(a2) * R * 0.25, cy + Math.sin(a2) * R * 0.25];
          polygon([[cx, cy], side, tip, m], k % 2 ? C.pink : C.cyan);
        }
        ctx2d.globalAlpha = 0.25 + speedGlow * 0.5;
        strokeCircle(cx, cy, R, C.white, 6);
        ctx2d.globalAlpha = 1;
        circle(cx, cy, 18, C.gold);
        circle(cx, cy, 7, '#fff8d0');
        fxDraw(parts);
        rect(W() / 2 - 100, bot() - 30, 200, 10, 'rgba(255,255,255,0.12)');
        rect(W() / 2 - 100, bot() - 30, 200 * clamp(Math.abs(w) / 45, 0, 1), 10, C.gold);
        text('Swipe or steer to spin', W() / 2, TOP + 14, 15, '#d8dcff', 'center');
      },
      stop() { done = true; }
    };
  }

  // 4. Tide Breath: a slow guide circle breathes in, holds and out; tap at the top of each breath.
  function gBreath(g) {
    var period = 10, t = 0, stress = 0, calm = 0, lastHit = -1, msg = '', msgT = 0, parts = [], done = false;
    function phase() { return (t % period) / period; }
    function radius(p) {
      var e = p < 0.4 ? smooth(p / 0.4) : p < 0.5 ? 1 : 1 - smooth((p - 0.5) / 0.5);
      return 40 + 110 * e;
    }
    return {
      update(dt) {
        if (done) return;
        t += dt; msgT = Math.max(0, msgT - dt);
        stress = Math.max(0, stress - 0.04 * dt);
        fxUpdate(parts, dt, 30);
        if (stress >= 1) { done = true; miniFail(g, 'Too tense. Breathe slower next time.'); return; }
        hud('Calm ' + calm + ' / ' + g.goal + ' | tension ' + Math.round(stress * 100) + '%');
        if (calm >= g.goal) { done = true; completeMini(); }
      },
      pointer(x, y) {
        if (done) return;
        var p = phase(), dd = Math.min(Math.abs(p - 0.4), 1 - Math.abs(p - 0.4));
        var cyc = Math.floor(t / period);
        if (dd <= 0.07) {
          if (lastHit === cyc) { stress += 0.1; msg = 'One tap per breath'; }
          else { lastHit = cyc; calm++; msg = 'Calm'; fxBurst(parts, W() / 2, (TOP + bot()) / 2, C.green, 18, 150); beep(440, 660, 0.3, 'sine', 0.2); }
        } else {
          stress += 0.25; msg = p < 0.4 ? 'Too early' : 'Too late';
          beep(180, 120, 0.15, 'sawtooth', 0.1);
        }
        msgT = 1;
      },
      draw() {
        var cx = W() / 2, cy = (TOP + bot()) / 2 - 10, p = phase(), r = radius(p);
        clear('#06141a');
        glow(cx, cy, r * 1.8, 'rgba(80,220,200,0.2)');
        ctx2d.setLineDash([6, 8]);
        strokeCircle(cx, cy, 150, 'rgba(160,255,230,0.5)', 2);
        ctx2d.setLineDash([]);
        domeFill(cx, cy, r, '#c9fff0', '#1f8f85');
        var label = p < 0.4 ? 'Breathe in' : p < 0.5 ? 'Hold' : 'Breathe out';
        text(label, cx, cy + 7, 20, '#e8fffa', 'center', 800);
        fxDraw(parts);
        text('Tap as the circle reaches its peak', W() / 2, TOP + 14, 15, '#b8f5e8', 'center');
        if (msgT > 0) text(msg, W() / 2, cy + 200, 18, C.green, 'center', 800);
        rect(W() / 2 - 80, bot() - 24, 160, 8, 'rgba(255,255,255,0.12)');
        rect(W() / 2 - 80, bot() - 24, 160 * clamp(stress, 0, 1), 8, C.orange);
      },
      stop() { done = true; }
    };
  }

  // 5. Pin Sculpt: tap pins through three heights until the sculpture matches the ghost shape.
  var SHAPES = [
    function (u, v) { return u * u + v * v < 0.55; },
    function (u, v) { return Math.abs(u) + Math.abs(v) < 0.85; },
    function (u, v) { var x = u * 1.25, y = -v * 1.25 + 0.15, a = x * x + y * y - 1; return a * a * a - x * x * y * y * y < 0; }
  ];
  function gPins(g) {
    var cols = 14, rows = 12, lv = [], tgt = [], n = 0, si = 0, left = 0, parts = [], done = false, cs = 20, gx = 0, gy = 0;
    function layout() { cs = Math.min((W() - 32) / cols, (bot() - TOP - 60) / rows); gx = (W() - cs * cols) / 2; gy = TOP + 30; }
    function setShape() {
      tgt = [];
      for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
        var u = (c + 0.5) / cols * 2 - 1, v = (r + 0.5) / rows * 2 - 1;
        tgt.push(SHAPES[si % SHAPES.length](u, v) ? 2 : 0);
      }
      lv = []; for (var i = 0; i < cols * rows; i++) lv.push(0);
      left = 75; si++;
    }
    layout(); setShape();
    return {
      update(dt) {
        if (done) return;
        left -= dt;
        if (left <= 0) { done = true; miniFail(g, 'Time ran out before the sculpture matched.'); return; }
        fxUpdate(parts, dt, 40);
        hud('Sculptures ' + n + ' / ' + g.goal + ' | ' + Math.ceil(left) + 's');
      },
      pointer(x, y) {
        if (done) return;
        layout();
        var c = Math.floor((x - gx) / cs), r = Math.floor((y - gy) / cs);
        if (c < 0 || c >= cols || r < 0 || r >= rows) return;
        var i = r * cols + c;
        lv[i] = (lv[i] + 1) % 3;
        fxBurst(parts, gx + c * cs + cs / 2, gy + r * cs + cs / 2, C.purple, 4, 60);
        beep(300 + lv[i] * 200, 400 + lv[i] * 200, 0.05, 'triangle', 0.12);
        var ok = true;
        for (var k = 0; k < lv.length; k++) if (lv[k] !== tgt[k]) { ok = false; break; }
        if (ok) {
          n++; fxBurst(parts, W() / 2, (TOP + bot()) / 2, C.lime, 40, 220);
          beep(600, 1200, 0.3, 'sine', 0.25);
          if (n >= g.goal) { done = true; completeMini(); return; }
          setShape();
        }
      },
      draw() {
        layout();
        clear('#101418');
        for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
          var i = r * cols + c, x = gx + c * cs + cs / 2, y = gy + r * cs + cs / 2;
          if (tgt[i]) circle(x, y, cs * 0.12, 'rgba(120,200,255,0.25)');
          var h = lv[i], rad = cs * 0.4, lift = h * cs * 0.1;
          circle(x + 2, y + 3 + lift, rad, 'rgba(0,0,0,0.45)');
          domeFill(x, y - lift, rad, h === 2 ? '#fff3b0' : h === 1 ? '#c9a7ff' : '#4e6b8a', h === 2 ? '#d98b2b' : h === 1 ? '#6a48c9' : '#243446');
        }
        fxDraw(parts);
        text('Tap pins to shape the ghost outline', W() / 2, TOP + 14, 15, '#d7e6ff', 'center');
      },
      stop() { done = true; }
    };
  }

  // 6. Bump Board: push bumps in; a random snap-back pops another one out. Clear each board.
  function gBumps(g) {
    var cols = 5, rows = 6, inn = [], anim = [], boards = 0, left = 30, parts = [], done = false, cw = 60, gx = 0, gy = 0;
    function layout() { cw = Math.min((W() - 40) / cols, 80); gx = (W() - cw * cols) / 2; gy = TOP + 20; }
    function reset() { inn = []; anim = []; for (var i = 0; i < cols * rows; i++) { inn.push(false); anim.push(0); } left = 35; }
    reset(); layout();
    return {
      update(dt) {
        if (done) return;
        left -= dt;
        if (left <= 0) { done = true; miniFail(g, 'The bumps snapped back out before the board filled.'); return; }
        for (var i = 0; i < anim.length; i++) anim[i] = Math.max(0, anim[i] - dt * 4);
        fxUpdate(parts, dt, 80);
        hud('Boards ' + boards + ' / ' + g.goal + ' | ' + Math.ceil(left) + 's');
        if (boards >= g.goal) { done = true; completeMini(); }
      },
      pointer(x, y) {
        if (done) return;
        layout();
        var c = Math.floor((x - gx) / cw), r = Math.floor((y - gy) / cw);
        if (c < 0 || c >= cols || r < 0 || r >= rows) return;
        var i = r * cols + c;
        if (inn[i]) return;
        inn[i] = true; anim[i] = 1;
        fxBurst(parts, gx + c * cw + cw / 2, gy + r * cw + cw / 2, C.pink, 10, 120);
        beep(700 + rand(0, 200), 420, 0.06, 'square', 0.12);
        if (rand(0, 1) < 0.12) {
          var outs = [];
          for (var k = 0; k < inn.length; k++) if (inn[k] && k !== i) outs.push(k);
          if (outs.length) { var j = pick(outs); inn[j] = false; anim[j] = 1; }
        }
        if (inn.every(function (q) { return q; })) {
          boards++; beep(400, 900, 0.3, 'sine', 0.2);
          fxBurst(parts, W() / 2, gy + rows * cw / 2, C.yellow, 30, 200);
          reset();
        }
      },
      draw() {
        layout();
        clear('#14101f');
        for (var i = 0; i < inn.length; i++) {
          var c = i % cols, r = Math.floor(i / cols);
          var x = gx + c * cw + cw / 2, y = gy + r * cw + cw / 2, rad = cw * 0.4;
          if (inn[i]) {
            circle(x, y, rad, '#0a0812');
            strokeCircle(x, y, rad * 0.9, '#2b2340', 3);
          } else {
            circle(x + 2, y + 4, rad, 'rgba(0,0,0,0.5)');
            domeFill(x, y, rad * (1 - anim[i] * 0.2), '#ffd6f2', '#c03f9a');
          }
        }
        fxDraw(parts);
        text('Push every bump in. Board ' + (boards + 1), W() / 2, TOP + 14, 15, '#f2d7ff', 'center');
      },
      stop() { done = true; }
    };
  }

  // 7. Sand Rake: swipe the rake across the sand so each stone gets circled.
  function gRake(g) {
    var stones = [], furrows = [], lastDown = null, n = 0, left = 25 + g.goal * 3, parts = [], done = false;
    function placeStone() {
      var s = { x: rand(60, W() - 60), y: rand(TOP + 60, bot() - 40), r: rand(12, 20) };
      stones.push(s);
    }
    for (var i = 0; i < 3; i++) placeStone();
    return {
      update(dt) {
        if (done) return;
        left -= dt;
        if (left <= 0) { done = true; miniFail(g, 'The sand was not raked in time.'); return; }
        furrows.forEach(function (f) { f.age += dt; });
        furrows = furrows.filter(function (f) { return f.age < 9; });
        fxUpdate(parts, dt, 30);
        hud('Stones circled ' + n + ' / ' + g.goal + ' | ' + Math.ceil(left) + 's');
        if (n >= g.goal) { done = true; completeMini(); }
      },
      pointer(x, y) { if (!done) lastDown = { x: x, y: y }; },
      swipe(dx, dy) {
        if (done || !lastDown) return;
        var x1 = lastDown.x, y1 = lastDown.y, x2 = x1 + dx, y2 = y1 + dy;
        lastDown = null;
        if (furrows.length > 80) furrows.shift();
        furrows.push({ x1: x1, y1: y1, x2: x2, y2: y2, age: 0 });
        for (var i = stones.length - 1; i >= 0; i--) {
          var s = stones[i];
          if (segDist(s.x, s.y, x1, y1, x2, y2) < s.r + 26) {
            n++; stones.splice(i, 1);
            fxBurst(parts, s.x, s.y, C.white, 16, 140);
            beep(520, 760, 0.12, 'sine', 0.2);
            placeStone();
          }
        }
      },
      draw() {
        clear('#e8d7b0');
        furrows.forEach(function (f) {
          var L = Math.hypot(f.x2 - f.x1, f.y2 - f.y1) || 1;
          var nx = -(f.y2 - f.y1) / L * 6, ny = (f.x2 - f.x1) / L * 6;
          ctx2d.globalAlpha = clamp(1 - f.age / 9, 0, 1) * 0.8;
          [-2, -1, 0, 1, 2].forEach(function (k) {
            line(f.x1 + nx * k, f.y1 + ny * k, f.x2 + nx * k, f.y2 + ny * k, '#b8956a', 2);
          });
        });
        ctx2d.globalAlpha = 1;
        stones.forEach(function (s) {
          circle(s.x + 3, s.y + 5, s.r, 'rgba(60,40,20,0.35)');
          domeFill(s.x, s.y, s.r, '#9aa0aa', '#4b505a');
          strokeCircle(s.x, s.y, s.r + 14, 'rgba(120,90,60,0.25)', 2);
        });
        fxDraw(parts);
        text('Drag a line past a stone to rake around it', W() / 2, TOP + 14, 15, '#5a4a30', 'center');
      },
      stop() { done = true; lastDown = null; }
    };
  }

  // 8. Puff Balloon: fill it, then tie with A while the needle sits in the sweet band; it bursts if overfilled.
  function gPuff(g) {
    var s = 0.2, n = 0, left = 40, msg = '', msgT = 0, parts = [], done = false;
    var gTop = TOP + 40, gH = 300, gX = W() - 36;
    return {
      update(dt) {
        if (done) return;
        left -= dt; msgT = Math.max(0, msgT - dt);
        s = Math.max(0, s - 0.025 * dt);
        if (s > 1) { done = true; miniFail(g, 'It popped! Puff gently.'); return; }
        if (pressed('a')) {
          if (s >= 0.72 && s <= 0.86) {
            n++; msg = 'Knot tied!'; fxBurst(parts, W() / 2, (TOP + bot()) / 2, C.pink, 30, 200);
            beep(600, 1000, 0.25, 'sine', 0.2);
            s = 0.2;
            if (n >= g.goal) { done = true; completeMini(); return; }
          } else { msg = s < 0.72 ? 'Too floppy' : 'Too tight'; beep(200, 120, 0.15, 'square', 0.12); }
          msgT = 1.2;
        }
        fxUpdate(parts, dt, 40);
        hud('Knots ' + n + ' / ' + g.goal + ' | ' + Math.ceil(left) + 's');
        if (left <= 0) { done = true; miniFail(g, 'No knot tied in time.'); }
      },
      pointer(x, y) {
        if (done) return;
        s = Math.min(1.1, s + 0.07);
        fxBurst(parts, x, y, C.cyan, 6, 90);
        beep(200 + s * 300, 240 + s * 300, 0.04, 'sine', 0.08);
      },
      draw() {
        var cx = W() / 2 - 20, cy = (TOP + bot()) / 2 - 40;
        clear('#1a0f2e');
        glow(cx, cy, 200, 'rgba(255,120,200,0.18)');
        var R = 40 + s * 120, rx = R * 0.85, ry = R * 1.05;
        var sway = Math.sin(performance.now() / 500) * 4;
        ctx2d.beginPath(); ctx2d.moveTo(cx, cy + ry + 6);
        ctx2d.quadraticCurveTo(cx + sway * 3, cy + ry + 60, cx - sway, cy + ry + 130);
        ctx2d.strokeStyle = 'rgba(255,255,255,0.4)'; ctx2d.lineWidth = 2; ctx2d.stroke();
        ctx2d.beginPath(); ctx2d.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        var grd = ctx2d.createRadialGradient(cx - rx * 0.3, cy - ry * 0.35, 6, cx, cy, ry * 1.1);
        var sweet = s >= 0.72 && s <= 0.86;
        grd.addColorStop(0, sweet ? '#d8ffe8' : '#ffd0e6'); grd.addColorStop(1, sweet ? '#2fb37a' : '#c2407f');
        ctx2d.fillStyle = grd; ctx2d.fill();
        polygon([[cx - 6, cy + ry - 2], [cx + 6, cy + ry - 2], [cx, cy + ry + 8]], '#8a2a5a');
        fxDraw(parts);
        rect(gX, gTop, 14, gH, 'rgba(255,255,255,0.12)');
        rect(gX, gTop + gH * (1 - 0.86 / 1.1), 14, gH * (0.14 / 1.1), C.green);
        rect(gX - 6, gTop + gH * (1 - clamp(s, 0, 1.1) / 1.1) - 2, 26, 4, C.white);
        text('Tie with A in the green band', W() / 2, TOP + 14, 15, '#ffd6f0', 'center');
        if (msgT > 0) text(msg, W() / 2, cy + ry + 170, 18, C.yellow, 'center', 800);
      },
      stop() { done = true; }
    };
  }

  return {
    engines: {
      n11_pocket: gPocket,
      n11_mochi: gMochi,
      n11_whirl: gWhirl,
      n11_breath: gBreath,
      n11_pins: gPins,
      n11_bumps: gBumps,
      n11_rake: gRake,
      n11_puff: gPuff
    },
    minis: [
      { id: 'n11_pocket', title: 'Pocket Pop Sheet', icon: '🫧', cat: 'STRESS', desc: 'Pop every bubble on the sheet before the clock runs out. Clearing a sheet bonus-pops three more.', engine: 'n11_pocket', goal: 30, hue: 200 },
      { id: 'n11_mochi', title: 'Mochi Mash', icon: '🍡', cat: 'STRESS', desc: 'Squish the soft mochi. Each squish waits for the blob to relax, and every squish shifts its colour.', engine: 'n11_mochi', goal: 25, hue: 320 },
      { id: 'n11_whirl', title: 'Whirl Top', icon: '🌀', cat: 'STRESS', desc: 'Swipe to flick the top, steer it with the joystick, and keep it spinning fast. Let it wobble to a stop and you lose.', engine: 'n11_whirl', goal: 40, hue: 250 },
      { id: 'n11_breath', title: 'Tide Breath', icon: '🌊', cat: 'STRESS', desc: 'Follow the breathing circle. Tap once per breath at its peak. Early or late taps build tension.', engine: 'n11_breath', goal: 12, hue: 170 },
      { id: 'n11_pins', title: 'Pin Sculpt', icon: '📌', cat: 'STRESS', desc: 'Tap pins through three heights to shape the ghost outline. Each sculpture has its own time limit.', engine: 'n11_pins', goal: 5, hue: 220 },
      { id: 'n11_bumps', title: 'Bump Board', icon: '🔘', cat: 'STRESS', desc: 'Push every bump in to clear the board. Beware: a snap-back pops a random bump out.', engine: 'n11_bumps', goal: 6, hue: 330 },
      { id: 'n11_rake', title: 'Sand Rake', icon: '🪨', cat: 'STRESS', desc: 'Drag a rake line past a stone to circle it. Each stone you circle is replaced by a new one.', engine: 'n11_rake', goal: 8, hue: 40 },
      { id: 'n11_puff', title: 'Puff Balloon', icon: '🎈', cat: 'STRESS', desc: 'Tap to puff the balloon. Press A to tie the knot while the needle is in the green band. Overfill it and it pops.', engine: 'n11_puff', goal: 6, hue: 300 }
    ],
    aaa: []
  };
})();
