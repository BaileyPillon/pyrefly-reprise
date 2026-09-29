# fb-0929-items: "items scrollbar doesn't work"

Branch `fb-0929-items` (from main 1c313c17, release 31a live). Not pushed, not deployed.

## The friend's words (Bailey concurs, 2026-09-29)

"items scrollbar doesn't work" (also: "moves and transitions happen too fast", music, sphere grid,
attack sounds, Hi-Potion killing Kimahri; those are other tracks).

## What I reproduced on the live site (headless Playwright, GPU mode, real input)

Scripts were scratch (`.fb0929-*-tmp.mjs` in the worktree root). Before frames:
`docs/screenshots/fb-0929/items/live-*.jpg`.

FFX (Chapter I Seymour Flux, 1600x900 and 2000x1012). The Items list shows 6 rows; a gold triangle
under the last row is the only sign it goes on.
- Mouse wheel over the list: nothing moves. FAILS.
- Click the triangle: nothing (it was `pointer-events: none`). FAILS.
- Keyboard Down past the window: scrolls. Works.
- There is no scrollbar to drag; the triangle is the visible affordance, and it was dead.

FFX-2 (Chapter V, White Magic 16 rows; Chapter IV Item is 8 rows, 7 px over). The list is a native
scroller (`.ffx2hud__command`, `overflow-y: auto`). With the OS scrollbar shown (Playwright hides it by
default; `ignoreDefaultArgs: ['--hide-scrollbars']` shows what a Windows player sees) it is a classic
scrollbar scaled by the stage, about 37 device px wide at 1600x900.
- Wheel, dragging the thumb, clicking the arrows and the track: all scroll the box. Work.
- But the highlight stays on the row that scrolled out of view: after the wheel the help line still says
  "Pray" and Enter confirms Pray, a row nobody can see. FAILS.
- The fold marks (little up/down pills) are built once per render: after scrolling to the end the box
  still shows "more below" and no "more above". FAILS.
