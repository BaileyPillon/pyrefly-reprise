# post-flicker: the ready, idle, ready flicker in Chapter IV (FFX-2 only)

Branch `post-flicker` (from `origin/main` `acbd815d3`, release 64 plus records), 2026-10-26, step 2 of the post-conference motion plan
(`D:/Tools/pyrefly-scratch/2026-10-26/motion-plan/MOTION-PLAN.md` "Step 1: the ready-idle-ready flicker"; backlog M-07, PR-0379; method check
`docs/plans/pose-continuity-method-check.md` on `plans-pose-continuity`). Authority: Bailey, 2026-10-25 ~23:45 EDT, "i'll go with all your recommendations and i delegate
all decision making to you for now"; 2026-10-26 ~13:30 "booth is over, start the post-conference plan, keep going please". Nothing deployed, nothing on the live site or the booth copy.

**Game case (rule 14): FFX-2 only.** FFX is untouched by construction: its turn start is a burst of its own, before the command menu, with no action behind it, and the new helper
returns false unless the presenter is playing an ATB battle (`ctx.moments.shots.ffx2Framing`, set from the engine) and the figure is on the party's side. Sources: `research/ffx2-combat-core.md`
section 1 for the ATB and the run-in; the waiting stance itself is not sourced in `research/` and is not touched (rule 6): which painting shows while a girl waits stays as it was.

## What was wrong (traced by running the real engine, rule 3)

A girl about to attack from her menu showed `ready`, then `idle` for about a tenth of a second, then `ready` again, then lunged. 22 times in the 6.3 minutes of release 64's Chapter IV
(21 of the 22 end in `ready` to `attack`, one in a KO), 295 of the chapter's 931 see-through frames (32 percent).

The path, with the real `FFX2Engine`, chapter 4 data and the real presenter (`tests/unit/ffx2-ready-hold.test.ts`, the same run printed `ready:rikku@104022, idle:rikku@104122, ready:rikku@104212, follow` before the change):

1. `BattlePresenter.chooseCommand` puts the girl on `ready` while her menu is open.
2. Her answer is `FFX2Engine.submit`, which emits one burst: `beginTurn` (`turn-start`), then `performCommand` (`action-start`, the damage events, `action-end`).
3. `BattlePresenterBeats.turnStart` did `setPose('idle')` and slept `TIMING.turnStart` (90 ms; the 98 to 101 ms between the two swaps in the harness is that plus a frame).
4. `BattlePresenterBeats.actionStart` did `setPose(windUp ? 'ready' : pose)`: for an attack with a painted `ready` the wind-up leads, so `ready` went back up.

Why the harness said "damage": the engine emits the whole burst at once when the command is submitted, so the log stamps `turn-start`, `action-start` and the first `damage` on the same frame, and
`causeOf` (the nearest event that moves a figure, within 90 frames) picks the damage that follows the turn start in the same burst. The swap's real cause is the turn-start beat.
FFX has no such triple (its closest ready, idle, ready pair in Chapter I is 3.3 s apart: two real turns).

## What changed

- `src/engine/KeyPoses.ts`: new `readyCarriesIntoWindUp(ctx, actorId)`: true when the presenter is playing an ATB battle, the figure is a party figure showing `ready`, the very next event of the burst is
  her own `action-start`, and that action opens on the wind-up painting. **Review round (m4):** that last test is now `windUpOpens(ctx, event, pose)` (no port owns the wind-up, and `windUpLeads`), **one function that
  `actionStart` also calls**, so the hold and the wind-up cannot drift apart. **Review round (m3):** it answers false under `?motion=classic` (the house comparison and safety word, `PoseSwap.motionMode`), so the old
  turn start (ready, idle, ready) can be put beside the new one in the browser; the word also brings back today's lunge and clock, as it always did. Also settable on a running page: `__pyrefly.motionMode('classic')`.
