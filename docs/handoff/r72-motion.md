# r72-motion: the return flip fitted to the drawn size (Chapter III's `real` hold lifts) and the knock-out slide eased in

Branch `r72-motion`, from `origin/booth-b4` `4c6581b79` (release 71's candidate, 16 of 19 chapters treated). Lane `r72-motion` of the overnight batch (Bailey, 2026-10-31 ~23:40 EDT: "im going to sleep please keep going. i'll go with all of your recommendations. you make the executive decisions for the next few days.", his to overturn). **Nothing deploys from this branch.** No browser, server or GPU was used; every browser check below is a job spec with predictions (hard rule 15).

Game case (rule 14), stated per item:

| item | case | why |
|---|---|---|
| 1. the return flip fit (`motion/FlipFit.ts`) and the lift of the `real` hold on Chapter III | **FFX only** | Tidus's real-snappy return (`data/motion/realMotion.ts`, `ffx.tidus.attack.returnProfile`) is an FFX table. The code answers undefined for any FFX-2 game (`curvesGame() !== 'ffx'`) and for the booth pair, so Chapter IV and every FFX-2 chapter are what release 70 played. |
| 2. the knock-out slide eases in (`ProneLay.layProneFigures(..., dt)`, behind `motion/SlideEase.ts`) | **BOTH games** | shared plumbing (the actor layer is shared by FFX chapters 1 to 3 and FFX-2 chapters 4 to 6; `ProneLay`'s own header says so). The case that shows it is FFX XIV Isaaru (Ixion); FFX-2 dresses slide too (the worst bound is Yuna Thief, below). |

No contract file changes (`docs/CONTRACTS.md` lists none of the files touched), so no `CONTRACT-CHANGES` entry. `critic-plan --paths` classes the batch DEEP (because of `BattlePresenterStage.ts`, a one-line change: `layProneFigures` now gets the real clock through the gate `slideEaseDt`, section 8), so the deep review is owed on the live build (section 7).

## 1. What changed

### Item 1: Chapter III's return flip

**The finding** (the release-70 gap pass, `D:/Tools/pyrefly-scratch/2026-10-31/r70/live-gaps2/`, `ap2-*`, `er2-*`): Tidus's approved Chapter I return is the real clip's flip (the hip rises to 0.84 of his height, most of it in the first two frames). The lift is a share of his height, so it is the same in world units everywhere; the screen draws him as big as its camera makes him. Re-read from the frames (1600 x 900, the same strike): the flip's bottom edge rises 240 px in Chapter I (one-frame steps 168 and 141; Energy Rain 161) and 396 px in Chapter III (steps 277 and 275), 1.65 times more, because the standing Tidus is 280 px of the canvas in Chapter I (the rise over the flip's 0.857) and 462 px in Chapter III. That is the "1.66 times larger". CHK-027's `jerks.teleportPx` is 300.

**The fix**:
- `src/engine/motion/FlipFit.ts` (new, 110 lines): `returnFitOf(ctx, id, profile, timeScale)` answers a function of the figure's world height, called ONCE when the strike's hold ends (`StrikePlan.returnFit`, wired in `ActorCurves.startStrike` on the `holdEnd` mark; `StrikeRun.setReturnFit` scales the lift of the `post` phase). It reads what the screen shows at that moment (the camera has moved since the strike was asked for): the stage's own `project(id, 'feet'|'head')` over the canvas height (`globalThis.innerHeight`, the way `DemoGate.readPackScreen` reads it) gives canvas heights per world unit; the profile's own curve gives the flip's WORST one-frame rise at 60 Hz (`flipStepShare`: `StrikeCurve.sampleAt` phase `post`, every offset of the frame, the actor's `timeScale`, heft and `?realarc=`); the gain is `min(1, cap / step)`.
- **The cap** (`flipStepCap`) is Tidus's own flip at Chapter I's drawn size (`CHAPTER_ONE_DRAWN_PX` 280 of 900): 169.8 px of 900 with the house dash, at the default pace. It is derived from the table the page plays, not typed in, so it moves with Chapter I if the profile does. The model matches the live frames: worst frame 169 px at 280 (live 168) and 275 at 462 (live 277); rise 235 at 280 (live 240) and 387 at 462 (live 396).
- **What it never touches**: the booth pair (`isDemoChapter`: `returnFitOf` answers undefined, so Chapter I's and Chapter IV's plans carry no fit and are byte for byte release 70's; a test compares every frame), every house strike (`?curves=new`: no leaping return), every FFX-2 strike, a stage that cannot say how big the figure is (no `innerHeight`, no projection: gain 1), a figure drawn no bigger than Chapter I's Tidus (gain exactly 1 up to the projection's rounding).
- `PIECE_HOLDS['braskas-final-aeon'].real` is **removed**: Chapter III plays the real-snappy clips. No chapter holds `real` any more. Pins moved with it (`booth-b3-r70-verdicts`, `booth-ffx-b3b-switches`, `booth-ffx-b3b-wiring`, `booth-leblanc-wiring`, `booth-treated-chapters`, `booth-b4-r71-verdicts`); `booth-b4-real-hold.test.ts` is rewritten to pin the lift (fails with the row back).
- Files: `FlipFit.ts` (new), `StrikePlan.ts` (+1 optional member), `StrikeRun.ts` (`setReturnFit`, one multiplier), `ActorCurves.ts` (3 lines), `CurveBeats.ts` (the call), `PieceHolds.ts` (the row out). All under 400 lines.

**Offline table** (the real `PaintedActor`, the real real-snappy Tidus strike, steady pace, six offsets of the frame, the worst; `D:/Tools/pyrefly-scratch/2026-11-01/r72-motion/flipfit-table.txt`). D is the drawn size of Tidus's world height, px of a 900 px canvas:

| D | gain | raw step 60 Hz | raw apex | fitted step 60 Hz | fitted apex | fitted step 120 Hz |
|---|---|---|---|---|---|---|
| 280 (Chapter I) | 1.000 | 169 | 235 | 169 | 235 | 110 |
| 330 | 0.848 | 198 | 277 | 168 | 235 | 109 |
| 368 (Energy Rain camera) | 0.761 | 221 | 309 | 167 | 234 | 109 |
| 420 | 0.667 | 251 | 352 | 166 | 232 | 108 |
| 462 (Chapter III) | 0.606 | 275 | 387 | 165 | 231 | 107 |
| 520 | 0.538 | 309 | 435 | 163 | 228 | 106 |

The shape in time is the clip's (the apex is lower, the frames are not stretched); the flip is smaller on the screen only where the camera makes Tidus bigger than the approved chapter does.

**A consequence to read, not a defect**: Energy Rain's camera draws Tidus about 1.3 times Chapter I's attack camera (rise 307 px in Chapter I, 310 in Chapter III, so D about 365 in both). Chapter I's Energy Rain is unfitted (the booth pair); Chapter III's is fitted to the attack-size cap, gain about 0.76, so it reads a little smaller than Chapter I's Energy Rain (steps about 127 against 161). The alternative (a cap per shot) needs a reference per move that nothing measures; the stricter cap was taken so no flip in any treated FFX chapter steps more of the screen in one frame than Chapter I's attack does.

### Item 2: the knock-out slide eases in

**The finding** (same pass, `isaaru-*` logs): FFX XIV Isaaru, Ixion's lying painting sits 355 px from its station (0.9 of half its length, the stage's biggest candidate) and the cross from the toppled painting to the lying one reads an 89 to 91 px swap jerk against the 80 px allowance. The jerk is about a quarter of the slide plus 5 px: slide 250 read 64.3, 340 read 86.4, 355 read 89.2, 357 read 89.8. `?hud=today`, `?pro=off` and `?pack=off` did not remove it (slide 354 with the whole pack off): it is release 68's behaviour, not a lane's.

**The fix**: `ProneLay.layProneFigures(actors, live, rigs, pinned, dt)` keeps the choice (`layProne`, unchanged) and now puts the body there over `SLIDE_EASE_MS` = 700 (smootherstep, `[ours]`) on the stage's REAL clock (`BattlePresenterStage.update` passes `realDt` through `slideEaseDt`, so a hit-stop never leaves it half-way; **after the review of section 8 the clock is withdrawn under REDUCE MOTION, in the chapters the treatment does not reach and with an off word**, and the choices are the old call's for several knock-outs at once). At the cross (about 267 ms after the KO is called: frame 16 at 60 Hz; a test pins 20 to 35 percent at 60, 120 and 144 Hz) 28.5 percent of the slide is behind it, so Ixion's 355 px reads about `5 + 0.237 x 0.285 x 355` = **29 px**. The fastest frame of the slide is 1.875 times the average: 355 px over 700 ms is at most 16 px a frame at 60 Hz. The place the body comes to rest is exactly the chosen one (a test compares the number), so every choice that depends on it (the neighbours it must not cover, the HUD rows, the frame) is unchanged; only the path is. With no `dt` (an old caller, the tests of the old behaviour) the whole slide lands on the first frame as before. A revive mid-slide stops it where it is and the lying body keeps lying there while it fades (the release-69 hold), then lets go; a pinned figure and a figure the stage does not slide are never touched.

