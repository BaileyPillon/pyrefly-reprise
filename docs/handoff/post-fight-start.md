# post-fight-start: the time from the press to the first command (post-conference plan, step 5; PR-0481)

Branch `post-fight-start` (tree `D:/pyrefly-anim-proto`), from `origin/main` `acbd815d3` (live release 64's code, `e9907cad8`, plus records). 2026-10-26, the driver's lane "post-fight-start".
**Game case: both games.** The measuring is shared plumbing; Chapter I (Seymour Flux) is FFX and Chapter IV (Bahamut) is FFX-2 wherever a number names one. The voiced intro is FFX only; the first turn's 1.0 s (the ATB's first menu) is FFX-2 only (decision 180b, "Leave FFX-2 faithful"). Nothing deploys from this branch.
Authority: Bailey, 2026-10-25 ~23:45 EDT, "i'll go with all your recommendations and i delegate all decision making to you for now"; 2026-10-26 ~13:30 EDT, "booth is over, start the post-conference plan, keep going please".

## The short answer

- Of the 13.5 s (Chapter IV) and 22.1 s (Chapter I) a fast press takes on the demo, **9.3 s and 19.0 s are authored** (the voiced intro 10.1 s, the boss card 2.2 s, the opening sweep 6.1 s / 6.6 s, the first turn 1.0 s in FFX-2) and **0.0 to 0.2 s are waits with nothing on screen**. The rest is the battle LOADING under the entry: 2.1 to 4.2 s (median 4.0 s in Chapter IV, 3.0 s in Chapter I) on a press 2 s after the page loaded, 0.7 to 0.8 s once the demo's warm has had its 18 s.
- The waste that was real: **the same boss card was read twice**. A fight that loads behind the entry shows the card over the ink for as long as it loads (2.1 to 3.5 s on a cold page), and the battle's own card then held its whole 1.9 s again. The hold now counts the time the card has been up (never under 0.9 s: the whole of the entry's reveal). **Measured: the card part falls from 2.2 s to 1.2 s in every fast or human-pace press, three or more runs each, in both games and on both paths (to 1.8 or 1.9 s on the long dwell, where the loading card was up for only 0.3 to 0.4 s); nothing changes where no loading card goes up.**
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

1. **`ui/common/transitions/cardHold.ts`** (new; `loadingCard.ts` notes when the loading card goes up and when it hands over; `BattleScreen.showBattleStart` asks `cardHoldOption`): the hold is `1.9 s - the time the loading card has been up`, never under `CARD_HOLD_FLOOR_MS` 900 ms (the entry's reveal is 700 ms in FFX and 560 ms in FFX-2, then a beat over the clear field), never over 1.9 s; the hurried opening's 700 ms is under the floor and untouched; **`?cardhold=full` is release 64's behaviour** (for a comparison). A card up for 1.0 s holds 0.9 s more (1.9 s in all, as ever); one up for 3 s holds 0.9 s. **No loading card, no change** (every fight whose stage is ready when the entry begins). Tests: `tests/unit/card-hold.test.ts` (11).
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
| The boss card at the hurried hold (0.7 s) for the first press of a visit | 1.2 s (both games) | the card's read time |
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

```
# the lean builds (git-bash: MSYS_NO_PATHCONV=1 so BASE_PATH=/ is not rewritten)
BASE_PATH=/ PYREFLY_RELEASE=64 PYREFLY_BUILD_SHA=e9907cad npx vite build --config tools/lean-vite.config.mts --outDir <dir> --emptyOutDir
node tools/overlay-static.mjs --port=5604 --root=<lean dir> --root=D:/pyrefly-release55/dist-release
# one browser job, or a plan of jobs under one lock
PYREFLY_BROWSER=gpu node tools/fight-start-timeline.mjs --base=http://127.0.0.1:5604/ --path=demo --chapter=ffx2-bahamut --dwell=fast --out=<run.json> --label=before-r1
node tools/fight-start-report.mjs --dir=<runs> --md=<report.md>
node tools/fight-start-frames.mjs --a=<dir before> --b=<dir after> --noise=<dir before again> --sheet=<sheet.png>
```

## Lines for the release's CHANGELOG (release lane to place)

- **Both games, a cold start no longer reads the boss card twice.** When the fight loads behind the entry the card is up over the ink for as long as it loads; the battle's own card now holds only the rest of its 1.9 s (never under 0.9 s), so the opening begins up to 1.0 s earlier on a cold page. A fight whose stage is ready is unchanged. `?cardhold=full` is the old behaviour.
- **Both games, demo only:** a press made while the warm is building the other fight's stage lets that step go instead of loading the picked fight beside it.
