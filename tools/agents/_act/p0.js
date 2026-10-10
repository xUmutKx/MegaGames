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
