window.__AG_fix_14 = (function () {
  /* Ferry Dock, reworked: two brake controls, a shrinking slot, speed meter, wake and a moving sea. */
  function fxU(L, dt) {
    for (const p of L) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 240 * dt; p.life -= dt; }
    for (let i = L.length - 1; i >= 0; i--) if (L[i].life <= 0) L.splice(i, 1);
  }
  function fxD(L) {
    for (const p of L) { ctx2d.globalAlpha = Math.max(0, p.life / p.max); circle(p.x, p.y, p.r, p.c); }
    ctx2d.globalAlpha = 1;
  }
  function sky(a, b, h) {
    const gr = ctx2d.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, a); gr.addColorStop(1, b);
    ctx2d.fillStyle = gr; ctx2d.fillRect(0, 0, W(), h);
  }

  const DK = 0.6; // water drag: speed decays by this fraction per second

  function gameSimDock(g) {
    const WL = () => H() * 0.62, PPM = () => W() * 0.03, XC = () => W() * 0.25;
    let bx = 0, v = 0, slot = 0, tol = 0.35, lives = 3, docks = 0, rt = 0, fl = 0, flC = C.green;
    let done = false, fx = [], t = 0, bob = 0, wakeT = 0, msg = "", msgC = C.white, msgT = 0;

    function newRound() {
      v = Math.min(10, rand(6, 9) + docks * 0.2);
      bx = 0;
      slot = (v / DK) * rand(0.55, 0.85);
      tol = Math.max(0.22, 0.35 - docks * 0.012); // the slot narrows as you dock more
      rt = 0;
    }
    newRound();

    function crash(m) {
      lives--; fl = 0.6; flC = C.red; rt = 1.2; msg = m; msgC = C.red; msgT = 1.2;
      beep(200, 90, 0.35, "sawtooth", 0.12);
      if (lives <= 0) { done = true; miniFail(g, m); }
    }

    return {
      update(dt) {
        dt = Math.min(dt, 0.05);
        if (done) return;
        t += dt;
        if (fl > 0) fl -= dt;
        if (msgT > 0) msgT -= dt;
        if (rt > 0) { rt -= dt; if (rt <= 0 && !done) newRound(); }
        else {
          const hold = AY() > 0.5 ? 3.0 : 0; // holding down brakes harder
          v = Math.max(0, v - DK * v * dt - hold * dt);
          bx += v * dt;
          if (v > 0.5) {
            wakeT -= dt;
            if (wakeT <= 0) { wakeT = 0.05; fxBurst(fx, XC() - 30, WL() + 2, "#d6f4ff", 2, 50); }
          }
          if (bx > slot + tol) crash("Bumped the pier");
          else if (v < 0.15) {
            if (Math.abs(slot - bx) <= tol) {
              docks++; fl = 0.6; flC = C.green; rt = 1.2;
              const perfect = Math.abs(slot - bx) < 0.08;
              msg = perfect ? "PERFECT" : "DOCKED"; msgC = perfect ? C.gold : C.green; msgT = 1.2;
              beep(523, 784, 0.3, "triangle", 0.12);
              fxBurst(fx, XC() + 14, WL() - 20, perfect ? C.gold : C.green, perfect ? 36 : 24, 200);
              if (docks >= g.goal) { done = true; completeMini(); return; }
            } else crash("Stopped short");
          }
        }
        fxU(fx, dt);
        hud("Docks " + docks + " / " + g.goal + "   " + "♥".repeat(Math.max(0, lives)));
      },
      pointer() {
        if (done || rt > 0) return;
        v = Math.max(0, v - 2.4);
        fxBurst(fx, XC() + 14, WL() - 6, C.cyan, 8, 120);
        beep(420, 300, 0.05, "square", 0.05);
      },
      draw() {
        const wl = WL(), xc = XC(), ppm = PPM();
        bob = Math.sin(t * 2.2) * 1.5;
        sky("#0a1028", "#25204a", wl);
        circle(W() * 0.78, wl * 0.28, 22, "rgba(255,240,200,.92)");
        circle(W() * 0.78, wl * 0.28, 60, "rgba(255,240,200,.07)");
        const sg = ctx2d.createLinearGradient(0, wl, 0, H());
        sg.addColorStop(0, "#0c2a4a"); sg.addColorStop(1, "#06142a");
        ctx2d.fillStyle = sg; ctx2d.fillRect(0, wl, W(), H() - wl);
        // parallax wave rows, scrolling with the boat's motion
        for (let row = 0; row < 4; row++) {
          const y0 = wl + 10 + row * (H() - wl) / 4.5, off = -bx * ppm * (0.3 + row * 0.25);
          ctx2d.strokeStyle = "rgba(85,230,255," + (0.09 + row * 0.04).toFixed(2) + ")";
          ctx2d.lineWidth = 2; ctx2d.beginPath();
          ctx2d.moveTo(-10, y0);
          for (let x = -10; x <= W() + 10; x += 12) ctx2d.lineTo(x, y0 + Math.sin((x + off) * 0.05 + row) * (2 + row));
          ctx2d.stroke();
        }
        // pier: slot zone, posts, deck, lights
        const dx = xc + 14 + (slot - bx) * ppm;
        ctx2d.fillStyle = "rgba(85,255,154,.12)";
        ctx2d.fillRect(dx - tol * ppm, wl - 60, Math.max(8, tol * ppm * 2), 100);
        for (let x = dx + 24; x < W(); x += 44) rect(x, wl, 6, 34, "#3f2a1a");
        rect(dx, wl - 14, W() - dx + 40, 14, "#7a5535");
        for (let x = dx; x < W(); x += 16) line(x, wl - 14, x, wl, "rgba(0,0,0,.25)", 1);
        rect(dx, wl - 44, 4, 44, C.green);
        // ferry: bobbing hull, cabin with windows, funnel and flag
        ctx2d.save(); ctx2d.translate(0, bob);
        const hg = ctx2d.createLinearGradient(0, wl - 14, 0, wl + 4);
        hg.addColorStop(0, "#f2f4ff"); hg.addColorStop(1, "#8d96b8");
        polygon([[xc - 30, wl - 12], [xc + 24, wl - 12], [xc + 14, wl + 2], [xc - 22, wl + 2]], hg);
        rect(xc - 16, wl - 26, 26, 14, C.pink, 3);
        for (let k = 0; k < 3; k++) rect(xc - 12 + k * 8, wl - 23, 5, 5, "#fff6c8");
        rect(xc - 2, wl - 36, 8, 10, "#2b2446");
        line(xc + 6, wl - 36, xc + 6, wl - 50, "#fff", 2);
        polygon([[xc + 6, wl - 50], [xc + 18, wl - 46], [xc + 6, wl - 42]], C.orange);
        ctx2d.restore();
        // speed meter
        ctx2d.fillStyle = "rgba(255,255,255,.12)"; ctx2d.fillRect(W() * 0.1, 96, W() * 0.8, 8);
        ctx2d.fillStyle = v > 6 ? C.orange : C.cyan; ctx2d.fillRect(W() * 0.1, 96, W() * 0.8 * clamp(v / 10, 0, 1), 8);
        if (msgT > 0) text(msg, W() / 2, 150, 28, msgC, "center", 800);
        if (fl > 0) { ctx2d.globalAlpha = fl * 0.35; rect(0, 0, W(), H(), flC); ctx2d.globalAlpha = 1; }
        fxD(fx);
      },
      stop() {}
    };
  }

  return {
    engines: { sim_dock: gameSimDock },
    minis: [
      { id: "sim_dock", title: "Ferry Dock", icon: "⛴️", cat: "SIMULATION",
        desc: "Tap to brake, hold down to brake hard. Stop the bow inside the slot.",
        engine: "sim_dock", goal: 4 }
    ]
  };
})();
