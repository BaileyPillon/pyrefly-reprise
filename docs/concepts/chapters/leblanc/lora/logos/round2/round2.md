# Logos, round 2: repaired idle, LoRA r2, new battle states, in-game scale (2026-09-23)

FFX-2 only (Chapter 6, Chateau Leblanc art; Logos exists only in FFX-2; no shared tool, game
file or FFX chapter changed, AGENTS.md hard rule 14). **Every image here is a CANDIDATE.**
Nothing was added to `docs/target/approved-hashes.json` (sha256 `3c5af02f...c15c` before and
after, no Logos entry); `D:/Tools/pyrefly-lora/tools/verify-approved.mjs` reported 115 ok /
0 mismatched before (`approved-before.json`) and after (`approved-after.json`).

**Sheet: `sheet.jpg`.** One row per state, idle first: the idle whole (the anchor), the
installed file whole, then NATIVE 1:1 crops (no resampling) of the face/helmet, the costume
(emblem, strap, sash), the weapons and the feet (`build-sheet-r2.py`, boxes in `crops-r2.json`).
In-game: `ingame-compare.jpg` (round-1 files on top, round 2 below, same battle, same camera).

The idle repair, the grown dataset, the training and the step pick are in `dataset-r2.md`.
In short: the idle's hanging revolver was repainted so the fist grips it (0 pixels changed
outside the mask, `idle-hand-diff.png`); the dataset grew from 16 to 21 images (5 crops of the
round-1 picks, cut to leave out every costume fault a judge named); **LoRA r2 = step 2000,
sha256 `9f19d817...`, 35.5 min, peak 15.7 GB, loss 0.0377**, installed as
`models/loras/logos-x2-r2.safetensors`. At every r2 step the near hand grips its revolver; the
round-1 LoRA, rendered as the control, still paints it hanging from a finger.

## Recipe (`render-r2.mjs`)

Animagine XL 4.0 Opt -> LoRA **logos-x2-r2 at 0.85** -> IP-Adapter plus on the repaired idle
(`refs/idle-square.png` + `refs/idle-head.png`, concat, **0.3**, ease in 0.2..0.6, K+V) ->
xinsir OpenPose SDXL (0..0.8) on the round-2 skeletons (`draw-poses-r2.py`,
`poses-r2-preview.jpg`) -> 28 steps, cfg 6, euler_ancestral. Prompt: trigger + view and pose +
the costume words read off the idle (`../poses/identity-idle.txt`) + white background + house
style (`lintSpritePrompt` stripped nothing). Negative: house sprite and facing negatives + round
1's costume drifts + `NEG_R2`, every defect a judge named on Logos (closed shoes / boots, glossy
finish, mesh / grille / crosshatch disc, engraved or lettered helmet, helmet wings, slotted visor,
cage, chin spike, hanging gun, finger in the trigger guard, brown wooden grip, double barrel,
blank face, two ribbons, a sash tail in front) + per-state words. The brief's Leblanc-only
negatives (a second fan, a fan to the mouth, the red-and-silver fan) do not apply to Logos and
were not used (hard rule 14).

