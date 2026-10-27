# post-fight-start: the time from the press to the first command (post-conference plan, step 5; PR-0481)

Branch `post-fight-start` (tree `D:/pyrefly-anim-proto`), from `origin/main` `acbd815d3` (live release 64's code, `e9907cad8`, plus records). 2026-10-26, the driver's lane "post-fight-start".
**Game case: both games.** The measuring is shared plumbing; Chapter I (Seymour Flux) is FFX and Chapter IV (Bahamut) is FFX-2 wherever a number names one. The voiced intro is FFX only; the first turn's 1.0 s (the ATB's first menu) is FFX-2 only (decision 180b, "Leave FFX-2 faithful"). Nothing deploys from this branch.
Authority: Bailey, 2026-10-25 ~23:45 EDT, "i'll go with all your recommendations and i delegate all decision making to you for now"; 2026-10-26 ~13:30 EDT, "booth is over, start the post-conference plan, keep going please".

**Fix round (2026-10-26 evening, after the adversarial review of `ec18fd13c`): section 9.** The card's floor is now 1000 ms (the card part 2.17 to 1.27 s, a gain of 0.9 s on a fast cold press); the pose pop at the start of every opening is fixed (the HUD and the party go down under the card as it leaves; `?opencover=off` restores release 64's frames); the hitch the review asked about is not reproduced in Chapter I and its real cause (the look's first-sight alpha read) is named; the driver's acceptance of the card cut is owed (F1). Sections 2 to 7 are the first round's numbers and text, kept as measured.

## The short answer

- Of the 13.5 s (Chapter IV) and 22.1 s (Chapter I) a fast press takes on the demo, **9.3 s and 19.0 s are authored** (the voiced intro 10.1 s, the boss card 2.2 s, the opening sweep 6.1 s / 6.6 s, the first turn 1.0 s in FFX-2) and **0.0 to 0.2 s are waits with nothing on screen**. The rest is the battle LOADING under the entry: 2.1 to 4.2 s (median 4.0 s in Chapter IV, 3.0 s in Chapter I) on a press 2 s after the page loaded, 0.7 to 0.8 s once the demo's warm has had its 18 s.
- The waste that was real: **the same boss card was read twice**. A fight that loads behind the entry shows the card over the ink for as long as it loads (2.1 to 3.5 s on a cold page), and the battle's own card then held its whole 1.9 s again. The hold now counts the time the card has been up (never under 1.0 s: the whole of the entry's reveal, measured 0.93 to 0.96 s in FFX and 0.70 to 0.79 s in FFX-2; the first cut of this lane had 0.9 s, see section 9). **Measured: the card part (the hold and its 0.26 s fade) falls from 2.2 s to 1.3 s in every fast or human-pace press, three or more runs each, in both games and on both paths (to 1.8 or 1.9 s on the long dwell, where the loading card was up for only 0.3 to 0.4 s); nothing changes where no loading card goes up.** (The numbers in sections 2 and 4 are the first cut's, floor 0.9 s, card part 1.2 s; section 9 has the final ones.)
- Second change, in the demo's warm: a press now **lets go of the OTHER fight's stage step** that is still in flight (it ran 4 s into the picked fight's start on the main thread it was loading on), finishes it at the next picker, and the board hands the warm the cursor's fight by the clock. Not proved as a time gain: the case (a press while the warm is half through the other fight's stage) came up once in 4 human-pace Chapter IV presses of the new build (the other stage was let go at +0.17 s; Bahamut's entry then took 2.8 s) and once in an exploratory press of the old one (that stage ran on to +3.95 s; Bahamut's entry took 3.8 s). Kept for what it prevents, with its tests.
- **No look changed**: frames at the same moments match (below). No wait, held frame or serial load was found beyond the card: the main thread is saturated from the press to the card (CPU profile: 4.9 s busy in the first 5.5 s), so loads that could overlap would only move work into the voiced intro and the party prep, where it would be SEEN as stalls. That and every other cut that shortens an authored moment are listed with their seconds in section 6 and **not done**.

## 1. The tool

`tools/fight-start-timeline.mjs`: one browser per job (headless Chromium, `PYREFLY_BROWSER=gpu`, 2560x1440), a simulated pad (A and the d-pad, nothing else), the page's own clock.

- `--path=demo` is `?demo=1` (title, picker, A on the card); `--path=select` is the ordinary game from the chapter board (`?coach=off`, party prep, the pre-battle scene played through by A every 650 ms so the opening is the full one).
- `--cache=both` runs the page cold (a fresh browser: nothing cached) and then again in the same browser context (HTTP and shader caches warm).
- `--dwell=fast` presses the moment the picker is up (the deep review's "fastest possible press": the press falls 1.9 s after the page loaded, in the middle of the warm); `human` 3 s on the title and 2.5 s on the board; `long` 9 s and 9 s (the warm has finished both fights).
- `fight-start-instrument.mjs` takes the marks AT THE CALL (`App.push`, the entry overlay, the loading card and the boss card: wrappers on `appendChild` and `remove`), because a frame loop sees them only after the 0.5 to 1.4 s task that starts where the entry begins (the first draft put the entry 1.4 s late). `fight-start-split.mjs` (`tests/unit/fight-start-split.test.ts`, 8) cuts a run into **press-wait, party-prep, scene (the pre-battle scene or the voiced intro), after-scene, entry-load, first-draw, card, card-to-sweep, sweep, sweep-to-menu**; `deadMs` is the waits, `loadMs` entry-load plus first-draw, `authoredMs` the rest.
- `fight-start-report.mjs` sets two builds side by side; `fight-start-profile.mjs` reads a CPU profile of the production bundle through its hidden source maps; `fight-start-frames.mjs` compares frames; `--frames` and `--profile` on the timeline tool feed them.
- **On the production build, without a second 11 GB `dist`:** `tools/lean-vite.config.mts` builds the bundle alone, with release 64's deploy environment (`BASE_PATH=/ PYREFLY_RELEASE=64 PYREFLY_BUILD_SHA=e9907cad`); this reproduces the live `index-BygGxbJE.js` and every other chunk **byte for byte** (checked with `cmp` against `D:/pyrefly-release55/dist-release`; the one difference in `index.html` is the title plate's preload name, which `tools/overlay-static.mjs` writes as a full build does). `overlay-static.mjs` serves the lean build over the art of the live artifact (`dist-release`), answering as Cloudflare does (`/assets/*` immutable, the rest revalidated with an ETag). Before and after were served on two ports (5604, 5605) over the same art, and interleaved run by run.
- `tools/rig-record-lock.mjs` takes the review-browser lock (`RIG-RECORD`, with the `.next` line; stamped when taken, 7-minute budget per hold, the rest of a plan is queued again). The shared PC runs other lanes' browsers and builds: every run records the machine's CPU busy percentage.

## 2. Where the time goes (before: release 64's code)

Medians in seconds, n runs each (the range of the total in brackets). Parts follow one another and add up to the total.

| run | n | total | press-wait | party-prep | scene | entry-load | first-draw | card | card-to-sweep | sweep | sweep-to-menu |
|---|---|---|---|---|---|---|---|---|---|---|---|
| demo Ch I (FFX) fast cold | 7 | **22.1** (21.4-22.4) | 0.0 | - | 10.1 | 1.7 | 1.1 | 2.2 | 0.0 | 6.6 | 0.1 |
| demo Ch I (FFX) fast warm | 3 | **21.2** (20.7-21.8) | 0.0 | - | 10.0 | 1.2 | 1.0 | 2.2 | 0.0 | 6.6 | 0.1 |
| demo Ch I (FFX) human cold | 3 | **19.9** (19.9-20.0) | 0.0 | - | 10.1 | 0.1 | 0.8 | 2.2 | 0.0 | 6.7 | 0.1 |
| demo Ch I (FFX) long cold | 3 | **19.8** (19.8-19.8) | 0.0 | - | 10.1 | 0.1 | 0.7 | 2.2 | 0.0 | 6.6 | 0.1 |
| demo Ch IV (FFX-2) fast cold | 16 | **13.5** (11.6-13.7) | 0.2 | - | - | 2.9 | 1.1 | 2.2 | 0.0 | 6.1 | 1.0 |
| demo Ch IV (FFX-2) fast warm | 3 | **11.6** (11.6-13.0) | 0.2 | - | - | 1.4 | 0.7 | 2.2 | 0.0 | 6.1 | 1.0 |
| demo Ch IV (FFX-2) human cold | 4 | **11.6** (11.6-11.7) | 0.2 | - | - | 1.3 | 0.9 | 2.2 | 0.0 | 6.1 | 1.0 |
| demo Ch IV (FFX-2) long cold | 3 | **10.2** (10.2-10.3) | 0.2 | - | - | 0.1 | 0.7 | 2.2 | 0.0 | 6.1 | 1.0 |
| select Ch I (FFX) fast cold | 3 | **47.0** (46.9-49.0) | 0.0 | 0.4 | 35.2 | 1.5 | 1.1 | 2.2 | 0.0 | 6.6 | 0.1 |
| select Ch I (FFX) fast warm | 3 | **46.4** (46.4-47.8) | 0.0 | 0.4 | 35.2 | 1.0 | 0.9 | 2.2 | 0.0 | 6.6 | 0.1 |
| select Ch IV (FFX-2) fast cold | 3 | **28.4** (28.4-28.5) | 0.0 | 0.3 | 15.9 | 1.1 | 1.7 | 2.2 | 0.0 | 6.1 | 1.0 |
| select Ch IV (FFX-2) fast warm | 3 | **28.2** (27.7-28.3) | 0.0 | 0.4 | 16.0 | 0.8 | 1.7 | 2.2 | 0.0 | 6.1 | 1.0 |

How to read it, per game:

- **FFX, Chapter I demo (19.8 s at the floor, 22.1 s on a fast press).** The voiced intro is the first 10.1 s (1.4 s to the first line, three lines of 3.6, 2.1 and 1.9 s of speech with 0.35 s holds). Then the battle loads under the entry (the held picture of the intro, cracking): **a 0.6 to 1.4 s task starts the moment the entry does** (the scene's backdrop layers and the look's boss mask; the entry's crack cannot move during it), then the first draw of the field with its figures (0.7 to 1.1 s). Then the card, the sweep and the first menu 0.1 s later (FFX opens its menu at once).
- **FFX-2, Chapter IV demo (10.2 s at the floor, 13.5 s on a fast press).** No intro: the load starts at the press. Then the card, the 6.1 s sweep, and 1.0 s from the sweep to the first menu: the ATB's first gauge, faithful to FFX-2 (decision 180b), not waste.
- **Select path (the ordinary game).** Everything before the fight is authored or the player's own: the prep menu, and the pre-battle scene (15.9 s in Chapter IV, 35.2 s in Chapter I at a line every 650 ms). After the scene there is **no held frame** (the script's last step to the entry is 3 ms in Chapter IV and 71 ms in Chapter I, the held picture's capture: `scene-finished` against `entry-add`, 4 runs) and the load is 1.9 to 2.9 s, the same loading card and the same double hold.
- **Warm against cold** (same browser, second load): 0.2 to 1.1 s less load (the HTTP cache; the art is revalidated, not refetched).

**Where the load goes** (CPU profile of the cold Chapter IV press, 0 to 5.5 s, main thread 4.9 s busy and 0.5 s idle): the paintings' decode and matte work (`PaintedArt`, `PaintedMatte`: 1.5 s over the 224 character files and 91 rig files that arrive after the press), the scene's backdrop layers (0.6 s), the look's boss mask (0.2 s in Chapter IV, 0.6 s in Chapter I), the depth plates' cut (0.4 s), the first draw's program builds and texture uploads (1.1 s). It is **one thread's work in sequence**: there is no idle gap to overlap anything into except in the voiced intro and behind the prep menu and the pre-battle scene (7 s of idle in Chapter I's intro), and doing the work there would stall what is on screen (section 6).

## 3. What was cut

1. **`ui/common/transitions/cardHold.ts`** (new; `loadingCard.ts` notes when the loading card goes up and when it hands over; `BattleScreen.showBattleStart` asks `cardHoldOption`): the hold is `1.9 s - the time the loading card has been up`, never under `CARD_HOLD_FLOOR_MS` 1000 ms (the whole of the entry's reveal: the authored break is 700 ms in FFX and 560 ms in FFX-2, but from the battle card going up to the entry overlay being removed was MEASURED 929 to 962 ms in FFX and 701 to 785 ms in FFX-2; the first cut had 900 ms and began the fade 13 to 61 ms early in every FFX start, invisible under the opaque card), never over 1.9 s; the hurried opening's 700 ms is under the floor and untouched; **`?cardhold=full` is release 64's behaviour** (for a comparison). A card up for 0.9 s or less holds the rest of its 1.9 s (1.9 s in all, as ever); one up for 3 s holds 1.0 s. **No loading card, no change** (every fight whose stage is ready when the entry begins). Tests: `tests/unit/card-hold.test.ts` (13: 11 for the hold and the loading card, 2 source pins for the wiring; the commit message of `5a0099fa1` says 10 tests, the file had 11).
2. **`demoWarm.ts`, `BattleScreenFlow.runChapter`, `BattleScreenWarmup.drawSlicedOffscreen`, `demoBoard.ts`** (the warm is the demo's): `stopDemoWarm(id)` names the fight the press starts. A stage step of the OTHER fight that is still in flight lets go at its next boundary: before its look is applied (`applyChapterLook` is global: it would have landed under the picked battle's), before its offscreen draw, and between the draw's program-family slices (`drawSlicedOffscreen(..., { stop })`; each slice restores what it hid). The scene it left is held half warm: the **next** warm finishes it (a set of unfinished scenes; the held scene is reused, not built again). The board reads the cursor by the clock (every 100 ms) and not every sixth frame (a frame is 300 ms while the warm works: a move of the cursor reached the warm 1.8 s late). Tests: `tests/unit/post-fight-start-warm.test.ts` (8); `r62-demo-warm.test.ts` re-pinned on `stopDemoWarm(id)`.
3. Tooling (section 1), `docs/DEV.md` (the switch row and the tool section).

No file of `docs/CONTRACTS.md` is touched. Both source changes are shared plumbing: **both games**.

## 4. Before and after

"Before" is the live release's code (the lean build of `origin/main`, bundle `index-BygGxbJE.js`, byte for byte the live one); "after" is this branch's bundle (`index-Dw4QBcaD.js`; one early run of Chapter I's fast press used `index-DvVWMSlw.js`, the same code without the unfinished-scene set, which a single press cannot reach). Runs were interleaved before, after, before, after; three or more of each; the lock's holds and the other lanes' load move the **load** by up to 2 s from run to run, so the table gives what is NOT load separately.

| run | n | total before | total after | change | card before | card after | load before | load after | everything but the load, change |
|---|---|---|---|---|---|---|---|---|---|
| demo Ch I (FFX) fast cold | 7/7 | 22.1 (21.4-22.4) | 21.2 (20.4-22.0) | -0.9 | 2.2 | 1.2 | 3.0 | 3.1 | -1.0 |
| demo Ch I (FFX) fast warm | 3/3 | 21.2 (20.7-21.8) | 20.8 (20.7-21.3) | -0.3 | 2.2 | 1.2 | 2.2 | 2.7 | -0.8 |
| demo Ch I (FFX) human cold | 3/3 | 19.9 (19.9-20.0) | 19.5 (19.4-19.5) | -0.5 | 2.2 | 1.2 | 0.9 | 1.4 | -1.0 |
| demo Ch I (FFX) long cold | 3/3 | 19.8 (19.8-19.8) | 19.5 (19.4-19.5) | -0.3 | 2.2 | 1.8 | 0.8 | 0.8 | -0.3 |
| demo Ch IV (FFX-2) fast cold | 16/16 | 13.5 (11.6-13.7) | 12.5 (10.6-13.7) | -0.9 | 2.2 | 1.2 | 4.0 | 4.1 | -1.0 |
| demo Ch IV (FFX-2) fast warm | 3/3 | 11.6 (11.6-13.0) | 12.0 (10.6-12.0) | +0.4 | 2.2 | 1.2 | 2.1 | 3.5 | -1.0 |
| demo Ch IV (FFX-2) human cold | 4/4 | 11.6 (11.6-11.7) | 10.7 (10.5-12.4) | -1.0 | 2.2 | 1.2 | 2.1 | 2.2 | -1.0 |
| demo Ch IV (FFX-2) long cold | 3/3 | 10.2 (10.2-10.3) | 9.9 (9.9-9.9) | -0.3 | 2.2 | 1.9 | 0.8 | 0.7 | -0.3 |
| select Ch I (FFX) fast cold | 3/3 | 47.0 (46.9-49.0) | 46.0 (46.0-47.0) | -1.0 | 2.2 | 1.2 | 2.5 | 2.4 | -1.0 |
| select Ch I (FFX) fast warm | 3/3 | 46.4 (46.4-47.8) | 45.4 (45.4-46.7) | -1.0 | 2.2 | 1.2 | 1.9 | 1.9 | -1.0 |
| select Ch IV (FFX-2) fast cold | 3/3 | 28.4 (28.4-28.5) | 26.1 (26.1-27.5) | -2.3 | 2.2 | 1.2 | 2.7 | 1.9 | -1.5 |
| select Ch IV (FFX-2) fast warm | 3/3 | 28.2 (27.7-28.3) | 26.1 (26.1-27.1) | -2.1 | 2.2 | 1.8 | 2.5 | 1.2 | -0.7 |

- **The card part is the deterministic one: 2.2 s to 1.2 s in every fast and human press, cold or warm, on both paths (select Chapter IV warm: 1.8 s: its loading card was up only 0.4 s), and 2.2 s to 1.8 or 1.9 s on the long dwell, where the loading card was up for only 0.3 to 0.4 s: the card is on screen 1.9 s in all.** The last column, "everything but the load", moves by that: about -1.0 s.
- **The load is noise-dominated on a fast press** (the press falls inside the warm's own long tasks): in the Chapter IV fast cold press it is bimodal, 2.1 to 2.4 s in some runs and 4.0 to 5.2 s in others, **in both builds**; a no-script rendering frame of 0.8 s at +0.4 s decides it. A second batch of 8 and 8 in swapped order (after first) read the same: 6 slow runs of 8 in both builds, loads 2.2 to 4.3 s; over all 16 and 16 the median total falls from 13.5 s to 12.5 s and the median load stays 4.0 s to 4.1 s. (The first 8 and 8 had 4 slow runs of 8 before and 7 of 8 after: chance, not the change.)
- Totals: the select path falls 1.0 s (Chapter I) and 2.1 to 2.3 s (Chapter IV, whose load also fell in these runs: noise); the demo's fast cold press falls 0.9 s in both chapters (7 and 16 runs of each build); the human-pace presses 0.5 s (Chapter I) and 1.0 s (Chapter IV); the long dwell 0.3 s; the warm-session presses of the demo (3 runs) are inside the load's noise (-0.3 s and +0.4 s).

## 5. Nothing visible changed

`--frames` takes a screenshot at the same MOMENTS of every run (the loading card +0.5 s, the boss card +0.8 s, the card +1.4 s, the opening sweep +2 s, the first menu +0.5 s; the intro +2.5 s in Chapter I) on before, after and a second run of before (the noise), in two sets (`frames/`, `frames2/`). `docs/screenshots/post-fight-start-card-frames.jpg` is the first set's contact sheet (each cell: before over after). The number is the mean absolute difference (0 to 255) of the two frames, after against before ("A~B") and, as the noise, the second before against the first ("A~A"):

- The voiced intro of Chapter I (+2.5 s): **identical** (0.00 and 0.00).
- The loading card (+0.5 s) and the boss card (+0.8 s): the same card; the differences are those of two runs of the same build (A~B 0.2 to 11.7, A~A 0.0 to 8.6; the larger ones are the entry's crack still moving).
- The sweep (+2 s) and the first menu (+0.5 s): the same camera, party and boss in the same places (see the sheet); A~B 4.4 to 12.0 against A~A 4.5 to 6.2 in the sweep, A~B 0.7 to 3.8 against A~A 1.0 to 1.5 at the menu. What differs is the ambient motes, the light shafts and the first turn's cut-in, which run on the battle's own clock, and the sweep now begins 1.0 s earlier on it.
- The one frame that DIFFERS, as designed: 1.4 s after the battle's card goes up, the old build still shows the card and the new one has gone on to the opening (Chapter I: A~B 110, A~A 0.1 and 0.0 in the two sets; Chapter IV's pair is noisier because the old card is within 0.1 s of leaving).

## 6. NOT done: what would change what the player sees, with its seconds

Each is a call on the look or the pacing; none was made.

| option | saves | what it costs |
|---|---|---|
| Chapter I's voiced intro cut to Tidus's first line, or removed (decision 173f kept a short voiced intro) | 5.0 s / 10.1 s (FFX only) | Yuna's and Auron's recorded lines, or all three |
| The boss card at the hurried hold (0.7 s) for every press, on top of the cut already made (the card part, which counts its 0.26 s fade, is now 1.26 s on a cold press and 2.16 s where no loading card went up, so a warm press and a cold press differ; the hurried card is 0.96 s) | a further 0.3 s on a cold press, 1.2 s where no loading card went up (both games) | the card's read time; the push-in of the demo card (2600 ms in `proCard.css`) is already cut off at about half of its time on a cold press |
| The opening sweep skipped or hurried by default (a press of A or Enter already ends it) | 6.1 s FFX-2 / 6.6 s FFX | the camera move Bailey chose (calm camera, steady pacing); the original camera's sweep is 3.8 s (`openingHurry.ts`), 2.3 to 2.8 s less |
| FFX-2's first menu at the sweep's end (no ATB first-gauge wait) | 1.0 s (FFX-2 only) | faithfulness (decision 180b) |
| Let the demo's warm run through the voiced intro (Chapter I) | 2.2 s (the load after the intro) | stalls of 0.3 to 0.8 s in the intro (scene build, look prepare, program builds are not sliceable today); needs the slicing below |
| Warm the Chapter I and IV stage behind party prep in the ordinary game | about 1.8 s (the load is 2.5 s in Chapter I and 2.7 s in Chapter IV; 0.8 s with a finished warm) | steps hold the page 0.1 to 0.65 s: a press in the prep menu can be swallowed |
| Show the loading card at 0.4 s (its info from the chapter record) and not at 0.6 to 1.3 s on a fast Chapter IV press | 0 s (a held cracked frame for up to 0.9 s gets the card) | a picture earlier |

## 7. What remains

- **The frozen frame under the entry:** a single task of 0.25 to 1.4 s starts where the entry does (Chapter I 0.5 to 1.4 s, Chapter IV 0.25 s when the press falls between the warm's tasks and 0.8 to 1.0 s when it does not, in the cold fast press: `Backdrop.create`'s layer canvases and `prepareLook`'s boss mask). The entry's crack cannot move during it. Slicing both (engine work, no change of look) removes the freeze and is also what would make the "through the intro" and "behind prep" options safe. This is backlog M-04 slice 1.
- **The paintings' decode** (1.5 s of the load after a fast press, one thread) and the matte flood fill at 1x (0.56 s) have no cheaper path today; a worker would be the engine change.
- **The bimodal fast press:** a frame of 0.8 s at +0.4 s with no script in it (a long animation frame with no script entry and 0 ms blocking) in about half of the Chapter IV presses, which pushes the loading card from 0.6 s to 1.3 s and the load by 1.7 s; its cause is not found (unverified guess: the first paint and raster of the entry's 2560x1440 canvas over the picker's large images).
- **No wait found** between the scene's last step and the entry (3 ms in Chapter IV, 71 ms in Chapter I), between the card and the sweep (0.03 s), or after the prep menu: the plan's "held frame after a cutscene" does not exist on the release-64 build.
- The numbers were taken on this PC's shared GPU and CPU (other lanes running), headless; the booth PC's 3 cold and 3 warm presses at human pace with a frame strip are still owed (plan step 4's measurement).

## 8. Evidence and how to repeat it

Scratch (not in git): `D:/Tools/pyrefly-scratch/2026-10-26/batch1/post-fight-start/`: `runs/m/*.json` (every timeline run: marks, gaps, long tasks, resources), `runs/report-final.md` and `.json` (the aggregates; `docs/handoff/post-fight-start-report.md` is a copy), `runs/explore-*.json` and `*.cpuprofile` (the exploration and the profiles), `frames/` and `frames2/` (the pictures, `sheet.png`, `report.json`), `dist-before/`, `dist-after/`, `maps-before/` (the lean builds and the hidden maps), `bin/` (the matrix scripts), `progress.md`.

Fix round (section 9), scratch (not in git): `D:/Tools/pyrefly-scratch/2026-10-26/batch1/post-fight-start/fix/`: `dist-fix/` (the lean build of `61d57cabb`, `index-DkvlT3q0.js`; `dist-fix-maps/` and `maps-fix/` the same with its hidden maps), `runs/m/*.json` (72 raw runs: before, A = `?opencover=off`, B), `runs/analysis-m1.txt` and `runs/analysis-rows.json`, `runs/prof/` (CPU profiles of Chapters I and IV, release 64 and the fix), `runs/o/` (Chapters II, III, V and the `?cardhold=full` runs), `runs/p-*.json` and `runs/p-*-frames/` (the screencasts of Chapters I and IV), `tools/` (`probe.mjs` and `probe3.mjs` the screencast probes, `strip2.mjs` the filmstrips, `analyze.mjs`, `run-loop2.mjs` the matrix runner that takes the lock itself with a 10 ms poll, `make-*.mjs` the plans), `vitest-full-1.txt` (the full suite). Repeat: serve release 64's lean build on 5604 and the fix's on 5605 as above, then `node fix/tools/make-matrix.mjs <plan.json> 12 1` and `node fix/tools/run-loop2.mjs <plan.json> 7`, then `node fix/tools/analyze.mjs fix/runs/m`.

```
# the lean builds (git-bash: MSYS_NO_PATHCONV=1 so BASE_PATH=/ is not rewritten)
BASE_PATH=/ PYREFLY_RELEASE=64 PYREFLY_BUILD_SHA=e9907cad npx vite build --config tools/lean-vite.config.mts --outDir <dir> --emptyOutDir
node tools/overlay-static.mjs --port=5604 --root=<lean dir> --root=D:/pyrefly-release55/dist-release
# one browser job, or a plan of jobs under one lock
PYREFLY_BROWSER=gpu node tools/fight-start-timeline.mjs --base=http://127.0.0.1:5604/ --path=demo --chapter=ffx2-bahamut --dwell=fast --out=<run.json> --label=before-r1
node tools/fight-start-report.mjs --dir=<runs> --md=<report.md>
node tools/fight-start-frames.mjs --a=<dir before> --b=<dir after> --noise=<dir before again> --sheet=<sheet.png>
```

## 9. The adversarial review and the fix round (2026-10-26 evening)

The review (`D:/Tools/pyrefly-scratch/2026-10-26/batch1/post-fight-start/review/REVIEW.md`, on `ec18fd13c`): **merge, do not deploy**; no critical, no major, five minors and one observation. This round fixed what could be confirmed. **Game case: both games** (all of it is shared opening plumbing; Chapters I and II and III are FFX, IV and V are FFX-2). Two commits on this branch, then this note: `55442255f` (F2, F5, wording) and `61d57cabb` (the observation). **Release process:** `node tools/critic-plan.mjs` classes the change as DEEP (shared global-boot, demo and opening code): a focused review before any deploy, a deep review after it.

| finding | verdict | what was done |
|---|---|---|
| F1 (minor): the card cut is perceivable, so it sits on the driver's side of "perceivable changes are listed, not done" | **confirmed as a call, not a defect; the driver's acceptance is OWED** (a D-row) | Nothing to code. Recommended wording for the row: "a double read of the same card is waste, not a look; the card is the same painting the visitor has read for 2 to 4 s; reversible with `?cardhold=full`". The option list in section 6 now says what the cut is and what a further cut (the hurried hold for every press) would save on top of it (0.3 s on a cold press, 1.2 s where no loading card went up); a cold and a warm press now differ by 0.9 s of card, and the demo card's 2600 ms push-in is cut off at about half of its time on a cold press, both said there. |
| F2 (minor): the 900 ms floor does not cover the FFX entry reveal | **confirmed**; no visible effect | `CARD_HOLD_FLOOR_MS` is 1000 ms; the comments, the test, DEV.md and this note say what was MEASURED (battle card up to the entry overlay removed: 929 to 962 ms FFX, 701 to 785 ms FFX-2; authored 700 and 560). Measured after, 12 cold starts per chapter: the card begins its fade 50 to 87 ms after the ink is down in Chapter I (median 72 ms; release 64: 947 to 974 ms) and 207 to 305 ms after in Chapter IV; **0 of 48 starts fade early** (before: 0 of 24 too, by the length of its hold). Cost: the card part is 1.27 s, not 1.17 s. |
| F3 (minor): more hitches at the opening's start in Chapter I | **not reproduced**; the cause of the one that exists is found | 12 cold starts per arm per chapter, interleaved: Chapter I, runs with a frame gap over 24 ms in the first 600 ms of the opening: **6 of 12 on release 64, 6 of 12 on the fix (floor only), 6 of 12 on the final build** (Fisher p 1.0; lost ms mean 22, 24, 15). Pooled with the lane's own 22 and 22: 14 of 34 against 25 of 46 (p 0.27). The earlier 8 of 22 against 13 of 22 was chance. **Chapter IV has a 33 to 70 ms stall at the opening's start in 12 of 12 starts in every build, release 64 included** (one frame, +150 to +250 ms into the opening): a CPU profile of it (`fix/runs/prof`, read through the build's source maps) puts it in `LookBold.extentsOf` > `AlphaPrime.readExtents` (41 ms of one 49 ms bin): the look's first-sight alpha read of a painting, most likely the boss's (the party's are read while it stands visible under the card), made the frame the boss's entrance makes it visible (which painting was not isolated). The demo's prebuild reads it ahead only after its warm has finished (a fast press comes first) and the ordinary game has no prebuild, so every fight has it. **Not done** (a fix is a new piece of look code and another measuring round): read the held figures' first paintings under the card, one per task in the card's first 700 ms (`readExtents(heldTextures()[0])`, the same call the prebuild makes), which would remove it for the demo's fast press and for every ordinary fight. Its cost to the player: 0 s. Also found: **in Chapter IV a 64 to 76 ms frame lands at the card's fade start in 8 of 12 starts with the floor alone and 5 of 12 on the final build (0 of 12 on release 64, where the fade starts 0.9 s later)**: the cut moves the fade onto the tail of the load (Fisher p 0.001 and 0.04); the card is an opaque compositor fade over a still field, so it does not show (the screencasts show no hitch), but it is the same effect F3 asked about. |
| F4 (minor, info): the demo warm change has no measurable gain | **confirmed** | The CHANGELOG line says "prevents; no time is claimed" (below). No code. |
| F5 (minor): nothing pins that `showBattleStart` spreads `cardHoldOption(...)` | **confirmed** | `tests/unit/card-hold.test.ts` now pins it (a source test like the r62 one for `stopDemoWarm(id);`) and pins that `loadingCard.ts` notes the card's coming and going: 13 tests. The commit message of `5a0099fa1` says 10 tests (the file had 11); history is not rewritten, the count here is right. |
| the observation: a pose pop at the start of every opening | **confirmed in release 64 and in this branch, Chapters I to V** | **Fixed** (`61d57cabb`), see below. |
| not caused by this branch, noted by the review: the saving shrinks on a slower machine (4x CPU: 0.3 to 0.5 s) because the card is held until the framing plan settles; Chapters II, III take 1.45 s and V 2.7 s to the first menu because the enemy acts first (authored) | **accepted as stated** | No change. |

### The pose pop, fixed: the opening's first frame is put under the card

What a player saw in release 64 (every chapter with a card; the review's filmstrips `strip-ch1-edge3.jpg` and `strip-ch4-edge.jpg`): the card fades out over a field that shows the **party standing at home with the full HUD up** (turn order, hints, the boss's bar) for the last 250 ms of the fade and 35 ms after it; then `BattleMoments.battleStart` took the HUD down and put the party at alpha 0, and the party faded back in over the next 260 ms. (The opening also queues a zero-length move off stage and a move home; as the two tweens are ordered, the second reads the figure's position before the first has applied, so on screen it is the vanish and a fade in at the mark, not a walk-on. Nothing here changes the opening's own motion: it is left exactly as it was.)

The card is the cover (`until:` already holds it for CHAPTER FRAMING's first plan), so the opening's first frame is now put under it: `BattleStartBanner` calls a new `covered` hook once as the card starts to leave (the hold, a press, a click or the screen leaving), `BattleMoments.coverOpening` takes the HUD down and parks the party at alpha 0 (`src/engine/OpeningPark.ts`), and the opening that follows finds them down. Positions, poses, the camera and the slide's own fade are untouched. A hurried opening, a run at `skip` and `?opencover=off` (release 64's frames, for a comparison) cover nothing; a party parked and not slid on is put back at alpha 1. `slidePartyIn` moved to `OpeningPark.slideParty` line for line: `BattleMoments.ts` 710 to 706 lines, `BattleScreen.ts` 1086 to 1086. Tests: `tests/unit/opening-cover.test.ts` (12). **Game case: both.**

Evidence, the same seed and route, release 64 on top and the fix below, frames at -300, -150, -60, +60 and +350 ms from the moment the card is gone: `docs/screenshots/post-fight-start-opening-cover-ch1-seymour-flux.jpg`, `-ch2-yunalesca.jpg`, `-ch3-braska.jpg`, `-ch4-bahamut.jpg`, `-ch5-vegnagun.jpg`. On top the party (and in Chapters I and IV the HUD) shows under the dissolve and is gone at +60; below the dissolve opens on an empty field and the party fades in at its mark at +350, in all five. **What it does not change and what remains:** the camera's own hard cut to the opening's first shot at the card's end is still there (visible in the strips between the -60 and +60 frames: the same field from a slightly different place). Moving that cut under the card too needs the headline boss for `ShotRules.opening` (the FFX-2 giants' master) and the scene director's answer first (a director may take the opening's camera), so it was left; its cost to the player is 0 s and it is the next piece of the same continuity. The first-sight read in F3 above is the other.

### Final numbers (this round)

Demo (`?demo=1`), fast press, cold page, simulated pad, 2560x1440, headless Chromium on the real GPU, seed as the demo's, 12 runs per arm per chapter, interleaved with the arm order rotated, one browser per run, the review-browser lock held. **before** = release 64's bundle (`index-BygGxbJE.js`, byte for byte the live one), **A** = this branch's bundle `index-DkvlT3q0.js` with `?opencover=off` (the floor fix alone: release 64's frames), **B** = the same bundle as it ships. All in `D:/Tools/pyrefly-scratch/2026-10-26/batch1/post-fight-start/fix/runs/m` (raw), `runs/analysis-m1.txt`.

| | Chapter I (FFX) before / A / B | Chapter IV (FFX-2) before / A / B |
|---|---|---|
| total, median (mean) | 22.13 (22.23) / 21.24 (21.32) / 21.19 (21.26) s | 13.52 (13.18) / 11.24 (11.84) / 11.28 (11.79) s |
| card part (hold and fade), median | **2.17 / 1.27 / 1.27 s** (p < 0.001) | **2.17 / 1.27 / 1.27 s** (p < 0.001) |
| load (entry-load + first-draw), median (mean) | 3.07 / 3.05 / 3.02 s (3.10 / 3.09 / 3.05) | 4.03 / 2.67 / 2.68 s (3.69 / 3.24 / 3.19), p 0.29 and 0.17: noise |
| total less the load, median | 19.08 / 18.20 / 18.20 s: **-0.88 s** | 9.50 / 8.59 / 8.59 s: **-0.91 s** |
| total, change in the mean (permutation p) | **-0.9 s** (0.002, 0.001) | -1.3 and -1.4 s (0.003, 0.002), of which the load is the noise above |
| card fade start less the entry's removal | 947 to 974 / 50 to 81 / 51 to 87 ms | 1118 to 1185 / 207 to 283 / 238 to 305 ms |
| opening's first 600 ms with a frame gap over 24 ms | 6 / 6 / 6 of 12 | 12 / 12 / 12 of 12 (the first-sight read, pre-existing) |

So the honest gain of the card cut on a fast cold press is **0.9 s (0.88 and 0.91 s without the load's noise)**, not 1.0 s, in both games. The other chapters (II, III, V, `__pyrefly.gotoChapter` on a cold page, ordinary flow, one run each): the card part 2.17 to 1.26 to 1.28 s in all three, 0 console or page errors; `?cardhold=full` restores 2.16 and 2.18 s in Chapters III and V (the two the review had not run). Pop strips on release 64 and the fix for Chapters I, II, III, IV and V, all fixed.

**Checks:** `npx tsc --noEmit` exit 0; **the full unit suite on `61d57cabb`: 1633 files passed, 26 skipped, 25,921 tests passed, exit 0** (3 workers, a shared PC: the `advisor-floor` load timeouts the review saw did not recur); `node tools/orphans.mjs` 24 orphaned, the same as `origin/main` (2159 modules, `OpeningPark.ts` is imported). No file of `docs/CONTRACTS.md` is touched.

**Still not verified:** the booth PC, a phone viewport, Chapters 6 to 19 (the same shared path), a slow CPU for the cover (it adds no work: one alpha write per figure and the HUD's `hidden`), and a longer run of the demo's human-pace presses on the fix.

## Lines for the release's CHANGELOG (release lane to place)

- **Both games, a cold start no longer reads the boss card twice.** When the fight loads behind the entry the card is up over the ink for as long as it loads; the battle's own card now holds only the rest of its 1.9 s (never under 0.9 s), so the opening begins up to 1.0 s earlier on a cold page. A fight whose stage is ready is unchanged. `?cardhold=full` is the old behaviour.
- **Both games, demo only (prevents; no time is claimed):** a press made while the warm is building the other fight's stage lets that step go instead of loading the picked fight beside it. The review's 4 deliberate races per build showed no measurable gain and no regression, so the line says what it prevents, not what it saves (or leave it out of the list and keep it as the commit).
- **Both games (a glitch removed, no new look; `?opencover=off` restores the old frames):** the boss card no longer fades out onto a party standing at home with the full HUD up, which the opening then took down; the HUD and the party are put down under the card as it starts to leave, so the field the card fades onto is the one the opening starts from. Section 9.
