# ui-input: one input/focus contract, real button and tab semantics, 44 px touch targets

Lane `ui-input` (branch `ui-input`, tree `D:/pyrefly-rig-rikkudk`), 2026-10-28. ChatGPT's point 6 (critique of 2026-10-17, memory
`chatgpt-critique-2026-10-17`), Codex's source audit T-0002 (`D:/Tools/echoes-coordination/codex-a11y-audit.md`).
Authority: Bailey, 2026-10-28, "please work on the pose continuity fix and and crtiques for chatgpt ... i'll go with all your
recommendations and decision-making for the next couple days."

**Game case: both.** The title, the board, party prep and the pause menu are shared UI; nothing here knows which game is on screen
(FFX chapters 1 to 3, FFX-2 chapters 4 and 5 meet the same keys). The focus ring takes the screen's accent (`--ig-accent`: gold, or
pyre pink under `.ig--ffx2`).

## Why

`Input.ts` read every key for the game and called `preventDefault()` on Tab, Space and the arrows. So a menu, a tab or a button
could not take focus the browser way, and Enter on a focused control did not press that control: it was the screen's Confirm
(on party prep, START BATTLE) whatever had focus. Adding `role` and `tabindex` to every `div` would not have fixed that (Codex's
finding), so the contract comes first and the semantics are built on it.

## The contract (`src/app/focusContract.ts`, asked by `Input.onKeyDown`; first match wins)

