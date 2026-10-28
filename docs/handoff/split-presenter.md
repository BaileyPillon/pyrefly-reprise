# Split of the five oversized presentation files (ChatGPT's point 8b; both games, shared plumbing; 2026-10-28)

Branch `split` (from `r67-picks`). Bailey, 2026-10-28: "work on all those" (the continuity fix, ChatGPT's critique, motion fluidity). Program: `D:/Tools/pyrefly-scratch/2026-10-28/PROGRAM-1028.md`.
**No behaviour changed.** Every method, field and function below was moved verbatim. The only lines that differ from the old files are imports, doc headers, class lines, `export`, `private` -> `protected` where a later layer reads the member, the eight abstract declarations in `PaintedActorBase`, and one line in `PaintedActorPoses.poseLife` (`PaintedActor.prototype.setPose.call` -> `PaintedActorPoses.prototype.setPose.call`: the same function object).

## The method

A class that keeps its state in many private fields cannot be cut by responsibility without either rewriting every `this.x` or splitting the class along a chain. We split it along a **chain of classes, one responsibility each, every layer calling only the layers below it**: `class A extends B` where B holds the layer below. Methods stay prototype methods on one object, so the instance is the same object it always was (same own fields, same prototype lookups, `instanceof` still true, `RigActor extends PaintedActor` untouched). The public class keeps its name and its file: import `PaintedActor` from `PaintedActor.ts`, `BattleScreen` from `BattleScreen.ts`, and so on. Every name the old files exported is still exported from them (types and constants are re-exported).

Rules that make it safe, and that anyone editing these files must keep:
- **Fields live in the base-most classes** (their initializers run base-first, in source order; two `Math.random()` draws stay in order). A `readonly` field the constructor assigns must be declared by the class whose constructor assigns it, which is why `PaintedActorState` holds only the fields with an initial value and `PaintedActorBase` the rest plus the constructor.
- **A layer may call only the layers below it.** The one exception is the `PaintedActor` constructor, which calls eight methods that live higher (`demoIdle`, `setInterimYaw`, `makeSlot`, `makeSmear`, `setFacing`, `makePlaceholderPose`, `applyPose`, `syncOpacity`): `PaintedActorBase` declares them `abstract`. The call exists at run time because the instance already has the full prototype when the base constructor runs, and no layer above the base declares a field.
- `private` is `protected` where a higher layer reads the member. Members only their own layer uses stay `private`.
- Stateless things (types, constants, shared textures, scratch vectors, the interim-yaw switch) are plain modules: `PaintedActorTypes.ts`, `PaintedActorKit.ts`.

## What was left in place, and why (source-text tests)

About thirty tests read these files as text. They pin wiring, so the code they read stays where they read it:
- `BattleScreen.ts` keeps `enter`, `showBattleStart`, `runEncounter`, `exit`, `render`, `trigger`, `snapshot`, `update` and the three fields `name`, `stage`, `fieldShown` (flash-sources, card-hold, opening-cover, chain-checkpoint-spoils, chapter-victory-pose, cavern-hurried-arrival, entrance-plan-wiring, opening-plan-wiring, exp-leblanc, r391-mark-moment, r61-visual-style, r62-demo-warm, r64-hud-fixes, r64-living-park, audio-sfx-parity-slots, critic-continuity-wash, critic-continuity-contract). `enter` alone is 224 lines, so the file stays about 630 lines until those tests are pointed at the new home of that code.
- `BattleScreenFlow.ts` keeps `start`, `runChapter`, `playChapter`, `showProDefeat`, `showResults` (battle-entry-call-site, pro-defeat-label, r62-demo-warm, r63-fix-quick-retry, r64-hud-fixes, results-music).
- `BattlePresenter.ts` keeps `run` and `openOn` (opening-plan-wiring).
- **One test changed**: `tests/unit/critic-continuity-contract.test.ts` pins the actor fields the continuity probe reads (`slots`, `active`, `_alpha`, `showFigure`, `poseUrls`, `PlaneSlot`). It now reads `PaintedActor.ts`, `PaintedActorState.ts`, `PaintedActorBase.ts` and `PaintedActorTypes.ts` together and accepts `private` or `protected`. The probe itself (`critic/runner/lib/continuity-probe.mjs`) reads the live object's own properties by name, and none was renamed.

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
- `BattleScreenBase.ts` (116 lines) fields: opts, scene, airship, spectacle, presenter, engine, hud, cutscenes, momentOverlay, proStage, setup, group, offering, checkpoint, startedAt, markRecorder, startParty, links, preview, finishedResolve, pauseScreen, presenterPaused, pauseWaiters, beats, formationSettleMs, lastSettleCam, formationSettled, chainLength, exitIntent, pauseKeyPressed, pauseChip, battleStartBanner, encounterSfx, exited, finished. Members: constructor.
- `BattleScreenPause.ts` (343 lines) fields: pauseGate, beatSleep, onPauseKey, stall, offSceneScale. Members: setPresenterPaused, canPause, canPauseOnCancel, presenterBound, openPause, closePause, requestExit, finish, checkForStall, handleInput, battleEngine, battlePresenter, stagingLayer, syncPixelScale.
- `BattleScreen.ts` (627 lines) fields: name, stage, fieldShown. Members: enter, showBattleStart, runEncounter, update, settleFormation, render, trigger, snapshot, exit, releaseParts.

### GameFlow
- `BattleScreenFlowBase.ts` (165 lines) fields: app, step, running, pilgrimArmed, owned, handedOver, lastSceneHurried, demoToTitle. Members: constructor, show, chapterSelect, armPilgrimage, playDemoIntro, showDemoThanks, playCutscene.
- `BattleScreenFlow.ts` (327 lines) Members: start, runChapter, playChapter, showProDefeat, showResults.

## Proof

- `npx tsc --noEmit` clean after every commit.
- The full unit suite before and after: same pass count (numbers in the commit that closes the lane, and in `D:/Tools/pyrefly-scratch/2026-10-28/split/`).
- `node tools/orphans.mjs`: the same 24 orphans before and after.
- The driver's job spec for the stamped continuity harness (Chapter I and IV) is in the lane's scratch folder; prediction: identical numbers within run noise.

## Still open

- `BattleScreen.ts` is about 630 lines (see above): the next cut is `enter` plus its pins.
- `critic/policy.json` lists `src/engine/BattlePresenter*.ts` and `src/engine/BattleMoments.ts` under the deep `battle-presenter` system; the new `BattleMoments*.ts` files do not match `BattleMoments.ts` exactly, and no pattern names `PaintedActor*.ts`, `BattleScreen*.ts` or `BattleScreenFlow*.ts` files as a group. `node tools/critic-plan.mjs --paths <new file>` will not class them like the files they came from until the patterns are widened (a policy change, the driver's call).
- Other lanes editing the old files (`PaintedActor.ts` above all) will meet conflicts when they merge this branch: re-apply their edits by member name using the map.
