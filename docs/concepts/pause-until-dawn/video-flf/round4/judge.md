# Living portrait FLF, round 4: independent judge of the end-anchor A/B

**Verdict: FAIL. Show neither arm to Bailey.** Judged 2026-09-22 by a separate agent that
did not render. Every number below comes from this pass's own numpy scripts, run on the
frame PNGs, on the colour-matched frames and on the encoded ping-pong files:
`judge/judge-measure.py` and `judge/judge-cutstats.py`, with raw output in `judge/*.json`.
The post tool was re-run by this pass into `D:/Tools/pyrefly-video/flf/round4-judge/arm-{a,b}/`,
and the 1:1 evidence is `judge/judge-strip.jpg` (0.94 MB, built by `judge/judge-strip.py`).

Arms (from `round4/ab/ab.md`): `D:/Tools/pyrefly-video/flf/ab-end-anchor-a/7/` (A: `endBatch=1`)
and `.../ab-end-anchor-b/7/` (B: `endBatch=4`). Both are 81 frames at 1280x704 and 24 fps,
seed 7, prompt *"Subtle breathing, hair still, no blink..."*. The plate is
`pyrefly-video-plate-f1efe21f6c75-1280x704.png` and the VAE floor is `vae-floor/...-floor.png`.

**PASS bar (brief):** at least one arm whose colour-matched ping-pong keeps every join
within 1.5x the VAE floor, with identity 7 or above and visible breathing.

| | Arm A (`endBatch=1`) | Arm B (`endBatch=4`) |
|---|---|---|
| Every cm ping-pong join within 1.5x the floor | **no, but only just**: the plate-to-f1 entry is 1.58x on the mouth (1.66 to 1.71x after encoding) | **no**: entry 2.20x on the mouth, turnaround frame 3.38x |
| Identity | **8** | **5** |
| Visible breathing | **no: nothing moves at all** | **no** |
| Result | FAIL (motion) | FAIL (joins, tone, motion) |

## The finding that decides it

**Arm A is a still picture, not a breathing portrait.** Its joins are clean *because
nothing moves*. Measured on the raw frames against frame 1 by sub-pixel phase
correlation (Hann window, parabolic peak):

| displacement range over all 81 frames | Arm A | Arm B |
|---|---|---|
| head box (420,20)-(760,400), dy / dx | **0.027 / 0.041 px** | 0.136 / 0.119 px |
| chest box (560,400)-(900,690), dy / dx | **0.022 / 0.030 px** | 0.090 / 0.145 px |
| collar box (540,360)-(860,620), horizontal-edge profile dy | 0.10 px (quantisation: 0.05-px search step) | 0.40 px (only at the f78+ blow-out) |

A visible breath at this framing would move the collar, shoulder line and clasp by
about 1 to 3 px. Arm A moves them by about 1/50 px. The temporal-std map (strip row 3)
lights only line-art edges, evenly over the figure *and* the background shelves
(bgLeft std 0.73, body 1.39, eyes 1.99), which is decoder shimmer, not a moving region.
The `|f81-f1|` and `|f41-f1|` chest difference maps (x8) are edge outlines with no
coherent band: no rise and fall anywhere. This matches `pingpong.md`'s finding on the
round-2 `idle-breathing` clip (dy = 0 on all frames): **Wan FLF with an inert prompt and
the same image at both ends returns a still picture.** Round 4 therefore proves that
`endBatch=1` removes the blow-out. It does not show that the join method holds up on a
clip that moves. **The continuity numbers below are for a looped still frame; treat them
as an upper bound on how good a join can be, not as evidence for a real idle.**

## Table: raw vs post-processed, per arm (MAD, x VAE floor; head boxes plus body and full)

VAE floor MAD per box: face 3.85, eyes 4.70, greenEye 6.67, blueEye 5.66, mouth 1.92,
braid 6.31, hairline 3.06, body 3.74, bgLeft 1.85, bgRight 1.28, full 2.22.

