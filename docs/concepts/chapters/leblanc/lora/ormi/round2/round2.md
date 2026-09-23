# Ormi round 2: LoRA r2, re-rendered poses, in-game scale (2026-09-23)

FFX-2 only (Chapter 6, Chateau Leblanc; AGENTS.md hard rule 14: per-subject art and
tooling, no game file and no shared tool changed). **Nothing here is approved.** The four
installed files are CANDIDATES; `docs/target/approved-hashes.json` is untouched (sha256
`3c5af02f...` before and after; its 115 files verify identical before and after with
`D:/Tools/pyrefly-lora/tools/verify-approved.mjs`: ok 115, mismatched 0, missing 0). The
idle (`f7fcdfc3...`) is unchanged and is still the anchor.

**Sheet:** `sheet.jpg` (idle, then each state: whole at idle's pixel scale times the
sidecar `scale`, face, costume, feet and weapon at 1:1 native pixels). **Step pick:**
`pick-sheet.jpg`. **In game:** `ingame-r2-*.png` (crops at deviceScaleFactor 2) and
`ingame-r2-idle-full.jpg`, `ingame-r2-ko-full.jpg`; round 1's set in the same battle:
`ingame-r1-*`.

## Result (painter's own scores at 1:1: an independent judge is still owed)

| State | Pick | Head | Face | Costume | Shield | Build | Style | Pose | Score | scale | Head vs idle in game |
|---|---|---|---|---|---|---|---|---|---|---|---|
| attack | `attack.c.980002.knot982201` | 6 | 7 | 7 | 6 | 8 | 6 | 8 | **6** | 1.04 | 0.999 |
| cast | `cast.a.980101.knot982003.tassel982013` | 6 | 7 | 7 | 7 | 8 | 6 | 7 | **6** | 1.20 | 0.999 |
| hurt | `hurt.c.980203.knot982106` | 7 | 7 | 6 | 6 | 8 | 6 | 6 | **6** | 1.17 | 1.026 |
| ko | `ko.a.980305.noshield.head981036.badge981041.shadow2` | 7 | 7 | 6 | 5 | 8 | 6 | 8 | **5** | 0.83 | 1.008 |

All four are **best available, below bar** (7). Against the files they replaced (round 1
redo, painter 6 / judge 7 / painter 6 / painter 5): the number did not go up. What
changed is the set: **one finish across all four states** (round 1's two-finish problem,
the judge's "main blocker": attack and cast painterly, hurt and ko glossy neon), no
glossy or neon finish anywhere, one shield in every standing state, **the strike leads
with the shield**, **the recoil keeps both feet on the ground**, **the ko lies flat on
his back**, and every head matches idle's on screen within 3 percent. **Round 1's cast
(`cast.960106`, the one frame an independent judge put at the bar, 7) was replaced by a
self-scored 6 to keep one finish; it is backed up** (below) and can be restored by
copying `replaced/cast.png` and `cast.json` back. That trade is Bailey's call.

Worst per state:
- **attack:** a small maroon topknot with a red tie, no striped tassel; the shield has a
  red heart on a purple sunburst face (research 10.1) but a plain gold rim, not idle's
  red studded band; a flatter, brighter cel finish than idle's painterly shading.
- **cast:** small topknot, no tassel; flatter finish. The collar knot is painted out.
- **hurt:** the sash ties in a large bow at his side; the shield on his back shows only
  its gold back (no heart); the recoil reads as a stagger with a wince (eyes shut tight,
  clenched teeth, hand to the belly), milder than the skeleton.
- **ko:** **no shield** (the one clean ko render stood it on edge behind his head, running
  off the frame; it was erased); the hakama pattern is gold squares, not diamonds; a
  faint smudge at the collar where the heart badge was.
- **All four:** the finish is flatter than idle's (the r2 LoRA's pose images are cel
  renders; idle has painterly soft shading), and the style tags carry `cel shading`.

## 1. Dataset (dataset-r2.md)

Round 1's 14 idle crops at repeats 2, plus 10 pose images at repeats 1: the installed
attack redo (painter 6), `cast.960106` (judge 7) with its invented collar heart clasp
painted out of the training copy, and a cowboy crop of the installed hurt redo (painter
6) right of its pink-violet shield. 38 samples per epoch, 74 percent idle. Every source,
box, caption and sha256 is in `dataset-r2.md`.

## 2. Training and the step pick

`node tools/gen/lora-ormi.mjs train --steps 2000 --dim 16 --alpha 8 --toml
D:/Tools/pyrefly-lora/ormi/r2/dataset.toml --out D:/Tools/pyrefly-lora/ormi/r2/out --name
ormi-x2-r2`: round 1's settings unchanged (kohya `sdxl_train_network.py`, Animagine XL 4.0
Opt, dim 16 / alpha 8, UNet only, AdamW8bit, lr 1e-4 cosine, 100 warm-up, batch 1, 1024
bucketed, bf16, min-SNR 5, seed 4343), saved every 500.

