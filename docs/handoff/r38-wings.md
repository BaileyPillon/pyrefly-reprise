# r38-wings: the painted plate wings draw in Chapters IV and XV (D-343; release 38 material)

Date 2026-10-04. Branch `r38-wings` (from `origin/main` 54e44c23), pushed to `origin/r38-wings`; **not merged, not deployed**. Built by a Sonnet
sub-agent of the driver session as the code half of the art install ([art-install-2026-10-04.md](art-install-2026-10-04.md) on main, which put the four wing
paintings in `public/art/backdrops/wings/`).

**Bailey's words** (2026-10-03 ~12:00 EDT, "all your recommendations, godspeed", the morning page, ask 8 = **D-343**): painted plate wings, Den of Woe left
candidate 1 plus right candidate 3, Bevelle Underground left candidate 3 plus right candidate 1, replacing the mirrored wings.

**Game case (rule 14): FFX-2 only.** The Den of Woe is Chapter XV's plate and the Bevelle Underground plate is Chapter IV's. **Chapter XIII does not show
it**: Chapter XIII ships `sceneKey: 'via-infinito'` (the Cloister 100 scene, `chapter-trema-ship.ts`), which draws no Bevelle plate and no wings; the plate-wing
candidates' README ("Chapters IV and XIII") and the `bevelle-underground.ts` comment name XIII from the older placeholder `sceneKey` of `chapter-ffx2-trema.ts`.
No FFX chapter and no FF7 fight draws either plate. critic-plan class: not run by me (a scene change; the driver's plan decides).

## What it is

`scenes/plateWings.ts` made each mirrored wing a strip of the plate's outer edge reflected out 18 units. The painted wings are strips of the plate's own
painting, outpainted in the plate's own prompt and palette (the candidates' README): 646 px (Den) and 716 px (Bevelle) wide at the plate's 1536 px height, the
wing proper (550 and 620 px, 18 world units) plus **96 px laid over the plate's own outer edge with the alpha ramping across it**. The plate is untouched
and keeps its approved hash.

- `paintPlateWings(backdrop, spec, load?)` (new, `plateWings.ts`): after `addPlateWings`, swaps each mirrored strip for the painted one **in place**: new
  geometry (`plane width * stripPx / plateWidthPx`), a clone of the plate's own material with the painted texture and `transparent`, the same side, depth and
  z, render order plate + 1, x so that the strip's inner edge lies `overlapPx` inside the plate's edge. Its outer edge lands within 0.01 world units of the
  mirrored wing's (Den 18.006, Bevelle 17.991 of 18), so every window the wings covered stays covered.
- Fails closed: a strip whose file is missing (`load` resolves null), a backdrop torn down while the strip loads (the texture is freed), a plate that is itself
  a placeholder (the unit suites' scenes: nothing to join, and no image decode to wait on), and a spec with no `painted` entry all keep today's mirrored wing.
- `Backdrop.adoptTexture(tex)` (new, 3 lines): the backdrop disposes the strip's texture with the rest.
- `WingSpec.painted` (new, optional): the two art paths and the pixel numbers. `DEN_PLATE_WINGS` and `BEVELLE_PLATE_WINGS` carry them
  (`art/backdrops/wings/<plate>-left.png` / `-right.png`); each scene calls `await paintPlateWings(...)` after `addPlateWings` at both build sites (the first
  build and the dev hot-swap).

## Checks (all on the 2026-10-04 run)

- `tsc --noEmit` clean; `tests/unit/plate-wings.test.ts` 14 tests (7 new): geometry of both plates and both sides against the spec's own numbers, the painted
  strips' real extent still covers every rig at 1.5, 16:9, 2000x1012 and 2560x1080 (the `plateEdges` maths with the strips' extent), a missing side keeps
  its mirrored wing, no `painted` or no painting mesh does nothing, a placeholder plate loads nothing, a teardown mid-load frees the texture, and the strips'
  PNG sizes equal the spec's (skipped where `public/art` is absent). `den-of-woe-ship-scene`, `backdrop-palette-ground`, `den-of-woe-look`, `art-url-sources`
  pass. The full suite on this branch is recorded in the main handoff.
- **In the real game** (headless GPU Chromium from node, code-only production builds of main and of this branch served over the same `public/art`; never the
  built-in pane): Chapters IV (`ffx2-bahamut`) and XV (`ffx2-den-of-woe`) at 1600x900, 2000x1012 and 2560x1080, every rig of the scene (`intro`, `idle`,
  `action`, `victory`): the live camera projects the wings' **outer edges outside the frame on both sides in 24 of 24 rig-and-window cases** (right edge at
  NDC 1.06 to 3.30, left edge at -1.01 to -2.91, two runs; the second on the final code for Chapter XV; the plate alone ends short of the right edge, at NDC 0.73 to 0.99, at the intro and action rigs of the two
  wide windows: the PR-0300 band), the painted strips load with HTTP 200, 0 console errors, 0 missing files. Chapter XIII at 2000x1012 and 2560x1080 requests
  no wing (its scene is Cloister 100).
- **What it looks like**, before (mirrored, main) and after (painted), `docs/screenshots/art-install-2026-10-04/wings-*.jpg` on main: the mirrored wings' doubled
  shape is gone (the Den's chevron, the doubled orb, Bevelle's heart-shaped lamp pair); both edges read as a continuation of the plate.

## Disclosures

- **A faint join is still visible at some rigs, as it was with the mirrored wings.** The plate is drawn by the eye-candy B plates (`fx-b-plate-0..3`, depth
  slices at nearer z) in the default build; their own right and left edges move relative to the plate by parallax, and where a slice ends the full painted wing
  beneath shows a tonal step and, at the enemy rig of the Den, a thin dark vertical line. Probed in the page by hiding meshes: with the slices hidden the thin line is
  gone, and the base plate (`fx-b-plate-0`, which carries only the far band; the nearer bands are the slices) then reads darker than its wings, because each wing
  is the whole painting; so the step is the slices' composition against a whole-painting wing, not the painted strip's own 96 px blend. The mirrored wing showed
  the same line at the mirror axis. Slicing the wings the same way is not built and is an eye-candy option B change.
- The strips' left candidate for Bevelle (cand 3) keeps the left edge dark and restrained and the right (cand 1) finishes the cut-off lamp as machinery
  (the README's picks); the README's flaws list stands (soft lamp, ESRGAN crispness at the seam, the Den's extra glow orbs).
- The four paintings are **local art** (`public/art` is not in git): this branch does nothing until the install the main handoff records is in the tree it
  runs on, and with the files absent every wing stays mirrored (tested).
- Not run: phone sizes, the FFX-2 pause or cutscene screens that draw the plate (they use the plate alone, not the scene's wings).

## Files

`src/scenes/plateWings.ts`, `src/scenes/den-of-woe.ts`, `src/scenes/bevelle-underground.ts`, `src/engine/Backdrop.ts`, `tests/unit/plate-wings.test.ts`,
`docs/handoff/r38-wings.md`.
