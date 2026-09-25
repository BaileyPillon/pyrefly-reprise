# Nooj shade, option 1: one targeted repair pass (FFX-2 only)

**Game case (rule 14): FFX-2 only.** The Den of Woe shades exist only in FFX-2.

Bailey said on 2026-09-25 at about 13:30 EDT, verbatim: *"I'll go with all your recommendations"*. That accepted
"take option 1 (leaning on the cane) and give it one targeted repair pass on the hands, the feet and the cast, then
have it judged again". The faults to repair are the ones the independent judge named in
[../README.md](../README.md), in the "Independent judge" section. The method is
[METHOD-nooj-2.md](../../production/METHOD-nooj-2.md).

**Result in one line.** The idle's three regions are repaired, each within two tries. **The cast did not come right
in two tries**, so I stopped, as the brief requires. The best pair is kept below and is **not judged**.

**Nothing is installed.** `public/art/characters/nooj-shade/` still holds attempt 4. Nothing was added to
`approved-hashes.json` or `judge-locked-hashes.json`. `verify-approved.mjs` reported ok 224, 0 mismatched and
0 missing both before and after the run.

**Sheet:** [sheet.jpg](sheet.jpg). It shows:

- the picked portrait;
- option 1 as picked, with its engine frames;
- the repaired pair, with its engine frames;
- before and after crops of every repaired region.

The frames are in [frames/](frames/). They are real 1600x900 engine frames using the same staging as the options
round: Chapter XI, the Den plate, the shade in Shiva's slot at factor 0.82, and the B treatment.

## The best repaired pair (candidates, not judged)

| | File | sha256 (12) |
|---|---|---|
| Idle | `D:/Tools/pyrefly-art-backup/candidates/2026-09-25-nooj6/idle-repair/idle-repaired.png` (369x1008) | `8e1d77e9991c` |
| Cast | `D:/Tools/pyrefly-art-backup/candidates/2026-09-25-nooj6/cast/C-r1/cand-976202.png` (876x991) | `b31df6985f14` |

## Idle: what was repaired (my look, not a judge's)

Each region was a masked repaint over a flat block-in painted on option 1's raw (`nooj6_idle_prep.py`). Each crop
was upscaled to 1024 on its long side. The IP-Adapter was forced on, with the portrait square-padded plus its head
crop, at 0.5, ease in, 0.2 to 0.8, concat (`nooj6_repaint.py`). Pixels outside each feathered mask are untouched.

| Region | Judge's fault | Try 1 (2 seeds) | Try 2 | Now |
|---|---|---|---|---|
| Cane hand | Silver skeletal fingers under a fingerless glove; a claw read | 976101: a gloved fist with no metal, but maroon; the cane between the fist and the crook faded to white; pink scraps | 976112 at denoise 0.45, over try 1 with the glove pulled toward black and the shaft and crook drawn in | A black-gloved human fist around the cane top, with knuckle and finger folds. No silver, no spur. The shaft and crook join the fist. |
| Machina hand | A fingerless pale blue fin | 976101 | not needed | A jointed grey metal hand with four segmented fingers, a thumb, gaps between the fingers, and a gold cuff. The arm above it stays the render's blue. |
| Feet | Both legs end in footless pegs | 976101 | not needed | A purple boot with a toe and a sole, and a grey metal foot with a toe plate and a hinge. Toes point screen-left. No peg, no hoof. |

- **The one touch-up (alpha only, disclosed).** rembg kept part of the render's ground shadow as a pale streak left
  of the metal toe, which read as a blade. I set 449 pale pixels to transparent: cut-out x 176 to 254, y 955 to 1000.
  No colour was painted.
- **Unchanged, and still open on the idle:**
  - the loops, which are black with red insides and read as ram horns;
  - the soft, young, frontal face;
  - bare skin under the fur and no purple sleeve;
  - the blue machina arm, where the bible says grey;
  - the staging, which does not show the lean;
  - the long legs.
- **What I see now:**
  - The new boot is boxy, close to an armoured boot.
  - The white cane insert under the fist is a little blocky at 1:1.
  - At game size the fist reads clearly on the cane, and both feet now show a foot shape.

