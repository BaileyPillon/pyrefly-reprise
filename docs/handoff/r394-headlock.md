# r394-headlock: the engine keeps the head steady (D-510), PHASE 1 built and tested, PHASE 2 owed

Date 2026-10-07. Branch `r394-headlock` (from `origin/r393-int` b80f772f = live 39.2 plus the hidden Leblanc chapter, release 39.3), worktree `D:/pyrefly-cf-switch`. **Nothing is merged, nothing is deployed, nothing is reviewed, and no build, browser or harness has been run** (Phase 2, when the driver says "go heavy").
Authority: Bailey, 2026-10-06 23:46:05 EDT, "Engine keeps the head steady (Recommended)" (D-510): the CHK-026 knock-out swaps of Chapter V (Rikku as Dark Knight, FFX-2) and Chapter XVII (Yuna, FFX) fail at the stage camera's tilt, so the engine sizes each painting so its head matches on screen. Paper preflight: [docs/plans/r394-headlock-review.md](../plans/r394-headlock-review.md) (critic-plan class DEEP; written first, corrected where the build found it wrong).
Game case: **both games** (shared actor layer; the cause is geometry, not a game number). No game number, registration value, tolerance or CHK-026 measurement changed (`critic/` is untouched). Presentation only: `src/battle/**` and every headless `BattlePresenter*.ts` file are untouched.

## In one screen

