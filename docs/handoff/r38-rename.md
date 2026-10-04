# r38-rename: the game's player-facing title is "Echoes of Spira" (release 38, both games)

**Branch:** `r38-rename` in `D:/pyrefly-r38-rename`, from `origin/main` `f3389dfc` (docs after release 37.1, `f4244e1f`; `src/` is
byte-identical to live 37.1). Not merged, not deployed. Pushed as a branch only.
**Why:** Bailey, 2026-10-04: "I need a new working title for my game I dont like pyrefly reprise", then, from the driver's list:
"I'll go with Echoes of Spira. The name change should take place immediate in our next build please." Release 38 is the next build.
**Game case:** **both.** The title is the product's name, one string for FFX and FFX-2, not content of one game (rule 14); the one
line that reads oddly because of it is disclosed below (the hidden FF7 pause). **critic-plan class** (`node tools/critic-plan.mjs
--paths <the changed files>`): **DEEP, after deploy** (a focused review of the production candidate before the deploy; live
verification, then the deep review on the live build), "because `index.html` and `src/main.ts` are global layout, input and boot".
**Not the save-data class:** no save source path is in the diff (`src/app/SaveData.ts`, `saveMerge.ts`, `saveComfort.ts` are
untouched). Paper preflight: [docs/plans/r38-rename-review.md](../plans/r38-rename-review.md).

All browser numbers are real input in headless Chromium (`PYREFLY_BROWSER=gpu`, never the browser pane), the BEFORE side against the
live release 37.1 site (bundle `index-DhiL5vEz.js`, `https://baileypillon.github.io/pyrefly-reprise/`), the AFTER side against a
production build of this branch (`vite build` into scratch, bundle `index-Dq5fTgzr.js`, served by `vite preview` on port 6881, since
stopped). Scripts, builds, logs and raw frames: `D:/Tools/pyrefly-scratch/2026-10-04/rename/`. Frames in the repo:
`docs/screenshots/r38-rename/` (`before-*`, `after-*`, `compare-*.jpg` side by side, `facts-*.json`).

## What changed, place by place

| Where a player meets it | File | Before | After |
|---|---|---|---|
| Browser tab title | `index.html` | `Pyrefly Reprise` | `Echoes of Spira` |
| Search and link-preview description | `index.html` | `Pyrefly Reprise - an unofficial HD-2D fan tribute ...` | `Echoes of Spira - an unofficial HD-2D fan tribute to Final Fantasy X and X-2.` |
| No-script fallback line | `index.html` | `Pyrefly Reprise needs JavaScript and WebGL 2.` | `Echoes of Spira needs JavaScript and WebGL 2.` |
| Title card wordmark | `src/app/screens/frontend/titleMarkup.ts` | `Pyrefly` / `Reprise` | `Echoes` / `of Spira` |
| Pause brand line (every pause, both games) | `src/app/screens/pause/PauseView.ts` | `Pyrefly Reprise · Final Fantasy X` | `Echoes of Spira · Final Fantasy X` (FFX-2, FF7 likewise) |
| WebGL-refused error screen heading | `src/main.ts` | `Pyrefly Reprise` | `Echoes of Spira` |
| Reader docs | `README.md`, `docs/ARCHITECTURE.md`, `docs/DEV.md` headlines | `Pyrefly Reprise` | `Echoes of Spira (formerly Pyrefly Reprise)` |
| Agents | `AGENTS.md` | | one line under the title: "Player-facing title: Echoes of Spira since 2026-10-04 (Bailey); the repo, folders and internal names keep 'pyrefly'." |

Searched and **found no other player-facing copy**: the chapter select, party prep, results and the pause's other pages (CREDITS,
OPTIONS, GUIDE) do not name the game (checked in the source and in the built bundle, where the old words survive only as
identifiers; rendered and read in a browser: the title, the board and the pause), the licences file (`third-party-licenses.md` is
headed "Licenses"), `public/` outside the art (no manifest, robots or licence page), and the key art (no baked-in lettering).
There are no Open Graph or web-manifest files to change.

