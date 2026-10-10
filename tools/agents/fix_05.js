window.__AG_fix_05 = (function () {
  /* Overrides for: horse, impostor, idle, homerun, hillclimb. Each returns the same engine key. */

  function gHorse(g) {
    const STAKES = [10, 20, 50, 100], COL = ["#e8c06a", "#8fd3ff", "#ff8fa3"], NM = ["Ember", "Frost", "Comet"], L = ["A", "B", "C"];
    let chips = 100, si = 1, str = [1, 1, 1], prob = [1 / 3, 1 / 3, 1 / 3], race = null, over = false, flash = 0, parts = [], last = "";
    function roll() {
      str = [0, 1, 2].map(() => rand(0.7, 1.5));
      const S = str[0] + str[1] + str[2];
      prob = str.map(s => s / S);
    }
    function pay(i) { return Math.max(1.2, Math.round(0.9 / prob[i] * 10) / 10); }
    function end(m) { if (over) return; over = true; setTimeout(() => miniFail(g, m), 450); }
    function settle(w) {
      const b = race.bet, won = b === w;
      if (won) {
        const back = Math.round(race.stake * pay(b));
        chips += back;
        toast("WIN +" + (back - race.stake));
        beep(600, 900, .2, "triangle", .2);
        fxBurst(parts, W() / 2, 200, C.gold, 30, 200);
      } else {
        toast("LOST " + race.stake);
        beep(220, 90, .25, "sawtooth", .15);
      }
      last = "Winner: " + NM[w] + (won ? " - you won" : " - you lost");
      race = null; flash = 1.2; roll();
      if (chips >= g.goal) { if (!over) { over = true; completeMini(); } }
      else if (chips <= 0) end("Bankrupt - no chips left");
    }
    function bet(i) {
      const stake = Math.min(STAKES[si], chips);
      if (stake <= 0) return;
      chips -= stake;
      race = { bet: i, stake, pos: [0, 0, 0] };
      last = "";
    }
    return {
      update(dt) {
        flash = Math.max(0, flash - dt);
        fxUpdate(parts, dt);
        if (!over) {
          if (race) {
            for (let i = 0; i < 3; i++) if (race.pos[i] < 1) {
              race.pos[i] += dt * str[i] * 0.27 * (0.8 + Math.random() * 0.4);
              if (Math.random() < dt * 5) fxBurst(parts, 40 + Math.min(1, race.pos[i]) * (W() - 110), 150 + i * 115 + 26, COL[i], 2, 40);
            }
            if (race.pos.some(p => p >= 1)) settle(race.pos.indexOf(Math.max(...race.pos)));
          } else {
            if (pressed("a")) bet(0);
            else if (pressed("b")) bet(1);
            else if (pressed("c")) bet(2);
          }
        }
        hud("Chips " + chips + "/" + g.goal + " • Stake " + Math.min(STAKES[si], chips) + " • " + (race ? "Racing..." : "A/B/C bet, swipe stake"));
      },
      swipe(dx, dy) {
        if (race) return;
        if (dy < -30) si = Math.min(STAKES.length - 1, si + 1);
        else if (dy > 30) si = Math.max(0, si - 1);
      },
      draw() {
        clear("#0d1a0d");
        const x1 = W() - 70;
        for (let i = 0; i < 3; i++) {
          const y = 150 + i * 115, p = race ? Math.min(1, race.pos[i]) : 0;
          const hx = 40 + p * (x1 - 40), bob = race ? Math.abs(Math.sin(performance.now() / 80 + i * 2)) * 3 : 0;
          rect(30, y - 8, W() - 60, 80, "#1e2e1e", 10);
          for (let k = 0; k < 8; k++) rect(40 + k * 50, y + 62, 22, 3, "#3a4e3a", 1);
          if (race && race.bet === i) text("▶", 16, y + 30, 14, "#ffd15c", "center");
          text(L[i] + " " + NM[i] + "  x" + pay(i).toFixed(1), 40, y - 14, 13, "#ddd", "left", 800);
          rect(hx - 18, y + 26 - bob, 36, 18, COL[i], 6);
          circle(hx + 20, y + 18 - bob, 9, COL[i]);
          line(hx - 12, y + 44, hx - 18, y + 60, COL[i], 4);
          line(hx + 8, y + 44, hx + 14, y + 60, COL[i], 4);
        }
        line(x1 + 14, 130, x1 + 14, 440, "#fff", 3);
        text("🏁", x1 + 14, 115, 22, "#fff", "center");
        text("Stake " + Math.min(STAKES[si], chips) + "  (swipe up/down)", W() / 2, 520, 16, "#fff", "center", 800);
        if (last) text(last, W() / 2, 556, 15, "#ffd15c", "center", 800);
        if (flash > 0) rect(0, 0, W(), H(), "rgba(255,255,255," + (flash * 0.15).toFixed(3) + ")");
        fxDraw(parts);
      },
      stop() {}
    };
  }

  function gImpostor(g) {
    const TOP = 90, BOT = H() - 150, NT = 6;
    const rp = () => ({ x: rand(40, W() - 40), y: rand(TOP + 20, BOT - 20) });
    const crew = [];
    for (let i = 0; i < NT; i++) { const p = rp(); crew.push({ x: p.x, y: p.y, c: randColor(), alive: true, ang: rand(0, 6.3), wrong: false }); }
    const imp = Object.assign(rp(), { c: randColor(), cd: 7 });
    const tasks = [];
    for (let i = 0; i < NT; i++) { const p = rp(); tasks.push({ x: p.x, y: p.y, done: false }); }
    const player = { x: W() / 2, y: BOT - 40 };
    let hold = 0, hov = null, bodies = [], done = 0, sus = 0, kills = 0, flash = 0, flashX = 0, flashY = 0, scanCd = 0, scanT = 0, over = false, parts = [], msg = "", msgT = 0;
    function say(s) { msg = s; msgT = 2.2; }
    function end(m) { if (over) return; over = true; setTimeout(() => miniFail(g, m), 450); }
    function win() { if (over) return; over = true; completeMini(); }
    function near(list, x, y, r) {
      let best = null, bd = r;
      for (const q of list) { const d = dist(x, y, q.x, q.y); if (d < bd) { bd = d; best = q; } }
      return best;
    }
    function drift(o, spd, dt) {
      o.x = clamp(o.x + Math.cos(o.ang) * spd * dt, 20, W() - 20);
      o.y = clamp(o.y + Math.sin(o.ang) * spd * dt, TOP, BOT);
      if (o.x <= 20 || o.x >= W() - 20) o.ang = Math.PI - o.ang;
      if (o.y <= TOP || o.y >= BOT) o.ang = -o.ang;
    }
    function drawChar(x, y, col) {
      rect(x - 11, y - 14, 22, 24, col, 9);
      rect(x - 7, y - 10, 14, 8, "#bfe8ff", 3);
      rect(x - 10, y + 8, 8, 7, col, 2);
      rect(x + 2, y + 8, 8, 7, col, 2);
    }
    return {
      update(dt) {
        fxUpdate(parts, dt);
        flash = Math.max(0, flash - dt);
        msgT = Math.max(0, msgT - dt);
        scanCd = Math.max(0, scanCd - dt);
        scanT = Math.max(0, scanT - dt);
        if (!over) {
          player.x = clamp(player.x + AX() * 170 * dt, 20, W() - 20);
          player.y = clamp(player.y + AY() * 170 * dt, TOP, BOT);
          for (const c of crew) if (c.alive) { c.ang += rand(-1, 1) * dt * 2.5; drift(c, 26, dt); }
          // impostor stalks the nearest living crewmate and strikes when close
          imp.cd = Math.max(0, imp.cd - dt);
          let tgt = null, bd = 1e9;
          for (const c of crew) if (c.alive) { const d = dist(imp.x, imp.y, c.x, c.y); if (d < bd) { bd = d; tgt = c; } }
          if (tgt) {
            const a = Math.atan2(tgt.y - imp.y, tgt.x - imp.x);
            imp.x = clamp(imp.x + Math.cos(a) * 38 * dt, 20, W() - 20);
            imp.y = clamp(imp.y + Math.sin(a) * 38 * dt, TOP, BOT);
            if (bd < 24 && imp.cd <= 0) {
              tgt.alive = false;
              bodies.push({ x: tgt.x, y: tgt.y });
              kills++; imp.cd = 7;
              flash = 2.5; flashX = imp.x; flashY = imp.y;
              say("A body! Someone saw red nearby");
              beep(120, 60, .4, "sawtooth", .2);
              fxBurst(parts, tgt.x, tgt.y, C.red, 16, 140);
              if (kills >= 4) end("The impostor took over the crew");
            }
          }
          // hold A near a task to finish it
          hov = near(tasks.filter(t => !t.done), player.x, player.y, 28);
          if (hov && IN.act.a) {
            hold += dt;
            if (hold >= 1.4) {
              hov.done = true; done++; hold = 0;
              say("Task done");
              beep(700, 1000, .12, "triangle", .15);
              fxBurst(parts, hov.x, hov.y, C.yellow, 14, 130);
              if (done >= NT) win();
            }
          } else hold = 0;
          // B accuses the nearest suspect; the impostor is among them
          if (pressed("b")) {
            const cands = crew.filter(c => c.alive && !c.wrong).concat([imp]);
            const who = near(cands, player.x, player.y, 50);
            if (!who) say("Nobody close enough to accuse");
            else if (who === imp) { fxBurst(parts, imp.x, imp.y, C.gold, 30, 200); say("Ejected! The impostor is out"); win(); }
            else { who.wrong = true; sus += 25; say("Wrong! Not them"); beep(200, 80, .25, "square", .15); fxBurst(parts, who.x, who.y, C.red, 12, 120); }
          }
          // C scans for the impostor, costs suspicion, short cooldown
          if (pressed("c") && scanCd <= 0) {
            scanCd = 8; scanT = 1.6; sus += 5;
            say(dist(player.x, player.y, imp.x, imp.y) < 170 ? "Scan: the impostor is close!" : "Scan: nobody within range");
          }
          sus = Math.max(0, sus - dt);
          if (!over && sus >= g.goal) end("Ejected: too many wrong accusations");
        }
        const aliveCrew = crew.filter(c => c.alive).length;
        hud("Tasks " + done + "/" + NT + " • Sus " + Math.floor(sus) + "/" + g.goal + " • Crew " + aliveCrew + "/" + NT);
      },
      draw() {
        clear("#070b10");
        for (let x = 0; x < W(); x += 40) line(x, TOP, x, BOT, "#0f1a24", 1);
        for (let y = TOP; y < BOT; y += 40) line(0, y, W(), y, "#0f1a24", 1);
        for (const t of tasks) {
          if (t.done) continue;
          circle(t.x, t.y, 10, "#2b2b12");
          circle(t.x, t.y, 7, C.yellow);
          if (t === hov && hold > 0) {
            ctx2d.beginPath(); ctx2d.strokeStyle = C.yellow; ctx2d.lineWidth = 4;
            ctx2d.arc(t.x, t.y, 20, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (hold / 1.4)); ctx2d.stroke();
          }
        }
        for (const b of bodies) {
          circle(b.x, b.y, 11, "#555");
          line(b.x - 5, b.y - 5, b.x + 5, b.y + 5, "#ddd", 2);
          line(b.x + 5, b.y - 5, b.x - 5, b.y + 5, "#ddd", 2);
        }
        for (const c of crew) if (c.alive) drawChar(c.x, c.y, c.c);
        drawChar(imp.x, imp.y, imp.c);
        if (flash > 0) strokeCircle(flashX, flashY, 22 + (2.5 - flash) * 10, C.red, 3);
        if (scanT > 0) {
          strokeCircle(player.x, player.y, (1.6 - scanT) * 170, "rgba(85,230,255,.5)", 2);
          if (dist(player.x, player.y, imp.x, imp.y) < 170) strokeCircle(imp.x, imp.y, 22, C.red, 2);
        }
        drawChar(player.x, player.y, "#ffffff");
        strokeCircle(player.x, player.y, 24, C.cyan, 2);
        if (msgT > 0) text(msg, W() / 2, 100, 14, "#fff", "center", 800);
        fxDraw(parts);
      },
      stop() {}
    };
  }

  function gIdle(g) {
    const UPS = [
      { n: "Tap +1", base: 15, lv: 0, fx() { tap += 1; } },
      { n: "Drone +2/s", base: 45, lv: 0, fx() { auto += 2; } },
      { n: "Tap x2", base: 120, lv: 0, fx() { mul *= 2; } },
      { n: "Lucky tap (chance x5)", base: 200, lv: 0, fx() { luck = Math.min(0.6, luck + 0.05); } },
      { n: "Robot +10/s", base: 420, lv: 0, fx() { auto += 10; } }
    ];
    let money = 0, total = 0, tap = 1, mul = 1, luck = 0, auto = 0, sel = 0, pulse = 0, pops = [], parts = [];
    const costOf = u => Math.round(u.base * Math.pow(1.55, u.lv));
    return {
      update(dt) {
        const earn = auto * dt;
        money += earn; total += earn;
        pulse = Math.max(0, pulse - dt * 4);
        fxUpdate(parts, dt);
        for (const p of pops) p.t += dt;
        pops = pops.filter(p => p.t < 1);
        if (pressed("a")) {
          const lucky = Math.random() < luck;
          const v = tap * mul * (lucky ? 5 : 1);
          money += v; total += v; pulse = 1;
          pops.push({ x: W() / 2 + rand(-40, 40), y: 320, t: 0, txt: "+" + Math.floor(v), c: lucky ? C.gold : "#fff" });
          fxBurst(parts, W() / 2, 340, lucky ? C.gold : C.green, 10, 160);
          beep(660, 880, .05, "square", .08);
        }
        if (pressed("b")) sel = (sel + 1) % UPS.length;
        if (pressed("c")) {
          const u = UPS[sel], cost = costOf(u);
          if (money >= cost) { money -= cost; u.lv++; u.fx(); toast("Bought " + u.n); beep(500, 900, .1, "triangle", .15); }
        }
        if (total >= g.goal) completeMini();
        hud("Earned " + Math.floor(total) + "/" + g.goal + " • +" + Math.floor(auto) + "/s • Tap " + Math.floor(tap * mul));
      },
      swipe(dx, dy) { sel = (sel + (dy > 0 ? 1 : UPS.length - 1)) % UPS.length; },
      draw() {
        clear("#0b100d");
        const cx = W() / 2, cy = H() / 2 - 50, r = 80 + pulse * 8;
        circle(cx, cy, r + 16, "rgba(255,209,92,.12)");
        circle(cx, cy, r, C.gold);
        circle(cx, cy, r - 12, "#e8b53a");
        text("🪙", cx, cy + 20, 56, "#fff", "center");
        text(String(Math.floor(money)), cx, 170, 36, C.gold, "center", 900);
        for (const p of pops) text(p.txt, p.x, p.y - p.t * 60, 18, p.c, "center", 900);
        for (let i = 0; i < UPS.length; i++) {
          const u = UPS[i], y = H() - 340 + i * 32, cost = costOf(u);
          rect(20, y, W() - 40, 28, sel === i ? "#22372a" : "#152018", 8);
          text((sel === i ? "▶ " : "") + u.n, 34, y + 19, 13, "#fff", "left", 800);
          text("lv " + u.lv + " • " + cost, W() - 34, y + 19, 13, money >= cost ? C.green : "#f77", "right", 800);
        }
        text("A tap   B select   C buy   (swipe up/down select)", W() / 2, H() - 160, 12, "#aaa", "center");
        fxDraw(parts);
      },
      stop() {}
    };
  }

  function gHomerun(g) {
    const PY = H() - 230, PATH = PY + 40;
    const TYPES = [
      { n: "Fastball", spd: 620, sway: 0, mul: 1 },
      { n: "Curve", spd: 470, sway: 70, mul: 0.92 },
      { n: "Change-up", spd: 360, sway: 0, mul: 1.1, late: true }
    ];
    let pitches = 0, total = 0, batX = W() / 2, state = "pitch", p = 0, ty = TYPES[0], lane = 0, ballX = 0, ballY = -40;
    let pause = 0, fT = 0, fx0 = 0, fm = 0, result = "", resCol = "#fff", over = false, parts = [];
    function newPitch() { ty = pick(TYPES); lane = rand(-80, 80); p = 0; state = "pitch"; }
    function endPitch(res, col, m) {
      result = res; resCol = col; total += m; pitches++; state = "pause"; pause = 0.9;
      if (pitches >= 10 && !over) {
        over = true;
        if (total >= g.goal) completeMini();
        else setTimeout(() => miniFail(g, "Total " + total + "m, needed " + g.goal + "m"), 450);
      }
    }
    newPitch();
    return {
      update(dt) {
        fxUpdate(parts, dt);
        batX = clamp(batX + AX() * 260 * dt, 30, W() - 30);
        if (!over) {
          if (state === "pitch") {
            p += dt * ty.spd * (ty.late ? 0.6 + p : 1) / PATH;
            ballY = -40 + p * PATH;
            ballX = W() / 2 + lane + ty.sway * Math.sin(p * Math.PI);
            const d = Math.abs(ballY - PY);
            if (pressed("a")) {
              if (d <= 26) {
                const align = Math.abs(ballX - batX);
                if (align <= 40) {
                  const q = Math.min(1, (1 - d / 26) * 0.6 + (1 - align / 40) * 0.4);
                  if (q < 0.25) endPitch("Foul ball", "#ddd", 0);
                  else {
                    fm = Math.round(q * q * ty.mul * rand(0.85, 1.15) * 160);
                    fx0 = ballX; fT = 0; state = "flight";
                    result = q > 0.8 ? "HOME RUN!" : "Good hit";
                    resCol = q > 0.8 ? C.gold : C.green;
                    beep(500, 900, .15, "square", .18);
                  }
                } else endPitch("Hit the wrong spot", "#f77", 0);
              } else endPitch("Swing and miss", "#f77", 0);
            } else if (p >= 1.02) endPitch("Missed the ball", "#f77", 0);
          } else if (state === "flight") {
            fT += dt;
            fxBurst(parts, ballX, ballY, "#fff", 1, 30);
            if (fT >= 1.4) endPitch((fm >= 100 ? "HOME RUN! " : "Good hit ") + fm + "m", resCol, fm);
          } else {
            pause -= dt;
            if (pause <= 0) newPitch();
          }
        }
        hud("Pitch " + Math.min(10, pitches + 1) + "/10 • Total " + total + "m / " + g.goal + "m");
      },
      draw() {
        clear("#0a1a2a");
        const cx = W() / 2;
        polygon([[0, H() - 100], [0, 300], [cx, 120], [W(), 300], [W(), H() - 100]], "#1f5a2a");
        line(0, 300, cx, 120, "#2b5c3a", 3);
        line(cx, 120, W(), 300, "#2b5c3a", 3);
        for (let i = 0; i < 50; i++) circle((i * 53) % W(), 96 + ((i * 29) % 24), 3, ["#e8c06a", "#8fd3ff", "#ff8fa3", "#c8d0d8"][i % 4]);
        polygon([[cx, PY + 30], [cx + 80, PY - 70], [cx, PY - 150], [cx - 80, PY - 70]], "#8d6a3a");
        rect(0, PY - 26, W(), 52, "rgba(255,255,255,.05)");
        line(0, PY, W(), PY, "rgba(255,209,92,.5)", 2);
        circle(cx, 180, 14, "#c9a16a");
        polygon([[cx - 16, PY + 30], [cx + 16, PY + 30], [cx + 10, PY + 40], [cx - 10, PY + 40]], "#fff");
        line(batX - 26, PY + 8, batX + 26, PY + 8, "#d9b07a", 6);
        circle(batX, PY + 60, 12, "#334");
        if (state === "pitch") {
          circle(ballX, ballY, 4 + 6 * p, "#fff");
        } else if (state === "flight") {
          const f = Math.min(1, fT / 1.4);
          const bx = fx0 + (fx0 > cx ? 30 : -30) * f;
          const by = PY - (1 - (1 - f) * (1 - f)) * PY * 0.9;
          circle(bx, by, 8 - 3 * f, "#fff");
          text(Math.floor(fm * f) + "m", cx, 200, 26, resCol, "center", 900);
        }
        text(result, cx, 130, 22, resCol, "center", 900);
        text("Line the bat up with the ball, press A on the gold line", cx, 88, 12, "#aaa", "center");
        fxDraw(parts);
      },
      stop() {}
    };
  }

  function gHill(g) {
    const terr = x => 120 + 70 * Math.sin(x * 0.0045) + 36 * Math.sin(x * 0.0131 + 1) + 14 * Math.sin(x * 0.08);
    const groundY = x => H() - 180 - terr(x) * 0.9;
    const slopeAt = x => (terr(x + 6) - terr(x - 6)) / 12;
    let x = 0, speed = 0, fuel = 100, nitro = 2, boost = 0, over = false, got = new Set(), parts = [];
    function end(m) { if (over) return; over = true; setTimeout(() => miniFail(g, m), 450); }
    function ridge(off, scale, base, col) {
      const pts = [];
      for (let sx = 0; sx <= W(); sx += 8) pts.push([sx, base - terr(x * off + sx) * scale]);
      polygon(pts.concat([[W(), H()], [0, H()]]), col);
    }
    return {
      update(dt) {
        fxUpdate(parts, dt);
        if (!over) {
          const s = slopeAt(x);
          const gas = IN.act.a || key("w") || key("arrowup");
          const brk = IN.act.b || key("s") || key("arrowdown");
          if (pressed("c") && nitro > 0) { nitro--; boost = 1.2; toast("Nitro!"); }
          boost = Math.max(0, boost - dt);
          if (gas && fuel > 0) { speed += (boost > 0 ? 300 : 150) * dt; fuel -= 9 * dt; }
          if (brk) speed -= 260 * dt;
          speed -= s * 380 * dt;
          if (boost <= 0) speed -= 12 * dt;
          speed = clamp(speed, -60, boost > 0 ? 420 : 300);
          x = Math.max(0, x + speed * dt);
          if (gas && fuel > 0 && Math.random() < dt * 20) fxBurst(parts, W() * 0.3 - 26, groundY(x) - 8, "#999", 1, 30);
          const kk = Math.round((x - 300) / 260);
          if (kk >= 0 && !got.has(kk) && Math.abs(x - (300 + kk * 260)) < 36) {
            got.add(kk); fuel = Math.min(100, fuel + 35); toast("Fuel +35"); beep(400, 800, .12, "triangle", .15);
          }
          if (Math.abs(Math.atan(s)) > 0.95 && Math.abs(speed) > 200) end("Flipped! The truck tipped over");
          else if (fuel <= 0 && Math.abs(speed) < 6) end("Out of fuel");
          else if (x >= g.goal && !over) { over = true; completeMini(); }
        }
        hud("Distance " + Math.floor(x) + "/" + g.goal + " • Fuel " + Math.floor(fuel) + " • Nitro " + nitro + " • Speed " + Math.floor(speed));
      },
      draw() {
        const cam = x - W() * 0.3;
        clear("#0a1a30");
        for (let i = 0; i < 40; i++) circle((i * 91) % W(), (i * 37) % H() * 0.4 + 10, 1, "rgba(255,255,255,.6)");
        ridge(0.4, 0.5, H() * 0.55, "#1d3a4f");
        ridge(0.7, 0.8, H() * 0.6, "#24502a");
        const pts = [];
        for (let sx = 0; sx <= W(); sx += 8) pts.push([sx, groundY(cam + sx)]);
        polygon(pts.concat([[W(), H()], [0, H()]]), "#3a7d3e");
        const kmin = Math.max(0, Math.floor((cam - 40 - 300) / 260)), kmax = Math.ceil((cam + W() + 40 - 300) / 260);
        for (let k = kmin; k <= kmax; k++) {
          if (got.has(k)) continue;
          const wx = 300 + k * 260, cxs = wx - cam;
          if (cxs < -40 || cxs > W() + 40) continue;
          const cy = groundY(wx) - 16;
          rect(cxs - 9, cy - 14, 18, 22, "#d33", 3);
          text("F", cxs, cy, 11, "#fff", "center", 900);
        }
        if (g.goal - cam < W() + 40 && g.goal - cam > -40) {
          const fxs = g.goal - cam;
          line(fxs, groundY(g.goal) - 120, fxs, groundY(g.goal), "#fff", 3);
          text("FINISH", fxs, groundY(g.goal) - 130, 14, "#fff", "center", 900);
        }
        const cxS = W() * 0.3, gy = groundY(x), ang = Math.atan2(groundY(x + 6) - groundY(x - 6), 12);
        ctx2d.save();
        ctx2d.translate(cxS, gy - 14);
        ctx2d.rotate(ang);
        if (boost > 0) circle(-30, -4, 6 + Math.random() * 3, C.gold);
        rect(-24, -14, 48, 16, C.orange, 5);
        rect(-12, -24, 22, 12, "#8fd3ff", 3);
        circle(-14, 4, 8, "#222");
        circle(14, 4, 8, "#222");
        ctx2d.restore();
        fxDraw(parts);
      },
      stop() {}
    };
  }

  return {
    engines: { horse: gHorse, impostor: gImpostor, idle: gIdle, homerun: gHomerun, hillclimb: gHill },
    minis: [
      { id: "horse", title: "Horse Race", icon: "🐎", cat: "SPORTS", desc: "Three horses, real odds. Swipe to size your stake, bet smart, reach 300 chips.", engine: "horse", goal: 300 },
      { id: "impostor", title: "Crew Suspect", icon: "👾", cat: "RPG", desc: "Finish 6 tasks, or vote out the impostor. Four kills and the crew is gone.", engine: "impostor", goal: 100 },
      { id: "idle", title: "Idle Tycoon", icon: "🏭", cat: "ARCADE", desc: "Tap for coins, buy drones and robots, reach 1200 total.", engine: "idle", goal: 1200 },
      { id: "homerun", title: "Homerun Derby", icon: "⚾", cat: "SPORTS", desc: "Three pitch types, line up the bat, time the swing. Ten pitches, 900 metres to win.", engine: "homerun", goal: 900 },
      { id: "hillclimb", title: "Hill Climb", icon: "⛰️", cat: "ARCADE", desc: "Climb rolling hills, grab fuel cans, use nitro, don't flip. Reach the finish.", engine: "hillclimb", goal: 800 }
    ],
    aaa: []
  };
})();
