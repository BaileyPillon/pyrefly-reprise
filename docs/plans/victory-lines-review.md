# Method check and paper preflight: victory lines (PR-0021, PR-0187)

Written 2026-09-25 by a sub-agent of the driver session, before any code.
Decision: Bailey adopted every recommendation on `docs/plans/decisions-2026-09-25.md`
(item 7 = **A**). A yes approves exactly the lines that sheet quotes, nothing else.
`node tools/critic-plan.mjs --paths` classes the change **deep** (the shared results
screen and `src/ui/common`), so this page is also the rule-15 paper preflight.

**Game case: both.** The results screen is shared plumbing (CHK-020): the rotation
changes who speaks in every chapter that has a bank, FFX (I, II, VII, VIII) and FFX-2
(V, VI) alike. The lines themselves are each game's own, from `research/writing-bible.md`
§5.4. The PR-0187 part (Chapter III silent) is **FFX only**.

## 1. Method check (PR-0021 is STALLED, RUBRIC §8)

**Current route and why it stalled.** Rounds 09 to 12 filed PR-0021 as "no banter bank"
and asked for a sampled bank keyed by chapter and tier (§4 Win and Form slots). Nothing
was built because that is new content, and new content needs Bailey's yes (rule 10);
each review re-observed the same symptom. The symptom Bailey actually saw is narrower:
`ResultsScreen.ts:133-135` always takes `rows[0]` as the speaker and index 0 of that
speaker's bank, so four FFX chapters end on Tidus's "...Okay. Next one.".

**Alternatives.**
1. *Rotate the speaker, first line only* (sheet A). No new text; the shipped §5.4 lines.
2. *Rotate speaker and line* (sheet A+): would surface pooled lines that §5.4 does not
   hold ("That didn't feel like winning.", "Ronso do not forget.").
3. *Full bank with formation exchanges* (sheet B): new content, out of this batch.

**Smallest test that tells them apart.** A unit test over every registered chapter that
computes each speaker's line through the real `buildMemberRows` and the real banks, and
compares the set with the lines the sheet quotes. A shows exactly those; A+ shows more.

**Choice: continue with A (Bailey's pick).** PR-0021's own acceptance check ("three
seeded wins show two lines, each allowed for that tier") is met by the rotation; the
Win/Form-slot bank (option B) stays out of scope and stays open as a question.

## 2. What is built

- **The rule** (`src/ui/common/victoryLine.ts`, new, pure): the speakers are the results
  rows (the party the panel lists: FFX's front line plus any reserve that acted, FFX-2's
  three) that have a bank; the speaker is `speakers[turn % n]`; the line is that
  speaker's **first** line. No bank, no speakers, or no chapter: no line.
- **The turn** is the save's total attempt count across chapters, minus one. It is read
  from `SaveStore.value` (read-only), so `SaveData.ts`, the save schema and migration are
  untouched (no save-data class change). Every run bumps it (`GameFlow` records the
  attempt before the battle), so a retry and the next chapter each move the speaker on.
  It is deterministic for a given save, so screenshots and e2e stay byte-stable.
- **ResultsScreen** computes the line in `enter()` (where the save is reachable) instead
  of the constructor. The file is 430 lines and must not grow: the edit is net zero.
  The quip `div` gains `data-speaker` (invisible) for evidence and tests.
- **Chapter III** (`braskas-final-aeon.ts`): `victoryQuips: {}` as PR-0187's fix says,
  the same as Chapter IX. §5.4: "never fire a victory quip after a story-critical
  loss-shaped victory (E4's aeon kills)". Our reading, not the source's (the table also
  lists E4 as grim); the sheet names it.
- **Unchanged:** Chapter IV (`isSilentResultsChapter`, empty bank), IX and XIII (empty
  banks), the defeat panel (no quip), Chapter VIII's bank (it keeps its first lines until
  it has a tier), every bank's text.

## 3. Risks and how each is checked

| Risk | Check |
|---|---|
| A speaker with no bank (for example a reserve without a line) blanks the quip | Speakers are filtered to those with a non-empty bank; unit test |
| The rotation shows a line the sheet does not quote | Per-chapter test: the set of lines equals the sheet's lines for I, II, V, VI, VII (first lines), VIII |
| Chapter III, IV, IX, XIII start speaking | Test: no line for those chapters |
| The line under the leader's standing figure is someone else's | Not solved here: the panel names no speaker. Listed for Bailey (name the speaker, or stand the speaker in the wedge); both are visible changes that need a pick |
| `ResultsScreen.ts` grows past its 430 lines | Line count before and after |
| Save data | `SaveData.ts` untouched; read through `value` only |

## 4. Proof

Unit tests (`tests/unit/victory-line.test.ts`), `tsc`, the full vitest once, and real keys
from the title to a win in Chapters I and II at 1600x900 and 390x844, reading the line
and its `data-speaker` on the results panel.

## 5. Method check on the browser proof (rule 15, written after two lost runs)

- **Route 1, lost twice** (three attempts each at 1600x900 and 390x844): real keys through
  the whole fight, following the move advisor's pick each turn (round 12's harness logic).
  Unpinned seeds; every attempt ended on Defeat.
- **Route 2, lost once**: the same real-key walk from the title to the fight and from the
  fight to the results, with the fight itself handed to the shipped `'intended'` strategy
  (`window.__pyrefly.autoBattle`, docs/DEV.md) and the seed pinned with `setSeed(1)`. Seeds
  1, 1001 and 2001 lost at both sizes. `tests/unit/strategy-seymour-flux.test.ts` names
  seed 1 as a documented loss (17 wins in seeds 1-40 in this tree).
- **Why it stalled:** the proof needs a win; the fight is not what is under test, and
  Chapter I's line wins about 40 percent of seeds.
- **Smallest probe:** run the real engine headlessly with the intended strategy on seeds
  1-40 for Chapter I and Chapter II and keep the seeds both chapters win: 2, 3, 6, 8, 9,
  19, 21, 24, 26, 27, 30, 31, 32, 35, 36, 40.
- **Choice: change method.** Pin seed 2 (`setSeed(2)` before the first key, the capture
  route docs/DEV.md documents), walk in and out with real keys, and let `'intended'` play
  the fight. The results panel, the line and the speaker are reached through the real flow.
- **Result.** The first seed-2 run still fought seed 1: the HMR-off server had been started
  before the PR-0008 track (item 5, same worktree) wired `setSeed` into `pinRunSeed`. After
  a server restart the battle read back seed 2, and both sizes won Chapter I and then
  Chapter II on one save. See `docs/handoff/victory-lines.md`, "Verified".
