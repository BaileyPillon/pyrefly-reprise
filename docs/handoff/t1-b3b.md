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
| PR-0189 (pause slice only; `wide` flag removed in REPAIR) | both | THE PARTY column marked `wide`, so "Dressphere" (10 chars) stops ellipsising in the plain key column at 2000x1012 | same test; the other two thirds of PR-0189 (an FFX-2 command-row status tag, the advisor effect chip) are `src/ui/ffx2/**` and `move-advisor.css` — t1-b3a's files, not touched here |
| ~~PR-0171~~ BACKED OUT in REPAIR, still open | FFX only | Chapter II (Yunalesca) and Chapter IX (Yojimbo) each get a `CHAPTER_FACE_BOXES` row, measured off the shipped plates by a canvas colour-cluster scan; the dossier now moves `under` the two columns on both instead of laying the quote across the face/mask | `pause-dossier-place.test.ts`; `docs/screenshots/t1-b3b/dossier-ch{2,9}-{1600x900,2000x1012}.png` |
| PR-0121 | both | The 3840x2160 magnify-cap shortfall (never a slide) is feathered with the same `slideMask` a slid plate already uses (`.pause__plate--capped`), instead of a hard black edge | `pause-face-slide.test.ts`, `pause-chapter-plate-fallback.test.ts`; `docs/screenshots/t1-b3b/4k-ch{1,4,9}-pause.png` |
| PR-0151 (floor scoped to the settings column in REPAIR) | both | `.pause__col--wide .pause__k`'s floor raised 118px → 150px: "MASTER VOLUME" (139px), "SOUND EFFECTS" (135px) and "STRATEGY GUIDE" (140px) all cleared it at 1280x960/1024x768 | `docs/screenshots/t1-b3b/options-{1280x960,1024x768}.png` (zero ellipsis, DOM-measured) |
| PR-0066 | both | `frontend.css`'s phone `--fe-fs-floor` raised 12px → 14px; `--fe-k` (layout) untouched | `frontend-css-type-floor.test.ts` (rewritten for the new floor); live leaf-text sweep at 390x844: min 14px (was 12) |
| PR-0014 (partial) | both | `face-crops.json`'s `yuna` row re-measured (ipd was under-measured by ~20%, over-zooming the crop and pushing hair out the tile top); `rikku`/`paine` re-measured and found already accurate, not touched | `ui-portrait-face-crop.test.ts` (116 tests, unchanged, still green); `tests/e2e/portraits.spec.ts` new test: all five chapters' full rosters, head-inside-tile check, Paine cross-screen consistency |

## Verified, no change needed (class X)

- **PR-0112** (phone OPTIONS scroll): the settings column already scrolls
  (`overflow-y: auto`, a fade mask). A real `page.touchscreen.tap()` after
  scrolling to the end reached every row (X-2 BATTLE, ATB SPEED, STRATEGY
  GUIDE, BATTLE HELP) and flipped X-2 BATTLE ACTIVE ↔ WAIT.
  `docs/screenshots/t1-b3b/phone-options-{before,after}-scroll.png`.
- **PR-0117** (phone eyebrow/GARMENT GRID overlap, Chapter IV) -- **CORRECTED BY THE
  CHECK: STILL OPEN.** Only the overlap half is gone; the grid name is still ellipsised
  at 390x844 (see CHECK and REPAIR below). Original note: real capture
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

## CHECK (independent, 2026-09-26; checker did not build this batch)

Verdict: **not ready to merge as claimed. 3 blockers.** Five items pass their round-13
acceptance checks on a production build. PR-0171 fails its own check in battle. The
PR-0151/PR-0189 key-column changes regress the CHAPTER and CONTROLS tabs at 4:3 and on the
phone. PR-0117 must stay open, because half of its check still fails.

How it was checked: `vite build` of `93950c49` served by `vite preview` on 5965, and the
merge-base `3665f1eb` built the same way in a detached worktree on 5966, so every result
below is candidate against base. Headless GPU Chromium (`PYREFLY_BROWSER=gpu`). The tests
walked the real flow with real keys: title, Enter, the board with arrows, Enter, prep,
Esc over the opening scene, the tabs with arrows, the cutscene skip, the first command
menu, then Esc again. On the phone they used raw CDP touch events
(`Input.dispatchTouchEvent`) and `touchscreen.tap`. Debug calls only read state, except
for the PR-0014 chip captures, which used `gotoChapter`. Scripts are in
`tools/zz-check.tmp/` (scratch, uncommitted). Frames and JSON are in
`docs/screenshots/t1-b3b-check/` (uncommitted, per the brief: commit this section only).
The `cmp-*` files are base and candidate side by side.

