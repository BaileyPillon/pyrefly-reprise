# Ormi identity LoRA (`ormiX2`): the dataset

FFX-2 only (Chapter 6, Chateau Leblanc art; AGENTS.md hard rule 14: per-subject
art tooling, no game file and no shared tool changed). Nothing here is approved:
`docs/target/approved-hashes.json` is untouched.

Built by `docs/concepts/chapters/leblanc/lora/ormi/dataset.py` (`crops`, then
`node tools/gen/lora-ormi.mjs upscale`, then `finish`). The images live outside
the repo in `D:/Tools/pyrefly-lora/ormi/dataset/` (14 PNG + 14 captions +
`manifest.json`); trained by `node tools/gen/lora-ormi.mjs train`.

## Sources: what went in and what stayed out

The brief: every on-model painting of Ormi, only frames a judge scored 6 or
above on identity, never a frame with the wrong costume. Anchor: the installed
idle. Every candidate was looked at against the idle before this list was made.

| Source | sha256 | In? | Why |
|---|---|---|---|
| `public/art/characters/ormi/idle.png` (489x1189 cutout; no raw frame kept) | `f7fcdfc358c25fa8172028a9ddce9139d0c7e7623ce17239381b89cc6f0ba701` | **yes, the only source** | the identity anchor: bald, maroon topknot with a red tie and a striped tassel, green eyes, scowl, pale cheek mark and forehead scar, crimson sleeves over a purple kimono, gold collar, yellow sash, teal pelvic curtain with its jewelled ornament, long purple hakama with the gold diamond hem, sandals, the red-rimmed gold-studded sunburst shield on his back |
| `public/art/portraits/ormi.png` | `fd29a3439913004356509a53d36ebd03756c9929820334384d5320936fdb2187` | no | wrong head: a gold-and-red headdress with dangling bells, purple eyebrows and red eye paint, a white fur collar. The round-3 judge scores invented face paint against Ormi ("no invented paint") |
| `public/art/pause/leblanc.png` | `d4655b8abe02a5360b6b05d7bf8c574b7f67d5704b4c8696fb9cdd7e33469899` | no | Ormi is not in it: the plate is Leblanc alone (`production.md`: "could not get the two henchmen into the shot") |
| `docs/concepts/chapters/leblanc/renders/ormi-a.png` (Bailey's pick) | `76d1e9a32b7a84fe7de01c83baf76627b7a1600921a4967811cd1401108edc9d` | no | picked as the base body to be re-rendered **heavier** (targets.json: "not shipped as-is"); its costume is not the idle's: slim athletic build, white fur collar, short purple sleeves, dark hakama, brown shoes, red forehead mark. Training on it would pull the build back to slim |
| `renders/ormi-b.png`, `renders/ormi-c.png` | `41f2dd64...`, `16961dcb...` | no | off-model (brown hair; green hair), not picked |
| `sets/ormi/round3/renders/*` (attack 940001 + heart, cast 940105, hurt 940204, ko 940302 + heart and every other seed) | per sidecar | no | the round-3 judge (`sets/ormi/round3/judge.md`) scores costume 5 or below on every state (sheer lilac hakama and a belly heart-bow; a rainbow collar scarf; orange-brown sleeves; no teal curtain anywhere) and head 4 to 6 (dark brown, magenta, lavender or beige topknots). Wrong costume and wrong topknot, so none qualifies |
| `sets/ormi/candidates/*` (rounds 1 and 2) | | no | judged 1 to 5 (`sets/ormi/judge.md`: face paint, kite shields, two shields) |
| `leblanc/pilot2/*` | | no | Leblanc only |

So the set is **one painting at seven framings, each also mirrored** (the
round-3 judge: "Ormi has no one-sided feature that mirroring would break").
14 images, inside the brief's 10 to 24. The crops that need more than 1.5x
were upscaled with RealESRGAN x4plus (already installed in ComfyUI, core
`ImageUpscaleWithModel` node) and then brought down to about 1 MP with
Lanczos, so no crop is a soft Lanczos blow-up. Background: flattened on white.

Captions are `ormiX2, 1boy, solo, <framing>, <view>, <pose>, body facing
left|right, white background, simple background`: view and pose only, no
costume words, so the costume, face, topknot and shield bind to the trigger.
The pose tags (`standing, arms crossed`) are written so they bind to the
pose words rather than to the trigger.

Risk this set carries, stated up front: a single source teaches one pose. The
step pick (`pick-sheet.jpg`) checks identity at the idle pose as the brief
asks; whether the LoRA lets go of `arms crossed` under an OpenPose control is
for the pose renders that use it.

## The 14 training images

| File | Box on idle (x0,y0,x1,y1) | Mirrored | Size | Resize | sha256 | Caption |
|---|---|---|---|---|---|---|
| `full-right.png` | whole cutout | no | 832x1216 | lanczos x1.000 on a white 832x1216 canvas | `c2a320f7d6d2d9ed1ca3a2c9cd93c474e1cbd1146c5be5961c2fef1ecfcd7141` | ormiX2, 1boy, solo, full body, from side, three-quarter view, standing, arms crossed, looking to the side, body facing right, white background, simple background |
| `full-left.png` | whole cutout | yes | 832x1216 | lanczos x1.000 on a white 832x1216 canvas | `daacc945d5e953264cd74522a9c332549a95528f24f796a9daeb6bb0d565a6e3` | ormiX2, 1boy, solo, full body, from side, three-quarter view, standing, arms crossed, looking to the side, body facing left, white background, simple background |
| `full-small-right.png` | whole cutout | no | 1024x1024 | lanczos x0.720 on a white 1024x1024 canvas | `fa2567e0773953781aa29c705c7f028a33f63f46ea23d058c2ab5c6e878b5b61` | ormiX2, 1boy, solo, full body, from side, three-quarter view, standing, arms crossed, looking to the side, wide shot, body facing right, white background, simple background |
| `full-small-left.png` | whole cutout | yes | 1024x1024 | lanczos x0.720 on a white 1024x1024 canvas | `64cf09dfc46bec3e4401e7f7fc9a965352e3d165c5e69c58b377fa31a4bba2da` | ormiX2, 1boy, solo, full body, from side, three-quarter view, standing, arms crossed, looking to the side, wide shot, body facing left, white background, simple background |
| `cowboy-right.png` | 0,0,489,800 | no | 800x1312 | RealESRGAN_x4plus (ComfyUI) then lanczos to 800x1312 | `65783ec10ccefa4d86f50e00b5e435c82ff066a9ec8c69dd0b5a614eecb13b0e` | ormiX2, 1boy, solo, cowboy shot, from side, three-quarter view, standing, arms crossed, looking to the side, body facing right, white background, simple background |
| `cowboy-left.png` | 0,0,489,800 | yes | 800x1312 | RealESRGAN_x4plus (ComfyUI) then lanczos to 800x1312 | `517f5f3ac04bb8b0f1742ed607118463bbe0e82d59f8ccfbb273f1cbec55e5c9` | ormiX2, 1boy, solo, cowboy shot, from side, three-quarter view, standing, arms crossed, looking to the side, body facing left, white background, simple background |
| `upper-right.png` | 0,0,489,540 | no | 976x1080 | RealESRGAN_x4plus (ComfyUI) then lanczos to 976x1080 | `8b1a79ebaa7e26dde6362f53950465e4d535e19a729ac19b9187553e9eaab74d` | ormiX2, 1boy, solo, upper body, from side, three-quarter view, arms crossed, looking to the side, body facing right, white background, simple background |
| `upper-left.png` | 0,0,489,540 | yes | 976x1080 | RealESRGAN_x4plus (ComfyUI) then lanczos to 976x1080 | `78951d6962c2986924f6a131c480cbd0d162a83aacb9f7ecbf2b6a611d7b4ad6` | ormiX2, 1boy, solo, upper body, from side, three-quarter view, arms crossed, looking to the side, body facing left, white background, simple background |
| `bust-right.png` | 120,0,480,360 | no | 1024x1024 | RealESRGAN_x4plus (ComfyUI) then lanczos to 1024x1024 | `6eb84aabbf502e902c86f32cc65ae2278a951fd63e842e93bae538e3208863a0` | ormiX2, 1boy, solo, portrait, head and shoulders, from side, three-quarter view, arms crossed, looking to the side, body facing right, white background, simple background |
| `bust-left.png` | 120,0,480,360 | yes | 1024x1024 | RealESRGAN_x4plus (ComfyUI) then lanczos to 1024x1024 | `aa034e3719182c69b7271c8a125c475e52b8af21f377c331fb17506303c73d6f` | ormiX2, 1boy, solo, portrait, head and shoulders, from side, three-quarter view, arms crossed, looking to the side, body facing left, white background, simple background |
| `face-right.png` | 170,0,430,260 | no | 1024x1024 | RealESRGAN_x4plus (ComfyUI) then lanczos to 1024x1024 | `3cb574587e5c2b4ca084f115dee30fd24a7644b522717e26c7afb9b45207033d` | ormiX2, 1boy, solo, close-up, face, from side, three-quarter view, looking to the side, body facing right, white background, simple background |
| `face-left.png` | 170,0,430,260 | yes | 1024x1024 | RealESRGAN_x4plus (ComfyUI) then lanczos to 1024x1024 | `1018f3ddf3f025526f5a8b22441175401904ae3c1a222a67bbe249ceb96868ac` | ormiX2, 1boy, solo, close-up, face, from side, three-quarter view, looking to the side, body facing left, white background, simple background |
| `lower-right.png` | 0,480,489,1189 | no | 848x1232 | RealESRGAN_x4plus (ComfyUI) then lanczos to 848x1232 | `4ed848a6ef6cdf24d2f97c396dab21ac06b8ea473a1747d72ba1fd1ce3e09391` | ormiX2, 1boy, solo, lower body, from side, standing, body facing right, white background, simple background |
| `lower-left.png` | 0,480,489,1189 | yes | 848x1232 | RealESRGAN_x4plus (ComfyUI) then lanczos to 848x1232 | `59001e5cb9635e2661605942f229e38078c7f58ae2b6aece1c070e47d2a98a2d` | ormiX2, 1boy, solo, lower body, from side, standing, body facing left, white background, simple background |

## Training (2026-09-23)

`node tools/gen/lora-ormi.mjs train --steps 2000 --dim 16 --alpha 8`: kohya
`sdxl_train_network.py` on `animagine-xl-4.0-opt.safetensors`, LoRA dim 16 /
alpha 8, UNet only (text-encoder outputs cached), AdamW8bit, lr 1e-4 cosine
with 100 warm-up steps, batch 1, resolution 1024 with bucketing (512 to 2048,
step 64), bf16 mixed precision, fp16 save, latents cached to disk, SDPA,
gradient checkpointing, min-SNR 5, seed 4343. 14 images x 1 repeat = 143
epochs. Saved every 500 steps to `D:/Tools/pyrefly-lora/ormi/out/`.

- Gate: waited 23:46 to 00:21 EDT (03:46 to 04:21 UTC) behind the shared
  queue; passed at 2,964 MB for 3 minutes, no other trainer, lock taken.
- Wall time **61.6 min** for 2,000 steps (1.08 s/step alone; 1.6 to 1.8 s/step
  once another run's ComfyUI renders shared the card from about step 1,000).
- VRAM: about 9.4 GB for the training alone at start-up; whole-card peak
  15,502 MB while the other run's renders overlapped (`out/vram.csv`).
- Final average loss 0.037.

| Step | sha256 |
|---|---|
| 500 | `6d9bb0e40c0c409c1c1f654bc854984b67352fda490e6d77be943cad46fbdf4a` |
| 1000 | `473e29e84cb412d3d952e178c26ac91da8c8866064f35191369d593cc5d5cbaf` |
| **1500 (picked)** | `a291d13f7cdb39cdb5d1f9a2da512891b9c360eea50ff60b5028ac2462fbff7f` |
| 2000 | `b0f5e685ba0485937808ed99bb55f583a3ab3e78fa62e9f1ba3ba986de04f1de` |

## The pick: step 1500 (`ormi-x2.safetensors`)

`node tools/gen/lora-ormi.mjs steptest`: the idle pose (`ormiX2, 1boy, solo,
full body, from side, three-quarter view, standing, arms crossed, looking to
the side, body facing right`), LoraLoader 0.8, the idle square-padded on white
as the IP-Adapter reference at 0.3 (ease in, 0.2 to 0.6, K+V), 28 steps, cfg 6,
euler_ancestral / normal, 832x1216, seeds 9300 and 9301, one prompt at a time
behind the shared queue. Sheet: `pick-sheet.jpg` (built by `pick-sheet.py`):
block 1 the step test (no LoRA, 500, 1000, 1500, 2000) beside the installed
idle, block 2 the white-background check, block 3 a pose check. Under each
figure: the head and the costume crops. Heads compared at native pixels.

| Step | Head (topknot, tie, tassel, cheek mark, scar, eyes) | Costume | Shield | Style | Verdict |
|---|---|---|---|---|---|
| none | a different person (dark hair, wings) | none | none | no | the baseline: the trigger means nothing without the LoRA |
| 500 | idle's, both seeds | seed 9300 on model; **9301 an orange and multicolour hakama** | idle's sunburst, red studded rim | idle's | no |
| 1000 | idle's | seed 9300 on model; **9301 an orange robe** | idle's | idle's | no |
| **1500** | idle's, both seeds, at 1:1 hard to tell from idle | both seeds: crimson sleeves, purple kimono, gold collar, yellow sash, teal curtain with the jewelled ornament, purple hakama with the gold diamond hem, sandals | idle's | idle's | **pick** |
| 2000 | idle's | as 1500 | idle's | idle's | equal to 1500; 500 more steps buy nothing and cost pose freedom |

Two things the pick sheet shows that the next user of this LoRA must know:

1. **Background.** From step 1000 the plain `white background` prompt draws a
   flat slate or lilac backdrop. `(white background:1.3), (simple
   background:1.2)` brings back a clean white at 1500 and 2000 (block 2), which
   the cut-out needs; production prompts should carry it, or
   `SPRITE_NEGATIVE`'s `colorful background`.
2. **Pose and lower costume.** Without a pose control, the round-3 attack
   words (`lunging, leaning forward, one leg forward, holding shield, pushing,
   clenched teeth, angry`) still pose him (block 3: not frozen in the idle's
   crossed arms), and the head and the shield stay on model, but a wide stance
   splits the hakama into leggings or red trousers and slims the belly.
   Hakama and build words (or the OpenPose control plus a costume emphasis)
   are needed for the states; that is the next step's job, not the LoRA's.

Installed for ComfyUI as `D:/Tools/ComfyUI/ComfyUI/models/loras/ormi-x2.safetensors`
(identical to step 1500); every step is also under `models/loras/ormi-steps/`.
The LoRA is a tool, not art: nothing it draws is approved until Bailey says so.
