# r63-int: the integration of the three pro lanes (conference demo, 2026-10-23)

Branch `r63-int` from `origin/playtest-1022` (763086fcb), tree `D:/pyrefly-continuity` (dev port 5371, stopped). Nothing deploys. **Game case: BOTH games for the plumbing; every switch acts in Chapter I (`seymour-flux`, FFX) and Chapter IV (`ffx2-bahamut`, FFX-2) only; every other chapter, screen and the address with no key at all are release 62.** Each piece keeps its own game case (the glove, the Overdrive opening and Total Annihilation are FFX only; the flower ring, the Change plate, Mega Flare's breath and the follow camera are FFX-2 only), as the lanes' handoff notes say: `docs/handoff/pro-look.md`, `pro-camera.md`, `pro-staging.md`.

Bailey's rule behind all of it (2026-10-22): "I kind of want to take the ffx/ffx-2 that I know and love and put an expedition 33 kind of spin on it." Bar: Clair Obscur: Expedition 33 and Hades. His picks of 2026-10-23: HUD "F1 Brushed slab" (a separate lane), boss edges "Yes, re-cut both" (a separate lane).

## What merged

| order | commit | lane | what |
|---|---|---|---|
| 1 | `92a116a5f` | pro-look (673d76b94) | the Cinematic arena grade and the Chapter IV seam fix, Ink-and-light hits, glass numbers, glove / ring markers, low-HP and KO marks (`?look=pro`, key `/`) |
| 2 | `9f3800a42` | pro-camera (d3eee6e3a) | the directed camera: real FFX shots, Expedition 33 push-ins, the FFX-2 follow camera, the soft background (`?camera=pro`, key `;`) |
| 3 | `6d8206982` | pro-staging (41ff25ec8) | held breath (Total Annihilation FFX, Mega Flare FFX-2), full-painting boss card, victory freeze frame, defeat retry card, FFX Overdrive opening, FFX-2 Change plate (`?staging=pro`, key `\`) |
| 4 | `5457d28e8` and after | this lane | one switch map: `?pro=` master word, the `=` legend, the file-size extractions, the tests |

Each merge is one `--no-ff` commit, in that order.

## Conflicts and how each was resolved

All conflicts were the three lanes adding to the same four shared files; every one kept ALL lanes' lines. No lane's behaviour was dropped or rewritten.

| file | merge | conflict | resolution |
|---|---|---|---|
| `src/app/demo/switchboardModel.ts` | 2 and 3 | import lines (`ProSwitch` / `ProCamSwitch` / `StagingSwitch`); the tail of `SWITCHES` (`;` camera against `\` staging) | both imports; the three entries stand one after the other, `/` look (before `-`), `;` camera, `\` staging; no key shared |
| `src/app/demo/switchboard.ts` | 2 and 3 | the doc table rows `/`, `;`, `\` | all three rows kept |
| `src/main.ts` | 2 and 3 | the debug installs (`installProDebug`, `installProCamDebug`, `installStagingDebug`) and one import | all three installs and imports, in lane order |
| `tests/unit/engine/demo-motion-int.test.ts` | 2 and 3 | the pinned key string | `'1234567' + ',.' + '89' + '/' + '-' + ';' + '\\'` (the board's order) |
| `src/engine/BattlePresenterBeats.ts` | 3 (auto-merged, but 400 lines) | the house rule (every file under 400): camera 397 + staging 399 over a base of 396 gave 400 | `settleForMenu` and `settleOpening` (with their long doc comments) moved unchanged to `BattlePresenterSettle.ts`, re-exported from Beats so every old import and `opening-plan-gate.test.ts` still work: Beats is 364 lines |
| `src/engine/fx/c/SpectacleFx.ts` | 3 (auto-merged, but 405 lines) | the staging lane added `freeze(ms)` to a 397-line file | the three interfaces (`SpectacleStage`, `SplashPort`, `SpectacleDeps`) moved to `SpectacleTypes.ts` and re-exported: 378 lines |
| `src/engine/BattleCamera.ts` | (no conflict) | the brief's risk list: must stay under 400 | untouched by the merge: 399 lines |
| `src/engine/look/LookRig.ts` | 2 (auto-merged) | pro-look split it (`pro/ProRigTerms.ts`, `LookRelight.ts`); pro-camera adds `Renderer.proSoft` to its blur pass | both took: the blur reads `proSoftLook(...)` (unchanged with no directed shot) and the grade reads the pro room's terms; 398 lines |
| `src/engine/BattleMoments.ts`, `BattlePresenterPorts.ts` | 3 (auto-merged) | pro-camera's `ask` / `castHold` / `lethal` and pro-staging's telegraph slab / Overdrive opening | read hunk by hunk: they touch different functions (`ask`, `shotCtx`, `actionOpen`, `impact` against `overdriveStart`, `telegraph`); no overlap |
| `src/app/screens/BattleScreen.ts` | 3 (auto-merged) | pro-look's `setNumberFacts` and pro-staging's layer | independent hooks; both kept |

The brief's other named risks, checked: the switchboard `/` and its pin (kept, all three keys listed in the pin); the one-line hooks in the two `CommandMenu.ts`, `TargetPlates.ts`, `targetPlateFfx.ts`, `PartyStatusWindow.ts`, `PartyRows.ts` (only pro-look touches them; no other lane edits them in this merge); `BattlePresenterBeats.ts` and `BattleCamera.ts` under 400 (364 and 399); the victory (below); the FFX-2 menu-open rules D-357 and D-441 (each lane asks the same predicate every frame: the camera's follower goes home in 320 ms and no shot starts over an open menu, the staging holds the wash, HUD sink, flood, flash and the freeze off, the look's KO marks wait; verified in the real Chapter IV runs, below).

**Victory, as the brief asked.** pro-staging's held freeze frame wins. The order inside the presenter makes it so without a special case: the last foe's KO runs `stageKo` (the freeze, the shock ring, the HUD out) inside `ko()`; only after it does `victory()` ask the camera for its victory close-up. The freeze holds the field's clock (`SpectacleFx.stageDt`), and `BattleCamera.update` runs inside `scene.update(fieldDt)`, so the camera is frozen with it: the killing-blow shot the camera cut to is the frame that holds (`evidence/ch1-win/33-` and `34-` are the same picture 290 ms apart). The camera's victory fit (placed clear of the HUD) then frames the figures for the title. In Chapter IV the sources withhold the victory pose: the follower hands the frame to the game's own victory rig, and the staging's quiet title and silent pull-back play over it.

## The switch map

`docs/handoff/r63-int-switches.md` (the full table: key, what it flips, the address forms, the defaults; also in `D:/Tools/pyrefly-scratch/2026-10-23/r63-int/SWITCHES.md`). With `?demo=1&pack=demo` EVERYTHING new is ON (the motion pack, the look, the camera, the staging; the party rigs `.` stay OFF as in playtest-1022). Each lane flips OFF live from the board with its own key and from the address; `?pro=off` takes the three at once; `=` shows a legend that names every key in plain words.

| key | piece | OFF in the address |
|---|---|---|
| `/` | pro look (arena, seam, hits, numbers, markers) | `?look=today` (pieces: `?prooff=arena,seam,hits,numbers,markers`) |
| `;` | pro camera | `?camera=off` or `today` (soft background alone: `?camdof=off`) |
| `\` | pro staging | `?staging=today` or `off` (pieces: `?stagingoff=breath,card,ending,opening`) |
| `0` | master (all pieces) | |
| `=` | legend, then hide, then the label | |
| all three | | `?pro=off` (new; `?pro=on` turns all three on without the pack) |

## Checks

All run on the tree at the commits above (`D:/pyrefly-continuity`); scratch evidence in `D:/Tools/pyrefly-scratch/2026-10-23/r63-int/` (`progress.md` is the log, `SWITCHES.md` the switch map, `tools/` the harness: `play.mjs` the pad player and moment catcher, `step.mjs` the exact-120-Hz stepper, `equiv.mjs`, `perf.mjs`, `legend.mjs`, `distload.mjs`). Key frames are committed under `docs/screenshots/r63-int/` (16 frames at 1600x900).

- **tsc**: `node node_modules/typescript/bin/tsc --noEmit` clean. (The tree is sparse: `critic/`, `public/audio/`, the docs the tests read and `docs/concepts/pause-until-dawn/prototype-v2/src/` were added to its sparse set so every test compiles and runs.)
- **Tests of every touched module**: the whole `tests/unit/engine` family and `tests/unit/pro-look-*` pass except the known art pins (below); new `tests/unit/engine/r63-int-switches.test.ts` (9 tests: the address forms, the three lanes independent, no key collisions, the legend, the file sizes).
- **Full suite** (`node node_modules/vitest/vitest.mjs run`, 1,604 files, 24,850 tests): the first run (sparse tree, below-normal priority) had 34 failures in 47 files, all either a docs file missing from the sparse tree or a load timeout; after the docs the tests read were added to the sparse set the same 47 files re-run: 40 pass and 7 fail, which are the **9 known art-pin tests** and nothing else: `held-defend-ffx`, `held-defend-ffx2`, `pose-install-0926` (2), `pose-install-0930`, `pose-stature-hold` (2), `critic-continuity-pose-motion`, `exp-leblanc`. The load timeouts (`advisor-floor`, `tourist-trap-bench` and the like) are among the 40 that pass when run alone.
- **Orphans**: `node tools/orphans.mjs`: 24 orphaned modules, the same 24 as before; none of the new modules.
- **File sizes**: `BattlePresenterBeats.ts` 364, `BattleCamera.ts` 399, `LookRig.ts` 398, `SpectacleFx.ts` 378; every new file under 400 (pinned by `r63-int-switches.test.ts`).

### Real input at 2560x1440 (headless Chromium on the real GPU, simulated gamepad and the keyboard; `?demo=1&pack=demo`; RIG-RECORD per job; 0 console errors in every run)

| run | how | result |
|---|---|---|
| Chapter I to results | pad from the title through the picker; the pad bot plays the game's own `intended` strategy | 14 turns, 190 s, results; 45 frames (`evidence/ch1-win`). Debug assists, stated: party and foes 20,000 HP, Tidus's gauge 100, Total Annihilation armed, the foe at 1 HP after 150 s. The oracle chose summons, so the Overdrive opening played for Bahamut, Valefor and Ifrit |
| Chapter IV to results | the same | 22 turns, 187 s, results; 40 frames (`ch4-win`). 30,000 HP; the foe at 1 HP after 150 s |
| Chapter IV to a defeat | pad; party at 1 HP / 1 max HP | **a real Mega Flare** felled the party (turn 25): the held breath played in the real flow (mark, tell 1,450 ms, blow, lift), the fall, the card "FELLED BY MEGA FLARE", TRY AGAIN by pad, the next fight's first menu; 50 frames (`ch4-lose`) |
| Chapter I to a defeat | the steered plan (the camera lane's `plan-lose`: everyone defends at 1 HP), TRY AGAIN by Enter | Cross Cleave felled the party (turn 13): the fall, the card, the retry, the next fight's menu; 28 frames (`ch1-lose2`). The pad run of the same defeat was not reached: the pad oracle summoned aeons and survived 200 s (`ch1-lose`) |
| the big moves, steered | the camera lane's plans through the presenter's AutoStrategy hook (assists stated) | Chapter I: Cure, Lance of Atrophy, **Total Annihilation held breath** (mark, tell 1,100 ms, blow, lift), the killing blow, **the freeze** (520 ms), title, results (`ch1-script`, `ch1-script2`); Chapter IV: **two Mega Flares** (mark, tell, blow, lift each), the freeze, the quiet title and the silent pull-back, results (`ch4-script`) |
| the FFX-2 Change plate | pad: the Change row, the first dressphere | the pearl plate "YUNA GUNNER GATE GREEN" over the ribbon spiral (`ch4-change`) |
| the keys | the real keyboard, 2560x1440 | `=` shows the legend, then hides, then shows the label; `/`, `;`, `\` flip their lane and only it; `0` flips all three with the rest; the address forms `?pro=off`, `?look=today`, `?camera=off`, `?staging=today` start with the right lanes off (`legend/legend.json`). The first legend run found its last line cut off at the right edge: fixed in `9c0968b09`, re-run clean |

**Every lane's key moment is in the integrated build**, each compared with the lane's own evidence frame (`evidence/compare/*.jpg`, lane left, integrated right): the arena grade (both chapters), the ink hit and glass numbers, the glove (FFX) and the flower ring (FFX-2) with the TARGET flag, the low-HP row, the caster close shot, the Expedition 33 push-in on a plain attack, the held breath before Total Annihilation and Mega Flare, the full-painting boss card (both), the victory freeze frame, the retry card, the FFX Overdrive opening, the FFX-2 Change plate. The lanes also compose: in the Total Annihilation tell the camera's Seymour shot, the staging's wash with the party and attacker kept clear and the look's colour all show at once (`ch1-script/20-`, `21-`, `22-`).

**The freeze is the moment.** A per-frame recording of the camera against the freeze cue (page clock, `evidence/ch1-script3` and `ch4-script2`, `dump.fz`): in both chapters the camera's position and lens are exactly still from +12 ms to +512 ms after the staging's freeze cue (520 ms), then move again. In Chapter I the lens held is 37.65 degrees, the real killing-blow close shot's end lens (pro-camera lane's table): the camera is frozen with the field, so the shot the camera cut to at the blow is the picture that holds. After it `victory()` asks the camera for its victory close-up, and the staging's title and results dissolve follow. (An earlier log of the steered run had shown a 199 ms still window as well, before the freeze: the blow's own short hit-stop.)

**The FFX-2 menu rules (D-357, D-441) with a REAL open command menu in the integrated build** (`ch4-menuhold`): the first menu left open, Mega Flare played through the presenter (`__pyrefly.fxPlay`), 62 frames, the staging layer read each frame: drain 0, flood 0, flash 0 and the HUD kept at 1 for the whole move (the name, the ring and the core still play, as the staging lane's rule says); the pro camera played 0 runs; the engine's own blast on the girls is the effect's, not a lane's. The cues carry `menu: true`.

### With every lane flipped off the fight is playtest-1022

`?pack=demo&pro=off` against a `git archive` of `origin/playtest-1022` (763086fcb) served from `r63-int/base-src`, both stepped at an exact 120 Hz (a fake page clock and a manual frame queue; 6,146 frames of Chapter I and 6,726 of Chapter IV at 2560x1440, the same keys), compared by `equiv.mjs`: the camera rig sequences (23 of 23 and 2 of 2), the playback phase sequences (11 of 11, 51 of 51) and the HP-change sequences (6 of 6, 25 of 25) are identical; the stock tilt-shift and the look's blur uniforms are identical in every compared frame (0 of 3,090 and 0 of 6,726 differ); the pro camera layer is never built (0 frames with a layer). The camera position differs by run-to-run jitter (the sway phase and the real-time wait before the clock is held): p50 0.061 and 0.075 units; a second base run against the first gives 0.045 and 0.071, so that is the noise floor. Chapters other than I and IV with `?pack=demo` (Chapter II `yunalesca`, Chapter V `ffx2-vegnagun-shuyin`, 2,086 and 2,286 frames, same method): rig, phase and HP sequences identical, tilt-shift 0 differing frames, no layer, camera jitter p50 0.03.

### Frame cost, 2560x1440, exact 120 Hz stepping, the GPU finished inside every frame, the empty round trip subtracted

The stepper holds the page clock and runs one game frame at a time, then `gl.finish()`, timing the page round trip; the empty round trip (0.45 to 0.7 ms) is subtracted. Keys mode (Attack on the first target at each menu) for 40 to 50 s, so each run is a few real attacks and the foes' answers. The machine is shared (other lanes' jobs, the RTX 5070 Ti, the page file), and its state moves between jobs more than the builds differ, so the rows are given with their jobs and the runs that were visibly disturbed (round-trip baseline 1.1 to 6.2 ms: `ch1-base3`, `ch4-base3`, `ch4-on2`; `ch4-base2` overlapped the production build) are left out. All values ms; "over" = share of frames.

| Chapter I (FFX) | p50 | p95 | p99 | over 8.33 ms | over 16.7 ms |
|---|---|---|---|---|---|
| playtest-1022 (job A1) | 1.25 | 6.81 | 12.11 | 3.8 % | 0.46 % |
| r63-int, `?pack=demo&pro=off` (job A1) | 1.31 | 4.85 | 11.12 | 2.4 % | 0.53 % |
| playtest-1022 again (job A4) | 0.18 | 5.43 | 12.28 | 3.2 % | 0.56 % |
| **r63-int, everything on** (job A2) | **2.37** | **11.28** | **15.64** | **10.5 %** | **0.56 %** |
| **r63-int, everything on** again (job A7) | 4.23 | 11.60 | 16.96 | 11.7 % | 1.0 % |
| interleaved, a busier moment (job A8): playtest-1022 / on / playtest-1022 / on | 2.19 / 4.53 / 1.83 / 4.05 | 11.84 / 14.68 / 11.15 / 11.06 | 20.58 / 23.34 / 19.27 / 17.90 | 10.3 / 18.4 / 10.3 / 11.2 % | 1.8 / 3.2 / 1.3 / 1.2 % |

| Chapter IV (FFX-2) | p50 | p95 | p99 | over 8.33 ms | over 16.7 ms |
|---|---|---|---|---|---|
| playtest-1022 (job A2) | 5.77 | 9.66 | 13.46 | 8.3 % | 0.44 % |
| r63-int, `?pack=demo&pro=off` (job A3) | 5.62 | 9.62 | 14.53 | 8.1 % | 0.68 % |
| **r63-int, everything on** (job A3) | **5.07** | **9.72** | **13.58** | **10.3 %** | **0.57 %** |
| interleaved, a busier moment (job A9): playtest-1022 / on / playtest-1022 / on | 6.58 / 6.32 / 6.21 / 6.27 | 15.07 / 13.71 / 11.59 / 11.77 | 23.23 / 20.66 / 17.60 / 18.01 | 24.0 / 20.1 / 14.1 / 13.8 % | 3.6 / 2.3 / 1.3 / 1.3 % |

Reading: with every lane flipped off the build costs the same as playtest-1022 (both chapters). With everything on, **Chapter IV costs the same as playtest-1022 within the run-to-run spread** (p95 9.7 against 9.7; 11.8 against 11.6 in the interleaved pair). **Chapter I with everything on costs more**: p50 about +1 to +2.4 ms, p95 about +4.5 ms in the quiet jobs, and 10.5 to 11.7 % of frames over the 8.33 ms budget of a 120 Hz display against 2.4 to 3.8 % for playtest-1022 (the busier interleaved pair: 11.2 to 18.4 % against 10.3 %). Neither build holds 120 Hz on every frame in this harness (playtest-1022 included); at 60 Hz both hold all but about 0.5 to 1 % of frames in the quiet jobs (p99 15.6 to 17.0 ms for Chapter I with everything on against 12.1 to 12.3 for playtest-1022). Which lane adds the Chapter I cost was tried (each lane alone, jobs A5 and A6) and is NOT claimed: those runs came out non-monotonic on the shared machine (the staging lane alone cost more than all three together). If the booth monitor shows judder in Chapter I, the first things to flip are `/` (the look) and `;` (the camera's soft background), one at a time.

## The production build for tonight's playtest

`node tools/candidate-build.mjs --out dist-r63-play` (release 62 stamp, base `/`, the host the deploy builds for) from this tree: **`D:/pyrefly-continuity/dist-r63-play`** (about 11 GB: the art is 10.9 GB of it; bundle `assets/index-Cri9g1P6.js`). The tool's own checks pass: index.html loads `/assets/index-*.js`, `public/fx` intact (the first build, made before the depth plates were restored into this tree, failed that check and was replaced), art manifest current. Serve it with `node tools/candidate-build.mjs --serve --out dist-r63-play --port <port>` (a `vite preview` with the base set; stop it by the pid it prints). Quick headless load of that dist served on :5371 (stopped, port closed afterwards; `evidence/dist/dist.json`, `distload.mjs`): the title, the picker, Chapter I and Chapter IV by keyboard to the first menu with `?demo=1&pack=demo&coach=off`, both ready, the page title "Echoes of Spira", the look, camera and staging all on, **0 console errors, 0 failed requests**, no warning. The address for the test: `?demo=1&pack=demo&switchboard=1` (the key `8`, Tidus T1 / T2, needs the dev art server and says so on a production build). Not deployed.

## Not done / for the driver

- **The aeon victory.** When an aeon lands the last blow in Chapter I (`ch1-win`: Ifrit's Meteor Strike) the party is off stage and the camera's victory close-up (of the last party member to act) frames an empty field with the aeon on it. That is the camera lane's victory shot meeting an existing state, not a merge effect; not changed.
- **The pad bot** (the game's `intended` strategy) summons aeons freely: Chapter I's defeat by pad was not reached, so the steered plan was used (stated above); Total Annihilation only in the steered runs; Mega Flare in the pad flow only in the defeat run.
- **Frame cost**: see the table; attribution to a single lane was attempted and is not claimed (the per-lane runs came out non-monotonic on a shared machine).
- **Not run**: the 1920x1080 and 1280x720 sizes (each lane checked them), an ultrawide, a real display at 120 Hz, anything audible (the audio lane is separate), the party rigs on (`.`, off in playtest-1022 too), REDUCE MOTION and REDUCE FLASHES in the integrated build (each lane checked its own), a touch screen.
- **The art**: `public/art` points to the test mirror `D:/pyrefly-art-motion` (the repaint lane is rewriting it); the Bahamut cut-out shards at the right wing (staging lane, gap G20) and the boss re-cut belong to the matte lane. `public/fx` (the depth plates, gitignored) was restored from `D:/Tools/pyrefly-art-backup/fx` into this tree; the first production build was made without it (the tool's own check failed) and rebuilt with it, and the first Chapter I pad run (`ch1-win`) ran before the restore (its one console warning, `[fx-b] depth plates unavailable`, is that); every later run has the plates and no warning.
- **Open for Bailey, left by the lanes and unchanged here**: the FFX-2 menu rule leaves a girl in a menu with only the name, ring and core of the breath (staging); A-13 (-4 degrees on every attack) is off while the camera is on (camera); the Settings rows for Danger pulse and Damage Numbers (look; a save-schema change, the save-data class).
- NOW.md is not edited (shared; others have it modified): the driver records the release.

## Files of this lane

`src/engine/BattlePresenterSettle.ts` (new), `src/engine/fx/c/SpectacleTypes.ts` (new), `src/engine/motion/DemoGate.ts` (`proLanes`), `src/engine/look/pro/ProSwitch.ts`, `src/engine/procam/ProCamSwitch.ts`, `src/engine/pro/staging/StagingSwitch.ts` (read `?pro=`), `src/app/demo/switchboard.ts`, `switchboardModel.ts` (legend, plain words), `BattlePresenterBeats.ts`, `fx/c/SpectacleFx.ts`, `BattlePresenter.ts` (import), `tests/unit/engine/r63-int-switches.test.ts` (new), `demo-motion-int.test.ts` (key pin), `docs/CONTRACT-CHANGES.md`, `docs/handoff/r63-int.md`, `docs/screenshots/r63-int/`.