### Gates

- `tsc --noEmit`: clean.
- Full `vitest run --testTimeout=60000`: exit 0, 450 files passed (4 skipped), 8317 tests
  passed (29 skipped, 1 todo), 0 failed, no load flake.
- `tests/e2e/portraits.spec.ts` against the candidate preview: 3/3 passed.
- `tools/orphans.mjs`: 24, unchanged.
- No file under `public/` or `docs/target/` is touched, so there is no art change.
- The game case is recorded in every commit (rule 14).

### Per issue

| Issue | Acceptance check (round 13) | Result |
|---|---|---|
| PR-0168 | SCENE row equals the dossier LOCATION in every chapter | **Pass** in 14 of 15 chapters, live and over the opening scene. Chapter VII is locked ("COMING") on a fresh save, and its unit test covers the same code path. Caveat: at 1024x768 the value now shows as "MT. GA…" (see blocker 2). |
| PR-0171 | No text box overlaps the face region of any ch2 or ch9 plate at 1600 or 2000 | **FAIL (blocker 1).** Over a scene it passes: THE PARTY is omitted, the dossier moves off the face, and only the pre-existing eyebrow grazes the mask edge on Ch IX at 1600x900. **In battle it fails in all four captures** (Ch II and Ch IX, at 1600x900 and 2000x1012): every THE PARTY row sits on Yuna's face or Yojimbo's mask, because the face box moves only the dossier. At 1600x900 the new `wide` on the party column also moves the party **keys** onto the face; on base only the values were. See `pause-yunalesca-1600x900-battle.jpg` and `pause-yojimbo-cavern-1600x900-battle.jpg`. |
| PR-0189 (pause slice) | No ellipsis on these labels at 1280, 1600, 2000 and 3840 | **Pass**: FFX-2 Ch IV CHAPTER tab, 0 ellipsised at all four sizes. Base also showed "DRESSPHERE" in full at 2000x1012, so the `wide` flag was not what cleared it there. At 1024x768 the dressphere **values** ("white mage", "dark knight", "warrior") are still cut on both builds. |
| PR-0121 | 3840x2160, ch1/ch4/ch9: the plate covers the window or has a feathered edge, with no hard bar; 2560x1440 unchanged | **Pass.** At 4K all six plates (member and CHAPTER, three chapters) carry `pause__plate--capped` with the mask, and the edge luminance ramps down smoothly (`cmp-3840-ch1-base-top-cand-bottom.jpg`). The plate rects at 2560x1440 are identical to base. |
| PR-0151 | No ellipsis at 1280x960 and 1024x768 | **Pass** for the OPTIONS tab in both games: base cut MASTER VOLUME, SOUND EFFECTS and STRATEGY GUIDE, the candidate cuts none. But the same CSS floor causes blocker 2. |
| PR-0066 | Fresh 390x844 sweep of title and board: 0 under 14px, no horizontal scroll, no clipped labels; 1600 and 2000 unchanged | **Pass.** Title and board minimum is 14px (base 12), horizontal scroll is 0. 1600x900 (14.44 / 14) and 2000x1012 (16.24 / 14) are identical to base. The capture shows no clipping (`cmp-390x844-board-title-base-cand.jpg`). |
| PR-0112 (claimed "already fixed") | At 390x844 every settings row is reachable by touch scroll, no label is ellipsised, X-2 BATTLE flips by tap | **Pass.** A raw touch drag scrolls the column 0 to 58/58 and reaches all 8 rows, a tap flips X-2 BATTLE from WAIT to ACTIVE, and no label is cut. The builder had set `scrollTop` from script, and CDP `synthesizeScrollGesture` did not scroll here, so this is the first real-touch evidence. |
| PR-0117 (claimed "already fixed") | 390x844, ch4 and ch6: the eyebrow overlaps no stat row, **and the grid name has no ellipsis** | **FAIL (blocker 3).** The eyebrow overlap is gone (eyebrow top 692, last row bottom 676). The garment grid name is still ellipsised on both builds: "PROTECTION …" in Ch IV and "hour of need" cut in Ch VI (`phone-ch4-member-grid-ellipsis-zoom.jpg`). This is not a regression, but the issue must stay open. |
| PR-0014 (partial) | e2e over all rosters: head box fully inside the visible rect; Paine is the same image in battle, results, prep and pause | **Stays open, as the builder disclosed.** The new e2e check tests only the eye **point** inside the tile, not the head box, and does not cover the pause dossier chips. The new Yuna row matches the art: both marked eye centres land on the irises of `portraits/yuna.png`, and the FFX CTB chip now shows slightly more head. The FFX-2 party chips (Yuna, Rikku, Paine) still cut the top of the hair on both builds (`cmp-chips-ffx2-base-cand.jpg`). |

