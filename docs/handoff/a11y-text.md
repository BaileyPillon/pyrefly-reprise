# Lane a11y-text: round 30b's text findings (PR-0551, PR-0559) and the phone's cut figures (release 67 gap check item 5)

2026-10-29, overnight. Branch `a11y-text` from `origin/r68-int` (7d80590d0), tree D:/pyrefly-rig-rikkudk. Bailey, 2026-10-28: "i'll go with all your recommendations and decision-making for the next couple days"; 2026-10-29: "I'm going to sleep please keep going".
Paper preflight (rule 15; `critic-plan` says DEEP): [docs/plans/a11y-text-review.md](../plans/a11y-text-review.md). The morning's browser jobs and the predictions written before them: [a11y-text-jobs.md](a11y-text-jobs.md) (scripts in
`D:/Tools/pyrefly-scratch/2026-10-29/a11y-text/jobs/`). Nothing was run in a browser (the browser belongs to the continuity measurement); nothing is deployed.

## What changed

### 1. The target flag meets 14 px (PR-0551, CHK-003) - BOTH games (the flag is the pro look's; the report measured Chapter I)

Round 30b read the flag's TARGET label and damage line at 11.0 to 12.5 px at 1280x720, 1440x1080 and 1600x900. The two `clamp()`s in `pro-markers.css` had an 11 px floor; they are `clamp(14px, 0.72vw, 18px)` and `clamp(14px, 0.78vw, 19px)` now (14.0
up to about 1900 px of window, the same growth after it). The plain note ("already Hasted", "HP full") was 11 px on the desktop (the phone already had 14): `ffx-hud.css` `.ffx-target__note` is 14 px. The plate is wider with the larger type, so the dock
(`TargetCursor.dockFor`) now counts the damage line and the label in the plate it places (`plateWidth` in `targetCursorParts.ts`): a plate the dock believed narrower than it drew could have landed across a panel.

### 2. TEXT SIZE reaches the battle HUD's command labels and party names (PR-0559) - BOTH games (Chapter I FFX, Chapter IV FFX-2)

The cause was not that the HUD ignored the setting: the other 17 chapters' HUD grows with it (FFX's since the setting was built, D-285; FFX-2's since release 39). In the two chapters the F1 HUD draws in, release 67 handed the player today's HUD at 115 and 130 (hud-f1 review M5), and F1's type is bigger than
today's (12 and 12.5 grid px against 9.8 and 9.3), so the setting made the type smaller (Chapter I command labels at 1600x900 30.2, 28.2, 31.9 px; Chapter IV party names 31.3, 26.8, 30.3). **The F1 HUD now stays up at 115 and 130 and grows**:
`src/ui/hudf1/hudf1-textsize.css` (new) grows each zone by `--pyr-ts` from the corner it is pinned to, the left column of Chapter I about its foot (28, 313.5) as one block, the right column of Chapter IV about (622, 250) lifted by the growth of the party
cards under it; Intel's chips step by what the ribbon grew and Chapter I's Sensor card drops today's step up and left. `HudF1Switch.ts`: `F1_GROWS_WITH_TEXT_SIZE = true` (the one line that gives release 67's behaviour back), the address word `?f1text=today|grow`, `hudF1TextSizeOk()` true while growing. Painted sizes at 1600x900:
command label 30 / 34.5 / 39, party name 31.3 / 35.9 / 40.6. The arithmetic of every zone is in `tests/unit/a11y-text-f1.test.ts` (no overlap at 100, 115, 130; nothing off the 640 x 360 stage), computed from the real sheets; [a11y-text-zones-predicted.png](a11y-text-zones-predicted.png) draws those boxes (a computed prediction, not a screenshot: the browser job X1 is the proof).

**What follows from F1 staying on at 115 and 130** (all of it is what the player already has at 100): the guide and the enemy-move read-out start folded; the first-run teaching cards stay down; the damage numerals are F1's gold serif at 1.6 times the glass size;
the command window shows F1's five rows (today's HUD showed 5 at 115 and 4 at 130).

### 3. The phone's enemy-move line is two rows and the figures own the second (release 67 gap check item 5) - BOTH games, the upright phone

