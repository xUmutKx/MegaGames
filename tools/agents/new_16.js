window.__AG_new_16 = (function () {
  const GEM = ['#ff5570', '#55e6ff', '#ffe36e', '#55ff9a', '#a978ff', '#ff914d', '#4da3ff', '#ff4fd8'];
  const TOP = 110, BOT = 120;

  // ---------- shared helpers ----------
  function grid2(cols, rows, top, bottom) {
    const b = bottom === undefined ? BOT : bottom;
    const cs = Math.floor(Math.min((W() - 24) / cols, (H() - b - top) / rows));
    return { cs: cs, cols: cols, rows: rows, ox: Math.floor((W() - cs * cols) / 2), oy: top };
  }
  function hitCell(L, x, y) {
    const c = Math.floor((x - L.ox) / L.cs), r = Math.floor((y - L.oy) / L.cs);
    return (r < 0 || c < 0 || r >= L.rows || c >= L.cols) ? null : [r, c];
  }
  function rrect(x, y, w, h, r, fill) {
    const c = ctx2d;
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
    c.fillStyle = fill; c.fill();
  }
  function bg(h1, h2) {
    const g = ctx2d.createLinearGradient(0, 0, 0, H());
    g.addColorStop(0, h1); g.addColorStop(1, h2);
    ctx2d.fillStyle = g; ctx2d.fillRect(0, 0, W(), H());
  }
  function shakeOn(s) { if (s > 0.2) ctx2d.translate(rand(-s, s), rand(-s, s)); }
  function panel(L, tint) { rrect(L.ox - 6, L.oy - 6, L.cs * L.cols + 12, L.cs * L.rows + 12, 12, tint); }
  function tile(x, y, s, col) {
    const g = ctx2d.createLinearGradient(x, y, x, y + s);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.3, col); g.addColorStop(1, '#0a0c18');
    rrect(x + 1, y + 1, s - 2, s - 2, Math.max(3, s * 0.18), g);
  }
  function gemDraw(x, y, r, t) {
    const c = ctx2d, col = GEM[t % GEM.length], k = t % 6;
    const g = c.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r * 1.05);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.3, col); g.addColorStop(1, '#0a0c18');
    c.fillStyle = g; c.beginPath();
    if (k === 0) c.arc(x, y, r, 0, 6.2832);
    else if (k === 1) { c.moveTo(x, y - r); c.lineTo(x + r * 0.9, y); c.lineTo(x, y + r); c.lineTo(x - r * 0.9, y); c.closePath(); }
    else if (k === 2) c.rect(x - r * 0.8, y - r * 0.8, r * 1.6, r * 1.6);
    else if (k === 3) { c.moveTo(x, y - r); c.lineTo(x + r * 0.9, y + r * 0.7); c.lineTo(x - r * 0.9, y + r * 0.7); c.closePath(); }
    else if (k === 4) { for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + 0.5; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } c.closePath(); }
    else { for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6, q = i % 2 ? r * 0.55 : r; c.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); } c.closePath(); }
    c.fill();
    c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.arc(x - r * 0.3, y - r * 0.35, r * 0.16, 0, 6.2832); c.fill();
  }
  function popAdd(list, str, x, y, col, size) { list.push({ str: str, x: x, y: y, col: col, size: size || 16, life: 1 }); }
  function popUpdate(list, dt) {
    for (let i = list.length - 1; i >= 0; i--) { const p = list[i]; p.y -= 34 * dt; p.life -= dt * 1.1; if (p.life <= 0) list.splice(i, 1); }
  }
  function popDraw(list) {
    ctx2d.save();
    for (const p of list) { ctx2d.globalAlpha = clamp(p.life, 0, 1); text(p.str, p.x, p.y, p.size, p.col, 'center', 900); }
    ctx2d.restore();
  }
  function decay(a, k) { for (let i = 0; i < a.length; i++) { a[i] *= k; if (Math.abs(a[i]) < 0.01) a[i] = 0; } }
  function rotCells(cells) {
    const r = cells.map(function (p) { return [-p[1], p[0]]; });
    const mx = Math.min.apply(null, r.map(function (p) { return p[0]; })), my = Math.min.apply(null, r.map(function (p) { return p[1]; }));
    return r.map(function (p) { return [p[0] - mx, p[1] - my]; });
  }
  function fallSpeed(base, min, k, lines) { return Math.max(min, base - lines * k); }

  // ---------- 1. Prism Swap: swap neighbours to make lines of three ----------
  function gamePrism(g) {
    const COLS = 7, ROWS = 8, NT = 5, SWAPS = 34;
    const G = [], OFF = [];
    let sel = null, down = null, over = false, swaps = SWAPS, gems = 0, shake = 0, fx = [], pops = [];
    for (let r = 0; r < ROWS; r++) { G.push([]); OFF.push(new Array(COLS).fill(0)); for (let c = 0; c < COLS; c++) G[r].push(randi(0, NT - 1)); }
    const L = function () { return grid2(COLS, ROWS, TOP + 6); };
    const at = function (p) { const l = L(); return { x: l.ox + p[1] * l.cs + l.cs / 2, y: l.oy + (p[0] + 0.5) * l.cs }; };
    function matchSet() {
      const s = new Set();
      for (let r = 0; r < ROWS; r++) {
        let run = 1;
        for (let c = 1; c <= COLS; c++) {
          if (c < COLS && G[r][c] >= 0 && G[r][c] === G[r][c - 1]) run++;
          else { if (run >= 3) for (let k = c - run; k < c; k++) s.add(r * COLS + k); run = 1; }
        }
      }
      for (let c = 0; c < COLS; c++) {
        let run = 1;
        for (let r = 1; r <= ROWS; r++) {
          if (r < ROWS && G[r][c] >= 0 && G[r][c] === G[r - 1][c]) run++;
          else { if (run >= 3) for (let k = r - run; k < r; k++) s.add(k * COLS + c); run = 1; }
        }
      }
      return s;
    }
    function sw(a, b) { const t = G[a[0]][a[1]]; G[a[0]][a[1]] = G[b[0]][b[1]]; G[b[0]][b[1]] = t; }
    function hasMove() {
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const qs = [[r, c + 1], [r + 1, c]];
        for (const q of qs) {
          if (q[0] >= ROWS || q[1] >= COLS) continue;
          sw([r, c], q); const ok = matchSet().size > 0; sw([r, c], q);
          if (ok) return true;
        }
      }
      return false;
    }
    function reshuffle() {
      for (let n = 0; n < 400; n++) {
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) G[r][c] = randi(0, NT - 1);
        if (!matchSet().size && hasMove()) return;
      }
    }
    function cascade() {
      let chain = 0;
      for (;;) {
        const s = matchSet();
        if (!s.size) break;
        chain++;
        s.forEach(function (k) {
          const r = Math.floor(k / COLS), c = k % COLS, p = at([r, c]);
          fxBurst(fx, p.x, p.y, GEM[G[r][c] % GEM.length], 7, 170);
          G[r][c] = -1;
        });
        gems += s.size;
        shake = Math.min(10, shake + 2 + chain);
        if (chain > 1) popAdd(pops, 'CHAIN x' + chain, W() / 2, H() * 0.45, C.gold, 22);
        beep(480 + chain * 90, 720 + chain * 110, 0.1, 'square', 0.05);
        for (let c = 0; c < COLS; c++) {
          let e = 0;
          for (let r = ROWS - 1; r >= 0; r--) {
            if (G[r][c] < 0) { e++; continue; }
            if (e) { G[r + e][c] = G[r][c]; G[r][c] = -1; OFF[r + e][c] = -e; }
          }
          for (let r = 0; r < e; r++) { G[r][c] = randi(0, NT - 1); OFF[r][c] = -e; }
        }
      }
      return chain;
    }
    function trySwap(a, b) {
      sw(a, b);
      if (!matchSet().size) { sw(a, b); shake = 3; beep(170, 110, 0.08, 'sawtooth', 0.05); return; }
      swaps--;
      cascade();
      if (!hasMove()) { reshuffle(); popAdd(pops, 'SHUFFLE', W() / 2, H() * 0.6, C.cyan, 18); }
    }
    function busy() { for (const row of OFF) for (const v of row) if (Math.abs(v) > 0.05) return true; return false; }
    function cellAt(x, y) { return hitCell(L(), x, y); }
    function adjacent(a, b) { return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) === 1; }
    function neighbour(p, dx, dy) {
      let r = p[0], c = p[1];
      if (Math.abs(dx) > Math.abs(dy)) c += dx > 0 ? 1 : -1; else r += dy > 0 ? 1 : -1;
      return (r < 0 || c < 0 || r >= ROWS || c >= COLS) ? null : [r, c];
    }
    reshuffle();
    return {
      update(dt) {
        shake = Math.max(0, shake - dt * 30);
        for (const row of OFF) decay(row, Math.exp(-dt * 12));
        fxUpdate(fx, dt, 260); popUpdate(pops, dt);
        if (over) return;
        if (gems >= g.goal) { over = true; completeMini(); return; }
        if (swaps <= 0 && !busy()) { over = true; miniFail(g, 'No swaps left'); return; }
        hud('Gems ' + gems + '/' + g.goal + ' | Swaps ' + swaps);
      },
      pointer(x, y) {
        if (over || busy()) return;
        const p = cellAt(x, y);
        if (!p) return;
        if (sel && adjacent(sel, p)) { const a = sel; sel = null; down = null; trySwap(a, p); }
        else { sel = p; down = p; }
      },
      swipe(dx, dy) {
        if (over || !down) return;
        const a = down, q = neighbour(down, dx, dy);
        down = null; sel = null;
        if (q && !busy()) trySwap(a, q);
      },
      draw() {
        bg('#0d0a24', '#24082e');
        const l = L(), cs = l.cs;
        ctx2d.save(); shakeOn(shake);
        panel(l, 'rgba(140,110,255,.10)');
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
          rrect(l.ox + c * cs + 2, l.oy + r * cs + 2, cs - 4, cs - 4, 8, (r + c) % 2 ? 'rgba(255,255,255,.035)' : 'rgba(255,255,255,.06)');
        }
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
          if (G[r][c] < 0) continue;
          gemDraw(l.ox + c * cs + cs / 2, l.oy + (r + 0.5 + OFF[r][c]) * cs, cs * 0.38, G[r][c]);
        }
        if (sel && !over) { const p = at(sel); strokeCircle(p.x, p.y, cs * 0.46, C.white, 3); }
        fxDraw(fx); popDraw(pops);
        ctx2d.restore();
      },
      stop() {}
    };
  }

  // ---------- 2. Twin Drop: drop pairs, pop groups of four ----------
  function gameTwin(g) {
    const COLS = 6, ROWS = 12, NT = 4;
    const DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];
    const B = [], OFF = [];
    for (let r = 0; r < ROWS; r++) { B.push(new Array(COLS).fill(-1)); OFF.push(new Array(COLS).fill(0)); }
    let cur = null, nxt = null, over = false, shake = 0, fx = [], pops = [];
    let fallT = 0, moveT = 0, prevAx = 0, popped = 0;
    const L = function () { return grid2(COLS, ROWS, 128); };
    const rc = function () { return randi(0, NT - 1); };
    function free(x, y) { if (x < 0 || x >= COLS || y >= ROWS) return false; return y < 0 || B[y][x] < 0; }
    function fits(x, y, rot) { return free(x, y) && free(x + DX[rot], y + DY[rot]); }
    function settle() {
      for (let c = 0; c < COLS; c++) {
        let e = 0;
        for (let r = ROWS - 1; r >= 0; r--) {
          if (B[r][c] < 0) { e++; continue; }
          if (e) { B[r + e][c] = B[r][c]; B[r][c] = -1; OFF[r + e][c] = -e; }
        }
      }
    }
    function findGroups() {
      const seen = new Set(), out = [];
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        if (B[r][c] < 0 || seen.has(r * COLS + c)) continue;
        const col = B[r][c], comp = [], st = [[r, c]];
        seen.add(r * COLS + c);
        while (st.length) {
          const p = st.pop(); comp.push(p);
          for (const d of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const ny = p[0] + d[0], nx = p[1] + d[1];
            if (ny < 0 || nx < 0 || ny >= ROWS || nx >= COLS) continue;
            const k = ny * COLS + nx;
            if (seen.has(k) || B[ny][nx] !== col) continue;
            seen.add(k); st.push([ny, nx]);
          }
        }
        if (comp.length >= 4) for (const q of comp) out.push(q);
      }
      return out;
    }
    function resolve() {
      let chain = 0;
      settle();
      for (;;) {
        const grp = findGroups();
        if (!grp.length) break;
        chain++;
        for (const p of grp) {
          const l = L(), x = l.ox + p[1] * l.cs + l.cs / 2, y = l.oy + (p[0] + 0.5) * l.cs;
          fxBurst(fx, x, y, GEM[B[p[0]][p[1]] % GEM.length], 9, 180);
          B[p[0]][p[1]] = -1;
        }
        popped += grp.length;
        shake = Math.min(10, shake + 2 + chain);
        beep(420 + chain * 100, 640 + chain * 120, 0.12, 'square', 0.05);
        if (chain > 1) popAdd(pops, 'CHAIN x' + chain, W() / 2, H() * 0.5, C.gold, 22);
        settle();
      }
    }
    function lock() {
      const s2x = cur.x + DX[cur.rot], s2y = cur.y + DY[cur.rot];
      if (cur.y < 0 || s2y < 0) { over = true; miniFail(g, 'The well overflowed'); return; }
      B[cur.y][cur.x] = cur.a; B[s2y][s2x] = cur.b;
      cur = null;
      resolve();
    }
    function tryShift(dir) { if (fits(cur.x + dir, cur.y, cur.rot)) cur.x += dir; }
    function rotate() {
      const nr = (cur.rot + 1) % 4;
      for (const k of [0, -1, 1]) if (fits(cur.x + k, cur.y, nr)) { cur.x += k; cur.rot = nr; return; }
    }
    function busy() { for (const row of OFF) for (const v of row) if (Math.abs(v) > 0.05) return true; return false; }
    function spawn() {
      const a = nxt ? nxt.a : rc(), b = nxt ? nxt.b : rc();
      nxt = { a: rc(), b: rc() };
      cur = { x: 2, y: 1, rot: 0, a: a, b: b };
      fallT = 0;
      if (!fits(cur.x, cur.y, cur.rot)) { over = true; miniFail(g, 'The well overflowed'); }
    }
    spawn();
    return {
      update(dt) {
        shake = Math.max(0, shake - dt * 30);
        for (const row of OFF) decay(row, Math.exp(-dt * 14));
        fxUpdate(fx, dt, 200); popUpdate(pops, dt);
        if (over) return;
        if (popped >= g.goal) { over = true; completeMini(); return; }
        if (busy()) { hud('Popped ' + popped + '/' + g.goal); return; }
        if (!cur) { spawn(); if (over) return; }
        const ax = AX();
        if (ax !== 0) {
          if (ax !== prevAx) { tryShift(ax > 0 ? 1 : -1); moveT = 0.2; }
          else { moveT -= dt; if (moveT <= 0) { tryShift(ax > 0 ? 1 : -1); moveT = 0.09; } }
        } else moveT = 0;
        prevAx = ax;
        if (pressed('a')) rotate();
        if (pressed('b')) {
          while (fits(cur.x, cur.y + 1, cur.rot)) cur.y++;
          lock(); return;
        }
        fallT += dt;
        const sp = AY() > 0.5 ? 0.04 : fallSpeed(0.85, 0.35, 0.004, popped);
        if (fallT >= sp) {
          fallT = 0;
          if (fits(cur.x, cur.y + 1, cur.rot)) cur.y++;
          else { lock(); return; }
        }
        hud('Popped ' + popped + '/' + g.goal);
      },
      draw() {
        bg('#06142a', '#0c0624');
        const l = L(), cs = l.cs;
        ctx2d.save(); shakeOn(shake);
        panel(l, 'rgba(90,160,255,.10)');
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
          rrect(l.ox + c * cs + 2, l.oy + r * cs + 2, cs - 4, cs - 4, 6, 'rgba(255,255,255,.03)');
        }
        if (cur) {
          let gy = cur.y;
          while (fits(cur.x, gy + 1, cur.rot)) gy++;
          ctx2d.globalAlpha = 0.22;
          const gx1 = l.ox + cur.x * cs + cs / 2, gx2 = l.ox + (cur.x + DX[cur.rot]) * cs + cs / 2;
          gemDraw(gx1, l.oy + (gy + 0.5) * cs, cs * 0.36, cur.a);
          gemDraw(gx2, l.oy + (gy + DY[cur.rot] + 0.5) * cs, cs * 0.36, cur.b);
          ctx2d.globalAlpha = 1;
        }
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
          if (B[r][c] < 0) continue;
          gemDraw(l.ox + c * cs + cs / 2, l.oy + (r + 0.5 + OFF[r][c]) * cs, cs * 0.38, B[r][c]);
        }
        if (cur) {
          const x1 = l.ox + cur.x * cs + cs / 2, y1 = l.oy + (cur.y + 0.5) * cs;
          const x2 = l.ox + (cur.x + DX[cur.rot]) * cs + cs / 2, y2 = l.oy + (cur.y + DY[cur.rot] + 0.5) * cs;
          gemDraw(x1, y1, cs * 0.38, cur.a);
          gemDraw(x2, y2, cs * 0.38, cur.b);
        }
        if (nxt && l.ox > 40) {
          text('NEXT', l.ox / 2, l.oy + 14, 12, C.gold, 'center', 800);
          gemDraw(l.ox / 2, l.oy + 40, 11, nxt.a);
          gemDraw(l.ox / 2, l.oy + 62, 11, nxt.b);
        }
        fxDraw(fx); popDraw(pops);
        ctx2d.restore();
      },
      stop() {}
    };
  }

  // ---------- 3. Glacier Glide: slide until something stops you ----------
  function gameGlacier(g) {
    const COLS = 7, ROWS = 9;
    let T = [], px = 3, py = ROWS - 1, moves = 26, got = 0, over = false, anim = null, shake = 0, fx = [], pops = [];
    const L = function () { return grid2(COLS, ROWS, TOP + 14, 130); };
    const cellXY = function (c, r) { const l = L(); return { x: l.ox + c * l.cs + l.cs / 2, y: l.oy + (r + 0.5) * l.cs }; };
    function gen() {
      T = [];
      for (let r = 0; r < ROWS; r++) {
        T.push([]);
        for (let c = 0; c < COLS; c++) { const q = Math.random(); T[r].push(q < 0.17 ? 1 : q < 0.40 ? 2 : q < 0.45 ? 3 : 0); }
      }
      T[py][px] = 0;
      let n = 0;
      for (const row of T) for (const v of row) if (v === 2) n++;
      for (let tries = 0; n < g.goal && tries < 800; tries++) {
        const r = randi(0, ROWS - 1), c = randi(0, COLS - 1);
        if (T[r][c] === 0 && !(r === py && c === px)) { T[r][c] = 2; n++; }
      }
    }
    function runLen(dx, dy) {
      let x = px, y = py, n = 0;
      for (;;) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS || T[ny][nx] === 1) break;
        x = nx; y = ny; n++;
      }
      return n;
    }
    function slide(dx, dy) {
      if (over || anim) return;
      const path = [];
      let x = px, y = py;
      for (;;) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS || T[ny][nx] === 1) break;
        x = nx; y = ny; path.push([x, y]);
      }
      if (!path.length) { shake = 2; beep(180, 120, 0.06, 'sawtooth', 0.04); return; }
      for (const p of path) {
        const v = T[p[1]][p[0]], q = cellXY(p[0], p[1]);
        if (v === 2) { got++; T[p[1]][p[0]] = 0; popAdd(pops, '+1', q.x, q.y, C.gold, 16); fxBurst(fx, q.x, q.y, C.gold, 8, 140); }
        else if (v === 3) { moves++; T[p[1]][p[0]] = 0; popAdd(pops, '+1 MOVE', q.x, q.y, C.cyan, 15); fxBurst(fx, q.x, q.y, C.cyan, 8, 140); }
        else fxBurst(fx, q.x, q.y, '#cfefff', 2, 60);
      }
      moves--;
      anim = { sx: px, sy: py, ex: x, ey: y, t: 0, dur: Math.min(0.45, 0.04 * path.length + 0.08) };
      px = x; py = y;
      shake = 3;
      beep(260, 140, 0.1, 'triangle', 0.05);
    }
    function afterSlide() {
      if (got >= g.goal) { over = true; completeMini(); return; }
      if (moves <= 0) { over = true; miniFail(g, 'Out of moves'); return; }
      if (runLen(1, 0) + runLen(-1, 0) + runLen(0, 1) + runLen(0, -1) === 0) {
        const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        for (const d of dirs) {
          const x = px + d[0], y = py + d[1];
          if (x >= 0 && y >= 0 && x < COLS && y < ROWS && T[y][x] === 1) { T[y][x] = 0; break; }
        }
      }
    }
    gen();
    return {
      update(dt) {
        shake = Math.max(0, shake - dt * 30);
        if (anim) {
          anim.t += dt;
          if (anim.t >= anim.dur) { anim = null; afterSlide(); }
        }
        fxUpdate(fx, dt, 0); popUpdate(pops, dt);
        if (over) return;
        hud('Gems ' + got + '/' + g.goal + ' | Moves ' + moves);
      },
      pointer(x, y) {
        if (over || anim) return;
        const l = L(), hc = hitCell(l, x, y);
        if (!hc) return;
        const dx = hc[1] - px, dy = hc[0] - py;
        if (dx === 0 && dy === 0) return;
        if (Math.abs(dx) > Math.abs(dy)) slide(dx > 0 ? 1 : -1, 0); else slide(0, dy > 0 ? 1 : -1);
      },
      swipe(dx, dy) {
        if (Math.abs(dx) > Math.abs(dy)) slide(dx > 0 ? 1 : -1, 0); else slide(0, dy > 0 ? 1 : -1);
      },
      draw() {
        bg('#0a2236', '#06101c');
        const l = L(), cs = l.cs;
        ctx2d.save(); shakeOn(shake);
        panel(l, 'rgba(160,220,255,.08)');
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
          const v = T[r][c], x = l.ox + c * cs, y = l.oy + r * cs;
          if (v === 1) {
            rrect(x + 3, y + 3, cs - 6, cs - 6, cs * 0.3, '#3a4a66');
            rrect(x + 7, y + 7, cs - 14, cs - 14, cs * 0.22, '#56698a');
          } else {
            const gr = ctx2d.createLinearGradient(x, y, x + cs, y + cs);
            gr.addColorStop(0, '#e6f8ff'); gr.addColorStop(0.5, '#8fd3f5'); gr.addColorStop(1, '#3c8fc9');
            rrect(x + 2, y + 2, cs - 4, cs - 4, cs * 0.2, gr);
            if ((r * 7 + c * 13) % 5 === 0) {
              line(x + cs * 0.2, y + cs * 0.3, x + cs * 0.5, y + cs * 0.45, 'rgba(255,255,255,.7)', 1.5);
              line(x + cs * 0.5, y + cs * 0.45, x + cs * 0.8, y + cs * 0.35, 'rgba(255,255,255,.5)', 1);
            }
            if (v === 2) gemDraw(x + cs / 2, y + cs / 2, cs * 0.3, 1);
            if (v === 3) {
              for (let k = 0; k < 3; k++) {
                const a = k * Math.PI / 3, ox = x + cs / 2, oy = y + cs / 2, rr2 = cs * 0.32;
                line(ox - Math.cos(a) * rr2, oy - Math.sin(a) * rr2, ox + Math.cos(a) * rr2, oy + Math.sin(a) * rr2, '#ffffff', 2);
              }
            }
          }
        }
        let dxp = px, dyp = py;
        if (anim) {
          const e = anim.t / anim.dur, k = e >= 1 ? 1 : 1 - Math.pow(1 - e, 3);
          dxp = anim.sx + (anim.ex - anim.sx) * k;
          dyp = anim.sy + (anim.ey - anim.sy) * k;
        }
        const pc = { x: l.ox + dxp * cs + cs / 2, y: l.oy + dyp * cs + cs / 2 };
        circle(pc.x, pc.y, cs * 0.55, 'rgba(120,220,255,.18)');
        text('\u{1F427}', pc.x, pc.y + cs * 0.22, cs * 0.7, '#ffffff', 'center', 400);
        fxDraw(fx); popDraw(pops);
        ctx2d.restore();
      },
      stop() {}
    };
  }

  // ---------- 4. Lantern Flip: lights-out with lanterns ----------
  function gameLantern(g) {
    let n = 3, lit = [], pulse = [], lv = 0, taps = 0, budget = 0, over = false, shake = 0, fx = [], pops = [];
    const L = function () { return grid2(n, n, 130, 150); };
    function flip(r, c) {
      if (r < 0 || c < 0 || r >= n || c >= n) return;
      const i = r * n + c; lit[i] = !lit[i]; pulse[i] = 1;
    }
    function press(r, c) { flip(r, c); flip(r - 1, c); flip(r + 1, c); flip(r, c - 1); flip(r, c + 1); }
    function level() {
      n = Math.min(3 + Math.floor(lv / 2), 6);
      lit = new Array(n * n).fill(false); pulse = new Array(n * n).fill(0);
      const presses = n + Math.floor(lv / 2);
      do {
        lit.fill(false);
        for (let i = 0; i < presses; i++) press(randi(0, n - 1), randi(0, n - 1));
      } while (!lit.some(function (v) { return v; }));
      taps = 0; budget = presses * 2 + 4;
    }
    level();
    return {
      update(dt) {
        shake = Math.max(0, shake - dt * 30);
        decay(pulse, Math.exp(-dt * 7));
        fxUpdate(fx, dt, 0); popUpdate(pops, dt);
        if (over) return;
        hud('Lanterns ' + lv + '/' + g.goal + ' | Taps left ' + (budget - taps));
      },
      pointer(x, y) {
        if (over) return;
        const hc = hitCell(L(), x, y);
        if (!hc) return;
        press(hc[0], hc[1]);
        taps++; shake = 1.5;
        beep(640 + Math.random() * 120, 900, 0.07, 'sine', 0.05);
        if (!lit.some(function (v) { return v; })) {
          lv++;
          const l = L(), cx = l.ox + l.cs * n / 2, cy = l.oy + l.cs * n / 2;
          fxBurst(fx, cx, cy, C.gold, 24, 220);
          popAdd(pops, 'LIT!', W() / 2, H() * 0.7, C.gold, 22);
          beep(520, 1040, 0.25, 'triangle', 0.07);
          if (lv >= g.goal) { over = true; completeMini(); return; }
          level();
        } else if (taps >= budget) {
          over = true; miniFail(g, 'Out of taps');
        }
      },
      draw() {
        bg('#1a0e08', '#07030a');
        const l = L(), cs = l.cs;
        ctx2d.save(); shakeOn(shake);
        panel(l, 'rgba(255,170,80,.07)');
        for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
          const i = r * n + c, x = l.ox + c * cs + cs / 2, y = l.oy + r * cs + cs / 2, R = cs * 0.36;
          if (lit[i]) {
            circle(x, y, R * 1.9, 'rgba(255,190,90,.12)');
            circle(x, y, R * 1.35, 'rgba(255,190,90,.22)');
            const gr = ctx2d.createRadialGradient(x, y - R * 0.2, R * 0.1, x, y, R);
            gr.addColorStop(0, '#fffbe0'); gr.addColorStop(0.5, '#ffc857'); gr.addColorStop(1, '#c25a14');
            circle(x, y, R, gr);
            rrect(x - R * 0.3, y - R * 1.25, R * 0.6, R * 0.3, 3, '#3b2412');
          } else {
            circle(x, y, R, '#1b1a2e');
            strokeCircle(x, y, R, '#2d2a48', 2);
          }
          if (pulse[i] > 0.01) strokeCircle(x, y, R * (1 + pulse[i] * 0.4), 'rgba(255,255,255,' + (pulse[i] * 0.5).toFixed(2) + ')', 2);
        }
        fxDraw(fx); popDraw(pops);
        ctx2d.restore();
      },
      stop() {}
    };
  }

  // ---------- 5. Shard Stack: falling pentomino pieces, hold and ghost ----------
  const SHAPES = [
    [[1, 0], [2, 0], [0, 1], [1, 1], [1, 2]],
    [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]],
    [[0, 0], [0, 1], [0, 2], [0, 3], [1, 3]],
    [[1, 0], [1, 1], [0, 2], [1, 2], [0, 3]],
    [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2]],
    [[0, 0], [1, 0], [2, 0], [1, 1], [1, 2]],
    [[0, 0], [2, 0], [0, 1], [1, 1], [2, 1]],
    [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2]],
    [[0, 0], [0, 1], [1, 1], [1, 2], [2, 2]],
    [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]],
    [[1, 0], [0, 1], [1, 1], [1, 2], [1, 3]],
    [[0, 0], [1, 0], [1, 1], [1, 2], [2, 2]]
  ];
  function gameShard(g) {
    const COLS = 8, ROWS = 16;
    let B = [], cur = null, hold = -1, canHold = true, bag = [], over = false, lines = 0;
    let fallT = 0, moveT = 0, prevAx = 0, shake = 0, fx = [], pops = [];
    for (let r = 0; r < ROWS; r++) B.push(new Array(COLS).fill(-1));
    const L = function () { return grid2(COLS, ROWS, TOP); };
    const col = function (k) { return 'hsl(' + ((k * 30) % 360) + ',85%,60%)'; };
    function refill() { bag = []; for (let k = 0; k < SHAPES.length; k++) bag.push(k); for (let i = bag.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = bag[i]; bag[i] = bag[j]; bag[j] = t; } }
    function pull() { if (!bag.length) refill(); return bag.pop(); }
    function peek() { if (!bag.length) refill(); return bag[bag.length - 1]; }
    function fits(cells, x, y) {
      for (const p of cells) {
        const X = x + p[0], Y = y + p[1];
        if (X < 0 || X >= COLS || Y >= ROWS) return false;
        if (Y >= 0 && B[Y][X] >= 0) return false;
      }
      return true;
    }
    function spawn(k) {
      cur = { k: k, cells: SHAPES[k].slice(), x: 3, y: 0 };
      fallT = 0;
      if (!fits(cur.cells, cur.x, cur.y)) { over = true; miniFail(g, 'The shaft is full'); }
    }
    function lock() {
      for (const p of cur.cells) {
        const X = cur.x + p[0], Y = cur.y + p[1];
        if (Y < 0) { over = true; miniFail(g, 'The shaft is full'); return; }
        B[Y][X] = cur.k;
        const l = L();
        fxBurst(fx, l.ox + X * l.cs + l.cs / 2, l.oy + (Y + 0.5) * l.cs, col(cur.k), 3, 90);
      }
      const keep = B.filter(function (row) { return !row.every(function (v) { return v >= 0; }); });
      const removed = ROWS - keep.length;
      if (removed > 0) {
        for (let i = 0; i < removed; i++) keep.unshift(new Array(COLS).fill(-1));
        B = keep;
        lines += removed;
        shake = 4 + removed * 2;
        popAdd(pops, removed > 1 ? 'MULTI x' + removed : 'LINE', W() / 2, H() * 0.45, C.gold, 22);
        beep(600, 1000, 0.15, 'square', 0.06);
      } else beep(200, 160, 0.06, 'triangle', 0.03);
      canHold = true;
      cur = null;
    }
    function rotate() {
      const nc = rotCells(cur.cells);
      for (const k of [0, -1, 1, -2, 2]) if (fits(nc, cur.x + k, cur.y)) { cur.x += k; cur.cells = nc; return; }
    }
    function landY() { let y = cur.y; while (fits(cur.cells, cur.x, y + 1)) y++; return y; }
    function tile2(x, y, s, k) { tile(x, y, s, col(k)); }
    spawn(pull());
    return {
      update(dt) {
        shake = Math.max(0, shake - dt * 30);
        fxUpdate(fx, dt, 120); popUpdate(pops, dt);
        if (over) return;
        if (lines >= g.goal) { over = true; completeMini(); return; }
        if (!cur) { spawn(pull()); if (over) return; }
        const ax = AX();
        if (ax !== 0) {
          const d = ax > 0 ? 1 : -1;
          if (ax !== prevAx) { if (fits(cur.cells, cur.x + d, cur.y)) cur.x += d; moveT = 0.2; }
          else { moveT -= dt; if (moveT <= 0) { if (fits(cur.cells, cur.x + d, cur.y)) cur.x += d; moveT = 0.09; } }
        } else moveT = 0;
        prevAx = ax;
        if (pressed('a')) rotate();
        if (pressed('c') && canHold) {
          canHold = false;
          if (hold < 0) { hold = cur.k; cur = null; spawn(pull()); }
          else { const k = hold; hold = cur.k; spawn(k); }
          if (over) return;
        }
        if (pressed('b')) { cur.y = landY(); lock(); return; }
        fallT += dt;
        const sp = AY() > 0.5 ? 0.04 : fallSpeed(0.6, 0.12, 0.025, lines);
        if (fallT >= sp) {
          fallT = 0;
          if (fits(cur.cells, cur.x, cur.y + 1)) cur.y++;
          else { lock(); return; }
        }
        hud('Lines ' + lines + '/' + g.goal);
      },
      draw() {
        bg('#0a1020', '#140a22');
        const l = L(), cs = l.cs;
        ctx2d.save(); shakeOn(shake);
        panel(l, 'rgba(120,150,255,.10)');
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) rrect(l.ox + c * cs + 2, l.oy + r * cs + 2, cs - 4, cs - 4, 4, 'rgba(255,255,255,.03)');
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (B[r][c] >= 0) tile2(l.ox + c * cs, l.oy + r * cs, cs, B[r][c]);
        if (cur) {
          const ly = landY();
          for (const p of cur.cells) rrect(l.ox + (cur.x + p[0]) * cs + 2, l.oy + (ly + p[1]) * cs + 2, cs - 4, cs - 4, 4, 'rgba(255,255,255,.14)');
          for (const p of cur.cells) if (cur.y + p[1] >= 0) tile2(l.ox + (cur.x + p[0]) * cs, l.oy + (cur.y + p[1]) * cs, cs, cur.k);
        }
        const gut = l.ox;
        if (gut > 40) {
          const s = Math.min(14, (gut - 14) / 4);
          const pk = peek(), pc = SHAPES[pk];
          text('NEXT', gut / 2, l.oy + 12, 11, C.gold, 'center', 800);
          for (const p of pc) tile2(gut / 2 - s * 1.5 + p[0] * s, l.oy + 30 + p[1] * s, s, pk);
          text('HOLD', l.ox + cs * COLS + gut / 2, l.oy + 12, 11, C.cyan, 'center', 800);
          if (hold >= 0) for (const p of SHAPES[hold]) tile2(l.ox + cs * COLS + gut / 2 - s * 1.5 + p[0] * s, l.oy + 30 + p[1] * s, s, hold);
        }
        fxDraw(fx); popDraw(pops);
        ctx2d.restore();
      },
      stop() {}
    };
  }

  // ---------- 6. Flood Bloom: recolour the spreading region ----------
  function gameBloom(g) {
    const PAL = ['#ff5570', '#55e6ff', '#ffe36e', '#55ff9a', '#a978ff'];
    const K = PAL.length;
    let N = 6, G = [], PUL = [], lv = 0, moves = 0, budget = 0, over = false, shake = 0, fx = [], pops = [];
    const L = function () { return grid2(N, N, TOP + 6, 190); };
    const chipXY = function (i) { return { x: W() * (i + 1) / (K + 1), y: H() - 168 }; };
    function level() {
      N = Math.min(6 + Math.floor(lv / 2), 10);
      G = []; PUL = [];
      for (let r = 0; r < N; r++) {
        G.push([]); PUL.push(new Array(N).fill(0));
        for (let c = 0; c < N; c++) G[r].push(randi(0, K - 1));
      }
      moves = 0; budget = Math.floor(N * 1.3) + 8;
    }
    function region() {
      const c0 = G[0][0], seen = new Set([0]), st = [[0, 0]], out = [];
      while (st.length) {
        const p = st.pop(); out.push(p);
        for (const d of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nr = p[0] + d[0], nc = p[1] + d[1];
          if (nr < 0 || nc < 0 || nr >= N || nc >= N) continue;
          const k = nr * N + nc;
          if (seen.has(k) || G[nr][nc] !== c0) continue;
          seen.add(k); st.push([nr, nc]);
        }
      }
      return out;
    }
    function flood(k) {
      if (over || k === G[0][0]) return;
      const reg = region();
      for (const p of reg) { G[p[0]][p[1]] = k; PUL[p[0]][p[1]] = 1; }
      moves++; shake = 2;
      const l = L();
      fxBurst(fx, l.ox + l.cs * 0.5, l.oy + l.cs * 0.5, PAL[k], 10, 150);
      beep(300 + k * 60, 420 + k * 60, 0.08, 'sine', 0.06);
    }
    level();
    return {
      update(dt) {
        shake = Math.max(0, shake - dt * 30);
        for (const row of PUL) decay(row, Math.exp(-dt * 6));
        fxUpdate(fx, dt, 0); popUpdate(pops, dt);
        if (over) return;
        const c0 = G[0][0];
        if (G.every(function (row) { return row.every(function (v) { return v === c0; }); })) {
          lv++;
          popAdd(pops, 'BLOOMED', W() / 2, H() * 0.42, C.gold, 24);
          beep(520, 1040, 0.25, 'triangle', 0.07);
          if (lv >= g.goal) { over = true; completeMini(); return; }
          level(); return;
        }
        if (moves > budget) { over = true; miniFail(g, 'Out of moves'); return; }
        hud('Levels ' + lv + '/' + g.goal + ' | Moves left ' + (budget - moves));
      },
      pointer(x, y) {
        if (over) return;
        for (let i = 0; i < K; i++) {
          const p = chipXY(i);
          if (dist(x, y, p.x, p.y) < 28) { flood(i); return; }
        }
      },
      draw() {
        bg('#0a1a14', '#06100e');
        const l = L(), cs = l.cs;
        ctx2d.save(); shakeOn(shake);
        panel(l, 'rgba(120,255,200,.08)');
        const inReg = new Set(region().map(function (p) { return p[0] * N + p[1]; }));
        for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
          const pu = PUL[r][c], sz = cs - 4 - 6 * pu, x = l.ox + c * cs + (cs - sz) / 2, y = l.oy + r * cs + (cs - sz) / 2;
          if (inReg.has(r * N + c)) rrect(x - 2, y - 2, sz + 4, sz + 4, 6, 'rgba(255,255,255,.35)');
          tile(x, y, sz, PAL[G[r][c]]);
        }
        for (let i = 0; i < K; i++) {
          const p = chipXY(i);
          circle(p.x, p.y, 26, 'rgba(255,255,255,.10)');
          tile(p.x - 20, p.y - 20, 40, PAL[i]);
        }
        fxDraw(fx); popDraw(pops);
        ctx2d.restore();
      },
      stop() {}
    };
  }

  // ---------- 7. Tilt Cascade: swipe to tilt the whole board ----------
  function gameTilt(g) {
    const COLS = 7, ROWS = 9, NT = 4;
    const G = [], OX = [], OY = [];
    for (let r = 0; r < ROWS; r++) {
      G.push([]); OX.push(new Array(COLS).fill(0)); OY.push(new Array(COLS).fill(0));
      for (let c = 0; c < COLS; c++) G[r].push(Math.random() < 0.4 ? randi(0, NT - 1) : -1);
    }
    let gx = 0, gy = 1, over = false, cleared = 0, shake = 0, fx = [], pops = [];
    const L = function () { return grid2(COLS, ROWS, TOP + 14, 150); };
    function lines(dx, dy) {
      const out = [];
      if (dx === 0) {
        for (let c = 0; c < COLS; c++) {
          const a = [];
          if (dy > 0) for (let r = ROWS - 1; r >= 0; r--) a.push([r, c]);
          else for (let r = 0; r < ROWS; r++) a.push([r, c]);
          out.push(a);
        }
      } else {
        for (let r = 0; r < ROWS; r++) {
          const a = [];
          if (dx > 0) for (let c = COLS - 1; c >= 0; c--) a.push([r, c]);
          else for (let c = 0; c < COLS; c++) a.push([r, c]);
          out.push(a);
        }
      }
      return out;
    }
    function gravity(dx, dy) {
      let moved = false;
      for (const a of lines(dx, dy)) {
        let w = 0;
        for (let i = 0; i < a.length; i++) {
          const r = a[i][0], c = a[i][1], v = G[r][c];
          if (v < 0) continue;
          const wr = a[w][0], wc = a[w][1];
          if (w !== i) { G[wr][wc] = v; G[r][c] = -1; OX[wr][wc] = c - wc; OY[wr][wc] = r - wr; moved = true; }
          w++;
        }
      }
      return moved;
    }
    function clearGroups() {
      const kill = new Set();
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const v = G[r][c];
        if (v < 0) continue;
        for (const d of [[0, 1], [1, 0]]) {
          const cells = [[r, c]];
          let rr = r + d[0], cc = c + d[1];
          while (rr < ROWS && cc < COLS && G[rr][cc] === v) { cells.push([rr, cc]); rr += d[0]; cc += d[1]; }
          if (cells.length >= 3) for (const p of cells) kill.add(p[0] * COLS + p[1]);
        }
      }
      let n = 0;
      kill.forEach(function (k) {
        const r = Math.floor(k / COLS), c = k % COLS, l = L();
        fxBurst(fx, l.ox + c * l.cs + l.cs / 2, l.oy + (r + 0.5) * l.cs, GEM[G[r][c] % GEM.length], 8, 170);
        G[r][c] = -1; n++;
      });
      return n;
    }
    function spawn() {
      let r0 = -1, c0 = -1;
      const cells = [];
      if (gy !== 0) { const r = gy > 0 ? 0 : ROWS - 1; for (let c = 0; c < COLS; c++) if (G[r][c] < 0) cells.push([r, c]); }
      else { const c = gx > 0 ? 0 : COLS - 1; for (let r = 0; r < ROWS; r++) if (G[r][c] < 0) cells.push([r, c]); }
      if (!cells.length) return false;
      const p = cells[randi(0, cells.length - 1)];
      r0 = p[0]; c0 = p[1];
      G[r0][c0] = randi(0, NT - 1);
      OX[r0][c0] = -gx; OY[r0][c0] = -gy;
      return true;
    }
    function tilt(dx, dy) {
      if (over) return;
      gx = dx; gy = dy;
      if (!gravity(dx, dy)) { shake = 1; return; }
      let total = 0;
      for (;;) {
        const n = clearGroups();
        if (!n) break;
        total += n;
        gravity(dx, dy);
      }
      cleared += total;
      shake = 2 + total;
      if (total) {
        popAdd(pops, '+' + total, W() / 2, H() * 0.5, C.gold, 22);
        beep(500 + total * 40, 760, 0.12, 'square', 0.05);
      } else beep(260, 200, 0.05, 'triangle', 0.03);
      for (let i = 0; i < 2; i++) {
        if (!spawn()) { over = true; miniFail(g, 'The board is full'); return; }
      }
    }
    return {
      update(dt) {
        shake = Math.max(0, shake - dt * 30);
        for (let r = 0; r < ROWS; r++) { decay(OX[r], Math.exp(-dt * 12)); decay(OY[r], Math.exp(-dt * 12)); }
        fxUpdate(fx, dt, 200); popUpdate(pops, dt);
        if (over) return;
        if (cleared >= g.goal) { over = true; completeMini(); return; }
        hud('Gems ' + cleared + '/' + g.goal);
      },
      swipe(dx, dy) {
        if (over) return;
        if (Math.abs(dx) > Math.abs(dy)) tilt(dx > 0 ? 1 : -1, 0);
        else tilt(0, dy > 0 ? 1 : -1);
      },
      draw() {
        bg('#120a26', '#0a0616');
        const l = L(), cs = l.cs;
        ctx2d.save(); shakeOn(shake);
        panel(l, 'rgba(160,120,255,.10)');
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
          const v = G[r][c];
          if (v < 0) continue;
          tile(l.ox + (c + OX[r][c]) * cs, l.oy + (r + OY[r][c]) * cs, cs, GEM[v]);
        }
        const cx = l.ox + COLS * cs / 2, cy = l.oy + ROWS * cs / 2;
        const ex = cx + gx * (COLS * cs / 2 + 22), ey = cy + gy * (ROWS * cs / 2 + 22);
        const px = -gy, py = gx;
        polygon([[ex + gx * 10, ey + gy * 10], [ex + px * 8, ey + py * 8], [ex - px * 8, ey - py * 8]], C.cyan);
        fxDraw(fx); popDraw(pops);
        ctx2d.restore();
      },
      stop() {}
    };
  }

  // ---------- 8. Triad Drop: falling triplets, line matches ----------
  function gameTriad(g) {
    const COLS = 6, ROWS = 13, NT = 6;
    let B = [], cur = null, nxt = null, over = false, cleared = 0, shake = 0, fx = [], pops = [];
    let fallT = 0, moveT = 0, prevAx = 0;
    for (let r = 0; r < ROWS; r++) B.push(new Array(COLS).fill(-1));
    const L = function () { return grid2(COLS, ROWS, TOP); };
    const mk = function () { return { a: randi(0, NT - 1), b: randi(0, NT - 1), c: randi(0, NT - 1) }; };
    function fits(x, y) {
      for (let i = 0; i < 3; i++) {
        const Y = y + i;
        if (x < 0 || x >= COLS || Y >= ROWS) return false;
        if (Y >= 0 && B[Y][x] >= 0) return false;
      }
      return true;
    }
    function spawn() {
      const p = nxt || mk();
      nxt = mk();
      cur = { x: 2, y: -2, c: [p.a, p.b, p.c] };
      fallT = 0;
      if (!fits(cur.x, cur.y)) { over = true; miniFail(g, 'The shaft is full'); }
    }
    function findMatches() {
      const kill = new Set();
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const v = B[r][c];
        if (v < 0) continue;
        for (const d of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
          const cells = [];
          for (let k = 0; k < 3; k++) {
            const rr = r + d[0] * k, cc = c + d[1] * k;
            if (rr < 0 || rr >= ROWS || cc < 0 || cc >= COLS || B[rr][cc] !== v) break;
            cells.push(rr * COLS + cc);
          }
          if (cells.length === 3) cells.forEach(function (k) { kill.add(k); });
        }
      }
      return kill;
    }
    function settle() {
      for (let c = 0; c < COLS; c++) {
        let e = 0;
        for (let r = ROWS - 1; r >= 0; r--) {
          if (B[r][c] < 0) { e++; continue; }
          if (e) { B[r + e][c] = B[r][c]; B[r][c] = -1; }
        }
      }
    }
    function lock() {
      for (let i = 0; i < 3; i++) {
        const Y = cur.y + i;
        if (Y < 0) { over = true; miniFail(g, 'The shaft is full'); return; }
        B[Y][cur.x] = cur.c[i];
      }
      cur = null;
      settle();
      let chain = 0;
      for (;;) {
        const kill = findMatches();
        if (!kill.size) break;
        chain++;
        kill.forEach(function (k) {
          const r = Math.floor(k / COLS), c = k % COLS, l = L();
          fxBurst(fx, l.ox + c * l.cs + l.cs / 2, l.oy + (r + 0.5) * l.cs, GEM[B[r][c] % GEM.length], 9, 170);
          B[r][c] = -1;
        });
        cleared += kill.size;
        shake = Math.min(10, shake + 2 + chain);
        beep(480 + chain * 90, 720 + chain * 110, 0.1, 'square', 0.05);
        if (chain > 1) popAdd(pops, 'CHAIN x' + chain, W() / 2, H() * 0.45, C.gold, 22);
        settle();
      }
    }
    function landY() { let y = cur.y; while (fits(cur.x, y + 1)) y++; return y; }
    spawn();
    return {
      update(dt) {
        shake = Math.max(0, shake - dt * 30);
        fxUpdate(fx, dt, 160); popUpdate(pops, dt);
        if (over) return;
        if (cleared >= g.goal) { over = true; completeMini(); return; }
        if (!cur) { spawn(); if (over) return; }
        const ax = AX();
        if (ax !== 0) {
          const d = ax > 0 ? 1 : -1;
          if (ax !== prevAx) { if (fits(cur.x + d, cur.y)) cur.x += d; moveT = 0.2; }
          else { moveT -= dt; if (moveT <= 0) { if (fits(cur.x + d, cur.y)) cur.x += d; moveT = 0.09; } }
        } else moveT = 0;
        prevAx = ax;
        if (pressed('a')) cur.c = [cur.c[2], cur.c[0], cur.c[1]];
        if (pressed('b')) { cur.y = landY(); lock(); return; }
        fallT += dt;
        const sp = AY() > 0.5 ? 0.04 : fallSpeed(0.7, 0.14, 0.02, cleared / 3);
        if (fallT >= sp) {
          fallT = 0;
          if (fits(cur.x, cur.y + 1)) cur.y++;
          else { lock(); return; }
        }
        hud('Gems ' + cleared + '/' + g.goal);
      },
      draw() {
        bg('#0a0a22', '#1c0b20');
        const l = L(), cs = l.cs;
        ctx2d.save(); shakeOn(shake);
        panel(l, 'rgba(255,140,200,.08)');
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) rrect(l.ox + c * cs + 2, l.oy + r * cs + 2, cs - 4, cs - 4, 6, 'rgba(255,255,255,.03)');
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
          if (B[r][c] >= 0) gemDraw(l.ox + c * cs + cs / 2, l.oy + (r + 0.5) * cs, cs * 0.38, B[r][c]);
        }
        if (cur) {
          const ly = landY();
          for (let i = 0; i < 3; i++) if (ly + i >= 0) rrect(l.ox + cur.x * cs + cs * 0.15, l.oy + (ly + i) * cs + cs * 0.15, cs * 0.7, cs * 0.7, 6, 'rgba(255,255,255,.12)');
          for (let i = 0; i < 3; i++) if (cur.y + i >= 0) gemDraw(l.ox + cur.x * cs + cs / 2, l.oy + (cur.y + i + 0.5) * cs, cs * 0.38, cur.c[i]);
        }
        if (nxt && l.ox > 40) {
          const s = Math.min(14, (l.ox - 14) / 3);
          text('NEXT', l.ox / 2, l.oy + 12, 11, C.gold, 'center', 800);
          const cs2 = [nxt.a, nxt.b, nxt.c];
          for (let i = 0; i < 3; i++) gemDraw(l.ox / 2, l.oy + 34 + i * s * 2, s * 0.8, cs2[i]);
        }
        fxDraw(fx); popDraw(pops);
        ctx2d.restore();
      },
      stop() {}
    };
  }

  // ---------- 9. Beam Bounce: rotate mirrors to light every target ----------
  function gameBeam(g) {
    let cols = 6, rows = 5, wall = [], st = [], tgt = [], lit = [], used = [], emit = 0, lv = 0, taps = 0, budget = 0;
    let over = false, shake = 0, fx = [], pops = [], segs = [], tgtList = [];
    const L = function () { return grid2(cols, rows, 130, 150); };
    function gen() {
      cols = 6 + Math.min(3, Math.floor(lv / 2));
      rows = 5 + Math.min(2, Math.floor(lv / 2));
      const n = cols * rows, turns = 2 + Math.floor(lv / 2);
      wall = new Array(n).fill(false); st = new Array(n).fill(0); tgt = new Array(n).fill(false); used = new Array(n).fill(false);
      const ey = randi(1, rows - 2);
      emit = ey * cols;
      let x = 0, y = ey, dx = 1, dy = 0;
      used[emit] = true;
      const path = [], mirrors = [];
      let turn = 0, guard = 0;
      while (turn < turns && guard++ < 80) {
        const run = randi(1, 3);
        let ok = true;
        for (let i = 0; i < run; i++) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= cols || ny >= rows || used[ny * cols + nx]) { ok = false; break; }
          x = nx; y = ny; used[y * cols + x] = true; path.push(y * cols + x);
        }
        if (!ok) break;
        const side = Math.random() < 0.5 ? 1 : -1;
        const ndx = -dy * side, ndy = dx * side;
        const type = (ndx === -dy && ndy === -dx) ? 1 : 2;
        mirrors.push({ i: y * cols + x, t: type });
        dx = ndx; dy = ndy; turn++;
      }
      for (let k = randi(0, 3); k > 0; k--) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows || used[ny * cols + nx]) break;
        x = nx; y = ny; used[y * cols + x] = true; path.push(y * cols + x);
      }
      for (const m of mirrors) st[m.i] = m.t;
      const mirrorSet = new Set(mirrors.map(function (m) { return m.i; }));
      const cands = path.filter(function (i) { return !mirrorSet.has(i); });
      for (let i = cands.length - 1; i > 0; i--) { const j = randi(0, i); const t = cands[i]; cands[i] = cands[j]; cands[j] = t; }
      const tc = Math.min(cands.length, 2 + Math.floor(lv / 2));
      tgtList = cands.slice(0, tc);
      for (const i of tgtList) tgt[i] = true;
      const wp = Math.min(0.2, 0.1 + lv * 0.01);
      for (let i = 0; i < n; i++) {
        if (i === emit) continue;
        if (!used[i]) { if (Math.random() < wp) wall[i] = true; else if (Math.random() < 0.35) st[i] = randi(1, 2); }
        else if (mirrorSet.has(i)) st[i] = randi(1, 2);
      }
      taps = 0; budget = 14 + lv * 4;
      trace();
    }
    function trace() {
      lit = new Array(cols * rows).fill(false); segs = [];
      let x = emit % cols, y = Math.floor(emit / cols), dx = 1, dy = 0, steps = 0;
      const seen = new Set();
      while (steps++ < 400) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) break;
        const i = ny * cols + nx;
        if (wall[i]) break;
        const key = i + ':' + dx + ',' + dy;
        if (seen.has(key)) break;
        seen.add(key);
        segs.push([x, y, nx, ny]);
        x = nx; y = ny; lit[i] = true;
        if (st[i] === 1) { const t = dx; dx = -dy; dy = -t; }
        else if (st[i] === 2) { const t = dx; dx = dy; dy = t; }
      }
    }
    function litCount() { let k = 0; for (const i of tgtList) if (lit[i]) k++; return k; }
    gen();
    return {
      update(dt) {
        shake = Math.max(0, shake - dt * 30);
        fxUpdate(fx, dt, 0); popUpdate(pops, dt);
        if (over) return;
        hud('Levels ' + lv + '/' + g.goal + ' | Taps left ' + (budget - taps));
      },
      pointer(x, y) {
        if (over) return;
        const hc = hitCell(L(), x, y);
        if (!hc) return;
        const i = hc[0] * cols + hc[1];
        if (wall[i] || i === emit) return;
        st[i] = (st[i] + 1) % 3;
        taps++; shake = 1;
        beep(560 + st[i] * 120, 700 + st[i] * 120, 0.06, 'square', 0.04);
        trace();
        if (litCount() === tgtList.length) {
          lv++;
          const l = L();
          for (const t of tgtList) fxBurst(fx, l.ox + (t % cols) * l.cs + l.cs / 2, l.oy + (Math.floor(t / cols) + 0.5) * l.cs, C.gold, 10, 160);
          popAdd(pops, 'LIT!', W() / 2, H() * 0.7, C.gold, 22);
          beep(520, 1040, 0.25, 'triangle', 0.07);
          if (lv >= g.goal) { over = true; completeMini(); return; }
          gen();
        } else if (taps >= budget) {
          over = true; miniFail(g, 'Out of taps');
        }
      },
      draw() {
        bg('#060b1a', '#120a1e');
        const l = L(), cs = l.cs;
        ctx2d.save(); shakeOn(shake);
        panel(l, 'rgba(90,200,255,.08)');
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
          const i = r * cols + c, x = l.ox + c * cs, y = l.oy + r * cs;
          if (wall[i]) {
            rrect(x + 2, y + 2, cs - 4, cs - 4, 6, '#2a2f44');
            rrect(x + 6, y + 6, cs - 12, cs - 12, 4, '#3b4262');
          } else {
            rrect(x + 2, y + 2, cs - 4, cs - 4, 6, 'rgba(255,255,255,.03)');
          }
          if (tgt[i]) {
            const on = lit[i];
            strokeCircle(x + cs / 2, y + cs / 2, cs * 0.3, on ? C.gold : 'rgba(255,215,92,.35)', on ? 4 : 2);
            if (on) circle(x + cs / 2, y + cs / 2, cs * 0.12, C.gold);
          }
          if (st[i] > 0 && !wall[i]) {
            const cx = x + cs / 2, cy = y + cs / 2, h = cs * 0.38;
            const col = lit[i] ? '#fff6c8' : '#8a7cff';
            if (st[i] === 1) line(cx - h, cy + h, cx + h, cy - h, col, Math.max(3, cs * 0.09));
            else line(cx - h, cy - h, cx + h, cy + h, col, Math.max(3, cs * 0.09));
          }
        }
        const ex = l.ox + (emit % cols) * cs, ey = l.oy + (Math.floor(emit / cols) + 0.5) * cs;
        circle(ex + cs * 0.1, ey, cs * 0.55, 'rgba(255,110,140,.18)');
        polygon([[ex + cs * 0.05, ey - cs * 0.3], [ex + cs * 0.05, ey + cs * 0.3], [ex + cs * 0.55, ey]], C.pink);
        ctx2d.globalCompositeOperation = 'lighter';
        for (const s of segs) {
          const x1 = l.ox + s[0] * cs + cs / 2, y1 = l.oy + s[1] * cs + cs / 2;
          const x2 = l.ox + s[2] * cs + cs / 2, y2 = l.oy + s[3] * cs + cs / 2;
          line(x1, y1, x2, y2, 'rgba(255,120,160,.35)', 9);
          line(x1, y1, x2, y2, '#ffd6e6', 2.5);
        }
        ctx2d.globalCompositeOperation = 'source-over';
        fxDraw(fx); popDraw(pops);
        ctx2d.restore();
      },
      stop() {}
    };
  }

  const engines = {
    n16_prism: gamePrism,
    n16_twin: gameTwin,
    n16_glacier: gameGlacier,
    n16_lantern: gameLantern,
    n16_shard: gameShard,
    n16_bloom: gameBloom,
    n16_tilt: gameTilt,
    n16_triad: gameTriad,
    n16_beam: gameBeam
  };
  const minis = [
    { id: 'n16_prism', title: 'Prism Swap', icon: '\u{1F48E}', cat: 'PUZZLE', engine: 'n16_prism', goal: 60,
      desc: 'Swap neighbouring gems to line up three or more. Cascades chain on their own. Clear 60 gems before the swaps run out.' },
    { id: 'n16_twin', title: 'Twin Drop', icon: '\u{1F52E}', cat: 'PUZZLE', engine: 'n16_twin', goal: 60,
      desc: 'Pairs of gems fall into the well. Rotate and drop them so four or more of one colour touch and pop. Chains score bonus popups.' },
    { id: 'n16_glacier', title: 'Glacier Glide', icon: '\u{1F9CA}', cat: 'PUZZLE', engine: 'n16_glacier', goal: 12,
      desc: 'Slide across the ice until a rock stops you. Collect every gem before your moves run out. Snowflakes give extra moves.' },
    { id: 'n16_lantern', title: 'Lantern Flip', icon: '\u{1F3EE}', cat: 'PUZZLE', engine: 'n16_lantern', goal: 6,
      desc: 'Tapping a lantern flips it and its four neighbours. Switch every lantern off within the tap budget. Each level grows bigger.' },
    { id: 'n16_shard', title: 'Shard Stack', icon: '\u{1F9E9}', cat: 'PUZZLE', engine: 'n16_shard', goal: 14,
      desc: 'Pentomino shards fall down a narrow shaft. Fill rows to clear them, hold a shard for later and watch the ghost to land it.' },
    { id: 'n16_bloom', title: 'Flood Bloom', icon: '\u{1F338}', cat: 'PUZZLE', engine: 'n16_bloom', goal: 6,
      desc: 'Recolour the region that grows from the top-left corner by picking a colour. Flood the whole board before the moves run out.' },
    { id: 'n16_tilt', title: 'Tilt Cascade', icon: '\u{1F300}', cat: 'PUZZLE', engine: 'n16_tilt', goal: 24,
      desc: 'Swipe to tilt the whole board. Blocks slide that way, groups of three or more vanish and new blocks drop in from behind. Do not let the board fill.' },
    { id: 'n16_triad', title: 'Triad Drop', icon: '\u{1F53A}', cat: 'PUZZLE', engine: 'n16_triad', goal: 45,
      desc: 'Falling triads of gems: rotate the order and drop them. Line up three of one colour in any direction to clear them and start chains.' },
    { id: 'n16_beam', title: 'Beam Bounce', icon: '\u{1F506}', cat: 'PUZZLE', engine: 'n16_beam', goal: 6,
      desc: 'A light beam fires across a stone grid. Tap cells to set mirrors, and bounce the beam onto every gold target. Each level has more targets.' }
  ];
  return { engines: engines, minis: minis, aaa: [] };
})();
