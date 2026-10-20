# Rigs for the conference demo's two bosses (branch `rig-demo-bosses`, from `origin/rig-expressive-2` ab09a619f, 2026-10-20)

AUTH (Bailey's words, quoted by the driver): 2026-10-19 "I need a way to quickly improve the graphical fidelity of the game as well as the motion, animation, visual style. I demo my game in a week at a huge gaming
conference." (2026-10-26); "We need this done for all characters and bosses. It's a priority"; "some of the poses look too stiff still"; a stiff rig "looks like crap", so rigs are judged IN MOTION. Driver decisions 148
(the expressive-keys method is the standard), 153 (cross-fade; aeon and boss budget 12 MB / 12 Mpx), 156 (the demo chapters are Chapter I Seymour Flux and Chapter IV FFX-2 Bahamut).

**Game case.** `ffx2-bahamut-x`: **FFX-2 only** (Chapter IV's Bahamut, `characters/ffx2-bahamut/*`, the combatant `bahamut`; the FFX aeon Bahamut is a different art id). `seymour-flux-x`: **FFX only** (Chapter I; the
actor `seymour-flux` draws `characters/seymour-flux-body/*`). Shared plumbing changed here (the gate's boss budget, the splash exemption, `fit.fit_classes`, the recorder's `--keep-sway`, `PYREFLY_LANE_QUERY` and a
lock hand-over) is **both games**.

**State: both rigs are gated `ok`, `--verify` passes, both stay OFF.** Nothing was installed into `public/art`, merged, deployed or reviewed. The shipped rig folders were not touched. Rig folders (new):
`D:/pyrefly-art-rigs/ffx2-bahamut-x`, `D:/pyrefly-art-rigs/seymour-flux-x`. Work: `D:/pyrefly-art-rigs-work/<name>`. Evidence, clips and sheets: `D:/Tools/pyrefly-scratch/2026-10-20/rig-demo-bosses/<name>/for-bailey/`.

## 1. Go / no-go, subject by subject

| subject | verdict | why |
|---|---|---|
| `ffx2-bahamut` | **GO, built** | The five paintings (idle, attack, cast, hurt, telegraph; KO) are different drawings of one body plan: a long-necked dragon on a column of armour, two big wings, a looped tail. Registered into the idle's frame their silhouettes overlap the idle's by 0.57 to 0.71 (KO 0.43, it lies down). Every part has a counterpart in every pose, so each pose's own painting can be cut into the same parts. |
| `seymour-flux` (the body: `seymour-flux-body`) | **GO, built** | Six paintings of one crouched figure (knee up, sleeve, hair): overlaps with the idle 0.61 to 0.85 as the pose model registers them. Head, hair feathers, arm, leg and robe correspond across poses. The pose model calls the body a `part`, which the fitter refuses; `fit.fit_classes: ["part"]` lets it fit (a painted whole figure, not a hull). |
| `seymour-flux` idle painting (the robed standing figure) | not rigged | The fight does not draw it (`BattlePresenterArt.ts` maps the actor to `seymour-flux-body`); only debug scenes load it. One painting, no poses. |
| `mortiorchis` | **NO-GO** | The idle is a bone mass with a crown, a halo, a scythe and a long arm; the attack is a winged-rib drawing with the skull top left and the scythe held across the bottom; the hurt is a two-skull quadruped skeleton; the KO a third arrangement. Centroid-aligned silhouette overlaps with the idle: attack 0.35, cast 0.45, hurt 0.35, KO 0.32 (Bahamut 0.57 to 0.71, Seymour 0.61 to 0.85). There is no shared anatomy, so a rig would be five whole-figure pieces on bones that carry nothing: the painting set with a hard swap. Better for it: the engine's own breathing and sway, and the cross-fade of decision 153. |

## 2. What was built

Method (`tools/rig/lane/expressive/README.md`, extended): the idle painting is cut into parts on a skeleton (`rig.py cut`, `build`); the pose model's targets and the marks (landmarks of each pose painting, read by eye)
give a bones-only baseline key per pose (`lane_marks.py`, `lane.py fit`, `select`); **every part of every pose is then cut from that pose's own painting** (`autopart.py` partitions the painting among the parts by where
the baseline key puts each, the partition is dilated into its neighbours for the underlap, `rig_vcut.py` cuts format v2 variants through a mask), the keys' bones are nudged until every joint the hole test watches sits inside
its own pieces (`jfit.py`), the near misses are closed with small fill discs, the PNGs are recompressed losslessly, the gate and `--verify` run (`fin.sh`).

