// new_07: fishing and lake/sea catching minigames (cast, timing, reeling, netting, spearing)
window.__AG_new_07 = (function () {
  function n07Water(a, b) {
    var g = ctx2d.createLinearGradient(0, 0, 0, H());
    g.addColorStop(0, a); g.addColorStop(1, b);
    ctx2d.fillStyle = g; ctx2d.fillRect(0, 0, W(), H());
  }
  function n07Fish(x, y, s, dir, col, a) {
    ctx2d.save(); ctx2d.globalAlpha = a == null ? 1 : a;
    ctx2d.translate(x, y); ctx2d.scale(dir < 0 ? -1 : 1, 1);
    ctx2d.fillStyle = col; ctx2d.beginPath(); ctx2d.ellipse(0, 0, s, s * .45, 0, 0, 6.283); ctx2d.fill();
    ctx2d.beginPath(); ctx2d.moveTo(-s * .7, 0); ctx2d.lineTo(-s * 1.35, -s * .45); ctx2d.lineTo(-s * 1.35, s * .45); ctx2d.closePath(); ctx2d.fill();
    ctx2d.fillStyle = '#ffffff'; ctx2d.beginPath(); ctx2d.arc(s * .5, -s * .12, s * .12, 0, 6.283); ctx2d.fill();
    ctx2d.fillStyle = '#021a26'; ctx2d.beginPath(); ctx2d.arc(s * .56, -s * .12, s * .06, 0, 6.283); ctx2d.fill();
    ctx2d.restore();
  }
  function n07Ripple(x, y, r, a) {
    ctx2d.save(); ctx2d.globalAlpha = clamp(a, 0, 1); ctx2d.strokeStyle = '#d6f7ff'; ctx2d.lineWidth = 2;
    ctx2d.beginPath(); ctx2d.ellipse(x, y, r * 1.8, r * .55, 0, 0, 6.283); ctx2d.stroke(); ctx2d.restore();
  }
  function n07VBar(x, y, w, h, v, col) {
    v = clamp(v, 0, 1);
    rect(x, y, w, h, 'rgba(0,0,0,.5)', 1);
    rect(x + 2, y + 2 + (h - 4) * (1 - v), w - 4, (h - 4) * v, col, 1);
  }

  // 1. Buoy Cast: stop the swinging power bar, land on the buoy through the wind
  function n07BuoyCast(g) {
    var goal = g.goal || 6, ph = 0, pw = 0, dir = 1, wind = 0, tgt = .6, D = 0, hits = 0, lives = 3;
    var msg = '', msgT = 0, done = false, parts = [], rt = 0, shake = 0, spot = 0;
    var yN = H() - 190, yF = 150;
    function yOf(d) { return yN - d * (yN - yF); }
    function roll() { tgt = rand(.35, .95); wind = rand(-1, 1); ph = 0; pw = 0; dir = 1; rt = 0; }
    roll();
    return {
      update: function (dt) {
        rt += dt; msgT = Math.max(0, msgT - dt); shake = Math.max(0, shake - dt);
        fxUpdate(parts, dt, 220);
        if (done) return;
        if (ph === 0) {
          pw += dir * (1.1 + Math.min(.9, hits * .06)) * dt;
          if (pw >= 1) { pw = 1; dir = -1; } else if (pw <= 0) { pw = 0; dir = 1; }
          if (pressed('a')) {
            D = clamp(.2 + pw * .8 + wind * .06, 0, 1.1); spot = D; ph = 1; rt = 0;
            var e = Math.abs(D - tgt);
            if (e < .035) {
              hits++; msg = 'BULLSEYE'; shake = .15; msgT = 1.1;
              fxBurst(parts, W() / 2, yOf(tgt), C.gold, 30, 240); beep(700, 1200, .2, 'sine', .09);
              if (hits >= goal) { done = true; completeMini(); return; }
            } else if (e < .09) {
              msg = 'So close'; msgT = 1; fxBurst(parts, W() / 2, yOf(D), C.cyan, 10, 120); beep(420, 520, .1, 'sine', .05);
            } else {
              lives--; msg = 'Off the mark'; msgT = 1; shake = .3;
              fxBurst(parts, W() / 2, yOf(D), C.white, 14, 160); beep(200, 90, .25, 'sawtooth', .08);
              if (lives <= 0) { done = true; miniFail(g, 'The lures ran out.'); return; }
            }
          }
        } else if (rt > 1.2) roll();
        hud('Bullseyes ' + hits + '/' + goal + '  Lures ' + lives);
      },
      draw: function () {
        ctx2d.save();
        if (shake > 0) ctx2d.translate(rand(-5, 5), rand(-5, 5));
        n07Water('#0f5f7f', '#03202f');
        for (var i = 0; i < 5; i++) line(0, yOf(.2 + i * .2), W(), yOf(.2 + i * .2), 'rgba(160,230,255,.12)', 1);
        // wind
        line(W() / 2, 112, W() / 2 + wind * 70, 112, C.cyan, 3);
        text('Wind ' + (wind > .15 ? 'east' : wind < -.15 ? 'west' : 'calm'), W() / 2, 100, 14, '#e8fbff', 'center');
        // buoy
        var by = yOf(tgt), pulse = Math.sin(rt * 4) * 1.5;
        circle(W() / 2, by, 13 + pulse, C.orange);
        strokeCircle(W() / 2, by, 13 + pulse, '#ffffff', 2);
        circle(W() / 2, by, 4, '#ffffff');
        if (ph === 1) {
          for (var k = 0; k < 3; k++) {
            var rr = ((rt * 40 + k * 20) % 60);
            n07Ripple(W() / 2, yOf(spot), 6 + rr, 1 - rr / 60);
          }
        }
        // boat and line
        var lureY = ph === 0 ? yOf(.2 + pw * .8) : yOf(spot);
        line(W() / 2, yN + 30, W() / 2, lureY, 'rgba(255,255,255,.5)', 1.5);
        circle(W() / 2, lureY, 6, C.pink);
        polygon([[W() / 2 - 40, yN + 40], [W() / 2 + 40, yN + 40], [W() / 2 + 28, yN + 60], [W() / 2 - 28, yN + 60]], '#8a5a2b');
        // power meter
        var mx = W() - 40, mh = yN - yF;
        n07VBar(mx, yF, 16, mh, pw, C.orange);
        var pwT = (tgt - .2) / .8;
        if (pwT >= 0 && pwT <= 1) line(mx - 6, yN - pwT * mh, mx + 22, yN - pwT * mh, C.gold, 2);
        if (msgT > 0) {
          ctx2d.globalAlpha = clamp(msgT, 0, 1);
          text(msg, W() / 2, H() * .4, 24, C.gold, 'center', 800);
          ctx2d.globalAlpha = 1;
        }
        fxDraw(parts);
        ctx2d.restore();
      }
    };
  }

  // 2. Line Tension: keep the line in the green band while reeling; snap = lost line
  function n07LineTension(g) {
    var goal = g.goal || 5, ten = .4, reel = false, dist = 1, caught = 0, lives = 3;
    var surge = 0, tgtS = 0, surgeT = 1.2, t = 0, msg = '', msgT = 0, done = false, parts = [];
    return {
      update: function (dt) {
        t += dt; msgT = Math.max(0, msgT - dt);
        fxUpdate(parts, dt, 120);
        if (done) return;
        surgeT -= dt;
        if (surgeT <= 0) { tgtS = rand(-1, 1); surgeT = rand(.8, 2.2); }
        surge += (tgtS - surge) * Math.min(1, dt * 2.5);
        if (pressed('a')) reel = !reel;
        var pull = .12 + .62 * Math.max(0, surge);
        ten = clamp(ten + (pull - .3 + (reel ? .42 : 0)) * dt * .9, 0, 1.2);
        if (reel && ten >= .35 && ten <= .7) dist -= .085 * dt;
        else if (reel && ten > .7) dist -= .03 * dt;
        if (ten >= 1) {
          lives--; reel = false; ten = .4; msg = 'Line snapped!'; msgT = 1.2; beep(200, 90, .3, 'sawtooth', .08);
          fxBurst(parts, W() * .3, 170, C.white, 16, 180);
          if (lives <= 0) { done = true; miniFail(g, 'Too many snapped lines.'); return; }
        }
        if (dist <= 0) {
          caught++; msg = 'Landed!'; msgT = 1.2; beep(500, 900, .2, 'triangle', .09);
          fxBurst(parts, W() * .6, 220, C.gold, 30, 220);
          dist = 1; ten = .4; reel = false;
          if (caught >= goal) { done = true; completeMini(); return; }
        }
        hud('Landed ' + caught + '/' + goal + '  Lines ' + lives);
      },
      draw: function () {
        n07Water('#0a3d5c', '#010b14');
        var tipX = W() * .25, tipY = 150;
        var fx = W() * .6 + Math.sin(t * 1.7) * 18, fy = 200 + (1 - dist) * (H() * .5);
        var inZone = ten >= .35 && ten <= .7;
        line(tipX, tipY, fx, fy, 'rgba(255,255,255,.6)', 1.5);
        n07Fish(fx, fy, 22, surge >= 0 ? -1 : 1, '#ffb347');
        ctx2d.save(); ctx2d.globalAlpha = .18 + .1 * Math.sin(t * 6);
        circle(fx, fy, 30, '#ffffff'); ctx2d.restore();
        // gauge
        var gx = W() - 44, gy = 200, gh = H() - 460;
        rect(gx - 4, gy + gh * .3, 26, gh * .35, 'rgba(85,255,154,.25)', 1);
        n07VBar(gx, gy, 18, gh, ten, ten >= .85 ? C.red : inZone ? C.green : C.yellow);
        text(reel ? 'REELING' : 'SLACK', W() * .5, 120, 16, '#e8fbff', 'center', 800);
        if (msgT > 0) {
          ctx2d.globalAlpha = clamp(msgT, 0, 1);
          text(msg, W() / 2, H() * .42, 24, C.gold, 'center', 800);
          ctx2d.globalAlpha = 1;
        }
        fxDraw(parts);
      }
    };
  }

  // 3. Hook Rhythm: three lines, notes glide to the hook line, press on the beat
  function n07HookRhythm(g) {
    var goal = g.goal || 25, hits = 0, lives = 3, notes = [], spawnT = .8, iv = .8;
    var msg = '', msgT = 0, msgC = '#ffffff', parts = [], done = false;
    var LF = [.25, .5, .75], KEYS = ['a', 'b', 'c'], LC = [C.cyan, C.pink, C.lime];
    function hitY() { return H() - 230; }
    return {
      update: function (dt) {
        msgT -= dt; fxUpdate(parts, dt, 60);
        if (done) return;
        var v = Math.min(420, 250 + hits * 5);
        spawnT -= dt;
        if (spawnT <= 0) {
          notes.push({ l: randi(0, 2), y: 100, gold: Math.random() < .12 });
          spawnT = iv * rand(.85, 1.15);
          iv = Math.max(.32, iv - .01);
        }
        for (var i = notes.length - 1; i >= 0; i--) {
          var n = notes[i];
          n.y += v * dt;
          if (n.y > hitY() + 36) {
            notes.splice(i, 1); lives--; msg = 'Missed'; msgT = .6; msgC = C.red; beep(220, 120, .15, 'sawtooth', .06);
          }
        }
        if (lives <= 0) { done = true; miniFail(g, 'Too many lines went slack.'); return; }
        for (var k = 0; k < 3; k++) {
          if (!pressed(KEYS[k])) continue;
          var best = -1, bd = 1e9;
          for (var j = 0; j < notes.length; j++) {
            if (notes[j].l !== k) continue;
            var d = Math.abs(notes[j].y - hitY());
            if (d < bd) { bd = d; best = j; }
          }
          if (best < 0 || bd > 36) continue;
          var nt = notes[best], pts = nt.gold ? 2 : 1;
          notes.splice(best, 1);
          hits += pts;
          var perfect = bd <= 10;
          msg = perfect ? 'Perfect' : 'Good'; msgT = .5; msgC = perfect ? C.gold : C.cyan;
          fxBurst(parts, W() * LF[k], hitY(), LC[k], nt.gold ? 26 : 14, 200);
          beep(560 + k * 120, 760 + k * 120, .08, 'square', .05);
          if (hits >= goal) { done = true; completeMini(); return; }
        }
        hud('Catches ' + hits + '/' + goal + '  Lines ' + lives);
      },
      draw: function () {
        n07Water('#0b4b68', '#031b2b');
        var hy = hitY();
        for (var l = 0; l < 3; l++) {
          var x = W() * LF[l];
          rect(x - 30, 100, 60, hy - 60, 'rgba(120,220,255,.07)');
          strokeCircle(x, hy, 28, LC[l], 3);
          text(KEYS[l].toUpperCase(), x, hy + 56, 14, LC[l], 'center', 800);
        }
        for (var i = 0; i < notes.length; i++) {
          var n = notes[i], nx = W() * LF[n.l];
          line(nx, n.y - 40, nx, n.y - 12, 'rgba(255,255,255,.35)', 1);
          if (n.gold) circle(nx, n.y, 22, 'rgba(255,209,92,.25)');
          circle(nx, n.y, 13, n.gold ? C.gold : C.white);
          circle(nx, n.y - 9, 5, C.red);
        }
        fxDraw(parts);
        if (msgT > 0) {
          ctx2d.globalAlpha = clamp(msgT * 2, 0, 1);
          text(msg, W() / 2, hy - 70, 22, msgC, 'center', 800);
          ctx2d.globalAlpha = 1;
        }
      }
    };
  }

  // 4. Sonar Lake: ping to reveal fish, then lower the lure onto one and hold it
  function n07SonarLake(g) {
    var goal = g.goal || 5, pings = 4, pingR = -1, fish = [], lx = W() / 2, ly = H() * .45;
    var caught = 0, time = 75, parts = [], done = false, boatX = W() / 2, boatY = 110;
    var X0 = 40, X1 = W() - 40, Y0 = 170, Y1 = H() - 170;
    function mk() { return { x: rand(X0, X1), y: rand(Y0, Y1), vx: rand(-40, 40), vy: rand(-30, 30), rev: 0, hold: 0 }; }
    for (var i = 0; i < 4; i++) fish.push(mk());
    return {
      update: function (dt) {
        fxUpdate(parts, dt, 40);
        if (done) return;
        time -= dt;
        if (time <= 0) { done = true; miniFail(g, 'The lake went quiet.'); return; }
        lx = clamp(lx + AX() * 240 * dt, X0, X1);
        ly = clamp(ly + AY() * 240 * dt, Y0, Y1);
        if (pressed('a') && pingR < 0 && pings > 0) { pings--; pingR = 0; beep(900, 300, .25, 'sine', .06); }
        if (pingR >= 0) {
          var old = pingR; pingR += 360 * dt;
          for (var q = 0; q < fish.length; q++) {
            var dd = dist(fish[q].x, fish[q].y, boatX, boatY);
            if (dd >= old && dd < pingR) fish[q].rev = 2.6;
          }
          if (pingR > 380) pingR = -1;
        }
        for (var i = 0; i < fish.length; i++) {
          var f = fish[i];
          f.rev = Math.max(0, f.rev - dt);
          var dl = dist(f.x, f.y, lx, ly);
          if (dl < 70) {
            var d = dl || 1;
            f.vx = (f.x - lx) / d * 110; f.vy = (f.y - ly) / d * 110;
          } else {
            f.vx = clamp(f.vx + rand(-60, 60) * dt, -50, 50);
            f.vy = clamp(f.vy + rand(-60, 60) * dt, -40, 40);
          }
          f.x += f.vx * dt; f.y += f.vy * dt;
          if (f.x < X0 || f.x > X1) { f.vx = -f.vx; f.x = clamp(f.x, X0, X1); }
          if (f.y < Y0 || f.y > Y1) { f.vy = -f.vy; f.y = clamp(f.y, Y0, Y1); }
          f.hold = dl < 34 ? f.hold + dt : 0;
          if (f.hold > .3) {
            caught++; pings = Math.min(6, pings + 1); f.hold = 0;
            fxBurst(parts, f.x, f.y, C.orange, 26, 200); beep(640, 980, .18, 'triangle', .08);
            fish[i] = mk();
            if (caught >= goal) { done = true; completeMini(); return; }
          }
        }
        hud('Catches ' + caught + '/' + goal + '  Pings ' + pings + '  Time ' + Math.ceil(time));
      },
      draw: function () {
        n07Water('#06324a', '#010e18');
        polygon([[boatX - 36, boatY], [boatX + 36, boatY], [boatX + 26, boatY + 18], [boatX - 26, boatY + 18]], '#8a5a2b');
        if (pingR >= 0) strokeCircle(boatX, boatY, pingR, 'rgba(120,255,220,' + clamp(1 - pingR / 380, 0, 1) + ')', 3);
        for (var i = 0; i < fish.length; i++) {
          var f = fish[i];
          if (f.rev <= 0) continue;
          var a = clamp(f.rev, 0, 1);
          circle(f.x, f.y, 26, 'rgba(255,209,92,' + (.15 * a) + ')');
          n07Fish(f.x, f.y, 16, f.vx >= 0 ? 1 : -1, C.orange, a);
        }
        line(boatX, boatY + 18, lx, ly, 'rgba(255,255,255,.2)', 1);
        circle(lx, ly, 6, C.pink);
        strokeCircle(lx, ly, 14, 'rgba(255,79,216,.5)', 2);
        fxDraw(parts);
      }
    };
  }

  // 5. Trawl Drop: drop the net from the boat, it scoops fish when it passes through them
  function n07TrawlDrop(g) {
    var goal = g.goal || 8, drops = 12, caught = 0, bx = W() / 2, netY = -1, netDir = 0;
    var fish = [], parts = [], done = false, bottomY = H() - 210;
    function spawnF() {
      var dir = Math.random() < .5 ? 1 : -1;
      return { x: dir > 0 ? -20 : W() + 20, y: rand(190, bottomY - 20), v: dir * rand(40, 100) * (1 + caught * .03), c: pick([C.orange, C.yellow, C.pink, C.cyan, C.lime]), s: rand(10, 15) };
    }
    for (var i = 0; i < 6; i++) { var f0 = spawnF(); f0.x = rand(40, W() - 40); fish.push(f0); }
    return {
      update: function (dt) {
        fxUpdate(parts, dt, 40);
        if (done) return;
        bx = clamp(bx + AX() * 220 * dt, 50, W() - 50);
        if (netY < 0) {
          if (pressed('a') && drops > 0) { drops--; netY = 130; netDir = 1; }
        } else if (netDir === 1) {
          netY += 260 * dt;
          if (netY >= bottomY) { netY = bottomY; netDir = -1; }
        } else {
          netY -= 300 * dt;
          if (netY <= 130) { netY = -1; netDir = 0; }
        }
        for (var i = 0; i < fish.length; i++) {
          var f = fish[i];
          f.x += f.v * dt;
          if (netY > 0 && Math.abs(f.x - bx) <= 32 && Math.abs(f.y - netY) < 14 && !f.dead) {
            f.dead = true; caught++;
            fxBurst(parts, f.x, f.y, f.c, 16, 180); beep(520, 760, .12, 'triangle', .07);
          }
          if (f.dead || f.x < -40 || f.x > W() + 40) fish[i] = spawnF();
        }
        if (caught >= goal) { done = true; completeMini(); return; }
        if (netY < 0 && drops <= 0) { done = true; miniFail(g, 'No drops left.'); return; }
        hud('Catches ' + caught + '/' + goal + '  Drops ' + drops);
      },
      draw: function () {
        n07Water('#0a4663', '#021722');
        for (var i = 0; i < fish.length; i++) {
          var f = fish[i];
          if (!f.dead) n07Fish(f.x, f.y, f.s, f.v >= 0 ? 1 : -1, f.c);
        }
        if (netY > 0) {
          ctx2d.save(); ctx2d.globalAlpha = 1;
          polygon([[bx - 34, 130], [bx + 34, 130], [bx + 26, netY], [bx - 26, netY]], 'rgba(200,255,230,.14)');
          for (var k = 1; k < 5; k++) line(bx - 34 + k * 13.6, 130, bx - 26 + k * 10.4, netY, 'rgba(220,255,240,.35)', 1);
          line(bx - 26, netY, bx + 26, netY, C.white, 2);
          ctx2d.restore();
        }
        polygon([[bx - 40, 110], [bx + 40, 110], [bx + 30, 130], [bx - 30, 130]], '#8a5a2b');
        line(bx, 90, bx, 110, C.white, 2);
        fxDraw(parts);
      }
    };
  }

  // 6. Lure Match: fish cross the strike zone in one of three colours; press the matching lure
  function n07LureMatch(g) {
    var goal = g.goal || 15, lives = 3, caught = 0, fish = [], spT = .5, t = 0, parts = [];
    var done = false, msg = '', msgT = 0, msgC = '#ffffff';
    var ZL = W() * .3, ZR = W() * .7, cols = [C.red, C.yellow, C.lime], KEYS = ['a', 'b', 'c'];
    function inZone(f) { return f.x >= ZL && f.x <= ZR; }
    return {
      update: function (dt) {
        t += dt; msgT -= dt;
        fxUpdate(parts, dt, 0);
        if (done) return;
        spT -= dt;
        if (spT <= 0) {
          fish.push({ x: W() + 30, y: rand(190, H() - 280), c: randi(0, 2), v: -rand(90, 140) * (1 + caught * .03) });
          spT = Math.max(.55, 1.4 - caught * .04) * rand(.8, 1.2);
        }
        for (var i = fish.length - 1; i >= 0; i--) {
          var f = fish[i];
          f.x += f.v * dt;
          if (f.x < ZL - 6) {
            fish.splice(i, 1); lives--; msg = 'Got away'; msgT = .8; msgC = C.red;
            if (lives <= 0) { done = true; miniFail(g, 'Too many fish got away.'); return; }
          }
        }
        for (var k = 0; k < 3; k++) {
          if (!pressed(KEYS[k])) continue;
          var best = -1, bd = 1e9, anyIn = -1, ad = 1e9;
          for (var j = 0; j < fish.length; j++) {
            if (!inZone(fish[j])) continue;
            var d = Math.abs(fish[j].x - W() / 2);
            if (fish[j].c === k && d < bd) { bd = d; best = j; }
            if (d < ad) { ad = d; anyIn = j; }
          }
          if (best >= 0) {
            var cf = fish[best];
            fish.splice(best, 1); caught++;
            msg = 'Hooked!'; msgT = .6; msgC = cols[k];
            fxBurst(parts, cf.x, cf.y, cols[k], 18, 200); beep(600, 900, .12, 'triangle', .08);
            if (caught >= goal) { done = true; completeMini(); return; }
          } else if (anyIn >= 0) {
            fish.splice(anyIn, 1); lives--; msg = 'Wrong lure'; msgT = .9; msgC = C.red;
            beep(220, 120, .2, 'sawtooth', .07);
            if (lives <= 0) { done = true; miniFail(g, 'Wrong lures scared the catch away.'); return; }
          }
        }
        hud('Catches ' + caught + '/' + goal + '  Lives ' + lives);
      },
      draw: function () {
        n07Water('#0c4a66', '#021b2a');
        rect(ZL, 150, ZR - ZL, H() - 330, 'rgba(255,255,255,.06)');
        line(ZL, 150, ZL, H() - 180, 'rgba(255,255,255,.2)', 1);
        line(ZR, 150, ZR, H() - 180, 'rgba(255,255,255,.2)', 1);
        for (var i = 0; i < fish.length; i++) {
          var f = fish[i];
          if (inZone(f)) strokeCircle(f.x, f.y, 26, cols[f.c], 2);
          n07Fish(f.x, f.y, 18, -1, cols[f.c]);
        }
        var lx = [W() * .3, W() * .5, W() * .7];
        for (var k = 0; k < 3; k++) {
          circle(lx[k], H() - 180, 18, cols[k]);
          strokeCircle(lx[k], H() - 180, 22, '#ffffff', 2);
          text(KEYS[k].toUpperCase(), lx[k], H() - 174, 16, '#021a26', 'center', 900);
        }
        fxDraw(parts);
        if (msgT > 0) {
          ctx2d.globalAlpha = clamp(msgT * 2, 0, 1);
          text(msg, W() / 2, H() * .3, 22, msgC, 'center', 800);
          ctx2d.globalAlpha = 1;
        }
      }
    };
  }

  // 7. Ice Hole: steer the hole over the fish below the ice and strike; misses add up
  function n07IceHole(g) {
    var goal = g.goal || 8, caught = 0, misses = 0, hx = W() / 2, hy = H() * .45;
    var fx = W() * .3, fy = H() * .5, wx = 0, wy = 0, dart = 0, dvx = 0, dvy = 0, dartT = 2;
    var cd = 0, ripT = -1, ripOk = true, parts = [], done = false, t = 0;
    var X0 = 50, X1 = W() - 50, Y0 = 170, Y1 = H() - 170;
    var cracks = [];
    for (var i = 0; i < 14; i++) cracks.push({ x: rand(0, W()), y: rand(0, H()), a: rand(0, 6.28), l: rand(30, 90) });
    function respawn() { fx = rand(X0, X1); fy = rand(Y0, Y1); dartT = rand(1.5, 3); }
    return {
      update: function (dt) {
        if (done) return;
        t += dt; cd -= dt;
        if (ripT >= 0) { ripT += dt; if (ripT > 1) ripT = -1; }
        hx = clamp(hx + AX() * 200 * dt, X0, X1);
        hy = clamp(hy + AY() * 200 * dt, Y0, Y1);
        dartT -= dt;
        if (dart > 0) { dart -= dt; }
        else if (dartT <= 0) { var a = rand(0, 6.283); dvx = Math.cos(a) * 250; dvy = Math.sin(a) * 250; dart = .45; dartT = rand(1.8, 3.2); }
        if (dart > 0) { fx += dvx * dt; fy += dvy * dt; }
        else {
          wx += (rand(-1, 1) * 50 - wx) * Math.min(1, dt * 2);
          wy += (rand(-1, 1) * 50 - wy) * Math.min(1, dt * 2);
          fx += wx * dt; fy += wy * dt;
          var dd = dist(fx, fy, hx, hy);
          if (dd < 55 && dd > 0) { dvx = (fx - hx) / dd * 260; dvy = (fy - hy) / dd * 260; dart = .5; }
        }
        fx = clamp(fx, X0, X1); fy = clamp(fy, Y0, Y1);
        if (pressed('a') && cd <= 0) {
          cd = .35;
          if (dist(hx, hy, fx, fy) < 36) {
            caught++; ripT = 0; ripOk = true;
            fxBurst(parts, fx, fy, C.white, 20, 200); beep(700, 1000, .15, 'triangle', .08);
            respawn();
            if (caught >= goal) { done = true; completeMini(); return; }
          } else {
            misses++; ripT = 0; ripOk = false; beep(200, 110, .18, 'sawtooth', .06);
            if (misses >= 7) { done = true; miniFail(g, 'Too many empty strikes.'); return; }
          }
        }
        fxUpdate(parts, dt, 40);
        hud('Catches ' + caught + '/' + goal + '  Misses ' + misses + '/7');
      },
      draw: function () {
        var g2 = ctx2d.createLinearGradient(0, 0, 0, H());
        g2.addColorStop(0, '#d8f1fb'); g2.addColorStop(1, '#7fb8d6');
        ctx2d.fillStyle = g2; ctx2d.fillRect(0, 0, W(), H());
        for (var i = 0; i < cracks.length; i++) {
          var c = cracks[i];
          line(c.x, c.y, c.x + Math.cos(c.a) * c.l, c.y + Math.sin(c.a) * c.l, 'rgba(255,255,255,.7)', 1.2);
        }
        circle(hx, hy, 40, '#06222f');
        strokeCircle(hx, hy, 42, '#ffffff', 3);
        ctx2d.save(); ctx2d.globalAlpha = .35 + (dart > 0 ? .3 : 0);
        n07Fish(fx, fy, 22, dvx >= 0 ? 1 : -1, '#1b4f6b');
        ctx2d.restore();
        if (ripT >= 0) n07Ripple(hx, hy, 40 + ripT * 60, 1 - ripT);
        if (ripT >= 0 && !ripOk) strokeCircle(hx, hy, 40 + ripT * 40, C.red, 3);
        fxDraw(parts);
      }
    };
  }

  // 8. Reef Harpoon: aim with the stick, fire one spear at a time, keep your air up
  function n07ReefHarpoon(g) {
    var goal = g.goal || 10, catches = 0, oxy = 60, aim = -Math.PI / 2, sp = null, fish = [];
    var parts = [], done = false, t = 0, DX = W() / 2, DY = H() - 230;
    function spawnF() {
      var dir = Math.random() < .5 ? 1 : -1, big = Math.random() < .25;
      return {
        x: dir > 0 ? -30 : W() + 30, y: rand(170, DY - 60), v: dir * rand(50, 110) * (1 + catches * .03),
        hp: big ? 2 : 1, s: big ? 22 : 13, c: big ? C.orange : C.cyan, flash: 0
      };
    }
    for (var i = 0; i < 4; i++) { var f0 = spawnF(); f0.x = rand(40, W() - 40); fish.push(f0); }
    return {
      update: function (dt) {
        fxUpdate(parts, dt, 30);
        if (done) return;
        t += dt;
        oxy -= dt;
        if (oxy <= 0) { done = true; miniFail(g, 'Out of air.'); return; }
        aim = clamp(aim + AX() * dt * 2.4, -Math.PI + .15, -.15);
        if (pressed('a') && !sp) {
          sp = { x: DX, y: DY, vx: Math.cos(aim) * 640, vy: Math.sin(aim) * 640 };
          beep(900, 500, .08, 'square', .04);
        }
        if (sp) {
          sp.x += sp.vx * dt; sp.y += sp.vy * dt;
          if (sp.x < -20 || sp.x > W() + 20 || sp.y < 80) sp = null;
        }
        for (var i = 0; i < fish.length; i++) {
          var f = fish[i];
          f.x += f.v * dt; f.flash = Math.max(0, f.flash - dt);
          if (sp && dist(sp.x, sp.y, f.x, f.y) < f.s + 4) {
            f.hp--; f.flash = .2; sp = null;
            fxBurst(parts, f.x, f.y, f.c, 12, 160);
            if (f.hp <= 0) {
              catches++; oxy = Math.min(60, oxy + 6);
              beep(600, 960, .15, 'triangle', .08);
              fish[i] = spawnF();
              if (catches >= goal) { done = true; completeMini(); return; }
              continue;
            }
            beep(400, 300, .1, 'square', .06);
          }
          if (f.x < -40 || f.x > W() + 40) fish[i] = spawnF();
        }
        hud('Catches ' + catches + '/' + goal + '  Air ' + Math.ceil(oxy));
      },
      draw: function () {
        n07Water('#0b5570', '#01131d');
        // reef
        for (var r = 0; r < 6; r++) {
          var rx = W() * (r / 5), ry = H() - 110;
          circle(rx, ry, 30 + (r % 3) * 10, '#1d4a3a');
        }
        for (var i = 0; i < fish.length; i++) {
          var f = fish[i];
          if (f.flash > 0) ctx2d.globalAlpha = .4;
          n07Fish(f.x, f.y, f.s, f.v >= 0 ? 1 : -1, f.flash > 0 ? C.white : f.c);
          ctx2d.globalAlpha = 1;
        }
        // aim guide and diver
        ctx2d.save(); ctx2d.globalAlpha = .45;
        line(DX, DY, DX + Math.cos(aim) * 90, DY + Math.sin(aim) * 90, C.white, 2);
        ctx2d.restore();
        if (sp) line(sp.x, sp.y, sp.x - sp.vx * .03, sp.y - sp.vy * .03, C.gold, 3);
        circle(DX, DY - 8, 11, '#ffd9b3');
        rect(DX - 12, DY + 3, 24, 26, '#1f6fb2', 4);
        for (var b = 0; b < 3; b++) {
          var by = DY - 20 - ((t * 60 + b * 40) % 120);
          strokeCircle(DX + Math.sin(t * 3 + b) * 8, by, 3, 'rgba(220,250,255,.7)', 1);
        }
        fxDraw(parts);
      }
    };
  }

  return {
    engines: {
      n07_buoycast: n07BuoyCast,
      n07_linetension: n07LineTension,
      n07_hookrhythm: n07HookRhythm,
      n07_sonarlake: n07SonarLake,
      n07_trawldrop: n07TrawlDrop,
      n07_lurematch: n07LureMatch,
      n07_icehole: n07IceHole,
      n07_reefharpoon: n07ReefHarpoon
    },
    minis: [
      { id: 'n07_buoycast', title: 'Buoy Cast', icon: '🎯', cat: 'SIMULATION', desc: 'Stop the power bar to land the lure on the buoy. Wind pushes the line off course.', engine: 'n07_buoycast', goal: 6 },
      { id: 'n07_linetension', title: 'Line Tension', icon: '🐟', cat: 'SIMULATION', desc: 'Reel while the line stays in the green band. Too slack and nothing moves, too tight and it snaps.', engine: 'n07_linetension', goal: 5 },
      { id: 'n07_hookrhythm', title: 'Hook Rhythm', icon: '🎵', cat: 'ARCADE', desc: 'Bites glide toward three rods. Hit each one on the hook line; gold bites count double.', engine: 'n07_hookrhythm', goal: 25 },
      { id: 'n07_sonarlake', title: 'Sonar Lake', icon: '📡', cat: 'SIMULATION', desc: 'Ping the dark lake to reveal the fish, then hold the lure on one until it bites.', engine: 'n07_sonarlake', goal: 5 },
      { id: 'n07_trawldrop', title: 'Trawl Drop', icon: '🕸️', cat: 'SIMULATION', desc: 'Steer the boat and drop the net. Fish caught in the mouth as it passes count.', engine: 'n07_trawldrop', goal: 8 },
      { id: 'n07_lurematch', title: 'Lure Match', icon: '🪝', cat: 'ARCADE', desc: 'Fish cross the strike zone in three colours. Strike with the matching lure.', engine: 'n07_lurematch', goal: 15 },
      { id: 'n07_icehole', title: 'Ice Hole', icon: '🧊', cat: 'SIMULATION', desc: 'Slide the hole over the fish under the ice and strike. Fish dart away from the hole.', engine: 'n07_icehole', goal: 8 },
      { id: 'n07_reefharpoon', title: 'Reef Harpoon', icon: '🔱', cat: 'ACTION', desc: 'Aim the diver and spear the reef fish. Tuna take two hits. Air runs out fast.', engine: 'n07_reefharpoon', goal: 10 }
    ],
    aaa: []
  };
})();
