# v3.3 re-check against the v3.1 refutation (2026-09-22)

Game case: **FFX-2 only** (the plate is Yuna X-2; the renderer plumbing is shared by any plate).

How: `tools/gen/rig-check.mjs` re-runs the v3.1 check's own measurements
(`critic/scratch/living-portrait-v3/capture.mjs`: same yaws, same real inputs,
same crops) in real Chromium on the GPU (`PYREFLY_BROWSER=gpu`, ANGLE D3D11,
RTX 5070 Ti), viewport 1000x2000, canvas at its native 832x1216. Turns are the
real arrow keys held with the clock slowed to 0.08x and frozen at the target;
blinks the real B key; the mid-gaze test a real mouse resting on the canvas.
`tools/gen/rig-measure.py` reads the numbers off the run (`check.json` here),
`tools/gen/rig-shots.py` wrote this folder. Every still is the WebGL canvas.

Stills: `00-rest-post0` / `00-rest-post` (reduced motion, settled), `01..08`
the eight seam yaws (live: idle motion and the post grade on), `10` the blink
at 16 ms steps, `11` a real B press held closed at -30, -45, -84, +30, +45,
+84 degrees, `12` the mouse resting at 22 degrees (every third of 40 frames,
0.3 s apart), `clip.webm` (15 s: idle, a held left turn to the stop, back,
a held right turn, B while turned, B centred, a smile), `sheet.png`,
`crops/` at the v3.1 check's boxes.

