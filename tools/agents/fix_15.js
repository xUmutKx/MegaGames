window.__AG_fix_15 = (function () {
  // Shared helper: a level-1 coordinate key.
  const kk = (x, y) => x + "," + y;

  /* ---------------- SNAKE: apples, golden fruit, slow and phase power-ups, ghosts, combo ---------------- */
  function gameSnake(g) {
    const cell = 20, cols = Math.floor(W() / cell), rows = Math.max(12, Math.floor((H() - 220) / cell));
    const ox = Math.floor((W() - cols * cell) / 2), oy = 112;
    const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    const EMO = { slow: "🐢", phase: "💠" };
    const LIFE = { gold: 6, slow: 8, phase: 9, apple: 999 };
    const mx = Math.floor(cols / 2), my = Math.floor(rows / 2);
    let snake = [{ x: mx, y: my }, { x: mx - 1, y: my }, { x: mx - 2, y: my }];
    let dir = { x: 1, y: 0 }, want = { x: 1, y: 0 };
    let acc = 0, t = 0, gT = 0, eaten = 0, score = 0, streak = 0, comboT = 0, mult = 1;
    let slowT = 0, phaseT = 0, over = false, shake = 0, items = [], ghosts = [], fx = [], pops = [];

    const occ = (x, y) => snake.some(s => s.x === x && s.y === y) || items.some(i => i.x === x && i.y === y) || ghosts.some(q => q.x === x && q.y === y);
    function freeCell() { let x, y, n = 0; do { x = randi(0, cols - 1); y = randi(0, rows - 1); n++; } while (occ(x, y) && n < 500); return { x, y }; }
    const cx = x => ox + x * cell + cell / 2, cy = y => oy + y * cell + cell / 2;
    function pop(s, c) { pops.push({ x: W() / 2, y: oy - 26, t: 0, s, c }); }
    function spawnItem(type) { const p = freeCell(); items.push({ x: p.x, y: p.y, type, life: LIFE[type] }); }
    function ensureApple() { if (!items.some(i => i.type === "apple")) spawnItem("apple"); }
    function randomPower() { const r = Math.random(); return r < .4 ? "gold" : r < .7 ? "slow" : "phase"; }
    function spawnGhost() {
      let p, n = 0;
      do { p = freeCell(); n++; } while (dist(p.x, p.y, snake[0].x, snake[0].y) < 6 && n < 40);
      const d = pick(DIRS); ghosts.push({ x: p.x, y: p.y, dx: d[0], dy: d[1] });
    }
    function ghostCount() { return eaten < 6 ? 0 : Math.min(4, 1 + Math.floor((eaten - 6) / 6)); }
    function moveGhost(q) {
      let nx = q.x + q.dx, ny = q.y + q.dy;
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows || Math.random() < .22) {
        const opts = DIRS.filter(([dx, dy]) => { const a = q.x + dx, b = q.y + dy; return a >= 0 && b >= 0 && a < cols && b < rows; });
        const d = pick(opts); q.dx = d[0]; q.dy = d[1]; nx = q.x + q.dx; ny = q.y + q.dy;
      }
      q.x = nx; q.y = ny;
    }
    function die(msg) {
      if (over) return;
      over = true; shake = .4;
      fxBurst(fx, cx(snake[0].x), cy(snake[0].y), C.red, 26, 240);
      miniFail(g, msg);
    }
    function setWant(x, y) { if (x === -dir.x && y === -dir.y) return; want = { x, y }; }
    function step() {
      dir = want;
      let nx = snake[0].x + dir.x, ny = snake[0].y + dir.y;
      if (phaseT > 0) { nx = (nx + cols) % cols; ny = (ny + rows) % rows; }
      else if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) { die("You hit the wall."); return; }
      if (phaseT <= 0 && snake.some((s, i) => i < snake.length - 1 && s.x === nx && s.y === ny)) { die("You bit your own tail."); return; }
      snake.unshift({ x: nx, y: ny });
      const idx = items.findIndex(i => i.x === nx && i.y === ny);
      let grow = false;
      if (idx >= 0) {
        const it = items[idx]; items.splice(idx, 1);
        if (it.type === "slow") { slowT = 6; pop("SLOW", C.cyan); beep(600, 300, .25, "sine", .08); }
        else if (it.type === "phase") { phaseT = 7; pop("PHASE", C.purple); beep(400, 900, .25, "triangle", .08); }
        else {
          grow = true; eaten++;
          streak = comboT > 0 ? streak + 1 : 1; comboT = 4;
          const prev = mult; mult = Math.min(5, 1 + Math.floor(streak / 3));
          const pts = it.type === "gold" ? 3 : 1;
          score += pts * mult;
          fxBurst(fx, cx(nx), cy(ny), it.type === "gold" ? C.gold : C.red, 14, 170);
          beep(700 + mult * 80, 1000 + mult * 80, .07, "square", .07);
          if (mult > prev) pop("x" + mult + " COMBO", C.gold);
          if (eaten >= g.goal) { over = true; completeMini(); return; }
        }
      }
      if (!grow) snake.pop();
      ensureApple();
      if (Math.random() < .35 && items.filter(i => i.type !== "apple").length < 2) spawnItem(randomPower());
    }
    ensureApple();

    return {
      update(dt) {
        if (over) return;
        dt = Math.min(dt, .05); t += dt; shake = Math.max(0, shake - dt);
        fxUpdate(fx, dt, 0);
        pops.forEach(p => p.t += dt); pops = pops.filter(p => p.t < .9);
        if (key("arrowleft") || AX() < -.55) setWant(-1, 0);
        else if (key("arrowright") || AX() > .55) setWant(1, 0);
        else if (key("arrowup") || AY() < -.55) setWant(0, -1);
        else if (key("arrowdown") || AY() > .55) setWant(0, 1);
        if (comboT > 0) { comboT -= dt; if (comboT <= 0) { streak = 0; mult = 1; } }
        slowT = Math.max(0, slowT - dt); phaseT = Math.max(0, phaseT - dt);
        for (const it of items) it.life -= dt;
        items = items.filter(i => i.life > 0);
        ensureApple();
        while (ghosts.length < ghostCount()) spawnGhost();
        gT += dt;
        const gStep = Math.max(.3, .52 - eaten * .008);
        if (gT >= gStep) { gT = 0; ghosts.forEach(moveGhost); }
        if (phaseT <= 0 && ghosts.some(q => q.x === snake[0].x && q.y === snake[0].y)) { die("A ghost caught you."); return; }
        acc += dt;
        const base = Math.max(.07, .15 - eaten * .0016), stepLen = slowT > 0 ? base * 1.9 : base;
        if (acc >= stepLen) {
          acc -= stepLen; step();
          if (over) return;
          if (phaseT <= 0 && ghosts.some(q => q.x === snake[0].x && q.y === snake[0].y)) { die("A ghost caught you."); return; }
        }
        hud("Eaten " + eaten + "/" + g.goal + "  •  Score " + score + (mult > 1 ? "  •  x" + mult : "") + (slowT > 0 ? "  🐢" : "") + (phaseT > 0 ? "  💠" : ""));
      },
      swipe(dx, dy) {
        if (over) return;
        if (Math.abs(dx) > Math.abs(dy)) setWant(dx > 0 ? 1 : -1, 0); else setWant(0, dy > 0 ? 1 : -1);
      },
      draw() {
        const sh = shake > 0 ? shake * 10 : 0;
        ctx2d.save(); ctx2d.translate(sh ? rand(-sh, sh) : 0, sh ? rand(-sh, sh) : 0);
        clear("#060812");
        rect(ox - 4, oy - 4, cols * cell + 8, rows * cell + 8, phaseT > 0 ? "rgba(169,120,255,.18)" : "rgba(85,230,255,.06)", 12);
        for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) if ((x + y) % 2 === 0) rect(ox + x * cell, oy + y * cell, cell, cell, "rgba(255,255,255,.025)");
        for (const it of items) {
          const pulse = 1 + Math.sin(t * 6 + it.x) * .08, px = cx(it.x), py = cy(it.y);
          if (it.type === "apple") { circle(px, py, cell * .4 * pulse, "#ff4d6d"); circle(px - 3, py - 4, 2.5, "rgba(255,255,255,.7)"); }
          else if (it.type === "gold") { strokeCircle(px, py, cell * .6 * pulse, "rgba(255,209,92,.45)", 3); circle(px, py, cell * .4, C.gold); }
          else { strokeCircle(px, py, cell * .55 * pulse, "rgba(255,255,255,.25)", 2); text(EMO[it.type], px, py + 5, 15, "#fff", "center"); }
        }
        snake.forEach((s, i) => {
          const f = i / Math.max(1, snake.length - 1), r = cell * (.46 - .14 * f), px = cx(s.x), py = cy(s.y);
          ctx2d.globalAlpha = 1 - f * .55;
          circle(px, py, r, phaseT > 0 ? (i % 2 ? "#b38cff" : "#7b5cff") : (i === 0 ? "#7dffb0" : "#2fd17a"));
          ctx2d.globalAlpha = 1;
        });
        if (snake.length) {
          const h = snake[0], hx = cx(h.x), hy = cy(h.y);
          circle(hx + dir.x * 4 - 3, hy + dir.y * 4 - 3, 2.5, "#111"); circle(hx + dir.x * 4 + 3, hy + dir.y * 4 + 3, 2.5, "#111");
        }
        for (const q of ghosts) {
          const px = cx(q.x), py = cy(q.y), wob = Math.sin(t * 10 + q.x) * 2;
          ctx2d.globalAlpha = phaseT > 0 ? .45 : .92;
          circle(px, py - 2, cell * .42, "#e8ecff");
          rect(px - cell * .42, py - 2, cell * .84, cell * .4, "#e8ecff", 0);
          polygon([[px - cell * .42, py + cell * .38], [px - cell * .2, py + cell * .2 + wob], [px, py + cell * .38], [px + cell * .2, py + cell * .2 - wob], [px + cell * .42, py + cell * .38]], "#e8ecff");
          circle(px - 4, py - 3, 2.6, "#1a1f3a"); circle(px + 4, py - 3, 2.6, "#1a1f3a");
          ctx2d.globalAlpha = 1;
        }
        fxDraw(fx);
        for (const p of pops) { ctx2d.globalAlpha = 1 - p.t / .9; text(p.s, p.x, p.y - p.t * 40, 14, p.c, "center", 800); }
        ctx2d.globalAlpha = 1;
        text(String(score), W() / 2, oy - 14, 20, "#fff", "center", 800);
        ctx2d.restore();
      },
      stop() {}
    };
  }

  /* ---------------- SIMON: four pads, touch or keys, faster each round, tones ---------------- */
  function gameSimon(g) {
    const N = 4, HUE = ["#ff5570", "#55e6ff", "#55ff9a", "#ffe36e"], FREQ = [330, 415, 494, 622];
    const LABEL = ["▲", "◀", "▶", "▼"], R = 100, PR = 64;
    let seq = [], step = 0, phase = "show", showI = 0, st = .8, lit = -1, litT = 0, over = false, shake = 0, fx = [];
    const dur = () => Math.max(.24, .6 - seq.length * .035);
    const padXY = i => [[W() / 2, H() / 2 - R], [W() / 2 - R, H() / 2], [W() / 2 + R, H() / 2], [W() / 2, H() / 2 + R]][i];
    seq.push(randi(0, N - 1));

    function press(n) {
      if (over || phase !== "input") return;
      lit = n; litT = .2; beep(FREQ[n], FREQ[n] * 1.02, .18, "triangle", .12);
      const [px, py] = padXY(n);
      if (seq[step] === n) {
        step++;
        fxBurst(fx, px, py, HUE[n], 10, 140);
        if (step === seq.length) {
          if (seq.length >= g.goal) { over = true; completeMini(); return; }
          seq.push(randi(0, N - 1)); phase = "show"; showI = 0; st = .8; step = 0;
        }
      } else {
        over = true; shake = .45;
        fxBurst(fx, px, py, C.red, 20, 220);
        miniFail(g, "Wrong pad after " + (seq.length - 1) + " rounds.");
      }
    }

    return {
      update(dt) {
        dt = Math.min(dt, .05);
        fxUpdate(fx, dt, 0); shake = Math.max(0, shake - dt);
        if (over) return;
        if (litT > 0) { litT -= dt; if (litT <= 0 && phase === "input") lit = -1; }
        if (phase === "show") {
          st -= dt;
          if (st <= 0) {
            if (showI < seq.length) {
              lit = seq[showI]; litT = dur() * .7; st = dur(); showI++;
              beep(FREQ[lit], FREQ[lit] * 1.02, dur() * .6, "sine", .12);
            } else { phase = "input"; step = 0; lit = -1; litT = 0; }
          }
        }
        if (phase === "show" && litT <= 0) lit = -1;
        if (pressed("a")) press(0);
        else if (pressed("b")) press(1);
        else if (pressed("c")) press(2);
        else if (pressed("jump")) press(3);
        hud("Simon • round " + seq.length + "/" + g.goal);
      },
      pointer(x, y) {
        for (let i = 0; i < N; i++) { const [px, py] = padXY(i); if (dist(x, y, px, py) <= PR + 6) { press(i); return; } }
      },
      draw() {
        const sh = shake > 0 ? shake * 8 : 0;
        ctx2d.save(); ctx2d.translate(sh ? rand(-sh, sh) : 0, sh ? rand(-sh, sh) : 0);
        const gr = ctx2d.createLinearGradient(0, 0, 0, H());
        gr.addColorStop(0, "#160c2a"); gr.addColorStop(1, "#05030a");
        ctx2d.fillStyle = gr; ctx2d.fillRect(0, 0, W(), H());
        for (let i = 0; i < N; i++) {
          const [px, py] = padXY(i), on = lit === i;
          if (on) circle(px, py, PR + 18, "rgba(255,255,255,.14)");
          ctx2d.globalAlpha = on ? 1 : .3;
          circle(px, py, PR, HUE[i]);
          ctx2d.globalAlpha = 1;
          if (on) circle(px, py, PR * .5, "rgba(255,255,255,.75)");
          strokeCircle(px, py, PR, "rgba(255,255,255,.25)", 3);
          text(LABEL[i], px, py + 7, 18, "rgba(0,0,0,.45)", "center", 800);
        }
        text("ROUND " + seq.length + "/" + g.goal, W() / 2, H() / 2 + 6, 16, "#fff", "center", 800);
        text(phase === "show" ? "WATCH" : "YOUR TURN", W() / 2, H() / 2 + 26, 11, phase === "show" ? "#aaa" : C.green, "center", 700);
        for (let i = 0; i < seq.length; i++) circle(W() / 2 - (seq.length - 1) * 7 + i * 14, H() - 150, 4, i < step && phase === "input" ? C.green : "rgba(255,255,255,.3)");
        fxDraw(fx);
        ctx2d.restore();
      },
      stop() {}
    };
  }

  /* ---------------- SOKOBAN: five levels, undo, swipe or stick to push ---------------- */
  function gameSokoban(g) {
    const LV = [
      ["#######", "#     #", "# $.@ #", "#     #", "#######"],
      ["#########", "#       #", "# $ . $ #", "#   @   #", "# . $ . #", "#       #", "#########"],
      ["#########", "#   .   #", "# $ $ $ #", "#   @   #", "# .   . #", "#########"],
      ["#######", "#  .  #", "# $ $ #", "#.  @ #", "#  $  #", "#  .  #", "#######"],
      ["########", "#  .   #", "# $$ . #", "#  @   #", "# $$ . #", "#  .   #", "########"]
    ];
    let li = 0, boxes = [], tg = new Set(), px = 0, py = 0, moves = 0, undo = [], cd = 0, over = false, fx = [];
    const wall = (x, y) => { const r = LV[li][y]; return r === undefined || r[x] === undefined || r[x] === "#"; };
    function load() {
      const rows = LV[li]; boxes = []; tg = new Set(); undo = []; moves = 0;
      rows.forEach((r, y) => [...r].forEach((c, x) => {
        if (c === "." || c === "*" || c === "+") tg.add(kk(x, y));
        if (c === "$" || c === "*") boxes.push({ x, y });
        if (c === "@" || c === "+") { px = x; py = y; }
      }));
    }
    load();
    const solved = () => boxes.every(b => tg.has(kk(b.x, b.y)));
    function move(dx, dy) {
      if (over) return false;
      const nx = px + dx, ny = py + dy;
      if (wall(nx, ny)) return false;
      const bi = boxes.findIndex(b => b.x === nx && b.y === ny);
      let bx = 0, by = 0;
      if (bi >= 0) {
        bx = nx + dx; by = ny + dy;
        if (wall(bx, by) || boxes.some(b => b.x === bx && b.y === by)) return false;
      }
      undo.push({ px, py, boxes: boxes.map(b => ({ x: b.x, y: b.y })), moves });
      if (bi >= 0) { boxes[bi] = { x: bx, y: by }; beep(320, 240, .06, "square", .05); }
      px = nx; py = ny; moves++;
      if (solved()) {
        if (li + 1 >= LV.length) { over = true; completeMini(); }
        else { li++; toast("Level cleared!"); beep(520, 880, .25, "triangle", .1); load(); }
      }
      return true;
    }
    function undoMove() { const s = undo.pop(); if (!s) return; px = s.px; py = s.py; boxes = s.boxes; moves = s.moves; }

    return {
      update(dt) {
        if (over) return;
        dt = Math.min(dt, .05); cd -= dt; fxUpdate(fx, dt, 0);
        if (cd <= 0) {
          const ax = AX(), ay = AY();
          if (Math.abs(ax) >= .4 && Math.abs(ax) >= Math.abs(ay)) { move(Math.sign(ax), 0); cd = .14; }
          else if (Math.abs(ay) >= .4) { move(0, Math.sign(ay)); cd = .14; }
        }
        if (pressed("b")) undoMove();
        if (pressed("c")) load();
        hud("Level " + (li + 1) + "/" + LV.length + "  •  moves " + moves);
      },
      swipe(dx, dy) {
        if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 1 : -1, 0); else move(0, dy > 0 ? 1 : -1);
      },
      draw() {
        const rows = LV[li], lh = rows.length, lw = Math.max(...rows.map(r => r.length));
        clear("#0b0f14");
        const s = Math.min(54, (W() - 40) / lw, (H() - 240) / lh);
        const ox = (W() - lw * s) / 2, oy = 110 + Math.max(0, (H() - 240 - lh * s) / 2);
        for (let y = 0; y < lh; y++) for (let x = 0; x < lw; x++) {
          const X = ox + x * s, Y = oy + y * s;
          if (wall(x, y)) {
            rect(X + 1, Y + 1, s - 2, s - 2, "#2b3445", 6);
            line(X + 3, Y + s / 2, X + s - 3, Y + s / 2, "rgba(255,255,255,.07)", 2);
          } else {
            rect(X, Y, s, s, (x + y) % 2 ? "#151b24" : "#11161e", 4);
            if (tg.has(kk(x, y))) { strokeCircle(X + s / 2, Y + s / 2, s * .2, "rgba(255,209,92,.9)", 3); }
          }
        }
        for (const b of boxes) {
          const X = ox + b.x * s, Y = oy + b.y * s, on = tg.has(kk(b.x, b.y));
          rect(X + 5, Y + 5, s - 10, s - 10, on ? C.gold : "#c98a3c", 6);
          line(X + 8, Y + 8, X + s - 8, Y + s - 8, "rgba(0,0,0,.2)", 2);
          line(X + s - 8, Y + 8, X + 8, Y + s - 8, "rgba(0,0,0,.2)", 2);
        }
        const PX = ox + px * s + s / 2, PY = oy + py * s + s / 2;
        circle(PX, PY, s * .32, C.cyan);
        circle(PX - s * .1, PY - s * .08, s * .05, "#111"); circle(PX + s * .1, PY - s * .08, s * .05, "#111");
        fxDraw(fx);
        text("Undo: B   Restart: C   Swipe or stick to push", W() / 2, H() - 150, 11, "#8a94a6", "center");
      },
      stop() {}
    };
  }

  return {
    engines: { snake: gameSnake, simon: gameSimon, sokoban: gameSokoban },
    minis: [
      { id: "snake", title: "Cyber Snake", icon: "🐍", cat: "ARCADE", desc: "Eat 30 fruit. Golden fruit scores more, power-ups slow time or phase through walls, and ghosts appear as you grow.", engine: "snake", goal: 30 },
      { id: "simon", title: "Simon Says", icon: "🎛️", cat: "PUZZLE", desc: "Watch the pad lights, then repeat the growing sequence. Each round is faster.", engine: "simon", goal: 6 },
      { id: "sokoban", title: "Sokoban", icon: "📦", cat: "PUZZLE", desc: "Push every crate onto a target across five levels. Undo any move.", engine: "sokoban", goal: 1 }
    ]
  };
})();
