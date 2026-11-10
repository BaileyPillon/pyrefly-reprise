<!-- Repo copy of the reference-render lane (README then sizes), 2026-11-09. "REF section n" in docs/plans/ffx2-specials-look-review.md names the sections of the first part; "REF sizes" names the second. FFX-2 only. -->

# Reference renders of the real FFX-2 models for the nine Special parts (look-a:models, 2026-11-09)

**FFX-2 only** (the Special dresspheres do not exist in FFX). Task: reference renders for an image-to-image art kit for look A ("the game's own reading, faithful to the FFX-2 form": three bodies, main + two parts, each with its own gauge). Written by a Sonnet sub-agent of the Echoes of Spira driver. **Nothing was deployed, installed, merged or committed; no repository, art mirror or `public/art` was touched; the game, the emulator and every browser and GPU were not used** (the renders are a CPU z-buffer rasteriser, `tools/rview3.py`); nothing was downloaded (`downloads.md`). The FFX-2 files were read from the owner's own Steam copy (`FFX2_Data.vbf`, read-only) into the lane's scratch folder, which stays outside the repo.

Tags: **[R]** read from a game file; **[M]** measured on the renders; **[I]** inferred (with the reason); **[gap]** no source settles it, and it is not guessed.

## 0. The answer in ten lines

