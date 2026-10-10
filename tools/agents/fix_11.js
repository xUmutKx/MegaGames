window.__AG_fix_11 = (function () {
  // Gravity Drop and Box Push, rewritten. Every level was checked solvable by BFS
  // (and the move par measured) before shipping. Both get a move budget, undo (B),
  // sliding animation and juice.

  // Gravity: the ball slides until it hits a wall or the green exit. Walls and exit are the only stops.
  const GRAV_LV = [
    { par: 2, m: ["#######", "#o    #", "#     #", "#    E#", "#######"] },
    { par: 4, m: ["#########", "#o  #  #", "#   #   #", "#       #", "#  # # E#", "#########"] },
    { par: 3, m: ["#######", "#     #", "#E   ##", "##    #", "# o   #", "#######"] },
    { par: 6, m: ["########", "#   #  #", "#      #", "##   # #", "#o ## E#", "#   # ##", "########"] },
    { par: 4, m: ["#######", "#o   ##", "# #E  #", "#     #", "# #   #", "#     #", "#######"] },
    { par: 8, m: ["#########", "##      #", "#     # #", "# #  #  #", "#   E   #", "#   ###o#", "#  ##  ##", "#########"] }
  ];
  // Box Push: swipe pushes one box one cell. Corner-stuck boxes can be undone with B.
  const SOK_LV = [
    { par: 1, m: ["#####", "#@$.#", "#####"] },
    { par: 9, m: ["#######", "#     #", "# $ $ #", "# . . #", "#  @  #", "#######"] },
    { par: 11, m: ["#######", "#  .  #", "# $ $ #", "#  @  #", "# . . #", "#######"] },
    { par: 14, m: ["#########", "#       #", "# $ .   #", "#   @   #", "#  .  $ #", "#       #", "#########"] },
    { par: 16, m: ["########", "#   .  #", "# $$@  #", "#   . ##", "#  $ . #", "########"] },
    { par: 13, m: ["########", "#  .   #", "#  $$ @#", "#.  $  #", "#  #.# #", "#      #", "########"] }
  ];

  function grid(rows) {
    const cols = Math.max.apply(null, rows.map(function (r) { return r.length; })), nr = rows.length, ch = [];
    for (let r = 0; r < nr; r++) for (let c = 0; c < cols; c++) ch.push(rows[r][c] || "#");
    return { cols: cols, nr: nr, ch: ch };
  }
  function geo(L) {
    const top = 118, avail = H() - top - 150;
    const cs = Math.max(20, Math.min(58, (W() - 40) / L.cols, avail / L.nr));
    return { cs: cs, ox: (W() - cs * L.cols) / 2, oy: top + Math.max(0, (avail - cs * L.nr) / 2) };
  }
  function cxy(G, c, r) { return { x: G.ox + (c + 0.5) * G.cs, y: G.oy + (r + 0.5) * G.cs }; }
  function bgFill() {
    const gr = ctx2d.createLinearGradient(0, 0, 0, H());
    gr.addColorStop(0, "#15203a"); gr.addColorStop(1, "#080b16");
    ctx2d.fillStyle = gr; ctx2d.fillRect(0, 0, W(), H());
  }
  function drawWall(x, y, s) {
    rect(x + 1, y + 1, s - 2, s - 2, "#2a3350", 6);
    rect(x + 3, y + 3, s - 6, Math.max(3, (s - 6) * 0.25), "rgba(255,255,255,.12)", 4);
  }
  function drawFloor(x, y, s) { rect(x + 2, y + 2, s - 4, s - 4, "rgba(255,255,255,.05)", 6); }
  function banner(t) {
    const w = Math.min(W() - 40, 340);
    rect((W() - w) / 2, H() / 2 - 60, w, 110, "rgba(8,10,20,.85)", 18);
    text(t, W() / 2, H() / 2 + 10, 28, "#fff", "center");
  }
  function joyLatch(st, go) {
    const ax = AX(), ay = AY();
    if (!st.latch) {
      if (Math.abs(ax) > 0.6 || Math.abs(ay) > 0.6) {
        if (Math.abs(ax) > Math.abs(ay)) go(ax > 0 ? 1 : -1, 0); else go(0, ay > 0 ? 1 : -1);
        st.latch = true;
      }
    } else if (Math.abs(ax) < 0.3 && Math.abs(ay) < 0.3) st.latch = false;
  }

  // ---------- GRAVITY DROP ----------
  function gravEngine(g) {
    const goal = g.goal || 6;
    let lv = 0, wins = 0, L, pos, moves, budget, hist, anim, state, stateT, fx = [], trail = [], shake = 0, tm = 0;
    const st = { latch: false };
    function load() {
      const d = GRAV_LV[lv % GRAV_LV.length];
      L = grid(d.m); pos = L.ch.indexOf("o"); budget = d.par + 6;
      moves = 0; hist = []; anim = null; state = "play"; trail = [];
    }
    load();
    function slide(p, dx, dy) {
      const out = [p];
      let r = Math.floor(p / L.cols), c = p % L.cols;
      for (;;) {
        const nr = r + dy, nc = c + dx;
        if (nr < 0 || nc < 0 || nr >= L.nr || nc >= L.cols || L.ch[nr * L.cols + nc] === "#") break;
        r = nr; c = nc; out.push(r * L.cols + c);
        if (L.ch[r * L.cols + c] === "E") break;
      }
      return out;
    }
    function go(dx, dy) {
      if (state !== "play" || anim) return;
      const pth = slide(pos, dx, dy);
      if (pth.length < 2) { shake = 0.1; beep(160, 120, 0.05, "square", 0.04); return; }
      hist.push({ pos: pos, moves: moves }); moves++;
      anim = { pth: pth, t: 0 };
      beep(420, 520, 0.06, "triangle", 0.05);
    }
    function finish() {
      const end = anim.pth[anim.pth.length - 1];
      pos = end; anim = null;
      const G = geo(L), p = cxy(G, end % L.cols, Math.floor(end / L.cols));
      if (L.ch[end] === "E") {
        wins++; state = "clear"; stateT = 1.4;
        fxBurst(fx, p.x, p.y, C.green, 40, 260);
        beep(700, 1000, 0.2, "sine", 0.08);
      } else {
        fxBurst(fx, p.x, p.y, C.orange, 12, 140);
        shake = 0.15; beep(200, 140, 0.08, "sawtooth", 0.05);
        if (moves > budget) { state = "fail"; miniFail(g, "Out of moves"); }
      }
    }
    return {
      update(dt) {
        tm += dt;
        shake = Math.max(0, shake - dt);
        fxUpdate(fx, dt, 260);
        for (let i = trail.length - 1; i >= 0; i--) { trail[i].life -= dt; if (trail[i].life <= 0) trail.splice(i, 1); }
        hud("Level " + Math.min(wins + 1, goal) + "/" + goal);
        if (state === "play" && !anim) {
          joyLatch(st, go);
          if (pressed("b") && hist.length) {
            const h = hist.pop(); pos = h.pos; moves = h.moves; beep(300, 240, 0.05, "triangle", 0.05);
          }
        }
        if (anim) {
          anim.t += dt * 14;
          const k = Math.floor(anim.t), f = anim.t - k;
          if (anim.t >= anim.pth.length - 1) finish();
          else {
            const a = anim.pth[k], b = anim.pth[k + 1], G = geo(L);
            const ac = a % L.cols, ar = Math.floor(a / L.cols), bc = b % L.cols, br = Math.floor(b / L.cols);
            const p = cxy(G, ac + (bc - ac) * f, ar + (br - ar) * f);
            trail.push({ x: p.x, y: p.y, life: 0.3, max: 0.3 });
          }
        }
        if (state === "clear") {
          stateT -= dt;
          if (stateT <= 0) {
            if (wins >= goal) { state = "done"; completeMini(); }
            else { lv++; load(); }
          }
        }
      },
      swipe(x, y) {
        if (Math.abs(x) > Math.abs(y)) go(x > 0 ? 1 : -1, 0); else go(0, y > 0 ? 1 : -1);
      },
      draw() {
        bgFill();
        const G = geo(L);
        ctx2d.save();
        if (shake > 0) ctx2d.translate(rand(-1, 1) * shake * 30, rand(-1, 1) * shake * 30);
        for (let i = 0; i < L.ch.length; i++) {
          const c = i % L.cols, r = Math.floor(i / L.cols), x = G.ox + c * G.cs, y = G.oy + r * G.cs, s = G.cs;
          if (L.ch[i] === "#") { drawWall(x, y, s); continue; }
          drawFloor(x, y, s);
          if (L.ch[i] === "E") {
            const p = cxy(G, c, r), pulse = 0.5 + 0.5 * Math.sin(tm * 5);
            ctx2d.globalCompositeOperation = "lighter";
            circle(p.x, p.y, s * (0.55 + 0.1 * pulse), "rgba(85,255,154," + (0.12 + 0.1 * pulse).toFixed(3) + ")");
            ctx2d.globalCompositeOperation = "source-over";
            circle(p.x, p.y, s * 0.22, C.green);
            strokeCircle(p.x, p.y, s * 0.3, "rgba(255,255,255,.6)", 2);
          }
        }
        for (const t of trail) {
          ctx2d.globalAlpha = Math.max(0, t.life / t.max);
          circle(t.x, t.y, G.cs * 0.25 * (t.life / t.max), C.orange);
        }
        ctx2d.globalAlpha = 1;
        let bc, br;
        if (anim) {
          const k = Math.min(Math.floor(anim.t), anim.pth.length - 2), f = anim.t - k;
          const a = anim.pth[k], b = anim.pth[k + 1];
          bc = (a % L.cols) + ((b % L.cols) - (a % L.cols)) * f;
          br = Math.floor(a / L.cols) + (Math.floor(b / L.cols) - Math.floor(a / L.cols)) * f;
        } else { bc = pos % L.cols; br = Math.floor(pos / L.cols); }
        const p = cxy(G, bc, br), R = G.cs * 0.32;
        ctx2d.globalCompositeOperation = "lighter";
        circle(p.x, p.y, G.cs * 0.7, "rgba(255,145,77,.22)");
        ctx2d.globalCompositeOperation = "source-over";
        const gr = ctx2d.createRadialGradient(p.x - R * 0.35, p.y - R * 0.35, R * 0.1, p.x, p.y, R);
        gr.addColorStop(0, "#ffd0a0"); gr.addColorStop(1, "#ff6a2b");
        ctx2d.fillStyle = gr; ctx2d.beginPath(); ctx2d.arc(p.x, p.y, R, 0, Math.PI * 2); ctx2d.fill();
        fxDraw(fx);
        ctx2d.restore();
        text("Moves " + moves + " / " + budget, W() / 2, G.oy - 14, 18, "#cfd8ff", "center");
        text("Swipe or joystick to slide. B undoes a move.", W() / 2, H() - 140, 14, "#8f9bc2", "center", 600);
        if (state === "clear") banner(wins >= goal ? "All clear!" : "Level cleared!");
        if (state === "fail") banner("Out of moves");
      }
    };
  }

  // ---------- BOX PUSH ----------
  function sokEngine(g) {
    const goal = g.goal || 6;
    let lv = 0, wins = 0, L, pl, bx, moves, budget, hist, state, stateT, fx = [], shake = 0, tm = 0, pv, bv;
    const st = { latch: false };
    const tg = function (i) { return L.ch[i] === "." || L.ch[i] === "+"; };
    const blocked = function (c, r) { return r < 0 || c < 0 || c >= L.cols || r >= L.nr || L.ch[r * L.cols + c] === "#"; };
    function load() {
      const d = SOK_LV[lv % SOK_LV.length];
      L = grid(d.m); pl = L.ch.indexOf("@"); budget = d.par * 2 + 10;
      bx = []; L.ch.forEach(function (v, i) { if (v === "$") bx.push(i); });
      moves = 0; hist = []; state = "play";
      pv = { c: pl % L.cols, r: Math.floor(pl / L.cols) };
      bv = bx.map(function (i) { return { c: i % L.cols, r: Math.floor(i / L.cols) }; });
    }
    load();
    function step(dx, dy) {
      if (state !== "play") return;
      const r = Math.floor(pl / L.cols) + dy, c = pl % L.cols + dx;
      if (blocked(c, r)) { shake = 0.1; beep(140, 110, 0.05, "square", 0.04); return; }
      const j = r * L.cols + c, bi = bx.indexOf(j);
      let k = -1;
      if (bi >= 0) {
        const r2 = r + dy, c2 = c + dx;
        if (blocked(c2, r2) || bx.indexOf(r2 * L.cols + c2) >= 0) { shake = 0.1; beep(140, 110, 0.05, "square", 0.04); return; }
        k = r2 * L.cols + c2;
      }
      hist.push({ pl: pl, bx: bx.slice(), moves: moves }); moves++;
      if (bi >= 0) {
        bx[bi] = k;
        const p = cxy(geo(L), k % L.cols, Math.floor(k / L.cols));
        fxBurst(fx, p.x, p.y, C.orange, 10, 120);
        beep(300, 380, 0.06, "triangle", 0.06);
      } else beep(500, 520, 0.03, "triangle", 0.03);
      pl = j;
      if (bx.every(function (b) { return tg(b); })) {
        state = "clear"; stateT = 1.3; wins++;
        beep(700, 1000, 0.2, "sine", 0.08);
      } else if (moves > budget) { state = "fail"; miniFail(g, "Out of moves"); }
    }
    function stuck(i) {
      if (tg(i)) return false;
      const c = i % L.cols, r = Math.floor(i / L.cols);
      return (blocked(c, r - 1) || blocked(c, r + 1)) && (blocked(c - 1, r) || blocked(c + 1, r));
    }
    return {
      update(dt) {
        tm += dt;
        shake = Math.max(0, shake - dt);
        fxUpdate(fx, dt, 0);
        hud("Level " + Math.min(wins + 1, goal) + "/" + goal);
        const k = Math.min(1, dt * 16);
        pv.c += (pl % L.cols - pv.c) * k; pv.r += (Math.floor(pl / L.cols) - pv.r) * k;
        bx.forEach(function (i, n) { const b = bv[n]; b.c += (i % L.cols - b.c) * k; b.r += (Math.floor(i / L.cols) - b.r) * k; });
        if (state === "play") {
          joyLatch(st, step);
          if (pressed("b") && hist.length) {
            const h = hist.pop(); pl = h.pl; bx = h.bx; moves = h.moves; beep(300, 240, 0.05, "triangle", 0.05);
          }
        }
        if (state === "clear") {
          stateT -= dt;
          if (stateT <= 0) {
            if (wins >= goal) { state = "done"; completeMini(); }
            else { lv++; load(); }
          }
        }
      },
      swipe(x, y) {
        if (Math.abs(x) > Math.abs(y)) step(x > 0 ? 1 : -1, 0); else step(0, y > 0 ? 1 : -1);
      },
      draw() {
        bgFill();
        const G = geo(L);
        ctx2d.save();
        if (shake > 0) ctx2d.translate(rand(-1, 1) * shake * 30, rand(-1, 1) * shake * 30);
        for (let i = 0; i < L.ch.length; i++) {
          const c = i % L.cols, r = Math.floor(i / L.cols), x = G.ox + c * G.cs, y = G.oy + r * G.cs, s = G.cs;
          if (L.ch[i] === "#") { drawWall(x, y, s); continue; }
          drawFloor(x, y, s);
          if (tg(i)) {
            const p = cxy(G, c, r);
            circle(p.x, p.y, s * 0.16, "rgba(85,255,154,.55)");
            strokeCircle(p.x, p.y, s * 0.26, "rgba(85,255,154,.7)", 2);
          }
        }
        bx.forEach(function (i, n) {
          const b = bv[n], p = cxy(G, b.c, b.r), on = tg(i), s = G.cs - 8;
          const bad = stuck(i);
          circle(p.x, p.y + 3, s * 0.45, "rgba(0,0,0,.35)");
          rect(p.x - s / 2, p.y - s / 2, s, s, on ? "#55e69a" : bad ? "#ff5570" : "#d9913b", 8);
          rect(p.x - s / 2 + 3, p.y - s / 2 + 3, s - 6, (s - 6) * 0.3, "rgba(255,255,255,.22)", 4);
        });
        const pp = cxy(G, pv.c, pv.r), R = G.cs * 0.3;
        const gr = ctx2d.createRadialGradient(pp.x - R * 0.3, pp.y - R * 0.3, R * 0.1, pp.x, pp.y, R);
        gr.addColorStop(0, "#d6fbff"); gr.addColorStop(1, "#2bb6d9");
        ctx2d.globalCompositeOperation = "lighter";
        circle(pp.x, pp.y, G.cs * 0.6, "rgba(85,230,255,.18)");
        ctx2d.globalCompositeOperation = "source-over";
        ctx2d.fillStyle = gr; ctx2d.beginPath(); ctx2d.arc(pp.x, pp.y, R, 0, Math.PI * 2); ctx2d.fill();
        fxDraw(fx);
        ctx2d.restore();
        text("Moves " + moves + " / " + budget, W() / 2, G.oy - 14, 18, "#cfd8ff", "center");
        const anyStuck = bx.some(function (i) { return stuck(i); });
        text(anyStuck ? "A box is stuck in a corner. Press B to undo." : "Swipe or joystick to push. B undoes a move.",
          W() / 2, H() - 140, 14, anyStuck ? "#ff8fa3" : "#8f9bc2", "center", 600);
        if (state === "clear") banner(wins >= goal ? "All clear!" : "Level cleared!");
        if (state === "fail") banner("Out of moves");
      }
    };
  }

  return {
    engines: {
      pz_gravity: gravEngine,
      pz_sokoban: sokEngine
    },
    minis: [
      { id: "pz_gravity", title: "Gravity Drop", icon: "⬇️", cat: "PUZZLE",
        desc: "Swipe to slide the ball until it hits a wall. Land it on the green exit within the move limit. B undoes a move.",
        engine: "pz_gravity", goal: 6, cfg: {} },
      { id: "pz_sokoban", title: "Box Push", icon: "📦", cat: "PUZZLE",
        desc: "Swipe to push every box onto a target. Boxes pushed into a corner are stuck, so use B to undo. Stay within the move limit.",
        engine: "pz_sokoban", goal: 6, cfg: {} }
    ]
  };
})();
