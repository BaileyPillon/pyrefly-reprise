# r74-revive: a revive's first frames continue from the lying figure's place (PR-0570)

Lane r74-revive, branch `r74-revive` from `origin/r73-int` `d5049f686`. **Game case: BOTH games (shared plumbing).** The KO run (`KoFall.ts`), the living mix (`fx/mix/living.ts`) and the actor layer serve FFX chapters 1 to 3 and FFX-2 chapters 4 to 6; no source in `research/` gives either game a revive blend, so the cross is `[ours]` and one for both. Measured in FFX Chapter II (Yunalesca); read offline for seven FFX figures and three FFX-2 dresspheres. Authority: Bailey 2026-10-31 ~23:40 EDT, "i'll go with all of your recommendations. you make the executive decisions for the next few days" (the driver's call, his to overturn). Nothing here deployed and no browser ran (the release-73 review owns it): the browser checks are job specs with predictions (section 6).

## 1. What was asked, and what the evidence says

Round 33b read 21 swap jerks in Yunalesca's fight, 7 of them revive swaps stepping 50 to 131 px (14 revives in 1,294.8 s); release 69 had read 3 of 8 revives up to 89 px. The suspect in the brief was release 72's eased knock-out slide (`SlideEase` in `ProneLay`).

**It is not the slide.** Three independent reads agree:

- Release 69 read the same 88 px before `SlideEase` existed.
- The release-73 Yunalesca revive job (seed 2, 1,013 to 1,173 s of battle): live release 72 has 4 revive steps of 88, 89.7, 90.6 and 131.5 px in 8 revives (all Wakka, the tracked **feet**, dx -83 to -123); `?treated=pack` (release 70's draw, no eased slide) has 4 of 10 at 48.4, 88.4, 88.6 and 88.8; the candidate 1 of 8 at 88.8. The same 88 to 89 px for Wakka in every arm (the 48.4 is Yuna's head on a 2.4 ms frame): the step does not depend on the slide.
- Offline with the real `PaintedActor` and **no neighbour, so no slide at all**, Wakka's revive reads 92.8 px at 60 Hz (live 83 to 88; this camera is about 5 percent nearer).

**The cause is the revive's 75 ms cross.** `living.revive` crosses the lying painting to the standing painting already toppled where the body lay; its head is set on the lying head (`meeting`, release 69: the head step is 2 to 7 px) but the body is longer than the curled lying one, and the harness's tracked "feet" of a LYING painting is the silhouette's lowest thick part (`estimateStance`; the pose table leaves a lying stance null), which for Wakka is at the head end of the painting. The two planes' tracked feet are about 300 px apart. The harness averages the planes' points weighted by their fades, so the tracked feet travel that distance as the incoming share goes 0 to 1, and the old cross (`1 - u` out, `u * u` in, 75 ms) takes that share in four frames at 60 Hz: 0.06, 0.20, 0.31, 0.31, 0.12. 0.31 of 300 px is the 90-odd px step in each of the two middle frames. The earlier fixes (the held slide, the slide target read once) were right and are untouched; this step was never theirs.

Two things stay true and are disclosed: (a) nothing the player sees moves 90 px, two paintings fade; the step is what CHK-027 gates; (b) the instrument's "feet" of a lying body is not where its feet are (see open question 3).

## 2. The change

- **New `engine/motion/ReviveCross.ts`.** `REVIVE_CROSS_MS` = 160; `reviveCross(u)`: the lying painting's and the standing one's fades at progress `u`, built so the incoming painting's share of the pair is `u` itself (an even share: every frame moves the weighted points the same distance) with the old cross's cap on the lesser plane kept (`(1 - u) * g` and `u * g`, the dip `g` taking the sum to `2 * KO_CROSS_PEAK` in the middle: the lesser plane is 0.382 at most, as before). The `?revive=` switch: `reviveWord()`, `reviveEvenOn()`, `setReviveWord()`, `REVIVE_DEFAULT` (`'even'`, ONE line to flip).
- **`KoFall.ts`.** `KoRunOptions.even`, `reviveRun(travel, eased = false, even = false)`, `REVIVE_EVEN_MS` = 480. Only a body that topples and gets up plays the longer cross, and not the held `?kotopple=eased` revive (its rise is 420; 160 + 420 would pass the presenter's 520). With `even` false the run is release 73's, option for option. `KO_CROSS_MS`, `REVIVE_MS` (395) and the fall are unchanged.
- **`fx/mix/living.ts`.** Passes `reviveEvenOn()`; the header says 480 ms.
- **Why 160 ms and an even share.** Tried against the same measure (real masks, 60 Hz, the worst of the ten figures): the old cross 92.8; meeting by the middle instead of the head (what the fall's cut does) 75.3 (Rikku; eight figures over 40, and it moves the step from the feet to the head); the old curve over 125 ms 52.9; the even share over 100 ms 55.3, over 125 ms 44.3, over 150 ms 37.0 and **over 160 ms 34.7**. A step is Delta times (the share a frame takes), so only the share per frame helps; 160 + 320 (the rise) = 480 leaves 40 ms (2.4 frames) before the presenter's 520 wait, and 160 keeps 13 percent under the 40 px limit at the live frame times (15.4 to 18.2 ms).

## 3. Numbers (the harness's maths: `figureTrack`, `detectJerks`, real masks, the registered heads; px at 1600 wide; the largest one-frame step of the weighted feet or head in the revive; fixture camera 8 units out)

| figure | 60 Hz today | 60 Hz even | 120 Hz today | 120 Hz even | 144 Hz today | 144 Hz even |
|---|---|---|---|---|---|---|
| wakka | 92.8 | 34.7 | 47.8 | 17.6 | 39.8 | 14.7 |
| kimahri | 66.9 | 28.0 | 34.1 | 14.5 | 28.5 | 12.2 |
| rikku | 83.4 | 30.7 | 43.0 | 15.6 | 35.8 | 13.0 |
| auron | 63.5 | 32.1 | 32.2 | 16.6 | 26.9 | 13.9 |
| lulu | 53.7 | 25.5 | 27.2 | 13.5 | 22.7 | 11.3 |
| yuna | 64.3 | 25.9 | 32.7 | 13.6 | 27.4 | 11.4 |
| tidus | 31.6 | 27.6 | 18.4 | 14.6 | 14.6 | 12.3 |
| yuna-songstress (FFX-2) | 51.8 | 31.3 | 26.4 | 16.5 | 22.0 | 13.8 |
| rikku-thief (FFX-2) | 42.9 | 19.5 | 22.1 | 10.6 | 18.4 | 8.9 |
| paine-warrior (FFX-2) | 32.4 | 28.3 | 19.2 | 14.9 | 15.2 | 12.6 |

Today, six figures step over 40 px at 60 Hz and Wakka and Rikku are still over it at 120 Hz; with the even cross none reaches 35 px at any rate, and the harness's `detectJerks` finds nothing in the whole 520 ms revive. The 60 Hz worst case for the eased knock-out slide (reviving at 60, 250, 500, 800 and 1,500 ms after the fall, a neighbour standing beside the body) and for a live run's frame times (15.4 to 18.2 ms) also reads under 40 px.

What the harness reads of the swap itself, five figures at 60 Hz (today to even): blend frames 4 to 9, ghost frames 2 to 6 (33 ms to 100 ms), ghost peak 0.333 to 0.366, ghost severity 0.18 to 0.28 becomes 0.22 to 0.32 (limit 0.40; the cap is unchanged, so no overlap can pass it). **The price**: both paintings show for 100 ms instead of 33; the figure is upright at 480 ms instead of 395 (the rise starts 85 ms later); CHK-027's ghost milliseconds a minute rise by about 40 in a fight with 14 revives in 21.6 minutes (about 1 percent of the 4,621 on the live Yunalesca run).

## 4. Tests

- New `tests/unit/engine/revive-even-cross.test.ts` (48), `revive-even-cross-run.test.ts` (12) and `revive-even-fixture.ts`: the real `PaintedActor`, `LivingFigure` and `layProneFigures` (with the stage's clock where the slide eases), the real revive call, at 60, 120 and 144 Hz.
  - The premise: `?revive=today` reads 80 to 100 px for Wakka at 60 Hz in frames 2 to 4 of the cross with no slide, and every one of six figures over 40.
  - The even cross: for ten figures (FFX and FFX-2) and the three rates, no step of the weighted feet or head reaches 40 px over the whole 520 ms and `detectJerks` is empty; never worse than today for any figure and rate; the step falls with the frame time; a live run's frame times; reviving 60 to 1,500 ms after the fall with the eased slide running (the lying plane does not move under the figure getting up; the standing plane's head starts on the lying head).
  - The run's numbers (160 + 320 = 480 under 520, `?revive=today` frame by frame, the held eased revive and a figure that never topples keep the capped cross, REDUCE MOTION plays no run, the fall is untouched), the cross's maths (an even share, the lesser plane never over the old cap, monotone), the address, and a guard that re-measures the table of KO silhouette stances from the paintings where the art is on disk (skipped elsewhere).
  - A mutation (living.ts ignores the word) fails 15 of the 60.
- `ko-revive-actor.test.ts` and `m3-ko-eased-harness.test.ts` now name `?revive=today`: they guard release 67's 395 ms timeline and the eased arm's comparison with today's.
- `npx tsc --noEmit` is clean apart from this sparse worktree's missing `docs/concepts/...` files (the `pause-living-portrait-*` tests; not touched). `node tools/orphans.mjs`: 24 orphaned of 2,242, the same 24. `vitest related` on the three changed modules: 86 files, 84 pass; the other two (`r73-fast-review`, `r73-skip-floor`: six tests) read `docs/handoff/r73.md` and `r73-fast.md`, which this sparse worktree does not check out (tracked, absent on disk), so they fail here and not because of this change. The whole suite is too slow to run in a lane (25 minutes covered 18 of 1,869 files, the statistical benches); it is owed to the integration.

## 5. What a player sees

A revive: the lying body dissolves into the figure getting up over about 10 frames (160 ms) instead of 4, with the standing figure already beginning to lift while it fades in; the aura and the puff are unchanged. REDUCE MOTION is unchanged (a cut). It is a perceivable change (hard rule 9; "rigs are judged in motion"): job J74-3 makes the clip. The default is ON because the brief is to fix the step; `REVIVE_DEFAULT = 'today'` (one line) or `?revive=today` puts release 73's cross back.

## 6. Job specs and predictions (rule 15; none run here)

All read the continuity harness's `continuity.json` per run, as the release-73 `yuna.mjs` does (swap class by `fromPose>toPose`, the jerks at a swap, `longFrame`).

- **J74-1, the PR-0570 job.** Production candidate served locally, headless Chromium, FFX Chapter II (Yunalesca), seeds 1 and 2 (the long one), arms `?revive=today` (control) and the default (candidate), `?coach=off` as the release-73 runs. *Predictions:* control `ko>idle` swap jerks of 40 px or more: 3 to 5 in a 1,000 s fight, all Wakka's feet at dx -83 to -90 (one up to 131 on a short frame), as live release 72 (4 of 8). Candidate: **0 in steady frames** (largest 38 or less; any 40 or more falls on a frame over 28 ms, `longFrame` true); each `ko>idle` swap record has `blendFrames` 8 or more, ghost frames 5 to 7, ghost severity 0.33 or less, `snap` and `hardCut` false. `swapJerksWorstPx` falls from 131.5 to 98.7 or less (the next class down is `idle>ko`); `swapJerks` (seed 2) from 14 to 10 or fewer. CHK-027 **stays FAIL** (the fall's `hurt>ko` 78 to 83 px and `idle>ko` 44 to 98 px are not this lane); CHK-026 is no worse than the control; the battle's length is within 1 percent (the presenter's revive wait is 520 either way).
- **J74-2, FFX-2.** Chapter IV, a Phoenix Down on each of the three girls after a knock-out (Yuna songstress, Rikku thief, Paine warrior), both arms. *Predictions:* control 51.8, 42.9 and 32.4 px (the tracked feet or head, 60 fps); candidate 31.3, 19.5 and 28.3; no `ko>idle` jerk in either game's candidate arm.
- **J74-3, the clip for Bailey.** 60 fps, 1,600 wide, Wakka's and Auron's revive from J74-1, today and candidate side by side, frames -2 to +16. *Predictions (what he should see):* today, the lying body flicks into the toppled figure in 4 frames and rises; candidate, a 10-frame dissolve, the standing figure at about 45 percent at frame 4 and whole at frame 10, the body already lifting from frame 6; the head does not hop in either; the aura is the same. The driver decides `REVIVE_DEFAULT` after it.
- **J74-4 (only if the harness can run at 120 Hz).** J74-1's candidate arm at 120 Hz. *Prediction:* the largest step 18 px or less.

## 7. Put it back

`?revive=today` is release 73's cross exactly (same run, same fades frame by frame: `revive-even-cross-run.test.ts`). `REVIVE_DEFAULT` in `motion/ReviveCross.ts` flips it for everyone in one line. Nothing is removed.

## 8. Open questions (for the driver)

1. **Default on or after the clip?** The default is `even` (the brief is to fix the step). It is a visible change to every revive in both games, and Bailey judges motion in motion; J74-3 is the evidence. Flip `REVIVE_DEFAULT` if the clip is to come first.
2. **The fall's counterpart.** The same class of step is in the knock-out: Wakka's `hurt>ko` 78.7 to 83 px (3 in the seed-2 live run) and `idle>ko` 44.4 to 98.7 px (live and pack arms), Auron's `hurt>ko` 35 to 39. That is the fall's cut and its smear (`meeting` by the middle; the planned smear is excused up to its cap), a different mechanism; not touched. It is the remaining part of the 21 swap jerks of round 33b.
3. **The instrument.** The tracked "feet" of a LYING painting is its silhouette's lowest thick part (Wakka's sits at the head end), not a stance; CHK-026 already treats a lying body's feet as not standing, but CHK-027's jerk detector still follows them. Dropping a prone plane's stance from `figureTrack` would remove this class from the gate; it is a policy change (rubric v2, the deep review's business), so not done here.
4. **The eased arm.** `?kotopple=eased` (held, not the default) keeps its 75 ms cross: its rise is 420 and a 160 ms cross would pass the presenter's 520. Its revive steps for Wakka and Rikku the thief stay as `m3-ko-eased-harness.test.ts` records them.
5. **Foes and aeons.** A figure that never topples (an aeon, a giant, a foe) keeps the capped cross; its revive step was not measured (centroid-tracked, no registration). Say if it should join.
6. **A long frame inside the cross** still steps in proportion (a 28 ms frame takes 1.7 times the share); the harness reports such a step as a long frame and does not gate it.

