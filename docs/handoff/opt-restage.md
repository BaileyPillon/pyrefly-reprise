# opt-restage: re-staging options for PR-0310 and PR-0331 (prototype, never merged)

Branch `opt-restage`, worktree `D:/pyrefly-fixes-r28`, from origin/main 3fb1de85. **Game case: FFX only** (Ch II, III, VIII; Ch X for option N).
Rule 9 and 10 run: options and previews, behind URL flags; nothing here goes to main without Bailey's yes. No art touched.
Why FFX only: where FFX stages party and fiends is `[absence]` in `research/battle-camera-perspectives.md` and our slots are `[ours]`;
FFX has fixed formations and no positional rule (`research/ffx-vs-ffx2-presentation.md`); FFX-2 has free positions, so it is not touched
(`framing.ts` gates `game === 'ffx'`, desktop only).

## What is in the branch

- `src/engine/fx/mix/restage.ts` (new): `?stage=A|B|C` (A party left/forward, B fiends right/back, C half of each), `?stagegoal=colossus`,
  `?stagemax=1..3`, the screen-axis move (`shiftFor`), the solve (`solveStage`, `runStage`) and the clean test (`cleanOf`).
  No flag = today. Also `__pyrefly.fx.mix.stage({move, sensor, goal, max})`.
- `src/engine/fx/mix/sensorPlace.ts` (new): option N, `?stage=N`: `placeSensor` / `sensorTarget` and `SensorSteer` (writes the CSS `translate` of
  `.ffx-sensor`; `FFXBattleHud.ts` is untouched).
- `staging.ts`: `Staging.shift` (world x and z added to the plan; z is new). `framing.ts` (396 lines): `solve()` wrapper, `decide(actors, shift)`,
  the Sensor card handled for N. `framingReport.ts`: `restage`, `sensorTo`. `MaxMix.ts`: the `SensorSteer` and the debug hook.
- `tests/unit/fx-mix-restage.test.ts` (12 tests). `tsc --noEmit` clean; the ten `fx-mix` and eye-candy vitest files (136 tests) pass; no file over 400 lines.

## Result (numbers and media in `D:/Tools/pyrefly-scratch/2026-10-03/visual-options/restage/`: README.md, table.md, sheets/, clips/, cap/out/)

- Ch II: B, C and A each clear the rest gap (-113 / -130 / -179 px to a positive gap at 1600x900 / 2000x1012 / 2560x1440), one fixed move for all sizes.
  A is a knife-edge. Recommendation C (party 0.5 left, boss 0.5 right).
- Ch III: B clears at 1600x900 (boss 0.97 right / 0.63 back) and 2000x1012 (1.45 / 0.94); A does not at 1600x900; C does not at 1600x900.
  The colossus master does not come back with any option (the pagodas stand under the HUD in every master).
- Ch VIII: no option clears at all three sizes; B at the full reach (4.1 right / 2.1 back) reaches -32 at 1600x900 and +7 at 2000x1012 and drives
  the coil behind the turn rail. Needs a different answer (re-posed coil painting, or party slots and camera): mockups first.
- Ch X: N brings the colossus master back in 5 of 6 runs (BOSS SCALE step 0.25 to 1.0) with the Sensor card steered off Natus; not deterministic yet.
- Cost: the prototype solve plans 17 times at battle start (median 2.1 s here); production would keep a table per chapter and plan once.
- Open: live release 36 reads Ch III rest gap +1 where round 19b read -44 to -100 on the same build; not reproduced.

Stop-the-servers: the dev server on 6200 was started by this lane and stopped by PID.