- `src/engine/BattlePresenterBeats.ts` (`turnStart`, one line): `if (!readyCarriesIntoWindUp(ctx, actorId)) ctx.stage.actor(actorId)?.setPose('idle')`. The 90 ms wait, the turn-start camera shot and
  everything else are as before. The file is 368 lines (was 368; the line is edited in place).
- `critic/runner/lib/continuity-flicker.mjs` (+ `.d.mts`): the flicker as a **named class of the harness** so it cannot come back unseen: a figure that shows A, B, A again within 300 ms for the pairs the
  class names (`ready>idle>ready` by default; `continuity.flicker.pairs` / `windowMs` in the policy may change them; the shipped policy has no such block). Both swaps carry a `flicker` tag in
  `continuity.json` and the summary gets `summary.flickers` {count, ghostFrames, share, perMinute, byPair, byFigure, medianGapMs}. **Reported, not gated** (no verdict reads it; a gate needs its own policy word,
  a RUBRIC line and Bailey's yes). Not every out-and-back is one: the second hit of a multi-hit blow (`hurt>idle>hurt`, 15 of them in Chapter I) and a rig's key pair are by design and are not counted.
  Wired in `continuity-analyze.mjs` (5 lines; `continuity.mjs`, which another lane is editing, is not touched).
- Tests: `tests/unit/ffx2-ready-hold.test.ts` (12: the beat on its own with every case that must NOT hold, `?motion=classic` bringing the old turn start back, the shared `windUpOpens` rule, and the real engine plus presenter reading the pose calls; with the hold switched off the two positive
  tests fail, with the classic line removed the classic test fails), `tests/unit/critic-continuity-flicker.test.ts` (11), `tests/unit/critic-continuity-analyze.test.ts` (+1: the summary block and the per-swap tag).

What stays as it was, deliberately: a girl who casts, uses an item, defends, or has no painted `ready` (the sequence is still `ready, idle, cast`, see "what remains"), REDUCE MOTION (no wind-up leads, so no hold), FFX, FF7, foes.

**One perceivable side effect, disclosed (the driver's call to keep).** Entering the `ready` life state plays a weight-shift step (`ActorLife` cue `step`: the small hop or leap of "their turn", 3 percent of her height, `PaintedActor.playCue`)
and eases the lean and the turn ring up. Before, the figure entered `ready` twice (menu, then the action's wind-up) and so stepped twice and dropped and re-raised the lean and ring in between; now it enters once,
at the menu, and the second step at the start of the action does not happen. The paintings, the timing of the attack, the follow-through and the way home are identical (the 60 Hz recording below has `attack` at +39 frames, `follow` at +48, `idle`
at +63 in both). The second step was an effect of the blip, not a designed beat, and the original step is the motion lane's own neutral weight shift ("the docs are silent"); if a second anticipation at the action's start is wanted it
should come back as a named beat, not as a side effect. The projected position in the recording is identical to 0.4 px in x and 0.2 px in y. **Quantified in the adversarial review (m2):** the hop is measured on the figure's inner offset; in Chapter IV the girl's lift peaks at 0.447 (Paine) and 0.453 (Rikku) world units before and 0.394 and 0.397 after, which is exactly 3 percent of the figure's height (0.03 x 1.82), the second step's leap: **the run-in's first hop is about 12 percent lower in Chapter IV, 7 to 16 px at 1600x900 at the top of the arc**; the apex frame (+14 to +16), the arc's shape, the timing and the sound are the same (the second leap's landing squash is 0.011, under the 0.2 landing-thud floor, so nothing audible changes). In Chapter V (curves off) the hop is identical before and after; only the blip and a small lean wobble go. Kept (the driver's call, the review's recommendation): the double step was a by-product of the blip, never a designed beat. `?motion=classic` shows the old sequence beside it.

## Numbers (the release tree's continuity harness, seed 1, 1600x900, pack on by default, headless GPU Chromium, real keys from the title)

How they were taken: the Vite dev server of this tree on :5602 (PNG art from the release 64 mirror `D:/pyrefly-art-r64`), not a production build (one build per lane, 30 GB free): the baseline of
the unchanged tree reproduces release 64's kept production run (below), so the tool and the route agree. Before and after were run on the same server, same code but for this change, one after the other;
the harness code is `origin/main`'s (the flicker class only adds a field). The ATB route runs in real time, so the Chapter IV runs are not the same fight (345 s and 382 s of battle); Chapter I (CTB) repeats almost exactly.

Chapter IV (FFX-2, Bahamut):

| | r64 kept run (production) | before (this tree, unchanged) | **after (the fix)** |
|---|---|---|---|
| battle time, swaps seen / counted | 379.1 s, 414 / 408 | 345.1 s, 389 / 384 | 382.3 s, 380 / 375 |
| **ghost frames per minute** | 147.3 (931 frames) | 153.5 (883) | **103.9 (662)** |
| flickers (ready, idle, ready within 300 ms) | 22 (295 frames, 32 percent) | 20 (268 frames, 30 percent) | **0** |
| ready/idle swaps (party), their ghost frames | 118, 514 | 113, 494 | 76, 232 |
| swaps a minute (counted) | 64.6 | 66.8 | 58.9 |
| snaps / planned hard cuts | 0 / 39 | 0 / 41 | 0 / 36 |
| worst ghost severity (fail line 0.40) | 0.342 | 0.342 | 0.342 |
| swap jerks (gated, 40 px or more), worst | 4 (1), 45 px | 4 (1), 44.9 px | 4 (1), 44.7 px (Rikku's staged twirl, as before) |
| head change over 3 percent / feet over tolerance | 0 / 0 | 0 / 0 | 0 / 0 |
| height outside its band | 1 (Yuna cast to idle, 1.1164) | 1 (same, 1.1188) | 2 (the same swap twice: 1.1163, 1.1168) |
| frames over 34 ms, longest | 1.8 percent, 1,154 ms | 1.9 percent, 136 ms | 2.2 percent, 147 ms |

The prediction (written before the run, `MOTION-PLAN.md`): 931 minus 295 frames, about 100.7 a minute, accept 105 or less. Landed: **103.9**. The same arithmetic on this tree's own baseline (883 minus 268 frames over its 5.75 minutes) gives 106.9;
the measured 103.9 sits under it. **Read it as a range, not against a hard 105 (adversarial review m1; three after runs now): about 102 to 111 a minute from about 154 (after 103.9, 110.7 and 102.1; before 153.5 and 154.5; release 64 kept 147.3).** The route is real-time ATB, so no two fights are the same fight (Yuna casts one more or one fewer; the fight is 346 to 382 s) and a single run moves by about plus or minus 5 percent. The stop rule is read as "the flicker class went and nothing else rose", and that holds in every run. The class table of the plan holds, so the next step (the ready paintings) goes ahead on the same table. Per figure, ghost frames: Paine 317 to 209, Rikku 337 to 203; Yuna 229 to 250 is route noise
(she casts, which this change does not touch; one more cast swap in a longer fight). "Height outside its band" is Yuna's cast pose against the 1.10 ceiling, the plan's cheap residue (its step 2), seen twice because she cast one more time; it is not this change.
CHK-026 and CHK-027 stay FAIL on the same two known reasons as release 64 (that residue; Rikku's staged twirl at 44.7 px).

Chapter I (FFX, Seymour Flux), the control: **unchanged**.

| | r64 kept | before | after |
|---|---|---|---|
| battle time, swaps seen / counted | 387.7 s, 374 / 334 | 389.3 s, 374 / 333 | 387.1 s, 374 / 334 |
| ghost frames per minute | 101.7 (657) | 100.5 (652) | **101.8 (657)** |
| ready/idle swaps, their ghost frames | 61, 236 | 61, 236 | 61, 236 |
| flickers | 0 | 0 | 0 |
| head over 3 percent / feet / height | 3 / 0 / 0 | 3 / 0 / 0 | 2 / 0 / 0 |

The 3 and 2 head swaps are Auron's close-up in the pro camera (the plan's step 3), a one-swap difference between two runs of the same route; the fix cannot reach FFX (`ffx2Framing` is false there; pinned by the test).

## Review round (2026-10-26 evening): the adversarial review said MERGE, and what was done with its four minors

The review (`D:/Tools/pyrefly-scratch/2026-10-26/batch1/post-flicker/review/REVIEW.md`, on 53c9bae08) found no critical and no major finding and four minors. It reproduced the fix on its own runs (Chapter IV 154.5 to 110.7 ghost frames a minute, 21 flickers to 0; Chapter I identical to release 64, 101.7), killed 7 of 7 mutants of the helper with this lane's tests, and ran 316 presenter-touching test files with 0 failures. This round, one commit on top of 53c9bae08:

| Finding | Done |
|---|---|
| m1, "accept 105 or less" is inside the run-to-run noise | Quote it as a range: **about 102 to 111 a minute from about 154** (three after runs, below). The handoff text, the prediction paragraph and `docs/plans/post-flicker-review.md` now say so, and read the stop rule as "the flicker class went to zero and no other class rose". |
| m2, the old second weight-shift step is gone (first hop 12 percent lower) | **Kept**, as the review recommends, and the number is carried: in Chapter IV the run-in's first hop is about 12 percent lower (3 percent of the figure's height, 7 to 16 px at 1600x900 at the top of the arc), apex frame, shape, timing and sound unchanged; Chapter V identical. In "What changed" below, and in the CHANGELOG line for the release that carries it. |
| m3, no off-word restores the old turn start | `readyCarriesIntoWindUp` answers false under `?motion=classic` (and `__pyrefly.motionMode('classic')` at runtime): the old sequence, ready, idle, ready, is back for a side-by-side. No new word. `PoseSwap.ts`'s header and the switch table in `docs/DEV.md` say so. Test added; deleting the line makes it fail. |
| m4, the wind-up rule exists twice | New `KeyPoses.windUpOpens(ctx, event, pose)` (no port owns the wind-up, and `windUpLeads`) is the one function `actionStart` and `readyCarriesIntoWindUp` both call; the file `BattlePresenterBeats.ts` stays at 368 lines. A test pins the rule. The preflight is still disclosed as written beside the build. |

**Re-measured on the final code** (the release tree's harness from this tree, seed 1, 1600x900, headless GPU Chromium, real keys; the dev server, not a production bundle). "Before" is the same tree serving the two engine files as they are on acbd815d3 (the reviewer's md5-checked copies), so only the fix differs. The harness's own flicker count is `summary.flickers` in `continuity.json` (my `compare.mjs` re-tagging undercounts a report that already carries the tags).

| | Chapter IV (FFX-2), ghost frames a minute | Chapter IV flickers | Chapter V (FFX-2), ghost frames a minute | Chapter V flickers |
|---|---|---|---|---|
| release 64 kept run | 147.3 | 22 | not kept | |
| before (this lane, review) | 153.5, 154.5 | 20, 21 | **179.9** (2514 frames, 838.6 s) | **10** (144 frames, median gap 102 ms) |
| after (lane, review, **final code**) | 103.9, 110.7, **102.1** (617 frames, 362.5 s) | 0, 0, **0** | **167.6** (2200 frames, 787.4 s) | **0** |

- **Chapter V is new evidence** (the review's "not done by anyone"). `ffx2-vegnagun-shuyin`, 13 to 14 minutes of real-time ATB, no conference pack: the flicker is there too (5 each for Rikku and Paine) and the fix removes all 10. Nothing else moved: snaps 0 and 0; swap jerks of 40 px or more 6 and 6 (4 over the fail line in both, worst 204.1 and 200.5 px, the older PR-0380 boss-scene class); worst ghost severity 0.321 to 0.309; head change over 3 percent 0 and 0; feet 0 and 0; height outside its band 0 and 0; CHK-026 PASS in both, CHK-027 FAIL in both on the same four jerks. The drop in ghost frames a minute (179.9 to 167.6) is the 144 flicker frames (3.4 a minute) plus route noise (one fight is 51 s longer).
- **Chapter IV on the final code: 102.1 a minute, 0 flickers**, snaps 0, worst severity 0.342, swap jerks 4 (worst 45.2 px, Rikku's staged twirl, the same as before), head and feet 0; Yuna did not cast under the height ceiling this run, so CHK-026 read PASS (it is that cast, not this change, that fails it when she does).
- **Chapter I** is not reachable by the change (the review ran it: 101.7, identical to release 64); not re-run.
- **Tests:** `tsc --noEmit` clean; `tests/unit/ffx2-ready-hold.test.ts` 12 of 12; the 318 presenter-touching files (every `tests/unit` file naming the presenter, `FakeStage`, `KeyPoses`, `BattlePresenterBeats`, the ATB drive helper or the continuity harness, minus the bench and golden files): 317 passed, 1 skipped, 4,474 tests passed, 0 failed. The full `npm test` has still not been run by anyone.
- Evidence: `D:/Tools/pyrefly-scratch/2026-10-26/batch1/post-flicker/r2/` (`evidence/after2/`, `evidence/before2/`, `raw/`, `job-*.log`, `compare-ch4-r2.json`, `compare-ch5-r2.json`, `vite.before.config.mts`, `run-job.mjs`, `serve.sh`); `tests-r2.log` beside it. Both dev servers (:5602, :5603) were stopped by PID; no lock of this lane is left.

## The frame strip of a former flicker

`docs/screenshots/post-flicker-strip-paine.jpg` and `post-flicker-strip-rikku.jpg`: Chapter IV, seed 1, the first menu, Paine (and Rikku) chosen Attack on Bahamut, a virtual clock at an exact 60 Hz (frames of 17/17/16 ms), the crop following the girl.
Top rows before (this tree without the change): `ready` from the menu; at +0 the turn start asks for `idle` and the blend to the dark-jacket painting runs +0 to +4 (the dark jacket is mostly drawn by +3); `ready` is asked for again at +5 and is fully drawn by +12; bottom rows after: `ready` throughout.
The per-frame pose log of both recordings: `attack` at +39, `follow` at +48, `idle` at +63 frames in both; only the idle blip is gone. Side-by-side clips, normal speed and a quarter speed, 60 Hz:
`D:/Tools/pyrefly-scratch/2026-10-26/batch1/post-flicker/cap/work/clips/post-flicker-{paine,rikku}-before-after-{normal,quarter}.mp4` (not in the repo). A 120 Hz pair was not made (the "before" needs the unfixed code; the logic is event-driven and does not depend on the rate).

## Evidence (all in `D:/Tools/pyrefly-scratch/2026-10-26/batch1/post-flicker/`)

- `evidence/{before,after}/ffx2-bahamut-win-{before,after}/continuity/continuity.json` and `strips/` (Chapter IV), `evidence/{before,after}/seymour-flux-win-*/` (Chapter I); `raw/{before,after}/*.json.gz` (the probe's recordings, to re-run the analysis).
- `compare-ch4.json`, `compare-ch1.json` and `compare.mjs` (the table above; it also runs the flicker class over the kept release 64 reports and finds the plan's 22, 295, Rikku 10 and Paine 12).
- `cap/out/{before-60,after-60}/` (every frame of the attack windows as JPEG, per-frame poses), `cap/capture.mjs`, `cap/compose.mjs`, `cap/clip.mjs`; `progress.md` is the step log; `job-*.log`, `cap-*.log` the runs.
- To repeat: the dev server (`node node_modules/vite/bin/vite.js --port 5602 --strictPort --host 127.0.0.1`), then `node critic/runner/lib/continuity.mjs --base=http://127.0.0.1:5602/ --evidence=<dir> --chapters=ffx2-bahamut --tag=<t> --seed=1 --size=1600x900` with `PYREFLY_BROWSER=gpu` under the RIG-RECORD lock.

## Checks run

`npx tsc --noEmit` clean (run as `node node_modules/typescript/bin/tsc --noEmit`); `node tools/orphans.mjs` lists none of the new files; 200 test files, 2,970 tests pass (4 skipped) across `tests/unit/engine`, every `presenter-`, `ffx2-active*`, `ffxcam-`, `critic-continuity*` file, the other files that name `turnStart`, `KeyPoses`, `BattlePresenterBeats` or `windUpLeads`, and the two new ones. The **full** suite was started and stopped at 33 of about 1,650 files (the chapter benches take hours at two workers on a shared machine): run it once before the release that carries this (`npm test`).

## What remains

1. **The sibling blip: `ready, idle, cast` and `ready, idle, item` (FFX-2 only).** In the after run 36 pairs (31 casts, 5 items) still go menu `ready`, `idle` for 90 ms, then the action's pose: 216 of the run's 662 see-through frames (33 percent; the ready-to-idle halves alone are 108, 16 percent). It is the same turn-start `setPose('idle')`. Holding `ready` into a cast is a change of which two paintings blend (ready to cast instead of ready to idle to cast), so it is its own measured step with its own clip, not part of this one. Prediction if the same hold covered them: about 87 ghost frames a minute.
2. The two ready paintings (Rikku Dark Knight, Paine Warrior; plan step 6) remain the biggest class: ready/idle and ready/attack overlap 0.08 and 0.12, worst severity 0.342, which this change leaves as it was.
3. Chapters IV and V were measured with the release harness (V in the review round: 10 flickers to 0). The code acts in every FFX-2 chapter whose girls have a painted `ready` and the wind-up on (PR-0522: one chapter at a time with the release harness), about 40 character folders including the hidden Leblanc ones; the other FFX-2 chapters are covered at engine level only (the review: 4 to 8 ready, idle, ready triples per fight before, 0 after, in all 12 encounters, Active and Wait). The focused review of the release that carries this should add the harness on one more chapter if it can; FF7 is excluded by the gate, unmeasured. Not done by anyone: the full `npm test`, a production bundle of this branch (the release's own build is the first), a 120 Hz capture.
4. The harness class is report-only. Making it a gate (it should be 0 in Chapter IV) needs a policy word, a RUBRIC line and Bailey's yes.
5. `node tools/critic-plan.mjs` classes the presenter edit as **DEEP** (shared battle presenter): a focused review before a deploy and the deep review on the live build are owed to whichever release carries this. The paper preflight is `docs/plans/post-flicker-review.md` (written beside the build, not before it: say so in the release note).
6. NOW.md is not touched by this lane (several lanes edit it at once); the driver adds the row. CHANGELOG: nothing for a release that has not been cut; the line for the release that carries it: "FFX-2 only (Chapter IV and any FFX-2 fight with painted wind-ups): a girl who attacks from her menu holds her ready stance into the attack instead of dropping to idle for a tenth of a second and coming back (no change of paintings; the second weight-shift step at the start of the attack no longer fires: in Chapter IV the run-in's first hop is about 12 percent lower, 7 to 16 px at 1600x900; `?motion=classic` shows the old sequence)".
7. The Vite dev server (:5602) was stopped by PID; no RIG-RECORD lock of this lane is left.
8. The sibling blip `ready, idle, cast|item` and the girl hit under her open menu (`hurt, idle, ready, attack`) are unchanged (see 1); the review lists the second as a sibling for a later step.
