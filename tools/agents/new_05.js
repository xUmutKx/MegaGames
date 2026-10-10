// new_05: rhythm and music toys. Every helper lives inside this closure.
window.__AG_new_05 = (function () {
  const SCALE = [0, 2, 4, 7, 9, 12, 14, 16];
  const BAR_COL = ['#ff914d', '#ff4fd8', '#55e6ff', '#a8ff5c', '#ffe36e', '#a978ff'];

  function NOTE(semi) { return 261.63 * Math.pow(2, semi / 12); }
  function tone(semi, type, vol, dur) { const f = NOTE(semi); beep(f, f * 1.01, dur || 0.2, type || 'sine', vol || 0.12); }
  function click(hi) { beep(hi ? 1500 : 980, hi ? 1300 : 860, 0.04, 'square', 0.06); }

  function rr(x, y, w, h, r) {
    ctx2d.beginPath();
    ctx2d.moveTo(x + r, y);
    ctx2d.arcTo(x + w, y, x + w, y + h, r);
    ctx2d.arcTo(x + w, y + h, x, y + h, r);
    ctx2d.arcTo(x, y + h, x, y, r);
    ctx2d.arcTo(x, y, x + w, y, r);
    ctx2d.closePath();
  }
  function fillRR(x, y, w, h, r, col) { rr(x, y, w, h, r); ctx2d.fillStyle = col; ctx2d.fill(); }
  function bg(top, bottom) {
    const g = ctx2d.createLinearGradient(0, 0, 0, H());
    g.addColorStop(0, top); g.addColorStop(1, bottom);
    ctx2d.fillStyle = g; ctx2d.fillRect(0, 0, W(), H());
  }
  function glow(col, blur) { ctx2d.shadowColor = col; ctx2d.shadowBlur = blur; }
  function unglow() { ctx2d.shadowBlur = 0; ctx2d.shadowColor = 'rgba(0,0,0,0)'; }
  function meterBar(x, y, w, h, frac, col) {
    rect(x, y, w, h, 'rgba(255,255,255,0.12)');
    rect(x, y, w * clamp(frac, 0, 1), h, col);
  }

  // Taps from the finger (pointer) or the A button. tap() returns null, or
  // {x,y,btn} where btn is true for the A button.
  function makeInput() {
    const s = { q: false, x: 0, y: 0 };
    return {
      pointer(x, y) { s.q = true; s.x = x; s.y = y; },
      tap() {
        const a = pressed('a');
        if (s.q) { s.q = false; return { x: s.x, y: s.y, btn: false }; }
        return a ? { x: W() / 2, y: H() / 2, btn: true } : null;
      }
    };
  }

  // ---------------------------------------------------------------
  // 1. Metro Catch: notes fall toward a hit line, tap on the beat.
  // ---------------------------------------------------------------
  function gMetro(g) {
    const inp = makeInput();
    const MULTS = [1, 1, 1, 0.5, 0.5, 1, 2, 1];
    const TRAVEL = 1.4;
    let songT = 0, bpm = 96, step = 60 / bpm, nextT = 1.0, notes = [];
    let hits = 0, combo = 0, lives = 5, idx = 0, done = false;
    let judge = '', judgeT = 0, judgeCol = C.white, flash = 0, parts = [];
    const hitY = () => H() - 230;
    const topY = () => 110;
    const speed = () => (hitY() - topY()) / TRAVEL;
    return {
      update(dt) {
        if (done) return;
        songT += dt;
        while (nextT < songT + TRAVEL) {
          const m = pick(MULTS);
          notes.push({ t: nextT, small: m < 1, done: false, col: idx % 2 ? C.cyan : C.pink });
          idx++;
          nextT += step * m;
        }
        const t = inp.tap();
        if (t) {
          let best = null, bd = 9;
          for (const n of notes) {
            if (n.done) continue;
            const d = Math.abs(n.t - songT);
            if (d < bd) { bd = d; best = n; }
          }
          if (best && bd < 0.14) {
            best.done = true;
            const perfect = bd < 0.05;
            hits++; combo++; flash = 1; judgeT = 0.6;
            judge = perfect ? 'PERFECT' : 'GOOD';
            judgeCol = perfect ? C.gold : C.green;
            tone(SCALE[hits % SCALE.length], 'triangle', 0.14, 0.25);
            fxBurst(parts, W() / 2, hitY(), perfect ? C.gold : C.cyan, perfect ? 22 : 12, 260);
            if (hits % 10 === 0) { bpm = Math.min(150, bpm + 6); step = 60 / bpm; }
          } else {
            combo = 0; judge = 'OFF BEAT'; judgeCol = C.orange; judgeT = 0.5;
            click(false);
          }
        }
        for (const n of notes) {
          if (!n.done && songT - n.t > 0.14) {
            n.done = true; lives--; combo = 0;
            judge = 'MISS'; judgeCol = C.red; judgeT = 0.6;
            fxBurst(parts, W() / 2, hitY(), C.red, 12, 180);
          }
        }
        notes = notes.filter(n => songT - n.t < 0.6);
        flash = Math.max(0, flash - dt * 4);
        judgeT = Math.max(0, judgeT - dt);
        fxUpdate(parts, dt, 200);
        if (lives <= 0) { done = true; miniFail(g, 'The beat slipped away'); return; }
        if (hits >= g.goal) { done = true; completeMini(); return; }
        hud(hits + ' / ' + g.goal + '  combo ' + combo);
      },
      draw() {
        bg('#0c0622', '#22103f');
        const cx = W() / 2, hy = hitY();
        rect(cx - 40, topY() - 20, 80, hy - topY() + 20, 'rgba(140,90,255,0.08)');
        rect(cx - 1, topY() - 20, 2, hy - topY() + 20, 'rgba(255,255,255,0.12)');
        for (const n of notes) {
          if (n.done) continue;
          const y = hy - (n.t - songT) * speed();
          if (y < topY() - 30 || y > hy + 40) continue;
          glow(n.col, 14);
          circle(cx, y, n.small ? 8 : 15, n.col);
          unglow();
        }
        const p = 1 + flash * 0.4;
        glow(C.cyan, 18);
        strokeCircle(cx, hy, 24 * p, 'rgba(255,255,255,' + (0.4 + flash * 0.5).toFixed(2) + ')', 3);
        unglow();
        rect(cx - 90, hy - 1, 180, 2, 'rgba(255,255,255,0.5)');
        fxDraw(parts);
        if (judgeT > 0) text(judge, cx, hy - 52, 22, judgeCol, 'center', 900);
        text(Math.round(bpm) + ' BPM', 16, 104, 14, C.cyan, 'left');
        text('♥'.repeat(Math.max(0, lives)), W() - 16, 104, 18, C.pink, 'right');
      }
    };
  }

  // ---------------------------------------------------------------
  // 2. Loop Builder: copy a 4-lane, 8-step drum loop by ear.
  // ---------------------------------------------------------------
  function gLoop(g) {
    const inp = makeInput();
    const LANES = [
      { n: 'KICK', c: C.orange, f: 110, t: 'sine', v: 0.3 },
      { n: 'SNARE', c: C.pink, f: 240, t: 'triangle', v: 0.16 },
      { n: 'HAT', c: C.cyan, f: 2400, t: 'square', v: 0.04 },
      { n: 'CLAP', c: C.lime, f: 880, t: 'sawtooth', v: 0.07 }
    ];
    const STEPS = 8, GX = 96, GY = 170, RH = 66, CH = 54;
    const cw = () => (W() - GX - 14) / STEPS;
    const BY = () => H() - 200;
    const blank = () => LANES.map(() => new Array(STEPS).fill(false));
    function makePat(round) {
      const dens = Math.min(0.5, 0.18 + round * 0.04);
      let p;
      do {
        p = LANES.map((_, r) => Array.from({ length: STEPS }, (_, c) =>
          r === 0 ? c % 4 === 0 : Math.random() < (r === 2 ? 0.5 : dens)));
      } while (p.reduce((a, row) => a + row.filter(Boolean).length, 0) < 6);
      return p;
    }
    function sound(r) { const L = LANES[r]; beep(L.f, L.f * 0.6, 0.12, L.t, L.v); }
    const tempo = () => 104 + Math.min(24, round * 3);
    function cellAt(x, y) {
      const c = Math.floor((x - GX) / cw());
      const r = Math.floor((y - GY) / RH);
      if (c < 0 || c >= STEPS || r < 0 || r >= LANES.length) return null;
      if (y - GY - r * RH > CH) return null;
      return [r, c];
    }

    let round = 0, mistakes = 0, target = makePat(0), mine = blank(), done = false;
    let phase = 'listen', ph = STEPS - 1, stepT = 0, lsteps = 0, diffT = 0, flashT = 0;
    let parts = [], msg = 'Listen closely', msgCol = C.white;

    function check() {
      let d = 0;
      for (let r = 0; r < LANES.length; r++) for (let c = 0; c < STEPS; c++) if (mine[r][c] !== target[r][c]) d++;
      if (d === 0) {
        round++; flashT = 0.8; msg = 'Locked in!'; msgCol = C.lime;
        fxBurst(parts, W() / 2, GY + RH * 2, C.lime, 30, 300);
        if (round >= g.goal) { done = true; completeMini(); return; }
        target = makePat(round); mine = blank();
        phase = 'listen'; lsteps = 0; ph = STEPS - 1; stepT = 0;
      } else {
        mistakes++; diffT = 1.4;
        msg = d + (d === 1 ? ' cell differs' : ' cells differ'); msgCol = C.orange;
        if (mistakes >= 3) { done = true; miniFail(g, 'Three wrong checks'); }
      }
    }

    return {
      update(dt) {
        if (done) return;
        stepT += dt;
        const sd = 30 / tempo();
        if (stepT >= sd) {
          stepT -= sd;
          ph = (ph + 1) % STEPS;
          if (phase === 'listen') {
            lsteps++;
            if (lsteps >= 2 * STEPS) { phase = 'build'; msg = 'Tap cells, then CHECK'; msgCol = C.cyan; }
          }
          const P = phase === 'listen' ? target : mine;
          for (let r = 0; r < LANES.length; r++) if (P[r][ph]) sound(r);
        }
        const t = inp.tap();
        if (t && phase === 'build') {
          if (t.btn) check();
          else if (t.y >= BY() && t.y <= BY() + 50) {
            if (t.x < W() / 2) { phase = 'listen'; lsteps = 0; msg = 'Listen again'; msgCol = C.white; }
            else check();
          } else {
            const cell = cellAt(t.x, t.y);
            if (cell) {
              const [r, c] = cell;
              mine[r][c] = !mine[r][c];
              if (mine[r][c]) sound(r);
            }
          }
        }
        if (done) return;
        flashT = Math.max(0, flashT - dt);
        diffT = Math.max(0, diffT - dt);
        fxUpdate(parts, dt, 120);
        hud(round + ' / ' + g.goal);
      },
      draw() {
        bg('#06141a', '#0b2a33');
        const P = phase === 'listen' ? target : mine;
        text('ROUND ' + (round + 1), 16, 104, 14, C.cyan, 'left');
        text('✖'.repeat(mistakes) || ' ', W() - 16, 104, 16, C.red, 'right');
        for (let r = 0; r < LANES.length; r++) {
          const L = LANES[r], y = GY + r * RH;
          text(L.n, 14, y + 34, 12, L.c, 'left', 900);
          for (let c = 0; c < STEPS; c++) {
            const x = GX + c * cw() + 2, on = P[r][c];
            if (on) { glow(L.c, 12); fillRR(x, y, cw() - 4, CH, 8, L.c); unglow(); }
            else fillRR(x, y, cw() - 4, CH, 8, 'rgba(255,255,255,0.07)');
            if (c === ph) fillRR(x, y, cw() - 4, CH, 8, 'rgba(255,255,255,0.12)');
            if (diffT > 0 && phase === 'build' && mine[r][c] !== target[r][c]) {
              rr(x, y, cw() - 4, CH, 8);
              ctx2d.strokeStyle = C.red; ctx2d.lineWidth = 3; ctx2d.stroke();
            }
          }
        }
        text(msg, W() / 2, GY + LANES.length * RH + 26, 16, msgCol, 'center', 800);
        fillRR(16, BY(), W() / 2 - 22, 50, 12, 'rgba(255,255,255,0.12)');
        text('LISTEN', (16 + W() / 2 - 6) / 2, BY() + 31, 17, '#fff', 'center', 900);
        fillRR(W() / 2 + 6, BY(), W() / 2 - 22, 50, 12, C.lime);
        text('CHECK', (W() / 2 + 6 + W() - 16) / 2, BY() + 31, 17, '#06141a', 'center', 900);
        fxDraw(parts);
      }
    };
  }

  // ---------------------------------------------------------------
  // 3. Echo Pads: six glowing pads play a growing melody.
  // ---------------------------------------------------------------
  function gEcho(g) {
    const inp = makeInput();
    const PADS = [
      { s: 0, c: C.cyan }, { s: 4, c: C.pink }, { s: 7, c: C.gold },
      { s: 9, c: C.green }, { s: 12, c: C.purple }, { s: 14, c: C.orange }
    ];
    const PW = 150, PH = 124, GAP = 16;
    const padRect = (i) => {
      const x0 = (W() - (2 * PW + GAP)) / 2;
      return { x: x0 + (i % 2) * (PW + GAP), y: 200 + Math.floor(i / 2) * (PH + GAP), w: PW, h: PH };
    };
    const padAt = (x, y) => {
      for (let i = 0; i < PADS.length; i++) {
        const r = padRect(i);
        if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return i;
      }
      return -1;
    };
    let seq = [], state = 'pause', si = 0, ji = 0, timer = 0.8, rounds = 0, done = false;
    let lit = PADS.map(() => 0), sel = 0, stickMoved = false, parts = [];
    function addStep() { seq.push(randi(0, PADS.length - 1)); state = 'show'; si = 0; timer = 0.6; }
    function press(i) {
      lit[i] = 1; tone(PADS[i].s, 'triangle', 0.14, 0.25);
      fxBurst(parts, padRect(i).x + PW / 2, padRect(i).y + PH / 2, PADS[i].c, 10, 160);
      if (i !== seq[ji]) { done = true; miniFail(g, 'Wrong pad'); return; }
      ji++;
      if (ji === seq.length) {
        rounds++;
        if (rounds >= g.goal) { done = true; completeMini(); return; }
        state = 'pause'; timer = 0.9;
      }
    }
    return {
      update(dt) {
        if (done) return;
        for (let i = 0; i < lit.length; i++) lit[i] = Math.max(0, lit[i] - dt * 3);
        fxUpdate(parts, dt, 60);
        if (state === 'pause') { timer -= dt; if (timer <= 0) addStep(); }
        else if (state === 'show') {
          timer -= dt;
          if (timer <= 0) {
            if (si < seq.length) {
              const i = seq[si];
              lit[i] = 1; tone(PADS[i].s, 'sine', 0.13, 0.3);
              si++;
              timer = rounds >= 6 ? 0.42 : 0.55;
            } else { state = 'input'; ji = 0; }
          }
        } else if (state === 'input') {
          const t = inp.tap();
          const ax = AX(), ay = AY();
          if (Math.abs(ax) > 0.6 || Math.abs(ay) > 0.6) {
            if (!stickMoved) {
              stickMoved = true;
              let col = sel % 2, row = Math.floor(sel / 2);
              if (Math.abs(ax) >= Math.abs(ay)) col = ax > 0 ? 1 : 0; else row = clamp(row + (ay > 0 ? 1 : -1), 0, 2);
              sel = row * 2 + col;
            }
          } else stickMoved = false;
          if (t) {
            const i = t.btn ? sel : padAt(t.x, t.y);
            if (i >= 0) { sel = i; press(i); }
          }
        }
        if (done) return;
        hud(rounds + ' / ' + g.goal);
      },
      draw() {
        bg('#120a24', '#2a0f33');
        for (let i = 0; i < PADS.length; i++) {
          const r = padRect(i), P = PADS[i], L = lit[i];
          if (L > 0.02) { glow(P.c, 30 * L); }
          fillRR(r.x, r.y, r.w, r.h, 22, P.c);
          unglow();
          fillRR(r.x + 8, r.y + 8, r.w - 16, r.h - 16, 16, 'rgba(0,0,0,' + (0.25 - L * 0.2).toFixed(2) + ')');
          if (L > 0.02) fillRR(r.x + 8, r.y + 8, r.w - 16, r.h - 16, 16, 'rgba(255,255,255,' + (L * 0.45).toFixed(2) + ')');
          if (state === 'input' && i === sel) { rr(r.x - 4, r.y - 4, r.w + 8, r.h + 8, 24); ctx2d.strokeStyle = '#fff'; ctx2d.lineWidth = 2; ctx2d.stroke(); }
        }
        fxDraw(parts);
        const label = state === 'input' ? 'YOUR TURN: repeat it' : 'LISTEN';
        text(label, W() / 2, 150, 18, state === 'input' ? C.lime : C.cyan, 'center', 900);
        text('Sequence ' + seq.length, W() / 2, 176, 13, '#c9b8ff', 'center');
        for (let i = 0; i < seq.length; i++) {
          circle(W() / 2 - (seq.length - 1) * 7 + i * 14, 640, 4, i < ji ? C.lime : 'rgba(255,255,255,0.25)');
        }
      }
    };
  }

  // ---------------------------------------------------------------
  // 4. Pitch Hold: keep the cursor on a wandering pitch line.
  // ---------------------------------------------------------------
  function gPitch(g) {
    const inp = makeInput();
    const TOP = 150, BOT = () => H() - 170;
    const N = 140;
    const mid = () => (TOP + BOT()) / 2;
    const amp = () => (BOT() - TOP) / 2 - 24;
    const targetY = (tt) => mid() + amp() * (0.62 * Math.sin(tt * 0.8) + 0.3 * Math.sin(tt * 2.1 + 1.3));
    let t = 0, cy = 0, cyT = 0, meter = 1, held = 0, chime = 0, hist = [], done = false;
    cy = cyT = mid();
    for (let i = 0; i < N; i++) hist.push(targetY(-(N - i) * 0.05));
    return {
      update(dt) {
        if (done) return;
        t += dt;
        const tp = inp.tap();
        if (tp && !tp.btn) cyT = clamp(tp.y, TOP, BOT());
        const ay = AY();
        if (Math.abs(ay) > 0.05) cyT = clamp(cyT + ay * 460 * dt, TOP, BOT());
        cy += (cyT - cy) * Math.min(1, dt * 12);
        const tg = targetY(t);
        hist.push(tg); if (hist.length > N) hist.shift();
        const off = Math.abs(cy - tg);
        chime -= dt;
        if (off < 22) {
          held += dt;
          meter = Math.min(1, meter + dt * 0.45);
          if (chime <= 0) {
            chime = 0.32;
            const semi = Math.round(((mid() - cy) / amp()) * 12) + 12;
            tone(semi, 'sine', 0.1, 0.18);
          }
        } else {
          meter -= dt * 0.4;
        }
        if (meter <= 0) { done = true; miniFail(g, 'Lost the pitch'); return; }
        if (held >= g.goal) { done = true; completeMini(); return; }
        hud(Math.floor(held) + ' / ' + g.goal + ' s');
      },
      draw() {
        bg('#061223', '#0b1f3a');
        const xEnd = W() - 60, sp = (W() - 80) / (N - 1);
        for (let i = 1; i <= 4; i++) rect(20, TOP + (BOT() - TOP) * i / 5, W() - 40, 1, 'rgba(120,180,255,0.15)');
        const top = [], bot = [];
        for (let i = 0; i < N; i++) {
          const x = xEnd - (N - 1 - i) * sp;
          top.push([x, hist[i] - 22]); bot.push([x, hist[i] + 22]);
        }
        polygon(top.concat(bot.reverse()), 'rgba(85,230,255,0.16)');
        for (let i = 1; i < N; i++) {
          const x0 = xEnd - (N - i) * sp, x1 = xEnd - (N - 1 - i) * sp;
          line(x0, hist[i - 1], x1, hist[i], 'rgba(85,230,255,0.45)', 2);
        }
        const off = Math.abs(cy - hist[N - 1]) < 22;
        glow(off ? C.lime : C.pink, 18);
        strokeCircle(xEnd, cy, 14, off ? C.lime : C.pink, 3);
        unglow();
        circle(xEnd, hist[N - 1], 5, C.cyan);
        meterBar(20, 86, W() - 40, 8, meter, meter > 0.35 ? C.lime : C.red);
        text('Keep the ring on the wave', W() / 2, TOP - 22, 14, '#9fd4ff', 'center');
      }
    };
  }

  // ---------------------------------------------------------------
  // 5. Bumper Chime: a ball bounces through bumpers that each sing a note.
  // ---------------------------------------------------------------
  function gBumper(g) {
    const inp = makeInput();
    const bumps = [];
    for (let i = 0; i < 7; i++) {
      let x = W() / 2, y = 300, tries = 0, ok = false;
      while (!ok && tries < 80) {
        x = rand(60, W() - 60); y = rand(200, H() - 360); tries++;
        ok = bumps.every(b => dist(b.x, b.y, x, y) > 92);
      }
      bumps.push({ x, y, r: 20, s: SCALE[i], cool: 0, flash: 0, col: BAR_COL[i % BAR_COL.length] });
    }
    const pad = { x: W() / 2, padT: W() / 2, w: 96, y: () => H() - 170 };
    const ball = { x: W() / 2, y: 0, vx: 0, vy: 0, r: 9, on: true };
    let lives = 3, hits = 0, combo = 0, comboT = 0, parts = [], done = false;
    const attach = () => { ball.on = true; ball.x = pad.x; ball.y = pad.y() - 16; ball.vx = 0; ball.vy = 0; };
    attach();
    function launch() { ball.on = false; ball.vx = rand(-160, 160); ball.vy = -520; }
    return {
      update(dt) {
        if (done) return;
        pad.padT = clamp(pad.padT + AX() * 560 * dt, 48, W() - 48);
        pad.x += (pad.padT - pad.x) * Math.min(1, dt * 14);
        const t = inp.tap();
        if (t && !t.btn) pad.padT = clamp(t.x, 48, W() - 48);
        if (t) { if (ball.on) launch(); }
        comboT = Math.max(0, comboT - dt);
        if (comboT <= 0) combo = 0;
        for (const b of bumps) { b.cool = Math.max(0, b.cool - dt); b.flash = Math.max(0, b.flash - dt * 4); }
        fxUpdate(parts, dt, 0);
        if (ball.on) {
          attach();
        } else {
          ball.vy += 520 * dt;
          const sp = Math.hypot(ball.vx, ball.vy);
          if (sp > 760) { ball.vx *= 760 / sp; ball.vy *= 760 / sp; }
          ball.x += ball.vx * dt; ball.y += ball.vy * dt;
          if (ball.x < 12) { ball.x = 12; ball.vx = Math.abs(ball.vx); }
          if (ball.x > W() - 12) { ball.x = W() - 12; ball.vx = -Math.abs(ball.vx); }
          if (ball.y < 130) { ball.y = 130; ball.vy = Math.abs(ball.vy); }
          const py = pad.y();
          if (ball.vy > 0 && ball.y + ball.r >= py && ball.y - ball.r < py + 14 && Math.abs(ball.x - pad.x) < pad.w / 2 + ball.r) {
            ball.vy = -Math.max(420, Math.abs(ball.vy) * 0.95);
            ball.vx = clamp((ball.x - pad.x) * 5, -380, 380);
            ball.y = py - ball.r;
            click(true);
          }
          for (const b of bumps) {
            const dx = ball.x - b.x, dy = ball.y - b.y, d = Math.hypot(dx, dy);
            if (d < b.r + ball.r && d > 0.001) {
              const nx = dx / d, ny = dy / d;
              const dot = ball.vx * nx + ball.vy * ny;
              if (dot < 0) {
                ball.vx -= 2 * dot * nx; ball.vy -= 2 * dot * ny;
                ball.vx *= 1.03; ball.vy *= 1.03;
              }
              ball.x = b.x + nx * (b.r + ball.r + 1);
              ball.y = b.y + ny * (b.r + ball.r + 1);
              if (b.cool <= 0) {
                b.cool = 0.25; b.flash = 1;
                hits++; combo = comboT > 0 ? combo + 1 : 1; comboT = 2.5;
                tone(b.s, 'triangle', 0.14, 0.35);
                fxBurst(parts, b.x, b.y, b.col, 14, 220);
              }
            }
          }
          if (ball.y > pad.y() + 30) {
            lives--; fxBurst(parts, ball.x, pad.y(), C.red, 16, 200);
            attach();
            if (lives <= 0) { done = true; miniFail(g, 'The ball fell through'); return; }
          }
        }
        if (hits >= g.goal) { done = true; completeMini(); return; }
        hud(hits + ' / ' + g.goal + (combo > 1 ? '  x' + combo : ''));
      },
      draw() {
        bg('#070a1f', '#1a1040');
        for (const b of bumps) {
          const k = b.flash;
          glow(b.col, 16 + k * 18);
          strokeCircle(b.x, b.y, b.r + k * 4, b.col, 3);
          circle(b.x, b.y, b.r - 6, 'rgba(255,255,255,' + (0.1 + k * 0.4).toFixed(2) + ')');
          unglow();
          text(['C', 'D', 'E', 'G', 'A', 'C', 'D'][bumps.indexOf(b)] || '', b.x, b.y + 5, 13, '#fff', 'center', 900);
        }
        fxDraw(parts);
        glow(C.cyan, 14);
        circle(ball.x, ball.y, ball.r, C.white);
        unglow();
        const py = pad.y();
        glow(C.purple, 12);
        fillRR(pad.x - pad.w / 2, py, pad.w, 14, 7, C.purple);
        unglow();
        text('♥'.repeat(Math.max(0, lives)), W() - 16, 104, 18, C.pink, 'right');
        if (ball.on) text('TAP to launch', W() / 2, py - 36, 15, '#c9b8ff', 'center', 800);
      }
    };
  }

  // ---------------------------------------------------------------
  // 6. Stack the Beat: drop moving slabs onto the tower, one note each.
  // ---------------------------------------------------------------
  function gStack(g) {
    const inp = makeInput();
    const BW = 200, BH = 26, BASEY = () => H() - 200;
    const stack = [{ x: W() / 2 - BW / 2, w: BW, col: BAR_COL[0] }];
    let mx = 8, mw = BW, dir = 1, spd = 150, camY = 0, placed = 0, perfects = 0, combo = 0;
    let chops = [], parts = [], msg = '', msgT = 0, msgCol = C.white, done = false;
    const lvY = (k) => BASEY() - k * BH + camY;
    return {
      update(dt) {
        if (done) return;
        mx += dir * spd * dt;
        if (mx < 8) { mx = 8; dir = 1; }
        if (mx + mw > W() - 8) { mx = W() - 8 - mw; dir = -1; }
        const camTarget = Math.max(0, 190 - (BASEY() - stack.length * BH));
        camY += (camTarget - camY) * Math.min(1, dt * 4);
        for (const c of chops) { c.vy += 900 * dt; c.y += c.vy * dt; c.x += c.vx * dt; c.life -= dt; }
        chops = chops.filter(c => c.life > 0 && c.y < H() + 40);
        fxUpdate(parts, dt, 300);
        msgT = Math.max(0, msgT - dt);
        const t = inp.tap();
        if (t) {
          const top = stack[stack.length - 1];
          const lo = Math.max(top.x, mx), hi = Math.min(top.x + top.w, mx + mw);
          const ov = hi - lo;
          if (ov < 6) { done = true; miniFail(g, 'The tower toppled'); return; }
          const y = lvY(stack.length);
          const perfect = Math.abs(mx - top.x) < 4;
          if (!perfect) {
            if (mx < top.x) chops.push({ x: mx, y, w: top.x - mx, h: BH, vx: -40, vy: -60, life: 1.5, col: BAR_COL[placed % BAR_COL.length] });
            if (mx + mw > top.x + top.w) chops.push({ x: top.x + top.w, y, w: mx + mw - (top.x + top.w), h: BH, vx: 40, vy: -60, life: 1.5, col: BAR_COL[placed % BAR_COL.length] });
          }
          let nx = lo, nw = ov;
          if (perfect) {
            perfects++; combo++; nx = top.x; nw = Math.min(BW, top.w + 6);
            msg = combo > 1 ? 'PERFECT x' + combo : 'PERFECT';
            msgCol = C.gold;
            fxBurst(parts, top.x + top.w / 2, y, C.gold, 24, 260);
          } else {
            combo = 0;
            msg = 'Cut'; msgCol = C.cyan;
          }
          msgT = 0.8;
          placed++;
          stack.push({ x: nx, w: nw, col: BAR_COL[placed % BAR_COL.length] });
          tone(SCALE[placed % SCALE.length], 'square', 0.1, 0.18);
          mw = nw;
          spd = Math.min(430, spd * 1.035);
          dir = dir > 0 ? -1 : 1;
          mx = dir > 0 ? 8 : W() - 8 - mw;
          if (placed >= g.goal) { done = true; completeMini(); return; }
        }
        hud(placed + ' / ' + g.goal);
      },
      draw() {
        bg('#0a0f24', '#211236');
        for (let k = 0; k < stack.length; k++) {
          const s = stack[k], y = lvY(k);
          if (y > H() + 20) continue;
          fillRR(s.x, y, s.w, BH - 3, 5, s.col);
        }
        const y = lvY(stack.length);
        glow(BAR_COL[placed % BAR_COL.length], 16);
        fillRR(mx, y, mw, BH - 3, 5, BAR_COL[(placed + 1) % BAR_COL.length]);
        unglow();
        rect(0, BASEY() + BH - 2, W(), 2, 'rgba(255,255,255,0.15)');
        for (const c of chops) fillRR(c.x, c.y, c.w, c.h - 3, 4, c.col);
        fxDraw(parts);
        if (msgT > 0) text(msg, W() / 2, 130, 20, msgCol, 'center', 900);
        text('Tap to drop. Stay aligned.', W() / 2, H() - 140, 13, '#c9b8ff', 'center');
      }
    };
  }

  // ---------------------------------------------------------------
  // 7. Tap Tempo: listen to a hidden tempo, then tap it back.
  // ---------------------------------------------------------------
  function gTempo(g) {
    const inp = makeInput();
    let target = 0, phase = 'listen', clickT = 0, beatN = 0, taps = [], clk = 0;
    let rounds = 0, lives = 3, res = '', resT = 0, resCol = C.white, pulse = 0, parts = [], done = false;
    const newRound = () => {
      target = randi(70, 170); phase = 'listen'; clickT = 0; beatN = 0; taps = [];
    };
    let idleT = 0;
    newRound();
    function evaluate() {
      const n = taps.length;
      let sum = 0, k = 0;
      for (let i = Math.max(1, n - 4); i < n; i++) { sum += taps[i] - taps[i - 1]; k++; }
      const guess = 60 / (sum / k);
      const err = Math.abs(guess - target) / target;
      const tol = rounds >= 3 ? 0.04 : 0.06;
      if (err <= tol) {
        rounds++;
        res = 'Locked: ' + Math.round(guess) + ' BPM';
        resCol = C.lime;
        fxBurst(parts, W() / 2, H() / 2, C.lime, 30, 300);
        if (rounds >= g.goal) { done = true; completeMini(); return; }
      } else {
        lives--;
        res = 'Off: you said ' + Math.round(guess) + ', it was ' + target;
        resCol = C.orange;
        if (lives <= 0) { done = true; miniFail(g, 'The tempo drifted away'); return; }
      }
      phase = 'result'; resT = 1.8;
    }
    return {
      update(dt) {
        if (done) return;
        pulse = Math.max(0, pulse - dt * 4);
        fxUpdate(parts, dt, 120);
        clk += dt;
        if (phase === 'listen') {
          clickT += dt;
          const iv = 60 / target;
          if (clickT >= iv) {
            clickT -= iv; beatN++;
            click(beatN % 4 === 1); pulse = 1;
            if (beatN >= 8) phase = 'tap';
          }
        } else if (phase === 'tap') {
          const t = inp.tap();
          if (t) {
            taps.push(clk);
            pulse = 1; click(false);
          }
          if (taps.length >= 5) evaluate();
        } else if (phase === 'result') {
          resT -= dt;
          if (resT <= 0 && !done) newRound();
        }
        if (done) return;
        hud(rounds + ' / ' + g.goal);
      },
      draw() {
        bg('#0f0c24', '#1c1338');
        const cx = W() / 2, cy = H() / 2 - 40;
        strokeCircle(cx, cy, 90 + pulse * 10, 'rgba(255,255,255,' + (0.15 + pulse * 0.5).toFixed(2) + ')', 4);
        glow(C.purple, 20);
        circle(cx, cy, 60, 'rgba(169,120,255,' + (0.3 + pulse * 0.4).toFixed(2) + ')');
        unglow();
        fxDraw(parts);
        if (phase === 'listen') {
          text('LISTEN', cx, cy - 120, 20, C.cyan, 'center', 900);
          text('Count the pulse, then tap it back', cx, cy + 130, 14, '#c9b8ff', 'center');
        } else if (phase === 'tap') {
          text('TAP THE TEMPO', cx, cy - 120, 20, C.lime, 'center', 900);
          text(taps.length + ' / 5 taps', cx, cy + 130, 16, '#fff', 'center', 800);
        } else {
          text(res, cx, cy - 120, 18, resCol, 'center', 900);
        }
        text('♥'.repeat(Math.max(0, lives)), W() - 16, 104, 18, C.pink, 'right');
      }
    };
  }

  // ---------------------------------------------------------------
  // 8. Call and Response: copy a rhythm the game plays first.
  // ---------------------------------------------------------------
  function gCall(g) {
    const inp = makeInput();
    let round = 0, lives = 3, beat = 0.46, offs = [], phase = 'call', ct = 0, ci = 0;
    let taps = [], rt = 0, lit = [], resT = 0, res = '', resCol = C.white, parts = [], done = false;
    const DUR = () => (offs.length ? offs[offs.length - 1] : 0) + 0.8;
    const tolS = () => beat * 0.2;
    function genPattern() {
      const n = Math.min(7, 3 + Math.floor(round / 2));
      beat = Math.max(0.3, 0.46 - round * 0.012);
      const o = [0];
      for (let i = 1; i < n; i++) o.push(o[i - 1] + beat * pick([1, 1, 1.5, 2]));
      offs = o;
    }
    function reset() { phase = 'call'; ct = 0; ci = 0; taps = []; lit = offs.map(() => false); }
    genPattern(); reset();
    const xAt = (s) => 30 + (s / DUR()) * (W() - 60);
    return {
      update(dt) {
        if (done) return;
        fxUpdate(parts, dt, 80);
        if (phase === 'call') {
          ct += dt;
          while (ci < offs.length && ct >= 0.6 + offs[ci]) {
            click(ci === 0); tone(SCALE[ci % SCALE.length], 'triangle', 0.1, 0.2);
            lit[ci] = true; ci++;
          }
          if (ci >= offs.length && ct >= 0.6 + offs[offs.length - 1] + 0.9) { phase = 'resp'; rt = 0; taps = []; }
        } else if (phase === 'resp') {
          rt += dt;
          const t = inp.tap();
          if (t) {
            taps.push(rt);
            const i = taps.length - 1;
            const rel = taps[i] - taps[0];
            const ok = Math.abs(rel - offs[i]) <= tolS();
            tone(SCALE[i % SCALE.length], 'sine', 0.1, 0.15);
            if (i === 0) click(true);
            fxBurst(parts, xAt(rel), H() * 0.5 - 100, ok ? C.lime : C.red, 10, 120);
            if (taps.length >= offs.length) {
              let bad = 0;
              for (let k = 0; k < offs.length; k++) if (Math.abs((taps[k] - taps[0]) - offs[k]) > tolS()) bad++;
              if (bad === 0) {
                round++; res = 'Perfect echo'; resCol = C.lime;
                if (round >= g.goal) { done = true; completeMini(); return; }
                genPattern();
              } else {
                lives--; res = bad + (bad === 1 ? ' tap was' : ' taps were') + ' off. Listen again.'; resCol = C.orange;
                if (lives <= 0) { done = true; miniFail(g, 'Out of lives'); return; }
              }
              phase = 'result'; resT = 1.2;
            }
          }
        } else if (phase === 'result') {
          resT -= dt;
          if (resT <= 0) reset();
        }
        if (done) return;
        hud(round + ' / ' + g.goal);
      },
      draw() {
        bg('#0a1a14', '#132a24');
        const yL = H() * 0.36;
        rect(30, yL, W() - 60, 2, 'rgba(255,255,255,0.25)');
        for (let i = 0; i < offs.length; i++) {
          const x = xAt(offs[i]);
          const on = phase === 'call' && lit[i];
          if (on) glow(C.cyan, 16);
          circle(x, yL, on ? 13 : 9, on ? C.cyan : 'rgba(85,230,255,0.35)');
          unglow();
        }
        for (let i = 0; i < taps.length; i++) {
          const rel = taps[i] - taps[0];
          const ok = Math.abs(rel - offs[i]) <= tolS();
          circle(xAt(rel), yL + 36, 7, ok ? C.lime : C.red);
        }
        fxDraw(parts);
        const cx = W() / 2;
        if (phase === 'call') text('LISTEN', cx, yL - 40, 20, C.cyan, 'center', 900);
        else if (phase === 'resp') text('YOUR ECHO: ' + taps.length + ' / ' + offs.length, cx, yL - 40, 18, C.lime, 'center', 900);
        else text(res, cx, yL - 40, 17, resCol, 'center', 900);
        text('Tap the rhythm back, from the first tap', cx, H() - 170, 13, '#b8e8d0', 'center');
        text('♥'.repeat(Math.max(0, lives)), W() - 16, 104, 18, C.pink, 'right');
      }
    };
  }

  return {
    engines: {
      n05_metro: gMetro,
      n05_loop: gLoop,
      n05_echo: gEcho,
      n05_pitch: gPitch,
      n05_bumper: gBumper,
      n05_stack: gStack,
      n05_tempo: gTempo,
      n05_callresp: gCall
    },
    minis: [
      { id: 'n05_metro', title: 'Metro Catch', icon: '\u{1F941}', cat: 'RHYTHM', desc: 'Notes fall toward the hit line. Tap right on the beat. Perfect hits build combos and the tempo climbs. Five missed beats and it is over.', engine: 'n05_metro', goal: 30 },
      { id: 'n05_loop', title: 'Loop Builder', icon: '\u{1F501}', cat: 'RHYTHM', desc: 'Listen to a four-lane drum loop, then rebuild it cell by cell. Check your copy; three wrong checks end the session.', engine: 'n05_loop', goal: 5 },
      { id: 'n05_echo', title: 'Echo Pads', icon: '\u{1F3B9}', cat: 'RHYTHM', desc: 'Six pads play a melody that grows by one note each round. Repeat it with taps or the joystick and the A button. One wrong pad ends the run.', engine: 'n05_echo', goal: 12 },
      { id: 'n05_pitch', title: 'Pitch Hold', icon: '\u{1F3DA}', cat: 'RHYTHM', desc: 'A pitch line wanders up and down. Steer the ring onto it with taps or the joystick and hold it there. Stray too long and you lose the note.', engine: 'n05_pitch', goal: 25 },
      { id: 'n05_bumper', title: 'Bumper Chime', icon: '\u{1F514}', cat: 'RHYTHM', desc: 'Launch a ball into a field of bumpers. Each bumper sings its own note, so clever bounces play a tune. Keep the ball alive on the paddle.', engine: 'n05_bumper', goal: 40 },
      { id: 'n05_stack', title: 'Stack the Beat', icon: '\u{1F9F1}', cat: 'RHYTHM', desc: 'A slab slides back and forth. Drop it on the tower; off-centre parts get chopped off and the slabs speed up. Perfect drops grow the tower back.', engine: 'n05_stack', goal: 25 },
      { id: 'n05_tempo', title: 'Tap Tempo', icon: '⏱', cat: 'RHYTHM', desc: 'A hidden tempo clicks for eight beats. Tap five times to match it within a few percent. Three misses and the metronome wins.', engine: 'n05_tempo', goal: 5 },
      { id: 'n05_callresp', title: 'Call and Response', icon: '\u{1F4E3}', cat: 'RHYTHM', desc: 'The game plays a short rhythm. Tap it back exactly, starting from your first tap. Each round the phrase gets longer and faster.', engine: 'n05_callresp', goal: 6 }
    ],
    aaa: []
  };
})();
