# Leblanc battle poses with the identity LoRA (2026-09-23)

> **Superseded for the installed picks by `redo.md`** (the redo after the independent
> judge, `../judge.md`). `sheet.jpg` now shows the redo; this pass's sheet is in git
> history (a6386b2). The v3 skeletons for attack and hurt are in `skeletons/v3/`.

FFX-2 only (Chapter 6, the Leblanc Syndicate boss art; AGENTS.md hard rule 14:
a per-subject art pass, no shared tool, no game file, no FFX art touched).
**Every image here is a CANDIDATE.** Nothing was added to
`docs/target/approved-hashes.json`; its 115 files hash the same before and
after this run (`D:/Tools/pyrefly-lora/tools/verify-approved.mjs`: ok 115,
mismatched 0, missing 0).

**Sheet:** `sheet.jpg`. One row per state: the installed idle (x0.5), the
round-3 candidate this run replaced (x0.5), the new pick as installed (x0.5),
then idle's face and the pick's face at 1:1, and idle's costume and the pick's
costume (heart, obi, knot, tassel, dress, robe) at 1:1. Every candidate:
`candidates.jpg`.

## Recipe (`render.mjs`)

- `leblanc-x2.safetensors` (the step-1500 LoRA, sha256 `9639a582...e5d5`,
  trigger `leblancX2`; dataset and pick in `../dataset.md`), LoraLoader at 0.75
  to 0.85 on model and clip.
- IP-Adapter plus (ViT-H), method F: the installed idle square-padded on white
  plus the head crop (`pilot2/refs/idle-square.png`, `idle-head.png`),
  ImageBatch, concat, 0.3, ease in, 0.2 to 0.6, K+V.
- xinsir ControlNet OpenPose SDXL, strength 0.5 to 0.7 over the whole
  schedule, on a full-body skeleton drawn in PIL per state (`skeletons.py`;
  18 COCO keypoints in the controlnet_aux colours and limb order, at the idle's
  own scale, facing as the idle: three-quarter to screen-left, so her left side,
  the fan hand, is the near side). `skeletons/overlay.jpg` shows the idle's
  skeleton on the idle and each state's skeleton.