**Offline bound for the other chapters** (`prone-table.txt`; the real pose records, party height 1.82, Chapter I's 155 px per unit; the stage's largest pick is 0.9 x half the KO plane's width, and Tidus's bound, 0.74 units, is exactly Chapter I's measured slide):

| figure | max slide | jerk now (model) | jerk eased |
|---|---|---|---|
| Tidus / Yuna / Auron / Kimahri / Wakka / Lulu / Rikku (FFX) | 0.74 / 0.50 / 0.39 / 0.50 / 0.47 / 0.35 / 0.52 u (115 / 77 / 60 / 77 / 73 / 54 / 80 px) | 32 / 23 / 19 / 23 / 22 / 18 / 24 | 13 / 10 / 9 / 10 / 10 / 9 / 10 |
| the FFX-2 dresses, worst: Yuna Thief, Rikku Thief, Paine Lady Luck | 1.20 / 1.02 / 0.96 u (186 / 158 / 148 px) | 49 / 42 / 40 | 18 / 16 / 15 |
| a boss whose KO plane is 700+ px wide on screen (Ixion at Isaaru: 355 px) | | 89 (live) | about 29 |

Every party figure is under the 80 px allowance with or without the ease (worst 49); the case on record is a large foe. The allowance is crossed without the ease at a slide over 316 px and with it only over 1,110 px. **What changes in other chapters** (both games): every knock-out whose chosen slide is not 0 now slides in over 700 ms instead of appearing there: Chapter I's Kimahri or Tidus beside a neighbour (up to 0.74 u, 115 px: 7 px a frame at the fastest, jerk 32 to 13), the FFX-2 dresses beside a neighbour or a HUD panel, the large foes (**the tables describe the house buckle: in `real-snappy`, a figure with a real knock-out row shows its lying plane only after the slide is done, so the party sees no change; section 8.2**). A KO whose slide is 0 (Chapter IV's, the lone figure) is byte for byte what it was. The booth pair's knock-outs are included on purpose: the task asked for every chapter where the slide plays.

