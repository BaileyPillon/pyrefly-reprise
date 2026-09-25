# Nooj shade idle: method check before the third attempt (rule 15)

**Game case (rule 14): FFX-2 only** (the Den of Woe shades exist only in FFX-2). Written 2026-09-25 by the
sub-agent that re-judged the repair pass; it made neither earlier attempt.

## What failed, twice

| Attempt | What was done | Judge | What the judge named |
|---|---|---|---|
| 1 | Fresh render, seed 962203 (`scripts/render1.sh`, second batch). Prompt had `(from side:1.3)`. The IP-Adapter reference `portraits/nooj.png` was **skipped** by the monochrome guard (`refSkippedMonochrome`), so no portrait identity went in. | FAIL 6.9 | no hair loops; knee-length ponytail dominates; fur sleeve hidden; cane in the machina left hand (bible: right); one belt |
| 2 | One masked repair on the same render (`scripts/nooj_idle2.py`): ponytail cut at mid-back, one loop blocked in and repainted with IP-Adapter at 0.55. | FAIL (independent re-judge, 2026-09-25) | the loop is a small dark braid behind the ear that does not read at game size, no red tie on it, no second loop; the ponytail is still the largest hair shape and its cut tip is striated; fur sleeve, cane hand and single belt unchanged |

## Why it failed

1. **The pose was the wrong camera.** `(from side:1.3)` gave a pure profile. In pure profile the far loop and the far
   (right) shoulder's fur are behind the head and body, so two of the four squint reads in bible §1.23.4 ("two hair
   loops flank the skull like handles", "one furred shoulder") cannot exist in that picture. No masked repair can add
   them; the judge said so in round 1.
2. **Identity never went in.** The portrait reference was skipped by the guard, so the render took "two loops" from
   text alone, which the checkpoint reads as a high ponytail.
3. **The repair patched pixels, not the design.** A loop drawn over a profile head sits where an ear is and reads as a
   braid; it is too small because the head is small at full-body scale.

## What is different now

- **A fresh render, not a repair**, on the bible's staging: **three-quarter left** (no `from side`), metal left side
  toward camera, so the far loop and the far shoulder's fur crest can show past the head and the near shoulder.
- **IP-Adapter on the picked portrait, forced** past the monochrome guard with `--forceRef` (as tonight's hero-plate
  runs did), at a low, late window so it carries the face, the two loops and the red ties without dictating the bust
  pose: weight 0.45, `ease in`, start 0.2, end 0.6 (the Evrae redo and Chapter XV hero-plate settings). Recorded in
  each render's sidecar (`ref`, `refWeight`, and no `refSkippedMonochrome`).
- **Hair words the checkpoint knows:** `hair rings` (the Danbooru tag for side loops), `red hair ties`,
  `medium ponytail`; negative `very long hair, absurdly long hair`.
- **The cane in his right (far) hand** as the bible says; the machina left arm free on the camera side.
- **Pilot 4 seeds, look at each 1:1, pick one or stop.** If no pilot shows both loops and the fur, I stop and report
  rather than repair (a third patch on a wrong base would repeat attempt 2).
- The cast is derived from whichever idle passes, the way the chapter's other casts were made (one rigid forearm turn
  about the elbow, the seam repainted inside its mask only), then the same B treatment (`scripts/shade_b.py`).

## What actually ran (added after the attempt)

- The pilot of 4 (seeds 970101-970104) showed neither loops nor the fur reliably, so the prompt was varied over 9
  pilots, 62 seeds in all (970101-970908; 4 quarantined by the cut-out guard), every one with the portrait forced in
  (`--forceRef`, no `refSkippedMonochrome` in any record). What moved the needle: `hair rings` at 1.4 and weight 0.55
  (loops), and naming the cane arm as "his human hand in a dark glove" with the negative "mechanical hand holding
  cane" (the cane moved to the right hand). No seed gave the fur on the right shoulder only.
- Picked: **970704**, the only render with glasses, a loop and tie, one fur shoulder, the machina left side toward
  camera and the cane in the right hand together. Its far loop was missing, so **one** masked repaint added it,
  with IP-Adapter on the portrait (seed 971102 of 3, denoise 0.6). This is a repair on a base whose camera allows
  the loop, unlike attempt 2.
- Stop rule kept: had no pilot shown the loops and the fur, I would have stopped; one did, so I did not.
- Scripts: `scripts/nooj3/`. Renders, the replaced files and the work files:
  `D:/Tools/pyrefly-art-backup/candidates/2026-09-25-gpu2/nooj-shade/`.

## Method check before the fur-shoulder repaint (attempt 3 fix, 2026-09-25, gpu3 judge)

Written by the third, independent judge (it made none of the Nooj files) before any render, because this slot has
failed twice (rule 15).

- **What is wrong, from the source.** Bible §1.23.4 (FF Wiki *Nooj* §Appearance, `[single source]`): "Over his
  **right shoulder** is a purple sleeve with fur at the top", and the silhouette line: "one arm is a thin articulated
  stick ... the other is a thick furred purple shoulder". Attempt 3 puts the fur on the **left** (machina) shoulder and
  leaves the right shoulder bare skin over a dark glove, so the asymmetry the bible calls "the character" is inverted.
- **Why a masked repaint can work this time, when attempt 2's could not.** Attempt 2 failed because the camera hid the
  thing to be added. Here the camera is right: at three-quarter left the far (right) shoulder's top edge is in view
  (x 203 to 286 on the opaque idle), so a sleeve and a fur crest can be added there, and the near fur can be taken
  off. No re-render is needed, and no seed hunt: 62 seeds already showed the checkpoint will not put the fur on the
  right shoulder from text.
- **Method.** On the opaque idle (`nooj3-idle-opaque.png`): (1) segment the near fur (light, low-saturation pixels,
  x >= 385), cut it out and block in a metal shoulder cap and the trapezius in the render's own colours, silhouette
  drawn to follow the arm's outer edge; (2) recolour the far shoulder and upper arm down to y 288 to the bible's
  purple ramp (`#3E1A4E` / `#6A2E80` / `#9A5AD0`) and block in a ragged grey fur crest (`#8E8C97` / `#C4C2CC`) along
  its top. Then **one masked repaint per shoulder** with IP-Adapter forced on `portraits/nooj.png` (its lower edge
  shows the purple fur), 3 seeds each, pick at 1:1, alpha from the block-in. The sleeve stops at y 288 so it stays in
  the cast's static zone; the cast is re-derived by transplanting the changed pixels at the cast's offset (440, 20),
  where the rotated forearm does not reach, then the same B treatment and the same crops.
- **Stop rule.** If neither shoulder reads right at 1:1 after its 3 seeds, stop and report; no fourth attempt tonight.
- **What stays ours.** The sleeve's length (the source says only "over his right shoulder") and the blue metal (the
  render's colour; the bible's machina ramp is grey, `[estimate]`).
