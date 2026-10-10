// Agent new_19: space trade and economy minigames (original names, original text).
window.__AG_new_19 = (function () {
  /* ---------- shared helpers ---------- */
  function n19Bg(a, b) {
    var gr = ctx2d.createLinearGradient(0, 0, 0, H());
    gr.addColorStop(0, a); gr.addColorStop(1, b);
    ctx2d.fillStyle = gr; ctx2d.fillRect(0, 0, W(), H());
  }
  function n19Stars(n) {
    var a = [];
    for (var i = 0; i < n; i++) a.push({ x: rand(0, W()), y: rand(0, H()), s: rand(0.4, 1.8), v: rand(3, 26) });
    return a;
  }
  function n19DrawStars(st, dt, k) {
    for (var i = 0; i < st.length; i++) {
      var s = st[i];
      s.y += s.v * dt * (k || 1);
      if (s.y > H()) { s.y -= H(); s.x = rand(0, W()); }
      circle(s.x, s.y, s.s, 'rgba(190,215,255,' + (0.25 + s.s * 0.2).toFixed(2) + ')');
    }
  }
  function n19Glow(c, b) { ctx2d.shadowColor = c; ctx2d.shadowBlur = b; }
  function n19NoGlow() { ctx2d.shadowBlur = 0; }
  function n19Planet(x, y, r, c1, c2) {
    var gr = ctx2d.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
    gr.addColorStop(0, c1); gr.addColorStop(1, c2);
    ctx2d.fillStyle = gr; ctx2d.beginPath(); ctx2d.arc(x, y, r, 0, Math.PI * 2); ctx2d.fill();
  }
  function n19Ship(x, y, ang, col, sc) {
    ctx2d.save(); ctx2d.translate(x, y); ctx2d.rotate(ang); ctx2d.scale(sc || 1, sc || 1);
    ctx2d.fillStyle = col; ctx2d.beginPath();
    ctx2d.moveTo(14, 0); ctx2d.lineTo(-10, 9); ctx2d.lineTo(-5, 0); ctx2d.lineTo(-10, -9);
    ctx2d.closePath(); ctx2d.fill();
    ctx2d.restore();
  }
  function n19Bar(x, y, w, h, f, col) {
    rect(x, y, w, h, 'rgba(255,255,255,0.12)');
    rect(x, y, w * clamp(f, 0, 1), h, col);
  }
  function n19Norm() { return (Math.random() + Math.random() + Math.random() - 1.5) * 1.4; }
  function n19Fx(list, dt) { fxUpdate(list, dt, 0); }
  function n19Num(v) { return String(Math.round(v)); }

  /* ---------- 1. Port Arbitrage (buy low, sell high) ---------- */
  function gPortArb(g) {
    var t = 0, cash = 120, cargo = [], profit = 0, px = W() / 2, py = H() / 2, vx = 0, vy = 0;
    var fx = [], st = n19Stars(50), hitCd = 0, pirA = 0, pox = 0, poy = 0, shake = 0, msg = '', msgT = 0;
    var PORTS = [
      { name: 'Helix Dock', fx: 0.24, fy: 0.3, base: 44, ph: 0.0, f: 0.55, col: C.cyan },
      { name: 'Vesta Hub', fx: 0.76, fy: 0.36, base: 58, ph: 1.9, f: 0.8, col: C.pink },
      { name: 'Oru Gate', fx: 0.26, fy: 0.64, base: 36, ph: 3.1, f: 0.4, col: C.lime },
      { name: 'Tamsin Port', fx: 0.74, fy: 0.72, base: 50, ph: 4.4, f: 0.66, col: C.gold }
    ];
    function price(p) {
      return Math.max(6, Math.round(p.base + 18 * Math.sin(t * p.f + p.ph) + 5 * Math.sin(t * p.f * 3.1)));
    }
    function docked() {
      for (var i = 0; i < PORTS.length; i++) {
        var p = PORTS[i];
        if (dist(px, py, p.fx * W(), p.fy * H()) < 42) return p;
      }
      return null;
    }
    function say(s) { msg = s; msgT = 1.4; }
    return {
      update(dt) {
        t += dt; hitCd -= dt; msgT -= dt; shake = Math.max(0, shake - dt * 30);
        vx += (AX() * 240 - vx) * Math.min(1, dt * 6);
        vy += (AY() * 240 - vy) * Math.min(1, dt * 6);
        px = clamp(px + vx * dt, 24, W() - 24);
        py = clamp(py + vy * dt, 130, H() - 130);
        pirA += dt * 0.7;
        pox = W() / 2 + Math.cos(pirA) * W() * 0.32;
        poy = H() / 2 + Math.sin(pirA * 1.4) * H() * 0.2;
        if (hitCd <= 0 && dist(px, py, pox, poy) < 26) {
          hitCd = 1.5;
          var lost = Math.ceil(cargo.length / 2);
          cargo.splice(0, lost);
          shake = 12;
          fxBurst(fx, px, py, C.red, 26, 240);
          say(lost > 0 ? 'Pirate raid: ' + lost + ' crates lost' : 'Pirate raid: hold was empty');
        }
        var ba = pressed('a'), bb = pressed('b');
        var d = docked();
        if (d) {
          var pr = price(d);
          if (ba) {
            if (cargo.length >= 6) say('Hold full (6/6)');
            else if (cash < pr) say('Not enough credits for ' + pr);
            else { cash -= pr; cargo.push(pr); fxBurst(fx, px, py, C.cyan, 12, 140); say('Bought at ' + pr); }
          }
          if (bb) {
            if (!cargo.length) say('Nothing to sell');
            else {
              var cost = cargo.shift();
              cash += pr;
              profit = Math.max(0, profit + (pr - cost));
              fxBurst(fx, px, py, pr >= cost ? C.gold : C.orange, 16, 180);
              say((pr >= cost ? 'Sold for profit ' : 'Sold at a loss ') + Math.abs(pr - cost));
            }
          }
        }
        fxUpdate(fx, dt, 0);
        hud('Profit ' + n19Num(profit) + '/' + g.goal + ' · Cash ' + n19Num(cash) + ' · Hold ' + cargo.length + '/6');
        if (profit >= g.goal) { completeMini(); return; }
        if (cash < 5 && cargo.length === 0) miniFail(g, 'Bankrupt: no credits and an empty hold');
      },
      draw() {
        n19Bg('#071029', '#02030a');
        n19DrawStars(st, 0, 1);
        if (shake > 0) { ctx2d.save(); ctx2d.translate(rand(-shake, shake), rand(-shake, shake)); }
        for (var i = 0; i < PORTS.length; i++) {
          var p = PORTS[i], x = p.fx * W(), y = p.fy * H(), pr = price(p), d = docked();
          var on = d === p;
          n19Glow(p.col, on ? 26 : 12);
          strokeCircle(x, y, on ? 34 : 28, p.col, on ? 3 : 2);
          n19NoGlow();
          n19Planet(x, y, 22, '#dfe9ff', p.col);
          text(p.name, x, y - 42, 13, '#e8f0ff', 'center', 700);
          text('Ore ' + pr + 'c', x, y + 48, 14, on ? C.gold : p.col, 'center', 800);
        }
        // pirate
        n19Glow(C.red, 18);
        circle(pox, poy, 18, 'rgba(255,85,112,0.25)');
        polygon([[pox, poy - 14], [pox + 13, poy + 10], [pox - 13, poy + 10]], C.red);
        n19NoGlow();
        // player
        var ang = Math.atan2(vy, vx) || 0;
        n19Glow(C.cyan, 16);
        n19Ship(px, py, vx || vy ? ang : -Math.PI / 2, C.white, 1.3);
        n19NoGlow();
        for (var k = 0; k < cargo.length; k++) rect(px - 26 + (k % 3) * 9, py + 18 + Math.floor(k / 3) * 9, 6, 6, C.gold);
        fxDraw(fx);
        if (shake > 0) ctx2d.restore();
        rect(16, 92, W() - 32, 34, 'rgba(6,10,24,0.75)');
        text('Cash ' + n19Num(cash) + '   Hold ' + cargo.length + '/6   Profit ' + n19Num(profit) + '/' + g.goal, W() / 2, 114, 15, C.white, 'center', 800);
        if (msgT > 0) text(msg, W() / 2, 150, 14, C.gold, 'center', 700);
        text('Dock at a port: A buys, B sells', W() / 2, H() - 150, 13, 'rgba(200,220,255,0.7)', 'center', 600);
      },
      stop() {}
    };
  }

  /* ---------- 2. Belt Miner (mine, haul, deliver) ---------- */
  function gBeltMiner(g) {
    var sx = W() / 2, sy = H() * 0.6, vx = 0, vy = 0, cargo = 0, CAP = 12, delivered = 0, hull = 3;
    var ast = [], drones = [], fx = [], st = n19Stars(60), spawnT = 0.4, droneT = 5, beamCd = 0, beamTo = null;
    var boost = 0, boostCd = 0, shake = 0, t = 0, lastBeam = null, beamLife = 0, msg = '', msgT = 0;
    function station() { return { x: W() / 2, y: H() - 215 }; }
    function spawnAst() {
      var r = rand(14, 30);
      ast.push({ x: rand(30, W() - 30), y: -40, vy: rand(26, 58), r: r, hp: Math.ceil(r / 11), ore: randi(2, 4), rot: rand(0, 6), vr: rand(-1, 1) });
    }
    return {
      update(dt) {
        t += dt; beamCd -= dt; boost -= dt; boostCd -= dt; beamLife -= dt; msgT -= dt; shake = Math.max(0, shake - dt * 30);
        var sp = boost > 0 ? 300 : 190;
        vx += (AX() * sp - vx) * Math.min(1, dt * 7);
        vy += (AY() * sp - vy) * Math.min(1, dt * 7);
        sx = clamp(sx + vx * dt, 20, W() - 20);
        sy = clamp(sy + vy * dt, 115, H() - 150);
        if (pressed('a') && boostCd <= 0) { boost = 1.2; boostCd = 4; fxBurst(fx, sx, sy, C.orange, 18, 200); }
        // spawns
        spawnT -= dt;
        if (spawnT <= 0) { spawnAst(); spawnT = Math.max(0.5, 1.1 - delivered * 0.02) * rand(0.7, 1.2); }
        droneT -= dt;
        if (droneT <= 0) { drones.push({ x: rand(40, W() - 40), y: -20, hp: 1 }); droneT = Math.max(3, 6 - delivered * 0.1); }
        // move asteroids and drones
        for (var i = ast.length - 1; i >= 0; i--) {
          var a = ast[i];
          a.y += a.vy * dt; a.rot += a.vr * dt;
          if (a.y - a.r > H() + 20) { ast.splice(i, 1); continue; }
          if (dist(a.x, a.y, sx, sy) < a.r + 10) {
            ast.splice(i, 1); hull--; shake = 10; fxBurst(fx, sx, sy, C.red, 22, 220); msg = 'Rock impact'; msgT = 1.2;
          }
        }
        for (var j = drones.length - 1; j >= 0; j--) {
          var dr = drones[j], ang = Math.atan2(sy - dr.y, sx - dr.x);
          dr.x += Math.cos(ang) * 55 * dt; dr.y += Math.sin(ang) * 55 * dt;
          if (dist(dr.x, dr.y, sx, sy) < 18) {
            drones.splice(j, 1); hull--; shake = 14; fxBurst(fx, sx, sy, C.pink, 24, 240); msg = 'Drone hit'; msgT = 1.2;
          }
        }
        // beam: nearest target within range
        var best = null, bd = 185;
        for (var k = 0; k < ast.length; k++) { var dd = dist(sx, sy, ast[k].x, ast[k].y); if (dd < bd) { bd = dd; best = { list: ast, o: ast[k] }; } }
        for (var m = 0; m < drones.length; m++) { var dq = dist(sx, sy, drones[m].x, drones[m].y); if (dq < bd) { bd = dq; best = { list: drones, o: drones[m] }; } }
        if (best && beamCd <= 0) {
          beamCd = 0.28;
          lastBeam = { x: best.o.x, y: best.o.y }; beamLife = 0.12;
          var dmg = boost > 0 ? 2 : 1;
          if (best.list === drones) {
            drones.splice(drones.indexOf(best.o), 1);
            fxBurst(fx, best.o.x, best.o.y, C.pink, 14, 160);
          } else {
            best.o.hp -= dmg;
            fxBurst(fx, best.o.x, best.o.y, C.gold, 5, 90);
            if (best.o.hp <= 0) {
              ast.splice(ast.indexOf(best.o), 1);
              var space = CAP - cargo, got = Math.min(space, best.o.ore);
              cargo += got;
              fxBurst(fx, best.o.x, best.o.y, C.lime, 20, 180);
              if (got < best.o.ore) { msg = 'Hold full, ore lost'; msgT = 1.2; }
            }
          }
        }
        // deliver at station
        var s = station();
        if (cargo > 0 && dist(sx, sy, s.x, s.y) < 56) {
          delivered += cargo; fxBurst(fx, s.x, s.y, C.gold, 26, 220); cargo = 0; msg = 'Ore delivered'; msgT = 1.2;
        }
        fxUpdate(fx, dt, 0);
        hud('Ore ' + delivered + '/' + g.goal + ' · Hold ' + cargo + '/' + CAP + ' · Hull ' + Math.max(0, hull));
        if (delivered >= g.goal) { completeMini(); return; }
        if (hull <= 0) miniFail(g, 'Hull breached');
      },
      draw() {
        n19Bg('#0a0a1c', '#020208');
        n19DrawStars(st, 1 / 60, 1.5);
        if (shake > 0) { ctx2d.save(); ctx2d.translate(rand(-shake, shake) * 0.5, rand(-shake, shake) * 0.5); }
        var s = station();
        n19Glow(C.gold, 22); strokeCircle(s.x, s.y, 46, C.gold, 3); n19NoGlow();
        n19Planet(s.x, s.y, 30, '#fff4cc', '#8a6a1c');
        text('DEPOT', s.x, s.y + 62, 13, C.gold, 'center', 800);
        for (var i = 0; i < ast.length; i++) {
          var a = ast[i];
          ctx2d.save(); ctx2d.translate(a.x, a.y); ctx2d.rotate(a.rot);
          ctx2d.fillStyle = '#5b5f73'; ctx2d.beginPath();
          ctx2d.moveTo(a.r, 0); ctx2d.lineTo(a.r * 0.4, a.r * 0.8); ctx2d.lineTo(-a.r * 0.7, a.r * 0.6);
          ctx2d.lineTo(-a.r, -a.r * 0.2); ctx2d.lineTo(-a.r * 0.3, -a.r * 0.9); ctx2d.closePath(); ctx2d.fill();
          ctx2d.restore();
          if (a.hp > 1) text(String(a.hp), a.x, a.y + 4, 12, '#fff', 'center', 800);
        }
        for (var j = 0; j < drones.length; j++) {
          var dr = drones[j];
          n19Glow(C.pink, 14); circle(dr.x, dr.y, 11, C.pink); n19NoGlow();
          strokeCircle(dr.x, dr.y, 16, 'rgba(255,79,216,0.5)', 2);
        }
        if (beamLife > 0 && lastBeam) {
          n19Glow(C.cyan, 12); line(sx, sy, lastBeam.x, lastBeam.y, C.cyan, boost > 0 ? 4 : 2); n19NoGlow();
        }
        n19Glow(C.orange, boost > 0 ? 24 : 10);
        n19Ship(sx, sy, vx || vy ? Math.atan2(vy, vx) : -Math.PI / 2, '#eef6ff', 1.3);
        n19NoGlow();
        for (var k = 0; k < cargo; k++) rect(sx - 15 + (k % 6) * 5, sy + 16 + Math.floor(k / 6) * 5, 3, 3, C.lime);
        fxDraw(fx);
        if (shake > 0) ctx2d.restore();
        rect(16, 92, W() - 32, 34, 'rgba(6,10,24,0.75)');
        text('Ore ' + delivered + '/' + g.goal + '   Hold ' + cargo + '/' + CAP, 26, 114, 15, C.white, 'left', 800);
        for (var h = 0; h < 3; h++) circle(W() - 30 - h * 20, 109, 6, h < hull ? C.red : 'rgba(255,255,255,0.15)');
        if (msgT > 0) text(msg, W() / 2, 150, 14, C.gold, 'center', 700);
        text('A: afterburn (beam fires on its own)', W() / 2, H() - 150, 13, 'rgba(200,220,255,0.7)', 'center', 600);
      },
      stop() {}
    };
  }

  /* ---------- 3. Lane Charter (route planning on a lane map) ---------- */
  function gLaneCharter(g) {
    var nodes = [], adj = [], route = [], budget = 0, spent = 0, s = 0, target = 0, delivered = 0, pending = null, msg = '', msgT = 0, t = 0, fx = [];
    function enterCost(j) { return 1 + nodes[j].danger * 2; }
    function link(a, b) {
      if (a === b || adj[a].indexOf(b) >= 0) return;
      adj[a].push(b); adj[b].push(a);
    }
    function bfsComp() {
      var seen = [0], q = [0];
      while (q.length) { var c = q.shift(); for (var i = 0; i < adj[c].length; i++) { var nb = adj[c][i]; if (seen.indexOf(nb) < 0) { seen.push(nb); q.push(nb); } } }
      return seen;
    }
    function makeMap() {
      nodes = []; adj = []; var tries = 0;
      while (nodes.length < 12 && tries < 500) {
        tries++;
        var x = rand(40, W() - 40), y = rand(150, H() - 200), ok = true;
        for (var i = 0; i < nodes.length; i++) if (dist(x, y, nodes[i].x, nodes[i].y) < 80) { ok = false; break; }
        if (ok) nodes.push({ x: x, y: y, danger: Math.random() < 0.3 ? 1 : 0 });
      }
      for (var k = 0; k < nodes.length; k++) adj.push([]);
      for (var a = 0; a < nodes.length; a++) {
        var order = [];
        for (var b = 0; b < nodes.length; b++) if (b !== a) order.push({ b: b, d: dist(nodes[a].x, nodes[a].y, nodes[b].x, nodes[b].y) });
        order.sort(function (p, q) { return p.d - q.d; });
        for (var o = 0; o < Math.min(3, order.length); o++) link(a, order[o].b);
      }
      // join components with the shortest bridge until everything is reachable
      var guard = 0;
      while (bfsComp().length < nodes.length && guard++ < 50) {
        var seen = bfsComp(), bestA = 0, bestB = 0, bd = 1e9;
        for (var p = 0; p < nodes.length; p++) {
          if (seen.indexOf(p) < 0) continue;
          for (var r = 0; r < nodes.length; r++) {
            if (seen.indexOf(r) >= 0) continue;
            var dd = dist(nodes[p].x, nodes[p].y, nodes[r].x, nodes[r].y);
            if (dd < bd) { bd = dd; bestA = p; bestB = r; }
          }
        }
        link(bestA, bestB);
      }
    }
    function costsFrom(src) {
      var cost = [], done = [];
      for (var i = 0; i < nodes.length; i++) { cost.push(1e9); done.push(false); }
      cost[src] = 0;
      for (var n = 0; n < nodes.length; n++) {
        var u = -1;
        for (var j = 0; j < nodes.length; j++) if (!done[j] && (u < 0 || cost[j] < cost[u])) u = j;
        if (u < 0 || cost[u] >= 1e9) break;
        done[u] = true;
        for (var k = 0; k < adj[u].length; k++) {
          var v = adj[u][k], nc = cost[u] + enterCost(v);
          if (nc < cost[v]) cost[v] = nc;
        }
      }
      return cost;
    }
    function canReach(cur, used, left) {
      if (cur === target) return true;
      for (var i = 0; i < adj[cur].length; i++) {
        var nb = adj[cur][i];
        if (used[nb]) continue;
        var c = enterCost(nb);
        if (c > left) continue;
        used[nb] = true;
        var ok = canReach(nb, used, left - c);
        used[nb] = false;
        if (ok) return true;
      }
      return false;
    }
    function newRound() {
      makeMap();
      s = randi(0, nodes.length - 1);
      var cost = costsFrom(s), cands = [];
      for (var i = 0; i < nodes.length; i++) if (i !== s && cost[i] >= 3 && cost[i] < 1e9) cands.push(i);
      if (!cands.length) { for (var j = 0; j < nodes.length; j++) if (j !== s && cost[j] < 1e9) cands.push(j); }
      target = pick(cands);
      budget = cost[target] + 1;
      route = [s]; spent = 0;
    }
    function say(m) { msg = m; msgT = 1.3; }
    newRound();
    return {
      update(dt) {
        t += dt; msgT -= dt;
        fxUpdate(fx, dt, 0);
        if (pending) { miniFail(g, pending); return; }
        hud('Deliveries ' + delivered + '/' + g.goal + ' · Fuel ' + (budget - spent) + ' left');
        if (delivered >= g.goal) completeMini();
      },
      pointer(x, y) {
        if (pending) return;
        var j = -1, bd = 30;
        for (var i = 0; i < nodes.length; i++) { var d = dist(x, y, nodes[i].x, nodes[i].y); if (d < bd) { bd = d; j = i; } }
        if (j < 0) return;
        var last = route[route.length - 1];
        if (j === last) return;
        if (route.length > 1 && j === route[route.length - 2]) {
          spent -= enterCost(last); route.pop(); say('Route step undone');
          return;
        }
        if (route.indexOf(j) >= 0) { say('Already visited'); return; }
        if (adj[last].indexOf(j) < 0) { say('No lane to that system'); return; }
        var c = enterCost(j);
        if (spent + c > budget) { say('Not enough fuel for that jump'); return; }
        route.push(j); spent += c;
        fxBurst(fx, nodes[j].x, nodes[j].y, nodes[j].danger ? C.red : C.cyan, 12, 120);
        if (j === target) {
          delivered++; say('Cargo delivered');
          fxBurst(fx, nodes[j].x, nodes[j].y, C.gold, 30, 220);
          if (delivered < g.goal) newRound();
          return;
        }
        var used = []; for (var u = 0; u < nodes.length; u++) used.push(route.indexOf(u) >= 0);
        if (!canReach(j, used, budget - spent)) pending = 'Stranded: not enough fuel to reach the target';
      },
      draw() {
        n19Bg('#060a18', '#02030a');
        var i, k;
        for (i = 0; i < nodes.length; i++) for (k = 0; k < adj[i].length; k++) {
          var b = adj[i][k]; if (b < i) continue;
          line(nodes[i].x, nodes[i].y, nodes[b].x, nodes[b].y, 'rgba(120,160,255,0.28)', 2);
        }
        for (i = 0; i + 1 < route.length; i++) {
          var A = nodes[route[i]], B = nodes[route[i + 1]];
          n19Glow(C.cyan, 12); line(A.x, A.y, B.x, B.y, C.cyan, 4); n19NoGlow();
        }
        var tg = nodes[target];
        strokeCircle(tg.x, tg.y, 22 + Math.sin(t * 4) * 3, C.gold, 3);
        for (i = 0; i < nodes.length; i++) {
          var n = nodes[i], col = n.danger ? C.red : '#8fb4ff';
          if (n.danger) { n19Glow(C.red, 14); strokeCircle(n.x, n.y, 18, 'rgba(255,85,112,0.6)', 2); n19NoGlow(); }
          circle(n.x, n.y, 12, '#0b1430'); strokeCircle(n.x, n.y, 12, col, 2);
          if (i === s) text('S', n.x, n.y + 5, 13, C.white, 'center', 800);
          if (i === target) text('T', n.x, n.y + 5, 13, C.gold, 'center', 800);
          if (n.danger) text(i === target ? '' : '+2 fuel', n.x, n.y - 18, 11, C.red, 'center', 800);
        }
        fxDraw(fx);
        rect(16, 92, W() - 32, 34, 'rgba(6,10,24,0.75)');
        text('Fuel left ' + (budget - spent) + ' of ' + budget + '   Delivered ' + delivered + '/' + g.goal, W() / 2, 114, 15, C.white, 'center', 800);
        text('Tap neighbouring systems in order. Red = pirate space costs 3.', W() / 2, H() - 150, 12, 'rgba(200,220,255,0.7)', 'center', 600);
        if (msgT > 0) text(msg, W() / 2, 150, 14, C.gold, 'center', 700);
      },
      stop() {}
    };
  }

  /* ---------- 4. Ticker Tape (long and short the price tape) ---------- */
  function gTicker(g) {
    var hist = [100], tickT = 0, trend = 0, pos = 0, entry = 0, realized = 0, fx = [], msg = '', msgT = 0, t = 0;
    function say(m) { msg = m; msgT = 1.2; }
    function last() { return hist[hist.length - 1]; }
    return {
      update(dt) {
        t += dt; msgT -= dt;
        tickT -= dt;
        while (tickT <= 0) {
          tickT += 0.22;
          trend = clamp(trend * 0.97 + rand(-0.35, 0.35), -1.5, 1.5);
          var p = last() + trend * 0.5 + n19Norm() + (100 - last()) * 0.02;
          hist.push(clamp(p, 30, 200));
          if (hist.length > 140) hist.shift();
        }
        var p0 = last();
        if (pressed('a')) {
          if (pos === 0) { pos = 1; entry = p0; say('Long at ' + Math.round(p0)); }
          else if (pos === -1) { realized += entry - p0; pos = 0; say('Short closed'); }
          else { realized += p0 - entry; pos = 0; say('Long closed'); }
          fxBurst(fx, W() - 40, 200, C.gold, 14, 120);
        }
        if (pressed('b')) {
          if (pos === 0) { pos = -1; entry = p0; say('Short at ' + Math.round(p0)); }
          else if (pos === 1) { realized += p0 - entry; pos = 0; say('Long closed'); }
          else { realized += entry - p0; pos = 0; say('Short closed'); }
          fxBurst(fx, W() - 40, 200, C.pink, 14, 120);
        }
        fxUpdate(fx, dt, 0);
        var unreal = pos * (p0 - entry);
        var prof = Math.max(0, Math.round(realized));
        hud('Profit ' + prof + '/' + g.goal + ' · Open ' + n19Num(unreal));
        if (prof >= g.goal) { completeMini(); return; }
        if (realized < -80) miniFail(g, 'Margin call: losses reached 80');
      },
      draw() {
        n19Bg('#060b18', '#02040c');
        var x0 = 20, x1 = W() - 20, y0 = 150, y1 = H() - 200;
        rect(x0, y0, x1 - x0, y1 - y0, 'rgba(12,20,40,0.7)');
        var lo = 1e9, hi = -1e9, i;
        for (i = 0; i < hist.length; i++) { lo = Math.min(lo, hist[i]); hi = Math.max(hi, hist[i]); }
        lo -= 4; hi += 4;
        var yOf = function (v) { return y1 - (v - lo) / (hi - lo) * (y1 - y0 - 20) - 10; };
        ctx2d.strokeStyle = 'rgba(120,160,255,0.12)'; ctx2d.lineWidth = 1;
        for (i = 1; i < 5; i++) line(x0, y0 + i * (y1 - y0) / 5, x1, y0 + i * (y1 - y0) / 5, 'rgba(120,160,255,0.12)', 1);
        var n = hist.length, step = (x1 - x0) / 139;
        ctx2d.beginPath();
        for (i = 0; i < n; i++) {
          var px = x1 - (n - 1 - i) * step, py = yOf(hist[i]);
          if (i === 0) ctx2d.moveTo(px, py); else ctx2d.lineTo(px, py);
        }
        var gr = ctx2d.createLinearGradient(0, y0, 0, y1);
        gr.addColorStop(0, 'rgba(85,230,255,0.25)'); gr.addColorStop(1, 'rgba(85,230,255,0)');
        ctx2d.lineTo(x1, y1); ctx2d.lineTo(x1 - (n - 1) * step, y1); ctx2d.fillStyle = gr; ctx2d.fill();
        n19Glow(C.cyan, 10);
        ctx2d.beginPath();
        for (i = 0; i < n; i++) {
          var qx = x1 - (n - 1 - i) * step, qy = yOf(hist[i]);
          if (i === 0) ctx2d.moveTo(qx, qy); else ctx2d.lineTo(qx, qy);
        }
        ctx2d.strokeStyle = C.cyan; ctx2d.lineWidth = 2.5; ctx2d.stroke();
        n19NoGlow();
        if (pos !== 0) {
          var ey = yOf(entry);
          ctx2d.setLineDash([6, 5]); line(x0, ey, x1, ey, pos > 0 ? C.lime : C.pink, 1.5); ctx2d.setLineDash([]);
        }
        var cy = yOf(last());
        circle(x1, cy, 5, C.white);
        text(n19Num(last()), x1 - 6, cy - 10, 13, C.white, 'right', 800);
        var posName = pos === 1 ? 'LONG' : pos === -1 ? 'SHORT' : 'FLAT';
        var pcol = pos === 1 ? C.lime : pos === -1 ? C.pink : '#9fb3d9';
        rect(16, 92, W() - 32, 34, 'rgba(6,10,24,0.75)');
        text('Position ' + posName + '   Profit ' + Math.max(0, Math.round(realized)) + '/' + g.goal, W() / 2, 114, 15, pcol, 'center', 800);
        fxDraw(fx);
        if (msgT > 0) text(msg, W() / 2, 150 + 14, 14, C.gold, 'center', 700);
        text('A: go long / close long    B: go short / close short', W() / 2, H() - 150, 12, 'rgba(200,220,255,0.7)', 'center', 600);
      },
      stop() {}
    };
  }

  /* ---------- 5. Gravity Courier (fly crates between wells) ---------- */
  function gGravCourier(g) {
    var planets = [], pickup = null, dock = null, sx = 0, sy = 0, svx = 0, svy = 0, fuel = 100, carry = false;
    var hull = 3, delivered = 0, fx = [], trail = [], shake = 0, msg = '', msgT = 0, st = n19Stars(40);
    function freeSpot() {
      for (var k = 0; k < 200; k++) {
        var x = rand(40, W() - 40), y = rand(150, H() - 200);
        var ok = true;
        for (var i = 0; i < planets.length; i++) if (dist(x, y, planets[i].x, planets[i].y) < planets[i].r + 40) { ok = false; break; }
        if (ok) return { x: x, y: y };
      }
      return { x: W() / 2, y: H() / 2 };
    }
    function layout() {
      planets = [];
      var tries = 0;
      while (planets.length < 3 && tries++ < 300) {
        var r = rand(28, 46), x = rand(r + 30, W() - r - 30), y = rand(170, H() - 230 - r), ok = true;
        for (var i = 0; i < planets.length; i++) if (dist(x, y, planets[i].x, planets[i].y) < r + planets[i].r + 90) { ok = false; break; }
        if (ok) planets.push({ x: x, y: y, r: r, gm: rand(1.6e6, 2.8e6) });
      }
      pickup = freeSpot();
      dock = freeSpot();
      for (var q = 0; q < 20 && dist(pickup.x, pickup.y, dock.x, dock.y) < 200; q++) dock = freeSpot();
    }
    function resetShip() { sx = dock.x; sy = dock.y; svx = 0; svy = 0; trail = []; }
    layout(); resetShip();
    function say(m) { msg = m; msgT = 1.3; }
    return {
      update(dt) {
        msgT -= dt; shake = Math.max(0, shake - dt * 30);
        var ax = AX() * 180, ay = AY() * 180;
        if (fuel <= 0) { ax = 0; ay = 0; }
        var thr = Math.hypot(ax, ay);
        fuel = Math.max(0, fuel - thr * dt * 0.02);
        var gx = 0, gy = 0;
        for (var i = 0; i < planets.length; i++) {
          var p = planets[i], dx = p.x - sx, dy = p.y - sy, d2 = dx * dx + dy * dy + 900;
          var acc = Math.min(420, p.gm / d2), d = Math.sqrt(d2);
          gx += dx / d * acc; gy += dy / d * acc;
        }
        svx += (ax + gx) * dt; svy += (ay + gy) * dt;
        svx *= (1 - 0.02 * dt); svy *= (1 - 0.02 * dt);
        var sp = Math.hypot(svx, svy);
        if (sp > 420) { svx *= 420 / sp; svy *= 420 / sp; }
        sx += svx * dt; sy += svy * dt;
        // planet collisions
        for (var j = 0; j < planets.length; j++) {
          var q = planets[j], ddx = sx - q.x, ddy = sy - q.y, dd = Math.hypot(ddx, ddy), rr = q.r + 8;
          if (dd < rr && dd > 0.001) {
            var nx = ddx / dd, ny = ddy / dd;
            sx = q.x + nx * rr; sy = q.y + ny * rr;
            var vn = svx * nx + svy * ny;
            if (vn < 0) {
              if (-vn > 110) { hull--; shake = 14; fxBurst(fx, sx, sy, C.red, 24, 220); say('Hull hit by planet'); }
              svx -= 1.6 * vn * nx; svy -= 1.6 * vn * ny;
            }
          }
        }
        if (sx < 10 || sx > W() - 10) { svx *= -0.5; sx = clamp(sx, 10, W() - 10); }
        if (sy < 110 || sy > H() - 130) { svy *= -0.5; sy = clamp(sy, 110, H() - 130); }
        trail.push({ x: sx, y: sy }); if (trail.length > 22) trail.shift();
        // pads
        var spd = Math.hypot(svx, svy);
        if (dist(sx, sy, pickup.x, pickup.y) < 28 && !carry) {
          if (spd < 90) { carry = true; say('Crate loaded, fly to the dock'); fxBurst(fx, sx, sy, C.lime, 20, 160); }
          else { svx *= -0.3; svy *= -0.3; say('Too fast to land'); }
        }
        if (dist(sx, sy, dock.x, dock.y) < 28) {
          if (carry && spd < 90) {
            carry = false; delivered++; fuel = 100;
            fxBurst(fx, sx, sy, C.gold, 34, 260); say('Delivered. Fuel restored');
            layout(); resetShip();
          } else if (carry) { svx *= -0.3; svy *= -0.3; say('Too fast to dock'); }
          else if (spd < 60) fuel = Math.min(100, fuel + 30 * dt);
        }
        fxUpdate(fx, dt, 0);
        hud('Deliveries ' + delivered + '/' + g.goal + ' · Fuel ' + Math.round(fuel) + '% · Hull ' + Math.max(0, hull));
        if (delivered >= g.goal) { completeMini(); return; }
        if (hull <= 0) miniFail(g, 'Hull breached by planetary impacts');
      },
      draw() {
        n19Bg('#050a1c', '#010206');
        n19DrawStars(st, 1 / 60, 0.6);
        if (shake > 0) { ctx2d.save(); ctx2d.translate(rand(-shake, shake) * 0.5, rand(-shake, shake) * 0.5); }
        for (var i = 0; i < planets.length; i++) {
          var p = planets[i];
          n19Glow('rgba(120,90,255,0.8)', 26); circle(p.x, p.y, p.r + 10, 'rgba(120,90,255,0.10)'); n19NoGlow();
          n19Planet(p.x, p.y, p.r, '#8fa9ff', '#1b1f4a');
        }
        var pulse = 0.5 + 0.5 * Math.sin(Date.now() / 200);
        n19Glow(C.lime, 14); strokeCircle(pickup.x, pickup.y, 22 + pulse * 3, carry ? 'rgba(168,255,92,0.3)' : C.lime, 3); n19NoGlow();
        text('LOAD', pickup.x, pickup.y + 40, 12, C.lime, 'center', 800);
        n19Glow(C.cyan, 14); strokeCircle(dock.x, dock.y, 22 + pulse * 3, carry ? C.cyan : 'rgba(85,230,255,0.3)', 3); n19NoGlow();
        text('DOCK', dock.x, dock.y + 40, 12, C.cyan, 'center', 800);
        for (var k = 0; k < trail.length; k++) circle(trail[k].x, trail[k].y, 1 + k * 0.1, 'rgba(255,220,140,' + (k / trail.length * 0.5).toFixed(2) + ')');
        var ang = Math.hypot(svx, svy) > 5 ? Math.atan2(svy, svx) : -Math.PI / 2;
        n19Glow(C.white, 12);
        n19Ship(sx, sy, ang, '#f2f7ff', 1.2);
        n19NoGlow();
        if (carry) rect(sx - 6, sy + 10, 12, 10, C.gold);
        fxDraw(fx);
        if (shake > 0) ctx2d.restore();
        rect(16, 92, W() - 32, 34, 'rgba(6,10,24,0.75)');
        n19Bar(28, 118, 140, 6, fuel / 100, fuel > 25 ? C.cyan : C.red);
        text('Deliveries ' + delivered + '/' + g.goal, W() - 26, 114, 15, C.white, 'right', 800);
        for (var h = 0; h < 3; h++) circle(W() - 200 + h * 0 + h * 18, 113, 6, h < hull ? C.red : 'rgba(255,255,255,0.15)');
        if (msgT > 0) text(msg, W() / 2, 150, 14, C.gold, 'center', 700);
        text('Thrust with the joystick. Land softly on pads.', W() / 2, H() - 150, 12, 'rgba(200,220,255,0.7)', 'center', 600);
      },
      stop() {}
    };
  }

  /* ---------- 6. Convoy Guard (turret defends freighters) ---------- */
  function gConvoyGuard(g) {
    var fr = [], pir = [], shots = [], fx = [], st = n19Stars(45);
    var tAim = -Math.PI / 2, fireCd = 0, shieldCd = 0, shieldFx = 0, lost = 0, delivered = 0, kills = 0;
    var spawnT = 1, pirT = 2, t = 0, msg = '', msgT = 0, shake = 0;
    function wave() { return 1 + Math.floor(delivered / 4); }
    function lanes() { return [H() * 0.27, H() * 0.4, H() * 0.53]; }
    function say(m) { msg = m; msgT = 1.4; }
    function turret() { return { x: W() / 2, y: H() - 175 }; }
    return {
      update(dt) {
        t += dt; fireCd -= dt; shieldCd -= dt; shieldFx -= dt; msgT -= dt; shake = Math.max(0, shake - dt * 30);
        var ys = lanes();
        // convoy
        spawnT -= dt;
        if (spawnT <= 0 && fr.length < 7) {
          var lane = ys[randi(0, 2)], clash = false;
          for (var c = 0; c < fr.length; c++) if (Math.abs(fr[c].y - lane) < 4 && fr[c].x < 40) clash = true;
          if (!clash) fr.push({ x: -60, y: lane, hp: 3, spd: rand(26, 34) + wave() * 2, flash: 0 });
          spawnT = Math.max(3.2, 6.5 - wave() * 0.4);
        }
        for (var f = fr.length - 1; f >= 0; f--) {
          var fs = fr[f];
          fs.x += fs.spd * dt; fs.flash -= dt;
          if (fs.x > W() + 60) { fr.splice(f, 1); delivered++; say('Freighter docked safely'); fxBurst(fx, W() - 20, fs.y, C.gold, 20, 150); }
        }
        // pirates
        pirT -= dt;
        if (pirT <= 0) {
          var ph = { x: rand(30, W() - 30), y: 84, hp: (wave() >= 4 && Math.random() < 0.3) ? 2 : 1, tgt: fr.length ? pick(fr) : null };
          pir.push(ph);
          pirT = Math.max(1.1, 3 - wave() * 0.2) * rand(0.8, 1.2);
        }
        for (var p = pir.length - 1; p >= 0; p--) {
          var pp = pir[p];
          if (pp.tgt && fr.indexOf(pp.tgt) < 0) pp.tgt = fr.length ? pick(fr) : null;
          var tx = pp.tgt ? pp.tgt.x : pp.x, ty = pp.tgt ? pp.tgt.y : H();
          var ang = Math.atan2(ty - pp.y, tx - pp.x), sp = 70 + wave() * 8;
          pp.x += Math.cos(ang) * sp * dt; pp.y += Math.sin(ang) * sp * dt;
          pp.ang = ang;
          if (pp.tgt && dist(pp.x, pp.y, pp.tgt.x, pp.tgt.y) < 26) {
            pp.tgt.hp -= 1; pp.tgt.flash = 0.25; shake = 8;
            fxBurst(fx, pp.x, pp.y, C.red, 22, 200);
            pir.splice(p, 1);
            if (pp.tgt.hp <= 0) {
              var idx = fr.indexOf(pp.tgt); if (idx >= 0) fr.splice(idx, 1);
              lost++; say('Freighter lost!'); fxBurst(fx, pp.x, pp.y, C.orange, 50, 300);
            }
            continue;
          }
          if (pp.y > H() + 40) pir.splice(p, 1);
        }
        // aim with joystick (upwards only), fire with A, pulse shield with B
        var ax = AX(), ay = AY();
        if (ax * ax + ay * ay > 0.15 && ay < -0.2) tAim = Math.atan2(ay, ax);
        var tp = turret();
        if (pressed('a') && fireCd <= 0) {
          fireCd = 0.28;
          shots.push({ x: tp.x + Math.cos(tAim) * 34, y: tp.y + Math.sin(tAim) * 34, vx: Math.cos(tAim) * 620, vy: Math.sin(tAim) * 620, life: 1.4 });
        }
        if (pressed('b') && shieldCd <= 0) {
          shieldCd = 9; shieldFx = 0.6; shake = 10;
          var killed = 0;
          for (var q = pir.length - 1; q >= 0; q--) if (dist(pir[q].x, pir[q].y, tp.x, tp.y) < 150) { pir.splice(q, 1); killed++; }
          kills += killed; fxBurst(fx, tp.x, tp.y, C.cyan, 40, 340);
          say(killed ? 'Pulse destroyed ' + killed : 'Pulse found no targets');
        }
        for (var s = shots.length - 1; s >= 0; s--) {
          var sh = shots[s];
          sh.x += sh.vx * dt; sh.y += sh.vy * dt; sh.life -= dt;
          var hit = false;
          for (var k = pir.length - 1; k >= 0; k--) {
            if (dist(sh.x, sh.y, pir[k].x, pir[k].y) < 16) {
              pir[k].hp -= 1; hit = true;
              if (pir[k].hp <= 0) { fxBurst(fx, pir[k].x, pir[k].y, C.orange, 22, 220); pir.splice(k, 1); kills++; }
              break;
            }
          }
          if (hit || sh.life <= 0 || sh.y < 60) shots.splice(s, 1);
        }
        fxUpdate(fx, dt, 0);
        hud('Delivered ' + delivered + '/' + g.goal + ' · Lost ' + lost + '/3 · Wave ' + wave());
        if (delivered >= g.goal) { completeMini(); return; }
        if (lost >= 3) miniFail(g, 'Three freighters were lost');
      },
      pointer() {},
      draw() {
        n19Bg('#050818', '#010206');
        n19DrawStars(st, 1 / 60, 0.8);
        if (shake > 0) { ctx2d.save(); ctx2d.translate(rand(-shake, shake) * 0.4, rand(-shake, shake) * 0.4); }
        var ys = lanes(), i;
        for (i = 0; i < ys.length; i++) line(0, ys[i], W(), ys[i], 'rgba(85,230,255,0.10)', 1);
        for (i = 0; i < fr.length; i++) {
          var fs = fr[i], col = fs.flash > 0 ? C.red : '#b8c7e6';
          n19Glow(C.cyan, 12); rect(fs.x - 34, fs.y - 12, 68, 24, '#2a3550'); n19NoGlow();
          rect(fs.x - 34, fs.y - 12, 50, 24, col);
          polygon([[fs.x + 16, fs.y - 12], [fs.x + 34, fs.y], [fs.x + 16, fs.y + 12]], '#9fb0d4');
          n19Glow(C.orange, 14); circle(fs.x - 36, fs.y, 5, C.orange); n19NoGlow();
          for (var h = 0; h < 3; h++) circle(fs.x - 22 + h * 10, fs.y - 20, 3.5, h < fs.hp ? C.lime : 'rgba(255,255,255,0.15)');
        }
        for (i = 0; i < pir.length; i++) {
          var pp = pir[i];
          ctx2d.save(); ctx2d.translate(pp.x, pp.y); ctx2d.rotate((pp.ang || 0) + Math.PI / 2);
          n19Glow(C.red, 12);
          polygon([[0, -14], [11, 10], [-11, 10]], pp.hp > 1 ? C.purple : C.red);
          n19NoGlow(); ctx2d.restore();
        }
        var tp = turret();
        circle(tp.x, tp.y, 24, '#18223f'); strokeCircle(tp.x, tp.y, 24, C.cyan, 2);
        line(tp.x, tp.y, tp.x + Math.cos(tAim) * 34, tp.y + Math.sin(tAim) * 34, C.white, 6);
        circle(tp.x, tp.y, 10, C.cyan);
        for (i = 0; i < shots.length; i++) { n19Glow(C.gold, 10); circle(shots[i].x, shots[i].y, 3.5, C.gold); n19NoGlow(); }
        if (shieldFx > 0) strokeCircle(tp.x, tp.y, 150 * (1 - shieldFx / 0.6) + 20, 'rgba(85,230,255,' + clamp(shieldFx / 0.6, 0, 1).toFixed(2) + ')', 4);
        fxDraw(fx);
        if (shake > 0) ctx2d.restore();
        rect(16, 92, W() - 32, 34, 'rgba(6,10,24,0.75)');
        text('Delivered ' + delivered + '/' + g.goal + '   Lost ' + lost + '/3   Kills ' + kills, W() / 2, 114, 15, C.white, 'center', 800);
        text(shieldCd > 0 ? 'Pulse ' + Math.ceil(shieldCd) + 's' : 'Pulse ready', W() - 22, H() - 150, 12, shieldCd > 0 ? '#9fb3d9' : C.cyan, 'right', 700);
        if (msgT > 0) text(msg, W() / 2, 150, 14, C.gold, 'center', 700);
        text('Aim with the joystick, A fires, B pulses', W() / 2, H() - 150, 12, 'rgba(200,220,255,0.7)', 'center', 600);
      },
      stop() {}
    };
  }

  /* ---------- 7. Station Grid (build an income station, survive meteor strikes) ---------- */
  function gStationGrid(g) {
    var COLS = 5, ROWS = 6, CELL = 64;
    var TYPES = [
      { n: 'Dock', L: 'D', cost: 30, base: 0, col: C.cyan },
      { n: 'Refinery', L: 'R', cost: 40, base: 3, col: C.orange },
      { n: 'Habitat', L: 'H', cost: 25, base: 2, col: C.lime },
      { n: 'Solar', L: 'S', cost: 20, base: 1, col: C.gold }
    ];
    var grid = [], cx = 2, cy = 2, typeSel = 1, credits = 60, earned = 0, timeLeft = 150, strikeT = 10, moveT = 0;
    var fx = [], msg = '', msgT = 0, t = 0;
    for (var i = 0; i < COLS * ROWS; i++) grid.push({ type: -1, warn: 0 });
    function gx0() { return (W() - COLS * CELL) / 2; }
    function gy0() { return 150; }
    function at(c, r) { return (c < 0 || r < 0 || c >= COLS || r >= ROWS) ? null : grid[r * COLS + c]; }
    function adj(c, r, type) {
      var n = 0, d = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      for (var k = 0; k < 4; k++) { var cl = at(c + d[k][0], r + d[k][1]); if (cl && cl.type === type) n++; }
      return n;
    }
    function income() {
      var sum = 0;
      for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) {
        var cell = at(c, r);
        if (cell.type < 0 || cell.warn > 0 || TYPES[cell.type].base === 0) continue;
        var rate = TYPES[cell.type].base * (1 + 0.5 * adj(c, r, 0));
        if (cell.type === 1) rate += adj(c, r, 3) * 1.5;
        sum += rate;
      }
      return sum;
    }
    function say(m) { msg = m; msgT = 1.3; }
    function place(c, r) {
      var cell = at(c, r);
      if (!cell) return;
      if (cell.warn > 0) {
        if (credits >= 15) { credits -= 15; cell.warn = 0; say('Reinforced, strike blocked'); fxBurst(fx, gx0() + c * CELL + CELL / 2, gy0() + r * CELL + CELL / 2, C.cyan, 24, 200); }
        else say('Need 15 credits to reinforce');
        return;
      }
      if (cell.type >= 0) { say('Cell already built'); return; }
      var T = TYPES[typeSel];
      if (credits < T.cost) { say('Need ' + T.cost + ' credits for ' + T.n); return; }
      credits -= T.cost; cell.type = typeSel;
      fxBurst(fx, gx0() + c * CELL + CELL / 2, gy0() + r * CELL + CELL / 2, T.col, 20, 180);
    }
    return {
      update(dt) {
        t += dt; msgT -= dt; timeLeft -= dt;
        if (timeLeft <= 0) { miniFail(g, 'Time is up with ' + Math.floor(earned) + ' earned'); return; }
        var inc = income();
        earned += inc * dt; credits += inc * dt;
        strikeT -= dt;
        if (strikeT <= 0) {
          strikeT = Math.max(5, 11 - earned / 150) * rand(0.8, 1.2);
          var cand = [];
          for (var i = 0; i < grid.length; i++) if (grid[i].type >= 0 && grid[i].warn <= 0) cand.push(i);
          if (cand.length) { grid[pick(cand)].warn = 3; say('Meteor warning: reinforce the marked cell'); }
        }
        for (var k = 0; k < grid.length; k++) {
          var cl = grid[k];
          if (cl.warn > 0) {
            cl.warn -= dt;
            if (cl.warn <= 0) {
              cl.warn = 0; cl.type = -1;
              fxBurst(fx, gx0() + (k % COLS) * CELL + CELL / 2, gy0() + Math.floor(k / COLS) * CELL + CELL / 2, C.red, 36, 260);
              say('Module destroyed by meteor');
            }
          }
        }
        moveT -= dt;
        var ax = AX(), ay = AY();
        if (moveT <= 0 && (Math.abs(ax) > 0.45 || Math.abs(ay) > 0.45)) {
          if (Math.abs(ax) > Math.abs(ay)) cx = clamp(cx + (ax > 0 ? 1 : -1), 0, COLS - 1);
          else cy = clamp(cy + (ay > 0 ? 1 : -1), 0, ROWS - 1);
          moveT = 0.16;
        }
        if (pressed('a')) place(cx, cy);
        if (pressed('b')) typeSel = (typeSel + 1) % TYPES.length;
        fxUpdate(fx, dt, 0);
        hud('Earned ' + Math.floor(earned) + '/' + g.goal + ' · ' + Math.ceil(timeLeft) + 's left');
        if (earned >= g.goal) completeMini();
      },
      pointer(x, y) {
        var c = Math.floor((x - gx0()) / CELL), r = Math.floor((y - gy0()) / CELL);
        if (c >= 0 && r >= 0 && c < COLS && r < ROWS) { cx = c; cy = r; place(c, r); return; }
        var palY = gy0() + ROWS * CELL + 26;
        if (y > palY - 20 && y < palY + 30 && x > 20 && x < W() - 20) {
          typeSel = clamp(Math.floor((x - 20) / ((W() - 40) / TYPES.length)), 0, TYPES.length - 1);
        }
      },
      draw() {
        n19Bg('#060b1a', '#02030a');
        var c, r, x0 = gx0(), y0 = gy0();
        for (r = 0; r < ROWS; r++) for (c = 0; c < COLS; c++) {
          var cell = at(c, r), X = x0 + c * CELL, Y = y0 + r * CELL;
          rect(X + 2, Y + 2, CELL - 4, CELL - 4, 'rgba(60,90,150,0.18)');
          if (cell.type >= 0) {
            var T = TYPES[cell.type];
            n19Glow(T.col, 10);
            rect(X + 8, Y + 8, CELL - 16, CELL - 16, T.col);
            n19NoGlow();
            text(T.L, X + CELL / 2, Y + CELL / 2 + 6, 18, '#06101f', 'center', 900);
          }
          if (cell.warn > 0) {
            var blink = Math.floor(t * 6) % 2 === 0;
            strokeCircle(X + CELL / 2, Y + CELL / 2, 30, blink ? C.red : 'rgba(255,85,112,0.4)', 3);
            text(String(Math.ceil(cell.warn)), X + CELL / 2, Y + CELL / 2 + 6, 16, C.red, 'center', 900);
          }
        }
        var cursorX = x0 + cx * CELL, cursorY = y0 + cy * CELL;
        ctx2d.strokeStyle = C.white; ctx2d.lineWidth = 2;
        ctx2d.strokeRect(cursorX + 1, cursorY + 1, CELL - 2, CELL - 2);
        fxDraw(fx);
        var palY = y0 + ROWS * CELL + 26, bw = (W() - 40) / TYPES.length;
        for (var k = 0; k < TYPES.length; k++) {
          var T2 = TYPES[k], bx = 20 + k * bw;
          rect(bx + 4, palY - 18, bw - 8, 44, k === typeSel ? 'rgba(85,230,255,0.22)' : 'rgba(255,255,255,0.06)');
          if (k === typeSel) strokeCircle(bx + bw / 2, palY + 4, 4, C.cyan, 2);
          text(T2.n, bx + bw / 2, palY + 6, 12, T2.col, 'center', 800);
          text(T2.cost + 'c', bx + bw / 2, palY + 20, 11, '#c9d6f0', 'center', 600);
        }
        rect(16, 92, W() - 32, 34, 'rgba(6,10,24,0.75)');
        text('Earned ' + Math.floor(earned) + '/' + g.goal + '   Credits ' + Math.floor(credits) + '   +' + income().toFixed(1) + '/s', W() / 2, 114, 14, C.white, 'center', 800);
        if (msgT > 0) text(msg, W() / 2, 146, 13, C.gold, 'center', 700);
        text('Time left ' + Math.ceil(timeLeft) + 's', 20, H() - 150, 12, 'rgba(200,220,255,0.7)', 'left', 600);
        text('Docks boost neighbours. A builds, B changes type', W() - 20, H() - 150, 12, 'rgba(200,220,255,0.7)', 'right', 600);
      },
      stop() {}
    };
  }

  /* ---------- 8. Warp Lane Dash (three lanes, collect cells, avoid blocks) ---------- */
  function gWarpDash(g) {
    var lane = 1, shipX = W() * 0.5, latch = false, items = [], spawnT = 0.6, scroll = 0, speed = 250;
    var cells = 0, hull = 3, charge = 0, warpT = 0, warpCd = 0, shake = 0, fx = [], st = n19Stars(40), t = 0;
    var shipY = H() - 220;
    function laneX(i) { return W() * (0.25 + 0.25 * i); }
    function spawnRow() {
      var order = [0, 1, 2], k;
      for (k = order.length - 1; k > 0; k--) { var j = randi(0, k); var tmp = order[k]; order[k] = order[j]; order[j] = tmp; }
      var blocks = Math.random() < 0.35 ? 2 : 1;
      for (k = 0; k < blocks; k++) items.push({ lane: order[k], y: -40, kind: 'block' });
      if (Math.random() < 0.6) items.push({ lane: order[blocks], y: -40, kind: 'cell' });
    }
    function moveLane(d) { lane = clamp(lane + d, 0, 2); }
    return {
      update(dt) {
        t += dt; warpT -= dt; warpCd -= dt; shake = Math.max(0, shake - dt * 30);
        var ax = AX();
        if (!latch && ax < -0.6) { moveLane(-1); latch = true; }
        else if (!latch && ax > 0.6) { moveLane(1); latch = true; }
        if (Math.abs(ax) < 0.2) latch = false;
        if (pressed('a')) moveLane(-1);
        if (pressed('b')) moveLane(1);
        if (pressed('c') && charge >= 1 && warpT <= 0) {
          charge -= 1; warpT = 2; fxBurst(fx, shipX, shipY, C.cyan, 40, 300); shake = 6;
        }
        shipX += (laneX(lane) - shipX) * Math.min(1, dt * 14);
        var mult = warpT > 0 ? 1.7 : 1;
        speed = Math.min(430, 250 + cells * 4);
        scroll += speed * dt * mult;
        spawnT -= dt * mult;
        if (spawnT <= 0) { spawnRow(); spawnT = clamp(0.62 - speed / 1400, 0.25, 0.6); }
        for (var i = items.length - 1; i >= 0; i--) {
          var it = items[i];
          it.y += speed * dt * mult;
          if (it.y > H() + 40) { items.splice(i, 1); continue; }
          if (Math.abs(it.y - shipY) < 26 && Math.abs(shipX - laneX(it.lane)) < 30) {
            if (it.kind === 'cell') {
              cells++; charge = Math.min(2, charge + 0.25);
              fxBurst(fx, laneX(it.lane), shipY, C.gold, 14, 160);
            } else if (warpT <= 0) {
              hull--; shake = 12; fxBurst(fx, shipX, shipY, C.red, 26, 240);
            } else {
              fxBurst(fx, laneX(it.lane), shipY, C.cyan, 16, 200);
            }
            items.splice(i, 1);
          }
        }
        fxUpdate(fx, dt, 0);
        hud('Cells ' + cells + '/' + g.goal + ' · Hull ' + Math.max(0, hull) + ' · Warp ' + Math.floor(charge));
        if (cells >= g.goal) { completeMini(); return; }
        if (hull <= 0) miniFail(g, 'Hull shattered by a block');
      },
      pointer(x) { moveLane(x < W() / 2 ? -1 : 1); },
      swipe(dx) { moveLane(dx < 0 ? -1 : 1); },
      draw() {
        n19Bg('#050818', '#010208');
        n19DrawStars(st, 1 / 60, 2);
        var i, yy;
        for (i = 0; i < 3; i++) {
          var lx = laneX(i);
          ctx2d.save(); ctx2d.setLineDash([22, 30]); ctx2d.lineDashOffset = -scroll;
          line(lx - W() * 0.12, 0, lx - W() * 0.12, H(), 'rgba(85,230,255,0.10)', 2);
          line(lx + W() * 0.12, 0, lx + W() * 0.12, H(), 'rgba(85,230,255,0.10)', 2);
          ctx2d.restore();
          line(lx, 0, lx, H(), 'rgba(120,160,255,0.06)', 1);
        }
        for (i = 0; i < items.length; i++) {
          var it = items[i], X = laneX(it.lane), Y = it.y;
          if (it.kind === 'block') {
            n19Glow(C.red, 14);
            rect(X - 36, Y - 22, 72, 44, '#2b0f1e');
            strokeCircle(X, Y, 1, C.red, 1);
            rect(X - 30, Y - 16, 60, 32, 'rgba(255,85,112,0.55)');
            n19NoGlow();
          } else {
            n19Glow(C.gold, 16); circle(X, Y, 13, C.gold); circle(X, Y, 6, '#fff7d6'); n19NoGlow();
          }
        }
        if (warpT > 0) {
          for (yy = 0; yy < 6; yy++) line(shipX, shipY + 30 + yy * 40, shipX, shipY + 60 + yy * 40, 'rgba(85,230,255,0.25)', 6);
          strokeCircle(shipX, shipY, 34 + Math.sin(t * 20) * 3, 'rgba(85,230,255,0.7)', 3);
        }
        n19Glow(C.cyan, 16);
        n19Ship(shipX, shipY, -Math.PI / 2, '#eaffff', 1.5);
        n19NoGlow();
        if (shake > 0) { ctx2d.save(); ctx2d.translate(rand(-shake, shake) * 0.4, 0); }
        fxDraw(fx);
        if (shake > 0) ctx2d.restore();
        rect(16, 92, W() - 32, 34, 'rgba(6,10,24,0.75)');
        text('Cells ' + cells + '/' + g.goal, 26, 114, 15, C.gold, 'left', 800);
        for (i = 0; i < 3; i++) circle(W() - 30 - i * 20, 109, 6, i < hull ? C.red : 'rgba(255,255,255,0.15)');
        n19Bar(W() / 2 - 60, 124, 120, 4, charge / 2, C.cyan);
        text('Tap left or right half, swipe, or use A/B. C warps when charged.', W() / 2, H() - 150, 12, 'rgba(200,220,255,0.7)', 'center', 600);
      },
      stop() {}
    };
  }

  /* ---------- 9. Fleet Dispatch (idle-style trade routes with risk) ---------- */
  function gFleet(g) {
    var ROUTES = [
      { n: 'Ember Run', base: 24, time: 8, risk: 0.05, col: C.orange },
      { n: 'Frost Lane', base: 40, time: 13, risk: 0.15, col: C.cyan },
      { n: 'Dust Spiral', base: 62, time: 19, risk: 0.25, col: C.purple },
      { n: 'Gold Reach', base: 95, time: 28, risk: 0.4, col: C.gold }
    ];
    var mult = [1, 1, 1, 1], free = 2, owned = 2, credits = 40, earned = 0, trips = [], sel = 0, mktT = 25;
    var msg = '', msgT = 0, fx = [], t = 0;
    function shipCost() { return 60 + owned * 25; }
    function say(m) { msg = m; msgT = 1.5; }
    function dispatch(i) {
      if (free <= 0) { say('No free ships. Buy one or wait for a return'); return; }
      free--; trips.push({ r: i, left: ROUTES[i].time, dur: ROUTES[i].time });
      say('Dispatched on ' + ROUTES[i].n);
    }
    function buy() {
      var c = shipCost();
      if (credits < c) { say('Need ' + c + ' credits for a ship'); return; }
      credits -= c; owned++; free++; say('New ship commissioned');
    }
    return {
      update(dt) {
        t += dt; msgT -= dt; mktT -= dt;
        if (mktT <= 0) {
          mktT = 25;
          for (var m = 0; m < ROUTES.length; m++) mult[m] = Math.round(rand(0.75, 1.45) * 100) / 100;
          say('Market shifted. Prices updated');
        }
        for (var k = trips.length - 1; k >= 0; k--) {
          var tr = trips[k];
          tr.left -= dt;
          if (tr.left > 0) continue;
          var R = ROUTES[tr.r];
          trips.splice(k, 1);
          if (Math.random() < R.risk) {
            owned--; say('Ship lost on ' + R.n); fxBurst(fx, W() / 2, 300, C.red, 30, 220);
          } else {
            var p = Math.round(R.base * mult[tr.r] * rand(0.9, 1.1));
            credits += p; earned += p; free++;
            say('+' + p + ' from ' + R.n);
            fxBurst(fx, W() / 2, 300, C.gold, 18, 160);
          }
        }
        if (pressed('a')) sel = (sel + 1) % ROUTES.length;
        if (pressed('b')) dispatch(sel);
        if (pressed('c')) buy();
        fxUpdate(fx, dt, 0);
        hud('Earned ' + earned + '/' + g.goal + ' · Ships ' + free + ' free / ' + owned);
        if (earned >= g.goal) { completeMini(); return; }
        if (free === 0 && trips.length === 0 && credits < shipCost()) miniFail(g, 'Fleet grounded: no ships and no credits');
      },
      pointer(x, y) {
        for (var i = 0; i < ROUTES.length; i++) {
          var cy = 170 + i * 124;
          if (x >= 20 && x <= W() - 20 && y >= cy && y <= cy + 110) { sel = i; dispatch(i); return; }
        }
        if (x >= W() - 150 && x <= W() - 20 && y >= 104 && y <= 140) buy();
      },
      draw() {
        n19Bg('#070a1a', '#02030a');
        rect(16, 92, W() - 32, 34, 'rgba(6,10,24,0.75)');
        text('Credits ' + credits + '   Earned ' + earned + '/' + g.goal, 26, 114, 14, C.white, 'left', 800);
        var bx = W() - 150, by = 104;
        rect(bx, by, 130, 34, 'rgba(85,230,255,0.18)');
        ctx2d.strokeStyle = C.cyan; ctx2d.lineWidth = 2; ctx2d.strokeRect(bx, by, 130, 34);
        text('Buy ship ' + shipCost(), bx + 65, by + 22, 13, C.cyan, 'center', 800);
        for (var i = 0; i < ROUTES.length; i++) {
          var R = ROUTES[i], cy = 170 + i * 124, X = 20, Wd = W() - 40;
          var isSel = i === sel;
          n19Glow(R.col, isSel ? 16 : 0);
          rect(X, cy, Wd, 110, isSel ? 'rgba(40,60,110,0.55)' : 'rgba(12,18,38,0.8)');
          n19NoGlow();
          rect(X, cy, 6, 110, R.col);
          text(R.n, X + 20, cy + 26, 17, R.col, 'left', 900);
          text('Pays ' + Math.round(R.base * mult[i]) + ' (x' + mult[i].toFixed(2) + ')', X + Wd - 14, cy + 26, 14, C.white, 'right', 800);
          text(R.time + 's trip   Risk ' + Math.round(R.risk * 100) + '%', X + 20, cy + 50, 13, '#9fb3d9', 'left', 700);
          text('Tap to dispatch', X + 20, cy + 98, 12, 'rgba(200,220,255,0.6)', 'left', 600);
          for (var k = 0; k < trips.length; k++) {
            var tr = trips[k];
            if (tr.r !== i) continue;
            var f = 1 - tr.left / tr.dur;
            n19Bar(X + 20, cy + 64, Wd - 40, 8, 1, 'rgba(255,255,255,0.08)');
            n19Glow(R.col, 10); circle(X + 20 + (Wd - 40) * f, cy + 68, 6, R.col); n19NoGlow();
          }
        }
        fxDraw(fx);
        if (msgT > 0) text(msg, W() / 2, H() - 140, 14, C.gold, 'center', 700);
        text('A selects, B dispatches, C buys a ship', W() / 2, H() - 116, 12, 'rgba(200,220,255,0.6)', 'center', 600);
      },
      stop() {}
    };
  }

  /* ---------- registry ---------- */
  return {
    engines: {
      n19_portarb: gPortArb,
      n19_beltminer: gBeltMiner,
      n19_lanecharter: gLaneCharter,
      n19_tickertape: gTicker,
      n19_gravcourier: gGravCourier,
      n19_convoyguard: gConvoyGuard,
      n19_stationgrid: gStationGrid,
      n19_warpdash: gWarpDash,
      n19_fleetdispatch: gFleet
    },
    minis: [
      { id: 'n19_portarb', title: 'Port Arbitrage', icon: '🛰️', cat: 'SIMULATION', engine: 'n19_portarb', goal: 300, hue: 190,
        desc: 'Fly between four trade ports. Buy crates where ore is cheap, sell where it is dear, and dodge the pirate patrol that steals half your hold.' },
      { id: 'n19_beltminer', title: 'Belt Miner', icon: '⛏️', cat: 'ARCADE', engine: 'n19_beltminer', goal: 40, hue: 30,
        desc: 'Auto-beam rocks and drones while you steer. Haul ore back to the depot before the hold fills, and afterburn through the asteroid field.' },
      { id: 'n19_lanecharter', title: 'Lane Charter', icon: '🗺️', cat: 'PUZZLE', engine: 'n19_lanecharter', goal: 8, hue: 210,
        desc: 'Plan a cargo run across a lane map inside a fuel budget. Tap connected systems in order, avoid pirate space, and reach the target without stranding your ship.' },
      { id: 'n19_tickertape', title: 'Ticker Tape', icon: '📈', cat: 'SIMULATION', engine: 'n19_tickertape', goal: 250, hue: 140,
        desc: 'Read a live price tape. Go long or short, close at the right moment, and bank realized profit before a losing streak triggers a margin call.' },
      { id: 'n19_gravcourier', title: 'Gravity Courier', icon: '📦', cat: 'ARCADE', engine: 'n19_gravcourier', goal: 6, hue: 260,
        desc: 'Thread crates between gravity wells. Land softly on the load pad, drop at the dock, and refuel there. Planet hits cost hull.' },
      { id: 'n19_convoyguard', title: 'Convoy Guard', icon: '🛡️', cat: 'ACTION', engine: 'n19_convoyguard', goal: 20, hue: 0,
        desc: 'Protect a convoy of freighters from pirate raiders. Aim the turret, fire with A, and fire a pulse with B. Lose three freighters and the convoy scatters.' },
      { id: 'n19_stationgrid', title: 'Station Grid', icon: '🏗️', cat: 'STRATEGY', engine: 'n19_stationgrid', goal: 900, hue: 50,
        desc: 'Build an orbital station on a grid. Docks boost their neighbours, solar panels power refineries, and meteors strike random modules unless you reinforce them in time.' },
      { id: 'n19_warpdash', title: 'Warp Lane Dash', icon: '✨', cat: 'HYPER', engine: 'n19_warpdash', goal: 30, hue: 280,
        desc: 'Race down a three-lane warp tunnel. Collect energy cells, dodge blocks, and spend charged cells on a short warp burst that makes you untouchable.' },
      { id: 'n19_fleetdispatch', title: 'Fleet Dispatch', icon: '🚚', cat: 'STRATEGY', engine: 'n19_fleetdispatch', goal: 600, hue: 320,
        desc: 'Send your ships down four trade routes. Richer routes pay more but risk losing the ship. Reinvest credits into new hulls before the market shifts.' }
    ],
    aaa: []
  };
})();
