// Example agent file: engines are functions (g) => ({update(dt), draw(), pointer?(x,y), swipe?(dx,dy), stop?()})
window.__AG_sample = (function () {
  function gameSample(g) {
    let x = W() / 2, score = 0, parts = [];
    return {
      update(dt) {
        x = clamp(x + AX() * 300 * dt, 20, W() - 20);
        if (pressed('a')) { score++; fxBurst(parts, x, H() / 2, C.cyan, 8, 120); }
        fxUpdate(parts, dt, 20);
        hud('Score ' + score + '/' + g.goal);
        if (score >= g.goal) completeMini();
      },
      draw() { clear('#05070b'); circle(x, H() / 2, 14, C.cyan); fxDraw(parts); text('Sample', W() / 2, 100, 14, '#fff', 'center'); },
      stop() {}
    };
  }
  return { engines: { sample: gameSample }, minis: [{ id: 'sample', title: 'Sample', icon: '🎮', cat: 'ARCADE', desc: 'Example.', engine: 'sample', goal: 5 }], aaa: [] };
})();
