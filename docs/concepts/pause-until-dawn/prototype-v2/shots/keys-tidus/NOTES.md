# Living portrait keys: Tidus, FFX plate (preview, 2026-09-25 day 1)

Game case: **both**. The pause screen and its portrait runtime are shared plumbing. Tidus's plate
(`public/art/pause/tidus.png`, the beach grin) is an FFX asset. This is a PREVIEW. Nothing under `src/`, `tests/`,
`critic/` or `public/art` changed, and the approved plate was only read (`verify-approved.mjs`: 224 ok, 0 mismatched,
before and after).

## Result

| | |
|---|---|
| Keys kept | **all nine: -40..+40 every 10 degrees** |
| Failed | none. Every key passed on its first try |
| Cuts, 1-degree sweep -40..+40 and back | S 0.83-1.40 at all 16 cuts (gate 1.5). The largest step away from a cut is 1.28 |
| Frames with two paintings | 0 of 161 in the sweep. The hard cut has no dissolve |
| GPU | 19 prompts, 784 s (13.1 min), ComfyUI never restarted, no black renders. 4 of the prompts are underfills (2 before the reset, 2 after) |

| key | push hole | from plate | repaint | S up/down | identity head / face (vs the ORIGINAL plate) |
|---|---|---|---|---|---|
| l10 | 1.0 % | 99.0 % | 2.5 % | 1.09 / 1.05 | 2.5 / 2.4 |
| l20 | 0.9 % | 96.8 % | 2.0 % | 1.09 / 1.04 | 3.3 / 2.7 |
| l30 | 0.9 % | 94.2 % | 1.7 % | 1.11 / 1.07 | 4.7 / 3.6 |
| l40 | 1.7 % | 87.8 % | 3.5 % | 1.13 / 1.12 | 8.6 / 5.5 |
| r10 | 1.2 % | 98.8 % | 3.0 % | 1.03 / 1.03 | 2.3 / 2.3 |
| r20 | 2.4 % | 93.3 % | 5.0 % | 1.08 / 1.03 | 3.2 / 2.5 |
| r30 | 2.8 % | 86.2 % | 5.5 % | 1.10 / 1.05 | 4.3 / 3.0 |
| r40 | 2.7 % | 81.4 % | 4.4 % | 1.07 / 1.04 | 5.8 / 4.0 |

The 20, 30 and 40 keys were each grown from a 5-degree stepping stone (15, 25, 35), repainted at 1.2-6.5 %; the stones
are not runtime keys. The gates are v5.1's: S <= 1.5 at both cuts, a repainted share of the head <= 20 %, identity <= 28.

## Why this replaces the overnight Tidus keys

The overnight agent (wf_aa24fb0c-050, `night-keys/tools/nk_*`) grew Tidus with the older push-key-to-key method. It kept
+-10 and +-20, closed +-30 and +-40 after two failures each, and stalled at 02:39 in its final sheet. Those keys are not
used. This chain is the method Kimahri, Wakka and Rikku passed with (`../keys-rikku/NOTES.md`, see `../keys-yuna/NOTES.md`
for the two plate-specific changes: the SAM character mask and the rim floor for hair tips). The underfill was rendered
after the 13:14 PC reset with a scenery-only prompt (the plate's own prompt painted eyes into the sky), seed 9420, candidate 1.

## Looked at (sheet.jpg)

- At every cut there is one pair of eyes, one nose highlight and one grin.
- **Still wrong, disclosed:**
  - The -40 -> -30 cut (S 1.38, the highest) swaps the image-right ear: the -40 key shows it through the hair, the -30 key
    covers it. The fang in the grin also changes shape at the -30 and -40 cuts.
  - From about +-30 the hair spikes on the side that turns toward the camera show horizontal row-stretch streaks, and at
    +40 the image-right hair edge leaves a thin light trail in the sky.
  - The runtime used for the numbers and the video is a CPU emulation of the mesh warp (`tools/sweep.py`), not the
    prototype's WebGL `dense.ts`.

## Files

- `sheet.jpg`: all nine keys, 1:1 face crops at the eight up-sweep cuts with S, and every key's numbers.
- `turn.mp4`: 1344 x 768, H.264 yuv420p faststart, 25 fps, 15.6 s. 0 -> +40 -> -40 -> 0, eased.
- Keys (PNG), picks, the underfill and the scripts are in `D:/Tools/pyrefly-art-backup/candidates/2026-09-25-day1/keys-tidus/`.
  The work files are in `D:/Tools/pyrefly-scratch/day1/yt-keys/tidus/`, tools in `.../yt-keys/tools/`.
