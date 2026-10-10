window.__AG_fix_13 = (function () {
  /* Shut the Box: pick open tiles whose sum equals the dice total. No legal move = lose. */
  function shutEngine(g) {
    var closed = [false, false, false, false, false, false, false, false, false];
    var sel = [false, false, false, false, false, false, false, false, false];
    var dice = [1, 1], cur = 0, cd = 0, shake = 0, endT = 0, endKind = "", fx = [], total = 2;

    function sumOf(mask) { var s = 0; for (var i = 0; i < 9; i++) if (mask & (1 << i)) s += i + 1; return s; }
    function openMask() { var m = 0; for (var i = 0; i < 9; i++) if (!closed[i]) m |= 1 << i; return m; }
    function openCount() { var n = 0; for (var i = 0; i < 9; i++) if (!closed[i]) n++; return n; }
    /* shortcut: brute-forces the 512 subsets of 9 tiles, cheap enough per roll */
    function canMake(t) {
      var om = openMask();
      for (var s = om; s > 0; s = (s - 1) & om) if (sumOf(s) === t) return true;
      return false;
    }
    function roll() {
      dice = [randi(1, 6), randi(1, 6)];
      total = dice[0] + dice[1];
      sel = sel.map(function () { return false; });
      if (!canMake(total)) { endKind = "lose"; endT = 1.4; toast("No way to shut " + total); }
    }
    function confirm() {
      var s = 0, n = 0;
      for (var i = 0; i < 9; i++) if (sel[i]) { s += i + 1; n++; }
      if (!n) return;
      if (s !== total) { shake = 10; beep(200, 90, .12, "sawtooth", .12); return; }
      for (var j = 0; j < 9; j++) if (sel[j]) {
        closed[j] = true;
        fxBurst(fx, tileX(j), tileY() + tileH() / 2, C.gold, 10, 140);
      }
      beep(520, 880, .1, "triangle", .15);
      if (openCount() === 0) { endKind = "win"; endT = 1.0; beep(600, 1200, .3, "triangle", .2); return; }
      roll();
    }
    function lay() { return Math.min(42, (W() - 30) / 9); }
    function tileX(i) { var s = lay(); return (W() - s * 9) / 2 + i * s + s / 2; }
    function tileY() { return H() * 0.42; }
    function tileH() { return lay() * 1.2; }
    function hitTile(px, py) {
      var s = lay(), x0 = (W() - s * 9) / 2, ty = tileY(), th = tileH();
      if (py < ty || py > ty + th) return -1;
      var i = Math.floor((px - x0) / s);
      return i >= 0 && i < 9 ? i : -1;
    }
    function toggle(i) {
      if (i < 0 || closed[i] || endKind) return;
      sel[i] = !sel[i];
      cur = i;
      beep(sel[i] ? 420 : 300, sel[i] ? 520 : 240, .05, "square", .08);
    }
    function moveCursor(dir) {
      var i = cur;
      for (var k = 0; k < 9; k++) {
        i += dir;
        if (i < 0 || i > 8) return;
        if (!closed[i]) { cur = i; return; }
      }
    }
    roll();

    return {
      update: function (dt) {
        shake = Math.max(0, shake - dt * 40);
        fxUpdate(fx, dt, 200);
        if (endKind) {
          endT -= dt;
          if (endT <= 0) {
            if (endKind === "win") completeMini();
            else miniFail(g, "No tiles add up to " + total + ". " + openCount() + " still open.");
            endKind = "done";
          }
          hud("Shut the Box • Open " + openCount());
          return;
        }
        cd -= dt;
        if (cd <= 0) {
          var dx = Math.sign(Math.round(AX()));
          if (dx) { moveCursor(dx); cd = .16; }
        }
        if (pressed("a")) toggle(cur);
        if (pressed("b")) { sel = sel.map(function () { return false; }); }
        if (pressed("c")) confirm();
        hud("Shut the Box • Open " + openCount() + " • Dice " + total);
      },
      pointer: function (px, py) { toggle(hitTile(px, py)); },
      draw: function () {
        var gr = ctx2d.createLinearGradient(0, 0, 0, H());
        gr.addColorStop(0, "#14301c"); gr.addColorStop(1, "#06140b");
        clear(gr);
        var sx = shake ? Math.sin(performance.now() / 22) * shake : 0;
        ctx2d.save();
        ctx2d.translate(sx, 0);
        /* dice */
        for (var d = 0; d < 2; d++) {
          var dx0 = W() / 2 + (d ? 40 : -40) - 26, dy0 = H() * 0.22;
          rect(dx0, dy0, 52, 52, "#f5f0e0", 10);
          var pips = [[], [4], [0, 8], [0, 4, 8], [0, 2, 6, 8], [0, 2, 4, 6, 8], [0, 2, 3, 5, 6, 8]][dice[d]];
          for (var p = 0; p < pips.length; p++) {
            circle(dx0 + 10 + (pips[p] % 3) * 16, dy0 + 10 + Math.floor(pips[p] / 3) * 16, 4, "#111");
          }
        }
        text(String(total), W() / 2, H() * 0.22 + 84, 22, "#fff", "center", 900);
        /* tiles */
        var s = lay();
        for (var i = 0; i < 9; i++) {
          var x = tileX(i) - s / 2 + 3, y = tileY(), w = s - 6, h = tileH();
          if (closed[i]) {
            rect(x, y + h * .35, w, h * .3, "rgba(0,0,0,.4)", 4);
            continue;
          }
          var col = sel[i] ? C.gold : "#e9efe3";
          rect(x, y, w, h, col, 8);
          text(String(i + 1), x + w / 2, y + h * .66, Math.round(s * .5), sel[i] ? "#222" : "#1a2a1a", "center", 900);
          if (cur === i && !endKind) strokeCircle(x + w / 2, y + h / 2, Math.max(w, h) * .62, C.cyan, 2);
        }
        var sumSel = 0;
        for (var j = 0; j < 9; j++) if (sel[j]) sumSel += j + 1;
        text("Selected " + sumSel + " / " + total, W() / 2, tileY() + tileH() + 34, 16, C.yellow, "center", 800);
        text("A toggle • C shut", W() / 2, H() - 150, 12, "#9bb89b", "center");
        ctx2d.restore();
        fxDraw(fx);
        if (endKind === "win") text("ALL SHUT!", W() / 2, H() * 0.7, 30, C.gold, "center", 900);
        if (endKind === "lose") text("NO MOVES", W() / 2, H() * 0.7, 30, C.red, "center", 900);
      },
      stop: function () {}
    };
  }

  /* Falling sand: sand, water and stone. Drag to paint, A cycles material, B clears. */
  function sandEngine(g) {
    var CW = 44, CH = 60, cell = Math.min(W() / CW, (H() - 220) / CH), OY = 90;
    var NAMES = ["", "Sand", "Water", "Stone"];
    var grid = [], stamp = [], mat = 1, placed = 0, fr = 0, down = false;
    for (var y0 = 0; y0 < CH; y0++) {
      grid.push(new Array(CW).fill(0));
      stamp.push(new Array(CW).fill(-1));
    }

    function ok(x, y) { return x >= 0 && x < CW && y >= 0 && y < CH; }
    function move(x, y, nx, ny) {
      if (!ok(nx, ny)) return false;
      var m = grid[y][x], t = grid[ny][nx];
      /* sand sinks through water, water never displaces anything */
      if (t !== 0 && !(m === 1 && t === 2)) return false;
      grid[ny][nx] = m; stamp[ny][nx] = fr;
      grid[y][x] = t; stamp[y][x] = fr;
      return true;
    }
    function step() {
      fr++;
      var lr = Math.random() < .5;
      for (var y = CH - 2; y >= 0; y--) {
        for (var k = 0; k < CW; k++) {
          var x = lr ? k : CW - 1 - k;
          var m = grid[y][x];
          if (!m || m === 3 || stamp[y][x] === fr) continue;
          var d = Math.random() < .5 ? -1 : 1;
          if (move(x, y, x, y + 1)) continue;
          if (move(x, y, x + d, y + 1) || move(x, y, x - d, y + 1)) continue;
          if (m === 2 && (move(x, y, x + d, y) || move(x, y, x - d, y))) continue;
        }
      }
    }
    function paintAt(px, py) {
      var cx = Math.floor(px / cell), cy = Math.floor((py - OY) / cell);
      for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
        var x = cx + dx, y = cy + dy;
        if (ok(x, y) && !grid[y][x]) { grid[y][x] = mat; placed++; }
      }
    }
    function onDown(e) { down = true; paintAt(e.offsetX, e.offsetY); }
    function onMove(e) { if (down && e.buttons) paintAt(e.offsetX, e.offsetY); }
    function onUp() { down = false; }
    cv2d.addEventListener("pointerdown", onDown);
    cv2d.addEventListener("pointermove", onMove);
    cv2d.addEventListener("pointerup", onUp);
    cv2d.addEventListener("pointercancel", onUp);

    return {
      update: function () {
        if (pressed("a")) mat = mat % 3 + 1;
        if (pressed("b")) { for (var y = 0; y < CH; y++) grid[y].fill(0); }
        if (AX() || AY()) { /* joystick paints under the cursor in the middle of the basin */
          paintAt(W() / 2 + AX() * 60, OY + CH * cell / 2 + AY() * 60);
        }
        step();
        if (placed >= g.goal) completeMini();
        hud("Particles " + placed + "/" + g.goal + " • " + NAMES[mat] + " (A)");
      },
      pointer: function (px, py) { paintAt(px, py); },
      draw: function () {
        clear("#0b0b10");
        var col = ["", "#e8c06a", "#4da3ff", "#8a94a6"];
        for (var y = 0; y < CH; y++) for (var x = 0; x < CW; x++) {
          var v = grid[y][x];
          if (v) rect(x * cell, OY + y * cell, cell - 1, cell - 1, col[v], 2);
        }
        strokeCircle(W() / 2, OY + CH * cell / 2, 4, "rgba(255,255,255,.15)", 1);
      },
      stop: function () {
        cv2d.removeEventListener("pointerdown", onDown);
        cv2d.removeEventListener("pointermove", onMove);
        cv2d.removeEventListener("pointerup", onUp);
        cv2d.removeEventListener("pointercancel", onUp);
      }
    };
  }

  return {
    engines: { shutbox: shutEngine, sandbox: sandEngine },
    minis: [
      { id: "shutbox", title: "Shut the Box", icon: "🎲", cat: "PUZZLE", desc: "Shut tiles that add up to the dice. No legal move ends the run.", engine: "shutbox", goal: 1 },
      { id: "sandbox", title: "Sandbox", icon: "⏳", cat: "PUZZLE", desc: "Paint sand and water, stone blocks them. Drag to pour.", engine: "sandbox", goal: 300 }
    ]
  };
})();
