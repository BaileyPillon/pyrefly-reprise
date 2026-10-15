# Re-parity RC7, lane FFX-H (Rikku's Mix chart, the 21 missing results, the item bag): the engine resolves a Mix from the game's complete table and keeps its stock in the game's bag

Status: **built, tested and pushed on branch `re-parity-rc7-mix`; not merged, not deployed** (2026-10-13). Cut from `origin/re-parity-rc6-ch2` (`ab57f082` = the live build r44a plus the audio build plus everything through RC6).
**Game case: FFX only** (AGENTS.md rule 14): the note's own case line says FFX-2 resolves its Alchemist Mix through hidden Priority and Type fields on its items in its own exe; none of these addresses or tables exist
there. `src/battle/ffx2`, `src/data/ffx2`, `ffx2-atb-golden` and `ff7-golden` are untouched and pass unchanged. Owner: Bailey. His words, as the brief quoted them: 2026-10-08 "It needs to be a 1:1 parity. this is very useful
for our project."; 2026-10-09 "Your findings need to be implemented into live builds as the decompilation work progresses."; 2026-10-11 23:08 EDT "ok keep going ill go with all your recommendations please"
(which accepted the full Mix chart with the 21 missing results and nearest-family effects, and numbers-only tables in the public repo); 2026-10-13 11:49 EDT "i'll go with all of your recommendations". Deploys need his word and the
release driver's. Source: the checked decompile note `D:\Tools\ffx-parity\coverage\ffx\FFX-G05.md` (every statement used here carries its proof label; nothing under its "Open questions" was built from), condensed into
[`research/re-ffx-mix.md`](../../research/re-ffx-mix.md). Plan: `D:\Tools\ffx-parity\coverage\wiring-plan-draft-2026-10-11.md`, lane FFX-H.

## 0. In one paragraph

Until now Rikku's Mix knew 43 pairs: a pair outside them made "Mix failed!" and kept the gauge and the items, the 21 results the game also has did not exist, a steal could stack past 99 and the picker offered only the 43. The game's
table is **complete**: 112 x 112 cells, every pair of items makes one of 64 results. The engine now resolves a Mix from that table (kept as 82 groups of identical ingredients, in our ids, no game text), consumes both ingredients first as the
game's resolver does, aims the result by the game's own auto-target (a group result draws once on stream 5, a one-ally result once on stream 4 with two or more candidates, a multi-hit result then deals its hits over the group), spends the
gauge only when a target was found, and records the result as discovered. The 21 missing results are in the catalog with the game's own command records (power, hits, element, rank, riders), each borrowing the effect of the nearest existing
family: no new art. Every change to the item stock (a steal, a refund, an item use, the starting bag) goes through the game's bag (112 stacks of 0 to 99; a monster never touches it). No shipped line fires Rikku's Mix and none steals
past 99, so **nothing a golden or a chapter measures moved**; the tests that move are the data counts (462 to 483 abilities).

## 1. Commits (oldest first, on `re-parity-rc7-mix`)

| Commit | What | Case |
|---|---|---|
| `072f454b` | The kernels (`kernel/mix-table.ts`, `mix.ts`, `bag.ts`, `deduct.ts`, `gil.ts`), four fixtures of 300 runs of the real functions (+ the 12,544 ordered pairs), the kernel tests. Wired to nothing | FFX only |
| `de1736d9` | The 21 new Mix results with their command records; the data tests' counts (462 to 483 abilities); the measure test's Mix counter | FFX only; data and tests |
| `91f6696d` | The engine wiring: `adapt/bag.ts`, `mix.ts`, `item-use.ts`, the Mix branch of `overdriveShape.ts` and `execute.ts`, the registry, the menu's pairs, steal, setup; the engine-level test with its independent oracle | FFX only |
| `201b2830` | `research/re-ffx-mix.md`, the reaction items charged to their user, the stream map's row for the Mix, the measure test's forced-Mix diagnostic | FFX only; notes, comments, tests |
| `c40eea14` | Three assertions the first mutation pass showed missing (a count under the id 0, a lone ingredient never learned, a gil offer reaching the hit in full); the fixtures' bag generator learns ghost slots | FFX only; tests and fixtures |
| `d6b97cc0` | Two tests the 21 new results moved, found by the whole-suite run: the Evrae counter's class table gains the 21 records, the telegraph-hold family test counts 64 `mix-*` ids | FFX only; tests and fixtures |
| `dceecba9` | Merge of `origin/re-parity-rc6-ch2` (`f6af1e3b`, one docs-only commit) so the branch is a clean descendant of the RC6 tip | docs only |
| (the commit with this note) | this handoff | docs |

## 2. The rows (plan id, note section, what the engine did, what it does now)

