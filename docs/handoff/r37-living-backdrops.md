# r37-living-backdrops: A-7 "Backdrops with a floor and a sky"

Branch `r37-living-backdrops` from `origin/main` d154486c, worktree `D:/pyrefly-iter2-spellfx`. Pushed, not merged,
not deployed. Not touched: `docs/handoff/NOW.md`, `docs/target/decisions.json`, `targets.json`, `public/art`,
`approved-hashes.json`, `src/engine/fx/mix/`, the camera-lab grammar. Paper preflight:
`docs/plans/r37-living-backdrops-review.md` (written first, as rule 15 asks for a deep-class change).

**Game case (rule 14): both.** The defocus is shared plumbing; each room is its own game's (FFX rooms drift at the
tuned periods, FFX-2 rooms at 0.8 of them). Nothing is copied across games, no painting is mirrored.

## What the approved target moves, and what was already on main

Target: `docs/concepts/polish/living-backdrops/` (`strip.png`, `after.png`, `work/*.py`). The key finding: main already
had most of it, built as option B "Living Paintings" (depth plates from a derived depth map with push-pull fill, the arcing
camera drift, near-lens flakes) for four rooms only (Gagazet, Macalania, Bevelle, Djose). The A-7 backlog line "never built"
is true of two parts, which this branch builds:

| Target part | Before | After |
|---|---|---|
| five plates, hidden paint filled back in | 4 rooms | + 8 rooms (below) |
| small pan budget, plates sliding at their own depth | 4 rooms (about +/-45 px) | + 8 rooms |
| near-lens out-of-focus flakes | Gagazet only (B3 fields; other rooms' air is the A-6 canon table's call) | unchanged |
| lens focused on the party's plate: far ridge and sky soft, the focus plate sharp | **not built** (the cinema pass only re-aims a screen-space band) | **built, every room with plates** |
| foreground snow bank in front of the party | not built | **not built** (see "For Bailey") |

## Items

### A-7a  Plate defocus aimed at the party's plate (both games)
- **What changed.** `src/engine/fx/b/PlateFocus.ts` (the three.js half), `focusMaths.ts` (pure): each upright plate
  samples its own mip chain with a bias in its own `map_fragment` (the method of A4's `BackdropFocus`, which never sees
  plates). Amount per plate = inverse-distance difference to the focus plate (the nearest upright plate), to the mock's 0.85
  power; weight follows how far the drift has carried the camera off rest; cap 3 mip levels (about 3 to 4 px at 1600 wide;
  chosen by looking at dial 1, 1.5 and 2.2 against `after.png`). `RoomSpec.focus` can override the focus plate and cap per room.
- **Resting frame is the painting.** The weight is exactly 0 at rest, on every non-idle rig (the drift is cut there), under
  REDUCE MOTION and under LOW EFFECTS; at 0 the shader samples as before.
- **Seam and switches.** Gated by the LIVING PAINTINGS row (`eyeCandyOn('livingPaintings')`) and option B's switch;
  `?fxsub=-focus`; new `focus` dial (`FX_DIALS`, additive); phone tier 0.8 of the strength. No new EYE CANDY row, no settings key.
  Debug: `__pyrefly.fx.b.pin(t)` holds the room's drift clock (captures).