- **GPU lock obeyed.** Waited 09:15 to 10:50 UTC: the Leblanc r2 run held
  `gpu-train.lock` 09:28 to about 10:13, then the shared ComfyUI queue was busy and
  ComfyUI held 7 GB with an empty queue; one `POST /free` (ComfyUI's own API, the gate's
  own step; ComfyUI was not restarted) brought the card to 2.5 GB, the gate passed at
  2,522 MB for 3 minutes, no other trainer, lock taken and released at the end.
- 53 epochs, **wall 30.2 min**, 1.13 it/s, final average loss **0.0446**, whole-card
  VRAM peak 11,823 MB (`out/vram.csv`).

| Step | sha256 |
|---|---|
| 500 | `76a3e96b25c4781b65755dd360563574fe8534294efe296b97b163be5ed0923f` |
| 1000 | `c9f2993aeac880e39cc90af941481d654e9ccdf47a284477d2743e4b3536cd10` |
| **1500 (picked)** | `aaae49b42d47fbea6f8d0257750461c35a2431f2023ea421480b3fea473a78db` |
| 2000 | `884f00bca11de82009c4a7d563833a66467be583469295ed1941e2c59cbfdd20` |

Installed as `D:/Tools/ComfyUI/ComfyUI/models/loras/ormi-x2-r2.safetensors` (= step 1500,
`aaae49b4...`); every step is under `models/loras/ormi-steps-r2/`.

