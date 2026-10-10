window.__AG_fix_18 = (function () {
  /* Traffic Control, Tiny RTS and Stock Trader reworked.
     Traffic: a four-way junction, A switches the lights (yellow first), buses take more road,
     ambulances must not wait, crossing cars that meet in the box crash, queues trigger a switch.
     RTS: A/B recruit soldiers and archers, C builds gold mines, units seek the nearest enemy.
     Stock: prices tick with news shocks, A buys, B sells, C sells everything. */

  const BOX = 50;                 // half size of the junction box
  const LANE = 12;                // lane offset from the road centre line
  const JTOP = 80;                // top of the playfield (below the HUD bar)
  const CAR_COLS = ["#ff914d", "#55e6ff", "#a978ff", "#55ff9a", "#ff4fd8", "#4da3ff"];
  // dir 0 = south-bound, 1 = north-bound, 2 = east-bound, 3 = west-bound; axis 0 = vertical road
  const DIR = [{ axis: 0, a: Math.PI / 2 }, { axis: 0, a: -Math.PI / 2 }, { axis: 1, a: 0 }, { axis: 1, a: Math.PI }];
  const jBot = () => H() - 120;
  const jCX = () => W() / 2;
  const jCY = () => (JTOP + jBot()) / 2;
  const roadLen = d => (DIR[d].axis === 0 ? jBot() - JTOP : W());
  const stopAt = c => roadLen(c.d) / 2 - BOX - 8 - c.len / 2;   // centre position where a car must halt

  function laneXY(c) {
    if (c.d === 0) return { x: jCX() - LANE, y: JTOP + c.p, a: DIR[0].a };
    if (c.d === 1) return { x: jCX() + LANE, y: jBot() - c.p, a: DIR[1].a };
    if (c.d === 2) return { x: c.p, y: jCY() + LANE, a: DIR[2].a };
    return { x: W() - c.p, y: jCY() - LANE, a: DIR[3].a };
  }

  function gameTraffic(g) {
    let ph = 0, yel = 0, nextPh = 1, green = 0, cars = [], parts = [];
    let spawnT = 1, passed = 0, crashes = 0, shake = 0, over = false, t = 0;

    const light = axis => (axis !== ph ? "red" : yel > 0 ? "yellow" : "green");
    function canGo(c) {
      if (c.p > stopAt(c)) return true;                    // already past the line, committed
      const l = light(DIR[c.d].axis);
      return l === "green" || (l === "yellow" && c.p > stopAt(c) - 45);
    }
    function request() { if (yel <= 0) { yel = 0.9; nextPh = 1 - ph; } }
    function strike(msg) {
      crashes++; shake = .4; toast(msg); beep(140, 60, .3, "sawtooth", .18);
      if (crashes >= 3) { over = true; setTimeout(() => miniFail(g, "Too many crashes"), 450); }
    }

    return {
      update(dt) {
        if (over) return;
        t += dt; shake = Math.max(0, shake - dt); fxUpdate(parts, dt, 260);
        if (yel > 0) { yel -= dt; if (yel <= 0) { yel = 0; ph = nextPh; green = 0; beep(520, 780, .08, "triangle", .08); } }
        else green += dt;
        if (pressed("a")) request();
        // a queue on the red side switches the lights by itself, so a busy junction stays fair
        const waiting = cars.filter(c => DIR[c.d].axis !== ph && c.p < stopAt(c) && c.p > stopAt(c) - 150).length;
        if (yel <= 0 && green > 6 && waiting >= 3) request();

        spawnT -= dt;
        if (spawnT <= 0) {
          spawnT = rand(0.8, 1.5) * Math.max(.55, 1 - t / 240);
          const d = randi(0, 3), r = Math.random();
          const type = r < .12 ? "bus" : r < .2 ? "amb" : "car";
          const len = type === "bus" ? 46 : 30;
          if (!cars.some(c => c.d === d && c.p < 60))
            cars.push({ d, p: len / 2 + 2, type, len, v: type === "bus" ? 60 : type === "amb" ? 125 : rand(90, 125), cur: 0, wait: 0, col: pick(CAR_COLS) });
        }

        // queue each lane front-first: a car keeps a gap to the one ahead and halts at a red
        const lanes = [[], [], [], []];
        cars.forEach(c => lanes[c.d].push(c));
        lanes.forEach(list => {
          list.sort((a, b) => b.p - a.p);
          list.forEach((c, i) => {
            const lead = list[i - 1];
            let allowed = Infinity;
            if (lead) allowed = lead.p - c.p - lead.len / 2 - c.len / 2 - 8;
            if (!canGo(c) && c.p < stopAt(c)) allowed = Math.min(allowed, stopAt(c) - c.p);
            allowed = Math.max(0, allowed);
            c.cur = Math.min(c.v, c.cur + 220 * dt);
            const step = Math.min(c.cur * dt, allowed);
            if (dt > 0 && step < c.cur * dt) c.cur = step / dt;
            c.p += step;
            if (c.type === "amb" && c.cur < 5 && !canGo(c)) {
              c.wait += dt;
              if (c.wait > 6) { c.wait = -99; strike("Ambulance held up!"); }
            }
          });
        });

        // two perpendicular cars that meet in the box crash
        for (let i = 0; i < cars.length && !over; i++) for (let j = i + 1; j < cars.length && !over; j++) {
          const a = cars[i], b = cars[j];
          if (a.dead || b.dead || DIR[a.d].axis === DIR[b.d].axis) continue;
          const pa = laneXY(a), pb = laneXY(b);
          if (dist(pa.x, pa.y, pb.x, pb.y) < 22) {
            a.dead = b.dead = true;
            fxBurst(parts, (pa.x + pb.x) / 2, (pa.y + pb.y) / 2, C.orange, 26, 220);
            strike("Crash!");
          }
        }
        cars = cars.filter(c => {
          if (c.dead) return false;
          if (c.p > roadLen(c.d) + c.len) { passed++; return false; }
          return true;
        });
        if (over) return;
        if (passed >= g.goal) { over = true; completeMini(); return; }
        hud("Passed " + passed + "/" + g.goal + " • Crashes " + crashes + "/3 • " + (ph === 0 ? "N-S" : "E-W") + (yel > 0 ? " switching" : ""));
      },

      draw() {
        const sx = shake > 0 ? rand(-3, 3) * shake : 0, sy = shake > 0 ? rand(-3, 3) * shake : 0;
        clear("#0d1a12");
        const cx = jCX(), cy = jCY(), top = JTOP, bot = jBot();
        ctx2d.save(); ctx2d.translate(sx, sy);
        rect(cx - 50, top - 6, 100, bot - top + 12, "#2a2e36");
        rect(0, cy - 50, W(), 100, "#2a2e36");
        rect(cx - 50, cy - 50, 100, 100, "#353a44");
        for (let y = top + 8; y < bot; y += 26) if (Math.abs(y - cy) > 56) rect(cx - 2, y, 4, 14, "rgba(255,255,255,.35)");
        for (let x = 8; x < W(); x += 26) if (Math.abs(x - cx) > 56) rect(x, cy - 2, 14, 4, "rgba(255,255,255,.35)");
        line(cx - 50, cy - 54, cx, cy - 54, "#fff", 3);
        line(cx, cy + 54, cx + 50, cy + 54, "#fff", 3);
        line(cx - 54, cy, cx - 54, cy + 50, "#fff", 3);
        line(cx + 54, cy - 50, cx + 54, cy, "#fff", 3);

        // signal heads on each approach, coloured by the state of their axis
        [[0, cx - 64, cy - 66], [1, cx + 64, cy + 66], [2, cx - 66, cy + 64], [3, cx + 66, cy - 64]].forEach(([d, x, y]) => {
          const l = light(DIR[d].axis);
          circle(x, y, 9, "#111");
          const col = l === "green" ? C.green : l === "yellow" ? C.yellow : C.red;
          ctx2d.save(); ctx2d.shadowColor = col; ctx2d.shadowBlur = 14; circle(x, y, 5.5, col); ctx2d.restore();
        });

        cars.forEach(c => {
          const q = laneXY(c), L = c.len, hw = 8;
          const body = c.type === "amb" ? "#f2f2f2" : c.type === "bus" ? C.yellow : c.col;
          ctx2d.save(); ctx2d.translate(q.x, q.y); ctx2d.rotate(q.a);
          ctx2d.fillStyle = "rgba(0,0,0,.35)"; ctx2d.fillRect(-L / 2 + 2, -hw + 4, L, hw * 2);
          rect(-L / 2, -hw, L, hw * 2, body, 4);
          rect(-L / 2, -hw, L, hw * 2 * .35, "rgba(255,255,255,.25)", 4);
          rect(L / 2 - 13, -hw + 3, 6, hw * 2 - 6, "#9fd8ff", 2);
          if (c.type === "bus") for (let k = 0; k < 3; k++) rect(-L / 2 + 6 + k * 12, -hw + 3, 8, hw * 2 - 6, "#2a3440", 2);
          if (c.type === "amb") {
            rect(-6, -2, 12, 4, C.red); rect(-2, -6, 4, 12, C.red);
            circle(-L / 2 + 6, 0, 3.2, Math.floor(t * 8) % 2 ? C.red : C.blue);
          }
          circle(L / 2 - 1, -5, 2, "#fff5c0"); circle(L / 2 - 1, 5, 2, "#fff5c0");
          circle(-L / 2 + 1, -5, 2, C.red); circle(-L / 2 + 1, 5, 2, C.red);
          ctx2d.restore();
        });
        ctx2d.restore();
        fxDraw(parts);
        text("A: switch lights • queues switch them too", W() / 2, H() - 30, 12, "#aaa", "center");
      }
    };
  }

  /* ---------- Tiny RTS ---------- */
  const SOLDIER = { hp: 30, spd: 58, dmg: 9, rng: 26, cd: .8, sight: 170, col: C.green, r: 9 };
  const ARCHER = { hp: 16, spd: 50, dmg: 7, rng: 120, cd: 1.1, sight: 200, col: C.lime, r: 8 };
  const FOE = {
    grunt: { hp: 28, spd: 50, dmg: 8, rng: 26, cd: .9, sight: 170, col: C.red, r: 9 },
    bowman: { hp: 16, spd: 44, dmg: 6, rng: 118, cd: 1.3, sight: 200, col: C.orange, r: 8 },
    brute: { hp: 75, spd: 30, dmg: 14, rng: 28, cd: 1.2, sight: 150, col: C.purple, r: 13 }
  };
  const RTS_BASE_X = 30;
  const rtsEnemyX = () => W() - 30;
  const rtsLineY = () => (JTOP + jBot()) / 2;

  function rtsNear(list, x, y, r) {
    let best = null, bd = r;
    for (const e of list) { const d = dist(x, y, e.x, e.y); if (d < bd) { bd = d; best = e; } }
    return best;
  }

  function gameTinyRTS(g) {
    let gold = 30, mines = 0, t = 0, spawnT = 2, shake = 0, over = false, base = 100, eBase = 100;
    let units = [], foes = [], parts = [], shots = [];

    function walk(u, tx, ty, dt) {
      const d = dist(u.x, u.y, tx, ty);
      if (d < 1) return;
      const k = Math.min(u.s.spd * dt, d) / d;
      u.x += (tx - u.x) * k; u.y += (ty - u.y) * k;
    }
    function attack(u, e) {
      e.hp -= u.s.dmg;
      fxBurst(parts, e.x, e.y, u.side === "me" ? C.green : C.red, 5, 90);
      if (u.s.rng > 60) shots.push({ x1: u.x, y1: u.y, x2: e.x, y2: e.y, life: .15, col: u.s.col });
    }
    function hitBase(u) {
      const me = u.side === "me";
      if (me) eBase -= u.s.dmg * .6; else base -= u.s.dmg * .6;
      shake = .15;
      fxBurst(parts, me ? rtsEnemyX() : RTS_BASE_X, rtsLineY(), me ? C.yellow : C.red, 8, 120);
    }
    function act(u, dt, enemies) {
      const s = u.s, me = u.side === "me";
      u.cd = Math.max(0, u.cd - dt);
      const tgt = rtsNear(enemies, u.x, u.y, s.sight);
      if (tgt) {
        if (dist(u.x, u.y, tgt.x, tgt.y) > s.rng) walk(u, tgt.x, tgt.y, dt);
        else if (u.cd <= 0) { u.cd = s.cd; attack(u, tgt); }
        return;
      }
      const bx = me ? rtsEnemyX() : RTS_BASE_X;
      if (Math.abs(bx - u.x) > s.rng) walk(u, bx, u.y, dt);
      else if (u.cd <= 0) { u.cd = s.cd; hitBase(u); }
    }
    function recruit(s, cost) {
      gold -= cost; beep(500, 700, .06, "square", .05);
      units.push({ side: "me", x: RTS_BASE_X + 30, y: rtsLineY() + rand(-45, 45), s, cd: 0, hp: s.hp, max: s.hp });
    }

    return {
      update(dt) {
        if (over) return;
        t += dt; shake = Math.max(0, shake - dt); fxUpdate(parts, dt, 60);
        shots.forEach(sh => sh.life -= dt); shots = shots.filter(sh => sh.life > 0);
        gold += (5 + mines * 3) * dt;
        const mineCost = 35 + mines * 15;
        if (pressed("a") && gold >= 10) recruit(SOLDIER, 10);
        if (pressed("b") && gold >= 18) recruit(ARCHER, 18);
        if (pressed("c") && mines < 3 && gold >= mineCost) { gold -= mineCost; mines++; toast("Mine built: +3 gold/s"); beep(660, 880, .1, "triangle", .08); }

        spawnT -= dt;
        if (spawnT <= 0) {
          spawnT = Math.max(1.3, 3.2 - t * 0.02);
          const r = Math.random();
          const kind = t > 60 && r < .2 ? "brute" : t > 25 && r < .45 ? "bowman" : "grunt";
          foes.push({ side: "foe", x: rtsEnemyX() - 20, y: rtsLineY() + rand(-45, 45), s: FOE[kind], cd: 0, hp: FOE[kind].hp, max: FOE[kind].hp });
        }

        units.forEach(u => act(u, dt, foes));
        foes.forEach(u => act(u, dt, units));
        units = units.filter(u => u.hp > 0);
        foes = foes.filter(u => u.hp > 0);

        if (eBase <= 0) { over = true; toast("Enemy base razed!"); completeMini(); return; }
        if (base <= 0) { over = true; toast("Your base fell"); setTimeout(() => miniFail(g), 450); return; }
        hud("Gold " + Math.floor(gold) + " • Base " + Math.max(0, Math.ceil(base)) + " vs " + Math.max(0, Math.ceil(eBase)) + " • Mines " + mines + "/3");
      },

      draw() {
        const sx = shake > 0 ? rand(-3, 3) * shake * 2 : 0;
        clear("#0b140c");
        ctx2d.save(); ctx2d.translate(sx, 0);
        const yb = rtsLineY();
        const gr = ctx2d.createLinearGradient(0, JTOP, 0, jBot());
        gr.addColorStop(0, "#15301c"); gr.addColorStop(1, "#0a1a10");
        ctx2d.fillStyle = gr; ctx2d.fillRect(0, JTOP, W(), jBot() - JTOP);
        for (let x = 0; x < W(); x += 30) rect(x, yb - 1, 14, 2, "rgba(255,255,255,.08)");
        for (let i = 0; i < mines; i++) circle(RTS_BASE_X + 6 + i * 16, jBot() - 20, 6, C.gold);
        drawRtsBase(RTS_BASE_X, yb, base, C.cyan);
        drawRtsBase(rtsEnemyX(), yb, eBase, C.red);
        shots.forEach(sh => line(sh.x1, sh.y1, sh.x2, sh.y2, sh.col, 2));
        units.forEach(u => drawRtsUnit(u));
        foes.forEach(u => drawRtsUnit(u));
        ctx2d.restore();
        fxDraw(parts);
        text("A soldier • B archer • C mine", W() / 2, H() - 30, 12, "#aaa", "center");
      }
    };
  }

  function drawRtsBase(x, y, hp, col) {
    rect(x - 22, y - 50, 44, 100, "#2b3440", 6);
    rect(x - 14, y - 30, 28, 60, col, 4);
    line(x, y - 50, x, y - 80, "#ddd", 2);
    polygon([[x, y - 80], [x + 16, y - 74], [x, y - 68]], col);
    rect(x - 24, y - 64, 48, 5, "#000");
    rect(x - 24, y - 64, 48 * clamp(hp / 100, 0, 1), 5, col);
  }

  function drawRtsUnit(u) {
    const me = u.side === "me", r = u.s.r || 9;
    const bob = Math.sin(performance.now() / 110 + u.x) * 1.5;
    circle(u.x, u.y + r * .6, r * .9, "rgba(0,0,0,.35)");
    circle(u.x, u.y - bob, r, u.s.col);
    circle(u.x - r * .3, u.y - bob - r * .3, r * .35, "rgba(255,255,255,.5)");
    if (u.hp < u.max) {
      rect(u.x - r, u.y - r - 8, r * 2, 3, "#000");
      rect(u.x - r, u.y - r - 8, r * 2 * clamp(u.hp / u.max, 0, 1), 3, me ? C.green : C.red);
    }
  }

  /* ---------- Stock Trader ---------- */
  function gameStock(g) {
    const TICK = .4, LEN = 75;
    let price = 100, cash = 100, shares = 0, time = LEN, tick = 0, hist = [100], news = "", newsT = 0, over = false, parts = [];

    function step() {
      let move = rand(-.035, .037) + (100 - price) * .0015;   // small drift back towards 100
      if (Math.random() < .07) {
        const good = Math.random() < .5;
        move += good ? .13 : -.12;
        news = good ? "Rally! Shares jump" : "Scandal! Shares drop";
        newsT = 2.5;
        beep(good ? 520 : 260, good ? 900 : 150, .15, "triangle", .08);
      }
      price = Math.max(5, price * (1 + move));
      hist.push(price); if (hist.length > 120) hist.shift();
    }

    return {
      update(dt) {
        if (over) return;
        time -= dt; newsT -= dt; tick += dt; fxUpdate(parts, dt, 120);
        if (tick >= TICK) { tick -= TICK; step(); }
        if (pressed("a") && cash >= price) { cash -= price; shares++; beep(600, 700, .05, "square", .05); }
        if (pressed("b") && shares > 0) { cash += price; shares--; beep(480, 360, .05, "square", .05); }
        if (pressed("c") && shares > 0) { cash += shares * price; shares = 0; beep(400, 300, .1, "sawtooth", .05); }
        const net = cash + shares * price;
        if (net >= g.goal) { over = true; completeMini(); return; }
        if (time <= 0) {
          over = true; toast("Net " + Math.floor(net));
          setTimeout(() => miniFail(g, "Net " + Math.floor(net) + " of " + g.goal), 450);
          return;
        }
        hud("Net " + Math.floor(net) + "/" + g.goal + " • " + Math.ceil(time) + "s");
      },

      draw() {
        clear("#080d12");
        const x0 = 20, cy0 = 150, w = W() - 40, ch = Math.max(200, H() - 340);
        rect(0, 84, (W()) * clamp(time / LEN, 0, 1), 4, C.cyan);
        rect(x0, cy0, w, ch, "#111820", 8);
        const lo = Math.min(...hist), hi = Math.max(...hist), span = Math.max(20, hi - lo);
        const yOf = p => cy0 + ch - 10 - ((p - lo) / span) * (ch - 20);
        for (let i = 1; i < 4; i++) rect(x0, cy0 + ch * i / 4, w, 1, "rgba(255,255,255,.07)");
        const up = price >= 100, col = up ? C.green : C.red;
        const xOf = i => x0 + w * i / 120;
        const gr = ctx2d.createLinearGradient(0, cy0, 0, cy0 + ch);
        gr.addColorStop(0, up ? "rgba(85,255,154,.35)" : "rgba(255,85,112,.35)"); gr.addColorStop(1, "rgba(0,0,0,0)");
        ctx2d.beginPath();
        hist.forEach((p, i) => { if (i === 0) ctx2d.moveTo(xOf(i), yOf(p)); else ctx2d.lineTo(xOf(i), yOf(p)); });
        ctx2d.lineTo(xOf(hist.length - 1), cy0 + ch); ctx2d.lineTo(x0, cy0 + ch); ctx2d.closePath();
        ctx2d.fillStyle = gr; ctx2d.fill();
        ctx2d.save(); ctx2d.shadowColor = col; ctx2d.shadowBlur = 8;
        ctx2d.beginPath();
        hist.forEach((p, i) => { if (i === 0) ctx2d.moveTo(xOf(i), yOf(p)); else ctx2d.lineTo(xOf(i), yOf(p)); });
        ctx2d.strokeStyle = col; ctx2d.lineWidth = 2.5; ctx2d.stroke(); ctx2d.restore();
        circle(xOf(hist.length - 1), yOf(price), 4, col);

        text("$" + price.toFixed(2), W() / 2, 124, 26, col, "center", 900);
        const net = cash + shares * price;
        text("Cash $" + cash.toFixed(0) + " • Shares " + shares + " • Value $" + (shares * price).toFixed(0), W() / 2, cy0 + ch + 30, 14, "#ddd", "center");
        text("Net worth $" + net.toFixed(0), W() / 2, cy0 + ch + 54, 16, C.gold, "center", 800);
        if (newsT > 0) text(news, W() / 2, cy0 - 12, 14, price >= 100 ? C.green : C.red, "center", 800);
        text("A buy • B sell • C sell all", W() / 2, H() - 40, 12, "#888", "center");
        fxDraw(parts);
      },
      stop() {}
    };
  }

  return {
    engines: { traffic: gameTraffic, tinyrts: gameTinyRTS, stock: gameStock },
    minis: [
      { id: "traffic", title: "Traffic Control", icon: "🚦", cat: "ARCADE", desc: "Switch the lights so cars and ambulances get through without crashing.", engine: "traffic", goal: 20 },
      { id: "tinyrts", title: "Tiny RTS", icon: "🏴", cat: "ACTION", desc: "Mine gold, train soldiers and archers, raze the enemy base.", engine: "tinyrts", goal: 1 },
      { id: "stock", title: "Stock Trader", icon: "📈", cat: "ARCADE", desc: "Buy low, sell high, reach your net worth goal before time runs out.", engine: "stock", goal: 150 }
    ],
    aaa: []
  };
})();
