# Living portrait v5.1: independent judge (2026-09-24)

Game case: **both**. This covers shared portrait plumbing, tested on the FFX-2 Yuna plate. I made none of v5.1 and
changed nothing in it. This report is the only file I committed.

**Verdict: FAIL.** v5.1 fixes three of the pilot judge's four failures: the blink works on every key, the ghost jaw is
gone and the range is now ±40. The cuts are still invisible in the face. Expression is still a handful of discrete
states, well short of Until Dawn's continuous performance, and no better than v4.1. v5.1 also adds a defect nobody
reported: a thin dark line flickers across her throat.

| Score (0-10, pass needs 7 or more on each) | v5.1 | v5 pilot | v4.1 | Visibly better than both? |
|---|---|---|---|---|
| Continuity | **7** | 7 | 3 | than v4.1 yes. Than the pilot, no: the cuts are equally clean and the throat line is new |
| Identity (checked against the original plate) | **7** | 7 | 4 | than v4.1 yes. Than the pilot, a trade: the jaw is fixed, but the hair smears at ±30..40 |
| Fluidity | **7** | 6 | 5 | yes, against both |
| Expression | **5** | 3 | 5 | **no**: the blink regression is fixed, but it is not better than v4.1 |

The pilot and v4.1 scores are the v5 pilot judge's (`../v5-pilot/JUDGE.md`). I did not re-score them.

## How I checked

- **Video frames:** I extracted every frame of `clip.mp4` (412) and `compare.mp4` (692) with FFmpeg 9.0.1, TEMP on D:.
- **A fresh sweep:** the builder's recording logs were no longer on disk, so I recorded my own 1-degree sweep from
  -40 to +40 and back. I used the builder's `tools/shots.mjs --phase sweep --range 40` against the scratch runtime at
  `D:/Tools/pyrefly-lora/yuna-x2/rig-v51/proto` (GPU Chromium, `?post=0`, reduced motion). I scored it with the
  pilot's `sweep-metric.py`.
- **My own measurements:**
  - the pure swap at the same yaw, by region, against the same-painting noise floor;
  - the step of the earring centroid, and of the far-side red ornament, at the cuts and away from them;
  - a detector for thin horizontal lines across the throat.
- **Looking at 1:1:** up and down swap pairs with ×3 difference images, eye crops through every blink beat, neck
  crops across the clip and in all three compare panels, and hair crops at ±40 beside the plate
  (`art/rest-composite.png`).

## Swap metric, measured again

- **Head-box S (the pilot's metric) reproduces the builder's numbers.**
  - Up: 1.10 / 1.19 / 0.82 / 1.02 / 1.31 / 1.06 / 1.01 / 0.90.
  - Down: 0.94 / 1.04 / 1.05 / 1.34 / 1.06 / 0.86 / 1.23 / 1.13.
  - Largest step away from a cut: 1.20 up and 1.23 down. Frames with two paintings on screen: 0 of 81 in each
    direction. The gate is S ≤ 1.5, so every cut passes.
- **Pure swap at the same yaw** (up and down passes, same degree, different painting), MAD in levels. The boxes are
  tight and keep the tassel out.

  | cut pair (yaws) | head | eyes | nose | mouth | jaw |
  |---|---|---|---|---|---|
  | l40 to l30 (-36..-34) | 4.5-4.7 | 2.3-2.9 | 0.5-0.7 | 1.3-1.5 | 2.1-2.3 |
  | l30 to l20 (-26..-24) | 5.4-5.5 | 3.5-4.0 | 0.7 | 2.2-2.3 | 1.4-1.5 |
  | l20 to l10 (-16..-14) | 5.5-5.7 | 3.2-3.8 | 0.2-0.3 | 0.8-0.9 | 0.7 |
  | l10 to plate (-6..-4) | 7.9 | 3.0-3.3 | 0.2 | 0.5-0.6 | 3.3-3.4 |
  | plate to r10 (4..6) | 7.8-8.0 | 2.7-3.3 | 0.2 | 0.5 | 1.4-1.5 |
  | r10 to r20 (14..15) | 5.0 | 2.7-2.8 | 0.2 | 0.8-0.9 | 0.7 |
  | r30 to r40 (34..36) | 3.5-3.7 | 2.0-2.5 | 2.5-3.3 | 8.1-8.5 | 1.1-1.8 |
  | noise floor: same painting, same yaw (n 55) | median 2.9, max 7.5 | median 0.9 | median 0.1 | median 0.3, max 8.1 | median 0.2, max 2.7 |

  At +24..+26 and +16, the eyes read 8.7-13.9 because of an idle half-lid in the up pass (aperture 0.58-0.91), not
  because of paint. The builder saw the same thing. In the ×3 difference images, the face at every swap is thin
  edge lines only. The head number is driven by the tassel. At +34..+36 the mouth box reads 8 because the edge of the
  swinging tassel reaches it. The floor's own maximum there is also 8.1.
- **Tassel:** the earring centroid moves 0.1-4.0 px at the cut steps and 2.1-2.2 px (median) away from them; the
  largest step away from a cut is 3.7-3.9 px. One cut is above that: +34 to +33 on the way down, 5.1 px. That is a
  1-2 px tick, not the pilot's 4-6 px jump at every cut. The builder's reading holds: the up-minus-down difference
  is swing lag, and it is just as large on the same painting (up to 14 px).
- **Far-side hair ornament:** the cut steps are 0.6-5.0 px. Away from the cuts the median is 1.3-1.4 px and the
  maximum 7.0-7.5 px. The largest cut step is -34 to -33 going up (5.0 px), a small tick at the hair edge. In the 1:1
  pairs the hair strands next to the ornament change a little at the l30/l20 and l40/l30 swaps (far-hair MAD 7.3-7.7
  against a floor maximum of 5.7). At display size it reads as shimmer, not as a double image.

## At 1:1, frame by frame

- **Cuts:** as in the pilot, I found no double iris, no double lash line, no change in eye shape and no colour shift
  at any of the 16 cuts. The green and blue irises, the catchlights, the nose dot and the mouth line are the same
  painting on both sides of every cut.
- **Ghost jaw: fixed.** In `compare.mp4`, the pilot panel shows the grey band and second stroke along her right jaw
  in every sampled frame (100, 200, 300). The v5.1 panel has a single clean jaw contour at the same moments, and the
  sweep's jaw is clean from -40 to +40.
- **New defect, not disclosed: a line across the throat.**
  - **What it is:** a 1 px dark horizontal line, about 100-230 px long, across her throat. It sits at about canvas y
    822-833, which is where the new neck layer eases to still at the collar (y 830).
  - **Where it shows:** in `clip.mp4` (for example frames 25, 75, 190 and 380) and in the v5.1 panel of `compare.mp4`
    (frames 100, 200 and 450).
  - **Where it does not show:** in the `?post=0`, reduced-motion sweep, so it appears only when the body moves or
    with the post pass on. It is also absent from the v4.1 and pilot panels.
  - **How often:** my detector flags 132 of the clip's 412 frames, in runs (20-29, 71-79, 87-97, 185-215 and
    others), so it blinks on and off.
  - **Why it matters:** it is small, but it is the kind of flicker Bailey called "no continuity".
