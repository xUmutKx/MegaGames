# Mega Games — agent brief

Mega Games is an Android app that runs one big HTML file (`/root/projects/MegaGames/app/src/main/assets/mega.html`, ~1.4 MB, plain JS, 2D canvas `ctx2d`/`cv2d` + three.js for 3D) in a WebView. ~280 minigames + some big "AAA" modules. The owner thinks many games are far too simple. Your job: make a GROUP of games clearly richer and better, or write new ones. Several agents work in parallel, each on a different group.

## Hard rules
- DO NOT edit `mega.html` (unless your task says so). Write ONLY your own file(s) in `/root/projects/MegaGames/tools/agents/` (the lead merges them). Don't touch other agents' files.
- Your deliverable is ONE file `tools/agents/<yourname>.js` of the form
  ```js
  window.__AG_<yourname> = (function () {
    /* private helpers, constants, engines, modules — everything lives inside this function */
    return { engines: { engineKey: gameFn, ... }, minis: [ {id,title,icon,cat,desc,engine,goal,hue?,cfg?}, ... ], aaa: [ {id,icon,title,tag,desc,mod}, ... ] };
  })();
  ```
  No top-level `const/let/function` outside the IIFE (name clashes would break the whole page). Do not touch page globals at load time except through the page helpers inside functions (they run later). No network, no external assets, no images/fonts: draw everything with canvas primitives; emoji text is fine as decoration.
- Test it: `node /root/projects/MegaGames/tools/agents/harness.js /root/projects/MegaGames/tools/agents/<yourname>.js` must print `ALL OK`. The harness runs every engine/module headless for thousands of random frames with the page helpers stubbed; an undefined helper = ReferenceError. If you rely on extra page helpers, add stubs in `<yourname>.stubs.js` (same folder). Also run `node --check` on your file.
- Everything the player reads must be in English (HUD, hints, game-over text).
- Games are "fan-project inspired": take the genre/feel of well-known games but use ORIGINAL names, art and text (no trademarked names or assets).
- Final answer: a SHORT report (<= 150 words): what you changed/added, engine keys, anything the lead must know.

## Engine contract (minigames, `ENGINES[key] = (g) => engine`)
`g` = the MINIS entry: `{id,title,goal,cfg,...}`. The engine object: `update(dt)` (seconds), `draw()`, optional `pointer(x,y)` (finger down; if you define it, taps are NOT converted to A/B/C buttons), `swipe(dx,dy)` (fires on finger up after a >30px drag), `stop()` (remove any listeners you added to `cv2d`).
Finish a run with `completeMini()` (win, when the goal is reached) or `miniFail(g, "reason")` (lose). Show progress with `hud("text")`. The existing code often shows progress as "x / goal" in the HUD, which drives the progress bar: keep that "n/goal" pattern.
Overriding an existing game: return an engine under the SAME key (e.g. `snake`) and (optionally) the same `minis` id with a better `desc` — it replaces the old one. Keep the same goal semantics (reach `g.goal`) unless you change `goal` in your `minis` entry. Keep every game winnable.

## Page helpers you can use (all global, call them inside functions)
`W() H()` canvas size in CSS px (portrait phone, about 400x800+). Reserve the top ~70px (top bar) and the bottom ~115px (on-screen joystick bottom-left + A/B/C buttons bottom-right, drawn over the canvas) — keep important things inside y∈[80, H-120].
Drawing: `clear(color) rect(x,y,w,h,color,radius) circle(x,y,r,color) strokeCircle(x,y,r,color,lw) line(x1,y1,x2,y2,color,lw) text(str,x,y,size,color,align,weight) polygon([[x,y],...],color)`, `ctx2d` (full Canvas2D API, e.g. gradients, `save/restore/translate/rotate`, `globalCompositeOperation='lighter'`).
Input: `AX() AY()` joystick/keys in -1..1; `pressed('a'|'b'|'c')` (one-shot, true once per press), `key('arrowleft'|' '|...)` held keys; `IN.joyX/IN.joyY`.
Util: `rand(a,b) randi(a,b) pick(arr) clamp(v,a,b) dist(x1,y1,x2,y2) randColor()`, palette `C.{white,cyan,pink,purple,green,yellow,orange,red,blue,lime,gold}`.
FX: `fxBurst(list,x,y,color,n,speed)`, `fxUpdate(list,dt,gravity)`, `fxDraw(list)` (list is your own array), `beep(freqFrom,freqTo,seconds,'square'|'sine'|'sawtooth'|'triangle',volume)`, `toast(str)`, `hudTitle(title,subtitle)`.
Persistence: `localStorage` (wrap in try/catch; use keys prefixed `mg_<yourname>_`), `progress.coins += n; saveProg()` for small rewards.
You may attach pointer listeners to `cv2d` for dragging (see how `Horde` in `tools/new_aaa.js` does it) — remove them in `stop()/destroy()`.

## Big modules (`aaa: [...]`, 2D only)
An AAA entry `{id,icon,title,tag:"AAA • GENRE",desc,mod}` where `mod` is an object: `a:false`, `init()` (sets `this.a=true`, resets state), `update(dt)`, `draw()`, `pointer(x,y)`, `destroy()` (remove listeners, `this.a=false`). Study `Horde`/`Bastion` in `/root/projects/MegaGames/tools/new_aaa.js` (touch drag controls, level-up cards, game-over/retry on tap, `localStorage` best score) as the reference for structure and polish. `hudTitle("TITLE","status")` each frame is fine. Keep the player's top 70px free (HUD from y≈78 down) and bottom 110px mostly free.

## Quality bar (what "better" means here)
Each game should have: a clear goal and fail state; smooth controls that work with ONE thumb on a phone (joystick/A-B-C or drag/tap/swipe); difficulty ramp and variety (levels, enemy/obstacle types, power-ups, bosses where it fits); "juice" (particles, screen shake, sounds via `beep`, combo/score popups); readable HUD; polished drawing (gradients, glow, depth, parallax) instead of flat circles and rectangles. A major game is typically 200–500 lines. Don't pad, make it fun. Read the existing engine in `mega.html` (grep `function game<Name>` / `p5_<name>`; later definitions override earlier ones) and its MINIS `desc`: the description often promises features the code doesn't have — make the game deliver at least that.
