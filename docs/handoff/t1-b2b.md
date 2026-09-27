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

## CHECK (code), independent checker, 2026-09-26

Code-only pass: a deep review (round 14) was running its browsers on this machine, so I started no
browser, dev server or bench. The first independent check was stopped partway. It left a candidate
`vite build` (`dist-chk-cand/`, exit 0), a full vitest log (453 files passed), about ten Chapter IX
arrival frames at 1600 (`.chk-tmp/ch9/`, not graded) and its driver `tools/zz-chk-b2b-ch9.tmp.mjs`.
Nothing is listening on 5990 to 5999. All of it is scratch, uncommitted and left in place.

**Verdict: no code-level blocker.** The six fixes match their round-13 fix routes. What is left is
browser evidence, listed below.

| Item | Round-13 acceptance check | Code against it | Status |
|---|---|---|---|
| PR-0205 (FFX-2 only) | seam 2 caption reads 'Magus Sisters' | `headline` is additive and optional, recorded in CONTRACT-CHANGES. The presenter uses `(boss && headline) \|\| boss?.name`. 'Magus Sisters' matches the guide's `linkTitles` for sandy/cindy/mindy (`src/data/guides/ffx2-fallen-aeons.ts:114`), so the name is not invented. The test drives the real chain, presenter and FFX-2 engine. | Code met. The caption frame still needs a browser. |
| PR-0164 (FFX only) | Ch II attack frame at 2000x1012: no straight hard edge through the hair; the file stays byte-identical | The shader feathers the sides and top only (`vUv.y < 0.5` zeroes `d.y` on the lower half; the plane's uv has y = 0 at the base). Only the five listed art ids get the option. No FFX-2 path uses `valefor` or `ixion` art ids, so the fix stays FFX only. | Code met. Hashes are identical (below). The builder's frame came from a live-uniform toggle, and a round-style capture is still owed. |
| PR-0212 (FFX only) | "0 opaque pixels (alpha > 32) on every border row and column of the Valefor pose files; no straight edge in a Ch XIV summon frame" | Fixed by a mask in the shader, which is the issue's own "mask it with a soft edge" route. The file-level half of the check **cannot pass as written**: `valefor/idle.png` still has 314 opaque right-border pixels. It is not approved-locked, but re-cutting it is Bailey's call. | The reviewer needs to accept the mask route, or the driver should reword the check to the frame half. Flagged, not a blocker. |
| PR-0184 (FFX only) | arrival frames at 1600 and 2000: no straight edge on the canopy, trunk meets the floor | The plane is sunk to the root row (880/1024) and has renderOrder 4 (after the floor veil at 2 and 3, before the figures at 10). The alpha map is 0 on the sides and top and 1 at the base. The CanvasTexture keeps flipY, so canvas row 0 is the top of the plane, which is correct. `sakura.png` is untouched. | Code met. The builder's frames are committed. The critic still needs an arrival sequence at both sizes. |
| PR-0185 (FFX only) | no party head cut in the ch9 enemy-action and arrival frames at 1600 and 2000 | The enemy rig moves from y 3.4 to 5.0 and its look height from 1.8 to 1.6. The projection test covers 1280, 1600 and 2000 at pushes 0, 0.06 and 0.12. **Risk:** the builder left the enemy-to-idle tween (about 0.2 s, camera z 10 to 12) and 4:3 open. The critic's 350 ms sequence frames can land inside that tween. | Partly met. The tween frames decide it. |
| R15-02 (FFX only) | a network log that records aborted requests shows none for sakura.png on Ch IX entry | The HEAD probe is gone. `tryLoadTexture` catches a decode failure and returns null (with a `warnOnce`). | Code met. The network log still has to be captured. |
| PR-0136 (FFX-2 only) | 1600x900: no enemy within 150 px of a girl, enemies in the right half | The lane moves to 1.0..3.0. A projection test and the builder's live rects show 162 to 225 px, left edge x 810 or more, and the rail at 1073 or less. | Met at 1600, as the check asks. 2000 was not measured. |
| PR-0034, PR-0177 | (stopped) | The stop reasons are sound. PR-0034 is a whole-game colour-pipeline decision (`Renderer.ts`, no OutputPass). PR-0177 is a rule-9 conflict between D-032/D-038 and the concept frame A-FAR. | For the driver to put to Bailey. |

**Checks run here (CPU only).**
- `npx tsc --noEmit`: clean.
- `npx vitest run --testTimeout=60000`: 453 files passed, 4 skipped; 8332 tests passed, 29 skipped, 1 todo.
- Approved art: I hashed `docs/target/approved-hashes.json` (207 ok) and `judge-locked-hashes.json` (48 ok) under ROOT = this worktree, where `public/art` is the junction to the main tree. 0 mismatched, 0 missing, and no `public/` path in the diff.
- Boss numbers: the only `src/data` change is the `headline` string. No stat, HP or damage value changed.
- 400-line rule: every new file is under 400 lines (ActorEdgeFeather 42, the tests 58 to 124). `cavern-stolen-fayth-arrival.ts` is 364 and `leblanc-last-room.ts` 372. `types.ts` (+7), `BattlePresenter.ts` (+1) and `PaintedActor.ts` (+8) were already over 400 on the merge base and grow only by those few lines.
- Merge: `git merge-tree main t1-b2b` shows one conflict, in `docs/CONTRACT-CHANGES.md` (both sides add a newest-first entry, so keep both). `BattlePresenterStage.ts` auto-merges. Re-run tsc and the full vitest on the merge commit, because main has moved (the iter2 merges).

**Browser checks still owed after round 14.** Run a production build and use real keys, seed 1, GPU.
1. PR-0205: Ch XI, win link 1, then frames every 350 ms after seam 2 at **1600x900**. The plate reads "Magus Sisters".
2. PR-0164: Ch II, Yunalesca-1's attack frame and hurt frame at **2000x1012**, plus one form-2 and one form-3 frame. No straight edge at the hair or at the aura on the top and sides, and the base is whole.
3. PR-0212: Ch XIV, Summon > Valefor, a midfight frame at **1600x900 and 2000x1012**. No straight wing cut. Add one Ixion overdrive frame if it is reachable.
4. PR-0184: Ch IX arrival sequence (the pre-scene hand-over, `seq-transition` f05 to f09 as in round 12) at **1600x900 and 2000x1012**. No canopy side cut, and the trunk meets the floor.
5. PR-0185: Ch IX first ATTACK plus the following Yojimbo turn, with sequence frames at 350 ms, at **1600x900 and 2000x1012**, **including frames inside the enemy/idle tween**. Also run one reveal push at **1280x720**. 4:3 (1280x960) is known open and should be recorded, not failed on.
6. R15-02: a network log of Ch IX entry that records `requestfailed`. It should show no `ERR_ABORTED` for sakura.png and exactly one GET 200.
7. PR-0136: Ch VI links 1 to 3 to the first menu at **1600x900** (the acceptance size). Add **2000x1012** once as a regression look at the rail and the intent card.
