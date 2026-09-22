# Living-portrait v2 — fix pass (2026-09-22, Sonnet, attempt 3)

Commit `98ff595` (not pushed). Owner of this pass:
`docs/concepts/pause-until-dawn/prototype-v2/**`, `tools/gen/inpaint.mjs`,
plus two new tools it added (`tools/gen/defringe-layer.mjs`,
`tools/gen/fillhole-fix.mjs`).

## What this pass was answering

An adversarial measurement refuted the previous pass's own claim of having
found and fixed the frontal z-order/cross-dissolve seam: a severe,
hard-edged double-exposure was found at every sampled yaw away from dead
centre, including inside the bracket the previous pass said it had fixed,
and in that pass's own committed "clean" stills.

## What was actually wrong (three bugs, not one) and what's fixed

Full root-cause writeup, before/after evidence and honest "still not fixed"
accounting: `docs/concepts/pause-until-dawn/prototype-v2/README.md`, Part 4
("the fix pass"). Short version:

1. A duplicate, un-scoped gap-mitigation draw of frontal's own headCore/
   hairFront (fixed — `renderer.ts`, `frontalInBracket`).
2. Every placed sub-quad fed its own local texture UV into a head-mask
   shader built for canvas-space UV (fixed — `uUVBox` uniform,
   `shaders.ts`/`renderer.ts`).
3. **The actual dominant cause**: textures were uploaded premultiplied
   against a straight-alpha shader/blend pipeline, darkening every soft
   cut edge by alpha² instead of alpha (fixed — `gl-utils.ts`, one flag).
4. Found while isolating the remaining eye-region artifact, not in the
   original refutation: `eyeApertureL/R.filled.png`'s "iris hole filled
   from neighbouring sclera pixels" had corrupted RGB in a rectangular
   region, from the original `rig-cut.py fillhole` run, not the cut itself.
   Fixed with a new tool, `tools/gen/fillhole-fix.mjs`, which rebuilds the
   filled file's colour from its still-correct un-filled sibling only.

Also: wired `PortraitStateMachine.chestSway()` (existed, tested, never
called — AGENTS.md hard rule 4) into the renderer; tapered idle yaw sway
near the hard stop (a wobble-against-the-wall finding); eased the
cross-dissolve blend weight with `smootherstep`.

## Still not fixed, disclosed again (art-pipeline gaps, not runtime bugs)

- No real per-triangle mesh warp — Part 2's own risk/time call, re-confirmed
  this pass by measuring what its absence actually costs.
- No hidden-region art for `q34-left`/`q34-right`/`profile-left` — the
  gap-mitigation fill-in still shows through more than a thin edge there.
- `profile-right`, the `eyes/closed` identity miss, brow patches: untouched.

## Verification

`npx tsc --noEmit` clean. Full `npm test`: 226 files / 5357 tests green
(6 new tests this pass, `pause-living-portrait-state.test.ts`). All 10
required stills and both clips (`shots/`) re-rendered against the fixed
runtime and looked at 1:1; a capture-script race of this pass's own (stale
residual read right after a fresh `setGaze`) was found and fixed the same
way — caught because the first `02-three-quarter-left.png` came out dead
centre. `public/art/portraits/yuna-x2.png` and
`docs/target/approved-hashes.json` are untouched.

## Next, if this track continues

1. The mesh warp itself (the actual fix for the remaining cross-dissolve
   ghosting) — sizeable, needs a paper preflight per AGENTS.md rule 15.
2. Hidden-region art for the three non-frontal keys (art-pipeline task).
3. `docs/concepts/pause-until-dawn/prototype-v2/src/renderer.ts` is 788
   lines — was already over the 400-line house limit (659) before this
   pass and this pass added to it fixing real bugs; a low-risk mechanical
   split (e.g. the frontal-stack draw helpers into their own module) is
   worth doing before the next round of changes there, but was not
   attempted here given the risk of touching working WebGL code again
   right after landing these fixes.
