# r39-visfix: paper preflight (AGENTS.md rule 15, `node tools/critic-plan.mjs --paths <the changed files>` = DEEP)

Written 2026-10-04 on branch `r39-visfix` (from main c3c4daba, release 38 plus the round 21 records), by the lane that fixes the visual,
animation and camera defects that hold Bailey's five visual sub-scores down (characters 8.2, enemies 7.8, animation 7.4, fidelity 8.2,
camera 7.9). Written with the build, after the first browser passes, and says so. Not merged, not deployed, not reviewed.

**Plan class:** `critic-plan` for the ten shipped files: DEEP; a FOCUSED review of the production candidate before a deploy, live
verification and then the DEEP review on the live build after it. Not the save-data class (no `SaveData.ts`, no setting, no save key).
Checks the plan names: CHK-003, 006 to 011, 013 to 017, 020 to 023.

## What changes, by game case (rule 14)

| Item | Ticket | Game | Why that case |
|---|---|---|---|
| Hide the flourish's white column from the first frame; soften the fallback column | PR-0334 | FFX-2 only | only FFX-2 has a spherechange |
| Dressphere shot waits, starts at the change, searches past the grid, records its gate; the twirl starts before the outfit has loaded | PR-0314 | FFX-2 only | the DRESSPHERE SHOT and the twirl keys are FFX-2's |
| Run-in truck fitted so no girl on her side leaves the frame | PR-0364, PR-0347 | FFX-2 only | the run-in is sourced for FFX-2 only (`research/ffx2-combat-core.md` section 1) |
| Evrae cuts between poses | PR-0367 | FFX only | Chapter VIII's Evrae; the mechanism is shared plumbing and names one art id |
| Bevelle plate: conduits stay at the frame's edge, parallax layers' ends feathered | PR-0344 | FFX-2 only in use | Chapters IV and XIII stand on that plate |

Shared plumbing touched, so "both" at the code level and unchanged in behaviour for the other game: `BattleCamera.restCamera(withPush)` and
`pushTarget` (only the run-in reads them), `SceneStaging.poseCutArt` (only the Evrae deck sets it), `ParallaxLayerSpec.featherSide`
(only Bevelle's two layers set it), `StageMotionPort.view()` gained an optional visible slice (only the run-in reads it).

## What could go wrong, and what was run

1. **The twirl now starts before the new outfit has loaded.** Risk: a size pop when the stage's reference idle changes under a playing key.
   Each key carries a size for the idle standing now and one for the new idle; unit-tested (`r39-twirl-early`); looked at in frames with
   300 ms of art delay (the keys play from 0.12 s, the outfit lands under the held last key) and with none. Risk: a load that never ends: the
   last key holds at most 4 s. Risk: two changes overlapping: the second replaces the first's play (its textures are released).
2. **The shot now starts at the first frame and waits up to 0.6 s.** Risk: a shot over a menu or while an enemy acts: neither is possible
   (the gates are the old ones, `stepPending`, unit-tested including "a menu that stays up for the whole wait costs the shot"). Risk: a late
   cut: the shot's minimum hold counts from the cut, and it is not handed back for quiet while the twirl loads or plays (at most 3 s).
   Risk: the framing walk's cost: at most 24 rounds of 8 evaluations once per search, three searches 0.12 s apart.
3. **The run-in's rectangles now include the held push.** Risk: a stop chosen differently from the r38 sweeps. Re-run per chapter (handoff).
4. **Evrae's cut.** Risk: a hard snap on the return from hurt. The bodies are identical pixels, only the head jumps.
5. **The Bevelle pipes move outward at wide windows.** Risk: none at 16:9 or narrower (scale 1); at 21:9 they are cut by the edge as
   designed. The plate and the painted wings are untouched.

## What is not built (needs Bailey; listed in `docs/handoff/r39-visfix.md`)

The chain-seam opening length (PR-0301, D-138 and the three r34fix questions), the reveal camera cropping Yuna at seams (PR-0347), the
Mortiphasm discs' layout against the party and the intent card (PR-0365), hiding the guide and advisor cards during the dressphere shot (the
last frames Paine's shot cannot pass without), and the rim light's width on Bahamut's ragged edges (PR-0316's fringe).
