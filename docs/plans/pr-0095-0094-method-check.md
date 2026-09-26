# PR-0095 and PR-0094 method check (rule 15): Vegnagun's parts at links 3 and 4

Written 2026-09-26, paper only. **Game case: FFX-2 only** (Chapter V, Vegnagun; D-044). The two
issues ship together in one Chapter V capture: PR-0095 is batch 2's (`src/engine/PartAnchors.ts`,
the stage), PR-0094 is batch 3's (`src/ui/ffx2/**`).

## The issues as the critic measures them

- **PR-0095** (major since round 09, re-scoped three times): at the link-3 first menu no ring or
  plate shows on either painted foreleg although both BULWARK bars are listed; at link 4 no ring on
  either tusk. Expected: D-044's C\* rings (and names) on the parent paintings. Acceptance: link 3
  and 4 first menus at 1600 and 2000 show a ring and a plate on each part, unoccluded.
- **PR-0094** (major since round 09, narrowed to link 4 in round 12): the "RIGHT REDOUBT / No action"
  intent card sits on the head painting. Acceptance: the link-4 card box does not intersect the head
  quad at 1600 or 2000.

## Why they stalled

- PR-0095: `49789dd6` built the rings (`PartRings`: violet `0xc8a0ff`, additive, `depthTest:
  false`, opacity 0.62 while the part lives). `04681f5c` then moved the Body so the Left Bulwark's
  ring cleared the command window; `5be4babe` reverted it before release 15 (formation repair),
  so the fix was never live. Every later round judged frames by eye. Nobody has read
  `partRingSnapshot()` on a shipped build, so it is unknown whether the rings are **not there**,
  **there but off-screen or under the command window**, or **there and unreadable** (a violet
  additive ring over pale painted steel adds little).
- PR-0094: the round-11 and round-12 fixes asked for "a per-link anchor as in links 2 and 3". There
  is no per-link rule to mirror. The slab is placed by a solver (`src/ui/ffx2/intentPlacement.ts`,
  `intentBoard.ts`) where fighters are **soft** obstacles ranked below HUD chrome, and each fighter's
  box is synthetic: the projected head-to-feet span with a half-width of `BODY_HALF_WIDTH = 0.28`
  of that height, "deliberately narrow for a spread dragon". The acting Redoubt is a figure-less
  part anchored *on* the head painting, so the slab's natural spot (above the actor's head) is on
  the painting, and the head's own box is far narrower than the painting. Link 3 was fixed by
  moving the Body, not by a rule.

## Alternatives

- PR-0095: (1) rings present and off-screen or covered: move the anchors or the Body back to
  04681f5c's option-C spot; (2) present and unreadable: raise contrast (normal blending, a dark
  outline, a thicker band) to the C\* mock's look; (3) not added (anchor mode not `onParent`, or the
  parent not resolved at that link): fix the wiring. The plates are the second half: the wiring
  plan (`docs/plans/vegnagun-parts-wiring.md` §3) says whatever names a ring sits away from
  `.ffx2hud__command`, but whether a plate is **always on** or only while the part is targeted is
  not written in D-044; build to the C\* mock, which shows the name beside each ring.
- PR-0094: (a) give the solver the head actor's real projected quad (`stage.projectRect`, the
  silhouette rect the FFX-2 target cursor already uses) instead of the narrow synthetic box, so a
  free spot off the painting wins; (b) a hard per-link anchor for link 4 (the plan's wording).
  (a) fixes the class, (b) fixes one frame and breaks when framing moves again.

## The smallest tests that tell them apart

- **PR-0095, live, read-only:** a production build, seed pinned (after PR-0202), real keys to the
  link-3 and link-4 first menus at 1600x900 and 2000x1012. Read
  `__pyrefly.battle().stage.partRingSnapshot()` (id, visible, opacity, position), project each
  ring's position to screen, and intersect it with `.ffx2hud__command`'s box.
  `tools/zz-eng-veg.tmp.mjs` (another agent's scratch, dev server) already does most of this; port
  it to the production preview. Missing ids = (3); visible with the point off-frame or inside the
  command box = (1); visible, on-screen and clear = (2).
- **PR-0094, unit:** feed `solveSlab` the link-4 inputs recorded by the same run (obstacles, the
  acting Redoubt's head point, the head actor's `projectRect`) twice, once with the synthetic head
  box and once with the real quad. If the second finds a spot clear of the quad and the chrome, (a)
  is the fix; if not, the frame has no room and the answer is framing, which is PR-0095's Body spot.

## Recommendation

**Small probe first, then change method for PR-0094.** Run the live ring read and the recorded
solver replay before any code. Build PR-0095 as the probe points (the contrast fix is class A to the
approved C\* look; moving the Body back is restoring 04681f5c's picked spot). Build PR-0094 as
alternative (a) in batch 3, with a unit test that has the head quad as an obstacle at 1600 and
2000. One Chapter V capture closes both.
