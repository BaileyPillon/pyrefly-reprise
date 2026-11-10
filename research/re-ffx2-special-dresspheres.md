# The Special dresspheres (Floral Fallal, Machina Maw, Full Throttle): how they are reached, what the three parts are, every command, the stats, how the form ends

**FFX-2 only** (a Special dressphere is an FFX-2 idea; nothing here applies to FFX). Written 2026-11-09 for the lane "FFX-2 Special dresspheres" (branch `ffx2-specials`). Records only: this note changes no number in the game by itself; the engine work it feeds is behind the `specialDressUp` switch, **OFF by default** (`src/battle/ffx2/special/`, section 10).

Confidence tags follow `critic/CHECKS.md`: `[verified: the game's tables]` is a number read from the Steam HD build's own kernel tables (build 25501027, `battle/kernel/command.bin`, `job.bin`, `a_ability.bin`; the US text for the names), `[verified: exe]` is a rule read from FFX-2.exe by the earlier RE lanes (`research/re-ffx2-dressphere.md`, addresses there), `[verified: 2 sources]` and `[single source]` are the community sources named, `[estimate]` is ours, `[gap]` is not in any source.

## 0. Method and sources

1. **The game's own tables.** The ladder of each of the nine parts is the sixteen (prerequisite, ability) pairs of its `job.bin` row (ids 0x500f to 0x5017; `src/battle/ffx2/kernel/dressphere-grids.ts#FFX2_JOB_ABILITIES`). Each command's row is `command.bin` id `0x3000 + n` (US text for the name and the help line), the AP is the menu field at row `+0x86` (`kernel/command-menu-rows.ts`), the auto-abilities are `a_ability.bin` rows (AP at `+0xae`, wards from the effect tables, `kernel/ability-effects-data.ts`). The reader is the earlier lane's read-only node VBF reader (`ffx2-abil.mjs`, kept with that lane's tools outside the repository); a script of 2026-11-09 dumped all 99 commands and 5 passives per part, and **the dump is pinned in the repo as `tests/fixtures/parity/ffx2/special_rows.json`** (a numbers-only fixture; `tests/unit/data-ffx2-special-rows.test.ts`).
2. **The executable.** The form's rules (when it is offered, what it does to the record, the stat scale, the pods as child records) are `research/re-ffx2-dressphere.md` sections 1.4 to 1.6, 2.4 to 2.6 and 3 (FFX-2.exe addresses cited there; emulated against the game's own routines).
3. **The community.** FF Wiki (*Dressphere*, *Garment Grid*, *Floral Fallal*, *Great Whirl*; the public MediaWiki API, read 2026-11-09), GamerGuides' *Floral Fallal* page (read 2026-11-09), and what `research/ffx2-combat-core.md` section 3.15 already carries (SinirothX's growth algorithms, the FF Wiki's ability tables, Jegged and GameFAQs reads of 2026-09). Jegged's *Garment Grids: Overview* page was read (2026-11-09; it carries the unlock rule and the Unerring Path remark and says nothing of the stats, the other girls, the accessories or the end of the form). **Not read this pass:** GameFAQs' pages (their server answers this machine's fetch with 403; the repo's earlier reads of them are in combat-core 3.15 and section 8) and any Jegged page on the Specials' own abilities (the encounter guides the repo carries, `research/jegged-encounter-guides-ffx2.md`, have none). Where the community sources disagree with each other and the game's own rows do not settle it, this note recommends GameFAQs' reading (Bailey, 2026-09-25) and says so; in every conflict below the game's rows did settle it, so the game wins.
4. **Forum reports** (search-result snippets of GameFAQs and EyesOnFF threads, 2026-11-09) are used only for the one question no source settles (section 8) and are tagged `[single source]` or weaker.

## 1. What this note corrects in the repo's earlier data

The earlier data (`data/ffx2/abilities/special-*.ts`, `data/ffx2/dresspheres/special/*.ts`) was a trimmed, community-sourced subset of 5 to 6 abilities a part, and **no engine file built the parts**. Against the game's own tables:

| Earlier data | The game's rows |
|---|---|
| 4 to 6 abilities a part, some invented groupings (Machina Maw's pods: Howitzer, Anti-Power Shell, Shellter, HP Repair on one, Blind Shell, Anti-Magic Shell, Booster, MP Repair on the other) | every part has 9 to 13 commands (99 in all): Smasher-R is Howitzer, Sleep, Slow, Anti-Power and Anti-Armor Shell, Scan, Shellter, Protector, HP and MP Repair, Homing Ray; Crusher-L is Howitzer, Blind, Silence, Anti-Magic and Anti-Mental Shell, Booster, Offense, Defense, HP and MP Repair, Homing Ray |
| All-Life listed as the main body's (combat-core) and the Left Pistil's (GamerGuides) | **the main body's** (`job.bin` 0x500f pair `1, 0x3117`) |
| the data's `podA` was Left Pistil (offence) and `podB` Right Pistil (support); the wiki agrees on the roles | the game's job order is **Right Pistil (support, 0x5010) first, then Left Pistil (offence, 0x5011)**, and likewise Smasher-R before Crusher-L and Dextral Wing before Sinistral Wing; `podA` and `podB` now follow the job order, so the pods' child records `3 + 2 * girl + k` are `k` = 0 and 1 (their command lists, section 4, are the wiki's own lists for those names) |
| Buckle Feather DEF Down 4 (FF Wiki) | the row says **DEF Down 2** (status time -2, like every other Feather); the 4 was the wiki's |
| Heat, Ice, Electric and Aqua Whirl as "three hits on random enemies" with a medium charge | confirmed: 3 hits of power 8 (special-magic formula 9), cast cost 80, **no MP**, AP 10, listed from the start |
| Great Whirl `special-magic` | **formula 0** (the Strength base) with the magical damage flag, 12 hits of power 8: the wiki's "large magic damage, though it uses the Strength stat" |
| Wisenen "75 percent of current HP" | formula 4 (percent of current HP), power 12: 12/16 = 75 percent `[verified: the game's tables]` |
| the SDSP stats as the wiki's anchors times a 0.80 to 1.00 "estimate" | the game's own growth rows times `(nodes + 25) / 25` (section 5) |

## 2. How a Special Dress Up is reached

1. **Own the Special.** The party must hold at least one of **her** Special spheres (a signed count in the item table: `VA 0x00dffd1c`, indexed by the job `0x0f`, `0x12`, `0x15`) `[verified: exe]`. Floral Fallal is Yuna's, Machina Maw Rikku's, Full Throttle Paine's (`kernel/spherechange.ts#FFX2_SPECIAL_JOB_OF_GIRL`). Where each is found: Floral Fallal behind a rock on the Djose Highroad (Chapter 2); Machina Maw at the Bikanel Desert oasis (Chapter 2); Full Throttle from Tromell, four talks in the Macalania Woods (Chapter 1 or 2, the only one that can be missed until a New Game Plus) `[verified: 2 sources: FF Wiki Dressphere, combat-core 3.15]`.
2. **Walk the whole grid this battle.** Every dressphere node of her equipped Garment Grid must have been worn (the grid scene's start, `0x005f4800`, tests one bit a node: `0x005eb920`) `[verified: exe]`; the wiki's and Jegged's reading is the same ("accessing all jobs on the grid during one battle", "linking all nodes"; Jegged: "change into every Dressphere on the character's equipped Garment Grid once", then reopen the grid, R1, X) `[verified: 3 sources]`. Every node must also be occupied (a Special cannot be placed in a node) `[verified: 2 sources: combat-core 3.15]`. The walk is the ordinary one: a Change moves her to a dressphere node joined **directly or through exactly one gate node**, crossing the gate marks it (`re-parity-rc9-x2-grids.md`, `kernel/grid-path.ts`, proved on 4,474 vectors) `[verified: exe]`; each Change costs her turn and no MP. The gate bonuses she banked on the way are wiped when she enters the form (below).
3. **Her turn, not Cursed.** The command is on her Change screen (L1 for the grid, R1 for the Special Dress Up, then confirm: combat-core 3.15) `[verified: 2 sources]`; Curse makes every `0x5xxx` command unusable (`0x0061a840`) `[verified: exe]`.
4. **The grid that makes this fast.** *Unerring Path* (2 nodes, no gates) is given with the player's first Special, and "the fewer nodes a Garment Grid has, the sooner its Special Dressphere is ready" (Jegged: Unerring Path needs one spherechange) `[verified: 3 sources: FF Wiki Garment Grid, Jegged, combat-core 3.15]`; the grids of 6 nodes (First Steps, Black Tabard, Blood of the Beast, Chaos Maelstrom, Pride of the Sword, Samurai's Honor, Tricks of the Trade, White Signet) give the strongest main body (section 5).
5. **What entering does to her record** (kernel mode 1, `0x005f51a0`): every node mark (64) and every gate mark (32) is cleared and her gate-ability slots are emptied, **but she stays where she stands**; so a second Special Dress Up in the same battle needs a whole new walk `[verified: exe; 6,000 emulated commits]`. The form itself is committed with the dress to return to remembered (`VA 0x00df5d60 + 4 * girl`).
6. **At the start of every battle** a girl whose record holds a Special is put back into the dress she wore before it, and if the record still holds a Special it becomes her Gunner: **a girl never starts a battle in a Special** (`0x0060b810`, `Return Normal Job` `0x005f58d0`) `[verified: exe]`.

