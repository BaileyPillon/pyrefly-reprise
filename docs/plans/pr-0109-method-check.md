# PR-0109 method check (rule 15): the chapter board always opens on Chapter I

Written 2026-09-26, paper only. **Game case: both** (the chapter board, prep and results are
shared front-end plumbing, CHK-020; all 13 playable chapters of both games are affected). Batch 4
owns the files.

## The issue as the critic measures it

Round 13 (fifth review; absorbs FOC18-05): `cardAfterBack` = seymour-flux in 16 of 16 prep
Esc-backs from other chapters, and `boardAfter.selectedId` = seymour-flux in 9 of 9 results
returns; also after a reload. Getting back to XI or XIII takes about 11 ArrowRight presses.
Acceptance: with real keys at 1600x900, 2000x1012 and 390x844, after Esc from prep and after
CONFIRM on results, for all 13 playable chapters, `snapshotState().screenState.selectedId` equals
that chapter.

## Traced (round 13, confirmed today)

- `src/ui/common/registerFlowScreens.ts:42`: `chapterSelect: () => new ChapterSelectScreen()`, no
  options. The factory type in `BattleScreenFlow.ts:92` takes no argument.
- `src/app/screens/ChapterSelectScreen.ts:110`: `const wanted = this.opts.initialIndex ?? 0`.
- **Two** entry paths build the board, and both go through that factory: `main.ts:62-76`
  (`app.register('chapter-select', ...)`, which runs the chapter and then `goto('chapter-select')`
  again, the path prep-cancel and a results CONFIRM take) and `GameFlow.chapterSelect()`
  (`BattleScreenFlow.ts:282`, through `boardWhenWarm`). Nothing remembers the chosen id on either.

## Why it stalled

Not difficulty: the cause and the fix have been written since round 09. Three things kept it
unowned: it is polish, so no batch led with it; its files sit in two areas (`src/ui/common` wires
the screen, `src/app/screens` owns the flow and the screen), so each batch could read it as the
other's; and the obvious fix threads a value through the flow (`BattleScreenFlow.ts`, 508 lines,
over the house limit), which made it look bigger than it is.

## Alternatives

1. **Thread it through the flow** (the round-13 wording): the flow keeps the last chapter id and
   passes it into the factory as `initialIndex`. Needs the factory signature changed and both entry
   paths touched, one of them in `main.ts`.
2. **Let the board remember itself**: a new module (for example
   `src/app/screens/frontend/boardFocus.ts`) holds the last chosen chapter id for the session.
   `ChapterSelectScreen` writes it when the player confirms a card and, when no `initialIndex` is
   given, starts on that id's tile (by id, never by index, since the board's tile list changes
   when a chapter unlocks). Both entry paths are covered without touching the flow or `main.ts`.
3. **Persist it in the save**, so a reload also lands there. That is a `SaveData.ts` schema change,
   save-data class (a deep review before deploy), for a convenience the acceptance does not ask for.

## The smallest test that tells them apart

A unit test on the board alone: construct `ChapterSelectScreen`, confirm the Chapter XI card,
construct a new one with no options, and assert its selected id is XI; then one where XI is not
playable, which must fall back to the first playable card as today. If that passes, alternative 2
covers both paths by construction, because both paths construct the same screen. Then the real-key
acceptance above.

## Recommendation

**Continue with alternative 2**, class A (restores CHK-015's "fast retry"; nothing perceivable is
new: the board already shows any selected card). The reload half (FOC18-05) is out of the
acceptance: keep the value in module memory, optionally mirrored to `sessionStorage` in a
try/catch so a same-tab reload also lands there without touching the save schema; say which in the
handoff. Write the failing unit test first, then the module, then the real-key check at the three
shapes.