**The pick** (`pick-sheet.jpg`, built by `pick-sheet-r2.py`), 1:1 against the installed idle:
- **Block 0, the idle pose through the production recipe** (`render-r2.mjs idle`: the
  idle skeleton, the idle's costume words, the defect negatives), round-1 LoRA as a
  control, then steps 500 to 2000, seeds 9300 to 9302. The first pass carried `flat
  color, matte` in the emphasis and drew skin-coloured topknots at steps 500 to 2000 and
  a flat finish; those words were replaced by `(dark red topknot:1.15), cheek mark`
  (render-r2.mjs) and the pick was made on the second pass (`idle.v2step*`). Step 500:
  topknot right in every seed (its costume was not compared at 1:1); **1000, 1500, 2000: maroon topknot
  with a red tie and a striped tassel in every seed, the temple scar in most, crimson
  sleeves, purple kimono, yellow sash, teal curtain with its ornament, purple hakama with
  a gold diamond hem (bigger diamonds than idle's), open sandals, one shield**. 1500 and
  2000 are hard to tell apart; 1500 picked (round 1's step, less fitted).
- **Block 1, the trigger alone** (`lora-ormi.mjs steptest`, no costume words, as round 1's
  pick): **r2 is worse here than r1.** Steps 500 to 2000 draw an orange or orange-and-teal
  hakama in half the seeds and sometimes two shields; the round-1 LoRA under the same
  prompt draws a purple hakama (`cand/control-r1/`). So **LoRA r2 needs the costume
  words** (the production prompt always has them).
- **Block 2, an unseen pose** (ko, no ko image was trained): every step and the round-1
  control fill the lying frame with extra shields and mats; 1500 and 2000 seed 9311 keep
  one heart shield and the topknot. Not a discriminator between steps.

## 3. Renders

`render-r2.mjs <state>`: LoRA r2 0.8, the round-2 skeletons (`skeletons-r2.py`), the idle
(square + head crop) as IP-Adapter reference at 0.3, the idle's costume words, the
negatives for every defect the round-1 judges named for Ormi (a second or back shield,
glossy / neon / airbrushed, the sash over the belly, orange sleeves, the white translucent
hem, heart brooch or clasp on the chest, a missing or lifted leg, a hair patch, closed
shoes), 28 steps, cfg 6. (Leblanc's fan words do not apply to Ormi and were not used.)
Every render and repaint queued alone behind an empty shared queue.

Skeletons fixed as the judges asked: **attack** drives both arms out at shoulder height so
the shield leads; **hurt** plants both feet; **ko** lies flat, head right. Cast is
round 1's (at the bar).

| Batch | What | Result |
|---|---|---|
| a | all four x6, s85 skeletons (ko s70) | cast 980101 and 980105 clean; attack and hurt fill the 832x1216 frame with extra shields and cloth (guard rejects); ko: 980305 clean but its shield runs off the frame edge |
| b | attack, hurt, ko x6: s70 skeletons, fewer shield words, CN 0.75 to 0.85 | the smaller figure left an empty top half that filled with shields, a second head, a giant topknot; hurt 980202 winces (head back) but its torso is all red |
| c | attack on a **1024x1024** canvas with the lunge refitted (`skel-attack-sq.png`); hurt s85 CN 0.8 with stronger recoil words; ko on 1536x640 (`skel-ko-wide.png`) | **attack 980002: one shield, leading, a heart on it, both legs**; hurt 980203: a stagger with a wince; ko wide: worse (cropped bodies, rows of shields) |

Method check (hard rule 15) after batch b: the extra shields are not a word problem; they
fill **empty canvas**. A canvas shaped to the pose (square for the lunge) fixed attack;
for ko no canvas worked, so the one clean frame was edited instead.

## 4. Local repaints (masked, not re-rolls)

`../poses/repaint.mjs` (now also `--root`, `--loraFile`, `--size` for round-2 frames),
`erase-poly.py`, `cut-r2.mjs`; every step and seed is in `picks-r2.json` and the sidecars'
`edits`.
- **The red cord knot.** LoRA r2 draws an invented red knot with tassels at the collar or
  belly in most frames (a cousin of round 1's heart clasp). Painted out in attack (982201,
  a small gold tassel remains), cast (982003 then the tassel end 982013) and hurt (982106).
  In ko every repaint drew a gold medallion instead, so ko keeps its small knot.
- **ko:** the shield standing on edge behind his head ran off the right frame edge (a
  straight cut in the cut-out) and could not be repainted into idle's shield (six seeds
  drew orange glossy domes; an inpaint drew pillows and a second head), so it was erased
  (`erase-poly.py`), the back of the head and the topknot regrown (981036: maroon topknot,
  red tie, striped tassel), the chest heart badge painted out (981041), and the grey-blue
  floor shadow whitened by pixels.
- Not repainted: attack's shield rim (no red studded band), the missing topknot tassels on
  attack and cast, hurt's sash bow, ko's hakama squares.

## 5. Install, backup, manifest

`install-r2.mjs` (reads `picks-r2.json`): cut-outs to `public/art/characters/ormi/`, sidecars
with `status: CANDIDATE`, `note: best available, below bar`, `method: lora-r2+openpose`,
`seed`, `loraStep: 1500`, `scale`, the edit chain and the judge block. Backups in
`D:/Tools/pyrefly-art-backup/candidates/2026-09-23-lora-r2/ormi/`: `replaced/` (the round-1
redo png + json of all four) and `picks/` (raw, cut-out, sidecar of each pick). `npm run
art:manifest` regenerated (gitignored; it lists subjects and poses, so it did not change).

Installed sha256: attack `9b203c99...`, cast `27a95207...`, hurt `df0f3970...`, ko `b3890392...`.

## 6. In-game scale

Own vite server on a random port (5633, then 5856 after the first died on a locked file in
another agent's browser profile), `PYREFLY_BROWSER=gpu` (ANGLE D3D11 on the RTX 5070 Ti),
stopped by its PID. `ingame.mjs`: `__pyrefly.gotoChapter('ffx2-leblanc')`, past the title
card, HUD off, then the Act I Ormi (`ormi-entrance`, spriteKey `ormi`) forced into each state
with `setPose(state, {immediate, force})`. The battle camera moves between rigs (round 1's
unpaired numbers were off by up to 12 percent from depth alone), so each state is measured
**paired with idle** a few frames before and after under the same camera (drift under 0.7
percent). Head size is the judge's measure (`measure.py`: the skin area of the head flood
filled from scalp seeds, square-rooted): idle 122.7 px, attack 118.0, cast 101.9, hurt
105.1, ko 147.4 (box stops above the neck under the thrown-back jaw). `scale` = idle /
pose.

| State | scale | Figure on screen vs idle | **Head on screen vs idle** |
|---|---|---|---|
| attack | 1.04 | 0.872 | **0.999** |
| cast | 1.20 | 1.079 | **0.999** |
| hurt | 1.17 | 0.888 | **1.026** |
| ko | 0.83 | 0.399 (height of a lying figure) | **1.008** |

(`scale-check-r2.json`, `ingame-r2.json`.) Looked at in the battle: all four face the party
like the idle (the engine mirrors the whole set the same way), the ko lies on the floor
line, cast's raised fist makes him taller than idle, the lunge and stagger shorter.

## Files

`dataset-r2.py`, `dataset-r2.md`, `skeletons-r2.py` -> `skel-*.png`, `skel-overlay.jpg`,
`render-r2.mjs`, `erase-poly.py`, `cut-r2.mjs`, `picks-r2.json`, `install-r2.mjs`,
`pick-sheet-r2.py` -> `pick-sheet.jpg`, `sheet-r2.py` -> `sheet.jpg`, `ingame.mjs`,
`measure.py`, `heads-r2.json`, `ingame-r1.json`, `ingame-r2.json`, `scale-check-r2.json`,
`ingame-r1-*`, `ingame-r2-*`. Raw frames, cut-outs and sidecars:
`D:/Tools/pyrefly-lora/ormi/r2/poses/<state>/`; training: `D:/Tools/pyrefly-lora/ormi/r2/`.
Changed outside this folder: `tools/gen/lora-ormi.mjs` (`train --toml --out --name`,
`upscale --src --dst`; defaults unchanged), `../poses/repaint.mjs` (`--root --loraFile
--size`; without them the graph and paths are unchanged).

## Hard rule 6

Research 10.1 (`research/ffx2-leblanc-syndicate.md`) supports only the stout build, the
large shield on his back with the Syndicate heart, and purple samurai-style attire. The
topknot, sleeves, sash, curtain, hem and shield colours are matched to the installed idle,
not to a source; the heart on the shield is the research's.