**The wordmark is text, not a painted image.** Two stacked `div.fe-title__name` in the Ink & Gold serif on the paper slab, so the
swap is two strings; the old picture of it does not exist as a file and nothing was retired. **No CSS changed.** The words are
shorter or longer by a letter or two, so the fit was measured on the live page's own DOM and CSS before any edit
(`probe-wordmark.mjs`, seven windows) and again in the production build:

| Window | Old lines, text / box px | New lines, text / box px | Rows | Slab and chip inside the window |
|---|---|---|---|---|
| 390x844 (phone block) | 105.9 / 131 and 106.2 / 131 | **97.0 / 131 and 112.1 / 131** | 1 and 1 | yes |
| 1024x768 | 139.3 / 239 and 139.7 / 239 | **127.5 / 239 and 147.5 / 239** | 1 and 1 | yes |
| 1600x900 | 217.7 / 374 and 218.3 / 374 | **199.3 / 374 and 230.4 / 374** | 1 and 1 | yes |
| 2000x1012 | 244.8 / 420 and 245.5 / 420 | **224.1 / 420 and 259.1 / 420** | 1 and 1 | yes |

The font size (84.4, 54.0, 41.1 and 95.0 px) and line height are unchanged, so the visual weight is. The widest line, "of Spira",
uses 62 percent of the slab's text box on a desktop and 86 percent on a 390 px phone (also 360x740: 98.3 of 115; 1280x720 and
2560x1080 the same 62 percent). "Echoes" is the shorter line, a ragged stack rather than the old pair of equal widths. Open for Bailey
(not built): "of" smaller or lighter, the usual treatment of a connecting word; a painted "Echoes of Spira" logo.

## What did NOT change, on purpose

The repo, folder and file names, `window.__pyrefly` and `window.__pyreflyReady`, `PYREFLY_*` variables, the CSS class prefixes, the
tools, critic and handoff files, the GitHub repo and the live URL, the `/pyrefly-reprise/` base path, and every storage key:
**`pyrefly-reprise:save:v1`** (`SAVE_KEY`), **`pyrefly-reprise:experiments:v1`** (`EXPERIMENTS_KEY`) and
`pyrefly.board.lastChapter` (the board's last-chosen chapter, a UI preference). In-world "pyrefly" (the spirit lights, the dissolve
shader and effect, the `pyrefly` SFX id, `pyrefly:` custom events) is the fiction, not the title. After the build, the only places
the old words remain in the shipped bundle are those identifiers (checked token by token).

## The save: a release 37.1 save still loads (the proof the brief asked for)

