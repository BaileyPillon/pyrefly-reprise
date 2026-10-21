# Release 61 rigs: the HD-2D look lights the rigged figures, and the two demo bosses' head size is held (branch `r61-rigs`, from `origin/r61-repro` 07ccc0029, 2026-10-21)

AUTH (Bailey's words, quoted by the driver): 2026-10-20 "Yes, both (Recommended)" (boss rigs ON) and "HD-2D bold (Recommended)"; 2026-10-19 "I demo my game in a week at a huge gaming conference" (Monday 2026-10-26); decisions 157.
**No deploy, no review, no merge.** Branch `r61-rigs` is pushed; the driver deploys.

**Game case.** The shader change, the loader, the pipeline and the gate are shared plumbing: **both games**. What the light reaches: Chapter I's Seymour Flux (`seymour-flux-body`, **FFX only**), Chapter IV's Bahamut (`ffx2-bahamut`, **FFX-2 only**), and, as the cheap extra, the aeons Valefor and Ifrit (a rig both games draw). The head-size fix is Bahamut (FFX-2 only) and Seymour Flux (FFX only).

## Problem A: the rigged figures were not lit

The HD-2D look lights a PAINTED figure by binding the painting it draws to that painting's normal map (`look/relight/FigureRelight.ts#bindRelight`, the painted shader's `PAINTED_RELIGHT` block). A rig draws no painting, only parts cut from paintings, so the bosses stayed flat in a lit room.

### Method

1. **Cut the SAME pieces out of the normal maps.** Every part and every variant of a rig is cut from a painting by a window (`rig_build.export_part`: the part's box of the idle master; `rig_vcut.variant_record`: the pose painting registered into the idle's frame, then the crop box). The normal piece is the same window of that painting's normal map (`D:/pyrefly-art-maps`, tangent space, OpenGL, +Y up), opaque RGB, written beside the colour PNG as `<part>[.<variant>].normal.png` and named in the file as `normal` (format v2.2, additive: `docs/CONTRACT-CHANGES.md` 2026-10-21). New module `tools/rig/rig_normals.py`; config key `build.normals = {dir, scale}`.
   **Nothing is rotated at cut time because nothing is rotated in the cut**: the pieces are cut in the painting's own orientation (a rig bends them with bones at run time; each look is drawn in the orientation of the key it was cut for), no piece is flipped, and a pose registered mirrored is refused by the pipeline (not the case for these two). The pose registered at another scale (`painting_map` ax, ay) gets the same bilinear resize as its colour. The maps' size must equal the painting's, or the tool refuses.
   **Size:** 0.3 of the master (a texel is 3.3 master px, about 1.7 screen px at 1440p; the painting maps are 0.5): Bahamut 2.8 MB / about 2 Mpx for 30 pieces, against 5.4 Mpx at 0.5. Colour budget (12 Mpx / 12 MB) is unchanged; the pieces have a budget of their own in the gate (`BUDGET.normalTexels`, `normalBytes`: 4 M each).
