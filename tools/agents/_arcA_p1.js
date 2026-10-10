
  // ===================== SNAKE =====================
  function gameSnake(g) {
    const cols = 15, cell = Math.floor(Math.min(W(), 480) / cols);
    const x0 = Math.floor((W() - cols * cell) / 2), y0 = 86, rows = Math.max(10, Math.floor((H() - y0 - 132) / cell));
    const ck = (x, y) => x + ',' + y;
    let body, prev, dir, q = [], acc = 0, apples = 0, score = 0, combo = 0, comboT = 0, level = 1, walls = new Set(), items = [], apple = null;
    let fx = [], pp = [], shake = 0, t = 0, ghost = 0, frost = 0, magnet = 0, itemT = 6, pulse = 0, best = sv('snake');
    body = [{ x: cols >> 1, y: rows - 3 }, { x: cols >> 1, y: rows - 2 }, { x: cols >> 1, y: rows - 1 }]; prev = body.map(b => ({ x: b.x, y: b.y })); dir = { x: 0, y: -1 };
    const LV = [
      () => [],
      () => { const a = []; for (let i = 0; i < Math.floor(rows / 2) - 3; i++) { a.push([4, 2 + i]); a.push([cols - 5, rows - 3 - i]); } return a; },
      () => { const a = [], r = rows >> 1; for (let x = 1; x < cols - 1; x++) if (Math.abs(x - (cols >> 1)) > 1) a.push([x, r]); return a; },
      () => { const a = []; for (let i = 0; i < 4; i++) { a.push([1 + i, 1], [1, 1 + i], [cols - 2 - i, 1], [cols - 2, 1 + i], [1 + i, rows - 2], [1, rows - 2 - i], [cols - 2 - i, rows - 2], [cols - 2, rows - 2 - i]); } return a; },
      () => { const a = []; for (let x = 3; x < cols - 2; x += 4) for (let y = 3; y < rows - 4; y += 4) { a.push([x, y], [x + 1, y]); } return a; }
    ];
    function free(x, y) { return !walls.has(ck(x, y)) && !body.some(b => b.x === x && b.y === y) && !items.some(i => i.x === x && i.y === y) && !(apple && apple.x === x && apple.y === y); }
    function spot() { for (let k = 0; k < 200; k++) { const x = randi(0, cols - 1), y = randi(0, rows - 1); if (free(x, y)) return { x, y }; } return { x: 0, y: 0 }; }
    function buildWalls() {
      walls = new Set(); const h = body[0];
      for (const [x, y] of LV[(level - 1) % LV.length]()) { if (x < 0 || y < 0 || x >= cols || y >= rows) continue; if (body.some(b => Math.abs(b.x - x) + Math.abs(b.y - y) < 3)) continue; if (Math.abs(h.x - x) + Math.abs(h.y - y) < 4) continue; walls.add(ck(x, y)); }
      if (apple && walls.has(ck(apple.x, apple.y))) apple = spot();
      items = items.filter(i => !walls.has(ck(i.x, i.y)));
    }
    apple = spot();
    function die(why) { beep(200, 40, .3, 'sawtooth', .2); miniFail(g, why); }
    function eat() {
      combo = comboT > 0 ? combo + 1 : 1; comboT = 3.2; const pts = 10 * Math.min(combo, 8); score += pts;
      const h = body[0], px = x0 + (h.x + .5) * cell, py = y0 + (h.y + .5) * cell;
      pop(pp, px, py - 10, '+' + pts + (combo > 1 ? ' x' + combo : ''), combo > 3 ? C.gold : C.lime, 14 + Math.min(combo, 6));
      fxBurst(fx, px, py, C.red, 14, 150); beep(500 + combo * 40, 900 + combo * 40, .06, 'square', .12); pulse = 1;
    }
    function gain(n) { const was = apples; apples += n; if (Math.floor(apples / 6) > Math.floor(was / 6)) { level++; buildWalls(); toast('LEVEL ' + level); beep(400, 1200, .25, 'triangle', .15); } }
    function step() {
      prev = body.map(b => ({ x: b.x, y: b.y }));
      if (q.length) { const d = q.shift(); if (!(d.x === -dir.x && d.y === -dir.y)) dir = d; }
      let hx = body[0].x + dir.x, hy = body[0].y + dir.y;
      if (hx < 0 || hx >= cols || hy < 0 || hy >= rows) { if (ghost > 0) { hx = (hx + cols) % cols; hy = (hy + rows) % rows; } else return die('You hit the wall.'); }
      if (ghost <= 0 && walls.has(ck(hx, hy))) return die('You crashed into a barrier.');
      if (ghost <= 0 && body.some((b, i) => i < body.length - 1 && b.x === hx && b.y === hy)) return die('You bit your own tail.');
      body.unshift({ x: hx, y: hy });
      let grew = false;
      if (hx === apple.x && hy === apple.y) { grew = true; apple = null; eat(); gain(1); if (!apple) apple = spot(); }
      for (let i = items.length - 1; i >= 0; i--) {
        const it = items[i]; if (it.x !== hx || it.y !== hy) continue; items.splice(i, 1);
        const px = x0 + (hx + .5) * cell, py = y0 + (hy + .5) * cell; fxBurst(fx, px, py, C.gold, 16, 180); beep(600, 1400, .12, 'sine', .15);
        if (it.k === 'gold') { grew = true; eat(); score += 40; gain(3); pop(pp, px, py - 26, 'GOLDEN +3', C.gold, 18); }
        else if (it.k === 'ghost') { ghost = 6; pop(pp, px, py - 20, 'GHOST', C.purple, 16); }
        else if (it.k === 'frost') { frost = 7; pop(pp, px, py - 20, 'FROST', C.cyan, 16); }
        else { magnet = 8; pop(pp, px, py - 20, 'MAGNET', C.pink, 16); }
      }
      if (!grew) body.pop();
      if (magnet > 0 && apple) { const h = body[0]; const dx = sgn(h.x - apple.x), dy = sgn(h.y - apple.y); const o = Math.abs(h.x - apple.x) >= Math.abs(h.y - apple.y) ? [dx, 0] : [0, dy]; const nx = apple.x + o[0], ny = apple.y + o[1]; if ((o[0] || o[1]) && !walls.has(ck(nx, ny)) && !items.some(i => i.x === nx && i.y === ny)) { apple.x = nx; apple.y = ny; } }
    }
    function turn(d) { if (!d) return; const last = q.length ? q[q.length - 1] : dir; if (d.x === last.x && d.y === last.y) return; if (d.x === -last.x && d.y === -last.y) return; q.push(d); if (q.length > 2) q.shift(); }
    const stepTime = () => Math.max(.075, .17 - apples * .0023) * (frost > 0 ? 1.55 : 1);
    return {
      update(dt) {
        t += dt; turn(inputDir(AX(), AY()));
        const stepT = stepTime();
        acc += dt; let n = 0; while (acc >= stepT && n++ < 3) { acc -= stepT; step(); if (apples >= g.goal) { completeMini(); return; } }
        if (acc > stepT) acc = stepT;
        comboT = Math.max(0, comboT - dt); if (comboT <= 0) combo = 0;
        ghost = Math.max(0, ghost - dt); frost = Math.max(0, frost - dt); magnet = Math.max(0, magnet - dt); pulse = Math.max(0, pulse - dt * 3); shake = Math.max(0, shake - dt * 30);
        itemT -= dt; if (itemT <= 0) { itemT = rand(7, 11); if (items.length < 2) { const s = spot(); items.push({ x: s.x, y: s.y, k: pick(['gold', 'gold', 'ghost', 'frost', 'magnet']), life: 12 }); } }
        for (let i = items.length - 1; i >= 0; i--) { items[i].life -= dt; if (items[i].life <= 0) items.splice(i, 1); }
        fxUpdate(fx, dt, 30); popUpdate(pp, dt);
        if (score > best) { best = score; sv('snake', best); }
        hud('Apples ' + apples + '/' + g.goal + ' • Lv ' + level + ' • Score ' + score + (combo > 1 ? ' • x' + combo : ''));
      },
      swipe(dx, dy) { turn(inputDir(dx, dy)); },
      draw() {
        const bgc = ['#04100f', '#0a0618', '#10080a', '#050a14', '#0a1006'][(level - 1) % 5];
        clear(bgc); ctx2d.save(); shk(shake);
        for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) rect(x0 + x * cell, y0 + y * cell, cell, cell, (x + y) % 2 ? 'rgba(255,255,255,.025)' : 'rgba(85,230,255,.035)');
        ctx2d.strokeStyle = 'rgba(85,230,255,.5)'; ctx2d.lineWidth = 2; ctx2d.strokeRect(x0 - 1, y0 - 1, cols * cell + 2, rows * cell + 2);
        for (const w of walls) { const [x, y] = w.split(',').map(Number); rr(x0 + x * cell + 1, y0 + y * cell + 1, cell - 2, cell - 2, 4, '#5a6478'); rr(x0 + x * cell + 3, y0 + y * cell + 3, cell - 6, 4, 2, 'rgba(255,255,255,.3)'); }
        if (apple) { const ax = x0 + (apple.x + .5) * cell, ay = y0 + (apple.y + .5) * cell, s = 1 + Math.sin(t * 6) * .08; glow(ax, ay, cell * 1.1, C.red, .5); circle(ax, ay, cell * .33 * s, C.red); circle(ax - 2, ay - 3, cell * .1, 'rgba(255,255,255,.7)'); line(ax, ay - cell * .3, ax + 2, ay - cell * .5, C.lime, 2); }
        for (const it of items) { const ax = x0 + (it.x + .5) * cell, ay = y0 + (it.y + .5) * cell; const col = { gold: C.gold, ghost: C.purple, frost: C.cyan, magnet: C.pink }[it.k]; ctx2d.globalAlpha = it.life < 3 ? (Math.sin(t * 14) > 0 ? 1 : .3) : 1; glow(ax, ay, cell * 1.3, col, .6); text({ gold: '⭐', ghost: '👻', frost: '❄️', magnet: '🧲' }[it.k], ax, ay + cell * .3, cell * .8, '#fff', 'center'); ctx2d.globalAlpha = 1; }
        const f = clamp(acc / stepTime(), 0, 1);
        const pts = body.map((b, i) => { const p = prev[i] || prev[prev.length - 1]; const jump = Math.abs(p.x - b.x) > 1 || Math.abs(p.y - b.y) > 1; const k = jump ? 1 : f; return { x: x0 + (lerp(p.x, b.x, k) + .5) * cell, y: y0 + (lerp(p.y, b.y, k) + .5) * cell }; });
        ctx2d.globalAlpha = ghost > 0 ? (ghost < 1.5 && Math.sin(t * 20) > 0 ? .9 : .5) : 1;
        for (let i = pts.length - 1; i >= 0; i--) {
          const k = i / Math.max(1, pts.length - 1), r = cell * (.46 - k * .14), col = frost > 0 ? 'hsl(' + (190 + k * 20) + ',90%,' + (65 - k * 15) + '%)' : 'hsl(' + (150 - k * 50) + ',85%,' + (58 - k * 12) + '%)';
          if (i > 0) { const a = pts[i - 1], b = pts[i]; if (Math.abs(a.x - b.x) < cell * 2 && Math.abs(a.y - b.y) < cell * 2) line(a.x, a.y, b.x, b.y, col, r * 1.9); }
          circle(pts[i].x, pts[i].y, r, col);
        }
        const h = pts[0]; circle(h.x, h.y, cell * .5, frost > 0 ? '#9fe8ff' : '#7dffb0');
        const ex = -dir.y, ey = dir.x; circle(h.x + dir.x * 4 + ex * 4, h.y + dir.y * 4 + ey * 4, 3, '#fff'); circle(h.x + dir.x * 4 - ex * 4, h.y + dir.y * 4 - ey * 4, 3, '#fff'); circle(h.x + dir.x * 5 + ex * 4, h.y + dir.y * 5 + ey * 4, 1.4, '#000'); circle(h.x + dir.x * 5 - ex * 4, h.y + dir.y * 5 - ey * 4, 1.4, '#000');
        if (pulse > 0) glow(h.x, h.y, cell * 2.2, C.green, pulse * .6);
        ctx2d.globalAlpha = 1; fxDraw(fx); popDraw(pp); ctx2d.restore();
        let bx = x0; const eff = [[ghost, 6, C.purple, '👻'], [frost, 7, C.cyan, '❄️'], [magnet, 8, C.pink, '🧲']];
        for (const [v, m, c, ic] of eff) if (v > 0) { text(ic, bx + 8, y0 - 6, 13, '#fff', 'center'); bar(bx + 18, y0 - 14, 40, 6, v / m, c); bx += 70; }
        if (combo > 1) text('COMBO x' + combo, W() - x0 - 4, y0 - 6, 13, C.gold, 'right', 900);
        hint('Joystick or swipe to steer • ⭐ golden = 3 apples');
      },
      stop() { }
    };
  }

  // ===================== BREAKOUT =====================
  function gameBreakout(g) {
    const cols = 8, bm = 10, bw = (W() - bm * 2) / cols, bh = 22, top = 100, py = H() - 140, ph = 14;
    const LAY = [
      ['22222222', '11111111', '1P1111P1', '11111111'],
      ['#..11..#', '.X2222X.', '12333321', '.X2222X.', '#..11..#'],
      ['3.3.3.3.', '11111111', 'X.X.X.X.', '22222222', 'P.P.P.P.'],
      ['33333333', '32222223', '31XPPX13', '32222223', '#11..11#'],
      ['#1P11P1#', '12222221', '13XXXX31', '12222221', '1.1.1.1.', '22222222']
    ];
    let level = 1, bricks = [], balls = [], caps = [], shots = [], fx = [], pp = [], broken = 0, lives = 3, score = 0, combo = 0, shake = 0, t = 0;
    let px = W() / 2, pw0 = 96, wide = 0, laser = 0, slow = 0, tx = null, laserCd = 0, flash = 0;
    function build() {
      bricks = []; const L = LAY[(level - 1) % LAY.length];
      for (let r = 0; r < L.length; r++) for (let c = 0; c < cols; c++) {
        const ch = (L[r][c] || '.'); if (ch === '.') continue;
        const k = { x: bm + c * bw + 1, y: top + r * (bh + 4), t: ch, hp: ch === '#' ? 99 : ch === '3' ? 3 : ch === '2' ? 2 : 1, dead: false, flash: 0 };
        if (level > 4 && k.hp === 1 && ch === '1') k.hp = 2; bricks.push(k);
      }
      caps = []; shots = [];
    }
    function pw() { return pw0 * (wide > 0 ? 1.55 : 1); }
    function newBall(stuck) { balls.push({ x: px, y: py - 9, vx: 0, vy: 0, r: 7, stuck: !!stuck, st: 0, tr: [] }); }
    build(); newBall(true);
    const spd = () => (320 + level * 16) * (slow > 0 ? .68 : 1);
    function launch(b) { b.stuck = false; const a = rand(-.35, .35); b.vx = Math.sin(a) * spd(); b.vy = -Math.cos(a) * spd(); beep(300, 600, .05, 'square', .1); }
    function destroy(k, silent) {
      if (k.dead) return; k.dead = true; broken++; combo++; const pts = 10 * (1 + Math.floor(combo / 6)); score += pts;
      const cx = k.x + bw / 2, cy = k.y + bh / 2; fxBurst(fx, cx, cy, k.t === 'X' ? C.orange : k.t === 'P' ? C.gold : randColor(), 12, 150);
      if (combo > 0 && combo % 6 === 0) pop(pp, cx, cy, 'x' + (1 + combo / 6 | 0), C.gold, 16);
      if (!silent) beep(300 + Math.min(combo, 20) * 25, 500, .05, 'square', .1);
      if (k.t === 'P' || Math.random() < .08) caps.push({ x: cx, y: cy, k: pick(['W', 'M', 'L', 'S', 'M', 'W', 'H']), a: 0 });
      if (k.t === 'X') { shake = 9; flash = .25; beep(150, 40, .25, 'sawtooth', .2); fxBurst(fx, cx, cy, C.red, 26, 260); for (const o of bricks) if (!o.dead && o.t !== '#' && Math.hypot(o.x + bw / 2 - cx, o.y + bh / 2 - cy) < bw * 1.7) destroy(o, true); }
    }
    function dmg(k, d) { if (k.dead) return; k.flash = .15; if (k.t === '#') { beep(900, 700, .03, 'square', .06); return; } k.hp -= d; if (k.hp <= 0) destroy(k); else { score += 2; beep(500, 400, .03, 'square', .08); } }
    function hitBricks(b) {
      for (const k of bricks) {
        if (k.dead) continue; const nx = clamp(b.x, k.x, k.x + bw - 2), ny = clamp(b.y, k.y, k.y + bh), dx = b.x - nx, dy = b.y - ny;
        if (dx * dx + dy * dy < b.r * b.r) {
          if (dx === 0 && dy === 0) { b.vy = -b.vy; b.y += b.vy > 0 ? 3 : -3; } else if (Math.abs(dx) > Math.abs(dy)) { b.vx = Math.abs(b.vx) * sgn(dx); b.x = nx + sgn(dx) * b.r; } else { b.vy = Math.abs(b.vy) * sgn(dy); b.y = ny + sgn(dy) * b.r; }
          dmg(k, 1); return;
        }
      }
    }
    function pointer(x) { tx = x; for (const b of balls) if (b.stuck && b.st > .25) launch(b); }
    return {
      pointer,
      update(dt) {
        t += dt; wide = Math.max(0, wide - dt); laser = Math.max(0, laser - dt); slow = Math.max(0, slow - dt); shake = Math.max(0, shake - dt * 30); flash = Math.max(0, flash - dt);
        const ax = AX(); if (Math.abs(ax) > .1) { px += ax * 560 * dt; tx = null; } else if (tx !== null) { const d = tx - px; px += clamp(d, -1100 * dt, 1100 * dt); if (Math.abs(d) < 2) tx = null; }
        px = clamp(px, pw() / 2 + 4, W() - pw() / 2 - 4);
        const fire = pressed('a');
        for (const b of balls) { if (b.stuck) { b.st += dt; b.x = px; b.y = py - b.r - 1; if (fire || b.st > 2.2) launch(b); } }
        if (laser > 0) { laserCd -= dt; if (laserCd <= 0) { laserCd = .3; shots.push({ x: px - pw() / 2 + 6, y: py }, { x: px + pw() / 2 - 6, y: py }); beep(900, 1400, .03, 'square', .05); } }
        for (const s of shots) { s.y -= 720 * dt; for (const k of bricks) if (!k.dead && s.x > k.x && s.x < k.x + bw && s.y < k.y + bh && s.y > k.y - 6) { dmg(k, 1); s.y = -99; break; } }
        shots = shots.filter(s => s.y > top - 30);
        for (const b of balls) {
          if (b.stuck) continue; const sp = Math.hypot(b.vx, b.vy) || 1, want = spd(); b.vx *= lerp(1, want / sp, .1); b.vy *= lerp(1, want / sp, .1);
          if (Math.abs(b.vy) < 70) b.vy = 70 * (b.vy < 0 ? -1 : 1);
          const n = Math.max(1, Math.ceil(Math.hypot(b.vx, b.vy) * dt / 4)), h = dt / n;
          for (let i = 0; i < n; i++) {
            b.x += b.vx * h; b.y += b.vy * h;
            if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx); } if (b.x > W() - b.r) { b.x = W() - b.r; b.vx = -Math.abs(b.vx); }
            if (b.y < 78 + b.r) { b.y = 78 + b.r; b.vy = Math.abs(b.vy); }
            if (b.vy > 0 && b.y + b.r >= py && b.y - b.r < py + ph && Math.abs(b.x - px) < pw() / 2 + b.r) {
              const a = clamp((b.x - px) / (pw() / 2), -1, 1) * 1.1, s = Math.hypot(b.vx, b.vy); b.vx = Math.sin(a) * s; b.vy = -Math.cos(a) * s; b.y = py - b.r; combo = 0; beep(260, 520, .05, 'triangle', .12); shake = 2;
            }
            hitBricks(b);
          }
          b.tr.push({ x: b.x, y: b.y }); if (b.tr.length > 10) b.tr.shift();
        }
        balls = balls.filter(b => b.y < H() - 100);
        if (!balls.length) {
          lives--; combo = 0; wide = laser = slow = 0; shake = 8; beep(300, 60, .3, 'sawtooth', .2);
          if (lives <= 0) { miniFail(g, 'You lost all three balls.'); return; } newBall(true);
        }
        for (const c of caps) {
          c.y += 130 * dt; c.a += dt; if (c.y > py - 8 && c.y < py + ph + 10 && Math.abs(c.x - px) < pw() / 2 + 12) {
            c.y = 9999; beep(500, 1300, .15, 'sine', .15); pop(pp, px, py - 24, { W: 'WIDE', M: 'MULTI', L: 'LASER', S: 'SLOW', H: '+LIFE' }[c.k], C.gold, 16);
            if (c.k === 'W') wide = 12; else if (c.k === 'L') laser = 10; else if (c.k === 'S') slow = 9; else if (c.k === 'H') lives = Math.min(5, lives + 1);
            else { const src = balls.find(b => !b.stuck) || balls[0]; if (src) for (let i = 0; i < 2; i++) { const a = Math.atan2(src.vy, src.vx) + (i ? .4 : -.4), s = Math.max(200, Math.hypot(src.vx, src.vy)); balls.push({ x: src.x, y: src.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, r: 7, stuck: false, st: 0, tr: [] }); } }
          }
        }
        caps = caps.filter(c => c.y < H() - 100);
        for (const k of bricks) k.flash = Math.max(0, k.flash - dt);
        fxUpdate(fx, dt, 60); popUpdate(pp, dt);
        if (broken >= g.goal) { completeMini(); return; }
        if (bricks.every(k => k.dead || k.t === '#')) { level++; toast('LEVEL ' + level); beep(400, 1400, .3, 'triangle', .15); build(); balls = []; newBall(true); wide = laser = 0; }
        hud('Bricks ' + broken + '/' + g.goal + ' • Lv ' + level + ' • ❤ ' + lives + (combo > 2 ? ' • x' + combo : ''));
      },
      draw() {
        vgrad(0, H(), '#0a0516', '#150a26'); stars(30, 3, t, 4, .15);
        ctx2d.save(); shk(shake);
        for (const k of bricks) {
          if (k.dead) continue; const col = k.t === '#' ? '#4a5262' : k.t === 'X' ? '#ff6a3d' : k.t === 'P' ? '#ffd15c' : k.hp >= 3 ? '#b8c4d8' : k.hp === 2 ? '#ff4fd8' : '#4da3ff';
          rr(k.x, k.y, bw - 2, bh, 6, k.flash > 0 ? '#fff' : col); rr(k.x + 3, k.y + 3, bw - 8, 4, 2, 'rgba(255,255,255,.35)'); rr(k.x, k.y + bh - 5, bw - 2, 5, 3, 'rgba(0,0,0,.25)');
          if (k.t === 'X') text('✹', k.x + bw / 2 - 1, k.y + 17, 15, '#fff', 'center'); else if (k.t === 'P') text('★', k.x + bw / 2 - 1, k.y + 17, 15, '#7a4b00', 'center');
          else if (k.t === '#') { line(k.x + 4, k.y + bh - 4, k.x + bw - 8, k.y + 4, 'rgba(255,255,255,.2)', 2); } else if (k.hp >= 3) text('III', k.x + bw / 2 - 1, k.y + 16, 11, '#4a5262', 'center'); else if (k.hp === 2 && k.t === '3') text('II', k.x + bw / 2 - 1, k.y + 16, 11, '#fff', 'center');
        }
        for (const c of caps) { const col = { W: C.green, M: C.cyan, L: C.red, S: C.purple, H: C.pink }[c.k]; glow(c.x, c.y, 24, col, .6); rr(c.x - 14, c.y - 9, 28, 18, 9, col); text(c.k, c.x, c.y + 5, 13, '#001', 'center', 900); }
        for (const s of shots) { glow(s.x, s.y, 12, C.red, .8); rect(s.x - 1.5, s.y - 12, 3, 14, '#ffd6d6'); }
        const w = pw(); glow(px, py + 7, w * .7, C.purple, .25); rr(px - w / 2, py, w, ph, 7, '#a978ff'); rr(px - w / 2 + 4, py + 2, w - 8, 4, 2, 'rgba(255,255,255,.45)');
        if (laser > 0) { rr(px - w / 2 - 2, py - 7, 7, 12, 3, C.red); rr(px + w / 2 - 5, py - 7, 7, 12, 3, C.red); }
        for (const b of balls) { for (let i = 0; i < b.tr.length; i++) { ctx2d.globalAlpha = i / b.tr.length * .35; circle(b.tr[i].x, b.tr[i].y, b.r * i / b.tr.length, slow > 0 ? C.cyan : C.yellow); } ctx2d.globalAlpha = 1; glow(b.x, b.y, 22, slow > 0 ? C.cyan : C.yellow, .5); circle(b.x, b.y, b.r, '#fff'); }
        fxDraw(fx); popDraw(pp);
        if (flash > 0) { ctx2d.fillStyle = 'rgba(255,140,60,' + flash * .5 + ')'; ctx2d.fillRect(0, 0, W(), H()); }
        ctx2d.restore();
        let bx = 10; for (const [v, m, c, ic] of [[wide, 12, C.green, '↔'], [laser, 10, C.red, '⚡'], [slow, 9, C.purple, '🐌']]) if (v > 0) { text(ic, bx + 6, 92, 13, '#fff', 'center'); bar(bx + 16, 85, 36, 6, v / m, c); bx += 62; }
        if (balls.some(b => b.stuck)) text('TAP or A to launch', W() / 2, py - 40, 14, C.yellow, 'center');
        hint('Joystick or tap to move • hit paddle edges to aim');
      },
      stop() { }
    };
  }
