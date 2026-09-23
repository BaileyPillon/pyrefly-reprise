# Living portrait v4: one Yuna across the turn (2026-09-23)

Game case: **FFX-2 only** (the Yuna X-2 plate). The tools are generic, the LoRA
and the keys are this Yuna's.

## Why

v3.3 (`docs/handoff/living-portrait-v3.md`, `shots/v3.3/CHECK.md`) fixed the
renderer, but its turned keys were different paintings from the plate (brown
hair without the orange/pink tips, a small earring for the tassel, a red braid,
another line), so a turn read as a change of picture. v4 trains the plate's
identity into a LoRA and paints every key with it.

## Done (keys track)

- **Identity LoRA** `yuna-x2` (kohya, Animagine XL 4.0 Opt, rank 32, U-Net only,
  2000 steps): 30.5 min wall, about 8.1 GB VRAM (10.1 GB peak on the shared
  card). Step 2000 picked at 1:1 against the plate; installed as
  `D:/Tools/ComfyUI/ComfyUI/models/loras/yuna-x2.safetensors`. Weights and data
  stay under `D:/Tools/pyrefly-lora/yuna-x2/` (not committed).
- **Keys** for yaw -85, -60, -40, -20, +20, +40, +60, +85: 12 candidates per
  yaw (two rounds of 6), two picks each, as lossless webp with sidecars in
  `docs/concepts/pause-until-dawn/prototype-v2/art/v4/keys/picked/`.
  Every pick has the plate's hair, tassel, eyes and line.
- Evidence: `art/v4/keys/sheets/turn-strip.webp` first, then `yaw<N>.webp`,
  `steptest.webp`; the whole write-up is `art/v4/keys.md`.

## Tools

| Tool | What |
|---|---|
| `tools/gen/rig-lora-data.py build` | the 17-image dataset (sources hashed, never written; ESRGAN on the CPU) |
| `tools/gen/lora-train.mjs gate / train` | the GPU gate (ComfyUI queue empty and < 4 GB for 3 min) and the kohya run with VRAM logging |
| `tools/gen/rig-lora-pose.py draw` | head-and-shoulders OpenPose skeletons per yaw from the plate's landmarks |
| `tools/gen/lora-keys.mjs test / render` | LoRA + plate IP-Adapter (R2) + OpenPose ControlNet, one prompt at a time behind the shared queue |
| `tools/gen/rig-lora-sheet.py steps / yaw / picks` | contact sheets (plate first, candidates whole and 1:1) and the pick copy + turn strip |

## Open

1. **Turn amount at 20 and 40** comes out about half the target (the LoRA
   pulls toward the frontal plate). 60 and 85 land close.
2. **Tassel ear**: about half the candidates put the tassel on the wrong ear or
   on both; a key painted to order needs an ear inpaint.
3. **Left profile eye colour**: -85 pick 2 has a green near eye (should be
   blue); the v3 iris recolour applies.
4. The keys are not yet cut into layers, landmarked or wired into `rig.json`;
   the v3.3 `rig-*.py` chain (cut, turns, heads, lids, margins) is the path.
5. No independent judge and no Bailey look yet.
