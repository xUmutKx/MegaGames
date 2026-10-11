// Ajan 5 batch: stress toys (a5_wrap, a5_knead, a5_dial), flash-card quizzes (a5_colorword, a5_dots, a5_sumflash), 3D-style sims (a5_ramp, a5_pendulum).
window.__AG_ajan5_batch = (function () {
  const LIVES = 3;

  function a5_wrap(g) {
    const K = p14_kit(), cols = 5, rows = 8;
    let cells = [], pops = 0, done = false;
    const lay = () => { const cw = (W() - 40) / cols, ch = Math.min(cw, (H() - 260) / rows); return { cw, ch, x0: 20, y0: 130 } };
    return {
      update(dt) { K.step(dt); hud("Pops " + pops + "/" + g.goal) },
      pointer(x, y) {
        if (done) return;
        const L = lay(), c = Math.floor((x - L.x0) / L.cw), r = Math.floor((y - L.y0) / L.ch);
        if (c < 0 || r < 0 || c >= cols || r >= rows) return;
        const i = r * cols + c;
        if (cells[i]) return;
        cells[i] = true; pops++;
        K.burst(L.x0 + (c + .5) * L.cw, L.y0 + (r + .5) * L.ch, "#9fe8ff", 8, 120);
        beep(420 + rand(0, 300), 200, .05, "sine", .06);
        if (pops >= g.goal) { done = true; completeMini(); return }
        if (cells.filter(Boolean).length === cols * rows) cells = [];
      },
      stop() {},
      draw() {
        K.begin(); st_bg("#1d3557", "#0b1626");
        const L = lay();
        for (let i = 0; i < cols * rows; i++) {
          const c = i % cols, r = Math.floor(i / cols), x = L.x0 + c * L.cw + 4, y = L.y0 + r * L.ch + 4, w = L.cw - 8, h = L.ch - 8;
          if (cells[i]) rect(x, y, w, h, "rgba(255,255,255,.06)", 12);
          else { rect(x, y, w, h, "#bfe9ff", 12); circle(x + w * .35, y + h * .35, w * .12, "rgba(255,255,255,.8)") }
        }
        text("Tap to pop the bubbles", W() / 2, 104, 15, "#dff6ff", "center");
        K.end();
      }
    };
  }

  function a5_knead(g) {
    const K = p14_kit();
    let lx = null, ly = null, work = 0, done = false, squish = 0, down = false;
    const stopD = p2_drag({
      move: (x, y) => {
        if (done || !down) return;
        if (lx !== null) { const d = Math.hypot(x - lx, y - ly); work += d; squish = Math.min(1, squish + d / 400) }
        lx = x; ly = y;
        if (work >= g.goal * 900) { done = true; completeMini() }
      },
      up: () => { down = false; lx = null; ly = null }
    });
    return {
      update(dt) {
        K.step(dt); squish = Math.max(0, squish - dt * .4);
        hud("Kneaded " + Math.min(g.goal, Math.floor(work / 900)) + "/" + g.goal);
      },
      pointer() { down = true; lx = null },
      stop() { stopD() },
      draw() {
        K.begin(); st_bg("#4a2f1d", "#1f130a");
        const cx = W() / 2, cy = H() * .45, rx = 130 - squish * 30, ry = 90 + squish * 30;
        ctx2d.beginPath(); ctx2d.ellipse(cx, cy + 14, rx + 6, ry * .7, 0, 0, 6.283); ctx2d.fillStyle = "rgba(0,0,0,.3)"; ctx2d.fill();
        ctx2d.beginPath(); ctx2d.ellipse(cx, cy, rx, ry, 0, 0, 6.283); ctx2d.fillStyle = "#f2d49b"; ctx2d.fill();
        ctx2d.beginPath(); ctx2d.ellipse(cx - rx * .3, cy - ry * .35, rx * .35, ry * .18, -.3, 0, 6.283); ctx2d.fillStyle = "rgba(255,255,255,.3)"; ctx2d.fill();
        text("Drag in circles to knead", W() / 2, 104, 15, "#ffe6c4", "center");
        K.end();
      }
    };
  }

  function a5_dial(g) {
    const K = p14_kit(), cx = () => W() / 2, cy = () => H() * .45, R = () => Math.min(W(), H()) * .26;
    let prev = null, total = 0, done = false, ticks = 0, down = false;
    const stopD = p2_drag({
      move: (x, y) => {
        if (done || !down) return;
        const a = Math.atan2(y - cy(), x - cx());
        if (prev !== null) {
          const d = st_wrap(a - prev);
          if (Math.hypot(x - cx(), y - cy()) > 30) total += d;
        }
        prev = a;
        const turns = Math.floor(Math.abs(total) / 6.283);
        if (turns >= g.goal) { done = true; completeMini() }
      },
      up: () => { down = false; prev = null }
    });
    return {
      update(dt) {
        K.step(dt);
        const k = Math.floor(Math.abs(total) / 1.5708);
        if (k > ticks) { ticks = k; beep(300 + k * 30, 500, .03, "triangle", .04) }
        hud("Turns " + Math.min(g.goal, Math.floor(Math.abs(total) / 6.283)) + "/" + g.goal);
      },
      pointer() { down = true; prev = null },
      stop() { stopD() },
      draw() {
        K.begin(); st_bg("#14213d", "#070b16");
        const x = cx(), y = cy(), r = R();
        circle(x, y, r + 14, "#2a3b5c"); circle(x, y, r, "#0e1830");
        for (let i = 0; i < 12; i++) {
          const a = total + i * .5236;
          line(x + Math.cos(a) * r * .55, y + Math.sin(a) * r * .55, x + Math.cos(a) * r * .9, y + Math.sin(a) * r * .9, "#7fd6ff", 4);
        }
        circle(x + Math.cos(total) * r * .8, y + Math.sin(total) * r * .8, 12, C.gold);
        circle(x, y, 14, "#fff");
        text("Spin the dial around its center", W() / 2, 104, 15, "#cfe9ff", "center");
        K.end();
      }
    };
  }

  const COLORS = [{ n: "RED", c: "#ff5570" }, { n: "GREEN", c: "#55ff9a" }, { n: "BLUE", c: "#4da3ff" }, { n: "YELLOW", c: "#ffe36e" }];
  function padRects() { return COLORS.map((k, i) => ({ x: 20 + (i % 2) * ((W() - 60) / 2 + 20), y: H() - 260 + Math.floor(i / 2) * 84, w: (W() - 60) / 2, h: 70, k })) }

  function a5_colorword(g) {
    let round = 0, score = 0, lives = LIVES, word, ink, timeLeft = 0, over = false, feedback = 0, ok = false;
    const K = p14_kit();
    function next() {
      word = pick(COLORS); do { ink = pick(COLORS) } while (ink === word);
      timeLeft = Math.max(1.6, 3 - round * .1);
    }
    next();
    return {
      update(dt) {
        K.step(dt);
        if (over) return;
        if (feedback > 0) { feedback -= dt; if (feedback <= 0) next(); return }
        timeLeft -= dt;
        if (timeLeft <= 0) { lives--; feedback = .6; ok = false; beep(160, 110, .2, "sawtooth", .06); if (lives <= 0) { over = true; miniFail(g, "Out of lives") } return }
        hud("Score " + score + "/" + g.goal + " • Lives " + lives);
      },
      pointer(x, y) {
        if (over || feedback > 0) return;
        for (const r of padRects()) {
          if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
            if (r.k === ink) { score++; ok = true; K.burst(r.x + r.w / 2, r.y + r.h / 2, r.k.c, 10, 140); beep(520, 780, .1, "sine", .08) }
            else { lives--; ok = false; beep(160, 110, .2, "sawtooth", .06) }
            feedback = .6; round++;
            if (score >= g.goal) { over = true; completeMini(); return }
            if (lives <= 0) { over = true; miniFail(g, "Out of lives") }
            return;
          }
        }
      },
      stop() {},
      draw() {
        K.begin(); clear("#0b1020");
        text(word.n, W() / 2, 200, 64, ink.c, "center", 900);
        if (timeLeft > 0) rect(W() / 2 - 120, 240, 240 * Math.max(0, Math.min(1, timeLeft / 3)), 8, "#fff", 4);
        text("Tap the INK color, not the word", W() / 2, 130, 15, "#aab", "center");
        for (const r of padRects()) rect(r.x, r.y, r.w, r.h, r.k.c, 14);
        if (feedback > 0) text(ok ? "Correct" : "Wrong", W() / 2, 300, 22, ok ? C.green : C.red, "center");
        K.end();
      }
    };
  }

  function a5_dots(g) {
    let round = 0, score = 0, lives = LIVES, count = 0, phase = "show", t = 0, feedback = 0, ok = false, over = false;
    const K = p14_kit();
    function next() { count = randi(2, Math.min(9, 3 + Math.floor(round / 2))); phase = "show"; t = 1.1 }
    const dots = [];
    function layDots() { dots.length = 0; for (let i = 0; i < count; i++) dots.push({ x: rand(.15, .85), y: rand(.2, .75) }) }
    next(); layDots();
    const btns = () => Array.from({ length: 9 }, (_, i) => ({ x: 30 + (i % 3) * ((W() - 60) / 3), y: H() - 300 + Math.floor(i / 3) * 70, w: (W() - 60) / 3 - 10, h: 60, v: i + 1 }));
    return {
      update(dt) {
        K.step(dt);
        if (over) return;
        if (feedback > 0) { feedback -= dt; if (feedback <= 0) { next(); layDots() } return }
        if (phase === "show") { t -= dt; if (t <= 0) phase = "answer" }
        hud("Score " + score + "/" + g.goal + " • Lives " + lives);
      },
      pointer(x, y) {
        if (over || phase !== "answer" || feedback > 0) return;
        for (const b of btns()) {
          if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
            ok = b.v === count; feedback = .8; round++;
            if (ok) { score++; beep(520, 780, .1, "sine", .08) } else { lives--; beep(160, 110, .2, "sawtooth", .06) }
            if (score >= g.goal) { over = true; completeMini(); return }
            if (lives <= 0) { over = true; miniFail(g, "Out of lives"); return }
            return;
          }
        }
      },
      stop() {},
      draw() {
        K.begin(); clear("#0c1424");
        if (phase === "show") { for (const d of dots) circle(d.x * W(), d.y * H(), 14, C.cyan); text("Memorize the count", W() / 2, 130, 16, "#cfe", "center") }
        else {
          text("How many dots were there?", W() / 2, 130, 16, "#cfe", "center");
          for (const b of btns()) { rect(b.x, b.y, b.w, b.h, "#1e2d4a", 12); text(String(b.v), b.x + b.w / 2, b.y + b.h / 2 + 10, 26, "#fff", "center") }
        }
        if (feedback > 0) text(ok ? "Correct" : "It was " + count, W() / 2, 200, 22, ok ? C.green : C.red, "center");
        K.end();
      }
    };
  }

  function a5_sumflash(g) {
    let score = 0, lives = LIVES, a = 0, b = 0, answer = 0, opts = [], phase = "show", t = 0, feedback = 0, ok = false, over = false;
    const K = p14_kit();
    function next() {
      a = randi(11, 49); b = randi(11, 49); answer = a + b;
      const set = new Set([answer]);
      while (set.size < 3) set.add(answer + randi(-9, 9) || answer + 10);
      opts = [...set].sort(() => Math.random() - .5);
      phase = "show"; t = Math.max(1.2, 2.4 - score * .08);
    }
    next();
    const btn = i => ({ x: 20 + i * ((W() - 60) / 3 + 10 * .5), y: H() - 230, w: (W() - 60) / 3, h: 70 });
    return {
      update(dt) {
        K.step(dt);
        if (over) return;
        if (feedback > 0) { feedback -= dt; if (feedback <= 0) next(); return }
        if (phase === "show") { t -= dt; if (t <= 0) phase = "answer" }
        hud("Score " + score + "/" + g.goal + " • Lives " + lives);
      },
      pointer(x, y) {
        if (over || phase !== "answer" || feedback > 0) return;
        for (let i = 0; i < opts.length; i++) {
          const r = btn(i);
          if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
            ok = opts[i] === answer; feedback = .7;
            if (ok) { score++; beep(520, 780, .1, "sine", .08) } else { lives--; beep(160, 110, .2, "sawtooth", .06) }
            if (score >= g.goal) { over = true; completeMini() }
            else if (lives <= 0) { over = true; miniFail(g, "Out of lives") }
            return;
          }
        }
      },
      stop() {},
      draw() {
        K.begin(); clear("#101a2e");
        if (phase === "show") text(a + " + " + b, W() / 2, 300, 56, "#fff", "center", 900);
        else { text("What is the sum?", W() / 2, 300, 22, "#cfe", "center"); opts.forEach((v, i) => { const r = btn(i); rect(r.x, r.y, r.w, r.h, "#1e2d4a", 12); text(String(v), r.x + r.w / 2, r.y + r.h / 2 + 10, 24, "#fff", "center") }) }
        if (feedback > 0) text(ok ? "Correct" : "Answer: " + answer, W() / 2, 200, 22, ok ? C.green : C.red, "center");
        K.end();
      }
    };
  }

  function a5_ramp(g) {
    const K = p14_kit();
    let x = 0, z = 0, vx = 0, vz = 0, gems = [], got = 0, done = false;
    function spawn() { gems.push({ x: rand(-.7, .7), z: rand(-.6, .6), t: 0 }) }
    spawn();
    return {
      update(dt) {
        K.step(dt);
        if (done) return;
        vx += AX() * 2.2 * dt; vz += AY() * 2.2 * dt;
        vx *= (1 - .6 * dt); vz *= (1 - .6 * dt);
        x += vx * dt; z += vz * dt;
        if (Math.hypot(x, z) > 1) { done = true; miniFail(g, "Rolled off the ramp"); return }
        for (let i = gems.length - 1; i >= 0; i--) {
          const q = gems[i];
          if (Math.hypot(q.x - x, q.z - z) < .14) {
            got++; gems.splice(i, 1); K.burst(W() / 2 + x * W() * .4, H() * .5 + z * H() * .3, C.gold, 12, 160); beep(700, 1000, .08, "sine", .08);
            if (got >= g.goal) { done = true; completeMini(); return }
            spawn();
          }
        }
        hud("Gems " + got + "/" + g.goal);
      },
      pointer() {},
      stop() {},
      draw() {
        K.begin(); st_bg("#2d6a4f", "#0b1f17");
        const cx = W() / 2, cy = H() * .5, sx = W() * .4, sy = H() * .3;
        ctx2d.beginPath(); ctx2d.ellipse(cx, cy, sx * 1.05, sy * 1.05, 0, 0, 6.283); ctx2d.fillStyle = "rgba(0,0,0,.35)"; ctx2d.fill();
        ctx2d.beginPath(); ctx2d.ellipse(cx, cy, sx, sy, 0, 0, 6.283); ctx2d.fillStyle = "#5fa77a"; ctx2d.fill();
        for (const q of gems) circle(cx + q.x * sx, cy + q.z * sy, 9, C.gold);
        const bx = cx + x * sx, by = cy + z * sy;
        circle(bx + 6, by + 10, 16, "rgba(0,0,0,.3)");
        circle(bx, by, 16, "#e6f7ff"); circle(bx - 5, by - 5, 5, "rgba(255,255,255,.8)");
        text("Tilt to roll. Keep the ball on the ramp.", W() / 2, 104, 15, "#dff6ff", "center");
        K.end();
      }
    };
  }

  function a5_pendulum(g) {
    const K = p14_kit();
    let ph = 0, drop = null, caught = 0, misses = 0, done = false, over = false;
    const pivot = () => ({ x: W() / 2, y: 150 });
    const len = () => H() * .35;
    const bucketX = () => W() / 2;
    return {
      update(dt) {
        K.step(dt);
        if (over) return;
        ph += dt * (1.6 + caught * .08);
        const a = Math.sin(ph) * .9;
        if (drop) {
          drop.vy += 900 * dt; drop.y += drop.vy * dt;
          const bucketY = H() - 220;
          if (drop.y >= bucketY) {
            const off = Math.abs(drop.x - bucketX());
            if (off < 45) { caught++; K.burst(drop.x, bucketY, C.lime, 14, 160); beep(600, 900, .1, "sine", .08); if (caught >= g.goal) { over = true; completeMini(); return } }
            else { misses++; K.pop("miss", drop.x, bucketY - 20, C.red); beep(160, 110, .2, "sawtooth", .06); if (misses >= LIVES) { over = true; miniFail(g, "Too many misses"); return } }
            drop = null;
          }
        }
        hud("Caught " + caught + "/" + g.goal + " • Misses " + misses + "/" + LIVES);
      },
      pointer() { if (!drop && !over) { const p = pivot(), a = Math.sin(ph) * .9; drop = { x: p.x + Math.sin(a) * len(), y: p.y + Math.cos(a) * len(), vy: 0 } } },
      stop() {},
      draw() {
        K.begin(); st_bg("#2b2d42", "#0d0e18");
        const p = pivot(), a = Math.sin(ph) * .9, bx = p.x + Math.sin(a) * len(), by = p.y + Math.cos(a) * len();
        line(p.x, p.y, bx, by, "#c8d0e6", 3);
        circle(p.x, p.y, 6, "#c8d0e6");
        circle(bx, by, 16, C.orange);
        if (drop) circle(drop.x, drop.y, 9, C.gold);
        rect(bucketX() - 45, H() - 220, 90, 14, "#66e0a8", 6);
        text("Tap to drop. Land in the green bucket.", W() / 2, 104, 15, "#d8dcf0", "center");
        K.end();
      }
    };
  }

  return {
    engines: { a5_wrap, a5_knead, a5_dial, a5_colorword, a5_dots, a5_sumflash, a5_ramp, a5_pendulum },
    minis: [
      { id: "a5_wrap", title: "Bubble Wrap", icon: "🫧", cat: "STRESS", desc: "Pop every bubble. The sheet refills when it's full.", engine: "a5_wrap", goal: 40, cfg: {} },
      { id: "a5_knead", title: "Dough Knead", icon: "🥖", cat: "STRESS", desc: "Drag in circles to knead the dough, one fold at a time.", engine: "a5_knead", goal: 8, cfg: {} },
      { id: "a5_dial", title: "Spin Dial", icon: "🌀", cat: "STRESS", desc: "Spin the dial around its center. Keep turning for full laps.", engine: "a5_dial", goal: 6, cfg: {} },
      { id: "a5_colorword", title: "Ink Color", icon: "🖍️", cat: "QUIZ", desc: "The word and its ink color disagree. Tap the ink color.", engine: "a5_colorword", goal: 12, cfg: {} },
      { id: "a5_dots", title: "Dot Count", icon: "⚫", cat: "QUIZ", desc: "Dots flash on screen. Remember how many, then pick the count.", engine: "a5_dots", goal: 10, cfg: {} },
      { id: "a5_sumflash", title: "Flash Sum", icon: "➕", cat: "QUIZ", desc: "A sum flashes for a moment. Pick the right answer from three.", engine: "a5_sumflash", goal: 10, cfg: {} },
      { id: "a5_ramp", title: "Tilt Ramp", icon: "🎱", cat: "SIMULATION", desc: "Tilt to roll the ball across the ramp. Collect the gems and don't fall off.", engine: "a5_ramp", goal: 10, cfg: {} },
      { id: "a5_pendulum", title: "Wrecking Swing", icon: "🪓", cat: "SIMULATION", desc: "Tap to drop the ball from the swinging arm into the green bucket.", engine: "a5_pendulum", goal: 8, cfg: {} }
    ],
    aaa: []
  };
})();