| measurement | Arm A raw | **Arm A cm ping-pong** | Arm B raw | **Arm B cm ping-pong** |
|---|---|---|---|---|
| Turnaround T (auto) | (81) | **81**, all frames used | (81) | **67**, frames 68-81 thrown away |
| f1 vs plate, face / mouth / worst box | 1.28 / 1.50 / 1.50 (mouth) | **1.29 / 1.58 / 1.58 (mouth)** | 2.31 / 3.72 / 3.75 (bgLeft) | **1.57 / 2.20 / 2.20 (mouth)** |
| f1 vs plate, encoded webm / mp4, worst box | | 1.82 / 1.88 (full); mouth 1.65 / 1.71 | | 2.11 / 2.17 (full); mouth 2.02 / 2.05 |
| last or turnaround frame vs plate, face / mouth / worst | f81: 1.34 / 1.36 / 1.99 (bgRight) | **fT=81: 1.30 / 1.38 / 1.38** | f81: 5.81 / 13.12 / 13.12 | **fT=67: 2.99 / 2.75 / 4.41 (bgRight)** |
| reversal seam T to T-1, worst box | | **0.35** (hairline) | | **0.71** (hairline, bgRight) |
| loop wrap f2 to f1 (PNG), worst box | | **0.89** (bgRight); mouth 0.75 | | **1.75** (mouth) |
| hard cut, forward loop fN to f1, worst box | 1.47 (mouth) | 1.15 (hairline) | 15.91 (mouth) | 8.93 (bgLeft) |
| hard cut of the ping-pong onto itself, encoded webm, worst box, x floor / x own median step | | **1.09x floor / 12.1x median** (mouth) | | 1.97x floor / 23.3x median (mouth) |
| same, mp4 | | 1.10x / 10.2x (mouth) | | 2.11x / 15.6x (mouth) |
| head step median / max inside the used frames | 1.04 / 2.54 (at f1 to f2) | 1.04 / 2.54 (at f1 to f2) | 1.92 / 20.75 (f77 to f78) | 1.80 / 3.65 (at f1 to f2) |
| saturation min to max (used frames) | 0.633 to 0.637 | 0.613 to 0.629 | 0.343 to 0.681 | 0.600 to 0.623 |
| **tone wander**: body-box MAD vs f1, max (used frames) | 4.17 (1.11x body floor) | 3.84 (1.03x) | **25.57 (6.8x)** | 8.70 (2.3x) |

Notes on the table:

- **Arm A misses the 1.5x bar on one box, at the entry join.** Frame 1 against the plate is
  1.58x on the mouth. The raw frame is 1.50x, so the colour match made the mouth *worse*.
  A global affine fit on the body and background cannot correct the mouth's own error.
  Every other join in arm A sits far below the bar (reversal 0.35x, wrap 0.89x, forward
  hard cut 1.15x). After encoding, the entry is 1.5 to 1.9x on every box, because
  encoding adds its own loss on top of the VAE decode. If the pause screen crossfades or
  cuts from the still painting into the video, that entry is a real join.
- **The encoded loop has exactly one tick per cycle.** Inside the webm the encoder
  smooths the VAE's per-frame grain, so the median step is only 0.13 to 0.61, and the
  wrap from f2 back to f1 becomes the largest step in the file: 10 to 12x the median, but
  0.75 to 1.1x the VAE floor. At 1:1 (strip row 3: the last frame, the next frame 1 and
  `|diff|` x8) the two frames cannot be told apart by eye. The difference is a diffuse
  re-roll of fine texture over the face with no shape or tone change. I rate it not
  visible in stills. A human should still watch it in motion before anyone calls it
  seamless: it lands every 6.67 s on an otherwise frozen picture, where grain changes are
  easiest to notice.
- **Arm B's post-processed loop hides the blow-out by throwing it away.** T = 67 drops
  frames 68 to 81. What remains still sits 2 to 4.4x off the plate at the turnaround,
  because of the washed grade that runs from frame 2 to frame 67. The colour match cuts
  this but does not remove it.
