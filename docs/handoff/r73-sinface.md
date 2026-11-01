# r73-sinface: the offline trace of Chapter XVIII's 17 one-frame hops (2026-11-01)

**Game case (rule 14): FFX only.** Chapter XVIII (Sin's face, `sin-face`) is an FFX chapter (the registry says `ffx`). Nothing here touches an FFX-2 chapter or file, and no game number changes.

Branch `r73-sinface` on `origin/r72` `2f9c91791` (release 72's candidate: 17 of the 19 listed chapters treated). Lane of the overnight batch (Bailey, 2026-10-31 ~23:40 EDT: "i'll go with all of your recommendations. you make the executive decisions for the next few days", his to overturn). **Nothing deploys from this branch. No browser, dev server, Playwright or GPU was run** (every browser check below is a job spec with predictions, rule 15).

> **STATUS: Chapter XVIII STAYS OFF `TREATED_CHAPTERS`. The cause is not traced, so there is no `SIN-FACE LIFT:` line, and the guard `booth-b4-r71-sin-face-off.test.ts` still holds.** The lane brief asked for the chapter to be put back with a fix; the honest result of the offline work is the opposite of a fix: it **rules out the suspects the brief listed that can be ruled out in the engine, and it finds the one pattern in the data that the earlier notes missed** (section 3). A lift now would name a cause nobody has seen. What this lane leaves is a harness, eight pinned facts, and four browser jobs with written predictions that will settle it in one pass (section 6).

## 1. What was done

| what | where |
|---|---|
| The real `PaintedActor` (real pose records and registration rows, the real mix `LivingFigure`, the real head lock) plays the real house strike and today's lunge under a real camera at 60 Hz, read the way the continuity probe reads a figure (registered head and feet through the plane's projected corners, `detectJerks` with the policy's own thresholds) | `tests/unit/engine/r73-sinface-trace.test.ts` (8 tests, 301 lines, passes) |
| The 17 hops of `critic/reviews/4c01379d4-focused` traced to swaps, camera cuts, drawn sizes and the engine's own action log | section 2 and 3 below (read from `continuity.json` `jerks`, `swaps`, `cameraCuts` and `battle-log.json`) |
| Scratch (not committed): the exploration scripts and tables | `D:/Tools/pyrefly-scratch/2026-11-01/r73-sinface/` |

No source file changed. `npx tsc --noEmit`: clean. The only test file added is the one above.

## 2. The 17 hops, as the review recorded them

All 17 are `atSwap` (the frame a pose blend starts or one frame after), `commonMode` (the head and the feet move together: `relPx` 4 to 8), `kind` dash (401.1 px is the one teleport), and one-frame spikes (`localPx`, the neighbouring steps, 16 to 46 px, against a spike of 113 to 401). The strip of the first (`strips/jerk-000-auron.jpg`) shows two images of Auron in the jerk frame: the old one faint where he stood, the new one strong 400 px to the right.

| frame | figure | part | px | swap (blend starts at) | drawn height at the swap | nearest camera cut |
|---|---|---|---|---|---|---|
| 9148 | Auron | feet | 401.1 | ready>attack (9147) | 502 | 1 frame before |
| 9157 | Auron | feet | 256.4 | attack>follow (9157) | 425 | 10 before |
| 9223 | Wakka | head | 114.2 | ready>attack (9224) | 379 | 1 after |
| 9675 | Auron | head | 278.3 | ready>attack (9675) | 422 | 1 after |
| 9685 | Auron | feet | 232.2 | attack>follow (9685) | 399 | 9 before |
| 9739 | Wakka | head | 115.5 | ready>attack (9740) | 385 | 1 after |
| 10062 | Auron | head | 277.2 | ready>attack (10062) | 426 | 1 after |
| 10072 | Auron | feet | 230.6 | attack>follow (10072) | 404 | 9 before |
| 10511 | Wakka | head | 113.5 | ready>attack (10512) | 386 | 1 after |
| 10591 | Auron | head | 148.6 | ready>attack (10591) | 413 | 1 after |
| 10601 | Auron | feet | 115.1 | attack>follow (10601) | 403 | 9 before |
| 11112 | Auron | head | 148.8 | ready>attack (11112) | 410 | 1 after |
| 11122 | Auron | feet | 114.5 | attack>follow (11122) | 399 | 9 before |
| 11405 | Auron | head | 147.0 | ready>attack (11405) | 410 | 1 after |
| 11415 | Auron | feet | 113.6 | attack>follow (11415) | 398 | 9 before |
| 11733 | Auron | head | 147.0 | ready>attack (11733) | 409 | 1 after |
| 11743 | Auron | feet | 115.0 | attack>follow (11743) | 414 | 9 before |

The control (`?treated=pack`, `critic/reviews/10b426248-focused/continuity-control` and `0804dc482-focused/continuity-control`) and live release 70 read **no jerk over 60 px at all** in the same fight, with Auron drawn at the same size (median 417 against 412, maximum 523 against 502): the figure is not drawn bigger in the treated run.

## 3. The finding the earlier notes missed: the hops are the swaps whose blend starts in the same frame as a camera cut

`cameraCuts.frames` (46 frames in the run, the frames in which the camera alone moved a figure by the cut line, 120 px) set against every Auron and Wakka ready>attack swap of the same fight:

- **the thirteen ready>attack swaps from frame 9147 on** (Auron 9147, 9675, 10062, 10591, 11112, 11405, 11733; Wakka 9224, 9740, 10512, 11046, 11340, 11668) **start their blend in the same frame as a camera cut, or one frame from it** (0 or +1, every one of the thirteen). Ten carry a hop over 100 px (the table above); Wakka's last three (11046, 11340, 11668) read 69.4 to 70.6 px, and the second jerk of each of Wakka's first three pairs (9234, 9750, 10522, ten frames after) reads 88.4 to 88.8 px: every one of the thirteen coincident swaps jumps the figure, by 70 to 401 px.
- **the ten earlier ready>attack swaps of the same run** (frames 2857 to 8297: Wakka 2857, 3782, 4255, 5500, 5980, 6910, 7492, 8297, Auron 7393, 8118) **come 2 or 3 frames AFTER their camera cut** (nearest cut -3 or -2; Wakka's 3782 has none within 300 frames) and **carry no hop** (the run's jerks before frame 9148 are six, all 24.5 to 36 px).
- **the second hop of each Auron pair** (attack>follow, feet) **starts 9 or 10 frames after a camera cut**: the camera is on its way back.

So what separates a hop from no hop in this fight is not the figure, the strike or the distance, it is **where the swap falls against the camera's cut**: 2 or 3 frames after it, nothing; in the same frame, a 113 to 401 px step of the whole figure. The change of order starts at frame 9147 (t about 155 s of the recording, the last 45 s of it). Nothing in the engine's log says why the order changes there (the fight's events are the same shape before and after: Wakka's and Auron's attacks and Lulu's firaga). By count only (no frame is mapped to an event): Auron acts eleven times (armor-break seq 67, mental-break 96, attacks 129 and 152, Dragon Fang 179, attacks 197, 220, 238, 261, 277, 298) and has seven hop pairs, so the pairs would be his last seven actions, Dragon Fang first; the first three pairs (401, 278, 277 px) are the large ones. This is the lead; it is **not** proved to be the cause (section 5).

## 4. What the real actor says (the eight pinned cases of `r73-sinface-trace.test.ts`)

The cases read `evrae-airship` as the stand-in for "a listed FFX chapter that plays the house curves with `real` held and the smear on" (Chapter XVIII is off the list, so it cannot be read itself) and `yunalesca` as the chapter that holds the smear as Chapter XVIII does.

1. **The strike's one-frame step is a law of the reach and the drawn size.** The house FFX strike's worst frame of the travel is **0.149 of the lunge distance** and of the way home **0.080** of it (pace-independent: both are shares), so on a 1600 x 900 canvas the head steps `0.149 x reach x (drawn height / 1.82)` px at the travel peak, to within 6 percent on the real actor at 420 and 500 px, at 1.4, 3 and 4.1 units of reach.
2. **Today's lunge (`?treated=pack`) carries the same reach at the same one-frame step** (a reach of 4.1 to 4.3 units: strike 162 and 197 px, lunge 161 and 193 px, drawn 420 and 500 px; within 12 percent): the sampled strike is not what makes the step bigger. A reach of 4.1 units drawn 420 px steps about 140 px in its fastest frame either way.
3. **The review's hops do not all fit that law.** Read as the strike's travel peak (`reach = px / (0.149 x drawn / 1.82)`, at each swap's own drawn height): Auron's **four later** ready>attack hops (147.0 to 148.8 px) imply **4.4 units** and Wakka's **three** (113.5 to 115.5 px) **3.6 to 3.7**, both inside the solver's cap (the house lunge 1.4 plus `StandReach.REACH_CAP` 3.0 is 4.4); Auron's **first three** (401.1, 278.3, 277.2 px) imply **7.9 to 9.7 units**, far past it; and the attack>follow hops (113.6 to 256.4 px) imply 6.4 to 13.8 units against the way-home law. **One strike law is not all seventeen hops.** (Pinned as a data case with the review's numbers embedded.)
4. **The real jerk detector reads the strike as a smooth move.** A house strike of 4.1 units, drawn 420 or 500 px, with its pose swaps made on the travel peak and the way-home peak (the marks `impactAtApex` uses), reads **no jerk of 24 px or more** on its travel and way home; the neighbours of its fastest frame are 60 to 100 percent of it; the ratio of the fastest step to the median of its neighbours (the detector's `local`) is at most **1.7** from 1.4 to 4.4 units and from 280 to 600 px, under the detector's own ratio of 3. **The live spikes (ratio 4.1 to 18, neighbours 16 to 46 px) are not what this curve makes.** A smooth bell of 150 to 200 px a frame has neighbours of 100 px and more.
5. **The cut-anchor row is inert where the smear is held, under the page's own scope.** With `?cutanchor=on` forced (the word Chapter XVIII's row carries), the smear style `paint`, and the default `wide` swap scope: a figure on its strike whose ready>attack and attack>follow swaps are made on the marks has its incoming plane drifted (`slot.align` over 0.05 world units) in `evrae-airship` (positive control) and **0 in `yunalesca`** (`SCOPE_EXCEPTIONS`, `smear` held). Under `?swapscope=all` the same Yunalesca drifts 0.29 units (the measuring word ignores the exceptions): so the row is inert only while the scope stays at its default, which a review run does not change.

## 5. Suspect by suspect (the lane brief's list)

| suspect | verdict | evidence |
|---|---|---|
| `curves` (the sampled strike) | **cannot make a one-frame spike** | case 4: smooth bell, ratio at most 1.7; case 2: the control lunge steps as much. It can make a 140 px step at a reach of 4.1 units, but not an isolated one |
| `moments` (held) | **not playing** | `PIECE_HOLDS['sin-face'].moments`; `momentsOn()` is false; no knock-out cut, no rebound |
| `smear` (held) and the cut-anchor row | **inert** | case 5; the chapter's row (`CUT_ANCHOR_CHAPTERS`) never reaches a plane while the scope is `wide` |
| `feel` (punch, hit-stop, rumble, shadow, motion sfx) | **cannot move a figure's plane** | the actor reads only `shadowFollows()` (the contact shadow); the camera's punch and the hit-stop run on the camera and the field clock; neither writes a plane's transform. The camera punch is a camera move and the probe subtracts those |
| `fx` | **cannot step a figure sideways** | the new effects are particles and planes of their own (`spellfx/`); the one hook into a figure's motion, `FxWiring.ts`, asks for a leap (a lift, never an x step) |
| the HUD's stage rect (F1 HUD) | **cannot step a figure 150 to 400 px in one frame** | it feeds the formation relaxation's panel rects and the stage's view window; the relaxation settles the field at set-up (not in a swap's frame), and the party is held on its slots on this deck (`holdParty`) |
| the SIN clock column (`sin-hud.css`) | **no** | CSS on the HUD, no engine state |
| the camera `keepsToday` (`fx/mix/masters.ts`) | **the mix leaves the rig and the figures alone** | `keepsToday(['overdrive-sin'])` is true: `framing.decide` returns `keep: true` with an empty plan, so no party step and no lens |
| the real clips (`real`) | **already held, as the second review said** | the hold is present |
| the head lock | **cannot translate a plane** | it scales a plane about its feet inside 0.9 to 1.1 |
| the pose registration of Auron and Wakka | **registered** | the swap records read the feet at 0.7 to 1.0 px and the head ratio at 1.000 at every one of these swaps |

What this leaves is **the camera and the stage around the swap**, which the actor-level harness cannot reproduce (it has no presenter timing against the impact cut): the review's own data shows the pattern of section 3, and the strips show a doubled image in the jerk frame.

## 6. Job specs with predictions (rule 15; nothing has run)

All: the review-browser lock while `D:/Tools/pyrefly-scratch/REVIEW-BROWSER` exists, headless Chromium on the GPU, `public/art` on r64, `node tools/fx-assets.mjs ensure`, 1600 x 900, seed 1, real keys, `?coach=off`, REDUCE MOTION off, a **scratch build with the one line `'sin-face': { game: 'ffx', since: 'r73' },` added to `DemoGate.TREATED_CHAPTERS`** (so the treated frame plays; the guard tests fail in that tree, which is the lift guard doing its job; the line is not committed), the continuity run of `critic/runner` as the base (`PYREFLY_QUERY` empty), and stop every server by its PID.

| job | what | prediction (written before any run) |
|---|---|---|
| **J-1** | The probe plus an in-page recorder that, every frame from 6 frames before to 12 after each Auron and Wakka ready>attack blend start and each attack>follow blend start, writes: the stage camera's position, quaternion and projection (including any view offset), each actor's `position.x`, `inner.position.x`, `lungeOffset`, `curves.out.x`, both slots' `mesh.position.x`, `align`, `fade` and `lock`, `presenter.playbackSpeed`, and the action log's frame of `damage`. Reached through `window.__pyrefly.app` -> battle screen -> `stage.actors` as `continuity-probe.mjs` does | **If the figure really moves (HYP-C):** `inner.position.x` or `curves.out.x` steps 0.6 units or more in the jerk frame and not in the frames either side. **If it is the plane (HYP-B):** `inner.position.x` and the lunge are smooth (steps 0.3 units or less) and one slot's `mesh.position.x` or `align` jumps by 0.5 units or more for the first blend frame only. **If the instrument misreads (HYP-D):** every scene-graph value is smooth, the camera's projection or view offset differs between the probe's read and the frame's render, and the strip's faint double is the post pass's history. My weights: HYP-B 40, HYP-D 30, HYP-C 20, the strike at a long reach 10 (case 4 argues against it) |
| **J-2** | The order in which the impact cut and the swap fall: for each of Auron's and Wakka's attacks in the fight, the frame of the `impact` camera cut, the frame of the strike's `travelPeak` swap, whether `meetContact` returned on `reached` or on its 400 ms cap, and the strike's phase at the cut | The ten late attacks: the cut falls within 1 frame of the swap and `meetContact` returned on the cap (the hit is dispatched near the travel peak, before the contact); the ten earlier ones: the cut falls 2 or 3 frames before the swap and `reached` came first. If instead both groups return on `reached`, the order is the camera's (its `actionIn` move), not the contact's |
| **J-3** | The same fight with one piece off at a time (the scratch build's address words): `?curves=today`, `?punch=today&hitstop=today`, `?hud=today`, `?fx=off`, `?pro=off`, each counted for hops over 100 px (`continuity-summary-sin-face.json`) | **Only the arms that change when the swap or the cut fall remove the hops.** I expect `?curves=today` to remove them (today's lunge swaps at the apex, not on the travel peak, so the swap is no longer on the cut frame), and `?punch`, `?hud`, `?fx`, `?pro` to leave all ten (113 to 401 px unchanged to within 2 px). If `?curves=today` leaves them the swap timing is not the coupling and J-1's HYP-D is next |
| **J-4** | The lift gate: the continuity run of the repaired candidate in Chapter XVIII against `?treated=pack` (`critic/runner`, CHK-026 and CHK-027) | 0 one-frame hops over 100 px the control does not have; CHK-027 PASS. This is the report the `SIN-FACE LIFT:` line must name |

Why J-3 predicts `?curves=today` removes them although case 2 says the lunge steps as much: today's lunge (`PaintedActorEffects.lunge`) never swaps on its travel peak. Its impact painting goes up at the apex (`reached`), when the figure is held still, so the swap's blend start has no figure motion under it and no relation to the cut. The new strike's swap is deliberately on the fastest frame (`KeyPoses.impactAtApex`, "cut on the motion peak"). If the coupling in section 3 is real, the treated strike is the only thing that puts a pose swap and a camera cut in one frame.

## 7. What lifts Chapter XVIII

The guard `booth-b4-r71-sin-face-off.test.ts` is unchanged and still asks for: the withdrawn entry gone, a `SIN-FACE LIFT:` line in `docs/handoff/booth-b4.md` naming the traced cause (`cause ...`), and an existing CHK-027 report (`critic/reviews/<sha>-focused.json`) of a run against `?treated=pack`. The cause is not named in this lane; J-1 and J-2 name it. A repair then needs J-4.

If J-1 shows HYP-D (an instrument misreading at a coincident camera cut), the repair is in the harness (`continuity-probe.mjs`'s camera-shift bookkeeping at a plane switch), not in the game, and Chapter XVIII's hops are not a defect a player sees; that is a policy question for the driver, not an engine change.

## 8. Per chapter, on and held (no change)

Release 72's list stands: 17 of the 19 treated (10 FFX, 7 FFX-2); Chapters XVII and XVIII are the two that are not. Chapter XVIII's rows (`card`, `breath`, `cam`, `moments`, `smear`, `real` in `PieceHoldsLast.ts`), the look row, the swap exception, the cut-anchor row and `sin-hud.css` stay in the tree, unread. No FFX-2 chapter, file or piece changed.

## 9. CHANGELOG lines (game tags)

No player-visible change; records and one test file only.

- **FFX only (Chapter XVIII, Sin's face):** still plays release 68's frame. The offline trace of the 17 one-frame hops rules out the sampled strike's curve, the smear and its cut anchor, the knock-out moments and the HUD's pieces as a cause and finds that the hops are the pose swaps whose blend starts in the same frame as a camera cut; four browser jobs with written predictions are in the handoff. No change to a fight.

## 10. Open questions for the driver (none sent to Bailey)

1. **Is the change of order at frame 9147 (about 155 s of the recording) an event of the fight?** The log shows nothing different in kind; Auron's Dragon Fang (seq 179) falls inside the stretch. J-2 reads it. If the driver knows of a change of presenter timing there (the mouth clock stage, haste), it narrows J-2.
2. **Is a probe artifact a reason to keep the chapter out?** If J-1 shows HYP-D the review's criterion (no hop the control does not have) is met by the game and failed by the instrument. That is the driver's call under the rubric; this lane does not make it.
3. **The scope word.** Case 5 shows `?swapscope=all` makes Yunalesca's smear-held cut anchor drift 0.29 units. A review run that names `?swapscope=all` (the measuring word) would read Chapter XVIII's anchor row live. None of the review's runs did (their address is empty); the lane notes it so nobody adds the word to a sin-face job by habit.
4. **Method check (rule 15):** two failed attempts? One hypothesis (the strike's long reach) was built, measured and dropped within the lane (case 2 and 4); no method failed twice. The deep-review owed on the live build is unchanged (this lane touches no `critic-plan --paths` class: tests and a handoff only).
