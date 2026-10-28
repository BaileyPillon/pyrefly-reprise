# ui-input: lane handoff (review fixes included)

Lane `ui-input`, branch `ui-input`, tree `D:/pyrefly-rig-rikkudk`, 2026-10-28. ChatGPT's point 6 (critique of 2026-10-17) and
Codex's source audit T-0002. The contract itself, its table and "adding a screen" are in
[ui-input-contract.md](ui-input-contract.md); this file is the lane's handoff: what changed, what the review found and how it was
fixed, the browser jobs that are owed, what remains, and the CHANGELOG lines.

Authority: Bailey, 2026-10-28, "please work on the pose continuity fix and and crtiques for chatgpt i mentioned awhile ago as well
as motion fluidity and animation. work on all those. i'll go with all your recommendations and decision-making for the next couple
days."

**Game case: both** (the title, the chapter board, party prep and the pause menu are shared UI; FFX chapters 1 to 3 and FFX-2
chapters 4 and 5 meet the same keys). One effect is FFX only: the Sphere Grid tab on party prep is FFX, and it is the one screen
that reads Shift (WALKS); the prep section fold that the same press triggered on a phone with a keyboard is both games.

## What changed (three commits before the review, one after)

1. `e47560c1d`: one input/focus contract (`src/app/focusContract.ts`, asked by `Input.onKeyDown`); Tab is the browser's on the
   title, the board and prep; Enter and Space press a Tab-focused control once and are not also the screen's Confirm; real tab and
   button semantics on the board, prep and the pause strip; the Ink & Gold focus ring (`src/ui/inkgold/focus.css`); chapter
   cards 44 px on a phone; the phone touch-target probe.
2. `60b8ebbbc`: the pause pages keep the focus they place themselves; the key-map tests read `inputKeyMap.ts`; the paper preflight
   (`docs/plans/ui-input-review.md`). (Its message describes more than it contains; noted by the review as m9, no code consequence.)
