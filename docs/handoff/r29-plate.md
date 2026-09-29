# r29-plate: the Chapter IV pause plate is the painting on its approved tile

**Game case: FFX-2 only.** Chapter IV (Bahamut, `ffx2-bahamut`) is an FFX-2 chapter and
`ch4-ffx2-bahamut` is only its plate. Nothing here touches FFX chapters, the FFX-era
alias `ch4-bahamut.*`, or any shared code. Decision: D-257 (Bailey, 2026-09-28 ~22:00
EDT, "all your recommendations", item 3). Defect: PR-0242 ("the Chapter IV pause hero
plate is a different painting from its approved tile"), carried as C-3 in
`docs/plans/iteration-2-batches.md` section 8 Q16.

## What was wrong, and why

- The approved tile is "Hero plate, chapter 4" in `docs/target/targets.json`, source
  `docs/screenshots/concept/pause-ch4.png` (1344x768, Bailey 19 Sep 2026): Yuna
  (Gunner) smiling, pink and blue sky, the black armoured dragon head at her shoulder.
- The pause draws `chapter-meta.ts` `heroArt: 'pause/ch4-ffx2-bahamut'` on the CHAPTER
  tab (`PauseView.renderPlate` -> `PortraitStage.show`), as `public/art/pause/
  ch4-ffx2-bahamut.png` plus, when `manifest.pause2x` lists it, the `.2x.webp` master
  (srcset picks the 2x from about 1344 px of cover width, so on a 1600x900 window the
  2x is what shows).
- Both files had been overwritten on 2026-09-18 19:10 with the "ch4-b v2" render
  (a downcast, cool, dark scene; sha256 `4f5b1499...`, the same bytes as
  `ch4-bahamut.png`). No code picks it: it is only the file under that name. The
  registry `docs/target/approved-hashes.json` (`pause:plates`) had recorded that later
  file as "behind the approved tile", which is why nothing flagged it.

## The fix (no code change: the plate is local art)

The tile's pixels equal, exactly (mean abs diff 0.0), the PNG in the backup
`D:/Tools/pyrefly-art-backup/20260918-1455/pause/ch4-ffx2-bahamut.png` (also
`ch4-bahamut.png` there), sha256
`79047d2f7c0294d9ec1bd21733b4d07d97378811c8d9fc4c6be8c6d2ed6e072e`. Its 2026-09-18
sidecar prompt is the one the current `ch4-ffx2-bahamut.json` already carried.

`public/art` is gitignored, so this is a local file operation. Exact operations, done
on 2026-09-29 (repeat them on any other machine that holds the art):

1. Backup of what was there: `D:/Tools/pyrefly-art-backup/20260929-r29-plate/pause/
   ch4-ffx2-bahamut.{png,2x.webp,json}.before` (the PNG and webp bytes were also already
   in 48 older backup folders).
2. `cp D:/Tools/pyrefly-art-backup/20260918-1455/pause/ch4-ffx2-bahamut.png
   public/art/pause/ch4-ffx2-bahamut.png` (hash verified: `79047d2f...`).
3. `public/art/pause/ch4-ffx2-bahamut.2x.webp`: a Lanczos x2 resample of that PNG
   (2688x1536, webp quality 88, sha256 `1850e6de...`). No 2x master of the approved
   painting ever existed, and no upscaler was run and nothing was repainted. Owed if
   Bailey wants it crisper on a retina display: a RealESRGAN x4 -> lanczos 0.5 master of
   the same PNG (the pipeline's own route; GPU rules apply).
4. `public/art/pause/ch4-ffx2-bahamut.json`: the previous sidecar with `alias` and
   `aliasOf` dropped (this file is its own painting now), `master` rewritten to say the
   2x is a resample, and `restoredFrom` / `restoredBy` / `replaced` added. `focal`
   (0.48, 0.42) is kept; it sits on the approved painting's face.
5. The approved copy is also under `D:/Tools/pyrefly-art-backup/approved/
   2026-09-29-ch4-pause-plate/`.
6. `node tools/gen/manifest.mjs --check` says `unchanged`: the plate stayed in `pause`
   and `pause2x`, so `manifest.json` needed no regeneration.
7. `ch4-bahamut.*` (the unused FFX-era alias) was left exactly as it was.

Committed on branch `r29-plate`: `docs/target/approved-hashes.json` (the two
`ch4-ffx2-bahamut` entries now pin the restored hashes, old ones kept as
`previousSha256`), `docs/target/targets.json` (the tile's `deliveryNote`),
`docs/target/decisions.json` (D-257 `implemented`), this note, the proof pictures and a
guard test `tests/unit/pause-ch4-plate-approved.test.ts` (pins the registry always, and
the bytes on disk wherever the art exists; a skip on a bare checkout).

## Proof

Production build (`vite build`, base `/pyrefly-reprise/`), headless Chromium on the GPU
(`PYREFLY_BROWSER=gpu`), own preview server on port 8100, stopped by PID. Title ->
Enter -> Chapter IV -> battle -> a command menu -> **real Esc** -> **real `E` keys** to
the CHAPTER tab. Script: `docs/screenshots/r29-plate/pause-shot.mjs` (paths hard-coded to the C: proof copy).

| | served plate | sha256 | vs the tile |
|---|---|---|---|
| Before (1600x900 and 390x844) | `ch4-ffx2-bahamut.2x.webp` | `ece2de6d...` | mean abs diff 98.6 of 255 (a different painting) |
| After (1600x900 and 390x844) | `ch4-ffx2-bahamut.2x.webp` | `1850e6de...` | mean abs diff 1.39, max 36 (resample and webp only) |

The 1x PNG in the build is byte-identical to the approved file (`79047d2f...`). Zero
console errors and zero 4xx/5xx in each run (`docs/screenshots/r29-plate/*-info.json`).

- `docs/screenshots/r29-plate/r29-plate-1600x900.jpg` and `r29-plate-390x844.jpg`:
  target tile | before | after, side by side. The pause dims the plate on purpose
  (chrome legibility); that dimming is unchanged.
- `*-pause.jpg`: the four raw frames.

The proof build was made from a copy of the tree at `1bab936e` (source) with the art
folder copied to C:, because D: was at 0 bytes free that night (see below); the files
it served are byte-identical to the ones now in `D:/Final Fantasy/public/art/pause/`
(hashes checked). It was not built into the shared `dist/`.

## Checks

`npx tsc --noEmit` clean; `tests/unit/pause-ch4-plate-approved.test.ts` (3),
`pause-fullbleed`, `pause-remake`, `critic-policy-adoptions`,
`target-approved-hashes-judge-locked` pass; `node tools/orphans.mjs` lists src modules I did not touch
(nothing of mine is in `src/`).

## For the driver

- **D: filled up during this run** (0 bytes free for minutes, then 11 GB free). Every
  write on D: failed with ENOSPC until it freed; the many `D:\pyrefly-r29-*` worktrees
  are the likely cause. Scratch: `C:/pyrefly-r29-plate-proof` (proof copy, contains a
  node_modules junction and per-folder art junctions) and the session scratchpad.
  Nothing was deleted.
- A stray branch `r29-plate-wt` (same commit as `r29-plate`) exists from a worktree
  command that reused a name; the worktree `D:/pyrefly-r29-plate` is on `r29-plate`.
  Its `node_modules` and `public/art` are junctions: unlink them with `cmd /c rmdir`
  before any worktree removal.
- The branch was cut from local `main` (`1bab936e`), not `origin/main` (`c9c1c295`),
  because D-257 only exists on local main.
- The tile is "implemented", not "verified": a review still has to match it.
- Not touched: FFX Chapter III's plate, the other 28 pause plates, the FFX-2 sidecar
  `ch4-bahamut.json`.

## CHECK (independent, 2026-09-29, not the builder; FFX-2 only for the change, shared code untouched)

Verdict: GO. Fresh production build of f3e9fa61 (vite build to `C:/pyrefly-r29-check/dist`, not the shared
`dist/`; the branch differs from 1bab936e only in docs, tests and the registry, and the worktree's `public/art`
is the same art as main's). Headless Playwright, real Esc, real E keys to the CHAPTER tab, own ports 8110 to 8113.

- Chapter IV at 1600x900 and 390x844: the plate served is `ch4-ffx2-bahamut.2x.webp` (sha 1850e6de, matches the registry)
  and its 1x sibling is byte-identical to the approved painting (sha 79047d2f). Pixel diff against the tile
  `docs/screenshots/concept/pause-ch4.png`: 1x PNG 0.0, 2x webp 1.48 of 255 (Lanczos resample and webp; the old render
  `ch4-bahamut.png` measures 98.75). 0 console errors, 0 4xx/5xx. The 2x is still a stand-in until a RealESRGAN master exists.
- Neighbours unchanged: Chapter III (FFX, `ch3-braskas-final-aeon`) and Chapter V (FFX-2, `ch5-ffx2-vegnagun-shuyin`) served
  hashes equal the registry and the disk files, 0 errors. The registry diff touches only the two ch4-ffx2-bahamut entries.
- `npx tsc --noEmit` clean; 61 pause/target/decision-related test files, 631 tests, all pass, including the new guard.
- `git merge-tree --write-tree origin/main r29-plate` is clean (no conflicts).
- Notes: the branch is on local main (1bab936e), which origin/main does not contain yet, so push main before or with it.
  The stray branch `r29-plate-wt` is harmless. Servers stopped by PID. Scratch: `D:/Tools/pyrefly-scratch/overnight-0929/r29-plate-check/`.
