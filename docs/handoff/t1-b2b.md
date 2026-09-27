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

## L-0 finish (browser check with real keys, 2026-09-27)

Merged `origin/main` again (`769e25d9`: Bailey's 2026-09-27 answers, the perspectives and
Valefor-bug records, the deploy-pages polling fix; no conflict, no source overlap with this
branch). The first L-0 pass (same day, 10:26 to 11:26) had already reconciled PR-0184, PR-0185 and
R15-02 with iter2-b2's scene rigs (`a7735fbf`, `f5c75036`, `b2bffe86`) and wandered the start of
the stage feather (`7f051136`); this pass ran the whole checklist on the final build.

Method: production `vite build` (`dist-l0/`, not the shared `dist/`) served by `vite preview` on
6700, headless Playwright Chromium with `PYREFLY_BROWSER=gpu`, one browser at a time, seed 1, real
keys from the title. Two inputs are debug and labelled where used: `autoBattle('intended')` to
reach Yunalesca's forms 2 and 3, and to cross Chapter VI's link 2 (the measurement at each link's
first menu is unchanged by how the link was reached). Scratch drivers `tools/zz-l0-*.tmp.mjs`
(uncommitted); raw frames under `D:/Tools/pyrefly-scratch/t1-b2b-l0/`.

| Item | Game (rule 14) | Round-13 acceptance | Result | Frames (`docs/screenshots/t1-b2b/`) |
|---|---|---|---|---|
| PR-0205 | FFX-2 only (XI) | seam 2 caption reads 'Magus Sisters' | **Met.** Link 1 won by real keys (79 s); frames every 350 ms after the seam: the reveal plate reads "Magus Sisters" from 0.7 s on, never "Sandy" (the boss HP card later names Sandy, the formation's first HP bar, as intended). | `l0-ch11-1600-seam2-magus-sisters.jpg` |
| PR-0164 | FFX only (II) | attack frame at 2000x1012: no straight hard edge through the hair; the file byte-identical | **Met after a fix (below).** Frozen-camera pairs (her plane shown, then hidden) proved the straight pale column in the attack frame was her own plane: the hair runs dense up to the PNG's left border, and a feather that always ENDED on the plate edge left it ending on one straight line. The feather's end now wanders inside the edge. Forms 2 and 3 checked too (2000x1012): no straight edge on the sides or top. | `l0-ch2-2000-attack-hair-edge-before-after.jpg` (left: before, a hard vertical line; right: after), `l0-ch2-2000-form1-attack.jpg`, `-form1-hurt.jpg`, `-form2-attack.jpg`, `-form3-attack.jpg` |
| PR-0212 | FFX only (XIV) | no straight edge in a Ch XIV summon frame (shader-mask route; the file half cannot pass without a re-cut, Bailey's call) | **Met by the mask route.** Summon > Valefor by real keys; the far wing (mirrored, so on the left) fades out along a wandering line at 1600x900 and 2000x1012. | `l0-ch14-{1600,2000}-valefor-midfight.jpg`, `l0-ch14-valefor-wing-zoom-1600-2000.jpg` |
| PR-0184 | FFX only (IX) | arrival frames at 1600 and 2000: no straight edge on the canopy, the trunk meets the floor | **Met.** The canopy ends on its own blossom along a wandering, rounded line; the trunk goes down behind Yojimbo to the floor line. | `l0-ch9-{1600,2000,1280}-arrival-enemy-held.jpg`, `l0-ch9-{1600,2000}-canopy-crop-brightened.jpg` |
| PR-0185 | FFX only (IX) | no party head cut in the enemy-action and arrival frames at 1600 and 2000 | **Met on held frames** at 1280x720, 1600x900 and 2000x1012: a per-frame sampler over arrival plus 8 real-key turns counted 0 cut heads with the camera on a held rig. **Disclosed, open:** the 100 to 150 ms dolly between `enemy` and `idle` still passes heads through the bottom edge (camera z 10 to 13.5; 17 or 18 such runs per fight); a 350 ms sequence can land on one (`l0-ch9-2000-arrival-enemy-tween.jpg`: Kimahri's horn and spear tip at the bottom edge). Any continuous dolly from a frame with the party to one without it crosses the edge; the choices are a cut instead of a dolly on that pair, or fading the party during it. That is a camera-grammar call for Bailey, not built. 4:3 is pinned by `f5c75036` (0 held cuts at 1280x960 in the first L-0 pass). | as above |
| R15-02 | FFX only (IX) | a network log that records aborted requests shows none for sakura.png on Chapter IX entry | **Met** at all three sizes: `REQ GET .../sakura.png`, `DONE GET 200`, 0 failed requests, 0 page errors. | (log only) |
| PR-0136 | FFX-2 only (VI) | 1600x900: no enemy within 150 px of a girl, enemies in the right half | **Met.** 1600x900 nearest fiend 202 / 226 / 168 px, leftmost fiend x 836 / 858 / 812 (half 800). 2000x1012 (regression look) 226 / 240 / 202 px, leftmost 1040 / 1066 / 1013 (half 1000); the fiends stay left of the command rail and below the intent card. | `l0-ch6-{1600,2000}-links-1-2-3.jpg` |

**Fix in this pass (FFX only; PR-0164, PR-0212).** `PaintedShader.ts`: with `edgeJag` above 0 the
whole feather ramp moves inward by `edgeJag` scaled into [0.35, 1] by edge noise, so its end (not
only its start) wanders and never lies on the plate edge; the noise is read at 2.7x along the edge
with a contrast of smoothstep(0.33, 0.6), because the dissolve noise's side row sits in 0.31..0.66
and the old smoothstep(0.25, 0.75) barely moved the line (measured by `tools/zz-l0-noise-row.tmp.mjs`).
`edgeJag` 0 is the old straight feather exactly, so no other figure changes. The math is mirrored
in `ActorEdgeFeather.featherAlpha` (with `JAG_MIN`) and pinned to the GLSL by
`tests/unit/engine/stage-edge-feather.test.ts` (written failing first).

**Observed, not an item here.** Yunalesca's third form ends on a straight horizontal base line where
its coils meet the floor (`l0-ch2-2000-form3-attack.jpg`); the base is kept whole by design
(`edgeFadeBase: false`) because the coils fill the painting's base. Not in any round-13 item.

**Still open, by Bailey's answers of 2026-09-27 (D-249).** PR-0034 (Q11): yes to the four-scene
before/after sheet (OR-15) before any colour-pipeline change; the sheet is not this batch's.
PR-0177 (Q9): "keep the streak", so the issue closes as intended; that closure is the critic's to
record, not built here.

Checks on the final commit: `npx tsc --noEmit` clean; full `vitest run --testTimeout=60000` 552
files passed, 5 skipped (9225 tests passed); `node tools/orphans.mjs` 29 orphaned, the same as
main; `verify-approved.mjs` 0 mismatched, 0 missing (approved 219, judge-locked 48). The preview
server on 6700 was stopped by PID.

## CHECK (L-0), independent checker, 2026-09-27

I re-checked L-0 (`5d4b829a`) on my own production build. I did not build any of it.
**Verdict: no blocker.** Every item the builder called met is met again by real keys.
PR-0185 is still open for the camera move only, as the builder disclosed, and nothing
regressed against main in either game.

**Method.** I made two production `vite build`s. The candidate is this branch at `5d4b829a`,
bundle `index-DnWJf0Zm.js`. Main is `origin/main` exported by `git archive`, bundle
`index-C-3hBxzq.js`. That is byte-for-byte the live release 24 bundle, because main's `src`
has not changed since `bc4e70ee`. The candidate was served by `vite preview` on 6710 and main
on 6711. I used headless Playwright Chromium from node with `PYREFLY_BROWSER=gpu`, one browser
at a time, seed 1, and real keys from the title. One input was debug and is labelled:
`autoBattle('intended')`, used to cross Chapter VI link 2 and to reach Yunalesca's forms 2 and
3. Each measurement was taken at the link's first menu, or on real keys after that point. Frames
and drivers are in `.chk3-tmp/` in this worktree (scratch, uncommitted).

| Item | Game (rule 14) | Round-13 acceptance | My result |
|---|---|---|---|
| PR-0205 | FFX-2 only (XI) | the seam 2 caption reads 'Magus Sisters' | **Met.** I won link 1 with 175 Enter presses and nothing else. The frames every 300 ms after seam 2 show the reveal plate `pf-mom__slab-title` reading "Magus Sisters" from 0.9 s on, and never "Sandy" alone. No page errors (`ch11/cand-1600/seam2-05.jpg`). |
| PR-0164 | FFX only (II) | Ch II attack frame at 2000x1012: no straight hard edge through the hair; the file stays byte-identical | **Met.** On main, the attack frame shows a hard vertical cut on the left and a hard horizontal cut on the top. On the candidate both are soft (`cmp-ch2-attack2-main-vs-cand.jpg`). The left fade line wanders over x 1010..1087 (sd 17.7 px against main's 6.3), with one near-straight run of about 50 px, soft at 2x zoom. Forms 2 and 3 (idle, attack, cast) show no straight side or top edge. `verify-approved`: 0 mismatched, 0 missing. |
| PR-0212 | FFX only (XIV) | no straight edge in a Ch XIV summon frame (the mask route) | **Met by the mask route**, at 1600x900 and 2000x1012. I did Summon > Valefor by keys, and the far wing (on the left) fades on a lumpy line. The file half still fails as written: `valefor/idle.png` keeps its opaque right-border pixels, and a re-cut is Bailey's call. |
| PR-0184 | FFX only (IX) | the arrival frames at 1600 and 2000 show no straight edge on the canopy, and the trunk meets the floor | **Met.** On main the tree floats high and ends in a straight vertical fade. On the candidate the tree sits lower and its roots meet the floor behind Yojimbo, closer to option A of `docs/concepts/chapters/yojimbo/chamber/sheet-arrival.jpg`. The right side is still a soft, mostly vertical fade, but it now follows the blossom (`cmp-ch9-right-main-vs-cand.jpg`). |
| PR-0185 | FFX only (IX) | no party head is cut by the frame edge in the Ch IX enemy-action and arrival frames at 1600 and 2000 | **Met on held and swaying shots; open for the camera move.** I ran a per-frame sampler over the arrival plus 8 real-key turns. The candidate had 105 cut frames at 1600 and 100 at 2000. Every one came while the camera moved between the `enemy` and `idle` shots, with the camera between z 10.05 and 13.5 (the enemy shot sits at 9.8). None came on a held or swaying shot. Main at 2000 had 795 cut frames, 92 of them on held shots. So this is a large improvement, not a regression. A 250 ms arrival frame at 1600 (`ch9/cand-1600/arrival-14.jpg`) still lands on the move with the party's heads at the bottom edge. Choosing a hard cut or a party fade stays Bailey's camera call. |
| R15-02 | FFX only (IX) | the network log shows no aborted sakura.png request | **Met** at 1600 and 2000: one `GET 200` for `sakura.png`, 0 failed requests, 0 page errors. |
| PR-0136 | FFX-2 only (VI) | at 1600x900, no enemy within 150 px of a girl, and the enemies in the right half | **Met.** At 1600x900 the gaps are 202 / 211 / 164 px and the leftmost fiend is at x 835 / 858 / 810 (half is 800). Links 1 and 2 were played by real keys; link 3 was reached by debug auto. At 2000x1012 the gaps are 227 / 238 / 187 px and the leftmost fiend is at x 1040 / 1065 / 1013. The fiends stay left of the rail (1246 / 1501) and below the intent card. |
| PR-0034, PR-0177 | | | Open by Bailey's D-249 answers, as the brief says. Not checked here. |

**Regression sweep (both games, shared code).** I opened every chapter's first command menu on
the candidate and on main, at 1600x900 and at 390x844: 14 chapters each, 56 runs. The acting
member and the command rows are identical in every chapter at both sizes, and there are 0 page
or console errors. The actor boxes differ by a few pixels of idle sway, except for two chapters:
- Ch VI: the fiends moved right. That is PR-0136, intended.
- Den of Woe: the HP differs because of ATB timing.

**Side effect of PR-0136 at 390x844.** The portrait frame fits the wider enemy lane, so the whole
Ch VI cast draws about 11 percent smaller: Yuna is 56x144 against 64x163 on main. Fem-Goon stands
at x 350..366 of 390, still inside the frame (`cmp-leblanc-390-main-vs-cand.jpg`). This is minor
and I built nothing for it.

**Hidden FF7 fight.** I typed L I M I T on chapter select after reaching it from the title by
keys. The FF7 fight opened with one `.ff7hud` and played to **victory** by real keys, with 0
thrown errors.

**Code and tree checks.**
- `tsc --noEmit` is clean.
- Full `vitest run --testTimeout=60000` passes: 552 files, 5 skipped; 9225 tests passed.
- `node tools/orphans.mjs`: 29 orphaned, the same as main.
- `verify-approved`: 0 mismatched, 0 missing.
- `git merge-tree --write-tree origin/main HEAD` is clean against `3e7d8d3e`, and again against `8140a461`: main then added only docs and FF7 art, with no `src` or `tests` change.
- The branch does not have hotfix 24 yet (`bc4e70ee`: the Grand Summon picker and summon
  staging). I exported the merge result `0dd0632d` and checked it: tsc is clean. The full vitest
  gives 554 passed and 1 failed. The failure is `audio-manifest-io`, a Windows `EPERM` on a
  temporary lock file under load; that file passes when run alone and has nothing to do with this
  branch.

**Findings for the driver.**
1. PR-0185 has not fully passed its check as written: arrival and sequence frames that land on
   the enemy/idle move still cut heads (polish, not a regression). The call is Bailey's camera
   grammar.
2. The PR-0212 file half cannot pass without a re-cut (Bailey's call). The mask route passes the
   frame half.
3. PR-0164 and PR-0184 pass, with soft residual fades: a short near-straight soft run on
   Yunalesca's left hair, and a mostly vertical soft right side on the canopy. A critic could
   still call these "soft straight" at zoom (polish).
4. On main, the hotfix 24 summon staging is not on this branch. Summon frames of the merged
   build should be looked at once after the merge.
5. House style: `PaintedActor.ts` (+12) and `BattlePresenter.ts` (+1) were already over 400
   lines and grow slightly. The new logic sits in new modules.

**Cleanup.** I stopped both preview servers (6710, 6711) by PID. I removed the junction links I
created (`.chk3-tmp/main-src` and `.chk3-tmp/merged-src`: `node_modules` and `public/art`). I
left the worktree's own `node_modules` and `public/art` junctions (13:33, made by the earlier,
stopped check) in place, because I did not create them.
