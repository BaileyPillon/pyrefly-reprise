# r69-revive: the second jump of a revive (both games; FFX Chapter I is the case that shows it; 2026-10-29)

Branch `r69-revive` (from `origin/main` 67256e1ca = release 68 + its records). Written by a sub-agent of the release driver; Bailey delegated the decisions ("i'll go with all your recommendations and decision-making for the next couple days", 2026-10-28).
**Nothing is deployed; no browser was used (a deep review holds it).** The proof so far is a frame-loop test through the real `PaintedActor`, `LivingFigure`, `layProneFigures` and the revive call; the browser jobs are specified below with their predictions.

## Game case (AGENTS.md rule 14)

**Both games.** `fx/mix/living.ts`, `ProneLay.ts` and the actor are shared by FFX chapters 1 to 3 and FFX-2 chapters 4 and 5; the revive's run is one shape for both (`KoFall.reviveRun`; the mix's `game` only sets a fall's buckle length). FFX Chapter I is the case that shows it:
its lying body is slid 0.74 units off Kimahri's KO. FFX-2 Chapter IV's Rikku lies with no slide (x -0.0415 in release 68's rows) and reads the same before and after. FFX Chapter II's Tidus carries the same release, smaller (0.131 units, 20 px).

## The defect

Release 68 (live), FFX Chapter I, Tidus revived beside Kimahri's KO (`D:/Tools/pyrefly-scratch/2026-10-29/r68/gaps/`, `evidence/revive-ch1-zoom-4to7.png`): release 68 had removed the 80 to 108 px pop of the KO painting in the first revive frame, but on
frame 6 (+117 ms) the tracked head stepped 89.3 px and the opaque standing plane's mesh x went 0.5805 -> 0.0068 in one frame.

## The cause (found by reading, then reproduced in the frame loop before anything was changed)

The brief's hypothesis, that the standing plane eases from the lying slide and the hold in `ProneLay` releases it, was right about the trigger and short of the mechanism:

1. The revive crosses the lying painting to the standing one, already toppled, then stands it up (`KoFall.reviveRun`: 75 ms cross + 320 ms rise). While it is toppled, `KoTip.placeTipped` slides the standing plane so its head meets the lying body's head;
   the target is `living.ts` `meeting(p)`, which **read the lying plane's own placement (`mesh.position`) on every frame**. That placement includes `ProneLay`'s slide of the lying body (0.74 units in Chapter I, `PaintedActor.proneShift`).
2. Release 68's hold (`ProneLay.held`, commit f2e5f9574) keeps that slide until the lying plane has faded (`proneLingers` false), i.e. at +75 ms, in the middle of the rise. It then calls `setProneShift(0)`: the lying plane (fade 0, unseen) moves by 0.74.
3. Next frame `meeting()` reads the lying plane at its new place: the target moves by 0.74 and the standing plane, still 70 percent of the way along its slide, moves by 0.74 x 0.70 = 0.52 units (81 px at 155 px a unit; with the frame's own step 0.57, 89 px) in one frame, opaque.

So the standing plane did not ease from the lying slide at all: its slide target silently followed an invisible plane. The numbers agree with the live clip to a few percent: the frame-loop reproduction at 60 Hz gave x 0.641 -> 0.059 on frame 6 (live 0.5805 -> 0.0068), the same frame.

## The fix (one file, 8 lines: `src/engine/fx/mix/living.ts`)

A revive's slide target is read **once, when its run begins** (`Playing.meet`, set at the end of `begin()` for a revive that travels) and `meeting()` returns it. At that moment the lying body is laid and visible, so the standing plane starts exactly where the body lay (as in release 68);
from then on the target does not depend on a plane that `ProneLay` moves when it lets the slide go. The standing plane then slides from the lying place to its home over the rise, linearly with the turn (`slide = 1 - turn`), as `KoFall` always designed. The fall is unchanged (it still reads the lying plane live: `ProneLay` lays
the body on the frame after the KO, and the fall's slide share is near 0 then). `ProneLay.ts` is untouched: its hold still fixes what it fixed (the visible KO painting does not jump in the first frame).

## Tests

`tests/unit/engine/revive-follows-slide.test.ts` (22 tests; **14 fail on release 68's code, all 22 pass now**): the real `PaintedActor` (Tidus's real pose records, his KO laid by a synthetic underside) under the real `LivingFigure`, the real `layProneFigures` every frame in the stage's order
(mix, actor, `layProneFigures`, head lock), the real revive call (`setPose('idle')`), at **60, 120 and 144 Hz**, with a standing neighbour that makes the stage slide the lying body (the chooser's own slide) and with **Chapter I's slide (0.74)** set on the lying body. Each rate and lay:
(a) the standing plane's x, y and roll and the tracked head's place are identical (within 1e-9 units, 0.01 px) to a control revive whose lying slide is never released; (b) while the standing plane shows, the slide's step changes by at most 3 px (at 155 px a unit) from one frame to the next;
(c) it ends upright at the idle's home with the slide let go and the lying plane gone. Plus: the FFX-2 game word and FFX give the same revive; the eased revive (`?kotopple=eased`, held) has no jump; a revive from a body with no slide is unchanged.

Gates run: `tsc --noEmit` clean; `tests/unit/engine` plus the KO suites 1,895 passed; the whole `tests/unit` tree in four shards (everything except the `chapters` directory) **24,758 passed, 0 failed** (shard totals 5,671 + 5,686 + 7,411 + 5,990; skipped and todo not counted); `tests/unit/chapters` without its `*bench*` files 2,217 passed.
**Not run: the `*bench*` files of `tests/unit/chapters`** (they exceed the 9 minute limit of one foreground call: the Chapter XI ship bench alone is 432 s); they test `src/battle`, which this change does not touch. `living.ts` is 375 lines.

## Per-frame steps, before and after (Chapter I's slide, frame loop; `D:/Tools/pyrefly-scratch/2026-10-29/r69-revive/step-table.txt`)

Plane x in px at the live clip's 155 px a unit; the tracked head in the test scene's pixels (1600x900, which read 1.5 to 2 times the live clip: the same jump is 89 px live and 139 here).

| | release 68 (live target) | this build |
|---|---|---|
| 60 Hz plane x, largest step | **90.2 px** (frame 6) | 6.2 px (the slide's own speed) |
| 60 Hz, largest kink in the step | **89.2 px** | 1.2 px |
| 60 Hz tracked head, the frame-6 step | **139.1** (steps 42.5, 139.1, 16.5) | 23.9 (steps 43.3, 23.9, 22.6) |
| 120 Hz plane x, largest step / kink | **92.2 px** (frame 10) / **91.9** | 3.1 px / 1.0 |
| 120 Hz head, the step at the jump | **136.5** (30.3, 136.5, 9.2) | 12.5 (30.8, 12.5, 12.2) |
| 144 Hz plane x, largest step / kink | **91.8 px** (frame 12) / **91.6** | 2.6 px / 0.2 |
| 144 Hz head, the step at the jump | **135.0** (22.1, 135.0, 7.7) | 10.4 (22.5, 10.4, 10.2) |

The slide itself moves 4.8 px a frame on average at 60 Hz (0.74 units over 24 frames), 2.4 at 120, 2.0 at 144: **the literal reading "no one-frame step over 3 px" cannot hold at 60 Hz for a slide of 0.74 units inside the revive's 395 ms** (`TIMING.revive` is 520). What this build guarantees is that the revive adds nothing:
the plane and the head are identical, frame by frame, to a revive whose slide is never released, and the slide's own step never changes by more than 1.2 px from one frame to the next.

`node tools/critic-plan.mjs --paths src/engine/fx/mix/living.ts,...`: 1 shipped file, 2 with no product effect; systems effects, lighting and sprites; games both; checks CHK-008 CHK-013 CHK-016 CHK-017 CHK-020 CHK-021 CHK-026 CHK-027; review DEEP only because 3 substantial checkpoints have passed since the last deep review (the planner reads this build's base, not this change alone).

## The browser jobs (owed; nothing ran)

Specified in `D:/Tools/pyrefly-scratch/2026-10-29/r69-revive/jobs/JOBS.md` (copied in short here, because scratch folders vanish), with the stepped probe of the r68 gap pass (`lib/j8-stepped.mjs`, unchanged but for three constants) and a checker `r69-check.mjs`
that prints PASS or MISS against the prediction (self-tested on release 68's own evidence: it MISSes Chapter I there at 89.0 px and passes the Chapter IV control against itself). Serve the candidate with `node node_modules/vite/bin/vite.js --port 5321` from `D:/pyrefly-pilgrim-proto`, one job at a time under the RIG-RECORD lock, and stop the server afterwards.

| Job | Chapter, figure, rate | Command core | Prediction |
|---|---|---|---|
| R1 | `seymour-flux`, tidus, 60 Hz, arm `B:today:real-snappy`, `?coach=off`, 1600x900 | `j8-stepped.mjs`, then `j8-stepped-analyze.mjs`, then `r69-check.mjs --pop=6` | frames 0 to 5 as release 68 (x 0.740 ... 0.582); **frame 6 x 0.53 (+/-0.04, was 0.008)**, 0.49, 0.45, 0.37 at frame 10, 0.29 at 12, 0.21 at 14, 0.14 at 16, 0.033 at 20, home by frame 25; no x step over 9 px (was 89.0), kink 3 px or less; head `reviveSteps` frame 6 **14 to 24 px (was 89.3)**, `reviveMaxStep` 27 to 31 (was 89.3); `reviveFirstFrame` 1.7, no jerks, 0 console errors |
| R2, R3 | the same at `--hz=120` (pop was at frame 10) and `--hz=144` (frame 12) | the same, `--pop=10` / `--pop=12` | plane x step at most 3.1 and 2.6 px; kink at most 1.0 px; head step at the old jump the cross's own, not 90 |
| R4 | `ffx2-bahamut`, rikku, 60 Hz (FFX-2, the no-slide control) | `r69-check.mjs --control=1 --r68=<r68 ch4 metrics>` | `reviveSteps` equal release 68's (2.6 7.2 14.5 24.6 30.9 30.4 14.9 ...) within 0.3 px at every frame |
| R5 | `yunalesca`, tidus, 60 Hz (the smaller case read as clean in r68) | `--pop=5` | standing plane x at vt 117 about -0.129, within 0.03 of its value at vt 100 (-0.130; release 68 jumped +0.131, 20 px); no x step over 9 px |

A miss is any x step over 9 px a frame, a head step over 35 px, or (R1) an x below 0.4 at frame 6. Then look for another reader of the lying plane's place after the run begins: `living.ts` `lyingCentre` (the puff, first frame only) and the head lock's `sizeSlot`.

## Open questions, for the driver (none blocks the merge)

1. **The end of the rise is not eased.** The tilt ends at 0.5 times the average speed (`riseEase`) and the slide at the average, so the plane stops at home from 3 to 5 px a frame at 60 Hz (the stage's own lay, slide -0.6: 5.3 then 3.9 then 0). That is release 68's behaviour, not this defect; `?kotopple=eased` (held at `today` by the driver's decision) eases it for the party's fall and revive.
   A tail ease on the slide alone would change a visible curve of both games and needs a clip first. Not built.
2. **The cross's own head speed** (the tracked head moves 29 px at 60 Hz in the cross, then slows to 13 to 19 px): release 68's, below the harness's 40 px jerk line live; unchanged.
3. **The fall may carry a 2 to 4 px extra step on its second frame** (the fall still reads the lying plane live: `ProneLay` lays the body one frame after the KO, which moves the target by the slide while the standing plane's slide share is about 5 percent). Release 68's gap pass read the fall's second step as 3.7 to 5.8 px; I did not isolate it and changed nothing there.
4. The browser jobs above are owed before a release that carries this fix can claim it live.
