window.__AG_fix_04 = (function () {
  // Three upgrades: Cyber Bird (flappy), Mini Golf (golf), Fishing (fishing).
  // Shared helper: give pops and reward coins without ever throwing.
  function reward(n) { try { progress.coins += n; saveProg(); } catch (e) {} }
  function popList(list, dt) { for (const p of list) p.life -= dt; return list.filter(p => p.life > 0); }
  function drawPops(list) {
    for (const p of list) {
      ctx2d.globalAlpha = clamp(p.life, 0, 1);
      text(p.txt, p.x, p.y - (1 - p.life) * 30, 13, p.col, 'center', 800);
    }
    ctx2d.globalAlpha = 1;
  }

  /* ---------- Cyber Bird: gates, moving gaps, shield and slow-mo orbs, perfect threads ---------- */
  function flappyEngine(g) {
    const P = { x: W() * .28, y: H() / 2, vy: 0 };
    let pipes = [], pickups = [], parts = [], pops = [];
    let gates = 0, perfect = 0, t = 0, travel = 0, shieldT = 0, slowT = 0, shake = 0;

    function spawnPipe(x) {
      const moving = gates >= 5 && Math.random() < .45;
      const gap = Math.max(118, 150 - gates * 2);
      const top = rand(110, H() - 300);
      pipes.push({ x, top, base: top, gap, passed: false, hit: false, moving, amp: moving ? rand(18, 46) : 0, ph: rand(0, 6.28) });
      if (Math.random() < .3) pickups.push({ x: x + 110, y: top + gap / 2, kind: Math.random() < .55 ? 'shield' : 'slow' });
    }
    for (let i = 0; i < 3; i++) spawnPipe(W() * .8 + i * 220);

    return {
      update(dt) {
        t += dt;
        const sc = slowT > 0 ? .55 : 1;
        if (slowT > 0) slowT -= dt;
        if (shieldT > 0) shieldT -= dt;
        if (shake > 0) shake -= dt;

        P.vy += 620 * dt;
        if (pressed('a') || pressed('jump') || key(' ')) { P.vy = -235; beep(440, 780, .05, 'square'); fxBurst(parts, P.x - 12, P.y, C.cyan, 4, 60); }
        P.y += P.vy * dt;

        const step = 180 * sc * dt;
        travel += step;
        if (travel >= 220) { travel = 0; spawnPipe(W() + 40); }
        for (const p of pipes) { p.x -= step; if (p.moving) p.top = p.base + Math.sin(p.ph + t * 2.2) * p.amp; }
        for (const k of pickups) k.x -= step;

        for (const p of pipes) {
          if (!p.passed && p.x + 58 < P.x) {
            p.passed = true; gates++;
            const perfectPass = Math.abs(P.y - (p.top + p.gap / 2)) < 14;
            if (perfectPass) { perfect++; gates++; pops.push({ x: P.x + 30, y: P.y - 20, txt: 'PERFECT +1', col: C.gold, life: 1 }); beep(900, 1200, .08, 'triangle', .12); }
            else { pops.push({ x: P.x + 30, y: P.y - 20, txt: '+1', col: C.green, life: .7 }); beep(600, 900, .06, 'sine', .1); }
            fxBurst(parts, P.x, P.y, C.green, 8, 120);
            if (gates >= g.goal) { completeMini(); return; }
          }
          if (!p.hit && P.x + 13 > p.x && P.x - 13 < p.x + 58 && (P.y - 13 < p.top || P.y + 13 > p.top + p.gap)) {
            if (shieldT > 0) {
              shieldT = 0; p.hit = true; shake = .3;
              fxBurst(parts, P.x, P.y, C.blue, 18, 200); beep(200, 120, .2, 'sawtooth');
            } else { miniFail(g, 'You hit one of the pipes.'); return; }
          }
        }
        if (P.y < 60 || P.y > H() - 100) { miniFail(g, 'The bird left the screen.'); return; }

        pickups = pickups.filter(k => {
          if (dist(k.x, k.y, P.x, P.y) < 26) {
            if (k.kind === 'shield') { shieldT = 8; pops.push({ x: P.x, y: P.y - 24, txt: 'SHIELD', col: C.blue, life: 1 }); }
            else { slowT = 4; pops.push({ x: P.x, y: P.y - 24, txt: 'SLOW-MO', col: C.cyan, life: 1 }); }
            beep(700, 1000, .1, 'triangle', .12);
            return false;
          }
          return k.x > -40;
        });
        pipes = pipes.filter(p => p.x > -80);
        pops = popList(pops, dt);
        fxUpdate(parts, dt, 200);
        hud('Gate ' + gates + '/' + g.goal + ' • Perfect ' + perfect + (shieldT > 0 ? ' • Shield' : '') + (slowT > 0 ? ' • Slow-mo' : ''));
      },
      draw() {
        ctx2d.save();
        if (shake > 0) ctx2d.translate(rand(-3, 3) * shake * 4, rand(-3, 3) * shake * 4);
        const bg = ctx2d.createLinearGradient(0, 0, 0, H());
        bg.addColorStop(0, '#05070f'); bg.addColorStop(1, '#17123f');
        ctx2d.fillStyle = bg; ctx2d.fillRect(-20, -20, W() + 40, H() + 40);
        for (let L = 0; L < 2; L++) {
          for (let i = 0; i < 26; i++) {
            const x = (((i * 83 - t * (12 + L * 22)) % W()) + W()) % W();
            circle(x, 80 + ((i * 47 + L * 31) % (H() - 200)), .8 + L * .6, 'rgba(255,255,255,' + (.2 + L * .2) + ')');
          }
        }
        for (let i = 0; i < 9; i++) { // skyline parallax
          const x = i * 56 - ((t * 20) % 56), h = 70 + (i * 37) % 110;
          rect(x, H() - 100 - h, 44, h + 100, '#0d0b2a');
          if (i % 2) rect(x + 12, H() - 100 - h + 14, 6, 6, 'rgba(255,220,120,.6)');
        }
        for (const p of pipes) {
          const col = p.moving ? C.pink : C.green;
          const topH = p.top - 55, botY = p.top + p.gap, botH = H() - 100 - botY;
          ctx2d.save(); ctx2d.shadowColor = col; ctx2d.shadowBlur = 14;
          ctx2d.fillStyle = col;
          if (topH > 0) ctx2d.fillRect(p.x, 55, 58, topH);
          if (botH > 0) ctx2d.fillRect(p.x, botY, 58, botH);
          ctx2d.restore();
          rect(p.x - 5, p.top - 14, 68, 14, '#e8fff3', 4);
          rect(p.x - 5, botY, 68, 14, '#e8fff3', 4);
        }
        for (const k of pickups) {
          const col = k.kind === 'shield' ? C.blue : C.cyan;
          ctx2d.save(); ctx2d.shadowColor = col; ctx2d.shadowBlur = 16;
          circle(k.x, k.y, 14, col); ctx2d.restore();
          text(k.kind === 'shield' ? 'S' : 'T', k.x, k.y + 5, 14, '#000', 'center', 900);
        }
        ctx2d.save();
        ctx2d.translate(P.x, P.y); ctx2d.rotate(clamp(P.vy / 600, -.5, .9));
        const bodyG = ctx2d.createRadialGradient(-4, -5, 3, 0, 0, 18);
        bodyG.addColorStop(0, '#fff6a0'); bodyG.addColorStop(1, '#ff9d2e');
        ctx2d.fillStyle = bodyG; ctx2d.beginPath(); ctx2d.ellipse(0, 0, 17, 14, 0, 0, 6.283); ctx2d.fill();
        ctx2d.fillStyle = 'rgba(255,255,255,.75)'; ctx2d.beginPath();
        ctx2d.ellipse(-4, 2 + Math.sin(t * 30) * 3, 9, 5, -.3, 0, 6.283); ctx2d.fill();
        circle(7, -4, 3.5, '#fff'); circle(8, -4, 1.6, '#111');
        polygon([[14, -2], [24, 2], [14, 6]], C.orange);
        ctx2d.restore();
        if (shieldT > 0) strokeCircle(P.x, P.y, 25, 'rgba(77,163,255,' + (.5 + .3 * Math.sin(t * 12)) + ')', 3);
        fxDraw(parts);
        drawPops(pops);
        ctx2d.restore();
      },
      stop() {}
    };
  }

  /* ---------- Mini Golf: aim by joystick, timed power meter, walls, sand, water, several holes ---------- */
  function golfEngine(g) {
    const R = 9, LIMIT = 10;
    const B = { x: 0, y: 0, vx: 0, vy: 0, moving: false };
    let hole, start, walls, sand, water, sunk = 0, holeStrokes = 0, aim = -Math.PI / 2, t = 0, pw = 0;
    let parts = [];
    const field = () => ({ x0: 36, x1: W() - 36, y0: 100, y1: H() - 170 });

    function layout() {
      const f = field(), mid = (f.y0 + f.y1) / 2;
      start = { x: W() / 2 + rand(-60, 60), y: f.y1 - 30 };
      hole = { x: rand(f.x0 + 70, f.x1 - 70), y: rand(f.y0 + 30, f.y0 + 140), r: 13 };
      walls = [
        { x: rand(f.x0 + 20, f.x1 - 150), y: mid - 90, w: 120, h: 18 },
        { x: rand(f.x0 + 20, f.x1 - 150), y: mid + 60, w: 110, h: 18 }
      ];
      sand = { x: rand(f.x0 + 10, f.x1 - 150), y: mid + 100, w: 140, h: 44 };
      water = { x: rand(f.x0 + 60, f.x1 - 60), y: mid - 10, r: 20 };
    }
    function reset() { B.x = start.x; B.y = start.y; B.vx = 0; B.vy = 0; B.moving = false; }
    function nextHole() { sunk++; holeStrokes = 0; fxBurst(parts, hole.x, hole.y, C.gold, 26, 220); beep(523, 1046, .25, 'triangle', .14); }
    layout(); reset();

    function bounce(rx, ry, rw, rh) {
      const cx = clamp(B.x, rx, rx + rw), cy = clamp(B.y, ry, ry + rh);
      const dx = B.x - cx, dy = B.y - cy, d = Math.hypot(dx, dy);
      if (d >= R || d === 0) return;
      const nx = dx / d, ny = dy / d, vn = B.vx * nx + B.vy * ny;
      if (vn < 0) { B.vx -= 1.7 * vn * nx; B.vy -= 1.7 * vn * ny; beep(320, 240, .03, 'triangle', .08); }
      B.x += nx * (R - d); B.y += ny * (R - d);
    }

    return {
      update(dt) {
        t += dt;
        pw = ((performance.now() / 900) % 2); if (pw > 1) pw = 2 - pw;
        const f = field();
        if (!B.moving) {
          aim += AX() * 2.4 * dt;
          if (pressed('a')) {
            const sp = 80 + pw * 340;
            B.vx = Math.cos(aim) * sp; B.vy = Math.sin(aim) * sp; B.moving = true;
            holeStrokes++; beep(260, 180, .08, 'square', .1);
          }
        } else {
          const inSand = B.x > sand.x && B.x < sand.x + sand.w && B.y > sand.y && B.y < sand.y + sand.h;
          const damp = Math.pow(inSand ? .9 : .987, dt * 60);
          B.x += B.vx * dt; B.y += B.vy * dt; B.vx *= damp; B.vy *= damp;
          if (B.x < f.x0 + R) { B.x = f.x0 + R; B.vx = Math.abs(B.vx) * .7; }
          if (B.x > f.x1 - R) { B.x = f.x1 - R; B.vx = -Math.abs(B.vx) * .7; }
          if (B.y < f.y0 + R) { B.y = f.y0 + R; B.vy = Math.abs(B.vy) * .7; }
          if (B.y > f.y1 - R) { B.y = f.y1 - R; B.vy = -Math.abs(B.vy) * .7; }
          for (const w of walls) bounce(w.x, w.y, w.w, w.h);
          if (dist(B.x, B.y, water.x, water.y) < water.r) {
            holeStrokes++; fxBurst(parts, B.x, B.y, C.blue, 14, 120); beep(200, 80, .25, 'sine', .15);
            toast('Splash! +1 stroke'); reset();
          } else {
            const sp = Math.hypot(B.vx, B.vy);
            if (dist(B.x, B.y, hole.x, hole.y) < hole.r && sp < 190) { nextHole(); if (sunk >= g.goal) { completeMini(); return; } layout(); reset(); }
            else if (sp < 6) { B.moving = false; B.vx = 0; B.vy = 0; }
          }
        }
        if (!B.moving && holeStrokes >= LIMIT) { miniFail(g, 'Out of strokes on this hole.'); return; }
        fxUpdate(parts, dt, 120);
        hud('Holes ' + sunk + '/' + g.goal + ' • Strokes ' + holeStrokes + '/' + LIMIT);
      },
      draw() {
        const f = field(), w = f.x1 - f.x0, h = f.y1 - f.y0;
        clear('#041007');
        const gg = ctx2d.createLinearGradient(0, f.y0, 0, f.y1);
        gg.addColorStop(0, '#1f8a43'); gg.addColorStop(1, '#0f5426');
        ctx2d.fillStyle = gg; ctx2d.fillRect(f.x0, f.y0, w, h);
        for (let x = f.x0; x < f.x1; x += 40) rect(x, f.y0, 20, h, 'rgba(255,255,255,.04)');
        rect(sand.x, sand.y, sand.w, sand.h, '#d9b977', 10);
        circle(water.x, water.y, water.r, '#2a7fd6');
        strokeCircle(water.x, water.y, water.r - 4, 'rgba(180,230,255,.5)', 2);
        for (const wl of walls) { rect(wl.x + 3, wl.y + 5, wl.w, wl.h, 'rgba(0,0,0,.35)'); rect(wl.x, wl.y, wl.w, wl.h, '#8b5a2b', 3); }
        ctx2d.strokeStyle = '#caffd9'; ctx2d.lineWidth = 3; ctx2d.strokeRect(f.x0, f.y0, w, h);
        circle(hole.x, hole.y, hole.r + 3, '#0b2a12');
        circle(hole.x, hole.y, hole.r, '#000');
        line(hole.x, hole.y, hole.x, hole.y - 54, '#eee', 2.5);
        polygon([[hole.x, hole.y - 54], [hole.x + 22, hole.y - 46], [hole.x, hole.y - 38]], C.red);
        if (!B.moving) for (let i = 1; i <= 6; i++) circle(B.x + Math.cos(aim) * i * 26, B.y + Math.sin(aim) * i * 26, 2.2, 'rgba(255,255,255,.7)');
        circle(B.x + 3, B.y + 4, R, 'rgba(0,0,0,.3)');
        circle(B.x, B.y, R, '#fff');
        rect(f.x0, f.y1 + 22, w, 14, 'rgba(255,255,255,.12)', 7);
        rect(f.x0, f.y1 + 22, w * pw, 14, pw > .8 ? C.red : C.gold, 7);
        fxDraw(parts);
      },
      stop() {}
    };
  }

  /* ---------- Fishing: cast, wait for the bite, then hold the reel bar on the fish ---------- */
  function fishingEngine(g) {
    const KINDS = [
      { name: 'Minnow', col: '#9fe870', zone: .17, speed: .9, coins: 1 },
      { name: 'Trout', col: '#ffb36b', zone: .13, speed: 1.2, coins: 2 },
      { name: 'Gold carp', col: C.gold, zone: .1, speed: 1.6, coins: 4 }
    ];
    const MAX_ESCAPES = 5;
    let phase = 'cast', t = 0, power = 0, waitT = 0, biteT = 0, landT = 0, kind = KINDS[0];
    let fish = 0, escapes = 0, catchP = .5, fpos = .5, fdir = 1, fwait = 0, bar = .3, bob = 0;
    let parts = [], pops = [];

    function startWait() {
      waitT = rand(1.2, 3.2) * (1.25 - power * .4);
      phase = 'wait'; beep(330, 220, .12, 'sine', .1);
    }
    function hook() {
      phase = 'reel'; fpos = .5; bar = .3; catchP = .45; fwait = 0;
      beep(660, 990, .1, 'square', .12);
    }

    return {
      update(dt) {
        t += dt;
        bob = Math.sin(t * 2.5) * 3;
        if (phase === 'cast') {
          power = (Math.sin(t * 3.4) + 1) / 2;
          if (pressed('a')) startWait();
        } else if (phase === 'wait') {
          if (pressed('a')) { phase = 'cast'; toast('Too early'); }
          else { waitT -= dt; if (waitT <= 0) {
            const r = Math.random();
            kind = r < .6 ? KINDS[0] : r < .9 ? KINDS[1] : KINDS[2];
            phase = 'bite'; biteT = 1.1; beep(880, 880, .12, 'square', .12);
          } }
        } else if (phase === 'bite') {
          biteT -= dt;
          if (pressed('a')) hook();
          else if (biteT <= 0) { toast('Too slow'); phase = 'cast'; }
        } else if (phase === 'reel') {
          fwait -= dt;
          if (fwait <= 0) { fdir = Math.random() < .5 ? -1 : 1; fwait = rand(.4, 1.1); }
          fpos = clamp(fpos + fdir * kind.speed * .55 * dt, 0, 1);
          if (fpos <= 0 || fpos >= 1) fdir = -fdir;
          if (pressed('a')) bar += .17;
          if (key(' ')) bar += dt * .9;
          bar = clamp(bar - dt * .55, 0, 1);
          if (Math.abs(bar - fpos) < kind.zone) catchP += dt * .42; else catchP -= dt * .3;
          catchP = clamp(catchP, 0, 1);
          if (Math.random() < dt * 3) fxBurst(parts, W() - 60, 110 + (1 - fpos) * (H() - 260), kind.col, 2, 40);
          if (catchP >= 1) {
            fish++; reward(kind.coins);
            pops.push({ x: W() / 2, y: H() / 2 - 40, txt: kind.name + ' +' + kind.coins, col: kind.col, life: 1.2 });
            fxBurst(parts, W() * .62, H() * .42, C.gold, 22, 200); beep(988, 1318, .2, 'triangle', .14);
            phase = 'land'; landT = .9;
            if (fish >= g.goal) { completeMini(); return; }
          } else if (catchP <= 0) {
            escapes++; toast('It got away'); beep(220, 90, .25, 'sawtooth', .12);
            phase = 'cast';
            if (escapes >= MAX_ESCAPES) { miniFail(g, 'Five fish got away.'); return; }
          }
        } else if (phase === 'land') {
          landT -= dt; if (landT <= 0) phase = 'cast';
        }
        pops = popList(pops, dt);
        fxUpdate(parts, dt, 60);
        hud('Fish ' + fish + '/' + g.goal + ' • Escapes ' + escapes + '/' + MAX_ESCAPES + (phase === 'reel' ? ' • ' + kind.name : ''));
      },
      draw() {
        const wy = H() * .42;
        clear('#1b2a4a');
        const sky = ctx2d.createLinearGradient(0, 0, 0, wy);
        sky.addColorStop(0, '#1b2a4a'); sky.addColorStop(1, '#3c5f8a');
        ctx2d.fillStyle = sky; ctx2d.fillRect(0, 0, W(), wy);
        circle(W() * .8, 90, 26, 'rgba(255,240,200,.9)');
        const wg = ctx2d.createLinearGradient(0, wy, 0, H());
        wg.addColorStop(0, '#0c3b5c'); wg.addColorStop(1, '#04141f');
        ctx2d.fillStyle = wg; ctx2d.fillRect(0, wy, W(), H() - wy);
        for (let i = 0; i < 10; i++) {
          const y = wy + 20 + i * 34, x = ((t * 40 + i * 53) % (W() + 60)) - 30;
          line(x, y, x + 40, y, 'rgba(160,230,255,.18)', 2);
        }
        polygon([[0, wy - 30], [W() * .3, wy - 30], [W() * .3, wy + 10], [0, wy + 14]], '#1c4a2a');
        const tipX = W() * .3, tipY = wy - 80, bx = W() * .62, by = wy + 40 + bob + (phase === 'bite' ? Math.sin(t * 40) * 5 : 0);
        circle(tipX - 10, wy - 52, 10, '#f0c08a');
        rect(tipX - 18, wy - 44, 22, 30, '#2d5bd6', 6);
        line(tipX, tipY, bx, by, 'rgba(255,255,255,.7)', 1.5);
        line(tipX - 4, wy - 40, tipX, tipY, '#c9a27a', 4);
        circle(bx, by, 7, C.red); circle(bx, by - 3, 3, '#fff');
        if (phase === 'cast') {
          rect(W() / 2 - 90, H() - 180, 180, 14, 'rgba(255,255,255,.15)', 7);
          rect(W() / 2 - 90, H() - 180, 180 * power, 14, power > .8 ? C.red : C.gold, 7);
          text('CAST', W() / 2, H() - 200, 14, '#ddd', 'center', 800);
        } else if (phase === 'wait') {
          text('waiting...', W() / 2, H() - 160, 16, '#cfe', 'center');
        } else if (phase === 'bite') {
          text('BITE!', W() / 2, H() - 170, 26, C.red, 'center', 900);
        } else if (phase === 'reel') {
          text(kind.name.toUpperCase(), W() / 2, H() - 170, 16, kind.col, 'center', 900);
        }
        // catch meter on the left, tension gauge on the right
        const gh = H() - 260, gy = 110;
        rect(20, gy, 14, gh, 'rgba(255,255,255,.12)', 7);
        rect(20, gy + gh * (1 - catchP), 14, gh * catchP, C.green, 7);
        if (phase === 'reel') {
          const gx = W() - 62;
          rect(gx, gy, 28, gh, 'rgba(255,255,255,.1)', 10);
          const zh = gh * kind.zone * 2;
          rect(gx, gy + gh * (1 - fpos) - zh / 2, 28, zh, 'rgba(120,255,160,.5)');
          circle(gx + 14, gy + gh * (1 - fpos), 8, kind.col);
          rect(gx - 6, gy + gh * (1 - bar) - 3, 40, 6, '#fff', 3);
        }
        fxDraw(parts);
        drawPops(pops);
      },
      stop() {}
    };
  }

  const minis = [
    { id: 'flappy', title: 'Cyber Bird', icon: '🐤', cat: 'ARCADE', engine: 'flappy', goal: 15,
      desc: 'Tap to flap through the gaps. Blue shields block one hit, cyan slow-mo orbs, perfect threads count double.' },
    { id: 'golf', title: 'Mini Golf', icon: '⛳', cat: 'SPORTS', engine: 'golf', goal: 1,
      desc: 'Aim with the joystick, time the power meter, sink it in 10 strokes or fewer. Mind the walls, sand and water.' },
    { id: 'fishing', title: 'Fishing', icon: '🎣', cat: 'ARCADE', engine: 'fishing', goal: 8,
      desc: 'Cast, wait for the bite, then keep the reel bar on the fish. Five escapes and the line snaps.' }
  ];

  return {
    engines: { flappy: flappyEngine, golf: golfEngine, fishing: fishingEngine },
    minis,
    aaa: []
  };
})();
