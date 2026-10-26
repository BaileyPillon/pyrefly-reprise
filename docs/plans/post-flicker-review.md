# Paper preflight: the ready, idle, ready flicker (post-flicker)

Track `post-flicker`, step 2 of the post-conference motion plan, FFX-2 only. Rule 15 asks a deep-class change (`node tools/critic-plan.mjs --paths src/engine/KeyPoses.ts,src/engine/BattlePresenterBeats.ts` says
DEEP: shared battle presenter) for a 5 to 10 minute paper preflight before it is built. **This one was written beside the build, not before it** (the plan's own method check, `pose-continuity-method-check.md`
section 7, stood in for it; say so in the release note).

## Recommendation

Build it: one pure helper and one changed line, no new paintings, no change to any timing, FFX untouched by construction. Measure on the release tree's harness; stop before any art step if the number does not fall.

## The wrong assumption the plan carried, and the check

The plan said the cause was "not traced to a line" and that the harness's nearest event, a `damage`, made it look like a presenter repeat. Traced: the `damage` is the same burst (`turn-start, action-start, damage`) the engine emits at once
when the command is submitted; the swap's cause is `BattlePresenterBeats.turnStart` (`setPose('idle')`) followed 90 ms later by `actionStart`'s wind-up `ready`. Proved by running the real `FFX2Engine` with the real presenter
(`tests/unit/ffx2-ready-hold.test.ts`), not by reading.

## What could go wrong, and what pins it

| Risk | Pinned by |
|---|---|
| FFX changes | the helper is false unless `ffx2Framing`; FFX's turn start has no action behind it in its burst; test "does not hold outside the ATB"; Chapter I harness unchanged (657 ghost frames, 374 swaps, 61 ready/idle swaps, identical) |
| a figure stuck on `ready` | action-start always sets a pose; the hold only applies when the very next event of the same burst is her own wind-up attack |
| a cast, item or defend loses its idle | not held (their poses are their own); test "does not hold when the action is not an attack on the wind-up"; the real-engine test keeps `ready idle cast` |
| REDUCE MOTION or a girl with no painted `ready` | `windUpLeads` false: today's sequence; both tested |
| a foe or a figure in another pose (a flinch) | side and `pose === 'ready'` are required; tested |
| a new look | the strip and the pose log: the same paintings in the same order, `attack` at +39 frames, `follow` +48, `idle` +63 before and after; one side effect (the second weight-shift step) is disclosed in the handoff |
| the metric moving with the tool | ghost frames a minute is the plan's one measure; the baseline of the unchanged tree reproduces release 64 (153.5 against 147.3 a minute, 20 flickers against 22) |

## Stop rule

A run that misses the prediction (about 100.7 a minute, accept 105) stops the batch before any art step. It landed at 103.9.
