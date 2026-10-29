# r68-flowlead: the stand between an FFX-2 girl's run-in and her dash (release 68 prep)

Branch `r68-flowlead` from `origin/r68-int` (`7d80590d0`), 2026-10-28. **Game case: FFX-2 only** (the run-in is FFX-2's alone, `research/ffx2-combat-core.md` section 1, D-354; FFX has none). Authority: Bailey, 2026-10-28, "please work on the pose
continuity fix and and crtiques for chatgpt i mentioned awhile ago as well as motion fluidity and animation ... i'll go with all your recommendations and decision-making for the next couple days": the cap below is the sub-agent's call under that
delegation, the driver's to adopt and Bailey's to overturn. Not touched: `CHANGELOG.md`, `releaseNotes.ts`, the ledgers, NOW.md (the driver writes them). Nothing deployed; no browser, no server.

## The defect and its cause

Live release 67, Chapter IV, a girl's attack from a run-in under the defaults (`?run=flow`, `?curves=real-snappy`, `?strikeshape=travel`): between the run's stop and the dash the figure's world position moves under 1 px a frame for **183 to 200 ms**
(Paine mean 192, Rikku 192), against 133 to 150 ms in release 66's look (`D:/Tools/pyrefly-scratch/2026-10-28/r67/gaps/flow/world-stand.json`). The flow run exists to remove that stand.

Cause (the release 67 prep's prediction, confirmed): `BattleScreenRunIn.strike` asked for the strike `flowLeadMs(...)` before the run's end, and `flowLeadMs` was timed from the HOUSE flow profile's wind-up (100 ms + 40 overlap = 140 ms). Under a real profile
(`curves=real-snappy`) the strike that plays is the real one (`CurveBeats.startAttackMove`: `real ? real : flow`), whose wind-up is 300 ms for Paine and Rikku under `?strikeshape=travel` (273 paced ms at the default pace 1.1). So the wind-up ended 160 ms after
the run had stopped, and the dash's own slow first frames added the rest.

## What changed

| file | change |
|---|---|
| `src/engine/motion/RealMotion.ts` | new `windupMsOf(profile, heft)`: the wind-up as `StrikeCurve.resolveStrike` resolves it (heft stretch only on a house time, the real-phase frame floor) |
| `src/engine/motion/RunEase.ts` | `flowLeadMs(timeScale, paceFactor, windupMs = FLOW_PROFILE.windupMs)`: the default argument keeps release 67's number to the bit; new `FLOW_LEAD_MAX_SHARE = 0.85` (was an inline 0.6) with the sweep that picked it |
| `src/engine/motion/CurveBeats.ts` | new `profileAfterRun(ctx, id)`: the profile `startAttackMove` hands the actor after a run-in (`realProfileOf ?? flowProfile()`), so the port and the beat read one answer |
| `src/app/screens/BattleScreenRunIn.ts` | the lead = `min(FLOW_LEAD_MAX_SHARE * ms, flowLeadMs(scale, pace, windupMsOf(profileAfterRun(...), heft)))`; new `reachTruck(id)` (the stand-off's truck, kept on the run) |
| `src/engine/BattlePresenterMotion.ts`, `src/engine/motion/StrikeReach.ts` | additive optional `reachTruck?(actorId)` on the port; `strikeReach(..., gap, truck?)` reads every figure through it (see "Why the truck" below) |

Not in `docs/CONTRACTS.md`, so no `CONTRACT-CHANGES.md` entry (`BattlePresenterMotion.ts` is a presenter-local port; the new member is optional and only `RunInMotion` answers it).

**Untouched, exactly:** `?run=today` (no wait is asked for, no profile is read), `?run=smooth`, release 66's address (`?stance=today&swapcause=today&hit=today&run=today&curves=new&rigko=today&strikeshape=today`, pinned by number in the tests: Paine 133 ms stand, contact at 650 ms),
the flow run with release 66's curves (`curves=new`: the house flow profile, so the lead is release 67's to the bit), FFX (no run-in), a long-range girl (no run), REDUCE MOTION and an open menu (`still`: nothing plays).

## Why the truck (a hidden coupling the cap would have broken)

The strike's lunge is solved against the foe through the camera of the blow (`StrikeReach`, r391): `StageMotion.rect` reads a cut rig with "the truck as it is NOW". The camera truck is a `quadInOut` tween on the UNPACED frame clock (`BattlePresenterStage.update`:
`motion.update(dt)`), so it is about 77 percent done where release 67 asked for the strike (the brake) but only about 6 to 10 percent done at 15 percent of the run. A near girl and a far foe slide by different amounts under a truck (in the r67 recordings the camera slides 0.54 to 0.74 world
units over a run; the sim's near girl and far foe differ by about 35 px a unit at 1600 wide), so a part-way read puts the foe nearer than it will stand: the lunge would stop about 15 to 25 px short (an estimate from the sim's pinhole world and the recordings' truck; release 67's own read, further along its truck, was off by a few px for the same reason). `RunInMotion.reachTruck` hands the solver the truck the
run ends under, so the read is the one the strike asked for after the run has always had. Pinned in `r68-flowlead.test.ts` (every shape read carries the final truck; the solved lunge equals the one the camera of the blow gives, whatever the truck is part-way).

Not fixed, noted: `reachGap` carries x only. A stop at another depth than her home would be read at her current depth. All five Chapter IV runs in the r67 recording have dz 0 (Paine and Rikku vs Bahamut: stop z equals home z), so nothing live depends on it; the Leblanc and other chapters run with the curves off (no flow).

## The cap, and the modelled stand (what was measured and what is predicted)

`tests/unit/helpers/FlowLeadSim.ts` drives the REAL run-in port, strike beat, lunge solver and curve driver over a tween group, one frame at a time at 60, 120 and 144 Hz, at FFX-2's default pace (1.1), with a live camera truck on the unpaced clock, and takes the live pass's own measure
(world speed under 1 px per 60 Hz frame after the run's peak, until it is over it again). **It reproduces the live pass before it is used** (tests 1 and 2 of "the model reproduces the live pass": release 67 at 60 Hz 183 / 200 ms against the live 184 to 200; release 66's look 133 against the live 133 to 150).

Stand in ms (common short run, Chapter IV rest positions; the model, not a recording):

| | Paine 60 / 120 / 144 Hz | Rikku 60 / 120 / 144 Hz |
|---|---|---|
| release 66 look (`?run=today`, `curves=new`) | 133 / 142 / 132 | 133 / 133 / 132 |
| **release 67 (before)** | **183 / 200 / 188** | **200 / 192 / 188** |
| **release 68 (this branch, cap 0.85)** | **33 / 33 / 28** | **17 / 0 / 7** |

A long run (starts at x -4): 0 ms at every rate for both. Sweep of the cap on the common short run: 0.6 gives 104 to 125 ms, 0.75 gives 49 to 75, 0.8 gives 25 to 50, **0.85 gives 0 to 33**, 0.97 gives none (the strike is asked for in the run's first stride). 0.85 was taken for the margin under the 60 ms ideal (the live measure
varies by a frame or two). Also modelled, against release 67: the biggest one-frame speed step is the same (no new kink), the lowest world speed is at or above 0 (releases 66 and 67 drift back 0.25 to 0.9 px a frame at the run's end, the wind-up's pull-back against a stopped run), the painting swap is on the same frame class
and the same speed (11.5 and 13.8 px a frame: `travelPeak`), and **the blow lands 150 to 185 ms earlier than release 67's (700 and 733 ms to 550, from the run's start) and about 100 ms earlier than release 66's** (the hit follows the strike's contact mark, `ContactBeat.meetContact`, so the recoil moves with it).

