# Release 61, the candidate and the deploy build the same bundle (branch `r61-repro`)

**Game case: both games (release tooling and critic tooling; no game content, no shipped file changes).** Branch `r61-repro` from `origin/r60-art` (`1cea6e937`). **Not deployed, no review run.**
Policy it serves: a review's candidate build must equal the deployed build, so the review can settle it (decision 134; `critic/RUBRIC.md` section 10).

## What went wrong in release 60

Release 60 (main `1cea6e937`) was reviewed on `D:/pyrefly-release55/dist-gate` (bundle `index-CXbIrsG6.js`, built by `node tools/candidate-build.mjs`) and deployed as `dist-release` (bundle `index-DwCdr0nf.js`).
`critic-clear` refused the report: "report bundle index-CXbIrsG6.js is not the deployed bundle DwCdr0nf" (`tools/critic-pending.mjs`, `applyReport`).

**Cause: the base path, nothing else.** The deploy builds with the host's base (`hostBuildEnv`: `BASE_PATH=/` for Cloudflare). `candidate-build.mjs` set only `PYREFLY_RELEASE`, so `vite.config.ts` used its own default,
`process.env.BASE_PATH ?? '/pyrefly-reprise/'` (the old GitHub Pages folder). The base is in the bundle, so the two builds differ in exactly the files that carry it:

| | reviewed `dist-gate` | deployed `dist-release` |
|---|---|---|
| `index.html` | loads `/pyrefly-reprise/assets/index-CXbIrsG6.js` | loads `/assets/index-DwCdr0nf.js` |
| `assets/index-*.css` | 15 `url(/pyrefly-reprise/fonts/...)` (412,252 bytes) | `url(/fonts/...)` (412,012 bytes) |
| `assets/index-*.js` | `/pyrefly-reprise/` in `baseUrl`, the asset-URL helper and two `new Worker(new URL(...))` (4,678,763 bytes) | `/` (4,678,699 bytes) |
| the five chunks that import the bundle | `PaintedActor-CyxjzDp7`, `PaintedArt-EbhUwrLy`, `PilgrimFlow-CuUCjXaO`, `RigActor-BGryuNvq`, `exp-fayth-table-Cqt5HEnj` | `-nT6qQG6u`, `-BeYEpSeR`, `-rwV4Sw66`, `-D1oyoDgh`, `-Cd5yfrdm` (content is the same but the import names; `PaintedArt` also holds 3 base strings) |

Everything else is byte for byte equal: the 5,810 art files (`diff -r`, and sha256 of both builds), audio, fonts, fx, the manifest `art/manifest.json` (its `generatedAt` is only rewritten when the content changes, so it is the same file in both), the worker chunks.
The other suspects are cleared: the art manifest's `lightMaps` and `generatedAt` are not bundle inputs; the demo look's shader pre-warm is in both bundles identically; no build-time constant differs (`PYREFLY_BUILD_SHA` is `1cea6e93` in both).
Source maps (the deploy keeps them, a candidate made none) change no byte that ships.

**Why releases 56 to 59 settled:** their reports name no bundle (`build: {"mainSha": ...}` only), and `applyReport` compares bundles only `if (b.bundle && marker.bundle ...)`. `validateReport` requires `build.bundle` for live and milestone reviews, not for focused or deep.
So the comparison was skipped, not passed; their candidates came out of the same tool and most likely carried the same wrong base (unprovable now: their `dist-gate` builds are gone). Release 60's report was the first to name its bundle.

## The fix

- `tools/release-build.mjs` (new, pure): `releaseBuildEnv({ release, host, sourceMapDir, env })` is the environment of a production `vite build`: the host's base, the release name, the source-map folder (set for the deploy, removed for a candidate). `releaseViteArgs(outDir)`;
  `bundleInputs(env)` reads the variables `vite.config.ts` and the art plugin read (`BASE_PATH`, `PYREFLY_RELEASE`, `PYREFLY_BUILD_SHA`, `PYREFLY_ART_WEBP`, `PYREFLY_ART_THUMBS`); `diffBundleInputs`, `inheritedBuildEnv`.
