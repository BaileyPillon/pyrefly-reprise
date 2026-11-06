# r76 integration, wave 2: chapters 36, 38 and 39 merged into `r76-int`, and the Penance teaching (2026-11-06)

**Game case: both for the plumbing; each chapter keeps its own** (36 Flooded Ways FFX only, 38 Farplane Cup FFX-2 only, 39 Sanctuary Keeper FFX only; the Penance teaching FFX only). Authority: Bailey 2026-11-06 ~00:30 EST "implement all unimplemented chapters please", ~00:55 EST "yes on all these too", 2026-10-31 "you make the executive decisions for the next few days. i'll go with all of your recommendations"; the integrator's picks below are the driver's, his to overturn. Nothing deploys from this branch.

## What merged, in order (each `--no-ff`, targeted tests after each)

| Merge | Branch | Chapter | Conflicts | Targeted tests after it |
|---|---|---|---|---|
| 1 | `ch-flooded-ways` | 36 Via Purifico: Geosgaeno and Evrae Altana, FFX only, word `geosgaeno` | 32 files | 32 files, 566 passed (3 failures found and fixed, see below) |
| 2 | `ch-sanctuary-keeper` | 39 Sanctuary Keeper, FFX only, word `beast` | 35 files | 26 + 7 + 2 files passed |
| 3 | `ch-farplane-cup` | 38 Farplane Cup duels, FFX-2 only, word `duelist` | 13 files | 23 files, 464 passed |
| 4 | `ch-penance` (0a2af1a01) | 35 Penance: the guide bot line, tests and docs only | none | the 12 Penance files, 126 passed |

## How the conflicts were resolved (the policy, then the exceptions)

