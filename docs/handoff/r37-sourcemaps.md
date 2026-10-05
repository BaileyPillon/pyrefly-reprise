# r37-sourcemaps: no source map ships (PR-0328, D-335)

Branch `r37-sourcemaps` from main d154486c (worktree `D:/pyrefly-r29-text`). Source: Bailey, 2026-10-03
~00:45 EDT, "all your recommendations, godspeed", adopting the driver's recommendation on the critic's
proposal PR-0328 (`critic/rounds/round-19.json`, proposals). Recorded as D-335 in `docs/target/decisions.json`
(main d154486c, delivery in-progress). Delivery plumbing: **both games** (CHK-017/CHK-020: shared build,
nothing a player sees). Not merged into main and not deployed: release 36 is under deep review; this goes into
release 37.

## What changed

| File | Change |
|---|---|
| `vite.config.ts` | `build.sourcemap` was `true`. It is now `false`, and `'hidden'` only when the environment variable `PYREFLY_SOURCEMAP_DIR` names a folder. The `pyrefly-dist-filter` plugin copies the maps into that folder (`keepSourceMaps`) and then prunes them from the build, so a `.map` never reaches `dist`. A folder that cannot be written is a warning, never a failed build. |
| `tools/dist-filter.mjs` (+ `.d.mts`) | New: `SOURCEMAP_DIR_ENV`, `isSourceMapFile` (`*.js.map`, `*.mjs.map`, `*.css.map` only), `hasSourceMapReference`, `findSourceMapReferences`, `keepSourceMaps`. `findUnshipped` now also reports maps, so `pruneUnshipped` removes them and the deploy preflight (which already refused unshipped files) refuses a build that holds one. |
| `tools/deploy-pages.mjs` | Builds with `PYREFLY_SOURCEMAP_DIR=D:/Tools/pyrefly-sourcemaps/<short sha>` (home overridable with `PYREFLY_SOURCEMAP_HOME`); after the build it fails on any `.map` file (existing check) and on any `sourceMappingURL` comment left in the code (new), and logs where the maps went. |
| `tools/artifact-manifest.mjs` | `buildManifest` lists a `.map` file, or code/CSS/HTML that points at one, under `problems` (the deploy already stops on any problem). |
| `tests/unit/dist-filter.test.ts`, `tests/unit/artifact-manifest.test.ts` | 12 new tests (10 in dist-filter, 2 in the manifest test): the suffix rule, the comment rule (and that a string merely naming `sourceMappingURL` is not a pointer), prune, keep, the plugin's two hooks run end to end on a fake build folder, the unwritable-folder warning, config `false` / `'hidden'`, the licence rules still held, the deploy wired to the variable and the reference check; manifest problems for a map and for a pointer, and none for a clean build. |
| `docs/DEV.md` | One paragraph in the Deploy section: how maps are kept and how to read a stack trace. |

## What I chose, and why

- **`false` by default, `hidden` plus a side folder for deploys only.** Nothing in the repo reads a map (grep of
  `tools/`, `tests/`, `critic/runner/`, `e2e`: none), so a default build makes none (also saves the bundler's
  map pass). The deployed build is the one whose stack traces matter, so only `deploy-pages.mjs` asks for them.
  They are keyed by commit under `D:/Tools/pyrefly-sourcemaps/<sha>` (outside the repo and outside the release
  worktree, which `release.js` removes and recreates; same commit overwrites, so growth is about 22.8 MB per
  deploy, not per build). `hidden` rather than `true` so the shipped code carries no `sourceMappingURL` line.
- Not a per-commit folder under `D:/Tools/pyrefly-scratch`: scratch is cleaned; the maps of a live build must
  outlive a cleanup. Say so if you would rather they sit elsewhere (`PYREFLY_SOURCEMAP_HOME`).
- `three.js` MIT notice: untouched. `third-party-licenses.md` still ships (1,186 bytes) and the `@license`
  header is still in `assets/index-*.js` (`comments: { legal: true }` unchanged).

## Measured (scratch builds of this tree, `npx vite build --outDir D:/Tools/pyrefly-scratch/2026-10-03/sourcemaps/<dir>`)

| Build | Files | Total bytes | `.map` bytes | `sourceMappingURL` in code |
|---|---|---|---|---|
| before (main d154486c, `sourcemap: true`) | 1,431 | **798,874,489** | 22,775,896 (3 maps: index 17,068,125, worker 4,529,951, worker 1,177,820) | 3 files |
| after, default (`false`) | 1,428 | **776,098,462** | 0 | 0 |
| after, deploy-like (`PYREFLY_SOURCEMAP_DIR` set) | 1,428 | **776,098,462** (byte-identical file list and sizes to the default) | 0 in the build; the same 3 maps (22,775,896 bytes) in the side folder | 0 |

Saved: 22,776,027 bytes (the maps plus 131 bytes of pointer comments). Headroom under 800,000,000: 1,125,511
before, **23,901,538 after**. The only changed files are the three `.js` bundles (the comment line gone). Bundle
names are unchanged (`index-DU_vcl-u.js`). `buildManifest` on the before tree reports 6 problems (3 maps, 3
pointers); on the after tree, none. Scratch outputs: `D:/Tools/pyrefly-scratch/2026-10-03/sourcemaps/`
(`dist-before`, `dist-after-default`, `dist-after-deploylike`, about 2.4 GB in all, `maps/deploylike/`,
`measure.mjs`, build logs).

Note for D-332: the waiting adopted art was sized at about 33 MB; the headroom is 23.9 MB in decimal bytes, so
about 9 MB of it still would not fit under 800,000,000 (it fits under 800 MiB = 838,860,800 with 62.8 MB to
spare). Which of the two the line means is still Bailey's reading (D-332 says "about 30 MB over 800 MB if MB,
under if MiB").

## Gates

- `npx tsc --noEmit`: clean.
- Full `npx vitest run --testTimeout=60000`: 746 files passed, 5 skipped (751); 11,048 tests passed, 40 skipped, 1 todo (547 s). Release 36 had 746 files / 11,036 tests, so +12 tests (log: `D:/Tools/pyrefly-scratch/2026-10-03/sourcemaps/vitest-full.log`).
- `node tools/orphans.mjs`: no new module (nothing added that nothing imports); the 24 earlier orphans are unchanged.

## Not done, on purpose

- No deploy, no merge into main, no change to `docs/handoff/NOW.md`, nothing under `public/art`.
- Nothing about the live site's current maps: release 35 still serves them (and a release 36 deploy would too,
  since this branch is not in it) until release 37 is deployed; `critic/runner` needs no change (it builds with
  the plain command, which now makes none).
