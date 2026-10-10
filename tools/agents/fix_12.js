window.__AG_fix_12 = (function () {
  // Rhythm quiz family (Clap Count, Chord Match, Side Call, Higher Lower) on one shared frame:
  // sound-wave / clap visuals, difficulty ramp, streak combo, particles, shake, answer reveal on a miss.
  // Self-contained: no calls into the page's rh_* helpers.

  function tone(f, d, type, v, pan, when) {
    try {
      if (!window.__AC) window.__AC = new (window.AudioContext || window.webkitAudioContext)();
      const A = window.__AC;
      if (A.state === "suspended") A.resume();
      const t = A.currentTime + (when || 0), o = A.createOscillator(), g = A.createGain();
      o.type = type || "triangle";
      o.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(v || .15, t);
      g.gain.exponentialRampToValueAtTime(.001, t + (d || .2));
      o.connect(g);
      if (pan !== undefined && A.createStereoPanner) { const p = A.createStereoPanner(); p.pan.value = pan; g.connect(p); p.connect(A.destination) }
      else g.connect(A.destination);
      o.start(t); o.stop(t + (d || .2) + .02);
    } catch (e) { /* no audio: the game still works */ }
  }
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);

  function burst(parts, x, y, c, n) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, 6.283), v = rand(60, 240), life = rand(.35, .8);
      parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: life, max: life, r: rand(2, 4.5), c: c });
    }
  }

  function bgDraw() {
    const gr = ctx2d.createLinearGradient(0, 0, 0, H());
    gr.addColorStop(0, "#1a1f44"); gr.addColorStop(1, "#06070d");
    ctx2d.fillStyle = gr; ctx2d.fillRect(0, 0, W(), H());
    const rg = ctx2d.createRadialGradient(W() / 2, H() * .3, 10, W() / 2, H() * .3, W() * .7);
    rg.addColorStop(0, "rgba(85,230,255,.18)"); rg.addColorStop(1, "rgba(85,230,255,0)");
    ctx2d.fillStyle = rg; ctx2d.fillRect(0, 0, W(), H());
  }

  // Generic quiz frame. spec = { labels(score) -> string[], make(score, labels) -> question, cols? }
  // question = { ans, t, dur, vis: "wave" | "claps", play(), n?, gap? }
  function quiz(g, spec) {
    const c = g.cfg || {}, goal = g.goal || 10;
    const S = { lives: c.lives || 3, score: 0, streak: 0, over: false, parts: [], clk: 0, shake: 0, flash: 0,
      reveal: 0, revealTxt: "", q: null, labels: [], hit: -1, hitOk: false };

    const colsFor = n => spec.cols || (n <= 3 ? n : 2);
    function btn(i, n) {
      const cols = colsFor(n), bw = Math.min(150, (W() - 40) / cols - 12), x0 = W() / 2 - cols * (bw + 12) / 2;
      return { x: x0 + (i % cols) * (bw + 12), y: H() * .42 + Math.floor(i / cols) * 84, w: bw, h: 72 };
    }
    function play() { S.clk = 0; S.q.play() }
    function ask() { S.labels = spec.labels(S.score); S.q = spec.make(S.score, S.labels); play() }
    function end(win, msg) {
      if (S.over) return;
      S.over = true;
      setTimeout(win ? completeMini : () => miniFail(g, msg), 400);
    }
    ask();

    function viz(cx, cy) {
      const q = S.q, playing = S.clk < q.dur;
      if (q.vis === "claps") {
        for (let i = 0; i < q.n; i++) {
          const x = cx + (i - (q.n - 1) / 2) * 34, t0 = i * q.gap;
          if (S.clk >= t0 && S.clk < t0 + .12) { circle(x, cy, 24, "rgba(255,227,110,.25)"); circle(x, cy, 13, C.yellow) }
          else if (S.clk >= t0 + .12) circle(x, cy, 8, "rgba(255,255,255,.35)");
          else strokeCircle(x, cy, 12, "rgba(255,255,255,.3)", 3);
        }
        return;
      }
      const N = 26, bw = W() * .8 / N;
      for (let i = 0; i < N; i++) {
        const a = playing ? .25 + .75 * Math.abs(Math.sin(S.clk * 9 + i * .6)) : .08;
        const h = a * 84;
        rect(W() * .1 + i * bw + 1, cy - h / 2, bw - 3, h, i % 2 ? C.cyan : C.pink, 3);
      }
    }

    return {
      update(dt) {
        dt = Math.min(dt, .05);
        S.clk += dt;
        S.shake = Math.max(0, S.shake - dt * 4);
        S.flash = Math.max(0, S.flash - dt);
        S.reveal = Math.max(0, S.reveal - dt);
        S.parts.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 160 * dt; p.life -= dt });
        S.parts = S.parts.filter(p => p.life > 0);
        hud("Score " + S.score + "/" + goal + " • ❤️ " + Math.max(0, S.lives) + (S.streak > 1 ? " • Streak " + S.streak : ""));
      },
      pointer(x, y) {
        if (S.over) return;
        if (x >= W() / 2 - 60 && x <= W() / 2 + 60 && y >= H() - 120 && y <= H() - 64) { play(); return }
        const n = S.labels.length;
        let i = -1;
        for (let k = 0; k < n; k++) {
          const b = btn(k, n);
          if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) { i = k; break }
        }
        if (i < 0) return;
        const b = btn(i, n), bx = b.x + b.w / 2, by = b.y + b.h / 2;
        S.hit = i;
        if (i === S.q.ans) {
          S.hitOk = true; S.flash = .3; S.streak++; S.score++;
          burst(S.parts, bx, by, C.green, 18);
          if (S.streak >= 3) burst(S.parts, W() / 2, H() * .3, C.gold, 14);
          tone(620 + 50 * Math.min(S.streak, 8), .15, "sine", .15);
          if (S.score >= goal) { end(true); return }
          ask();
        } else {
          S.hitOk = false; S.flash = .3; S.streak = 0; S.lives--;
          S.shake = .6; S.reveal = 1.4; S.revealTxt = "It was " + S.labels[S.q.ans];
          burst(S.parts, bx, by, C.red, 12);
          tone(180, .18, "sawtooth", .1);
          if (S.lives <= 0) { end(false, "Wrong call"); return }
          play();
        }
      },
      draw() {
        const sx = (Math.random() - .5) * S.shake * 10, sy = (Math.random() - .5) * S.shake * 10;
        bgDraw();
        ctx2d.save();
        ctx2d.translate(sx, sy);
        const cx = W() / 2;
        text(S.q.t, cx, H() * .16, 26, "#fff", "center");
        if (S.reveal > 0) text(S.revealTxt, cx, H() * .16 + 34, 16, C.yellow, "center");
        viz(cx, H() * .29);
        const n = S.labels.length;
        for (let i = 0; i < n; i++) {
          const b = btn(i, n);
          const hot = S.flash > 0 && i === S.hit;
          rect(b.x, b.y, b.w, b.h, hot ? (S.hitOk ? "rgba(85,255,154,.35)" : "rgba(255,85,112,.35)") : "rgba(255,255,255,.14)", 14);
          text(S.labels[i], b.x + b.w / 2, b.y + b.h / 2 + 7, 20, "#fff", "center");
        }
        rect(W() / 2 - 60, H() - 120, 120, 56, "rgba(85,230,255,.25)", 14);
        text("REPLAY", W() / 2, H() - 86, 18, "#fff", "center");
        S.parts.forEach(p => { ctx2d.globalAlpha = Math.max(0, p.life / p.max); circle(p.x, p.y, p.r, p.c) });
        ctx2d.globalAlpha = 1;
        ctx2d.restore();
        if (S.over) {
          const w = Math.min(W() - 40, 340);
          rect((W() - w) / 2, H() / 2 - 60, w, 110, "rgba(8,10,20,.85)", 18);
          text(S.score >= goal ? "Cleared!" : "Game over", W() / 2, H() / 2 + 10, 28, "#fff", "center");
        }
      },
      stop() {}
    };
  }

  // ---- CLAP COUNT: more claps and a faster burst as the score climbs
  const clapSpec = {
    cols: 3,
    labels: () => ["1", "2", "3", "4", "5", "6"],
    make(s) {
      const max = Math.min(6, 2 + Math.floor(s / 2));
      const n = 1 + Math.floor(Math.random() * max), gap = Math.max(.13, .24 - s * .012);
      return {
        ans: n - 1, t: "How many claps?", vis: "claps", n: n, gap: gap, dur: n * gap + .3,
        play() { for (let i = 0; i < n; i++) tone(1200, .04, "square", .1, undefined, i * gap) }
      };
    }
  };

  // ---- CHORD MATCH: two more chord types after four rounds
  const CH = [["Major", [0, 4, 7]], ["Minor", [0, 3, 7]], ["Dim", [0, 3, 6]], ["Sus4", [0, 5, 7]], ["Aug", [0, 4, 8]], ["Dom7", [0, 4, 7, 10]]];
  const chordSpec = {
    labels: s => (s >= 4 ? CH : CH.slice(0, 4)).map(x => x[0]),
    make(s, labels) {
      const k = Math.floor(Math.random() * labels.length), r = 48 + Math.floor(Math.random() * 12), notes = CH[k][1];
      return {
        ans: k, t: "Name the chord", vis: "wave", dur: 1.3,
        play() { notes.forEach(x => tone(hz(r + x), 1.2, "triangle", .1)) }
      };
    }
  };

  // ---- SIDE CALL: Center joins at round 4, and the sound gets shorter and more subtle
  const sideSpec = {
    labels: s => (s >= 4 ? ["Left", "Center", "Right"] : ["Left", "Right"]),
    make(s, labels) {
      const p = Math.max(.35, .95 - s * .06), d = Math.max(.18, .4 - s * .02), cnt = labels.length;
      const idx = Math.floor(Math.random() * cnt);
      const pan = cnt === 3 ? [-p, 0, p][idx] : [-p, p][idx];
      return {
        ans: idx, t: "Which side?", vis: "wave", dur: d,
        play() { tone(520, d, "triangle", .2, pan) }
      };
    }
  };

  // ---- HIGHER LOWER: the interval shrinks after round 3
  const ladderSpec = {
    labels: () => ["Higher", "Lower"],
    make(s) {
      const up = Math.random() < .5, a = 60 + Math.floor(Math.random() * 12);
      const d = s >= 3 ? 1 + Math.floor(Math.random() * 4) : 3 + Math.floor(Math.random() * 5);
      const b = a + (up ? d : -d);
      return {
        ans: up ? 0 : 1, t: "Higher or lower?", vis: "wave", dur: 1,
        play() { tone(hz(a), .4, "sine", .2); tone(hz(b), .4, "sine", .2, undefined, .5) }
      };
    }
  };

  const engines = {
    rh_clap: g => quiz(g, clapSpec),
    rh_chord: g => quiz(g, chordSpec),
    rh_stereo: g => quiz(g, sideSpec),
    rh_ladder: g => quiz(g, ladderSpec)
  };

  const minis = [
    { id: "rh_clap", title: "Clap Count", icon: "👏", cat: "RHYTHM", desc: "Count the claps. Faster and longer as you go.", engine: "rh_clap", goal: 8, cfg: {} },
    { id: "rh_chord", title: "Chord Match", icon: "🎼", cat: "RHYTHM", desc: "Name the chord. Harder chords show up later.", engine: "rh_chord", goal: 8, cfg: {} },
    { id: "rh_stereo", title: "Side Call", icon: "🔊", cat: "RHYTHM", desc: "Left, right or center? Sounds get shorter.", engine: "rh_stereo", goal: 10, cfg: {} },
    { id: "rh_ladder", title: "Higher Lower", icon: "📶", cat: "RHYTHM", desc: "Was the second note higher? Gaps get smaller.", engine: "rh_ladder", goal: 10, cfg: {} }
  ];

  return { engines: engines, minis: minis, aaa: [] };
})();