3. `62ff4feca`: `ChapterSelectScreen.ts` back to 398 lines.
4. The review-fix commit (this file's commit): see below.

## The adversarial review of `62ff4feca` and what was done with it

Verdict was SHIP-WITH-FIXES: no critical, two majors. Full text: `D:/Tools/pyrefly-scratch/2026-10-28/ui-input/review/REVIEW.md`.

| Finding | Status | What was done |
|---|---|---|
| **M1** the focus ring drew on the cursor (look regression on desktop) | **fixed** | `focus.css`: the ring is `:where(screens) :where(types):focus-visible:where(:not([data-cursor]))`, specificity [0,1,0] (it was [0,3,1]); every rule written with a class beats it with no tie to settle by source order, and the stronger `[data-cursor]:focus-visible { outline: none }` stays as a belt. `tests/unit/focus-ring-specificity.test.ts` (new, 4) computes the specificity from the real stylesheets and fails if the ring ever out-ranks the cursor rule or one of the existing `outline: none` rules (proved: it fails 3 of 4 against the previous `focus.css`). |
| **M2** Shift+Tab fired the triangle on the title, board and prep (flipped Sphere Grid WALKS on FFX prep; folded every prep section on a phone with a keyboard) | **fixed** | Recommended shape taken: on a screen whose Tab is the browser's, Shift is **deferred**. `FocusLedger.keyDown` answers `'deferred'` for Shift there; `noteKey` (every key, mapped or not) marks the held Shift as used; `shiftTap` on the key-up is true only for a Shift let go alone, and `Input.onKeyUp` then latches the triangle once, on the release (not under a keyboard claim); window blur forgets a held Shift. Shift+Tab, Shift+arrow, Shift+any key, both Shifts: nothing latched. A lone Shift tap is still the triangle (Sphere Grid SHIFT WALKS), one release later. The battle, the pause menu and every other screen are unchanged (Shift is the triangle on key-down). `tests/unit/input-shift-tap.test.ts` (new, 17). `Input.ts` stays at 553 lines (net zero). |
| m1 "Escape is always Cancel" false inside a field | **doc fixed** | The sentence now says a text field owns Escape too; the one field in the game (the board's door field) holds an exclusive claim and ends itself. Not changed in code: Escape blurring a non-text input would be a product call, and nothing in the game has one. |
| m2 window listeners outside `Input` still hear keys | **doc fixed** | The "owns EVERY key" sentence now says it is about `Input`; `RawInputWatcher`, the door matcher and the strategy guide are named as outside the contract. None sits beside a field today. |
| m3 non-exclusive claim plus the control branch fires twice | open (latent) | Needs the claim passed into `keyDown`; the pause's own focus lands on cursor rows, so it cannot happen today. Left rather than changing the pause's key path without a browser. |
| m4 prep roster row, ArrowDown moves focus to the tab strip | open (cosmetic) | Giving the roster row `data-cursor` changes which element is "the last cursor" for every prep key; needs the real-key walk first. |
| m5 no-panel prep shell swallowed Enter | **fixed** | The STATS tab of `prepTabsHtml([])` is a `data-cursor`, so Enter is the screen's Confirm there. Unreachable in FFX and FFX-2 (panels register at module load). |
| m6 COMING cards got `tabindex="-1"` | **fixed** | The selection loop runs over `.fe-card[data-card][data-action]` (playable cards) through the new `markCardCursor` in `frontend/chapterCards.ts`. |
| m7 `aria-labelledby` pointed at a missing id | **fixed** | `labelPrepPanel` removes the attribute when no tab is open. |
| m8 several statements on one line to hold the line cap | **fixed** | `ChapterSelectScreen.ts` 398 to 396 lines (the helper took them out); `TitleScreen.ts` split across two lines (383). |
| m9 commit 2's message | n/a | History is not rewritten (no amend). Described above. |
| m10 the full suite was never run on this branch | **partly** | See "Tests run". The full `npm test` is still the driver's before the merge. |

## Tests run (this lane, after the fixes)

* `tsc --noEmit`: clean.
* 160 test files chosen by what they import or exercise (every test that names a changed module, a key map, `new Input(`, or
  dispatches a `KeyboardEvent`, plus the review's 56 and the lane's 11): see the result line below.
* The full `npm test` (about 1,700 files) was not run: with other lanes live the previous attempt died with worker errors after 9
  files and then crawled; the driver's run before the merge is still owed (AGENTS.md says 110 files; that number is stale).

**Result: 160 files passed (160), 2,596 tests passed, 3 skipped, 1 todo, 0 failed** (vitest 5.0.1, --maxWorkers=3, 205 s; log `D:/Tools/pyrefly-scratch/tmp/uiinput-run1.log`). Includes the two new files (input-shift-tap 17, focus-ring-specificity 4) and input-focus-contract (32), ui-input-screens (18), board-focus, pause-remake, the party-prep suites, the door suites and the battle HUD key suites.

## Browser jobs (nothing was run: the browser belongs to the deep-gap pass until about 19:45 EDT, then release 67)

Specs and written predictions: `D:/Tools/pyrefly-scratch/2026-10-28/ui-input/jobs/` (`README.md`, `focus-walk.mjs`) and the
reviewer's `review/jobs/review-probe.mjs`. Setup in `jobs/README.md` (build this branch, `vite preview --port 5199`, stop it by PID).

Predictions for the fixed branch (the reviewer's probe states the same for the unfixed one):

* **P-M1** board: Tab, Tab (hero, then the selected card), ArrowRight: the focused element is the new cursor card and
  `getComputedStyle(...).outlineStyle` is `none`. Open prep tab and pause tab the same. Pause EYE CANDY, ArrowDown: the selected row
  `none`. A control that is not the cursor (BACK on prep, Tab-focused) draws `solid`, `2px`. `focus-walk.mjs` check B2b, which
  predicted exactly this, passes.
* **P-M2** FFX Chapter 1 prep, ArrowRight to the Sphere Grid tab (hint ends `SHIFT WALKS`), a real Shift+Tab (Shift down, Tab
  down): the hint is unchanged, focus moved one control back, the roster and tab arrows still move. Then a lone Shift tap: the hint
  flips to the walking text on the release, and not before it.
* **P-Phone** the lane's phone sweep numbers (P-T1 to P-T5 in `jobs/README.md`) are unchanged by these fixes.

## Remaining

* Everything in the "Remaining" list of [ui-input-contract.md](ui-input-contract.md): the touch targets nobody has boxes for yet (title hint
  entries, board controls strip, prep hint spans, pause Back and Hide chips, the briefing and first-run chips), the battle controls
  (they read `window` themselves), the results page and the dialogue box, the door field's keyboard entry (Bailey's call).
* m3 and m4 above (both latent or cosmetic; each wants the real-key walk first).
* The three product calls in the contract's open questions (Enter on a focused prep tab begins the battle; Tab stays "next tab" on
  the pause menu; Tab on prep is not the triangle) were taken at the defaults; the reviewer had no objection.
* The browser jobs above, and the driver's full `npm test`, before the merge.

## CHANGELOG lines (plain words; the entry for the release that carries this lane)

* **Both games: the title, the chapter board and the party screen work with the keyboard the way a web page does.** Tab and Shift+Tab walk
  the buttons and tabs; Enter or Space on a button you Tabbed to presses that button (and only that one); an arrow key hands the keys
  back to the game, so Enter after an arrow is still "go" on the card or tab you moved to. Escape still means back. The pause menu and
  the fights keep their keys exactly as they were.
* **Both games: a gold ring (pink in the FFX-2 chapters) shows which button the keyboard is on, only when you got there by keyboard.**
  The chapter card, the open tab and the selected row keep the game's own highlight and no ring, so playing with the arrow keys looks
  the same as before. Clicking or tapping draws no ring.
* **Both games: the chapter cards are taller on a phone** (44 px, up from 35 at 390 wide) and the eye-candy page rows too, so a thumb
  lands on the card it means.
* **Both games (FFX only for the Sphere Grid): Shift is held back until you let go.** Shift+Tab walks back without also pressing the
  game's triangle; tapping Shift alone still works (the Sphere Grid's SHIFT WALKS), one release later.
* **Both games, nothing a player sees:** screen-reader names and tab/tabpanel roles on the board, party prep and the pause strip; a
  structural test keeps the focus ring from ever out-ranking the cursor rule again.

Player note (`src/app/changelog/releaseNotes.ts`): one line, Both, in the release that carries this lane: "Tab, Shift+Tab, Enter and
Space now work on the title, the chapter list and the party screen the way they do on any page, and cards are bigger to hit on a phone."

## Block for NOW.md (not edited here: other lanes edit it; paste at the merge)

> ui-input (ChatGPT point 6): branch `ui-input`, reviewed (SHIP-WITH-FIXES: M1 the focus ring on the cursor, M2 Shift+Tab pressing
> triangle; both fixed, minors m1/m2/m5-m8 fixed, m3/m4 latent and open). One input/focus contract
> (`docs/handoff/ui-input-contract.md`, this file for the review). Owed: the driver's full `npm test`, then the two browser jobs
> (focus-walk and the reviewer's probe) and the phone before/after after about 19:45 EDT. Both games (the Shift fix matters on FFX
> prep's Sphere Grid).