| # | Situation | Who owns the key | What happens |
|---|---|---|---|
| 1 | Ctrl, Meta or Alt chord | the browser | untouched (as before) |
| 2 | an **exclusive** keyboard claim (the briefing, a first-use card, the title's info panel) | the claimant | untouched (as before; never asks the ledger) |
| 3 | focus is in **text entry** (input, textarea, select, contenteditable) | the field | the game latches nothing, prevents nothing |
| 4 | **Tab / Shift+Tab** on a screen that gives it up (`title`, `chapter-select`, `party-prep`, or `data-tab-owner="browser"`) | the browser | focus walks the controls; no triangle |
| 4b | Tab anywhere else (the battle, the pause menu) | the game | triangle / the pause's next tab, kept from moving focus (as before) |
| 5 | **Enter / Space on a focused control**: an activator (native button or link, or `role` button, tab, switch, checkbox, radio, menuitem, option, link; not disabled), focus got there by Tab or from assistive technology, and it is **not the screen's cursor** | that control | it is pressed **once** (a native one by the browser; a `div role="button"` by the bridge `click()`, which `Input.onClick` turns into the same `data-action` a mouse click makes) and the game's Confirm is **not** also pressed |
| 6 | everything else | the game | as before: Enter / Space on the cursor (`data-cursor`: its activation IS the screen's Confirm), on a control the mouse focused, or on nothing; the arrows, WASD, Z, X, Q, E, F, R, Escape, the pad |

Two consequences worth stating:

* **A clicked control is the mouse's, not the keyboard's.** The first game key after a click lets it go (`blur`), so Enter does not
  both Confirm and re-press the button clicked a minute ago (it used to do both on a native button).
* **Focus follows the cursor.** A game key (not a modifier, not Enter or Space, not the browser's Tab) pressed while a control holds
  Tab-focus hands the keys back: after the frame in which the screen answered, focus moves to the screen's cursor (the last
  `[data-cursor]` in the top screen: a strip over rows marks both, and the one nearest the content is in play), or is let go if there is none. So "Tab to BACK, press an arrow, press Enter" is the cursor's
  Confirm, never BACK. Shift alone (the start of Shift+Tab) and other modifiers never trigger it. If the screen put focus somewhere itself while it answered
  the key (the pause pages focus their selected row), that focus is the cursor's and is left alone.
* **Escape is always Cancel.**

The ledger knows how focus arrived (`tab`, `pointer`, `game`, `other`) by listening to `focusin` and to the pointer events; a focus
move with no input behind it (assistive technology, or the game restoring focus after a panel) keeps what the element was before,
else is `other`, which is a control focus. A node environment (no `document`) makes every answer "the game", so the unit tests of
screens that run without a DOM are unchanged.

### The cursor, `data-cursor`

The element a screen's own highlight is on: the selected chapter card, the open prep tab, the open pause tab, the selected pause
row, the selected row of the pause pages (EYE CANDY, PRESENTATION, the options list). It is the one place where "press the focused
control" and "the screen's Confirm" are the same thing, so Enter and Space on it stay the game's (the board begins the chapter,
the pause tab enters its rows, prep begins the battle as its hint says). Its focus ring is off (the game draws it); every other
control gets the Ink & Gold ring (`src/ui/inkgold/focus.css`: 2 px, `--ig-accent`, offset 2 px, `:focus-visible` only, so a click
or a tap draws nothing; scoped to the title, board, prep and pause).

### Adding a screen

1. Say whether Tab is the browser's: add the `data-screen` name to `BROWSER_TAB_SCREENS`, or put `data-tab-owner` on the root.
2. Mark the cursor with `data-cursor` (maintained where the screen already moves its highlight) and give a list one tab stop
   (`tabindex` 0 on the cursor, -1 on the rest).
3. Give every pressable element a `role` and `tabindex="0"` and a name; a tab is `role="tab"` with `aria-selected`, an id,
   `aria-controls`, in a `role="tablist"`, over a `role="tabpanel"` with `aria-labelledby`. A plain button does not get
   `aria-selected` (the audit is right: that belongs to tabs, options and gridcells); a current item gets `aria-current`.
4. Do not read Tab or Enter off `window` yourself. If a panel needs raw keys, claim the keyboard (`Input.claimKeyboard`).

## What changed

| Where | Change |
|---|---|
| `src/app/focusContract.ts` (new, 265 lines) | the contract: predicates, `tabOwnerOf`, `FocusLedger` |
| `src/app/inputKeyMap.ts` (new) | `KEY_MAP`, `PAD_MAP`, `MODIFIER_CODES` moved out of `Input.ts` unchanged, so `Input.ts` could take the contract and shrink (613 to 553 lines) |
| `src/app/Input.ts` | owns a `FocusLedger`; `onKeyDown` asks it; `endFrame` calls `afterFrame`; the bridge's click does not set `lastDevice` to pointer |
| `ChapterSelectScreen.ts`, `frontend/chapterCards.ts` | the rail is one tab stop; the selected card is `data-cursor`; stays 399 lines |
| `PartyPrepScreen.ts`, `party-prep/prepTabs.ts` (new), `PartyPrepContent.ts` | `role="tablist"`, real tabs (`aria-selected`, id, `aria-controls`, roving `tabindex`, cursor), the sheet is a labelled `tabpanel`, START BATTLE is a named button, the current roster row has `aria-current`; `renderTabs` moved out (400 to 390 lines) |
| `pause/markup.ts`, `PauseView.ts`, `PauseScreenPanels.ts`, `pause/eyeCandyPage.ts`, `pause/presentationPage.ts` | tab ids and `aria-controls`, the body is the `tabpanel`, roving `tabindex`, `data-cursor` on the open tab and the selected rows (so the pause pages keep Enter as before); `PauseView.ts` stays 404 lines |
| `src/ui/inkgold/focus.css` (new) | the Ink & Gold focus ring |
| `frontend.css`, `pause-eye-candy.css` | chapter cards `max(44px, 48 * k)` at 390 wide (was 35.2 px); eye-candy page rows 44 px on a phone (was 40) |
| `tools/touch-target-probe.mjs` (new), `tools/text-floor-sweep.mjs` | the phone sweep: `--targets=1` also lists every pressable control's box and what is under 44 px; a `title` scene |

Not changed on purpose: the pause menu's Tab (the approved Until Dawn layout: Tab and Shift+Tab walk the strip; the pause keeps
its non-exclusive claim and `pause/keys.ts`), the battle (Tab is the game's; the command menus read `window` themselves), every
exclusive overlay, the pad.

## Tests

`tests/unit/input-focus-contract.test.ts` (32: the predicates; every game key with nothing focused; Tab on and off the screens that
give it up; text entry; the bridge for a `div` and a native button, Enter and Space, a held key, a disabled control, Z; the
cursor; a clicked control; restored focus; focus follows the cursor, Escape, modifiers, the screen on top; claims),
`tests/unit/ui-input-screens.test.ts` (18: the board is one tab stop and the stop is the cursor, Tab to the hero then Enter, Tab then
an arrow then Enter begins the chapter the cursor moved to, Space, Escape; prep's tablist, panel, START BATTLE, BACK does not begin,
a roster row does not begin, Enter with nothing focused still begins; the pause strip's ids; the title's chips),
`tests/unit/touch-target-probe.test.ts` (4). The first was mutation-checked: with the ledger disabled 16 of its first 30 failed (the 31st and 32nd, the pause strip over its rows and focus the screen placed itself, came after the first run found the second as a real regression in `pause-eye-candy-page.test.ts`).
The existing pause, prep, board and input suites are unchanged except `pause-presentation-page.test.ts` (the pin 40 to 44 px).

## Owed (the browser belongs to the deep-gap pass until about 19:45 EDT, then release 67)

Job specs in `D:/Tools/pyrefly-scratch/2026-10-28/ui-input/jobs/` (README has the commands and the written predictions):

1. **Phone before/after** at 390 x 844 with touch: `node tools/text-floor-sweep.mjs --touch=1 --targets=1 --sizes=390x844
   --screens=title,board,prep-ffx-first,pause-ffx --base=<live | the branch's preview> --out=docs/screenshots/ui-input/<before|after>`.
2. **Real-key focus walk** on the real game: `jobs/focus-walk.mjs` (title, board, prep; screenshots of the ring).

## Remaining

* Measure everything else under 44 px on a phone (the sweep above lists it): the title's hint entries, the controls strip, prep's
  hint spans, the pause's Back and Hide chips, the briefing and first-run chips. Not guessed: each needs its box and its
  neighbours seen (Codex's list says content-dependent). Known from the CSS and left because they sit in the battle HUD, where a
  taller hit box moves neighbours and nothing can be looked at today: the hidden-intent restore toggle (32 px,
  `phone-battle-parts.css:279`) and Defend (40 px, `defend-control.css:80`).
* Battle controls (Codex's P1 rows for the FFX and FFX-2 command menus, the target rectangles, the CTB row, the minigame slabs,
  Auron's chips, Trigger Happy, Lady Luck): they read `window` themselves, so they need their own pass with the same contract.
* Results page, dialogue box, offering, coach and briefing chips: not in this lane's four screens.
* Focus after a redraw by stable identity inside prep's sheet panels (the Sphere Grid canvas already has its own cursor).
* The door field (long press on the board's label) is still a hidden input reached by long press; a named keyboard entry is
  Codex's P2 and touches the secret-door policy, so it is Bailey's call.

## Open questions for the driver

1. Prep's tab strip makes **Enter on a focused tab begin the battle** (it is the cursor, and the hint says "ENTER BEGINS THE
   BATTLE"); a purist would have Enter only select the tab. Kept because it is today's key; flip by dropping `data-cursor` from
   the tabs if you want the textbook behaviour.
2. Tab on the **pause menu** stays the approved "next tab", so a keyboard-only user cannot Tab into its Back and Hide chips (they
   are reachable by the game keys and by assistive technology). Making Tab the browser's there means retiring the Until Dawn Tab
   binding (Q, E, L1, R1 and the arrows stay); `pause-remake.test.ts` pins Tab today.
3. Tab is **no longer the game's triangle on prep**. Nothing advertised it (the Sphere Grid's hint says SHIFT WALKS), Q and Shift
   still are triangle.

## Block for NOW.md (not edited here: other lanes edit it; paste at the merge)

> ui-input (ChatGPT point 6): merged on branch `ui-input`. One input/focus contract (`docs/handoff/ui-input-contract.md`):
> focus decides who owns Enter and Space; Tab is the browser's on the title, board and prep; real tab/button semantics on those
> and on the pause strip; the Ink & Gold focus ring; chapter cards 44 px on a phone. Owed in the browser: the phone before/after
> and the real-key walk (jobs in the lane scratch). Both games.
