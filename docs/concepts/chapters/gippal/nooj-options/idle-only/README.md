# Nooj shade: idle-only repair (FFX-2 only)

**Game case (rule 14): FFX-2 only.** The Den of Woe shades exist only in FFX-2.

Bailey said on 2026-09-25 at about 14:25 EDT, verbatim: *"I'll go with all your recommendations however"*. For
Nooj, the driver's recommendation was: *"A: fix only the idle (the loops, the sleeve, the neck fringe), then judge it.
If it passes, install it and let Nooj use the idle for his action moments too, with the usual motion, like several
bosses already do."*

This pass does the first part only: the idle repair. The faults it repairs are the ones the repair judge named in
[../README.md](../README.md), in the "Independent judge (repair)" section. The idle scored 6.9 there, and its costume
score of 6 was below the floor. The method is [METHOD-nooj-2.md](../../production/METHOD-nooj-2.md).

**Nothing is installed or judged.** `public/art/characters/nooj-shade/` is unchanged. Nothing was added to
`approved-hashes.json` or `judge-locked-hashes.json`. `verify-approved.mjs` reported ok 224, with 0 mismatched and
0 missing, before and after the pass.

**Sheet:** [sheet.jpg](sheet.jpg). It shows:

- the picked portrait;
- the attempt 6 idle and the new idle, in full on grey;
- both idles at 1:1 in a real 1600x900 engine frame;
- 2x before and after crops of each repaired region.

The frames are in [frames/](frames/). They use the same staging as the options round and attempt 6: Chapter XI, the
Den plate, the shade in Shiva's slot at factor 0.82, and the B treatment.

## The candidate

| | File | Size | sha256 (12) |
|---|---|---|---|
| Idle, attempt 7 | `D:/Tools/pyrefly-art-backup/candidates/2026-09-25-nooj7/merge/idle-m2.png` | 369x1006 | `a87ff561ef41` |
| its raw | `.../merge/idle-m2.raw.png` | 832x1216 | `8ca7b34a352f` |
| Previous, attempt 6 | `D:/Tools/pyrefly-art-backup/candidates/2026-09-25-nooj6/idle-repair/idle-repaired.png` | 369x1008 | `8e1d77e9991c` |

`merge/idle-m2.json` records the whole chain. `merge/idle-m1.*` is an intermediate that uses sleeve try 1; it is
superseded.

## Method

Each region was a masked repaint over a flat block-in painted on attempt 6's repaired raw (`scripts/nooj7_prep.py`).
The crop was upscaled to 1024 on its long side. The IP-Adapter was forced on, with the portrait square-padded plus
its head crop, at 0.5, ease in, 0.2 to 0.8, concat (`scripts/nooj7_repaint.py`, a copy of attempt 6's with its paths
changed). For the loops, a third reference was added: cast 976202's head, square-padded, because its loops are the
closest to the portrait.

Pixels outside each feathered mask are untouched. The masks do not overlap, and `scripts/nooj7_merge.py` joins the
kept repaints. The cut-out uses the pipeline's rembg (isnet-anime), and cutout-guard passed.

| Region | Judge's fault | Try 1 (2 seeds) | Try 2 | Kept |
|---|---|---|---|---|
| Loops | Black with red insides and no tie; read as ram horns | **977102**: brown hair loops with strand lines, and a small red tie where each loop meets the skull. 977101 came out with orange bows. | not needed | 977102 |
| Sleeve | Bare skin under the fur, no purple sleeve (a red, black and blue sleeve from the elbow) | 977101: a purple sleeve from the fur to the glove, but a pale lilac-grey at 1:1, meeting the fur in a straight grey seam. 977102 had a blue and pink stripe. | Over 977101, the guide recoloured the sleeve onto the bible ramp (`#3E1A4E` / `#6A2E80` / `#9A5AD0`) by its own luminance, and hung ragged fur tips over the seam, at denoise 0.5. **977202**: a deeper purple, with the fur overlapping the sleeve top. 977201 turned the tips into a jewel-like trim. | 977202 |
| Neck fringe | A lilac and orange fringe behind the neck puts fur on the near shoulder | **977102** (shared pass with the arm): the fringe is gone, and the near shoulder is the red suit with its outline. 977101 left a cyan streak along the shoulder. | not needed | 977102 |
| Machina forearm (only if it fit) | A blue blade with a fin spike | It fit in the same pass. **977102**: a grey metal upper arm, a jointed elbow, and a forearm of grey rods with gaps; no blade, no fin. 977101 put an eye-like orange orb at the elbow. | not needed | 977102 |

- **One try was cancelled before it ran.** The first sleeve try 2 would have repainted only the seam band. I deleted
  it from the queue while it was still pending, because the pale colour also needed the pass. It used no GPU time.
  The sleeve try 2 above is the only second try.
- **The one touch-up (alpha only, disclosed).** This is the same as attempt 6's. The fresh cut-out again kept the
  render's ground shadow as a pale streak left of the metal toe. `scripts/nooj7_touchup.py` set 508 pale pixels to
  transparent: cut-out x 176 to 253, y 953 to 999, every channel above 120. No colour was painted.

## My look (not a judge's)

At 1:1 on grey:

- **Loops.** These now read as hair loops, not horns. They are rounder, more like doughnuts than the portrait's
  looser loops. The red ties are small, a few pixels at each base.
- **Sleeve.** The upper arm is a purple sleeve from under the fur down to the glove, and no skin shows. It is a
  fairly straight tube with a flat cuff above the glove. The fur tips over its top show a few pink points at 2x.
- **Near shoulder.** It is clean red suit, with no fur. At 2x there is a faint light edge along the outline.
- **Machina arm.** It is grey and jointed, with gaps. There is a small amber plate on the upper arm, and the white
  ground shows through the forearm's gaps.

In the engine frame (B treatment):

- The horn read is gone. The loops show a hole and a rounder hair shape.
- The cloth arm is one continuous sleeve. Before, a bright bare gap showed under the fur.
- Nothing rises behind the neck on the near side.
- The machina arm is thinner.

**Still open, out of scope for this pass:**

- the face (young, soft, frontal);
- the lean that does not show (the cane stands vertically);
- the legs, about 60 percent of his height;
- the boxy boot;
- the slightly large glove.

## GPU, files, rules

- **GPU:** 8 jobs ran on the shared ComfyUI: loops 2, sleeve 2, near side 2, and sleeve try 2 twice. One more was
  submitted and then deleted while still pending.
- **Queue and safety:**
  - Every job was submitted with fewer than 3 prompts pending, and ComfyUI was never restarted.
  - No frame came out black: the maximum RGB was 255 on every job.
  - Nothing was downloaded.
- **Frames:**
  - They came from a private Vite server rooted at the main tree on port 5820, with HMR and watch off, headless.
    It was stopped by its PID (22860).
  - The shade copies are look-only and B-treated. `scripts/nooj7_frames_prep.py` made them in
    `D:/Tools/pyrefly-scratch/nooj7/art/`.
- **Candidates:** `D:/Tools/pyrefly-art-backup/candidates/2026-09-25-nooj7/`. Every repaint has a `.json` sidecar.
- **Block-ins, masks, look crops:** `D:/Tools/pyrefly-scratch/nooj7/`.
- **Still owed, in the order of the recommendation:**
  1. an independent judge of `a87ff561ef41`;
  2. only if it passes: the install, through a script that refuses approved hashes (rule 9), with Nooj using the
     idle for his action moments and the usual motion.
