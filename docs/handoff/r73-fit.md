# r73-fit: the real-clip fit reaches Wakka's two-frame return and the Mirror Aeons flips; the `real` holds of Chapter VIII and the Mirror Aeons lift

Branch `r73-fit`, from `origin/r72` `2f9c91791` (release 72's candidate, 17 of 19 chapters treated). Lane `r73-fit` of the overnight batch (Bailey, 2026-10-31 ~23:40 EDT: "im going to sleep please keep going. i'll go with all of your recommendations. you make the executive decisions for the next few days.", his to overturn). **Nothing deploys from this branch.** No browser, dev server, Playwright or GPU was used; every browser check below is a job spec with predictions (hard rule 15). The offline model is the real `PaintedActor` and the real strike code through a real camera (the r72 lane's method), and the pure functions run straight from the source with `node`.

Game case (rule 14), stated per item:

| item | case | why |
|---|---|---|
| 1. the return pace (`motion/ReturnPace.ts`, `StrikeRun.setReturnPace`, `StrikePlan.returnPace`) | **FFX only** | Wakka's and Lulu's real-snappy returns (`data/motion/realMotion.ts`, `ffx.wakka.attack`, `ffx.lulu.attack`) are FFX rows. The code answers undefined for any FFX-2 game (`curvesGame() !== 'ffx'`), for the booth pair (`isDemoChapter`), for a house strike and for a strike whose way home is a flip (`FlipFit.ts` scales those). |
| 2. the lift of the `real` hold in Chapter VIII (`evrae-airship`) and Chapter 27 (`mirror-aeons`) | **FFX only** | both are FFX chapters (the registry and `TREATED_CHAPTERS` say so). Chapter XVIII (`sin-face`, FFX, off the list) keeps its row. |

No contract file changes (`docs/CONTRACTS.md` lists none of the files touched: `StrikePlan.ts`, `StrikeRun.ts`, `ActorCurves.ts`, `CurveBeats.ts`, `ReturnPace.ts`, `PieceHoldsLast.ts`), so no `CONTRACT-CHANGES` entry. `critic-plan --paths` is the driver's call at merge (the stage file is not touched here, so the r72 DEEP class does not grow).

## 1. What changed

**The bar** (the driver's brief): Chapter I parity. No teleport (CHK-027 `jerks.teleportPx` 300), and no one-frame step larger than Chapter I's own at the same share of the frame: Chapter I's largest frame is Tidus's return flip at 280 px drawn, 169.8 px of 900 (`FlipFit.flipStepCap`, derived from the table the page plays). Where a step lands at a pose swap (the settle mark is one) the fit also aims inside the limit the critic excuses a planned cut to: 0.5 of the drawn height (`critic/policy.json` `continuity.smear.maxJerkShare`), taken at 0.9 of it.

### The finding, in the model's terms

Wakka's attack, real-snappy with the house dash (`RealMotion.phasesOf`): wind-up 489, travel 250, hold 141, **return 35**, settle 185 (ms on screen at the default pace; 29 and 154 paced ms). The clip's own way home is 67 ms at 30 fps (the real Wakka throws and stays), and the port sends him across the stage like every FFX figure (the reach solver does not know he throws). In the model he covers **0.798 of his lunge in the largest of the two frames** of that return. Lulu's real return is **0 ms**: the whole lunge and its 4 percent overshoot (1.04) in the frame the hold ends. Chapter I's own Auron, Kimahri, Yuna and Tidus come home over 150 to 180 ms (0.16 to 0.21 of the lunge in their largest frame).

The model reads the release 71 review's numbers back: the offline run at **390 px drawn, lunge 2.9 units, reads 494 px** for Wakka's largest frame, which is the review's worst hop (494 px) to the pixel; lunge 2.4 reads about 414 (five hops of 414 px) and lunge 1.1 about 183 (the five of 180 to 183). Chapter VIII's Tidus is drawn at 390 px too (his flip reads 233.9 to 234.9 px of feet step in the review; the model reads 231).

### The fit

- `src/engine/motion/ReturnPace.ts` (new, 107 lines): `returnPaceOf(ctx, id, profile, timeScale, distance)` answers a function of the figure's world height, called ONCE when the strike's hold ends (`StrikePlan.returnPace`, wired in `ActorCurves.startStrike` on the `holdEnd` mark next to r72's `returnFit`; `CurveBeats.startAttackMove` builds it). It reads what the screen shows at that moment (the stage's `project(id, 'feet'|'head')` over the canvas, `FlipFit.canvasPerUnit`), takes the lunge as `distance` world units times that scale times `FLOOR_PER_HEIGHT` (1.06: a unit along the floor draws up to 1/cos(pitch) bigger than a unit of height), and asks `homePaceFor` how long the way home must take for its largest one-frame step (`homeStepShare`: the sampler walked at every 0.25 ms offset of a 60 Hz frame, including the step from the hold's last sample into the first frame of the return) to be at most **min(flip cap, 0.45 of the drawn height)**.
- **The move's total never changes.** The return is lengthened *out of the settle*: the contact, the hold, the `end` mark and the 1.1 s pick are where they were; only the split between the return and the settle moves. The settle keeps at least `TRAVEL_SETTLE_FLOOR` (6 percent of the move, 55 paced ms) so its overshoot still comes back. The `settlePeak` mark (the fastest frame home, where the attack painting goes to the follow-through) follows the longer return (by 20 to 60 ms on screen for the lunges below).
- `StrikeRun.setReturnPace(ms)`: clamps to [the clip's return, return + settle], swaps the post-phase shape; a run never asked is exactly the strike curve (a test compares every 1 ms sample to `sampleStrike`).
- **What it never touches**: the booth pair (`returnPaceOf` answers undefined, so Chapter I's and Chapter IV's plans carry no pace and are byte for byte release 72), every house strike (`?curves=new`), every FFX-2 strike, every strike with a leaping return (Tidus, Yuna, Kimahri: r72's flip fit scales those), and a stage that cannot say how big a figure is drawn (the pace answers 0: the clip's own return).
- **Who it reaches in practice**: Wakka (35 ms return) and Lulu (0 ms) in every FFX chapter outside the booth pair. Auron's return (153 paced ms, 55 settle) has no tail to give; he is inside the cap for any lunge under 960 px.

### The lifts

`PieceHoldsLast.ts`: the `real` rows of `evrae-airship` and `mirror-aeons` are removed and a comment carries the status in their place (the same shape r72 used for Chapter III); `sin-face`'s row stays and its status sentence gains the r73-fit reading (below). Pins moved with it (ten test files; the list is in section 6). `booth-b4-real-hold.test.ts` gains the pins that VIII and 27 play the real clips; `booth-b4-real-hold-r71.test.ts` is cut to Sin's face.

## 2. Per chapter, on and held

| chapter | game | `real` clips | flip fit (r72) | return pace (this lane) | verdict on the bar |
|---|---|---|---|---|---|
| I `seymour-flux`, IV `ffx2-bahamut` (booth pair) | FFX / FFX-2 | on, as before | none carried | none carried | byte for byte release 72 (see open question 1 for Chapter I's own Wakka and Lulu) |
| III `braskas-final-aeon` | FFX | on (r72) | on | on for Wakka and Lulu if fielded | r72's |
| **VIII `evrae-airship`** | FFX | **on: the hold is lifted** | on (Tidus 390 px drawn: 231 raw feet step to 164) | **on (Wakka 494 px to 164)** | **meets** (below) |
| **27 `mirror-aeons`** | FFX | **on: the hold is lifted** | on (Tidus 280 to 322 px drawn, Yuna 243 to 280) | on for Lulu if she attacks | **meets** (below) |
| II, VII, IX, X, XII, XIV (FFX, treated) | FFX | on | on | on for Wakka and Lulu where fielded | not measured here (job RP-4 reads each) |
| XVIII `sin-face` (off the list) | FFX | **held, row stays** | on | on | **not met, kept**: Auron's attack-to-follow swaps of 461 to 530 px are not his return (below) |
| V, VI, XI, XVI (FFX-2) | FFX-2 | on, as before | none | none | not touched (rule 14) |
| XVII, every hidden chapter | FFX | not treated | not treated | not treated | not touched |

## 3. The offline model

Method (the r72 lane's, extended): the real `PaintedActor` (the KO fixture's Wakka, Lulu, Tidus, Yuna and Kimahri with their real pose records) plays the plan `CurveBeats.startAttackMove` builds (`returnPaceOf` / `returnFitOf` and all, chapter `evrae-airship`, steady pace 1.2) through a real camera that draws the figure's 1.82-unit height `D` px tall on a 1600 x 900 canvas, at 60 Hz, **worst of four offsets of the frame**. Lunge = world units of the plan's distance. Steps are the largest one-frame move of the idle plane's centre (x) or edge (y). Cap = min(169.8, 0.45 x D). Table in `D:/Tools/pyrefly-scratch/2026-11-01/r73-fit/actor-table.txt`; the pure sweep in `model1.mjs` of the same folder.

### 3.1 Wakka and Lulu, the way home (x step, px of 1600 x 900)

| D | lunge | Wakka raw | Wakka fitted | return, ms on screen (clip 35 / Lulu 0) | Lulu raw | Lulu fitted | cap |
|---|---|---|---|---|---|---|---|
| 280 (Chapter I's size) | 1.4 | 173 | **120** | 55 | 226 | 120 | 126 |
| 280 | 2.2 | 268 | 120 | 89 | 351 | 120 | 126 |
| 280 | 2.9 | 351 | 120 | 118 | 460 | 120 | 126 |
| 280 | 3.6 | 434 | 120 | 147 | 569 | 120 | 126 |
| **390 (Chapter VIII's size)** | 1.4 | 243 | **164** | 58 | 318 | 164 | 170 |
| 390 | 2.2 | 377 | 164 | 92 | 494 | 163 | 170 |
| **390** | **2.9** | **494** (the review's worst) | **164** | 122 | 647 | 163 | 170 |
| 390 | 3.6 | 610 | 164 | 152 | 800 | 163 | 170 |
| 462 (Chapter III's size) | 1.4 | 291 | 165 | 69 | 380 | 165 | 170 |
| 462 | 2.2 | 451 | 165 | 110 | 590 | 165 | 170 |
| 462 | 2.9 | 590 | 165 | 145 | 773 | 165 | 170 |
| 462 | 3.6 | 729 | **193** (tail-limited) | 154 | 955 | 192 | 170 |

The fit lands at the cap, not under it; the cap is the target and the model's lunge reading is good to a few percent (the x-scale margin is a pitch estimate, section 8 question 6). Where it fails: a lunge over about 970 px (60 percent of the frame's width: D 462 at 3.6 units, D 520 at 2.9) is more than the 128 paced ms the tail allows can carry (the tail-limited step is 0.21 of the lunge); a move fast-forwarded to 0.32 of its time has a four-frame tail and falls by at least 15 percent but not to the cap. Chapter VIII's Wakka was observed at 2.9 units at most.

### 3.2 The return flips (r72's fit, read at the sizes of Chapter VIII and the Mirror Aeons): bottom edge (feet) and top edge (head), px of 900

| figure, D | raw feet / head | fitted feet / head |
|---|---|---|
| Tidus 280 (Chapter I) | 166 / 178 | 166 / 178 (not touched) |
| Tidus 292 | 174 / 187 | 166 / 179 |
| Tidus 322 (Mirror's KO and hit camera) | 191 / 208 | 166 / 181 |
| Tidus 340 | 202 / 220 | 165 / 182 |
| Tidus 390 (Chapter VIII) | 231 / 257 | 164 / **185** |
| Tidus 462 | 272 / 314 | 163 / 191 |
| Yuna 243 (about; the two smaller Mirror reads) | 109 / 118 | not touched |
| Yuna 280 (Chapter I's size; the Mirror reads of 135.6 to 136) | 126 / 136 | not touched |
| Yuna 390 | 174 / 195 | 167 / 187 |
| Kimahri 280 to 462 | 100 to 162 / 110 to 192 | not touched (under the cap) |

### 3.3 What the two reviews' hops are, in this model

- **Chapter VIII**: Wakka's 13 attack-to-follow swaps of 161 to 494 px are the two-frame return (above); Tidus's 3 dashes of 233.9 to 234.9 px are the flip at 390 px drawn (231 raw; **164 feet and 185 head fitted**); the rest of the 30 jerks of 100 px or more in the run (Tidus's swaps of 109 to 181 px: three of them, 164 px of vertical rise at the settle swap, are the flip's fastest frame, which the same fit scales; the others fall earlier in the move and the model does not read their cause; Kimahri's 124 and 115 px are his return at 0.176 of a lunge of 650 to 700 px) are inside the cap.
- **Mirror Aeons**: all 32 hops are return flips, not approach dashes: 52 to 53 frames after the action starts (the hold's end at 60 Hz), the head rising 117 to 206.6 px in one frame, dx 3 to 20 px. **22 of the 24 Tidus hops read 176.4 to 178.5 px: Chapter I's own flip (the model's head step at 280 px drawn is 178)**, so Tidus is drawn at Chapter I's size there; the three larger (195.1, 206.3, 206.6; two of them on a knock-out or a hit taken) are the knock-out and hit camera (D about 305 to 320): fitted to 179 to 181. Yuna's 8 (117.5 to 136) are her 0.54 flip at 243 and 280 px: under the cap, unscaled, as in Chapter I. So after the fit the Mirror flips are **Chapter I's own 178 or within 2 percent of it**, and nothing in the chapter steps more than Chapter I does.
- **Chapter XVIII (kept)**: Auron's swaps of 461 to 530 px at the 0.177 of his lunge his largest frame covers imply a lunge of 2,600 to 3,000 px, 1.6 to 1.9 frame widths: they are not his return, and his return has no tail to stretch (153 paced ms with a 55 settle). The second focused review traced the remaining hops to something other than the real clips ("suspected another treatment piece, not traced"). Wakka's 167 to 292 px ready-to-attack dashes are his approach, which the model reads at 0.05 of the lunge a frame. The hold stands, and the chapter is off the list.

**Verdicts**: Chapter VIII meets the bar (Wakka at the cap; Tidus's flip within 4 percent of Chapter I's head step, 185 against 178, feet at 164 against 166). The Mirror Aeons meets it (flips within 2 percent; Lulu paced if she attacks). Both lift. Chapter XVIII does not, and keeps its row.

## 4. Job specs with predictions (rule 15; nothing has run)

All: the review-browser lock while `D:/Tools/pyrefly-scratch/REVIEW-BROWSER` exists, headless Chromium on the GPU, a dev server on this tree (`node tools/fx-assets.mjs ensure` first, `public/art` on r64), 1600 x 900, seed 1, real keys, REDUCE MOTION off, `?coach=off`, curves at the pack's default (real-snappy). The continuity harness is `PYREFLY_BROWSER=gpu node critic/runner/lib/continuity.mjs --base=<dev server> --chapters=<id> --goal=win --size=1600x900 --seed=1 --tag=r73` and the control is `?treated=pack`. Stop every server you start.

| job | what | prediction (written before any run) |
|---|---|---|
| **RP-1** | Chapter VIII, the continuity harness, then the same against the candidate before this lane (release 72's tree) | Wakka's attack-to-follow swaps: every step **40 to 165 px** (centre 164 at the cap for a 2.9-unit lunge, median under 120), **0 over 175**, the 13 gated swap jerks of the candidate read **0 gated** (each inside the policy's excuse of max(120, 0.5 x drawn) = 195 when the smear planner plans the cut, as it does for the swaps of the candidate that were excused); the settle swap falls **17 to 67 ms later** than in release 72 (about 50 for a 2.9-unit lunge); Tidus's flip: feet **at most 170**, head **at most 190**, **0 teleports (300 px or more)**, CHK-027 **PASS**; raw hops over 100 px: the Tidus flips (3 at about 185 head), Wakka's swaps that are long lunges (a few at 100 to 165), Kimahri's two (unchanged); none over 190; 0 console errors |
| **RP-2** | Mirror Aeons (40-minute budget), the harness | Tidus's flips **176 to 182 head** (24 events; the three that read 195 to 207 now 179 to 181), Yuna's 8 unchanged at **117 to 136**; **0 hops over 190**, **0 teleports**; CHK-027 **PASS**; raw hops over 100 px **about 24 to 32** (Chapter I's own flip size, so the control's 0 is not the criterion; section 8, question 4); Lulu unchanged (a rig) |
| **RP-3** | Chapter I (`seymour-flux`) and Chapter IV with Wakka and Lulu fielded (Chapter I's Gagazet build names both), against release 72 | **identical frames**: Chapter I's Wakka keeps the two-frame return (centre step 173 to 434 px at 280 px drawn for lunges of 1.4 to 3.6 units) because the booth pair carries no pace; this is the open question 1, not a defect of the lane |
| **RP-4** | the other treated FFX chapters (II, III, VII, IX, X, XII, XIV), the plain Attack and a Wakka Attack where fielded, the step per chapter | Wakka's centre step **at most min(170, 0.45 x his drawn height)** in every one (the table is the deliverable); Tidus's flip as r72's FF-4 (at most 175 feet) |
| **RP-5** | `?curves=new`, `?treated=pack`, `?pack=off` in Chapter VIII | unchanged from release 72 (no real profile, no pace) |
| **RP-6** | Chapter VIII, a forced Lulu physical Attack (`forceCommand`) | no frame over 175 px (candidate: the whole lunge in one frame, a teleport) and the return takes **90 to 150 ms** on screen |
| **RP-7** | RP-1's Wakka attack at 1280 x 1024 and 2560 x 1440 | the same drawn-height reading (the fit reads the stage's own canvas): the step at most the cap at each size; the x-scale margin 1.06 is checked here (a step more than 6 percent over the model's means the margin is too small for the stage's pitch) |
| **RP-8** | the fast-forward speed (0.32) in Chapter VIII, a Wakka Attack | the return gets the whole tail (about 3 frames); the step falls by at least 15 percent against release 72's and stays over the cap (disclosed) |

## 5. Checks run (no browser)

- `node node_modules/typescript/bin/tsc --noEmit`: clean (no output, no error in any file, the base's pause-living-portrait tests included, their sources are in this tree). `node tools/orphans.mjs`: 2,237 modules, 24 orphaned, the base's 24 (`ReturnPace.ts` is reachable). Files: `ReturnPace.ts` 107, `StrikeRun.ts` 202, `CurveBeats.ts` 97, `ActorCurves.ts` 61, `StrikePlan.ts` 36, `PieceHoldsLast.ts` 151, the new tests 387 and 67.
- New: `tests/unit/booth-b4-r73-return-pace.test.ts` (24 tests: the model against the review's numbers, the monotone curve and its closed form, `homePaceFor` and its tail clamp, the policy tie, who carries a pace and who never does, the REAL `PaintedActor` playing the REAL Wakka and Lulu strikes at 280, 390 and 462 px and three lunges at four offsets of the frame, 120 and 30 Hz and 0.32 of the time, the frames before the hold's end identical, the move ending on the same frame and at the same spot, the settle mark later, Chapter I and IV bit for bit, the presenter's real `startAttackMove`) and `tests/unit/booth-b4-r73-return-pace-clock.test.ts` (3: the real `StrikeRun`). Mutants (`D:/Tools/pyrefly-scratch/2026-11-01/r73-fit/mutation-results.txt`, each restored byte for byte): the wiring not asked, `setReturnPace` a no-op, the booth pair carrying a pace, FFX-2 carrying a pace (this one **survived** the first test file because Paine's profile has a flip, so the game gate was masked; the FFX-2 case now uses Yuna's flipless row and kills it), a flip return paced too, the settle with no floor, the swap limit dropped, `CurveBeats` dropping the pace, the post phase sampling the old shape, the settle mark on the old return: all killed.
- Pins moved (ten files, each from "VIII / 27 hold `real`" to "only XVIII does"): `booth-b3-r70-verdicts`, `booth-b4-last-holds`, `booth-b4-r71-verdicts`, `booth-b4-r71-sin-face-off`, `booth-b4-r72-merge`, `booth-b4-real-hold`, `booth-b4-real-hold-r71`, `booth-leblanc-wiring`, `booth-treated-chapters`, `hold-reasons-no-local-paths`, `r72-review-fixes`.
- The booth family and `hold-reasons-no-local-paths` (68 files, 1,042 tests) and the 154 test files that import a changed module or the gate (4,326 tests): green. Full suite: see section 7.

## 6. Suggested CHANGELOG lines (game tags)

- **FFX only (Chapters VIII and 27: Evrae on the airship; the Mirror Aeons): the real-motion clips play again, so the party moves as Chapter I's does.** The release 71 reviews held them because Wakka crossed a third of the screen in one frame on his way home (a two-frame clip: 161 to 494 px) and Tidus's and Yuna's return flips read 100 to 207 px. Tidus's flip is fitted to how big the screen draws him (release 72: 170 px of 900 at its worst frame, the size of Chapter I's flip), and a way home that is too short for the ground it covers (Wakka's, Lulu's) is stretched out of the move's tail to the same limit, so no frame of it moves a figure more than that or more than 0.45 of its drawn height; the move's length, the blow and its timing do not change. Chapter I and Chapter IV are untouched.
- **FFX only (the return pace, plumbing):** `StrikePlan.returnPace`, `StrikeRun.setReturnPace` and `motion/ReturnPace.ts`; asked once on the frame the hold ends, from the figure's drawn size at that moment.
- **FFX only (Chapter XVIII, Sin's face; off the list):** unchanged, its real-clip row stays; the status line now says what the fit does and does not reach there.

## 7. The wider run

The full `npm test` was started and stopped: the chapter bench files alone take 185 to 512 s each (`tests/unit/chapters/*-bench.test.ts`), so the full run is the driver's before any push to `main`. Run instead, with `--maxWorkers=3 --testTimeout=60000 --hookTimeout=60000`: (a) the 154 test files that import a changed module or the gate (4,326 tests); (b) `vitest related` over the five behaviour modules (`StrikeRun`, `StrikePlan`, `ActorCurves`, `CurveBeats`, `ReturnPace`), which pulls every file that reaches them through the presenter and the actor, less the bench files (`chapters/`, `*bench*`, `strategy-*`): **273 files, 3,678 tests passed, 3 skipped, 0 failed**; (c) the booth family and the hold-reason guard (68 files, 1,042 tests). The moved pins are listed in section 5.

## 8. Open questions for the driver (none sent to Bailey)

1. **Chapter I's own Wakka and Lulu keep the two-frame and the zero-frame return.** The booth pair carries no pace (byte for byte release 72, the brief), and Chapter I's Gagazet build names both. At 280 px drawn the model reads Wakka's centre step at 173 to 434 px for lunges of 1.4 to 3.6 units and Lulu's at 226 to 569, above the bar the lane sets, 170. Say if the approved booth should get the pace for these two figures only (drop the `isDemoChapter` gate in `returnPaceOf`; it changes Chapter I only for Wakka and Lulu, never for Tidus, Auron, Kimahri or Yuna), or whether Bailey's approval of Chapter I covers them as they are.
2. **The deep review's acceptance line for PR-0581 is "no dash over 150 px".** Chapter I's own flip is 166 (feet) to 178 (head) and every treated FFX chapter now plays it at that size, so neither Chapter III (r72) nor VIII nor 27 can meet a 150 line, and Chapter I (byte for byte) fails it itself. If the reviewer applies it, the flip cap must drop to 150 (one constant in `FlipFit.ts`) and the booth pair would then be the only place a flip reads 166. This lane took the brief's bar (Chapter I parity).
3. **The head edge of the fitted flip reads 0.6 to 7 percent over Chapter I's 178** (Mirror 179 to 182; Chapter VIII 185; 462 px drawn 191), because the fit scales the lift and the stretch of the figure's scale does not shrink with it. A head-aware cap is about 25 lines in `FlipFit.flipStepShare` and four pins. Not done: it changes r72's reviewed behaviour for a gain of 7 px at most.
4. **The old lift clauses ("no one-frame hop over 100 px that the control does not have") cannot be met by any Chapter I flip and were not the bar this lane used.** The focused review of the next candidate will list about 24 to 32 hops over 100 px in the Mirror Aeons and a few in Chapter VIII (the flips, 178 to 185 head; Chapter I's own size) against the control's 0; the review brief needs the new bar, or the lift is a HOLD again.
5. **The tail limit.** A lunge over about 970 px, or a move fast-forwarded to 0.32, cannot be paced to the cap with the tail the 1.1 s pick leaves (the return gets at most return + settle less 55 paced ms). Observed lunges in Chapter VIII (to 2.9 units at 390 px) are inside it. Taking time from the hold or ending the move later would reach further; both change the move's timing and were not done.
6. **The x-scale margin** (`FLOOR_PER_HEIGHT` 1.06) is a camera-pitch estimate (up to 19 degrees); the stage has no horizontal projection of a figure's lunge. RP-7 reads it. A `StageMotionPort.rect(id, { at })` reading (the shot the camera is settling on) would measure it, at the cost of a second source of truth.
7. **Flip returns' x steps are not paced**: Yuna 0.209, Kimahri 0.176 and Tidus 0.159 of the lunge in their largest frame pass the cap up to lunges of 813, 966 and 1,069 px. Beyond them the flip would need the pace as well.
8. **Chapter XVIII**: unchanged; its hold needs the cause of Auron's 461 to 530 px swaps traced before it can come back.
9. **Housekeeping**: NOW.md, DECISIONS.md, ACTIONS.md and CHANGELOG.md are the driver's at merge (the lane's decisions are the two lifts and the pace; the lane wrote none of the ledgers). A mistyped `python -` call at one point started a background task, stopped at once by its id; nothing else ran.
