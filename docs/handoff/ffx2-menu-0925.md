# Handoff: FFX-2 menu track, decision sheet 2026-09-25 items 4 (A1) and 3 (C with D)

Branch `decisions-0925`, worktree `D:/pyrefly-dec-0925`. Bailey, 2026-09-25 ~11:00 EDT, verbatim:
*"I'll go with all your recommendations"*. Sheet: `docs/plans/decisions-2026-09-25.md`.
**Game case: FFX-2 only** for both items (FFX is CTB: nothing acts while a menu is open, and FFX
guides carry no clock rule). Not pushed, not deployed.

## Item 4, A1: an enemy hit closes an open menu

- **Sources**: `research/ffx2-combat-core.md` §1.1 (*"being hit while the command menu is open
  cancels the menu and delays the turn"*) and §1.5 Active (*"closes the menu and applies Delay
  effect"*, single source Split Infinity G0913). Only the close is built. **A2 (the delay) is not
  built**: no source gives its size for a plain hit.
- **Code**: `src/battle/ffx2/active.ts` `closesOpenMenu` (what a hit is: a damage draft with
  `amount > 0` on the menu's owner from an enemy source; our reading, preflight §3) and one more
  argument on `inputStillValid`; `src/battle/ffx2/engine.ts` flags the hit in `emit`, clears it on
  the next decision, and starts the fresh menu held until the HUD reports its top list (634 lines,
  unchanged). The presenter already closed a menu whose `inputValid` turned false; no UI change.
- **Paper preflight and five-chapter bench**: `docs/plans/ffx2-hit-closes-menu-review.md` §7
  (IV, V, VI, XI, XIII; bench speed, the human Wait-split model, Active 1.5 s). Every D = 0 arm is
  byte-identical. Human Wait split: IV 40 to 40, V 32 to 28, VI 29 to 33, XI 8 to 5, XIII 13/200 to
  16/200.
- **Tests**: `tests/unit/ffx2-hit-closes-menu.test.ts` (real engine, Chapter IV); goldens: the
  Active D = 1500 arm of `tests/unit/ffx2-atb-golden.test.ts` re-pinned (every seed moves,
  outcomes unchanged). Bench: `tests/unit/ffx2-hit-closes-menu-bench.test.ts` (`PYREFLY_MEASURE=1`).
- **Live check** (real presenter, Chapter V, default Wait split, idle on Yuna's top list):
  Tail Beam hit Paine and Yuna's menu stayed; Tail Beam then hit Yuna and her menu closed and
  reopened 35 ms later, full bar, same girl.
  `docs/screenshots/ffx2-menu-0925/ch5-menu-reopened-after-tail-beam.png`.

## Item 3, D: the advisor bench (Chapters V and VI, default Wait split)

`tests/unit/ffx2-advisor-wait-split-bench.test.ts` (`PYREFLY_MEASURE=1`), 40 seeds, on the build
with item 4 in. `T` = time on the top list per decision (clock running), then 1 s held.

| Chapter | T | Intended line | Advisor top row | Where the advisor lost | Where the line lost |
|---|---|---:|---:|---|---|
| V | 0 s | 39/40 | 38/40 | link 1: 2 | link 2: 1 |
| V | 1 s | 14/40 | 13/40 | links 1, 2, 3, 4: 5, 5, 1, **16** | links 1, 2, 4, 5: 7, 8, 8, 3 |
| V | 1.5 s | 2/40 | 0/40 | links 1, 2, 4, 5: 11, 11, 15, 3 | links 1-5: 14, 15, 1, 5, 3 |
| VI | 0 s | 40/40 | 39/40 | link 3: 1 | none |
| VI | 1 s | 17/40 | 17/40 | links 2, 3: 1, 22 | links 2, 3: 1, 22 |
| VI | 1.5 s | 2/40 | 2/40 | links 2, 3: 2, 36 | links 2, 3: 1, 37 |

**Reading:** the advisor does not add to the losses: it wins within one or two seeds of the
chapter's line at every `T`, and the card never declined. The clock is the cause. One shape
difference: in Chapter V at 1 s the advisor's losses bunch at link 4 (the Head, 16 of 27), which
matches round 12's live advisor-following losses at the Head (R12-UI-01); the line loses as often,
but earlier. No separate advisor fix is indicated. Most pressed rows: V Darkness, Black Sky, Attack,
X-Potion, Hi-Potion; VI Attack, Hi-Potion, Potion, Armor Break.

## Item 3, C: the guide line

- `src/data/guides/ffx2-wait-habit.ts`: *"Open a list at once. On the top list, the clock still
  runs."* (short form "Open a list at once"; cite `ffx2-combat-core §1.5`), the sheet's draft
  verbatim. Chapters V and VI carry it as `clockRules.wait` (`src/data/guides/types.ts`): shown
  **first** in RULES, and only under Wait's split. Under Active (the clock runs in a list too) and
  under `?wait=hold` (the top list holds) it is absent. The panel reads the player's clock
  (`ui/coach/coachState.ts` `ffx2CoachClock`) through `buildGuideView(state, decision, clock)`.
  Each guide's 3-5 standing rules are unchanged.
- Chapter XI has no guide yet; per the sheet it gets the same line when its guide is written.
- **Tests**: `tests/unit/guide-ffx2-wait-habit.test.ts` (the rule, both chapters, the three
  clocks, a real engine board, and the panel reading the save's `ffx2Atb`).
- **Live**: `docs/screenshots/ffx2-menu-0925/ch5-wait-guide-habit-line.png`: with a menu open the
  rail is compact and the rule reads "Open a list at once", first under RULES (after one MORE).

## Open for Bailey

1. **Wording (D-136 conflict).** On 2026-09-25 ~00:40 Bailey said *"Calling the command menu a
   list a little weird don't you think?"*, and D-136 moved the coach lines to "Pick a command" /
   "Choosing a command stops it". The sheet's draft still says "On the top list", which names the
   command menu a list. Built as drafted because that is what was approved; a D-136-style
   alternative, one constant to swap: *"Pick a command at once. Until you do, the clock still
   runs."* (short: "Pick a command at once").
2. **A2** (a delay on the hit) waits for a sourced size or Bailey's yes on an `[estimate]`.
3. The reading of "a hit" (preflight §3): a status-only enemy ability that deals no damage does not
   close the menu.

## Not done here

- The sheet's "then a live win captured on the default" for item 3 (Chapter V through Shuyin with
  real keys) was not run in this track.
- Release: this branch owes a focused review before deploy and a deep review on the live build
  (`critic-plan --paths` says DEEP: FFX-2 ATB engine).