- Animagine XL 4.0 Opt, 28 steps, cfg 6, euler_ancestral / normal. 832x1216
  for attack, cast and hurt; **ko on 1216x832**, the prone canvas the
  installed ko already uses (a figure lying on its side does not fit 832 px
  wide at the idle's scale). Core ComfyUI nodes plus the installed IP-Adapter
  node; nothing downloaded or installed.
- Words: the trigger, the state's Danbooru pose tags, then the idle-truth
  costume words (`pilot2/identity-idle.txt` with the pilot-2 judge's
  corrections: crimson obi with no "gold", the heart as a small mark). No
  effect words. Negative: the sprite negative plus the costume drifts
  (thighhighs, closed robe, gold obi, red or pink fan, two fans) and
  `fan to mouth` for every state (the LoRA's memorised idle prop), plus
  `smile, smirk, grin, wink` where the state needs it.
- Cut out with `tools/gen/rembg.py` (isnet-anime); every cutout went through
  `tools/gen/cutout-guard.mjs` and the black-frame check. Five renders were
  rejected by the guard (a painted backdrop filling the frame: attack 4 and 5,
  hurt 4, attack v3.4, hurt v3.4). No black frame. 14 to 17 s per render on
  the shared queue, one prompt at a time behind an empty queue; ComfyUI was
  never restarted and no training ran.

```bash
PY=D:/Tools/ComfyUI/python_embeded/python.exe
P=docs/concepts/chapters/leblanc/lora/leblanc/poses
$PY -s $P/skeletons.py                                    # skeletons/*.png, overlay.jpg
node $P/render.mjs attack --set v3 --n 1,2,3,4,5,6        # likewise cast, hurt, ko
node $P/install.mjs                                       # picks -> public/art/characters/leblanc, sidecars, backup
node tools/gen/manifest.mjs
$PY -s $P/sheet.py                                        # sheet.jpg
```

## What was run, and what changed between sets

1. **Pilot (sets 1 and 2 of every state).** The LoRA plus the skeleton
   worked at once: every frame wore idle's costume (white halter dress,
   crimson obi with the knot and tassel, the purple robe off the shoulders
   with its diamond pattern, lace-up boots, studded choker, red heart), which
   five prompt-only rounds never managed. Cast and ko read at once. Attack
   came back as a raised-knee step and hurt stood upright, so both
   skeletons were re-posed (`skeletons/v1/` keeps the pilot's): a deeper
   lunge with the front thigh near level and the back leg straight, and a
   stronger lean back for hurt. The attack words dropped `bent knee` and the
   negative gained `leg up, knee up, raised leg, kicking`.
2. **Sets 3 to 8** (attack and hurt 3 to 8 on the new skeletons; cast and ko
   3 to 6). Good poses, but at 1:1 **every frame's hair was a cool ash
   platinum** against idle's warm pale blonde, and most boots were closed-toe.
   Cause: my words, not the LoRA. The prompt said `platinum blonde hair` and
   `open-toe boots`; `identity-idle.txt` says `blonde hair` and
   `open-toe footwear`, and the LoRA's own step test (trigger only) drew warm
   blonde.
3. **Set v3** (6 per state, the same seeds and strengths as sets 1 to 6, the
   two words corrected). Hair is idle's warm blonde in all 24. Open-toe boots
   in about half. The picks all come from v3.

## The picks (self-judged at 1:1 against idle, round-3 criteria, worst criterion scores)

| State | Pick | Seed, LoRA / OpenPose | Worst | Why |
|---|---|---|---|---|
| attack | `attack.v3.3` | 61103, 0.75 / 0.6 | **6** | A fan **strike**: lunge to screen-left, weight forward over the front leg, the black closed fan (idle's) driven out ahead, v-brows, closed mouth. Warm blonde bob, purple eyes, studded choker, red heart, crimson obi with knot and purple tassel, white halter dress, robe off the shoulders. Off: **closed-toe** lace-up boots (6); the robe flares into wing shapes and its diamonds are fainter than idle's (7). |
| cast | `cast.v3.6` | 61206, 0.75 / 0.7 | **6** | Fan arm straight up with the fan open overhead, looking up at it, the other hand low: reads as casting. Open-toe lace-up boots, crimson obi, heart, choker and robe match the idle. Off: the **open fan's leaf is lavender** with black-and-white ribs. The idle's fan is only ever seen closed and black, so its open colour is unsourced (hard rule 6; research §10.1 says red and silver). |
| hurt | `hurt.v3.1` | 61301, 0.8 / 0.6 | **6** | A recoil: head thrown back, eyes screwed shut, clenched teeth, hand clutching the stomach, the fan arm flung back; the same robe, obi, dress, heart and black closed fan as idle, and an open-toe boot. Off: the far leg is hidden behind the robe, so only one boot shows (6). Both eyes are shut rather than one (7). |
| ko | `ko.v3.2` | 61402, 0.8 / 0.7 | **6** | On her side, head to screen-left, both eyes closed, no smile, the black closed fan under her hand; costume as idle. Off: **closed-toe** boots (6); rembg kept a painted ground shadow under the body (6). |

Against round 3 (every state 4, `../../../sets/leblanc/round3/judge.md`) this
closes the named failures: attack is a strike, not a flourish; hurt wears the
same robe and winces; cast raises the arm and the open fan, with no backbend;
ko has both eyes closed and no wink. What holds all four at 6 is small and
named: boot toes on attack and ko, an unsourced open-fan colour on cast, one
hidden leg on hurt, and a painted shadow on ko. **None reaches the bar of
7.** These scores are my own. The round-3 rule wants an **independent** judge
before anyone calls this a pass.

Runners-up worth a second look: `attack.3` (the same strike with the ash
hair), `hurt.7` (a one-eye wince with a staggered step, ash hair),
`cast.v3.2` / `cast.v3.1`, and `ko.v3.5` / `ko.v3.6`.

## Size against idle

The picks are at the idle's pixel scale (heads about 200 to 230 px against
idle's about 210). Attack is 832x983 with baselineY 967, lower and wider than
idle (a lunge). Hurt's baselineY is its one visible foot. `PaintedActor`
sizes each pose by world height from `baselineY` to the top of the content.
Whether a crouching lunge should render shorter than the idle in the scene
has **not** been checked in the running game.

## Files

- `skeletons.py`, `skeletons/` (the four state skeletons plus idle's; `v1/` =
  the pilot's attack and hurt), `render.mjs`, `install.mjs`, `sheet.py`,
  `look.py`, `flat.py` (look aids), `sheet.jpg`, `candidates.jpg`.
- Raw frames, cutouts and sidecars for all 52 candidates:
  `D:/Tools/pyrefly-lora/leblanc/poses/` (not committed), backed up in
  `D:/Tools/pyrefly-art-backup/candidates/2026-09-23-leblanc-lora/leblanc/all-candidates/`.
  The four installed files and sidecars are in that folder's root. The
  round-3 files they replaced are in `replaced-2026-09-23/`.
- Installed: `public/art/characters/leblanc/{attack,cast,hurt,ko}.{png,json}`
  (gitignored; sidecars carry `status: CANDIDATE`, `candidateOf`,
  `method: lora+openpose`, the seed, the LoRA step and strength, the skeleton,
  and the judge notes). `idle.png` is untouched. `tools/gen/cast.json`'s
  Leblanc row has the new recipe per state, with the old entries under
  `history`. The manifest was regenerated and lists leblanc `attack, cast,
  hurt, idle, ko`.

## Open for Bailey

1. **The four picks next to idle** (`sheet.jpg`): use them, or ask for more.
2. **Hard rule 6, unchanged:** the open fan's colour (the idle never opens
   it; the LoRA paints lavender, research says red and silver), and whether
   the idle's costume should move toward research §10.1 at all (thigh-highs,
   a triangle pattern). This run follows the idle, as the brief says.
3. **Cheap next steps, not run:** a masked foot repaint to put open toes on
   the attack and ko boots (method as the round-3 feet repaint); the ko
   shadow removed with a stricter matte; an independent 1:1 judge pass.
