// new_10: memory and card minigames (all engine keys and mini ids start with n10_)
window.__AG_new_10 = (function () {
  const INK = "#1d1d2b", PAPER = "#f7f2e4", EDGE = "#d8cfb4";
  const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  const SUITS = ["♠", "♥", "♦", "♣"];

  // ---------- shared drawing kit ----------
  function bgFill(top, bot) {
    const g = ctx2d.createLinearGradient(0, 0, 0, H());
    g.addColorStop(0, top); g.addColorStop(1, bot);
    ctx2d.fillStyle = g; ctx2d.fillRect(0, 0, W(), H());
  }
  function rr(x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx2d.beginPath();
    ctx2d.moveTo(x + r, y);
    ctx2d.arcTo(x + w, y, x + w, y + h, r);
    ctx2d.arcTo(x + w, y + h, x, y + h, r);
    ctx2d.arcTo(x, y + h, x, y, r);
    ctx2d.arcTo(x, y, x + w, y, r);
    ctx2d.closePath();
  }
  function panel(x, y, w, h, fill, edge) {
    rr(x, y, w, h, 10); ctx2d.fillStyle = fill; ctx2d.fill();
    ctx2d.strokeStyle = edge; ctx2d.lineWidth = 2; ctx2d.stroke();
  }
  function cardBack(x, y, w, h, tint) {
    const g = ctx2d.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, tint || "#2d2468"); g.addColorStop(1, "#0d0b24");
    rr(x, y, w, h, 8); ctx2d.fillStyle = g; ctx2d.fill();
    ctx2d.strokeStyle = "#8f83ff"; ctx2d.lineWidth = 2; ctx2d.stroke();
    const cx = x + w / 2, cy = y + h / 2, s = Math.min(w, h) * 0.18;
    ctx2d.beginPath();
    ctx2d.moveTo(cx, cy - s); ctx2d.lineTo(cx + s * 0.7, cy);
    ctx2d.lineTo(cx, cy + s); ctx2d.lineTo(cx - s * 0.7, cy); ctx2d.closePath();
    ctx2d.fillStyle = "rgba(170,160,255,0.45)"; ctx2d.fill();
  }
  function cardFace(x, y, w, h, label, color, big) {
    rr(x, y, w, h, 8); ctx2d.fillStyle = PAPER; ctx2d.fill();
    ctx2d.strokeStyle = EDGE; ctx2d.lineWidth = 2; ctx2d.stroke();
    if (w > 14) text(label, x + w / 2, y + h / 2 + (big || Math.min(w, h) * 0.2) * 0.36, big || Math.min(w, h) * 0.4, color || INK, "center", 800);
  }
  function glowPad(x, y, w, h, color, on) {
    rr(x, y, w, h, 14);
    if (on) { ctx2d.shadowColor = color; ctx2d.shadowBlur = 24; }
    const g = ctx2d.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, on ? "#ffffff" : color); g.addColorStop(1, on ? color : "rgba(0,0,0,0.45)");
    ctx2d.fillStyle = g; ctx2d.globalAlpha = on ? 1 : 0.55; ctx2d.fill(); ctx2d.globalAlpha = 1;
    ctx2d.shadowBlur = 0;
  }
  function button(x, y, w, h, label, color) {
    panel(x, y, w, h, "#171430", color || "#6d62d6");
    text(label, x + w / 2, y + h / 2 + 6, Math.min(22, h * 0.5), "#fff", "center", 800);
  }
  function inRect(px, py, x, y, w, h) { return px >= x && px <= x + w && py >= y && py <= y + h; }
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = randi(0, i); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function rankOf(v) { return RANKS[v - 1]; }
  function redOf(s) { return s === 1 || s === 2 ? "#c8213f" : INK; }
  function ease(a, b, k, dt) { return a + (b - a) * Math.min(1, dt * k); }

  // ---------- 1. Glyph Pairs: classic memory pairs with a miss budget ----------
  function gPairs(g) {
    const SYM = ["★", "●", "▲", "■", "◆", "✚", "☾", "✿", "⚑", "☘"];
    const COL = ["#ff5f8f", "#5fd4ff", "#ffd35f", "#9d7bff", "#6dff9b", "#ff9150", "#f2f2f2", "#ff6b6b", "#7dd3fc", "#c4ff5c"];
    let level = 1, cards = [], cols = 4, rows = 3, A = -1, B = -1, wait = 0, newWait = 0;
    let total = 0, lives = 6, parts = [], shake = 0, left = 0;
    function deal() {
      const n = Math.min(SYM.length, 3 + level);
      const list = [];
      for (let k = 0; k < n; k++) list.push(k, k);
      shuffle(list);
      cards = list.map(s => ({ s, a: 0, face: false, done: false }));
      left = n; rows = Math.ceil(cards.length / cols); A = -1; B = -1; wait = 0;
    }
    function geo() {
      const top = 128, bot = H() - 130, aw = W() - 40;
      const cw = Math.min(84, (aw - (cols - 1) * 8) / cols);
      const ch = Math.min(cw * 1.3, (bot - top - (rows - 1) * 8) / rows);
      const gx = (W() - (cols * cw + (cols - 1) * 8)) / 2, gy = top + ((bot - top) - (rows * ch + (rows - 1) * 8)) / 2;
      return { cw, ch, gx, gy };
    }
    function hit(px, py) {
      const q = geo();
      for (let i = 0; i < cards.length; i++) {
        const x = q.gx + (i % cols) * (q.cw + 8), y = q.gy + Math.floor(i / cols) * (q.ch + 8);
        if (inRect(px, py, x, y, q.cw, q.ch)) return i;
      }
      return -1;
    }
    deal();
    return {
      update(dt) {
        for (const c of cards) c.a = ease(c.a, c.face || c.done ? 1 : 0, 14, dt);
        if (newWait > 0) { newWait -= dt; if (newWait <= 0) deal(); }
        if (B >= 0 && newWait <= 0) {
          wait -= dt;
          if (wait <= 0) {
            if (cards[A].s === cards[B].s) {
              cards[A].done = cards[B].done = true; total++; left--;
              const q = geo(), c = cards[A];
              const i = cards.indexOf(c), j = cards.indexOf(cards[B]);
              for (const k of [i, j]) fxBurst(parts, q.gx + (k % cols) * (q.cw + 8) + q.cw / 2, q.gy + Math.floor(k / cols) * (q.ch + 8) + q.ch / 2, COL[cards[k].s], 14, 180);
              beep(660, 990, 0.12, "triangle", 0.1);
              if (left === 0) { level++; newWait = 1.0; beep(440, 880, 0.3, "sine", 0.12); }
            } else {
              cards[A].face = cards[B].face = false; lives--; shake = 0.3; beep(200, 120, 0.18, "sawtooth", 0.06);
              if (lives <= 0) { hud("Misses out"); miniFail(g, "Too many misses"); return; }
            }
            A = -1; B = -1;
            if (total >= g.goal) { completeMini(); return; }
          }
        }
        if (shake > 0) shake -= dt;
        fxUpdate(parts, dt, 40);
        hud("Pairs " + total + "/" + g.goal);
      },
      pointer(x, y) {
        if (newWait > 0 || B >= 0) return;
        const i = hit(x, y);
        if (i < 0) return;
        const c = cards[i];
        if (c.face || c.done) return;
        c.face = true;
        if (A < 0) A = i; else { B = i; wait = 0.75; }
      },
      draw() {
        bgFill("#16103a", "#06050f");
        const q = geo();
        const sx = shake > 0 ? Math.sin(shake * 80) * 4 * shake : 0;
        text("Level " + level + "   Misses left " + lives, W() / 2, 104, 15, "#cfc6ff", "center", 700);
        for (let i = 0; i < cards.length; i++) {
          const c = cards[i];
          const x = q.gx + (i % cols) * (q.cw + 8) + sx, y = q.gy + Math.floor(i / cols) * (q.ch + 8);
          const f = c.a, k = Math.abs(Math.cos(f * Math.PI));
          const w = q.cw * Math.max(0.04, k), cx = x + q.cw / 2;
          if (c.done) ctx2d.globalAlpha = 0.35;
          if (f > 0.5) cardFace(cx - w / 2, y, w, q.ch, SYM[c.s], COL[c.s], Math.min(q.cw, q.ch) * 0.46);
          else cardBack(cx - w / 2, y, w, q.ch);
          ctx2d.globalAlpha = 1;
        }
        fxDraw(parts);
      },
      stop() {}
    };
  }

  // ---------- 2. Echo Pads: Simon-style sequence memory ----------
  function gEcho(g) {
    const COL = ["#ff5f8f", "#5fd4ff", "#ffd35f", "#6dff9b"], FREQ = [262, 330, 392, 523];
    let seq = [], phase = "gap", t = 0, idx = 0, round = 0, lit = -1, litT = 0, parts = [], dead = false;
    function geo() {
      const s = Math.min((W() - 80) / 2, 160, (H() - 320) / 2);
      const x0 = W() / 2 - s - 6, y0 = (H() - 120 + 70) / 2 - s - 6;
      return { s, x0, y0 };
    }
    function padAt(px, py) {
      const q = geo();
      for (let i = 0; i < 4; i++) {
        const x = q.x0 + (i % 2) * (q.s + 12), y = q.y0 + (i >> 1) * (q.s + 12);
        if (inRect(px, py, x, y, q.s, q.s)) return i;
      }
      return -1;
    }
    function flash(i) { lit = i; litT = 0.22; beep(FREQ[i], FREQ[i] * 1.01, 0.18, "square", 0.07); }
    function next() { seq.push(randi(0, 3)); phase = "show"; t = 0; idx = 0; }
    next();
    return {
      update(dt) {
        if (dead) return;
        if (litT > 0) { litT -= dt; if (litT <= 0) lit = -1; }
        if (phase === "gap") { t += dt; if (t > 0.7) next(); }
        else if (phase === "show") {
          const step = Math.max(0.3, 0.75 - round * 0.04);
          t += dt;
          const k = Math.floor(t / step);
          if (k >= seq.length) { phase = "input"; idx = 0; lit = -1; litT = 0; }
          else if (t - k * step < 0.01) flash(seq[k]);
        }
        if (phase === "input" && litT <= 0) lit = -1;
        fxUpdate(parts, dt, 0);
        hud("Round " + round + "/" + g.goal);
      },
      pointer(x, y) {
        if (phase !== "input") return;
        const p = padAt(x, y);
        if (p < 0) return;
        flash(p);
        const q = geo();
        fxBurst(parts, q.x0 + (p % 2) * (q.s + 12) + q.s / 2, q.y0 + (p >> 1) * (q.s + 12) + q.s / 2, COL[p], 10, 140);
        if (p !== seq[idx]) {
          dead = true; phase = "over";
          beep(140, 80, 0.4, "sawtooth", 0.1);
          miniFail(g, "Wrong pad after " + round + " rounds");
          return;
        }
        idx++;
        if (idx === seq.length) {
          round++; phase = "gap"; t = 0;
          if (round >= g.goal) { phase = "over"; dead = true; completeMini(); }
        }
      },
      draw() {
        bgFill("#0e1426", "#05060c");
        const q = geo();
        for (let i = 0; i < 4; i++) {
          const x = q.x0 + (i % 2) * (q.s + 12), y = q.y0 + (i >> 1) * (q.s + 12);
          glowPad(x, y, q.s, q.s, COL[i], lit === i);
        }
        const cx = W() / 2, cy = q.y0 + q.s + 6;
        circle(cx, cy, 26, "#0b0d18"); strokeCircle(cx, cy, 26, "#2c3554", 2);
        text(phase === "input" ? "Your turn" : phase === "show" ? "Watch" : "Ready", cx, cy + 5, 14, "#dfe7ff", "center", 800);
        text("Repeat the pattern", cx, q.y0 - 26, 16, "#9fb4e6", "center", 600);
        fxDraw(parts);
      },
      stop() {}
    };
  }

  // ---------- 3. Pyramid Thirteen: solitaire, pairs summing to 13 ----------
  function gPyramid(g) {
    let cards = [], stock = [], waste = [], sel = null, removed = 0, parts = [];
    function newDeal() {
      const deck = [];
      for (let s = 0; s < 4; s++) for (let v = 1; v <= 13; v++) deck.push({ v, s, gone: false, r: 0, j: 0 });
      shuffle(deck);
      cards = deck.slice(0, 28);
      let k = 0;
      for (let r = 0; r < 7; r++) for (let j = 0; j <= r; j++) { cards[k].r = r; cards[k].j = j; k++; }
      stock = deck.slice(28); waste = []; sel = null; removed = 0;
    }
    const ix = (r, j) => r * (r + 1) / 2 + j;
    function free(c) {
      if (c.gone) return false;
      if (c.r === 6) return true;
      return cards[ix(c.r + 1, c.j)].gone && cards[ix(c.r + 1, c.j + 1)].gone;
    }
    function pos(c) { return { x: W() / 2 + (c.j - c.r / 2) * 50 - 23, y: 116 + c.r * 42 }; }
    function stockPos() { return { x: W() / 2 - 112, y: H() - 230 }; }
    function wastePos() { return { x: W() / 2 + 6, y: H() - 230 }; }
    function avail() {
      const out = cards.filter(free).map(c => c.v);
      if (waste.length) out.push(waste[waste.length - 1].v);
      return out;
    }
    function canPlay() {
      const a = avail();
      if (a.includes(13)) return true;
      for (let i = 0; i < a.length; i++) for (let j = i + 1; j < a.length; j++) if (a[i] + a[j] === 13) return true;
      return false;
    }
    function pick(src) {
      if (src.v === 13) { takeCard(src); sel = null; beep(700, 900, 0.1, "triangle", 0.1); return; }
      if (sel && sel.card === src.card) { sel = null; return; }
      if (sel && sel.v + src.v === 13) {
        takeCard(sel); takeCard(src); sel = null; beep(520, 780, 0.14, "triangle", 0.1);
      } else { sel = src; beep(360, 400, 0.05, "square", 0.04); }
    }
    function takeCard(src) {
      if (src.w) waste.pop(); else src.card.gone = true;
      removed++;
    }
    newDeal();
    return {
      update(dt) {
        fxUpdate(parts, dt, 60);
        if (removed >= g.goal) { completeMini(); return; }
        if (stock.length === 0 && !canPlay()) { miniFail(g, "No pairs left in the pyramid"); return; }
        hud("Cleared " + removed + "/" + g.goal);
      },
      pointer(x, y) {
        for (const c of cards) {
          if (!free(c)) continue;
          const p = pos(c);
          if (inRect(x, y, p.x, p.y, 46, 62)) { pick({ card: c, v: c.v, w: false }); return; }
        }
        const sp = stockPos(), wp = wastePos();
        if (inRect(x, y, sp.x, sp.y, 46, 62)) {
          if (stock.length) { waste.push(stock.pop()); sel = null; beep(300, 260, 0.05, "square", 0.05); }
          return;
        }
        if (waste.length && inRect(x, y, wp.x, wp.y, 46, 62)) {
          const top = waste[waste.length - 1];
          pick({ card: top, v: top.v, w: true });
        }
      },
      draw() {
        bgFill("#0f3a2c", "#06180f");
        text("Pairs make 13. Kings clear alone.", W() / 2, 100, 14, "#bfe9d4", "center", 600);
        for (const c of cards) {
          if (c.gone) continue;
          const p = pos(c), on = sel && sel.card === c;
          if (free(c)) {
            cardFace(p.x, p.y, 46, 62, rankOf(c.v) + SUITS[c.s], redOf(c.s), 15);
            if (on) strokeCircle(p.x + 23, p.y + 31, 36, "#ffe36e", 3);
          } else cardBack(p.x, p.y, 46, 62, "#244d3c");
        }
        const sp = stockPos(), wp = wastePos();
        if (stock.length) cardBack(sp.x, sp.y, 46, 62, "#2b5c8a");
        text("" + stock.length, sp.x + 23, sp.y + 70, 13, "#bfe9d4", "center", 700);
        if (waste.length) {
          const t = waste[waste.length - 1];
          const on = sel && sel.card === t;
          cardFace(wp.x, wp.y, 46, 62, rankOf(t.v) + SUITS[t.s], redOf(t.s), 15);
          if (on) strokeCircle(wp.x + 23, wp.y + 31, 36, "#ffe36e", 3);
        }
        fxDraw(parts);
      },
      stop() {}
    };
  }

  // ---------- 4. Higher or Lower: guess the next rank, 3 strikes ----------
  function gHiLo(g) {
    let deck = [], cur = 0, nxt = 0, phase = "guess", guess = 0, rev = 0, wait = 0, streak = 0, correct = 0, strikes = 3, msg = "", msgT = 0, parts = [];
    function draw() {
      if (deck.length < 2) { deck = []; for (let s = 0; s < 4; s++) for (let v = 1; v <= 13; v++) deck.push(v); shuffle(deck); }
      return deck.pop();
    }
    cur = draw();
    return {
      update(dt) {
        if (phase === "reveal") {
          rev = Math.min(1, rev + dt * 3);
          if (rev >= 1) {
            let ok = null;
            if (nxt === cur) { msg = "Tie. Card stays in play"; ok = null; }
            else ok = (nxt > cur) === (guess > 0);
            if (ok === true) { correct++; streak++; msg = "Correct! Streak " + streak; beep(600, 900, 0.14, "triangle", 0.1); fxBurst(parts, W() / 2, H() * 0.4, "#6dff9b", 16, 200); }
            else if (ok === false) {
              streak = 0; strikes--; msg = "Wrong. Strikes left " + strikes; beep(200, 110, 0.25, "sawtooth", 0.08);
              if (strikes <= 0) { miniFail(g, "Out of strikes at " + correct + " correct calls"); return; }
            }
            cur = nxt; phase = "wait"; wait = 0.9; msgT = 1.4;
            if (correct >= g.goal) { completeMini(); return; }
          }
        } else if (phase === "wait") {
          wait -= dt; if (wait <= 0) { phase = "guess"; rev = 0; }
        }
        if (msgT > 0) msgT -= dt;
        fxUpdate(parts, dt, 60);
        hud("Correct " + correct + "/" + g.goal);
      },
      pointer(x, y) {
        if (phase !== "guess") return;
        if (y < 90 || y > H() - 120) return;
        guess = x < W() / 2 ? -1 : 1;
        nxt = draw();
        phase = "reveal"; rev = 0;
      },
      draw() {
        bgFill("#2a0f22", "#0a0410");
        const mid = W() / 2;
        ctx2d.globalAlpha = phase === "guess" ? 0.4 : 0.12;
        rect(0, 80, mid, H() - 200, "#ff5f8f", 0);
        rect(mid, 80, mid, H() - 200, "#5fd4ff", 0);
        ctx2d.globalAlpha = 1;
        text("LOWER", mid / 2, 120, 20, "#ffb3cc", "center", 900);
        text("HIGHER", mid + mid / 2, 120, 20, "#b8ecff", "center", 900);
        text("Tap a side to call it", mid, 150, 13, "#cbb6c4", "center", 600);
        const cw = 110, ch = 160, cy = H() / 2 - 80;
        cardFace(mid - cw - 30, cy, cw, ch, rankOf(cur), INK, 44);
        if (phase === "guess" || (phase === "reveal" && rev < 0.5)) {
          cardBack(mid + 30, cy, cw, ch, "#4a1d3f");
        } else {
          const k = Math.abs(Math.cos(Math.min(1, rev) * Math.PI));
          const w = cw * Math.max(0.04, k);
          if (rev >= 0.5 || phase === "wait") cardFace(mid + 30 + (cw - w) / 2, cy, w, ch, rankOf(nxt), INK, 44);
          else cardBack(mid + 30 + (cw - w) / 2, cy, w, ch, "#4a1d3f");
        }
        const hasMsg = msgT > 0 && msg.length;
        if (hasMsg) text(msg, mid, cy + ch + 46, 17, "#fff", "center", 800);
        text("Strikes " + "♥".repeat(Math.max(0, strikes)), mid, H() - 150, 16, "#ff9fbf", "center", 800);
        fxDraw(parts);
      },
      stop() {}
    };
  }

  // ---------- 5. Lantern Grid: watch lit tiles, then repeat them ----------
  function gLantern(g) {
    let lvl = 0, N = 3, tgt = [], sel = [], phase = "show", t = 0, showFor = 1.8, gap = 0, parts = [];
    function setup() {
      N = lvl < 3 ? 3 : lvl < 7 ? 4 : 5;
      const cells = N * N;
      const k = Math.min(Math.floor(cells / 2), 2 + lvl);
      const all = []; for (let i = 0; i < cells; i++) all.push(i);
      tgt = shuffle(all).slice(0, k);
      sel = []; phase = "show"; t = 0;
      showFor = Math.max(0.9, 1.9 - lvl * 0.08);
    }
    function geo() {
      const cs = Math.min((W() - 60) / N - 8, (H() - 330) / N - 8, 104);
      const total = N * (cs + 8) - 8;
      return { cs, x0: (W() - total) / 2, y0: 150 + Math.max(0, (H() - 270 - total) / 2) };
    }
    setup();
    return {
      update(dt) {
        fxUpdate(parts, dt, 0);
        if (phase === "show") { t += dt; if (t >= showFor) { phase = "input"; beep(500, 700, 0.12, "sine", 0.08); } }
        else if (phase === "gap") { gap -= dt; if (gap <= 0) setup(); }
        hud("Level " + lvl + "/" + g.goal);
      },
      pointer(x, y) {
        if (phase !== "input") return;
        const q = geo();
        let c = -1;
        for (let i = 0; i < N * N; i++) {
          const cx = q.x0 + (i % N) * (q.cs + 8), cy = q.y0 + Math.floor(i / N) * (q.cs + 8);
          if (inRect(x, y, cx, cy, q.cs, q.cs)) { c = i; break; }
        }
        if (c < 0 || sel.includes(c)) return;
        if (!tgt.includes(c)) { miniFail(g, "Wrong tile on level " + (lvl + 1)); phase = "over"; return; }
        sel.push(c);
        const cx = q.x0 + (c % N) * (q.cs + 8) + q.cs / 2, cy = q.y0 + Math.floor(c / N) * (q.cs + 8) + q.cs / 2;
        fxBurst(parts, cx, cy, "#ffd35f", 12, 150);
        beep(420 + sel.length * 60, 640 + sel.length * 60, 0.09, "triangle", 0.08);
        if (sel.length === tgt.length) {
          lvl++; phase = "gap"; gap = 0.9;
          if (lvl >= g.goal) { phase = "over"; completeMini(); }
        }
      },
      draw() {
        bgFill("#1b1407", "#070503");
        const q = geo();
        text("Remember the lit lanterns", W() / 2, 104, 15, "#ffe8b0", "center", 700);
        for (let i = 0; i < N * N; i++) {
          const x = q.x0 + (i % N) * (q.cs + 8), y = q.y0 + Math.floor(i / N) * (q.cs + 8);
          const lit = phase === "show" && tgt.includes(i);
          const picked = sel.includes(i);
          const base = picked ? "#6dff9b" : lit ? "#ffd35f" : "#2b2115";
          if (lit || picked) { ctx2d.shadowColor = base; ctx2d.shadowBlur = 22; }
          rr(x, y, q.cs, q.cs, 12);
          const gr = ctx2d.createLinearGradient(x, y, x, y + q.cs);
          gr.addColorStop(0, lit || picked ? "#fff8dc" : "#3a2e1c"); gr.addColorStop(1, base);
          ctx2d.fillStyle = gr; ctx2d.fill();
          ctx2d.shadowBlur = 0;
        }
        if (phase === "input") text("Repeat the " + tgt.length + " lit tiles (" + sel.length + "/" + tgt.length + ")", W() / 2, H() - 150, 15, "#ffe8b0", "center", 700);
        fxDraw(parts);
      },
      stop() {}
    };
  }

  // ---------- 6. Shell Game: track the ball under shuffling cups ----------
  function gShell(g) {
    let n = 3, order = [], slotOf = [], ball = 0, phase = "reveal", t = 0, moves = 0, stepT = 0, found = 0, lives = 3, flashT = 0, lastOk = null, parts = [];
    const px = [], lift = [];
    function slotX(s) { const sp = Math.min(118, (W() - 40) / n); return W() / 2 + (s - (n - 1) / 2) * sp; }
    function spacing() { return Math.min(118, (W() - 40) / n); }
    function setup() {
      n = Math.min(5, 3 + Math.floor(found / 3));
      order = []; slotOf = [];
      for (let i = 0; i < n; i++) { order.push(i); slotOf.push(i); px[i] = slotX(i); lift[i] = 0; }
      ball = randi(0, n - 1); phase = "reveal"; t = 0; lastOk = null;
    }
    function startShuffle() {
      moves = 4 + Math.min(found, 8); stepT = 0; phase = "shuffle";
    }
    function swapSlots() {
      const a = randi(0, n - 1); let b = randi(0, n - 1); if (b === a) b = (a + 1) % n;
      const ia = order[a], ib = order[b];
      order[a] = ib; order[b] = ia; slotOf[ib] = a; slotOf[ia] = b;
      beep(260 + a * 40, 300 + b * 40, 0.06, "triangle", 0.05);
    }
    function cupAt(x, y) {
      const sp = spacing(), cy = H() / 2 - 40;
      for (let i = 0; i < n; i++) {
        const cx = px[i];
        if (Math.abs(x - cx) < sp * 0.42 && y > cy - 110 && y < cy + 70) return i;
      }
      return -1;
    }
    setup();
    return {
      update(dt) {
        for (let i = 0; i < n; i++) {
          px[i] = ease(px[i], slotX(slotOf[i]), 10, dt);
          const target = (phase === "reveal" || (phase === "result" && i === ball)) ? 1 : 0;
          lift[i] = ease(lift[i], target, 8, dt);
        }
        t += dt;
        if (phase === "reveal" && t > 0.9) startShuffle();
        else if (phase === "shuffle") {
          stepT -= dt;
          if (stepT <= 0 && moves > 0) { swapSlots(); moves--; stepT = Math.max(0.16, 0.34 - found * 0.012); }
          if (moves <= 0 && stepT <= 0.05) { phase = "pick"; t = 0; }
        } else if (phase === "result") {
          flashT -= dt;
          if (flashT <= 0) {
            if (found >= g.goal) { completeMini(); return; }
            setup();
          }
        }
        fxUpdate(parts, dt, 60);
        hud("Found " + found + "/" + g.goal);
      },
      pointer(x, y) {
        if (phase !== "pick") return;
        const c = cupAt(x, y);
        if (c < 0) return;
        if (c === ball) {
          found++; lastOk = true; beep(640, 1000, 0.18, "triangle", 0.1);
          fxBurst(parts, px[c], H() / 2 - 40, "#6dff9b", 22, 220);
        } else {
          lives--; lastOk = false; beep(180, 110, 0.25, "sawtooth", 0.08);
          if (lives <= 0) { phase = "result"; flashT = 0; miniFail(g, "The ball was under cup " + (ball + 1) + " after " + found + " finds"); return; }
        }
        phase = "result"; flashT = 1.1;
      },
      draw() {
        bgFill("#0b1a26", "#03070c");
        const sp = spacing(), cy = H() / 2 - 40;
        text("Where is the ball?", W() / 2, 104, 17, "#bfe7ff", "center", 800);
        text("Lives " + "●".repeat(Math.max(0, lives)), W() / 2, 130, 14, "#ffb3b3", "center", 700);
        for (let i = 0; i < n; i++) {
          const x = px[i], lf = lift[i] * 70;
          if (lift[i] > 0.5 && i === ball) circle(x, cy + 14 - lf * 0.2, 15, "#ff5fa2");
          const w = sp * 0.8, top = cy - 60 - lf;
          const gr = ctx2d.createLinearGradient(x - w / 2, top, x + w / 2, top + 120);
          gr.addColorStop(0, "#8fd8ff"); gr.addColorStop(1, "#1f5d86");
          ctx2d.beginPath();
          ctx2d.moveTo(x - w / 2, top + 120);
          ctx2d.lineTo(x - w * 0.36, top); ctx2d.lineTo(x + w * 0.36, top); ctx2d.lineTo(x + w / 2, top + 120);
          ctx2d.closePath(); ctx2d.fillStyle = gr; ctx2d.fill();
          ctx2d.strokeStyle = "#cfefff"; ctx2d.lineWidth = 2; ctx2d.stroke();
        }
        if (phase === "shuffle") text("Watch closely...", W() / 2, cy + 130, 16, "#9ccfe8", "center", 700);
        if (phase === "pick") text("Tap the cup hiding the ball", W() / 2, cy + 130, 16, "#ffe36e", "center", 800);
        if (phase === "result" && lastOk !== null) text(lastOk ? "Found it!" : "Wrong cup", W() / 2, cy + 130, 18, lastOk ? "#6dff9b" : "#ff7070", "center", 900);
        fxDraw(parts);
      },
      stop() {}
    };
  }

  // ---------- 7. Number Vault: memorise a row of numbers, then key in the sum ----------
  function gVault(g) {
    const KEYS = [["1", "2", "3"], ["4", "5", "6"], ["7", "8", "9"], ["C", "0", "OK"]];
    let lvl = 0, nums = [], phase = "show", t = 0, showFor = 3, typed = "", lives = 3, okT = 0, parts = [], lastMsg = "";
    function setup() {
      const cnt = Math.min(6, 3 + Math.floor(lvl / 2));
      nums = []; for (let i = 0; i < cnt; i++) nums.push(randi(1, 9));
      showFor = Math.max(1.8, 3.2 - lvl * 0.15);
      phase = "show"; t = 0; typed = "";
    }
    function kb() {
      const kw = Math.min(90, (W() - 60) / 3), kh = 50;
      const x0 = (W() - kw * 3 - 8 * 2) / 2, y0 = H() - 120 - 4 * (kh + 8);
      return { kw, kh, x0, y0 };
    }
    function keyAt(x, y) {
      const k = kb();
      for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) {
        const x1 = k.x0 + c * (k.kw + 8), y1 = k.y0 + r * (k.kh + 8);
        if (inRect(x, y, x1, y1, k.kw, k.kh)) return KEYS[r][c];
      }
      return null;
    }
    setup();
    return {
      update(dt) {
        fxUpdate(parts, dt, 40);
        if (phase === "show") { t += dt; if (t >= showFor) { phase = "type"; } }
        else if (phase === "ok") { okT -= dt; if (okT <= 0) setup(); }
        hud("Rounds " + lvl + "/" + g.goal);
      },
      pointer(x, y) {
        if (phase !== "type") return;
        const k = keyAt(x, y);
        if (k === null) return;
        if (k === "C") { typed = ""; return; }
        if (k !== "OK") { if (typed.length < 3) typed += k; return; }
        const sum = nums.reduce((a, b) => a + b, 0);
        if (typed !== "" && parseInt(typed, 10) === sum) {
          lvl++; phase = "ok"; okT = 0.9; lastMsg = "Sum " + sum + " is right!";
          beep(560, 880, 0.2, "triangle", 0.1); fxBurst(parts, W() / 2, 200, "#6dff9b", 20, 200);
          if (lvl >= g.goal) { phase = "over"; completeMini(); }
        } else {
          lives--; typed = ""; beep(180, 120, 0.2, "sawtooth", 0.08);
          if (lives <= 0) { phase = "over"; miniFail(g, "The sum was " + sum); }
        }
      },
      draw() {
        bgFill("#1a1030", "#07040f");
        text("Memorise the numbers", W() / 2, 104, 16, "#d8ccff", "center", 800);
        const cw = Math.min(64, (W() - 40) / nums.length - 8), y = 150;
        const x0 = (W() - nums.length * (cw + 8) + 8) / 2;
        for (let i = 0; i < nums.length; i++) {
          const x = x0 + i * (cw + 8);
          if (phase === "show") cardFace(x, y, cw, cw * 1.35, String(nums[i]), INK, cw * 0.55);
          else cardBack(x, y, cw, cw * 1.35);
        }
        if (phase === "show") {
          const left = Math.max(0, showFor - t);
          text("Memorise in " + left.toFixed(1) + "s", W() / 2, y + cw * 1.35 + 28, 15, "#d8ccff", "center", 700);
        } else if (phase === "type") {
          text("Enter the total", W() / 2, y + cw * 1.35 + 28, 16, "#ffe36e", "center", 800);
        } else {
          text(lastMsg, W() / 2, y + cw * 1.35 + 28, 16, "#6dff9b", "center", 800);
        }
        const k = kb();
        panel(k.x0 - 10, H() - 120 - 4 * (k.kh + 8) - 60, k.kw * 3 + 36, 44, "#120c24", "#4d3c86");
        text((typed || "_") + "   Lives " + lives, W() / 2, H() - 120 - 4 * (k.kh + 8) - 32, 20, "#fff", "center", 900);
        for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) {
          const x1 = k.x0 + c * (k.kw + 8), y1 = k.y0 + r * (k.kh + 8);
          button(x1, y1, k.kw, k.kh, KEYS[r][c], KEYS[r][c] === "OK" ? "#6dff9b" : KEYS[r][c] === "C" ? "#ff7070" : "#6d62d6");
        }
        fxDraw(parts);
      },
      stop() {}
    };
  }

  // ---------- 8. Rank Ladder: memorise ranks, tap them back in ascending order ----------
  function gLadder(g) {
    let lvl = 0, cards = [], nextRank = 0, phase = "show", t = 0, showFor = 2, lives = 3, parts = [], miss = null, missT = 0;
    function setup() {
      const k = Math.min(6, 3 + Math.floor(lvl / 2));
      const pool = []; for (let v = 1; v <= 13; v++) pool.push(v);
      shuffle(pool);
      cards = pool.slice(0, k).map(v => ({ v, shown: true, done: false }));
      shuffle(cards);
      nextRank = 0; phase = "show"; t = 0; miss = null;
      showFor = Math.max(1.6, 2.6 - lvl * 0.1);
    }
    function sorted() { return cards.map(c => c.v).sort((a, b) => a - b); }
    function geo() {
      const k = cards.length;
      const cw = Math.min(70, (W() - 50) / k - 8), ch = cw * 1.4;
      return { cw, ch, x0: (W() - (k * (cw + 8) - 8)) / 2, y: H() / 2 - ch / 2 - 30 };
    }
    function hit(x, y) {
      const q = geo();
      for (let i = 0; i < cards.length; i++) if (inRect(x, y, q.x0 + i * (q.cw + 8), q.y, q.cw, q.ch)) return i;
      return -1;
    }
    setup();
    return {
      update(dt) {
        fxUpdate(parts, dt, 40);
        if (phase === "show") {
          t += dt;
          if (t >= showFor) { for (const c of cards) c.shown = false; phase = "input"; }
        } else if (phase === "input" && miss) {
          missT -= dt; if (missT <= 0) miss = null;
        } else if (phase === "clear") {
          t -= dt; if (t <= 0) setup();
        }
        hud("Ladders " + lvl + "/" + g.goal);
      },
      pointer(x, y) {
        if (phase !== "input") return;
        const i = hit(x, y);
        if (i < 0) return;
        const c = cards[i];
        if (c.done || c.shown) return;
        const q = geo();
        const cx = q.x0 + i * (q.cw + 8) + q.cw / 2, cy = q.y + q.ch / 2;
        const want = sorted()[nextRank];
        c.shown = true;
        if (c.v === want) {
          c.done = true; nextRank++; beep(500 + nextRank * 50, 700 + nextRank * 50, 0.1, "triangle", 0.09);
          fxBurst(parts, cx, cy, "#6dff9b", 14, 180);
          if (nextRank === cards.length) {
            lvl++; phase = "clear"; t = 0.9; beep(600, 1000, 0.3, "sine", 0.12);
            if (lvl >= g.goal) { phase = "over"; completeMini(); }
          }
        } else {
          lives--; miss = i; missT = 0.8; beep(180, 120, 0.2, "sawtooth", 0.08);
          fxBurst(parts, cx, cy, "#ff5570", 14, 160);
          c.shown = false; c.wrong = true;
          if (lives <= 0) { phase = "over"; miniFail(g, "Ladder broke at round " + (lvl + 1)); }
        }
      },
      draw() {
        bgFill("#101c30", "#050912");
        const q = geo();
        text("Memorise the ranks, then tap lowest to highest", W() / 2, 104, 14, "#cfe0ff", "center", 700);
        text("Lives " + lives + "   Next " + (phase === "input" ? rankOf(sorted()[nextRank]) : "-"), W() / 2, 130, 14, "#9fb4e6", "center", 700);
        for (let i = 0; i < cards.length; i++) {
          const c = cards[i];
          const x = q.x0 + i * (q.cw + 8), y = q.y;
          if (c.done) ctx2d.globalAlpha = 0.3;
          if (c.shown || c.done) cardFace(x, y, q.cw, q.ch, rankOf(c.v), c.wrong ? "#c8213f" : INK, Math.min(q.cw, q.ch) * 0.4);
          else cardBack(x, y, q.cw, q.ch, "#1f3a66");
          ctx2d.globalAlpha = 1;
          if (miss === i) strokeCircle(x + q.cw / 2, y + q.ch / 2, q.cw * 0.7, "#ff5570", 3);
        }
        if (phase === "show") text("Memorise " + Math.max(0, showFor - t).toFixed(1) + "s", W() / 2, q.y + q.ch + 40, 16, "#ffe36e", "center", 800);
        fxDraw(parts);
      },
      stop() {}
    };
  }

  const ENGINES = {
    n10_pairs: gPairs,
    n10_echo: gEcho,
    n10_pyramid: gPyramid,
    n10_hilo: gHiLo,
    n10_lantern: gLantern,
    n10_shell: gShell,
    n10_vault: gVault,
    n10_ladder: gLadder
  };
  const MINIS = [
    { id: "n10_pairs", title: "Glyph Pairs", icon: "🃏", cat: "PUZZLE", desc: "Flip two glyphs at a time and find the matching pairs. The board grows every level. Six misses and the run is over.", engine: "n10_pairs", goal: 16 },
    { id: "n10_echo", title: "Echo Pads", icon: "🔴", cat: "PUZZLE", desc: "Four glowing pads play a sequence you must repeat. Each round adds one more step and the tempo quickens. One wrong pad ends it.", engine: "n10_echo", goal: 12 },
    { id: "n10_pyramid", title: "Pyramid Thirteen", icon: "👑", cat: "CARDS", desc: "Solitaire on a card pyramid. Tap two exposed cards whose ranks add to 13, or a King to clear it alone. Draw from the stock and watch for dead ends.", engine: "n10_pyramid", goal: 16 },
    { id: "n10_hilo", title: "High or Low", icon: "⬆", cat: "CARDS", desc: "Tap the left or right side to call whether the next card is lower or higher. Three strikes and you are out. Ties keep the card in play.", engine: "n10_hilo", goal: 10 },
    { id: "n10_lantern", title: "Lantern Grid", icon: "🏮", cat: "PUZZLE", desc: "Some lanterns light up for a moment. Remember them and tap the same tiles. The grid grows and the patterns get bigger.", engine: "n10_lantern", goal: 10 },
    { id: "n10_shell", title: "Shell Game", icon: "🥜", cat: "PUZZLE", desc: "Watch the ball go under a cup, then track it through the shuffle. More cups and faster swaps as you go. Three wrong guesses lose the run.", engine: "n10_shell", goal: 12 },
    { id: "n10_vault", title: "Number Vault", icon: "🔢", cat: "PUZZLE", desc: "A row of digits flashes once. Memorise them, then key in their total before the next round. Three wrong totals and you lose.", engine: "n10_vault", goal: 10 },
    { id: "n10_ladder", title: "Rank Ladder", icon: "\uD83E\uDA9C", cat: "CARDS", desc: "Cards flash their ranks face up, then flip down. Tap them back from lowest to highest. Every wrong tap costs a life.", engine: "n10_ladder", goal: 8 }
  ];
  return { engines: ENGINES, minis: MINIS, aaa: [] };
})();
