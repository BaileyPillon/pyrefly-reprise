# Re-parity RC9, lane X2-G, step one: the FFX-2 Alchemist's Mix, the recipe resolver and the 53 result rows (rules and data; the picker and the effects are step two)

Status: **built, tested, measured and pushed on branch `re-parity-rc9-x2-mix`; not merged, not deployed** (2026-10-16). Cut from `origin/r50-release` (`748038a0`, the live line plus RC8's item ledger); see section 9 for why that base.
**Game case: FFX-2 only** (AGENTS.md rule 14), and why: FFX's Mix is Rikku's Overdrive over its own 112 x 112 chart (lane FFX-H, `src/battle/ffx/kernel/mix*.ts`); FFX-2's is the Alchemist's command, resolved by a
two-field lookup on hidden class and level bytes of its 68 items in `FFX-2.exe` at `0x0075A470` (checked note FFX2-G06). Nothing under `src/battle/ffx`, `src/data/ffx` or `src/audio` is touched. No boss number and no
party number was changed or added. No screen was touched, built or looked at. No random number is drawn by anything in this lane.
Owner's words: 2026-10-08 "It needs to be a 1:1 parity."; 2026-10-11 "ok keep going ill go with all your recommendations please" (the blanket yes that D-769 and addendum Q16 rest on); 2026-10-13/15 "keep going full speed
ahead", "all of this reverse engineering needs to be incorporated into our game". **Q16 (recorded by the release driver): FFX-2 Mix is built in two steps. The rules and the data first (this lane); the two-item picker and the
effects after the driver's mockup.** Plan: `D:\Tools\ffx-parity\coverage\wiring-plan-addendum-2026-10-13.md`, lane X2-G, and section 2 of `wiring-plan-draft-2026-10-11.md`. Paper preflight:
[`docs/plans/re-parity-rc9-x2-mix-review.md`](../plans/re-parity-rc9-x2-mix-review.md).

## 0. What changed, in player words

- **The Alchemist's Mix has its real rules.** Two items make one of **53 results** (the grenades and bombs, the fire, ice, thunder and water storms, Gravity's Black Hole, Holy's White Hole, the healing, reviving, curing, wall
  and drink mixes), the game's own table decides which, there is **no failed Mix**, and **the order you pick the two items in matters** (496 of 2,278 pairs: a Hero Drink and then a Potion is a Hero Drink; a Potion and then a Hero Drink is a
  Hi-Potion mix).
- **Both items leave the bag the moment the Mix is picked**, so the Item list shows the lower count at once and a second girl cannot take the same item; they come back if the cast is interrupted (a knock-out, Stop, Petrify,
  a dress change, a magic cancel, the fight's end), and they stay spent when it goes off. The same item twice needs two in the bag.
- **The cast and the effect are the result's own**: a charged cast of 80 with no ATB cost, aimed and resolved like an item of that kind (a grenade hits the whole enemy side, a Hi-Potion mix heals exactly 1,000, a Phoenix mix
  stands the fallen at a quarter or in full).
