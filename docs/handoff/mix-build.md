# mix-build: the MAX mix (D-316) built into the game, every part behind the EYE CANDY seam (D-317)

Branch `mix-build` from `ef3f6bbf` (main = release 35), worktree `D:/pyrefly-fb-camera`. **Not pushed, not deployed.**
Decisions: D-316 (Bailey 2026-10-01, "all your recommendations, godspeed": the recommended MAX mix), D-317 (the
switches on one EYE CANDY page, built by the eye-candy-page agent in `D:/pyrefly-advisor-v4`), D-318 (the Clair
Obscur / Persona camera grammar waits for Bailey's camera-lab pick: **not built here**: no command, action or target
cut, no hero-attached menu; the calm camera stays and the HUD never moves with the camera). Source of the port: the
prototype branch `candy-max-proto` (`D:/pyrefly-r29-plate`, ae67b1bc, never merged, never pushed), its refine commits
c046ce8a (A's blackout fix) and 18a3fb10 / ae67b1bc (C's re-staged masters, the menu clearance, `?candy=mix`), the
judges' record `docs/concepts/eye-candy-max-2026-10-01/JUDGE.md` and the refined-mix section of the options page
(the three judges' must-fix lists).

Save-data class by D-317 (new settings rows): **a deep review before deploy**. This branch adds no settings row and
does not touch `src/app/SaveData.ts` or the settings schema; the rows come with the eye-candy-page branch.

## The seam

`src/engine/fx/eyeCandyFlags.ts` is byte for byte `D:/Tools/pyrefly-scratch/2026-10-02-rel35/eyeCandyFlags.ts`
(sha256 B96C21BE..., LF), the file the eye-candy-page agent creates too, so the two branches merge cleanly. Until the
settings layer installs a provider every key is on (D-297: default on).

`src/engine/fx/mix/gates.ts` decides, every frame, whether each of the nine parts plays: its own row
(`eyeCandyOn('<part>')`), its look through the seam (`eyeCandyOn('cinemaLight' | 'livingPaintings' |
'battleSpectacle')`) **and** as main reads the OPTIONS row today (`eyeCandy.enabled(a | b | c)`, so `?fx=off` and a
look switched off stop its parts), REDUCE MOTION and the tier:

| Part (key) | Look | Tiers | REDUCE MOTION | Game |
|---|---|---|---|---|
| DEPTH OF FIELD (`depthOfField`) | CINEMA LIGHT | full only (the phone and LOW keep today's tilt-shift) | the band holds still (no held shots) | both |
| FOG (`fog`) | CINEMA LIGHT | full, phone; off under LOW EFFECTS | the drift stops | both |
| SMOOTH EDGES (`smoothEdges`) | CINEMA LIGHT | SMAA (full), FXAA (phone), no post pass under LOW; the defringe on every tier | unchanged (no motion) | both |
| BREATHING (`breathing`) | LIVING PAINTINGS | grid 12x24 / 8x16 / 6x12 | still (off) | both, FFX-2 at 0.8x the period |
| KO COLLAPSE (`koCollapse`) | LIVING PAINTINGS | all | a plain cut to the KO painting | both, 220 ms FFX / 170 ms FFX-2 |
| CHAPTER FRAMING (`chapterFraming`) | BATTLE SPECTACLE | all (the phone keeps today's rig, see below) | unchanged (a static master) | both |
| OVERDRIVE SHOT (`overdriveShot`) | BATTLE SPECTACLE | desktop (the phone holds the master) | no hero shot (the banner rule stays) | **FFX only** |
| DRESSPHERE SHOT (`dressphereShot`) | BATTLE SPECTACLE | desktop (the phone holds the master) | no close shot | **FFX-2 only** |
| SPLASH ART (`splashArt`) | BATTLE SPECTACLE | all | unchanged (today's splash is already calm under it) | both |

## What was ported, from where

All new code is in `src/engine/fx/mix/` (every file under 400 lines). Hooks: `fx/b/LivingPaintings.ts`
(bind / update / release the mix with LIVING PAINTINGS' scene bind, every FFX and FFX-2 battle, FF7 never; 375 -> 379
lines), `app/screens/battleSpectacle.ts` (the splash asks SPLASH ART first; 159 -> 161), `debug/fxApi.ts`
(`__pyrefly.fx.mix`), `fx/c/FxPools.ts` (the NaN fix).

| From | Prototype | Here | Changed in the port |
|---|---|---|---|
| A | c046ce8a `c/FxPools.ts` | same file | as the prototype: `pow(max(vUv.x, 0.0), 1.3)` and the sprite ring's squares (main has no MSAA today; the shaders' output is unchanged without it) |
| A | `max/a/livingFigure.ts`, `livingShader.ts`, `livingRig.ts`, `tempo.ts` | `living.ts`, `livingShader.ts`, `breathRig.ts`, `patch.ts` | breathing and KO collapse only (no hair, cloth, blinks, weight or part life: not in the mix); the vertex patch goes onto the figure's own program (painted or LIVING PAINTINGS' sway) through one compile hook shared with the defringe, so either switches in any order; the grid replaces the sway's plane (it serves both); breathing 2.0 % of the plane (2.4 % on a colossus, 5 s), up from the prototype's 1.1 % the judges could not see; machines of parts and statues (Vegnagun, Sin, the pagodas) do not breathe; the `setPose` wrapper chains with `restPoses.ts` and is inert when the part is off |
| C | `max/c/masters.ts`, `staging.ts` | `geometry.ts`, `masters.ts`, `staging.ts` | the colossus master and BOSS SCALE only (the mix has no hero or field masters, no action cuts); figure boxes from the painted quads and, for bosses, the painting's own alpha (`Fig.mask`) |
| C | 18a3fb10 `max/c/clearance.ts` | `clearance.ts`, `hudPanels.ts` | the judges' **party-height floor**, **party overlap** and **boss cover** rules added; the fit takes the pose NEAREST the master that passes (the prototype took the biggest party); BOSS SCALE steps down (100, 70, 45, 25, 0 %) when a colossus cannot pass, and today's rig, then today's rig with the party stepped off the command menu, are candidates too, so the result is never worse than today by the rule; the HUD's columns (turn rail, command list, party rows) count as one block; predicted panels for the first plan (the battle-start moment hides the HUD); the advisor's docking band is kept for it; the phone counts its intent strip and skips its panel's top fade |
| C | 18a3fb10 / ae67b1bc `max/c/rigWatch.ts` | `rigWatch.ts` | both refinement fixes kept (live rigs until the first install, so Vegnagun keeps its D-228 rig; the field of view restored only with the position); the HUD's resting projector is **never** handed a held shot (the prototype's override moved the intent card); and it **adds no cut**: the prototype snapped the camera onto each new master (measured: a jump of 5.4 world units 2.3 s into Natus's battle start, on top of the presenter's own cut); here a master installed at rest waits for the presenter's next move or cut onto the resting rig, a move to it in flight is retargeted for the time it had left, and the lens shift travels with that move |
| C | `max/c/DioramaDirector.ts` | `framing.ts` | plans during the battle-start moment; every plan is decided on a calm frame (every figure at its place: no lunge, run or knockback in flight) and put on screen only once no menu is open; the live check at each menu's opening waits for a calm frame with the camera resting on the master (Active ATB opens menus mid-action) and re-plans only for a party failure, at most three times a battle, so no cut lands while a player is choosing, in either game; a colossus composes into one fixed area (the prototype read it from the HUD of the moment, which gave every re-plan a different composition) |
| C | `max/c/stageFx.ts`, `view.ts` | `cinema.ts` | fog bands, the depth-of-field band re-aimed per master and per held shot (focus and band; CINEMA LIGHT keeps its own blur), SMAA / FXAA before the grade |
| C | `max/c/relight.ts` (defringe part) | `defringe.ts`, `patch.ts` | the alpha edge tightened and the semi-transparent edge darkened; no normals, no relighting (not in the mix); the screen-pixel rim is already CINEMA LIGHT's (`KeyRim.ts`, 1.5 px) |
| B | `max/b/shots.ts` hero shot | `masters.ts` `heroShot`, `heldShots.ts` | candidates over size, place and turn, checked against the HUD as laid out (the input slab counts): the actor whole and clear, every other party member whole and clear or wholly out of the shot; no passing framing, no shot |
| C | `max/c/masters.ts` `closeShot`, `director.ts` | `heldShots.ts` | the spherechange close shot (FFX-2), the same check over its own candidates (the girl at 68 % down to 40 % of the frame's height, five places across, four heights); held 1.6 s or until she is quiet, at most 3 s; handed back the frame a menu opens |
| B | `max/b/keyArt.ts` splash crops | `splash.ts` | the focal box is measured at runtime from the installed painting's alpha (the prototype's table predates release 35's keys): FFX-2 Bahamut's approved splash and an aeon's Overdrive painting whole, else the attack (then cast) painting's upper body; never upscaled |
| B | `max/b/motionFigure.ts` spherechange keys | `twirl.ts` | the **slot** only: a girl's change plays `characters/<figure>/twirl-*.png` (the new dressphere's figure, then the old one, then any of her figures) in order inside today's 0.8 s beat, replacing the white flash, the screen wash and the flourish's white column; with no keys installed (now) today's flourish plays unchanged |
| new | (judges' must-fix) | `odBanner.ts` | the Overdrive name slab takes the first height at which it covers no party member |
| new | (found in the build) | `heldShots.ts` `followFlourish` | the spherechange flourish (light, motes, ring, name plate) follows its girl into the close shot; it is anchored once, before the cut |

## Where CHAPTER FRAMING lands, chapter by chapter

| Chapter | Master | Why |
|---|---|---|
| Ch X Natus (FFX), Ch IV Bahamut (FFX-2) | **colossus master, full BOSS SCALE** (Natus 212 -> 506 px, Bahamut 407 -> 558 px at the first menu) | passes every rule |
| Ch I Flux, Ch III BFA, Ch VIII Evrae, Ch XVI Ixion | today's rig, with the clearance's step (lens shift and, where needed, the party stepped off the command list) | BFA and Evrae: no colossus size passed the rules (BFA's right pagoda goes under the turn rail or Tidus under the menu; Evrae's coils cover Rikku more than today and its head takes the NEXT BEST MOVE band). Ch I and Ixion are not colossus fights (the mix has no hero or field masters) |
| Ch V Vegnagun, Sin | today's rig exactly (D-228, field of view 40) | approved authored masters; the party stands whole and clear in them today |
| every chapter on the upright phone | today's rig and the scene's own slice fit (A-12), clearance on top | a grown boss made A-12 stand the whole rig back and shrink the party under its floor (the prototype's Evrae: 105 -> 91 px) |

## The camera through a fight: the battle start and the re-plans

**The battle start** (`opening-probe.mjs`, every frame's camera move for 9 s): the mix's cuts are today's cuts. Ch X,
Ch IV and Ch I each show today's two cuts (the opening shot, the boss reveal) and the move back out, which now lands
on the master; the first plan (2.3 to 3.2 s in) moves nothing. Before this was fixed, the first plan snapped the
camera onto the master: Ch X jumped 5.4 world units in one frame at 2.3 s, a third cut.

**Re-plans** (`replan-probe.mjs`, the default command at every menu, desktop, seed 1). The first master is planned in
the battle-start moment against predicted panels; the live check at each menu's opening compares the frame with
the HUD as laid out and asks for a re-plan when a party member fails, at most three a battle. Before the calm rule
the probe saw Bahamut re-composed three times in 51 s (557, 549, 424 px with today's rig, 455 px at a 0.45 BOSS
SCALE) and Natus twice in three menus: the live check judged frames mid-action (Active ATB opens a menu while an
action plays) and every re-plan composed into a rectangle read from the HUD of that moment (collapsed during the
battle start, laid out after). Now a plan is decided only on a calm frame (no figure mid-lunge, run or knockback),
the live check also waits for the camera to rest on the master, the plan reaches the screen with the camera's next
move once no menu is open, and a colossus composes into one fixed area. Final build: **Ch IV** two plans, the second
(decided at the first menu against the real panels) easing the lens shift from 128 to 64 px and 36 px up; Bahamut
at full BOSS SCALE through ten menus (506 to 576 px at the menus, the spread being the presenter's own action
moves); one more re-plan asked for at the ninth menu (Paine 0.13 under a card). **Ch X** two plans (the stand-back
1.04 -> 1.00), Natus 503 to 509 px through eight menus. Ch I re-plans when a KO'd Yuna lies by the party rows (no
candidate clears a lying figure there; the least bad is kept, a 4 % stand-back step).

## The judges' must-fix list, with numbers

Measured headless on the real GPU (RTX 5070 Ti, D3D11), seed 1, real keys from the first command menu, live
figure boxes (each painting's drawn quad through the live camera) against the HUD's named cards, today = pristine
main ef3f6bbf served from a copy of its `src`, mix = this branch. "Under a card" counts the command list, turn rail,
party rows, guide, advisor, Sensor, intent and coach cards. Capture library and raw JSON:
`D:/Tools/pyrefly-scratch/2026-10-02-mix/` (`moments.mjs` menus, `flows.mjs` held shots, `perf.mjs`, `onoff.mjs`,
`opening-probe.mjs`, `replan-probe.mjs`, `advisor-probe.mjs`; `work/*.json`, stills in `out/`; the final build's
menus are the `final5` captures).

**Party-height floor (today minus 10 %), desktop, first command menu / the menu after one action:**
Ch I 284 -> 277 / 260 -> 250; Ch III 297 -> 284 / 328 -> 310; Ch VIII 243 -> 244 / 265 -> 261; Ch X 216 -> 207 /
224 -> 226; Ch IV 284 -> 283 / 296 -> 293; Ch V 160 -> 160 / 159 -> 160; Ch XVI 277 -> 280 / 288 -> 286. All above
the floor (the prototype's Ch I 285 -> 232, Evrae 244 -> 211 are gone). **After a spherechange** (Ch IV, the next
menu): 271 to 322 px over every run that reached one (today 297, floor 267; the judges' prototype frame had the girls
at about 100 of 720). Phone (390x844, first / next menu): Ch I 118 -> 130 /
106 -> 117, Ch VIII 104 -> 104 / 113 -> 112, Ch X 124 -> 126 / 130 -> 131, Ch IV 128 -> 129 / 131 -> 130, Ch V 93
-> 93 / 93 -> 93, Ch XVI 75 -> 76 / 77 -> 77; Ch III 131 -> 117 / 141 -> 128 is **one pixel under the floor at the
first menu** (118) in every run, where today's own phone frame varies 110 to 131 between runs (the scene's slice fit
settles differently); the mix brings BFA's right pagoda into the phone's slice there (92 % in view, today 44 %).
Every phone party member under a card: 0.00 in both builds.

**Party overlap (Evrae: Tidus must not hide Wakka):** Ch VIII 0.00 -> 0.03 (first), 0.02 -> 0.01 (next menu); the
rule caps every master at today's overlap plus 3 % in its own depth-aware measure (`clearance.ts`, unit-tested).
The capture's box overlap elsewhere, today -> mix, first / next: Ch I 0.40 -> 0.37 / 0.08 -> 0.11, Ch III 0.33 ->
0.40 / 0.31 -> 0.24, Ch X 0.35 -> 0.31 / 0.21 -> 0.12, Ch IV 0.14 -> 0.00 / 0.13 -> 0.00; phone Ch IV 0.16 -> 0.16
/ 0.14 -> 0.14 (one other run: 0.23 / 0.24). **Ch III's first menu is worse than today** (Tidus's ready lean in front
of Auron): the first plan is fitted to the figures as they stand during the battle-start moment, before Tidus leans
in for his menu; the fit's own measure passed it (today's 0.33 plus 3 %). Disclosed, not fixed; so is the phone's Ch
IV spread.

**HUD clearance while a menu is open, desktop (worst party member under a card, first / next menu):** Ch I 0.50 ->
0.14 / 0.63 -> 0.31 (what is left: Yuna's staff tip under the Sensor card, which opens on a reveal and folds itself
after 7 s, and the KO'd Yuna lying by the party rows; 0.14 to 0.23 at the first menu over three runs); Ch III 0.45 ->
0.10 / 0.40 -> 0.13; Ch VIII 0.25 -> 0.00 / 0.25 -> 0.00; Ch X 0.13 -> 0.00 / 0.00 -> 0.00; Ch IV 0.11 -> 0.05 /
0.40 -> 0.06; Ch V 0.05 -> 0.05; Ch XVI 0.00 -> 0.00 / 0.15 -> 0.11. Boss parts in view: 1.00 everywhere except
Vegnagun's Tail, 0.75 (bigger than the frame in D-228's approved view, as today).

**NEXT BEST MOVE at the first menu:** shown in every desktop chapter in both builds. The menu captures miss it at
Ch V's first menu in the mix in each of their three runs, and `advisor-probe.mjs` shows why: sampled every 250 ms
from the moment the menu opens, the card is up, at the same place in both builds, at each of the first three menus;
the mix's battle start runs 0.1 to 0.3 s later on Vegnagun (its longest early frame 625 ms against today's 348 ms,
the patched shaders compiling), so the capture's fixed delay lands before the card. FFX desktop keeps a docking band
for the card in the top band; FFX-2 desktop keeps its band at the bottom (the first Bahamut frame put Paine's feet
under it: 0.30 -> 0.06). At later menus the card comes and goes with the advisor's own zone solver in both builds (Ch III:
today and the mix both take it down at Auron's and Yuna's menus in one probe run and keep it in another).

