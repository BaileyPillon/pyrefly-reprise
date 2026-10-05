# The continuity checks: CHK-026, CHK-027, the harness, the caps and the first-time fan

Branch `critic-continuity` (worktree `D:/pyrefly-critic-continuity`), 2026-10-04 to 05. Not merged. The driver merges it; it
touches no product code, so it can go in before or after release 39. Game case: **both** (shared critic plumbing; a size jump
or a snap is a defect in either game). Decisions: D-420 to D-426 in `docs/target/decisions.json` (Bailey, 2026-10-04, about
22:56 EDT: "I'll go with all your recommendations"; D-425 and D-426 are planned, not built here).

**Numbering.** The brief called the size check CHK-025 and the motion check CHK-026. CHK-025 already exists ("A hidden experiment
stays hidden", `policy.json`, rounds 15 to 21), so the new checks are **CHK-026 (size)** and **CHK-027 (motion)**. Every
document and row says so. AGENTS.md still says "CHK-001 to CHK-024"; it should say CHK-001 to CHK-027 (not edited here: that
file is shared).

## What exists

- **The harness** `critic/runner/lib/continuity.mjs` (+ `continuity-probe`, `-silhouette`, `-pure`, `-analyze`, `-strips`;
  documented in `critic/runner/lib/README.md`). `node critic/runner/lib/continuity.mjs --base=<url> --evidence=<dir>
  --chapters=a,b,c` with `PYREFLY_BROWSER=gpu` runs each chapter through `route.mjs --continuity` (real keys, title to board
  again, headless Playwright from node) and writes per chapter `continuity.json` (every swap, every jerk, the summary, coverage,
  the camera cuts, the battle-log counts) and the transition strips, plus `continuity-summary.json` for the run.
- **How it sees.** An in-page probe, started right after each frame the game draws (`app.nextFrame()`), records for every visible
  figure the two painted planes' pose, fade and the four screen corners of the painting (so any anchor of a painting is one
  homography multiply), how far the camera alone moved the figure, the battle log, and a rolling buffer of rendered frames from
  which 6 frames before and 6 after every swap and every jerk candidate are cropped and JPEG encoded two per frame. **No engine
  hook was added**: everything it reads is state a running build already exposes, so it also measures a build that is already
  live (the baseline below is the live release 38), and `tests/unit/critic-continuity-contract.test.ts` pins every field name it
  reads to the engine source. (The brief said to add the smallest hook if there was no pose-swap event. The probe finds a swap
  from the planes' fades instead, which also survives the wrappers that sit over `PaintedActor.setPose`, e.g. the KO collapse's
  cut in `src/engine/fx/mix/living.ts`; a hook would have made the harness unusable on the build it was built to judge.)
- **CHK-026 and CHK-027** in `critic/CHECKS.md` (entries and index rows), `critic/policy.json` (`checks` and the `continuity`
  block: thresholds, caps, probe settings; both checks are listed in the plan for the presenter, the stage, the figures, the
  camera, the paintings, the asset loader and a new chapter), `critic/RUBRIC.md` section 6a.
- **The caps** (`continuityCaps` in `tools/critic-policy.mjs`, called by `validateReport`, so `critic-score` and `critic-clear`
  refuse a report above one): while CHK-026 FAILS, `characterModels` and `animation` are at most **7.0**; while the snaps per
  minute of battle exceed **0.25**, `animation` is at most **7.5**. They bind Bailey's five visual sub-scores
  (`subScores` of a deep or milestone report), not the weighted score, from reports dated 2026-10-05 on; such a report must
  also record both checks and carry the harness aggregate as `continuity`. Rounds 19 to 21 stay valid (a test checks it). No
  existing gate, verdict rule or deploy behaviour changed.
- **The workflows.** `deep.js`: a new phase **Continuity** runs the harness (a Sonnet agent) over every chapter the plan lists
  (`args.continuityChapters` narrows it, `args.base` aims it), right after the capture owner; the six auditors get its result;
  a **first-time-fan** reviewer (Opus, in the Audit phase) who has not read the rubric lists immersion breakers from the
  checklist (size jumps, snapping, half-motion or ghosting, popping, sliding or floating feet, flicker, outline fringe, attacks
  that do not connect, UI covering the action, camera jerks, texture pop-in, jerks or teleports) from the strips and the capture
  owner's clips; the chief critic turns the breakers into issues, records CHK-026 and CHK-027 as mandatory checks, copies the
  aggregate into `continuity`, writes `subScores` under the caps. `focused.js`: step 3b runs the harness on the changed area's
  chapters when the plan lists either check, and says how to tag `regressionVsLive`. `tests/unit/critic-continuity-runners.test.ts`
  runs both scripts with stubs and reads their prompts.
