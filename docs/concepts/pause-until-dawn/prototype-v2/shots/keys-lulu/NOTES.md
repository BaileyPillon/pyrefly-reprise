# Living portrait keys: Lulu (night run, 2026-09-25)

Game case: **both games' pause** (shared plumbing, CHK-020). The plate is Lulu's (FFX). This is a PREVIEW. Nothing
under `src/`, `tests/`, `critic/`, `public/art` or `docs/target` changed. The approved plate `public/art/pause/lulu.png`
was only read.

The method is the one in `../keys-auron/NOTES.md`: a depth-rotated push of the key before, a masked repaint of the
holes only, a hard cut at the bracket midpoint, and every step gated before the next one. Only Lulu's differences
are listed below.

## Plate-specific setup

- **Head mask.** SAM 2.1 masks for the head, braids and hair ornament, minus the SAM fur collar. The raw SAM mask
  carried bokeh between the loose strands as "head", so the green and teal bokeh inside it is cut out by colour, and
  only holes under 1500 px are refilled. The alpha is hard inside and soft only outward. The static layer equals the
  plate outside the head, so the yaw-0 frame is the plate exactly (MAD 0.0).
- **Depth.** Attempt 1 used a scale of 770, the same head-depth-to-width ratio as Auron. The bun and braids sit near
  background depth, so they swung far and tore into sideways streaks by +/-20. Attempt 1 was dropped. The kept chain
  uses a scale of 500, with the head depth floored at its 25th percentile and blurred 12 px. At 10 degrees the push
  hole falls from 12-15 % to 7-8 %.
- **Underfill.** Pull-push fill of the head region, plus one SDXL repaint of a 200 px background band ("no humans,
  Macalania bokeh").
- **Protected, never repainted:** both eyes, the mouth and the earring.

## Numbers (`sheet.jpg`)

| Key | Push hole | Repainted | Identity vs ORIGINAL plate (gate 28) | S at its cut, up / down |
|---|---|---|---|---|
| -20 | 16.1 % | **20.9 %** | 5.1 | 1.18 / 1.15 |
| -10 | 8.3 % | 11.8 % | 3.7 | 1.15 / 1.13 |
| +10 | 7.7 % | 11.2 % | 4.1 | 1.15 / 1.13 |
| +20 | 11.4 % | 15.3 % | 7.1 | 1.19 / 1.17 |

- **Full 1-degree sweep** from -20 to +20 and back: the median head-box step is 8.10. The 8 cuts measure S 0.96 to
  1.36, against a gate of 1.5. The largest step away from a cut is 1.31x the median, on the loose strands.
- **Two-painting frames:** 0 of 82 in the sweep and 0 of 149 in `turn.mp4`.
- **Pure swap at the same yaw** (head-box MAD): 2.4 to 3.6.
- **-20 is 0.9 points over the 20 % repaint line.** Its push hole is 16.1 %, so this is disclosed, the same reading
  v5.1 gave its +/-30 keys.

## Failed (twice each, then left)

- **+30 and -30.** Attempt 1 used denoise 0.30-0.40. Attempt 2 used denoise 0.45-0.65 with new seeds. S passes
  (1.18-1.34) and identity passes (6.5-12.5). But the repaint needs 22 % (+30) and 29 % (-30), over 20 %. At 1:1 the
  braids, the bun, the ornament corner and the far-side hair tear into sideways streaks. The chain stops at +/-20, and
  +/-40 was not attempted.

## Seen at 1:1, disclosed

- **The face at every cut:** one iris, one lash line, one jaw line and one lip line. The diff shows only strand-edge
  shimmer.
- **Loose strands right of the chin and jaw:** broken, blocky fragments where they meet the bokeh. The fragments are
  in both neighbouring keys, so they do not pop at a cut, but they flicker as the head turns. This is the weakest spot
  on the plate.
- **Braid edges:** at +/-20 the braids' outer edges show short sideways streaks and a thin dark fringe.
- **Range:** +/-20 around the plate's own pose, short of v5.1's +/-40 and of Until Dawn's 45 or more. There are no
  blinks or expressions yet.

## Files

`sheet.jpg`: the numbers, every key, and 1:1 face crops at each cut (key K | key K+10 at the cut yaw | diff x4).
`turn.mp4`: 0 to +20 to -20 to 0, eased, 25 fps, 6.0 s, H.264 yuv420p faststart, 1.9 MB.

Keys, depth, masks, sweep JSON, the tools and the failed keys are in
`D:/Tools/pyrefly-art-backup/candidates/2026-09-25-portrait-keys/lulu/`. The scratch is `D:/Tools/pyrefly-scratch/night-keys/lulu/`.

GPU: about 19 prompts, about 11 min. 8.3 min is logged: 13 key repaints, 445 s, plus 2 underfill prompts, 52 s. The
rest is estimated: 1 underfill prompt whose log was deleted with its dropped folder, and about 3 prompts that finished
on the GPU after their chains were stopped. All went through the shared queue when fewer than 3 were pending, one at a
time. ComfyUI was never restarted, and no frame came out black.
