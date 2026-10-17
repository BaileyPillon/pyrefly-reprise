# The rig pipeline and the rig gate (branch `rig`, 2026-10-17)

Bailey, 2026-10-17: "yes start rigging, you pick kimahri's costume. start rigging for all chapters please. i want a permanent fix now." Game case: **both games, shared plumbing** (a figure is FFX or
FFX-2 by its art id; nothing here knows the difference). This lane built the **cutting pipeline and the gate**; the engine lane built `RigActor` (`docs/handoff/rig-engine.md`, `src/data/art/rigTypes.ts`),
the Kimahri lane cuts the first rig. Contract entry: `docs/CONTRACT-CHANGES.md` (2026-10-17, "The rig pipeline and the rig gate"). Paper preflight: `docs/plans/rig-review.md`.

## The idea, in four lines

A figure is ONE approved painting (its **costume**) cut into parts on a bone rig. A pose is a set of bone transforms (a **key**) fitted to the approved painting of that pose. Because every pose is the same
pixels bent, two poses cannot differ in size, feet or costume: the pose continuity problem has no room to exist. The painting-per-pose rows stay as the fallback and keep their rows and waivers.

## The commands (every step is a CLI over `tools/rig/subjects/<name>.json`)

```
PY=D:/Tools/ComfyUI/python_embeded/python.exe          (numpy, PIL, scipy, skimage, numba, torch + SAM 2.1 for --sam)
$PY -I tools/rig/rig.py cut      --subject <name> [--sam] [--only a,b] [--cpu]   masks -> label map -> part images (+ classical underlaps and fills)      work: D:/pyrefly-art-rigs-work/<name>/
$PY -I tools/rig/rig.py build    --subject <name>                                bones, meshes, skin weights, landmarks, a PNG and a rim mask per part
$PY -I tools/rig/rig.py fit-keys --subject <name> [--poses a,b] [--retarget]     bone transforms matching each approved painting (IoU), feet planted, stature in band
$PY -I tools/rig/rig.py export   --subject <name> [--no-gate] [--out DIR]        rig.json + PNGs -> D:/pyrefly-art-rigs/<id>/ (REFUSES a path under public/), then the gate
$PY -I tools/rig/rig.py sheet    --subject <name>                                contact sheet: each key beside its approved painting, with the gate's overlap, stature, feet, head
$PY -I tools/rig/rig.py all      --subject <name> [--sam]
node tools/rig-gate.mjs --rig D:/pyrefly-art-rigs/<id> [--art D:/pyrefly-art-r50] [--check] [--verify] [--no-blends] [--require-coverage] [--json F]
node tools/art-install.mjs --target <art> --rig <id> --rig-from <folder> [--rigs-root D:/pyrefly-art-rigs] [--replace --backup F] [--require-coverage] [--dry]
node tools/pose-gate.mjs --check --rigs auto|<dir> [--rigs-mode full|stamp]
node tools/rig/rig-targets.mjs --subject <id> --out <dir> [--art D:/pyrefly-art-r50] [--table T.json]      (the fitter calls it: the approved paintings on the pose model's grid)
```

`--subject` is the **config's name** (`tools/rig/subjects/<name>.json`); its `"subject"` field is the art id (`kimahri`). The config has sections `sam` (prompts), `cut` (parts, order, label recipe, ops),
`build` (bones, chains, skin per part, landmarks), `fit` (limits, hints), `motion`, `keys_extra`, `hooks` (a Python module for what the declarative config cannot say). Each section's fields are documented in the
header of its module (`rig_sam.py`, `rig_cut.py`, `rig_pred.py` for the mask predicate language, `rig_build.py`, `rig_fit.py`). **Start from `subjects/yuna-white-mage.json`**, a complete port of the
prototype's config-driven builder (4 parts, 5 bones). While `D:/Tools/pyrefly-scratch/GPU-QUIET` exists SAM runs on the CPU (`rig_sam.py`); nothing else in the pipeline touches the GPU.

## The file (what `export` writes; `src/data/art/rigTypes.ts` is the authority)

