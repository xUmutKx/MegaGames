// Sports timing and aim minigames (kick, shoot, bat, bowl, throw, flick, clay). Engine keys and mini ids: n18_*
window.__AG_new_18 = (function () {
  const TAU = Math.PI * 2;
  const tri = (x) => { const f = x - Math.floor(x); return f < 0.5 ? f * 2 : 2 - f * 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const approach = (v, to, step) => (Math.abs(to - v) <= step ? to : v + Math.sign(to - v) * step);

  // ---------- shared drawing ----------
  function floor(top, bot, stripe) {
    const w = W(), h = H();
    const g = ctx2d.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, top); g.addColorStop(1, bot);
    ctx2d.fillStyle = g; ctx2d.fillRect(0, 0, w, h);
    for (let y = 0, i = 0; y < h; y += 60, i++) {
      ctx2d.fillStyle = i % 2 ? stripe : 'rgba(0,0,0,0.07)';
      ctx2d.fillRect(0, y, w, 60);
    }
  }
  function ballAt(x, y, r, hi, base) {
    circle(x + r * 0.3, y + r * 0.7, r * 0.9, 'rgba(0,0,0,0.3)');
    const g = ctx2d.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
    g.addColorStop(0, hi); g.addColorStop(1, base);
    ctx2d.fillStyle = g; ctx2d.beginPath(); ctx2d.arc(x, y, r, 0, TAU); ctx2d.fill();
  }
  function meter(x, y, w, h, v, lo, hi, label) {
    rect(x, y, w, h, 'rgba(0,0,0,0.6)', 1);
    rect(x + w * lo, y, w * (hi - lo), h, 'rgba(85,255,154,0.45)', 1);
    rect(x + w * clamp(v, 0, 1) - 2, y - 4, 4, h + 8, C.yellow, 1);
    text(label, x + w / 2, y - 8, 13, '#ffffff', 'center');
  }
  function banner(s, col, a) {
    ctx2d.globalAlpha = clamp(a, 0, 1);
    text(s, W() / 2, H() * 0.44, 34, col, 'center', 900);
    ctx2d.globalAlpha = 1;
  }
  function box(x, y, w, h, col) {
    line(x, y, x + w, y, col, 2); line(x + w, y, x + w, y + h, col, 2);
    line(x + w, y + h, x, y + h, col, 2); line(x, y + h, x, y, col, 2);
  }

  // ---------- 1. Penalty Duel (kick: aim sweep + power meter vs keeper) ----------
  function gamePenalty(g) {
    const cx = W() / 2, gTop = 150, gBot = 250, half = 125, spotY = H() - 230, maxK = g.goal + 5;
    let goals = 0, kicks = 0, phase = 'aim', t = 0, lockX = cx, pw = 0, pT = 0;
    let keeper = cx, keepTo = cx, shot = null, res = '', resCol = '#fff', resT = 0, parts = [], done = false;
    const sweepX = () => cx + (tri(t * 0.45) * 2 - 1) * (half + 40);
    const guessAt = () => (Math.random() < 0.22 + Math.min(0.4, goals * 0.05)
      ? clamp(lockX, cx - half + 20, cx + half - 20)
      : cx + rand(-half + 20, half - 20));
    function kick() {
      kicks++;
      const tx = lockX + (pw - 0.75) * 260; // power error pushes the ball wide
      keepTo = guessAt();
      shot = { t: 0, T: lerp(1.2, 0.75, pw), tx: tx, s: 0 };
      phase = 'flight';
    }
    function land() {
      const tx = shot.tx;
      if (Math.abs(tx - cx) > half) { res = 'WIDE'; resCol = C.orange; }
      else if (Math.abs(tx - keeper) < 38) { res = 'SAVED'; resCol = C.cyan; fxBurst(parts, tx, gBot, C.cyan, 14, 160); }
      else { goals++; res = 'GOAL!'; resCol = C.green; fxBurst(parts, tx, gBot - 20, C.yellow, 30, 260); beep(520, 980, 0.18, 'square', 0.3); }
      phase = 'result'; resT = 1.3;
    }
    return {
      update(dt) {
        if (done) return;
        t += dt;
        if (phase === 'aim') {
          lockX = sweepX();
          if (pressed('a')) { phase = 'power'; pT = t; }
        } else if (phase === 'power') {
          pw = tri((t - pT) * 0.8);
          if (pressed('a')) kick();
        } else if (phase === 'flight') {
          shot.t += dt;
          shot.s = Math.min(1, shot.t / shot.T);
          keeper = approach(keeper, keepTo, 380 * dt);
          if (shot.s >= 1) land();
        } else if (phase === 'result') {
          resT -= dt;
          if (resT <= 0) {
            if (goals >= g.goal) { done = true; completeMini(); return; }
            if (kicks >= maxK) { done = true; miniFail(g, 'Out of kicks: ' + goals + ' goals'); return; }
            phase = 'aim'; shot = null; keeper = cx; keepTo = cx;
          }
        }
        fxUpdate(parts, dt, 300);
        hud('Goals ' + goals + '/' + g.goal + '  Kicks left ' + (maxK - kicks));
      },
      draw() {
        floor('#0d2a17', '#17532c', 'rgba(255,255,255,0.04)');
        box(cx - 190, gTop - 20, 380, gBot - gTop + 220, 'rgba(255,255,255,0.7)');
        rect(cx - half - 6, gTop - 6, 2 * half + 12, 8, '#ffffff');
        rect(cx - half - 6, gTop, 8, gBot - gTop, '#ffffff');
        rect(cx + half - 2, gTop, 8, gBot - gTop, '#ffffff');
        for (let x = cx - half; x <= cx + half; x += 16) line(x, gTop, x, gBot, 'rgba(255,255,255,0.22)', 1);
        for (let y = gTop; y <= gBot; y += 16) line(cx - half, y, cx + half, y, 'rgba(255,255,255,0.22)', 1);
        // keeper
        line(keeper - 24, gBot - 58, keeper + 24, gBot - 58, '#ffb020', 6);
        rect(keeper - 11, gBot - 64, 22, 52, '#ffb020', 1);
        circle(keeper, gBot - 76, 9, '#f0c8a0');
        if (phase === 'aim' || phase === 'power') {
          strokeCircle(lockX, gBot - 40, 14, C.yellow, 2);
          line(lockX - 22, gBot - 40, lockX + 22, gBot - 40, C.yellow, 1);
          line(lockX, gBot - 62, lockX, gBot - 18, C.yellow, 1);
        }
        if (shot) {
          const s = shot.s;
          const bx = lerp(cx, shot.tx, s), by = lerp(spotY, gBot - 30, s) - Math.sin(s * Math.PI) * 70;
          ballAt(bx, by, lerp(15, 8, s), '#ffffff', '#8d98aa');
        } else {
          ballAt(cx, spotY, 15, '#ffffff', '#8d98aa');
        }
        if (phase === 'power') meter(cx - 110, H() - 150, 220, 14, pw, 0.69, 0.81, 'POWER');
        fxDraw(parts);
        if (phase === 'result') banner(res, resCol, resT);
      }
    };
  }

  // ---------- 2. Hoop Lob (shoot: sway-timed release + power) ----------
  function gameHoop(g) {
    const cx = W() / 2, rimY = 200, sy = H() - 230, maxS = g.goal + 6;
    let makes = 0, shots = 0, t = 0, pw = 0, pT = 0, phase = 'ready', shot = null;
    let msg = '', msgCol = '#fff', msgT = 0, parts = [], done = false, drop = 0;
    const hoopAt = (tt) => cx + Math.sin(tt * (0.9 + Math.min(1.3, makes * 0.14))) * W() * 0.3;
    return {
      update(dt) {
        if (done) return;
        t += dt;
        if (phase === 'ready') {
          if (pressed('a')) { phase = 'charge'; pT = t; }
        } else if (phase === 'charge') {
          pw = tri((t - pT) * 0.8);
          if (pressed('a')) {
            const q = Math.abs(pw - 0.5);
            const T = 0.7;
            shot = { t0: t, T: T, tx: hoopAt(t), pw: pw, q: q, s: 0, dx: 0, ok: false, swish: false };
            shot.dx = Math.abs(hoopAt(t + T) - shot.tx);
            shot.ok = q < 0.13 && shot.dx < 26;
            shot.swish = q < 0.035 && shot.dx < 8;
            shots++;
            phase = 'shot';
          }
        } else if (phase === 'shot') {
          shot.s = Math.min(1, (t - shot.t0) / shot.T);
          if (shot.s >= 1) {
            if (shot.ok) {
              makes++; drop = 0;
              msg = shot.swish ? 'SWISH!' : 'GOOD!';
              msgCol = shot.swish ? C.gold : C.green;
              fxBurst(parts, shot.tx, rimY, C.orange, shot.swish ? 36 : 24, 230);
              beep(600, 900, 0.15, 'sine', 0.3);
            } else if (shot.q >= 0.13) {
              msg = shot.pw > 0.5 ? 'TOO HARD' : 'TOO SOFT'; msgCol = C.red;
            } else {
              msg = shot.dx >= 26 ? 'MISSED THE HOOP' : 'RIM OUT'; msgCol = C.red;
            }
            phase = 'result'; msgT = 1.2;
          }
        } else if (phase === 'result') {
          msgT -= dt;
          if (shot && shot.ok) drop += 260 * dt;
          if (msgT <= 0) {
            if (makes >= g.goal) { done = true; completeMini(); return; }
            if (shots >= maxS) { done = true; miniFail(g, 'Out of shots: ' + makes + ' makes'); return; }
            phase = 'ready'; shot = null;
          }
        }
        fxUpdate(parts, dt, 300);
        hud('Makes ' + makes + '/' + g.goal + '  Shots left ' + (maxS - shots));
      },
      draw() {
        floor('#7a4a22', '#4a2a12', 'rgba(255,220,160,0.05)');
        const hx = hoopAt(t);
        rect(hx - 50, rimY - 46, 100, 62, 'rgba(255,255,255,0.92)', 1);
        box(hx - 16, rimY - 26, 32, 26, C.red);
        ctx2d.beginPath(); ctx2d.ellipse(hx, rimY, 26, 7, 0, 0, TAU);
        ctx2d.strokeStyle = C.orange; ctx2d.lineWidth = 4; ctx2d.stroke();
        for (let i = -3; i <= 3; i++) line(hx + i * 7, rimY + 2, hx + i * 4, rimY + 30 + drop * 0.2, 'rgba(255,255,255,0.7)', 1);
        if (phase === 'shot' || phase === 'result') {
          const s = shot.s;
          const bx = lerp(cx, shot.tx, s), by = lerp(sy, rimY, s) - Math.sin(s * Math.PI) * lerp(120, 300, shot.pw);
          ballAt(bx, by + drop, 12, '#ffd6a0', '#c25a1a');
        } else {
          ballAt(cx, sy, 14, '#ffd6a0', '#c25a1a');
        }
        if (phase === 'charge') meter(cx - 110, H() - 150, 220, 14, pw, 0.37, 0.63, 'POWER');
        fxDraw(parts);
        if (phase === 'result') banner(msg, msgCol, msgT);
      }
    };
  }

  // ---------- 3. Pitch Clutch (bat: swing inside the timing window) ----------
  function gamePitch(g) {
    const cx = W() / 2, plateY = H() - 260, topY = 180, maxMiss = 4;
    let hits = 0, misses = 0, pt = null, swing = 0, swung = false, hb = null;
    let msg = '', msgCol = '#fff', msgT = 0, wait = 0, parts = [], done = false;
    function newPitch() {
      const off = rand(-140, 140);
      pt = { x: cx + off, dur: Math.max(0.5, rand(0.75, 1.1) - hits * 0.02), t: 0, zone: Math.abs(off) <= 52 };
      swung = false;
    }
    function miss(s) {
      misses++; msg = s; msgCol = C.red; msgT = 0.7;
    }
    newPitch();
    return {
      update(dt) {
        if (done) return;
        fxUpdate(parts, dt, 300);
        if (hb) {
          hb.vy += 520 * dt; hb.x += hb.vx * dt; hb.y += hb.vy * dt;
          if (hb.y > H() + 40) hb = null;
        }
        if (swing > 0) swing -= dt;
        if (msgT > 0) {
          msgT -= dt;
          if (msgT <= 0) {
            if (hits >= g.goal) { done = true; completeMini(); return; }
            if (misses >= maxMiss) { done = true; miniFail(g, 'Three strikes and out: ' + hits + ' hits'); return; }
            newPitch();
          }
        } else if (pt) {
          pt.t += dt;
          const p = pt.t / pt.dur;
          if (pressed('a') && !swung) {
            swung = true; swing = 0.28;
            const inBat = Math.abs(pt.x - cx) <= 62;
            if (inBat && p >= 0.86 && p <= 1.06) {
              const q = Math.abs(p - 0.96);
              if (q < 0.07) {
                const perfect = q < 0.03;
                hits++;
                hb = { x: pt.x, y: plateY, vx: rand(-140, 140), vy: perfect ? -780 : -560 };
                msg = perfect ? 'HOME RUN!' : 'HIT!';
                msgCol = perfect ? C.gold : C.green;
                fxBurst(parts, pt.x, plateY, perfect ? C.gold : C.white, perfect ? 30 : 16, 260);
                beep(420, 880, 0.12, 'square', 0.25);
                msgT = 0.7; pt = null;
              } else { miss('FOUL'); pt = null; }
            } else { miss(inBat ? 'TOO EARLY' : 'OUT OF ZONE'); pt = null; }
          }
          if (pt && p > 1.12) {
            if (pt.zone) miss('STRIKE'); else { pt = null; msg = 'BALL'; msgCol = C.cyan; msgT = 0.5; }
          }
        }
        if (!pt && msgT <= 0 && !done) {
          // ball called or hit resolved: start next pitch after a short pause
          wait += dt;
          if (wait > 0.5) { wait = 0; newPitch(); }
        }
        hud('Hits ' + hits + '/' + g.goal + '  Strikes ' + misses + '/' + maxMiss);
      },
      draw() {
        floor('#0f4d24', '#0a2e17', 'rgba(255,255,255,0.04)');
        // pitcher mound and pitcher
        circle(cx, topY - 6, 46, 'rgba(160,110,60,0.5)');
        circle(cx, topY - 36, 11, '#f0c8a0'); rect(cx - 9, topY - 24, 18, 26, '#2d6bd6', 1);
        // strike zone and plate
        box(cx - 52, plateY - 40, 104, 60, 'rgba(255,255,255,0.5)');
        polygon([[cx - 22, plateY + 20], [cx + 22, plateY + 20], [cx + 22, plateY + 32], [cx, plateY + 42], [cx - 22, plateY + 32]], '#eeeeee');
        // batter with swinging bat
        const bx = cx - 92, by = plateY + 30;
        circle(bx, by - 18, 12, '#f0c8a0'); rect(bx - 10, by - 6, 20, 36, '#c0392b', 1);
        const k = swing > 0 ? 1 - swing / 0.28 : 0;
        const a = lerp(-2.4, 0.6, k);
        line(bx + 4, by + 2, bx + 4 + Math.cos(a) * 64, by + 2 + Math.sin(a) * 64, '#d9b27a', 6);
        if (pt) {
          const p = clamp(pt.t / pt.dur, 0, 1.2);
          const px = lerp(cx, pt.x, p), py = lerp(topY, plateY, p);
          ballAt(px, py, lerp(3, 15, Math.min(1, p)), '#ffffff', '#8d98aa');
        }
        if (hb) ballAt(hb.x, hb.y, 9, '#ffffff', '#8d98aa');
        fxDraw(parts);
        if (msgT > 0) banner(msg, msgCol, Math.min(1, msgT * 2));
      }
    };
  }

  // ---------- 4. Lane Strike (bowl: aim sweep, release, curve with the stick) ----------
  function gameLane(g) {
    const cx = W() / 2, laneTop = 170, startY = H() - 190, maxRoll = 10;
    let knocked = 0, rolls = 0, t = 0, phase = 'aim', lockX = cx, bx = cx, by = startY, pins = [];
    let msg = '', msgCol = '#fff', msgT = 0, parts = [], done = false, rolledPins = 0;
    function rack() {
      pins = [];
      for (let r = 0; r < 4; r++) for (let c = 0; c <= r; c++) {
        pins.push({ x: cx + (c - r / 2) * 26, y: laneTop + 22 + r * 24, down: false, vx: 0, vy: 0 });
      }
    }
    rack();
    return {
      update(dt) {
        if (done) return;
        t += dt;
        fxUpdate(parts, dt, 200);
        for (const p of pins) if (p.down) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.92; p.vy *= 0.92; }
        if (phase === 'aim') {
          lockX = cx + (tri(t * 0.5) * 2 - 1) * 110;
          bx = lockX; by = startY;
          if (pressed('a')) { phase = 'roll'; rolledPins = 0; }
        } else if (phase === 'roll') {
          bx = clamp(bx + AX() * 150 * dt, 60, W() - 60);
          by -= 720 * dt;
          for (const p of pins) {
            if (p.down) continue;
            if (dist(bx, by, p.x, p.y) < 20) {
              p.down = true; knocked++; rolledPins++;
              const a = Math.atan2(p.y - by, p.x - bx);
              p.vx = Math.cos(a) * rand(120, 220); p.vy = Math.sin(a) * rand(120, 220) - 40;
              fxBurst(parts, p.x, p.y, C.white, 6, 140);
            }
          }
          if (by < laneTop - 20) {
            phase = 'result'; rolls++;
            const all = pins.every(p => p.down);
            msg = all ? 'STRIKE!' : rolledPins === 0 ? 'GUTTER' : rolledPins + ' DOWN';
            msgCol = all ? C.gold : rolledPins === 0 ? C.red : C.green;
            if (all) { beep(700, 1200, 0.2, 'square', 0.3); }
            msgT = 1.2;
          }
        } else if (phase === 'result') {
          msgT -= dt;
          if (msgT <= 0) {
            if (knocked >= g.goal) { done = true; completeMini(); return; }
            if (rolls >= maxRoll) { done = true; miniFail(g, 'Rolls used up: ' + knocked + ' pins'); return; }
            if (pins.every(p => p.down)) rack();
            phase = 'aim';
          }
        }
        hud('Pins ' + knocked + '/' + g.goal + '  Rolls left ' + (maxRoll - rolls));
      },
      draw() {
        floor('#24130a', '#3a2010', 'rgba(255,255,255,0.03)');
        // lane and gutters
        rect(cx - 96, laneTop - 30, 192, H() - laneTop - 90, '#c9a36a', 1);
        rect(cx - 104, laneTop - 30, 8, H() - laneTop - 90, '#0b0b0b');
        rect(cx + 96, laneTop - 30, 8, H() - laneTop - 90, '#0b0b0b');
        for (let i = 0; i < 7; i++) circle(cx - 60 + i * 20, laneTop + 6, 2, 'rgba(60,30,10,0.5)');
        for (const p of pins) {
          if (p.down) { circle(p.x, p.y, 6, 'rgba(240,240,240,0.7)'); continue; }
          rect(p.x - 5, p.y - 12, 10, 20, '#ffffff', 1);
          circle(p.x, p.y - 14, 5, '#ffffff');
          line(p.x - 5, p.y - 4, p.x + 5, p.y - 4, C.red, 3);
        }
        if (phase === 'aim') {
          strokeCircle(lockX, startY - 40, 12, C.yellow, 2);
        }
        ballAt(bx, by, 13, '#6fa8ff', '#0b1c4a');
        fxDraw(parts);
        if (phase === 'result') banner(msg, msgCol, msgT);
      }
    };
  }

  // ---------- 5. Bullseye Toss (throw: swinging crosshair, wobble from speed) ----------
  function gameBullseye(g) {
    const bx = W() / 2, by = 250, R = Math.min(140, W() * 0.38), maxT = g.goal + 6;
    let thrown = 0, hits = 0, t = 0, speed = 0, prev = null, dart = null, stuck = [];
    let msg = '', msgCol = '#fff', msgT = 0, parts = [], done = false;
    const crossAt = (tt) => ({ x: bx + Math.sin(tt * 1.9) * R * 1.05, y: by + Math.sin(tt * 1.3 + 1) * R * 0.6 });
    let cur = crossAt(0);
    return {
      update(dt) {
        if (done) return;
        t += dt;
        const nxt = crossAt(t);
        speed = dist(nxt.x, nxt.y, cur.x, cur.y) / Math.max(dt, 1e-4);
        cur = nxt;
        fxUpdate(parts, dt, 200);
        if (dart) {
          dart.t += dt;
          if (dart.t >= dart.T) {
            const x = dart.x1, y = dart.y1, r = dist(x, y, bx, by) / R;
            let pts = 0, label = 'MISS', col = C.red;
            if (r < 0.12) { pts = 50; label = 'BULLSEYE!'; col = C.gold; }
            else if (r < 0.3) { pts = 25; label = 'INNER'; col = C.yellow; }
            else if (r < 0.6) { pts = 10; label = 'OUTER'; col = C.green; }
            else if (r < 1) { pts = 5; label = 'EDGE'; col = C.cyan; }
            if (r < 0.3) hits++;
            stuck.push({ x: x, y: y, a: Math.atan2(y - by, x - bx) });
            fxBurst(parts, x, y, col, pts ? 16 : 6, 180);
            msg = label + (pts ? ' +' + pts : ''); msgCol = col; msgT = 0.9;
            dart = null;
          }
        } else if (msgT > 0) {
          msgT -= dt;
          if (msgT <= 0) {
            if (hits >= g.goal) { done = true; completeMini(); return; }
            if (thrown >= maxT) { done = true; miniFail(g, 'Darts gone: ' + hits + ' inner hits'); return; }
          }
        }
        if (pressed('a') && !dart && msgT <= 0 && thrown < maxT) {
          thrown++;
          const wob = speed * 0.02;
          const ox = rand(-wob, wob), oy = rand(-wob, wob);
          dart = { x0: bx, y0: H() - 190, x1: cur.x + ox, y1: cur.y + oy, t: 0, T: 0.32 };
        }
        hud('Inner hits ' + hits + '/' + g.goal + '  Darts left ' + (maxT - thrown));
      },
      draw() {
        floor('#1b2433', '#0c1119', 'rgba(255,255,255,0.03)');
        const rings = [[1, '#e8e4d6'], [0.86, '#2b2b33'], [0.66, '#e8e4d6'], [0.46, '#2b2b33'], [0.3, '#d6453c'], [0.12, '#f4b400']];
        for (const [f, c] of rings) circle(bx, by, R * f, c);
        circle(bx, by, R * 1.02, 'rgba(0,0,0,0.25)');
        for (const s of stuck) {
          line(s.x - Math.cos(s.a) * 16, s.y - Math.sin(s.a) * 16, s.x, s.y, '#c9c9d4', 3);
          circle(s.x, s.y, 3, C.red);
        }
        if (dart) {
          const k = clamp(dart.t / dart.T, 0, 1), e = k * k;
          const x = lerp(dart.x0, dart.x1, e), y = lerp(dart.y0, dart.y1, e);
          line(x, y + 18, x, y, '#dddddd', 3);
          circle(x, y, 3, C.red);
        } else {
          strokeCircle(cur.x, cur.y, 13, C.yellow, 2);
          line(cur.x - 20, cur.y, cur.x + 20, cur.y, C.yellow, 1);
          line(cur.x, cur.y - 20, cur.x, cur.y + 20, C.yellow, 1);
        }
        fxDraw(parts);
        if (msgT > 0) banner(msg, msgCol, Math.min(1, msgT * 2));
      }
    };
  }

  // ---------- 6. Gusty Bow (shoot: moving target, gusting wind, joystick lead) ----------
  function gameBow(g) {
    const cx = W() / 2, ty = 230, R = Math.min(120, W() * 0.32), by = H() - 200, maxA = g.goal + 6;
    let hits = 0, shots = 0, t = 0, aimX = cx, wind = 0, windT = 0, stuck = [], arrow = null;
    let msg = '', msgCol = '#fff', msgT = 0, parts = [], done = false;
    const tgtAt = (tt) => cx + Math.sin(tt * 1.25) * W() * 0.3 + Math.sin(tt * 3.1) * 12;
    return {
      update(dt) {
        if (done) return;
        t += dt;
        windT -= dt;
        if (windT <= 0) { wind = rand(-1, 1); windT = rand(2, 3.5); }
        fxUpdate(parts, dt, 200);
        if (!arrow) aimX = clamp(aimX + AX() * 280 * dt, 20, W() - 20);
        if (arrow) {
          arrow.t += dt;
          if (arrow.t >= arrow.T) {
            const tg = tgtAt(t);
            const d = Math.abs(arrow.x1 - tg) / R;
            let pts = 0, label = 'MISS', col = C.red;
            if (d < 0.15) { pts = 10; label = 'CENTER!'; col = C.gold; }
            else if (d < 0.4) { pts = 5; label = 'HIT'; col = C.green; }
            else if (d < 1) { pts = 2; label = 'GRAZE'; col = C.cyan; }
            if (d < 0.4) hits++;
            stuck.push({ x: arrow.x1, y: ty });
            fxBurst(parts, arrow.x1, ty, col, pts ? 16 : 6, 160);
            msg = label + (pts ? ' +' + pts : ''); msgCol = col; msgT = 0.9;
            arrow = null;
          }
        } else if (msgT > 0) {
          msgT -= dt;
          if (msgT <= 0) {
            if (hits >= g.goal) { done = true; completeMini(); return; }
            if (shots >= maxA) { done = true; miniFail(g, 'Arrows gone: ' + hits + ' hits'); return; }
          }
        }
        if (pressed('a') && !arrow && msgT <= 0 && shots < maxA) {
          shots++;
          arrow = { t: 0, T: 0.35, x1: aimX + wind * 48 };
        }
        hud('Hits ' + hits + '/' + g.goal + '  Arrows left ' + (maxA - shots));
      },
      draw() {
        floor('#1e3b2a', '#0b1d14', 'rgba(255,255,255,0.03)');
        const tx = tgtAt(t);
        for (let i = 0; i < 3; i++) { circle(tx, ty, R * [1, 0.66, 0.33][i], ['#f1efe6', '#d6453c', '#f4b400'][i]); }
        circle(tx, ty, R * 0.12, '#222');
        for (const s of stuck) { line(s.x, s.y, s.x, s.y - 26, '#c9c9d4', 2); }
        // wind streaks
        ctx2d.globalAlpha = 0.5;
        line(cx - 60 * wind, H() * 0.36, cx + 60 * wind, H() * 0.36, '#cfeaff', 2);
        ctx2d.globalAlpha = 1;
        text(wind > 0 ? 'WIND >>' : 'WIND <<', cx, H() * 0.36 - 8, 12, '#cfeaff', 'center');
        // bow
        ctx2d.beginPath(); ctx2d.arc(cx, by + 10, 34, -2.6, -0.5);
        ctx2d.strokeStyle = '#8b5a2b'; ctx2d.lineWidth = 4; ctx2d.stroke();
        if (arrow) {
          const k = clamp(arrow.t / arrow.T, 0, 1);
          const x = lerp(cx, arrow.x1, k), y = lerp(by, ty, k);
          line(x, y + 20, x, y, '#f0e6c8', 3);
        } else {
          strokeCircle(aimX, ty, 14, C.yellow, 2);
          line(aimX - 22, ty, aimX + 22, ty, C.yellow, 1);
          line(aimX, ty - 22, aimX, ty + 22, C.yellow, 1);
        }
        fxDraw(parts);
        if (msgT > 0) banner(msg, msgCol, Math.min(1, msgT * 2));
      }
    };
  }

  // ---------- 7. Flick Finish (kick: upward swipe sets direction and power) ----------
  function gameFlick(g) {
    const cx = W() / 2, goalY = 160, half = 70, home = { x: cx, y: H() - 210 }, maxA = g.goal + 6;
    let b = { x: home.x, y: home.y, vx: 0, vy: 0, live: false };
    let goals = 0, attempts = 0, t = 0, defs = [], rest = 0;
    let msg = '', msgCol = '#fff', msgT = 0, parts = [], done = false;
    for (let i = 0; i < 3; i++) defs.push({ ph: rand(0, 6), sp: rand(0.8, 1.4), y: H() * 0.48 + i * 4 });
    function endShot(label, col) {
      b.live = false; msg = label; msgCol = col; msgT = 1.0; rest = 0;
    }
    return {
      swipe(dx, dy) {
        if (done || b.live || msgT > 0 || attempts >= maxA || dy >= 0) return;
        const len = Math.hypot(dx, dy) || 1;
        const sp = clamp(len * 6, 380, 1100);
        b = { x: home.x, y: home.y, vx: dx / len * sp, vy: dy / len * sp, live: true };
        attempts++;
      },
      update(dt) {
        if (done) return;
        t += dt;
        fxUpdate(parts, dt, 0);
        const keeperX = cx + Math.sin(t * 1.3) * half * 0.8;
        if (b.live) {
          const drag = Math.exp(-1.2 * dt);
          b.vx *= drag; b.vy *= drag;
          b.x += b.vx * dt; b.y += b.vy * dt;
          if (b.x < 12) { b.x = 12; b.vx = Math.abs(b.vx) * 0.6; }
          if (b.x > W() - 12) { b.x = W() - 12; b.vx = -Math.abs(b.vx) * 0.6; }
          for (const d of defs) {
            const dx = cx + Math.sin(t * d.sp + d.ph) * W() * 0.32;
            if (b.x > dx - 26 && b.x < dx + 26 && b.y > d.y - 8 && b.y < d.y + 8) {
              b.vy = Math.abs(b.vy) * 0.7; b.vx += (b.x - dx) * 4;
              fxBurst(parts, b.x, b.y, C.white, 8, 120); beep(300, 220, 0.06, 'square', 0.2);
            }
          }
          if (dist(b.x, b.y, keeperX, goalY + 18) < 22) {
            fxBurst(parts, b.x, b.y, C.cyan, 16, 200); endShot('SAVED', C.cyan);
          } else if (b.y < goalY + 4) {
            if (Math.abs(b.x - cx) <= half) {
              goals++; fxBurst(parts, b.x, goalY, C.gold, 34, 260); beep(560, 1040, 0.2, 'square', 0.3);
              endShot('GOAL!', C.green);
            } else endShot('WIDE', C.orange);
          } else if (Math.hypot(b.vx, b.vy) < 25 || b.y > H()) {
            endShot('SHORT', C.red);
          }
        } else if (msgT > 0) {
          msgT -= dt;
          if (msgT <= 0) {
            if (goals >= g.goal) { done = true; completeMini(); return; }
            if (attempts >= maxA) { done = true; miniFail(g, 'Out of kicks: ' + goals + ' goals'); return; }
          }
        }
        hud('Goals ' + goals + '/' + g.goal + '  Kicks left ' + (maxA - attempts));
      },
      draw() {
        floor('#0d2a17', '#17532c', 'rgba(255,255,255,0.04)');
        // goal frame and net
        rect(cx - half - 6, goalY - 6, 2 * half + 12, 8, '#ffffff');
        rect(cx - half - 6, goalY, 8, 40, '#ffffff');
        rect(cx + half - 2, goalY, 8, 40, '#ffffff');
        for (let x = cx - half; x <= cx + half; x += 14) line(x, goalY, x, goalY + 40, 'rgba(255,255,255,0.2)', 1);
        // keeper
        const kx = cx + Math.sin(t * 1.3) * half * 0.8;
        circle(kx, goalY + 18, 14, '#ffb020');
        circle(kx, goalY + 6, 6, '#f0c8a0');
        // defenders
        for (const d of defs) {
          const dx = cx + Math.sin(t * d.sp + d.ph) * W() * 0.32;
          rect(dx - 26, d.y - 8, 52, 16, '#3b82f6', 1);
        }
        // ball and aim hint
        if (!b.live) ballAt(home.x, home.y, 13, '#ffffff', '#8d98aa');
        else ballAt(b.x, b.y, 13, '#ffffff', '#8d98aa');
        fxDraw(parts);
        if (msgT > 0) banner(msg, msgCol, Math.min(1, msgT * 2));
      }
    };
  }

  // ---------- 8. Clay Rush (shoot: lead the moving clay discs, limited shells) ----------
  function gameClay(g) {
    const cx = W() / 2, gunY = H() - 170, shellsMax = g.goal + 8, thrownMax = g.goal + 12;
    let ch = { x: cx, y: H() * 0.45 }, hits = 0, shells = shellsMax, thrown = 0, t = 0, discs = [], spawnT = 0.6;
    let muzzle = 0, msg = '', msgCol = '#fff', msgT = 0, parts = [], done = false;
    return {
      update(dt) {
        if (done) return;
        t += dt;
        ch.x = clamp(ch.x + AX() * 420 * dt, 20, W() - 20);
        ch.y = clamp(ch.y + AY() * 420 * dt, 100, H() - 130);
        spawnT -= dt;
        if (spawnT <= 0 && thrown < thrownMax) {
          thrown++;
          const dir = Math.random() < 0.5 ? 1 : -1;
          const diff = Math.min(1, hits / g.goal);
          discs.push({
            x: dir > 0 ? -20 : W() + 20, y: rand(H() * 0.4, H() * 0.6),
            vx: dir * rand(170, 260) * (1 + diff * 0.4), vy: -rand(170, 260) * (1 + diff * 0.2),
            r: 14, trail: []
          });
          spawnT = rand(0.9, 1.6) - diff * 0.4;
        }
        for (const d of discs) {
          d.vy += 260 * dt; d.x += d.vx * dt; d.y += d.vy * dt;
          d.trail.push({ x: d.x, y: d.y, a: 1 });
          if (d.trail.length > 8) d.trail.shift();
        }
        discs = discs.filter(d => d.x > -40 && d.x < W() + 40 && d.y < H() + 40);
        fxUpdate(parts, dt, 120);
        muzzle = Math.max(0, muzzle - dt * 6);
        if (msgT > 0) msgT -= dt;
        if (pressed('a') && shells > 0) {
          shells--; muzzle = 1;
          let best = null, bd = 1e9;
          for (const d of discs) { const dd = dist(ch.x, ch.y, d.x, d.y); if (dd < d.r + 10 && dd < bd) { bd = dd; best = d; } }
          if (best) {
            hits++; discs.splice(discs.indexOf(best), 1);
            fxBurst(parts, best.x, best.y, C.orange, 26, 240); beep(260, 90, 0.12, 'sawtooth', 0.3);
            msg = 'PULL HIT'; msgCol = C.gold; msgT = 0.6;
          } else {
            fxBurst(parts, ch.x, ch.y, C.white, 6, 80);
            msg = 'MISS'; msgCol = C.red; msgT = 0.5;
          }
        }
        if (hits >= g.goal) { done = true; completeMini(); return; }
        if (shells <= 0 && discs.length === 0 && (thrown >= thrownMax || shells <= 0)) {
          done = true; miniFail(g, 'Out of shells: ' + hits + ' hits'); return;
        }
        hud('Hits ' + hits + '/' + g.goal + '  Shells ' + shells);
      },
      draw() {
        const w = W(), h = H();
        const sky = ctx2d.createLinearGradient(0, 0, 0, h);
        sky.addColorStop(0, '#1b1f4a'); sky.addColorStop(0.6, '#f0743a'); sky.addColorStop(1, '#2a1b2e');
        ctx2d.fillStyle = sky; ctx2d.fillRect(0, 0, w, h);
        ctx2d.fillStyle = '#132a1a';
        ctx2d.beginPath(); ctx2d.moveTo(0, h * 0.7);
        for (let x = 0; x <= w; x += 20) ctx2d.lineTo(x, h * 0.7 - Math.sin(x * 0.02) * 22 - 14);
        ctx2d.lineTo(w, h); ctx2d.lineTo(0, h); ctx2d.fill();
        for (const d of discs) {
          for (const tr of d.trail) circle(tr.x, tr.y, 3, 'rgba(255,200,120,0.25)');
          ctx2d.save(); ctx2d.translate(d.x, d.y); ctx2d.rotate(Math.atan2(d.vy, d.vx));
          ctx2d.beginPath(); ctx2d.ellipse(0, 0, 16, 7, 0, 0, TAU);
          ctx2d.fillStyle = C.orange; ctx2d.fill();
          ctx2d.beginPath(); ctx2d.ellipse(0, -2, 10, 3, 0, 0, TAU);
          ctx2d.fillStyle = 'rgba(255,255,255,0.35)'; ctx2d.fill();
          ctx2d.restore();
        }
        // gun
        const ang = Math.atan2(ch.y - gunY, ch.x - cx);
        line(cx, gunY, cx + Math.cos(ang) * 70, gunY + Math.sin(ang) * 70, '#2b2b33', 9);
        circle(cx, gunY, 18, '#3a3a46');
        if (muzzle > 0) circle(cx + Math.cos(ang) * 74, gunY + Math.sin(ang) * 74, 14 * muzzle + 4, 'rgba(255,220,120,' + muzzle.toFixed(2) + ')');
        // crosshair
        strokeCircle(ch.x, ch.y, 14, '#ffffff', 2);
        line(ch.x - 20, ch.y, ch.x - 6, ch.y, '#ffffff', 2); line(ch.x + 6, ch.y, ch.x + 20, ch.y, '#ffffff', 2);
        line(ch.x, ch.y - 20, ch.x, ch.y - 6, '#ffffff', 2); line(ch.x, ch.y + 6, ch.x, ch.y + 20, '#ffffff', 2);
        fxDraw(parts);
        if (msgT > 0) banner(msg, msgCol, Math.min(1, msgT * 2));
      }
    };
  }

  const engines = {
    n18_penalty_duel: gamePenalty,
    n18_hoop_lob: gameHoop,
    n18_pitch_clutch: gamePitch,
    n18_lane_strike: gameLane,
    n18_bullseye_toss: gameBullseye,
    n18_gusty_bow: gameBow,
    n18_flick_finish: gameFlick,
    n18_clay_rush: gameClay
  };
  const minis = [
    { id: 'n18_penalty_duel', title: 'Penalty Duel', icon: '⚽', cat: 'SPORTS', desc: 'Aim across the goal mouth, then lock a power meter in the sweet spot. The keeper reads your aim more often as you score.', engine: 'n18_penalty_duel', goal: 5 },
    { id: 'n18_hoop_lob', title: 'Hoop Lob', icon: '🏀', cat: 'SPORTS', desc: 'The hoop sways side to side. Release near the peak of its swing with the power meter centred. Swishes are bonus precision.', engine: 'n18_hoop_lob', goal: 6 },
    { id: 'n18_pitch_clutch', title: 'Pitch Clutch', icon: '⚾', cat: 'SPORTS', desc: 'Pitches curve toward the plate. Swing in the window as the ball crosses it. Three strikes and you are out.', engine: 'n18_pitch_clutch', goal: 6 },
    { id: 'n18_lane_strike', title: 'Lane Strike', icon: '🎳', cat: 'SPORTS', desc: 'Sweep the aim across the lane, release, then steer the ball with the stick to pick off pins. Clear the rack for a strike.', engine: 'n18_lane_strike', goal: 25 },
    { id: 'n18_bullseye_toss', title: 'Bullseye Toss', icon: '🎯', cat: 'SPORTS', desc: 'A crosshair swings around the board. Throw when it is centred. Fast swings wobble the dart, so time it on the slow arc.', engine: 'n18_bullseye_toss', goal: 5 },
    { id: 'n18_gusty_bow', title: 'Gusty Bow', icon: '🏹', cat: 'SPORTS', desc: 'Steer the aim with the stick to lead a moving target. Gusts push the arrow sideways, so compensate before you loose.', engine: 'n18_gusty_bow', goal: 6 },
    { id: 'n18_flick_finish', title: 'Flick Finish', icon: '👟', cat: 'SPORTS', desc: 'Swipe up to kick. The swipe sets direction and power. Defenders deflect and the keeper saves, so bend the shot around them.', engine: 'n18_flick_finish', goal: 4 },
    { id: 'n18_clay_rush', title: 'Clay Rush', icon: '🥏', cat: 'SPORTS', desc: 'Clay discs sail across the dusk sky. Move the crosshair ahead of each disc and fire. Shells are limited.', engine: 'n18_clay_rush', goal: 8 }
  ];
  return { engines: engines, minis: minis, aaa: [] };
})();
