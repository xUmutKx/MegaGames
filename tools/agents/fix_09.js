window.__AG_fix_09 = (function () {
  /* Balloon Pop (p2pop): balloons drift up from below. Pop them before they escape.
     Gold balloons are worth double, black bombs cost a life when popped. Escapes cost a life. */

  function balloonEngine(g) {
    const goal = g.goal || 4;
    const COLS = [C.pink, C.cyan, C.green, C.purple, C.orange, C.blue];
    const TOP = 84;                      // balloons escaping above this line cost a life
    let lvl = 0, lives = 3, over = false, locked = false, lockT = 0;
    let t = 0, shake = 0, spawnT = 0.6, balls = [], got = 0, target = 0;
    let combo = 0, comboT = 0, score = 0, bannerT = 0, bannerMsg = "", bannerCol = C.gold;
    const fx = [], pops = [];

    function startLevel() {
      target = 6 + lvl * 3;
      got = 0;
      balls = [];
      spawnT = 0.6;
      combo = 0;
    }
    startLevel();

    function banner(msg, col, secs) { bannerMsg = msg; bannerCol = col; bannerT = secs; }

    function hurt(msg) {
      lives--;
      shake = 10;
      combo = 0;
      banner(msg, C.red, 1.2);
      beep(200, 90, 0.25, "sawtooth", 0.1);
      if (lives <= 0) {
        over = true;
        miniFail(g, msg + " • Balloons " + lvl + "/" + goal + " • Score " + score);
      }
    }

    function clearLevel() {
      locked = true;
      lockT = 1.5;
      banner("ALL POPPED!", C.green, 1.4);
      beep(523, 1046, 0.3, "triangle", 0.1);
      for (let i = 0; i < 5; i++) fxBurst(fx, rand(40, W() - 40), rand(120, H() - 200), pick(COLS), 18, 200);
    }

    function spawn(dt) {
      spawnT -= dt;
      if (spawnT > 0) return;
      spawnT = Math.max(0.4, 1.0 - lvl * 0.12) * rand(0.7, 1.2);
      const r = rand(22, 30);
      const roll = Math.random();
      const k = roll < 0.12 ? "bomb" : roll < 0.3 ? "gold" : "normal";
      balls.push({
        x: rand(r + 14, W() - r - 14), y: H() + r, r, k,
        vy: rand(70, 100) + lvl * 14, ph: rand(0, 6.28), wob: rand(10, 30),
        col: k === "gold" ? C.gold : k === "bomb" ? "#222" : pick(COLS)
      });
    }

    return {
      update(dt) {
        dt = Math.min(dt, 0.05);
        t += dt;
        fxUpdate(fx, dt, 120);
        for (const p of pops) p.t += dt;
        for (let i = pops.length - 1; i >= 0; i--) if (pops[i].t >= pops[i].life) pops.splice(i, 1);
        shake = Math.max(0, shake - dt * 40);
        if (bannerT > 0) bannerT -= dt;
        if (comboT > 0) { comboT -= dt; if (comboT <= 0) combo = 0; }

        if (!over) {
          if (locked) {
            lockT -= dt;
            if (lockT <= 0) {
              locked = false;
              lvl++;
              if (lvl >= goal) { over = true; completeMini(); }
              else startLevel();
            }
          } else {
            spawn(dt);
            for (let i = balls.length - 1; i >= 0; i--) {
              const b = balls[i];
              b.y -= b.vy * dt;
              b.x = clamp(b.x + Math.sin(t * 2 + b.ph) * b.wob * dt, b.r + 4, W() - b.r - 4);
              if (b.y + b.r < TOP) {
                balls.splice(i, 1);
                if (b.k !== "bomb") hurt("A BALLOON ESCAPED");
                if (over) break;
              }
            }
          }
        }
        hud("Balloons " + lvl + "/" + goal + " • Pops " + got + "/" + target + " • Combo x" + combo + " • " + "♥".repeat(Math.max(0, lives)));
      },

      pointer(x, y) {
        if (over || locked) return;
        let hit = -1;
        for (let i = balls.length - 1; i >= 0; i--) {
          const b = balls[i];
          if (dist(x, y, b.x, b.y) < b.r + 10) { hit = i; break; }
        }
        if (hit < 0) return;
        const b = balls[hit];
        balls.splice(hit, 1);
        if (b.k === "bomb") {
          fxBurst(fx, b.x, b.y, C.red, 24, 220);
          hurt("BOMB!");
          return;
        }
        comboT = 1.2;
        combo++;
        const pts = (b.k === "gold" ? 3 : 1) * combo;
        score += pts;
        got += b.k === "gold" ? 2 : 1;
        fxBurst(fx, b.x, b.y, b.col, 14, 150);
        beep(520 + combo * 40, 880 + combo * 60, 0.08, "triangle", 0.08);
        pops.push({ s: "+" + pts, x: b.x, y: b.y, c: b.col, t: 0, life: 0.8 });
        if (got >= target) clearLevel();
      },

      stop() {},

      draw() {
        ctx2d.save();
        if (shake > 0) ctx2d.translate(rand(-shake, shake) * 0.5, rand(-shake, shake) * 0.5);
        const bg = ctx2d.createLinearGradient(0, 0, 0, H());
        bg.addColorStop(0, "#0a1030");
        bg.addColorStop(1, "#2a1040");
        ctx2d.fillStyle = bg;
        ctx2d.fillRect(0, 0, W(), H());
        for (let i = 0; i < 4; i++) {
          const cx = ((i * 137 + t * (8 + i * 3)) % (W() + 120)) - 60;
          ctx2d.globalAlpha = 0.07;
          circle(cx, 150 + i * 120, 46, "#fff");
          ctx2d.globalAlpha = 1;
        }
        polygon([[0, H()], [0, H() - 70], [W() * 0.3, H() - 120], [W() * 0.7, H() - 60], [W(), H() - 110], [W(), H()]], "rgba(0,0,0,.35)");

        line(0, TOP + 8, W(), TOP + 8, "rgba(255,85,112,.45)", 2);

        for (const b of balls) {
          const sway = Math.sin(t * 3 + b.ph) * 3;
          line(b.x, b.y + b.r, b.x - 2 + sway * 0.3, b.y + b.r + 26, "rgba(255,255,255,.35)", 1.5);
          if (b.k === "gold") {
            ctx2d.globalAlpha = 0.25;
            circle(b.x, b.y, b.r * 1.8, C.gold);
            ctx2d.globalAlpha = 1;
          }
          ctx2d.beginPath();
          ctx2d.ellipse(b.x, b.y, b.r * 0.88, b.r, 0, 0, Math.PI * 2);
          ctx2d.fillStyle = b.col;
          ctx2d.fill();
          if (b.k === "bomb") {
            strokeCircle(b.x, b.y, b.r, C.red, 3);
            text("!", b.x, b.y + 7, 18, C.red, "center", 900);
          } else {
            circle(b.x - b.r * 0.3, b.y - b.r * 0.35, b.r * 0.18, "rgba(255,255,255,.55)");
            if (b.k === "gold") text("2", b.x, b.y + 6, 16, "#5a3b00", "center", 900);
          }
        }

        fxDraw(fx);
        for (const p of pops) {
          ctx2d.globalAlpha = Math.max(0, 1 - p.t / p.life);
          text(p.s, p.x, p.y - p.t * 40, 20, p.c, "center", 900);
          ctx2d.globalAlpha = 1;
        }
        if (bannerT > 0) {
          ctx2d.globalAlpha = Math.min(1, bannerT);
          text(bannerMsg, W() / 2, H() * 0.42, 30, bannerCol, "center", 900);
          ctx2d.globalAlpha = 1;
        }
        ctx2d.restore();
      }
    };
  }

  return {
    engines: { p2pop: balloonEngine },
    minis: [
      {
        id: "p2pop", title: "Balloon Pop", icon: "🫧", cat: "ARCADE",
        desc: "Pop the rising balloons before they escape. Gold ones are worth double, black bombs cost a life.",
        engine: "p2pop", goal: 4
      }
    ]
  };
})();
