# r38-guide-sheet: paper preflight (RUBRIC section 9; critic-plan class DEEP after deploy)

Written 2026-10-03 by a Sonnet sub-agent of the driver session, during the build and before the final gates, for pass three of branch
`r38-guide-jegged` (from `7c94814c`): the desktop strategy guide as a scrolling reading sheet, and the status cure-hint card in a box
of its own. `node tools/critic-plan.mjs --paths <the 13 changed src files>` says **DEEP, after deploy** ("global layout, input and boot
is a shared system": `src/ui/common/`), obligations live + focused + deep, checks CHK-002 to CHK-004, CHK-006 to CHK-010, CHK-015 to
CHK-017, CHK-020, CHK-021, targets fight, pause, phone, presentation. Nothing is the save-data class: no `SaveData.ts`, no schema, no
settings key (`guideVisible` is the one setting and keeps its meaning), no persistence. Nothing is deployed or merged.

Bailey's words: ~21:35 EDT 2026-10-03, "All your recommendations please thank you <3 I love you Claude", taking the driver's
recommendations (b) a scrolling reading view on the desktop instead of paging the side rail, with a screenshot to him before it ships,
and (d) the cure-hint cards in their own card outside the guide. `docs/handoff/r38-guide-jegged.md` section 10 is the record.

## Game case (rule 14): both

The sheet, its scrolling, its column and the card's slot are shared plumbing (`StrategyGuide.ts`, `statusHintCard.ts`, their sheets); no
line of the change reads which game is on. What differs by game is untouched and keeps its own rule: FFX's CTB waits at the command menu
and fades the guide layer while an action plays (`ffx-hud.css`), FFX-2's ATB runs under its menu per the X-2 BATTLE setting and A-15's
fade steps the column back from an action (`ffx2/actionFade.ts`). Both games get the same box the rail always had. Source: the files
named, and the measured boxes in the handoff; no game fact is asserted that needs `research/`.

## What can go wrong, and the check that tells

| item | the way it breaks | the check |
|---|---|---|
| Wheel | a browser applies a wheel's pixels to a scroll offset as they are, so inside the 2.5x-scaled stage a notch moved the sheet 250 screen px, three and a half times what it shows: unreadable. A pinch, a sideways wheel or the phone's own sheet would be eaten | `guideScroll.ts` converts by the scale the sheet is drawn at, only on the desktop, leaving a pinch, `deltaX` and a sheet with no layout to the browser; `tests/unit/strategy-guide-sheet.test.ts` (scales 2 to 4, line and page modes, the leave-alone cases); `tests/e2e/guide-sheet.spec.ts` (a 100 px notch moves the text 90 to 110 screen px at 1600x900); every desktop scenario of the browser proof (a notch is 100.0 to 101.2 px) |
| Opening place | the sheet opens on a half line of the block before the boss's header, or at a stale offset after the fonts load, or not at all because it is not laid out yet; a re-open keeps the old place; a new boss does not move it | `scrollToStart`: only when laid out and the faces are in (`document.fonts`), the empty gap above the block and no more (`gapAbove`), once per opening and per new fight; unit cases for each; browser proof: the unit at the top is the boss's header with 9 to 12 screen px of gap in all eight desktop scenarios, and a real `G` twice puts it back |
| Keys | the sheet takes a key a battle already uses (`PageUp` and `PageDown` are L1 and R1 in `Input.ts` and `rawInput.ts`; the arrows are the menu's) | it takes only `[`, `]`, `Home`, `End` (grep of every `KeyboardEvent.code` in `src`: nothing else uses them); the unit test pins that the arrows, PageUp, PageDown, Enter, Space, W and S are left alone and that a modifier, the phone and a closed sheet are ignored; the e2e presses ArrowDown over the open sheet and it moves nothing |
| The card | it covers more than the old in-panel card did; it squeezes the page; it leaves a stale copy when the status goes; the numerals, the intent slab or the message banner print over it now that it is not inside `.sgd__panel`; the phone's card moves | it stands in `.sgd__slot`, the first row of the column the rail has always had (the lane to its right is not free: the lane scan in the handoff finds a painted figure under a card there in 6 of 18 chapters and a HUD panel in 3 more); the five avoid lists name it (`.sgd__slot > .sthint`) as they named the panel; `tests/unit/status-o3-hint-place.test.ts` (slot, folded, phone, triggers, the squeeze ladder); the hint proof (card, sheet, column, figures, advisor, before and after, 20 cases) |
| Phone | the shared code changes the phone's sheet | the desktop-only rules are scoped `html:not([data-phone-battle])`, the phone's opening keeps its own lead and its own offset parent, and its wheel is left to the browser; the phone proof compares every unit's box and computed type, the sheet and the stack, the scroll positions and the chip, before and after, in four chapters at 390x844 (identical), and a pixel diff of Chapter I's open sheet (0 of 601,880 pixels differ by more than 24/255) |
| TEXT SIZE, clipping | the scaled column clips text or overlaps a panel at 115 and 130 percent. **It did, found by running the check:** `text-size.css` grows FFX's column from its top left by `scale`, the layout cannot see a transform, and a sheet that fills the room it is given (the old panel was content-sized, 10 px short of it) ended 3 px inside the command help slab at 130 percent, which the a2 spec's overlap check (`ix > 2 && iy > 2`) would fail once its first assertion passes (that one, the command menu's `▼` glyph clipped at 130 percent, fails on origin/main too and stops the spec before the overlap checks) | `drawnScale` (`guideScroll.ts`) reads the column's own `scale` and `layout()` gives it the room divided by it, so the grown column ends at its fence; a unit test pins it; `textsize-check.mjs` (a2's panel list, its overlap, off-screen and clipping tests, plus the guide's own clipped text) at 115 and 130 percent, FFX Chapter I and FFX-2 Chapter IV, 1280x720, 1600x900 and 2000x1012, on origin/main and this build: no overlap, nothing off screen, nothing clipped on either (FFX-2's TEXT SIZE is off, D-220 Q4, and was not changed) |
| FFX-2 fence | the sheet always fills its column, so it reaches the fence the HUD parks on the party's heads every time; a figure's box reaches above her head (Chapter XIII's Yuna by about 20 grid px); the old rail was often content-sized and short of it | measured, not guessed: the seven FFX-2 chapters at the first command menu at four sizes, the column against every painted figure's box, 92 runs on the final build. With the 8 grid px first tried the column touched Yuna's box in XI and XIII where origin/main's touched nothing there; 14 left XIII touching; 20 touched XIII by a pixel at two sizes; 24 cleared every run by as little as 0.5 grid px; **`FENCE_GAP` is 28**, which keeps at least 7.7 grid px above her in XIII over 16 runs (origin/main's rail kept 8.3 to 9.9) and touches no figure in any chapter at any size (origin/main touches Chapter IV's Yuna at all four). The cost is a shorter sheet in FFX-2: 173 px against 230 in Chapter IV at 1600x900, 188 against 211 in XI |
| The advisor | the move advisor's placement or output changes | no file under `src/engine/tactics`, `src/battle` or the data folders is touched; the digest of every chapter on seeds 1 to 5 (90 runs, 8,256 decisions) is `cc10c48f...ae425d` as on origin/main; `guide-doc-separation.test.ts` scans the new `guideScroll.ts` too |

## Reach

Shared files touched: `src/ui/common/StrategyGuide.ts` and `strategy-guide.css` (the sheet), the new `guideScroll.ts`, `guideDocHtml.ts` (the
paging-only classes gone), `statusHintCard.ts` and `status-o3.css` (the slot), `phone-battle.css` (one dead rule removed), and one line in
each of five avoid lists (`ffx/DamageNumbers.ts`, `ffx/hudAvoidSelectors.ts`, `ffx2/battleMessage.ts`, `ffx2/DamageLayer.ts`,
`ffx2/intentBoard.ts`). `guideFit.ts` and its tests are parked on `F:/pyrefly-parked/2026-10-03/guide-sheet/`. No file in
`docs/CONTRACTS.md` is touched. The deep review's first things to look at: the sheet's opening place in a chain chapter (V, XVII) as the
boss changes, the card in FFX at 1280x720 (it stands alone and the sheet steps aside), the card at TEXT SIZE 130 (it stands alone at every size; no overlap, nothing
clipped, measured at three sizes), FFX-2's sheet height where the girls stand high, and the pad's right stick on a real pad.

## Result

PROCEED. The build changes nothing the advisor, the engines or the saves read; its one new risk, the wheel, is closed by arithmetic and a
browser assertion; what it does not do (a larger sheet, a held battle) is named in the handoff for Bailey, not guessed.