## 3. What the form is

* **The main body is the girl's own record**: the record's dressphere becomes the Special's job (`0x500f`, `0x5012`, `0x5015`) `[verified: exe]`. It keeps her level, her pools (they follow the ratio rule of a dress change: `(oldMax/2 + value * newMax) / oldMax`, a result under 1 for a pool above 0 giving back the old value, exe `0x0060b540`), her statuses, and her gauge.
* **The two pods are the child records** `3 + 2 * girl + k` (Yuna's 3 and 4, Rikku's 5 and 6, Paine's 7 and 8), found by `MsGetPartChr`; **each is a separate battle body with its own HP, its own command menu and its own gauge** `[verified: exe]`. Their jobs are the two ids after the main's (0x5010 and 0x5011; 0x5013 and 0x5014; 0x5016 and 0x5017). In the game's reward and slot tables the party members stand in owner slots 0 to 2 and the pods in 3 to 8 (`adapt/kill-rewards.ts#ownerUnits`).
* **The other two girls leave the field** and come back when the form ends `[verified: 2 sources: FF Wiki Dressphere, combat-core 3.15]`. A girl who was already Ejected is out of the field for the battle whatever the form does; the engine does not park her and does not bring her back (section 10, pick 10). The battle-end evaluation reads **three active party slots** (`kernel/battle-end.ts`: "`party` holds the three active party slots"); in a form those are the three parts, so all three parts down is a defeat, with the parked girls alive and out of the battle (code 3, a defeat in the engine as for an Ejection) `[verified: exe]`.
* **Names** (ours, `data/ffx2/ids.ts#SpecialDresspherePartId`, the wiki's own): Floral Fallal with **Right Pistil** (0x5010) and **Left Pistil** (0x5011); Machina Maw with **Smasher-R** (0x5013) and **Crusher-L** (0x5014); Full Throttle with **Dextral Wing** (0x5016) and **Sinistral Wing** (0x5017) `[verified: 2 sources for the names; the job order is the game's]`.
* **Accessories do nothing in a form**: the recompute adds an accessory's `up_status` "unless the dressphere is a Special", and the garment grid's `up_status` likewise; for a Special the grid instead writes its node count into the six scale slots (`re-ffx2-dressphere.md` 1.4) `[verified: exe]`. Break HP Limit and Break Damage Limit therefore come only from the part's own two passives and the key items (section 6) `[verified: 2 sources]`.
* **No Item and no Escape command** in a Special form (the menu kernel's Special family; `docs/handoff/re-parity-rc7-x2cmd.md` XB7) `[verified: exe]`.
* **A Special part cannot be Ejected**, and that is data, not a rule on top: the Ribbon row every part carries (0x8068) wards Eject at 255 (section 6) `[verified: the game's tables]`; the community says the same `[verified: 2 sources]`.

## 4. Every command of the nine parts

Columns: `AP` is the AP the command needs (the menu row's `+0x86`); `cast` and `ATB` are the row's cast and ATB costs (`costCast`, `costAtb`, the engine's units: the charge is `cast * 10000 / (AGI + 1)` and the recovery `ATB * 10000 / (AGI + 1)`); `formula` is the damage formula number of the row (`kernel/damage.ts`; `special magic` is formula 9, `% of current HP` formula 4, `% of max HP` formula 7); `acc` is the accuracy formula (`always` for none); `status chances` are the row's chance bytes (254 and 255 mean "always, unless the target's resist byte is 255"), with the duration in the game's counter or the number of stage levels; `prerequisite` is the pair's field (`none (free)`: listed from the start without learning; `AP only`: a prerequisite of 1, which is always met, so the command is learned by AP alone; an id: that command first). `[verified: the game's tables]` for every cell; the part order within a Special is the job order. **Pairs that carry the same name on both pods are different rows** (Stamina, Mettle, Reboot on both wings; Howitzer, Homing Ray, HP Repair, MP Repair on both Machina pods).

#### Floral Fallal (Yuna)

**main body (job 0x500f)**

| Command | id | AP | MP | cast | ATB | formula | power x hits | acc | element | target | status chances | prerequisite |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Attack | 0x3030 | 20 | 0 | 0 | 70 | 0 strength/base | 16 x 1 | formula 2 | - | 1 enemy | - | none (free) |
| Libra | 0x3115 | 4 | 0 | 20 | 0 | 0 strength/base | 0 x 1 | always | - | 1 enemy, far | - | AP only |
| Heat Whirl | 0x310f | 10 | 0 | 80 | 0 | 9 special magic | 8 x 3 | always | Fire | random enemies, far | - | none (free) |
| Ice Whirl | 0x3110 | 10 | 0 | 80 | 0 | 9 special magic | 8 x 3 | always | Ice | random enemies, far | - | none (free) |
| Electric Whirl | 0x3111 | 10 | 0 | 80 | 0 | 9 special magic | 8 x 3 | always | Lightning | random enemies, far | - | none (free) |
| Aqua Whirl | 0x3112 | 10 | 0 | 80 | 0 | 9 special magic | 8 x 3 | always | Water | random enemies, far | - | none (free) |
| Barrier | 0x3114 | 20 | 36 | 120 | 0 | 0 strength/base | 0 x 1 | always | - | self | Null Magic 254 for 20 | AP only |
| Shield | 0x3113 | 20 | 36 | 120 | 0 | 0 strength/base | 0 x 1 | always | - | self | Null Physical 254 for 20 | 0x3114 |
| Flare Whirl | 0x3116 | 24 | 64 | 100 | 0 | 9 special magic | 18 x 3 | always | - | random enemies | - | AP only |
| Great Whirl | 0x3118 | 30 | 0 | 120 | 80 | 0 strength/base | 8 x 12 | always | - | random enemies, far | - | 0x3116 |
| All-Life | 0x3117 | 8 | 70 | 100 | 0 | 7 % of max HP | 16 x 1 | always | - | party (can target KO) | Death 254 | AP only |
| *Ribbon* (auto) | 0x8068 | 30 | - | - | - | - | - | - | - | self | wards (see 5.3) | none (free) |
| *Double HP* (auto) | 0x8072 | 20 | - | - | - | - | - | - | - | self | HP +100% | AP only |
| *Triple HP* (auto) | 0x8073 | 30 | - | - | - | - | - | - | - | self | HP +100% | 0x8072 |
| *Break HP Limit* (auto) | 0x800b | 20 | - | - | - | - | - | - | - | self | wards (see 5.3) | key item 63 |
| *Break Dmg. Limit* (auto) | 0x800d | 20 | - | - | - | - | - | - | - | self | wards (see 5.3) | key item 62 |

**Right Pistil (job 0x5010)**

| Command | id | AP | MP | cast | ATB | formula | power x hits | acc | element | target | status chances | prerequisite |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| White Pollen | 0x3119 | 10 | 0 | 80 | 0 | 9 special magic | 16 x 1 | always | - | party | - | none (free) |
| White Honey | 0x311a | 10 | 0 | 100 | 0 | 0 strength/base | 0 x 1 | always | - | party | Regen 254 for 100 | AP only |
| Hard Leaves | 0x311b | 10 | 0 | 80 | 0 | 0 strength/base | 0 x 1 | always | - | party | Shell 254 for 100 | none (free) |
| Tough Nuts | 0x311c | 10 | 0 | 80 | 0 | 0 strength/base | 0 x 1 | always | - | party | Protect 254 for 100 | none (free) |
| Mirror Petals | 0x311d | 10 | 0 | 80 | 0 | 0 strength/base | 0 x 1 | always | - | party | Reflect 254 for 100 | none (free) |
| Floral Rush | 0x311e | 20 | 0 | 120 | 0 | 0 strength/base | 0 x 1 | always | - | party | Haste 254 for 50 | 0x311a |
| Floral Bomb | 0x311f | 10 | 0 | 100 | 0 | 0 strength/base | 18 x 1 | formula 2 | - | all enemies | STR -1 levels (254) | none (free) |
| Fallal Bomb | 0x3120 | 10 | 0 | 100 | 0 | 0 strength/base | 18 x 1 | formula 2 | - | all enemies | DEF -1 levels (254) | AP only |
| Floral Magisol | 0x3121 | 10 | 0 | 100 | 0 | 0 strength/base | 18 x 1 | formula 2 | - | all enemies | MAG -1 levels (254) | 0x3120 |
| Fallal Magisol | 0x3122 | 10 | 0 | 100 | 0 | 0 strength/base | 18 x 1 | formula 2 | - | all enemies | MDEF -1 levels (254) | 0x3121 |
| Right Stigma | 0x3123 | 20 | 0 | 80 | 0 | 0 strength/base | 24 x 1 | formula 2 | - | 1 enemy | - | 0x3122 |
| *Ribbon* (auto) | 0x8068 | 30 | - | - | - | - | - | - | - | self | wards (see 5.3) | none (free) |
| *Double HP* (auto) | 0x8072 | 20 | - | - | - | - | - | - | - | self | HP +100% | AP only |
| *Triple HP* (auto) | 0x8073 | 30 | - | - | - | - | - | - | - | self | HP +100% | 0x8072 |
| *Break HP Limit* (auto) | 0x800b | 20 | - | - | - | - | - | - | - | self | wards (see 5.3) | key item 63 |
| *Break Dmg. Limit* (auto) | 0x800d | 20 | - | - | - | - | - | - | - | self | wards (see 5.3) | key item 62 |

**Left Pistil (job 0x5011)**

| Command | id | AP | MP | cast | ATB | formula | power x hits | acc | element | target | status chances | prerequisite |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Dream Pollen | 0x3124 | 10 | 0 | 80 | 0 | 9 special magic | 18 x 1 | always | - | all enemies, far | Sleep 100 | none (free) |
| Mad Seeds | 0x3125 | 10 | 0 | 100 | 0 | 9 special magic | 18 x 1 | always | - | all enemies, far | Berserk 100 | none (free) |
| Sticky Honey | 0x3126 | 10 | 0 | 100 | 0 | 9 special magic | 18 x 1 | always | - | all enemies, far | Slow 100 for 100 | none (free) |
| Halfdeath Petals | 0x3127 | 10 | 0 | 100 | 0 | 4 % of current HP | 8 x 1 | always | Gravity | all enemies, far | - | none (free) |
| Poison Leaves | 0x3128 | 10 | 0 | 100 | 0 | 9 special magic | 18 x 1 | always | - | all enemies, far | Poison 100 | AP only |
| Death Petals | 0x3129 | 10 | 0 | 100 | 0 | 0 strength/base | 20 x 1 | formula 4 | - | 1 enemy, far | Death 254 | 0x3128 |
| Silent White | 0x312d | 20 | 0 | 120 | 0 | 0 strength/base | 18 x 1 | formula 2 | - | all enemies | Silence 100; Darkness 100 | none (free) |
| Congealed Honey | 0x312c | 20 | 0 | 120 | 0 | 0 strength/base | 18 x 1 | formula 2 | - | all enemies | Stop 100 for 100 | AP only |
| Panic Floralysis | 0x312b | 10 | 0 | 120 | 0 | 0 strength/base | 18 x 1 | formula 2 | - | all enemies | Confusion 100 | 0x312c |
| Ash Floralysis | 0x312a | 10 | 0 | 120 | 0 | 0 strength/base | 18 x 1 | formula 2 | - | all enemies | Petrify 80 | 0x312b |
| Left Stigma | 0x312e | 20 | 0 | 80 | 0 | 0 strength/base | 24 x 1 | always | - | 1 enemy | - | 0x312d |
| *Ribbon* (auto) | 0x8068 | 30 | - | - | - | - | - | - | - | self | wards (see 5.3) | none (free) |
| *Double HP* (auto) | 0x8072 | 20 | - | - | - | - | - | - | - | self | HP +100% | AP only |
| *Triple HP* (auto) | 0x8073 | 30 | - | - | - | - | - | - | - | self | HP +100% | 0x8072 |
| *Break HP Limit* (auto) | 0x800b | 20 | - | - | - | - | - | - | - | self | wards (see 5.3) | key item 63 |
| *Break Dmg. Limit* (auto) | 0x800d | 20 | - | - | - | - | - | - | - | self | wards (see 5.3) | key item 62 |

#### Machina Maw (Rikku)

**main body (job 0x5012)**

| Command | id | AP | MP | cast | ATB | formula | power x hits | acc | element | target | status chances | prerequisite |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Attack | 0x312f | 10 | 0 | 0 | 70 | 0 strength/base | 16 x 1 | formula 2 | - | 1 enemy | - | none (free) |
| Revival | 0x3138 | 10 | 0 | 100 | 0 | 7 % of max HP | 8 x 1 | always | - | 1 ally (can target KO) | Death 254 | AP only |
| Death Missile | 0x3130 | 10 | 12 | 70 | 0 | 0 strength/base | 18 x 1 | formula 2 | - | 1 enemy, far | Death 80 | none (free) |
| Bio Missile | 0x3131 | 10 | 12 | 70 | 0 | 0 strength/base | 18 x 1 | formula 2 | - | 1 enemy, far | Poison 90 | none (free) |
| Break Missile | 0x3132 | 10 | 12 | 70 | 0 | 0 strength/base | 18 x 1 | formula 2 | - | 1 enemy, far | Petrify 80 | none (free) |
| Berserk Missile | 0x3133 | 10 | 12 | 70 | 0 | 0 strength/base | 18 x 1 | formula 2 | - | 1 enemy, far | Berserk 90 | AP only |
| Stop Missile | 0x3134 | 10 | 12 | 70 | 0 | 0 strength/base | 18 x 1 | formula 2 | - | 1 enemy, far | Stop 100 for 100 | 0x3133 |
| Confuse Missile | 0x3135 | 10 | 12 | 70 | 0 | 0 strength/base | 18 x 1 | formula 2 | - | 1 enemy, far | Confusion 90 | 0x3134 |
| Shockwave | 0x3136 | 20 | 36 | 90 | 0 | 0 strength/base | 28 x 1 | always | - | all enemies | - | AP only |
| Shockstorm | 0x3137 | 20 | 36 | 90 | 0 | 0 strength/base | 24 x 1 | always | - | all enemies | - | 0x3136 |
| Vajra | 0x3139 | 30 | 0 | 120 | 80 | 0 strength/base | 80 x 1 | formula 2 | - | all enemies, far | - | 0x3137 |
| *Ribbon* (auto) | 0x8068 | 30 | - | - | - | - | - | - | - | self | wards (see 5.3) | none (free) |
| *Double HP* (auto) | 0x8072 | 20 | - | - | - | - | - | - | - | self | HP +100% | AP only |
| *Triple HP* (auto) | 0x8073 | 30 | - | - | - | - | - | - | - | self | HP +100% | 0x8072 |
| *Break HP Limit* (auto) | 0x800b | 20 | - | - | - | - | - | - | - | self | wards (see 5.3) | key item 65 |
| *Break Dmg. Limit* (auto) | 0x800d | 20 | - | - | - | - | - | - | - | self | wards (see 5.3) | key item 64 |

**Smasher-R (job 0x5013)**

| Command | id | AP | MP | cast | ATB | formula | power x hits | acc | element | target | status chances | prerequisite |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Howitzer | 0x313d | 10 | 12 | 70 | 0 | 0 strength/base | 16 x 1 | formula 2 | - | 1 enemy | - | none (free) |
| Sleep Shell | 0x313e | 10 | 12 | 70 | 0 | 0 strength/base | 16 x 1 | formula 2 | - | 1 enemy | Sleep 100 | AP only |
| Slow Shell | 0x313f | 10 | 12 | 70 | 0 | 0 strength/base | 16 x 1 | formula 2 | - | 1 enemy | Slow 100 for 100 | 0x313e |
| Anti-Power Shell | 0x3140 | 10 | 12 | 70 | 0 | 0 strength/base | 16 x 1 | formula 2 | - | 1 enemy | STR -3 levels (254) | 0x313f |
| Anti-Armor Shell | 0x3141 | 10 | 12 | 70 | 0 | 0 strength/base | 16 x 1 | formula 2 | - | 1 enemy | DEF -3 levels (254) | 0x3140 |
| Scan | 0x3142 | 10 | 0 | 20 | 0 | 0 strength/base | 0 x 1 | always | - | 1 enemy | - | AP only |
| Shellter | 0x3143 | 20 | 10 | 70 | 0 | 0 strength/base | 0 x 1 | always | - | party | Shell 254 for 100 | AP only |
| Protector | 0x3144 | 20 | 10 | 70 | 0 | 0 strength/base | 0 x 1 | always | - | party | Protect 254 for 100 | 0x3143 |
| HP Repair | 0x313b | 10 | 0 | 70 | 0 | 7 % of max HP | 4 x 1 | always | - | 1 ally | - | none (free) |
| MP Repair | 0x313c | 10 | 0 | 70 | 0 | 6 healing (MP) | 30 x 1 | always | - | 1 ally | - | none (free) |
| Homing Ray | 0x313a | 10 | 0 | 70 | 0 | 0 strength/base | 20 x 1 | formula 2 | - | 1 enemy, far | - | none (free) |
| *Ribbon* (auto) | 0x8068 | 30 | - | - | - | - | - | - | - | self | wards (see 5.3) | none (free) |
| *Double HP* (auto) | 0x8072 | 20 | - | - | - | - | - | - | - | self | HP +100% | AP only |
| *Triple HP* (auto) | 0x8073 | 30 | - | - | - | - | - | - | - | self | HP +100% | 0x8072 |
| *Break HP Limit* (auto) | 0x800b | 20 | - | - | - | - | - | - | - | self | wards (see 5.3) | key item 65 |
| *Break Dmg. Limit* (auto) | 0x800d | 20 | - | - | - | - | - | - | - | self | wards (see 5.3) | key item 64 |

**Crusher-L (job 0x5014)**

| Command | id | AP | MP | cast | ATB | formula | power x hits | acc | element | target | status chances | prerequisite |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Howitzer | 0x3148 | 10 | 12 | 70 | 0 | 0 strength/base | 16 x 1 | formula 2 | - | 1 enemy | - | none (free) |
| Blind Shell | 0x3149 | 10 | 12 | 70 | 0 | 0 strength/base | 16 x 1 | formula 2 | - | 1 enemy | Darkness 254 | 0x3148 |
| Silence Shell | 0x314a | 10 | 12 | 70 | 0 | 0 strength/base | 16 x 1 | formula 2 | - | 1 enemy | Silence 254 | 0x3149 |
| Anti-Magic Shell | 0x314b | 10 | 12 | 70 | 0 | 0 strength/base | 16 x 1 | formula 2 | - | 1 enemy | MAG -3 levels (254) | 0x314a |
| Anti-Mental Shell | 0x314c | 10 | 12 | 70 | 0 | 0 strength/base | 16 x 1 | formula 2 | - | 1 enemy | MDEF -3 levels (254) | 0x314b |
| Booster | 0x314d | 20 | 30 | 70 | 0 | 0 strength/base | 0 x 1 | always | - | party | Haste 254 for 50 | AP only |
| Offense | 0x314e | 20 | 10 | 70 | 0 | 0 strength/base | 0 x 1 | always | - | 1 ally | STR +3 levels (254) | AP only |
| Defense | 0x314f | 20 | 10 | 70 | 0 | 0 strength/base | 0 x 1 | always | - | 1 ally | DEF +3 levels (254) | 0x314e |
| HP Repair | 0x3146 | 10 | 0 | 70 | 0 | 7 % of max HP | 4 x 1 | always | - | 1 ally | - | none (free) |
| MP Repair | 0x3147 | 10 | 0 | 70 | 0 | 6 healing (MP) | 30 x 1 | always | - | 1 ally | - | none (free) |
| Homing Ray | 0x3145 | 10 | 0 | 70 | 0 | 0 strength/base | 20 x 1 | formula 2 | - | 1 enemy, far | - | none (free) |
| *Ribbon* (auto) | 0x8068 | 30 | - | - | - | - | - | - | - | self | wards (see 5.3) | none (free) |
| *Double HP* (auto) | 0x8072 | 20 | - | - | - | - | - | - | - | self | HP +100% | AP only |
| *Triple HP* (auto) | 0x8073 | 30 | - | - | - | - | - | - | - | self | HP +100% | 0x8072 |
| *Break HP Limit* (auto) | 0x800b | 20 | - | - | - | - | - | - | - | self | wards (see 5.3) | key item 65 |
| *Break Dmg. Limit* (auto) | 0x800d | 20 | - | - | - | - | - | - | - | self | wards (see 5.3) | key item 64 |

#### Full Throttle (Paine)

**main body (job 0x5015)**

| Command | id | AP | MP | cast | ATB | formula | power x hits | acc | element | target | status chances | prerequisite |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Attack | 0x3031 | 20 | 0 | 0 | 70 | 0 strength/base | 16 x 1 | formula 2 | - | 1 enemy | - | none (free) |
| Fright | 0x3158 | 20 | 0 | 100 | 0 | 0 strength/base | 24 x 1 | always | - | 1 enemy | Confusion 254 | 0x3157 |
| Aestus | 0x3150 | 10 | 0 | 0 | 80 | 0 strength/base | 20 x 1 | formula 2 | Fire | 1 enemy | - | none (free) |
| Winterkill | 0x3151 | 10 | 0 | 0 | 80 | 0 strength/base | 20 x 1 | formula 2 | Ice | 1 enemy | - | none (free) |
| Whelmen | 0x3153 | 10 | 0 | 0 | 80 | 0 strength/base | 20 x 1 | formula 2 | Water | 1 enemy | - | none (free) |
| Levin | 0x3152 | 10 | 0 | 0 | 80 | 0 strength/base | 20 x 1 | formula 2 | Lightning | 1 enemy | - | none (free) |
| Wisenen | 0x3154 | 10 | 0 | 0 | 80 | 4 % of current HP | 12 x 1 | formula 2 | Gravity | 1 enemy | - | AP only |
| Fiers | 0x3155 | 20 | 0 | 0 | 80 | 0 strength/base | 16 x 1 | formula 2 | - | 1 enemy | - | 0x3154 |
| Deeth | 0x3156 | 20 | 0 | 0 | 80 | 0 strength/base | 20 x 1 | formula 2 | - | 1 enemy | Death 90 | 0x3155 |
| Assoil | 0x3157 | 20 | 0 | 0 | 100 | 0 strength/base | 20 x 1 | formula 2 | Holy | 1 enemy | - | AP only |
| Sword Dance | 0x3159 | 30 | 0 | 120 | 80 | 0 strength/base | 48 x 2 | always | - | all enemies | - | 0x3158 |
| *Ribbon* (auto) | 0x8068 | 30 | - | - | - | - | - | - | - | self | wards (see 5.3) | none (free) |
| *Double HP* (auto) | 0x8072 | 20 | - | - | - | - | - | - | - | self | HP +100% | AP only |
| *Triple HP* (auto) | 0x8073 | 30 | - | - | - | - | - | - | - | self | HP +100% | 0x8072 |
| *Break HP Limit* (auto) | 0x800b | 20 | - | - | - | - | - | - | - | self | wards (see 5.3) | key item 67 |
| *Break Dmg. Limit* (auto) | 0x800d | 20 | - | - | - | - | - | - | - | self | wards (see 5.3) | key item 66 |

**Dextral Wing (job 0x5016)**

| Command | id | AP | MP | cast | ATB | formula | power x hits | acc | element | target | status chances | prerequisite |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Venom Wing | 0x315a | 10 | 12 | 70 | 0 | 9 special magic | 18 x 1 | always | - | 1 enemy, far | Poison 254 | none (free) |
| Blind Wing | 0x315b | 10 | 12 | 70 | 0 | 9 special magic | 18 x 1 | always | - | 1 enemy, far | Darkness 254 | none (free) |
| Mute Wing | 0x315c | 10 | 12 | 70 | 0 | 9 special magic | 18 x 1 | always | - | 1 enemy, far | Silence 254 | none (free) |
| Rock Wing | 0x315d | 10 | 12 | 70 | 0 | 9 special magic | 18 x 1 | always | - | 1 enemy, far | Petrify 100 | AP only |
| Lazy Wing | 0x315e | 10 | 12 | 70 | 0 | 9 special magic | 18 x 1 | always | - | 1 enemy, far | Sleep 254 | none (free) |
| Violent Wing | 0x315f | 10 | 12 | 70 | 0 | 9 special magic | 18 x 1 | always | - | 1 enemy, far | Berserk 254 | AP only |
| Still Wing | 0x3160 | 10 | 12 | 70 | 0 | 9 special magic | 18 x 1 | always | - | 1 enemy, far | Stop 100 for 100 | AP only |
| Crazy Wing | 0x3161 | 10 | 12 | 70 | 0 | 9 special magic | 18 x 1 | always | - | 1 enemy, far | Confusion 254 | 0x315f |
| Stamina | 0x3162 | 10 | 0 | 90 | 0 | 6 healing | 32 x 1 | always | - | 1 ally | - | none (free) |
| Mettle | 0x3163 | 10 | 0 | 100 | 0 | 7 % of max HP (MP) | 4 x 1 | always | - | 1 ally | - | none (free) |
| Reboot | 0x3164 | 10 | 0 | 100 | 0 | 7 % of max HP | 8 x 1 | always | - | 1 ally (can target KO) | Death 254 | 0x3163 |
| *Ribbon* (auto) | 0x8068 | 30 | - | - | - | - | - | - | - | self | wards (see 5.3) | none (free) |
| *Double HP* (auto) | 0x8072 | 20 | - | - | - | - | - | - | - | self | HP +100% | AP only |
| *Triple HP* (auto) | 0x8073 | 30 | - | - | - | - | - | - | - | self | HP +100% | 0x8072 |
| *Break HP Limit* (auto) | 0x800b | 20 | - | - | - | - | - | - | - | self | wards (see 5.3) | key item 67 |
| *Break Dmg. Limit* (auto) | 0x800d | 20 | - | - | - | - | - | - | - | self | wards (see 5.3) | key item 66 |

**Sinistral Wing (job 0x5017)**

| Command | id | AP | MP | cast | ATB | formula | power x hits | acc | element | target | status chances | prerequisite |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Steel Feather | 0x3165 | 10 | 12 | 70 | 0 | 0 strength/base | 0 x 1 | always | - | party | STR +2 levels (254) | none (free) |
| Diamond Feather | 0x3166 | 10 | 12 | 70 | 0 | 0 strength/base | 0 x 1 | always | - | party | DEF +2 levels (254) | none (free) |
| White Feather | 0x3169 | 10 | 16 | 70 | 0 | 0 strength/base | 0 x 1 | always | - | all enemies, far | STR -2 levels (254) | none (free) |
| Buckle Feather | 0x316a | 10 | 16 | 70 | 0 | 0 strength/base | 0 x 1 | always | - | all enemies, far | DEF -2 levels (254) | none (free) |
| Cloudy Feather | 0x316b | 10 | 16 | 70 | 0 | 0 strength/base | 0 x 1 | always | - | all enemies, far | MAG -2 levels (254) | AP only |
| Pointed Feather | 0x316c | 10 | 16 | 70 | 0 | 0 strength/base | 0 x 1 | always | - | all enemies, far | MDEF -2 levels (254) | 0x316b |
| Pumice Feather | 0x3167 | 10 | 38 | 70 | 0 | 0 strength/base | 0 x 1 | always | - | party | Haste 254 for 50 | AP only |
| Ma'at's Feather | 0x3168 | 10 | 0 | 20 | 0 | 0 strength/base | 0 x 1 | always | - | 1 enemy, far | - | AP only |
| Stamina | 0x316d | 10 | 0 | 90 | 0 | 6 healing | 31 x 1 | always | - | 1 ally | - | none (free) |
| Mettle | 0x316e | 10 | 0 | 100 | 0 | 7 % of max HP (MP) | 4 x 1 | always | - | 1 ally | - | none (free) |
| Reboot | 0x316f | 10 | 0 | 100 | 0 | 7 % of max HP | 8 x 1 | always | - | 1 ally (can target KO) | Death 254 | 0x316e |
| *Ribbon* (auto) | 0x8068 | 30 | - | - | - | - | - | - | - | self | wards (see 5.3) | none (free) |
| *Double HP* (auto) | 0x8072 | 20 | - | - | - | - | - | - | - | self | HP +100% | AP only |
| *Triple HP* (auto) | 0x8073 | 30 | - | - | - | - | - | - | - | self | HP +100% | 0x8072 |
| *Break HP Limit* (auto) | 0x800b | 20 | - | - | - | - | - | - | - | self | wards (see 5.3) | key item 67 |
| *Break Dmg. Limit* (auto) | 0x800d | 20 | - | - | - | - | - | - | - | self | wards (see 5.3) | key item 66 |


Notes on the rows the community tables list differently: Libra is "Scan" (a 4 AP command on the main body); Death Petals is an always-hit (chance 254) Death on one target; Deeth is Death at 90 and Death Missile at 80; Ash Floralysis is Petrify at 80; Fright is Confusion at 254 with the **strong Delay** bit (`flagsMisc` `0x2000`) as the wiki says; Sword Dance carries no crit bit of its own (the guaranteed-crit row is Fiers: `critByte` 255 with the fixed-crit damage bit); the Feathers' Infinite durations are stage levels with no clock (status time = the number of levels).

## 5. Stats

**Growth rows** (`kernel/dressphere-growth.ts`, `job.bin` ids 0x500f to 0x5017; HP = `a*L - L*L*10/d + c`, MP = `a*L/10 - L*L/d + c`, the eight stats `L/d1 - (L*L/16)/d2/d3 + a*L/10 + c`) `[verified: exe; the whole stat builder is emulated]`:

| Part | job | HP growth (a, d, c) | MP growth (a, d, c) |
|---|---|---|---|
| Floral Fallal main | 0x500f | 72, 130, 180 | 66, 40, 60 |
| Right Pistil | 0x5010 | 51, 120, 80 | 40, 60, 80 |
| Left Pistil | 0x5011 | 51, 120, 80 | 40, 60, 80 |
| Machina Maw main | 0x5012 | 66, 130, 200 | 55, 70, 40 |
| Smasher-R | 0x5013 | 54, 85, 80 | 40, 100, 20 |
| Crusher-L | 0x5014 | 54, 85, 80 | 40, 100, 20 |
| Full Throttle main | 0x5015 | 70, 150, 220 | 10, 240, 2 |
| Dextral Wing | 0x5016 | 59, 70, 100 | 30, 120, 80 |
| Sinistral Wing | 0x5017 | 59, 70, 100 | 30, 120, 80 |

| Part | Lv | unscaled HP/MP/STR/DEF/MAG/MDEF/AGI/ACC/EVA/LCK | x1.08 (2 nodes) HP | x1.20 (5) HP | x1.24 (6 nodes) HP/MP/STR/DEF/MAG/MDEF/AGI/ACC/EVA/LCK | with Double+Triple HP, 6 nodes: HP |
|---|---|---|---|---|---|---|
| Floral Fallal main | 20 | 1590 / 182 / 63 / 42 / 81 / 97 / 41 / 116 / 3 / 9 | 1717 | 1908 | 1971 / 225 / 78 / 52 / 100 / 120 / 41 / 116 / 3 / 9 | 5913 |
| Floral Fallal main | 25 | 1932 / 210 / 74 / 43 / 90 / 97 / 41 / 116 / 3 / 9 | 2086 | 2318 | 2395 / 260 / 91 / 53 / 111 / 120 / 41 / 116 / 3 / 9 | 7185 |
| Floral Fallal main | 50 | 3588 / 328 / 122 / 50 / 133 / 102 / 42 / 117 / 4 / 10 | 3875 | 4305 | 4449 / 406 / 151 / 62 / 164 / 126 / 42 / 117 / 4 / 10 | 9999 |
| Floral Fallal main | 99 | 6555 / 468 / 196 / 61 / 197 / 109 / 45 / 118 / 6 / 13 | 7079 | 7866 | 8128 / 580 / 243 / 75 / 244 / 135 / 45 / 118 / 6 / 13 | 9999 |
| Right Pistil | 20 | 1067 / 154 / 55 / 43 / 62 / 73 / 39 / 105 / 2 / 6 | 1152 | 1280 | 1323 / 190 / 68 / 53 / 76 / 90 / 39 / 105 / 2 / 6 | 3969 |
| Right Pistil | 25 | 1303 / 170 / 65 / 43 / 70 / 73 / 39 / 106 / 3 / 6 | 1407 | 1563 | 1615 / 210 / 80 / 53 / 86 / 90 / 39 / 106 / 3 / 6 | 4845 |
| Right Pistil | 50 | 2422 / 239 / 109 / 48 / 105 / 78 / 41 / 107 / 4 / 7 | 2615 | 2906 | 3003 / 296 / 135 / 59 / 130 / 96 / 41 / 107 / 4 / 7 | 9009 |
| Right Pistil | 99 | 4313 / 313 / 172 / 56 / 162 / 85 / 44 / 109 / 6 / 9 | 4658 | 5175 | 5348 / 388 / 213 / 69 / 200 / 105 / 44 / 109 / 6 / 9 | 9999 |
| Left Pistil | 20 | 1067 / 154 / 55 / 43 / 62 / 73 / 39 / 105 / 2 / 6 | 1152 | 1280 | 1323 / 190 / 68 / 53 / 76 / 90 / 39 / 105 / 2 / 6 | 3969 |
| Left Pistil | 25 | 1303 / 170 / 65 / 43 / 70 / 73 / 39 / 106 / 3 / 6 | 1407 | 1563 | 1615 / 210 / 80 / 53 / 86 / 90 / 39 / 106 / 3 / 6 | 4845 |
| Left Pistil | 50 | 2422 / 239 / 109 / 48 / 105 / 78 / 41 / 107 / 4 / 7 | 2615 | 2906 | 3003 / 296 / 135 / 59 / 130 / 96 / 41 / 107 / 4 / 7 | 9009 |
| Left Pistil | 99 | 4313 / 313 / 172 / 56 / 162 / 85 / 44 / 109 / 6 / 9 | 4658 | 5175 | 5348 / 388 / 213 / 69 / 200 / 105 / 44 / 109 / 6 / 9 | 9999 |
| Machina Maw main | 20 | 1490 / 145 / 64 / 85 / 50 / 32 / 41 / 117 / 3 / 7 | 1609 | 1788 | 1847 / 179 / 79 / 105 / 62 / 39 / 41 / 117 / 3 / 7 | 5541 |
| Machina Maw main | 25 | 1802 / 169 / 74 / 87 / 56 / 32 / 41 / 117 / 3 / 7 | 1946 | 2162 | 2234 / 209 / 91 / 107 / 69 / 39 / 41 / 117 / 3 / 7 | 6702 |
| Machina Maw main | 50 | 3308 / 280 / 123 / 94 / 85 / 38 / 43 / 119 / 4 / 9 | 3572 | 3969 | 4101 / 347 / 152 / 116 / 105 / 47 / 43 / 119 / 4 / 9 | 9999 |
| Machina Maw main | 99 | 5981 / 444 / 199 / 108 / 124 / 47 / 46 / 122 / 7 / 12 | 6459 | 7177 | 7416 / 550 / 246 / 133 / 153 / 58 / 46 / 122 / 7 / 12 | 9999 |
| Smasher-R | 20 | 1113 / 96 / 59 / 37 / 46 / 30 / 39 / 112 / 2 / 6 | 1202 | 1335 | 1380 / 119 / 73 / 45 / 57 / 37 / 39 / 112 / 2 / 6 | 4140 |
| Smasher-R | 25 | 1357 / 114 / 70 / 38 / 51 / 31 / 39 / 113 / 2 / 6 | 1465 | 1628 | 1682 / 141 / 86 / 47 / 63 / 38 / 39 / 113 / 2 / 6 | 5046 |
| Smasher-R | 50 | 2486 / 195 / 118 / 48 / 77 / 35 / 40 / 116 / 3 / 7 | 2684 | 2983 | 3082 / 241 / 146 / 59 / 95 / 43 / 40 / 116 / 3 / 7 | 9246 |
| Smasher-R | 99 | 4273 / 318 / 188 / 65 / 110 / 41 / 43 / 122 / 6 / 10 | 4614 | 5127 | 5298 / 394 / 233 / 80 / 136 / 50 / 43 / 122 / 6 / 10 | 9999 |
| Crusher-L | 20 | 1113 / 96 / 59 / 37 / 46 / 30 / 39 / 112 / 2 / 6 | 1202 | 1335 | 1380 / 119 / 73 / 45 / 57 / 37 / 39 / 112 / 2 / 6 | 4140 |
| Crusher-L | 25 | 1357 / 114 / 70 / 38 / 51 / 31 / 39 / 113 / 2 / 6 | 1465 | 1628 | 1682 / 141 / 86 / 47 / 63 / 38 / 39 / 113 / 2 / 6 | 5046 |
| Crusher-L | 50 | 2486 / 195 / 118 / 48 / 77 / 35 / 40 / 116 / 3 / 7 | 2684 | 2983 | 3082 / 241 / 146 / 59 / 95 / 43 / 40 / 116 / 3 / 7 | 9246 |
| Crusher-L | 99 | 4273 / 318 / 188 / 65 / 110 / 41 / 43 / 122 / 6 / 10 | 4614 | 5127 | 5298 / 394 / 233 / 80 / 136 / 50 / 43 / 122 / 6 / 10 | 9999 |
| Full Throttle main | 20 | 1594 / 21 / 72 / 51 / 64 / 47 / 45 / 133 / 9 / 11 | 1721 | 1912 | 1976 / 26 / 89 / 63 / 79 / 58 / 45 / 133 / 9 / 11 | 5928 |
| Full Throttle main | 25 | 1929 / 25 / 82 / 52 / 70 / 48 / 45 / 134 / 9 / 11 | 2083 | 2314 | 2391 / 31 / 101 / 64 / 86 / 59 / 45 / 134 / 9 / 11 | 7173 |
| Full Throttle main | 50 | 3554 / 42 / 134 / 61 / 94 / 55 / 47 / 135 / 11 / 13 | 3838 | 4264 | 4406 / 52 / 166 / 75 / 116 / 68 / 47 / 135 / 11 / 13 | 9999 |
| Full Throttle main | 99 | 6497 / 61 / 219 / 77 / 121 / 67 / 50 / 137 / 14 / 16 | 7016 | 7796 | 8056 / 75 / 255 / 95 / 150 / 83 / 50 / 137 / 14 / 16 | 9999 |
| Dextral Wing | 20 | 1223 / 137 / 58 / 51 / 45 / 46 / 41 / 111 / 2 / 4 | 1320 | 1467 | 1516 / 169 / 71 / 63 / 55 / 57 / 41 / 111 / 2 / 4 | 4548 |
| Dextral Wing | 25 | 1486 / 150 / 67 / 53 / 50 / 46 / 41 / 112 / 3 / 4 | 1604 | 1783 | 1842 / 186 / 83 / 65 / 62 / 57 / 41 / 112 / 3 / 4 | 5526 |
| Dextral Wing | 50 | 2693 / 210 / 111 / 64 / 73 / 52 / 43 / 119 / 4 / 5 | 2908 | 3231 | 3339 / 260 / 137 / 79 / 90 / 64 / 43 / 119 / 4 / 5 | 9999 |
| Dextral Wing | 99 | 4541 / 296 / 183 / 84 / 102 / 60 / 46 / 131 / 6 / 8 | 4904 | 5449 | 5630 / 367 / 226 / 104 / 126 / 74 / 46 / 131 / 6 / 8 | 9999 |
| Sinistral Wing | 20 | 1223 / 137 / 58 / 51 / 45 / 46 / 41 / 111 / 2 / 4 | 1320 | 1467 | 1516 / 169 / 71 / 63 / 55 / 57 / 41 / 111 / 2 / 4 | 4548 |
| Sinistral Wing | 25 | 1486 / 150 / 67 / 53 / 50 / 46 / 41 / 112 / 3 / 4 | 1604 | 1783 | 1842 / 186 / 83 / 65 / 62 / 57 / 41 / 112 / 3 / 4 | 5526 |
| Sinistral Wing | 50 | 2693 / 210 / 111 / 64 / 73 / 52 / 43 / 119 / 4 / 5 | 2908 | 3231 | 3339 / 260 / 137 / 79 / 90 / 64 / 43 / 119 / 4 / 5 | 9999 |
| Sinistral Wing | 99 | 4541 / 296 / 183 / 84 / 102 / 60 / 46 / 131 / 6 / 8 | 4904 | 5449 | 5630 / 367 / 226 / 104 / 126 / 74 / 46 / 131 / 6 / 8 | 9999 |


* **The final stage multiplies HP, MP, Strength, Defense, Magic and Magic Defense by `(nodes + 25) / 25`** for any Special job, main or pod (`finalStats`, exe `0x0060e2d0`): 2 nodes x1.08, 3 x1.12, 4 x1.16, 5 x1.20, 6 x1.24; Agility, Accuracy, Evasion and Luck are unchanged `[verified: exe; emulated]`. The worked example the RE note already holds: Floral Fallal at level 20 on 6 nodes is HP 1,590 * 31 / 25 = **1,971** and MP **225** (pinned by `data-ffx2-special-rows.test.ts`).
* **Which node count a part reads.** The main body is the girl's record, so it reads **her grid's** node count. A pod is a child record whose plate the shipped initial rows leave at grid 0, which has 6 nodes, so **a pod is always x1.24** `[exe + data; gap: the game was not watched to see whether play rewrites a pod's plate]`. The community's "only the main part scales with the grid's nodes" `[verified: 2 sources]` agrees with a constant pod.
* **The open question, again** (`re-ffx2-dressphere.md` section 7, item 2): the community's worked blocks for a 6-node Floral Fallal (SinirothX: Lv 25 HP 1,931 and Lv 50 3,587) equal the game's **unscaled** rows (1,932 and 3,588, the table above, off by one in the rounding), not the x1.24 the recompute gives (2,395 and 4,449). Either the scale is read as 0 in play (the plate of the record being rebuilt is not the grid, so the term is 25/25) or the community's blocks were computed from the growth rows and never observed. The exe path is emulated; the live game was not observed `[gap]`. **The engine uses the exe's scale** (the wiki's own statement that the stats "are directly related to the number of nodes" has no other source for the rule, and a rule that makes the node count matter is the one every source describes). The alternative, the unscaled rows (the community's numbers), is one constant (`POD_SCALE_NODES` and the node count passed to `specialPartStats`, `special/stats.ts`) and is recorded in section 10 as the driver's call, Bailey's to overturn.
* **Double HP and Triple HP** (a_ability rows 0x8072 and 0x8073, 20 and 30 AP, the second needs the first) each add **+100 percent of the HP** (`up_status[0]` = 100); the two layers are summed in the bonus block, so both together are **x3** (the last column of the table) `[verified: the game's tables]`; the HP cap is 9,999 without Break HP Limit (99,999 with it).

## 6. What a part carries

* **Ribbon** (a_ability 0x8068, 30 AP, listed free on all nine parts: a pair with no prerequisite): wards at the resist byte 255 against Petrify, Sleep, Silence, Darkness, Poison, Confusion, Berserk, Curse, **Eject**, Pointless, Itch and **Auto-Life** (group 1 slots 1 to 8, 10, 16, 17, 18) and Slow, Stop and **Doom** (group 2 slots 5, 6, 14) `[verified: the game's tables]`. The ordinary accessory Ribbon (0x8067, row 103) is the same list without Eject and Auto-Life. A dress change **sweeps** the statuses whose resist byte becomes 255 (except Death and Eject) off the girl (`kernel/spherechange.ts#sweepImmuneStatuses`, exe `0x00624cc0`) `[verified: exe]`: entering a form cures a Slow, Stop, Curse or Itch she carried.
* **Auto-Life**: "every SDSP part has Ribbon plus Auto-Life innately" (combat-core 3.15) and "A separate Ribbon ability applies Auto-Life once" (GamerGuides' Floral Fallal page) `[verified: 2 sources: community]`. **The game's Ribbon row keeps no status** (its kept-status masks are 0; slot 18 is in its *wards*), and the form's start-up code was not read for a grant `[gap]`. The engine applies Auto-Life once to each part when the form is put on, marks the main body's with the form as its source and takes it off again when the form ends (section 10, pick 6).
* **Break HP Limit** (20 AP) and **Break Damage Limit** (20 AP): each needs a key item (`important.bin`): Floral Fallal Aurora Rain (0x3f) and Twilight Rain (0x3e); Machina Maw Machina Reactor (0x41) and Machina Booster (0x40); Full Throttle Corpus Invictus (0x43) and Victor Primoris (0x42) `[verified: the game's tables]`. The engine models no key items, so these are never on.
* The other passives of each part's ladder are Double HP and Triple HP only (section 4's tables list all five).

## 7. The finishers (the three 30 AP, long-charge, whole-field moves)

All three have cast cost 120, ATB cost 80 and no MP. Great Whirl and Vajra carry the far-target bit (`0x400`) and so **reach the Vegnagun Leg's Nodes**; Sword Dance does not `[verified: the game's tables; combat-core 6.5 for the Nodes]`:

* **Great Whirl** (0x3118, Floral Fallal main, 30 AP after Flare Whirl): **12 hits of power 8**, random enemies, formula 0 (the Strength base) with the **magical** damage flag and no crit bit, accuracy always. `[verified: the game's tables]`.
* **Vajra** (0x3139, Machina Maw main, 30 AP after Shockstorm): **1 hit of power 80** on all enemies, physical, can crit, accuracy formula 2 `[verified: the game's tables]`.
* **Sword Dance** (0x3159, Full Throttle main, 30 AP after Fright): **2 hits of power 48** on all enemies, physical, accuracy always `[verified: the game's tables]`.

Their damage is the kernel's ordinary formula for the row (`kernel/damage.ts`, `research/re-ffx2-damage.md`), so no number of ours is involved; the portraits already name them (`engine/BigMoves.ts`).

## 8. How the form ends

1. **The girl leaves it.** The grid scene commits a form's end with the pending-change mode 2 (`kernel/spherechange.ts#gridProgressAfter('leaveSpecial')`): the walk is left as it is (mode 2 "does nothing"), the record takes the dress it was given `[verified: exe]`. The FF Wiki says the others "disappear until the special dressphere is removed" `[single source]`. **Which choices the grid scene offers while leaving a Special in a battle was not traced** `[gap]`; the engine offers one, the dress she stood on (section 10).
2. **The main body falls.** The community's report: "should the character die, she reverts to her most recent dressphere (the one she was on as she transformed), and the other two characters return" (a fan thread, one source) `[single source]`; a second fan reply says "the central unit dies, and it's over" `[single source, contradicting]`. What the game's own tables say: the combat-core's "All-Life: revive any KO'd parts **except the main body**" is a restriction that only makes sense if the main body is never left KO'd inside a form; and the battle-end evaluation as read counts three active slots (so the fight is lost only when all three parts are down). The engine takes the first reading where a pod still stands (section 10); the second is the alternative.
3. **The battle ends.** The record keeps the Special until the next battle's start, where it is put back (section 2, item 6) `[verified: exe]`. The engine does the same put-back once the battle's result is built (section 10, pick 12), so a chain's seam carries a girl in her dress and not a Special's pools and statuses.
4. **HP on the way out.** The main body is the girl's own record: when she returns to a normal dress her pools follow the same ratio rule, and **a girl at 0 HP stays at 0** (`re-ffx2-dressphere.md` 2.4) `[verified: exe]`, so a form that ends by her fall leaves her knocked out in her old dress. The pods' own pools are separate records `[verified: exe]`; what they hold at the next entry is not known `[gap]`.

## 9. Conflicts between the sources, and which wins

| Question | Source A | Source B | Wins, and why |
|---|---|---|---|
| Which part has All-Life | combat-core: the main body | GamerGuides: the Left Part | the game's row (the main's pair list) |
| Buckle Feather | FF Wiki: DEF Down 4 | the row: DEF Down 2 | the row |
| Great Whirl's stat | SinirothX: "special magic" | the row: formula 0 + the magical flag, power 8 | the row (and the wiki's "though it uses the Strength stat") |
| Floral Fallal main stats at 6 nodes | community: the unscaled growth | the exe: x1.24 | open `[gap]`; the engine follows the exe, the alternative is one constant |
| What ends the form | one fan: reverts, others return | one fan: "it's over" | nothing in-game read; the engine takes the first, section 10 |
| Auto-Life | combat-core and GamerGuides: innate | the Ribbon row: keeps no status | two community sources; the form's start-up code unread; the engine grants it |

## 10. What the engine does (all behind the `specialDressUp` switch, OFF by default; the picks are the driver's, Bailey's to overturn)

Game case: **FFX-2 only**; shared plumbing is none (every new file is under `battle/ffx2/special/` and `data/ffx2/**`). With the switch off, every chapter is as built (the full-suite run in `docs/handoff/ffx2-specials.md`).

| # | Pick | Alternative (recorded) |
|---|---|---|
| 1 | The Special Dress Up is offered when every node of her real grid has been worn this battle, every node is occupied and she owns her Special (the ordinary Change rows are the walk) | none: this is the sourced rule |
| 2 | Entering follows the kernel: her gate marks and node marks are wiped, her place stays, her accessories are put aside (given back on leaving), her Ribbon wards replace her own, her pools keep their ratio | none |
| 3 | The pods start at full HP and MP each time the form is put on (unsourced) | start from the pools they had (unknown in the game) |
| 4 | **A girl whose build names no learned list for a part has the commands the game lists from the start** (the pairs with no prerequisite) and no passive; a build or a test names more (`forms.ts#masteredLearned`) | the whole ladder and both HP passives (x3 HP) for every part: far stronger than any early chapter's party and unlike the game |
| 5 | The pods read plate 0's 6 nodes (x1.24) and the main reads her grid's | the unscaled growth rows (the community's) |
| 6 | Auto-Life once on each part at entry. The main body's carries the form as its source and **comes off with the form** (the way out, a fall, the battle's end); an Auto-Life she held before is swept at entry by the Special's own Ribbon ward (slot 18 at 255, section 6; the sweep of section 6) and is not given back | the grant: none (two community sources). Keeping the Auto-Life after the form: the free revive the review of 2026-11-09 named; giving back the one swept: not sourced |
| 7 | The girl has **one** Change row inside the form: back to the dress she stood on | the full grid scene's choices (not traced) |
| 8 | A fallen main body ends the form if a pod still stands: she returns knocked out in her old dress, the pods go, the others return; all three parts down is a defeat | the form persists while a pod stands (the exe evaluation as read) |
| 9 | After the form the walk is empty (mode 2 does nothing) | her worn dress counted as visited |
| 10 | A parked girl is out of the field but not Ejected: she is still present for the reward roll. **A girl who was Ejected before the form stays Ejected** (not parked, so not brought back; no rewards) | a parked girl earns nothing that battle; or the form returning every other girl, an Ejected one too (the review's finding: it brought back a girl the game's Eject had removed) |
| 11 | A pod's gauge starts one standard bar behind, as the girl's does after her Change (`completeCommand` with the base ATB cost) `[estimate]` | an empty gauge with no wait (the pod acts as soon as the gauge fills); the game was not observed |
| 12 | **Every form still on ends when the battle's result is built**, silently: the girl is in the dress she stood on (pools by the ratio rule), the pods stand down, the others return, the form's Auto-Life is off. The rewards were built before this and still count the parts | the form is left on at the end and the next link's setup puts the girl back (the game's own moment, section 2 item 6): a chain would carry the Special's absolute HP into a normal dress's maximum |
| 13 | The pods stand in the reward roll's owner slots 3 to 8 while the form lasts (the game's own slot table, `adapt/kill-rewards.ts#ownerUnits`), so `rewardsByMember` carries an EXP and AP entry for each pod standing at the end; a pod that stood down is not present. Nothing in `src` reads that map for a pod today | the three girls only (the game's table says otherwise) |
| 14 | A second Special Dress Up in a battle makes the two pods new, **in place** (the same objects, every field reset, full pools): the engine keeps its slot order by object and checks it by length, so a swapped object would never be stepped | none (a defect fixed in the fix pass of 2026-11-09, `tests/unit/ffx2-special-form-edges.test.ts`) |

## 11. Open questions

1. Whether play rewrites a pod's plate (section 5): needs a live look.
2. What the form's start-up code grants besides the Ribbon (Auto-Life) and what the exe does when the main body falls: the battle code that runs `MsGetPartChr` was not decompiled in this pass (no Ghidra instance was running); the one reading of section 8 is from the community.
3. The pods' pools at an entry, and whether an animation protects the girls while the form is put on (nothing in the exe sets a status; the motion scripts were not read) `[gap]`.
4. The hit-reaction clip lengths of the pods (motion-set slots 16 and 17 in `data/ffx2/hit-reaction-frames.ts`) are not wired: the engine keeps its 2 s / 3 s chain window on them.

## 12. Files

`src/battle/ffx2/special/` (forms, stats, availability, change, enter), `src/data/ffx2/command-records/special.ts` (the 99 rows), `src/data/ffx2/abilities/special-*.ts` and `special-build.ts`, `src/data/ffx2/dresspheres/special/*.ts` (the ladders), `src/battle/ffx2/adapt/game-ids-special.ts`; tests `tests/unit/ffx2-special-dress-up.test.ts`, `ffx2-special-form-edges.test.ts`, `data-ffx2-special-rows.test.ts`, `chapters/farplane-cup-specials.test.ts`; fixture `tests/fixtures/parity/ffx2/special_rows.json`; handoff `docs/handoff/ffx2-specials.md`.
