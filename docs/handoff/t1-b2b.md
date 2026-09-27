# t1-b2b: Batch 2, scenes and actors half (thresholds program, 2026-09-26)

Branch `t1-b2b` (worktree `D:/pyrefly-t1-b2b`), from `main` 8abc7473. Brief: plan
`docs/plans/thresholds-program-2026-09-26.md` §2 "Batch 2", class A items that restore an
approved tile, a check contract or a sourced rule. Not merged, not deployed.

No item here is stalled, so no rule-15 method check was owed.

## Fixed

| Item | Game (rule 14) | What changed | Check |
|---|---|---|---|
| PR-0205 | FFX-2 only (Ch XI) | `EnemyGroupDef.headline?` (additive, `docs/CONTRACT-CHANGES.md`); `roadSistersGroup.headline = 'Magus Sisters'`; the chain loop passes it to `BattlePresenter.run(engine, { headline })` and `openOn` prefers it over the first enemy's name. | `tests/unit/chain-link-headline.test.ts` runs the real chain, presenter and FFX-2 engine from link 2: the reveal plate reads "Magus Sisters" (was "Sandy"); Anima's link still reads "Anima". |
| PR-0164, PR-0212 | FFX only (Ch II, XIV; the aeons in I and X too) | New `src/engine/ActorEdgeFeather.ts`: art ids whose pose files have opaque pixels on a side or top border (scan 2026-09-26: yunalesca-1/2/3, valefor, ixion) get `edgeFade` (0.2 for yunalesca-1 and valefor, 0.16 for the rest) with the new `edgeFadeBase: false` (PaintedActor option + shader uniform: feather the sides and top, keep the base on the floor). `PaintedStage.add` spreads it in. No file touched in `public/art`. | `tests/unit/engine/stage-edge-feather.test.ts`. In game (production build, GPU, real keys): `docs/screenshots/t1-b2b/edge-feather-before-after.jpg` toggles the live uniform on one frame each: feather 0 shows Valefor's straight wing cut (Ch XIV, after Summon > Valefor, 1600x900) and the straight left and top edges of Yunalesca's attack plane (Ch II, 2000x1012); 0.2 shows neither. Approved hashes 207 ok, judge-locked 48 ok, 0 mismatched, 0 missing. |
| PR-0184 | FFX only (Ch IX) | `cavern-stolen-fayth-arrival.ts`: the tree plane is sunk to the painting's root row (880/1024), drawn after the floor veil (renderOrder 4; the veil writes no depth and was laying the night over the trunk), and faded on its sides and top by an alpha map (`sakuraEdgeAlpha`). `sakura.png` untouched. | `tests/unit/chapters/cavern-arrival-framing.test.ts`. Frames `ch9-before-1600-arrival-f15/f22.jpg` vs `ch9-after-{1600,2000}-arrival-f16/f20/f23.jpg`, and `ch9-after-2000-tree-crop-brightened.jpg` (the trunk meets the floor behind Yojimbo). |
| PR-0185 | FFX only (Ch IX) | The wide `enemy` rig rises from y 3.4 (look 1.8) to 5.0 (look 1.6). Yojimbo and Daigoro keep their screen boxes within a few pixels (live rects: Yojimbo 767..990 x 353..681 vs 766..994 x 361..708). | The framing test projects the party at 1280x720, 1600x900 and 2000x1012, pushes 0, 0.06 and 0.12: no party figure straddles the bottom edge. Live probe of every frame of a real-key run (arrival plus 10 turns): no cut head on any held enemy frame (camera z 9.0 to 9.8). **Left open:** frames taken while the camera tweens between `enemy` and `idle` (z 10 to 12, about 0.2 s) still pass heads through the bottom edge, as any dolly from a frame with the party to one without it does. **Left open:** 4:3 (1280x960): `holdWidth` opens the fov there and no height of this rig (5.0 to 6.2 tried) clears the party; that needs a 4:3-specific rig. |
| R15-02 | FFX only (Ch IX) | `loadPainting` makes one GET through `tryLoadTexture`; the HEAD probe (the request Chromium aborted) is gone. A missing file still returns `null` (a dev server's `index.html` fails to decode). | Network log of the real-key run: before `REQ HEAD`, `REQ GET`, `FAILED HEAD ... net::ERR_ABORTED`; after, one `GET 200`, no failed sakura request. (`art/title/keyart.png` still logs one `ERR_ABORTED` on the title screen, before and after: not this batch's file, not triaged here.) |
| PR-0136 | FFX-2 only (Ch VI) | `LEBLANC_ENEMY_LANE_X` 0.0..2.4 to 1.0..3.0 (exported, with the scene's rigs as `LEBLANC_LAST_ROOM_RIGS`). | `tests/unit/chapters/leblanc-enemy-lane.test.ts` projects the lane through the idle camera. Real keys to each link's first menu, 1600x900: nearest fiend to a girl 205 / 225 / 162 px (was 96 / ~100 / ~100), leftmost fiend x 837 / 859 / 810 (right half), rightmost ends by 1073 (FFX-2 rail 1152), below the enemy-intent card. `ch6-{before,after}-1600-link{1,2,3}.jpg`. Not measured at 2000x1012. |

## Stopped (reported, not built)

- **PR-0034 (Ch I grade: moon and lit snow).** The moon is in the idle frame (x 145, y 130 at
  1600x900, `ch1-before`), under the expanded guide card. The darkening is not the Gagazet grade:
  the post chain presents linear-light values without the sRGB output curve. The plate's
  (86,189,255) comes out (27,134,250). That is sRGB-to-linear, and it applies to every scene: the
  grade pass (`GradeShader.ts`) writes `gl_FragColor` with no colour-space conversion and the
  composer has no OutputPass. Palette sweeps (gain, saturation, exposure) move the patches by under
  15 levels; exposure does nothing under `NoToneMapping`. A live probe that sRGB-encodes the grade
  output brings the sky and peaks to within a few levels of the plate (sky 49,81,144 vs 32,81,138;
  peaks 77,170,247 vs 75,166,237) but hazes the whole frame, because every scene's fog, mist, lights
  and grade were tuned on the linear output (`docs/screenshots/t1-b2b/ch1-pr0034-linear-output-vs-srgb-probe.jpg`).
  So the fix is a whole-game colour-pipeline change (`src/engine/Renderer.ts`, not this batch's file)
  and a re-look of every approved scene. It needs a decision, not a batch-2 tweak.
- **PR-0177 (Evrae FAR scale "toward A-FAR").** The approved end state conflicts with the frame the
  issue measures against. D-032 adopts "C's staging: ... Evrae a distant streak" and D-038 approves
  `idle-far.png`, which is a streak, as shown. The issue compares against `sheet.png` A-FAR, a concept
  frame whose serpent is a different, coiled painting at about 370x260 px. The game draws the approved
  streak at about 220x40 px (round 12 `30-far-1.png`); C-FAR's coil is about 280 px wide. Matching
  "comparably sized" means choosing between the adopted words and that frame, which is a rule-9
  choice. Options for the driver to put to Bailey: keep the streak's head-ratio size (today), or raise
  the FAR scale about 1.3x to 1.7x so its width matches C-FAR or A-FAR. Neither touches the painting.

## Shared-file touches outside the owned list

These are one-line or small edits the items needed. Watch for them at merge:
`src/battle/common/types.ts` (contract, additive), `src/data/ffx2/enemies/fallen-aeons-road.ts`
(batch 1), `src/app/screens/BattleEncounterChain.ts` (batch 1), `src/engine/BattlePresenter.ts` and
`src/engine/BattlePresenterStage.ts` (the other batch-2 half), `src/engine/shaders/PaintedShader.ts`.
`TargetHighlight.ts` was not touched.

## Checks

- `npx tsc --noEmit`: clean.
- Full `vitest run --testTimeout=60000`: 453 files passed, 4 skipped; 8332 tests passed, 29 skipped.
- `node tools/orphans.mjs`: 24 orphaned, the same as main (new module reachable).
- Approved art: `docs/target/approved-hashes.json` 207 ok, `judge-locked-hashes.json` 48 ok, 0 mismatched, 0 missing.
- Browser checks: production `vite build` served by `vite preview` on 5990 (baseline) and 5991 (candidate),
  Playwright Chromium with `PYREFLY_BROWSER=gpu`, real keys from the title. Both servers were stopped by PID.
  The scratch drivers are `tools/zz-b2b-*.tmp.mjs` (agent scratch, uncommitted).