2. **The look's shader lights them.** `RigRelight.ts` (`rigRelightWanted`, `relightUniforms`, `setPartNormal`); `RigMaterial.makePartMaterial({ relight })` compiles the painted fragment shader's relight block into a part's material and its vertex shader gains the same varyings (`RELIGHT_VARYINGS`, `RELIGHT_VERTEX`); the cells are the SAME objects every painted figure references (`relightCells`), so the key light from the room, the rim from behind and the four coloured point lights of spells and the orb are ONE set of numbers for the party and the boss. A part binds the normal of the look it shows (its own, a variant's, none: that look is unlit); a cross-fade's ghost keeps the look going out lit with its own piece.
3. **Loaded only when it can be seen.** Pieces are fetched only while a look with a relight is armed (`?look=hd2d|cinematic` or the chapter's default look: Chapters I and IV) and only when the rigs' share of the figure-texture budget has room for them after the colour textures (`RigLoad.chooseRig`); a rig that cannot afford them is still a rig, unlit. A piece that does not load leaves that look unlit and never fails the rig. No look, anime, or `?look=off`: no request, no compile, the figure draws as it did.
4. **Pipeline and tooling know the field:** digest and seal include the pieces; `rigSize` counts them apart; `textureSizes` stamps `normal: [w, h]` only where there is one; `rig-ship` inventory, `rig-install`, the mirror tool ship them; they have NO 1x twin (`rigShippedNames`).
5. **A finished version 1 rig gets its pieces cheaply:** `node tools/rig/rig-normals-add.mjs --from <rig> --to <NEW folder> --maps D:/pyrefly-art-maps --art D:/pyrefly-art-r59` (parts that are windows of the idle; it proves each is one, lists what it cannot cover, never writes into its source), then `rig-gate` and `rig-tiers write`.

### Files

New rig folders (the shipped ones untouched): `D:/pyrefly-art-rigs/ffx2-bahamut-x2`, `D:/pyrefly-art-rigs/seymour-flux-x2` (work folders `D:/pyrefly-art-rigs-work/<name>`), `valefor-n1`, `ifrit-n1`; configs `tools/rig/subjects/ffx2-bahamut-x2.json`, `seymour-flux-x2.json`; art mirror **`D:/pyrefly-art-r61`** (= r60 + these four rigs, hard links, `tools/art-mirror-add-rigs.mjs`, PROVED, `rig-gate --verify` passes for all six rigs against it; the driver points `public/art` at it for the release). Code: `src/engine/look/relight/RigRelight.ts` (new), `FigureRelight.ts` (exports `flatNormal`), `src/engine/rig/{RigMaterial,RigFigure,RigGhost,RigActor,RigLoad,RigTier,RigData}.ts`, `src/data/art/rigTypes.ts`; tools `rig_normals.py`, `rig_build.py`, `rig_vcut.py`, `rig_v2.py`, `rig-format.mjs`, `rig-tiers.mjs`, `rig-ship.mjs`, `rig-install.mjs`, `rig-gate-lib.mjs`, `rig-normals-add.mjs`.

### Not done, and why

- **Lulu**: the shipped version 1 Lulu rig cannot be restamped: the CURRENT gate refuses it (`attack` overlap 0.742 under 0.75, `defend` and `od-fury` stale claims, `sleep` landmark 0.068), with or without normals (checked read-only on the shipped r60 folder). The r60 stamp verifies only because it is an old stamp for exactly its bytes. Her pieces can be made (`rig-normals-add` covers 9 of 11 parts; `fdef` and `fod` are cut from other paintings), but adding them changes the digest and needs a gate `ok`. Needs a Lulu lane or Bailey's word on re-gating her.
- **Pterya**: the maps lane made none for it (`MAPS-README.txt`).
- **Normals do not turn with the bones.** A piece is in the orientation of the key it was cut for, so at every held key the light is exactly the painting's; during the 8 to 12 frames of a move a turning part keeps its light fixed to its texture. Rotating by (current bone angle minus the register key's) would be a per-vertex angle attribute; judged not worth it for the demo.

## Problem B: the head size (review finding FOC60-01)

`critic/reviews/1cea6e937-focused.json`: CHK-026 fails on both new rigs, Seymour Flux body worst 8 percent across 106 of 124 swaps, Bahamut 18 percent across 98 of 114.

**Cause: two different measures of "the head".** The lane tuned `scaleArea` of each head variant until the OPAQUE area (pixels with alpha above 127, what the player sees) equalled the idle head's (1.00 within 0.5 percent). CHK-026 reads the head part's MESH area (`critic/runner/lib/continuity-rig-probe.mjs` `rg.ha`: the skinned triangles of the mesh the key shows). A variant's mesh is the opaque shape plus a transparent margin (`build_mesh`, `grow` 23 and an `edge` of 41 for Bahamut's heads), and how fat that margin makes the mesh depends on the piece's outline: Bahamut's head meshes were 1.00, 1.393, 1.267, 1.199, 1.282, 1.151 of the idle's, Seymour's 1.00 to 1.167, while the visible pixels were 1.00 throughout. sqrt(1.393) is the 18 percent. A contact sheet shows the head the same size in every key (as the review said), which is why only the gate saw it.

**Fix: the data, not the gate.** `rig_vcut` gains `opaqueArea` (the piece is scaled so its opaque pixels are the idle head's) and `meshArea` (then the mesh's transparent margin, a whole-pixel `grow` found by search, `fit_grow`, is chosen so the mesh area is the idle head's too). The visible pixels are untouched (opaque 0.999 to 1.003 of the idle's, before 0.995 to 1.001); only the transparent margin the mesh keeps round them changes; no opaque pixel is outside any new head mesh (`mesh-cover-head.txt`: 0.00000 uncovered at alpha above 8 and above 127, old and new). Expressions are the paintings' own pieces, as before. Configs `*-x2.json` differ from `*-x.json` in the five head variants' `scaleArea` -> `opaqueArea` + `meshArea` and in `build.normals`; `tests/unit/tools/rig-subject-demo-bosses-x2.test.ts` pins that.

