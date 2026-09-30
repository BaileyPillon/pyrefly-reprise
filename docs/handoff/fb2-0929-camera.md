# fb2-0929 camera comfort: handoff

**Trigger.** Bailey, 2026-09-29, passing on a friend's feedback and agreeing with it: "The camera movement between attacks is
a bit too fast and made me a bit dizzy ... I think it's cuz the UI shifts with it." Pacing (how long
moves and transitions last) belongs to the separate `fb-0929-pacing` branch. This track covers the
**camera's motion and the UI moving with it**.

**Branch** `fb2-0929-camera`, worktree `D:/pyrefly-fb-camera` (sparse, with junctions). Not merged, not pushed, not deployed.
**Game case:** the fix covers both games (shared HUD and presenter plumbing). Of the options,
`current`, `calm` and `steady` cover both games, and `originals` is FFX only. FFX-2's per-action camera is `[absence]` in
`research/battle-camera-perspectives.md` §B, so under `originals` an FFX-2 chapter plays `current`.

## Measured (live release 31a, headless GPU, real keys, per frame)

The full tables are in `docs/concepts/fb2-0929/camera/README.md` §1 and §2. In short:

- **Desktop:** about one shot change a second. A rig move lasts 550–620 ms and turns 7–8°, and the `cubicInOut` curve peaks at 3x its average (median 32–41 °/s, max 96–119 °/s).
- **Each attack:** a 200 ms move onto the attacker (about 67 °/s), a hard cut of 11–17° on impact, a 4° roll (~40 °/s), and a shake on most hits.
- **Phone:** the camera already holds the master (A-12), so only the roll and the shakes move the frame.
- **UI that moves:**
  - the FFX-2 enemy-intent card (hung on the boss, range 1182x481 px, jumps 480–800 px whenever the target plates or the cut-in appear, even with the camera still);
  - numerals and the chain chip (world-anchored by design);
  - the fighter-dodging panels (advisor card, FFX-2 guide rail and advisor lane, coach line), which were laid out through the camera in flight;
  - no HUD container is transformed with the camera.
- **REDUCE MOTION** (on `main`) was verified to calm the camera: 0 moves, 0 roll, 0 shakes, only cuts.

## Fixed (default on, a defect)

The fighter-dodging panels are laid out against the shot the camera is settling on:

- `BattleCamera.restCamera()` gives the rig target without the in-flight move, sway, push, punch, roll or shake.
- `PaintedStage.project` and `projectRect` take an optional camera.
- `HudPort.setLayoutProjector` is optional and is wired in `src/app/screens/battleCameraComfort.ts`.
- `FFXBattleHud` uses it for the advisor zone's fighter rects and the intent-card obstacle.
- `FFX2BattleHud` uses it for the guide and lane fences.
- `CoachLayer` and `ActorRects` use it for the coach line.

**Result on Ch. IV:** the guide rail's movement during camera moves fell from 1.73 to 0.59 px a frame (1,802 to 663 px in total), and the advisor card's horizontal range fell from 132 to 71 px. The panels now step once per shot change instead of sliding.

**Stated plainly:** in Ch. I the advisor card's measured moves come from targeting opening (the name plate is a new obstacle) at turn start, not from the camera. So they are unchanged.

## Options (default off; Bailey picks)

`?cam=calm|steady|originals` or `window.__pyrefly.cam(name)`. The module is `src/engine/CameraPreset.ts`, and
`PresetCamera` sits inside `StillCamera`, so REDUCE MOTION still wins. There are clips, stills and a
measured table for each preset in Ch. I and Ch. IV in `docs/concepts/fb2-0929/camera/`.
Under `calm` and `steady` the intent card also hangs where the boss *rests* (`labelsAtRest`).

## Tests

- `tests/unit/camera-rest-pose.test.ts`: failed first (no method).
- `tests/unit/hud-layout-at-rest.test.ts`: failed first (FFX, FFX-2, coach).
- `tests/unit/camera-presets.test.ts`: covers the options; `current` is a pass-through.
- 80 related existing files still pass (916 tests). `npx tsc --noEmit` is clean. The orphan count is 24 before and after.

## Open

1. The FFX-2 intent card jumps 480–800 px when the target plates or the cut-in appear. This is the largest UI jump measured, and it is **not** caused by the camera. Holding its place for the length of a decision would change the look, so it needs Bailey's yes.
2. Under REDUCE MOTION, bursts of cuts (three in 0.5 s) are within the approved D-220 definition. `steady` avoids them.
3. The whole-HUD fade on every action (FFX-2 A-15, and FFX panels dropping during actions) happens at the same moments as the shot changes. It was not changed.
4. Chapter phones: not re-measured after the fix, because the camera already holds there.

