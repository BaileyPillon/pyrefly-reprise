# Nooj shade, attempt 5: three options (FFX-2 only)

**Game case (rule 14): FFX-2 only.** The Den of Woe shades exist only in FFX-2.

Bailey said on 2026-09-25, verbatim: *"all recommendations please"*. That accepted "a fresh render with a new method,
shown to you as options before any more attempts". The method is
[production/METHOD-nooj-2.md](../production/METHOD-nooj-2.md).

**Nothing is installed.** `public/art/characters/nooj-shade/` still holds attempt 4, and nothing was added to
`docs/target/approved-hashes.json`. `verify-approved` reported 0 mismatched and 0 missing before the run (ok 202) and
after it (ok 224). The rise in the ok count comes from other agents' approvals made during this run, not from this one.

**Sheet:** [sheet.jpg](sheet.jpg). It shows the approved portrait and the installed attempt-4 pair. Under them, each
option gets one row: the idle and the cast in full, the idle's upper body at 1:1, and the idle and the cast at game size
(1:1 crops of real 1600x900 engine frames). The full frames are in [frames/](frames/).

**Recommendation (my look, as the agent that rendered these; not a judge and not Bailey):** Option 1, "Leaning on the
cane". It is the only option that follows the bible's staging rule: his weight is on the cane, the cane acts as a third
leg, and the near leg is a piston with a knee joint. Before it can be called passing, an independent judge still has to
look at its gloved hand, which has silver finger reads.

## The options

All three come from arm C of the method, re-worded after the pilots (see below). Each option is one idle, picked from
2 to 4 seeds, and one cast rendered from its own skeleton. The cast's IP-Adapter also sees that option's idle.

| | Option 1: Leaning on the cane | Option 2: Hand on hip | Option 3: The portrait's gesture |
|---|---|---|---|
| Idle | `idle-lean/C-opt/cand-975102` | `idle-upright/C-opt/cand-975101` | `idle-glasses/C-opt/cand-975101` |
| Cast | `cast/C-lean-f/cand-975201` | `cast/C-upright-f/cand-975201` | `cast/C-glasses-f/cand-975201` |
| Stance | Weight on the cane, which is planted forward past the far foot; the machina arm hangs free | Upright; the cane is planted at his side and the machina hand rests on his hip with the elbow out | The machina fingers touch the glasses, as in the picked portrait; the cane is planted at his side |
| What reads | A fur shape on the far (right) shoulder that breaks the outline; two loops with ties; blue glasses; a thin blue machina arm with joints; a piston shin with a knee joint and a metal foot; a purple boot; the cane touches the ground | A large fur shape, the widest of the three; a jointed machina arm akimbo, which makes a clear triangle gap in the outline; a metal shin | The gesture that ties him to the portrait; a thin black machina arm; a large fur shape; a black piston shin and a purple boot; a black glove on the cane |
| What is off | The gloved hand on the cane has silver, skeletal-looking fingers, a claw risk; there are only 2 or 3 belts; the machina arm is blue, where the bible says grey | The chest turned magenta; the costume grew a long red tabard and a pink hanging sash; the metal foot is a pointed blade, a hoof risk; the cane head has a skull-like pattern; fur fringe also shows on the near shoulder | The far forearm carries a red cuff with round "eye" ornaments; he renders smaller in the engine frame than the other two |

**Shared by all three:**

- **The faces** are younger and softer than the portrait's man. The negative prompt lists `1girl, female, feminine`,
  and `mature male, sharp jawline` was added, but the faces are still soft.
- **The bodysuit** is orange-red rather than the bible's crimson. The B treatment desaturates it.
- **The legs are long.** That proportion is ours; it comes from the skeletons.
- **The fur is grey-white,** where the portrait's is lilac.
- **The three casts are nearly the same picture**, because they share one seed, one skeleton and one block-in. The
  idle reference changed little. In each cast:
  - The fur grew into a white collar across **both** shoulders. It is widest on the leading (right) shoulder, but the
    bible puts fur on one shoulder only.
  - The cane is levelled at the party.
  - The elbow is continuous, because the cast was rendered from its own skeleton rather than rotated from the idle.
  - The piston shin and the purple boot are both present.

