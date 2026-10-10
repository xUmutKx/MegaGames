window.__AG_fix_16 = (function () {
  /* Warp Tunnel: fly through a 3D tube, grab crystals, dodge rocks. Rhythm Row: time each stroke to the beat. */

  function gameSpace3D(g) {
    const GOAL = g.goal, base = g.speed || 0.38;
    let px = 0, py = 0, lives = 3, score = 0, t = 0, inv = 0, shake = 0, over = false, spawn = 0, travel = 0;
    let objs = [], fx = [];
    const speed = () => base * (1 + Math.min(score, 150) / 300);
    const cx = () => W() / 2, cy = () => H() * 0.42;
    const proj = o => { const k = 1 / o.z; return { x: cx() + (o.x - px) * W() * 0.42 * k, y: cy() + (o.y - py) * H() * 0.42 * k, k }; };
    const shipX = () => W() / 2 + px * W() * 0.25, shipY = () => H() - 170 + py * 30;
    function spawnOne() {
      const crystal = Math.random() < 0.5;
      objs.push({ x: rand(-0.85, 0.85), y: rand(-0.6, 0.6), z: 1, crystal, spin: rand(0, 6.28), sides: randi(5, 7),
        c: crystal ? pick([C.cyan, C.gold, C.pink, C.lime]) : "#4b4f6b", done: false });
    }
    return {
      update(dt) {
        if (over) return;
        dt = Math.min(dt, 0.05);
        t += dt; inv -= dt; shake = Math.max(0, shake - dt * 4);
        px = clamp(px + AX() * dt * 1.2, -0.9, 0.9);
        py = clamp(py + AY() * dt * 1.0, -0.6, 0.6);
        const v = speed();
        travel += dt * v;
        fxUpdate(fx, dt, 0);
        spawn -= dt;
        if (spawn <= 0) { spawn = Math.max(0.2, 0.55 - score / 400) * rand(0.8, 1.2); spawnOne(); }
        for (const o of objs) {
          o.z -= dt * v; o.spin += dt * (o.crystal ? 2.5 : 1);
          if (o.done || o.z > 0.1) continue;
          o.done = true; // each object is checked once, when it passes the ship
          const near = Math.abs(o.x - px) < 0.16 && Math.abs(o.y - py) < 0.16;
          if (near && o.crystal) {
            o.got = true; score += 10; fxBurst(fx, shipX(), shipY(), o.c, 14, 220); beep(900, 1300, 0.07, "triangle", 0.08);
            if (score >= GOAL) { over = true; setTimeout(completeMini, 450); return; }
          } else if (near && !o.crystal && inv <= 0) {
            lives--; inv = 1; shake = 1; fxBurst(fx, shipX(), shipY(), C.red, 18, 260); beep(160, 70, 0.2, "sawtooth", 0.1);
            if (lives <= 0) { over = true; setTimeout(() => miniFail(g, "Smashed into the tunnel walls"), 450); return; }
          }
        }
        objs = objs.filter(o => o.z > 0.03 && !o.got);
        hud(score + " / " + GOAL + "   " + "♥".repeat(Math.max(0, lives)));
      },
      draw() {
        clear("#03040a");
        ctx2d.save();
        ctx2d.translate((Math.random() - 0.5) * shake * 10, (Math.random() - 0.5) * shake * 10);
        // tube rings, drawn as they rush toward the camera
        const rx0 = W() * 0.36, ry0 = H() * 0.25;
        for (let i = 0; i < 12; i++) {
          let z = (i / 12 - travel) % 1; if (z < 0) z += 1;
          if (z < 0.04) continue;
          const k = 1 / z, a = 0.08 + 0.5 * (1 - z);
          ctx2d.strokeStyle = "rgba(85,230,255," + a.toFixed(3) + ")";
          ctx2d.lineWidth = 1 + 4 * (1 - z);
          ctx2d.beginPath(); ctx2d.ellipse(cx(), cy(), rx0 * k, ry0 * k, 0, 0, Math.PI * 2); ctx2d.stroke();
        }
        // objects, far first
        for (const o of objs.slice().sort((a, b) => b.z - a.z)) {
          const p = proj(o), r = clamp(14 * p.k, 3, 70);
          if (o.crystal) {
            ctx2d.save(); ctx2d.shadowColor = o.c; ctx2d.shadowBlur = 14;
            polygon([[p.x, p.y - r], [p.x + r * 0.7, p.y], [p.x, p.y + r], [p.x - r * 0.7, p.y]], o.c);
            ctx2d.restore();
          } else {
            ctx2d.save(); ctx2d.translate(p.x, p.y); ctx2d.rotate(o.spin);
            const pts = [];
            for (let i = 0; i < o.sides; i++) { const a = i / o.sides * Math.PI * 2; pts.push([Math.cos(a) * r, Math.sin(a) * r]); }
            polygon(pts, o.c);
            ctx2d.strokeStyle = "#9aa3c7"; ctx2d.lineWidth = 2; ctx2d.stroke();
            ctx2d.restore();
          }
        }
        // ship
        const sx = shipX(), sy = shipY();
        circle(sx, sy + 16 + Math.sin(t * 40) * 2, 6, C.orange);
        if (!(inv > 0 && Math.floor(t * 20) % 2 === 0)) {
          ctx2d.save(); ctx2d.shadowColor = C.cyan; ctx2d.shadowBlur = 18;
          polygon([[sx, sy - 22], [sx + 22, sy + 14], [sx, sy + 6], [sx - 22, sy + 14]], C.cyan);
          ctx2d.restore();
        }
        fxDraw(fx);
        ctx2d.restore();
      },
      stop() {}
    };
  }

  // Row Pace: the boat sets a beat; tap the side the stroke is due on, inside the ring window.
  function gameRowPace(g) {
    const S = sp_base(g);
    let t = 0, next = 0.9, beat = 0, hit = false, pulse = 0;
    const per = () => Math.max(0.55, 1.05 - S.score * 0.03);
    const tol = () => Math.max(0.14, 0.26 - S.score * 0.01);
    return {
      update(dt) {
        dt = Math.min(dt, 0.05);
        if (S.over) return;
        S.hud();
        t += dt; pulse = Math.max(0, pulse - dt * 3);
        if (t > next + tol()) {
          if (!hit) S.miss();
          hit = false; beat++; next += per(); // advance to the next stroke
        }
      },
      pointer(x) {
        if (S.over || hit) return;
        const side = x < W() / 2 ? 0 : 1;
        if (Math.abs(t - next) > tol()) { S.miss(); return; } // too early for this stroke
        if (side === beat % 2) { hit = true; pulse = 1; S.gain(); }
        else S.miss();
      },
      stop() {},
      draw() {
        sp_bg("#1d6e8f", "#0a2e3e");
        const cx = W() / 2, cy = H() * 0.45, ttb = next - t, R = 30 + 70 * sp_cl(ttb / per(), 0, 1);
        const want = beat % 2, inWin = Math.abs(t - next) <= tol();
        // water lines
        for (let i = 0; i < 9; i++) {
          const y = H() * 0.2 + ((i * 70 + t * 90) % (H() * 0.7));
          line(W() * 0.1 + (i % 3) * 20, y, W() * 0.4, y, "rgba(255,255,255,.08)", 2);
        }
        // side highlight for the stroke that is due
        rect(want ? W() / 2 : 0, H() * 0.6, W() / 2, H() * 0.3, "rgba(85,230,255," + (0.15 + 0.15 * pulse).toFixed(3) + ")", 0);
        // beat ring: shrinks onto the target circle
        strokeCircle(cx, cy, 30, inWin ? "#55ff9a" : "rgba(255,255,255,.6)", 6);
        strokeCircle(cx, cy, R, want ? "#55e6ff" : "#ffd15c", 4);
        // boat with oars that dip on the stroke
        const by = H() * 0.78;
        ctx2d.save(); ctx2d.shadowColor = "#55e6ff"; ctx2d.shadowBlur = 10;
        polygon([[cx - 60, by], [cx + 60, by], [cx + 40, by + 22], [cx - 40, by + 22]], "#d9a866");
        ctx2d.restore();
        const dip = pulse * 0.6;
        line(cx - 50, by + 10, cx - 110, by + 10 - 40 * (want === 0 ? dip : 0), "#fff", 4);
        line(cx + 50, by + 10, cx + 110, by + 10 - 40 * (want === 1 ? dip : 0), "#fff", 4);
        // progress bar
        const f = sp_cl(S.score / g.goal, 0, 1);
        rect(W() * 0.1, H() * 0.9, W() * 0.8, 10, "rgba(0,0,0,.3)", 5);
        rect(W() * 0.1, H() * 0.9, W() * 0.8 * f, 10, "#55e6ff", 5);
        // left / right cues
        text(want ? "RIGHT" : "LEFT", cx, H() * 0.66, 18, "rgba(255,255,255,.7)", "center");
      }
    };
  }

  return {
    engines: { space3d: gameSpace3D, sp_rowing: gameRowPace },
    minis: [
      { id: "space3d", title: "3D Warp Tunnel", icon: "🌌", cat: "3D", desc: "Fly the tube: grab crystals, dodge rocks, three lives.", engine: "space3d", goal: 150, is3D: true },
      { id: "sp_rowing", title: "Row Pace", icon: "🚣", cat: "SPORT", desc: "Stroke on the beat, on the side the boat calls for.", engine: "sp_rowing", goal: 12, cfg: {} }
    ]
  };
})();
