# Living portrait v4: one Yuna across the turn (2026-09-23)

## Rig assembly (latest; read this first)

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
