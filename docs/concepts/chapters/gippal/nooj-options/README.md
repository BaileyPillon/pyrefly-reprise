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