| Plan | Note | What the engine did | What it does now |
|---|---|---|---|
| H1 | 3.1, appendix A (emulated: all 12,544 ordered pairs, 0 mismatches) | 43 pairs in `data/ffx/mixes/recipes.ts` | the whole chart as data: `kernel/mix-table.ts` (82 x 82 group results, the item to group map, the 112 item ids and 64 result ids in our names); `kernel/mix.ts#mixResultCommand` answers any pair; `registry.mixResult` asks it first; the 43 old pairs agree cell by cell |
| H2 | 7 row 2, 4.1 | 43 result abilities | **21 new result abilities** (`data/ffx/mixes/abilities-ordnance-2.ts`) with their command records (`command-records/player.ts`): the numbers are the game's own records (fixed formula, power, hits, element, rank 6, the status bytes of the riders), the table in section 3 below; effect borrowed from the nearest existing family |
| H3 | 3.2 (emulated 52,544 vectors, picker hooked), 3.6 (read) | no recipe meant "Mix failed!", the turn kept, the items kept; the result was aimed by its authored targeting | `kernel/mix.ts#mixResolve` (the resolver, 1:1 with the real function on 300 whole-record vectors); `mix.ts#resolveMixAction` runs it on the party's bag and the targeting lane's `autoTargetMask` for the result's own record; a Mix whose pick finds nobody spends both ingredients, no gauge, draws nothing, learns nothing, says "Mix failed!" and ends the turn with `MIX_FAILED_RANK` (**the delay is not established**, section 10) |
| H4 | 7 row 4, 3.3 (menu rule) | `mixablePairs` offered only pairs with a recipe | every pair of items the bag holds, a doubled item needing two (`overdrive.ts`); the picker's data shape is unchanged (section 9) |
| H5 | 3.3 (emulated 60,000), 3.4 (emulated 60,016) | stock added with no cap (`steal.ts`, `setup.ts`), spent and refunded by hand | `kernel/bag.ts` (the bag function), `kernel/deduct.ts` (the deduct and refund routine, monsters exempt); `adapt/bag.ts` lays the engine's stock out as the game's slots for **every** change: a steal, a refund, an item use, a reaction's payment, the starting bag. 99 per stack, a removal larger than the stack refused, a refund into nothing makes a stack of one, a monster never touches the bag |
| H6 | 3.7 | Copycat's record `repeatsPreviousAllyAction`, read by nothing | **left as it is** (the plan marks it "wire or leave; latent": no authored build offers Copycat, and wiring it would be content, rule 10). Decompiled and proven in the note, not ported |
| H7 | 3.8 (emulated 30,000) | the Spare Change offer was cut to the gil held and the full amount always subtracted | `kernel/gil.ts#payGil`, `item-use.ts`: the action runs with the offer, the pay refuses (gil unchanged) when the gil does not cover it. `addGil` (cap 999,999,899) is ported and proven but has no engine caller: the engine adds gil only in kill rewards, which use the clamp helper, and Pilfer Gil and Nab Gil are not implemented |
| H8 | 3.2 step 7 | not recorded | `FFXRuntime.mixShared`, the party-shared 16-word array: bit (id - 0x60) and 15 of word (id - 0x60) >> 4, set when two ingredients and a target exist. Nothing reads it (the game's reader is unread); a picker that lists known results would |

## 3. The 21 new results (all FFX only, all rank 6 and Overdrive cost 100, all always hit; the record's own numbers)

| Result | Command | Fixed power x hits | Element | Riders (record bytes) | Effect borrowed from |
|---|---|---|---|---|---|
| Pineapple | 0x308d | 27 x 1 |  |  | mix-potato-masher |
| Blaster Mine | 0x3091 | 22 x 1 |  | sleep 150 for 3, silence 150 for 3, darkness 150 for 3 | mix-chaos-grenade |
| Hazardous Shell | 0x3092 | 45 x 1 |  | poison 150, sleep 254 for 4, silence 254 for 4, darkness 254 for 4 | mix-chaos-grenade |
| Calamity Bomb | 0x3093 | 72 x 1 |  | poison 254, power-break 50, magic-break 50, armor-break 50, mental-break 50, sleep 254 for 5, silence 254 for 5, darkness 254 for 5 | mix-chaos-grenade |
| Heat Blaster | 0x3095 | 8 x 5 | fire |  | mix-firestorm |
| Brimstone | 0x3098 | 8 x 3 | fire | poison 150, sleep 150 for 3, silence 150 for 3, darkness 150 for 3 | mix-abaddon-flame |
| Snow Flurry | 0x309a | 8 x 5 | ice |  | mix-firestorm |
| Icefall | 0x309b | 14 x 6 | ice |  | mix-firestorm |
| Winter Storm | 0x309c | 18 x 9 | ice |  | mix-burning-soul |
| Black Ice | 0x309d | 8 x 3 | ice | poison 150, sleep 150 for 3, silence 150 for 3, darkness 150 for 3 | mix-abaddon-flame |
| Krysta | 0x309e | 18 x 3 | ice | poison 254, power-break 50, magic-break 50, armor-break 50, mental-break 50, sleep 254 for 3, silence 254 for 3, darkness 254 for 3 | mix-abaddon-flame |
| Thunderbolt | 0x309f | 8 x 5 | thunder |  | mix-firestorm |
| Rolling Thunder | 0x30a0 | 14 x 6 | thunder |  | mix-firestorm |
| Lightning Bolt | 0x30a1 | 18 x 9 | thunder |  | mix-burning-soul |
| Electroshock | 0x30a2 | 8 x 3 | thunder | poison 150, sleep 150 for 3, silence 150 for 3, darkness 150 for 3 | mix-abaddon-flame |
| Thunderblast | 0x30a3 | 18 x 3 | thunder | poison 254, power-break 50, magic-break 50, armor-break 50, mental-break 50, sleep 254 for 3, silence 254 for 3, darkness 254 for 3 | mix-abaddon-flame |
| Waterfall | 0x30a4 | 8 x 5 | water |  | mix-firestorm |
| Flash Flood | 0x30a5 | 14 x 6 | water |  | mix-firestorm |
| Tidal Wave | 0x30a6 | 18 x 9 | water |  | mix-burning-soul |
| Aqua Toxin | 0x30a7 | 8 x 3 | water | poison 150, sleep 150 for 3, silence 150 for 3, darkness 150 for 3 | mix-abaddon-flame |
| Dark Rain | 0x30a8 | 18 x 3 | water | poison 254, power-break 50, magic-break 50, armor-break 50, mental-break 50, sleep 254 for 3, silence 254 for 3, darkness 254 for 3 | mix-abaddon-flame |

The four grenade-line results hit the whole opposing side (the group, as the other grenades do); the 17 elemental ones spread their hits over the group by the target builder, as Firestorm does. The record also says the grenade
line can crit (flag word bit 2) and carries a shatter chance of 50 against a Petrified target; the engine reads both from the record. **Presentation: no new art.** The spell effect layer draws a result's own element (so Icefall is drawn as ice, Rolling Thunder as thunder),
and `extra.fxFamily` / `extra.vfxKey` name the family each was matched to (the grenade line's Pineapple the Potato Masher's, the three grenades with riders the Chaos Grenade's, the elemental results the fire line's member of the same shape).
Nothing here was looked at in a browser (no screen changed); the first sight of Heat Blaster or Tidal Wave in a real fight is a check for the release driver.

## 4. Which findings are wired, and which are only decompiled

| Note section | State |
|---|---|
| 3.1 the chart; 4.1 the 64 results and their target rules | **wired** (live in the engine once released) |
| 3.2 the resolver; 5 the draw order of the target pick | **wired** (the waiting flags of the load are not modelled: the engine resolves in one call) |
| 3.3 the bag; 3.4 deduct and refund (monsters exempt, refund into nothing, the cap) | **wired** for every change the engine makes (the deduction happens where the command is executed: the engine has no queue between a choice and its use) |
| 3.6 the executor's Mix-failed path (ingredients gone, gauge kept) | **wired**; its delay is **not established** and a stand-in is charged |
| 3.8 the gil pay | **wired**; the add (cap 999,999,899) is decompiled and proven, **no caller** |
| 3.5 the queue and its priority insertion | not ported by this lane (the reaction half is RC4 lane F's); the two 62-slot lists are **only decompiled** |
| 3.6 the refund of an action dropped at the range check; the loss of queued items when their user dies | **only decompiled** (the engine's players cannot aim an item out of reach; no engine action waits in a queue except the reactions) |
| 3.7 Copycat's saver and copier | **only decompiled** (latent, above) |
| the game's single-target picker draws for Copycat's re-pick | not needed |

## 5. How it is built

- **Kernels** (`src/battle/ffx/kernel/`, pure, no DOM, no `three`, draws are a callback; rule 1): `mix-table.ts` (the chart), `mix.ts` (the lookup and the resolver), `bag.ts`, `deduct.ts`, `gil.ts`. Each is a port of one game function
  (addresses in the file headers) and is proven on the real machine code (section 6).
- **Adapter** (`adapt/bag.ts`): the engine's `FFXRuntime.inventory` map as the game's 112 slots (`bagOfStock`), the kernel's answer for one item (`stockAfter`), the write-back with the `state.flags['inventory:<id>']` mirror (`changeStock`). An
  item id with no number in the game's table (a test rig's) goes through the same kernel as one stack of a bag of its own.
- **Engine seams**: `mix.ts#resolveMixAction` (the Mix: bag, resolver, auto-target, learn), `overdriveShape.ts` (the `rikku-mix` branch calls it), `execute.ts` (a failed Mix; the Mix's targets), `item-use.ts` (the item branch of
  `execute.ts`, split out for the 400-line rule, now with the pay), `state.ts#spendItem/refundItem` (through the adapter, with the user), `registry.ts#mixResult`, `overdrive.ts#mixablePairs`, `steal.ts`, `setup.ts`, `adapt/reactions.ts`
  (the reaction payments are charged to their user).
- **No contract file changes** (`docs/CONTRACTS.md` lists none of the files touched; `src/battle/common/types.ts` is untouched), so there is no `CONTRACT-CHANGES.md` entry; `FFXRuntime` (engine-private) gains the optional `mixShared`.
- **Files under 400 lines**: `execute.ts` fell from 378 to 371; the largest new file is `kernel/mix-table.ts` at 302 (one line per row of the chart).
- **Orphans**: `node tools/orphans.mjs` reports 36, the same 36 as the base; none of this lane's modules is one.

## 6. Proofs and mutants

| Test file | What it proves |
|---|---|
| `tests/unit/parity-ffx-mix.test.ts` | the chart: 112 items, 82 groups, 64 results, the per-result pair counts of the note (6, 10, 64, ... 648 ... 86; 6,328 in all), symmetry, **all 12,544 ordered pairs equal what the real resolver wrote** (`mix_resolver.json` `table`), the 43 old recipes cell by cell, the corner reads of an id with no row; the resolver on **300 whole-record runs of the real function** (loading and resolved guards, two, one and no ingredients, no target, learn bits, a doubled item with one copy) and hand-worked cases |
| `tests/unit/parity-ffx-bag.test.ts` | the bag on **300 runs of the real function** (stacks, caps, refusals, emptied slots, full bags, non-items, both bit arrays), the deduct and refund routine on **300** (party, aeon and monster users, Mix records, short stock), the gil pay and add on **300**; hand-worked cases for each rule |
| `tests/unit/parity-ffx-engine-mix.test.ts` | the engine equals an **independent oracle** (`helpers/ffxMixBoard.ts`, which imports nothing from the kernels, `mix.ts`, the adapters or `execute.ts`): **1,200 generated boards** with a random pair of the 112 items (the result the real resolver wrote, the ingredients consumed, the targets, every stream-4/5/6 draw in order, the gauge, the rank, the learn bit, "Mix failed!" with no draw when nobody is left); the 64 results all reachable; pairs the data never had; the menu's pairs and the picker's shape; the default roll; the starting bag; a steal, a refund and a spend at the cap; the monster exemption; the Spare Change pay |
| `data-ffx-command-records`, `ffx-unread-riders`, `ffx-overdrive-pickers` and the others | updated only where a count moved (462 to 483 abilities, 460 to 481 records, 148 to 152 shatter additions); the existing Mix tests pass unchanged |
| `tests/fixtures/parity/ffx/evrae-gaze-classes.json` (read by `re-parity-ai-evrae.test.ts`), `tests/unit/engine/r38-telegraph-hold.test.ts` | the two failures the whole-suite run found that were not art (commit `d6b97cc0`): the Evrae counter's class table wants every shipped record, so the 21 new ones (0x308d, 0x3091 to 0x3093, 0x3095, 0x3098, 0x309a to 0x30a8) join it with class 0 (their formula byte is 9, by the note's rule; the other 417 entries agree with `command_records.json` cell by cell, checked before adding); the family test counted exactly 43 `mix-*` ids and now counts 64 (all 21 new ids start with `mix-`, so the one `od-mix` painting serves them) |

Mutation check (`D:\Tools\ffx-parity\rc7-mix\mutate.mjs`, 52 one-rule changes of the production code, each run against the three Mix test files, the file put back byte for byte after every one):

**51 of 52 caught.** The survivors are listed with the reason below the table.

| Mutant | Rule it breaks | Result | Caught by |
|---|---|---|---|
| `bag-cap-100` | H5: a stack stops at 99 | caught | bag, engine-mix |
| `bag-large-removal` | H5: a removal larger than the stack is refused whole | caught | bag |
| `bag-empty-id` | H5: an emptied stack has its id set to 0xff | caught | bag, mix |
| `bag-new-stack-cap` | H5: a new stack takes the delta cut to 99 | caught | bag, engine-mix |
| `bag-free-slot-id0` | H5: a slot with id 0 is free | caught | bag |
| `bag-bit-swapped` | H5: obtained for a gain, lost for a loss | caught | bag, mix |
| `bag-id-range` | H5: only ids 0x2000 to 0x2fff | caught | bag |
| `bag-gain-needs-free` | H5: a full bag refuses a new item | caught | bag |
| `bag-wrap` | H5: the sum wraps at 32 bits | caught | bag |
| `deduct-monster-first` | H5: monsters 0x14 to 0x1b are exempt | caught | bag, engine-mix |
| `deduct-monster-count` | H5: eight monster indices | caught | bag |
| `deduct-mix-stops` | H5: a Mix in a slot stops the walk | caught | bag |
| `deduct-low-byte` | H5: only the low byte of the user is read | caught | bag |
| `gil-pay-partial` | H7: a pay that the gil does not cover pays nothing | caught | bag, engine-mix |
| `gil-add-cap` | H7: the add caps at 999,999,899 | caught | bag |
| `gil-pay-clamp` | H7: the pay clamps at 999,999,999 | caught | bag |
| `mix-one-deduction` | H3: one of each ingredient is deducted | caught | engine-mix, mix |
| `mix-item-command-counts` | H3: the Item command is not an ingredient | caught | engine-mix, mix |
| `mix-mix-command-counts` | H3: the Mix command is not an ingredient | caught | engine-mix, mix |
| `mix-three-ingredients` | H3: only the first two ingredients are kept | caught | mix |
| `mix-learn-no-target` | H3: a result is learned only when a target was found | caught | engine-mix, mix |
| `mix-learn-one-ingredient` | H3: a result is learned only with two ingredients | caught | mix |
| `mix-learn-bit` | H3: the learn bit is (id - 0x60) and 15 | caught | engine-mix, mix |
| `mix-ret-inverted` | H3: a mask of 0 returns 1 | caught | engine-mix, mix |
| `mix-low12` | H1: the index is the low 12 bits of the id | caught | mix |
| `mix-loading-guard` | H3: while the table loads the resolver waits | caught | mix |
| `mix-flat-fallback` | H1: a row past 111 falls to row 0 | caught | mix |
| `mix-one-ingredient-result` | H3: one ingredient becomes a plain use of that item | caught | mix |
| `mix-target-word` | H2: the target rule of the first result | caught | mix |
| `eng-side-from-command` | H3: the auto-target takes the side from the result | caught | engine-mix |
| `eng-pick-stream` | H3: the picks are the draws the auto-target asks for | caught | engine-mix |
| `eng-write-back` | H3: both ingredients are consumed | caught | engine-mix |
| `eng-failed-check` | H3: a Mix that found nobody fails | caught | engine-mix |
| `eng-group-target` | H3: the targets are exactly the auto-target pick | caught | engine-mix |
| `eng-failed-rank` | H3: the delay of a failed Mix | caught | engine-mix |
| `eng-failed-message` | H3: the failure message | caught | engine-mix |
| `eng-failed-spends-gauge` | H3: a Mix that found nobody spends no gauge | caught | engine-mix |
| `eng-aim-from-command` | H3: a Mix is aimed by the game, not by the command | caught | engine-mix |
| `eng-chart-in-shape` | H1: the engine resolves the pair through the chart | caught | engine-mix |
| `eng-registry-chart` | H1: the registry answers from the chart first | caught | engine-mix |
| `eng-pairs-double` | H4: the same item twice needs two in stock | caught | engine-mix |
| `eng-pairs-empty-stack` | H4: an empty stack is no ingredient | caught | engine-mix |
| `eng-pairs-recipe-filter` | H4: no recipe filter | caught | engine-mix |
| `eng-steal-uncapped` | H5: a steal goes through the bag and stops at 99 | caught | engine-mix |
| `eng-setup-uncapped` | H5: the starting bag stops at 99 | caught | engine-mix |
| `eng-user-index` | H5: the bag is charged to the game index of the user (a monster pays nothing) | caught | engine-mix |
| `eng-no-user` | H5: the deduct and refund routine is the one the engine calls | caught | engine-mix |
| `eng-refund-sign` | H5: a refund is +1 | caught | engine-mix |
| `eng-foreign-ids` | H5: an id with no number goes through the kernel | caught | engine-mix |
| `eng-bag-skip-empty` | H5: an empty stack leaves its slot free | **survived** |  |
| `eng-gil-min` | H7: the action runs with the full offer | caught | engine-mix |
| `eng-gil-pay` | H7: a pay the gil does not cover pays nothing | caught | engine-mix |

The first pass (before the three assertions of `c40eea14`) left four survivors: `bag-free-slot-id0` (a count under the id 0), `mix-learn-one-ingredient` (a lone ingredient whose number looks like a Mix result), `eng-gil-min` (the offer reaching the hit in full) and
`eng-bag-skip-empty`. The first three are killed by the assertions added and by the ghost slots the fixtures now carry. **`eng-bag-skip-empty` survives and is an equivalent mutant**: laying a zero-count stack of the engine's map out as a slot instead of leaving it out changes nothing
the kernel can observe, because the kernel already treats a slot with a count of 0 as free; only a map with more than 112 known items could tell the two apart, and the game has exactly 112. A mutant that only the kernel fixtures catch is a rule the engine-level boards cannot reach (the bag's bit arrays,
the corner reads of an id with no row, the wrap of a huge gain).

## 7. The goldens, explained

`ffx-engine-golden`: **18 of 18 digests unchanged, no re-baseline.** `ffx2-atb-golden` and `ff7-golden` pass unchanged. The reason is the measurement in section 8: the shipped line of every chapter never fires Rikku's Mix and never steals a stack past 99 or spends a
stack it does not hold, and the starting bags of the builds are all under 99 per item.

## 8. Measurement (every FFX chapter on the shipped line, 12 and 500 seeds, before and after)

Method: `tests/unit/ffx-parity-measure.test.ts`, `PYREFLY_MEASURE=1`, `maxWorkers=1`. **Before** = `origin/re-parity-rc6-ch2` (`ab57f082`), run in this worktree before any engine change (the measure test had only gained its Mix counter, which touches no engine
number); **after** = the head of this branch (`dceecba9`) for the 500-seed run and for the 12-seed run (a first 500-seed run, made on the wiring commit `91f6696d` before the reaction items were charged to their wearers in `201b2830`, was byte-identical to the base as well; the head's file differs from the base's only by the empty `mixResults` field the measure test now writes on every row, which `compare.mjs` ignores). All eleven FFX chapters were measured at 500 seeds, which covers every chapter whose party can Mix (the Rikku builds of Chapters III, VII, VIII,
XII and XIV, and the rest), and at 12. Raw files: `D:\Tools\ffx-parity\rc7-mix\` (`base-12`, `base-500`, `final-12`, `head-500`, `after-500` for the first run, `mix500`).

**500 seeds** (wins before, after; mean party turns before / after; mean party KOs before / after; Rikku Mix actions per seed before / after; seeds whose outcome, turns or KOs differ)

| Chapter | wins before | wins after | turns | KOs | Mix per seed | seeds that differ |
|---|---|---|---|---|---|---|
| I Seymour Flux | 500 | 500 | 52 / 52 | 0.9 / 0.9 | 0 / 0 | 0 |
| II Yunalesca | 453 | 453 | 157.7 / 157.7 | 13.6 / 13.6 | 0 / 0 | 0 |
| III Braska's Final Aeon | 479 | 479 | 232.1 / 232.1 | 5.4 / 5.4 | 0 / 0 | 0 |
| VII Seymour and Anima | 470 | 470 | 54.7 / 54.7 | 4.7 / 4.7 | 0 / 0 | 0 |
| VIII Evrae | 488 | 488 | 71 / 71 | 0.7 / 0.7 | 0 / 0 | 0 |
| IX Yojimbo | 493 | 493 | 67.4 / 67.4 | 3.9 / 3.9 | 0 / 0 | 0 |
| X Seymour Natus | 483 | 483 | 33.5 / 33.5 | 1.7 / 1.7 | 0 / 0 | 0 |
| XII Seymour Omnis | 462 | 462 | 95.3 / 95.3 | 0.8 / 0.8 | 0 / 0 | 0 |
| XIV Isaaru | 452 | 452 | 38.2 / 38.2 | 2.9 / 2.9 | 0 / 0 | 0 |
| XVII Sin: the Fins and the Core | 437 | 437 | 296.4 / 296.4 | 3 / 3 | 0 / 0 | 0 |
| XVIII Sin: the Face | 500 | 500 | 45.3 / 45.3 | 0 / 0 | 0 / 0 | 0 |

**Not one of the 5500 chapter runs differs in any number** (0 seeds differ), and the 12-seed run, made again on the final head, differs on 0 of 132: wins before to after I 12 to 12, II 12 to 12, III 11 to 11, VII 12 to 12, VIII 12 to 12, IX 11 to 11, X 11 to 11, XII 11 to 11, XIV 11 to 11, XVII 11 to 11, XVIII 12 to 12. Nothing moved, so there is no ablation to make.

**Cause (by reading the lines, not by ablation).** The shipped line of every chapter never fires Rikku's Mix (`meanMixUses` is 0 in all eleven chapters, before and after), no stack in any build passes 99 (the largest start is 45), and a steal that would pass 99
does not occur on a line. The new code is therefore not reached on the line, and the adapter that every item spend now goes through returns the counts the old arithmetic did (the identical seeds are the proof).

**A diagnostic, not a before and after.** To see the Mix code at work in whole chapters, `PYREFLY_MEASURE_FORCE_MIX=1` plays Rikku's Mix (the engine's default roll among the pairs the bag holds) whenever she has a full gauge, in place of the line's pick. It fires in the two chapters whose Rikku
reaches a full gauge (500 seeds each; wins with the shipped line's in brackets):

| Chapter | wins | party turns | party KOs | Mixes fired | which results |
|---|---|---|---|---|---|
| VII Seymour and Anima | 469 (470) | 54.6 (54.7) | 4.8 (4.7) | 15 | panacea 9, mana 2, megalixir 2, mega-mana 1, super-elixir 1 |
| VIII Evrae | 489 (488) | 71 (71) | 0.7 (0.7) | 37 | panacea 21, mana 7, blaster-mine 4, freedom 1, ultra-potion 1, vitality 1, mega-phoenix 1, mega-mana 1 |

Mix fires 0.03 and 0.07 times a seed there (15 and 37 uses in 500 seeds). The win counts differ by one each way (469 against 470, 489 against 488): that is the forced pick standing in for the line's own pick on those turns, not a shift of the rate, and it is a diagnostic only, never a shipped line. The results fired include one of the 21 new ones (Blaster Mine, four times); Panacea is the most frequent because Antidote-class items are what the bag holds most of.

## 9. What the release driver would need for any screen (nothing was built: no screen is mine)

The menu data shape is **stable**: `MixPickerParams` (`inventory`, `ingredients`, `recipes`, `recipeNames`) is the same. What changed is its content: `recipes` now holds a result for **every pair the bag can make** (a bag of 25 kinds sends about 325 pairs
instead of the handful the 43 recipes allowed), so the existing overlay (`ui/ffx/minigames/RikkuMix.ts`) previews a real result for any two picks and never reaches its "? ? ?". A picker redesign (rule 9: a mockup first) would need:

1. **Known or unknown results.** The game records a result as discovered when two ingredients and a target exist (the party-shared array, `rt.mixShared`), but what its menu does with it is unread (note open question 5). If the preview should show only known results, the params need an additive `discovered` list of result ids; the engine has the bits.
2. **What a result will aim at and do.** The side and the target class of each result (`MIX_RESULT_TARGET_WORD`, `kernel/mix-table.ts`) and its power and hits (the ability) are available; the params carry only the name.
3. **A longer list.** The builds carry up to about 27 kinds of item; the overlay keeps the cursor row in view (`keepRowInView`) already.
4. **The empty and the one-ingredient case.** The game turns one ingredient into a plain use of that item and none into nothing; what its menu lets the player confirm is unread (open question 2). The engine keeps its old refusal ("Mix failed!", the gauge kept, the turn kept) for fewer than two ingredients.
5. **The failure beat.** A Mix with nobody to aim at says "Mix failed!" (a system message) and spends the turn; a screen could show it.
6. **A first look at the 21 new results** in a real fight (section 3): the spell effect layer draws their elements; nobody has seen them.

## 10. Open items (none touches a boss or party number)

1. **The delay of a Mix that finds nobody** is not established (note open question 11): the damage routine that writes the rank byte is skipped on that path. `MIX_FAILED_RANK = 6` (the result's own rank; the repo's research says only that the Mix "still delays Rikku") is a named stand-in. It has never fired on a shipped line.
2. **The monsters' group numbers** of our chapters are unread (note open question 4): the engine puts every combatant of a side in group 0, so a group result takes the whole side, with its one stream-5 draw. A chapter with two enemy groups would differ.
3. **Copycat** stays decompiled-only (H6).
4. **`addGil`** (the gil add cap) has no engine caller (H7).
5. **The single-ingredient and no-ingredient Mix** (what the menu allows) is unread (note open question 2); the engine refuses both as before.
6. **The deduction happens at execution, not at queue time**: the same stock at the same moment for anything the player can see, but the loss of a queued item when its user dies, and the refund of an action dropped at the range check, are not modelled.
7. **Mirrors.** None found: no tactic, advisor or estimate models Rikku's Mix or the bag (a search of `src/engine/tactics`, `ffx/estimate.ts`, `ffx/intent.ts`, `simulate.ts` for the Mix, the recipe table and the inventory; the advisor reads `state.flags['inventory:<id>']`, which the adapter still writes). **Stale, not changed**:
   `research/ffx-combat-core.md` 5.9 below its new pointer (the 43 rows stay true as examples; "one confirmed recipe per result" and the skipped families are corrected in `research/re-ffx-mix.md`); the prose of `src/data/ffx/mixes/abilities-*.ts` that counts "43"; `docs/ENGINE-API.md` if it describes `mixResult` as a pure recipe lookup.
8. **The overlay's own comment** (`RikkuMix.ts`: "`resultAbilityId: null` for an unknown pair") describes a case the engine no longer produces for real items.
9. **Measure tooling**: `ffx-parity-measure.test.ts` counts the Mix actions per seed (`meanMixUses`, `mixResults`) and has a diagnostic `PYREFLY_MEASURE_FORCE_MIX=1` that plays Rikku's Mix whenever she can.

## 11. Decisions for Bailey

1. **How long a Mix with nobody to aim at should delay Rikku** (open item 1): keep 6, or read the rank byte's value on that path (a live check or a deeper read). It does not occur in any fight we ship.
2. **Whether the Mix picker should show every pair's result or only discovered ones.** The game's rule is unread. Either needs a mockup (rule 9) and is the release driver's screen.
3. **Auto-resolved Mixes** (an AI or a headless run, `rollDefaultMinigame`) pick a random pair of the bag. With the whole chart that is a random one of 64 results, useful or not. Keep the stand-in, or make auto-resolve choose the best available (new behaviour: a yes, rule 10).
4. **Copycat and the other latent rows**: leave them latent, or add a build that offers Copycat (content, rule 10).
5. **The monsters' group bytes**: a read of the formation scripts would settle whether the Grenade family hits every enemy or one group in the chapters that have two groups (none of the lines we ship has).

## 12. Re-run commands (repo root; Node 24; TEMP and TMP on D:)

```
node "D:/Final Fantasy/node_modules/typescript/bin/tsc" --noEmit
TEMP=D:/Tools/ffx-parity/tmp TMP=D:/Tools/ffx-parity/tmp node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run --maxWorkers=2 tests/unit/parity-ffx-mix.test.ts tests/unit/parity-ffx-bag.test.ts tests/unit/parity-ffx-engine-mix.test.ts tests/unit/data-ffx-command-records.test.ts
TEMP=D:/Tools/ffx-parity/tmp TMP=D:/Tools/ffx-parity/tmp node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run --maxWorkers=2 tests/unit/ffx-engine-golden.test.ts tests/unit/ffx2-atb-golden.test.ts tests/unit/ff7-golden.test.ts
PYREFLY_MEASURE=1 PYREFLY_MEASURE_SEEDS=1-500 PYREFLY_MEASURE_OUT=out.json node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run --maxWorkers=1 --testTimeout=3000000 tests/unit/ffx-parity-measure.test.ts
PYREFLY_MEASURE_FORCE_MIX=1 PYREFLY_MEASURE=1 PYREFLY_MEASURE_SEEDS=1-12 PYREFLY_MEASURE_OUT=out.json node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run --maxWorkers=1 --testTimeout=3000000 tests/unit/ffx-parity-measure.test.ts
node tools/orphans.mjs
```
Tooling outside the repo (`D:\Tools\ffx-parity\rc7-mix\`): `export-g05.py` re-exports the four fixtures from the real machine code (`D:\Tools\ffx-parity\venv\Scripts\python.exe -I export-g05.py`); `gen-chart.mjs` and `gen-abilities.mjs` regenerate `kernel/mix-table.ts` and
`abilities-ordnance-2.ts` from the note's tables and the repo's record fixtures; `mutants-def.mjs` + `mutate.mjs` run the mutation pass; `compare.mjs base.json after.json` prints the measurement tables.

## 13. Final checks

Run on the head of this branch (the merge `dceecba9`; the commit with this note changes only this file), 2026-10-14, TEMP and TMP on D:, `--maxWorkers=2`, nothing started that needed stopping (no dev or preview server, no browser).

| Check | Result |
|---|---|
| `tsc --noEmit` (by path, the whole project) | clean, exit 0 |
| The lane's tests and the three goldens: `parity-ffx-mix` (17), `parity-ffx-bag` (20), `parity-ffx-engine-mix` (14), `data-ffx-command-records` (19), `ffx-engine-golden` (18 digests), `ffx2-atb-golden` (6), `ff7-golden` (3) | 7 files, **97 tests, all pass**; the FFX digests are the ones on the base, no re-baseline |
| Unchanged by this branch, as the brief asks | `git diff origin/re-parity-rc6-ch2..HEAD` has no line under `src/battle/ffx2`, `src/data/ffx2`, `tests/unit/ffx2-atb-golden.test.ts` or `tests/unit/ff7-golden.test.ts` |
| `node tools/orphans.mjs` | 36 orphaned, the same count as the base; none of this lane's modules is one |
| Files under 400 lines | yes: `execute.ts` 371 (it was 378), `kernel/mix-table.ts` 302, `mix.ts` 106 |
| Measurement on this head, 11 chapters x 500 seeds (`head-500.json`, 540 s) and x 12 seeds | 0 of 5,500 and 0 of 132 seeds differ from `origin/re-parity-rc6-ch2` in outcome, party turns or party KOs (section 8) |
| Mutation pass | 52 one-rule changes of the production code; 51 caught, 1 equivalent survivor (section 6) |

**The whole suite, once** (`D:\Tools\ffx-parity\rc7-mix\suite.json` and `suite.log`): 1,166 files, 17,687 tests, about 57 minutes, started at 13:21 EDT on `c40eea14`, the head after the last code commit of the wiring. 17,358 tests passed and 214 failed, in 32 files. They sort as follows.

1. **22 files are the art-only set** a worktree has without `public/art` (an ENOENT on `public/art/...` or `public/art/manifest.json`, an `existsSync` of a plate, or a face-crop row measured against a painting on disk). The same 22 the RC6 handoff lists for its own run: `ui-portrait-face-crop` (145 tests), `art-ref-defaults` (4), `pause-remake` (3), `chapter-meta` (file), `chapter-meta-evrae` (3), `chapter-meta-ffx2-leblanc` (2), `chapter-meta-seymour-anima-macalania` (3), `cutscene-story-poses` (1), `party-face-manifest` (file), `chapters/chapters-6-7-8-enemy-sprite-manifest` (file), `chapters/den-of-woe-ship-content` (3), `chapters/den-of-woe-ship-scene` (1), `chapters/experiment-scene` (1), `chapters/fallen-aeons-ship-content` (2), `chapters/fallen-aeons-ship-scene` (1), `chapters/isaaru-ship` (3), `chapters/leblanc-art` (2), `chapters/leblanc-party-sprites` (file), `chapters/natus-ship-content` (2), `chapters/natus-ship-scene` (2), `chapters/trema-ship-content` (4), `chapters/yojimbo-content` (file).
2. **2 files were real failures caused by the 21 new results, found by this run and fixed in `d6b97cc0`** (they pass now, section 6): `re-parity-ai-evrae` (its class table lacked the 21 new records) and `engine/r38-telegraph-hold` (it counted exactly 43 `mix-*` ids).
3. **8 files are load timeouts, not failures of the code**: `advisor`, `advisor-floor`, `advisor-menu`, `advisor-note`, `advisor-degenerate-boards`, `chapters/sin-fins-core-bench`, `chapters/sinspawn-gui-bench` and `chapters/sinspawn-gui-rules`. Every failure message in them is "Test timed out in 15000 ms" (60,000 and 180,000 for two), on a machine other lanes were also using; the suite ran with the default timeouts, the RC6 run with `--testTimeout=60000` or more. **Run alone on the final tree, the 8 files and the 2 fixed ones all pass: 10 files, 195 tests passed, 2 skipped.**

No second whole-suite run was made: after the one above, this branch changed two test-side files (the fixture and the family test, both in the isolated run above) and merged one docs-only commit.

## 14. CHANGELOG paragraph (plain words; for the main session to paste, not edited into `CHANGELOG.md` here)

**FFX only.** Rikku's Mix now works the way the real game's does. Any two items make something: the game has a result for every one of the 6,328 pairs, so the Mix list shows what each pair will make instead of a handful of known recipes, and the 21 Mixes that were
missing are in (Pineapple, Blaster Mine, Hazardous Shell, Calamity Bomb, Heat Blaster, Brimstone, and the ice, thunder and water families from Snow Flurry to Dark Rain). Both ingredients are used up the moment the Mix goes off, a Mix with nobody to aim at costs
the ingredients but not Rikku's Overdrive, and who a Mix lands on is chosen as the game chooses it (one random member for the single-target ones, a whole side otherwise). Stacks of items now stop at 99 wherever they grow, a stolen item and a refund included,
and a Spare Change offer is paid in full or not at all. Nothing about any boss or party member's numbers changed.

