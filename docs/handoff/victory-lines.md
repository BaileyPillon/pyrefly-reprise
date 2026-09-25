# Handoff: victory lines on the results screen (PR-0021, PR-0187)

Built 2026-09-25 on branch `decisions-0925` (worktree `D:/pyrefly-dec-0925`), from
Bailey's "all recommendations" on `docs/plans/decisions-2026-09-25.md`, item 7 = **A**.
Method check and paper preflight: `docs/plans/victory-lines-review.md`.
Not pushed, not deployed.

## Game case

- **Both** for the rotation: the results screen (`src/app/screens/ResultsScreen.ts`) is
  shared plumbing (CHK-020), so the fix changes who speaks in FFX chapters I, II, VII, VIII
  and FFX-2 chapters V, VI alike.
- **FFX only** for PR-0187: Chapter III's bank is emptied.
- The lines are each chapter's existing text. No line was written or changed.

## What changed

| File | Change |
|---|---|
| `src/ui/common/victoryLine.ts` (new) | `victoryLine(banks, fieldIds, turn)`: speakers are the panel's party members that have a bank; `speakers[turn % n]` speaks; the line is their bank's **first** line. `victoryTurn(chapters)`: the save's attempts across all chapters, minus one |
| `src/app/screens/ResultsScreen.ts` | The line is chosen in `enter()` (the save is reachable there), no longer `rows[0]` plus index 0. The quip `div` carries `data-speaker`. Net zero lines (430, the file must not grow) |
| `src/story/scripts/braskas-final-aeon.ts` | `victoryQuips: {}` (PR-0187), as Chapter IX |
| `tests/unit/victory-line.test.ts` (new) | The rule, the turn, and per chapter: every served line equals the sheet's quote; III, IV, IX, XIII silent; no line outside a bank's first entry in any registered chapter |

`pickVictoryQuip` in `resultsMath.ts` is no longer used by the screen (its tests still
run); it can be removed in a cleanup.

## What each chapter now serves (measured through `buildMemberRows` and the real banks)

- I (Tidus, Yuna, Kimahri): "...Okay. Next one." / "May they rest." / "Kimahri remembers."
- II (Tidus, Yuna, Auron): "...Okay. Next one." / "May they rest." / "It isn't over."
- III: nothing (PR-0187). IV, IX, XIII, and the unlisted Natus and Fallen Aeons: nothing.
- V (Yuna, Rikku, Paine): "...Let's go home." / "That one wasn't fun." / "...Yeah."
- VI: "We got it back." / "Gullwings one, Syndicate nothing!" / "Predictable."
- VII (coming): "...We won, right?" / "He must be sent." / "Okay. Okay. That happened."
- VIII (Tidus, Wakka, Rikku): "Okay. Next one." / "Ya! That is how you do it!" / "Ha! Bad dog!"
  (its bank stays as written until the chapter has a tier).

A reserve who switched in and acted is on the panel and joins the rotation with their
first line.

## How the rotation moves

`GameFlow` records an attempt before each battle, so the turn grows by one per run of
any chapter. A fresh save: Chapter I's first win is Tidus, Chapter II next is its second
member (Yuna). A retry after a defeat also moves the speaker on. Deterministic for a given
save; the save schema is untouched (read through `SaveStore.value`).

## Open for Bailey

- The panel names no speaker, and the wedge still stands the leader's figure, so Yuna's
  "May they rest." sits under Tidus. Options (each a visible change that needs a pick):
  name the speaker in small caps under the line, or stand the speaker in the wedge.
- PR-0021's larger ask (the §4 Win and Form-slot banter bank, option B) stays out of this
  milestone per the sheet.

## Repair 1 (2026-09-25): VL-1, the line under someone else's portrait

The focused review raised VL-1 (major, introduced by this change, not a blocker): on two
wins in three the line belongs to a member other than the leader in the wedge, and the
panel names no speaker. Recommendation A says nothing about attribution, and both fixes
are visible changes, so under hard rules 9 and 10 **no code was changed**. Instead the
two fixes were drawn as option frames at 1600x900 for Bailey's pick. Game case: both
(shared results screen).

Frames: a real Chapter II results screen (own HMR-off server on 5601, GPU, the debug API
on a fresh page with no title key, seed 2, `auto: 'intended'`). The quip and wedge were
then edited in the page DOM for the picture only. None of these edits are in the source.

| Frame | What it shows |
|---|---|
| `docs/screenshots/victory-lines/option-0-as-built.jpg` | As built: Yuna's "May they rest." under Tidus's figure (the defect) |
| `docs/screenshots/victory-lines/option-1-name-the-speaker.jpg` | 1: the line names its speaker ("YUNA", letter-spaced after the line); the wedge keeps the leader |
| `docs/screenshots/victory-lines/option-2-speaker-in-wedge.jpg` | 2: the speaker stands in the wedge (`victoryHeroHtml('yuna')`, the helper the screen already uses); no name needed |

Notes for the pick: option 2 changes the win screen's figure every time, and a loss still
shows the leader's fallen pose. Option 1 is a small text addition, and its styling in the
frame is a sketch. Either fix is about 20 lines in `ResultsScreen.ts`, a file at 430
lines that must not grow, so a helper would go in `victoryLine.ts`. Until Bailey
picks, VL-1 is disclosed with any release that carries this branch.

## Verified (2026-09-25)

- `npx tsc --noEmit`: nothing from these files (the only errors in the worktree are in
  `tests/unit/target-approved-hashes-judge-locked.test.ts`, another track's).
- `tests/unit/victory-line.test.ts` 17/17; the full vitest once: 7409 passed, 1 failed
  (`critic-policy-adoptions.test.ts`, D-161's state in `docs/target/decisions.json`,
  a file this track does not touch).
- Browser, own HMR-off dev server on 5600, GPU. One fresh save per size: real keys from
  the title to Chapter I, `setSeed(2)` before the first key, the fight handed to the
  shipped `'intended'` strategy (`autoBattle`; the advisor-driven real-key fight lost
  six times, see the method check), real keys through the post scene to the results,
  CONFIRM, back to the board, Chapter II the same way.

| Size | Chapter I (attempt 1) | Chapter II (attempt 2) |
|---|---|---|
| 1600x900 | Victory, `tidus`: "...Okay. Next one." | Victory, `yuna`: "May they rest." |
| 390x844 | Victory, `tidus`: "...Okay. Next one." | Victory, `yuna`: "May they rest." |

Frames: `docs/screenshots/victory-lines/ch{1,2}-results-{1600x900,390x844}.jpg`.

**Seen, not changed:** at 390x844 the whole results panel is the 16:9 stage letterboxed
into the phone's width, so the line renders about 6 px tall (its box measured 133x6).
That is the results screen's existing phone layout, not this change.
