# Living portrait v5 pilot: keys grown from the plate, hard cut (2026-09-23)

Game case: **both**. The pause screen and the portrait runtime are shared plumbing; the pilot uses the Yuna X-2
plate (FFX-2) because it is the only rigged plate. Method: `docs/plans/living-portrait-v5-method.md`, option (d),
with its Review corrections (identity checked against the ORIGINAL plate warped through the same flow, not the v4
keys; the new pair logic lives in a new `rig-chain.py`, not in `rig-flow.py`). A PREVIEW for Bailey: nothing
under `src/`, `tests/`, `critic/` or `public/art` changed.

## What was built

- Keys every 10 degrees, -20..+20, grown out of the plate: plate -> v5-r10 -> v5-r20 and plate -> v5-l10 -> v5-l20.
  Each key is the key before it pushed through the dense flow of the v4.1 pair (`frontal|v4-r20`, `v4-l20|frontal`)
  at the half step. The v4 keys give the pose only; none of their texture is used.
- Holes (disoccluded, stretched det(J) outside 0.7..1.3, forward-backward disagreement > 2.5 px) repainted with
  the yuna-x2 LoRA, masked, denoise 0.45 / 0.55 / 0.65, two seeds each (6 candidates a key, 24 in all). Picks by
  the cut metric and a 1:1 look: r10 d45 s1, l10 d45 s2, r20 and l20 d45 (stretch-only mask).
- Runtime: the prototype's dense warp with the paint change a **hard cut** (`dissolveS = 0`, 3 degrees
  hysteresis) on the spring's base yaw. Scratch copy of the prototype in `D:/Tools/pyrefly-lora/yuna-x2/rig-v5/proto`.
- GPU: 4 x 54.5 s = **3.6 min** (cap 10), one prompt at a time after 3 quiet minutes on the shared queue; ComfyUI
  never restarted.

## Numbers

| Gate (method doc, pilot step 3) | Keep if | Measured | |
|---|---|---|---|
| S = head-box step at the cut / median head-box 1-degree step on that side | <= 1.5 at both cuts | **0.99 to 1.24** at all 8 cuts (up: -14/-13 1.03, -4/-3 1.21, +6/+7 1.23, +16/+17 0.99; down: +14/+13 1.00, +4/+3 1.24, -6/-7 1.22, -16/-17 1.02). Face box 0.99 to 1.03 | pass |
| Same sweep, v4.1 keys under the same hard cut (step 0, option (b) alone) | (baseline) | **2.55 to 2.63** (face 1.50 to 1.85) | would be killed |
| Hole share of the head (push only) | <= 20 % at +-10 and +-20 | r10 0.1 %, l10 1.1 %, r20 9.6 %, l20 13.7 % (repainted with the 8 px grow: r20 12.3 %, l20 15.1 %) | pass |
| Identity vs the plate warped through the same flow | face MAD <= 28, irises by side, tassel, tips | face MAD r10 0.17, l10 0.17, r20 1.87, l20 2.30; iris green right / blue left on all four; hair-tip ratio 0.996 to 1.009; tassel is the plate's own layer | pass |
| Two paintings on screen | 0 | **0 of 41** frames each way in the 1-degree sweep; 0 of 301 logged frames in `pilot.mp4`, 0 of 593 in the half-speed compare (v4.1: 38 of 169 degrees) | pass |

The identity MAD is small by construction (the key IS the warped plate outside the holes); it measures how much
the repaint moved the face, which is what the Review asked for.

## Looked at (1:1)

- At every cut +-1 degree (`sheet.jpg` rows, and the up/down pairs at +6/+7, +16/+17, -6/-7, -16/-17): one iris,
  one catchlight, one lash line, one jaw contour. The cut cannot be picked out.
- **Defect, in the keys, not at the cuts:** from about +8 to +20 a grey smear runs parallel to her right jaw ink,
  next to the tassel (plain at +14..+20, the last row of the sheet's crops). v4.1 at +16 has a clean jaw there.
  Likely the tassel's painted-out footprint being uncovered as the tassel shifts (tasselDx 14.5 / 29 px) or the
  stretched jaw ink; cause not isolated. A fainter broken red contour runs along the far (left) jaw at -20..-14.
- The turn inside +-20 is a 2D warp of one painting; the nose and far eye move as the v4.1 flow says. Whether it
  reads as a head turn at pause-screen size is Bailey's call from `compare.mp4`.

## Verdict: KEEP (d)

Every kill test passes by a wide margin (worst S 1.24 against 2.55 to 2.63 for the v4.1 keys under the same cut),
and nothing mixes. Before phase 1: fix the near-jaw smear at the source, then grow +-30 / +-40 the same way (holes
grow with angle: 0.1 / 1.1 % at 10 degrees, 9.6 / 13.7 % at 20, so +-40 is where the 20 % gate will bite).
Bailey's look at `compare.mp4` and his reaction on the tile come first (end state first). Also for him: the
expression mapping by member state (normal / determined / hurt) is INFERRED, not asked yet.

## Files

- `pilot.mp4`: 720 x 1200, H.264 yuv420p faststart, 25 fps, 14.0 s, legend hidden; the v4 clip's beats (idle,
  slow turn to one side, back, the other side, back, blink, smile) inside +-20 (v4's clip: 16.6 s over +-85).
- `compare.mp4`: v4.1 as committed (0.2 s dissolve) | the pilot, the same turn 0 -> +20 -> -20 -> 0 at half
  speed, 1440 x 1200, 27.7 s, crf 27 to stay under 8 MB.
- `sheet.jpg`: frames every 2 degrees, 1:1 head crops, the head-box step chart (pilot vs v4.1 keys cut), the S
  table, the hole maps.
- `tools/`: `rig-chain.py` (propagate / holes / merge; 476 lines, over the 400-line house limit: split before it
  moves to `tools/gen/`), `chain-repaint.mjs`, `identity.py`, `sweep-metric.py`, `pilot-shots.mjs`,
  `make-videos.py`, `make-sheet.py`, `holecrops.py`. Work files and candidates: `D:/Tools/pyrefly-lora/yuna-x2/rig-v5/`
  (not committed).

## Machine note

C: had 0 bytes free during this run. The first pilot sweep lost its WebGL context (D3D11 out of memory; every
frame blank) and x264 failed a malloc: the page file cannot grow. Re-run with TEMP on D: and `-threads 2`, it
completed. Other agents' captures on this machine will hit the same until C: is cleared.
