# Handoff: eye-candy D, shippable (track `eye-candy-d`, 2026-09-30)

Branch `fx-d` in `D:/pyrefly-r29-plate` (merged with origin/main at `122015f4`). **Not pushed, not merged into main,
not deployed.** Game case: **both** (FFX gold and calm, FFX-2 pink and quick; FF7 never draws it).

Bailey, 2026-09-29 ~21:00 EDT: "I'll go with all of your recommendations please" (eye candy = option D, after the
judge's must-fix list). ~23:45 EDT: "Ok yes I picked D so all 3 together however in the settings I want to be able
to turn each one off. Default will be on. Please."

## What is built

1. **D is the default look.** No `?fx` = A + B + C; `?fx=off` = today's look for comparison and tests; every part
   keeps its sub-switch (`?fxsub=-id`). `src/engine/fx/EyeCandy.ts`.
2. **The judge's must-fix list**, each proven by a before/after capture with numbers:
   `docs/concepts/eye-candy-2026-09-29/d-final/fixes/` and `d-final/README.md`. Tuning only (dials, room specs, one
   render order, one CSS rule); no new effect and no painting touched.
3. **Comfort.** REDUCE MOTION: no drift, sway, hit-stop, kicks, shake, victory orbit or ink impact frame; light and
   weather stay (weather held still). LOW EFFECTS: the lighter tier (30 % particles, no reflections, no heat haze,
   no lens flare, no spell layers). The flags reach the fx at boot (`src/app/fxEnv.ts`, `main.ts`), not only
   through the debug API.
4. **Three OPTIONS rows**, CINEMA LIGHT (A), LIVING PAINTINGS (B), BATTLE SPECTACLE (C), default ON, live, saved.
   `src/app/fxLooks.ts` (fields, coercion, row list), `Settings extends FxLookSettings` (`SaveData.ts`, no growth),
   `migrateComfort` coerces, `applyComfort` -> `eyeCandy.applyLooks` switches the look on every settings write,
   `PauseScreenPanels.optionRows`, `pause/settings.ts`, `pause/panels.ts` (FF7 drops the rows),
   `ui/common/pause-labels.css` (key cell +6 % and a scrolling settings column on desktop). C is attached whenever
   the row can switch it this page load (`battleSpectacle.ts`), so it turns on mid-fight too.
5. **Derived files out of git.** `public/fx/` gitignored; `tools/fx/fx-assets.json` + `tools/fx-assets.mjs`
   (record / verify / backup / restore / ensure); backup `D:/Tools/pyrefly-art-backup/fx` verified; predev and
   prebuild `ensure --warn`; `tools/deploy-pages.mjs` `ensure` strictly and verifies `dist-release/fx`;
   `tools/deploy-classify.mjs` treats `public/fx/**` as noise like `public/art/**`.

## Evidence

- Target vs build: `d-final/target-vs-build-*.jpg` (options-page D frame | final build, four chapters, seven
  moments), `target-vs-build-phone.jpg`, `options-target-vs-build-*.jpg` (the approved A2 frame | the build with
  the three rows; the rows had no mockup of their own).
- 18/18 chapters load and reach a player turn with D on, desktop and phone, 0 console errors.
- Perf gate: all eight gated runs pass (desktop p95 16.7 to 16.8, phone 16.8, ON - OFF <= 0.1); uncapped desktop
  combat p95 1.2 to 2.8 ms ON vs 1.1 to 1.7 OFF. Measured under a concurrent ComfyUI render; the first phone runs of
  Chapters I, IV and VII failed under that load (IV: ON 316.7 ms vs OFF 16.7) and passed on repeat.
- Real input: keys, mouse and taps on the rows at 1600x900 and 390x844, persistence across a reload, live on and
  off mid-fight (`rows-check.json`, `live-c.json`); screenshots `docs/screenshots/picks-0929/eye-candy-d/`.
- `npx tsc --noEmit` clean; `node tools/orphans.mjs` (no new orphan); new tests `save-fx-looks.test.ts` (release-29,
  -30, -31a fixtures), `pause-fx-looks-rows.test.ts`, `fx-d-default.test.ts`; full suite run (see "Not done").

## Release path (critic-plan)

**Save-data class: DEEP review of the production candidate before deploy** (`docs/plans/eye-candy-d-review.md`
section 7). Then live verification.

## Not done / open

- **History carries the depth maps.** Earlier `fx-d` commits (the options round) added `public/fx/*/depth.png`;
  this track untracked them, but a normal merge of `fx-d` into main would still publish those blobs in the public
  repo's history. Merge with `git merge --squash fx-d` (or equivalent) if they must never reach GitHub. The driver
  decides; nothing here rewrites history.
- A clean perf re-run with the GPU idle, and a real phone GPU, are owed.
- The full suite was run twice (once over the one-run budget, to list the failures). Its three eye-candy failures
  were fixed (`battle-screen-teardown`, `pause-remake` PR-0098); `strategy-ffx2-bahamut` timed out under load in
  the full run and passes alone. The full suite was not re-run after the fixes; the 56 affected files pass.
- The per-row help line: the approved A2 frame shows none on any row, so none was built (question for Bailey).
- `docs/target/targets.json` was not updated (no tile for eye candy D yet).

## CHECK (independent, 2026-09-30; checker did not build it)

Candidate: `fx-d` at `ca3ac6e6`, fresh production build (`vite build` to scratch, served on 9031, headless Playwright
on the GPU, stopped after). Game case checked: both (FFX Chapters I, VII; FFX-2 Chapters IV, XVI; all 18 in the loop).

**Holds (measured, not taken from the report):**
- D is the default: no param = A+B+C on; `?fx=off` = all off; `?fx=a` = A only. With the three rows OFF in the save,
  no param draws nothing of D and `?fx=d` turns all three on (the URL wins for that load).
- Rows by real input: desktop 1600x900 in Chapters I and IV (ArrowDown to CINEMA LIGHT, Enter, Left, Right on
  LIVING PAINTINGS, mouse clicks), phone 390x844 taps on all three: each press flips the save field and the live
  look the same frame; REDUCE MOTION and LOW EFFECTS still flip (tier -> low, RM flag set). Reload keeps every value.
  The save diff across the session is only the touched settings, `updatedAt` and play time.
- A look OFF draws nothing of it: rows-off load vs `?fx=off` load differ by the same noise as two `?fx=off` loads
  (mean abs 5.7-6.4 vs 6.0-7.3); ON differs by 13-18. A live toggle-off mid-fight reads as the plain look by eye.
- Comfort over a whole Chapter XVI fight: REDUCE MOTION gives 0 impact frames, trauma 0, one drift value (74 with it
  off); at normal speed 0 hit-stops (the one freeze seen at fast speed came from the opening hits before the row was
  switched). LOW EFFECTS: tier low, 1 lamp, no haze, no arcs, spell layers 1 vs 11-15.
- 18/18 chapters reach a player turn with D on, 0 console errors.
- Perf (vsync; note ComfyUI was rendering, GPU 84 %): desktop p95 16.7-16.8 ms, ON - OFF <= 0.1 ms; phone tier
  under 4x CPU throttle p95 16.8 ms; uncapped desktop p95 1.6-2.9 ms ON vs 0.7-1.9 OFF. Gate passes.
- `npx tsc --noEmit` clean; the 10 eye-candy / pause / save test files 153/153; orphans 24, no new one;
  `git merge-tree` against origin/main 888a7578 clean; `src/battle` and `src/data` untouched; `BattlePresenter*.ts`
  import only the no-DOM, no-three `presenterHooks.ts`; no CONTRACTS file touched.
- Target vs build sheets (four chapters, seven moments, phone) track the options-page D frames; the must-fix areas
  read as fixed (Bahamut readable under Mega Flare, splash title clear of CHARGING).

**Findings:**
- BLOCKER (rule 7): files already over 400 lines grew on the branch: `BattleScreen.ts` 957 -> 970,
  `BattlePresenterStage.ts` 861 -> 863, `BattlePresenterPorts.ts` 472 -> 474, `debug/api.ts` 482 -> 484,
  `Backdrop.ts` 495 -> 496, `tests/unit/pause-remake.test.ts` 1045 -> 1049. Most came in with the options-round
  merges, but this is the candidate for main. Cheap fix: move the eye-candy wiring into a `battleEyeCandy.ts` helper
  and trim the others back to their main line counts.
- MAJOR (repo hygiene, rule 8 spirit): earlier `fx-d` commits carry `public/fx/*/depth.png` (derived from the
  paintings) in history; a normal merge publishes them in the public repo. Merge with `--squash` (the handoff says so).
- MINOR: the full suite once: 681 files pass, 1 fails: `strategy-ffx2-bahamut` "heal-only route" times out (15.3 s
  alone here, 19.6 s on main too). Already failing on main, not caused by this branch; the "passes alone" note
  above does not reproduce on this machine tonight.
- MINOR: `options-target-vs-build-desk.jpg` puts the FFX A2 target beside an FFX-2 build; the FFX build
  (checker shot) matches the A2 style row for row. FFX-2's desktop settings column now scrolls, so STRATEGY GUIDE
  sits cut at the column foot at rest: a departure from A2 with a written reason (14 rows).
- MINOR: no per-row help text, which the brief asked for; the A2 frame shows none, so it follows the mockup (open
  question for Bailey, written above).
- MINOR: stale comments still say "`?fx=c` only" / "`?fx=b`" in `BattleScreen.ts` and `BattlePresenterPorts.ts`.

Verdict: one blocker (rule 7 line growth). Everything Bailey will see behaves as the brief says. Deploy path
unchanged: save-data class, deep review before deploy.

## REPAIR (rule 7: files over 400 lines must not grow), 2026-09-30

Game case: both (shared plumbing; no presentation or engine behaviour changed). The independent check found six
already-over-400 files that grew on fx-d against origin/main; every one is now at or below its origin/main length.

| File | origin/main | before | now | How |
|---|---|---|---|---|
| `src/app/screens/BattleScreen.ts` | 957 | 970 | 920 | the stall watchdog (`checkForStall`, its two fields and `STALL_LIMIT_MS`) moved verbatim into the new `BattleScreenStall.ts` (`StallWatch`); the screen keeps a 15-line delegate, so the eye-candy hooks fit with room to spare |
| `src/engine/BattlePresenterStage.ts` | 861 | 863 | 861 | the optional `fx` port is declared by module augmentation in `engine/fx/c/presenterHooks.ts`, not in the class file |
| `src/engine/BattlePresenterPorts.ts` | 472 | 474 | 472 | same augmentation for `BattleStage.fx` |
| `src/debug/api.ts` | 482 | 484 | 482 | `installFxDebug` is called from `main.ts` right after `installDebugApi` (which returns the api object), not from inside it |
| `src/engine/Backdrop.ts` | 495 | 496 | 495 | the plate registration (`fxRef`, the reference camera) rides on the painting mesh's `userData` in the same statement that names it (`Object.assign`); `DepthPlates.plateGeometry` reads it from the mesh |
| `tests/unit/pause-remake.test.ts` | 1045 | 1049 | 1045 | the row-order test filters out the `fx*` rows (their order is pinned by `pause-fx-looks-rows.test.ts`) instead of listing them |

Proof: `git diff --name-only origin/main` over `src`, `tests` and `tools` lists no file over 400 lines that is longer than on
origin/main (the only new files over 400 are JSON captions and the concept sheet's index, not source). `npx tsc --noEmit`
clean; 15 vitest files pass (257 tests): the eye-candy set (`eyecandy-flags`, `fx-b-living`, `fx-c-spectacle`, `fx-d-balance`,
`fx-d-default`, `look-lut`), the OPTIONS rows (`pause-fx-looks-rows`, `pause-remake`), the saves (`save-fx-looks`,
`save-comfort-migration`, `save-upgrade-fixture`, `save-two-tabs`), `flow-encounter-chain` (the watchdog's home),
`backdrop-palette-ground`, `presenter-spellfx`. `node tools/orphans.mjs` lists no new module.

Real-key run, Chapter I (Seymour Flux), 1600x900, headless GPU Chromium, seed 7, Attack spammed by Enter for 21 presses
(`docs/concepts/eye-candy-2026-09-29/d-final/repair/realkey-ch1.json`, frames `ch1-*`): default look (all three options on,
tier full, plates built, Spectacle hitting) and `?fx=off` (all off) both reach turn 11 with 58 events played and the same
outcome, so the engine is untouched; 0 page errors and 0 console errors in both.

Performance gate (Chapter IV, 390x844, 4x CPU): STILL OWED. The GPU was at 81 to 94 percent (ComfyUI rendering) on three
readings over a minute, above the 20 percent bar. No frame time in this repair is a measurement. Nothing on the per-frame
path changed (the moved code is verbatim), so the earlier numbers in `d-final/perf.json` still describe the build.

## RE-CHECK (independent, 2026-09-30; the checker did not build the repair)

Candidate: `fx-d` at `521df69b`, fresh production build (`npm run build` in this worktree, `vite preview` on 9050, headless
Playwright on the GPU, server stopped by PID). Game case: both (shared plumbing). GPU was 78-85 % (ComfyUI), so timing is not judged here.

- Rule 7 holds: no file over 400 lines grew against origin/main (`BattleScreen.ts` 920 vs 957, `SaveData.ts`, `Backdrop.ts`,
  `pause-remake.test.ts`, `deploy-pages.mjs` equal; `BattlePresenterStage.ts` 861, `BattlePresenterPorts.ts` 472, `debug/api.ts` 482
  equal). The repair claim table is accurate.
- `npx tsc --noEmit` clean. `git merge-tree` against origin/main (888a7578) clean. `src/battle` untouched.
- Real keys, 1600x900, Chapter I, seed 7, default look and `?fx=off`: both turn 11, 58 events, 21 presses, same outcome, 0 page and 0 console errors
  (matches the builder's numbers exactly).
- Real keys, 390x844, Chapter IV (ffx2-bahamut), default and `?fx=off`: 59 and 56 presses, 0 errors either way; the phone frame reads correctly.
- Full suite (once, plus one accidental repeat): 681 files pass, 1 fails: `strategy-ffx2-bahamut` heal-only route times out at 15 s
  under load; passes alone (19/19) and the same test was already flaky on main; no engine file changed.
- Not re-run: the phone-tier performance gate (GPU busy); still owed, nothing on the per-frame path changed in the repair.
- Still open from the CHECK: squash-merge only (public depth PNGs in history); stale `?fx=c` comments; no per-row help text (follows the A2 mockup).

Verdict: the blocker is resolved; no new blocker.
