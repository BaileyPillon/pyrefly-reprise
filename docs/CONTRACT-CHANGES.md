# Contract changes

Shared contracts (`src/sprites/format.ts`, `src/engine/SpriteActor.ts`,
`src/app/Input.ts`, `src/battle/common/types.ts`, `src/story/dsl.ts`,
`src/data/encounters.ts`) are written first and imported by everyone else. Any
change to one is recorded here, newest first. Additive only unless a note says
otherwise.

## 2026-09-15 — foundation integration

- **`SpriteActorOptions.anchorOffsetPx?: number`** (additive, default `0`).
  With `anchor: 'feet'`, the plane is sunk by this many logical pixels so the
  sprite's feet line — not the bottom edge of its canvas — sits on the ground.
  `buildSpriteActorInput()` now emits it as `size[1] - anchor[1]`, so sprite
  authors get it for free; existing callers that pass canvases directly are
  unaffected. Tidus has 4 empty rows under his feet and floated without it.
- **`Input` latches presses** (behaviour fix). A button that went down and back
  up between two frames used to be swallowed; `justPressed` now reports it once
  on the next sampled frame. Real taps and synthetic e2e keystrokes both
  depended on this. Covered by `tests/unit/input.test.ts`.
- **`Button` gains `'select'`** (additive). Bound to `KeyM` / `KeyV` and
  standard-gamepad button 8. `BUTTONS` is one entry longer; nothing indexes it
  positionally. The demo scene uses it to toggle music.
- **`PyreflyDebugApi`** gains `audioDebug()`, `playMusic()`, `playSfx()` and
  `setMuted()` (additive). The e2e boot spec only asserts a subset of keys.
- **Preview port default moved 4173 → 4319** in `playwright.config.ts` and
  `tools/screenshot.mjs`; both still honour `PREVIEW_PORT`.
</content>
