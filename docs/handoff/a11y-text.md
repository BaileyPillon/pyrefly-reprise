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

- row 1: who and when (short: NEXT, 2ND), the move, the certainty badge, the status chip (FFX only, see "Review fixes"); row 2: one figure per character, the engine's range beside the name (707-799; KO when lethal, +80-120 for a heal; the point figure when the engine has no range), "random:" and "/" for a rolled victim, "." between targets that are all hit.
- neither row wraps; when a row is wider than the line `fitPhoneLine` takes the least useful piece off, one at a time (row 1: the SCRIPTED badge, the timing, the enemy's name, the chip, then an ellipsis on the move; row 2: names to three letters, then "random: 7 targets . 300-540",
  then an ellipsis; since the review the range falls back to the point figure between the names and the count). It measures real layout (`scrollWidth` against `clientWidth`) when the body is rewritten (a MutationObserver) and when the panel changes size (a ResizeObserver); jsdom has a MutationObserver but no layout and no ResizeObserver, so the unit tests fake the widths and stub the second observer. A rung whose piece is not on the line is skipped.
- the figures are the engine's `min`, `max` and `amount` (the band is what the desktop slab prints and what release 67's phone line printed; the first pass of this lane printed only the point figure, and the review put the band back as the default, see below).

## Review fixes (2026-10-29, adversarial review of the lane at tip 71033499b; no critical, one major, predicted from the repo's constants and not browser-verified)

