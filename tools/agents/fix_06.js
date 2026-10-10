// fix_06: richer Space Invaders, Bubble Pop and Dot Catch (original art and text).
window.__AG_fix_06 = (function () {
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pk = a => a[Math.floor(Math.random() * a.length)];
  const cl = (v, a, b) => Math.max(a, Math.min(b, v));
  const inBox = (x, y, bx, by, w, h) => x >= bx && x <= bx + w && y >= by && y <= by + h;
  const END_DELAY = 600;
  const PAL = ["#ff5570", "#ffe36e", "#55ff9a", "#4da3ff", "#a978ff"];

  // ---------- SPACE INVADERS: formation, shields, lives, UFO, waves ----------
  function invaders(g) {
    const COLS = 8, ROWS = 4, SP = 42, SHOT_CD = 0.32;
    const DANGER = () => H() - 250;
    const ROW_COL = ["#ff5ec8", "#a978ff", "#55e6ff", "#a8ff5c"];
    const S = { kills: 0, wave: 1, lives: 3, over: false, t: 0, shake: 0, iv: 0 };
    const stars = [];
    for (let i = 0; i < 45; i++) stars.push({ x: rnd(0, W()), y: rnd(0, H()), s: rnd(1, 2.4), v: rnd(12, 45) });
    let grid = [], ox = 0, oy = 0, dir = 1, mt = 0, cd = 0, px = W() / 2, tx = px;
    let shots = [], bombs = [], shields = [], ufo = null, ufoT = 8, fx = [];
    const baseX = () => (W() - (COLS - 1) * SP) / 2;
    const cellX = c => baseX() + c * SP + ox;
    const cellY = r => 130 + r * 38 + oy;
    const shipY = () => H() - 150;

    function newWave() {
      grid = [];
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) grid.push({ c, r, alive: true });
      ox = 0; oy = 0; dir = 1; mt = 0;
    }
    function newShields() {
      shields = [];
      for (let s = 0; s < 4; s++) {
        const sx = W() * (s + 0.5) / 4 - 42;
        for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) {
          if (r === 2 && c > 0 && c < 5) continue; // arch
          shields.push({ x: sx + c * 14, y: DANGER() + r * 14, hp: 2 });
        }
      }
    }
    // shortcut: shield blocks are plain boxes with 2 hp, no per-pixel damage
    function hitShield(x, y) {
      for (let i = 0; i < shields.length; i++) {
        const b = shields[i];
        if (inBox(x, y, b.x, b.y, 12, 12)) { if (--b.hp <= 0) shields.splice(i, 1); return true; }
      }
      return false;
    }
    function end(win, msg) {
      if (S.over) return;
      S.over = true;
      setTimeout(() => (win ? completeMini() : miniFail(g, msg)), END_DELAY);
    }
    function fire() { cd = SHOT_CD; shots.push({ x: px, y: shipY() - 16 }); beep(880, 660, 0.05, "square", 0.12); }
    function kill(x, y, col) {
      S.kills++;
      fxBurst(fx, x, y, col, 14, 170);
      beep(520, 240, 0.08, "square", 0.12);
      if (S.kills >= g.goal) end(true);
    }
    function drawInv(x, y, col, f) {
      ctx2d.shadowColor = col; ctx2d.shadowBlur = 8;
      rect(x - 12, y - 9, 24, 16, col, 4);
      rect(x - 16, y - 2, 6, 7 - f * 2, col, 2);
      rect(x + 10, y - 2, 6, 5 + f * 2, col, 2);
      rect(x - 7, y - 5, 4, 4, "#04060c");
      rect(x + 3, y - 5, 4, 4, "#04060c");
      ctx2d.shadowBlur = 0;
    }
    newWave(); newShields();

    return {
      pointer(x) {
        if (S.over) return;
        tx = cl(x, 26, W() - 26);
        if (cd <= 0) fire();
      },
      update(dt) {
        if (S.over) return;
        dt = Math.min(dt, 0.05);
        S.t += dt; S.shake = Math.max(0, S.shake - dt * 3); S.iv = Math.max(0, S.iv - dt);
        for (const s of stars) { s.y += s.v * dt; if (s.y > H()) { s.y = -2; s.x = rnd(0, W()); } }
        if (Math.abs(AX()) > 0.05) { px += AX() * 330 * dt; tx = px; }
        else px += (tx - px) * Math.min(1, dt * 10);
        px = cl(px, 26, W() - 26);

        cd -= dt;
        const want = pressed("a") || key(" ");
        if (want && cd <= 0) fire();

        for (const s of shots) s.y -= 480 * dt;
        shots = shots.filter(s => s.y > 96);
        for (let i = shots.length - 1; i >= 0 && !S.over; i--) {
          const s = shots[i];
          let used = hitShield(s.x, s.y);
          if (!used && ufo && Math.abs(s.x - ufo.x) < 22 && Math.abs(s.y - 92) < 14) { used = true; ufo = null; kill(s.x, 92, "#ffe36e"); }
          if (!used) for (const v of grid) {
            if (v.alive && Math.abs(s.x - cellX(v.c)) < 17 && Math.abs(s.y - cellY(v.r)) < 14) {
              v.alive = false; used = true; kill(cellX(v.c), cellY(v.r), ROW_COL[v.r]); break;
            }
          }
          if (used) shots.splice(i, 1);
        }
        if (S.over) return;

        if (!grid.some(v => v.alive)) { S.wave++; newWave(); }
        const alive = grid.filter(v => v.alive);
        mt += dt;
        const stepT = Math.max(0.12, 0.6 - S.wave * 0.05 - S.kills * 0.006);
        if (mt >= stepT && alive.length) {
          mt = 0;
          ox += dir * 8;
          let minC = COLS, maxC = -1;
          for (const v of alive) { if (v.c < minC) minC = v.c; if (v.c > maxC) maxC = v.c; }
          const L = baseX() + minC * SP + ox - 18, R = baseX() + maxC * SP + ox + 18;
          if (R > W() - 10 || L < 10) { dir = -dir; oy += 16; }
        }
        if (grid.some(v => v.alive && cellY(v.r) > DANGER())) { end(false, "Invaders landed"); return; }

        ufoT -= dt;
        if (!ufo && ufoT <= 0) { ufoT = rnd(9, 15); const L = Math.random() < 0.5; ufo = { x: L ? -20 : W() + 20, dir: L ? 1 : -1 }; }
        if (ufo) { ufo.x += ufo.dir * 110 * dt; if (ufo.x < -40 || ufo.x > W() + 40) ufo = null; }

        if (alive.length && Math.random() < dt * (0.5 + S.wave * 0.12 + S.kills * 0.012)) {
          const bots = [];
          for (let c = 0; c < COLS; c++) {
            let b = null;
            for (const v of grid) if (v.alive && v.c === c && (!b || v.r > b.r)) b = v;
            if (b) bots.push(b);
          }
          if (bots.length) { const b = pk(bots); bombs.push({ x: cellX(b.c), y: cellY(b.r) + 12, ph: rnd(0, 6), zig: S.wave >= 2 }); }
        }
        for (const b of bombs) {
          b.y += (150 + S.wave * 12) * dt;
          if (b.zig) b.x += Math.sin((S.t + b.ph) * 6) * 70 * dt;
        }
        bombs = bombs.filter(b => {
          if (b.y > H()) return false;
          if (hitShield(b.x, b.y)) { fxBurst(fx, b.x, b.y, "#ff5ec8", 6, 90); return false; }
          if (S.iv <= 0 && Math.abs(b.x - px) < 20 && Math.abs(b.y - shipY()) < 18) {
            S.lives--; S.iv = 1.2; S.shake = 1;
            fxBurst(fx, px, shipY(), "#55e6ff", 26, 220);
            beep(320, 60, 0.4, "sawtooth", 0.25);
            if (S.lives <= 0) end(false, "Invaders win!");
            return false;
          }
          return true;
        });

        fxUpdate(fx, dt, 60);
        hud("Kills " + S.kills + "/" + g.goal + "  " + "❤️".repeat(Math.max(0, S.lives)));
      },
      draw() {
        clear("#04060c");
        const gr = ctx2d.createLinearGradient(0, H() - 260, 0, H());
        gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(120,60,255,.28)");
        ctx2d.fillStyle = gr; ctx2d.fillRect(0, H() - 260, W(), 260);
        for (const s of stars) rect(s.x, s.y, s.s, s.s, "rgba(255,255,255,.55)");
        ctx2d.save();
        if (S.shake > 0) ctx2d.translate(rnd(-6, 6) * S.shake, rnd(-6, 6) * S.shake);
        for (const b of shields) rect(b.x, b.y, 12, 12, b.hp > 1 ? "#55ff9a" : "#2f8a62", 3);
        const f = Math.floor(S.t * 2) % 2;
        for (const v of grid) if (v.alive) drawInv(cellX(v.c), cellY(v.r), ROW_COL[v.r], f);
        if (ufo) {
          ctx2d.shadowColor = "#ffe36e"; ctx2d.shadowBlur = 16;
          ctx2d.beginPath(); ctx2d.ellipse(ufo.x, 92, 22, 9, 0, 0, Math.PI * 2);
          ctx2d.fillStyle = "#ffe36e"; ctx2d.fill(); ctx2d.shadowBlur = 0;
        }
        for (const s of shots) rect(s.x - 2, s.y - 10, 4, 18, "#ffd15c", 2);
        for (const b of bombs) { ctx2d.shadowColor = "#ff5ec8"; ctx2d.shadowBlur = 10; circle(b.x, b.y, 5, "#ff5ec8"); ctx2d.shadowBlur = 0; }
        if (S.iv <= 0 || Math.floor(S.t * 12) % 2 === 0) {
          const sy = shipY();
          ctx2d.shadowColor = "#55e6ff"; ctx2d.shadowBlur = 14;
          polygon([[px, sy - 18], [px - 18, sy + 10], [px, sy + 4], [px + 18, sy + 10]], "#55e6ff");
          ctx2d.shadowBlur = 0;
        }
        fxDraw(fx);
        ctx2d.restore();
        if (S.over) text(S.kills >= g.goal ? "VICTORY!" : "GAME OVER", W() / 2, H() / 2, 34, "#fff", "center");
      },
      stop() {}
    };
  }

  // ---------- BUBBLE POP: gold bubbles, spiky traps, combos, lives ----------
  function bubble(g) {
    const S = { pops: 0, lives: 3, over: false, t: 0, shake: 0, combo: 0, comboT: 0 };
    let B = [], sp = 0, fx = [], txt = [];
    function end(win, msg) {
      if (S.over) return;
      S.over = true;
      setTimeout(() => (win ? completeMini() : miniFail(g, msg)), END_DELAY);
    }
    function loseLife(msg) { S.lives--; S.shake = 0.8; S.combo = 0; if (S.lives <= 0) end(false, msg); }
    function say(s, x, y, col) { txt.push({ s, x, y, life: 0.9, col }); }
    function spawn() {
      const r = Math.random();
      const type = r < 0.14 ? "spike" : r < 0.3 ? "gold" : "normal";
      B.push({ x: rnd(40, W() - 40), y: H() + 40, r: rnd(26, 40), v: rnd(60, 105) + S.pops * 1.5, ph: rnd(0, 6), type, col: pk(PAL) });
    }
    function drawBubble(b) {
      const x = b.x, y = b.y, r = b.r;
      if (b.type === "spike") {
        for (let k = 0; k < 10; k++) {
          const a = k * Math.PI * 2 / 10;
          line(x + Math.cos(a) * r * 0.9, y + Math.sin(a) * r * 0.9, x + Math.cos(a) * r * 1.3, y + Math.sin(a) * r * 1.3, "#ff3355", 4);
        }
        circle(x, y, r, "#2b2b3d");
        circle(x - r * 0.3, y - r * 0.3, r * 0.2, "rgba(255,255,255,.25)");
        return;
      }
      const col = b.type === "gold" ? "#ffd15c" : b.col;
      ctx2d.shadowColor = col; ctx2d.shadowBlur = 14;
      const gr = ctx2d.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
      gr.addColorStop(0, "rgba(255,255,255,.95)"); gr.addColorStop(0.35, col); gr.addColorStop(1, "rgba(0,0,0,.25)");
      ctx2d.fillStyle = gr; ctx2d.beginPath(); ctx2d.arc(x, y, r, 0, Math.PI * 2); ctx2d.fill();
      ctx2d.shadowBlur = 0;
      circle(x - r * 0.35, y - r * 0.35, r * 0.18, "rgba(255,255,255,.8)");
    }

    return {
      pointer(x, y) {
        if (S.over) return;
        for (let i = B.length - 1; i >= 0; i--) {
          const b = B[i];
          if (Math.hypot(x - b.x, y - b.y) > b.r + 6) continue;
          B.splice(i, 1);
          if (b.type === "spike") {
            fxBurst(fx, b.x, b.y, "#ff3355", 18, 180);
            say("OUCH", b.x, b.y, "#ff5570");
            loseLife("Popped a spiky one");
            return;
          }
          S.combo = S.comboT > 0 ? S.combo + 1 : 1; S.comboT = 1.2;
          const bonus = S.combo % 5 === 0 ? 1 : 0;
          const add = (b.type === "gold" ? 2 : 1) + bonus;
          S.pops += add;
          fxBurst(fx, b.x, b.y, b.type === "gold" ? "#ffd15c" : b.col, b.type === "gold" ? 26 : 14, 150);
          beep(600 + S.combo * 40, 900 + S.combo * 40, 0.08, "sine", 0.15);
          say(bonus ? "COMBO +" + add : "+" + add, b.x, b.y, "#fff");
          if (S.pops >= g.goal) end(true);
          return;
        }
      },
      update(dt) {
        if (S.over) return;
        dt = Math.min(dt, 0.05);
        S.t += dt; S.shake = Math.max(0, S.shake - dt * 3);
        S.comboT -= dt; if (S.comboT <= 0) S.combo = 0;
        sp -= dt;
        if (sp <= 0) { spawn(); sp = Math.max(0.35, rnd(0.5, 0.85) - S.pops * 0.01); }
        for (const b of B) { b.y -= b.v * dt; b.x += Math.sin(S.t * 2 + b.ph) * 22 * dt; }
        B = B.filter(b => {
          if (b.y > -b.r - 10) return true;
          if (b.type !== "spike") loseLife("Too many floated away");
          return false;
        });
        for (const t of txt) { t.life -= dt; t.y -= 40 * dt; }
        txt = txt.filter(t => t.life > 0);
        fxUpdate(fx, dt, 40);
        hud("Pops " + Math.min(S.pops, g.goal) + "/" + g.goal + "  " + "❤️".repeat(Math.max(0, S.lives)));
      },
      draw() {
        const bg = ctx2d.createLinearGradient(0, 0, 0, H());
        bg.addColorStop(0, "#0b1a3a"); bg.addColorStop(1, "#2a0b3a");
        ctx2d.fillStyle = bg; ctx2d.fillRect(0, 0, W(), H());
        ctx2d.save();
        if (S.shake > 0) ctx2d.translate(rnd(-5, 5) * S.shake, rnd(-5, 5) * S.shake);
        for (const b of B) drawBubble(b);
        fxDraw(fx);
        for (const t of txt) { ctx2d.globalAlpha = Math.max(0, t.life / 0.9); text(t.s, t.x, t.y, 22, t.col, "center"); }
        ctx2d.globalAlpha = 1;
        ctx2d.restore();
        if (S.over) text(S.pops >= g.goal ? "ALL POPPED!" : "OOPS!", W() / 2, H() / 2, 34, "#fff", "center");
      },
      stop() {}
    };
  }

  // ---------- DOT CATCH: basket, stars worth 2, dark bombs, lives ----------
  function catcher(g) {
    const S = { pops: 0, lives: 3, over: false, t: 0, shake: 0 };
    const by = () => H() - 150;
    let F = [], bx = W() / 2, tx = bx, sp = 0, fx = [], txt = [];
    function end(win, msg) {
      if (S.over) return;
      S.over = true;
      setTimeout(() => (win ? completeMini() : miniFail(g, msg)), END_DELAY);
    }
    function loseLife(msg) { S.lives--; S.shake = 0.8; if (S.lives <= 0) end(false, msg); }
    function say(s, x, y, col) { txt.push({ s, x, y, life: 0.8, col }); }
    function starPts(x, y, R, r) {
      const p = [];
      for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r : R; p.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); }
      return p;
    }
    return {
      pointer(x) { if (!S.over) tx = cl(x, 60, W() - 60); },
      update(dt) {
        if (S.over) return;
        dt = Math.min(dt, 0.05);
        S.t += dt; S.shake = Math.max(0, S.shake - dt * 3);
        if (Math.abs(AX()) > 0.05) { bx += AX() * 360 * dt; tx = bx; }
        else bx += (tx - bx) * Math.min(1, dt * 9);
        bx = cl(bx, 60, W() - 60);
        sp -= dt;
        if (sp <= 0) {
          sp = Math.max(0.35, rnd(0.55, 0.95) - S.pops * 0.02);
          const r = Math.random();
          const type = r < 0.2 ? "bomb" : r < 0.3 ? "star" : "dot";
          F.push({ x: rnd(30, W() - 30), y: -20, v: rnd(120, 170) + S.pops * 3, ph: rnd(0, 6), type, col: pk(PAL) });
        }
        for (const f of F) { f.y += f.v * dt; f.x += Math.sin(S.t * 2 + f.ph) * 20 * dt; }
        const cb = by();
        F = F.filter(f => {
          if (f.y >= cb - 10 && f.y < cb + 26 && Math.abs(f.x - bx) < 62) {
            if (f.type === "bomb") {
              fxBurst(fx, f.x, cb, "#ff5570", 24, 200);
              say("BOOM", f.x, cb, "#ff5570");
              loseLife("Caught a bomb");
            } else {
              const add = f.type === "star" ? 2 : 1;
              S.pops += add;
              fxBurst(fx, f.x, cb, f.col, 14, 150);
              say("+" + add, f.x, cb, "#fff");
              if (S.pops >= g.goal) end(true);
            }
            return false;
          }
          if (f.y > H() + 20) {
            if (f.type !== "bomb") loseLife("Missed too many");
            return false;
          }
          return true;
        });
        for (const t of txt) { t.life -= dt; t.y -= 40 * dt; }
        txt = txt.filter(t => t.life > 0);
        fxUpdate(fx, dt, 60);
        hud("Caught " + Math.min(S.pops, g.goal) + "/" + g.goal + "  " + "❤️".repeat(Math.max(0, S.lives)));
      },
      draw() {
        const bg = ctx2d.createLinearGradient(0, 0, 0, H());
        bg.addColorStop(0, "#1b2f5c"); bg.addColorStop(1, "#4a1d5c");
        ctx2d.fillStyle = bg; ctx2d.fillRect(0, 0, W(), H());
        ctx2d.save();
        if (S.shake > 0) ctx2d.translate(rnd(-5, 5) * S.shake, rnd(-5, 5) * S.shake);
        for (const f of F) {
          if (f.type === "bomb") {
            circle(f.x, f.y, 15, "#1d1d26");
            line(f.x, f.y - 15, f.x + 8, f.y - 24, "#ffb86b", 3);
          } else if (f.type === "star") {
            ctx2d.shadowColor = "#ffd15c"; ctx2d.shadowBlur = 14;
            polygon(starPts(f.x, f.y, 17, 7), "#ffd15c");
            ctx2d.shadowBlur = 0;
          } else {
            ctx2d.shadowColor = f.col; ctx2d.shadowBlur = 10;
            circle(f.x, f.y, 14, f.col);
            ctx2d.shadowBlur = 0;
          }
        }
        fxDraw(fx);
        const y = by();
        polygon([[bx - 62, y], [bx + 62, y], [bx + 48, y + 30], [bx - 48, y + 30]], "#8a5a2b");
        for (let k = -2; k <= 2; k++) line(bx + k * 22, y + 2, bx + k * 16, y + 28, "#c98b4b", 2);
        rect(bx - 66, y - 6, 132, 8, "#c98b4b", 4);
        for (const t of txt) { ctx2d.globalAlpha = Math.max(0, t.life / 0.8); text(t.s, t.x, t.y, 22, t.col, "center"); }
        ctx2d.globalAlpha = 1;
        ctx2d.restore();
        if (S.over) text(S.pops >= g.goal ? "FULL BASKET!" : "OOPS!", W() / 2, H() / 2, 34, "#fff", "center");
      },
      stop() {}
    };
  }

  return {
    engines: { invaders: invaders, kd_bubble: bubble, kd_catch: catcher },
    minis: [
      { id: "invaders", title: "Space Invaders", icon: "👾", cat: "ACTION", desc: "Shoot the marching aliens before they land. Hide behind the shields, dodge the bombs, catch the UFO.", engine: "invaders", goal: 24 },
      { id: "kd_bubble", title: "Bubble Pop", icon: "🫧", cat: "ARCADE", desc: "Pop the bubbles before they float away. Gold ones count double, spiky ones cost a life.", engine: "kd_bubble", goal: 15, cfg: {} },
      { id: "kd_catch", title: "Dot Catch", icon: "🧺", cat: "ARCADE", desc: "Move the basket, catch the dots and stars. Dark bombs cost a life.", engine: "kd_catch", goal: 12, cfg: {} }
    ]
  };
})();
