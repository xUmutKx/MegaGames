window.__AG_fix_10 = (function () {
  /* Reviewed engines: pool, plinko, parking (replace the thin originals under the same keys). */
  const BALL_R = 9, POCKET_R = 17, FRICTION = 1.3;
  const SOLID = [C.yellow, C.blue, C.red, C.purple, C.orange, C.green, "#8a2a2a"];
  const CAR_COL = [C.red, C.green, C.purple, C.orange, C.blue, C.lime, C.pink, C.yellow];
  const shuffle = (a) => {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  };

  /* ---------- POOL: 8-ball table, pockets, rail bounces, scratches, limited shots ---------- */
  function gamePool(g) {
    const SHOTS = 16;
    let balls = [], parts = [], sunk = 0, shots = SHOTS, done = false, ang = -Math.PI / 2, shake = 0, hitCd = 0;
    const geo = () => {
      const x0 = 26, x1 = W() - 26, y0 = 98, y1 = Math.min(H() - 150, y0 + (x1 - x0) * 1.9);
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      return { x0, x1, y0, y1, cx, cy, pockets: [[x0, y0], [x1, y0], [x0, y1], [x1, y1], [x0, cy], [x1, cy]] };
    };
    const mk = (n, x, y, c) => ({ n, x, y, c, vx: 0, vy: 0, out: false, cue: n === 0 });
    function rack() {
      const G = geo(), th = G.y1 - G.y0;
      const slots = [];
      for (let r = 0; r < 4; r++) for (let c = 0; c <= r; c++) slots.push([G.cx + (c - r / 2) * (BALL_R * 2 + 1), G.y0 + th * 0.3 + r * 17]);
      const picked = slots.slice(0, 6).concat(shuffle(slots.slice(6)).slice(0, 2));
      const order = shuffle([1, 2, 3, 4, 5, 6, 7]);
      order.splice(4, 0, 8);
      balls = [mk(0, G.cx, G.y0 + th * 0.72, C.white)];
      picked.forEach((p, i) => {
        const n = order[i];
        balls.push(mk(n, p[0], p[1], n === 8 ? "#111" : SOLID[n - 1]));
      });
    }
    rack();
    const spawn = () => { const G = geo(); return [G.cx, G.y0 + (G.y1 - G.y0) * 0.72]; };
    const moving = () => balls.some((b) => !b.out && (b.vx || b.vy));
    function sink(b) {
      b.out = true; b.vx = b.vy = 0;
      if (b.cue) toast("Scratch");
      else sunk++;
      fxBurst(parts, b.x, b.y, b.cue ? C.white : b.c, 16, 160);
      beep(520, 260, .18, "sine", .25);
    }
    function physics(dt) {
      const G = geo(), steps = 3, h = dt / steps;
      for (let s = 0; s < steps; s++) {
        for (const b of balls) {
          if (b.out) continue;
          b.x += b.vx * h; b.y += b.vy * h;
          const f = Math.exp(-FRICTION * h); b.vx *= f; b.vy *= f;
          if (Math.hypot(b.vx, b.vy) < 5) { b.vx = 0; b.vy = 0; }
        }
        for (let i = 0; i < balls.length; i++) {
          const a = balls[i]; if (a.out) continue;
          for (let j = i + 1; j < balls.length; j++) {
            const c = balls[j]; if (c.out) continue;
            const dx = c.x - a.x, dy = c.y - a.y, d = Math.hypot(dx, dy);
            if (d === 0 || d >= BALL_R * 2) continue;
            const nx = dx / d, ny = dy / d, ov = (BALL_R * 2 - d) / 2;
            a.x -= nx * ov; a.y -= ny * ov; c.x += nx * ov; c.y += ny * ov;
            const rel = (a.vx - c.vx) * nx + (a.vy - c.vy) * ny;
            if (rel > 0) {
              a.vx -= rel * nx; a.vy -= rel * ny; c.vx += rel * nx; c.vy += rel * ny;
              if (rel > 120 && hitCd <= 0) { beep(300 + rel, 180, .05, "triangle", .15); hitCd = .05; }
            }
          }
        }
        for (const b of balls) {
          if (b.out) continue;
          for (const [px, py] of G.pockets) if (Math.hypot(b.x - px, b.y - py) < POCKET_R) { sink(b); break; }
          if (b.out) continue;
          if (b.x < G.x0 + BALL_R) { b.x = G.x0 + BALL_R; b.vx = Math.abs(b.vx) * .8; }
          if (b.x > G.x1 - BALL_R) { b.x = G.x1 - BALL_R; b.vx = -Math.abs(b.vx) * .8; }
          if (b.y < G.y0 + BALL_R) { b.y = G.y0 + BALL_R; b.vy = Math.abs(b.vy) * .8; }
          if (b.y > G.y1 - BALL_R) { b.y = G.y1 - BALL_R; b.vy = -Math.abs(b.vy) * .8; }
        }
      }
    }
    function shoot(a, pw) {
      const sp = 170 + 560 * pw, cue = balls[0];
      cue.vx = Math.cos(a) * sp; cue.vy = Math.sin(a) * sp;
      shots--;
    }
    function aimHit(G) {
      const cue = balls[0], dx = Math.cos(ang), dy = Math.sin(ang);
      let best = Infinity, hitB = null;
      for (const b of balls) {
        if (b.out || b.cue) continue;
        const rx = b.x - cue.x, ry = b.y - cue.y, t = rx * dx + ry * dy;
        const perp = Math.abs(rx * dy - ry * dx);
        if (t > 0 && perp < BALL_R * 2) {
          const tt = t - Math.sqrt(4 * BALL_R * BALL_R - perp * perp);
          if (tt < best) { best = tt; hitB = b; }
        }
      }
      let tw = Infinity;
      if (dx < 0) tw = Math.min(tw, (G.x0 + BALL_R - cue.x) / dx);
      if (dx > 0) tw = Math.min(tw, (G.x1 - BALL_R - cue.x) / dx);
      if (dy < 0) tw = Math.min(tw, (G.y0 + BALL_R - cue.y) / dy);
      if (dy > 0) tw = Math.min(tw, (G.y1 - BALL_R - cue.y) / dy);
      if (tw < best) { best = tw; hitB = null; }
      return { t: Math.max(0, best), b: hitB };
    }
    function drawBall(b) {
      circle(b.x + 1.5, b.y + 2, BALL_R, "rgba(0,0,0,.35)");
      circle(b.x, b.y, BALL_R, b.c);
      if (!b.cue) { circle(b.x, b.y, BALL_R * 0.5, "#f4f4f4"); text(b.n, b.x, b.y + 3.5, 8, "#111", "center", 800); }
      circle(b.x - 3, b.y - 3, 2.5, "rgba(255,255,255,.7)");
    }
    return {
      update(dt) {
        if (done) return;
        hitCd = Math.max(0, hitCd - dt);
        shake = Math.max(0, shake - dt * 4);
        fxUpdate(parts, dt, 0);
        const idle = !moving();
        if (idle) {
          if (balls[0].out) { const [sx, sy] = spawn(); Object.assign(balls[0], { x: sx, y: sy, vx: 0, vy: 0, out: false }); }
          const jx = AX(), jy = AY();
          if (Math.hypot(jx, jy) > .25) ang = Math.atan2(jy, jx);
          if (pressed("a") && shots > 0) shoot(ang, .6);
        }
        physics(dt);
        if (sunk >= g.goal) { done = true; completeMini(); return; }
        if (shots <= 0 && !moving()) {
          done = true; toast("Out of shots");
          setTimeout(() => miniFail(g, "Out of shots"), 450);
          return;
        }
        hud("Sunk " + sunk + "/" + g.goal + " • Shots " + shots);
      },
      draw() {
        const G = geo(), tw = G.x1 - G.x0, th = G.y1 - G.y0;
        clear("#050b08");
        ctx2d.save();
        if (shake > .2) ctx2d.translate((Math.random() - .5) * shake * 6, (Math.random() - .5) * shake * 6);
        rect(G.x0 - 16, G.y0 - 16, tw + 32, th + 32, "#4a2c17", 14);
        rect(G.x0 - 9, G.y0 - 9, tw + 18, th + 18, "#7a4a25", 10);
        const grd = ctx2d.createRadialGradient(G.cx, G.cy, 20, G.cx, G.cy, th * 0.7);
        grd.addColorStop(0, "#1f8a4f"); grd.addColorStop(1, "#0a4a28");
        ctx2d.fillStyle = grd; ctx2d.fillRect(G.x0, G.y0, tw, th);
        for (const t of [.25, .5, .75]) {
          const y = G.y0 + th * t;
          circle(G.x0 - 12, y, 1.8, "#e8d7a8"); circle(G.x1 + 12, y, 1.8, "#e8d7a8");
        }
        for (const [px, py] of G.pockets) { circle(px, py, POCKET_R + 3, "#2a1a0e"); circle(px, py, POCKET_R, "#030303"); }
        const cue = balls[0];
        if (!cue.out && !moving()) {
          const aim = aimHit(G), dx = Math.cos(ang), dy = Math.sin(ang);
          const len = Math.min(aim.t, 900);
          ctx2d.setLineDash([5, 6]);
          line(cue.x, cue.y, cue.x + dx * len, cue.y + dy * len, "rgba(255,255,255,.4)", 1.5);
          ctx2d.setLineDash([]);
          if (aim.b) {
            const px = cue.x + dx * aim.t, py = cue.y + dy * aim.t;
            const tx = aim.b.x - px, ty = aim.b.y - py, tl = Math.hypot(tx, ty) || 1;
            line(aim.b.x, aim.b.y, aim.b.x + tx / tl * 60, aim.b.y + ty / tl * 60, "rgba(255,255,255,.3)", 1.5);
            strokeCircle(px, py, BALL_R, "rgba(255,255,255,.5)", 1.5);
          }
          ctx2d.save(); ctx2d.translate(cue.x, cue.y); ctx2d.rotate(ang);
          ctx2d.fillStyle = "#c9a06a"; ctx2d.fillRect(-200, -2.5, 184, 5);
          ctx2d.fillStyle = "#4a8fd6"; ctx2d.fillRect(-200, -2.5, 30, 5);
          ctx2d.fillStyle = "#f4f4f4"; ctx2d.fillRect(-18, -2.5, 3, 5);
          ctx2d.restore();
        }
        for (const b of balls) if (!b.out) drawBall(b);
        fxDraw(parts);
        ctx2d.restore();
      },
      swipe(dx, dy) {
        if (done || moving() || shots <= 0 || balls[0].out) return;
        const L = Math.hypot(dx, dy);
        if (L < 1) return;
        ang = Math.atan2(-dy, -dx);
        shoot(ang, clamp(L / 220, .15, 1));
      },
      stop() {}
    };
  }

  /* ---------- PLINKO: skill-aimed drops, edge slots pay the most, 12 balls ---------- */
  function gamePlinko(g) {
    const SV = [40, 15, 6, 2, 1, 2, 6, 15, 40];
    const NS = SV.length, BALLS = 12, PR = 4.5, BR = 6, GRAV = 760, E = .5, ROWS = 9;
    const geo = () => {
      const x0 = 24, x1 = W() - 24, top = 150, bot = H() - 165, sw = (x1 - x0) / NS, sp = (bot - top) / ROWS;
      const pegs = [];
      for (let r = 0; r < ROWS; r++) {
        const y = top + r * sp;
        if (r % 2 === 0) for (let i = 1; i < NS; i++) pegs.push({ x: x0 + sw * i, y });
        else for (let i = 0; i < NS; i++) pegs.push({ x: x0 + sw * (i + .5), y });
      }
      return { x0, x1, top, bot, sw, pegs };
    };
    let left = BALLS, score = 0, cx = W() / 2, ball = null, trail = [], flash = new Array(NS).fill(0), pops = [], parts = [], done = false, shake = 0;
    function land(b, G) {
      const i = clamp(Math.floor((b.x - G.x0) / G.sw), 0, NS - 1), v = SV[i], big = v >= 15;
      score += v; flash[i] = 1; ball = null; shake = big ? .6 : .15;
      fxBurst(parts, b.x, G.bot + 10, big ? C.gold : C.cyan, big ? 18 : 8, 180);
      pops.push({ x: G.x0 + G.sw * (i + .5), y: G.bot - 14, t: 0, txt: "+" + v });
      beep(big ? 880 : 420, big ? 1320 : 300, .12, "sine", .2);
    }
    function physics(b, G, h) {
      b.vy += GRAV * h; b.x += b.vx * h; b.y += b.vy * h;
      for (const p of G.pegs) {
        const dx = b.x - p.x, dy = b.y - p.y, d = Math.hypot(dx, dy), min = BR + PR;
        if (d > 0 && d < min) {
          const nx = dx / d, ny = dy / d;
          b.x = p.x + nx * min; b.y = p.y + ny * min;
          const vn = b.vx * nx + b.vy * ny;
          if (vn < 0) {
            b.vx -= (1 + E) * vn * nx; b.vy -= (1 + E) * vn * ny;
            b.vx = (Math.random() < .5 ? -1 : 1) * rand(100, 140); // every peg is a coin flip, so drops never stack on one line
            if (-vn > 220) fxBurst(parts, p.x, p.y, C.gold, 3, 70);
            if (-vn > 150) beep(900 + rand(0, 200), 700, .03, "triangle", .06);
          }
        }
      }
      if (b.x < G.x0 + BR) { b.x = G.x0 + BR; b.vx = Math.abs(b.vx) * .6; }
      if (b.x > G.x1 - BR) { b.x = G.x1 - BR; b.vx = -Math.abs(b.vx) * .6; }
      if (b.y >= G.bot) land(b, G);
    }
    return {
      update(dt) {
        if (done) return;
        const G = geo();
        cx = clamp(cx + AX() * 320 * dt, G.x0 + BR + 2, G.x1 - BR - 2);
        if (!ball && left > 0 && pressed("a")) { ball = { x: cx, y: G.top - 34, vx: 0, vy: 0 }; left--; trail = []; }
        if (ball) {
          trail.push({ x: ball.x, y: ball.y }); if (trail.length > 10) trail.shift();
          for (let s = 0; s < 4 && ball; s++) physics(ball, G, dt / 4);
        }
        flash = flash.map((v) => Math.max(0, v - dt * 2.5));
        pops.forEach((p) => p.t += dt); pops = pops.filter((p) => p.t < 1.2);
        shake = Math.max(0, shake - dt * 5);
        fxUpdate(parts, dt, 300);
        if (score >= g.goal) { done = true; completeMini(); return; }
        if (!ball && left <= 0) { done = true; toast("Score " + score); setTimeout(() => miniFail(g, "Out of balls"), 450); return; }
        hud("Balls " + left + " • Score " + score + "/" + g.goal);
      },
      draw() {
        const G = geo();
        clear("#0a0e16");
        ctx2d.save();
        if (shake > .05) ctx2d.translate((Math.random() - .5) * shake * 8, (Math.random() - .5) * shake * 8);
        rect(G.x0 - 8, G.top - 26, G.x1 - G.x0 + 16, G.bot - G.top + 60, "rgba(60,90,160,.08)", 14);
        for (const p of G.pegs) {
          circle(p.x, p.y, PR + 2, "rgba(120,170,255,.18)");
          circle(p.x, p.y, PR, "#8fb3ff");
          circle(p.x - 1, p.y - 1, 1.3, "#fff");
        }
        for (let i = 0; i < NS; i++) {
          const x = G.x0 + G.sw * i, v = SV[i];
          const base = v >= 15 ? C.gold : v >= 6 ? "#7fb0ff" : "#4a5a7a";
          rect(x + 2, G.bot + 4, G.sw - 4, 34, base, 6);
          if (flash[i] > 0) { ctx2d.globalAlpha = flash[i] * .6; rect(x + 2, G.bot + 4, G.sw - 4, 34, C.white, 6); ctx2d.globalAlpha = 1; }
          text(v, x + G.sw / 2, G.bot + 27, 12, "#111", "center", 800);
          line(x, G.bot, x, G.bot + 38, "rgba(255,255,255,.2)", 2);
        }
        trail.forEach((t, i) => circle(t.x, t.y, BR * (i / trail.length) * .9, "rgba(255,211,92," + (i / trail.length * .4) + ")"));
        if (ball) {
          circle(ball.x, ball.y, BR + 3, "rgba(255,211,92,.25)");
          circle(ball.x, ball.y, BR, C.gold);
          circle(ball.x - 2, ball.y - 2, 2, "#fff");
        } else if (left > 0) {
          circle(cx, G.top - 34, BR, C.gold);
          ctx2d.setLineDash([4, 6]);
          line(cx, G.top - 24, cx, G.bot, "rgba(255,255,255,.18)", 1.5);
          ctx2d.setLineDash([]);
        }
        for (const p of pops) {
          ctx2d.globalAlpha = Math.max(0, 1 - p.t / 1.2);
          text(p.txt, p.x, p.y - p.t * 30, 14, C.gold, "center", 800);
          ctx2d.globalAlpha = 1;
        }
        fxDraw(parts);
        ctx2d.restore();
      },
      stop() {}
    };
  }

  /* ---------- PARKING: real bays (nose-in or side-on), parked cars as walls, 45 s per bay ---------- */
  function gameParking(g) {
    const CW = 17, CL = 32, BW = 26, BL = 44, TIME = 45, WB = 70;
    const LOT = () => ({ x0: 16, x1: W() - 16, y0: 80, y1: H() - 125 });
    const rot = (x, y, a) => ({ x: x * Math.cos(a) - y * Math.sin(a), y: x * Math.sin(a) + y * Math.cos(a) });
    const corners = (o, hw, hl) => [[-hw, -hl], [hw, -hl], [hw, hl], [-hw, hl]].map(([x, y]) => {
      const r = rot(x, y, o.a); return { x: o.x + r.x, y: o.y + r.y };
    });
    function sat(A, B) {
      const pa = corners(A, CW, CL), pb = corners(B, CW, CL);
      for (const o of [A, B]) for (const ax of [o.a, o.a + Math.PI / 2]) {
        const nx = Math.cos(ax), ny = Math.sin(ax);
        let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity;
        for (const p of pa) { const d = p.x * nx + p.y * ny; a0 = Math.min(a0, d); a1 = Math.max(a1, d); }
        for (const p of pb) { const d = p.x * nx + p.y * ny; b0 = Math.min(b0, d); b1 = Math.max(b1, d); }
        if (a1 < b0 || b1 < a0) return false;
      }
      return true;
    }
    const blocked = (c) => {
      const L = LOT();
      if (corners(c, CW, CL).some((p) => p.x < L.x0 || p.x > L.x1 || p.y < L.y0 || p.y > L.y1)) return true;
      return cars.some((o) => sat(c, o));
    };
    const start = () => ({ x: W() / 2, y: H() - 175, a: 0, v: 0 });
    let car = start(), bay = null, cars = [], parks = 0, timer = TIME, parts = [], shake = 0, bump = 0, done = false;

    function build() {
      const L = LOT(), ba = Math.random() < .5 ? 0 : Math.PI / 2;
      bay = { x: rand(L.x0 + 90, L.x1 - 90), y: rand(L.y0 + 150, L.y1 - 260), a: ba };
      const ux = Math.cos(ba), uy = Math.sin(ba), off = BW + 4 + CW;
      cars = [
        { x: bay.x + ux * off, y: bay.y + uy * off, a: ba, color: pick(CAR_COL) },
        { x: bay.x - ux * off, y: bay.y - uy * off, a: ba, color: pick(CAR_COL) }
      ];
      const s = start();
      for (let tries = 0; cars.length < 7 && tries < 200; tries++) {
        const c = {
          x: rand(L.x0 + CL + 4, L.x1 - CL - 4), y: rand(L.y0 + CL + 4, L.y1 - CL - 4),
          a: pick([0, Math.PI / 2]), color: pick(CAR_COL)
        };
        if (dist(c.x, c.y, bay.x, bay.y) < 120 || dist(c.x, c.y, s.x, s.y) < 110) continue;
        if (cars.some((o) => sat(o, c))) continue;
        cars.push(c);
      }
      car = s; timer = TIME;
    }
    build();

    return {
      update(dt) {
        if (done) return;
        timer -= dt; shake = Math.max(0, shake - dt * 4); bump = Math.max(0, bump - dt);
        fxUpdate(parts, dt, 0);
        if (timer <= 0) { done = true; toast("Time! Parks " + parks); setTimeout(() => miniFail(g, "Time's up"), 450); return; }
        const thr = clamp(-AY(), -.6, 1);
        const target = thr >= 0 ? thr * 170 : thr * 90;
        const prev = { x: car.x, y: car.y, a: car.a };
        car.v += (target - car.v) * Math.min(1, dt * 2.6);
        car.a += (car.v / WB) * Math.tan(AX() * .6) * dt;
        car.x += Math.sin(car.a) * car.v * dt;
        car.y -= Math.cos(car.a) * car.v * dt;
        if (blocked(car)) {
          if (Math.abs(car.v) > 25) { shake = .5; bump = .15; beep(140, 70, .12, "sawtooth", .2); }
          car.x = prev.x; car.y = prev.y; car.a = prev.a; car.v *= -.2;
        }
        const dA = ((car.a - bay.a) % Math.PI + Math.PI) % Math.PI;
        const aligned = dA < .3 || dA > Math.PI - .3;
        const inside = corners(car, CW, CL).every((p) => {
          const q = rot(p.x - bay.x, p.y - bay.y, -bay.a);
          return Math.abs(q.x) <= BW && Math.abs(q.y) <= BL;
        });
        if (aligned && inside && Math.abs(car.v) < 20) {
          parks++;
          fxBurst(parts, bay.x, bay.y, C.green, 26, 220);
          beep(660, 990, .2, "sine", .25);
          if (parks >= g.goal) { done = true; completeMini(); return; }
          build();
        }
        hud("Parks " + parks + "/" + g.goal + " • " + Math.ceil(timer) + "s");
      },
      draw() {
        const L = LOT();
        clear("#0d1014");
        ctx2d.save();
        if (shake > .05) ctx2d.translate((Math.random() - .5) * shake * 10, (Math.random() - .5) * shake * 10);
        rect(L.x0, L.y0, L.x1 - L.x0, L.y1 - L.y0, "#15191f", 12);
        ctx2d.strokeStyle = "rgba(255,255,255,.15)"; ctx2d.lineWidth = 2;
        ctx2d.strokeRect(L.x0 + 4, L.y0 + 4, L.x1 - L.x0 - 8, L.y1 - L.y0 - 8);
        const pulse = .5 + .5 * Math.sin(performance.now() / 300);
        ctx2d.save(); ctx2d.translate(bay.x, bay.y); ctx2d.rotate(bay.a);
        ctx2d.fillStyle = "rgba(85,255,154," + (.08 + .08 * pulse) + ")"; ctx2d.fillRect(-BW, -BL, BW * 2, BL * 2);
        ctx2d.setLineDash([8, 6]); ctx2d.strokeStyle = "rgba(255,255,255,.7)"; ctx2d.lineWidth = 2.5;
        ctx2d.strokeRect(-BW, -BL, BW * 2, BL * 2); ctx2d.setLineDash([]);
        ctx2d.restore();
        line(car.x, car.y, bay.x, bay.y, "rgba(255,255,255,.08)", 1);
        for (const o of cars) drawCar(o, o.color, false);
        drawCar(car, C.gold, car.v < -2);
        fxDraw(parts);
        ctx2d.restore();
      },
      stop() {}
    };

    function drawCar(o, col, lights) {
      ctx2d.save(); ctx2d.translate(o.x, o.y); ctx2d.rotate(o.a);
      ctx2d.fillStyle = "rgba(0,0,0,.35)"; ctx2d.fillRect(-CW + 4, -CL + 5, CW * 2, CL * 2);
      rect(-CW, -CL, CW * 2, CL * 2, col, 8);
      ctx2d.fillStyle = "rgba(160,215,255,.85)"; ctx2d.fillRect(-CW + 4, -CL + 7, CW * 2 - 8, 11);
      ctx2d.fillStyle = "rgba(160,215,255,.6)"; ctx2d.fillRect(-CW + 4, CL - 16, CW * 2 - 8, 9);
      ctx2d.fillStyle = "#fff6c4"; ctx2d.fillRect(-CW + 2, -CL + 1, 6, 3); ctx2d.fillRect(CW - 8, -CL + 1, 6, 3);
      ctx2d.fillStyle = lights ? "#ff3b3b" : "#7a1a1a"; ctx2d.fillRect(-CW + 2, CL - 4, 6, 3); ctx2d.fillRect(CW - 8, CL - 4, 6, 3);
      ctx2d.restore();
    }
  }

  return {
    engines: { pool: gamePool, plinko: gamePlinko, parking: gameParking },
    minis: [
      { id: "pool", title: "8-Ball Pool", icon: "🎱", cat: "SPORTS", desc: "Real table: pockets, rail bounces and scratches. Sink 4 balls in 16 shots.", engine: "pool", goal: 4 },
      { id: "plinko", title: "Plinko", icon: "🎯", cat: "ARCADE", desc: "Aim the drop through the peg board. Edge slots pay the most; 12 balls.", engine: "plinko", goal: 150 },
      { id: "parking", title: "Parking Master", icon: "🅿️", cat: "ARCADE", desc: "Park nose-in or side-on between parked cars, 45 seconds per bay, no bumps.", engine: "parking", goal: 3 }
    ],
    aaa: []
  };
})();
