// Headless check of every MINIS entry in the real mega.html: node tools/test_minis.js [frames]
const vm = require('vm'), fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '../app/src/main/assets/mega.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const FRAMES = +(process.argv[2] || 600);
const el = () => new Proxy(function () {}, {
  construct: () => el(),
  get: (t, k) => k in t ? t[k] : k === 'getContext' ? () => ctx : k === 'classList' ? { add() {}, remove() {}, toggle() {}, contains() { return false } }
    : k === 'style' ? new Proxy({}, { get: (t, q) => q in t ? t[q] : () => {}, set: () => true }) : k === 'dataset' ? {} : k === 'getBoundingClientRect' ? () => ({ left: 0, top: 0, right: 400, bottom: 800, width: 400, height: 800 }) : k === 'clientWidth' ? 400 : k === 'clientHeight' ? 800 : k === 'width' || k === 'height' ? 400 : k === 'value' || k === 'textContent' || k === 'innerHTML' ? '' : el(),
  set: (t, k, v) => { t[k] = v; return true }, apply: () => el()
});
const ctx = new Proxy({}, { get: (t, k) => k in t ? t[k] : (k === 'measureText' ? () => ({ width: 10 }) : k === 'getImageData' || k === 'createImageData' ? (...a) => ({ width: a[0] || 1, height: a[1] || 1, data: new Uint8ClampedArray(4 * (a[0] || 1) * (a[1] || 1)) }) : /^create/.test(k) ? () => ({ addColorStop() {} }) : () => {}), set: (t, k, v) => { t[k] = v; return true } });
const sandbox = {
  console: { log() {}, warn() {}, error(...a) { if (process.env.V) console.log('[err]', ...a) } },
  document: { createElement: el, getElementById: el, querySelector: el, querySelectorAll: () => [], addEventListener() {}, body: el(), documentElement: el(), head: el() },
  window: null, localStorage: { _d: {}, getItem(k) { return this._d[k] ?? null }, setItem(k, v) { this._d[k] = String(v) }, removeItem() {} },
  performance: { now: () => Date.now() }, AndroidBridge: { vibrate() {} }, requestAnimationFrame() {}, setTimeout() {}, clearTimeout() {}, setInterval() {}, clearInterval() {},
  addEventListener() {}, removeEventListener() {}, innerWidth: 400, innerHeight: 800, devicePixelRatio: 1, AudioContext: function () { return el() }, webkitAudioContext: function () { return el() },
};
sandbox.window = sandbox; sandbox.self = sandbox; sandbox.THREE = el(); sandbox.document.createDocumentFragment = el;
vm.createContext(sandbox);
const bad = [];
for (const s of scripts) { try { vm.runInContext(s, sandbox, { timeout: 20000 }) } catch (e) { bad.push('load: ' + e.message + ' ' + (e.stack||'').split('\n').slice(0,2).join(' | ')) } }
if (bad.length) { console.log(bad.join('\n')); process.exit(1) }
const vmRun = (code) => vm.runInContext(code, sandbox);
const ok = [], fail = [];
const check = vmRun(`(function(){
  const out=[];
  for (const g of MINIS) {
    const f = ENGINES[g.engine];
    if (!f) { out.push({id:g.id, err:'no engine '+g.engine}); continue }
    out.push({id:g.id, engine:g.engine, cat:g.cat, icon:g.icon, goal:g.goal, title:g.title, desc:g.desc});
  }
  return out;
})()`);
console.log('minis', check.length);
for (const g of check) {
  if (g.err) { fail.push(g.id + ': ' + g.err); continue }
  const r = vmRun(`(function(){
    const g = MINIS.find(x=>x.id===${JSON.stringify(g_id(g))});
    try {
      const e = (ENGINES[g.engine])(g);
      if (!e || typeof e.update !== 'function' || typeof e.draw !== 'function') return 'bad engine shape';
      for (let i=0;i<${FRAMES};i++){
        if (i%40===0 && typeof e.pointer==='function') e.pointer(40+(i*37)%320, 200+(i*53)%500);
        if (i%55===0 && typeof e.swipe==='function') e.swipe(60,-20);
        IN.joyX=Math.sin(i/30); IN.joyY=Math.cos(i/25); IN.act={a:i%7===0,b:i%11===0,c:i%13===0};
        if (i%29===0) IN.keys=new Set(['arrowleft']);
        e.update(1/60); e.draw();
        if (i%97===0) Object.keys(IN.act).forEach(k=>{IN.act[k]=false});
      }
      try{ e.stop && e.stop() }catch(_){}
      return 'ok';
    } catch (err) { return 'throw: ' + (err && err.message) + ' ' + String(err && err.stack).split(String.fromCharCode(10)).slice(1,3).join(' | ') }
  })()`);
  (r === 'ok' ? ok : fail).push(g.id + (r === 'ok' ? '' : ': ' + r));
}
function g_id(g) { return g.id }
console.log('ok', ok.length, 'fail', fail.length);
if (fail.length) console.log(fail.join('\n'));
process.exitCode = fail.length ? 1 : 0;
