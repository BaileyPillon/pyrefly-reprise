# build (a) — fast-browser track

Owner files: `playwright.config.ts`, `tools/browser-mode.mjs` (+ `tools/browser-mode.d.mts`),
`docs/DEV.md` ("Fast browser" section). No product code touched — only test
infrastructure.

## The task

Headless Chromium here runs on SwiftShader (software WebGL) so results are
reproducible on any machine, but this is a full Three.js game and SwiftShader
draws it at low single-digit fps, making a browser check slow. The machine has
an NVIDIA RTX 5070 Ti. Find launch settings that let Playwright's headless
Chromium use the real GPU, measure whether it is actually faster, and if so
add it as an opt-in that never becomes the default (SwiftShader stays the
default for determinism).

## What changed

- **`tools/browser-mode.mjs`** (new, Node built-ins only): exports
  `SWIFTSHADER_ARGS`, `GPU_ARGS`, `resolveBrowserMode(env?)` (reads
  `PYREFLY_BROWSER`, defaults to `'swiftshader'`), `chromiumArgsForMode(mode)`
  and `currentChromiumArgs(env?)`. One place for both arg lists so any future
  script that launches its own Chromium can import instead of hand-copying a
  third arg list. `tools/browser-mode.d.mts` gives it types for `playwright.config.ts`.
- **`playwright.config.ts`**: `CHROMIUM_ARGS` now comes from
  `currentChromiumArgs()` (still exported, same shape as before — the default
  value is byte-identical to what was hardcoded here previously), plus a new
  `BROWSER_MODE` export. Nothing else in the file changed.
- **`docs/DEV.md`**: new "Fast browser" section under "Ports and base path"
  with the measured numbers below, the opt-in usage, and the caveats.
- `tools/screenshot.mjs` keeps its own separate `CHROMIUM_ARGS` copy — it is
  outside this track's owned files and was not touched. It could adopt
  `tools/browser-mode.mjs` later; noted in the doc as a "keep in sync"
  reminder, same as before this change.

## How it was measured, and the numbers

A scratch script (`tools/zz-measure-gpu.tmp.mjs`, run locally, **not
committed**) built the game once (`vite build` to a private outDir under this
session's scratchpad, `BASE_PATH=/`) and served it with `vite preview` — a
static build, not `vite dev`, specifically to rule out an HMR reload from
another agent's concurrent edit tearing down the page mid-measurement (the
first attempt, against `vite dev`, hit exactly that: "Execution context was
destroyed, most likely because of a navigation" — not a GPU-arg problem, a
dev-server-plus-shared-tree problem). It then launched Chromium once per arg
set and measured boot time, idle-scene rAF/8s, and — for Chapter 1
(`seymour-flux`, `skipCutscenes`, `skipPrep`, seed 1, `speed: 'normal'`) — time
to the first command menu (`.ig-cmd-stack` becoming visible) and in-battle
rAF/8s.

| | SwiftShader (default) | GPU (`PYREFLY_BROWSER=gpu`) |
|---|---|---|
| `WEBGL_debug_renderer_info` | `SwiftShader Device (Subzero)` (Vulkan) | `NVIDIA GeForce RTX 5070 Ti … D3D11` |
| Boot to `__pyreflyReady` | 363 ms | 309 ms |
| Idle-scene FPS (rAF/8s) | **3.00 fps** | **59.63 fps** |
| Chapter 1 time to first command menu | **>90 s (timed out)** | **11.3 s** |
| In-battle FPS (rAF/8s) | not reached | **50.00 fps** |

Real end-to-end confirmation (not the scratch script — the actual
`playwright.config.ts` + test runner):
`PYREFLY_BROWSER=gpu npx playwright test tests/e2e/boot.spec.ts` → **2/2
passed in 58.8 s**. The same file with no env var (default SwiftShader, on
this loaded machine, several other agents active) had one of its two tests
hit the framework's own 90 s test timeout doing a canvas pixel readback —
which is the exact symptom this track exists to work around, not a
regression from this change (`CHROMIUM_ARGS`'s default value is unchanged).

**Verdict: keep SwiftShader as the default, ship GPU as an explicit opt-in.**
It is reliably faster — about 20x the raw frame rate on this box, and it turns
a chapter that could not open its command menu in a 90 s budget into an 11 s
wait.

## Caveats (also in docs/DEV.md)

- **Never use GPU mode for pixel-exact goldens.** ANGLE's D3D11 path
  antialiases slightly differently from SwiftShader's Vulkan path.
  `tools/screenshot.mjs` was not changed to use it, and should not be pointed
  at it for golden-image comparisons.
- **The GPU is shared with ComfyUI** (`D:\Tools\ComfyUI`, AGENTS.md hard rule
  12). During this investigation ComfyUI was using ~84% GPU / ~15 of 16 GB
  VRAM at one point, and a GPU-mode Chromium launch under that load failed
  early with "Execution context was destroyed" before producing a usable
  page — it worked cleanly once ComfyUI's job finished. Check `nvidia-smi`
  for headroom before trusting a GPU-mode run that behaves strangely.
- GPU mode needs a real GPU with current drivers and degrades silently rather
  than erroring on a machine without one; docs/DEV.md has a snippet to read
  `WEBGL_debug_renderer_info` from inside a test to confirm which renderer a
  run actually used.

## Verification

- `npx tsc --noEmit`: no errors from `playwright.config.ts` or
  `tools/browser-mode.mjs`/`.d.mts`. (Several pre-existing errors elsewhere in
  the tree — `BattleEncounterChain.ts`, `ffx2/CommandMenu.ts`,
  `battle/ffx/reels.ts`, `tests/unit/zz-probe.tmp.test.ts` — are other agents'
  uncommitted in-flight work per `AGENTS.md`'s shared-tree note; untouched.)
- `PYREFLY_BROWSER=gpu npx playwright test tests/e2e/boot.spec.ts` — 2/2
  passed, confirming the opt-in actually launches Chromium on the real GPU
  through the real config (not just the scratch script) and the game boots,
  renders and answers the debug API correctly.
- Default (no env var) `npx playwright test tests/e2e/boot.spec.ts` still
  launches with the same SwiftShader args as before this change (verified by
  reading `CHROMIUM_ARGS`'s resolved value — identical array contents to the
  previous hardcoded list).
- No product code (`src/**`) touched.

## Left for later

- `tools/screenshot.mjs` has its own hardcoded SwiftShader arg list; it could
  import `tools/browser-mode.mjs` for `SWIFTSHADER_ARGS` to have one true copy,
  but it is outside this track's owned files.
- No automated test pins `PYREFLY_BROWSER=gpu`'s wiring (asserting
  `resolveBrowserMode()`/`chromiumArgsForMode()` behaviour) — the ownership
  note says "tests" is an owned path, but a unit test for a two-branch env-var
  reader felt like it would test the language, not the product; happy to add
  one if wanted.
- The scratch measurement script was deleted after use (not part of the
  deliverable); the numbers above are its full output.
