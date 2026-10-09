// Runs the new AAA modules headless with stubbed canvas/helpers to catch runtime errors.
const fs = require('fs');
const src = fs.readFileSync(__dirname + '/new_aaa.js', 'utf8');
const mkCtx = () => new Proxy({}, {
  get: (t, k) => k in t ? t[k] : (k === 'createLinearGradient' || k === 'createRadialGradient' ? () => ({ addColorStop() {} }) : () => {}),
  set: (t, k, v) => { t[k] = v; return true }
});
const ctx2d = mkCtx();
const cv2d = { clientWidth: 400, clientHeight: 800, addEventListener() {}, removeEventListener() {} };
global.document = { createElement: () => ({ width: 0, height: 0, getContext: () => mkCtx() }) };
global.localStorage = { getItem: () => null, setItem() {} };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => Math.random() * (b - a) + a;
const randi = (a, b) => Math.floor(rand(a, b + 1));
const IN = { act: {}, keys: new Set(), joyX: 0, joyY: 0 };
const helpers = `
const W=()=>cv2d.clientWidth,H=()=>cv2d.clientHeight;
const pick=a=>a[Math.floor(Math.random()*a.length)];
const dist=(a,b,c,d)=>Math.hypot(a-c,b-d);
const progress={coins:0};function saveProg(){}
function hudTitle(){} function toast(){} function beep(){}
function circle(x,y,r,c){ctx2d.fillStyle=c;ctx2d.beginPath();ctx2d.arc(x,y,r,0,Math.PI*2);ctx2d.fill()}
function strokeCircle(x,y,r,c,w){ctx2d.strokeStyle=c;ctx2d.lineWidth=w||2;ctx2d.beginPath();ctx2d.arc(x,y,r,0,Math.PI*2);ctx2d.stroke()}
function rect(x,y,w,h,c,r){ctx2d.fillStyle=c;if(r){ctx2d.beginPath();ctx2d.rect(x,y,w,h);ctx2d.fill()}else ctx2d.fillRect(x,y,w,h)}
function line(x,y,x2,y2,c,w){ctx2d.strokeStyle=c;ctx2d.beginPath();ctx2d.moveTo(x,y);ctx2d.lineTo(x2,y2);ctx2d.stroke()}
function text(s,x,y,size,c,align,weight){if(typeof s==="undefined")throw new Error("text undefined");ctx2d.fillStyle=c||"#fff";ctx2d.font=(weight||700)+" "+(size||16)+"px system-ui";ctx2d.fillText(s,x,y)}
function key(k){return IN.keys.has(k)}
function AX(){return IN.joyX}
function AY(){return IN.joyY}
function pressed(k){if(IN.act[k]){IN.act[k]=false;return true}return false}
`;
const run = new Function('cv2d', 'ctx2d', 'IN', 'clamp', 'rand', 'randi', helpers + src + '\nreturn {Horde,Bastion};');
const { Horde, Bastion } = run(cv2d, ctx2d, IN, clamp, rand, randi);

function exercise(mod, name, frames, tapFn) {
  mod.init();
  for (let i = 0; i < frames; i++) {
    IN.joyX = Math.sin(i / 90); IN.joyY = Math.cos(i / 70);
    if (i % 25 === 0) tapFn(mod, i);
    mod.update(1 / 60); mod.draw();
  }
  mod.destroy();
  console.log(name, 'ok');
}

exercise(Horde, 'Horde', 20000, (m, i) => {
  if (m.cards) { const r = m.cardRects()[i % 3]; m.pointer(r.x + 5, r.y + 5); return }
  if (i % 400 === 0) { m.xp += m.need; }
  if (i % 100 === 0) m.pointer(200, 400);
  if (m.state === 'over') { m.t2 = 5; m.pointer(10, 10); }
  m.p.hp = Math.max(m.p.hp, i % 3000 === 0 ? 1 : m.p.hp);
});
console.log('horde level', Horde.lv, 'kills', Horde.kills, 'state', Horde.state);

exercise(Bastion, 'Bastion', 30000, (m, i) => {
  const L = m.lay();
  if (m.state === 'over' || m.state === 'win') { m.t2 = 5; m.pointer(10, 10); return }
  m.gold += 8;
  const c = i / 25 % 7 | 0, r = (i / 175 | 0) % 10;
  m.sel = ['archer', 'cannon', 'frost', 'tesla'][(i / 25 | 0) % 4];
  m.pointer(L.ox + (c + .5) * L.cs, L.oy + (r + .5) * L.cs);
  if (i % 200 === 0 && m.state === 'build') m.pointer(200, 800 - 100 + 80);
  if (i % 300 === 0) m.pointer(L.ox + (c + .5) * L.cs, L.oy + (r + .5) * L.cs);
  if (i % 450 === 0 && m.pick) m.pointer(50, 720);
});
console.log('bastion wave', Bastion.wave, 'lives', Bastion.lives, 'towers', Bastion.towers.length, 'state', Bastion.state);