**Paine inside Bahamut's silhouette:** the boss-cover rule reads the painting's own alpha (`Fig.mask`), not its box;
Ch IV first and next menu: no girl inside Bahamut's painted pixels (boss cover 0.00 in the fit and in the live frame).

**No cut while an FFX-2 girl's menu is open:** a master reaches the screen only with the presenter's own move once
no menu is open (the mix adds no cut of its own); the dressphere shot never starts with a menu open and hands back
the frame one opens. Held-shot frames with a menu open, over every spherechange run: 0.

**Overdrive name banner over the actor (FFX):** the slab's worst cover of a party member while it is up: today 0.09
to 0.19 (Tidus), mix 0.00 (the slab hangs at 22 % instead of 50 %); under REDUCE MOTION too (it moves nothing).

**The intent card in the held spherechange shot:** the HUD's resting projector is never handed a held shot, and the
intent card, its chip and the Sensor card step out for the shot (`html.mix-held`); intent-over-coach overlaps
during the shot: 0.

**The FFX Overdrive hero shot:** fires through the real input (Ch I, Spiral Cut; Tidus's gauge INJECTED to 100,
labelled so in `flows.mjs`). The cut waits until the input slab has landed (0.3 s) and is framed against the slab
where it sits; the first passing framing among the candidates (size, place on screen, turn) is the shot, one search
per input (3.3 to 3.8 ms). The four runs on the last builds: Tidus 393 to 394 px of 900, whole and clear of the slab
and of every card (0.00 / 0.00), Yuna whole (0.06 under a card), Kimahri whole and clear; the cut back when the
input ends. An earlier, narrower candidate set found no passing framing in one run of three, and the master held, as
the rule says. Phone: off (the master holds). REDUCE MOTION: none.

