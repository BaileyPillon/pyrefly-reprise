# Leblanc LoRA round 2: dataset grown, retrained, poses re-rendered, scale checked in battle (2026-09-23)

FFX-2 only (Chapter 6, the Leblanc Syndicate boss art; AGENTS.md hard rule 14: a
per-subject art pass, no game file, no shared tool, no FFX art touched). **Every
installed image is a CANDIDATE.** Nothing was added to
`docs/target/approved-hashes.json` (sha256 `3c5af02f...c15c` before and after, no
Leblanc entry); `D:/Tools/pyrefly-lora/tools/verify-approved.mjs` gave ok 115,
mismatched 0, missing 0 before and after. Nothing was downloaded; ComfyUI was never
restarted.

**Sheet:** `sheet.jpg`. One row per state: idle and the pick whole (scaled), then 1:1
crops, idle's region first: face, costume, feet, fan. The last row puts the four
round-1 picks this round replaced beside the four round-2 picks.
**In battle:** `ingame-after-<state>.png` (2x device pixels, the Chapter 6 battle,
fixed `enemy` camera), `ingame-after-ko-clear.png` (the same ko with Logos hidden for
one frame so the head shows), `ingame-after-heads.jpg` (each head cut from those shots
at 4x on a 2.5 CSS px grid), and the round-1 poses as they were before this round,
`ingame-r1-*.png`.

## 1. Dataset (`../dataset-r2.md`, `../build-dataset-r2.py`)

Round 1's 11 images unchanged (10 idle views at repeats 2, the portrait face at 1),
plus 8 pose images at repeats 1 from the round-1 outputs a judge scored 6 or above:
the four installed redo picks (`attack.v7.2` below the chin only, the face has the
named hair patch; `cast.r2red` full and upper, the red-and-silver fan; `hurt.v4.5` full
and upper with the named fan tassel erased in the copy; `ko.r2` full and upper) and
`hurt.v3.1` above the robe hem only (the missing leg is below it). Excluded, each for a
costume detail a judge named: `attack.v3.3` (closed-toe boots, wing lobes),
`cast.v3.6` (lavender leaf), `ko.v3.2` (closed-toe boots, tan guard), `cast.r2black`
(black leaf; the brief sets red and silver). Captions are view and pose words only.
29 samples an epoch. Every source and sha256 is in `dataset-r2.md`.

## 2. Training and the step pick

`node tools/gen/lora-leblanc.mjs train --steps 2000 --dim 32 --alpha 16 --round r2`:
round 1's settings exactly (kohya `sdxl_train_network.py`, Animagine XL 4.0 Opt,
networks.lora dim 32 / alpha 16, U-Net only, AdamW8bit, lr 1e-4 cosine, 100 warm-up,
batch 1, 1024 bucketed, bf16, min-SNR 5, seed 4545), saved every 500. The GPU gate and
the shared lock were obeyed: it waited from 09:16 to 09:28 UTC behind other agents'
ComfyUI renders, took `gpu-train.lock` after 3 minutes of an empty queue under 4 GB,
and released it at the end. **Wall 44.1 min (2644 s), exit 0, final average loss about
0.039, peak 15.5 GB for the whole card** (other agents' renders shared the card; round 1
was 30.5 min and 10.9 GB alone). Outputs in `D:/Tools/pyrefly-lora/leblanc/out-r2/`:

| step | sha256 |
|---|---|
| 500 | `a1ad59b23797904a72b4a1eac917537646e097c47d11462fa193d903e0c398f5` |
| **1000 (picked)** | `e43d3801569f77280dafb2e3827384de5b6f10d2874ba375dc7a5db82f5bbc6f` |
| 1500 | `97cf8fd8d80d921b4479ae7c0b6cd9ab5bc2ac336ffc4bd848833bac9d9a94ea` |
| 2000 | `b099274209c8160686133a85afd7966150a22268c5fc45b8fd177050e3fa05ca` |

Step test (`steptest --tag steptest-r2`, round 1's graph: 832x1216, LoRA 0.8, idle
IP-Adapter 0.3, seeds 9600 and 9601) on round 1's LoRA and each r2 step, in the idle
pose and in a pose no dataset image shows (a kneel, since the lunge is now in the set),
once trigger-only and once with the costume words the pose renders use.
`pick-sheet.jpg` (whole), `pick-crops-idle.jpg` and `pick-crops-kneel*-<seed>.jpg`
(1:1 against the installed idle: head, costume, feet).