- **A real 37.1 blob.** `tests/fixtures/saves/release-37.1.json` was written by the **live release 37.1 build itself** (fresh headless
  profile on the live site, then that build's own `SaveStore` methods through `window.__pyrefly.app.save`, then `localStorage` read
  back verbatim), the same way as the release-20 to -35 fixtures. Three clears (Seymour Flux, Bahamut, Chapter IX Yojimbo), two
  attempted chapters (Ixion, Sin's fins), non-default volumes, text speed and size, FFX-2 ATB active and slow, the guide hidden,
  `fxSpectacle` off, the nine eye-candy parts. Its only key is `pyrefly-reprise:save:v1`.
- **`tests/unit/save-release-37-1.test.ts` (7 tests)** writes the keys as **literals**, so a renamed `SAVE_KEY` fails it instead of moving
  the test along with it: both keys equal the 37.1 literals; a store told to read any other key finds nothing (so the key is what
  carries the progress); the blob loads through the real `SaveStore` under the *default* key with every record, best time and turns,
  attempt, play time, coach mark and setting; the board counts 3 of 18; a save and a reload under the same key keeps it all, adds a new
  clear beside the old records and writes **no second key**; `migrate` is idempotent and the version stays 1.
- **In a real browser, on the release 38 build:** the same blob put in `localStorage` before the page's first script, Enter past the title
  to the board: "3 OF 18 BEATEN", victory ribbons 8:18 (Seymour Flux, 498,210 ms), 8:32 (Yojimbo, 512,340 ms) and 10:40 (Bahamut,
  640,100 ms), every record, setting and coach mark equal to the blob, **0 console errors**
  (`after-chapter-select-save371-1600x900.png`, `facts-after-save371.json`).

## Before and after in the browser (real keys; 0 console errors in every normal run)

Path: title, Enter to the board, Chapter I, party prep, the fight to its first command menu, Esc into the pause. Facts per run are in
`facts-before.json`, `facts-after.json`.

| | Before (live 37.1) | After (this build) |
|---|---|---|
| Tab title (title, board, pause) | `Pyrefly Reprise` | `Echoes of Spira` |
| Old name in any visible text, title / board / pause | yes / no / yes | **no / no / no**, new name present |
| Pause brand line box, 1600x900 and 390x844 | 422x18, 362x16, not clipped | **422x18, 362x16, not clipped** (the same 15 characters) |
| Static HTML a no-JavaScript browser is served | title, description and fallback all `Pyrefly Reprise` | all `Echoes of Spira`; the old words nowhere in the file |
| WebGL refused (forced): heading | `Pyrefly Reprise` | `Echoes of Spira`; message unchanged |
| Console errors, normal runs (1600x900, 390x844, 1024x768, 2000x1012) | 0, 0, 0, 0 | **0, 0, 0, 0** |

The forced WebGL-refused run logs two console errors by design (three.js cannot make a context; the game's own `[pyrefly]` line), the
same before and after. `ERR_ABORTED` on a few art prefetches (not console errors) appears in both, from screens leaving before a
request lands.

## Gates

| Gate | Result |
|---|---|
| `tsc --noEmit` (tsconfig includes `tests/unit`, so the new tests are type-checked) | clean |
| `tests/unit/player-facing-title.test.ts` (new) | green on the source; green on the release 38 build (`PYREFLY_SCAN_DIST`); **red** on a folder holding the old live `index.html` and a split-wordmark bundle (names every offender) |
| `tests/unit/save-release-37-1.test.ts` (new, 7) and `frontend-title-motion.test.ts` (26, re-pinned) | green |
| Tests whose import graph reaches the changed modules (`vitest related`) | 26 files, 331 tests, green |
| Every pause, frontend, title and save test, plus every test that reads `index.html` or build output (76 files, 1,057 tests) | 75 files green; `ui-pause-stack.test.ts` times out on 2 tests at the 15 s limit and passes 6 of 6 with `--testTimeout=180000` (see below) |
| `node tools/orphans.mjs` | 24 orphaned, as expected |
| Pattern check on the **real minified live 37.1 bundle** (fetched into memory, not saved) | finds the pause brand line, the split wordmark and the error heading (3 phrase hits, 2 lone-half hits); 0 in the release 38 bundle and both workers |

**`ui-pause-stack.test.ts` is slow, not broken, and it was before this change.** Its two z-index inventory tests read and regex every
`.css` and `.ts` file under `src/` and have no timeout of their own. On this loaded machine (65 to 100 percent CPU all evening from
other sessions) they ran 40 s and 39 s here, and **43 s and 23 s on the unmodified main tree** (`D:/Final Fantasy`, same flag), against
the 15 s default; with `--testTimeout=180000` all six assertions pass in both trees. My edit changes no z-index. The new scan test
has the same shape (it reads the same tree) and carries its own 120 s timeout for that reason; it took 4 s on the calmest run I had and 11 to 31 s under load.

**Not run:** the full `npm test`. The repo now has 777 unit test files (AGENTS.md still says 110), the partial run was at 63 of them after
ten minutes on a machine at 88 percent CPU with 97 node processes, and two heavy engine benches (`chapters/sin-fins-core-bench`,
`strategy-ffx2-bahamut`) failed on the 15 s limit by running 25 s and 56 s, so I stopped it (my own run, by task id; no vitest process
is left). Neither file touches the title. The Playwright e2e specs were not run either; none pins the old words (they use the base path
and the save key, both unchanged).

## The new test, and how to point it at a release candidate

`tests/unit/player-facing-title.test.ts` scans in two layers. **Source, always:** `index.html` (HTML comments included, they ship),
everything under `src/` (whole-line comments skipped), `public/` outside `art/`, `fonts/`, `fx/`. **A build, when there is one:**
`PYREFLY_SCAN_DIST=<folder>` names it (a named build that is missing fails), else `dist/` is scanned only when it is newer than every
source file; a stale `dist/` is skipped on purpose, because after the merge it still holds the old bundle and a gate that fails on it
would fail every run for the wrong reason. The old title is `pyrefly` then `reprise` with only spaces, entities, a middle dot or
markup between (so the split two-line wordmark counts), or either word alone as an element's whole text; kebab and snake case
identifiers do not match. Nine control fixtures prove each shape is caught and each internal form let through.

```
PYREFLY_SCAN_DIST=dist-release node node_modules/vitest/vitest.mjs run tests/unit/player-facing-title.test.ts
```

Suggested, not done (it is deploy tooling): run it on the deploy candidate in the focused review, or have `tools/artifact-manifest.mjs`
refuse a text file in the build that matches.

## Findings the driver should see

1. **The no-script line is never visible (pre-existing, both builds).** By the page's own CSS, `#app` is `position: fixed` with an opaque
   background and `#fade` is an opaque black layer until JavaScript clears it, while the `<noscript>` paragraph is in normal flow after
   them, so it paints underneath; the no-JS frame of either build is solid black. A visitor without JavaScript sees a black page, not
   "needs JavaScript and WebGL 2". The words are updated; showing them needs a CSS change in `index.html` that is outside a rename
   (I did not render the fix). The two black no-JS frames
   (`before-noscript-1600x900.png`, `after-noscript-1600x900.png`) are left untracked on purpose; the served-HTML read-back in the
   facts files is the proof.
2. **The hidden FF7 experiment's pause now reads "Echoes of Spira · Final Fantasy VII".** Spira is FFX's world. It is the one
   brand string the pause always printed, FF7 stays hidden, and it is a Bailey call, not an agent's.
3. **The approved Title tile shows the old name** (`docs/screenshots/mockups/A-title.jpg`, `docs/concepts/polish/showpiece-frontend/after.png`).
   The text now differs from that picture by Bailey's decision; `docs/target/targets.json` is his registry and is untouched
   (it, `critic/CHECKS.md` and `critic/RUBRIC.md` still name the old title in prose).
4. **Owner-facing pages and tools still carry the old name**: `docs/audio/audition.html` (generated by `tools/audio/audition.mjs`,
   the page Bailey listens from), the art-watch gallery, `tools/deploy-pages.mjs`'s header, `docs/ART-PIPELINE.md`, `AUDIO-GUIDE.md`,
   `SPRITE-GUIDE.md`. Not the game; left alone as instructed.
5. **Commit trailer.** The brief said `Co-Authored-By: Claude Opus 5.5`; these commits are written by Sonnet 5.5, so they say that,
   as the harness's attribution rule and this repo's history (it credits whichever model wrote a commit) both do.

## Follow-ups for Bailey, nothing built

- A painted "Echoes of Spira" logo for the title card; it is new art and needs options first (the wordmark is text today).
- Typographic options for the stack ("of" smaller or lighter), if the plain stack does not please.
- Moving off GitHub Pages to Cloudflare Pages (the repo name, the URL and the `/pyrefly-reprise/` base path stay for now).
- Whether the hidden FF7 pause should print a different brand line.

## Junctions to unlink later (the driver's to do)

`D:/pyrefly-r38-rename` is a sparse worktree (no `docs/screenshots` checkout; the frames above were added with `git add --sparse`).
It holds **two junctions into the main tree**:

| Link | Target |
|---|---|
| `D:\pyrefly-r38-rename\node_modules` | `D:\Final Fantasy\node_modules` |
| `D:\pyrefly-r38-rename\public\art` | `D:\Final Fantasy\public\art` |

`public/fx` is a **copy** (24 files, 4.5 MB), not a link. Before this worktree is ever removed or cleaned, unlink both links with
`cmd /c rmdir "<link>"` (no `/s`; it removes only the link), check that `D:\Final Fantasy\node_modules` and `public\art` are intact,
and never `git worktree remove` first (the 2026-09-26 incident followed a junction and deleted files). Scratch under
`D:/Tools/pyrefly-scratch/2026-10-04/rename/` holds one production build (`dist-after-a`, about 1 GB with the art), the capture
scripts and the logs; the preview server it served (PID 45496, port 6881) has been stopped.
