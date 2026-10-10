// Test-only copies of page helpers used by the Row Pace engine (same behaviour as mega.html).
function sp_R(a, b) { return a + Math.random() * (b - a); }
function sp_cl(v, a, b) { return Math.max(a, Math.min(b, v)); }
function sp_bg(a, b) { const gr = ctx2d.createLinearGradient(0, 0, 0, H()); gr.addColorStop(0, a); gr.addColorStop(1, b); ctx2d.fillStyle = gr; ctx2d.fillRect(0, 0, W(), H()); }
function sp_base(g) {
  const c = g.cfg || {}, S = { score: 0, lives: c.lives || 3, over: false };
  S.hud = () => hud(S.score + " / " + g.goal + "   " + "♥".repeat(Math.max(0, S.lives)));
  S.gain = n => { if (S.over) return; S.score += n || 1; beep(700, 980, .06, "triangle", .07); if (S.score >= g.goal) { S.over = true; setTimeout(completeMini, 350); } };
  S.miss = () => { if (S.over) return; S.lives--; beep(260, 140, .12, "sawtooth", .06); if (S.lives <= 0) { S.over = true; setTimeout(() => miniFail(g, "Out of tries"), 350); } };
  return S;
}
