# Living portrait keys: Auron (night run, 2026-09-25)

Game case: **both games' pause** (shared plumbing, CHK-020). The plate is Auron's (FFX). This is a PREVIEW. Nothing
under `src/`, `tests/`, `critic/`, `public/art` or `docs/target` changed. The approved plate
`public/art/pause/auron.png` was only read.

## What was made

The v5.1 goal: grow turn keys every 10 degrees from the plate, one step at a time, each step passing the cut gate
before the next one. The v5.1 pipeline could not be reused as it was: it needs the Yuna X-2 LoRA, the v4 pose-guide
keys and the rig layers, and Auron has none of them. So the push is new:

- **Pose guide = depth, not sampled keys.** Depth Anything V2 Small (the local copy in `D:/Tools/CodexArtLab/models/depth`,
  nothing downloaded) ran on the plate. Scale: 1000 px per unit, which makes the head's depth range 0.45 of its width.
  The depth is smoothed inside the head (sigma 16 px). Without the smoothing the glasses tore away from the face.
- **Layers.** The head layer (SAM 2.1 mask, interior holes filled) turns about a vertical neck axis at (630, 440).
  A twist weight fades the turn to zero within 80 px of the collar. The rest of the plate is a static layer. Its
  underfill is a CPU fill plus one SDXL repaint of a 110 px background band.
- **Push.** Key K goes to K +/- 10 through a z-buffered triangle mesh. The holes are the magnified pixels (stretch
  over 1.3) plus the uncovered gaps inside the silhouette. Speckles under 200 px are dropped, and the mask grows 5 px.
  The eye, the mouth, the forehead mark, the lens bridge, the nose tip and the far eye are protected: they are never
  repainted.
- **Repaint.** One prompt per key: Animagine XL 4.0 Opt with the plate's own prompt, the plate through IP-Adapter at
  0.3, and SetLatentNoiseMask. Two seeds at each of three denoise levels gives 6 candidates. Only the mask pixels are
  kept. Anything a repaint never touched comes from the plate, rotated in one resample, so the paint does not soften
  step by step. The pick is automatic: the candidate with the lowest S that also passes identity. Every pick was then
  looked at at 1:1.

Runtime model: frame(yaw) = static layer + key K's head turned by (yaw - K). The key changes by a hard cut at the
bracket midpoint with 1 degree of hysteresis. One painting per frame, never a blend.

## Numbers (`sheet.jpg`)

| Key | Push hole | Repainted | Identity vs ORIGINAL plate (gate 28) | S at its cut, up / down |
|---|---|---|---|---|
| -30 | 17.2 % | 18.1 % | 4.4 | 1.16 / 1.15 |
| -20 | 14.1 % | 14.4 % | 3.6 | 1.16 / 1.15 |
| -10 | 11.2 % | 13.0 % | 2.9 | 1.31 / 1.30 |
| +10 | 5.4 % | 9.0 % | 2.3 | 1.35 / 1.36 |
| +20 | 2.8 % | 4.1 % | 3.3 | 1.16 / 1.18 |
| +30 | 2.7 % | 4.5 % | 6.0 | 1.23 / 1.25 |

- **Full 1-degree sweep** from -30 to +30 and back: the median head-box step is 5.11. The 12 cuts measure S 0.84 to
  1.32, against a gate of 1.5. The largest step away from a cut is 1.13x the median.
- **Two-painting frames:** 0 of 122 in the sweep and 0 of 208 in `turn.mp4`.
- **Pure swap at the same yaw** (head-box MAD): 1.2 to 2.3.
- **Identity** is the face MAD after turning the key back by -K, measured inside the plate's face box.

## Failed (each twice, then left)

- **+40.** Attempt 1 passed on the numbers (S 1.29 / 1.32, identity 9.8), but the 1:1 look fails: the near lens folds
  into a dark blob over the far lens. Attempt 2 repainted the lenses and the far eye. It drew clean glasses, but S was
  1.66 to 2.05, over the gate. Both are in the backup under `failed/`.
- **-40.** Two separate chains gave the same result. The far half of the face is magnified about 2x: the far lens
  becomes a long ellipse, the forehead mark smears, and the far-side hair streaks sideways. The warp cannot turn a
  three-quarter plate this far without inventing the far side.

Earlier tries at -10 / -20 were replaced, not counted as gate failures. The repaint changed the forehead mark's shape
and drew an open far eye, and those areas are now protected. The first denoise setting (0.45 to 0.65) was lowered to
0.3 to 0.4 after it invented detail. +10 and +20 kept their 0.45 picks, which were clean at 1:1.

## Seen at 1:1, disclosed

- **At every cut:** one lens outline, one mark and one jaw line. The diff shows mostly edge shimmer. The largest change
  is the nose side's shading at the -5, -15 and -25 cuts, a soft tone step. On key -30 the lower tip of the scar is
  ragged.
- **+30:** the near lens is strongly foreshortened and reads darker. The ear grows.
- **-30:** the far side is magnified. The mark is wider, and a few far-side hair strands streak toward the background.
- **Top edge:** the head touches the frame top, so a thin sliver of underfill shows there on the turn.
- **Range:** +/-30 around the plate's own three-quarter pose, short of v5.1's +/-40. There are no blinks or
  expression patches yet. Those are the v5.1 / v6 steps, not attempted tonight.

## Files

`sheet.jpg`: the numbers, every key, and 1:1 face crops at each cut (key K | key K+10 at the cut yaw | diff x4).
`turn.mp4`: 0 to +30 to -30 to 0, eased, 25 fps, 8.3 s, H.264 yuv420p faststart, 1.1 MB.

Keys, depth, masks, sweep JSON and the tools (`kw.py`, `grow.py`, `setup_plate.py`, `sweep.py`, `make_sheet.py`,
`lensfix.py`, `repaint.mjs`, `step.sh`, `auto.sh`) are in `D:/Tools/pyrefly-art-backup/candidates/2026-09-25-portrait-keys/auron/`.
The scratch is `D:/Tools/pyrefly-scratch/night-keys/auron/`.

GPU: 20 prompts, 928 s (15.5 min): 17 key repaints, 2 underfill and 1 lens retry. All were on the shared queue,
submitted when fewer than 3 were pending, one at a time. ComfyUI was never restarted, and no frame came out black.
