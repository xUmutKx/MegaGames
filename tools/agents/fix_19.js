window.__AG_fix_19 = (function () {
  /* Overrides for four thin games: zone, wordsearch, watersort, village.
     Goals keep their meaning (orbs / words / solved flasks / points). */

  function shuf(a) { for (let i = a.length - 1; i > 0; i--) { const j = randi(0, i); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function lerpN(a, b, t) { return a + (b - a) * t; }

  /* ---------- ZONE: orbs respawn inside a shrinking safe zone, so the goal is always reachable ---------- */
  function zoneEngine(g) {
    const goal = g.goal || 15;
    const cX = () => W() / 2, cY = () => (H() - 90) / 2 + 70;
    const p = { x: W() / 2, y: H() / 2, r: 10, hp: 100 };
    const orbs = [], parts = [], stars = [];
    let t = 0, score = 0, shake = 0, over = false;
    for (let i = 0; i < 40; i++) stars.push({ x: rand(0, W()), y: rand(0, H()), s: rand(0.4, 1.4), v: rand(6, 26) });
    const zoneR = () => Math.max(120, 300 - t * 10);

    function spawnOrb() {
      const a = rand(0, 6.283), d = Math.sqrt(Math.random()) * zoneR() * 0.85;
      orbs.push({ x: cX() + Math.cos(a) * d, y: cY() + Math.sin(a) * d, ph: rand(0, 6.28) });
    }
    for (let i = 0; i < 5; i++) spawnOrb();

    return {
      update(dt) {
        if (over) return;
        t += dt;
        shake = Math.max(0, shake - dt * 6);
        stars.forEach(s => { s.y += s.v * dt; if (s.y > H()) { s.y = 0; s.x = rand(0, W()); } });
        p.x = clamp(p.x + AX() * 190 * dt, p.r, W() - p.r);
        p.y = clamp(p.y + AY() * 190 * dt, 80, H() - 135);
        const R = zoneR();
        const inside = dist(p.x, p.y, cX(), cY()) <= R - p.r;
        if (inside) p.hp = Math.min(100, p.hp + 10 * dt);
        else { p.hp -= 30 * dt; shake = Math.max(shake, 0.25); }

        for (let i = orbs.length - 1; i >= 0; i--) {
          const o = orbs[i];
          if (dist(o.x, o.y, cX(), cY()) > R - 6) { orbs.splice(i, 1); continue; }  // zone shrank over it
          if (dist(o.x, o.y, p.x, p.y) < 20) {
            orbs.splice(i, 1);
            score++;
            fxBurst(parts, o.x, o.y, C.yellow, 10, 150);
            beep(660 + score * 25, 990 + score * 25, 0.07, "sine", 0.06);
            if (score >= goal) { over = true; completeMini(); return; }
          }
        }
        while (orbs.length < 5) spawnOrb();
        fxUpdate(parts, dt, 60);

        if (p.hp <= 0) {
          over = true;
          toast("Zoned out");
          setTimeout(() => miniFail(g, "Zoned out • Orbs " + score + "/" + goal), 450);
          return;
        }
        hud("Orbs " + score + "/" + goal + " • HP " + Math.ceil(p.hp));
      },
      draw() {
        const R = zoneR(), cx = cX(), cy = cY();
        const sx = shake > 0 ? rand(-4, 4) * shake : 0, sy = shake > 0 ? rand(-4, 4) * shake : 0;
        clear("#060a16");
        ctx2d.save();
        ctx2d.translate(sx, sy);
        stars.forEach(s => circle(s.x, s.y, s.s, "rgba(200,220,255,.5)"));
        const grad = ctx2d.createRadialGradient(cx, cy, R * 0.2, cx, cy, R);
        grad.addColorStop(0, "rgba(85,230,255,.02)");
        grad.addColorStop(1, "rgba(85,230,255,.22)");
        ctx2d.fillStyle = grad;
        ctx2d.beginPath(); ctx2d.arc(cx, cy, R, 0, 6.283); ctx2d.fill();
        strokeCircle(cx, cy, R + Math.sin(t * 4) * 3, "rgba(85,230,255,.7)", 3);
        orbs.forEach(o => {
          const r = 6 + Math.sin(t * 6 + o.ph) * 1.5;
          circle(o.x, o.y, r * 2.2, "rgba(255,227,110,.18)");
          circle(o.x, o.y, r, C.yellow);
        });
        fxDraw(parts);
        circle(p.x, p.y, p.r * 2.4, "rgba(120,255,160,.18)");
        circle(p.x, p.y, p.r, C.green);
        circle(p.x, p.y, 4, "#fff");
        ctx2d.restore();
        if (!inside0(p, cX(), cY(), R)) rect(0, 0, W(), H(), "rgba(255,60,90," + (0.12 + 0.08 * Math.sin(t * 12)).toFixed(3) + ")");
        rect(20, 96, W() - 40, 8, "rgba(255,255,255,.1)", 4);
        rect(20, 96, (W() - 40) * clamp(p.hp / 100, 0, 1), 8, p.hp > 40 ? C.green : C.red, 4);
      },
      stop() {}
    };
  }
  function inside0(p, cx, cy, R) { return dist(p.x, p.y, cx, cy) <= R - p.r; }

  /* ---------- WORD SEARCH: 10x10 grid, 5 words per round, select start and end with A ---------- */
  function wordSearchEngine(g) {
    const goal = g.goal || 5;
    const N = 10;
    const POOL = ["NEON", "CYBER", "LASER", "PIXEL", "ROBOT", "ORBIT", "COMET", "PLASMA", "TURBO", "GHOST", "RADAR", "VOLT", "MOTOR", "SPARK", "NOVA", "QUARK", "DRONE", "FUSION", "GLYPH", "PRISM", "ARCADE", "GALAXY"];
    const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]];
    const HUES = [C.cyan, C.pink, C.green, C.yellow, C.orange, C.purple, C.lime, C.blue];
    let grid = [], placed = [], found = 0, sel = null, cx = 0, cy = 0, cd = 0, shake = 0, over = false, flashT = 0;
    const fx = [];

    // Places 5 words without letter clashes; regenerates the whole grid if a word cannot fit.
    function build() {
      const ws = shuf(POOL.slice()).slice(0, 5);
      for (let tries = 0; tries < 200; tries++) {
        const gr = Array.from({ length: N }, () => Array(N).fill(""));
        const pl = [];
        let ok = true;
        for (const w of ws) {
          let done = false;
          for (let a = 0; a < 200 && !done; a++) {
            const d = DIRS[randi(0, 7)], x0 = randi(0, N - 1), y0 = randi(0, N - 1);
            const x1 = x0 + d[0] * (w.length - 1), y1 = y0 + d[1] * (w.length - 1);
            if (x1 < 0 || x1 >= N || y1 < 0 || y1 >= N) continue;
            const cells = [];
            let fits = true;
            for (let i = 0; i < w.length; i++) {
              const x = x0 + d[0] * i, y = y0 + d[1] * i, ch = gr[y][x];
              if (ch && ch !== w[i]) { fits = false; break; }
              cells.push([x, y, w[i]]);
            }
            if (!fits) continue;
            cells.forEach(c => { gr[c[1]][c[0]] = c[2]; });
            pl.push({ w, cells: cells.map(c => [c[0], c[1]]), col: HUES[pl.length % HUES.length], done: false });
            done = true;
          }
          if (!done) { ok = false; break; }
        }
        if (ok) {
          for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!gr[y][x]) gr[y][x] = String.fromCharCode(65 + randi(0, 25));
          grid = gr; placed = pl; return;
        }
      }
    }
    build();

    function cellAt(x, y) {
      const s = gs(), ox = (W() - s * N) / 2, oy = 118;
      const c = Math.floor((x - ox) / s), r = Math.floor((y - oy) / s);
      return (c >= 0 && c < N && r >= 0 && r < N) ? [c, r] : null;
    }
    function gs() { return Math.min(40, (W() - 30) / N); }

    function act() {
      if (!sel) { sel = [cx, cy]; beep(520, 600, 0.05, "square", 0.05); return; }
      if (sel[0] === cx && sel[1] === cy) { sel = null; return; }
      const dx = Math.sign(cx - sel[0]), dy = Math.sign(cy - sel[1]);
      const len = Math.max(Math.abs(cx - sel[0]), Math.abs(cy - sel[1])) + 1;
      const straight = dx === 0 || dy === 0 || Math.abs(cx - sel[0]) === Math.abs(cy - sel[1]);
      if (straight) {
        let s = "";
        for (let i = 0; i < len; i++) s += grid[sel[1] + dy * i][sel[0] + dx * i];
        const hit = placed.find(p => !p.done && (p.w === s || p.w === s.split("").reverse().join("")));
        if (hit) {
          hit.done = true; found++;
          const pts = hit.cells;
          pts.forEach(c => fxBurst(fx, (W() - gs() * N) / 2 + c[0] * gs() + gs() / 2, 118 + c[1] * gs() + gs() / 2, hit.col, 8, 140));
          beep(700, 1100, 0.12, "triangle", 0.1);
          toast(hit.w + "!");
          sel = null;
          if (found >= goal) { over = true; completeMini(); return; }
          if (placed.every(p => p.done)) { build(); toast("Round clear!"); }
          return;
        }
      }
      shake = 0.35; flashT = 0.3; beep(180, 120, 0.12, "sawtooth", 0.08);
      sel = [cx, cy];
    }

    return {
      update(dt) {
        if (over) return;
        cd -= dt; shake = Math.max(0, shake - dt * 5); flashT = Math.max(0, flashT - dt);
        if (cd <= 0) {
          const dx = Math.sign(AX()), dy = Math.sign(AY());
          if (dx) { cx = clamp(cx + dx, 0, N - 1); cd = 0.13; }
          if (dy) { cy = clamp(cy + dy, 0, N - 1); cd = 0.13; }
        }
        if (pressed("a")) act();
        if (pressed("b")) sel = null;
        fxUpdate(fx, dt, 0);
        hud("Found " + found + "/" + goal + " • Find: " + placed.filter(p => !p.done).map(p => p.w).join(" "));
      },
      pointer(x, y) {
        if (over) return;
        const c = cellAt(x, y);
        if (c) { cx = c[0]; cy = c[1]; act(); }
      },
      draw() {
        const s = gs(), ox = (W() - s * N) / 2, oy = 118;
        const sx = shake > 0 ? rand(-3, 3) * shake : 0;
        clear("#0a0c16");
        ctx2d.save(); ctx2d.translate(sx, 0);
        text("Trace words in any direction • A: start / end • B: cancel", W() / 2, oy - 24, 11, "#9aa3c0", "center");
        rect(ox - 8, oy - 8, s * N + 16, s * N + 16, flashT > 0 ? "rgba(255,80,100,.12)" : "rgba(255,255,255,.04)", 14);
        placed.forEach(p => {
          if (!p.done) return;
          const a = p.cells[0], b = p.cells[p.cells.length - 1];
          ctx2d.save();
          ctx2d.globalAlpha = 0.35; ctx2d.strokeStyle = p.col; ctx2d.lineWidth = s * 0.7; ctx2d.lineCap = "round";
          ctx2d.beginPath();
          ctx2d.moveTo(ox + a[0] * s + s / 2, oy + a[1] * s + s / 2);
          ctx2d.lineTo(ox + b[0] * s + s / 2, oy + b[1] * s + s / 2);
          ctx2d.stroke(); ctx2d.restore();
        });
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
          text(grid[y][x], ox + x * s + s / 2, oy + y * s + s * 0.66, s * 0.45, "#e8ecff", "center", 700);
        }
        if (sel) strokeCircle(ox + sel[0] * s + s / 2, oy + sel[1] * s + s / 2, s * 0.42, C.gold, 3);
        strokeCircle(ox + cx * s + s / 2, oy + cy * s + s / 2, s * 0.42, "#ffffff", 2);
        fxDraw(fx);
        const ly = oy + N * s + 30;
        placed.forEach((p, i) => {
          const x = i % 2 ? W() * 0.72 : W() * 0.28, y = ly + Math.floor(i / 2) * 26;
          text(p.w, x, y, 15, p.done ? p.col : "#dfe6ff", "center", 800);
          if (p.done) line(x - 34, y - 5, x + 34, y - 5, p.col, 2);
        });
        ctx2d.restore();
      },
      stop() {}
    };
  }

  /* ---------- WATER SORT: three flask sets, growing colour count, undo, tap or joystick ---------- */
  function waterSortEngine(g) {
    const goal = g.goal || 3;
    const PAL = [C.red, C.cyan, C.yellow, C.green, C.purple, C.orange];
    const CAP = 4;
    let stage = 0, tubes = [], undoS = [], sel = -1, cx = 0, cd = 0, moves = 0, over = false, flashT = 0, shake = 0;
    const fx = [];
    const nCol = () => Math.min(PAL.length, 4 + stage);
    const nTub = () => nCol() + 2;
    const tw = () => Math.min(56, (W() - 30) / nTub());
    const ox = () => (W() - tw() * nTub()) / 2;
    const OY = 190, SLOT = 42, BODY = CAP * SLOT + 16;

    function isDone() { return tubes.every(t => !t.length || (t.length === CAP && t.every(v => v === t[0]))); }
    function init() {
      const n = nCol(), vals = [];
      do {
        vals.length = 0;
        for (let c = 0; c < n; c++) for (let i = 0; i < CAP; i++) vals.push(c);
        shuf(vals);
        tubes = [];
        for (let t = 0; t < n; t++) tubes.push(vals.slice(t * CAP, (t + 1) * CAP));
        tubes.push([], []);
      } while (isDone());
      undoS = []; sel = -1;
    }
    init();
    const top = t => tubes[t].length ? tubes[t][tubes[t].length - 1] : -1;
    function can(a, b) {
      if (a === b || !tubes[a].length || tubes[b].length >= CAP) return false;
      return !tubes[b].length || top(b) === top(a);
    }
    function pour(a, b) {
      undoS.push(tubes.map(x => x.slice()));
      if (undoS.length > 200) undoS.shift();
      const c = top(a);
      while (tubes[a].length && top(a) === c && tubes[b].length < CAP) tubes[b].push(tubes[a].pop());
      moves++;
      beep(300 + moves * 8, 420 + moves * 8, 0.06, "sine", 0.07);
      fxBurst(fx, ox() + b * tw() + tw() / 2, OY - 10, PAL[c], 8, 110);
    }
    function nextStage() {
      stage++;
      fxBurst(fx, W() / 2, OY + 100, C.gold, 30, 200);
      beep(523, 1046, 0.3, "triangle", 0.1);
      if (stage >= goal) { over = true; completeMini(); return; }
      toast("Flask set " + (stage + 1) + " • " + nCol() + " colours");
      init();
    }
    function act() {
      if (sel === -1) {
        if (tubes[cx].length) sel = cx;
        else { flashT = 0.25; }
        return;
      }
      if (sel === cx) { sel = -1; return; }
      if (can(sel, cx)) {
        pour(sel, cx); sel = -1;
        if (isDone()) nextStage();
      } else {
        flashT = 0.25; shake = 0.3;
        sel = tubes[cx].length ? cx : -1;
      }
    }

    return {
      update(dt) {
        if (over) return;
        cd -= dt; flashT = Math.max(0, flashT - dt); shake = Math.max(0, shake - dt * 5);
        if (cd <= 0) { const dx = Math.sign(AX()); if (dx) { cx = clamp(cx + dx, 0, nTub() - 1); cd = 0.14; } }
        if (pressed("a")) act();
        if (pressed("b") && undoS.length) { tubes = undoS.pop(); sel = -1; beep(240, 160, 0.1, "triangle", 0.08); }
        fxUpdate(fx, dt, 120);
        hud("Flask " + (stage + 1) + "/" + goal + " • Moves " + moves);
      },
      pointer(x, y) {
        if (over) return;
        const i = Math.floor((x - ox()) / tw());
        if (i >= 0 && i < nTub() && y > OY - 40 && y < OY + BODY + 20) { cx = i; act(); }
      },
      draw() {
        const w = tw(), o = ox(), n = nTub();
        clear("#0a0e1a");
        ctx2d.save();
        ctx2d.translate(shake > 0 ? rand(-3, 3) * shake : 0, 0);
        text("Sort each flask into one colour", W() / 2, 120, 14, "#cfd6ff", "center", 800);
        for (let t = 0; t < n; t++) {
          const x = o + t * w;
          const bad = flashT > 0 && (cx === t);
          rect(x + 4, OY, w - 8, BODY, bad ? "rgba(255,80,100,.14)" : "rgba(255,255,255,.06)", 10);
          if (sel === t) rect(x + 2, OY - 4, w - 4, BODY + 8, "rgba(255,209,92,.12)", 12);
          tubes[t].forEach((v, i) => {
            const lift = (sel === t && i === tubes[t].length - 1) ? 10 : 0;
            const y = OY + BODY - 8 - (i + 1) * SLOT - lift;
            rect(x + 8, y + 3, w - 16, SLOT - 6, PAL[v], 8);
            rect(x + 8, y + 3, w - 16, 8, "rgba(255,255,255,.35)", 6);
          });
          if (cx === t) polygon([[x + w / 2 - 7, OY - 22], [x + w / 2 + 7, OY - 22], [x + w / 2, OY - 12]], sel === t ? C.gold : C.cyan);
        }
        fxDraw(fx);
        text("Joystick: move • A: pick / pour • B: undo • or tap a flask", W() / 2, OY + BODY + 40, 11, "#9aa3c0", "center");
        ctx2d.restore();
      },
      stop() {}
    };
  }

  /* ---------- VILLAGE: farms feed people, huts add people, towers stop raids; starving ends the run ---------- */
  function villageEngine(g) {
    const goal = g.goal || 30;
    let wood = 20, food = 20, stone = 10, people = 3, day = 1, dayT = 0, score = 0;
    let raidT = rand(7, 11), starveT = 0, shake = 0, over = false, t = 0;
    let blds = [];
    const parts = [];

    function spot() {
      let best = null;
      for (let k = 0; k < 20; k++) {
        const x = rand(50, W() - 50), y = rand(170, H() - 200);
        best = { x, y };
        if (blds.every(b => dist(b.x, b.y, x, y) > 46)) break;
      }
      return best;
    }
    function add(type) { const s = spot(); blds.push({ type, x: s.x, y: s.y, age: 0 }); }
    function gain(pts) { score += pts; }

    return {
      update(dt) {
        if (over) return;
        t += dt; dayT += dt; shake = Math.max(0, shake - dt * 5);
        wood += people * 0.35 * dt;
        stone += 0.12 * dt;
        food += blds.filter(b => b.type === "farm").length * 1.2 * dt - people * 0.15 * dt;
        blds.forEach(b => { b.age += dt; });
        if (dayT > 8) { dayT = 0; day++; food -= people * 1; }
        if (pressed("a") && wood >= 10) { wood -= 10; add("hut"); people++; gain(5); beep(440, 660, 0.1, "square", 0.06); }
        if (pressed("b") && stone >= 8) { stone -= 8; add("tower"); gain(8); beep(330, 495, 0.12, "triangle", 0.07); }
        if (pressed("c") && food >= 8) { food -= 8; add("farm"); gain(6); beep(520, 780, 0.1, "sine", 0.06); }

        raidT -= dt;
        if (raidT <= 0) {
          raidT = rand(9, 14);
          const towers = blds.filter(b => b.type === "tower");
          if (towers.length) {
            toast("Raiders repelled by towers!");
            towers.forEach(b => fxBurst(parts, b.x, b.y - 20, C.cyan, 12, 130));
          } else {
            food = Math.max(0, food - 10); wood = Math.max(0, wood - 8); shake = 1;
            toast("Raiders struck the village!");
            if (blds.length) {
              const hit = pick(blds);
              blds = blds.filter(b => b !== hit);
              fxBurst(parts, hit.x, hit.y, C.red, 16, 150);
            }
          }
        }
        if (food <= 0) {
          starveT += dt;
          if (starveT > 5) { starveT = 0; people--; toast("Someone starved"); }
          if (people <= 0) {
            over = true;
            toast("The village starved");
            setTimeout(() => miniFail(g, "Starved • Score " + score + "/" + goal), 450);
            return;
          }
        } else starveT = 0;
        if (food < 0) food = 0;

        blds.forEach(b => { if (b.type === "hut" && Math.random() < dt * 0.6) parts.push({ x: b.x + 6, y: b.y - 28, vx: rand(-4, 4), vy: -22, life: 1.2, max: 1.2, r: rand(2, 4), c: "rgba(200,200,220,.6)" }); });
        fxUpdate(parts, dt, -10);
        if (score >= goal) { over = true; completeMini(); return; }
        hud("Score " + score + "/" + goal + " • Day " + day + " • W" + (wood | 0) + " F" + (food | 0) + " P" + people);
      },
      draw() {
        const tt = Math.min(1, dayT / 8);
        const r = Math.round(lerpN(7, 3, tt)), gg = Math.round(lerpN(17, 6, tt)), b = Math.round(lerpN(8, 14, tt));
        clear("rgb(" + r + "," + gg + "," + b + ")");
        const sx = shake > 0 ? rand(-3, 3) * shake : 0;
        ctx2d.save(); ctx2d.translate(sx, 0);
        const night = tt > 0.5 ? (tt - 0.5) * 2 : 0;
        if (night > 0) for (let i = 0; i < 25; i++) circle((i * 97) % W(), (i * 53) % 260 + 20, 1.2, "rgba(255,255,255," + (0.3 * night).toFixed(2) + ")");
        circle(W() - 50, 90, 16, night > 0.5 ? "#dfe6ff" : C.yellow);
        rect(0, H() - 125, W(), 125, "#0b2414");
        rect(0, H() - 125, W(), 6, "#1d4a26");
        blds.forEach(bd => {
          const k = Math.min(1, bd.age * 3);
          ctx2d.save(); ctx2d.translate(bd.x, bd.y); ctx2d.scale(k, k);
          if (bd.type === "hut") {
            rect(-16, -6, 32, 26, "#c98a4b", 3);
            polygon([[-22, -6], [0, -26], [22, -6]], C.red);
            rect(-4, 6, 8, 14, "#4a2a12", 2);
          } else if (bd.type === "tower") {
            rect(-10, -34, 20, 58, "#8a8fa6", 3);
            rect(-14, -40, 28, 8, "#aab0c8", 2);
            polygon([[0, -40], [0, -58], [14, -52]], C.pink);
          } else {
            rect(-26, -6, 52, 22, "#6d8f2e", 3);
            for (let i = -2; i <= 2; i++) line(-22 + i * 10 + 10, -4, -22 + i * 10 + 10, 14, "rgba(40,80,20,.8)", 2);
          }
          ctx2d.restore();
        });
        fxDraw(parts);
        if (raidT <= 4) text("RAID IN " + Math.ceil(raidT) + "s", W() / 2, 104, 16, C.red, "center", 800);
        if (food <= 0) text("STARVING", W() / 2, 124, 13, C.orange, "center", 800);
        text("A hut (10 wood) • B tower (8 stone) • C farm (8 food)", W() / 2, H() - 140, 11, "#9fe0b0", "center");
        ctx2d.restore();
      },
      stop() {}
    };
  }

  const engines = { zone: zoneEngine, wordsearch: wordSearchEngine, watersort: waterSortEngine, village: villageEngine };
  const minis = [
    { id: "zone", title: "Shrinking Zone", icon: "🎯", cat: "ACTION", desc: "Grab 15 glowing orbs. Stay inside the zone, which shrinks over time.", engine: "zone", goal: 15 },
    { id: "wordsearch", title: "Word Search", icon: "🔍", cat: "PUZZLE", desc: "Trace hidden words in any direction. Find 5 to win.", engine: "wordsearch", goal: 5 },
    { id: "watersort", title: "Water Sort", icon: "🧪", cat: "PUZZLE", desc: "Pour colours until every flask holds one colour. Clear 3 flask sets.", engine: "watersort", goal: 3 },
    { id: "village", title: "Pixel Village", icon: "🏡", cat: "STRATEGY", desc: "Build huts, farms and towers, feed your people and survive the raids. Reach 30 points.", engine: "village", goal: 30 }
  ];
  return { engines, minis, aaa: [] };
})();