Every conflict was a registration line that two or three lanes had added at the same place (the id unions, the door table, the scene tables, the chapter lists, the canon table, the tactics' game lookup, the music table, the pin lists of the older door suites). The rule: **keep both sides, in chapter-number order** (34, 35, 36, 38, 39; 37 and 40 are reserved). Done with a token-level three-way merge of each file (so a long one-line list takes both additions and a comment is not duplicated), then read line by line; the few comments the merge garbled were repaired by hand (`pyreflyCanon.ts`, `chapterDoors.ts`).

The exceptions, where keeping both sides would have meant the next merge editing the same line again:

- **`data/chapter-meta.ts` (398 of 400 lines).** Lanes 36, 38 and 39 had each put a new import on an existing line to stay under 400. That is undone. The records of chapters 34 to 39 now live in `data/chapter-meta-hidden-r76.ts` (`HIDDEN_R76_META`, number order), and `chapter-meta.ts` has one import and one spread. **A later chapter (37, 40, ...) adds its record to that side table, not to `chapter-meta.ts`.**
- **The door suites.** `tests/unit/helpers/doorWords.ts` holds the door words with the game of each chapter, one line per door; `chapter-doors`, `gagazet-door`, `summon-door` and `yojimbo-door` read it. **A later chapter adds one line there.**
- **Count pins now derive.** `critic-route-doors` (the length of `CHAPTER_DOORS`), `prep-tip-band` (the ids of the metas against the ids of the three chapter registries; the FF7 Guard Scorpion has no record), `prep-tip-short-forms` (the chapter list's length), `data-ffx-command-records` (a table of the rows each hidden chapter added since the Spectral Keeper: 20, 9, 9 and 3, on top of 519 abilities and 516 records), `scene-backdrop-file` (the set of code-keyed scenes, not their order), `exp-yrp-3d` (a floor of 15 scene rows, not an exact count). Each still fails when a chapter drops out; none needs a literal moved by the next merge. **`data-ffx-command-records`: a chapter that adds ability rows adds one line to `ROWS_SINCE_KEEPER`.**
- **The door suites' pair-test allowance follows the number of doors.** Eleven door suites (`angra`, `daigoro`, `fayth`, `gagazet`, `maesters`, `mushroom`, `summon`, `valefor`, `windwaker`, `yojimbo`, `yrp`) had a literal 180 s (240 s on three of them) written for fifteen doors; the one failure of the full run was `valefor-door`'s pair test timing out at 180 s (193 s) at twenty-one doors with the long benches running beside it. They now read `DOOR_PAIR_TEST_TIMEOUT_MS` from `tests/unit/helpers/doorWords.ts` (15 s a door, 180 s at the least: 315 s now); the twelve door suites then ran green together (246 tests, 9 minutes on three workers: 180 to 250 s a suite when all twelve share the CPU).
- **Taken from "ours" whole, then the lane's own edit applied:** `exp-windwaker` and `exp-yrp-3d` (ours already found their rows by position, not from the end: the lanes' `at(-2)` and `at(-3)` are not needed).
- **Order.** The brief merged 39 before 38; the tables are in number order (38 before 39) all the same. `CHAPTER_DOORS` order is `... gear, darkaeon, judgment, geosgaeno, duelist, beast`.

Three failures surfaced in the first run and were fixed in the merge commit, none a defect of a lane: a count pin (`prep-tip-band`, 37 against 36 metas: the Guard Scorpion has no record, now compared by id), and two edits of the lane's own that the "ours then re-apply" rebuild of `data-ffx-command-records` had dropped (the Struggle power-17 exclusion and the KO Punch status-difference row). Found by the run, restored from the lane's branch.

## Hot spots for the next two merges (37 Bevelle guardians FFX-2, 40 Rikku and Paine shades FFX-2)

`ChapterId`, `ListedChapterId` and `Chapter.number` in `data/encounters.ts` (399 lines: edit in place; the number union is `... 36 | 38 | 39`, 37 and 40 go in their place); the door table and its import in `chapterDoors.ts`; `doorWords.ts`; `chapter-meta-hidden-r76.ts`; `route-pure.mjs` (`DOOR_WORDS`); `artNamespace.ts` and `experiment-scenes.ts` (scene keys); `pyreflyCanon.ts`; `tactics/lookup.ts`; `audio-music-batch2-2026-10-12.test.ts` (the scene and link cues); `exp-fayth.test.ts` (the key list of the scene-file test); `party-stature-chapters.test.ts`; `r62-auron-turn-order-tip.test.ts`; `parity-ffx-*.test.ts` (the no-record body lists, FFX only); `CONTRACT-CHANGES.md`. The token-level merge tool and the fix scripts of this pass are working files and are not committed.

## The Penance teaching

`docs/handoff/ch-penance.md` section 5.2: the prep tip, the guide card (`data/guides/penance.ts`) and the guide page (`data/guides/docs/penance.ts`) teach the guides' winning line in our own words (Three Stars first, then Quick Hit; one hand down at every one of Penance's turns, a hand's last blow held until just before it acts; Dispel Penance's Regen and whoever Immolation breaks), with Jegged's Penance page as the citation in the data comments and the cites. **No move advisor line is registered for Penance**, so nothing was pointed at the guide line; `penance-guide.test.ts` fails the day one is. Owed to Bailey's yes: an advisor line for Penance (the scripted player of section 5.1 is the draft).

## Checks

**Full unit suite, `BOSS_ART_ROOT` pointing at the r76 art mirror, `--maxWorkers=3`, 3,125 s: 2,005 files passed, 29 skipped, 1 failed of 2,035; 31,748 tests passed, 155 skipped, 1 todo, 1 failed.** The one failure is the `valefor-door` pair-test timeout explained above (a load timeout, not a behaviour: the test passes with the allowance that follows the door count, and the twelve door suites passed together afterwards). `npx tsc --noEmit` clean after every merge and after the last edit; `node tools/orphans.mjs` 24 orphaned, the same 24 as before; no source file over 400 lines but `battle/common/types.ts` (3,288, the shared contract that already was); no local path, folder name of a working area or account name in any file this pass touched.