- **Every pose is held to the idle's head on screen, every frame.** For a plane whose painting has a registered head box, in an actor whose idle has one, the plane is scaled about the feet (the engine's own placement: anchor row on the ground, stance re-registered, a lying body re-laid by `restPlacement`) so that the head box projected through THIS frame's camera and the plane's own transform is as big as the idle's head box standing in its place under the same transform. Size = the square root of the projected quad's area: the harness's `headSizePx` up to a constant every box on a canvas shares (a test holds the two together). A swap from any pose to any pose then reads x1.00; a revive under a camera that moved since the fall does too.
- **The factor** multiplies the table's own `scale`, solved with one first-order step and one correction (the head moves a little as the plane scales about the feet: 0.2 percent before, 0.01 after), **clamped to 0.9 to 1.1**, and the clamp is reported (`actor.headLock.snapshot()`: planes held, skipped, clamped low and high, the factor's range, the worst raw ask, the last plane; one `console.warn("[headlock] ...")` per actor and pose).
- **Where the lock does nothing, the table's scale is bit-for-bit what it was:** a pose with no head box, an idle with none, another figure's painting, a stand-in, an actor with a per-pose pixel shift (FF7's Film set), a reference that lies down, an actor never handed a camera (cutscenes, portraits, title), the idle itself, and **the hidden Leblanc chapter** (its generated rows carry no head). `?headlock=off` switches the whole thing off for same-build A/B captures.
- **Measured here (CPU only, real classes, real tables, real cameras):** Yuna's real rows under cameras of perspective 0.98 / 1.00 / 1.04 read, with nothing holding her, idle to KO x1.041 / x1.023 / x0.989 (the evidence: x1.04, x1.03, x0.972 to 0.985); with the lock, **eight swap pairs at each camera read within 0.006 percent at the cut and within 0.26 percent on every later frame**, through the fall's tilt, the 26 degree interim yaw, a lunge and a squash. A sweep of every registered pose against its idle with the real table (1,096 plane evaluations: 274 poses at four cameras, 0.98 to 1.10): median ask 0.5 percent, 90th percentile 3.0, largest 8.8, **no band hit**. The KO factor moves 0.956 to 0.966 at perspective 0.98, 0.976 to 0.980 at 1.00, 1.002 to 1.022 at 1.04.

## What is built

| File | What |
|---|---|
| `src/engine/HeadLock.ts` (new, 197 lines) | Pure (no `three`, no DOM): `projectedHeadSize`, `scaledPose`, `solveHeadFactor`, `HEAD_BAND`, `HeadLockStats`, `headLockOff` / `setHeadLockOff` |
| `src/engine/HeadLockStage.ts` (new, 26 lines) | `holdHeads(staged, camera)`: updates the camera's matrices (the rig has set position and look-at, the renderer has not yet), one view-projection per frame, handed to every actor's `holdHead` |
| `src/engine/PaintedActor.ts` (2,104 to 2,236 lines: 143 added, 11 changed; the 400-line limit is a pre-existing breach) | `PlaneSlot.base / lock / subject`; `sizeSlot` (the writes `applyPose` already did, same order); `holdHead(view)`; `lockHead`; `referenceHeadSize`; `heldScale` (what `poseShape` sees); `headLock` |
| `src/engine/BattlePresenterStage.ts` (+4) | the one call, after the actors' `update` and **after `layProneFigures`** |
| `PaintedArt.ts`, `PaintedScale.ts`, `PoseRegistration.ts`, `data/art/poseRegistrationTypes.ts` | the head box rides the registration row into `PoseMeta.head` exactly as `stanceX` does; `subjectOfPainting(url)` |
| `tools/posescale/measure.py` | `table` emits each pose's `head` (the record's box over the painting's size, four decimals); a foe's 1 px stand-in `[0,0,1,1]` registers none |
| `src/data/art/poseRegistration{Ffx,Ffx2,Foes}.ts` | regenerated: **310 head boxes, 36 subjects** (the 8 FFX figures with Evrae, the 27 FFX-2 girls' dresspheres, Yunalesca's first form). The unmodified generator reproduced the committed files byte for byte first; stripped of the `head` fields the new files equal the old ones |
| `tools/pose-scale-check.mjs` | the table's head box must be the record's, and none the record lacks (PASS on the art on this disk) |
| `docs/ENGINE-API.md` | `holdHead`, `headLock` in the actor's instance API |

## What the build changed in the plan (all in the plan's text, marked "build:")

1. **The pass runs after `layProneFigures`**, not before: that function slides a body along the floor on the very frame it first lies down, which is the swap frame, and would have moved the head after the factor was solved (a source-order test holds it).
2. **`poseShape` sees the held size** (`heldScale`, read-only, same code path): the strike solver aims at the pose a blow lands in before it is showing; left at the table's scale it would have disagreed with the drawn plane by the factor, a few px at contact. Pinned equal to the drawn plane's `contentQuad` for a pose not yet showing and for one that is.
3. **Evrae has head boxes** (5 of 5 poses), so he is locked at NEAR range (at most 2.3 percent asked); at FAR the pose map is swapped for `idle-far`, which has no record, so nothing is held. Only him and Yunalesca's first form among the bosses; every other foe has the idle's box alone (the reference, never scaled).
4. **41 foe idles carried a bogus box** in the record (the 1 px stand-in `[0,0,1,1]`, 351 boxes before and 310 after); the generator now skips them (a test on the box size catches it).
5. **The hidden chapter is unlocked by construction**, and one assertion of `tests/unit/exp-leblanc.test.ts` changed because of it (see the open questions).

## What the evidence says that Phase 2 should expect

- **A transient the lock follows.** The planes share the figure's transform, so rotation, yaw, squash and breath cancel; a head's depth does not, and a lying head sits about a metre to one side of the pivot the 26 degree interim yaw turns about. As the yaw eases out after a collapse (about half a second) the lying head's depth moves 3 percent, and the factor follows it: the head on screen varies by 1.4 percent in all (30.7 to 31.2 px at 1600 wide: the idle it is held to changes with the yaw too) where the table's scale lets it drift 3 (32.4 to 31.5 px), and the body's scale takes the difference, 2.5 percent in half a second, 0.25 percent a frame at most (test: `head-lock-actor-edges.test.ts`, "through the collapse"). It is the lock doing what it is named for; Phase 2 should look at a battle-size strip of a landing with the lock on and off to be sure it reads as nothing.
- **The camera allowances (Yuna's and Rikku's victory, Yuna's critical) and `KO_PROJECTION` are now redundant** and left in: the lock starts from them and moves off them by what the camera needs (at a flat camera it takes `KO_PROJECTION` back out: the KO factor is 0.978 at perspective 1.0). Removing them would be a later, separate clean-up.
- **Close cameras graze the ceiling:** at the Macalania victory camera (perspective 1.17 to 1.23) three poses that never stand under it ask 1.102 (Rikku Gunner's and Yuna Gunner's KO, Rikku Lady Luck's attack) and are held at 1.1 and reported. Inside 0.98 to 1.10 nothing hits the band.
- A camera cut changes the factor in the frame of the cut (up to a few percent in one frame, the same as the picture changes); CHK-026 leaves the swaps within a frame of a cut out, and a few percent of a head centre is a few px against CHK-027's 24 px jerk minimum.

## Tests (each file one at a time, and the whole suite once)

| File | Tests | What it holds |
|---|---|---|
| `tests/unit/engine/head-lock.test.ts` | 13 | the maths: projected size equals the harness's `headSizePx` for standing, rolled and mirrored planes at four cameras; `scaledPose` equals `computePoseScale` with the scale multiplied; the solve, the band, the degenerate frame; the stats; the switch |
| `tests/unit/engine/head-lock-actor.test.ts` | 11 | the REAL `PaintedActor` under real cameras at perspective 0.98 / 1.00 / 1.04 (read through the harness's own functions, never the engine's): eight pose pairs, from the first frame and every frame after, life layer and yaw on; the control (the failure without the lock); a mirrored figure; a prone shift; a lunge and a squash; `poseShape`; a revive under a moved camera, with the control of a factor fixed at the swap |
| `tests/unit/engine/head-lock-actor-edges.test.ts` | 16 | the clamp (both sides, reported once, counted); what is left alone to the bit (no head box, no camera, the idle, a fallback pose, a stand-in, another figure, a hand-shifted actor, a lying reference, a spherechange moving the reference); steadiness (a still camera, a drifting camera, the collapse); the stage's pass and its position in the frame; `?headlock=off` |
| `tests/unit/engine/head-lock-sweep.test.ts` | 1 | every registered pose of every figure with the real table under four cameras: none hits the band, the median ask is under 2 percent, the largest under 10 |
| `tests/unit/engine/pose-registration-heads.test.ts` | 7 | the 310 boxes are real boxes inside the painting, are the record's, come with the idle's, are found by a painting's address (also as the shipped `.webp`); **the hidden chapter's rows carry none** |
| edits | | `pose-scale-art.test.ts` (+1: the table's head box is the record's, a foe's stand-in registers none), `exp-leblanc.test.ts` (one comparison, see below) |

`npx tsc --noEmit` clean. `node tools/pose-scale-check.mjs` PASS. `node tools/orphans.mjs`: neither new module is an orphan. The probe's contract test (`critic-continuity-contract.test.ts`) and `src/engine/fx/mix/downed.ts`'s reads of the actor's fields are untouched and pass. **The whole suite, once, on the tip's code: 911 files passed (5 skipped), 13,523 tests passed (46 skipped, 1 todo), 342 s, exit 0** (log in the scratch folder). **Cost:** `holdHead` is 2.2 microseconds per actor per frame with two planes held (a throwaway benchmark: 8 actors are 0.02 ms of a 16.7 ms frame; `PaintedActor.update` is 0.5 for comparison).

## PHASE 2: what it must prove (the driver says "go heavy"; one build, one lane at a time on the GPU)

1. **The build.** A production build of this branch's code with no art copied (the lean build of `r392-boss-scale`: a copy of `vite.config.ts` with `build.copyPublicDir: false`, `PYREFLY_ART_WEBP=off`, junctions to `public/art`, `audio`, `fonts`, `fx`; `rmdir` each junction before emptying the folder, never delete art), `BASE_PATH=/` from PowerShell, `vite preview --port 4311 --strictPort --host 127.0.0.1`. No second copy of the build: the A/B is the same build with a query.
2. **The two that fail, several runs each (seed 1 and others): Chapter V `ffx2-vegnagun-shuyin` and Chapter XVII `sin-fins-core`.** `PYREFLY_BROWSER=gpu CONT_RAW_DIR=<raw> node critic/runner/lib/continuity.mjs --base=http://127.0.0.1:4311/ --evidence=<ev> --chapters=ffx2-vegnagun-shuyin,sin-fins-core --tag=r394 --summary=summary-<id>.json` (one browser at a time, three to five lanes was fine on 39.2). **Accept:** CHK-026 PASS in every run; every swap into or out of a KO with a registered head reads within 1 percent (the lock aims at x1.00; anything over 1 is a defect to explain, not a pass); the swaps that failed on 39.2 (Rikku Dark Knight x1.0309 and x0.965 in V, Yuna x1.0334, x0.9698, x0.9696 in XVII) are listed with their new ratios.
3. **The controls, same run shape: Chapters I `seymour-flux`, II `yunalesca`, VII `seymour-anima-macalania`, IX `yojimbo-cavern`, XVIII `sin-face`.** CHK-026 stays PASS, the worst head percent no larger than 39.2's (I 2.5, II 1.3, VII 2.4, IX 2.0, XVIII 1.6: expected to fall), feet unchanged (0.7 to 1.1 px), CHK-027 (snaps, ghosts, jerks) within the noise of the 39.2 run, fps 58 or more, no console error, no failed request.
4. **The same build with the lock off** for the picture and the chart: `--base='http://127.0.0.1:4311/?headlock=off&ab=1'` (the harness appends a slash to a base with none at its end, so keep the switch first). Redraw `docs/handoff/r392-size-evidence/perspective.mjs ko` (the KO ratio against the camera's perspective): flat at 1.00 with the lock, the slope of -1.1 to -1.4 per unit without. Battle-size strips (`CONT_CFG` as in r392-size's commands) of the two failing swaps, on and off, and of a collapse's landing (the transient above).
5. **The clamp counters, at the end of every chapter.** In the page (the probe's own path): `window.__pyrefly.app.screens.find((s) => s.name === 'battle').stage.actors` is a Map of `{ actor }`; for each, `actor.headLock.snapshot()`. Record planes, skipped, clampedLow, clampedHigh, min, max, worstRaw per figure; **every clamp is a finding** (a head box that needs more than 10 percent, or a camera more extreme than the table was read for), with the pose, the chapter and the raw ask. The `[headlock]` console warnings are the same data.
6. **The hidden chapter** is a control by construction (no head box in its rows): run `tools/exp-smoke.mjs` once with the lock on and once with `?headlock=off` and compare the frames at the same step: they must be identical. (The continuity harness does not know the chapter: it is reached by typing the word on the board.)
7. **Chapter VIII (Evrae, NEAR and FAR), Chapter II (Yunalesca) and one phone run** (390x844, touch, Chapter IX or IV): no throw, fps, Evrae's range changes unchanged, the phone's frames.
8. **Strike reach.** `poseShape` is kept consistent by test, but r391-reach's probe (closest painted gap of every lunge; scratch `D:/Tools/pyrefly-scratch/2026-10-05/r391-reach`, not in the repo) is the measure of record if the driver wants the strike geometry re-read: a few px of difference is the lock's own size change.
9. **Bailey looks** (rule 9; "a visible change of a percent or two to figures' sizes"): the before and after strips side by side, the two failing swaps and a collapse landing, battle size, 1:1.
10. Then, per the plan: focused review before any deploy, the deep review on the live build after (class DEEP).

## Open questions for the driver

1. **The hidden chapter (FFX-2 only) is left unlocked**, which cost one assertion: `exp-leblanc.test.ts` compared a placeholder pose's whole row with its base row; the base rows now carry `head`, the exp rows (generated by `tools/exp-art-table.mjs`, whose `cleanRow` keeps four keys) do not, so that one comparison now drops `head` from the base side with the reason in a comment, and a second assertion says the exp row has none. Locking the chapter's placeholder girls (those with no new idle) is one line in `cleanRow` plus `node tools/exp-install.mjs table` (its inputs are the art on this disk), after which the test passes unchanged: your call.
2. **`critic/CHECKS.md` CHK-026 item 6** says a build that applies the table "passes by construction ... not that the table is right"; with the lock the engine also holds the heads to the camera. I changed nothing in `critic/`; a sentence there (and in `critic/RUBRIC.md`'s note on the 7.0 caps) is yours.
3. **The band** is 0.9 to 1.1 as briefed. At the Macalania victory camera three poses ask 1.102; if you want them held, 1.12 would do it; I left the brief's number.
4. **Allowances and `KO_PROJECTION`** stay (redundant, harmless); removing them is a separate clean-up.
5. `PaintedActor.ts` is 2,236 lines (was 2,104), `BattlePresenterStage.ts` 941 (was 937) and `PaintedArt.ts` 916 (was 914): all over the 400-line rule before this lane; the maths went into the two new files, but the actor wants splitting some day.

## Not done, by instruction or by lane

No build, browser, harness or GPU. No `NOW.md`, ledgers or CHANGELOG entry (the driver's). No `critic-clear`, no deploy, no merge to `main`. `src/scenes/openingMark.ts` shows modified from line endings only (not this lane's; never staged). The old empty branch `r393-headlock` is left as it was.

## The commits

| commit | what | case |
|---|---|---|
| `242d748e` | the paper preflight (written first, corrected after the build) | both games; records only |
| `ff209ae7` | the head boxes in the generated tables (`measure.py table`, 310 boxes), the loader's plumbing into the pose meta, `pose-scale-check`'s head check, the table's tests, the one hidden-chapter comparison | both games; data and tooling, inert on its own |
| `34cc3e7e` | the engine: `HeadLock`, `HeadLockStage`, `PaintedActor`, the stage's call, `ENGINE-API.md`, the tests | both games; presentation only; needs the one before it |
| the last | this note | records only |

The tip is the last of these; the branch is pushed as `origin/r394-headlock` and nothing else is. The second commit is inert (nothing reads a head box until the third) and can stand alone; the third can be dropped alone and the figures draw as on 39.3.

## Commands

```
# the table, after the record changes (ComfyUI's embedded python: numpy, scipy, PIL)
D:/Tools/ComfyUI/python_embeded/python.exe -s tools/posescale/measure.py table ; node tools/pose-scale-check.mjs
# the tests of this lane, one at a time
node node_modules/vitest/vitest.mjs run tests/unit/engine/head-lock.test.ts      # then head-lock-actor, head-lock-actor-edges, head-lock-sweep, pose-registration-heads, pose-scale-art
node_modules/.bin/tsc --noEmit
```

## Scratch and disk

`D:/Tools/pyrefly-scratch/r394-headlock/` (small: the sweep's tables `sweep.txt` and `stats.txt`, the residual `resid.txt`, the full-suite log). No dist copies, no servers started, nothing under `public/art` written.
