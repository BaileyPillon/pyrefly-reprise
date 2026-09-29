# Sin production art: what is installed, and what the listing step wires (FFX only, 2026-09-29)

**Status: the driver's picks, not Bailey's approval.** Bailey delegated tonight's Sin picks to the driver (D-279:
"Your picks (Recommended)" to the Sin paintings, countdown display and music; and "full speed ahead, godspeed. ... I
will go with all your recommendations."). Every file below is the driver's pick under that delegation, recorded as
`driver:2026-09-29-sin (D-279, delegated by Bailey)` in `docs/target/approved-hashes.json` so nothing replaces it
silently. Bailey's own verdict on each subject still decides (rule 9); each sidecar's `status` says so.

**Game case: FFX only** (rule 14). Links I to IV are fought from the *Fahrenheit* and on Sin's back, with CTB, Cid's
Trigger Command, the airship range and aeons; FFX-2 has no counterpart (`research/ffx-sin.md` §0.3). No file here is
read by an FFX-2 chapter.

**Original art only** (rule 8). Every pixel comes from the options round's picked paintings (`../README.md`), which
used written sources only, our code-drawn sketches and our own earlier paintings as the only image inputs, and no
retail image as input, reference or IP-Adapter. Nothing below was painted anew: each file is a cut, a crop, a resize or
one of `../src/compose.py`'s light states over one painting. **No GPU render was made for this step.**

## Install state

<!-- INSTALL-STATE -->

## The picks (D-279), and where each one came from

