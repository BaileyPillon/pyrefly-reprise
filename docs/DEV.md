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

### Text-floor sweep (CHK-003, CHK-002, CHK-009)

```
PYREFLY_BROWSER=gpu node tools/text-floor-sweep.mjs --base=http://127.0.0.1:5198/ \
    --out=docs/screenshots/<lane>/after --sizes=1600x900,2000x1012,3840x2160 \
    --screens=prep-ffx,prep-ffx2,results-ffx,pause-ffx,battle-ch9,battle-ch12,battle-ch1-sensor [--touch=1] [--floor=14] [--strict=1]
```
`--strict=1` exits 1 when any step has text under the floor or a screen could not be reached (CHK-003's pass and fail).
A fresh browser per window size and screen (CHK-002), the screen reached by real keys and pointer clicks (title, board, Enter,
Esc; a battle through `gotoChapter`), then every visible text node is walked (`tools/text-floor-probe.mjs`): font-size times the
scale of every ancestor (the 640x360 stage drawn at 2.5x prints 4.89 px as 12.2), the count under the floor, text boxes that
overprint, text cut by its own box. One JPEG and one JSON per step (`prep-ffx` steps through every tab, `pause-ffx` through
every tab of the strip with the plate and its D-450 extension recorded, `battle-ch1-sensor` opens the Sensor card and records
the six affinity chips). Point `--base` at a `vite` dev server (`--host 127.0.0.1`; a private `cacheDir` and no HMR keep it
quiet) or a `vite preview`; stop it by PID afterwards. Screens: `prep-ffx`, `prep-ffx2`, `results-ffx`, `results-ffx2`,
`pause-ffx`, `pause-ffx2`, `battle-ch1`, `battle-ch1-sensor`, `battle-ch9` (Yojimbo's gauge), `battle-ch12` (Omnis's strip).

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
npm run deploy -- --release=<name> [--skip-tests] [--allow-dirty] [--dry-run] [--message="text"]
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

- `--release=<name>` (**required** for every deploy that is not a `--preview`; Bailey, 2026-10-08) names the
  release, `39.5`, `39.4.2`. The name is stamped on the title screen's build number ("Release 39.5 · <commit>"):
  the tool hands it to `vite build` as `PYREFLY_RELEASE`, `vite.config.ts` defines `__PYREFLY_RELEASE__` from it
  (`tools/build-stamp.mjs`), and `docs/deploys.log` gets a trailing `release=`. The deploy **refuses** unless that name
  is the newest entry of the player notes (`src/app/changelog/releaseNotes.ts`: three to six lines in player words, each
  tagged FFX, FFX-2 or Both, newest first, written and committed BEFORE the deploy) and the notes are valid
  (`tools/release-notes.mjs`, pinned by `tests/unit/release-notes.test.ts` and `tests/unit/deploy-release-gate.test.ts`).
  The check runs first, before the Cloudflare login and before anything is built; a `--dry-run` prints it as a note.
  A `--preview` is stamped `Preview` (the title shows "Preview · <commit>"), needs no note and ignores the flag. A dev
  server or a hand-run build sets nothing and the title shows the commit alone.
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
production build, by any route (`npm run build`, the deploy, a critic's `node tools/candidate-build.mjs --out dist-gate`, which builds with the deploy's own environment (`tools/release-build.mjs`: the release name of the newest player note and the live host's base, `BASE_PATH=/`), so the reviewed bundle is the deployed one; serve it with `node tools/candidate-build.mjs --serve --out dist-gate --port N`, never a bare `vite preview`, which serves under `/pyrefly-reprise/`; release 61, `docs/handoff/release-build-parity.md`),
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
full score belongs to. The review workflows are `critic/runner/*.js`. The
**continuity harness** (`critic/runner/lib/continuity.mjs`, checks CHK-026 and
CHK-027; Bailey, 2026-10-04) plays chapters by real keys and watches every
rendered frame of the fight for size jumps, sliding feet, snaps, double images
and jerks, reading only `window.__pyrefly.app` and the engine state a running
build already exposes (no hook; its field names are pinned by
`tests/unit/critic-continuity-contract.test.ts`, so renaming `slots`, `active`,
`fade` or `stage.actors` in the presenter fails that test first). It needs
`PYREFLY_BROWSER=gpu`; see `critic/runner/lib/README.md`.

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


### Fight-start timeline (post-conference lane `post-fight-start`, PR-0481)

Press to first command menu, cut into parts, on a production build, by real input (a simulated pad) and the page's own clock. `tools/fight-start-timeline.mjs` drives one browser per job (`--path=demo|select`,
`--chapter=seymour-flux|ffx2-bahamut`, `--dwell=fast|human|long`, `--cache=cold|both`, `--frames=<dir>` for pictures at the same moments, `--profile` for a CPU profile) under the review-browser lock
(`tools/rig-record-lock.mjs`); `tools/fight-start-instrument.mjs` is the in-page half (marks taken at the call: the screen stack, the entry overlay, the loading card, the boss card); `tools/fight-start-split.mjs`
cuts a run into press-wait / party-prep / scene / after-scene / entry-load / first-draw / card / card-to-sweep / sweep / sweep-to-menu (`tests/unit/fight-start-split.test.ts`); `tools/fight-start-report.mjs`
puts the runs of two builds side by side; `tools/fight-start-profile.mjs` reads a CPU profile of the production bundle through its hidden source maps (`PYREFLY_SOURCEMAP_DIR`); `tools/fight-start-frames.mjs`
compares the frames of two builds. A production build does not fit twice on D: (11 GB): `tools/lean-vite.config.mts` builds the bundle only (the same bytes: release 64's commit with its deploy
environment reproduces the live `index-BygGxbJE.js`) and `tools/overlay-static.mjs` serves it over the art of any full build (for example the live artifact, `dist-release`), answering as Cloudflare does
(`/assets/*` immutable, everything else revalidated). Details and the numbers: `docs/handoff/post-fight-start.md`.

### Measuring motion fluidity (the motion-fluidity pass, lane L5; tooling, both games)

All of these serve a built candidate read-only (`--dist <folder>`, e.g. a review's `dist-gate`), take the `RIG-RECORD` lock for their own browser job, and stamp their output with the tool's identity. Details: `critic/runner/lib/README.md`, `docs/handoff/mf-l5-tools.md`.

| What | Command |
|---|---|
| Frame pacing of a fight (animation time lost a minute; never from the continuity probe or a trace) | `node tools/pace.mjs --dist <dir> --chapter ffx2-bahamut --size 2560x1440 --label ch4-1440-cap` (`--analyze <run dir>` re-reads one) |
| 60 / 120 / 144 Hz equality of one scripted moment | `node tools/hz-matrix.mjs --dist <dir> --chapter seymour-flux` (`--judge <dir>` judges captures again) |
| Velocity jolts per fight, against a baseline | `node tools/jolts.mjs --dist <dir> --chapter ffx2-bahamut --hz 60 --label a [--out <dir>]`, at least 3 captures a side; the verdict is `node tools/jolts.mjs --set a.json,b.json,c.json --baseline-set d.json,e.json,f.json` (a lone capture cannot size the spread of the fight itself, so one capture against one is NOT A VERDICT); `--rec <recording.json>` counts a saved recording; judged on an exactly 1/60 s grid (`--raw`: the curves lane's every-frame method, never across rates); a comparison across unlike runs is refused (exit 2) |
| A blind phone clip card of look variants (address words on one build) | `node tools/ab-clip.mjs --spec <card.json> --dist <built folder>` (exit 3 and FAILED.txt when the moment the spec names never happened); examples in `tools/measure/examples/`; from an existing side-by-side clip: `node tools/ab-video.mjs --src <clip.mp4> --id ... --chapter ch1 --move ...` |
| Does the FFX-2 ready shimmer restart with each HUD rebuild | `node tools/atb-shimmer.mjs --dist <dir>` |
| Who allocates per frame | `node tools/alloc-profile.mjs --dist <dir> --chapter ffx2-bahamut --seconds 60` |

## The conference demo build's switches (release 60)

Bailey's picks of 2026-10-20 (decision 157; "I demo my game in a week at a huge gaming conference"). Presentation and seed choice only: no engine, no rule, no game number changes, and the three goldens
do not move. Every switch below is read once from the address; the page needs no flag to play the demo as designed.

| What | Default | How to change it | Game case |
|------|---------|------------------|-----------|
| **HD-2D look at BOLD strength** (`src/engine/look/`: the tilt-shift backdrop, light shafts, motes, the grade, the normal-map light on the figures, contact shadows, the floor reflection) | **ON in Chapter I (`seymour-flux`) and Chapter IV (`ffx2-bahamut`) only**, every other chapter plays today's frame | `?look=off` turns it off everywhere; any `?look=hd2d\|cinematic\|anime` is the address's word everywhere (`?look=hd2d&lookstrength=bold` forces it in any chapter); `?lookq=high\|medium\|low` is the quality | Chapter I FFX only, Chapter IV FFX-2 only (the rooms are keyed by chapter id: three other chapters borrow those paintings as placeholders and are not authored for the look) |
| **The conference pack** (r64, Bailey 2026-10-24, item 200b: the motion pack, the F1 HUD, the sound pass, the pro look, camera and staging, the boss re-cut, the fight prebuild, the booth screens; the party's edge light OFF) | **ON** in Chapter I (`seymour-flux`, FFX) and Chapter IV (`ffx2-bahamut`, FFX-2), with no `?pack=demo`, **on a desktop-class screen only (R63-P1): a phone (a page 599 px wide or less, or a touch-first screen whose short side is 1024 px or less, so a tablet or a phone held sideways too) opens with it OFF**, decided once at load (`packScreen()`; a rotation or a resize never swaps the HUD mid-fight; `setPackScreen('phone'\|'desk'\|null)` for tests); every other chapter and screen is release 62 | `?pack=demo` forces it on on any screen (the booth address); `?pack=off` is the old behaviour as a whole; each lane's own word still wins (`?pro=off`, `?hud=today`, `?audio=today`, `?boss=today`, `?prebuild=off`, `?booth=today`, `?punch=today`, ...); `?partyrim=on` brings the party's rim back; `PACK_DEFAULT_ON` in `engine/motion/DemoGate.ts` is the one line; [r64-defaults](handoff/r64-defaults.md) | both games |
| **Demo motion** (smoother pose blends, breathing, hit feel: `src/engine/motion/Demo*.ts`) | **ON** in a page | `?motion=off` (or `?motion=classic`) turns it off | both games |
| **FFX-2 ready hold** (post-flicker, post-conference motion plan step 2; `KeyPoses.readyCarriesIntoWindUp`: a girl who attacks from her menu keeps the menu's `ready` into the attack, no ready, idle, ready) | **ON** | `?motion=classic` (or `window.__pyrefly.motionMode('classic')`) brings the old turn start back for a side-by-side; REDUCE MOTION and a figure with no painted `ready` never hold | FFX-2 only |
| **FFX-2 interludes** (motion-fluidity pass, MF-01, lane L1; `KeyPoses.readyCarriesIntoCastOrItem`: a girl who casts or uses an item from her menu keeps the menu's `ready` into the spell, no ready, idle, cast; no look change) | **ON** (`?interlude=all`) | `?interlude=attack` is post-flicker's attack-only hold (the "before" of the measure); `?motion=classic` brings the old turn start back; REDUCE MOTION and a figure with no painting of the pose never hold; NOT tied to the pack: plays in all seven FFX-2 chapters and under `?pack=off`; [mf-l1-swaps](handoff/mf-l1-swaps.md) | FFX-2 only |
| **Ready stance painting** (MF-05, lane L1; `motion/StanceSwap.ts`: the command menu's `ready` is a state (lean, ring) AND a painting; the real game keeps the idle loop while the menu is open) | **`v1a`** since release 67 (Bailey's pick, the driver's call under his delegation; `STANCE_DEFAULT` in `SwapSwitch.ts`; the menu keeps the idle painting, the ready painting shows only as an attack's wind-up) | `?stance=today` is release 66's look (the ready painting), `?stance=v1b` (no ready painting anywhere), `?stance=v3` (today's two paintings, the change a 50 ms three-frame blend); the pack chapters only unless `?swapscope=wide` or `all` (below), and with the pack off (`?pack=off`, a phone or a tablet) it is `today`; `__pyrefly.swapSwitch({ stance })` | both games |
| **Swaps with a cause** (MF-06, lane L1; `motion/SwapSwitch.ts`, `SwapClass.ts`) | **`pick`** since release 67 (Bailey's pick, the driver's call under his delegation; `CAUSE_DEFAULT` in `SwapSwitch.ts`) | `?swapcause=today` is release 66's look, `?swapcause=cut` (a cut inside the smear on the contact, the hit, the glow, the toss, the critical stance, and at rest), `?swapcause=blend3` (a 50 ms three-frame blend; unguarded, the plan's V2 arm: it pops far-apart drawings, so never a pick), `?swapcause=pick` (cut where the moment has a cover, a blend where it has none and the pair is close); `?swapclass=contact,hit,...` limits the classes (a word naming none that exist turns none on); the pack chapters only unless `?swapscope=wide` or `all` (below), and with the pack off it is `today`; `__pyrefly.swapSwitch({ cause, classes })` | both games |
| **Hit reaction** (MF-03, lane L2; `motion/HitBeat.ts`, `HitReaction.ts`, the table in `motion/MoveSwitch.ts`) | **`knock`** since release 67 (Bailey's pick, the driver's call under his delegation; `MOVE_DEFAULTS` in `MoveSwitch.ts`: a push away from the attacker sized by the blow, a spring back, a contact squash through the hit-stop) | `?hit=today` is release 66's look (the shake and the recoil), `?hit=ramp` (the rattle starts at zero and is seeded from the blow); every chapter of both games (not pack-gated); `__pyrefly.move('hit', 'today')`; the other five lane L2 words (`kotopple`, `hurtstring`, `summon`, `ramps`, `shakeband`) stay `today`; `run` and `rigko` took their picks in message 2 and `strikeshape` its default with the curves (the next rows) | both games |
| **FFX-2 run, leap and lunge** (MF-04, lane L2; `motion/RunEase.ts`, `BattleScreenRunIn.ts`) | **`flow`** since release 67 (message 2 of Bailey's look choices, the driver's call under his delegation; `MOVE_DEFAULTS.run` in `MoveSwitch.ts`): a trapezoid run and a leap that leaves and meets the floor at rest, and the strike is asked for as she brakes (a 14 px pull, a 7 percent crouch), so the stand before the lunge is gone and the move is about 0.14 s shorter | `?run=today` is release 66's look (a bell of speed and a stand before the lunge), `?run=smooth` (the trapezoid and the leap only), `?run=pace` (about three body heights a second); `flow` needs the new curves (Chapter IV), so **Chapter V, a page with the pack off and a phone play the smooth run with today's strike**; not pack-gated (the word never was); under an open FFX-2 command menu there is no run-in at all (D-357); `__pyrefly.move('run', 'today')`; [mf-l2-moves](handoff/mf-l2-moves.md) | FFX-2 only |
| **Real-clip curves** (MF-14; `motion/CurvesSwitch.ts`, `RealMotion.ts`, `data/motion/realMotion.ts`) | **`real-snappy`** since release 67 (message 2, the driver's call under Bailey's delegation; `CURVES_DEFAULT` in `CurvesSwitch.ts`): the strike, the cast lift, the hit recovery and the run home follow the real game's clips, scaled to the 1.1 s pick. **Release 66's `new` (the house profile at 1.1 s) is `?curves=new`** | `?curves=today` turns the curves OFF (release 62's, as it always did), `?curves=real` (the clips at their own speed), `?curves=new`; the scope is unchanged: Chapter I and Chapter IV only, the pack on, a desktop-class screen (`?pack=off` and a phone read `today`); **`?strikeshape=travel` (MF-14 V3, `MOVE_DEFAULTS.strikeshape`) is the default since release 67** (the driver's call under Bailey's delegation, a follow-on to the pick: the real-snappy dash is the house dash, FFX 250 ms and FFX-2 200 after a wind-up of at least 300 ms, so a strike travels over about a fifth of a second instead of jumping in one frame; for a figure whose clip leaps (Tidus, Wakka, Seymour Flux, Bahamut) the approach is one leap over wind-up plus travel, Tidus 558 ms). It acts only where `real-snappy` plays (`?curves=new`, `today`, `real`, `?pack=off` and a phone never read it). **`?strikeshape=today` is the clip's own dash** (Paine's is 228 px in one 60 Hz frame at 2,560 wide, the plan's guard is about 60 at 1,600: the CP-05 cards); `__pyrefly.curves(mode)`, `__pyrefly.move('strikeshape', 'today')` | both games |
| **Rig boss KO and return** (MF-11, lane L2; `rig/RigHandoff.ts`: Seymour Flux in Chapter I, Bahamut in Chapter IV) | **`whole`** since release 67 (message 2, the driver's call under Bailey's delegation; `MOVE_DEFAULTS.rigko` in `MoveSwitch.ts`): the ko key is the whole fall (no generic sink, no 22 px rise), the thud on the key's end, and the idle key waits for the strike to be over | `?rigko=today` is release 66's look; not pack-gated (the word never was; only a rig has a ko key to take whole); `__pyrefly.move('rigko', 'today')` | both games |
| **Retry from the fight itself** (round 30's PR-0481; `app/demo/demoDefeat.ts` `publicQuickRetry`, one line in `BattleScreenFlow.runChapter`) | **ON** since release 67 on the public address, **Chapter I (FFX) only**: attempt 2 and every later one of the same fight open hurried, as the demo path's quick retry has since release 63 (the card for 0.7 s, the sweep cut, the boss's reveal and recorded roar skipped; the fight itself is unchanged). Attempt 1 and every other chapter (Chapter IV FFX-2 included) keep the authored opening | `?retryopening=full` is release 66's retry; the demo path is unchanged and still hurries both demo chapters; the retried theme and the stage warm behind the card stay demo-only; the party prep still comes up on a public retry | FFX only |
| **Defeat card names its cause** (round 30's PR-0546; `BattlePresenterStaging.noteFoeMove` and `stageFall`) | **ON at every battle speed** since release 67: "Felled by <the foe's last move>" also at SKIP speed, where the staging itself stays off (no dim, no caption, today's black flash) | the card is the pro staging's (Chapter I and Chapter IV, the pack on); with the staging at today's, in another chapter or with the ending piece taken back there is no card and no note | both games |
| **Swap scope** (MF-22, lane L1 for the capability, lane pc-scope for the wide scope) | `pack` (`SCOPE_DEFAULT` in `SwapSwitch.ts`: ONE line to flip to `wide` after the browser measurement) | `?swapscope=pack` (Chapter I and IV only, release 67's reach; `today` is the same), `?swapscope=wide` (all nineteen listed chapters, `WIDE_CHAPTERS`, except the ones in `SCOPE_EXCEPTIONS`, each with its written reason: Yunalesca today, until `?cutanchor=on` has been run there), `?swapscope=all` (every chapter id with no exception: the measuring word); plays `?stance` and `?swapcause` and the smear they ride on; needs the pack on; `__pyrefly.swapSwitch({ scope })` also returns `scopeExceptions`; `__pyrefly.swapReasons(reset?)` is why the presenter asked for each painting and every designed blend (`{ reasons, designed }`; `swapLog()` stays the older `?swap=aligned` record) | both games |
| **Cut-side anchor** (MF-18, lane pc-scope; `motion/CutAnchor.ts`) | `today` in both games (`CUT_ANCHOR_DEFAULT`: one word PER GAME, `{ ffx, ffx2 }`, because the evidence is FFX's) | `?cutanchor=on`: on a plane cut whose two heads are more than 0.12 of the figure's height apart (x), the incoming plane is drawn back toward the old head so 0.12 is left at the cut (the cut frame carries the whole shift at any display rate and pace), then eases home over 80 to 150 ms on the blend's own clock (an ease-out, so the same at 60, 120 and 144 Hz); `?cutanchor=moving` does it only for a figure that is travelling (speed 0.45 body heights a second or more); sideways only: the feet keep the floor line (y) but DO slide sideways by the shift, which the continuity harness excuses as a designed shift (policy `continuity.smear.glideFeet`, up to the logged share, reported as `summary.size.feetDesigned` and `smear.glide`); a pair under the cap, a blend, a rig and a cut under an open FFX-2 menu are untouched; `?swap=aligned` turns it off (same field); the planned-smear log entry carries `glide: { share, ms }`; `__pyrefly.swapSwitch({ cutAnchor })` | both games (mechanism); the default is a table per game (rule 14) |
| **A ready painting that is not the figure** (PR-0517, pc-residues; `motion/ReadyIdentity.ts`, `src/data/art/readyIdentity.ts` generated by `node tools/pose-identity.mjs --write`: the colour distance per body region against the idle, the attack as the ceiling, 2.5 times over fails; `--check` fails on a repaint nobody re-measured) | **ON** for the three dresses that fail it: Paine Warrior (white top over a black jacket), Yuna White Mage (hood down against a hood up), Rikku Warrior (hair): the menu and the attack's wind-up keep the IDLE painting (the ready stance, lean and ring, stay: `setPose('ready', { paint: 'idle' })`, `?stance=v1b`'s rule for that one figure), **wherever the stance look plays** (review M5, 2026-10-28: the two pack chapters with the pack on, a desktop-class screen, or any chapter under `?swapscope=all`, and a stance word that is not `today`; under `v1a`, the default, the ready painting is shown only as a wind-up, so Yuna White Mage, who has no attack painting, never shows hers: only `?stance=v3` shows the menu) | `?readyid=today` brings their ready painting back alone; `?stance=today`, `?pack=off`, a phone, a tablet and a chapter outside the pack are release 66's ready painting too | FFX-2 only in effect (the three are FFX-2 dresses); plumbing for both games |
| **Hit feel, two release-60 rules** | an ordinary hit holds at least the shipped game's light hold (FFX 40 ms, FFX-2 28 ms); the 0.08 s white flash is scaled down on big figures (full to a plane area of 3.5, 0.4 from 9, measured: party 1.2 to 2.6, Mortiorchis 16, Bahamut 17, Seymour Flux 23) and **REDUCE FLASHES skips it** | with the demo motion off the game plays the shipped hit | both games |
| **Demo mode** (`src/app/demoMode.ts`) | OFF | `?demo=1` (kept in `sessionStorage` for the tab; `?demo=0` clears it); `__pyrefly.demoMode(on?)` | Chapter I FFX only, Chapter IV FFX-2 only |
| **Demo stage warm** (release 62, PR-0481; `src/app/demo/demoWarm.ts`: both fights' paintings, stage, programs and depth-plate cut are prepared behind the title and the picker, in demo mode only) | **ON** in demo mode | `?demowarm=off` is the release 61 behaviour (the kiosk address can carry it); `window.__demoWarmLog` lists the steps taken and when | both games |
| **The boss card's hold after a loading card** (post-conference, `post-fight-start`; `src/ui/common/transitions/cardHold.ts`: a fight that loads behind the entry has shown the card over the ink for as long as the load took; the battle's own card counts that time, holds the rest of its 1.9 s and never under 1000 ms: the entry's reveal is measured 929 to 962 ms in FFX, 701 to 785 ms in FFX-2) | **ON** (changes nothing where no loading card went up: every fight whose stage is ready when the entry begins) | `?cardhold=full` is release 64's behaviour (the whole 1.9 s after the loading card too) | both games |
| **The opening's first frame under the boss card** (post-conference, `post-fight-start`; `src/engine/OpeningPark.ts`, `BattleMoments.coverOpening`, `BattleStartBanner` `covered`: as the card starts to leave, the HUD goes down and the party to alpha 0 under it, where the opening starts from, so the card no longer fades onto a party and a HUD that are about to vanish; the opening itself, the camera and the slide are untouched) | **ON** (nothing for a hurried opening or a run at `skip`) | `?opencover=off` is release 64's behaviour (the card fades onto the party at home with the HUD up, then the opening takes them down) | both games |
| **The look's alpha fields, made in a worker** (motion-fluidity pass, lane `mf-l4-freezes`, MF-02; `src/engine/look/AlphaThumb.ts`, `alphaThumb.worker.ts`, `alphaArea.ts`: a pool of two workers decodes a figure's painting when it loads and makes the 128 x 128 extents field, its second opinion and the breathing rig's 32 x 48 field, so the first frame that shows a pose reads nothing; at most 4 jobs out at once, a job silent for 20 s is given up on, a browser with no `OffscreenCanvas` makes no worker. The breathing field is the page's own byte for byte; the extents field is within one cell of 128 of the page's, or the page reads the painting itself) | **ON** | `?alphathumb=off` is release 64's reading (every reader reads its own); `__pyrefly.art.stats().alpha` lists asked, landed, failed, refused, timedOut, queued | both games |
| **The warm pool's width** (MF-02, `ArtMemory.ts`: the high device class may stage 1,092 MB of speculative masters, hot poses before cold, instead of 640; still inside the class budget, and about 0.4 to 0.7 GB more GPU memory is resident in Chapter I from the start on this PC) | **ON** (high class only) | `?warmpool=old` is the 640 MB | both games |
| **The frame-budget governor's clock** (MF-10, `governor/FrameBudget.ts`, `DemoGovernor.ts`: reads the display's own frame timestamps, holds out a window with a load event in it and gives a level back after 4 s of calm; today's reading sat at level 3 for 90 percent of a Chapter I fight on this PC) | **OFF** (release 64's reading) | `?govern=fixed` turns it on (T-06 on the booth display decides); `?govern=off` is no governor at all | both games |

**Demo mode** changes one thing: which seed a fresh attempt of a demo chapter fights on (the seed only picks which of the fight's own rolls come up, as the ordinary fresh draw does, `src/app/runSeed.ts`).
Chapter I takes the next of seeds **7, 10, 12** (the RE audit's, each proved on the FFX engine in `tests/unit/demo-mode.test.ts`: the party's first command menu, Tidus's, comes after three log
events and before any enemy act, nobody down; the shipped line wins all three; seed 7 loses no one for the whole fight), counted per tab so every fresh attempt rotates, and a retry inside the run takes the one
after instead of `+ 1000`. Chapter IV (FFX-2) takes seed **56**, picked on the engine at Wait from sixty seeds: a win at 98.1 s of engine time with no girl down and one Mega Flare, so a person at Wait lands in a
two-to-three-minute slot. A seed the caller names (`gotoChapter`'s `seed`) or pins (`setSeed`) wins over demo mode; without `?demo=1` the seeds are exactly what they were.

The figures' light and the backdrop's depth fog read the maps lane's PNGs (`<painting>.normal.png`, `<painting>@2x.normal.png`, `backdrops/<room>.depth.png`; `D:/pyrefly-art-maps`, `MAPS-README.txt` there). A
build whose art folder lacks them still plays the look (the figures are unlit, the fog is the height fog) and each missing map is one 404 in the console; the dev server of the demo harness serves them from the mirror.

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
| `demoMode(on?)` | release 60: whether demo mode (`?demo=1`, the conference demo's seeds: see "The conference demo build's switches") is on; `demoMode(true\|false)` flips it for the runs that start from now on. `demoMotion(on?)` does the same for the demo motion |
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
the governor stands down), `?aa=off|smaa|msaa` (the renderer's own anti-aliasing after the grade: off on every class now, see "Sharpness" below), `?artlink=slow|fast` (the connection reading). `ArtBudget.ts` holds the numbers per class.

| Member | Meaning |
|--------|---------|
| `art.stats()` | the device class, its budget, the buffer width and the live stage's governor: masters resident, upgrades, evictions, `updateMs` (its own CPU per frame), the last decisions and what asked for each |
| `art.rigs()` | every battle-camera rig, at rest and pushed in, with the magnification each drawn figure would have from it |
| `art.shots()` | every painting the party holds with its painted height in approved texels (the held shots' sizes are arithmetic on it) |
| `art.plan()` | run the stage's look-ahead (every rig, the held shots by size) now |
| `art.tier(cls)` / `art.force(n)` / `art.aa(mode)` | the same as `?arttier=`, `?artscale=` and `?aa=`, from the console (`null` clears the first two) |

### Sharpness (release 39, "F plus")

The standard view's sharpness follows a ladder, automatic like the art tiers (no setting, no save key; `src/engine/crisp/`, handoff `docs/handoff/r39-looks.md`).
The scene is drawn 2x wider and taller and resolved with a Lanczos-3 filter before the bloom, a light contrast-adaptive sharpen runs right before the
grade, and neither SMAA pass runs (the supersample is the anti-aliasing). The rung comes from the device class (`?arttier=`), then a frame-time governor
that can only take it down: a median frame interval over about 2 s above 22 ms (about 45 frames a second) is one rung down.

| Rung | What | Who |
|------|------|-----|
| `fplus` | 2x supersample, sharpen 0.3, no SMAA | the high class (a discrete GPU) |
| `f` | 1.5x supersample, sharpen 0.4, no SMAA | the mid class; where `fplus` steps down to |
| `a2` | no supersample, no sharpen, the MAX mix's one SMAA before the grade (live release 38's frame) | the low class (software GL, so the default SwiftShader browser and its golden screenshots are unchanged); LOW EFFECTS; the floor |
| `phone` | today's frame: no supersample, the MAX mix's one FXAA | the phone layout and the phone effects tier |

Address parameters (captures and QA; each pins the frame, so the governor stands down, as `?artscale=` does for the art): `?crisp=fplus|f|a2|a|phone|ref3`
(also `g2` for `fplus` and `g1` for `f`, the crispness options page's names; `a` is release 39 as first built, two SMAA passes; `ref3` is the 3x reference every
sharpness number was measured against), the single levers `ss=1..4`, `cas=0..1` and `aapre=0|1` over it, and `?crispbudget=<ms>` for the governor's budget.
A capture that must not change look mid-run should pin (`?crisp=fplus`): under load the governor will step a busy machine down, by design.

| Member | Meaning |
|--------|---------|
| `crisp.report()` | the rung in force, whether it is pinned, the config, the device class and effects tier, the effective supersample, the governor's windows (`rung`, `median`, `samples`, `stepped`) and the composer's passes by name |
| `crisp.get()` / `crisp.rung()` | the config and the rung name in force |
| `crisp.preset(name)` / `crisp.set(patch)` | pin a named end state (`crisp.presets` lists them) or change single levers; `crisp.unpin()` hands the frame back to the device |
| `crisp.simulate(ms)` | add `ms` to every frame interval the governor reads (a simulated slow frame; `null` stops it) |

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
- Retail assets and cloned voices of the original cast are allowed since 2026-10-18 (Bailey's words are in AGENTS.md hard rule 8); `public/art/` still never goes to `main`.