| | idle, 1:1 against the installed idle | unseen kneel, trigger only | unseen kneel, with the costume words |
|---|---|---|---|
| r1 1500 | near copy | blonde; **fan back at the mouth** (seed 9600) | blonde; one dark hair patch at the cheek |
| r2 500 | robe hem drifts (an orange underlayer) | seed 9600 blue hair | not run |
| **r2 1000** | hair, face, studded choker, heart, obi, knot, tassel, open-toe boots: all as idle | 9601 blonde and clean; 9600 **blue hair** | **both seeds blonde; the cleanest heads of any step** (the thinnest cheek shade) |
| r2 1500 | as 1000 | 9601 grows a blue underside streak; 9600 lilac hair | blonde; a dark patch beside the eye on 9600 |
| r2 2000 | as 1000 | as 1500 | blonde; a black patch at the cheek on 9601 |

**Picked step 1000**, installed as
`D:/Tools/ComfyUI/ComfyUI/models/loras/leblanc-x2-r2.safetensors` (sha256
`e43d3801...bc6f`; the four step files are in `models/loras/pyrefly-lora-steps/`).
What r2 changed: the fan no longer comes back at the mouth in a pose that is not idle
(the memorised prop round 1 named). What it did not fix, and a new risk: without the
colour words the unseen pose can drift to blue or lilac hair at every r2 step. With the
words (every pose render uses them) all steps stay blonde. Boots: r2 still draws
closed-toe boots in most standing frames, so the open toes still come from masked
repaints.

## 3. Renders and picks

`node poses/render.mjs <state> --set r2` (LEBLANC_R2_STEP=1000): LoRA r2 0.75 to 0.85,
xinsir OpenPose 0.6 to 0.9 on the fixed skeletons (`poses/skeletons/r2/`: the v7 strike
that leads with the fan, the v4 recoil that keeps both legs, cast unchanged, and a new
flat ko, `lying_r2` in `skeletons.py`), the idle as IP-Adapter reference at 0.3, the
idle's costume words (the open fan worded red and silver for cast), and negatives for
every named defect (closed-toe footwear, two or second fan, fan or hand to mouth, black
patch or dark shadow on the face, glossy or shiny finish, fan tassel on hurt, head on
arm or sleeping on ko). 6 per state, seeds 61601-61606, 61701-61706, 61801-61806,
61901-61906; all 24 passed the black-frame check; `cutout-guard` rejected
`attack.r2.4` (the frame fills the canvas). Local defects were fixed with masked
repaints (`poses/repaint.mjs --lorafile leblanc-x2-r2.safetensors`), not re-rolls.

| State | Pick (seed) | Why this one | Repairs | Self-judged at 1:1 |
|---|---|---|---|---|
| attack | `attack.r2.3` (61603) | the only frame facing the party with the fan leading at arm's length and both boots planted (r2.1 faces screen-right with one boot; r2.5 holds two fans; r2.6 an open fan; r2.2 and r2.4 swing away) | open-toe boots (81001); the dark cheek and jaw patch (81103, now a thin shade like idle's); painted ground shadow cleared (`shadow.py`, bottom band) | 7: hair, face, heart, obi, knot, tassel, dress, fan, boots as idle. Off: the choker's studs are pale smudges; a white highlight strand over the eye; the robe lining is bluer than idle's |
| cast | `cast.r2.2` (61702) | the arm straight up, the fan open overhead, clean hair; the fan came out red with black guards and pale silver ribs (research §10.1) without a recolour (r2.1 paints red foliage; r2.4 and r2.5 a red robe lining; r2.6 a lacy choker) | open-toe boots (82001); jaw patches (82103); a stud on the choker (82202); the black patch left of the neck recoloured as neck (`jaw.py --palette neck`) and lightly repainted (82302) | 6: the far hair's underside is still a solid black mass behind the neck, and the choker is a plain band with one stud, not idle's row |
| hurt | `hurt.r2.2` (61802) | a wince with a pout, a hand on the stomach, a studded choker, both legs, no fan tassel (r2.1 and r2.4 have the tassel; r2.3 a red robe lining) | open-toe boots (83001) | 7: face, choker, heart, dress, robe, fan, boots as idle. Off: the lean back is milder than the skeleton's; the hand hides the obi's knot |
| ko | `ko.r2.1` (61901) | flat on her side, eyes closed, the fan arm out along the ground, a studded choker, knot and tassel (r2.2 is propped up; r2.3 to r2.5 rest the head on an arm; r2.6 has a lacy choker) | open-toe boots (84001), toes refined (84101); no painted shadow to clear | 6: the boots are a deep purple where idle's are lavender; the head still lies near the arm |