- `tools/deploy-pages.mjs` builds with `releaseBuildEnv({ release: RELEASE, host: HOST, sourceMapDir })` (the same environment as before, key for key, proved by `deepEqual` on the release 60 inputs).
- `tools/candidate-build.mjs` builds with the same function for the default host (base `/`) and:
  - `--dry-run` prints the candidate's inputs and the deploy's, and **exits 1 if they differ** (it would have caught release 60: `base` `/pyrefly-reprise/` against `/`); it warns when the shell sets `PYREFLY_BUILD_SHA`, `PYREFLY_ART_WEBP` or `PYREFLY_ART_THUMBS`, which the deploy reads from its own shell on purpose;
  - before the build it checks that the art manifest is current (`tools/gen/manifest.mjs --check`; the deploy regenerates it, a stale one would ship different art); after it, the checks the deploy runs on its output: `checkBuildBase` and `tools/fx-assets.mjs verify`;
  - it prints `bundle index-XXXX.js`: **that name goes in the report as `build.bundle`**;
  - `--serve --out dist-gate --port N` serves the candidate with the right `BASE_PATH` in the background and prints the url and the server's pid. A bare `vite preview` serves under `/pyrefly-reprise/` and 404s every asset of a `/` build; Git Bash turns `BASE_PATH=/` into a Windows path, so the tool sets it from node.
- The runner prompts (`critic/runner/focused.js`, `deep.js`) tell reviewers to serve with `--serve` and to name the bundle; the runner self-test (`critic/runner/lib/selftest.mjs`) serves on the root.
- Tests: `tests/unit/release-build.test.ts` (new), `tests/unit/candidate-build.test.ts` (extended); `tests/unit/deploy-release-gate.test.ts` and `dist-filter.test.ts` now read the shared function instead of the deploy's old inline environment.

## Proof (scratch `D:/Tools/pyrefly-scratch/2026-10-20/r61-repro/`, the release 60 tree's art `D:/pyrefly-art-r60`, `PYREFLY_BUILD_SHA=1cea6e93`, release 60)

Built in turn into one folder, each hashed (sha256 of all 6,161 files, 10.96 GB):

| build | bundle | roll-up of all files |
|---|---|---|
| old `candidate-build.mjs` (no base) | `index-CXbIrsG6.js` | `296e9799...` = the reviewed `dist-gate`, all 6,161 files equal |
| `BASE_PATH=/`, release 60, no maps | `index-DwCdr0nf.js` | `4b4f1f3f...` |
| **fixed `candidate-build.mjs`** | `index-DwCdr0nf.js` (sha256 `96be6a37...`) | `4b4f1f3f...` |
| **the deploy's build** (as `deploy-pages.mjs` ran it, `npx vite build`, maps kept) | `index-DwCdr0nf.js` | `4b4f1f3f...` |
| the deployed `dist-release` | `index-DwCdr0nf.js` | every file equal; it holds one more, `artifact-manifest.json`, which the deploy writes after the build |

## What the next release does

1. Cut from a tree that has this branch. Build the candidate with `node tools/candidate-build.mjs --out dist-gate` (the cut step's `--out dist-smoke` prints the same bundle), serve with `--serve`, and put the printed bundle in the report as `build.bundle`.
2. Before `npm run deploy`, the bundle in the report should equal the one the smoke build printed for the release commit and art. After the deploy, `critic-clear` compares it with the deployed one.
3. The release 60 report cannot settle `1cea6e937` and must not be edited. See the report of this work for what can.

## Proposed, not built (each needs Bailey's yes, AGENTS.md hard rule 10)

- The deploy refuses to publish when the gate's report names a `build.bundle` that is not the bundle it just built (today the mismatch shows only after the deploy, at `critic-clear`).
- `validateReport` requires `build.bundle` for focused and deep reports too, so the comparison cannot be skipped by leaving the field out (the reason releases 56 to 59 never compared).
