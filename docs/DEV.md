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
| Watch new renders land | `node tools/art-watch.mjs [--port=8890]` → http://127.0.0.1:8890/ |
| Music/SFX preview | `node tools/render-track.mjs all --out=docs/audio` |

### Ports and base path

- Dev serves at `/`. **Build and preview serve under `/pyrefly-reprise/`**
  (`PROD_BASE` in `vite.config.ts`), so the preview is byte-identical to the
  GitHub Pages artifact. Set `BASE_PATH=/` for a user page or custom domain.
- The preview port is **4319** by default (4173 is a common squatter). Both
  `playwright.config.ts` and `tools/screenshot.mjs` read `PREVIEW_PORT`:
  `PREVIEW_PORT=4500 npm run test:e2e`.
- Headless WebGL runs on SwiftShader by default. The Chromium flag list is
  duplicated in `playwright.config.ts` (`CHROMIUM_ARGS`, via `tools/browser-mode.mjs`)
  and `tools/screenshot.mjs` — keep them in sync. See "Fast browser" below for
  an opt-in GPU mode that is ~15-20x faster on this machine.

### Fast browser (opt-in GPU headless)

SwiftShader is deterministic — same pixels on this machine, CI, or another
dev's laptop — but it is a software rasterizer, and this game is a full
Three.js WebGL scene. On this machine (RTX 5070 Ti) it draws at **about 3 fps**
measured idle, and a Chapter 1 battle did not reach its first command menu in
90 s. That is what makes local iteration (and a full critic round) slow.

`PYREFLY_BROWSER=gpu` switches Chromium to the real GPU instead, still
headless. `tools/browser-mode.mjs` exports both arg sets
(`SWIFTSHADER_ARGS`, `GPU_ARGS`) plus `resolveBrowserMode()` /
`currentChromiumArgs()`; `playwright.config.ts` reads the env var through it.
Any other script that launches its own Chromium (e.g. a future harness tool)
should import from the same module rather than hardcoding a third copy.

```
PYREFLY_BROWSER=gpu npm run test:e2e
PYREFLY_BROWSER=gpu npx playwright test tests/e2e/boot.spec.ts
```

**Measured on this machine** (`tools/zz-measure-gpu.tmp.mjs`, a scratch
script; not committed — the numbers below are its output), against a static
`vite build` served by `vite preview` (no HMR, so a concurrent agent editing
`src/` cannot tear down the page mid-measurement — the dev server does not
have that guarantee and produced "Execution context was destroyed" errors
during this investigation):

| | SwiftShader (default) | GPU (`PYREFLY_BROWSER=gpu`) |
|---|---|---|
| `WEBGL_debug_renderer_info` | `SwiftShader Device (Subzero)` | `NVIDIA GeForce RTX 5070 Ti … D3D11` |
| Boot to `__pyreflyReady` | 363 ms | 309 ms |
| Idle-scene FPS (`demo` screen, rAF count / 8 s) | **3.00 fps** | **59.63 fps** |
| Chapter 1 (`seymour-flux`) time to first command menu | **>90 s (timed out)** | **11.3 s** |
| In-battle FPS (rAF count / 8 s) | not reached | **50.00 fps** |
| Real end-to-end check | — | `PYREFLY_BROWSER=gpu npx playwright test tests/e2e/boot.spec.ts` passed, 2/2, in 58.8 s total run time |

GPU mode is reliably faster — roughly **20x** the raw frame rate, and it turns
a battle that could not open its command menu inside a 90 s budget into an 11 s
wait. SwiftShader stays the default for everything that must be reproducible
(CI, golden images, another machine); GPU is an opt-in for a human iterating
locally.

**Caveats:**
- **Never use GPU mode for pixel-exact goldens.** ANGLE's D3D11 backend
  antialiases and rounds slightly differently from SwiftShader's Vulkan path;
  screenshots can differ by a pixel or two. `tools/screenshot.mjs` and any
  golden-image comparison should keep using the default.
- **The GPU is shared with ComfyUI.** `D:\Tools\ComfyUI` renders paintings on
  the same RTX 5070 Ti (AGENTS.md hard rule 12). During this investigation
  ComfyUI was using ~84% GPU utilization and ~15/16 GB VRAM, and one GPU-mode
  Chromium launch under that load hit "Execution context was destroyed"
  before it produced a usable page. If GPU mode misbehaves, check
  `nvidia-smi` for VRAM headroom before assuming the flags are wrong.
