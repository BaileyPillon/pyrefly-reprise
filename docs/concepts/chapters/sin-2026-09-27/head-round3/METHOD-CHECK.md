# Sin's head, method check before round 3 (FFX only, 2026-09-27)

AGENTS.md rule 15: two reviews have left the same issue open, so this check comes before a third try. The issue
is the same both times: **the five clock stages do not read as one creature whose mouth opens.**

## The route so far, and why it stalled

| Round | Route | What the judge found |
|---|---|---|
| 1 (`../head-pilot/`) | Four looks from code-drawn sketches. For look C, the lower jaw was cut out of one painting, turned about a hinge and the seams healed by img2img | The mouth stages did not read. There was no tower and there were no wings. The deck was generic |
| 2 (`../head-round2/`) | One stage-0 painting. Each open stage is a **masked img2img repaint** (denoise 0.62, mask grown 41 px and then 9 px) from that stage's own sketch | An invented chapel complex stood on Sin's head and back. The tower was a squat drum cut off by the frame edge. The right wing merged into the neck, and the left wing was semi-transparent. The deck changed between stages. The head's surface (plates, rivets, jaw colour) changed between stages outside the mouth. The mouth interiors read as built structures (ladders, banners, curtains). The snout tip was pink |

**Why it stalled.** Both rounds asked the diffusion model to paint the moving part again for every stage. Each
repaint is a new painting of that part:
- The jaw's plates and colour change from stage to stage.
- The model fills an empty dark mouth with whatever structure it likes.
- A mask wide enough to hide the seams also repaints the skin and the deck around them.

The other faults came from the words and the sketch, not from the route:
- The chapel came from "ruined stone buildings on the back of its head" in the prompt and from a row of ruins
  in the sketch.
- The squat, cut-off tower came from the sketch.

A third round of per-stage repaints would change the words and still keep the cause.

## Two alternatives

**A. A layered rig.** Paint the creature **once**, with the mouth fully open, so the lower jaw, both rows of
teeth and the throat are each painted exactly once. Cut that painting into layers designed to move:
- a background plate: sky, city and tower
- wings, body, arm and claw
- the throat interior (dark, organic)
- the lower jaw, drawn whole with its hinge
- the skull and upper jaw
- the deck, a fixed top layer cut from the plate

Each clock stage is **the same layers with only the jaw turned about its hinge**, as the engine would do it. Every
surface except the jaw's position is identical in all five stages by construction, and the deck cannot change.

**B. One master painting with strictly masked inpaints.** Keep round 2's route but tighten it:
- a mask limited to the mouth
- a low denoise
- fixed seeds
- a hard paste back of every pixel outside the mask

## The smallest test that tells them apart (run 2026-09-27; images `src/method_test.py`, `frames/method-test.jpg`)

Both tests start from round 2's own paintings, so they cost at most one GPU job.

**Test A.** Round 2's stage-4 painting was cut into skull, throat and jaw along round 2's sketch geometry. Only
the jaw was turned back to 0, 6, 12, 18 and 24 degrees, over round 2's stage-0 painting.
- **No GPU used.**
- **Result:** the jaw reads as the same jaw at every angle, with the same plates, colour and teeth, and nothing
  outside the jaw's path changes.
- **The faults are all at layer boundaries:**
  - The painted maw extended below the sketch's lower lip, so a static strip of throat showed under the closed jaw.
  - The lower teeth did not tuck behind the upper lip at 0 degrees.
  - Round 2's stage-0 jaw showed through as a ghost under the turned jaw.
- These boundaries are exactly what a rig designs for: a plate with no creature, masks taken from the painting
  itself, and a shut angle fitted by eye.

**Test B.** Round 2's stage-2 sketch composite, repainted at **denoise 0.40** inside a **tight** mask (the sketch
difference grown 7 px, not 41 + 9), with one ComfyUI job of 60 s.
- **Result:** the jaw stayed the flat pasted sketch jaw. It was grey and smooth, with none of the stage-0 plates.
  The mouth became a mottled dark blob.
- 3.2 % of the pixels **outside** the mask still changed (the VAE round trip), so a hard paste back is needed
  anyway.
- At round 2's 0.62 the jaw is painterly, but its plates, colour and interior differ in every stage.
- **With B, a stage can be consistent or painted, not both.**

## Choice: A, the layered rig

A is the only route where "the head's surface stays the same between stages" and "the deck is identical" hold
**by construction** rather than by luck. It is also how the engine can show the clock: one set of layers, one jaw
angle per stage, and a tween between stages for free. Its costs are known and small:
- one plate render and one creature render, each with a handful of seeds, instead of four stage repaints
- careful sketch geometry: a cheek that overlaps the hinge, sky under the jaw, the lower lip drawn so that turning
  it by the open angle closes it
- a shut angle fitted by eye

Round 3 also fixes the words and the sketch:
- no buildings anywhere on Sin
- a tall white tower whose whole height is in the frame under the claw
- two opaque wings, each growing from its own shoulder joint
- a dark organic throat with a tongue and no ribs, bars or folds
- a snout the same grey as the head
