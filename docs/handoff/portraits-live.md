# Portraits live: the living portraits on the Until Dawn pause (2026-10-03)

Branch `portraits-live` (from `origin/main` 87678c87), worktree `D:/pyrefly-fb-camera`. **Not deployed, not reviewed.**
Game case (rule 14): **both.** The driver, the clock, the gaze and the switches are shared plumbing (CHK-020); the
parts are per plate: FFX plates (Tidus, Yuna, Wakka, Lulu, Kimahri, Auron, Rikku: Chapters I to III and the rest) and
FFX-2 plates (Yuna X-2, Rikku X-2, Paine: Chapters IV and V and the rest). FF7 has no parts and stays static.
Approved targets built: D-021 (the Until Dawn pause), D-143 feel A2 "measured", D-320 (the painted face parts at the
recommended picks), D-321 (the eyes follow the highlighted tab or row, no extra input).
Paper preflight (rule 15): [`docs/plans/portraits-live-review.md`](../plans/portraits-live-review.md).

## What it does

- **`LivingPortraitDriver`** (`src/app/screens/pause/`) is a `PortraitDriver`. For each plate the stage mounts it builds a
  twin `div` of the plate (same class list and inline box, re-synced every frame, animation clock copied) holding one
  small canvas at the parts' bounding box (694 x 574 px for Tidus at the 2x scale, in percent of the plate). Only the
  parts are drawn; at rest nothing is, so the plate is today's pixel for pixel.
- **The A2 loop** (`livingTimeline.ts`, pure): smile swell at 0.6 s (400 ms in, 2.8 s out), blinks at 1.45 s and 6.05 s
  (50/33/66 ms), a glance aside 2.0 to 5.2 s, the concerned press at 6.1 s (400 ms in, 2.8 s out), no worried brow. The
  first cycle is the approved clip; it repeats every 12 s with the blinks nudged by a fixed hash (no engine RNG).
  The eyes lead the input on a 50 ms critically damped spring; the fixation drifts under a pixel.
