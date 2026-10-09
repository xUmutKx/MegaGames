window.__AG_bigA = (function () {
  /* ---------- shared helpers ---------- */
  function hs(i, j, k) { var h = Math.imul(i | 0, 374761393) ^ Math.imul(j | 0, 668265263) ^ Math.imul((k | 0) + 7, 1274126177); h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; }
  function wrapA(a) { while (a > Math.PI) a -= 6.283185307; while (a < -Math.PI) a += 6.283185307; return a; }
  var GLOW = {};
  function glow(c) { var g = GLOW[c]; if (g) return g; g = document.createElement("canvas"); g.width = g.height = 64; var x = g.getContext("2d"); var r = x.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, c); r.addColorStop(.35, c); r.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = r; x.fillRect(0, 0, 64, 64); return GLOW[c] = g; }
  function lg(x, y, r, c, a) { ctx2d.globalAlpha = a; ctx2d.drawImage(glow(c), x - r, y - r, r * 2, r * 2); ctx2d.globalAlpha = 1; }
  var SFXT = { shot: [700, 200, .08, "square", .04], smg: [600, 250, .05, "square", .03], shg: [220, 60, .2, "sawtooth", .09], boom: [110, 30, .7, "sawtooth", .16], hit: [150, 70, .12, "square", .06], coin: [800, 1400, .08, "sine", .05], horn: [330, 320, .25, "square", .04], buy: [500, 900, .12, "triangle", .08], hurt: [200, 70, .2, "sawtooth", .08], good: [500, 1000, .25, "triangle", .1], bad: [300, 90, .4, "sawtooth", .1], tick: [900, 900, .03, "square", .02], door: [160, 90, .25, "triangle", .08], step: [90, 60, .03, "square", .01], siren: [700, 900, .18, "sine", .03], pick: [600, 1100, .1, "sine", .06], build: [260, 420, .1, "square", .05], zap: [1200, 300, .1, "sawtooth", .05], roar: [90, 40, .6, "sawtooth", .12] };
  function sfx(k) { try { var T = SFXT[k]; if (T) beep(T[0], T[1], T[2], T[3], T[4]); } catch (e) { } }
  function hiLoad(k) { try { return +localStorage.getItem("mg_bigA_" + k) || 0; } catch (e) { return 0; } }
  function hiSave(k, v) { try { localStorage.setItem("mg_bigA_" + k, String(v)); } catch (e) { } }
  function rr(x, y, w, h, r, fill, stroke, lw) { var c = ctx2d; c.beginPath(); if (c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw || 1; c.stroke(); } }
  function inRect(px, py, r) { return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h; }
  function hsl(h, s, l, a) { return "hsla(" + Math.round(h) + "," + s + "%," + l + "%," + (a === undefined ? 1 : a) + ")"; }
  function mmss(t) { t = Math.max(0, Math.floor(t)); return Math.floor(t / 60) + ":" + String(t % 60).padStart(2, "0"); }
  function sparks(list, x, y, c, n, spd, max) { for (var k = 0; k < n && list.length < (max || 400); k++) { var a = rand(0, 6.283), v = rand(spd * .3, spd); list.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rand(.25, .6), max: .6, r: rand(1.5, 3.5), c: c }); } }
  function sparkStep(list, dt) { for (var i = list.length - 1; i >= 0; i--) { var f = list[i]; f.x += f.vx * dt; f.y += f.vy * dt; f.vx *= 1 - 2 * dt; f.vy *= 1 - 2 * dt; f.life -= dt; if (f.life <= 0) list.splice(i, 1); } }
  function sparkDraw(list) { ctx2d.save(); ctx2d.globalCompositeOperation = "lighter"; for (var i = 0; i < list.length; i++) { var f = list[i]; ctx2d.globalAlpha = clamp(f.life / f.max, 0, 1); circle(f.x, f.y, f.r, f.c); } ctx2d.restore(); ctx2d.globalAlpha = 1; }
  function overlayEnd(self, title, col, lines, hint) {
    var w = W(), h = H(), a = clamp(self.t2 * 1.5, 0, .78); ctx2d.fillStyle = "rgba(3,4,12," + a + ")"; ctx2d.fillRect(0, 0, w, h);
    if (self.t2 > .4) { text(title, w / 2, h * .32, 34, col, "center", 900); for (var i = 0; i < lines.length; i++) text(lines[i][0], w / 2, h * .32 + 40 + i * 28, lines[i][1] || 16, lines[i][2] || "#fff", "center", 800); if (self.t2 > .8) text(hint || "TAP TO TRY AGAIN", w / 2, h * .32 + 60 + lines.length * 28, 16, "#55e6ff", "center", 900); }
  }

  /* ============ AAA 1: NEON STREETS ============ */
  var DR = [[1, 0], [0, 1], [-1, 0], [0, -1]];
  var NS = {
    a: false, P: 380, RW: 100, SW: 12, goal: 5000,
    CT: {
      sedan: { hp: 100, acc: 300, max: 290, m: 1, len: 34, wid: 17, cols: ["#d94a6b", "#4a8fd9", "#46c28f", "#e0c24a", "#9a6ad9", "#e07a3a", "#c8ccd8"] },
      sport: { hp: 85, acc: 430, max: 390, m: .9, len: 34, wid: 16, cols: ["#ff3d6e", "#ffd23d", "#3dffd0", "#ff7a1a"] },
      truck: { hp: 200, acc: 210, max: 220, m: 2.2, len: 46, wid: 21, cols: ["#8a6a4a", "#6a7a8a", "#a05a3a"] },
      taxi: { hp: 100, acc: 300, max: 280, m: 1, len: 34, wid: 17, cols: ["#ffcf2e"] },
      cop: { hp: 110, acc: 390, max: 350, m: 1.1, len: 36, wid: 18, cols: ["#e8ecf4"] },
      swat: { hp: 280, acc: 320, max: 300, m: 2.4, len: 48, wid: 23, cols: ["#2a2f3a"] }
    },
    WP: [{ n: "Fists", cd: .38, dmg: 14 }, { n: "Pistol", cd: .26, dmg: 18, sp: .03, nn: 1, ic: "🔫" }, { n: "SMG", cd: .09, dmg: 9, sp: .1, nn: 1, ic: "🔫" }, { n: "Shotgun", cd: .7, dmg: 9, sp: .3, nn: 6, ic: "💥" }],
    init() { this.a = true; this.bc = new Map(); this.best = hiLoad("ns_best"); this._bind(); this.reset(); hudTitle("NEON STREETS", "Make it big"); },
    _bind() { if (this._lis) return; var me = this; this._lis = { up: function () { } }; },
    reset() {
      this.t = 0; this.t2 = 0; this.state = "play"; this.money = 150; this.won = false; this.newBest = false;
      this.p = { x: 60, y: -150, hp: 100, face: -1.57, car: null, inv: 0, wk: 0, fcd: 0, wi: 1, own: [1, 1, 0, 0], ammo: [0, 60, 0, 0], bust: 0, flash: 0 };
      this.cars = []; this.peds = []; this.cops = []; this.bul = []; this.fx = []; this.sm = []; this.skid = []; this.pk = []; this.decal = []; this.msgs = []; this.offers = []; this.ms = null; this.ring = [];
      this.heat = 0; this.evade = 0; this.copT = 0; this.rbT = 12; this.footT = 3; this.cam = { x: this.p.x, y: this.p.y }; this.shake = 0; this.flash = 0; this.stat = { kills: 0, miss: 0, wrecks: 0 };
      this.mkCar("sedan", 0, -90, 0, 0, null);
      this.cars[0].col = "#ff2fa8"; this.cars[0].ai = null;
      for (var i = 0; i < 12; i++) this.spawnTraffic(true);
      for (i = 0; i < 18; i++) this.spawnPed(true);
      this.msg("Welcome to Neon Streets. Grab a car with B!", "#55e6ff", 5);
    },
    msg(s, c, t) { this.msgs.push({ s: s, c: c || "#fff", t: t || 3 }); if (this.msgs.length > 4) this.msgs.shift(); },
    /* ---- world ---- */
    poi(i, j) { var h = hs(i, j, 9); if (i === 0 && j === 0) return null; return h < .08 ? "garage" : h < .15 ? "shop" : null; },
    blk(i, j) {
      var k = i + "," + j, b = this.bc.get(k); if (b) return b; if (this.bc.size > 400) this.bc.clear();
      var P = this.P, x0 = i * P + 62, y0 = j * P + 62, S = P - 124, r = hs(i, j, 1), hue = Math.floor(hs(i, j, 2) * 360);
      b = { type: r < .17 ? "park" : r < .45 ? "one" : r < .78 ? "two" : "four", rects: [], trees: [], hue: hue };
      var mk = function (x, y, w, h, s) { b.rects.push({ x: x, y: y, w: w, h: h, ht: 30 + hs(i, j, s) * 110, hue: (hue + hs(i, j, s + 20) * 90) % 360, nz: hs(i, j, s + 40) }); };
      if (b.type === "park") { for (var q = 0; q < 8; q++) b.trees.push({ x: x0 + 14 + hs(i, j, 50 + q) * (S - 28), y: y0 + 14 + hs(i, j, 60 + q) * (S - 28), r: 8 + hs(i, j, 70 + q) * 7 }); }
      else if (b.type === "one") mk(x0 + 8, y0 + 8, S - 16, S - 16, 3);
      else if (b.type === "two") { var s1 = .35 + hs(i, j, 4) * .3; if (hs(i, j, 5) < .5) { mk(x0 + 8, y0 + 8, (S - 16) * s1 - 6, S - 16, 6); mk(x0 + 8 + (S - 16) * s1 + 6, y0 + 8, (S - 16) * (1 - s1) - 6, S - 16, 7); } else { mk(x0 + 8, y0 + 8, S - 16, (S - 16) * s1 - 6, 6); mk(x0 + 8, y0 + 8 + (S - 16) * s1 + 6, S - 16, (S - 16) * (1 - s1) - 6, 7); } }
      else { var hw = (S - 16 - 14) / 2; for (var a = 0; a < 2; a++) for (var c = 0; c < 2; c++) mk(x0 + 8 + a * (hw + 14), y0 + 8 + c * (hw + 14), hw, hw, 8 + a * 2 + c); }
      this.bc.set(k, b); return b;
    },
    solidAt(x, y) { var b = this.blk(Math.floor(x / this.P), Math.floor(y / this.P)); for (var k = 0; k < b.rects.length; k++) if (inRect(x, y, b.rects[k])) return true; return false; },
    los(x1, y1, x2, y2) { var d = Math.hypot(x2 - x1, y2 - y1), n = Math.ceil(d / 28); for (var k = 1; k < n; k++) { var f = k / n; if (this.solidAt(x1 + (x2 - x1) * f, y1 + (y2 - y1) * f)) return false; } return true; },
    wallHit(x, y, r) {
      var b = this.blk(Math.floor(x / this.P), Math.floor(y / this.P));
      for (var k = 0; k < b.rects.length; k++) {
        var q = b.rects[k], cx = clamp(x, q.x, q.x + q.w), cy = clamp(y, q.y, q.y + q.h), dx = x - cx, dy = y - cy, d2 = dx * dx + dy * dy;
        if (d2 < r * r) {
          if (d2 < 1e-6) { var l = x - q.x, rt = q.x + q.w - x, tp = y - q.y, bt = q.y + q.h - y, m = Math.min(l, rt, tp, bt); if (m === l) return { nx: -1, ny: 0, pen: r + l }; if (m === rt) return { nx: 1, ny: 0, pen: r + rt }; if (m === tp) return { nx: 0, ny: -1, pen: r + tp }; return { nx: 0, ny: 1, pen: r + bt }; }
          var d = Math.sqrt(d2); return { nx: dx / d, ny: dy / d, pen: r - d };
        }
      }
      return null;
    },
    nextSW(c, s) { var P = this.P, o = this.RW / 2 + this.SW * .5, k0 = Math.floor(c / P), best = null; for (var k = k0 - 1; k <= k0 + 2; k++) for (var q = -1; q <= 1; q += 2) { var v = k * P + q * o; if (s > 0 ? v > c + 1 : v < c - 1) { if (best === null || (s > 0 ? v < best : v > best)) best = v; } } return best; },
    laneP(ix, iy, d) { var dx = DR[d][0], dy = DR[d][1], o = this.RW / 4; return { x: ix * this.P - dy * o, y: iy * this.P + dx * o }; },
    /* ---- spawning ---- */
    mkCar(ty, x, y, a, v, ai) {
      var T = this.CT[ty], c = { ty: ty, x: x, y: y, a: a, vx: Math.cos(a) * v, vy: Math.sin(a) * v, hp: T.hp, max: T.hp, m: T.m, col: pick(T.cols), ai: ai, dir: 0, nd: null, tx: 0, ty2: 0, hbT: 0, stuck: 0, revT: 0, sm: 0, dead: false, wreck: false, wt: 0, ph: rand(0, 6), hitT: 0, vt: 130 + rand(0, 40), steer: 0 };
      this.cars.push(c); return c;
    },
    placeOnRoad(c, ix, iy, d, along) { var T = this.laneP(ix, iy, d); c.x = T.x + DR[d][0] * along; c.y = T.y + DR[d][1] * along; c.a = Math.atan2(DR[d][1], DR[d][0]); c.dir = d; c.nd = { ix: ix + DR[d][0], iy: iy + DR[d][1] }; },
    spawnTraffic(init) {
      var p = this.p, P = this.P;
      for (var tr = 0; tr < 8; tr++) {
        var ix = Math.round(p.x / P) + randi(-3, 3), iy = Math.round(p.y / P) + randi(-3, 3), d = randi(0, 3), al = rand(60, 260), L = this.laneP(ix, iy, d), x = L.x + DR[d][0] * al, y = L.y + DR[d][1] * al;
        var dd = Math.hypot(x - p.x, y - p.y); if (dd < (init ? 130 : 520) || dd > 1000) continue;
        var bad = false; for (var q = 0; q < this.cars.length; q++) if (Math.hypot(this.cars[q].x - x, this.cars[q].y - y) < 50) { bad = true; break; } if (bad) continue;
        var r = Math.random(), ty = r < .1 ? "truck" : r < .2 ? "taxi" : r < .3 ? "sport" : "sedan", c = this.mkCar(ty, x, y, 0, 70, "traffic"); this.placeOnRoad(c, ix, iy, d, al); c.vx = DR[d][0] * 70; c.vy = DR[d][1] * 70; return c;
      }
      return null;
    },
    spawnCop(ty) {
      var p = this.p, P = this.P;
      for (var tr = 0; tr < 10; tr++) {
        var ix = Math.round(p.x / P) + randi(-3, 3), iy = Math.round(p.y / P) + randi(-3, 3), d = randi(0, 3), al = rand(60, 260), L = this.laneP(ix, iy, d), x = L.x + DR[d][0] * al, y = L.y + DR[d][1] * al;
        var dd = Math.hypot(x - p.x, y - p.y); if (dd < 430 || dd > 900) continue;
        var c = this.mkCar(ty || "cop", x, y, 0, 60, "chase"); this.placeOnRoad(c, ix, iy, d, al); c.cop = true; c.vt = 330; return c;
      }
      return null;
    },
    spawnPed(init) {
      var p = this.p, P = this.P, o = this.RW / 2 + this.SW * .5;
      for (var tr = 0; tr < 6; tr++) {
        var ax = Math.random() < .5, k = Math.round((ax ? p.y : p.x) / P) + randi(-3, 3), fixed = k * P + (Math.random() < .5 ? -o : o), mv = (ax ? p.x : p.y) + rand(-700, 700);
        var x = ax ? mv : fixed, y = ax ? fixed : mv, dd = Math.hypot(x - p.x, y - p.y); if (dd < (init ? 60 : 420) || dd > 800) continue;
        var d = ax ? (Math.random() < .5 ? 0 : 2) : (Math.random() < .5 ? 1 : 3), s = DR[d][0] + DR[d][1], pd = { x: x, y: y, d: d, nxt: this.nextSW(ax ? x : y, s), hp: 20, spd: rand(26, 44), pan: 0, col: hsl(rand(0, 360), 55, 55), hc: hsl(rand(20, 40), 45, rand(30, 80)), wk: rand(0, 6) };
        this.peds.push(pd); return pd;
      }
      return null;
    },
    scare(x, y, r) { for (var i = 0; i < this.peds.length; i++) { var q = this.peds[i]; if (Math.hypot(q.x - x, q.y - y) < r) { q.pan = 4; var ax = q.d % 2 === 0, away = ax ? (q.x >= x ? 0 : 2) : (q.y >= y ? 1 : 3); if (away !== q.d) { q.d = away; q.nxt = this.nextSW(ax ? q.x : q.y, DR[away][0] + DR[away][1]); } } } },
    addHeat(n) { this.heat = Math.min(900, this.heat + n); this.evade = 0; },
    stars() { var h = this.heat; return h >= 650 ? 5 : h >= 400 ? 4 : h >= 220 ? 3 : h >= 100 ? 2 : h >= 30 ? 1 : 0; },
    /* ---- physics ---- */
    carStep(c, thr, st, hb, dt) {
      var T = this.CT[c.ty], fx = Math.cos(c.a), fy = Math.sin(c.a), vf = c.vx * fx + c.vy * fy, vl = -c.vx * fy + c.vy * fx, sp = Math.hypot(c.vx, c.vy);
      if (c.wreck) { thr = 0; hb = true; }
      if (thr > 0) vf += T.acc * thr * dt * (1 - clamp(vf / T.max, 0, 1)); else if (thr < 0) { if (vf > 8) vf = Math.max(0, vf - 620 * dt); else vf = Math.max(-T.max * .4, vf + thr * T.acc * .6 * dt); }
      vf *= Math.exp(-(hb ? 1.6 : thr === 0 ? .9 : .35) * dt);
      var grip = hb ? 1.1 : 7.5 - clamp(sp - 200, 0, 160) / 160 * 2.5; vl *= Math.exp(-grip * dt);
      c.vx = fx * vf - fy * vl; c.vy = fy * vf + fx * vl;
      var rate = (2.7 * clamp(vf / 80, -1, 1) * (1 - .3 * sp / T.max) + (hb ? st * 1.2 : 0)) * st * (hb ? 1 : 1) * (hb ? .55 : 1);
      c.steer += (st - c.steer) * Math.min(1, dt * 12);
      var turn = st * (hb ? Math.max(1.6, 2.6 * clamp(Math.abs(vf) / 80, 0, 1)) : 2.7 * clamp(Math.abs(vf) / 80, 0, 1) * (1 - .3 * sp / T.max)) * (vf < -5 ? -1 : 1);
      c.a += turn * dt;
      c.x += c.vx * dt; c.y += c.vy * dt;
      if (Math.abs(vl) > 65 && sp > 70) { c.sk = (c.sk || 0) + dt; if (c.sk > .03) { c.sk = 0; var rx = Math.cos(c.a), ry = Math.sin(c.a); if (this.skid.length < 360) this.skid.push({ x: c.x - rx * 11 - ry * 6, y: c.y - ry * 11 + rx * 6, x2: c.x - rx * 11 + ry * 6, y2: c.y - ry * 11 - rx * 6, l: 5 }); if (this.sm.length < 160 && Math.random() < .5) this.sm.push({ x: c.x - rx * 12, y: c.y - ry * 12, vx: rand(-10, 10), vy: rand(-10, 10), life: .6, max: .6, r: 5, c: "200,200,210" }); } }
    },
    hurtCar(c, d, src) {
      if (c.dead || c.wreck || d <= 0) return; c.hp -= d; c.hitT = .12;
      if (c.hp <= 0) this.explode(c, src);
    },
    explode(c, src) {
      if (c.dead) return; var p = this.p; c.hp = 0; c.wreck = true; c.wt = 28; c.ai = null; c.dead = false; c.exploded = true;
      sparks(this.fx, c.x, c.y, "#ffb347", 36, 340); sparks(this.fx, c.x, c.y, "#fff3b0", 18, 220); this.ring.push({ x: c.x, y: c.y, r: 10, life: .5, max: .5 });
      var dd = Math.hypot(c.x - p.x, c.y - p.y); this.shake = Math.max(this.shake, clamp(26 - dd / 25, 4, 22)); this.flash = Math.max(this.flash, dd < 300 ? .35 : 0); sfx("boom"); this.stat.wrecks++;
      this.scare(c.x, c.y, 360);
      for (var i = 0; i < this.cars.length; i++) { var o = this.cars[i]; if (o === c || o.wreck) continue; var d = Math.hypot(o.x - c.x, o.y - c.y); if (d < 100) { o.vx += (o.x - c.x) / (d || 1) * 160; o.vy += (o.y - c.y) / (d || 1) * 160; this.hurtCar(o, 60 * (1 - d / 100), "boom"); if (o.cop) this.addHeat(6); } }
      for (i = this.peds.length - 1; i >= 0; i--) if (Math.hypot(this.peds[i].x - c.x, this.peds[i].y - c.y) < 90) this.killPed(this.peds[i], i, true);
      for (i = this.cops.length - 1; i >= 0; i--) if (Math.hypot(this.cops[i].x - c.x, this.cops[i].y - c.y) < 90) { this.cops[i].hp -= 60; if (this.cops[i].hp <= 0) this.killCop(i); }
      if (p.car === c) { p.car = null; p.x = c.x; p.y = c.y; this.hurtP(45, "boom"); this.addHeat(30); this.msg("Your car blew up!", "#ff9a55", 2.5); }
      else if (!p.car && Math.hypot(p.x - c.x, p.y - c.y) < 80) this.hurtP(40 * (1 - Math.hypot(p.x - c.x, p.y - c.y) / 100), "boom");
      if (src === "player" || (p.car && Math.hypot(p.x - c.x, p.y - c.y) < 150)) this.addHeat(c.cop ? 90 : 26);
      if (this.ms && this.ms.type === "take" && this.ms.car === c) this.missionDone();
    },
    killPed(q, i, boom) {
      var k = i === undefined ? this.peds.indexOf(q) : i; if (k < 0) return; this.peds.splice(k, 1); this.decal.push({ x: q.x, y: q.y, l: 25 }); if (this.decal.length > 60) this.decal.shift();
      sparks(this.fx, q.x, q.y, "#d02a4a", 8, 120); this.stat.kills++; sfx("hit");
      if (Math.random() < .75) this.pk.push({ x: q.x, y: q.y, k: "cash", v: randi(8, 45), t: 40 });
      if (this.ms && this.ms.type === "hit" && this.ms.ped === q) { this.addHeat(40); this.missionDone(); }
    },
    killCop(i) {
      var q = this.cops[i]; this.cops.splice(i, 1); sparks(this.fx, q.x, q.y, "#d02a4a", 8, 120); this.decal.push({ x: q.x, y: q.y, l: 25 }); this.addHeat(60); this.stat.kills++; sfx("hit");
      this.pk.push({ x: q.x, y: q.y, k: "cash", v: randi(30, 90), t: 40 }); if (Math.random() < .4) this.pk.push({ x: q.x + 8, y: q.y, k: "ammo", v: 20, t: 40 });
    },
    hurtP(d, src) {
      var p = this.p; if (p.inv > 0 || this.state !== "play") return; p.hp -= d; p.inv = .25; p.flash = .3; this.shake = Math.max(this.shake, 5); sfx("hurt"); sparks(this.fx, p.x, p.y, "#ff4f6a", 6, 150);
      if (p.hp <= 0) this.die("WASTED");
    },
    die(kind) {
      if (this.state !== "play") return; this.state = "dead"; this.dkind = kind; this.dt2 = 0; this.t2 = 0; var loss = Math.min(this.money, Math.max(60, Math.floor(this.money * .1))); this.dloss = loss; this.money -= loss;
      if (this.ms) this.missionFail(kind === "BUSTED" ? "Busted!" : "You died."); sfx("bad");
    },
    respawn() {
      var p = this.p, P = this.P, ix = Math.round(p.x / P), iy = Math.round(p.y / P); if (p.car) { p.car = null; }
      p.x = ix * P + 56; p.y = iy * P + 80; p.hp = 100; p.inv = 2; p.bust = 0; this.heat = 0; this.cops.length = 0; this.state = "play";
      for (var i = 0; i < this.cars.length; i++) { var c = this.cars[i]; if (c.cop && !c.wreck) { c.ai = "traffic"; c.cop = false; c.vt = 140; } }
      this.msg("Back on the street. Lost $" + this.dloss + ".", "#aab", 3);
    },
    /* ---- missions ---- */
    makeOffers() {
      var p = this.p, P = this.P; this.offers = this.offers.filter(function (o) { return Math.hypot(o.x - p.x, o.y - p.y) < 1700; });
      var tr = 0; while (this.offers.length < 3 && tr++ < 30) {
        var ix = Math.round(p.x / P) + randi(-4, 4), iy = Math.round(p.y / P) + randi(-4, 4), x = ix * P, y = iy * P, d = Math.hypot(x - p.x, y - p.y); if (d < 280 || d > 1500) continue; var ok = true; for (var k = 0; k < this.offers.length; k++) if (this.offers[k].ix === ix && this.offers[k].iy === iy) ok = false; if (!ok) continue;
        this.offers.push({ x: x, y: y, ix: ix, iy: iy, type: pick(["deliv", "take", "race", "hit", "deliv"]), ph: rand(0, 6) });
      }
    },
    MI: { deliv: { n: "Package Run", ic: "📦", c: "#55e6ff" }, take: { n: "Takedown", ic: "💥", c: "#ff7a55" }, race: { n: "Street Race", ic: "🏁", c: "#6bff9a" }, hit: { n: "Contract", ic: "🎯", c: "#c88bff" } },
    startMission(o) {
      var p = this.p, P = this.P, ty = o.type;
      if (ty === "race" && !p.car) { if (this.msgT === undefined || this.t - this.msgT > 3) { this.msg("Get in a car to start the race!", "#ffd15c", 2.5); this.msgT = this.t; } return; }
      var m = null;
      if (ty === "deliv") { var dx = pick([-1, 1]) * randi(2, 5), dy = randi(-4, 4), tx = (o.ix + dx) * P, ty2 = (o.iy + dy) * P, d = Math.hypot(tx - o.x, ty2 - o.y); m = { type: ty, tx: tx, ty: ty2, t: d / 85 + 22, rew: Math.round(120 + d * .32), hp0: p.car ? p.car.hp : 0, txt: "Deliver the package" }; }
      else if (ty === "take") { var ix = o.ix + pick([-3, -2, 2, 3]), iy = o.iy + randi(-2, 2), c = this.mkCar("sport", ix * P + 25, iy * P + 25, 0, 0, "flee"); c.hp = c.max = 170; c.col = "#ff8a1a"; c.mt = true; c.vt = 300; this.placeOnRoad(c, ix, iy, randi(0, 3), 20); m = { type: ty, car: c, t: 80, rew: 450, txt: "Destroy the orange car" }; }
      else if (ty === "hit") { var q = null; for (var i = 0; i < 6 && !q; i++) q = this.spawnPed(true); if (!q) return; var ax = q.d % 2 === 0; q.hp = 30; q.mt = true; q.x = o.x + (ax ? 160 : 56); q.y = o.y + (ax ? 56 : 160); q.nxt = this.nextSW(ax ? q.x : q.y, DR[q.d][0] + DR[q.d][1]); m = { type: ty, ped: q, t: 90, rew: 350, txt: "Find and eliminate the target" }; }
      else if (ty === "race") {
        var cps = [], cx = o.ix, cy = o.iy, dd = randi(0, 3); for (var s = 0; s < 7; s++) { var n = randi(1, 2); if (Math.random() < .35) dd = (dd + pick([1, 3])) % 4; cx += DR[dd][0] * n; cy += DR[dd][1] * n; cps.push({ x: cx * P, y: cy * P, ix: cx, iy: cy }); }
        var rv = []; for (var r = 0; r < 2; r++) { var rc = this.mkCar("sport", o.x, o.y, 0, 0, "race"); this.placeOnRoad(rc, o.ix, o.iy, (dd + 2) % 4 === 0 ? 0 : dd, -50 - r * 50); rc.col = r ? "#7a6aff" : "#ffd23d"; rc.vt = 255 + r * 20; rc.cop = false; rc.nd = { ix: o.ix, iy: o.iy }; rc.dir = dd; rc.rv = true; rv.push({ c: rc, i: 0, fin: false }); }
        m = { type: ty, cps: cps, i: 0, rv: rv, t: 110, rew: 600, place: 1, txt: "Race through the checkpoints", fin: 0 };
      }
      if (!m) return; m.title = this.MI[ty].n; m.t0 = m.t; this.ms = m; this.offers = this.offers.filter(function (z) { return z !== o; }); sfx("good"); this.msg(m.title + ": " + m.txt, this.MI[ty].c, 3.5);
    },
    mTarget() { var m = this.ms; if (!m) return null; if (m.type === "deliv") return { x: m.tx, y: m.ty }; if (m.type === "take") return { x: m.car.x, y: m.car.y }; if (m.type === "hit") return { x: m.ped.x, y: m.ped.y }; return m.cps[Math.min(m.i, m.cps.length - 1)]; },
    missionDone() {
      var m = this.ms; if (!m) return; var rew = m.rew; if (m.type === "race") { rew = m.place === 1 ? 700 : m.place === 2 ? 350 : 200; } if (m.type === "deliv" && this.p.car && this.p.car.hp > m.hp0 * .75) rew += 60;
      this.money += rew; this.stat.miss++; this.msg(m.title + " complete!  +$" + rew, "#6bff9a", 3.5); sfx("good"); this.shake = 4; this.flash = .15; sparks(this.fx, this.p.x, this.p.y, "#ffd15c", 30, 260);
      this.cleanupMission(m); this.ms = null; this.makeOffers(); try { progress.coins += Math.floor(rew / 100); saveProg(); } catch (e) { }
    },
    missionFail(why) { var m = this.ms; if (!m) return; this.msg(m.title + " failed: " + why, "#ff6a6a", 3); sfx("bad"); this.cleanupMission(m); this.ms = null; },
    cleanupMission(m) { if (m.type === "take" && m.car) { m.car.mt = false; if (!m.car.wreck) m.car.ai = "traffic"; } if (m.type === "hit" && m.ped) m.ped.mt = false; if (m.type === "race") for (var i = 0; i < m.rv.length; i++) { m.rv[i].c.rv = false; if (!m.rv[i].c.wreck) { m.rv[i].c.ai = "traffic"; m.rv[i].c.vt = 150; } } },
    updMission(dt) {
      var m = this.ms, p = this.p; if (!m) return; m.t -= dt; if (m.t <= 0) { this.missionFail("out of time"); return; }
      var tg = this.mTarget(), pp = p.car || p;
      if (m.type === "deliv") { if (Math.hypot(pp.x - m.tx, pp.y - m.ty) < 52) this.missionDone(); }
      else if (m.type === "take") { if (m.car.dead || (m.car.wreck && !m.car.exploded)) this.missionDone(); else if (Math.hypot(pp.x - m.car.x, pp.y - m.car.y) > 1300) this.missionFail("target escaped"); }
      else if (m.type === "hit") { if (this.peds.indexOf(m.ped) < 0) { if (this.ms) this.missionDone(); } else if (Math.hypot(pp.x - m.ped.x, pp.y - m.ped.y) > 1400) this.missionFail("target lost"); }
      else if (m.type === "race") {
        if (!p.car) { m.walk = (m.walk || 0) + dt; if (m.walk > 6) { this.missionFail("you left the car"); return; } } else m.walk = 0;
        if (m.i < m.cps.length && Math.hypot(pp.x - tg.x, pp.y - tg.y) < 70) { m.i++; this.msg("Checkpoint " + m.i + "/" + m.cps.length, "#6bff9a", 1); sfx("pick"); m.t += 7; if (m.i >= m.cps.length) { m.place = m.fin + 1; this.missionDone(); return; } }
        for (var i = 0; i < m.rv.length; i++) { var r = m.rv[i], c = r.c; if (r.fin || c.wreck) continue; var ck = m.cps[Math.min(r.i, m.cps.length - 1)]; if (Math.hypot(c.x - ck.x, c.y - ck.y) < 80) { r.i++; if (r.i >= m.cps.length) { r.fin = true; m.fin++; this.msg("A rival finished the race!", "#ffd15c", 2); c.ai = "traffic"; c.rv = false; } } }
      }
    },
/*@@NEXT@@*/
