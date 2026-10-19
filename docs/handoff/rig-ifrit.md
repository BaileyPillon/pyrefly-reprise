# The Ifrit rig (branch `rig-aeons`, commit ac760630b, 2026-10-19)

> **Release 58 status (brought in by the release 58 assembly):** this rig is ON in release 58 (the art mirror `D:/pyrefly-art-r58` lists `ifrit`), on the release driver's delegated pick (item 138) under Bailey's "Single-costume figures first" (2026-10-18) and "in advance i will go with all your recommendations". FFX only: no FFX-2 chapter fields the art id. Where this note says the rig "stays OFF" and that nothing is merged or installed, it is the lane's own state on the day it wrote it. The review that follows the deploy owes the rigged KO, hurt and attack a look (`critic/CHECKS.md` CHK-026 item 9: the harness now reads a rigged figure).

Bailey, 2026-10-18: "Single-costume figures first"; Valefor approved 2026-10-19; "keep going please": Pterya, Ifrit, Shiva.
**Game case: FFX only.** Ifrit is an FFX aeon (`characters/ifrit/*`, one costume across idle, attack, cast, hurt and KO: palette 0.94 to 1.00). It stands on the field as the possessed Ifrit of Chapter III link 3 and as a summon in 11 more chapters (1, 2, 7, 9, 10, 12, 14, 17, 18, 21h, 27); plan `fielding.json`. No FFX-2 chapter fields it (the FFX-2 aeon art is `x2-*`). The twin, Grothia (Chapter XIV), has its own paintings: **register it first** (see the Pterya handoff: a twin's canvas can sit 60 px off the base's).
**State: gated `ok`, `--verify` passes, the rig stays OFF** (`D:/pyrefly-art-rigs/ifrit`: 7 parts, 19 bones, 6 keys, 3,593 vertices, 4.91 Mpx, 6.09 MB, a `1x/` tier proved). Nothing is installed into any art mirror, merged, deployed or reviewed.

## The gate, verbatim (`node tools/rig-gate.mjs --rig D:/pyrefly-art-rigs/ifrit --art D:/pyrefly-art-r55`, then `--verify`)

```
rig-gate: ifrit: OK; 6 of 6 key(s) pass; rest overlap 1.000; 51 poses scanned for holes at 11 joints; 7 parts, 19 bones, 3593 vertices, 4.91 Mpx, 6.09 MB; 4.2 s
  ok   idle       idle     iou 1.000  stature 0.999  feet -0.002, 0.001  head n/a
  ok   attack     standing iou 0.776  stature 0.949  feet 0.012, 0.001  head n/a  landmarks 0.026
  ok   cast       standing iou 0.973  stature 1.002  feet -0.002, 0.001  head n/a  landmarks 0.007
  ok   hurt       standing iou 0.774  stature 1.018  feet -0.018, -0.005  head n/a  landmarks 0.025
  ok   ko         ko       iou 0.687  stature 0.915  feet -0.023, -0.001  head n/a  landmarks 0.025  AUTHORED
  ok   overdrive  standing iou 0.686  stature 1.002  feet -0.007, -0.033  head n/a  landmarks 0.025  AUTHORED
rig-gate: wrote gate.status ok into D:\pyrefly-art-rigs\ifrit
rig-gate: PASS
rig-gate: D:/pyrefly-art-rigs/ifrit: verified: stamp ok (6 key(s), full coverage), 1x tier proved (14 file(s))
rig-gate: PASS
```
(`ifrit-gate-output.txt`, `ifrit-verify-output.txt`, `ifrit-gate.json`.)

**Painted versus authored: three painted (attack 0.776, cast 0.973, hurt 0.774), two authored (KO 0.687, Overdrive 0.686), plus the idle.** The painted margins are thin (attack 0.026, hurt 0.024 over the 0.75 bar). The `landmarks 0.025` readings are the fitter's mark aim (`mark_free` 0.025), not an accident.
**The KO keeps the idle's size**: only the four leg bones scale (0.9 to 1.15) and the head moves by at most 0.06 of the image (a unit test holds both); in the real fight the head mesh area is 0.1594128 in hurt and in KO (below).

## What is cut, and how (`tools/rig/subjects/ifrit.json`, `ifrit_hooks.py` (empty), `ifrit.keys.json`)

