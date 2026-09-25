# Living portrait keys: Paine (night run, 2026-09-25)

Game case: **both**. The pause screen and the portrait runtime are shared plumbing, and the plate is Paine's FFX-2
pause portrait. This is a PREVIEW. Nothing under `src/`, `tests/`, `critic/`, `public/art` or `docs/target` changed.
The plate `public/art/pause/paine.png` was read and never written. Every render is at the PNG's 1344 x 768.

## Result: keys -20..+20 pass. The +30 and -30 keys fail at 1:1, so the ±40 keys were not grown.

| key | push hole | repainted (grown) | S in its bracket | identity | iris hue shift | GPU |
|---|---|---|---|---|---|---|
| -20 | 18.7 % | 9.7 % (14.1 %) | 1.07 | 1.69 | 0 | 46.8 s |
| -10 | 7.5 % | 5.1 % (7.0 %) | 1.00 | 0.18 | 0 | 46.7 s |
| +10 | 7.9 % | 5.3 % (7.5 %) | 1.04 | 0.95 | 2 | 48.4 s |
| +20 | 19.0 % | 9.4 % (14.0 %) | 1.04 | 1.81 | 0 | 51.4 s |
| +30, attempt 1 | 22.3 % | 7.8 % | 1.03 | 2.47 | 0 | 47.4 s. **FAIL at 1:1** |
| +30, attempt 2 (far eye unprotected, denoise 0.55-0.75) | 22.3 % | 11.7 % | 1.09 | 4.93 | 0 | 45.3 s. **FAIL at 1:1** |
| -30 | 23.6 % | 8.1 % | 1.03 | 2.68 | 0 | 49.8 s. **FAIL at 1:1**, not retried |

**Sweep.** This is a 1-degree sweep from -20 to +20 with a hard cut halfway between keys. S is the head-box step at
a cut divided by the median 1-degree step, which is 10.05.

| Cut | S |
|---|---|
| -16/-15 | 1.08 |
| -6/-5 | 1.01 |
| +5/+6 | 1.03 |
| +15/+16 | 1.02 |

- The largest step away from a cut is 1.05x the median.
- The same-yaw swap (head-box MAD) is 0.13 to 1.82.
- 0 of 41 frames show two paintings. Each frame is one key's paint, by construction.
- At rest the render matches the plate with a MAD of 0.015.

**GPU.** 13 prompts, about 8.5 min in total. That is 6 prompts for the kept keys (including a first ±10 pair that was
thrown away, see below), 3 for ±30, 1 underlay and 2 underlay neck zones. ComfyUI was never restarted. There were no
all-black renders.

## How the keys were grown (why the method differs from Yuna's)

The v5.1 chain took each 10-degree push from the v4 pose-guide keys and the yuna-x2 LoRA. This plate has neither, so
the push comes from a **head proxy**:
- The proxy is an elliptic cylinder about the head's own up axis: centre (544, 230), radius 237, roll 5 degrees, and
  a capsule floor of 0.8 so that the jaw and nape stay on the cylinder.
- Hair past the rim is a fin in the axis plane.
- The head layer comes from SAM 2.1 part masks (face, hair, ear), plus a 4 px ring. The body and background are a
  pinned underlay that ComfyUI painted once. It is bokeh around the head, and the neck and collar behind the jaw come
  from a second zone prompt.
- Every head pixel carries its rest point and its **owner** (the plate, or the key that repainted it). Its colour is
  always sampled from that owner's own painting, so a chain of keys never resamples a resample.

Each key goes through the same four steps:
1. It is pushed 10 degrees from the previous key.
2. The holes are tears plus texels magnified more than 1.3x against their owner. The eyes, brows and mouth are never
   repainted.
3. The holes get one masked repaint: Animagine XL 4.0 with the plate through IP-Adapter at 0.3, 3 denoise levels x 2
   seeds.
4. The pick must pass the v5.1 gates: S ≤ 1.5, repainted ≤ 20 %, identity (face MAD against the plate pushed straight
   to the same yaw) ≤ 28, and the iris hue kept.

## Looked at, at 1:1

- **Every cut at ±5/6 and ±15/16** (`sheet.jpg`, middle row) shows one iris, one lash line and one lip line. The cut
  cannot be picked out.
- **Two fixes before the kept run.**
  - The first ±10 pair put the neck in the head layer with an easing weight, the way Yuna's rig does. It smeared the
    red rim-lit neck into streaks, and the first underlay painted a red armour band and a buckle behind the jaw.
  - Both were redone: the neck is pinned, and the neck zone was repainted as shadowed neck and collar.
  - A thin dark crack at the chin tip came from an owner-seam sampling bug. Each painting now reaches 4 px past the
    pixels it owns.
- **+30 fails twice** (`fail-p30-attempt1.jpg`, `fail-p30-attempt2.jpg`).
  - Paine's plate is already turned about 55 degrees to her right. Turning her 30 degrees back toward frontal
    stretches the far side of the face.
  - The nose line is lost, the far eye is a red smear, and background blue shows inside the face contour.
  - Attempt 2 let the sampler paint the far eye. The eye then pops at the +25/+26 cut, from a smear to a painted eye.
  - The numbers pass both times. The gates cannot see anatomy.
- **-30 fails** (`fail-m30.jpg`). Turning further toward profile runs the face into the cylinder's rim, and the
  profile loses its nose: the contour becomes a smooth arc.
  - A cylinder cannot make a profile. A second attempt with the same proxy would be a blind re-roll, so it was not
    tried.
- **Still visible in the kept range:**
  - At +20 the nose and upper lip on the far side are flattened (the face reads a little "pulled").
  - At -20 the dark neck patch behind the ear is the repainted underlay.
  - At the crown there is a 1-2 px dark sliver at +20.
- **Range:** ±20, against Yuna's ±40 and Until Dawn's ±45 or more.
  - The keys past ±20 would need real geometry for the nose and the far eye: a depth or pose guide, or a
    Paine-specific LoRA.
  - That is a method decision for the orchestrator and Bailey, not a re-roll.
- Expressions and lids were not grown. This run is turn keys only.

## Files

- `sheet.jpg`: the five keys, 1:1 crops on both sides of the four cuts, and the numbers.
- `turn.mp4`: the turn 0 -> +20 -> -20 -> 0, eased. It is 1344 x 768, 25 fps, 8.4 s, H.264 yuv420p with
  faststart, 0.97 MB.
- `fail-*.jpg`: the look sheets of the three failed keys. Each shows the cut at 1:1 and every candidate.
- Keys, paintings, candidates, masks, the underlay, the configuration and the tools (`kcore.py`, `kgrow.py`,
  `ksweep.py`, `klook.py`, `masks.py`, `underlay*.py`, `comfy.py`, `sam_parts.py`) are backed up to
  `D:/Tools/pyrefly-art-backup/candidates/2026-09-25-portrait-keys/paine/`.
- The work files are in `D:/Tools/pyrefly-scratch/night-keys/paine/` and `.../rp-tools/`.
