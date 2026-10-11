window.__AG_bigB = (function () {
  /* ---------- shared helpers ---------- */
  const _gl = {};
  function GL(c) { let g = _gl[c]; if (g) return g; g = document.createElement("canvas"); g.width = g.height = 48; const x = g.getContext("2d"); const r = x.createRadialGradient(24, 24, 0, 24, 24, 24); r.addColorStop(0, c); r.addColorStop(.4, c); r.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = r; x.fillRect(0, 0, 48, 48); return _gl[c] = g; }
  function glow(x, y, r, c, a) { ctx2d.save(); ctx2d.globalCompositeOperation = "lighter"; ctx2d.globalAlpha = a == null ? .6 : a; ctx2d.drawImage(GL(c), x - r, y - r, r * 2, r * 2); ctx2d.restore(); }
  function sfx(f, t, d, w, v) { try { beep(f, t, d, w || "square", v || .05); } catch (e) { } }
  function ld(k, d) { try { const v = localStorage.getItem("mg_bigB_" + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  function sv(k, v) { try { localStorage.setItem("mg_bigB_" + k, JSON.stringify(v)); } catch (e) { } }
  function inR(px, py, r) { return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h; }
  function btn(r, label, col, size) { rect(r.x, r.y, r.w, r.h, col, 10); text(label, r.x + r.w / 2, r.y + r.h / 2 + 5, size || 14, "#fff", "center", 800); }
  function strokeRR(x, y, w, h, rad, c, lw) { ctx2d.strokeStyle = c; ctx2d.lineWidth = lw || 2; ctx2d.beginPath(); if (ctx2d.roundRect) ctx2d.roundRect(x, y, w, h, rad); else ctx2d.rect(x, y, w, h); ctx2d.stroke(); }
  function sparks(list, x, y, c, n, spd, max) { for (let k = 0; k < n && list.length < (max || 300); k++) { const a = rand(0, 6.283), v = rand(spd * .3, spd); list.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rand(.25, .6), max: .6, r: rand(1.5, 3.5), c }); } }
  function tickFx(fx, dt) { for (let i = fx.length - 1; i >= 0; i--) { const f = fx[i]; f.x += f.vx * dt; f.y += f.vy * dt; f.vx *= 1 - 2 * dt; f.vy *= 1 - 2 * dt; f.life -= dt; if (f.life <= 0) fx.splice(i, 1); } }
  function drawFx(fx, X, Y) { ctx2d.save(); ctx2d.globalCompositeOperation = "lighter"; for (const f of fx) { ctx2d.globalAlpha = clamp(f.life / f.max, 0, 1); circle(X(f.x), Y(f.y), f.r, f.c); } ctx2d.restore(); ctx2d.globalAlpha = 1; }
  function tickPops(pp, dt) { for (let i = pp.length - 1; i >= 0; i--) { pp[i].y -= 28 * dt; pp[i].life -= dt; if (pp[i].life <= 0) pp.splice(i, 1); } }
  function addPop(pp, x, y, t, c, big) { if (pp.length < 40) pp.push({ x, y, t: String(t), c, life: .8, big }); }
  function drawPops(pp, X, Y) { for (const q of pp) { ctx2d.globalAlpha = clamp(q.life * 2, 0, 1); text(q.t, X(q.x), Y(q.y), q.big ? 15 : 12, q.c, "center", 800); } ctx2d.globalAlpha = 1; }
  function fmt(n) { return String(Math.floor(n)); }

  /* ================= 1. DUNGEON DELVERS ================= */
  const RAR = [{ n: "Common", c: "#c8ccd8" }, { n: "Uncommon", c: "#5fe06a" }, { n: "Rare", c: "#4da3ff" }, { n: "Epic", c: "#c070ff" }, { n: "Legendary", c: "#ff9a2e" }];
  const STL = { dmg: "Damage", hp: "Max HP", arm: "Armor", crit: "% Crit", spd: "% Speed", leech: "% Leech" };
  const SLOTS = ["weapon", "armor", "helm", "ring"];
  const SLIC = { weapon: "🗡️", armor: "🛡️", helm: "⛑️", ring: "💍" };
  const BASES = { weapon: ["Sword", "Axe", "Mace", "Wand", "Bow", "Blade"], armor: ["Mail", "Jerkin", "Robe", "Plate"], helm: ["Helm", "Hood", "Cap", "Crown"], ring: ["Ring", "Band", "Signet"] };
  const ADJ = ["Rusty", "Sturdy", "Keen", "Grim", "Gilded", "Runed", "Wicked", "Ancient", "Brave", "Savage"];
  const NOUN = ["the Fox", "the Bear", "Embers", "the Deep", "Storms", "the Wolf", "Ruin", "the Owl", "Thorns"];
  const LEG = ["Emberfang", "Stormcaller", "Voidreaver", "Dawnshard", "Nightbloom", "Gravewind"];
  const EN = {
    skel: { n: "Skeleton", hp: 30, spd: 68, dm: 9, r: 11, xp: 6, c: "#e8e0c8" },
    slime: { n: "Slime", hp: 44, spd: 42, dm: 8, r: 13, xp: 7, c: "#5fe06a" },
    bat: { n: "Bat", hp: 14, spd: 118, dm: 6, r: 8, xp: 4, c: "#b07aff" },
    archer: { n: "Archer", hp: 24, spd: 58, dm: 9, r: 10, xp: 8, c: "#e8b060", rng: 1 },
    brute: { n: "Brute", hp: 100, spd: 52, dm: 18, r: 15, xp: 16, c: "#d26a4a" },
    cult: { n: "Cultist", hp: 32, spd: 54, dm: 8, r: 10, xp: 10, c: "#ff5fa8", rng: 1 }
  };
  const BOSS = [
    { n: "Bone King", c: "#e8e0c8", pat: ["chg", "sum", "aim"] },
    { n: "Slime Queen", c: "#5fe06a", pat: ["ring", "sum", "aim"] },
    { n: "Lich Warden", c: "#a978ff", pat: ["aim", "ring", "spi"] },
    { n: "Ember Drake", c: "#ff7a3a", pat: ["spi", "chg", "ring"] },
    { n: "The Hollow One", c: "#55e6ff", pat: ["ring", "spi", "sum", "chg", "aim"] }
  ];
  const THEME = [
    { f: ["#2b2433", "#2f2738"], w: "#4a3b5c", t: "#1b1623" }, { f: ["#33281f", "#382c22"], w: "#5e4630", t: "#211810" },
    { f: ["#1f3026", "#22352a"], w: "#3d6048", t: "#12201a" }, { f: ["#3a2020", "#402424"], w: "#6e3a30", t: "#241010" },
    { f: ["#1d2438", "#212a40"], w: "#3d4f7a", t: "#10152a" }];
  const CLS = {
    warrior: { n: "Warrior", ic: "⚔️", c: "#e0803a", hp: 150, dmg: 11, spd: 128, cd: .42, sk: "Whirlwind", skcd: 6, d: "Sweeping melee arc. Whirlwind hits all around you." },
    ranger: { n: "Ranger", ic: "🏹", c: "#6bd96b", hp: 105, dmg: 10, spd: 142, cd: .3, sk: "Volley", skcd: 6, d: "Fast arrows from range. Volley fires a fan of arrows." },
    mage: { n: "Mage", ic: "🔮", c: "#6aa8ff", hp: 90, dmg: 13, spd: 126, cd: .55, sk: "Frost Nova", skcd: 7, d: "Exploding bolts. Frost Nova freezes nearby foes." }
  };
  const PK = [
    { id: "pw", n: "Brutal Force", d: "+15% damage", ic: "🔥" }, { id: "vit", n: "Iron Hide", d: "+25 max HP and heal", ic: "❤️" },
    { id: "haste", n: "Fleet Foot", d: "+8% move speed", ic: "👟" }, { id: "crit", n: "Deadly Aim", d: "+6% crit chance", ic: "🎯" },
    { id: "cdr", n: "Quick Mind", d: "-12% skill cooldown", ic: "⏳" }, { id: "skp", n: "Skill Mastery", d: "+35% skill damage", ic: "💫" },
    { id: "reg", n: "Regeneration", d: "+1.2 HP per second", ic: "🌿" }, { id: "greed", n: "Treasure Hunter", d: "+30% gold, better loot", ic: "💰" },
    { id: "atk", n: "Rapid Strike", d: "-10% attack delay", ic: "⚡" },
    { id: "arc", n: "Wide Arc", d: "Bigger, longer sword swings", ic: "🌙", cl: "warrior" }, { id: "blood", n: "Bloodthirst", d: "+3% life leech", ic: "🩸", cl: "warrior" },
    { id: "multi", n: "Extra Arrow", d: "+1 arrow per shot", ic: "🏹", cl: "ranger" }, { id: "pierce", n: "Piercing Shot", d: "Arrows pierce +1 enemy", ic: "➶", cl: "ranger" },
    { id: "blast", n: "Bigger Blast", d: "+25% bolt explosion size", ic: "💥", cl: "mage" }, { id: "frost", n: "Frostbite", d: "Bolts slow enemies", ic: "❄️", cl: "mage" }
  ];

  const DD = {
    a: false, TS: 32, MW: 54, MH: 54,
    init() {
      this.a = true; this.best = ld("ddbest", { floor: 0, kills: 0 }); this.fx = []; this.pops = []; this.state = "class"; this.t2 = 0; this.tt = 0;
      this.mm = document.createElement("canvas"); this.mm.width = this.MW; this.mm.height = this.MH; this.mmc = this.mm.getContext("2d");
      this.sel = null; this.shake = 0; this.flash = 0; this.banner = null; this.cards = null; this.pend = 0; this.floor = 1;
      this.p = { x: 0, y: 0, hp: 1, max: 1, s: {}, eq: {}, bag: [], pk: {}, lv: 1 };
      this.en = []; this.pr = []; this.eb = []; this.pk = []; this.sl = []; this.g = new Uint8Array(this.MW * this.MH); this.ex = new Uint8Array(this.MW * this.MH); this.rooms = [];
      hudTitle("DUNGEON DELVERS", "Choose your hero");
    },
    destroy() { this.a = false; },
    /* ----- run setup ----- */
    start(k) {
      const c = CLS[k]; this.cls = k; this.floor = 1; this.kills = 0; this.gold = 0; this.run = 0;
      this.p = { x: 0, y: 0, hp: c.hp, max: c.hp, face: 0, inv: 0, cd: 0, skcd: 0, xp: 0, lv: 1, need: 30, pots: 3, eq: {}, bag: [], pk: {}, s: { dmg: 0, hp: 0, arm: 0, crit: 5, spd: 0, leech: 0 }, step: 0 };
      const w = this.mkItem("weapon", 1, 0); this.p.eq.weapon = w; this.recalc(); this.p.hp = this.p.max;
      this.state = "play"; this.cards = null; this.pend = 0; this.sel = null; this.newFloor();
    },
    recalc() {
      const p = this.p, c = CLS[this.cls], s = { dmg: 0, hp: 0, arm: 0, crit: 0, spd: 0, leech: 0 };
      for (const k of SLOTS) { const it = p.eq[k]; if (it) for (const q in it.st) s[q] += it.st[q]; }
      s.hp += (p.lv - 1) * 9 + 25 * (p.pk.vit || 0); s.crit += 5 + 6 * (p.pk.crit || 0); s.spd += 8 * (p.pk.haste || 0); s.leech += 3 * (p.pk.blood || 0);
      s.dmg += c.dmg + (p.lv - 1) * 1.7; s.dm = 1 + .15 * (p.pk.pw || 0);
      p.s = s; const old = p.max; p.max = c.hp + s.hp; if (p.max > old) p.hp += p.max - old; p.hp = Math.min(p.hp, p.max);
    },
    /* ----- items ----- */
    score(it) { if (!it) return 0; const s = it.st; return (s.dmg || 0) * 3 + (s.hp || 0) * .4 + (s.arm || 0) * 1.5 + (s.crit || 0) * 2 + (s.spd || 0) * 1.5 + (s.leech || 0) * 4; },
    mkItem(slot, ilvl, rar) {
      const st = {}, k = .85 + rar * .15, rr = () => rand(.8, 1.15);
      if (slot === "weapon") st.dmg = Math.round((3 + ilvl * 2.4) * k * rr());
      else if (slot === "armor") { st.arm = Math.round((5 + ilvl * 3) * k * rr()); st.hp = Math.round((10 + ilvl * 6) * k * rr()); }
      else if (slot === "helm") { st.arm = Math.round((3 + ilvl * 2) * k * rr()); st.hp = Math.round((6 + ilvl * 4) * k * rr()); }
      else st.crit = Math.round((2 + ilvl * .7) * k * rr());
      const pool = ["dmg", "hp", "arm", "crit", "spd", "leech"].filter(q => !(q in st) || q === "hp" || q === "arm" || q === "dmg");
      for (let i = 0; i < rar; i++) {
        const q = pick(pool); let v;
        if (q === "dmg") v = 1.5 + ilvl * 1.2; else if (q === "hp") v = 10 + ilvl * 7; else if (q === "arm") v = 3 + ilvl * 2.4; else if (q === "crit") v = 2 + ilvl * .7; else if (q === "spd") v = 2 + ilvl * .5; else v = 1 + ilvl * .25;
        st[q] = (st[q] || 0) + Math.max(1, Math.round(v * rand(.7, 1.2)));
      }
      if (st.spd) st.spd = Math.min(st.spd, 14); if (st.leech) st.leech = Math.min(st.leech, 6);
      const b = pick(BASES[slot]); let n = b;
      if (rar === 1) n = pick(ADJ) + " " + b; else if (rar === 2) n = pick(ADJ) + " " + b + " of " + pick(NOUN); else if (rar === 3) n = pick(ADJ) + " " + b + " of " + pick(NOUN); else if (rar === 4) n = pick(LEG) + " " + b;
      return { slot, rar, n, st, il: ilvl };
    },
    genItem(minRar, luck) {
      const f = this.floor + Math.floor(this.p.lv / 4), r = Math.random() - (luck || 0) * .02 - (this.p.pk.greed || 0) * .02; let rar = r < .02 + this.floor * .004 ? 4 : r < .1 ? 3 : r < .28 ? 2 : r < .6 ? 1 : 0;
      return this.mkItem(pick(SLOTS), f, Math.max(rar, minRar || 0));
    },
    dropItem(x, y, it) { this.pk.push({ t: "item", x, y, it, b: rand(0, 6) }); if (it.rar >= 3) { sfx(500, 1100, .3, "triangle", .08); } },
    addBag(it) {
      const p = this.p; if (!p.eq[it.slot]) { p.eq[it.slot] = it; this.recalc(); toast("Equipped " + it.n); return true; }
      if (p.bag.length >= 12) return false; p.bag.push(it); return true;
    },
    /* ----- map ----- */
    solid(tx, ty) { return tx < 0 || ty < 0 || tx >= this.MW || ty >= this.MH || this.g[ty * this.MW + tx] === 0; },
    blocked(x, y, r) { const T = this.TS; return this.solid(Math.floor((x - r) / T), Math.floor((y - r) / T)) || this.solid(Math.floor((x + r) / T), Math.floor((y - r) / T)) || this.solid(Math.floor((x - r) / T), Math.floor((y + r) / T)) || this.solid(Math.floor((x + r) / T), Math.floor((y + r) / T)); },
    move(e, dx, dy, r) { if (!this.blocked(e.x + dx, e.y, r)) e.x += dx; if (!this.blocked(e.x, e.y + dy, r)) e.y += dy; },
    newFloor() {
      const MW = this.MW, MH = this.MH, g = this.g; g.fill(0); this.ex.fill(0); this.mmc.clearRect(0, 0, MW, MH);
      const rooms = this.rooms = []; const T = this.TS;
      for (let tr = 0; tr < 300 && rooms.length < 11; tr++) {
        const w = randi(6, 11), h = randi(6, 10), x = randi(2, MW - w - 3), y = randi(2, MH - h - 3);
        if (rooms.some(r => x < r.x + r.w + 3 && x + w + 3 > r.x && y < r.y + r.h + 3 && y + h + 3 > r.y)) continue;
        rooms.push({ x, y, w, h, cx: Math.floor(x + w / 2), cy: Math.floor(y + h / 2) });
      }
      const carve = (x, y) => { for (let a = 0; a < 2; a++)for (let b = 0; b < 2; b++) { const i = (y + b) * MW + x + a; if (x + a > 0 && y + b > 0 && x + a < MW - 1 && y + b < MH - 1) g[i] = 1; } };
      for (const r of rooms) for (let y = r.y; y < r.y + r.h; y++)for (let x = r.x; x < r.x + r.w; x++)g[y * MW + x] = 1;
      for (let i = 1; i < rooms.length; i++) {
        let bj = 0, bd = 1e9; for (let j = 0; j < i; j++) { const d = Math.hypot(rooms[i].cx - rooms[j].cx, rooms[i].cy - rooms[j].cy); if (d < bd) { bd = d; bj = j; } }
        const a = rooms[i], b = rooms[bj]; let x = a.cx, y = a.cy; const hf = Math.random() < .5;
        const stepX = () => { while (x !== b.cx) { carve(x, y); x += x < b.cx ? 1 : -1; } }, stepY = () => { while (y !== b.cy) { carve(x, y); y += y < b.cy ? 1 : -1; } };
        if (hf) { stepX(); stepY(); } else { stepY(); stepX(); }
      }
      if (rooms.length > 4) { const a = rooms[0], b = rooms[rooms.length - 1]; let x = a.cx, y = a.cy; while (x !== b.cx) { carve(x, y); x += x < b.cx ? 1 : -1; } while (y !== b.cy) { carve(x, y); y += y < b.cy ? 1 : -1; } }
      const s = rooms[0]; let bi = 1, bd = 0; for (let i = 1; i < rooms.length; i++) { const d = Math.hypot(rooms[i].cx - s.cx, rooms[i].cy - s.cy); if (d > bd) { bd = d; bi = i; } }
      this.bossRoom = rooms[bi]; this.start0 = s;
      const p = this.p; p.x = (s.cx + .5) * T; p.y = (s.cy + .5) * T;
      this.en = []; this.pr = []; this.eb = []; this.pk = []; this.sl = []; this.stairs = { x: (this.bossRoom.cx + .5) * T, y: (this.bossRoom.cy + .5) * T }; this.bossDead = false; this.boss = null; this.msgT = 0; this.bossSeen = false;
      const fl = this.floor, types = ["skel", "slime", "bat"]; if (fl >= 2) types.push("archer", "cult"); if (fl >= 3) types.push("brute", "archer");
      this.chests = [];
      rooms.forEach((r, i) => {
        if (i === 0) return;
        if (i === bi) { this.spawnBoss(r); return; }
        const n = 3 + fl + randi(0, 2);
        for (let k = 0; k < n; k++) { const ty = pick(types), x = (randi(r.x + 1, r.x + r.w - 2) + .5) * T, y = (randi(r.y + 1, r.y + r.h - 2) + .5) * T; this.spawnEn(ty, x, y, Math.random() < .1 + fl * .03 && k === 0); }
        if (Math.random() < .55 || i === 1) this.chests.push({ x: (randi(r.x + 1, r.x + r.w - 2) + .5) * T, y: (randi(r.y + 1, r.y + r.h - 2) + .5) * T, open: false });
      });
      this.banner = { txt: "FLOOR " + fl, sub: ["Forgotten Crypt", "Root Caverns", "Mire Depths", "Ember Halls", "The Hollow"][fl - 1], t: 2.4 }; this.flash = .4;
      hudTitle("DUNGEON DELVERS", CLS[this.cls].n + " • Floor " + fl);
    },
    spawnEn(ty, x, y, elite, mini) {
      const d = EN[ty], fl = this.floor, hs = 1 + .38 * (fl - 1), ds = 1 + .25 * (fl - 1); const aff = elite ? pick(["swift", "brutal", "vamp", "volatile"]) : null;
      const m = mini ? .35 : 1, el = elite ? 3 : 1;
      const e = { ty, x, y, hp: d.hp * hs * m * el * (aff === "brutal" ? 1.3 : 1), r: d.r * (elite ? 1.3 : 1) * (mini ? .65 : 1), spd: d.spd * (aff === "swift" ? 1.45 : 1), dm: d.dm * ds * (aff === "brutal" ? 1.6 : 1), c: d.c, xp: d.xp * (elite ? 4 : 1) * (mini ? .3 : 1), aw: false, hf: 0, ac: rand(.3, 1), kx: 0, ky: 0, fz: 0, el: !!elite, aff, id: Math.random() * 9, mini: !!mini, sh: rand(1, 2.5), st: 0, ph: 0 };
      e.max = e.hp; this.en.push(e); return e;
    },
    spawnBoss(r) {
      const bi = Math.min(this.floor - 1, 4), d = BOSS[bi], T = this.TS, hp = 520 + this.floor * 420;
      const e = { ty: "boss", bi, x: (r.cx + .5) * T, y: (r.cy - 1.5 + .5) * T, hp, max: hp, r: 30, spd: 48, dm: 16 + this.floor * 4, c: d.c, xp: 90 + this.floor * 30, aw: false, hf: 0, ac: 2, kx: 0, ky: 0, fz: 0, el: false, boss: true, id: 1, pi: 0, st: 0, ph: 0, sh: 2, sp: 0 };
      this.en.push(e); this.boss = e;
    },
    /* ----- combat ----- */
    nearest(x, y, max) { let b = null, bd = max * max; for (const e of this.en) { if (e.dead) continue; const d = (e.x - x) ** 2 + (e.y - y) ** 2; if (d < bd) { bd = d; b = e; } } return b; },
    pdmg(mult) {
      const p = this.p, s = p.s; let d = (s.dmg) * s.dm * (mult || 1) * rand(.9, 1.1), cr = false; if (Math.random() * 100 < s.crit) { d *= 1.9; cr = true; } return [Math.round(d), cr];
    },
    hitEn(e, d, cr, kb, ax, ay) {
      if (e.dead) return; e.hp -= d; e.hf = .08; const p = this.p;
      addPop(this.pops, e.x + rand(-6, 6), e.y - e.r, d, cr ? "#ffd15c" : "#fff", cr);
      if (kb && !e.boss) { const l = Math.hypot(e.x - ax, e.y - ay) || 1; e.kx += (e.x - ax) / l * kb; e.ky += (e.y - ay) / l * kb; }
      if (p.s.leech > 0) p.hp = Math.min(p.max, p.hp + d * p.s.leech / 100);
      sparks(this.fx, e.x, e.y, e.c, cr ? 6 : 3, 110); if (cr) this.shake = Math.max(this.shake, 3);
      if (e.hp <= 0) this.kill(e); else sfx(240, 130, .04, "square", .02);
      if (e.boss && e.hp < e.max * .5 && !e.enr) { e.enr = true; this.banner = { txt: BOSS[e.bi].n + " ENRAGED", t: 1.6 }; sfx(90, 40, .6, "sawtooth", .12); }
    },
    kill(e) {
      e.dead = true; this.kills++; const p = this.p, T = this.TS; sparks(this.fx, e.x, e.y, e.c, e.boss ? 40 : 12, e.boss ? 320 : 170); sfx(200, 70, .08, "sawtooth", .035);
      this.shake = Math.max(this.shake, e.boss ? 14 : 2);
      p.xp += e.xp; this.gainXp();
      const gold = Math.round(rand(1, 5) * (1 + this.floor * .5) * (e.el ? 3 : 1) * (e.boss ? 10 : 1) * (1 + .3 * (p.pk.greed || 0)));
      if (!e.mini) this.pk.push({ t: "gold", x: e.x, y: e.y, v: gold, b: 0 });
      if (Math.random() < (e.el ? .6 : .09) && !e.mini) this.pk.push({ t: "pot", x: e.x + 8, y: e.y, b: 0 });
      if (e.boss) { for (let i = 0; i < 3; i++) this.dropItem(e.x + rand(-26, 26), e.y + rand(-26, 26), this.genItem(i === 0 ? 3 : 2, 4)); this.bossDead = true; this.flash = .6; this.banner = { txt: BOSS[e.bi].n.toUpperCase() + " SLAIN", sub: "The stairs are open", t: 2.4 }; for (const q of this.en) if (!q.boss && !q.dead) q.hp = 0, q.dead = true; }
      else if (e.el) { this.dropItem(e.x, e.y, this.genItem(1, 2)); if (e.aff === "volatile") { this.shake = 8; this.ring(e.x, e.y, 70, "#ff8844"); if (Math.hypot(p.x - e.x, p.y - e.y) < 70) this.hurt(e.dm * 1.5); } }
      else if (Math.random() < .07 + (p.pk.greed || 0) * .02) this.dropItem(e.x, e.y, this.genItem(0, 0));
      if (e.ty === "slime" && !e.mini && !e.boss) for (let i = 0; i < 2; i++) { const n = this.spawnEn("slime", e.x + rand(-10, 10), e.y + rand(-10, 10), false, true); n.aw = true; }
    },
    ring(x, y, r, c) { this.sl.push({ t: "ring", x, y, r, c, life: .4, max: .4 }); },
    gainXp() { const p = this.p; while (p.xp >= p.need) { p.xp -= p.need; p.lv++; p.need = Math.floor(p.need * 1.32 + 8); this.pend++; sfx(400, 1000, .3, "triangle", .12); this.flash = .3; this.recalc(); p.hp = Math.min(p.max, p.hp + p.max * .3); addPop(this.pops, p.x, p.y - 20, "LEVEL UP!", "#ffd15c", true); } },
    openPerks() {
      if (this.pend <= 0) return; const cl = this.cls; const pool = PK.filter(k => (!k.cl || k.cl === cl) && (this.p.pk[k.id] || 0) < 5); const out = [];
      while (out.length < 3 && pool.length) out.push(pool.splice(randi(0, pool.length - 1), 1)[0]);
      this.cards = out; this.state = "perk"; this.pend--;
    },
    pickPerk(i) { const c = this.cards && this.cards[i]; if (!c) return; const p = this.p; p.pk[c.id] = (p.pk[c.id] || 0) + 1; if (c.id === "vit") p.hp = p.max; this.recalc(); if (c.id === "vit") p.hp = Math.min(p.max, p.hp + 25); this.cards = null; this.state = "play"; sfx(500, 900, .15, "triangle", .1); if (this.pend > 0) this.openPerks(); },
    hurt(d) {
      const p = this.p; if (p.inv > 0 || this.state !== "play") return; const dd = Math.max(1, Math.round(d / (1 + p.s.arm / 60)));
      p.hp -= dd; p.inv = .55; this.shake = 8; this.flash = .25; sfx(180, 60, .25, "sawtooth", .1); sparks(this.fx, p.x, p.y, "#ff4f6a", 10, 190); addPop(this.pops, p.x, p.y - 14, "-" + dd, "#ff6b6b", true);
      if (p.hp <= 0) { this.state = "over"; this.t2 = 0; sparks(this.fx, p.x, p.y, CLS[this.cls].c, 40, 300); this.endRun(false); }
    },
    endRun(win) {
      const sc = this.floor * 100 + this.kills * 2 + this.gold; this.score = sc; this.newBest = false;
      if (this.floor > this.best.floor || (win && !this.best.win)) { this.best = { floor: Math.max(this.floor, this.best.floor), kills: this.kills, win: win || this.best.win }; sv("ddbest", this.best); this.newBest = true; }
      try { progress.coins += Math.floor(sc / 20); saveProg(); } catch (e) { }
    },
    drink() { const p = this.p; if (p.pots > 0 && p.hp < p.max) { p.pots--; const h = Math.round(p.max * .5); p.hp = Math.min(p.max, p.hp + h); addPop(this.pops, p.x, p.y - 16, "+" + h, "#6bff6b", true); sparks(this.fx, p.x, p.y, "#6bff6b", 14, 120); sfx(500, 900, .2, "sine", .08); } },
    attack() {
      const p = this.p, k = this.cls, c = CLS[k], tg = this.nearest(p.x, p.y, k === "warrior" ? 120 : 330); let a = p.face; if (tg) a = Math.atan2(tg.y - p.y, tg.x - p.x); p.face = a;
      p.cd = c.cd * (1 - .1 * (p.pk.atk || 0));
      if (k === "warrior") {
        const rg = 54 + 14 * (p.pk.arc || 0), ha = 1.05 + .25 * (p.pk.arc || 0); this.sl.push({ t: "slash", x: p.x, y: p.y, a, r: rg, ha, life: .18, max: .18 }); sfx(300, 120, .08, "sawtooth", .05);
        for (const e of this.en) { if (e.dead) continue; const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy); if (d > rg + e.r) continue; let da = Math.abs(Math.atan2(dy, dx) - a); if (da > Math.PI) da = 6.283 - da; if (da < ha || d < e.r + 10) { const [dm, cr] = this.pdmg(1); this.hitEn(e, dm, cr, 120, p.x, p.y); } }
        p.x += Math.cos(a) * 3; p.y += Math.sin(a) * 3;
      } else if (k === "ranger") {
        const n = 1 + (p.pk.multi || 0), sp = .14; for (let i = 0; i < n; i++) { const aa = a + (i - (n - 1) / 2) * sp; this.pr.push({ x: p.x, y: p.y, vx: Math.cos(aa) * 520, vy: Math.sin(aa) * 520, dm: 1, life: .9, pi: 1 + (p.pk.pierce || 0), hit: [], ty: "arrow", a: aa }); } sfx(700, 400, .06, "triangle", .05);
      } else {
        this.pr.push({ x: p.x, y: p.y, vx: Math.cos(a) * 360, vy: Math.sin(a) * 360, dm: 1.15, life: 1.1, pi: 1, hit: [], ty: "bolt", a, bl: 38 * (1 + .25 * (p.pk.blast || 0)) }); sfx(500, 900, .12, "sine", .06);
      }
    },
    skill() {
      const p = this.p, k = this.cls, c = CLS[k]; if (p.skcd > 0) return; p.skcd = c.skcd * (1 - .12 * (p.pk.cdr || 0)); const sm = 1 + .35 * (p.pk.skp || 0);
      if (k === "warrior") {
        this.sl.push({ t: "spin", x: p.x, y: p.y, life: .4, max: .4 }); this.ring(p.x, p.y, 84, "#ffb060"); this.shake = 6; sfx(150, 60, .3, "sawtooth", .1);
        for (const e of this.en) { if (e.dead) continue; if (Math.hypot(e.x - p.x, e.y - p.y) < 84 + e.r) { const [dm, cr] = this.pdmg(2.2 * sm); this.hitEn(e, dm, cr, 220, p.x, p.y); } }
      } else if (k === "ranger") {
        const tg = this.nearest(p.x, p.y, 400); const a = tg ? Math.atan2(tg.y - p.y, tg.x - p.x) : p.face; sfx(900, 300, .25, "triangle", .08);
        for (let i = 0; i < 9; i++) { const aa = a + (i - 4) * .17; this.pr.push({ x: p.x, y: p.y, vx: Math.cos(aa) * 560, vy: Math.sin(aa) * 560, dm: .95 * sm, life: .8, pi: 2, hit: [], ty: "arrow", a: aa }); }
      } else {
        this.sl.push({ t: "nova", x: p.x, y: p.y, life: .5, max: .5 }); this.ring(p.x, p.y, 125, "#9fd8ff"); this.shake = 5; sfx(120, 40, .4, "sawtooth", .1);
        for (const e of this.en) { if (e.dead) continue; if (Math.hypot(e.x - p.x, e.y - p.y) < 125 + e.r) { const [dm, cr] = this.pdmg(1.8 * sm); this.hitEn(e, dm, cr, 140, p.x, p.y); e.fz = 2.2; } }
      }
    },
    ebullet(x, y, a, sp, dm, c, r) { if (this.eb.length < 120) this.eb.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, dm, life: 3.5, c: c || "#ff914d", r: r || 5 }); },
    bossAct(e, dt) {
      const p = this.p, d = BOSS[e.bi], T = this.TS; const ang = Math.atan2(p.y - e.y, p.x - e.x);
      if (e.st === 1) { e.wt -= dt; if (e.wt <= 0) { e.st = 2; e.wt = .6; e.cx = Math.cos(ang) * 330; e.cy = Math.sin(ang) * 330; sfx(100, 60, .3, "sawtooth", .1); } return; }
      if (e.st === 2) { e.wt -= dt; this.move(e, e.cx * dt, e.cy * dt, e.r * .8); if (e.wt <= 0) e.st = 0; return; }
      if (e.sp > 0) { e.sw -= dt; if (e.sw <= 0) { e.sw = .09; e.sp--; this.ebullet(e.x, e.y, e.sa, 150, e.dm * .5, d.c, 5); e.sa += .55; } }
      e.ac -= dt; if (e.ac <= 0) {
        e.ac = e.enr ? 1.3 : 2.1; const pat = d.pat[e.pi++ % d.pat.length], dm = e.dm * .5;
        if (pat === "ring") { const n = e.enr ? 20 : 14, o = rand(0, 6); for (let i = 0; i < n; i++) this.ebullet(e.x, e.y, o + i / n * 6.283, 125, dm, d.c, 6); sfx(200, 120, .2, "square", .06); }
        else if (pat === "aim") { for (let i = -2; i <= 2; i++) this.ebullet(e.x, e.y, ang + i * .16, 190, dm, d.c, 6); sfx(300, 150, .15, "square", .06); }
        else if (pat === "sum") { const ty = this.floor === 2 ? "slime" : "skel"; for (let i = 0; i < 3; i++) { const q = this.spawnEn(ty, e.x + rand(-40, 40), e.y + rand(-40, 40), false); if (!this.blocked(q.x, q.y, 8)) q.aw = true; else { q.x = e.x; q.y = e.y; q.aw = true; } } sparks(this.fx, e.x, e.y, d.c, 14, 160); }
        else if (pat === "chg") { e.st = 1; e.wt = .6; }
        else if (pat === "spi") { e.sp = 14; e.sw = 0; e.sa = rand(0, 6); }
      }
    },
    /* ----- UI geometry ----- */
    lay() {
      const w = W(), L = {}; L.bag = { x: 12, y: 114, w: 70, h: 28 }; L.pot = { x: 88, y: 114, w: 70, h: 28 }; L.close = { x: w - 54, y: 84, w: 44, h: 34 };
      const cw = Math.min(w - 24, 376), x0 = (w - cw) / 2; L.eq = SLOTS.map((s, i) => ({ s, x: x0 + i * (cw / 4), y: 150, w: cw / 4 - 8, h: 54 }));
      const cs = (cw - 9) / 4; L.cell = []; for (let i = 0; i < 12; i++) L.cell.push({ x: x0 + (i % 4) * (cs + 3), y: 250 + Math.floor(i / 4) * (cs * .8 + 3), w: cs, h: cs * .8 });
      L.act1 = { x: x0, y: 250 + 3 * (cs * .8 + 3) + 150, w: cw / 2 - 5, h: 38 }; L.act2 = { x: x0 + cw / 2 + 5, y: L.act1.y, w: cw / 2 - 5, h: 38 }; L.buy = { x: x0, y: L.act1.y + 46, w: cw, h: 34 }; L.x0 = x0; L.cw = cw; L.dy = 250 + 3 * (cs * .8 + 3) + 8;
      return L;
    },
    cardRects() { const w = Math.min(W() - 36, 380), h = 88, x = (W() - w) / 2, y0 = H() / 2 - 140; return [0, 1, 2].map(i => ({ x, y: y0 + i * (h + 12), w, h })); },
    classRects() { const w = Math.min(W() - 30, 380), h = 118, x = (W() - w) / 2; return [0, 1, 2].map(i => ({ x, y: 150 + i * (h + 12), w, h })); },
    getSel() { const s = this.sel; if (!s) return null; return s.eq ? this.p.eq[s.eq] : this.p.bag[s.bag]; },
    pointer(px, py) {
      if (this.state === "class") { const R = this.classRects(), ks = Object.keys(CLS); for (let i = 0; i < 3; i++) if (inR(px, py, R[i])) { this.start(ks[i]); return; } return; }
      if (this.state === "over" || this.state === "win") { if (this.t2 > .8) { this.state = "class"; this.t2 = 0; hudTitle("DUNGEON DELVERS", "Choose your hero"); } return; }
      if (this.state === "perk") { const R = this.cardRects(); for (let i = 0; i < R.length; i++) if (inR(px, py, R[i])) { this.pickPerk(i); return; } return; }
      const L = this.lay();
      if (this.state === "play") { if (inR(px, py, L.bag)) { this.state = "inv"; this.sel = null; } else if (inR(px, py, L.pot)) this.drink(); return; }
      if (this.state === "inv") {
        const p = this.p; if (inR(px, py, L.close) || inR(px, py, L.bag)) { this.state = "play"; return; }
        L.eq.forEach(r => { if (inR(px, py, r)) this.sel = p.eq[r.s] ? { eq: r.s } : null; });
        L.cell.forEach((r, i) => { if (inR(px, py, r)) this.sel = p.bag[i] ? { bag: i } : null; });
        const it = this.getSel();
        if (it && inR(px, py, L.act1)) {
          if (this.sel.eq) { if (p.bag.length < 12) { p.bag.push(it); delete p.eq[this.sel.eq]; this.recalc(); this.sel = null; } else toast("Bag is full"); }
          else { const old = p.eq[it.slot]; p.eq[it.slot] = it; p.bag.splice(this.sel.bag, 1); if (old) p.bag.push(old); this.recalc(); this.sel = null; sfx(400, 600, .1, "triangle", .08); }
        } else if (it && inR(px, py, L.act2)) {
          const v = Math.round(5 + this.score(it) * .8 + it.rar * 12); this.gold += v; toast("Sold for " + v + " gold");
          if (this.sel.eq) { delete p.eq[this.sel.eq]; this.recalc(); } else p.bag.splice(this.sel.bag, 1); this.sel = null; sfx(800, 1200, .1, "sine", .08);
        } else if (inR(px, py, L.buy)) { if (this.gold >= 40 && p.pots < 9) { this.gold -= 40; p.pots++; sfx(600, 900, .1, "sine", .08); } else toast(p.pots >= 9 ? "Potion belt full" : "Need 40 gold"); }
      }
    },
    /* ----- update ----- */
    update(dt) {
      this.tt += dt; tickFx(this.fx, dt); tickPops(this.pops, dt); this.shake = Math.max(0, this.shake - dt * 30); this.flash = Math.max(0, this.flash - dt * 1.6);
      for (let i = this.sl.length - 1; i >= 0; i--) { this.sl[i].life -= dt; if (this.sl[i].life <= 0) this.sl.splice(i, 1); }
      if (this.banner) { this.banner.t -= dt; if (this.banner.t <= 0) this.banner = null; }
      if (this.state === "class" || this.state === "perk") return;
      if (this.state === "over" || this.state === "win") { this.t2 += dt; if ((pressed("a") || pressed("b")) && this.t2 > .8) { this.state = "class"; this.t2 = 0; hudTitle("DUNGEON DELVERS", "Choose your hero"); } return; }
      if (this.state === "inv") { if (pressed("b")) this.state = "play"; return; }
      const p = this.p, T = this.TS; this.msgT -= dt;
      if (this.pend > 0) { this.openPerks(); return; }
      p.inv = Math.max(0, p.inv - dt); p.cd -= dt; p.skcd -= dt; if (p.pk.reg) p.hp = Math.min(p.max, p.hp + 1.2 * p.pk.reg * dt);
      let mx = AX(), my = AY(); const m = Math.hypot(mx, my); if (m > 1) { mx /= m; my /= m; }
      const sp = (CLS[this.cls].spd) * (1 + p.s.spd / 100); if (m > .1) { p.face = Math.atan2(my, mx); p.step += dt * 10; } this.move(p, mx * sp * dt, my * sp * dt, 9);
      // reveal
      const tx = Math.floor(p.x / T), ty = Math.floor(p.y / T);
      for (let y = ty - 7; y <= ty + 7; y++)for (let x = tx - 7; x <= tx + 7; x++) { if (x < 0 || y < 0 || x >= this.MW || y >= this.MH) continue; const i = y * this.MW + x; if (!this.ex[i] && (x - tx) ** 2 + (y - ty) ** 2 < 50) { this.ex[i] = 1; if (this.g[i]) { this.mmc.fillStyle = "#8a8fb0"; this.mmc.fillRect(x, y, 1, 1); } else if (this.g[i - 1] || this.g[i + 1] || this.g[i - this.MW] || this.g[i + this.MW]) { this.mmc.fillStyle = "#3a3d58"; this.mmc.fillRect(x, y, 1, 1); } } }
      if (pressed("a") || key(" ")) { if (p.cd <= 0) this.attack(); }
      if (p.cd <= 0 && key("a") && false) this.attack();
      if (pressed("b")) this.skill();
      if (pressed("c")) this.drink();
      // auto attack when a held button isn't available: attack automatically if enemy close (assist)
      if (p.cd <= 0 && this.nearest(p.x, p.y, this.cls === "warrior" ? 60 : 200)) this.attack();
      // projectiles
      for (const s of this.pr) {
        s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt; if (this.blocked(s.x, s.y, 2)) { s.life = 0; if (s.ty === "bolt") this.boom(s); continue; }
        for (const e of this.en) { if (e.dead || s.life <= 0 || s.hit.indexOf(e) >= 0) continue; if (Math.hypot(e.x - s.x, e.y - s.y) < e.r + 5) {
          s.hit.push(e); const [dm, cr] = this.pdmg(s.dm); this.hitEn(e, dm, cr, 80, s.x - s.vx * .01, s.y - s.vy * .01); if (this.p.pk.frost && !e.boss) e.fz = Math.max(e.fz, 1.2);
          if (s.ty === "bolt") { s.life = 0; this.boom(s, e); } else { s.pi--; if (s.pi <= 0) s.life = 0; } } }
      }
      this.pr = this.pr.filter(s => s.life > 0);
      // enemies
      let nAw = 0;
      for (const e of this.en) {
        if (e.dead) continue; const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1;
        if (!e.aw) { if (d < 230 || (e.boss && d < 300)) { e.aw = true; if (e.boss && !this.bossSeen) { this.bossSeen = true; this.banner = { txt: BOSS[e.bi].n.toUpperCase(), sub: "Floor Guardian", t: 2.2 }; sfx(80, 40, .8, "sawtooth", .15); } } else continue; }
        nAw++; e.hf = Math.max(0, e.hf - dt); e.fz = Math.max(0, e.fz - dt); const slow = e.fz > 0 ? .4 : 1;
        if (e.kx || e.ky) { this.move(e, e.kx * dt, e.ky * dt, e.r * .7); e.kx *= 1 - 8 * dt; e.ky *= 1 - 8 * dt; if (Math.abs(e.kx) < 3) e.kx = 0; if (Math.abs(e.ky) < 3) e.ky = 0; }
        const dd = EN[e.ty], sp2 = e.spd * slow * dt;
        if (e.boss) { if (e.fz <= 0 || true) { this.bossAct(e, dt * slow); if (e.st === 0 && d > 130) this.move(e, dx / d * sp2, dy / d * sp2, e.r * .7); } }
        else if (e.ty === "bat") { const w = Math.sin(this.tt * 6 + e.id) * .9; const a = Math.atan2(dy, dx) + w; this.move(e, Math.cos(a) * sp2, Math.sin(a) * sp2, e.r); }
        else if (e.ty === "archer" || e.ty === "cult") {
          if (d > 230) this.move(e, dx / d * sp2, dy / d * sp2, e.r); else if (d < 130) this.move(e, -dx / d * sp2, -dy / d * sp2, e.r); else this.move(e, -dy / d * sp2 * .6, dx / d * sp2 * .6, e.r);
          e.sh -= dt * slow; if (e.sh <= 0 && d < 380) { e.sh = e.ty === "archer" ? 1.9 : 2.6; const a = Math.atan2(dy, dx); if (e.ty === "archer") this.ebullet(e.x, e.y, a, 210, e.dm, "#e8b060", 4); else for (let i = -1; i <= 1; i++) this.ebullet(e.x, e.y, a + i * .22, 150, e.dm * .8, "#ff5fa8", 5); }
        } else if (e.ty === "brute") {
          if (e.st === 1) { e.wt -= dt; if (e.wt <= 0) { e.st = 2; e.wt = .5; e.cx = dx / d * 300; e.cy = dy / d * 300; } }
          else if (e.st === 2) { e.wt -= dt; this.move(e, e.cx * dt, e.cy * dt, e.r * .8); if (e.wt <= 0) { e.st = 0; e.sh = rand(2, 3.5); } }
          else { this.move(e, dx / d * sp2, dy / d * sp2, e.r * .8); e.sh -= dt; if (e.sh <= 0 && d < 220) { e.st = 1; e.wt = .6; } }
        } else this.move(e, dx / d * sp2, dy / d * sp2, e.r * .8);
        if (d < e.r + 10) { e.ac -= dt; if (e.ac <= 0 || e.boss) { if (this.state === "play" && p.inv <= 0) { this.hurt(e.dm); if (e.aff === "vamp") e.hp = Math.min(e.max, e.hp + e.dm); } e.ac = .8; } }
      }
      // soft separation
      if (nAw < 60) for (let i = 0; i < this.en.length; i++) { const a = this.en[i]; if (!a.aw || a.dead) continue; for (let j = i + 1; j < this.en.length; j++) { const b = this.en[j]; if (!b.aw || b.dead) continue; const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), md = a.r + b.r - 2; if (d < md && d > .01) { const k = (md - d) * .25 / d; if (!a.boss) this.move(a, -dx * k, -dy * k, a.r * .7); if (!b.boss) this.move(b, dx * k, dy * k, b.r * .7); } } }
      this.en = this.en.filter(e => !e.dead);
      for (const b of this.eb) { b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt; if (this.blocked(b.x, b.y, 1)) b.life = 0; else if (Math.hypot(b.x - p.x, b.y - p.y) < b.r + 8) { b.life = 0; this.hurt(b.dm); } }
      this.eb = this.eb.filter(b => b.life > 0);
      // pickups
      for (const o of this.pk) {
        const dx = p.x - o.x, dy = p.y - o.y, d = Math.hypot(dx, dy); o.b += dt * 4;
        if (o.t !== "item" && d < 80) { const k = Math.min(1, 260 * dt / (d || 1)); o.x += dx * k; o.y += dy * k; }
        if (d < 16) {
          if (o.t === "gold") { this.gold += o.v; o.got = true; sfx(900, 1300, .05, "sine", .04); }
          else if (o.t === "pot") { if (p.pots < 9) { p.pots++; o.got = true; sfx(600, 900, .08, "sine", .06); } }
          else if (this.addBag(o.it)) { o.got = true; sfx(600, 900, .1, "triangle", .06); if (o.it.rar >= 2) toast(RAR[o.it.rar].n + ": " + o.it.n); } else if (this.msgT <= 0) { toast("Bag full - open BAG and sell something"); this.msgT = 3; }
        }
      }
      this.pk = this.pk.filter(o => !o.got);
      for (const c of this.chests) if (!c.open && Math.hypot(c.x - p.x, c.y - p.y) < 22) { c.open = true; sfx(500, 1000, .3, "triangle", .1); sparks(this.fx, c.x, c.y, "#ffd15c", 20, 200); this.dropItem(c.x, c.y + 14, this.genItem(1, 1)); this.pk.push({ t: "gold", x: c.x - 10, y: c.y + 12, v: Math.round(rand(8, 20) * (1 + this.floor * .4)), b: 0 }); if (Math.random() < .5) this.pk.push({ t: "pot", x: c.x + 12, y: c.y + 14, b: 0 }); }
      // stairs
      if (Math.hypot(this.stairs.x - p.x, this.stairs.y - p.y) < 26) {
        if (this.bossDead) {
          if (this.floor >= 5) { this.state = "win"; this.t2 = 0; this.endRun(true); sfx(400, 1200, .8, "triangle", .15); }
          else { this.floor++; this.p.hp = Math.min(this.p.max, this.p.hp + this.p.max * .35); this.newFloor(); sfx(300, 600, .3, "triangle", .1); }
        } else if (this.msgT <= 0) { toast("The stairs are sealed. Slay the guardian!"); this.msgT = 3; }
      }
      hudTitle("DUNGEON DELVERS", CLS[this.cls].n + " • Floor " + this.floor + " • Lv " + p.lv);
    },
    boom(s, e) { const R = s.bl || 38; this.ring(s.x, s.y, R, "#9fd8ff"); sparks(this.fx, s.x, s.y, "#9fd8ff", 12, 160); sfx(160, 70, .12, "sawtooth", .05); for (const q of this.en) { if (q.dead || q === e) continue; if (Math.hypot(q.x - s.x, q.y - s.y) < R + q.r) { const [dm, cr] = this.pdmg(s.dm * .6); this.hitEn(q, dm, cr, 60, s.x, s.y); } } },
    /* ----- drawing ----- */
    drawItemCard(it, x, y, w, cmp) {
      const rc = RAR[it.rar].c; text(it.n, x, y, 14, rc, "left", 800); text(RAR[it.rar].n + " " + it.slot + " • ilvl " + it.il, x, y + 16, 11, "#99a", "left", 600); let yy = y + 34;
      for (const q in it.st) { let t = "+" + it.st[q] + " " + STL[q]; let col = "#dfe6ff"; if (cmp) { const df = it.st[q] - (cmp.st[q] || 0); t += "  (" + (df >= 0 ? "+" : "") + df + ")"; col = df > 0 ? "#7dff7d" : df < 0 ? "#ff8a8a" : col; } text(t, x, yy, 12, col, "left", 700); yy += 15; }
      if (cmp) for (const q in cmp.st) if (!(q in it.st)) { text("-" + cmp.st[q] + " " + STL[q] + " (lost)", x, yy, 12, "#ff8a8a", "left", 700); yy += 15; }
    },
    drawIcon(it, r) { rect(r.x, r.y, r.w, r.h, "rgba(20,24,44,.95)", 8); if (it) { const rc = RAR[it.rar].c; strokeRR(r.x, r.y, r.w, r.h, 8, rc, 2); glow(r.x + r.w / 2, r.y + r.h / 2, r.h * .6, rc, .35); text(SLIC[it.slot], r.x + r.w / 2, r.y + r.h / 2 + 8, 22, "#fff", "center"); const eq = this.p.eq[it.slot]; if (eq !== it && this.score(it) > this.score(eq)) text("▲", r.x + r.w - 10, r.y + 14, 11, "#7dff7d", "center", 900); } else strokeRR(r.x, r.y, r.w, r.h, 8, "rgba(255,255,255,.12)", 1); },
    draw() {
      const w = W(), h = H(), t = this.tt; clear("#05060c");
      if (this.state === "class") {
        const g = ctx2d.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#1a1030"); g.addColorStop(1, "#05060c"); ctx2d.fillStyle = g; ctx2d.fillRect(0, 0, w, h);
        text("DUNGEON DELVERS", w / 2, 112, 28, "#ffb347", "center", 900); text("Choose your hero", w / 2, 136, 14, "#aab", "center", 600);
        const R = this.classRects(), ks = Object.keys(CLS);
        R.forEach((r, i) => { const c = CLS[ks[i]]; rect(r.x, r.y, r.w, r.h, "rgba(28,26,52,.95)", 16); strokeRR(r.x, r.y, r.w, r.h, 16, c.c, 2); glow(r.x + 50, r.y + 59, 50, c.c, .3); text(c.ic, r.x + 50, r.y + 72, 44, "#fff", "center"); text(c.n, r.x + 100, r.y + 32, 20, c.c, "left", 900); text(c.d.slice(0, 40), r.x + 100, r.y + 54, 11, "#c8cce0", "left", 600); text(c.d.slice(40).trim(), r.x + 100, r.y + 68, 11, "#c8cce0", "left", 600); text("HP " + c.hp + " • Skill: " + c.sk, r.x + 100, r.y + 96, 12, "#fff", "left", 800); });
        text("Best floor: " + this.best.floor + (this.best.win ? "  (cleared!)" : ""), w / 2, h - 130, 14, "#ffd15c", "center", 800); text("Joystick move • A attack • B skill • C potion", w / 2, h - 150, 11, "#889", "center", 600); return;
      }
      const p = this.p, T = this.TS, th = THEME[Math.min(this.floor - 1, 4)];
      ctx2d.save(); if (this.shake > .3) ctx2d.translate((Math.random() - .5) * this.shake, (Math.random() - .5) * this.shake);
      const cx = Math.floor(p.x - w / 2), cy = Math.floor(p.y - h / 2); const X = x => x - cx, Y = y => y - cy;
      const x0 = Math.max(0, Math.floor(cx / T)), x1 = Math.min(this.MW - 1, Math.floor((cx + w) / T)), y0 = Math.max(0, Math.floor(cy / T)), y1 = Math.min(this.MH - 1, Math.floor((cy + h) / T));
      const MW = this.MW, g = this.g;
      for (let ty = y0; ty <= y1; ty++)for (let tx = x0; tx <= x1; tx++) {
        const i = ty * MW + tx, sx = tx * T - cx, sy = ty * T - cy;
        if (g[i]) { const hs = (tx * 7 + ty * 13) % 5; rect(sx, sy, T, T, th.f[hs & 1], 0); if (hs === 3) { rect(sx + 6, sy + 9, 8, 1, "rgba(0,0,0,.25)", 0); rect(sx + 14, sy + 10, 1, 7, "rgba(0,0,0,.2)", 0); } if (!g[i - MW]) rect(sx, sy, T, 6, "rgba(0,0,0,.35)", 0); }
        else { const below = ty + 1 < this.MH && g[i + MW]; const near = below || (tx > 0 && g[i - 1]) || (tx < MW - 1 && g[i + 1]) || (ty > 0 && g[i - MW]);
          if (below) { rect(sx, sy, T, T, th.w, 0); rect(sx, sy + T / 2, T, 1, "rgba(0,0,0,.35)", 0); rect(sx + ((ty & 1) ? 8 : 20), sy, 1, T / 2, "rgba(0,0,0,.3)", 0); rect(sx + ((ty & 1) ? 22 : 10), sy + T / 2, 1, T / 2, "rgba(0,0,0,.3)", 0); rect(sx, sy, T, 3, "rgba(255,255,255,.12)", 0); }
          else if (near) rect(sx, sy, T, T, th.t, 0); }
      }
      // stairs
      { const sx = X(this.stairs.x), sy = Y(this.stairs.y); rect(sx - 16, sy - 16, 32, 32, "#0a0a14", 6); for (let k = 0; k < 4; k++) rect(sx - 14 + k * 2, sy - 14 + k * 7, 28 - k * 4, 5, this.bossDead ? "hsl(" + (50 + k * 8) + ",80%," + (60 - k * 8) + "%)" : "#444", 2); if (this.bossDead) glow(sx, sy, 40 + Math.sin(t * 4) * 6, "#ffd15c", .5); else text("🔒", sx, sy + 8, 18, "#fff", "center"); }
      for (const c of this.chests) { const sx = X(c.x), sy = Y(c.y); if (sx < -30 || sx > w + 30 || sy < -30 || sy > h + 30) continue; if (!c.open) glow(sx, sy, 24, "#ffd15c", .3); rect(sx - 11, sy - 7, 22, 15, c.open ? "#6b4a2a" : "#b07a38", 3); rect(sx - 11, sy - 7, 22, 6, c.open ? "#4b3320" : "#d09a4a", 3); rect(sx - 2, sy - 3, 4, 6, c.open ? "#222" : "#ffd15c", 1); }
      for (const o of this.pk) {
        const sx = X(o.x), sy = Y(o.y) + Math.sin(o.b) * 2; if (sx < -30 || sx > w + 30 || sy < -30 || sy > h + 30) continue;
        if (o.t === "gold") { glow(sx, sy, 10, "#ffd15c", .5); circle(sx, sy, 4, "#ffd15c"); circle(sx - 1, sy - 1, 1.5, "#fff6c0"); }
        else if (o.t === "pot") { glow(sx, sy, 12, "#ff5577", .5); text("🧪", sx, sy + 5, 14, "#fff", "center"); }
        else { const rc = RAR[o.it.rar].c; ctx2d.save(); ctx2d.globalCompositeOperation = "lighter"; ctx2d.globalAlpha = .35 + o.it.rar * .08; ctx2d.fillStyle = rc; ctx2d.fillRect(sx - 3, sy - 40, 6, 40); ctx2d.restore(); glow(sx, sy, 20, rc, .6); text(SLIC[o.it.slot], sx, sy + 6, 16, "#fff", "center"); if (Math.hypot(o.x - p.x, o.y - p.y) < 110) text(o.it.n, sx, sy - 16, 11, rc, "center", 800); }
      }
      for (const s of this.sl) { const a = clamp(s.life / s.max, 0, 1); ctx2d.globalAlpha = a;
        if (s.t === "ring") strokeCircle(X(s.x), Y(s.y), s.r * (1.1 - a * .5), s.c, 4);
        else if (s.t === "slash") { ctx2d.strokeStyle = "#fff"; ctx2d.lineWidth = 6 * a + 2; ctx2d.beginPath(); ctx2d.arc(X(s.x), Y(s.y), s.r * .85, s.a - s.ha, s.a + s.ha); ctx2d.stroke(); ctx2d.strokeStyle = "#ffb060"; ctx2d.lineWidth = 3; ctx2d.beginPath(); ctx2d.arc(X(s.x), Y(s.y), s.r * .7, s.a - s.ha * .9, s.a + s.ha * .9); ctx2d.stroke(); }
        else if (s.t === "spin") { ctx2d.strokeStyle = "#ffb060"; ctx2d.lineWidth = 8 * a + 2; ctx2d.beginPath(); ctx2d.arc(X(s.x), Y(s.y), 60, (1 - a) * 12, (1 - a) * 12 + 4.5); ctx2d.stroke(); }
        else if (s.t === "nova") { glow(X(s.x), Y(s.y), 130 * (1.2 - a * .4), "#9fd8ff", a * .5); }
        ctx2d.globalAlpha = 1; }
      // enemies
      for (const e of this.en) {
        if (e.dead) continue; const ex = X(e.x), ey = Y(e.y); if (ex < -60 || ex > w + 60 || ey < -60 || ey > h + 60) continue; this.drawEn(e, ex, ey, t);
      }
      for (const b of this.eb) { glow(X(b.x), Y(b.y), b.r * 3, b.c, .5); circle(X(b.x), Y(b.y), b.r, b.c); circle(X(b.x), Y(b.y), b.r * .45, "#fff"); }
      for (const s of this.pr) { const sx = X(s.x), sy = Y(s.y); if (s.ty === "arrow") { line(sx, sy, sx - Math.cos(s.a) * 14, sy - Math.sin(s.a) * 14, "#e8e0c8", 2); circle(sx, sy, 2, "#fff"); } else { glow(sx, sy, 16, "#7ab8ff", .8); circle(sx, sy, 5, "#cfe8ff"); } }
      this.drawPlayer(X(p.x), Y(p.y), t);
      drawFx(this.fx, X, Y); drawPops(this.pops, X, Y);
      // darkness
      { const px = X(p.x), py = Y(p.y), fl = 1 + Math.sin(t * 9) * .02; const gr = ctx2d.createRadialGradient(px, py, 70 * fl, px, py, Math.max(w, h) * .62); gr.addColorStop(0, "rgba(0,0,6,0)"); gr.addColorStop(.4, "rgba(0,0,6,.5)"); gr.addColorStop(1, "rgba(0,0,6,.93)"); ctx2d.fillStyle = gr; ctx2d.fillRect(-10, -10, w + 20, h + 20); }
      ctx2d.restore();
      this.drawHud(w, h);
      if (this.state === "inv") this.drawInv(w, h);
      if (this.state === "perk") { ctx2d.fillStyle = "rgba(3,5,14,.82)"; ctx2d.fillRect(0, 0, w, h); text("LEVEL " + p.lv + "!", w / 2, h / 2 - 168, 28, "#ffd15c", "center", 900); text("Choose a skill", w / 2, h / 2 - 148, 13, "#aab", "center", 600);
        const L = this.cardRects(); this.cards.forEach((c, i) => { const r = L[i]; rect(r.x, r.y, r.w, r.h, "rgba(30,36,64,.95)", 16); strokeRR(r.x, r.y, r.w, r.h, 16, c.cl ? "rgba(255,209,92,.8)" : "rgba(85,230,255,.5)", 2); text(c.ic, r.x + 34, r.y + 55, 34, "#fff", "center"); text(c.n + (p.pk[c.id] ? "  (Lv " + (p.pk[c.id] + 1) + ")" : ""), r.x + 66, r.y + 36, 17, "#fff", "left", 800); text(c.d, r.x + 66, r.y + 62, 13, "#b8c2e0", "left", 600); }); }
      if (this.state === "over" || this.state === "win") {
        const win = this.state === "win"; ctx2d.fillStyle = "rgba(3,4,12," + clamp(this.t2 * 1.5, 0, .8) + ")"; ctx2d.fillRect(0, 0, w, h);
        if (this.t2 > .4) { text(win ? "DUNGEON CONQUERED" : "YOU HAVE FALLEN", w / 2, h * .3, 28, win ? "#ffd15c" : "#ff4f6a", "center", 900); text("Floor " + this.floor + " • Level " + p.lv + " • " + this.kills + " kills", w / 2, h * .3 + 38, 16, "#fff", "center", 700); text("Gold " + this.gold + "   Score " + this.score, w / 2, h * .3 + 64, 18, "#ffd15c", "center", 900); text(this.newBest ? "NEW BEST!" : "Best floor " + this.best.floor, w / 2, h * .3 + 90, 14, this.newBest ? "#ffd15c" : "#aab", "center", 800); if (this.t2 > .8) text("TAP TO START A NEW RUN", w / 2, h * .3 + 130, 16, "#55e6ff", "center", 900); }
      }
    },
    drawHud(w, h) {
      const p = this.p, c = CLS[this.cls], hf = clamp(p.hp / p.max, 0, 1);
      rect(12, 78, 150, 14, "rgba(0,0,0,.55)", 6); rect(12, 78, 150 * hf, 14, hf > .5 ? "#4fd06a" : hf > .25 ? "#ffb04a" : "#ff4f6a", 6); text(Math.ceil(p.hp) + "/" + p.max, 87, 89, 10, "#fff", "center", 800);
      rect(12, 96, 150, 6, "rgba(255,255,255,.12)", 3); rect(12, 96, 150 * clamp(p.xp / p.need, 0, 1), 6, "#55b4ff", 3); text("LV " + p.lv, 168, 102, 11, "#9ad8ff", "left", 800);
      const L = this.lay(); btn(L.bag, "🎒 BAG", "rgba(60,70,120,.85)", 12); btn(L.pot, "🧪 x" + p.pots, "rgba(120,40,70,.85)", 12);
      text("B: " + c.sk + (p.skcd > 0 ? " " + p.skcd.toFixed(1) + "s" : " READY"), 12, 160, 11, p.skcd > 0 ? "#889" : "#ffd15c", "left", 800);
      text("💰 " + this.gold + "   ☠ " + this.kills, 12, 176, 11, "#ffd15c", "left", 800);
      // minimap
      const mw = this.MW * 1.5, mx = w - mw - 8, my = 78; rect(mx - 2, my - 2, mw + 4, this.MH * 1.5 + 4, "rgba(0,0,0,.55)", 4); ctx2d.save(); ctx2d.imageSmoothingEnabled = false; ctx2d.drawImage(this.mm, mx, my, mw, this.MH * 1.5); ctx2d.restore();
      circle(mx + p.x / this.TS * 1.5, my + p.y / this.TS * 1.5, 2.5, "#55e6ff"); if (this.ex[Math.floor(this.stairs.y / this.TS) * this.MW + Math.floor(this.stairs.x / this.TS)]) circle(mx + this.stairs.x / this.TS * 1.5, my + this.stairs.y / this.TS * 1.5, 2.5, "#ffd15c");
      if (this.boss && !this.boss.dead && this.boss.aw) { const bf = clamp(this.boss.hp / this.boss.max, 0, 1); rect(w / 2 - 110, h - 128, 220, 10, "rgba(0,0,0,.6)", 5); rect(w / 2 - 110, h - 128, 220 * bf, 10, BOSS[this.boss.bi].c, 5); text(BOSS[this.boss.bi].n, w / 2, h - 134, 12, "#fff", "center", 800); }
      if (this.banner) { ctx2d.globalAlpha = clamp(this.banner.t, 0, 1); text(this.banner.txt, w / 2, h * .3, 26, "#ffd15c", "center", 900); if (this.banner.sub) text(this.banner.sub, w / 2, h * .3 + 24, 14, "#fff", "center", 700); ctx2d.globalAlpha = 1; }
      if (this.flash > 0) { ctx2d.fillStyle = "rgba(255,255,255," + this.flash * .2 + ")"; ctx2d.fillRect(0, 0, w, h); }
      if (p.hp < p.max * .3 && this.state === "play") { ctx2d.fillStyle = "rgba(255,0,40," + (.08 + Math.sin(this.tt * 6) * .04) + ")"; ctx2d.fillRect(0, 0, w, h); }
      if (this.tt < 7 && this.state === "play" && this.floor === 1) text("Joystick move • A attack • B skill • C potion", w / 2, h - 150, 13, "rgba(255,255,255," + clamp(2 - this.tt / 3.5, 0, .85) + ")", "center", 700);
    },
    drawInv(w, h) {
      const L = this.lay(), p = this.p; ctx2d.fillStyle = "rgba(4,5,14,.93)"; ctx2d.fillRect(0, 76, w, h - 76 - 100);
      text("INVENTORY", L.x0, 104, 20, "#ffd15c", "left", 900); btn(L.close, "✕", "rgba(150,50,60,.9)", 16); const s = p.s;
      text("DMG " + Math.round(s.dmg * s.dm) + "  HP " + p.max + "  ARM " + Math.round(s.arm) + "  CRIT " + Math.round(s.crit) + "%  SPD " + Math.round(s.spd) + "%  LEECH " + Math.round(s.leech) + "%", L.x0, 132, 10, "#c8cce0", "left", 700);
      L.eq.forEach(r => this.drawIcon(p.eq[r.s], r)); text("Equipped", L.x0, 146, 10, "#778", "left", 700);
      L.cell.forEach((r, i) => this.drawIcon(p.bag[i], r)); text("Bag " + p.bag.length + "/12", L.x0, 244, 10, "#778", "left", 700);
      const sl = this.sel, it = this.getSel(); if (sl) { const r = sl.eq ? L.eq[SLOTS.indexOf(sl.eq)] : L.cell[sl.bag]; strokeRR(r.x - 2, r.y - 2, r.w + 4, r.h + 4, 9, "#fff", 2); }
      if (it) { this.drawItemCard(it, L.x0, L.dy + 14, L.cw, sl.bag !== undefined ? p.eq[it.slot] : null); btn(L.act1, sl.eq ? "UNEQUIP" : "EQUIP", "rgba(50,130,80,.95)", 14); btn(L.act2, "SELL", "rgba(150,110,30,.95)", 14); }
      else text("Tap an item to inspect it", L.x0, L.dy + 30, 13, "#778", "left", 600);
      btn(L.buy, "Buy potion (40g) — you have " + this.gold + "g, " + p.pots + " potions", "rgba(100,40,80,.9)", 12);
    },
    drawPlayer(px, py, t) {
      const p = this.p, c = CLS[this.cls]; if (this.state === "over") return; if (p.inv > 0 && Math.floor(t * 20) % 2 === 0) return;
      ctx2d.save(); ctx2d.fillStyle = "rgba(0,0,0,.35)"; ctx2d.beginPath(); ctx2d.ellipse(px, py + 10, 11, 5, 0, 0, 6.283); ctx2d.fill(); ctx2d.restore();
      glow(px, py, 30, c.c, .22); const bob = Math.sin(p.step) * 1.5;
      const g = ctx2d.createRadialGradient(px - 3, py - 6 + bob, 1, px, py + bob, 12); g.addColorStop(0, "#fff"); g.addColorStop(.35, c.c); g.addColorStop(1, "#1a1a2a"); ctx2d.fillStyle = g; ctx2d.beginPath(); ctx2d.arc(px, py + bob, 11, 0, 6.283); ctx2d.fill();
      circle(px + Math.cos(p.face) * 4, py + bob - 3 + Math.sin(p.face) * 2, 3.5, "#ffe0c0");
      ctx2d.save(); ctx2d.translate(px, py + bob); ctx2d.rotate(p.face); const sw = p.cd > 0 ? (p.cd / CLS[this.cls].cd) : 0;
      if (this.cls === "warrior") { ctx2d.rotate(-sw * 1.2); rect(8, -2, 16, 4, "#dfe6f0", 1); rect(6, -5, 3, 10, "#a06a30", 1); }
      else if (this.cls === "ranger") { ctx2d.strokeStyle = "#a06a30"; ctx2d.lineWidth = 2.5; ctx2d.beginPath(); ctx2d.arc(12, 0, 10, -1.2, 1.2); ctx2d.stroke(); line(15, -8.5, 15, 8.5, "#ddd", 1); }
      else { rect(6, -1.5, 18, 3, "#7a4a2a", 1); circle(25, 0, 4, "#9fd8ff"); glow(0, 0, 0, "#fff", 0); }
      ctx2d.restore(); if (this.cls === "mage") glow(px + Math.cos(p.face) * 25, py + bob + Math.sin(p.face) * 25, 12, "#7ab8ff", .6);
    },
    drawEn(e, ex, ey, t) {
      const r = e.r, hf = e.hf > 0, col = e.fz > 0 ? "#9fd8ff" : hf ? "#fff" : e.c;
      ctx2d.save(); ctx2d.fillStyle = "rgba(0,0,0,.3)"; ctx2d.beginPath(); ctx2d.ellipse(ex, ey + r * .8, r, r * .4, 0, 0, 6.283); ctx2d.fill(); ctx2d.restore();
      if (e.el) { const ec = { swift: "#6bd9ff", brutal: "#ff6b4a", vamp: "#ff4fa0", volatile: "#ffb030" }[e.aff]; glow(ex, ey, r * 2.6, ec, .45 + Math.sin(t * 5) * .1); strokeCircle(ex, ey, r + 4, ec, 2); }
      const wob = Math.sin(t * 8 + e.id) * 1.2;
      if (e.boss) {
        const bc = e.enr ? "#ff4a4a" : col; glow(ex, ey, r * 2.8, e.c, .5);
        const g = ctx2d.createRadialGradient(ex - 8, ey - 10, 2, ex, ey, r + 4); g.addColorStop(0, "#fff"); g.addColorStop(.4, bc); g.addColorStop(1, "#14101c"); ctx2d.fillStyle = g; ctx2d.beginPath();
        for (let k = 0; k < 10; k++) { const a = k / 10 * 6.283 + t * .4, rr = r * (k % 2 ? .82 : 1.12); ctx2d.lineTo(ex + Math.cos(a) * rr, ey + Math.sin(a) * rr); } ctx2d.closePath(); ctx2d.fill();
        circle(ex - 9, ey - 4, 4.5, "#220"); circle(ex + 9, ey - 4, 4.5, "#220"); circle(ex - 9, ey - 4, 2, "#ff4040"); circle(ex + 9, ey - 4, 2, "#ff4040"); rect(ex - 10, ey + 8, 20, 4, "#220", 2);
        if (e.st === 1) { ctx2d.globalAlpha = .5; strokeCircle(ex, ey, r + 10, "#ff3030", 3); ctx2d.globalAlpha = 1; }
      } else if (e.ty === "slime") { ctx2d.fillStyle = col; ctx2d.beginPath(); ctx2d.ellipse(ex, ey + 2, r * (1 + wob * .05), r * (.8 - wob * .04), 0, Math.PI, 0); ctx2d.lineTo(ex + r, ey + r * .6); ctx2d.lineTo(ex - r, ey + r * .6); ctx2d.fill(); circle(ex - r * .35, ey - r * .1, r * .16, "#122"); circle(ex + r * .35, ey - r * .1, r * .16, "#122"); circle(ex - r * .3, ey - r * .5, r * .18, "rgba(255,255,255,.5)"); }
      else if (e.ty === "bat") { const fl = Math.sin(t * 22 + e.id) * .6; ctx2d.fillStyle = col; ctx2d.beginPath(); ctx2d.moveTo(ex, ey); ctx2d.lineTo(ex - r * 2, ey - r * (.4 + fl)); ctx2d.lineTo(ex - r * 1.2, ey + r * .6); ctx2d.closePath(); ctx2d.fill(); ctx2d.beginPath(); ctx2d.moveTo(ex, ey); ctx2d.lineTo(ex + r * 2, ey - r * (.4 + fl)); ctx2d.lineTo(ex + r * 1.2, ey + r * .6); ctx2d.closePath(); ctx2d.fill(); circle(ex, ey, r * .8, hf ? "#fff" : "#40286a"); circle(ex - 2, ey - 1, 1.3, "#ff5050"); circle(ex + 2, ey - 1, 1.3, "#ff5050"); }
      else if (e.ty === "skel") { circle(ex, ey - 2, r, col); rect(ex - r * .6, ey + r * .4, r * 1.2, r * .6, col, 2); circle(ex - 3.5, ey - 3, 2.4, "#111"); circle(ex + 3.5, ey - 3, 2.4, "#111"); rect(ex - 3, ey + 3, 6, 2, "#111", 0); rect(ex + 8, ey - 2, 2, 12, "#9aa", 0); }
      else if (e.ty === "archer") { polygon([[ex, ey - r * 1.2], [ex + r, ey + r], [ex - r, ey + r]], hf ? "#fff" : "#7a5a30"); circle(ex, ey - 3, r * .55, col); ctx2d.strokeStyle = "#a06a30"; ctx2d.lineWidth = 2; ctx2d.beginPath(); ctx2d.arc(ex + 9, ey, 8, -1.3, 1.3); ctx2d.stroke(); }
      else if (e.ty === "cult") { polygon([[ex, ey - r * 1.3], [ex + r * 1.1, ey + r], [ex - r * 1.1, ey + r]], hf ? "#fff" : "#5a1840"); circle(ex, ey - 2, 3, "#ff5fa8"); glow(ex, ey - 2, 10, "#ff5fa8", .6); }
      else if (e.ty === "brute") { const g = ctx2d.createRadialGradient(ex - 4, ey - 5, 1, ex, ey, r + 2); g.addColorStop(0, "#fff"); g.addColorStop(.4, col); g.addColorStop(1, "#2a1010"); ctx2d.fillStyle = g; ctx2d.beginPath(); ctx2d.arc(ex, ey, r, 0, 6.283); ctx2d.fill(); polygon([[ex - r, ey - r * .6], [ex - r * 1.3, ey - r * 1.4], [ex - r * .3, ey - r * .9]], "#eee"); polygon([[ex + r, ey - r * .6], [ex + r * 1.3, ey - r * 1.4], [ex + r * .3, ey - r * .9]], "#eee"); circle(ex - 5, ey - 2, 2.5, "#ff3030"); circle(ex + 5, ey - 2, 2.5, "#ff3030"); if (e.st === 1) { strokeCircle(ex, ey, r + 6, "#ff3030", 3); } }
      if (e.fz > 0) { ctx2d.globalAlpha = .4; circle(ex, ey, r + 2, "#bfe8ff"); ctx2d.globalAlpha = 1; }
      if (e.hp < e.max || e.boss === undefined && e.el) { rect(ex - r, ey - r - 9, r * 2, 3, "rgba(0,0,0,.6)", 0); rect(ex - r, ey - r - 9, r * 2 * clamp(e.hp / e.max, 0, 1), 3, e.el ? "#ffd15c" : "#ff5a5a", 0); }
      if (e.el) text({ swift: "Swift", brutal: "Brutal", vamp: "Vampiric", volatile: "Volatile" }[e.aff] + " " + EN[e.ty].n, ex, ey - r - 13, 10, "#ffd15c", "center", 800);
    }
  };
  return {
    engines: {},
    minis: [],
    aaa: [{ id: "dungeon", icon: "⚔️", title: "Dungeon Delvers", tag: "AAA • ROGUELIKE", desc: "Pick a hero, delve a procedural dungeon, loot gear, unlock perks and slay the guardian of each floor.", mod: DD }]
  };
})();
