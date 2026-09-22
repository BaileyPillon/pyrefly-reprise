# Living portrait FLF, round 3: judge of the `idle-blinks` clip (seed 1)

**Verdict: FAIL. Do not show this clip to Bailey.** Judged 2026-09-22, separately from the
generator and without rendering. Every number here comes from my own numpy pass over the
frame PNGs (`judge-clip-analyse.py`, `judge-clip-cutstats.py`, raw output
`judge-clip-metrics.json`), not from the generator's log. Evidence at 1:1:
`judge-clip-strip.jpg` (built by `judge-clip-strip.py`).

Clip: `D:/Tools/pyrefly-video/flf/idle-blinks/1/`, 97 frames, 1280x704, 24 fps (4.04 s),
rendered in 4382 s (73 min). Plate: `pyrefly-video-plate-f1efe21f6c75-1280x704.png`.
VAE floor: the plate round-tripped through the Wan VAE (`vae-floor/`).

| Score | Value | Bar |
|---|---|---|
| JOIN-FIRST | **5** | 8 |
| JOIN-LAST | **2** | 8 |
| IDENTITY | **4** | 7 |
| MOTION | **3** | — |
| Hard cut visible at 1:1 | **yes, glaringly** | no |

## Verdict in one paragraph

The round-3 end-anchor fix did not produce a seamless end; it produced a different
failure. Geometry is perfect: phase correlation of the head box and of the body box is
exactly (0, 0) on every frame, so there is no drift, push-in or sway. But the **tone** of
the clip is not pinned at all. Frame 1 sits near the plate (face 1.75x the floor), then
from frame 2 the whole picture snaps to a washed, desaturated, softer grade (mean
saturation 0.61 to 0.53, face MAD against the plate 14 to 24 for frames 2 to 93, about
6x the floor). Frames 78 to 93 brighten further, and at **f93 to f94, the first frame of
the anchored last latent, the image pops to an over-exposed, over-saturated, blown-out
orange grade** (head step 27.95 against a median step of 1.63, saturation 0.45 to 0.58 to
0.67). Frame 97 is 5.8x the floor on the face and **13.1x on the mouth**. The anchored
last latent is not decoding to the plate; it overshoots. Looped with a hard cut, the
join is a 21.8x-median jump from the blown-out grade back to the plate, then a second
9x snap to the washed grade one frame later: anyone would see it. The blinks are also
wrong for the spec: one slow 1.2-second event that closes, half reopens and closes again
(a double blink, which the spec forbids), with close and open phases 4 to 8 times slower
than a real blink, and no separate half blink. Identity landmarks hold (eye colours on the
correct sides, cyan braid and gold clasp, outfit), but the palette and line do not.
Nothing from this clip may be shown.

---

## 1. Joins against the plate (head-only boxes, VAE floor next to each)

MAD / max-abs / p99.9 of the per-pixel mean absolute RGB difference, 0 to 255. Boxes are
the round-2 judge's (`judge.md` §2) plus a body box and two background boxes I added.

| box (x0,y0,x1,y1) | floor MAD / max / p99.9 | **f1** vs plate | f1 x floor | **f97** vs plate | f97 x floor | seam f97 to f1 |
|---|---|---|---|---|---|---|
| face 420,20,760,400 | 3.85 / 97 / 41.9 | 6.75 / 121.3 / 53.7 | **1.75** | 22.26 / 180 / 121.6 | **5.78** | 24.52 |
| eyes 460,140,635,285 | 4.70 / 97 / 55.0 | 7.42 / 121.3 / 69.5 | 1.58 | 23.26 / 180 / 141.6 | 4.95 | 25.09 |
| greenEye 468,203,546,278 | 6.67 / 97 / 62.0 | 9.89 / 92.7 / 74.7 | 1.48 | 27.00 / 161.7 / 143.7 | 4.05 | 28.95 |
| blueEye 548,145,626,220 | 5.66 / 64.3 / 56.0 | 8.64 / 121.3 / 79.5 | 1.53 | 21.88 / 180 / 154.6 | 3.86 | 23.31 |
| mouth 548,252,642,308 | 1.92 / 41.3 / 24.9 | 4.39 / 54.3 / 39.2 | **2.29** | 25.23 / 92.3 / 86.6 | **13.14** | 27.77 |
| braid 468,278,542,402 | 6.31 / 65.3 / 53.2 | 9.43 / 73.0 / 58.3 | 1.49 | 25.29 / 150.3 / 128.1 | 4.01 | 27.85 |
| hairline 436,18,724,122 | 3.06 / 34.0 / 27.7 | 5.74 / 46.7 / 37.3 | 1.88 | 21.93 / 178 / 118.0 | 7.18 | 24.04 |
| body 560,400,900,690 | 3.74 / 103 / 44.8 | 6.91 / 153.3 / 67.3 | 1.85 | 19.59 / 222.7 / 148.3 | 5.24 | 22.22 |
| bgLeft 0,120,330,560 | 1.85 / 34.7 / 17.7 | 4.85 / 60.7 / 28.7 | 2.62 | 16.21 / 124.7 / 90.7 | 8.76 | 18.98 |
| bgRight 950,0,1280,500 | 1.28 / 24.7 / 12.3 | 2.78 / 35.3 / 18.3 | 2.16 | 14.99 / 135 / 71.3 | 11.68 | 16.34 |
| full frame | 2.22 / 103 / 32.7 | 4.68 / 153.3 / 46.3 | 2.11 | 18.93 / 222.7 / 108.7 | 8.54 | 21.06 |

