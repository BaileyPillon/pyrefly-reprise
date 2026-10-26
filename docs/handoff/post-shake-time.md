# post-shake-time: the camera shake and the impact frame keep time on 120 and 144 Hz screens, in every chapter

Branch `post-shake-time`, from `origin/main` `acbd815d3` (release 64 plus records). Lane of the post-conference motion plan (`D:/Tools/pyrefly-scratch/2026-10-26/motion-plan/MOTION-PLAN.md`, "Step 5" there, "Step 6" in the lane brief). Written 2026-10-26.
Authority: Bailey, 2026-10-26 ~13:30 EDT, "booth is over, start the post-conference plan, keep going please", and 2026-10-25 ~23:45 EDT, "i'll go with all your recommendations and i delegate all decision making to you for now". The default flip is the driver's call under that delegation, his to overturn (`?timing=frames` is the way back, one line in `FeelSwitch.timingByTime` is the other).
Nothing deployed. Nothing perceivable at 60 Hz changed, with the one exception named below.

**Game case: both games (shared presentation plumbing; rule 14).** The camera shake (`BattleCamera`) and the option-C impact frame (`SpectacleImpact.ImpactFrames`) are the same code in FFX and FFX-2 chapters; the sources give no frame counts for either (`research/` has none), so there is no per-game difference to keep. Chapters I (`seymour-flux`, FFX) and IV (`ffx2-bahamut`, FFX-2) already ran this way since release 62's pack; this makes the other 17 the same (FFX: Chapter II, Yunalesca, Chapter III, Braska's Final Aeon, and the later FFX chapters; FFX-2: Chapter V, Vegnagun and Shuyin, Chapter VI, Leblanc, and the later FFX-2 chapters).

## What changed

- `src/engine/feel/FeelSwitch.ts`: `timingByTime()` answered `false` outside Chapter I and Chapter IV (and `false` there under `?pack=off`). It now answers `true` in every chapter, with the pack or without it, with nothing named. `?timing=frames` (new) and `?timing=today` (older) are the off words, `?timing=time` still turns it on, `feelConfigured().timing` and `__pyrefly.timing(on?)` follow. 3 lines of logic, the rest is comments.
- `src/engine/feel/TimeBased.ts`, `src/engine/fx/c/SpectacleImpact.ts`, `src/debug/feelApi.ts`: comments only (they read the switch exactly as before).
- `src/engine/BattleCamera.ts` is NOT touched (399 lines, a CHK-027 file).
- `docs/CONTRACT-CHANGES.md`: an entry (no contract file changed; the entry records the declared change of default).
- Tests: `tests/unit/feel-120hz.test.ts` (21, was 16) and `tests/unit/feel-switch.test.ts` (9). New: the same shake lasts the same wall time (within 5 percent) and runs at the same rate (54 rad/s) at 60, 120 and 144 Hz in seven chapter states (both demo chapters, four others, none named) under four addresses; the camera is in the same place at the 12 shared times at 60 and 144 Hz in Chapters II and V; the impact frame is 33 ms at all three rates in every chapter; **at an exact 60 Hz the default and `?timing=frames` put the camera in the same place on every frame of a shake (to 1e-9)**; Chapter I and IV answer what they answered in release 64. Mutation check: with the default put back to `false`, 11 of the 30 tests in the two files fail (7 in `feel-120hz`, 4 in `feel-switch`).

## What a player sees