| Subject | Pick | Painting (candidates `D:/Tools/pyrefly-art-backup/candidates/2026-09-29-sin/`) |
|---|---|---|
| Sin's head, link IV | **C repaired**: round 3's layered jaw rig, five mouth stages | `head-c/rig/` layers (L1 throat, L1b hinge, L2 jaw, L3 top, L2s shut seam) over master `head-c/b1-c2.png` |
| Left Fin, link I | **A**, the clawed arm with a ribbed fin | NEAR `fins/fin-a-l-near-3`, FAR `fins/fin-a-l-far-2` |
| Right Fin, link II | **A**, painted on its own (never mirrored, plan Q14) | NEAR `fins/fin-a-r-near-1`, FAR `fins/fin-a-r-far-2` (the sheet's pick, `src/make_frames.py` PICKS) |
| Sinspawn Genais, link III | **A**, the craggy dome shell | out `link3/genais-a-4`, shell `link3/genais-a-4-shell-1` |
| Sin's Core, link III | **A**, the dark pearl in a hump of scales | painted with Genais A in `link3/genais-a-4` |
| Links I-II plate | late afternoon over the cloud sea | `plates/flight-1` |
| Link III plate | Sin's back at sunset | `plates/back-1` |
| Link IV plate | **A**, golden dusk, the render that shrinks the city | `backdrop/bk-a-8` |

## Every installed file

All paths are under `public/art/`. Every PNG and webp has a JSON sidecar next to it (a `.2x.webp` shares its PNG's).
Each sidecar carries `status`, `game`, `decision: D-279`, `pickedFrom`, the painting's `seed` and `prompt`, and
`origin` / `retailInput: none`.

### Creatures (cut-outs on transparency)

Every state of one subject shares **one crop box and one `baselineY`** (the first state's; `baselineYAuto` keeps the
measured value where it differs), so a state swap never moves the sprite. `facing` is `front` on every sprite: they
are painted into their plates, and `front` is the one `ArtFacing` that `mirrorFor` never flips.

| File | Sprite id (`spriteKey`) | State | Size, baseline | What reads it |
|---|---|---|---|---|
| `characters/sin-left-fin/idle.png` | `sin-left-fin` (enemy `left-fin`) | idle = idle-near (as Evrae's) | 1030x1036, 1019 | `PaintedActor` / `resolvePoseMap` today (the stage already asks for `sin-left-fin`; it drew the grey silhouette) |
| `characters/sin-left-fin/idle-near.png` | 〃 | NEAR, core at rest (dimmed) | 1030x1036, 1019 | the range director's NEAR set (listing step, below) |
| `characters/sin-left-fin/charge-near.png` | 〃 | NEAR, "Core gathers energy." (`sin.fin.charged`) | 1030x1036, 1019 | new pose name: the director shows it while `sin.fin.charged` holds at NEAR |
| `characters/sin-left-fin/idle-far.png` | 〃 | FAR, as painted (no core shows at this range) | 1654x590, 573 | the director's FAR painting (`idle-far`, Evrae's name) |
| `characters/sin-left-fin/charge-far.png` | 〃 | FAR, a small glow at the arm's root | 1654x590, 573 | new pose name: `sin.fin.charged` at FAR |
| `characters/sin-right-fin/idle.png` | `sin-right-fin` (enemy `right-fin`) | idle = idle-near | 982x947, 930 | as the Left Fin |
| `characters/sin-right-fin/idle-near.png` | 〃 | NEAR, core at rest | 982x947, 930 | 〃 |
| `characters/sin-right-fin/charge-near.png` | 〃 | NEAR, gathering | 982x947, 930 | 〃 |
| `characters/sin-right-fin/idle-far.png` | 〃 | FAR, the painted violet core dimmed | 1166x532, 515 | 〃 |
| `characters/sin-right-fin/charge-far.png` | 〃 | FAR, gathering | 1166x532, 515 | 〃 |
| `characters/sinspawn-genais/idle.png` | `sinspawn-genais` | out of the shell | 861x480, 455 | `PaintedActor` today |
| `characters/sinspawn-genais/shell.png` | 〃 | in the shell (`sin.genais.shelled`, "Enters shell.") | 861x480, 455 (auto 463) | new pose name: shown while `sin.genais.shelled` is true |
| `characters/sin-core/idle.png` | `sin-core` | at rest, "Core is inactive." (`sin.core.state` `inactive` / `free`) | 519x441, 335 | `PaintedActor` today |
| `characters/sin-core/charge.png` | 〃 | gathering, "Core gathers energy." (`charging`, `ready`) | 519x441, 335 (auto 421: the glow's halo) | new pose name: shown while `sin.core.state` is `charging` or `ready` |
| `characters/overdrive-sin/stage-0.png` | `overdrive-sin` | mouth shut (the shut seam on) | 1410x745, 678 | new pose names: `sin.mouthStage` (0 to 4, `overdrive-sin-rules.ts` `mouthStage`) picks `stage-<n>` |
| `characters/overdrive-sin/stage-1.png` … `stage-3.png` | 〃 | the jaw turned back 19.5, 13, 6.5 degrees less than shut | 1410x745, 678 | 〃 |
| `characters/overdrive-sin/stage-4.png` | 〃 | fully open (Giga-Graviton next) | 1410x745, 678 (auto 720) | 〃 |
| `characters/overdrive-sin/idle.png` | 〃 | idle = stage-0 | 1410x745, 678 | `PaintedActor` today |

**How they were cut** (`cut.py`, `cuts.json`): SAM 2.1 small (the repo's `tools/gen/rig-sam.py` loader) prompted
with a box and points per subject, multiplied by the render's repaint mask, holes filled, the interior made opaque, the
edge snapped to the painting by a guided filter, pulled in 2 px and **defringed** from the creature's own pixels (no
sky or rock colour rides along the edge). Genais and the Core are one painting cut into two foes by one polygon
(`cuts.json`: the Core `keep`s it, Genais `drop`s it). The head is its rig's layers composed without the plate and
the deck (`produce.py` `head_stages`), the top layer's edge defringed and its translucent sky between the feathers
removed.

**Light states** (`common.py`, from `../src/compose.py`): `dim` darkens the painted core to a violet ember inside the
sprite; `charge` adds the violet glow and lets it spill past the silhouette as a soft halo (alpha from its brightness,
capped at 0.85). Each sidecar's `light` gives the kind, the centre in sprite pixels and the radius.

**Scale and anchor, against Chapter VIII's deck** (each sidecar's `staging`, `bleeds`, `frameFraction`): the world
height that draws the sprite at the size it has in its picked painting, if that painting's frame were the camera's
frame at Evrae's own spot (pinhole maths on `evrae-airship-range.ts` RANGE_STAGING: NEAR spot [2.3, -0.9, -4.7] under
the NEAR idle rig, FAR spot [6.4, 3.3, -30] under the FAR idle rig; **derived, not measured in the engine**).

| Sprite, range | worldHeight as painted | x Evrae's 4.1 | Anchor |
|---|---|---|---|
| Left Fin NEAR | 6.61 | 1.61 | bleeds **right**; its bottom edge (frame y 0.83) is the rail line the painted deck hid, so it must sit behind the deck edge |
| Left Fin FAR | 11.99 | 2.93 | free-floating; much bigger than Evrae's FAR streak (the README's fault: "bigger than small against clean sky"), so the director may scale it down |
| Right Fin NEAR | 6.04 | 1.47 | bleeds **top** and **right** (the arm comes down from the flank overhead) |
| Right Fin FAR | 10.78 | 2.63 | bleeds **right** (the tail) |
| Genais | 2.95 | 0.72 | stands on Sin's back (`sin-back` plate) |
| Core | 2.17 | 0.53 | behind Genais, up the back; draw it **behind** Genais (its lower edge is where Genais's shell covered it) |
| Overdrive Sin (FAR rig) | 14.19 | 3.46 | bleeds **top** and **right**; the claw grips nothing on `sin-fahrenheit-bevelle` (it held the tower of round 3's own plate) |

A bleeding sprite has to be placed so its cut edge stays off-screen at every rig it is seen from: the listing step
checks that in the browser, per rig (`idle`, `action`, `enemy`, and the `-far` rigs).

### Scenes (opaque, 2688x1536, the size of every backdrop)

| File | Scene key | Link | Note |
|---|---|---|---|
| `backdrops/sin-fahrenheit-flight.png` | `sin-fahrenheit-flight` | XVII links I and II | its lower third is its own painted foredeck, rail and gold dial |
| `backdrops/sin-back.png` | `sin-back` | XVII link III | Sin's back, the ship small in the sky; no deck |
| `backdrops/sin-fahrenheit-bevelle.png` | `sin-fahrenheit-bevelle` | XVIII link IV | the Evrae layout (hull from below); **not rolled**: the deck scene rolls its plate itself |

Each is the picked 2352x1344 master (RealESRGAN x4 plus the masked detail pass), resized with Lanczos.

### Pause hero plates (1344x768 PNG + 2688x1536 webp q88, like every pause plate)

| File | Key | What |
|---|---|---|
| `pause/ch17-sin-fins-core.png`, `.2x.webp`, `.json` | `heroArt: 'pause/ch17-sin-fins-core'` | the Left Fin over the rail at NEAR, "Core gathers energy.": the concept frame's states (round 3's dressed deck, the NEAR shade, the charge glow) over `fin-a-l-near-3` |
| `pause/ch18-sin-face.png`, `.2x.webp`, `.json` | `heroArt: 'pause/ch18-sin-face'` | head C at stage 3 on its own rig plate (round 3's p6: the claw on the white tower) |

### Turn-order chips (832x1216 RGBA, like every portrait)

`src/ui/ffx/portraits.ts` reads `portraits/<enemy id>.png` for a CTB row, so these work by id with no code change;
without a `face-crops.json` row the chip uses its default crop.

| File | Enemy id | Focus |
|---|---|---|
| `portraits/left-fin.png` | `left-fin` | the core (the weak spot Cid sees, research §9.3) |
| `portraits/right-fin.png` | `right-fin` | the core |
| `portraits/sinspawn-genais.png` | `sinspawn-genais` | the two red eyes' midpoint |
| `portraits/sin-core.png` | `sin-core` | the pearl |
| `portraits/overdrive-sin.png` | `overdrive-sin` | the one amber eye |

## The exact keys the listing step must wire (code, not art: none of this was touched here)

1. **Scene keys.** Both chapters say `sceneKey: 'evrae-airship-deck'` (placeholder). Chapter XVII becomes
   `'sin-fahrenheit-flight'`, Chapter XVIII `'sin-fahrenheit-bevelle'`. Each needs a scene factory: the Evrae deck
   scene (`src/scenes/evrae-airship-deck.ts`) with its backdrop key as a parameter, registered in `src/scenes/index.ts`
   (398 lines: plan R6, move an entry out). Link III's `'sin-back'` needs the per-formation scene swap (plan Q6: a new
   seam; `EnemyGroupDef` has no scene key) and a scene with no deck.
2. **Enemy sprites.** The `spriteKey`s already match the folders: `sin-left-fin`, `sin-right-fin`, `sinspawn-genais`,
   `sin-core`, `overdrive-sin`. Drop the "PLACEHOLDER — no painting" notes in `sin-fins.ts`, `sin-genais-core.ts` and
   `overdrive-sin.ts`.
3. **The range director** (`evrae-airship-director.ts`): bind the counted Fin with its own art id
   (`bindEvrae(actor, 'sin-left-fin' | 'sin-right-fin', worldHeight)`, package P's bound-foe change). Its FAR scale
   is Evrae's head ratio (`EVRAE_HEAD_PX`, `EVRAE_FAR_WIDTH_PX`, `EVRAE_BASELINE_PX`): the Fins need their own numbers,
   from these sidecars (NEAR baselines 1019 and 930, FAR 573 and 515; both ranges were painted in the same 2352x1344
   frame, so one frame pixel is one world size at each painting's own distance). Show `charge-near` / `charge-far` in
   the idle slot while `sin.fin.charged` holds (Evrae's `breath-charge` pattern).
4. **Genais and the Core:** show `sinspawn-genais/shell` while `sin.genais.shelled` is true; show `sin-core/charge`
   while `sin.core.state` is `charging` or `ready`, `idle` otherwise. Stage the Core behind Genais.
5. **The head:** show `overdrive-sin/stage-<n>` for `n = flags['sin.mouthStage']` (0 to 4), in the idle slot.
6. **Pause:** `heroArt: 'pause/ch17-sin-fins-core'` and `'pause/ch18-sin-face'` in `src/data/chapter-meta-sin.ts`
   (package P), and a `chapterSlide.ts` crop box for each if the default crop cuts the subject. Proposed, read off the plates by
   eye (check in the browser): ch17 `{ x0: 0.46, x1: 1.0, y0: 0.0, y1: 0.8 }` (the arm and the core), ch18 `{ x0: 0.38, x1: 1.0, y0: 0.0, y1: 0.75 }`
   (the head and the tower).
7. **Chapter cards** (`thumbnailKey: 'chapter-sin-fins-core'` / `'chapter-sin-face'`). Nothing reads a file by
   `thumbnailKey`: the board and the cards are `chapterPlates.ts`'s CSS layering of the boss's `idle.png` over the
   chapter's scene. So the "thumbnails" are two `PLATE_COMPOSITIONS` entries, measured on the installed files
   (previews of exactly that layering: `cards/*.jpg`):

   ```ts
   // XVII: the Left Fin over the rail, the arm rising out of the right edge.
   'sin-fins-core': {
     scene: { hero: '50% 50%', card: '50% 35%' },
     glow: 'rgba(190, 150, 255, 0.36)',
     layers: [{ key: 'sin-left-fin', focus: [0.155, 0.13], hero: P(63, 16, 84), card: cardClear(198, [0.155, 0.13]) }],
   },
   // XVIII: the head at golden dusk, the eye on the focus.
   'sin-face': {
     scene: { hero: '50% 55%', card: '50% 30%' },
     glow: 'rgba(255, 170, 110, 0.36)',
     layers: [{ key: 'overdrive-sin', focus: [0.324, 0.506], hero: P(60, 28, 60), card: cardClear(143, [0.324, 0.506]) }],
   },
   ```

   The focus is the clawed hand (the Fin has no face) and the head's amber eye, in sprite fractions. Heights are the
   sprites' share of the frame over the box's share of it (1.9:1 plate 84 and 60, 4.5:1 card 198 and 143); the plate
   positions put the focus where the painting has it (the hand at 0.63, 0.16 of the frame; the eye at 0.60, 0.28). These
   are starting values, not browser measurements: check both
   at 1280, 1600, 2000 and 390 px, as the other entries were.
8. **Turn chips** (optional polish): `src/ui/common/face-crops.json` rows, `{ "fx", "fy", "ipd", "px": [832, 1216] }`:
   `left-fin` (0.5, 0.62), `right-fin` (0.5, 0.30), `sinspawn-genais` (0.5, 0.42), `sin-core` (0.5, 0.45),
   `overdrive-sin` (0.5, 0.40), each `ipd: 0.16` (a human-equivalent proposal, like Ixion's and Valefor's; check it).
9. **The end-state board:** a tile per subject with `delivery` and a `reaction` whose `named` is empty (these are the
   driver's picks) and whose `inferred` holds the reasons in `../README.md` (rule 15).

## Faults left (an agent's look)

- **The Left Fin at NEAR** can still read as a beaked head at its top; **the Right Fin's shoulder** has a few machine-like
  rings and a lens next to the core. The README's repair pass (a local repaint of each) was not run: the GPU was full
  (the other art agent's queue) and a repaint is a new painting that needs its own look.
- **The Fins at FAR** are far bigger than Evrae's FAR streak (worldHeight 12 and 11 against Evrae's 4.1 x FAR ratio);
  the director can scale them, which is a staging call for the listing step.
- **The head over the link-IV plate**: the claw was painted gripping round 3's white tower, which `bk-a-8` does not
  have, so over that plate it grips air or, at the painted placement, the hull's top (`cards/chapter-sin-face-scene.jpg`). The pause plate keeps the head on its own
  plate, where the tower is. A small lilac patch of painted sky stays opaque between the near wing and the back.
- **Genais** keeps a few rock crumbs along its lower edge, and the Core's lower edge is a straight cut where Genais's
  shell covered it (hidden while Genais stands in front; visible if Genais falls first and the Core stays).
- **The cut edges** are SAM's, snapped and defringed; at battle size they read clean, and up close the Genais shell
  edge is softer than the painting's ink line.

## Re-run (from this folder; ComfyUI's embedded python has torch, sam2 and scipy)

```
PY=D:/Tools/ComfyUI/python_embeded/python.exe
$PY -s cut.py cuts.json D:/Tools/pyrefly-scratch/overnight-0929/sin-install/cut      # the SAM cuts (+ .check.jpg)
$PY -s produce.py                                                                   # creature states + sidecars
$PY -s plates.py                                                                    # backdrops, pause, portraits, cards/
python install.py list                                                              # staged.json
PYREFLY_BROWSER=gpu node check.mjs <stage> <SCRATCH>/staged.json                    # (from the repo root, with paths)
python install.py install                                                           # new files only; gate + disk checked
node tools/gen/manifest.mjs --root="D:/Final Fantasy/public/art"                    # (repo root)
node check.mjs "D:/Final Fantasy/public/art" <SCRATCH>/installed.json
node lock.mjs <SCRATCH>/installed.json docs/target/approved-hashes.json
ROOT=D:/pyrefly-ch-sin node D:/Tools/pyrefly-lora/tools/verify-approved.mjs
```

`matte_probe.py` is the first method tried (the difference against the plate): it held for the Fins against open sky
and failed for Genais against rock of its own colour, which is why the cut is SAM's.