### Blockers

1. **PR-0171 in battle.** THE PARTY column crosses the Ch II face and the Ch IX mask at
   1600x900 and 2000x1012. It is claimed fixed and fails its own check. At 1600x900 the
   `wide` party column made the overlap larger (keys as well as values).
2. **Regression from the wider key column (both games, shared chrome).** The
   `.pause__col--wide .pause__k` floor went from 118 to 150px (PR-0151), and the gear column
   is now `wide` (PR-0189). Together they squeeze the value columns. A sweep of every pause
   tab, candidate against base, in Ch I and Ch IV in battle found:
   - **1024x768, CHAPTER tab** (`cmp-1024x768-chapter-base-top-cand-bottom.jpg`):
     - SCENE is now "MT. GA…" (base showed "GAGAZET" in full).
     - ENCOUNTER is "BOSS …" (base "BOSS HP 1…").
     - "YUNA'S ST…", "BLESSED …" and "MT. GAGAZET" are newly cut.
   - **390x844, CHAPTER tab**: the party values "BAROQU…", "GLORIO…" and "YUNA'S …" are
     newly cut.
   - **390x844, CONTROLS tab**: the key bindings are now cut ("Q / L1 / …",
     "↑↓ / D-P…", "ENTER /…", "ESC / S…", "H / TRIA…"), where base cut the descriptions
     instead (`cmp-390x844-chapter-controls-base-cand.jpg`).

   A narrower fix, for example scoping the floor to the settings column, would avoid this.
   That is for the builder to choose.
3. **PR-0117 must not be closed.** The grid name is still ellipsised at 390x844 in Ch IV and
   Ch VI (acceptance check, second half).

### Other findings (not blocking)

- **Snapshots dropped, and the handoff says otherwise.** On Ch II and Ch IX the dossier
  lands at `under-lean` (the three snapshots dropped) in 6 of the 8 captures. At 2000x1012
  over a scene on Ch II it lands at `heading` (the quote dropped as well). The handoff and
  commit 8c2b7218 say it "moves `under`". This is the existing FOC16-02 fallback, but on
  these two chapters it removes approved snapshots, which Bailey can see. The driver should
  weigh it (rule 9).
- **Stale comments in `dossierPlace.ts`.** The new comment calls the Chapter II plate
  "Yunalesca". `pause/ch2-yunalesca.png` is a painting of Yuna, and round 13 says "Yuna's
  eyes". The file header still says Chapter XIII's is the only face box.
- **Yojimbo face box stops short.** The box's `y1 0.7` ends above the mask's lowest tooth
  point (about 0.78 of the plate). This is minor while FACE_MARGIN is applied.
- **Environment.** `@exodus/bytes` is present in the shared `node_modules`. The builder's
  offline repair holds, and jsdom tests run.

Worktree: the junctions in `D:/pyrefly-t1-b3b` and the base worktree
`D:/pyrefly-b3b-base-check` are removed after this check, and both preview servers (5965,
5966) are stopped by PID.

## REPAIR (the one repair cycle, 2026-09-26; AGENTS.md rule 15)

Commits on `t1-b3b`: `92c6402b` (REG-keycol, key floors), `8a42fa61` (PR-0171 back-out),
`569d792f` (REG-keycol, CHAPTER value cells). Checked on a production build (`vite build`
+ `vite preview` on 5960, stopped by PID), headless GPU Chromium, the checker's own
real-key flow (title, Enter, board arrows, prep, Esc over the opening scene, tab arrows,
cutscene skip, first command menu, Esc), scripts in `tools/zz-repair.tmp/` (scratch),
frames and JSON in `docs/screenshots/t1-b3b-repair/`.