My numbers match the generator's `join_report.py` output in the log to the second decimal
for the seven shared boxes, so its report was honest; it simply reports a failure.

**Round 2 for comparison** (81 frames, 16 fps, 1-frame end anchor): face f1 5.23, f81
5.75; mouth f1 3.03, f81 4.24. **Round 3 is worse at both ends**: face 6.75 / 22.26,
mouth 4.39 / 25.23.

- **JOIN-FIRST 5.** On f1 alone the numbers would earn about 7 (1.5 to 2.3x floor, mouth
  2.29x). But f1 is the only frame in that grade: **f1 to f2 is a 9.67 head step
  (6x the clip median of 1.63)**, where the picture drops from the plate's grade to the
  washed one (saturation 0.61 to 0.57, face vs plate 6.75 to 14.25). It shows at 1:1 in
  the strip (rows "HARD CUT", `CUT>f1` then `f2`). A viewer sees the start snap, so 5.
- **JOIN-LAST 2.** f97 is 4 to 13x the floor in every head box, with a visibly different
  exposure, saturation and mouth. Not close.

## 2. Identity (frames 1, 25, 49, 73, 97; strip row 1, 1:1 head crops)

| criterion | f1 | f25 | f49 | f73 | f97 |
|---|---|---|---|---|---|
| green iris screen-left (her right) | yes | yes | yes (lid half down) | yes | yes |
| blue iris screen-right (her left) | yes | yes | yes (lid half down) | yes | yes |
| swapped-colour pixels (green in blue box / blue in green box) | 0 / 12 | 0 / 0 | 0 / 0 | 0 / 0 | 4 / 0 |
| cyan braid + gold clasp | yes | yes | yes | yes | yes, clasp blown |
| outfit, pose | same | same | same | same | same |
| palette, line, style | plate | **washed, soft, flatter line** | washed | washed | **blown-out orange, clipped highlights** |

Iris pixel counts (plate: green 440, blue 542) stay 420 to 500 whenever the eye is open,
so no recoloured iris. **Score 4**: the landmarks all hold, but the worst criterion,
palette and style, fails twice in one clip (the washed middle and the blown-out end).
This is the "line and style" drift the brief asks about, and it is what a viewer notices
first.

## 3. Motion

**Name vs behaviour.** `idle-blinks` should give two full blinks and a half blink in the
first 3 s, then stillness. Aperture measured as the count of saturated iris pixels in
each eye box (green: G > R+40 and G > B+20; blue: B > R+60 and B > G+30), confirmed by eye
in strip rows 2 and 3:

| frames | time | green px | blue px | what it is |
|---|---|---|---|---|
| f1 to f44 | 0 to 1.79 s | 461 to 420 | 572 to 496 | eyes open, no lid event at all |
| f45 to f50 | 1.83 to 2.04 s | 376, 384, 303, 299, 163, 7 | 496, 499, 419, 392, 241, 0 | close, **6 frames = 250 ms** (spec 50 ms) |
| f50/51 to f53 | 2.04 to 2.17 s | 0 | 0 | shut, **4 frames = 167 ms** (spec 17 to 50 ms) |
| f54 to f57 | 2.21 to 2.33 s | 122, 234, 275, 290 | 0, 123, 161, 157 | reopens only to ~65 % green / ~30 % blue |
| f58 to f59 | 2.38 to 2.42 s | 165, 0 | 59, 0 | closes again, 2 frames |
| f59 to f65 | 2.42 to 2.67 s | 0 | 0 | shut, **7 frames = 292 ms** |
| f66 to f73 | 2.71 to 3.00 s | 220, 222, 218, 218, 234, 311, 352, 450 | 197 to 431 | opens: a jump to half in one frame, a 5-frame stall, then 3 frames; **8 frames = 333 ms** (spec 66 ms) |
| f74 to f97 | 3.04 to 4.04 s | 426 to 497 | 424 to 509 | eyes open and still |