Head, per key, as multiples of the idle's (`ha.py`; `head-gate-reading.txt` reads them through the harness's own `analyzeRigSwap`, policy tolerance 3 percent, on all 30 ordered key changes):

| | idle | attack | cast | hurt | telegraph | KO | worst change of the head's size, harness | changes that fail |
|---|---|---|---|---|---|---|---|---|
| Bahamut, r60 rig, mesh | 1.000 | 1.393 | 1.267 | 1.199 | 1.282 | 1.151 | 18.03 percent (idle to attack) | 24 of 30 |
| Bahamut, r61 rig, mesh | 1.000 | 0.994 | 0.995 | 1.007 | 0.997 | 0.997 | 0.67 percent (hurt to attack) | 0 of 30 |
| Bahamut, r61 rig, opaque | 1.000 | 1.001 | 1.000 | 1.000 | 1.003 | 1.001 | | |
| Seymour Flux, r60 rig, mesh | 1.000 | 1.060 | 1.062 | 1.076 | 1.167 | 1.089 | 8.03 percent (idle to telegraph) | 15 of 30 |
| Seymour Flux, r61 rig, mesh | 1.000 | 1.005 | 0.995 | 1.004 | 0.995 | 0.997 | 0.52 percent (telegraph to attack) | 0 of 30 |
| Seymour Flux, r61 rig, opaque | 1.000 | 1.000 | 1.001 | 1.000 | 0.999 | 1.000 | | |

(The old rows reproduce the review's 8 and 18 percent through the harness's own judge, which is the check that this is the cause.)

## Problem C: the double image at key changes (PR-0478 of the release 60 deep review)

The driver added it mid-task. `?motion=demo` (on by default in Chapters I and IV) cross-fades a rig's variant swap over `fadeMs` (default 110 ms, `RigFade.ts`). A move that swaps EVERY part's image (Bahamut's idle to attack: 5 of 5 parts, the paintings' outlines far apart) therefore shows two figures at once for 4 to 6 frames (the strip `swap-018-bahamut-idle-attack.jpg` of round 27).

**Fix (`RigFade.fadeMsFor`, decided once per move in `RigActor.setPose`).** A key that says `fadeMs` is believed (0 is a cut). Otherwise 110 ms for a change of a small part of the figure (a head, a mouth), shortened steadily as the share of the figure's mesh area that changes image rises from 0.25 to 0.75 of it, and `LARGE_FADE_MS` = 40 ms (two or three frames) from there on. Every key of both bosses swaps every part, so both are at 40 ms; the state still flips centred on half way (`fadeStart`: 0.357 of a 140 ms move, not 0.107). Tests: `tests/unit/rig/rig-fade.test.ts` (20 in all). No rig file changed: the rule is the engine's default, so the r60 rigs get it too.

