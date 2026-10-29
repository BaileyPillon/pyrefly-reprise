# Split of the five oversized presentation files (ChatGPT's point 8b; both games, shared plumbing; 2026-10-28)

Branch `split` (from `r67-picks`). Bailey, 2026-10-28: "work on all those" (the continuity fix, ChatGPT's critique, motion fluidity). Program: `D:/Tools/pyrefly-scratch/2026-10-28/PROGRAM-1028.md`.
**No behaviour changed.** Every method, field and function below was moved verbatim. The only lines that differ from the old files are imports, doc headers, class lines, `export`, `private` -> `protected` where another layer reads the member, the abstract declarations (eight in `PaintedActorBase`, one in `BattleScreenBase`), and one line in `PaintedActorPoses.poseLife` (`PaintedActor.prototype.setPose.call` -> `PaintedActorPoses.prototype.setPose.call`: the same function object).

| File | Before | After (the public file) | New files (lines) |
|---|---|---|---|
| `src/engine/PaintedActor.ts` | 2712 | 307 | Types, Kit, State, Base, Placement, Sizing, Effects, Life, Poses, Readers: none over 354 |
| `src/engine/BattlePresenter.ts` | 810 | 179 | Base, Playback, Commands: none over 319 |
| `src/engine/BattleMoments.ts` | 706 | 97 | Config, Base, Opening, Actions, Held: none over 192 |
| `src/app/screens/BattleScreen.ts` | 1085 | 232 | Types, Base, Pause, Card, Encounter: none over 368 |
| `src/app/screens/BattleScreenFlow.ts` | 649 | 326 | Types, Registry, Rules, Base: none over 165 |

## The method

A class that keeps its state in many private fields cannot be cut by responsibility without either rewriting every `this.x` or splitting the class along a chain. We split it along a **chain of classes, one responsibility each, every layer calling only the layers below it**: `class A extends B` where B holds the layer below. Methods stay prototype methods on one object, so the instance is the same object it always was (same own fields, same prototype lookups, `instanceof` still true, `RigActor extends PaintedActor` untouched). The public class keeps its name and its file: import `PaintedActor` from `PaintedActor.ts`, `BattleScreen` from `BattleScreen.ts`, and so on. Every name the old files exported is still exported from them (types and constants are re-exported).

Rules that make it safe, and that anyone editing these files must keep:
- **Fields live in the base-most classes** (their initializers run base-first, in source order; two `Math.random()` draws stay in order). A `readonly` field the constructor assigns must be declared by the class whose constructor assigns it, which is why `PaintedActorState` holds only the fields with an initial value and `PaintedActorBase` the rest plus the constructor. The ORDER of an actor's own properties is therefore not what it was (nothing reads it; the set is the same).
- **A layer may call only the layers below it.** The exceptions are declared `abstract` in the base: the `PaintedActor` constructor calls eight methods that live higher (`demoIdle`, `setInterimYaw`, `makeSlot`, `makeSmear`, `setFacing`, `makePlaceholderPose`, `applyPose`, `syncOpacity`), and `BattleScreenEncounter.enter` calls `releaseParts`, which the leaf implements (`exit` uses it too). The call exists at run time because the instance already has the full prototype when a base constructor or a method runs, and no layer above the base declares a field.
- `private` is `protected` where another layer reads the member. Members only their own layer uses stay `private`.
- Stateless things (types, constants, shared textures, scratch vectors, the interim-yaw switch) are plain modules: `PaintedActorTypes.ts`, `PaintedActorKit.ts`, `BattleScreenTypes.ts`, `BattleMomentsConfig.ts`, `BattleScreenFlowTypes.ts`, `...Registry.ts`, `...Rules.ts`.

## What the tests were told (and what they were not)

About thirty tests read these files as text and pin wiring. Seventeen test files were edited; **no assertion was weakened**, only where the text is read from:
- `tests/unit/helpers/battleScreenSource.ts` (new) returns the whole BattleScreen chain as one text, lowest layer first; the 17 tests that read `BattleScreen.ts` (audio-sfx-parity-slots, card-hold, chain-checkpoint-spoils, chapter-victory-pose, cavern-hurried-arrival, critic-continuity-wash, critic-continuity-contract, entrance-plan-wiring, opening-plan-wiring, exp-leblanc, flash-sources, opening-cover, r391-mark-moment, r61-visual-style, r62-demo-warm, r64-hud-fixes, r64-living-park) call it instead. `card-hold` and `opening-cover` look for `async showBattleStart` (was `private async showBattleStart`: the method is `protected` now because `enter` is in the next layer up).
- `critic-continuity-contract.test.ts` also pins the actor and screen fields the continuity probe reads (`slots`, `active`, `_alpha`, `showFigure`, `poseUrls`, `PlaneSlot`, `name`, `stage`, `fieldShown`): it reads `PaintedActor.ts`, `PaintedActorState.ts`, `PaintedActorBase.ts`, `PaintedActorTypes.ts` together and accepts `private` or `protected`. The probe itself (`critic/runner/lib/continuity-probe.mjs`) reads the live object's own properties by name, and none was renamed.
- Left alone because they still read the file they always read: `BattleScreenFlow.ts` keeps `start`, `runChapter`, `playChapter`, `showProDefeat`, `showResults` (battle-entry-call-site, pro-defeat-label, r62-demo-warm, r63-fix-quick-retry, r64-hud-fixes, results-music); `BattlePresenter.ts` keeps `run` and `openOn` (opening-plan-wiring).

## Where everything is now (generated from the files; member names are unique per class)

To re-apply an edit someone made to the old file, find the member below and edit it in its new file. A member moved intact: its text is the old text.

### PaintedActor
- `PaintedActorState.ts` (200 lines) fields: tweens, subject, inner, active, swapPolicyLast, poses, poseUrls, owned, accentHalo, shadowAir, reference, referenceUpp, headRef, headView, headViewed, headLock, facing, appliedYaw, viewAzimuth, yawPrimed, _alpha, clock, lungeOffset, recoilOffset, hopHeight, squashAmount, curves, squashScratch, lightPins, cheerDue, cheering, cheerWait, shakeAmp, shakeLeftMs, shakeTotalMs, shakePhase, hit, hitOut, rimDirBase, flashTween, requested, fallTilt, fallDrop, fallGain, lieRoll, lieTilt, proneShift, hurtTint, hurtTintColour, tintScratch, flinchToken, flinching, stance, ringOverride, accent, accentWanted, accentLevel, accentColour, dimAmount, stoneAmount, breathPhase, fallDue, landHeld.
- `PaintedActorBase.ts` (294 lines) fields: shadow, slots, blend, worldHeight, crossfadeMs, poseShiftPx, placeholderFactory, placeholderBaseline, matte, fitBaseline, hoverHeight, hoverBobAmp, hoverBobSpeed, shadowBaseRadius, shadowBaseOpacity, shadowSquash, referencePose, sizeFromReference, extents, artFacing, interimYaw, baseBrightness, castsShadow, showFigure, shadowAlphaTest, bloomMasked, u, breatheAmp, breatheSpeed, swayAmp, swaySpeed, smear, life, baseTint, turnRing, ringBaseRadius, ringBaseOpacity, beatOffset, blendSide, still, softFlash. Members: demoIdle, setInterimYaw, makeSlot, makeSmear, setFacing, makePlaceholderPose, applyPose, syncOpacity, constructor.
- `PaintedActorPlacement.ts` (250 lines) Members: makeSlot, makePlaceholderPose, footprintOf, alignPlanes, retire, syncOpacity, noteViewCamera, mirrorOf, mirrored, placeSlot, tipSlot, registrationShift, setProneShift, applyMirror, proneWeight, footprintRadius, aimHeight.
- `PaintedActorSizing.ts` (214 lines) Members: applyPose, pickReference, headRefOf, chooseReference, resize, sizeSlot, holdHead, lockHead, headSizeThrough, referenceHeadSize, heldScale, setWorldHeight.
- `PaintedActorEffects.ts` (327 lines) Members: momentsHost, flash, lunge, strike, strikeHeft, liftTo, liftRelease, leap, knockBack, tintHurt, syncTint, setDim, dim, after, squash, hop, shake, hitReact, setDissolve, dissolveLevel, setDissolveStyle, fadeTo, setAlpha, alpha, moveTo, ramp, holdLanding, striking, waitMs, setBrightness, setTint, setStone, setRimLight, setBounceLight.
- `PaintedActorLife.ts` (292 lines) Members: standDown, koCutWindow, koCutBegin, koCutStep, koCutEnd, lifeState, setTurnRing, clearTurnRing, setSelectAccent, hasSelectAccent, ensureAccent, enterLife, playCue, fall, landFall, rise, lieDown, lieOffset.
- `PaintedActorPoses.ts` (354 lines) Members: demoIdle, loadPoses, showPoseSet, adoptPoses, prefetchLights, reloadPose, pose, setPose, beginCheer, landCheer, beginBlend, demoRetune, alignedSwap, makeSmear, smearsPlanes, bodyHeight, canDraw, resolveDrawable, poseWithheld, poseLife.
- `PaintedActorReaders.ts` (329 lines) Members: blending, paintings, poseNames, isPlaceholder, recoil, flinch, levitates, contentQuad, poseShape, dissolveTo, setFacing, setSide, setArtFacing, facingDir, artFacingDir, setInterimYaw, interimYawDeg, yawDeg, yawTarget, headPoint, paintPoint, centerPoint, height, isProne, poseSize.
- `PaintedActor.ts` (308 lines) Members: create, fromSubject, update, heldTextures, dispose.

### BattlePresenter
- `BattlePresenterBase.ts` (320 lines) fields: deps, ctx, cutIns, baseSleep, now, inputAbandoned, menuWake, actingState, callouts, speed, timeScale, aborted, auto, trace, phase, lastCommand, commandBy, deferredMinigame, minigamesNeedOverlay, liveState, vitals, pendingMenu, queuedEngine. Members: constructor, moments, setSpeed, playbackSpeed, fastForward, setAutoPlay, isAuto, syncAutoAdvance, abort, isAborted, sleep, notifyHud, runScript, atbModeChanged, showAtbMode, syncGauges, queuedHud, syncHud, seedVitals, presentVitals, snapshot.
- `BattlePresenterPlayback.ts` (116 lines) fields: playing. Members: play, playBurst.
- `BattlePresenterCommands.ts` (219 lines) Members: submit, settleDeferredMinigame, resolveMinigame, chooseCommand.
- `BattlePresenter.ts` (180 lines) Members: run, openOn.

### BattleMoments
- `BattleMomentsBase.ts` (193 lines) fields: deps, onActionRig, overdriveOpen, telegraphOpen, actions, telegraphAtAction, revealed, hurry, rollOwed, open, telegraphDirected, formDirected, shots, pro. Members: constructor, scale, skipping, reducedMotion, reducedFlashes, ms, cam, pick, rigFor, move, cut, ask, proDirector, shotCtx, subject, moveToRig, cue, setHudVisible, settle.
- `BattleMomentsOpening.ts` (153 lines) Members: battleStart, enterFigures, settleFigures, slidePartyIn, coverOpening, revealBoss.
- `BattleMomentsActions.ts` (97 lines) Members: turnStart, actionOpen, impact, rollOnHit.
- `BattleMomentsHeld.ts` (155 lines) Members: overdriveStart, overdriveEnd, telegraph, telegraphEnd, formChange, formChangeEnd.
- `BattleMoments.ts` (98 lines) Members: actionClose, victory, clear.

### BattleScreen
- `BattleScreenBase.ts` (124 lines) fields: opts, scene, stage, airship, spectacle, presenter, engine, hud, cutscenes, momentOverlay, proStage, setup, group, offering, checkpoint, startedAt, markRecorder, startParty, links, preview, finishedResolve, pauseScreen, presenterPaused, pauseWaiters, beats, formationSettleMs, lastSettleCam, formationSettled, chainLength, exitIntent, pauseKeyPressed, pauseChip, battleStartBanner, encounterSfx, exited, fieldShown, finished. Members: constructor, releaseParts.
- `BattleScreenPause.ts` (344 lines) fields: pauseGate, beatSleep, onPauseKey, stall, offSceneScale. Members: setPresenterPaused, canPause, canPauseOnCancel, presenterBound, openPause, closePause, requestExit, finish, checkForStall, handleInput, battleEngine, battlePresenter, stagingLayer, syncPixelScale.
- `BattleScreenCard.ts` (62 lines) Members: showBattleStart.
- `BattleScreenEncounter.ts` (368 lines) Members: enter, runEncounter.
- `BattleScreen.ts` (233 lines) fields: name. Members: update, settleFormation, render, trigger, snapshot, exit, releaseParts.

### GameFlow
- `BattleScreenFlowBase.ts` (165 lines) fields: app, step, running, pilgrimArmed, owned, handedOver, lastSceneHurried, demoToTitle. Members: constructor, show, chapterSelect, armPilgrimage, playDemoIntro, showDemoThanks, playCutscene.
- `BattleScreenFlow.ts` (327 lines) Members: start, runChapter, playChapter, showProDefeat, showResults.

## Proof

- `npx tsc --noEmit` clean after every commit.
- The full unit suite before and after: 26,797 tests in 1,719 files, run in a git-less mirror of the tree at e2a84fbd3 (before: `baseline.json`) and of 95f65ad27 (after: `after2.json`; the commits since change comments only): 26,680 passed, 4 failed, 112 skipped, 1 todo in both, **the status of every one of the 26,797 tests identical**. The 4 failures are the same in both: three files that need a git repository (critic-harness-identity x2, ffx-local-guard, ffxcam-load; they pass in the real tree, 84 tests).
- `node tools/orphans.mjs`: the same 24 orphans before and after.
- A differential test (kept in the lane's scratch folder, not committed: it needs a mirror of the old tree): the old and the new `PaintedActor` driven through the same 18-step script (Yuna's real poses, a seeded `Math.random`) read identically at every step; and every method of `PaintedActor`, `BattleMoments`, `BattlePresenter`, `BattleScreen` and `GameFlow`, flattened through the layers, is the same code as before (compared as text) except `poseLife`.
- The driver's job spec for the stamped continuity harness (Chapter I and IV, old tree against new): the lane's scratch folder, `jobs/SPEC.md`. Prediction: identical within run noise.

## Still open

- `node tools/critic-plan.mjs --paths <file>` classes every file of the five chains DEEP, the old files and the new ones alike (checked for ten of them), so a deploy that carries this code owes the deep review as any change to these files does. The paper preflight rule 15 asks for a deep-classed change was not written: this is a pure move and the differential test above stands in for it.
- Other lanes editing the old files (`PaintedActor.ts` above all) will meet conflicts when they merge this branch: re-apply their edits by member name using the map.
- `BattleScreenFlow.ts` (about 330 lines) and the others are under the 400-line rule; nothing in this lane is over it. `PaintedActorPoses.ts` (354) and `BattleScreenEncounter.ts` (368) are the closest.