**The FFX-2 dressphere shot:** fires on a real spherechange through the girl's menu (Ch IV, Rikku or Yuna to
Gunner). With the close-shot candidates as built (the girl at 68 % down to 40 % of the frame's height, five places
across) it fired in all nine runs since they were widened; with the first, narrower set it fired in one run of three
(none passing leaves the master on screen, as the rule says). The cut 231 to 250 ms after the confirm (the party 412
to 563 px in the shot, the girl 40 to 60 % of the frame), handed back the frame the next menu opened (769 to 1766
ms); an earlier Yuna run handed back after 1.6 s with her quiet. Held-shot frames with a menu open: 0 in every run;
the intent card over the coach card: 0; the next menu's party 309 to 322 px (today 297, floor 267). **The flourish
follows its girl:** today's spherechange light, motes, ring and name plate are anchored once, before the cut, so in
the first close shots they played over Yuna while Rikku changed; they now follow the girl through the camera on
screen (`followFlourish`). Phone: off. REDUCE MOTION: no close shot (`shots.sc` 0), the flourish as today.

## REDUCE MOTION (headless `reducedMotion: 'reduce'`)

No hero shot and no dressphere shot (`shots.od` / `shots.sc` 0); BREATHING still (chest 0, today's own figure
breathing as today); KO COLLAPSE is a plain cut (`cuts` 1, the KO painting on the next frame, no buckle); the fog
holds still; the master and the banner rule unchanged.