| Blocker | Outcome | What |
|---|---|---|
| REG-keycol | **Fixed** | The 150px key floor now applies only to `.pause__col--wide[data-col='settings']` (the OPTIONS labels PR-0151 is about); every other wide column is back at base's 118px. THE PARTY is no longer `wide`: FFX-2's DRESSPHERE key is fitted by FOC16-03's gear-column rule in `pause-chapter.css`, so PR-0189's pause slice still holds (0 cut at 1280x720, 1600x900, 2000x1012, 3840x2160 in Ch IV). SCENE (now the place name, PR-0168) and ENCOUNTER values wrap instead of ellipsising, and between 621 and 1279px wide THIS ENCOUNTER and THE PARTY (word rows only) give their empty bar cell to the values. Result: 0 ellipsised CHAPTER keys or values in Ch I (FFX) and Ch IV (FFX-2), in battle and over the scene, at 1024x768, 1280x720, 1280x960, 1600x900, 2000x1012, 3840x2160 and 390x844 (base cut "BOSS HP 1...", "BAROQUE SWO..." and "WHITE MA..." at 1024x768). OPTIONS: 0 cut at 1024x768 and 1280x960 (PR-0151 still passes). Phone OPTIONS: all 8 rows reached by raw touch drag, a tap flips X-2 BATTLE WAIT to ACTIVE, 0 cut (PR-0112 still passes). CONTROLS CSS is now byte-identical to base, so the key bindings are no longer the cut side. |
| PR-0171 | **Backed out, still open** | `8c2b7218` (the Ch II / Ch IX `CHAPTER_FACE_BOXES` rows) is hand-reverted. It met the check only over a scene, never in battle, and on these two chapters it dropped the approved snapshots (and on Ch II at 2000x1012 the quote). With it gone the dossier is where live has it (`beside`). The companion change (THE PARTY omitted, not printed empty, with no live state) stays. The overlap measurement after the back-out, as on live: over the scene the dossier heading, quote and snapshots cross Yuna's face (Ch II) and Yojimbo's mask (Ch IX) at 1600x900 and 2000x1012; in battle THE PARTY values (and on Ch IX its keys) cross them too. |
| PR-0117 | **Still open (correction)** | Not fixed, and the "verified, no change needed" note above was wrong. Real 390x844 capture on the repaired build: the eyebrow no longer overlaps any row (eyebrow top 692, last row bottom 676), but the garment grid name is still ellipsised: "protection halo" (Ch IV, Yuna) and "hour of need" (Ch VI, Rikku). No change was made in this cycle. |

### The question for Bailey (PR-0171, a placement choice, rule 9)

The Chapter II painting (Yuna) and the Chapter IX painting (Yojimbo) put the face in
the middle-right of the frame, exactly where the pause CHAPTER tab lays its three
columns (THIS ENCOUNTER, THE PARTY, the dossier) at 1600x900 and 2000x1012. Moving
only the dossier does not clear the face, because in battle THE PARTY sits there too.
Which of these should the CHAPTER tab do on a plate whose face is in the text area?

- **A. Mirror the layout** on those plates: the columns go to the left of the frame,
  the face stays clear on the right (the pause already has a `pause--mirror` mode).
- **B. Stack the columns** into one narrower block on the empty side, dropping or
  shrinking the snapshots to fit.
- **C. Slide or re-crop the painting** so the face moves out of the text area
  (the pause already slides plates for the member tabs).
- **D. Leave it**, and accept text over the face on these two chapters.

Each is a change Bailey will see, so it needs a mockup and a pick before it is built.

### Found, not introduced, not fixed here

- CONTROLS: the key-column descriptions ("MOVE DOWN A M...", "HIDE EVERYTHIN...",
  "RESUME THE FIG...") are cut at every size, and at 390x844 two bindings ("Enter / Z /
  Cross", "Esc / P / Start") are cut too. The CSS for this tab is identical to the
  merge base, so this is pre-existing; a fix is a layout choice for the tab.
- The dossier snapshot captions break mid-word at 1024x768 ("Prominen ce",
  "unhurrie d"), on base as well.

### Checks after the repair

- `tsc --noEmit`: clean.
- Full `vitest run --testTimeout=60000`: exit 0, 451 files passed (4 skipped), 8322
  tests passed (29 skipped, 1 todo). (A first run hit one wall-clock flake in
  `ui-ffx-zanmato-gauge.test.ts`, an untouched file that passes alone; the rerun was
  clean.)
- `tools/orphans.mjs`: 24, unchanged.
- Game case: REG-keycol both (shared pause chrome); PR-0171 back-out FFX only (the two
  plates are FFX paintings); PR-0117 FFX-2 only (garment grids).
