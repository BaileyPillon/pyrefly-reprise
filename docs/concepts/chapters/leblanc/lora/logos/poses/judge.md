# Logos battle states with the logos-x2 LoRA + OpenPose (2026-09-23)

FFX-2 only (Chapter 6, Chateau Leblanc art; Logos exists only in FFX-2; no shared tool,
game file or FFX chapter changed, AGENTS.md hard rule 14). **Every image here is a
CANDIDATE.** Nothing was added to `docs/target/approved-hashes.json`: its 115 files hash
the same before and after this run (`D:/Tools/pyrefly-lora/tools/verify-approved.mjs`,
115 ok / 0 mismatched both times; the file itself sha256 `3c5af02f...c15c` before and after).

**Sheet:** `sheet.jpg`: per state the idle (the anchor) whole, the installed file whole,
then native 1:1 crops of the face/helmet and of the costume (shoulder emblem, strap,
sash). Built by `build-sheet.py` from the crop boxes in `crops.json`. Every candidate of
every state is in `renders/cands-<state>[-r2].jpg`.

## Recipe (what `render.mjs` runs)

- Animagine XL 4.0 Opt -> `LoraLoader` **logos-x2.safetensors** (kohya step 2000,
  sha256 `2252538f...8d9`, see `../dataset.md`) at **0.85**, model and clip.
- `IPAdapterAdvanced` (ip-adapter-plus ViT-H) on an `ImageBatch` of `refs/idle-square.png`
  (the installed idle `64a43dc9...d925f` flattened on white, padded square) and
  `refs/idle-head.png` (head, helmet and shoulder emblem, box 200,0,480,280), concat,
  **0.3**, ease in, 0.2 to 0.6, K+V: pilot 2's method F (`make-refs.py`).
