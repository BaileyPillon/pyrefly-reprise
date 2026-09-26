# PR-0157 method check (rule 15): HUD cards over the party and the boss in FFX action shots

Written 2026-09-26, paper only. **Game case: FFX only** (the FFX HUD's intent card and CTB column
during FFX action cameras; FFX-2's action framing is a different HUD and is not reported).
Chapters I and XII (and III, X and XIV share the rig).

## The issue as the critic measures it

Round 11 (R11-VIS-02): the action camera framed the acting party member under the enemy info card
and the party panel. Round 12: narrowed to a party member under the info card and the acting boss
under the turn column. Round 13, widened to XII: in the close shot the ENEMY INTENT card covers
half of Yuna's skirt and the turn chips sit over Omnis's lower-right discs; R13G-06 (folded in) is
the same root at the XII target step. Acceptance: in I and XII action sequences, no HUD box
intersects a party quad's upper two thirds or the acting boss quad.

## Why it stalled

Three rounds, no attempt. Each round offered two fixes ("fade or shift") and no batch owned the
FFX HUD and the camera together, so nobody chose. The choice is the whole method question.

## Where the hooks already are

`src/ui/ffx/FFXBattleHud.ts` `onEvent` already sees `action-start` (it suspends the command menu
there) and `action-end`. The intent card is `EnemyIntent`'s `.eint__panel` inside the HUD's
overlay, and the turn column is `CtbList`'s `.ig-ctb`. So a fade needs no new presenter hook: one
class on the HUD root between an action's start and its end, and CSS that takes both panels to low
opacity. The card already yields during target selection, so the pattern exists.

## Alternatives

1. **Fade** (the program's recommendation): both panels to about 20% for the action, back at
   `action-end` or the next `turn-start`, whichever comes first. Deterministic, one rule, no
   geometry. Cost: the player loses the intent read for the second or two the action plays, which
   is when it is least needed (the next menu brings it back).
2. **Projected shift**: every frame, move the card and the column away from the projected actor
   quads. Costs a solver per frame on a moving camera, can make panels swim, and can still fail on a
   close shot where the quads fill the frame.
3. **Frame the camera instead**: change the action rigs so the actors avoid the panel columns. It
   moves approved camera beats, so it is a visible change that needs options first.

## The smallest test that tells them apart

Record the I and XII action sequences (real keys, seed pinned after PR-0202, 1600x900 and
2000x1012) and for every frame intersect the panel boxes with the projected quads, under each rule
applied offline to the same frames: fade (count intersections of panels above 25% opacity) and
shift (count intersections after the solver's move, and the frames where no clear spot exists).
The rule with zero intersections and zero no-room frames wins; if both reach zero, fade wins on
cost and stability.

Also, the program asks whether this is new and perceivable (§3 item 10). A panel that steps back
while an action plays changes nothing Bailey approved: the approved battle-HUD tiles are still
frames with no action playing, and CHK-008 is the check contract being restored. Class A.

## Recommendation

**Change method: pick the fade and build it.** Batch 2 adds the acting-state class on
`action-start` / `action-end` in a new module beside `FFXBattleHud.ts` (1,544 lines) and the fade
CSS, with a unit test that the class is set and cleared on those events and on a cancelled action.
Acceptance by real keys in I and XII. If the frame study shows a close shot the fade cannot clear
(a boss quad under the command stack), that remainder goes to Bailey with frames, not to a shift
solver.