## BREATHING and KO COLLAPSE

Breathing: the chest phase runs 0 to 0.026 of the plane's height (2.0 % amplitude, half-wave) while the actor's own
whole-figure scale stays at 1.000 (today: 0.979 to 1.021, the whole painting stretching). KO collapse, Kimahri at
Ch I: the standing painting held, the buckle 0.02, 0.14, 0.28, 0.47, 0.69, 1.0, then the cut to the KO painting at
about 220 ms (today: a 120 ms crossfade). Strip: `docs/screenshots/mix-build-ko-collapse-and-splash.png`.

## SPLASH ART

Ch I, Spiral Cut through the real input: today's slab shows `art/characters/tidus/attack.png` whole (816 x 1135);
the mix's shows the crop of its upper body (788 x 664, a blob URL), at the painting's own pixels.

## Frame times (12 s of autoBattle after a 6 s warm-up; `perf.mjs`)

| Run | today p50 / p95 / p99 / max | mix p50 / p95 / p99 / max | mix update per frame |
|---|---|---|---|
| Ch I desktop, vsync | 16.7 / 16.8 / 16.8 / 116.7 | 16.7 / 16.8 / 16.8 / 166.7 | 0.22 ms |
| Ch IV desktop, vsync | 16.7 / 16.7 / 16.8 / 16.8 | 16.7 / 16.8 / 16.8 / 33.4 | 0.23 ms |
| Ch VIII desktop, vsync (build before the calm rule) | 16.7 / 16.8 / 16.8 / 116.6 | 16.7 / 16.8 / 16.8 / 83.3 | 0.18 ms |
| Ch I desktop, uncapped | 1.7 / 2.4 / 3.5 / 67.6 | 1.9 / 2.9 / 7.5 / 64.7 | 0.17 ms |
| Ch IV desktop, uncapped | 2.4 / 3.1 / 4.8 / 19.7 | 2.7 / 3.7 / 6.1 / 19.1 | 0.12 ms |
| Ch I phone 390x844, CPU 4x | 16.7 / 16.8 / 16.8 / 133.3 | 16.7 / 16.8 / 33.4 / 150.0 | 0.60 ms |
| Ch IV phone 390x844, CPU 4x | 16.7 / 16.8 / 33.3 / 33.4 | 16.7 / 16.8 / 33.4 / 100.1 | 0.51 ms |

