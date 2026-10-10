// new_03: physics stacking and balance toys (8 minigames).
window.__AG_new_03 = (function () {
  var TAU = Math.PI * 2;

  function sky(top, bot) {
    var g = ctx2d.createLinearGradient(0, 0, 0, H());
    g.addColorStop(0, top);
    g.addColorStop(1, bot);
    ctx2d.fillStyle = g;
    ctx2d.fillRect(0, 0, W(), H());
  }
  function glowDot(x, y, r, c, blur) {
    ctx2d.save();
    ctx2d.shadowColor = c;
    ctx2d.shadowBlur = blur || 16;
    circle(x, y, r, c);
    ctx2d.restore();
  }
  function pop(list, x, y, s, c, size) {
    list.push({ x: x, y: y, s: s, c: c, size: size || 16, life: 1 });
  }
  function popStep(list, dt) {
    for (var i = list.length - 1; i >= 0; i--) {
      var p = list[i];
      p.y -= 34 * dt;
      p.life -= dt * 0.9;
      if (p.life <= 0) list.splice(i, 1);
    }
  }
  function popDraw(list) {
    for (var i = 0; i < list.length; i++) {
      var p = list[i];
      ctx2d.globalAlpha = clamp(p.life, 0, 1);
      text(p.s, p.x, p.y, p.size, p.c, 'center', 900);
    }
    ctx2d.globalAlpha = 1;
  }

  /* ---------- 1. Skyline Stacker: swinging blocks onto a tower ---------- */
  var STACK_COLS = ['#7dd3fc', '#c4b5fd', '#86efac', '#fde68a', '#fca5a5', '#f0abfc'];
  function gameSkylineStacker(g) {
    var BH = 26, GOAL = g.goal;
    var tower = [{ x: W() / 2 - 80, w: 160, c: '#64748b' }];
    var t = 0, cw = 160, cxC = W() / 2, drop = null, over = false, cam = 0, shake = 0;
    var parts = [], pops = [];
    function ground() { return H() - 150; }
    function score() { return tower.length - 1; }
    function drawBlock(x, y, w, c) {
      rect(x, y, w, BH, c);
      rect(x, y, w, 4, 'rgba(255,255,255,0.45)');
      rect(x, y + BH - 4, w, 4, 'rgba(0,0,0,0.25)');
    }
    function land() {
      var top = tower[tower.length - 1];
      var l = Math.max(drop.x, top.x), r = Math.min(drop.x + drop.w, top.x + top.w), ov = r - l;
      var ly = drop.y;
      if (ov <= 2) {
        parts.push({ x: drop.x, y: ly, w: drop.w, vx: 0, vy: 0, c: '#f87171' });
        drop = null;
        over = true;
        shake = 0.4;
        beep(300, 80, 0.4, 'sawtooth', 0.08);
        miniFail(g, 'The block missed the tower');
        return;
      }
      var perfect = Math.abs(drop.x - top.x) < 3;
      var nx = l, nw = ov;
      if (perfect) {
        nx = top.x;
        nw = top.w;
        pop(pops, nx + nw / 2, ly - 10, 'PERFECT', C.gold, 20);
      } else {
        if (drop.x < l) parts.push({ x: drop.x, y: ly, w: l - drop.x, vx: -50, vy: 0, c: '#fca5a5' });
        if (drop.x + drop.w > r) parts.push({ x: r, y: ly, w: drop.x + drop.w - r, vx: 50, vy: 0, c: '#fca5a5' });
      }
      tower.push({ x: nx, w: nw, c: STACK_COLS[(tower.length - 1) % STACK_COLS.length] });
      cw = Math.max(30, nw);
      drop = null;
      shake = 0.06;
      beep(520 + score() * 12, 700 + score() * 12, 0.08, 'square', 0.05);
      if (score() >= GOAL) { over = true; completeMini(); }
    }
    function doDrop() {
      if (drop || over) return;
      drop = { x: cxC - cw / 2, w: cw, y: 120, vy: 0 };
    }
    return {
      update: function (dt) {
        dt = Math.min(dt, 1 / 30);
        t += dt;
        shake = Math.max(0, shake - dt);
        var sp = Math.min(3.4, 1.3 + score() * 0.09);
        cxC = W() / 2 + Math.sin(t * sp) * (W() / 2 - 44 - cw / 2);
        if (!over && pressed('a')) doDrop();
        if (drop) {
          drop.vy += 1500 * dt;
          drop.y += drop.vy * dt;
          var target = ground() - tower.length * BH - cam - BH;
          if (drop.y >= target) { drop.y = target; land(); }
        }
        var goalCam = Math.max(0, tower.length * BH - (ground() - 280));
        cam += (goalCam - cam) * Math.min(1, dt * 3);
        for (var i = parts.length - 1; i >= 0; i--) {
          var p = parts[i];
          p.vy += 1400 * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          if (p.y > H() + 40) parts.splice(i, 1);
        }
        popStep(pops, dt);
        hud('Tower ' + score() + ' / ' + GOAL);
      },
      draw: function () {
        sky('#0f172a', '#1e3a5f');
        ctx2d.save();
        if (shake > 0) ctx2d.translate(rand(-5, 5) * shake * 4, rand(-5, 5) * shake * 4);
        rect(0, 84, W(), 6, '#475569');
        line(cxC, 90, cxC, 120, '#94a3b8', 2);
        if (!drop && !over) drawBlock(cxC - cw / 2, 120, cw, '#fbbf24');
        if (drop) drawBlock(drop.x, drop.y, drop.w, '#fbbf24');
        var gy = ground() - cam;
        rect(0, gy, W(), H() - gy + 10, '#1e293b');
        for (var i = 0; i < tower.length; i++) {
          var b = tower[i];
          drawBlock(b.x, gy - (i + 1) * BH, b.w, b.c);
        }
        for (var j = 0; j < parts.length; j++) rect(parts[j].x, parts[j].y, parts[j].w, BH, parts[j].c);
        popDraw(pops);
        ctx2d.restore();
      },
      pointer: function () { if (!over) doDrop(); },
      stop: function () {}
    };
  }

  /* ---------- 2. Pole Tamer: inverted pendulum on a cart ---------- */
  function gamePoleTamer(g) {
    var L = 150, th = 0.06, om = 0, x = W() / 2, v = 0, time = 0, wind = 0, gustT = 2;
    var target = null, targetT = 0, over = false, trail = [];
    function cy() { return H() * 0.6; }
    return {
      update: function (dt) {
        if (over) return;
        dt = Math.min(dt, 1 / 30);
        time += dt;
        gustT -= dt;
        if (gustT <= 0) { wind = pick([-1, 1]) * rand(420, 600); gustT = rand(2.2, 3.8); }
        wind *= Math.exp(-1.8 * dt);
        if (targetT > 0) { targetT -= dt; if (targetT <= 0) target = null; }
        var h = dt / 4;
        for (var s = 0; s < 4; s++) {
          var a = AX() * 900 + wind;
          if (target !== null) a += (target - x) * 3.2 - v * 2.4;
          var alpha = (1250 / L) * Math.sin(th) - (a / L) * Math.cos(th) - 0.2 * om;
          om += alpha * h;
          th += om * h;
          v = (v + a * h) * Math.exp(-1.2 * h);
          x += v * h;
          if (x < 40) { x = 40; v = 0; }
          if (x > W() - 40) { x = W() - 40; v = 0; }
        }
        if (Math.abs(th) > 0.95) {
          over = true;
          beep(200, 60, 0.5, 'sawtooth', 0.08);
          miniFail(g, 'The pole crashed');
          return;
        }
        trail.push({ x: x + L * Math.sin(th), y: cy() - 10 - L * Math.cos(th) });
        if (trail.length > 18) trail.shift();
        hud('Balanced ' + Math.floor(time) + ' / ' + g.goal);
        if (time >= g.goal) { over = true; completeMini(); }
      },
      draw: function () {
        sky('#120a24', '#2b1d4d');
        var px = x, py = cy() - 10;
        var bx = px + L * Math.sin(th), by = py - L * Math.cos(th);
        rect(0, cy() + 22, W(), 4, '#64748b');
        for (var i = 0; i < trail.length; i++) {
          ctx2d.globalAlpha = (i / trail.length) * 0.5;
          circle(trail[i].x, trail[i].y, 3, '#7dd3fc');
        }
        ctx2d.globalAlpha = 1;
        var lean = Math.abs(th);
        var col = lean < 0.3 ? C.green : lean < 0.6 ? C.yellow : C.red;
        line(px, py, bx, by, '#e2e8f0', 5);
        rect(x - 38, cy() - 10, 76, 22, '#38bdf8', 1);
        circle(x - 24, cy() + 16, 7, '#0ea5e9');
        circle(x + 24, cy() + 16, 7, '#0ea5e9');
        glowDot(bx, by, 14, col, 18);
        rect(W() / 2 - 70, cy() + 60, 140, 6, '#334155', 1);
        circle(W() / 2 + clamp(th / 0.95, -1, 1) * 70, cy() + 63, 8, col);
        if (Math.abs(wind) > 80) text(wind > 0 ? '>>>' : '<<<', W() / 2, 120, 26, '#fca5a5', 'center', 900);
      },
      pointer: function (px) {
        target = clamp(px, 40, W() - 40);
        targetT = 1.2;
      },
      stop: function () {}
    };
  }

  /* ---------- 3. Seesaw Rollers: balls on a tilting plank ---------- */
  var BALL_COLS = ['#f472b6', '#38bdf8', '#a3e635', '#fbbf24', '#c4b5fd'];
  function gameSeesawRollers(g) {
    var PX = W() / 2, PY = H() * 0.5, HALF = 150, G = 260;
    var phi = 0, om = 0, balls = [], spawnT = 1.2, saved = 0, lost = 0, over = false, pops = [];
    return {
      update: function (dt) {
        if (over) return;
        dt = Math.min(dt, 1 / 30);
        var tq = AX() * 1.8, i, b;
        for (i = 0; i < balls.length; i++) if (balls[i].on) tq += balls[i].s * 0.0045;
        om += (tq - 2.4 * phi - 1.1 * om) * dt;
        phi += om * dt;
        if (Math.abs(phi) > 0.55) { phi = clamp(phi, -0.55, 0.55); om = 0; }
        var cs = Math.cos(phi), sn = Math.sin(phi);
        spawnT -= dt;
        if (spawnT <= 0) {
          spawnT = Math.max(1.1, 2.8 - saved * 0.06);
          balls.push({ x: PX + rand(-110, 110), y: 130, vx: rand(-12, 12), vy: 0, on: false, s: 0, vs: 0, t: 0, c: pick(BALL_COLS), dead: false });
        }
        for (i = 0; i < balls.length; i++) {
          b = balls[i];
          if (b.dead) continue;
          if (!b.on) {
            b.vy += 900 * dt;
            b.x += b.vx * dt;
            b.y += b.vy * dt;
            if (Math.abs(b.x - PX) < HALF * cs && b.y + 9 >= PY + (b.x - PX) * Math.tan(phi)) {
              b.on = true;
              b.s = (b.x - PX) / cs;
              b.vs = b.vx * cs + b.vy * sn;
              b.t = 0;
              beep(380, 460, 0.05, 'triangle', 0.04);
            } else if (b.y > H() - 140) {
              b.dead = true;
              lost++;
              pop(pops, clamp(b.x, 30, W() - 30), H() - 160, 'LOST', C.red, 16);
              beep(200, 90, 0.2, 'sawtooth', 0.06);
            }
          } else {
            b.vs += G * sn * dt;
            b.vs *= Math.exp(-0.25 * dt);
            b.s += b.vs * dt;
            b.t += dt;
            if (Math.abs(b.s) > HALF) {
              b.on = false;
              b.x = PX + b.s * cs + 9 * sn;
              b.y = PY + b.s * sn - 9 * cs;
              b.vx = b.vs * cs;
              b.vy = b.vs * sn;
            } else if (b.t >= 5) {
              b.dead = true;
              saved++;
              pop(pops, PX + b.s * cs, PY + b.s * sn - 24, '+1', C.lime, 18);
              beep(660, 990, 0.1, 'sine', 0.05);
            }
          }
        }
        for (i = balls.length - 1; i >= 0; i--) if (balls[i].dead) balls.splice(i, 1);
        popStep(pops, dt);
        if (lost >= 3) { over = true; miniFail(g, 'Three balls rolled off the plank'); return; }
        if (saved >= g.goal) { over = true; completeMini(); return; }
        hud('Saved ' + saved + ' / ' + g.goal + '   Lost ' + lost + ' / 3');
      },
      draw: function () {
        sky('#0c1a2b', '#17324a');
        var cs = Math.cos(phi), sn = Math.sin(phi);
        var ox = sn * 7, oy = -cs * 7;
        polygon([[PX, PY + 2], [PX - 28, PY + 90], [PX + 28, PY + 90]], '#57534e');
        line(PX - HALF * cs, PY - HALF * sn, PX + HALF * cs, PY + HALF * sn, '#92400e', 18);
        line(PX - HALF * cs + ox, PY - HALF * sn + oy, PX + HALF * cs + ox, PY + HALF * sn + oy, '#fbbf24', 3);
        for (var i = 0; i < balls.length; i++) {
          var b = balls[i];
          if (b.dead) continue;
          var bx = b.x, by = b.y;
          if (b.on) { bx = PX + b.s * cs + 9 * sn; by = PY + b.s * sn - 9 * cs; }
          glowDot(bx, by, 9, b.c, 14);
          circle(bx - 3, by - 3, 3, 'rgba(255,255,255,0.7)');
        }
        popDraw(pops);
      },
      stop: function () {}
    };
  }

  /* ---------- 4. Tilt Marble: tilt a board, roll through walls and holes ---------- */
  var TILT_LAYOUTS = [
    { walls: [[0.3, 0.25, 0.4, 0.035], [0.1, 0.5, 0.035, 0.25], [0.6, 0.6, 0.035, 0.25], [0.45, 0.8, 0.4, 0.035]], holes: [[0.5, 0.45, 20], [0.2, 0.2, 18]], start: [0.08, 0.1] },
    { walls: [[0.15, 0.2, 0.035, 0.4], [0.55, 0.15, 0.035, 0.4], [0.3, 0.7, 0.4, 0.035], [0.8, 0.45, 0.035, 0.3]], holes: [[0.35, 0.4, 20], [0.7, 0.8, 22], [0.5, 0.6, 18]], start: [0.08, 0.9] },
    { walls: [[0.2, 0.15, 0.6, 0.035], [0.2, 0.15, 0.035, 0.25], [0.765, 0.15, 0.035, 0.25], [0.2, 0.85, 0.6, 0.035], [0.45, 0.4, 0.1, 0.035], [0.3, 0.6, 0.035, 0.2]], holes: [[0.5, 0.25, 20], [0.5, 0.7, 20], [0.85, 0.5, 22], [0.15, 0.5, 22]], start: [0.5, 0.55] }
  ];
  function gameMarbleTilt(g) {
    var BX = 24, BY = 92, BW = W() - 48, BHt = H() - 226, R = 11;
    var lv = 0, walls = [], holes = [], gems = [], start = null, b = null;
    var collected = 0, over = false, t = 0, parts = [], pops = [];
    function gemSpotOk(x, y) {
      var i;
      for (i = 0; i < walls.length; i++) {
        var w = walls[i];
        if (x > w.x - 24 && x < w.x + w.w + 24 && y > w.y - 24 && y < w.y + w.h + 24) return false;
      }
      for (i = 0; i < holes.length; i++) if (dist(x, y, holes[i].x, holes[i].y) < holes[i].r + 26) return false;
      if (dist(x, y, start.x, start.y) < 90) return false;
      for (i = 0; i < gems.length; i++) if (dist(x, y, gems[i].x, gems[i].y) < 60) return false;
      return true;
    }
    function loadLevel() {
      var L = TILT_LAYOUTS[lv % 3], i;
      walls = [];
      holes = [];
      for (i = 0; i < L.walls.length; i++) {
        var w = L.walls[i];
        walls.push({ x: BX + w[0] * BW, y: BY + w[1] * BHt, w: w[2] * BW, h: w[3] * BHt });
      }
      for (i = 0; i < L.holes.length; i++) {
        var h = L.holes[i];
        holes.push({ x: BX + h[0] * BW, y: BY + h[1] * BHt, r: h[2] });
      }
      start = { x: BX + L.start[0] * BW, y: BY + L.start[1] * BHt };
      b = { x: start.x, y: start.y, vx: 0, vy: 0 };
      gems = [];
      var tries = 0;
      while (gems.length < 3 && tries++ < 400) {
        var gx = rand(BX + 30, BX + BW - 30), gy = rand(BY + 30, BY + BHt - 30);
        if (gemSpotOk(gx, gy)) gems.push({ x: gx, y: gy, ph: rand(0, TAU) });
      }
    }
    function bounceWall(w) {
      var cx = clamp(b.x, w.x, w.x + w.w), cy = clamp(b.y, w.y, w.y + w.h);
      var dx = b.x - cx, dy = b.y - cy, d2 = dx * dx + dy * dy;
      if (d2 >= R * R) return;
      var nx, ny;
      if (d2 < 1e-6) {
        var l = b.x - w.x, r = w.x + w.w - b.x, tp = b.y - w.y, bt = w.y + w.h - b.y;
        var m = Math.min(l, r, tp, bt);
        if (m === l) { nx = -1; ny = 0; b.x = w.x - R; }
        else if (m === r) { nx = 1; ny = 0; b.x = w.x + w.w + R; }
        else if (m === tp) { nx = 0; ny = -1; b.y = w.y - R; }
        else { nx = 0; ny = 1; b.y = w.y + w.h + R; }
      } else {
        var d = Math.sqrt(d2);
        nx = dx / d;
        ny = dy / d;
        var push = R - d;
        b.x += nx * push;
        b.y += ny * push;
      }
      var vn = b.vx * nx + b.vy * ny;
      if (vn < 0) {
        b.vx -= 1.35 * vn * nx;
        b.vy -= 1.35 * vn * ny;
      }
    }
    loadLevel();
    return {
      update: function (dt) {
        if (over) return;
        dt = Math.min(dt, 1 / 30);
        t += dt;
        var ax = AX() * 1000, ay = AY() * 1000;
        var h = dt / 4, s, i;
        for (s = 0; s < 4; s++) {
          b.vx = (b.vx + ax * h) * Math.exp(-0.35 * h);
          b.vy = (b.vy + ay * h) * Math.exp(-0.35 * h);
          b.x += b.vx * h;
          b.y += b.vy * h;
          if (b.x < BX + R) { b.x = BX + R; b.vx = Math.abs(b.vx) * 0.4; }
          if (b.x > BX + BW - R) { b.x = BX + BW - R; b.vx = -Math.abs(b.vx) * 0.4; }
          if (b.y < BY + R) { b.y = BY + R; b.vy = Math.abs(b.vy) * 0.4; }
          if (b.y > BY + BHt - R) { b.y = BY + BHt - R; b.vy = -Math.abs(b.vy) * 0.4; }
          for (i = 0; i < walls.length; i++) bounceWall(walls[i]);
        }
        var sp = Math.hypot(b.vx, b.vy);
        for (i = 0; i < holes.length; i++) {
          var hh = holes[i];
          var dd = dist(b.x, b.y, hh.x, hh.y);
          if (dd < hh.r * 0.8 || (dd < hh.r && sp < 240)) {
            over = true;
            beep(420, 60, 0.4, 'sine', 0.08);
            miniFail(g, 'The marble dropped into a hole');
            return;
          }
        }
        for (i = gems.length - 1; i >= 0; i--) {
          var gm = gems[i];
          if (dist(b.x, b.y, gm.x, gm.y) < 20) {
            gems.splice(i, 1);
            collected++;
            fxBurst(parts, gm.x, gm.y, C.gold, 14, 160);
            pop(pops, gm.x, gm.y - 12, '+1', C.gold, 18);
            beep(700, 1100, 0.08, 'sine', 0.06);
          }
        }
        if (collected >= g.goal) { over = true; completeMini(); return; }
        if (gems.length === 0) { lv++; loadLevel(); }
        fxUpdate(parts, dt, 0);
        popStep(pops, dt);
        hud('Gems ' + collected + ' / ' + g.goal);
      },
      draw: function () {
        sky('#07130f', '#0f2a22');
        rect(BX - 8, BY - 8, BW + 16, BHt + 16, '#1e293b', 1);
        rect(BX, BY, BW, BHt, '#0b1a2a');
        var gx, gy;
        for (gx = BX + 40; gx < BX + BW; gx += 40) line(gx, BY, gx, BY + BHt, 'rgba(148,163,184,0.07)', 1);
        for (gy = BY + 40; gy < BY + BHt; gy += 40) line(BX, gy, BX + BW, gy, 'rgba(148,163,184,0.07)', 1);
        var i;
        for (i = 0; i < holes.length; i++) {
          var hh = holes[i];
          ctx2d.save();
          ctx2d.shadowColor = '#f97316';
          ctx2d.shadowBlur = 12;
          circle(hh.x, hh.y, hh.r, '#020617');
          ctx2d.restore();
          strokeCircle(hh.x, hh.y, hh.r, '#f97316', 2);
        }
        for (i = 0; i < walls.length; i++) {
          var w = walls[i];
          rect(w.x, w.y, w.w, w.h, '#475569', 1);
          rect(w.x, w.y, w.w, 3, '#94a3b8');
        }
        for (i = 0; i < gems.length; i++) {
          var gm = gems[i];
          var pulse = 0.5 + 0.5 * Math.sin(t * 4 + gm.ph);
          ctx2d.save();
          ctx2d.shadowColor = C.gold;
          ctx2d.shadowBlur = 10 + 8 * pulse;
          polygon([[gm.x, gm.y - 8], [gm.x + 7, gm.y], [gm.x, gm.y + 8], [gm.x - 7, gm.y]], C.gold);
          ctx2d.restore();
        }
        glowDot(b.x, b.y, R, '#e2e8f0', 12);
        circle(b.x - 3, b.y - 3, 3.5, '#ffffff');
        fxDraw(parts);
        popDraw(pops);
      },
      stop: function () {}
    };
  }

  /* ---------- 5. Cargo Wagon: keep the load's centre of mass over the wagon ---------- */
  var CRATE_COLS = ['#f59e0b', '#fb7185', '#60a5fa', '#34d399', '#c084fc'];
  function gameCargoWagon(g) {
    var GY = H() - 150, HALF = 110;
    var cranePos = W() / 2, crates = [], falling = null, hang = null, cool = 0;
    var tilt = 0, tiltV = 0, lost = 0, delivered = 0, cam = 0, over = false, pops = [];
    function newHang() { hang = { w: randi(36, 64), h: randi(26, 40), c: pick(CRATE_COLS) }; }
    newHang();
    function sY(wy) { return GY + cam - wy; }
    function topWorld() {
      var top = 0;
      for (var i = 0; i < crates.length; i++) top = Math.max(top, crates[i].wy + crates[i].h);
      return top;
    }
    function support(fl, fr) {
      var sup = null, i;
      if (fr > -HALF && fl < HALF) sup = 0;
      for (i = 0; i < crates.length; i++) {
        var c = crates[i];
        if (fr > c.dx - c.w / 2 && fl < c.dx + c.w / 2) {
          var top = c.wy + c.h;
          if (sup === null || top > sup) sup = top;
        }
      }
      return sup;
    }
    function centreOfMass() {
      var m = 3, mx = 0;
      for (var i = 0; i < crates.length; i++) {
        var c = crates[i], mm = c.w * c.h / 900;
        m += mm;
        mx += mm * c.dx;
      }
      return mx / m;
    }
    function dropCrate() {
      if (over || falling || cool > 0 || !hang) return;
      falling = { dx: cranePos - W() / 2, w: hang.w, h: hang.h, c: hang.c, wy: GY + cam - 130 - hang.h, vy: 0 };
      newHang();
      cool = 0.4;
    }
    return {
      update: function (dt) {
        if (over) return;
        dt = Math.min(dt, 1 / 30);
        cool -= dt;
        cranePos = clamp(cranePos + AX() * 260 * dt, 40, W() - 40);
        if (pressed('a')) dropCrate();
        if (falling) {
          falling.vy += 900 * dt;
          falling.wy -= falling.vy * dt;
          var sup = support(falling.dx - falling.w / 2, falling.dx + falling.w / 2);
          if (sup !== null && falling.wy <= sup) {
            falling.wy = sup;
            crates.push(falling);
            pop(pops, W() / 2 + falling.dx, sY(sup + falling.h) - 16, '+1', C.gold, 18);
            beep(300 + delivered * 20, 420 + delivered * 20, 0.08, 'square', 0.05);
            falling = null;
            delivered++;
            if (delivered >= g.goal) { over = true; completeMini(); return; }
          } else if (sY(falling.wy) > H() + 40) {
            falling = null;
            lost++;
            beep(180, 70, 0.25, 'sawtooth', 0.06);
            if (lost >= 3) { over = true; miniFail(g, 'Three crates were lost'); return; }
          }
        }
        var com = centreOfMass();
        if (Math.abs(com) > HALF) { over = true; miniFail(g, 'The load slid off the edge'); return; }
        var target = clamp(com / HALF, -1, 1) * 0.5;
        tiltV += (22 * (target - tilt) - 5 * tiltV) * dt;
        tilt += tiltV * dt;
        if (Math.abs(tilt) > 0.6) { over = true; miniFail(g, 'The wagon tipped over'); return; }
        var goalCam = Math.max(0, topWorld() - (GY - 280));
        cam += (goalCam - cam) * Math.min(1, dt * 3);
        popStep(pops, dt);
        hud('Delivered ' + delivered + ' / ' + g.goal + '   Lost ' + lost + ' / 3');
      },
      draw: function () {
        sky('#101827', '#1f2a44');
        var pvx = W() / 2, pvy = sY(0);
        rect(0, pvy + 30, W(), Math.max(0, H() - pvy - 30), '#27272a');
        rect(0, 84, W(), 6, '#475569');
        rect(cranePos - 18, 78, 36, 12, '#94a3b8', 1);
        line(cranePos, 90, cranePos, 118, '#cbd5e1', 2);
        if (hang && !falling && !over) rect(cranePos - hang.w / 2, 118, hang.w, hang.h, hang.c, 1);
        if (falling) rect(W() / 2 + falling.dx - falling.w / 2, sY(falling.wy + falling.h), falling.w, falling.h, falling.c, 1);
        ctx2d.save();
        ctx2d.translate(pvx, pvy);
        ctx2d.rotate(tilt);
        rect(-HALF - 8, 0, 2 * HALF + 16, 22, '#7c2d12', 1);
        rect(-HALF - 8, 0, 2 * HALF + 16, 4, '#fb923c');
        circle(-HALF + 26, 26, 12, '#1c1917');
        circle(HALF - 26, 26, 12, '#1c1917');
        for (var i = 0; i < crates.length; i++) {
          var c = crates[i];
          rect(c.dx - c.w / 2, -(c.wy + c.h), c.w, c.h, c.c, 1);
          rect(c.dx - c.w / 2, -(c.wy + c.h), c.w, 4, 'rgba(255,255,255,0.35)');
        }
        ctx2d.restore();
        var cm = centreOfMass();
        glowDot(pvx + cm, pvy + 46, 5, C.pink, 10);
        popDraw(pops);
      },
      pointer: function (px) {
        cranePos = clamp(px, 40, W() - 40);
        dropCrate();
      },
      stop: function () {}
    };
  }

  /* ---------- 6. Ring Shove: pucks knock coins off a round platter ---------- */
  var COIN_COLS = ['#fde047', '#facc15', '#e2e8f0'];
  function gameRingShove(g) {
    var CX = W() / 2, CY = H() / 2 - 20, R = 160;
    var SPX = CX, SPY = CY + R - 50;
    var bodies = [], ready = null, pucks = 4, knocked = 0, over = false, t = 0, pops = [], parts = [];
    var RINGS = [[40, 6], [84, 10], [126, 12]];
    var i, k;
    for (i = 0; i < RINGS.length; i++) {
      for (k = 0; k < RINGS[i][1]; k++) {
        var a = k * TAU / RINGS[i][1] + i * 0.3;
        bodies.push({ x: CX + Math.cos(a) * RINGS[i][0], y: CY + Math.sin(a) * RINGS[i][0], vx: 0, vy: 0, r: 13, m: 1, puck: false, c: pick(COIN_COLS) });
      }
    }
    function moving() {
      for (var j = 0; j < bodies.length; j++) if (Math.hypot(bodies[j].vx, bodies[j].vy) > 6) return true;
      return false;
    }
    function spawnPuck() {
      ready = { x: SPX, y: SPY, vx: 0, vy: 0, r: 22, m: 3, puck: true, c: '#f472b6' };
      bodies.push(ready);
      pucks--;
    }
    function collide(p, q) {
      var dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy), minD = p.r + q.r;
      if (d >= minD) return;
      var nx = 0, ny = -1;
      if (d > 0.0001) { nx = dx / d; ny = dy / d; }
      var tot = p.m + q.m, ov = minD - d;
      p.x -= nx * ov * (q.m / tot); p.y -= ny * ov * (q.m / tot);
      q.x += nx * ov * (p.m / tot); q.y += ny * ov * (p.m / tot);
      var rv = (q.vx - p.vx) * nx + (q.vy - p.vy) * ny;
      if (rv < 0) {
        var imp = -1.8 * rv / (1 / p.m + 1 / q.m);
        p.vx -= imp / p.m * nx; p.vy -= imp / p.m * ny;
        q.vx += imp / q.m * nx; q.vy += imp / q.m * ny;
      }
    }
    return {
      update: function (dt) {
        if (over) return;
        dt = Math.min(dt, 1 / 30);
        t += dt;
        var h = dt / 3, s, j, b, p;
        for (s = 0; s < 3; s++) {
          var f = Math.exp(-1.1 * h);
          for (j = 0; j < bodies.length; j++) {
            b = bodies[j];
            b.x += b.vx * h;
            b.y += b.vy * h;
            b.vx *= f;
            b.vy *= f;
          }
          for (j = 0; j < bodies.length; j++)
            for (p = j + 1; p < bodies.length; p++) collide(bodies[j], bodies[p]);
        }
        for (j = bodies.length - 1; j >= 0; j--) {
          b = bodies[j];
          if (Math.hypot(b.x - CX, b.y - CY) > R + 4) {
            if (!b.puck) {
              knocked++;
              pop(pops, b.x, b.y - 10, '+1', C.gold, 18);
              fxBurst(parts, b.x, b.y, C.gold, 10, 180);
              beep(620, 900, 0.07, 'square', 0.05);
            } else {
              beep(200, 90, 0.2, 'sawtooth', 0.05);
            }
            if (b === ready) ready = null;
            bodies.splice(j, 1);
          }
        }
        fxUpdate(parts, dt, 200);
        popStep(pops, dt);
        if (knocked >= g.goal) { over = true; completeMini(); return; }
        if (!ready && !moving()) {
          if (pucks > 0) spawnPuck();
          else { over = true; miniFail(g, 'Out of pucks'); return; }
        }
        hud('Knocked ' + knocked + ' / ' + g.goal + '   Pucks ' + (pucks + (ready ? 1 : 0)));
      },
      draw: function () {
        sky('#0b1020', '#1b1640');
        circle(CX, CY, R + 12, '#312e81');
        circle(CX, CY, R, '#44403c');
        circle(CX, CY, R - 18, '#57534e');
        strokeCircle(CX, CY, R + 4, '#f87171', 3);
        for (var q = 0; q < 8; q++) {
          var a = t * 0.3 + q * TAU / 8;
          line(CX + Math.cos(a) * 24, CY + Math.sin(a) * 24, CX + Math.cos(a) * (R - 22), CY + Math.sin(a) * (R - 22), 'rgba(255,255,255,0.08)', 2);
        }
        if (ready) strokeCircle(SPX, SPY, 28, 'rgba(244,114,182,0.6)', 2);
        for (var j = 0; j < bodies.length; j++) {
          var b = bodies[j];
          if (b.puck) {
            glowDot(b.x, b.y, b.r, b.c, 14);
            strokeCircle(b.x, b.y, b.r - 6, 'rgba(255,255,255,0.4)', 2);
          } else {
            circle(b.x, b.y, b.r, '#a16207');
            circle(b.x, b.y, b.r - 2, b.c);
            circle(b.x - 3, b.y - 3, 3, 'rgba(255,255,255,0.7)');
          }
        }
        fxDraw(parts);
        popDraw(pops);
      },
      swipe: function (dx, dy) {
        if (over || !ready || moving()) return;
        var L = Math.hypot(dx, dy);
        if (L < 6) return;
        var sp = clamp(L * 6, 260, 1000);
        ready.vx = dx / L * sp;
        ready.vy = dy / L * sp;
        ready = null;
        beep(260, 520, 0.12, 'triangle', 0.08);
      },
      stop: function () {}
    };
  }

  /* ---------- 7. Domino Relay: place a chain, tip the first one ---------- */
  function gameDominoRelay(g) {
    var GY = H() - 150, DH = 74, DW = 12;
    var doms = [], state = 'build', over = false, t = 0, parts = [];
    function place(px) {
      var x = clamp(px, 20, W() - 20), i, best = -1, bd = 1e9;
      for (i = 0; i < doms.length; i++) {
        var dd = Math.abs(doms[i].x - x);
        if (dd < bd) { bd = dd; best = i; }
      }
      if (best >= 0 && bd < 14) { doms.splice(best, 1); return; }
      if (doms.length >= 30 || (best >= 0 && bd < 18)) return;
      doms.push({ x: x, a: 0, w: 0, on: false, down: false });
      doms.sort(function (p, q) { return p.x - q.x; });
    }
    function kick() {
      if (state !== 'build' || doms.length < g.goal) return;
      state = 'run';
      doms[0].on = true;
      doms[0].w = 1.4;
      beep(180, 420, 0.25, 'triangle', 0.08);
    }
    return {
      update: function (dt) {
        if (over) return;
        dt = Math.min(dt, 1 / 30);
        t += dt;
        if (pressed('a')) kick();
        if (state === 'build') {
          hud('Placed ' + doms.length + ' / ' + g.goal);
          return;
        }
        var moving = false, down = 0, i, d, nx;
        for (i = 0; i < doms.length; i++) {
          d = doms[i];
          if (d.on && !d.down) {
            moving = true;
            d.w += (8 * Math.sin(Math.max(0, d.a)) + 1.8) * dt;
            d.a += d.w * dt;
            if (d.a >= Math.PI / 2) {
              d.a = Math.PI / 2;
              d.w = 0;
              d.down = true;
              fxBurst(parts, d.x, GY - 4, C.yellow, 6, 110);
              beep(400 + i * 14, 300 + i * 14, 0.04, 'triangle', 0.04);
            }
          }
          if (d.down) down++;
          if (d.on && i + 1 < doms.length) {
            nx = doms[i + 1];
            if (!nx.on && d.x + DH * Math.sin(d.a) >= nx.x) {
              nx.on = true;
              nx.w = 1.6 + Math.max(0, d.w) * 0.5;
            }
          }
        }
        fxUpdate(parts, dt, 200);
        if (down >= g.goal) { over = true; completeMini(); return; }
        if (!moving) { over = true; miniFail(g, 'The chain broke'); return; }
        hud('Down ' + down + ' / ' + g.goal);
      },
      draw: function () {
        sky('#1a1033', '#3b1d4a');
        rect(0, GY, W(), H() - GY, '#2a2233');
        rect(0, GY, W(), 3, '#a78bfa');
        var i;
        if (state === 'build') {
          for (i = 0; i < doms.length; i++) circle(doms[i].x, GY + 8, 3, '#c4b5fd');
        }
        for (i = 0; i < doms.length; i++) {
          var d = doms[i];
          ctx2d.save();
          ctx2d.translate(d.x, GY);
          ctx2d.rotate(d.a);
          ctx2d.shadowColor = d.on && !d.down ? '#fde047' : 'rgba(0,0,0,0)';
          ctx2d.shadowBlur = 10;
          var col = d.down ? '#64748b' : d.on ? '#fde68a' : '#f5f5f4';
          rect(-DW / 2, -DH, DW, DH, col, 1);
          rect(-DW / 2, -DH, 3, DH, 'rgba(255,255,255,0.5)');
          ctx2d.restore();
        }
        fxDraw(parts);
      },
      pointer: function (px) { place(px); },
      stop: function () {}
    };
  }

  /* ---------- 8. Wobble Top: keep a spinning top upright ---------- */
  function gameWobbleTop(g) {
    var tx = 0, ty = 0, vx = 0, vy = 0, S = 0, stable = 0, t = 0, over = false;
    var gT = 2.5, gA = 0, gL = 0, gM = 0, ang = 0, parts = [];
    var TOP_COLS = ['#f87171', '#fde68a', '#f87171', '#fde68a', '#f87171', '#fde68a'];
    return {
      update: function (dt) {
        if (over) return;
        dt = Math.min(dt, 1 / 30);
        t += dt;
        gT -= dt;
        if (gT <= 0) { gA = rand(0, TAU); gM = rand(1.6, 2.6); gL = 0.35; gT = rand(2.5, 4); }
        gL -= dt;
        var k = 3 + 0.9 * S, c = 0.9 + 0.12 * S;
        var ex = AX() * 3.2 + (gL > 0 ? Math.cos(gA) * gM : 0);
        var ey = AY() * 3.2 + (gL > 0 ? Math.sin(gA) * gM : 0);
        var h = dt / 3;
        for (var s = 0; s < 3; s++) {
          vx += (-k * tx - c * vx + ex) * h;
          tx += vx * h;
          vy += (-k * ty - c * vy + ey) * h;
          ty += vy * h;
        }
        ang += (4 + S * 3) * dt;
        S = Math.max(0, S - (0.22 + 0.03 * S) * dt);
        var tilt = Math.hypot(tx, ty);
        if (tilt > 1.0) { over = true; miniFail(g, 'The top toppled over'); return; }
        if (S < 0.15) { over = true; miniFail(g, 'The spin ran out'); return; }
        if (S > 1 && tilt < 0.5) stable += dt;
        fxUpdate(parts, dt, 0);
        if (stable >= g.goal) { over = true; completeMini(); return; }
        hud('Stable ' + Math.floor(stable) + ' / ' + g.goal);
      },
      draw: function () {
        sky('#0f0c1d', '#23183a');
        var cx = W() / 2, cy = H() / 2;
        ctx2d.save();
        ctx2d.translate(cx, cy + 40);
        ctx2d.scale(1, 0.42);
        circle(0, 0, 175, '#3b2a1e');
        circle(0, 0, 160, '#5c4030');
        ctx2d.restore();
        var hx = cx + tx * 130, hy = cy - 60 + ty * 100;
        line(cx, cy + 40, hx, hy, '#d6d3d1', 6);
        ctx2d.save();
        ctx2d.translate(hx, hy);
        ctx2d.scale(1, 0.55);
        for (var i = 0; i < 6; i++) {
          var a0 = ang + i * TAU / 6;
          ctx2d.beginPath();
          ctx2d.moveTo(0, 0);
          ctx2d.arc(0, 0, 52, a0, a0 + TAU / 6);
          ctx2d.closePath();
          ctx2d.fillStyle = TOP_COLS[i];
          ctx2d.fill();
        }
        ctx2d.restore();
        strokeCircle(hx, hy, 58 + S * 2, 'rgba(56,189,248,' + clamp(S / 8, 0.1, 0.6) + ')', 2);
        fxDraw(parts);
        rect(40, H() - 150, W() - 80, 10, '#334155', 1);
        rect(40, H() - 150, (W() - 80) * clamp(S / 8, 0, 1), 10, '#38bdf8', 1);
        var tl = Math.hypot(tx, ty);
        var col = tl < 0.5 ? C.green : tl < 0.8 ? C.yellow : C.red;
        rect(40, H() - 130, W() - 80, 8, '#334155', 1);
        rect(40, H() - 130, (W() - 80) * clamp(tl, 0, 1), 8, col, 1);
      },
      swipe: function () {
        if (!over) S = Math.min(8, S + 4);
        fxBurst(parts, W() / 2, H() / 2 - 60, C.cyan, 8, 140);
      },
      pointer: function () {
        if (!over) S = Math.min(8, S + 2);
      },
      stop: function () {}
    };
  }

  return {
    engines: {
      n03_skyline_stacker: gameSkylineStacker,
      n03_pole_tamer: gamePoleTamer,
      n03_seesaw_rollers: gameSeesawRollers,
      n03_marble_tilt: gameMarbleTilt,
      n03_cargo_wagon: gameCargoWagon,
      n03_ring_shove: gameRingShove,
      n03_domino_relay: gameDominoRelay,
      n03_wobble_top: gameWobbleTop
    },
    minis: [
      { id: 'n03_skyline_stacker', title: 'Skyline Stacker', icon: '🏗️', cat: 'PUZZLE', desc: 'Drop swinging blocks onto a growing tower. Overhangs are chopped off, a perfect drop keeps the full width, and a miss topples the run. The swing speeds up with every floor.', engine: 'n03_skyline_stacker', goal: 10 },
      { id: 'n03_pole_tamer', title: 'Pole Tamer', icon: '🎪', cat: 'SIMULATION', desc: 'Balance an upright pole on a sliding cart. Wind gusts push the pole around; steer the cart to keep it standing until the timer runs out.', engine: 'n03_pole_tamer', goal: 25 },
      { id: 'n03_seesaw_rollers', title: 'Seesaw Rollers', icon: '⚖️', cat: 'PUZZLE', desc: 'Balls roll along a seesaw that answers to your steering and to the weight of the balls. Keep each ball on the plank for five seconds. Three falls and the run is over.', engine: 'n03_seesaw_rollers', goal: 8 },
      { id: 'n03_marble_tilt', title: 'Tilt Marble', icon: '🔮', cat: 'PUZZLE', desc: 'Tilt the board to roll a marble between walls and around holes. Collect the three gems in each cluster; the next cluster has more holes. Dropping into a hole ends the run.', engine: 'n03_marble_tilt', goal: 9 },
      { id: 'n03_cargo_wagon', title: 'Cargo Wagon', icon: '🚚', cat: 'SIMULATION', desc: 'Drop crates onto a wagon. Every crate shifts the centre of mass, so the wagon leans. Keep the load centred: slipping off the edge, tipping over or losing three crates ends the run.', engine: 'n03_cargo_wagon', goal: 8 },
      { id: 'n03_ring_shove', title: 'Ring Shove', icon: '🪙', cat: 'ARCADE', desc: 'Launch pucks across a round platter. Heavy pucks knock coins off the rim and can chain hits; pucks that roll off are lost for good.', engine: 'n03_ring_shove', goal: 7 },
      { id: 'n03_domino_relay', title: 'Domino Relay', icon: '🁣', cat: 'PUZZLE', desc: 'Place dominoes one tap at a time, then tip the first one. A gap wider than a domino can reach breaks the chain. Get enough dominoes down in one unbroken run to win.', engine: 'n03_domino_relay', goal: 12 },
      { id: 'n03_wobble_top', title: 'Wobble Top', icon: '🌀', cat: 'SIMULATION', desc: 'Keep a spinning top upright on a table. Swipe to spin it up, steer the table to cancel gusts, and stay within the wobble limit while the spin lasts.', engine: 'n03_wobble_top', goal: 20 }
    ],
    aaa: []
  };
})();