## 9. CHANGELOG lines (game-tagged; for the release that carries this branch)

- **Both games (shared plumbing; `motion/ReviveCross.ts`, `KoFall.reviveRun`, `fx/mix/living.ts`): a revive's cross from the lying figure to the one getting up is longer and even (160 ms, was 75), so no frame of it moves the figure's tracked feet or head 40 px.** The live Yunalesca fight (FFX Chapter II) read 83 to 88 px for Wakka in four revives of four (131.5 on a short frame) in release 72 and, in the same size, in release 69's and 70's draws; it was never the knock-out slide. Offline with the real paintings the largest step is 34.7 px or less at 60 Hz (was 31.6 to 92.8) and 17.6 or less at 120 Hz, for seven FFX figures and three FFX-2 dresspheres. The figure is up at 480 ms instead of 395 (the presenter's wait is 520).
- **Both games: `?revive=today` plays release 73's 75 ms cross; `REVIVE_DEFAULT` in `motion/ReviveCross.ts` flips the default.** REDUCE MOTION (a cut), the knock-out fall, the held `?kotopple=eased` revive and figures that never topple are unchanged.
- **Both games, tests and records, nothing else a player sees.** 60 new tests (`revive-even-cross.test.ts`, `revive-even-cross-run.test.ts`, `revive-even-fixture.ts`); `ko-revive-actor` and `m3-ko-eased-harness` name `?revive=today`; the contract-changes entry.
- **Open or carried.** The fall's own step (Wakka `hurt>ko` 79 to 83, `idle>ko` 44 to 99 px); the instrument's "feet" of a lying body; both paintings show 100 ms instead of 33 in a revive (ghost severity 0.22 to 0.32, limit 0.40).
