# mf-l1-swaps: the swap lane of the motion-fluidity pass (MF-01, MF-05, MF-06, and the MF-22 capability)

Branch `mf-l1-swaps` (from `origin/main` `acbd815d3` merged with `origin/post-flicker` `8d005bfb9` and `origin/post-tool-pin` `adb44d675`), 2026-10-26 and 27, lane L1 "poses and swaps" of
`D:/Tools/pyrefly-scratch/2026-10-26/fluidity/plan.json`. Authority: Bailey, 2026-10-26 ~13:45 EDT, "I need an additional pass for motion, motion fluidity, animations etc please", with every decision
delegated to the driver. Nothing deployed; nothing on the live site or the booth copy. Game case (AGENTS.md rule 14): MF-01 FFX-2 only (FFX's turn start is a burst of its own, before the menu); MF-05, MF-06 and
MF-22 both games (the cause differs per game, the mechanism is shared), played in Chapter I (FFX, `seymour-flux`) and Chapter IV (FFX-2, `ffx2-bahamut`), the two pack chapters, unless `?swapscope=all` says otherwise.

Paper preflight (written beside the build): `docs/plans/mf-l1-swaps-review.md`. Scratch (not in the repo): `D:/Tools/pyrefly-scratch/2026-10-26/fluidity/build/mf-l1-swaps/` (`progress.md` is the step log,
`evidence/<tag>/` the harness runs, `film/<chapter>-<tag>/` the frame-stepped captures, `table.mjs` and `tablemd.mjs` the numbers below read back) and the clip cards in `D:/Tools/pyrefly-scratch/2026-10-26/fluidity/cards/`.

## What each item is

| item | game case | word | what it does | A / B |
|---|---|---|---|---|
| MF-01 turn-start interlude | FFX-2 only | `?interlude=all` (default, ON) or `?interlude=attack` (post-flicker's attack-only hold, the "before") | a girl whose command was chosen keeps her menu `ready` through the turn start into her own cast or item, as post-flicker did for her attack: before, she dropped to the idle painting for 90 ms and then jumped to the cast or item painting (two dissolves in 0.2 s); now ready to cast is one dissolve. REDUCE MOTION, foes, FFX, FF7 and `?motion=classic` keep today | A |
| MF-05 turn-start stance | both | `?stance=today` (default) / `v1a` / `v1b` / `v3` | `v1a`: the menu keeps the idle painting (the ready STANCE, its ring and lean, stays), `ready` is drawn only as an attack's wind-up. `v1b`: no ready painting anywhere, the wind-up is played on the idle painting. `v3`: today's two paintings, the change a 50 ms three-frame blend (the capped cross of exponent 3, not a linear blend: a linear 50 ms blend read worse than today on pairs that share nothing) | B |
| MF-06 swap on the cause | both | `?swapcause=today` (default) / `cut` / `blend3` / `pick`, and `?swapclass=contact,home,hit,recover,glow,castEnd,toss,itemEnd,critical,criticalOut` | `cut`: a cut inside the smear on the contact, the hit, the glow, the toss, the critical flash and the settle. `blend3`: the same moments as a 50 ms blend, every pair (the plan's V2 arm, unguarded, for the clip). `pick`: the cut where the moment has a cover; the 50 ms blend where it has none and the two drawings are close; today's blend where two drawings are far apart (the pick guard below) | B |
| MF-22 the other chapters | both | `?swapscope=all` (default `pack`) | the stance and cause looks play in ANY chapter, so one chapter can be measured with the rules on (PR-0522). Nothing flips by default | capability |

`window.__pyrefly.swapSwitch({ interlude, stance, cause, classes, scope })` flips one live. `window.__pyrefly.swapLog()` is why the presenter asked for each painting (`reasons`: menu, turn-start, wind-up, cast,
item, attack, after-action) and every blend it designed on purpose (`designed`, with its class and 50 ms): lane L5's harness (`mf-l5-tools`, T-02) reads exactly this. `tools/swap-classes.mjs` reads a continuity
run into the audit's swap classes, splits the stance swaps into menu-open, wind-up and after-action (the plan's "harness split"), finds the interludes, and prices V1a against V1b from the run's own swaps
(`--price`). Every default is today's look; nothing in this lane flips a default.

New modules (all under 400 lines): `src/engine/motion/SwapSwitch.ts` (the words), `SwapClass.ts` (the class of a pair), `StanceSwap.ts` (the ready stance on the idle painting), `SwapLog.ts` (the log the harness reads).
Edits in L1's own files: `KeyPoses.ts` (`readyCarriesIntoCastOrItem`, the turn start's one rule), `BattlePresenter.ts`, `BattlePresenterBeats.ts`, `SmearDirector.ts`, `SmearPlan.ts`, `SmearLog.ts`, `PoseSwap.ts` (a comment),
`src/debug/smearApi.ts`. One optional field `paint` on `setPose` (`BattlePresenterPorts.ts`, `PaintedActor.ts`, `RigActor.ts`): a pose name with another painting drawn. No contract file changed (`CONTRACTS.md`'s six).
Tests: `fluidity-swaps-actor.test.ts` (the real `PaintedActor`), `ffx2-interlude`, `ffx2-stance`, `swap-classes`, `swap-guards`.

## Three things the runs found, and what was done (commits `72ff6a0fd` and `40fa6b3e2`)

1. **The first `pick` popped.** It read 101.5 to 15.8 ghost frames a minute in Chapter I and **25 swap jerks, 17 of them 40 px or more, worst 149.4 px** (today 3, 2 of them 40 px or more). They were the 50 ms blends
   of the return home, the recovery from a hit and the critical stance's end (`follow>idle`, `hurt>idle`, `critical>idle`), pairs of drawings whose heads are 0.2 to 0.45 of the figure's height apart: in a 50 ms blend the head
   crosses 70 to 150 px in two frames. The paper preflight's stop rule says a variant that adds such a jerk "is not offered in that form". So `pick` now blends only where the pair is NOT a big change
   (`SmearPlan.isBigChange`: outlines under half shared, or heads 0.12 of the height apart); a big pair at rest keeps today's blend (or the smear when the figure moves, as today). The pure `blend3` word and `?stance=v3` are the
   plan's V2 and V3 arms and stay unguarded so the clips show what the plain 50 ms blend does: the harness reads 85 swap jerks in Chapter IV for `blend3` (16 of 40 px or more, worst 60.3 px). Lane L5's `designedBlend`
   class reports such a blend apart from an undesigned dissolve; it does not change that a head moves 60 to 150 px in two frames. The cost of the guard is real: Chapter I `pick` reads 36.2 ghost frames a minute, not 15.8.
2. **The planned-smear log held 400 entries.** A ten-minute fight (Yunalesca) plans about 420 cuts, the harness reads the whole log at the end, so the first 22 cuts were dropped and read as 22 snaps. The planned-smear and swap logs
   now hold 4,000 (a pack chapter plans 150 to 280, so no earlier number moves).
3. **A cut on its cause at rest is not made across two heads 0.4 of the height apart or more** (`SmearPlan.CAUSE_MAX_ANCHOR`; the most any pack chapter's cause cut reaches is 0.37, so Chapter I and IV are untouched).
   It did not fix Yunalesca's 133 px cuts, which turned out to be the planner's own MOVING-figure cut across heads 0.44 apart (see MF-22 below and "Not done").

## Numbers (the pinned harness, `critic/runner/lib/continuity.mjs` stamped by `tools/continuity-id.mjs`; seed 1, 1600 x 900, one run each on the dev server of this branch; the same route in the pack chapters)

Measured at `b3c1e2b7d` to `40fa6b3e2`; the merge `367acfc51` (post-flicker's review round: `windUpOpens`, `?motion=classic`) is a refactor with the same default behaviour, so a run before it stands. Ghost frames a minute is a 60 Hz count;
ghost ms a minute is display-independent (the plan's correction): read the ms where a run's frame rate was low. A swap jerk is the head moving 40 px or more in one frame at a swap and not excused by a planned cut.

**MF-01, the A item (FFX-2 only, no look change), Chapter IV.** Before: `?interlude=attack` (post-flicker alone). After: the default.

| run | seconds | counted swaps | ghost frames a minute | ghost ms a minute | interludes | snaps | worst severity |
|---|---|---|---|---|---|---|---|
| before | 384.4 | 369 | 639 = 99.7 | 1,632 | 37 (31 cast, 5 item, 1 other; 219 frames = 34.2 a minute) | 0 | 0.342 |
| after | 376.6 | 334 | 544 = **86.7** | **1,406** (-226) | 1 (the "other") | 0 | 0.342 |

The plan's model said about 86; the r64 kept run read 147.3, post-flicker 103.9 on its own tree (99.7 here), MF-01 86.7. Chapter I control (FFX): 390.6 s, 334 swaps, 661 frames = 101.5 a minute (r64 kept 101.7), 0 interludes: MF-01 does not reach FFX.

**MF-05 and MF-06, the B items, Chapter IV (FFX-2).** Each run prices one stance variant and one cause variant (the classes are disjoint). The words are in the first column.

| run | seconds | swaps | ghost frames a minute | ghost ms a minute | worst severity | snaps | swap jerks (40 px or more, worst px) | planned cuts | whole step of a planned cut: median, worst, over 120 px |
|---|---|---|---|---|---|---|---|---|---|
| today (MF-01 on; every B word at today) | 376.6 | 334 | 86.7 | 1,406 | 0.342 | 0 | 4 (1, 45.1) | 150 | 54.2, 79.9, 0 |
| `?stance=v1a&swapcause=cut` | 367.2 | 306 | 11.4 | 188 | 0.306 | 0 | 5 (1, 44.7) | 277 | 48.8, 85, 0 |
| `?stance=v1b&swapcause=blend3` (V2 unguarded) | 349.2 | 277 | 27.3 | 463 | 0.306 | 0 | 85 (16, 60.3) | 119 | 34.9, 88.7, 0 |
| `?stance=v1b&swapcause=pick` (the guarded pick) | 378.7 | 298 | 34.1 | 569 | 0.328 | 0 | 4 (1, 45) | 215 | 50.2, 89.8, 0 |
| `?stance=v3&swapcause=pick` | 379.2 | 332 | 33.2 | 561 | 0.328 | 0 | 18 (1, 44.8) | 210 | 50.6, 89.4, 0 |
| `?stance=v3&swapcause=pick`, first build (unguarded) | 352.9 | 318 | 20.6 | 349 | 0.28 | 0 | 38 (4, 53.8) | 195 | 45.1, 85.4, 0 |

**Chapter I (FFX).**

| run | seconds | swaps | ghost frames a minute | ghost ms a minute | worst severity | snaps | swap jerks (40 px or more, worst px) | planned cuts | whole step of a planned cut: median, worst, over 120 px |
|---|---|---|---|---|---|---|---|---|---|
| today (every B word at today) | 390.6 | 334 | 101.5 | 1,696 | 0.332 | 0 | 3 (2, 47) | 143 | 66.5, 233.1, 10 |
| `?stance=v1b&swapcause=pick` (the guarded pick) | 386.5 | 256 | 36.2 | 613 | 0.332 | 0 | 3 (0, 31.5) | 173 | 63.5, 227.1, 11 |
| `?stance=v1b&swapcause=pick`, first build (unguarded) | 390.2 | 243 | 15.8 | 265 | 0.332 | 0 | 25 (17, 149.4) | 173 | 63.7, 236.5, 11 |
| `?stance=v1a&swapcause=cut`; `?stance=v1b&swapcause=blend3` (V2 unguarded); `?stance=v3&swapcause=pick` | not run in this pass | | | | | | | | |

What the stance class is, priced from the baseline runs' own swaps (`node tools/swap-classes.mjs --price`; a model, the runs above are the measure): Chapter IV after MF-01 has 61 stance swaps (menu 38, back to ready after an action 21, turn start and after-action
2); `v1b` removes 29.5 ghost frames a minute (chapter 86.7 to 57.2), `v1a` 18.8 (to 67.9: one idle-to-ready blend per strike remains, 22 strikes). Chapter I has 64 stance swaps (menu 49, after-action 15); `v1b` removes 36.4
(101.5 to 65.1), `v1a` 32.5 (to 69.0). The plan's pick V1b is the larger in both, and removes the two costume dissolves (Paine's two drawings are different costumes, Yuna's ready drawing is a racket-like pose, PR-0517).
The turn cut-in (full-screen portrait) covers the stance swap on each member's FIRST turn only, so the stance clip films each member's second turn.

**MF-22, the capability: a chapter outside the pack, rules on** (`?stance=v1b&swapcause=pick&swapscope=all`, one run each; the Trema fights are 20 minutes, past the lock's stale line, other lanes' browser jobs ran beside them: fps 56 to 57, read the ms).

| run | seconds | swaps | ghost frames a minute | ghost ms a minute | worst severity | snaps | swap jerks (40 px or more, worst px) | planned cuts | whole step of a planned cut: median, worst, over 120 px |
|---|---|---|---|---|---|---|---|---|---|
| Yunalesca (FFX) today | 584.3 | 850 | 287.2 | 4,728 | 0.352 | 0 | 51 (9, 62.1) | 0 | -, -, 0 |
| Yunalesca, rules on, before the log and cut-distance fixes (22 snaps) | 585.7 | 742 | 98.1 | 1,627 | 0.352 | 22 | 72 (36, 154.5) | 367 | 68.8, 153.5, 45 |
| Yunalesca (FFX), rules on | 583.9 | 743 | 98.5 | 1,642 | 0.352 | 0 | 56 (25, 154.6) | 389 | 68.7, 153.9, 48 |
| Trema (FFX-2) today | 1212.8 | 1863 | 302.2 | 5,245 | 0.321 | 0 | 40 (11, 104) | 0 | -, -, 0 |
| Trema (FFX-2), rules on | 1194.9 | 1713 | 140.5 | 2,435 | 0.32 | 0 | 21 (11, 117) | 749 | 33.2, 97.8, 0 |

Yunalesca (FFX): 287.2 to 98.5 ghost frames a minute (-66 percent), 4,728 to 1,642 ms, no snap, but 25 swap jerks of 40 px or more against 9, worst 154.6 px against 62.1: 14 are Yunalesca's `attack>cast` and 2 Auron's
`follow>idle`, today's moving-figure smear (the planner's own cut, speed 0.8 to 2.5 body heights a second) reaching this chapter across heads 0.41 to 0.44 of the height apart (133 and 154 px; the harness does not excuse a
planned cut over 120 px), and 48 planned cuts have a whole step over 120 px against 10 in Chapter I today. **The wide rules are not ready to flip for an FFX chapter with a big foe until MF-18's anchor exists.**
Trema (FFX-2): 302.2 to 140.5 ghost frames a minute (-54 percent), 5,245 to 2,435 ms, no snap, the severity 0.32 as today, the planned cuts' whole step median 33 px, worst 98, none over 120; the 11 swap jerks are the foe's own
`idle>attack` feet reading, 11 today too. The FFX-2 chapter is clean.

## Clip cards (blind letters; the key is in `KEY.json` and `README.txt`, never in the picture)

`D:/Tools/pyrefly-scratch/2026-10-26/fluidity/cards/<card>/`. Frame-stepped at an exact 60 Hz on a virtual clock (never real time), same moment, same seed, every variant plays the same turns (the answers land on the same frames). Per moment: a 720p MP4
with the variants one after the other and a big letter on each (all under 4 MB), a quarter-speed MP4 of the change itself, and a 1080 px wide still card (twelve frames per variant across the change, each stamped with its pose and `~` while it blends).

| card | decision | moments | variants (blind order in `KEY.json`) |
|---|---|---|---|
| `cp01-ch4` | CP-01 turn-start stance, Chapter IV (FFX-2), second turns | Paine to her attack, Yuna to a spell | V0 today, V1a, V1b, V3 (the plan's pick: V1b) |
| `cp01-ch1` | CP-01, Chapter I (FFX), second turns | Tidus to his attack, Yuna to a spell | V0, V1a, V1b, V3 |
| `cp02-ch4` | CP-02 swap on the cause, Chapter IV | Paine's and Rikku's strike chain, Yuna's spell, Yuna's and Paine's hit | V0, V1 cut, V2 50 ms blend, V1+V2 (the guarded pick) |
| `cp02-ch1` | CP-02, Chapter I | Tidus's strike, Yuna's spell, Tidus's and Yuna's hit | V0, V1, V2, V1+V2 |
| `cp12-yunalesca` | CP-12 another chapter, FFX | Tidus's strike, Yuna's spell, Auron's and Yuna's hit | V0 today, V1 rules on |
| `cp12-trema` | CP-12, FFX-2 | Paine's and Rikku's strike, Yuna's spell and hit | V0, V1 |
| `mf01-ch4` | MF-01 (information, no look change) | Yuna's spell from her menu | before, after |

The plan's picks, for the driver's reading (they are not Bailey's picks): CP-01 V1b (the sourced behaviour: the real game has no ready clip; falls back to V1a, then V3, if the wind-up on the idle painting reads badly), CP-02 V1 where the moment
has a cover and V2 where it has none (built as `pick`, with the guard), CP-12 V1. The stills of the strike moments show where each pick differs; V2 (the plain 50 ms blend) is in the cards on purpose, so the head pop can be seen.

## Not done, and why

- **MF-18** (anticipation before the cut, and the big cuts) is not built here. It depends on MF-04 (lane L2's `?run=flow`, the readable pull as she brakes: `mf-l2-moves`) and edits L2's run-in file, and it needs MF-05's pick. Under `?stance=v1b` the wind-up on the idle painting
  already carries the ready stance's lean and scale into the strike. Measured for it: the planned cuts' whole step in Chapter IV has median 48 to 54 px, worst 80 to 90, none over 120 px; in Chapter I, 10 to 11 are over 120 px, worst 227 to 233 px, all named: Tidus `critical>hurt`
  (233 px), Auron `follow>idle` (173) and `idle>victory` (159, a camera cut), Tidus and Kimahri `idle>hurt` (128 to 158), Kimahri `ready>attack` and `attack>follow` (125 to 127). `pick` leaves them as they are. Yunalesca shows the class widens with the gate (48 over 120 px).
- Every B word stays at today until a clip is picked, and the default flips are the driver's (wave 2). A CHANGELOG line per build is the driver's (below); `CHANGELOG.md` is not edited here.
- Chapter I's three remaining arms (see the table: a row "not run in this pass" is a run the rig's queue did not reach) can be read with `D:/Tools/pyrefly-scratch/2026-10-26/fluidity/build/mf-l1-swaps/master6.mjs`.
- The merge with `mf-l2-moves` has one conflict, an import line in `BattlePresenterBeats.ts` (keep L2's `hitReact` import and this lane's `openingPose` import, and one `KeyPoses` import line with `turnStartPose` and `windUpOpens` and whatever else the merged file uses);
  `mf-l5-tools`, `mf-l3-timebase-ui` and `mf-l4-freezes` merge clean (checked with `git merge-tree`). Lane L5's `designedBlend` class reads this lane's `swapLog().designed` and needs no change here.

## Checks run

`npx tsc --noEmit` exit 0; the lane's five test files pass (`fluidity-swaps-actor`, `ffx2-interlude`, `ffx2-stance`, `swap-classes`, `swap-guards`); the 190 test files that import any source file this lane changed or merged (2,520 tests) pass; the continuity harness runs above.
The full suite was not run.

## Lines for the driver's CHANGELOG (not written into `CHANGELOG.md`)

- FFX-2 only: a girl who casts a spell or uses an item from her menu now goes ready, then cast (or item) with one dissolve, not ready, idle for 90 ms, then cast: a see-through blip before 31 casts and 5 items in Chapter IV's six minutes is gone (Chapter IV ghost frames 99.7 to 86.7 a minute).
- Behind address words, default as today: `?stance=v1a|v1b|v3` (both games), `?swapcause=cut|blend3|pick` with `?swapclass=` (both games), `?swapscope=all` (both games, the looks in any chapter), `?interlude=attack` (FFX-2, the old hold).
