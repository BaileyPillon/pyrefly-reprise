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
