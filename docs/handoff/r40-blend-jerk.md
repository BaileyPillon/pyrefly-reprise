# r40-blend-jerk: what the stepped dissolve costs the CHK-027 jerk reading (FB-2, P2-A; disclosure)

Date 2026-10-11. Written by the r40-int fixer for the release driver; branch `r40-int`. No browser, no server, no Playwright was used: every number below is the REAL
`PaintedActor` and the harness's own `figureTrack` / `detectJerks` with `critic/policy.json`'s thresholds, read in vitest. Nothing here has been looked at on a screen.

**Game case (rule 14): both games, one shape.** The stepped dissolve is the actor's shape for every pose change in both games (the sources give no blend length or
shape in either). Nothing in this note is FFX-only or FFX-2-only; FFX shows the attack key chain worse because its hit-stop is longer.

## The finding, confirmed

The integration review said: FB-2's stepped dissolve (`PoseBlend.STEPPED_DISSOLVE`, `PaintedActor` ~695 `new PoseBlend(this.slots, poseBlendShape())`) moves the weight
between the two paintings in one frame at its step (fades 1.00 / 0.21 to 0.29 / 0.71), so the harness's tracked head and feet, which are the FADE-WEIGHTED mean of the
planes that show (`continuity-pure.mjs` `figureTrack`), jump about twice as far in one frame as under the plain dissolve. CHK-027 then reads more jerks at pose swaps than
the live build, where plan section 4 expected the count to fall.

**Confirmed.** Re-run in this tree with the review's own probe (`D:/Tools/pyrefly-scratch/2026-10-10/r40-int-review-correctness/stepjerk2.probe.ts`) and then
committed as a test (`tests/unit/engine/pose-blend-jerk.test.ts`). 8 characters (Tidus, Auron, Kimahri, Lulu, Rikku, Wakka, Yuna, Paine's Warrior), 60 fps, 120 ms blend,
the production-like camera (7.7 up, 9.9 back):

| Set | Pairs | Jerk events, stepped | plain (`?poseblend=legacy`) | Pairs with a single-frame step of 40 px or more, stepped | plain |
|---|---|---|---|---|---|
| Every ordered pair of idle, ready, attack, follow, hurt, cast, defend, victory, item | 560 | 260 | 10 | 78 | 0 |
| The 64 key-chain and hurt pairs (the committed test) | 64 | 38 | 2 | 15 | 0 |

The biggest single-frame step is 2.06 times the plain one's on average over the 64 pairs (2.23 at the most). The review's attack chain (ready to attack, follow 83 ms later,
40 ms hit-stop) reads at least one jerk event for 6 of 8 characters (worst 46 px) against none under the plain dissolve.

## It is not a code bug, and it cannot be spread

It is P2-A as Bailey picked it. And the step cannot be softened inside the shape: with the lesser painting capped at 0.30 and the body never thinning (the two fades add to
at least 1; `pose-blend-composite.test.ts` reads the pixels and finds the covered share never under 0.79), the pair of fades is always in one of two regions, the old painting
whole (out at least 0.70, in at most 0.30) or the new one (out at most 0.30, in at least 0.70). For a cap under one half they do not touch, so going from one to the other is
a jump of at least 1 - 2 x 0.30 = 0.40 of a painting in one frame, at any frame rate (`pose-blend-jerk.test.ts` holds this at 30, 60, 120 and 144 fps and 400 phases each).
The finding's option (b), spreading the step over two or three frames, would put both paintings over the cap (a double image above the check's 0.40) or thin the body (a
see-through dip). That is the ghost the shape exists to remove.

## What was done, and what was not

Done: option (a), ship it and say so. The test above pins the disclosed consequence both ways (the stepped dissolve reads more, by a bounded amount; the plain dissolve reads
none at 40 px; so a change that makes it worse fails and a change that makes it better has to say so), the `PoseBlend.ts` header says it next to the shape, and this note and the
release text below carry it.

Not done, and why:
- **(b) Spreading the step, or shortening its jump.** A look change to a shape Bailey picked from loops on the options page, and that page said nothing about the harness's
  jerk reading. Rule 9 and rule 10: options first, his word, then a build. Measured for him, with the real actor, by raising the cap only (the one lever the arithmetic
  leaves; the step stays one frame, the jump shrinks to 1 - 2 x cap): cap 0.30 (now) 78 of 560 pairs at 40 px or more and 260 jerk events; cap 0.35: 32 and 198; cap 0.39: 18
  and 148; the plain dissolve 0 and 10. The ghost severity bound is cap x (1 - IoU), so 0.39 still cannot reach the check's 0.40 at any overlap, but the lesser painting
  then shows at 0.39 instead of 0.30, which is a different picture from the loops he saw. Probe: `D:/Tools/pyrefly-scratch/2026-10-10/r40-int-fixer/capvariants.probe.ts`
  (scratch; it mutates `STEPPED_DISSOLVE` at run time, nothing in the tree).
- **(c) Teaching `figureTrack` to follow the dominant plane across a stepped blend. Refuted by measurement.** Following the plane with the larger fade makes the track jump
  by the whole displacement between the two paintings at the moment the dominant plane changes: 297 of 560 pairs step 40 px or more, 424 jerk events, and the stepped and the
  plain dissolve read alike (297 and 424 against 297 and 423). It would not make FB-2 look better; it would make every pose change read as a jerk. The fade-weighted track is the
  fairer reading, and it is the instrument Bailey owns (D-420 to D-426), so no edit was made. The three r40 instrument edits (P5) are untouched.

## For the release notes (both games)

"Pose changes between paintings that barely overlap no longer show two half-strength bodies: the new painting comes up under the old one, the two trade at a step, and the
old one goes out. The cost is on the critic's side: the continuity check CHK-027 reads that step as a small jump of the tracked head and feet at pose swaps (about twice the
size of the plain dissolve's per-frame move, 15 of 64 key-chain and hurt pairs above 40 px against none), so its jerk count at swaps rises while its double-image count falls
from 161 swaps to none by construction (the cap bounds it; the focused review is to confirm it). `?poseblend=legacy` plays the old dissolve for a same-build A/B."

Plan section 4's expectation ("the jerk count falls") does not hold for the swaps with FB-2 on; the knock-back (FC-1) and the KO (FA-1 to FA-3) are what are built to move it down, unmeasured on the harness yet. The sub-score caps
hang on CHK-026 and on snaps per minute (`critic/RUBRIC.md` 6a), not on CHK-027 jerks, so this does not bring a cap back; the deep review should read the strips (it is the composite
the eye sees, which the harness does not read) before it scores the animation sub-score.

## The question for Bailey (one, with the numbers above)

"The stepped dissolve you picked removes the double image (161 swaps to none, by construction) but the critic reads its one-frame step as a jump, about twice the plain dissolve's (15 of 64 attack-chain
and hurt pairs above 40 px against none). Keep it as it is (the default), raise the lesser painting's cap from 0.30 to 0.39 so the step is smaller (a different picture from the loops
you saw: I would show you new loops first), or go back to the plain dissolve (the double image returns on 161 swaps)?" Until he answers, FB-2 stays as picked.

Suggested ledger text for the driver (not edited here: the ledgers are the driver's): an OPEN decision row "P2-A's jerk cost (FB-2): keep / raise cap / plain", with this file as
its evidence, and an action row for this fix (a test, a comment, this note; no engine change).
