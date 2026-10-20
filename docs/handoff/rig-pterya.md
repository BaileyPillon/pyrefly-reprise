# The Pterya rig (branch `rig-aeons`, commit ccdca69a8, 2026-10-19)

> **Release 58 status (brought in by the release 58 assembly):** this rig is ON in release 58 (the art mirror `D:/pyrefly-art-r58` lists `pterya`), on the release driver's delegated pick (item 138) under Bailey's "Single-costume figures first" (2026-10-18) and "in advance i will go with all your recommendations". FFX only (Chapter XIV, link 2). Where this note says the rig "stays OFF" and that nothing is merged or installed, it is the lane's own state on the day it wrote it. The review that follows the deploy owes the rigged KO, hurt and attack a look (`critic/CHECKS.md` CHK-026 item 9: the harness now reads a rigged figure).

Bailey, 2026-10-18: "Single-costume figures first"; 2026-10-19: Valefor's rig approved ("ok looks good"), "keep going please": Pterya, then Ifrit, then Shiva.
**Game case: FFX only.** Pterya is Isaaru's Valefor in Chapter XIV (`isaaru-via-purifico`, link 2, enemy actor `pterya`, art id `pterya`); `fielding.json` has no other chapter that fields the sprite (foe 14 only; no FFX-2 chapter, no hidden chapter, no summon). One costume across idle, attack, cast, hurt and KO.
**State: gated `ok`, `--verify` passes, the rig stays OFF** (`D:/pyrefly-art-rigs/pterya`: 8 parts, 24 bones, 6 keys, 2,889 vertices, 5.79 Mpx, 8.14 MB, a `1x/` tier proved). Nothing is installed into any art mirror, merged, deployed or reviewed.

## What a twin really is (a finding for the kit)

