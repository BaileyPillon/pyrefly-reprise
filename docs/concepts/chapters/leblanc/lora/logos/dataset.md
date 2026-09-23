# Logos identity LoRA (`logos-x2`): dataset, training, step pick (2026-09-22 to 23)

FFX-2 only (Chapter 6, Chateau Leblanc art; Logos exists only in FFX-2; no shared
tool, game file or FFX chapter changed, AGENTS.md hard rule 14). Tooling for this
subject lives here: `build-dataset.py`, `train.mjs`, `idle-pose.py`, `pick.mjs`.
The living-portrait run's `tools/gen/lora-train.mjs` / `rig-lora-data.py` (yuna-x2,
uncommitted, not ours) were read and their kohya settings and CPU ESRGAN step reused;
they were not edited.

**Nothing here is approved.** No entry was added to `docs/target/approved-hashes.json`;
its 115 files hash the same before and after this run
(`D:/Tools/pyrefly-lora/tools/verify-approved.mjs`). The LoRA is a tool for painting
CANDIDATES.

## Which paintings qualify

The brief: every on-model painting of Logos, only frames the judges scored 6 or above
on identity, never a frame with the wrong costume. The identity anchor is the installed
idle (`sets/logos/round3/judge.md`: "What idle shows at 1:1, the target for the other
four states").

| Source | sha256 | Used | Why |
|---|---|---|---|
| `public/art/characters/logos/idle.png` (604 x 1160, round-3 idle after the 2026-09-22 skin cleanup) | `64a43dc9a250ab231c443b57542b8071ee35c939775221c0db83e8e61f6d925f` | **yes, all 16 images** | The anchor. Judge: hair 8, face 7, helmet 6, outfit 7, marks 6; its skin 5 was the tan far hand and shins, recoloured by the cleanup, so the cleaned file is used. |
| `sets/logos/round3/renders/idle.94103cr911.raw.png` (the idle's raw) | `85e7c9789c262e4c368c43d22916fa94d1147b003b628f4b6cf4b53725a2f38f` | no | Same painting before the skin cleanup: it would teach the tan far hand and shins the judge failed. The installed cutout flattened on white is the same pixels with the fix. |
| `public/art/portraits/logos.png` | `b10142876dcd3eeacc168b615fdf674e6d68372c69b4182dd3d461f2f7f79bd8` | no | Wrong costume against the idle: a winged helmet with a grille visor and gold shoulder medallions (idle: smooth ribbed dome with a short visor, white radial disc). round3.md already flags it as painted from the old words and owed a check. |
| `public/art/pause/leblanc.png` | `d4655b8abe02a5360b6b05d7bf8c574b7f67d5704b4c8696fb9cdd7e33469899` | no | Leblanc alone; Logos is not in the plate. |
| `renders/logos-c.png` (Bailey's picked concept) | `9761f18590275371f2b3df3e34ca2132094a5ce705cecfa266bd7d63ef8db0d8` | no | Bailey asked for it re-rendered without the plume and crest; even with them painted out (`sets/logos/round3/refs/concept-square.png`) it wears a silver beaded pauldron, black leggings instead of the hakama, yellow ankle wraps and a grille visor: the costume the idle replaced. Training on it would teach the pauldron the judges keep failing. |
| `renders/logos-a.png`, `logos-b.png` (unpicked concepts) | `da71a642...`, `d8f2f3cf...` | no | Plume, crest and pauldron; not picked. |
| round-3 attack `94202` (installed `attack.png`) | `d55ff0b2...` | no | Judge: helmet 5, marks 4 (a black claw-edged shoulder guard where the emblem is, an invented charm chain, light-grey hakama). |
| round-3 cast `94302` (installed `cast.png`) | `92fa6d76...` | no | Judge: helmet 4 (a different, slotted helmet), closed shoes, a grey spiral emblem. |
| round-3 hurt `94402` (installed `hurt.png`) | `7d61c3e0...` | no | Judge: face 5, marks 4 (gold emblem moved to the chest, purple strap, a chin spike). |
| round-3 ko `94505c` (installed `ko.png`) | `abf39146...` | no | Judge: helmet 5 (a cage with a grille), weapon 3 (double barrel), brown strap, reversed wraps. |
| round-3 unpicked renders, repaint variants `r902/r903/cr912/cr913`, pilot2, pilot | | no | Never scored by a judge (rejected by the painter for one gun, a pauldron, a streamer or a helmet fin), or not Logos (pilot 2 is Leblanc). `cr912/cr913` are the installed idle with a different helmet box: no new information. |

So every training image is a crop or a mirror of **one painting**. That is the honest
limit of what is on-model today: the LoRA can only learn this idle's look, and it will
pull toward this pose and this profile view. The OpenPose skeleton has to carry every
other pose. Mirrors are allowed because round 3 established Logos is not chiral (an
emblem on each shoulder, a revolver in each hand); a mirror does swap the kimono's
overlap, a small cost.

## Images (D:/Tools/pyrefly-lora/logos/dataset/img, not committed)

Built by `D:/Tools/ComfyUI/python_embeded/python.exe -s build-dataset.py build`.
Flattened on white, padded white where the box leaves the canvas; crops under 0.35 MP
enlarged with RealESRGAN_x4plus on the CPU, then Lanczos to about 1 MP (sides multiples
of 64). Captions: `logosX2, 1boy, solo, <view>, <pose>, facing left|right, simple
background, white background` (view, framing and pose only: no hair, helmet, robe,
colour or weapon words, so the LoRA owns the identity). One subset, 1 repeat.

| id | box on the idle | mirror | size | resize | output sha256 (16) | caption after `logosX2, 1boy, solo,` |
|---|---|---|---|---|---|---|
| full | -60,-40,664,1200 | no | 768x1344 | lanczos | 2cb5a338c13c825b | full body, from side, profile, standing, legs apart, arms down, holding gun, dual wielding, gun pointed down, facing left, simple background, white background |
| full-m | same | yes | 768x1344 | lanczos | 4c364c877bc30015 | ... facing right ... |
| full-wide | -420,-120,1024,1280 | no | 1024x1024 | lanczos | f6d5f85b0b2a9448 | full body, from side, profile, wide shot, standing, legs apart, arms down, holding gun, dual wielding, gun pointed down, facing left, ... |
| full-wide-m | same | yes | 1024x1024 | lanczos | dbced9d4c338eb32 | ... facing right ... |
| cowboy | 0,0,604,860 | no | 832x1216 | lanczos | b361e2a156cef703 | cowboy shot, from side, profile, standing, legs apart, arms down, holding gun, dual wielding, gun pointed down, facing left, ... |
| cowboy-m | same | yes | 832x1216 | lanczos | 2ac8857baaa1a0d6 | ... facing right ... |
| upper | 60,-10,560,580 | no | 960x1088 | esrgan-x4+lanczos | f115b75a4df15997 | upper body, from side, profile, arms down, holding gun, looking down, facing left, ... |
| upper-m | same | yes | 960x1088 | esrgan-x4+lanczos | a0996e33b879a37b | ... facing right ... |
| headshoulders | 130,-10,490,350 | no | 1024x1024 | esrgan-x4+lanczos | 9374be070ef987ee | portrait, head and shoulders, from side, profile, looking down, closed mouth, facing left, ... |
| headshoulders-m | same | yes | 1024x1024 | esrgan-x4+lanczos | f7e61a3457b85637 | ... facing right ... |
| face | 180,0,400,220 | no | 1024x1024 | esrgan-x4+lanczos | 9d25b704c2e23eeb | close-up, face, from side, profile, looking down, closed mouth, facing left, ... |
| face-m | same | yes | 1024x1024 | esrgan-x4+lanczos | 0840aeb57df0787e | ... facing right ... |
| chest | 170,150,490,470 | no | 1024x1024 | esrgan-x4+lanczos | 216864366fc4bb26 | upper body, chest, shoulder, head out of frame, from side, facing left, ... |
| chest-m | same | yes | 1024x1024 | esrgan-x4+lanczos | dbb9bf9da2a9ee5a | ... facing right ... |
| legs | 100,690,580,1160 | no | 1024x1024 | esrgan-x4+lanczos | 68bae014ad6002fb | lower body, legs, feet, sandals, head out of frame, from side, standing, facing left, ... |
| legs-m | same | yes | 1024x1024 | esrgan-x4+lanczos | 56caec1f68996353 | ... facing right ... |

Full hashes and exact captions: `D:/Tools/pyrefly-lora/logos/dataset/manifest.json`.

## Training

`node train.mjs train --steps 2000 --dim 16 --alpha 8` (kohya sd-scripts
`sdxl_train_network.py`, venv `D:/Tools/sd-scripts/.venv`, torch cu130 on the RTX 5070 Ti)
on `animagine-xl-4.0-opt.safetensors`: LoRA (`networks.lora`) dim 16 / alpha 8 (the small
end of the brief's 16 to 32, because the set is one painting), U-Net only with cached
text-encoder outputs, AdamW8bit, lr 1e-4 cosine with 100 warm-up steps, min-SNR 5,
resolution 1024 with bucketing (512 to 2048, step 64), batch 1, bf16 mixed precision,
fp16 save, gradient checkpointing, SDPA, cached latents, seed 4343; 16 images x 1 repeat
= 16 steps an epoch, 125 epochs, **2000 steps**, saved every 500 to
`D:/Tools/pyrefly-lora/logos/out/`.

- **GPU rule.** The gate waited from 03:46 to 06:20 UTC (about 2.5 h) behind the yuna-x2
  keys, the ormi-x2 and leblanc-x2 trainings and their renders: ComfyUI `/queue` empty
  and nvidia-smi under 4 GB for 3 consecutive minutes, no other `train_network` python
  process, and the shared `D:/Tools/pyrefly-lora/gpu-train.lock` (the ormi run's
  convention, `GPU-LOCK.md`) taken by exclusive create. ComfyUI was never restarted; its
  own `/free` was asked once when the queue was empty and 10 GB of cached models sat on
  the card (1.7 GB after).
- **Wall time** 44.6 min (06:20:51 to 07:05:27 UTC), 1.3 s/it: other agents' ComfyUI
  renders shared the card during the run (yuna-x2 alone ran at 0.9 s/it).
- **VRAM** (whole card, nvidia-smi every 5 s, `out/vram.csv`): 1.7 GB before the start,
  8.7 to 10.3 GB in the first minutes with kohya alone (so kohya itself about 7 to 8.5 GB),
  median 13.5 GB and peak 15.4 GB once other renders joined. No OOM, exit 0.
- Final loss (moving average) about 0.035.

## Step pick (`pick.mjs`, `idle-pose.py`, `pick-sheet.py`)

Every saved step rendered the installed idle's pose through ComfyUI: Animagine XL 4.0
Opt, LoraLoader 0.8 (model and clip), IP-Adapter plus (ViT-H) with the installed idle
flattened on white at 0.3 (ease in, 0.2 to 0.6, K+V), xinsir OpenPose SDXL at 0.5 (0 to
0.8) on `idle-pose.png` (the idle's COCO-18 skeleton read by eye, `idle-pose-overlay.jpg`),
28 steps, cfg 6, euler_ancestral / normal, 832 x 1216, seeds 9400 to 9402. Prompt: the
trigger, view and pose only (`logosX2, 1boy, solo, full body, from side, profile,
standing, legs apart, arms down, holding gun, dual wielding, gun pointed down, facing
left, simple background, white background` + STYLE_TAGS + QUALITY_TAGS); negative
SPRITE_NEGATIVE + FACING_NEGATIVE. The control row renders the same graph without the
LoRA. 9 to 14 s a render, one at a time behind the shared queue.

`pick-sheet.jpg`: per row the anchor or a step, three seeds whole, then native 1:1 crops
of the head/helmet and of the shoulder emblem and strap; a last strip is a pose-flex test
(prompt only, no OpenPose: aiming, outstretched arms, leaning forward) at 1000, 1500 and
2000, to check the LoRA still bends although it saw one pose.

What the 1:1 crops show, against the idle:

| Row | Helmet | Emblem / strap | Robe, sash, hakama, wraps | Revolvers | Other |
|---|---|---|---|---|---|
| none (control) | none: a different person every seed (rainbow hair, feathers, bodysuit) | none | none | pistols | the trigger means nothing without the LoRA; all identity comes from it |
| 500 | silver dome, darker and glossier, one seed with a black visor band | white disc on 2 of 3, ring on the strap | robe and sash right; wraps go blue or black on 2 of 3 | two, blued + silver | faint tinted backgrounds begin |
| 1000 | idle's ribbed dome; seed 1 grows a pointed back ridge | white radial disc, black strap, brass ring: all 3 | right; seed 1 back wrap blue, seed 3 wraps dark | two | tinted backgrounds |
| 1500 | idle's ribbed dome with the short visor, all 3 | as idle, all 3 | right; seed 3 wraps lavender | two | tinted backgrounds |
| **2000** | **idle's dome, ribbing and visor, all 3; closest surface** | **as idle, all 3** | **robe fade, purple sash, slate hakama, grey-white wraps with black bands, black slide sandals on seeds 1 and 2; seed 3 wraps darker** | **two: blued in the far hand, silver in the near hand, as idle** | grey-blue flat backgrounds (see below) |

Pose flex: all three steps paint a lunge with both revolvers forward and keep the helmet,
emblem, strap, sash and wraps; 1500 seed 1 and 2000 seed 1 open the robe on a bare shin
with no hakama (a pose-level defect the idle never showed, for the pose run to judge).
Backgrounds stay white in the flex renders.

**Pick: step 2000** (`logos-x2-step00002000.safetensors`, sha256
`2252538fe454340915711c9cf019cfe2a5252f7ecff316507a72811637b5a8d9`), copied to
`D:/Tools/ComfyUI/ComfyUI/models/loras/logos-x2.safetensors` (same hash). It is the only
step whose idle renders match the anchor on helmet surface, emblem, strap, hakama, wraps
and both revolvers in 2 of 3 seeds at 1:1, and the flex strip shows it still bends. (The
`out/logos-x2.safetensors` that kohya writes at the end is the same 2000 steps with
different metadata, sha256 `56a91271...`; the step file is the one rendered and picked.)
Steps 500 to 1500 are kept in `D:/Tools/pyrefly-lora/logos/out/` and in ComfyUI under
`models/loras/pyrefly-lora-steps/logos-x2-step{500,1000,1500,2000}.safetensors`.

### Known limits of this LoRA (for the pose run and the judge)

- **One painting.** It learned one idle in one side-on view. A front or back view, a
  close-up face, or anything the idle hides (the purple helmet tie strip, the chin
  protector research 10.1 names) is not in it and will be invented. Hard rule 6: the
  Syndicate logo's shape is still unsourced; the LoRA reproduces the idle's white radial
  disc because that is what the idle shows, not because a source says so.
- **Tinted backgrounds** with the idle skeleton at 1000 steps and above (flat grey-blue
  instead of white). Cutouts (rembg) handle a flat field, but a tint can leak into rim
  light; the pose run should check, and may weight `white background` or lower the LoRA
  to 0.7.
- **Mirrors** swap the kimono overlap in half the training images.
- ESRGAN-enlarged close crops smooth the line a little (the living-portrait run saw the
  same and weighted its busts least).
- These renders are step-pick evidence only: nothing was installed in
  `public/art/characters/logos/`, and nothing is approved.

Backup: dataset, pick renders, the picked step, `run.json` and `dataset.toml` in
`D:/Tools/pyrefly-art-backup/candidates/2026-09-23-leblanc-lora/logos/`.