Measured in the real game (`record.mjs --probe-fade`: the actor's `figure.fading` read every frame, the boss set to each pose in turn: attack, hurt, cast, telegraph, KO, with the idle between; 60 Hz on a paused clock, 1600x900):

| frames a part is cross-fading, per key change | Seymour Flux (Ch I) | Bahamut (Ch IV) |
|---|---|---|
| the 110 ms fade (the r60 default, forced by `fadeMs` 110 in a served copy of rig.json) | 6, 6, 6, 6, 5, 5, 6, 6, 6 (52 frames of 675) | 5, 6, 6, 6, 6, 6, 5, 5, 6 (51 of 675) |
| the new rule | 2 on every one of the nine changes (18 of 675) | 2, 2, 2, 2, 2, 1, 2, 2, 2 (17 of 675) |

The strip `docs/screenshots/r61-rigs/ch4-idle-to-attack-fade-strip-A-F-B.jpg` (frames +0 to +4 of Bahamut's idle to attack; A the r60 live rig with its 110 ms fade, F the new rig with 110 ms forced, B the new rig with the new fade) shows the double image over +1 to +3 in A and F and over +1 only in B. What is left in B is the one frame at which the new look is half up: a hard cut (0 ms) would remove it and put the pop back; 40 ms is the driver's range. Not done: cutting at the key's motion peak (a per-key decision that needs the silhouette's own change measured at run time).

## What was captured (the real game, dev server, headless Chromium on the GPU, `PYREFLY_BROWSER=gpu`, 1600x900, the art served from `D:/pyrefly-art-r60` (A) or `D:/pyrefly-art-r61` (B and F), the maps from `D:/pyrefly-art-maps`)

Scratch: `D:/Tools/pyrefly-scratch/2026-10-21/r61-rigs/cap/` (`tools/` the harness: `record.mjs` plays the demo plans by real key presses on a paused page clock stepped 60 Hz; `--rigs <subject> --strip` serves that rig with its normal pieces stripped from rig.json (the same rig, unlit); `--fade ms` forces `fadeMs` on every key (the r60 default is 110)). Runs: A = r60 (the live rig: unlit, the old head, 110 ms fade), B = r61 (the new rig, lit, the new fade), S = r61 rig stripped (the lighting alone), F = r61 rig with 110 ms forced (the fade alone).

- **Lighting.** `docs/screenshots/r61-rigs/ch1-open-before-stripped-after.jpg` and `ch4-open-...` (A | S | B at 1:1 of the boss), `ch1-open-lighting-difference.jpg` and `ch4-open-...` (S | B | B minus S times 4, the SAME frame of the same simulation: grey is no change; the relief of the robe, the hair, the wing ribs and the plates is the light), `ch1-spell-...` and `ch4-spell-...` (a spell lighting the boss, 14 to 28 frames after the blow, the glare past its peak), `ch1-spell-lighting-alone.jpg` (lit against the rig's light switched off 2 frames later in one run; the doubled edges are two frames of sway and shake, not the light), `ch1-boss-hit-pair.jpg` and `ch4-boss-attack-pair.jpg` (whole frames, A | B). Number: B against S in the calm opening frame, mean absolute change over the boss crop 7.6 (Chapter I) and 8.3 (Chapter IV) levels of 255, over 25 and 20 percent of the crop's pixels by more than 8 (the r60 lane measured 0.5 to 0.9 for frame-to-frame noise).
- **Honest verdict on the light.** It is present and it is the same light the party has (one set of cells), but it is by design a fraction of the painting's own shading (the gain is held to 0.62 to 1.38 of it): on the open frame it reads as a modest relief and a warm rim on the side of the key, not as a different picture; a spell's colour on the robe and the wings is clearest 14 to 28 frames after the blow. The Fire Gem's own flash blows the boss out to white for the first frames, in A, S and B alike. Normals are cut at 0.3 of the master; the head and the hair at 1440p are where a coarser piece would show first, and I saw no artefact at 1600x900.
- **Head size and motion.** `clips/swaps-ch1-A-F-B.mp4`, `swaps-ch4-A-F-B.mp4` (each boss set to attack, hurt, cast, telegraph and KO in turn, three panels, 12 s) and `fight-ch1-A-F-B.mp4`, `fight-ch4-A-F-B.mp4` (the real fight: the boss hurt and attacking), `strips/`; the head sheets `docs/screenshots/r61-rigs/head-sizes-*-offline.jpg` (the head part alone in every key, the mesh in yellow; r60 rig above, r61 rig below).
- **Offline** (the kit's numpy rasteriser, not the game): `normal-pieces-*-offline.jpg`: the colour, the normal pieces composited through the rig in the same pose (no seam between pieces), and the lit result.

## Checks run

- `tsc --noEmit` (`node "D:/Final Fantasy/node_modules/typescript/bin/tsc" --noEmit -p .`): clean.
- Rig, tools, look and golden tests: `tests/unit/rig/**` 190, `tests/unit/tools/**` (rig gate, ship, mirror, v2 gate, normals, the x2 configs), `look-*`, `critic-continuity-*`, `ffx-engine-golden` (18), `ffx2-atb-golden` (6), `ff7-golden` (3): all green; `tools/rig/test_rig_vcut.py` 11, `test_rig_v2.py` 10, `test_rig_pipeline.py` 12.
- `node tools/rig-gate.mjs --rig <six> --verify --art D:/pyrefly-art-r61` against the new mirror: PASS for ffx2-bahamut, seymour-flux-body, valefor, ifrit, lulu, pterya. `node tools/art-mirror-add-rigs.mjs --from D:/pyrefly-art-r60 --rigs <stage> --to D:/pyrefly-art-r61 --subjects ffx2-bahamut,seymour-flux-body,valefor,ifrit`: PROVED, 6,091 files, 5,681 linked, 409 copied.
- No production build was made (D: was at 7 to 13 GB); the art-derive, `art-browser-load` and deploy checks for the new rig files are the driver's (the pieces are plain opaque PNGs beside the rig's other PNGs).

## The gate, verbatim

`node tools/rig-gate.mjs --rig D:/pyrefly-art-rigs/ffx2-bahamut-x2 --art D:/pyrefly-art-r59` (after the kit's `fin.sh ffx2-bahamut-x2 ffx2-bahamut --recomp`), then `--verify` on the copy named for the subject:

```
rig-gate: ffx2-bahamut: OK; 6 of 6 key(s) pass; rest overlap 1.000; 66 poses scanned for holes at 8 joints; 5 parts, 22 bones, 7832 vertices, 9.99 Mpx, 11.76 MB; 7.0 s
  ok   idle       idle     iou 1.000  stature 1.001  feet 0.000, 0.001  head n/a
  ok   attack     standing iou 0.983  stature 0.917  feet -0.001, -0.001  head n/a  landmarks 0.023
  ok   cast       standing iou 0.993  stature 0.991  feet -0.002, 0.001  head n/a  landmarks 0.024
  ok   hurt       standing iou 0.993  stature 0.980  feet -0.002, 0.001  head n/a  landmarks 0.034
  ok   ko         ko       iou 0.982  stature 0.978  feet 0.000, -0.001  head n/a  landmarks 0.023  AUTHORED
  ok   telegraph  standing iou 0.978  stature 0.924  feet 0.001, 0.001  head n/a  landmarks 0.023
rig-gate: PASS
rig-tiers: PASS: 60 file(s) checked, 5.00 Mpx, 4.06 MB at 1x
rig-gate: .../verify-copy/ffx2-bahamut: verified: stamp ok (6 key(s), full coverage, 1 exempt), 1x tier proved (60 file(s))
rig-gate: PASS
```

```
rig-gate: seymour-flux-body: OK; 6 of 6 key(s) pass; rest overlap 0.994; 66 poses scanned for holes at 9 joints; 6 parts, 12 bones, 7916 vertices, 10.85 Mpx, 10.49 MB; 5.2 s
  ok   idle       idle     iou 0.994  stature 0.993  feet -0.000, 0.001  head n/a
  ok   attack     part     iou 0.991  stature 1.017  feet -0.000, -0.007  head n/a  landmarks 0.020
  ok   cast       part     iou 0.989  stature 0.993  feet -0.001, 0.002  head n/a  landmarks 0.028
  ok   hurt       part     iou 0.992  stature 0.937  feet -0.001, 0.001  head n/a  landmarks 0.048
  ok   ko         part     iou 0.992  stature 0.977  feet -0.003, -0.007  head n/a  landmarks 0.046  AUTHORED
  ok   telegraph  part     iou 0.984  stature 0.873  feet -0.001, -0.003  head n/a  landmarks 0.020
rig-gate: PASS
rig-tiers: PASS: 72 file(s) checked, 5.43 Mpx, 3.50 MB at 1x
rig-gate: .../verify-copy/seymour-flux-body: verified: stamp ok (6 key(s), full coverage), 1x tier proved (72 file(s))
rig-gate: PASS
```

(Against the first build: Bahamut 7,809 to 7,832 vertices, `attack` iou 0.984 to 0.983, 11.76 MB the same; Seymour 7,927 to 7,916 vertices, 10.49 MB the same.) The 12 MB colour budget and the 8,000 vertex budget hold; the normal pieces are 2.78 MB (Bahamut, 30 pieces) and about 2.7 MB (Seymour, 36), against their own 4 MB / 4 Mpx.

CONTINUITY_PLACEHOLDER

## For the driver

- **Install:** point `public/art` at `D:/pyrefly-art-r61` (it is r60 plus the four rigs; the manifest differs from r60's in nothing but `generatedAt`). Nothing else changes in the art.
- **Cost:** the two bosses download about 2.8 and 2.7 MB more and hold about 14 and 13 MB more texture memory while a look is armed; a rig whose share of the texture budget has no room draws unlit, never as the painting set.
- **Lulu** (see "Not done"): her rig is not lit; Pterya's has no map.
- **Lesson 8 of `rig-demo-bosses.md`** (the rig's pose swap pops) now reads: 40 ms of cross-fade on the whole-figure moves, 110 ms on a small part.
- The gate does not yet read the head part's MESH area against the idle's: a lane that tunes by the opaque area alone (as the first build did) passes the gate and fails CHK-026. The kit's `ha.py` prints both; a gate rule is the cheap guard.
