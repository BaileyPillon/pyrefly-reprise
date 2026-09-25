# Living portrait keys: Yuna, FFX plate (preview, 2026-09-25 day 1)

Game case: **both**. The pause screen and its portrait runtime are shared plumbing. This is the FFX Yuna plate
(`public/art/pause/yuna.png`, the Besaid sunset). The FFX-2 Yuna plate (`yuna-ffx2.png`) is separate and is the v6 chain.
This is a PREVIEW. Nothing under `src/`, `tests/`, `critic/` or `public/art` changed, and the approved plate was only read
(`verify-approved.mjs`: 224 ok, 0 mismatched, before and after).

## Result

| | |
|---|---|
| Keys kept | **all nine: -40..+40 every 10 degrees** |
| Failed | none. Every key passed on its first try |
| Cuts, 1-degree sweep -40..+40 and back | S 0.87-1.24 at all 16 cuts (gate 1.5). The largest step away from a cut is 1.17 |
| Frames with two paintings | 0 of 161 in the sweep. The hard cut has no dissolve |
| GPU | 20 prompts, 931.6 s (15.5 min), ComfyUI never restarted, no black renders. 7 of the prompts are underfills: the first run's 2, and 3 re-renders after the reset (see below) |

| key | push hole | from plate | repaint | S up/down | identity head / face (vs the ORIGINAL plate) |
|---|---|---|---|---|---|
| l10 | 2.7 % | 97.3 % | 4.6 % | 1.08 / 1.06 | 2.9 / 2.7 |
| l20 | 1.9 % | 93.4 % | 5.2 % | 1.09 / 1.05 | 3.6 / 3.5 |
| l30 | 1.6 % | 88.3 % | 6.1 % | 1.11 / 1.08 | 5.0 / 4.6 |
| l40 | 2.1 % | 83.1 % | 8.0 % | 1.10 / 1.10 | 8.8 / 11.2 |
| r10 | 1.9 % | 98.1 % | 3.2 % | 1.07 / 1.05 | 2.7 / 2.1 |
| r20 | 4.5 % | 89.6 % | 6.3 % | 1.10 / 1.06 | 3.5 / 2.3 |
| r30 | 6.4 % | 81.1 % | 6.2 % | 1.11 / 1.09 | 4.8 / 2.6 |
| r40 | 7.8 % | 75.9 % | 7.3 % | 1.10 / 1.09 | 6.9 / 2.8 |

The 20, 30 and 40 keys were each grown from a 5-degree stepping stone (15, 25, 35), repainted at 3.2-7.5 %; the stones
are not runtime keys. The gates are v5.1's: S <= 1.5 at both cuts, a repainted share of the head <= 20 %, identity <= 28.

## Why this replaces the overnight Yuna keys

The overnight agent (wf_aa24fb0c-050, `night-keys/tools/nk_*`) grew Yuna with the older push-key-to-key method. It kept
+-10 and +-20, closed +-30 and +-40 after two failures each, and stalled at 02:39 in its final sheet. Those keys are not
used. This chain is the method Kimahri, Wakka and Rikku passed with (`../keys-rikku/NOTES.md`): every key is the plate
turned N degrees in one resample wherever its paint is magnified 1.3x or less, then the key before it, then a masked
repaint (Animagine XL 4.0 with the plate's prompt, IP-Adapter from the plate at 0.4, 6 candidates). Two changes for this
plate: the character mask adds the night run's SAM head+body mask (`fg-override.png`), because depth cannot part the low
hair from the sea, and hair tips at sea depth are floored at the skull rim so they do not swing far and tear.

**Resume after the 13:14 PC reset.** The day-1 run was cut off at 13:08 while rendering +-30. Its +-10, +-20 and the
25 stones were kept. The underfill file was lost afterwards; it was rebuilt exactly where any grown key shows it (0.0
difference on all eight kept key images), and the parts no key had revealed yet were filled from a re-rendered underfill
candidate with a 4 px seam. Only the +-30 and +-40 keys see that new part.

## Looked at (sheet.jpg)

- At every cut there is one green eye, one blue eye, one mouth and the same earring; the earring and eyes are never repainted.
- **Still wrong, disclosed:**
  - From about +-26 the plate's hair outline stays behind in the sky as a thin light-and-dark ghost line (the silhouette's
    anti-aliased edge sits outside the character mask). At -40 it traces the right-hand hair against the sun, and at
    +30..+40 the left-hand hair.
  - At +30..+40 there are horizontal row-stretch streaks at the image-left hair edge, and at -30..-40 the image-left hair
    edge shows vertical serrations.
  - l40's face identity is 11.2, the highest of any key: the far cheek and mouth corner compress (the 2.5D proxy squeezes
    that side and does not turn it).
  - The runtime used for the numbers and the video is a CPU emulation of the mesh warp (`tools/sweep.py`), not the
    prototype's WebGL `dense.ts`.

## Files

- `sheet.jpg`: all nine keys, 1:1 face crops at the eight up-sweep cuts with S, and every key's numbers.
- `turn.mp4`: 1344 x 768, H.264 yuv420p faststart, 25 fps, 15.6 s. 0 -> +40 -> -40 -> 0, eased.
- Keys (PNG), picks, the underfill and the scripts are in `D:/Tools/pyrefly-art-backup/candidates/2026-09-25-day1/keys-yuna/`.
  The work files are in `D:/Tools/pyrefly-scratch/day1/yt-keys/yuna/`, tools in `.../yt-keys/tools/`.