- GPU mode still needs a real GPU with current drivers; it silently falls
  back toward software rendering on a machine without one, so a suspiciously
  slow GPU-mode run should be checked with the renderer-string snippet below
  rather than trusted.
- To confirm which renderer a run actually used, from inside a test:
  ```js
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2');
  const dbg = gl.getExtension('WEBGL_debug_renderer_info');
  console.log(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL));
  ```

### Screenshot tool

```
node tools/screenshot.mjs [--out=PATH] [--screen=NAME] [--frames=N]
                          [--width=1600] [--height=900] [--port=4319]
                          [--url=http://localhost:5173/] [--timeout=30000] [--headed]
```
With no `--url` it starts its own `vite preview`, so run `npm run build` first.

### Art-watch gallery

```
node tools/art-watch.mjs [--port=8890]
```

Dependency-free (Node built-ins only) auto-refreshing gallery at
`http://127.0.0.1:8890/` for watching AI renders land in real time. On every
request it rescans `D:/Tools/ComfyUI/output/pyrefly`, `public/art/pause`,
`public/art/characters/*/` (one level deep, skipping `*.raw.png`),
`public/art/portraits`, `docs/screenshots/concept` and
`docs/screenshots/pause`, and shows the newest 80 `*.png` files by mtime.
The page meta-refreshes every 20s; thumbnails are served through `/img?p=`,
which only serves files that resolve inside one of those folders.

Registered as the **PyreflyArtWatch** scheduled task (`schtasks`, `ONLOGON`)
so it comes back after every reboot — no need to start it by hand. Re-create
it with:
```
schtasks /Create /SC ONLOGON /TN PyreflyArtWatch /TR "node \"D:\Final Fantasy\tools\art-watch.mjs\"" /F
```

### Deploy

```
npm run deploy -- [--skip-tests] [--allow-dirty] [--dry-run] [--message="text"]
```

`tools/deploy-pages.mjs` does the whole release in one command: type-check +
unit tests, `vite build --outDir dist-release`, re-init `dist-release` as a
throwaway single-commit `gh-pages` git repo and force-push it, kick a Pages
build and poll it to completion, then verify the live site serves the same
bundle and that art assets resolve. It appends one line per run to
`docs/deploys.log` and exits non-zero on any failure.

The dirty-tree check only refuses on **build-relevant** paths — `src/`,
`tests/`, `tools/`, `public/` outside `public/art/`, `index.html`,
`package*.json`, `vite.config.*`, `tsconfig*.json`, and anything else it does
not recognise — so a release is no longer lost when the art fleet drops a file
into `docs/**`, `critic/scratch/**`, `public/art/**`, `tools/gen/sheet-*.json`
or `tools/zz-*.tmp.*` during the preflight. Those fleet paths are printed as a
warning and the deploy continues; the rules live in `tools/deploy-classify.mjs`
and are pinned by `tests/unit/deploy-dirty-classify.test.ts`.

- `--skip-tests` skips the `tsc`/`vitest` preflight.
- `--allow-dirty` deploys even when a build-relevant path is dirty
  (the dirty files are still printed); without it, such a tree aborts.
- `--dry-run` stops right after the dirty-tree check and prints how each dirty
  path was classified — useful for confirming the tree is only fleet noise.
- `--message="text"` appends free text to the gh-pages commit message.

Safe to run repeatedly — `dist-release/.git` is deleted and recreated every
run, so `gh-pages` always ends up with exactly one commit. Requires the `gh`
CLI (hardcoded at `D:/Tools/GitHubCLI/gh.exe`) authenticated against
`BaileyPillon/pyrefly-reprise`.

**Every live build must be evaluated by the critic — no exceptions.** The
mandatory sequence is green tree -> push main -> deploy -> announce -> a full
critic round on the live URL, and only the chief critic's report for that
exact build clears the `critic/pending/<sha>.json` marker the deploy just
left behind (see `critic/RUBRIC.md`, "The loop"). Run `npm run critic:status`
at any time to see which live builds are still waiting on a round.

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
| `setSeed(n)` / `seed()` | RNG seed for the **next** battle started (engines are seeded per battle via `BattleSetup.seed`): `gotoChapter`'s default, and it also **pins every run started from real keys** to `n`. Without a `setSeed`, a run the player starts draws a fresh first seed (PR-0008, both games; `src/app/runSeed.ts`); a retry still adds 1000 per attempt. A capture or spec that walks in from the title and needs a fixed fight calls `setSeed(1)` after `waitReady()`, before its first key. `battleState().seed` reads the seed a live battle is on |
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
