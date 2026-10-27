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

(see the section "Measured" below, filled by the last pass of the lane)
