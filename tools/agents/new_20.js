window.__AG_new_20 = (function () {
  // Pet care set: feeding, bathing, fetch, rescue, aquarium, vet, cat play, grooming, tail-wag timing.
  const K = { cream: '#f2c48d', tan: '#c9a27a', grey: '#8d8da8' };

  function sky(top, bot) {
    const g = ctx2d.createLinearGradient(0, 0, 0, H());
    g.addColorStop(0, top); g.addColorStop(1, bot);
    ctx2d.fillStyle = g; ctx2d.fillRect(0, 0, W(), H());
  }
  function bar(x, y, w, h, f, col) {
    rect(x, y, w, h, 'rgba(255,255,255,.12)');
    rect(x, y, w * clamp(f, 0, 1), h, col);
  }
  function glow(col, b) { ctx2d.shadowColor = col; ctx2d.shadowBlur = b; }
  function noglow() { ctx2d.shadowBlur = 0; }
  function hearts(n) { return '♥'.repeat(Math.max(0, n)); }

  // Simple pet face: ears, eyes, nose and a smile or frown. s = scale, origin = body centre.
  function petDraw(x, y, s, col, mood) {
    const c = ctx2d;
    c.save(); c.translate(x, y); c.scale(s, s);
    c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(0, 34, 26, 7, 0, 0, 6.283); c.fill();
    c.fillStyle = col;
    c.beginPath(); c.moveTo(-24, -4); c.lineTo(-31, -28); c.lineTo(-8, -18); c.fill();
    c.beginPath(); c.moveTo(24, -4); c.lineTo(31, -28); c.lineTo(8, -18); c.fill();
    c.beginPath(); c.ellipse(0, 6, 28, 24, 0, 0, 6.283); c.fill();
    c.fillStyle = 'rgba(255,255,255,.2)'; c.beginPath(); c.ellipse(-9, -2, 11, 7, -0.4, 0, 6.283); c.fill();
    c.fillStyle = '#1b1024';
    c.beginPath(); c.arc(-10, 2, 3.6, 0, 6.283); c.arc(10, 2, 3.6, 0, 6.283); c.fill();
    c.fillStyle = '#ff7aa8'; c.beginPath(); c.arc(0, 9, 3.2, 0, 6.283); c.fill();
    c.strokeStyle = '#1b1024'; c.lineWidth = 2; c.beginPath();
    if (mood === 'sad') c.arc(0, 22, 6, 1.15 * Math.PI, 1.85 * Math.PI);
    else c.arc(0, 14, 6, 0.15 * Math.PI, 0.85 * Math.PI);
    c.stroke(); c.restore();
  }

  // ---------- 1. Bowl Catch (feeding) ----------
  const GOOD = [{ e: '🐟', good: true }, { e: '🍖', good: true }, { e: '🍎', good: true }];
  const BAD = [{ e: '🧼', good: false }, { e: '🌶️', good: false }];
  function gCatch(g) {
    const parts = [], items = [];
    const PY = () => H() - 150;
    let px = 0, started = false, caught = 0, lives = 3, timer = 0.6, flash = 0, done = false;
    return {
      update(dt) {
        if (done) return;
        if (!started) { px = W() / 2; started = true; }
        px = clamp(px + AX() * 340 * dt, 30, W() - 30);
        flash = Math.max(0, flash - dt);
        timer -= dt;
        if (timer <= 0) {
          timer = Math.max(0.32, 1.0 - caught * 0.03);
          const k = Math.random() < 0.7 ? pick(GOOD) : pick(BAD);
          items.push({ k, x: rand(30, W() - 30), y: 90, vy: rand(150, 210) + caught * 4 });
        }
        for (let i = items.length - 1; i >= 0; i--) {
          const it = items[i];
          it.y += it.vy * dt;
          if (it.y > PY() - 25 && it.y < PY() + 40 && Math.abs(it.x - px) < 42) {
            items.splice(i, 1);
            if (it.k.good) { caught++; fxBurst(parts, it.x, PY() - 20, C.lime, 12, 160); beep(600, 900, .08, 'sine', .15); }
            else { lives--; flash = .4; fxBurst(parts, it.x, PY() - 20, C.red, 16, 200); beep(220, 110, .25, 'sawtooth', .2); }
          } else if (it.y > H() - 40) {
            items.splice(i, 1);
            if (it.k.good) { lives--; flash = .3; }
          }
        }
        fxUpdate(parts, dt, 240);
        if (lives <= 0) { done = true; miniFail(g, 'Your pet is too upset to eat.'); return; }
        if (caught >= g.goal) { done = true; completeMini(); return; }
        hud(caught + ' / ' + g.goal);
      },
      draw() {
        sky('#243b6b', '#0c1226');
        rect(0, H() - 70, W(), 70, '#2b1f3d');
        ctx2d.fillStyle = '#8a95b8'; ctx2d.beginPath(); ctx2d.ellipse(px, PY() + 36, 44, 10, 0, 0, 6.283); ctx2d.fill();
        petDraw(px, PY(), 1, K.cream, flash > 0 ? 'sad' : 'happy');
        for (const it of items) text(it.k.e, it.x, it.y, 26, '#fff', 'center', 700);
        fxDraw(parts);
        text(hearts(lives), 16, 104, 18, '#ff8fa3', 'left', 800);
        if (flash > 0) rect(0, 0, W(), H(), 'rgba(255,60,90,' + (flash * .4).toFixed(3) + ')');
      }
    };
  }

  // ---------- 2. Mud Bath Scrub (tap to clean) ----------
  function gScrub(g) {
    const parts = [], spots = [];
    let cleaned = 0, cool = 0, done = false;
    const CX = () => W() / 2, CY = () => H() / 2 - 20;
    function spawn() {
      const a = rand(0, 6.283), r = Math.sqrt(Math.random());
      spots.push({ x: CX() + Math.cos(a) * r * 52, y: CY() + 12 + Math.sin(a) * r * 40, hp: 3, rad: rand(15, 22) });
    }
    return {
      pointer(x, y) {
        if (done) return;
        for (let i = spots.length - 1; i >= 0; i--) {
          const s = spots[i];
          if (dist(x, y, s.x, s.y) < s.rad + 12) {
            s.hp--;
            fxBurst(parts, x, y, C.white, 6, 140); beep(880, 660, .04, 'square', .1);
            if (s.hp <= 0) {
              spots.splice(i, 1); cleaned++;
              fxBurst(parts, s.x, s.y, C.cyan, 18, 220); beep(500, 1000, .12, 'sine', .2);
            }
            return;
          }
        }
      },
      update(dt) {
        if (done) return;
        cool -= dt;
        if (cool <= 0) { spawn(); cool = Math.max(0.6, 1.6 - cleaned * 0.03); }
        fxUpdate(parts, dt, -60);
        if (spots.length >= 9) { done = true; miniFail(g, 'The pet got too dirty and ran off.'); return; }
        if (cleaned >= g.goal) { done = true; completeMini(); return; }
        hud(cleaned + ' / ' + g.goal);
      },
      draw() {
        sky('#8fdcff', '#2b6fb8');
        rect(0, H() - 150, W(), 150, 'rgba(255,255,255,.08)');
        const dirty = spots.length / 9;
        petDraw(CX(), CY(), 2, dirty > .5 ? K.tan : K.cream, spots.length > 5 ? 'sad' : 'happy');
        for (const s of spots) {
          circle(s.x, s.y, s.rad * (0.6 + s.hp / 5), '#6b4423');
          circle(s.x - s.rad * .2, s.y - s.rad * .2, s.rad * .35, 'rgba(160,110,60,.7)');
        }
        fxDraw(parts);
        text('Mud spots ' + spots.length + ' / 9', W() / 2, 104, 15, '#fff', 'center', 800);
      }
    };
  }

  // ---------- 3. Fetch Frenzy (swipe to throw, run to catch) ----------
  function gToss(g) {
    const parts = [];
    let dogX = 0, started = false, ball = null, wind = 0, caught = 0, lives = 3, flash = 0, msg = '', msgT = 0, done = false;
    const GY = () => H() - 150;
    function reset() { ball = null; wind = randi(-70, 70); }
    function say(t) { msg = t; msgT = 1.1; }
    reset();
    return {
      swipe(dx, dy) {
        if (done || ball || dy > -25) return;
        ball = { x: dogX + 14, y: GY() - 60, vx: clamp(dx * 2.4, -420, 420), vy: clamp(dy * 4, -1000, -460) };
        beep(300, 600, .1, 'triangle', .15);
      },
      update(dt) {
        if (done) return;
        if (!started) { dogX = W() / 2; started = true; }
        dogX = clamp(dogX + AX() * 360 * dt, 30, W() - 30);
        flash = Math.max(0, flash - dt); msgT = Math.max(0, msgT - dt);
        if (ball) {
          ball.vy += 900 * dt; ball.vx += wind * dt;
          ball.x += ball.vx * dt; ball.y += ball.vy * dt;
          if (ball.x < 12 || ball.x > W() - 12) { ball.x = clamp(ball.x, 12, W() - 12); ball.vx *= -0.5; }
          const gy = GY();
          if (ball.vy > 0 && ball.y >= gy - 30 && ball.y <= gy + 8 && Math.abs(ball.x - dogX) < 40) {
            caught++; fxBurst(parts, ball.x, ball.y, C.gold, 18, 220); beep(520, 880, .12, 'triangle', .25);
            say('Good boy!'); reset();
          } else if (ball.y > gy + 26) {
            lives--; flash = .35; fxBurst(parts, ball.x, gy, C.red, 10, 120); beep(200, 90, .3, 'sawtooth', .2);
            say('Dropped it!'); reset();
          }
        }
        fxUpdate(parts, dt, 200);
        if (lives <= 0) { done = true; miniFail(g, 'Too many balls lost, the dog gave up.'); return; }
        if (caught >= g.goal) { done = true; completeMini(); return; }
        hud(caught + ' / ' + g.goal);
      },
      draw() {
        const gy = GY();
        sky('#ffb36b', '#3d2459');
        ctx2d.fillStyle = '#5a3d7a'; ctx2d.beginPath(); ctx2d.moveTo(0, gy);
        for (let x = 0; x <= W(); x += 40) ctx2d.lineTo(x, gy - 40 - Math.sin(x * .03) * 18);
        ctx2d.lineTo(W(), gy); ctx2d.closePath(); ctx2d.fill();
        const gg = ctx2d.createLinearGradient(0, gy, 0, H());
        gg.addColorStop(0, '#3fa865'); gg.addColorStop(1, '#1f5a36');
        ctx2d.fillStyle = gg; ctx2d.fillRect(0, gy, W(), H() - gy);
        petDraw(dogX, gy - 30, 1, K.tan, flash > 0 ? 'sad' : 'happy');
        const bx = ball ? ball.x : dogX + 14, by = ball ? ball.y : gy - 60;
        glow(C.yellow, 12); circle(bx, by, 8, C.yellow); noglow();
        fxDraw(parts);
        const arrows = (wind > 0 ? '→' : '←').repeat(Math.max(1, Math.round(Math.abs(wind) / 25)));
        text('Wind ' + arrows, W() / 2, 104, 15, '#fff', 'center', 800);
        text(hearts(lives), 16, 104, 18, '#ff8fa3', 'left', 800);
        if (msgT > 0) text(msg, W() / 2, 170, 22, 'rgba(255,255,255,' + Math.min(1, msgT).toFixed(2) + ')', 'center', 900);
        if (flash > 0) rect(0, 0, W(), H(), 'rgba(255,60,90,' + (flash * .3).toFixed(3) + ')');
      }
    };
  }

  // ---------- 4. Puppy Search (flashlight in the dark) ----------
  function gRescue(g) {
    const parts = [], pups = [], wolves = [];
    const R = 120;
    let px = 0, py = 0, started = false, rescued = 0, lives = 3, inv = 0, flash = 0, clock = 0, done = false;
    const mkWolf = () => ({ x: rand(40, W() - 40), y: rand(120, H() - 160), vx: 0, vy: 0, t: 0 });
    const mkPup = () => ({ x: rand(30, W() - 30), y: rand(110, H() - 150), ph: rand(0, 6) });
    return {
      update(dt) {
        if (done) return;
        if (!started) { px = W() / 2; py = H() / 2; started = true; }
        clock += dt;
        while (pups.length < 6) pups.push(mkPup());
        const want = Math.min(5, 1 + Math.floor(rescued / 4));
        while (wolves.length < want) wolves.push(mkWolf());
        px = clamp(px + AX() * 200 * dt, 20, W() - 20);
        py = clamp(py + AY() * 200 * dt, 100, H() - 130);
        inv = Math.max(0, inv - dt); flash = Math.max(0, flash - dt);
        for (let i = pups.length - 1; i >= 0; i--) {
          const p = pups[i];
          if (dist(px, py, p.x, p.y) < 30) {
            pups.splice(i, 1); rescued++;
            fxBurst(parts, p.x, p.y, C.pink, 18, 200); beep(700, 1100, .1, 'sine', .2);
          }
        }
        for (const w of wolves) {
          const d = Math.max(1, dist(px, py, w.x, w.y));
          if (d < 240) {
            const sp = 60 + rescued * 2;
            w.x += (px - w.x) / d * sp * dt; w.y += (py - w.y) / d * sp * dt;
          } else {
            w.t -= dt;
            if (w.t <= 0) { w.vx = rand(-45, 45); w.vy = rand(-45, 45); w.t = rand(1, 2.5); }
            w.x = clamp(w.x + w.vx * dt, 20, W() - 20); w.y = clamp(w.y + w.vy * dt, 100, H() - 130);
          }
          if (d < 26 && inv <= 0) {
            lives--; inv = 1.2; flash = .4;
            fxBurst(parts, px, py, C.red, 16, 200); beep(150, 80, .35, 'sawtooth', .25);
          }
        }
        fxUpdate(parts, dt, 0);
        if (lives <= 0) { done = true; miniFail(g, 'The wolves caught the puppy finder.'); return; }
        if (rescued >= g.goal) { done = true; completeMini(); return; }
        hud(rescued + ' / ' + g.goal);
      },
      draw() {
        ctx2d.fillStyle = '#0b1a12'; ctx2d.fillRect(0, 0, W(), H());
        for (let i = 0; i < 70; i++) { ctx2d.fillStyle = 'rgba(80,160,100,.18)'; ctx2d.fillRect((i * 97) % W(), (i * 151) % H(), 3, 3); }
        for (const p of pups) {
          const y = p.y + Math.sin(clock * 3 + p.ph) * 3;
          circle(p.x, y, 16, 'rgba(255,220,160,.15)');
          petDraw(p.x, y, .32, '#e9c9a0', 'happy');
        }
        for (const w of wolves) text('🐺', w.x, w.y + 8, 30, '#fff', 'center');
        const gr = ctx2d.createRadialGradient(px, py, 0, px, py, R);
        gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(.3, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.97)');
        ctx2d.fillStyle = gr; ctx2d.fillRect(0, 0, W(), H());
        circle(px, py, R * .9, 'rgba(255,230,160,.04)');
        petDraw(px, py, .5, K.cream, flash > 0 ? 'sad' : 'happy');
        for (const w of wolves) {
          const d = dist(px, py, w.x, w.y);
          if (d < 260) {
            const a = (1 - d / 260).toFixed(2);
            circle(w.x - 5, w.y, 2.2, 'rgba(255,40,40,' + a + ')');
            circle(w.x + 5, w.y, 2.2, 'rgba(255,40,40,' + a + ')');
          }
        }
        fxDraw(parts);
        text(hearts(lives), 16, 104, 18, '#ff8fa3', 'left', 800);
        if (flash > 0) rect(0, 0, W(), H(), 'rgba(255,60,90,' + (flash * .25).toFixed(3) + ')');
      }
    };
  }

  // ---------- 5. Tank Keeper (survive by cleaning algae and feeding) ----------
  function gTank(g) {
    const parts = [], fish = [];
    const COLS = 6, ROWS = 5;
    const algae = new Array(COLS * ROWS).fill(false);
    const TX = 24, TY = 120;
    const TW = () => W() - 48, TH = () => H() - 330;
    const cellXY = (i) => ({ x: TX + (i % COLS) * (TW() / COLS), y: TY + Math.floor(i / COLS) * (TH() / ROWS) });
    const algaeCount = () => algae.filter(Boolean).length;
    let started = false, t = 0, hunger = 30, stress = 0, done = false;
    function drawFish(f) {
      const dir = f.vx >= 0 ? 1 : -1;
      ctx2d.save(); ctx2d.translate(f.x, f.y); ctx2d.scale(dir, 1);
      ctx2d.fillStyle = stress > 60 ? '#ff7a5c' : '#ffb347';
      ctx2d.beginPath(); ctx2d.ellipse(0, 0, 18, 10, 0, 0, 6.283); ctx2d.fill();
      ctx2d.beginPath(); ctx2d.moveTo(-16, 0); ctx2d.lineTo(-30, -9 + Math.sin(f.ph * 3) * 3); ctx2d.lineTo(-30, 9); ctx2d.fill();
      circle(8, -2, 2.2, '#111');
      ctx2d.restore();
    }
    return {
      pointer(x, y) {
        if (done) return;
        const cw = TW() / COLS, ch = TH() / ROWS;
        const c = Math.floor((x - TX) / cw), r = Math.floor((y - TY) / ch);
        if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return;
        const i = r * COLS + c;
        if (algae[i]) {
          algae[i] = false;
          const p = cellXY(i);
          fxBurst(parts, p.x + cw / 2, p.y + ch / 2, C.lime, 14, 180); beep(900, 1200, .06, 'sine', .12);
        }
      },
      update(dt) {
        if (done) return;
        if (!started) {
          started = true;
          for (let k = 0; k < 3; k++) fish.push({ x: W() / 2 + rand(-80, 80), y: H() / 2 + rand(-40, 40), vx: rand(40, 80) * (k % 2 ? 1 : -1), ph: rand(0, 6) });
        }
        t += dt;
        hunger = Math.min(100, hunger + 3.5 * dt);
        if (pressed('a') && hunger > 0) {
          hunger = Math.max(0, hunger - 40);
          fxBurst(parts, W() / 2, TY + 20, C.yellow, 14, 150); beep(500, 700, .08, 'triangle', .15);
        }
        if (Math.random() < dt * (0.5 + t * 0.01) && algaeCount() < 24) {
          for (let k = 0; k < 12; k++) { const i = randi(0, COLS * ROWS - 1); if (!algae[i]) { algae[i] = true; break; } }
        }
        const bad = Math.max(0, algaeCount() - 3) * 1.2 + Math.max(0, hunger - 60) * 0.15;
        stress = bad > 0 ? Math.min(100, stress + bad * dt) : Math.max(0, stress - 4 * dt);
        for (const f of fish) {
          f.x += f.vx * dt * (1 + stress / 100); f.ph += dt * 2;
          if (f.x < TX + 24 || f.x > TX + TW() - 24) { f.vx = -f.vx; f.x = clamp(f.x, TX + 24, TX + TW() - 24); }
          f.y = clamp(f.y + Math.sin(f.ph) * 12 * dt, TY + 30, TY + TH() - 30);
        }
        fxUpdate(parts, dt, 0);
        if (stress >= 100) { done = true; miniFail(g, 'Your fish gave up. Keep the algae off the glass and feed them.'); return; }
        if (t >= g.goal) { done = true; completeMini(); return; }
        hud(Math.floor(t) + ' / ' + g.goal);
      },
      draw() {
        sky('#0d3b4f', '#06202c');
        const cw = TW() / COLS, ch = TH() / ROWS;
        rect(TX, TY, TW(), TH(), 'rgba(90,200,230,.14)');
        for (let i = 0; i < COLS * ROWS; i++) {
          if (!algae[i]) continue;
          const p = cellXY(i);
          circle(p.x + cw / 2, p.y + ch / 2, Math.min(cw, ch) * .36, '#3ea84a');
          circle(p.x + cw * .35, p.y + ch * .6, 6, '#6fdc6f');
        }
        for (const f of fish) drawFish(f);
        fxDraw(parts);
        ctx2d.strokeStyle = 'rgba(180,240,255,.5)'; ctx2d.lineWidth = 3; ctx2d.strokeRect(TX, TY, TW(), TH());
        const sy = H() - 175;
        text('Stress', 24, sy + 11, 13, '#fff', 'left', 800);
        bar(96, sy, W() - 120, 12, stress / 100, stress > 60 ? C.red : C.orange);
        text('Hunger (A feeds)', 24, sy + 37, 13, '#fff', 'left', 800);
        bar(96, sy + 26, W() - 120, 12, hunger / 100, C.yellow);
      }
    };
  }

  // ---------- 6. Vet Triage (match the treatment) ----------
  function gTriage(g) {
    const parts = [];
    const CASES = [{ e: '🩹', n: 'Scraped paw', t: 0 }, { e: '🌡️', n: 'Hot nose', t: 1 }, { e: '🤧', n: 'Sniffles', t: 2 }];
    const TOOLS = [{ e: '🩹', n: 'Bandage' }, { e: '🌡️', n: 'Thermometer' }, { e: '💊', n: 'Medicine' }];
    let cur = null, pat = 0, maxPat = 10, treated = 0, lives = 3, flash = 0, done = false;
    function next() { cur = pick(CASES); maxPat = Math.max(4.5, 10 - treated * 0.25); pat = maxPat; }
    function treat(i) {
      if (done) return;
      if (i === cur.t) {
        treated++; fxBurst(parts, W() / 2, 210, C.lime, 22, 240); beep(700, 1000, .1, 'sine', .2); next();
      } else {
        lives--; flash = .4; fxBurst(parts, W() / 2, 210, C.red, 14, 200); beep(200, 120, .25, 'sawtooth', .2);
      }
    }
    next();
    return {
      pointer(x, y) {
        const top = H() - 200, bw = (W() - 20) / 3;
        if (y >= top && y <= top + 84) treat(clamp(Math.floor((x - 10) / bw), 0, 2));
      },
      update(dt) {
        if (done) return;
        flash = Math.max(0, flash - dt);
        if (pressed('a')) treat(0);
        if (pressed('b')) treat(1);
        if (pressed('c')) treat(2);
        pat -= dt;
        if (pat <= 0) { lives--; flash = .4; next(); }
        fxUpdate(parts, dt, 120);
        if (lives <= 0) { done = true; miniFail(g, 'The clinic closed early.'); return; }
        if (treated >= g.goal) { done = true; completeMini(); return; }
        hud(treated + ' / ' + g.goal);
      },
      draw() {
        sky('#d8f2ff', '#8fc3e6');
        rect(20, 112, W() - 40, 196, 'rgba(255,255,255,.85)');
        petDraw(W() / 2, 200, 1.1, K.cream, flash > 0 ? 'sad' : 'happy');
        text(cur.e, W() / 2 + 84, 150, 34, '#000', 'center');
        text(cur.n, W() / 2, 292, 20, '#1c2a3a', 'center', 800);
        bar(40, 302, W() - 80, 8, pat / maxPat, pat / maxPat > .4 ? C.lime : C.red);
        const bw = (W() - 20) / 3;
        for (let i = 0; i < 3; i++) {
          const x = 10 + i * bw + 3, y = H() - 200;
          rect(x, y, bw - 6, 84, 'rgba(255,255,255,.8)');
          text(TOOLS[i].e, x + (bw - 6) / 2, y + 38, 30, '#fff', 'center');
          text(TOOLS[i].n, x + (bw - 6) / 2, y + 72, 12, '#1c2a3a', 'center', 800);
        }
        fxDraw(parts);
        text(hearts(lives), 16, 96, 18, '#ff8fa3', 'left', 800);
        if (flash > 0) rect(0, 0, W(), H(), 'rgba(255,60,90,' + (flash * .25).toFixed(3) + ')');
      }
    };
  }

  // ---------- 7. Laser Pounce (cat chases a moving dot) ----------
  function gPounce(g) {
    const parts = [], trail = [];
    const dot = { x: 0, y: 0 };
    let cx = 0, cy = 0, tx = 0, ty = 0, started = false, lunge = 0, retarget = 0, caught = 0, misses = 0, flash = 0, done = false;
    function newTarget() { tx = rand(40, W() - 40); ty = rand(120, H() - 160); retarget = rand(0.7, 1.4); }
    function jump() { dot.x = rand(40, W() - 40); dot.y = rand(120, H() - 160); tx = dot.x; ty = dot.y; retarget = rand(0.5, 1); }
    return {
      update(dt) {
        if (done) return;
        if (!started) {
          started = true; cx = W() / 2; cy = H() / 2; dot.x = cx; dot.y = cy; newTarget();
        }
        cx = clamp(cx + AX() * 320 * dt, 24, W() - 24);
        cy = clamp(cy + AY() * 320 * dt, 110, H() - 150);
        lunge = Math.max(0, lunge - dt * 4); flash = Math.max(0, flash - dt);
        retarget -= dt;
        if (retarget <= 0) newTarget();
        const sp = (220 + caught * 8) * dt;
        const dd = dist(dot.x, dot.y, tx, ty);
        if (dd > 2) { const m = Math.min(dd, sp); dot.x += (tx - dot.x) / dd * m; dot.y += (ty - dot.y) / dd * m; }
        trail.push({ x: dot.x, y: dot.y }); if (trail.length > 14) trail.shift();
        if (pressed('a')) {
          lunge = 1;
          if (dist(cx, cy, dot.x, dot.y) < 50) {
            caught++; fxBurst(parts, dot.x, dot.y, C.pink, 20, 240); beep(800, 1200, .1, 'sine', .2); jump();
          } else {
            misses++; flash = .35; beep(220, 140, .2, 'square', .15); fxBurst(parts, cx, cy, C.white, 6, 120);
          }
        }
        fxUpdate(parts, dt, 0);
        if (misses >= 5) { done = true; miniFail(g, 'The cat got bored and wandered off.'); return; }
        if (caught >= g.goal) { done = true; completeMini(); return; }
        hud(caught + ' / ' + g.goal);
      },
      draw() {
        sky('#2b2440', '#120d1f');
        ctx2d.globalCompositeOperation = 'lighter';
        for (let i = 0; i < trail.length; i++) {
          const p = trail[i], f = (i + 1) / trail.length;
          circle(p.x, p.y, 1 + f * 4, 'rgba(255,60,80,' + (f * .5).toFixed(2) + ')');
        }
        ctx2d.globalCompositeOperation = 'source-over';
        glow(C.red, 14); circle(dot.x, dot.y, 6, '#ff5570'); noglow();
        petDraw(cx, cy, 1 + lunge * 0.25, K.grey, flash > 0 ? 'sad' : 'happy');
        fxDraw(parts);
        text('Misses ' + misses + ' / 5', 16, 104, 15, '#fff', 'left', 800);
      }
    };
  }

  // ---------- 8. Pet Salon (dress the customer) ----------
  const SLOTS = [
    { name: 'Hat', opts: [{ n: 'none' }, { n: 'top hat', e: '🎩' }, { n: 'crown', e: '👑' }, { n: 'cap', e: '🧢' }] },
    { name: 'Collar', opts: [{ n: 'none' }, { n: 'red', c: '#ff5570' }, { n: 'blue', c: '#4da3ff' }, { n: 'gold', c: '#ffd15c' }] },
    { name: 'Bow', opts: [{ n: 'none' }, { n: 'pink', c: '#ff4fd8' }, { n: 'green', c: '#55ff9a' }, { n: 'purple', c: '#a978ff' }] }
  ];
  function gSalon(g) {
    const parts = [];
    let want = [0, 0, 0], cur = [0, 0, 0], rounds = 0, lives = 3, limit = 20, left = 20, flash = 0, msg = '', msgT = 0, done = false;
    function say(s) { msg = s; msgT = 1; }
    function next() {
      want = SLOTS.map((s) => randi(0, s.opts.length - 1));
      if (want.every((v) => v === 0)) want[randi(0, 2)] = 1;
      cur = [0, 0, 0];
      limit = Math.max(10, 20 - rounds * 0.8); left = limit;
    }
    function cycle(i) {
      if (done) return;
      cur[i] = (cur[i] + 1) % SLOTS[i].opts.length;
      beep(500 + cur[i] * 80, 600 + cur[i] * 80, .06, 'triangle', .12);
      if (cur.every((v, k) => v === want[k])) {
        rounds++; fxBurst(parts, W() / 2, 300, C.gold, 26, 260); beep(600, 1000, .15, 'triangle', .25);
        say('Stylish!'); next();
      }
    }
    next();
    return {
      pointer(x, y) {
        for (let i = 0; i < 3; i++) {
          const top = H() - 300 + i * 48;
          if (y >= top && y <= top + 42) { cycle(i); return; }
        }
      },
      update(dt) {
        if (done) return;
        flash = Math.max(0, flash - dt); msgT = Math.max(0, msgT - dt);
        if (pressed('a')) cycle(0);
        if (pressed('b')) cycle(1);
        if (pressed('c')) cycle(2);
        left -= dt;
        if (left <= 0) { lives--; flash = .4; say('Too slow!'); next(); }
        fxUpdate(parts, dt, 120);
        if (lives <= 0) { done = true; miniFail(g, 'The salon closed after too many late orders.'); return; }
        if (rounds >= g.goal) { done = true; completeMini(); return; }
        hud(rounds + ' / ' + g.goal);
      },
      draw() {
        sky('#3a2a55', '#15102a');
        const px = W() / 2, py = 330, s = 1.6;
        rect(20, 104, W() - 40, 84, 'rgba(255,255,255,.1)');
        text('Customer wants', px, 128, 14, '#ffe36e', 'center', 800);
        text('Hat: ' + SLOTS[0].opts[want[0]].n + '   Collar: ' + SLOTS[1].opts[want[1]].n, px, 152, 15, '#fff', 'center', 700);
        text('Bow: ' + SLOTS[2].opts[want[2]].n, px, 174, 15, '#fff', 'center', 700);
        bar(40, 186, W() - 80, 6, left / limit, left / limit > .3 ? C.cyan : C.red);
        petDraw(px, py, s, flash > 0 ? '#c9a27a' : K.cream, flash > 0 ? 'sad' : 'happy');
        const collar = SLOTS[1].opts[cur[1]], hat = SLOTS[0].opts[cur[0]], bow = SLOTS[2].opts[cur[2]];
        if (collar.c) {
          ctx2d.strokeStyle = collar.c; ctx2d.lineWidth = 7; ctx2d.beginPath();
          ctx2d.arc(px, py + 20, 40, 0.2 * Math.PI, 0.8 * Math.PI); ctx2d.stroke();
        }
        if (hat.e) text(hat.e, px, py - 62, 42, '#fff', 'center');
        if (bow.c) {
          const bx = px + 34, by = py - 36;
          polygon([[bx, by], [bx - 12, by - 8], [bx - 12, by + 8]], bow.c);
          polygon([[bx, by], [bx + 12, by - 8], [bx + 12, by + 8]], bow.c);
          circle(bx, by, 4, '#fff');
        }
        for (let i = 0; i < 3; i++) {
          const y = H() - 300 + i * 48;
          rect(20, y, W() - 40, 42, 'rgba(255,255,255,.12)');
          text(SLOTS[i].name, 34, y + 27, 16, '#fff', 'left', 700);
          text(SLOTS[i].opts[cur[i]].n, W() - 34, y + 27, 16, '#ffe36e', 'right', 800);
        }
        fxDraw(parts);
        text(hearts(lives), 16, 96, 18, '#ff8fa3', 'left', 800);
        if (msgT > 0) text(msg, px, 290, 20, 'rgba(255,255,255,' + Math.min(1, msgT).toFixed(2) + ')', 'center', 900);
      }
    };
  }

  // ---------- 9. Perfect Wag (timing bar) ----------
  function gWag(g) {
    const parts = [];
    let score = 0, lives = 3, t = 0, zc = .5, zw = .2, flash = 0, msg = '', msgT = 0, done = false;
    function newZone() { zw = Math.max(0.07, 0.2 - score * 0.008); zc = rand(zw / 2 + .05, 1 - zw / 2 - .05); }
    function marker() { const p = (t * (0.7 + score * 0.06)) % 2; return p < 1 ? p : 2 - p; }
    function say(s) { msg = s; msgT = .8; }
    function hit() {
      if (done) return;
      const m = marker();
      if (Math.abs(m - zc) <= zw / 2) {
        score++; newZone(); say('Perfect!');
        fxBurst(parts, W() / 2, H() / 2 - 40, C.gold, 20, 220); beep(700, 1100, .1, 'sine', .2);
      } else {
        lives--; flash = .4; say('Off beat');
        fxBurst(parts, W() / 2, H() / 2 - 40, C.red, 12, 160); beep(200, 120, .25, 'sawtooth', .2);
      }
    }
    newZone();
    return {
      pointer() { hit(); },
      update(dt) {
        if (done) return;
        t += dt; flash = Math.max(0, flash - dt); msgT = Math.max(0, msgT - dt);
        if (pressed('a')) hit();
        fxUpdate(parts, dt, 200);
        if (lives <= 0) { done = true; miniFail(g, 'The tail stopped wagging. Better timing next time.'); return; }
        if (score >= g.goal) { done = true; completeMini(); return; }
        hud(score + ' / ' + g.goal);
      },
      draw() {
        sky('#ffd7a8', '#7a4a7a');
        rect(0, H() - 160, W(), 160, '#4b7a4d');
        const cx = W() / 2, cy = H() / 2;
        const wag = Math.sin(t * (6 + score * 0.4)) * 22;
        ctx2d.strokeStyle = K.tan; ctx2d.lineWidth = 10; ctx2d.lineCap = 'round';
        ctx2d.beginPath(); ctx2d.moveTo(cx + 50, cy + 24);
        ctx2d.quadraticCurveTo(cx + 90, cy - 6 + wag, cx + 104, cy - 30 + wag);
        ctx2d.stroke();
        petDraw(cx, cy, 1.9, flash > 0 ? K.tan : K.cream, flash > 0 ? 'sad' : 'happy');
        const tx0 = 30, tw = W() - 60, ty0 = H() - 190;
        rect(tx0, ty0, tw, 28, 'rgba(255,255,255,.14)');
        rect(tx0 + (zc - zw / 2) * tw, ty0, zw * tw, 28, 'rgba(80,255,150,.55)');
        const mx = tx0 + marker() * tw;
        glow(C.white, 10); rect(mx - 3, ty0 - 8, 6, 44, '#ffffff'); noglow();
        fxDraw(parts);
        text('Perfect ' + score + ' / ' + g.goal, W() / 2, 104, 16, '#fff', 'center', 800);
        text(hearts(lives), 16, 130, 18, '#ff8fa3', 'left', 800);
        if (msgT > 0) text(msg, W() / 2, 170, 22, 'rgba(255,255,255,' + Math.min(1, msgT).toFixed(2) + ')', 'center', 900);
      }
    };
  }

  const ENGINES = {
    n20_catch: gCatch,
    n20_scrub: gScrub,
    n20_toss: gToss,
    n20_rescue: gRescue,
    n20_tank: gTank,
    n20_triage: gTriage,
    n20_pounce: gPounce,
    n20_salon: gSalon,
    n20_wag: gWag
  };

  const MINIS = [
    { id: 'n20_catch', title: 'Bowl Catch', icon: '🍖', cat: 'ARCADE', engine: 'n20_catch', goal: 15,
      desc: 'Slide the pet under falling food. Catch fish, meat and apples, dodge soap and hot peppers. Three misses and the pet gives up.' },
    { id: 'n20_scrub', title: 'Mud Bath Scrub', icon: '🛁', cat: 'SIMULATION', engine: 'n20_scrub', goal: 20,
      desc: 'Tap the mud spots on the pet to scrub them away. Each spot takes three scrubs. Let nine spots pile up and the pet runs off.' },
    { id: 'n20_toss', title: 'Fetch Frenzy', icon: '🎾', cat: 'SPORT', engine: 'n20_toss', goal: 10,
      desc: 'Swipe up to throw the ball. Run with the joystick to catch it before it hits the grass. Wind pushes the ball around. Three dropped balls end the game.' },
    { id: 'n20_rescue', title: 'Puppy Search', icon: '🔦', cat: 'ACTION', engine: 'n20_rescue', goal: 8,
      desc: 'Walk through a dark field with your flashlight and find lost puppies. Wolves show red eyes in the dark. More wolves appear as you rescue more puppies.' },
    { id: 'n20_tank', title: 'Tank Keeper', icon: '🐠', cat: 'SIMULATION', engine: 'n20_tank', goal: 60,
      desc: 'Keep the fish alive as long as you can. Tap algae to scrub it off the glass and press A to feed. Too much algae or a hungry tank drives stress to the top.' },
    { id: 'n20_triage', title: 'Vet Triage', icon: '🩺', cat: 'QUIZ', engine: 'n20_triage', goal: 12,
      desc: 'Each patient needs one treatment: bandage, thermometer or medicine. Tap the matching tool or press A, B, C. Patience runs out faster as the clinic fills up.' },
    { id: 'n20_pounce', title: 'Laser Pounce', icon: '🐈', cat: 'ACTION', engine: 'n20_pounce', goal: 10,
      desc: 'Steer the cat after the laser dot and press A to pounce. Five misses and the cat gives up. The dot speeds up as you score.' },
    { id: 'n20_salon', title: 'Pet Salon', icon: '🎀', cat: 'PUZZLE', engine: 'n20_salon', goal: 6,
      desc: 'Dress the customer pet to match the order before the timer runs out. Tap a row or press A, B, C to cycle its item. Three late orders close the salon.' },
    { id: 'n20_wag', title: 'Perfect Wag', icon: '🐕', cat: 'RHYTHM', engine: 'n20_wag', goal: 15,
      desc: 'A marker sweeps across the bar. Tap or press A when it is inside the green zone. The zone narrows and the marker speeds up. Three misses end the wag.' }
  ];

  return { engines: ENGINES, minis: MINIS, aaa: [] };
})();
