# Motion-fluidity pass, lane L2 "moves" (branch `mf-l2-moves`, 2026-10-26)

Authority: Bailey, 2026-10-26 ~13:45 EDT, "I need an additional pass for motion, motion fluidity, animations etc please" (his bar: "The motion and animations need to be top notch, even above visuals"); every decision delegated to the driver. Nothing here deploys.

**Build:** `origin/main` `acbd815d3` merged with `origin/post-flicker` (`53c9bae08`, the MF-04 clips are made on a build that has it), `origin/post-shake-time` (`c64ea0de6`, the field-clock shake MF-03 and MF-27 build on) and `origin/post-tool-pin` (`adb44d675`, the pinned harness). The plan: `D:/Tools/pyrefly-scratch/2026-10-26/fluidity/plan.json`, lane L2.

## What each item is, in one line each (the look changes are all behind an address word whose default is today; `window.__pyrefly.move(key, word)` flips one live)

| item | game case | word | what it does | A / B |
|---|---|---|---|---|
| MF-09 KO thud | both | none (on) | the landing (squash, settle, ground shake) plays on the frame the lying painting is half drawn, not 58 ms (FFX) or 92 ms (FFX-2) later; the ground shake starts from phase 0 | A |
| MF-25 rig springs | both (Seymour Flux, Bahamut) | none (on) | tails, manes and sashes integrate on a fixed 1/120 s step and are drawn between substeps: the same at 60, 120 and 144 Hz | A (disclosed: cloth and hair at 60 Hz differ from the old variable step by a fraction of a pixel; `v1-geometry-golden.json` re-pinned) |
| MF-03 hit reaction | both | `?hit=today / ramp / knock` | V1 ramp: the rattle's envelope starts at zero (33 ms) and its phase is seeded from the blow. V2 knock: a push along the attacker-to-target line, eased peak at 120 ms, a spring back (240 ms, 0.35) with one visible counter-swing, size by `hitPower()` (0.05 to 0.16 u, a crit a quarter more, a big body 40 percent less), a 3 to 7 percent contact compression held through the hit-stop | B |
| MF-04 FFX-2 run, leap, lunge | FFX-2 only | `?run=today / smooth / flow / pace` | V1 smooth: a trapezoid of speed (peak 1.33 x mean, not 2) and a leap that leaves and meets the floor at rest. V2 flow: V1 plus the strike is asked for as she brakes (a 14 px pull, not 3, a 7 percent crouch) and the lunge is solved from where she will stand. V3 pace: V2 at about 3 body heights a second | B |
| MF-11 rig boss KO and return | both | `?rigko=today / whole` | the ko key is the whole fall (no generic sink, no 22 px rise), the thud on the key's end; the idle key waits for the strike to be over | B |
| MF-12 hurt strings | both | `?hurtstring=today / hold` | the struck figure stays in hurt from the first blow of a string to the last and goes home once | B |
| MF-15 aeon entry and exit | FFX as played (code shared) | `?summon=today / leap` | the arrival is the leap (crouch, lift at rest on both ends, squash) started as the fade passes 60 percent; the party fades back in while the aeon fades out (390 ms shorter) | B |
| MF-17 party KO topple and revive | both | `?kotopple=today / eased` | a 500 ms (FFX) / 400 ms (FFX-2) collapse, the turn and the slide on a smootherstep, the revive's rise on its mirror | B |
| MF-23 stepped fades | FFX (petrify, Evrae, Yojimbo, Omnis) and FFX-2 (yields, held), none reachable in Chapter I or IV | `?ramps=today / smooth` | one linear tween per property instead of a loop of stepped sleeps | B |
| MF-27 shake band | both | `?shakeband=today / band` | both camera-shake axes under 21 Hz (17.2 and 20.6 Hz instead of 23.2 and 33.5, which a 60 Hz screen aliases to 26.5) | B |
| MF-14 strike shape | both | the existing `?curves=real-snappy` / `real` | clips only, no code | clip |

## Where the code is

New modules (all under 400 lines): `src/engine/motion/MoveSwitch.ts` (the words), `HitReaction.ts`, `HitBeat.ts`, `RunEase.ts`, `RampBeat.ts`, `SummonBeat.ts`, `src/engine/rig/RigHandoff.ts`, `src/debug/moveApi.ts`. Call-site edits in L1's files, the smallest that work: `BattlePresenterBeats.ts` (one line: `hitReact(...)` replaces `shake` + `recoil`; one: `arrival(actor)` and `land()` in `summon`), `BattlePresenterEvents.ts` (`crossBack` in `dismiss`), `StrikeReach.ts` (`gap`). `PaintedActor.ts` grows by 40 lines (2,668 to 2,708), `RigActor.ts` stays at 399, `BattleCamera.ts` at 399. **Merge notes for the driver:** the L1 owner keeps the three call-site edits above when merging `mf-l1-swaps`; `KeyPoses.ts` is NOT edited here (MF-11's idle-key hold is the rig wrapper in `RigHandoff.ts`, which asks the actor whether a strike is in flight, so L1's rule for rigs can replace it later).

