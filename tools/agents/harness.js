// Headless test for agent files:  node tools/agents/harness.js tools/agents/<name>.js
// Runs the file in a vm sandbox that has the page's helpers as stubs; any helper that doesn't exist throws a ReferenceError.
// Optional: tools/agents/<name>.stubs.js is evaluated first (add stubs for extra page helpers you rely on).
const vm = require('vm'), fs = require('fs'), path = require('path');
const file = process.argv[2];
if (!file) { console.error('usage: node harness.js file.js'); process.exit(2); }
const FRAMES = +(process.argv[3] || 6000);

const helpers = `
var calls={fail:0,complete:0,failMsg:'',huds:0,toasts:0};
function mkCtx(){return new Proxy({},{get:function(t,k){if(k in t)return t[k];if(k==='createLinearGradient'||k==='createRadialGradient'||k==='createPattern')return function(){return{addColorStop:function(){}}};if(k==='measureText')return function(s){return{width:String(s).length*7}};if(k==='getImageData')return function(){return{data:new Uint8ClampedArray(4)}};return function(){}},set:function(t,k,v){t[k]=v;return true}})}
var ctx2d=mkCtx();
var cv2d={clientWidth:400,clientHeight:800,width:400,height:800,addEventListener:function(){},removeEventListener:function(){},getContext:function(){return ctx2d},style:{}};
var document={createElement:function(){return{width:0,height:0,style:{},getContext:function(){return mkCtx()},addEventListener:function(){},appendChild:function(){}}},getElementById:function(){return{style:{},textContent:'',classList:{add:function(){},remove:function(){},toggle:function(){}}}}};
var localStorage={_d:{},getItem:function(k){return this._d[k]===undefined?null:this._d[k]},setItem:function(k,v){this._d[k]=String(v)}};
var IN={act:{},keys:new Set(),joyX:0,joyY:0};
var ACT={mini:null,key:'x',engine:null,mod:null};
var progress={coins:0,played:{},renown:0};
function saveProg(){} function refreshStats(){} function rewardRenown(){}
var clamp=function(v,a,b){return Math.max(a,Math.min(b,v))};
var rand=function(a,b){return Math.random()*(b-a)+a};
var randi=function(a,b){return Math.floor(rand(a,b+1))};
var pick=function(a){return a[Math.floor(Math.random()*a.length)]};
var dist=function(a,b,c,d){return Math.hypot(a-c,b-d)};
var C={white:"#fff",cyan:"#55e6ff",pink:"#ff4fd8",purple:"#a978ff",green:"#55ff9a",yellow:"#ffe36e",orange:"#ff914d",red:"#ff5570",blue:"#4da3ff",lime:"#a8ff5c",gold:"#ffd15c"};
function W(){return cv2d.clientWidth} function H(){return cv2d.clientHeight}
function randColor(){return pick([C.cyan,C.pink,C.purple,C.green,C.yellow,C.orange,C.red,C.blue,C.lime])}
function circle(x,y,r,c){ctx2d.fillStyle=c;ctx2d.beginPath();ctx2d.arc(x,y,r,0,Math.PI*2);ctx2d.fill()}
function strokeCircle(x,y,r,c,w){ctx2d.strokeStyle=c;ctx2d.lineWidth=w||2;ctx2d.beginPath();ctx2d.arc(x,y,r,0,Math.PI*2);ctx2d.stroke()}
function rect(x,y,w,h,c,r){ctx2d.fillStyle=c;if(r){ctx2d.beginPath();ctx2d.rect(x,y,w,h);ctx2d.fill()}else ctx2d.fillRect(x,y,w,h)}
function line(x,y,x2,y2,c,w){ctx2d.strokeStyle=c;ctx2d.lineWidth=w||2;ctx2d.beginPath();ctx2d.moveTo(x,y);ctx2d.lineTo(x2,y2);ctx2d.stroke()}
function text(s,x,y,size,c,align,weight){if(s===undefined||s===null||s!==s)throw new Error('text() got '+s);ctx2d.fillStyle=c||"#fff";ctx2d.font=(weight||700)+" "+(size||16)+"px system-ui";ctx2d.textAlign=align||"left";ctx2d.fillText(String(s),x,y)}
function polygon(p,c){ctx2d.fillStyle=c;ctx2d.beginPath();ctx2d.moveTo(p[0][0],p[0][1]);for(var i=1;i<p.length;i++)ctx2d.lineTo(p[i][0],p[i][1]);ctx2d.closePath();ctx2d.fill()}
function clear(bg){ctx2d.fillStyle=bg;ctx2d.fillRect(0,0,W(),H())}
function key(k){return IN.keys.has(k)}
function AX(){var x=IN.joyX;if(key('a')||key('arrowleft'))x-=1;if(key('d')||key('arrowright'))x+=1;return clamp(x,-1,1)}
function AY(){var y=IN.joyY;if(key('w')||key('arrowup'))y-=1;if(key('s')||key('arrowdown'))y+=1;return clamp(y,-1,1)}
function pressed(k){if(IN.act[k]){IN.act[k]=false;return true}return false}
function beep(){} function toast(){calls.toasts++} function hud(s){calls.huds++;if(s===undefined||String(s).indexOf('NaN')>=0||String(s).indexOf('undefined')>=0)throw new Error('hud() got '+s)}
function hudTitle(){}
function miniFail(g,m){calls.fail++;calls.failMsg=m}
function completeMini(){calls.complete++}
function fxBurst(list,x,y,c,n,spd){for(var i=0;i<(n||10);i++){var a=rand(0,6.283),v=rand((spd||120)*.35,spd||120),life=rand(.35,.75);list.push({x:x,y:y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:life,max:life,r:rand(1.5,3.5),c:c||C.cyan})}}
function fxUpdate(list,dt,grav){for(var i=0;i<list.length;i++){var p=list[i];p.x+=p.vx*dt;p.y+=p.vy*dt;if(grav)p.vy+=grav*dt;p.life-=dt}for(var j=list.length-1;j>=0;j--)if(list[j].life<=0)list.splice(j,1)}
function fxDraw(list){for(var i=0;i<list.length;i++){var p=list[i];ctx2d.globalAlpha=clamp(p.life/(p.max||.6),0,1);circle(p.x,p.y,p.r,p.c)}ctx2d.globalAlpha=1}
var ENGINES={};var MINIS=[];var AAA=[];
`;
const sandbox = { console, Math, Date, JSON, Set, Map, Array, Object, Number, String, Boolean, Uint8ClampedArray, Float32Array, Int32Array, Uint8Array, Float64Array, Proxy, parseInt, parseFloat, isNaN, isFinite, Symbol, Promise,
  setTimeout: () => 0, clearTimeout() {}, requestAnimationFrame: () => 0, performance: { now: () => Date.now() }, innerWidth: 400, innerHeight: 800 };
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(helpers, sandbox);
const stubs = file.replace(/\.js$/, '.stubs.js');
if (fs.existsSync(stubs)) vm.runInContext(fs.readFileSync(stubs, 'utf8'), sandbox, { filename: stubs });
vm.runInContext(fs.readFileSync(file, 'utf8'), sandbox, { filename: file });
const regKey = Object.keys(sandbox).find(k => k.startsWith('__AG_'));
if (!regKey) { console.error('FAIL: the file must set window.__AG_<name> = (function(){ ... return {engines,minis,aaa}; })()'); process.exit(1); }
const reg = sandbox[regKey] || {};
let failed = 0;
const rnd = (a, b) => a + Math.random() * (b - a);

