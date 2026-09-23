# Living portrait v4: one Yuna across the turn (2026-09-23)

## v4.1 fix pass (latest; read this first)

Game case: **FFX-2 only** (the Yuna X-2 plate); the tools (dense registration,
mirror, painted lids, tassel occlusion) and the renderer plumbing are shared by
any plate. Why: the v4 check refuted the rig (two paintings mixed while the
viewer held still, a different +80..+85 painting sitting 60 to 90 px high,
doubled irises and lashes in every paint window, the tassel across the cheek,
tearing at the wide turns, blob lids, weak expressions, a turn that stopped at
every key, a seam and no far eye at +60). Each is fixed at its root below and
re-measured with the check's own tools (`critic/scratch/living-portrait-v4/`,
run unchanged from a scratch copy against this build). Evidence:
`docs/concepts/pause-until-dawn/prototype-v2/shots/v4/` (`clip-15s.webm`,
`sheet.jpg`, stills, 1:1 crops) and `shots/v4/check/` (the sweep every 6
degrees, the wide turns every 3, the tassel range, the eyes at every paint
change's midpoint, blink, mouth and brow sheets, `measured.json`).

### What is real now

| v4 check finding | root fix | re-measured (same tool) |
|---|---|---|
| Held gaze: two paintings in 40 of 40 samples at -30, -50, -72, +30, +50, +72 (the paint weight followed the swaying rendered yaw) | `src/paint.ts`: 'warp' now uses the one-painting selector on the spring's BASE yaw (3 deg hysteresis, 0.2 s or 5 deg dissolve, `WARP_PAINT`); v4's `renderWarp` and `paintWindowWeight` removed | hold: **0 of 40** at 0, -30, -50, -72, +30, +50, +72, -40, +40; `?paint=switch` 0 of 20 at -30, -72, +72 |
| Features doubled in every paint window (two irises, two catchlights, doubled lashes and jaw) | `tools/gen/rig-flow.py` + `src/warp/dense.ts`: every adjacent pair registered feature by feature (DIS optical flow both ways on top of the landmark map, kept where forward and backward agree, two passes, smoothed, capped, fold-repaired) into an 8 px midpoint grid; each key samples its own texel and at g = 0 / 1 is its own painting exactly | face mismatch with both keys warped to the pair's middle (MAD): 45 -> 28 (0 / +20), 43 -> 30 (-20 / 0), 42 -> 32 (-40 / -20), 44 -> 32 (+20 / +40), 45 -> 35 (-60 / -40), 40 -> 32 (-85 / -60); one iris and one lash line at w = 0.5 in every paint change from -46 to +34 (`check/mid-dissolve-eyes.png`) |
| The turn moves in pulses (smootherstep per bracket: 0 px/deg at every key) | `renderer.ts` `pose`: linear bracket weight (the tassel offset too) | 1-degree image MAD min 6.9, median 9.8 (v4: 0 to 2 at each key, 15 to 22 between); no step over 3x the median at 1 or 5 degrees |
| +80..+85 a different painting (flat glossy hair, no tips, teal smear, jagged jaw), face 60 to 90 px high; +60 a vertical seam and no far eye | `tools/gen/rig-mirror.py`: +60 and +85 are the judged -60 and -85 mirrored about the head axis (S = 946), irises recoloured by side (her right green, her left blue), the plate body's collar copies stripped before the flip, small islands removed; the mirrored far clip repainted as hair with the LoRA (`tools/gen/lora-repaint.mjs`, `rig-v41fix.py prep / merge`) | +85 nose y 532, chin 715 (the -85 key's; v4: 455 / 675); the +60 far eye is there; orange and pink tips on both (`check/sweep-wide.jpg`) |
| Tears at -60..-85 and +60..+85 (horizontal streaks, edge bars, a white crescent, ghost hair) | `rig-flow.py` `occlusion_landmarks`: in the two wide brackets the 60-degree key's far-side hair landmarks sit on the profile's own silhouette (carried by the face's shift), so the profile is never stretched over hair it does not have; `edge_keep`: no motion across the frame line, only along it | no streaks or bars from -84 to -72 or +72 to +84 (`check/sweep-wide.jpg`); every pair's mesh is fold-free at 21 weights (`check/dense.test.ts`) |
| The tassel crosses the cheek at -22..-26 and ghosts over cheek and mouth at -30..-34 | `rig-v41fix.py faceover` + `compose.ts drawFaceOver`: while her right ear turns away (yaw < 0) each key's lower face and neck are drawn back over the tassel (its mouth patch again after it); otherwise the tassel is on top; in a dissolve each key's pass carries its own | the tassel passes behind the cheek and jaw from -20 to -44 (`check/sweep-tassel.jpg`); no tassel over the mouth at -40 (`check/v-mouth.jpg`) |
| Blinks on turned keys: flat pale blobs with torn outlines, a zig-zag 'V' at -40, a dark outlined oval at 0 | `tools/gen/rig-lids2.py`: every key's closed eyes PAINTED with the LoRA (masked to the eyes; per-eye picks where the sampler winked); each in-between frame is the closed painting's own lid unrolled down to the aperture's lid edge with its own lash line; strands stay in front, iris texels never do | the blink at 0, -40 and +20 rolls with painted skin and lashes (`check/v-blink.jpg`); timing unchanged (0.68, 0.35, 0.03, 0, then reopening); change outside the eye box 0.005 to 0.033 levels up to the closed frame (0.07 by the end of the reopening, as the clock runs) |
| Expressions: a red dash under the -40 mouth, a pink wedge, the parted mouth shifted left, pressed breaking into fragments at 0 and +20, an orange smear at 0; brows barely visible | `rig-v41fix.py mouth`: a patch is the WHOLE repainted mouth region (soft ellipse), not the dark features cut out of it (which let two lip lines mix); new LoRA candidates for pressed (all five keys), -40 parted and slight smile, 0 slight smile; `heal` removed the dash from the -40 key, its composite and its patches; `compose.ts browOpacity`: the brow swell peaks at full opacity (the spec's 40 percent is movement, not paint opacity) | `check/v-mouth.jpg`, `check/v-brow.jpg`; change outside the mouth patch 0.01 to 0.79 levels |

Unchanged and still passing: rest with `?post=0` is the plate to the pixel
(MAD 0.0000, 0 px differ; post on 0.59, the corner grade); the body band
below y 1016 differs from rest by 0.12 to 0.31 over the sweep; the logic layer
(spring, blink timing, sway band 0.199 Hz, idle chest 4.96 percent of IPD) is
untouched.

### What remains (disclosed)

1. **Two paintings still show for 38 of 169 degrees of a frozen 1-degree
   sweep** (v4: 42): 5 degrees at each of the eight paint changes. They are
   registered now (one iris, one lash line), so what changes is texture: hair
   strands and shading. In real time a change takes 0.2 s or 5 degrees.
2. **+40 -> +60 changes the fringe**: +60 is the mirrored -60, whose fringe
   falls the other way from the +40 key's, so at the +50 swap two different
   fringes dissolve for 0.2 s (`check/mid-dissolve-eyes.png`, the +54 panel;
   face MAD 61 -> 59, barely registered). The fix is a +60 painted from +40
   turned, not from the mirror.
3. **The wide brackets fade the far hair**: between -60 and -85 (and +60 /
   +85) the 60-degree painting's far-side hair is shown as painted until the
   paint changes, then dissolves out in 0.2 s (one warp cannot slide it behind
   the face).
4. **The tassel fades out between -40 and -55** where it still shows below
   the jaw (a faint cyan tassel end at -50).
5. **The clip at -60 / -85 is the full red and cyan disc**: the plate shows
   half of it at the frame edge and the turn reveals the whole, scaled from the
   -40 key's (the plate's own design). The check called it a disc the plate
   never shows; kept, and flagged for Bailey.
6. **Leftward and rightward sweeps differ at the swap points** (MAD up to 50
   at +50): with hysteresis the paint changes 3 degrees later in the direction
   of travel. v4's spatial window had no hysteresis (and no held gaze).
7. **Profile blinks**: at -85 / +85 the lid covers the upper eye first and the
   iris goes at the last frame; the -40 parted mouth is barely open (the
   sampler would not open it at a low denoise).
8. No independent judge and no Bailey look at this pass.

### Rebuild (no ComfyUI; the picks are on disk)

```
PY=D:/Tools/ComfyUI/python_embeded/python.exe
CV=D:/Tools/sd-scripts/.venv/Scripts/python.exe          # the only Python here with OpenCV (rig-flow.py)
W=D:/Tools/pyrefly-lora/yuna-x2/rig-v41
$PY -s tools/gen/rig-v41fix.py clean --key v4-l85 ; $PY -s tools/gen/rig-v41fix.py clean --key v4-l60
$PY -s tools/gen/rig-mirror.py --src v4-l60 --dst v4-r60 ; $PY -s tools/gen/rig-mirror.py --src v4-l85 --dst v4-r85
$PY -s tools/gen/rig-v41fix.py merge --key v4-r60 --region clip --grow 24 --pick $W/v4-r60.clip.c2.png
$PY -s tools/gen/rig-v41fix.py merge --key v4-r85 --region clip --grow 14 --pick $W/v4-r85.clip.c1.png
#   (the far clip landmark of v4-r60 / v4-r85 and the tassel dx 110 / 197 are set in rig.json)
$PY -s tools/gen/rig-lids2.py build --key frontal --pick $W/frontal.lidsB.c1.png --pick-l $W/frontal.lidsB.c4.png
#   lidsB picks: v4-l20 c1, v4-l40 c1, v4-l60 c4, v4-l85 c1, v4-r20 c2, v4-r40 c1, v4-r60 c4, v4-r85 c3
$PY -s tools/gen/rig-v41fix.py mouth --tag 0 --state pressed --pick $W/mouth.0-pressed.c1.png   # the others: artMeta.v4.expressions
$PY -s tools/gen/rig-v41fix.py heal --key v4-l40 --box 312,624,24,20
$PY -s tools/gen/rig-v41fix.py faceover
$CV tools/gen/rig-flow.py build --check
PYREFLY_BROWSER=gpu node tools/gen/rig-v4shots.mjs --url http://127.0.0.1:<port>/docs/concepts/pause-until-dawn/prototype-v2/ --out docs/concepts/pause-until-dawn/prototype-v2/shots/v4
```

The repaints (clip, closed eyes, mouths) came from `tools/gen/lora-repaint.mjs`
(the yuna-x2 LoRA, core nodes, one prompt at a time behind the shared queue,
about 9 s each; ComfyUI never restarted; no training this pass). The
candidates live in `D:/Tools/pyrefly-lora/yuna-x2/rig-v41/` (not committed).

A dev-server note: the repo's default Vite watcher crashed mid-check on
another agent's browser profile under `critic/rounds/` (EBUSY); a config that
ignores `critic/**` kept it up.

### Needs Bailey

- A look at `shots/v4/clip-15s.webm` and `sheet.jpg`, and **his pick of the
  gaze reading by feel** (head, eyes or camera) in the prototype.
- Whether the full clip disc at -60 / -85 stays (item 5), and whether +60 is
  worth repainting from +40 (item 2).


## Rig assembly (v4, superseded by v4.1 above)

Game case: **FFX-2 only** (the Yuna X-2 plate); the tools and the renderer
plumbing are shared by any plate. Write-up: the prototype README, Part 8.
Evidence: `docs/concepts/pause-until-dawn/prototype-v2/shots/v4/`
(`clip-15s.webm`, `sheet.jpg`, stills at -80..+80, 1:1 crops of eyes,
hairline, tassel and jaw per yaw, blink mid/closed, smile at 0 and -40, slight
smile and raised brows at +20, `log-all.json` with each frame's yaw and paint).

### What is real now

- **Nine keys every ~20 degrees** (-85, -60, -40, -20, plate, +20, +40, +60,
  +85) cut into back/front layers and wired into `art/rig.json`; the v3 turns
  (different paintings) are retired.
- **Continuous mesh warp between adjacent keys** is the default
  (`artMeta.v4.paint = "warp"`); `?paint=switch` keeps the v3.3 one-painting
  switch as a fallback. The paint swaps only inside an 8 degree window in the
  middle of each bracket, so most of the turn is one painting reshaped by the
  warp. 25 shared landmarks (20 face points + the hair clip + the head's
  silhouette at two heights), read at 2x; no fold on any pair.
- **Judge's fixes applied** to the failing keys: the plate-design clip at -60
  and -85 (the cord and the headphone disc gone), rainbow hue cleared from the
  hair, far hair behind +60's cheek, a rounded back of the head at +85, and the
  plate's own tassel as one layer at every yaw (its footprint painted out of
  each key; under the jaw at -40, gone past -55).
- **Masks with SAM 2.1** (`tools/gen/rig-sam.py`): per layer the raw SAM edge,
  SAM snapped to the ink, and the existing alternative (the v3 geodesic masks on
  the plate, the repaint-mask cut on a key) are scored at the boundary; the kept
  edge is recorded per layer in `art/v4/masks/choice.json`. On the plate SAM
  won the face, tassel, eyes and clip; v3 kept the head, body and left iris.
- **Blinks on every key** (eight lid frames each), **mouth (parted, slight
  smile, smile, pressed) and brows (raised, drawn)** painted with the LoRA at
  denoise 0.5 / 0.45 for the plate and the +-20 / +-40 keys.
- Rest with `?post=0` is unchanged (the frontal stack is the v3 one).
- `tsc` clean; `check/` 15 tests, the six `tests/unit/pause-living-portrait-*`
  files 53 tests, all green. 115 approved hashes match before and after.

### Still not right (seen at 1:1 in `shots/v4/`)

1. **Mid-bracket frames still show two paintings for about 8 degrees**, most
   at -60..-85 (the profile's hair mass and the clip differ from -60's): a
   ghost of the other key's back hair while the swap runs. Between -40 and +60
   the swap is hard to see.
2. **+85's far side** (face contour against the back of the head) and **-85's
   hair top** carry faint seams where the repaint met the key.
3. **Profile eyes at +-85 and the +60 far eye** are small and the lids there
   are thin; the brow patches change little at 0.45 denoise (raised reads,
   drawn barely).
4. **+-60 and +-85 have no mouth or brow patches** (the brief asked for 0,
   +-20, +-40); an expression running into a wide turn fades out with the key.
5. **The neck at -60** shows a flat skin patch between the hair and the collar.
6. No independent judge and no Bailey look at this pass.

### Rebuild (no ComfyUI; the picks are committed)

```
PY=D:/Tools/ComfyUI/python_embeded/python.exe
$PY -s tools/gen/rig-sam.py masks --keys -85,-60,-40,-20,20,40,60,85 --src picked
$PY -s tools/gen/rig-v4fix.py prep
$PY -s tools/gen/rig-v4fix.py merge --picks cord-85:3,clip-60:1,far+60:init,blob+60:1,back+85:3,hole-20:init,hole+20:init,hole+40:init,hole+60:init,hole+85:init
$PY -s tools/gen/rig-sam.py masks --keys -85,-60,-40,-20,20,40,60,85 --src notassel
node tools/gen/rig-range.mjs --warp docs/concepts/pause-until-dawn/prototype-v2/art/v4/warp/landmarks.json --out docs/concepts/pause-until-dawn/prototype-v2/art/v4/range-warp.json
$PY -s tools/gen/rig-v4layers.py
for k in v4-l85 v4-l60 v4-l40 v4-l20 v4-r20 v4-r40 v4-r60 v4-r85; do $PY -s tools/gen/rig-lids.py --only $k; done
$PY -s tools/gen/rig-v4face.py build --picks <see artMeta.v4.expressions>   # needs the candidates in D:/Tools/pyrefly-lora/yuna-x2/rig-v4/patches-jobs
PYREFLY_BROWSER=gpu node tools/gen/rig-v4shots.mjs --url http://127.0.0.1:<port>/docs/concepts/pause-until-dawn/prototype-v2/ --out docs/concepts/pause-until-dawn/prototype-v2/shots/v4
$PY -s tools/gen/rig-v4sheet.py docs/concepts/pause-until-dawn/prototype-v2/shots/v4
```

Intermediates (work images, every inpaint candidate, the finished keys as PNG)
live in `D:/Tools/pyrefly-lora/yuna-x2/rig-v4/` (not committed).
`tools/gen/inpaint.mjs` gained `--lora name:strength` (additive; the file was
already over 400 lines before this pass).

### Needs Bailey

- A look at `shots/v4/clip-15s.webm` and `sheet.jpg`, and a judge pass on the
  wide turns (items 1 and 2 above).

## Keys track (rounds 1 and 2, earlier the same day)

Game case: **FFX-2 only** (the Yuna X-2 plate). The tools are generic, the LoRA
and the keys are this Yuna's.

## Why

v3.3 (`docs/handoff/living-portrait-v3.md`, `shots/v3.3/CHECK.md`) fixed the
renderer, but its turned keys were different paintings from the plate (brown
hair without the orange/pink tips, a small earring for the tassel, a red braid,
another line), so a turn read as a change of picture. v4 trains the plate's
identity into a LoRA and paints every key with it.

## Done (keys track, round 1)

- **Identity LoRA** `yuna-x2` (kohya, Animagine XL 4.0 Opt, rank 32, U-Net only,
  2000 steps): 30.5 min wall, about 8.1 GB VRAM (10.1 GB peak on the shared
  card). Step 2000 picked at 1:1 against the plate; installed as
  `D:/Tools/ComfyUI/ComfyUI/models/loras/yuna-x2.safetensors`. Weights and data
  stay under `D:/Tools/pyrefly-lora/yuna-x2/` (not committed).
- **Keys** for yaw -85, -60, -40, -20, +20, +40, +60, +85: 12 candidates per
  yaw (two rounds of 6), two picks each, as lossless webp with sidecars in
  `docs/concepts/pause-until-dawn/prototype-v2/art/v4/keys/picked/`.
  Every pick has the plate's hair, tassel, eyes and line.
- Evidence (round 1, now in `art/v4/keys/sheets/r1/`): `turn-strip.webp`,
  `yaw<N>.webp`, `steptest.webp`; the whole write-up is `art/v4/keys.md`.

## Tools

| Tool | What |
|---|---|
| `tools/gen/rig-lora-data.py build` | the 17-image dataset (sources hashed, never written; ESRGAN on the CPU) |
| `tools/gen/lora-train.mjs gate / train` | the GPU gate (ComfyUI queue empty and < 4 GB for 3 min) and the kohya run with VRAM logging |
| `tools/gen/rig-lora-pose.py draw` | head-and-shoulders OpenPose skeletons per yaw from the plate's landmarks |
| `tools/gen/lora-keys.mjs test / render` | LoRA + plate IP-Adapter (R2) + OpenPose ControlNet, one prompt at a time behind the shared queue |
| `tools/gen/rig-lora-sheet.py steps / yaw / picks` | contact sheets (plate first, candidates whole and 1:1) and the pick copy + turn strip |

## Round 2 of the keys (second and last attempt, 2026-09-23)

The independent judge failed round 1 (`art/v4/keys/judge-r1.md`: best 3 to 6
per yaw; the sequence read as a model sheet: 20 / 40 at half the turn, tassel,
outfit, crop and scale redrawn per key, far eye violet). Round 2 keeps the LoRA
(identity was right) and changes how each key is painted:

- **Start paint = the plate turned in 2.5D** (`tools/gen/rig-lora-init.py`):
  the v3 frontal layers get depths (face ellipsoid + nose ridge, hair shell,
  fringe), are rotated about x = 473 and z-buffered; the body is pinned; the
  tassel rides her right ear (on top and protected from the repaint when it
  faces the camera). `lora-keys.mjs warp` repaints only the head mask
  (SetLatentNoiseMask, core nodes) at denoise 0.65 to 0.82, OpenPose 0.8 to the
  end, `--aim` 25 / 48 for the 20 / 40 keys.
- **Finish** (`tools/gen/rig-lora-fix.py fix`): the plate's pixels outside the
  mask, each iris recoloured to its side's plate colour, and the **turn
  measured** (eye positions against the head model, plus pupil spacing).
- 7 rounds (pilot, w1 to w6), 159 candidates, all one at a time behind the
  shared ComfyUI queue; no training, ComfyUI never restarted. Picks and the
  per-round lessons are `art/v4/keys.md` section 7.
- **Result**: every key has the plate's body, hood, top, frame and scale to the
  pixel; the tassel is the plate's own pixels from -20 to +85; the measured turn
  is within 5 degrees of the target for 15 of 16 picks (-85 pick 2 reads -74 by
  the eye measure); eyes are green / blue by side. Evidence:
  `sheets/turn-strip.webp`, `sheets/turn-flip.webp`, `sheets/yaw<N>.webp`,
  `sheets/inits.webp`; round 1 kept in `sheets/r1/`, `picks-r1.json`.

| Tool (round 2) | What |
|---|---|
| `tools/gen/rig-lora-init.py build [--fill blur/flat] [--keep-tassel] [--ahead 30]` | start paint + head mask per yaw into `D:/Tools/pyrefly-lora/yuna-x2/init*/` |
| `tools/gen/lora-keys.mjs warp --yaws .. --denoise .. [--aim] [--negExtra] [--init]` | the masked img2img |
| `tools/gen/rig-lora-fix.py fix / measure` | composite, iris recolour by side, turn measurement |

## Open

1. **Judge round 2 not yet run** (this painter does not judge its own keys),
   and no Bailey look.
2. **Hair clip** (left temple, cropped by the plate's edge) is completed by the
   sampler as a larger disc from -20 to -85, differently per key.
3. **Far tassel at -40 / -60** is repainted, its form varies.
4. **Far-side hair** is full in the blur-fill keys (-40, -60) and thin in the
   flat-fill ones (+60, 85).
5. The keys are not yet cut into layers, landmarked or wired into `rig.json`;
   the v3.3 `rig-*.py` chain (cut, turns, heads, lids, margins) is the path.
