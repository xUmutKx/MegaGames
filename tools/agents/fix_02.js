window.__AG_fix_02 = (function () {
  /* Overrides for thin games in slice 02: bowling, colony, factory, drone, breakout. */

  // ---------- Strike Bowling: aim, throw, steer the curve, chain-reaction pins ----------
  function bowling(g) {
    const LW = 105, FOUL = H() - 150;
    const rack = () => {
      const a = [];
      for (let r = 0; r < 4; r++) for (let i = 0; i <= r; i++)
        a.push({ x: W() / 2 + (i - r / 2) * 26, y: 110 + r * 26, down: false, vx: 0, vy: 0 });
      return a;
    };
    let pins = rack(), ball, aim = 0, balls = 8, score = 0, phase = 'aim', settle = 0, done = false, bursts = [], flash = 0;
    const newBall = () => { ball = { x: W() / 2, y: H() - 165, vx: 0, vy: 0, r: 13 }; phase = 'aim'; };
    newBall();
    function knock(p, vx, vy) {
      if (p.down) return;
      p.down = true; p.vx = vx; p.vy = vy; score += 10;
      fxBurst(bursts, p.x, p.y, C.white, 6, 110);
      beep(700 + Math.random() * 200, 300, .05, 'triangle', .05);
    }
    function endRoll() {
      if (pins.every(p => p.down)) { score += 30; flash = 1; toast('Strike! +30'); pins = rack(); }
      balls--;
      if (balls <= 0) { done = true; if (score >= g.goal) completeMini(); else miniFail(g, 'Out of balls.'); return; }
      newBall();
    }
    return {
      update(dt) {
        if (done) return;
        flash = Math.max(0, flash - dt * 2);
        // Falling pins knock their neighbours (chain reaction) and slow down with friction.
        for (const p of pins) {
          if (p.down && Math.abs(p.vx) + Math.abs(p.vy) > 6) {
            p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .9; p.vy *= .9;
            for (const q of pins) if (!q.down && dist(p.x, p.y, q.x, q.y) < 15) knock(q, p.vx * .9 + rand(-30, 30), p.vy * .6 - 40);
          }
        }
        if (phase === 'aim') {
          aim = clamp(aim + AX() * 1.4 * dt, -1, 1);
          ball.x = W() / 2 + aim * LW * .75;
          if (pressed('a')) { phase = 'roll'; ball.vx = aim * 60; ball.vy = -640; beep(220, 160, .12, 'triangle', .08); }
        } else if (phase === 'roll') {
          ball.vx = clamp(ball.vx + AX() * 280 * dt, -190, 190); // joystick curves the ball
          ball.x += ball.vx * dt; ball.y += ball.vy * dt;
          if (Math.abs(ball.x - W() / 2) > LW - ball.r) {
            ball.x = W() / 2 + Math.sign(ball.x - W() / 2) * (LW - ball.r);
            ball.vx *= -.4;
          }
          for (const p of pins) if (!p.down && dist(ball.x, ball.y, p.x, p.y) < ball.r + 9)
            knock(p, (p.x - ball.x) * 3 + ball.vx * .5, -120 - Math.random() * 60);
          if (ball.y < 80) { phase = 'settle'; settle = 1.2; }
        } else {
          settle -= dt;
          if (settle <= 0) { endRoll(); if (done) return; }
        }
        if (score >= g.goal) { done = true; completeMini(); return; }
        fxUpdate(bursts, dt, 200);
        hud('Score ' + score + '/' + g.goal + ' • Balls ' + balls);
      },
      draw() {
        clear('#120c08');
        const gr = ctx2d.createLinearGradient(0, 70, 0, H() - 60);
        gr.addColorStop(0, '#e2b57a'); gr.addColorStop(1, '#a8733a');
        rect(W() / 2 - LW, 70, LW * 2, H() - 130, gr);
        for (let y = 80; y < H() - 60; y += 36) line(W() / 2 - LW, y, W() / 2 + LW, y, 'rgba(90,50,20,.25)', 2);
        rect(W() / 2 - LW - 14, 70, 14, H() - 130, '#2a2a30');
        rect(W() / 2 + LW, 70, 14, H() - 130, '#2a2a30');
        line(W() / 2 - LW, FOUL, W() / 2 + LW, FOUL, 'rgba(0,0,0,.45)', 3);
        if (phase === 'aim') {
          const tx = W() / 2 + aim * LW * .4;
          for (let i = 1; i <= 8; i++) {
            const t = i / 9;
            circle(ball.x + (tx - ball.x) * t, ball.y - (ball.y - 110) * t, 2.5, 'rgba(255,255,255,.5)');
          }
        }
        for (const p of pins) {
          if (p.down && Math.abs(p.vx) + Math.abs(p.vy) < 6) continue;
          circle(p.x + 2, p.y + 3, 9, 'rgba(0,0,0,.35)');
          circle(p.x, p.y, 8, p.down ? 'rgba(255,255,255,.6)' : '#fff');
          circle(p.x, p.y - 3, 3, C.red);
        }
        circle(ball.x + 3, ball.y + 5, ball.r, 'rgba(0,0,0,.4)');
        circle(ball.x, ball.y, ball.r, '#3d6bff');
        circle(ball.x - 4, ball.y - 4, 4, 'rgba(255,255,255,.45)');
        fxDraw(bursts);
        if (flash > 0) text('STRIKE!', W() / 2, H() / 2, 34, 'rgba(255,227,110,' + flash + ')', 'center', 900);
        text('JOYSTICK aim • A throw • steer the curve', W() / 2, H() - 92, 10, C.yellow, 'center');
      },
      stop() {}
    };
  }

  // ---------- Moon Colony: build on a grid, meteors hit unless a cannon covers them ----------
  function colony(g) {
    const CS = 44, COLS = Math.floor((W() - 20) / CS), ROWS = Math.floor((H() - 270) / CS), OX = (W() - COLS * CS) / 2, OY = 100;
    const grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    const BP = [
      { n: 'Mine', m: 12, e: 0 },
      { n: 'Solar', m: 10, e: 0 },
      { n: 'Habitat', m: 25, e: 8 },
      { n: 'Cannon', m: 30, e: 10 }
    ];
    let metal = 30, energy = 20, score = 0, bp = 0, cx = 0, cy = 0, meteors = [], mt = 4, parts = [], done = false;
    const cellXY = (c, r) => [OX + c * CS + CS / 2, OY + r * CS + CS / 2];
    const count = t => grid.reduce((n, row) => n + row.filter(v => v && v.t === t).length, 0);
    function near(x, y, t, rad) {
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const b = grid[r][c];
        if (b && b.t === t) { const [bx, by] = cellXY(c, r); if (dist(bx, by, x, y) < rad) return true; }
      }
      return false;
    }
    function hitBuildings(x, y, rad) {
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const b = grid[r][c];
        if (!b) continue;
        const [bx, by] = cellXY(c, r);
        if (dist(x, y, bx, by) < rad) { grid[r][c] = null; fxBurst(parts, bx, by, C.orange, 10, 120); }
      }
    }
    function build() {
      const B = BP[bp], c = Math.round(cx), r = Math.round(cy);
      if (grid[r][c]) { toast('Tile taken'); return; }
      if (metal < B.m || energy < B.e) { toast('Need ' + B.m + ' metal' + (B.e ? ' + ' + B.e + ' energy' : '')); return; }
      metal -= B.m; energy -= B.e; grid[r][c] = { t: bp }; score += 1;
      const [x, y] = cellXY(c, r);
      fxBurst(parts, x, y, C.cyan, 8, 90);
    }
    function demolish() {
      const c = Math.round(cx), r = Math.round(cy), b = grid[r][c];
      if (!b) { toast('Nothing to demolish'); return; }
      grid[r][c] = null; metal += Math.floor(BP[b.t].m / 2); energy += Math.floor(BP[b.t].e / 2);
    }
    return {
      update(dt) {
        if (done) return;
        cx = clamp(cx + AX() * 7 * dt, 0, COLS - 1); cy = clamp(cy + AY() * 7 * dt, 0, ROWS - 1);
        const mines = count(0), solar = count(1), hab = count(2), guns = count(3);
        metal += dt * (mines * 1.3 + .4);
        energy = Math.max(0, energy + dt * (solar * 1.1 + .3) - dt * hab * .5);
        if (energy > 0) score += dt * hab * .9; // habitats only house people while powered
        if (pressed('a')) build();
        if (pressed('b')) bp = (bp + 1) % BP.length;
        if (pressed('c')) demolish();
        mt -= dt;
        if (mt <= 0) {
          mt = rand(4, 7) - Math.min(2, score * .02);
          meteors.push({ x: rand(OX + 20, OX + COLS * CS - 20), y: rand(OY + 20, OY + ROWS * CS - 20), t: 3 });
          toast('Meteor incoming!');
        }
        for (const m of meteors) {
          m.t -= dt;
          if (m.t > 0) continue;
          m.dead = true;
          if (near(m.x, m.y, 3, 110)) {
            score += 15; metal += 6;
            fxBurst(parts, m.x, m.y, C.lime, 14, 160);
            beep(900, 300, .12, 'sawtooth', .06);
          } else {
            fxBurst(parts, m.x, m.y, C.orange, 18, 170);
            hitBuildings(m.x, m.y, 46);
          }
        }
        meteors = meteors.filter(m => !m.dead);
        fxUpdate(parts, dt);
        if (count(0) + count(1) + count(2) + count(3) === 0 && metal < 12) { done = true; miniFail(g, 'Colony wiped out.'); return; }
        if (Math.floor(score) >= g.goal) { done = true; completeMini(); return; }
        hud('Colony ' + Math.floor(score) + '/' + g.goal + ' • Metal ' + Math.floor(metal) + ' • Energy ' + Math.floor(energy) + ' • ' + BP[bp].n);
      },
      draw() {
        clear('#050812');
        for (let i = 0; i < 40; i++) circle((i * 97) % W(), 60 + (i * 53) % (H() - 150), i % 3 ? .8 : 1.5, 'rgba(255,255,255,.35)');
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
          const [x, y] = cellXY(c, r);
          rect(x - CS / 2 + 2, y - CS / 2 + 2, CS - 4, CS - 4, 'rgba(120,180,255,.06)', 6);
          const b = grid[r][c];
          if (!b) continue;
          if (b.t === 0) { rect(x - 14, y - 14, 28, 28, '#ff914d', 6); circle(x, y, 5, '#ffe36e'); }
          else if (b.t === 1) polygon([[x - 18, y], [x, y - 11], [x + 18, y], [x, y + 11]], C.cyan);
          else if (b.t === 2) { circle(x, y + 3, 15, C.purple); rect(x - 15, y + 3, 30, 12, C.purple, 4); circle(x, y - 2, 4, '#fff'); }
          else { circle(x, y, 13, C.green); line(x, y, x + 14, y - 6, C.white, 4); }
        }
        for (const m of meteors) {
          const p = 1 - clamp(m.t / 3, 0, 1);
          strokeCircle(m.x, m.y, 10 + p * 36, 'rgba(255,85,112,.7)', 2);
          const sx = m.x - 90 * (1 - p), sy = m.y - 220 * (1 - p);
          line(sx - 14, sy - 30, sx, sy, 'rgba(255,145,77,.5)', 4);
          circle(sx, sy, 7, C.orange);
        }
        const qc = Math.round(cx), qr = Math.round(cy), [qx, qy] = cellXY(qc, qr);
        ctx2d.strokeStyle = C.yellow; ctx2d.lineWidth = 2;
        ctx2d.strokeRect(qx - CS / 2 + 1, qy - CS / 2 + 1, CS - 2, CS - 2);
        fxDraw(parts);
        text('JOYSTICK move • A build ' + BP[bp].n + ' • B next • C demolish', W() / 2, H() - 92, 10, C.yellow, 'center');
      },
      stop() {}
    };
  }

  // ---------- Factory Line: sort parts across three lanes, oil the belt before it jams ----------
  function factory(g) {
    const LN = 3, Z0 = W() - 128, Z1 = W() - 12;
    const laneY = i => H() * (.38 + i * .13);
    let items = [], sel = 1, selCd = 0, products = 0, faults = 0, t = 0, spawnT = 1, oilT = 0, oilCd = 0, parts = [], done = false;
    return {
      update(dt) {
        if (done) return;
        t += dt; selCd -= dt; oilT = Math.max(0, oilT - dt); oilCd = Math.max(0, oilCd - dt);
        const ay = AY();
        if (selCd <= 0 && Math.abs(ay) > .5) { sel = clamp(sel + (ay > 0 ? 1 : -1), 0, LN - 1); selCd = .2; }
        const speed = (70 + Math.min(110, t * 1.5)) * (oilT > 0 ? .5 : 1);
        spawnT -= dt;
        if (spawnT <= 0) {
          spawnT = Math.max(.6, 1.3 - t * .01);
          const bad = Math.random() < Math.min(.4, .15 + t * .002);
          items.push({ lane: randi(0, LN - 1), x: -30, bad, c: pick([C.cyan, C.yellow, C.green, C.purple]), gone: false });
        }
        for (const it of items) it.x += speed * dt;
        items = items.filter(it => {
          if (it.gone) return false;
          if (it.x > W() + 30) { if (!it.bad) { faults++; toast('Good part missed!'); } return false; }
          return true;
        });
        const it = items.find(i => i.lane === sel && i.x >= Z0 && i.x <= Z1);
        if (pressed('a') && it) { // accept
          it.gone = true;
          if (it.bad) { faults++; fxBurst(parts, it.x, laneY(it.lane), C.red, 12, 140); beep(180, 80, .15, 'sawtooth', .06); }
          else { products++; fxBurst(parts, it.x, laneY(it.lane), it.c, 10, 110); beep(600, 900, .06, 'square', .04); }
        } else if (pressed('b') && it) { // reject
          it.gone = true;
          if (it.bad) fxBurst(parts, it.x, laneY(it.lane), C.lime, 10, 110);
          else { faults++; fxBurst(parts, it.x, laneY(it.lane), C.red, 8, 100); toast('Good part rejected!'); }
        }
        if (pressed('c') && oilCd <= 0) { oilT = 4; oilCd = 8; toast('Belt oiled'); }
        fxUpdate(parts, dt);
        if (faults >= 6) { done = true; miniFail(g, 'Too many faulty parts.'); return; }
        if (products >= g.goal) { done = true; completeMini(); return; }
        hud('Products ' + products + '/' + g.goal + ' • Faults ' + faults + '/6' + (oilT > 0 ? ' • OILED' : ''));
      },
      draw() {
        clear('#090a0d');
        for (let i = 0; i < LN; i++) {
          const y = laneY(i);
          rect(0, y - 24, W(), 48, '#1b1f2a');
          for (let x = -((t * 60) % 30); x < W(); x += 30) line(x, y - 20, x - 8, y + 20, 'rgba(255,255,255,.05)', 2);
          line(0, y - 24, W(), y - 24, '#2c3340', 2); line(0, y + 24, W(), y + 24, '#2c3340', 2);
        }
        rect(Z0, 80, Z1 - Z0, H() - 200, 'rgba(85,230,255,.08)', 10);
        rect(0, laneY(sel) - 26, W(), 52, 'rgba(255,227,110,.08)');
        polygon([[4, laneY(sel) - 8], [16, laneY(sel)], [4, laneY(sel) + 8]], C.yellow);
        for (const it of items) {
          const y = laneY(it.lane);
          rect(it.x - 20, y - 20, 40, 40, it.bad ? '#5a1a24' : it.c, 8);
          if (it.bad) { circle(it.x + 12, y - 12, 4, C.yellow); text('!', it.x, y + 5, 14, C.yellow, 'center'); }
          else rect(it.x - 14, y - 14, 10, 6, 'rgba(255,255,255,.35)', 3);
        }
        fxDraw(parts);
        text('UP/DOWN lane • A accept • B reject • C oil', W() / 2, H() - 92, 10, C.yellow, 'center');
      },
      stop() {}
    };
  }

  // ---------- Sky Drone Strike: hold fire, dodge tanks and zigzag scouts, grab drops ----------
  function drone(g) {
    const P = { x: W() / 2, y: H() - 160, r: 14, hp: 100, cd: 0, rapid: 0, shield: 0 };
    let shots = [], foes = [], eshots = [], drops = [], parts = [], kills = 0, spawnT = 0, t = 0, done = false, flash = 0;
    function damage(n) {
      if (P.shield > 0) { fxBurst(parts, P.x, P.y, C.cyan, 8, 100); return; }
      P.hp -= n; flash = 1;
    }
    function spawn() {
      const r = Math.random(), type = r < .55 ? 0 : r < .8 ? 1 : 2; // 0 scout, 1 zigzag, 2 tank
      foes.push({ type, x: rand(24, W() - 24), y: -30, hp: type === 2 ? 3 : 1, r: type === 2 ? 20 : 12, ph: rand(0, 6), fireT: rand(1, 2) });
    }
    return {
      update(dt) {
        if (done) return;
        t += dt; flash = Math.max(0, flash - dt * 3);
        P.x = clamp(P.x + AX() * 260 * dt, 18, W() - 18);
        P.y = clamp(P.y + AY() * 180 * dt, 90, H() - 130);
        P.cd -= dt; P.rapid = Math.max(0, P.rapid - dt); P.shield = Math.max(0, P.shield - dt);
        if (IN.act.a && P.cd <= 0) { P.cd = P.rapid > 0 ? .09 : .22; shots.push({ x: P.x, y: P.y - 16, vy: -460 }); beep(900, 700, .03, 'square', .03); }
        spawnT -= dt;
        if (spawnT <= 0) { spawn(); spawnT = Math.max(.35, 1 - t * .01) / (g.speed || 1); }
        for (const s of shots) s.y += s.vy * dt;
        shots = shots.filter(s => s.y > 60);
        for (const f of foes) {
          if (f.type === 1) f.x += Math.sin(t * 3 + f.ph) * 110 * dt;
          f.y += (f.type === 2 ? 30 : 70 + t * .6) * dt;
          f.x = clamp(f.x, 16, W() - 16);
          if (f.type === 2) { f.fireT -= dt; if (f.fireT <= 0) { f.fireT = 1.6; eshots.push({ x: f.x, y: f.y + 20, vy: 220 }); } }
        }
        for (let i = foes.length - 1; i >= 0; i--) {
          const f = foes[i];
          for (let j = shots.length - 1; j >= 0 && f.hp > 0; j--) {
            const s = shots[j];
            if (dist(s.x, s.y, f.x, f.y) < f.r + 3) { shots.splice(j, 1); f.hp--; fxBurst(parts, s.x, s.y, C.yellow, 4, 80); }
          }
          if (f.hp <= 0) {
            foes.splice(i, 1); kills++;
            fxBurst(parts, f.x, f.y, C.orange, 16, 170);
            if (Math.random() < .14) drops.push({ x: f.x, y: f.y, k: Math.random() < .5 ? 'R' : 'S', vy: 90 });
          } else if (f.y > H() - 130 || dist(f.x, f.y, P.x, P.y) < f.r + P.r) {
            foes.splice(i, 1); damage(f.type === 2 ? 25 : 15);
          }
        }
        for (const e of eshots) e.y += e.vy * dt;
        eshots = eshots.filter(e => {
          if (e.y > H()) return false;
          if (dist(e.x, e.y, P.x, P.y) < P.r + 4) { damage(12); return false; }
          return true;
        });
        for (const d of drops) d.y += d.vy * dt;
        drops = drops.filter(d => {
          if (d.y > H()) return false;
          if (dist(d.x, d.y, P.x, P.y) < 24) {
            if (d.k === 'R') P.rapid = 6; else P.shield = 4;
            toast(d.k === 'R' ? 'Rapid fire!' : 'Shield!');
            return false;
          }
          return true;
        });
        fxUpdate(parts, dt);
        if (P.hp <= 0) { done = true; miniFail(g, 'Drone shot down.'); return; }
        if (kills >= g.goal) { done = true; completeMini(); return; }
        hud('Kills ' + kills + '/' + g.goal + ' • HP ' + Math.max(0, Math.floor(P.hp)) + (P.shield > 0 ? ' • SHIELD' : ''));
      },
      draw() {
        clear('#031225');
        for (let i = 0; i < 30; i++) circle((i * 71) % W(), (i * 113 + t * 40 * (i % 3 + 1)) % H(), .9, 'rgba(255,255,255,.3)');
        rect(0, H() - 130, W(), 130, '#0a1a2e');
        for (const f of foes) {
          if (f.type === 0) polygon([[f.x, f.y + 10], [f.x - 11, f.y - 8], [f.x + 11, f.y - 8]], C.red);
          else if (f.type === 1) { circle(f.x, f.y, f.r, C.pink); strokeCircle(f.x, f.y, f.r + 4, 'rgba(255,79,216,.3)', 2); }
          else { rect(f.x - f.r, f.y - f.r * .7, f.r * 2, f.r * 1.4, '#5b6b8a', 6); rect(f.x - f.r + 4, f.y - 4, (f.r * 2 - 8) * f.hp / 3, 4, C.lime, 2); }
        }
        for (const s of shots) rect(s.x - 2, s.y - 9, 4, 18, C.yellow);
        for (const e of eshots) circle(e.x, e.y, 4, C.red);
        for (const d of drops) { circle(d.x, d.y, 11, d.k === 'R' ? C.orange : C.cyan); text(d.k, d.x, d.y + 4, 11, '#000', 'center'); }
        if (P.shield > 0) strokeCircle(P.x, P.y, 24, 'rgba(85,230,255,.6)', 3);
        rect(P.x - 18, P.y - 4, 36, 4, C.cyan, 2);
        rect(P.x - 14, P.y - 12, 28, 22, C.green, 7);
        circle(P.x, P.y - 2, 5, '#fff');
        fxDraw(parts);
        if (flash > 0) rect(0, 0, W(), H(), 'rgba(255,0,60,' + (flash * .25) + ')');
        text('JOYSTICK fly • hold A fire • catch R / S drops', W() / 2, H() - 92, 10, C.yellow, 'center');
      },
      stop() {}
    };
  }

  // ---------- Neon Breakout: levels, armored + explosive bricks, power-ups, 3 lives ----------
  function breakout(g) {
    const padY = () => H() - 118;
    let pad = { x: W() / 2, w: 96 }, balls = [], bricks = [], parts = [], caps = [], lives = 3, score = 0, level = 1,
      combo = 0, slow = 0, wide = 0, done = false;
    function layout() {
      bricks = [];
      const cols = 7, rows = 4 + Math.min(2, level - 1), bw = Math.min(72, (W() - 34) / cols - 5), bh = 22, gap = 5,
        start = (W() - cols * (bw + gap) + gap) / 2;
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        if (level > 1 && Math.random() < .15) continue;
        const r = Math.random(), kind = r < .12 ? 2 : r < .35 ? 1 : 0; // 0 normal, 1 armored (2 hits), 2 explosive
        bricks.push({ x: start + x * (bw + gap), y: 95 + y * (bh + gap), w: bw, h: bh, kind, hp: kind === 1 ? 2 : 1, alive: true });
      }
      balls = [{ x: pad.x, y: padY() - 12, vx: 0, vy: 0, r: 8, stuck: true }];
    }
    function kill(br) {
      br.alive = false;
      score += 10 * Math.min(4, 1 + Math.floor(combo / 5));
      const cx = br.x + br.w / 2, cy = br.y + br.h / 2;
      fxBurst(parts, cx, cy, br.kind === 2 ? C.orange : C.cyan, 12, 130);
      if (Math.random() < .16) caps.push({ x: cx, y: cy, vy: 110, t: pick(['W', 'M', 'L', 'S']) });
      if (br.kind === 2) { // explosion damages neighbours
        beep(120, 40, .2, 'sawtooth', .08);
        for (const o of bricks) if (o.alive && dist(cx, cy, o.x + o.w / 2, o.y + o.h / 2) < 80) {
          o.hp--; if (o.hp <= 0) kill(o);
        }
      }
    }
    layout();
    return {
      update(dt) {
        if (done) return;
        slow = Math.max(0, slow - dt); wide = Math.max(0, wide - dt);
        const pw = wide > 0 ? 150 : 96;
        pad.w = pw;
        pad.x = clamp(pad.x + AX() * 420 * dt, pw / 2 + 6, W() - pw / 2 - 6);
        const spd = (300 + level * 25) * (slow > 0 ? .7 : 1);
        for (const b of balls) {
          if (b.stuck) {
            b.x = pad.x;
            if (pressed('a')) { b.stuck = false; const a = rand(-.4, .4); b.vx = Math.sin(a) * spd; b.vy = -Math.cos(a) * spd; beep(300, 600, .05, 'square', .05); }
            continue;
          }
          const sp = Math.hypot(b.vx, b.vy) || 1, k = spd / sp;
          b.vx *= k; b.vy *= k;
          const px = b.x, py = b.y;
          b.x += b.vx * dt; b.y += b.vy * dt;
          if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx); }
          if (b.x > W() - b.r) { b.x = W() - b.r; b.vx = -Math.abs(b.vx); }
          if (b.y < 72 + b.r) { b.y = 72 + b.r; b.vy = Math.abs(b.vy); }
          const py0 = padY();
          if (b.vy > 0 && py + b.r <= py0 && b.y + b.r >= py0 && Math.abs(b.x - pad.x) < pad.w / 2 + b.r) {
            b.y = py0 - b.r; b.vy = -Math.abs(b.vy);
            b.vx = (b.x - pad.x) / (pad.w / 2) * spd * .9;
            combo = 0; beep(300, 650, .04, 'square', .05);
          }
          for (const br of bricks) {
            if (!br.alive) continue;
            const nx = clamp(b.x, br.x, br.x + br.w), ny = clamp(b.y, br.y, br.y + br.h);
            if (dist(b.x, b.y, nx, ny) >= b.r) continue;
            const vertical = py + b.r <= br.y || py - b.r >= br.y + br.h;
            if (vertical) b.vy = -b.vy; else b.vx = -b.vx;
            combo++;
            br.hp--;
            if (br.hp <= 0) kill(br);
            else { score += 3; beep(500, 400, .04, 'triangle', .05); }
            break;
          }
        }
        // Power-ups fall and are caught by the paddle.
        for (const c of caps) c.y += c.vy * dt;
        caps = caps.filter(c => {
          if (c.y > H()) return false;
          if (c.y > padY() - 10 && c.y < padY() + 20 && Math.abs(c.x - pad.x) < pad.w / 2 + 10) {
            if (c.t === 'W') wide = 10;
            else if (c.t === 'S') slow = 6;
            else if (c.t === 'L') lives = Math.min(5, lives + 1);
            else {
              const base = balls.find(b => !b.stuck);
              if (base && balls.length < 6) balls.push({ x: base.x, y: base.y, vx: base.vx + 120, vy: base.vy, r: 8, stuck: false }, { x: base.x, y: base.y, vx: base.vx - 120, vy: base.vy, r: 8, stuck: false });
            }
            toast(c.t === 'W' ? 'Wide paddle!' : c.t === 'S' ? 'Slow ball!' : c.t === 'L' ? 'Extra life!' : 'Multi-ball!');
            return false;
          }
          return true;
        });
        balls = balls.filter(b => b.stuck || b.y <= H() + 20);
        if (balls.length === 0) {
          lives--; combo = 0;
          if (lives <= 0) { done = true; miniFail(g, 'You lost all three lives.'); return; }
          balls = [{ x: pad.x, y: padY() - 12, vx: 0, vy: 0, r: 8, stuck: true }];
        }
        if (score >= g.goal) { done = true; completeMini(); return; }
        if (bricks.every(b => !b.alive)) { level++; toast('Level ' + level + '!'); beep(400, 900, .3, 'square', .06); layout(); }
        fxUpdate(parts, dt, 30);
        hud('Score ' + score + '/' + g.goal + ' • Lv ' + level + ' • ❤️ ' + lives);
      },
      draw() {
        clear('#07040d');
        for (let x = 0; x < W(); x += 40) line(x, 70, x, H() - 60, 'rgba(120,80,255,.05)', 1);
        for (const br of bricks) {
          if (!br.alive) continue;
          const col = br.kind === 2 ? C.orange : br.kind === 1 ? (br.hp === 2 ? C.purple : C.pink) : C.cyan;
          rect(br.x, br.y, br.w, br.h, col, 7);
          rect(br.x + 5, br.y + 4, br.w - 10, 3, 'rgba(255,255,255,.25)', 2);
          if (br.kind === 2) circle(br.x + br.w / 2, br.y + br.h / 2, 4, '#fff');
        }
        ctx2d.save(); ctx2d.shadowColor = C.purple; ctx2d.shadowBlur = 14;
        rect(pad.x - pad.w / 2, padY(), pad.w, 14, C.purple, 8);
        ctx2d.restore();
        for (const b of balls) {
          strokeCircle(b.x, b.y, b.r + 3, 'rgba(255,227,110,.3)', 2);
          circle(b.x, b.y, b.r, C.yellow);
        }
        for (const c of caps) {
          const col = c.t === 'W' ? C.cyan : c.t === 'S' ? C.blue : c.t === 'L' ? C.green : C.pink;
          rect(c.x - 12, c.y - 9, 24, 18, col, 6);
          text(c.t, c.x, c.y + 5, 11, '#000', 'center');
        }
        fxDraw(parts);
        text(balls.some(b => b.stuck) ? 'JOYSTICK paddle • A launch' : 'JOYSTICK paddle • catch the power-ups', W() / 2, H() - 92, 10, C.yellow, 'center');
      },
      stop() {}
    };
  }

  return {
    engines: { bowling, colony, factory, drone, breakout },
    minis: [
      { id: 'bowling', title: 'Strike Bowling', icon: '🎳', cat: 'SPORTS', desc: 'Aim, throw, curve the ball and chain-react the pins. 8 balls, strikes refill the rack.', engine: 'bowling', goal: 80 },
      { id: 'colony', title: 'Moon Colony', icon: '🌙', cat: 'STRATEGY', desc: 'Build mines, solar and habitats on a moon grid. Cannons shoot down meteors.', engine: 'colony', goal: 40 },
      { id: 'factory', title: 'Factory Line', icon: '🏭', cat: 'SIMULATION', desc: 'Pick a lane, accept good parts, reject faulty ones, oil the belt before it jams.', engine: 'factory', goal: 10 },
      { id: 'drone', title: 'Sky Drone Strike', icon: '🛸', cat: 'ACTION', desc: 'Hold fire, dodge tanks and zigzag scouts. Grab shield and rapid-fire drops.', engine: 'drone', goal: 20 },
      { id: 'breakout', title: 'Neon Breakout', icon: '🧱', cat: 'ARCADE', desc: 'Power-ups, armored and explosive bricks, 3 lives, levels.', engine: 'breakout', goal: 300 }
    ]
  };
})();
