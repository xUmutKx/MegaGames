window.__AG_puzzle = (function () {
  const LS = 'mg_puzzle_';
  function ld(k, d) { try { const v = localStorage.getItem(LS + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }
  function sv(k, v) { try { localStorage.setItem(LS + k, JSON.stringify(v)); } catch (e) { } }
  function nxt(o) { let s = o.rs >>> 0 || 1; s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; o.rs = s; return s / 4294967296; }
  function ri(o, a, b) { return a + Math.floor(nxt(o) * (b - a + 1)); }
  function shuf(a, o) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(nxt(o) * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function hsl(h, s, l, a) { return 'hsla(' + Math.round(h) + ',' + s + '%,' + l + '%,' + (a === undefined ? 1 : a) + ')'; }
  function rr(x, y, w, h, r, fill, stroke, lw) {
    const c = ctx2d; r = Math.max(0, Math.min(r, w / 2, h / 2));
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw || 2; c.stroke(); }
  }
  function bg(h, t) {
    const c = ctx2d, g = c.createLinearGradient(0, 0, 0, H());
    g.addColorStop(0, hsl(h, 45, 12)); g.addColorStop(1, hsl(h + 40, 50, 5));
    c.fillStyle = g; c.fillRect(0, 0, W(), H());
    for (let i = 0; i < 14; i++) {
      const x = (i * 83 + (t || 0) * (4 + i % 4)) % (W() + 40) - 20, y = (i * 137) % H();
      c.fillStyle = hsl(h + 30, 60, 70, .05 + .04 * Math.sin((t || 0) + i)); c.beginPath(); c.arc(x, y, 2 + i % 3, 0, 6.283); c.fill();
    }
  }
  function glow(col, b) { ctx2d.shadowColor = col; ctx2d.shadowBlur = b; }
  function noglow() { ctx2d.shadowBlur = 0; }
  function stars3(x, y, n, sz) { for (let i = 0; i < 3; i++) text('★', x + (i - 1) * sz * 1.3, y, sz, i < n ? C.gold : 'rgba(255,255,255,.2)', 'center', 900); }
  function fit(cols, rows, A, maxS) {
    const s = Math.min(A.w / cols, A.h / rows, maxS || 90);
    return { s, x: A.x + (A.w - s * cols) / 2, y: A.y + (A.h - s * rows) / 2 };
  }
  function popAdd(list, str, x, y, col, size) { list.push({ str, x, y, col, size: size || 16, life: 1 }); }
  function popUpdate(list, dt) { for (let i = list.length - 1; i >= 0; i--) { const p = list[i]; p.y -= 34 * dt; p.life -= dt * 1.1; if (p.life <= 0) list.splice(i, 1); } }
  function popDraw(list) { for (const p of list) { ctx2d.globalAlpha = clamp(p.life, 0, 1); text(p.str, p.x, p.y, p.size, p.col, 'center', 900); } ctx2d.globalAlpha = 1; }
  function fmt(n) { n = Math.round(n); return n < 0 ? '-$' + (-n) : '$' + n; }

  // ---------- generic level-based scaffold ----------
  // def: {hue, build(lv,seed)->st (plain JSON data, st.rs seed, st.par), draw(st,K), tap(st,x,y,K), swipe?, dir?(st,dx,dy,K),
  //       done(st), hint?(st,K), lost?(st,moves), update?(st,dt,K), hudExtra?(st,moves), stuck?(st), stars?(st,moves), onStart?}
  // def mutates st inside tap(): call K.begin() BEFORE mutating and K.commit(n) after a successful move.
  function lvl(g, def) {
    const goal = Math.max(1, g.goal | 0);
    const base = Math.floor(Math.random() * 900000) + 1;
    let cleared = 0, st = null, hist = [], moves = 0, hints = 3, t = 0, over = 0, ovT = 0, stars = 0, pre = null, shake = 0, msg = '', msgT = 0, fin = false, retries = 0;
    const parts = [], pops = [];
    const K = {
      parts, pops, hint: null, hintT: 0, t: 0, anim: {},
      area() { return { x: 8, y: 116, w: W() - 16, h: Math.max(200, H() - 116 - 128) }; },
      begin() { pre = JSON.stringify(st); },
      commit(n) { if (pre === null) pre = JSON.stringify(st); hist.push(pre); if (hist.length > 400) hist.shift(); pre = null; moves += (n === undefined ? 1 : n); K.hint = null; K.hintT = 0; check(); },
      say(s) { msg = s; msgT = 2.2; },
      burst(x, y, c, n, sp) { fxBurst(parts, x, y, c, n || 10, sp || 140); },
      pop(s, x, y, c, sz) { popAdd(pops, s, x, y, c, sz); },
      shake(v) { shake = Math.max(shake, v || 6); },
      get moves() { return moves; },
      get over() { return over; }
    };
    function start() {
      st = def.build(cleared, base + cleared * 7919 + retries * 131); hist = []; moves = 0; hints = 3; over = 0; K.hint = null; K.hintT = 0; K.anim = {}; pre = null;
      if (def.onStart) def.onStart(st, K);
    }
    function check() {
      if (over) return;
      if (def.done(st)) {
        over = 1; ovT = 0;
        const par = Math.max(1, st.par || moves);
        stars = def.stars ? def.stars(st, moves) : (moves <= par * 1.15 + 0.5 ? 3 : moves <= par * 1.8 + 1 ? 2 : 1);
        sv('stars', ld('stars', 0) + stars);
        cleared++;
        beep(500, 1200, .35, 'triangle', .12);
        const A = K.area(); K.burst(W() / 2, A.y + A.h / 2, C.gold, 50, 260);
        try { progress.coins += stars; saveProg(); } catch (e) { }
      } else if (def.lost && def.lost(st, moves)) { over = 2; ovT = 0; beep(300, 90, .4, 'sawtooth', .1); shake = 8; }
    }
    function undo() {
      if (!hist.length) { K.say('Nothing to undo'); return; }
      if (over === 1) return;
      st = JSON.parse(hist.pop()); moves = Math.max(0, moves - 1); over = 0; K.hint = null; K.hintT = 0; beep(300, 250, .05, 'sine', .08);
    }
    function reset() { retries++; start(); beep(250, 400, .08, 'sine', .08); }
    function useHint() {
      if (over) return;
      if (!def.hint) { K.say('No hints for this puzzle'); return; }
      if (hints <= 0) { K.say('No hints left on this level'); return; }
      const r = def.hint(st, K);
      if (r) { hints--; K.hint = r; K.hintT = 4; beep(700, 900, .1, 'sine', .08); } else K.say('No hint available - try Undo');
    }
    function nextLevel() {
      if (cleared >= goal) { if (!fin) { fin = true; completeMini(); } return; }
      retries = 0; start();
    }
    const btn = [{ l: '↶ Undo' }, { l: '⟳ Reset' }, { l: '💡 Hint' }];
    function bx(i) { const w = Math.min(110, (W() - 24 - 12) / 3); const tot = w * 3 + 12; return { x: (W() - tot) / 2 + i * (w + 6), y: 78, w, h: 32 }; }
    start();
    return {
      pointer(x, y) {
        if (fin) return;
        for (let i = 0; i < 3; i++) { const b = bx(i); if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) { if (i === 0) { if (over === 2) over = 0; undo(); } else if (i === 1) reset(); else useHint(); return; } }
        if (over === 1) { if (ovT > .5) nextLevel(); return; }
        if (over === 2) { if (ovT > .4) reset(); return; }
        pre = null; def.tap(st, x, y, K); pre = null;
      },
      swipe(dx, dy) {
        if (fin || over) return;
        if (def.swipe) { pre = null; def.swipe(st, dx, dy, K); pre = null; }
        else if (def.dir) { const h = Math.abs(dx) > Math.abs(dy); pre = null; def.dir(st, h ? Math.sign(dx) : 0, h ? 0 : Math.sign(dy), K); pre = null; }
      },
      update(dt) {
        dt = Math.min(dt, .05); t += dt; K.t = t;
        fxUpdate(parts, dt, 120); popUpdate(pops, dt);
        shake = Math.max(0, shake - dt * 30); msgT -= dt; K.hintT = Math.max(0, K.hintT - dt); if (K.hintT <= 0) K.hint = null;
        if (over) ovT += dt;
        if (pressed('a')) { if (over === 2) over = 0; undo(); }
        if (pressed('b')) reset();
        if (pressed('c')) useHint();
        if (def.dir && !over && !fin) {
          const ax = AX(), ay = AY(); const dx = ax > .6 ? 1 : ax < -.6 ? -1 : 0, dy = ay > .6 ? 1 : ay < -.6 ? -1 : 0;
          K._ld = K._ld || { x: 0, y: 0, c: 0 }; K._ld.c -= dt;
          if ((dx || dy) && !(dx && dy) && (K._ld.x !== dx || K._ld.y !== dy || K._ld.c <= 0)) { const rep = K._ld.x === dx && K._ld.y === dy; pre = null; def.dir(st, dx, dy, K); pre = null; K._ld.c = rep ? .11 : .24; }
          K._ld.x = dx; K._ld.y = dy;
        }
        if (def.update && !over) def.update(st, dt, K);
        if (over === 1 && cleared >= goal && ovT > 1.3 && !fin) { fin = true; completeMini(); }
        if (over === 1 && cleared < goal && ovT > 3.2) nextLevel();
        const ex = def.hudExtra ? def.hudExtra(st, moves) : 'moves ' + moves;
        const ln = cleared + (over === 1 ? 0 : 1);
        hud(Math.min(cleared, goal) + '/' + goal + ' • Lv ' + ln + ' • ' + ex);
        hudTitle(g.title, 'Level ' + ln);
      },
      draw() {
        const c = ctx2d; K.t = t;
        bg(def.hue || 220, t);
        c.save(); if (shake > 0) c.translate(rand(-shake, shake) * .4, rand(-shake, shake) * .4);
        def.draw(st, K);
        c.restore();
        for (let i = 0; i < 3; i++) {
          const b = bx(i), dis = (i === 0 && !hist.length) || (i === 2 && (hints <= 0 || !def.hint));
          rr(b.x, b.y, b.w, b.h, 10, dis ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.14)', 'rgba(255,255,255,.25)', 1.5);
          text(btn[i].l + (i === 2 ? ' ' + hints : ''), b.x + b.w / 2, b.y + 21, 13, dis ? '#778' : '#fff', 'center', 800);
        }
        fxDraw(parts); popDraw(pops);
        if (msgT > 0) { c.globalAlpha = clamp(msgT, 0, 1); rr(W() / 2 - 130, H() - 168, 260, 30, 12, 'rgba(0,0,0,.7)'); text(msg, W() / 2, H() - 148, 13, '#fff', 'center', 700); c.globalAlpha = 1; }
        if (def.stuck && !over && def.stuck(st)) { rr(W() / 2 - 150, H() - 205, 300, 32, 12, 'rgba(160,30,50,.85)'); text('No moves left - Undo or Reset', W() / 2, H() - 184, 13, '#fff', 'center', 800); }
        if (over) {
          const a = Math.min(1, ovT * 3);
          c.globalAlpha = a; c.fillStyle = 'rgba(0,0,0,.62)'; c.fillRect(0, 150, W(), 250);
          const cy = 200;
          if (over === 1) {
            text(cleared >= goal ? 'ALL CLEARED!' : 'LEVEL CLEAR', W() / 2, cy, 32, C.gold, 'center', 900);
            stars3(W() / 2, cy + 50, stars, 34);
            text(moves + ' moves' + (st.par ? ' (par ' + st.par + ')' : ''), W() / 2, cy + 82, 15, '#ddd', 'center', 600);
            if (cleared < goal) text('Tap for next level', W() / 2, cy + 112, 14, C.cyan, 'center', 700);
          } else {
            text(def.lostText || 'OUT OF MOVES', W() / 2, cy + 10, 30, C.red, 'center', 900);
            text('Tap to retry  •  or Undo', W() / 2, cy + 50, 15, '#ddd', 'center', 600);
          }
          c.globalAlpha = 1;
        }
      },
      stop() { if (def.stop) def.stop(); }
    };
  }
  const ENG = {}, MINIS = [];
  function reg(key, title, icon, cat, desc, goal, hue, fn) {
    ENG[key] = fn; MINIS.push({ id: key, title, icon, cat, desc, engine: key, goal, hue });
  }
  function regOld(key, id, title, icon, cat, desc, goal, fn) {
    ENG[key] = fn; MINIS.push({ id, title, icon, cat, desc, engine: key, goal });
  }
  function adt(K) { const d = Math.min(.05, Math.max(0, K.t - (K.anim.lt === undefined ? K.t : K.anim.lt))); K.anim.lt = K.t; return d; }
  function cellAt(f, cols, rows, x, y) { const c = Math.floor((x - f.x) / f.s), r = Math.floor((y - f.y) / f.s); return (c < 0 || r < 0 || c >= cols || r >= rows) ? -1 : r * cols + c; }

  // ===================== LIGHTS OUT (lightsout) =====================
  const LO_PAT = [
    { n: 'Plus', d: [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]] },
    { n: 'Cross', d: [[0, 0], [1, 1], [-1, -1], [1, -1], [-1, 1]] },
    { n: 'Ring', d: [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]] }
  ];
  function loCells(st, r, c) { const o = []; for (const d of LO_PAT[st.v].d) { const x = c + d[0], y = r + d[1]; if (x >= 0 && x < st.n && y >= 0 && y < st.n) o.push(y * st.n + x); } return o; }
  function loPress(st, i) { for (const j of loCells(st, Math.floor(i / st.n), i % st.n)) st.b[j] ^= 1; }
  function loSolve(st) {
    const N = st.n * st.n, M = [];
    for (let i = 0; i < N; i++) M.push(new Array(N + 1).fill(0));
    for (let j = 0; j < N; j++) for (const i of loCells(st, Math.floor(j / st.n), j % st.n)) M[i][j] = 1;
    for (let i = 0; i < N; i++) M[i][N] = st.b[i];
    const piv = []; let r = 0;
    for (let c = 0; c < N && r < N; c++) {
      let p = -1; for (let i = r; i < N; i++) if (M[i][c]) { p = i; break; }
      if (p < 0) continue;
      const tmp = M[p]; M[p] = M[r]; M[r] = tmp;
      for (let i = 0; i < N; i++) if (i !== r && M[i][c]) for (let k = c; k <= N; k++) M[i][k] ^= M[r][k];
      piv.push(c); r++;
    }
    for (let i = r; i < N; i++) if (M[i][N]) return null;
    const x = new Array(N).fill(0); for (let i = 0; i < piv.length; i++) x[piv[i]] = M[i][N]; return x;
  }
  const LO = {
    hue: 45,
    build(lv, seed) {
      const st = { rs: seed, n: [3, 4, 4, 5, 5, 6, 6][Math.min(lv, 6)], v: lv < 2 ? 0 : (lv % 3), b: [], par: 0 };
      const N = st.n * st.n; st.b = new Array(N).fill(0);
      const k = Math.min(N - 2, 3 + Math.floor(lv * 1.3) + st.n - 3), ids = shuf(Array.from({ length: N }, (_, i) => i), st);
      for (let i = 0; i < k; i++) loPress(st, ids[i]);
      if (!st.b.some(v => v)) loPress(st, ids[0]);
      const s = loSolve(st); st.par = s ? Math.min(k, s.reduce((a, b) => a + b, 0)) : k;
      return st;
    },
    tap(st, x, y, K) {
      const A = K.area(); A.y += 40; A.h -= 40; const f = fit(st.n, st.n, A, 76), i = cellAt(f, st.n, st.n, x, y); if (i < 0) return;
      K.begin(); loPress(st, i); beep(300 + (i % 5) * 60, 500, .06, 'sine', .08);
      K.burst(f.x + (i % st.n + .5) * f.s, f.y + (Math.floor(i / st.n) + .5) * f.s, C.yellow, 6, 90); K.commit();
    },
    done(st) { return !st.b.some(v => v); },
    hint(st) { const s = loSolve(st); if (!s) return null; const i = s.indexOf(1); return i < 0 ? null : { i }; },
    draw(st, K) {
      const A = K.area(); A.y += 40; A.h -= 40; const f = fit(st.n, st.n, A, 76), s = f.s, d = adt(K);
      text('Pattern: ' + LO_PAT[st.v].n + '  (turn every light OFF)', W() / 2, 140, 14, '#ffe9a8', 'center', 800);
      const a = K.anim.b = (K.anim.b && K.anim.b.length === st.b.length) ? K.anim.b : st.b.slice();
      for (let i = 0; i < st.b.length; i++) {
        a[i] += (st.b[i] - a[i]) * Math.min(1, d * 12);
        const x = f.x + (i % st.n) * s, y = f.y + Math.floor(i / st.n) * s, v = a[i];
        if (v > .05) glow(hsl(48, 100, 60), 22 * v);
        rr(x + 3, y + 3, s - 6, s - 6, s * .2, v > .5 ? hsl(46 + 6 * Math.sin(i), 95, 38 + 30 * v) : hsl(225, 30, 14 + 20 * v), 'rgba(255,255,255,' + (.12 + .3 * v) + ')', 1.5);
        noglow();
        if (v > .05) rr(x + s * .2, y + s * .15, s * .6, s * .22, s * .1, 'rgba(255,255,255,' + (.35 * v) + ')');
      }
      if (K.hint) { const i = K.hint.i, pu = .5 + .5 * Math.sin(K.t * 9); strokeCircle(f.x + (i % st.n + .5) * s, f.y + (Math.floor(i / st.n) + .5) * s, s * .38, 'rgba(120,255,200,' + (.4 + .6 * pu) + ')', 4); }
    }
  };
  regOld('lightsout', 'lightsout', 'Lights Out', '💡', 'PUZZLE', 'Every tap flips a pattern of lights. Switch them all off across 6 growing boards with changing patterns, undo and hints.', 6, (g) => lvl(g, LO));

  // ===================== SLIDE TILES (fifteen) =====================
  const DX4 = [0, 1, 0, -1], DY4 = [-1, 0, 1, 0]; // 0 up,1 right,2 down,3 left (empty-cell step)
  const FT = {
    hue: 200,
    build(lv, seed) {
      const n = [3, 3, 4, 4, 4, 5][Math.min(lv, 5)], st = { rs: seed, n, b: [], e: 0, sol: [], par: 0 };
      for (let i = 1; i < n * n; i++) st.b.push(i); st.b.push(0); st.e = n * n - 1;
      const steps = Math.round((n === 3 ? 16 + lv * 4 : n === 4 ? 26 + (lv - 2) * 6 : 44) );
      let last = -1, k = 0;
      while (k < steps || FT.done(st)) {
        const ex = st.e % n, ey = Math.floor(st.e / n), opts = [];
        for (let d = 0; d < 4; d++) { const x = ex + DX4[d], y = ey + DY4[d]; if (x >= 0 && x < n && y >= 0 && y < n && (last < 0 || d !== (last + 2) % 4)) opts.push(d); }
        const d = opts[Math.floor(nxt(st) * opts.length)];
        FT.step(st, d, false); st.sol.push((d + 2) % 4); last = d; k++;
      }
      st.par = st.sol.length; return st;
    },
    step(st, d, track) {
      const n = st.n, ex = st.e % n, ey = Math.floor(st.e / n), nx = ex + DX4[d], ny = ey + DY4[d];
      if (nx < 0 || ny < 0 || nx >= n || ny >= n) return false;
      const ni = ny * n + nx; st.b[st.e] = st.b[ni]; st.b[ni] = 0; st.e = ni;
      if (track) { if (st.sol.length && st.sol[st.sol.length - 1] === d) st.sol.pop(); else st.sol.push((d + 2) % 4); }
      return true;
    },
    tap(st, x, y, K) {
      const A = K.area(), f = fit(st.n, st.n, A, 96), i = cellAt(f, st.n, st.n, x, y); if (i < 0 || i === st.e) return;
      const n = st.n, ex = st.e % n, ey = Math.floor(st.e / n), tx = i % n, ty = Math.floor(i / n);
      if (ex !== tx && ey !== ty) { K.say('Tap a tile in the empty slot\'s row or column'); return; }
      K.begin(); let d = tx > ex ? 1 : tx < ex ? 3 : ty > ey ? 2 : 0, c = 0;
      while (st.e !== i) { FT.step(st, d, true); c++; }
      beep(260 + c * 40, 330, .05, 'square', .06); K.commit();
    },
    dir(st, dx, dy, K) {
      let d = dx > 0 ? 3 : dx < 0 ? 1 : dy > 0 ? 0 : 2; // tile moves (dx,dy) so empty steps opposite
      const n = st.n, ex = st.e % n + DX4[d], ey = Math.floor(st.e / n) + DY4[d]; if (ex < 0 || ey < 0 || ex >= n || ey >= n) return;
      K.begin(); FT.step(st, d, true); beep(280, 330, .04, 'square', .06); K.commit();
    },
    done(st) { for (let i = 0; i < st.b.length - 1; i++) if (st.b[i] !== i + 1) return false; return st.b[st.b.length - 1] === 0; },
    hint(st) { if (!st.sol.length) return null; const d = st.sol[st.sol.length - 1], n = st.n; const ex = st.e % n + DX4[d], ey = Math.floor(st.e / n) + DY4[d]; return { i: ey * n + ex }; },
    draw(st, K) {
      const A = K.area(), f = fit(st.n, st.n, A, 96), s = f.s, n = st.n, d = adt(K);
      rr(f.x - 6, f.y - 6, s * n + 12, s * n + 12, 16, 'rgba(0,0,0,.35)', 'rgba(255,255,255,.15)', 2);
      const P = K.anim.p = K.anim.p || {};
      for (let i = 0; i < st.b.length; i++) {
        const v = st.b[i]; if (!v) continue;
        const tx = i % n, ty = Math.floor(i / n);
        let p = P[v]; if (!p) p = P[v] = { x: tx, y: ty };
        p.x += (tx - p.x) * Math.min(1, d * 16); p.y += (ty - p.y) * Math.min(1, d * 16);
        const x = f.x + p.x * s, y = f.y + p.y * s, ok = v === i + 1, hh = (v / (n * n)) * 300;
        const gr = ctx2d.createLinearGradient(x, y, x, y + s); gr.addColorStop(0, hsl(hh, 70, ok ? 58 : 52)); gr.addColorStop(1, hsl(hh + 20, 70, ok ? 38 : 32));
        rr(x + 3, y + 3, s - 6, s - 6, s * .16, gr, ok ? 'rgba(255,255,255,.9)' : 'rgba(255,255,255,.3)', ok ? 2.5 : 1.5);
        rr(x + s * .12, y + s * .1, s * .76, s * .2, s * .08, 'rgba(255,255,255,.18)');
        text(v, x + s / 2, y + s * .64, s * .42, '#fff', 'center', 900);
      }
      if (K.hint) { const i = K.hint.i, pu = .5 + .5 * Math.sin(K.t * 9); rr(f.x + (i % n) * s + 2, f.y + Math.floor(i / n) * s + 2, s - 4, s - 4, s * .18, null, 'rgba(255,255,120,' + (.4 + .6 * pu) + ')', 4); }
      text('Order the tiles 1 → ' + (n * n - 1) + '. Tap a tile (or swipe) to slide.', W() / 2, f.y + s * n + 30, 13, '#bcd', 'center', 600);
    }
  };
  regOld('fifteen', 'fifteen', 'Slide Tiles', '🔳', 'PUZZLE', 'Slide numbered tiles into order. Boards grow from 3x3 to 5x5; tap a row to slide several tiles, undo, hints and star ratings.', 6, (g) => lvl(g, FT));

  // ===================== TOWER OF HANOI (hanoi) =====================
  function hnMoves(p, k, target, out) {
    if (k < 1) return;
    let from = -1; for (let i = 0; i < 3; i++) if (p[i].indexOf(k) >= 0) from = i;
    if (from === target) { hnMoves(p, k - 1, target, out); return; }
    const other = 3 - from - target;
    hnMoves(p, k - 1, other, out); out.push([from, target]); p[from].pop(); p[target].push(k); hnMoves(p, k - 1, target, out);
  }
  const HN = {
    hue: 270,
    build(lv) {
      const n = Math.min(3 + lv, 8), peg0 = []; for (let i = n; i >= 1; i--) peg0.push(i);
      return { rs: 1, n, pegs: [peg0, [], []], sel: -1, par: Math.pow(2, n) - 1 };
    },
    layout(st, K) { const A = K.area(), cw = A.w / 3; return { A, cw, base: A.y + A.h - 50, dh: Math.min(30, (A.h - 120) / (st.n + 1)) }; },
    tap(st, x, y, K) {
      const L = HN.layout(st, K), p = Math.floor((x - L.A.x) / L.cw); if (p < 0 || p > 2) return;
      if (st.sel < 0) { if (st.pegs[p].length) { st.sel = p; beep(500, 600, .04, 'sine', .07); } return; }
      if (p === st.sel) { st.sel = -1; return; }
      const a = st.pegs[st.sel], b = st.pegs[p], d = a[a.length - 1];
      if (b.length && b[b.length - 1] < d) { K.say('A bigger disk cannot sit on a smaller one'); K.shake(4); beep(150, 100, .1, 'square', .08); st.sel = -1; return; }
      K.begin(); b.push(a.pop()); st.sel = -1; beep(350, 520, .08, 'triangle', .1);
      K.burst(L.A.x + (p + .5) * L.cw, L.base - b.length * L.dh, hsl(d / st.n * 300, 80, 60), 8, 90); K.commit();
    },
    done(st) { return st.pegs[2].length === st.n; },
    hint(st) { const out = []; hnMoves(st.pegs.map(a => a.slice()), st.n, 2, out); return out.length ? { f: out[0][0], t: out[0][1] } : null; },
    draw(st, K) {
      const L = HN.layout(st, K), A = L.A, dh = L.dh, c = ctx2d;
      text('Move the whole tower to the right peg', W() / 2, 140, 14, '#dcf', 'center', 700);
      for (let p = 0; p < 3; p++) {
        const cx = A.x + (p + .5) * L.cw, top = L.base - (st.n + 1) * dh;
        if (p === 2) { rr(cx - L.cw * .46, top - 6, L.cw * .92, L.base - top + 20, 14, 'rgba(120,255,180,.07)', 'rgba(120,255,180,.35)', 1.5); }
        rr(cx - 5, top, 10, L.base - top, 5, '#8a7ab8'); rr(cx - L.cw * .44, L.base, L.cw * .88, 12, 6, '#5a4a88');
        const pk = K.hint && (K.hint.f === p ? 'f' : K.hint.t === p ? 't' : '');
        if (pk) { const pu = .5 + .5 * Math.sin(K.t * 8); text(pk === 'f' ? 'FROM' : 'TO', cx, top - 14, 13, pk === 'f' ? C.yellow : C.green, 'center', 900); c.globalAlpha = .3 + .3 * pu; rr(cx - L.cw * .46, top - 6, L.cw * .92, L.base - top + 20, 14, pk === 'f' ? C.yellow : C.green); c.globalAlpha = 1; }
        const arr = st.pegs[p];
        for (let k = 0; k < arr.length; k++) {
          const v = arr[k], w = 26 + (v / st.n) * (L.cw * .86 - 26), lifted = st.sel === p && k === arr.length - 1;
          const y = lifted ? top - dh - 8 : L.base - (k + 1) * dh, hh = v / st.n * 300;
          const gr = c.createLinearGradient(0, y, 0, y + dh); gr.addColorStop(0, hsl(hh, 80, 62)); gr.addColorStop(1, hsl(hh, 80, 40));
          if (lifted) glow('#fff', 14);
          rr(cx - w / 2, y + 1, w, dh - 3, dh * .35, gr, 'rgba(255,255,255,.4)', 1); noglow();
          text(v, cx, y + dh * .72, Math.min(14, dh * .55), 'rgba(0,0,0,.55)', 'center', 900);
        }
      }
      text('Minimum possible: ' + st.par + ' moves', W() / 2, L.base + 42, 12, '#aab', 'center', 600);
    }
  };
  regOld('hanoi', 'hanoi', 'Tower of Hanoi', '🗼', 'PUZZLE', 'Move the tower with 3 to 8 disks. Optimal-move stars, undo and an optimal-path hint.', 5, (g) => lvl(g, HN));

  // ===================== PIPE MANIA (pipes) =====================
  function rotM(m) { return ((m << 1) | (m >> 3)) & 15; }
  const PX = { 1: 0, 2: 1, 4: 0, 8: -1 }, PY = { 1: -1, 2: 0, 4: 1, 8: 0 }, PO = { 1: 4, 2: 8, 4: 1, 8: 2 };
  function pipeLit(st) {
    const n = st.n, lit = new Array(n * n).fill(false), q = [st.src]; lit[st.src] = true;
    while (q.length) {
      const i = q.pop(), x = i % n, y = Math.floor(i / n);
      for (const b of [1, 2, 4, 8]) if (st.m[i] & b) {
        const nx = x + PX[b], ny = y + PY[b]; if (nx < 0 || ny < 0 || nx >= n || ny >= n) continue;
        const j = ny * n + nx; if (!lit[j] && (st.m[j] & PO[b])) { lit[j] = true; q.push(j); }
      }
    }
    return lit;
  }
  function pipeNeed(st, i) { let m = st.m[i], r = 0; while (m !== st.sol[i] && r < 4) { m = rotM(m); r++; } return r >= 4 ? 0 : r; }
  const PP = {
    hue: 190,
    build(lv, seed) {
      const n = [4, 4, 5, 5, 6, 6, 7, 7, 8][Math.min(lv, 8)], st = { rs: seed, n, m: new Array(n * n).fill(0), sol: null, src: 0, par: 0 };
      st.src = ri(st, 0, n * n - 1);
      const inT = new Array(n * n).fill(false), fr = [st.src]; inT[st.src] = true;
      const cand = [];
      const addC = i => { const x = i % n, y = Math.floor(i / n); for (const b of [1, 2, 4, 8]) { const nx = x + PX[b], ny = y + PY[b]; if (nx >= 0 && ny >= 0 && nx < n && ny < n && !inT[ny * n + nx]) cand.push([i, ny * n + nx, b]); } };
      addC(st.src);
      while (cand.length) {
        const k = nxt(st) < .6 ? cand.length - 1 : Math.floor(nxt(st) * cand.length), e = cand[k]; cand.splice(k, 1);
        if (inT[e[1]]) continue; inT[e[1]] = true; st.m[e[0]] |= e[2]; st.m[e[1]] |= PO[e[2]]; addC(e[1]);
      }
      st.sol = st.m.slice();
      do { for (let i = 0; i < n * n; i++) { const r = ri(st, 0, 3); for (let k = 0; k < r; k++) st.m[i] = rotM(st.m[i]); } } while (pipeLit(st).every(v => v));
      let par = 0; for (let i = 0; i < n * n; i++) par += pipeNeed(st, i); st.par = par; return st;
    },
    tap(st, x, y, K) {
      const f = fit(st.n, st.n, K.area(), 74), i = cellAt(f, st.n, st.n, x, y); if (i < 0) return;
      K.begin(); st.m[i] = rotM(st.m[i]); (K.anim.ra = K.anim.ra || {})[i] = -Math.PI / 2; beep(420, 520, .04, 'triangle', .07); K.commit();
    },
    done(st) { return pipeLit(st).every(v => v); },
    hint(st) { const n = st.n, seen = new Set([st.src]), q = [st.src]; while (q.length) { const i = q.shift(); if (pipeNeed(st, i)) return { i }; for (const b of [1, 2, 4, 8]) if (st.sol[i] & b) { const nx = i % n + PX[b], ny = Math.floor(i / n) + PY[b]; if (nx < 0 || ny < 0 || nx >= n || ny >= n) continue; const j = ny * n + nx; if (!seen.has(j)) { seen.add(j); q.push(j); } } } return null; },
    hudExtra(st, mv) { const l = pipeLit(st).filter(v => v).length; return 'connected ' + l + '/' + st.n * st.n; },
    draw(st, K) {
      const n = st.n, f = fit(n, n, K.area(), 74), s = f.s, d = adt(K), lit = pipeLit(st), c = ctx2d, ra = K.anim.ra = K.anim.ra || {};
      text('Rotate pipes until water reaches every tile', W() / 2, 140, 14, '#cfe', 'center', 700);
      for (let i = 0; i < n * n; i++) {
        const x = f.x + (i % n) * s, y = f.y + Math.floor(i / n) * s, cx = x + s / 2, cy = y + s / 2, m = st.m[i], L = lit[i];
        rr(x + 2, y + 2, s - 4, s - 4, s * .14, L ? 'rgba(40,160,220,.18)' : 'rgba(255,255,255,.05)', 'rgba(255,255,255,.1)', 1);
        let a = ra[i] || 0; if (a) { a += (0 - a) * Math.min(1, d * 14); if (Math.abs(a) < .02) a = 0; ra[i] = a; }
        c.save(); c.translate(cx, cy); c.rotate(a); c.lineCap = 'round';
        for (let pass = 0; pass < 2; pass++) {
          c.lineWidth = pass ? s * .13 : s * .26; c.strokeStyle = pass ? (L ? hsl(190, 95, 62) : hsl(215, 25, 48)) : (L ? hsl(200, 60, 24) : hsl(220, 20, 22));
          if (L && pass) glow('#3cf', 10);
          c.beginPath(); for (const b of [1, 2, 4, 8]) if (m & b) { c.moveTo(0, 0); c.lineTo(PX[b] * s * .5, PY[b] * s * .5); }
          if (!(m & (m - 1))) { c.moveTo(0, 0); c.lineTo(0, 0); }
          c.stroke(); noglow();
        }
        if (!(m & (m - 1))) { c.fillStyle = L ? '#9ef' : '#678'; c.beginPath(); c.arc(0, 0, s * .15, 0, 6.283); c.fill(); }
        c.restore();
        if (i === st.src) { strokeCircle(cx, cy, s * .3, C.gold, 3); text('💧', cx, cy + s * .12, s * .32, '#fff', 'center', 700); }
        if (K.hint && K.hint.i === i) { const pu = .5 + .5 * Math.sin(K.t * 9); rr(x + 3, y + 3, s - 6, s - 6, s * .14, null, 'rgba(255,255,120,' + (.4 + .6 * pu) + ')', 4); }
      }
    }
  };
  regOld('pipes', 'pipes', 'Pipe Mania', '🔧', 'PUZZLE', 'Rotate pipe tiles to route water from the source to every tile. Branching networks up to 8x8 with hints and undo.', 6, (g) => lvl(g, PP));
  /*@@*/
  return { engines: ENG, minis: MINIS, aaa: [] };
})();
