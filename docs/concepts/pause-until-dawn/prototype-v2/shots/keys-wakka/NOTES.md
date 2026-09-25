# Living portrait keys: Wakka (preview, 2026-09-25 overnight)

Game case: **both**. The pause screen and its portrait runtime are shared plumbing. Wakka's plate is an FFX asset.
This is a PREVIEW. Nothing under `src/`, `tests/`, `critic/` or `public/art` changed, and the approved plate
`public/art/pause/wakka.png` was only read.

## Result

| | |
|---|---|
| Keys kept | **-40, -30, -20, -10, 0 (the plate), +10, +20** |
| Failed twice, not kept | **+30** (S 1.57, then 1.53), so +40 was never grown |
| Cuts, 1-degree sweep -40..+20 and back | S 1.26-1.45 at all 12 cuts (gate 1.5). The largest step away from a cut is 1.10 |
| Frames with two paintings | 0 of 121 in the sweep. The hard cut has no dissolve |
| GPU | 16 prompts, 715.5 s (11.9 min), ComfyUI never restarted, no black renders |

| key | push hole | from plate | repaint | S up/down | identity head / face (vs the ORIGINAL plate) | |
|---|---|---|---|---|---|---|
| l10 | 8.2 % | 91.8 % | 13.2 % | 1.28 / 1.27 | 4.7 / 1.3 | PASS |
| l20 | 6.7 % | 77.5 % | 13.4 % | 1.37 / 1.36 | 7.2 / 1.7 | PASS, 2nd try (5-degree stone at -15) |
| l30 | 5.8 % | 66.3 % | 13.2 % | 1.43 / 1.47 | 14.2 / 4.5 | PASS (stone at -25) |
| l40 | 7.3 % | 59.1 % | 16.1 % | 1.33 / 1.35 | 20.7 / 9.5 | PASS (stone at -35) |
| r10 | 9.0 % | 91.0 % | 13.9 % | 1.34 / 1.29 | 4.4 / 1.3 | PASS |
| r20 | 6.9 % | 74.6 % | 13.3 % | 1.45 / 1.41 | 6.7 / 1.8 | PASS, 2nd try (stone at +15) |
| r20 try 1, l20 try 1 | 12.9-14.2 % | | **20.7 %** | 1.40-1.48 | | FAIL (repaint) |
| r30 try 1 / try 2 | 6.1 % | 63.9 % | 12.7 % | **1.57 / 1.53** | 10.3 / 3.3 | FAIL (cut) |

The gates are v5.1's: S <= 1.5 at both cuts, a repainted share of the head <= 20 %, and identity <= 28.

## Method

It is the same as `../keys-kimahri/NOTES.md`: a 2.5D head (local Depth Anything V2 Small plus a smooth skull dome) and
a 1D row mesh split at depth folds. There is one pinned background underfill, and the blitz-sign prop on the left
is pinned. Each key is the plate turned N degrees in one resample wherever the plate's paint is magnified 1.3x or
less; elsewhere it takes the key before it, and elsewhere again a masked repaint (Animagine XL 4.0 with the plate's
prompt, IP-Adapter from the plate at 0.4, 6 candidates). Both eyes, the brows and the open mouth are never
repainted.

The **5-degree stepping stone** (the method's written retry) became the default after the 20 keys failed on
repaint share. A key at N is grown from a stone at N-5, which is itself grown and repainted from N-10. The stones
are not runtime keys. The cuts are measured only between the 10-degree keys. **r30 try 2** lowered the denoise to
0.30-0.40 so that the repaint keeps closer to the pushed paint. It still cut at 1.53, so the right side stops at +20.

## Looked at, at 1:1 (sheet.jpg, middle block)

- At every kept cut there is one pair of eyes, one nose and one mouth. The diff shows the 1-degree motion edge.
- **+10..+20:** the headband medallion is repainted each key. Its spiral becomes a softer, eye-like engraving at
  +20, a visible change at the +16/+17 cut. The r30 failures come from the same medallion and the cheek beside it.
- **-30..-40 (disclosed, the worst area):** as the head turns, the image-right cheek, ear and hair edge expand. The
  repaint fills them with a pale, flat, streaky wash, not skin and an ear. It is clean across the cut (the same wash on both sides), but
  at 1:1 it reads as a smear. **I would call -30 the usable limit** until that side is painted with a real ear.
- From +6 the row-stretch streaks show at the image-left cheek and hair edge. The same happens on the other side
  from -6.
- The runtime used for the numbers and the video is a CPU emulation of the mesh warp (`tools/sweep.py`), not the
  prototype's WebGL `dense.ts`.

## Files

- `sheet.jpg`: every kept key, 1:1 face crops at the six up-sweep cuts with S, and every key's numbers,
  failures included.
- `turn.mp4`: 1344 x 768, H.264 yuv420p faststart, 25 fps, 12.0 s. 0 -> +20 -> -40 -> 0, eased.
- Keys (PNG), picks, the underfill and the scripts are in `D:/Tools/pyrefly-art-backup/candidates/2026-09-25-portrait-keys/wakka/`.
  The work files are in `D:/Tools/pyrefly-scratch/night-keys/wakka/`.