**M1 (major, FFX only): the guide (G) with a menu open at TEXT SIZE 115 and 130 drew its sheet over the hero and the cue.** The F1 left column grows UP about its foot (28, 313.5), so the hero's top rises from 140 to 114 and 87.9; the guide rail's floor is a constant (115, `FFXBattleHud` guide
anchors: `CMD_INFO_TOP` 121 less `GAP` 6) and Intel steps the whole rail DOWN by `-3 + 25 x scale`, so its foot falls from 137 to 140.8 and 144.5. At 100 the two stand 3 grid px apart (which is why the hero stands at 140); at 115 the sheet covered 26.8 grid px of the hero and at 130 the whole hero and
14.3 of the cue. Introduced by this candidate (live steps down to today's HUD at those sizes, which has no hero block). **Fix: while the guide is open the hero and the cue step aside** (`opacity: 0` under `.f1-intel`, `hudf1-textsize.css`; the ghost of a closing block too, it carries the same classes). Chosen over
the other three: folding the guide to its tab at 115 and 130 (FFX never squeezes: `StrategyGuide.grownBy` answers scale 1 for FFX, so it means new layout code in a 600-line class for the one chapter, unmeasured); an F1-aware floor or a lower foot (cannot work: at 130 the hero's top 87.9 is 14 under the rail's top 73.5 and the sheet needs
56). The verbs (top 161.4 at 130, 17 under the rail's foot) and the party cards stay; the acting hero's party card still says whose turn it is. **Game case: FFX only (rule 14)**: Chapter IV's guide is the left column and its hero, cue and window are on the right (100 grid px and more clear). The one-line revert is
`F1_GROWS_WITH_TEXT_SIZE = false` (takes the whole growth away). The model is in the tests (`helpers/f1Zones.ts` `ffxGuideRail`): at 100 the rail's foot is 137 and the hero's top 140; at 115 and 130 the overlaps above; the test fails if a zone the sheet meets is not one the sheets hide.

**Minor 1 (FFX): the one-row advisor tip against the turn strip at 115 and 130.** F1 shifts the tip right by `6 + 160 x scale` after the solver placed it (the solver does not know the ribbon or the step) and the solver gives the bar up to 226 grid px, so at 115 its right edge reached 432.8 + shear against the strip's 440.9 (touching) and at 130 would have
reached 476 against 416.9 (over the strip). The tip is now held to `575.5 - 320.5 x scale` wide at 115 and 130 (206.9 and 158.85; `max-width` on the same rule as the shift): the solver's leftmost card (35.9, from `advisorTip.tipZone`), the step, the bar, the shear (1.9) and the 6-grid-px `GAP` end exactly at the strip's left edge. At 100 nothing changes. The row drops its chips whole when narrower (`MoveAdvisor.fitTipRow` reads
the card's width). The assumed left (35.9) is the solver's leftmost; if the real card stands further right the bar is still short of the strip, only closer to the ribbon's side; X1 measures `tipGap`.

**Minor 2 (both games, the phone): the damage RANGE is back.** Release 67 printed `TIDUS 707-799`; the first pass printed only `amount` (753) and `KO`. A player judging whether 760 HP dies lost the band. The default row 2 is now `Tidus 707-799` (heal: `+80-120`; lethal: KO; no range: the point), and a new rung `p-pt` falls back to the
point figure, **after the short names and before the count** (`p-cf p-tm p-nm p-ch p-el` | `p-sh p-pt p-sm p-el2`): the band outlasts the full names. A rung whose piece is not on the line (no ranged figure) is skipped. **The worst line still loses it**: Chapter I's three random candidates are about 54 characters (415 px) with ranges, 362 with 3-letter names, 270 with
point figures, against 343 px of line at 390 wide, so that line ends at `p-sh p-pt`; lines with one or two targets keep the band. P1 counts `bandStates` and `pointRungStates`.

**Minor 3 (rule 14): FFX-2's phone line gains no status chip.** `phoneBodyHtml` had called `briefStatusChip` for both games; only FFX's body ever carried it (FFX-2's desktop body prints a Statuses block, which the phone sheet hides). The panel now keys the phone density on its GAME (`phoneDensityOf(base, game)`: `'phone-brief'` for FFX with the chip,
`'phone'` for FFX-2 without), so FFX-2 at 115 / 130 (where its mount density becomes 'brief') still has none. `EnemyIntent.ts` is still 945 lines.

**Minor 4 and 5 (tests).** `TargetCursor.dockFor` reaches `plateWidth` (a ring flag docked beside the ring with no damage line, away from it with the 29-glyph line, a panel 330 px out); the lines of Intel that follow the ribbon are checked at 115 and 130, not only at 100 (the guide rail steps 25.75 and 29.5, the tips 24 and 48 grid px further right than at 100). The `lblW` term in `plateWidth` is dead
(never above the 150 floor); it is left as the floor's guard.

**Minor 6 and 7 (comments, one reservation).** The stale "TEXT SIZE 100" comments in `HudF1.ts` (two), `demoHud.ts` and `coachState.ts` say what is true now. `FFXBattleHud` still reserves the grown `cmdInfo` slot for the help slab F1 never draws; it is left: that box (24 to 247.6, 121 to 164 at 130) lies where the grown hero and cue stand, which the
solver does not otherwise know, so the reservation keeps the advisor card off them.

**Minor 8 (e2e).** `tests/e2e/accessibility-a2.spec.ts`: the bound of 5 verb rows is F1's four plus the faded tail; its HUD probe lists `.sgd__stack` and `.sgd__toggle`, so it reads the guide (with the guide closed, as it boots). Not run (no browser): first job of the morning.

**Minor 10 and 11 (phone).** A face that finishes loading after the first fit (Chakra Petch 700 is wider than its fallback) fits the line again: `attachPhoneFit` waits on `document.fonts.ready` once while the faces are loading (one promise, no listener to take off). Names that start alike are told apart on the narrow rung: `shortNames` takes the first
three letters unless two would read the same, then the initials of the words (`Yu Pagoda A` and `B`: `YPA`, `YPB`), then the last three characters.

**Not changed:** minor 9 (the item-1 game case) is as the review found it: BOTH, written in the commit and here, the FFX-2 ring flag at 14 px unmeasured until T1 runs Chapter IV. Minor 12 (`EnemyIntent.ts` keeps its 945 lines by joining statements) stands: the file may not grow (rule 7), and moving the phone branch out is a refactor for its own commit.

**The job that would have caught M1** is X1 with the guide, tip and slab in `ZONES` and an Intel overlap counted as a miss (`jobs/x1-textsize.mjs`, updated): see [a11y-text-jobs.md](a11y-text-jobs.md).

## Tests

New: `a11y-text-target-flag` (10), `a11y-text-f1` (49), `a11y-text-phone-line` (25), `a11y-text-review` (12), helpers `helpers/cssEval.ts` (a CSS reader and a `calc()`/`clamp()`/`var()` evaluator, specificity) and `helpers/f1Zones.ts` (the F1 zones from the sheets).
Updated (the F1 HUD no longer steps down; `?f1text=today` keeps the old tests' behaviour): `hud-f1-switch`, `hud-f1-layer`, `r64-declutter-defaults`. `tsc --noEmit` clean (src and tests/unit; the e2e project too). Full suite (3 workers, 2026-10-29 00:34 to 01:11 EDT, on the three code commits plus the a11y tests; the later Sensor-rule, skip-rung and ResizeObserver edits were re-run by their own files and `tsc`): 1,720 files passed, 26 skipped, 27,013 tests passed, 112 skipped, 1 todo, no failure. `node tools/orphans.mjs`: the same 24 modules as before, none mine.

## Open questions (the driver's, or Bailey's after the sweep)

1. **Item 2's choice.** F1 stays and grows (chosen) against stepping down and naming the setting's scope. If the X1 sweep shows an overlap at 130, `F1_GROWS_WITH_TEXT_SIZE = false` returns release 67's behaviour with one line, and the report's other fix (name the scope) is the fallback.
2. **Intel (X) at 115 / 130 under F1** was laid out for today's HUD, not F1's: the guide's chips and the advisor's tip chip follow the grown ribbon, Chapter I's Sensor card keeps its place (today's step up and left, 34 and 56 grid px at 130, would land it on the turn strip; computed in the test), the guide's sheet covers the hero and the cue so they step aside while it is open (review M1, FFX only), and the tip is capped before the strip. The enemy-move slab keeps the text-size sheets' rules and has not been looked at: X1 now reads it (G, then E) in both chapters. **Is hiding the hero and the cue while the guide is open the right trade?** The alternative is the guide folding to its tab at 115 and 130 (FFX-2's squeeze), which needs new layout code for FFX.
3. **The first-run teaching cards** now stay down at 115 and 130 too in the two demo chapters (they follow `hudF1On()`). Before this change a player at 115 / 130 saw them. Wanted? (It is the same as at 100.)
4. **The phone line's information order.** The SCRIPTED badge is the first piece dropped on a long line (a line with no badge reads as certain; an uncertain badge, "Most likely 50%", is never dropped). A party-wide move now shows every target, where it showed the first.
5. **The two estimates** a browser must replace: the hero's width (150 grid px) and the turn strip's height (60) in the zone model, and the glyph widths in `plateWidth` (0.77 em and 0.94 em of the flag's tracked caps).
6. **Rule 9 (end state first).** No approved frame exists for the F1 HUD at 115 / 130 (`docs/concepts/accessibility-2026-09-26/desk-hud-130.jpg` is today's HUD), and none for the two-row phone line (`docs/concepts/layout/phone-battle-hud/` draws "two lines at most").
   Both are accessibility behaviours under a non-default setting or a corner of a line, built on the driver's call under Bailey's delegation, and both are reversible in one line (`F1_GROWS_WITH_TEXT_SIZE`; the phone body is built only when `densityNow()` answers 'phone': removing the `phoneLineOn()` term in
   `EnemyIntent.densityNow` returns release 67's line). The X1 and P1 screenshots (`ffx-1600x900-ts130.png`, `ffx2-1600x900-ts130.png`, `p1/<chapter>/last.png`) are the pictures to show him, as phone cards, before they ship.
8. **The phone's band against the point (review minor 2).** The range is the default and the point figure its fallback, but Chapter I's three-candidate lines (the longest, and the ones Lance of Atrophy and Cross Cleave print) end on the point figure and 3-letter names at 390 px. If P1 shows `pointRungStates` on most states, the choice is Bailey's: the range on a smaller type, or the point
   figure with full names (the order of `p-sh` and `p-pt` in `ROW2_RUNGS` is the one place to swap them).
7. **Not run:** `tests/e2e/accessibility-a2.spec.ts` (Playwright; no browser overnight). Its Chapter I 130 % case boots the default address, which now draws the F1 HUD at 130: its "four command rows" bound became five (the F1 window is four verbs and a faded tail), and its
   clipped / overlap / off-screen probes now read the F1 zones; the first browser pass should run it.

## Decisions made under the delegation (for DECISIONS.md rows; the driver records them, none is Bailey's own word)

1. PR-0559: the F1 HUD stays up and grows with TEXT SIZE (against stepping down and naming the scope); `F1_GROWS_WITH_TEXT_SIZE` and `?f1text=today` undo it.
2. PR-0551: the target flag's label, damage line and note are 14 px at the floor of their clamps (against raising the middle term of the clamp, which would have left 1280 and 1600 wide windows under the floor).
3. Release 67 gap check item 5: the phone's line is two rows, every target's figure on the second, the SCRIPTED badge the first piece to go. (The first pass printed the engine's point `amount` only; the review put the range back as the default with the point figure as a rung after the short names, decision 5.)
4. Review M1: while Chapter I's guide is open at TEXT SIZE 115 and 130 the hero and the cue step aside (against folding the guide to its tab, an F1-aware floor, a lower foot, or reverting the growth); FFX only.
5. Review minor 2: the phone line keeps the range (`min-max`) by default; `p-pt` (point figure) is the rung after the short names and before the count; lethal still reads KO.
6. Review minor 3: FFX-2's phone line has no status chip (the chip is FFX's alone, on the phone as on the desktop), at every text size.
7. Review minor 1: Chapter I's advisor tip is capped to `575.5 - 320.5 x scale` grid px at 115 and 130 so it ends before the turn strip.

## For the release notes (CHANGELOG lines, tags as the file uses them)

- Both games, the two demo chapters: TEXT SIZE 115 and 130 percent grow the battle HUD's command labels and party names instead of handing over a smaller HUD (round 30b PR-0559); `?f1text=today` brings release 67's behaviour back.
- Both games: the target flag's TARGET label and damage line are at least 14 px at every desktop window (round 30b PR-0551).
- Both games, the phone: the enemy-move line is two rows with the damage range of every character on the second (the point figure when the line is too narrow), instead of two lines that could cut them (release 67 gap check item 5). FFX only: the status chip beside the move stays on the phone; FFX-2's line has none, as before.
- FFX only (Chapter I), TEXT SIZE 115 and 130: with the strategy guide open (G) the hero name and the move cue step aside so the guide sheet never lies over them, and the one-line advisor tip is held clear of the turn-order strip.
