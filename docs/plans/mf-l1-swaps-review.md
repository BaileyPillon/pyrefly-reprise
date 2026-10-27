# Paper preflight: the swap lane of the motion-fluidity pass (mf-l1-swaps)

Track `mf-l1-swaps`, lane L1 "poses and swaps" of `D:/Tools/pyrefly-scratch/2026-10-26/fluidity/plan.json`: MF-01 (A, ON), MF-05 and MF-06 (B, behind switch words, default today). Rule 15 asks a deep-class change
(`node tools/critic-plan.mjs --paths src/engine/KeyPoses.ts,src/engine/BattlePresenterBeats.ts,src/engine/BattlePresenter.ts` says DEEP: shared battle presenter) for a short paper preflight.
**This one was written beside the build, not before it** (post-flicker's was the same; the plan's corrections section and the swaps audit stood in for it; say so in the release note).

## Recommendation

Build MF-01 on, because it is the sibling of a change that already measured as predicted and it changes no painting that the player sees twice. Build MF-05 and MF-06 as address words with today as the default and film
every variant before anyone flips a default: the plan's own rule for the B items (they change how motion looks, hard rule 9). Nothing in this lane flips a default.

## What could go wrong, and what pins it

| Risk | Pinned by |
|---|---|
| MF-01 reaches FFX or a foe | `ownNextAction` is false unless the presenter plays an ATB battle (`ffx2Framing`) and the figure is a party figure; `tests/unit/ffx2-interlude.test.ts` ("does not hold outside FFX-2, for a foe ...") and Chapter I is run as a control |
| a girl stuck on `ready` | `actionStart` always sets a pose; the hold applies only when the very next event of the same burst is her own `ability` or `item` and she has the painting of that pose; defend, summon and spherechange keep the idle (tested) |
| a spell whose painting is missing | not held (the pose would resolve to the idle anyway and the wait would only delay the drop); tested |
| REDUCE MOTION | `keysOn` false: today's sequence (tested) |
| a default moves | `stanceMode`, `causeMode` and `classes` read the address only; `today` is the default; the actor test "with every switch at its default" pins today's 120 ms blend and an empty planned-smear log |
| the switches play outside Chapter I and IV | every look is gated by `isDemoChapter(demoChapter())` and by `packDemo`; tested ("is today's outside the pack chapters", "a knock-out and the pack's other chapters are never touched") |
| a cut over an open FFX-2 command menu (D-357) | a cut asked for under `menuHolds()` becomes the 50 ms blend, never a cut or a flash (tested) |
| the planned-smear log excuses what it should not | a designed blend goes to its own log (`SwapLog.designed`), not to `smearLog`; a cut on its cause is logged with `cause` and, for a pair that is not big by the harness's numbers, `big: true`, so the harness reads it as a planned cut and not as an accident |
| `PaintedActor.setPose` grows | one option (`paint`) on an existing signature and one changed line, no new line; the 2,668-line file does not grow; `RigActor` and the `ActorHandle` port take the same optional field |
| the pinned harness moves | no harness file is edited; `tools/swap-classes.mjs` reads `continuity.json` and adds no field; every number is read by the tree's own continuity harness |

## Stop rule

A measure that misses its model by more than a tenth (MF-01 about 86 ghost frames a minute in Chapter IV, from post-flicker's 103.9; Chapter I unchanged at 657 frames) stops the batch before any B item is filmed.
A B item whose variant adds a snap, a swap jerk of 40 px or more, or a feet slide to the run is not offered to Bailey in that form.