The mix column is the final code; today's runs and the first mix runs (on the build before the calm rule: 1.9 / 2.6 /
3.8 / 61.8 and 2.6 / 3.3 / 5.3 / 18.1 uncapped) had the GPU to themselves, the final runs shared it with the
overnight art renders, so their uncapped p99 and their spikes are noisier. Desktop p95 16.7-16.8 ms in both builds
(the 60 Hz vsync interval; uncapped the mix costs about 0.2 to 0.6 ms at p95), phone tier p95 16.8 ms (budget 33).
The max-frame spikes (83-167 ms) are in today's runs too, at the same moments (shader warm-up on the first spells and
the battle-start card); frames over 33 ms on the throttled phone: Ch I 4 -> 6, Ch IV 6 -> 5. No real phone GPU was
measured (owed before the deploy, as the eye-candy judge asked on 2026-09-29).

The battle start is where the mix costs most (`opening-probe.mjs`, the longest frame in the first 2 s, where the
programs compile behind the battle-start card): Ch V 348 -> 625 ms (a second load: 420 -> 554 ms), Ch X 444 -> 407
ms. The patched figure programs (defringe and breathing) and SMAA compile there; warming them with the diorama's own
programs (`warmShaders`) is a follow-up, not done here.

## ON/OFF (every part off through the seam is today)