Skeletons, against what the judges faulted: **attack2** a deeper lunge, both revolvers leading
at shoulder height; **cast** unchanged (read as Russian Roulette); **hurt3** a recoil that keeps
both legs on the floor (hips back, torso about 25 degrees back, head thrown back, back knee bent,
front heel planted; round 1's hurt2 lifted the front foot); **ko** unchanged (lying on his back).

Candidates: attack 18 (`cands-attack-r2.jpg`, `-r2b`, `-r2c`), cast 6, hurt 6, ko 18; every
one in `renders/` with its provenance JSON. One prompt at a time behind the shared ComfyUI queue;
ComfyUI was never restarted; no black frames.

## Picks (self-judged at 1:1 by the painter; an independent judge pass is still owed)

Round-3 criteria, each 0 to 10 against the idle at 1:1; the score is the worst criterion; pass 7.

| State | Pick | Local fixes (masked, LoRA r2, 0 px changed outside the mask) | Score | sidecar `scale` |
|---|---|---|---|---|
| attack | `attack.99121.r2c` | shoulder disc: a lettered plate -> the idle's radial disc pasted and repainted at 0.55 (`attack.r2.98106`); a brass ring on the front of the sash (the fault the judge named on ko) -> a purple sash end at 0.55 (`attack.r3b.98124`) | **7** | **0.80** |
| cast | `cast.99204.r2` | none | **7** | **1.03** |
| hurt | `hurt.99303.r2` | a white hexagonal plate where the disc belongs: plate cleared to robe blue at 0.3, then the idle's radial disc pasted and repainted at 0.4 (`hurt.r2b.98311`) | **6** (below bar) | **0.88** |
| ko | `ko.99423.r2c` | brown wooden grip -> the idle's dark grip, a pixel recolour of warm hues inside the grip box (`ko.99423.r2c.grip`, 1,276 px, alpha identical) | **6** (below bar) | **0.81** |

- **attack (7).** Both revolvers aimed at two heights, a real lunge (near knee forward, far leg
  back, both sandals on the floor), serious profile under the visor. At 1:1: the idle's dome with
  the ribbed side band and slotted side plate, the radial disc (after the fix), black strap with
  the brass-rimmed lens, purple sash, violet-fading robe, slate hakama, white wraps with black
  bands, black open-toe slides. Off: both revolvers have the same blued finish (idle: one blued,
  one silver); a small black floor shadow stays under the front sole. Rejected: 99101 to 99106
  (one gun, a streamer cut at the canvas edge, three feet, a mesh disc, a raised knee), 99111 to
  99116 (tinted or black backgrounds that left an opaque floor between the legs in the cutout,
  a lettered disc), 99122 to 99126 (guns in opposite directions, canvas-filling crops that the cut-out guard
  failed, one revolver hidden).
- **cast (7).** A revolver raised barrel-up beside the helmet in a closed fist, a smirk, the other
  revolver **gripped** low (the grip fault is gone at the source). Helmet, disc, strap and lens,
  sash, hakama, wraps and slides are the idle's. Off: the disc is half hidden behind the lens ring
  at this angle. Rejected: 99202 (a grey blob behind the head), 99205 (the raised gun overlaps the
  visor); 99201 and 99206 were close seconds.
- **hurt (6, below bar).** Both legs on the floor (the fault the brief named), torso back, a
  clenched-teeth wince with an eye (round 1's blank profile face is gone), the far hand in the
  idle's black fingerless glove holding the blued revolver, the near hand on the silver one.
  Off: the recoil reads as a stagger back more than a hard hit (he leans back less than the
  skeleton asked); a lilac cloth end hangs at the front below the sash. Rejected:
  99301 (both hands on one gun, head so far back the eye is blank), 99302 (a floor artefact),
  99304 (upright), 99305 (one leg lifted), 99306 (one gun).
- **ko (6, below bar).** On his back, head toward the party, eyes shut, helmet on, the radial disc
  on the near arm, sash and slides right. Off: only one revolver lies on the floor (the second is
  not visible; most of the 18 ko candidates dropped the helmet, added a second helmet or a third
  gun, lay the wrong way or went off-model); seen from above the crown shows ribs the idle's side view
  never shows; a hard black floor shadow runs along the body (the round-1 judge's style note, not
  new). Rejected: 99405 (head toward the wrong side), 99411 (mesh disc, the cut-out guard failed a
  white floor blob), 99403/99404/99415/99421/99424/99426 (helmet off, spare helmets or three guns).

Installed (gitignored, local only): `public/art/characters/logos/{attack,cast,hurt,ko}.png`
(sha256 `1eafca2f...`, `47974fc7...`, `055803df...`, `cd2187b2...`) + sidecars (`status:
CANDIDATE`, `candidateOf`, `method: lora-r2+openpose[, then local fixes]`, `seed`, `loraStep:
2000`, `lora` with its sha256, `fixes[]` with every pass and its proof, `selfScore`, `bar`,
`scale`, `scaleNote`). The replaced files (round-1 picks and every intermediate install) are in
`D:/Tools/pyrefly-art-backup/candidates/2026-09-23-lora-r2/logos/replaced/`, the picks' renders
and fix chains in `.../picks/`. `node tools/gen/manifest.mjs` regenerated the manifest.

## In-game scale (`ingame.mjs`, `helmet.py`)

The engine sizes every pose at the idle's pixel scale (`PaintedScale.computePoseScale`) times the
sidecar `scale`. **Head size** = the helmet's longest chord at 1:1 (`helmet.py`: the silver region
flood-filled from a seed on the dome, the pale warm face and black hair kept out; the helmet is
rigid, so the chord does not change with how the head is turned; check images
`renders/helmet-*.png`, LOOKED at). Idle 156.4 px; attack 197.0, cast 151.7, hurt 172.4, ko 188.1.

`ingame.mjs` starts its own Vite server on a random free port in 5400..5990 (stopped by its own
PID), runs Chromium with `PYREFLY_BROWSER=gpu` (the RTX 5070 Ti), plays
`__pyrefly.gotoChapter('ffx2-leblanc')` through Act I on auto and hands the fight back the frame
Logos is staged (Act II, `logos-room`), then forces each state with `setPose(state, {immediate,
force})` and records `stage.projectRect`, the texture's content box, the sidecar scale and the
camera depth; idle is measured first and again last, and sizes are depth-normalised (size x
depth), because the battle camera drifts.

| State | Round 1 files (`ingame-before.json`) | Round 2, no scale (`ingame-noscale.json`) | **Round 2 with scale (`ingame-after.json`)** |
|---|---|---|---|
| attack | 104.2 % | 125.3 % | **101.2 %** (scale 0.80) |
| cast | 94.7 % (scale 0.9) | 97.3 % | **99.8 %** (scale 1.03) |
| hurt | 97.7 % | 114.3 % | **96.6 %** (scale 0.88) |
| ko | 143.1 % | 123.6 % | **99.3 %** (scale 0.81) |
| idle, second reading | 99.6 % | 99.1 % | 100.5 % |

Head on screen as a percentage of idle's. Every state is within 5 percent (the widest, hurt,
3.4 percent small). The round-1 ko drew his head 43 percent too big; round 2's is within 1 percent.
Screenshots (device scale 2, cropped around him): `ingame-after-{idle,attack,cast,hurt,ko}.png`,
whole frames `ingame-after-frame-{idle,ko}.png`; LOOKED at in `ingame-compare.jpg`: one head size
across the five states, the lunge reads as Double Shot, the raised revolver as Russian Roulette.

