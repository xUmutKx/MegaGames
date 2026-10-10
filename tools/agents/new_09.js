window.__AG_new_09 = (function () {
  const LS = 'mg_new_09_';
  function ld(k, d) { try { const v = localStorage.getItem(LS + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }
  function sv(k, v) { try { localStorage.setItem(LS + k, JSON.stringify(v)); } catch (e) { } }
  function hsl(h, s, l, a) { return 'hsla(' + Math.round(h) + ',' + s + '%,' + l + '%,' + (a === undefined ? 1 : a) + ')'; }
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function inR(x, y, r) { return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h; }
  function rr(x, y, w, h, r, fill, stroke, lw) {
    const c = ctx2d; r = Math.max(0, Math.min(r, w / 2, h / 2));
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw || 2; c.stroke(); }
  }
  function glow(col, b) { ctx2d.shadowColor = col; ctx2d.shadowBlur = b; }
  function noglow() { ctx2d.shadowBlur = 0; }
  function bg(h, t) {
    const c = ctx2d, g = c.createLinearGradient(0, 0, 0, H());
    g.addColorStop(0, hsl(h, 50, 14)); g.addColorStop(1, hsl(h + 50, 55, 4));
    c.fillStyle = g; c.fillRect(0, 0, W(), H());
    for (let i = 0; i < 16; i++) {
      const x = (i * 97) % W(), y = (i * 151 + t * (8 + i % 5) * 4) % H();
      c.fillStyle = hsl(h + 40, 70, 75, .06 + .05 * Math.sin(t * 2 + i)); c.beginPath(); c.arc(x, y, 1.5 + i % 3, 0, 6.283); c.fill();
    }
  }
  function addPop(list, s, x, y, col, size) { list.push({ s: String(s), x, y, col, size: size || 18, life: 1 }); }
  function popTick(list, dt) { for (let i = list.length - 1; i >= 0; i--) { const p = list[i]; p.y -= 36 * dt; p.life -= dt * 1.2; if (p.life <= 0) list.splice(i, 1); } }
  function popDraw(list) { for (const p of list) { ctx2d.globalAlpha = clamp(p.life, 0, 1); text(p.s, p.x, p.y, p.size, p.col, 'center', 900); } ctx2d.globalAlpha = 1; }
  function wrap(s, x, y, maxW, size, col) {
    const words = String(s).split(' '), lines = []; let line = '';
    ctx2d.font = '800 ' + size + 'px system-ui';
    for (const w of words) { const t = line ? line + ' ' + w : w; if (line && ctx2d.measureText(t).width > maxW) { lines.push(line); line = w; } else line = t; }
    if (line) lines.push(line);
    lines.forEach((l, i) => text(l, x, y + i * size * 1.3, size, col, 'center', 800));
    return lines.length;
  }
  // edge-triggered cursor steps from the joystick, with key repeat
  function dirStep(S, dt) {
    const ax = AX(), ay = AY();
    const dx = ax > .6 ? 1 : ax < -.6 ? -1 : 0, dy = ay > .6 ? 1 : ay < -.6 ? -1 : 0;
    S.rep = Math.max(0, (S.rep || 0) - dt);
    const same = S.rdx === dx && S.rdy === dy;
    let ox = 0, oy = 0;
    if ((dx || dy) && (!same || S.rep <= 0)) { ox = dx; oy = dy; S.rep = same ? .16 : .3; }
    S.rdx = dx; S.rdy = dy;
    return { x: ox, y: oy };
  }
  function finish(S, ok, why, key) {
    if (S.fin) return;
    S.fin = { ok, why, t: 0, sent: false };
    if (key) sv(key, Math.max(ld(key, 0), S.done || 0));
    beep(ok ? 500 : 200, ok ? 1100 : 90, .4, ok ? 'triangle' : 'sawtooth', .12);
  }
  function tickEnd(S, g, dt) {
    if (!S.fin) return false;
    S.fin.t += dt;
    if (!S.fin.sent && S.fin.t > 1.3) { S.fin.sent = true; if (S.fin.ok) completeMini(); else miniFail(g, S.fin.why); }
    return true;
  }
  function endCard(S, key) {
    if (!S.fin) return;
    ctx2d.globalAlpha = .72; rect(0, 0, W(), H(), '#03050a'); ctx2d.globalAlpha = 1;
    text(S.fin.ok ? 'GOAL REACHED' : 'GAME OVER', W() / 2, H() * .4, 30, S.fin.ok ? C.gold : C.red, 'center', 900);
    text(S.fin.ok ? 'Sharp recall!' : S.fin.why, W() / 2, H() * .4 + 34, 16, '#dde', 'center', 700);
    text('Best: ' + ld(key, 0), W() / 2, H() * .4 + 62, 14, '#9ab', 'center', 700);
  }
  function lifeDots(x, y, n, max, hue) {
    for (let i = 0; i < max; i++) circle(x + i * 20, y, 6.5, i < n ? hsl(hue, 90, 65) : 'rgba(255,255,255,.18)');
  }
  function bar(x, y, w, h, f, hue) {
    rr(x, y, w, h, h / 2, 'rgba(255,255,255,.12)');
    if (f > 0) rr(x, y, Math.max(h, w * clamp(f, 0, 1)), h, h / 2, hsl(hue, 85, 62));
  }
  function btn(x, y, w, h, label, hue, dim, size) {
    rr(x, y, w, h, 14, dim ? 'rgba(255,255,255,.05)' : hsl(hue, 70, 40, .38), dim ? 'rgba(255,255,255,.1)' : hsl(hue, 90, 66), 2);
    text(label, x + w / 2, y + h / 2 + (size || 18) * .35, size || 18, dim ? '#667' : '#fff', 'center', 900);
  }
  function shakeWrap(S) { return S.shake > 0 ? [rand(-S.shake, S.shake) * .4, rand(-S.shake, S.shake) * .4] : [0, 0]; }
  function baseState(extra) {
    return Object.assign({ done: 0, lives: 3, fin: null, parts: [], pops: [], shake: 0, bgT: 0, rdx: 0, rdy: 0, rep: 0 }, extra || {});
  }
  function tickBase(S, dt) {
    S.bgT += dt; S.shake = Math.max(0, S.shake - dt * 30);
    fxUpdate(S.parts, dt, 140); popTick(S.pops, dt);
  }

  // ============ 1. Glance Grid: memorize symbol placement, then recall ============
  const GL_SYM = ['◆', '●', '▲', '★', '■', '✚', '♠', '✿', '☾'];
  const GL_HUE = [190, 330, 45, 140, 25, 275, 0, 300, 60];
  function gGlance(g) {
    const goal = Math.max(1, g.goal | 0), KEY = 'n09_glance';
    const S = baseState({ phase: 'show', t: 1.6, cells: [], target: null, sel: 4 });
    function geo() { const s = Math.min(104, (W() - 56) / 3); return { s, x0: (W() - s * 3) / 2, y0: Math.max(160, (H() - s * 3) / 2 - 20) }; }
    function newRound() {
      const n = Math.min(9, 3 + Math.floor(S.done / 2));
      const cells = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]).slice(0, n);
      const syms = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]).slice(0, n);
      S.cells = cells.map((cell, k) => ({ cell, sym: syms[k] }));
      S.target = S.cells[Math.floor(Math.random() * n)];
      S.phase = 'show'; S.t = Math.max(.9, 1.7 - S.done * .05);
    }
    function choose(cell) {
      if (S.phase !== 'ask' || S.fin) return;
      const G = geo();
      if (cell === S.target.cell) {
        S.done++; beep(660, 990, .09, 'triangle', .09);
        const x = G.x0 + (cell % 3) * G.s + G.s / 2, y = G.y0 + Math.floor(cell / 3) * G.s + G.s / 2;
        fxBurst(S.parts, x, y, hsl(GL_HUE[S.target.sym], 90, 65), 24, 200); addPop(S.pops, '+1', x, y - 20, C.gold, 22);
        if (S.done >= goal) { finish(S, true, '', KEY); return; }
        newRound();
      } else {
        S.lives--; S.shake = 9; S.phase = 'miss'; S.t = 1.1; beep(220, 80, .25, 'sawtooth', .12);
        if (S.lives <= 0) finish(S, false, 'Out of lives', KEY);
      }
    }
    newRound();
    return {
      pointer(x, y) {
        if (S.phase !== 'ask') return;
        const G = geo(), col = Math.floor((x - G.x0) / G.s), row = Math.floor((y - G.y0) / G.s);
        if (col < 0 || col > 2 || row < 0 || row > 2) return;
        S.sel = row * 3 + col; choose(S.sel);
      },
      update(dt) {
        if (tickEnd(S, g, dt)) return;
        dt = Math.min(dt, .05); tickBase(S, dt);
        if (S.phase === 'show') { S.t -= dt; if (S.t <= 0) S.phase = 'ask'; }
        else if (S.phase === 'ask') {
          const st = dirStep(S, dt), r = Math.floor(S.sel / 3), c = S.sel % 3;
          S.sel = clamp(r + st.y, 0, 2) * 3 + clamp(c + st.x, 0, 2);
          if (pressed('a') || pressed('b') || pressed('c')) choose(S.sel);
        } else if (S.phase === 'miss') { S.t -= dt; if (S.t <= 0 && !S.fin) newRound(); }
        hud(S.done + '/' + goal + ' • Lives ' + S.lives + ' • ' + (S.phase === 'show' ? 'memorize' : 'recall'));
      },
      draw() {
        bg(230, S.bgT);
        const G = geo(), c = ctx2d, [sx, sy] = shakeWrap(S);
        c.save(); c.translate(sx, sy);
        const head = S.phase === 'show' ? 'Memorize where each symbol sits' : S.phase === 'ask' ? 'Where was ' + GL_SYM[S.target.sym] + ' ?' : 'That was at the glowing tile';
        text(head, W() / 2, 146, 17, '#fff', 'center', 800);
        for (let i = 0; i < 9; i++) {
          const x = G.x0 + (i % 3) * G.s + 4, y = G.y0 + Math.floor(i / 3) * G.s + 4, w = G.s - 8;
          const item = S.cells.find(o => o.cell === i), target = S.phase === 'miss' && S.target.cell === i;
          const cur = S.phase === 'ask' && S.sel === i;
          rr(x, y, w, w, 14, target ? 'rgba(120,255,160,.22)' : 'rgba(255,255,255,.07)', cur ? C.gold : 'rgba(255,255,255,.18)', cur ? 3 : 1.5);
          if (item && S.phase !== 'ask') {
            glow(hsl(GL_HUE[item.sym], 90, 60), 14);
            text(GL_SYM[item.sym], x + w / 2, y + w * .68, w * .5, hsl(GL_HUE[item.sym], 90, 68), 'center', 900);
            noglow();
          } else if (S.phase === 'ask') text('?', x + w / 2, y + w * .68, w * .45, 'rgba(255,255,255,.35)', 'center', 900);
        }
        c.restore();
        lifeDots(W() / 2 - 30, H() - 150, S.lives, 3, 0);
        fxDraw(S.parts); popDraw(S.pops); endCard(S, KEY);
      }
    };
  }

  // ============ 2. Bin Drop: sort falling shapes into the matching bin ============
  const BIN_NAMES = ['ROUND', 'BOXY', 'SPIKY'], BIN_HUE = [190, 45, 330];
  function gBinDrop(g) {
    const goal = Math.max(1, g.goal | 0), KEY = 'n09_bindrop';
    const S = baseState({ items: [], spawnT: .6, flash: [0, 0, 0] });
    const FLOOR = () => H() - 200;
    function bx(i) { const bw = (W() - 32 - 16) / 3; return { x: 16 + i * (bw + 8), y: H() - 190, w: bw, h: 70 }; }
    function lowest() { let best = null; for (const it of S.items) if (!best || it.y > best.y) best = it; return best; }
    function sortInto(bin) {
      if (S.fin) return;
      const it = lowest(); if (!it) return;
      S.items.splice(S.items.indexOf(it), 1);
      const b = bx(bin); S.flash[bin] = .3;
      if (it.k === bin) {
        S.done++; beep(600, 900, .08, 'triangle', .09);
        fxBurst(S.parts, it.x, it.y, hsl(BIN_HUE[bin], 90, 66), 18, 200); addPop(S.pops, '+1', it.x, it.y - 22, C.gold, 22);
        if (S.done >= goal) finish(S, true, '', KEY);
      } else {
        S.lives--; S.shake = 8; beep(200, 90, .2, 'sawtooth', .12); addPop(S.pops, 'WRONG BIN', b.x + b.w / 2, b.y - 8, C.red, 15);
        if (S.lives <= 0) finish(S, false, 'Too many wrong bins', KEY);
      }
    }
    return {
      pointer(x, y) { for (let i = 0; i < 3; i++) if (inR(x, y, bx(i))) { sortInto(i); return; } },
      update(dt) {
        if (tickEnd(S, g, dt)) return;
        dt = Math.min(dt, .05); tickBase(S, dt);
        S.flash = S.flash.map(v => Math.max(0, v - dt));
        S.spawnT -= dt;
        if (S.spawnT <= 0) {
          S.spawnT = Math.max(.7, 1.7 - S.done * .04) * rand(.85, 1.15);
          if (S.items.length < 5) S.items.push({ k: randi(0, 2), x: rand(50, W() - 50), y: 140, sp: rand(.9, 1.1) });
        }
        const spd = Math.min(125, 40 + S.done * 3.2);
        for (let i = S.items.length - 1; i >= 0; i--) {
          const it = S.items[i]; it.y += spd * it.sp * dt;
          if (it.y > FLOOR()) {
            S.items.splice(i, 1); S.lives--; S.shake = 8; beep(180, 70, .25, 'sawtooth', .12);
            addPop(S.pops, 'MISSED', it.x, FLOOR() - 10, C.red, 16);
            if (S.lives <= 0) { finish(S, false, 'Too many items missed', KEY); return; }
          }
        }
        if (pressed('a')) sortInto(0);
        if (pressed('b')) sortInto(1);
        if (pressed('c')) sortInto(2);
        hud(S.done + '/' + goal + ' • Lives ' + S.lives + ' • sort the lowest shape');
      },
      draw() {
        bg(200, S.bgT);
        const c = ctx2d, [sx, sy] = shakeWrap(S);
        c.save(); c.translate(sx, sy);
        text('Sort each shape into its bin', W() / 2, 124, 16, '#dfe', 'center', 800);
        const low = lowest();
        for (const it of S.items) {
          const hue = BIN_HUE[it.k], isLow = it === low;
          glow(hsl(hue, 95, 65), isLow ? 22 : 10);
          if (it.k === 0) circle(it.x, it.y, 20, hsl(hue, 90, 66));
          else if (it.k === 1) rr(it.x - 19, it.y - 19, 38, 38, 8, hsl(hue, 90, 60));
          else polygon([[it.x, it.y - 23], [it.x + 22, it.y + 16], [it.x - 22, it.y + 16]], hsl(hue, 90, 66));
          noglow();
          if (isLow) strokeCircle(it.x, it.y, 30, 'rgba(255,255,255,.5)', 2);
        }
        line(16, FLOOR(), W() - 16, FLOOR(), 'rgba(255,90,110,.6)', 2);
        for (let i = 0; i < 3; i++) {
          const b = bx(i), f = S.flash[i];
          rr(b.x, b.y, b.w, b.h, 14, hsl(BIN_HUE[i], 70, 35 + f * 30, .4), hsl(BIN_HUE[i], 90, 66), 2);
          text(BIN_NAMES[i], b.x + b.w / 2, b.y + 30, 15, '#fff', 'center', 900);
          text(['A', 'B', 'C'][i] + ' key', b.x + b.w / 2, b.y + 52, 11, 'rgba(255,255,255,.7)', 'center', 700);
        }
        c.restore();
        lifeDots(W() / 2 - 30, H() - 140, S.lives, 3, 0);
        fxDraw(S.parts); popDraw(S.pops); endCard(S, KEY);
      }
    };
  }

  // ============ 3. Pair Parade: memory pairs with a board timer ============
  const PP_SYM = ['✦', '☀', '☂', '♞', '♣', '♥', '⚑', '⚓', '☘', '✈', '⌘', '❀'];
  function gPairParade(g) {
    const goal = Math.max(1, g.goal | 0), KEY = 'n09_pairs';
    const S = baseState({ matched: 0, lv: 0, cards: [], cols: 4, open: [], check: 0, sel: 0, tl: 0, tmax: 1 });
    function board() {
      const pairs = Math.min(12, 3 + S.lv), ids = [];
      for (let k = 0; k < pairs; k++) { ids.push(k); ids.push(k); }
      shuffle(ids);
      S.cards = ids.map(v => ({ v, a: 0, up: false, done: false }));
      S.cols = S.cards.length === 6 ? 3 : 4;
      S.tmax = 26 + pairs * 4; S.tl = S.tmax; S.open = []; S.check = 0; S.sel = 0;
    }
    function geo() {
      const rows = Math.ceil(S.cards.length / S.cols);
      const cw = Math.min((W() - 32) / S.cols - 10, 92), ch = Math.min(cw * 1.25, (H() - 300) / rows - 10);
      const gw = S.cols * (cw + 10), gh = rows * (ch + 10);
      return { cw, ch, rows, x0: (W() - gw) / 2 + 5, y0: 150 + Math.max(0, (H() - 290 - gh) / 2) };
    }
    function cxy(i, G) { return { x: G.x0 + (i % S.cols) * (G.cw + 10) + G.cw / 2, y: G.y0 + Math.floor(i / S.cols) * (G.ch + 10) + G.ch / 2 }; }
    function tapCard(i) {
      if (S.fin || S.open.length >= 2) return;
      const cd = S.cards[i]; if (!cd || cd.up || cd.done) return;
      cd.up = true; S.open.push(i); beep(480 + S.open.length * 90, 560, .05, 'triangle', .07);
      if (S.open.length === 2) S.check = .6;
    }
    function resolve() {
      const [a, b] = S.open; S.open = [];
      const A = S.cards[a], B = S.cards[b];
      if (A.v === B.v) {
        A.done = B.done = true; S.matched++; S.done = S.matched; beep(700, 1000, .12, 'triangle', .1);
        const G = geo(), p = cxy(a, G), q = cxy(b, G);
        fxBurst(S.parts, (p.x + q.x) / 2, (p.y + q.y) / 2, hsl(A.v * 30, 90, 65), 26, 220);
        addPop(S.pops, '+1 PAIR', (p.x + q.x) / 2, (p.y + q.y) / 2 - 16, C.gold, 18);
        if (S.matched >= goal) { finish(S, true, '', KEY); return; }
        if (S.cards.every(cd => cd.done)) { S.lv++; board(); }
      } else {
        A.up = B.up = false; S.shake = 4; beep(200, 130, .12, 'sine', .08);
      }
    }
    board();
    return {
      pointer(x, y) {
        const G = geo();
        for (let i = 0; i < S.cards.length; i++) { const p = cxy(i, G); if (inR(x, y, { x: p.x - G.cw / 2, y: p.y - G.ch / 2, w: G.cw, h: G.ch })) { S.sel = i; tapCard(i); return; } }
      },
      update(dt) {
        if (tickEnd(S, g, dt)) return;
        dt = Math.min(dt, .05); tickBase(S, dt);
        S.tl -= dt;
        if (S.tl <= 0) { finish(S, false, 'Ran out of time', KEY); return; }
        if (S.open.length === 2) { S.check -= dt; if (S.check <= 0) { resolve(); if (S.fin) return; } }
        for (const cd of S.cards) { const tgt = cd.up || cd.done ? 1 : 0; cd.a += (tgt - cd.a) * Math.min(1, dt * 10); }
        const st = dirStep(S, dt), G = geo(), r = Math.floor(S.sel / S.cols), c = S.sel % S.cols;
        const nr = clamp(r + st.y, 0, G.rows - 1), nc = clamp(c + st.x, 0, S.cols - 1), ns = nr * S.cols + nc;
        S.sel = ns < S.cards.length ? ns : S.sel;
        if (pressed('a') || pressed('b') || pressed('c')) tapCard(S.sel);
        hud(S.matched + '/' + goal + ' • Board ' + (S.lv + 1) + ' • ' + Math.ceil(S.tl) + 's');
      },
      draw() {
        bg(260, S.bgT);
        const c = ctx2d, G = geo(), [sx, sy] = shakeWrap(S);
        c.save(); c.translate(sx, sy);
        text('Find every matching pair before the clock runs out', W() / 2, 128, 15, '#eef', 'center', 800);
        bar(40, 138, W() - 80, 6, S.tl / S.tmax, S.tl < 8 ? 0 : 190);
        for (let i = 0; i < S.cards.length; i++) {
          const cd = S.cards[i], p = cxy(i, G), sc = Math.abs(2 * cd.a - 1), face = cd.a > .5;
          c.save(); c.translate(p.x, p.y); c.scale(Math.max(.05, sc), 1);
          const w = G.cw, h = G.ch, hue = cd.v * 30;
          if (face) {
            rr(-w / 2, -h / 2, w, h, 12, cd.done ? hsl(hue, 60, 30) : hsl(hue, 80, 52), cd.done ? C.green : 'rgba(255,255,255,.4)', 2);
            glow(hsl(hue, 100, 70), cd.done ? 0 : 14);
            text(PP_SYM[cd.v], 0, h * .17, h * .5, '#fff', 'center', 900);
            noglow();
          } else {
            rr(-w / 2, -h / 2, w, h, 12, 'rgba(40,30,80,.9)', S.sel === i ? C.gold : 'rgba(255,255,255,.25)', S.sel === i ? 3 : 1.5);
            text('?', 0, h * .15, h * .42, 'rgba(255,255,255,.3)', 'center', 900);
          }
          c.restore();
        }
        c.restore();
        fxDraw(S.parts); popDraw(S.pops); endCard(S, KEY);
      }
    };
  }

  // ============ 4. Sum Rush: quick arithmetic with a per-question clock ============
  function gSumRush(g) {
    const goal = Math.max(1, g.goal | 0), KEY = 'n09_sumrush';
    const S = baseState({ combo: 0, q: null, opts: [], tl: 1, tmax: 1, flashI: -1, flashT: 0 });
    function mkQ() {
      const lv = S.done, ops = lv < 5 ? ['+'] : lv < 12 ? ['+', '-'] : ['+', '-', '×'];
      const op = pick(ops), hi = Math.min(60, 9 + Math.floor(lv / 2) * 2);
      let a, b, ans;
      if (op === '+') { a = randi(2, hi); b = randi(2, hi); ans = a + b; }
      else if (op === '-') { a = randi(4, hi + 4); b = randi(1, a - 1); ans = a - b; }
      else { a = randi(2, 6 + Math.floor(lv / 4)); b = randi(2, 9); ans = a * b; }
      const opts = [ans];
      while (opts.length < 3) { const v = ans + randi(1, 4) * pick([-1, 1]) * (op === '×' ? randi(1, 3) : 1); if (v >= 0 && opts.indexOf(v) < 0) opts.push(v); }
      S.opts = shuffle(opts); S.q = { text: a + ' ' + op + ' ' + b + ' = ?', ans };
      S.tmax = Math.max(2.4, 6 - lv * .12); S.tl = S.tmax; S.flashI = -1;
    }
    function answer(i) {
      if (S.fin || S.flashI >= 0) return;
      const T = tiles(); S.flashI = i; S.flashT = .35;
      if (S.opts[i] === S.q.ans) {
        S.done++; S.combo++; beep(640 + S.combo * 40, 900, .1, 'triangle', .09);
        fxBurst(S.parts, T[i].x + T[i].w / 2, T[i].y + T[i].h / 2, hsl(140, 90, 65), 22, 220);
        addPop(S.pops, S.combo > 1 ? 'x' + S.combo + ' combo' : '+1', T[i].x + T[i].w / 2, T[i].y - 6, C.gold, 20);
        if (S.done >= goal) { S.flashT = .35; finish(S, true, '', KEY); return; }
      } else wrongHit();
      S.pendingNext = true;
    }
    function wrongHit() {
      S.lives--; S.combo = 0; S.shake = 9; beep(220, 80, .25, 'sawtooth', .12);
      if (S.lives <= 0) finish(S, false, 'Out of lives', KEY);
    }
    function tiles() {
      const tw = Math.min(112, (W() - 48) / 3 - 8), y = H() * .56, x0 = (W() - tw * 3 - 16) / 2;
      return [0, 1, 2].map(i => ({ x: x0 + i * (tw + 8), y, w: tw, h: 92 }));
    }
    mkQ();
    return {
      pointer(x, y) { const T = tiles(); for (let i = 0; i < 3; i++) if (inR(x, y, T[i])) { answer(i); return; } },
      update(dt) {
        if (tickEnd(S, g, dt)) return;
        dt = Math.min(dt, .05); tickBase(S, dt);
        if (S.flashT > 0) {
          S.flashT -= dt;
          if (S.flashT <= 0 && S.pendingNext) { S.pendingNext = false; if (!S.fin) mkQ(); }
          return;
        }
        if (S.flashI < 0) {
          S.tl -= dt;
          if (S.tl <= 0) { S.combo = 0; S.flashI = 3; S.flashT = .45; S.pendingNext = true; S.shake = 9; wrongHit(); }
          if (pressed('a')) answer(0);
          if (pressed('b')) answer(1);
          if (pressed('c')) answer(2);
        }
        hud(S.done + '/' + goal + ' • Lives ' + S.lives + ' • ' + Math.ceil(S.tl * 10) / 10 + 's');
      },
      draw() {
        bg(300, S.bgT);
        const c = ctx2d, [sx, sy] = shakeWrap(S);
        c.save(); c.translate(sx, sy);
        text('Answer before the clock drains', W() / 2, 146, 15, '#dde', 'center', 700);
        wrap(S.q.text, W() / 2, H() * .38, W() - 40, 46, '#fff');
        bar(40, H() * .38 + 40, W() - 80, 8, S.tl / S.tmax, S.tl / S.tmax < .3 ? 0 : 190);
        const T = tiles();
        for (let i = 0; i < 3; i++) {
          const t = T[i], right = S.flashI === i && S.opts[i] === S.q.ans;
          const bad = S.flashI === i && S.opts[i] !== S.q.ans;
          const hue = right ? 140 : bad ? 0 : 250;
          rr(t.x, t.y, t.w, t.h, 16, hsl(hue, 70, 40, .35), hsl(hue, 90, 66), 2);
          glow(hsl(hue, 90, 60), 12);
          text(String(S.opts[i]), t.x + t.w / 2, t.y + t.h / 2 + 16, 36, '#fff', 'center', 900);
          noglow();
          text(['A', 'B', 'C'][i], t.x + t.w / 2, t.y + t.h + 20, 13, 'rgba(255,255,255,.6)', 'center', 800);
        }
        c.restore();
        lifeDots(W() / 2 - 30, H() - 160, S.lives, 3, 0);
        fxDraw(S.parts); popDraw(S.pops); endCard(S, KEY);
      }
    };
  }

  // ============ 5. Odd Shade: spot the tile whose hue is off ============
  function gOddShade(g) {
    const goal = Math.max(1, g.goal | 0), KEY = 'n09_oddshade';
    const S = baseState({ cols: 2, odd: 0, hue: 0, diff: 20, tl: 1, tmax: 1, sel: 0, pending: 0 });
    function mk() {
      S.cols = Math.min(5, 2 + Math.floor(S.done / 4));
      const n = S.cols * S.cols;
      S.hue = rand(0, 360); S.diff = Math.max(6, 30 - S.done * 1.3);
      S.odd = randi(0, n - 1); S.sel = 0;
      S.tmax = Math.max(2.6, 5.5 - S.done * .1); S.tl = S.tmax; S.pending = 0;
    }
    function geo() {
      const n = S.cols, th = Math.min((W() - 40) / n - 10, 110, (H() - 360) / n);
      return { th, x0: (W() - n * (th + 10)) / 2 + 5, y0: 170 + Math.max(0, (H() - 300 - n * (th + 10)) / 2) };
    }
    function pickTile(i) {
      if (S.fin || S.pending) return;
      const G = geo(), c = i % S.cols, r = Math.floor(i / S.cols);
      const x = G.x0 + c * (G.th + 10) + G.th / 2, y = G.y0 + r * (G.th + 10) + G.th / 2;
      if (i === S.odd) {
        S.done++; S.pending = .3; beep(700, 1000, .09, 'triangle', .09);
        fxBurst(S.parts, x, y, hsl(S.hue, 90, 60), 26, 220); addPop(S.pops, '+1', x, y - 30, C.gold, 22);
        if (S.done >= goal) finish(S, true, '', KEY);
      } else {
        S.lives--; S.shake = 8; S.pending = .45; beep(200, 90, .2, 'sawtooth', .1);
        if (S.lives <= 0) finish(S, false, 'Out of lives', KEY);
      }
      S.lastOdd = S.odd;
    }
    mk();
    return {
      pointer(x, y) {
        const G = geo(), n = S.cols;
        for (let i = 0; i < n * n; i++) {
          const c = i % n, r = Math.floor(i / n);
          if (inR(x, y, { x: G.x0 + c * (G.th + 10), y: G.y0 + r * (G.th + 10), w: G.th, h: G.th })) { S.sel = i; pickTile(i); return; }
        }
      },
      update(dt) {
        if (tickEnd(S, g, dt)) return;
        dt = Math.min(dt, .05); tickBase(S, dt);
        if (S.pending > 0) { S.pending -= dt; if (S.pending <= 0 && !S.fin) mk(); return; }
        S.tl -= dt;
        if (S.tl <= 0) { S.lives--; S.shake = 8; S.pending = .45; beep(200, 90, .2, 'sawtooth', .1); if (S.lives <= 0) finish(S, false, 'Time ran out', KEY); return; }
        const st = dirStep(S, dt), n = S.cols, r = Math.floor(S.sel / n), c = S.sel % n;
        S.sel = clamp(r + st.y, 0, n - 1) * n + clamp(c + st.x, 0, n - 1);
        if (pressed('a') || pressed('b') || pressed('c')) pickTile(S.sel);
        hud(S.done + '/' + goal + ' • Lives ' + S.lives + ' • ' + Math.ceil(S.tl * 10) / 10 + 's');
      },
      draw() {
        bg(S.hue, S.bgT);
        const c = ctx2d, G = geo(), n = S.cols, [sx, sy] = shakeWrap(S);
        c.save(); c.translate(sx, sy);
        text('One tile has a different shade. Tap it!', W() / 2, 146, 16, '#fff', 'center', 800);
        bar(40, 156, W() - 80, 6, S.tl / S.tmax, S.tl / S.tmax < .3 ? 0 : 190);
        for (let i = 0; i < n * n; i++) {
          const cc = i % n, r = Math.floor(i / n), x = G.x0 + cc * (G.th + 10), y = G.y0 + r * (G.th + 10);
          const isOdd = i === S.odd, reveal = S.pending > 0 && isOdd, hue = isOdd ? S.hue + S.diff : S.hue;
          const cur = S.sel === i && !S.pending;
          rr(x, y, G.th, G.th, 16, hsl(hue, 72, 52), cur ? C.gold : hsl(hue, 80, 75, .35), cur ? 3 : 1.5);
          if (reveal) strokeCircle(x + G.th / 2, y + G.th / 2, G.th * .42, 'rgba(255,255,255,.8)', 3);
        }
        c.restore();
        lifeDots(W() / 2 - 30, H() - 150, S.lives, 3, 0);
        fxDraw(S.parts); popDraw(S.pops); endCard(S, KEY);
      }
    };
  }

  // ============ 6. Flash Deck: flashcards, flip then rate ============
  const FACTS = [
    ['Chemical symbol for gold', 'Au'], ['Largest planet in the solar system', 'Jupiter'],
    ['Powerhouse of the cell', 'Mitochondrion'], ['Boiling point of water at sea level', '100 °C'],
    ['Adult human bones (approx.)', '206'], ['Smallest prime number', '2'],
    ['Square root of 144', '12'], ['Capital of Australia', 'Canberra'],
    ['Author of "Pride and Prejudice"', 'Jane Austen'], ['Hardest natural mineral', 'Diamond'],
    ['Gas plants absorb from the air', 'Carbon dioxide'], ['Currency of Japan', 'Yen'],
    ['Longest river in Africa', 'Nile'], ['Atomic number of hydrogen', '1'],
    ['Tallest mountain above sea level', 'Mount Everest'], ['Colors of light in RGB', 'Red, green, blue'],
    ['Days in a leap year', '366'], ['Organ that pumps blood', 'Heart'],
    ['Sides on a hexagon', '6'], ['Freezing point of water', '0 °C'],
    ['Continents on Earth', '7'], ['Most spoken native language', 'Mandarin Chinese'],
    ['Inventor credited with the telephone', 'Alexander Graham Bell'], ['Speed of sound in air (approx.)', '343 m/s'],
    ['Metal that is liquid at room temperature', 'Mercury'], ['Study of living things', 'Biology']
  ];
  function gFlashDeck(g) {
    const goal = Math.max(1, g.goal | 0), KEY = 'n09_flashdeck', MAXMISS = 6;
    const S = baseState({ queue: shuffle(FACTS.map((_, i) => i)), missed: 0, known: 0, flipped: false, fa: 0, slide: 0, slideDir: 0 });
    function cardRect() { return { x: 24, y: 152, w: W() - 48, h: Math.max(260, H() - 430) }; }
    function btnRects() { const y = H() - 196; return { no: { x: 24, y, w: W() / 2 - 32, h: 60 }, yes: { x: W() / 2 + 8, y, w: W() / 2 - 32, h: 60 } }; }
    function nextCard() { S.flipped = false; S.fa = 0; if (S.queue.length === 0) { S.queue = shuffle(FACTS.map((_, i) => i)); } }
    function flip() { if (S.fin || S.flipped || S.slideDir) return; S.flipped = true; beep(420, 640, .08, 'triangle', .07); }
    function rate(knew) {
      if (S.fin || !S.flipped || S.slideDir) return;
      const idx = S.queue[0];
      S.slideDir = knew ? 1 : -1; S.slide = 0; S.pendingKnew = knew; S.pendingIdx = idx;
      beep(knew ? 720 : 220, knew ? 980 : 120, .12, knew ? 'triangle' : 'sawtooth', .08);
    }
    function commit() {
      const knew = S.pendingKnew, idx = S.pendingIdx;
      S.queue.shift();
      if (knew) {
        S.known++; S.done = S.known;
        const cr = cardRect(); fxBurst(S.parts, W() / 2, cr.y + cr.h / 2, hsl(140, 90, 65), 20, 200);
        if (S.known >= goal) { finish(S, true, '', KEY); return; }
      } else {
        S.missed++; S.shake = 6;
        S.queue.splice(Math.min(S.queue.length, 3), 0, idx);
        if (S.missed >= MAXMISS) { finish(S, false, 'Too many misses', KEY); return; }
      }
      S.slideDir = 0; nextCard();
    }
    nextCard();
    return {
      pointer(x, y) {
        if (S.slideDir || S.fin) return;
        const B = btnRects();
        if (!S.flipped) { if (inR(x, y, cardRect())) flip(); return; }
        if (inR(x, y, B.no)) rate(false); else if (inR(x, y, B.yes)) rate(true);
      },
      swipe(dx, dy) {
        if (!S.flipped || S.slideDir || S.fin) return;
        if (Math.abs(dx) > Math.abs(dy)) rate(dx > 0);
      },
      update(dt) {
        if (tickEnd(S, g, dt)) return;
        dt = Math.min(dt, .05); tickBase(S, dt);
        S.fa += ((S.flipped ? 1 : 0) - S.fa) * Math.min(1, dt * 9);
        if (S.slideDir) { S.slide += dt * 3.2; if (S.slide >= 1) commit(); }
        else {
          if (pressed('a') && !S.flipped) flip();
          else if (S.flipped) { if (pressed('b')) rate(true); if (pressed('c')) rate(false); }
          else if (pressed('b') || pressed('c')) flip();
        }
        hud(S.known + '/' + goal + ' • Misses ' + S.missed + '/' + MAXMISS + ' • ' + S.queue.length + ' left');
      },
      draw() {
        bg(270, S.bgT);
        const c = ctx2d, cr = cardRect(), B = btnRects(), [sx, sy] = shakeWrap(S);
        c.save(); c.translate(sx, sy);
        const sl = S.slideDir ? S.slide : 0, off = S.slideDir * sl * (W() * .9), rot = S.slideDir * sl * .25;
        c.translate(off, 0); c.translate(W() / 2, cr.y + cr.h / 2); c.rotate(rot); c.translate(-W() / 2, -(cr.y + cr.h / 2));
        const edge = Math.abs(S.fa * 2 - 1), showA = S.fa > .5;
        c.save(); c.translate(W() / 2, cr.y + cr.h / 2); c.scale(Math.max(.06, edge), 1); c.translate(-W() / 2, -(cr.y + cr.h / 2));
        const face = showA ? hsl(160, 60, 26) : hsl(265, 55, 30);
        rr(cr.x, cr.y, cr.w, cr.h, 22, face, 'rgba(255,255,255,.35)', 2);
        const idx = S.queue[0] !== undefined ? S.queue[0] : 0, fact = FACTS[idx];
        if (!showA) {
          text('QUESTION', W() / 2, cr.y + 40, 13, 'rgba(255,255,255,.55)', 'center', 800);
          wrap(fact[0], W() / 2, cr.y + cr.h / 2 - 10, cr.w - 50, 24, '#fff');
          text('tap to reveal', W() / 2, cr.y + cr.h - 26, 13, 'rgba(255,255,255,.5)', 'center', 700);
        } else {
          text('ANSWER', W() / 2, cr.y + 40, 13, 'rgba(255,255,255,.55)', 'center', 800);
          glow(hsl(140, 100, 70), 12);
          wrap(fact[1], W() / 2, cr.y + cr.h / 2 - 10, cr.w - 50, 30, C.gold);
          noglow();
        }
        c.restore();
        c.restore();
        if (S.flipped) {
          btn(B.no.x, B.no.y, B.no.w, B.no.h, '✗ Missed', 0, !!S.slideDir);
          btn(B.yes.x, B.yes.y, B.yes.w, B.yes.h, '✓ Knew it', 140, !!S.slideDir);
        } else text('Tap the card to flip it', W() / 2, B.no.y + 36, 15, 'rgba(255,255,255,.6)', 'center', 700);
        c.restore();
        fxDraw(S.parts); popDraw(S.pops); endCard(S, KEY);
      }
    };
  }

  // ============ 7. Ink Clash: name the ink color, not the word ============
  const INK_NAMES = ['RED', 'BLUE', 'GREEN', 'YELLOW'], INK_HEX = { RED: '#ff5570', BLUE: '#4da3ff', GREEN: '#55ff9a', YELLOW: '#ffe36e' }, INK_HUE = { RED: 0, BLUE: 215, GREEN: 140, YELLOW: 50 };
  function gInkClash(g) {
    const goal = Math.max(1, g.goal | 0), KEY = 'n09_inkclash';
    const S = baseState({ word: '', ink: '', opts: [], tl: 1, tmax: 1, sel: 0, pending: 0 });
    function mk() {
      S.word = pick(INK_NAMES);
      S.ink = Math.random() < .3 ? S.word : pick(INK_NAMES.filter(n => n !== S.word));
      const others = shuffle(INK_NAMES.filter(n => n !== S.ink)).slice(0, 2);
      S.opts = shuffle([S.ink].concat(others));
      S.tmax = Math.max(1.5, 2.8 - S.done * .05); S.tl = S.tmax; S.pending = 0; S.sel = 0;
    }
    function bt(i) { const w = Math.min(112, (W() - 48) / 3 - 8), x0 = (W() - w * 3 - 16) / 2; return { x: x0 + i * (w + 8), y: H() * .66, w, h: 70 }; }
    function choose(i) {
      if (S.fin || S.pending > 0) return;
      const name = S.opts[i], b = bt(i);
      if (name === S.ink) {
        S.done++; S.pending = .25; beep(700, 1000, .08, 'triangle', .09);
        fxBurst(S.parts, b.x + b.w / 2, b.y + b.h / 2, hsl(INK_HUE[name], 90, 62), 20, 200); addPop(S.pops, '+1', b.x + b.w / 2, b.y - 8, C.gold, 20);
        if (S.done >= goal) finish(S, true, '', KEY);
      } else {
        S.lives--; S.shake = 9; S.pending = .45; beep(200, 90, .2, 'sawtooth', .12);
        if (S.lives <= 0) finish(S, false, 'Out of lives', KEY);
      }
      S.lastWrong = name !== S.ink ? i : -1;
    }
    mk();
    return {
      pointer(x, y) { for (let i = 0; i < 3; i++) if (inR(x, y, bt(i))) { S.sel = i; choose(i); return; } },
      update(dt) {
        if (tickEnd(S, g, dt)) return;
        dt = Math.min(dt, .05); tickBase(S, dt);
        if (S.pending > 0) { S.pending -= dt; if (S.pending <= 0 && !S.fin) mk(); return; }
        S.tl -= dt;
        if (S.tl <= 0) { S.lives--; S.shake = 9; S.pending = .45; beep(200, 90, .2, 'sawtooth', .12); if (S.lives <= 0) finish(S, false, 'Too slow', KEY); return; }
        const st = dirStep(S, dt);
        S.sel = clamp(S.sel + st.x, 0, 2);
        if (pressed('a')) choose(0);
        if (pressed('b')) choose(1);
        if (pressed('c')) choose(2);
        hud(S.done + '/' + goal + ' • Lives ' + S.lives + ' • name the ink');
      },
      draw() {
        bg(250, S.bgT);
        const c = ctx2d, [sx, sy] = shakeWrap(S);
        c.save(); c.translate(sx, sy);
        text('Tap the INK color, ignore the word', W() / 2, 146, 16, '#fff', 'center', 800);
        bar(40, 158, W() - 80, 6, S.tl / S.tmax, S.tl / S.tmax < .3 ? 0 : 190);
        glow(INK_HEX[S.ink], 24);
        text(S.word, W() / 2, H() * .42, 70, INK_HEX[S.ink], 'center', 900);
        noglow();
        for (let i = 0; i < 3; i++) {
          const b = bt(i), name = S.opts[i], wrong = S.lastWrong === i && S.pending > 0;
          rr(b.x, b.y, b.w, b.h, 14, wrong ? 'rgba(255,85,112,.35)' : 'rgba(255,255,255,.1)', S.sel === i ? C.gold : 'rgba(255,255,255,.3)', S.sel === i ? 3 : 1.5);
          text(name, b.x + b.w / 2, b.y + b.h / 2 + 6, 13, '#fff', 'center', 900);
          text(['A', 'B', 'C'][i], b.x + b.w / 2, b.y + b.h + 18, 12, 'rgba(255,255,255,.55)', 'center', 800);
        }
        c.restore();
        lifeDots(W() / 2 - 30, H() - 150, S.lives, 3, 0);
        fxDraw(S.parts); popDraw(S.pops); endCard(S, KEY);
      }
    };
  }

  // ============ 8. Ladder Scan: tap numbers in ascending order ============
  function gLadderScan(g) {
    const goal = Math.max(1, g.goal | 0), KEY = 'n09_ladder';
    const S = baseState({ n: 4, cells: [], next: 1, tl: 1, tmax: 1, sel: 0, boards: 0 });
    function mk() {
      S.n = Math.min(6, 4 + Math.floor(S.done / 2));
      const N = S.n * S.n, vals = shuffle(Array.from({ length: N }, (_, i) => i + 1));
      S.cells = vals.map(v => ({ v, hit: false, bad: 0 }));
      S.next = 1; S.tmax = 6 + N * 1.1; S.tl = S.tmax; S.sel = 0;
    }
    function geo() {
      const n = S.n, s = Math.min((W() - 40) / n - 8, 88, (H() - 330) / n - 8);
      return { s, x0: (W() - n * (s + 8)) / 2 + 4, y0: 170 };
    }
    function tap(i) {
      if (S.fin) return;
      const cell = S.cells[i]; if (!cell || cell.hit) return;
      const G = geo(), x = G.x0 + (i % S.n) * (G.s + 8) + G.s / 2, y = G.y0 + Math.floor(i / S.n) * (G.s + 8) + G.s / 2;
      if (cell.v === S.next) {
        cell.hit = true; S.next++; beep(480 + S.next * 12, 620 + S.next * 12, .05, 'triangle', .07);
        fxBurst(S.parts, x, y, hsl(120 + S.next * 6, 90, 62), 10, 150);
        if (S.next > S.n * S.n) {
          S.done++; beep(600, 1200, .25, 'triangle', .1); addPop(S.pops, 'CLEARED', W() / 2, H() * .85, C.gold, 22);
          if (S.done >= goal) { finish(S, true, '', KEY); return; }
          mk();
        }
      } else {
        cell.bad = .3; S.tl -= 2; S.shake = 6; beep(180, 100, .15, 'sawtooth', .08); addPop(S.pops, '-2s', x, y - 10, C.red, 18);
        if (S.tl <= 0) finish(S, false, 'Time is up', KEY);
      }
    }
    mk();
    return {
      pointer(x, y) {
        const G = geo();
        for (let i = 0; i < S.cells.length; i++) {
          if (inR(x, y, { x: G.x0 + (i % S.n) * (G.s + 8), y: G.y0 + Math.floor(i / S.n) * (G.s + 8), w: G.s, h: G.s })) { S.sel = i; tap(i); return; }
        }
      },
      update(dt) {
        if (tickEnd(S, g, dt)) return;
        dt = Math.min(dt, .05); tickBase(S, dt);
        for (const cell of S.cells) if (cell.bad > 0) cell.bad -= dt;
        S.tl -= dt;
        if (S.tl <= 0) { finish(S, false, 'Time is up', KEY); return; }
        const st = dirStep(S, dt), n = S.n, r = Math.floor(S.sel / n), c = S.sel % n;
        S.sel = clamp(r + st.y, 0, n - 1) * n + clamp(c + st.x, 0, n - 1);
        if (pressed('a') || pressed('b') || pressed('c')) tap(S.sel);
        hud(S.done + '/' + goal + ' • Next ' + Math.min(S.next, S.n * S.n) + ' • ' + Math.ceil(S.tl) + 's');
      },
      draw() {
        bg(160, S.bgT);
        const c = ctx2d, G = geo(), n = S.n, [sx, sy] = shakeWrap(S);
        c.save(); c.translate(sx, sy);
        text('Tap 1, 2, 3... in order as fast as you can', W() / 2, 146, 15, '#dfe', 'center', 800);
        bar(40, 156, W() - 80, 6, S.tl / S.tmax, S.tl / S.tmax < .25 ? 0 : 150);
        for (let i = 0; i < n * n; i++) {
          const cell = S.cells[i], x = G.x0 + (i % n) * (G.s + 8), y = G.y0 + Math.floor(i / n) * (G.s + 8);
          const isNext = !cell.hit && cell.v === S.next, cur = S.sel === i;
          const hue = cell.hit ? 140 : cell.bad > 0 ? 0 : isNext ? 50 : 200;
          rr(x, y, G.s, G.s, 14, cell.hit ? hsl(140, 60, 28, .6) : hsl(hue, 60, 36, .5), cur ? C.gold : hsl(hue, 80, 66, .6), cur ? 3 : 1.5);
          if (isNext) glow('#fd6', 12);
          text(String(cell.v), x + G.s / 2, y + G.s / 2 + G.s * .17, G.s * .42, cell.hit ? 'rgba(255,255,255,.35)' : '#fff', 'center', 900);
          noglow();
        }
        c.restore();
        fxDraw(S.parts); popDraw(S.pops); endCard(S, KEY);
      }
    };
  }

  // ============ 9. Echo Tiles: repeat a growing light sequence ============
  const ECHO_HUE = [330, 190, 50, 140];
  function gEchoTiles(g) {
    const goal = Math.max(1, g.goal | 0), KEY = 'n09_echo';
    const S = baseState({ seq: [], phase: 'show', pk: 0, pb: 0, ii: 0, lit: -1, sel: 0, pause: 0, flashT: 0, flashI: -1 });
    function addStep() { S.seq.push(randi(0, 3)); }
    function startShow() { S.phase = 'show'; S.pk = 0; S.pb = 0; S.lit = -1; }
    function tiles() {
      const s = Math.min((W() - 80) / 2, 140), x0 = (W() - s * 2 - 14) / 2, y0 = Math.max(170, (H() - s * 2 - 14) / 2 - 30);
      return [0, 1, 2, 3].map(i => ({ x: x0 + (i % 2) * (s + 14), y: y0 + Math.floor(i / 2) * (s + 14), w: s, h: s }));
    }
    function press(t) {
      if (S.fin || S.phase !== 'input') return;
      S.flashI = t; S.flashT = .2; beep(360 + t * 90, 360 + t * 90 + 40, .12, 'sine', .1);
      if (t === S.seq[S.ii]) {
        S.ii++;
        if (S.ii >= S.seq.length) {
          S.done++; S.phase = 'pause'; S.pause = .7; beep(700, 1200, .2, 'triangle', .1);
          const T = tiles()[t]; fxBurst(S.parts, T.x + T.w / 2, T.y + T.h / 2, hsl(ECHO_HUE[t], 90, 65), 30, 240);
          if (S.done >= goal) finish(S, true, '', KEY);
          else addPop(S.pops, 'Round ' + (S.done + 1), W() / 2, H() * .8, C.gold, 18);
        }
      } else {
        S.lives--; S.shake = 9; S.phase = 'pause'; S.pause = 1.0; S.replay = true; beep(200, 80, .3, 'sawtooth', .12);
        if (S.lives <= 0) finish(S, false, 'Wrong tile', KEY);
      }
    }
    addStep(); addStep(); startShow();
    return {
      pointer(x, y) { const T = tiles(); for (let i = 0; i < 4; i++) if (inR(x, y, T[i])) { S.sel = i; press(i); return; } },
      update(dt) {
        if (tickEnd(S, g, dt)) return;
        dt = Math.min(dt, .05); tickBase(S, dt);
        S.flashT = Math.max(0, S.flashT - dt);
        if (S.phase === 'show') {
          S.pb += dt;
          if (S.pb < .6) S.lit = S.pb < .42 ? S.seq[S.pk] : -1;
          else { S.pb = 0; S.pk++; S.lit = -1; if (S.pk >= S.seq.length) { S.phase = 'input'; S.ii = 0; } }
        } else if (S.phase === 'pause') {
          S.pause -= dt;
          if (S.pause <= 0 && !S.fin) {
            if (S.replay) { S.replay = false; startShow(); }
            else { addStep(); startShow(); }
          }
        } else if (S.phase === 'input') {
          const st = dirStep(S, dt), r = Math.floor(S.sel / 2), c = S.sel % 2;
          S.sel = clamp(r + st.y, 0, 1) * 2 + clamp(c + st.x, 0, 1);
          if (pressed('a') || pressed('b') || pressed('c')) press(S.sel);
        }
        hud(S.done + '/' + goal + ' • Lives ' + S.lives + ' • ' + (S.phase === 'input' ? 'your turn' : 'watch'));
      },
      draw() {
        bg(290, S.bgT);
        const c = ctx2d, T = tiles(), [sx, sy] = shakeWrap(S);
        c.save(); c.translate(sx, sy);
        text(S.phase === 'input' ? 'Repeat the light sequence' : 'Watch the sequence', W() / 2, 146, 17, '#fff', 'center', 800);
        text('Length ' + S.seq.length, W() / 2, 166, 13, 'rgba(255,255,255,.6)', 'center', 700);
        for (let i = 0; i < 4; i++) {
          const t = T[i], on = S.lit === i || (S.flashT > 0 && S.flashI === i), cur = S.phase === 'input' && S.sel === i;
          rr(t.x, t.y, t.w, t.h, 22, on ? hsl(ECHO_HUE[i], 95, 68) : hsl(ECHO_HUE[i], 60, 26, .7), cur ? C.gold : hsl(ECHO_HUE[i], 80, 66, .5), cur ? 4 : 2);
          if (on) { glow(hsl(ECHO_HUE[i], 100, 70), 30); rr(t.x, t.y, t.w, t.h, 22, 'rgba(255,255,255,.12)'); noglow(); }
          text(['A', 'B', 'C', 'D'][i], t.x + t.w / 2, t.y + t.h / 2 + 8, 22, 'rgba(255,255,255,.6)', 'center', 900);
        }
        c.restore();
        lifeDots(W() / 2 - 30, H() - 150, S.lives, 3, 0);
        fxDraw(S.parts); popDraw(S.pops); endCard(S, KEY);
      }
    };
  }

  // ============ 10. Term Match: pair Spanish words with English meanings ============
  const TERMS = [['Perro', 'Dog'], ['Libro', 'Book'], ['Agua', 'Water'], ['Casa', 'House'], ['Sol', 'Sun'], ['Luna', 'Moon'], ['Mesa', 'Table'], ['Pan', 'Bread'], ['Gato', 'Cat'], ['Mano', 'Hand'], ['Puerta', 'Door'], ['Silla', 'Chair']];
  function gTermMatch(g) {
    const goal = Math.max(1, g.goal | 0), KEY = 'n09_termmatch';
    const S = baseState({ pool: [], L: [], R: [], selL: -1, nb: 0, cur: 0, stage: 'play' });
    function refill() { if (S.pool.length < 4) S.pool = shuffle(TERMS.map((_, i) => i)).concat(S.pool); }
    function newBoard() {
      refill();
      const ids = S.pool.splice(0, 4);
      S.L = shuffle(ids.map(id => ({ id, t: TERMS[id][0], done: false, bad: 0 })));
      S.R = shuffle(ids.map(id => ({ id, t: TERMS[id][1], done: false, bad: 0 })));
      S.selL = -1; S.nb = 0; S.cur = 0;
    }
    function rects() {
      const cw = (W() - 48) / 2, h = 58;
      const L = S.L.map((_, i) => ({ x: 20, y: 160 + i * (h + 12), w: cw, h })), R = S.R.map((_, i) => ({ x: W() / 2 + 4, y: 160 + i * (h + 12), w: cw, h }));
      return { L, R };
    }
    function tapL(i) {
      if (S.fin || S.nb > 0 || S.L[i].done) return;
      S.selL = S.selL === i ? -1 : i; beep(500, 560, .04, 'triangle', .06);
    }
    function tapR(j) {
      if (S.fin || S.nb > 0 || S.selL < 0 || S.R[j].done) return;
      const l = S.L[S.selL], r = S.R[j], R = rects(), Lr = R.L[S.selL];
      if (l.id === r.id) {
        l.done = r.done = true; S.selL = -1; S.done++; beep(700, 1000, .1, 'triangle', .1);
        fxBurst(S.parts, R.R[j].x + R.R[j].w / 2, R.R[j].y + R.R[j].h / 2, hsl(140, 90, 65), 22, 200);
        addPop(S.pops, '+1', R.R[j].x + R.R[j].w / 2, R.R[j].y - 6, C.gold, 20);
        if (S.done >= goal) { finish(S, true, '', KEY); return; }
        if (S.L.every(x => x.done)) S.nb = .7;
      } else {
        S.lives--; l.bad = .4; r.bad = .4; S.selL = -1; S.shake = 7; beep(200, 90, .2, 'sawtooth', .1);
        addPop(S.pops, 'NO MATCH', Lr.x + Lr.w / 2, Lr.y - 4, C.red, 15);
        if (S.lives <= 0) finish(S, false, 'Out of lives', KEY);
      }
    }
    newBoard();
    return {
      pointer(x, y) {
        const R = rects();
        for (let i = 0; i < 4; i++) { if (inR(x, y, R.L[i])) { tapL(i); return; } if (inR(x, y, R.R[i])) { tapR(i); return; } }
      },
      update(dt) {
        if (tickEnd(S, g, dt)) return;
        dt = Math.min(dt, .05); tickBase(S, dt);
        for (const x of S.L.concat(S.R)) if (x.bad > 0) x.bad -= dt;
        if (S.nb > 0) { S.nb -= dt; if (S.nb <= 0 && !S.fin) newBoard(); }
        if (S.nb <= 0) {
          const st = dirStep(S, dt);
          const row = S.cur % 4, side = S.cur >= 4 ? 4 : 0;
          S.cur = side + clamp(row + st.y, 0, 3);
          if (st.x) S.cur = (S.cur >= 4 ? S.cur - 4 : S.cur + 4) + 0;
          if (pressed('a') || pressed('b') || pressed('c')) { if (S.cur < 4) tapL(S.cur); else tapR(S.cur - 4); }
        }
        hud(S.done + '/' + goal + ' • Lives ' + S.lives + ' • match the pairs');
      },
      draw() {
        bg(210, S.bgT);
        const c = ctx2d, R = rects(), [sx, sy] = shakeWrap(S);
        c.save(); c.translate(sx, sy);
        text('Spanish', W() / 4 + 10, 146, 14, 'rgba(255,255,255,.6)', 'center', 800);
        text('English', W() * 3 / 4 - 4, 146, 14, 'rgba(255,255,255,.6)', 'center', 800);
        const cur = (i, side) => S.cur === i + (side ? 4 : 0);
        for (let i = 0; i < S.L.length; i++) {
          const t = S.L[i], r = R.L[i], sel = S.selL === i, hue = t.done ? 140 : t.bad > 0 ? 0 : sel ? 50 : 210;
          rr(r.x, r.y, r.w, r.h, 14, t.done ? hsl(140, 50, 26, .6) : hsl(hue, 60, 36, .45), sel ? C.gold : cur(i, 0) ? 'rgba(255,255,255,.7)' : hsl(hue, 80, 66, .6), sel ? 3 : 1.5);
          text(t.t, r.x + r.w / 2, r.y + r.h / 2 + 7, 20, t.done ? 'rgba(255,255,255,.4)' : '#fff', 'center', 900);
        }
        for (let j = 0; j < S.R.length; j++) {
          const t = S.R[j], r = R.R[j], hue = t.done ? 140 : t.bad > 0 ? 0 : 250;
          rr(r.x, r.y, r.w, r.h, 14, t.done ? hsl(140, 50, 26, .6) : hsl(hue, 60, 36, .45), cur(j, 1) ? 'rgba(255,255,255,.7)' : hsl(hue, 80, 66, .6), 1.5);
          text(t.t, r.x + r.w / 2, r.y + r.h / 2 + 7, 18, t.done ? 'rgba(255,255,255,.4)' : '#fff', 'center', 800);
        }
        text(S.selL >= 0 ? 'Now tap its English meaning' : 'Tap a Spanish word first', W() / 2, H() - 220, 14, 'rgba(255,255,255,.7)', 'center', 700);
        lifeDots(W() / 2 - 30, H() - 150, S.lives, 3, 0);
        c.restore();
        fxDraw(S.parts); popDraw(S.pops); endCard(S, KEY);
      }
    };
  }

  const ENG = {
    n09_glance: gGlance, n09_bindrop: gBinDrop, n09_pairs: gPairParade, n09_sumrush: gSumRush,
    n09_oddshade: gOddShade, n09_flashdeck: gFlashDeck, n09_inkclash: gInkClash,
    n09_ladder: gLadderScan, n09_echo: gEchoTiles, n09_termmatch: gTermMatch
  };
  const MINIS = [
    { id: 'n09_glance', title: 'Glance Grid', icon: '👁', cat: 'QUIZ', desc: 'Symbols flash across a 3x3 grid for a moment. Then they vanish and you must tap where the named one sat. More symbols each round, three lives.', engine: 'n09_glance', goal: 8 },
    { id: 'n09_bindrop', title: 'Bin Drop', icon: '🗃', cat: 'QUIZ', desc: 'Round, boxy and spiky shapes fall toward three bins. Sort the lowest shape into its bin with a tap or A/B/C before it lands. Falls faster as you go.', engine: 'n09_bindrop', goal: 25 },
    { id: 'n09_pairs', title: 'Pair Parade', icon: '🃏', cat: 'CARDS', desc: 'A face-down memory board with a countdown. Flip two cards, find every matching pair. Each cleared board adds more pairs and less slack.', engine: 'n09_pairs', goal: 18 },
    { id: 'n09_sumrush', title: 'Sum Rush', icon: '➕', cat: 'QUIZ', desc: 'Quick mental arithmetic with three answers and a draining clock. Addition, then subtraction, then multiplication. Build a combo, three misses and it ends.', engine: 'n09_sumrush', goal: 20 },
    { id: 'n09_oddshade', title: 'Odd Shade', icon: '🎨', cat: 'QUIZ', desc: 'A grid of nearly identical tiles where one has a slightly different hue. Spot it before the timer runs out. The grid grows and the shades get closer together.', engine: 'n09_oddshade', goal: 15 },
    { id: 'n09_flashdeck', title: 'Flash Deck', icon: '🗂', cat: 'QUIZ', desc: 'Flashcards: read the question, tap to flip, then rate yourself. Swipe right or tap "Knew it" to clear the card; left to send it back. Six misses ends the deck.', engine: 'n09_flashdeck', goal: 15 },
    { id: 'n09_inkclash', title: 'Ink Clash', icon: '🖍', cat: 'QUIZ', desc: 'A color word is printed in a different ink. Tap the ink color, not the word. The timer shrinks each round and wrong taps cost a life.', engine: 'n09_inkclash', goal: 20 },
    { id: 'n09_ladder', title: 'Ladder Scan', icon: '🔢', cat: 'PUZZLE', desc: 'Tap the numbers in ascending order across a shuffled grid before the clock runs out. Wrong taps cost two seconds. Grids grow from 4x4 up to 6x6.', engine: 'n09_ladder', goal: 4 },
    { id: 'n09_echo', title: 'Echo Tiles', icon: '💡', cat: 'PUZZLE', desc: 'Four glowing tiles light up in a sequence. Watch it, then repeat it. Each round adds one more step. A wrong tile replays the same sequence.', engine: 'n09_echo', goal: 8 },
    { id: 'n09_termmatch', title: 'Term Match', icon: '🔗', cat: 'QUIZ', desc: 'Match Spanish words to their English meanings. Tap a word, then its meaning. Wrong matches cost a life, three strikes and it is over.', engine: 'n09_termmatch', goal: 12 }
  ];
  return { engines: ENG, minis: MINIS, aaa: [] };
})();
