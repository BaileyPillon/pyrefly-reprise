# mf-l1-swaps: the swap lane of the motion-fluidity pass (MF-01, MF-05, MF-06, and the MF-22 capability)

Branch `mf-l1-swaps` (from `origin/main` `acbd815d3` merged with `origin/post-flicker` `8d005bfb9` and `origin/post-tool-pin` `adb44d675`), 2026-10-26 and 27, lane L1 "poses and swaps" of
`D:/Tools/pyrefly-scratch/2026-10-26/fluidity/plan.json`. Authority: Bailey, 2026-10-26 ~13:45 EDT, "I need an additional pass for motion, motion fluidity, animations etc please", with every decision
delegated to the driver. Nothing deployed; nothing on the live site or the booth copy. Game case: MF-01 FFX-2 only; MF-05, MF-06 and MF-22 both games (the cause differs per game, the mechanism is shared), in Chapter I
(FFX, `seymour-flux`) and Chapter IV (FFX-2, `ffx2-bahamut`) unless `?swapscope=all` says otherwise.

Paper preflight (written beside the build): `docs/plans/mf-l1-swaps-review.md`. Scratch (not in the repo): `D:/Tools/pyrefly-scratch/2026-10-26/fluidity/build/mf-l1-swaps/` (`progress.md` is the step log,
`evidence/<tag>/` the harness runs, `film/<chapter>-<tag>/` the frame-stepped captures, `table.mjs` the numbers below read back) and the clip cards in `D:/Tools/pyrefly-scratch/2026-10-26/fluidity/cards/`.

## What each item is

| item | game case | word | what it does | A / B |
|---|---|---|---|---|
| MF-01 turn-start interlude | FFX-2 only (FFX turn start is its own burst before the menu) | `?interlude=all` (default, ON) or `?interlude=attack` (post-flicker's attack-only hold, the "before") | a girl whose command was chosen keeps her menu `ready` through the turn start into her own cast or item, as post-flicker did for her attack: ready, cast (one dissolve), not ready, idle, cast (two). REDUCE MOTION, foes, FFX, FF7 and `?motion=classic` keep today | A |
| MF-05 turn-start stance | both | `?stance=today` (default) / `v1a` / `v1b` / `v3` | `v1a`: the menu keeps the idle painting (the ready STANCE, ring and lean, stays), `ready` is drawn only as an attack's wind-up. `v1b`: no ready painting anywhere, the wind-up is played on the idle painting. `v3`: today's two paintings, the change a 50 ms three-frame blend (the capped cross of exponent 3, not a linear blend: a linear 50 ms blend read worse than today on pairs that share nothing) | B |
| MF-06 swap on the cause | both | `?swapcause=today` (default) / `cut` / `blend3` / `pick`, and `?swapclass=contact,home,hit,recover,glow,castEnd,toss,itemEnd,critical,criticalOut` | `cut`: a cut inside the smear on the contact, the hit, the glow, the toss, the critical flash, the settle. `blend3`: the same moments as a 50 ms blend, every pair (the plan's V2 arm, unguarded, for the clip). `pick`: the cut where the moment has a cover; the 50 ms blend where it has none and the two drawings are close; **today's blend where two drawings are far apart** (see "The pick guard") | B |
| MF-22 the other chapters | both | `?swapscope=all` (default `pack`) | the stance and cause looks above play in ANY chapter, not only the two pack chapters, so a chapter can be measured with the rules on, one at a time (PR-0522). Nothing flips by default | capability |

`window.__pyrefly.swapSwitch({ interlude, stance, cause, classes, scope })` flips one live; `window.__pyrefly.swapLog()` is why the presenter asked for each painting (`reasons`: menu, turn-start, wind-up, cast,
item, attack, after-action) and every blend it designed on purpose (`designed`, with its class and 50 ms): the continuity harness of lane L5 (`mf-l5-tools`, T-02) reads exactly this. `tools/swap-classes.mjs`
reads a continuity run into the audit's swap classes, splits the stance swaps into menu-open, wind-up and after-action (the plan's "harness split"), finds the interludes, and prices V1a against V1b from the run's own swaps.
Every default is today's look; nothing in this lane flips a default.

New modules (all under 400 lines): `src/engine/motion/SwapSwitch.ts` (the words), `SwapClass.ts` (the class of a pair), `StanceSwap.ts` (the ready stance on the idle painting), `SwapLog.ts` (the log the harness reads).
Edits in L1's own files: `KeyPoses.ts` (`readyCarriesIntoWindUp` extended to the figure's own cast and item; `windUpOpens` is post-flicker's), `BattlePresenter.ts`, `BattlePresenterBeats.ts`, `SmearDirector.ts`, `SmearPlan.ts`,
`SmearLog.ts`, `PoseSwap.ts` (a comment), `src/debug/smearApi.ts`. One optional field `paint` on `setPose` (`BattlePresenterPorts.ts`, `PaintedActor.ts`, `RigActor.ts`): a pose name with another painting drawn; no contract file changed.

## The pick guard (found by the run, fixed in `72ff6a0fd`)

The first build of `pick` read 101.5 to 15.8 ghost frames a minute in Chapter I, and **25 swap jerks, 17 of them 40 px or more, worst 149.4 px** (today 3, 2 of them 40 px or more). The swaps were the 50 ms blends of the
return home, the recovery from a hit and the critical stance's end (`follow>idle`, `hurt>idle`, `critical>idle`), pairs of drawings whose heads are 0.2 to 0.45 of the figure's height apart: in a 50 ms blend the head
crosses 70 to 150 px in two frames, a pop, where today's 120 ms dissolve shows both figures. The paper preflight's own stop rule says a variant that adds a swap jerk of 40 px or more "is not offered in that form".
So `pick` now blends only where the pair is NOT a big change (`SmearPlan.isBigChange`: outlines under half shared, or heads 0.12 of the height apart); a big pair at rest keeps today's blend (or the smear when the figure
moves, as today). The pure `blend3` word and `?stance=v3` are the plan's V2 and V3 arms and stay unguarded, so the clips can show what the plain 50 ms blend does; the harness reads their jerks (Chapter IV `blend3`:
85 swap jerks, 16 of 40 px or more, worst 60.3 px). Lane L5's `designedBlend` class (T-02) reports such a blend apart from an undesigned dissolve, but it does not change that a head moves 60 to 150 px in two frames.
The unguarded evidence is kept in the scratch folder (`evidence/ch1-pu`, `evidence/ch4-r3u`, `film/*-pickU`).

