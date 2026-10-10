window.__AG_fix_08 = (function () {
  /* Overrides for: numberorder (rounds, lives, timer, hidden numbers) and nightswarm (XP, upgrades, elites, homing shots). */
  const shuf = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t } return a };
  const floatAdd = (list, x, y, s, c) => list.push({ s, x, y, c, life: 1 });
  function floatsUpdate(list, dt) {
    for (const f of list) { f.y -= 26 * dt; f.life -= dt * 1.2 }
    for (let i = list.length - 1; i >= 0; i--) if (list[i].life <= 0) list.splice(i, 1);
  }
  function floatsDraw(list) {
    for (const f of list) { ctx2d.globalAlpha = Math.max(0, Math.min(1, f.life)); text(f.s, f.x, f.y, 15, f.c, 'center', 800) }
    ctx2d.globalAlpha = 1;
  }

  function numberOrder(g) {
    const ROUNDS = g.goal || 12;
    let round = 1, lives = 3, n = 0, cols = 3, rows = 3, nums = [], next = 1, cx = 0, cy = 0, cd = 0;
    let lim = 10, tl = 10, peek = 0, hidden = false, over = false, badI = -1, badT = 0, shake = 0, t = 0;
    const parts = [], floats = [];

    function setup() {
      n = Math.min(16, 4 + round);
      cols = n <= 6 ? 3 : 4;
      rows = Math.ceil(n / cols);
      nums = shuf(Array.from({ length: n }, (_, i) => i + 1));
      next = 1; cx = 0; cy = 0;
      lim = Math.max(8, 16 - round * 0.6); tl = lim;
      hidden = round >= 5; peek = hidden ? 2.5 : 0;
    }
    function layout() {
      const avail = H() - 310, s = Math.min(78, (W() - 40) / cols, avail / rows);
      return { s, ox: (W() - s * cols) / 2, oy: 172 + Math.max(0, (avail - s * rows) / 2) };
    }
    function move(dx, dy) {
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || nx >= cols || ny < 0 || ny * cols + nx >= n) return;
      cx = nx; cy = ny;
    }
    function wrong(i, why) {
      lives--; shake = 0.3; badI = i; badT = 0.4;
      beep(160, 80, 0.25, 'sawtooth', 0.12);
      if (lives <= 0) { over = true; miniFail(g, why + " Out of lives at round " + round + "/" + ROUNDS) }
    }
    function tap(i) {
      const v = nums[i];
      if (v < next) return; // already done, no penalty
      if (v !== next) { wrong(i, "Wrong number."); return }
      const L = layout(), px = L.ox + (i % cols) * L.s + L.s / 2, py = L.oy + Math.floor(i / cols) * L.s + L.s / 2;
      next++;
      beep(520 + next * 25, 700 + next * 25, 0.08, 'triangle', 0.1);
      fxBurst(parts, px, py, C.green, 12, 150);
      if (next > n) {
        round++;
        if (round > ROUNDS) { over = true; completeMini(); return }
        floatAdd(floats, W() / 2, L.oy - 14, 'ROUND CLEAR', C.gold);
        setup();
      }
    }

    return {
      update(dt) {
        if (over) return;
        t += dt; shake = Math.max(0, shake - dt); badT = Math.max(0, badT - dt);
        if (peek > 0) peek -= dt;
        tl -= dt;
        if (tl <= 0) { wrong(-1, "Time's up."); if (!over) setup(); return }
        cd -= dt;
        const ax = AX(), ay = AY();
        if (cd <= 0) {
          if (Math.abs(ax) > 0.5) { move(Math.sign(ax), 0); cd = 0.16 }
          else if (Math.abs(ay) > 0.5) { move(0, Math.sign(ay)); cd = 0.16 }
        }
        if (pressed('a')) tap(cy * cols + cx);
        if (over) return;
        fxUpdate(parts, dt, 0); floatsUpdate(floats, dt);
        hud('Rounds ' + (round - 1) + '/' + ROUNDS + ' • Find ' + next + ' • ' + '♥'.repeat(Math.max(0, lives)) + ' • ' + Math.ceil(tl) + 's');
      },
      draw() {
        const w = W(), h = H(), L = layout();
        const bg = ctx2d.createRadialGradient(w / 2, h * 0.45, 40, w / 2, h * 0.45, Math.max(w, h) * 0.7);
        bg.addColorStop(0, '#1d1640'); bg.addColorStop(1, '#07070f');
        ctx2d.fillStyle = bg; ctx2d.fillRect(0, 0, w, h);
        ctx2d.save();
        if (shake > 0) ctx2d.translate((Math.random() * 2 - 1) * shake * 20, (Math.random() * 2 - 1) * shake * 20);
        text('ROUND ' + round + ' / ' + ROUNDS, w / 2, 112, 22, C.gold, 'center', 800);
        text('♥'.repeat(Math.max(0, lives)), w / 2, 136, 15, C.pink, 'center', 800);
        rect(40, 146, w - 80, 6, 'rgba(255,255,255,.12)', 3);
        rect(40, 146, (w - 80) * Math.max(0, Math.min(1, tl / lim)), 6, tl < 3 ? C.red : C.cyan, 3);
        for (let i = 0; i < n; i++) {
          const X = L.ox + (i % cols) * L.s, Y = L.oy + Math.floor(i / cols) * L.s, s = L.s;
          const v = nums[i], done = v < next, seeNum = !hidden || peek > 0 || done;
          rect(X + 4, Y + 4, s - 8, s - 8, done ? 'rgba(85,255,154,.14)' : 'rgba(255,255,255,.07)', 14);
          if (i === badI && badT > 0) rect(X + 4, Y + 4, s - 8, s - 8, 'rgba(255,85,112,.45)', 14);
          if (seeNum) text(v, X + s / 2, Y + s * 0.64, s * 0.4, done ? C.green : C.white, 'center', 800);
          else text('?', X + s / 2, Y + s * 0.64, s * 0.4, 'rgba(255,255,255,.35)', 'center', 800);
        }
        const gx = L.ox + (cx + 0.5) * L.s, gy = L.oy + (cy + 0.5) * L.s;
        strokeCircle(gx, gy, L.s * 0.42, C.gold, 3);
        if (peek > 0) text('Memorize!', w / 2, L.oy + rows * L.s + 30, 16, C.cyan, 'center', 700);
        fxDraw(parts);
        floatsDraw(floats);
        ctx2d.restore();
      },
      stop() {}
    };
  }

  function nightSwarm(g) {
    const P = { x: W() / 2, y: H() / 2, hp: 100, max: 100, fire: 0.42, multi: 1, pierce: 0, dmg: 10 };
    let en = [], orbs = [], shots = [], parts = [], floats = [];
    let kills = 0, xp = 0, lvl = 1, spawn = 0, fireT = 0.5, shake = 0, hurt = 0, over = false, t = 0;
    const need = () => 4 + lvl * 3;
    const UP = {
      volley: () => { P.multi = Math.min(5, P.multi + 1); return 'VOLLEY x' + P.multi },
      rapid: () => { P.fire = Math.max(0.12, P.fire * 0.8); return 'RAPID FIRE' },
      pierce: () => { P.pierce = Math.min(3, P.pierce + 1); return 'PIERCING' },
      heavy: () => { P.dmg += 5; return 'HEAVY SHOT' },
      armor: () => { P.max += 20; P.hp = Math.min(P.max, P.hp + 30); return 'IRON HEART' }
    };
    const UPK = Object.keys(UP);
    const dd = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);

    function spawnWave() {
      const R = Math.max(W(), H()) * 0.62, cx = W() / 2, cy = H() / 2;
      const count = 1 + Math.floor(lvl / 3);
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2, elite = lvl >= 3 && Math.random() < 0.1;
        const hp = elite ? 50 + lvl * 6 : 10 + lvl * 3;
        en.push({ x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R, hp, max: hp, elite, r: elite ? 17 : 9,
          sp: elite ? 34 : 56 + lvl * 2, ph: Math.random() * 6.28, flash: 0, dead: false });
      }
    }
    function fire() {
      const near = en.filter(e => !e.dead).sort((a, b) => dd(P.x, P.y, a.x, a.y) - dd(P.x, P.y, b.x, b.y)).slice(0, P.multi);
      for (const e of near) shots.push({ x: P.x, y: P.y, vx: 0, vy: 0, e, pierce: P.pierce, seen: [], life: 1.6 });
    }
    function kill(e) {
      e.dead = true; kills++;
      orbs.push({ x: e.x, y: e.y, heal: false, life: 12 });
      if (Math.random() < 0.06) orbs.push({ x: e.x + 8, y: e.y, heal: true, life: 12 });
      fxBurst(parts, e.x, e.y, e.elite ? C.orange : C.red, e.elite ? 26 : 12, e.elite ? 220 : 150);
      shake = Math.max(shake, e.elite ? 0.25 : 0.06);
      beep(300, 90, 0.08, 'sawtooth', 0.06);
      if (kills >= g.goal && !over) { over = true; completeMini() }
    }
    function stepShots(dt) {
      for (let i = shots.length - 1; i >= 0; i--) {
        const s = shots[i];
        s.life -= dt;
        if (s.e && s.e.dead) s.e = null;
        if (s.e) { const dx = s.e.x - s.x, dy = s.e.y - s.y, d = Math.hypot(dx, dy) || 1; s.vx = dx / d * 620; s.vy = dy / d * 620 }
        s.x += s.vx * dt; s.y += s.vy * dt;
        let gone = s.life <= 0;
        for (const e of en) {
          if (gone) break;
          if (e.dead || s.seen.includes(e) || dd(e.x, e.y, s.x, s.y) > e.r + 5) continue;
          s.seen.push(e);
          e.hp -= P.dmg; e.flash = 0.1;
          if (e.hp <= 0) kill(e);
          if (s.pierce > 0) { s.pierce--; s.e = null } else gone = true;
        }
        if (gone) shots.splice(i, 1);
      }
    }

    return {
      update(dt) {
        if (over) return;
        t += dt; shake = Math.max(0, shake - dt); hurt = Math.max(0, hurt - dt);
        const ax = AX(), ay = AY();
        P.x = Math.max(16, Math.min(W() - 16, P.x + ax * 240 * dt));
        P.y = Math.max(80, Math.min(H() - 120, P.y + ay * 240 * dt));
        spawn -= dt;
        if (spawn <= 0) { spawn = Math.max(0.35, 1.1 - lvl * 0.06); spawnWave() }
        fireT -= dt;
        if (fireT <= 0 && en.some(e => !e.dead)) { fireT = P.fire; fire() }
        for (const e of en) {
          if (e.dead) continue;
          e.flash = Math.max(0, e.flash - dt);
          const dx = P.x - e.x, dy = P.y - e.y, d = Math.hypot(dx, dy) || 1;
          const wob = e.elite ? 0 : Math.sin(t * 5 + e.ph) * 0.6;
          e.x += (dx / d - dy / d * wob) * e.sp * dt;
          e.y += (dy / d + dx / d * wob) * e.sp * dt;
          if (d < e.r + 12) { P.hp -= (e.elite ? 34 : 16) * dt; hurt = 0.12; shake = Math.max(shake, 0.04) }
        }
        en = en.filter(e => !e.dead);
        stepShots(dt);
        for (let i = orbs.length - 1; i >= 0; i--) {
          const o = orbs[i], d = Math.hypot(P.x - o.x, P.y - o.y) || 1;
          o.life -= dt;
          if (d < 80) { o.x += (P.x - o.x) / d * 300 * dt; o.y += (P.y - o.y) / d * 300 * dt }
          if (d < 14) {
            orbs.splice(i, 1);
            if (o.heal) { P.hp = Math.min(P.max, P.hp + 18); floatAdd(floats, P.x, P.y - 24, '+HP', C.green) }
            else if (++xp >= need()) {
              xp = 0; lvl++;
              const k = UPK[Math.floor(Math.random() * UPK.length)];
              floatAdd(floats, P.x, P.y - 30, 'LV ' + lvl + ' ' + UP[k](), C.gold);
              beep(440, 880, 0.2, 'triangle', 0.12);
            }
          } else if (o.life <= 0) orbs.splice(i, 1);
        }
        if (P.hp <= 0 && !over) {
          over = true; toast('Overrun!');
          setTimeout(() => miniFail(g, 'Overrun at ' + kills + '/' + g.goal + ' kills'), 600);
          return;
        }
        fxUpdate(parts, dt, 0); floatsUpdate(floats, dt);
        hud('Kills ' + kills + '/' + g.goal + ' • Lv ' + lvl + ' • HP ' + Math.ceil(Math.max(0, P.hp)));
      },
      draw() {
        const w = W(), h = H();
        const bg = ctx2d.createRadialGradient(P.x, P.y, 20, w / 2, h / 2, Math.max(w, h) * 0.8);
        bg.addColorStop(0, '#2a0f3d'); bg.addColorStop(1, '#06030c');
        ctx2d.fillStyle = bg; ctx2d.fillRect(0, 0, w, h);
        ctx2d.save();
        if (shake > 0) ctx2d.translate((Math.random() * 2 - 1) * shake * 24, (Math.random() * 2 - 1) * shake * 24);
        for (const o of orbs) {
          ctx2d.shadowColor = o.heal ? C.pink : C.green; ctx2d.shadowBlur = 10;
          circle(o.x, o.y, (o.heal ? 6 : 4) + Math.sin(t * 6 + o.x) * 1.2, o.heal ? C.pink : C.green);
        }
        for (const e of en) {
          const body = e.flash > 0 ? '#ffffff' : e.elite ? '#ff8a3d' : '#b02a5b';
          const flap = Math.sin(t * 14 + e.ph) * (e.elite ? 2 : 6);
          ctx2d.shadowColor = e.elite ? C.orange : C.red; ctx2d.shadowBlur = e.elite ? 18 : 10;
          ctx2d.fillStyle = body;
          ctx2d.beginPath(); ctx2d.ellipse(e.x - e.r * 1.2, e.y, e.r * 0.9, Math.abs(flap) * 0.5 + 3, 0, 0, Math.PI * 2); ctx2d.fill();
          ctx2d.beginPath(); ctx2d.ellipse(e.x + e.r * 1.2, e.y, e.r * 0.9, Math.abs(flap) * 0.5 + 3, 0, 0, Math.PI * 2); ctx2d.fill();
          circle(e.x, e.y, e.r, body);
          circle(e.x - e.r * 0.35, e.y - e.r * 0.2, 2, C.yellow);
          circle(e.x + e.r * 0.35, e.y - e.r * 0.2, 2, C.yellow);
          if (e.elite) {
            ctx2d.shadowBlur = 0;
            rect(e.x - 16, e.y - e.r - 8, 32, 3, 'rgba(255,255,255,.2)', 1);
            rect(e.x - 16, e.y - e.r - 8, 32 * Math.max(0, e.hp / e.max), 3, C.orange, 1);
          }
        }
        ctx2d.shadowColor = C.gold; ctx2d.shadowBlur = 12;
        for (const s of shots) { line(s.x - s.vx * 0.04, s.y - s.vy * 0.04, s.x, s.y, C.gold, 3); circle(s.x, s.y, 3, '#fff8d0') }
        ctx2d.shadowColor = hurt > 0 ? C.red : C.cyan; ctx2d.shadowBlur = 20;
        strokeCircle(P.x, P.y, 18 + Math.sin(t * 4) * 2, 'rgba(85,230,255,.35)', 3);
        circle(P.x, P.y, 10, hurt > 0 ? C.red : C.cyan);
        ctx2d.shadowBlur = 0;
        fxDraw(parts);
        floatsDraw(floats);
        ctx2d.restore();
        rect(60, 84, w - 120, 6, 'rgba(255,255,255,.12)', 3);
        rect(60, 84, (w - 120) * Math.max(0, P.hp / P.max), 6, P.hp < 35 ? C.red : C.green, 3);
        rect(60, 94, (w - 120) * Math.min(1, xp / need()), 4, C.gold, 2);
      },
      stop() {}
    };
  }

  return {
    engines: { numberorder: numberOrder, nightswarm: nightSwarm },
    minis: [
      { id: "numberorder", title: "Number Order", icon: "1️⃣", cat: "PUZZLE", engine: "numberorder", goal: 12,
        desc: "Move the cursor and press A to tap the numbers in order. 12 rounds, 3 lives, a timer on each round. From round 5 the numbers hide after a short peek." },
      { id: "nightswarm", title: "Night Swarm", icon: "🧛", cat: "ACTION", engine: "nightswarm", goal: 40,
        desc: "Bats pour in from the dark. Your hero fires on its own: collect XP and level up for volleys, rapid fire, piercing shots and armor. Elite ghouls appear later. Get 40 kills." }
    ]
  };
})();