These scores are mine. By the round-3 rule nothing passes until an independent judge
says so.

## 4. Size in the running battle

`PYREFLY_BROWSER=gpu node round2/ingame.mjs --tag after`: its own Vite server on a random
port in 5400-5990, stopped by its own PID; `gotoChapter('ffx2-leblanc')`, the entrance
fight won on `autoBattle` at skip speed, auto handed back in Leblanc's fight; each state
forced with `battle().stage.actor('leblanc').setPose(state, {immediate, force})` on the
fixed `enemy` camera; on-screen box from `stage.projectRect`, Logos's box as a zoom check.

Head size = sqrt(bob width x crown-to-chin), read at 2x on gridded crops of each
installed PNG (`heads.json`); width alone is wrong for a head that looks up (cast) and
length alone for a lying one (ko). A first pass measured the hurt bob at 176 px where it
is 207; the in-battle head crop showed hurt's head wider than idle's, so all five were
re-measured and the scales redone.

| State | head (PNG px) | sidecar `scale` | head vs idle in the engine | head vs idle on screen |
|---|---|---|---|---|
| idle | 171.2 | none | 100% | 100% |
| attack | 191.0 | **0.90** | 100.4% | 100.2% |
| cast | 147.7 | **1.16** | 100.1% | 102.2% |
| hurt | 186.5 | **0.92** | 100.2% | 102.9% |
| ko | 181.1 | **0.95** | 100.5% | 99.8% |

All within 5 percent (`ingame-after.json`). LOOKED at `ingame-after-*.png` and
`ingame-after-heads.jpg`: the heads read as one size across the five states. Hurt's bob
is about 9% wider than idle's while its crown-to-chin is shorter (the recoil tips the
bob toward the camera); the combined size is inside 5%.

Seen in battle, not art defects of this round, reported for whoever owns them:
- **The ko head lies behind Logos.** The prone plane is centred on Leblanc's slot, so
  her head reaches into Logos, who stands in front. Round 1's ko did the same
  (`ingame-r1-ko.png`). A staging question (the ko anchor or slot), not a paint one.
- **Action poses glow.** In `attack`, `cast`, `hurt` and `ko` her white dress and hair
  bloom to near white with a ring under her; idle does not. The same happens to Yuna in
  that frame, so it is the presenter's state lighting, not the art; it hides the face at
  game size.

## Open for Bailey

1. The four picks next to idle (`sheet.jpg`) and in battle (`ingame-after-*.png`).
2. Hard rule 6, unchanged: this round used research §10.1's red and silver for the open
   fan, as the brief says; the idle's closed fan stays black.
3. An independent 1:1 judge before anything is called a pass (round 1's method,
   `../judge.md`).

## Files

- `../dataset-r2.md`, `../build-dataset-r2.py`; `tools/gen/lora-leblanc.mjs`
  (`--round r2`, the `kneel` and `kneelwords` step-test prompts).
- `pick-sheet.jpg`, `pick-crops.py`, `pick-crops-*.jpg` (the step pick).
- `../poses/render.mjs` (`--set r2`), `../poses/skeletons.py` + `../poses/skeletons/r2/`,
  `../poses/repaint.mjs` (`--lorafile`), `contact.py`, `halves.py` (look aids).
- `picks.json`, `install-r2.mjs` (installs, writes sidecars with `scale`, backs up),
  `ingame.mjs`, `heads.json`, `igheads.py`, `ingame-*.png`, `ingame-*.json`,
  `sheet.py`, `sheet.jpg`.
- Raw frames, cut-outs, masks and sidecars: `D:/Tools/pyrefly-lora/leblanc/poses/*.r2.*`
  (not committed), backed up to
  `D:/Tools/pyrefly-art-backup/candidates/2026-09-23-lora-r2/leblanc/all-candidates/`;
  the installed four in that folder's root; the round-1 files they replaced in
  `replaced/`.
- Installed: `public/art/characters/leblanc/{attack,cast,hurt,ko}.{png,json}`
  (gitignored; `status: CANDIDATE`, `method: lora-r2+openpose`, `seed`, `step: 1000`,
  `scale`, `repairs`). `idle.png` untouched. `tools/gen/cast.json`'s Leblanc rows carry
  the r2 recipe with round 1's under `history`. The manifest was regenerated (leblanc
  `attack, cast, hurt, idle, ko`).
