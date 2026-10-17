# Re-parity RC9, lane FFX-M: kill rewards by the game's own rolls (FFX only)

**Branch `re-parity-rc9-ffx-rewards`** (from `origin/r49-rc` f939b87f; pushed, not merged, not deployed). **Game case: FFX only** (FFX-2 has its own kill-reward routine, lane X2-C; nothing here is read by the FFX-2 engine).
Owner: Bailey. His order, 2026-10-08: "It needs to be a 1:1 parity." For this area the RE session's reading (addendum Q14, `wiring-plan-addendum-2026-10-13.md` lane FFX-M row M1): **yes** for items, gil and AP as the game's rolls, after a
before/after table of item totals; **no** to gear drops. Plan on paper first: [re-parity-rc9-ffx-rewards-review](../plans/re-parity-rc9-ffx-rewards-review.md). Contract entry: `docs/CONTRACT-CHANGES.md`, 2026-10-16.

## The three states (what is true of each piece)

| Piece | Decompiled and proven | Wired into the engine | Live |
|---|---|---|---|
| The kill-rewards routine (AP into 18 slots, gil with Gillionaire, two item slots on streams 10 and 11, the overkill list, Distill spheres, the bribed monster's two draws, the gear roll's draw) | yes: `kernel/drops.ts` (FFX.exe 0x007990d0); 1,980 captured runs replay in `parity-ffx-steal-rewards.test.ts`; FFX-H02 ran it on all 361 real records, 21,780 runs, 0 mismatches | **yes, on this branch** (`adapt/loot.ts`, called at each monster's death) | **no** |
| The AP award (`kernel/ap-award.ts`) and the exit's settle (`kernel/drops.ts#settleAp`, FFX-G10 row 9) | yes | **the award yes** (the 18 slots' totals, Double, Triple and No AP, Gillionaire); **the settle as the engine's existing rule**: `results.ts#earnedAp` already gives nothing to a member who never acted or is dead or petrified at the end, which is what `settleAp` restores, so `settleAp` is not called separately (the lane's reading; the rule was left as it was) | **no** |
| The 43 monsters' loot records (numbers read from the game's own monster files) | yes: read twice, two scripts, 361 records x 31 fields, 0 differences | **yes** (`data/ffx/loot/records.ts`) | **no** |
| The gear drop (`kernel/gear-drop.ts`; 247 captured gear rolls replay in `parity-ffx-steal-rewards.test.ts`) | yes | **no, by Bailey's answer**: the roll's one stream-10 draw is made, a hit is counted, no piece is made, streams 12 and 13 are not drawn | **no** |
| The Bribe command (and so the bribed-monster branch's setter) | the branch yes | the branch yes (`ActorRuntime.bribed`); **the command is not in the engine** (lane FFX-N, N1), nothing sets the marker | **no** |

Nothing of this is live: no deploy was made, none is asked for. A deploy needs the release driver's cycle and Bailey's own override words while the deep review is owed.

## What changes, in player words

- **Every kill pays at once, the way the game does.** A monster's gil, its AP and up to two items are worked out when it dies, not summed at the end. The numbers are the game's, read from the game's own monster files.
- **Gil, AP and Sphere Levels come out exactly as before in all thirteen chains** (the eleven listed chapters and the two hidden ones; 500 seeds each; the same wins, the same turns, the same totals to the digit; section "Measurements"). The wiring changes what is rolled, not how any fight is played.
- **Items change in four chapters** (the before/after table below): Seymour at Macalania now leaves a **Special Sphere one time in eight** in place of his Blk Magic Sphere (the game's rare entry, which the older table left out); **Seymour Natus now leaves two Lv. 2 Key Spheres, four on an Overkill**
  (the older table left them out for want of an item row; the game's record names them); **Seymour Omnis leaves two Lv. 3 Key Spheres one time in eight**, not one; the Ronso brothers' Friend Sphere is the same one time in eight, rolled the game's way.
- **Equal items stack in the list**, as the game's reward list stacks them (one entry "Ability Sphere x3", at most eight stacks of 99). The results screen already added equal items, so it prints what it printed; the screen is not touched.
- **Latent, switched on by gear nobody wears yet:** Gillionaire doubles each kill's gil while a living member in the battle wears it; Double, Triple and No AP change that member's own AP (and so his Sphere Levels). **Reachable now:** a Distiller item (Power, Mana, Speed, Ability) used on a monster turns its drop into the matching sphere (tested); the four Extract skills carry the same bit in their command records and go through the same status step (not separately tested).
- **Not changed:** the results screen (no new layout; per-member AP on screen is the release driver's mockup item), gear drops (none), the Bribe command (not in the engine), the bag.

## How it is built

| Part | File | What it is |
|---|---|---|
| Data | `src/data/ffx/loot/records.ts`, `index.ts` | 43 loot records as numbers (chunk 4, 0x118 bytes, of `battle/mon/_mNNN/mNNN.bin` in `FFX_Data.vbf`), each with a `source` (file, chunk, 16-digit digest of the 0x118 bytes); `lootRewards(file, base, writes?)` builds a monster's `EnemyRewards` from its record, the summary fields (`ap`, `apOverkill`, `gil`, `drops` with `ItemDrop.rare`) derived from it; four Sphere Grid item rows the records name (`items/spheres.ts`: Lv. 2 Key, Power, Mana, Speed Sphere) with their command records (`command-records/items.ts`, the game's rows) |
| Contract | `src/battle/common/types.ts` | `FfxLootRecord`, optional `EnemyRewards.loot` (additive; CONTRACT-CHANGES) |
| Adapter | `src/battle/ffx/adapt/loot.ts` (288 lines) | `payKill(ctx, victim, killer?)`: the record, the overkill mark, the Distill bits, the Bribe marker and the 18 slots' states handed to `kernel/drops.ts#rollDrops`; the reward struct (`RewardLedger`) kept in `FFXRuntime.rewards`; a hand-built enemy with no record turned into one |
| Hooks | `hp.ts` (+4 lines: 396 of 400) | `koActor` pays after the KO event; `ejectActor` pays an Eject or a shatter once (the death check's kind 2), a banish and a corpse pay nothing |
| Results | `results.ts` | reads the struct once when the battle is won; each member's Sphere Levels come from his own total |
| Status | `adapt/status-apply.ts` | a Distill bit that lands is kept on the monster (`ActorRuntime.distill`) |
| Gui | `ai/sinspawn-gui-rules.ts` | the arms' AP and gil are no longer banked in `state.flags` when they grow back; every death pays at once (same totals) |
| Clones | `setup.ts`, `simulate.ts`, `intent.ts` | the record travels with the combatant; a dry run copies the struct |
| Streams | `adapt/streams.ts` (doc), `parity-ffx-rng-streams.test.ts` | the registry lists the kill rewards on 10 and 11 (shared with Steal); a test pins the order 10, 11, 10, 10 and no draw on the engine-side stream |

**The draws.** One kill is, in order: for each of the two item slots a stream-10 draw `% 255` against the slot's chance byte and, on a success, a stream-11 draw whose low byte below 0x20 (one in eight) takes the rare entry; then one stream-10 draw for the gear roll.
A bribed monster draws twice on its killer's own mode-0 stream instead of the item slots, then the gear roll. Nothing draws 12 or 13 (the gear generator is not wired). **These are the streams `steal.ts` uses, so every steal that follows a kill in the same battle sees a different value than before.**
The measurement below shows no consequence on the shipped lines (every play's log is otherwise identical; they steal only in Macalania, before the first kill).

## Sources

- The game files: `FFX_Data.vbf`, Steam build 25501027, read only, with the project's own reader (`vbf.py`), `python -I`; the layout of the monster file and of its loot record is the private note FFX-H02 section 3.1; the routine is FFX-H02 3.5, FFX-G02 3.1 (step 14) and FFX-G10 3.4 and 3.5; the Gui scripts' writes are `research/re-ffx-ai-gui.md` 2.3 and 3.3 (read again from the script dumps: the only scripted writes to the loot properties among the shipped monsters are the Gui body's, head's and arms').
- How the monster files were read: `research/re-ffx-biran-yenke.md` (`origin/re-ffx-biran-yenke`) and its tools; the earlier dumps of every monster script under `D:\Tools\ffx-parity\ai\ffx-yunalesca-bfa\allmon\`; `research/re-ffx-dark-aeons.md` (`origin/re-ffx-dark-aeons`) for the Dark Aeons.
- The 43 files: m106, m117, m119, m124-m127, m130-m132, m134-m143, m149, m160, m161, m163-m169, m173, m174, m176, m178-m180, m248, m249, m254, m266, m284, m287, m288 (list and names in `records.ts`). Scratch: `D:/Tools/ffx-parity/rc9/ffx-rewards/` (`read_loot.py` reads all 361; `crosscheck_h02.py`: 0 differences against FFX-H02's table).

## Measurements

**Harness.** `tests/unit/ffx-rewards-measure.test.ts` (new; gated by `PYREFLY_MEASURE=1`, with `PYREFLY_MEASURE_SEEDS=1-500` and `PYREFLY_MEASURE_OUT=<file>`): the shipped `intendedStrategy` plays each chapter's whole chain through the app's own wiring (the same as `ffx-parity-measure.test.ts`) and the file reads only the public
`BattleResult` and the event log, so **the same file ran on the base** (`origin/r49-rc` f939b87f, exported into a scratch folder) **and on this branch**. Thirteen chains: the eleven listed FFX chapters and the two hidden ones (Sinspawn Gui; Biran and Yenke). Seeds 1 to 500, so 6,500 plays on each side. Means and totals are over the won runs (a lost run pays nothing, as before).
The raw files are in the lane's scratch folder, `D:/Tools/ffx-parity/rc9/ffx-rewards/` (`before-500-d.json`, `after-500-d.json`, `w1-12-before.json`, `w1-12-after.json`).

### Outcome identity: 12 seeds, then 500

**12 seeds, every listed FFX chapter, the standard harness `ffx-parity-measure.test.ts`, base against branch: the two result files are equal as JSON**: the same win or loss on every seed and the same party turns, engine turns, party KOs and Mix uses on every seed.

| Chapter | wins of 12 | per-seed outcomes (W won, L lost) | mean party turns | mean engine turns | mean party KOs |
|---|---|---|---|---|---|
| seymour-flux | 12 | WWWWWWWWWWWW | 53.3 | 73.2 | 1.1 |
| yunalesca | 12 | WWWWWWWWWWWW | 148.5 | 210.7 | 12 |
| braskas-final-aeon | 11 | WWLWWWWWWWWW | 240.1 | 386.2 | 5.5 |
| seymour-anima-macalania | 12 | WWWWWWWWWWWW | 54.2 | 87.9 | 4.8 |
| evrae-airship | 12 | WWWWWWWWWWWW | 70.9 | 88.6 | 0.7 |
| yojimbo-cavern | 11 | WWWWWWWWWWLW | 65.3 | 92.5 | 3.6 |
| seymour-natus | 11 | WWWWWLWWWWWW | 35 | 51.5 | 2.4 |
| seymour-omnis | 11 | WLWWWWWWWWWW | 91.5 | 124.3 | 0.8 |
| isaaru-via-purifico | 11 | WWLWWWWWWWWW | 37.6 | 83.3 | 3 |
| sin-fins-core | 11 | WLWWWWWWWWWW | 310 | 395.7 | 1.7 |
| sin-face | 12 | WWWWWWWWWWWW | 45.5 | 50.5 | 0 |

**500 seeds, all thirteen chains.** The per-seed win or loss strings are equal in every chain, and **every per-seed field other than the item list is equal across all 6,500 plays**: outcome, links, party turns, gil, AP, Sphere Levels, kills, overkills, and a digest of the whole event log of every link with the result's `drops` taken out (the "log of every play" column). Nothing a player does or sees in a fight moved; only the list of items at the end changed, and only in four chains
(the item list differed on 53 of 500 seeds in Macalania, 483 in Natus, 63 in Omnis and 183 in Biran and Yenke; every other seed's list is equal).

### Before / after: gil, AP, Sphere Levels, kills, overkills, and the gear the game's roll would have dropped (500 seeds; per won run; before / after)

| Chapter | wins (before / after) | per-seed outcomes | log of every play, drops taken out | gil / win | AP / win | Sphere Levels / win | kills / win | overkills / win (share of kills) | gear pieces the game would drop / win (record only) |
|---|---|---|---|---|---|---|---|---|---|
| I Seymour Flux | 500 / 500 | identical | identical | 6000 / 6000 | 10130 / 10130 | 36.36 / 36.36 | 5.45 / 5.45 | 0.03 (0) / 0.03 (0) | 1 |
| II Yunalesca | 453 / 453 | identical | identical | 9000 / 9000 | 14000 / 14000 | 21.93 / 21.93 | 1 / 1 | 0 (0) / 0 (0) | 1 |
| III Braska's Final Aeon (7 links) | 479 / 479 | identical | identical | 0 / 0 | 0 / 0 | 0 / 0 | 9.11 / 9.11 | 0 (0) / 0 (0) | 0 |
| VII Seymour, Guardians, Anima | 470 / 470 | identical | identical | 8600 / 8600 | 5825.74 / 5825.74 | 42.05 / 42.05 | 4 / 4 | 0.67 (0.17) / 0.67 (0.17) | 4 |
| VIII Evrae | 488 / 488 | identical | identical | 2600 / 2600 | 5433.2 / 5433.2 | 40.12 / 40.12 | 1 / 1 | 0.01 (0.01) / 0.01 (0.01) | 1 |
| IX Yojimbo | 493 / 493 | identical | identical | 0 / 0 | 0 / 0 | 0 / 0 | 1 / 1 | 0 (0) / 0 (0) | 0 |
| X Seymour Natus | 483 / 483 | identical | identical | 3500 / 3500 | 8334.78 / 8334.78 | 48.51 / 48.51 | 1 / 1 | 0.65 (0.65) / 0.65 (0.65) | 1 |
| XII Seymour Omnis | 462 / 462 | identical | identical | 12000 / 12000 | 24000 / 24000 | 3 / 3 | 1 / 1 | 0 (0) / 0 (0) | 1 |
| XIV Isaaru's three aeons | 452 / 452 | identical | identical | 0 / 0 | 5000 / 5000 | 12 / 12 | 3 / 3 | 2 (0.67) / 2 (0.67) | 0 |
| XVII Sin: fins and core (3 links) | 437 / 437 | identical | identical | 40000 / 40000 | 57337.1 / 57337.1 | 1.93 / 1.93 | 4 / 4 | 0.57 (0.14) / 0.57 (0.14) | 4 |
| XVIII Sin: the face | 500 / 500 | identical | identical | 12000 / 12000 | 20000 / 20000 | 0 / 0 | 1 / 1 | 0 (0) / 0 (0) | 1 |
| Sinspawn Gui (hidden, 2 fights) | 496 / 496 | identical | identical | 4278.23 / 4278.23 | 830.17 / 830.17 | 17.43 / 17.43 | 9.91 / 9.91 | 4.57 (0.46) / 4.57 (0.46) | 1 |
| Biran and Yenke (hidden) | 500 / 500 | identical | identical | 3000 / 3000 | 9000 / 9000 | 12 / 12 | 2 / 2 | 0 (0) / 0 (0) | 2 |

### Before / after: item totals (500 seeds; totals and means over the won runs)

| Chapter | item | total over the won seeds, before | after | per win, before | after | wins that paid it, before | after |
|---|---|---:|---:|---:|---:|---:|---:|
| I Seymour Flux | lv-4-key-sphere | 513 | 513 | 1.03 | 1.03 | 500 | 500 |
| II Yunalesca | lv-3-key-sphere | 453 | 453 | 1 | 1 | 453 | 453 |
| III Braska's Final Aeon (7 links) | (no item) | 0 | 0 | 0 | 0 | 0 | 0 |
| VII Seymour, Guardians, Anima | ability-sphere | 1544 | 1544 | 3.29 | 3.29 | 470 | 470 |
|  | blk-magic-sphere **moved** | 653 | 583 | 1.39 | 1.24 | 470 | 417 |
|  | special-sphere **moved** | 0 | 70 | 0 | 0.15 | 0 | 53 |
| VIII Evrae | blk-magic-sphere | 494 | 494 | 1.01 | 1.01 | 488 | 488 |
| IX Yojimbo | (no item) | 0 | 0 | 0 | 0 | 0 | 0 |
| X Seymour Natus | lv-2-key-sphere **moved** | 0 | 1590 | 0 | 3.29 | 0 | 483 |
| XII Seymour Omnis | lv-3-key-sphere **moved** | 462 | 525 | 1 | 1.14 | 462 | 462 |
| XIV Isaaru's three aeons | (no item) | 0 | 0 | 0 | 0 | 0 | 0 |
| XVII Sin: fins and core (3 links) | hp-sphere | 437 | 437 | 1 | 1 | 437 | 437 |
|  | lv-3-key-sphere | 437 | 437 | 1 | 1 | 437 | 437 |
|  | mp-sphere | 654 | 654 | 1.5 | 1.5 | 437 | 437 |
|  | return-sphere | 470 | 470 | 1.08 | 1.08 | 437 | 437 |
| XVIII Sin: the face | lv-3-key-sphere | 500 | 500 | 1 | 1 | 500 | 500 |
| Sinspawn Gui (hidden, 2 fights) | lv-1-key-sphere | 2757 | 2757 | 5.56 | 5.56 | 496 | 496 |
| Biran and Yenke (hidden) | friend-sphere **moved** | 110 | 133 | 0.22 | 0.27 | 107 | 123 |
|  | return-sphere **moved** | 890 | 867 | 1.78 | 1.73 | 497 | 490 |

**Causes, chapter by chapter.** Every row that moved is the loot record saying something the older table did not, or the same one-in-eight roll made on the game's stream:
- **VII, Seymour at Macalania.** The record m124 names a Special Sphere as the slot's rare entry. It came up in 53 of 470 wins (11.3 percent; the game's rare roll is 32 in 256, 12.5 percent, which is 58.8 expected with a standard deviation of 7.2) in place of the Blk Magic Sphere; 17 of those wins overkilled Seymour, which doubles the stack, so 70 Special Spheres in all against
  Blk Magic 653 to 583 (the same 70 fewer). The Guardians' and Anima's Ability Spheres are unchanged (1544); on a win the three of them are one stack ("Ability Sphere x3").
- **X, Seymour Natus.** The record m126 names a Lv. 2 Key Sphere x2 (x4 on an overkill) in the first slot; the older data left it out because the item had no row (its file header said so). 483 wins pay 1590: two a win, four on the 312 wins in which he was overkilled (64.6 percent). New item rows: Lv. 2 Key, Power, Mana, Speed Sphere.
- **XII, Seymour Omnis.** The record m131's rare entry is a Lv. 3 Key Sphere x2 (the common one is x1): 63 of 462 wins (13.6 percent; expected 57.8) paid two, not one (462 to 525).
- **Biran and Yenke.** The same one-in-eight slot (Return Sphere, or a Friend Sphere), now the game's stream-11 draw and not an engine-side byte: 133 Friend Spheres of 1,000 paid items (13.3 percent; 110, 11.0 percent, before; 12.5 percent is expected, a standard deviation of about 1.0 point). The 1,000 items are the same total.
- **Everything else is identical** because the record's rare entry is the same item again (Flux, Yunalesca, Evrae, the Sin fights, Gui) or both lists are empty (Braska's Final Aeon and its line, Yojimbo, Isaaru's aeons).

**Overkill frequency** (the engine's own overkill marks, which the lane did not touch, so the same before and after; the table's "overkills / win (share of kills)"): Seymour Natus is overkilled in 64.6 percent of wins (his drop is x4 then); Macalania 0.67 a win (0.17 of its four kills); Sin's fins and core 0.57 (0.14 of four kills); Isaaru's three aeons 2 of 3;
the Gui fights 4.57 of 9.91 deaths (0.46; the head and the arms die again after each regrowth); Flux 0.03, Evrae 0.01; the rest none. An overkill takes the record's overkill AP and its overkill item list, which in every shipped record is double the normal one (Natus's Lv. 2 Key Sphere x2 becomes x4, the Gui body's x3 becomes x6, Omnis's rare x2 becomes x4, the single items x1 become x2). Macalania's four plain kills pay 5,080 AP (2,000 + 290 + 290 + 2,500, the records'); its overkills lift the mean to 5825.74.

**The draws on streams 10 and 11 move.** The kill rewards roll on the streams `steal.ts` shares, so a steal that follows a kill in the same battle sees a different value than before. **Measured consequence: none.** All 6,500 plays have the same event log with `drops` taken out, so no steal result, and nothing after one, changed in any play. The shipped intended lines use Steal only in Macalania (`engine/tactics/seymour-anima-macalania.ts` robs each Guardian before it attacks, i.e. before the battle's first kill).
That is a statement about these lines, not a proof for all play: a steal after a kill in a hand-played battle sees a different roll than it did on the base, which is the point of paying from the game's stream.

**Gear (record only).** The game's gear roll is made (the stream-10 draw) and a hit is counted (`RewardLedger.gearDrops`) but no piece is made, by Bailey's answer to Q14. With the records' chance bytes (255 for every boss; 30 for the Gui head and arms, whose own scripts zero it, and for the Gui body in its first fight, whose script zeroes it too) the game would have dropped, per won chain, the number in the last column of the first table: Flux 1, Yunalesca 1, Macalania 4 (Seymour, both Guardians, Anima), Evrae 1, Natus 1, Omnis 1, Sin's fins and core 4 (both fins, Genais, the core), the face 1,
the Gui body 1 (the second fight only) and the Ronso brothers 2. Nothing of it reaches the player.

### Chapter XXVII "Dark Mirror" (r50): not on this base

`origin/r49-rc` does not have the Mirror Aeons chapter (id `mirror-aeons`; it is on `origin/r50-release`). So it is not in the tables above. To say what the lane does to it, it was measured on a **scratch merge** (not pushed, not part of this branch): `git archive` of `origin/r50-release`, this lane's `src/` and `tests/` changes laid on it three-way (one conflict, an import line in `runtime.ts`: keep both lines; `tsc` clean), the same measurement file on r50-release alone and on r50-release plus the lane, seeds 1 to 500 and 1 to 12.

| Chapter | wins (before / after) | per-seed outcomes | log of every play, drops taken out | gil / win | AP / win | Sphere Levels / win | kills / win | overkills / win (share of kills) | gear pieces the game would drop / win (record only) |
|---|---|---|---|---|---|---|---|---|---|
| XXVII Dark Mirror | 365 / 365 | identical | identical | 0 / 0 | 28854.8 / 28854.8 | 1.27 / 1.27 | 3 / 3 | 0.43 (0.14) / 0.43 (0.14) | 0 |

| Chapter | item | total over the won seeds, before | after | per win, before | after | wins that paid it, before | after |
|---|---|---:|---:|---:|---:|---:|---:|
| XXVII Dark Mirror | dark-matter **moved** | 1130 | 1096 | 3.1 | 3 | 364 | 365 |
|  | master-sphere **moved** | 121 | 155 | 0.33 | 0.42 | 97 | 123 |

12 seeds (the standard harness): 8 of 12 won, per-seed outcomes LWWWLWWLWWLW, party turns 187, engine turns 238, party KOs 19.2: the two result files are equal.
At 500 seeds the chapter's play, gil, AP and Sphere Levels are identical (the digest too); the 1,251 items keep their total, and the Master Sphere moves from 121 to 155 of them (9.7 to 12.4 percent; the game's one in eight is 12.5), in 97 to 123 of 365 wins.
Until the chapter's records are added the lane pays its Dark Aeons through the hand-built path (a record made from the data's `drops`, rare share 1 in 8); **with the five records added** (m116 the dog's file and m340 to m343, the four Dark Aeons; the patch is `D:/Tools/ffx-parity/rc9/ffx-rewards/merge-r50-darkmirror.patch`, 6 files, made against the merged scratch tree) the 500 seeds are identical to the hand-built path in every per-seed field but the gear count (0 to 3 a win: the records' chance byte 255 on each of its three deaths).

## Tests

New files (all green; each is a gate for the next merge):
- `tests/unit/parity-ffx-loot-data.test.ts`: the 43 records equal an **independent read** (`tests/fixtures/parity/ffx/loot_records.json` is the private note FFX-H02's own parse of the same files, made by a different script) field by field; each row names its source; every enemy of every formation carries the record of the right file (an id-to-file table restated in the test from the research notes) and its listed `ap`, `apOverkill`, `gil` and `drops` are the record's,
  the Gui parts' script writes applied and said; every item number a record names has an id and a row; the facts the older tables lacked are pinned (Macalania's rare Special Sphere, Omnis's rare x2, Natus's Lv. 2 Key Sphere x2/x4, the Ronso rare, chance byte 255 on every first slot).
- `tests/unit/parity-ffx-engine-loot.test.ts`: **1,040 generated deaths** (500 generated fields: real and random records, parties with Double, Triple and No AP and Gillionaire, KO'd, ejected and benched members, an aeon out, overkills, Distill bits, a bribed monster) against an **independent oracle** (`tests/unit/helpers/ffxLootOracle.ts`: the routine restated from FFX-H02 3.5 and FFX-G10 3.4, its logic importing nothing from `kernel/` or `adapt/`; the rig taps the draws through the RNG registry's generator),
  fed the draws the engine really made with their streams and failing on a draw on the wrong stream, one too many or too few: gil, each of the 18 slots' AP, the item stacks, the base AP, the gear roll; the draw order (10, 11, 10, 10; a bribed monster on its killer's stream; never 12 or 13); the paths (a KO pays once, a shatter pays once, a banish and a corpse pay nothing, a part that falls again pays again);
  a hand-built enemy with no record; a dry run does not pay the battle's ledger.
- `tests/unit/parity-ffx-engine-loot-battles.test.ts`: whole battles on the real engine with real records and hand-set thresholds (150 seeds: gil, AP, stacked items, overkills and every member's Sphere Levels from his own total against the oracle; Double, Triple, No AP and Gillionaire worn; a Gillionaire on the bench does not double); **every formation of the data layer (24 on this base) killed in the engine**, plain and with every death an overkill, the result equal to the sum of the independent records;
  a Distiller item (Power, Mana, Speed, Ability) turns the Guardian's drop into the matching sphere and the status goes with the life.
- `tests/unit/parity-ffx-rng-streams.test.ts` (one test added): a monster's death draws 10, 11, 10, 10, never the engine-side stream; the header and the aux test no longer claim a drop model on it.
- `tests/unit/ffx-rewards-measure.test.ts` (gated, skipped in the suite): the measurement above.
- Changed, each with its cause: `ffx-engine-golden.test.ts` (five digests re-pinned, below), `ffx-overkill-drops.test.ts` and `chapters/biran-yenke-rewards.test.ts` (equal items stack: the list is one entry per item), `chapters/sinspawn-gui-rules.test.ts` (no bank: the paid AP and gil are read from the reward struct), `guide-doc.test.ts` (Natus's page lists the Lv. 2 Key Sphere x2 again, as its source page does).

**The kernels replayed against the notes' vectors.** `parity-ffx-steal-rewards.test.ts` (unchanged, green) replays the 1,980 captured runs of the game's own code (252 whole kill-reward rolls, 1,481 AP-award, list-add and settle runs, 247 gear rolls). The lane added no vectors of its own: the roll is proven; this lane proves the wiring and the data. FFX-H02 ran the roll on all 361 real records, 21,780 runs, 0 mismatches (cited in the adapter's header).

**A mutation pass of 32 faults: 32 caught, none survived** (log: `D:/Tools/ffx-parity/rc9/ffx-rewards/mutation.log`, harness `mutate.mjs`): in the adapter (the overkill AP ignored, the Distill bits not passed or kept after death, the gear generator armed, an ejected member earning AP, a benched or dead member counted, Gillionaire not read, Double AP read as Triple, the draw cut to a byte, the gear hit counted on <=, the present set wrong, the Bribe marker ignored, the hand-built overkill list at the normal quantity),
the hooks (a KO or an Eject not paying, a corpse paying again, a banish paying), the result (one member's AP as the battle's, no gil, one added to each stack, Sphere Levels from the headline AP), the status step (the Distill capture dropped), the clone (a dry run sharing the ledger) and the data (a rare entry, a chance byte, a quantity, a gil figure, the summary chance, the Gui script writes, a wrong file). Each fault was applied to the tree, the seven test files that cover the lane run, and the file restored byte for byte.

**Goldens: five of the 18 pinned digests re-pinned in `ffx-engine-golden.test.ts`, the cause written in the test file.** seymour-anima-macalania seeds 1 and 7, seymour-natus seeds 1 and 7, seymour-omnis seed 7. The log carries the whole `BattleResult` in its victory event, so a digest moves when the `drops` list does: Macalania's four entries become two (equal items stack), Natus gains his Lv. 2 Key Sphere x4, Omnis's seed 7 pays its rare x2.
**Proof**: all 22 plays (the 11 chapters, seeds 1 and 7) were replayed on the base and on the branch with every link's log digested with the `drops` keys taken out: all 22 are the same; only these five differ with the drops put back, each by exactly the lists above. `ffx2-atb-golden` and `ff7-golden` were not touched.

**Checks.** `npx tsc --noEmit` is clean (run by path: `node "D:/Final Fantasy/node_modules/typescript/bin/tsc" --noEmit -p .`). `node tools/orphans.mjs`: the base lists 28 orphaned modules and the branch 26; the two that left the list are `kernel/drops.ts` (now imported by `adapt/loot.ts`) and `kernel/gear-drop.ts` (imported by `drops.ts`; it is reached by import only, its branch is never taken because the roll is handed a gear chance of 0).
The three new modules (`adapt/loot.ts`, `loot/records.ts`, `loot/index.ts`) are reachable from `src/main.ts`; none of the 26 remaining orphans is this lane's.
**Review class** (`node tools/critic-plan.mjs --paths ...` on the lane's engine, data and contract files): DEEP. Because the FFX CTB engine, FFX game data and the shared combat core contract (`types.ts`) are shared systems: a focused review of the production candidate before a deploy, then live verification and the deep review on the live build (that build would owe it). Its "games: both" is the contract file's; this change is FFX only (the FFX-2 engine does not read the new field).

**The whole suite, once** (`vitest run --maxWorkers=2` on the lane's tree; 1,270 test files; 44 minutes on a shared machine): 19,602 tests, 19,290 passed, 125 skipped (the gated measurements and the like), 1 todo, **186 failed in 24 files**. Every failure is accounted for:

- **Two files failed because of the lane. Both are fixed and re-run green.**
  1. `tests/unit/data-ffx-command-records.test.ts` (3 tests). The four Sphere Grid item rows the lane added to the catalog (Lv. 2 Key, Power, Mana, Speed Sphere) had no command records, and that test requires one for every item effect and pins the ability counts. Fix: the four records added to `src/data/ffx/command-records/items.ts` exactly as the game's table has them (type, both flag words and damage class 0, rank byte 2, no status bytes; both fixtures checked), and the pinned counts moved from 490 and 488 to 494 and 492, with the cause written in the test.
  2. `tests/unit/parity-ffx-engine-status.test.ts` (1 test, 5,000 generated situations). Where the target monster dies or leaves the field, the engine now also rolls that monster's kill rewards at the death (three more raw draws for this rig's reward-less monster), which the kernels-only oracle does not have. Fix in the test: those three draws are taken off the end of the engine's draw list, only for a monster that was alive and did die or leave (and checked to be there); every other draw, and every situation where nothing died, is compared exactly as before. The draws themselves are proven by `parity-ffx-engine-loot.test.ts`. This one is the visible face of the stream-10 consequence stated above: any test that compares a monster's death against an oracle that knows nothing of loot sees the extra draws.
- **22 files failed for art only** (this worktree has no `public/art`, which is gitignored and local to the main tree): `art-ref-defaults`, `chapter-meta`, `chapter-meta-evrae`, `chapter-meta-ffx2-leblanc`, `chapter-meta-seymour-anima-macalania`, `cutscene-story-poses`, `party-face-manifest`, `pause-remake`, `ui-portrait-face-crop` (145 tests) and, under `chapters/`, `chapters-6-7-8-enemy-sprite-manifest`, `den-of-woe-ship-content`, `den-of-woe-ship-scene`, `experiment-scene`, `fallen-aeons-ship-content`, `fallen-aeons-ship-scene`, `isaaru-ship`, `leblanc-art`, `leblanc-party-sprites`, `natus-ship-content`, `natus-ship-scene`, `trema-ship-content`, `yojimbo-content`: 182 failing tests plus five files that cannot load at all (`public/art/manifest.json` is missing).
  Every message is a missing file under `public/art` (`ENOENT`, "Input file is missing", "does not resolve under public/", or an `existsSync` check of an installed painting). **Checked against the untouched base:** the same 22 files run on an export of `origin/r49-rc` (which has no art either) fail with identical test names for 20 of them; `art-ref-defaults` and `pause-remake` could not load in that stripped export at all (it has no `tools/` or `docs/`), so for those two the proof is their own messages (the Lulu and Guado Guardian idle paintings, `backdrops/gagazet.png`, `pause/auron.json`). None touches a battle, a reward or an item.
- **After the two fixes**: `tsc --noEmit` clean; the eleven files of the lane and of the two fixes (183 tests); and a wider re-run of every `data-`, `parity-ffx-`, `ffx-`, item, ability, registry, guide, tactic and strategy test (183 files): 180 passed and 3 skipped (the gated measurements), 4,744 tests passed, none failed.

## Open items

1. **The Bribe command is not in the engine** (lane FFX-N, N1: no build offers it). The reward side is wired and tested through `ActorRuntime.bribed`; nothing sets it, so every shipped monster is paid the ordinary way.
2. **Gear (M2) stays "proven, not wired".** The roll's draw is made, a hit is counted (`RewardLedger.gearDrops`), no piece exists, and streams 12 and 13 are not drawn. If gear ever has a home, `kernel/gear-drop.ts` also needs the record's gear fields (the slot and ability bases and the ability rows), which `FfxLootRecord` deliberately does not carry.
3. **Where the game adds a battle's item stacks to the stock was not found** (FFX-G10 open question 1). The claim here is "paid to the results" only: the list lands in `BattleResult.drops` and the results screen; the app does not bank it into the bag either (as before).
4. **The results screen shows `result.ap` to every eligible member.** With Double, Triple or No AP worn (no build does) a member's own AP differs from it; the screen was not touched (a screen: mockup first, the release driver's item). `sphereLevelsGained` is already per member.
5. **Merging with r50 (Chapter XXVII "Dark Mirror").** One import conflict in `runtime.ts` (keep both lines). Until the five records are added the Dark Aeons are paid through the hand-built path with the numbers above. The saved patch does the rest: records m116 and m340 to m343 into `records.ts`, `dark-aeons.ts` through `lootRewards`, the item numbers 0x2035 (Dark Matter) and 0x2050 (Master Sphere) into `ITEM_ID_OF_NUMBER`,
   their fixture rows, and the new ids into the two tests' file tables and the "43" counts. It was applied to the scratch merge only; whoever merges runs `tsc` and the lane's four test files afterwards.
6. **Guide pages' Drops lines.** Natus's page said "None" and now lists the Lv. 2 Key Sphere x2 (done, with its test). Macalania's page lists "Ability Sphere" only (Seymour's Blk Magic Sphere and his rare Special Sphere are missing) and Omnis's "Lv. 3 Key Sphere (common)" does not name the rare x2: text only, the guide owner's.
7. **Records for the other 318 monsters.** `read_loot.py` reads all 361 and `crosscheck_h02.py` compares them with the note (0 differences); only the 43 the chapters ship are in the repo. At two lines a record, all 361 would be about 760 lines and `records.ts` would have to be split under the 400-line house rule.
8. **A monster with Auto-Life** would be paid after the Auto-Life check here, where the game pays before it (no shipped monster can have it: the extra-immunity word names Auto-Life in all 361 records, per the lane's read). **A self-destruct** (the death check's no-rewards flag) is not in the engine.
9. **The advisor's forecasts** pay into their own throwaway runtime with the policy generator's median draws; the battle's stream positions and ledger are untouched (tested). No forecast shows drops.
10. FFX-G10 open question 7 (the struct after an escape) is unchanged: rewards are paid on a victory only, as before.
11. **Merge hot spots** for whoever joins this branch with the other RC9 lanes: `docs/CONTRACT-CHANGES.md` (every lane adds a top entry: keep both), `src/battle/common/types.ts` (the `EnemyRewards` block: `FfxLootRecord` and `loot?`), `src/battle/ffx/runtime.ts` (import lines), `src/data/ffx/command-records/items.ts` and `tests/unit/data-ffx-command-records.test.ts` (any lane that adds an item adds rows and moves the pinned counts: this lane's are 494 abilities and 492 records), any oracle test that compares a monster's death with draws (it now sees the three stream-10 draws of the kill rewards; `parity-ffx-engine-status.test.ts` shows the fix), and `tests/unit/ffx-engine-golden.test.ts` (the five digests: a lane that moves a play's log or its drops list moves them again; re-derive with the proof above, replay on the base and on the branch with `drops` taken out).

## Decisions for Bailey

None blocks the merge (Q14 covers items, gil and AP; gear is no). For the release note and his eyes:
1. **The before/after table of item totals** (above) is the "table first" Q14 asked for: four chapters' item lists move (Macalania's Special Sphere one time in eight, Natus's Lv. 2 Key Sphere x2/x4, Omnis's rare x2 one time in eight, the Ronso rare rolled the game's way); gil, AP, Sphere Levels and every fight are identical. The release driver shows it to him.
2. **A results-screen row for per-member AP** (Double, Triple, No AP) is a screen: mockup first (hard rule 9); not needed until gear that carries them can be worn.
3. **All 361 records in the repo, or the 43 the chapters ship.** This lane's choice: 43 (data only; the rest as chapters need them).

## CHANGELOG paragraph (FFX only; the release driver adds it, this lane does not edit CHANGELOG.md)

- **FFX:** What a boss leaves behind is now the game's own roll, read from the game's own monster files. Each monster's death pays at once, the way the game does it: its gil (doubled while a living party member in the fight wears Gillionaire), its AP into every character's own running total, and up to two items, each rolled against that monster's own chance, with the game's one-in-eight rare entry, its own list on an overkill, and a Distiller's sphere in place of the item.
  Gil, AP and Sphere Levels come out exactly as before in every chapter (500 seeds each: the same wins, the same turns, the same fights move for move). What changes is the items: Seymour at Macalania leaves a Special Sphere one time in eight in place of his Blk Magic Sphere; Seymour Natus now leaves two Lv. 2 Key Spheres (four on an Overkill), which the older table left out; Seymour Omnis leaves two Lv. 3 Key Spheres one time in eight; the Ronso brothers' Friend Sphere is the same one in eight, rolled the game's way.
  Equal items stack in one line. No gear drops (the roll's draw is made, no piece is given).