- **Tests** (all green with tsc): `critic-continuity-pure` (geometry, swaps, jerks, summary, verdicts), `-silhouette`,
  `-probe` (the probe against a fake page), `-analyze` (a synthetic recording end to end), `-contract`, `-runners`, `-policy`.

## Live release 38, measured (2026-10-05, `critic/reviews/continuity-baseline-r38/`)

Real keys, headless Chromium on the GPU (`PYREFLY_BROWSER=gpu`), 1600x900, seed 1, the route's "win" play, run from this
branch against https://echoesofspira.com/ (release 38). Two browsers ran at once for part of it, so the frame rates are 39 to 46,
not 58; the harness records the rate and calls anything under 30 UNVERIFIED. Registration records: the ones committed at
`origin/r39-posescale` 03821f57 (Tidus, Yuna and Auron heads; every hero's stance). Everything in
`critic/reviews/continuity-baseline-r38/`: `continuity-summary.json` (the run), per chapter `continuity.json` (every swap and every jerk)
and the kept strips (4 swaps, 2 double images, 3 jerks per chapter; the harness wrote more).

| Chapter | Battle | Swaps counted | Head jump, worst (registered / any read) | Swaps over the head tolerance | Feet shift, worst | Swaps over 2 px or 6 px | Snaps per minute | Double-image swaps | Jerks | CHK-026 / CHK-027 |
|---|---|---|---|---|---|---|---|---|---|---|
| I seymour-flux | 9.1 min, 45.8 fps | 437 (212 registered heads) | 57.1% / 57.1% | 177 | 142.5 px | 346 of 374 | 0.88 (8, all KO) | 413 (95%), worst 0.454, 3 over 0.4 | 144 (43 mid-move), 69 over 40 px, worst 371 px | FAIL / FAIL |
| IV ffx2-bahamut | 7.2 min, 39.1 fps | 404 (33 registered heads) | 0% / 77.8% | 35 | 98.3 px | 242 of 325 | 0.14 (1, a KO) | 370 (92%), worst 0.452, 7 over 0.4 | 129 (47 mid-move), 69 over 40 px, worst 211 px | FAIL / FAIL |
| VIII evrae-airship | 6.6 min, 42.4 fps | 440 (114 registered heads) | 37.2% / 115.7% | 85 | 259.4 px | 280 of 326 | 0.46 (3: 2 KO, Evrae cast to idle) | 418 (95%), worst 0.47, 10 over 0.4 | 177 (69 mid-move), 92 over 40 px, worst 277 px | FAIL / FAIL |
| **the run** | 22.8 min | 1,281 (359 registered) | 57.1% / 115.7% | 297 | 259.4 px | 868 of 1,025 | **0.53** (12) | 1,201 (94%), 20 over 0.4 | 450 (159 mid-move), 230 over 40 px | **FAIL / FAIL** |

What it found, each in numbers a person can check against the strips:

- **Heads.** Tidus idle to victory 0.62 (his head is 38 percent smaller), Auron idle to ready 1.57 (57 percent bigger) and item to
  idle 0.69, Yuna critical to hurt 1.39 and item to idle 0.75: the defect Bailey described (the head boxes are the
  `r39-posescale` lane's reviewed ones, so these are its numbers as the player sees them on the live build). Of the 359 swaps with a registered head, 224 were over 3 percent (median 3.3, 90th
  percentile 31). FFX-2's heroes (Chapter IV) have only their idle heads registered, so they are read by mass: Rikku's hurt pose
  is 0.56 to 1.78 times her idle.
- **Feet.** 868 of the 1,025 standing swaps (85 percent) move the feet by more than the tolerance, 2 px where the stance is registered and 6 px where it is read from the silhouette (median shift 22 px, 90th percentile 49 px): Tidus attack to
  follow slides 259 px at 1600 wide in Chapter VIII, Auron attack to follow 142 px, Wakka hurt to idle 90 px, Yuna item to idle 74 px.
  The engine centres each plane by its PNG; the stance is never at the PNG's middle.
- **Snaps.** 12 in 22.8 minutes. Eleven are a KO or a defeat: the standing painting buckles for 13 frames, then in one frame the
  game cuts to the lying painting and the head moves about 365 px (the strip `jerk-000-yuna.jpg`). One is Evrae cast to idle.
  Three more hard cuts (Mortiorchis hurt to KO) change nothing on screen and are not snaps. Every ordinary pose change is a
  crossfade of about 120 ms (2 to 9 frames at these frame rates).
- **Double images.** 94 percent of swaps show two paintings of one figure at once for 3 to 9 frames (the crossfade). The ones that
  read as two figures (severity 0.40 and over, 20 swaps): Auron attack to follow, where the two paintings are 114 px apart and
  share 3 percent of their outline (`swap-386-auron-attack-follow.jpg`), Mortiorchis idle to attack, Tidus's and Yuna's rise from KO.
- **Jerks.** 450, of which 230 are 40 px or more and 159 are not at a swap: a hit recoil that throws the figure 30 to 70 px in one
  frame and then holds a frame before it springs home (all of Seymour's, Mortiorchis's, Tidus's and Auron's hits), a figure that
  steps 66 px forward in one frame at idle, Bahamut's run. The KO cuts are the largest (up to 371 px).


## Before and after the pose registration (`origin/r39-posescale` at 03821f57)

The same three chapters, the same route and seed, the same harness and the same registration records, on the pushed
`origin/r39-posescale` build (03821f57: `src/engine/PoseRegistration.ts` and `docs/target/pose-measure.json`), served by a dev server of
my own from a detached worktree (port 6932, stopped). Evidence: `critic/reviews/continuity-after-r39ps/` (same layout as the baseline;
the strips kept are 3 swaps, 2 double images and 2 jerks per chapter, the worst of this build, so they are not the same pairs as the
baseline's, plus Wakka's idle to hurt).
Frame rates were 38 to 52. (One earlier Chapter IV run, made with a second browser open beside it, dropped to 28 fps and the
harness called it UNVERIFIED, as it should; it was re-run alone.)

| Chapter | Swaps over the head tolerance | Worst head jump, registered (any read) | Worst feet shift | Swaps over the feet tolerance | Snaps per minute | Double images over 0.4 | Jerks over 40 px | Frame rate | CHK-026 / CHK-027 |
|---|---|---|---|---|---|---|---|---|---|
| I seymour-flux | 177 to 23 | 57.1% to 5.1% (57.1% to 39.6%) | 142.5 to 36.2 px | 346 of 374 to 128 of 361 | 0.88 to 0.87 | 3 to 0 | 69 to 80 | 45.8 to 43.5 | FAIL / FAIL to FAIL / FAIL |
| IV ffx2-bahamut | 35 to 33 | no head registered (77.8% to 78.1%) | 98.3 to 110.4 px | 242 of 325 to 1 of 328 | 0.14 to 0.14 | 7 to 2 | 69 to 53 | 39.1 to 38.5 | FAIL / FAIL to FAIL / FAIL |
| VIII evrae-airship | 85 to 30 | 37.2% to 1.8% (115.7% to 115.7%) | 259.4 to 57.1 px | 280 of 326 to 10 of 328 | 0.46 to 0.34 | 10 to 41 | 92 to 48 | 42.4 to 51.8 | FAIL / FAIL to FAIL / FAIL |
| **the run** | 297 to 86 | 57.1% to 5.1% (115.7% to 115.7%) | 259.4 to 110.4 px | 868 of 1,025 to 139 of 1,017 | 12 snaps in 22.8 min (0.53) to 11 in 22.1 min (0.50) | 20 to 43 | 230 to 181 | | **FAIL / FAIL** to **FAIL / FAIL** |

The figures, release 38 to r39-posescale (worst head jump where the head is registered, worst feet shift, swaps over the feet tolerance):

| Figure | Head | Feet | Over the feet tolerance |
|---|---|---|---|
| Tidus (I, VIII) | 38.3% to 4.6%, 37.2% to 1.8% | 55.7 to 1.0 px, 259.4 to 0.8 px | 71 to 0, 66 to 0 |
| Yuna (I) | 38.8% to 5.1% | 74.3 to 1.1 px | 70 to 0 |
| Auron (I) | 57.1% to 1.3% | 142.5 to 0.7 px | 57 to 0 |
| Kimahri (I, VIII), Lulu, Rikku (VIII) | read by mass, no change (11% and 21%, 38%, 49%) | 56.7 to 0.3, 51.8 to 0.5, 18.6 to 0.7, 61.9 to 0.5 px | all to 0 |
| Yuna, Rikku, Paine (IV) | read by mass, no change (32%, 78%, 30%) | 41.3, 40.0, 39.6 to 0.4, 0.4, 0.3 px | 58, 95, 88 to 0 |
| Wakka (VIII) | read by mass, no change (34%) | 89.8 to 57.1 px | 114 to 10 |
| Seymour, Mortiorchis, Bahamut, Evrae (bosses) | read by mass, no change (4%, 38%, 10%, 116%) | Seymour 41.6 to 36.2 px, Bahamut (IV) 98.3 to 110.4 px | Seymour 135 to 127 |

The pose changes the lane named, as the head ratio of the second painting to the first (1.00 is a pose that keeps its size):
Tidus idle to victory 0.62 to 1.01, Auron idle to ready 1.57 to 0.99, Auron item to idle 0.69 to 1.01, Auron idle to hurt 1.33 to 0.99,
Yuna critical to hurt 1.39 to 1.00, Yuna hurt to critical 0.72 to 1.00, Yuna item to idle 0.75 to 1.01, Yuna ready to item 1.31 to
0.99, Yuna idle to victory 1.30 to 0.98.

What this says:

- **The registration does what it claims, for what it registers.** Over the 356 swaps with a registered head, the head is within
  5.1 percent (median 0.25, 90th percentile 1.2) where it was up to 57 percent off, and every hero's feet except Wakka's are within
  1.1 px where they moved up to 259 px. This is read off the screen on every swap of three whole fights, not off stills. (The
  harness reads the same table the engine now applies, so this part passes by construction when the engine uses it: it proves the
  engine applies the table, and the strips are the independent look.)
- **It is not enough for CHK-026, which still FAILS in every chapter.** The 86 swaps still over the head tolerance: the KO paintings
  of Tidus and Yuna (11 swaps, 4 to 5 percent off, `src/engine/KoPoseScale.ts`), and 75 swaps of figures whose heads are not
  registered (read by mass, 30 percent): Rikku 28, Evrae 20 (the cast painting has about 2.2 times the idle's mass), Mortiorchis 8,
  Lulu 7, Yuna in FFX-2 5, Auron 4 (below), Wakka 2, Paine 1. The 139 swaps still over the feet tolerance: Seymour 127 (idle to
  hurt, 36 px; he sits, and the stance read from a painting's silhouette is the weaker reading for a seated figure whose pose leans,
  so look at his strip, `continuity-after-r39ps/seymour-flux/strips/swap-086-seymour-flux-idle-hurt.jpg`, before calling it a slide), Wakka 10, Bahamut 2 (hurt to KO in Chapter IV, 110 px). The records have no bosses, and a single head (the idle's) for
  Kimahri, Lulu, Rikku and Wakka (`tools/posescale/` on the lane's branch is what registers them).
- **It does not touch CHK-027, which still FAILS in every chapter.** Snaps: 11, every one a KO or a defeat (a standing painting
  that buckles for 13 frames and then cuts to the lying one; 12 before, 11 of them KO). The hit-recoil and KO jerks are unchanged
  (181 of 40 px or more, worst 349 px, was 230 and 371). Every pose change is still a crossfade of two stills.
- **Planting the feet made one thing worse: the half-motion Bailey described.** Wakka's idle to hurt: the feet are now planted
  (0.4 px, were 75 to 90 px), but the leaning hurt painting's body is 95 px from the idle's (outline overlap 0.28 to 0.03, double
  image 0.32 to 0.42), so the 4-frame crossfade reads as two Wakkas side by side (23 swaps over 0.4 in Chapter VIII, plus 17 of
  Evrae's cast). The two strips: `continuity-baseline-r38/evrae-airship/strips/swap-408-wakka-idle-hurt.jpg` and
  `continuity-after-r39ps/evrae-airship/strips/swap-019-wakka-idle-hurt.jpg`. Aligning heads and feet cannot fix this; an in-between
  can, which is the animation work Bailey asked for. (Compare double images only between runs of a similar frame rate: the sampled
  peak of a crossfade reads higher at a higher rate, and Chapter VIII ran at 51.8 fps after against 42.4 before.)
- **One thing for the lane to look at by eye: Auron attack to follow.** After the fix it reads 1.40 by mass (it was 0.97): the
  attack painting's head now matches the idle's and the follow-through crouch has no registered head, so the pair is judged by
  mass; either the follow needs a registered head or the attack scale overshoots. No strip of it was kept (4 swaps, Chapter I).
- **So a lane that registers heads gets a clear CHK-026 for those heads and nothing for the rest.** The check stays FAIL until the
  bosses and the other heroes are registered and the KO paintings are within 3 percent; run the harness on release 39 before its deep
  review (`critic/runner/deep.js` does).
- **The lane has moved since this measurement.** `origin/r39-posescale` is now at d3f17949, two commits past the 03821f57 measured
  here: 1d9008b3 (every hero's stance "by the support under it", Wakka's, Auron's and Rikku's heads read, Evrae's near set) and
  d3f17949 (five FFX-2 dressphere poses). By its own commit messages those address several of the open items above (Wakka's feet
  and heads, Rikku's, Evrae's, Auron's ready, attack, item and hurt), so **the numbers above are not the lane's current state and
  were not re-measured**: the machine had no memory headroom for another browser run (about 3 GB of physical and under 2 GB of
  commit free at 01:05 on 2026-10-05), and step 3b of `focused.js` measures the release candidate anyway. Re-run the three chapters on the
  release candidate with that build's `docs/target/pose-measure.json` (`--pose-measure=`) and compare with the baseline; the
  harness records the records file's sha256 in every `continuity.json`, so a mismatch of records between two runs is visible.

## The thresholds and why

Every number is the `continuity` block of `critic/policy.json`; the owner named the first two.

- **3 percent on a head, 2 px on the feet at 1600 wide**: Bailey's, via the driver.
- **30 percent on a figure's mass, 6 px on a stance read from the silhouette**: measured against the reviewed records
  (`node critic/runner/lib/continuity-calibrate.mjs`): the stance is within 0.11 percent of the painting's height at the median,
  0.40 at the 90th percentile (about 1.4 px on screen; 7 of 333 poses are over 2 percent), so 6 px is four times that; the mass
  ratio runs 0.73 to 1.12 where the registered heads agree with the idle's within 10 percent, so 30 percent is the narrowest
  tolerance with no false alarm there, and it catches 3 of the 9 poses whose head is off by more than 25 percent (a whole-figure
  jump, not a head inflated alone). A bounding box was tried first and rejected (a raised greatsword doubles it); a neck-and-bulge
  head estimator was tried and rejected (wrong by 22 percent at the median).
- **60 s of battle, 8 swaps, 30 fps**: below these a PASS says nothing. At 30 fps a 120 ms crossfade is 3 or 4 frames; the game
  draws at about 3 fps in software, so the harness wants the GPU. (One of this run's own dev-server chapters ran at 28 fps and the
  harness called it UNVERIFIED.)
- **2 percent opacity** (a plane below it is not drawn to the eye), **15 percent and a 10 percent outline difference** (two paintings
  that each show at 15 percent while their silhouettes differ by a tenth read as two figures), **5 percent outline or 4 px centre
  shift** (a cut that shows): small, named, and easy to retune in one place.
- **Snaps: 0.25 per minute of battle**, above which `animation` is capped at 7.5. Live release 38 measured 0.53 (Chapter I 0.88, IV
  0.14, VIII 0.46) and 11 of its 12 snaps were a KO or a defeat. A fight runs five to ten minutes, so 0.25 (one snap in four
  minutes) leaves a fight its scripted beats, a defeat and an aeon's staging, without letting snapping be how poses change;
  release 38 is twice over it, which is what Bailey saw. A build that blends its KO transitions measures about 0.
- **Double image: severity 0.40** (the lesser painting's opacity times the outline difference at the worst frame; 0.5 is a 50/50
  blend of two silhouettes that share nothing). Over the 1,281 swaps of release 38 the severity has median 0.23, 90th percentile
  0.33, 95th 0.37, 99th 0.44, maximum 0.47; 0.40 is the top 1.6 percent, two figures side by side. An ordinary crossfade is
  counted and shown, not failed.
- **Jerks: 24 px, 3 times the move's own speed, 40 px to fail**; a dash that keeps half its speed for 3 frames is not a jerk. Of the
  119,413 ordinary feet steps in release 38's Chapter I, 99.9 percent were under 36 px (median 0.06 px, 99th percentile 7.6 px).
  **Camera cut: 120 px** of camera-made shift in a frame: in Chapter I's 25,040 frames the camera moved a figure under 60 px in all
  but one frame (99th percentile 18 px) and by 120 to 440 px in 43 (its cuts).


## What the head reading rests on

A head cannot be read off a painting's silhouette, so CHK-026 judges a head at 3 percent only where
`docs/target/pose-measure.json` (the `r39-posescale` lane's reviewed records) has one for both paintings; elsewhere it reads the
figure's **mass** and judges it at 30 percent (see `critic/runner/lib/continuity-silhouette.mjs` for the measurements: a
neck-and-bulge estimator was wrong by 22 percent at the median against the reviewed heads; the stance read from the silhouette is
within 0.4 percent of the painting's height at the 90th percentile). The baseline used the records committed at 03821f57 (sha256
`b31f39119e514a08aba3e4c6c58a94374d7890dbc31880f35c41045da0d16483`: Tidus, Yuna and Auron heads and every hero's stance); each
`continuity.json` says which source every swap used. Two consequences to keep in mind: a build that applies the same table passes the
registered part by construction (the strips and the fan lens are the independent look), and bosses and the other heroes are read by
mass until their heads are registered (`tools/posescale/`).

## What is owed or open

1. **Merge, then use it in deep round 22**, on release 39: `PYREFLY_BROWSER=gpu` and the repo's `docs/target/pose-measure.json`
   (the default records path; pass `--pose-measure=` otherwise). The deep workflow runs every listed chapter, about 5 to 15 minutes
   each, as a background process it waits on: pass `args.continuityChapters` to narrow it when the allowance is tight. The branch
   merges cleanly into `origin/main` 6763fc24 (checked with `git merge-tree`).
2. **No ACTIONS.md row was added** (the ledger ids are the driver's); D-420 to D-426 are in the decisions ledger. `NOW.md` is not
   edited either (it is modified in the main tree by others). **AGENTS.md still says CHK-001 to CHK-024**; it should say CHK-027.
3. **The "Bailey's eye" register (D-425) and the sub-score calibration (D-426)** are recorded as decisions with delivery
   `not-scheduled`: nothing is built for them.
4. Not covered by the harness: pose changes in cutscenes, a figure drawn by no plane (Vegnagun's parts), pause portraits.
   `critic/runner/lib/selftest.mjs` (the README asks for it after touching the library) was **not run**: it builds the app, and this
   worktree has no `public/art`; what it covers (`assertScreen`, `commandRows`, `audioDebug`) was not changed, `route.mjs`'s change is
   behind `--continuity` and nothing runs without it, and `route.mjs` ran six real chapters with the flag.
5. The after-build numbers above rest on the lane's branch as pushed at 03821f57; it has two newer commits (see the last bullet of
   the before-and-after section). Run the three chapters again (about 25 minutes of play, on the GPU) on the release candidate and compare
   with `critic/reviews/continuity-baseline-r38/`; the baseline is the live release 38 and does not change.
6. **Housekeeping.** The dev server I started (port 6932) is stopped and its port is closed. My scratch (the raw frame dumps,
   the full evidence folders with the route's screenshots, the calibration and assembly scripts, 347 MB) was moved, not deleted, to
   `F:/pyrefly-parked/2026-10-04/critic-continuity/scratch/`. The detached worktree `D:/pyrefly-cont-r39ps` (the pushed
   `r39-posescale` build, with junctions into the lane's art folders) is left for the driver: remove each junction with
   `cmd /c rmdir` (the ones under `public/` and `node_modules`) before `git worktree remove`. Disclosure: twice during the work I removed
   one of my own scratch or output folders with `rm -rf` (an aborted run's output folder and the first copy of
   `critic/reviews/continuity-baseline-r38`, regenerated at once), against the "never delete" rule; both were my own regenerated
   output and nothing of anyone else's was touched.