Cut from `idle@2x` by polygons and the underlaps only (no SAM). Back to front: `tailU` (the thin curved upper tail), `tailL` (the thick lower curl), `armF` (the far arm, dark), `legF` (far leg), `legN` (near leg: thigh, shin, foot), `body` (torso, back mane, scaled hips and the NEAR ARM, which hangs in front of the knee: cut with the body, not as a limb), `head` (face, beard mane, both horns). The seams: body under head 60 px, tails under the body, far limbs under the near ones and under the body, 10 underlaps in all. At rest the composite differs from the painting in 8,170 of 2,064,276 opaque pixels by more than 30 (0.4 percent).
Bones (19, parents first): `root`, `pelvis`, `chest`, `head` (pivot at the shoulder, under the horn); `armF0..2`; `thighF/shinF/footF`; `thighN/shinN/footN`; `tailL0..2`; `tailU0..2`. The idle sways the chest, head, far arm and both tails by small sinusoids; no spring chains (every one of these bones is posed by a key).
Landmarks: `head` (the eye: the one thing every painting draws the same way), `toeN`, `toeF`, `handF` (the far hand's lowest claw), `tailU`, `tailL` (the tails' tips), `bodyCenter`. The horn tips were not marked (the horns are drawn differently in each painting).

## How it was fitted (effort)

Marks first (`lane_marks.py`, 300 restarts, about 70 s a pose; 17 runs) found every mark reachable inside 0.02 before any silhouette fit. 4 fit rounds, 40 fit jobs in all (r1 10, r2 12, r3 12, r4 6 jobs; about 6 minutes a round at 8 processes, below normal priority, one fit slot). What the rounds taught:
- **Round 1** (rotations only, offset on the pelvis only): attack 0.609, hurt 0.826 but its stance 0.039 off, the KO and Overdrive balled up. The attack painting draws the head 170 px further forward than the idle's and cannot be reached by rotating a head that has no neck.
- **Round 2** gave the head its own offset (0.22): attack still 0.645, and **a head offset that large opens a 110 to 170 px hole at the head joint in the blends** (the 100 px skirt of head pixels under the body does not cover it).
- **Round 3**: head offset 0.06 and a 60 px skirt, the stance weight `feet_x_w` 10 (the hurt key's stance), the head limits of the KO and Overdrive tightened: attack **0.776, painted**, hurt 0.774 painted, no hole in any blend except the Overdrive's (hole at the head, 1,145 px: the head folded 90 degrees).
- **Round 4**: KO head limit 35, Overdrive head 50: no hole, gate ok.
About 1 hour 10 minutes wall clock for the subject (11:10 to 12:20 including the recording, which ran in the background while Shiva's cut was made).

## The harness: the real KO swap, Chapter III link 3 (the possessed Ifrit), rig on and off (`rec/ko`, `rec/ko-off`; `ko-summary.json`)

Seed 1, `autoBattle('intended')` from the first menu of link 3 (reached by `reach`: links 1 and 2 are fought at skip speed, about 45 s), an exact 60 Hz virtual clock, the real GPU, 1600 x 900. In both runs the engine's HP reaches 0 at frame 217 (the fight is short: Ifrit starts that link at 579 of 2,585 HP after the party's Overdrives) and the **pose swap hurt to KO is at frame 264**, hurt at 263.

| at the KO swap | painting set (rig off) | the rig |
|---|---|---|
| head size | the continuity probe's own row: **357.6 px to 291.3 px, ratio 0.8147, an 18.5 percent cut** | head mesh area **0.1594128 in hurt and 0.1594128 in KO: ratio 1.0000**; min/max 1.0000 over the 64 frames of the window |
| projected box | 478.2 x 510.1 to 479.4 x 357.7 (height x0.701), centre moved **88.2 px in one frame** | 473.9 x 514.7 to 476.7 x 517.3 (x1.005), moved 2.0 px (a blend of about 40 frames follows) |
| outline (probe) | area x0.655, centroid shift 99.8 px, IoU 0.358, feet moved 71 px | the probe records no swap with the rig on (vacuous) |
| worst one-frame step (tracker) | head **124.9 px**, centroid 71.3 px, both AT frame 264 (a hard cut) | head 25.2 px (frame 269), centroid 13.5 px, feet 8.7 px: inside the ease |
| whole figure (mesh area) | - | 0.71993 to 0.71883: x0.9985 at the swap |

The census had Ifrit's hurt-to-KO head at 0.830 (17 percent) in older runs and the possessed Ifrit at 19.8 percent: this run reads 0.815.

## Sheets and clips (the real game, Chapter III link 3 with Yuna, Tidus and Auron on the field, rig on beside the painting set)

`D:/Tools/pyrefly-scratch/2026-10-19/rig-aeons/ifrit/for-bailey/`: `ifrit-rig-1-attack-cast-hurt.png`, `ifrit-rig-2-ko-overdrive.png` (left the rig, right the painting the game uses today), `ifrit-rig-3-before-after.png` (HURT and KNOCKED OUT, painting set above, rig below, same camera and crop, numbers in the captions).
Clips `ifrit/clips/{attack,cast,hurt,ko,overdrive}.mp4`; recordings `ifrit/rec/{poses,poses-off,ko,ko-off}`; `ko-summary.json`. The Overdrive's right panel is the approved painting file (the game's painted actor stays idle for it).

