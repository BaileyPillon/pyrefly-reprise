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
| Sprite preview | `node tools/render-sprite.mjs src/sprites/characters/tidus.ts --all --out=docs/screenshots/sprites` |
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

### Sprite tool

```
node tools/render-sprite.mjs <sprite.ts> [--state=NAME] [--all] [--scale=8]
                                         [--out=DIR] [--grid] [--quiet]
node tools/render-sprite.mjs <folder> --contact [--scale=4] [--out=DIR]
```
Default output root is `build/sprites/<name>/` (gitignored):
`<state>-<i>.png` at 1x, `<state>@8x.png` per state, and `<name>-review@8x.png`
— the sheet to open and iterate against. See [SPRITE-GUIDE.md](SPRITE-GUIDE.md).

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
| `screen()` | name of the active screen (`'title'`, `'demo'`) |
| `goto(name)` | replace the active screen; resolves `false` if unregistered |
| `frame()` / `frames(n)` | resolve after 1 / n rendered frames |
| `snapshotState()` | screen name, frame count, per-screen snapshot, seed |
| `setSeed(n)` / `seed()` | battle RNG seed (stub until `battle/common/rng.ts`) |
| `waitReady()` | resolves after the first rendered frame |
| `audioDebug()` | mixer state, tracks and all 28 SFX with cached flags |
| `playMusic(name, fade?)` | `'title' \| 'battle-ffx' \| 'boss-dread'` |
| `playSfx(name)` | fire one cue; no-op before audio is unlocked |
| `setMuted(bool)` | mute/unmute the master bus |

```js
await window.__pyrefly.waitReady();
await window.__pyrefly.goto('demo');
await window.__pyrefly.frames(90);
window.__pyrefly.snapshotState();
```

## House rules

- TypeScript strict, ESM, explicit `.ts` extensions on relative imports.
- Every source file under 400 lines.
- `battle/` stays pure: no DOM, no Three.js, deterministic under a seeded RNG.
- No retail Square Enix assets, ever. All art, music and text are original.
</content>
</invoke>