Release 67 clamped the line to two lines; the clamp cut the figures (Chapter I's longest line, "SEYMOUR FLUX 3RD IN QUEUE Lance of Atrophy SCRIPTED ZOMBIE 99% TIDUS 707-799 / YUNA 746-842 / KIMAHRI 698-788", laid out on 3 to 4 lines at 390 x 844), and a
party-wide move drew only its first target. Now (`enemy-intent-phone.ts` + `phone-enemy-line.css`, built only on the upright phone; `EnemyIntent.ts` edited in place, 945 lines before and after):

- row 1: who and when (short: NEXT, 2ND), the move, the certainty badge, the status chip; row 2: one figure per character, the number beside the name (KO when lethal, +N for a heal), "random:" and "/" for a rolled victim, "." between targets that are all hit.
- neither row wraps; when a row is wider than the line `fitPhoneLine` takes the least useful piece off, one at a time (row 1: the SCRIPTED badge, the timing, the enemy's name, the chip, then an ellipsis on the move; row 2: names to three letters, then "random: 7 targets . 300-540",
  then an ellipsis). It measures real layout (`scrollWidth` against `clientWidth`) when the body is rewritten (a MutationObserver) and when the panel changes size (a ResizeObserver); jsdom has a MutationObserver but no layout and no ResizeObserver, so the unit tests fake the widths and stub the second observer. A rung whose piece is not on the line is skipped.
- the figure is the engine's `amount` (one number), not the min-max band; the band stays on the desktop slab.

## Tests

New: `a11y-text-target-flag` (10), `a11y-text-f1` (35), `a11y-text-phone-line` (25), helpers `helpers/cssEval.ts` (a CSS reader and a `calc()`/`clamp()`/`var()` evaluator, specificity) and `helpers/f1Zones.ts` (the F1 zones from the sheets).
Updated (the F1 HUD no longer steps down; `?f1text=today` keeps the old tests' behaviour): `hud-f1-switch`, `hud-f1-layer`, `r64-declutter-defaults`. `tsc --noEmit` clean (src and tests/unit; the e2e project too). Full suite (3 workers, 2026-10-29 00:34 to 01:11 EDT, on the three code commits plus the a11y tests; the later Sensor-rule, skip-rung and ResizeObserver edits were re-run by their own files and `tsc`): 1,720 files passed, 26 skipped, 27,013 tests passed, 112 skipped, 1 todo, no failure. `node tools/orphans.mjs`: the same 24 modules as before, none mine.

## Open questions (the driver's, or Bailey's after the sweep)

1. **Item 2's choice.** F1 stays and grows (chosen) against stepping down and naming the setting's scope. If the X1 sweep shows an overlap at 130, `F1_GROWS_WITH_TEXT_SIZE = false` returns release 67's behaviour with one line, and the report's other fix (name the scope) is the fallback.
2. **Intel (X) at 115 / 130 under F1** was laid out for today's HUD, not F1's: the guide's chips and the advisor's tip chip follow the grown ribbon, and Chapter I's Sensor card keeps its place (today's step up and left, 34 and 56 grid px at 130, would land it on the turn strip; computed in the test); the guide's sheet and the enemy-move slab keep the text-size sheets' rules and have not been looked at. Look at them at 130 in both chapters.
3. **The first-run teaching cards** now stay down at 115 and 130 too in the two demo chapters (they follow `hudF1On()`). Before this change a player at 115 / 130 saw them. Wanted? (It is the same as at 100.)
4. **The phone line's information order.** The SCRIPTED badge is the first piece dropped on a long line (a line with no badge reads as certain; an uncertain badge, "Most likely 50%", is never dropped). A party-wide move now shows every target, where it showed the first.
5. **The two estimates** a browser must replace: the hero's width (150 grid px) and the turn strip's height (60) in the zone model, and the glyph widths in `plateWidth` (0.77 em and 0.94 em of the flag's tracked caps).
6. **Rule 9 (end state first).** No approved frame exists for the F1 HUD at 115 / 130 (`docs/concepts/accessibility-2026-09-26/desk-hud-130.jpg` is today's HUD), and none for the two-row phone line (`docs/concepts/layout/phone-battle-hud/` draws "two lines at most").
   Both are accessibility behaviours under a non-default setting or a corner of a line, built on the driver's call under Bailey's delegation, and both are reversible in one line (`F1_GROWS_WITH_TEXT_SIZE`; the phone body is built only when `densityNow()` answers 'phone': removing the `phoneLineOn()` term in
   `EnemyIntent.densityNow` returns release 67's line). The X1 and P1 screenshots (`ffx-1600x900-ts130.png`, `ffx2-1600x900-ts130.png`, `p1/<chapter>/last.png`) are the pictures to show him, as phone cards, before they ship.
7. **Not run:** `tests/e2e/accessibility-a2.spec.ts` (Playwright; no browser overnight). Its Chapter I 130 % case boots the default address, which now draws the F1 HUD at 130: its "four command rows" bound became five (the F1 window is four verbs and a faded tail), and its
   clipped / overlap / off-screen probes now read the F1 zones; the first browser pass should run it.

## Decisions made under the delegation (for DECISIONS.md rows; the driver records them, none is Bailey's own word)

1. PR-0559: the F1 HUD stays up and grows with TEXT SIZE (against stepping down and naming the scope); `F1_GROWS_WITH_TEXT_SIZE` and `?f1text=today` undo it.
2. PR-0551: the target flag's label, damage line and note are 14 px at the floor of their clamps (against raising the middle term of the clamp, which would have left 1280 and 1600 wide windows under the floor).
3. Release 67 gap check item 5: the phone's line is two rows, every target's figure on the second as one number (the engine's `amount`; the band stays on the desktop slab), the SCRIPTED badge the first piece to go.

## For the release notes (CHANGELOG lines, tags as the file uses them)

- Both games, the two demo chapters: TEXT SIZE 115 and 130 percent grow the battle HUD's command labels and party names instead of handing over a smaller HUD (round 30b PR-0559); `?f1text=today` brings release 67's behaviour back.
- Both games: the target flag's TARGET label and damage line are at least 14 px at every desktop window (round 30b PR-0551).
- Both games, the phone: the enemy-move line is two rows with the damage figures of every character on the second, instead of two lines that could cut them (release 67 gap check item 5).
