# Developing Pyrefly Reprise

Node 24, npm 11. Windows/macOS/Linux; every command below is run from the repo
root. Read [ARCHITECTURE.md](ARCHITECTURE.md) first — the layering rule there is
the constraint everything else hangs off.

```bash
npm install
npx playwright install chromium   # once, for e2e + screenshots
```

## Commands

| What | Command |
|------|---------|
| Dev server (HMR) | `npm run dev` → http://localhost:5173/ |
| Type check + production build | `npm run build` (runs `tsc --noEmit && vite build`) |
| Serve the built artifact | `npm run preview` → http://127.0.0.1:4319/pyrefly-reprise/ |
| Unit tests | `npm test` (vitest, run mode) |
| One unit file | `npx vitest run tests/unit/raster.test.ts` |
| End-to-end | `npm run test:e2e` (alias for `playwright test`) |
| Screenshot | `npm run screenshot -- --screen=demo --out=docs/screenshots/01-foundation.png` |
| Painted-art generation | see [ART-PIPELINE.md](ART-PIPELINE.md) — ComfyUI + `tools/gen/comfy.mjs` |
| Music/SFX preview | `node tools/render-track.mjs all --out=docs/audio` |

### Ports and base path

- Dev serves at `/`. **Build and preview serve under `/pyrefly-reprise/`**
  (`PROD_BASE` in `vite.config.ts`), so the preview is byte-identical to the
  GitHub Pages artifact. Set `BASE_PATH=/` for a user page or custom domain.
- The preview port is **4319** by default (4173 is a common squatter). Both
  `playwright.config.ts` and `tools/screenshot.mjs` read `PREVIEW_PORT`:
  `PREVIEW_PORT=4500 npm run test:e2e`.
- Headless WebGL runs on SwiftShader. The Chromium flag list is duplicated in
  `playwright.config.ts` (`CHROMIUM_ARGS`) and `tools/screenshot.mjs` — keep
  them in sync.

### Screenshot tool

```
node tools/screenshot.mjs [--out=PATH] [--screen=NAME] [--frames=N]
                          [--width=1600] [--height=900] [--port=4319]
                          [--url=http://localhost:5173/] [--timeout=30000] [--headed]
```
With no `--url` it starts its own `vite preview`, so run `npm run build` first.

### Sprite tool (retired)

`tools/render-sprite.mjs` drove the original pixel-art pipeline. The game is
painted 2.5D now — see [ART-PIPELINE.md](ART-PIPELINE.md) for the live art
workflow. The tool still runs and its output still lands in
`build/sprites/<name>/` (gitignored), but nothing in the game consumes it; it is
kept for reference only, alongside [SPRITE-GUIDE.md](SPRITE-GUIDE.md).

```
node tools/render-sprite.mjs <sprite.ts> [--state=NAME] [--all] [--scale=8]
                                         [--out=DIR] [--grid] [--quiet]
node tools/render-sprite.mjs <folder> --contact [--scale=4] [--out=DIR]
```

### Track tool

```
node tools/render-track.mjs all --out=docs/audio
node tools/render-track.mjs title --rate=22050
node tools/render-track.mjs sfx-demo --seconds=3
```
Writes 16-bit stereo WAV with a `smpl` loop chunk and exits non-zero on
non-finite samples, peak ≥ 0.95 or an over-budget file. Nothing ships as an
audio asset — the game synthesises every sound at runtime; these WAVs are
previews only. See [AUDIO-GUIDE.md](AUDIO-GUIDE.md).

## Controls (demo scene)

| Key | Pad | Action |
|-----|-----|--------|
| Arrows / WASD | D-pad / left stick | move, cycle camera rigs |
| Enter / Space / Z | Cross | confirm — plays Tidus's attack state + SFX |
| Esc / X / Backspace | Circle | cancel — back to the title |
| Shift / Tab / Q | Triangle | flash the boss |
| E / C | Start | start |
| **M** / V | Select | toggle the `title` track |
| R / PageDown, F / PageUp | R1 / L1 | reserved |

Browsers only create an `AudioContext` inside a user gesture. `main.ts` calls
`audio.installUnlockListeners()` at boot, so the first keypress or click unlocks
it; anything requested before that is queued by `AudioManager`.

## Debug API

`window.__pyrefly` is installed at boot and is what e2e, the screenshot tool and
the critic drive the game through. `window.__pyreflyReady === true` once two
frames have rendered.

