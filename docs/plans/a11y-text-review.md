# Preflight: TEXT SIZE reaches the F1 battle HUD, the target flag meets the floor, the phone's figures stay on the line

2026-10-29. Rule 15 paper preflight (`critic-plan --paths` classes it DEEP: global layout, input and boot; unclassified product path; FFX HUD). Lane a11y-text, branch `a11y-text` from `origin/r68-int`.
Bailey, 2026-10-28: "i'll go with all your recommendations and decision-making for the next couple days"; 2026-10-29 00:00: "I'm going to sleep please keep going". Source: round 30b (`critic/rounds/round-30b.md`; PR-0551, PR-0559) and the release 67 gap check (item 5).

## Game case (rule 14)

| Item | Case | Why |
|---|---|---|
| 1. The target flag's TARGET label, damage line and note at 14 px | BOTH (the flag is the pro look's, FFX's glove and FFX-2's ring; the report measured Chapter I) | `pro-markers.css` is one stylesheet for both chromes; the note rule is the shared `.ffx-target__note`. FFX-2's menu passes no notes today, so the note change is FFX in practice |
| 2. TEXT SIZE grows the F1 HUD | BOTH (Chapter I FFX, Chapter IV FFX-2: the two chapters the F1 HUD draws in) | the finding is in both (Ch I command labels, Ch IV party names). The other 17 chapters draw today's HUD, which already grew with the setting |
| 3. The phone's enemy-move line as two rows | BOTH (the upright phone only) | one shared slab; the figures are every character's damage in either game |

## What is built, and where

New modules only, plus in-place edits that add no line to a file already over 400 (`EnemyIntent.ts` 945 -> 945, `TargetCursor.ts` 575 -> 575):
`ui/hudf1/hudf1-textsize.css` (new, 111 lines), `ui/common/enemy-intent-phone.ts` and `phone-enemy-line.css` (new), `plateWidth` in `ui/ffx/targetCursorParts.ts`, `HudF1Switch.ts` (the text mode), `pro-markers.css` and `ffx-hud.css` (three sizes).

## The one decision that is not a number: item 2 stays on F1 instead of stepping down

Release 67 stepped the F1 HUD down to today's HUD at 115 and 130 (hud-f1 review M5). F1's own type is bigger than today's (command labels 12 grid px against 9.8, party names 12.5 against 9.3), so the step-down made the type smaller: the command label at 1600x900 went
30.2, 28.2, 31.9 and Chapter IV's party names 31.3, 26.8, 30.3. Three ways out were weighed:

1. Today's HUD at a larger scale at 115 and 130 (about 1.43 and 1.61): the panels were laid out and approved at 1.3; no.
2. Keep the step-down and name the setting's scope (the fix the report offers as the other branch): it leaves a setting that makes the type smaller for the two chapters a first-time player sees.
3. **Keep F1 and grow its zones by the setting about the corner each is pinned to** (what `text-size.css` does for today's panels). Chosen. The F1 review's reason against it (the hero and the cue sat on the first verb) is the left column's anchor: the column grows about its foot, as one block.

It is reversible in one line (`F1_GROWS_WITH_TEXT_SIZE = false`), and by address (`?f1text=today`).

## Failure modes, and what each is checked by

| Risk | Check now | Check owed (browser) | Stop rule |
|---|---|---|---|
| A grown F1 zone overlaps another or leaves the stage | `a11y-text-f1`: every zone's box from the sheets' own numbers at 100/115/130, pairwise disjoint, inside 640 x 360 | job X1: measured boxes against the predicted table | any overlap over 2 grid px or a zone outside at 130: flip the constant, report, do not tune blind |
| A rule I added loses the cascade to the text-size rule it replaces, or leaks to 100 / the phone | `a11y-text-f1`: specificity of each pair; every selector starts from "text size is not 100 and not the phone" | job X1 `f1: true` at three sizes, `f1: false` with `?f1text=today` | as above |
| F1 staying on at 115/130 changes what else keys on `hudF1On()` (the guide and the read-out start folded, the first-run teaching cards stay down, the damage numerals are 1.6x the glass size) | `hud-f1-switch`, `hud-f1-layer`, `r64-declutter-defaults` updated and green | none new: it is the same HUD the player has at 100 | none: it is the intent (open question 3 in the handoff) |
| Intel (X) panels were laid out for today's HUD at these sizes, not for F1's | none possible without a browser | job X1 (the Sensor card is in its zone table, read with the guide open); look at the guide sheet and the tip chip at 130 in both chapters | report; the chips follow the ribbon, the rest is today's rules |
| The phone's fit ladder depends on real layout and on two observers (MutationObserver, ResizeObserver) | `a11y-text-phone-line`: order and idempotence with a fake measure; the panel follows the phone attribute | job P1: every distinct state of a real fight | any figure clipped, a third row, or a rung past `p-nm` |
| The flag's plate is wider than the dock believed | `plateWidth` counts the damage line and the label at 14 px | job T1: no panel overlap at five windows | any overlap |

## Predictions (written before any measurement; the tables are in `docs/handoff/a11y-text-jobs.md`)

- T1: the flag's TARGET label and damage line read 14.0 at 1280x720, 1440x1080 and 1600x900 (14.4 and 15.6 at 2000x1012, 18 and 19 at 2560x1440); the minimum over every piece of the flag is 14.0 at every window.
- X1: the command label at 1600x900 reads 30 / 34.5 / 39 at 100 / 115 / 130 (rising, where release 67 read 30.2 / 28.2 / 31.9); the party name 31.3 / 35.9 / 40.6; no two F1 zones overlap and none leaves the stage at any size.
- P1: the line is two rows with figures and one without; every figure drawn is inside the body; no row overflows after the fit; the longest Chapter I line needs the badge dropped (and perhaps the timing) and, if anything, the three-letter names; the enemy's name is never the rung that saves a line.

**Added after the adversarial review (2026-10-29).** The first pass missed that the F1 left column grows UP while the FFX guide rail's floor is a constant and Intel steps the rail DOWN, so at 115 and 130 the open guide lay over the hero and the cue (the zone model had no guide zone, and job X1's `ZONES` list none either): the sheets now hide the hero and the cue while the guide is open, and the model and X1 carry the guide, the tip and the enemy-move slab.
Predictions added to the list above: X1 (Chapter I, guide open): no hero and no cue at 115 and 130, present at 100; the tip's bounding box ends 6 grid px or more short of the turn strip (about 6.2 at 115 and 130, about 35 at 100); no overlap in any Intel read. P1: the longest Chapter I line ends on `p-sh p-pt` (3-letter names, point figures); FFX-2 reads `chipStates` 0.

A miss on any of these stops the lane (rule 15) and is read, not tuned.