## 2. Per chapter, on and held

| chapter | game | `real` clips | the flip fit | the slide ease |
|---|---|---|---|---|
| I `seymour-flux`, IV `ffx2-bahamut` (booth pair) | FFX / FFX-2 | on, as before | **none carried** (byte for byte release 70) | on if a slide is chosen (I: up to 0.74 u; IV: 0) |
| III `braskas-final-aeon` | FFX | **on (the hold is lifted)** | on: gain about 0.61 on the attack camera, about 0.76 on Energy Rain's | on |
| II, VII, VIII, X, XVIII, 27 (FFX, treated) | FFX | on, as before | on, but identity where Tidus is drawn at or under 280 px of 900 (owed: job FF-4 reads each) | on |
| V, VI, XI, XVI (FFX-2, treated) | FFX-2 | on, as before | **none** (FFX only) | on if a slide is chosen |
| XIV `isaaru-via-purifico` (FFX) | FFX | on | on | on: Ixion 355 px now reaches its place over 700 ms |
| IX, XII, XVII (off the list), every hidden chapter | FFX | not treated | not treated | **not treated: the whole slide on the first frame, release 71** (section 8; the candidate eased there) |

## 3. Job specs with predictions (rule 15; nothing has run)

All: the review-browser lock while `D:/Tools/pyrefly-scratch/REVIEW-BROWSER` exists, headless Chromium on the GPU, a dev server on this tree (`node tools/fx-assets.mjs ensure` first, `public/art` on r64), 1600 x 900, seed 1, real keys, REDUCE MOTION off, `?coach=off`, curves at the pack's default (real-snappy); the probes are the gap pass's, `D:/Tools/pyrefly-scratch/2026-10-31/r70/live-gaps2/jobs/attack-probe.mjs` (the plain Attack, `ap2-*`) and `er2-probe.mjs` (Energy Rain through `forceCommand`, `er2-*`), `ap-analyze.mjs` for the steps; each takes its URL from `LIVE` in `lib.mjs` (point it at the dev server). Stop every server you start.

