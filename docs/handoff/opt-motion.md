# opt-motion: motion options beyond still keys (prototype, never merged)

Branch `opt-motion` (from `origin/main` 53c63aa6), 2026-10-03. Options and previews only (AGENTS.md rules 9 and 10): nothing here is a product
change, nothing under `public/art` was written, and every option is behind `?motion=` (no flag = today). Bailey picks; then the
chosen option is rebuilt on main by its own track. Full write-up with numbers and clips:
`D:/Tools/pyrefly-scratch/2026-10-03/visual-options/motion/README.md`.

## What is on the branch

| File | Role |
|---|---|
| `src/engine/motion/MotionMode.ts` | `?motion=M1,M2,M3` (or `off`), run-time `window.__pyreflyMotion.set(..)` |
| `src/app/screens/BattleScreenTravelMotion.ts` | M1: an `ActionMotionPort` (the port FF7 uses) with `strike` and `close`; FFX-2 long-range figures do not travel |
| `src/engine/motion/PuppetWarp.ts` | M2 (pins per painting) and M1's smear: 28 x 28 grid + vertex shader on the figure's own plane, no new texture |
| `src/engine/motion/ProjectileHook.ts`, `ProjectileFx.ts` | M3: launch at `action-start`, first blow waits for it, sprites plus a starburst impact frame |
| edits | `BattlePresenterBeats.ts` (strike hook, ended-actor id), `BattlePresenterMotion.ts` and `BattlePresenterPorts.ts` (optional members), `BattleCamera.ts` (`truck`), `BattlePresenterStage.ts` (attach, `travel`, `truck`), `BattlePresenterSpellFx.ts`, `KeySlots.ts` (`menuBlocksMotion`), `BattleScreenGameDeps.ts` |
| `tests/unit/opt-motion.test.ts` | 9 tests: off by default, REDUCE MOTION, skip, FFX-2 menu, long range, a heal draws nothing |

## Game case (rule 14)

- M1: **FFX-2 sourced** (`research/ffx2-combat-core.md` section 1: short range runs in, long range fires from its place; about 2 s when far).
  **FFX unsourced** (`research/battle-camera-perspectives.md` A.2: no source on melee approach or per-move camera): our staging, labelled so.
- M2: both, ours. The only source is the painting.
- M3: both, ours. The sources say nothing about spell travel in either game (FFX-2: a long-range shot leaving the girl is consistent with "fires from starting position").

## Rules kept

REDUCE MOTION on = today's look for all three (checked in a browser: travel 2.0 units normal, 0 under reduce; warp 0.22 rad, 0). FFX-2 command menu
open = M1 and M3 play nothing (`menuBlocksMotion`; unit tested, not driven in a browser because auto-play answers the menu at once). Skip playback = nothing.
No painting mirrored, no plate edge touched, no game data added.

## Checks

`tsc --noEmit` clean; `tests/unit/opt-motion.test.ts` 9/9; 33 presenter, key-slot, camera and comfort test files (275 tests) pass.
Flaw to carry: the run home is keyed by the ended action's actor id (was `actingId`) so an ATB overlap cannot strand a figure at the target; FF7's path is unchanged in sequential playback but was not re-run here.
