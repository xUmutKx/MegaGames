// new_15: shoot-em-up and bullet-hell minigames (all original names and art).
window.__AG_new_15 = (function () {
  const T2 = Math.PI * 2;

  /* ---------- shared helpers ---------- */
  function sky(top, bot) {
    const gr = ctx2d.createLinearGradient(0, 0, 0, H());
    gr.addColorStop(0, top); gr.addColorStop(1, bot);
    ctx2d.fillStyle = gr; ctx2d.fillRect(0, 0, W(), H());
  }
  function starField(n) {
    const s = [];
    for (let i = 0; i < n; i++) s.push({ x: rand(0, W()), y: rand(0, H()), z: rand(0.2, 1) });
    return s;
  }
  function stepStars(s, dt, speed) {
    for (const p of s) {
      p.y += speed * p.z * dt;
      if (p.y > H()) { p.y -= H(); p.x = rand(0, W()); }
    }
  }
  function drawStars(s, col) {
    ctx2d.fillStyle = col;
    for (const p of s) { ctx2d.globalAlpha = 0.25 + p.z * 0.6; ctx2d.fillRect(p.x, p.y, p.z * 2, p.z * 2); }
    ctx2d.globalAlpha = 1;
  }
  function glow(col, b) { ctx2d.shadowColor = col; ctx2d.shadowBlur = b; }
  function unglow() { ctx2d.shadowBlur = 0; }
  function glowDot(x, y, r, col) { glow(col, 12); circle(x, y, r, col); unglow(); }
  function shipShape(x, y, col, s) {
    glow(col, 14);
    polygon([[x, y - 14 * s], [x + 11 * s, y + 10 * s], [x, y + 5 * s], [x - 11 * s, y + 10 * s]], col);
    unglow();
  }
  function bar(x, y, w, h, frac, col) {
    rect(x, y, w, h, 'rgba(255,255,255,0.15)', 3);
    rect(x, y, w * clamp(frac, 0, 1), h, col, 3);
  }
  function jit(s) { return s > 0 ? [rand(-s, s), rand(-s, s)] : [0, 0]; }
  function wrapA(a) { while (a > Math.PI) a -= T2; while (a < -Math.PI) a += T2; return a; }
  function flashScreen(col, a) { ctx2d.globalAlpha = clamp(a, 0, 1); rect(0, 0, W(), H(), col); ctx2d.globalAlpha = 1; }
  // Runs win/lose exactly once per run.
  function ender(g) {
    let done = false;
    return {
      get over() { return done; },
      win() { if (!done) { done = true; completeMini(); } },
      lose(msg) { if (!done) { done = true; miniFail(g, msg); } }
    };
  }

  /* ---------- 1. Graze Storm: bullet-hell dodging, graze points ---------- */
  function gameGraze(g) {
    const E = ender(g);
    const bx = () => W() / 2, by = 150;
    let px = W() / 2, py = H() - 190, lives = 3, graze = 0, inv = 0, t = 0, spin = 0;
    let shot = 0, aimT = 2, focus = false, sh = 0, bullets = [], parts = [], stars = starField(40);
    return {
      update(dt) {
        if (E.over) return;
        t += dt; spin += dt; inv -= dt; sh = Math.max(0, sh - dt * 20);
        if (pressed('b')) focus = !focus;
        const sp = (focus ? 110 : 200) * dt;
        px = clamp(px + AX() * sp, 22, W() - 22);
        py = clamp(py + AY() * sp, 300, H() - 130);
        stepStars(stars, dt, 40);
        // spinner: spiral stream, speeds up over time
        shot -= dt;
        if (shot <= 0) {
          shot = Math.max(0.045, 0.085 - t * 0.0015);
          const a = spin * 2.4;
          bullets.push({ x: bx(), y: by, vx: Math.cos(a) * 150, vy: Math.sin(a) * 150, r: 4 });
          bullets.push({ x: bx(), y: by, vx: Math.cos(a + Math.PI) * 150, vy: Math.sin(a + Math.PI) * 150, r: 4 });
        }
        aimT -= dt;
        if (aimT <= 0) {
          aimT = Math.max(1.4, 2.6 - t * 0.02);
          const base = Math.atan2(py - by, px - bx());
          for (let k = -2; k <= 2; k++) {
            const a = base + k * 0.13;
            bullets.push({ x: bx(), y: by, vx: Math.cos(a) * 215, vy: Math.sin(a) * 215, r: 5, aimed: true });
          }
        }
        for (const b of bullets) {
          b.x += b.vx * dt; b.y += b.vy * dt;
          const d = dist(b.x, b.y, px, py);
          if (!b.dead && !b.g && d < 24 && d > 5 + b.r) {
            b.g = true; graze++;
            fxBurst(parts, b.x, b.y, C.cyan, 4, 90);
            beep(900, 1200, 0.03, 'sine', 0.05);
          }
          if (!b.dead && inv <= 0 && d < 5 + b.r) {
            b.dead = true; lives--; inv = 1.3; sh = 8;
            fxBurst(parts, px, py, C.red, 18, 200);
            beep(160, 60, 0.2, 'sawtooth', 0.15);
            if (lives <= 0) { E.lose('Caught by the spiral'); return; }
          }
        }
        bullets = bullets.filter(b => !b.dead && b.x > -30 && b.x < W() + 30 && b.y > -30 && b.y < H() + 30);
        fxUpdate(parts, dt, 0);
        hud('Grazes ' + graze + '/' + g.goal + '  Lives ' + lives);
        if (graze >= g.goal) E.win();
      },
      draw() {
        const [ox, oy] = jit(sh);
        ctx2d.save(); ctx2d.translate(ox, oy);
        sky('#060418', '#1a0630');
        drawStars(stars, '#c9b6ff');
        const pulse = 1 + Math.sin(t * 6) * 0.08;
        strokeCircle(bx(), by, 26 * pulse, 'rgba(255,79,216,0.5)', 3);
        glowDot(bx(), by, 14, C.pink);
        for (const b of bullets) {
          if (b.aimed) glowDot(b.x, b.y, b.r, C.orange);
          else glowDot(b.x, b.y, b.r, b.g ? 'rgba(255,79,216,0.45)' : C.pink);
        }
        fxDraw(parts);
        if (inv <= 0 || Math.floor(t * 12) % 2 === 0) {
          strokeCircle(px, py, 24, 'rgba(85,230,255,0.35)', 1.5);
          glowDot(px, py, focus ? 4 : 5, C.white);
          if (focus) strokeCircle(px, py, 5, C.white, 1);
        }
        ctx2d.restore();
        text(focus ? 'FOCUS ON  (B to toggle)' : 'B: focus for precision', W() / 2, H() - 300, 12, 'rgba(255,255,255,0.6)', 'center');
      },
      stop() {}
    };
  }

  /* ---------- 2. Prism Shmup: match your colour to hurt enemies ---------- */
  function gamePrism(g) {
    const E = ender(g);
    const COLS = [C.red, C.cyan, C.yellow];
    const NAMES = ['RED', 'CYAN', 'YELLOW'];
    let px = W() / 2, ci = 0, hp = 3, kills = 0, absorbs = 0, inv = 0, t = 0, fire = 0, spawn = 0, sh = 0;
    let shots = [], foes = [], eshots = [], parts = [], stars = starField(45);
    return {
      update(dt) {
        if (E.over) return;
        t += dt; inv -= dt; fire -= dt; spawn -= dt; sh = Math.max(0, sh - dt * 20);
        if (pressed('b')) { ci = (ci + 1) % 3; beep(600 + ci * 200, 800 + ci * 200, 0.06, 'square', 0.06); }
        px = clamp(px + AX() * 240 * dt, 24, W() - 24);
        stepStars(stars, dt, 60);
        if (fire <= 0) { fire = 0.15; shots.push({ x: px, y: H() - 170, c: ci }); }
        if (spawn <= 0) {
          spawn = Math.max(0.5, 1.0 - kills * 0.02);
          foes.push({ x: rand(30, W() - 30), y: -20, c: randi(0, 2), hp: 2, ph: rand(0, 6), bt: rand(0.8, 1.6) });
        }
        for (const s of shots) s.y -= 520 * dt;
        for (const f of foes) {
          f.y += 70 * dt; f.ph += dt;
          f.x += Math.sin(f.ph * 2) * 40 * dt;
          f.bt -= dt;
          if (f.bt <= 0 && f.y > 20) {
            f.bt = 1.4;
            eshots.push({ x: f.x, y: f.y + 10, c: f.c, vy: 190 });
          }
        }
        for (const s of shots) {
          if (s.hit) continue;
          for (const f of foes) {
            if (f.hp > 0 && f.c === s.c && dist(s.x, s.y, f.x, f.y) < 18) {
              s.hit = true; f.hp--;
              fxBurst(parts, s.x, s.y, COLS[f.c], 6, 140);
              if (f.hp <= 0) { kills++; fxBurst(parts, f.x, f.y, COLS[f.c], 22, 240); sh = 3; }
              break;
            }
          }
        }
        // enemy shots matching your colour are absorbed for a bonus; others hurt
        for (const b of eshots) {
          b.y += b.vy * dt;
          if (b.dead) continue;
          if (dist(b.x, b.y, px, H() - 170) < 16) {
            b.dead = true;
            if (b.c === ci) { absorbs++; fxBurst(parts, b.x, b.y, COLS[ci], 10, 160); beep(1000, 1400, 0.05, 'sine', 0.08); }
            else if (inv <= 0) {
              hp--; inv = 1; sh = 9; fxBurst(parts, px, H() - 170, C.red, 20, 220); beep(180, 60, 0.2, 'sawtooth', 0.15);
              if (hp <= 0) { E.lose('Shot down by the wrong colour'); return; }
            }
          }
        }
        shots = shots.filter(s => !s.hit && s.y > -20);
        foes = foes.filter(f => f.hp > 0 && f.y < H() + 30);
        eshots = eshots.filter(b => !b.dead && b.y < H() + 20);
        fxUpdate(parts, dt, 40);
        hud('Kills ' + kills + '/' + g.goal + '  Absorbed ' + absorbs + '  HP ' + hp);
        if (kills >= g.goal) E.win();
      },
      draw() {
        const [ox, oy] = jit(sh);
        ctx2d.save(); ctx2d.translate(ox, oy);
        sky('#05070f', '#0d1630');
        drawStars(stars, '#ffffff');
        for (const f of foes) {
          glow(COLS[f.c], 16);
          polygon([[f.x, f.y - 14], [f.x + 13, f.y], [f.x, f.y + 14], [f.x - 13, f.y]], COLS[f.c]);
          unglow();
          if (f.hp < 2) circle(f.x, f.y, 3, C.white);
        }
        for (const s of shots) rect(s.x - 2, s.y - 8, 4, 16, COLS[s.c], 2);
        for (const b of eshots) glowDot(b.x, b.y, 5, COLS[b.c]);
        fxDraw(parts);
        if (inv <= 0 || Math.floor(t * 12) % 2 === 0) shipShape(px, H() - 170, COLS[ci], 1.1);
        ctx2d.restore();
        text('B: swap prism colour (' + NAMES[ci] + ')', W() / 2, H() - 130, 13, COLS[ci], 'center');
      },
      stop() {}
    };
  }

  /* ---------- 3. Orbit Core: ride a ring, fire outward, protect the core ---------- */
  function gameOrbit(g) {
    const E = ender(g);
    const cx = W() / 2, cy = H() * 0.42, R = 125;
    let th = -Math.PI / 2, hp = 10, pl = 3, kills = 0, inv = 0, t = 0, fire = 0, spawn = 0, sh = 0;
    let shots = [], foes = [], parts = [], stars = starField(40);
    const pos = (a, r) => [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
    return {
      update(dt) {
        if (E.over) return;
        t += dt; inv -= dt; fire -= dt; spawn -= dt; sh = Math.max(0, sh - dt * 20);
        th += AX() * 2.8 * dt;
        stepStars(stars, dt, 30);
        if (fire <= 0) {
          fire = 0.22;
          shots.push({ a: th, r: R + 10 });
        }
        if (spawn <= 0) {
          spawn = Math.max(0.45, 1.1 - kills * 0.02);
          foes.push({ a: rand(-Math.PI, Math.PI), r: 360, hp: Math.random() < 0.3 ? 2 : 1, sp: 55 + Math.min(60, kills * 3) });
        }
        for (const s of shots) s.r += 430 * dt;
        for (const f of foes) {
          f.r -= f.sp * dt; f.a += Math.sin(t * 2 + f.r * 0.05) * 0.2 * dt;
          for (const s of shots) {
            if (s.hit || f.hp <= 0) continue;
            const arc = Math.abs(wrapA(f.a - s.a)) * ((f.r + s.r) / 2);
            if (arc < 14 && Math.abs(f.r - s.r) < 14) {
              s.hit = true; f.hp--;
              fxBurst(parts, ...pos(f.a, f.r), f.hp <= 0 ? C.gold : C.lime, f.hp <= 0 ? 20 : 6, 200);
              if (f.hp <= 0) { kills++; sh = 2; }
            }
          }
          if (f.hp > 0 && f.r <= R + 10 && Math.abs(wrapA(f.a - th)) < 0.24) {
            f.hp = 0;
            if (inv <= 0) {
              pl--; inv = 1.2; sh = 9;
              fxBurst(parts, ...pos(th, R), C.red, 22, 240);
              beep(160, 60, 0.2, 'sawtooth', 0.15);
              if (pl <= 0) { E.lose('Rammed too many times'); return; }
            }
          }
          if (f.hp > 0 && f.r <= 40) {
            f.hp = 0; hp--; sh = 6; fxBurst(parts, ...pos(f.a, 40), C.orange, 14, 180);
            if (hp <= 0) { E.lose('The core fell'); return; }
          }
        }
        shots = shots.filter(s => !s.hit && s.r < 420);
        foes = foes.filter(f => f.hp > 0);
        fxUpdate(parts, dt, 0);
        hud('Kills ' + kills + '/' + g.goal + '  Core ' + hp + '/10  Ship ' + pl);
        if (kills >= g.goal) E.win();
      },
      draw() {
        const [ox, oy] = jit(sh);
        ctx2d.save(); ctx2d.translate(ox, oy);
        sky('#07030f', '#14102e');
        drawStars(stars, '#cfe8ff');
        strokeCircle(cx, cy, R, 'rgba(85,230,255,0.25)', 2);
        for (const f of foes) {
          const [x, y] = pos(f.a, f.r);
          glowDot(x, y, 10, f.hp > 1 ? C.purple : C.orange);
          circle(x, y, 4, C.white);
        }
        for (const s of shots) { const [x, y] = pos(s.a, s.r); glowDot(x, y, 3, C.cyan); }
        const pulse = 1 + Math.sin(t * 3) * 0.05;
        strokeCircle(cx, cy, 36 * pulse, C.gold, 3);
        glowDot(cx, cy, 22 * (0.6 + hp / 25), C.gold);
        fxDraw(parts);
        const [px, py] = pos(th, R);
        if (inv <= 0 || Math.floor(t * 12) % 2 === 0) shipShape(px, py, C.cyan, 0.8);
        ctx2d.restore();
      },
      stop() {}
    };
  }

  /* ---------- 4. Lane Runner: five lanes, swipe to switch, lane-wide sweep ---------- */
  function gameLanes(g) {
    const E = ender(g);
    const LANES = 5, LW = 80;
    const laneX = i => LW * (i + 0.5);
    let li = 2, sx = laneX(2), hp = 3, kills = 0, inv = 0, t = 0, fire = 0, spawn = 0, sh = 0;
    let sweep = 0, sweepCd = 0, axHeld = false, shots = [], foes = [], eshots = [], parts = [], stars = starField(35);
    const PY = H() - 170;
    return {
      update(dt) {
        if (E.over) return;
        t += dt; inv -= dt; fire -= dt; spawn -= dt; sweepCd -= dt; sweep -= dt; sh = Math.max(0, sh - dt * 20);
        const ax = AX();
        if (Math.abs(ax) > 0.6 && !axHeld) { li = clamp(li + (ax > 0 ? 1 : -1), 0, LANES - 1); axHeld = true; }
        if (Math.abs(ax) < 0.2) axHeld = false;
        sx += (laneX(li) - sx) * Math.min(1, dt * 14);
        stepStars(stars, dt, 80);
        if (fire <= 0) { fire = 0.2; shots.push({ x: sx, y: PY - 14 }); }
        if (pressed('b') && sweepCd <= 0) { sweep = 0.7; sweepCd = 5; sh = 2; beep(300, 1400, 0.3, 'sawtooth', 0.1); }
        if (sweep > 0) {
          for (const f of foes) if (Math.abs(f.x - sx) < LW / 2 && f.hp > 0) { f.hp = 0; kills++; fxBurst(parts, f.x, f.y, C.gold, 16, 220); }
        }
        if (spawn <= 0) {
          spawn = Math.max(0.35, 0.9 - kills * 0.015);
          const lane = randi(0, LANES - 1);
          const tank = Math.random() < 0.3;
          foes.push({ x: laneX(lane), y: -24, hp: tank ? 3 : 1, tank, fT: rand(0.8, 1.6), vy: 80 + Math.min(70, kills * 2) });
        }
        for (const s of shots) s.y -= 560 * dt;
        for (const f of foes) {
          f.y += f.vy * dt; f.fT -= dt;
          if (f.tank && f.fT <= 0 && f.y > 20) { f.fT = 1.8; eshots.push({ x: f.x, y: f.y + 16, vy: 230 }); }
        }
        for (const s of shots) {
          if (s.hit) continue;
          for (const f of foes) {
            if (f.hp > 0 && Math.abs(f.x - s.x) < 22 && Math.abs(f.y - s.y) < 22) {
              s.hit = true; f.hp--; fxBurst(parts, s.x, s.y, C.lime, 5, 120);
              if (f.hp <= 0) { kills++; fxBurst(parts, f.x, f.y, C.orange, 18, 230); sh = 2; }
              break;
            }
          }
        }
        for (const b of eshots) {
          b.y += b.vy * dt;
          if (!b.dead && inv <= 0 && Math.abs(b.x - sx) < 18 && Math.abs(b.y - PY) < 18) {
            b.dead = true; hp--; inv = 1.1; sh = 9; fxBurst(parts, sx, PY, C.red, 20, 220); beep(180, 60, 0.2, 'sawtooth', 0.15);
            if (hp <= 0) { E.lose('Lane breached'); return; }
          }
        }
        shots = shots.filter(s => !s.hit && s.y > -20);
        foes = foes.filter(f => f.hp > 0 && f.y < H() + 30);
        eshots = eshots.filter(b => !b.dead && b.y < H() + 20);
        fxUpdate(parts, dt, 30);
        hud('Kills ' + kills + '/' + g.goal + '  HP ' + hp + '  Sweep ' + (sweepCd > 0 ? Math.ceil(sweepCd) + 's' : 'ready'));
        if (kills >= g.goal) E.win();
      },
      draw() {
        const [ox, oy] = jit(sh);
        ctx2d.save(); ctx2d.translate(ox, oy);
        sky('#050a14', '#0f1d2e');
        for (let i = 1; i < LANES; i++) line(LW * i, 0, LW * i, H(), 'rgba(85,230,255,0.12)', 2);
        drawStars(stars, '#9fe9ff');
        if (sweep > 0) rect(sx - LW / 2, 0, LW, H(), 'rgba(255,227,110,' + (0.18 * sweep / 0.7).toFixed(3) + ')');
        for (const f of foes) {
          glowDot(f.x, f.y, f.tank ? 15 : 11, f.tank ? C.orange : C.purple);
          if (f.tank) bar(f.x - 14, f.y - 22, 28, 4, f.hp / 3, C.lime);
        }
        for (const s of shots) rect(s.x - 2, s.y - 8, 4, 14, C.lime, 2);
        for (const b of eshots) glowDot(b.x, b.y, 5, C.red);
        fxDraw(parts);
        if (inv <= 0 || Math.floor(t * 12) % 2 === 0) shipShape(sx, PY, C.cyan, 1);
        ctx2d.restore();
        text('Swipe or joystick to change lane  •  B: sweep', W() / 2, H() - 300, 12, 'rgba(255,255,255,0.6)', 'center');
      },
      stop() {}
    };
  }

  /* ---------- 5. Chain Salvo: chain kills widen the spread and multiply points ---------- */
  function gameChain(g) {
    const E = ender(g);
    let px = W() / 2, hp = 3, score = 0, chain = 0, chainT = 0, inv = 0, t = 0, fire = 0, spawn = 0, sh = 0;
    let shots = [], foes = [], parts = [], pops = [], stars = starField(40);
    const mult = () => Math.min(5, 1 + Math.floor(chain / 3));
    return {
      update(dt) {
        if (E.over) return;
        t += dt; inv -= dt; fire -= dt; spawn -= dt; sh = Math.max(0, sh - dt * 20);
        chainT -= dt; if (chainT <= 0) chain = 0;
        px = clamp(px + AX() * 260 * dt, 24, W() - 24);
        if (pressed('b') && chain >= 6) { // spend a big chain on a screen-wide blast
          chain = 0; sh = 6; fxBurst(parts, W() / 2, H() / 2, C.pink, 40, 320);
          for (const f of foes) { f.hp = 0; score += 10; }
          beep(200, 1200, 0.3, 'sawtooth', 0.12);
        }
        stepStars(stars, dt, 70);
        if (fire <= 0) {
          fire = 0.2;
          const n = 1 + Math.floor((mult() - 1) / 2);
          for (let k = 0; k < n; k++) {
            const a = (k - (n - 1) / 2) * 0.13 - Math.PI / 2;
            shots.push({ x: px, y: H() - 170, vx: Math.cos(a) * 480, vy: Math.sin(a) * 480 });
          }
        }
        if (spawn <= 0) {
          spawn = Math.max(0.4, 0.95 - score * 0.003);
          const shield = Math.random() < 0.25;
          foes.push({ x: rand(30, W() - 30), y: -20, hp: shield ? 2 : 1, ph: rand(0, 6), dive: Math.random() < 0.2, dt: 0, sp: rand(60, 110) });
        }
        for (const s of shots) { s.x += s.vx * dt; s.y += s.vy * dt; }
        for (const f of foes) {
          f.ph += dt;
          f.y += f.sp * dt; f.x += Math.sin(f.ph * 2.2) * 50 * dt;
          if (f.dive && f.y > 40) {
            f.dt += dt;
            const a = Math.atan2(H() - 170 - f.y, px - f.x);
            f.x += Math.cos(a) * 120 * dt; f.y += Math.sin(a) * 120 * dt;
          }
          f.x = clamp(f.x, 20, W() - 20);
        }
        for (const s of shots) {
          if (s.hit) continue;
          for (const f of foes) {
            if (f.hp > 0 && dist(s.x, s.y, f.x, f.y) < 16) {
              s.hit = true; f.hp--; fxBurst(parts, s.x, s.y, C.yellow, 5, 120);
              if (f.hp <= 0) {
                const m = mult();
                chain++; chainT = 1.4;
                const pts = 10 * m;
                score += pts;
                pops.push({ x: f.x, y: f.y, t: 0.9, s: 'x' + m + ' +' + pts });
                fxBurst(parts, f.x, f.y, C.orange, 18, 240);
                sh = Math.max(sh, 2);
                beep(500 + chain * 40, 700 + chain * 40, 0.06, 'square', 0.06);
              }
              break;
            }
          }
        }
        for (const f of foes) {
          if (f.hp > 0 && inv <= 0 && dist(f.x, f.y, px, H() - 170) < 26) {
            f.hp = 0; hp--; inv = 1.2; sh = 9; chain = 0;
            fxBurst(parts, px, H() - 170, C.red, 22, 230); beep(160, 60, 0.2, 'sawtooth', 0.15);
            if (hp <= 0) { E.lose('Ship overrun'); return; }
          }
          if (f.hp > 0 && f.y > H() + 20) f.hp = 0;
        }
        shots = shots.filter(s => !s.hit && s.y > -20);
        foes = foes.filter(f => f.hp > 0);
        for (const p of pops) p.t -= dt;
        pops = pops.filter(p => p.t > 0);
        fxUpdate(parts, dt, 0);
        hud('Score ' + score + '/' + g.goal + '  Chain ' + chain + '  HP ' + hp);
        if (score >= g.goal) E.win();
      },
      draw() {
        const [ox, oy] = jit(sh);
        ctx2d.save(); ctx2d.translate(ox, oy);
        sky('#0a0410', '#23092a');
        drawStars(stars, '#ffd9f0');
        for (const f of foes) glowDot(f.x, f.y, 12, f.hp > 1 ? C.purple : C.orange);
        for (const s of shots) glowDot(s.x, s.y, 3, C.yellow);
        fxDraw(parts);
        for (const p of pops) text(p.s, p.x, p.y - (0.9 - p.t) * 40, 14, C.gold, 'center');
        if (inv <= 0 || Math.floor(t * 12) % 2 === 0) shipShape(px, H() - 170, C.pink, 1);
        ctx2d.restore();
        bar(W() / 2 - 60, H() - 240, 120, 6, chain / 6, C.pink);
        text('Chain 6+ then B: blast  •  x' + mult() + ' points', W() / 2, H() - 255, 12, 'rgba(255,255,255,0.65)', 'center');
      },
      stop() {}
    };
  }

  /* ---------- 6. Ricochet Scrap: bouncing shots break splitting asteroids ---------- */
  function gameRicochet(g) {
    const E = ender(g);
    let aim = -Math.PI / 2, hp = 3, kills = 0, inv = 0, t = 0, spawn = 0, sh = 0;
    let shots = [], rocks = [], parts = [], stars = starField(35);
    const PX = W() / 2, PY = H() - 170;
    function mkRock(x, y, r, vx) {
      const pts = [];
      const n = 8;
      for (let i = 0; i < n; i++) { const a = (i / n) * T2; const k = rand(0.75, 1.1); pts.push([Math.cos(a) * r * k, Math.sin(a) * r * k]); }
      return { x, y, r, hp: r > 22 ? 3 : 1, vx, vy: rand(25, 45), pts, rot: rand(0, 6), spin: rand(-1, 1) };
    }
    return {
      update(dt) {
        if (E.over) return;
        t += dt; inv -= dt; spawn -= dt; sh = Math.max(0, sh - dt * 20);
        aim = clamp(aim + AX() * 2.2 * dt, -Math.PI + 0.25, -0.25);
        if (pressed('a') && shots.length < 4) shots.push({ x: PX, y: PY, vx: Math.cos(aim) * 430, vy: Math.sin(aim) * 430, b: 0, life: 6 });
        stepStars(stars, dt, 30);
        if (spawn <= 0) {
          spawn = Math.max(0.9, 1.5 - kills * 0.02);
          rocks.push(mkRock(rand(40, W() - 40), -40, 34, rand(-30, 30)));
        }
        for (const s of shots) {
          s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
          if (s.x < 5 || s.x > W() - 5) { s.vx = -s.vx; s.x = clamp(s.x, 5, W() - 5); s.b++; beep(700, 500, 0.03, 'triangle', 0.05); }
          if (s.y < 80) { s.vy = Math.abs(s.vy); s.y = 80; s.b++; }
          if (s.b > 4 || s.life <= 0) s.dead = true;
        }
        for (const r of rocks) {
          r.x += r.vx * dt; r.y += r.vy * dt; r.rot += r.spin * dt;
          if (r.x < r.r || r.x > W() - r.r) r.vx = -r.vx;
          if (r.hp <= 0) continue;
          for (const s of shots) {
            if (s.dead || s.hit) continue;
            if (dist(s.x, s.y, r.x, r.y) < r.r + 4) {
              s.hit = true; r.hp--; fxBurst(parts, s.x, s.y, C.lime, 6, 140);
              if (r.hp <= 0) {
                kills++; sh = 2; fxBurst(parts, r.x, r.y, C.orange, 24, 260);
                if (r.r > 22) {
                  rocks.push(mkRock(r.x - 10, r.y, 18, -r.vx * 1.4 - 20), mkRock(r.x + 10, r.y, 18, -r.vx * 1.4 + 20));
                }
              }
              break;
            }
          }
          if (r.hp > 0 && r.y > PY - 10 && inv <= 0) {
            r.hp = 0; hp--; inv = 1.2; sh = 9; fxBurst(parts, PX, PY, C.red, 24, 240); beep(160, 60, 0.2, 'sawtooth', 0.15);
            if (hp <= 0) { E.lose('Rock hit the base'); return; }
          }
          if (r.hp > 0 && r.y > H() + 60) r.hp = 0;
        }
        shots = shots.filter(s => !s.dead && !s.hit);
        rocks = rocks.filter(r => r.hp > 0);
        fxUpdate(parts, dt, 0);
        hud('Rocks ' + kills + '/' + g.goal + '  HP ' + hp);
        if (kills >= g.goal) E.win();
      },
      draw() {
        const [ox, oy] = jit(sh);
        ctx2d.save(); ctx2d.translate(ox, oy);
        sky('#03080c', '#0b1a22');
        drawStars(stars, '#b8fff0');
        strokeCircle(PX, PY, 2, C.cyan, 1);
        for (let i = 0; i < 3; i++) line(PX, PY, PX + Math.cos(aim) * (30 + i * 16), PY + Math.sin(aim) * (30 + i * 16), 'rgba(168,255,92,' + (0.7 - i * 0.2).toFixed(2) + ')', 2);
        for (const r of rocks) {
          if (r.hp <= 0) continue;
          ctx2d.save(); ctx2d.translate(r.x, r.y); ctx2d.rotate(r.rot);
          polygon(r.pts.map(p => [p[0], p[1]]), r.r > 22 ? '#6b5a4e' : '#8a7566');
          ctx2d.restore();
          if (r.r > 22) bar(r.x - 16, r.y - r.r - 8, 32, 4, r.hp / 3, C.lime);
        }
        for (const s of shots) glowDot(s.x, s.y, 4, C.lime);
        fxDraw(parts);
        shipShape(PX, PY, C.cyan, 0.9);
        ctx2d.restore();
        text('Joystick: aim  •  A: fire (walls bounce)', W() / 2, H() - 130, 12, 'rgba(255,255,255,0.6)', 'center');
      },
      stop() {}
    };
  }

  /* ---------- 7. Drift Swarm: formations sweep down, divers peel off ---------- */
  function gameSwarm(g) {
    const E = ender(g);
    let px = W() / 2, hp = 3, kills = 0, inv = 0, t = 0, fire = 0, spawn = 0, sh = 0;
    let shots = [], foes = [], parts = [], stars = starField(40);
    function formation(n) {
      const fx = rand(60, W() - 60), kind = randi(0, 2), mem = [];
      for (let i = 0; i < n; i++) {
        let ox = 0, oy = 0;
        if (kind === 0) { ox = (i - (n - 1) / 2) * 34; }                 // line
        else if (kind === 1) { ox = (Math.abs(i - (n - 1) / 2)) * 26 * (i % 2 ? 1 : -1); oy = Math.abs(i - (n - 1) / 2) * -20; } // V
        else { const a = (i / n) * T2; ox = Math.cos(a) * 46; oy = Math.sin(a) * 26; }  // ring
        mem.push({ ox, oy, hp: 1, dive: false, dvx: 0, dvy: 0, alive: true, x: fx + ox, y: -60 + oy });
      }
      return { fx, fy: -60, sp: 70 + Math.min(50, kills * 2), ph: rand(0, 6), mem };
    }
    return {
      update(dt) {
        if (E.over) return;
        t += dt; inv -= dt; fire -= dt; spawn -= dt; sh = Math.max(0, sh - dt * 20);
        px = clamp(px + AX() * 250 * dt, 24, W() - 24);
        stepStars(stars, dt, 60);
        if (fire <= 0) { fire = 0.12; shots.push({ x: px, y: H() - 170 }); }
        if (spawn <= 0) { spawn = Math.max(2.4, 4 - kills * 0.04); foes.push(formation(randi(3, 5))); }
        for (const s of shots) s.y -= 540 * dt;
        for (const F of foes) {
          F.ph += dt * 1.4; F.fy += F.sp * dt;
          const sway = Math.sin(F.ph) * 60;
          for (const m of F.mem) {
            if (!m.alive) continue;
            if (m.dive) {
              const a = Math.atan2(H() - 170 - m.y, px - m.x);
              m.dvx += Math.cos(a) * 260 * dt; m.dvy += Math.sin(a) * 260 * dt;
              const sp = Math.hypot(m.dvx, m.dvy); const cap = 210;
              if (sp > cap) { m.dvx *= cap / sp; m.dvy *= cap / sp; }
              m.x += m.dvx * dt; m.y += m.dvy * dt;
            } else {
              m.x = F.fx + m.ox + sway; m.y = F.fy + m.oy;
              if (Math.random() < 0.05 * dt) m.dive = true; // roughly one diver every ~20 s per member
            }
          }
        }
        for (const s of shots) {
          if (s.hit) continue;
          for (const F of foes) {
            for (const m of F.mem) {
              if (!m.alive) continue;
              if (dist(s.x, s.y, m.x, m.y) < 16) {
                s.hit = true; m.alive = false; kills++; sh = 2;
                fxBurst(parts, m.x, m.y, C.pink, 18, 230);
                break;
              }
            }
            if (s.hit) break;
          }
        }
        for (const F of foes) {
          for (const m of F.mem) {
            if (!m.alive || inv > 0) continue;
            if (dist(m.x, m.y, px, H() - 170) < 22) {
              m.alive = false; hp--; inv = 1.2; sh = 9;
              fxBurst(parts, px, H() - 170, C.red, 22, 230); beep(160, 60, 0.2, 'sawtooth', 0.15);
              if (hp <= 0) { E.lose('Swarm rammed your ship'); return; }
            }
          }
          F.mem = F.mem.filter(m => m.alive && m.y < H() + 40);
        }
        shots = shots.filter(s => !s.hit && s.y > -20);
        foes = foes.filter(F => F.mem.length > 0);
        fxUpdate(parts, dt, 0);
        hud('Downed ' + kills + '/' + g.goal + '  HP ' + hp);
        if (kills >= g.goal) E.win();
      },
      draw() {
        const [ox, oy] = jit(sh);
        ctx2d.save(); ctx2d.translate(ox, oy);
        sky('#0a0214', '#1f0a2e');
        drawStars(stars, '#ffb8e8');
        for (const F of foes) for (const m of F.mem) {
          if (!m.alive) continue;
          glow(m.dive ? C.red : C.pink, 14);
          polygon([[m.x, m.y - 9], [m.x + 9, m.y + 6], [m.x - 9, m.y + 6]], m.dive ? C.red : C.pink);
          unglow();
        }
        for (const s of shots) glowDot(s.x, s.y, 3, C.yellow);
        fxDraw(parts);
        if (inv <= 0 || Math.floor(t * 12) % 2 === 0) shipShape(px, H() - 170, C.cyan, 1);
        ctx2d.restore();
      },
      stop() {}
    };
  }

  /* ---------- 8. Pulse Warden: boss with a timed shield, pulse clears bullets ---------- */
  function gamePulse(g) {
    const E = ender(g);
    const BX = W() / 2, BY = 150;
    const need = Math.max(1, g.goal);
    let px = W() / 2, hp = 3, hits = 0, inv = 0, t = 0, fire = 0, sh = 0, pulseCd = 0, pulseT = 0;
    let shots = [], eb = [], parts = [], stars = starField(40), patT = 0, sweepA = 0, py = H() - 170;
    return {
      update(dt) {
        if (E.over) return;
        t += dt; inv -= dt; fire -= dt; patT -= dt; pulseCd -= dt; pulseT -= dt; sh = Math.max(0, sh - dt * 20);
        px = clamp(px + AX() * 240 * dt, 24, W() - 24);
        py = clamp(py + AY() * 140 * dt, 300, H() - 130);
        stepStars(stars, dt, 40);
        const frac = hits / need;
        const phase = frac < 0.34 ? 3 : frac < 0.67 ? 2 : 1;   // higher phase number = earlier stage
        const open = (t % 4) < 2;                               // shield opens for 2s of every 4s
        if (fire <= 0) { fire = 0.18; shots.push({ x: px, y: py - 16 }); }
        if (pressed('b') && pulseCd <= 0) {
          pulseCd = 7; pulseT = 0.6; eb = []; sh = 3;
          beep(120, 1100, 0.35, 'sine', 0.12);
        }
        if (patT <= 0) {
          if (phase === 3) { patT = 0.9; sweepA += 0.8; for (let k = 0; k < 10; k++) { const a = sweepA + k * (T2 / 10); eb.push({ x: BX, y: BY, vx: Math.cos(a) * 150, vy: Math.sin(a) * 150, r: 5, c: C.pink }); } }
          else if (phase === 2) { patT = 0.8; const base = Math.atan2(py - BY, px - BX); for (let k = -1; k <= 1; k++) { const a = base + k * 0.22; eb.push({ x: BX, y: BY, vx: Math.cos(a) * 230, vy: Math.sin(a) * 230, r: 5, c: C.orange }); } }
          else { patT = 1.6; for (let k = 0; k < 14; k++) { const a = k * (T2 / 14) + t * 0.3; eb.push({ x: BX, y: BY, vx: Math.cos(a) * 120, vy: Math.sin(a) * 120, r: 5, c: C.cyan }); } }
        }
        for (const s of shots) s.y -= 560 * dt;
        for (const b of eb) { b.x += b.vx * dt; b.y += b.vy * dt; }
        for (const s of shots) {
          if (s.hit) continue;
          if (dist(s.x, s.y, BX, BY) < 52) {
            s.hit = true;
            if (open) { hits++; sh = 4; fxBurst(parts, s.x, s.y, C.gold, 24, 240); beep(700, 900, 0.05, 'square', 0.06); }
            else fxBurst(parts, s.x, s.y, C.cyan, 6, 120); // shield sparks
            if (hits >= need) { E.win(); return; }
          }
        }
        for (const b of eb) {
          if (!b.dead && inv <= 0 && dist(b.x, b.y, px, py) < 13) {
            b.dead = true; hp--; inv = 1.2; sh = 9; fxBurst(parts, px, py, C.red, 22, 230); beep(160, 60, 0.2, 'sawtooth', 0.15);
            if (hp <= 0) { E.lose('Warden overwhelmed you'); return; }
          }
        }
        shots = shots.filter(s => !s.hit && s.y > -20);
        eb = eb.filter(b => !b.dead && b.x > -30 && b.x < W() + 30 && b.y > -30 && b.y < H() + 30);
        fxUpdate(parts, dt, 0);
        hud('Boss ' + hits + '/' + need + '  HP ' + hp + '  Pulse ' + (pulseCd > 0 ? Math.ceil(pulseCd) + 's' : 'ready'));
      },
      draw() {
        const [ox, oy] = jit(sh);
        ctx2d.save(); ctx2d.translate(ox, oy);
        sky('#04040f', '#1a0a1f');
        drawStars(stars, '#e0d6ff');
        const open = (t % 4) < 2;
        // boss body: hexagonal hull
        const hull = [];
        for (let i = 0; i < 6; i++) { const a = i * T2 / 6 + Math.PI / 6; hull.push([BX + Math.cos(a) * 46, BY + Math.sin(a) * 40]); }
        glow(C.purple, 18); polygon(hull, '#2a1450'); unglow();
        strokeCircle(BX, BY, 52, 'rgba(169,120,255,0.4)', 2);
        glow(open ? C.gold : C.blue, 22); circle(BX, BY, open ? 16 : 12, open ? C.gold : '#264b7a'); unglow();
        text(open ? 'OPEN' : 'SHIELDED', BX, BY + 64, 12, open ? C.gold : '#7fa8d6', 'center');
        if (pulseT > 0) strokeCircle(px, py, (0.6 - pulseT) * 600, 'rgba(85,230,255,0.7)', 4);
        for (const b of eb) glowDot(b.x, b.y, b.r, b.c);
        for (const s of shots) glowDot(s.x, s.y, 3, C.yellow);
        fxDraw(parts);
        shipShape(px, py, C.white, 1);
        ctx2d.restore();
        text('B: pulse clears bullets (' + (pulseCd > 0 ? Math.ceil(pulseCd) + 's' : 'ready') + ')', W() / 2, H() - 130, 12, 'rgba(255,255,255,0.6)', 'center');
      },
      stop() {}
    };
  }
  /* ---------- registry ---------- */
  return {
    engines: {
      n15_graze: gameGraze,
      n15_prism: gamePrism,
      n15_orbit: gameOrbit,
      n15_lanes: gameLanes,
      n15_chain: gameChain,
      n15_ricochet: gameRicochet,
      n15_swarm: gameSwarm,
      n15_pulse: gamePulse
    },
    minis: [
      { id: 'n15_graze', title: 'Graze Storm', icon: '🌀', cat: 'ACTION', desc: 'Bullet hell: dodge spiral streams and aimed volleys. Get close without touching them to earn grazes. Focus mode slows you for tight gaps.', engine: 'n15_graze', goal: 40 },
      { id: 'n15_prism', title: 'Prism Shmup', icon: '🔺', cat: 'ACTION', desc: 'Shots and enemies come in three colours. Only matching colours hurt enemies, and matching enemy fire is absorbed for points. Swap colour with B.', engine: 'n15_prism', goal: 25 },
      { id: 'n15_orbit', title: 'Orbit Core', icon: '🪐', cat: 'ACTION', desc: 'Your ship rides a ring around a core. Steer around the ring to line up shots with incoming raiders, and keep them from ramming you or reaching the core.', engine: 'n15_orbit', goal: 30 },
      { id: 'n15_lanes', title: 'Lane Runner', icon: '🛣️', cat: 'ACTION', desc: 'Five lanes of descending raiders. Swipe or push the joystick to change lane, shoot automatically, and sweep a whole lane with B every few seconds.', engine: 'n15_lanes', goal: 35 },
      { id: 'n15_chain', title: 'Chain Salvo', icon: '⛓️', cat: 'ACTION', desc: 'Keep kills coming within a short window to build a chain. A longer chain widens your spread and multiplies points. Spend a chain of 6+ on a screen-wide blast with B.', engine: 'n15_chain', goal: 400 },
      { id: 'n15_ricochet', title: 'Ricochet Scrap', icon: '🪨', cat: 'ACTION', desc: 'Aim with the joystick and fire shots that bounce off the walls. Break asteroids, which split into smaller pieces when shattered, before they reach your base.', engine: 'n15_ricochet', goal: 30 },
      { id: 'n15_swarm', title: 'Drift Swarm', icon: '🦠', cat: 'ACTION', desc: 'Formations of mites drift down in lines, Vs and rings. Some peel off and dive at you. Keep moving and shooting to clear every wave.', engine: 'n15_swarm', goal: 45 },
      { id: 'n15_pulse', title: 'Pulse Warden', icon: '👁️', cat: 'ACTION', desc: 'Boss fight. The warden only takes damage while its shield is open. Each attack phase is harder, and the pulse (B) wipes every bullet on screen.', engine: 'n15_pulse', goal: 14 }
    ],
    aaa: []
  };
})();
