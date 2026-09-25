# Living portrait keys: Rikku, FFX plate (preview, 2026-09-25 overnight)

Game case: **both**. The pause screen and its portrait runtime are shared plumbing. This is the FFX Rikku plate
(`public/art/pause/rikku.png`, the wink). The FFX-2 Rikku plate is a separate plate. This is a PREVIEW: nothing under `src/`,
`tests/`, `critic/` or `public/art` changed, and the approved plate was only read.

## Result

| | |
|---|---|
| Keys kept | **all nine: -40..+40 every 10 degrees** |
| Failed | none. Every key passed on its first try |
| Cuts, 1-degree sweep -40..+40 and back | S 1.09-1.29 at all 16 cuts (gate 1.5). The largest step away from a cut is 1.13 |
| Frames with two paintings | 0 of 161 in the sweep. The hard cut has no dissolve |
| GPU | 15 prompts, 653.2 s (10.9 min), ComfyUI never restarted, no black renders |

| key | push hole | from plate | repaint | S up/down | identity head / face (vs the ORIGINAL plate) |
|---|---|---|---|---|---|
| l10 | 6.8 % | 93.2 % | 13.5 % | 1.16 / 1.16 | 5.0 / 1.2 |
| l20 | 5.0 % | 83.1 % | 11.6 % | 1.17 / 1.17 | 6.6 / 1.2 |
| l30 | 3.4 % | 74.3 % | 9.2 % | 1.23 / 1.22 | 9.4 / 1.5 |
| l40 | 4.5 % | 66.1 % | 12.8 % | 1.20 / 1.20 | 14.0 / 2.6 |
| r10 | 5.6 % | 94.4 % | 11.2 % | 1.14 / 1.12 | 4.7 / 1.4 |
| r20 | 4.4 % | 85.3 % | 9.8 % | 1.15 / 1.14 | 6.4 / 1.8 |
| r30 | 3.3 % | 76.6 % | 9.3 % | 1.21 / 1.21 | 10.5 / 2.4 |
| r40 | 3.8 % | 70.7 % | 8.7 % | 1.17 / 1.17 | 12.9 / 3.9 |

The 20, 30 and 40 keys were each grown from a 5-degree stepping stone (15, 25, 35). The stones were repainted at
5.6-16.7 % and are not runtime keys. The gates are v5.1's: S <= 1.5 at both cuts, a repainted share of the head <= 20 %,
and identity <= 28.

## Method

It is the same as `../keys-kimahri/NOTES.md` and `../keys-wakka/NOTES.md`: a 2.5D head (local Depth Anything V2 Small
plus a smooth skull dome) and a 1D row mesh split at depth folds. There is one pinned desert underfill. Each key is the plate
turned N degrees in one resample where the plate's paint is magnified 1.3x or less, else the key before it, else a
masked repaint (Animagine XL 4.0 with the plate's prompt, IP-Adapter from the plate at 0.4, 6 candidates). The wink,
the open eye, the brows and the grin are never repainted, so the wink survives on every key. The scarf and shoulders
are pinned below the neck. The braids ease from the head's turn to none.

## Looked at, at 1:1 (sheet.jpg, middle block)

- At every cut there is one open eye, one wink line, one nose and one grin. The diff shows the 1-degree motion edge and the
  hair strands.
- **Still wrong, disclosed:**
  - The image-left earring is repainted each key. From +20 it becomes an invented blue, white and red bead cluster, and at
    +34..+40 it is a tangle beside the ear.
  - At +30..+40 the far (image-right) chin and jaw flatten: the 2.5D proxy compresses that side and does not
    turn it.
  - From about ±26 the hair edges on the side that turns toward the camera show horizontal row-stretch streaks. The goggle strap at the
    image-left edge smears at -30..-40.
  - The braid beads on the right change shape at the ±20 cuts.
- The runtime used for the numbers and the video is a CPU emulation of the mesh warp (`tools/sweep.py`), not the
  prototype's WebGL `dense.ts`.

## Files

- `sheet.jpg`: all nine keys, 1:1 face crops at the eight up-sweep cuts with S, and every key's numbers.
- `turn.mp4`: 1344 x 768, H.264 yuv420p faststart, 25 fps, 15.6 s, 7.1 MB. 0 -> +40 -> -40 -> 0, eased.
- Keys (PNG), picks, the underfill and the scripts are in `D:/Tools/pyrefly-art-backup/candidates/2026-09-25-portrait-keys/rikku/`.
  The work files are in `D:/Tools/pyrefly-scratch/night-keys/rikku/`.
