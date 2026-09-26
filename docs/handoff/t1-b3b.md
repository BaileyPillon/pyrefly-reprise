# Handoff: t1-b3b (thresholds program, batch 3b: pause / frontend / portraits)

Branch `t1-b3b`, worktree `D:/pyrefly-t1-b3b` (from `main` at 76f19bdb). Plan:
`docs/plans/thresholds-program-2026-09-26.md` section 2, Batch 3, "Batch 3" pause /
frontend / portrait half. Issue records: `critic/rounds/round-13.json`. Nothing
deployed; NOW.md untouched (the driver owns it).

Owns (per the brief): `src/app/screens/pause/**` except `keys.ts`,
`src/app/screens/frontend/frontend.css` and `chapter-select-c.css`, `src/ui/common/
portrait.ts` and `face-crops.json`.

## Fixed (each verified live on a production build, GPU Chromium)

| Issue | Game | What changed | Evidence |
|---|---|---|---|
| PR-0168 | both | Pause CHAPTER tab's SCENE row reads `ChapterMeta.location` (what the dossier heading already uses) instead of re-deriving words from the internal scene key | `pause-remake.test.ts` (new test); was printing "cavern stolen fayth" / "dreams end" |
| PR-0171 (companion) | both, FFX-only data | THE PARTY column is omitted, not printed empty, when the pause opens over a cutscene with no live state | `pause-chapter-columns.test.ts` (new file) |
| PR-0189 (pause slice only) | both | THE PARTY column marked `wide`, so "Dressphere" (10 chars) stops ellipsising in the plain key column at 2000x1012 | same test; the other two thirds of PR-0189 (an FFX-2 command-row status tag, the advisor effect chip) are `src/ui/ffx2/**` and `move-advisor.css` — t1-b3a's files, not touched here |
| PR-0171 | FFX only | Chapter II (Yunalesca) and Chapter IX (Yojimbo) each get a `CHAPTER_FACE_BOXES` row, measured off the shipped plates by a canvas colour-cluster scan; the dossier now moves `under` the two columns on both instead of laying the quote across the face/mask | `pause-dossier-place.test.ts`; `docs/screenshots/t1-b3b/dossier-ch{2,9}-{1600x900,2000x1012}.png` |
| PR-0121 | both | The 3840x2160 magnify-cap shortfall (never a slide) is feathered with the same `slideMask` a slid plate already uses (`.pause__plate--capped`), instead of a hard black edge | `pause-face-slide.test.ts`, `pause-chapter-plate-fallback.test.ts`; `docs/screenshots/t1-b3b/4k-ch{1,4,9}-pause.png` |
| PR-0151 | both | `.pause__col--wide .pause__k`'s floor raised 118px → 150px: "MASTER VOLUME" (139px), "SOUND EFFECTS" (135px) and "STRATEGY GUIDE" (140px) all cleared it at 1280x960/1024x768 | `docs/screenshots/t1-b3b/options-{1280x960,1024x768}.png` (zero ellipsis, DOM-measured) |
| PR-0066 | both | `frontend.css`'s phone `--fe-fs-floor` raised 12px → 14px; `--fe-k` (layout) untouched | `frontend-css-type-floor.test.ts` (rewritten for the new floor); live leaf-text sweep at 390x844: min 14px (was 12) |
| PR-0014 (partial) | both | `face-crops.json`'s `yuna` row re-measured (ipd was under-measured by ~20%, over-zooming the crop and pushing hair out the tile top); `rikku`/`paine` re-measured and found already accurate, not touched | `ui-portrait-face-crop.test.ts` (116 tests, unchanged, still green); `tests/e2e/portraits.spec.ts` new test: all five chapters' full rosters, head-inside-tile check, Paine cross-screen consistency |

## Verified, no change needed (class X)

- **PR-0112** (phone OPTIONS scroll): the settings column already scrolls
  (`overflow-y: auto`, a fade mask). A real `page.touchscreen.tap()` after
  scrolling to the end reached every row (X-2 BATTLE, ATB SPEED, STRATEGY
  GUIDE, BATTLE HELP) and flipped X-2 BATTLE ACTIVE ↔ WAIT.
  `docs/screenshots/t1-b3b/phone-options-{before,after}-scroll.png`.
