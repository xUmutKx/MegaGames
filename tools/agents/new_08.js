window.__AG_new_08 = (function () {
  var TAU = Math.PI * 2;
  var CARS = ["#ff5a7a", "#ffd23d", "#55e6ff", "#a978ff", "#7dff9a", "#ff914d"];

  /* ---------- shared helpers ---------- */
  function wrapA(a) { a = a % TAU; if (a > Math.PI) a -= TAU; if (a < -Math.PI) a += TAU; return a; }
  function rp(x, y, w, h, r) {
    var c = ctx2d; c.beginPath(); c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  // Top-down car; its nose points along +x before rotation by `ang`.
  function drawCar(x, y, ang, col, len, wid) {
    var c = ctx2d; c.save(); c.translate(x, y); c.rotate(ang);
    c.globalAlpha = .35; c.fillStyle = "#000"; rp(-len / 2 + 3, -wid / 2 + 4, len, wid, 5); c.fill(); c.globalAlpha = 1;
    var g = c.createLinearGradient(0, -wid / 2, 0, wid / 2); g.addColorStop(0, col); g.addColorStop(1, "#120c20");
    c.fillStyle = g; rp(-len / 2, -wid / 2, len, wid, 5); c.fill();
    c.fillStyle = "rgba(170,220,255,.85)"; rp(-len * .18, -wid / 2 + 3, len * .36, wid - 6, 3); c.fill();
    c.fillStyle = "#ffe9a0"; c.fillRect(len / 2 - 3, -wid / 2 + 2, 3, 4); c.fillRect(len / 2 - 3, wid / 2 - 6, 3, 4);
    c.fillStyle = "#ff3355"; c.fillRect(-len / 2, -wid / 2 + 2, 3, 4); c.fillRect(-len / 2, wid / 2 - 6, 3, 4);
    c.restore();
  }
  function burst(list, x, y, c, n, spd) {
    for (var i = 0; i < n && list.length < 260; i++) {
      var a = rand(0, TAU), v = rand(spd * .3, spd);
      list.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rand(.25, .6), max: .6, r: rand(1.5, 3.2), c: c });
    }
  }
  function stepFx(list, dt) {
    for (var i = list.length - 1; i >= 0; i--) {
      var f = list[i]; f.x += f.vx * dt; f.y += f.vy * dt; f.vx *= 1 - 2 * dt; f.vy *= 1 - 2 * dt; f.life -= dt;
      if (f.life <= 0) list.splice(i, 1);
    }
  }
  function drawFx(list) {
    if (!list.length) return;
    ctx2d.save(); ctx2d.globalCompositeOperation = "lighter";
    for (var i = 0; i < list.length; i++) { var f = list[i]; ctx2d.globalAlpha = clamp(f.life / f.max, 0, 1); circle(f.x, f.y, f.r, f.c); }
    ctx2d.restore(); ctx2d.globalAlpha = 1;
  }
  // End-of-run helper: the crash/finish effect plays for a moment, then the page is told.
  function runEnd(g) {
    var E = { over: false, win: false, msg: "", t: 0, sent: false };
    E.end = function (win, msg) { if (E.over) return; E.over = true; E.win = win; E.msg = msg || ""; E.t = win ? .7 : .8; };
    E.tick = function (dt) {
      if (E.sent) return; E.t -= dt; if (E.t > 0) return;
      E.sent = true; if (E.win) completeMini(); else miniFail(g, E.msg);
    };
    return E;
  }
  // Shared arcade car model: steering scales with speed, throttle, brake, drift via low lateral grip.
  function carPhys(c, ax, ay, dt, maxSp) {
    var sp = Math.hypot(c.vx, c.vy);
    c.ang += ax * dt * 2.9 * clamp(sp / 140, 0, 1);
    var fx = Math.cos(c.ang), fy = Math.sin(c.ang);
    if (ay < -.2) { var th = 330 * -ay; c.vx += fx * th * dt; c.vy += fy * th * dt; }
    else if (ay > .2) { var br = Math.exp(-2.5 * ay * dt); c.vx *= br; c.vy *= br; }
    var vf = c.vx * fx + c.vy * fy, vl = -c.vx * fy + c.vy * fx;
    var slide = Math.abs(ax) > .5 && sp > 140;
    vl *= Math.exp(-(slide ? 1.2 : 7) * dt);
    vf *= Math.exp(-.22 * dt);
    c.vx = fx * vf - fy * vl; c.vy = fy * vf + fx * vl;
    sp = Math.hypot(c.vx, c.vy);
    if (sp > maxSp) { c.vx *= maxSp / sp; c.vy *= maxSp / sp; }
    c.x += c.vx * dt; c.y += c.vy * dt;
    return slide;
  }
  function quad(x0, y0, w0, x1, y1, w1, c) {
    ctx2d.fillStyle = c; ctx2d.beginPath();
    ctx2d.moveTo(x0 - w0, y0); ctx2d.lineTo(x0 + w0, y0); ctx2d.lineTo(x1 + w1, y1); ctx2d.lineTo(x1 - w1, y1);
    ctx2d.closePath(); ctx2d.fill();
  }
  function triWave(ph) { var m = ph % 2; if (m < 0) m += 2; return m < 1 ? m : 2 - m; }
  function bar(x, y, w, frac, col) { rect(x, y, w, 5, "rgba(255,255,255,.15)"); rect(x, y, w * clamp(frac, 0, 1), 5, col); }

  /* ============ 1. Gutter Weave: 4-lane traffic, pass cars ============ */
  function eWeave(g) {
    var LN = 4, lane = 1.5, tgt = 1.5, t = 0, passed = 0, nit = 0, spawnT = .6, boltT = 3, cars = [], bolts = [], fx = [], dash = 0;
    var E = runEnd(g);
    function road() { var rw = Math.min(W() * .82, 320); return { l: (W() - rw) / 2, rw: rw }; }
    function laneX(f) { var r = road(); return r.l + r.rw * (f + .5) / LN; }
    return {
      update: function (dt) {
        if (E.over) { E.tick(dt); stepFx(fx, dt); return; }
        t += dt;
        tgt = clamp(tgt + AX() * dt * 2.6, 0, LN - 1);
        lane += (tgt - lane) * Math.min(1, dt * 12);
        nit = Math.max(0, nit - dt);
        var sp = 240 + Math.min(150, t * 4) + (nit > 0 ? 150 : 0), P = H() - 190;
        dash = (dash + sp * dt) % 60;
        spawnT -= dt; boltT -= dt;
        if (spawnT <= 0) { spawnT = Math.max(.32, rand(.5, 1.05) - t * .008); cars.push({ ln: randi(0, LN - 1), y: -70, v: rand(110, 210), col: pick(CARS), seen: false }); }
        if (boltT <= 0) { boltT = rand(3, 6); bolts.push({ ln: randi(0, LN - 1), y: -40 }); }
        var px = laneX(lane);
        for (var i = cars.length - 1; i >= 0; i--) {
          var c = cars[i]; c.y += (sp - c.v) * dt;
          if (c.y > H() + 80) { cars.splice(i, 1); continue; }
          if (!c.seen && c.y > P + 40) { c.seen = true; passed++; beep(880, 1100, .06, "triangle", .05); }
          else if (!c.seen && Math.abs(c.y - P) < 42 && Math.abs(laneX(c.ln) - px) < 26) {
            burst(fx, px, P, "#ff5570", 40, 320); beep(160, 60, .4, "sawtooth", .1);
            E.end(false, "Rear-ended. Passed " + passed + " cars"); return;
          }
        }
        for (var j = bolts.length - 1; j >= 0; j--) {
          var b = bolts[j]; b.y += sp * dt;
          if (b.y > H() + 40) bolts.splice(j, 1);
          else if (Math.abs(b.y - P) < 30 && Math.abs(laneX(b.ln) - px) < 24) {
            bolts.splice(j, 1); nit = 3; burst(fx, laneX(b.ln), P, "#55e6ff", 22, 200); beep(1000, 1600, .12, "sine", .06);
          }
        }
        if (passed >= g.goal) { E.end(true); return; }
        hud("Passed " + passed + " / " + g.goal + (nit > 0 ? "  NITRO" : ""));
        stepFx(fx, dt);
      },
      draw: function () {
        var r = road(), w = W(), h = H(), P = H() - 190, px = laneX(lane);
        var gg = ctx2d.createLinearGradient(0, 0, 0, h); gg.addColorStop(0, "#0d3d2b"); gg.addColorStop(1, "#052219");
        ctx2d.fillStyle = gg; ctx2d.fillRect(0, 0, w, h);
        var ag = ctx2d.createLinearGradient(r.l, 0, r.l + r.rw, 0);
        ag.addColorStop(0, "#2a2d43"); ag.addColorStop(.5, "#383c58"); ag.addColorStop(1, "#2a2d43");
        ctx2d.fillStyle = ag; ctx2d.fillRect(r.l, 0, r.rw, h);
        rect(r.l - 7, 0, 7, h, C.gold); rect(r.l + r.rw, 0, 7, h, C.gold);
        for (var i = 1; i < LN; i++) {
          var lx = r.l + r.rw * i / LN;
          for (var y = dash - 60; y < h; y += 60) rect(lx - 2, y, 4, 30, "rgba(255,255,255,.55)");
        }
        for (var j = 0; j < bolts.length; j++) {
          var b = bolts[j], bx = laneX(b.ln);
          ctx2d.globalAlpha = .35; circle(bx, b.y, 20, "#55e6ff"); ctx2d.globalAlpha = 1;
          text("⚡", bx, b.y + 7, 22, C.yellow, "center", 900);
        }
        for (var k = 0; k < cars.length; k++) { var c = cars[k]; drawCar(laneX(c.ln), c.y, Math.PI / 2, c.col, 34, 18); }
        if (nit > 0) { ctx2d.globalAlpha = .45; circle(px, P + 16, 30, "#55e6ff"); ctx2d.globalAlpha = 1; }
        drawCar(px, P, -Math.PI / 2, "#ff2fa8", 36, 19);
        drawFx(fx);
      },
      pointer: function (x) { var r = road(); tgt = clamp(Math.floor((x - r.l) / r.rw * LN), 0, LN - 1); },
      swipe: function (dx, dy) { if (Math.abs(dx) > Math.abs(dy)) tgt = clamp(Math.round(tgt) + (dx < 0 ? -1 : 1), 0, LN - 1); },
      stop: function () {}
    };
  }

  /* ============ 2. Apex Slider: drift around a neon ring ============ */
  function eApex(g) {
    var cx = W() / 2, cy = (80 + H() - 120) / 2, R = Math.min(W() * .36, (H() - 200) / 2 - 20), HW = 34;
    var car = { x: cx, y: cy - R, vx: 0, vy: 0, ang: 0 }, score = 0, combo = 1, drift = 0, idle = 0, offT = 0, offs = 0;
    var fx = [], skid = [], E = runEnd(g), cones = [];
    for (var i = 0; i < 8; i++) cones.push({ a: i * TAU / 8 + .4, k: rand(-.35, .35) });
    function cpos(c) { var rr = R + c.k * HW; return [cx + Math.cos(c.a) * rr, cy + Math.sin(c.a) * rr]; }
    return {
      update: function (dt) {
        if (E.over) { E.tick(dt); stepFx(fx, dt); return; }
        var slide = carPhys(car, AX(), AY(), dt, 420);
        var sp = Math.hypot(car.vx, car.vy), vl = -car.vx * Math.sin(car.ang) + car.vy * Math.cos(car.ang);
        var rr = Math.hypot(car.x - cx, car.y - cy), on = Math.abs(rr - R) < HW;
        if (on) {
          offT = 0;
          if (slide && Math.abs(vl) > 40 && sp > 110) {
            drift += dt; idle = 0; score += Math.abs(vl) * dt * .3 * combo; combo = Math.min(5, 1 + drift / 2.5);
            skid.push({ x: car.x, y: car.y }); if (skid.length > 140) skid.shift();
          } else { idle += dt; if (idle > .8) { combo = 1; drift = 0; } }
        } else {
          offT += dt; idle = 0; drift = 0; combo = 1;
          car.vx *= Math.exp(-3 * dt); car.vy *= Math.exp(-3 * dt);
          if (Math.random() < .5) burst(fx, car.x, car.y, "#c9a36b", 2, 90);
          if (offT > 1.1) {
            offs++; offT = 0;
            var sc = R / Math.max(rr, 1);
            car.x = cx + (car.x - cx) * sc; car.y = cy + (car.y - cy) * sc; car.vx *= .3; car.vy *= .3;
            beep(180, 90, .2, "sawtooth", .08);
            if (offs >= 3) { E.end(false, "Left the track 3 times. Drift " + Math.floor(score)); return; }
          }
        }
        for (var n = 0; n < cones.length; n++) {
          var c = cones[n], p = cpos(c);
          if (dist(car.x, car.y, p[0], p[1]) < 20) {
            score = Math.max(0, score - 25); combo = 1; drift = 0;
            burst(fx, p[0], p[1], C.orange, 16, 170); beep(300, 120, .12, "square", .05);
            c.a = rand(0, TAU); c.k = rand(-.35, .35);
          }
        }
        if (score >= g.goal) { E.end(true); return; }
        hud("Drift " + Math.floor(score) + " / " + g.goal + "  x" + combo.toFixed(1) + "  off " + offs + "/3");
        stepFx(fx, dt);
      },
      draw: function () {
        var w = W(), h = H();
        var gg = ctx2d.createRadialGradient(cx, cy, R * .2, cx, cy, Math.max(w, h) * .7);
        gg.addColorStop(0, "#15433a"); gg.addColorStop(1, "#06140f");
        ctx2d.fillStyle = gg; ctx2d.fillRect(0, 0, w, h);
        ctx2d.beginPath(); ctx2d.arc(cx, cy, R + HW, 0, TAU); ctx2d.arc(cx, cy, R - HW, 0, TAU, true);
        ctx2d.fillStyle = "#2c2a40"; ctx2d.fill();
        ctx2d.save(); ctx2d.lineWidth = 5; ctx2d.setLineDash([14, 14]);
        ctx2d.strokeStyle = "#ff4f7a"; ctx2d.beginPath(); ctx2d.arc(cx, cy, R + HW, 0, TAU); ctx2d.stroke();
        ctx2d.lineDashOffset = 14; ctx2d.strokeStyle = "#f4f4fa"; ctx2d.beginPath(); ctx2d.arc(cx, cy, R - HW, 0, TAU); ctx2d.stroke();
        ctx2d.lineWidth = 2; ctx2d.lineDashOffset = 0; ctx2d.setLineDash([10, 12]); ctx2d.strokeStyle = "rgba(255,255,255,.2)";
        ctx2d.beginPath(); ctx2d.arc(cx, cy, R, 0, TAU); ctx2d.stroke();
        ctx2d.restore();
        for (var i = 0; i < skid.length; i++) circle(skid[i].x, skid[i].y, 2, "rgba(0,0,0,.35)");
        for (var n = 0; n < cones.length; n++) {
          var p = cpos(cones[n]);
          polygon([[p[0], p[1] - 8], [p[0] - 7, p[1] + 7], [p[0] + 7, p[1] + 7]], C.orange);
        }
        drawCar(car.x, car.y, car.ang, "#ff3d8b", 30, 16);
        drawFx(fx);
      },
      stop: function () {}
    };
  }

  /* ============ 3. Ring Circuit: oval race vs three rivals ============ */
  function eRing(g) {
    var cx = W() / 2, cy = (80 + H() - 120) / 2, rx = Math.min(W() * .36, 150), ry = Math.min((H() - 220) / 2, 250), HW = 40;
    var rad = (rx + ry) / 2, E = runEnd(g), fx = [];
    var car = { th: 0, d: 0 }, spd = 240, nit = 100, nitT = 0, tires = 100, t = 0;
    var rivals = [], offsets = [-22, 22, 0], colors = ["#55e6ff", "#ffd23d", "#a978ff"];
    for (var i = 0; i < 3; i++) rivals.push({ th: -.22 - i * .2, d: offsets[i], tgt: offsets[i], spd: 205 + i * 14 + rand(0, 10), tt: 0, cool: 0, col: colors[i] });
    function pt(th, dd) { return [cx + (rx + dd) * Math.cos(th), cy + (ry + dd) * Math.sin(th)]; }
    function headOf(th) { return Math.atan2(ry * Math.cos(th), -rx * Math.sin(th)); }
    return {
      update: function (dt) {
        if (E.over) { E.tick(dt); stepFx(fx, dt); return; }
        t += dt;
        var target = AY() < -.2 ? 340 : AY() > .2 ? 150 : 250;
        if (pressed("a") && nit >= 35) { nit -= 35; nitT = 1.2; beep(300, 900, .2, "sawtooth", .06); }
        if (nitT > 0) { target += 130; nitT -= dt; }
        spd += (target - spd) * Math.min(1, dt * 1.6);
        nit = Math.min(100, nit + dt * 12);
        car.th += spd * dt / rad;
        car.d = clamp(car.d + AX() * dt * 170, -HW, HW);
        var p = pt(car.th, car.d);
        if (Math.abs(car.d) > HW - 9) { tires -= 12 * dt * (spd / 260); if (Math.random() < .6) burst(fx, p[0], p[1], C.orange, 2, 110); }
        else tires = Math.min(100, tires + dt * 2);
        for (var i = 0; i < rivals.length; i++) {
          var r = rivals[i];
          r.th += r.spd * dt / rad; r.cool -= dt;
          r.tt -= dt; if (r.tt <= 0) { r.tt = rand(1.5, 3); r.tgt = rand(-HW + 12, HW - 12); }
          r.d += (r.tgt - r.d) * Math.min(1, dt * .8);
          var dth = wrapA(r.th - car.th);
          if (r.cool <= 0 && Math.abs(dth * rad) < 24 && Math.abs(r.d - car.d) < 24) {
            r.cool = .5; spd = Math.max(120, spd - 60); car.d = clamp(car.d + (car.d >= r.d ? 8 : -8), -HW, HW); tires -= 4;
            burst(fx, p[0], p[1], C.yellow, 12, 200); beep(200, 120, .1, "square", .06);
          }
        }
        var laps = Math.floor(car.th / TAU);
        if (car.th / TAU >= g.goal) { E.end(true); return; }
        if (tires <= 0) { E.end(false, "Tires shredded on lap " + (laps + 1)); return; }
        var pos = 1;
        for (var j = 0; j < rivals.length; j++) if (rivals[j].th > car.th) pos++;
        hud(Math.min(g.goal, laps) + " / " + g.goal + " laps  P" + pos + "  tires " + Math.max(0, Math.ceil(tires)));
        stepFx(fx, dt);
      },
      draw: function () {
        var w = W(), h = H();
        clear("#0f2a1c");
        ctx2d.beginPath(); ctx2d.ellipse(cx, cy, rx + HW, ry + HW, 0, 0, TAU); ctx2d.fillStyle = "#34364c"; ctx2d.fill();
        ctx2d.save(); ctx2d.lineWidth = 5; ctx2d.setLineDash([16, 16]); ctx2d.strokeStyle = "#ff4f7a";
        ctx2d.beginPath(); ctx2d.ellipse(cx, cy, rx + HW, ry + HW, 0, 0, TAU); ctx2d.stroke(); ctx2d.restore();
        ctx2d.beginPath(); ctx2d.ellipse(cx, cy, rx - HW, ry - HW, 0, 0, TAU); ctx2d.fillStyle = "#17492f"; ctx2d.fill();
        ctx2d.save(); ctx2d.lineWidth = 2; ctx2d.setLineDash([10, 12]); ctx2d.strokeStyle = "rgba(255,255,255,.2)";
        ctx2d.beginPath(); ctx2d.ellipse(cx, cy, rx, ry, 0, 0, TAU); ctx2d.stroke(); ctx2d.restore();
        var a = pt(0, -HW), b = pt(0, HW);
        line(a[0], a[1], b[0], b[1], "#ffffff", 6);
        for (var i = 0; i < rivals.length; i++) {
          var q = pt(rivals[i].th, rivals[i].d);
          drawCar(q[0], q[1], headOf(rivals[i].th), rivals[i].col, 30, 16);
        }
        var pq = pt(car.th, car.d);
        if (nitT > 0) { ctx2d.globalAlpha = .45; circle(pq[0], pq[1], 26, "#55e6ff"); ctx2d.globalAlpha = 1; }
        drawCar(pq[0], pq[1], headOf(car.th), "#ff2fa8", 34, 18);
        drawFx(fx);
        bar(20, 84, w - 40, tires / 100, tires > 35 ? C.green : C.red);
        bar(20, 94, w - 40, nit / 100, C.cyan);
      },
      stop: function () {}
    };
  }

  /* ============ 4. Horizon Run: pseudo-3D curving highway ============ */
  function eHorizon(g) {
    var w0 = W(), h0 = H(), HOR = Math.round(h0 * .38), HWd = w0 * .46, KY = h0 - 120 - HOR;
    var P = 0, spd = 26, camX = 0, coins = 0, t = 0, obs = [], nextK = 6, fx = [], E = runEnd(g), DRAW = 46;
    function cur(k) { return .018 * Math.sin(k * .0213) + .01 * Math.sin(k * .0067 + 1.7); }
    function spawn() {
      while (nextK < P + DRAW) {
        obs.push({ k: nextK, ox: rand(-.7, .7), rock: Math.random() < .3, done: false, gone: false });
        if (Math.random() < .4) obs.push({ k: nextK, ox: rand(-.7, .7), rock: false, done: false, gone: false });
        nextK += Math.round(rand(2.5, 4.5));
      }
    }
    function carX() { var cdk = KY / (h0 - 200 - HOR); return W() / 2 + camX * (HWd / cdk); }
    return {
      update: function (dt) {
        if (E.over) { E.tick(dt); stepFx(fx, dt); return; }
        t += dt;
        var target = 28 + Math.min(t, 80) * .3;
        if (AY() < -.2) target *= 1.35; else if (AY() > .2) target *= .6;
        spd += (target - spd) * Math.min(1, dt * 2);
        P += spd * dt;
        camX = clamp(camX + AX() * dt * 1.5, -1, 1);
        if (Math.abs(camX) > .95) spd *= Math.exp(-1.2 * dt);
        spawn();
        for (var i = 0; i < obs.length; i++) {
          var o = obs[i], r = o.k - P;
          if (!o.done && r < 1.1) {
            o.done = true;
            if (Math.abs(o.ox - camX) < .3) {
              if (o.rock) { burst(fx, carX(), h0 - 200, C.orange, 30, 260); E.end(false, "Hit a rock with " + coins + " coins"); return; }
              coins++; o.gone = true; burst(fx, carX(), h0 - 200, C.gold, 12, 160); beep(900, 1300, .08, "triangle", .06);
            }
          }
        }
        obs = obs.filter(function (q) { return q.k - P > -2 && !q.gone; });
        if (coins >= g.goal) { E.end(true); return; }
        hud("Coins " + coins + " / " + g.goal + "  distance " + Math.floor(P) + " m");
        stepFx(fx, dt);
      },
      draw: function () {
        var w = W(), h = H(), base = Math.floor(P) + 1, fr = P - Math.floor(P);
        var sky = ctx2d.createLinearGradient(0, 0, 0, HOR);
        sky.addColorStop(0, "#14062e"); sky.addColorStop(.7, "#5b1a5e"); sky.addColorStop(1, "#ff6f7a");
        ctx2d.fillStyle = sky; ctx2d.fillRect(0, 0, w, HOR + 2);
        var sun = ctx2d.createRadialGradient(w / 2, HOR - 10, 4, w / 2, HOR - 10, 90);
        sun.addColorStop(0, "#fff3a0"); sun.addColorStop(.5, "#ff7ab0"); sun.addColorStop(1, "rgba(255,80,160,0)");
        ctx2d.fillStyle = sun; ctx2d.fillRect(w / 2 - 90, HOR - 100, 180, 100);
        var xs = [], ys = [], hw = [], cxs = [], x = 0, dx = 0;
        for (var n = 0; n <= DRAW; n++) {
          var dk = n + 1 - fr;
          xs[n] = x; hw[n] = HWd / dk; ys[n] = HOR + KY / dk; cxs[n] = w / 2 + (x - camX) * hw[n];
          dx += cur(base + n); x += dx;
        }
        for (var i = DRAW - 1; i >= 0; i--) {
          var k = base + i, y0 = ys[i], y1 = ys[i + 1], band = (k % 4) < 2;
          ctx2d.fillStyle = band ? "#0e5536" : "#0b4a2f";
          ctx2d.fillRect(0, y1, w, y0 - y1 + 1);
          quad(cxs[i], y0, hw[i] * 1.12, cxs[i + 1], y1, hw[i + 1] * 1.12, band ? "#ff3b5c" : "#f4f4fa");
          quad(cxs[i], y0, hw[i], cxs[i + 1], y1, hw[i + 1], band ? "#4a4a62" : "#44455c");
          for (var q = 0; q < obs.length; q++) {
            var o = obs[q];
            if (o.k !== k || o.gone) continue;
            var sx = cxs[i] + o.ox * hw[i], sy = y0, sz = Math.max(3, HWd * .1 / (i + 1 - fr));
            if (o.rock) { ctx2d.fillStyle = "#2a2233"; ctx2d.beginPath(); ctx2d.ellipse(sx, sy - sz * .4, sz * .7, sz * .5, 0, 0, TAU); ctx2d.fill(); }
            else {
              ctx2d.globalAlpha = .35; circle(sx, sy - sz * .6, sz * .9, C.gold); ctx2d.globalAlpha = 1;
              circle(sx, sy - sz * .6, sz * .45, C.yellow);
            }
          }
        }
        var cdk = KY / (h - 200 - HOR);
        drawCar(w / 2 + camX * (HWd / cdk), h - 200, -Math.PI / 2, "#ff2fa8", 46, 22);
        drawFx(fx);
      },
      stop: function () {}
    };
  }

  /* ============ 5. Boost Gates: beat the clock through glowing rings ============ */
  function eGates(g) {
    var x = W() / 2, y = H() * .6, ang = -Math.PI / 2, sp = 0, boost = 100, timeLeft = 14, cnt = 0, gates = [], fx = [], t = 0, E = runEnd(g);
    function addGate() {
      var last = gates.length ? gates[gates.length - 1] : { x: x, y: y };
      for (var tries = 0; tries < 30; tries++) {
        var a = rand(0, TAU), d = rand(120, 220), gx = last.x + Math.cos(a) * d, gy = last.y + Math.sin(a) * d;
        if (gx > 40 && gx < W() - 40 && gy > 110 && gy < H() - 150) { gates.push({ x: gx, y: gy }); return; }
      }
      gates.push({ x: W() / 2, y: H() * .45 });
    }
    for (var i = 0; i < 3; i++) addGate();
    return {
      update: function (dt) {
        if (E.over) { E.tick(dt); stepFx(fx, dt); return; }
        t += dt;
        ang += AX() * dt * 3 * clamp(sp / 160, .35, 1);
        if (AY() < -.2) sp = Math.min(340, sp + 240 * dt); else sp = Math.max(0, sp - 150 * dt);
        boost = Math.min(100, boost + 14 * dt);
        if (pressed("a") && boost >= 30) { boost -= 30; sp = Math.max(sp, 430); burst(fx, x, y, C.cyan, 24, 220); beep(300, 900, .25, "sawtooth", .06); }
        x += Math.cos(ang) * sp * dt; y += Math.sin(ang) * sp * dt;
        if (x < 22 || x > W() - 22) { ang = Math.PI - ang; x = clamp(x, 22, W() - 22); sp *= .7; }
        if (y < 96 || y > H() - 140) { ang = -ang; y = clamp(y, 96, H() - 140); sp *= .7; }
        var gt = gates[0];
        if (dist(x, y, gt.x, gt.y) < 34) {
          cnt++; timeLeft = Math.min(timeLeft + 4, 16); gates.shift(); addGate();
          burst(fx, gt.x, gt.y, C.gold, 30, 260); beep(900, 1400, .15, "sine", .07);
          if (cnt >= g.goal) { E.end(true); return; }
        }
        timeLeft -= dt;
        if (timeLeft <= 0) { E.end(false, "Out of time after " + cnt + " gates"); return; }
        hud("Gates " + cnt + " / " + g.goal + "  time " + Math.ceil(Math.max(0, timeLeft)) + "  boost " + Math.floor(boost));
        stepFx(fx, dt);
      },
      draw: function () {
        var w = W(), h = H();
        clear("#070a1a");
        ctx2d.save(); ctx2d.strokeStyle = "rgba(85,230,255,.07)"; ctx2d.lineWidth = 1; ctx2d.beginPath();
        for (var gx = 0; gx < w; gx += 40) { ctx2d.moveTo(gx, 0); ctx2d.lineTo(gx, h); }
        for (var gy = 0; gy < h; gy += 40) { ctx2d.moveTo(0, gy); ctx2d.lineTo(w, gy); }
        ctx2d.stroke(); ctx2d.restore();
        var nxt = gates[0];
        ctx2d.save(); ctx2d.setLineDash([6, 8]); line(x, y, nxt.x, nxt.y, "rgba(85,230,255,.35)", 2); ctx2d.restore();
        for (var i = gates.length - 1; i >= 0; i--) {
          var gt = gates[i], cur = i === 0, col = cur ? C.cyan : C.purple;
          ctx2d.globalAlpha = cur ? .3 : .15; circle(gt.x, gt.y, cur ? 42 : 30, col); ctx2d.globalAlpha = 1;
          strokeCircle(gt.x, gt.y, cur ? 28 + Math.sin(t * 6) * 3 : 22, col, cur ? 4 : 2);
        }
        if (boost > 30 && Math.random() < .5) { ctx2d.globalAlpha = .5; circle(x - Math.cos(ang) * 18, y - Math.sin(ang) * 18, 6, C.orange); ctx2d.globalAlpha = 1; }
        drawCar(x, y, ang, "#7dff9a", 32, 17);
        drawFx(fx);
      },
      stop: function () {}
    };
  }

  /* ============ 6. Barrier Thread: slide through moving gaps ============ */
  function eBarrier(g) {
    var px = W() / 2, tx = px, py = H() - 190, rows = [], cnt = 0, sp = 190, t = 0, fx = [], E = runEnd(g), lastC = W() / 2;
    function spawnRow() {
      var c = clamp(lastC + rand(-170, 170), 70, W() - 70); lastC = c;
      rows.push({ y: -60, c: c, amp: cnt > 5 ? rand(0, 46) : 0, ph: rand(0, TAU), chk: false });
    }
    function gapW() { return Math.max(86, 150 - cnt * 2.5); }
    function gapC(r) { return clamp(r.c + Math.sin(t * 2 + r.ph) * r.amp, 50, W() - 50); }
    function block(x0, y, w2) {
      if (w2 <= 0) return;
      for (var xx = x0, k = 0; xx < x0 + w2; xx += 18, k++) rect(xx, y - 9, Math.min(18, x0 + w2 - xx), 18, k % 2 ? C.red : "#f4f4fa");
    }
    return {
      update: function (dt) {
        if (E.over) { E.tick(dt); stepFx(fx, dt); return; }
        t += dt;
        sp = Math.min(420, 190 + cnt * 5 + t * 1.5);
        tx = clamp(tx + AX() * dt * 320, 30, W() - 30);
        px += (tx - px) * Math.min(1, dt * 14);
        if (!rows.length || rows[rows.length - 1].y >= 200) spawnRow();
        for (var i = rows.length - 1; i >= 0; i--) {
          var r = rows[i]; r.y += sp * dt;
          if (!r.chk && r.y >= py) {
            r.chk = true;
            var gw = gapW(), gc = gapC(r);
            if (Math.abs(px - gc) > gw / 2 - 16) { burst(fx, px, py, C.red, 40, 300); beep(160, 60, .4, "sawtooth", .1); E.end(false, "Clipped a barrier after " + cnt + " gates"); return; }
            cnt++; burst(fx, px, py, C.green, 18, 200); beep(800, 1200, .08, "triangle", .05);
          }
          if (r.y > H() + 60) rows.splice(i, 1);
        }
        if (cnt >= g.goal) { E.end(true); return; }
        hud("Gates " + cnt + " / " + g.goal + "  speed " + Math.floor(sp));
        stepFx(fx, dt);
      },
      draw: function () {
        var w = W(), h = H(), gw = gapW();
        clear("#0b0a1a");
        for (var y = (t * sp) % 40; y < h; y += 40) rect(0, y, w, 2, "rgba(255,255,255,.04)");
        for (var i = 0; i < rows.length; i++) {
          var r = rows[i], gc = gapC(r), l = gc - gw / 2, rt = gc + gw / 2;
          block(0, r.y, l);
          block(rt, r.y, w - rt);
          circle(l, r.y, 4, C.yellow); circle(rt, r.y, 4, C.yellow);
        }
        drawCar(px, py, -Math.PI / 2, C.yellow, 30, 16);
        drawFx(fx);
      },
      pointer: function (x) { tx = clamp(x, 30, W() - 30); },
      swipe: function (dx) { tx = clamp(tx + (dx < 0 ? -60 : 60), 30, W() - 30); },
      stop: function () {}
    };
  }

  /* ============ 7. Gear Timing: stop the needle in the green zone ============ */
  function eShift(g) {
    var ph = 0, zc = .5, zw = .2, round = 0, perfect = 0, flash = 0, flashT = "", fx = [], E = runEnd(g), t = 0;
    function newZone() { zw = Math.max(.05, .2 - round * .012); zc = rand(zw / 2 + .06, .94 - zw / 2); }
    function needle() { return triWave(ph); }
    function shift() {
      if (E.over) return;
      var v = needle(), err = Math.abs(v - zc);
      if (err <= zw / 2) {
        round++;
        if (err < zw / 4) { perfect++; flashT = "PERFECT"; } else flashT = "GOOD";
        flash = .5; burst(fx, W() / 2, H() * .5, C.green, 26, 220); beep(700, 1300, .12, "square", .05);
        if (round >= g.goal) { E.end(true); return; }
        newZone();
      } else {
        flashT = "MISSED"; flash = .5; beep(200, 80, .3, "sawtooth", .1);
        E.end(false, "Missed the shift by " + Math.max(1, Math.round((err - zw / 2) * 100)) + "%");
      }
    }
    return {
      update: function (dt) {
        if (E.over) { E.tick(dt); stepFx(fx, dt); return; }
        t += dt; ph += dt * (1.1 + round * .09);
        flash = Math.max(0, flash - dt);
        var p1 = pressed("a"), p2 = pressed("b"), p3 = pressed("c");
        if (p1 || p2 || p3) shift();
        if (E.over) return;
        stepFx(fx, dt);
        hud("Shifts " + round + " / " + g.goal + "  perfect " + perfect);
      },
      draw: function () {
        var w = W(), h = H(), bx = 30, bw = w - 60, by = h * .5;
        clear("#0a0812");
        rect(bx - 4, by - 26, bw + 8, 52, "#17132a", 6);
        rect(bx + bw * .85, by - 20, bw * .15, 40, "rgba(255,80,110,.35)");
        rect(bx + bw * (zc - zw / 2), by - 20, bw * zw, 40, "rgba(90,255,150,.5)");
        for (var i = 0; i <= 20; i++) rect(bx + bw * i / 20, by + 18, 2, 6, "rgba(255,255,255,.4)");
        var nx = bx + bw * needle();
        ctx2d.globalAlpha = .4; circle(nx, by, 16, C.cyan); ctx2d.globalAlpha = 1;
        rect(nx - 2, by - 30, 4, 60, C.white);
        text("GEAR " + (round + 1), w / 2, by - 70, 26, C.white, "center", 900);
        if (flash > 0) text(flashT, w / 2, by + 80, 22, flashT === "MISSED" ? C.red : C.green, "center", 900);
        var py = h - 170;
        rect(30, py, w - 60, 10, "#222031", 4);
        var carX = 30 + (w - 90) * clamp(round / g.goal, 0, 1);
        drawCar(carX, py + 5, 0, C.pink, 34, 18);
        drawFx(fx);
      },
      pointer: function () { shift(); },
      stop: function () {}
    };
  }

  /* ============ 8. Arena Ram: knock rivals off a round arena ============ */
  function eRam(g) {
    var cx = W() / 2, cy = (80 + H() - 120) / 2, R = Math.min(W() * .4, (H() - 230) / 2);
    var me = { x: cx, y: cy + R * .45, vx: 0, vy: 0, ang: -Math.PI / 2, hp: 100 };
    var foes = [], ko = 0, fx = [], E = runEnd(g);
    function spawnFoe() {
      for (var tries = 0; tries < 12; tries++) {
        var a = rand(0, TAU), x = cx + Math.cos(a) * R * .72, y = cy + Math.sin(a) * R * .72;
        if (dist(x, y, me.x, me.y) > 150) { foes.push({ x: x, y: y, vx: 0, vy: 0, ang: a + Math.PI, hp: 100, col: pick(CARS), gone: false }); return; }
      }
    }
    for (var i = 0; i < 3; i++) spawnFoe();
    return {
      update: function (dt) {
        if (E.over) { E.tick(dt); stepFx(fx, dt); return; }
        carPhys(me, AX(), AY(), dt, 380);
        if (Math.hypot(me.x - cx, me.y - cy) > R + 14) {
          me.hp -= 22 * dt; me.vx *= Math.exp(-2 * dt); me.vy *= Math.exp(-2 * dt);
          if (Math.random() < .3) burst(fx, me.x, me.y, C.red, 2, 120);
        }
        var alive = 0, j, f;
        for (var n = 0; n < foes.length; n++) {
          f = foes[n];
          if (f.gone) continue;
          if (f.hp > 0) {
            alive++;
            var diff = wrapA(Math.atan2(me.y - f.y, me.x - f.x) - f.ang);
            f.ang += clamp(diff, -2.2 * dt, 2.2 * dt);
            f.vx += (Math.cos(f.ang) * 170 - f.vx) * Math.min(1, dt * 2);
            f.vy += (Math.sin(f.ang) * 170 - f.vy) * Math.min(1, dt * 2);
          } else { var dr = Math.exp(-1.5 * dt); f.vx *= dr; f.vy *= dr; }
          f.x += f.vx * dt; f.y += f.vy * dt;
          if (Math.hypot(f.x - cx, f.y - cy) > R + 22) {
            f.gone = true; ko++; burst(fx, f.x, f.y, C.yellow, 20, 240); beep(500, 900, .2, "triangle", .08);
          }
        }
        for (j = 0; j < foes.length; j++) {
          var q = foes[j];
          if (q.gone) continue;
          var dx = q.x - me.x, dy = q.y - me.y, d = Math.hypot(dx, dy);
          if (d < 30 && d > .01) {
            var nx = dx / d, ny = dy / d, rel = (me.vx - q.vx) * nx + (me.vy - q.vy) * ny, ov = (30 - d) / 2;
            me.x -= nx * ov; me.y -= ny * ov; q.x += nx * ov; q.y += ny * ov;
            if (rel > 0) {
              me.vx -= nx * rel; me.vy -= ny * rel; q.vx += nx * rel; q.vy += ny * rel;
              me.hp -= rel * .03; q.hp -= rel * .07;
              burst(fx, (me.x + q.x) / 2, (me.y + q.y) / 2, C.yellow, Math.min(20, 4 + rel / 20), 240);
              beep(260, 110, .08, "sawtooth", .05);
            }
          }
        }
        for (j = foes.length - 1; j >= 0; j--) if (foes[j].gone) foes.splice(j, 1);
        if (alive < Math.min(6, 3 + Math.floor(ko / 2)) && foes.length < 10) spawnFoe();
        if (me.hp <= 0) { E.end(false, "Wrecked after " + ko + " knockouts"); return; }
        if (ko >= g.goal) { E.end(true); return; }
        hud("KO " + ko + " / " + g.goal + "  HP " + Math.max(0, Math.ceil(me.hp)));
        stepFx(fx, dt);
      },
      draw: function () {
        var w = W(), h = H();
        clear("#07050f");
        var gg = ctx2d.createRadialGradient(cx, cy, 10, cx, cy, R * 1.1);
        gg.addColorStop(0, "#2c2a4e"); gg.addColorStop(1, "#120f22");
        ctx2d.beginPath(); ctx2d.arc(cx, cy, R, 0, TAU); ctx2d.fillStyle = gg; ctx2d.fill();
        ctx2d.save(); ctx2d.lineWidth = 10; ctx2d.setLineDash([22, 16]);
        ctx2d.strokeStyle = "#ff4f7a"; ctx2d.beginPath(); ctx2d.arc(cx, cy, R, 0, TAU); ctx2d.stroke();
        ctx2d.lineDashOffset = 19; ctx2d.strokeStyle = "#f4f4fa"; ctx2d.stroke(); ctx2d.restore();
        for (var i = 0; i < foes.length; i++) {
          var f = foes[i];
          if (f.gone) continue;
          drawCar(f.x, f.y, f.ang, f.hp > 0 ? f.col : "#555566", 34, 18);
          if (f.hp > 0) bar(f.x - 16, f.y - 26, 32, f.hp / 100, C.green);
        }
        drawCar(me.x, me.y, me.ang, "#ff2fa8", 34, 18);
        bar(20, 84, w - 40, me.hp / 100, me.hp > 35 ? C.green : C.red);
        drawFx(fx);
      },
      stop: function () {}
    };
  }

  var ENGINES = {
    n08_weave: eWeave, n08_apex: eApex, n08_ringlaps: eRing, n08_horizon: eHorizon,
    n08_gates: eGates, n08_barrier: eBarrier, n08_shift: eShift, n08_ram: eRam
  };

  var MINIS = [
    { id: "n08_weave", title: "Gutter Weave", icon: "🚗", cat: "RACING", desc: "Rush-hour traffic in four lanes. Weave between cars, pass as many as you can and grab nitro bolts. One rear-end ends the run.", engine: "n08_weave", goal: 25 },
    { id: "n08_apex", title: "Apex Slider", icon: "🌀", cat: "RACING", desc: "Slide around a neon ring. Drift at speed to bank points, lose them on cones, and leave the track three times and it is over.", engine: "n08_apex", goal: 400 },
    { id: "n08_ringlaps", title: "Ring Circuit", icon: "🏁", cat: "RACING", desc: "Race three rivals around an oval. Hug the inside for pace, but scraping the walls shreds your tires. Nitro on A.", engine: "n08_ringlaps", goal: 3 },
    { id: "n08_horizon", title: "Horizon Run", icon: "🛣️", cat: "RACING", desc: "A pseudo-3D highway bending through the hills. Collect gold coins, dodge the rocks, and hold throttle for speed.", engine: "n08_horizon", goal: 25 },
    { id: "n08_gates", title: "Boost Gates", icon: "🟢", cat: "RACING", desc: "Fly through the glowing gate ahead before the clock runs out. Every gate adds time. A gives a boost.", engine: "n08_gates", goal: 12 },
    { id: "n08_barrier", title: "Barrier Thread", icon: "🚧", cat: "RACING", desc: "Barriers roll toward you, each with a gap that narrows and starts to sway. Thread the car through every one.", engine: "n08_barrier", goal: 25 },
    { id: "n08_shift", title: "Gear Timing", icon: "⏱️", cat: "RACING", desc: "Drag-strip timing. A needle sweeps the tach; shift when it crosses the green zone. The zone shrinks and the sweep quickens.", engine: "n08_shift", goal: 10 },
    { id: "n08_ram", title: "Arena Ram", icon: "💥", cat: "RACING", desc: "Ram rival cars off a round arena. Each knockout counts, and crash damage drains your health.", engine: "n08_ram", goal: 10 }
  ];

  return { engines: ENGINES, minis: MINIS, aaa: [] };
})();
