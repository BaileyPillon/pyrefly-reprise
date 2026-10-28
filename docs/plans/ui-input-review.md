# ui-input: paper preflight for the review (rule 15)

`node tools/critic-plan.mjs --paths src/app/Input.ts,src/app/focusContract.ts,src/ui/inkgold/focus.css,...` classes the lane **DEEP**
(`src/app/Input.ts`: global layout, input and boot is a shared system), review owed after the deploy on the live build
(`before deploy: FOCUSED`). Honest note: this page was written after the code, in the lane's last hour (the lane brief did not
carry the rule); the questions below are what the build should have been planned against and what the reviewer should open first.

Contract and change list: `docs/handoff/ui-input-contract.md`. Game case: both.

## What can go wrong, and where it is checked

| Risk | Why it could happen | Evidence so far | Still owed |
|---|---|---|---|
| A game key stops working because a control holds focus | the ledger drops the abstract button (`'control'`, `'field'`, `'browser'`) | 32 contract tests; every key with nothing focused is unchanged and tested; the existing pause, prep, board, door and demo suites pass | the real-key walk (`jobs/focus-walk.mjs`) on the live game |
| Enter does two things (Confirm and a click) or none | the bridge and the game both answer | tests: a div and a native button, Enter, Space, a held key; the cursor; a clicked control | same walk |
| Focus fights the screen's own `focus()` | `afterFrame` moves focus to the cursor | a regression found and fixed by `pause-eye-candy-page.test.ts` (the pause pages focus their selected row); now a rule and a test | the pause pages in the browser |
| Tab leaves the game on the board or prep for a player who used it | Tab is the browser's on `title`, `chapter-select`, `party-prep` | nothing advertised Tab there (Sphere Grid says SHIFT WALKS); Q and Shift are still triangle | Bailey's word if he used Tab |
| Layout moves at phone width | chapter cards 35.2 to 44 px; eye-candy rows 40 to 44 | static: one rule each | the phone picture (job 1): the scroll grows by about 8.8 px per card, text must not clip |
| A ring shows where it should not | `focus.css` | `:focus-visible` only, four screens only, cursor ringless | the four ring pictures |
| Source-reading tests lose their meaning | the key map moved out of `Input.ts` | `r391-mark-moment` and three engine tests now read `inputKeyMap.ts` too | none |
| Save data | none touched | no `SaveData.ts`, no schema | none |

## What the review should open first

1. `src/app/focusContract.ts` `keyDown` (the order of the six cases) against the table in the handoff.
2. `Input.onKeyDown`: the exclusive-claim path must be byte-for-byte what it was (it never asks the ledger).
3. The two places a real player meets it: Tab on the title (Start chip, ring) and Enter after an arrow on the board.
4. The pause menu: Tab must still be "next tab" (it is the approved Until Dawn layout) and the eye-candy page's Esc must still land
   focus on its row.
