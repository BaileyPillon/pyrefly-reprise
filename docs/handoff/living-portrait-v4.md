# Living portrait v4: one Yuna across the turn (2026-09-23)

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