- **Tassel at the cuts:** it follows the ear. I saw no jump at display size.
- **Hair at ±30..40 (identity):**
  - At -40, the far-side hair above the ornament is a flat pink smear with a horizontal texture break (disclosed).
  - At +40, the far-side hair on image left is soft and washed out, with less ink than the plate. The soft brown
    column behind the tassel shows (disclosed).
  - At +16..+30, the thin pale neck edge beside the jaw corner shows (disclosed).
  - The face itself holds: at ±40 the near eye is the plate's eye, and the far eye is compressed but recognisably
    the same.

## Fluidity

- The v5.1 panel of `compare.mp4` has no frame-step spike outside the blink and smile beats. The frame-to-frame
  head step never exceeds 1.8 times its local median, except at the blink frames (up to 3.0).
- The turn now reaches ±40, and at +40 it reads as a head turn, not as the pilot's flat slide.
- Two limits keep it at 7:
  - The skull silhouette hardly rotates. The face slides and the far-side hair stretches, so at ±30..40 the motion
    still reads partly as a warp of one painting.
  - The range is short of the ±45 or more measured for Until Dawn.

## Expression

- **Blink: fixed on every key.** It closes fully while turned: clip frames 263-264 at about +40 and 337 near 0, plus
  a closing beat at the +40 end of `compare.mp4` (frames 206-207), where the pilot's eyes stay open. The close is
  quick (open, closed, half, open over 4 frames), which is acceptable. The half-lid frame is still about 40 % open
  (disclosed).
- **Smile:** it plays on the turned keys.
- **Why this scores 5, not 7:** the expression is still four mouths, two brows and the lid frames, switched on and
  off. There is no continuous shaping of the mouth, brows or cheeks, no gaze that moves apart from the head, and no
  micro-motion between states. That is exactly the gap to Until Dawn that Bailey named ("yuna's expression also
  needs to be animated just like in until dawn"). It matches v4.1 and does not beat it. The pilot judge's item 4
  still stands: expression needs its own options round (end state first) before more building.

## What would need to change (options for the orchestrator to put to Bailey; nothing built)

1. Fix the throat seam at the neck layer's collar boundary, and check it with the post pass and body motion on,
   not only in the `?post=0` sweep.
2. Hold ±30..40 until the far-side hair is repainted without the pink smear and the washed band. Otherwise, cap the
   live range at ±30.
3. Expression: run an options round for continuous mouth, brow, lid and gaze shapes. This is the item that decides
   the pass.

Other notes: during this review I ran the scratch Vite server on 5233 and then stopped it. I queued no ComfyUI
prompt. My scratch was on D: (`D:/Tools/pyrefly-scratch/portrait-v51`) and I deleted it at the end. C: had 124 GB
free.