| v3.1 finding | root cause | fix | re-measured |
|---|---|---|---|
| -20: two hair paintings overlaid, doubled jaw, ghost bead | the paint of two keys cross-faded by the RENDERED yaw | `src/paint.ts`: one painted key at a time, chosen from the spring's base yaw with 6 deg hysteresis, a 0.2 s dissolve only when it changes; the geometry still follows the rendered yaw through the mesh warp | every seam still shows exactly one painting (`check.json` seams: `from: null`); `01-yaw-m20`, `crops/m20-jaw` |
| -20: staircase edge in the side hair; thin grey outline under the eye | (a) the plate is cut by the canvas on the right; the warp pulled up to 39 px from past it and the shader repeated the edge texel (streaks); (b) straight-alpha bilinear filtering and holes in lower layers under upper ones ("conflation" line at every layer edge under the warp) | (a) `tools/gen/rig-margins.py`: every layer touching the border gets a margin past it; hairBack's right margin is continued along its own strands (`edgeflow`), four side pins in the warp; `check/border.test.ts` proves the worst pull (39.3 px at +-31 deg with sway and chest) stays inside the 64 px margin; (b) `src/gl-layer.ts` filters premultiplied texels; `tools/gen/rig-underfill.py` makes hairBack and headCore opaque under everything drawn over them | `crops/m20-hair-right`, `crops/m20-eye-left`: no line, no streak; rest still exact (below) |
| -60: ghost profile nose/lip, doubled chin; warped hair triangle behind the neck | cross-faded paint; the 3/4 key's bob stopped at y 752 | one painting; the 3/4 head's back hair repainted down to y ~860 behind the neck | `03-yaw-m60`, `crops/m60-face`, `crops/m60-neck` |
| -80: straight edge at x ~815, flat bottom; grey/blue crown blotches | the profile key ended at the source canvas; its sky-blue sheen | `tools/gen/rig-heads.py` (v3.3): the back of the head painted past x 990 (a turned head is longer than the frontal is wide), tips at the bottom; `rig-turns.py` warms a cool sheen to the plate's own highlight colour | `04-yaw-m80`, `crops/m80-back-of-head`, `crops/m80-crown` |
| +20: duplicate braid; doubled jaw; dark band in the left hair | cross-faded paint of the mirrored key | one painting; the right turn's braid moved to her right (`rig-braid.py`) | `05-yaw-p20`, `crops/p20-collar`, `crops/p20-hair-left` |
| +40/+60/+80: back of the head ends on a vertical line at x 160 | the mirror put the source canvas cut inside the frame | the same repainted heads: mirrored, the back of the head runs past the left frame | `06..08`, `crops/p40..p80-back-of-head`; straight-edge audit below |
| +80: half blue, half green iris | the painting's own iris | the whole visible iris recoloured to her left eye's green | turn-r85: 1508 green, 2 blue iris px (was 651 / 610); `crops/p80-eye` |
| straight-edge claim | (above) | (above) | longest perfectly straight vertical alpha run: hairBack 104 px (the approved plate's own cut at x 107), turn-l45.back 74 (under the body), turns 51-60, everything else under 50 (`check.json` straight) |
| mouse resting at ~22 deg pulses between two paintings | paint followed the swaying rendered yaw | paint from the base yaw with hysteresis; the idle yaw wander is 1.2 deg at p95 (was +-10) | two paintings mixed: 0 % of 120 samples at 15, 22, 25 and 60 deg (was 33-78 %); `12-mouse-resting-22deg` |
| blink closed: iris sliver, sclera crescent, flat pink oval, 3 steps | lid built per column from one sampled colour; closed line above the lower lid; lid frames stored premultiplied | `tools/gen/rig-lids.py` (v3.3): lid skin is a harmonic fill from the surrounding skin, the closed frame covers the whole opening with one tapered lash line, eight frames from 0.85 to 0; straight-alpha compositing | `10-blink-strip`, `crops/blink-closed-left-eye-3x`; apertures at 16 ms: 0.67, 0.35, 0.03, 0, 0, 0.19, 0.43, 0.67, 0.91, 1 |
| no blink past ~11 deg | the turned keys had no lids | lid frames for every turned key | `11-turned-blink-closed`: closed at -30, -45, -84, +30, +45, +84 |
| smile: halo, cloud edge, doubled mouth corner | the inpaint's soft blob as matte; lighter skin | `tools/gen/rig-mouth.py`: mouth-shaped matte from both mouths' features, the plate's own low-passed skin under it | `crops/mouth-plate-vs-smile-2x` |
| shipped view: MAD 35.2, figure 28 % darker | a 55 % vignette over the figure | the grade darkens only the far corner (22 % max), focus blur 1 px max | rest with the post pass on: MAD 0.59 (figure 0.66), figure luminance 140.5 -> 140.1; with `?post=0`: 0 px differ |
| chest sway inverted (y 5.75 %, x 2.0 %); head sway tiny; yaw overshoot 8.7 deg | one sample drove both chest axes; the head's sway was spent as yaw | per-axis chest samples calibrated to the spec's own measure (half the peak-to-peak of 5.5 s windows); the head sways as a translation carried by the mesh; yaw wander 1.2 deg p95 | browser, 180 s, 32 windows: chest 3.63 % IPD across / 2.80 % up-down (spec 3.6 / 2.9); head in the image 2.17 % / 2.17 % of head width (spec 1.5-3, vertical about equal); logic run 1200 s (check/motion.test.ts): chest 3.57 / 2.91, head 2.32 / 2.13; held 40 deg overshoot under 3.5 deg |

Rest (`00-rest-post0`, reduced motion, settled 4 s, `?post=0`): **MAD 0.0000, max 0,
0 px differ** from the plate over the backdrop.

## Still not right (disclosed)

- The paint change between the frontal plate (orange and pink hair, the tassel)
  and a turned key (brown hair, a red braid) is a 0.2 s dissolve at about 28
  degrees: short, but it is a change of painting, not a turn of one.
- The margin past the right border is invented (continued strands); at the
  frontal's extreme pose up to ~39 px of it can show at the frame edge.
- The backs of the heads are diffusion-painted (animagine, denoise 0.8) from a
  blurred prefill; they read as hair at 1:1 but no judge has seen them.
- Turned keys have no mouth or brow expressions; only the frontal smiles.
- q34-left still barely turns and is retired (the left 3/4 is turn-l45, the
  q34-right painting).
- Nothing here has had an independent judge or Bailey's look.
