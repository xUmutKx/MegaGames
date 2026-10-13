// Headless check for the 20 relaxing games in tools/games20/.
// Each module runs 40 s of simulated frames with random taps at two screen sizes,
// then reset/destroy/init are exercised. Fails on any exception or NaN state.
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'games20');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js')).sort();

let SW = 400, SH = 800;
global.W = () => SW;
global.H = () => SH;
global.rand = (a, b) => a + Math.random() * (b - a);
global.hudTitle = () => {};
global.beep = () => {};
global.text = () => {};
global.cv2d = { getBoundingClientRect: () => ({ left: 0, top: 0 }) };
global.ctx2d = new Proxy({}, {
  get: (t, k) => (k in t ? t[k] : () => ({ addColorStop() {} })),
  set: (t, k, v) => { t[k] = v; return true },
});

let fails = 0;
let count = 0;
for (const f of files) {
  const src = fs.readFileSync(path.join(dir, f), 'utf8');
  const m = src.match(/const\s+(\w+)\s*=\s*\{/);
  if (!m) { fails++; console.log('FAIL', f, 'no module object'); continue; }
  const name = m[1];
  let M;
  try {
    M = new Function(src + '\nreturn ' + name + ';')();
  } catch (e) { fails++; console.log('FAIL', f, 'load', e.message); continue }
  for (const [w, h] of [[400, 800], [320, 560]]) {
    SW = w; SH = h;
    try {
      M.init();
      M.draw();
      let taps = 0;
      for (let i = 0; i < 40 * 60; i++) {
        if (Math.random() < 0.03) { M.pointer(rand(0, w), rand(0, h)); taps++ }
        M.update(1 / 60);
        M.draw();
      }
      if (/NaN|Infinity/.test(JSON.stringify(M))) throw new Error('NaN/Infinity in state');
      M.reset();
      M.update(1 / 60);
      M.draw();
      M.pointer(w / 2, h / 2);
      M.update(1 / 60);
      M.draw();
      M.destroy();
      if (M.a !== false) throw new Error('destroy did not clear a');
      M.init();
      M.draw();
      count++;
      if (w === 400) console.log('ok  ', f.padEnd(18), name.padEnd(14), 'taps', taps);
    } catch (e) {
      fails++;
      console.log('FAIL', f, w + 'x' + h, (e.stack || e.message).split('\n').slice(0, 3).join(' | '));
      break;
    }
  }
}
console.log(fails ? 'FAILED ' + fails + ' module(s)' : 'all ' + files.length + ' modules ok');
if (fails) process.exit(1);