- **Gaze** (`livingGaze.ts`, D-321): `livingPause.ts` reads the highlighted row (else the active tab) every 140 ms and calls
  `PortraitStage.setGaze` with its centre as a point in the painting's frame; the driver turns "face to point" into an
  iris offset (full deflection at a quarter-frame away, at most 6.5 x 3 px at the 2x scale, plus 2 px for the glance,
  scaled by the plate's `gazeScale`, clamped). The iris moves in whole part pixels, so it is as sharp as the plate.
  Real keys, Ch I at 1600x900: Tidus tab iris (-8.1, -3.8), Yuna tab (-3.5, -2.5), Kimahri tab (-3.1, -1.9); with the cursor
  in the GUIDE tab's row (x 1007, y 344) the same Kimahri plate looks right and level (+4.6 to +6.3, -0.2): `gaze.mjs` log.
- **Per plate, from the manifest, not code:** Kimahri blinks and looks with the near eye only; both Rikkus keep the wink
  (only the open eye has parts); Auron has the visible eye sliver's lid and no eye movement. `gazeScale` lowers travel
  where the contact sheets showed shards at 8 px (1:1 sheets, `states/` in the scratch folder): Yuna X-2 0.7, Kimahri 0.7,
  Rikku X-2 0.6, Rikku 0.75, Lulu 0.8, Yuna and Paine 0.9, the rest 1.0.
- **Switches:** off when LIVING PAINTINGS is off (the look row, its EYE CANDY master, `?fx=off`) or REDUCE MOTION is on
  (the OPTIONS row or the OS). Both are polled, so flipping either on the EYE CANDY page works while the pause is open
  (verified live in `offrm.mjs`). When off there is no driver, no twin, no part loaded.
- **Phone tier:** `eyeCandy.tier !== 'full'` (short side under 600 px, or LOW EFFECTS) loads the 1x parts and a 347 x 287 canvas
  (0.4 MB of canvas against 1.6 MB). Cost is small, so it is in.

## The parts and the install list (for release time)

`tools/portrait-parts.py` copies the D-320 picks from
`D:/Tools/pyrefly-art-backup/candidates/2026-10-02-overnight/portrait-face-parts/<plate>/parts/` into
`public/portrait-parts/<plate>/{2x,1x}/<part>.png` (the eye windows packed into the alpha of a white PNG) and writes
`public/portrait-parts/manifest.json`. The folder is a real directory in this worktree, listed in `.git/info/exclude`
(`/public/portrait-parts/`), not under the `public/art` junction. Nothing was written under `public/art` or
`approved-hashes.json`.

**Install at release time:** copy `D:/pyrefly-fb-camera/public/portrait-parts/` to `D:/Final Fantasy/public/art/portrait-parts/`
(the art is local-only; the driver looks in `art/portrait-parts/` first and `portrait-parts/` second), or re-run
`python tools/portrait-parts.py --out "D:/Final Fantasy/public/art/portrait-parts"` from the release tree. Then run
`node tools/fx-assets.mjs verify`, the art backup, and look at the deploy preflight (it decode-checks every shipped file).

| | bytes |
|---|---|
| 2x parts, ten plates | 2,323,463 |
| 1x parts, ten plates | 736,030 |
| both + manifest | 3,059,493 + the manifest (19.5 KB) |
| `dist` today (rel36 candidate) | 798,872,117 |
| `dist` with both scales | about 801.9 MB: **1.9 MB over the 800 MB line** |
| with lossless WebP instead of PNG (measured, pixel-exact) | 2.01 MB total (2x 1.50 MB) = 800.9 MB: still over |

So the line needs room first: **PR-0328 (hidden source maps, about 22.7 MB) is the recommended yes** (NOW.md); with it the parts
fit with 19 MB to spare. Without it the least that goes in is the 2x set as lossless WebP (1.5 MB, 800.37 MB), still 0.4 MB over.
A decision for Bailey, not made here.

## Proof (all by real keys in headless Playwright, GPU mode, own port 5820, since stopped)

Scratch: `D:/Tools/pyrefly-scratch/2026-10-03/portraits/` (clips `ch1-1600-*.webm`, `ch4-1600-*`, `ch1-390-*`, `ch4-390-*`: 20
clips, 8 s each, 0.07 to 0.43 MB; `states/*.jpg` the renderer on the real master at 1:1 per plate; `perf.jsonl`; the scripts).
In-repo screenshots: `docs/screenshots/portraits-live/` (Ch I Tidus and Ch IV Yuna X-2 at 1600x900 and 390x844, a smile frame and
a press frame each).

- **Ch I (Tidus) and Ch IV (Yuna X-2), 1600x900 and 390x844:** P opens the pause, E walks the strip. Plates with a member tab
  in those chapters were reached by real E presses (Tidus, Yuna, Kimahri in Ch I; Yuna X-2, Rikku X-2, Paine in Ch IV). **Wakka,
  Lulu, Auron and Rikku (FFX) have no member tab in Ch I and were put up through the stage's own `show()`**, said so here.
- **Frame time and memory with the pause open** (8 s of rAF, `perf.mjs`; 60 Hz display so 16.7 ms is the floor):
  - 1600x900, living ON: p50 16.7, p95 16.8, p99 33.3 / 33.4, max 66 and 83 ms (two runs); OFF: p50 16.7, p95 16.8, p99 33.3 and 16.8,
    max 50 and 50; REDUCE MOTION: p99 16.8, max 33. ON shows about 1 % of frames at 33 ms and a one-off 66 to 83 ms frame
    (the first draw while the parts decode) against OFF's 0 to 1 %: **within noise of the battle scene running behind the pause,
    but a small first-draw hitch is real.**
  - 390x844, ON: p50 16.7, p95 16.7, p99 16.8, max 33; OFF: same p99, max 33.
  - JS heap (CDP) 47 to 54 MB in every mode, ±6 MB between runs: no measurable change. DOM nodes +16 (984 vs 968).
    Canvas backing store 1.59 MB (desktop, 2x) and 0.40 MB (phone, 1x); decoded parts about 1 MB per plate. Two plates stay cached.
- **LIVING PAINTINGS off and REDUCE MOTION on give today's plate** (`offrm.mjs`, Ch I 1600x900, flipped live through the settings
  store with the pause open): with either on `[data-living]` count is 0 and the stage reports no driver; PNG screenshots of
  REDUCE MOTION alone and REDUCE MOTION plus the look off are **byte-identical**, and identical again 1.5 s later; turning
  both back takes the face back within about a second (`twins: 1`) and REDUCE MOTION again removes it (screenshot byte-equal
  to the first). A pre-existing quirk, not mine: the `pause__art--still` class is only refreshed on the next render.
