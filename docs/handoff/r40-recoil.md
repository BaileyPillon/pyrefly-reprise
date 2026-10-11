# r40-recoil: the knock-back's first frames (FC-1, Bailey's pick P3-80)

Branch `r40-recoil`, worktree `D:/pyrefly-r40-recoil`, cut from `r40-blend` at 1ac44a91 (the blend lane's FB-1). Lane L3 of `D:/Tools/pyrefly-scratch/2026-10-10/visual-feel-pass/plan.md` (item 5).
**Game case: both.** The knock-back is shared plumbing (`PaintedActor.knockBack`, called by `recoil` on every hit and by the life layer's flinch cue); a defect true in FFX and FFX-2 alike. The sources give no distance, duration or curve for a hit's knock-back in either game (`research/ffx-vs-ffx2-presentation.md` open question 5), so every number is `[ours]`, one shape for both. FFX shows it a little worse (hit-stop 40/85 ms against 28/55 ms in FFX-2, so a longer hold on the thrown frame).
Authority: Bailey, 2026-10-10, "I'll go with all your recommendations" (the Motion Options picks: P3-80, "an 80 ms eased push, after confirming the mechanism").
No browser, no server and no Playwright were used in this run; the on-screen measuring is owed (see "What is owed").

## STEP 1. Is the damage jerk the knock-back's first frames?

**Verdict: CONFIRMED**, for the mechanism, the direction, the size class and the timing. **Not measured:** the exact share of the 195 damage-caused jerks this accounts for (that needs the harness re-run, below). Everything is from stored frames, the code, and a headless replica through the real engine and the harness's own detector.

### 1. What the code does (read, then replayed)

`PaintedActor.knockBack` was one tween, 1 down to 0, on `Easing.elasticOut`, writing `recoilOffset = -v * distance`. Three facts together:

- A `Tween` writes its value at progress 0 the first time it is ticked (`Tween.update`: `elapsed += dt; onUpdate(lerp(from, to, ease(p)))`; with `dt` 0, `p` is 0 and `v` is `from`, which is the full distance).
- The tween group is ticked every frame, hit-stop or not: `BattleScreen` hands the stage `fieldDt = spectacle.stageDt(dt)`, which is **0** while the hit-stop holds, and `PaintedActor.update` still runs `this.tweens.update(dt * paceRate('action'))`.
- The hit-stop is armed in the same damage handler as the recoil (`BattlePresenterBeats.damage`: `recoil(360, crit ? 0.34 : 0.22)`, then `fxHit` arms the freeze, 2 to 5 frames: 40/85 ms FFX, 28/55 ms FFX-2).

So on the frame the hit lands, **the whole figure is thrown the full distance in one frame** (0.22 units, or 0.34 on a crit; about 33 px and 50 px on a 1600 px screen at the battle camera's 148 px per unit), held there for the length of the hit-stop, and then the spring is released: a step of 0.5 to 0.55 of the distance on each of the next two frames, through rest and 37 percent past it (elasticOut's overshoot). The harness sees a jerk at the thrown frame and a second one at the release, in the opposite direction.

The plan's own hand reading ("first frame 41 percent, second a swing through zero") was the no-hit-stop case; the stage's real tick makes it worse.

### 2. The replica (real `PaintedActor`, real camera, the stage's tick, the harness's `detectJerks` with `critic/policy.json`)

Yuna (`head-lock-fixture.ts`), a 34 degree camera 9.9 units back (148.4 px per unit, which reproduces Tidus's 270 px in the round-23 frame `seymour-natus-win-r23/23-midfight.png`; world height 1.82), FFX pacing steady (action x1.2), 60 fps, field `dt` 0 for the freeze frames. Frame steps in px, then the events the harness flags:

| Case (old curve) | Steps, first 12 frames | Harness jerks |
|---|---|---|
| light, freeze 3 | -33 0 0 15 18 10 0 -6 -6 -3 0 2 | 32.6 px at the hit frame |
| light, freeze 5 | -33 0 0 0 0 15 18 10 0 -6 -6 -3 | 32.6 px |
| crit, freeze 3 | -50 0 0 24 28 16 0 -9 -10 -5 0 3 | 50.4 px, then 28 px at the release |
| crit, freeze 5 | -50 0 0 0 0 24 28 16 0 -9 -10 -5 | 50.4 px, then 28 px |
| crit + shake (phase 0.75), freeze 3 | -74 0 0 36 50 26 -10 -27 ... | the step is 74 px |
| light, no freeze | -17 18 10 0 -6 -6 -3 0 2 2 1 0 | none (the freeze is what makes it a jerk) |
| light, freeze starting one frame after the hit | -17 0 0 0 18 10 ... | none |

The last row matters: where the HUD's reveal takes a frame before the freeze is armed, the old first step was only half the distance. The stored strips show the full-distance jump held for a frame, so in the harness's runs the freeze is armed before the first tick.

### 3. The stored round-23 data (`critic/rounds/round-23/continuity/*/continuity/continuity.json`, 18 chapters)

- 610 jerks of 40 px or more are not at a swap (the plan's number). **380 of them (62 percent) are horizontal and away from the opponent** (party and aeons to -x, foes to +x); 194 of those are within 60 frames after a `damage` event, 168 have no event within 60 frames (see below), 10 follow a `ko`. 69 more are horizontal the other way (party +x 40, foes -x 22, aeons +x 7: the release swing, or a lunge's return), 161 are not horizontal. Median 51 px, 90th percentile 67 px for the away ones.
- By side, of the 449 horizontal ones: foes to +x 91 and to -x 22; party to -x 278 and to +x 40; aeons to -x 11 and to +x 7. The party stands on the left, the foes on the right, so the large majority go away from the opponent: the direction a knock-back throws a figure.
- 117 of the 610 are the feet moving (the whole body), not the head: a pose blend moves the head and leaves the registered feet on the ground, so those are a whole-figure translation.
- `cause` is the nearest engine-log event before the jerk, and the log is stamped when the engine emitted an action's events, not when the presenter plays each one, so `framesBefore` is unreliable for a long action and `cause: none` is not evidence against a hit (168 of the 380 have none).

**The strips, read by pixel.** Of the 23 mid-move jerks that kept a strip, I extracted the head cross of each of the 12 frames from the strip JPEG (`#39ff14` marks; scripts were scratch, not committed) and read the series away from the opponent, in cell px relative to the six frames before:

| Chapter, figure | Jerk px | Cause tag | Away, frames 0..+5 (cell px) |
|---|---|---|---|
| ffx2-bahamut, Rikku | 57.7 | damage | 30, ., 10, -6, -8, 1 |
| ffx2-bahamut, Rikku | 55.2 | damage | ., 25, ., -9, -12, -3 |
| ffx2-den-of-woe, Yuna | 66.5 | none | 36, 31, 5, -16, -18, -8 |
| ffx2-ixion-djose, Yuna | 70.6 | none | 33, 31, 15, -4, -8, 21 |
| ffx2-leblanc, Yuna | 61.1 | none | 31, 28, 8, -10, -10, -1 |
| seymour-flux, Tidus | 72.9 | none | 32, 32, 23, 3, -6, 4 |
| seymour-natus, Auron | 53.3 | damage | 31, 31, 23, 0, -18, -22 |
| seymour-omnis, Wakka | 59.1 | none | 32, 32, 25, 6, -4, 5 |
| seymour-omnis, Yuna | 58.4 | none | 34, 34, 28, 5, -16, -23 |
| yojimbo-cavern, Lulu | 52.4 | ko | 31, ., 24, 4, -11, -11 |
| yojimbo-cavern, Kimahri | 43.9 | none | 26, 26, 23, 6, -17, -34 |

**11 of the 23 show one signature**: a single-frame step away from the opponent of 25 to 36 cell px (the cell scale reads 1.7 to 2.3 screen px per cell px, the jerk's own `dx` over the cell jump, so 52 to 71 px), **held for a frame** (7 of the 8 where both cells were readable: the hit-stop), then back through rest within 3 to 4 frames and out the other side by 10 to 30 cell px. That is the old curve with a hit-stop, to the frame. The first two strips I looked at by eye also show the hit flash and the warm tint starting in the jerk's own cell (Rikku, Auron): the flash, the shake and the recoil are issued in one call.
The other 12 are other movers and are not claimed: three party-wide shifts of 106 to 125 px at a turn start in `seymour-anima-macalania` (constant offset, no spring: a camera or stage move), a run (Yuna in `ffx2-bahamut` and `isaaru-via-purifico`, steady drift), foe moves (Natus, Yojimbo, Bahamut, Valefor, Ormi's 260 px teleport), Tidus in `yunalesca` (no pattern).

**An independent earlier record.** `tests/unit/critic-continuity-pure.test.ts` (the "knock-back that jumps and then holds" case) pins this shape from release 38's live data: "71 px at once, then nothing for a frame, then a slow spring home (Tidus's hit recoil of release 38)". And `critic/CHECKS.md` CHK-027's baseline says "a hit recoil that throws a figure 30 to 70 px in one frame". The mechanism above is what produced that shape.

### 4. What I do not claim

- The share of the 195 (or the 380) that is this. The strips say about half of the biggest ones; the rest of the data cannot be split without per-frame traces, which the harness does not store. The harness re-run in "What is owed" measures it.
- The shake's part (below). The stored jump of 52 to 71 px is a little over the distance alone (33 / 50 px); the hit shake (0.1 or 0.16 units, so up to 15 or 24 px) starts at a random phase and adds to that frame.

## STEP 2. What was built

- **`src/engine/HitRecoil.ts`** (new, pure; 81 lines): `hitRecoilOffset(p, ms, distance, from)` in two legs over the caller's `ms` (the tween clock, so the pacing option stretches it like every other move: 96 ms real for the push at FFX steady, 432 ms real for the whole move, as 360 ms always was).
  1. **The push**: from where the figure is to the full distance back over **80 ms** (`RECOIL_PUSH_MS`), on `sineOut`. Its value at progress 0 is where the figure already is, so a hit-stop leaves it still at the moment of contact and the push begins when the field lets go; a second hit mid-spring starts from the current offset. Largest frame step 0.32 of the distance at 60 fps (9 px light, 14 px crit in the replica); the whole distance before.
  2. **The spring home**: the rest of `ms`, to 0 on a back-out (`s` = 1.6) with **one** overshoot of 0.0898 of the distance (the plan's "at most 0.1"; the old curve's was 0.37 and swung several times). Largest first-frame step 0.28 to 0.31.
  A move shorter than 235 ms gets a push of a third of it, so there is always a spring. Total duration and the distance are unchanged.
  `?recoil=legacy` (read once, `recoilLegacy` / `setRecoilLegacy`, the `?headlock=off` precedent) plays the old tween for same-build A/B. **Default ON**: the mechanism is confirmed, so nothing here ships behind a default-off switch.
- **`PaintedActor.knockBack`**: the six-line seam (the import, `legacy`, `from`, and the tween: 0 to 1 linear with `onUpdate(v, p)` writing `hitRecoilOffset(p, ...)`; the legacy branch keeps the old tween byte for byte). `PaintedActor.ts` stays a pre-existing house-rule-7 breach (2,264 lines); no logic was added to it.
- **`docs/ENGINE-API.md`**: the `recoil` row.
- **No contract change**: `docs/CONTRACTS.md` names neither `PaintedActor.ts` nor `Tween.ts` as a contract file (its one mention is the retired SpriteActor note), so there is no `CONTRACT-CHANGES.md` entry. No game number, boss number, registration or approved painting changes; `src/battle/**` and `BattlePresenter*.ts` untouched.

Replica after the change (same setup as the table above; no harness jerk without the shake):

| Case (new curve) | Steps, first 12 frames | Harness jerks |
|---|---|---|
| light, freeze 3 | 0 0 0 -9 -8 -7 -5 -3 1 7 6 5 | none |
| crit, freeze 3 | 0 0 0 -14 -13 -11 -8 -5 2 10 9 8 | none |
| crit, freeze 5 | 0 0 0 0 0 -14 -13 -11 -8 -5 2 10 | none |
| crit + shake, freeze 3 (4 phases) | worst -34 | 28 to 34 px in 3 of 4 phases (under the 40 px failing line) |

### The shake (looked at, not changed)

`PaintedActor.shake` starts a decaying sine at a random phase and full amplitude (0.1 units, 0.16 on a crit: 15 and 24 px), so it also writes up to 15 or 24 px on the hit frame and steps up to 15 or 24 px a frame for the next six. With the new recoil the worst combined frame is 22 px (light) and 34 px (crit) over 8 phases, against 74 before; no frame reaches the harness's 40 px failing line, but a crit can still read as a 24 to 34 px jerk. The candidate fix, a shake that starts at phase 0 and so ramps in, changes how every hit shakes: it is a look change for Bailey's options round (plan: "not changed unless the strips show it"), so it is left alone and flagged.

## Tests

- `tests/unit/engine/hit-recoil.test.ts` (11): the shape (starts at `from`, ends at exactly 0, full distance at the push's end, one overshoot under 0.1, continuous at the join, short moves, deterministic); the largest frame step at 30/60/120/144 fps and pacing 1, 1/1.2, 1/1.1 for five moves (light, crit, flinch, boss, spell); the old curve rebuilt so the guard can fail (a whole-distance first step with a 3-frame hold; a release of 0.5 of the distance); the hit-stop holds the figure still; a second hit mid-spring; total distance and duration; the switch.
- `tests/unit/engine/hit-recoil-actor.test.ts` (8): the real `PaintedActor` under a real camera, ticked as the stage ticks it, judged by the harness's own `detectJerks`: no step of 17 px or more at any hit-stop length for a light hit and a crit; still through the hit-stop; pushed away (party -x, foe +x) by the distance, past rest by under a tenth, settled; the same length of move as the legacy; a second hit mid-spring; with the hit shake over 8 phases no frame reaches 40 px; and `?recoil=legacy` throws 30 and 45 px or more on the first frame and is flagged (the guard fails on the old curve).
- Run (worktree, `--maxWorkers=1` or 2, the machine shared): the two new files, 19 tests, green. Every test file that mentions `PaintedActor`, `knockBack` or `recoil(` (37 files, 464 tests): 459 passed; `ff7-judge-repair` and `omnis-readout` hit a worker-start timeout under load and pass alone (30 passed, 1 skipped); `chapters/trema-ship-content` fails for want of `public/art/` (a worktree has none; the known art-dependent class). `npx tsc --noEmit` equivalent (`node node_modules/typescript/bin/tsc --noEmit -p .`): clean. `node tools/orphans.mjs`: `HitRecoil.ts` is reached from `PaintedActor.ts`; the 52 orphans listed are the existing ones. The full `npm test` is owed in the main tree before any push of a merge.

## What is owed

1. **The on-screen confirmation and the A/B** (a browser, none was used here): run `?recoil=legacy` and the default in the same build on `seymour-natus`, `yunalesca`, `sin-fins-core`, `ffx2-fallen-aeons` with the continuity harness; the prediction is that the damage-caused jerks of 40 px or more fall by most of the 194 (the away-from-the-opponent ones), and the 24 to 34 px crit-and-shake ones remain. If they do not fall, STEP 1's share is the thing to re-open, not the code.
2. **The options loops** of P3 (the P0 lane): the new curve's loop on Tidus and Seymour Flux with the real flash and shake. One feel change to point at: the figure now stays where it was at the moment of contact for the whole hit-stop and then moves, where it used to be thrown at the first frame of the hit-stop.
3. **Records**: NOW.md, a CHANGELOG entry (both games), the ledger rows and the P3 tile's `reaction` (Bailey's pick is on record in the brief that launched this lane) are left to the merge, so this branch does not collide with the other lanes in those files.
4. **The shake** (a look decision, above) and the 168 + 161 jerks that are not this (vertical and diagonal, the turn-start party shift, runs): other lanes.
5. **Merge order** (plan section 5): after the blend lane (`PaintedActor.ts` hunks are disjoint: setPose/update against `knockBack`).
