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
