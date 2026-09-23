# Leblanc identity LoRA (`leblanc-x2`, trigger `leblancX2`): the training set

FFX-2 only (Chapter 6, the Leblanc Syndicate boss art; AGENTS.md hard rule 14:
a per-subject art tool, no shared tool or game file changes). Nothing here is
approved and nothing is installed in `public/art/` by this run.

Built 2026-09-22 by `build-dataset.py` in this folder (run with ComfyUI's
embedded python: `D:/Tools/ComfyUI/python_embeded/python.exe -s build-dataset.py build`).
Output (not committed): `D:/Tools/pyrefly-lora/leblanc/dataset/{idle,portrait}/*.png + .txt`
and `manifest.json` (the same rows as below, plus each output file's sha256).
Trainer: `node tools/gen/lora-leblanc.mjs train` (kohya `sdxl_train_network.py`).

## What counts as on-model (and why the set is almost all idle)

The identity anchor is the installed idle, `public/art/characters/leblanc/idle.png`
(the method check `docs/plans/leblanc-art-method-check.md` §2.1 lists what it
actually wears: a white halter-neck high-cut dress, a crimson obi with a gold
knot and a lavender-and-white tassel, a purple kimono robe slipped off both
shoulders with faint lavender diamonds, bare legs, lavender lace-up open-toe
heeled ankle boots, a black closed folding fan at the mouth, a purple studded
choker, a red heart on the sternum, a platinum-blonde chin bob, purple eyes,
pale skin). Each source the brief named was checked against it:

| Source | sha256 | Used? | Why |
|---|---|---|---|
| `public/art/characters/leblanc/idle.png` (591x1118 cutout) | `4fea45f98bf44e7aa6aebf0004a2f845f268ebf974992bdd559b3b5258c9094b` | **yes, 10 crops** | the anchor; no raw exists (searched `public/art`, `D:/Tools/pyrefly-art-backup/candidates/*leblanc*`, `docs/concepts/chapters/leblanc/**`) |
| `public/art/portraits/leblanc.png` (832x1216) | `f82f2d74bdaf1931b592b859112975cb841c056c518450afa5a0c9a35acb9e37` | **yes, 1 face crop** | one of the close-ups Bailey called "AMAZING"; the face, eyes, skin and painting quality match the idle. It differs in three ways: hair to the shoulder (idle: chin bob), a blue-and-white triangle collar (research §10.1's canon, not the idle's choker) and a wooden stick of a fan. The crop keeps the face and stops above most of the collar, its caption names `medium hair` so the length binds to that word, and it is weighted half of each idle crop (repeats 1 against 2) |
| `public/art/pause/leblanc.png` (1344x768 hero plate) | `d4655b8abe02a5360b6b05d7bf8c574b7f67d5704b4c8696fb9cdd7e33469899` | **no** | wrong costume against the idle (a pink hooded robe, a black beaded collar, a white round fan), warmer tanned skin, a grin with teeth, and a painted scene background that cannot be flattened to white |
| `docs/concepts/chapters/leblanc/renders/leblanc-b.png` (Bailey's picked concept, pose B) | `1818fcce81b2d96cb5d572bee6087d1dbde735f21b436fc9dfaa952ba7318d35` | **no** | Bailey's pick approves the pose and light, and it wears a different costume from the idle (thigh-high boots and stockings, a gold arm band, a pink ombre robe, an open purple round fan); the face is ~60 px, too small to teach anything the idle does not |
| every candidate under `docs/concepts/chapters/leblanc/sets/leblanc/**` (attempts 1, 2, redo 2), `sets/leblanc/round3/**`, `pilot/**`, `pilot2/renders/**` | n/a | **no** | the brief admits only frames an **independent** judge scored 6 or above on identity **and** that wear the idle's costume. None does: round 3's independent judge (`sets/leblanc/round3/judge.md`) scores robe/obi/dress **4** on every installed state, attack, hurt, cast and ko ("a different costume, not one drifted detail"); pilot 2's independent judge (`pilot2/judge.md`) scores every D, E and F frame 4 or less; attempt 1's judge scores outfit 3 on all four; redo 2's 8s on outfit were self-scored and the independent round-3 pass found those frames wear black thigh-highs, a closed ankle-length robe and the wrong fan |

So the set is 11 images, 10 of them views of one painting. That is a known
risk: the LoRA may memorise the idle's pose along with its identity. The step
test renders a pose the set never shows (a lunge) at every saved step to
measure that, and the pick weighs it.

## The images

Every crop is flattened onto white (the cutout's RGB under alpha 0 is rembg
fringe). Crops under half a megapixel are enlarged with RealESRGAN_x4plus on
the CPU (spandrel in ComfyUI's embedded python, never the shared GPU) and
brought back to about 1 MP with Lanczos; full-figure views are pasted on a
white canvas at the idle's own scale or smaller. Box = crop in source pixels
(x0, y0, x1, y1); canvas = (width, height, scale, x, y) of the paste.

Captions are `leblancX2, 1girl, solo, <view>, <pose>` (plus `white background,
simple background`); identity words are never written, so the trigger
carries them. `IDLE_POSE` = `standing, looking at viewer, smile, holding
folding fan, closed fan, fan to mouth, arm up`.

| id | subset (repeats) | source | box / canvas | size | resize | caption tail after the trigger | output sha256 |
|---|---|---|---|---|---|---|---|
| idle-full | idle (2) | idle | canvas 832x1216, 1.0, at 120,50 (the idle's own 832x1216 frame) | 832x1216 | canvas | full body, IDLE_POSE, holding clothes, feet | `83d77db8b05af4680b5c97d501150fc4a8d3a5c74ec3ab040c36948d63bcb323` |
| idle-full-wide | idle (2) | idle | canvas 1024x1024, 0.84, at 260,32 | 1024x1024 | canvas | full body, wide shot, IDLE_POSE, holding clothes | `01323b4425306dbc3e8f167ed6ef949c90bafa4dfd921ab4cc8353c474107324` |
| idle-full-small | idle (2) | idle | canvas 896x1152, 0.86, at 90,110 | 896x1152 | canvas | full body, IDLE_POSE, holding clothes, feet | `d431369c8365465b31fe61b29aa84cd8ea08294e09c855d2ec9c41be1458f511` |
| idle-knees | idle (2) | idle | 0,0,591,880 | 840x1248 | esrgan-x4+lanczos | cowboy shot, IDLE_POSE, holding clothes | `7b7f2246359304fc4e9be606c7ce60842956beca773bee2ac6e2f0ad41c99ce7` |
| idle-thighs | idle (2) | idle | 20,0,591,640 | 968x1088 | esrgan-x4+lanczos | cowboy shot, upper body, IDLE_POSE, holding clothes | `475c0c700028d38ceca291892cc735344473c05047c09b8dacb11b99426dc112` |
| idle-upper | idle (2) | idle | 80,0,560,480 | 1024x1024 | esrgan-x4+lanczos | upper body, IDLE_POSE | `154486173610e33cc5ce9b82f1d29ed2ee00aca9988a30cc97273d3ff950ba7a` |
| idle-bust | idle (2) | idle | 160,0,520,360 | 1024x1024 | esrgan-x4+lanczos | portrait, head and shoulders, IDLE_POSE | `a0b2cb8dad4595533a6d5e3e4df8be30bbe6f4a473b40b28ff4789b9e4b4d124` |
| idle-face | idle (2) | idle | 215,25,475,285 | 1024x1024 | esrgan-x4+lanczos | close-up, face, IDLE_POSE | `6cb78bc5d0ce8f56631bbfb2d9fea5009872910e82926657213d3c673b16c01e` |
| idle-torso | idle (2) | idle | 150,170,500,560 | 968x1080 | esrgan-x4+lanczos | close-up, upper body, head out of frame, arm up | `09e5b45415178dff81f89fce7332cb6af2570453ecc418e2f7a387d725ab2125` |
| idle-legs | idle (2) | idle | 150,540,560,1118 | 864x1216 | esrgan-x4+lanczos | lower body, head out of frame, standing, legs, feet | `6c90bfa6fe59598ead62aa3bbfa466a04fc2dafbcafd463b0e2ee056197c857d` |
| portrait-face | portrait (1) | portrait | 120,0,832,712 | 1024x1024 | esrgan-x4+lanczos | portrait, close-up, face, looking at viewer, smile, medium hair, hand up, holding (white background only) | `ccb6cecfa2930245b24401cc92681606ce63748826d673a52a15cdff413e5f06` |

21 samples an epoch (10 x 2 + 1).

## Hard rule 6 (open, not decided here)

`research/ffx2-leblanc-syndicate.md` §10.1 gives Leblanc thigh-high
stockings, a red-and-silver fan and a blue-and-white triangle pattern; the
idle has bare legs, a black fan and a purple robe with lavender diamonds.
This LoRA learns the idle, as the brief's anchor rule says. Whether the idle
should move toward the research is Bailey's call (the same open question as
`sets/leblanc/round3/judge.md` option (d)).

## Training (2026-09-23)

`node tools/gen/lora-leblanc.mjs train --steps 2000 --dim 32 --alpha 16`:
kohya `sdxl_train_network.py` on `animagine-xl-4.0-opt.safetensors`, LoRA
(networks.lora) dim 32 / alpha 16, U-Net only with cached text-encoder
outputs, AdamW8bit, lr 1e-4 cosine with 100 warm-up steps, 2000 steps at
batch 1, resolution 1024 with bucketing (buckets 832x1216, 896x1152,
960x1088, 1024x1024), bf16 mixed precision, fp16 saves, cached latents,
gradient checkpointing, SDPA, min-SNR gamma 5, seed 4545 (the yuna-x2 run's
settings, `tools/gen/lora-train.mjs`). GPU RULE and the shared lock
(`D:/Tools/pyrefly-lora/GPU-LOCK.md`) were obeyed: the gate waited from
03:50 to 05:36 UTC behind the yuna-x2 key renders and the ormi-x2 training,
and took the lock only after the queue was empty and the card under 4 GB for
3 minutes. **Wall time 30.5 min (1830 s, 1.1 it/s), peak VRAM 10.9 GB for
the whole card**, exit 0, final average loss about 0.02. Checkpoints every
500 steps in `D:/Tools/pyrefly-lora/leblanc/out/` (not committed):

| step | sha256 |
|---|---|
| 500 | `85f60262ea649400d4a3938bcea39b823ed25d47cd862d4d4dd89bdca883e8ba` |
| 1000 | `b3ff3ede4988e0477339e02f62ceb943ceb349b7672e182553188bd44e58d70f` |
| **1500 (picked)** | `9639a5828162173f4ed986020a48ae5f26833e50715c1b0e024883c0dce2e5d5` |
| 2000 | `4a65a99534ec30ef1a044b471fc94b0cc310ffab899eddfff3183b2ce5ee24f0` |

## The pick: step 1500

Step test (`node tools/gen/lora-leblanc.mjs steptest --pose idle|attack`):
832x1216, 28 steps, cfg 6, euler_ancestral / normal, LoraLoader at 0.8
(model and clip), IP-Adapter plus (ViT-H) at 0.3, ease in, 0.2 to 0.6, K+V,
reference = the installed idle square-padded on white
(`pilot2/refs/idle-square.png`), seeds 9600 and 9601, `SPRITE_NEGATIVE`.
Prompt = the trigger plus the dataset's idle caption (idle), or a lunge the
dataset never shows (attack). A no-LoRA row is the baseline: without the LoRA
the trigger means nothing (lilac-haired strangers, one mecha).

`pick-sheet.jpg`: one row per LoRA (none, 500, 1000, 1500, 2000); the
installed idle first, then idle x2 and attack x2, then the head of each at the
same enlargement. `pick-crops.jpg`: idle seed 9600 at native pixels against
the installed idle on its own 832x1216 frame, head (top) and obi / dress /
robe (bottom), columns idle, 500, 1000, 1500, 2000.

| step | idle pose vs the installed idle (1:1) | unseen attack pose | verdict |
|---|---|---|---|
| 500 | hair, face, choker, heart, obi with gold knot and tassel, white dress, robe off the shoulders, open-toe boots: all there | **identity breaks**: seed 9600 grows long lilac hair; seed 9601 lilac hair and a rainbow streamer | undertrained |
| 1000 | as 500, closer | the costume holds on both seeds and 9600 is the most dynamic pose of any step, but **9601's hair goes ash / white** (round 3's hair drift) | close second |
| **1500** | near the idle at 1:1 (warm platinum bob, both eyes, purple eyes, studded choker, flat red heart, crimson obi with the gold knot and lavender tassel, white halter dress, lavender open-toe lace-up boots) | **both seeds keep all of that, with warm blonde hair**; 9601 is a real strike (lunge, fan arm leading, serious brow, one fan); 9600 lunges but keeps the closed fan at the mouth as well as an open fan | **picked** |
| 2000 | a copy of the idle | same identity as 1500, but 9601's streamer gets pink and orange patchwork and 9600's pose slides back toward the idle's robe-holding stance | memorising |

Every step above 1000 gets the costume right in a pose it never saw, which is
what five prompt-only passes could not do (round 3: robe 4 on every state).
What the LoRA does **not** fix, for whoever renders the poses next:

- **Memorised props.** From 1000 up, the closed fan at the mouth tends to
  come back even when the prompt asks for a lunge (attack 9600 at 1500 holds
  two fans). The pose should come from ControlNet OpenPose (approved
  2026-09-22, "5. Yes"), and `fan to mouth, closed fan` belongs in the
  negative for every state but idle.
- **The open fan's colour is unsourced by the idle.** The idle's fan is always
  closed and black; opened, the LoRA paints black ribs with a lavender leaf.
  Research §10.1 says red and silver. Hard rule 6: Bailey's call.
- **Background.** Idle seed 9601 came out on a flat mint or grey-green field at
  1000 to 2000 (a framed card at 500 and 1000). Keep `white background` in the
  prompt and cut out as usual.

Installed for ComfyUI as `D:/Tools/ComfyUI/ComfyUI/models/loras/leblanc-x2.safetensors`
(sha256 `9639a582...e5d5`, the step-1500 file); the four step files are also in
`models/loras/pyrefly-lora-steps/`. Nothing in `public/art/` changed and
nothing is approved: `docs/target/approved-hashes.json`'s 115 files hash the
same before and after this run.
