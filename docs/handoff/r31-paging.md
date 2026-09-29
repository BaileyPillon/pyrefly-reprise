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

## CHECK (independent, 2026-09-29, did not build it)

Checked `a4a9d864` on a fresh production build (`vite build` of this commit, `vite preview` on
port 8921, stopped by PID after), headless GPU Chromium, real Playwright taps. **No blockers.**

- `tsc --noEmit` clean. `ffx-command-menu-paging` 13/13, and all 33 test files that import the
  FFX command menu, the FFX HUD or the phone CSS: 552 passed. Orphans 24 (no growth).
- 390x844, Chapter IX Items (27 rows): down taps give 1-6, 7-12, 13-18, 19-24, 22-27; up taps
  from the end give 16-21, 10-15, 4-9, 1-6. Up is dimmed on 1-6, down on 22-27, and a tap on a
  dimmed button changes nothing. No page tap confirmed a row or ended the turn (menu still open on
  Items after every tap). Selection and help slab follow the page (Fire Gem: "Deals fire damage to
  five random enemies."). Tapping Fire Gem on 19-24 used it and the next turn came up; reopening
  Items starts again at 1-6.
- Poison Fang on 19-24 opens the target step (pager hidden with the list); Back returns to 19-24
  with Poison Fang still selected; Esc to the top level and reopening Items gives 1-6.
- A key after a page tap (phone with a keyboard) drops the tapped page and re-centres the window
  on the selection (19-24 to 18-23), as described.
- Layout: buttons 44x44 at 360, 390 and 430 wide, clear of GUIDE (4 px gap at 390:
  down button right edge 293, GUIDE left 297), no horizontal scroll. "ITEMS" sits beside the
  counter at 390 and 430 and stacks at 360; "BLACK MAGIC" (Lulu, 9 rows) stacks at 390, 1-6 then
  4-9 OF 9. Nothing clipped; looks as the B1 mock apart from the two deviations listed above.
- 1600x900: pager `display: none`, the inert marks show, 10 downs give rows 8-13 and 26 give
  22-27, same as the old centred window.
- `git merge-tree` against `origin/main` (8dce5e75) and the local `main` (1475ff6b, with the
  release 31 merges): clean, no conflicts. Main's FFX UI changes since the fork (Sin HUD, airship
  orders, advisor selectors) do not touch the menu or the phone CSS.
- The reported reds: `strategy-ffx2-bahamut` and `audio-manifest-io` pass here when run alone;
  `ui-portrait-face-crop` fails on four songstress paintings with no measured head (art on disk
  newer than this branch); none of them is touched by the change.

Findings (none blocks):
- Minor, rule 7: `CommandMenu.ts` grows from 790 to 856 lines; it was already over 400.
- Minor: pages going up are not the pages going down (22-27 up gives 16-21, not 13-18), because
  the last page is clamped to the end. No row is skipped either way.
- Minor, outside this change: at 360x740 a first-time coach mark ("ffx-turn-order") intercepts
  the first tap on a command row until it is dismissed; seen while testing, not caused by the pager.
- Rule 9: the two deviations from the mock (no "TAP TO PAGE" line, counter under a long name) are
  disclosed above and are for Bailey to accept.
