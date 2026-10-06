# r392-motion: REDUCE MOTION shortens the lunge, and Bahamut's reveal keeps Yuna in frame (release 39.2 candidate)

Branch `r392-motion` (from `origin/main` 30e7d701, release 39.1), worktree `D:/pyrefly-critic-continuity`. Not merged, not deployed. Bailey, 2026-10-06 about 12:45 EDT, through the driver: "Ok I approve of all of the above" and "yes, include those three too":

- **Lighting: hold** (nothing to build; nothing was touched).
- **REDUCE MOTION shortens the attack lunge.**
- **Chapter IV Bahamut reveal: shrink the camera push so Yuna stays in frame.**

## Game case (AGENTS.md rule 14, CHK-021)

| Change | Case | Why |
|---|---|---|
| REDUCE MOTION lunge | **Both games.** FFX: party and fiends. FFX-2: fiends only | The setting and the solved lunge (r391-reach) are shared plumbing. In FFX-2 the girls have no run-in under REDUCE MOTION (`MotionGate`: nothing runs under it), so `RunInMotion.reachFor` is false for them and their lunge was never solved: they play the house 1.4 with the setting on or off and there is nothing to shorten. FF7's own melee port is untouched |
| Bahamut reveal | **FFX-2 only, desktop only** | `ShotRules.reveal` is gated on `ffx2Framing` and not the phone (B5's own gate). FFX keeps its `fittedPush` reveal |

## 1. REDUCE MOTION shortens the lunge (`d8151a63`)

**How REDUCE MOTION is read today.** `Settings.reduceMotion` (the pause row REDUCE MOTION, saved in the profile) **or** the OS `prefers-reduced-motion`, both through `prefersReducedMotion()` (`src/ui/common/transitions/reduceMotion.ts`). The presenter reads it through `MomentsPort.reduceMotion` -> `BattleMoments.reducedMotion` (`ctx.moments.reducedMotion`: the one `motionAllowed`, `KeySlots` and the beats already use); the stage reads the same function through `battleComfort()` for the camera and the sway. r391-reach's lunge did not read it.

**What it does.** `lungePlan` (`src/engine/motion/StrikeReach.ts`, takes a `LungeCtx`: `{ stage, moments? }`, the old `{ stage }` still fits) solves the lunge as before, then with REDUCE MOTION on returns `calmLunge(start, solved)` = the start plus **half** of what the solver added (`CALM_REACH_SHARE` 0.5), never under the start, never over the solved distance. The house part (`plan.house`) is unchanged, so the extra still rides the eased step (`reachOffset`: no first-frame kick, no overshoot); the move keeps its 440 ms, its apex at 0.58 and its contact hold. No timing, engine state or RNG: the FFX-2 ATB pacing is untouched. Counters (0.6 start) go through the same plan.

**Half of the extra, or cap at 1.4 (the choice the brief left to "whichever reads better").** Half. A cap at the pre-r391 1.4 puts every long strike back where it stopped short (Tidus 138 px short of Seymour Flux, Ixion 231 px, `docs/handoff/r391-reach.md`); half the extra still closes about half of each gap for half the added travel, never over 2.9 units (4.4 with the setting off). A cap is one constant away (`CALM_REACH_SHARE = 0`). Measured below on real strikes.

### Measured (real keys to the first menu, then an Attack-only strategy; seed 1, drift pinned at 16.4 s; 1600x900 headless GPU Chromium; the build is `vite build` with `BASE_PATH=/` served by `vite preview`; REDUCE MOTION by the OS preference, `reducedMotion: reduce`, which `prefersReducedMotion()` reads; the pause row reads through the same function)

The probe wraps `PaintedActor.lunge` and records the distance asked and, frame by frame under the live camera, the closest painted gap (the alpha chamfer of r391-reach; 0 is touching). Same chapter, same seed, off then on:

| Chapter | Strike | Lunge asked, off > on | Closest painted gap, off > on |
|---|---|---|---|
| I (FFX) | Tidus, first Attack | 2.85 > 2.15 | 4 px > 78 px |
| I (FFX) | Kimahri, two Attacks | 2.15 > 1.78 and 2.13 > 1.77 | 0 > 0 (still touches) |
| I (FFX) | Seymour Flux, Lance of Atrophy | 1.94 > 1.64 and 4.31 > 2.89 | 0 > 11 px and 0 > 149 px |
| I (FFX) | Mortiorchis, Cross Cleave | 1.40 > 1.40 | 0 > 0 (it already reached: unchanged) |
| IV (FFX-2) | Bahamut, 3 and 6 strikes (the on run is longer) | 4.40 x 3 > 1.40, 1.52, then 2.18 to 2.19 x 4 | 0 to 164 px > 0 px |
| IV (FFX-2) | Paine, Rikku (19 and 20 strikes) | 0.60 after their run-in > **1.40, no run-in** | 0 > 0 |

- With the setting off the party's and fiends' lunges are the ones r391-reach solved (up to 4.4); on, no lunge is over 2.9. The fiend's lunge in Chapter IV falls from a median 4.4 to 2.18 units and its screen travel (the box's own) from about 470 px to about 240 px.
- The FFX-2 girls with the setting on play the house 1.4 in place (no run-in, as `MotionGate` always did under REDUCE MOTION); with it off they run in and strike 0.6. That is the existing difference, not new.
- A different run reaches a different camera, so the same strike is not the same frame; Tidus's 2.85 > 2.15 is the first Attack of the first turn in both runs.
- Frames for the lunge were not kept: the apex frame of the setting-on run puts Tidus under the Tidus HUD plate (`r391-reach` "HUD panels cover the strike"), so a picture would show the HUD and not the lunge. The table above is from the probe's own records (`strikes-rm-*.json` in the scratch dir).