## Cast: re-derived from the repaired idle, stopped after two tries

The cast uses attempt 5's own cast skeleton (xinsir OpenPose 0.8, with its own elbow). The block-in was repainted in
colours sampled from the repaired idle (`nooj6_cast_prep.py`). The fur is a painted ragged shape on the far (right,
cloth) shoulder only and never crosses the neck. The leading shoulder under it is the idle's red sleeve, not the flat
oval with a purple centre; attempt 5's oval is what rendered as the grey patch. The IP-Adapter sees the portrait
(padded), its head crop and the repaired idle (padded). `nooj6_cast_render.mjs` is attempt 5's renderer, with the
changes listed in its header.

| Try | Seeds | What it fixed | What went wrong |
|---|---|---|---|
| 1 | 976201, **976202** | 976202: fur on the far shoulder only, as a large lilac-grey shape. No grey patch, no white collar. Loops dark with red ties, as in the idle. A thin, jointed, skeletal machina arm. A purple boot with a toe. The sharpest and most mature face so far. | 976202: a fork (trident) at the cane's tip that reads at game size. The cane runs on behind his neck and out to the right. The machina hand grips a second thin rod. The cloth arm is a black plated sleeve, which puts metal on the cloth side. The near shoulder is bare skin. The arm is silver rather than the idle's blue. The metal foot is a pronged plate. 976201 grew fur on the near shoulder too, and a metal disc on the cloth sleeve. |
| 2 | 976211, 976212, 976213 | The block-in was changed: the idle's red sleeve, the cane's butt inside the fist, a plain dark ferrule, a blue metal shoulder cap. The negative gained dual wielding, trident and weapon on back. | 976211 points with an empty hand, and the cane moved into the machina hand. 976212 again holds a second rod in the machina hand, and its near shoulder is skin. 976213 has a blue arm and a disc knee, which is the closest costume to the idle, but a white **eyepatch** over his right eye (Gippal's tell), a beige tabard strip, and a peg where the metal foot should be. |

**Kept as the best cast: try 1, seed 976202.** It is the only one that meets the judge's two named cast faults: the
fur is on one shoulder only, and there is no grey patch. It also brings in new faults (the fork, the rod behind the
neck, the second rod). None of these casts passes the method's gates, by my look.

**Why it stopped.** The brief allows at most two tries per region. On this checkpoint, a full re-render of the cast
keeps inventing a second object for the free hand and a head for the cane tip.

**Two ways forward, neither built.** This is not a recommendation that anyone has approved.

- **(a) Mask 976202.** Repaint three things on it: the fork into a plain ferrule, the rod behind the neck into
  background, and the second rod into an open metal hand. This is small and local, but it would be a third try.
- **(b) Repair option 1's own cast with masks.** Turn the grey patch into the far shoulder's fur and sleeve, and
  remove the collar from the near shoulder. This is the judge's item 2 done as masks instead of a new render.

Either way needs Bailey's word, and then an independent judge.

## GPU, files, rules

- **GPU:** 13 jobs on the shared ComfyUI.
  - Idle: 6 in try 1 (3 regions, 2 seeds each) and 2 in the cane hand's try 2.
  - Cast: 2 in try 1 and 3 in try 2.
- **Queue and safety:** every job was submitted with fewer than 3 prompts pending, and ComfyUI was never restarted.
  No frame came out black; the maximum RGB value was 255 on every job. Every cut-out passed `cutout-guard`. Nothing
  was downloaded.
- **Frames:** taken from a private Vite server rooted at the main tree on port 5800, with HMR and watch off, headless.
  It was stopped by its PID (9196).
- **Candidates:** `D:/Tools/pyrefly-art-backup/candidates/2026-09-25-nooj6/`. Every repaint and render has a `.json`
  sidecar, and `idle-repair/idle-repaired.json` records the whole chain. The block-ins and masks are in
  `D:/Tools/pyrefly-scratch/nooj6/prep/`, and the scripts are in [scripts/](scripts/).
- **Still owed:**
  - an independent judge of the pair, as Bailey's yes asked;
  - Bailey's word on (a) or (b) for the cast;
  - the install script that refuses approved hashes (rule 9).
