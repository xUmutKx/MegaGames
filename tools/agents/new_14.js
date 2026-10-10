// new_14: maze, stealth and escape minigames (original names and text).
window.__AG_new_14 = (function () {
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const CONE = Math.cos(40 * Math.PI / 180);

  // ---------- maze and tile helpers (tile units; cells sit on odd/odd tiles) ----------
  function genMap(cw, ch) {
    const w = cw * 2 + 1, h = ch * 2 + 1;
    const t = new Uint8Array(w * h).fill(1);
    const seen = new Uint8Array(cw * ch);
    const stack = [[0, 0]];
    seen[0] = 1; t[w + 1] = 0;
    while (stack.length) {
      const [cx, cy] = stack[stack.length - 1];
      const opts = DIRS.filter(([dx, dy]) => {
        const nx = cx + dx, ny = cy + dy;
        return nx >= 0 && ny >= 0 && nx < cw && ny < ch && !seen[ny * cw + nx];
      });
      if (!opts.length) { stack.pop(); continue; }
      const [dx, dy] = pick(opts);
      const nx = cx + dx, ny = cy + dy;
      seen[ny * cw + nx] = 1;
      t[(2 * ny + 1) * w + 2 * nx + 1] = 0;
      t[(2 * cy + 1 + dy) * w + 2 * cx + 1 + dx] = 0;
      stack.push([nx, ny]);
    }
    return { w, h, t };
  }
  function bfs(w, h, blocked, s) {
    const d = new Int32Array(w * h).fill(-1), prev = new Int32Array(w * h).fill(-1);
    const q = [s];
    d[s] = 0;
    for (let qi = 0; qi < q.length; qi++) {
      const i = q[qi], x = i % w, y = (i - x) / w;
      for (const [dx, dy] of DIRS) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const j = ny * w + nx;
        if (d[j] >= 0 || blocked[j]) continue;
        d[j] = d[i] + 1; prev[j] = i; q.push(j);
      }
    }
    return { d, prev };
  }
  // tile indices from s (excluded) to e (included); empty when unreachable
  function pathTo(prev, s, e) {
    const out = [];
    if (e !== s && prev[e] < 0) return out;
    for (let i = e; i !== s && i >= 0; i = prev[i]) out.push(i);
    return out.reverse();
  }
  function farthest(d) {
    let b = 0;
    for (let i = 1; i < d.length; i++) if (d[i] > d[b]) b = i;
    return b;
  }
  function solidAt(m, x, y) {
    return x < 0 || y < 0 || x >= m.w || y >= m.h || m.t[y * m.w + x] === 1;
  }
  // slides a body of radius r (tile units) along walls; blocked(tx, ty) reports solid tiles
  function moveBody(b, dx, dy, r, blocked) {
    const hit = (x, y) => {
      const x0 = Math.floor(x - r), x1 = Math.floor(x + r - 1e-4);
      const y0 = Math.floor(y - r), y1 = Math.floor(y + r - 1e-4);
      for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (blocked(tx, ty)) return true;
      return false;
    };
    if (!hit(b.x + dx, b.y)) b.x += dx;
    if (!hit(b.x, b.y + dy)) b.y += dy;
  }
  function layout(m) {
    const avail = H() - 210;
    const ts = Math.min((W() - 16) / m.w, avail / m.h);
    return { ts, ox: (W() - m.w * ts) / 2, oy: 84 + (avail - m.h * ts) / 2 };
  }
  // walks a body to the next node of a closed route (tile indices)
  function walkRoute(b, route, w, speed, dt) {
    const t = route[b.ri], tx = t % w + .5, ty = Math.floor(t / w) + .5;
    const dx = tx - b.x, dy = ty - b.y, dd = Math.hypot(dx, dy), st = speed * dt;
    if (dd <= st) { b.x = tx; b.y = ty; b.ri = (b.ri + 1) % route.length; }
    else { b.x += dx / dd * st; b.y += dy / dd * st; b.fx = dx / dd; b.fy = dy / dd; }
  }
  // moves a body toward lower values of a BFS field d (distance to a target)
  function followField(b, d, m, speed, dt) {
    if (b.tx === undefined) {
      const cx = Math.floor(b.x), cy = Math.floor(b.y);
      let bd = d[cy * m.w + cx] < 0 ? Infinity : d[cy * m.w + cx], best = null;
      for (const [dx, dy] of DIRS) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h) continue;
        const v = d[ny * m.w + nx];
        if (v >= 0 && v < bd) { bd = v; best = [nx + .5, ny + .5]; }
      }
      if (!best) return;
      b.tx = best[0]; b.ty = best[1];
    }
    const dx = b.tx - b.x, dy = b.ty - b.y, dd = Math.hypot(dx, dy), st = speed * dt;
    if (dd <= st) { b.x = b.tx; b.y = b.ty; b.tx = undefined; }
    else { b.x += dx / dd * st; b.y += dy / dd * st; }
  }
  // one-shot direction from the joystick, re-armed when the stick returns to centre
  function stepLatch() {
    let held = false;
    return function () {
      const x = AX(), y = AY();
      if (Math.max(Math.abs(x), Math.abs(y)) < 0.4) { held = false; return null; }
      if (held) return null;
      held = true;
      return Math.abs(x) > Math.abs(y) ? [x > 0 ? 1 : -1, 0] : [0, y > 0 ? 1 : -1];
    };
  }
  function swipeDir(dx, dy) {
    return Math.abs(dx) > Math.abs(dy) ? [Math.sign(dx), 0] : [0, Math.sign(dy)];
  }

  // ---------- 1. Lantern Labyrinth: dark maze, oil-fed lantern ----------
  function n14_lanternrun(g) {
    let level = 0, m, w, p, oil = 100, flasks, seen, exitI, L, done = false, tt = 0;
    const sparks = [];
    const lightR = () => 1.6 + 3.2 * clamp(oil, 0, 100) / 100;
    function build() {
      m = genMap(Math.min(5 + level, 12), Math.min(4 + level, 11));
      w = m.w;
      const start = w + 1, d = bfs(w, m.h, m.t, start).d;
      exitI = farthest(d);
      const cand = [];
      for (let i = 0; i < m.t.length; i++) if (!m.t[i] && d[i] > 3) cand.push(i);
      flasks = [];
      for (let k = 0; k < 3 + level && cand.length; k++) {
        const i = cand.splice(Math.floor(Math.random() * cand.length), 1)[0];
        flasks.push({ x: i % w + .5, y: Math.floor(i / w) + .5 });
      }
      p = { x: 1.5, y: 1.5 };
      seen = new Uint8Array(m.t.length);
      L = layout(m);
    }
    build();
    function update(dt) {
      if (done) return;
      tt += dt;
      L = layout(m);
      moveBody(p, AX() * 3.2 * dt, AY() * 3.2 * dt, 0.3, (x, y) => solidAt(m, x, y));
      oil -= dt * 2.2;
      for (let i = flasks.length - 1; i >= 0; i--) {
        const f = flasks[i];
        if (dist(p.x, p.y, f.x, f.y) < 0.6) {
          flasks.splice(i, 1);
          oil = Math.min(100, oil + 30);
          fxBurst(sparks, L.ox + f.x * L.ts, L.oy + f.y * L.ts, C.gold, 14, 160);
          beep(600, 1000, 0.15, 'sine', 0.25);
        }
      }
      const R = lightR();
      for (let ty = Math.floor(p.y - R); ty <= Math.floor(p.y + R); ty++) {
        for (let tx = Math.floor(p.x - R); tx <= Math.floor(p.x + R); tx++) {
          if (tx >= 0 && ty >= 0 && tx < w && ty < m.h && dist(p.x, p.y, tx + .5, ty + .5) <= R) seen[ty * w + tx] = 1;
        }
      }
      fxUpdate(sparks, dt, 40);
      const ex = exitI % w + .5, ey = Math.floor(exitI / w) + .5;
      if (dist(p.x, p.y, ex, ey) < 0.55) {
        level++;
        if (level >= g.goal) { done = true; completeMini(); return; }
        toast('Out of the maze. Deeper!');
        beep(520, 880, 0.25, 'sine', 0.2);
        build();
        return;
      }
      if (oil <= 0) { done = true; miniFail(g, 'The lantern went out in the dark.'); return; }
      hud(level + ' / ' + g.goal + '   Oil ' + Math.ceil(oil) + '%');
    }
    function draw() {
      clear('#03040a');
      if (!m) return;
      const T = L.ts, R = lightR();
      for (let ty = 0; ty < m.h; ty++) {
        for (let tx = 0; tx < m.w; tx++) {
          const i = ty * w + tx, dd = dist(p.x, p.y, tx + .5, ty + .5);
          const lit = dd < R;
          if (!lit && !seen[i]) continue;
          const a = lit ? 1 - 0.5 * dd / R : 0.16;
          const x = L.ox + tx * T, y = L.oy + ty * T;
          if (m.t[i]) {
            rect(x, y, T + .5, T + .5, 'rgba(70,96,160,' + a + ')');
            rect(x, y, T + .5, T * .22, 'rgba(150,180,240,' + a * .6 + ')');
          } else {
            rect(x, y, T + .5, T + .5, 'rgba(24,30,50,' + a + ')');
          }
        }
      }
      if (seen[exitI]) {
        const cx = L.ox + (exitI % w + .5) * T, cy = L.oy + (Math.floor(exitI / w) + .5) * T;
        const pulse = 0.5 + 0.5 * Math.sin(tt * 4);
        circle(cx, cy, T * (0.3 + 0.08 * pulse), 'rgba(85,255,154,0.35)');
        strokeCircle(cx, cy, T * 0.3, C.green, 2);
      }
      for (const f of flasks) {
        if (dist(p.x, p.y, f.x, f.y) >= R) continue;
        const cx = L.ox + f.x * T, cy = L.oy + f.y * T;
        circle(cx, cy, T * 0.3, 'rgba(255,214,120,0.25)');
        circle(cx, cy, T * 0.14, C.gold);
      }
      const px = L.ox + p.x * T, py = L.oy + p.y * T, rr = R * T;
      ctx2d.globalCompositeOperation = 'lighter';
      const gr = ctx2d.createRadialGradient(px, py, 0, px, py, rr);
      gr.addColorStop(0, 'rgba(255,200,110,0.32)');
      gr.addColorStop(1, 'rgba(255,200,110,0)');
      ctx2d.fillStyle = gr;
      ctx2d.fillRect(px - rr, py - rr, rr * 2, rr * 2);
      ctx2d.globalCompositeOperation = 'source-over';
      circle(px, py, T * 0.25, '#fff4d6');
      fxDraw(sparks);
      rect(20, H() - 140, W() - 40, 6, '#1a2030', true);
      rect(20, H() - 140, (W() - 40) * clamp(oil / 100, 0, 1), 6, oil < 25 ? C.red : C.gold, true);
      text('OIL', 20, H() - 146, 11, '#9aa6c4');
    }
    return { update, draw, stop() {} };
  }

  // ---------- 2. Velvet Vault: stealth heist with guard cones ----------
  function n14_velvetvault(g) {
    let cleared = 0, m, w, p, guards, relic, exitI, phase, sneak, meter, done = false, L, tt = 0;
    const sparks = [];
    function build() {
      const n = Math.min(6 + cleared, 10);
      m = genMap(n, n); w = m.w;
      const start = w + 1, d0 = bfs(w, m.h, m.t, start).d;
      relic = farthest(d0);
      exitI = farthest(bfs(w, m.h, m.t, relic).d);
      p = { x: 1.5, y: 1.5 };
      phase = 0; sneak = false; meter = 0;
      const open = [];
      for (let i = 0; i < m.t.length; i++) if (!m.t[i] && d0[i] > 5) open.push(i);
      guards = [];
      for (let k = 0; k < 2 + Math.min(cleared, 3) && open.length > 2; k++) {
        const wps = [pick(open), pick(open), pick(open)], route = [];
        for (let j = 0; j < 3; j++) route.push(...pathTo(bfs(w, m.h, m.t, wps[j]).prev, wps[j], wps[(j + 1) % 3]));
        if (!route.length) continue;
        guards.push({ x: wps[0] % w + .5, y: Math.floor(wps[0] / w) + .5, route, ri: 0, fx: 1, fy: 0, seeing: false });
      }
      L = layout(m);
    }
    build();
    function sees(gd) {
      const dx = p.x - gd.x, dy = p.y - gd.y, dd = Math.hypot(dx, dy);
      if (dd > 4.2) return false;
      if (dd < 0.01) return true;
      if ((dx * gd.fx + dy * gd.fy) / dd < CONE) return false;
      for (let s = 0.5; s < dd; s += 0.3) {
        if (solidAt(m, Math.floor(gd.x + dx / dd * s), Math.floor(gd.y + dy / dd * s))) return false;
      }
      return true;
    }
    function update(dt) {
      if (done) return;
      tt += dt;
      if (pressed('b')) { sneak = !sneak; beep(sneak ? 300 : 500, sneak ? 220 : 700, 0.08, 'triangle', 0.15); }
      moveBody(p, AX() * (sneak ? 1.6 : 3.0) * dt, AY() * (sneak ? 1.6 : 3.0) * dt, 0.3, (x, y) => solidAt(m, x, y));
      let spotted = false;
      for (const gd of guards) {
        walkRoute(gd, gd.route, w, 1.8, dt);
        const dd = dist(p.x, p.y, gd.x, gd.y);
        if (dd < 0.55) { done = true; miniFail(g, 'A guard grabbed you.'); return; }
        gd.seeing = sees(gd);
        if (gd.seeing) { spotted = true; meter += (dd < 2 ? 70 : 38) * (sneak ? 0.5 : 1) * dt; }
      }
      if (!spotted) meter -= 22 * dt;
      meter = clamp(meter, 0, 100);
      if (meter >= 100) { done = true; miniFail(g, 'Spotted! The alarm is up.'); return; }
      const rx = relic % w + .5, ry = Math.floor(relic / w) + .5;
      if (phase === 0 && dist(p.x, p.y, rx, ry) < 0.6) {
        phase = 1;
        fxBurst(sparks, L.ox + rx * L.ts, L.oy + ry * L.ts, C.gold, 30, 220);
        beep(400, 900, 0.3, 'sine', 0.3);
        toast('Relic secured. Get out!');
      }
      const ex = exitI % w + .5, ey = Math.floor(exitI / w) + .5;
      if (phase === 1 && dist(p.x, p.y, ex, ey) < 0.6) {
        cleared++;
        if (cleared >= g.goal) { done = true; completeMini(); return; }
        beep(520, 880, 0.25, 'sine', 0.2);
        build();
        return;
      }
      fxUpdate(sparks, dt, 30);
      hud(cleared + ' / ' + g.goal + '   ' + (phase === 0 ? 'Find the relic' : 'Escape!') + '   Alarm ' + Math.floor(meter) + '%');
    }
    function draw() {
      clear('#070611');
      if (!m) return;
      const T = L.ts;
      for (let ty = 0; ty < m.h; ty++) {
        for (let tx = 0; tx < m.w; tx++) {
          const i = ty * w + tx, x = L.ox + tx * T, y = L.oy + ty * T;
          if (m.t[i]) { rect(x, y, T + .5, T + .5, '#2a2550'); rect(x, y, T + .5, T * .2, '#4a4580'); }
          else rect(x, y, T + .5, T + .5, (tx + ty) % 2 ? '#15132b' : '#1a1836');
        }
      }
      const exX = L.ox + (exitI % w) * T, exY = L.oy + Math.floor(exitI / w) * T;
      rect(exX + T * .15, exY + T * .15, T * .7, T * .7, phase === 1 ? 'rgba(85,255,154,0.85)' : 'rgba(255,85,112,0.35)', true);
      if (phase === 0) {
        const rx = L.ox + (relic % w + .5) * T, ry = L.oy + (Math.floor(relic / w) + .5) * T;
        const pulse = 0.5 + 0.5 * Math.sin(tt * 5);
        circle(rx, ry, T * (0.5 + 0.2 * pulse), 'rgba(255,209,92,0.25)');
        polygon([[rx, ry - T * .3], [rx + T * .3, ry], [rx, ry + T * .3], [rx - T * .3, ry]], C.gold);
      }
      const R = 4.2 * T;
      for (const gd of guards) {
        const gx = L.ox + gd.x * T, gy = L.oy + gd.y * T, base = Math.atan2(gd.fy, gd.fx);
        const a1 = base - 0.698, a2 = base + 0.698;
        polygon([[gx, gy], [gx + Math.cos(a1) * R, gy + Math.sin(a1) * R], [gx + Math.cos(a2) * R, gy + Math.sin(a2) * R]],
          gd.seeing ? 'rgba(255,70,90,0.30)' : 'rgba(255,230,120,0.10)');
      }
      for (const gd of guards) {
        const gx = L.ox + gd.x * T, gy = L.oy + gd.y * T;
        circle(gx, gy, T * 0.36, '#3a0f1e');
        strokeCircle(gx, gy, T * 0.36, '#ff5570', 2);
        if (gd.seeing) text('!', gx, gy - T * 0.55, 16, C.yellow, 'center');
      }
      const px = L.ox + p.x * T, py = L.oy + p.y * T;
      circle(px, py, T * 0.5, 'rgba(138,240,255,0.18)');
      circle(px, py, T * 0.32, sneak ? 'rgba(138,240,255,0.5)' : '#8ef6ff');
      fxDraw(sparks);
      rect(20, H() - 140, W() - 40, 6, '#1a1830', true);
      rect(20, H() - 140, (W() - 40) * meter / 100, 6, C.red, true);
    }
    return { update, draw, stop() {} };
  }

  // ---------- 3. Glacier Slip: swipe to slide over ice until something stops you ----------
  function n14_glacierslip(g) {
    let level = 0, N = 5, grid, ex, ey, sx, sy, px, py, par = 1, moves = 0, anim = null, done = false, tt = 0;
    const sparks = [];
    const latch = stepLatch();
    // grid values: 0 ice, 1 rock, 2 rough snow (a slide stops on it)
    function slide(x, y, dx, dy) {
      for (;;) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= N || ny >= N) break;
        const v = grid[ny * N + nx];
        if (v === 1) break;
        x = nx; y = ny;
        if (v === 2 || (nx === ex && ny === ey)) break;
      }
      return [x, y];
    }
    function optimalMoves() {
      const dist = new Int32Array(N * N).fill(-1);
      const s = sy * N + sx;
      dist[s] = 0;
      const q = [s];
      for (let qi = 0; qi < q.length; qi++) {
        const i = q[qi], x = i % N, y = (i - x) / N;
        if (x === ex && y === ey) continue;
        for (const [dx, dy] of DIRS) {
          const [nx, ny] = slide(x, y, dx, dy);
          const j = ny * N + nx;
          if ((nx !== x || ny !== y) && dist[j] < 0) { dist[j] = dist[i] + 1; q.push(j); }
        }
      }
      return dist[ey * N + ex];
    }
    function build() {
      N = Math.min(5 + level, 8);
      sx = 0; sy = N - 1; ex = N - 1; ey = 0;
      let ok = false;
      for (let tries = 0; tries < 200 && !ok; tries++) {
        grid = new Uint8Array(N * N);
        for (let i = 0; i < N * N; i++) { const r = Math.random(); grid[i] = r < 0.2 ? 1 : r < 0.32 ? 2 : 0; }
        grid[sy * N + sx] = 0; grid[ey * N + ex] = 0;
        ok = optimalMoves() > 0;
      }
      if (!ok) grid.fill(0);
      par = optimalMoves();
      moves = par * 2 + 2;
      px = sx; py = sy; anim = null;
    }
    build();
    function geo() {
      const T = Math.min((W() - 30) / N, (H() - 240) / N);
      return { T, ox: (W() - N * T) / 2, oy: 96 + ((H() - 240) - N * T) / 2 };
    }
    function tryMove(dx, dy) {
      if (anim || done) return;
      const [nx, ny] = slide(px, py, dx, dy);
      if (nx === px && ny === py) { beep(180, 120, 0.08, 'square', 0.12); return; }
      anim = { x0: px, y0: py, x1: nx, y1: ny, t: 0 };
      px = nx; py = ny; moves--;
    }
    function swipe(dx, dy) { const d = swipeDir(dx, dy); tryMove(d[0], d[1]); }
    function update(dt) {
      if (done) return;
      tt += dt;
      if (anim) {
        anim.t += dt;
        const G = geo(), k = clamp(anim.t / 0.18, 0, 1), e = k * k * (3 - 2 * k);
        fxBurst(sparks, G.ox + (anim.x0 + (anim.x1 - anim.x0) * e + .5) * G.T, G.oy + (anim.y0 + (anim.y1 - anim.y0) * e + .5) * G.T, C.white, 1, 40);
        if (anim.t >= 0.18) {
          anim = null;
          if (px === ex && py === ey) {
            level++;
            if (level >= g.goal) { done = true; completeMini(); return; }
            beep(600, 1000, 0.2, 'sine', 0.2);
            toast('Through the ice!');
            build();
            return;
          }
          if (moves <= 0) { done = true; miniFail(g, 'Out of moves. The glacier held you.'); return; }
        }
      } else {
        const d = latch();
        if (d) tryMove(d[0], d[1]);
      }
      fxUpdate(sparks, dt, 0);
      hud(level + ' / ' + g.goal + '   Moves ' + moves);
    }
    function draw() {
      clear('#06121f');
      const G = geo();
      for (let y = 0; y < N; y++) {
        for (let x = 0; x < N; x++) {
          const v = grid[y * N + x], cx = G.ox + x * G.T, cy = G.oy + y * G.T, s = G.T;
          if (v === 1) {
            rect(cx + 2, cy + 2, s - 4, s - 4, '#2b3b55', true);
            rect(cx + 2, cy + 2, s - 4, (s - 4) * .25, '#4c6286', true);
          } else {
            rect(cx + 2, cy + 2, s - 4, s - 4, v === 2 ? '#a9c7e0' : '#7fd8ff', true);
            if (v === 2) {
              for (let k = 0; k < 5; k++) {
                circle(cx + ((x * 7 + y * 13 + k * 17) % (s - 6)) + 3, cy + ((x * 5 + y * 11 + k * 29) % (s - 6)) + 3, 1.5, 'rgba(255,255,255,0.8)');
              }
            }
          }
        }
      }
      const ecx = G.ox + (ex + .5) * G.T, ecy = G.oy + (ey + .5) * G.T;
      for (let r = 3; r >= 1; r--) {
        strokeCircle(ecx, ecy, G.T * (0.1 + r * 0.12) + Math.sin(tt * 4 + r) * 2, r % 2 ? C.lime : C.cyan, 2);
      }
      const k = anim ? clamp(anim.t / 0.18, 0, 1) : 1, e = k * k * (3 - 2 * k);
      const bx = anim ? anim.x0 + (anim.x1 - anim.x0) * e : px;
      const by = anim ? anim.y0 + (anim.y1 - anim.y0) * e : py;
      const bxp = G.ox + (bx + .5) * G.T, byp = G.oy + (by + .5) * G.T;
      circle(bxp, byp, G.T * .42, 'rgba(120,220,255,0.25)');
      circle(bxp, byp, G.T * .28, '#ffffff');
      fxDraw(sparks);
    }
    return { update, draw, swipe, stop() {} };
  }

  // ---------- 4. Sentinel Steps: turn-based, sentries show their cones ----------
  function n14_sentinelsteps(g) {
    let cleared = 0, m, w, p, sentries, exitI, turns = 0, done = false, L, tt = 0;
    const sparks = [];
    const latch = stepLatch();
    const at = (x, y) => y * w + x;
    function build() {
      const n = Math.min(4 + cleared, 8);
      m = genMap(n, n); w = m.w;
      const start = w + 1, d0 = bfs(w, m.h, m.t, start).d;
      exitI = farthest(d0);
      p = { x: 1, y: 1 };
      turns = 0;
      sentries = [];
      const open = [];
      for (let i = 0; i < m.t.length; i++) if (!m.t[i] && d0[i] > 4) open.push(i);
      for (let k = 0; k < 2 + Math.min(cleared, 2) && open.length > 2; k++) {
        const wps = [pick(open), pick(open), pick(open)], route = [];
        for (let j = 0; j < 3; j++) route.push(...pathTo(bfs(w, m.h, m.t, wps[j]).prev, wps[j], wps[(j + 1) % 3]));
        if (!route.length) continue;
        const s = { x: wps[0] % w, y: Math.floor(wps[0] / w), route, ri: 0, fx: 0, fy: 1 };
        s.fx = route[0] % w - s.x; s.fy = Math.floor(route[0] / w) - s.y;
        sentries.push(s);
      }
      L = layout(m);
    }
    build();
    // tiles a sentry sees: three ahead, plus the flanks of the first two rows
    function view(s) {
      const out = [];
      for (let k = 1; k <= 3; k++) {
        const cx = s.x + s.fx * k, cy = s.y + s.fy * k;
        if (solidAt(m, cx, cy)) break;
        out.push(at(cx, cy));
        if (k <= 2) {
          for (const sd of [-1, 1]) {
            const ax = cx - s.fy * sd, ay = cy + s.fx * sd;
            if (!solidAt(m, ax, ay)) out.push(at(ax, ay));
          }
        }
      }
      return out;
    }
    const seen = () => { const pi = at(p.x, p.y); return sentries.some(s => view(s).includes(pi)); };
    function turn(dir) {
      if (done) return;
      if (dir) {
        const nx = p.x + dir[0], ny = p.y + dir[1];
        if (solidAt(m, nx, ny) || sentries.some(s => s.x === nx && s.y === ny)) { beep(160, 110, 0.06, 'square', 0.1); return; }
        p.x = nx; p.y = ny;
        if (at(p.x, p.y) === exitI) {
          cleared++;
          if (cleared >= g.goal) { done = true; completeMini(); return; }
          beep(520, 880, 0.25, 'sine', 0.2);
          build();
          return;
        }
        if (seen()) { done = true; miniFail(g, 'Spotted by a sentry.'); return; }
      }
      for (const s of sentries) {
        const t = s.route[s.ri], nx = t % w, ny = Math.floor(t / w);
        s.fx = nx - s.x; s.fy = ny - s.y;
        s.x = nx; s.y = ny;
        s.ri = (s.ri + 1) % s.route.length;
      }
      if (sentries.some(s => s.x === p.x && s.y === p.y) || seen()) { done = true; miniFail(g, 'A sentry caught you in its sight.'); return; }
      turns++;
    }
    function update(dt) {
      if (done) return;
      tt += dt;
      if (pressed('a')) turn(null);
      else { const d = latch(); if (d) turn(d); }
      fxUpdate(sparks, dt, 0);
      hud(cleared + ' / ' + g.goal + '   Turn ' + turns);
    }
    function swipe(dx, dy) { turn(swipeDir(dx, dy)); }
    function draw() {
      clear('#080a12');
      if (!m) return;
      const T = L.ts;
      for (let ty = 0; ty < m.h; ty++) {
        for (let tx = 0; tx < m.w; tx++) {
          const i = ty * w + tx, x = L.ox + tx * T, y = L.oy + ty * T;
          if (m.t[i]) { rect(x, y, T + .5, T + .5, '#262b44'); rect(x, y, T + .5, T * .2, '#363d60'); }
          else rect(x, y, T + .5, T + .5, (tx + ty) % 2 ? '#10142a' : '#0d1122');
        }
      }
      for (const s of sentries) {
        for (const i of view(s)) rect(L.ox + (i % w) * T, L.oy + Math.floor(i / w) * T, T, T, 'rgba(255,70,90,0.28)');
      }
      rect(L.ox + (exitI % w) * T + T * .2, L.oy + Math.floor(exitI / w) * T + T * .2, T * .6, T * .6, C.green, true);
      for (const s of sentries) {
        const cx = L.ox + (s.x + .5) * T, cy = L.oy + (s.y + .5) * T;
        circle(cx, cy, T * .34, '#2a1020');
        strokeCircle(cx, cy, T * .34, '#ff5570', 2);
        circle(cx + s.fx * T * .18, cy + s.fy * T * .18, T * .1, C.yellow);
      }
      const px = L.ox + (p.x + .5) * T, py = L.oy + (p.y + .5) * T;
      circle(px, py, T * .5, 'rgba(85,230,255,0.25)');
      circle(px, py, T * .3, C.cyan);
      fxDraw(sparks);
    }
    return { update, draw, swipe, stop() {} };
  }

  // ---------- 5. Lamp Breaker: stay in the dark, shatter lamps to hide ----------
  function n14_lampbreaker(g) {
    let cleared = 0, m, w, p, lamps, hunters, exitI, charges = 3, crouch = false, field = null, fieldT = 0, done = false, L, tt = 0;
    const sparks = [];
    const LR = 2.6;
    function lit(x, y, k) {
      for (const l of lamps) if (l.on && dist(x, y, l.x, l.y) < LR * k) return true;
      return false;
    }
    function hasLOS(ax, ay, bx, by) {
      const dd = dist(ax, ay, bx, by);
      for (let s = 0.4; s < dd; s += 0.3) {
        if (solidAt(m, Math.floor(ax + (bx - ax) / dd * s), Math.floor(ay + (by - ay) / dd * s))) return false;
      }
      return true;
    }
    function build() {
      const n = Math.min(5 + cleared, 9);
      m = genMap(n, n); w = m.w;
      const start = w + 1, d0 = bfs(w, m.h, m.t, start).d;
      exitI = farthest(d0);
      p = { x: 1.5, y: 1.5 };
      charges = 3; crouch = false; field = null; fieldT = 0;
      const open = [];
      for (let i = 0; i < m.t.length; i++) if (!m.t[i] && d0[i] > 3) open.push(i);
      lamps = [];
      for (let k = 0; k < 3 + Math.min(cleared, 3) && open.length; k++) {
        const i = open.splice(Math.floor(Math.random() * open.length), 1)[0];
        lamps.push({ x: i % w + .5, y: Math.floor(i / w) + .5, on: true });
      }
      const cand = open.filter(i => d0[i] > 6);
      hunters = [];
      for (let k = 0; k < Math.min(3, 1 + cleared) && cand.length > 2; k++) {
        const wps = [pick(cand), pick(cand), pick(cand)], route = [];
        for (let j = 0; j < 3; j++) route.push(...pathTo(bfs(w, m.h, m.t, wps[j]).prev, wps[j], wps[(j + 1) % 3]));
        if (!route.length) continue;
        hunters.push({ x: wps[0] % w + .5, y: Math.floor(wps[0] / w) + .5, route, ri: 0, fx: 1, fy: 0, mode: 'patrol', timer: 0, tx: undefined });
      }
      L = layout(m);
    }
    build();
    function update(dt) {
      if (done) return;
      tt += dt;
      if (pressed('b')) crouch = !crouch;
      if (pressed('a') && charges > 0) {
        let best = null, bd = 2.2;
        for (const l of lamps) {
          const dd = dist(p.x, p.y, l.x, l.y);
          if (l.on && dd < bd) { bd = dd; best = l; }
        }
        if (best) {
          best.on = false; charges--;
          fxBurst(sparks, L.ox + best.x * L.ts, L.oy + best.y * L.ts, C.orange, 26, 200);
          beep(900, 200, 0.2, 'sawtooth', 0.25);
        }
      }
      moveBody(p, AX() * 2.9 * dt, AY() * 2.9 * dt, 0.3, (x, y) => solidAt(m, x, y));
      const visible = lit(p.x, p.y, crouch ? 0.45 : 1);
      if ((fieldT -= dt) <= 0) { fieldT = 0.25; field = bfs(w, m.h, m.t, Math.floor(p.y) * w + Math.floor(p.x)).d; }
      for (const h of hunters) {
        const dd = dist(p.x, p.y, h.x, h.y);
        if (visible && dd < 7.5 && hasLOS(h.x, h.y, p.x, p.y)) {
          if (h.mode !== 'chase') { h.mode = 'chase'; h.tx = undefined; beep(200, 600, 0.3, 'sawtooth', 0.2); }
          h.timer = 2.5;
        } else if (h.mode === 'chase' && (h.timer -= dt) <= 0) {
          h.mode = 'patrol'; h.tx = undefined;
        }
        if (h.mode === 'chase') followField(h, field, m, 2.5, dt);
        else walkRoute(h, h.route, w, 1.6, dt);
        if (dist(h.x, h.y, p.x, p.y) < 0.6) { done = true; miniFail(g, 'Caught in the light.'); return; }
      }
      const ex = exitI % w + .5, ey = Math.floor(exitI / w) + .5;
      if (dist(p.x, p.y, ex, ey) < 0.6) {
        cleared++;
        if (cleared >= g.goal) { done = true; completeMini(); return; }
        beep(520, 880, 0.25, 'sine', 0.2);
        build();
        return;
      }
      fxUpdate(sparks, dt, 30);
      hud(cleared + ' / ' + g.goal + '   Lamps ' + charges + '   ' + (visible ? 'Exposed' : 'Hidden'));
    }
    function draw() {
      clear('#05050b');
      if (!m) return;
      const T = L.ts;
      for (let ty = 0; ty < m.h; ty++) {
        for (let tx = 0; tx < m.w; tx++) {
          const i = ty * w + tx, x = L.ox + tx * T, y = L.oy + ty * T;
          if (m.t[i]) { rect(x, y, T + .5, T + .5, '#1f2236'); rect(x, y, T + .5, T * .2, '#2e3350'); }
          else rect(x, y, T + .5, T + .5, '#0c0d18');
        }
      }
      rect(L.ox + (exitI % w + .2) * T, L.oy + (Math.floor(exitI / w) + .2) * T, T * .6, T * .6, C.green, true);
      ctx2d.globalCompositeOperation = 'lighter';
      for (const l of lamps) {
        const lx = L.ox + l.x * T, ly = L.oy + l.y * T;
        if (!l.on) { circle(lx, ly, T * .2, '#333'); continue; }
        const flick = 0.9 + 0.1 * Math.sin(tt * 9 + l.x * 3 + l.y);
        const rr = LR * T * flick;
        const gr = ctx2d.createRadialGradient(lx, ly, 0, lx, ly, rr);
        gr.addColorStop(0, 'rgba(255,190,90,0.38)');
        gr.addColorStop(1, 'rgba(255,190,90,0)');
        ctx2d.fillStyle = gr;
        ctx2d.fillRect(lx - rr, ly - rr, rr * 2, rr * 2);
      }
      ctx2d.globalCompositeOperation = 'source-over';
      for (const l of lamps) if (l.on) circle(L.ox + l.x * T, L.oy + l.y * T, T * .2, '#ffe0a0');
      for (const h of hunters) {
        const hx = L.ox + h.x * T, hy = L.oy + h.y * T;
        if (h.mode === 'chase') circle(hx, hy, T * .7, 'rgba(255,70,90,0.25)');
        circle(hx, hy, T * .34, '#2a0a14');
        circle(hx - T * .12, hy - T * .05, T * .07, '#ff5570');
        circle(hx + T * .12, hy - T * .05, T * .07, '#ff5570');
      }
      const visible = lit(p.x, p.y, crouch ? 0.45 : 1);
      const px = L.ox + p.x * T, py = L.oy + p.y * T, r = crouch ? T * .22 : T * .3;
      circle(px, py, r + 2, visible ? '#ff7a7a' : '#7dffb0');
      circle(px, py, r, '#e8f0ff');
      fxDraw(sparks);
    }
    return { update, draw, stop() {} };
  }

  // ---------- 6. Keyring Escape: colored doors, a warden on your trail ----------
  function n14_keyringvault(g) {
    const KC = [C.red, C.cyan, C.gold], KN = ['R', 'C', 'Y'];
    let cleared = 0, m, w, N, doors, keys, held, p, warden, field = null, fieldT = 0, exitI, start, nd, done = false, L, tt = 0;
    const sparks = [];
    const isSolid = (tx, ty) => {
      if (tx < 0 || ty < 0 || tx >= w || ty >= m.h) return true;
      const i = ty * w + tx;
      return m.t[i] === 1 || doors[i] >= 0;
    };
    function wallMask() {
      const b = new Uint8Array(N);
      for (let i = 0; i < N; i++) b[i] = (m.t[i] || doors[i] >= 0) ? 1 : 0;
      return b;
    }
    function build() {
      const n = Math.min(5 + cleared, 9);
      m = genMap(n, n); w = m.w; N = m.t.length;
      start = w + 1;
      const d0 = bfs(w, m.h, m.t, start);
      exitI = farthest(d0.d);
      const path = pathTo(d0.prev, start, exitI);
      nd = Math.min(3, 1 + cleared);
      doors = new Int8Array(N).fill(-1);
      for (let k = 0; k < nd; k++) doors[path[Math.floor(path.length * (k + 1) / (nd + 1))]] = k;
      // key k lies where it is reachable with doors 0..k-1 open, so the whole set stays solvable
      keys = []; held = [0, 0, 0];
      for (let k = 0; k < nd; k++) {
        const blk = new Uint8Array(N);
        for (let i = 0; i < N; i++) blk[i] = (m.t[i] || doors[i] >= k) ? 1 : 0;
        const r = bfs(w, m.h, blk, start).d;
        const cand = [];
        for (let i = 0; i < N; i++) if (r[i] > 0 && doors[i] < 0 && i !== exitI) cand.push(i);
        const i = pick(cand);
        keys.push({ x: i % w + .5, y: Math.floor(i / w) + .5, c: k });
      }
      const max = d0.d[exitI], far = [];
      for (let i = 0; i < N; i++) if (!m.t[i] && doors[i] < 0 && i !== exitI && d0.d[i] >= 0.6 * max) far.push(i);
      const wi = pick(far);
      warden = { x: wi % w + .5, y: Math.floor(wi / w) + .5, tx: undefined };
      p = { x: 1.5, y: 1.5 };
      field = null; fieldT = 0;
      L = layout(m);
    }
    build();
    function update(dt) {
      if (done) return;
      tt += dt;
      moveBody(p, AX() * 2.8 * dt, AY() * 2.8 * dt, 0.3, isSolid);
      for (let i = 0; i < N; i++) {
        const c = doors[i];
        if (c < 0 || held[c] <= 0) continue;
        const dx = i % w + .5, dy = Math.floor(i / w) + .5;
        if (dist(p.x, p.y, dx, dy) < 1.1) {
          doors[i] = -1; held[c]--; fieldT = 0;
          fxBurst(sparks, L.ox + dx * L.ts, L.oy + dy * L.ts, KC[c], 24, 200);
          beep(500, 800, 0.15, 'triangle', 0.25);
        }
      }
      for (let k = keys.length - 1; k >= 0; k--) {
        const key = keys[k];
        if (dist(p.x, p.y, key.x, key.y) < 0.6) {
          held[key.c]++; keys.splice(k, 1);
          fxBurst(sparks, L.ox + key.x * L.ts, L.oy + key.y * L.ts, KC[key.c], 18, 160);
          beep(700, 1000, 0.12, 'sine', 0.25);
        }
      }
      if ((fieldT -= dt) <= 0) {
        fieldT = 0.3;
        field = bfs(w, m.h, wallMask(), Math.floor(p.y) * w + Math.floor(p.x)).d;
      }
      followField(warden, field, m, 1.9, dt);
      if (dist(warden.x, warden.y, p.x, p.y) < 0.6) { done = true; miniFail(g, 'The warden caught up with you.'); return; }
      const ex = exitI % w + .5, ey = Math.floor(exitI / w) + .5;
      if (dist(p.x, p.y, ex, ey) < 0.6) {
        cleared++;
        if (cleared >= g.goal) { done = true; completeMini(); return; }
        beep(520, 880, 0.25, 'sine', 0.2);
        build();
        return;
      }
      fxUpdate(sparks, dt, 20);
      hud(cleared + ' / ' + g.goal + '   Keys ' + KN.map((n, i) => n + held[i]).join('  '));
    }
    function draw() {
      clear('#0b0a14');
      if (!m) return;
      const T = L.ts;
      for (let ty = 0; ty < m.h; ty++) {
        for (let tx = 0; tx < m.w; tx++) {
          const i = ty * w + tx, x = L.ox + tx * T, y = L.oy + ty * T;
          if (m.t[i]) { rect(x, y, T + .5, T + .5, '#2c2748'); rect(x, y, T + .5, T * .2, '#433d6b'); }
          else rect(x, y, T + .5, T + .5, (tx + ty) % 2 ? '#15132a' : '#1a1836');
        }
      }
      rect(L.ox + (exitI % w + .15) * T, L.oy + (Math.floor(exitI / w) + .15) * T, T * .7, T * .7, 'rgba(85,255,154,0.85)', true);
      for (let i = 0; i < N; i++) {
        const c = doors[i];
        if (c < 0) continue;
        const x = L.ox + (i % w) * T, y = L.oy + Math.floor(i / w) * T;
        rect(x + 2, y + 2, T - 4, T - 4, KC[c], true);
        circle(x + T / 2, y + T / 2, T * .14, 'rgba(0,0,0,0.5)');
      }
      for (const key of keys) {
        const kx = L.ox + key.x * T, ky = L.oy + key.y * T, r = T * .3, col = KC[key.c];
        circle(kx, ky, r * 1.8, 'rgba(255,255,255,0.08)');
        polygon([[kx, ky - r], [kx + r, ky], [kx, ky + r], [kx - r, ky]], col);
      }
      const wx = L.ox + warden.x * T, wy = L.oy + warden.y * T;
      circle(wx, wy, T * .4, '#3a0a14');
      strokeCircle(wx, wy, T * .4, '#ff5570', 2);
      circle(wx - T * .13, wy - T * .05, T * .07, '#ff5570');
      circle(wx + T * .13, wy - T * .05, T * .07, '#ff5570');
      const px = L.ox + p.x * T, py = L.oy + p.y * T;
      circle(px, py, T * .5, 'rgba(255,255,255,0.12)');
      circle(px, py, T * .3, '#f2f2ff');
      fxDraw(sparks);
    }
    return { update, draw, stop() {} };
  }

  // ---------- 7. Rubble Escape: dig through walls before the tunnel caves in ----------
  function n14_rubbleescape(g) {
    let cleared = 0, m, w, p, face = [1, 0], exitI, digs, timeLeft, maxT, shake = 0, done = false, L, tt = 0;
    const sparks = [];
    function build() {
      const n = Math.min(5 + cleared, 9);
      m = genMap(n, n); w = m.w;
      const start = w + 1;
      exitI = farthest(bfs(w, m.h, m.t, start).d);
      p = { x: 1.5, y: 1.5 };
      face = [1, 0];
      digs = 3;
      maxT = Math.max(35, 60 - cleared * 6);
      timeLeft = maxT;
      L = layout(m);
    }
    build();
    function doDig() {
      const tx = Math.floor(p.x) + face[0], ty = Math.floor(p.y) + face[1];
      if (tx < 1 || ty < 1 || tx > w - 2 || ty > m.h - 2) return;
      const i = ty * w + tx;
      if (!m.t[i]) return;
      if (digs <= 0) { beep(160, 110, 0.08, 'square', 0.1); return; }
      m.t[i] = 0; digs--; shake = 0.2;
      fxBurst(sparks, L.ox + (tx + .5) * L.ts, L.oy + (ty + .5) * L.ts, '#c9a577', 22, 160);
      beep(120, 60, 0.18, 'sawtooth', 0.22);
    }
    function update(dt) {
      if (done) return;
      tt += dt;
      L = layout(m);
      const ax = AX(), ay = AY();
      if (Math.abs(ax) + Math.abs(ay) > 0.2) face = Math.abs(ax) > Math.abs(ay) ? [Math.sign(ax), 0] : [0, Math.sign(ay)];
      moveBody(p, ax * 2.9 * dt, ay * 2.9 * dt, 0.3, (x, y) => solidAt(m, x, y));
      if (pressed('b')) doDig();
      shake = Math.max(0, shake - dt);
      timeLeft -= dt;
      if (timeLeft <= 0) { done = true; miniFail(g, 'The tunnel collapsed on you.'); return; }
      const ex = exitI % w + .5, ey = Math.floor(exitI / w) + .5;
      if (dist(p.x, p.y, ex, ey) < 0.6) {
        cleared++;
        if (cleared >= g.goal) { done = true; completeMini(); return; }
        beep(520, 880, 0.25, 'sine', 0.2);
        build();
        return;
      }
      fxUpdate(sparks, dt, 60);
      hud(cleared + ' / ' + g.goal + '   Digs ' + digs + '   Time ' + Math.ceil(timeLeft) + 's');
    }
    function draw() {
      clear('#120c08');
      if (!m) return;
      const T = L.ts;
      const sx = shake > 0 ? rand(-1, 1) * shake * 14 : 0, sy = shake > 0 ? rand(-1, 1) * shake * 14 : 0;
      ctx2d.save();
      ctx2d.translate(sx, sy);
      for (let ty = 0; ty < m.h; ty++) {
        for (let tx = 0; tx < m.w; tx++) {
          const i = ty * w + tx, x = L.ox + tx * T, y = L.oy + ty * T;
          if (m.t[i]) { rect(x, y, T + .5, T + .5, '#4d3a28'); rect(x, y, T + .5, T * .22, '#6e5538'); }
          else rect(x, y, T + .5, T + .5, (tx + ty) % 2 ? '#2a1f16' : '#251a12');
        }
      }
      const exX = L.ox + (exitI % w + .5) * T, exY = L.oy + (Math.floor(exitI / w) + .5) * T;
      const de = dist(p.x, p.y, exitI % w + .5, Math.floor(exitI / w) + .5);
      if (de < 5) {
        circle(exX, exY, T * .5, 'rgba(85,255,154,0.25)');
        circle(exX, exY, T * .3, C.green);
      } else {
        text('?', exX, exY + T * .15, Math.max(10, T * .6), 'rgba(85,255,154,0.35)', 'center');
      }
      const px = L.ox + p.x * T, py = L.oy + p.y * T;
      const gr = ctx2d.createRadialGradient(px, py, 0, px, py, T * 3);
      gr.addColorStop(0, 'rgba(255,200,120,0.28)');
      gr.addColorStop(1, 'rgba(255,200,120,0)');
      ctx2d.globalCompositeOperation = 'lighter';
      ctx2d.fillStyle = gr;
      ctx2d.fillRect(px - T * 3, py - T * 3, T * 6, T * 6);
      ctx2d.globalCompositeOperation = 'source-over';
      circle(px, py, T * .3, '#ffe2b0');
      line(px, py, px + face[0] * T * .7, py + face[1] * T * .7, C.yellow, 2);
      fxDraw(sparks);
      ctx2d.restore();
      rect(20, H() - 140, W() - 40, 6, '#2a1c10', true);
      rect(20, H() - 140, (W() - 40) * clamp(timeLeft / maxT, 0, 1), 6, timeLeft < 10 ? C.red : C.orange, true);
    }
    return { update, draw, stop() {} };
  }

  // ---------- 8. Crumbling Corridor: floors collapse behind you, rewind to recover ----------
  function n14_crumblepath(g) {
    let cleared = 0, m, w, p, crumb, hist, exitI, rewinds, anim = null, stuck = false, done = false, L, tt = 0;
    const sparks = [];
    const latch = stepLatch();
    function build() {
      const n = Math.min(3 + cleared, 6);
      m = genMap(n, n); w = m.w;
      const start = w + 1;
      exitI = farthest(bfs(w, m.h, m.t, start).d);
      p = { x: 1, y: 1 };
      crumb = new Uint8Array(m.t.length);
      hist = [];
      rewinds = 5; anim = null; stuck = false;
      L = layout(m);
    }
    build();
    const canStep = (x, y) => !solidAt(m, x, y) && !crumb[y * w + x];
    const canMove = () => DIRS.some(([dx, dy]) => canStep(p.x + dx, p.y + dy));
    function step(dx, dy) {
      if (anim || done) return;
      const nx = p.x + dx, ny = p.y + dy;
      if (!canStep(nx, ny)) { beep(160, 110, 0.06, 'square', 0.1); return; }
      const from = p.y * w + p.x;
      crumb[from] = 1;
      hist.push(from);
      anim = { x0: p.x, y0: p.y, x1: nx, y1: ny, t: 0 };
      p = { x: nx, y: ny };
      fxBurst(sparks, L.ox + (from % w + .5) * L.ts, L.oy + (Math.floor(from / w) + .5) * L.ts, C.orange, 10, 90);
      beep(260, 200, 0.05, 'triangle', 0.12);
    }
    // undoes the last step: the tile you came from is solid again
    function rewind() {
      if (anim || done || !hist.length || rewinds <= 0) return;
      const prev = hist.pop();
      rewinds--;
      crumb[prev] = 0;
      anim = { x0: p.x, y0: p.y, x1: prev % w, y1: Math.floor(prev / w), t: 0 };
      p = { x: prev % w, y: Math.floor(prev / w) };
      beep(500, 700, 0.12, 'sine', 0.15);
    }
    function update(dt) {
      if (done) return;
      tt += dt;
      L = layout(m);
      if (anim) { anim.t += dt; if (anim.t >= 0.12) anim = null; }
      const ex = exitI % w, ey = Math.floor(exitI / w);
      if (!anim && p.x === ex && p.y === ey) {
        cleared++;
        if (cleared >= g.goal) { done = true; completeMini(); return; }
        beep(520, 880, 0.25, 'sine', 0.2);
        build();
        return;
      }
      if (!anim) {
        if (pressed('a')) rewind();
        else { const d = latch(); if (d) step(d[0], d[1]); }
      }
      if (!anim) {
        stuck = !canMove();
        if (stuck && rewinds <= 0) { done = true; miniFail(g, 'Trapped. The floor gave way beneath you.'); return; }
      }
      fxUpdate(sparks, dt, 40);
      hud(cleared + ' / ' + g.goal + '   Rewinds ' + rewinds);
    }
    function draw() {
      clear('#0a0d14');
      if (!m) return;
      const T = L.ts;
      for (let ty = 0; ty < m.h; ty++) {
        for (let tx = 0; tx < m.w; tx++) {
          const i = ty * w + tx, x = L.ox + tx * T, y = L.oy + ty * T;
          if (m.t[i]) { rect(x, y, T + .5, T + .5, '#161a26'); continue; }
          if (crumb[i]) {
            rect(x + 1, y + 1, T - 2, T - 2, '#05060a');
            line(x + T * .2, y + T * .3, x + T * .5, y + T * .6, '#1e2433', 1);
            line(x + T * .6, y + T * .25, x + T * .75, y + T * .7, '#1e2433', 1);
          } else {
            rect(x + 1, y + 1, T - 2, T - 2, '#3b4a66', true);
            rect(x + 1, y + 1, T - 2, (T - 2) * .2, '#58698a', true);
          }
        }
      }
      const ecx = L.ox + (exitI % w + .5) * T, ecy = L.oy + (Math.floor(exitI / w) + .5) * T;
      const pulse = 0.5 + 0.5 * Math.sin(tt * 4);
      circle(ecx, ecy, T * (0.35 + 0.1 * pulse), 'rgba(85,255,154,0.3)');
      strokeCircle(ecx, ecy, T * 0.3, C.green, 2);
      const k = anim ? clamp(anim.t / 0.12, 0, 1) : 1;
      const bx = anim ? anim.x0 + (anim.x1 - anim.x0) * k : p.x;
      const by = anim ? anim.y0 + (anim.y1 - anim.y0) * k : p.y;
      const px = L.ox + (bx + .5) * T, py = L.oy + (by + .5) * T;
      circle(px, py, T * .45, 'rgba(255,160,90,0.25)');
      circle(px, py, T * .28, '#ffe0c0');
      if (stuck && !anim) text('Dead end', W() / 2, H() - 150, 16, C.orange, 'center', 900);
      fxDraw(sparks);
    }
    return { update, draw, stop() {} };
  }

  return {
    engines: {
      n14_lanternrun, n14_velvetvault, n14_glacierslip, n14_sentinelsteps,
      n14_lampbreaker, n14_keyringvault, n14_rubbleescape, n14_crumblepath
    },
    minis: [
      { id: 'n14_lantern', title: 'Lantern Labyrinth', icon: '🏮', cat: 'ACTION', desc: 'A dark maze that only your lantern reveals. Oil drains by the second: pick up flasks, find the green exit, and go deeper.', engine: 'n14_lanternrun', goal: 3 },
      { id: 'n14_velvet', title: 'Velvet Vault', icon: '🧤', cat: 'ACTION', desc: 'Slip past guards with cones of sight. Grab the golden relic, then escape before the alarm meter fills.', engine: 'n14_velvetvault', goal: 3 },
      { id: 'n14_glacier', title: 'Glacier Slip', icon: '🧊', cat: 'PUZZLE', desc: 'Swipe to slide across the ice. Slides stop only at rock, rough snow or the portal. Reach the portal within your move budget.', engine: 'n14_glacierslip', goal: 4 },
      { id: 'n14_sentinel', title: 'Sentinel Steps', icon: '👁️', cat: 'PUZZLE', desc: 'Turn-based stealth. Sentries show their red sight cones, and every step you take moves them too. Reach the exit unseen.', engine: 'n14_sentinelsteps', goal: 3 },
      { id: 'n14_lampbreaker', title: 'Lamp Breaker', icon: '💡', cat: 'ACTION', desc: 'Lamps expose you to hunters. Shatter them to slip into the dark, crouch to shrink your silhouette, and reach the exit alive.', engine: 'n14_lampbreaker', goal: 3 },
      { id: 'n14_keyring', title: 'Keyring Escape', icon: '🗝️', cat: 'PUZZLE', desc: 'Colored doors bar the way and each key opens one door. A warden follows your trail, so plan the route and keep moving.', engine: 'n14_keyringvault', goal: 3 },
      { id: 'n14_rubble', title: 'Rubble Escape', icon: '⛏️', cat: 'ACTION', desc: 'Dig through the walls with your last charges and race a collapsing tunnel. Find the exit before the timer runs out.', engine: 'n14_rubbleescape', goal: 3 },
      { id: 'n14_crumble', title: 'Crumbling Corridor', icon: '🪨', cat: 'PUZZLE', desc: 'Every floor tile crumbles the moment you leave it. Pick the right path, and use rewinds to undo a wrong turn.', engine: 'n14_crumblepath', goal: 4 }
    ],
    aaa: []
  };
})();