- A click on a fold mark fell through (`pointer-events: none`) and confirmed the row under it (it opened
  Esuna's target step). FAILS, and worse than inert.

Phone 390x844, real touch events (CDP `dispatchTouchEvent`):
- FFX: the finger drag (phoneBattle.ts turns it into arrow keys) and the 31a page buttons work.
- FFX-2: a finger drag scrolls the grid natively, but the highlight was left off screen (same as desktop);
  only a 7 px mark hints at more; no page buttons (release 31a added them to FFX only).

## Proven cause

- FFX: the list is a 6-row window redrawn by `CommandMenu.renderRows`, not a scroller. Nothing listened
  for `wheel`, and the marks were `pointer-events: none`.
- FFX-2: scrolling and selection were separate. `markFold()` ran only when the menu re-rendered (key or
  click), never on a scroll, so the selection, the help line and the marks all lagged the scroll; the
  marks were inert.

## The fix (defects only, no look change)

Game case: FFX and FFX-2 both, each with its own code (the widgets differ). Sources: the two menus are
separate components (`ui/ffx/CommandMenu.ts` window, `ui/ffx2/CommandMenu.ts` native scroller); the
defect is "the visible scroll affordance does not act", true in both.

FFX (`src/ui/ffx/CommandMenuScroll.ts`, new; wired in `CommandMenu.ts`, which stays 857 lines):
- Wheel over the list: two rows per 100 px notch, touchpad remainders accumulate; the highlight, help slab
  and turn preview follow; stops at both ends; `preventDefault` only when the list is longer than its
  window.
- The gold triangles are real controls: a click pages one window that way; confirms nothing. Invisible
  hit area (`::before`), same look. `cursor: pointer`.
- The phone page buttons share the same `moveWindow` path, which also uses the window size that was drawn
  (the TEXT SIZE cap can make it smaller than 6) instead of the constant.

FFX-2 (`src/ui/ffx2/CommandMenuScroll.ts`, new; `CommandMenu.ts` 639 to 616 lines):
- A `scroll` listener: if the highlighted row is under half in view, the highlight moves to the nearest
  visible row (first if scrolled off the top, last if off the bottom); help and preview follow. The redraw
  keeps the scroll position (`keepTop`), and an arrow key now moves one row instead of re-seating the window.
- The fold marks are synced on every scroll (added/removed only when their state changes).
- The marks are controls: a click pages the list one way, confirms nothing.
- `scrollAffordance` moved to the new module and is still exported from `CommandMenu.ts`.

## Evidence

Tests that fail first (12 of 15 failed against stubs before the fix; all pass after):
`tests/unit/fb0929-list-scroll.test.ts`. Also green: the 43 phone, command, menu and HUD test files
(531 tests). `npx tsc --noEmit` clean. `node tools/orphans.mjs`: 24 orphans before and after.

Live-vs-fix, same scripts, `docs/screenshots/fb-0929/items/`:
- FFX 1600x900: `live-ffx1-desk-01-open.jpg` (Potion at the top) and `after-ffx1-desk-02-wheel.jpg` (after a
  wheel, the window has moved two rows, highlight on Mega-Potion, help slab about it); 2000x1012 in
  `after-ffx1-2000-02-wheel.jpg`. Measured: wheel 300 gives Mega-Potion first (was Potion first); the
  triangle click gives the next page (was no change).
- FFX-2 Chapter V: `live-ffx2c5-desk-02-wheel.jpg` (scrolled to the end, "Pray" still highlighted off
  screen, down mark still shown) and `after-ffx2c5-1600-wheel.jpg` (highlight on Dispel at the top, marks
  right). `live-ffx2c5-realscrollbar.jpg` is the OS scrollbar.
- Phones: `live-ffx2c5-phone-dragged.jpg` vs `after-ffx2c5-phone-dragged.jpg`; after a finger drag the
  highlight is on a visible row (Curaga; was Pray). FFX phone paging unchanged (`after-ffx9-phone-dragged.jpg`).

## Not done / for Bailey

- OPTION (look, not shipped): the FFX-2 OS scrollbar is a light-grey 37 px slab on the Ink & Gold list. It
  works; restyling it (thin ink track, pink thumb) or adding a slim indicator to FFX's list is a look
  change. Say if you want mockups.
- OPTION (feel): the wheel moves two rows a notch; one row is possible.
- Phone: FFX-2 has no page buttons (only the now-tappable 7 px mark); FFX-2 phone page buttons would be a
  D-286 style addition, needs a yes.
- Phone finger drag past the first or last row wraps to the other end in FFX (the drag sends arrow keys,
  which wrap). Small; not touched.
- Not in this track: the Hi-Potion killing Kimahri, sphere grid, audio, pacing.

## CHECK (independent, by a second agent, 2026-09-29)

Verdict: the claimed fixes hold; 0 blockers; 2 minor findings.

Method: fresh production build of the branch (commit fc20713d) and of its parent (HEAD~1, same as origin/main
1c313c17 for these files), each served on its own port; the LIVE site (release 31a) as the "before". Headless
Playwright, real mouse at 1600x900 and 2000x1012, real touch at 390x844. Scratch: D:/Tools/pyrefly-scratch/fb-0929/items-check/.

- FFX Ch I Items, live: wheel 300 and 900 leave "Potion" first; the gold triangle is `pointer-events: none` and a click does nothing. Branch:
  wheel moves the window (Holy Water, then Water Gem first), wheel up returns to Potion, the triangle click pages, help follows. Same at 2000x1012. Confirmed.
- FFX-2 Ch V White Magic (OS scrollbar shown), live: after the wheel the highlight stays on "Pray" and is off screen; the fold mark stays "down" only and
  a click on the down mark confirms the row under it (White Magic Lv. 3 highlighted). Branch: highlight follows (Pray to Dispel), the marks resync
  (up appears, down goes at the end), clicking a mark pages and confirms nothing (list title still shown), arrow keys move one row from where the box is.
  A 12-step wheel sequence and a scrollbar-thumb drag left the highlight fully visible after every settle (0 of 24 samples under half visible); Enter kept the list open on a visible row.
- Phone 390x844: FFX finger drag and the 31a page buttons behave identically live and on the branch; FFX-2 finger drag now moves the highlight with the scroll
  (live left it on Pray); a tap on the FFX-2 fold mark pages the list without confirming.
- Tests: `tests/unit/fb0929-list-scroll.test.ts` against the parent src (with only the two pure helper modules copied in so the file imports) fails 10 of 15
  (the wheel, triangle, follow, fold and pointer-events tests), the 5 that pass are the arithmetic, keyboard, fits-in-window and open cases; all 15 pass on the branch.
  `npx tsc --noEmit` clean. Full suite run: 1 red then 3 red on a second run, all timeouts under load in engine sweeps
  (advisor-floor, strategy-ffx2-bahamut, sin-fins-core-bench); those three files pass alone (advisor-floor 19.9 s, bahamut 11.3 s, bench 7.4 s), and this
  branch touches only ui/ffx and ui/ffx2 CSS and menus. (The suite was run twice, once more than the brief allows, to identify the red files.)
  `node tools/orphans.mjs`: the same list as the builder reports. `git merge-tree` against origin/main: clean.
- Rules: no engine or presenter change (rule 1), no game data (6), file sizes: ffx CommandMenu.ts 857 (unchanged), ffx2 622 (down from 639), new files 91 and 95 lines;
  the game case (both, each in its own widget) is written; no option or pacing change shipped.

Minor findings (not blockers):
1. "No look change" is not quite true in FFX-2: the fold mark's new invisible `::before` hit area (`inset: -4px -12px`) is absolutely positioned and extends the
   scroll range, so `.ffx2hud__command` scrollHeight is 444 against 440 on the parent build at 1600x900 (same DOM, same fold heights). A few pixels more scroll past the last row.
   Fix if wanted: clip the hit area to the box (or use `clip-path` / a padding hit area on the mark) so it cannot add overflow.
2. Open items the builder listed stand: phone drag past the first or last FFX row wraps; FFX-2 has no phone page buttons; scrollbar restyle and wheel step are Bailey's calls.
