window.__AG_fix_03 = (function () {
  /* Farm: a 6x4 field. Seeds buy crops, water is needed for growth, rain refills the tank,
     pests eat neglected crops. Joystick moves the cursor, A plants/harvests, B waters 3x3, C sprays. */
  const COLS = 6, ROWS = 4, X0 = 20, Y0 = 120;

  function gameFarm2(g) {
    const CW = (W() - 40) / COLS, CH = Math.min(100, (H() - 250) / ROWS);
    const grid = [];
    for (let r = 0; r < ROWS; r++) { grid.push([]); for (let c = 0; c < COLS; c++) grid[r].push(null); }
    let coins = 8, water = 30, harvest = 0, rain = 0, rainT = rand(5, 8), cur = { c: 0, r: 0 }, cd = 0, shake = 0, over = false, t = 0;
    const parts = [];
    const drops = [];
    for (let i = 0; i < 36; i++) drops.push({ x: rand(0, W()), y: rand(0, H()), v: rand(300, 480) });

    const cellXY = (c, r) => ({ x: X0 + c * CW + CW / 2, y: Y0 + r * CH + CH / 2 });
    const anyCrop = () => grid.some(row => row.some(k => k));

    function plant(c, r) {
      if (coins < 2) { toast("No seeds left"); return false; }
      coins -= 2; grid[r][c] = { age: 0, wet: 0, pest: false, pT: rand(5, 9), pestT: 0 };
      beep(440, 520, .05, "triangle", .05); return true;
    }
    function reap(c, r) {
      const p = cellXY(c, r); grid[r][c] = null; harvest++; coins += 6;
      fxBurst(parts, p.x, p.y, C.gold, 14, 140); beep(660, 880, .08, "square", .06); toast("Harvested +6 seeds");
    }
    function spray(c, r) {
      const k = grid[r][c]; if (!k || !k.pest) return false;
      k.pest = false; k.pT = rand(6, 9); const p = cellXY(c, r);
      fxBurst(parts, p.x, p.y, C.lime, 10, 110); beep(900, 700, .05, "sine", .05); return true;
    }
    function water3(c, r) {
      if (water < 3) { toast("Tank empty, wait for rain"); return false; }
      water -= 3; let n = 0;
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        const rr = r + dr, cc = c + dc;
        if (rr < 0 || cc < 0 || rr >= ROWS || cc >= COLS || !grid[rr][cc]) continue;
        grid[rr][cc].wet = 10; n++;
        const p = cellXY(cc, rr); fxBurst(parts, p.x, p.y, C.cyan, 4, 60);
      }
      if (!n) toast("Nothing to water there");
      return true;
    }
    function smart(c, r) {
      const k = grid[r][c];
      if (!k) plant(c, r);
      else if (k.pest) spray(c, r);
      else if (k.age >= 1) reap(c, r);
      else water3(c, r);
    }

    return {
      update(dt) {
        if (over) return;
        dt = Math.min(dt, .05); t += dt; cd -= dt; shake = Math.max(0, shake - dt);
        const dx = AX() > .5 ? 1 : AX() < -.5 ? -1 : 0, dy = AY() > .5 ? 1 : AY() < -.5 ? -1 : 0;
        if (cd <= 0 && (dx || dy)) { cur.c = clamp(cur.c + dx, 0, COLS - 1); cur.r = clamp(cur.r + dy, 0, ROWS - 1); cd = .16; }
        if (pressed("a")) smart(cur.c, cur.r);
        if (pressed("b")) water3(cur.c, cur.r);
        if (pressed("c")) spray(cur.c, cur.r);

        rainT -= dt;
        if (rainT <= 0) { rain = rain ? 0 : 1; rainT = rain ? rand(6, 9) : rand(8, 12); toast(rain ? "Rain is falling" : "Sunny again"); }
        water = clamp(water + (rain ? 5 : -.4) * dt, 0, 40);

        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
          const k = grid[r][c]; if (!k) continue;
          if (k.wet > 0) k.wet -= dt;
          if (k.age < 1 && !k.pest && (k.wet > 0 || rain)) k.age = Math.min(1, k.age + dt / 9);
          if (!k.pest && k.age < 1) { k.pT -= dt; if (k.pT <= 0) { k.pest = true; k.pestT = 4; toast("Pests on the field! Tap or press C"); } }
          else if (k.pest) {
            k.pestT -= dt;
            if (k.pestT <= 0) { const p = cellXY(c, r); grid[r][c] = null; shake = .3; fxBurst(parts, p.x, p.y, C.red, 14, 140); toast("Pests ate a crop!"); }
          }
        }
        fxUpdate(parts, dt, 60);
        drops.forEach(d => { d.y += d.v * dt * (rain ? 1 : 0); if (d.y > H()) { d.y = -10; d.x = rand(0, W()); } });

        if (harvest >= g.goal) { over = true; completeMini(); return; }
        if (coins < 2 && !anyCrop()) { over = true; toast("Out of seeds"); setTimeout(() => miniFail(g, "You ran out of seeds and crops."), 450); return; }
        hud("Harvest " + harvest + "/" + g.goal + " • Seeds " + coins + " • Water " + (water | 0) + (rain ? " • 🌧️" : ""));
      },
      pointer(x, y) {
        if (over) return;
        const c = Math.floor((x - X0) / CW), r = Math.floor((y - Y0) / CH);
        if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return;
        cur.c = c; cur.r = r; smart(c, r);
      },
      draw() {
        const sx = shake ? rand(-4, 4) : 0, sy = shake ? rand(-4, 4) : 0;
        const g2 = ctx2d.createLinearGradient(0, 0, 0, H());
        if (rain) { g2.addColorStop(0, "#1b2a3a"); g2.addColorStop(1, "#0b1a14"); }
        else { g2.addColorStop(0, "#2c6fa8"); g2.addColorStop(1, "#8fd0ff"); }
        ctx2d.fillStyle = g2; ctx2d.fillRect(0, 0, W(), H());
        ctx2d.save(); ctx2d.translate(sx, sy);
        if (!rain) circle(W() - 50, 100, 22, "rgba(255,230,120,.9)");
        rect(0, Y0 + ROWS * CH, W(), H() - (Y0 + ROWS * CH), "#2a1a0e");
        text("Tap a cell: plant, harvest or spray", W() / 2, 100, 12, "#e8f4ff", "center", 600);
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
          const x = X0 + c * CW + 3, y = Y0 + r * CH + 3, w = CW - 6, h = CH - 6;
          rect(x, y, w, h, (r + c) % 2 ? "#4a2f17" : "#5a3a1e", 10);
          const k = grid[r][c], p = cellXY(c, r);
          if (k) {
            if (k.age < .35) { circle(p.x, p.y + 6, 4 + k.age * 14, C.green); }
            else if (k.age < 1) text("🌿", p.x, p.y + 8, 26, "#fff", "center");
            else { circle(p.x, p.y, 30, "rgba(255,215,92,.25)"); text("🌽", p.x, p.y + 10, 32, "#fff", "center"); }
            if (k.wet > 0) circle(x + w - 10, y + 12, 5, C.cyan);
            if (k.pest) { text("🐛", x + 12, y + 18, 18, "#fff", "center"); strokeCircle(p.x, p.y, 34, C.red, 2); }
          }
        }
        const cp = cellXY(cur.c, cur.r);
        strokeCircle(cp.x, cp.y, Math.min(CW, CH) / 2 - 4, "rgba(255,255,255,.85)", 2.5);
        for (const d of drops) if (rain) line(d.x, d.y, d.x - 3, d.y + 10, "rgba(160,200,255,.45)", 1.5);
        fxDraw(parts);
        ctx2d.restore();
        const by = Y0 + ROWS * CH + 14;
        text("Water", 20, by + 10, 12, "#cde", "left", 700);
        rect(70, by, W() - 100, 12, "rgba(255,255,255,.12)", 6);
        rect(70, by, (W() - 100) * water / 40, 12, C.cyan, 6);
        text("A plant/harvest  B water  C spray", W() / 2, by + 40, 12, "#cde", "center", 600);
      },
      stop() {}
    };
  }

  /* Sort It: each item must go in its bin before the timer runs out. Bins grow from 3 to 4 as you score. */
  function gameSort2(g) {
    const c = g.cfg, S = fc_base(g, c);
    const BINS = [
      ["🐾", ["🐘", "🐧", "🦋", "🐢", "🦁", "🐝"]],
      ["🍔", ["🍕", "🍓", "🥕", "🍣", "🍩", "🍌"]],
      ["🚗", ["🚲", "🚀", "🚂", "⛵", "🛸", "🛴"]],
      ["🌳", ["🌲", "🌵", "🌻", "🍄", "🌴", "🌸"]]
    ];
    let ci = 0, it = "", lim = 5, lt = 5, t = 0, bins = 3;
    function mk() {
      bins = S.score >= 4 ? 4 : 3;
      ci = Math.floor(Math.random() * bins);
      it = fc_P(BINS[ci][1]);
      lim = Math.max(2.5, 5 - S.score * .2);
      lt = lim;
    }
    const binX = (b) => { const sp = Math.min(110, (W() - 40) / bins); return W() / 2 - (bins * sp) / 2 + b * sp + (sp - 10) / 2; };
    const binW = () => Math.min(100, (W() - 40) / bins - 10);
    function answer(b) {
      if (S.over) return;
      if (b === ci) { S.gain(); fxBurst(fx, W() / 2, H() * .36, BINS[ci][0] === "🐾" ? C.lime : C.cyan, 12, 130); beep(640, 880, .06, "square", .05); }
      else S.miss("Wrong bin");
      if (!S.over) mk();
    }
    const fx = [];
    mk();
    return {
      update(dt) {
        dt = Math.min(dt, .05); t += dt; lt -= dt; fxUpdate(fx, dt, 120);
        if (lt <= 0) answer(-1);
        S.hud();
      },
      pointer(x, y) {
        if (S.over) return;
        for (let b = 0; b < bins; b++) if (fc_in(x, y, binX(b), H() - 240, binW(), 90)) { answer(b); return; }
      },
      draw() {
        fc_bg(c); fc_timer(lt / lim, H() * .3 - 22);
        fc_emo(it, W() / 2, H() * .36 + Math.sin(t * 3) * 8, 110);
        for (let b = 0; b < bins; b++) fc_box(binX(b), H() - 240, binW(), 90, "rgba(255,255,255,.16)", BINS[b][0], 40, "#fff");
        fxDraw(fx);
        S.banner();
      }
    };
  }

  return {
    engines: { farm: gameFarm2, fc_sort: gameSort2 },
    minis: [
      { id: "farm", title: "Cyber Farm", icon: "🌾", cat: "SIMULATION", engine: "farm", goal: 5,
        desc: "Plant seeds, water the field, harvest ripe crops. Rain refills your tank; pests eat neglected crops." },
      { id: "fc_sort", title: "Sort It", icon: "🗂️", cat: "QUIZ", engine: "fc_sort", goal: 12, cfg: {},
        desc: "Drop each item in its bin before the timer runs out. A fourth bin joins at 4 points." }
    ],
    aaa: []
  };
})();
