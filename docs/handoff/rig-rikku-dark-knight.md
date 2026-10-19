# The Rikku Dark Knight rig (branch `rig-rikku-dk`, from `rig-v2` e027f779c, 2026-10-18)

Bailey, 2026-10-18: "We need this done for all characters and bosses. It's a priority." The rig plan (`D:/Tools/pyrefly-scratch/2026-10-18/rig-plan/plan.md`) ranks this subject first: FFX-2 swaps are the worst on disk and Rikku's are the worst of the three
girls (5.0 bad swap events a minute). The driver's costume pick, as for every rig: **the dressphere's IDLE painting** (the black plate armour, the long fringed skirt and cape, the broad gold-and-black greatsword).
Game case: **FFX-2 only** (the Dark Knight dressphere is an FFX-2 costume, `characters/rikku-dark-knight/*`; the kit, the pipeline and the gate are untouched shared plumbing, the new `lane_marks.py` is a kit addition that is both-games by construction).
Chapters that field it (from `src/data/encounters.ts` through the plan's `chapters.json`; the actor is `rikku`, her sprite `rikku-dark-knight`, her starting dressphere `dark-knight`): the board chapters 4 (`ffx2-bahamut`), 5 (`ffx2-vegnagun-shuyin`), 11
(`ffx2-fallen-aeons`), 15 (`ffx2-den-of-woe`), 16 (`ffx2-ixion-djose`) and the hidden 20 (`ffx2-masterpiece-theatre`, word `experiment`), 23 (`ffx2-tourist-trap`, `daigoro`), 24 (`ffx2-valefor-besaid`, `valefor`), 26 (`ffx2-angra-mainyu`, `angra`); she can change into it in 13 (`ffx2-trema`).
The recorder's registry entry uses the hidden chapter 24 (door word `valefor`).

**State: the rig is on disk and gated `ok` with full coverage, `--verify` passes, and it stays OFF: nothing is installed into any art mirror, merged, deployed or reviewed.** `D:/pyrefly-art-rigs/rikku-dark-knight`: format **v2**, 15 parts, 21 bones, 11 keys, 3,385 vertices, 5.03 Mpx, 7.56 MB, the `1x/`
tier proved (30 files, 2.52 Mpx, 2.23 MB). Work files: `D:/pyrefly-art-rigs-work/rikku-dark-knight` (cut, build, targets, `fit/keys.json`, every fit round under `lane/`). The final keys are also committed as `tools/rig/subjects/rikku-dark-knight.keys.json`
(a sibling's warm start: Rikku Thief, Alchemist and the other eight Rikku dresspheres share this body and skeleton). Nothing was written into `public/art`, `D:/pyrefly-art-r50` or the release tree.

**Not done, and why:** the in-game recordings (poses with the rig on and off, hurt to KO), the clips, the three sheets plus the before/after sheet in Lulu's format, and the continuity harness on and off were **blocked**: `D:/Tools/pyrefly-scratch/REVIEW-BROWSER` (the driver's
r55 deep-review marker, raised 2026-10-18 19:22) existed from before the rig was ready until this lane stopped, and the brief says to hold browser and Vite work while it exists. The recorder ran in `--wait` for 20 minutes and was then stopped BY PID (nothing is left running). The sheets that
exist are an OFFLINE render (the fitter's own textured renderer, not the game) of every key beside its painting at the same scale, in Lulu's three-sheet grouping: `D:/Tools/pyrefly-scratch/2026-10-18/rig-rikku-dk/offline/rikku-dk-offline-{1-attack-cast-item,2-hurt-follow-ko,3-ready-lowhp-asleep-victory}.png`
(the first, discarded version, whose props were clipped by my renderer's canvas, is in `offline-v1/`). To finish when the marker is gone (about 30 minutes of recording):
`PYREFLY_BROWSER=gpu node tools/rig/lane/record.mjs --subject rikku-dark-knight --out D:/Tools/pyrefly-scratch/2026-10-18/rig-rikku-dk/rec --modes poses,hurtko,fight --off`, then `lane.py clips` / `lane.py sheets` (README). The registry entry, the three-sheet grouping
and the label table are in `tools/rig/lane/lane-subjects.json`; the `cast` mode needs `castKeys` (the Dark Knight menu's keys to its first ability), which this lane did not look up, so it is not in the entry.

## What is cut, and how (`tools/rig/subjects/rikku-dark-knight.json`, `..._hooks.py`)

Cut by SAM prompts (`sam.parts`) from `idle@2x`, then the label recipe (`cut.priority`), classical underlaps and fills (`cut.ops`). Draw order, back to front:
`sword`, `train` (the cape's left sweep), `trainCap`, `legR`, `kneeR`, `hipR`, `legL`, `kneeL`, `hipL`, `skirt` (faulds and pleats), `torso`, `armR` (sleeve, gauntlet, hand), `handCap`, `braid`, `head`.

- **Hanging panels (the brief's skirt and cape).** The skirt is Lulu's column and train recipe: `skirt` and `train` are the pelvis's alone above row 640, the flare bones' alone below row 800, a smoothstep between (`skin_skirt`, `skin_train`); `skirtL`/`skirtR` are children of the **pelvis**
  (not the root: a root child's joint stays behind when the pelvis moves, and the gate's hole test watches it), `train` a child of `skirtL`. The fit rotates and scales them; the **gate's hole test is what bounds the scale**: a bone scaled to 0.49 shrinks the part under the fixed joint disc (`train`
  holes), so the final keys keep every skirt scale at or above 0.75.
- **The sword is a prop with a landmark at each end.** A rigid part on the bone `sword`, a child of `hand`; its pivot is 10 px **above the pommel** (a prop's pivot is not a joint of the body: the gate skips a joint its parts do not enclose, so there is no `sword` joint to keep covered); scale 0.25 to 2.2
  (the painted sword is 0.5 to 1.8 times the idle's length in the registered pictures: Follow's is 1.8). Landmarks `tip` (the blade's point) and `pommel` (the grip's end), marked in every sword pose: **two ends fix a sword's place, turn and length**. With only `tip` marked the fit hid the sword
  (0.25 scale, offset off the picture) and still met the mark; that was caught only by looking at the render.
- **Caps (new, general).** A chain-skinned leg bent about its knee opens a wedge of background on the outer side of the bend inside the disc the gate watches (a linear blend shrinks the contour there): 52 of the first gate run's blend holes were at the knees (and the rest at the hip). A **cap** is a disc of the leg's own pixels (the painting's
  gold knee guard, copied, not repainted) centred on the joint and rigid on the bone of that joint, so it turns about its own centre and the joint stays under it. `kneeL`, `kneeR` (shin bones), `hipL`, `hipR` (thigh bones), `handCap` (the hand bone), `trainCap` (the train bone). Cut by the hook's `cut_parts`
  (`CAPS`), 15 lines. This took the blend holes from 52 to 0 together with the scale floors below.
- **Skin:** legs are chain skins `[thigh, shin, foot]` with 48 and 40 px ramps; the torso `[pelvis, spine, chest]`; the arm `[upperarm, forearm, hand]`; the braid an `auto` chain of 3 bones with a lag chain in `motion`; head and sword rigid.
- **Format v2 used:** one use, the **item key hides `sword`** (`fit.keys.item.hide`; the painting draws a potion and no sword). The hidden share is 0.38 of the idle figure (the cap is 0.6), the key's silhouette is fitted without the sword, and the gate watches no sword joint in it. **Not used, with the reasons:** no key
  swaps a costume detail for a variant (the costume pick is the idle's; the other paintings' short chain skirts, orange sashes, different swords and hair are NOT carried: that is the mixed-costume question, `plan.md` section 6, undecided); no part is hidden for a front view (none of the ten paintings faces the camera);
  the **potion** the item painting holds was not built as a hidden part (it would be a `from_painting` variant needing the glue the kit still lacks, placed by the fitted item key: listed below).
- **One painting is read turned:** `ready` (`fit.mirror`). Its grip and hands are at the upper left and the blade falls to the right, the opposite of the idle's; turned, the raised hand is on the rig's arm side and the hair flows the way the rig's does (overlap 0.35 to 0.60).

## The per-key table (the gate's own reading; `node tools/rig-gate.mjs --rig D:/pyrefly-art-rigs/rikku-dark-knight --art D:/pyrefly-art-r50`, verbatim)

```
rig-gate: rikku-dark-knight: OK; 11 of 11 key(s) pass; rest overlap 0.993; 186 poses scanned for holes at 18 joints; 15 parts, 21 bones, 3385 vertices, 5.03 Mpx, 7.56 MB; 9.4 s
  ok   idle       idle     iou 0.993  stature 1.000  feet -0.000, 0.001  head 1.000
  ok   attack     standing iou 0.375  stature 0.970 (head to soles)  feet -0.006, 0.009  head 1.000  landmarks 0.025  AUTHORED
  ok   cast       standing iou 0.455  stature 0.909 (head to soles)  feet -0.013, -0.004  head 1.000  landmarks 0.025  AUTHORED
  ok   critical   low      iou 0.517  stature 0.806 (head to soles)  feet 0.001, -0.001  head 1.000  landmarks 0.050  AUTHORED
  ok   follow     standing iou 0.400  stature 0.913 (head to soles)  feet -0.007, 0.020  head 1.000  landmarks 0.047  AUTHORED
  ok   hurt       standing iou 0.435  stature 0.982 (head to soles)  feet -0.015, -0.001  head 1.000  landmarks 0.032  AUTHORED
  ok   item       standing iou 0.458  stature 0.958 (head to soles)  feet -0.015, 0.001  head 1.000  landmarks 0.054  AUTHORED
  ok   ko         ko       iou 0.566  stature 0.390  feet -0.163, -0.049  head 1.000  landmarks 0.025  AUTHORED
  ok   ready      standing iou 0.602  stature 0.977 (head to soles)  feet -0.007, -0.014  head 1.000  landmarks 0.025  AUTHORED  (painting turned)
  ok   sleep      low      iou 0.582  stature 0.824 (head to soles)  feet 0.018, 0.018  head 1.000  landmarks 0.036  AUTHORED
  ok   victory    standing iou 0.399  stature 0.985 (head to soles)  feet -0.014, -0.018  head 1.000  landmarks 0.030  AUTHORED
rig-gate: wrote gate.status ok into D:\pyrefly-art-rigs\rikku-dark-knight
rig-gate: PASS
```

`--verify`: `verified: stamp ok (11 key(s), full coverage, 4 exempt), 1x tier proved (30 file(s))`; PASS. The 4 exempt are the `twirl-*` dressphere-change frames. 186 poses scanned (every key, and 25/50/75 percent between every two): no hole at any of 18 joints.

**All ten painted keys are AUTHORED.** None of the paintings reaches 0.75: each is drawn in a different costume (a short chain skirt and orange sash in Attack, a gradient robe in Cast, a different sword in nearly every one), so the overlap is capped by the costume, not by the pose; the landmarks carry the pose, as the driver's rule
of 2026-10-17 says (the fitter's claim and the gate's reading agree to within 0.05 on every key, rewritten to the reading). Beside the overlap: landmarks 0.025 to 0.054 against the bar 0.06 (Item 0.054, Critical 0.050 and Follow 0.047 are the thin ones; the marks are by eye, plus or minus 15 to 25 px of a painting about 1,000 px tall, about 0.02);
Follow's feet-dy 0.020 and Sleep's 0.018 sit at the 0.02 band.

## What the lane learned (for the plan's cost model and the next dressphere)

- **Cost.** About 3 hours 55 minutes wall clock and about 200 tool uses; the model's token counter went from 14.93M to 14.39M, about **0.54M tokens** (this brief's plan estimate for a D1 was 1.2 to 1.8M before the kit and 0.7 to 1.0M with it: under, because no review, install, recording or sheet cost fell in this lane). **83 fit runs** (the brief said about 50), about 5.5 minutes of one core each, 4 to 5 at a time:
  t0 1, r1 20, r2 10, r3 10, r4 8, r5 7, r6 3, r7 5, r8 9, r9 5, r10 1, r11 4, r12 4 (the work folder's `lane/<tag>/` and `logs` in the scratch folder have every one). Almost all of the overspend is one cause, below.
- **Marks first (new: `tools/rig/lane/lane_marks.py`, in the README).** The kit's fit scores the silhouette overlap first and the landmarks second, from the rest pose; on a pose far from the rest (a kneel, a lunge, a sword turned end for end) it settles in a basin where a landmark is 0.10 to 0.16 of the height off and `mark_w` does not
  pull it out: 50 runs went into that. A search over the same parameters that scores **only the marks** (plus the planted-feet row and a prior toward small angles) needs no silhouette, so an evaluation is milliseconds: 400 restarts take about a minute a pose and put every mark of ten poses inside 0.056 (most inside 0.03). Its result goes under
  `fit.keys.<pose>.init`, and the ordinary fit started there keeps the marks and adds the overlap. **Do this before the first fit of every pose.** A pose it cannot satisfy says so in a minute: widen that pose's limits, offsets and scales (the follow sword needed a scale limit of 2.2, the sleep pelvis 70 degrees, the kneel a hip drop of 0.2 of the image).
- **Look at the render before trusting a landmark.** Two landmarks (`tip`, then `tip` and `pommel`) are met by a sword that is the wrong size or in the wrong place; four sole marks I placed by eye were 0.05 off the gate's stance rule (below). The diagnostic scripts (`diag.py` draws the posed landmarks against the marks on the target, `holedbg.mjs` writes the crop of any key's or blend's
  hole, `offline_sheet.py` renders every key) are in `D:/Tools/pyrefly-scratch/2026-10-18/rig-rikku-dk/`, not committed: they are small and worth a place in the kit.
- **Feet marks and the stance rule disagree on a figure with a sword.** The gate's `feet-x`/`feet-y` come from the bottom 4 percent of the silhouette (the sword's point is often in it); a sole mark placed by eye on the painting then costs 0.04 to 0.06 of stance. Where a sole mark and the stance rule conflicted (Cast, Critical, Hurt, Ready) the sole marks were dropped and the planted-feet row, the stance rule and the
  overlap hold the feet; Follow, Victory and Item keep theirs; Sleep marks none (its boots stand 46 px above the ground row that the sword's point sets). Dropping them is what lets the legs bend more than the paintings' do (see below).
- **Holes.** Joint discs are fixed-size; a limb scale under about 0.9 shrinks a part below its own joint's disc (`hand`, `thighL`, `train`). The fit's scale floors are now 0.92 (arms) and 0.9 (thighs) and the skirt scales were clamped to 0.75 in the keys. The caps above are the structural fix for the knees.
- **Hand edits to keys are legal and quick:** `lane.py eval --keys K.json --full` re-gates a keys file in 35 seconds; the claims (`fit.iou`, `fit.stature`) must be rewritten to the gate's reading (`key-fit-stale`), which `select` does and `eval` does not. Pelvis `dy` and `root.dy` move the feet (a **negative** `root.dy` lowers the figure here); `root.dx` shifts the stance (30 master px is about 0.013 idle heights).
  `select` reads `<tag>/final/work/build` if it exists: delete the stale `final/` and `sel*/` folders after a rebuild or the selection exports the OLD parts.

## What still looks wrong (read the offline sheets; the in-game look is not yet seen)

1. **Costume, as designed:** every pose wears the idle's black plate and long skirt and carries the idle's broad golden sword; the paintings' orange sashes, short chain skirts, blue boots, white blouses and different swords are not there. Overlaps 0.37 to 0.60 are this, not a pose fault. Whether that is acceptable is the plan's mixed-costume question (section 6), still open.
2. **Legs bend more than the paintings'** in Victory, Hurt, Sleep and Ready (a half-squat where the painting stands): the sole marks were dropped for the reason above; Hurt, Victory and Item were refitted with the leg limits cut to 35 (thigh) and 40 (shin) degrees and Cast to 60 and 80, and read better, but Cast still strides where the painted figure stands narrow, and Victory's overlap fell to 0.40 for it.
3. **One arm.** The rig has the idle's sword arm only; the second hand of the two-handed paintings (Attack, Follow, Ready, Victory's crossed arms, Critical) is missing, and a pose whose raised hand is the far one (Ready) reads turned. A hidden second arm shown by those keys (a v2 part cut from another painting) is the fix; not built.
4. **Item holds no potion** (the sword is hidden, the vial is not drawn). A hidden `vial` part cut from the item painting and shown by the item key is the v2 answer; it needs the `from_painting` glue (the kit has only its pure core). Item's gauntlet reads large (arm scale 1.3 at the limit).
5. **The KO** lies down plausibly, but it is 0.39 of the idle's height (the gate's KO band), 0.57 overlap, and the legs are bent under it.
6. **Sleep** kneels with the sword upright where the painting bends double over it; its landmarks (head, point, pommel) are right.
7. The hair is the idle's mass everywhere (the ponytail that flows right in Ready, the short tail of Cast, are not carried), and the idle sway and the braid's lag chain are the only motion: nothing was tuned in the game.
8. **Not run:** the in-game poses, the continuity harness (`record.mjs --modes fight`, rig on and off, in `ffx2-valefor-besaid`) and the critic's probe, the cast clip, any install. The Rikku Dark Knight siblings (Thief and Alchemist are next in the plan) start from `tools/rig/subjects/rikku-dark-knight.keys.json` and the same body.

## Making it again

`PY=D:/Tools/ComfyUI/python_embeded/python.exe`; from the repo root on this branch, with `public/art` a junction to `D:/pyrefly-art-r50`:
`$PY -I tools/rig/rig.py cut --subject rikku-dark-knight --sam --cpu` (once: SAM masks; then without `--sam`), `... build`, `... fit-keys --poses idle --retarget` (the targets; it ends in an error after making them, which is harmless), `$PY -I tools/rig/lane/lane_marks.py --subject rikku-dark-knight --pose <pose> --restarts 400`,
`lane.py fit` (the config's `fit.keys.<pose>.init` are the marks-first results of the final rounds), `lane.py select`, then copy the keys to `D:/pyrefly-art-rigs-work/rikku-dark-knight/fit/keys.json`, `rig.py export`, `node tools/rig-tiers.mjs write --rig D:/pyrefly-art-rigs/rikku-dark-knight`, `node tools/rig-gate.mjs --rig ... --verify --art D:/pyrefly-art-r50`.
To skip the fit: put `tools/rig/subjects/rikku-dark-knight.keys.json` at `<work>/fit/keys.json` and export.

## Tests and checks

`npx tsc --noEmit` clean; the rig vitest files (`tests/unit/rig`, `tests/unit/tools/rig-*`) **27 files, 288 tests, all pass** (26 and 276 on `rig-v2`; the new file is `tests/unit/tools/rig-subject-rikku-dark-knight.test.ts`, 12 tests: parts, skins, bones, marks, the sword's pivot and hidden item key, the caps, the skirt recipe, the registry entry);
Python `tools/rig/lane/test_lane.py` 21 OK (two new for `lane_marks.py`), `test_rig_pipeline.py` 12 OK, `test_rig_v2.py` 10 OK. The full unit suite was not run (this lane changed no engine, gate or pipeline file; the only shared-file edits are the registry, the lane README and `test_lane.py`).

## Files

New: `tools/rig/subjects/rikku-dark-knight.json`, `rikku-dark-knight_hooks.py`, `rikku-dark-knight.keys.json`; `tools/rig/lane/lane_marks.py`; `tests/unit/tools/rig-subject-rikku-dark-knight.test.ts`; this file. Changed: `tools/rig/lane/lane-subjects.json` (one entry), `tools/rig/lane/README.md` (two lines), `tools/rig/lane/test_lane.py` (two tests).
Scratch (not committed): `D:/Tools/pyrefly-scratch/2026-10-18/rig-rikku-dk/` (offline sheets, gate output, key table, diagnostics, logs, the marks-first inits).