- **60 Hz: nothing, with one exception.** The shake's phase now advances with the field clock's `dt`. A hit-stop holds that clock (`dt` 0), so the camera stands still through the hold (today's other chapters kept jittering the camera for the 2 to 3 frames of a 28 to 40 ms hold while the picture was frozen; Chapter I and IV have not since release 62). Pinned in the new test. It is a hold of the same length as the freeze and arguably what a hit-stop means; it is also the only 60 Hz difference, so it is named here and in the CHANGELOG line below, for Bailey to overturn with `?timing=frames` or by saying so.
- **120 and 144 Hz:** the shake is 54 rad/s, not 108 and 129.6, and the camera is where a 60 Hz screen puts it at every shared moment (it was 7 to 25 px off); the impact frame is 33 ms, not 17 and 14.
- **`?pack=off` in Chapter I and IV** (release 62's play) keeps the real-time shake now; `?timing=frames` is the A/B word at 120 Hz and above. Every other address a player uses in those two chapters is unchanged (the differential below).
- Phones and tablets (where the pack's default is off) now get the same real-time shake as desktops; their rate (60 Hz mostly, 120 Hz on newer ones) only ever gains.

## Proof

All from this tree, real build in headless GPU Chromium 1600 x 900 on Vite :5603 (stopped by PID), one `RIG-RECORD` hold, `?rig=on&crisp=a2&coach=off&wait=hold`, reached by real key presses to the chapter's first command menu. The real `BattleCamera` is shaken with the amplitude and length the presenter really uses (0.10/340, 0.16/340 for a critical, 0.20/520 for a big blow; `BattlePresenterBeats.ts` 177 and 290) and the real spectacle takes one heavy critical first blow (the ink-and-paper frame); the whole app is then stepped as whole frames of exactly 1/60, 1/120 and 1/144 s with `__pyrefly.simStep` (a fixed step, so the "monitor" is exact and the same for every case). Script `D:/Tools/pyrefly-scratch/2026-10-26/batch1/post-shake-time/job-hz.mjs`; raw `evidence-run2.json`, table `summary-run2.json` (from `summarize.mjs`), log `job-run2.log`.

### Chapter II (FFX) and Chapter V (FFX-2), before (`?timing=frames`, which is release 64's code path in these chapters: confirmed below by running release 64's own `FeelSwitch.ts`, 18 shake and 6 impact runs identical) and after (default); the two chapters give the same numbers

| | 60 Hz | 120 Hz | 144 Hz |
|---|---|---|---|
| shake phase rate, before | 54.0 rad/s | 108.0 | 129.6 |
| shake phase rate, **after** | 54.0 | **54.0** | **54.0** |
| shake spent (the camera's own clock, 0.10/340), before and after | 350.0 ms | 341.7 ms | 340.3 ms |
| the same, 0.20/520 | 533.3 ms | 525.0 ms | 520.8 ms |
| spent vs 60 Hz (a 60 Hz frame is 16.7 ms: the 60 Hz figure is the next frame after 340) | 0 | 2.4 % / 1.6 % | 2.8 % / 2.3 % |
| camera vs 60 Hz at the 12 shared times k/12 s (0.10 / 0.16 / 0.20), before | 0 | 6.8 / 10.9 / 16.9 px | 7.0 / 11.3 / 25.0 px |
| camera vs 60 Hz at the 12 shared times, **after** | 0 | **0.00 px** | **0.00 px** |
| impact frame (2 levels), before | 2 frames = 33.3 ms | 2 = 16.7 ms (-50 %) | 2 = 13.9 ms (-58 %) |
| impact frame, **after** | 2 = 33.3 ms | **4 = 33.3 ms** | **5 = 34.7 ms (+4.2 %)** |

The within-5-percent requirement: the shake lasts the same wall time (largest difference 2.8 percent, one 60 Hz frame of rounding), runs at the same rate (0.0 percent), and the impact frame lasts the same (0.0 and 4.2 percent; it is a whole number of drawn frames, never fewer than 2). What does NOT hold to 5 percent is a threshold-based "last visible frame" (the last frame the camera is more than 0.002 world units, 0.3 px, off its rest place): it reads 266.7 / 291.7 / 291.7 ms at 60 / 120 / 144 Hz for the 0.10 shake. That is the 60 Hz screen's sampling of a 23 and 33 Hz oscillation (it cannot draw the tail), not a difference in the shake: the camera's positions at the shared times are identical to 0.00 px.

### Chapter I (FFX) and Chapter IV (FFX-2): unchanged

- The same numbers as above in the "after" rows, and identical, number for number across all 18 shake runs and 6 impact runs, between the default address and release 64's own words (`?pack=demo&timing=time`): `evidence-run2.json` cases `seymour-flux:default` against `seymour-flux:r64pack`, `ffx2-bahamut:default` against `ffx2-bahamut:r64pack`. The instrument can tell the difference: `:frames` reads 108 and 129.6 rad/s and 16.7 and 13.9 ms. Release 64's own recorded numbers for Chapter I with the pack (`docs/handoff/motion-feel.md`, "The real game, headless": impact 2 = 33.3 ms at 60 Hz and 5 = 34.7 ms at 144 Hz; 54.0 and 53.8 rad/s) are the same.
- **Direct before, release 64's own `FeelSwitch.ts` in the real app (Chapters I and IV):** `git show origin/main:src/engine/feel/FeelSwitch.ts` was put into this tree for one job, only while the job held the `RIG-RECORD` line (`SWAP_R64=1 node job-hz.mjs r64file ...`, the lane's file put back before the line was released and checked identical with `cmp`), and the same 10 steps were run at the default address. Against this branch's default: **18 shake runs and 6 impact runs identical, number for number**, both chapters (`evidence-r64file.json` against `evidence-run2.json`, `compare.mjs`); 0 console errors, 0 failed requests.
- **Differential of the switch logic** (`evidence-differential.json`: release 64's `FeelSwitch.ts` from `origin/main` against the new one, 11 addresses x all 19 chapter ids and no chapter, 220 answers): Chapters I and IV give the same answer in 14 of 22 combinations, including nothing named, `?pack=demo`, `?pack=demo&timing=time`, `?timing=time`, `?timing=today` and `?pack=demo&timing=today`. The 8 that differ: nothing-named with no page at all (a unit test: false to true), `?pack=off` (false to true, named above), and the new off word `?timing=frames` and `?pack=demo&timing=frames` (true to false). Every one of the 17 other chapters, and none named, changes from false to true on every address that does not name a timing off word (116 of 220 answers change in all, all of them these).

- **Direct before for Chapters II and V:** the same swap (`SWAP_R64=1 node job-hz.mjs r64fileB yunalesca:default,ffx2-vegnagun-shuyin:default`, `evidence-r64fileB.json`, `job-r64fileB.log`) puts release 64's own `FeelSwitch.ts` in and reads the default address: against this branch's `:frames` rows, **18 shake runs and 6 impact runs identical, number for number** (108 and 129.6 rad/s, 16.7 and 13.9 ms), so the "before" columns are release 64's own behaviour, not a flag's stand-in for it. (The first attempt at this job, `job-r64file2.log`, reached Chapters I and IV and then timed out loading Chapter II's page after 240 s under load; its two finished cases are the ones compared above.)

### Code checks

`npx tsc --noEmit` clean (run again on the committed tree: 0 lines). The 85 test files that mention the shake, the camera, the impact frame or the feel switches (1,215 tests) pass (`vitest-camera-set.log`), then `feel-120hz` (21) and `feel-switch` (9) again after the last edit. `critic-plan --paths` for these files: DEEP review owed on the build as a whole (75 checkpoints since the last deep review, as for every candidate); CHK-026 and CHK-027 are named because `BattleCamera.ts` is a CHK-027 file, but it is not changed here, so a focused pass of the changed area is all this lane adds. The full `npm test` was NOT completed: started twice, the first run spent its 9 minutes on 4 of the 34 `*bench*` files (3 to 8 minutes each; they import only `src/battle` and `src/data`, never `engine/feel`), the second (`--exclude "**/*bench*"`) did 77 files in 9 minutes while other lanes held the machine, and both were stopped by PID; nothing failed in either (`vitest-full.log`, `vitest-nobench.log`). No new module (`orphans` unaffected), no file near 400 lines (FeelSwitch 198, feel-120hz test 370).

## CHANGELOG line (owed at the cut: the file lists builds that went live, and `live-record` reads its release headings, so it is not edited on a branch)

- **Both games (every chapter): the camera shake and the impact frame keep time on a 120 or 144 Hz screen.** They were counted in drawn frames, so on a fast screen the shake ran about twice as fast (108 or 130 radians a second against 54) and the ink-and-paper frame lasted 17 or 14 ms instead of 33. Both run on real time in every chapter now (Chapters I and IV already did). At 60 Hz it is the same, except that the camera now holds still through a hit-stop instead of shaking while the picture is frozen. `?timing=frames` brings the old count back.

## What remains

1. **Bailey's eyes (plan step 5): a 144 Hz and a 60 Hz clip of one big hit side by side.** Not made in this lane (it needs a real or a virtual 144 Hz recording; the proof above is numeric on the real app). At 60 Hz nothing changes except the hit-stop hold, so only a 120 Hz or faster viewer notices; the booth monitor rule is his (176e: "120 Hz or higher, motion right above 60").
2. The hit-stop hold at 60 Hz in the 17 other chapters (above) is the one thing to confirm or overturn. If he wants the old jitter-through-the-freeze back at 60 Hz, `timingByTime` could keep the frame count only for `dt` of 0, but that cannot be made rate-independent (a hold of 40 ms is 3 frames at 60 Hz and 6 at 144 Hz); the honest choices are "holds still" (this) or `?timing=frames`.
3. A focused review with CHK-026/027 before the cut, and the CHANGELOG line above. No real 144 Hz display was used; `simStep` is exact frames, not a monitor.
4. Other counted-in-frames pieces were not found by this lane (the F1 survey of `src/engine`, `src/app` and `src/ui` found these two); the actor shakes (`PaintedActor.shake`) run on `dt` already.