function drive(i) {
  if (i % 40 === 0) { sandbox.IN.joyX = rnd(-1, 1); sandbox.IN.joyY = rnd(-1, 1); }
  if (i % 7 === 0) sandbox.IN.act.a = Math.random() < .5;
  if (i % 11 === 0) sandbox.IN.act.b = Math.random() < .3;
  if (i % 13 === 0) sandbox.IN.act.c = Math.random() < .3;
  if (i % 50 === 0) { sandbox.IN.keys.clear(); if (Math.random() < .5) sandbox.IN.keys.add(['arrowleft', 'arrowright', 'arrowup', 'arrowdown', ' '][Math.floor(Math.random() * 5)]); }
}
function exercise(name, obj, isMod) {
  const t0 = Date.now();
  try {
    if (isMod) obj.init();
    const calls = sandbox.calls; calls.fail = 0; calls.complete = 0;
    for (let i = 0; i < FRAMES; i++) {
      drive(i);
      if (i % 90 === 0 && obj.pointer) obj.pointer(rnd(0, 400), rnd(80, 760));
      if (i % 130 === 0 && obj.swipe) obj.swipe(rnd(-120, 120), rnd(-120, 120));
      if (isMod && obj.state && (obj.state === 'over' || obj.state === 'win') && obj.t2 !== undefined) obj.t2 = 9;
      obj.update(1 / 60);
      if (obj.draw) obj.draw();
      if (calls.fail || calls.complete) { if (!isMod) break; calls.fail = 0; calls.complete = 0; }
    }
    if (obj.stop) obj.stop(); if (obj.destroy) obj.destroy();
    console.log('ok  ', name, (Date.now() - t0) + 'ms', 'ended:', calls.complete ? 'win' : calls.fail ? 'fail(' + calls.failMsg + ')' : 'still running');
  } catch (e) { failed++; console.log('FAIL', name, e && e.stack ? e.stack.split('\n').slice(0, 4).join(' | ') : e); }
}
for (const [k, fn] of Object.entries(reg.engines || {})) {
  for (const goal of [1, 30]) {
    let eng;
    try { eng = fn({ id: 'test', title: 'Test', goal, cfg: {}, engine: k }); } catch (e) { failed++; console.log('FAIL', k, 'constructor:', e.stack.split('\n').slice(0, 3).join(' | ')); continue; }
    exercise(k + ' (goal ' + goal + ')', eng, false);
  }
}
for (const a of reg.aaa || []) { if (!a.mod) { failed++; console.log('FAIL aaa', a.id, 'has no mod'); continue; } exercise('AAA ' + a.id, a.mod, true); }
for (const m of reg.minis || []) { for (const f of ['id', 'title', 'icon', 'cat', 'desc', 'engine', 'goal']) if (m[f] === undefined) { failed++; console.log('FAIL mini', m.id, 'missing', f); } }
console.log(failed ? 'FAILED: ' + failed : 'ALL OK', '-', Object.keys(reg.engines || {}).length, 'engines,', (reg.minis || []).length, 'minis,', (reg.aaa || []).length, 'aaa');
process.exit(failed ? 1 : 0);
