# Proof scripts (r43-prepphone)

Scratch-quality Playwright scripts, kept so the numbers in `../README.md` can be reproduced. They are not product code and nothing imports them.

Environment: `PREP_WT` the repo root (node_modules, `tools/browser-mode.mjs`), `PREP_BASE` the dev server to test (read when `lib.mjs` loads, so set it in the shell),
`PREP_OUT` where captures go, `PYREFLY_BROWSER=gpu`, and `TEMP`/`TMP` somewhere that is not C:. Serve the branch from the repo root with
`node node_modules/vite/bin/vite.js --port 5843 --strictPort` (the proof ran it with HMR off) and a pristine origin/main export
(`git archive <sha> -- src tools public index.html vite.config.ts tsconfig.json package.json | tar -x -C <dir>`, with `node_modules` and `public/art` junctioned) on another port.
Stop each server by its PID when done.

| Script | What it does |
|---|---|
| `lib.mjs` | Reaches a chapter's party prep by the player's keys (title, board, Enter) in a fresh profile, and dismisses the first-run cards. |
| `touch.mjs` | Real touch: `touchscreen.tap`, CDP touch drags that end at rest (so a tap is never swallowed by a fling), hit-testing before a tap, scroll to a position. |
| `probe.mjs` | The CHK-003 walk from `tools/text-floor-probe.mjs` (origin/r43-textfloor), plus `offscreen: true` so text below the fold counts. |
| `proof-shots.mjs` | Every tab of both games at a phone size: open by tap, screenshot, the sweep, the layout checks, scroll to the end by a touch drag. `--mode=base` captures origin/main without the new-markup checks. |
| `proof-input.mjs` | Every function by touch and keys: tabs, faces, folds, the Overdrive tap, strip swipe, page scroll with the bar pinned, Down/Up, Left/Right, Tab, PageDown/PageUp, Esc, START BATTLE. |
| `proof-scrolled.mjs` | The PREP-A "Stats, scrolled" frame and the opened Dresspheres page, by touch. |
| `proof-webkit.mjs` | The same screens in Playwright's WebKit (layout and sweep; WebKit has no CDP touch drags). |
| `proof-sphere.mjs` | The Sphere Grid tab by touch (it keeps its own phone page): zoom, centre, one of its own heads, START BATTLE uncovered; run it on the branch and on origin/main (`--tag=sphere-build` / `--tag=sphere-base`). |
| `proof-desktop-input.mjs` | The prep functions by mouse and keys at a desktop size, and that the phone page never shows there. |
| `shots-desktop.mjs`, `compare.mjs` | Every tab at a desktop size, and the exact pixel comparison of two folders. |
| `make-pairs.mjs` | The five PREP-A frames as plain two-up pictures (target left, build right), into `../pairs/390x844/`; run after `proof-shots.mjs` and `proof-scrolled.mjs`. |
| `finalize.mjs` | Builds this folder: JPEGs, the side-by-side frames, `identity.json`, `summary.json`. |
| `run-final.sh` | The sequence, each command under its own hard timeout. |
