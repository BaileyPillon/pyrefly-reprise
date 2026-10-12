# r43-motion2: three boss cast-to-idle hard cuts, the Right Fin's slide, and "lunges do not walk back" (round 25: PR-0378, PR-0379, PR-0380 leftovers)

Date 2026-10-12. Written by the r43-motion2 lane for the release driver; branch `r43-motion2` (off `origin/main` 5a4c92b1). No ledger, NOW.md or CHANGELOG was edited here (they are the
driver's); suggested text is at the end. Nothing was looked at on a screen for Part A: every number below is the REAL `PaintedActor`, the REAL registration rows and the
harness's own `analyzeSwap` / `figureTrack` / `detectJerks` with `critic/policy.json`'s thresholds, read in vitest at 60 fps (the paintings' own alpha through the harness's
`decodeMask` where `public/art` is there). Part B (the entrance options page) is not in the game and not on this branch.

**Game case (rule 14).** The charge swap and the fins' registration are **FFX only** (Evrae is Chapter VIII, Sin's fins Chapter XVII; the range director is
`BattleScreenAirship.ts`'s and its header says FFX only; FFX-2 has no counterpart). The new `PoseSwapOptions.blend` on `PaintedActor.loadPoses` / `adoptPoses` is shared plumbing
(both games) that nothing but that director passes. The lunge finding is both games (shared plumbing); nothing in it was changed.

## What round 25 saw, and what it was

| | round 25 | cause found |
|---|---|---|
| PR-0378 (3 hard cuts) | Evrae cast to idle (Ch VIII), Left Fin and Right Fin cast to idle (Ch XVII): one frame, no blend | One mechanism. `AirshipRangeDirector.sync` swaps the **idle slot** for the charge painting (`breath-charge`, `charge-near`) the moment the engine's flag rises, which is usually while the presenter has the figure in `cast` (the action that lit it: `evrae-inhale`, `sin-fin-gathers`, 12 to 20 frames after the log's action-start). It did it with `actor.loadPoses(map, 'idle')`, which is a forced, immediate swap: the pose the presenter had chosen was thrown away in one frame. |
| PR-0378/0379 (Right Fin cast to idle: 346 px, IoU 0.097; 36 of the 44 severe double images) | a whole-silhouette change at every pose swap of the Right Fin | **Registration.** Release 391 (`b2e9616b`) registered the stance of 42 foes by the hem rule, the fins included. A fin is not a figure on its feet: its NEAR paintings are warps of the idle on the idle's own canvas (every sidecar says `registrationVsIdle` dx 0, dy 0). The rule read the Right Fin's attack at x 505 against the idle's 89.5 and slid that plane 416 painting px (2.78 world units) left of where it was painted. On the paintings' alpha the pair overlaps 0.770 where painted and 0.123 slid. The Left Fin's attack read only 3.5 px off, so it never showed. |
| PR-0380 "lunges do not walk back" | the fan: the attacker dissolves where it ended and stands again at its seat (Auron Ch II and I, Rikku Ch V) | **Not a defect in the code; nothing changed.** See below. |

## What changed (Part A)

- `src/scenes/evrae-airship-director.ts`: `sync` (a charge lit or spent, no range shift in flight, so the figure is on screen) calls `placeEvrae(range, true)`, which passes `{ blend: true }`.
  A bind and a range shift (which run behind the figure's own alpha fade) stay the plain immediate load.
- `src/engine/PaintedActor.ts` (+39 lines, -6): `PoseSwapOptions { blend?: boolean }` on `loadPoses` and `adoptPoses`. With `blend`: only the paintings that changed are loaded; the planes that show a replaced painting
  take the new one where they stand (same name, same fade: nothing moves on screen); then `first` comes up through the actor's own `PoseBlend` like every other pose change. A figure already resting on `first`
  takes the new painting in place (one name, nothing to blend between). Left out, nothing differs from before.
- `tools/posescale/overrides.json` + the record + the three generated tables (`measure.py measure sin-right-fin sin-left-fin --write`, then `measure.py table`; `tools/pose-scale-check.mjs` PASS): every NEAR painting of both fins
  stands at its canvas middle (stance 491 and 515), so no plane is slid. The table diff is those eight rows only; the record's diff is those stances (and drops the two idle rows' `[0,0,1,1]` head the current generator no longer writes; the tables never read it).
- Tests: `tests/unit/engine/boss-charge-blend.test.ts` (15), `tests/unit/engine/lunge-walk-back.test.ts` (6), and a new case in `tests/unit/chapters/evrae-telegraph.test.ts`.

## Measured, before and after (the real actor, 60 fps; the strips' camera is not on record, so pixel counts are this test's camera: the Right Fin's overlap reads 0.098 here against 0.097 in the strip, its ghost 0.409 against 0.411)

Cast (the action) then the charge painting swaps the idle slot, 14 frames in. "Before" = the old stances and the forced swap; "after" = this branch. Paintings' own alpha:

