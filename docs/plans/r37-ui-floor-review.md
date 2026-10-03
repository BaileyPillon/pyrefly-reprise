# Paper preflight: r37-ui-floor (the 14 px text floor, the phone coach tab, the HUD overlap cluster)

Paper preflight under AGENTS.md rule 15 and `critic/RUBRIC.md` §4, written 2026-10-03 by a Sonnet sub-agent of the
driver session, at the point the floor work was built and measured but not yet committed (the CSS is two small sheets
and was measured in a browser as it was written; this note records what it can break and how that was looked for).
Track: `r37-ui-floor`, worktree `D:/pyrefly-advisor-v4`. No save-data file, no settings schema, no `SaveData.ts`.

`node tools/critic-plan.mjs --paths src/ui/common/hud-floor.css,src/ui/common/pause-screen.css,src/ui/common/pause-phone.css,src/ui/ffx/FFXBattleHud.ts,src/ui/ffx2/FFX2BattleHud.ts,tests/unit/hud-floor-css.test.ts`
says **DEEP after the deploy** ("global layout, input and boot is a shared system"): focused review of the candidate
before deploy, live verification, then the deep review on the live build. Obligations live + focused + deep; checks
CHK-002 003 004 006 007 008 009 010 015 016 017 020 021; targets fight, pause, phone, presentation. Not the save-data
class, so no separate `-savedata` branch.

Authority: Bailey, 2026-09-26 about 15:00 EDT, "Focus on meeting all score thresholds iteratively. Godspeed. I have
plenty of usage." (class A defect repair, memory `thresholds-program-2026-09-26`); the item is PR-0321 + PR-0302 +
PR-0251 (CHK-003, a mandatory-check FAIL). No new look is introduced: type grows only as far as the floor needs.

## 1. Game case (rule 14)

**Both.** The phone pause and the 4:3 floor are shared chrome. The HUD rules are scoped per game in
`hud-floor.css`: `.ffxhud ...` rules carry FFX's authored sizes, `.ffx2hud ...` rules carry FFX-2's; the strategy guide
(`.sgd`) is a shared rail whose sizes are the same in both. A unit test (`hud-floor-css.test.ts`) pins that no `.ffxhud`
rule names FFX-2 classes and vice versa. FFX chapters are 1 to 3; FFX-2 chapters 4 and 5 (measured: I and IV).

## 2. What the change is

1. `pause-screen.css` phone block: `--pu-fs` 12 to 14 px, `--pu-fs-v` 13 to 15 px. `pause-phone.css`: the brand line
   takes two tight lines at the top, word rows and objectives hand their empty 110 px bar cell back to the text.
2. `hud-floor.css` (new): `--hud-floor` = 14.1 px / `--lb-scale`; each stage-scaled label becomes
   `max(its authored size, --hud-floor)`. The phone layout is excluded (`html:not([data-phone-battle])`).
3. Two knock-on corrections the floor needs: the CTB name plate cap grows with the type (48 grid px at 5.6), the Sensor
   panel's chips go to two columns where three no longer fit and the plate rises 15 grid px to keep off the party rows.

## 3. What it can break, and how it was looked for

| Risk | Look | Result |
|---|---|---|
| A bigger label clips or overlaps a neighbour at 4:3 (the likeliest defect) | screenshots at 1024x768 and 1280x960 in both games, first menu, every command submenu, the target step; before/after pairs | CTB names clipped "Mortiorchis" at first, fixed by the cap; Sensor chips ("THUNDER") overflowed, fixed by two columns; Sensor plate covered the party rows, fixed by the rise. Remaining: the strategy guide drops its NEXT block at 1024x768 (its own density ladder), the advisor card reflows to two lines |
| 16:9 windows change | 1600x900 and 1440x900 measured; the floor is 5.64 grid px at 2.5, so only labels authored under that grow (4.7 to 4.9 px: OD, MP unit, Sensor toggle, FFX-2 help label) | min 14 px at 1600x900; no label above 5.64 changed |
| The phone layout changes | `html:not([data-phone-battle])` on every HUD rule; the phone HUD measured at 390x844 | first menu 0 under 14 (as before) |
| The pause at 14/15 px clips ("BAROQUE SW...", wrapped brand, 7-line objectives) | screenshots of every tab at 390x844, before and after, plus clipped-text probe on the EYE CANDY page | wide rows regain width, objectives wrap in 2 lines, 0 clipped, 0 horizontal overflow |
| TEXT SIZE 115/130 (`--pyr-ts`) interacts | the floor sits under the existing TEXT SIZE rules (specificity) and only raises a size, never lowers it | TEXT SIZE rules that already scale a label win where they apply; not re-captured at 130 in this branch (listed in the handoff) |
| A unit test pins an old size | the type-floor tests of the three sheets, the pause tests, the phone repair test | pass |
| FFX-2's `--band-zoom` help bar double-scales | the bar rule divides the floor by `--band-zoom` | measured 14 at 1024x768 and 1280x960 |

## 4. What the deep review should look at first

CHK-003 at 1280x960 and 390x844 in all five chapters (only I and IV were measured here); CHK-008 overlaps at 4:3 for
the Sensor plate against the party rows and the CTB plates against the enemy sprite; TEXT SIZE 130 on the FFX
desktop HUD with the floor (the grown guide column may meet the floored card).

## 5. Addendum (same branch): the PR-0104 queued-command chip and the PR-0249 / PR-0325 / LV-35-01 repairs

Added as built, 2026-10-03. `critic-plan --paths src/engine/BattlePresenter.ts,src/engine/HudPort.ts,...` says DEEP after deploy
(battle presenter and lifecycle), not the save-data class. Method check: `docs/plans/pr-0104-method-check.md`.

| Risk | Look | Result |
|---|---|---|
| The extra presenter call changes timing or order | `submit` calls `syncQueued` once after `engine.submit` and before `play`; `action-start`/`action-end` call it with a fresh `engine.state()`; presenter, playback, acting-signal, vitals and coach-layer tests | green; a unit test pins the order and the no-method case |
| The chip covers a face or a menu | screenshots at 1600x900 and 390x844 (chip over the girl's head, beside the weapon, 14 px, inside the window) | clear in both; measured at 135 to 175 ms (desktop) and 153 to 166 ms (phone) after the confirm |
| The chip outlives the command | the chip goes at the first `action-start`/`action-end` after the charge ends (0.7 s after the live state cleared it in one capture) | Wait mode holds the charge while the next menu is open, so the chip stays as long as the command is queued, which is the point |
| Shared CSS: the selected Overdrive row (both games) | `html:not([data-phone-battle])` scoped; FFX OVERDRIVE list and FFX-2 CHANGE measured | selected row is filled in both; phone not measured |
| Placement solver (PR-0249, FFX-2 only) | the party tier ranks below chrome; with no party flag the answer is the old one (unit test) | 0 px2 at the menu, the list and the Cure target step at both sizes; a mid-transition frame still read up to 3,660 px2 once |
