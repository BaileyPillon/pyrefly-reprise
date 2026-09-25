# Living portrait keys: Rikku X-2 (night run, 2026-09-25)

Game case: **both**. The pause screen and the portrait runtime are shared plumbing, and the plate is Rikku's FFX-2
pause portrait. This is a PREVIEW. Nothing under `src/`, `tests/`, `critic/`, `public/art` or `docs/target` changed.
The plate `public/art/pause/rikku-ffx2.png` was read and never written. Every render is at the PNG's 1344 x 768.

## Result: all 8 keys, -40..+40 every 10 degrees, pass the gates on the first pick. ±40 reads as a painted cylinder at 1:1.

| key | push hole | repainted (grown) | S in its bracket | identity | iris hue shift | GPU |
|---|---|---|---|---|---|---|
| -40 | 11.5 % | 2.8 % (5.8 %) | 1.07 | 5.18 | 0 | 44.2 s |
| -30 | 12.3 % | 4.8 % (10.2 %) | 1.09 | 4.34 | 0 | 43.7 s |
| -20 | 10.0 % | 5.1 % (8.1 %) | 1.09 | 3.33 | 0 | 44.1 s |
| -10 | 5.0 % | 3.3 % (4.6 %) | 1.09 | 1.55 | 2 | 42.1 s |
| +10 | 4.8 % | 3.5 % (5.0 %) | 1.04 | 1.40 | 0 | 45.2 s |
| +20 | 9.7 % | 6.2 % (9.4 %) | 1.07 | 3.28 | 2 | 43.7 s |
| +30 | 11.3 % | 5.5 % (11.3 %) | 1.09 | 4.43 | 2 | 43.7 s |
| +40 | 9.8 % | 3.0 % (6.2 %) | 1.09 | 5.41 | 0 | 44.0 s |

**Sweep.** This is a 1-degree sweep from -40 to +40 with a hard cut halfway between keys. S is the head-box step at
a cut divided by the median 1-degree step, which is 12.29. The gate is 1.5.

| Cut | S |
|---|---|
| -36/-35 | 1.22 |
| -26/-25 | 1.10 |
| -16/-15 | 1.02 |
| -6/-5 | 0.91 |
| +5/+6 | 0.89 |
| +15/+16 | 1.05 |
| +25/+26 | 1.12 |
| +35/+36 | 1.23 |

- The largest step away from a cut is 1.24x the median. The step grows with yaw because the face slides faster near
  the rim, so the outer cuts read high against a global median.
- The same-yaw swap (head-box MAD) is 1.2 to 2.4.
- 0 of 81 frames show two paintings. Each frame is one key's paint, by construction.
- At rest the render matches the plate with a MAD of 0.08.

**GPU.** 18 prompts, about 13 min in total. The kept keys took 8 prompts. A first full chain of 8 took about 6.4 min
and was thrown away, see below. The underlay took 1 prompt and its scarf zone 1 more. ComfyUI was never restarted.
There were no all-black renders.

## How the keys were grown (why the method differs from Yuna's)

The v5.1 chain took each 10-degree push from the v4 pose-guide keys and the yuna-x2 LoRA. This plate has neither, so
the push comes from a **head proxy**:
- The proxy is an elliptic cylinder about the head's own up axis: centre (702, 262), radius 250, roll 20.7 degrees,
  taken from the eye line.
- Hair past the rim is a fin in the axis plane. It follows the turn only in part, down to 35 % at the far strands,
  the way loose hair lags.
- The hanging braids ease to 30 % motion toward their tassels.
- The head layer comes from 13 SAM 2.1 part masks: face, headband, the hair masses, braids and strands. It adds a
  4 px ring, and the scarf and body are taken out.
- The body, scarf and desert are one pinned underlay that ComfyUI painted once. The scarf and neck behind the chin
  come from a second zone prompt.
- Every head pixel carries its rest point and its **owner** (the plate, or the key that repainted it). Its colour is
  sampled from that owner's own painting, so the chain never resamples a resample.

Each key goes through the same four steps:
1. It is pushed 10 degrees from the previous key.
2. The holes are tears plus texels magnified more than 1.3x against their owner. The eyes, brows, mouth and the
   earring are never repainted.
3. The holes get one masked repaint: Animagine XL 4.0 with the plate through IP-Adapter at 0.3, 3 denoise levels x 2
   seeds.
4. The pick must pass the v5.1 gates (S ≤ 1.5, repainted ≤ 20 %, identity ≤ 28, iris hue kept), and the cut gets a
   1:1 look before the next key is grown.

## Looked at, at 1:1

- **Every cut** (`sheet.jpg`, crops on both sides of all 8 cuts) shows one iris, one lash line, one tooth line and one
  jaw contour.
- **The first chain was rebuilt.** Its gates all passed, but the look found four problems, each fixed before the rebuild:
  - At ±30 and ±40 the far hair slid past the canvas padding. The result was hard vertical edges at x ≈ 100 and 1265,
    and mirrored chevrons at the top.
  - Behind the chin the underlay showed a blue-white blob.
  - The first -10 repainted the earring, which popped at the cut.
  - A white stippled arc ran along the proxy rim in frames pushed back toward the plate.
  - The fixes were, in order: the far strands follow the turn only in part and the padding repeats the edge pixels;
    the scarf zone was repainted; the earring is protected; and the missing rim band is filled from the plate's own
    texels, with squeezed texels prefiltered.
- **Still wrong, disclosed:**
  - **At ±35..40 the head reads as a painted cylinder.** At +40 the open eye is squeezed against the rim. At -40 the
    winking eye slides off the left rim.
    - The cuts are clean. What is off is the geometry: a painted texture on a can, not a turned face.
    - For use, ±30 is the honest range. ±40 is kept because it passes every numeric gate.
  - Along the proxy rim, a 3 to 5 px band of smeared hair shows at ±25..40.
  - At the top edge, faint vertical streaks come from the edge padding at ±30..40.
  - An orange blob top right is pinned in the underlay and shows once the hair has moved off it.
  - A small teal patch sits in the gap left of the chin.
  - The far strands deliberately lag the head. That is a choice, not measured from Until Dawn.
  - Expressions and lids were not grown. This run is turn keys only.

## Files

- `sheet.jpg`: the nine keys, 1:1 crops on both sides of every cut, and the numbers per key.
- `turn.mp4`: the turn 0 -> +40 -> -40 -> 0, eased, with holds. It is 1344 x 768, 25 fps, 10 s, H.264 yuv420p with
  faststart, 4.2 MB.
- Keys, paintings, candidates, masks, the underlay, the configuration and the tools (`kcore.py`, `kgrow.py`,
  `ksweep.py`, `klook.py`, `masks.py`, `underlay*.py`, `comfy.py`, `sam_parts.py`) are backed up to
  `D:/Tools/pyrefly-art-backup/candidates/2026-09-25-portrait-keys/rikku-ffx2/`.
- The work files are in `D:/Tools/pyrefly-scratch/night-keys/rikku-ffx2/`, with the discarded first chain in `v1/`.
