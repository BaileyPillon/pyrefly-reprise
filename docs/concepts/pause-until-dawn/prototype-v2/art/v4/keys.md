# v4 yaw keys: one Yuna, trained (2026-09-23)

Game case: **FFX-2 only.** The plate is the approved Yuna X-2 close-up
(`public/art/portraits/yuna-x2.png`); nothing here applies to FFX Yuna.

Why: the v3.3 check (`shots/v3.3/CHECK.md`, "Still not right") found the turned
keys were **different paintings** from the plate: flat brown hair without the
orange/pink tips, a small earring for the beaded tassel, a red braid on the
wrong side, another line style. A turn read as a 0.2 s change of picture at
about 28 degrees. This round trains the plate's identity into a LoRA and paints
every key with it, so the keys and the plate are the same painting.

**Round 2 (section 7) replaced the picks.** Start with `sheets/turn-strip.webp`
(both picks per yaw, -85 .. plate .. +85, and the pick-1 faces) and
`sheets/turn-flip.webp` (the pick-1 row as a there-and-back flipbook), then
`sheets/yaw<N>.webp` (every round-2 candidate per yaw, finished, whole and at
1:1, labelled with denoise and the measured turn) and `sheets/inits.webp`.
Round 1 (sections 1 to 6) is kept for comparison: `sheets/r1/` (with the
step test), `picks-r1.json`, `judge-r1.md`, `judge-sheet-r1.jpg`.

## 1. Dataset (17 images; sources read-only, hashed before and after)

`tools/gen/rig-lora-data.py build` -> `D:/Tools/pyrefly-lora/yuna-x2/dataset/`
(`manifest.json` has every row below). Each crop is flattened onto white;
crops under 0.35 MP are enlarged with RealESRGAN_x4plus **on the CPU** (never
the shared GPU) and brought to about 1 MP with Lanczos. Captions are
`yunaX2, 1girl, solo, ...` plus pose and view only, written after looking at
each image; the identity is never written down (the LoRA learns it).
Repeats: plate 4, figure 1, bust 1 (the ESRGAN busts smooth the line, so they
weigh least), scene 1.

| id | subset | source | crop | sha256 | resize |
|---|---|---|---|---|---|
| plate-full | plate | `public/art/portraits/yuna-x2.png` | whole | `7427dc7fc4811782c00be3888dbca713d04c3755328b179da3bfc5e1fd371200` | native |
| plate-head | plate | same | 0,0,832,832 | same | lanczos |
| plate-face | plate | same | 140,220,700,780 | same | esrgan |
| plate-bust | plate | same | 0,150,832,1216 | same | lanczos |
| idle-full | figure | `public/art/characters/yuna-gunner/idle.png` | whole | `56918c5b104b005b943b0668b5fc29b908a341fc7a9cbf877c20f1e6b2de4a90` | lanczos |
| attack-full | figure | `public/art/characters/yuna-gunner/attack.png` | whole | `29aae5f48c8284c1a1aa7d33037e9048fa35a97a37476c4bc456ef892c57c897` | lanczos |
| cast-full | figure | `public/art/characters/yuna-gunner/cast.png` | whole | `566d9af83440f6cdf6b5c315a775e940c228bab2e396a2c3f28622c2d9d953ab` | lanczos |
| hurt-full | figure | `public/art/characters/yuna-gunner/hurt.png` | whole | `fdf06616039f139c4c6f7dcc04e40595eee9c1a0acd212f5d1560340b55445aa` | lanczos |
| victory-full | figure | `public/art/characters/yuna-gunner/victory.png` | whole | `96a2c9086e316e6427651d5eeab53d2a1f54112c8d1169cf46b34618eb4f9428` | lanczos |
| ko-full | figure | `public/art/characters/yuna-gunner/ko.png` | whole | `f0af2d4edf5a782016399e169cf39dcce9a24335363ff716d459c9edd0bb2947` | lanczos |
| idle-bust | bust | idle.png | 100,0,420,320 | as idle | esrgan |
| attack-bust | bust | attack.png | 260,60,620,420 | as attack | esrgan |
| hurt-bust | bust | hurt.png | 190,0,530,340 | as hurt | esrgan |
| victory-bust | bust | victory.png | 90,150,420,480 | as victory | esrgan |
| ko-head | bust | ko.png | 560,110,1000,550 | as ko | esrgan |
| pause-full | scene | `public/art/pause/yuna-ffx2.png` | whole | `f1efe21f6c7588d3c9a5b72b6374daabb02bbe0f3315ebe78ef5f29b958617bc` | native |
| pause-head | scene | same | 380,0,880,500 | same | esrgan |

