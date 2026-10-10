window.__AG_fix_17 = (function () {
  /* Click Pen: ink runs down, taps refill it; combos grant bonus clicks; pen dries when empty. */
  function clickyEngine(g) {
    var K = p14_kit(), TL = 20, INK_MAX = 1;
    var t = 0, clicks = 0, ink = 1, dry = false, combo = 0, lastT = -9, ext = 0, done = false;

    function tap(x, y) {
      if (done) return;
      if (dry) { beep(180, 140, .05, "sawtooth", .04); return; }
      combo = (t - lastT < .45) ? Math.min(combo + 1, 15) : 1;
      lastT = t;
      clicks++;
      if (combo >= 5 && combo % 5 === 0) { clicks++; K.pop("+1 combo", x, y - 30, C.gold); }
      ink = Math.min(INK_MAX, ink + .15);
      ext = 1;
      K.burst(x, y, combo >= 5 ? C.gold : "#55e6ff", combo >= 5 ? 10 : 6, 120);
      beep(900 + rand(0, 200) + combo * 40, 1200, .03, "square", .05);
      if (clicks >= g.goal) { done = true; completeMini(); }
    }

    return {
      update: function (dt) {
        K.step(dt);
        ext = Math.max(0, ext - dt * 8);
        if (done) return;
        t += dt;
        if (dry) { ink += dt * .3; if (ink >= .3) { dry = false; ink = .3; } }
        else {
          ink -= dt * .3;
          if (ink <= 0) { ink = 0; dry = true; K.shake = .3; beep(260, 140, .15, "sawtooth", .06); }
        }
        if (t >= TL) {
          done = true;
          if (clicks >= g.goal) completeMini(); else miniFail(g, "Time's up: " + clicks + "/" + g.goal);
          return;
        }
        hud("⏱ " + Math.ceil(TL - t) + " • " + clicks + "/" + g.goal + (combo >= 3 ? " • x" + combo : ""));
      },
      pointer: tap,
      stop: function () {},
      draw: function () {
        K.begin();
        st_bg("#120c24", "#07050f");
        var cx = W() / 2, cy = H() * .42, bw = Math.min(120, W() * .3);
        var frac = Math.max(0, 1 - t / TL);
        ctx2d.lineWidth = 8; ctx2d.lineCap = "round";
        ctx2d.strokeStyle = "rgba(255,255,255,.1)"; ctx2d.beginPath(); ctx2d.arc(cx, cy, 150, 0, 6.283); ctx2d.stroke();
        ctx2d.strokeStyle = frac > .25 ? "#55e6ff" : "#ff5570";
        ctx2d.beginPath(); ctx2d.arc(cx, cy, 150, -1.5708, -1.5708 + 6.283 * frac); ctx2d.stroke();
        ctx2d.lineCap = "butt";
        /* pen body, nib and a shine stripe */
        rect(cx - bw / 2, cy - 130, bw, 300, dry ? "#3a3340" : "#2b3a5c", bw * .2);
        rect(cx - bw * .36, cy - 120, bw * .14, 280, "rgba(255,255,255,.12)", 6);
        rect(cx - bw * .22, cy - 170 + ext * 16, bw * .44, 36, dry ? "#66606b" : "#ff4fd8", 12);
        ctx2d.beginPath();
        ctx2d.moveTo(cx - bw * .12, cy + 170); ctx2d.lineTo(cx + bw * .12, cy + 170);
        ctx2d.lineTo(cx, cy + 200 + ext * 10); ctx2d.fillStyle = dry ? "#777" : "#ffe36e"; ctx2d.fill();
        /* ink meter */
        rect(40, H() - 150, W() - 80, 14, "rgba(255,255,255,.12)", 7);
        rect(40, H() - 150, (W() - 80) * ink, 14, dry ? "#ff5570" : "#55e6ff", 7);
        if (dry) text("PEN DRY, keep tapping", cx, cy + 250, 20, "#ff5570", "center");
        else if (combo >= 3) text("combo x" + combo, cx, cy + 250, 26, C.gold, "center");
        K.end();
      }
    };
  }

  /* Rain Bucket: gusty wind pushes the drops, gold drops are worth 3, five missed drops floods it. */
  function rainEngine(g) {
    var K = p14_kit(), LIVES = 5;
    var drops = [], bx = W() / 2, tx = W() / 2, down = false, got = 0, lives = LIVES;
    var cool = 0, wind = 0, wt = 0, t = 0, done = false, over = false;
    var BW = function () { return Math.min(110, W() * .28); }, BY = function () { return H() - 170; };
    var d = p2_drag({ move: function (x) { if (down) tx = x; }, up: function () { down = false; } });

    function spawn() {
      var gold = Math.random() < .14;
      drops.push({ x: rand(30, W() - 30), y: -20, v: rand(240, 320) * (gold ? 1.2 : 1), gold: gold });
    }

    return {
      update: function (dt) {
        if (done || over) return;
        K.step(dt);
        t += dt;
        cool -= dt;
        if (cool <= 0) { cool = rand(.25, .5) * (1 - Math.min(.35, t / 120)); spawn(); }
        wt -= dt;
        if (wt <= 0) { wind = rand(-80, 80) * Math.min(1, t / 30); wt = rand(3, 5); }
        bx += (tx - bx) * Math.min(1, dt * 14);
        bx = clamp(bx, BW() / 2, W() - BW() / 2);
        for (var i = drops.length - 1; i >= 0; i--) {
          var o = drops[i];
          o.x = clamp(o.x + wind * dt, 12, W() - 12);
          var prevY = o.y;
          o.y += o.v * dt;
          if (prevY < BY() && o.y >= BY() && Math.abs(o.x - bx) < BW() / 2) {
            drops.splice(i, 1);
            got += o.gold ? 3 : 1;
            K.burst(o.x, BY(), o.gold ? C.gold : "#7fc8ff", o.gold ? 12 : 6, 120);
            beep(700 + rand(0, 200), o.gold ? 1400 : 1000, .05, "sine", .06);
            if (o.gold) K.pop("+3", o.x, BY() - 20, C.gold);
          } else if (o.y > H() + 20) {
            drops.splice(i, 1);
            lives--;
            K.burst(o.x, H() - 40, "#7fc8ff", 5, 60);
            K.shake = .25;
            if (lives <= 0) { over = true; miniFail(g, "The bucket flooded"); return; }
          }
        }
        hud("Bucket " + Math.min(got, g.goal) + "/" + g.goal + " • " + "❤️".repeat(lives));
        if (got >= g.goal) { done = true; completeMini(); }
      },
      pointer: function (x) { if (done || over) return; down = true; tx = x; },
      stop: function () { d(); },
      draw: function () {
        K.begin();
        st2_bg("#0b1830", "#050b18");
        /* storm clouds and wind readout */
        for (var c = 0; c < 4; c++) circle(60 + c * 110, 110 + (c % 2) * 18, 46 + c * 5, "rgba(120,140,170,.10)");
        text(wind > 8 ? "wind » " + Math.round(wind) : wind < -8 ? "« wind " + Math.round(-wind) : "calm", W() / 2, 104, 15, "rgba(200,220,255,.7)", "center");
        for (var k = 0; k < drops.length; k++) {
          var o = drops[k];
          if (o.gold) { circle(o.x, o.y, 11, "rgba(255,209,92,.25)"); circle(o.x, o.y, 7, C.gold); }
          else { ctx2d.strokeStyle = "rgba(127,200,255,.8)"; ctx2d.lineWidth = 3; ctx2d.beginPath(); ctx2d.moveTo(o.x, o.y); ctx2d.lineTo(o.x - wind * .04, o.y - 12); ctx2d.stroke(); }
        }
        var w = BW(), y = BY(), fill = Math.min(1, got / g.goal);
        ctx2d.beginPath(); ctx2d.moveTo(bx - w / 2, y); ctx2d.lineTo(bx + w / 2, y); ctx2d.lineTo(bx + w * .38, y + 36); ctx2d.lineTo(bx - w * .38, y + 36); ctx2d.closePath();
        ctx2d.fillStyle = "#c8d6ea"; ctx2d.fill();
        if (fill > 0) rect(bx - w * .36, y + 36 - 26 * fill, w * .72, 26 * fill, "rgba(127,200,255,.75)", 6);
        ctx2d.strokeStyle = "#c8d6ea"; ctx2d.lineWidth = 4; ctx2d.beginPath(); ctx2d.arc(bx, y - 10, w * .42, Math.PI, 0); ctx2d.stroke();
        K.end();
      }
    };
  }

  /* Fruit Slice: drag across fruit to cut it, bombs end the run, halves fly apart. */
  function sliceEngine(g) {
    var K = p14_kit(), COL = ["#ff8fb0", "#ffd15c", "#7ef0a0", "#7fc8ff"];
    var objs = [], halves = [], trail = [], down = false, lx = 0, ly = 0, cut = 0, cool = 0, t = 0, done = false, over = false;
    var d = p2_drag({
      move: function (x, y) { if (!down || done || over) return; slash(lx, ly, x, y); trail.push({ x: x, y: y, t: 0 }); lx = x; ly = y; },
      up: function () { down = false; }
    });

    function slash(x0, y0, x1, y1) {
      var hitNow = 0;
      for (var i = 0; i < objs.length; i++) {
        var o = objs[i];
        if (o.dead || st2_segd(o.x, o.y, x0, y0, x1, y1) >= o.r) continue;
        o.dead = true;
        if (o.bomb) {
          over = true; K.shake = .9;
          K.burst(o.x, o.y, "#ff914d", 30, 300);
          beep(160, 60, .4, "sawtooth", .12);
          miniFail(g, "Boom! You sliced a bomb");
          return;
        }
        cut++; hitNow++;
        var ang = Math.atan2(y1 - y0, x1 - x0);
        halves.push({ x: o.x, y: o.y, vx: Math.cos(ang + 1.57) * 90 - 40, vy: -120, va: -3, a: 0, r: o.r, c: o.c, side: 0, life: .9 });
        halves.push({ x: o.x, y: o.y, vx: Math.cos(ang - 1.57) * 90 + 40, vy: -120, va: 3, a: 0, r: o.r, c: o.c, side: 1, life: .9 });
        K.burst(o.x, o.y, o.c, 18, 260);
        beep(500 + rand(0, 300), 900, .08, "triangle", .08);
        if (cut >= g.goal) { done = true; completeMini(); return; }
      }
      if (hitNow >= 2) K.pop("Double!", (x0 + x1) / 2, (y0 + y1) / 2, C.gold);
    }

    return {
      update: function (dt) {
        K.step(dt);
        if (over) return;
        t += dt;
        cool -= dt;
        if (!done && cool <= 0) {
          cool = rand(.5, .9) * (1 - Math.min(.3, t / 150));
          var bomb = Math.random() < Math.min(.2, .06 + t / 200);
          var vy = -Math.sqrt(2 * 900 * H() * .8) * rand(.95, 1.05);
          objs.push({ x: rand(60, W() - 60), y: H() + 30, vx: rand(-140, 140), vy: vy, r: bomb ? 30 : 34, c: bomb ? "#26262e" : COL[randi(0, 3)], bomb: bomb, dead: false });
        }
        for (var i = 0; i < objs.length; i++) { var o = objs[i]; o.vy += 900 * dt; o.x += o.vx * dt; o.y += o.vy * dt; }
        objs = objs.filter(function (o) { return !o.dead && o.y < H() + 60; });
        for (var j = 0; j < halves.length; j++) {
          var h = halves[j];
          h.x += h.vx * dt; h.vy += 900 * dt; h.y += h.vy * dt; h.a += h.va * dt; h.life -= dt;
        }
        halves = halves.filter(function (h) { return h.life > 0; });
        trail.forEach(function (p) { p.t += dt; });
        trail = trail.filter(function (p) { return p.t < .2; });
        hud("Slice " + cut + "/" + g.goal);
      },
      pointer: function (x, y) { if (done || over) return; down = true; lx = x; ly = y; trail.push({ x: x, y: y, t: 0 }); },
      stop: function () { d(); },
      draw: function () {
        K.begin();
        st2_bg("#101a2a", "#070b14");
        for (var i = 0; i < objs.length; i++) {
          var o = objs[i];
          if (o.bomb) {
            circle(o.x, o.y, o.r, o.c);
            circle(o.x - o.r * .3, o.y - o.r * .3, o.r * .22, "rgba(255,255,255,.25)");
            ctx2d.strokeStyle = "#c9b48a"; ctx2d.lineWidth = 3; ctx2d.beginPath(); ctx2d.moveTo(o.x, o.y - o.r); ctx2d.lineTo(o.x + 8, o.y - o.r - 12); ctx2d.stroke();
            var flick = 6 + 4 * Math.abs(Math.sin(t * 25));
            circle(o.x + 8, o.y - o.r - 12, flick, "rgba(255,160,60,.6)");
            circle(o.x + 8, o.y - o.r - 12, flick * .45, "#fff3c4");
          } else {
            circle(o.x, o.y, o.r + 4, "rgba(255,255,255,.08)");
            circle(o.x, o.y, o.r, o.c);
            circle(o.x - o.r * .3, o.y - o.r * .3, o.r * .25, "rgba(255,255,255,.5)");
          }
        }
        for (var k = 0; k < halves.length; k++) {
          var hf = halves[k], fade = Math.max(0, hf.life / .9);
          ctx2d.save(); ctx2d.translate(hf.x, hf.y); ctx2d.rotate(hf.a);
          ctx2d.globalAlpha = fade;
          ctx2d.beginPath(); ctx2d.arc(0, 0, hf.r, hf.side ? 0 : Math.PI, hf.side ? Math.PI : 2 * Math.PI);
          ctx2d.fillStyle = hf.c; ctx2d.fill();
          ctx2d.globalAlpha = 1; ctx2d.restore();
        }
        if (trail.length > 1) {
          ctx2d.lineCap = "round"; ctx2d.lineWidth = 7; ctx2d.strokeStyle = "rgba(255,255,255,.55)";
          ctx2d.beginPath(); ctx2d.moveTo(trail[0].x, trail[0].y);
          for (var m = 0; m < trail.length; m++) ctx2d.lineTo(trail[m].x, trail[m].y);
          ctx2d.stroke(); ctx2d.lineCap = "butt";
        }
        K.end();
      }
    };
  }

  return {
    engines: {
      st_clicky: clickyEngine,
      st2_pour: rainEngine,
      st2_slice: sliceEngine
    },
    minis: [
      { id: "st_clicky", title: "Click Pen", icon: "🖊️", cat: "STRESS", desc: "Tap fast for 20 seconds. Keep the ink up, or the pen dries out. Combos give bonus clicks.", engine: "st_clicky", goal: 40, cfg: {} },
      { id: "st2_pour", title: "Rain Bucket", icon: "🌧️", cat: "STRESS", desc: "Drag the bucket under the rain. Gold drops are worth 3. Miss five and it floods.", engine: "st2_pour", goal: 25, cfg: {} },
      { id: "st2_slice", title: "Fruit Slice", icon: "🍉", cat: "STRESS", desc: "Drag across the fruit to slice it. Never slice a bomb.", engine: "st2_slice", goal: 20, cfg: {} }
    ]
  };
})();