## Still owed

- **An independent judge pass** on the five installed files (the painter has scored one point
  high before). hurt and ko are below the bar and say so in their sidecars.
- **hurt**: a harder recoil (lean) without losing a leg or a gun; **ko**: a second revolver on
  the floor and no hard floor shadow. Both are whole-figure properties; a local repaint could add
  the second revolver (a paste of the first, mirrored, then repainted) if Bailey wants it.
- Hard rule 6, unchanged: the Syndicate logo's shape is unsourced (research 10.1 says only "the
  Syndicate logo on both shoulders"); every pick draws the idle's radial disc because the idle
  does. The chin protector and purple helmet tie strip research names are not in the idle.
- Nothing is approved; Bailey has not seen these.

## Commands (from this folder)

```bash
PY=D:/Tools/ComfyUI/python_embeded/python.exe
node fix2.mjs idle; node fix2.mjs idle.r2                      # the idle hand (pick 98014)
$PY -s build-dataset-r2.py build
node train-r2.mjs train --steps 2000 --dim 16 --alpha 8         # behind the GPU lock
bash pick-r2.sh; $PY -s pick-sheet-r2.py                        # step pick
$PY -s make-refs-r2.py; $PY -s draw-poses-r2.py
node render-r2.mjs all --seeds 6 --lora 0.85 --tag r2
node render-r2.mjs attack --seeds 6 --seed0 99111 --cn 0.75 --tag r2b --negextra "..."
node render-r2.mjs ko --seeds 6 --seed0 99411 --cn 0.75 --tag r2b --negextra "..."
node render-r2.mjs ko --seeds 6 --seed0 99421 --cn 0.6 --tag r2c --negextra "..."
node render-r2.mjs attack --seeds 6 --seed0 99121 --cn 0.6 --tag r2c --negextra "..."
node fix2.mjs attack.r2 hurt.r2 hurt.r2b attack.r3 attack.r3b
$PY -s r2-support.py recolor renders/ko.99423.r2c.png 132,246,205,292 renders/ko.99423.r2c.grip.png
node install-r2.mjs attack attack.99121.r2c --fix attack.r2.98106.fix,attack.r3b.98124.fix --scale 0.8 --score 7
node install-r2.mjs cast cast.99204.r2 --scale 1.03 --score 7
node install-r2.mjs hurt hurt.99303.r2 --fix hurt.r2b.98311.fix --scale 0.88 --score 6
node install-r2.mjs ko ko.99423.r2c --fix ko.99423.r2c.grip --scale 0.81 --score 6
node ../../../../../../../tools/gen/manifest.mjs                 # from the repo root: node tools/gen/manifest.mjs
PYREFLY_BROWSER=gpu node ingame.mjs --tag after                 # heads-after.json = the helmet chords
$PY -s build-sheet-r2.py
```
