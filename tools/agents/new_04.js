// new_04: drawing, painting and art toys (relaxing creative play with a fail state)
window.__AG_new_04 = (function () {
  // ---------- shared helpers (private to this IIFE) ----------
  function hsl(h, s, l, a) {
    return 'hsla(' + (((h % 360) + 360) % 360).toFixed(1) + ',' + s + '%,' + l + '%,' + (a == null ? 1 : a) + ')';
  }
  function studio(top, bot) {
    const g = ctx2d.createLinearGradient(0, 0, 0, H());
    g.addColorStop(0, top);
    g.addColorStop(1, bot);
    ctx2d.fillStyle = g;
    ctx2d.fillRect(0, 0, W(), H());
  }
  function glowDot(x, y, r, col, a) {
    const g = ctx2d.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, col);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx2d.save();
    ctx2d.globalAlpha = a == null ? 1 : a;
    ctx2d.fillStyle = g;
    ctx2d.beginPath();
    ctx2d.arc(x, y, r, 0, Math.PI * 2);
    ctx2d.fill();
    ctx2d.restore();
  }
  function starPts(x, y, R, r) {
    const p = [];
    for (let k = 0; k < 10; k++) {
      const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r : R;
      p.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
    }
    return p;
  }
  function bindDrag(move, up) {
    cv2d.addEventListener('pointermove', move);
    cv2d.addEventListener('pointerup', up);
    cv2d.addEventListener('pointercancel', up);
    return function () {
      cv2d.removeEventListener('pointermove', move);
      cv2d.removeEventListener('pointerup', up);
      cv2d.removeEventListener('pointercancel', up);
    };
  }
  function addPop(list, s, x, y, c, size) {
    list.push({ s: String(s), x: x, y: y, c: c, life: 0.9, max: 0.9, size: size || 18 });
  }
  function tickPops(list, dt) {
    for (const p of list) { p.life -= dt; p.y -= 30 * dt; }
    for (let i = list.length - 1; i >= 0; i--) if (list[i].life <= 0) list.splice(i, 1);
  }
  function drawPops(list) {
    for (const p of list) {
      ctx2d.globalAlpha = clamp(p.life / p.max, 0, 1);
      text(p.s, p.x, p.y, p.size, p.c, 'center', 800);
    }
    ctx2d.globalAlpha = 1;
  }

  // ---------- 1. Tint Tide: wash colour inside a flower stencil ----------
  function gameTintTide(g) {
    const CELL = 12, BR = 16, SMUDGE_MAX = 45, oy = 150;
    let cols = 0, rows = 0, ox = 0, cx = 0, cy = 0, sR = 0, ready = false;
    let inside = null, st = null, hu = null, tcount = 0, painted = 0, smudge = 0, outline = null;
    let cur = { x: 0, y: 0 }, finger = null, lastP = null, hueT = 0, over = false;
    const edgeR = a => sR * (0.45 + 0.55 * Math.abs(Math.cos(2.5 * a)));

    function setup() {
      if (ready) return;
      ready = true;
      const w = W(), h = H();
      cols = Math.floor((w - 24) / CELL);
      rows = Math.floor((h - 330) / CELL);
      ox = (w - cols * CELL) / 2;
      cx = w / 2;
      cy = oy + rows * CELL / 2;
      sR = Math.min(w * 0.42, rows * CELL * 0.46);
      const n = cols * rows;
      inside = new Uint8Array(n);
      st = new Uint8Array(n);
      hu = new Float32Array(n);
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const px = ox + c * CELL + CELL / 2, py = oy + r * CELL + CELL / 2;
        if (Math.hypot(px - cx, py - cy) <= edgeR(Math.atan2(py - cy, px - cx))) { inside[r * cols + c] = 1; tcount++; }
      }
      outline = [];
      for (let k = 0; k <= 120; k++) {
        const a = k / 120 * Math.PI * 2, R = edgeR(a);
        outline.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R]);
      }
      cur = { x: cx, y: cy };
    }
    function paintAt(x, y, r) {
      const c0 = Math.max(0, Math.floor((x - r - ox) / CELL)), c1 = Math.min(cols - 1, Math.floor((x + r - ox) / CELL));
      const r0 = Math.max(0, Math.floor((y - r - oy) / CELL)), r1 = Math.min(rows - 1, Math.floor((y + r - oy) / CELL));
      for (let rr = r0; rr <= r1; rr++) for (let c = c0; c <= c1; c++) {
        const i = rr * cols + c;
        if (st[i] || Math.hypot(ox + c * CELL + CELL / 2 - x, oy + rr * CELL + CELL / 2 - y) > r) continue;
        st[i] = inside[i] ? 1 : 2;
        hu[i] = hueT + rand(-20, 20);
        if (inside[i]) painted++; else smudge++;
      }
    }
    function strokeTo(x, y) {
      if (lastP) {
        const n = Math.max(1, Math.ceil(Math.hypot(x - lastP.x, y - lastP.y) / 5));
        for (let k = 1; k <= n; k++) paintAt(lastP.x + (x - lastP.x) * k / n, lastP.y + (y - lastP.y) * k / n, BR);
      } else paintAt(x, y, BR);
      lastP = { x: x, y: y };
    }
    const mv = e => {
      if (!finger) return;
      finger = { x: e.clientX, y: e.clientY };
      cur = { x: e.clientX, y: e.clientY };
      strokeTo(e.clientX, e.clientY);
    };
    const up = () => { finger = null; lastP = null; };
    const unbind = bindDrag(mv, up);

    return {
      update(dt) {
        if (over) return;
        setup();
        hueT = (hueT + dt * 45) % 360;
        if (!finger && Math.abs(AX()) + Math.abs(AY()) > 0.12) {
          cur.x = clamp(cur.x + AX() * 260 * dt, 16, W() - 16);
          cur.y = clamp(cur.y + AY() * 260 * dt, oy, oy + rows * CELL);
          lastP = null;
          paintAt(cur.x, cur.y, BR);
        }
        const pct = painted / tcount * 100, sm = smudge / tcount * 100;
        if (sm >= SMUDGE_MAX) { over = true; miniFail(g, 'Too much paint landed outside the stencil'); return; }
        if (pct >= g.goal) { over = true; completeMini(); return; }
        hud('Coverage ' + Math.floor(pct) + ' / ' + g.goal + '%  •  Smudge ' + Math.floor(sm) + '%');
      },
      draw() {
        setup();
        studio('#171224', '#07060d');
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
          const i = r * cols + c;
          if (!st[i]) continue;
          ctx2d.fillStyle = st[i] === 1 ? hsl(hu[i], 78, 64) : hsl(hu[i], 12, 34, 0.7);
          ctx2d.fillRect(ox + c * CELL + 1, oy + r * CELL + 1, CELL - 2, CELL - 2);
        }
        ctx2d.setLineDash([6, 5]);
        ctx2d.strokeStyle = 'rgba(255,255,255,0.45)';
        ctx2d.lineWidth = 2;
        ctx2d.beginPath();
        outline.forEach((p, k) => { if (k) ctx2d.lineTo(p[0], p[1]); else ctx2d.moveTo(p[0], p[1]); });
        ctx2d.closePath();
        ctx2d.stroke();
        ctx2d.setLineDash([]);
        glowDot(cur.x, cur.y, 36, hsl(hueT, 90, 65, 0.5));
        strokeCircle(cur.x, cur.y, BR, '#ffffff', 2);
        const sm = smudge / tcount * 100;
        rect(40, 634, W() - 80, 8, 'rgba(255,255,255,0.12)');
        rect(40, 634, (W() - 80) * clamp(sm / SMUDGE_MAX, 0, 1), 8, sm > SMUDGE_MAX * 0.7 ? C.red : C.yellow);
      },
      pointer(x, y) {
        setup();
        finger = { x: x, y: y };
        cur = { x: x, y: y };
        lastP = null;
        strokeTo(x, y);
      },
      stop() { unbind(); }
    };
  }

  // ---------- 2. Hue Hunt: mix a colour to match the target swatch ----------
  function gameHueHunt(g) {
    const PX0 = 30, PY0 = 318, PY1 = 598;
    const pw = () => W() - PX0 * 2;
    let tgt = null, mine = { h: 200, l: 50 }, wins = 0, misses = 0, left = 0;
    let phase = 'play', phT = 0, msg = '', msgC = '#fff', over = false, finger = false;

    function newRound() { tgt = { h: rand(0, 360), l: rand(24, 82) }; left = 24; phase = 'play'; }
    function setMix(x, y) {
      mine.h = clamp((x - PX0) / pw(), 0, 1) * 360;
      mine.l = clamp(88 - (y - PY0) / (PY1 - PY0) * 76, 12, 88);
    }
    function dab() {
      if (!tgt) newRound();
      if (phase !== 'play' || over) return;
      let dh = Math.abs(mine.h - tgt.h);
      dh = Math.min(dh, 360 - dh);
      const dl = Math.abs(mine.l - tgt.l);
      const acc = Math.round(100 - dh * 0.45 - dl * 1.4);
      if (acc >= 82) {
        wins++;
        msg = 'Match! ' + acc + '%';
        msgC = C.green;
        beep(660, 990, 0.12, 'sine', 0.2);
      } else {
        misses++;
        msg = 'Off: ' + Math.max(0, acc) + '% accurate';
        msgC = C.red;
        beep(200, 120, 0.15, 'square', 0.12);
      }
      phase = 'result';
      phT = 1.1;
      if (wins >= g.goal) { over = true; completeMini(); }
      else if (misses >= 3) { over = true; miniFail(g, 'Three mixes were too far from the target'); }
    }
    const mv = e => { if (finger) setMix(e.clientX, e.clientY); };
    const up = () => { finger = false; };
    const unbind = bindDrag(mv, up);

    return {
      update(dt) {
        if (!tgt) newRound();
        if (over) return;
        if (phase === 'result') {
          phT -= dt;
          if (phT <= 0) newRound();
        } else {
          if (!finger) {
            mine.h = (mine.h + AX() * 150 * dt + 360) % 360;
            mine.l = clamp(mine.l - AY() * 46 * dt, 12, 88);
          }
          left -= dt;
          if (left <= 0) {
            misses++;
            msg = 'Too slow';
            msgC = C.red;
            phase = 'result';
            phT = 1.1;
            if (misses >= 3) { over = true; miniFail(g, 'Three mixes were too far from the target'); return; }
          }
          if (pressed('a')) dab();
        }
        hud('Matches ' + wins + ' / ' + g.goal + '  •  Misses ' + misses + ' / 3  •  ' + Math.ceil(Math.max(0, left)) + 's');
      },
      draw() {
        if (!tgt) newRound();
        studio('#1c1628', '#07050d');
        rect(PX0, 112, pw(), 120, hsl(tgt.h, 70, tgt.l));
        text('TARGET', W() / 2, 252, 12, '#c9bfd9', 'center', 800);
        if (phase === 'result') text(msg, W() / 2, 292, 20, msgC, 'center', 800);
        else text('Mix the colour', W() / 2, 292, 15, '#c9bfd9', 'center', 700);
        rect(PX0, 306, pw() * clamp(left / 24, 0, 1), 4, C.cyan);
        const COLS = 60, cw = pw() / COLS;
        for (let k = 0; k < COLS; k++) {
          const h = (k + 0.5) / COLS * 360;
          const gr = ctx2d.createLinearGradient(0, PY0, 0, PY1);
          gr.addColorStop(0, hsl(h, 85, 88));
          gr.addColorStop(0.5, hsl(h, 75, 50));
          gr.addColorStop(1, hsl(h, 75, 12));
          ctx2d.fillStyle = gr;
          ctx2d.fillRect(PX0 + k * cw, PY0, cw + 1, PY1 - PY0);
        }
        const mx = PX0 + mine.h / 360 * pw(), my = PY0 + (88 - mine.l) / 76 * (PY1 - PY0);
        strokeCircle(mx, my, 13, '#ffffff', 3);
        strokeCircle(mx, my, 16, 'rgba(0,0,0,0.5)', 2);
        rect(PX0, 612, pw(), 44, hsl(mine.h, 70, mine.l));
        text('YOUR MIX', W() / 2, 639, 13, '#ffffff', 'center', 800);
      },
      pointer(x, y) {
        if (over) return;
        if (phase === 'play' && y >= PY0 - 12 && y <= PY1 + 12 && x >= PX0 - 10 && x <= W() - PX0 + 10) {
          finger = true;
          setMix(x, y);
        } else dab();
      },
      stop() { unbind(); }
    };
  }

  // ---------- 3. Paint Flick: swipe to launch paint blobs at easels ----------
  function gameSplatShot(g) {
    const GRAV = 520, COLS = [C.pink, C.cyan, C.gold, C.lime, C.purple, C.orange];
    let blobs = [], tg = null, hits = 0, misses = 0, t = 0, over = false, parts = [], pops = [];

    function setup() {
      if (tg) return;
      tg = [0, 1, 2].map(i => ({ ph: i * 2.1 + 0.4, spd: 0.8 + i * 0.35, y: 210 + i * 95, r: 34, x: W() / 2, marks: [], flash: 0 }));
    }
    function shoot(vx, vy) {
      if (over || blobs.length >= 6) return;
      blobs.push({ x: W() / 2, y: H() - 150, vx: vx, vy: vy, r: 11, c: pick(COLS), life: 0 });
    }
    return {
      swipe(dx, dy) {
        shoot(clamp(dx * 3, -560, 560), dy < 0 ? clamp(dy * 3, -950, -280) : -280);
      },
      update(dt) {
        setup();
        if (over) return;
        t += dt;
        if (pressed('a')) shoot(AX() * 320, -640);
        for (const T of tg) {
          T.x = W() / 2 + Math.sin(t * T.spd + T.ph) * Math.min(W() / 2 - 60, 120);
          T.r = Math.max(22, 34 - hits * 0.35);
          T.flash = Math.max(0, T.flash - dt * 3);
        }
        for (let i = blobs.length - 1; i >= 0; i--) {
          const b = blobs[i];
          b.vy += GRAV * dt;
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          b.life += dt;
          let done = false;
          for (const T of tg) {
            if (Math.hypot(b.x - T.x, b.y - T.y) < T.r + b.r) {
              T.marks.push({ x: b.x - T.x, y: b.y - T.y, r: rand(8, 14), c: b.c });
              if (T.marks.length > 24) T.marks.shift();
              T.flash = 1;
              hits++;
              done = true;
              fxBurst(parts, b.x, b.y, b.c, 14, 200);
              addPop(pops, '+1', b.x, b.y - 10, C.gold, 20);
              beep(520, 880, 0.08, 'triangle', 0.15);
              break;
            }
          }
          if (!done && (b.y > H() - 130 || b.x < -30 || b.x > W() + 30 || b.life > 6)) {
            done = true;
            misses++;
            fxBurst(parts, clamp(b.x, 10, W() - 10), H() - 130, C.red, 8, 120);
            beep(180, 90, 0.18, 'sawtooth', 0.12);
          }
          if (done) blobs.splice(i, 1);
        }
        fxUpdate(parts, dt, 300);
        tickPops(pops, dt);
        if (hits >= g.goal) { over = true; completeMini(); return; }
        if (misses >= 5) { over = true; miniFail(g, 'Five shots missed the easels'); return; }
        hud('Hits ' + hits + ' / ' + g.goal + '  •  Misses ' + misses + ' / 5');
      },
      draw() {
        setup();
        studio('#1a1428', '#08060f');
        ctx2d.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx2d.lineWidth = 1;
        for (let x = 0; x <= W(); x += 40) line(x, 90, x, H() - 120, 'rgba(255,255,255,0.04)', 1);
        for (const T of tg) {
          circle(T.x, T.y, T.r + 6, '#3b2d4f');
          circle(T.x, T.y, T.r, '#f1e7d0');
          circle(T.x, T.y, T.r * 0.66, '#ff6f91');
          circle(T.x, T.y, T.r * 0.33, '#ffd54f');
          for (const m of T.marks) circle(T.x + m.x, T.y + m.y, m.r, m.c);
          if (T.flash > 0) glowDot(T.x, T.y, T.r + 18, 'rgba(255,255,255,1)', T.flash * 0.4);
        }
        for (const b of blobs) {
          glowDot(b.x, b.y, 26, b.c, 0.55);
          circle(b.x, b.y, b.r, b.c);
        }
        circle(W() / 2, H() - 150, 18, '#2a2438');
        strokeCircle(W() / 2, H() - 150, 18, '#6d5f8a', 2);
        fxDraw(parts);
        drawPops(pops);
      },
      stop() {}
    };
  }

  // ---------- 4. Clay Wheel: drag the clay out to match the profile ----------
  function gameClayWheel(g) {
    const N = 24, TOP = 170, BOT = 596;
    const goal = Math.min(g.goal, N);
    let tgt = null, cur = null, locked = null, BH = 0, cx = 0, hand = null, finger = false;
    let lastB = -1, locks = 0, left = 100, over = false, pops = [], parts = [], t = 0;

    function setup() {
      if (tgt) return;
      cx = W() / 2;
      BH = (BOT - TOP) / N;
      tgt = []; cur = []; locked = [];
      for (let i = 0; i < N; i++) {
        const u = i / (N - 1);
        tgt.push(24 + 66 * Math.pow(Math.sin(Math.PI * (0.12 + 0.8 * u)), 1.2) + 8 * Math.sin(u * 7));
        cur.push(12);
        locked.push(false);
      }
    }
    const bandY = i => BOT - (i + 0.5) * BH;
    const bandAt = y => clamp(Math.floor((BOT - y) / BH), 0, N - 1);
    function lock(i) {
      locked[i] = true;
      cur[i] = tgt[i];
      locks++;
      addPop(pops, '+1', cx + tgt[i] + 16, bandY(i), C.green, 16);
      fxBurst(parts, cx + tgt[i], bandY(i), C.lime, 10, 140);
      beep(440 + locks * 20, 660 + locks * 20, 0.07, 'sine', 0.15);
    }
    function shape(dt) {
      if (!hand) { lastB = -1; return; }
      const b = bandAt(hand.y), fr = Math.abs(hand.x - cx);
      const a = lastB < 0 ? b : lastB;
      for (let i = Math.min(a, b); i <= Math.max(a, b); i++) {
        if (locked[i]) continue;
        cur[i] += (fr - cur[i]) * Math.min(1, dt * 14);
        if (Math.abs(fr - tgt[i]) <= 5) lock(i);
      }
      lastB = b;
    }
    const mv = e => { if (finger) hand = { x: e.clientX, y: e.clientY }; };
    const up = () => { finger = false; hand = null; };
    const unbind = bindDrag(mv, up);

    return {
      update(dt) {
        setup();
        if (over) return;
        t += dt;
        left -= dt;
        const jx = AX(), jy = AY();
        if (!finger && Math.abs(jx) + Math.abs(jy) > 0.12) {
          hand = hand || { x: cx, y: (TOP + BOT) / 2 };
          hand.x = clamp(hand.x + jx * 280 * dt, 0, W());
          hand.y = clamp(hand.y + jy * 280 * dt, TOP, BOT);
        } else if (!finger) hand = null;
        shape(dt);
        fxUpdate(parts, dt, 200);
        tickPops(pops, dt);
        if (locks >= goal) { over = true; completeMini(); return; }
        if (left <= 0) { over = true; miniFail(g, 'The clay dried out before the vase was shaped'); return; }
        hud('Shaped ' + locks + ' / ' + goal + '  •  ' + Math.ceil(Math.max(0, left)) + 's');
      },
      draw() {
        setup();
        studio('#1f1510', '#080504');
        ctx2d.fillStyle = '#4a2d20';
        ctx2d.beginPath();
        ctx2d.ellipse(cx, BOT + 10, 96, 16, 0, 0, Math.PI * 2);
        ctx2d.fill();
        ctx2d.beginPath();
        ctx2d.moveTo(cx - cur[0], bandY(0));
        for (let i = 1; i < N; i++) ctx2d.lineTo(cx - cur[i], bandY(i));
        for (let i = N - 1; i >= 0; i--) ctx2d.lineTo(cx + cur[i], bandY(i));
        ctx2d.closePath();
        const gr = ctx2d.createLinearGradient(cx - 110, 0, cx + 110, 0);
        gr.addColorStop(0, '#6b3d24');
        gr.addColorStop(0.4, '#d69a6a');
        gr.addColorStop(1, '#5a321d');
        ctx2d.fillStyle = gr;
        ctx2d.fill();
        for (let k = 0; k < 10; k++) {
          const yk = BOT - ((k + (t * 0.4) % 1) / 10) * (BOT - TOP);
          const ii = clamp(Math.floor((BOT - yk) / BH), 0, N - 1);
          ctx2d.strokeStyle = 'rgba(0,0,0,0.2)';
          ctx2d.lineWidth = 2;
          ctx2d.beginPath();
          ctx2d.ellipse(cx, yk, cur[ii], 4, 0, 0, Math.PI);
          ctx2d.stroke();
        }
        ctx2d.setLineDash([4, 4]);
        ctx2d.strokeStyle = 'rgba(85,230,255,0.6)';
        ctx2d.lineWidth = 1.5;
        ctx2d.beginPath();
        for (let i = 0; i < N; i++) ctx2d.lineTo(cx - tgt[i], bandY(i));
        ctx2d.stroke();
        ctx2d.beginPath();
        for (let i = 0; i < N; i++) ctx2d.lineTo(cx + tgt[i], bandY(i));
        ctx2d.stroke();
        ctx2d.setLineDash([]);
        for (let i = 0; i < N; i++) {
          if (!locked[i]) continue;
          rect(cx + cur[i] + 6, bandY(i) - BH / 2 + 2, 5, BH - 4, C.green);
          rect(cx - cur[i] - 11, bandY(i) - BH / 2 + 2, 5, BH - 4, C.green);
        }
        if (hand) {
          glowDot(hand.x, hand.y, 26, 'rgba(255,200,140,0.8)');
          circle(hand.x, hand.y, 4, '#ffffff');
        }
        fxDraw(parts);
        drawPops(pops);
      },
      pointer(x, y) {
        setup();
        finger = true;
        hand = { x: x, y: y };
      },
      stop() { unbind(); }
    };
  }

  // ---------- 5. Pixel Mosaic: paint the reference picture one pixel at a time ----------
  function gamePixelMosaic(g) {
    const N = 8, CS = 40, PS = 56, BY = 236, PY = 580;
    const PAL = ['#ff6fb1', '#5fd4ff', '#ffd54f', '#7cff9e'];
    const bx = () => (W() - N * CS) / 2;
    const pxOf = k => W() / 2 - (4 * PS + 36) / 2 + k * (PS + 12);
    let tgt = null, u = null, total = 0, goal = 0, correct = 0, mistakes = 0;
    let pal = 0, cr = 0, cc = 0, cool = 0, over = false, flash = null, pops = [];

    function make() {
      tgt = []; u = [];
      for (let r = 0; r < N; r++) { tgt.push(new Array(N).fill(0)); u.push(new Array(N).fill(0)); }
      for (let r = 0; r < N; r++) for (let c = 0; c < N / 2; c++) {
        const v = Math.random() < 0.3 ? 0 : randi(1, 4);
        tgt[r][c] = v;
        tgt[r][N - 1 - c] = v;
      }
      total = 0;
      tgt.forEach(row => row.forEach(v => { if (v) total++; }));
      goal = Math.min(g.goal, total);
    }
    function paintCell(r, c, erase) {
      if (over || r < 0 || c < 0 || r >= N || c >= N) return;
      if (erase) {
        if (u[r][c]) { u[r][c] = 0; correct--; }
        return;
      }
      if (u[r][c]) return;
      const v = pal + 1;
      if (tgt[r][c] === v) {
        u[r][c] = v;
        correct++;
        addPop(pops, 'Nice', bx() + c * CS + CS / 2, BY + r * CS, C.green, 16);
        beep(560, 780, 0.06, 'triangle', 0.12);
      } else {
        mistakes++;
        flash = { r: r, c: c, t: 0.35 };
        beep(200, 120, 0.12, 'square', 0.12);
        if (mistakes >= 6) { over = true; miniFail(g, 'Six wrong pigments on the board'); }
      }
    }

    return {
      update(dt) {
        if (!tgt) make();
        if (over) return;
        cool -= dt;
        const ax = AX(), ay = AY();
        if (cool <= 0) {
          if (Math.abs(ax) > 0.5) { cc = clamp(cc + (ax > 0 ? 1 : -1), 0, N - 1); cool = 0.2; }
          else if (Math.abs(ay) > 0.5) { cr = clamp(cr + (ay > 0 ? 1 : -1), 0, N - 1); cool = 0.2; }
        }
        if (pressed('a')) paintCell(cr, cc, false);
        if (pressed('b')) pal = (pal + 1) % 4;
        if (pressed('c')) paintCell(cr, cc, true);
        if (flash) { flash.t -= dt; if (flash.t <= 0) flash = null; }
        tickPops(pops, dt);
        if (over) return;
        if (correct >= goal) { over = true; completeMini(); return; }
        hud('Pixels ' + correct + ' / ' + goal + '  •  Mistakes ' + mistakes + ' / 6');
      },
      draw() {
        if (!tgt) make();
        studio('#131020', '#06050b');
        text('REFERENCE', W() / 2, 112, 12, '#bdb3d6', 'center', 800);
        const ts = 12, tx = W() / 2 - N * ts / 2, ty = 122;
        for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
          ctx2d.fillStyle = tgt[r][c] ? PAL[tgt[r][c] - 1] : '#1b1828';
          ctx2d.fillRect(tx + c * ts, ty + r * ts, ts - 1, ts - 1);
        }
        const x0 = bx();
        for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
          const x = x0 + c * CS, y = BY + r * CS;
          ctx2d.fillStyle = '#1b1828';
          ctx2d.fillRect(x + 1, y + 1, CS - 2, CS - 2);
          if (u[r][c]) {
            glowDot(x + CS / 2, y + CS / 2, CS * 0.8, PAL[u[r][c] - 1], 0.3);
            ctx2d.fillStyle = PAL[u[r][c] - 1];
            ctx2d.fillRect(x + 4, y + 4, CS - 8, CS - 8);
          }
          if (flash && flash.r === r && flash.c === c) {
            ctx2d.fillStyle = 'rgba(255,60,80,' + (flash.t / 0.35 * 0.7).toFixed(2) + ')';
            ctx2d.fillRect(x + 1, y + 1, CS - 2, CS - 2);
          }
        }
        ctx2d.strokeStyle = '#ffffff';
        ctx2d.lineWidth = 3;
        ctx2d.strokeRect(x0 + cc * CS + 3, BY + cr * CS + 3, CS - 6, CS - 6);
        for (let k = 0; k < 4; k++) {
          rect(pxOf(k), PY, PS, PS, PAL[k]);
          if (k === pal) {
            ctx2d.strokeStyle = '#ffffff';
            ctx2d.lineWidth = 3;
            ctx2d.strokeRect(pxOf(k) - 3, PY - 3, PS + 6, PS + 6);
          }
        }
        drawPops(pops);
      },
      pointer(x, y) {
        if (!tgt) make();
        for (let k = 0; k < 4; k++) {
          if (x >= pxOf(k) && x <= pxOf(k) + PS && y >= PY && y <= PY + PS) { pal = k; return; }
        }
        const c = Math.floor((x - bx()) / CS), r = Math.floor((y - BY) / CS);
        if (c >= 0 && c < N && r >= 0 && r < N) { cr = r; cc = c; paintCell(r, c, false); }
      },
      stop() {}
    };
  }

  // ---------- 6. Stroke Beat: hit the brush strokes as they reach the easel line ----------
  function gameStrokeBeat(g) {
    const HIT = 560, RANGE = 46, PAINT = [C.pink, C.cyan, C.gold];
    const laneX = i => W() * (2 * i + 1) / 6;
    let notes = [], marks = [], pops = [], fx = [], t = 0, spawnT = 0;
    let hits = 0, misses = 0, combo = 0, bestCombo = 0, over = false, flash = [0, 0, 0];

    function spawn() {
      const a = randi(0, 2);
      notes.push({ lane: a, y: 120, c: PAINT[a] });
      if (Math.random() < 0.22) {
        const b = (a + 1) % 3;
        notes.push({ lane: b, y: 120, c: PAINT[b] });
      }
    }
    function hitLane(l) {
      flash[l] = 0.18;
      let best = null, bd = 1e9;
      for (const n of notes) {
        if (n.lane !== l) continue;
        const d = Math.abs(n.y - HIT);
        if (d < RANGE && d < bd) { bd = d; best = n; }
      }
      if (!best) { combo = 0; return; }
      notes.splice(notes.indexOf(best), 1);
      const perfect = bd <= 12;
      hits++;
      combo++;
      bestCombo = Math.max(bestCombo, combo);
      marks.push({ x: laneX(l), y: rand(170, 500), c: best.c, life: 3, max: 3, w: perfect ? 74 : 58 });
      if (marks.length > 20) marks.shift();
      fxBurst(fx, laneX(l), HIT, best.c, perfect ? 18 : 10, 220);
      addPop(pops, perfect ? 'Perfect' : 'Good', laneX(l), HIT - 30, perfect ? C.gold : C.white, 18);
      beep(perfect ? 740 : 520, perfect ? 980 : 600, 0.08, 'triangle', 0.18);
      if (hits >= g.goal) { over = true; completeMini(); }
    }

    return {
      update(dt) {
        if (over) return;
        t += dt;
        spawnT -= dt;
        if (spawnT <= 0) { spawn(); spawnT = Math.max(0.42, 0.85 - t * 0.012); }
        const v = 240 + Math.min(240, t * 4);
        for (const n of notes) n.y += v * dt;
        const kept = [];
        for (const n of notes) {
          if (n.y > HIT + RANGE) {
            misses++;
            combo = 0;
            addPop(pops, 'Missed', laneX(n.lane), HIT - 40, C.red, 16);
            beep(220, 110, 0.12, 'sawtooth', 0.1);
          } else kept.push(n);
        }
        notes = kept;
        if (misses >= 6) { over = true; miniFail(g, 'Six strokes slipped past the brush'); return; }
        if (pressed('a')) hitLane(0);
        if (pressed('b')) hitLane(1);
        if (pressed('c')) hitLane(2);
        for (let i = 0; i < 3; i++) flash[i] = Math.max(0, flash[i] - dt);
        for (const m of marks) m.life -= dt;
        marks = marks.filter(m => m.life > 0);
        fxUpdate(fx, dt, 200);
        tickPops(pops, dt);
        if (over) return;
        hud('Strokes ' + hits + ' / ' + g.goal + '  •  Combo ' + combo + '  •  Misses ' + misses + ' / 6');
      },
      draw() {
        studio('#110e1c', '#050409');
        for (const m of marks) {
          ctx2d.globalAlpha = clamp(m.life / m.max, 0, 1) * 0.4;
          ctx2d.fillStyle = m.c;
          ctx2d.beginPath();
          ctx2d.ellipse(m.x, m.y, m.w / 2, 26, 0, 0, Math.PI * 2);
          ctx2d.fill();
        }
        ctx2d.globalAlpha = 1;
        for (let i = 0; i < 3; i++) {
          rect(laneX(i) - W() / 6 + 4, 110, W() / 3 - 8, HIT - 110 + 60, 'rgba(255,255,255,0.035)');
          glowDot(laneX(i), HIT, 60 + flash[i] * 120, PAINT[i], 0.25 + flash[i] * 2);
          strokeCircle(laneX(i), HIT, 34, '#ffffff', 3);
          text(['A', 'B', 'C'][i], laneX(i), HIT + 60, 16, '#bbb', 'center', 800);
        }
        for (const n of notes) {
          const x = laneX(n.lane), w = W() / 3 * 0.62;
          glowDot(x, n.y, 40, n.c, 0.35);
          const gr = ctx2d.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
          gr.addColorStop(0, 'rgba(255,255,255,0)');
          gr.addColorStop(0.5, n.c);
          gr.addColorStop(1, 'rgba(255,255,255,0)');
          ctx2d.fillStyle = gr;
          ctx2d.fillRect(x - w / 2, n.y - 9, w, 18);
        }
        fxDraw(fx);
        drawPops(pops);
      },
      stop() {}
    };
  }

  // ---------- 7. Light Tracer: glide a light brush over the stars in the dark ----------
  function gameLightTracer(g) {
    let bx = 0, by = 0, tx = 0, ty = 0, trail = [], stars = [], motes = [];
    let got = 0, streak = 0, idle = 0, sinceGot = 0, starT = 0, t = 0;
    let over = false, finger = false, pops = [], parts = [], ready = false;

    function setup() {
      if (ready) return;
      ready = true;
      bx = tx = W() / 2;
      by = ty = H() / 2;
      motes = [0, 1].map(i => ({ x: W() * (0.3 + 0.4 * i), y: 260 + i * 200, vx: i ? -46 : 52, vy: i ? -30 : 34, cool: 0 }));
    }
    function spawn() {
      if (stars.length < 3) stars.push({ x: rand(40, W() - 40), y: rand(150, H() - 190), ph: rand(0, 6.28) });
    }
    const mv = e => { if (finger) { tx = e.clientX; ty = e.clientY; } };
    const up = () => { finger = false; };
    const unbind = bindDrag(mv, up);

    return {
      update(dt) {
        setup();
        if (over) return;
        t += dt;
        if (!finger && Math.abs(AX()) + Math.abs(AY()) > 0.12) {
          tx = clamp(tx + AX() * 300 * dt, 14, W() - 14);
          ty = clamp(ty + AY() * 300 * dt, 110, H() - 130);
        }
        bx += (tx - bx) * Math.min(1, dt * 10);
        by += (ty - by) * Math.min(1, dt * 10);
        trail.push({ x: bx, y: by, life: 1.1 });
        for (const p of trail) p.life -= dt;
        trail = trail.filter(p => p.life > 0);
        for (const m of motes) {
          m.x += m.vx * dt;
          m.y += m.vy * dt;
          if (m.x < 30 || m.x > W() - 30) m.vx *= -1;
          if (m.y < 130 || m.y > H() - 150) m.vy *= -1;
          m.cool = Math.max(0, m.cool - dt);
          if (m.cool <= 0 && Math.hypot(bx - m.x, by - m.y) < 22) {
            m.cool = 1;
            streak = 0;
            m.vx *= -1;
            addPop(pops, 'Dimmed', bx, by - 20, C.purple, 16);
            beep(160, 90, 0.16, 'sawtooth', 0.1);
          }
        }
        starT -= dt;
        if (starT <= 0) { spawn(); starT = 1.6; }
        for (let i = stars.length - 1; i >= 0; i--) {
          const s = stars[i];
          if (Math.hypot(bx - s.x, by - s.y) < 28) {
            stars.splice(i, 1);
            got++;
            streak = sinceGot < 4 ? streak + 1 : 1;
            sinceGot = 0;
            idle = 0;
            fxBurst(parts, s.x, s.y, C.gold, 22, 260);
            addPop(pops, streak > 1 ? 'x' + streak : 'Bright', s.x, s.y - 14, C.gold, 18);
            beep(660 + streak * 60, 990 + streak * 60, 0.1, 'sine', 0.2);
            if (got >= g.goal) { over = true; completeMini(); return; }
          }
        }
        sinceGot += dt;
        idle += dt;
        if (idle > 14) { over = true; miniFail(g, 'The light went out'); return; }
        fxUpdate(parts, dt, 120);
        tickPops(pops, dt);
        hud('Stars ' + got + ' / ' + g.goal + '  •  Streak ' + streak);
      },
      draw() {
        setup();
        studio('#07060f', '#020205');
        ctx2d.globalCompositeOperation = 'lighter';
        for (const p of trail) glowDot(p.x, p.y, 26, 'hsla(190,100%,70%,1)', clamp(p.life / 1.1, 0, 1) * 0.5);
        ctx2d.globalCompositeOperation = 'source-over';
        for (const s of stars) {
          const pulse = 0.7 + 0.3 * Math.sin(t * 4 + s.ph);
          glowDot(s.x, s.y, 30 * pulse, 'hsla(48,100%,70%,1)', 0.7);
          polygon(starPts(s.x, s.y, 10, 4), C.gold);
        }
        for (const m of motes) {
          glowDot(m.x, m.y, 30, 'hsla(280,90%,65%,1)', 0.6);
          circle(m.x, m.y, 6, '#c9a2ff');
        }
        glowDot(bx, by, 44, 'hsla(190,100%,70%,1)', 0.8);
        circle(bx, by, 7, '#ffffff');
        if (idle > 9) text('The light is fading', W() / 2, 150, 16, '#ff9a9a', 'center', 800);
        fxDraw(parts);
        drawPops(pops);
      },
      pointer(x, y) {
        setup();
        finger = true;
        tx = x;
        ty = y;
      },
      stop() { unbind(); }
    };
  }

  // ---------- 8. Pigment Echo: repeat the growing sequence of pigment pots ----------
  function gamePigmentEcho(g) {
    const COL = ['#ff5a7a', '#4fa8ff', '#ffd95a', '#6dff8f'];
    const DIM = ['#4a2330', '#1f3550', '#4d4520', '#1f4a2c'];
    const NM = ['red', 'blue', 'yellow', 'green'];
    const spot = p => ({ x: W() / 2 + (p % 2 ? 88 : -88), y: p < 2 ? 300 : 460 });
    let seq = [], idx = 0, phase = 'gap', phT = 0.8, showI = 0;
    let lit = -1, litT = 0, rounds = 0, sel = 0, over = false, pops = [];

    function nextRound() {
      seq.push(randi(0, 3));
      idx = 0;
      showI = 0;
      phase = 'show';
      phT = 0.7;
    }
    function press(p) {
      if (over || phase !== 'input') return;
      sel = p;
      lit = p;
      litT = 0.22;
      if (p !== seq[idx]) {
        over = true;
        miniFail(g, 'Wrong echo: ' + NM[p] + ' instead of ' + NM[seq[idx]]);
        return;
      }
      idx++;
      if (idx === seq.length) {
        rounds++;
        addPop(pops, 'Echoed!', W() / 2, 250, C.gold, 20);
        beep(600, 900, 0.14, 'sine', 0.2);
        if (rounds >= g.goal) { over = true; completeMini(); return; }
        phase = 'gap';
        phT = 0.9;
      }
    }
    return {
      update(dt) {
        if (!seq.length) nextRound();
        if (over) return;
        if (litT > 0) { litT -= dt; if (litT <= 0) lit = -1; }
        if (phase === 'show') {
          phT -= dt;
          if (phT <= 0) {
            if (showI < seq.length) {
              lit = seq[showI];
              litT = 0.5;
              showI++;
              phT = 0.8;
            } else phase = 'input';
          }
        } else if (phase === 'gap') {
          phT -= dt;
          if (phT <= 0) nextRound();
        } else {
          const ax = AX(), ay = AY();
          const qx = ax > 0.35 ? 1 : ax < -0.35 ? 0 : (sel & 1);
          const qy = ay > 0.35 ? 1 : ay < -0.35 ? 0 : (sel >> 1);
          sel = qx + qy * 2;
          if (pressed('a')) press(sel);
        }
        tickPops(pops, dt);
        hud('Rounds ' + rounds + ' / ' + g.goal + '  •  Length ' + seq.length);
      },
      draw() {
        if (!seq.length) nextRound();
        studio('#130f1d', '#05040a');
        text(phase === 'input' ? 'Your turn' : 'Watch the echo', W() / 2, 200, 20, '#e8e0ff', 'center', 800);
        for (let p = 0; p < 4; p++) {
          const s = spot(p), on = lit === p;
          if (on) glowDot(s.x, s.y, 120, COL[p], 0.5);
          circle(s.x, s.y, 70, on ? COL[p] : DIM[p]);
          if (phase === 'input' && sel === p) strokeCircle(s.x, s.y, 80, '#ffffff', 3);
        }
        drawPops(pops);
      },
      pointer(x, y) {
        if (!seq.length) nextRound();
        for (let p = 0; p < 4; p++) {
          const s = spot(p);
          if (Math.hypot(x - s.x, y - s.y) <= 72) { sel = p; press(p); return; }
        }
      },
      stop() {}
    };
  }

  return {
    engines: {
      n04_tint_tide: gameTintTide,
      n04_hue_hunt: gameHueHunt,
      n04_splat_shot: gameSplatShot,
      n04_clay_wheel: gameClayWheel,
      n04_pixel_mosaic: gamePixelMosaic,
      n04_stroke_beat: gameStrokeBeat,
      n04_light_tracer: gameLightTracer,
      n04_pigment_echo: gamePigmentEcho
    },
    minis: [
      { id: 'n04_tint_tide', title: 'Tint Tide', icon: '🌸', cat: 'PUZZLE', engine: 'n04_tint_tide', goal: 85,
        desc: 'Wash colour into a five-petal flower stencil. Cover the whole bloom, but let too much paint spill outside and the canvas turns to mud.' },
      { id: 'n04_hue_hunt', title: 'Hue Hunt', icon: '🎨', cat: 'PUZZLE', engine: 'n04_hue_hunt', goal: 6,
        desc: 'Mix a paint colour by hue and lightness until it matches the target swatch. Three far-off mixes and the gallery closes.' },
      { id: 'n04_splat_shot', title: 'Paint Flick', icon: '🎯', cat: 'ARCADE', engine: 'n04_splat_shot', goal: 10,
        desc: 'Fling paint blobs at three swaying easels. Each hit leaves a splash on the target, and five misses end the session.' },
      { id: 'n04_clay_wheel', title: 'Clay Wheel', icon: '🏺', cat: 'SIMULATION', engine: 'n04_clay_wheel', goal: 24,
        desc: 'Pull the spinning clay out to the exact profile of a vase, slice by slice. The clay dries out when the timer runs down.' },
      { id: 'n04_pixel_mosaic', title: 'Pixel Mosaic', icon: '🧩', cat: 'PUZZLE', engine: 'n04_pixel_mosaic', goal: 24,
        desc: 'Copy a symmetric pixel picture onto the board from the reference thumbnail. Six wrong pigments and the mosaic is ruined.' },
      { id: 'n04_stroke_beat', title: 'Stroke Beat', icon: '🖌️', cat: 'RHYTHM', engine: 'n04_stroke_beat', goal: 24,
        desc: 'Brush strokes slide down three lanes toward the easel line. Time each hit to paint a stroke on the wall and keep your combo alive.' },
      { id: 'n04_light_tracer', title: 'Light Tracer', icon: '✨', cat: 'ARCADE', engine: 'n04_light_tracer', goal: 12,
        desc: 'Sweep a glowing brush through a dark studio to gather golden stars. Violet motes dim your streak, and a long quiet spell lets the light go out.' },
      { id: 'n04_pigment_echo', title: 'Pigment Echo', icon: '🔊', cat: 'PUZZLE', engine: 'n04_pigment_echo', goal: 8,
        desc: 'Watch the pigment pots light up in order, then repeat the sequence from memory. Each round adds one more pot to the echo.' }
    ],
    aaa: []
  };
})();
