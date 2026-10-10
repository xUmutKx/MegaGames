// Bubble, balloon and popping games (agent new_12). Engine keys and mini ids: n12_*
window.__AG_new_12 = (function () {
  // ---------- shared drawing and math helpers ----------
  function bgGrad(top, bottom) {
    const gr = ctx2d.createLinearGradient(0, 0, 0, H());
    gr.addColorStop(0, top); gr.addColorStop(1, bottom);
    ctx2d.fillStyle = gr; ctx2d.fillRect(0, 0, W(), H());
  }
  function balloonDraw(x, y, r, c, gold) {
    ctx2d.save();
    ctx2d.beginPath(); ctx2d.moveTo(x, y + r * 1.1);
    ctx2d.quadraticCurveTo(x + 8, y + r + 26, x - 4, y + r + 44);
    ctx2d.strokeStyle = 'rgba(255,255,255,.45)'; ctx2d.lineWidth = 1; ctx2d.stroke();
    ctx2d.beginPath(); ctx2d.ellipse(x, y, r * .86, r, 0, 0, Math.PI * 2);
    if (gold) { ctx2d.shadowBlur = 16; ctx2d.shadowColor = C.gold; }
    ctx2d.fillStyle = c; ctx2d.fill();
    ctx2d.shadowBlur = 0;
    const gr = ctx2d.createRadialGradient(x - r * .35, y - r * .4, r * .05, x, y, r * 1.05);
    gr.addColorStop(0, 'rgba(255,255,255,.75)'); gr.addColorStop(.35, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(0,0,0,.4)');
    ctx2d.fillStyle = gr; ctx2d.fill();
    polygon([[x - 4, y + r * 1.05], [x + 4, y + r * 1.05], [x, y + r * 1.2]], c);
    ctx2d.restore();
  }
  function bubbleDraw(x, y, r, c) {
    ctx2d.save();
    ctx2d.globalAlpha = .28; circle(x, y, r, c);
    ctx2d.globalAlpha = 1; strokeCircle(x, y, r, c, 2);
    circle(x - r * .35, y - r * .35, r * .18, 'rgba(255,255,255,.85)');
    ctx2d.restore();
  }
  function gemDraw(x, y, r, c) {
    circle(x, y, r, c);
    ctx2d.save();
    const gr = ctx2d.createRadialGradient(x - r * .3, y - r * .35, r * .1, x, y, r);
    gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(.45, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(0,0,0,.4)');
    ctx2d.fillStyle = gr; ctx2d.beginPath(); ctx2d.arc(x, y, r, 0, Math.PI * 2); ctx2d.fill();
    ctx2d.restore();
  }
  function starPoly(x, y, r1, r2, n, c, rot) {
    const pts = [];
    for (let i = 0; i < n * 2; i++) {
      const a = (rot || 0) + i * Math.PI / n, rr = i % 2 ? r2 : r1;
      pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
    }
    polygon(pts, c);
  }
  function segDist(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy || 1;
    const t = clamp(((px - ax) * dx + (py - ay) * dy) / L, 0, 1);
    return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
  }
  // floating "+1" style popups: list of {x,y,s,c,t}
  function popAdd(list, x, y, s, c) { list.push({ x: x, y: y, s: s, c: c, t: 0 }); }
  function popStep(list, dt) {
    for (const p of list) { p.t += dt; p.y -= 40 * dt; }
    for (let i = list.length - 1; i >= 0; i--) if (list[i].t > .8) list.splice(i, 1);
  }
  function popDraw(list) {
    for (const p of list) {
      ctx2d.globalAlpha = clamp(1 - p.t / .8, 0, 1);
      text(p.s, p.x, p.y, 16, p.c, 'center', 900);
    }
    ctx2d.globalAlpha = 1;
  }
  function thornWall(x, w, top, bot, edgeY, dir) {
    if (bot - top < 2) return;
    const gr = ctx2d.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
    gr.addColorStop(0, '#2c7a4b'); gr.addColorStop(1, '#14452b');
    ctx2d.fillStyle = gr; ctx2d.fillRect(x - w / 2, top, w, bot - top);
    for (let sx = x - w / 2; sx < x + w / 2; sx += 11)
      polygon([[sx, edgeY], [sx + 5.5, edgeY + dir * 12], [sx + 11, edgeY]], '#d9ff7a');
  }

  // ---------- 1. Sky Archer: aim with the stick, loose arrows at balloons ----------
  function gameSkyArcher(g) {
    const balloons = [], arrows = [], parts = [], txt = [];
    let angle = -Math.PI / 2, ammo = 30, score = 0, spawnT = 0, shake = 0, t = 0;
    const ox = () => W() / 2, oy = () => H() - 150;
    const clampAim = (a) => clamp(a, -Math.PI + .2, -.2);
    function fire(a) {
      if (ammo <= 0) return;
      ammo--;
      arrows.push({ x: ox(), y: oy(), vx: Math.cos(a) * 720, vy: Math.sin(a) * 720 });
      beep(620, 380, .07, 'triangle', .2);
    }
    function spawn() {
      const gold = Math.random() < .12;
      balloons.push({ x: rand(30, W() - 30), y: H() + 40, r: gold ? 20 : rand(17, 23),
        c: gold ? C.gold : randColor(), ph: rand(0, 6.28), gold: gold });
    }
    return {
      pointer(x, y) {
        if (y < oy() - 10) { angle = clampAim(Math.atan2(y - oy(), x - ox())); fire(angle); }
      },
      update(dt) {
        t += dt; shake = Math.max(0, shake - dt * 25);
        angle = clampAim(angle + AX() * 1.9 * dt);
        if (pressed('a')) fire(angle);
        spawnT -= dt;
        if (spawnT <= 0) { spawn(); spawnT = Math.max(.45, 1.15 - score * .015) * rand(.8, 1.2); }
        for (const b of balloons) { b.y -= (55 + score * 1.2) * dt; b.x += Math.sin(t * 2 + b.ph) * 22 * dt; }
        for (let i = balloons.length - 1; i >= 0; i--) if (balloons[i].y < -50) balloons.splice(i, 1);
        for (let i = arrows.length - 1; i >= 0; i--) {
          const a = arrows[i];
          a.x += a.vx * dt; a.y += a.vy * dt;
          let hit = false;
          for (let j = balloons.length - 1; j >= 0 && !hit; j--) {
            const b = balloons[j];
            if (dist(a.x, a.y, b.x, b.y) < b.r + 4) {
              hit = true; balloons.splice(j, 1);
              const before = Math.floor(score / 3), gain = b.gold ? 3 : 1;
              score += gain;
              ammo += Math.floor(score / 3) - before; // every 3 points restores an arrow
              shake = b.gold ? 8 : 4;
              fxBurst(parts, b.x, b.y, b.c, b.gold ? 26 : 14, 220);
              popAdd(txt, b.x, b.y, '+' + gain, C.gold);
              beep(900, 1400, .08, 'sine', .2);
            }
          }
          if (hit || a.x < -20 || a.x > W() + 20 || a.y < 40 || a.y > H()) arrows.splice(i, 1);
        }
        fxUpdate(parts, dt, 120); popStep(txt, dt);
        if (score >= g.goal) { completeMini(); return; }
        if (ammo <= 0 && arrows.length === 0) { miniFail(g, 'Out of arrows. Aim up at the balloons next time!'); return; }
        hud('Pops ' + score + ' / ' + g.goal + '   Arrows ' + ammo);
      },
      draw() {
        bgGrad('#0a1733', '#2b1446');
        ctx2d.save();
        ctx2d.translate(rand(-shake, shake), rand(-shake, shake));
        ctx2d.fillStyle = '#0c2a2a';
        ctx2d.beginPath(); ctx2d.ellipse(W() / 2, H() + 40, W(), 130, 0, 0, Math.PI * 2); ctx2d.fill();
        for (const b of balloons) balloonDraw(b.x, b.y, b.r, b.c, b.gold);
        for (let i = 1; i <= 8; i++) {
          circle(ox() + Math.cos(angle) * i * 34, oy() + Math.sin(angle) * i * 34, 2.5, 'rgba(255,255,255,' + (1 - i / 9) + ')');
        }
        circle(ox(), oy() + 6, 12, '#3a2a18');
        ctx2d.save();
        ctx2d.translate(ox(), oy()); ctx2d.rotate(angle);
        ctx2d.beginPath(); ctx2d.arc(0, 0, 26, -1.2, 1.2);
        ctx2d.strokeStyle = C.orange; ctx2d.lineWidth = 4; ctx2d.stroke();
        line(26 * Math.cos(-1.2), 26 * Math.sin(-1.2), 26 * Math.cos(1.2), 26 * Math.sin(1.2), '#f5e6c8', 1.5);
        ctx2d.restore();
        for (const a of arrows) {
          ctx2d.save();
          ctx2d.translate(a.x, a.y); ctx2d.rotate(Math.atan2(a.vy, a.vx));
          line(-16, 0, 8, 0, '#f5e6c8', 3);
          polygon([[8, -4], [16, 0], [8, 4]], C.gold);
          ctx2d.restore();
        }
        fxDraw(parts);
        ctx2d.restore();
        popDraw(txt);
        text('Aim with the stick, fire with tap or A', W() / 2, 100, 13, 'rgba(255,255,255,.6)', 'center');
      }
    };
  }

  // ---------- 2. Chain Pop: tap connected groups of matching bubbles ----------
  function gameChainPop(g) {
    const COLS = 8, ROWS = 10, Y0 = 110;
    const cs = () => Math.floor(W() / COLS);
    const left = () => (W() - cs() * COLS) / 2;
    const COLORS = () => [C.cyan, C.pink, C.yellow, C.green];
    const parts = [], txt = [];
    let popped = 0, dropT = 14, shake = 0;
    const randRow = () => Array.from({ length: COLS }, () => (Math.random() < .85 ? randi(0, 3) : -1));
    const board = [];
    for (let r = 0; r < ROWS; r++) board.push(r < 5 ? randRow() : new Array(COLS).fill(-1));

    function groupAt(r, c) {
      const v = board[r][c], seen = new Set(), stack = [[r, c]], out = [];
      seen.add(r * COLS + c);
      while (stack.length) {
        const cell = stack.pop(), y = cell[0], x = cell[1];
        out.push(cell);
        const nb = [[y + 1, x], [y - 1, x], [y, x + 1], [y, x - 1]];
        for (const p of nb) {
          const k = p[0] * COLS + p[1];
          if (p[0] < 0 || p[0] >= ROWS || p[1] < 0 || p[1] >= COLS || seen.has(k)) continue;
          if (board[p[0]][p[1]] !== v) continue;
          seen.add(k); stack.push(p);
        }
      }
      return out;
    }
    function hasPair() {
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const v = board[r][c];
        if (v < 0) continue;
        if ((c + 1 < COLS && board[r][c + 1] === v) || (r + 1 < ROWS && board[r + 1][c] === v)) return true;
      }
      return false;
    }
    // bubbles hang from the ceiling: fill gaps by moving each column's bubbles up
    function settle() {
      for (let c = 0; c < COLS; c++) {
        const vals = [];
        for (let r = 0; r < ROWS; r++) if (board[r][c] >= 0) vals.push(board[r][c]);
        for (let r = 0; r < ROWS; r++) board[r][c] = r < vals.length ? vals[r] : -1;
      }
    }
    function ensurePair() {
      for (let i = 0; i < 40 && !hasPair(); i++)
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (board[r][c] >= 0) board[r][c] = randi(0, 3);
    }
    // the ceiling sinks one row; the run ends if bubbles reach the red line
    function sink() {
      if (board[ROWS - 1].some(v => v >= 0)) { miniFail(g, 'The bubbles sank to the red line!'); return false; }
      board.pop(); board.unshift(randRow()); shake = 6;
      return true;
    }
    return {
      pointer(x, y) {
        const s = cs(), c = Math.floor((x - left()) / s), r = Math.floor((y - Y0) / s);
        if (c < 0 || c >= COLS || r < 0 || r >= ROWS || board[r][c] < 0) return;
        const v = board[r][c], grp = groupAt(r, c);
        if (grp.length < 2) { shake = 3; beep(200, 160, .08, 'sawtooth', .15); return; }
        for (const cell of grp) {
          const cx = left() + cell[1] * s + s / 2, cy = Y0 + cell[0] * s + s / 2;
          fxBurst(parts, cx, cy, COLORS()[v], 10, 200);
          board[cell[0]][cell[1]] = -1;
        }
        const bonus = grp.length >= 5 ? 2 : 0;
        popped += grp.length + bonus;
        popAdd(txt, x, y, '+' + (grp.length + bonus), '#ffffff');
        shake = grp.length >= 5 ? 7 : 3;
        beep(520 + grp.length * 40, 780, .12, 'sine', .2);
        settle(); ensurePair();
      },
      update(dt) {
        shake = Math.max(0, shake - dt * 20);
        dropT -= dt;
        if (dropT <= 0) {
          if (!sink()) return;
          dropT = Math.max(6, 14 - popped * .08);
          ensurePair();
        }
        fxUpdate(parts, dt, 40); popStep(txt, dt);
        if (popped >= g.goal) { completeMini(); return; }
        hud('Popped ' + popped + ' / ' + g.goal + '   Next row ' + Math.ceil(dropT) + 's');
      },
      draw() {
        bgGrad('#101a2e', '#05070f');
        const s = cs(), L = left(), cols = COLORS();
        ctx2d.save();
        ctx2d.translate(rand(-shake, shake), rand(-shake, shake));
        line(0, Y0 + ROWS * s + 2, W(), Y0 + ROWS * s + 2, C.red, 2);
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
          const v = board[r][c];
          if (v < 0) continue;
          gemDraw(L + c * s + s / 2, Y0 + r * s + s / 2, s / 2 - 3, cols[v]);
        }
        ctx2d.restore();
        fxDraw(parts); popDraw(txt);
        text('Tap a group of 2 or more to pop it', W() / 2, 92, 13, 'rgba(255,255,255,.6)', 'center');
      }
    };
  }

  // ---------- 3. Bubble Catch: move the cup, catch bubbles, dodge thorns ----------
  function gameBubbleCatch(g) {
    const BW = 84;
    const parts = [], txt = [], items = [];
    let bx = W() / 2, tx = null, lives = 3, caught = 0, spawnT = .5, t = 0, shake = 0;
    const BY = () => H() - 150;
    return {
      pointer(x) { tx = x; },
      update(dt) {
        t += dt; shake = Math.max(0, shake - dt * 25);
        if (Math.abs(AX()) > .05) { bx += AX() * 420 * dt; tx = null; }
        else if (tx !== null) bx += clamp(tx - bx, -420 * dt, 420 * dt);
        bx = clamp(bx, BW / 2, W() - BW / 2);
        spawnT -= dt;
        if (spawnT <= 0) {
          const roll = Math.random();
          const type = roll < .12 ? 'gold' : roll < .3 ? 'thorn' : 'bubble';
          items.push({ x: rand(20, W() - 20), y: 60, type: type, ph: rand(0, 6),
            vy: type === 'thorn' ? rand(170, 230) + caught * 2 : rand(90, 130) + caught,
            c: type === 'gold' ? C.gold : randColor() });
          spawnT = Math.max(.28, .8 - caught * .012) * rand(.8, 1.2);
        }
        for (let i = items.length - 1; i >= 0; i--) {
          const it = items[i];
          it.ph += dt * 3;
          if (it.type !== 'thorn') it.x += Math.sin(it.ph) * 25 * dt;
          it.y += it.vy * dt;
          const inCup = it.y > BY() - 12 && it.y < BY() + 26 && Math.abs(it.x - bx) < BW / 2;
          if (inCup) {
            items.splice(i, 1);
            if (it.type === 'thorn') {
              lives--; shake = 10;
              fxBurst(parts, it.x, it.y, C.red, 20, 200);
              popAdd(txt, it.x, BY() - 20, 'OUCH', C.red);
              beep(180, 90, .3, 'sawtooth', .3);
            } else {
              const v = it.type === 'gold' ? 3 : 1;
              caught += v;
              fxBurst(parts, it.x, it.y, it.c, 12, 160);
              popAdd(txt, it.x, BY() - 20, '+' + v, it.c);
              beep(700, 1100, .06, 'sine', .2);
            }
          } else if (it.y > H()) items.splice(i, 1);
        }
        fxUpdate(parts, dt, 60); popStep(txt, dt);
        if (caught >= g.goal) { completeMini(); return; }
        if (lives <= 0) { miniFail(g, 'The thorns burst too many bubbles.'); return; }
        hud('Caught ' + caught + ' / ' + g.goal + '   Lives ' + lives);
      },
      draw() {
        bgGrad('#0d2440', '#1a0f30');
        ctx2d.save();
        ctx2d.translate(rand(-shake, shake), rand(-shake, shake));
        for (const it of items) {
          if (it.type === 'thorn') {
            starPoly(it.x, it.y, 13, 6, 8, C.red, it.ph);
            circle(it.x, it.y, 4, '#2a0010');
          } else if (it.type === 'gold') {
            gemDraw(it.x, it.y, 10, C.gold);
          } else {
            bubbleDraw(it.x, it.y, 11, it.c);
          }
        }
        const y = BY(), l = bx - BW / 2, r = bx + BW / 2;
        polygon([[l, y], [r, y], [r - 12, y + 26], [l + 12, y + 26]], '#8a5a2b');
        line(l, y, r, y, C.gold, 3);
        ctx2d.restore();
        fxDraw(parts); popDraw(txt);
        text('Catch bubbles, dodge the red thorns', W() / 2, 92, 13, 'rgba(255,255,255,.6)', 'center');
      }
    };
  }

  // ---------- 4. Float Lift: keep the balloon up between thorn walls ----------
  function gameFloatLift(g) {
    const R = 17;
    const walls = [], clouds = [], parts = [], txt = [];
    let y = H() / 2, vy = 0, passed = 0, spawnT = 1, t = 0, shake = 0;
    const bx = () => W() * .3;
    for (let i = 0; i < 6; i++) clouds.push({ x: rand(0, W()), y: rand(90, H() - 200), s: rand(.6, 1.2) });
    const flap = () => { vy = -330; fxBurst(parts, bx(), y + R, C.pink, 2, 60); };
    return {
      pointer() { flap(); },
      update(dt) {
        t += dt; shake = Math.max(0, shake - dt * 25);
        if (pressed('a') || pressed('b') || pressed('c')) flap();
        const held = key(' ') || key('arrowup') || key('w');
        vy += (held ? 420 : 760) * dt;
        y += vy * dt;
        if (y < R + 70) { y = R + 70; vy = 0; }
        if (y > H() - 120 - R) { miniFail(g, 'The balloon sank into the ground.'); return; }
        spawnT -= dt;
        if (spawnT <= 0) {
          const gap = Math.max(130, 180 - passed * 2);
          const gy = rand(gap / 2 + 90, H() - 130 - gap / 2);
          walls.push({ x: W() + 40, w: 46, gy: gy, gap: gap, passed: false });
          spawnT = Math.max(1.1, 1.8 - passed * .03);
        }
        const speed = Math.min(250, 130 + passed * 3);
        for (const w of walls) w.x -= speed * dt;
        for (let i = walls.length - 1; i >= 0; i--) if (walls[i].x < -60) walls.splice(i, 1);
        for (const w of walls) {
          if (!w.passed && w.x + w.w / 2 < bx() - R) {
            w.passed = true; passed++;
            popAdd(txt, bx(), y - 30, 'Nice!', C.cyan);
            beep(660, 880, .08, 'triangle', .2);
          }
          if (bx() + R * .8 > w.x - w.w / 2 && bx() - R * .8 < w.x + w.w / 2) {
            if (y - R * .8 < w.gy - w.gap / 2 || y + R * .8 > w.gy + w.gap / 2) {
              miniFail(g, 'You bumped into a thorn wall.'); return;
            }
          }
        }
        for (const c of clouds) { c.x -= 25 * c.s * dt; if (c.x < -60) c.x = W() + 60; }
        fxUpdate(parts, dt, 0); popStep(txt, dt);
        if (passed >= g.goal) { completeMini(); return; }
        hud('Passed ' + passed + ' / ' + g.goal);
      },
      draw() {
        bgGrad('#2a6fb0', '#0c1d3c');
        ctx2d.save();
        ctx2d.translate(rand(-shake, shake), rand(-shake, shake));
        for (const c of clouds) {
          ctx2d.globalAlpha = .35;
          circle(c.x, c.y, 22 * c.s, '#ffffff'); circle(c.x + 20 * c.s, c.y - 6, 16 * c.s, '#ffffff'); circle(c.x - 18 * c.s, c.y + 4, 14 * c.s, '#ffffff');
          ctx2d.globalAlpha = 1;
        }
        for (const w of walls) {
          thornWall(w.x, w.w, 70, w.gy - w.gap / 2, w.gy - w.gap / 2, 1);
          thornWall(w.x, w.w, w.gy + w.gap / 2, H() - 120, w.gy + w.gap / 2, -1);
        }
        balloonDraw(bx(), y, R + 3, C.pink, false);
        ctx2d.restore();
        fxDraw(parts); popDraw(txt);
        text('Tap, press A or hold Space to float', W() / 2, 92, 13, 'rgba(255,255,255,.7)', 'center');
      }
    };
  }

  // ---------- 5. Slice String: swipe across balloons to cut them, avoid the black bombs ----------
  function gameSliceString(g) {
    const balloons = [], slashes = [], parts = [], txt = [];
    let popped = 0, lives = 3, spawnT = .4, t = 0, shake = 0, sx = null, sy = null;
    function spawn() {
      const roll = Math.random();
      const kind = roll < .14 ? 'bomb' : roll < .26 ? 'gold' : 'norm';
      balloons.push({ x: rand(40, W() - 40), y: H() + 40, r: kind === 'norm' ? rand(18, 24) : 22,
        c: kind === 'bomb' ? '#3b2250' : kind === 'gold' ? C.gold : randColor(),
        kind: kind, ph: rand(0, 6), sp: rand(55, 85) });
    }
    return {
      pointer(x, y) { sx = x; sy = y; },
      swipe(dx, dy) {
        const x0 = sx === null ? W() / 2 : sx, y0 = sy === null ? H() / 2 : sy;
        const x1 = x0 + dx, y1 = y0 + dy;
        slashes.push({ x0: x0, y0: y0, x1: x1, y1: y1, t: 0 });
        for (let i = balloons.length - 1; i >= 0; i--) {
          const b = balloons[i];
          if (segDist(b.x, b.y, x0, y0, x1, y1) < b.r + 3) {
            balloons.splice(i, 1);
            if (b.kind === 'bomb') {
              lives--; shake = 10;
              fxBurst(parts, b.x, b.y, '#9b6bff', 22, 240);
              popAdd(txt, b.x, b.y, 'BOMB!', C.red);
              beep(160, 70, .3, 'sawtooth', .3);
            } else {
              const v = b.kind === 'gold' ? 3 : 1;
              popped += v;
              fxBurst(parts, b.x, b.y, b.c, b.kind === 'gold' ? 26 : 16, 240);
              popAdd(txt, b.x, b.y, '+' + v, b.c);
              shake = Math.max(shake, b.kind === 'gold' ? 6 : 2);
              beep(700, 1100, .07, 'square', .15);
            }
          }
        }
        sx = null; sy = null;
      },
      update(dt) {
        t += dt; shake = Math.max(0, shake - dt * 25);
        spawnT -= dt;
        if (spawnT <= 0) { spawn(); spawnT = Math.max(.5, 1.0 - popped * .01) * rand(.8, 1.2); }
        for (const b of balloons) { b.y -= b.sp * dt; b.x += Math.sin(t * 1.7 + b.ph) * 18 * dt; }
        for (let i = balloons.length - 1; i >= 0; i--) if (balloons[i].y < -60) balloons.splice(i, 1);
        for (let i = slashes.length - 1; i >= 0; i--) { slashes[i].t += dt; if (slashes[i].t > .22) slashes.splice(i, 1); }
        fxUpdate(parts, dt, 60); popStep(txt, dt);
        if (popped >= g.goal) { completeMini(); return; }
        if (lives <= 0) { miniFail(g, 'Three black bombs were sliced.'); return; }
        hud('Popped ' + popped + ' / ' + g.goal + '   Lives ' + lives);
      },
      draw() {
        bgGrad('#1e3a5f', '#0b1222');
        ctx2d.save();
        ctx2d.translate(rand(-shake, shake), rand(-shake, shake));
        for (const b of balloons) {
          balloonDraw(b.x, b.y, b.r, b.c, b.kind === 'gold');
          if (b.kind === 'bomb') text('!', b.x, b.y + 6, 18, C.red, 'center', 900);
        }
        ctx2d.restore();
        for (const s of slashes) {
          ctx2d.save();
          ctx2d.globalAlpha = 1 - s.t / .22;
          line(s.x0, s.y0, s.x1, s.y1, C.cyan, 10);
          line(s.x0, s.y0, s.x1, s.y1, '#ffffff', 3);
          ctx2d.restore();
        }
        fxDraw(parts); popDraw(txt);
        text('Swipe across the balloons to slice them', W() / 2, 92, 13, 'rgba(255,255,255,.6)', 'center');
      }
    };
  }

  // ---------- 6. Hue Match: pop only the balloons that match the target color ----------
  function gameHueMatch(g) {
    const cols = [C.cyan, C.pink, C.yellow, C.green];
    const items = [], parts = [], txt = [];
    let target = 0, switchT = 8, spawnT = .3, lives = 3, matched = 0, shake = 0, t = 0;
    const pickTarget = () => {
      const live = items.map(b => b.ci);
      target = live.length ? pick(live) : randi(0, 3);
    };
    pickTarget();
    return {
      pointer(x, y) {
        let best = -1, bd = 1e9;
        for (let i = 0; i < items.length; i++) {
          const b = items[i], d = dist(x, y, b.x, b.y);
          if (d < b.r + 10 && d < bd) { bd = d; best = i; }
        }
        if (best < 0) return;
        const b = items[best];
        if (b.ci === target) {
          items.splice(best, 1); matched++;
          fxBurst(parts, b.x, b.y, cols[b.ci], 24, 240);
          popAdd(txt, b.x, b.y, '+1', cols[b.ci]);
          beep(880, 1320, .1, 'sine', .25);
          pickTarget();
        } else {
          lives--; shake = 8;
          popAdd(txt, b.x, b.y, 'WRONG', C.red);
          beep(180, 120, .15, 'sawtooth', .2);
        }
      },
      update(dt) {
        t += dt; shake = Math.max(0, shake - dt * 25);
        switchT -= dt;
        if (switchT <= 0) { pickTarget(); switchT = 8; popAdd(txt, W() / 2, 150, 'NEW MATCH', C.white); }
        spawnT -= dt;
        if (spawnT <= 0) {
          items.push({ x: rand(30, W() - 30), y: H() + 40, r: rand(18, 23), ci: randi(0, 3), ph: rand(0, 6), sp: rand(50, 80) });
          spawnT = Math.max(.35, .75 - matched * .01) * rand(.8, 1.2);
        }
        for (const b of items) { b.y -= b.sp * dt; b.x += Math.sin(t * 1.5 + b.ph) * 16 * dt; }
        for (let i = items.length - 1; i >= 0; i--) if (items[i].y < -50) items.splice(i, 1);
        fxUpdate(parts, dt, 60); popStep(txt, dt);
        if (matched >= g.goal) { completeMini(); return; }
        if (lives <= 0) { miniFail(g, 'Too many wrong pops.'); return; }
        hud('Matched ' + matched + ' / ' + g.goal + '   Lives ' + lives);
      },
      draw() {
        bgGrad('#1b1033', '#070613');
        ctx2d.save();
        ctx2d.translate(rand(-shake, shake), rand(-shake, shake));
        for (const b of items) balloonDraw(b.x, b.y, b.r, cols[b.ci], false);
        ctx2d.restore();
        rect(W() / 2 - 120, 96, 240, 52, 'rgba(255,255,255,.07)', true);
        balloonDraw(W() / 2 - 92, 122, 14, cols[target], false);
        text('Pop only this color', W() / 2 - 66, 128, 16, '#ffffff', 'left', 800);
        fxDraw(parts); popDraw(txt);
      }
    };
  }

  // ---------- 7. Lane Burst: rhythm taps on the A, B, C lanes ----------
  function gameLaneBurst(g) {
    const LANE_COL = [C.cyan, C.pink, C.gold], KEYS = ['a', 'b', 'c'], LABELS = ['A', 'B', 'C'];
    const ZONE = () => H() - 210, WIN_T = 30;
    const laneX = (i) => W() * (i + 1) / 4;
    const items = [], parts = [], txt = [];
    let hits = 0, score = 0, combo = 0, lives = 3, spawnT = .6, shake = 0, t = 0;
    return {
      update(dt) {
        t += dt; shake = Math.max(0, shake - dt * 25);
        spawnT -= dt;
        if (spawnT <= 0) {
          items.push({ lane: randi(0, 2), y: H() + 40 });
          spawnT = Math.max(.32, .72 - hits * .012) * rand(.9, 1.1);
        }
        for (const it of items) it.y -= clamp(150 + hits * 2, 150, 260) * dt;
        for (let k = 0; k < 3; k++) {
          if (!pressed(KEYS[k])) continue;
          let best = -1, bd = 1e9;
          for (let j = 0; j < items.length; j++) {
            if (items[j].lane !== k) continue;
            const d = Math.abs(items[j].y - ZONE());
            if (d < bd) { bd = d; best = j; }
          }
          if (best < 0 || bd > WIN_T) {
            combo = 0; popAdd(txt, laneX(k), ZONE() - 40, 'early', 'rgba(255,255,255,.6)');
            continue;
          }
          items.splice(best, 1);
          const perfect = bd < 10, mult = 1 + Math.min(3, Math.floor(combo / 5));
          combo++; hits++;
          score += (perfect ? 2 : 1) * mult;
          fxBurst(parts, laneX(k), ZONE(), LANE_COL[k], perfect ? 26 : 14, 260);
          popAdd(txt, laneX(k), ZONE() - 40, perfect ? 'PERFECT' : 'GOOD', LANE_COL[k]);
          beep(perfect ? 1000 : 700, perfect ? 1500 : 900, .08, 'sine', .25);
        }
        for (let i = items.length - 1; i >= 0; i--) {
          if (items[i].y < ZONE() - WIN_T - 6) {
            items.splice(i, 1); lives--; combo = 0; shake = 6;
            popAdd(txt, laneX(0) + 60, ZONE() - 60, 'MISSED', C.red);
          }
        }
        fxUpdate(parts, dt, 40); popStep(txt, dt);
        if (hits >= g.goal) { completeMini(); return; }
        if (lives <= 0) { miniFail(g, 'Too many balloons floated past the lanes.'); return; }
        hud('Hits ' + hits + ' / ' + g.goal + '   Combo x' + (1 + Math.min(3, Math.floor(combo / 5))) + '   Lives ' + lives + '  (score ' + score + ')');
      },
      draw() {
        bgGrad('#14213d', '#03060d');
        ctx2d.save();
        ctx2d.translate(rand(-shake, shake), rand(-shake, shake));
        for (let k = 0; k < 3; k++) {
          const x = laneX(k);
          rect(x - 30, 90, 60, H() - 200, 'rgba(255,255,255,.04)', true);
          strokeCircle(x, ZONE(), 28, LANE_COL[k], 3);
          text(LABELS[k], x, ZONE() + 52, 18, '#ffffff', 'center', 900);
        }
        for (const it of items) balloonDraw(laneX(it.lane), it.y, 18, LANE_COL[it.lane], false);
        ctx2d.restore();
        fxDraw(parts); popDraw(txt);
        text('Tap the lane button as the balloon reaches the ring', W() / 2, 92, 13, 'rgba(255,255,255,.6)', 'center');
      }
    };
  }

  // ---------- 8. Pearl Dive: collect air pearls, dodge urchins, keep your air up ----------
  function gameBubbleDive(g) {
    const pearls = [], urchins = [], bubbles = [], parts = [], txt = [];
    let px = W() / 2, py = H() / 2, tx = null, ty = null, air = 100, collected = 0;
    let spawnT = .5, urchinT = 2, t = 0, shake = 0, bubT = 0;
    return {
      pointer(x, y) { tx = x; ty = y; },
      update(dt) {
        t += dt; shake = Math.max(0, shake - dt * 25);
        const ax = AX(), ay = AY();
        if (Math.abs(ax) + Math.abs(ay) > .08) { px += ax * 240 * dt; py += ay * 240 * dt; tx = null; }
        else if (tx !== null) {
          const dx = tx - px, dy = ty - py, d = Math.hypot(dx, dy);
          if (d > 2) { const s = Math.min(d, 260 * dt); px += dx / d * s; py += dy / d * s; }
        }
        px = clamp(px, 22, W() - 22); py = clamp(py, 90, H() - 130);
        air -= 4.5 * dt;
        if (air <= 0) { miniFail(g, 'Out of air! Chase the pearls to breathe.'); return; }
        spawnT -= dt;
        if (spawnT <= 0) {
          pearls.push({ x: rand(30, W() - 30), y: H() + 20, ph: rand(0, 6), sp: rand(50, 80), gold: Math.random() < .15 });
          spawnT = rand(.7, 1.2);
        }
        urchinT -= dt;
        if (urchinT <= 0) {
          const fromLeft = Math.random() < .5;
          urchins.push({ x: fromLeft ? -30 : W() + 30, y: rand(120, H() - 170), vx: (fromLeft ? 1 : -1) * rand(50, 90), ph: rand(0, 6) });
          urchinT = Math.max(1.2, 2.6 - collected * .02) * rand(.8, 1.2);
        }
        bubT -= dt;
        if (bubT <= 0) { bubbles.push({ x: px + rand(-8, 8), y: py - 14, r: rand(2, 4) }); bubT = .25; }
        for (const b of bubbles) b.y -= 60 * dt;
        for (let i = bubbles.length - 1; i >= 0; i--) if (bubbles[i].y < 60) bubbles.splice(i, 1);
        for (const p of pearls) { p.y -= p.sp * dt; p.x += Math.sin(t * 2 + p.ph) * 14 * dt; }
        for (const u of urchins) { u.x += u.vx * dt; u.y += Math.sin(t + u.ph) * 12 * dt; }
        for (let i = urchins.length - 1; i >= 0; i--) if (urchins[i].x < -50 || urchins[i].x > W() + 50) urchins.splice(i, 1);
        for (let i = pearls.length - 1; i >= 0; i--) {
          const p = pearls[i];
          if (p.y < -20) { pearls.splice(i, 1); continue; }
          if (dist(px, py, p.x, p.y) < 20) {
            pearls.splice(i, 1);
            const v = p.gold ? 3 : 1;
            collected += v;
            air = Math.min(100, air + (p.gold ? 25 : 14));
            fxBurst(parts, p.x, p.y, p.gold ? C.gold : '#dff6ff', 16, 160);
            popAdd(txt, p.x, p.y, '+' + v, p.gold ? C.gold : '#dff6ff');
            beep(900, 1300, .08, 'sine', .2);
          }
        }
        for (let i = urchins.length - 1; i >= 0; i--) {
          const u = urchins[i];
          if (dist(px, py, u.x, u.y) < 26) {
            urchins.splice(i, 1); air -= 25; shake = 10;
            fxBurst(parts, px, py, C.red, 14, 200);
            popAdd(txt, px, py - 24, '-25 air', C.red);
            beep(160, 80, .25, 'sawtooth', .25);
          }
        }
        if (air <= 0) { miniFail(g, 'Out of air! Chase the pearls to breathe.'); return; }
        fxUpdate(parts, dt, 30); popStep(txt, dt);
        if (collected >= g.goal) { completeMini(); return; }
        hud('Pearls ' + collected + ' / ' + g.goal + '   Air ' + Math.max(0, Math.round(air)) + '%');
      },
      draw() {
        bgGrad('#0f5e7a', '#021426');
        ctx2d.save();
        ctx2d.translate(rand(-shake, shake), rand(-shake, shake));
        ctx2d.globalAlpha = .07;
        for (let i = 0; i < 4; i++) {
          const x = W() * (i + .5) / 4;
          polygon([[x - 20, 0], [x + 20, 0], [x + 70, H()], [x - 30, H()]], '#bff4ff');
        }
        ctx2d.globalAlpha = 1;
        for (let i = 0; i < 6; i++) {
          const x = W() * (i + .5) / 6;
          line(x, H(), x + Math.sin(t * 1.3 + i) * 10, H() - 70, '#2e9e6a', 6);
        }
        for (const b of bubbles) strokeCircle(b.x, b.y, b.r, 'rgba(220,250,255,.7)', 1.5);
        for (const u of urchins) {
          starPoly(u.x, u.y, 18, 11, 10, '#6c2ea0', t + u.ph);
          circle(u.x, u.y, 8, '#8f4fc4');
        }
        for (const p of pearls) {
          if (p.gold) { ctx2d.save(); ctx2d.shadowBlur = 14; ctx2d.shadowColor = C.gold; gemDraw(p.x, p.y, 9, C.gold); ctx2d.restore(); }
          else gemDraw(p.x, p.y, 8, '#eef8ff');
        }
        bubbleDraw(px, py, 18, C.cyan);
        circle(px, py, 11, '#1d4f6b');
        circle(px - 3, py - 2, 5, '#9ef6ff');
        ctx2d.restore();
        // air gauge on the right edge
        const top = 120, gh = H() - 260;
        rect(W() - 20, top, 10, gh, 'rgba(255,255,255,.12)', true);
        rect(W() - 20, top + gh * (1 - clamp(air, 0, 100) / 100), 10, gh * clamp(air, 0, 100) / 100, air < 25 ? C.red : C.cyan, true);
        fxDraw(parts); popDraw(txt);
        text('Chase pearls, dodge the spiky urchins', W() / 2, 92, 13, 'rgba(255,255,255,.6)', 'center');
      }
    };
  }

  return {
    engines: {
      n12_skyarcher: gameSkyArcher,
      n12_chainpop: gameChainPop,
      n12_bubblecatch: gameBubbleCatch,
      n12_floatlift: gameFloatLift,
      n12_slicestring: gameSliceString,
      n12_huematch: gameHueMatch,
      n12_laneburst: gameLaneBurst,
      n12_pearldive: gameBubbleDive
    },
    minis: [
      { id: 'n12_skyarcher', title: 'Sky Archer', icon: '🏹', cat: 'ARCADE', engine: 'n12_skyarcher', goal: 20,
        desc: 'Aim your bow with the stick and loose arrows at rising balloons. Gold balloons pop for triple points, and every 3 points restores an arrow. Run out of arrows and the run ends.' },
      { id: 'n12_chainpop', title: 'Chain Pop', icon: '🫧', cat: 'PUZZLE', engine: 'n12_chainpop', goal: 40,
        desc: 'Tap a connected group of two or more matching bubbles to pop it. Big groups pay a bonus. The ceiling sinks every few seconds: keep the bubbles off the red line.' },
      { id: 'n12_bubblecatch', title: 'Bubble Catch', icon: '🧺', cat: 'ARCADE', engine: 'n12_bubblecatch', goal: 30,
        desc: 'Slide the cup under falling bubbles. Golden bubbles are worth three. Red thorns cost a life, and three hits end the run.' },
      { id: 'n12_floatlift', title: 'Float Lift', icon: '🎈', cat: 'ACTION', engine: 'n12_floatlift', goal: 15,
        desc: 'Keep your balloon in the air. Tap or hold to float up through the gaps between thorn walls. The gaps shrink as you go.' },
      { id: 'n12_slicestring', title: 'Slice String', icon: '✂️', cat: 'ACTION', engine: 'n12_slicestring', goal: 25,
        desc: 'Swipe across the rising balloons to cut them. Gold balloons are worth three. Black bombs cost a life, and three cuts on bombs end the run.' },
      { id: 'n12_huematch', title: 'Hue Match', icon: '🎯', cat: 'PUZZLE', engine: 'n12_huematch', goal: 15,
        desc: 'Read the color shown at the top and pop only balloons of that color. The target changes every few seconds. Three wrong pops end the run.' },
      { id: 'n12_laneburst', title: 'Lane Burst', icon: '🥁', cat: 'RHYTHM', engine: 'n12_laneburst', goal: 30,
        desc: 'Balloons float toward three rings. Press A, B or C as each one reaches its ring. Hit runs build a combo multiplier. Miss three balloons and the run ends.' },
      { id: 'n12_pearldive', title: 'Pearl Dive', icon: '🤿', cat: 'ARCADE', engine: 'n12_pearldive', goal: 20,
        desc: 'Drift through the deep and collect rising pearls. Your air drains constantly, pearls refill it, and spiky urchins take a chunk out of it.' }
    ],
    aaa: []
  };
})();
