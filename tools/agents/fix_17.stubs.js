// Harness-only stubs for page helpers fix_17.js uses (the real ones live in mega.html).
var p2_drag = function (h) {
  return function () {};
};
var p14_kit = function () {
  var K = { fx: [], pops: [], shake: 0, t: 0 };
  K.step = function (dt) { K.t += dt; fxUpdate(K.fx, dt, 200); K.shake = Math.max(0, K.shake - dt * 4); for (var i = 0; i < K.pops.length; i++) { K.pops[i].y -= 40 * dt; K.pops[i].life -= dt; } K.pops = K.pops.filter(function (p) { return p.life > 0; }); };
  K.pop = function (s, x, y, c) { K.pops.push({ s: s, x: x, y: y, c: c || "#fff", life: .8 }); };
  K.burst = function (x, y, c, n, sp) { fxBurst(K.fx, x, y, c, n || 10, sp || 160); };
  K.begin = function () { ctx2d.save(); };
  K.end = function () { fxDraw(K.fx); for (var i = 0; i < K.pops.length; i++) text(K.pops[i].s, K.pops[i].x, K.pops[i].y, 18, K.pops[i].c, "center"); ctx2d.restore(); };
  return K;
};
var st_bg = function () {};
var st2_bg = function () {};
var st2_segd = function (px, py, ax, ay, bx, by) {
  var dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy;
  var t = L ? clamp(((px - ax) * dx + (py - ay) * dy) / L, 0, 1) : 0;
  return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
};