`__pyrefly.fx.mix.parts(false)` installs `setEyeCandyProvider(() => false)` before the battle; the frame is compared
with pristine main at the same moment (fx frozen), seed 1, on the final build. Structure identical: the same composer
passes (no SMAA or FXAA), no view offset, the camera on today's rig (within the idle sway), today's tilt-shift focus
and band, no fog band, the figures on their own 6x12 sway planes with no mix uniforms, today's whole-figure breathing
(0.016), the party at today's height (Ch I 288 / 287, Ch IV 280 / 284, phone 119 / 116 px). Pixels (mean absolute
difference, 0-255), mix-off against today and today's own run-to-run: Ch I desktop 4.9 against 4.5; Ch IV desktop
7.4 against 6.4; Ch I phone 8.3 against 10.0. With the parts on: 25.3 and 28.0 (desktop), 11.8 (phone; FXAA, no
colossus, no bokeh). Unit tests pin the gate side (`tests/unit/fx-mix-gates.test.ts`).

## Gates

- `tsc --noEmit`: clean.
- Full unit suite on the final code (`vitest run --testTimeout=60000`): 742 files passed, 5 skipped; 10,895 tests
  passed, 40 skipped, 1 todo, 0 failed (an earlier run caught `scene.add` on the screen tests' stub scene;
  `bindMaxMix` skips a stub scene). New: `tests/unit/fx-mix-gates.test.ts` (9), `fx-mix-clearance.test.ts` (12:
  the rules, the calm frame, the no-cut install, the fixed composition area), `fx-mix-parts.test.ts` (13).
