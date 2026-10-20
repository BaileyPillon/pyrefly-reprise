# The Shiva rig (branch `rig-aeons`, commit 895f8000e; branch tip 399c0b013, 2026-10-19)

> **Release 58 status (brought in by the release 58 assembly):** this rig is OFF in release 58 and is NOT in the art mirror `D:/pyrefly-art-r58` (the release driver's delegated pick, item 138: Ifrit's and Pterya's go on, Shiva's stays off; three of its six keys (attack, KO, Overdrive) are authored because they are other drawings than the idle's gown, its attack is the idle with a lean and an arm swing, and its hurt passes the overlap bar by 0.003). The lane's subject config is in the tree (`tools/rig/subjects/shiva.json`), so it can be installed into a later mirror with `tools/art-mirror-add-rigs.mjs --subjects ...,shiva` when Bailey or the driver says so.

Bailey, 2026-10-18: "Single-costume figures first"; Valefor approved 2026-10-19; "keep going please": Pterya, Ifrit, Shiva.
**Game case: FFX only.** Shiva is an FFX aeon (`characters/shiva/*`). She stands on the field as the possessed Shiva of Chapter III link 5 and as a summon in 10 more chapters (1, 2, 7, 9, 10, 12, 14, 17, 18, 27); plan `fielding.json`. The FFX-2 Shiva (`x2-shiva`, Chapter XI) is a different art id and a twin by the census: **register it before copying** (the Pterya handoff: a twin's canvas can sit off the base's).
**One thing the plan's census did not say**: Shiva's paintings are NOT one costume drawn five times. The plan's palette similarity (0.94 to 1.00) is about colour. **Idle, cast and hurt are the same gown** (cast is the idle plus a glow, hurt is the gown bent back); **attack** is another drawing (ribbons and an ice crown, one foot on an ice star), **Overdrive** is another (a floating figure in white) and the **KO** is a figure lying flat at 0.48 of the idle's height. So only cast and hurt can be painted keys; the rest are authored.
**State: gated `ok`, `--verify` passes, the rig stays OFF** (`D:/pyrefly-art-rigs/shiva`: 8 parts, 24 bones, 6 keys, 2,515 vertices, 3.54 Mpx, 4.20 MB, a `1x/` tier proved). Nothing is installed into any art mirror, merged, deployed or reviewed.

## The gate, verbatim (`node tools/rig-gate.mjs --rig D:/pyrefly-art-rigs/shiva --art D:/pyrefly-art-r55`, then `--verify`)

```
rig-gate: shiva: OK; 6 of 6 key(s) pass; rest overlap 0.984; 51 poses scanned for holes at 13 joints; 8 parts, 24 bones, 2515 vertices, 3.54 Mpx, 3.97 MB; 4.5 s
  ok   idle       idle     iou 0.984  stature 0.998  feet 0.001, -0.000  head n/a
  ok   attack     standing iou 0.328  stature 1.045  feet -0.010, 0.015  head n/a  landmarks 0.048  AUTHORED
  ok   cast       standing iou 0.969  stature 0.998  feet 0.001, 0.001  head n/a  landmarks 0.002
  ok   hurt       standing iou 0.753  stature 0.955  feet -0.003, -0.006  head n/a  landmarks 0.025
  ok   ko         ko       iou 0.521  stature 0.497  feet 0.059, -0.029  head n/a  landmarks 0.024  AUTHORED
  ok   overdrive  standing iou 0.510  stature 1.068  feet -0.081, -0.000  head n/a  landmarks 0.024  AUTHORED
rig-gate: wrote gate.status ok into D:\pyrefly-art-rigs\shiva
rig-gate: PASS
rig-gate: D:/pyrefly-art-rigs/shiva: verified: stamp ok (6 key(s), full coverage), 1x tier proved (16 file(s))
rig-gate: PASS
```
(`shiva-gate-output.txt`, `shiva-verify-output.txt`, `shiva-gate.json`.) **The rest overlap is 0.984, not 1.000**: the cut leaves 1.6 percent of the silhouette unclaimed (fringes of the dreadlocks and spear tips beyond the polygons by more than the 40 px `nearest` reach); worth a second look before this rig is used.

**Painted versus authored: two painted (cast 0.969, hurt 0.753), three authored (attack 0.328, KO 0.521, Overdrive 0.510), plus the idle.** Hurt passes by 0.003: a fit that is that close is a coin flip on another seed (the four seeds of the last round read 0.736, 0.736, 0.753 and 0.746). The attack is **posed by hand** from the cast key (chest -0.10, head -0.08, both arms swung, the hair and the train flicked, all x0.7 of the pose in `hand_attack.py`; marks at the idle's head and feet): four fit rounds of it (16 jobs) against the ribbon-and-crown drawing, with the marks of that drawing, with fewer, and with the hem and legs held tight, all failed the planted-feet check (`key-feet-y` 0.034 to 0.040) while the marks-first search reached every mark inside 0.01. The hand-posing script is `D:/pyrefly-art-rigs-work/shiva/hand_attack.py` (`python -I hand_attack.py 0.7`).
**The KO keeps the idle's size**: only the four leg bones scale (0.9 to 1.15), and the head is a rigid part on a bone that only rotates (a unit test holds both).

## What is cut (`tools/rig/subjects/shiva.json`, `shiva_hooks.py` (empty), `shiva.keys.json`)

Cut from `idle@2x` by polygons and the underlaps only (no SAM). Back to front: `hair` (the dreadlocks with their ice spears: one part, one 4-bone chain), `legB` (far leg and the light-blue strip behind the legs), `train` (the black skirt and the gown's train, a 4-bone chain), `armD` (the hanging far arm), `body` (torso, neck base), `legF` (near leg, with the thigh and the skirt's front), `armU` (the raised arm), `head`. Bones (24): `root` (on the ground row 1131, the train's lowest point: the pose model's anchor), `pelvis`, `chest`, `head`; `hair0..3`; `armU0..2`; `armD0..2`; `thighF/shinF/footF`; `thighB/shinB/footB`; `train0..3`. Landmarks: `head` (the eye), `handU`, `handD`, `toeN`, `toeF`, `hairTip` (the main braid's spear), `trainTip`, `bodyCenter`. The idle sways the chest, head, hair, far arm and train by small sinusoids.

## How it was fitted (effort)

Marks first (`lane_marks.py`, 300 restarts, about 70 s a pose; 8 runs), then 4 fit rounds, 30 fit jobs (r1 10, r2 8, r3 8, r4 4; round 3 at 1,500 evals and 4 restarts took 9 minutes). The KO's marks reach only 0.044 (the painting is a flat figure at 0.48 scale); the gate's bar is 0.06. Wall clock for the subject about 1 hour 35 minutes (12:10 to 13:45), of which the cut and the first fit were 35 minutes and the attack key's hunt 50 minutes. The recording ran in the background; **the rig-off half of the KO harness is still owed** (see below).

## The harness: the real KO swap, Chapter III link 5 (the possessed Shiva)

Seed 1, `autoBattle('intended')` from the first menu of link 5 (reached by `reach`: links 1 to 4 fought at skip speed, about 100 s), an exact 60 Hz virtual clock, the real GPU, 1600 x 900. Engine HP 0 at frame 3512, **pose swap hurt to KO at frame 3559** (hurt at 3558). **Rig on** (`rec/ko`, `ko-summary.json`): head mesh area 0.0389244 in hurt and in KO, **ratio 1.0000**, min and max 1.0000 over the 64 frames of the window; the whole figure's mesh area 0.59337 in both (x1.000: the KO is a rotation of the same creature); the projected box moves 0.5 px at the swap and then the figure FALLS: the head goes (898, 285) to (741, 405) in 5 frames and then, in ONE frame (3565), to (693, 553): **the worst one-frame step is 155.9 px (head), 97.5 px (centroid), 79.7 px (feet)**, all at frame 3565, six frames after the swap; the figure is lying (head (693, 607)) by 3567 and then drifts down 8 px a frame. So the head is never resized, but the lie-down has a hard peak step of its own: a 90 degree root rotation of a 380 px figure about its feet, finished in about 6 frames. The ease the engine gives a key is the game's own `quadInOut` over the standard pose blend; the peak is in the rotation, not a cut (the frames 3562 to 3566 are in `ko-fall-frames.png`: she tips back and goes flat).
**Rig off (the painting set)**: PENDING. `REVIEW-BROWSER` (a release review timing frames, raised 12:50) stopped the rig-off run at its start; the recorder was stopped by PID. The plan's census gives the painted Shiva's hurt-to-KO as head 1.052 with the feet 283 px off in one cut (Chapter III log 72973096): the painted KO is a lying painting that replaces a standing one in one frame, so the comparison to make when the browser is free is that cut against this fall. Command: `PYREFLY_BROWSER=gpu node tools/rig/lane/record.mjs --subject shiva --out D:/Tools/pyrefly-scratch/2026-10-19/rig-aeons/shiva/rec2 --modes ko --off --cap 40000` (about 12 minutes; needs `docs/target/pose-measure.json` in the sparse tree: `mkdir -p docs/target && git show origin/rig-v2:docs/target/pose-measure.json > docs/target/pose-measure.json`, and `rm` it after; this lane removed its copy and set `skip-worktree` on it), then `node tools/rig/lane/ko-summary.mjs --on rec2/ko --off rec2/ko-off`.

## Sheets and clips (the real game, Chapter III link 5, Yuna and the party in front, rig on beside the painting set)

`D:/Tools/pyrefly-scratch/2026-10-19/rig-aeons/shiva/for-bailey/`: `shiva-rig-1-attack-cast-hurt.png`, `shiva-rig-2-ko-overdrive.png` (left the rig, right the painting the game uses today). The before/after sheet (`shiva-rig-3-before-after.png`) waits for the rig-off numbers in its footer. Clips `shiva/clips/{attack,cast,hurt,ko,overdrive}.mp4`; recordings `shiva/rec/{poses,poses-off,ko}`. The Overdrive's right panel is the approved painting file. In this chapter Yuna stands in front of Shiva's lower body in every frame (the party's line-up), so the gown is partly hidden in the clips.

## What still looks wrong

1. **Attack is the idle with a lean and an arm swing**, not the painted ribbon-and-crown attack: nothing of that drawing (ribbons, crown, the coil of braid) is carried. Overlap 0.33 (authored).
2. **The Overdrive is a stretched variant of the idle** (0.51, authored): the painting is a different figure in white; the game never draws the painted Overdrive on the battle plane.
3. **The KO is a figure falling flat** (0.52, authored): the fall is fast and has the 156 px peak step above; the painted KO has the hair streaming forward and the gown fanned out; the rig's hair and train hang as chains and trail behind.
4. **Hurt passes by 0.003** (0.753): the painting leans back further than the rotation limits and the stance weight allow.
5. **Hair and spears are one chain**: the individual braids and the three ice spears move as one mass; the long staff-like braid bends with the chain but the thin strands do not swing separately. The cut's polygon lines pass through dreadlocks (hard edges where hair crosses the head, the body and the far arm); 1.6 percent of the silhouette is not in any part.
6. The cast glow (painted light at the hip) is not carried; cut parts have no feather (the engine's edge-feather item is open); the idle motion is sinusoids only.

## Making it again

`PY=D:/Tools/ComfyUI/python_embeded/python.exe`; from `D:/pyrefly-rig-valefor` with `public/art` a junction to `D:/pyrefly-art-r55`: `$PY -I tools/rig/rig.py cut --subject shiva`, `... build`, `node tools/rig/rig-targets.mjs --subject shiva --out D:/pyrefly-art-rigs-work/shiva/targets --art public/art --costume idle --scale 2 --baseline 1131 --root .`, then **skip the fit**: copy `tools/rig/subjects/shiva.keys.json` to `D:/pyrefly-art-rigs-work/shiva/fit/keys.json`, `$PY -I tools/rig/rig.py export --subject shiva`, `node tools/rig-tiers.mjs write --rig D:/pyrefly-art-rigs/shiva`, `node tools/rig-gate.mjs --rig D:/pyrefly-art-rigs/shiva --verify --art D:/pyrefly-art-r55`.
Recording: `PYREFLY_BROWSER=gpu node tools/rig/lane/record.mjs --subject shiva --out <dir> --modes poses,ko --off --cap 40000`; then `lane.py clips ... --painting-file overdrive=public/art/characters/shiva/overdrive.png`, `lane.py sheets`, `lane.py hurtko`.

## Tests

`npx vitest run tests/unit/tools/rig-subject-shiva.test.ts` (13 tests). The five rig test files of this lane: 66 tests pass; `test_lane.py` 24; `npx tsc --noEmit`: only the six `pause-living-portrait-*` tests that import `docs/concepts/...`.
