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

## Check (independent critic, 2026-10-03; tip 03af0863, nothing in `src/` touched by this check)

Method: three production builds served by `vite preview` on ports 6010 (tip), 6011 (merge-base d154486c, the build this
branch started from; live release 35 was not run, the merge-base is the stand-in), 6012 (the merge of the tip with
origin/main c69de96a, from `git merge-tree`, which merges cleanly). Headless Playwright on the real GPU
(`PYREFLY_BROWSER=gpu`), one browser at a time, the real chapters through `gotoChapter`, REDUCE MOTION by the
browser's own `reducedMotion`, frozen frames with the HUD off, pixel diffs at 1600x900. Servers stopped by PID.
Scratch and every capture: `D:/Tools/pyrefly-scratch/2026-10-03/r37-check/` (`out/`).

Game case of this check: both. FFX rooms (Zanarkand, Dream's End, Garden of Pain, Via Purifico, Gagazet) and FFX-2 rooms
(Farplane, Leblanc, Via Infinito via Trema, Den of Woe, Bahamut) were each run in their own game's chapter.

| Item | Verdict | Evidence |
|---|---|---|
| Defocus is 0 at rest and only while drifting | PASS | Gagazet series: weight 0.013 on the first frame, 1.0 at each swing's extreme, 0.02 at the zero crossing (about a 12 s cycle); a rig move (`rig:intro`) cuts drift and weight to 0 within 150 ms; real Enter keys on the command menu raise no error |
| REDUCE MOTION still | PASS | Gagazet and Leblanc, 20 samples over 10 s: drift 0, weight 0, bias 0 |
| LOW EFFECTS | PASS | Gagazet keeps 2 plates, drift 0.5, focus 0; Leblanc (plates-only) is flat: no plates, drift 0 (forced tier `?fxtier=low`; the settings row itself was not toggled) |
| `?fxsub=-focus` | PASS | drift 1, weight 0, bias 0 for 16 samples (Gagazet, Leblanc) |
| Phone 390x844 | PASS | 2 plates, drift 0.6, bias = weight x 3 x 0.8 exactly (0.513 gives 1.231); screenshots clean |
| Defocus reads, focus plate stays sharp | PASS | same-page ON vs `-focus` at the drift extreme: far sky/ridge mean change 1.7 (Gagazet) and 3.4 to 4.5 (Leblanc), the ground rows 0.5 and 0.0; crop shows soft far plates and a sharp near rock |
| Resting frame unchanged, Gagazet (old room) | PASS | defocus ON vs the merge-base build at rest sits at the run-to-run noise floor (0.33 vs 0.47 mean in the backdrop region) |
| Resting frame unchanged, new FFX rooms | PASS WITH DISCLOSURE | same-page plates ON vs OFF, drift off, frozen, ON vs ON again 0.000: Dream's End 0.33, Garden of Pain 0.23, Via Purifico 0.40, Zanarkand 1.73 (max 157, 0.9 percent of values over 24). Heat maps are thin edge lines only, like the four rooms on main; not bit-identical |
| Resting frame unchanged, new FFX-2 rooms except the Farplane | PASS WITH DISCLOSURE | Leblanc 0.31, Trema (Via Infinito) 0.15, Den of Woe 0.30 mean, edge-only |
| **Resting frame unchanged, the Farplane (Ch. V)** | **FAIL (blocker)** | plates ON vs OFF in the real chapter: mean 3.36, 7.5 percent of the sky band's values differ by more than 24 (about 10 to 25 times the other rooms). Hiding the scene's own `backdrop-layer-0/1` band layers (which plates do, `DepthPlates.show`) accounts for 2.6 of it: with the bands hidden and plates OFF the diff is 0.77. The follow itself is right (0.77, matches the painting under scale 1.8 and lift 6). Visible as a tone and mountain-silhouette change on the left of the frame (`out/v7.jpg`, `out/v8.jpg`). The brief and the handoff both say the Farplane's at-rest number was not claimed |
| 8 new rooms present, none mirrored | PASS | every room reports 4 plates in its own chapter (Zanarkand, Dream's End, Garden of Pain, Via Purifico, Farplane, Leblanc, Via Infinito, Den of Woe); a mirrored plate would diff by tens of levels, none does; every plate mesh scale is positive |
| Eight depth maps reach a production build | PASS | `node tools/fx-assets.mjs verify --dir <dist>/fx` PASS on a fresh `vite build` (24 files, 12 rooms); the repo copy and `D:/Tools/pyrefly-art-backup/fx` also verify PASS |
| Extreme-drift edges (voids, seams) | PASS | contact sheet of all 8 rooms at the pinned extreme on the merged build: no void or invented paint visible; Zanarkand's left dark column and faint horizontal water seam are in the no-drift baseline too (not introduced) |
| Farplane follow (`DepthPlates.follow`) | PASS | plates stack matches the painting under the colossus scale and lift (0.77 with bands hidden) |
| Frame time | PASS | 1600x900 real GPU, vsync on: Gagazet and Leblanc, 4 alternating rounds plates ON (drift extreme, defocus live) vs OFF: p50 16.7, p95 16.8, p99 16.8 in every round, no dropped frames |
| Regressions vs the build this branched from, and vs a merge with origin/main | PASS | merged build: same numbers in Zanarkand, Farplane, Leblanc, Dream's End, no page error; `git merge-tree` clean |
| Layering | PASS | `focusMaths.ts` and `plateMaths` imports are pure (no DOM, no `three`); nothing under `src/battle/**` or `BattlePresenter*` changed |
| Files under 400 lines | PASS WITH DISCLOSURE | every new or changed file is under 400 except `src/engine/Backdrop.ts` (495), which is 495 on origin/main too; this branch adds one property to an existing line |
| Game case in every commit | PASS | all three commits carry it |
| `npx tsc --noEmit` | PASS | clean |
| Targeted vitest | PASS | `fx-b-focus` 22, `fx-b-living` 11, `eyecandy-flags` 10; plus 15 related files (fx, eye, backdrop, farplane, comfort, scene) 197 tests, all green; the full suite is the integrator's |
| `node tools/orphans.mjs` | PASS | 24 orphaned, the same 24 as main |

### Blockers
1. **The Farplane's resting frame changes** (above). Remedy, either one: draw the scene's two band layers over the plates in a plates-only
   room that has them (so ON equals the live painting), or take the Farplane out of `plateRooms.ts` until it has its own recipe.
   Re-measure with a stable frame (wait until two grabs agree; the story caption animates) and the same in-page toggle.

### Disclosures (not blockers)
- Plates are not bit-identical at rest in any new room: a thin edge-only difference of 0.2 to 1.7 mean out of 255, up to 157 at a plate boundary.
- The defocus pulses with the drift (0 to full over about 12 s), not constant; the approved frame has it on all the time (the builder's own point 1 for Bailey).
- `Backdrop.ts` is over the 400-line house rule at 495, as on main.
- The real chapters were reached through the debug `gotoChapter`; real keys were used only for a command-menu Enter smoke. LOW EFFECTS was forced by `?fxtier=low`, not by the settings row.
- Frame time was measured on two rooms only (Gagazet, Leblanc) at desktop size.
- Release 35 live was not run; the merge-base build (d154486c) and a merge with origin/main c69de96a stand in.