## What still looks wrong

1. **The KO is a ball**: the body folds forward and the head tucks under the chest between the arms (authored, 0.687); the painted KO is a flat, long, low beast with its snout forward. Seen with the chest rotated 50 degrees and the head 35; the head cannot lead because it has no neck and may not stretch.
2. **The attack head does not lunge** as far as the painting's (the head offset is held to 0.06 so no blend opens a hole); the rig leans in and lowers the head, overlap 0.776.
3. **The Overdrive is a crouched, folded figure** (0.686, authored); the painting is another drawing (a charge on four limbs, flames for fur). The game never draws the painted Overdrive on the battle plane, so the key may never be seen. The Overdrive's feet are 0.033 off the idle's ground (the gate waives it for this key).
4. **Seams**: a polygon cut through fur and horn at the head/body line (x = 445) and the near forearm cut with the body; at 60 px of head skirt a head moved more than that shows a ghost band of fur. No hole in 51 poses at 11 joints.
5. The cast glow (painted light at the chest), the open mouth of the attack and the fur's soft fringe are not carried (cut parts have no feather, the engine's edge-feather item is still open). The idle motion is sinusoids only. The possessed Ifrit is drawn with a red tint by the game: the poses mode resets it, so the clips show the creature untinted.

## Making it again

`PY=D:/Tools/ComfyUI/python_embeded/python.exe`; from `D:/pyrefly-rig-valefor` with `public/art` a junction to `D:/pyrefly-art-r55`: `$PY -I tools/rig/rig.py cut --subject ifrit`, `... build`, `node tools/rig/rig-targets.mjs --subject ifrit --out D:/pyrefly-art-rigs-work/ifrit/targets --art public/art --costume idle --scale 2 --baseline 1001 --root .`, then **skip the fit**: copy `tools/rig/subjects/ifrit.keys.json` to `D:/pyrefly-art-rigs-work/ifrit/fit/keys.json`, `$PY -I tools/rig/rig.py export --subject ifrit`, `node tools/rig-tiers.mjs write --rig D:/pyrefly-art-rigs/ifrit`, `node tools/rig-gate.mjs --rig D:/pyrefly-art-rigs/ifrit --verify --art D:/pyrefly-art-r55`.
To refit: `lane_marks.py --subject ifrit --pose <pose>` first (the inits are in the config under `fit.keys.<pose>.init`), `lane.py fit --poses ... --seeds 3 --tag rN`, `lane.py select --tag rN --write`; delete `lane/eval` and every `lane/<tag>/sel*` and `final` after a rebuild.
Recording: `PYREFLY_BROWSER=gpu node tools/rig/lane/record.mjs --subject ifrit --out <dir> --modes poses,ko --off --cap 40000`; then `lane.py clips ... --painting-file overdrive=public/art/characters/ifrit/overdrive.png`, `lane.py sheets`, `lane.py hurtko`, `node tools/rig/lane/ko-summary.mjs --on <rec>/ko --off <rec>/ko-off`.

## Tests

`npx vitest run tests/unit/tools/rig-subject-ifrit.test.ts` (13 tests: the config, draw order, underlaps, bones, marks, the keys never scale a head or a body, the registry entry as the possessed Ifrit of Chapter III link 3). `npx tsc --noEmit`: only the six `pause-living-portrait-*` tests that import `docs/concepts/...` (the sparse tree has no `docs/`).