**Game-size reads (my look).** In the engine frames, each idle shows these squint reads:

- a tall red column;
- one furred shoulder as a shape, about 55 to 70 px wide at 1600x900, estimated from the cut-out widths times the frame
  scale (attempt 4's tuft was 25x30);
- a thin arm;
- the cane as a third leg.

The loops read as handles. All of this is unverified until a judge measures it.

## What was done (the method, and where I departed from it)

**The pieces, in [scripts/](scripts/):**

- **`nooj5_prep.py`** writes OpenPose COCO-18 skeletons facing left (idle-lean, idle-upright, idle-glasses, and a cast
  at 1152x1216). It also writes three region masks per pose: far-shoulder fur, near machina arm, near piston shin. It
  paints a flat block-in in the bible §1.23.4 colours, and makes the portrait refs: a square padded on white, so that
  the fur is inside CLIP-Vision's crop, plus a head crop.
- **`nooj5_render.mjs`** builds the graph:
  - Animagine XL 4.0 Opt.
  - IP-Adapter plus SDXL at 0.5, ease in, 0.2 to 0.8, concat, forced on.
  - Core `ConditioningSetMask` regions, combined with the base prompt.
  - xinsir OpenPose at 0.8.
  - Arm C adds img2img over the block-in.

  Every render has a `.json` sidecar with all of its settings.
- **Frames:** `nooj5_frames_prep.py` applies the installed shades' own `shade_b.py`. `shot.mjs` (Chapter XI staging,
  factor 0.82) captured the frames. The private Vite server ran on port 5490 and was stopped by its PID.
- **`nooj5_sheet.py`** builds the sheet.

**The pilots:**

- **Pilot 1** (idle-lean; A on seed 975001, B and C on 975001 and 975002):
  - A and B turned `purple fur mantle` into a **cape over both shoulders**, and no machina arm showed.
  - C (the block-in) was the only arm that put the fur on the correct far shoulder as a shape, with two loops and red
    ties. Its near arm stayed a red sleeve, and the figure read as female.
- **Pilot 2**, three jobs:
  - The words changed: `purple fur mantle` became `fur-trimmed sleeve, purple sleeve, grey fur`; `cape, cloak, capelet,
    long coat, 1girl, female, feminine` went into the negative; `(mechanical arm:1.2), prosthetic arm, (mature
    male:1.2)` was added, with a stronger arm region.
  - The machina arm was swung out from the body in the skeleton.
  - The block-in got wider shoulders and a darker, wider piston shin.
  - Result: C showed the thin jointed machina arm and the fur on the far shoulder. B stayed off-model: a topknot, not
    loops, and a bulky arm. **From here on, only arm C was used.**
