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
  her own `action-start`, and that action opens on the wind-up painting (the same two terms `actionStart` uses: no port owns the wind-up, and `windUpLeads`). 25 lines with its comment.
- `src/engine/BattlePresenterBeats.ts` (`turnStart`, one line): `if (!readyCarriesIntoWindUp(ctx, actorId)) ctx.stage.actor(actorId)?.setPose('idle')`. The 90 ms wait, the turn-start camera shot and
  everything else are as before. The file is 368 lines (was 368; the line is edited in place).
- `critic/runner/lib/continuity-flicker.mjs` (+ `.d.mts`): the flicker as a **named class of the harness** so it cannot come back unseen: a figure that shows A, B, A again within 300 ms for the pairs the
  class names (`ready>idle>ready` by default; `continuity.flicker.pairs` / `windowMs` in the policy may change them; the shipped policy has no such block). Both swaps carry a `flicker` tag in
  `continuity.json` and the summary gets `summary.flickers` {count, ghostFrames, share, perMinute, byPair, byFigure, medianGapMs}. **Reported, not gated** (no verdict reads it; a gate needs its own policy word,
  a RUBRIC line and Bailey's yes). Not every out-and-back is one: the second hit of a multi-hit blow (`hurt>idle>hurt`, 15 of them in Chapter I) and a rig's key pair are by design and are not counted.
  Wired in `continuity-analyze.mjs` (5 lines; `continuity.mjs`, which another lane is editing, is not touched).
- Tests: `tests/unit/ffx2-ready-hold.test.ts` (10: the beat on its own with every case that must NOT hold, and the real engine plus presenter reading the pose calls; with the hold switched off the two positive
  tests fail), `tests/unit/critic-continuity-flicker.test.ts` (11), `tests/unit/critic-continuity-analyze.test.ts` (+1: the summary block and the per-swap tag).

What stays as it was, deliberately: a girl who casts, uses an item, defends, or has no painted `ready` (the sequence is still `ready, idle, cast`, see "what remains"), REDUCE MOTION (no wind-up leads, so no hold), FFX, FF7, foes.

**One perceivable side effect, disclosed (the driver's call to keep).** Entering the `ready` life state plays a weight-shift step (`ActorLife` cue `step`: the small hop or leap of "their turn", 3 percent of her height, `PaintedActor.playCue`)
and eases the lean and the turn ring up. Before, the figure entered `ready` twice (menu, then the action's wind-up) and so stepped twice and dropped and re-raised the lean and ring in between; now it enters once,
at the menu, and the second step at the start of the action does not happen. The paintings, the timing of the attack, the follow-through and the way home are identical (the 60 Hz recording below has `attack` at +39 frames, `follow` at +48, `idle`
at +63 in both). The second step was an effect of the blip, not a designed beat, and the original step is the motion lane's own neutral weight shift ("the docs are silent"); if a second anticipation at the action's start is wanted it
should come back as a named beat, not as a side effect. The projected position in the recording is identical to 0.4 px in x and 0.2 px in y; I did not re-record the inner hop offset (it is not in the capture's per-frame record).

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
the measured 103.9 sits under it. The class table of the plan holds, so the next step (the ready paintings) goes ahead on the same table. Per figure, ghost frames: Paine 317 to 209, Rikku 337 to 203; Yuna 229 to 250 is route noise
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

## What remains

1. **The sibling blip: `ready, idle, cast` and `ready, idle, item` (FFX-2 only).** In the after run 36 pairs (31 casts, 5 items) still go menu `ready`, `idle` for 90 ms, then the action's pose: 216 of the run's 662 see-through frames (33 percent; the ready-to-idle halves alone are 108, 16 percent). It is the same turn-start `setPose('idle')`. Holding `ready` into a cast is a change of which two paintings blend (ready to cast instead of ready to idle to cast), so it is its own measured step with its own clip, not part of this one. Prediction if the same hold covered them: about 87 ghost frames a minute.
2. The two ready paintings (Rikku Dark Knight, Paine Warrior; plan step 6) remain the biggest class: ready/idle and ready/attack overlap 0.08 and 0.12, worst severity 0.342, which this change leaves as it was.
3. Chapter IV only was measured. The code acts in every FFX-2 chapter whose girls have a painted `ready` and the wind-up on (PR-0522: one chapter at a time with the release harness); FF7 is excluded by the gate, unmeasured.
4. The harness class is report-only. Making it a gate (it should be 0 in Chapter IV) needs a policy word, a RUBRIC line and Bailey's yes.
5. `node tools/critic-plan.mjs` classes the presenter edit as **DEEP** (shared battle presenter): a focused review before a deploy and the deep review on the live build are owed to whichever release carries this. The paper preflight is `docs/plans/post-flicker-review.md` (written beside the build, not before it: say so in the release note).
6. NOW.md is not touched by this lane (several lanes edit it at once); the driver adds the row. CHANGELOG: nothing for a release that has not been cut; the line for the release that carries it: "FFX-2 only (Chapter IV and any FFX-2 fight with painted wind-ups): a girl who attacks from her menu holds her ready stance into the attack instead of dropping to idle for a tenth of a second and coming back (no change of paintings; the second weight-shift step at the start of the attack no longer fires)".
7. The Vite dev server (:5602) was stopped by PID; no RIG-RECORD lock of this lane is left.
