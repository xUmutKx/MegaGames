// Headless check for the Gravity Flip module: loads new_gravity.js with stub globals and plays a few seconds.
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, 'new_gravity.js'), 'utf8');
const store = {};
global.localStorage = { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = String(v) } };
global.W = () => 400;
global.H = () => 800;
global.rand = (a, b) => a + Math.random() * (b - a);
global.hudTitle = () => {};
global.beep = () => {};
global.text = () => {};
global.ctx2d = new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => ({ addColorStop() {} })), set: (t, k, v) => { t[k] = v; return true } });
const Gravity = new Function(src + '\nreturn Gravity;')();

Gravity.init();
Gravity.draw();
Gravity.pointer(); // ready -> play
if (Gravity.state !== 'play') throw new Error('did not start');
let flips = 0;
for (let i = 0; i < 60 * 40 && Gravity.state !== 'dead'; i++) {
  Gravity.update(1 / 60);
  Gravity.draw();
  if (i % 45 === 0) { Gravity.pointer(); flips++ } // flip now and then
}
console.log('state', Gravity.state, 'score', Gravity.score, 'coins', Gravity.coins, 'flips', flips, 'best', Gravity.hi);
if (Gravity.state === 'dead') {
  Gravity.dead = 1;
  Gravity.pointer();
  if (Gravity.state !== 'play') throw new Error('retry failed');
}
// Idle player must sit on a surface, never off screen.
Gravity.p.side = -1;
for (let i = 0; i < 120; i++) Gravity.update(1 / 60);
const L = Gravity.lanes();
if (Math.abs(Gravity.p.y - Gravity.surf(L, -1)) > 1) throw new Error('player not on ceiling');
console.log('ok');