So it is **one lid event of 29 frames (1.21 s)** that closes, half reopens and closes
again: a double blink, which motion-spec §4 says never happens and must not be added. Each
phase is 4 to 8 times slower than the measured blink (close 50 / hold 17 to 50 / open 66
ms, total 150 to 170 ms). There is no separate half blink, and nothing happens in the
first 1.8 s. Closing is faster than opening overall (250 vs 333 ms), which is the right
direction, but the reopening stalls at half aperture for 5 frames. No saccade: the irises
do not move between blinks (strip rows 2 and 3).

**Pinning.** Geometry is pinned perfectly: phase correlation of the head box f1 vs every
frame is (0, 0), f1 vs f97 (0, 0), plate vs f97 (0, 0); body box f10 vs f10..f89 in steps
of 4 is (0, 0) every time. **Tone is not pinned**: body box MAD against f1 has median
18.1 and max 24.3 (f93), against the plate median 22.3 over f2 to f93, which is a whole
frame re-grade, not motion. Inside the steady washed stretch the body box stays near
f10 (median 3.4) until the late brightening pushes it to 13.1. The "then still" last
second is not still either: mean RGB climbs from (128,104,98) at f77 to (152,127,114) at
f91, then the f94 pop.

**Score 3**: no drift, no morph, eyes behave as eyes, but the named motion is not
delivered (double blink, 4 to 8x too slow, no half blink) and the "still" end flickers in
exposure.

## 4. Hard-cut test

`ffmpeg -f concat` of `clip.webm` three times with `-c copy` (no fade, no re-encode;
two cuts), decoded with `-fps_mode passthrough` to 291 frames. Strip rows 4 to 6 show
f95, f96, f97, cut, f1, f2, f3 at 1:1 (eyes, mouth, hairline); rows 7 and 8 show the
internal f93 to f94 pop and the mouth over plate, f1, f2, f93, f94, f97.

| step (head box, decoded webm) | MAD |
|---|---|
| median step inside the clip | **1.08** (full frame 0.39) |
| f93 to f94 (inside the clip) | 26.33 |
| f96 to f97 | 6.54 |
| **f97 to f1 (the cut)** | **23.56 = 21.8x median** (full frame 20.27 = 51.6x) |
| f1 to f2 | 8.70 = 8.1x median |
| f2 to f3 | 3.21 |

**Looked at 1:1: the cut is visible to anyone.** The picture drops from a bright, clipped,
orange-saturated grade (skin blown near white, hair highlights clipped) to the plate's
pinker, darker grade, and the mouth closes slightly at the same instant. One frame later
it snaps again to the washed grade. There is also a same-size pop inside the clip at
f93 to f94, where the anchored last latent begins, so even a single play-through without
a loop has a visible jump 3.9 s in.

## 5. What this says about the method (for the generator, not a fix I made)

- The round-3 fix did what the paper check said: the last latent is anchored (latent 24,
  pixel frames 93 to 96 by the node's index, f94 to f97 here), and those four frames do
  lock their geometry and the mouth shape changes as a block. But **anchored is not
  equal**: that latent decodes about 5x the floor away from the plate, over-exposed. The
  start anchor holds only frame 1 near the plate; frame 2 is already in the washed grade.
- The washed grade from f2 onwards did not appear in round 2 (round 2's f81 face was 5.75).
  What changed is the length (97 vs 81 frames), the fps metadata and the 4-frame
  end batch. **Hypothesis, not tested:** a 4-frame batch of an identical still in the end
  slots is out of distribution for Wan's temporal VAE latent and pulls the sampler into
  an exposure and contrast overshoot; the long clip lets the known Wan colour drift build
  up in the middle. This needs a measured A/B (same seed, 1-frame vs 4-frame end anchor,
  81 vs 97 frames) before anything else is rendered, and a per-frame colour-match to the
  plate as a post step is worth measuring too (it cannot fix a mouth shape, only the
  grade).
- Rule 15 applies: this is the second failed FLF render on the join (round 2 join-last
  5, round 3 join-last 2). A written method check comes before a third try.

*No render was queued by this pass and no product code was touched.*