There is no yuna-gunner manifest file in `public/art/characters/yuna-gunner/`;
the states were read from `tools/gen/cast.json` (`yuna-gunner`: idle, attack,
hurt, ko, victory, plus the cast.png on disk). The speaker portrait for this
look is the plate itself (`portraits/yuna.png` is FFX Yuna and was left out, as
were the unapproved `portraits/yuna-ffx2-a.*` candidates). The idle and the
pause painting are browner and softer than the plate; they are in because they
are approved paintings of this Yuna, at the lowest weight.

## 2. Training

`node tools/gen/lora-train.mjs train --steps 2000 --dim 32 --alpha 16 --lr 1e-4`:
kohya `sdxl_train_network.py` (D:/Tools/sd-scripts/.venv, torch 2.14 cu130) on
Animagine XL 4.0 Opt; LoRA rank 32 / alpha 16, U-Net only (text encoder not
trained, outputs cached), AdamW8bit, lr 1e-4 cosine with 100 warm-up steps,
batch 1, bf16 mixed / fp16 save, gradient checkpointing, SDPA, latents cached
to disk, min-SNR 5, bucketing 512..2048 at 1024, seed 4242, 2000 steps, a
checkpoint every 500.

- **GPU rule**: the gate waited while a ComfyUI video render held 13.3 GB, then
  opened at 03:11:57 UTC after the queue was empty and the card under 4 GB
  (1971 MB) for 3 minutes. ComfyUI was not restarted and `/free` was not needed.
- **Wall time 30.5 min** (1831 s, incl. model load and latent caching; the 2000
  steps themselves 29 min 21 s at 1.14 it/s). Final average loss 0.056.
- **VRAM**: peak 10,087 MB on the whole card (`out/vram.csv`, every 5 s) over
  a baseline of about 1,970 MB held by other processes, so about **8.1 GB** for
  the training itself.
- Outputs (not committed): `D:/Tools/pyrefly-lora/yuna-x2/out/`
  `yuna-x2-step00000500/1000/1500/2000.safetensors` (170.5 MB each), `train.log`,
  `run.json`, `vram.csv`.

## 3. Checkpoint pick: step 2000

`node tools/gen/lora-keys.mjs test --loras none,<each step>` renders a frontal
(OpenPose yaw 0 at 0.6, the plate as IP-Adapter reference at 0.3, LoRA 0.8, two
seeds) and `sheets/r1/steptest.webp` puts them next to the plate, whole and 1:1.

- **none** (same seeds, no LoRA): a different girl entirely (red eyes, black or
  multicolour hair). The IP-Adapter at 0.3 alone does not carry this identity.
- **500**: plate hair and tassel, but the blue eye goes violet and a cyan streak
  floods the right side hair.
- **1000 / 1500**: right eyes and hair; the tassel's gold coin bead comes and
  goes.
- **2000**: closest at 1:1: the lash weight, the iris highlights, the
  orange-to-pink tips, the tassel with its gold coin on screen-left, green on
  her right and blue on her left. A turn test at -60 (`cand/steptest-yaw-60`)
  showed 1000, 1500 and 2000 all turn equally, so the later step costs no
  range. Picked; copied to
  `D:/Tools/ComfyUI/ComfyUI/models/loras/yuna-x2.safetensors`
  (sha256 `b5b540994c3d2c217d3937e8d133de9c6680891ac9c08e1695f32d36cdd61960`).
  The steps are also staged under `models/loras/pyrefly-lora-steps/` for
  re-testing.

## 4. Keys: recipe