`docs/CONTRACT-CHANGES.md` has the entry (additive port members, and the two on-by-default behaviours with their reasons).

## Numbers

(the section "Measured" below carries them; the capture tools are scratch and not committed)

## Measured

Capture: the virtual clock (Playwright fake clock and a manual rAF queue), 2560 x 1440, headless GPU Chromium, seed 1, exact 60, 120 and 144 Hz, real key presses, on a dev server serving a snapshot of this branch (`11e7b76e1`, the merge below); the "before" build is the same tree at `317b2b40a` (the three merges, before MF-09). Speeds are px per 60 Hz frame at 2560 wide, read from a 120 Hz capture. The engine numbers are the lane's unit tests (`MF_LOG=1`), which run the real actor. Chapter I's camera is not the same from run to run (its start varies by a few hundred px); the cards use takes whose cameras agree, and a card says so when it had to align one.

**A items (on by default)**

| item | measure | before | after |
|---|---|---|---|
| MF-09 KO landing | ms from the lying painting half drawn to the first squash or ground shake, engine, 60/120/144 Hz | FFX 76 to 92, FFX-2 100 to 108 | 0 |
| MF-09, real browser, 120 Hz | the same, Tidus (Chapter I), Rikku (Chapter IV), a KO beat | 58 ms (FFX), 92 ms (FFX-2) | 0 and 0 (also 0 with `?kotopple=eased`) |
| MF-25 rig springs | the difference between 60 and 144 Hz on a 100 px bone (a tail, a mane, a stiff sash), engine | 0.286, 0.165, 0.146 px | 0.022, 0.022, 0.020 px |
| ghost frames a minute, continuity harness (the release tree's harness, 1600 x 900, seed 1), default address, the A items on | Chapter I; Chapter IV | baseline 101.8 (post-tool-pin); 153.5 before and 102 to 111 after post-flicker (its own note) | 100.2 and 107.8, 0 snaps both (this lane changes no painting swap) |

**B items (behind a word; the default is today)**

- MF-03 `?hit=`: engine, 120 blows per variant, a 300-damage blow on a 1,100 HP girl: first-frame move 8.8 px (60 Hz) and 19.8 px (120 Hz, per 60 Hz frame), 40 percent of first moves toward the attacker, 6 reversals, 6 to 8 jolts a blow (today) against 6.8 and 5.2 px, none toward, 6 reversals (ramp) and 2.5 and 2.3 px, none toward, 1 reversal, 0 jolts (knock). A 29-damage and a 553-damage blow move today's figure the same (23.5 px) and the knock's 14.7 and 30.8. Real capture, Chapter I, peak speed of the struck figure today / ramp / knock: Seymour Flux on Tidus (796) 40.0 / 19.0 / 8.4, Mortiorchis on Yuna (2,667, a KO blow) 44.6 / 23.4 / 15.9; Chapter IV, a 172 and a 689 blow, see the cards.
- MF-04 `?run=`, FFX-2 only: engine: the stand between the run and the lunge 133 ms to 0 (flow), contact 650 to 500 to 514 ms (60 to 144 Hz), the contact x the same (293.1 / 293.0 px at 1600 wide), run peak 28.3 to 19.9 px (60 Hz), take-off step 13.8 to 3.4 (commit cf7c0cbb6). Real capture, Rikku run peak 88.0 / 65.0 / 65.0 / 40.2 (today / smooth / flow / pace), Paine 57.5 / 44.0 / 43.9 / 35.4; the contact excursion is the same to 4 px in every variant (Rikku 698 / 701 / 700 / 696, Paine 449 / 451 / 450 / 449). One take of Paine/flow stood 82 px farther at the stop: the stand-off planner is timing-sensitive; a repeat matches (found filming, not a defect of the lane).
- MF-11 `?rigko=whole`: real capture, 120 Hz: Seymour Flux sinks 87 px below its start and then lifts 48 px, with the word 40 px and 0 (the body stays down); Bahamut 61 px and 33 px, with the word 25 px and 0. The thud shows 216 / 166 ms after the ko painting (FFX) and 167 / 150 ms (FFX-2) against the key's end at 150 ms. The strike's idle key: Seymour Flux 2,408 ms after its first move while the slide home is still at 23.6 px a frame, then 2,675 ms at 0.8; Bahamut 675 ms (before the slide home has begun) then 1,358 ms (after it).
- MF-12 `?hurtstring=` in the harness, Chapter I (a real-time fight, so the route differs between runs): ghost frames a minute 100.2 to 88.6 (-11.6, the plan's "about -12"), ghost swaps 171 to 153, swap jerks 8 to 4 (worst 67.2 to 45.1 px); the run's worst dash is a different dash (54.5 to 114.2 px; not a swap, not this word's). In the string clip: the engine's round-robin order of a party-wide multi-hit (Total Annihilation, 5 rounds) through the presenter's own burst: Tidus shows hurt, ready, hurt four times in a string (gaps 75, 33, 25, 33 ms, 10 painting swaps) today and one hurt from the first blow to the last (2 swaps) with the word. The string is synthetic (the engine did not play it); the events and the order are the engine's.
- MF-15 `?summon=`: engine only, no numbers beyond the 390 ms the exit is shorter by and the lift at rest on both ends; the clip is the evidence.
- MF-17 `?kotopple=`: engine: the first-frame turn speed 2.2 rad/s and the last-frame 6.2 rad/s before the cut, both 0 with the word. Real capture, Tidus slide peak 23.7 px a frame (the cut's jump) to 6.6; Rikku 7.0 and 7.8 (the landing wobble).
- MF-23 `?ramps=`: one linear tween per property instead of 4, 6 and 12 stepped jumps (petrify, dim, shrink), engine and a staged clip; none of it is reachable in Chapter I or IV.
- MF-27 `?shakeband=`: real capture of the camera shake, the head's screen x: energy above 21 Hz 43 percent (60 Hz capture) and 37 percent (144 Hz) today against 0 and 3 percent with the band; peak speed 9.8 to 7.3 (60 Hz) and 13.9 to 11.8 (144 Hz).

**Clip cards** (`D:/Tools/pyrefly-scratch/2026-10-26/fluidity/cards/CP-xx/<card>/`: a 60 fps clip, a quarter-speed clip of the capture, a 1080 px still card, `KEY.json`, `numbers.json`; blind letters): CP-03 hits (Chapter I and IV, light and heavy), CP-04 run (Paine, Rikku), CP-05 strike shape (Tidus, Paine), CP-06 the boss going down and a boss strike's return (both chapters), CP-06b KO and revive (Tidus, Rikku), CP-07 an aeon arrives and leaves, CP-10 a hurt string, CP-13 three fades, CP-16 the shake at 60 and 144 Hz.

## Not done, and why

- Default flips are the driver's (wave 2); every look item stays at today until a clip is picked. The deep review the changed area owes is `critic-plan`'s call (rig, presenter and `PaintedActor` files).
- MF-04's flow solves the lunge when the strike is asked for, while the camera is still moving; with a different camera than today the solved lunge can differ (it did not in the repeat takes). A lazier solve at the lunge's first frame is a call-site change in `BattlePresenterBeats.ts`, L1's file.
- MF-11's return rule is the `RigHandoff.ts` wrapper (the idle key waits while the actor's `striking` is true); L1's `KeyPoses.ts` rule for rigs would replace it.
- MF-14 has no V3 built (the plan's pick is V0).
- `PaintedActor.ts` is over the 400-line limit already (2,708 lines, +40 from this lane); the lane's additions are one-liners and the bodies live in new modules.

## Checks run

`npx tsc --noEmit` clean; the lane's twelve test files (145 tests) pass; the 169 test files that import any source file this branch changed or merged (2,522 tests) pass; `node tools/orphans.mjs` lists none of the lane's modules; the full suite (1,671 files) was not run. Branch `mf-l2-moves`, from `origin/main` `acbd815d3` merged with `origin/post-flicker` (final tip `8d005bfb9`), `origin/post-shake-time` and `origin/post-tool-pin`.

## Lines for the driver's CHANGELOG (not written into `CHANGELOG.md`, which every lane edits)

- Both: a knocked-out body's landing (squash, settle, ground shake) now plays on the frame the lying painting is half drawn, not 58 ms (FFX) or 92 ms (FFX-2) later.
- Both (Chapter I Seymour Flux, Chapter IV Bahamut): tails, manes and sashes on the rigs move the same at 60, 120 and 144 Hz.
- Behind address words, default as today: `?hit=ramp|knock`, `?run=smooth|flow|pace` (FFX-2 only), `?rigko=whole`, `?hurtstring=hold`, `?summon=leap`, `?kotopple=eased`, `?ramps=smooth`, `?shakeband=band`.