- **PR-0117** (phone eyebrow/GARMENT GRID overlap, Chapter IV): real capture
  at 390x844 shows the "CHAPTER IV · BEVELLE UNDERGROUND — SOMETHING SHE
  NAMED" eyebrow (top 692px) sitting cleanly below the 5-row-capped stats
  column (last row bottom 680px). Re-checked on Chapter VI too, same result.
  Likely fixed already by the `phoneFit.ts` overrun lift or the five-row cap,
  both landed after this issue was last observed (round 12, build 5be4babe).
  `docs/screenshots/t1-b3b/phone-ch{4,6}-pause-esc.png`.

## PR-0014, disclosed rather than claimed fully closed

Round 13 says Yuna, Rikku **and** Paine's chips still crop through the head.
An independent, pixel-level re-measurement (a canvas colour-cluster scan of
each shipped portrait's iris/pupil pixels, cross-checked against a rendered
crop-box preview) found:

- **yuna**: a real, fixable measurement bug — the stored `ipd` (0.2015)
  under-measured her true eye separation (0.2451) by about 20%, over-zooming
  the crop. Fixed.
- **rikku**: measured `fx 0.548 / fy 0.542 / ipd 0.259` against the stored
  `fx 0.5403 / fy 0.5374 / ipd 0.2644` — within measurement noise. Not a bad
  row.
- **paine**: the row's own noted pupil coordinates `(275, 466)` and
  `(500, 400)` were re-measured directly off `art/portraits/paine.png` and
  land within a few pixels of a real iris centroid. Not a bad row.

The new `tests/e2e/portraits.spec.ts` test sweeps every chip in all five
chapters' rosters (CTB list for FFX, the `.ffx2hud__party` window for FFX-2)
plus the results screen and the prep roster, checking that each chip's
measured head point lands inside its visible tile — and it passes for Rikku
and Paine everywhere it reaches. So either the round-13 observation predates
a fix already on `main`, or it is about a screen/state this sweep does not
yet cover (a specific dressphere's body-layer crop, a stale cache, or a
capture taken before the manifest/sidecar refinement pass landed). Recorded
here rather than invented a "fix" against numbers that already match the
shipped file (rule 6) — a further look, if Bailey wants one, needs the exact
repro (which screen, which dressphere, which chapter) that produced the
round-13 screenshots.

## Checks

- `npx tsc --noEmit`: clean.
- Touched vitest files: green (`pause-remake.test.ts`, `pause-chapter-columns.test.ts`
  [new], `pause-dossier-place.test.ts`, `pause-face-slide.test.ts`,
  `pause-chapter-plate-fallback.test.ts`, `frontend-css-type-floor.test.ts`,
  `chapter-select-c.test.ts`, `ffx-hud-css-type-floor.test.ts`,
  `ui-portrait-face-crop.test.ts`, `pause-remake-css.test.ts`).
- Full suite (`vitest run --testTimeout=60000`): exit 0, 450 files passed / 4
  skipped, 8317 tests passed / 29 skipped / 1 todo, 0 failed. No load flake
  observed.
- `node tools/orphans.mjs`: 24 orphaned, identical to `main` — no growth.
- `tests/e2e/portraits.spec.ts` (Playwright, `PYREFLY_BROWSER=gpu`,
  `PREVIEW_PORT=5961`): 3/3 passed, including the new all-chapters sweep.
- Real input on a production build (`npm run build` + `vite preview` on port
  5960, GPU Chromium): the debug API (`gotoChapter`, `trigger('pause:open')`,
  `trigger('pause:tab:*')`) drove every screen above; touch scroll and
  `page.touchscreen.tap()` for the phone OPTIONS check. Both preview servers
  (5960, 5961) stopped by PID before finishing.

## Game case (rule 14)

- PR-0066, PR-0112, PR-0117, PR-0121, PR-0151, PR-0168, PR-0171 (SCENE/omit
  fix), PR-0189 (pause slice): **both** — shared pause/frontend chrome, no
  game-specific behaviour.
- PR-0171 (the two new `CHAPTER_FACE_BOXES` rows): **FFX only** — the
  measured plates (`ch2-yunalesca`, `ch9-yojimbo`) are FFX paintings; no
  FFX-2 chapter's dossier placement changes.
- PR-0014 (`yuna` row): **both** — the shared `portraitCrop` table FFX and
  FFX-2 screens both read; Yuna's FFX-2 self (`yuna-x2`) has its own,
  separately-measured row and was not touched.

## Worktree

Junctions (`node_modules`, `public/art`) removed before finishing; the
worktree itself is kept per the brief. Scratch scripts under
`tools/zz-verify.tmp/` are left uncommitted (agent scratch).