Tests (`tests/unit/r392-calm-lunge.test.ts`, 16): `calmLunge` (half, never under start, never over solved, never over 2.9); FFX with no port (off = the reach as today, house part 1.4; on = the start plus half of the extra on the same house part, the same 440 ms; a fiend; a counter from 0.6; a strike that already reaches stays exactly 1.4 on or off; no moments port = off); FFX-2's port (a fiend shortens; a girl with `reachFor` false is 1.4 on or off; a girl out on a run-in shortens from her 0.6); FF7's port 1.4 on or off; `PaintedActor.lunge` with the shortened extra never passes its distance, reaches it at the apex and ends at 0.

## 2. Chapter IV Bahamut reveal: Yuna stays in frame (`81ee5fe2`)

### What was wrong (found by measuring, and not what the note said)

`docs/handoff/r391-smaller.md` said the played rig keeps every girl ("fits at push 0") and the 0.12 push then takes Yuna out. That is not what the screen shows. B5's `frame()` measure poses a scratch camera on the rig with the live camera's lens and aspect, **and not its view offset**: CHAPTER FRAMING (`fx/mix/framing.ts`, `setViewOffset`) puts a static lens shift on the camera, and Chapter IV's master carries one (**64 px left and 36 px up at 1600x900**, 51 and 29 at 1280x720, in force from the first frame of the opening). So the played rig (`idle>enemy~500`, the calm half-way blend) read "every girl whole" in the measure and had Yuna's staff tip cut on the screen **at no push at all** (a 0.78 share, left edge -44 px). First try, push only (largest push the played rig takes in the old measure, 0.0166 applied): Yuna still at 0.704 (1600x900), 0.696 (1280x720), 0.697 (2560x1440), 0.983 (2560x1080): `try1-*` in the scratch dir. So the push alone could not be shrunk into frame, and the rule below is what the machinery needs.

### What it does