- **Tool defect (small; applies to both games):** `tools/gen/video-post.py` line 279
  saves the colour-matched frames with `corr.astype(np.uint8)`, which truncates instead of
  rounding. It computes every number in `report.json` on the float array before that
  truncation. So the report does not describe the pixels that ship: the tool reports
  mouth 1.76x for arm A's cm f1, while the shipped PNG measures 1.58x here. The fix is
  `np.rint(corr).astype(np.uint8)`, measuring after the rounding. I did not change it:
  this pass judges and does not build.

## Identity at 1:1 (strip rows 1 and 2; iris counts from `judge-clip.md`'s thresholds)

| check | plate | Arm A cm f1 / f40 / f81 | Arm B cm f1 / f67; raw f77 / f81 |
|---|---|---|---|
| green iris screen-left (her right), px | 440 | 450 / 443 / 452 | 466 / 454; raw f81 443 |
| blue iris screen-right (her left), px | 542 | 544 / 553 / 542 | 576 / 589; raw f81 410 (washed) |
| swapped-colour pixels (blue in green box / green in blue box) | 33 / 0 | 14/3, 28/5, 6/5 | cm f1 15/0, f67 0/0; raw f81 0/8 |
| cyan braid, gold clasp, mean braid RGB | (120,106,110) | same; T (121,106,110) | same; T (122,109,108); raw f81 clasp blown |
| outfit, clasp, obi, gloves | yes | same | same (cm); raw f77 washed grey, f81 orange |
| line and style | reference | slightly softer line than the plate, same palette | cm: flatter, lower contrast; raw end: blown out |

- **Arm A: 8.** Every landmark holds on every frame checked. The palette matches the plate.
  The only loss is a slight softening of the line, the same VAE softening every decoded
  frame has.
- **Arm B: 5.** The landmarks hold in the used frames, but those frames run in a flatter,
  washed grade even after the colour match. The unused tail (f77 grey-washed, f81
  blown-out orange) fails the style check outright.

## Motion

| | Arm A | Arm B |
|---|---|---|
| does she breathe (chest or collar displacement) | **no**: 0.02 px range | **no**: 0.09 px range |
| is the head still | yes, perfectly (0.03 px) | yes (0.14 px) |
| blink | none (as prompted) | none |
| score | **1**: a frozen frame with decoder shimmer | **1**: no motion, plus a tone event |

## What this means for the next round (for the generator; I built none of it)

1. `endBatch=1` is confirmed as the better end anchor: A/B arm A shows no tone wander
   (body 1.03 to 1.11x floor, saturation flat to 0.004). I agree with `ab.md` on that point.
2. **The track now fails on motion, not on joins.** Two inert prompts (round 2's
   `idle-breathing`, round 4's arm A) have now produced zero measurable breathing. That
   is the second failure on the same point, so rule 15 applies: write a method check
   before any third breathing render. Candidate methods to put on paper, not to render
   yet: a prompt that names a visible movement (shoulders rise, collar lifts), a
   different seed or shift, or getting breathing from the portrait rig instead of FLF.
3. The first real-motion render must be judged on motion *first* (a measured collar
   displacement of at least 1 px peak to peak). Only then are its joins worth measuring.
   On a still clip the joins pass by default.
4. Fix the truncation in `video-post.py`. Then decide how the pause screen enters the
   loop: a hard switch from the painting exposes the 1.5 to 1.9x entry after encoding,
   while a short crossfade from the plate hides it. Whichever is picked has to be
   measured on the encoded file, not on PNGs.

## Game-aware classification (rule 14)

**Both.** This is shared living-portrait plumbing (FLF render settings and the
post-process tool). It touches no FFX-only or FFX-2-only system.

*No render was queued by this pass, ComfyUI was not touched, and the approved painting
was only read.*
