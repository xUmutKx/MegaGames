// arcadeA: richer rewrites of snake, breakout, pong, flappy, dodge, runner, platformer, pac, pinball, tron
window.__AG_arcadeA = (function () {
  const TAU = Math.PI * 2;
  const sgn = (v) => (v > 0 ? 1 : v < 0 ? -1 : 0);
  const lerp = (a, b, t) => a + (b - a) * t;
  function sv(k, v) { try { if (v === undefined) return +(localStorage.getItem('mg_arcadeA_' + k) || 0); localStorage.setItem('mg_arcadeA_' + k, String(v)); } catch (e) { } return 0; }
  function pop(list, x, y, s, c, sz) { list.push({ x, y, s: String(s), c: c || '#fff', sz: sz || 16, life: 1 }); }
  function popUpdate(list, dt) { for (const p of list) { p.y -= 38 * dt; p.life -= dt * 1.1; } for (let i = list.length - 1; i >= 0; i--) if (list[i].life <= 0) list.splice(i, 1); }
  function popDraw(list) { for (const p of list) { ctx2d.globalAlpha = clamp(p.life * 1.4, 0, 1); text(p.s, p.x, p.y, p.sz, p.c, 'center', 900); } ctx2d.globalAlpha = 1; }
  function glow(x, y, r, col, a) {
    const gr = ctx2d.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)');
    ctx2d.globalAlpha = a == null ? 1 : a; ctx2d.globalCompositeOperation = 'lighter'; ctx2d.fillStyle = gr;
    ctx2d.beginPath(); ctx2d.arc(x, y, r, 0, TAU); ctx2d.fill(); ctx2d.globalCompositeOperation = 'source-over'; ctx2d.globalAlpha = 1;
  }
  function vgrad(y0, y1, c0, c1) { const gr = ctx2d.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, c0); gr.addColorStop(1, c1); ctx2d.fillStyle = gr; ctx2d.fillRect(0, y0, W(), y1 - y0); }
  function rr(x, y, w, h, r, fill) { ctx2d.fillStyle = fill; ctx2d.beginPath(); if (ctx2d.roundRect) ctx2d.roundRect(x, y, w, h, r); else ctx2d.rect(x, y, w, h); ctx2d.fill(); }
  function hint(s) { text(s, W() / 2, H() - 124, 11, 'rgba(255,227,110,.85)', 'center', 700); }
  function bar(x, y, w, h, f, col) { rr(x, y, w, h, h / 2, 'rgba(255,255,255,.12)'); if (f > 0) rr(x, y, Math.max(h, w * clamp(f, 0, 1)), h, h / 2, col); }
  function shk(s) { if (s > 0.2) ctx2d.translate(rand(-s, s), rand(-s, s)); }
  function stars(n, seed, t, spd, a) { for (let i = 0; i < n; i++) { const x = (i * 97 + seed * 31) % W(), y = 70 + ((i * 61 + seed * 17 + t * spd * (0.4 + (i % 3) * 0.3)) % (H() - 190)); circle(x, y, 0.8 + (i % 3) * 0.5, 'rgba(255,255,255,' + (a || 0.3) + ')'); } }
  function inputDir(ax, ay) { if (Math.abs(ax) < .5 && Math.abs(ay) < .5) return null; return Math.abs(ax) > Math.abs(ay) ? { x: sgn(ax), y: 0 } : { x: 0, y: sgn(ay) }; }
