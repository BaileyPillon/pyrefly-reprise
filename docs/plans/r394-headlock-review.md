# r394-headlock: paper preflight (critic-plan class DEEP; a focused review before any deploy, the deep one after)

Branch `r394-headlock`, from `origin/r393-int` b80f772f (= live 39.2 plus the hidden Leblanc chapter, release 39.3). Written before the code, in the 5-to-10-minute form AGENTS.md rule 15 asks for; **corrected after the build** where the build found the plan wrong (marked "build:" below; the handoff `docs/handoff/r394-headlock.md` has the whole account).
`node tools/critic-plan.mjs --paths` on the files below says DEEP (asset loader, battle presenter and lifecycle, effects and sprites: CHK-006 to CHK-027, both games, all eighteen chapters).
Lane brief and authority: Bailey's pick of 2026-10-06 23:46:05 EDT, "Engine keeps the head steady (Recommended)" (D-510), for the CHK-026 knock-out swaps of Chapter V (Rikku as Dark Knight, FFX-2) and Chapter XVII
(Yuna, FFX). Design notes carried over: `D:/Tools/pyrefly-scratch/r393-headlock/NOTES-paused-2026-10-06.md`; the evidence is `docs/handoff/r392-size.md` section 4a.

## Game case (rule 14)

**Both games.** The cause is shared geometry, not a game number: a lying painting is rolled onto the floor and a standing one is upright, so the stage camera scales their heads differently (the lying head over the standing head falls from x1.05 to x0.97 as the
camera's perspective goes from 0.98 to 1.04, 165 swaps, 11 subjects, FFX and FFX-2; `docs/screenshots/r392-size/ko-ratio-vs-camera-perspective.png`). The failing chapters are one of each game (V FFX-2, XVII FFX); every chapter with a registered head is covered.
The hidden chapter (FFX-2 only) is deliberately **not** covered: see the risks. No game number, no registration value, no tolerance and not how CHK-026 measures changes (the harness reads the registered head box through the plane the engine drew; it is untouched).
Presentation only (rule 1): `src/battle/**` and every headless `BattlePresenter*.ts` file are untouched; the one line in the presenter's three half (`BattlePresenterStage.ts`, which already imports `three`) calls a pass.

## The approach

1. **The target is the idle's head on screen.** For a plane whose painting has a registered head box and whose actor has a registered idle (the reference every pose is sized from), the engine scales the plane about its feet so the head box, projected through THIS frame's camera
   and the plane's own world transform, has the same size on screen (the square root of the projected quad's area, the harness's own `headSizePx`) as the idle's head box does standing in its own place under the same transform. Every pose is held to the same number, so a swap from any
   pose to any pose reads x1.00 (D-510 says "matches the old one's on screen": the old one is held to the idle too, or is the idle).
2. **Recomputed every frame from the camera**, never once at the swap (the paused run's note): a figure that was matched under one camera and is revived under another stays inside the tolerance, and nothing pops when the camera moves later (a camera move changes the factor by the
   camera's own, per-frame, tiny step). The factor is a pure function of the geometry of the frame (no history, no state to drift); it is solved with one first-order step and one refinement (the head moves a little when the plane scales about the feet, so the first step is good to about 0.2 percent and the second to 0.01).
3. **A factor on the table scale, bounded.** `factor` multiplies the pose's applied `scale` (the generated registration table's), clamped to 0.9 to 1.1 (the band `tools/pose-scale-check.mjs` already allows for a camera allowance). The clamp hit is reported (counters on the actor,
   one `console.warn` per actor and pose), so a head box that is wrong or a camera that is extreme shows up instead of being absorbed. A degenerate frame (a corner behind the camera, no area) leaves the table scale alone and is counted.
4. **Scaling is applied through the existing placement.** The plane's `PoseScale` is scaled linearly (`unitsPerPixel`, width, height, `offsetY`, `topY`, footprint and the content box all scale; the anchor row, `prone` and `clamped` do not), then `placeSlot` runs as always: the stance shift
   re-registers the feet on the idle's stance, a prone body is re-laid by `restPlacement` on the floor, the contact band and the shadow follow. So "about the feet" is the engine's own rule, not new geometry.
5. **No head box, no change.** A pose with no registered head, an idle with none, a plane of another subject than the reference (a dressphere's key staged for a change of costume), a stand-in, a figure-less part, a reference that lies down, an actor with a per-pose pixel shift (FF7's Film set) and an actor
   never handed a camera (cutscenes, portraits, the title) take exactly today's code path and today's numbers (a test compares the planes' transforms bit for bit). `?headlock=off` switches the whole thing off for A/B captures, as `?posereg=off` does for the table.

## Where the code lives

| Path | What | Lines (after) |
|---|---|---|
| `src/engine/HeadLock.ts` (new) | Pure maths, no `three`, no DOM: `HeadBox`, the band, `projectedHeadSize` (a head box through a 4x4 as plain numbers), `scaledPose`, `solveHeadFactor`, `HeadLockStats`, `headLockOff` | under 400 |
| `src/engine/HeadLockStage.ts` (new) | The three-aware stage pass: one view-projection per frame, handed to every actor | about 40 |
| `src/engine/PaintedActor.ts` | `PlaneSlot.base`/`lock`/`subject`; `sizeSlot` (the writes `applyPose` already did, in the same order); `holdHead(view)`, `lockHead(slot)`, `heldScale` (what `poseShape`, the strike solver's look at a pose, sees), `headLock` stats; `pickReference` keeps the idle's head box and `PoseScale` | 2,104 to 2,236 lines (143 added, 11 changed, comments included; a pre-existing breach of the 400-line house rule; the maths is in the two new files) |
| `src/engine/BattlePresenterStage.ts` | one call, **after** the actors' `update` and after `layProneFigures` (build: the first plan put it before; `layProneFigures` slides a body along the floor on the very frame it lies down, which is the swap frame, and would have moved the head after the factor was solved; a source-order test holds it) | +4 |
| `src/engine/PaintedArt.ts`, `PaintedScale.ts`, `PoseRegistration.ts`, `src/data/art/poseRegistrationTypes.ts` | the head box rides the registration row into `PoseMeta.head` exactly as `stanceX` does | +about 10 |
| `tools/posescale/measure.py` | `table` also emits `head`, from the record's `head` and `size` (fractions of the painting, four decimals): no re-measuring. Build: a foe with no face box has the 1 px stand-in `[0,0,1,1]` as its idle's head in the record (41 subjects); those emit none. 310 boxes in 36 subjects: the 8 FFX figures (Evrae among them), the 27 FFX-2 girls' dresspheres, Yunalesca's first form | +8 |
| `src/data/art/poseRegistration{Ffx,Ffx2,Foes}.ts` | regenerated by `measure.py table`; the unmodified generator first reproduced the committed files byte for byte, so the diff is the new `head` fields only | generated |
| `tools/pose-scale-check.mjs` | the table's head box must be the record's (and no row may carry one the record lacks) | +10 |
| `docs/ENGINE-API.md` | the two new members of the actor's API | +1 |
| `tests/unit/engine/head-lock*.test.ts`, `head-lock-fixture.ts`, `pose-registration-heads.test.ts`, edits to `pose-scale-art.test.ts` and `exp-leblanc.test.ts` | the proof (below) | each under 400 |

The three-aware code sits in `src/engine/` (not in `src/battle/**`, not in a headless `BattlePresenter*.ts` file); the pure maths has no import of `three` and is tested without it. Public API added to `PaintedActor`: `holdHead(view)` and the readonly `headLock` stats; nothing existing is renamed, so
`tests/unit/critic-continuity-contract.test.ts` (the probe's field names: `slots`, `active`, `_alpha`, `showFigure`, `poseUrls`, a plane's `mesh`, `fade`, `pose`, `meta`, `painted`) and `src/engine/fx/mix/downed.ts` (which reads `slots`, `active`, `poses`, `reference`, `extents`, `worldHeight`) stay true.
No file of `docs/CONTRACTS.md` is touched, so there is no `CONTRACT-CHANGES.md` entry.

## What the change can break, and how it was made to fail soft

| Risk | What could go wrong | Guard |
|---|---|---|
| **KO falls** | The collapse tilts, yaws and squashes `inner` (both planes) while the standing painting buckles; a head matched against a tilted idle could read wrong | The reference is measured under the SAME `inner` transform as the plane, so rotation, yaw, squash and breathing cancel (the ratio of two box areas is invariant under a common linear map); only the perspective difference is left, which is exactly what the factor removes. Tested with a yawed, tilted, squashed `inner`. Build: what a common transform does NOT cancel is a head's depth, and the lying head sits a metre to one side of the pivot the 26 degree interim yaw turns about, so as the yaw eases out after a collapse the lying head's depth moves and the factor follows it: the head on screen varies by 1.4 percent in all (the table's scale lets it drift 3) and the body's scale moves about 2.5 percent in half a second, 0.25 percent a frame at most; pinned by a test; Phase 2 looks at a landing strip with the lock on and off |
| **Revives** | A body laid under one camera and risen under another | The factor is recomputed each frame from the camera in hand, and a plane re-pointed by `applyPose` is sized at once from the last pass's view, so it is never drawn unlocked. Tested: KO under camera A, camera moved to B, revive to idle: x1.00 |
| **Lunges and hops** | The actor moves toward the foe; the head box moves with it | Both planes ride the same `inner`, so a translation is common; the perspective of the new place is in the factor. Tested mid-lunge |
| **REDUCE MOTION** | A size that "breathes" with the camera would be new motion | With a still camera (REDUCE MOTION stops the idle sway, `ComfortCamera.ts`) the factor is constant to 1e-3 whatever the idle breath does; a camera move changes it by the camera's own small per-frame step, never a step of its own. No setting is read by the lock, and the lock adds no tween |
| **Boss scale (`scaleLock.ts`, `staging.ts`)** | The framing measures a boss's painted box; a size that moves with the camera feeds back | BOSS SCALE is a group scale on the actor: it multiplies both planes alike and cancels. Build: two bosses have head boxes beyond their idle's, Yunalesca's first form (Chapter II) and Evrae (Chapter VIII, FFX); every other foe has only the idle's, which is the reference and is never scaled, so Natus, Bahamut, Braska's Final Aeon, Yojimbo, Vegnagun and Sin read the same planes as before and the colossus plans, their locks and the 1.15 Yojimbo hold are untouched. Evrae's range director swaps the pose map at NEAR and FAR: FAR's `idle-far` has no record, so the actor has no head reference there and nothing is held; NEAR holds Evrae's attack, breath charge and hurt to his near idle's head (the sweep asks at most 2.3 percent of them at cameras up to 1.10) and the group scale the director sets rides on both planes. Phase 2 runs Chapter VIII with the lock on and off |
| **The experiment's namespace art** | `exp-leblanc-<subject>` rows are copied from the base rows by `tools/exp-art-table.mjs`, and `tests/unit/exp-leblanc.test.ts` says a placeholder pose is "registered exactly as its base painting is" | `cleanRow` keeps four keys, so the generated exp table keeps NO head box and stays byte-identical: the hidden chapter is unlocked by construction (a test says so), and the one assertion that compared whole rows now compares them without `head`, with the reason in a comment. Carrying heads into the hidden chapter is one line in `cleanRow` plus a regeneration and is the driver's call (open question 1) |
| **The phone** | A portrait canvas, a wider lens, no BOSS SCALE | The size is measured in NDC (the same constant for both boxes), so the canvas shape cancels; the camera is the camera in hand. Phase 2 runs one phone chapter |
| **Both games** | FFX-2's dresspheres re-point pose names at another subject's paintings; the twirl stages keys | The lock needs plane and reference to be the same art subject, and `twirl-*` keys have no record (`skip`); a plane of another subject keeps its table scale |
| **Strike solver and HUD** | `poseShape` (the strike solver's look at the pose a blow lands in) and `downQuadOf` (where a body would lie) size a pose from the table, not from the lock | Build: `poseShape` now sizes the pose the way the lock would hold it (`heldScale`, read-only, same code path), and a test pins it equal to the drawn plane's `contentQuad` for a pose that is not showing yet and for one that is; `downQuadOf` is an estimate padded by a tenth of the body's length and is left. `contentQuad`, brackets, the shadow and `layProneFigures` read the live (locked) plane and stay consistent |
| **A bad head box** | The record's heads are good to about 4 percent (ruler readings) | The lock trusts the record exactly as the table's `scale` already does (same reading), so it adds no new error; a box that needs more than the band is clamped and reported |
| **Cost** | Per frame, per visible plane: two evaluations of a matrix product and four corners | Measured: 2.2 microseconds per actor per frame with two planes held (8 actors: 0.02 ms of a 16.7 ms frame); a few small objects per plane, no per-frame vectors (module scratch); Phase 2 reads the fps |

## What could regress, and how it is proved

**Phase 1 (tonight, CPU only):**
- `npx tsc --noEmit` clean; the touched test files one at a time; the full suite once at the end.
- Unit tests against an independent re-implementation of the harness's own measurement (`critic/runner/lib/continuity-pure.mjs`: the four projected corners, the projective square-to-quad map, `headSizePx`): a KO and a hurt pose against the idle through real `PerspectiveCamera`s at perspectives 0.98, 1.0, 1.04; the clamp; a revive under a moved camera;
  a control showing the unlocked jump (the same scene with the lock off reads x1.03 to x1.05 and x0.97); no head box means the table scale exactly (the planes' matrices compared); the hidden chapter's rows carry no head.
- A sweep over every registered figure with the real table (`head-lock-sweep.test.ts`): 1,096 plane-evaluations over cameras 0.98 to 1.10 and none hits the band (median ask 1 percent, largest 8.8); the Macalania victory camera (1.17 to 1.23) asks 1.102 of three poses that never stand under it.
- `node tools/pose-scale-check.mjs` (the table is the record's, heads included); `node tools/orphans.mjs` (the two new modules are imported); the probe's contract test; the registration, exp and pose-install tests.

**Phase 2 (the driver says "go heavy"; not run tonight):** a production build of this branch and the continuity harness (`critic/runner/lib/continuity.mjs`, real keys, headless Chromium on the GPU, seed 1, 1600x900) on Chapter V and Chapter XVII (the failing ones; several runs each, the swap that failed on 39.2 must read within 3 percent in every run),
then Chapters I, II, VII, IX, XVIII and the hidden chapter as controls (CHK-026 must stay PASS, CHK-027 must not move beyond its noise, the fps must stay at 58 or more), each with `?headlock=off` as the same-build baseline so the before and after are one build. Read the clamp counters at the end of every chapter (`headLock.snapshot()` through the probe's own path).
The chart of every KO swap's head ratio against the camera's perspective, redrawn (it should be flat at 1.00), and battle-size strips of the two failing swaps. A visible change of a percent or two to figure sizes: Bailey looks (rule 9: the before and after side by side).

## Not changed

The registration values (`scale`, `stanceX`, `feetRow`, `upright`, the camera allowances and `KO_PROJECTION`, which the lock simply starts from), CHK-026 and its tolerances, the harness, `src/battle/**`, every game number, the presenter's events, `KoPoseScale.ts`, BOSS SCALE, the framing, the hidden chapter's table.

## Open questions

1. The hidden chapter (FFX-2 only) is left unlocked. Locking its placeholder figures needs `cleanRow` in `tools/exp-art-table.mjs` to keep `head` and a regeneration of `poseRegistrationExp.ts` (its inputs are the art on this disk); the exp test would then pass unchanged. The driver's call.
2. The camera allowances (Yuna's and Rikku's victory, Yuna's critical) and `KO_PROJECTION` are now redundant (the lock starts from them and moves off them by what the camera needs); they are left in so the table, the record and `pose-scale-check` agree and the lock's starting point is the proven one. Removing them is a later, separate clean-up.