- **What a player still cannot do**: choose the two items. The picker is a new screen (step two, after the driver's mockup). Until it exists a human Alchemist's Mix row behaves as it did before this lane: it opens an overlay the
  FFX-2 HUD cannot open, the presenter logs an error and runs the bare Mix, and the turn passes with nothing happening (section 7, item 1). An AI, a headless run or a test supplies the items directly, and that is the path wired and proven here.
- **Nothing in any shipped fight changed.** The shipped line never mixes (`ffx2-parity-measure`: no `x2-alchemist-mix` use in any chapter); 12 seeds on all 12 FFX-2 chapters replay **byte for byte** (section 5).

## 1. Commits (oldest first, on `re-parity-rc9-x2-mix`)

| Commit | What | Case |
|---|---|---|
| `aebca32e` | the paper preflight; `kernel/mix-recipe.ts` (the game's recipe function with its three tables); the vector fixture `mix_recipe.json`; `parity-ffx2-mix-recipe.test.ts` and the wiki oracle `helpers/ffx2MixWiki.ts`. Wired to nothing | FFX-2 only |
| `eaaec83c` | the 53 result rows: `data/ffx2/command-records/mix.ts` (the game's rows as numbers), `data/ffx2/abilities/mix-results.ts` (one ability of ours each), `mix_rows.json`, `data-ffx2-mix-results.test.ts`; `adapt/mix.ts` (the 68 item ids, the 53 result ids, the plan, the preview, `stockShort`); the ledger hold learns a second ingredient (`adapt/item-ledger.ts`) | FFX-2 only |
| `d9488b4a` | the engine wiring: `execute.ts` (`abilityFor` resolves a Mix to its result, `pickItem` reserves both ingredients, the commit and the abort), `engine.ts` and `engine-core.ts` (the stock check is one function for items and Mixes); `parity-ffx2-mix-engine.test.ts` | FFX-2 only |
| `cb2bad25` | the real Chapter XIII build test; the held-command and picker-protocol tests; `MixResult`'s doc comment and its CONTRACT-CHANGES entry; the dated correction in `research/ffx2-combat-core.md` 3.11 | FFX-2 only; docs and tests |
| (the commit with this note) | this handoff; the per-row source citation in `data/ffx2/command-records/mix.ts` (comments only); `parity-ffx2-engine-wiring`'s sample widened from 600 to 900 situations, the one real failure of the whole-suite run (section 5.1) | docs, comments, one test |

## 2. What was decompiled, what is wired, what is live (Bailey's three states)

| Piece | Decompiled and proven in the harness | Wired into the engine | Live in a deployed build |
|---|---|---|---|
| The recipe function `0x0075A470` and its three tables | yes: 5,009 vectors, 0 mismatches, 0 draws (FFX2-G06) | **yes**: `kernel/mix-recipe.ts`, reached by `adapt/mix.ts` and `execute.ts` | no (not deployed); reachable only when something supplies two items |
| The 53 result rows (`0x3183` to `0x31B8` except `0x31AD`) | yes: read from all three copies of `command.bin`, equal to the note's export on 53 of 53 | **yes**: records in the catalog, 53 abilities, fired by a Mix | no |
| Both ingredients reserved like any item (reserve at the pick, commit at the start gate, refund on every way out) | yes: RC8's ledger kernel (357,509 vectors) | **yes**: the hold carries two ids | no |
| The two-item picker (a screen) and the Mix row's overlay | read in the note (3.8), not built | **no**: step two, after the driver's mockup | no |
| The result's look | nearest existing effect family, no new art | yes (by the spell layer's own rules) | no |

## 3. How it is built

- **Kernel** (`src/battle/ffx2/kernel/mix-recipe.ts`, 137 lines, pure, no DOM, no `three`, no draw): `mixRecipe(first, second)` is the game's function. The rule: each item's row is read by the low 12 bits of its id (a row past 67 reads row 0);
  the two classes index an 18 x 18 signed matrix (first item's class is the row); **99 means no blend**, then the higher level supplies the result and the first item wins a tie; any other byte is the result row and the level is the higher of
  the two; the result is the word at `level + 4 x row` of a 23-row table. The tables are the exe's (blend matrix `0xD61978`, result words `0xD61ABE`, item class and level `item.bin +0x86 / +0x87`).
- **Adapter** (`adapt/mix.ts`, 164 lines): `MIX_ITEM_IDS` (the 68 items in our ids, by table row), `MIX_RESULT_IDS` (the 53 results), `mixPlanOf(abilities, command)` (a Mix command with `extra: { kind: 'rikku-mix', mix: { ingredients } }` becomes its plan;
  anything else is undefined), `mixPreview(first, second)` (the picker's pure helper), `stockShort(flags, abilities, command)` (the one stock check for items and Mixes). `adapt/item-ledger.ts` gains `ItemHold.itemId2`, `reserveIngredients`,
  `ingredientsAvailable` and loops its commit and refund over both ids; a hold of one item keeps its exact shape.
- **Engine seams** (a few lines each): `execute.ts#abilityFor` returns the RESULT's ability for a Mix that carries its items (so the cast time, the costs, the targets, the `action-start` name and the effect are the result's; the command keeps the Mix's
  id and the ingredients on `extra`); `pickItem` reserves both; the cast firing is the commit; a short stock aborts with "No <item> left" and takes nothing (a partial reserve is rolled back); when a Mix comes back from its picker the overlay's suspension ends.
  `engine.ts#submit` and `engine-core.ts#fireHeld` ask `stockShort` instead of the item-only check (a one-for-one swap), so a pick the reserved stock cannot make is refused with the turn unspent, as an item is.
- **Data**: `command-records/mix.ts` (71 lines; merged into `FFX2_COMMAND_RECORDS`), `abilities/mix-results.ts` (352 lines; in the catalog, on no dressphere's ladder). Names are the research table's by position (the note's label [I]); every number is the row's.
- **The protocol the picker will use is the existing one** (`docs/CONTRACTS.md`, "Minigame protocol"): submit the bare Mix, receive `minigame-request` of kind `rikku-mix`, re-submit the same command with `extra`. Tested end to end (section 4).
- **Files under 400 lines**: `engine-core.ts` 397 (it was 396), `engine.ts` 368, `execute.ts` 346, `adapt/item-ledger.ts` 167. **Orphans**: `node tools/orphans.mjs` reports 28, none of this lane's modules.
- **Contracts**: one doc comment in `battle/common/types.ts` (`MixResult`), recorded in `docs/CONTRACT-CHANGES.md` (2026-10-16); no field changes shape. `docs/CONTRACTS.md` lists no other file this lane touched.

## 4. Proofs

| Test file | Tests | What it proves |
|---|---:|---|
| `parity-ffx2-mix-recipe.test.ts` | 15 | the kernel's three tables are the exe's; **all 4,624 ordered pairs equal what the real function answered**; the note's first 400 vectors; the 385 out-of-range ids (the note's oracle, which the real function matched); the row of an id (low 12 bits, nibble ignored, row 0 past the table, 32-bit wrap); the note's pair counts (1,060 through the matrix, 992 ties, 2,572 by level); **496 order-dependent unordered pairs**, and the blend matrix is symmetric so the order matters exactly where two items do not blend, share a level and differ in class; 53 distinct results; the worked cases (Hero Drink and Potion in both orders, Fire Gem and Arctic Wind, Holy absorbing, Dark Matter and Megalixir); **an independent oracle**: the wiki's Priority and Type algorithm restated from the research (`helpers/ffx2MixWiki.ts`, imports nothing from the kernel) agrees on **4,622 of 4,624** pairs, the two misses being exactly the Hero Drink first with the Poison Fang or the Candle of Life, and its 53 result names are one-to-one with the game's 53 rows |
| `data-ffx2-mix-results.test.ts` | 10 | the 53 records equal the Steam rows field for field; the 28 damaging rows' powers and hits are the research's; one ability per row, ids unique, on no ladder, the names the wiki oracle derived independently; the engine's two id tables are these abilities and the research list, and agree with the repo's own 24 item rows; the abilities mirror their rows (the only difference the engine's own derivation finds is the grenade line's damage type, kept `other` so it is not drawn as a slash); targeting from the row's bits; every result draws an existing spell effect |
| `parity-ffx2-mix-engine.test.ts` | 26 | an **independent oracle** (the fixture's table and the rows' numbers, not the kernel): **all 53 results are reached through the engine** and announced as themselves, damage rows hit the monster with one event a hit inside the note's +-10% of `power x 50`, gravity rows are held at 9,999, heals are exact (Hi-Potion 1,000, Mega-Potion 2,000 each, a percent heal is `max HP x power / 16` floored), revives stand at `max HP x power / 16`, Tallboy's 254 riders land, statuses land on the side the row names; order changes the result; a claimed `resultAbilityId` is ignored; the cast is the result's 80, not the stub's; both ingredients leave at the pick and the hold names both; the same item twice needs two; a short pick is refused with the turn unspent and a partial reserve is rolled back; a KO, Stop, Petrify, ejection and magic cancel each give both back; the 99 cap; an untracked ingredient is free; a Mix held for a chain lock reserves when it fires and is dropped if the stock is gone; the picker protocol (bare Mix, `minigame-request`, re-submit with the items, the suspension ends, the next Mix asks again); a bare Mix, a one-item Mix and an unknown item do nothing and spend nothing; no draw |
| `parity-ffx2-mix-chapter.test.ts` | 3 | Chapter XIII's real build (Rikku, Alchemist, level 99; 10 Light Curtains, 10 Lunar Curtains, 99 Megalixirs): the Mix row is offered and opens the `rikku-mix` overlay; one Light Curtain and one Lunar Curtain leave the real bag at the pick, the Wall fires and Shell and Protect land on the party, the counts stay down; the Light Curtain then a Remedy and the Remedy then the Light Curtain make different results |

The existing tests this lane's code touches pass unchanged: `parity-ffx2-item-ledger`, `parity-ffx2-item-ledger-engine` (the single-item hold keeps its exact shape), `parity-ffx2-end-window`, `parity-ffx2-menu-engine`, the three goldens (`ffx2-atb-golden`, `ffx-engine-golden`,
`ff7-golden`), `ffx2-hit-closes-menu`, `ffx2-menu-cancel-delay`, `data-ffx2-citations`, `data-ffx2-ids`, `data-ffx2-ranges`. One line was added to `data-ffx2-command-records.test.ts`: the 53 rows are pinned against their own fixture, as the hidden chapters' rows are.

### 4.1 Mutation pass (`D:\Tools\ffx-parity\rc9\x2-mix\mutants-def.mjs` + `mutate.mjs`: 30 one-line faults in the production code, each run against the lane's four test files, `data-ffx2-command-records` and RC8's two ledger tests, the file put back byte for byte after every run; `git status` clean afterwards)

**29 of 30 killed; the 30th is an equivalent mutant.**

| Mutant | Rule it breaks | Result | Killed by |
|---|---|---|---|
| `K1-tie-to-second` | no blend: the first item wins a tie | killed | data (names), recipe, engine |
| `K2-lower-level-wins` | no blend: the higher level supplies the result | killed | data, recipe, engine |
| `K3-blend-takes-min-level` | a blend takes the higher level | killed | data, recipe |
| `K4-matrix-transposed` | the first item's class is the matrix row | **equivalent** | the matrix is symmetric (a test pins it), so a transposed lookup returns the same byte for every pair |
| `K5-result-index-off-by-one` | the result word is at `level + 4 x row` | killed | data, recipe |
| `K6-row-mask-16-bits` | an item id reads its low 12 bits | killed | data, recipe |
| `K7-fallback-to-last-row` | an id past the table reads row 0 | killed | recipe (the 385 out-of-range ids) |
| `K8-blend-cell` | the blend matrix is the exe's | killed | recipe (tables), data |
| `K9-result-words-swapped` | the result words are the exe's | killed | recipe, data |
| `K10-item-level` | the item rows are the exe's | killed | recipe, data |
| `A1-order-swapped` | the order of the picks is the recipe's order | killed | engine, chapter |
| `A2-result-id` | each result row is its own ability | killed | data |
| `A3-item-ids-swapped` | the item ids are the game's rows in order | killed | data |
| `A4-stock-never-short` | a Mix the stock cannot make is refused | killed | engine |
| `L1-same-item-needs-one` | the same item twice needs two | killed | engine |
| `L2-reserve-first-only` | both ingredients are reserved | killed | engine, chapter |
| `L3-refund-first-only` | every way out gives both back | killed | engine |
| `L4-commit-refunds` | the commit keeps both spent | killed | RC8's ledger-engine test, engine |
| `L5-no-rollback` | a short reserve gives back what it took | killed | engine |
| `L6-hold-without-second` | the hold names both ingredients | killed | engine, chapter |
| `L7-short-is-ok` | fewer reserved than needed fails the pick | killed | engine |
| `E1-ability-ignores-plan` | the result row is what the girl casts | killed | 32 tests |
| `E2-pick-reserves-nothing` | a Mix reserves at the pick | killed | engine, chapter |
| `E3-suspension-not-ended` | the re-submit ends the overlay's suspension | killed | engine (the protocol test) |
| `E4-submit-never-refuses` | a pick the stock cannot make is refused, the turn unspent | killed | engine, RC8's ledger-engine test |
| `E5-held-never-dropped` | a held Mix is dropped if the stock is gone | killed | engine (the held-command test; **the first pass left this one alive, the test now also asserts no abort message and no turn begun**) |
| `E6-spends-stock-items-only` | the cast firing is the commit for a Mix | killed | engine, chapter |
| `D1-sunburst-power` | the rows are the game's (Sunburst is power 110) | killed | data |
| `D2-cast-cost` | the rows are the game's (a charged cast of 80) | killed | data |
| `D3-pineapple-targeting` | an ability mirrors its row | killed | data |

The first pass (27 faults, before the held-command assertion and the symmetry test) left two alive: `E5` (fixed as above) and `K4` (shown equivalent by the symmetry test). Raw results: `D:\Tools\ffx-parity\rc9\x2-mix\mutants-result.json`.

## 5. Measurement (every FFX-2 chapter on the shipped line, 12 seeds, before and after)

Method: the RC8 measurement `tests/unit/ffx2-end-ledger-measure.test.ts` (the shipped `intendedStrategy` plays each chapter's whole chain through the app's own path; it records a digest of every link's full event log per seed, item use per fight and the end window),
`PYREFLY_X2L_SEEDS=12`, the same file on both sides. **Base** = the sources of `748038a0` with none of this lane's edits (run before the first source edit for the ten default chapters; the two chapters outside the default list, Angra Mainyu and the Leblanc preview, were run on a
`git archive` extract of `origin/r50-release` in scratch, with a junction for `node_modules` that was removed afterwards). **After** = the tip. `ffx2-parity-measure.test.ts` with `PYREFLY_MEASURE_USAGE` was run on both sides for the seven listed chapters. Raw files: `D:\Tools\ffx-parity\rc9\x2-mix\` (`base-12.json`, `new-12.json`, `base-extra-12.json`, `new-extra-12.json`, `base-usage-12.json`, `new-usage-12.json`, `compare.mjs`).

| Chapter | seeds | wins (base > after) | party turns | engine turns | party KOs | game minutes | item uses a fight | seeds whose event log moved | outcomes changed |
|---|---:|---|---:|---:|---:|---:|---:|---:|---:|
| ffx2-bahamut (IV) | 12 | 12 > 12 | 538 > 538 | 684 > 684 | 0 > 0 | 14.6 > 14.6 | 0.83 > 0.83 | 0 | 0 |
| ffx2-vegnagun-shuyin (V) | 12 | 12 > 12 | 1119 > 1119 | 1838 > 1838 | 8 > 8 | 39.5 > 39.5 | 27.25 > 27.25 | 0 | 0 |
| ffx2-leblanc (VI) | 12 | 12 > 12 | 848 > 848 | 1164 > 1164 | 7 > 7 | 24.6 > 24.6 | 12.92 > 12.92 | 0 | 0 |
| ffx2-fallen-aeons (XI) | 12 | 12 > 12 | 574 > 574 | 894 > 894 | 2 > 2 | 27.7 > 27.7 | 5.83 > 5.83 | 0 | 0 |
| ffx2-trema (XIII) | 12 | 10 > 10 | 2171 > 2171 | 3413 > 3413 | 10 > 10 | 107.9 > 107.9 | 18.42 > 18.42 | 0 | 0 |
| ffx2-den-of-woe (XV) | 12 | 12 > 12 | 374 > 374 | 558 > 558 | 3 > 3 | 12.5 > 12.5 | 3.67 > 3.67 | 0 | 0 |
| ffx2-ixion-djose (XVI) | 12 | 12 > 12 | 332 > 332 | 460 > 460 | 0 > 0 | 14.9 > 14.9 | 1.75 > 1.75 | 0 | 0 |
| ffx2-masterpiece-theatre (the Experiment) | 12 | 10 > 10 | 296 > 296 | 377 > 377 | 16 > 16 | 9.6 > 9.6 | 1 > 1 | 0 | 0 |
| ffx2-tourist-trap | 12 | 12 > 12 | 568 > 568 | 859 > 859 | 0 > 0 | 25.2 > 25.2 | 7.5 > 7.5 | 0 | 0 |
| ffx2-valefor-besaid | 12 | 12 > 12 | 456 > 456 | 612 > 612 | 2 > 2 | 20.7 > 20.7 | 1.83 > 1.83 | 0 | 0 |
| ffx2-angra-mainyu | 12 | 11 > 11 | 2012 > 2012 | 3326 > 3326 | 34 > 34 | 88.9 > 88.9 | 33.75 > 33.75 | 0 | 0 |
| exp-leblanc (the hidden Leblanc preview) | 12 | 12 > 12 | 848 > 848 | 1164 > 1164 | 7 > 7 | 24.6 > 24.6 | 12.92 > 12.92 | 0 | 0 |

**144 seeds, 0 event-log digests moved, 0 outcomes changed.** The ability-usage table of the seven listed chapters is identical on both sides (153 abilities, same counts) and **has no `x2-alchemist-mix` in either run**: of the Alchemist's commands the shipped line uses only Stash Phoenix Down (4 uses) and Stash X-Potion (44); the five hidden chapters (measured on the finished tree, 73 abilities) use no Alchemist command at all. So **no shipped AI line mixes in any of the twelve FFX-2 chapters**,
which is why nothing moved and no golden needed a re-baseline: `ffx2-atb-golden` (60 digests), `ffx-engine-golden` (18) and `ff7-golden` pass unchanged. Cause of the identity, by reading the lines: the new code is reached only through a Mix command that carries two items (`mixPlanOf`) and through the second id of a hold; every other path keeps its old code.
**500 seeds were not run**: nothing in the line can differ (the Mix is not in it), and the brief asked for 12.

What the Mix can make from the bags the two builds that learn it carry (computed from the fixture): the Chapter V (Farplane) bag, 13 kinds of item, makes 10 results (Panacea, Mega Phoenix, Final Phoenix, Fantasy Phoenix, Hi-Potion, Mega-Potion, Ultra Potion, Final Elixir, Chocobo Wing, Wall); the Chapter XIII (Trema) bag, 8 kinds, makes 7 (Black Hole, Panacea, Ultra Potion, Final Elixir, Soul Spring, Wall, Mega Cocktail).
Of the 68 items the game's table has, the data layer carries ItemDefs for 41; the others have ids in the Mix table but are in no chapter's bag and no drop table (section 7, item 4).

### 5.1 The whole suite, once

Run once on the tree of `cb2bad25` (the last commit before the handoff; `D:\Tools\ffx-parity\rc9\x2-mix\suite.json` and `suite.log`), `--maxWorkers=2`, `TEMP` and `TMP` on `D:`, 19:06 to 20:10 EDT on 2026-10-16 (3,885 s, on a machine other sessions were loading):
**1,311 files: 1,270 passed, 24 failed, 17 skipped; 20,402 tests: 20,085 passed, 185 failed, 131 skipped, 1 todo.** The 24 failed files sort into three groups:

1. **22 files (182 tests) are the art-only set** a worktree has without `public/art` (an `ENOENT` on a painting, a sidecar or `public/art/manifest.json`, or an `existsSync` / `artExists` of a plate or a portrait; each failing assertion was read in the report): `ui-portrait-face-crop` (145 tests), `art-ref-defaults` (4), `pause-remake` (3), `cutscene-story-poses` (1), `chapter-meta` (file), `party-face-manifest` (file), `chapter-meta-evrae` (3), `chapter-meta-ffx2-leblanc` (2),
   `chapter-meta-seymour-anima-macalania` (3), and under `chapters/`: `chapters-6-7-8-enemy-sprite-manifest` (file), `den-of-woe-ship-content` (3), `den-of-woe-ship-scene` (1), `experiment-scene` (1), `fallen-aeons-ship-content` (2), `fallen-aeons-ship-scene` (1), `isaaru-ship` (3), `leblanc-art` (2), `leblanc-party-sprites` (file), `natus-ship-content` (2), `natus-ship-scene` (2), `trema-ship-content` (4), `yojimbo-content` (file).
   The same 22 files and the same counts as RC8's and FFX-H's own runs list.
2. **1 file is a load timeout**: `advisor-floor` (2 tests, "Test timed out in 15000ms" under the suite's load). Run alone with a long timeout it passes, 23 of 23 (129 s).
3. **1 file was a real failure caused by this lane, found by this run and fixed**: `parity-ffx2-engine-wiring` ("the engine draws and decides what the kernels do": 600 generated situations, engine against oracle). Its *equality* assertions all passed; the failing line was a coverage floor of the test's own sample ("`seen.miss` > 20", 17 seen). Cause: 37 of the 53 Mix results fit that test's pool and none ever misses (accuracy formula 0), so the pool grew from 277 to 314 and the same seed's 600 situations fell to 17 evaded hits.
   The sample is now 900 situations (32 evaded hits, the margin it had before; every other floor cleared by more), so the Mix results are in the sample too; the test file carries the cause. It passes, 16 of 16.

Two edits followed the run, both small and re-verified: that test's sample size, and the per-row source citation in `data/ffx2/command-records/mix.ts` (the trailing comments only: stripped of comments the file is identical). After them: `tsc --noEmit` clean, the seven files that touch the lane (`parity-ffx2-mix-recipe`, `data-ffx2-mix-results`, `parity-ffx2-mix-engine`, `parity-ffx2-mix-chapter`, `data-ffx2-command-records`, `data-ffx2-citations`, `parity-ffx2-engine-wiring`) pass, 200 tests, and `node tools/orphans.mjs` still reports 28 orphans, none of this lane's modules.
The goldens (`ffx2-atb-golden`, `ffx-engine-golden`, `ff7-golden`) and the lane's neighbours (`parity-ffx2-item-ledger`, `-item-ledger-engine`, `-end-window`, `-menu-engine`, `ffx2-hit-closes-menu`, `ffx2-menu-cancel-delay`) were in the suite and passed unchanged.

## 6. Disclosures, in player words (what the release should say and admit)

**FFX-2 only.**

- The Alchemist's Mix now follows the game's own table. Any two items make one of 53 results; there is no failed Mix; the order you pick the two items in matters for about a fifth of the pairs (496 of 2,278).
- Both items are taken from the bag when the Mix is picked (a second girl cannot take them), given back if the cast is interrupted, and spent when it goes off.
- **No screen lets a player pick the two items yet.** Until the picker is built, choosing Mix in the menu still does nothing and costs the turn (it did before; this lane does not change it). Nothing in any chapter changed: every chapter replays byte for byte.
- The research said Sunburst should be 6,000; the game's own row says power 110 (5,500). The engine uses the row.

## 7. Open items and the picker, which is the driver's

1. **A human's Mix row today (pre-existing, not changed here).** `FFX2BattleHud.openMinigame` rejects the `rikku-mix` kind ("cannot open minigame"); the presenter logs an error and, because the FFX-2 engine has no `backOutOfMinigame`, re-submits the bare Mix, which resolves to nothing and spends the turn. No automatic play is affected: the shipped line (`intendedStrategy`) never picks the row (measured, twelve chapters), and an auto-battle taken over mid-fight on a human-built engine has the
   `opensMinigame` rows filtered out. Decision for the driver: grey the row ("needs the item picker") until step two, or leave it.
2. **The picker (a screen: rule 9, a mockup and Bailey's approval before any code).** What the game's picker does (FFX2-G06 3.8): the Item and Mix commands both open lists made from the stock table; in Mix the first pick is remembered so the second list shows its count minus one; after the second pick the HUD runs the recipe function, writes the result row at the top of
   its menu and opens that row's own target selection; the packet then carries the result as the command and the two picks as its two items. What the engine already offers a picker, so the mockup can show real data: `mixPreview(first, second)` (`adapt/mix.ts`) gives the result's row and our ability id, from which `ABILITIES[id]` and its `ffx2Record` give the name, the targeting, the power, the hits, the element and the riders;
   the reserved stock is `state.flags['inventory:<id>']` (the counts the Item list already shows); `validTargetIds(units, actor, ability)` gives the result's legal targets; the order matters, so a mockup might show the result for both orders; every pair makes something, so there is no "no recipe" state to design. It must hand back `{ kind: 'rikku-mix', mix: { ingredients: [first, second], resultAbilityId: null } }`
   and the presenter re-submits the same command with `extra` (tested). **Two engine gaps the picker will meet**: (a) *backing out*: the FFX-2 engine has no `backOutOfMinigame`, so a cancelled picker would run the bare Mix and spend the turn (FFX has it, hotfix 24); adding one touches how Trigger Happy and the reels cancel too, so it is a decision, not a quiet fix; (b) the request's `params` carry only
   `{ resolvedByMinigame: true, abilityId }`, no inventory (the picker can read the HUD's last state instead). **What the presenter sees of a resolved Mix**: the `action-start` event keeps `command` = the Mix command (with its `extra`) and carries the RESULT in `abilityId` and `abilityName`, so a lookup by `abilityId` (the banner, the spell effect, the animation tables) sees the result and a
   lookup by `command.id` sees `x2-alchemist-mix`; the result abilities carry no `animationKey` or `sfxKey` of their own, and nobody has looked at one on a screen (no screen was run in this lane), so how a Mix reads in a real fight is step two's first check.
3. **The effects (step two).** The 53 results borrow the spell layer's own rules: an element draws its element (fire 5, ice 5, thunder 5, water 5, holy 2), a healing result draws the Cure motes (11), the rest the tinted bloom a Grenade already draws (20: the grenade line, Gravity, the walls, the drinks, the cures that heal nothing). Gravity has no element effect in the layer. No new art was made; a distinct look for any family is the driver's call with Bailey.
4. **Content (rule 10, needs a yes).** The player's bags hold few of the 68 ingredients; 27 of the 68 items have no ItemDef in the data layer and none appears in a drop or steal table, so most results cannot be made in play. Adding them (as drops, shop stock or build inventories) is new content.
5. **Names by position.** The 53 result names and the 68 item names come from the research table by position (the note's own label [I]); the numbers are the game's. Inside a group of rows that share a class and a level (the four first-aid items, the two smaller bombs, the four status grenades, the four Greens) the order of names cannot move any result.
6. **Not read by anything in the engine today**: the Alchemist passives (Chemist, Elementalist, Physicist, Items Lv. 2); whether they act on a Mix result is not in the note. The game's rule for when the Mix command is offered or greyed is unread (the engine's rule is the dressphere's ladder, as before).
7. **Merge hot spots for the driver** (other RC9 lanes edit them too): `docs/CONTRACT-CHANGES.md` (top of file), `src/battle/common/types.ts` (every lane), `src/battle/ffx2/engine-core.ts` (397 lines here; `re-parity-rc9-x2-confusion` also edits it and `engine.ts`, so whichever lands second must keep it under 400), `src/data/ffx2/abilities/index.ts` and `command-records/index.ts` (one added import and spread each), `tests/unit/data-ffx2-command-records.test.ts` (one added skip line).
   `origin/r50-release` had moved to `6b638df9` when this note was written (six FFX-only commits since this branch was cut, no file in common with it).
   **Release class**: `node tools/critic-plan.mjs --paths <this lane's source files>` says DEEP (a focused review of the production candidate before a deploy; live verification, then the deep review on the live build). The planner reads the `types.ts` doc comment as "shared combat core" and widens `games` to both; no FFX behaviour changed.
8. **Stale research lines** this note's correction block (in `research/ffx2-combat-core.md` 3.11) does not rewrite: 2.9.3 "Use 6,000" for Sunburst (and the same in 3.11 Step 7 and the open-conflict list at the end), and the "unordered" wording of the Step 7 table header. The kernel's tables are the source of truth.

## 8. Decisions for Bailey

1. **The picker and the effects** (step two, accepted as a two-step build by addendum Q16): the driver's mockup of the two-item picker, rule 9; section 7 item 2 lists what it needs and the two engine gaps. Options the mockup could show: a plain two-list picker like the Item list (the game's own), the same with the result's name and target shown after the second pick (the game's own), or a single grid of results for the bag (new).
2. **Until the picker exists, grey the Mix row?** A human who picks it today wastes the turn silently (section 7 item 1). Greying it ("needs the item picker") is a one-line menu change; leaving it is today's behaviour.
3. **Should an unattended Alchemist (auto-battle, a headless run) ever Mix?** Today it never does (the strategy does not see the row), and a bare Mix does nothing. Making an automatic pick of two items (new behaviour, rule 10) would need a rule for which; the FFX lane left the same question (its decision 3).
4. **More ingredient items in the game** (section 7 item 4): which of the 27 missing items should exist, and from where (drops, steals, shops, a build's bag). New content, a yes first.
5. **FFX-2 back-out of a picker** (section 7 item 2a): whether the engine gets a `backOutOfMinigame` for the Mix only or for every FFX-2 overlay (it would change how a cancelled Trigger Happy or reel spin plays).

## 9. Base, and how to re-run

**Base `origin/r50-release` (`748038a0`), not the worktree's checked-out branch.** The brief's condition: use the RC8 item ledger if it is on the base, else base on r50. `git merge-base --is-ancestor origin/re-parity-rc8-x2-end-ledger HEAD` was false for the worktree's `re-parity-rc9-ffx-rewards` (89 commits behind r50-release) and true for `origin/r50-release`, so the ledger
(`kernel/item-ledger.ts`, `adapt/item-ledger.ts`, `execute.ts` reserve and commit) is only there on r50. The branch was cut with `git switch -c re-parity-rc9-x2-mix origin/r50-release` and its upstream unset, so a bare `git push` cannot touch r50-release. `re-parity-rc9-ffx-rewards` was not changed.

```
node "D:/Final Fantasy/node_modules/typescript/bin/tsc" --noEmit -p .
TEMP=D:/Tools/ffx-parity/tmp/x2-mix TMP=D:/Tools/ffx-parity/tmp/x2-mix node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run --maxWorkers=2 tests/unit/parity-ffx2-mix-recipe.test.ts tests/unit/data-ffx2-mix-results.test.ts tests/unit/parity-ffx2-mix-engine.test.ts tests/unit/parity-ffx2-mix-chapter.test.ts tests/unit/data-ffx2-command-records.test.ts
TEMP=... TMP=... node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run --maxWorkers=2 tests/unit/ffx2-atb-golden.test.ts tests/unit/ffx-engine-golden.test.ts tests/unit/ff7-golden.test.ts
PYREFLY_X2L_MEASURE=1 PYREFLY_X2L_SEEDS=12 PYREFLY_X2L_OUT=out.json node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run --maxWorkers=1 --testTimeout=3000000 tests/unit/ffx2-end-ledger-measure.test.ts
node tools/orphans.mjs
```
Tooling outside the repo (`D:\Tools\ffx-parity\rc9\x2-mix\`): `extract-rows.mjs` reads the 53 rows (and the stub) out of the three read-only copies of `command.bin`; `gen-recipe.mjs` builds the kernel's table literals and `mix_recipe.json` from the note's `mix_recipes.json`, `vectors-mix.jsonl` and the three `item.bin` copies (it checks that the copies agree with each other and with the note, and that the JS oracle equals the emulator's table on all 4,624 pairs);
`gen-rows.mjs` writes `command-records/mix.ts`, `abilities/mix-results.ts` and `mix_rows.json` (`validate-extractor.mjs` decodes the 78 `0x3xxx` rows the repo's own fixture `command_rows.json` already holds with the same reader and finds **0 mismatches over every field**, so the offsets are right for the 53 new rows too); `mutants-def.mjs` + `mutate.mjs` run the mutation pass; `compare.mjs base.json new.json` prints the measurement table;
`base-src\` is the `git archive` extract of `origin/r50-release` the two-chapter base run used (its `node_modules` junction was removed with `rmdir`, nothing followed). `D:\Tools\ffx-parity\tmp\x2-mix\` was this lane's TEMP and TMP and is deleted at the end.

## 10. CHANGELOG paragraph (plain words; for the main session to paste, not edited into `CHANGELOG.md` here)

**FFX-2 only.** The Alchemist's Mix now has its real rules. Any two items make one of 53 results (the grenades and bombs, the fire, ice, thunder and water storms, Gravity's Black Hole, Holy's White Hole, and the healing, reviving, curing, wall and drink mixes), the game's own table decides which, there is no failed Mix, and the order you pick the two items in changes the result for about a fifth of the pairs (a Hero Drink and then a Potion is a Hero Drink, a Potion and then a Hero Drink is a Hi-Potion mix). Both items leave the bag the moment the Mix is picked, so a second girl cannot take them, come back if the cast is interrupted, and stay spent when it goes off; the result has its own cast time and effect. The screen that lets you choose the two items is not in this build, so in play the Mix row still waits for it. Nothing in any chapter changed: every chapter replays byte for byte.