| Member | Meaning |
|--------|---------|
| `version` | build version string |
| `app` | the live `App` instance |
| `screen()` | name of the active screen (`'title'`, `'demo'`, `'chapter-select'`, `'party-prep'`, `'battle'`, `'cutscene'`, `'results'`) |
| `goto(name)` | replace the active screen; resolves `false` if unregistered |
| `frame()` / `frames(n)` | resolve after 1 / n rendered frames |
| `snapshotState()` | screen name, frame count, per-screen snapshot, seed, flow step, and — in a battle — the **full ordered event log** |
| `setSeed(n)` / `seed()` | RNG seed for the **next** battle started (engines are seeded per battle via `BattleSetup.seed`) |
| `waitReady()` | resolves after the first rendered frame |
| `audioDebug()` | mixer state, tracks and all 28 SFX with cached flags |
| `playMusic(name, fade?)` | `'title' \| 'battle-ffx' \| 'boss-dread'` |
| `playSfx(name)` | fire one cue; no-op before audio is unlocked |
| `setMuted(bool)` | mute/unmute the master bus |

### Chapters and the flow

| Member | Meaning |
|--------|---------|
| `chapters()` | the five `ChapterId`s, in play order |
| `chapterSelect()` | enter the chapter-select screen and the flow loop |
| `gotoChapter(id, opts?)` | play one chapter end to end; resolves with how it ended. `opts`: `skipCutscenes`, `skipPrep` (default **true**), `seed`, `auto`, `speed`, `skipResults` (defaults to true when `auto` is set — the results screen waits for a keypress, and an automated run has nobody to press it) |

### Battle

| Member | Meaning |
|--------|---------|
| `battle()` | the live `BattleScreen`, or `null` |
| `battleState()` | the live `BattleState`, or `null` |
| `battleLog()` | the ordered `BattleEvent[]` of the running (or last) battle |
| `forceCommand(cmd)` | submit a `Command` straight to the engine, bypassing the menu |
| `autoBattle(strategy?)` | hand the fight to a strategy — works even with a command menu already open |
| `strategies()` | `'intended' \| 'attack' \| 'defend' \| 'random'` |
| `setBattleSpeed(s)` | `'normal' \| 'fast' \| 'skip'` |
| `waitBattleEnd()` | resolves when the running battle ends |

### Cutscenes and screenshots

| Member | Meaning |
|--------|---------|
| `skipCutscene()` / `advanceCutscene()` | skip, or step one line |
| `shot(rig?, frames?)` | move the camera to a rig and settle before a capture |
| `waitForScreen(name, ms?)` | resolve once that screen is active |
| `scenes()` | every registered scene key and whether it is still a placeholder |
| `wiring()` | which engines / HUDs / cutscene runner are wired up right now |

`trigger(name)` beats: `'hud:on'`, `'hud:off'`, `'rig:<name>'`, `'battle:fast'`,
`'battle:skip'`, `'battle:normal'`, `'prep:begin'`, `'prep:back'`,
`'prep:tab:<id>'`, `'cutscene:skip'`, `'cutscene:advance'`,
`'results:continue'`, `'select:<chapterId>'`.

```js
await window.__pyrefly.waitReady();

// Play chapter 1 to a decided outcome with the intended tactics.
window.__pyrefly.setSeed(1);
const outcome = await window.__pyrefly.gotoChapter('seymour-flux', {
  skipCutscenes: true,
  auto: 'intended',
});
console.log(outcome.outcome, outcome.result.turns, outcome.links);

// Or take over a fight that is already waiting on a human.
await window.__pyrefly.goto('battle');
await window.__pyrefly.frames(30);
window.__pyrefly.autoBattle('intended');
console.log(window.__pyrefly.battleLog().length);
```

## House rules

- TypeScript strict, ESM, explicit `.ts` extensions on relative imports.
- Every source file under 400 lines.
- `battle/` stays pure: no DOM, no Three.js, deterministic under a seeded RNG.
- The **presenter** is pure too: `engine/BattlePresenter*.ts` imports no `three`
  and touches no DOM (only the ports in `BattlePresenterPorts.ts`), which is what
  lets `tests/unit/presenter-*.test.ts` run a whole battle in Node.
- No retail Square Enix assets, ever. All art, music and text are original.