### FFX-2 Bahamut (`tools/rig/subjects/ffx2-bahamut-x.json`, masks in `ffx2-bahamut-x.masks/`)
- 5 parts: head (with the neck down to the shoulder line), body (a 2-bone chain), wing L, wing R (3-bone chains each), tail (a 12-bone chain); 22 bones; every part has a piece cut from attack, cast, hurt, telegraph and KO (25 pieces; the counts the gate reads are in section 3). The tail pivots sit on the tail's outer edge (lesson 2).
- Head: `scaleArea` tuned until each head piece's OPAQUE area is the idle head's (1.00 within 0.5 percent): 1.39 attack, 1.27 cast, 1.20 hurt, 1.28 telegraph, 1.15 KO, so the pieces are drawn 7 to 18 percent larger than the paintings' heads (the painting set's own heads are 0.72 to 0.87 of the idle's, which is the size jump the rule removes). KO keeps the size: the head mesh area hurt against KO in the real game is 0.0413143 both, ratio 1.0000.
- Idle sway (not gated): chest, head, both wing chains (up to 2.4 degrees at the tip bone), the tail chain (up to 4 degrees at the tip), 0.45 Hz.

### Seymour Flux (`tools/rig/subjects/seymour-flux-x.json`, masks in `seymour-flux-x.masks/`)
- 6 parts: body (rigid on the pelvis bone), arm and leg (rigid), head (rigid), two hair feathers (3-bone chains each); 12 bones; a piece of every part from attack, cast, hurt, telegraph and KO (a 36 px underlap).
- Head pieces: `scaleArea` 1.06 attack, 1.06 cast, 1.08 hurt, 1.09 KO, 1.17 telegraph (opaque 0.999 to 1.001).
- Idle sway: pelvis, chest, head, both hair chains (up to 4.5 degrees at the tips), arm, leg; 0.5 Hz.

## 3. The gate, verbatim

`node tools/rig-gate.mjs --rig D:/pyrefly-art-rigs/ffx2-bahamut-x --art D:/pyrefly-art-r59`, then `--verify` on a copy named `ffx2-bahamut`:

```
rig-gate: ffx2-bahamut: OK; 6 of 6 key(s) pass; rest overlap 1.000; 66 poses scanned for holes at 8 joints; 5 parts, 22 bones, 7809 vertices, 9.99 Mpx, 11.76 MB; 5.3 s
  ok   idle       idle     iou 1.000  stature 1.001  feet 0.000, 0.001  head n/a
  ok   attack     standing iou 0.984  stature 0.917  feet -0.001, -0.001  head n/a  landmarks 0.023
  ok   cast       standing iou 0.993  stature 0.988  feet -0.002, 0.001  head n/a  landmarks 0.024
  ok   hurt       standing iou 0.993  stature 0.980  feet -0.002, 0.001  head n/a  landmarks 0.034
  ok   ko         ko       iou 0.982  stature 0.978  feet 0.000, -0.001  head n/a  landmarks 0.023  AUTHORED
  ok   telegraph  standing iou 0.978  stature 0.924  feet 0.001, 0.001  head n/a  landmarks 0.023
  format v2 variants (palette distance from the base part, 0 same to 1 nothing in common): tail:attack 0.39, tail:cast 0.41, tail:hurt 0.313, tail:telegraph 0.248, tail:ko 0.256, wingL:attack 0.458, wingL:cast 0.439, wingL:hurt 0.403, wingL:telegraph 0.39, wingL:ko 0.466, wingR:attack 0.587, wingR:cast 0.492, wingR:hurt 0.502, wingR:telegraph 0.508, wingR:ko 0.519, body:attack 0.355, body:cast 0.338, body:hurt 0.33, body:telegraph 0.272, body:ko 0.357, head:attack 0.551, head:cast 0.464, head:hurt 0.381, head:telegraph 0.478, head:ko 0.435
rig-gate: D:/pyrefly-art-rigs-work/ffx2-bahamut-x/verify-copy/ffx2-bahamut: verified: stamp ok (6 key(s), full coverage, 1 exempt), 1x tier proved (60 file(s))
rig-gate: PASS
```

`node tools/rig-gate.mjs --rig D:/pyrefly-art-rigs/seymour-flux-x --art D:/pyrefly-art-r59`, then `--verify` on a copy named `seymour-flux-body`:

```
rig-gate: seymour-flux-body: OK; 6 of 6 key(s) pass; rest overlap 0.994; 66 poses scanned for holes at 9 joints; 6 parts, 12 bones, 7927 vertices, 10.85 Mpx, 10.49 MB; 4.1 s
  ok   idle       idle     iou 0.994  stature 0.993  feet -0.000, 0.001  head n/a
  ok   attack     part     iou 0.991  stature 1.017  feet -0.000, -0.007  head n/a  landmarks 0.020
  ok   cast       part     iou 0.989  stature 0.993  feet -0.001, 0.002  head n/a  landmarks 0.028
  ok   hurt       part     iou 0.992  stature 0.937  feet -0.001, 0.001  head n/a  landmarks 0.048
  ok   ko         part     iou 0.992  stature 0.977  feet -0.003, -0.007  head n/a  landmarks 0.046  AUTHORED
  ok   telegraph  part     iou 0.984  stature 0.873  feet -0.001, -0.003  head n/a  landmarks 0.020
  format v2 variants (palette distance from the base part, 0 same to 1 nothing in common): body:attack 0.569, body:cast 0.54, body:hurt 0.492, body:telegraph 0.517, body:ko 0.431, leg:attack 0.597, leg:cast 0.603, leg:hurt 0.493, leg:telegraph 0.595, leg:ko 0.582, arm:attack 0.622, arm:cast 0.622, arm:hurt 0.752, arm:telegraph 0.721, arm:ko 0.724, hairU:attack 0.771, hairU:cast 0.643, hairU:hurt 0.537, hairU:telegraph 0.633, hairU:ko 0.701, hairM:attack 0.77, hairM:cast 0.725, hairM:hurt 0.632, hairM:telegraph 0.592, hairM:ko 0.752, head:attack 0.643, head:cast 0.647, head:hurt 0.592, head:telegraph 0.647, head:ko 0.58
rig-gate: D:/pyrefly-art-rigs-work/seymour-flux-x/verify-copy/seymour-flux-body: verified: stamp ok (6 key(s), full coverage), 1x tier proved (72 file(s))
rig-gate: PASS
```

## 4. Head area per key (`ha.py`)

FFX-2 Bahamut (the head part: the opaque pixels are the size rule; the mesh column is `scaleArea`):

```
head: idle mesh 144523 opaque 109602
  idle       image -        mesh 1.000  opaque 1.000
  attack     image attack   mesh 1.393  opaque 0.996
  cast       image cast     mesh 1.267  opaque 0.996
  hurt       image hurt     mesh 1.199  opaque 0.998
  ko         image ko       mesh 1.151  opaque 0.999
  telegraph  image telegraph mesh 1.282  opaque 1.002
```

Seymour Flux:

```
head: idle mesh 172410 opaque 151591
  idle       image -        mesh 1.000  opaque 1.000
  attack     image attack   mesh 1.060  opaque 1.000
  cast       image cast     mesh 1.062  opaque 1.000
  hurt       image hurt     mesh 1.076  opaque 0.999
  ko         image ko       mesh 1.089  opaque 0.999
  telegraph  image telegraph mesh 1.167  opaque 1.001
```

## 5. The real chapter

Recorded with the kit's recorder (`record.mjs --alias <art id>=<rig folder> --modes poses,ko --off --keep-sway`, headless Chromium on the real GPU, exact 60 Hz virtual clock, 1600 x 900, seed 1): `[rig] ffx2-bahamut on (gate ok, 5 parts, 22 bones, 6 keys, 1x maps)` and `seymour-flux-body` likewise; the only console errors are the 404s of figures that have no rig.

**FFX-2 Bahamut, Chapter IV, the fight on the game's `intended` strategy to the KO** (`D:/Tools/pyrefly-scratch/2026-10-20/rig-demo-bosses/bahamut2/ko-summary.txt`):

| | pose swap frame | projected box (w x h) before to after | head mesh area hurt / KO | whole-figure mesh area | worst one-frame step head / centroid / feet |
|---|---|---|---|---|---|
| painting set (rig off) | 11500 | 593.8 x 576.2 to 636.7 x 579.9 (height x1.006, area x1.079, centre move 142.2 px) | the probe's own row for the swap: head 409.4 to 391.8 px (ratio 0.9571), outline IoU 0.373, centroid shift 106.3 px | - | the silhouette steps 106.3 px in the swap frame |
| the new rig | 11501 (HP 0 at 11405) | 594.3 x 578.6 to 594.6 x 578.9 (height x1.001, area x1.001, centre move 4.9 px) | 0.0413143 / 0.0413143 (ratio 1) | 0.75369 to 0.75363 (ratio 0.9999) | 114 / 49.3 / 55.6 px (frame 11506) |

