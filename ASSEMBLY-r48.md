# ASSEMBLY r48-rc

Candidate r48-rc, assembled from `origin/r47-rc` (b8aa6f96, live since 06:08 on 2026-10-14).
Assembled by a sub-agent of the release driver on 2026-10-14. No deploy, no review from this agent.
Worktree `D:/pyrefly-r48`, branch `r48-rc`. Progress is appended after every step.

## Step 0: tips checked and worktree made

- origin/r47-rc = b8aa6f96, origin/re-parity-rc7 = 8eb2e8c6, origin/ch-tourist-trap = a142ad1b, origin/ch-besaid-valefor = 865d024a. All four equal the tips the brief names, so nothing moved.
- Worktree made from origin/r47-rc; junctions: node_modules to the main tree's node_modules, public/art to D:/pyrefly-art-r47 (read only).
- `node tools/fx-assets.mjs ensure --warn`: 26 files restored from the art backup, verify PASS.
- A PAUSE file already existed in the overnight folder (empty, created 04:28 by another session). Not mine: left alone, not created, not removed.

## Step 1: merge re-parity-rc7 (8eb2e8c6)

- `git merge --no-ff origin/re-parity-rc7`: merge commit 5513fed1, no conflicts (130 files). Game case: each lane by its own game (FFX: Rikku's Mix and the bag; FFX-2: automatic abilities, counters, command menu data and rules). The FFX command rules (L-CMD) were already in r47.
- `tsc --noEmit` after the merge: clean (3,956 files).
- CHANGELOG.md: a new r48-rc entry above r47's, carrying the handoff's section 9 paragraphs with two changes. FFX: only the Mix half is pasted, because the command-rules half is already told in r47's own entry (pasting it again would announce those rules twice); the clause "the Mix list shows what each pair will make" is dropped as briefed (MIX_PREVIEW_ALL_PAIRS stays false) and replaced by the picker's real state, which section 13 asks the notes to carry. FFX-2: pasted whole. Plus the disclosure line (one FFX-2 golden digest moved, Chapter V, the Silence scope, no outcome change; the White Mage's Pray is a free whole-party heal on her opening menu). Entry count 67 to 68.
- r47's entry is untouched.

## Step 2: merge ch-tourist-trap (a142ad1b)

- `git merge --no-ff origin/ch-tourist-trap`: merge commit 0eacd4d0 (parents af407361 and a142ad1b). Game case: FFX-2 only. Two conflicts, both pure unions: `CHANGELOG.md` (the entry-count line, and both sides' new entries at the top) and `docs/CONTRACT-CHANGES.md` (two independent entries; the newer, Tourist Trap's 2026-10-14, first). `src/battle/ffx2/engine-core.ts` auto-merged (RC7's import lines and the chapter's AI-poll change touch different lines); tsc is clean on the result.
- CHANGELOG: the Tourist Trap entry is kept whole, below the r48 entry and above r47's; its heading and Address line now say it is part of r48-rc (the old line said "not merged"); the Disclosed line about the Defeat screen's TURNS counting the dog calls is gone because the fix is in the tip (a142ad1b: a dog pick and a sleeping poll are not turns; seed 1 TURNS 82 to 66; pinned by `tests/unit/chapters/tourist-trap-turns.test.ts`), and the fact is said once, where the dog call is explained. Entry count 69.
- Quick check on the merged tree: the daigoro door, the intent order, the four Tourist Trap files, the doors and the chapter numbers: 8 files, 99 tests passed.

## Step 3: ch-besaid-valefor (865d024a), squashed

- `git merge --squash origin/ch-besaid-valefor` and ONE commit, a666acea (66 files, 3,365 insertions; parent 98934891). The added lines carry no machine path and nothing personal (scanned). Game case: FFX-2 only.
- 23 conflicted files, 38 hunks (the handoff's 22 plus CHANGELOG.md), every hunk a both-sides union, Tourist Trap's lines first and Valefor's second, each combined line built by an asserted substitution (`resolve-valefor.mjs`, kept in the scratch folder). `Chapter.number` now ends `22 | 23 | 24` and `ListedChapterId` excludes both ids (encounters.ts 397 lines); the door table, experiments list, meta list, AI, enemy, command-record, monster-record, item, guide and tactic registries hold both chapters; PROGRESS.md keeps both lanes' logs (a rule between them); CONTRACT-CHANGES.md keeps both entries (Tourist Trap, then Valefor, then the 10-13 entry); CHANGELOG.md keeps both chapter entries below the r48 entry and above r47's, both now marked as part of r48-rc (count 70).
- Judgement calls (none changes behaviour): (1) `src/data/chapter-meta.ts` came to exactly 400 lines (398 in r47, one line from each lane), against the house rule "under 400"; a two-line header comment was joined onto one line, 399 lines, no code touched. (2) `tests/unit/chapter-doors.test.ts`: the title says seven doors, the game list gains `daigoro` next to `valefor` (Tourist Trap's lane never put it there), the header names `valefor-door`. (3) `tests/unit/valefor-door.test.ts` typed `daigoro` as a word that must open nothing, true on its own branch and false here, since the word is a door in this tree; that one case was dropped from the list (its half-word `daigor` stays in the table-driven list) and the file's comments say so.
- tsc after the squash: clean. Targeted run: both chapters' tests, both doors, the chapter numbers, the doors table, the two music tables, trema-options, the two record tests, the wait-habit carriers, the steal-item names and the intent order: 20 files, 272 tests, one failure (the daigoro case above), fixed; the three door files rerun green (51 tests).
