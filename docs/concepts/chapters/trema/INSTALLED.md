# Chapter XIII (Trema): installed production candidates

**Which game (rule 14): FFX-2 only.** Trema, Paragon and Cloister 100 of the Via Infinito exist
only in FFX-2 (research §0).

Bailey said on 2026-09-25 at about 01:40 EDT, verbatim: *"I'll go with all your recommendations"*.
The recommendations were read after the review's corrections. That answer picks:

- **O-1 A**, the priest, with the torn robe. The review found that the one sourced look detail was
  missing from this option.
- **O-2 A**, the gold armoured beast.
- **O-2b yes**: the link is staged as a short scene.
- **O-3 B**, the approved Bevelle Underground plate repainted.

**What these files are:**
- Every file below is a **CANDIDATE**. None has been judged independently, none is in
  `approved-hashes.json`, and nothing in `src/` loads it yet.
- All five sit under **new** ids. No existing file was replaced, so no backup of an old file was
  needed. `verify-approved.mjs` still reports 159 ok, 0 mismatched.
- `public/art` is gitignored, so these files exist only on this disk. Copies with their sidecars
  are in `D:/Tools/pyrefly-art-backup/candidates/2026-09-25-trema/`.
- `public/art/manifest.json` was regenerated with `node tools/gen/manifest.mjs`: 76 subjects and
  16 backdrops. The art manifest, cut-out guard, black-frame and painted-scale tests pass
  (5 files, 100 tests).

| Path (under `public/art/`) | Pick | Size | sha256 (first 12) | What was done |
|---|---|---|---|---|
| `characters/trema/idle.png` + `.json` | O-1 A | 816x1167, `facing: left` | `77b4cba2eb4b` | The options round's dehaloed cut-out of seed 924113, same crop. **Torn robe**, which is sourced (research §6.2, "an old man in a torn Yevon priest's robe", `[single source: wiki]`): ragged strips and slits were cut into the silhouette of the black under-robe hem, the white coat train and its red lining, the coat's lower outer edge and the hanging sleeve. That is alpha only, plus a 2 px rim darkened on light cloth. One lens-shaped rip in the coat panel shows the black under-robe. Two to-fixes from the README: the face skin was graded to the hands' grey-green (Lab a*/b*), and the stole crest's round core became a red disc inside its gold ring. 5.8 % of pixels changed. No GPU. |
| `characters/trema/cast.png` + `.json` | O-1 A (hero cast) | 816x1167, `facing: left` | `744cc1501f8e` | Derived from the idle. The raised hand and cuff were lifted 95 px to his beard line, and the wide sleeve that hangs from that wrist was stretched to follow, with its hem fixed. Only the wrist joint, the sleeve top and the vacated slivers were repainted: a crop-upscale masked repaint at denoise 0.45, seed 951102 (seed 951101 was withdrawn for a dark square at the sleeve edge). Outside the seam mask the pixels are the warp's exactly (max difference 0), and 88.2 % of all pixels equal the idle's. |
| `characters/paragon/idle.png` + `.json` | O-2 A | 1150x815, `facing: left`, `nonBiped` | `0e3972b558c0` | The options round's cut-out of seed 924402, same crop. Three alpha-only repairs: **the loose curved blade in front of it was erased**, near the mane only its metal and ink edge; the white background pockets between the claws were opened (3,012 px), and a white matte halo was peeled (372 px); a detached baked floor-shadow sliver was removed. No kept pixel changed colour. |
| `characters/paragon/cast.png` + `.json` | O-2 A (hero cast) | 1068x910, `facing: left`, `anchorY 0.9659` | `f2f2300b6f8f` | Derived from the idle. The whole beast is pitched back 12 degrees about its hind-foot contact, so the forelegs leave the floor and the head rises (rearing to cast). No pixel was repainted. `anchorY` pins the hind foot, because the tail tip dips 13 px lower and the measured baseline alone would float him. |
| `backdrops/via-infinito.png` + `.json` | O-3 B | 2688x1536 | `82eedcd37505` | The picked plate installed unchanged (MAD 0 to render `cloister-b2`), as the Natus and Evrae plates were. The id matches the planned `src/scenes/via-infinito.ts`. |

## The link (O-2b): staged, not painted

There is no Paragon KO painting. Under the METHOD-CHECK state map, an enemy's KO is the engine's
pyrefly dissolve. The picked strip is staged again with the installed files in
`production/frames/link-{1,2,3}.jpg`:

1. Paragon is beaten, still standing and dimmed.
2. The old man appears in his cast pose and breaks Paragon into pyreflies.
3. Paragon is motes, and Trema takes the boss spot.