## CHECK (independent, 2026-09-29, a separate agent that did not build it)

**Verdict: no blockers.** The claimed fix holds, the options stay behind a default-off switch, the engine is untouched.

How: headless Chromium on the GPU (`PYREFLY_BROWSER=gpu`), Enter presses every 0.65 s after `gotoChapter` (seed 1),
per-frame camera pose and HUD rects, same sampler and analyser as the build (copied, re-run by me). Live = release 31a;
branch = a fresh production build of `ffaaa91a` (`vite build`, served by `vite preview` on port 8250, stopped by PID after).
Scratch: `D:/Tools/pyrefly-scratch/fb2-0929/camera-check/` (contains a `nofix/node_modules` junction: unlink it with
`cmd /c rmdir` before anyone deletes that folder).

| Ch. IV (FFX-2) 1600x900, 40 s | live a | live b | branch a | branch b |
|---|---|---|---|---|
| Guide rail (`sgd__stack`) px per camera-moving frame | 1.79 | 1.38 | 0.58 | 0.65 |
| Guide rail, total px moved (all frames) | 2,125 | 1,841 | 1,616 | 1,559 |
| Advisor card (`mad__card`) px per moving frame | 3.94 | 4.32 | 2.42 | 2.63 |
| Advisor card horizontal range | 126 px | 139 px | 71 px | 73 px |
| Advisor card, total px moved | 1,486 | 1,502 | 1,517 | 1,518 |
| Intent card (`eint__panel`), total px moved | 30,133 | 27,947 | 30,773 | 27,301 |
| Camera: rig moves > 1.5°, median ms / turn / peak | 549 / 6.9° / 32 | 550 / 6.7° / 32 | 546 / 6.9° / 32 | 548 / 6.7° / 32 |
| Cuts (max), max roll | 12 (11.6°), 4° | 13 (11.3°), 4° | 12 (11.4°), 4° | 11 (11.3°), 4° |

- **Fix reproduced and confirmed.** Live: the rail and the advisor card slide with camera moves. Branch: their motion during
  camera moves falls by about two thirds and the card's horizontal range halves, matching the builder's numbers.
- **Default is main's camera.** Ch. I 1600x900 live vs branch: 19 moves, median 566/567 ms, 8.3°, peak 36 °/s, 9 cuts up to
  17.2°, roll 4°. Ch. IV 390x844: same 10 small moves and rolls. `window.__pyrefly.cam()` answers `current` with no query and
  with `?cam=bogus`; `?cam=originals` selects it. `?cam=steady` (Ch. IV): 0 rotation moves, 0 cuts, 0 roll.
  REDUCE MOTION (`reducedMotion: 'reduce'`, Ch. I, branch): 0 moves, 0 roll, 25 cuts.
- **Tests fail without the fix.** In a scratch copy of the branch with the eight fixed source files put back to `origin/main`,
  6 of the 15 new tests fail (all of `camera-rest-pose` and `hud-layout-at-rest`); on the branch all 15 pass.
- `tsc --noEmit` exit 0. Full suite once: 10,198 passed, 1 failed (`strategy-ffx2-bahamut` "heal-only route", 15 s timeout
  under load; passes alone, 19/19, and imports nothing the branch changed). `git merge-tree` against `origin/main` (1c313c17):
  clean. Orphans: 24, as on main. No file under `src/battle/**` or `src/data/**` changed; no contract file changed.

**Findings (not blockers):**

1. *Major, disclosed, not fixed by default:* the FFX-2 enemy-intent card still accounts for about 95% of the HUD motion
   that coincides with camera moves (about 28-30k px per 40 s against about 1.5k for the advisor card). The fix does not
   touch it by default; hanging it where the boss rests is only in `calm`/`steady`. The friend's "the UI shifts with it" is
   therefore mostly still there by default. Whether its head-anchoring has an approved design reason is not shown; Bailey's call.
2. *Minor:* the fix turns the advisor card's slide into steps; the card's total travel is unchanged (about 1,500 px either
   way), and the rail's still-frame motion rises (0.2 to 0.7 px a frame) because it now steps when a shot change starts.
3. *Minor, option only:* in `FFXBattleHud`, `atRest()` shifts the intent card's obstacle rect by (rest head - live head) even
   when `labelsAtRest` already drew the card at rest, so under `calm`/`steady` in FFX the advisor dodges a card that is not
   there during a camera move. By default (`current`), the obstacle is at the card's rest spot while the card itself is
   still sliding, so the two can overlap for the length of a move.
4. *Minor:* the full-suite `strategy-ffx2-bahamut` timeout under load, as the builder reported.