| job | what | prediction (written before any run) |
|---|---|---|
| **FF-1** | Chapter III, plain Attack, the painted rect of Tidus every frame (`attack-probe`, two attacks) | the flip's largest one-frame bottom-edge step **150 to 185 px** (live release 70: 277 and 275; Chapter I's samples 141 to 168), the first step at least 100 px (it still flips), the flip's rise **225 to 250 px** (live 396), **0 frames at 300 px or more**, 0 console errors; frames over 100 px: 1 to 3 (the flip's rise and its fall; Chapter I has the same, the approved look: the r71 lane's "0 over 100" was the held house curves' number and is not Chapter I's) |
| **FF-2** | Chapter I, the same probe, against release 70's `ap2-ch1-now` | same frames as release 70 within one frame of timing jitter: step 141 to 168, rise 240 +/- 3 (byte-identical in motion; the plan carries no `returnFit`) |
| **FF-3** | Chapter III, Energy Rain (`er2-probe`), and Chapter I's (`--chapter=seymour-flux`) | Chapter III: the first up-step **115 to 140 px** (live 167), the rise **225 to 250** (live 310); Chapter I unchanged: 161 and 307 +/- 5 |
| **FF-4** | the other treated FFX chapters (II, VII, VIII, X, XIV, XVIII, 27), the plain Attack probe, step and rise per chapter | no per-chapter prediction for the gain (their drawn sizes have not been read); the criterion: the largest step is at most **175 px** in every one and, where Tidus is drawn at or under 280 px, equals release 70's (gain 1). Report the table. |
| **FF-5** | CHK-027 continuity run of Chapter III (`critic/runner`, seven links, `PYREFLY_QUERY` empty) | CHK-026 and CHK-027 PASS, **0 teleports** (>= 300 px), the mid-move dashes reported, worst under 180 px (live: 4 teleport-class events), 0 console errors; the `real` row is gone from `__pyrefly.treated()` for the chapter |
| **FF-6** | `?curves=new` in Chapter III and `?treated=pack` | unchanged from release 70 (the house profile has no leaping return: no fit; the pack plays release 68) |
| **KO-1** | FFX XIV Isaaru, continuity s1 and s2 (the gap pass's `isaaru-*` runs), seed 1 | Ixion's KO swap jerk **25 to 40 px** (was 89.2 and 89.8), CHK-027 PASS (it FAILED at 86.4 to 89.8 on s2 in every arm), Ixion's KO plane at rest the same place as release 70's (+368 px from the idle plane in the treated arm; the final x within 2 px), its slide's largest frame at most 17 px |
| **KO-2** | Chapter I, Kimahri KO beside Tidus, then a revive after 1.5 s (the `revive-follows-slide` case) | the lying body's final place equal to release 70's; the swap jerk at most release 70's; the revive's plane steps show no kink over 3 px (the release-69 pop of 89 px must not return) |
| **KO-3** | an FFX-2 chapter where a girl is slid (Chapter VI Leblanc or XVI Ixion at Djose: a KO beside a neighbour), and Chapter IV (slide 0) | VI/XVI: the final place equal to release 70's, the swap jerk at most release 70's; Chapter IV: identical frames |

## 4. Checks run (no browser)

- `node node_modules/typescript/bin/tsc --noEmit`: the only errors are `tests/unit/pause-living-portrait-*.test.ts` (their `docs/concepts/pause-until-dawn/prototype-v2/src` sources are not in this sparse worktree: the base's, untouched). `node tools/orphans.mjs`: 2,234 modules, 24 orphaned, the base's 24 (`FlipFit.ts` is reachable). Files touched: all under 400 lines except `BattlePresenterStage.ts` (1,072, unchanged length: the call's argument went on an existing line).
- New: `tests/unit/booth-b4-r72-flip-fit.test.ts` (21 tests: the model against the live samples, the cap, who carries a fit, the REAL `PaintedActor` playing the real strike at 280 and 462 px at 60, 120 and 30 Hz and four offsets of the frame, Chapter I and IV bit for bit, the presenter's real `startAttackMove`) and `tests/unit/booth-b4-r72-prone-ease.test.ts` (27 tests: the real actor under the real `LivingFigure` and `layProneFigures`, FFX and an FFX-2 dress, 60/120/144 Hz). Mutants killed: the ease at 0 ms (17 tests fail), the `holdEnd` wiring (3), the fit in the booth pair (2), the game gate (1), `CurveBeats` dropping the fit (1); each restored byte for byte.
- The booth family and the motion, prone, revive, KO, head-lock, curve and strike families: 103 files, 1,506 tests passed, 40 skipped. Full `npm test` is the driver's before any push to `main`.
- Environment note: this worktree is a sparse checkout (`docs/` mostly absent), so the handoff notes and one screenshot the booth tests read were written into the working tree from `HEAD` (`git show`), unchanged, to run them; they show as no change.

## 5. Suggested CHANGELOG lines (game tags)

- **FFX only (Chapter III, Braska's Final Aeon):** the real-motion clips play in Chapter III again. Tidus's return flip is fitted to how big the screen draws him, so it steps no more of the screen in one frame than the approved Chapter I flip does (about 170 px of 900 at its worst frame, where it read 277 px and an Energy Rain leap read 306 to 417 px); Chapter I and every chapter where he is drawn no bigger are untouched. Replaces the booth-b4 hold.
- **Both games (shared plumbing, the knock-out) [superseded by section 8.5]:** a knocked-out figure's body now slides to its resting place over 0.7 s instead of appearing there, so the cut from the falling painting to the lying one no longer jumps by a quarter of the slide (Ixion at Isaaru: 89 px to about 29 against the 80 px allowance). Where the body comes to rest is unchanged.

## 6. Paper preflight (rule 15, `critic-plan` says DEEP)

- **Risk 1: the fit changes a chapter's frames that release 71's review has read.** Only Chapter III's flip (the `real` hold lifts) and, where Tidus is drawn bigger than 280 px, another treated FFX chapter's. The pure function and the real-actor tests bound it; FF-4 reads every chapter's number.
- **Risk 2: `project` or `innerHeight` unavailable or wrong** (a phone, a letterboxed canvas): the gain falls back to 1 (the unfitted flip, release 70's) when nothing can be read; a canvas that is not the window would read a smaller or larger share, bounded by 0.54 (D 520) to 1.
- **Risk 3: the ease changes a pose-change frame the continuity harness reads** (the swap's `head` and `feet`). The tracked steps across the fall are not bigger than before (a test), and CHK-026 reads the planes of one frame (the lying plane is closer to the toppled one at the cross, not farther).
- **Risk 4: a consumer reads the body's final place while it eases** (a camera shot framed on `contentQuad`, a HUD anchor). None found by reading (`grep proneShift`: `PaintedActorPlacement` only); FF-6/KO jobs would show a shot that framed early.
- **Method check (rule 15): two failed attempts?** None.

## 7. Open questions for the driver (none sent to Bailey)

1. **Energy Rain in Chapter III is fitted to the attack cap and will read a little smaller than Chapter I's** (about 0.76). A per-move reference would need a measure nothing has; say if Bailey wants it looser (a cap at the Energy Rain camera, 365 px, would leave it alone and let the attack read 1.25 times Chapter I's).
2. **`SLIDE_EASE_MS` = 700 is `[ours]`.** It was chosen so the slide is mostly after the cross; a shorter ease (400 ms) would put 0.7 of the slide behind the cross (jerk 5 + 0.237 x 0.7 x 355 = 64 px, still under 80).
3. **The deep review is owed on the live build** because the stage file is touched; at most two deploys may go out while a deep review is owed.
4. **FFX-2 girls' back-leaps** (Rikku Dark Knight 0.35, Yuna 0.54 in the FFX-2 table) are not fitted: no FFX-2 chapter has been read for them (rule 14). If a drawn size there is bigger than Chapter IV's, the same function would serve with a per-game reference.
5. **Housekeeping:** an empty file `/tmp/dummy` was created by a mistyped command (a `cat > /tmp/dummy` with no input); it holds nothing. I left it: the brief forbids deleting outside the scratch folder.

## 8. The adversarial review of 8bfd101c5 and what was fixed (2026-11-01; `D:/Tools/pyrefly-scratch/2026-11-01/r72-motion/review/REVIEW.md`)

Verdict of the review: no critical; three majors, all in item 2 (the knock-out slide); item 1 (the flip fit, Chapter III) sound, Chapters I, IV and VI unchanged in the strike bit for bit (1,152 scenarios), Chapter III now behaves as intended (worst step 163 / 160 / 155 px at 280 / 462 / 600 px drawn). Every confirmed finding is fixed below, each with a test that fails without it (mutants listed in section 8.3). Nothing deploys.

### 8.1 Findings to fixes

| finding | confirmed how | fix | test |
|---|---|---|---|
| **M1** (major, both games, introduced): the ease added motion under REDUCE MOTION (a deliberate cut, `KoFall.koMode`, Bailey 2026-10-10): the review's probe read 43 frames of glide (0.599 u; Ixion 355 px at up to 16 px a frame) where release 70 shows the body whole | the probe's setup replayed in `booth-b4-r72-slide-fixes.test.ts` (Tidus beside Yuna with a HUD panel, `rm: true`): the eased call moves the body on more than 40 frames, the gated call on none | new `src/engine/motion/SlideEase.ts`: `slideEaseDt(realDt, reduceMotion)` answers undefined under REDUCE MOTION; the stage passes `this.opts.comfort?.().reduceMotion === true`, the same read its actors' `still` uses. `layProneFigures` with no clock puts a body that was part-way at its place at once (REDUCE MOTION switched on mid-slide: a cut, not a freeze) | M1 group (5 tests), stage source pins in `-slide-fixes` and `-prone-ease` |
| **M2** (major, both games, introduced): bodies down on one frame, or within 700 ms, stack: the candidate zeroed a body right after choosing it, so the next figure was laid against a neighbour at its station (final overlap 5 to 6 times the old call's in the review's four rows) | the review's four three-body rows replayed (`ROWS` in `-slide-fixes`): final places differ from the old call's | `ProneLay.layProneFigures` chooses against the places the neighbours will LIE at, as the old call did: (a) every figure newly down on a frame stays at its chosen place until all of them are chosen, (b) every body still sliding from an earlier frame is parked at its chosen place while a choice is made (`parkSliding`), (c) one `placeSliding` pass at the end puts each body where its clock says (the station for the figures just laid). A body that stands up on the frame another goes down is placed at its clock before the park can leave it at its target | M2 group (the four three-body rows on one frame, with a HUD panel to avoid and at 144 Hz, the sweep of 11 lags for the second knock-out, three bodies one after another, the revive-beside-a-KO case in both array orders): the final places equal the old call's exactly (`toEqual`) |
| **M3** (major, rollback and scope, introduced): the ease had no switch; `PaintedStage.update` passed the clock in every chapter and every address, so no off word restored release 71 for item 2 and the off-word matrices could not see it | read: the call was unconditional | the same gate: `slideEaseOn()` = not REDUCE MOTION, `curvesOn()` (a treated chapter whose `curves` piece is not held, the curves not `?curves=today`, the pack on, `?treated=all` or the booth pair) and not `?kofall=off` (read once). So the untreated chapters (XVII, every hidden chapter), `?pack=off`, `?treated=pack` outside the booth pair, `?curves=today`, the phone gate and `?kofall=off` give release 71's whole-slide-at-once. **The ease now follows the curves: where the new motion plays, it plays.** | M3 group (treated chapters, every curves mode, untreated chapters, `today`, `?treated=pack`, `?kofall=off`) |
| m3 (minor): test gap, the fit asked at `contact` instead of `holdEnd` survived | mutant F6 | new `booth-b4-r72-flip-fit-timing.test.ts` (4 tests): the REAL `startStrike` on the REAL `CurveDriver` with the real `returnFitOf`; the camera cuts from 270 px to 462 px drawn after the contact mark; the fit is asked once, in the `post` phase, reads nothing at plan time, and the way home equals the still-camera 462 px flip's | F6, F7, F8 killed |
| m1 (minor): in the pack's default `real-snappy` mode the ease is invisible for every figure with a real knock-out row | read; probe (`zz-review-real-ko`) Tidus's lying plane first shows at 933 ms, Yuna's at 1,167 ms, after the 700 ms slide has finished | no code change; the tables in section 1 describe the house buckle (the figures with no row, `?curves=new`) and Ixion; the party figures with a real row see no change (good for "Chapter I unchanged"). Stated in section 8.2 | none needed |
| m2 (minor): another treated FFX chapter can change (the fit applies wherever Tidus is drawn over 280 px of 900: `yunalesca` 268 to 160 px at 462 drawn) | read; always toward smaller | disclosed; FF-4 reads every treated FFX chapter's drawn size before deploy; BJ-4 below adds the aspect ratios | job spec |
| m4 (minor): `canvasPerUnit` divides by `innerHeight`; the 280 px reference was read on a 16:9 window | read | watch item, not changed (a letterboxed or larger-than-window canvas can only read a smaller share, bounded by the gain's floor): BJ-4 at 1280 x 1024 and 2560 x 1440 | job spec |
| m5 (minor): a wide standing painting (prone by shape) with a non-zero chosen slide could glide in at fight start | could not be shown offline | the gate and `pinned` are unchanged; BJ-5 | job spec |
| m6 (process): no NOW.md / CHANGELOG / ACTIONS / DECISIONS in the branch | read | **owed by the driver at merge** (the worktree is sparse); the CHANGELOG lines are section 5, corrected below | none |

The review's three answers stand: keep the stricter Energy Rain cap (Chapter III's reads about 0.76 of Chapter I's); keep `SLIDE_EASE_MS` at 700 (a 400 ms ease puts 64 px of jerk behind the cross, too close to 80); leave the FFX-2 back-leaps unfitted (rule 14).

### 8.2 Behaviour after the fixes (what changes, what does not)

- Item 2 plays **only where the new curves play** (`curvesOn()`) and never under REDUCE MOTION. Elsewhere (untreated chapters, `?pack=off`, `?treated=pack` outside the pair, `?curves=today`, the phone gate, `?kofall=off`, REDUCE MOTION) the body lies at its chosen place on the frame the figure goes down, exactly release 71 (the stage passes no clock; `layProneFigures` is the old function).
- Where it plays, the place a body rests, and every choice that depends on it, is the old call's, for one KO and for several: bodies down on one frame, two or three inside the 700 ms (the claim of section 1 was false for those until this fix; a test now compares the final places with `toEqual`).
- In `real-snappy` (the pack default) the lying painting of a figure with a real knock-out row (the party's, FFX and FFX-2: floor impacts 1.0 to 1.97 s) first shows after the slide has finished, so the ease is invisible for them and the lying plane appears at its place as in release 71. It is seen for a foe or a party figure with no row (Ixion at Isaaru, the bosses, FFX Rikku), in `?curves=new`, and nowhere else.
- Item 1 (the flip fit) is unchanged by this round.

Per chapter (replaces the last row of the table in section 2): **IX, XII, XVII (not treated) and every hidden chapter: the slide lands on the first frame, as release 71.**

### 8.3 Checks run (no browser)

- `node node_modules/typescript/bin/tsc --noEmit`: only the base's `tests/unit/pause-living-portrait-*.test.ts` errors (their sources are not in this sparse worktree); none in a touched file. `node tools/orphans.mjs`: 24 orphans, the base's (`SlideEase.ts` and `FlipFit.ts` reachable). Files: `ProneLay.ts` 257, `SlideEase.ts` 39, the new tests 306 and 147; `BattlePresenterStage.ts` 1,072 (the import line and the call line were replaced, none added).
- New: `tests/unit/booth-b4-r72-slide-fixes.test.ts` (37 tests) and `tests/unit/booth-b4-r72-flip-fit-timing.test.ts` (4); `booth-b4-r72-prone-ease.test.ts` (27) updated for the gate (its stage source pin). 141 files of the booth, motion, prone, KO, revive, head-lock, curve, strike, treated, hold and switch families: 1,949 tests passed, 40 skipped.
- Mutants (`mutation-fix-results.txt` in the lane folder; each restored byte for byte): M2 without the park (killed), M2 with the zero not deferred (killed), a revive that does not place the body (killed), the clock withdrawn without the snap (killed), the gate ignoring REDUCE MOTION (killed), ignoring the treated chapter (killed), ignoring `?kofall=off` (killed), the stage passing `realDt` or reading REDUCE MOTION as false (killed), `SLIDE_EASE_MS` 0 (killed), the fit asked at `contact`, at the start of the move, at `travelPeak` (all killed).

### 8.4 Browser job specs with predictions (rule 15; nothing has run). Same setup as section 3

The review's BJ-1 to BJ-5, with the predictions after the fixes:

| job | what | prediction |
|---|---|---|
| **BJ-1** | Isaaru (XIV), REDUCE MOTION on, continuity s1, Ixion KO | the lying plane's x changes on **0 frames** after it is shown whole (the candidate: about 42 frames of up to 16 px); the final x equals release 71's within 2 px; the swap jerk equals release 71's (REDUCE MOTION asked for the cut; it is not an ease) |
| **BJ-2** | Chapter I or III, force all three party members down in one hit (`__pyrefly` force KO), seed 1, REDUCE MOTION off | the three lying planes' bounding boxes overlap **exactly as in release 71** (the candidate: 5 to 6 times); the final x of each equals release 71's within 2 px |
| **BJ-3** | Isaaru s2 with `?pack=off`, `?treated=pack`, `?curves=today`, and a hidden or untreated chapter (XVII) | Ixion's swap jerk **85 to 89 px**, as release 71 (the candidate eased: 25 to 40); `?pack=off` and `?curves=today` read the same frames as release 71 |
| **BJ-4** | FF-1 to FF-4 of section 3, plus Tidus's drawn size at the hold in every treated FFX chapter, at 1280 x 1024 and 2560 x 1440 as well as 1600 x 900 | chapters with Tidus at or under 280 px of 900 (of the window height): the step equals release 71's; over: at most 175 px; the table of drawn sizes is the deliverable |
| **BJ-5** | Sin's fins and Overdrive Sin openers (m5), and a wide standing foe beside a neighbour | no plane glides in the first 700 ms of the fight (pinned figures are exempt; the gate leaves XVII alone) |
| **KO-4** | Chapter I, three party members knocked out 120 ms apart (Total Annihilation or a force-KO script), then TRY AGAIN | the final lying places equal release 71's; no pair overlaps more than release 71's pair does |

Corrected predictions of section 3: **KO-1** Ixion's jerk is for the default (REDUCE MOTION off, treated chapter, `real-snappy`); **KO-2** (Chapter I Kimahri or Tidus beside a neighbour) is trivially met in the default mode (the lying plane first shows after the slide has finished: the same frames as release 71); **KO-3** likewise.

### 8.5 CHANGELOG line, corrected

- **Both games (shared plumbing, the knock-out), where the new motion plays and never under REDUCE MOTION:** a knocked-out figure's body slides to its resting place over 0.7 s instead of appearing there, so the cut from the falling painting to the lying one no longer jumps by a quarter of the slide (Ixion at Isaaru: 89 px to about 29 against the 80 px allowance). Where the body comes to rest, for one knock-out or several, is unchanged; with REDUCE MOTION, `?pack=off`, `?curves=today` and in the chapters the treatment does not reach, the body lies at its place at once, as in release 71.
