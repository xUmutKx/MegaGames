window.__AG_new_13 = (function () {
  /* ---------- shared kit: side-scroll platformer helpers ---------- */
  const TAU = Math.PI * 2;
  const GY = () => H() - 130; // ground line: feet stand here
  const ov = (a, s) => a.x < s.x + s.w && a.x + a.w > s.x && a.y < s.y + s.h && a.y + a.h > s.y;

  function sky(top, bot) { const gr = ctx2d.createLinearGradient(0, 0, 0, H()); gr.addColorStop(0, top); gr.addColorStop(1, bot); ctx2d.fillStyle = gr; ctx2d.fillRect(0, 0, W(), H()); }
  function glow(x, y, r, col, a) { const gr = ctx2d.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); ctx2d.save(); ctx2d.globalAlpha = a == null ? 1 : a; ctx2d.globalCompositeOperation = 'lighter'; ctx2d.fillStyle = gr; ctx2d.beginPath(); ctx2d.arc(x, y, r, 0, TAU); ctx2d.fill(); ctx2d.restore(); }
  function hills(off, col, base, amp, k) { ctx2d.fillStyle = col; ctx2d.beginPath(); ctx2d.moveTo(0, H()); for (let x = 0; x <= W() + 8; x += 8) ctx2d.lineTo(x, base - amp * (0.6 * Math.sin(x * k + off) + 0.4 * Math.sin(x * k * 2.3 + off * 1.7) + 0.5)); ctx2d.lineTo(W(), H()); ctx2d.closePath(); ctx2d.fill(); }
  function stars(off, n, col) { for (let i = 0; i < n; i++) circle((((i * 97.13 - off) % W()) + W()) % W(), 90 + ((i * 53.7) % (H() * 0.55)), 1 + (i % 3) * 0.4, col); }
  function pop(list, x, y, s, c, sz) { if (list.length < 30) list.push({ x, y, s: String(s), c: c || '#fff', sz, l: 1 }); }
  function popTick(list, dt) { for (const p of list) { p.y -= 36 * dt; p.l -= dt; } for (let i = list.length - 1; i >= 0; i--) if (list[i].l <= 0) list.splice(i, 1); }
  function popDraw(list) { for (const p of list) { ctx2d.globalAlpha = clamp(p.l * 1.5, 0, 1); text(p.s, p.x, p.y, p.sz || 15, p.c, 'center', 900); } ctx2d.globalAlpha = 1; }
  function sfx(k) { try { ({ jump: () => beep(340, 620, .08, 'square', .05), land: () => beep(160, 90, .05, 'triangle', .05), coin: () => beep(880, 1320, .08, 'sine', .08), hurt: () => beep(180, 60, .25, 'sawtooth', .1), flip: () => beep(500, 260, .09, 'triangle', .07), up: () => beep(420, 1000, .18, 'triangle', .09), win: () => beep(520, 1300, .5, 'triangle', .12) })[k](); } catch (e) { } }

  /* Moves box b (x,y,w,h,vx,vy px/s) through solids; s.ow = one-way from below. Returns contact info. */
  function move(b, dt, solids) {
    const hit = { floor: false, ceil: false, wall: 0, on: null };
    const dx = b.vx * dt, dy = b.vy * dt, prevBottom = b.y + b.h;
    b.x += dx;
    for (const s of solids) {
      if (s.ow || !ov(b, s)) continue;
      if (dx > 0) { b.x = s.x - b.w; hit.wall = 1; } else if (dx < 0) { b.x = s.x + s.w; hit.wall = -1; }
      b.vx = 0;
    }
    b.y += dy;
    for (const s of solids) {
      if (!ov(b, s)) continue;
      if (s.ow && !(dy > 0 && prevBottom <= s.y + 1)) continue;
      if (dy > 0) { b.y = s.y - b.h; hit.floor = true; hit.on = s; } else { b.y = s.y + s.h; hit.ceil = true; }
      b.vy = 0;
    }
    return hit;
  }

  /* ================= 1. Ember Run ================= */
  function gEmber(g) {
    const fx = [], pp = [], obs = [], PX = 120;
    let dist = 0, spd = 240, cleared = 0, over = false, nextX = 520, jq = false, sh = 0, t = 0;
    const pl = { by: GY(), vy: 0, h: 30, onFloor: true, air2: false };
    const cx = () => dist + PX;
    function spawn() {
      const r = Math.random();
      const type = r < .38 ? 'spike' : r < .62 ? 'gap' : 'bird';
      const w = type === 'gap' ? randi(64, 100) : type === 'bird' ? 44 : randi(26, 40);
      obs.push({ type, wx: nextX, w, done: false });
      nextX += w + rand(180, 300) + spd * .2;
    }
    function die(msg) { if (over) return; over = true; sh = 14; sfx('hurt'); fxBurst(fx, PX, pl.by - 12, C.red, 30, 240); miniFail(g, msg); }
    return {
      update(dt) {
        if (over) return;
        t += dt; sh = Math.max(0, sh - dt * 20);
        spd = 240 + Math.min(200, cleared * 6);
        dist += spd * dt;
        while (nextX < dist + W() + 200) spawn();
        const slide = pl.onFloor && (AY() > .5 || key('s') || key('arrowdown'));
        pl.h = slide ? 14 : 30;
        const want = pressed('a') || pressed('b') || jq; jq = false;
        if (want) {
          if (pl.onFloor) { pl.vy = -520; pl.onFloor = false; pl.air2 = true; sfx('jump'); fxBurst(fx, PX, pl.by, C.orange, 8, 120); }
          else if (pl.air2) { pl.vy = -430; pl.air2 = false; sfx('jump'); fxBurst(fx, PX, pl.by - 14, C.yellow, 10, 160); }
        }
        pl.vy += 1400 * dt; pl.by += pl.vy * dt;
        const inGap = obs.some(o => o.type === 'gap' && cx() > o.wx + 6 && cx() < o.wx + o.w - 6);
        if (pl.by >= GY() && !inGap) { if (!pl.onFloor) { sfx('land'); fxBurst(fx, PX, GY(), C.orange, 10, 110); } pl.by = GY(); pl.vy = 0; pl.onFloor = true; }
        else if (inGap) pl.onFloor = false;
        if (pl.by > H() + 40) { die('You fell into a gap.'); return; }
        const box = { x: cx() - 11, y: pl.by - pl.h, w: 22, h: pl.h };
        for (const o of obs) {
          if (o.done || o.type === 'gap') continue;
          const r = o.type === 'bird' ? { x: o.wx, y: GY() - 44, w: o.w, h: 26 } : { x: o.wx, y: GY() - 22, w: o.w, h: 22 };
          if (ov(box, r)) { die(o.type === 'bird' ? 'A bird knocked you off.' : 'You hit a spike.'); return; }
        }
        for (const o of obs) if (!o.done && o.wx + o.w < cx() - 11) { o.done = true; cleared++; pop(pp, PX, GY() - 90, '+1', C.yellow); }
        for (let i = obs.length - 1; i >= 0; i--) if (obs[i].wx < dist - 200) obs.splice(i, 1);
        if (cleared >= g.goal) { over = true; sfx('win'); completeMini(); return; }
        if (Math.random() < .7) fxBurst(fx, PX - 12, pl.by - 6, C.orange, 1, 40);
        fxUpdate(fx, dt, 0); popTick(pp, dt);
        hud('Cleared ' + cleared + '/' + g.goal + ' • A: jump, again in the air • Hold down: slide');
      },
      draw() {
        ctx2d.save(); if (sh > 0) ctx2d.translate(rand(-sh, sh) * .4, rand(-sh, sh) * .4);
        sky('#2a0f2e', '#0b0716');
        glow(W() * .8, GY() - 60, 180, 'rgba(255,120,40,.35)');
        stars(dist * .1, 40, 'rgba(255,220,200,.5)');
        hills(dist * .002, '#3b1638', GY() - 60, 40, .012);
        hills(dist * .005, '#24102a', GY() - 20, 30, .02);
        rect(0, GY(), W(), H() - GY(), '#2b1a14');
        rect(0, GY(), W(), 3, C.orange);
        for (let x = 0; x < W() + 40; x += 40) { const sx = x - (dist % 40); line(sx, GY() + 14, sx - 16, H(), 'rgba(255,140,60,.18)', 2); }
        for (const o of obs) {
          const sx = o.wx - dist + PX;
          if (sx > W() + 60 || sx + o.w < -40) continue;
          if (o.type === 'gap') { rect(sx, GY(), o.w, H() - GY(), '#07040a'); line(sx, GY(), sx, H(), C.orange, 2); line(sx + o.w, GY(), sx + o.w, H(), C.orange, 2); }
          else if (o.type === 'spike') { for (let k = 0; k < o.w; k += 13) polygon([[sx + k, GY()], [sx + k + 6.5, GY() - 22], [sx + Math.min(o.w, k + 13), GY()]], C.red); }
          else { const wy = Math.sin(t * 12) * 5; glow(sx + 22, GY() - 31, 26, 'rgba(255,80,60,.5)'); polygon([[sx, GY() - 36 + wy], [sx + 22, GY() - 44], [sx + 44, GY() - 36 + wy], [sx + 22, GY() - 18]], '#ff5a4a'); }
        }
        const py = pl.by - pl.h / 2;
        glow(PX, py, 34, 'rgba(255,140,40,.7)');
        ctx2d.beginPath(); ctx2d.ellipse(PX, py, 11, pl.h / 2, 0, 0, TAU); ctx2d.fillStyle = C.orange; ctx2d.fill();
        circle(PX, py - 2, 5, C.yellow);
        fxDraw(fx); popDraw(pp);
        ctx2d.restore();
      },
      swipe(dx, dy) { if (dy < -30) jq = true; },
      stop() {}
    };
  }

  /* ================= 2. Gravity Flip ================= */
  function gFlip(g) {
    const fx = [], pp = [], obs = [], CEIL = 92, PX = 120;
    let gd = 1, dist = 0, coins = 0, over = false, nextX = 480, t = 0, sh = 0, flipQ = false;
    const pl = { y: GY() - 26, vy: 0, h: 26 };
    const mid = () => (GY() + CEIL) / 2 - 7;
    function spawn() {
      const r = Math.random();
      if (r < .28) { obs.push({ k: 'hole', side: Math.random() < .5 ? 1 : -1, wx: nextX, w: randi(70, 100) }); nextX += 220; }
      else if (r < .5) { obs.push({ k: 'spike', side: 1, wx: nextX, w: 30 }); nextX += 200; }
      else if (r < .7) { obs.push({ k: 'spike', side: -1, wx: nextX, w: 30 }); nextX += 200; }
      else { for (let i = 0; i < 4; i++) obs.push({ k: 'coin', wx: nextX + i * 34, w: 14, got: false }); nextX += 150 + 4 * 34; }
      nextX += rand(40, 90);
    }
    function die(msg) { if (over) return; over = true; sh = 14; sfx('hurt'); fxBurst(fx, PX, pl.y + pl.h / 2, C.red, 30, 240); miniFail(g, msg); }
    return {
      update(dt) {
        if (over) return;
        t += dt; sh = Math.max(0, sh - dt * 20);
        const spd = 230 + Math.min(170, coins * 4);
        dist += spd * dt;
        while (nextX < dist + W() + 200) spawn();
        if (pressed('a') || flipQ) { gd = -gd; sfx('flip'); fxBurst(fx, PX, pl.y + pl.h / 2, C.cyan, 14, 160); }
        flipQ = false;
        const cxw = dist + PX;
        pl.vy += gd * 1500 * dt; pl.y += pl.vy * dt;
        const inHole = obs.some(o => o.k === 'hole' && o.side === gd && cxw > o.wx + 6 && cxw < o.wx + o.w - 6);
        if (!inHole) {
          if (gd > 0 && pl.y + pl.h >= GY()) { pl.y = GY() - pl.h; pl.vy = 0; }
          else if (gd < 0 && pl.y <= CEIL) { pl.y = CEIL; pl.vy = 0; }
        }
        if ((gd > 0 && pl.y > H() + 30) || (gd < 0 && pl.y + pl.h < -30)) { die('You fell through a hole.'); return; }
        const box = { x: cxw - 10, y: pl.y, w: 20, h: pl.h };
        for (const o of obs) {
          if (o.k === 'hole') continue;
          if (o.k === 'spike') {
            const r = o.side > 0 ? { x: o.wx, y: GY() - 20, w: o.w, h: 20 } : { x: o.wx, y: CEIL, w: o.w, h: 20 };
            if (ov(box, r)) { die('Spikes!'); return; }
          } else if (!o.got && ov(box, { x: o.wx, y: mid(), w: 14, h: 14 })) {
            o.got = true; coins++; sfx('coin'); pop(pp, PX, pl.y - 10, '+1', C.gold); fxBurst(fx, PX, pl.y + 13, C.gold, 8, 120);
          }
        }
        for (let i = obs.length - 1; i >= 0; i--) if (obs[i].wx < dist - 200) obs.splice(i, 1);
        if (coins >= g.goal) { over = true; sfx('win'); completeMini(); return; }
        fxUpdate(fx, dt, 0); popTick(pp, dt);
        hud('Coins ' + coins + '/' + g.goal + ' • A or swipe: flip gravity');
      },
      draw() {
        ctx2d.save(); if (sh > 0) ctx2d.translate(rand(-sh, sh) * .4, rand(-sh, sh) * .4);
        sky('#081b2b', '#0b0a1f');
        rect(0, 0, W(), CEIL, '#15223a'); rect(0, CEIL - 3, W(), 3, C.cyan);
        rect(0, GY(), W(), H() - GY(), '#15223a'); rect(0, GY(), W(), 3, C.cyan);
        for (let x = 0; x < W() + 30; x += 30) { const sx = x - (dist % 30); circle(sx, CEIL + 8, 1.5, 'rgba(85,230,255,.35)'); circle(sx, GY() - 8, 1.5, 'rgba(85,230,255,.35)'); }
        for (const o of obs) {
          const sx = o.wx - dist + PX;
          if (sx > W() + 60 || sx + o.w < -40) continue;
          if (o.k === 'hole') {
            if (o.side > 0) { rect(sx, GY(), o.w, H() - GY(), '#03060c'); line(sx, GY(), sx, H(), C.cyan, 2); }
            else { rect(sx, 0, o.w, CEIL, '#03060c'); line(sx, CEIL, sx, 0, C.cyan, 2); }
          } else if (o.k === 'spike') {
            for (let k = 0; k < o.w; k += 10) {
              const w = Math.min(10, o.w - k);
              if (o.side > 0) polygon([[sx + k, GY()], [sx + k + w / 2, GY() - 20], [sx + k + w, GY()]], C.red);
              else polygon([[sx + k, CEIL], [sx + k + w / 2, CEIL + 20], [sx + k + w, CEIL]], C.red);
            }
          } else if (!o.got) {
            const sq = .4 + .6 * Math.abs(Math.cos(t * 5 + o.wx));
            glow(sx + 7, mid() + 7, 14, 'rgba(255,209,92,.5)');
            ctx2d.save(); ctx2d.translate(sx + 7, mid() + 7); ctx2d.scale(sq, 1); circle(0, 0, 7, C.gold); ctx2d.restore();
          }
        }
        const cy = pl.y + pl.h / 2;
        glow(PX, cy, 30, 'rgba(85,230,255,.6)');
        ctx2d.save(); ctx2d.translate(PX, cy); ctx2d.rotate(gd > 0 ? 0 : Math.PI); rect(-10, -13, 20, 26, C.cyan); rect(-4, -6, 8, 5, '#fff'); ctx2d.restore();
        text(gd > 0 ? 'GRAVITY DOWN' : 'GRAVITY UP', W() - 12, 84, 12, C.cyan, 'right', 800);
        fxDraw(fx); popDraw(pp);
        ctx2d.restore();
      },
      swipe() { flipQ = true; },
      stop() {}
    };
  }

  /* ================= 3. Shaft Climb ================= */
  function gShaft(g) {
    const fx = [], pp = [], ledges = [], spikes = [];
    const L = 30, R = () => W() - 30;
    let genY = 0, camY = 0, startY = 0, over = false, t = 0, sh = 0, jbuf = 0, meters = 0, lastLeft = true;
    const pl = { x: 0, y: 0, w: 20, h: 26, vx: 0, vy: 0, bump: 0, onFloor: false, wall: 0 };
    function gen() {
      while (genY > camY - H() - 200) {
        genY -= rand(96, 128);
        lastLeft = Math.random() < .5 ? lastLeft : !lastLeft;
        const w = randi(80, 120);
        ledges.push({ x: lastLeft ? L : R() - w, y: genY, w, h: 10, ow: true });
        if (Math.random() < .5) {
          const sLeft = !lastLeft;
          spikes.push({ x: sLeft ? L : R() - 14, y: genY - 60, w: 14, h: 60 });
        }
      }
    }
    function die(msg) { if (over) return; over = true; sh = 12; sfx('hurt'); fxBurst(fx, pl.x + 10, pl.y + 13, C.red, 26, 220); miniFail(g, msg); }
    ledges.push({ x: L, y: 0, w: W() - 60, h: 10, ow: true });
    pl.x = W() / 2 - 10; pl.y = -pl.h; startY = pl.y; camY = pl.y - H() * .55;
    gen();
    return {
      update(dt) {
        if (over) return;
        t += dt; sh = Math.max(0, sh - dt * 20); jbuf -= dt;
        if (pressed('a') || pressed('b')) jbuf = .12;
        pl.wall = pl.x <= L + .5 ? -1 : pl.x + pl.w >= R() - .5 ? 1 : 0;
        pl.bump *= Math.max(0, 1 - 3 * dt);
        pl.vx = AX() * 190 + pl.bump;
        if (jbuf > 0) {
          if (pl.onFloor) { pl.vy = -500; pl.onFloor = false; jbuf = 0; sfx('jump'); }
          else if (pl.wall) { pl.vy = -470; pl.bump = -pl.wall * 340; jbuf = 0; sfx('up'); fxBurst(fx, pl.wall < 0 ? L : R(), pl.y + pl.h / 2, C.cyan, 12, 150); }
        }
        pl.vy = Math.min(900, pl.vy + 1100 * dt);
        if (pl.wall && pl.vy > 0) pl.vy = Math.min(pl.vy, 110);
        const hit = move(pl, dt, ledges);
        pl.onFloor = hit.floor;
        pl.x = clamp(pl.x, L, R() - pl.w);
        if (pl.y > camY + H() + 40) { die('You fell back down the shaft.'); return; }
        for (const s of spikes) if (ov(pl, s)) { die('The wall spikes got you.'); return; }
        camY = Math.min(camY, pl.y - H() * .55);
        gen();
        for (let i = ledges.length - 1; i >= 0; i--) if (ledges[i].y > camY + H() + 100) ledges.splice(i, 1);
        for (let i = spikes.length - 1; i >= 0; i--) if (spikes[i].y > camY + H() + 100) spikes.splice(i, 1);
        meters = Math.max(0, Math.floor((startY - pl.y) / 60));
        if (meters >= g.goal) { over = true; sfx('win'); completeMini(); return; }
        fxUpdate(fx, dt, 300); popTick(pp, dt);
        hud('Height ' + meters + '/' + g.goal + ' m • A: jump, press again on a wall to wall-jump');
      },
      draw() {
        ctx2d.save(); if (sh > 0) ctx2d.translate(rand(-sh, sh) * .4, rand(-sh, sh) * .4);
        sky('#1b1f35', '#07080f');
        stars(0, 36, 'rgba(200,215,255,.45)');
        ctx2d.translate(0, -camY);
        rect(0, camY - 10, L, H() + 20, '#262b40');
        rect(R(), camY - 10, W() - R(), H() + 20, '#262b40');
        for (let y = Math.floor(camY / 28) * 28; y < camY + H(); y += 28) { line(0, y, L, y, '#1b1f2e', 2); line(R(), y, W(), y, '#1b1f2e', 2); }
        for (const s of spikes) {
          const left = s.x < W() / 2;
          for (let k = 0; k < s.h; k += 12) {
            if (left) polygon([[s.x + s.w, s.y + k], [s.x, s.y + k + 6], [s.x + s.w, s.y + k + 12]], '#ff6f8e');
            else polygon([[s.x, s.y + k], [s.x + s.w, s.y + k + 6], [s.x, s.y + k + 12]], '#ff6f8e');
          }
        }
        for (const l of ledges) { rect(l.x, l.y, l.w, l.h, '#9bb4ff', 4); line(l.x, l.y, l.x + l.w, l.y, '#e0e8ff', 2); }
        glow(pl.x + pl.w / 2, pl.y + pl.h / 2, 26, 'rgba(85,230,255,.5)');
        rect(pl.x, pl.y, pl.w, pl.h, C.cyan, 6);
        circle(pl.x + pl.w / 2 + (pl.wall ? -pl.wall * 3 : 0), pl.y + 9, 3, '#0b1020');
        fxDraw(fx); popDraw(pp);
        ctx2d.restore();
      },
      stop() {}
    };
  }

  /* ================= 4. Lily Leap ================= */
  function gLily(g) {
    const CS = 44, ROWS = 8, RH = 46;
    const fx = [], pp = [], rows = [];
    let cross = 0, over = false, t = 0, sh = 0, speed = 1, cool = 0;
    const COL0 = () => (W() - 9 * CS) / 2;
    const colX = c => COL0() + c * CS + CS / 2;
    const rowY = r => GY() - 24 - r * RH;
    const vis = l => !l.sink || ((t + l.ph) % 3.2) < 2.3;
    const pl = { px: 0, r: 0, hopT: 0, hopLen: .16, from: null, to: null, riding: null };
    function buildRow(r) {
      const per = W() + 120, arr = [];
      let b = rand(0, 40);
      while (b < per) { const w = randi(84, 128); if (Math.random() < .8) arr.push({ b, w, sink: Math.random() < .3, ph: rand(0, 3) }); b += w + randi(40, 74); }
      rows[r] = { per, off: rand(0, per), v: (r % 2 ? 1 : -1) * rand(40, 58) * speed, arr };
    }
    const lx = (row, l, k) => ((((l.b + row.off) % row.per) + row.per) % row.per) - 60 + k * row.per;
    function onLog(r, px) {
      const row = rows[r];
      for (const l of row.arr) for (const k of [0, -1]) { const x = lx(row, l, k); if (px >= x && px <= x + l.w && vis(l)) return l; }
      return null;
    }
    function die(msg) { if (over) return; over = true; sh = 10; sfx('hurt'); fxBurst(fx, pl.px, rowY(pl.r), C.cyan, 24, 180); miniFail(g, msg); }
    function tryHop(dc, dr) {
      if (over || pl.hopT > 0 || (!dc && !dr)) return;
      const r = clamp(pl.r + dr, 0, ROWS - 1);
      const px = clamp(pl.px + dc * CS, COL0() + CS / 2, COL0() + 8 * CS + CS / 2);
      pl.from = { px: pl.px, r: pl.r }; pl.to = { px, r }; pl.hopT = pl.hopLen; pl.riding = null; sfx('jump');
    }
    function land() {
      const to = pl.to; pl.r = to.r; pl.px = to.px; pl.riding = null;
      if (to.r === 0) return;
      if (to.r === ROWS - 1) {
        cross++; sfx('win'); fxBurst(fx, pl.px, rowY(to.r), C.lime, 30, 200);
        if (cross >= g.goal) { over = true; completeMini(); return; }
        pl.r = 0; pl.px = colX(4); speed = Math.min(2.2, speed * 1.08);
        for (let r = 1; r < ROWS - 1; r++) rows[r].v *= 1.08;
        return;
      }
      const l = onLog(to.r, to.px);
      if (!l) { die('Splashed into the river.'); return; }
      pl.riding = l; sfx('land');
    }
    for (let r = 1; r < ROWS - 1; r++) buildRow(r);
    pl.px = colX(4); pl.r = 0;
    return {
      update(dt) {
        if (over) return;
        t += dt; sh = Math.max(0, sh - dt * 20); cool -= dt;
        for (let r = 1; r < ROWS - 1; r++) rows[r].off += rows[r].v * dt;
        if (pressed('a')) tryHop(0, 1);
        if (pressed('b')) tryHop(0, -1);
        if (cool <= 0 && Math.abs(AX()) > .6) { tryHop(AX() > 0 ? 1 : -1, 0); cool = .25; }
        if (pl.hopT > 0) {
          pl.hopT -= dt;
          const k = 1 - Math.max(0, pl.hopT) / pl.hopLen;
          pl.px = pl.from.px + (pl.to.px - pl.from.px) * k;
          if (pl.hopT <= 0) land();
        } else if (pl.riding) {
          pl.px += rows[pl.r].v * dt;
          if (!vis(pl.riding)) { die('The log sank under you.'); return; }
          if (pl.px < -24 || pl.px > W() + 24) { die('Carried off the river.'); return; }
        }
        if (over) return;
        fxUpdate(fx, dt, 0); popTick(pp, dt);
        hud('Far bank ' + cross + '/' + g.goal + ' • A forward • B back • Joystick sideways');
      },
      draw() {
        ctx2d.save(); if (sh > 0) ctx2d.translate(rand(-sh, sh) * .4, rand(-sh, sh) * .4);
        const wg = ctx2d.createLinearGradient(0, rowY(6) - RH / 2, 0, rowY(1) + RH / 2);
        wg.addColorStop(0, '#0c4a6e'); wg.addColorStop(1, '#062b44');
        ctx2d.fillStyle = wg; ctx2d.fillRect(0, rowY(6) - RH / 2, W(), rowY(1) - rowY(6) + RH);
        rect(0, 0, W(), rowY(7) + RH / 2, '#2f7d3a');
        rect(0, rowY(0) - RH / 2, W(), H() - rowY(0) + RH / 2, '#2f7d3a');
        for (let i = 0; i < 14; i++) { const x = (i * 53 + t * 30) % W(); line(x, rowY(1 + (i % 6)) + 4, x + 14, rowY(1 + (i % 6)) + 4, 'rgba(180,230,255,.2)', 2); }
        for (let r = 1; r < ROWS - 1; r++) {
          const row = rows[r], cy = rowY(r);
          for (const l of row.arr) for (const k of [0, -1]) {
            const x = lx(row, l, k);
            if (x > W() || x + l.w < 0) continue;
            if (!vis(l)) { rect(x, cy - 10, l.w, 20, 'rgba(120,80,40,.12)', 8); continue; }
            const tl = 2.3 - ((t + l.ph) % 3.2);
            ctx2d.globalAlpha = l.sink && tl < .6 ? .45 + .4 * Math.sin(t * 30) : 1;
            rect(x, cy - 12, l.w, 24, l.sink ? '#8a6a3a' : '#7a4a22', 8);
            rect(x + 4, cy - 9, l.w - 8, 5, 'rgba(255,220,160,.25)', 3);
            circle(x + 10, cy + 1, 3.5, '#c08a4a'); circle(x + l.w - 10, cy + 1, 3.5, '#c08a4a');
            ctx2d.globalAlpha = 1;
          }
        }
        const k = pl.hopT > 0 ? 1 - pl.hopT / pl.hopLen : 1;
        const yy = pl.hopT > 0 ? rowY(pl.from.r) + (rowY(pl.to.r) - rowY(pl.from.r)) * k : rowY(pl.r);
        const lift = pl.hopT > 0 ? Math.sin(k * Math.PI) * 16 : 0;
        circle(pl.px, yy, 12, 'rgba(0,0,0,.3)');
        circle(pl.px, yy - lift, 13, '#6dff7a');
        circle(pl.px - 5, yy - lift - 6, 3, '#fff'); circle(pl.px + 5, yy - lift - 6, 3, '#fff');
        fxDraw(fx); popDraw(pp);
        ctx2d.restore();
      },
      swipe(dx, dy) { if (Math.abs(dx) > Math.abs(dy)) tryHop(dx > 0 ? 1 : -1, 0); else tryHop(0, dy < 0 ? 1 : -1); },
      stop() {}
    };
  }

  /* ================= 5. Vine Vault ================= */
  function gVine(g) {
    const GRAV = 900, fx = [], pp = [], vines = [];
    let nextX = 330, grabs = 0, over = false, t = 0, cam = 0, jq = false, sh = 0;
    const v0 = { ax: 120, ay: 110, L: 230, used: true };
    vines.push(v0);
    const pl = { x: 120 + 230 * Math.sin(.5), y: 110 + 230 * Math.cos(.5), vx: 0, vy: 0, v: v0, th: .5, om: 0 };
    function spawn() { vines.push({ ax: nextX, ay: rand(90, 140), L: rand(200, 260), used: false }); nextX += rand(210, 260); }
    function die(msg) { if (over) return; over = true; sh = 10; sfx('hurt'); fxBurst(fx, pl.x, GY(), C.red, 26, 200); miniFail(g, msg); }
    return {
      update(dt) {
        if (over) return;
        t += dt; sh = Math.max(0, sh - dt * 20);
        while (nextX < cam + W() + 300) spawn();
        const want = pressed('a') || pressed('b') || jq; jq = false;
        if (pl.v) {
          const v = pl.v;
          pl.om += -(GRAV / v.L) * Math.sin(pl.th) * dt;
          pl.om += AX() * 2.4 * dt;
          pl.om *= 1 - .03 * dt;
          pl.th += pl.om * dt;
          pl.x = v.ax + v.L * Math.sin(pl.th); pl.y = v.ay + v.L * Math.cos(pl.th);
          if (want) {
            pl.vx = v.L * Math.cos(pl.th) * pl.om; pl.vy = -v.L * Math.sin(pl.th) * pl.om;
            pl.v = null; sfx('jump'); fxBurst(fx, pl.x, pl.y, C.lime, 10, 120);
          }
        } else {
          pl.vy += GRAV * dt; pl.x += pl.vx * dt; pl.y += pl.vy * dt;
          for (const v of vines) {
            if (v.used) continue;
            const d = dist(pl.x, pl.y, v.ax, v.ay);
            if (Math.abs(d - v.L) < 24) {
              v.used = true; grabs++; pl.v = v;
              pl.th = Math.atan2(pl.x - v.ax, pl.y - v.ay);
              pl.om = (pl.vx * Math.cos(pl.th) - pl.vy * Math.sin(pl.th)) / v.L;
              sfx('coin'); pop(pp, pl.x, pl.y - 22, '+1', C.lime);
              break;
            }
          }
          if (!pl.v && pl.y > GY()) { die('You dropped into the pit.'); return; }
        }
        if (grabs >= g.goal) { over = true; sfx('win'); completeMini(); return; }
        cam += (pl.x - 130 - cam) * Math.min(1, dt * 3);
        for (let i = vines.length - 1; i >= 0; i--) if (vines[i].ax < cam - 400) vines.splice(i, 1);
        fxUpdate(fx, dt, 200); popTick(pp, dt);
        hud('Vines ' + grabs + '/' + g.goal + ' • A: release, catch the next vine • Joystick: pump');
      },
      draw() {
        ctx2d.save(); if (sh > 0) ctx2d.translate(rand(-sh, sh) * .4, rand(-sh, sh) * .4);
        sky('#1d2b55', '#0a0f25');
        stars(cam * .2, 40, 'rgba(255,255,255,.5)');
        hills(cam * .004, '#1c2e4f', GY() - 110, 70, .006);
        hills(cam * .01, '#132140', GY() - 40, 40, .012);
        rect(0, GY(), W(), H() - GY(), '#120814');
        for (let x = -(cam % 26); x < W() + 26; x += 26) polygon([[x, GY()], [x + 13, GY() - 18], [x + 26, GY()]], '#5b1f3a');
        ctx2d.translate(-cam, 0);
        for (const v of vines) {
          const sx = v.ax;
          if (sx < cam - 60 || sx > cam + W() + 60) continue;
          line(sx, 78, sx, v.ay, 'rgba(255,255,255,.2)', 2);
          line(sx, v.ay, sx, v.ay + v.L, v.used ? 'rgba(255,255,255,.05)' : 'rgba(255,255,255,.18)', 1.5);
          circle(sx, v.ay, 5, v.used ? '#555' : C.gold);
          strokeCircle(sx, v.ay + v.L, 9, v.used ? 'rgba(255,255,255,.1)' : C.gold, 2);
        }
        if (pl.v) line(pl.v.ax, pl.v.ay, pl.x, pl.y, 'rgba(255,255,255,.7)', 2);
        glow(pl.x, pl.y, 26, C.lime, .6);
        circle(pl.x, pl.y, 10, C.lime);
        fxDraw(fx); popDraw(pp);
        ctx2d.restore();
      },
      swipe(dx, dy) { if (dy < -30) jq = true; },
      stop() {}
    };
  }

  /* ================= 6. Stomp Trail ================= */
  function gStomp(g) {
    const LEN = 3400, fx = [], pp = [];
    let solids = [], foes = [], stomps = 0, hearts = 3, over = false, t = 0, inv = 0, sh = 0, jq = false;
    const pl = { x: 60, y: 0, w: 22, h: 30, vx: 0, vy: 0, face: 1, grounded: false, safe: { x: 60, y: 0 } };
    const mkFoe = (minX, maxX, y) => ({ x: minX, y, w: 26, h: 22, minX, maxX: Math.max(minX, maxX), dir: 1, dead: false, dt: 0 });
    function build() {
      solids = []; foes = [];
      let x = 0, i = 0;
      while (x < LEN) {
        const w = i === 0 ? 300 : randi(170, 280), top = GY();
        solids.push({ x, y: top, w, h: 200, ground: true });
        if (i > 1 && Math.random() < .6) foes.push(mkFoe(x + 40, x + w - 40, top - 22));
        if (i > 0 && Math.random() < .55) {
          const pw = randi(90, 130), px = x + rand(20, Math.max(21, w - 60)), py = top - rand(90, 150);
          solids.push({ x: px, y: py, w: pw, h: 16, ow: true });
          if (Math.random() < .6) foes.push(mkFoe(px, px + pw - 26, py - 22));
        }
        x += w;
        if (x < LEN) x += randi(70, 110);
        i++;
      }
    }
    function lose(msg) {
      hearts--; sh = 10; sfx('hurt');
      if (hearts <= 0) { over = true; miniFail(g, msg); return false; }
      return true;
    }
    build();
    pl.y = GY() - pl.h;
    pl.safe = { x: pl.x, y: pl.y };
    return {
      update(dt) {
        if (over) return;
        t += dt; inv -= dt; sh = Math.max(0, sh - dt * 20);
        const want = pressed('a') || pressed('b') || jq; jq = false;
        pl.vx = AX() * 200;
        if (Math.abs(pl.vx) > 5) pl.face = Math.sign(pl.vx);
        if (want && pl.grounded) { pl.vy = -560; sfx('jump'); }
        pl.vy = Math.min(900, pl.vy + 1400 * dt);
        const pb = pl.y + pl.h;
        const hit = move(pl, dt, solids);
        pl.grounded = hit.floor;
        if (hit.floor && hit.on && hit.on.ground) pl.safe = { x: pl.x, y: pl.y };
        pl.x = clamp(pl.x, 0, LEN - pl.w);
        for (const f of foes) {
          if (f.dead) { f.dt -= dt; continue; }
          f.x += f.dir * 55 * dt;
          if (f.x < f.minX) { f.x = f.minX; f.dir = 1; }
          if (f.x > f.maxX) { f.x = f.maxX; f.dir = -1; }
          if (inv > 0 || !ov(pl, f)) continue;
          if (pl.vy > 0 && pb <= f.y + 8) {
            f.dead = true; f.dt = .35; pl.vy = -420; stomps++;
            sfx('coin'); pop(pp, f.x + 13, f.y - 14, '+1', C.lime); fxBurst(fx, f.x + 13, f.y + 10, C.yellow, 12, 160);
            if (stomps >= g.goal) { over = true; sfx('win'); completeMini(); return; }
          } else {
            if (!lose('You ran out of hearts.')) return;
            inv = 1.3; pl.vy = -300; pl.vx = -pl.face * 180;
            fxBurst(fx, pl.x + 11, pl.y + 15, C.red, 16, 160);
          }
        }
        foes = foes.filter(f => !(f.dead && f.dt <= 0));
        if (pl.y > H() + 20) {
          if (!lose('You fell into a pit.')) return;
          pl.x = pl.safe.x; pl.y = pl.safe.y - 40; pl.vy = 0; pl.vx = 0; inv = 1.3;
        }
        if (pl.x > LEN - 80) { build(); pl.x = 60; pl.y = GY() - pl.h; pl.safe = { x: pl.x, y: pl.y }; }
        fxUpdate(fx, dt, 500); popTick(pp, dt);
        hud('Stomps ' + stomps + '/' + g.goal + ' • Hearts ' + hearts + ' • A: jump, land on their heads');
      },
      draw() {
        const cam = clamp(pl.x - W() * .4, 0, LEN - W());
        ctx2d.save(); if (sh > 0) ctx2d.translate(rand(-sh, sh) * .4, rand(-sh, sh) * .4);
        sky('#2b1b4a', '#0c0a1d');
        glow(W() * .7, 160, 110, 'rgba(255,160,90,.25)');
        hills(cam * .002, '#2c2350', GY() - 160, 60, .006);
        hills(cam * .006, '#1d1738', GY() - 60, 40, .01);
        ctx2d.translate(-cam, 0);
        for (const s of solids) {
          if (s.ground) { rect(s.x, s.y, s.w, s.h, '#4a3a2a'); rect(s.x, s.y, s.w, 10, '#4ec36a', 4); }
          else { rect(s.x, s.y, s.w, s.h, '#8c7aa6', 6); rect(s.x, s.y, s.w, 4, '#c9b8e6'); }
        }
        for (const f of foes) {
          if (f.dead) { rect(f.x, f.y + f.h - 6, f.w, 6, '#7b2f5a', 3); continue; }
          const wob = Math.sin(t * 10 + f.x) * 1.5;
          glow(f.x + 13, f.y + 12, 18, 'rgba(255,80,120,.3)');
          circle(f.x + 13, f.y + 12 + wob, 12, '#d6457a');
          circle(f.x + 9, f.y + 9 + wob, 2.5, '#fff'); circle(f.x + 17, f.y + 9 + wob, 2.5, '#fff');
        }
        const blink = inv > 0 && Math.floor(t * 16) % 2 === 0;
        if (!blink) {
          glow(pl.x + 11, pl.y + 15, 24, 'rgba(255,209,92,.4)');
          rect(pl.x, pl.y, pl.w, pl.h, C.yellow, 6);
          circle(pl.x + 8 + pl.face * 2, pl.y + 9, 2.5, '#222');
        }
        fxDraw(fx); popDraw(pp);
        ctx2d.restore();
        text('♥'.repeat(hearts), 12, 100, 16, C.red, 'left', 900);
      },
      swipe(dx, dy) { if (dy < -30) jq = true; },
      stop() {}
    };
  }

  /* ================= 7. Ice Sprint ================= */
  function gIce(g) {
    const fx = [], pp = [], LEN = 5400;
    let solids = [], spikes = [], flags = [], lives = 3, reached = 0, over = false, t = 0, sh = 0, jbuf = 0, jq = false;
    const pl = { x: 60, y: 0, w: 20, h: 28, vx: 0, vy: 0, grounded: false, on: null, cp: 60 };
    function build() {
      solids = []; spikes = []; flags = [];
      let x = 0, i = 0;
      while (x < LEN) {
        const w = randi(170, 260), ice = Math.random() < .6;
        solids.push({ x, y: GY(), w, h: 200, ice });
        if (i > 0 && Math.random() < .45) spikes.push({ x: x + rand(40, w - 60), y: GY() - 18, w: 24, h: 18 });
        x += w;
        const gw = randi(84, 120);
        if (x < LEN) {
          if (Math.random() < .55) { const ox = x + gw / 2 - 40; solids.push({ x: ox, ox, y: GY() - 70, w: 80, h: 14, ice: true, mov: true, ph: rand(0, 6), amp: 12, dx: 0 }); }
          x += gw;
        }
        i++;
        if (i % 2 === 0) flags.push({ x: x + 60, got: false });
      }
    }
    function lose(msg) {
      lives--; sh = 10; sfx('hurt');
      if (lives <= 0) { over = true; miniFail(g, msg); return false; }
      pl.x = pl.cp; pl.y = GY() - pl.h - 40; pl.vx = 0; pl.vy = 0; pl.grounded = false; pl.on = null;
      return true;
    }
    build();
    pl.y = GY() - pl.h;
    return {
      update(dt) {
        if (over) return;
        t += dt; sh = Math.max(0, sh - dt * 20); jbuf -= dt;
        if (pressed('a') || pressed('b') || jq) jbuf = .12;
        jq = false;
        for (const s of solids) if (s.mov) { const nx = s.ox + Math.sin(t * 1.1 + s.ph) * s.amp; s.dx = nx - s.x; s.x = nx; }
        if (pl.grounded && pl.on && pl.on.mov) pl.x += pl.on.dx;
        const onIce = pl.grounded && pl.on && pl.on.ice;
        const accel = pl.grounded ? (onIce ? 300 : 1500) : 700;
        pl.vx += clamp(AX() * 240 - pl.vx, -accel * dt, accel * dt);
        if (jbuf > 0 && pl.grounded) { pl.vy = -560; pl.grounded = false; jbuf = 0; sfx('jump'); }
        pl.vy = Math.min(900, pl.vy + 1300 * dt);
        const hit = move(pl, dt, solids);
        pl.grounded = hit.floor; pl.on = hit.floor ? hit.on : null;
        if (pl.y > H() + 10) { lose('You fell into a gap.'); return; }
        for (const s of spikes) if (ov(pl, s)) { lose('Spikes got you.'); return; }
        for (const f of flags) if (!f.got && pl.x > f.x) {
          f.got = true; reached++; pl.cp = f.x + 10; sfx('win'); pop(pp, pl.x, pl.y - 26, 'CHECKPOINT', C.green);
        }
        if (reached >= g.goal) { over = true; sfx('win'); completeMini(); return; }
        fxUpdate(fx, dt, 300); popTick(pp, dt);
        hud('Flags ' + reached + '/' + g.goal + ' • Lives ' + lives + ' • A: jump • The ice is slippery');
      },
      draw() {
        const cam = Math.max(0, pl.x - W() * .35);
        ctx2d.save(); if (sh > 0) ctx2d.translate(rand(-sh, sh) * .4, rand(-sh, sh) * .4);
        sky('#1a2f4f', '#070d1c');
        stars(cam * .1, 40, 'rgba(220,240,255,.5)');
        hills(cam * .003, '#1c3a5e', GY() - 150, 60, .006);
        ctx2d.translate(-cam, 0);
        for (const s of solids) {
          if (s.mov) { glow(s.x + 40, s.y + 7, 30, 'rgba(120,230,255,.35)'); rect(s.x, s.y, s.w, s.h, '#c9f1ff', 6); continue; }
          rect(s.x, s.y, s.w, s.h, s.ice ? '#2e5f8c' : '#3b3b4f');
          rect(s.x, s.y, s.w, 6, s.ice ? '#c9f1ff' : '#8a8aa6', 3);
        }
        for (const s of spikes) for (let k = 0; k < s.w; k += 8) polygon([[s.x + k, s.y + s.h], [s.x + k + 4, s.y], [s.x + Math.min(s.w, k + 8), s.y + s.h]], '#ff6f8e');
        for (const f of flags) {
          line(f.x, GY() - 70, f.x, GY(), '#dddddd', 3);
          polygon([[f.x, GY() - 70], [f.x + 26, GY() - 62], [f.x, GY() - 54]], f.got ? C.green : C.red);
        }
        glow(pl.x + pl.w / 2, pl.y + pl.h / 2, 24, 'rgba(180,230,255,.5)');
        circle(pl.x + pl.w / 2, pl.y + pl.h / 2, 13, '#f2f7ff');
        circle(pl.x + pl.w / 2 + 3 * Math.sign(pl.vx || 1), pl.y + 9, 2.5, '#111');
        fxDraw(fx); popDraw(pp);
        ctx2d.restore();
      },
      swipe(dx, dy) { if (dy < -30) jq = true; },
      stop() {}
    };
  }

  /* ================= 8. Crumble Path ================= */
  function gCrumble(g) {
    const fx = [], pp = [], tiles = [];
    let nextX = 0, lastY = 0, count = 0, crossed = 0, over = false, t = 0, cam = 0, jq = false, sh = 0;
    const pl = { x: 80, y: 0, w: 20, h: 28, vx: 0, vy: 0, grounded: false };
    function spawn(first) {
      const w = first ? 360 : randi(70, 120);
      if (!first) nextX += randi(50, 100);
      const y = first ? GY() : clamp(lastY + rand(-70, 40), GY() - 170, GY());
      const type = first || Math.random() < .3 ? 'stone' : Math.random() < .3 ? 'bounce' : 'crumble';
      tiles.push({ x: nextX, y, w, h: 16, type, idx: count++, ow: true, st: 0, falling: false, vy: 0, gone: false });
      nextX += w; lastY = y;
    }
    function die(msg) { if (over) return; over = true; sh = 10; sfx('hurt'); miniFail(g, msg); }
    pl.y = GY() - pl.h;
    return {
      update(dt) {
        if (over) return;
        t += dt; sh = Math.max(0, sh - dt * 20);
        while (nextX < cam + W() + 200) spawn(count === 0);
        const want = pressed('a') || pressed('b') || jq; jq = false;
        pl.vx = AX() * 210;
        if (want && pl.grounded) { pl.vy = -560; pl.grounded = false; sfx('jump'); }
        pl.vy = Math.min(900, pl.vy + 1300 * dt);
        const hit = move(pl, dt, tiles.filter(s => !s.gone && !s.falling));
        pl.grounded = hit.floor;
        const on = hit.floor ? hit.on : null;
        if (on) {
          if (on.type === 'bounce') { pl.vy = -780; pl.grounded = false; sfx('up'); fxBurst(fx, pl.x + 10, on.y, C.yellow, 14, 160); }
          else if (on.type === 'crumble') { on.st += dt; if (on.st > .9) on.falling = true; }
          if (on.idx > crossed) { crossed = on.idx; pop(pp, pl.x, pl.y - 22, '+1', C.lime); }
        }
        for (const s of tiles) if (s.falling && !s.gone) { s.vy += 1300 * dt; s.y += s.vy * dt; if (s.y > H() + 60) s.gone = true; }
        if (pl.y > H() + 30) { die('You fell through the crumbled path.'); return; }
        if (crossed >= g.goal) { over = true; sfx('win'); completeMini(); return; }
        cam += (pl.x - W() * .35 - cam) * Math.min(1, dt * 4);
        for (let i = tiles.length - 1; i >= 0; i--) if (tiles[i].gone || tiles[i].x + tiles[i].w < cam - 200) tiles.splice(i, 1);
        fxUpdate(fx, dt, 500); popTick(pp, dt);
        hud('Platforms ' + crossed + '/' + g.goal + ' • A: jump • Crumbling tiles fall 1 s after you land');
      },
      draw() {
        ctx2d.save(); if (sh > 0) ctx2d.translate(rand(-sh, sh) * .4, rand(-sh, sh) * .4);
        sky('#241b3d', '#0a0814');
        stars(cam * .1, 30, 'rgba(230,220,255,.4)');
        hills(cam * .003, '#2a2250', GY() - 150, 60, .006);
        ctx2d.translate(-cam, 0);
        for (const s of tiles) {
          if (s.gone) continue;
          if (s.type === 'bounce') {
            rect(s.x, s.y, s.w, s.h, C.yellow, 6);
            for (let k = 8; k < s.w; k += 14) line(s.x + k, s.y + 3, s.x + k, s.y + s.h - 3, '#b08a1a', 2);
          } else if (s.type === 'crumble') {
            const j = s.st > .5 && !s.falling ? Math.sin(t * 60) * 2 : 0;
            rect(s.x + j, s.y, s.w, s.h, '#b9773f', 4);
            line(s.x + s.w * .3 + j, s.y, s.x + s.w * .4 + j, s.y + s.h, '#6b3f1a', 2);
            line(s.x + s.w * .7 + j, s.y, s.x + s.w * .6 + j, s.y + s.h, '#6b3f1a', 2);
          } else {
            rect(s.x, s.y, s.w, s.h, '#7d6d93', 4); rect(s.x, s.y, s.w, 4, '#aa9cc2');
          }
        }
        glow(pl.x + 10, pl.y + 14, 24, 'rgba(180,255,120,.4)');
        rect(pl.x, pl.y, pl.w, pl.h, C.lime, 6);
        circle(pl.x + 13, pl.y + 9, 2.5, '#111');
        fxDraw(fx); popDraw(pp);
        ctx2d.restore();
      },
      swipe(dx, dy) { if (dy < -30) jq = true; },
      stop() {}
    };
  }

  /* ---------- registry ---------- */
  return {
    engines: {
      n13_emberrun: gEmber,
      n13_gravflip: gFlip,
      n13_shaftclimb: gShaft,
      n13_lilyleap: gLily,
      n13_vinevault: gVine,
      n13_stomptrail: gStomp,
      n13_icesprint: gIce,
      n13_crumble: gCrumble
    },
    minis: [
      { id: 'n13_emberrun', title: 'Ember Run', icon: '🔥', cat: 'ARCADE', desc: 'Endless run over spikes, gaps and birds. Jump, double-jump in the air, slide under the birds.', engine: 'n13_emberrun', goal: 30, cfg: {} },
      { id: 'n13_gravflip', title: 'Gravity Flip', icon: '🧲', cat: 'ACTION', desc: 'Run on the floor or the ceiling. Flip gravity to grab coins and dodge spikes and holes.', engine: 'n13_gravflip', goal: 25, cfg: {} },
      { id: 'n13_shaftclimb', title: 'Shaft Climb', icon: '🧱', cat: 'ACTION', desc: 'Wall-jump up a narrow shaft. Dodge the spike strips and never fall back down.', engine: 'n13_shaftclimb', goal: 30, cfg: {} },
      { id: 'n13_lilyleap', title: 'Lily Leap', icon: '🐸', cat: 'ARCADE', desc: 'Hop across a river on drifting logs. Some logs sink. Reach the far bank six times.', engine: 'n13_lilyleap', goal: 6, cfg: {} },
      { id: 'n13_vinevault', title: 'Vine Vault', icon: '🌿', cat: 'ARCADE', desc: 'Swing on vines, pump with the joystick, release and catch the next vine.', engine: 'n13_vinevault', goal: 20, cfg: {} },
      { id: 'n13_stomptrail', title: 'Stomp Trail', icon: '👟', cat: 'ACTION', desc: 'Side-scrolling platforms with walkers. Stomp them from above and keep your three hearts.', engine: 'n13_stomptrail', goal: 12, cfg: {} },
      { id: 'n13_icesprint', title: 'Ice Sprint', icon: '🧊', cat: 'ACTION', desc: 'Slippery ice, moving sleds over gaps and checkpoint flags. Three lives.', engine: 'n13_icesprint', goal: 8, cfg: {} },
      { id: 'n13_crumble', title: 'Crumble Path', icon: '🪨', cat: 'ARCADE', desc: 'Tiles crumble a second after you land on them. Bounce pads send you high.', engine: 'n13_crumble', goal: 30, cfg: {} }
    ],
    aaa: []
  };
})();
