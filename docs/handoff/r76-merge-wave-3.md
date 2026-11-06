# r76 integration, wave 3: chapters 37 and 40 merged into `r76-int` (2026-11-06)

**Game case: both for the plumbing; each chapter keeps its own** (37 the Bevelle Guardians FFX-2 only, word `drillshot`; 40 Yuna's Ballad FFX-2 only, word `wraith`). Authority: Bailey 2026-11-06 ~00:30 EST "implement all unimplemented chapters please", ~00:55 EST "yes on all these too", 2026-10-31 "you make the executive decisions for the next few days. i'll go with all of your recommendations"; the integrator's picks below are the driver's, his to overturn. Nothing deploys from this branch. With this wave every hidden chapter of the program (33 to 40) is in `r76-int`; the wave-2 note is `r76-merge-wave-2.md`.

## What merged, in order (each `--no-ff`, targeted tests after each)

| Merge | Branch | Chapter | Files conflicted | Targeted tests after it |
|---|---|---|---|---|
| 1 | `ch-bevelle-guardians` | 37 The Bevelle Guardians: Georapella, the Precepts Guard and Baralai, FFX-2 only, word `drillshot` | 22 | 18 files, 360 passed; the 25 door files, 508 passed |
| 2 | `ch-yunas-ballad` | 40 Yuna's Ballad: Yuna alone against the possessed Rikku and Paine, FFX-2 only, word `wraith` | 27 | 57 files, 1,014 passed |

## How the conflicts were resolved

Every conflict was a registration line that the wave-2 chapters or the other new chapter had added at the same place. The rule of wave 2 held: **keep both sides, in chapter-number order** (36, 37, 38, 39, 40), by a small three-way resolver (one mode per hunk: ours, theirs, ours then theirs, theirs then ours; a working file, not committed), then read line by line.

- **`data/encounters.ts`** (399 lines, edited in place): `ChapterId` gains `'ffx2-bevelle-guardians'` and `'ffx2-yunas-ballad'`, `ListedChapterId` excludes both, `Chapter.number` is `... 36 | 37 | 38 | 39 | 40`, and the number comment names 37 and 40.
- **`data/chapter-meta.ts`**: both branches had put their import on an existing line to stay under 400 (the Maesters' line for 37, the NATUS and ISAARU line for 40). Both are undone; the file is byte-for-byte what `r76-int` had. The records of 37 and 40 join `HIDDEN_R76_META` in `data/chapter-meta-hidden-r76.ts` in number order (`... 36, 37, 38, 39, 40`).
- **`CHAPTER_DOORS`** order is now `... gear, darkaeon, judgment, geosgaeno, drillshot, duelist, beast, wraith`. `wraith-door.test.ts` pins `wraith` as the last row, and it is. `doorWords.ts` gained two lines (`drillshot`, `wraith`); the older door suites (`gagazet`, `summon`, `yojimbo`, `chapter-doors`) took ours whole because they already read that list.
- **`data/chapters-experiments.ts`**: the hidden list now reads `... FLOODED_WAYS, FFX2_BEVELLE_GUARDIANS, SANCTUARY_KEEPER, FFX2_YUNAS_BALLAD` (registration order follows the numbers 36, 37, 39, 40 for the later ones; the Farplane Cup keeps its earlier place from wave 2). No test found a position dependence.
- **Registries, one entry each beside the others**: `battle/ffx2/ai/index.ts`, `data/ffx2/enemies/index.ts`, `command-records/index.ts`, `monster-records/records.ts` and `kill-rewards.ts` (the three Bevelle rows then the two Den of Woe girls), the guides' two indexes and the tactics' game lookup (Yuna's Ballad only), `critic/runner/lib/route-pure.mjs`.
- **Pinned lists**: `kill_reward_rows.json` (the three Bevelle rows, the three Farplane rows, the two girls), `parity-ffx2-rewards-data` (the Champion Belt name joins the three accessory names of 37), `audio-music-batch2` (the Den of Woe cue's owners: the Den, the Bevelle Guardians, Yuna's Ballad; the scene and link table gains both), `experiment-flow` (the two Bevelle links may carry the no-save-card flag beside the Maesters', the Dark Aeons', the Flooded Ways' and the Farplane Cup's), `ffx2-hit-reaction-wiring` (the five new bodies join the missing-frame list, sorted), `data-ffx2-monster-records` and `data-ffx2-command-records` (each new chapter's rows skip the shared fixture and keep their own), `critic-route-doors` (two door words), `chapter-numbers` (37). The count pins of `prep-tip-band` and `prep-tip-short-forms` keep the derived form of wave 2 (both lanes' own edits are the older literal and lose).
- **`drillshot-door.test.ts`** is the one lane-written test that needed a change beyond a line in a table: its two door loops ("a wrong letter resets", "each word opens its own chapter and nothing else", a literal 60 s) and its pair test (a literal 180 s) now carry `DOOR_LOOP_TEST_TIMEOUT_MS` and `DOOR_PAIR_TEST_TIMEOUT_MS`, as wave 2 did for the older suites. `wraith-door.test.ts` has no per-door loop and needed nothing.
- **`FFX2PartyBuild.members`** (Yuna's Ballad widens it to `[M, M, M] | [M, M] | [M]`) needed no new `!` in the merged tree: `tsc` is clean, so none of the wave-2 chapters or the Bevelle tests index `members[1]`.
- **`docs/CONTRACT-CHANGES.md`**: all entries kept, the wave-2 integration entry first; the two lane entries' lines about `chapter-meta.ts` now say where the records went.

## Checks

- `npx tsc --noEmit` clean after each merge and after the last edit; `node tools/orphans.mjs` 24 orphaned of 2,458 modules (the same 24 groups as before the wave; none of the two chapters').
- **Full unit suite, `BOSS_ART_ROOT` at the r76 art mirror, `--maxWorkers=3`, 3,286 s: 2,023 files passed, 29 skipped of 2,052; 32,187 tests passed, 155 skipped, 1 todo, 0 failed.** (Wave 2 ended at 2,006 files and 31,749 tests; the 17 new files and 438 new tests are the two chapters'.)
- `node tools/critic-plan.mjs` for the merged head against the live release-75 build: **DEEP**; obligations live, focused and deep (the FFX and FFX-2 engines, the combat core, the chapter registry, the presenter, cutscene scripts, the strategy guide and the move advisor are each a deep row). Not save-data class. It is the release candidate's single plan; nothing here asks for a separate review.

## What is still open (none of it new in this wave)

- **Art.** Chapter 37's Georapella and Precepts Guard have no paintings (the presenter's placeholder) and Baralai wears the Den of Woe shade; its card thumbnail and pause plate are Chapter IV's. Chapter 40's two girls are the party sets of Rikku and Paine, mirrored. Neither branch added art, so the art mirror gained no file. The hero plates still missing from the mirror (wave 2, minor 7) are unchanged.
- **Bailey's reads and ears** (each lane's handoff, section "open questions"): the story drafts of 37 and 40, the stand-in music cues (37: Bahamut and Den of Woe cues; 40: the Den's own), act 3 of chapter 37 for the shipped White Mage Yuna (62 percent careful, 98 percent after the Change), and the retry choice of chapter 40 (YB14).
- **The browser jobs** of both lanes beyond their own first real-key smoke (J1 to J8 of each) wait for a production build, which this pass did not cut.
- **A later merge** adds its door word to `tests/unit/helpers/doorWords.ts` (one line), its record to `HIDDEN_R76_META`, and uses the two door-scaled allowances for any suite that loops over the doors.