The KO keeps the size (no shrink): the rig's box does not change (height x1.001), the head mesh is the same area hurt and KO, where the painting set's box widens by 7.9 percent and its centre jumps 142 px in the swap. The rig's own lie-down is a fast move (114 px in its worst single frame, 5 frames after the swap), as the painting set's silhouette steps 106 px in one frame; read it against that, not against zero. The probe's CHK-026 reads PASS for both runs (it is vacuous for a rig).

**Seymour Flux, Chapter I: in the real fight the actor never swaps to the KO painting.** At 0 HP (frame 11947) the body goes hurt, idle, hurt (HP 0 at frame 12010), idle and the fight ends on that (the Mortiorchis actor leaves in the ice); `ko-summary.mjs` therefore reads no swap (`seymour/ko-summary.txt`), and the KO painting is drawn only when a tool forces it. `seymour-flux-lethal-hurt-motion.mp4` is that real ending (the lethal hurt and the return to idle), `seymour-flux-ko-motion.mp4` is the forced idle-to-KO move of the `poses` mode. The continuity probe on the rig-on run: CHK-026 PASS, CHK-027 PASS; max head jump 12.1% (0.1% registered, a control), 0 snaps/min, worst swap jerk 26.5 px.

**Clips and sheets** (`D:/Tools/pyrefly-scratch/2026-10-20/rig-demo-bosses/<bahamut2|seymour>/for-bailey/`; mp4, 60 fps, 1600 x 900, painting set on the left, rig on the right, each panel centred on its own figure):
- `ffx2-bahamut-{idle,attack,cast,hurt,telegraph,ko}-motion.mp4`, `ffx2-bahamut-hurt-to-ko-motion.mp4`, `ffx2-bahamut-three-way-poses.png`, `ffx2-bahamut-three-way-hurt-ko.png`
- `seymour-flux-{idle,attack,cast,hurt,telegraph,ko}-motion.mp4`, `seymour-flux-lethal-hurt-motion.mp4`, `seymour-flux-three-way-poses.png`, `seymour-flux-three-way-lethal-hurt.png`
- The three-way sheets are A the painting set the game draws today, B the rig, C where they differ (A against B, three times brighter). There is no rig of today for either boss, so there is no middle panel of an older rig.
- Offline previews (the kit's numpy rasteriser, no game, the blend over 30 frames; the real move is 8 frames): `<bahamut2|seymour>/offline/idle-to-<pose>.mp4`.

## 6. What changed in the shared kit, and why (both games)

- `tools/rig/rig-gate-lib.mjs` (+ `.d.mts`): `BUDGET_BOSS` (12,000,000 texels and bytes; parts, bones, vertices, triangles unchanged) and `budgetOf(subject)`: aeons, dark aeons, bosses and parts get it, the party and the dresspheres keep 9 / 9 (decision 153). The `splash` painting is exempt from key coverage (it is the Mega Flare cut-in, `battleSpectacle.ts#splashArtFor`, never drawn as the actor's pose).
- `tools/rig/rig_fit.py`, `lane/lane_fit.py`: `fit.fit_classes` (`["part"]` fits a figure the pose model calls a part); the idle's rest vector no longer crashes a config that has `fit.scales`.
- `tools/rig/lane/record.mjs`, `play.mjs`, `play-modes.mjs`, `play-common.mjs`: `--keep-sway` (the actor's own breathing and sway stay on, the camera's is off) and `PYREFLY_LANE_QUERY` (extra page query; **`wait=hold` for an FFX-2 `poses` recording**: in Wait mode the clock still runs at the top-level command list, so the boss attacked, charged and was hurt during the first recording and the poses were not the poses asked for); a recorder that is a queue's child accepts a lock held by its parent.
- `tools/rig/lane/expressive/`: paths point at this tree and `D:/pyrefly-art-r59`; `mkvar.py --meshk`; `mo2.py` (two-panel motion clips), `tw3.py` (three-way stills).
- Tests: `tests/unit/tools/rig-subject-demo-bosses.test.ts` (16), the 391 rig tests and `tsc --noEmit` are green.

## 7. Lessons for the next lane

1. **A pose painting's tail pixels must have a piece to land in.** The first Bahamut kept the tail as the idle's piece; `autopart` gave the tail the pixels of the baseline key's tail silhouette, which in the KO took a long lower wing tip with it (a torn wing in the KO). Either every part gets a piece or the partition must not name the part that has none.
2. **Twelve centre-line tail pivots cannot be kept inside the pieces of five paintings, and the hole test watches every joint of rest depth 6 px or more (disc 0.75 of it).** Moving the pivots of the tail chain to 3 px from the tail's outer edge makes their depth under 6, the hole test stops watching them, and nothing is lost: pieces register to whatever the bones are, a pivot is only where the tail bends (the lane's `mkcfg.py` does it from the cut part image).
3. **A baseline fit that turns a bone 80 degrees to chase the silhouette poisons every blend** (a candy-wrapper hole at the joint, 100 to 2,000 px, in each blend with that key). Pieces make the overlap, so hold the baseline's bones to a natural range (wings 40 degrees) and refit; `jfit` then needs only small nudges.
4. **Offsets on chain bones are not free.** `jfit --alloff` closed the key-level holes with 40 to 60 px of offset on wing and tail bones, and the blends then tore. Free only the non-tail bones' offsets, with `--maxd 0.3 --offmax 50`, and use `--margin` 16 to 22 for a joint with a big disc.
5. **Near misses are closed with `fill_joints` (a disc of the painting's own colours extended into a transparent gap), the large ones with a radius up to 175 px on a joint that sits in the middle of a wing membrane.** Check the offline preview for a sliver at the silhouette.
6. **A compact figure wants a rigid skeleton.** Seymour's first body chain put a joint 80 px deep inside the robe; its disc (132 master px) could not stay inside the KO painting's robe. Body, arm and leg rigid on one bone each, the chest held (`fit.fixed`), the hair on chains: 12 bones, 9 watched joints, ok.
7. **The recorder's FFX-2 `poses` mode needs `PYREFLY_LANE_QUERY=wait=hold`.** In Wait mode the clock still runs at the top-level command list; Bahamut attacked, charged and was hurt during the recording and `cast`, `hurt` and `ko` were never drawn. With the hold every pose is the pose asked for (`poses-info.json` says so per pose).
8. **The painting set already cross-fades its pose swap** (the real-game frames at 23 and 25 of the attack move show two ghosted paintings); the rig draws crisp pieces on moving bones and pops the image set at the half-way. Of the two, the rig's move reads as an articulated body; its remaining flaw is the pop, which the cross-fade of decision 153 (a `fadeMs` in format v2.1, not built) would hide.
9. **At 1600 x 900 the game loads the rigs' 1x tier** (`gate ok, ... 1x maps`): the base parts are the 1x twin of the 2x master, the variants are the half of a file already at `tex` 0.33 to 0.55 of the master, so a piece is about 1.8 screen pixels a texel and reads a little softer than the base parts. The 12 MB / 12 Mpx budget is the master sizes; raising `tex` further needs a larger budget or fewer pieces (the tail and body pieces could go first: they pop least).
10. **Budgets that bit:** vertices (8,000: a variant's own mesh counts; coarsen the variants' meshes with `--meshk` or a `mesh` extra, the body pieces most), texels and bytes (a lossless recompression gives back 5 percent), and the head's opaque-area rule (it asks for scale factors up to 1.39 when a pose's head is cut short by the partition line).

## 8. Not done / for the driver

- **Not recorded / not done:** `mortiorchis` (no-go, above); a rig of today for either boss (none exists); the Seymour fight's KO swap (it never happens); a cross-fade (engine, decision 153); the rigs are not installed, merged, reviewed or deployed; the Bahamut telegraph is recorded as a held pose, not inside the Mega Flare charge of the real fight (the `ko` run plays that fight, the clip does not cut to it).
- **For the driver to decide:** (a) whether to ship a boss budget in the gate as built here (`budgetOf`: 12 MB / 12 Mpx for aeons, dark aeons, bosses and parts); (b) the pop at the half-way of each move: the quickest visible gain is a per-key `ms` of 220 to 260 for the bosses' attack and hurt keys (the rig draws moving bones for twice as long before the image set changes) or the engine cross-fade; (c) whether the variants' softness at the 1x tier is acceptable for the demo or the pieces should be cut back (tail and body) to raise the texture of the wings and heads; (d) `fit.fit_classes` and the splash exemption are shared plumbing and want a line in the critic's plan.
- **Scratch kept** (`D:/Tools/pyrefly-scratch/2026-10-20/rig-demo-bosses/`): `bk/mkcfg.py` and `bk/mkcfg_s.py` (the configs' generators), `bk/extras_*.json` (per-variant extras), `bk/*.sh` (jfit, finish, recording queue), `bk/waitrec.mjs` (a queue waiter that claims `RIG-RECORD` the moment it is free and hands it to `record.mjs`).