- **Ten plates at 1:1** (`states/<plate>-2x.jpg`): rest, open smile, press, blink, gaze at the extremes. Flaws seen are the READMEs'
  flaws (Lulu's soft far-eye patch, Kimahri's lavender far-eye patch kept out by blinking the near eye only, white slivers at
  the iris edge at 8 px, now kept out by `gazeScale`, a faint ghost of Tidus's teeth while the press is half there).

## Every visible difference from the 2026-10-02 preview clips

1. **No brow lift.** The preview lifted a band above each eye by 4 to 5 px at 3.3 s. No brow part was painted (A2's lift is a
   warp); the live build has none, and no worried brow (D-143). Whether to build the lift is Bailey's call.
2. **Blinks are a cel snap**, not an opacity cross-fade: the closed lid is either up or not (up under half aperture, about 90 ms),
   so no frame mixes two paintings at the eyes. (A top-down wipe of the lid was built first and dropped: it showed a hard box
   edge on every plate at 1:1.)
3. **The press is shaped.** Its weight runs nothing under 0.15 and full from 0.75, so the teeth of a toothy grin (Tidus, Wakka)
   ghost through for less time; the preview's linear cross-fade showed them for most of the 2.8 s tail. The press therefore
   reads as a quicker set and release than the preview, with the same start (6.1 s) and the same total length. The smile stays
   linear.
4. **The gaze follows the highlight** (D-321) instead of the preview's fixed glance (+6, -2 px); the A2 glance aside at 2.0 to
   5.2 s is kept as a 2 px extra toward the highlight's side, the iris moves in whole pixels (the preview's spring was sub-pixel)
   and travel is per plate (0.6 to 1.0 of 8.5 px). Eyes up and to the tab strip is the resting look while the cursor is in the strip.
5. **Over the graded, moving plate.** The preview was the raw master at 1:1; the live face sits under the pause's grade, over
   the push-in and drift, the cross-fade on a member change and the slide mask, so it is darker, softened by the plate's
   grade and moves with the plate; on a phone only part of the face is in frame.
6. **It loops** (every 12 s, blinks jittered) where the preview was one 8 s take.
7. **Kimahri** blinks the near eye only (the preview blinked both and showed the lavender patch); both Rikkus keep the wink;
   Auron's eyes do not move (his lid blink is kept).
8. **Phone tier** uses the 1x parts; the preview had no tiers.
9. **The first frame** of a plate shows the plate until its parts decode (about 100 to 300 ms from a local server); the smile
   starts 0.6 s after the plate comes up, as in the clip.

## Deviation to disclose

One `rm -f` of my own earlier preview clips in the scratch folder (`ch1-1600-*.webm`, from the first capture of this lane) before
regenerating them; the next run overwrote them anyway. Nothing else was deleted, and nothing outside my own scratch.

## Gates

- `npx tsc --noEmit`: clean.
- Full `npx vitest run --testTimeout=60000`: 752 files, **746 passed, 5 skipped, 1 failed** and 11,053 tests passed. The one failure
  was `strategy-ffx2-bahamut.test.ts` "heal-only route clears Mega Flare" timing out at 60 s while the whole suite ran on a busy
  machine; **the file alone passes (19 of 19, 28 s)**. The new file `tests/unit/pause-living-portraits-live.test.ts` (16 tests) and
  the edited `pause-remake.test.ts` seam test (the driver is on by default and off under REDUCE MOTION) pass.
- `node tools/orphans.mjs`: 24 orphaned of 1183, the same 24 as on main (none of the new modules).
- Rule 7: `PauseView.ts` is 395 lines (was 397, three lines added by trimming one comment block); the largest new file is 296.

## Files

New: `src/app/screens/pause/{LivingPortraitDriver,livingParts,livingTimeline,livingGaze,livingRender,livingPause}.ts`,
`src/ui/common/pause-living.css`, `tools/portrait-parts.py`, `tests/unit/pause-living-portraits-live.test.ts`,
`docs/plans/portraits-live-review.md`, this file, `docs/screenshots/portraits-live/`. Edited: `PauseView.ts` (the wiring: five
lines), `tests/unit/pause-remake.test.ts` (one test). Contracts: no shared contract file changed.
`PortraitStage.ts` is untouched (398 lines, at the cap): the seam was already there.

## Not done / for Bailey

- Release-time install and the 800 MB line (above). The deploy path needs a focused review (this is classed DEEP by
  `critic-plan`: a deep review on the live build after the deploy).
- The brow lift (difference 1) and whether the press shaping (difference 3) reads right to Bailey's eye: the clips are in the
  scratch folder; audio does not apply.
- The Clair Obscur / Persona camera grammar was not touched (camera-lab owns it).