The plan called Pterya a silhouette twin of Valefor at about 0.05 M tokens, one command. **The command as it stood did not work here**: Pterya's paintings are Valefor's silhouettes on canvases with **60 px more margin on every side** (idle 1785 x 950 against 1665 x 830; the silhouettes agree to IoU 0.9994 at alpha 128 once shifted by (60, 60), in all six poses), and every number of the cut config is a pixel of the BASE's painting. The first twin cut put every polygon 60 px off: 405,272 opaque pixels of the rest composite wrong (Valefor: 9,732), and the gate refused the hurt key (feet -0.021). Nothing in the gate would have caught the mis-cut parts (it passes on silhouettes), so the rig would have shipped with parts torn along wrong lines.
Fix, in the kit (`tools/rig/lane/lane_twin.py`, tests in `test_lane.py` and `rig-subject-pterya.test.ts`): `lane.py twin` now **registers each pose's twin painting onto the base's** (integer translation by FFT cross-correlation of the alpha-128 masks, refused under IoU 0.97) and moves every coordinate of the config (cut polygons and predicates, bones, skin joints, build landmarks, each pose's marks), records it as `_twin_shift`, names what it could not move, and renames the painted keys' source labels to the twin's paintings. `--no-register` keeps the old behaviour. The other twins (Grothia/Ifrit, X2 Shiva/Shiva, Spathi/Bahamut, X2 Ixion/Ixion, X2 Anima/Anima, the 16 `exp-leblanc-*`) must be checked for the same offset: **register first, never copy a config blind**.

## The gate, verbatim (`node tools/rig-gate.mjs --rig D:/pyrefly-art-rigs/pterya --art D:/pyrefly-art-r55`, then `--verify`)

```
rig-gate: pterya: OK; 6 of 6 key(s) pass; rest overlap 0.998; 51 poses scanned for holes at 16 joints; 8 parts, 24 bones, 2889 vertices, 5.79 Mpx, 7.79 MB; 6.5 s
  ok   idle       idle     iou 0.998  stature 0.997  feet 0.001, -0.001  head n/a
  ok   attack     standing iou 0.884  stature 0.963  feet -0.008, -0.004  head n/a  landmarks 0.025
  ok   cast       standing iou 0.973  stature 0.994  feet -0.000, -0.004  head n/a  landmarks 0.013
  ok   hurt       standing iou 0.901  stature 1.010  feet -0.005, -0.006  head n/a  landmarks 0.028
  ok   ko         ko       iou 0.568  stature 0.850  feet 0.154, 0.004  head n/a  landmarks 0.037  AUTHORED
  ok   overdrive  standing iou 0.481  stature 0.909  feet 0.096, 0.026  head n/a  landmarks 0.029  AUTHORED
rig-gate: wrote gate.status ok into D:\pyrefly-art-rigs\pterya
rig-gate: PASS
rig-gate: D:/pyrefly-art-rigs/pterya: verified: stamp ok (6 key(s), full coverage), 1x tier proved (16 file(s))
rig-gate: PASS
```
(`pterya-gate-output.txt`, `pterya-verify-output.txt`, `pterya-gate.json` in this folder.)

**Painted versus authored: three painted (attack 0.884, cast 0.973, hurt 0.901), two authored (KO 0.568, Overdrive 0.481), plus the idle.** The keys are Valefor's (`tools/rig/subjects/pterya.keys.json`, claims dropped, sources renamed), re-measured by the gate against Pterya's own paintings: the twin's keys land within 0.005 of Valefor's overlaps. No key scales a head, neck, wing, chest, pelvis, tail or plume (only the four leg bones, 0.9 to 1.15; a unit test holds it): **the KO keeps the idle's size**.

## Harness: the real KO swap, Chapter XIV link 2, rig on and off (`rec/ko`, `rec/ko-off`; `ko-summary.json`)

Seed 1, `autoBattle('intended')` from the first menu of link 2 (reached by `reach`: link 1 is fought at skip speed, 1 s), an exact 60 Hz virtual clock, the real GPU, 1600 x 900. In both runs the engine's HP reaches 0 at frame 266 and the **pose swap hurt to KO is at frame 319** (hurt at 318).

| at the KO swap | painting set (rig off) | the rig |
|---|---|---|
| head size | the continuity probe's own row: **344.1 px to 259.8 px, ratio 0.7551, a 24.5 percent cut** (the largest head jump of the 20 swaps of the run) | the head mesh area is **0.0238649 in hurt and 0.0238649 in KO: ratio 1.0000**, and min/max 1.0000/1.0000 over the 63 frames of the window |
| projected box (`projectRect`) | 606.6 x 406.1 to 659.7 x 354.7 (height x0.873), centre moved **90.7 px in one frame** | 617.0 x 419.4 to 617.5 x 420.3 (x1.003), moved 4.1 px (a blend of about 40 frames follows) |
| outline (probe) | area x0.556, centroid shift 92.7 px, IoU 0.235 | the probe records no swap of Pterya with the rig on (vacuous, as in every rig handoff) |
| worst one-frame step through the camera (tracker) | head **84.8 px**, centroid 47.4 px, both AT frame 319 (a hard cut) | head 27.6 px, centroid 18.8 px, at frame 324 (inside the ease) |
| whole figure (sum of the mesh areas) | - | hurt 0.47208, KO 0.47128: x0.998 at the swap; the body crouches and the wing droops over the next 25 frames |

Same finding as Valefor's: the painted KO is a smaller creature in a flat pose (the plan's census: head 0.76 of the hurt's), the rig keeps the creature and bends it.

## Sheets and clips (the real game, Chapter XIV link 2, rig on beside the painting set)

`D:/Tools/pyrefly-scratch/2026-10-19/rig-aeons/pterya/for-bailey/`: `pterya-rig-1-attack-cast-hurt.png`, `pterya-rig-2-ko-overdrive.png` (left the rig, right the painting the game uses today), `pterya-rig-3-before-after.png` (HURT and KNOCKED OUT, the painting set above and the rig below, same camera and crop, the numbers in the captions).
Clips: `pterya/clips/{attack,cast,hurt,ko,overdrive}.mp4` (60 fps, rig left, painting right). Recordings: `pterya/rec/{poses,poses-off,ko,ko-off}`. Tables: `ko-summary.json`.
The sheets use the kit's new overrides: the attack crop widened to the left (the lunging head left the projected box), and the Overdrive's right panel is the approved painting file (the game's painted actor draws no `overdrive` pose on the battle plane: it stays idle, as Valefor's lane found).

## What still looks wrong

1. **The KO is a crouch under the wing, the head tucked** (authored, overlap 0.57): in the Chapter XIV frame Isaaru stands in front of Pterya's KO and covers the head; in the sheet the creature reads as a wing and a body low on the floor. The painted KO (a small flat creature, head forward) is not reachable by one costume at one size, which is the point.
2. **The Overdrive is a balled-up swoop** (0.481, authored); the game never draws a painted Overdrive on the battle plane, so the key may not be seen.
3. **Hard feathers at the wing tip and plume** (cut parts have no feather; the engine's edge-feather item is still open), and the painting's **soft outer glow**: the painting carries a glow ring of 359,293 pixels at alpha 25 to 64 (kept at the edge of the parts) and 807,381 at alpha 1 to 24 (dropped by the cut's alpha 24 bar). The rig draws less glow than the painting.
4. The cast's glow and the attack's open beak are painted effects the rig does not carry. Idle motion is sinusoids only.
5. Shared with Valefor: the cut runs by polygon through feather texture; a hard line shows if a wing or the neck moves far beyond the keys.

## Effort

About 1 hour 10 minutes wall clock from the start of the lane (10:00 to 11:10), including the kit pieces the later subjects needed (twin registration, `reach` for an actor that is not on the field at the first menu, the `ko` mode and `ko-summary.mjs`, the sheet overrides and `lane.py hurtko`). 2 fit-free steps: no fit ran for Pterya (the keys are the base's). Tokens: not metered inside this lane.

## Making it again

`PY=D:/Tools/ComfyUI/python_embeded/python.exe`; from `D:/pyrefly-rig-valefor`: `$PY -I tools/rig/lane/lane.py twin pterya --of valefor --subject pterya --run` (registers, cuts, builds, exports; about 80 s), then `node tools/rig-tiers.mjs write --rig D:/pyrefly-art-rigs/pterya` and the gate with `--verify`.
Recording: `PYREFLY_BROWSER=gpu node tools/rig/lane/record.mjs --subject pterya --out <dir> --modes poses,ko --off --cap 30000` (`ko` needs `docs/target/pose-measure.json` in the tree for the probe: copy it from `origin/rig-v2` and remove it after), then `lane.py clips ... --crop attack=545,262,760,450 --painting-file overdrive=public/art/characters/pterya/overdrive.png`, `lane.py sheets`, `lane.py hurtko`, `node tools/rig/lane/ko-summary.mjs --on <rec>/ko --off <rec>/ko-off`.