## Tests

`tests/unit/r68-flowlead.test.ts` (17 tests, new) and `tests/unit/helpers/FlowLeadSim.ts` (new). The stand tests fail at cap 0.6 (checked), the lead and cap tests fail on release 67's code. Related, unchanged and green (342 tests in 21 files): `mf04-run-ease`, `mf04-run-trajectory`, `mf14-strike-shape`, `r38-run-in`, `r38-run-in-staging`,
`r391-run-in-reach`, `r391-reach-curve`, `r392-calm-lunge`, `stand-reach`, `release67-picks`, `release67-strikeshape`, `engine/real-motion`, `engine/contact-beat`, `engine/motion-core-*`, `engine/lunge-walk-back`, `engine/r35-art-keys`, `ff7-phase3`, `ff7-repair`. `npx tsc --noEmit` clean. Full `npm test` is the driver's before any push to main.

## Browser job (owed; the browser was busy)

`D:/Tools/pyrefly-scratch/2026-10-28/r68-flowlead/job-spec.md`, with the harness copies in `lib/`: the gaps-1 measure on the candidate build, Paine and Rikku, about 5 attacks each, seed 1, with the prediction (stand 0 to 33 ms Paine, 0 to 17 Rikku; every attack at most 50 ms; `windupBeforeRunEndMs` -35 to 0;
contact 150 to 185 ms earlier; `wx` at the contact within 2 px of release 67's), what would falsify it and what to change. A motion strip of Paine's and Rikku's first two attacks against the live release 67 is part of it: the early lean-back is a look and only motion can judge it.

## Putting a pick back

- The cap is one line: `FLOW_LEAD_MAX_SHARE` in `RunEase.ts` (0.75 if the lean-back at speed reads wrong in motion; still 49 to 75 ms of stand, under release 66's; 0.6 was release 67's inline cap).
- Release 67's lead exactly: `windupMsOf(...)` in the `BattleScreenRunIn.ts` lead line replaced by `FLOW_PROFILE.windupMs` (and the cap 0.6). `?run=smooth` is the way to see no early strike at all; `?run=today` is release 66's.

## Open questions for the driver

1. **Judge the look in motion.** Under the cap the wind-up (crouch, a lean-back of up to 3.4 degrees, a 3 px pull) starts at 15 percent of the run, so she leans back about 2 to 3 degrees while still at cruise speed before she brakes; release 67 braked first and wound up after. Numbers cannot say whether that reads as winding up or as braking early. The strip in the job spec answers it; the fallback is cap 0.75.
2. **The hit comes 150 to 185 ms sooner after the action starts** (the whole attack is that much shorter than release 67's, about 100 ms shorter than release 66's, which is what the release 67 note promised). Camera, numerals and sound follow the contact mark, not a clock, so nothing should drift; the job's "dash arrival to the recoil 0 to 50 ms" row checks it.
3. `reachGap`/`reachTruck` cover x and the truck, not a stop at another depth (all five measured Chapter IV runs have dz 0). Worth the same treatment if a chapter with the curves on ever plans a stop off her depth lane.
4. Under `?curves=real` (the real speed, not the default) Rikku's real wind-up is 433 ms, longer than the run: the cap binds and a stand of about 100 ms remains. It is an opt-in word; compressing a real wind-up that flows out of a run would change the move's look and was not done.

## CHANGELOG line (for the driver; FFX-2 only)

FFX-2: a girl's run-in now flows into her dash. The strike is asked for by the wind-up that actually plays (the real 300 ms one in Chapter IV), not the house 100, so the stand of about a fifth of a second between the run and the dash (183 to 200 ms live) is gone (modelled 0 to 33 ms); the blow lands about 150 ms sooner than in release 67. `?run=smooth` and `?run=today` are unchanged.