The dissolve and the motes stand in for particles (the options round's `ko.py`, same
`--pyre-green` and `--pyre-white`). How it plays (no results screen, Trema's link opens) belongs
to the chain and scene tracks. The research sources the beat: "in quite an impressive scene",
§2 step 2. Breaking Paragon into pyreflies is our staging.

## Frames and sheet

- `production/sheet.jpg` shows:
  - all five files at source pixels;
  - the repairs at 1:1 against the picks;
  - the engine frames and the link.
- `production/frames/*-full.jpg` (HUD) and `*-clean.jpg` (HUD off) are **real engine frames** at
  1600x900. The engine draws the candidates itself:
  - A private Vite server on port 5760 (HMR off, no watch, `PYREFLY_BROWSER=gpu`) loaded Chapter IV
    `ffx2-bahamut` to its first command menu.
  - Playwright request interception served `via-infinito.png` in place of
    `bevelle-underground.png`, and the chosen candidate pose in place of the boss's files.
  - It also served the TR10 dresspheres (Yuna Dark Knight, Rikku Alchemist, Paine Dark Knight).
  - The HUD text was renamed (`scripts/shot2.mjs`).
  - The server was stopped by its port.
- **Sizes:** Paragon stands at Bahamut's world height, 4.1 (419 px). Trema is scaled to 0.72 of
  that (302 px), the options round's size. Both sizes are ours and belong to the chapter's data.
- **Chapter IV leftovers**, for the scene and HUD tracks, not the art:
  - the frames keep Chapter IV's grade, bloom and warm lamp glow;
  - the Active ATB clock runs, so some `-full` frames show a Chapter IV attack, a damage number
    or a first-time coach tip.
  - The top of the plate, where the sourced upside-down banners hang, is cropped by that staging.
- Scripts, all in `production/scripts/`:
  - `tear.py`, `idlefix.py`: Trema idle;
  - `castwarp.py`, `repaint.py`: Trema cast;
  - `paraclean.py`: Paragon idle;
  - `pararear.py`: Paragon cast;
  - `install.py`: sidecars and backup;
  - `shot2.mjs`, `link.py`, `sheet.py`: frames, link and sheet.
- Scratch: `D:/Tools/pyrefly-scratch/ch1215/trema/`.
- **GPU:** 2 masked repaints, 10.9 s of ComfyUI execution against the 60-minute cap. The queue was
  empty each time, ComfyUI was never restarted, there were no black frames, and nothing was
  downloaded.

## My own look at 1:1 (for the independent judge, not approval)

- **Trema idle:**
  - The tears read as tattered strips at 1:1 and as a ragged hem at game size.
  - Their edges are cut, not painted: flat cel shading with a darkened rim, with no fray threads.
  - The rip is flat under-robe black.
- **Trema cast:**
  - The gesture is modest, the hand at face height instead of shoulder height.
  - At 302 px it reads as a lift, not a new pose.
  - The stretched sleeve is 1.29x taller and plain, so it hides the stretch.
- **Paragon cast:**
  - This is a rigid pitch of the whole body. The hind legs tilt with it instead of bending.
  - At game size it reads as rearing. At 1:1 a judge may call it a tilted card (METHOD-CHECK
    names that risk).
- **Plate:** The glowing wall panels are warm gold, not the "cold lamp panels" the README
  described. It was installed as picked (the engine's Chapter IV grade warms it further).

## Owed, and not decided here (keep under `inferred` until Bailey names them)

- **Inferred (ours):** where the tears fall and how deep they go; the rip; the red disc; the face
  grade strength; the cast gestures (hand lift 95 px, 12-degree rear); the link staging and the
  two world sizes.
- Not made:
  - hurt, attack or KO paintings (state map: fallbacks);
  - Trema's portrait (O-5, its own round from this idle);
  - the chapter card, thumbnail and pause plate;
  - Trema's fade at the end, which is engine work.
- Still Bailey's call (review): whether the banners carry an original rendering of Yu Yevon's
  likeness.
- For the chapter's data: `spriteKey` `trema` and `paragon`, and backdrop `via-infinito`.

## Hero plate installed, 2026-09-25 (FFX-2 only, Chapter XIII)

Bailey, 2026-09-25 ~10:20 EDT, verbatim: "I'll go with all your recommendations". Option B of `hero-plate/README.md` installed as `public/art/pause/ch13-trema.png` (sha `df51b9efa1e1`) with its RealESRGAN `.2x.webp` master and `.json` sidecar; locked in set `bailey:2026-09-25-recommendations`. `src/data/chapter-meta-trema.ts` already names `heroArt: 'pause/ch13-trema'`, so the chapter card and the pause CHAPTER tab show it now (checked on a production build, frames in `docs/concepts/portraits-2026-09-25/installed/ch13-*.jpg`). That file's header comment still says no plate is approved; it belongs to the chapter's owner to update.

## Speaker portrait installed, 2026-09-25 (FFX-2 only, Chapter XIII)

Trema B of `docs/concepts/portraits-2026-09-25/README.md` is `public/art/portraits/trema.png` (sha `5e924bbeb551`), with a measured dialogue row in `src/ui/common/face-crops.json`; locked in set `bailey:2026-09-25-recommendations`. This covers the "Trema's portrait" and "pause plate" lines under "Not made" above; the chapter card and pause tab now read `pause/ch13-trema`.