- `node tools/orphans.mjs`: 24 orphans, none new (every `fx/mix` module and the seam are reachable).
- Rule 7 (`wc -l`): every new file under 400 lines (largest `framing.ts`, 372); `LivingPaintings.ts` 375 -> 379,
  `FxPools.ts` 345 -> 349, `battleSpectacle.ts` 159 -> 161, `fxApi.ts` 56 -> 56; `PaintedActor.ts`, `BattleScreen.ts`,
  `BattleCamera.ts` and every HUD file untouched.

## Game case (rule 14)

Both games for the plumbing and seven parts; OVERDRIVE SHOT and its banner rule FFX only; DRESSPHERE SHOT and the
twirl-key slot FFX-2 only (research/ffx-vs-ffx2-presentation.md section 6.1: FFX has no spherechange, FFX-2 no
Overdrive input); per-game values inside the shared parts: FFX-2's 4 degrees wider colossus lens and looser spread
(research 9, perspectives B.1), FFX-2's 0.8x breathing period and 170 ms collapse (inside today's action length under
Active ATB), the advisor's docking band per HUD. FF7 never binds the mix.

## Open items (for the driver and the deep review)

1. **Rule 9 / targets:** the colossus masters re-compose approved battle tiles (Natus, Bahamut); each needs a side
   by side and Bailey's yes before it ships as an approved composition. The screenshots below are that side by side.
