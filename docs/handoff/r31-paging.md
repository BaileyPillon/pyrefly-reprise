# R31 phone page buttons (PR-0218, D-286, option B1)

Branch `r31-paging` (from `origin/main` 8dce5e75). Not pushed, not deployed.

**Game case: FFX only.** The list window and its inert up/down marks are FFX's
`src/ui/ffx/CommandMenu.ts`. FFX-2's list is a different widget
(`ui/ffx2/CommandMenu.ts`) with no such marks, so nothing here applies to it (AGENTS.md rule 14).

## What

Build of option B1 from `docs/concepts/r29-options/options.html`: on a phone, the inert 14 px
up/down marks on a long FFX command list become two real 44 px buttons in the list header
(between the list name and GUIDE) with an "N-M OF T" counter. A tap moves the window one page
and confirms no row. A dimmed button (`disabled`) means there is no more that way. The desktop
window (`computeMenuWindow`, centred on the selection) and the desktop marks are unchanged.

- `src/ui/ffx/CommandMenuPaging.ts` (new, 71 lines): `pageStartFor`, `pagerCounter`, `canPage`,
  `selectionAfterPage`, `pagerHtml`, `pagerNeedsStack`.
- `src/ui/ffx/CommandMenu.ts`: `pagerEl`, `pageStart`, `renderPager`, `onPagerClick`; `renderRows`
  uses a tapped page when there is one. A tapped page is dropped by any key move, by a change of
  list (state setter) and on `open`; it survives a look at the targets and Esc back.
  `FFXBattleHud.ts` appends `pagerEl` to the command area.
- CSS: `ffx-hud.css` hides `.ffx-cmd-pager` (desktop); `phone-hud.css` shows and lays it out on a
  phone only (`html[data-phone-battle='ffx']`) and hides the inert marks while the pager is up.
- On a page tap the selection moves to the same place in the new page, so the help slab and turn
  preview follow. A row tap still selects and confirms exactly as before.

## How it was proven

- `tests/unit/ffx-command-menu-paging.test.ts` (13 tests): page arithmetic, the counter, dimmed
  states, no row confirmed by a page tap, keyboard still centres, hidden for a short list and after
  Esc, 44 px targets, desktop hide. `tsc --noEmit` clean. `ffx-cmd-crumb-clear`, `phone-battle-hud`
  still pass. Orphans 24 = 24 (no growth).
- Real taps in headless Chromium (GPU), 390x844, Chapter IX (Yojimbo): 27-row Items; three taps
  on the down button reach 19-24 with Fire Gem; tapping Fire Gem used it (571 damage); the next
  turn's Poison Fang (row 23, same page) was tapped, then Confirm on the target bar used it
  (Yojimbo 5% to 8%). The last page (22-27 OF 27) dims the down button and a forced tap on it does
  nothing. `docs/screenshots/r31-paging/` (JPEGs); script `.r31-paging-tmp.mjs` (root scratch).
- 1600x900: pager has no box (`display: none`), the inert marks still show, keyboard window
  unchanged (10 downs gives rows 8-13).

## Deviations from the mockup (told to Bailey here, not hidden)

1. No "TAP TO PAGE" second line: the phone rule (CHK-003, nothing under 14 px) rules out the mock's
   11 px hint and at 14 px it does not fit beside the counter. The counter is 14 px, one line.
2. A long list name ("BLACK MAGIC", 9 rows for Lulu) does not fit beside the counter, so the
   counter drops under the name (`data-stack`, decided once per list from the widest counter).
   "ITEMS" stays side by side as mocked.

## Not done / open

- Top-level lists are not paged (4-5 rows on a phone, so no need). Only submenus and a wrapper
  list show the pager.
- `CommandMenu.ts` was 790 lines before this change and is 856 now (rule 7 was already broken);
  the new logic that could be pure is in the new file, the rest needs the class's private state.
- Full suite: 3 files fail in this worktree, none touched here: `strategy-ffx2-bahamut` (heal-only
  route, engine, slow), `ui-portrait-face-crop` (art on disk in this worktree), and
  `audio-manifest-io` (flaky under load; passes alone).