Key `rot` in **radians**; `weights` four numbers a vertex (`[b0, w0, b1, w1]`, or `bone` for a rigid part); `uvs` v down; `costume {painting: "characters/<id>/<pose>", pose, sha (64 hex of the 1x painting), sha2x
(the @Nx master the parts were cut from)}`; keys carry `source: "characters/<id>/<pose>"` and `fit {iou, stature, feetPx}`; `idle` is always a key (the rest pose). `gate` is written only by the gate.

## The gate's rules, as built (`tools/rig/rig-gate-lib.mjs`; `rig-gate.mjs` exits 1 and stamps `gate.status: refused`)

1. `rig-*` the file is valid (shape, bones parents-first, meshes, skin, keys, every PNG it names, a `head` and a foot landmark).
2. `costume-*`, `baseline`, `rest-differs` it is cut from the ONE approved master: `characters/<id>/<pose>.png` exists, its sha256 (or the `@Nx` master's) is `costume.sha`, the image is that painting at `scale`, the rig plants its
   soles on the painting's registered ground row (1.5 px), and the rest pose overlaps the painting by 0.95 (the cut is made from the defringed painting: 1.0 is not reachable).
3. `key-iou` every key's silhouette overlaps the **approved painting of that pose** by 0.85 or more, **both registered at the idle's scale and feet**: the painting as the game draws it (`placePose`), then, for a
   standing or low pose, rescaled about its soles into its class's stature band if it is outside it and slid so its stance sits on the idle's (`rig-read.mjs#approvedTarget`). The rig is judged on the shape of the
   pose, never on a painting's registration flaw. A key with no painting must say `source: "authored"`.
4. `key-<flag>` every key is inside its pose class's bands (`tools/posescale/pose-bands.mjs`, the same `bandVerdict` the pose gate uses on a painting): stature, real head, feet (2 percent of the idle's height), mass,
   stance, overlap, solidity. **Props-out poses read head to soles**: a pose whose painting carries a prop above its head, and every pose of a subject whose IDLE does (Kimahri's spear butt is the top of his idle's
   silhouette; a dropped spear lowers the silhouette though the body stands as tall). A key with `planted: false` is not held to the idle's soles.
5. `key-feet-landmark` the runtime's own planted-feet check (0.4 percent of the image height, the key's `root.dy` aside); `key-fit-stale` a key's recorded `fit` is a claim, not a reading: it must be within 0.05 of overlap and 0.04 of stature of what the gate measures.
6. `hole-key`, `hole-blend` no alpha hole (more than 4 transparent pixels, alpha under 0.3, in a disc of 0.75 x the joint's rest depth around the POSED joint, at a raster where the figure is 1100 px tall) at any body joint in any
   key, nor at 25, 50 and 75 percent between **any two keys** (the game blends between any two). A joint's depth is read from the parts that meet at it (skinned to its bone or its parent's), not from the whole picture: a wrist
   is covered by the arm, not by the hip the arm hangs in front of. `rig-holes.mjs` explains why a fold shows the biggest wedge half way.
7. `budget-*` parts <= 24, bones <= 48, vertices <= 8000, triangles <= 14000, texels <= 9 Mpx, PNG bytes <= 9 MB. That is about twice the hand-cut prototype Kimahri (11 parts, 29 bones, 3068 vertices, 4.2 Mpx, 4.5 MB), the
   largest figure cut so far; four such rigs on screen stay near 140 MB of texture.
8. `coverage` (only with `--require-coverage`): every pose the game has a registered painting of has a key. `result.uncovered` lists them either way.

The gate reads everything with the pose model (`tools/posescale/pose-model.mjs`) and shares no code with the fitter, so it is a second, independent reading of what the fitter claims. `gate.digest` fingerprints the rig and
every PNG: any edit after the stamp is `gate-stale` (`--verify` checks that cheaply, no rendering).

## What is wired