1. **Only the three mains are their own models: Floral Fallal = `c020`, Machina Maw = `c040`, Full Throttle = `c060`** (`chr/pc/`, the 20th slot of Yuna's, Rikku's and Paine's model blocks). [R + M]
2. **None of the six parts has a model file of its own that I could find.** Each Special model is **one skeleton and one mesh set that already contains the two parts**: a mirror-twin pair of bone subtrees whose bone counts are equal (38/38, 72/72, 65/65) and whose vertex counts agree to within 1 for two of the three pairs (986/987, 1,218/1,219) **and to within 12 for the Pistils (2,766/2,778; corrected 2026-11-09, second pass: this line first said "within 1" for all three)**, and whose centres are exact mirror images. **Right Pistil / Left Pistil = bone subtrees 269 / 334 of c020; Smasher-R / Crusher-L = subtrees 59 / 146 of c040; Dextral Wing / Sinistral Wing = subtrees 89 / 51 of c060.** Which side is which comes from the geometry (the figure's right is -x) and the names (R/L, dextral = right, sinistral = left). **[I, medium-high confidence; section 2 lists what would overturn it]**
3. **The parts look nothing like card A's drawing.** Right/Left Pistil are two large **ruffled white drapes** (cloak or wing-like sleeves) at Yuna's sides, inside a big purple five-petal hibiscus with three oval gems above and an orange oval at her feet; Smasher-R / Crusher-L are two **huge clawed mechanical legs** of the machina (Rikku, in a blue suit, rides on top); Dextral / Sinistral Wing are two **bladed wings** (eight blades each, a hub like a bronze horn) beside a red drum with Paine in it and six floating swords above. [M, I for the names]
4. **Sizes** (`sizes.md`): against Yuna's 16 units the mains are **2.6 / 1.8 / 2.8 times** her height; the parts are **0.7 to 0.9 times** (Pistils), **1.3 to 1.4 times** (machina legs) and **1.8 times** (wings). The game's own `height` field agrees (16 / 43 / 28 / 39). [R + M]
5. **The Specials have no collapse animation.** KO clips are copies of the hurt and idle clips (same curves): a Special that is knocked out stays standing in the files; its KO must be an effect or a fade. [M: `data/clipenergy-*.txt`, `survey` clip tables]
6. **The Floral Fallal long SP3 motion is a bloom**: a closed purple bud that opens into the hibiscus with Yuna inside; Machina Maw's and Full Throttle's long SP3 motions unfold the machine and the wings the same way. Looks like each Special's entrance. **Which game event plays it is not decoded [gap].**
7. **The girls' dress-up moment is in the files** as the long SP3 set of the girl's own model (all three have the same lengths, 240 frames for SP3_01): both arms overhead, skirt flared. The peak candidate is frame 131 of `SP3_01` (section 5). **The command that plays it is not decoded [gap].**
8. All pictures face **screen-right** with a three-quarter camera (the party contract of this project).
9. Every picture was looked at (contact sheets, spot sheets) and checked by script (`tools/qa.py`: no empty, black, cropped or border-touching picture; 0 rejects). The left wing hub reads as a black disc from the default camera: **that is the real model** (a flat black plate in the base texture, checked), shown from behind; the other views show its brass face.
10. **Gaps** are in section 8: the part identity (item 2) is the one the build should confirm before drawing nine sprites from it.

## 1. What the lane produced (kept in its scratch folder, not in the repo)

Tight and canvas renders of each of the nine parts and of the three whole Specials, poses idle, attack, cast, hurt, KO and the long SP3 set; the girls' dress-up candidates; three contact sheets; the common-camera size pictures; the motion-id tables, clip lists, mesh infos and the scripts that made them. Pose names: `idle-1` (frame 0), `idle-2` (mid); `attack-1..4`, `cast-1..4`, `hurt-1..3`, `ko-1..4`, `sp3long-1..4` (the long SP3 set, section 5). Tight pictures of the SP3 set of Machina Maw each have their own camera (the model jumps); every other tight set has one scale per part. The renders are made from the owner's own game files and stay out of the repo; the file names that remain in this note (`data/`, `tools/`) are the lane's own.

## 2. Which models, and are the six parts their own models?

| Part | Game model | Own model? | File ids (evidence) |
|---|---|---|---|
| Floral Fallal main (Yuna) | **c020** | **yes** (the main) | HD mesh `ffx-2_data/gamedata/ps3data/chr/pc/c020/mdl/d3d11/c020.dae.phyre` (5,091,225 B), texture `.../c020/tex/d3d11/c020.dds.phyre` (1,400,792 B) plus `c020_anim_n*_p1.dds.phyre` (animated-texture sheets); PS2-tree skeleton `ffx_ps2/ffx2/master/jppc/chr/pc/c020/mdl/c020.chr` (1,238,672 B, **446 bones**), banks `mot/resident0..3.mgrp` (group id 0x14: 2 + 27 + 1 clips, 1,992 frames) |
| Right Pistil | piece of c020 | **no file found** `[I]` | bone subtree **269** (65 bones, 2,766 vertices, centre x = -9.2) |
| Left Pistil | piece of c020 | **no file found** `[I]` | bone subtree **334** (65 bones, 2,778 vertices, centre x = +9.2) |
| Machina Maw main (Rikku) | **c040** | **yes** | `.../chr/pc/c040/mdl/d3d11/c040.dae.phyre` (1,116,569 B); `c040.chr` (536,272 B, **347 bones**); banks group 0x28: 2 + 44 + 1 clips, 2,870 frames |
| Smasher-R | piece of c040 | **no file found** `[I]` | subtree **59** (72 bones, 1,219 vertices, x = -8.9) |
| Crusher-L | piece of c040 | **no file found** `[I]` | subtree **146** (72 bones, 1,218 vertices, x = +8.9) |
| Full Throttle main (Paine) | **c060** | **yes** | `.../chr/pc/c060/mdl/d3d11/c060.dae.phyre` (1,659,763 B, **three mesh instances**: two of 3 joints = the six swords, one of 66 joints = body and wings); `c060.chr` (782,192 B, **147 bones**); banks group 0x3C: 2 + 42 + 1 clips, 1,928 frames |
| Dextral Wing | piece of c060 | **no file found** `[I]` | subtree **89** (38 bones, 987 vertices, x = -14.9) |
| Sinistral Wing | piece of c060 | **no file found** `[I]` | subtree **51** (38 bones, 986 vertices, x = +14.9) |

The yardsticks: Yuna's Gunner `c001` (`c001.dae.phyre` 940,260 B, `c001.chr` 328,496 B, 144 bones; height field 16.0), Rikku's Thief `c021`, Paine's Warrior `c041` (the models the earlier party-rig lane used; `build_armed_ffx2.py`).

**Why "pieces of the main, not own models" (the evidence, all in this folder):**

1. **The count of models per girl.** `chr/pc/pc.tbl` lists 118 models (`data/pc.tbl`). The ids 1 to 20, 21 to 40 and 41 to 60 are Yuna's, Rikku's and Paine's blocks (c001 Yuna Gunner, c021 Rikku Thief, c041 Paine Warrior are each girl's first slot); each block holds exactly **15 models: 14 ordinary dresses plus one Special** (slot 20, 40, 60). I rendered all 45 and looked at them. There are 14 ordinary jobs (Gunner, Gun Mage, Trigger Happy, Warrior, Samurai, Dark Knight, Berserker, Songstress, Black Mage, White Mage, Thief, Trainer, Lady Luck, Mascot) but **three Special job rows per girl** (0x500f to 0x5011, 0x5012 to 0x5014, 0x5015 to 0x5017: main + two parts): so the three rows of one Special share **one** model slot (the counts are read and measured; "share" is the inference). `[R + M, I]`
2. **The skeleton.** Each Special's single skeleton carries a **mirror-twin pair of subtrees** (same bone count, vertex counts within 1 for Machina Maw and Full Throttle and within 12 for Floral Fallal, centres mirrored in x) and a rest that holds the girl: `data/meshinfo-*.txt`, `tools/chrtree.py`. Floral Fallal's pair are the two white drapes; Machina Maw's the two clawed legs; Full Throttle's the two wings. `[M]`
3. **One motion bank each.** Every clip of a Special animates the **whole** skeleton (446 / 347 / 147 bones, `data/clips-*.txt`); the group id of the bank equals the model number (0x14, 0x28, 0x3C); there is no second bank for a part. In Full Throttle the basic attack clip `0x003C100A` (`ATTACK1_01`) moves subtree 89 (the right wing) about nine times as much as subtree 51 (`data/clipenergy-c060.txt`: 1,076 against 122 rotation-range units), which fits "Dextral Wing" being the right wing. `[M]`
4. **The job table (weak support).** In the earlier party-rig lane's decode of `battle/kernel/job.bin` (`yrp-weapons/weapons.json`), the two part rows of each Special (`Special (Yuna) 2 and 3`, `(Rikku) 2 and 3`, `(Paine) 2 and 3`) carry no weapon or attachment block (item 0x0000); the main row carries the FFX leftover item 0x0043 twice (slots 14 and 15), which is not a model. No part row names a model. `[R, second hand]`

**What would overturn it (not found, so not claimed):** the game has a motion actor and a hit body for each part (`battle/header/btlactor.h`: `_actor_<girl>_special1/2_motion`, `_actor_<girl>_special1/2`), so a part may be drawn from a model of its own that the files name nowhere I could read. Candidates in the same folder I looked at and could not tie to a part: `c301` (a purple flower bud on a stem, 101 bones, four SP3 clips), `c306` (one black blade with the wing's braided pattern), `c307` (a sword with a red grip), `c304` (a katana), `c305` (dice), `c310 / c311 / c312` (large rigs with thin lines), `c302` (a hooded figure with a scythe). They have only SP-slot motions and no idle: they look like **ability props** (a thrown bud, a thrown blade), not bodies. **A check in the game's battle scripts or the executable for the model each part body spawns would settle it** (the sibling lane look-a:game reads the same files; its note is the place to compare).

Own-model verdict for the driver: **three own models (the mains); six parts = pieces of those three models [I]**. Drawing nine independent sprites is still right for the game's three-bodies reading; the parts are separate *targets and bodies*, and their art comes out of the same model, so the pod sprites will match their main body in style by construction.

## 3. How the pictures were made

* **Pipeline** (the art-w4 method, copied and extended; the originals are untouched): `tools/x2read.mjs` reads the archive; `tools/mkglb6.py` builds a posed `.glb` from the HD mesh (`.dae.phyre`) and the PS2-tree skeleton and motion (`.chr`, `.mgrp`): pose = (animation id, frame). **mkglb6 skins every mesh instance** (the stock builder skins only the first; c060 has three, so its wings and body would stay in the bind pose); `tools/rview3.py` rasterises it (numpy z-buffer, textures at 1024, two-band shading), with bone-subtree **part masks**; a triangle belongs to a part when two of its three vertices are skinned mainly to the subtree.
* **Camera.** Orthographic. Default: azimuth -42 degrees, elevation 14 degrees = art-w4's "3q" view (42 / 18) turned to face the other way: **the figure faces screen-right and slightly toward the viewer**, as the party art of this project does (`docs/handoff/bp1-actor-life.md`: party art right, foes left). Other views: front (az 0, el 8) and foe-side (az +42, el 14). The models face +z in their own space and the figure's left is +x `[R: earlier lane's note]`.
* **Scale.** Tight pictures: one camera per part over all its pose frames (an exact fit of the vertices it draws; `units_per_px` in each json). Canvas pictures: one camera per model over all its frames, 1536 x 1536; the size pictures: one camera per Special with Yuna Gunner beside it.
* **Not in the pictures:** the girls' pistols (not in the model file), the game's hair and cloth simulation (cloth segments show their rest shape), the animated-texture sheets (c060's feather materials `Mat_CTA_*` and c020's `c020_anim_*` draw their base texture only), every effect (the bloom of light, auras, pollen, missiles). **Hub plates:** c060's wing hubs have a flat black back plate (material 0 samples a black patch of the base texture; checked with a gradient-texture test), which reads as a black disc from the default camera.
* **QA.** `tools/qa.py` over every picture: size, coverage, border touch (cropped), black or empty: **0 rejects**. Looked at: the three contact sheets, the detail sheets, the spot-check sheet, the long-SP3 sheet, the dress-up sheets, the sizes formation pictures, the survey sheets. The first pass (a shared camera for everything) made Machina Maw's poses tiny because its SP3 set jumps; those renders are in `_superseded/`.

## 4. Motion ids (read from each model's own `.chr` default list 1: slot = the `btlmot.ath` number, value = animation id = group << 16 | sequence id; full tables in `data/slots-*.txt`)

| Slot | c020 Floral Fallal | c040 Machina Maw | c060 Full Throttle | used for |
|---|---|---|---|---|
| IDLE1 (0x10) / APPEAR_00 (0x08) | `0x00141000` (140 f) | `0x00281000` (45 f) | `0x003C1000` (50 f) | idle-1, idle-2 |
| DMG1 (0x38) | `0x00141002` (50 f) | `0x00281002` (40 f) | `0x003C1002` (50 f) | hurt-1..3 |
| DEAD_00 / 01 / 02 (0x48 to 0x4A) | `0x00141007` (50 f) / `...08` (140 f) / `...09` | `0x00281007` (40 f) / `...08` / `...09` | `0x003C1007` / `...08` / `...09` (50 f each) | ko-1..4 (DEAD_00 at 3 frames, DEAD_01 at 1) |
| ATTACK1_00 / 01 / 02 / 03 (0x58 to 0x5B) | `0x00141018` (34) / `0x0014100A` (28) / **`0x0014100B` (62)** | `0x0028101D` (17) / **`0x0028100A` (46)** / `0x0028100B` (20) / `...0C` (9) | `0x003C101D` (5) / **`0x003C100A` (59)** / `0x003C100B` (18) / `...0C` (18) | attack-1..4: the longest strike clip, bold |
| MAGIC2_00 / 01 / 02 (0x68 to 0x6A; SKILL and ITEM point at the same) | `0x00141010` (34) / `...11` (28) / `...12` (62) | `0x00281010` (21) / `...11` (45) / `...12` (106) | `0x003C1010` (74) / `...11` (24) / `...12` (65) | cast-1 = _00 mid, cast-2 = _01 mid, cast-3 and 4 = _02 at one third and two thirds |
| WIN_00 (0x90) | `0x00141016` (100) | `0x00281019` (111) | `0x003C1019` (120) | not rendered |
| SP3 set (0xC8 up) | SP3_00 `0x0014101B` (85), SP3_01 `0x0014101A` (40) | SP3_00 `0x00281022` (140), SP3_01 **`0x00281023` (109)**, SP3_02 `...24` (60) | SP3_00 `0x003C1024` (60), SP3_01 **`0x003C1023` (150)**, SP3_02 `...22`, SP3_03 `...31` | sp3long-1..4 (c020 `0x0014101B`, c040 `0x00281023`, c060 `0x003C1023`, at 0.1 / 0.35 / 0.65 / 0.95) |

All other slots (RUN, AVOID, ESC, SP0 to SP7) are in `data/slots-*.txt`. The Special's own commands (Great Whirl, Vajra, Sword Dance, the pods' Stigma, Smash, Crush, Dextral and Sinistral Arts) play SP slots: **the pairing of a command with its SP slot is in the battle scripts and was not decoded [gap]**; the attack, cast, hurt and KO sets above are the standard slots every command class uses.

Observed: the c060 `ATTACK1_01` swing is a one-wing motion (the right wing); most other clips move the two parts about alike (a few of Machina Maw's SP clips favour one side: `data/clipenergy-c040.txt`). Several of the Specials' clips duplicate others (c020 `DMG1` = `DEAD_00`; `DEAD_01` and `DEAD_02` = the idle clip).

The girls' ordinary models: Yuna c001 idle `0x0001105E` (30 f, the APPEAR_00 / IDLE1 slot), SP3_00..04 `0x00011097 / 98 / 99 / 0x000110A7 / A8` (100 / 240 / 60 / 120 / 30 f); Rikku c021 SP3 `0x00151018 .. 1C` (30 / 240 / 60 / 120 / 30 f); Paine c041 SP3 `0x0029101B .. 1F` (100 / 240 / 60 / 120 / 30 f).

## 5. The dress-up moments

* **The girl's change, as far as the files go: `<girl>-dressup-candidates/`.** The only motion set long enough to be a transformation is **SP3 of the girl's own model** (the same five lengths in all three girls; SP3_01 is 240 frames, 8 seconds at 30 fps, the longest girl motion). Frames 1 to 6 are `SP3_01` at 10, 25, 40, 55, 70, 85 percent: the girl raises both arms overhead, holds, and her skirt flares and settles; frames 7 to 9 are `SP3_03` (120 f). **the peak candidate = frame 131 of 240 of `SP3_01`** (hands together overhead, skirt at its widest). `[I]`: that this set is the dress change is inferred from its length, its lengths being shared by the three girls and its pose; **the command or event that plays it is not decoded [gap]**. The picture is the girl in her Gunner / Thief / Warrior dress (the model the motion bank belongs to); what the game draws at the peak (the bloom of light, the swap to the Special model) is an effect plus a model swap that these files do not show.
* **The Special's arrival, as far as the files go: the long SP3 clip of each Special's whole model, frames 1 to 4.** Floral Fallal `0x0014101B`: a closed purple bud opens into the hibiscus with Yuna inside (frames 3 and 4 are the open flower); Machina Maw `0x00281023`: the machine rises and unfolds, Rikku stands on top and raises an arm; Full Throttle `0x003C1023`: the wings spread. **Looks like each Special's entrance (`[I]`); not tied to a game event [gap].**

## 6. Findings that bear on look A

* **The pods are not flowers, orbs or small spirits** as card A drew them; they are large pieces of the same body (section 0, item 3). A "pod sprite" cut from the real model is a drape, a mechanical leg or a wing, and **the Pistils are the smallest of the six** (0.7 to 0.9 Yuna) while the Machina legs and the wings are larger than a girl (1.3 to 1.8). If look A keeps "the pods must read as party members at a glance", the real parts are visually unlike the girls they stand beside.
* **A Special main is not girl-sized** (1.6 to 2.8 times a girl). The three-up HUD can still show three plates, but the stage picture of "three bodies where the girls stood" would need the main drawn 2 to 3 times a girl's height, in motion more.
* **No collapse KO** exists in the files for any Special (item 5).
* **The Special models show their girl small**: Yuna stands inside the hibiscus (a small figure against a flower about 2.6 times her height), Rikku sits on top of the machina, Paine is inside the drum. A "girl visible in her Special" (the driver's inference of 2026-11-09) is true to the model, but she is small in it.

## 7. What is here and what to do with it

The tight pictures are the img2img starting images (1536 x 1536 transparent, facing right); the canvas pictures keep the parts registered to each other; the size pictures and the sizes note give the relative sizes; `idle-front` and `idle-az42` give the other faces of each part (the left wing's front is only in `idle-az42` and `idle-front`). Paint over them per the art-w4 method (image to image over the render, driver pick 220m).

## 8. What could not be found, and why

| # | Item | State |
|---|---|---|
| G1 | A model file of its own for any of the six parts | **none found.** `chr/pc` (118 models) rendered and looked at (the 45 girl models, the 100 / 200 / 300 / 900 series); `chr/skl` (40 untextured grey NPC bodies, k001 to k999, 35 of them built) and `chr/sum` (4 summoned creatures s002, s007, s013, s014) rendered and looked at, none is a part; `chr/obj` (1,140 files) and `chr/npc` (3,147 files) were not opened. The twin subtrees are the best reading; the game's part bodies and motion actors (`btlactor.h`) are the open end. A check of what each part body spawns (battle scripts, the executable) settles it. |
| G2 | Which command or event plays the girl's dress-up (SP3) and the Specials' entrance (SP3) | not decoded (`research/re-ffx2-special-dresspheres.md` section 9 gap 3 says the same: the motion scripts were not read) |
| G3 | The Special commands' SP slots (Great Whirl, Vajra, Sword Dance, Smash, Crush, Stigma) | not decoded; the standard slots are used for the pose sets |
| G4 | The on-stage positions of the three bodies | not in the files read; the parts sit where the skeleton puts them |
| G5 | Any runtime scale on top of file units | all four models read base 1.0 / actor 1.0; nothing else read; the game's own `height` field agrees with the measured heights for c001, c020, c040 |
| G6 | Hair and cloth simulation, animated textures, effects, the pistols | not rendered (section 3) |
| G7 | What the parts' separate motion actors play | not decoded; every clip animates the whole skeleton |
| G8 | Which wing / pod is "first" in the HUD | the job order is Right Pistil, Left Pistil / Smasher-R, Crusher-L / Dextral, Sinistral (`research/re-ffx2-special-dresspheres.md` section 1); the sides here follow the names and the geometry |

## 9. Reproduce

All from this folder, under the project's scratch temp folder, python only through `tools/py.mjs` / `tools/pyv.mjs` (isolated mode): `node tools/x2read.mjs get <outdir> <prefix>` (extract), `node tools/py.mjs tools/slots.py c020` (motion table), `node tools/build-set.mjs floral|machina|throttle|yuna|rikku|paine` (a whole pose set), `node tools/sizes.mjs floral|machina|throttle`, `node tools/mk-sizes-md.mjs` (tables), `node tools/pyv.mjs tools/qa.py <ref root>`. Sheets: `tools/sheet.py`.

---

<!-- REF sizes -->

# Sizes of the nine parts, measured on the real models (look-a:models, 2026-11-09)

**FFX-2 only.** All numbers are measured on the renders of this folder (tools in `tools/`, data in its own json files), in the models' own **file units** (the `.chr` scale block of every model here reads `base = 1.0, actor = 1.0`, so file units compare directly across these models: `data/chr-scales-pc.txt`). The datamining caveat (a raw model height is not an on-screen proportion; a runtime scale may be applied) is the reason the sizes are measured in **one camera with Yuna's ordinary Gunner model (c001) beside the Special as the yardstick**, not read off a file. Whether the game applies any further runtime scale to the three Specials is **not settled** `[gap]`.

## The frame

* **Models.** Special = idle pose, mid frame of its idle clip (c020 `0x00141000` frame 70, c040 `0x00281000` frame 22, c060 `0x003C1000` frame 25). Yardstick = Yuna Gunner c001, idle clip `0x0001105E` (the APPEAR_00 / IDLE1 slot) frame 15, standing on the same ground plane (every model's own origin is its ground).
* **Cameras.** Orthographic, one camera per Special, fixed by the Special's own bounds plus Yuna beside it (so the scale does not depend on which picture is drawn): (a) **3/4**, azimuth -42 degrees, elevation 14 degrees: the figure faces screen-right (the party contract of this project: party art faces right); (b) **front**, azimuth 0, elevation 8. 1536 x 1152 px. The pictures (the three parts together plus Yuna, and each alone in the same camera) are the lane's own and not in the repo.
* **"The three together in the game's formation".** The three parts of a Special are drawn from **one model** (see README section 2): "together" is that one model as the game poses it. The files give **no separate stage positions for the three bodies** `[gap]`; the pods sit where the skeleton puts them.
* **Silhouette** = the picture's non-transparent pixels' bounding box (height x width), converted at the camera's scale. **3D extents** = the bounding box of the vertices the part draws in the idle pose (x = width, y = height, z = depth; independent of any camera).

## 3D extents (file units, idle pose)

| Part | width x | height y | depth z | height / Yuna Gunner height |
|---|---:|---:|---:|---:|
| Floral Fallal, the three together (c020) | 39.9 | 41.6 | 25.0 | 2.62 |
| Floral Fallal main (Yuna in the flower) | 39.9 | 41.6 | 25.0 | 2.62 |
| Right Pistil | 15.2 | 11.6 | 13.2 | 0.73 |
| Left Pistil | 11.3 | 13.1 | 14.2 | 0.83 |
| Machina Maw, the three together (c040) | 32.4 | 27.9 | 53.8 | 1.76 |
| Machina Maw main (Rikku in the machina) | 23.7 | 26.0 | 53.8 | 1.64 |
| Smasher-R | 11.8 | 21.0 | 22.7 | 1.32 |
| Crusher-L | 12.3 | 21.8 | 22.5 | 1.37 |
| Full Throttle, the three together (c060) | 41.7 | 44.3 | 44.2 | 2.79 |
| Full Throttle main (Paine in the blade wings) | 41.2 | 44.3 | 44.2 | 2.79 |
| Dextral Wing | 13.2 | 28.4 | 17.0 | 1.79 |
| Sinistral Wing | 14.0 | 29.0 | 15.0 | 1.83 |

Yuna Gunner (c001, idle): 6.4 x 15.9 x 5.8 (x, y, z).

Cross-check with the game's own number: the `.chr` scale block carries a `height` field: **c001 16.0, c020 43.0, c040 28.0, c060 39.0** (`data/chr-scales-pc.txt`). The measured idle heights are 15.9, 41.6, 27.9 and 44.3: they agree to about 3 percent for c001, c020 and c040 `[R: the .chr field; measured: the render]`. c060 measures taller than its field because the six floating swords stand above Paine in the idle pose (the field is probably her own height; not settled `[gap]`). Shadow and collision radii are in the same file: c001 3.5 / 5.0, c020 12.0 / 13.0, c040 16.0 / 17.0, c060 12.0 / 17.0 (c021 3.3 / 5.5 and c041 3.0 / 5.0 for Rikku's and Paine's ordinary models).

## Silhouettes in the common camera (px, then file units at that camera: height x width)

| Part | 3/4 view height x width | / Yuna | front view height x width | / Yuna |
|---|---|---:|---|---:|
| Floral Fallal, the three together (c020) | 855 x 647 (41.1 x 31.1) | 2.63 | 1015 x 997 (40.6 x 39.9) | 2.53 |
| Floral Fallal main (Yuna in the flower) | 855 x 647 (41.1 x 31.1) | 2.63 | 1015 x 997 (40.6 x 39.9) | 2.53 |
| Right Pistil | 264 x 278 (12.7 x 13.3) | 0.81 | 314 x 380 (12.6 x 15.2) | 0.78 |
| Left Pistil | 292 x 250 (14.0 x 12.0) | 0.90 | 349 x 282 (14.0 x 11.3) | 0.87 |
| *Yuna Gunner (c001), same camera as Floral Fallal* | 325 x 148 (15.6 x 7.1) | 1.00 | 401 x 159 (16.0 x 6.4) | 1.00 |
| Machina Maw, the three together (c040) | 666 x 755 (31.6 x 35.8) | 2.02 | 913 x 1028 (28.7 x 32.3) | 1.79 |
| Machina Maw main (Rikku in the machina) | 618 x 755 (29.3 x 35.8) | 1.88 | 882 x 754 (27.7 x 23.7) | 1.73 |
| Smasher-R | 442 x 394 (21.0 x 18.7) | 1.34 | 669 x 374 (21.0 x 11.8) | 1.31 |
| Crusher-L | 467 x 418 (22.2 x 19.8) | 1.42 | 692 x 391 (21.8 x 12.3) | 1.35 |
| *Yuna Gunner (c001), same camera as Machina Maw* | 329 x 151 (15.6 x 7.2) | 1.00 | 511 x 202 (16.1 x 6.3) | 1.00 |
| Full Throttle, the three together (c060) | 865 x 811 (46.4 x 43.5) | 2.97 | 981 x 929 (43.9 x 41.6) | 2.74 |
| Full Throttle main (Paine in the blade wings) | 865 x 811 (46.4 x 43.5) | 2.97 | 981 x 899 (43.9 x 40.2) | 2.74 |
| Dextral Wing | 562 x 331 (30.2 x 17.8) | 1.93 | 669 x 294 (29.9 x 13.2) | 1.87 |
| Sinistral Wing | 552 x 280 (29.6 x 15.0) | 1.90 | 677 x 313 (30.3 x 14.0) | 1.89 |
| *Yuna Gunner (c001), same camera as Full Throttle* | 291 x 133 (15.6 x 7.1) | 1.00 | 358 x 142 (16.0 x 6.4) | 1.00 |

(The three cameras have different scales, which is why Yuna's pixel height differs from row group to row group; the file-unit columns and the ratios are the comparable ones.)

## What the numbers say for the HUD and the stage

* **The three bodies are not equal in size.** Against Yuna's 16 units: Floral Fallal's main body is **about 2.6 times her height** (and wider than tall, 40 x 41), but its two **Pistils are 0.7 to 0.9 times** (11 to 14 units); Machina Maw is 1.8 times with **arms 1.3 to 1.4 times**; Full Throttle is 2.8 times with **wings 1.8 times** (28 to 29 units tall). `[R: measured from the files; the pod identification is inferred, README section 2]`
* A Special's main body is **not girl-sized**: card A's "three bodies stand where the girls stood" (the girls are 16 units) holds only for the Floral pods; the main is 1.6 to 2.8 times a girl's height in the idle pose, and the long SP3 set can carry the whole model through the air (Machina Maw's `sp3long-*` frames in `machina-maw-whole/`; the idle camera is much smaller than the camera those frames need).
* The part images are rendered facing screen-right with one scale **per part across its poses**; the `canvas/` pictures share one scale across all the parts of a model.
