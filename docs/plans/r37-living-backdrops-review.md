# r37-living-backdrops: paper preflight (AGENTS.md rule 15)

Branch `r37-living-backdrops` from `origin/main` d154486c, worktree `D:/pyrefly-iter2-spellfx`.
Item A-7 "Backdrops with a floor and a sky" (Bailey, 2026-09-19, one of the 12 polish ideas; targets.json
group "Polish ideas: the 12 you picked"; approved mock `docs/concepts/polish/living-backdrops/`).
`node tools/critic-plan.mjs --paths` classes the change **deep after deploy** (focused before): this is the
paper preflight it asks for. It is not save-data class (no `SaveData.ts`, no schema, no settings key).

## What the approved target is, and what main already has

The mock (`strip.png`, `after.png`, `work/*.py`) moves exactly this:

| What moves in the mock | State on main before this branch |
|---|---|
| one painting split into five plates, each plate's hidden paint filled back in | built (option B1, `fx/b/DepthPlates.ts`, push-pull fill, four plates) for Gagazet, Macalania, Bevelle, Djose only |
| a small pan budget (about +/-34 px on the nearest plate), plates sliding at their own depth, pushed in and tilted | built (option B2, `CameraDrift.ts`, about +/-45 px) for the same four rooms |
| snow at depth, near-lens out-of-focus flakes | built for Gagazet (B3 fields); other rooms' air is the A-6 canon table's call |
| the lens focused on the party's plate: far ridge and sky soft, the focus plate sharp | **not built** (the cinema pass only re-aims a screen-space tilt-shift band) |
| the other backdrops | **not built**: eleven rooms have no depth map, no plates, no drift |
| a foreground snow plate in front of the party, defocused | not built, see "Left out" |

So this branch builds the two missing parts: **the plate defocus** and **plates for the far-backdrop rooms**.

## Game case (rule 14)

- Defocus: both. Shared plumbing; FFX drifts at the tuned periods and FFX-2 at 0.8 of them (ATB pace, B2's rule).
- Rooms: each room is its own game's. FFX: Zanarkand Dome (II), Dream's End (III), the Garden of Pain (XII).
  FFX-2: Leblanc's room (VI), the Via Infinito (XIII), the Den of Woe (XV).
  Nothing is copied across games: no mirror of any painting, no shared recipe beyond the plate rule.

## Method

1. **Defocus is a sampling choice.** Each upright plate's own `map_fragment` samples with a mip bias
   (`PlateFocus.ts`, the method of option A4's `BackdropFocus`): no extra pass, no cut-out halo round the figures
   (visual-bible 6.4), no change to any painted pixel. Bias per plate = (inverse-distance difference to the focus
   plate, to the mock's 0.85 power) x weight x the room's cap (2.2 mip levels, about 2 to 3 px at 1600 wide).
2. **The resting frame stays the approved painting.** The weight follows how far the drift has carried the camera
   off rest and is exactly 0 at rest, on every non-idle rig (the drift is cut there), under REDUCE MOTION (no drift)
   and under LOW EFFECTS. At weight 0 the shader samples as before (bias 0).
3. **Plates-only rooms** (`RoomSpec.platesOnly`): the plates, the drift and the defocus, and nothing else. No lamps,
   weather, haze, cast shadows or sway: what floats in a room is A-6's canon table, and sway/shadow are other
   looks. Each room's depth map is `tools/fx/depth.py` (Depth Anything V2 Small, already on D:, CPU), shrunk to 8 bits
   (`tools/fx/depth8.py`: the game reads 8 bits through a canvas) so the 7 rooms cost about 2 MB of the 800 MB line,
   not about 7 MB.
4. **Seam and switches.** Behind the LIVING PAINTINGS row (`eyeCandyOn('livingPaintings')`) and option B's switch;
   `?fxsub=-focus` and the `focus` dial for tests; phone tier 0.8 of the strength, LOW EFFECTS none (the flat fallback),
   REDUCE MOTION none. No new EYE CANDY row and no settings key (so no save-data class).

## What could go wrong, and the check

| Risk | Check |
|---|---|
| a plate edge shows invented paint when the camera is far out (the card's own risk note) | a pinned extreme frame per room, plates on vs plates off, and a crop of the worst edge |
| a room's plate stack is not the painting at rest | `compositeAtRest` identity test (existing, 1 level) plus a pixel diff of the real frame at rest, plates on vs off |
| the defocus is overdone | the cap is per room (`RoomSpec.focus.max`) and a side-by-side crop is in the handoff |
| frame cost | a bias is a texture-LOD choice, not a pass; measured before and after on desktop |
| a plate in front of a figure | plates draw before the figures and stand at least 12 units behind the back row (test) |
| a room whose scene swaps its backdrop or stands the painting near the camera | not listed: those rooms (Cavern IX, Highbridge X, Via Purifico XIV) place the painting 12 to 20 units out with a projected floor; they need their own `floor` recipe and are left for a later pass |

## Left out on purpose

- The mock's foreground snow bank in front of the party, defocused over the lowest rows: no plate stands in front of
  the figures anywhere in option B (plates draw before them), and a plate drawn after them would cover their feet.
  It needs a depth-ordering decision and a look Bailey should see first.
- The Farplane (V): `farplane-colossus.ts` grows and lifts the painting meshes during the colossus links, which plates cut once at load do not follow (plate stack 230 px off the painting at the drift extreme).
- Evrae's deck (a rolled painting with swapped plates), the Road to the Farplane (two plates swapped per link) and
  the three near-painting rooms above.
