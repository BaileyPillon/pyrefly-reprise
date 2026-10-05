# Developing Echoes of Spira (formerly Pyrefly Reprise)

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

- Dev serves at `/`. **A plain build and preview serve under `/pyrefly-reprise/`**
  (`PROD_BASE` in `vite.config.ts`): the artifact of the old GitHub Pages address. The live
  site, https://echoesofspira.com, is the same files built with `BASE_PATH=/` (a user page or
  custom domain), which `tools/deploy-pages.mjs` sets for Cloudflare and, explicitly, for GitHub
  (`hostBuildEnv` in `tools/deploy-host.mjs`), so a `BASE_PATH` left in the shell never decides a
  deploy.
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
unit tests, `vite build --outDir dist-release` (with the host's `BASE_PATH`), every
gate on the finished build, then it publishes to the default host, **Cloudflare**
(the Worker `echoes-of-spira`, served at https://echoesofspira.com as a Custom Domain,
and at its workers.dev address as a backup), and verifies the live address serves this
exact artifact byte for byte. It appends one line per run to `docs/deploys.log` and
exits non-zero on any failure. `--host=github` publishes the old GitHub Pages address
instead (the "legacy" mode below).

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
- `--message="text"` appends free text to the commit message (GitHub) or the wrangler version note (Cloudflare).
- `--host=cloudflare|github` picks where to publish (default `cloudflare`, set by
  `DEFAULT_HOST` in `tools/deploy-host.mjs` since the switch of 2026-10-04). Only a deploy
  to the default host is "the live build": it alone writes `docs/deploys.log`, a critic
  marker and a ledger entry. `--host=github` is the **legacy** mode: the old address,
  https://baileypillon.github.io/pyrefly-reprise/, which carries the "we've moved" note on its
  title screen (saves made there stay there); it builds with `BASE_PATH=/pyrefly-reprise/`,
  force-pushes a throwaway single-commit `gh-pages`, kicks the Pages build, compares the files
  byte for byte, and records one line in `docs/legacy-deploys.log` only. Every gate above runs
  for both hosts; a legacy deploy needs the same review evidence or Bailey's override.
- `--kind=workers|pages` (Cloudflare only) picks the Cloudflare product: Workers static assets
  (the default) or Pages. Both are named `echoes-of-spira` (D-368, D-369).
- `--preview` (Cloudflare only) publishes to the preview instead: the Worker `echoes-of-spira-preview`,
  or the `preview` branch of the Pages project. The same gates (the release gate included), every
  file compared byte for byte, logged in `docs/preview-deploys.log` (never `docs/deploys.log`), no
  review obligation.
- `--create-project` (Pages only) creates the project first when the account has none.
- `--full-verify` (Cloudflare only) compares every file, not a sample.

Cloudflare serves from the root, so its build runs with `BASE_PATH=/` (set by the script
through Node's environment; from Git Bash a hand-typed `BASE_PATH=/` is rewritten to
`/Program Files/Git/` by MSYS, so use `MSYS_NO_PATHCONV=1` or PowerShell). It also needs
Node 22 or newer, the **pinned wrangler 4.147.0** and Bailey's own login (`npx wrangler
login`; the script checks it first and never logs in). The deploy finds wrangler by itself:
`PYREFLY_WRANGLER_BIN=<path to wrangler.js>` if set, else the repo's `node_modules/wrangler`,
else the standalone install named by `tools/cloudflare/wrangler-install.json`
(`D:/Tools/wrangler/4.147.0`, made with `npm ci --ignore-scripts` from the lockfile in
`tools/cloudflare/wrangler-install/`); a copy that is not the pinned version is skipped.
**Never run `npm install`, `npm ci` or even `npm install --dry-run` in the main tree or through a
worktree junction**: a dry run rewrites the shared hidden lockfile and a real install would
re-extract every package in it. wrangler is always spawned with stdin closed, so no prompt can
appear. The production config (`tools/cloudflare/wrangler.jsonc`) lists the Custom Domain, the
preview config (`wrangler.preview.jsonc`) has no routes, and the deploy refuses a mix-up. `www`
forwards to the apex through a dashboard Redirect Rule (wrangler cannot make one); the deploy
only looks and warns. Read [handoff/cf-switch.md](handoff/cf-switch.md) for the commands and the
dashboard steps, and [handoff/r39-cloudflare.md](handoff/r39-cloudflare.md) for the evidence and the limits.

Safe to run repeatedly — on GitHub, `dist-release/.git` is deleted and recreated every
run, so `gh-pages` always ends up with exactly one commit; on Cloudflare a repeated upload
skips the files Cloudflare already holds. A `--host=github` run requires the `gh`
CLI (hardcoded at `D:/Tools/GitHubCLI/gh.exe`) authenticated against
`BaileyPillon/pyrefly-reprise`.

**No source map ships (PR-0328, D-335; Bailey 2026-10-03).** A plain
`vite build` makes none. `tools/deploy-pages.mjs` builds with
`PYREFLY_SOURCEMAP_DIR=D:/Tools/pyrefly-sourcemaps/<sha>` set (the home folder
is `PYREFLY_SOURCEMAP_HOME` when you want another), which makes the bundler write
them `hidden` (no `sourceMappingURL` comment in the code); the `pyrefly-dist-filter`
plugin copies them into that folder and prunes them from the build. The deploy
refuses a build that still holds a `.map` file or a `sourceMappingURL` comment,
and `artifact-manifest.mjs` calls either a problem. To read a minified stack trace
from a live build, open `assets/index-<hash>.js.map` from that commit's folder
(DevTools "Add source map", or `source-map` in node). The release-36 maps were
22,775,896 bytes of a site held to 800,000,000 (D-332).

**The painted art ships as lossless WebP where that changes no pixel on any decoder (release 38,
"r38-bytes"; Bailey 2026-10-03; both games, shared build plumbing; handoff `docs/handoff/r38-bytes.md`).**
`public/art/**.png` stays the approved masters (hashes, backups and `verify-approved` unchanged). Every
production build, by any route (`npm run build`, the deploy, a critic's `vite build --outDir dist-gate`),
decides by the pixels of each master (the default, `exact`): a master that is opaque, or whose alpha is only 0
and 255 with no colour left under alpha 0, ships as a lossless WebP (premultiplying such a picture is the
identity, so a lossless WebP and its PNG are the same on every path in every engine); every other master, the 2x
ones included, ships as a PNG recompressed at maximum effort, its decoded RGBA (colour under alpha 0 included)
proved identical before it is cached, and its own bytes where that is not smaller. A master whose WebP would be under 64
bytes (a fully transparent layer is 28) ships as its PNG too, in every scope: Playwright's WebKit cannot load a WebP
that small (the re-check's B3: Paine's two catchlight layers, so her living pause portrait stayed static there).
Why: a browser may premultiply a
decoded image, and for a pixel of partial alpha that differs from decoder to decoder (the independent check of
2026-10-03 found Yunalesca's 2x master up to 124 in 255 apart once the matte reads it back through a 2D canvas),
and WebKit drops the colour under alpha 0 of a WebP. It is done by the `pyrefly-art-derive` plugin in
`vite.config.ts` (`tools/art-derive-plugin.mjs`, library `tools/art-derive-lib.mjs`, what is in a picture
`tools/art-image-facts.mjs`). The dev server and the unit suite still serve the PNGs. `artUrl`
(`src/engine/PaintedArt.ts`) hands the browser the file that ships (`src/engine/ArtShipped.ts`, fed by the
constant `__PYREFLY_ART_WEBP__` the build inserts), and the few functions that read an art URL apart take either
form (`tests/unit/art-url-sources.test.ts` pins the two rules: build art URLs with `artUrl`, match them through
`logicalArtUrl`). Encoding at maximum effort is slow once and cached by content hash in `PYREFLY_ART_CACHE`
(default `D:/Tools/pyrefly-art-cache`; safe to delete, it refills): `node tools/art-derive.mjs warm --jobs 8`
fills it ahead of a build, and a new painting adds seconds to the next build with nothing to remember (a new
painting with soft edges ships as a recompressed PNG, a clean cut-out as a WebP; nothing to decide).
`PYREFLY_ART_WEBP=off|partial|safe|exact|all` (default `exact`) is the switch; `off` ships the PNGs exactly as
before; `partial`, `safe` and `all` are not decoder independent, so the deploy's pixel gate refuses them and
they stay for measurement. The proofs, each of which the deploy or a reviewer can re-run on a built folder:
`node tools/art-derive.mjs verify --dir <build>` (every shipped file decodes to its master's RGBA in all four
channels, sha256, both sides decoded again from the files, and every shipped WebP is of a master that is opaque or
clean binary alpha, judged from the master, and none is under the 64-byte floor; the deploy runs it),
`node tools/art-derive.mjs audit --dir <build> [--baseline <earlier build>]` (no page,
stylesheet or data file names an art file the build left out; the deploy runs it),
`node tools/art-browser-load.mjs --dir <build> [--engines chromium,webkit]` (every image the build ships, the whole set
and no sample, loads and decodes at its master's size in Playwright's WebKit and Chromium, and every portrait plate
stays living; an engine that cannot start fails it; Playwright from node, about 20 s; the deploy runs it),
`node tools/art-play-audit.mjs --dir <build>` (a headless Chromium plays the title,
chapter select, every chapter's opening and the pause screen and fails on any
missing file, console error or art warning) and `node tools/art-browser-identity.mjs
--dir <build> --screen-exact` (the same pixels as Chromium decodes them, as a WebGL texture and on
a 2D canvas, over black and over white, with no file exempt); what it costs is `node tools/art-decode-cost.mjs --dir <build>` (decode time
of the WebP against the PNG) and `node tools/art-load-timing.mjs --before <url> --after <url>`
(the battle's first load against a PNG build). The build writes `art/derived.json` (every
mapping, with the master's pixel hash and transparency) beside the art.

**Every live build must be evaluated by the critic — no exceptions — and the
depth of the review follows what changed** (critic policy v2, approved by
Bailey on 2026-09-20; `critic/RUBRIC.md` sections 4 and 10). The sequence is
green tree -> push main -> `node tools/critic-plan.mjs` (which review this
change needs) -> review the production candidate (focused; deep BEFORE the
deploy when a shared system changed, and the deploy refuses without it) ->
deploy -> live verification of the exact artifact -> announce -> any deep
review still owed. The deploy publishes `artifact-manifest.json` (sha256 of
every shipped file, media decode-checked; its `artifactHash` leaves out only the
deploy-only `.nojekyll`, so the reviewed candidate and the deployed build hash
the same), compares the live bytes with it,
keeps a copy in `critic/artifacts/<sha>.json`, and leaves
`critic/pending/<sha>.json` listing that build's separate obligations (`live`,
`focused`, `deep`, `milestone`). Reviewers never delete a marker: they write a
report (`critic/reviews/`, `critic/rounds/`) and run
`node tools/critic-clear.mjs --report <file>`, which validates it and settles
only what that report can settle. `node tools/critic-score.mjs --report <file>`
does the score arithmetic and the acceptance gates. Run `npm run critic:status`
at any time to see what each live build still owes and which build the last
full score belongs to. The review workflows are `critic/runner/*.js`.

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
| `cam(name?)` | camera comfort preset, read or set: `'current'` (default) \| `'calm'` \| `'steady'` \| `'originals'` (FFX only); also `?cam=<name>`. Options awaiting Bailey's pick, `docs/concepts/fb2-0929/camera/` |

### Art resolution (release 39)

The device class, the master a figure is drawn from and the anti-aliasing are automatic (no setting, no save key); these force them for
captures and QA. Address parameters: `?arttier=phone|low|mid|high` (the device class), `?artscale=1..4` (pin every painting to one master;
the governor stands down), `?aa=off|smaa|msaa`, `?artlink=slow|fast` (the connection reading). `ArtBudget.ts` holds the numbers per class.

| Member | Meaning |
|--------|---------|
| `art.stats()` | the device class, its budget, the buffer width and the live stage's governor: masters resident, upgrades, evictions, `updateMs` (its own CPU per frame), the last decisions and what asked for each |
| `art.rigs()` | every battle-camera rig, at rest and pushed in, with the magnification each drawn figure would have from it |
| `art.shots()` | every painting the party holds with its painted height in approved texels (the held shots' sizes are arithmetic on it) |
| `art.plan()` | run the stage's look-ahead (every rig, the held shots by size) now |
| `art.tier(cls)` / `art.force(n)` / `art.aa(mode)` | the same as `?arttier=`, `?artscale=` and `?aa=`, from the console (`null` clears the first two) |

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