## Numbers (the pinned harness, `critic/runner/lib/continuity.mjs` stamped by `tools/continuity-id.mjs`; Chapter I and IV, seed 1, 1600 x 900, one run each, same route; dev server on this branch)

Measured at `b3c1e2b7d` and later; the merge `367acfc51` (post-flicker's review round: `windUpOpens`, `?motion=classic`) is a refactor with the same default behaviour, and the `pick` guard `72ff6a0fd` changes only `pick`.
Ghost frames a minute are a 60 Hz count; ghost ms a minute is display-independent (the plan's correction).

**MF-01, A item (FFX-2 only, no look change), Chapter IV:**

| run | seconds | counted swaps | ghost frames a minute | ghost ms a minute | interludes | snaps | worst severity |
|---|---|---|---|---|---|---|---|
| before: `?interlude=attack` (post-flicker alone) | 384.4 | 369 | 639 = 99.7 | 1,632 | 37 (31 cast, 5 item, 1 other; 219 frames = 34.2 a minute) | 0 | 0.342 |
| after: default | 376.6 | 334 | 544 = **86.7** | **1,406** (-226) | 1 (the "other") | 0 | 0.342 |

The plan's target was about 86 (model); the r64 kept run read 147.3, post-flicker 103.9 on its tree (99.7 here), MF-01 86.7. Chapter I control (FFX): 390.6 s, 334 swaps, 661 frames = 101.5 a minute (r64 kept 101.7), 0 interludes: MF-01 does not reach FFX.

**B items, the arms (each run prices one stance variant and one cause variant; the classes are disjoint):**

(Filled from `table.mjs` below.)

## Clip cards (blind letters, the key in `KEY.json` and `README.txt`; frame-stepped at 60 Hz on a virtual clock, same moment, same seed, every variant plays the same turns)

Each card folder holds, per moment, a 720p MP4 (variants one after the other, a big letter each, under 8 MB), a quarter-speed MP4 of the change itself, and a 1080 px wide still card.

(Filled below.)

## Not done, and why

- **MF-18** (anticipation before the cut, and the big cuts): not built here. It depends on MF-04 (lane L2's `?run=flow`, the readable pull as she brakes: `mf-l2-moves`) and edits L2's run-in file; under `?stance=v1b` the wind-up on the idle painting already carries the ready stance's lean and scale into the strike.
  Measured for it: the planned cuts' whole step in Chapter IV has median 48 to 54 px, worst 80 to 90, none over 120 px; in Chapter I, 10 to 11 over 120 px, worst 227 to 233 px, all named: Tidus `critical>hurt` (233 px), Auron `follow>idle` (173) and `idle>victory` (159, a camera cut),
  Tidus and Kimahri `idle>hurt` (128 to 158), Kimahri `ready>attack` and `attack>follow` (125 to 127). `pick` leaves them as they are.
- Default flips are the driver's (wave 2). Every B word stays at today until a clip is picked.
- A CHANGELOG line per build is the driver's (below), `CHANGELOG.md` is not edited here.
- The merge with `mf-l2-moves` has one conflict, an import line in `BattlePresenterBeats.ts` (keep L2's `hitReact` import and this lane's `openingPose` import, and one `KeyPoses` import line with `windUpOpens` and whatever the merged file uses of `turnStartPose` and `readyCarriesIntoWindUp`); `mf-l5-tools`, `mf-l3-timebase-ui` and `mf-l4-freezes` merge clean (checked with `git merge-tree`).

## Lines for the driver's CHANGELOG (not written into `CHANGELOG.md`)

- FFX-2 only: a girl who casts a spell or uses an item from her menu now goes ready, cast (or item) with one dissolve, not ready, idle for 90 ms, cast: a see-through blip in 31 casts and 5 items in Chapter IV's six minutes is gone (Chapter IV ghost frames 99.7 to 86.7 a minute).
- Behind address words, default as today: `?stance=v1a|v1b|v3` (both games), `?swapcause=cut|blend3|pick` with `?swapclass=` (both games), `?swapscope=all` (both games, the looks in any chapter), `?interlude=attack` (FFX-2, the old hold).