`node tools/gen/lora-keys.mjs render --yaws -85,-60,-40,-20,20,40,60,85 --count 6`
(core ComfyUI nodes plus the already-installed IP-Adapter node):
CheckpointLoaderSimple (Animagine XL 4.0 Opt) -> LoraLoader `yuna-x2` 0.8/0.8 ->
IPAdapterAdvanced (plate flattened on white, 0.3, ease in, 0.2..0.6, K+V:
recipe R2) -> KSampler (hero preset: 30 steps, cfg 6, euler_ancestral, normal,
832x1216 = the plate's canvas); the conditioning passes through
ControlNetApplyAdvanced with `xinsir-controlnet-openpose-sdxl-1.0`.

- **Skeletons** (`tools/gen/rig-lora-pose.py`, `pose/yaw<N>.png`): COCO-18
  colours on black, head and shoulders only. Frontal positions are the plate's
  own landmarks (pupils 339,421 / 608,406, nose tip 470,548); each head point
  gets a depth on a 215 px head and is turned about the head's vertical axis;
  neck and shoulders stay fixed. The far ear is dropped past 30 degrees and the
  far eye past 70. Negative yaw = the face turns toward screen-left (rig.json
  `turn-l85` is -85).
- **Prompt**: `yunaX2, 1girl, solo, <view tags>, portrait, close-up, upper body,
  light smile, closed mouth, simple background, white background` + the house
  style and quality blocks. View tags: 20 `head turned slightly, looking to the
  side`; 40 `three-quarter view, head turned, looking to the side`; 60 `+ from
  side, head turned away`; 85 `profile, from side, looking to the side`. No
  left/right words: the skeleton sets the direction.
- **Round r1**: OpenPose 0.6 over 0..0.8 of the denoise. **Round r2**: 0.7 over
  0..1.0 (added after r1 under-rotated at 20 and 40). 6 candidates per yaw per
  round, 96 in all, about 11-12 s each on the local ComfyUI, one at a time
  behind the shared queue. No black frames (`rig-lora-sheet.py` checks every
  candidate's largest sample).
- Candidates and their sidecars: `D:/Tools/pyrefly-lora/yuna-x2/cand/r1|r2/yaw<N>/`.
  Picks are copied here as lossless webp with the sidecar
  (`picked/yaw<N>.pick1|2.webp/.json`, listed in `picks.json`).

## 5. Picks (judged whole and at 1:1 against the plate)

Apparent yaw is my reading of each picture, not a measurement.

| yaw | pick 1 | pick 2 | apparent turn | checked |
|---|---|---|---|---|
| -85 | r1.c1 | r1.c4 | ~75 / ~85 (true profile) | c1: near eye blue (right), tassel on the far ear; c4: tassel on the far ear (right), **near eye green (wrong, needs the iris recolour)** |
| -60 | r1.c2 | r2.c1 | ~55 / ~45 | far eye green, near eye blue; tassel on the far (screen-left) ear |
| -40 | r2.c2 | r2.c3 | ~25 / ~20 | under-turned; tassel on screen-left only, eyes right |
| -20 | r2.c1 | r1.c5 | ~10 / ~10 | one tassel, screen-left |
| +20 | r1.c5 | r1.c4 | ~10 / ~15 | one tassel, screen-left (most others grew a second earring) |
| +40 | r2.c2 | r1.c1 | ~30 / ~35 | tassel on the near (screen-left) ear only |
| +60 | r1.c3 | r2.c5 | ~50 / ~45 | near eye green; the far blue eye goes violet |
| +85 | r2.c2 | r2.c3 | ~85 / ~70 | near eye green, tassel behind the jaw on the near ear; c3 has a painted swirl top-right (background, cut away) |

Every pick keeps the plate's orange-to-pink tips, the beaded tassel with its
gold coin, the hair clip on screen-right, the pink hood, the line weight and
the eye style. This is the thing v3.3 lacked.

## 6. What drifted

1. **Turn amount at 20 and 40.** The LoRA was trained mostly on the frontal
   plate (its crops weigh 4x), and it pulls toward frontal: 20 renders about
   10 degrees, 40 about 20-35, 60 about 45-55, 85 about 70-85. Round r2's
   stronger OpenPose (0.7 to the end) helped at 60 and 85, not at 20 and 40.
   The warp between keys still has to cover that gap; the next lever is a
   depth or lineart ControlNet (not installed: needs a download and a yes) or
   a LoRA with more turned training images (the ESRGAN busts are the only
   turned heads it saw).
2. **Which ear wears the tassel.** About half the candidates at +-20..+-60 put
   it on the ear facing the camera or on both ears; the plate has one, on her
   right ear (screen-left). Every pick was chosen for one tassel on her right
   ear, but a key painted to order will need an inpaint of the ear.
3. **Profile eye colour.** In left profiles the single visible eye is usually
   painted green (it should be her blue left eye); -85 pick 2 has it. The
   v3 recolour step (`rig-turns.py`) fixes an iris without repainting.
4. **The far blue eye goes violet** at +40..+60 (violet under the far lid).
5. **Saturation**: cyan and green streaks in the hair and a larger red/cyan
   hair clip than the plate's; stronger at 85.
6. **Framing**: the head renders about 10 percent smaller than the plate's and
   the shoulders turn with the head even though the skeleton pins them. The rig
   pins the body and aligns the head layers by landmarks, so only the head is
   used.
7. **Extras**: a neck ribbon or brooch on some candidates, a red-tipped braid on
   the far side in some left profiles (-85 pick 1 shows one). Not in the plate.

Nothing here has had an independent judge or Bailey's look. The keys are not
yet cut into layers or wired into `rig.json`: that is the rig's next step.

## 7. Round 2: every key starts from the plate's own paint (2026-09-23)

The judge (`judge-r1.md`) failed round 1 at every yaw (best 3 to 6) and gave
the sequence five reasons: the turn stepped unevenly (20 and 40 at half),
accessories and outfit were redrawn in every key, framing and scale drifted,
and the far eye went violet. Its redo list was: stronger pose control and a
measured turn, shared paint (img2img from the warped plate), the body and
frame locked, accessories from the plate's own pixels, the eyes recoloured.
This round does each of those. The LoRA, its strength (0.8), the checkpoint
step (2000), the IP-Adapter reference (plate, 0.3) and the prompt tags stayed:
identity was the part round 1 got right, so none of it was touched.

### What changed

| judge's reason | change | tool |
|---|---|---|
| each key its own painting | the key is **img2img from the plate turned in 2.5D**: the plate's v3 layers (with their hidden fills) get a depth each (face ellipsoid plus a nose ridge on the skeleton's head, a flatter hair shell behind, the fringe in front), are rotated about the head axis x = 473 and z-buffered; the sampler repaints that at denoise 0.65 to 0.82 instead of inventing from noise | `rig-lora-init.py build`, `lora-keys.mjs warp` |
| outfit, crop, scale change | **head-only mask**: the body layer is pinned, and everything outside the (grown, feathered) old-plus-new head is the plate's pixels, put back after decoding | `rig-lora-init.py` (mask), `rig-lora-fix.py fix` |
| tassel redrawn, wrong or both ears | the tassel moves **rigidly with her right ear**; toward the camera (yaw >= 0, and -20 with `--keep-tassel`) it is drawn on top and **cut out of the repaint mask**, so it is the plate's own pixels; turned away it is drawn under the head and body; `--negExtra earrings` at -60 and -85, where the only visible ear is her left (bare) one | `rig-lora-init.py`, `lora-keys.mjs` |
| 20 and 40 at half | the start paint already sits at the angle, and `--aim` paints 20 from the 25 geometry and 40 from 48 (the sampler gives back about a fifth of the turn); OpenPose 0.8 over the whole schedule (was 0.6 / 0.7) | `lora-keys.mjs warp --aim`, `rig-lora-pose.py` (new 25 and 48 skeletons) |
| no measurement | **the turn is measured**: iris blobs matched to where the head model puts the pupils at each yaw (`reads`), plus the pupil spacing alone (`readsIpd`, blind to a head that slid sideways; weak near 0, absent in profile). On round 1's picks it gives -34 / -36 at "-40" and +12 / 0 at "+20", close to the judge's readings at +40 and +20 (not at -40); the plate reads +3 / 0 | `rig-lora-fix.py measure` |
| far eye violet, profile eye green | each matched iris is **recoloured by side** (her right = the plate's green, her left = the plate's blue; hue and chroma from the plate's iris layers, lightness kept) | `rig-lora-fix.py fix` |
| invented extras | the warp negative adds `hair flower, flower, choker, necklace, braid, braided hair, collar, brooch` (and from w3 `headphones, headset`) | `lora-keys.mjs` |

### Rounds (6 candidates each, one at a time behind the shared queue, 16 to 35 s each)

| round | yaws | start paint | aim | denoise | what it taught |
|---|---|---|---|---|---|
| pilot | -85, -40, +60 | blur fill | = target | 0.5 / 0.6 / 0.7 | 0.5 keeps the warp's smears; 0.6 to 0.7 turns cleanly; the lone profile eye comes out green (recolour needed) |
| w1 | all 8 | blur fill | = target | 0.55 to 0.7 | frame, outfit and tassel locked; 20 reads 16-17, 40 reads 33; the blurred holes stay as a rainbow glow at 0.6 |
| w2 | +-20, +-40 | blur fill | 25 / 48 | 0.6 to 0.7 | 20 reads 19-23, 40 reads 40-47: on target; 0.7 clean, 0.6 not |
| w3 | +-60, +-85 | flat hair brown behind, white ahead | = target | 0.65 / 0.72 | true profiles at 85, but white ahead of the face cuts the nose and leaves the far side bald at 60 |
| w4 | -20, -40 | flat, tassel kept at -20 | 25 / 48 | 0.7 / 0.72 | -20 keeps the plate's tassel to the pixel; -40 far side bald (flat is wrong below 85) |
| w5 | +-60, +-85 | flat plus 30 px of nearest colour ahead | = target | 0.7 to 0.82 | the cleanest profiles at +-85 (+85 c2 clean, plate tassel); +-60 turn far but the far hair is thin |
| w6 | -40, +-60 | blur fill | 48 at -40 | 0.7 / 0.74 | the most natural 40 and 60 (full far-side hair); +60 reads 55-60 by eye position but only 38-45 by spacing |

Everything outside the repaint mask is the plate to the pixel in every key.
Candidates, sidecars (seed, aim, init, mask, denoise, negative) and the
finished keys: `D:/Tools/pyrefly-lora/yuna-x2/cand/<round>/yaw<N>/`
(`fixed/` plus `measure.json`). `sheets/inits.webp` shows the start paint.

### Picks (`picks.json`, copied to `picked/` with the sidecar and the measurement)

| yaw | pick 1 | reads / spacing | pick 2 | reads / spacing | notes |
|---|---|---|---|---|---|
| -85 | w3.c4 | -85 / - | w5.c4 | -74 / - | true profiles, no earring on the near (left) ear; pick 2 reads short by the eye measure though the nose is in full profile |
| -60 | w6.c1 | -59 / -51 | w6.c3 | -60 / - | far green eye a sliver; the hair clip is fully in view and larger than the plate's cropped one |
| -40 | w6.c1 | -42 / -42 | w6.c6 | -44 / -38 | the far tassel shows under the far jaw (the geometry says it should at 40), its form simplified |
| -20 | w4.c5 | -20 / -23 | w4.c6 | -20 / -24 | the plate's own tassel pixels |
| +20 | w2.c1 | +21 / +21 | w2.c3 | +22 / +19 | the plate's tassel to the pixel (on top, near ear) |
| +40 | w2.c4 | +40 / +38 | w2.c6 | +46 / +42 | the plate's tassel; far eye blue |
| +60 | w5.c2 | +57 / - | w5.c4 | +56 / +47 | far eye hidden (c2) or a blue sliver (c4) |
| +85 | w5.c2 | +86 / - | w3.c2 | +86 / - | c2 is the cleanest profile of the round; w3.c2 has a flat, unpainted back of the head and a disc ornament |

### Still open (for the judge, not claimed as fixed)

1. **The hair clip** at her left temple is cropped by the plate's edge, so the
   plate never shows it whole; from -20 to -85 it comes into view and the
   sampler completes it as a larger red-and-cyan disc, differently per key.
   Pasting it needs a painted whole clip first.
2. **The far tassel at -40 and -60** is repainted (the plate's pixels would
   sit behind the jaw and neck); its form varies.
3. **Hair on the far side at 60** differs between the blur-fill keys (full,
   natural) and the flat-fill ones (thin): the picks use blur at -40 and -60
   and flat at +60 and 85, so the far hair changes character on the way.
4. **The measure reads eyes**, not the nose; at 85 it has one eye to go on
   and can be 10 degrees off (-85 pick 2). It checks against the targets; it
   is not the judge's reading.
5. Not cut into layers, landmarked or wired into `rig.json` (the v3.3
   `rig-*.py` chain is the path once a judge passes the keys).
