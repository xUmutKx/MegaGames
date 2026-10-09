window.__AG_action = (function () {
  /* ---------- shared kit ---------- */
  const TAU = Math.PI * 2;
  function gl(x, y, r, c, a) { const gr = ctx2d.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, c); gr.addColorStop(1, 'rgba(0,0,0,0)'); ctx2d.save(); ctx2d.globalAlpha = a == null ? .5 : a; ctx2d.globalCompositeOperation = 'lighter'; ctx2d.fillStyle = gr; ctx2d.beginPath(); ctx2d.arc(x, y, r, 0, TAU); ctx2d.fill(); ctx2d.restore(); }
  function bg(top, bot) { const gr = ctx2d.createLinearGradient(0, 0, 0, H()); gr.addColorStop(0, top); gr.addColorStop(1, bot); ctx2d.fillStyle = gr; ctx2d.fillRect(0, 0, W(), H()); }
  function bar(x, y, w, h, v, c, b) { rect(x, y, w, h, b || 'rgba(255,255,255,.14)', 3); if (v > 0) rect(x, y, w * clamp(v, 0, 1), h, c, 3); }
  function ang(x1, y1, x2, y2) { return Math.atan2(y2 - y1, x2 - x1); }
  function near(list, x, y, maxd, f) { let b = null, bd = maxd || 1e9; for (const e of list) { if (e.dead || (f && !f(e))) continue; const d = dist(x, y, e.x, e.y); if (d < bd) { bd = d; b = e; } } return b; }
  function lerpA(a, b, t) { const d = ((b - a + Math.PI) % TAU + TAU) % TAU - Math.PI; return a + d * t; }
  function sfx(k) { try { ({ shot: () => beep(520, 260, .05, 'square', .05), hit: () => beep(200, 120, .05, 'sawtooth', .06), boom: () => beep(160, 40, .25, 'sawtooth', .1), pick: () => beep(600, 1100, .09, 'sine', .08), up: () => beep(400, 900, .25, 'triangle', .1), hurt: () => beep(140, 70, .2, 'square', .1), win: () => beep(500, 1400, .5, 'triangle', .12), big: () => beep(90, 30, .5, 'sawtooth', .14) })[k](); } catch (e) { } }
  function mkFx(g) {
    const f = { p: [], pp: [], sh: 0, ban: '', bt: 0, T: 0, fin: 0, win: false, msg: '', done: false, flash: 0, fc: '#fff' };
    f.burst = (x, y, c, n, s) => { if (f.p.length < 260) fxBurst(f.p, x, y, c, n, s); };
    f.pop = (x, y, s, c, sz) => { if (f.pp.length < 36) f.pp.push({ x, y, s: String(s), c: c || '#fff', l: .9, sz: sz || 15 }); };
    f.banner = (s, t) => { f.ban = s; f.bt = t || 1.8; };
    f.shake = v => { f.sh = Math.max(f.sh, v); };
    f.fl = (c, a) => { f.flash = a || .35; f.fc = c || '#fff'; };
    f.end = (win, msg, delay) => { if (f.fin > 0 || f.done) return; f.fin = delay || 1.1; f.win = win; f.msg = msg || ''; f.banner(win ? 'VICTORY!' : 'GAME OVER', 9); sfx(win ? 'win' : 'big'); };
    f.tick = dt => {
      f.T += dt; fxUpdate(f.p, dt, 0);
      for (const q of f.pp) { q.y -= 38 * dt; q.l -= dt; } f.pp = f.pp.filter(q => q.l > 0);
      f.sh = Math.max(0, f.sh - dt * 28); f.bt -= dt; f.flash = Math.max(0, f.flash - dt * 1.5);
      if (f.fin > 0) { f.fin -= dt; if (f.fin <= 0 && !f.done) { f.done = true; if (f.win) completeMini(); else miniFail(g, f.msg || 'Defeated.'); } }
      return f.fin > 0 || f.done;
    };
    f.begin = () => { ctx2d.save(); if (f.sh > .3) ctx2d.translate(rand(-f.sh, f.sh) * .5, rand(-f.sh, f.sh) * .5); };
    f.over = () => {
      ctx2d.restore(); fxDraw(f.p);
      for (const q of f.pp) { ctx2d.globalAlpha = clamp(q.l * 1.5, 0, 1); text(q.s, q.x, q.y, q.sz, q.c, 'center', 800); } ctx2d.globalAlpha = 1;
      if (f.flash > 0) { ctx2d.globalAlpha = clamp(f.flash, 0, .5); rect(0, 0, W(), H(), f.fc); ctx2d.globalAlpha = 1; }
      if (f.bt > 0) { ctx2d.globalAlpha = clamp(f.bt * 2, 0, 1); rect(0, H() * .38 - 4, W(), 56, 'rgba(0,0,0,.55)'); text(f.ban, W() / 2, H() * .38 + 34, 30, '#fff', 'center', 900); ctx2d.globalAlpha = 1; }
    };
    return f;
  }
  function mkCards() {
    const c = { on: false, opts: [], cb: null, sel: 0, nx: 0, title: '', dly: 0 };
    c.open = (title, opts, cb) => { c.on = true; c.opts = opts; c.cb = cb; c.sel = 0; c.title = title; c.dly = .5; c.nx = 1; };
    c.pick = i => { if (!c.on || c.dly > 0 || i < 0 || i >= c.opts.length) return; c.on = false; sfx('up'); c.cb(c.opts[i]); };
    c.update = dt => {
      c.dly -= dt; const ax = AX(), ay = AY();
      if ((ax > .6 || ay > .6) && !c.nx) { c.sel = Math.min(c.opts.length - 1, c.sel + 1); c.nx = 1; } else if ((ax < -.6 || ay < -.6) && !c.nx) { c.sel = Math.max(0, c.sel - 1); c.nx = 1; } else if (Math.abs(ax) < .3 && Math.abs(ay) < .3) c.nx = 0;
      if (pressed('a') || pressed('b') || pressed('c')) c.pick(c.sel);
    };
    c.box = i => ({ x: 24, y: H() * .24 + i * 104, w: W() - 48, h: 92 });
    c.tap = (x, y) => { if (!c.on) return false; for (let i = 0; i < c.opts.length; i++) { const b = c.box(i); if (x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h) { c.sel = i; c.pick(i); break; } } return true; };
    c.draw = () => {
      if (!c.on) return; rect(0, 0, W(), H(), 'rgba(3,6,14,.82)');
      text(c.title, W() / 2, H() * .24 - 22, 24, C.gold, 'center', 900); text('Tap a card, or stick + A', W() / 2, H() * .24 - 2, 12, '#9ab', 'center');
      c.opts.forEach((o, i) => { const b = c.box(i), s = i === c.sel; rect(b.x, b.y, b.w, b.h, s ? 'rgba(85,230,255,.22)' : 'rgba(255,255,255,.07)', 12); ctx2d.strokeStyle = s ? C.cyan : 'rgba(255,255,255,.2)'; ctx2d.lineWidth = s ? 3 : 1; ctx2d.strokeRect(b.x, b.y, b.w, b.h); text(o.ic || '⭐', b.x + 44, b.y + 58, 38, '#fff', 'center'); text(o.n, b.x + 84, b.y + 38, 19, '#fff', 'left', 900); text(o.d, b.x + 84, b.y + 66, 13, '#b8c6d8', 'left', 600); });
    };
    return c;
  }
  function pickN(arr, n) { const a = arr.slice(), r = []; while (r.length < n && a.length) r.push(a.splice(randi(0, a.length - 1), 1)[0]); return r; }
  function rectHit(cx, cy, r, b) { const qx = clamp(cx, b.x, b.x + b.w), qy = clamp(cy, b.y, b.y + b.h); return dist(cx, cy, qx, qy) < r; }
  function pushOut(o, r, b) { const qx = clamp(o.x, b.x, b.x + b.w), qy = clamp(o.y, b.y, b.y + b.h); let dx = o.x - qx, dy = o.y - qy, d = Math.hypot(dx, dy); if (d < r) { if (d < .001) { dx = 0; dy = -1; d = 1; } o.x = qx + dx / d * r; o.y = qy + dy / d * r; return true; } return false; }
  function stars(n) { const a = []; for (let i = 0; i < n; i++) a.push({ x: Math.random(), y: Math.random(), s: rand(.3, 1.5) }); return a; }
  function drawStars(a, t, sp) { const w = W(), h = H(); for (const s of a) { const y = ((s.y * h + t * sp * s.s * 40) % h + h) % h; ctx2d.globalAlpha = .3 + s.s * .3; circle(s.x * w, y, s.s, '#cfe8ff'); } ctx2d.globalAlpha = 1; }
  /* ---------- shooter: Space Defender ---------- */
  function shooter(g) {
    const K = mkFx(g), CD = mkCards(), ST = stars(60);
    const P = { x: W() / 2, y: H() - 190, hp: 100, mx: 100, sh: 0, inv: 0, w: 1, rate: .2, dmg: 1, bombs: 2, cd: 0, spd: 300, tilt: 0 };
    let B = [], E = [], EB = [], PU = [], score = 0, wave = 0, left = 0, spT = 1, boss = null, rest = 1.5, t = 0, combo = 0, comboT = 0;
    const TY = { grunt: { hp: 2, r: 15, s: 2, c: '#ff5570' }, diver: { hp: 2, r: 13, s: 3, c: '#ff914d' }, tank: { hp: 7, r: 21, s: 6, c: '#a978ff' }, zig: { hp: 3, r: 15, s: 4, c: '#55ff9a' } };
    function nextWave() {
      wave++; const isB = wave % 3 === 0;
      left = isB ? 0 : 7 + wave * 3; if (isB) spawnBoss();
      K.banner(isB ? 'WARNING: BOSS' : 'WAVE ' + wave, 1.7);
    }
    function spawnBoss() {
      const hp = 55 + wave * 14; boss = { x: W() / 2, y: -60, t: 'boss', hp, mhp: hp, r: 44, s: 100 + wave * 6, ph: 0, fire: 2, bt: 0, dead: false, enter: 1 };
      E.push(boss);
    }
    function spawn() {
      const pool = ['grunt', 'grunt']; if (wave >= 2) pool.push('diver'); if (wave >= 2) pool.push('zig'); if (wave >= 3) pool.push('tank');
      const k = pick(pool), d = TY[k];
      E.push({ x: rand(30, W() - 30), y: 60, x0: 0, t: k, hp: d.hp + Math.floor(wave / 4), mhp: d.hp + Math.floor(wave / 4), r: d.r, s: d.s, tt: rand(0, 6), fire: rand(1, 3), mode: 0, vx: rand(0, 1) < .5 ? 90 : -90, dead: false });
      E[E.length - 1].x0 = E[E.length - 1].x;
    }
    function ebul(x, y, a, sp, c) { EB.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, c: c || '#ffb347' }); }
    function hitP(d) {
      if (P.inv > 0) return; if (P.sh > 0) { P.sh = 0; P.inv = .8; K.fl('#55e6ff', .3); sfx('hit'); return; }
      P.hp -= d; P.inv = 1; K.shake(10); K.fl('#ff3355', .25); sfx('hurt'); combo = 0;
      if (P.hp <= 0) { K.burst(P.x, P.y, C.cyan, 40, 260); K.end(false, 'Your ship was destroyed.'); }
    }
    function addScore(n, x, y) { combo++; comboT = 2.2; const m = 1 + Math.min(4, Math.floor(combo / 6)) * .25; const v = Math.round(n * m); score += v; K.pop(x, y, '+' + v, '#ffe36e'); }
    function kill(e) {
      e.dead = true; const d = TY[e.t]; K.burst(e.x, e.y, d ? d.c : '#ff5570', e.t === 'boss' ? 70 : 16, e.t === 'boss' ? 320 : 180); sfx(e.t === 'boss' ? 'big' : 'boom'); K.shake(e.t === 'boss' ? 18 : 3);
      if (e.t === 'boss') { addScore(60 + wave * 5, e.x, e.y); boss = null; EB = []; for (let i = 0; i < 4; i++) PU.push({ x: e.x + rand(-40, 40), y: e.y + rand(-20, 20), k: pick(['w', 'h', 's', 'b']) }); K.banner('BOSS DOWN!', 1.6); }
      else { addScore(d.s * 3, e.x, e.y); if (Math.random() < .15) PU.push({ x: e.x, y: e.y, k: pick(['w', 'h', 's', 'b', 'h']) }); }
    }
    function fire() {
      const ys = P.y - 18, sp = 640;
      const pat = { 1: [0], 2: [-.07, .07], 3: [-.2, 0, .2], 4: [-.32, -.1, .1, .32] }[P.w];
      for (const a of pat) B.push({ x: P.x + a * 40, y: ys, vx: Math.sin(a) * sp, vy: -Math.cos(a) * sp, d: P.dmg });
      sfx('shot');
    }
    function bomb() { if (P.bombs <= 0) return; P.bombs--; EB = []; K.shake(22); K.fl('#ffffff', .5); sfx('big'); for (const e of E) { e.hp -= e.t === 'boss' ? 12 : 8; if (e.hp <= 0 && !e.dead) kill(e); } K.banner('BOMB!', .8); }
    function cardsOpen() {
      const all = [{ n: 'Rapid Fire', ic: '⚡', d: 'Fire 18% faster', f: () => P.rate *= .82 }, { n: 'Heavy Rounds', ic: '💥', d: '+50% bullet damage', f: () => P.dmg += .5 }, { n: P.w < 4 ? 'Spread Shot' : 'Overcharge', ic: '🔱', d: P.w < 4 ? 'One more gun barrel' : '+1 damage', f: () => { if (P.w < 4) P.w++; else P.dmg += 1; } }, { n: 'Hull Repair', ic: '🔧', d: '+25 max hull and full repair', f: () => { P.mx += 25; P.hp = P.mx; } }, { n: 'Bomb Pack', ic: '💣', d: '+2 screen-clearing bombs (A)', f: () => P.bombs += 2 }, { n: 'Thrusters', ic: '🚀', d: '+15% ship speed', f: () => P.spd *= 1.15 }, { n: 'Shield Cell', ic: '🛡️', d: 'Start with a shield now', f: () => P.sh = 1 }];
      CD.open('WAVE ' + wave + ' CLEARED - UPGRADE', pickN(all, 3), o => { o.f(); rest = 1; nextWave(); });
    }
    return {
      pointer(x, y) { CD.tap(x, y); },
      update(dt) {
        if (K.tick(dt)) return; t += dt; if (CD.on) { CD.update(dt); return; }
        P.x = clamp(P.x + AX() * P.spd * dt, 20, W() - 20); P.y = clamp(P.y + AY() * P.spd * .8 * dt, 130, H() - 125); P.tilt += (AX() - P.tilt) * 8 * dt; P.inv -= dt; P.cd -= dt; comboT -= dt; if (comboT < 0) combo = 0;
        if (P.cd <= 0) { P.cd = P.rate; fire(); } if (pressed('a') || pressed('b')) bomb();
        if (left <= 0 && !E.some(e => !e.dead)) { rest -= dt; if (rest <= 0) { rest = 1; if (wave === 0) nextWave(); else cardsOpen(); } }
        if (left > 0) { spT -= dt; if (spT <= 0) { spT = Math.max(.35, .95 - wave * .05); left--; spawn(); } }
        for (const b of B) { b.x += b.vx * dt; b.y += b.vy * dt; }
        for (const b of EB) { b.x += b.vx * dt; b.y += b.vy * dt; }
        for (const e of E) {
          e.tt += dt; e.fire -= dt;
          if (e.t === 'grunt') { e.y += 70 * dt; e.x = e.x0 + Math.sin(e.tt * 2) * 55; if (e.fire < 0) { e.fire = rand(2, 4); if (wave > 2) ebul(e.x, e.y, Math.PI / 2, 220); } }
          else if (e.t === 'diver') { if (e.mode === 0) { e.y = Math.min(140, e.y + 120 * dt); e.x += Math.sin(e.tt * 3) * 40 * dt; if (e.tt > 1.4) { e.mode = 1; const a = ang(e.x, e.y, P.x, P.y); e.vx = Math.cos(a) * 300; e.vy = Math.sin(a) * 300; } } else { e.x += e.vx * dt; e.y += e.vy * dt; } }
          else if (e.t === 'tank') { e.y = Math.min(170, e.y + 45 * dt); e.x += Math.sin(e.tt) * 30 * dt; if (e.fire < 0) { e.fire = 1.6; const a = ang(e.x, e.y, P.x, P.y); for (const o of [-.2, 0, .2]) ebul(e.x, e.y + 10, a + o, 200, '#c79bff'); } }
          else if (e.t === 'zig') { e.y += 55 * dt; e.x += e.vx * dt; if (e.x < 20 || e.x > W() - 20) e.vx *= -1; if (e.fire < 0) { e.fire = 1.8; ebul(e.x, e.y, Math.PI / 2, 260, '#7dffb0'); } }
          else if (e.t === 'boss') {
            if (e.enter > 0) { e.y += 110 * dt; if (e.y > 150) e.enter = 0; } else {
              e.bt += dt; e.x = W() / 2 + Math.sin(e.bt * .8) * (W() / 2 - 70); const f = e.hp / e.mhp; e.ph = f > .66 ? 0 : f > .33 ? 1 : 2;
              if (e.fire < 0) {
                if (e.ph === 0) { e.fire = 1.1; for (let i = -2; i <= 2; i++) ebul(e.x, e.y + 30, Math.PI / 2 + i * .22, 210, '#ff7a7a'); }
                else if (e.ph === 1) { e.fire = .8; ebul(e.x, e.y + 30, ang(e.x, e.y, P.x, P.y), 300, '#ffd15c'); if (Math.random() < .35 && E.length < 9) { E.push({ x: e.x, y: e.y, x0: e.x, t: 'grunt', hp: 2, mhp: 2, r: 15, s: 2, tt: 0, fire: 3, vx: 0, mode: 0, dead: false }); } }
                else { e.fire = 1.3; for (let i = 0; i < 14; i++) ebul(e.x, e.y, i / 14 * TAU + e.bt, 190, '#ff9bd8'); }
              }
            }
          }
          if (dist(e.x, e.y, P.x, P.y) < e.r + 14 && e.t !== 'boss') { hitP(20); e.hp = 0; kill(e); }
          else if (e.t === 'boss' && dist(e.x, e.y, P.x, P.y) < e.r + 12) hitP(25);
        }
        for (const b of B) for (const e of E) if (!e.dead && !b.dead && Math.abs(b.x - e.x) < e.r + 4 && Math.abs(b.y - e.y) < e.r + 6) { b.dead = true; e.hp -= b.d; K.burst(b.x, b.y, '#fff', 3, 80); if (e.hp <= 0) kill(e); }
        for (const b of EB) if (dist(b.x, b.y, P.x, P.y) < 12) { b.dead = true; hitP(12); }
        for (const p of PU) { p.y += 70 * dt; if (dist(p.x, p.y, P.x, P.y) < 26) {
          p.dead = true; sfx('pick'); if (p.k === 'w') { if (P.w < 4) P.w++; else P.dmg += .25; K.pop(p.x, p.y, 'WEAPON UP', '#55e6ff'); } else if (p.k === 'h') { P.hp = Math.min(P.mx, P.hp + 30); K.pop(p.x, p.y, '+HULL', '#55ff9a'); } else if (p.k === 's') { P.sh = 1; K.pop(p.x, p.y, 'SHIELD', '#4da3ff'); } else { P.bombs++; K.pop(p.x, p.y, '+BOMB', '#ffd15c'); } } }
        B = B.filter(b => !b.dead && b.y > 60 && b.x > -20 && b.x < W() + 20); EB = EB.filter(b => !b.dead && b.y < H() && b.y > 50 && b.x > -20 && b.x < W() + 20);
        E = E.filter(e => !e.dead && e.y < H() + 40 && e.x > -60 && e.x < W() + 60); PU = PU.filter(p => !p.dead && p.y < H());
        if (!E.some(e => e.t === 'boss')) boss = null;
        if (score >= g.goal) { K.end(true); }
        hud('Score ' + score + '/' + g.goal + ' • Wave ' + wave + ' • Hull ' + Math.max(0, P.hp | 0) + ' • Bombs ' + P.bombs);
      },
      draw() {
        bg('#030818', '#10163a'); drawStars(ST, t, 6); K.begin();
        for (const p of PU) { const c = { w: '#55e6ff', h: '#55ff9a', s: '#4da3ff', b: '#ffd15c' }[p.k]; gl(p.x, p.y, 24, c, .6); circle(p.x, p.y, 11, c); text({ w: 'W', h: '+', s: 'S', b: 'B' }[p.k], p.x, p.y + 5, 14, '#001', 'center', 900); }
        for (const e of E) {
          if (e.dead) continue; const d = TY[e.t];
          if (e.t === 'boss') { gl(e.x, e.y, 110, '#ff3355', .35); polygon([[e.x - 62, e.y - 8], [e.x - 20, e.y - 38], [e.x + 20, e.y - 38], [e.x + 62, e.y - 8], [e.x + 30, e.y + 40], [e.x - 30, e.y + 40]], e.ph === 2 ? '#a0204a' : '#5a2a6a'); polygon([[e.x - 40, e.y - 4], [e.x, e.y - 26], [e.x + 40, e.y - 4], [e.x, e.y + 28]], '#d94a6a'); circle(e.x, e.y, 11 + Math.sin(t * 6) * 2, '#ffe36e'); bar(40, 92, W() - 80, 8, e.hp / e.mhp, '#ff5570'); text('DREADNOUGHT', W() / 2, 90, 11, '#fff', 'center', 800); continue; }
          gl(e.x, e.y, e.r * 2, d.c, .3);
          if (e.t === 'grunt') polygon([[e.x - e.r, e.y - 8], [e.x, e.y + e.r], [e.x + e.r, e.y - 8], [e.x, e.y - 3]], d.c);
          else if (e.t === 'diver') polygon([[e.x, e.y + e.r], [e.x - e.r, e.y - e.r], [e.x, e.y - 3], [e.x + e.r, e.y - e.r]], d.c);
          else if (e.t === 'tank') { rect(e.x - e.r, e.y - e.r + 4, e.r * 2, e.r * 1.5, d.c, 6); rect(e.x - 5, e.y + 4, 10, e.r, '#6b45b8', 3); }
          else { circle(e.x, e.y, e.r, d.c); circle(e.x, e.y, e.r * .5, '#022'); }
          if (e.hp < e.mhp) bar(e.x - 14, e.y - e.r - 8, 28, 3, e.hp / e.mhp, '#fff');
        }
        for (const b of B) { gl(b.x, b.y, 12, '#ffe36e', .5); rect(b.x - 2, b.y - 10, 4, 18, '#fff7c2', 2); }
        for (const b of EB) { gl(b.x, b.y, 12, b.c, .6); circle(b.x, b.y, 4, '#fff'); }
        if (!K.done) {
          const x = P.x, y = P.y, tl = P.tilt * 6;
          gl(x, y + 22, 26, '#55e6ff', .35 + Math.random() * .2); polygon([[x - 5, y + 14], [x, y + 26 + Math.random() * 8], [x + 5, y + 14]], '#ffb347');
          ctx2d.globalAlpha = P.inv > 0 && Math.floor(t * 20) % 2 ? .35 : 1;
          polygon([[x, y - 24], [x - 16 + tl, y + 14], [x - 6, y + 10], [x, y + 18], [x + 6, y + 10], [x + 16 + tl, y + 14]], '#55e6ff'); polygon([[x, y - 14], [x - 5, y + 6], [x + 5, y + 6]], '#e6fbff'); ctx2d.globalAlpha = 1;
          if (P.sh > 0) { strokeCircle(x, y, 28, 'rgba(77,163,255,.9)', 3); gl(x, y, 34, '#4da3ff', .25); }
        }
        K.over(); bar(20, 78, 120, 8, P.hp / P.mx, P.hp < 30 ? '#ff5570' : '#55ff9a'); if (combo > 4) text('COMBO x' + combo, W() - 20, 100, 15, '#ffe36e', 'right', 900); CD.draw();
      }
    };
  }

  /* ---------- asteroid: Asteroid Miner ---------- */
  function asteroid(g) {
    const K = mkFx(g), CD = mkCards(), ST = stars(70);
    const P = { x: W() / 2, y: (78 + H() - 118) / 2, vx: 0, vy: 0, a: -Math.PI / 2, hp: 100, mx: 100, inv: 0, cd: 0, rate: .22, dmg: 1, mag: 70, n: 0, nova: 0, pierce: 0, multi: 1, thr: 380 };
    let R = [], S = [], O = [], U = [], EB = [], ore = 0, sector = 0, t = 0, rest = 1, ufoT = 12;
    const top = 78, bot = () => H() - 118;
    const MIN = { iron: { c: '#9fb4c8', v: 1 }, gold: { c: '#ffd15c', v: 3 }, crystal: { c: '#c07bff', v: 5 } };
    function mkRock(x, y, sz, kind) {
      const r = sz === 3 ? 34 : sz === 2 ? 21 : 12, a = rand(0, TAU), sp = rand(25, 65) * (4 - sz) * .6 + 20;
      const pts = []; for (let i = 0; i < 10; i++) pts.push(rand(.78, 1.12));
      R.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, sz, r, hp: sz === 3 ? 4 : sz === 2 ? 2 : 1, kind: kind || (Math.random() < .12 ? 'gold' : Math.random() < .06 + sector * .01 ? 'crystal' : Math.random() < .09 && sector > 1 ? 'bomb' : 'iron'), rot: rand(0, 6), vr: rand(-1, 1), pts, dead: false });
    }
    function newSector() {
      sector++; const n = 4 + sector * 2;
      for (let i = 0; i < n; i++) { let x, y; do { x = rand(0, W()); y = rand(top, bot()); } while (dist(x, y, P.x, P.y) < 150); mkRock(x, y, 3); }
      K.banner('SECTOR ' + sector, 1.4);
    }
    function dmgRock(r, d, x, y) {
      r.hp -= d; sfx('hit'); K.burst(x, y, '#ccd', 4, 90);
      if (r.hp <= 0 && !r.dead) {
        r.dead = true; K.burst(r.x, r.y, MIN[r.kind] ? MIN[r.kind].c : '#ff914d', 14, 150); K.shake(r.sz * 1.5); sfx('boom');
        if (r.kind === 'bomb') { K.burst(r.x, r.y, '#ff914d', 40, 280); K.shake(14); for (const q of R) if (!q.dead && q !== r && dist(q.x, q.y, r.x, r.y) < 110) dmgRock(q, 3, q.x, q.y); if (dist(P.x, P.y, r.x, r.y) < 90) hitP(25); }
        if (r.sz > 1) for (let i = 0; i < 2; i++) mkRock(r.x, r.y, r.sz - 1, r.kind === 'bomb' ? 'iron' : r.kind);
        const k = MIN[r.kind] ? r.kind : 'iron', n = r.sz;
        for (let i = 0; i < n; i++) O.push({ x: r.x + rand(-8, 8), y: r.y + rand(-8, 8), vx: rand(-50, 50), vy: rand(-50, 50), k, l: 14 });
      }
    }
    function hitP(d) { if (P.inv > 0) return; P.hp -= d; P.inv = 1.1; K.shake(12); K.fl('#ff3355', .25); sfx('hurt'); if (P.hp <= 0) { K.burst(P.x, P.y, C.cyan, 40, 260); K.end(false, 'Your mining ship was wrecked.'); } }
    function cardsOpen() {
      const all = [{ n: 'Rapid Cutter', ic: '⚡', d: 'Laser fires 20% faster', f: () => P.rate *= .8 }, { n: 'Twin Lasers', ic: '🔱', d: '+1 laser barrel', f: () => P.multi = Math.min(4, P.multi + 1) }, { n: 'Piercing Beam', ic: '🗡️', d: 'Shots pass through 1 more rock', f: () => P.pierce++ }, { n: 'Ore Magnet', ic: '🧲', d: '+60% ore pickup range', f: () => P.mag *= 1.6 }, { n: 'Hull Plating', ic: '🔧', d: '+30 max hull, full repair', f: () => { P.mx += 30; P.hp = P.mx; } }, { n: 'Plasma Nova', ic: '💫', d: 'A: shockwave pulse, +1 charge', f: () => P.nova += 2 }, { n: 'Ion Drive', ic: '🚀', d: '+20% engine power', f: () => P.thr *= 1.2 }];
      CD.open('SECTOR CLEARED - UPGRADE', pickN(all, 3), o => { o.f(); newSector(); });
    }
    function wrap(o, m) { if (o.x < -m) o.x = W() + m; if (o.x > W() + m) o.x = -m; if (o.y < top - m) o.y = bot() + m; if (o.y > bot() + m) o.y = top - m; }
    newSector();
    return {
      pointer(x, y) { CD.tap(x, y); },
      update(dt) {
        if (K.tick(dt)) return; t += dt; if (CD.on) { CD.update(dt); return; }
        const ax = AX(), ay = AY(), m = Math.hypot(ax, ay);
        if (m > .2) { P.a = lerpA(P.a, Math.atan2(ay, ax), clamp(dt * 9, 0, 1)); P.vx += Math.cos(P.a) * P.thr * m * dt; P.vy += Math.sin(P.a) * P.thr * m * dt; if (Math.random() < .6) K.p.push({ x: P.x - Math.cos(P.a) * 16, y: P.y - Math.sin(P.a) * 16, vx: -Math.cos(P.a) * 80 + rand(-20, 20), vy: -Math.sin(P.a) * 80 + rand(-20, 20), life: .3, max: .3, r: 2, c: '#ffb347' }); }
        const dr = Math.pow(.55, dt); P.vx *= dr; P.vy *= dr; P.x += P.vx * dt; P.y += P.vy * dt; wrap(P, 10); P.inv -= dt; P.cd -= dt;
        if (P.cd <= 0) { P.cd = P.rate; for (let i = 0; i < P.multi; i++) { const o = (i - (P.multi - 1) / 2) * .16; S.push({ x: P.x + Math.cos(P.a) * 16, y: P.y + Math.sin(P.a) * 16, vx: Math.cos(P.a + o) * 560 + P.vx * .3, vy: Math.sin(P.a + o) * 560 + P.vy * .3, l: .9, pi: P.pierce, hit: new Set() }); } sfx('shot'); }
        if (pressed('a') && P.nova > 0) { P.nova--; K.shake(14); K.fl('#c07bff', .4); sfx('big'); for (const r of R) if (dist(r.x, r.y, P.x, P.y) < 190) dmgRock(r, 2, r.x, r.y); for (const b of EB) b.dead = true; K.burst(P.x, P.y, '#c07bff', 40, 300); }
        if (pressed('b')) { P.vx *= 1.8; P.vy *= 1.8; }
        ufoT -= dt; if (sector >= 2 && ufoT <= 0) { ufoT = rand(14, 22); U.push({ x: -20, y: rand(top + 40, bot() - 60), vx: 90, hp: 4, f: 1.2, dead: false }); K.banner('UFO RAIDER', 1); }
        for (const s of S) { s.x += s.vx * dt; s.y += s.vy * dt; s.l -= dt; wrap(s, 4); }
        for (const r of R) { r.x += r.vx * dt; r.y += r.vy * dt; r.rot += r.vr * dt; wrap(r, r.r); }
        for (const s of S) { for (const r of R) if (!r.dead && !s.hit.has(r) && dist(s.x, s.y, r.x, r.y) < r.r + 4) { s.hit.add(r); dmgRock(r, 1, s.x, s.y); if (s.pi-- <= 0) { s.l = 0; break; } } for (const u of U) if (!u.dead && dist(s.x, s.y, u.x, u.y) < 20) { s.l = 0; u.hp--; K.burst(u.x, u.y, '#7dffb0', 5, 100); if (u.hp <= 0) { u.dead = true; K.burst(u.x, u.y, '#7dffb0', 30, 220); sfx('boom'); for (let i = 0; i < 4; i++) O.push({ x: u.x, y: u.y, vx: rand(-60, 60), vy: rand(-60, 60), k: 'crystal', l: 14 }); } } }
        for (const r of R) if (!r.dead && dist(r.x, r.y, P.x, P.y) < r.r + 11) { hitP(r.sz * 8); const a = ang(r.x, r.y, P.x, P.y); P.vx += Math.cos(a) * 220; P.vy += Math.sin(a) * 220; dmgRock(r, 9, r.x, r.y); }
        for (const u of U) { u.x += u.vx * dt; u.y += Math.sin(t * 3 + u.x * .02) * 40 * dt; u.f -= dt; if (u.f < 0) { u.f = 1.6; const a = ang(u.x, u.y, P.x, P.y); EB.push({ x: u.x, y: u.y, vx: Math.cos(a) * 230, vy: Math.sin(a) * 230, l: 3 }); } if (u.x > W() + 30) u.dead = true; }
        for (const b of EB) { b.x += b.vx * dt; b.y += b.vy * dt; b.l -= dt; if (dist(b.x, b.y, P.x, P.y) < 12) { b.dead = true; hitP(15); } if (b.l <= 0) b.dead = true; }
        for (const o of O) { o.l -= dt; const d = dist(o.x, o.y, P.x, P.y); if (d < P.mag) { const a = ang(o.x, o.y, P.x, P.y); o.vx += Math.cos(a) * 900 * dt; o.vy += Math.sin(a) * 900 * dt; } o.vx *= .97; o.vy *= .97; o.x += o.vx * dt; o.y += o.vy * dt; if (d < 18) { o.l = 0; const v = MIN[o.k].v; ore += v; K.pop(o.x, o.y, '+' + v, MIN[o.k].c); sfx('pick'); } }
        S = S.filter(s => s.l > 0); R = R.filter(r => !r.dead); O = O.filter(o => o.l > 0); U = U.filter(u => !u.dead); EB = EB.filter(b => !b.dead);
        if (ore >= g.goal) K.end(true);
        else if (!R.length && !O.length) { rest -= dt; if (rest <= 0) { rest = 1; cardsOpen(); } }
        hud('Ore ' + ore + '/' + g.goal + ' • Sector ' + sector + ' • Hull ' + Math.max(0, P.hp | 0) + (P.nova ? ' • Nova ' + P.nova : ''));
      },
      draw() {
        bg('#05060f', '#0f1230'); drawStars(ST, t, 1); K.begin();
        for (const r of R) { const c = r.kind === 'gold' ? '#c9a23a' : r.kind === 'crystal' ? '#8c58c8' : r.kind === 'bomb' ? '#a8452c' : '#6c7a8a'; ctx2d.save(); ctx2d.translate(r.x, r.y); ctx2d.rotate(r.rot); ctx2d.beginPath(); r.pts.forEach((p, i) => { const a = i / 10 * TAU; ctx2d[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r.r * p, Math.sin(a) * r.r * p); }); ctx2d.closePath(); ctx2d.fillStyle = c; ctx2d.fill(); ctx2d.strokeStyle = 'rgba(255,255,255,.35)'; ctx2d.lineWidth = 2; ctx2d.stroke(); if (r.kind !== 'iron') gl(0, 0, r.r * 1.1, r.kind === 'bomb' ? '#ff6a3c' : MIN[r.kind].c, .35 + Math.sin(t * 6) * .15); circle(-r.r * .3, -r.r * .2, r.r * .2, 'rgba(0,0,0,.22)'); ctx2d.restore(); }
        for (const o of O) { gl(o.x, o.y, 12, MIN[o.k].c, .6); polygon([[o.x, o.y - 5], [o.x + 4, o.y], [o.x, o.y + 5], [o.x - 4, o.y]], MIN[o.k].c); }
        for (const u of U) { gl(u.x, u.y, 36, '#7dffb0', .3); ctx2d.fillStyle = '#4ac98a'; ctx2d.beginPath(); ctx2d.ellipse(u.x, u.y, 20, 8, 0, 0, TAU); ctx2d.fill(); circle(u.x, u.y - 6, 8, '#a5ffd0'); }
        for (const b of EB) { gl(b.x, b.y, 12, '#ff5570', .6); circle(b.x, b.y, 4, '#fff'); }
        for (const s of S) { gl(s.x, s.y, 10, '#ffe36e', .5); circle(s.x, s.y, 2.5, '#fff'); }
        if (!K.done) { ctx2d.save(); ctx2d.translate(P.x, P.y); ctx2d.rotate(P.a); ctx2d.globalAlpha = P.inv > 0 && Math.floor(t * 20) % 2 ? .35 : 1; gl(0, 0, 30, '#55e6ff', .3); polygon([[18, 0], [-12, -12], [-6, 0], [-12, 12]], '#55e6ff'); polygon([[10, 0], [-6, -5], [-6, 5]], '#e6fbff'); ctx2d.restore(); }
        K.over(); bar(20, 78, 120, 8, P.hp / P.mx, P.hp < 30 ? '#ff5570' : '#55ff9a'); CD.draw();
      }
    };
  }
  const M = (id, title, icon, cat, desc, goal, extra) => Object.assign({ id, title, icon, cat, desc, engine: id, goal }, extra || {});
  return {
    engines: { shooter, asteroid },
    minis: [
      M('shooter', 'Space Defender', '🚀', 'ACTION', 'Wave shooter with diving raiders, shielded gunships, dreadnought bosses, power-ups, bombs and an upgrade pick after every wave.', 300),
      M('asteroid', 'Asteroid Miner', '🪨', 'ACTION', 'Inertia flight: blast rocks into ore, dodge explosive rocks and UFO raiders, upgrade your ship each sector.', 80)
    ],
    aaa: []
  };
})();
