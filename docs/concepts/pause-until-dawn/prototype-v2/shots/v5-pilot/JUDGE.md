# Living portrait v5 pilot: independent judge (2026-09-24)

Game case: **both**. This covers shared portrait plumbing, tested on the FFX-2 Yuna plate. I made none of the pilot and
changed nothing in it. This report is the only file I committed.

**Verdict: FAIL as a whole. The pilot fixes the cuts but does not reach Bailey's bar.** Method (d) does solve the
problem Bailey named, "no continuity whatsoever": the face no longer changes painting at a cut. The build fails the
other two things Bailey asked for, "more natural and more fluid" and "expression animated like Until Dawn". It also
brings one regression against v4.1: **the blink stops working whenever the head is turned.**

| Score (0-10, pass needs 7 or more on each) | v5 pilot | v4.1 | Visibly better than v4.1? |
|---|---|---|---|
| Continuity | **7** | 3 | yes |
| Identity (checked against the original plate) | **7** | 4 | yes |
| Fluidity | **6** | 5 | slightly |
| Expression | **3** | 5 | **no, it is worse** |

## How I checked

- I extracted every frame of `pilot.mp4` (349 frames) and `compare.mp4` (693 frames) with FFmpeg 9.0.1. To match
  frames to cuts I used the recording logs in `D:/Tools/pyrefly-lora/yuna-x2/rig-v5/shots/*.json`. For
  `compare.mp4`, video time equals the log time. For `pilot.mp4`, video time equals the log time plus 0.2 s, less
  about 0.28 s of capture lag.
- I ran the pilot's `sweep-metric.py` again on copies of both 1-degree sweeps. I also wrote two measurements of my
  own, described below: the **pure swap at the same yaw**, and a **block match of each region at the cut**.
- I looked at 1:1 head crops for 5 frames around each of the 8 cuts in the pilot half of `compare.mp4`, and at
  v4.1 through its dissolves. I also compared face crops at 0 and ±20 degrees for the plate, the pilot and v4.1.

## Swap metric, measured again

- **Head-box S (the pilot's own metric):** I get the same numbers. The pilot scores 0.99 to 1.24 at all 8 cuts, and
  its largest step away from any cut scores 1.13. v4.1's keys under the same hard cut score 2.55 to 2.63. There are
  0 of 41 frames with two paintings in each sweep direction.
- **A weakness of S:** one 1-degree step already changes the head box by about 12 on average, because the whole face
  is being warped. A change confined to one part of the head can therefore hide inside that number.
- **Pure swap at the same yaw (my measurement):** the 3-degree hysteresis means the up and down sweeps pass through
  the same yaw with different paintings. Subtracting those two frames isolates what the painting change alone
  alters.

  | at the same yaw | head MAD | eyes | mouth | jaw | tassel jump | far-side hair tips |
  |---|---|---|---|---|---|---|
  | pilot, plate to ±10 key (±5 degrees) | 6.4 | 2.0-2.1 | 0.5 | 3.2-3.9 | **6 px** | 3-4 px jump, texture change (MAD 14-15 after alignment) |
  | pilot, ±10 to ±20 key (±15 degrees) | 3.5-4.2 | 1.2-2.4 | 0.4 | 3.6-6.0 | **4 px** | none |
  | v4.1, plate to ±20 key (±10 degrees) | 35-37 | 24-29 | 10 | 33-38 | 16 px | up to 14 px jump |
  | pilot, same painting and same yaw (the noise floor) | median 1.6, max 5.6 | | | | | |

  Inside the face the swap cannot be told from the noise floor. v4.1's swap is about 10 times larger.
- **Tassel:** outside the face, the tassel still jumps 4 to 6 px at every cut. Between cuts it moves about 1 px per
  degree. The likely cause is the tassel offset changing in steps from one key to the next (tasselDx 14.5 / 29).
- **Hair:** at the plate cuts, the hair tips on her far side jump and change texture. At pause-screen size (the
  portrait shows at about 61 %) this reads as a small tick at the edge of the head, not as a double image.

## At 1:1, frame by frame

- **At the cuts:** I found no double iris, no double lash line, no change in eye shape and no shift in colour
  across the 8 pilot cuts. v4.1 at the same beats shows the cut plainly: the eyes change shape, the iris turns from
  green to cyan, and frames 146 and 149 show a double image.
- **Ghost jaw:** this is the worst visible defect, and it is in the keys rather than at the cuts. On the v5-r10 and
  v5-r20 keys (about +8 to +20 degrees), a grey band with a second dark stroke runs along her right jaw beside the
  tassel. It shows at display size in `compare.mp4` frames 100 to 230, and at +20 it looks like a torn grey patch.
  It is a double contour, which is exactly the kind of doubling Bailey objected to. A fainter broken red contour
  runs along the jaw at -20 to -14 degrees.
- **Smoothness:** `pilot.mp4` has no frame-step spikes; I found no step above 2.5 times its local median. Motion is
  steady, but the range is only ±20 degrees (v4 went to ±85). Within that range the turn reads as a flat 2D slide of
  one painting rather than a head turning.

## Identity, against the original plate

- **What holds:** at ±10 and ±20 her eyes are the plate's eyes. The iris is green on her right and blue on her left,
  and the catchlights, lash line, mouth and hair tips are all the plate's. v4.1 at ±20 is visibly a different
  painting: reshaped eyes, a cyan iris, a different nose line.
- **A limit of the pilot's own check:** its identity number (face MAD 0.17 to 2.30) compares each key with the plate
  pushed through the same warp. It therefore shows only how much the repaint changed things. It cannot catch
  distortion caused by the warp, and it cannot catch defects outside the face box, such as the ghost jaw.
- **Why 7 and not 8:** the ghost jaw and the red contour are damage to her face outline.

## Expression: a regression

- **The blink is gone on every grown key.** In `compare.mp4`, v4.1 closes its eyes at frames 213 to 215 (+19
  degrees) and 502 to 504 (-19 degrees). At the same beats in the same recording, the pilot's eyes stay wide open.
  Over the 14 s of `pilot.mp4`, only 1 of the 3 logged blinks appears (frames 287 and 288, on the plate at 0
  degrees). The two logged blinks at ±20 do not show. The logged half-lid moments do not show either.
- **Likely cause:** the grown keys have no per-key eyelid frames. v4.1 has them (the `keyLidsReadme` entry in
  `rig.json`, made by `rig-lids2.py`).
- **The rest:** the slight smile and the raised brow are hard to see. The expression is still a handful of fixed
  states, not the continuous facial performance of Until Dawn.

## What would need to change before phase 1 (options for Bailey, not built)

1. Add eyelid frames to the grown keys, so the blink and half-lid work at every yaw.
2. Fix the ghost jaw at its source, and give the tassel an offset that moves continuously with yaw so it stops
   jumping at the cuts.
3. Show the ±30 and ±40 growth, because the turn needs more range to read as natural.
4. Expression needs its own options round (end state first): continuous mouth, brow and lid shapes plus small
   glances. The current states cannot meet the Until Dawn bar.

Other notes: the pilot's `rig-chain.py` is 476 lines, over the 400-line limit. C: had 91 GB free during this
review.
