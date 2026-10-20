# Demo motion: `?motion=demo` (conference demo, 2026-10-26)

Branch `demo-motion` (from `origin/r59-rc` 6db09ac86, release 59), 2026-10-20. Game case: **both games**, one set of numbers; the rig plumbing is shared (rigs are FFX-only today). Nothing is switched on for a
player: every part sits behind `?motion=demo` (default off = exactly today's build). Not deployed, not reviewed (a focused review is owed before it ships). The demo chapters (driver, 2026-10-20) are
**Chapter I Seymour Flux (FFX)** and **Chapter IV Bahamut (FFX-2)**.

Bailey, 2026-10-19 ~21:50 EDT: "I need a way to quickly improve the graphical fidelity of the game as well as the motion, animation, visual style. I demo my game in a week at a huge gaming conference."; earlier
"some of the poses look too stiff still. I need better animation. It needs to look amazing."; "i'll go with all of your recommendations". Driver decisions 150 and 153a. He judges motion in motion (he called a stiff
rig "looks like crap"), so every change is shown as clips before it ships: `D:/Tools/pyrefly-scratch/2026-10-20/demo-motion/clips/` (see "Clips").

## What was already in the build (the brief assumed less)

| Part | Before this branch |
|---|---|
| Pose blend | an owned two-plane cross-dissolve, 120 ms party / 140 ms foes, `QUAD_IN_OUT` (`PoseBlend.ts`, `PaintedActor.setPose`); a 75 ms KO cross (`KoFall.ts`); the aligned and stepped dissolves built and OFF |
| Rig variant swap | flips at 0.5 of the move (`RigPartState.partStateAt`) |
| Breathing | LIVING PAINTINGS' chest swell (2 percent, 2.5 s, random phase) replaces `PaintedActor`'s whole-figure squash (measured: 0.00 percent on every painted figure in Chapters I and IV); sway 0.9 percent at 0.22 Hz, the same period for everyone |
| Hit feel | option C (BATTLE SPECTACLE, on by default): hit-stop FFX 85/40 ms, FFX-2 55/28 ms (crit-only), a trauma shake by kind, the impact frame; a warm 200 ms flash on the struck figure (white 260 ms on a crit) |

So parts 1, 3 and 4 are **deltas on top of what exists**, and only part 2 (the rig cross-fade) adds a missing capability.

## What each part does

All four read `motion/DemoMotion.ts#demoMotionOn` (`?motion=demo`, read once; `window.__pyrefly.demoMotion()` reads and sets it for captures). `?motion=smooth|classic` (`PoseSwap.ts`) is a separate reading of the same
parameter: a value it does not know (`demo`) plays the default `smooth` and then these four.

### 1. Pose blend chosen from the pair (`motion/DemoBlend.ts`, `PoseBlend.retune`, `PaintedActor.demoRetune`, `KoFall.koCrossMs`)

When a painted figure changes pose, `PaintedActor.beginBlend` has just placed the incoming painting (the same registration, stance and feet row the pose-sizing rule uses). It reads the outline overlap of the two
paintings as placed (`PoseAlign.footprintOverlap`, the harness's own reading) and retunes the blend that has just started (`PoseBlend.retune`; a running blend is never bent):

- `difference = clamp((0.6 - overlap) / 0.45)` (0: the pair agrees, 1: it does not; unknown overlap, 0.5).
- **Length** today's 120 ms (party) or 140 ms (foes) for a pair that agrees, up to 140 or 150 ms for one that does not (+20 and +10 x difference). A KO, `overdrive`, `special`, `victory` swap is 40 ms longer (200 at most). A scene's own cut
  (`crossfadeMs` 0, FF7) stays a cut and so does a dissolve past 160 ms. The KO collapse's cross (`KoFall.KO_CROSS_MS`) is 100 ms instead of 75 (still inside the 300 ms landing squash and the 520 ms revive wait).
- **Shape**, the capped cross `out = (1 - s)^k`, `in = s`, `s = (1 - cos(pi u)) / 2` (a cosine ease: as soft a start as today's quad, 0.022 of the gap in the first frame, which matters: a linear start read as a 100 px jerk), `k = 1 + difference`
  (1 is a plain eased blend): the new painting is prompt, the old one goes first, and the two never both show more than 0.382 (`k` = 2) whatever the frame rate.
- Analytic comparison, a pair that shares nothing, 60 fps, today's 120 ms quad dissolve against the shipped 140 ms capped cross: worst one-frame step of the fade-weighted head 0.252 / 0.258 of the gap, first frame 0.018 / 0.017, time with the
  lesser painting over 0.15 54 / 46 ms, peak of the lesser painting 0.434 / 0.332. A pair that agrees (k = 1): 0.252 to 0.215 (party, 120 ms) and 0.219 to 0.185 (foes, 140 ms). `blend-trade*.mts` in the scratch folder print the tables. The body
  thins to 0.76 at the crossing for a pair that shares nothing.

### 2. Rig variant cross-fade (`rig/RigFade.ts`, `RigGhost.ts`, `RigFigure.ts`, `RigActor.ts`; format v2.1 `RigKey.fadeMs`; decision 153a)

A key that swaps a part to a variant image, shows a hidden part or hides one, cross-fades over `fadeMs` (default 110, `0` = cut, at most 400 played) instead of flipping at 0.5. `RigFigure.setPartState(state, fadeMs)` keeps the
old look on a ghost mesh (a second mesh and material of the same part with the actor's uniform cells shared by reference, so a flash, tint or dim reaches both; drawn 0.0004 behind). The new look comes up over the first 70
percent of the fade, the old one stays whole until 30 percent and goes out over the rest: the two always cover at least 0.96 of the part (a plain `1 - u`, `u` covers 0.75 in the middle and the head would go
see-through). The fade is centred on 0.5 of the move (`fadeStart`), runs on the REAL clock (a hit-stop that holds the field never freezes a half-mixed pair of images) and a snap (`immediate`) stays a flip. Without the
switch a `fadeMs` file plays exactly as v2.0. The rig gate and its agreement test are unchanged: the state a key asks for is the same pure function. `docs/CONTRACT-CHANGES.md` has the entry (newest first). Real files tested:
`tests/unit/rig/rig-fade-real.test.ts` (bahamut-x: head and both wings on `attack` and `hurt`, 6 part changes; lulu-v2: `defend` and `od-fury`, 12 part changes; lulu v1: none, never fades).

### 3. Breathing idle (`motion/DemoIdle.ts`, `PaintedActor`'s constructor, `fx/mix/living.ts`)

Every `PaintedActor` that has breathing on (any figure anywhere, battle or scene): a 3 to 4 s period from its name, a whole-figure squash of 0.6 to 1.2 percent about the feet (it stays beside LIVING PAINTINGS' chest swell
instead of being switched off behind it, on the same period and phase, and FFX-2 no longer breathes a fifth faster), a sway of 0.008 to 0.014 rad on 5.5 to 8.5 s (each figure its own, not 4.4 s for everyone), and a phase
dealt by the golden ratio (`nextIdlePhase`: any two of twelve figures are 0.05 of a cycle apart, any three in a row 0.12; a draw of `Math.random()` is not) so a party never breathes in step and a recording repeats.
A rig with its own idle (`motion.idle`) keeps it. Measured in the real game (clips, 480 frames of Chapters I and IV): squash 0.79 to 0.97 percent each way on every standing figure (today 0.00), breath periods 3.0 to 3.7 s
(2.6 s for a figure in `ready`, whose posture tempo is faster), sway 0.009 to 0.014 rad.

### 4. Hit feel (`motion/DemoHit.ts`, `DemoHitBeat.ts`, `fx/c/SpectacleRules.planHit`, `fx/c/presenterHooks.fxHit`, `BattlePresenter`'s `hpMaxOf`)

`hitPower` = the blow's damage over 4,000 or over 40 percent of the target's HP, whichever is more (0 to 1.5). **Stop:** a finisher (crit, overkill, capped, or the last blow of an Overdrive/Special) 100 to 150 ms; a
strong blow (power 0.3 and over) 50 to 80; a weak one 17 to 30 (a frame at least: the first clips showed a 4 ms stop on an ordinary 148-damage hit, which no frame shows); a multi-hit action stops on its first and last
blow only (FFX: the last blow SHOWN). **Shake:** trauma 0.14 + 0.48 sqrt(power) (+0.12 crit, +0.2 an Overdrive's last blow, halved in the middle of a flurry), through option C's trauma camera (offset = max x trauma squared;
the camera, never the HUD); with BATTLE SPECTACLE off the beat shakes the camera itself (0.06 to 0.2). **Flash:** 0.08 s white, full strength, on the struck figure for every damaging blow (REDUCE FLASHES: the first
blow of an action only, softened by the actor). With option C on the beat waits out every stop it made, so the next beat does not run ahead of a held field. REDUCE MOTION and any speed but normal stop and shake nothing.
**The stop holds the presentation's field clock only** (`HitStop`, `SpectacleFx.stageDt`): `src/battle/**` is untouched, the three goldens are unchanged, and the ATB pump reads the wall clock.

## Measurements

### Continuity harness (CHK-026 / CHK-027), the same chapters, route and seed with and without the switch

`critic/runner/lib/continuity.mjs` (real keys, title to board and back, headless Chromium on the real GPU, 1600 x 900, seed 1, the route's "win" play, one run each, all figures painted: `?rig=off`, because the dev server would
otherwise serve `D:/pyrefly-art-rigs` and the live game ships no rigs); `PYREFLY_QUERY` (new, `critic/runner/lib/README.md`) puts `?motion=demo` on the address. 56 to 60 fps in every run. Raw files:
`D:/Tools/pyrefly-scratch/2026-10-20/demo-motion/cont/{off,demo}/<chapter>-win/continuity/continuity.json` (+ strips); `cont-compare.py` prints the table.

| Reading | Chapter I (FFX) today | demo | Chapter IV Bahamut (FFX-2) today | demo |
|---|---|---|---|---|
| battle, swaps counted, per minute | 402 s, 352, 52.5 | 378 s, 347, 55.1 | 394 s, 416, 63.4 | 377 s, 412, 65.6 |
| **swap jerks** (a one-frame step of the tracked head or feet at a pose swap: 24 px and 3 times its neighbours) | **22** | **13** | **21** | **15** |
| of them 40 px or more (the gated ones) | 4, worst 63 px | 4, worst 48.5 px | 2, worst 48.3 px | 2, worst 48.4 px |
| mid-move jerks | 1 | 0 | 1 | 2 |
| double images (ghost) of severity 0.4 or more | 1 (worst 0.417) | **0** (worst 0.365) | 5 (worst 0.409) | **0** (worst 0.326) |
| p90 ghost severity | 0.310 | 0.243 | 0.342 | 0.263 |
| swaps with a ghost, ghost frames | 336, 1,281 | 332, 1,233 | 416, 1,670 | 412, 1,630 |
| CHK-026 / CHK-027 | PASS / FAIL | PASS / FAIL | PASS / FAIL | PASS / FAIL |

CHK-027 still FAILS in both: the gated count (jerks of 40 px or more at a swap) did not move (4 and 2). What moved is the whole population of swap jerks (22 to 13 and 21 to 15) and the double images (p90 severity down about 22 percent). **How much of that is noise.** The harness runs in real time on a shared machine, so two runs of the same build differ. A second run of today's build (`cont-repeat/`, same route and seed): Chapter I 17 swap jerks (first run 22), 3 of 40 px
or more (4), worst ghost severity 0.374 (0.417), p90 0.305 (0.310); Chapter IV 21 (21), 3 (2), 0.409 (0.409), p90 0.340 (0.342), double images over 0.4: 2 (5). So: the p90 ghost severity is stable to 0.005 and the demo's drop
(Chapter I 0.31 to 0.243, Chapter IV 0.342 to 0.263, about 22 percent) is real; the swap-jerk count moves by up to 5 between runs of one build, so Chapter I's 22 and 17 against 13 is a modest drop and Chapter IV's 21 and 21 against 15
a steadier one; the count of 40 px jerks (the gated number) and the count of double images over 0.4 (5 and 2 against 0) are within the noise. One run per build per chapter is all there was time for.

How the shipped numbers were reached (three builds of the switch were measured; each change is in the git log of the branch):

| Build | Chapter I swap jerks, 40 px+ (worst) | Chapter IV swap jerks, 40 px+ (worst) | What it taught |
|---|---|---|---|
| 1. linear blend, 110 to 140 ms | 7, 4 (55 px) | 18, 3 (**105 px**) | a linear blend starts at 14 percent in its first frame (0.087 of the gap against 0.018 for the quad's ease-in): two 100 px feet "jerks" on Bahamut idle to attack, whose silhouette-read feet are over 1,000 px apart so any step is large |
| 2. cosine ease, agree length 110/120 ms | 21, 2 (47 px) | 18, 3 (62 px) | a shorter blend takes bigger steps: the agree length must not be shorter than today's |
| 3. cosine ease, agree length 120/140 ms (shipped) | 13, 4 (48.5 px) | 15, 2 (48.4 px) | |

Build 1 looked best on the Chapter I jerk count (7) and worst on Chapter IV: the harness's feet reading of an airborne boss is what that number measures, not the figure's motion, so the shipped build is chosen on being no worse on either.

### Analytic (pure, `tests/unit/engine/demo-blend.test.ts`)

At 60 fps, a pair that shares nothing: today's 120 ms quad dissolve reads the fade-weighted head 0.252 of the gap in its worst frame, 0.018 in its first, shows the lesser painting over 0.15 for 54 ms and peaks at 0.434 (double-image
severity 0.41 at an overlap of 0.05). The shipped blend (capped cross, cosine ease, 140 ms): 0.258 / 0.017 / 46 ms / 0.332 (severity 0.32). A pair that agrees (k = 1, 120 ms party / 140 ms foes): 0.215 and 0.185 in the worst frame
against 0.252 and 0.219. The lesser painting never shows more than 0.382 at any frame rate; the body thins to 0.76 at the crossing for a pair that shares nothing (see "What still looks wrong").

### Idle (measured in the real game, 480-frame clips of both chapters, `clips/idle-breath-trace.png`)

Whole-figure squash about the feet, each way: today 0.00 percent on every painted figure (the chest-band swell replaces it, which the scale does not show), demo 0.79 to 0.97 percent; periods 3.0 to 3.7 s (2.6 s for a figure in `ready`:
the posture's faster tempo); sway 0.009 to 0.014 rad on periods of 5.5 to 8.5 s (today 0.009 rad on 4.3 to 4.4 s for everyone); phases golden-ratio dealt.

### Hit feel (the clips' timelines)

Chapter I attack, Tidus on Mortiorchis (148 of 4,000 HP): today 2 frozen frames (the FFX light hold, 40 ms), peak trauma 0.17, warm flash 12 frames; demo one frozen frame plus the 4 ms remainder (a weak blow, 21 ms), peak trauma 0.26, white flash
5 frames (0.86 to 0.07). Chapter I KO clip, Seymour Flux on Tidus: today 2 + 2 frozen frames, trauma 0.17; demo 1 + 4 (a strong blow, 50 to 80 ms), trauma 0.55 (camera offset 0.16 x 0.55 squared = 0.048 unit, about 7 px at the battle camera's 148 px a unit).

## Clips

`D:/Tools/pyrefly-scratch/2026-10-20/demo-motion/clips/` (1600 x 900 at 60 fps; recorded with real keys on Playwright's paused clock, so every frame is exact; the HUD is in the frame). Each `*-today-vs-demo.mp4` is side by side, 960 x 540 each; full size
singles of the first two are in `full/`.

| Folder | Clip | What it shows |
|---|---|---|
| `ch1-seymour-flux-FFX/` | `01-attack-and-hit` (11.7 s) | the party idle, Tidus attacks Mortiorchis: the lunge, ready/attack/follow swaps, the blow's flash, hold, shake and the foe's hurt swap |
| | `02-hurt-and-KO` (7.6 s) | party HP set to 1 (the one debug write), Seymour Flux's Lance of Atrophy downs Tidus: hurt swap, shake, the KO collapse |
| | `03-party-idle` (8 s, cropped on the party) | the breathing and sway |
| | `04-pose-swap-slow-x4` (9.6 s) | Tidus ready to attack and the blow, cropped, at a quarter speed |
| `ch4-bahamut-FFX2/` | the same four, Paine attacks Bahamut (hurt swap on the boss at a quarter speed), Bahamut downs Paine (12.3 s) | |
| `rig/` | `lulu-v2-rig-poses-flip-vs-crossfade`, `...-slow-x4-defend` | rig only: the real `lulu-v2` file, `defend` (the front-view upper body shown from hidden, five parts hidden) and `od-fury`, flip at 0.5 against the cross-fade |
| | `contact-sheet.png`, `idle-breath-trace.png` | key frames of both chapters, today above demo; the squash traces |

Frames in `../rec/<chapter>-<scenario>-{off,demo}/f####.jpg` with a `timeline.json` (pose, fades, HP, flash, scale and the option-C state a frame).

## What still looks wrong

Looked at in the frames (I cannot play video: Bailey judges the clips; every claim below is from stills and numbers):

1. **The double image of two very different paintings is not fixed, only made lighter.** Tidus ready to attack (Chapter I, `clips/.../04-pose-swap-slow-x4`, frames 124 to 127 of the attack clip): in both builds two Tidus show at once for about
   4 frames, one crouching and one lunging; the demo's is a little less opaque and shorter (the capped cross never shows both over 0.382) but it is still a double exposure. No dissolve of two paintings that share 14 percent of their outline
   can hide it: it takes an in-between painting (the smear frames of decision 133d, format v2 image variants), a rig, or a motion smear (a directional blur over the swap, a shader change not built: it needs Bailey's pick, rule 9).
2. **The thinning.** The capped cross takes the body to 0.76 at the crossing. On a big painting (Bahamut's idle to hurt, frames 151 to 152 of Chapter IV's attack clip) the wings go greyish and see-through for 2 to 3 frames, in both builds
   (today's plain dissolve does it too, from the two paintings' own overlap); the demo's is no worse, but it is not good.
3. **Weak hits hold less than today's FFX.** An ordinary hit (Tidus on Mortiorchis, 148) is a 21 ms hold (1 to 2 frames) where today's FFX light hold is 40 ms; the brief's classes put it there (weak 0 to 30 ms; the strong class starts at
   power 0.3: any blow under 1,200 damage that is under 12 percent of the target's HP is weak). Strong and finishing blows hold longer than today's (50 to 80, 100 to 150 against 40 and 85) and shake more (trauma 0.55 against 0.17; the HUD's pixels did not move in any frame, the scene
   moved 3 px on the strong hit and 19 to 24 px on the camera's own cut).
4. **The white flash and option C's bloom stack.** For its 5 frames the struck figure is pure white where option C's impact bloom already sits on it (Chapter IV f153): on a big painting the blow reads as a white blob; REDUCE FLASHES softens it
   (0.35) but I did not look at that setting.
5. **Breathing is subtle.** 0.79 to 0.97 percent about the feet is 2 to 3 px of a 330 px figure at 1600 x 900: the breath reads beside the chest swell, not by itself, and it does not make an attack painting less stiff. The sway (0.014 rad, 0.8 degree)
   is more visible than the squash.
6. **The rig cross-fade is a double exposure too, for the same reason.** Lulu's `defend` (side-view upper body to front view, `clips/rig/`): 3 frames of the two views overlaid, then the front view. It is a clear improvement over the pop at 0.5
   (`rig/` clips, flip against fade) and still not a morph. Bahamut-x was tested through its real `rig.json` in `tests/unit/rig/rig-fade-real.test.ts` and not in a live chapter: Chapter IV's boss is a different art id than `bahamut`, so the alias
   does not reach it there (`ffx2-bahamut-attack-rig-*` in `rec/` shows a painted boss); FFX's Bahamut needs a summon, which I did not stage.
7. **The harness cannot judge Bahamut's feet.** His silhouette-read stance differs by over 1,000 px between paintings, so the feet reading of every swap is a large number times a small fade step: three builds read 3, 3 and 2 jerks of 40 px or
   more with worst values of 105, 62 and 48 px. Read Chapter IV's head readings, the ghost severity and the clips, not that one number.
8. **KO swaps are still the largest jerks** (Kimahri ko to idle 47 px, idle to ko 41 px, a lying painting against a standing one that share 0.3 percent of their outline): the KO cross is 100 ms instead of 75, the topple is the existing one.
9. **Not built, needs a yes:** the smear, a hit squash on the struck figure, the title screen and menus' figures (they breathe through the same constructor but nothing else was changed), anything for FF7.

## Tests and checks

- `npx tsc --noEmit` clean (`node "D:/Final Fantasy/node_modules/typescript/bin/tsc" --noEmit -p .`).
- New unit tests (all pass): `tests/unit/engine/demo-blend.test.ts` (13: the pure blend, the capped cross against today's quad frame by frame at 30, 60 and 144 fps, the real `PoseBlend` with `retune`), `demo-blend-actor.test.ts` (7: the real
  `PaintedActor`: lengths, caps, a cut stays a cut, a reversal is not re-timed), `demo-idle.test.ts` (10: the numbers, the dealt phases, the real actor's squash, a rig's idle left alone), `demo-hit.test.ts` (18: power, the stop's classes and ranges
  across all power, multi-hit first and last, trauma, option C's plan with the flag, the flash, the beat's two modes, `HitStop` holding the field clock only), `tests/unit/rig/rig-fade.test.ts` (15: the pure fade, the reader's `fadeMs`, the real
  `RigActor`: ghost, real clock under a hit-stop, hidden to shown and shown to hidden, `fadeMs` 0, a snap, a change in the middle of a fade, alpha, dispose, no ghost without the switch) and `rig-fade-real.test.ts` (6, skipped without the art
  mirror: bahamut-x, lulu-v2 and lulu v1 on their real files, every key from the idle).
- The three goldens (`ff7-golden`, `ffx-engine-golden`, `ffx2-atb-golden`: 27 tests) pass unchanged; `src/battle/**` is not in the diff. `critic-continuity-*` (policy, pure, rig, contract, runners) and `tests/unit/rig/` pass. `node tools/orphans.mjs`: none of the new modules is an orphan.
- Layering: `src/engine/motion/Demo*.ts` and `rig/RigFade.ts` import no DOM and no `three`; `RigGhost.ts` and `RigFigure.ts` do (as the rig files always did). Every new file is under 400 lines; `PaintedActor.ts`, `BattlePresenter.ts` and `RigFigure.ts` grew by 10 to 20 lines each (the first two were over 400 before).
- The switch changes nothing without it: every hook asks `demoMotionOn()` first (tests pin the old numbers: 0.016 breath, 120/140 ms blends, the warm 200 ms flash, option C's 85/40 ms).
- Tools: `PYREFLY_QUERY` for the route harness (`critic/runner/lib/route-evidence.mjs`, README), the rig probe skips a part's ghost mesh. The recorder, the harness driver and the assemblers are scratch (`D:/Tools/pyrefly-scratch/2026-10-20/demo-motion/`: `clip.mjs`,
  `cont-run.mjs`, `cont-compare.py`, `build-clips.py`, `assemble.py`): one Vite and one browser at a time, the `RIG-RECORD` lock, stopped by PID.
- Not done: NOW.md and the ledgers (the driver's); a focused review; a deploy.
