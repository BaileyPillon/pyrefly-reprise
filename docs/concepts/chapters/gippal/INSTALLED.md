# Chapter XV (provisional), the Den of Woe: installed production candidates (FFX-2 only)

**Which game (rule 14): FFX-2 only.** The Den of Woe and its three shades exist only in FFX-2
(`docs/plans/chapter-gippal-review.md` §1).

Bailey, 2026-09-25 ~01:40 EDT, verbatim: *"I'll go with all your recommendations"*. For the art
that means O-1 B (translucent and lit from within), the same treatment for Baralai and Nooj (the
README's follow-up question, GP1 = b), and O-3 A (cold blue). Every file below is a **CANDIDATE**.
None has been judged independently, none is in `approved-hashes.json`, and nothing in `src/` loads
it yet: no enemy data, scene or encounter points at these ids. Every file is under a **new** id, so
no approved file was written or replaced (`verify-approved.mjs`: 153 ok, 0 mismatched, before and
after). `public/art` is gitignored, so these files exist only on this disk.
`public/art/manifest.json` was regenerated with `node tools/gen/manifest.mjs` (82 subjects, 18
backdrops); `art-manifest-build` and `art-manifest-loader` tests pass (27).

Sheet: [production/sheet.jpg](production/sheet.jpg) (one column, 1,200 px wide). The engine frames
are in `production/frames/` and the scripts in `production/scripts/`.

## Installed files (under `public/art/`; each `.png` has a `.json` sidecar)

| Path | Size, baselineY | sha256 (first 12) | What was done |
|---|---|---|---|
| `characters/gippal-shade/idle.png` | 779x1245, 1169, `scale` 1.0503, `facing: left` | `dd3f7cffe708` | The O-1 pilot's own pixels (`gippal-a2`, seed 951102). One repair: the ring clamp on the mortar was repainted as the sourced **rounded saw blade** (visual bible §1.23.5). A toothed disc was blocked in behind the barrel and the fist, then repainted inside the disc mask only (seed 963102, denoise 0.55). 25,919 px changed; every other pixel is the render's own (MAD 0). Then the B treatment. |
| `characters/gippal-shade/cast.png` | 961x1245, 1170, `facing: left` | `b0c9a95ccf47` | The opaque idle's forearm, fist, mortar and saw turn 18 degrees about the elbow as one rigid piece: the mortar swings up and out toward the party. Only the elbow seam was repainted (seed 964101, denoise 0.45). Then the B treatment. |
| `characters/baralai-shade/idle.png` | 682x1321, 1246, `scale` 1.0453, `facing: left` | `1b3270d74a12` | **A fresh render**, because no Baralai painting exists on disk: there is no speaker portrait and no body. Character preset, 4 seeds (961101 to 961104). Two were quarantined by the cut-out guard; 961103 was kept. The identity words come from visual bible §1.23.6 `[single source]`. The staff comes from research §strategy ("Baralai's staff"). No repair. Then the B treatment. |
| `characters/baralai-shade/cast.png` | 785x1305, 1230, `facing: left` | `8e7e91027953` (repair; was `9ba75ed87c7c`) | The forearm, hand and staff turn 22 degrees about the elbow, so the staff head tips toward the party. The part of the pole hidden behind the coat was rebuilt from the idle's own pole profile. The chest the forearm uncovered was repainted inside its mask only (seed 965102, denoise 0.55). |
| `characters/nooj-shade/idle.png` | 521x1271, 1196, `scale` 1.0482, `facing: left` | `c4e6316bd88c` (repair; was `f4511c1727ba`) | **A fresh render**. The IP-Adapter reference `portraits/nooj.png` (D-043) was requested but **skipped** by `comfy.mjs` (the render record says `refSkippedMonochrome`; corrected in the repair pass). The portrait is head and shoulders only. 8 seeds in two batches; 962203 was kept: brown hair, blue glasses, a ponytail with a red tie, and the machina left arm and left leg toward the camera, as bible §1.23.4 stages him. No repair. Then the B treatment. |
| `characters/nooj-shade/cast.png` | 839x1271, 1196, `facing: left` | `6283780d309c` (repair; was `735ec81b90a1`) | The machina forearm, hand and cane turn 32 degrees about the elbow, so the cane is levelled at the party. The torso it uncovered was repainted inside its mask only (seed 966102, denoise 0.5). |
| `backdrops/den-of-woe.png` | 2688x1536 | `96965cfad6dc` | The picked O-3 A plate, installed unchanged: byte-identical to the options run's `plate-a.png`. It is `den-a3` (img2img over the layout guide), lifted, with a blue floor glow and drawn motes (`scripts/denplates.py`). |

**The B treatment** (`production/scripts/shade_b.py`) is the options round's own B code with the
same parameters, run on each opaque painting: desaturate and cool, add an inner glow toward the
core, thin the alpha toward the feet, and put pale motes inside. **One change:** the outer halo
alpha is capped at 0.33 instead of 0.45. The engine measures the feet and the target box at alpha
0.35, so the halo can no longer move either. Chapter XI set this precedent. The treatment uses no
GPU.

**Sizing.** Each idle's sidecar `scale` (baselineY after the treatment's pad ÷ the unpadded
render's baselineY) keeps the pixel scale of the unpadded painting. The casts carry no `scale`:
they are sized against their idle at the same pixel scale. The world height is not set here. That
is the scene's call (plan T5). Bible heights: Nooj 188 cm and Baralai 176 cm `[single source]`;
Gippal about 173 cm `[estimate]`.

**What a cast shows.** Each shade has one idle and one hero cast (method r3, and the precedent of
Chapters VI to XI). There are no attack, hurt or KO paintings: hurt falls back to the idle under the
engine's flinch, and KO is the engine's pyrefly dissolve.

## Known defects and off-canon points (flagged, not fixed)

- **Gippal:** the overalls still read as a purple sash and apron, and the patch sits a little low
  on the cheek. B desaturates both. In the cast, the saw disc touches his hair tips at 1:1.
- **Baralai:**
  - The lower coat has no black-and-white glyph panels (bible §1.23.6); the render shows black
    trousers under the coat.
  - The look of the staff head is ours: the sources name a staff, not what it looks like.
  - In the cast, his far hand stays at his side, empty, and the rebuilt pole is a plain cylinder
    below the grip.
- **Nooj:**
  - The purple fur-trimmed sleeve on his right shoulder is on the far side, so this
    near-profile pose hides it.
  - He holds the cane in his machina **left** hand; the bible says the right hand.
  - The cane is copper-banded before B, not silver.
  - In the cast, a small red spur of the torso's edge shows under the forearm.
- **Den plate:**
  - **The tunnel mouth was not added.** Two masked repaint tries (6 seeds: arched 967101 to
    967103, irregular 967201 to 967203) read as a doorway or a cut-out hole, so both tries were
    withdrawn after the second failure (rule 15). They are shown at the bottom of the sheet.
  - The motes are painted into the plate. If the Den scene adds live pyrefly particles, the two
    may double up; `denplates.py` can re-make the plate without motes.
  - The painted pyreflies on the floor still read as glowing domes.
- **Ours, not sourced:** every part of the shade look (research G-13), each cast gesture, the
  saw-blade block-in, and the halo cap. These are `inferred`, not named by Bailey.

## Frames

The frames in `production/frames/*.jpg` are real 1600x900 engine frames:

- **Staging:** Chapter XI's first link (`ffx2-fallen-aeons`) at its first command menu, which has
  the Chapter V line-up and HUD.
- **Swapped art:** Playwright request interception served `backdrops/den-of-woe.png` in place of
  the Farplane plate. Each shade's idle, or its cast, was served in place of `x2-shiva`.
- **The shade:** it stands where Shiva stands. Its size, about 1.2 times Rikku as in the options
  frames, is ours: a factor of 0.755 for Gippal, 0.769 for Baralai and 0.82 for Nooj, applied in
  the frame only. A cast is shown in the idle slot.
- **HUD:** the boss name was rewritten by a MutationObserver.
- **Still from Chapter XI:** the pink motes (the Farplane scene) and the tutorial card.
- **The plate alone:** `den-plate.jpg` shows it with the HUD off and no enemy.
- **Server:** a private Vite server on port 5800 (HMR off, GPU browser), stopped by its PID.

## Repair pass, 2026-09-25 (after the independent judge, `production/JUDGE.md`)

The judge passed and locked Gippal's idle and cast, Baralai's idle and the Den plate, and failed
three files. Each got **one** masked repair here; all three stay **CANDIDATE** for the next judge
and none is in `approved-hashes.json` (the approved set was checked before and after: 185 ok, 0
mismatched). Sheet: [production/repair-sheet.jpg](production/repair-sheet.jpg); engine frames
`production/frames/*-repair.jpg` (same staging as below, private Vite server on port 5811, stopped).

- **Baralai cast (FAIL 5.7: sliced boot, ruler-cut coat edge with a notch, flag-shaped debris at the
  staff butt, far hand a stump on a cord).** Cause: the first derive lifted every `b >= r` pixel in a
  strip along the old pole, which took boot, trouser and coat-edge pixels and rotated them with the
  staff. Re-derived from the **locked idle's** opaque render with the same 22-degree turn
  (`scripts/bar_cast2.py`): only strictly blue pole pixels above row 1000 move (below that the blue
  is the near boot's laces); the old pole's stub on the near boot shaft is removed and the shaft
  closed; the far hand and its cord are removed, so the hand hides behind the coat; the coat's front
  edge (the idle's own straight edge) gets a smooth wave and a 2 px ink line; the rebuilt pole ends
  in a rounded bronze butt cap; the judged chest repaint (seed 965102) is kept pixel for pixel. One
  masked repaint over the coat edge, shaft and cap (seed 968101, denoise 0.5,
  `scripts/repaint_ref.py`), the ink line restored after it. Still flagged: the pole is a uniform
  cylinder below the grip, the far hand is hidden rather than placed, the cap and the wave are ours.
- **Nooj idle (FAIL 6.9: no hair loops, a knee-length ponytail).** On the same render and canvas
  (`scripts/nooj_idle2.py`): the ponytail is cut at mid-back (tip at row 345) with the render's own
  strands kept and the new outline feathered along them; a hair loop is blocked in at the near temple
  (bible §1.23.4 colours) and painted by **one** masked repaint with IP-Adapter on the picked
  portrait (ip-adapter-plus SDXL, weight 0.55, K+V; seed 969101, denoise 0.62). Only the loop is kept
  from that repaint, its colours set to the render's own hair hue. Still flagged: only the near loop
  shows (the far one is behind the head), the loop reads small at game size and as a dark braided
  loop rather than the portrait's full outward loop, it shows no red tie, and the far-side fur sleeve
  and the cane in the machina left hand are unchanged (both need a re-render, not a masked repair).
  **Correction:** the first install said the render used IP-Adapter; its record shows the reference
  was skipped (`refSkippedMonochrome`).
- **Nooj cast (FAIL 6.8, inherited).** The repaired idle's changed pixels (20,297 px, none under the
  moving arm) are carried into the judged cast (32 degrees, torso repaint seed 966102); nothing else
  changed. The small red spur under the forearm is still there.
- **Sizes:** baselines are unchanged (Baralai cast 1230, Nooj 1196) and the idle's `scale` stays
  1.0482; the Nooj files are narrower (521 and 839 px) because the ponytail no longer reaches the
  knee. GPU: two repaint jobs (7 s and 12 s of ComfyUI time), each submitted with fewer than 3
  pending; no black frames; ComfyUI was not restarted. Nothing was downloaded. Scratch:
  `D:/Tools/pyrefly-scratch/ch1215/gippal-repair/` (the replaced candidates are kept in `prev/`).

## GPU and scratch

- **GPU:** about 4.5 minutes of ComfyUI time against the 60-minute cap: 12 character renders (about
  100 s) and 18 masked repaints (152 s). Of those repaints, 12 were withdrawn: 2 saw, 2 of each
  cast seam and all 6 tunnel tries.
- Every job was submitted only while fewer than 3 were pending. There were no black frames.
  ComfyUI was never restarted, and the restart sentinel was written into a private log folder.
- Nothing was downloaded.
- **Scratch:** `D:/Tools/pyrefly-scratch/ch1215/gippal/`.