| | blend frames | hard cut / snap | overlap (IoU) | centroid shift | ghost severity | tracked centroid, biggest single-frame step | jerk events |
|---|---|---|---|---|---|---|---|
| Evrae, before | 0 | yes / yes | 0.855 | 5.6 px | 0 | 10.7 px | 0 |
| Evrae, after | 7 | no / no | 0.854 | 5.7 px | 0.066 | 2.0 px | 0 |
| Left Fin, before | 0 | yes / yes | 0.874 | 16.7 px | 0 | 21.1 px | 0 |
| Left Fin, after | 7 | no / no | 0.884 | 17.7 px | 0.053 | 4.6 px | 0 |
| Right Fin, before | 0 | yes / yes | 0.098 | 262.7 px (strips: 346) | 0 | **252.3 px** | 1 |
| Right Fin, after | 7 | no / no | 0.372 | 89.1 px | 0.285 | **18.2 px** | 0 |

The Right Fin on a plain dissolve with the old stances (the 36 severe double images): ghost severity **0.409**, tracked step 55.7 px (a CHK-027 jerk). Today: **0.285** (under the check's 0.40), step 18.2 px, no jerk.

## What was not done, and why

1. **The Right Fin's remaining vertical offset (a question, not built).** After the registration fix the Right Fin's attack and idle overlap 0.37, not the 0.77 of the two canvases laid on each other. The rest is the engine's
   OLD rule that plants every painting's lowest opaque row on the ground (`PaintedArt.ts`, `measureAlpha`; the record's `baseline`): the attack's lowest row is 775 of 947, the idle's 929, so the attack sits 154 painting px higher than
   the idle. Its sidecar says "set baselineY to the idle's (930)" and the engine overrides it. That planting is what Bailey has seen since the art was approved (2026-10-02, D-325), so moving it is a visible change, not a restore:
   a one-row hand `feetRow` for the fins' attack (the generator has no hand `feetRow` yet: a few lines in `measure.py`) would lift the overlap to about 0.77. Say the word and it is done and measured the same way.
2. **"Lunges do not walk back": no defect.** `tests/unit/engine/lunge-walk-back.test.ts` pins it. On the real actor the figure slides home over 11 to 12 frames (183 to 200 ms, the move's `settle` beat), on a smooth ramp, never faster than
   its own approach (house lunge: approach 0.46, return 0.19 world units a frame; solved reach 4.4, the cap: 0.74 and 0.59, about 54 px; a unit is about 90 px at 1600 wide). A second lunge begun during the first's return does not drop
   to home (the first one's completion writes no zero over it). What reads as "dissolves where it ended" is the staging around a correct slide: the return starts only when the blow lands (the contact hold), the first hit hard-cuts the camera to
   the struck figure (`BattleMoments.impact`) so the slide home plays under the other shot, `actionEnd` puts the idle painting up through the 140 ms blend in the same breath over paintings that barely overlap (Auron's attack to follow reads 0.20),
   and a long solved reach (r391-reach, up to 3 units more) goes home in the same 200 ms. FFX-2's girls run home with a smear (`BattleScreenRunIn.ts`) unless a menu or REDUCE MOTION closed the gate (D-357: snapped home by design). The fan's own note
   calls the attack clips unverified (they end at the command menu with no strike). A slower or longer return, a return under the same camera shot, or a return per distance is a look and a timing (the lunge keeps its 440 ms for the ATB's pacing):
   options first, none built.
3. **The idle-to-idle swap at rest.** A charge that arrives while the figure rests on idle swaps the idle's painting in place (one pose name, so the blend has nothing to run between); the charge only ever rises inside an action, so the harness
   never read one. Evrae's breath-charge differs from its idle by 0.145 of the outline, the fins' by 0.0 to 0.12; if it ever shows, it is a pop of a lit core, not of a figure.

## For the release notes (FFX only)

"Evrae's Inhale and Sin's fins' Core-gather no longer cut from their cast painting to the charged one in a single frame: the charged painting comes up through the same 140 ms blend as every other pose change.
The Right Fin's attack and cast paintings are no longer slid 2.8 world units to the left of where they were painted at every pose change (a registration that suited a standing figure and not a hanging fin), which
removes the whole-silhouette snap and the severe double images on its pose swaps."

## Suggested ledger text for the driver (not edited here)

- Action row: r43-motion2 Part A: the range director's charge swap goes through the owned blend (`PoseSwapOptions.blend`), the fins' NEAR paintings stand at the canvas middle (`overrides.json`, record, tables), 21 tests; FFX only (Chapters VIII and XVII).
  Evidence: this note, `tests/unit/engine/boss-charge-blend.test.ts`, `tests/unit/engine/lunge-walk-back.test.ts`.
- Open question for Bailey (one): lift the Right Fin's attack to the idle's plant row (overlap 0.37 to about 0.77; a visible change to a painting he approved on 2026-10-02)? Recommendation: yes, as options first with a before/after strip.
- PR-0378: the three boss hard cuts are fixed in the engine (to be confirmed by the harness on the next candidate: 0 hard cuts expected in Ch VIII and XVII). PR-0379: the Right Fin's severe double images (36) are expected to fall to 0 (ghost 0.409 to 0.285 in the reading above).
  PR-0380: "lunges do not walk back" is not reproducible as a defect (see 2); the entrance pops are Part B, options only.
