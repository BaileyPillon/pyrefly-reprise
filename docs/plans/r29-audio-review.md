# r29-audio: paper preflight (AGENTS.md rule 15)

Written before building. `node tools/critic-plan.mjs --paths src/audio/AudioManager.ts,src/ui/common/pauseMusic.ts,src/app/Input.ts,src/app/SaveData.ts`
classes the batch DEEP (save data and settings; audio routing; input and boot). Game case: **both**
(shared audio plumbing and the shared save default; CHK-020). Issues from `critic/rounds/round-15.json`.

## PR-0226: the pause cue takes the battle slot

Cause (from the code, to be proved by a unit test that fails first and by a production-build run):
`AudioManager.playMusic` returns early when the requested cue is already current, **before**
`++musicRequestId`. A `playMusic('pause')` still waiting on its decode is therefore never cancelled by the
resume call `playMusic(previous)`; when the pause buffer lands it replaces the battle cue. Every later pause
sees `current === 'pause'`, remembers nothing, and resume never restores.

Second path, same class: the pause captures `currentMusic`, not the cue last *requested*. A pause while the
battle cue is still decoding (pre-scene into battle) cancels that request and resume brings back the older cue.

Fix:
1. `playMusic`: the early return for the cue already playing bumps `musicRequestId` first (the latest request
   wins, even when it is a no-op).
2. `AudioManager.requestedMusic`: the cue the mixer is heading for (pending load, else queued-before-unlock,
   else current). `setPauseMusic` remembers `requestedMusic ?? currentMusic` and treats a pending `pause` as
   already paused. `PauseMusicPort.requestedMusic` is optional so fakes keep working.

Risks: a same-name request now cancels a pending different cue. That is the intended "newest wins" rule the
code comment already states. No fade or cue choice changes.

## PR-0220: a pad-only player hears nothing

Source: Chromium `NavigatorGamepad::Gamepads()` calls `LocalFrame::NotifyUserActivation(..., kInteraction)`
when `GamepadComparisons::HasUserActivation(gamepads_)` and the page is visible
(chromium.googlesource.com, `third_party/blink/renderer/modules/gamepad/navigator_gamepad.cc`, main, read
2026-09-28). So in Chromium a pad button press, seen through `getGamepads()`, *is* user activation, and an
`AudioContext` created or resumed right after it, in the same task, may start.

Fix: a small `src/audio/padUnlock.ts` (Input.ts is already over the 400-line cap, so it does not grow): one
`requestAnimationFrame` loop that calls `navigator.getGamepads()`, and on any pressed button calls
`audio.unlock()` in the same task; it stops once the context is running. Installed next to
`installUnlockListeners()` in `main.ts`. No new screen, chip or setting.

Not fixable here: Firefox and Safari are not verified to grant activation from a pad. If one does not, the
context stays suspended until a key, click or tap (as today). The critic's "Sound off" chip is a new UI
element: returned to Bailey as a proposal, not built.

## PR-0203 / D-210: lower SFX for new profiles only

D-210 (Bailey, "I'll go with all of your recommendations", recommendation "lower, new profiles only").
Value: round 13's arithmetic (`critic/rounds/round-13.md` #41): sprite peak -1.13 dBTP, music peak -1.06 dBTP
at bus 0.7 (-4.16 dB); rule 8 wants SFX peak <= -10.16 dB, so sfx <= 0.354: **0.35**.

- `defaultSettings().sfxVolume` 0.9 -> 0.35; the `AudioManager` constructor default follows (pre-save mixer).
- Existing saves: `migrate` merges stored settings over the defaults, so a stored `sfxVolume` wins (every save
  written since audio settings existed stores it). A blob that has a `settings` object but no finite
  `sfxVolume` predates the setting and was playing at 0.9: `migrate` keeps 0.9 for it (CHK-024: "an existing
  save's volumes are unchanged").
- A truncated / unreadable blob boots as a fresh save, so it gets 0.35: `tests/e2e/save-upgrade.spec.ts`'s
  expectation moves to 0.35.
- Save-data class: this needs the **deep review before deploy** (AGENTS.md Release). The driver must not ship
  it on a focused pass.

## Checks

`npx tsc --noEmit`; targeted vitest (new: pause race, requestedMusic, pad unlock, D-210 defaults and
migration); `node tools/orphans.mjs` stays at 24; production build + headless Playwright on ports 7950-7959:
cold first pause Esc-Esc within 150 ms on Chapter IV and XII, `audioDebug().music.current` at +3 s; emulated
pad from a fresh profile to the title, `ready` and `music.current`.
