# Living portrait keys: Kimahri (preview, 2026-09-25 overnight)

Game case: **both**. The pause screen and its portrait runtime are shared plumbing. Kimahri's plate is an FFX asset.
This is a PREVIEW. Nothing under `src/`, `tests/`, `critic/` or `public/art` changed, and the approved plate
`public/art/pause/kimahri.png` was only read.

## Result

| | |
|---|---|
| Keys kept | **-40, -30, -20, -10, 0 (the plate), +10** |
| Failed twice, not kept | **+20** (so +30 and +40 were never grown). See below |
| Cuts, 1-degree sweep -40..+10 and back | S 1.07-1.34 at all 10 cuts (gate 1.5). The largest step away from a cut is 1.16 |
| Frames with two paintings | 0 of 101 in the sweep. The runtime is a hard cut with no dissolve, so every frame shows one key |
| GPU | 19 prompts, 889 s (14.8 min), ComfyUI never restarted, no black renders. This includes a first chain (v1) that was discarded after the 1:1 look (below) |

| key | push hole | from plate | repaint | S up/down | identity head / face (vs the ORIGINAL plate) | |
|---|---|---|---|---|---|---|
| l10 | 4.1 % | 95.9 % | 9.2 % | 1.09 / 1.10 | 4.6 / 1.1 | PASS |
| l20 | 5.7 % | 88.8 % | 13.9 % | 1.17 / 1.17 | 7.3 / 1.2 | PASS |
| l30 | 8.2 % | 79.3 % | 17.5 % | 1.16 / 1.16 | 10.8 / 1.4 | PASS, 2nd try |
| l40 | 4.4 % | 72.8 % | 13.3 % | 1.11 / 1.12 | 14.1 / 2.0 | PASS |
| r10 | 10.4 % | 89.6 % | 16.7 % | 1.26 / 1.22 | 4.3 / 1.0 | PASS |
| r20 try 1 | 14.6 % | 75.6 % | **28.1 %** | 1.44 / 1.40 | 6.5 / 1.1 | FAIL (repaint) |
| r20 try 2 (5-degree stone at +15) | 4.2 % | 75.6 % | **21.9 %** | 1.47 / 1.42 | 6.1 / 1.1 | FAIL (repaint) |

Gates are v5.1's: S <= 1.5 at both cuts, repainted share of the head <= 20 %, and identity <= 28 (mean absolute
difference over the head after the key is turned back to 0, against the plate).

## Method (why it differs from the Yuna X-2 chain)

Kimahri has no rig, no LoRA and no v4 pose keys, so there is no pose guide to push through. I used a 2.5D head:
Depth Anything V2 Small (the local copy in `D:/Tools/CodexArtLab/models/depth`, no download) blended 50/50 with a
smooth skull dome, turned about the vertical axis. The neck eases to the pinned body. The far mane lags (its
turn weight drops to 0.3 away from the skull). Each row is a 1D mesh, split at depth jumps (folds). A fold shows the far
surface stretched from behind, never the near outline. The background is one pinned underfill (1 GPU prompt), so
a head moving off the sky leaves no hole.

Each key N is **the plate turned N degrees in one resample**, wherever the plate's paint is magnified 1.3x or
less. Elsewhere it takes the previous key pushed 10 degrees (its own repaints), and a masked repaint only where
neither can carry the paint. The repaint uses Animagine XL 4.0 with the plate's own prompt, IP-Adapter from the
plate at 0.4, denoise 0.45 / 0.55 / 0.65, 2 seeds, 6 candidates. The pick is the lowest cut S plus face identity
(d45 won every time). The near eye, nose and mouth are never repainted.

- **v1 chain discarded:** pushing key to key (the Yuna way) passed the numbers to -30 / +30. At 1:1 it blurred with
  every step, and the far eye and snout bridge became horizontal streaks by +26. Magnification was only checked for each
  step, not since the paint was made. The v2 rule above fixes this. v1's keys are in scratch (`keys-v1`), not used.
- **l30 try 2:** try 1 was at 20.9 % repaint. Its mask was inflated by 1-2 px stretch specks on the mane strands. In try 2
  those specks keep the less-stretched paint, while folds and coherent stretched areas are still repainted. This
  rule applies to every later key.

## Looked at, at 1:1 (sheet.jpg, middle block)

- At every kept cut there is one eye, one nose and one mouth line. The diff shows only the 1-degree motion
  edge plus the repainted mane strands.
- **+20 (why it fails):** turning a three-quarter face toward the viewer opens the far eye and the far side of the
  snout. At +6 the plate still shows a stretched pink smear there. The +20 key paints a real far eye, so the cut
  visibly swaps the eye and reshapes the nose (S 1.44-1.47). The repaint needs 22-28 % of the head. **The right
  side stops at +10.** Going further toward camera needs Bailey's call. One option is a far eye painted once
  on the plate (end state first), which the chain would then push.

## Still wrong, disclosed

- The +6..+10 frames show horizontal row-stretch streaks along the snout's far edge and the far eye (the runtime
  warp stretches rows there).
- From -30 the horn bends where it meets the mane (the far-hair lag rule catches its tip). The ear ornament loses
  its engraving at -30. The mouth corner's small orange fang changes at the -30 and -40 cuts.
- At -40 the 2.5D proxy compresses the snout instead of pushing it forward into true profile.
- The runtime used for the numbers and the video is a CPU emulation of the mesh warp (`tools/sweep.py`), not
  the prototype's WebGL `dense.ts`.

## Files

- `sheet.jpg`: every kept key, 1:1 face crops at the five up-sweep cuts with S, and every key's numbers,
  failures included.
- `turn.mp4`: 1344 x 768, H.264 yuv420p faststart, 25 fps, 10.3 s. 0 -> +10 -> -40 -> 0, eased.
- Keys (PNG), picks, the underfill and the scripts are in `D:/Tools/pyrefly-art-backup/candidates/2026-09-25-portrait-keys/kimahri/`.
  Work files are in `D:/Tools/pyrefly-scratch/night-keys/kimahri/` and the tools in `.../night-keys/kwr-tools/`.
