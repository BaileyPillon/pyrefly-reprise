# r29-audio: audio plumbing fixes from critic round 15

Branch `r29-audio` (from origin/main c9c1c295). Game case for everything here: **both** (shared audio
plumbing and the shared save default; CHK-020). Preflight: `docs/plans/r29-audio-review.md` (critic-plan
classes the batch DEEP: save data and settings, audio routing, input and boot).

**Release note for the driver:** PR-0203 changes a save default (`src/app/SaveData.ts`), which is the
save-data class. It needs the **deep review before deploy** (AGENTS.md "Release"); a focused pass is not
enough.

## PR-0226: the pause cue could replace the battle theme: FIXED

- **Cause (proved).** `AudioManager.playMusic` returned early for the cue already playing *before* it bumped
  `musicRequestId`. On a cold first pause (pause.mp3 still decoding), Esc-Esc made resume call
  `playMusic('boss-...')`, which returned early without cancelling the pending `playMusic('pause')`; the pause
  buffer then took the slot, and every later pause saw `current === 'pause'` and remembered nothing. A second
  path in the same class: a pause while the battle cue was still decoding remembered `currentMusic` (the
  older cue) and cancelled the battle request.
- **Fix.** `playMusic` bumps the request id before the early return (newest request wins, even a no-op).
  New `AudioManager.requestedMusic` (pending load, else queued-before-unlock, else current);
  `setPauseMusic` remembers that, so a pause during a decode returns to the cue the screen asked for, and a
  second press while `pause` decodes is the same pause. `PauseMusicPort.requestedMusic` is optional.
- **Evidence.**
  - Unit: `tests/unit/audio-pause-race.test.ts` (real `AudioManager`, hand-resolved decodes). Before the
    fix 5 of 5 failed (`docs/handoff/r29-audio-evidence/unit-before.txt`, e.g. "expected 'pause' to be
    'boss-seymour'"); after, 5 of 5 pass.
  - Browser, production build, headless Chromium (GPU), fresh profile, seed 1, pause.mp3 delayed 1.2 s by a
    route so the first pause is cold, Esc then Esc 120 ms later, 3 runs each
    (`docs/handoff/r29-audio-evidence/probe.mjs`):
    - before, live build 6ea8528f, Chapter IV: `pause` at +3 s, +6 s and after a later pause/resume, 3 of 3
      (`probe-before-live-ffx2-bahamut.json`).
    - after, Chapter IV: `boss-ffx2-aeon` at +3 s and +6 s, 3 of 3; a later slow pause plays `pause` and
      resume brings `boss-ffx2-aeon` back (`probe-after-ffx2-bahamut.json`).
    - after, Chapter XII: the same with `boss-seymour`, 3 of 3 (`probe-after-seymour-omnis.json`).
- Not run: the critic's 10-of-10 on real keys through the whole fight to its end, and the Chapter XII
  pre-scene pause through the harness (the unit test covers the pause-during-decode path). The deep review
  should run its acceptance check.

## PR-0220: a pad-only player heard nothing: FIXED (Chromium); other browsers unverified

- **Cause (proved).** The unlock listened only for `pointerdown`, `keydown` and `touchstart`; a pad raises
  no DOM event. Live 6ea8528f, emulated pad, no key or click: `ready=false`, music `null` after the press.
- **Does a pad press count as user activation?** In Chromium, yes: `NavigatorGamepad::Gamepads()` calls
  `LocalFrame::NotifyUserActivation(..., kInteraction)` when `GamepadComparisons::HasUserActivation` sees a
  pressed button and the page is visible (`third_party/blink/renderer/modules/gamepad/navigator_gamepad.cc`,
  chromium.googlesource.com main, read 2026-09-28).
- **Fix.** `src/audio/padUnlock.ts` (new, imported by `src/main.ts`): one rAF loop reads
  `navigator.getGamepads()` and on a pressed button calls `audio.unlock()` in the same task; it stops once the
  context is running, and keeps retrying while a browser leaves it suspended. `Input.ts` (already over the
  400-line cap) is not touched.
- **Evidence.** `tests/unit/audio-pad-unlock.test.ts`. Browser: after, emulated pad only, `ready=true` and
  `title` within 3 s of the press (before: `null`/not ready). The shim cannot prove real activation: headless
  Chromium here does not block an unactivated AudioContext, so the live check with a real controller is
  still owed.
- **Not fixed:** Firefox and Safari are not verified to grant activation from a pad. There the context stays
  suspended until a key, click or tap, as before. The critic's "Sound off" chip would be a new UI element:
  returned as a proposal, not built.

## PR-0203 / D-210: lower SFX for new profiles only: FIXED (built exactly as D-210 says)

- `defaultSettings().sfxVolume` 0.9 -> **0.35** (round 13's arithmetic, `critic/rounds/round-13.md` #41:
  music peak -1.06 dBTP at 0.7 = -4.16 dB; sprite peak -1.13 dBTP needs <= 0.354 for 6 dB under). The
  `AudioManager` constructor default follows (the save pushes its own level at boot).
- Existing saves: a stored `sfxVolume` wins through `migrate` (0.9 stays 0.9); a blob with a settings object
  but no stored level keeps 0.9, the level it was playing at. A truncated/unreadable save boots as a new
  profile, so `tests/e2e/save-upgrade.spec.ts` now expects 0.35 there.
- Evidence: `tests/unit/save-sfx-default.test.ts` (the fresh-default case failed before: "expected 0.9 to be
  0.35"; the release-25 fixture keeps 0.45/0.3/0.9). Browser: fresh profile reports sfx 0.35 after, 0.9 on
  live. Loudness by ear is Bailey's (agents cannot hear).

## Checks

`npx tsc --noEmit` clean; full `npx vitest run` 614 files passed, 5 skipped; `node tools/orphans.mjs` 24
(unchanged). The e2e spec edit was not run (Playwright spec suite not run in this batch).
`src/audio/AudioManager.ts` (was 638 lines) and `src/app/SaveData.ts` (was 559) were already over the
400-line cap and grew by a few lines each; splitting them is out of scope for a defect batch.