- **Proof.** `tests/unit/fx-b-focus.test.ts` (22 tests). Real engine, headless GPU (`PYREFLY_BROWSER=gpu`), clock pinned at the
  drift extreme, same frame defocus ON vs OFF in one page: `docs/screenshots/r37-living-backdrops/ffx-gagazet-target-vs-build.jpg`
  (target `after.png` | OFF | ON) and `ffx-gagazet-crop-off-vs-on.jpg`; FFX-2: `ffx2-bahamut-bevelle-off-vs-on.jpg`,
  `ffx2-leblanc-off-vs-on.jpg`, `ffx2-den-of-woe-off-vs-on.jpg`; each new FFX room has its own pair.
  Clips (frames of the drift's half cycle, a time-lapse of about 5x, 24 frames, plus an animated WebP forward and back):
  `clip-ffx-gagazet-strip.jpg` / `.webp`, `clip-ffx2-leblanc-strip.jpg` / `.webp`.
- **Honest distance from the target.** The target's whole backdrop is softer and brighter than ours at the extreme, and its
  foreground snow bank is blurred; ours blurs the plates behind the party only, so the far ridge, the sky and the moon go soft
  and the near rocks stay sharp. At dial 1.5 (cap 4.5) it is closer to the target's softness, still legible; the default is 3.
- **Frame cost (desktop, 1600x900, real GPU, vsync unlocked, clock pinned at the extreme, 12 alternating OFF/ON rounds in one
  page, median of the rounds' mean frame time).** Gagazet defocus OFF 1.87 ms, ON 1.89 ms (p95 2.6 / 2.7). Leblanc defocus
  OFF 1.83, ON 1.74. Leblanc plates OFF 2.02, ON 1.88. Dream's End plates OFF 2.41, ON 2.53 (p99 4.9 / 7.2). An earlier run on
  a busier machine read Gagazet 2.38 / 2.62: the two runs bracket the noise. Nothing added is a pass.
- **critic-plan class.** DEEP after deploy, FOCUSED before. Not the save-data class.
- **Left.** Nothing in this part.

### A-7b  Plates, drift and defocus for eight more rooms (FFX and FFX-2 each their own)
- **What changed.** `RoomSpec.platesOnly` (the plates, the drift and the defocus; no lamps, weather, haze, cast shadows or sway,
  because what floats in a room is A-6's canon table and shadow and sway are other looks) and `ambient/plateRooms.ts`:
  - FFX: Zanarkand Dome (II; drift at 0.5x, `RoomSpec.drift`, because its nearest plate is a column the size of a quarter of the frame and the fill shows where it slides; its top threshold 0.44 keeps that column in one plate; a faint horizontal seam from the scene's own 3D water plane still shows at the extremes, plates or not), Dream's End (III), the Garden of Pain (XII), Via Purifico (XIV; the painting stands at -20 like
    Macalania's, so it takes Macalania's plate z).
  - FFX-2: the Farplane (V), Leblanc's last room (VI), the Via Infinito (XIII), the Den of Woe (XV).
  - Flat under LOW EFFECTS (`roomPlays`): no plates, no drift, today's painting. The older four rooms keep option B's own low tier.
  - Depth maps: `tools/fx/depth.py` (Depth Anything V2 Small, already on D:, CPU) then `tools/fx/depth8.py`: 8 bits (the game
    reads 8 bits through a canvas), **40 to 117 KB each, 0.6 MB for the eight**, listed in `tools/fx/fx-assets.json` (24 files
    now) and copied to `D:/Tools/pyrefly-art-backup/fx` (copies only; `node tools/fx-assets.mjs ensure` restores them).
  - `DriftRig.ts`: option B's camera drift moved out of `LivingPaintings.ts` unchanged (file size, rule 7).
  - `DepthPlates.follow` + `focusMaths.followTransform` (the Farplane): `farplane-colossus.ts` grows the painting 1.8 times and lifts
    it 6 during the colossus links; plates cut once at load stayed behind (plate stack 230 px off the painting, seen in the first
    capture). A plate at k of the painting's distance takes the scale times k and k times the lift. `Backdrop.ts` writes the plane's
    own height as `userData.fxCentreY` (additive) so a plate cut while the plane is lifted is still right.
- **Proof.** Plates ON vs OFF at rest (drift off, frozen, one page; the frame is deterministic, ON vs ON again is 0.000), mean
  absolute difference per channel out of 255 at 1/8 size: Dream's End 0.40, Garden of Pain 0.37, Via Purifico 0.23, Den of Woe 0.50,
  Leblanc 0.91, Zanarkand 1.70 (maximum 75, a line at the plate boundaries where the feathered alpha meets the fill; heat map checked).
  Zanarkand's heat map is edge-only. The Farplane, Bahamut and Trema frames carry an animated story caption, so their at-rest
  numbers are not stable and are not claimed. The Farplane check is the manual move: the painting scaled 1.8 and lifted 6 by hand,
  plates ON beside plates OFF (`ffx2-farplane-follow-manual-move-check.jpg`), plus the real chapter at the drift extreme
  (`ffx2-farplane-plates-follow-colossus.jpg`). REDUCE MOTION: drift 0 and defocus weight 0 (Dream's End, Leblanc, via
  `reducedMotion: 'reduce'`). LOW EFFECTS (`?fxtier=low`): Dream's End is flat (no plates, drift 0); Gagazet keeps its two plates and
  defocus 0. Phone 390x844: two plates, drift 0.6, `phone-leblanc-dreams-end.png`.
- **critic-plan class.** DEEP after deploy, FOCUSED before. Not save-data. `savedataBranch`: none.
- **Left.** Rooms not covered, and why:
  - Cavern of the Stolen Fayth (IX) and the Highbridge (X): the painting stands 12 units out with a projected floor, leaving
    about 5 units between it and the figures; plates there would parallax by a few pixels and defocus by almost nothing.
  - Evrae's deck (a rolled painting with swapped plates, FFX VIII and the Sin chapters) and the Road to the Farplane (two paintings
    swapped per link): `DepthPlates` knows neither the roll nor the swap.
  - Trema (XIII) and Bahamut (IV) are plates-covered but their at-rest numbers are not claimed (caption).

## Gates
- `npx tsc --noEmit`: clean.
- Targeted: `fx-b-focus.test.ts` 22 passed, `fx-b-living.test.ts` 11 passed, `eyecandy-flags.test.ts` 10 passed.
- Full suite (`npx vitest run --testTimeout=60000 --maxWorkers=4`, run before the last two small edits, the Zanarkand thresholds and the per-room drift scale, which were then re-run against `fx-b-focus` and `fx-b-living`): 747 files passed, 5 skipped, 11,056 tests passed, 40 skipped, 1 todo, 0 failed.
- `node tools/orphans.mjs`: 24 orphaned, unchanged (the same 24 as main; `PlateFocus`, `focusMaths`, `DriftRig`, `plateRooms` are reachable).
- Servers: the one dev server (port 5920) was stopped by PID. Scratch (captures, scripts) is under `D:/Tools/pyrefly-scratch/2026-10-03/r37-living-backdrops/`.
- Parked, not deleted: the unused depth maps (cavern-stolen-fayth, bevelle-highbridge, road-to-the-farplane, evrae-airship-deck) are in
  `F:/pyrefly-parked/2026-10-03/depth-unused/`.

## For Bailey (new looks, new gameplay and decisions: nothing here is built)
1. **The defocus is 0 at rest.** The brief was "no visible change in the resting frame", so the far plates go soft only while
   the camera drifts off its rest pose (about 90 percent of the time during the idle drift, strongest at each swing's extreme, fading to the
   sharp painting when a rig moves). The target's hero frame has the defocus on all the time. A constant light defocus at rest
   (say a quarter of the extreme) would be closer to the target but changes every resting frame: your call.
2. **The foreground snow bank in front of the party** (the target's softest, nearest plate) is not built. No plate stands in front of the
   figures anywhere in option B (plates draw before them), and one drawn after them would cover their feet. It is a new look: it
   needs a depth-ordering decision and a mockup before code.
3. **The existing four rooms' depth maps are 16-bit** (4.0 MB); as 8-bit they would be about 0.5 MB, a 3.5 MB saving under the 800 MB line
   (D-332). They are approved-adjacent derived files, so I left them; say yes and it is one command (`depth8.py`) plus a record.
4. **Where plates could not go** (Cavern, Highbridge, Evrae, Road): see "Left"; each needs its own recipe, and the near-painting rooms
   would gain almost nothing.
5. **Dist size.** This branch adds 0.6 MB (the eight 8-bit maps); at the 798.87 MB cut that matters only if the sourcemap line is not on main yet.

## Tile and board facts for the integrator (I did not touch decisions.json or targets.json)
- Tile 'Backdrops with a floor and a sky' (group 'Polish ideas: the 12 you picked'): delivery now **built, unmerged** on `r37-living-backdrops`
  (the plates and drift were already live via option B; the defocus and eight rooms are new). Reaction: nothing named by Bailey yet
  for the defocus strength; my guesses (cap 3, zero at rest, phone 0.8) belong under `inferred`.
