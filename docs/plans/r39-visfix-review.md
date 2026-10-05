# r39-visfix: paper preflight (AGENTS.md rule 15, `node tools/critic-plan.mjs --paths <the changed files>` = DEEP)

Written 2026-10-04 on branch `r39-visfix` (from main c3c4daba, release 38 plus the round 21 records), by the lane that fixes the visual,
animation and camera defects that hold Bailey's five visual sub-scores down (characters 8.2, enemies 7.8, animation 7.4, fidelity 8.2,
camera 7.9). Written with the build, after the first browser passes, and says so. Updated at the end of the lane (the run-in's second
pass and the measured items). Not merged, not deployed, not reviewed.

**Plan class:** `critic-plan` for the 24 shipped files (tip f2855e63): DEEP, because `src/engine/BattlePresenterStage.ts` is the shared
presenter's stage; a FOCUSED review of the production candidate before a deploy, live verification, then the DEEP review on the live build
after it. Not the save-data class (no `SaveData.ts`, no setting, no save key). Systems it names: Bevelle Underground scene, FFX-2 HUD,
battle presenter and lifecycle, effects/lighting/sprites, targeting/formation/camera. Checks: CHK-002, 003, 006 to 011, 013 to 017,
020 to 023. Targets: fight, pause, phone, presentation, scenes.

## What changes, by game case (rule 14)

| Item | Ticket | Game | Why that case |
|---|---|---|---|
| Hide the flourish's white column from the first frame; soften the fallback column | PR-0334 | FFX-2 only | only FFX-2 has a spherechange |
| Dressphere shot waits, starts at the change, searches past the grid, records its gate; the twirl starts before the outfit has loaded; a play another change takes over frees its textures | PR-0314 | FFX-2 only | the DRESSPHERE SHOT and the twirl keys are FFX-2's |
| Run-in truck fitted so no girl on her side leaves the frame: on the shot she runs on (with the held dolly and the window's slice) and on each rig the first hit may cut to; margin 3 % | PR-0364, PR-0347 | FFX-2 only | the run-in is sourced for FFX-2 only (`research/ffx2-combat-core.md` section 1); the A-1 framing rule is FFX-2's |
| Evrae cuts between poses | PR-0367 | FFX only | Chapter VIII's Evrae; the mechanism is shared plumbing and names one art id |
| Bevelle plate: conduits stay at the frame's edge, parallax layers' ends feathered | PR-0344 | FFX-2 only in use | Chapters IV and XIII stand on that plate |

Shared plumbing touched, so "both" at the code level and unchanged in behaviour for the other game: `BattleCamera.restCamera(withPush)`,
`pushTarget` and `rigOf` (only the run-in reads them), `FrameFit.rigPose` (the existing `pose` now calls it), `PresetCamera.shotRig` (only
the run-in's planner calls it), `SceneStaging.poseCutArt` (only the Evrae deck sets it), `ParallaxLayerSpec.featherSide` (only Bevelle's two
layers set it), `StageMotionPort.view()` gained an optional visible slice and `rect()` an optional `rig` and `cutRigs` (only the run-in reads them).

## What could go wrong, and what was run

1. **The twirl now starts before the new outfit has loaded.** Risk: a size pop when the stage's reference idle changes under a playing key.
   Each key carries a size for the idle standing now and one for the new idle; unit-tested (`r39-twirl-early`); looked at in frames with
   200 and 300 ms of art delay and with none. Risk: a load that never ends: the last key holds at most 4 s. Risk: two changes overlapping: the
   second replaces the first's play and the first's textures are released (tested).
2. **The shot now starts at the first frame and waits up to 0.6 s.** Risk: a shot over a menu or while an enemy acts: neither is possible
   (the gates are the old ones, `stepPending`, unit-tested including "a menu that stays up for the whole wait costs the shot"). Risk: a late
   cut: the shot's minimum hold counts from the cut, and it is not handed back for quiet while the twirl loads or plays (at most 3 s).
   Risk: the framing walk's cost: at most 24 rounds of 8 evaluations once per search, three searches 0.12 s apart.
3. **The run-in's truck is smaller where the cut rig leaves little room.** The first pass (fit on the shot she runs on, with the held dolly)
   still left Yuna 3 to 12 px out at the blow in Chapters IV and XIII, because the first hit cuts to another rig with the truck still on.
   The second pass judges every rig the A-1 rule could pick. Risk: a follow that is too short to read as a follow (Ixion's, Fallen Aeons'
   and Den of Woe's Paine runs are 0 to 0.2 of the old); the stop is scored under the truck it will run under, so the runner stays in
   frame. 1600x900, 7 chapters, 21 runs: no girl cropped (smallest left edge 49 px); 2000x1012, 2560x1080 and the 390x844 phone swept too.
4. **Evrae's cut.** Risk: a hard snap on the return from hurt. The bodies are identical pixels, only the head jumps.
5. **The Bevelle pipes move outward at wide windows.** Risk: none at 16:9 or narrower (scale 1); at 21:9 they are cut by the edge as
   designed. The plate and the painted wings are untouched.

## What is not built (needs Bailey; listed in `docs/handoff/r39-visfix.md`)

The chain-seam opening length (PR-0301, D-138 and the three r34fix questions), the reveal camera cropping Yuna at seams (PR-0347's seam
half), the Mortiphasm discs' layout against the party and the intent card (PR-0365), the dressphere shot's remaining refusals (a menu
already up from the next girl, an enemy cast in flight, a neighbour rule: 4 of 23 changes in the matrix), the white lamp bank behind
Bahamut's neck and the rim light's width on torn edges (PR-0316), the pause painting's size at 4K (PR-0293, a design cap), and the
side bands of the FFX plates at 21:9 (PR-0332).