* `tools/pose-gate.mjs --check --rigs auto|<dir>`: a painting row that would pass or be waived, for a pose a gate-ok rig has a passing key for, is reported `rigged` (outcome `rigged`, `was`); a failing row still fails with the same
  codes; ledger, ratchet and waivers untouched; a rig that is not ok is a note ("rig not counted"). Counted only if the stamp verifies AND (mode `full`, default) the gate agrees when run again now. Without `--rigs` the output is
  byte for byte what it was. `enforcePoseGate({rigs})` takes the same option; **the deploy does not pass it** (the release art mirror for rigs is the engine lane's TODO): see "open" below.
* `tools/art-install.mjs --rig`: a rig is copied into the rig root only through the gate (see its header and `tools/rig/rig-install.mjs`).
* `tools/posescale/pose-model.mjs` exports `referenceOf`, `pose-pixels.mjs` exports `GRID` (additive).

## Tests

`tests/unit/tools/rig-gate.test.ts` (16+2 cases on a puppet of rectangles whose paintings are drawn by SVG): the control passes; a key at overlap 0.6, a floating foot, a hole at the elbow half way between two keys (a
cap that rides the elbow along a chord while the elbow swings along an arc), a stale costume, a wrong ground row, 25 parts, a bad triangle, a bone that is not there, a foot landmark swung off the bind row, no foot landmark,
a partial rig, a stale stamp, a refused stamp. `tests/unit/tools/rig-census-install.test.ts` (7): `rigged` relabelling, a stale or forged stamp counts nothing, the installer's refusals. `tests/unit/tools/rig-kimahri-mini.test.ts` (4):
the passing rig built from the prototype Kimahri by the real pipeline (below), and the same rig broken two ways. Python: `tools/rig/test_rig_pipeline.py` (`$PY -I tools/rig/test_rig_pipeline.py`).

**`tests/fixtures/rig/kimahri-mini/`** is the prototype Kimahri (11 parts, 29 bones) quartered and painted one flat colour a part (no painted art is committed), with idle and four poses drawn by bending the rig by hand-chosen
angles plus a degree of noise (the "approved paintings"), and the rig the REAL `fit-keys` and `export` made from those paintings alone: idle plus attack (overlap 0.87), defend (0.93), hurt (0.86) and victory (0.94) by the gate's own
reading, the fitter having claimed 0.87, 0.94, 0.87 and 0.94. It passes the gate (35 poses scanned for holes at 19 joints in 0.6 s): the fitter (Python) and the gate (Node) share no rasteriser.
`tools/rig/make_fixture.py` regenerates it.

## What the Kimahri lane must know

* Cut from the **idle@2x** (`costume.pose: "idle"`, `scale: 2`); r49 and r50 idles are the same file (sha `ea206624...`). The prototype's SAM prompts are in `D:/Tools/pyrefly-scratch/2026-10-15/quality-leap/proto-25d/art/kimahri-sam.json`
  and its masks in `.../art/kimahri/sam1x/` (copy them to `D:/pyrefly-art-rigs-work/<name>/sam/` and `cut` runs without SAM). The prototype's tuned label recipe, fills and the spear ribbon are in its `tools/kim_*.py`; the
  declarative `cut.ops` (skirt, extend, smooth_fill, shade) and the predicate language (`rig_pred.py`: colour tests, segments, polygons, grown/shrunk) cover everything except the spear ribbon, which goes in a hook
  (`"hooks": "kimahri_hooks.py"`: `cut_labels(state)`, `cut_parts(state)`, `skin_<name>(state)`, `build(state)` may add a part).
* **The Kimahri idle is props-out** (the spear butt is the top of his silhouette): every key is judged head to soles. The head box of the idle row (`src/data/art/poseRegistrationFfx.ts`, `head`) is what the head bone carries.
  The landmark `head` must name the bone that carries the head; a foot landmark (`feet`, `footN`, ...) is required.
* The registered Kimahri poses are `attack cast critical defend follow hurt idle item jump ko ready sleep victory`. Poses a rig cannot reach (jump, ko, critical, sleep: a silhouette far from the idle) stay paintings; **but a pose with
  no key resolves down the chain to the nearest key, not to its painting** (`src/engine/rig/RigKeys.ts`): a rig with keys for only some poses changes the others. Use `--require-coverage` when installing for real, or have the engine
  fall back to the painting per pose. `npm run` nothing: it is the gate's `uncovered` list.
* `D:/pyrefly-art-rigs/kimahri-proto/rig.json` carries a `gate.status: ok` stamped by `tools/rig-from-proto.mjs` ("smoke fixture, not the rig gate"). The runtime draws it (it reads the status); **the rig gate refuses it** (three keys at overlap 0.1 to 0.5; its costume sha is the @2x master's, which the gate accepts; no hole at any of its 23 joints in any key or blend, with the joint rule as built). Do not install it.
* Keys are written as `radians`; the file must stay 4-numbers-a-vertex or `bone`; spaces are the master's pixels (2x), y down.

## Findings and open items (not diagnosed away)

* **Real data: the prototype Kimahri rig fitted, untuned, to the r50 Kimahri paintings** (`fit-keys` on the 11 parts and 29 bones of `D:/pyrefly-art-rigs/kimahri-proto`, default limits, about a minute a pose, then `export` and the gate, all
  in a scratch folder): **critical 0.90 and sleep 0.92 reach the bar** (the gate reads 0.899 and 0.912) and the 3-key rig (idle, critical, sleep) passes the gate; **attack 0.70, cast 0.74, defend 0.76, follow 0.57, hurt 0.78, item 0.72,
  jump 0.69, ko 0.62, ready 0.70, victory 0.70 do not**. `work/fit/overlay_<pose>.png` shows why for the attack: the painted lunge throws the far leg back, curls the tail low and reaches the arm forward, past the default limits (thigh 110
  degrees, tail 50 degrees a bone) and past what the cut's parts can bend into; the trunk, head and near leg are matched. Expect two to four of the twelve poses at 0.85 on a first pass; the rest take `fit.keys.<pose>.init` hints,
  wider `limits`, a pose-specific `chain_limit`, or a repaint, and the poses that stay under 0.85 stay paintings (see the partial-rig note above).

* **The fitter** (`rig_fit.py`) is block-wise CMA-ES: the trunk (whole-figure offset, hips offset, pelvis, spine, chest), then each limb (a bone and its descendants, six bones or fewer) in turn, two rounds with the smoothing of the
  overlap shrinking, then a coordinate polish on the binary overlap; only the parts a block moves are redrawn per evaluation. On a pose the rig can make exactly it recovers the angles to a degree and the overlap to 0.999
  (a 29-bone rig: about 100 s; the fixture's four painted poses: 25 to 30 s each, overlap 0.86 to 0.94). A planted key never lifts the figure (`root.dy` is 0): the runtime's own check lets a key move its lowest foot only by the
  whole-figure offset it declares, so a crouch goes down through the HIPS (`fit.offsets`, default the root's first child: its dx and dy are parameters) with the knees bent. Silhouette overlap cannot tell left from right
  limb or a thin spear's sign. A pose the fitter cannot bring to the gate's 0.85 is not exported and stays a painting; `config.fit.keys.<pose>.init` takes a hand-given start (degrees), `limits` and `free` narrow the search.
  Yuna (white mage), the proof subject for the cutting steps (4 parts, 5 bones), reaches none of her 11 poses (overlap 0.33 to 0.60, kept at 0.88): her paintings differ from her idle by more than four parts can bend, and her KO, critical and
  sleep need `fit.keys.<pose>.planted: false` and `root_rot`. Not a pipeline fault: that is what the gate says. Her idle-only rig passes the gate (`export` into a scratch `PYREFLY_RIGS_DIR`; nothing was written to `D:/pyrefly-art-rigs`).
* **Stance normalisation is large.** A pose registered on the idle's feet can sit 10 to 20 percent of the figure's height off the rest pose's feet; the key's `root.dx` carries it (the fitter starts there). The engine must apply
  a key's `root` as the figure's offset (it does).
* **The deploy does not run the rig gate.** `tools/deploy-pages.mjs` never reads `D:/pyrefly-art-rigs`; once a release art mirror holds rigs, add `node tools/rig-gate.mjs --rig <each> --verify` (cheap, stamp and digest) or
  pass `rigs: {dir}` to `enforcePoseGate` (full re-gate, about 5 to 10 s a rig). The runtime trusts `gate.status === 'ok'` alone.
* The hole test is local to each joint and strict; a rig whose lag-chain joints sit inside the body and are covered by parts on other bones may need underlap added in the cut (see `skirt`). Reported by joint name.
* Rig textures are the 2x masters' crops; the budget counts them as such.
