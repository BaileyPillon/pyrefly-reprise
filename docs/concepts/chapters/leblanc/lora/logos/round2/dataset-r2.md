# Logos identity LoRA, round 2 (`logos-x2-r2`): idle repair, dataset, training (2026-09-23)

FFX-2 only (Chapter 6, Chateau Leblanc art; Logos exists only in FFX-2; no shared tool, game
file or FFX chapter changed, AGENTS.md hard rule 14). **Nothing here is approved.** No entry
was added to `docs/target/approved-hashes.json` (sha256 `3c5af02f...c15c`, no Logos entry);
`D:/Tools/pyrefly-lora/tools/verify-approved.mjs` reported 115 ok / 0 mismatched before
(`approved-before.json`) and after (`approved-after.json`) this run.

## 1. The idle anchor, repaired first

Round 1's LoRA learned **the idle's own defect** (round-3 judge, idle weapon 5; LoRA judge,
cast weapon 6): the near revolver hangs from one finger through the trigger guard while the
fist closes on a grey stub. Fixed at the source before training on it again:

- `fix2.mjs idle.r2` (spec in `fixes-r2.json`): a masked repaint of the near hand only, made
  directly on the installed cutout (604 x 1160). The stub pre-filled dark so the sampler cannot
  re-read it; crop 96,456..344,704 upscaled to 1024; Animagine XL 4.0 Opt + **the round-1 LoRA
  `logos-x2` at 0.5 (low strength)**; IP-Adapter plus on two grip references at 0.3
  (`../poses/refs/attack-grip.png`, the attack pick's held revolver, and `refs/cast-lowhand.png`,
  the cast fix's low hand); denoise 0.85 to 0.95; 28 steps, cfg 6, euler_ancestral.
- 12 candidates (`renders/idle-hand-cands.jpg`, `renders/idle-hand-cands-r2.jpg`, 2x nearest).
  Round 1 of the fix (`idle.9800x`, one grip reference, 0.7 to 0.9) kept the index finger
  hooked with the other fingers laid over a loose grip. **Pick `idle.r2.98014`**: the fist
  closes around a black grip, the index finger rests in the trigger guard, and the silver frame
  runs unbroken from the cylinder into the fist (`renders/idle-hand-z2.jpg`, 4x nearest). The
  black grip matches the idle's other revolver and the judges' note that the idle's grips are
  dark. 98016 (an engraved silver grip plate) was the runner-up.
- **Proof that nothing else moved** (`r2-support.py diff`): 9,278 pixels changed, **0 outside
  the mask** (13,886 mask pixels), alpha identical everywhere; `idle-hand-diff.png` shows the
  changed pixels in red inside the mask outline (green). Canvas, crop box and baseline unchanged.
- Installed as `public/art/characters/logos/idle.png` (sha256 `7aa37e8b...45e3`, CANDIDATE;
  the sidecar's `handRepair` holds the seed, mask, prompts, LoRA, refs and proof). The replaced
  idle (`64a43dc9...d925f`) and its sidecar are in
  `D:/Tools/pyrefly-art-backup/candidates/2026-09-23-lora-r2/logos/replaced/`.

## 2. The grown dataset (`build-dataset-r2.py`, `D:/Tools/pyrefly-lora/logos/dataset-r2`)

The brief: round 1's dataset plus every round-1 output the independent judge or the painter
scored 6 or above, captioned by view and pose only, repeats 1, the idle views at repeats 2,
**excluding anything with a wrong costume detail the judges named**.

Only the four installed picks were ever scored; the unpicked candidates in `../poses/renders/`
and the step-pick renders were rejected or described, never scored, so they do not qualify.

| Round-1 output | Scores | Used | How, and why |
|---|---|---|---|
| attack `97105` (installed `attack.png`, `21b5dd47...`) | judge 6 (on 96101), painter 7 after the disc fix | **2 crops** | The judge named a lilac sash tail with a gold tip hanging at the FRONT (the idle's hangs at the back). Both crops leave it out: `attack-upper` (0,0..545,392: head, helmet, radial disc, strap, both arms aiming; the lower revolver is outside the box, so the caption says `holding gun`, not `dual wielding`) and `attack-legs` (236,604..817,1013: the lunge, hakama, wraps, slide sandals). The mesh disc of 96101 is not in the file any more (pasted and repainted). |
| cast `97212` (installed `cast.png`, `2aaf4ff7...`) | judge 6 (on 96201), painter 7 after the hand fix | **2 crops** | The judge named two lilac ribbons, one on each side (the idle has one). `cast-upper` (84,0..420,428) stops above both ribbons: raised revolver, helmet, disc, strap. `cast-hand` (180,500..372,800): the repaired low hand, the fist around the grip, which is exactly what the idle repair and this round want the LoRA to learn. The hanging-gun cast 96201 itself is not used. |
| ko `97422` (installed `ko.png`, `d579c2f2...`) | judge 5 (on 96402.r2), painter 7 after the helmet / sash fix | **1 crop** | The judge named the engraved helmet band, a ring on the sash and a lens on the cheek (all three repainted out in 97422) and brown wooden grips (still there). `ko-upper` (0,0..720,222) keeps the head, helmet, disc, sash and near arm and stops above both revolvers. |
| hurt `97322` (installed `hurt.png`, `b9ba535f...`) | judge 5 (on 96303.r2), painter 6 | **no** | Two named costume faults are whole-figure: the robe hides the hakama and darkens to navy with no violet fade, and there are two ribbons. The helmet front is a repainted surface (the judge's wing engraving turned into grooves) no judge has seen. No crop keeps the pose and leaves all three out. hurt is therefore also the **unseen pose** for the step pick. |
| attack 96101, cast 96201, hurt 96303.r2, ko 96402.r2 (the unfixed LoRA picks) | judge 6 / 6 / 5 / 5 | no | Each carries the defect its fix removed (mesh disc, hanging gun, blank face and wing engraving, glyph band). |
| every unpicked render in `../poses/renders/`, the step-pick renders in `D:/Tools/pyrefly-lora/logos/pick` | never scored | no | Rejected by the painter for one gun, three guns, an upright hurt, or only described. |
| round-3 renders, concepts, portrait | see `../dataset.md` | no | Same reasons as round 1 (wrong costume). |

Images (flattened on white, padded white, small crops enlarged with RealESRGAN x4 on the CPU,
Lanczos to about 1 MP, sides multiples of 64). Captions: `logosX2, 1boy, solo, <view>, <pose>,
facing left|right, simple background, white background`. No costume words.

| id | subset (repeats) | source | source sha256 (16) | box | mirror | size | resize | output sha256 (16) |
|---|---|---|---|---|---|---|---|---|
| full | img-idle (2) | idle.png | 7aa37e8b2873caef | -60,-40,664,1200 | no | 768x1344 | lanczos | bb2bacf5144ec9bd |
| full-m | img-idle (2) | idle.png | 7aa37e8b2873caef | same | yes | 768x1344 | lanczos | 57dda627997bda08 |
| full-wide | img-idle (2) | idle.png | 7aa37e8b2873caef | -420,-120,1024,1280 | no | 1024x1024 | lanczos | fe3e12cb344d4085 |
| full-wide-m | img-idle (2) | idle.png | 7aa37e8b2873caef | same | yes | 1024x1024 | lanczos | 0276a3f450ac81ca |
| cowboy | img-idle (2) | idle.png | 7aa37e8b2873caef | 0,0,604,860 | no | 832x1216 | lanczos | 5466f729c96fe3c4 |
| cowboy-m | img-idle (2) | idle.png | 7aa37e8b2873caef | same | yes | 832x1216 | lanczos | b2f19ed81a6b1036 |
| upper | img-idle (2) | idle.png | 7aa37e8b2873caef | 60,-10,560,580 | no | 960x1088 | esrgan-x4+lanczos | f2de75c408373a33 |
| upper-m | img-idle (2) | idle.png | 7aa37e8b2873caef | same | yes | 960x1088 | esrgan-x4+lanczos | fcbb983a3a032fa3 |
| headshoulders | img-idle (2) | idle.png | 7aa37e8b2873caef | 130,-10,490,350 | no | 1024x1024 | esrgan-x4+lanczos | 9374be070ef987ee |
| headshoulders-m | img-idle (2) | idle.png | 7aa37e8b2873caef | same | yes | 1024x1024 | esrgan-x4+lanczos | f7e61a3457b85637 |
| face | img-idle (2) | idle.png | 7aa37e8b2873caef | 180,0,400,220 | no | 1024x1024 | esrgan-x4+lanczos | 9d25b704c2e23eeb |
| face-m | img-idle (2) | idle.png | 7aa37e8b2873caef | same | yes | 1024x1024 | esrgan-x4+lanczos | 0840aeb57df0787e |
| chest | img-idle (2) | idle.png | 7aa37e8b2873caef | 170,150,490,470 | no | 1024x1024 | esrgan-x4+lanczos | 216864366fc4bb26 |
| chest-m | img-idle (2) | idle.png | 7aa37e8b2873caef | same | yes | 1024x1024 | esrgan-x4+lanczos | dbb9bf9da2a9ee5a |
| legs | img-idle (2) | idle.png | 7aa37e8b2873caef | 100,690,580,1160 | no | 1024x1024 | esrgan-x4+lanczos | 68bae014ad6002fb |
| legs-m | img-idle (2) | idle.png | 7aa37e8b2873caef | same | yes | 1024x1024 | esrgan-x4+lanczos | 56caec1f68996353 |
| attack-upper | img-poses (1) | attack.png | 21b5dd4723d80291 | 0,0,545,392 | no | 1216x896 | esrgan-x4+lanczos | 5fd818064668d70d |
| attack-legs | img-poses (1) | attack.png | 21b5dd4723d80291 | 236,604,817,1013 | no | 1216x832 | esrgan-x4+lanczos | 816f44d5aaf3f1e8 |
| cast-upper | img-poses (1) | cast.png | 2aaf4ff7a493da56 | 84,0,420,428 | no | 896x1152 | esrgan-x4+lanczos | 4230187ddb40cb71 |
| cast-hand | img-poses (1) | cast.png | 2aaf4ff7a493da56 | 180,500,372,800 | no | 832x1280 | esrgan-x4+lanczos | 60ca0533e273590b |
| ko-upper | img-poses (1) | ko.png | d579c2f21c5eb667 | 0,0,720,222 | no | 1856x576 | esrgan-x4+lanczos | e112ead3b2c28204 |

Full source hashes: idle `7aa37e8b2873caef7ff0f85db9f267045ec70ee62e289b4692e264e25e6c45e3`,
attack `21b5dd4723d80291daa148e5ab2fc17c5c29405a829929f58eee13257c8f9f31`, cast
`2aaf4ff7a493da56f6297de578ce74bad280e4df15ed4ba987fe5a7623303ace`, ko
`d579c2f21c5eb667d2dce40f5b9817438356b90fa9fb60864737f46eac8787fd`. The attack, cast and ko
files were replaced later in this round (step 3); the exact source files are in the backup's
`replaced/` folder under these hashes. Exact captions and full output hashes:
`D:/Tools/pyrefly-lora/logos/dataset-r2/manifest.json`. One epoch = 16 x 2 + 5 x 1 = 37 steps.

The five pose crops are the idle's costume in new poses and they add what round 1 could not:
aiming arms, a raised arm, a lunge, a lying head and a hand that grips. They are still the
LoRA's own round-1 output, so they carry its smaller drifts (a grey lens ring where the idle's
is brass-rimmed; ko's ribbed dome seen from above). The idle stays the majority (32 of 37).

## 3. Training (`train-r2.mjs`: round 1's `../train.mjs` with the round-2 dataset, `out-r2`, name `logos-x2-r2`)

Settings unchanged from round 1: kohya sd-scripts `sdxl_train_network.py` on
`animagine-xl-4.0-opt.safetensors`, `networks.lora` dim 16 / alpha 8, U-Net only with cached
text-encoder outputs, AdamW8bit, lr 1e-4 cosine, 100 warm-up steps, min-SNR 5, resolution 1024
with buckets 512..2048 step 64, batch 1, bf16, fp16 save, gradient checkpointing, SDPA, cached
latents, seed 4343; **2000 steps** (37 steps an epoch, about 54 epochs), saved every 500 to
`D:/Tools/pyrefly-lora/logos/out-r2/`.

- **GPU lock** (`D:/Tools/pyrefly-lora/GPU-LOCK.md`, obeyed): the gate waited from 09:25 to
  12:19 UTC behind the leblanc-x2-r2 training (09:28 to 10:14), the ormi-x2 r2 training (10:50 to
  11:21) and both runs' pose renders: ComfyUI `/queue` empty, nvidia-smi under 4 GB for 3
  consecutive minutes, no other `train_network` process, then `gpu-train.lock` by exclusive
  create (released at the end; it was gone when checked). ComfyUI was never restarted; its
  `/free` (unload cached models) was asked three times, each only with the queue empty (the
  cached models, 7 to 12 GB in ComfyUI's own process, were what held the card between renders).
- **Wall time** 35.5 min (12:19:26 to 12:54:58 UTC), about 1.05 s/it with the other runs'
  renders sharing the card. **VRAM** (whole card, every 5 s, `out-r2/vram.csv`): median 13.1 GB,
  peak 15.7 GB of 16 GB; no OOM, exit 0. Final loss (moving average) 0.0377.
- Step files (sha256): 500 `f048733d...`, 1000 `4e77874e...`, 1500 `ec2d2611...`, **2000
  `9f19d81709b2763ebf63eb09f1129083d24ce69cc61652accafd77b70401d503`**; kohya's end file
  `logos-x2-r2.safetensors` (`14587107...`) is the same 2000 steps with other metadata.

## 4. Step pick (`pick-r2.sh`, `pick-sheet-r2.py`, `pick-sheet.jpg`)

Every step, and the round-1 LoRA as the control row, rendered **the idle's own pose** (the idle
skeleton, `../idle-pose.png`) and **one unseen pose** (hurt, the round-2 recoil skeleton
`hurt3-pose.png`; no hurt frame is in the dataset), 2 seeds each (99001/99002, 99301/99302), with
`render-r2.mjs` (LoRA 0.85, IP-Adapter plus on the repaired idle at 0.3, OpenPose). The sheet puts
native 1:1 crops of the head, the near hand with its revolver and the feet next to the repaired
idle's own.

| Row | Helmet (1:1) | Near hand (1:1) | Feet | Unseen hurt |
|---|---|---|---|---|
| r1 (control) | idle's dome, ribbing | **the defect: the revolver hangs from the index finger, the fist on a brown stub** | open-toe slides | reads; one seed's helmet grows a flat brim |
| 500 | plainer dome, less ribbing | fist on a grip | slides | one seed: a large pointed brim, an ear-cup disc |
| 1000 | dome, ribbing returns | fist around the grip | slides | ear-cup disc on one seed |
| 1500 | idle's ribbed side band and short visor | grip in the fist, index at the guard | slides | clenched-teeth wince, idle's band |
| **2000** | **idle's ribbed side band, visor and side plate, both seeds** | **grip in the fist on both seeds** | **black open-toe slides, white wraps, black bands** | **clenched-teeth wince, idle's band (99302); 99301 throws the head back so far the eye is blank** |

**Pick: step 2000** (`9f19d817...`), installed as
`D:/Tools/ComfyUI/ComfyUI/models/loras/logos-x2-r2.safetensors` (same hash). It is the only step
that keeps the idle's helmet surface on both idle seeds and on the unseen pose, and the grip
defect the round-1 LoRA still paints (control row) is gone at every r2 step. Steps 500 to 1500
stay in `out-r2/` and in ComfyUI `models/loras/pyrefly-lora-steps/logos-x2-r2-step{500..2000}`.
Backups (the picked step, `run.json`, `dataset-r2.toml`, the dataset, the pick renders):
`D:/Tools/pyrefly-art-backup/candidates/2026-09-23-lora-r2/logos/{lora,dataset-r2,pick-r2}/`.
