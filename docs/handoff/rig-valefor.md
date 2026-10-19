# The Valefor rig (branch `rig-valefor`, from `rig-v2` e027f779c, tip 2af625c95, 2026-10-19)

Bailey, 2026-10-18: "Single-costume figures first (Recommended)" for the rig program; Valefor is first (the Chapter III aeons' hurt-to-KO size jump of about 25 percent is the worst live issue). The driver's costume pick, as for every rig: **the idle painting**.
Game case: **FFX only** (Valefor is an FFX aeon, `characters/valefor/*`, one costume across idle, attack, cast, hurt and KO: palette 0.94 to 1.00; the plan's census row 9, class B). One thing the driver should decide under rule 14: the FFX-2 hidden chapter
"Valefor at Besaid" (`ffx2-valefor-besaid`, door word `valefor`) reuses the same painting set by sprite key `valefor` (`src/data/ffx2/enemies/valefor.ts`: "provisional"), and a rig is keyed by art id, so a build that turns this rig on turns it on there too (there is no per-game switch). The recordings below are made in that chapter for exactly that reason:
it is the one chapter where Valefor is the lone enemy at the first menu. Chapters that field the sprite (plan `fielding.json`): foe in 3 (the possessed Valefor of Braska's chain) and hidden 24; summoned in 1, 2, 3, 7, 9, 10, 12, 14, 17, 18, 21h, 27 (12 chapters).

**State: the rig is on disk and gated `ok`, `--verify` passes, and it stays OFF: nothing is installed into any art mirror, merged, deployed or reviewed.** `D:/pyrefly-art-rigs/valefor`: format v1 (no v2 feature was needed), 8 parts, 24 bones, 6 keys, 2,638 vertices, 5.46 Mpx, 6.54 MB (budget 9 and 9), a `1x/` tier proved (16 files, 2.74 Mpx).
Work files: `D:/pyrefly-art-rigs-work/valefor` (383 MB: the cut, build, targets, `fit/keys.json` and `fit/keys-final.json`, every fit round under `lane/r1..r4`, logs). Nothing was written into `public/art` (a junction to the read-only `D:/pyrefly-art-r55`), any `D:/pyrefly-art-*` mirror, another rig's folder or another worktree.
The sparse worktree is `D:/pyrefly-rig-valefor` (no `docs/`; this note lives in the scratch folder, the driver brings it into `docs/handoff/rig-valefor.md`).

## The gate, verbatim (`node tools/rig-gate.mjs --rig D:/pyrefly-art-rigs/valefor --art D:/pyrefly-art-r55`, then `--verify`)

```
rig-gate: valefor: OK; 6 of 6 key(s) pass; rest overlap 1.000; 51 poses scanned for holes at 16 joints; 8 parts, 24 bones, 2638 vertices, 5.46 Mpx, 6.54 MB; 5.3 s
  ok   idle       idle     iou 1.000  stature 0.987  feet -0.001, -0.001  head n/a
  ok   attack     standing iou 0.888  stature 0.967  feet 0.008, -0.004  head n/a  landmarks 0.025
  ok   cast       standing iou 0.979  stature 0.986  feet 0.000, -0.004  head n/a  landmarks 0.015
  ok   hurt       standing iou 0.902  stature 1.014  feet 0.004, -0.006  head n/a  landmarks 0.027
  ok   ko         ko       iou 0.571  stature 0.849  feet -0.140, 0.009  head n/a  landmarks 0.033  AUTHORED
  ok   overdrive  standing iou 0.478  stature 0.912  feet -0.096, 0.026  head n/a  landmarks 0.029  AUTHORED
rig-gate: wrote gate.status ok into D:\pyrefly-art-rigs\valefor
rig-gate: PASS
rig-gate: D:/pyrefly-art-rigs/valefor: verified: stamp ok (6 key(s), full coverage), 1x tier proved (16 file(s))
rig-gate: PASS
```

The rule is the current one: a key passes at **overlap 0.75 or more with its approved painting, or is authored and then held to its landmarks, every landmark within 0.06 of the idle's height** (the worst reading here is the KO's 0.033; the marks are by eye, plus or minus 15 to 25 px of an 830 px painting, about 0.02).

**Painted versus authored: three painted (attack 0.888, cast 0.979, hurt 0.902), two authored (KO 0.571, Overdrive 0.478), plus the idle (the costume at rest).** Of the five non-idle keys, 60 percent are painted (Kimahri was 50 percent authored, Lulu 67, Rikku Dark Knight 100): one costume is what makes the difference.
The gate's `head` reading is `n/a` for this figure: the pose model has no head box for a creature, so the gate does not judge head size at all. The size claim below is therefore proved by this lane's own measures, not by the gate (see the harness).

## What is cut, and how (`tools/rig/subjects/valefor.json`, `valefor_hooks.py` (empty), `valefor.keys.json`)

Cut from `idle@2x` by **polygons, colour and the underlaps only (no SAM)**. Back to front: `tail` (the tan underside of the tail and the curl), `wing`, `plume` (the long blue feathers), `legF` (far leg), `legN` (near leg), `neck`, `body` (chest, belly, the gold armour, the green scapulars, the hips), `head`.

- **Bones (24, parents first):** `root`, `pelvis`, `chest`, `neck0`, `neck1`, `head`; `wingA` (shoulder), `wingB` (wrist, at the gold armour piece), `wingC`; `plume0..2`; `tail0..5` (six bones along the curl); `thighN/shinN/footN`, `thighF/shinF/footF`. Every chain part is skinned along its joints with ramps (wing 60 and 100, tail 40, plume 60, legs 30, neck 50, body 60).
- **Wing:** the first winged body plan. The wing is behind the body, as in the painting: the teal "arm" strip from the shoulder up to the gold armour is the wing's, the scapular layer (teal scales and the green tertials) is the body's, and the cut between them follows the scapulars' upper edge. 1.03 M master pixels, 518 vertices.
- **The plume** is a polygon band along the tertials' lower edge (the blue feathers are cut by place, not by colour: dark navy failed any colour test); the tan tail sweep and the curl are the `tail`, drawn under it.
- **Underlaps** (10, the `skirt` op): neck under body and head, wing under body, plume under body, tail under plume, body and near leg, each leg under the body, far leg under the near leg. At rest the composite differs from the painting in 9,732 of 2,020,882 opaque pixels by more than 30 (0.5 percent, seams of the cut).
- **Motion:** the idle sways the neck, head, wing, tail and plume by small sinusoids at different phases. **No lag (spring) chains were used**: the engine replaces a chain bone's key angle with the spring's (`RigDynamics.ts`), and every one of these bones has to be posed by a key (the KO droops the wing and plume, the attack tilts the head); a spring on the tail would have fought the KO key. The brief said "spring chains if the kit supports them": it does, and it was the wrong tool for a figure whose tail and wing are posed.
- **Format v2 was not used** (no part is hidden, no costume detail is swapped: the one costume is the point).
- **A neck cap was tried and dropped** (`valefor_hooks.py` says why): the Overdrive key bent the neck 75 degrees at `neck0` and opened a 294 px hole at that joint; a disc of the painting's own pixels rigid on `neck0` (the recipe of Rikku Dark Knight's knee caps) closed it only at a radius of 80 px, and at that radius a bent neck sticks a rotated piece of the figure's outline out of the back (seen in the first real KO clip). The Overdrive key now keeps `neck0` within 45 degrees and bends `neck1` and the head further (110), no cap, no hole.

## The keys (`fit.keys.<pose>`; no key scales a head, neck, wing, chest, pelvis, tail or plume: only the four leg bones may stretch, 0.9 to 1.15; a unit test holds that)

| key | source | gate overlap | worst landmark | notes |
|---|---|---|---|---|
| idle | the costume at rest | 1.000 | - | stature 0.987 |
| attack | painted | 0.888 | 0.025 | head down, beak open in the painting; the rig lowers the head, the open beak is not carried |
| cast | painted | 0.979 | 0.015 | the cast painting IS the idle plus a glow at the head and chest (palette 0.94 to 1.00); the glow is painted light, not carried |
| hurt | painted | 0.902 | 0.027 | head up and back, the wing a little lower |
| ko | **authored** | 0.571 | 0.033 | `planted: false`; the body crouches low with the neck arch kept, the wing droops, the tail and plume hang; the neck's limits are tight (`neck0` 12, `neck1` 25) on purpose: the fit's first answer folded the neck into a ball |
| overdrive | **authored** | 0.478 | 0.029 | `planted: false`; see below |

KO and Overdrive stay below 0.75 for reasons the paintings give: the painted KO is a close-up of a smaller creature (the plan's census: its head is 0.74 of the idle's, its whole figure 0.74), and the painted Overdrive is a different composition (a swoop with the far wing raised, a head 1.7 times the idle's, no tail curl; palette similarity 0.59). The rig keeps the idle's head and body, so its overlap with those two is capped by the very thing it fixes. Their marks are the pose's intent: head, beak, both toes, wing tip, plume tip, tail tip (KO: the last two left out, they conflicted with the tight neck; Overdrive: no far toe mark and no tail curl, the painting has none). The Overdrive head mark is the head's centre and the beak mark sits 50 px short of the painted beak tip, because the rig's beak is the idle's length.

## Fits, effort (BOUND: 3 hours 40 minutes and 40 fits)

- **20 fit jobs** (round 1: 5 poses x 2 seeds; round 2: KO and Overdrive, 2 seeds each; round 3: Overdrive, 3 seeds; round 4: KO, 3 seeds) and 11 marks-first searches (`lane_marks.py`, 300 restarts, about 80 s a pose): about 8 minutes of wall clock per round at 8 processes under one fit slot, below normal priority; no second lane was fitting. Used 20 of 40.
- **Wall clock about 1 hour 50 minutes** (01:34 to about 03:20), of which the checkout (the junction and sparse-checkout slip, below) took 10 minutes.
- **Tokens: about 0.46 M** by the session counter (14.93 M to 14.47 M), the kit's estimate for a class B subject was 0.2 to 0.35 M and the plan's 0.3 M; the extra is the first winged body plan (the cut took three label-map rounds and the neck question took four).
- Lessons for the next lane: (1) **marks first, always** (`lane_marks.py`, from `rig-rikku-dk`, not committed here: merge that branch first): it found the KO and Overdrive limits problem in a minute each; every saturated bone (a key at its limit) is a limit to widen BEFORE the fit. (2) **A delete-the-stale-folders trap bit twice**: `lane.py select` and `eval` copy `build/` into `lane/<tag>/final/work/` and `lane/eval/work/` once and reuse it, so after a rebuild every `sel*`, `final` and `eval` folder must go or the gate reads the OLD parts (a cap that had been rebuilt away kept "fixing" a hole). (3) The gate's joint disc is 0.75 of the DEPTH of the parts that meet at the joint, and for a joint on the edge of a big part (the neck base on the chest) that is a 60 to 80 px disc, much bigger than the neck. (4) `git sparse-checkout set --no-cone "/*" "!/docs/"` run from Git Bash on Windows turned `!/docs/` into `!C:/Program Files/Git/docs/` and checked out 6.1 GB of docs; run it with `MSYS_NO_PATHCONV=1` (done, docs removed). (5) A combination of keys can have a blend hole that no single key has (KO to Overdrive at 75 percent): `combo.py`-style, evaluate every pair of candidates (6 gate runs, 2 minutes) instead of refitting.

## The harness: the real KO swap, rig on and off (Valefor at Besaid, `ffx2-valefor-besaid`, seed 1, `autoBattle('intended')`, 1600x900, an exact 60 Hz virtual clock, the real GPU)

The recorder's `fight` mode ran the whole fight twice (10,806 frames, 172 s of battle; `rec/fight`, `rec/fight-off`); a second script (`koswap.mjs`, scratch) replayed it and kept every frame from 10,280 to 10,470 plus the actor's pose, life, projected box and, rig on, the area of every part mesh as the GPU gets it. The KO swap is at frame 10,327 (hurt at 10,311) in both runs.

| at the KO swap (hurt to KO) | painting set (rig off) | the rig |
|---|---|---|
| **head size** | 288.2 px to 213.8 px, ratio **0.7418, a 25.8 percent jump** (the probe's own reading, `fight-off/continuity`, swap 227; the plan's 25.6 percent) | the head mesh area is **0.0228685 in hurt and 0.0228685 in KO: ratio 1.0000** (in the engine, frame 10,305 against 10,360); in every key by the gate's own raster too (1.000) |
| **whole figure** (square root of the silhouette area, against the idle) | hurt 0.989, KO 0.738: **0.746 of hurt** (outline area ratio 0.554 at the swap, height ratio 0.663) | hurt 1.006, KO 0.940: **0.934 of hurt** (the gate's raster: the body crouches and the wing droops; the head does not change) |
| **centroid shift in the swap** | 79.6 px (feet 32.7 px) | none: a blend of about 40 frames; the largest one-frame step in frames 10,300 to 10,360 is head 25.7 px, centroid 17.2 px, feet 17.1 px |
| **the worst one-frame step** (tracker, projected through the live camera) | **head 96.6 px and centroid 53.8 px in ONE frame at 10,327** (a hard cut) | head 25.7 px at 10,330 (inside the ease) |
| **jerks of 40 px or more over the fight** (CHK-027's detector over the skeleton or the anchors) | 1 (the head, at the KO swap) | **0** |
| projected box (`projectRect`) | hurt 508 x 342, KO 556 x 309 | hurt 534 x 340, KO 517 x 361 at the swap, 627 x 450 once the wing has drooped (the box grows, the mass does not) |

Other swaps of the painted Valefor in that fight (70 of them, rig off): head 0.98 to 1.02 and feet 0.4 px: the aeon's other poses were never the problem; **the KO swap is the only jump, and the rig removes it**.
**The continuity probe (CHK-026 and 027) is vacuous for the rig**, as the Kimahri and Lulu handoffs said: with the rig on it records no swap of Valefor at all (70 swaps off, 0 on), and its FAIL lines in both runs are about Paine and Yuna, not Valefor. The skeleton tracker is the harness for rigs.
Note for the harness: a real enemy KO in this fight is hidden by the game's white KO flash and the actor leaves the stage about 40 frames later (frame 10,368), so in play the rig's KO crouch is seen for under a second under the flash; the clean KO frames are the ones in the `poses` recording.

## Sheets and clips (in-game recordings, the real game, rig on beside the painting set; Lulu's layout)

`D:/Tools/pyrefly-scratch/2026-10-19/rig-valefor/for-bailey/`:
- `valefor-rig-1-attack-cast-hurt.png`, `valefor-rig-2-ko-overdrive.png` (left = the rig, right = the painting the game uses today; the kit's `lane.py sheets`),
- `valefor-rig-3-before-after.png`: HURT and KNOCKED OUT, the painting set above and the rig below, same camera and crop, with the numbers above in the captions (the size jump fixed).
Clips: `clips/{attack,cast,hurt,ko,overdrive}.mp4` (60 fps, rig left, painting right). The recordings: `rec/poses`, `rec/poses-off`, `rec/fight`, `rec/fight-off`, `koswap/{rig,painting}` (frames 10,280 to 10,470 and `meta.json`, `tracks.json`).
The offline contact sheet (the fitter's own renderer, every key beside its painting with the silhouettes): `sheet-r4.png` (the final keys). Tables and tools: `gate.json`, `gate-output.txt`, `verify-output.txt`, `sizes.mjs` (the posed rig's area per key and the paintings'), `before_after.py`, `mk_last.py`, `montage.py`.
**Two corrections the sheets needed, for the kit's owner** (`lane.py clips` makes a clip's last frame, frame 129): (1) for an enemy at full HP `setPose('ko')` holds the KO key for about 110 frames and then eases back to idle, while the painted actor dissolves, so the last frame of the KO clip showed the rig returning to idle and a ghost painting; (2) the painted actor does not draw an `overdrive` pose on the battle plane at all (it stays idle), and the hurt clip's crop (`crop_box`, 700 px wide at most) cut the lunging figure off. `mk_last.py` rebuilds those three last frames from chosen frames (70, and the painting's 36 for the KO) in the same caption layout; the Overdrive's right panel is the approved painting file.

## What still looks wrong

1. **The KO is a crouch, not the painted lie-down.** The rig's creature keeps the idle's size, so the painted KO's small, far-forward head and long flat wing do not exist: the neck arch stays up, the beak tucks against the chest, the wing droops over the back. Overlap 0.57 (authored). In the real fight it is under a flash for most of its life.
2. **The Overdrive is a balled-up swoop** (0.478): one wing, an idle-size head, the neck bent 45 + 110 degrees. The painted one has two raised wings and an oversized head and cannot be reached by one costume. **The game does not draw the painted Overdrive on the battle plane** (the painted actor stays idle for `setPose('overdrive')`), so the key may never be seen; the gate demands it for full coverage.
3. **Hard edges.** The wing and plume are cut parts and have no feather: the painting's soft feather fade at the wing tip (the plan's engine item 7, "edge-feathered") is crisp on the rig. Visible next to the painting in the clips; a slightly harder silhouette, nothing opens.
4. **Painted effects are not carried:** the cast's glow at the head and chest, the open beak and pink gape of the attack, the dust at the KO's feet.
5. **Seams.** No hole in 51 poses at 16 joints, and none seen in the 5 clips, but the cut is by polygon through feather texture (the wing/scapular line, the plume/tertial line, the neck base): a hard line shows if the wing or the neck is moved far beyond the keys (nothing blends past 100 percent). A small triangular tuft near the shoulder shows in the rig's KO (the chest's feather edge).
6. **Idle motion is sinusoids only**, nothing tuned in the game beyond watching the clips.
7. **Pterya (the silhouette twin, Chapter XIV)** is not built (not asked): `lane.py twin pterya --of valefor --subject pterya --run`, from `valefor.keys.json`.
8. **FFX-2's Besaid chapter turns this rig on too** (rule 14, above), the painted KO there is the same size jump.

## Making it again

`PY=D:/Tools/ComfyUI/python_embeded/python.exe`; from `D:/pyrefly-rig-valefor` with `public/art` a junction to `D:/pyrefly-art-r55` (and `RIG_WORK=D:/pyrefly-art-rigs-work`):
`$PY -I tools/rig/rig.py cut --subject valefor` (51 s), `... build` (13 s), `node tools/rig/rig-targets.mjs --subject valefor --out D:/pyrefly-art-rigs-work/valefor/targets --art public/art --costume idle --scale 2 --baseline 814 --root .` (all six poses; `rig.py fit-keys --poses idle` only makes the idle's), then **skip the fit**: copy `tools/rig/subjects/valefor.keys.json` to `D:/pyrefly-art-rigs-work/valefor/fit/keys.json`, `... export --subject valefor`, `node tools/rig-tiers.mjs write --rig D:/pyrefly-art-rigs/valefor`, `node tools/rig-gate.mjs --rig D:/pyrefly-art-rigs/valefor --verify --art D:/pyrefly-art-r55`.
To refit: `lane_marks.py --subject valefor --pose <pose>` first (the inits are in the config under `fit.keys.<pose>.init`), then `lane.py fit --poses ... --seeds 3 --tag rN`, `lane.py select --tag rN --write`; delete `lane/eval`, `lane/<tag>/sel*` and `final` after any rebuild.
Recording: `PYREFLY_BROWSER=gpu node tools/rig/lane/record.mjs --subject valefor --out <dir> --modes poses,fight --off` (the `fight` mode needs `docs/target/pose-measure.json` in the tree for the probe: this lane copied it in from `origin/rig-v2` and removed it).

## Tests and checks

`npx vitest run tests/unit/tools/rig-subject-valefor.test.ts tests/unit/tools/rig-lane.test.ts tests/unit/tools/rig-subject-lulu.test.ts`: 13 + 12 + 11 pass (the Valefor file is new: the config, the draw order, the underlaps, the bones, the marks, the keys never scale a head or a wing, the registry entry). `npx tsc --noEmit`: the only errors are the six `pause-living-portrait-*` tests that import `docs/concepts/...` (the sparse tree has no `docs/`); none is in a file of this lane. The full suite was not run (this lane changed no engine, gate, pipeline or format file).
Changed or new in the commit: `tools/rig/subjects/valefor.json`, `valefor_hooks.py`, `valefor.keys.json`, `tools/rig/lane/lane-subjects.json` (one entry), `tools/rig/lane/record.mjs` (`--off` also records the fight mode: the same one-line change as the Auron lane, identical text so the merge is clean), `tests/unit/tools/rig-subject-valefor.test.ts`. `tools/rig/lane/lane_marks.py` is on this tree **untracked** (copied from `origin/rig-rikku-dk`); merge that branch.