2. **Save-data class:** the switches come with the eye-candy-page branch; deep review before deploy (D-317).
3. **The Sensor card over a colossus at the first menu** (Ch X: Natus's legs and Mortibody until the card folds
   after 7 s; Ch I: Yuna's staff tip). The card opens on a Sensor reveal and places itself; the framing does not
   chase it (a colossus would otherwise be dropped mid-fight). The intent card likewise hangs over its boss's head
   by design and can overlap a colossus's wing (Ch IV 0.28-0.31 of Bahamut's painted pixels).
4. **Evrae and BFA keep today's size** (the colossus masters fail the rules there; see the table above). Making them
   pass needs a different staging (a lower master for Evrae that keeps the advisor band, or the pagodas stepped in
   for BFA): a new options question, not a port.
5. **The first plan of a session uses predicted panels** (the battle-start moment hides the HUD); when the live HUD
   differs (the guide's height, the Sensor card), a re-plan is decided on the next calm frame and reaches the screen
   with the presenter's next move onto the resting rig (no cut of its own, never with a menu open), at most three a
   battle. Remembered panels make every later battle in the same layout right from the start. The guide card grows
   and shrinks with its text and is remembered at its tallest, which can ask for one more re-plan in a long fight.
6. **Phone:** held shots are off on the phone (a slice the HUD slides; the judges' phone crops); colossus scale too
   (A-12). No real phone GPU measured.
7. **Twirl keys:** the slot is built and unit-tested; no key is installed (the overnight candidates in
   `D:/Tools/pyrefly-art-backup/candidates/2026-10-02-overnight/spherechange-keys/` wait for Bailey's pick). The
   install puts `twirl-start/mid/end.png` (+ sidecars) under a girl's dressphere folder; the manifest then lists them.
8. **Camera lab (D-318):** no file of `BattleCamera`, `ComfortCamera`, `ShotRules` or the presenter's camera calls
   changed; the mix wraps the battle camera's `moveTo` / `snapTo` on the instance, re-registers its `idle` and close
   rigs at runtime, retargets a move onto `idle` that is in flight when a master is installed, and sets a view offset
   (the lens shift) on the render camera (`rigWatch.ts`, `framing.ts`). Worth a line to the camera-lab session before
   both meet on main.
9. The judges' animation note stands: breathing and the collapse are small motions by design (comfort); the visible
   animation gain the judges asked for comes with the approved pose keys (D-313/D-314, installed in release 35).
10. **The battle-start hitch:** the patched figure programs and SMAA compile behind the battle-start card (Ch V's
    longest early frame 348 -> 625 ms). Warming them with the diorama's programs is a follow-up.
11. **A re-plan's fog and depth-of-field band** are set when the plan is committed, while the camera may still stand
    on the previous master until its next move (a fraction of a second in FFX-2, the rest of the action in FFX).
12. **Phone Ch III:** the party is one pixel under its floor at the first menu (117 against 118) in every run, inside
    today's own run-to-run spread on the phone (110 to 131).

## Screenshots

- `docs/screenshots/mix-build-ch1-flux-desktop.png`, `mix-build-ch10-natus-desktop.png`,
  `mix-build-ch8-evrae-desktop.png`, `mix-build-ch4-bahamut-desktop.png`: first menus, today against the mix.
- `docs/screenshots/mix-build-overdrive-desktop.png`: the hero shot through the input and the banner.
- `docs/screenshots/mix-build-spherechange-desktop.png`: the dressphere shot.
- `docs/screenshots/mix-build-phone.png`: the phone, Ch I, X, IV, V.
- `docs/screenshots/mix-build-ko-collapse-and-splash.png`: KO collapse strip and the splash crop.

## How to look at it

`npm run dev`, then any FFX or FFX-2 chapter: the mix is on by default. `__pyrefly.fx.snapshot().mix` reports the
parts, the master and its fit, the held shots and the cost; `__pyrefly.fx.mix.parts(false)` turns every part off,
`parts(['fog', 'breathing'])` those two, `parts(true)` all back on (captures and checks only; the settings layer
owns the real switches).