- **Options:** three stances with 2 seeds each, at denoise 0.72. Two more seeds went to the upright stance after both
  of its first idles failed (one had breasts; the other's shin was a spike).
- **Casts:** 2 seeds for each option. In all six, the fur came out a small tuft, so I enlarged the cast's fur region
  and block-in to rise above the shoulder line and re-rendered one cast per option (`-f`). Those are the ones shown.
- **Touch-ups:** none. Every pixel shown is the render's own.

**What the method's pass bar still needs.** **No independent judge has scored these.** The method requires the
JUDGE.md rubric at bar 7, with no category below 6.5, and a judge who made none of the files. The 1:1 gates also still
need to be checked: human ear, gloved hand, one boot and one metal foot, at least three belts, continuous elbow, same
man. So these are **options for Bailey to react to, not verified passes.**

## GPU, files, rules

- **GPU:** 25 renders on the shared ComfyUI, against the method's ceiling of 26:
  - pilot 1: 5
  - pilot 2: 3
  - options: 6, plus 2 more upright seeds
  - casts: 6, plus 3 with the larger fur
- **Queue and safety:** every job was submitted with fewer than 3 prompts pending. There were no black frames, and
  ComfyUI was never restarted. Every cut-out passed `cutout-guard`. Nothing was downloaded.
- **Candidates** (raw, cut-out and sidecar): `D:/Tools/pyrefly-art-backup/candidates/2026-09-25-nooj5/<pose>/<arm>/`.
- **Scratch:** `D:/Tools/pyrefly-scratch/nooj5/`, which holds the prep images, the B-treated look-only copies and the
  PNG frames.
- **Still owed** before anything is installed:
  - Bailey's pick. Rule 9: a pick approves only what Bailey names.
  - An independent judge of the picked pair.
  - The B treatment and sidecars written by an install script that refuses approved hashes, as the attempt-4 install
    did.

## Independent judge (2026-09-25)

**Game case (rule 14): FFX-2 only.** The judge is a sub-agent that made none of these files and changed no art. The
rubric and bar are those of [production/JUDGE.md](../production/JUDGE.md): bar 7 overall, and the method adds that no
category may fall below 6.5. The gates are from [METHOD-nooj-2.md](../production/METHOD-nooj-2.md). Identity is judged
against the picked portrait `public/art/portraits/nooj.png` and visual bible §1.23.4. These are a judge's verdicts,
not Bailey's pick. Nothing was installed or locked. `verify-approved` reported ok 224, with 0 mismatched and 0 missing.

**Files judged (sha256, first 12 characters).** All are in `D:/Tools/pyrefly-art-backup/candidates/2026-09-25-nooj5/`.

| File | sha256 |
|---|---|
| `idle-lean/C-opt/cand-975102` | `079577b678f1` |
| `idle-upright/C-opt/cand-975101` | `7f72cb26c838` |
| `idle-glasses/C-opt/cand-975101` | `5d6191d26045` |
| `cast/C-lean-f/cand-975201` | `eb43e21a686f` |
| `cast/C-upright-f/cand-975201` | `b312e866856d` |
| `cast/C-glasses-f/cand-975201` | `867271d92909` |

**Method.**

- Each cut-out was composited over mid grey and over dark blue, then viewed at 1:1 and at 2x (head, shoulders, both
  hands, both feet).
- The six engine frames in `frames/` were cropped at 1:1, and the shoulders at 2x nearest-neighbour, beside the
  installed attempt-4 frames.
- Fur width was measured on the far side of the head in each idle cut-out: light, low-saturation pixels above the
  chest. It was then scaled by the figure's height in the frame. The 2x crops of the frames were checked by eye. These
  numbers carry about ±8 px of error, because the dark lilac fur tips and the B glow blur the edge.

### Scores (0 to 10; bar 7, no category below 6.5)

| Painting | Identity | Anatomy | Hands | Costume | Seams | Edges | Finish | Game read | Overall |
|---|---|---|---|---|---|---|---|---|---|
| Opt 1 idle (lean 975102) | 6.5 | 6 | 5 | 6 | 8 | 7.5 | 7 | 7.5 | **6.7 FAIL** |
| Opt 1 cast (C-lean-f) | 6 | 7 | 7 | 5.5 | 6 | 7.5 | 6.5 | 7.5 | **6.6 FAIL** |
| Opt 2 idle (upright 975101) | 5.5 | 6 | 6 | 5 | 8 | 7.5 | 7 | 7 | **6.5 FAIL** |
| Opt 2 cast (C-upright-f) | 5.5 | 6.5 | 7 | 5 | 6 | 7.5 | 6.5 | 7.5 | **6.4 FAIL** |
| Opt 3 idle (glasses 975101) | 6 | 6.5 | 6 | 5.5 | 8 | 7.5 | 7 | 6.5 | **6.6 FAIL** |
| Opt 3 cast (C-glasses-f) | 6 | 7 | 7 | 5.5 | 6 | 7.5 | 6.5 | 7.5 | **6.6 FAIL** |

For comparison, the installed attempt 4 scored 6.9 and 6.8 in round 1. **No pair passes.** Every painting also has
at least one category below 6.5.

### Gates

| Gate | Opt 1 | Opt 2 | Opt 3 |
|---|---|---|---|
| Tall column (red before B) | yes | yes | yes |
| One furred shoulder, ≥ 50 px, breaking the outline | yes, about 51 to 59 px, far (right) shoulder | yes, about 51 to 63 px, but fringe on both shoulders | borderline, about 35 to 52 px; the figure renders smaller |
| One thin skeletal arm | thin at game size; at 1:1 a blue fin with no fingers | yes, a jointed arm akimbo | yes, raised to the glasses |
| Cane as a third leg, touching the ground | yes | yes, in front of the far leg | yes |
| Two loops with ties; blue glasses | yes; the loops are black and read as ram horns at 2x | yes | yes |
| Human ear | yes (near side) | yes, small | not visible |
| Gloved hand, finger reads, no spur | **no**: silver skeletal fingers under the cane glove | near hand yes; the cane hand is hidden under the tabard | the glasses hand yes; the far hand is swallowed by a black fur cuff |
| One purple boot and one metal foot, no hoof | **no**: both legs end in footless pegs | **no**: the metal foot is a pointed blade, and the boot is a flared bell | **yes** |
| At least 3 belts | 3, narrowly (chest harness and two crossed hip belts) | 2 | 1 |
| Cast elbow continuous | yes | yes | yes |
| Cast is the same man as the idle | **no** (see below) | **no** | **no** |

### Named faults, worst first

**Faults shared by all three casts.** They are one picture: one seed, one skeleton, one block-in.

- **Worst: a flat, unrendered grey patch on the leading (cloth, right) shoulder.** It spans about x 560 to 625 and
  y 145 to 210 in each cast `.png`. It reads as a metal pauldron on the cloth side, so the metal is on the wrong side.
- The fur is a white collar around the neck and across both shoulders. The bible has grey fur topping one purple
  sleeve on the right shoulder.
- There is no purple sleeve, and only one waist belt.
- **Not the same man as its idle.** Option 1's idle has a blue machina arm, lilac fur and black loops; its cast has a
  white arm, a white collar and brown loops. Option 2's magenta chest and tabard disappear in the cast. Option 3's red
  eye cuff disappears and its silver arm turns white. In the engine the idle-to-cast swap will visibly change the man.
- The cast's feet land about 60 to 90 px to the right of the idle's in the frame, the same staging note as attempt 3.
- **What works:** the cane is levelled at the party and reads at 1600x900. The faces are the sharpest and closest to
  the portrait in the whole set, three-quarter left with a frown. The elbows are continuous. The feet are real.

**Option 1, "Leaning on the cane", FAIL (idle 6.7, cast 6.6).**

- **Worst: the hands.** The cane hand is a black fingerless glove over silver, skeletal, mechanical fingers. That
  puts metal fingers on his cloth (right) side, and at 2x it reads as a claw. The machina hand is a pale blue fin with
  no fingers.
- **Both legs end in footless pegs.** The purple boot is a flat-bottomed stump, and the metal shin tapers into a blue
  stump below a disc knee. Neither has a foot or a toe.
- **The staging does not show the lean.** The cane stands vertically beside him, the legs are apart, and the body and
  face are nearly frontal rather than three-quarter left. The "weight on the cane" is not legible at 1:1 or in the
  frame.
- Under the fur the upper arm is bare skin, then a red, black and blue sleeve begins. There is no purple sleeve. The
  machina arm is blue, where the bible has grey, and at 1:1 it is a blade-shaped plate, not a stick with gaps.
- The loops are black with red insides and read as ram horns at 2x; the portrait's loops are brown hair.
- The face is young, soft and frontal. The legs are about 60 percent of his height.
- **What works:** it has the best squint read of the three. One lilac fur shape on the correct far shoulder breaks the
  outline, there is a thin arm, and the cane touches the ground. The cut-out is clean, and none of it was touched up.

**Option 2, "Hand on hip", FAIL (idle 6.5, cast 6.4).**

- **Worst: the costume and the face.** The chest is magenta with a heart-shaped pendant. A long red tabard hangs over
  the far arm, and a pink sash hangs between the legs. The face is the most feminine of the three: frontal, with large
  eyes.
- The metal foot is a black triangular blade, a hoof or blade read. The far boot flares like a bell and has no foot.
- The cane head is white with black dots and reads as a skull or dalmatian pattern. The cane hand is hidden.
- Fur fringe also shows on the near shoulder.
- **In the cast the metal shin turns purple below the knee.** Two purple boots means the metal-foot gate fails there
  too. A strap hangs from the belt.
- **What works:** it has the widest fur. The akimbo machina arm is the clearest mechanical read of the three, and it
  is the only option with a purple upper sleeve.

**Option 3, "The portrait's gesture", FAIL (idle 6.6, cast 6.6).**

- **Worst: the far forearm.** It carries a red cuff with two round, eye-like ornaments, a face read at 1:1 and 2x. It
  ends in a black fur cuff that swallows the hand, and the cane appears to grow out of it.
- There is one belt.
- The face is the softest and most feminine.
- At game size he renders about 300 px tall, against about 345 px for the other two, so the fur falls to the 50 px
  gate or below it.
- **What works:** the machina fingers at the glasses tie him directly to the picked portrait. It is the only idle with
  real feet: a purple boot with a toe, and a black metal leg with a foot. The machina forearm reads as metal.

### Best option

**Option 1 is the closest, narrowly (idle 6.7), and none passes.** It is the only one with the right squint reads in
the frame: one fur shape on the correct shoulder, a thin arm, and the cane as a third leg. Its misses are local to
the hands and the feet. Options 2 and 3 fail on costume and face identity, which are harder to repair.

If Bailey still wants to react to Option 1 as the base, these would lift it to the bar. This is the judge's list, not
yet approved by anyone.

1. Masked repaints of the cane hand (a gloved human hand, no silver fingers), the machina hand (jointed metal fingers)
   and both feet (a boot toe, and a metal foot that is not a hoof).
2. A new cast derived from Option 1's idle, with the fur region only on the far shoulder, no grey block-in on the
   leading shoulder, the idle's machina arm colour, and the idle's loops.
3. A fresh independent judge of the result.

## Targeted repair of option 1 (2026-09-25)

Bailey accepted option 1 with one targeted repair pass. The results are in [repair/README.md](repair/README.md) and
[repair/sheet.jpg](repair/sheet.jpg).

- **The idle** has been repaired: the cane hand, the machina hand and the feet.
- **The cast** did not come right in two tries, so the pass stopped. The best try is kept, and it is not judged.

Nothing was installed.

## Independent judge (repair) (2026-09-25)

**Game case (rule 14): FFX-2 only.** The judge is a sub-agent that made none of these files and changed no art. The
rubric and bar are those of [production/JUDGE.md](../production/JUDGE.md): bar 7 overall, and no category below 6.5.
The gates are from [METHOD-nooj-2.md](../production/METHOD-nooj-2.md). Identity is judged against the picked portrait
`public/art/portraits/nooj.png` and visual bible §1.23.4. This is a judge's verdict, not Bailey's. Nothing was
installed or locked. `verify-approved.mjs` reported ok 224, with 0 mismatched and 0 missing, before and after.

**Verdict: both files FAIL.** The idle is closer (6.9), and the repair did what it was asked to do. The cast is
further off (6.4).

**Files judged.** Both are in `D:/Tools/pyrefly-art-backup/candidates/2026-09-25-nooj6/`, and each sha256 was
re-computed and matches the repair README.

| File | sha256 (12) |
|---|---|
| `idle-repair/idle-repaired.png` (369x1008) | `8e1d77e9991c` |
| `cast/C-r1/cand-976202.png` (876x991) | `b31df6985f14` |

**Method.**

- Each cut-out was composited over mid grey and over dark blue and viewed at 1:1. The head, both hands, both feet and
  the torso were then viewed at 2x nearest-neighbour. Option 1's own idle and cast were beside them.
- The two engine frames in [repair/frames/](repair/frames/) (1600x900, Chapter XI staging, factor 0.82, B treatment)
  were cropped at 2x, beside option 1's frames.
- Fur width was measured on each cut-out: the extent from the 1st to the 99th percentile of light, low-saturation
  pixels over the far shoulder. It was then scaled by the figure's height in the frame: 0.366 for the idle and 0.357
  for the cast. The dark lilac tips and the B glow blur the edge, so the numbers carry about ±8 px of error.
- The look-only crops are JPEGs in `D:/Tools/pyrefly-scratch/nooj6-judge/`.

### Scores (0 to 10; bar 7, no category below 6.5)

| Painting | Identity | Anatomy | Hands | Costume | Seams | Edges | Finish | Game read | Overall |
|---|---|---|---|---|---|---|---|---|---|
| Opt 1 idle, before the repair | 6.5 | 6 | 5 | 6 | 8 | 7.5 | 7 | 7.5 | 6.7 |
| **Repaired idle** | 6.5 | 6.5 | 7 | **6** | 7.5 | 7.5 | 7 | 7.5 | **6.9 FAIL** |
| Opt 1 cast, before the repair | 6 | 7 | 7 | 5.5 | 6 | 7.5 | 6.5 | 7.5 | 6.6 |
| **Cast 976202** | 6.5 | 6.5 | **5.5** | **5** | 7 | 7.5 | 7 | 6.5 | **6.4 FAIL** |

The idle misses the bar by 0.1, and its costume score (6) is below the 6.5 floor. The cast misses the bar by 0.6,
and both its hands score (5.5) and its costume score (5) are below the floor.

### Gates

| Gate | Repaired idle | Cast 976202 |
|---|---|---|
| Tall column (red before B) | yes | yes |
| One furred shoulder, ≥ 50 px, breaking the outline | **yes**, about 58 to 70 px on the far (right) shoulder. A ragged lilac and orange fringe also rises behind the neck on the near side, about 50 px wide on the canvas, and at 2x in the frame it reads as the collar carrying on | **yes**, about 64 to 71 px, on the far shoulder only. It is the cleanest fur shape of any attempt |
| One thin skeletal arm | thin at game size. At 1:1 the forearm is still the blue blade with a fin spike at the elbow; only the hand is new | yes, a silver jointed arm with gaps |
| Cane as a third leg, touching the ground | yes | n/a (levelled at the party, which reads) |
| Two loops with ties; blue glasses | loops yes, but black, with red insides and no separate tie, so they read as ram horns at 1:1 and as handles in the frame. Glasses yes | **yes**: brown hair loops with red ties, the closest yet to the portrait. Glasses yes |
| Human ear | yes, small, on the near side behind the hair | **no**: no ear shows on either side |
| Gloved hand, finger reads, no spur | **yes**: a black-gloved human fist with knuckle folds, no metal and no spur. It is oversized for his forearm, and the white insert below it is blocky at 1:1 | **no**: the cloth-side glove is a mitten with one pointing finger, and the cane passes over it without being gripped. The forearm above it is a black plated sleeve |
| One purple boot and one metal foot, no hoof | **yes**: a boxy purple boot with a toe and a sole, and a grey metal foot with a toe plate | borderline: the purple boot has a toe, but the metal foot is a plate with two forward prongs, a claw risk at 2x |
| At least 3 belts | 3, narrowly (the chest harness and two crossed hip belts) | 3, narrowly (the same) |
| Cast elbow continuous | n/a | yes |
| Cast is the same man as the idle | n/a | **no** (see below) |

### Named faults, worst first

**Repaired idle, FAIL (6.9).** The three repaired regions pass their gates. The fail comes from faults that were out
of scope for this pass.

- **Worst: the costume.** Under the fur the upper arm is bare skin, and a red, black and blue sleeve starts at the
  elbow. There is no purple sleeve. The machina forearm is a blue blade with a fin spike, where the bible has grey.
  The near-side fringe behind the neck puts some fur on both shoulders. The new boot is boxy, close to an armoured
  greave.
- **Identity:** the loops still read as ram horns, and the face is young, soft and frontal, with a pout.
- **Staging:** the lean does not show. The cane stands vertically beside the far leg, the body is frontal, and the legs
  are about 60 percent of his height.
- **The repaired regions at 1:1:**
  - The glove is a little large.
  - The cane's blue and white handle hangs below the fist rather than running into it.
  - A few pale pixels of the ground shadow remain left of the metal toe, after the alpha touch-up.

  None of these reads in the frame.
- **What works:** at game size the fist reads clearly on the cane, and both legs now end in feet. The fur shape and
  the cane as a third leg still give the best squint read of every attempt.

**Cast 976202, FAIL (6.4).**

- **Worst: the props, which read at game size.**
  - The cane ends in a blue trident with an eye-like gem at the fork, so it is a staff, not the idle's cane.
  - A second length of the shaft runs on behind his neck and out past the near shoulder. At 1600x900 it is a clear
    line to the right of his head.
  - The machina hand grips a second black rod, which hangs down in front of his crotch. It reads in the frame.
- **The hands.** The cane hand is a mitten that points rather than grips. The cloth-side arm is a black plated sleeve,
  which puts armour on the cloth side.
- **The costume.** The near shoulder is bare skin. The metal foot is a pronged plate.
- **Not the same man as the idle.** The idle has black horn loops, a blue blade arm, a red and blue cloth sleeve and a
  plain silver cane with a blue handle. The cast has brown loops, a silver skeletal arm, a black armoured sleeve and a
  trident staff. After the B treatment the colour gap shrinks, but the trident and the rod behind the neck still
  change the prop. The cast's feet land about 50 to 90 px to the right of the idle's in the frame, the staging note
  from attempts 3 and 5.
- **What works:**
  - It fixes both cast faults the first judge named. The fur is on the far shoulder only, and the grey patch is gone.
  - The face is the most mature and portrait-like of every attempt, three-quarter left with a frown.
  - The loops and ties match the portrait.
  - The elbow is continuous, and the levelled cane reads.

### What would lift it (the judge's list; nobody has approved it)

1. **Idle, 0.1 short:** masked repaints of the loops (brown hair loops with red ties, with 976202's loops as the
   reference), and of the upper arm under the fur (a purple sleeve over the bare skin). Remove the near-side fringe
   behind the neck. The costume and identity scores are the ones below the bar, and this would lift both.
2. **Cast:** builder route (a) as written, which repaints the fork, the rod behind the neck and the second rod, does
   **not** reach the gates on its own. The cane hand and the black sleeve would still fail. It would also need the cane
   hand to grip and a red sleeve on the cloth arm. After step 1, the cast and the idle would share their loops, and the
   same-man gate could then pass. Route (b), masks on option 1's own cast, starts from a face and loops that are
   further from the portrait.
3. Either route is a third try under rule 15, so it needs Bailey's word first, then a fresh judge.

### Verdicts

- repaired idle (`8e1d77e9991c`): FAIL (6.9)
- cast 976202 (`b31df6985f14`): FAIL (6.4)
- The pair: FAIL. Nothing was locked, and both files stay CANDIDATE.

## Independent judge (idle only) (2026-09-25)

**Game case (rule 14): FFX-2 only.** The judge is a sub-agent that made none of these files and changed no art. The
rubric and bar are those of [production/JUDGE.md](../production/JUDGE.md): bar 7 overall, no category below 6.5. The
gates are the idle gates of [METHOD-nooj-2.md](../production/METHOD-nooj-2.md). Identity is judged against the picked
portrait `public/art/portraits/nooj.png` and visual bible §1.23.4. This is a judge's verdict, not Bailey's; nothing
was installed or locked. `verify-approved.mjs` reported ok 224, with 0 mismatched and 0 missing, before and after.

**Verdict: the idle PASSES, narrowly (7.0).** All three named faults are repaired, and so is the blade arm. The costume
rises from 6 to 7, and no category is below the floor. The pass is at the bar, not above it.

**File judged.** `D:/Tools/pyrefly-art-backup/candidates/2026-09-25-nooj7/merge/idle-m2.png` (369x1006). I re-computed
its sha256, and it matches [idle-only/README.md](idle-only/README.md): `a87ff561ef41`. It is not in
`approved-hashes.json` or `judge-locked-hashes.json`.

**Method.**

- The cut-out was composited over mid grey and over dark blue and looked at at 1:1, beside attempt 6's idle
  (`8e1d77e9991c`). The head, loops, shoulders, both arms, the hands, the belts and the feet were looked at at 2x
  nearest-neighbour, and the face and ears at 4x.
- Game size: the builder's 1600x900 engine frame [idle-only/frames/nooj7-idle.jpg](idle-only/frames/nooj7-idle.jpg)
  (Chapter XI staging, the Den plate, Shiva's slot at factor 0.82, B treatment), cropped at 2x beside attempt 6's frame.
  I did not re-render the scene. I did re-run `production/scripts/shade_b.py` on `a87ff561ef41`, and its output is
  byte-identical to the look copy the frame loaded (`869f9ae5b1d8`). So the frame shows this file.
- Fur width: on the cut-out, the fur runs from about x 52 to where it meets the collar at about x 210, per row
  between y 100 and 260. Scaled by the figure's height in the frame (about 0.36), that is about 55 to 60 px. On the
  2x frame crop it is about 65 px. Either figure carries about ±8 px.
- The look-only crops are in `D:/Tools/pyrefly-scratch/nooj7-judge/`.

### Scores (0 to 10; bar 7, no category below 6.5)

| Painting | Identity | Anatomy | Hands | Costume | Seams | Edges | Finish | Game read | Overall |
|---|---|---|---|---|---|---|---|---|---|
| Attempt 6 idle (previous judge) | 6.5 | 6.5 | 7 | 6 | 7.5 | 7.5 | 7 | 7.5 | 6.9 |
| **Attempt 7 idle `a87ff561ef41`** | 7 | 6.5 | 7 | **7** | 7 | 7 | 7 | 7.5 | **7.0 PASS** |

Seams and edges each drop half a point from attempt 6. That comes from the new fur-to-sleeve join and the faint pale
edges (see below). The costume and identity gains outweigh them.

### Gates

| Gate | Attempt 7 idle |
|---|---|
| Tall column (red before B) | yes |
| One furred shoulder, ≥ 50 px, breaking the outline | **yes**, about 55 to 65 px, on the far shoulder only. The spiky crest rises above the shoulder line in the frame. Nothing rises behind the neck on the near side any more |
| One thin skeletal arm | **yes**. It is a grey metal upper arm, a jointed elbow and a forearm of grey rods with gaps. The blade and the fin are gone, and it reads thinner in the frame |
| Cane as a third leg, touching the ground | yes |
| Two loops with ties | **yes at 1:1 and 2x**: two brown hair loops with strand lines, each with a small red tie at its base. They no longer read as horns. In the frame they read as two round hair loops with holes. The B treatment washes out the red, so the ties do not read at game size |
| Blue glasses | yes |
| Human ear | yes. At 4x it sits on the near side under the loop, with inner-ear shading |
| Gloved hand, finger reads, no spur | yes: a black glove with knuckle folds, closed on the cane, with no spur. It is still large, and the cane's blue and white handle hangs below the fist rather than running into it |
| One purple boot and one metal foot, no hoof | yes: a boxy purple boot with a toe and a sole, and a grey metal foot with a toe plate |
| At least 3 belts | 3, narrowly: the chest harness and two crossed hip belts |

### Named faults, worst first (none blocks the pass)

- **Anatomy and staging, unchanged and out of this pass's scope; this is the lowest category, at the floor.** The
  face is young, soft and frontal, with a pout, where the portrait is mature and angular. The lean does not show,
  because the cane stands vertically. The legs are about 60 percent of his height.
- **The sleeve.** It is purple from under the fur to the glove, with no skin showing, which fixes the worst costume
  fault. But it is a straight tube with a flat cuff. There is a pale lavender sliver above the glove. At 2x the fur tips
  over its top form a regular, sawtooth pale and pink fringe, so the join reads a little like trim rather than fur.
  None of this reads in the frame.
- **The loops.** They are rounder than the portrait's, like doughnuts, and the ties are a few pixels each.
- **Edges.** On dark blue at 2x there is a faint pale halo along the loops' outer edge and along the near shoulder's
  outline. There is also a tiny orange sliver left of the metal toe, at about x 245, y 974. The B glow hides both
  in the frame.
- **Costume leftovers.** There is a small amber plate on the machina upper arm. A red and black fold sits in the
  armpit below the fur. The boot is boxy.

### What works

- In the frame, the four squint reads and the portrait anchors are all present: the tall column, one fur crest, the
  thin metal arm, the cane as a third leg, the two loops and the glasses. It is the most complete Nooj read of any
  attempt.
- The masks do not show at 1:1. The loops, sleeve, near shoulder and machina arm sit in the painting's own line and
  colour.

### Verdict

- Attempt 7 idle (`a87ff561ef41`): **PASS (7.0)**, narrowly. This is a judge's verdict and it is not locked here.
- Following the driver's recommendation, the next step would be the install, through a script that refuses approved
  hashes, with Nooj using this idle for his action moments and the usual motion. Nothing in this section does that.
