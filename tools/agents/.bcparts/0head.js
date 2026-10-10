window.__AG_bigC = (function () {
  /* ---------- shared helpers ---------- */
  function rr(x, y, w, h, r, f, s, lw) { const c = ctx2d; r = Math.min(r, w / 2, h / 2); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); if (f) { c.fillStyle = f; c.fill(); } if (s) { c.strokeStyle = s; c.lineWidth = lw || 2; c.stroke(); } }
  function sfx(a, b, d, t, v) { try { beep(a, b, d, t || 'square', v || .05); } catch (e) { } }
  function wrapText(s, maxW, size) { ctx2d.font = '700 ' + size + 'px system-ui'; const ws = String(s).split(' '), out = []; let cur = ''; for (const w of ws) { const t = cur ? cur + ' ' + w : w; if (ctx2d.measureText(t).width > maxW && cur) { out.push(cur); cur = w; } else cur = t; } if (cur) out.push(cur); return out; }
  function hash2(x, y) { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function sv(k, v) { try { localStorage.setItem('mg_bigC_' + k, JSON.stringify(v)); } catch (e) { } }
  function ld(k) { try { const s = localStorage.getItem('mg_bigC_' + k); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
  function btn(hits, x, y, w, ht, label, col, fn, size, sub) { rr(x, y + 3, w, ht, 12, 'rgba(0,0,0,.35)'); const g = ctx2d.createLinearGradient(0, y, 0, y + ht); g.addColorStop(0, col); g.addColorStop(1, 'rgba(20,24,40,.95)'); rr(x, y, w, ht, 12, g, 'rgba(255,255,255,.35)', 1.5); text(label, x + w / 2, y + ht / 2 + (sub ? -2 : 5), size || 15, '#fff', 'center', 800); if (sub) text(sub, x + w / 2, y + ht / 2 + 14, 11, 'rgba(255,255,255,.8)', 'center', 600); hits.push({ x, y, w, h: ht, f: fn }); }
  function tapHit(list, px, py) { for (let i = list.length - 1; i >= 0; i--) { const r = list[i]; if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) { r.f(px, py); return true; } } return false; }
  function glowDot(x, y, r, c, a) { const g = ctx2d.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, c); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx2d.globalAlpha = a == null ? 1 : a; ctx2d.fillStyle = g; ctx2d.fillRect(x - r, y - r, r * 2, r * 2); ctx2d.globalAlpha = 1; }