- `CameraPort.frame(rig, push, subjects, lens?)` (additive, optional; absent or false is the old measure to the digit). With `lens` the scratch camera also takes the live camera's view offset (`FrameFit.rigPose(.., lens)`, `frameFit(.., lens)`). `BattleCamera`, `PresetCamera`, `StillCamera`, `TargetFrameHold` forward it. Every other caller (A-11 `fittedPush`, A-1 `ffx2Shot`/`ffx2Push`, the run-in's `rigPose`, FFX) asks as before.
- `ShotRules.reveal` asks every measure of the played rig and its blends **through the lens**, and asks the girls **as whole as the master keeps them** (`whole` = the master's own worst share, 1.0 where it is whole, never under B5's 97 percent; `ffx2RevealSubjects(stage, focus, whole)`). B5's flat 97 percent let 21:9 hold Yuna's shoes 7 px under the bottom edge (0.984 at 2560x1080 after the first try; 0.965 before).
- Where the played rig is cut, the reveal takes B5's furthest blend that keeps everyone (`idle>enemy~425`, 0.85 of the calm half-way). Where it keeps them, `wholePush` holds the push to what the rig keeps whole, measured at the push the camera applies (the calm camera applies half of the 0.12 asked) and asked as B5 asks it (the push the rig takes: the calm camera applies half of it, which leaves the girls the other half of the room for the idle sway, about 6 px at 1600 wide).
- Same moves, same times: 1500 ms push, 1400 ms plate, 620 ms return (`MOMENT_TIMING`, pinned by a test); the opening is 6.166 s before and after at 1600x900.

### Measured: the girls' smallest share, before (origin/main) and after

Real keys from the title (the pre-scene read line by line, one Enter a second, so the opening is not hurried), headless GPU Chromium, `vite preview` of `BASE_PATH=/` builds, seed 1; a page-side rAF recorder reads every girl's painted quad (`contentQuad`) through the live camera each frame (the same share the critic's CHK-011 reads). **Yuna's smallest share in the opening** (the other girls and the boss are 1.00 and 0.99 to 1.00 in all of them), her left edge, and the frames under 99 percent:

| Size | Before (origin/main) | After (this branch) | Reveal rig and push asked, before > after |
|---|---|---|---|
| 1600x900 | **0.442**, left edge -119 px, 143 frames under 99 | **1.000**, left edge +12 px, 0 frames | `enemy`, 0.12 > `idle>enemy~425`, 0.014 |
| 2560x1440 | **0.450**, -186 px, 80 frames | **1.000**, +98 px, 0 frames | `enemy` 0.12 > `idle>enemy~425`, 0.012 |
| 1280x720 | **0.448**, -93 px, 123 frames | **1.000**, +11 px, 0 frames | `enemy` 0.12 > `idle>enemy~425`, 0.013 |
| 21:9 2560x1080 | **0.965**, left +334 px (the feet 12 px under the bottom edge), 123 frames | **1.000**, +405 px, 0 frames | `enemy`, 0.023 (B5's push) > `idle>enemy~425`, 0.020 |

- Five runs at 1600x900 (the one above and four repeats, the idle sway differs run to run): Yuna 1.000 in all five, 0 frames under 99 percent, left edge +4 to +15 px. The margin is small at the two small sizes (11 to 12 px); it is the room the half push leaves, and the sway there is about 6 px.
- Camera z at the end of the push 7.33 > 8.04 at 1600x900 (the dolly toward Bahamut is 0.7 world units shorter); the boss is 1.00 in frame after (0.99 before).
- The opening is 6.166 s before and after at 1600x900 (and on three of the four repeats; one repeat took 7.5 s, a slow frame under load, as the others varied with load). At 2560x1440 the headless render is slower and the opening reads 7 to 9 s in both builds; the constants are what the test pins.
- Frames, 6 times per row, before on top and after below, real keys (Yuna is the white mage at the left; each label has her share and left edge): `docs/screenshots/r392-motion/bahamut-reveal-before-vs-after-1600x900.jpg`, `-2560x1440.jpg`, `-1280x720.jpg`, `-2560x1080.jpg` (JPEG, 3000 px wide).

### The other six FFX-2 reveals (1600x900, same seed, before > after; the opening segment only)

| Chapter | Reveal rig and push, before > after | Camera z min | Girls' smallest share, left edge of Yuna |
|---|---|---|---|
| V Vegnagun | `enemy` 0.12 > `enemy` 0.12 | 12.22 > 12.21 | 1.00 > 1.00, 252 > 253 px |
| VI Leblanc | `action` 0.114 > `action` 0.114 | 8.55 > 8.55 | 1.00 > 1.00, 127 > 124 px |
| XI Fallen Aeons | `idle>enemy~180` 0.0230 > 0.0229 | 8.95 > 8.95 | 1.00 > 1.00, 20 > 21 px |
| XIII Trema | `idle>enemy~350` 0.0033 > 0.0027 | 8.74 > 8.74 | 1.00 > 0.999, 132 > 132 px |
| XV Den of Woe | `idle>enemy~180` 0.0242 > 0.0287 | 8.96 > 8.92 | 1.00 > 1.00, 15 > 6 px |
| XVI Ixion | `idle>enemy~180` 0.0268 > 0.0229 | 8.93 > 8.96 | 1.00 > 1.00, 8 > 21 px |

None of the six has a lens shift in force when its reveal starts (`view` null), so the lens-aware measure reads what it read, so the lens-aware measure reads what it read: the same rig in all six and the push within the run-to-run spread (the push depends on the moment the reveal is measured). Only these six at 1600x900 were measured: the stricter floor (all of each girl where the master is whole, was 97 percent) is not measured at the other sizes for them.

### Tests

`tests/unit/r392-reveal-push.test.ts` (13): every measure of the played rig and its blends is asked through the lens at the master's floor; the plain rig's own A-11 measure is not; a rig the lens cuts goes less far (blend, same four camera calls); a rig that holds a girl 3 percent under the edge goes less far where B5's 97 percent let it through; a master that itself cuts her a little asks no more than that, a master that cuts her deeply never lowers B5's 97 percent; the push is left at 0.12 where the applied push keeps every girl (and exactly at the limit), cut to what the rig takes where it does not, and the camera is handed that number to the digit; follows the camera preset (`current` applies the whole push); KO'd girls are not framed; FFX, the phone and a camera that cannot measure play as before; the timing constants. `tests/unit/r392-frame-lens.test.ts` (5): the lens is not read unless asked (same share, push, verdict to the digit), through it a girl the shift carries off the edge is cut at rest, the largest push is the one the shifted frame allows, `rigPose` carries the view only when asked and clears it otherwise. `tests/unit/r391-reveal-fit.test.ts` asserts the new floor (at least 97 percent: all of each where the master is whole).

## What is left, and what to know

- **The lens is read when the reveal starts.** The master's lens travels with the camera's move onto the master (`Framing.lensNow`); at 1600x900 and 1280x720 it is in force from the first frame. In two runs at 2560x1440 it was still 0 to 0.25 px when the reveal started (a heavily loaded run: three browsers at once), and in the first of them Yuna fell to 0.744 when it arrived; isolated runs came out whole (the blend that the stricter floor chooses kept 98 px). A very slow machine can therefore still show the old cut; it is not worse than before (before: 0.45 at that size).
- **A smaller margin at small sizes.** 11 to 12 px at 1280x720 and 1600x900 at the end of the push; five repeat runs at 1600x900 never dropped below 4 px. If Bailey wants more air, `wholePush` can ask for half of what it asks now (one factor).
- **REDUCE MOTION with the reveal.** With the setting on the stage snaps to the played rig and applies no push (`StillCamera`), so the new blend is what a REDUCE MOTION player now sees at rest (Yuna whole). Not measured by key in this lane.
- **Lunge choice for Bailey (rule 10, nothing built beyond it):** half of the extra is built; the cap at 1.4 is `CALM_REACH_SHARE = 0` (the strike then stops where it did before r391-reach). Say if he would rather have that.
- **File sizes.** `BattlePresenterPorts.ts` 500 > 503 lines (already over 400 on main; three lines of doc and one parameter); the other touched files are under 400.
- Contract entry: `docs/CONTRACT-CHANGES.md` 2026-10-06 (additive: `CameraPort.frame`'s `lens`, `LungeCtx`).

## Gates

- `node node_modules/typescript/bin/tsc --noEmit -p .` (in the worktree, main's `node_modules` by junction): clean.
- Tests of this lane: `r392-calm-lunge` 16, `r392-reveal-push` 13, `r392-frame-lens` 5 (34 new) and `r391-reveal-fit` 10, `presenter-shot-fit` 15, `frame-fit` 12, `stand-reach` 39, `r38-run-in` 13, `r391-run-in-reach` 4 pass; a 72-file subset (camera, shot, reveal, frame, presenter, moments, stand-reach, r391, r392, run-in, comfort, silhouette, preset, target-frame) passed 695 tests before the stricter reveal floor was added; the full suite below covers it.
- **Full suite** (`vitest run`, after both code commits): 901 files, 895 passed, 5 skipped, **1 failed**: `strategy-ffx2-bahamut.test.ts` "heal-only route (no Shell, no Breaks) clears Mega Flare" timed out at the 15 s `testTimeout` (41.6 s in the full run, and again alone while other lanes were running on the machine). It is an engine-only simulation (`src/battle`, no presenter, no camera; this branch changes nothing under `src/battle` or `src/data`) and **passes in 25.8 s with `--testTimeout=90000`**: the same load flake `docs/handoff/r391-reach.md` recorded. Left alone. 13,261 tests passed.
- `node tools/orphans.mjs`: 1,306 modules, 24 orphaned (the same 24 as main; this branch adds no module).
- No server left running: the two `vite preview` servers this lane started (ports 7410 and 7411) are stopped.

## Files

Changed: `src/engine/motion/StrikeReach.ts` (`CALM_REACH_SHARE`, `calmLunge`, `LungeCtx`, `lungePlan`), `src/engine/ShotRules.ts` (`reveal`, `wholePush`), `src/engine/ShotFit.ts` (`ffx2RevealSubjects(.., whole)`), `src/engine/FrameFit.ts` (`rigPose`/`frameFit` `lens`), `src/engine/BattleCamera.ts`, `CameraPreset.ts`, `ComfortCamera.ts`, `TargetFrameHold.ts`, `BattlePresenterPorts.ts` (`frame`'s `lens`), `docs/CONTRACT-CHANGES.md`. New: `tests/unit/r392-calm-lunge.test.ts`, `r392-reveal-push.test.ts`, `r392-frame-lens.test.ts`; `tests/unit/r391-reveal-fit.test.ts` changed. Frames: `docs/screenshots/r392-motion/` (four strips). The harness (recorders, probes, the builds, the raw rows) is scratch and not in the repo: `D:/Tools/pyrefly-scratch/2026-10-06/r392-motion`.

## Changelog line for the driver

> **FFX-2 (Chapter IV), desktop:** Bahamut's reveal no longer pushes Yuna out of the frame: the camera stops a little short of the boss (it measured the picture without the chapter's lens shift before) and Yuna stays whole at every window size (smallest share 0.44 > 1.00 at 1600x900, 0.45 > 1.00 at 2560x1440, 0.97 > 1.00 at 21:9); the moves and the 6 s opening are unchanged.
> **Both games:** with REDUCE MOTION on, an attack's lunge travels half of the extra distance it was solved to reach (never more than 2.9 world units; Chapter I's Tidus 2.85 > 2.15, Chapter IV's Bahamut 4.4 > 2.2).