- `ControlNetApplyAdvanced` with the xinsir OpenPose SDXL model on a full-body COCO-18
  skeleton drawn in PIL per state (`draw-poses.py`, OpenPose colours and limb order,
  facing left like the idle, bone lengths from the idle's own skeleton), 0 to 0.8.
- KSampler 28 steps, cfg 6, euler_ancestral / normal; 832 x 1216 (ko 1216 x 832, the
  pipeline's prone canvas: a lying figure at the idle's scale does not fit 832 wide).
- Prompt: `logosX2, 1boy, solo,` + view and pose words + the idle-truth costume words in
  `identity-idle.txt` (read off the idle's pixels) + `simple background, (white
  background:1.2)` + the house style and quality blocks. `lintSpritePrompt` must strip
  nothing (no effect words), or the run stops. Negative: `SPRITE_NEGATIVE` +
  `FACING_NEGATIVE` (not for ko) + the costume drifts the earlier rounds hit (hat, crest,
  fin, plume, winged helmet, pauldrons, shoulder armor, chain, skirt, bare legs, tinted
  backgrounds) + per-state negatives.
- rembg cutout and the cut-out guard on every render; black-frame check; one prompt at a
  time behind the shared ComfyUI queue (it was shared with the ormi and leblanc pose runs
  the whole time); ComfyUI was never restarted. No training, so the GPU gate did not apply.

### Tuning before the batch (attack, 2 to 3 seeds each; `renders/attack.*.p*.png`)

| Pass | Change | What 1:1 showed |
|---|---|---|
| p | LoRA 0.8, costume words `blue kimono ... grey hakama` | Both revolvers aimed; helmet on-model; but a SHORT kimono top, a pale grey hakama split open on a bare thigh, no emblem, grey and khaki backgrounds |
| p2 | LoRA 0.85, `blue robe, long robe, open robe, gradient clothes`, `(white background:1.2)`, neg `bare legs, thighs` | The idle's long robe with the violet fade and the white radial emblem came back; hakama still pale and split |
| p3 | `dark blue hakama, hakama pants`, neg `skirt` | Slate hakama, no bare thigh; emblem missing on both |
| p4 | + `white shoulder emblem` | White radial disc with the brass ring on all 3. **This is the batch recipe.** |

Round 1 then rendered 6 seeds per state (`96101-6`, `96201-6`, `96301-6`, `96401-6`).
Two states needed a second round (below): hurt (`--pose hurt2 --cn 0.85`) and ko
(`--extra "(gun on ground:1.3), (two revolvers:1.2), revolver on floor, dropped gun"`).

## Picks and scores (self-judged by the painter; an independent pass is still owed)

The round-3 judge's criteria (`../../../sets/logos/round3/judge.md`), each 0 to 10 against
the idle at 1:1; **the score is the worst criterion; pass is 7.** Round 3's scores for the
replaced files are in brackets.

| State | Pick | Hair | Face | Skin | Helmet | Outfit | Marks | Weapon | Style / framing | Pose as state | **Score** |
|---|---|---|---|---|---|---|---|---|---|---|---|
| attack | `96101` | 8 | 7 | 7 | 8 | 7 | 7 | 7 | 8 | 7 | **7** [4] |
| cast | `96201` | 8 | 7 | 7 | 8 | 7 | 7 | **6** | 8 | 8 | **6** [4] |
| hurt | `96303.r2` | 8 | **6** | 7 | 8 | **6** | 7 | 7 | 7 | **6** | **6** [4] |
| ko | `96402.r2` | 8 | 7 | 7 | **6** | 7 | 7 | 7 | 7 | 8 | **6** [3] |

**One headgear design in every state** (the named failure of three earlier passes): all
four picks wear the idle's silver dome with the short front visor and the thin jaw
strap; attack, cast and hurt show the idle's ribbed sides at 1:1. No slotted visor, cage,
grille, fin, crest or brim anywhere in the 36 renders of the batch. **The Syndicate disc
on the shoulder:** the idle's white radial disc with the black strap and brass ring on
every pick (only the near shoulder can show in a profile; the far shoulder is hidden in
all five states, idle included).

### attack `96101` (7): Double Shot

Both revolvers straight out toward the party at two heights (far arm high, near arm
low), torso forward, the robe and sash swinging back, a serious profile under the visor.
Against idle: helmet ribbing and visor match; white disc, black strap, brass ring; purple
sash; the robe's blue-to-violet fade; a slate-to-navy hakama; white wraps with a black
band; black slide sandals. Off: the legs read as a striding step more than a deep lunge
(the near knee comes up under the robe instead of planting forward); both revolvers have
the same blued-silver finish (idle: one blued, one silver). Nothing touches the canvas
edge (content 31..822 of 832). Head about 147 px helmet top to chin against idle 145, so
no scale override. Rejected: `96102`/`96103`/`96104`/`96106` (one revolver, or both hands
on one gun), `96105` (the second revolver held back at the hip, not aimed).

### cast `96201` (6; weapon): Russian Roulette

A revolver raised barrel-up beside the helmet, the other revolver low in the near hand,
a slight smirk: it reads as the deliberate one-shot moment. The skeleton raised the NEAR
arm; the model raised the far arm instead (behind the head), which still reads, and keeps
the emblem shoulder clear. Off: the low revolver hangs from a finger through the trigger
guard while the fist closes on a grey stub, **the idle's own defect** (round-3 judge,
idle, weapon 5), which the LoRA learned from its one painting. Scale override **0.9** (head
about 160 px, helmet about 157 px wide, against idle 145 / 140). Rejected: `96202` to
`96205` (a third revolver at the hip), `96206` (the raised revolver overlaps the visor).

### hurt `96303.r2` (6; face, outfit, pose)

Round 1 (skeleton `hurt`, OpenPose 0.6) came back upright and walking in all 6 seeds
(`renders/cands-hurt.jpg`): the LoRA saw one standing painting and pulls toward it. Round 2
drew a deeper recoil (`hurt2-pose.png`: hips dropped, torso about 30 degrees back, head
thrown back, the front foot off the floor) and raised OpenPose to 0.85; four of six now lean
back. The pick: torso and head thrown back, arms flung apart with a revolver in each hand,
the front foot lifting. Off: the face is mostly hidden by the visor at this angle, mouth
only slightly open (no clear wince); the robe covers most of the hakama, so the idle's
slate layer barely shows; it reads as a stagger back more than a hard hit. Rejected:
`96302.r2` (strongest pose, head back with an open mouth, but a black blob at the mouth
at 1:1), `96304.r2`/`96305.r2` (one revolver or lean too slight),
`96301.r2`, `96306.r2` (upright).

### ko `96402.r2` (6; helmet)

Lying on his back, head toward the party, eyes shut, helmet on, and **exactly two
single-barrel revolvers on the floor** (one by the head, one by the hand). Round 1 dropped
no revolver in 4 of 6 and three guns (two double-barrelled) in `96406`; round 2 added the
dropped-gun words. Off: seen from above, the dome shows an engraved ribbed band across
the brow that the idle's side view never shows (the same helmet family, a surface the
LoRA had to invent); brown wooden grips (idle: dark grips). Cutout 1159 x 302; the helmet
spans about 145 px along the body against idle's 140, so no scale override (round 3's ko
needed 0.7). Rejected: `96401.r2`/`96403.r2`/`96405.r2` (one revolver), `96404.r2`/`96406.r2`
(three).

## What this run shows

- **The LoRA fixed identity drift.** In all 45 renders (9 tuning + 36 batch) the helmet, emblem, strap, sash, robe
  fade, wraps and sandals stayed the idle's; round 3's worst criteria (helmet 4, marks 4,
  weapon 3) are 6 to 8 here. What still fails is small and local.
- **The LoRA's limit is its dataset.** One standing painting: it resists poses far from
  it (hurt needed a stronger skeleton and OpenPose 0.85) and reproduces the idle's own
  defects (the hanging revolver in cast). A second training round that adds the best
  frames of this run (attack `96101`, cast `96201` after a fix, ko `96402.r2`) would give it
  more than one pose, if Bailey approves any of them.
- **Local fixes still owed** (pixel edits, not re-rolls): the cast near hand (repaint the
  grip in the fist, masked, idle's gun crop as reference); ko grip colour; hurt face if
  Bailey wants a visible wince.
- **Not seen in battle yet.** The scale of cast (0.9) and the others (1.0) is measured at
  1:1 on the PNGs, not in a running fight.

## Hard rule 6, still open

The Syndicate logo's shape is unsourced (research 10.1 says "the Syndicate logo on both
shoulders" and nothing more); every pick draws the idle's white radial disc because the
idle does. The purple helmet tie strip and the chin protector the research names are not
in the idle and so not in the LoRA; no pick shows them.

## Files

- `make-refs.py`, `refs/`: the two IP-Adapter references (`refs/refs.json` records the idle hash)
- `draw-poses.py`, `*-pose.png`, `poses-preview.jpg`: the skeletons (`hurt2` is round 2)
- `identity-idle.txt`: the costume words read off the idle
- `render.mjs`: the renderer (`node render.mjs <state|all> [--seeds 6] [--lora 0.85] [--cn 0.6] [--ref 0.3] [--tag t] [--pose stem] [--extra tags] [--negextra tags]`)
- `renders/`: every cutout and provenance JSON (raw frames stay local, `.gitignore`), run logs, `cands-*.jpg`
- `install.mjs`: installs a pick as CANDIDATE and backs up what it replaces
- `cand-sheet.py`, `build-sheet.py`, `crops.json`, `sheet.jpg`: the review sheets

Exact commands used (from this folder):

```bash
PY=D:/Tools/ComfyUI/python_embeded/python.exe
$PY -s make-refs.py; $PY -s draw-poses.py
node render.mjs attack --seeds 2 --tag p                  # then p2, p3 (--lora 0.85), p4 (3 seeds)
node render.mjs all --seeds 6 --lora 0.85 --cn 0.6         # round 1
node render.mjs hurt --seeds 6 --lora 0.85 --cn 0.85 --pose hurt2 --tag r2
node render.mjs ko --seeds 6 --lora 0.85 --cn 0.6 --tag r2 \
  --extra "(gun on ground:1.3), (two revolvers:1.2), revolver on floor, dropped gun" \
  --negextra "double barrel, rifle, holding gun"
node install.mjs attack 96101
node install.mjs cast 96201 --scale 0.9
node install.mjs hurt 96303.r2
node install.mjs ko 96402.r2
node ../../../../../../../tools/gen/manifest.mjs           # (from the repo root: node tools/gen/manifest.mjs)
$PY -s build-sheet.py
```

Installed (gitignored, local only): `public/art/characters/logos/{attack,cast,hurt,ko}.png`
+ sidecars (`status: CANDIDATE`, `candidateOf`, `method: lora+openpose`, `seed`,
`loraStep: 2000`, `renderTag`). The replaced round-3 files (`d55ff0b2`, `92fa6d76`,
`7d61c3e0`, `abf39146`) and the picks' raw frames are in
`D:/Tools/pyrefly-art-backup/candidates/2026-09-23-leblanc-lora/logos/{replaced,poses}/`.
The idle was not touched.
