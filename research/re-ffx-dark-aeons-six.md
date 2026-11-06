# FFX Dark Valefor, Dark Ifrit, Dark Ixion, Dark Shiva, Dark Bahamut and Dark Anima: records, formations, AI and move rows from the game's own files

**Game case: FFX only.** The six Dark Aeons (like Dark Yojimbo, the Dark Magus Sisters and Penance) exist only in the International and HD Remaster builds of FFX; FFX-2 has none of them and nothing here applies to it. Part of the `re-parity` track, the sequel of `research/re-ffx-dark-aeons.md` (Dark Yojimbo and the Sisters, `m340` to `m343`), whose method and engine facts this note reuses and cites as "the first note". Drafted 2026-11-06. **Records, formations, AI and move rows only: no engine, data or AI code was changed.**

**Source and tags** (as in the first note).

- **[bytes]** read from the game's own file by a script of this lane (the Steam build 25501027, `FFX_Data.vbf`; the files were extracted read-only and are kept outside the repo, hard rule 8). **[disasm: file @offset]** read from the Atel disassembly of that file's program; the offset is a code offset inside the monster or formation file. No script line is reproduced; scripts are described by what they do.
- **[run]** the real bytecode of the monster file ran in the small Atel interpreter of the earlier AI lanes (used unchanged) against a mock battle with the real command-table rows, with exact tallies over all 65,536 results of the shared random stream where a draw is involved. A run proves the script's own behaviour; the engine facts around it are the earlier lanes' (confidence B in their notes).
- **[note: X]** taken from a checked note in this repo. **[engine]** read in the decompile corpus of the earlier lanes (FFX.exe, SHA-256 0537B2A1...686D). **[arith]** arithmetic by hand on [bytes] values with the formulas of `research/re-ffx-damage.md` section 2 and `research/re-ffx-rng-hit.md` section 4 (no engine was run, variance 240 to 271, no criticals, no Cheer or Focus).
- **[guide: Jegged / GG / GF / SW]** a community guide, cited by name only (Jegged.com "Final Fantasy X, Side Quests, Dark Aeons" pages; Gamer Guides "Final Fantasy X HD Remaster, Dark Aeons"; GameFAQs "Final Fantasy X / X-2 HD Remaster Walkthrough (PC), The Dark Aeons", version 1.3; StrategyWiki "Final Fantasy X/Dark Aeons"), all read on 2026-11-06; nothing is copied. **Where a guide and the files disagree the files win; when the files cannot settle it GameFAQs wins** (Bailey's tie-break). Section 7 lists every disagreement. **[inferred]** not read directly. Fields no note maps are given as plain values and never guessed (hard rule 6).

Files used (size in bytes, SHA-256 prefix): monster files `m334` Dark Valefor (51,368, c6cb278e), `m335` Dark Ifrit (51,384, 9299517a), `m336` Dark Ixion (42,472, 9bdb668e), `m337` Dark Shiva (30,232, f8f8637d), `m338` Dark Bahamut (32,440, d3a9c7cb), `m339` Dark Anima (57,272, 1d3b8051); formations `bsil07_70` (7,412, 16c72590), `bika03_70` (6,932, 6fd6398f), `kami03_70` (7,348, bfa1bfb9), `kami03_71` (7,204, 88a68a42), `mcyt00_70` (6,932, ab5c604c), `dome06_70` (6,948, 17b4423b), `mtgz01_70` (9,640, faac25b5); field events `bsvr0000` (186,944, 74136ab0), `bika0300` (97,728, 7bb4b464), `kami0300` (92,032, 5724b8ed), `mcyt0000` (81,408, f83d5229), `dome0600` (68,416, aa45c51d), `mtgz0000` (135,104, c260e6b4); kernel tables `monmagic1.bin` (31,420, 31a83925), `monster1.bin` (26,496, 76dc8a40), `a_ability.bin` (19,590, 41aa84fd), `btl.bin` (4,096, c4e27912), `ctb_base.bin` (530, 72eaa7b3). The sizes and hashes of `monmagic1`, `monster1`, `btl` and `ctb_base` equal those of the first note and the Keeper note. Move and item names are the English names of the game's own tables. The record in each monster file (chunk 2, offsets 0x14 to 0x7F) is byte-identical to the kernel row and to the chunk-6 copy, checked for all six.

## 0. The one-screen summary

- **Six aeons, seven fights, seven formations.** `bsil07_70` Dark Valefor (Besaid), `bika03_70` Dark Ifrit (the Sanubia desert, by the ruins of Home), `kami03_70` then `kami03_71` Dark Ixion (the Thunder Plains; the game makes you beat him twice, and the second formation changes his numbers and his script), `mcyt00_70` Dark Shiva (the road to the Macalania temple), `dome06_70` Dark Bahamut (the Zanarkand Dome, the room of Yunalesca), `mtgz01_70` Dark Anima (the foot of Mt. Gagazet). One monster in each, one slot each, no dog and no helper. Each record is a fresh full-HP boss: nothing carries over from one fight to the next. [bytes] (sections 1, 2)
- **Every one is the same machine as Dark Yojimbo: an Overdrive gauge (maximum 100, starting at 0) that gains on the aeon's own turns and on every hit it takes, and a full gauge is the aeon's Overdrive on its next turn.** The numbers are not the same: per own turn +5 (Valefor, Ixion first fight) or +10 (all others); per hit +15 (Valefor), +5 (Ifrit, Anima), +10 (Ixion, Shiva, Bahamut). Overdrives: Energy Blast 50,279, Hellfire 32,497, Aerospark 12,252 (one person), Thor's Hammer 18,240, Diamond Dust 85,123, Mega Flare 42,742, Oblivion 5,419 x 16 (about 86,700), each against a person with 255 Defense (section 5.3). [bytes] [run] [arith]
- **Three of them counter.** Dark Ifrit answers every hit event (a miss and a Steal included) with its plain Attack on the attacker; Dark Ixion does the same in the first fight only (its Attack can miss, the only row of the six that can); Dark Bahamut throws Impulse on the whole front line on every fifth hit (a counter-attack of the party does not count). The other three have no reaction but the gauge gain. [bytes] [run]
- **Dark Anima is immune to every magical command (the engine already models the flag) and absorbs fire, ice, thunder and water.** Dark Valefor resists all five elements; Ifrit, Ixion and Shiva absorb their own element, are immune to two and resist one. Nothing here is weak to anything. [bytes]
- **A speed ladder.** Tick speed 4 for Valefor (AGI 105) and Ifrit (124), 3 for the others; every move is rank 3 except **Dark Shiva's plain Attack (rank 1) and Heavenly Strike (rank 2)**, so she acts about every 4 ticks against 9 or 12 for the rest (section 4.5). [bytes] [note: re-ffx-ctb-status.md 1, 2]
- **The party's own numbers decide most of it.** Against a party member with 255 Defense and 9,999 HP the plain attacks and Valefor's, Ixion's and Anima's single moves are survivable (1,000 to 5,700), Ifrit's counter (9,573) and Meteor Strike (21,664), Shiva's Heavenly Strike (9,310 and Death) and Bahamut's Attack (13,221) are not, and every Overdrive is a KO; Dark Ixion's Attack (accuracy 254 against Evasion, Luck) **never lands on a party member whose Evasion plus Luck reaches 290**, which the first chapter's all-255 preset does (section 6). [arith]
- **Escape and Flee are disabled in five formations** (Valefor, Ifrit, Shiva, Bahamut, Anima); **Dark Ixion can be fled from** (neither is disabled in his two formations). All seven set the start Normal except Dark Anima's, which writes nothing (the engine's roll stands). A defeat is a game over in all seven. The matching aeon is **not** barred (the first note, section 9): each formation calls the same memory pin with the matching aeon's id (8 to 13). [bytes] [note: re-ffx-dark-aeons.md 9]
- **One correction for the guides' number:** the second Dark Ixion fight writes **1,300,000** into his current HP at set-up and leaves his maximum at the record's 1,200,000; the guides print 1,200,000 for both (section 4.3). [bytes] [engine] [unproved in play]
- **Recommendation for the chapter shape and every pick is in `docs/plans/ch-dark-aeons-review.md`.**

## 1. The monster records (a)

Offsets are record offsets (chunk 2; layout [note: re-ffx-dark-aeons.md 1; re-ffx-biran-yenke.md 2; FFX-H02 3.1]).

### 1.1 Identity

| Piece | Monster word | Model word | Notes | Tag |
|---|---|---|---|---|
| Dark Valefor `m334` | 0x114E | 0x3001 | CTB icon 21 | [bytes] |
| Dark Ifrit `m335` | 0x114F | 0x3002 | CTB icon 21 | [bytes] |
| Dark Ixion `m336` | 0x1150 | 0x3003 | one file for both fights; CTB icon 21 | [bytes] |
| Dark Shiva `m337` | 0x1151 | 0x3004 | CTB icon 21 | [bytes] |
| Dark Bahamut `m338` | 0x1152 | 0x3006 | CTB icon 21 | [bytes] |
| Dark Anima `m339` | 0x1153 | 0x3007 | CTB icon 21 | [bytes] |

Each is slot 0 of its formation, **battle actor 20**; there is no second actor. The record's "Doom counter" byte (255) and "arena index" (255) are the same as the Dark Yojimbo row's. [bytes]

### 1.2 Stats

No monster record carries a level; the Zanmato byte (loot +0x112) is the one graded field: **4 for all six** (the same as the four rows of the first note), so the player's Zanmato roll uses byte 4 against them. [bytes]

| Field | Dark Valefor | Dark Ifrit | Dark Ixion | Dark Shiva | Dark Bahamut | Dark Anima | Tag |
|---|---:|---:|---:|---:|---:|---:|---|
| HP | 800,000 | 1,400,000 | 1,200,000 (second fight: current HP written to 1,300,000, section 4.3) | 1,100,000 | 4,000,000 | 8,000,000 | [bytes] |
| MP | 999 | 999 | 999 | 999 | 999 | 999 | [bytes] |
| Overkill threshold | 99,999 | 99,999 | 99,999 | 99,999 | 99,999 | 99,999 | [bytes] |
| STR | 148 | 220 | 176 (second fight: 182) | 173 | 245 | 155 | [bytes], [disasm: m336 @0x0130 to 0x0160] |
| DEF | 120 | 173 | 220 (second: 222) | 163 | 234 | 230 | [bytes] |
| MAG | 186 | 177 | 133 (second: 146) | 244 | 222 | 255 | [bytes] |
| MDEF | 220 | 163 | 188 (second: 198) | 255 | 233 | 255 | [bytes] |
| AGI | 105 | 124 | 180 | 255 | 255 | 183 | [bytes] |
| LCK | 48 | 27 | 36 | 73 | 102 | 85 | [bytes] |
| EVA | 10 | 8 | 0 | 0 | 0 | 0 | [bytes] |
| ACC | 250 | 230 | 250 | 250 | 250 | 255 | [bytes] |
| Tick speed (from AGI) | 4 | 4 | 3 | 3 | 3 | 3 | [note: re-ffx-ctb-status.md 1], [arith] |
| Flag byte +0x28 | 0x1E | 0x1E | 0x1E | 0x1E | 0x1E | **0x5E** | [bytes] |
| Flag byte +0x29 | 0x07 | 0x07 | 0x07 | 0x07 | 0x07 | 0x07 | [bytes] |
| Poison damage byte (+0x2A) | 25 | 25 | 25 | 25 | 25 | 25 | [bytes] |
| Element absorb / immune / resist / weak | 0 / 0 / all five / 0 | Fire / Thunder+Water / Ice / 0 | Thunder / Fire+Ice / Water / 0 | Ice / Thunder+Water / Fire / 0 | 0 / 0 / 0 / 0 | Fire+Ice+Thunder+Water / 0 / 0 / 0 | [bytes] |
| Automatic statuses | none | none | none | none | none | none | [bytes] |
| Extra-immunity word (+0x4E) | 0x432F | 0x432F | 0x432F | 0x432F | 0x432F | 0x432F | [bytes] |
| Command list (+0x50), as stored | 0x4000 Attack, 0x40A6 Energy Blast, 0x403D Energy Ray, 0x405D Sonic Wings, Die | 0x410F Attack, 0x410C and 0x410D Hellfire, 0x410E Meteor Strike, Die | 0x4114 Attack, 0x4110 and 0x4116 Aerospark, 0x4111 and 0x4112 Thor's Hammer, 0x4113 Thundaja, Die | 0x4119 Attack, 0x4117 Heavenly Strike, 0x4118 Diamond Dust, Die | 0x410F Attack, 0x411B Impulse, 0x411A Mega Flare, Die | 0x411C Attack, 0x4105 Mega Graviton, 0x411D Pain, 0x411E Oblivion, Die | [bytes] |
| Forced action / monster index | none / 334 | none / 335 | none / 336 | none / 337 | none / 338 | none / 339 | [bytes] |

**Flag bytes.** +0x28 = 0x1E: immune to percentage damage (the guides' "Gravity"), Life, Sensor and the second Scan; **not** armored, not immune to physical or HP damage. **Dark Anima's 0x5E adds bit 6, immune to magical commands** (the engine's `Chr+0x5b8` special word: 0x40 immune magic, `src/battle/ffx/kernel/hittypes.ts` and `modifiers.ts` `damageImmunity`; a magical command is one whose damage type, `Cmd+0x20 & 3`, is 2). +0x29 = 0x07: immune to CTB damage, Slice and Bribe. +0x4E = 0x432F: immune to Scan, the four Distills, Eject, Auto-Life and Doom. [bytes] [engine]

**Status bytes** (255 immune; otherwise the move's chance minus the byte; Threaten's byte is a success percentage [note: re-ffx-biran-yenke.md 2]). All six: 255 (immune) for Death, Zombie, Petrify, Poison, Power Break, Magic Break, Armor Break, Mental Break, Confuse, Berserk, Provoke, Sleep, Silence, Darkness and Slow; 0 (lands) for Shell, Protect, Reflect, Nul-Tide, Nul-Blaze, Nul-Shock, Nul-Frost, Regen and Haste; Threaten 0 (cannot land). Identical to the four Dark rows of the first note. [bytes]

**The stored command list is not the script's.** Dark Valefor's list names 0x4000 and 0x40A6, and Dark Ixion's, Ifrit's and Bahamut's name rows the scripts use; **no branch of Dark Valefor's script queues 0x4000 or 0x40A6** (it queues the plain Attack row 0x4062 and Energy Blast row 0x4128, rows 98 and 296) [run]. As the first note found for Dark Yojimbo's single Wakizashi, a row in the list that no branch queues is not part of the fight.

### 1.3 Loot (chunk 4; layout [note: FFX-H02 3.4, 3.5; re-ffx-dark-aeons.md 1.3])

Rewards are rolled once per dead monster. All six: **gil 0**, item chance bytes 255 / 0, steal chance 255, gear chance 255, normal drop slot 1 **Dark Matter 0x2035 x1 (common) / Master Sphere 0x2050 x1 (rare)**, overkill drop Dark Matter x2 / Master Sphere x2, no bribe, gear drop base slot count 18, formula 1, critical bonus 6, power 16, extra-ability tries 20, Zanmato byte 4, Pilfer-Nab Gil factor 0, Monster Arena price 0. [bytes]

| Field | Dark Valefor | Dark Ifrit | Dark Ixion | Dark Shiva | Dark Bahamut | Dark Anima | Tag |
|---|---|---|---|---|---|---|---|
| AP / AP on overkill | 10,000 / 15,000 | 20,000 / 30,000 | 20,000 / 30,000 | 20,000 / 30,000 | 30,000 / 40,000 | 30,000 / 40,000 | [bytes] |
| Steal (common x qty / rare x qty) | X-Potion 0x2002 x2 / Elixir 0x2008 x1 | Mega Phoenix 0x2007 x2 / Elixir x1 | Stamina Tablet 0x2040 x2 / Elixir x1 | Mana Tablet 0x2041 x2 / Elixir x1 | Twin Stars 0x2042 x2 / Elixir x1 | Three Stars 0x2045 x2 / Elixir x1 | [bytes] |
| Gear ability pool, weapon row (all seven weapon rows identical) | Break Damage Limit x2, First Strike, Lightningstrike, Waterstrike, Icestrike, Firestrike | Break Damage Limit x2, Firestrike x5 | Break Damage Limit x2, Lightningstrike x5 | Break Damage Limit x2, Icestrike x5 | Break Damage Limit x2, Double Overdrive x2, Double AP x2, One MP Cost | Break Damage Limit x2, Deathstrike x2, Triple AP x2, One MP Cost | [bytes] (ids 0x8019, 0x8001, 0x8026, 0x802A, 0x8022, 0x801E, 0x800E, 0x8012, 0x800D, 0x802E, 0x8013 by `a_ability.bin`) |
| Gear ability pool, armour row (all seven armour rows identical) | Break HP Limit x3, Auto-Regen x3, Ribbon | Break HP Limit x3, Fire Eater x3, Ribbon | Break HP Limit x3, Lightning Eater x3, Ribbon | Break HP Limit x3, Ice Eater x3, Ribbon | Break HP Limit x3, Auto-Protect x3, Ribbon | Break HP Limit x3, Deathproof x3, Ribbon | [bytes] (ids 0x8017, 0x8057, 0x8021, 0x8029, 0x8025, 0x8055, 0x8030, 0x8080) |

The ability names for the shared ids (Break Damage Limit, Break HP Limit, Ribbon) equal those the first note gives for Dark Yojimbo; the reader of the pools was re-checked on Dark Yojimbo's row (Counterattack, Magic Counter, Overdrive to AP, Curseproof) and agrees with the first note. Each of the six pays its own item roll and gear roll; Dark Ixion's two fights pay separately (the same file). [bytes]

**Break HP Limit and Break Damage Limit (what they are to this chapter).** Break Damage Limit is on every weapon pool (two of the eight entries) and the guides' "party" assumes it, because 800,000 to 8,000,000 HP is out of reach at 9,999 a hit (the cap rule, `research/re-ffx-damage.md` section 6: 9,999, or 99,999 with Break Damage Limit, or forced by a command's own bit). Break HP Limit is on every armour pool (three of the eight entries). **No move of the six can damage a person by more than 9,999 except through a row whose own cap bit is 99,999**, and every such row except Dark Valefor's Attack, Energy Ray and Sonic Wings carries it (section 5.1); a party at 9,999 HP therefore dies to every Overdrive and to Ifrit's counter on a critical hit whether or not it has Break HP Limit, which is why Jegged calls Break HP Limit unnecessary against them. [bytes] [arith]

## 2. The formations (b)

### 2.1 What the formations hold

Formation block (28 bytes; layout [note: FFX-H02 3.7]), area table of `btl.bin`, launching events. Battle id = (area key << 16) or formation number [note: FFX-G10 3.8].

| Formation | Battle id (hex / decimal) | Area key / stage id | Monster word (slot 0 = actor 20) | Block bytes (voice, byte 1, foot-sound id, in-water) | Battle flag word at launch | Tag |
|---|---|---|---|---|---|---|
| `bsil07_70` | 0x00480046 / 4,718,662 | 72 / 1028 | 0x114E Dark Valefor | 0, 0, 5, 0 | **4096** (0x1000) | [bytes] |
| `bika03_70` | 0x01610046 / 23,134,278 | 353 / 1051 | 0x114F Dark Ifrit | 0, 0, 10, 0 | **1280** (0x500) | [bytes] |
| `kami03_70` (first fight) | 0x012F0046 / 19,857,478 | 303 / 1042 | 0x1150 Dark Ixion | 0, 0, 5, 0 | 1280 | [bytes] |
| `kami03_71` (second fight) | 0x012F0047 / 19,857,479 | 303 / 1042 | 0x1150 Dark Ixion | 0, 0, 5, 0 | 1280 | [bytes] |
| `mcyt00_70` | 0x01540046 / 22,282,310 | 340 / 1046 | 0x1151 Dark Shiva | 0, 0, 6, 0 | 1280 | [bytes] |
| `dome06_70` | 0x02090046 / 34,144,326 | 521 / 521 | 0x1152 Dark Bahamut | 0, 0, 12, 0 | 1280 | [bytes] |
| `mtgz01_70` | 0x01E60046 / 31,850,566 | 486 / 1068 | 0x1153 Dark Anima | 0, 0, 11, 0 | **0** | [bytes] |

Every formation is a zone of weight 0 in the area table (never a random encounter). Every launch uses transition 0 (Screen Shatter). Flag words (decoded as in the first note [note: FFX-G10 3.6]): bit 9 (0x200) is clear in all seven, so **a defeat is a game over**; 1280 has bit 8 (0x100) set, so **no victory pose or fanfare**, and bit 10 (0x400) set, which no checked note decodes; 4096 and 0 leave bit 8 clear, so the victory pose and fanfare play. What the stage ids draw was not read [unproved]. [bytes]

### 2.2 What the formation scripts do

All seven scripts do the same three things and nothing about the AI; the rest of each (two to five workers) is camera work chosen by which aeon is on the field (cursor style, polar camera moves from stream-2 draws) and a few actor-light and fog calls, with no battle effect. [bytes] [disasm: bsil07_70 @0x0003 to 0x0024, kami03_70 @0x0003 to 0x000c, mtgz01_70 @0x0003 to 0x001e] The scripts write: stream-2 draws in camera functions (they shift the stream and are not part of the AI) [note: re-ffx-dark-aeons.md 7].

1. **The memory pin `ct_7126` with the matching aeon's id**: 8 Valefor, 9 Ifrit, 10 Ixion (both formations), 11 Shiva, 12 Bahamut, 13 Anima. The first note section 9 proved (28 triggers, 840 gate checks, 3,000 summon worlds each way, zero differences) that this call pins model data and bars nothing: **the player's matching aeon stays summonable**. A chapter that lets Yuna's own Valefor meet Dark Valefor departs from no rule of the game. [bytes] [note: re-ffx-dark-aeons.md 9]
2. **Escape (0x3003) and Flee (0x3018) are disabled for all characters and aeons in `bsil07_70`, `bika03_70`, `mcyt00_70`, `dome06_70` and `mtgz01_70`; the two Dark Ixion formations disable nothing.** Nothing else is disabled in any of them (Switch, Summon and every other command stay). No script of these formations or of m334 to m339 ends the battle early. [bytes]
3. **The start type.** Six of the seven write `SetAmbushState(Normal)`. **`mtgz01_70` (Dark Anima) writes no start state, so the engine's roll stands**: with no Initiative gear on a character in the battle 191/256 normal, 32/256 preemptive, 33/256 ambush; with Initiative 191 normal, 65 preemptive, no ambush [note: re-ffx-dark-aeons.md 2.2; FFX-G10]. Unlike Dark Yojimbo's first tier, none of the m334 to m339 scripts writes an ambush. [bytes]

### 2.3 Start positions (chunk 3; area 0 first; each position x, y, z) [bytes]

| Formation | Party (3 entries) | Monster slot 0 | Aeon positions |
|---|---|---|---|
| `bsil07_70` | (23.314, 0, -48.214), (3.314, 0, -39.414), (-17.686, 0, -43.414) | (3.314, 0, 30.586) | entries 0 to 6, 10 and 11 the point (-0.866, 0, -45.309); entries 7, 8, 9 equal the three party positions |
| `bika03_70` | (27.012, 0, -30.559), (5.531, 0, -28.426), (-14.359, 0, -31.249) | (-0.513, 0, 57.630) | entries 0 to 6 a cluster round (-0.6 to 3.8, 0, -43.9 to -47.8) |
| `kami03_70`, `kami03_71` (identical) | (26.429, 0, -34.866), (2.545, 0, -27.264), (-18.900, 0, -35.242) | (18.062, 0, 42.870) (slots 1 and 2, unused: (-10.171, 0, 48.135), (-50.939, 0, 52.069)) | entry 0 (-23.532, 0, -35.042), entry 3 (-17.686, 0, -41.414), the rest (-17.686, 0, -61.414) |
| `mcyt00_70` | the same three as `bika03_70` | the same as `bika03_70` | the same as `bika03_70` |
| `dome06_70` | (27.140, 0, -100.082), (4.250, 0, -102.874), (-17.917, 0, -103.023) | (-0.281, 0, -8.961) | entries 0 to 6 the point (0.863, 0, -100.198); 7, 8, 9: (18.314, 0, -97.404), (-2.686, 0, -90.204), (-22.686, 0, -96.204) |
| `mtgz01_70` | (-19.111, 0, -59.940), (-33.775, 0, -38.826), (-48.682, 0, -19.016) | (35.934, 0, 42.831) | entry 0 (-23.532, 0, -35.042), entry 3 (-27.686, 0, -47.414), the rest (-17.686, 0, -61.414) |
| area 1 of `bsil07_70` and `kami03_7x` (raw; which area a battle starts in was not traced) | (8.099, 10, 6.344), (11.099, 13, 9.344), (14.099, 16, 12.344) | five slots at (-38.901, 2 to 6, 7.344) | one aeon position (1.099, 2, -2.656) |

The three party entries are the front line the player enters with: **three party members, never more** (a fourth cannot be on the field; the others are bench and swap in with Switch). A summoned aeon takes the position by its actor id minus 8 [note: re-ffx-dark-aeons.md 2.3]. [bytes]

### 2.4 How the game launches each fight (the field events)

Read from the six launching events [bytes]; the conditions that unlock each one are the guides' [guide], not traced.

| Aeon | Launched from | What the event does | Guide's trigger [guide] |
|---|---|---|---|
| Dark Valefor | `bsvr0000`, one worker, flags 4096 | on a win sets bit 128 of the map's progress word (`v4`), runs the aftermath scenes, and, when the bit-128 words of all eight Dark Aeons' progress variables (`v4` to `v11`) are set, warps to room 223 | at the foot of the slope into Besaid after the airship (Jegged, GG, GF) |
| Dark Ifrit | `bika0300`, one worker, flags 1280 | launches after a text box | the Al Bhed woman at the northern end of the Sanubia desert, by the ruins of Home (Jegged, GG, GF) |
| Dark Ixion | `kami0300`: one worker launches `kami03_70`; **seven collision-zone workers each launch `kami03_71`** | first fight after a lightning flash scene; second fight from one of seven zones | a soldier at a lightning tower in the north of the Thunder Plains; then run to the next strike (Jegged, GF); the first fight resets if the player leaves the plains (GF) |
| Dark Shiva | `mcyt0000`, one worker, flags 1280 | launches after camera and blur scenes | the road to the Macalania temple, from Bevelle onward, no airship needed (Jegged, GG, GF) |
| Dark Bahamut | `dome0600`, flags 1280 | launches `dome06_70` | entering the Beyond, the room of Yunalesca (Jegged, GG, GF) |
| Dark Anima | `mtgz0000`, flags 0 | launches `mtgz01_70` | after repeating Wakka's ball-throwing trial in the Gagazet cave (Jegged, GG, GF) |

The eight Dark Aeons share one finishing rule: a win sets that map's bit 128, and when all eight are set the event warps to room 223 (what room 223 holds, the Penance chapter, was not traced). No script of these formations or of m334 to m339 reads another aeon's state. [bytes]

## 3. The engine facts the scripts lean on

The scripts are the game's bytecode; what they do depends on engine rules the earlier lanes proved. Only those used here are repeated (VA = address in FFX.exe); sections 3 of the first note, `research/re-ffx-ai-seymour.md` and `research/re-ffx-ctb-status.md` give the rest.

- **Hooks.** Each monster file has one AI worker (slot 61) whose function table binds the engine events: onTurn, preTurn, onTargeted, onHit, onDeath. All six bind onTurn, onHit and an onDeath that substitutes the Die command for the death animation; preTurn and onTargeted are empty. Dark Anima's second worker adds an onTargeted motion and an onMove model-hide (presentation only); Dark Valefor's adds a poison motion. [bytes] [disasm: m334 @0x012b, @0x01e9; m339 @0x0165, @0x0290]
- **onHit** is raised once per sub-action per target (a miss, a status-only move and a no-damage move each raise one) and before the death check; **`isCounterattackAllowed()`** is true unless the owner is Petrified, Confused, Berserk, asleep, Ejected or Threatened, there is a last attacker, and that attacker is not itself running a reaction record, so a party counter-attack pays no gain and draws no counter [note: re-ffx-dark-aeons.md 3; re-ffx-ai-evrae-yojimbo-isaaru-sin.md 1.1; VA 0x7A8450]. The six rows are immune to every disabling status but Threaten, which cannot land, so in practice every player action that reaches the monster pays its onHit once. **Dark Anima's onHit has no such gate**: it adds 5 even when the hit is a party counter-attack. [bytes] [run]
- **Random draws.** `GetRandomValue()` is stream 2 masked to 16 bits: modulo 2 and 4 are exact, modulo 3 gives residue 0 on 21,846 of 65,536 and residues 1 and 2 on 21,845 each. `findMatchingChr(front line, alive, 0, any)` is a uniform pick among the living, targetable members of the group in ascending actor number, one stream-4 draw when two or more are candidates and none otherwise [note: re-ffx-dark-aeons.md 3]. **Every single-target move of the six is therefore a one-in-N pick over the front line** (no Provoke, Threaten or memory: all six are immune to Provoke and no script reads the last attacker except Dark Ifrit's and Dark Ixion's counter, which answers the attacker itself). [bytes] [run]
- **Groups and commands.** `FrontlineChars` is every non-monster actor in the battle, a KO'd one included; when an aeon is summoned the parked party leaves, so the front line is the summoned aeon or aeons. `performCommand(group, id)` queues one action against the whole group; with an actor id it targets that actor; it queues only if the owner can act [note: re-ffx-dark-aeons.md 3]. `countChrOverlap(front line, group)` counts the front-line members that are also in the group: `AllAeons` is the set of summoned aeons, and `13` is actor 13, Anima. [bytes] [run]
- **Speed.** Recovery after an action is `tick speed(AGI) x rank`, halved by Haste and doubled by Slow [note: re-ffx-ctb-status.md 1, 2]. Tick speed by AGI plateau: 98 to 169 is 4, 170 to 255 is 3. **A move's rank is its row's `Cmd+0x24` (0 means 3).** [note] [bytes]
- **The HP property write.** The script call that sets a monster's HP (`writeBtlChrProperty(Self, HP, n)`) is the engine's actor-property setter, case 0 of `pp_AtelSetActorProp` (VA 0x7B4B70): it stores `n` as the **current** HP, clears the dead bit if `n > 0`, and does **not** clamp to the maximum HP (which is property 2, a different case). Only Dark Ixion's second fight uses it (section 4.3). [engine]

## 4. The six AIs

Every script is "gauge test, then a draw, then the gauge gain"; all six start the gauge at 0 (no write; the monster set-up writes 0 [note: re-ffx-ai-evrae-yojimbo-isaaru-sin.md 3.1]) and set its maximum to 100 and the bar shown. Common set-up writes (presentation): death animation "boss" (the body stays, then untargetable), returns before the death animation, hit reactions not dulled; Dark Bahamut and Dark Anima also set "Tough" (no delay recoil), Dark Anima "Heavy" (no lift off the ground) and a model scale of 0.7; Dark Valefor sets gravity, floating and a height of -5; one unmapped property (296) is written (Valefor 2,000; the others nothing or 0). **No other write to HP, MP or a stat exists, except Dark Ixion's second fight (4.3).** [bytes] [disasm: m334 @0x0006 to 0x0126; m335 @0x0006 to 0x0105; m336 @0x0018 to 0x0163; m337 @0x00c6 to 0x0105; m338 @0x00c6 to 0x0111; m339 @0x00d8 to 0x0153] [run]

### 4.1 Dark Valefor (m334), `bsil07_70` [bytes] [disasm: m334 @0x012b, @0x01e9] [run]

- **Turn:** gauge 100 or more: gauge := 0, **Energy Blast (0x4128) on the whole front line** (no draw). Otherwise one stream-2 draw, modulo 4: residue 0 (25.000 percent) **Energy Ray (0x403D) on the whole front line**; residue 1 (25.000) **Sonic Wings (0x405D) on one random living front-line member**; residues 2 and 3 (50.000) **Attack (0x4062) on one random living member**; then **+5**, capped at 100. Exact tallies over all 65,536 results. [run]
- **Hit:** if a counter is allowed, **+15**. No counter, no reaction command. [run]
- The gauge fills in 20 of her turns with no hits (her 21st turn is Energy Blast) and in about 5 turns with one allowed hit a turn (20 a turn); about seven allowed hits fill it. [run] [arith]

### 4.2 Dark Ifrit (m335), `bika03_70` [bytes] [disasm: m335 @0x010a, @0x021c] [run]

- **Turn:** if any aeon is on the field the script runs one branch, otherwise the other, and **the two branches do the same thing**: gauge 100 or more: gauge := 0, **Hellfire on the whole front line** (row 0x410D if Anima, actor 13, is on the field, else 0x410C: two rows with identical numbers; the pair differs only in its animation [inferred]); otherwise **Meteor Strike (0x410E) on one random living member, every time**; then **+10**. No draw. [run: Hellfire 100 percent at gauge 100 with or without an aeon; Meteor Strike 100 percent below 100]
- **Hit: if a counter is allowed, Dark Ifrit queues his plain Attack (0x410F) as a reaction against the last attacker, then +5.** [run] The counter is raised for every hit event, so a miss, a Steal and a non-damaging command draw it too; a party counter-attack does not (section 3). [guide: GG, GF agree]
- Gauge: 10 of his own turns, so Hellfire on the 11th with no hits; with one allowed hit a turn (15 a turn) the 8th. [run] [arith]

### 4.3 Dark Ixion (m336), `kami03_70` and `kami03_71` [bytes] [disasm: m336 @0x0168, @0x02c2, @0x0018 to 0x0163] [run]

One file, two scripts: the branch is the battle id (`CurrentBattle()` = 19,857,478 or 19,857,479).

| | First fight, `kami03_70` | Second fight, `kami03_71` |
|---|---|---|
| Set-up | the record as is | **writes current HP 1,300,000, STR 182, DEF 222, MAG 146, MDEF 198** (and leaves max HP 1,200,000, AGI 180, LCK 36) |
| Turn, gauge 100 or more | gauge := 0, **Aerospark (0x4110) on one random living member** | gauge := 0, **Thor's Hammer on the whole front line** (0x4112 if Anima, actor 13, is on the field, else 0x4111: identical numbers) |
| Turn, otherwise | **Thundaja (0x4113) on one random living member** every time; then **+5** | one stream-2 draw, modulo 3: residue 0 (21,846 of 65,536) **Aerospark (0x4116) on one random member**, residues 1 and 2 (43,690) **Attack (0x4115) on one random member**; then **+10** |
| Hit, counter allowed | **Attack (0x4114) as a reaction on the last attacker, then +10** | **+10 only: no counter** |
| Escape and Flee | not disabled | not disabled |

[run: every tally exact] **The second fight's HP.** `kami03_71`'s set-up stores 1,300,000 into the current HP and nothing into the maximum (the maximum stays the record's 1,200,000): by the engine's HP setter (section 3) the fight starts with 1,300,000 to chew through and a bar over 100 percent. Jegged and GameFAQs print 1,200,000 for the second fight (they list the record); StrategyWiki lists 1,200,000 too. **The files win** (the write is read directly), but it is **not proved in play** (it needs the live check of section 8). [bytes] [engine] [unproved]

The first fight's Attack (0x4114) inflicts Armor Break, Mental Break and Sleep (99 turns); the second fight's turn Attack (0x4115) inflicts Armor Break, Mental Break and Confuse. **Both are the only rows of the six with an accuracy formula (2, byte 254, Darkness applies): they can miss**; section 6.2. Dark Ixion's "STR 182, DEF 222, MAG 146, MDEF 198" are the second fight's only stat changes (AGI is not written, so StrategyWiki's "slower in the second fight" has no basis in the bytes). [bytes]

### 4.4 Dark Shiva (m337), `mcyt00_70` [bytes] [disasm: m337 @0x010a, @0x01b2] [run]

- **Turn:** gauge 100 or more: gauge := 0, **Diamond Dust (0x4118) on the whole front line**. Otherwise one stream-2 draw, modulo 3: residue 0 (21,846 of 65,536, 33.334 percent) **Heavenly Strike (0x4117) on one random living member**; residues 1 and 2 (43,690, 66.666) **Attack (0x4119) on one random living member**; then **+10**. [run]
- **Hit:** if a counter is allowed, **+10**. No counter. [run]
- **Rank:** Attack is rank 1, Heavenly Strike rank 2, Diamond Dust rank 3 (section 5.1), so her ordinary turn costs 3 or 6 ticks (AGI 255, tick speed 3): **an average of 4.0 ticks per ordinary turn**, 9 for Diamond Dust. [bytes] [arith] [guide: GG, GF agree that her attacks recover faster]

### 4.5 Dark Bahamut (m338), `dome06_70` [bytes] [disasm: m338 @0x0116, @0x018c] [run]

- **Turn:** gauge 100 or more: gauge := 0, **Mega Flare (0x411A) on the whole front line**. Otherwise **Attack (0x410F, the same row as Dark Ifrit's) on one random living member, every time**; then **+10**. No draw. [run]
- **Hit:** if a counter is allowed, a private counter goes up by one; **on the fifth allowed hit it resets to 0 and Dark Bahamut queues Impulse (0x411B) on the whole front line as a reaction, and the gauge gains 10**; on the other four hits the gauge gains 10 and nothing else happens. So **every allowed hit adds 10, and every fifth also throws Impulse**; a hit that is not allowed (a party counter-attack) counts for neither. [run: 12 hits in a row give Impulse on hits 5 and 10 and the gauge 10, 20, ... 100; alternating allowed and refused hits give Impulse on the ninth hit]
- Ten allowed hits fill the gauge and Mega Flare follows on his next turn; with no hits it is his 11th turn. [run] [arith]

### 4.6 Dark Anima (m339), `mtgz01_70` [bytes] [disasm: m339 @0x0165, @0x0290] [run]

- **Turn:** gauge 100 or more: gauge := 0, **Oblivion (0x411E) on the whole front line** (no addition afterwards). Otherwise one stream-2 draw, modulo 3: residue 0 (21,846 of 65,536) **Mega Graviton (0x4105) on the whole front line**; residue 1 (21,845) **Pain (0x411D) on one random living member**; residue 2 (21,845) **Attack (0x411C) on one random living member**; then **+10**. [run]
- **Hit:** **+5, always** (no counter-attack gate, so even a party counter-attack pays it); no counter. [run: gauge 0 to 5 with the gate true and false]
- Mega Graviton is the row Dark Anima shares with the Sisters (the first note's 0x4105): 7/16 of every target's maximum HP, Doom (section 5.2). [bytes]

### 4.7 Overdrive timelines (arithmetic on 4.1 to 4.6; "own turns" are the aeon's)

| Aeon | Gauge per own turn | per allowed hit | Own turns to the Overdrive, with 0 / 1 / 2 / 3 allowed hits per own turn | Ticks per own turn (AGI, rank) | Tag |
|---|---:|---:|---|---|---|
| Dark Valefor | +5 | +15 | 21st / 6th / 4th / 3rd | 12 (AGI 105, tick 4, rank 3) | [run] [arith] |
| Dark Ifrit | +10 | +5 (and a counter) | 11th / 8th / 6th / 5th | 12 (AGI 124, tick 4, rank 3) | [run] [arith] |
| Dark Ixion, first fight | +5 | +10 (and a counter) | 21st / 8th / 5th / 4th | 9 (AGI 180, tick 3, rank 3) | [run] [arith] |
| Dark Ixion, second fight | +10 | +10 | 11th / 6th / 5th / 4th | 9 | [run] [arith] |
| Dark Shiva | +10 | +10 | 11th / 6th / 5th / 4th | 4.0 average ordinary (3 or 6), 9 for Diamond Dust (AGI 255) | [run] [arith] |
| Dark Bahamut | +10 | +10 (Impulse on every fifth allowed hit) | 11th / 6th / 5th / 4th | 9 (AGI 255, tick 3, rank 3) | [run] [arith] |
| Dark Anima | +10 | +5 (counters included) | 11th / 8th / 6th / 5th | 9 (AGI 183, tick 3, rank 3) | [run] [arith] |

A party member at AGI 255 with Auto-Haste recovers `3 x 3 / 2 = 4` ticks per rank-3 action, so three such members act about two to three times in one turn of an aeon of 9 and about three times in one of 12; each action that reaches the aeon is one allowed hit event however many blows it has. Whether the party gets to act first is the opening counter (first note section 2.2; GameFAQs says Dark Shiva waits the ordinary rank-3 time before her first turn and is fast afterwards [guide: GF], which agrees with every actor's opening counter being its base value). [arith] [note]

## 5. The move rows (c)

All twenty-four rows are in `monmagic1` (92-byte records; layout [note: re-ffx-commands.md 1, 7]; formulas [note: re-ffx-damage.md 2]: 1 Strength against DEF, 3 Magic against MDF, 4 Magic with MDF ignored, 8 fraction of the maximum, 15 MAG cube with no defence). Damage type from flag word 2 (`+0x20` bits 0 and 1): physical halves under Protect, magical under Shell, "neither" under neither. The table below was generated from the table file by a script (nothing transcribed by hand); every element byte (+0x2D) is 0, so **every move of the six is non-elemental**. [bytes]

### 5.1 The rows

Columns: move (id, row) | used by | target byte, usage byte (+0x1A, +0x1B) | type / formula / power / hits | damage classes | crit bonus (+0x27) / shatter (+0x2C) | status chances and durations | extra word (+0x54) | flags | rank (+0x24, 0 reads as 3).

| Move | Used by | Target / usage | Type / formula / power / hits | Classes | Crit / shatter | Statuses (chance), durations | Extra word | Flags | Rank |
|---|---|---|---|---|---|---|---|---|---:|
| Attack 0x4062, row 98 | Dark Valefor, 2 turns in 4 | 0x33, 0x7 | physical / 1 / 20 / 1 | HP | 0 / 10 | none | 0 | always hits, can crit, crit bonus from gear, cap 9,999 (default) | 3 |
| Energy Ray 0x403D, row 61 | Dark Valefor, 1 in 4: whole front line | 0x3b, 0x45 | magical / 3 / 26 / 1 | HP | 0 / 0 | none | 0 | always hits, cap 9,999 (default), unmapped bit 0x40000000 | 3 |
| Sonic Wings 0x405D, row 93 | Dark Valefor, 1 in 4: one | 0x33, 0x45 | physical / 1 / 8 / 1 | HP | 0 / 0 | none | 0 | always hits, Delay Attack, cap 9,999 (default) | 3 |
| Energy Blast 0x4128, row 296 | Dark Valefor, gauge 100: whole front line | 0x3b, 0x45 | neither / 15 / 4 / 1 | HP | 0 / 100 | none | 0 | always hits, cap 99,999, unmapped bit 0x40000000 | 3 |
| Meteor Strike 0x410E, row 270 | Dark Ifrit, every ordinary turn: one | 0x33, 0x45 | magical / 15 / 2 / 1 | HP | 0 / 0 | none | 0 | always hits, Delay Buster, cap 99,999 | 3 |
| Attack 0x410F, row 271 | Dark Ifrit's counter on the last attacker; Dark Bahamut, every ordinary turn: one | 0x33, 0x6 | physical / 1 / 16 / 1 | HP | 25 / 100 | none | 0 | always hits, can crit, cap 99,999 | 3 |
| Hellfire 0x410C, row 268 | Dark Ifrit, gauge 100: whole front line | 0x3b, 0x45 | neither / 15 / 3 / 1 | HP | 0 / 0 | none | 0 | always hits, cap 99,999, unmapped bit 0x40000000 | 3 |
| Hellfire 0x410D, row 269 | the same, when Anima is on the field | 0x3b, 0x45 | neither / 15 / 3 / 1 | HP | 0 / 0 | none | 0 | the same as 0x410C | 3 |
| Thundaja 0x4113, row 275 | Dark Ixion (first), every ordinary turn: one | 0x33, 0x7 | magical / 3 / 200 / 1 | HP | 0 / 0 | none; durations Silence 3 (no chance byte, so nothing lands) | 0 | always hits, Delay Buster, cap 99,999 | 3 |
| Attack 0x4114, row 276 | Dark Ixion (first), counter on the last attacker | 0x33, 0x6 | physical / 1 / 16 / 1 | HP | 0 / 100 | Armor Break 254, Mental Break 254, Sleep 254; durations Sleep 99 | 0 | **accuracy formula 2, byte 254: can miss**, Darkness applies, can crit, crit bonus from gear, cap 99,999 | 3 |
| Aerospark 0x4110, row 272 | Dark Ixion (first), gauge 100: one | 0x33, 0x45 | physical / 1 / 40 / 1 | HP | 0 / 100 | Shell, Protect, Reflect, the four Nuls, Regen, Haste, all at 254, durations 254 each (a cleanse: they are removed) | 0x200 (Auto-Life, removed) | always hits, **cleanse**, cap 99,999 | 3 |
| Attack 0x4115, row 277 | Dark Ixion (second), 2 turns in 3: one | 0x33, 0x6 | physical / 1 / 16 / 1 | HP | 0 / 100 | Armor Break 254, Mental Break 254, Confuse 254 | 0 | **accuracy formula 2, byte 254: can miss**, Darkness applies, can crit, crit bonus from gear, cap 99,999 | 3 |
| Aerospark 0x4116, row 278 | Dark Ixion (second), 1 turn in 3: one | 0x33, 0x45 | physical / 1 / 40 / 1 | HP | 0 / 100 | the same as 0x4110 | 0x200 | always hits, **cleanse**, cap 99,999 | 3 |
| Thor's Hammer 0x4111, row 273 | Dark Ixion (second), gauge 100: whole front line | 0x3b, 0x45 | neither / 15 / 3 / 1 | HP | 0 / 0 | Power Break 254, Magic Break 254, Armor Break 254, Mental Break 254 | 0 | always hits, cap 99,999, unmapped bit 0x40000000 | 3 |
| Thor's Hammer 0x4112, row 274 | the same, when Anima is on the field | 0x3b, 0x45 | neither / 15 / 3 / 1 | HP | 0 / 0 | the same as 0x4111 | 0 | the same as 0x4111 | 3 |
| Attack 0x4119, row 281 | Dark Shiva, 2 turns in 3: one | 0x33, 0x6 | physical / 1 / 16 / 1 | HP | 25 / 0 | Shell, Protect, Reflect, the four Nuls, Regen, Haste at 254 (a cleanse) | 0x200 (Auto-Life, removed) | always hits, can crit, **cleanse**, cap 99,999 | **1** |
| Heavenly Strike 0x4117, row 279 | Dark Shiva, 1 in 3: one | 0x33, 0x45 | physical / 1 / 32 / 1 | HP | 0 / 100 | Death 254, Confuse 254, Berserk 254 | 0 | always hits, cap 99,999 | **2** |
| Diamond Dust 0x4118, row 280 | Dark Shiva, gauge 100: whole front line | 0x3b, 0x45 | neither / 15 / 3 / 1 | HP | 0 / 0 | none | 0 | always hits, cap 99,999, unmapped bit 0x40000000 | 3 |
| Impulse 0x411B, row 283 | Dark Bahamut, every fifth allowed hit: whole front line | 0x3b, 0x45 | neither / 1 / 8 / 1 | HP | 0 / 0 | Petrify 254, Power Break 254, Magic Break 254, Armor Break 254, Mental Break 254, **Slow 255**; durations Slow 254 | 0 | always hits, Delay Buster, cap 99,999 | 3 |
| Mega Flare 0x411A, row 282 | Dark Bahamut, gauge 100: whole front line | 0x3b, 0x45 | neither / 15 / 2 / 1 | HP | 0 / 0 | Shell, Protect, Reflect, the four Nuls, Regen, Haste at 254 (a cleanse) | 0 | always hits, Delay Buster, **cleanse**, cap 99,999, unmapped bit 0x40000000 | 3 |
| Attack 0x411C, row 284 | Dark Anima, 1 in 3: one | 0x33, 0x45 | physical / 1 / 16 / 1 | HP | 20 / 100 | Zombie 254, Petrify 254, Poison 254 | 0x400 (Curse) | always hits, can crit, crit bonus from gear, cap 99,999 | 3 |
| Pain 0x411D, row 285 | Dark Anima, 1 in 3: one | 0x33, 0x45 | magical / 3 / 0 / 1 | none | 0 / 0 | **Death 255** | 0 | always hits, cap 99,999 | 3 |
| Mega Graviton 0x4105, row 261 | Dark Anima, 1 in 3: whole front line | 0x3b, 0x6 | magical / 8 / 7 / 1 | HP | 0 / 0 | Sleep 254, Silence 254, Darkness 254, Slow 254; durations Sleep 99, Silence 99, Darkness 99, Slow 254 | 0x4000 (Doom) | always hits, cap 99,999 | 3 |
| Oblivion 0x411E, row 286 | Dark Anima, gauge 100: whole front line | 0x3b, 0x45 | neither / 4 / 2 / **16** | **HP+MP** | 0 / 0 | Shell, Protect, Reflect, the four Nuls, Regen, Haste at 254 (a cleanse) | 0 | always hits, Delay Buster, **cleanse**, cap 99,999, unmapped bit 0x40000000 | 3 |

**Every row except 0x4114 and 0x4115 carries accuracy formula 0 (always hits), so a data row must set `canMiss: false` on them** (hard rule 5); **0x4114 and 0x4115 must leave it unset** (they roll, section 6.2). [bytes]

### 5.2 Reading the rows

- **Cleanse rows** (flag word 2 bit 5): the status bytes mean "remove this" [note: re-ffx-commands.md 7]. **Aerospark (both), Dark Shiva's Attack, Mega Flare and Oblivion strip Shell, Protect, Reflect, the four Nuls, Regen and Haste** (so a party that cast them has to cast them again; an armour's Auto- version is not removed, [guide: GG, GF]); **Aerospark and Dark Shiva's Attack also remove Auto-Life** (their extra word is the Auto-Life bit); **Mega Flare and Oblivion do not**, so Auto-Life survives them (the guides agree: "except Auto-Life"). Whether the cleanse precedes the death check inside the same hit (so that Auto-Life cannot save the target) was not traced [note: re-ffx-dark-aeons.md 8 item 3]. [bytes] [guide]
- **Impulse inflicts Slow at chance 255**, which by the status rule ignores the target's resist byte (GameFAQs says it gets past an immunity but not past Auto-Haste); Petrify at 254 against the target's byte. The row's own shatter byte is 0, so **GameFAQs' statement that Impulse shatters a member who is already Petrified is not in the row**; whether the status step does it by another path was not traced [inferred], section 7. [bytes] [guide]
- **Mega Graviton** has no cleanse flag, so its extra word **inflicts Doom** (a counter that kills when it ends); it deals `7/16 of the target's maximum HP` (4,374 on a 9,999-HP member; Shell halves it) and inflicts Sleep, Silence and Darkness (duration 99) and Slow at 254. [bytes] [arith]
- **Pain** is formula 3 with power 0 and no damage class: **no damage, Death at 255**, which bypasses a Deathproof or Ribbon byte (the chance 255 rule, [note: re-ffx-biran-yenke.md 2]); the only protections are Auto-Life/Auto-Phoenix after the fact, an aeon's Shield, or not being the target. [bytes]
- **Dark Anima's Attack** inflicts Zombie, Petrify and Poison at 254 and carries the Curse bit; a Petrified target hit by a row with a shatter byte is shattered with that chance (Dark Valefor's Attack 10; Dark Anima's own Attack 100); GameFAQs says her Attack shatters at once, which the byte 100 allows (the order of the Petrify and the shatter inside one hit was not traced). [bytes] [guide: GF]
- **Dark Shiva's Attack and Heavenly Strike** have the fast ranks (1 and 2). [bytes]
- **Dark Ixion's Attack rows 0x4114 and 0x4115** are the only rows of the six with the Darkness bit, which divides the hit term by 10 when the user (Dark Ixion) is Darkened; Darkness is immune on all six, so the bit never acts. [bytes] [note: re-ffx-rng-hit.md 4]
- **Oblivion** is 16 hits of power 2 on HP and MP (formula 4, so the target's MDF is ignored); the cap per hit is 99,999. [bytes]

### 5.3 What the numbers mean against the party (arithmetic on the formulas; no engine was run)

Reference defenders (`research/ffx-mirror-aeons.md` section 4 and `docs/handoff/ch-mirror-aeons.md` section 3: the first chapter's preset, Jegged Stat Maxing's caps, an **estimate**): **a party member with HP 9,999, DEF 255 and MDF 255**, and the aeons the same preset gives Yuna (stats at 600 battles by `research/ffx-combat-core.md` section 6.4: HP Valefor 13,897, Ifrit 16,914, Ixion 17,397, Shiva 15,897, Bahamut 23,880, Anima 27,862, all DEF and MDF 255). Base per hit, variance taken as 1 (the range is the 240 to 271 over 256 draw), cap in force. [arith]

| Move | vs a person (DEF 255) | halved by | vs a person with DEF 200 | Reading |
|---|---:|---|---:|---|
| Valefor Attack | 3,643 | Protect 1,821 | 9,999 (cap) | survivable with Protect and high DEF |
| Valefor Energy Ray (all) | 1,083 | Shell 541 | 3,816 | the guides' "9,999" is the cap for a weak defender |
| Valefor Sonic Wings | 1,457 | Protect 728 | 5,136 | plus a delay |
| **Valefor Energy Blast (all)** | **50,279** (47,136 to 53,225) | nothing | 50,279 | **a KO on everyone; every aeon too** |
| Ifrit Attack (counter) | **9,573** (8,974 to 10,133) | Protect 4,786 | 33,733 | at the cap's edge; a critical hit (crit bonus 25) kills |
| Ifrit Meteor Strike | **21,664** | Shell 10,832 | 21,664 | a KO or a near-KO each turn, plus Delay Buster |
| **Ifrit Hellfire (all)** | **32,497** (30,465 to 34,401) | nothing | 32,497 | a KO on everyone; every aeon too |
| Ixion first: Thundaja | 4,527 | Shell 2,263 | 15,955 | single target, a delay |
| Ixion first: Attack (counter) | 4,901 | Protect 2,450 | 17,273 | **can miss; never lands if Evasion + Luck >= 290** |
| Ixion first: Aerospark | 12,252 | Protect 6,126 | 43,182 | a KO to one without Protect; strips buffs and Auto-Life |
| Ixion second: Attack / Aerospark | 5,420 / 13,550 | Protect 2,710 / 6,775 | 19,100 / 47,750 | as above |
| **Ixion second: Thor's Hammer (all)** | **18,240** (17,100 to 19,308) | nothing | 18,240 | a KO on everyone; kills Yuna's Valefor, Ifrit and Shiva, Ixion on all but the lowest rolls (17,100 to 19,308 against 17,397), not Bahamut or Anima |
| Shiva Attack | 4,655 | Protect 2,327 | 16,404 | strips buffs and Auto-Life |
| **Shiva Heavenly Strike** | 9,310 + **Death 254** | Protect 4,655 | 32,808 | Death at 254 loses to a Death byte of 255 (Ribbon, Deathproof), as the guides say |
| **Shiva Diamond Dust (all)** | **85,123** (79,802 to 90,110) | nothing | 85,123 | a KO on everyone and on every aeon; Auto-Life is not removed |
| Bahamut Attack | **13,221** | Protect 6,610 | 46,589 | a KO to one without Protect |
| Bahamut Impulse (all) | 6,610 | none | 23,294 | plus Petrify, four Breaks, Slow |
| **Bahamut Mega Flare (all)** | **42,742** (40,070 to 45,246) | nothing | 42,742 | a KO on everyone and on every aeon; Auto-Life survives |
| Anima Attack | 3,348 | Protect 1,674 | 11,799 | plus Zombie, Petrify, Poison, Curse |
| Anima Pain | 0 | n/a | 0 | **Death 255** |
| Anima Mega Graviton (all) | 4,374 | Shell 2,187 | 4,374 | 7/16 of maximum HP, plus Sleep, Silence, Darkness, Slow, Doom |
| **Anima Oblivion (all)** | 5,419 x 16 = **86,704** | nothing | the same | a KO on everyone and on every aeon; MP too |

Reading: **every Overdrive exceeds a person's HP several times over and, apart from Thor's Hammer, exceeds every aeon's HP**; the Overdrives are the fights' clocks, and the answers are Auto-Life or Auto-Phoenix, an aeon sent in as fodder (the game's own answer), or killing the aeon before its gauge fills. The guides' figures are of the same size: Energy Blast "around 50,000", Hellfire "around 30,000", Meteor Strike "around 21,500", Thor's Hammer "around 18,000", Diamond Dust "85,000 or so", Mega Flare "around 43,000" and Oblivion "80,000+" [guide: GG, GF, Jegged]. [arith]

## 6. Hit chances (arithmetic on `research/re-ffx-rng-hit.md` section 4)

### 6.1 The party against the six (the party's Attack family, accuracy formula 3, the user's ACC against the target's Evasion)

`index = floor(ACC x 2 / 5) - target EVA + 10`, clamped to 0 to 8, `term = {25, 30, 30, 40, 40, 50, 60, 80, 100}[index]`; `percent = term + user LCK - target LCK` (plus the Aim, Reflex, Jinx and Luck stacks); a hit needs a roll of 0 to 100 below the percent. For a party member with ACC 255 (the preset's cap) the index is 8 against every EVA of these six (EVA 0 to 10), so `term = 100`. With Luck 60 (the preset): Dark Valefor 112, Dark Ifrit 133, Dark Ixion 124 (all more than 100: never a miss), **Dark Shiva 87 (hits 87 in 101)**, **Dark Bahamut 58 (58 in 101)** and **Dark Anima 75 (75 in 101)**. Luck is a cliff, as the first chapter's bench found: at Luck 40 Dark Bahamut is hit 38 times in 101. Magic and Overdrives never miss (formula 0) [guide: GG, GF, StrategyWiki agree that the Luck of Bahamut and Anima is the problem]. [arith] [note]

### 6.2 Dark Ixion's blade against the party (accuracy formula 2, byte 254)

For formula 2, `term = byte - target EVA` with no table and no clamp; `percent = term + user LCK - target LCK` (Dark Ixion LCK 36): `percent = 254 + 36 - EVA - LCK = 290 - (EVA + LCK)`. **A target with Evasion plus Luck of 290 or more is never hit (percent 0 or less)**; this is exactly the total of 290 that GameFAQs gives for a certain dodge. A party member with the first chapter's preset (Evasion 255, Luck 60: 315) is never hit by either of his Attack rows; Yuna's aeons are not that safe (Valefor EVA 209 + Luck 60 = 269: 21 in 101; Ifrit 104 + 60: 126 percent, never missed; Ixion 118 + 60: 112; Shiva 255 + 60 = 315: never hit; Bahamut 226 + 60 = 286: 4 in 101; Anima 226 + 60 = 286: 4 in 101). **The preset's Evasion is an estimate**, so it is a bench lever of the chapter (a party member with Evasion 100 and Luck 60 is hit 130 in 101: always). [arith] [guide: GF]

## 7. Cross-check with the guides: agreement and the conflicts (the files win)

Read on 2026-11-06 in full: the six Jegged pages and the index; the Gamer Guides overview pages; GameFAQs "The Dark Aeons" (version 1.3); StrategyWiki. **No number of the files was changed by a guide.** The stats, HP, AP, steals, drops, gear pools, elements, Overdrive moves and their sizes, the counters and Impulse's count, Dark Anima's magic immunity, the second Ixion fight's missing counter and the swap of Aerospark for Thor's Hammer, Ixion's 290, Shiva's quick ranks and Pain's unblockable Death **agree with the files line for line** (the guides' values for them were compared one by one against sections 1 to 6).

| # | A guide says | The files say | Treated as |
|---|---|---|---|
| G1 | Jegged and GameFAQs (and StrategyWiki): Dark Ixion has 1,200,000 HP in both fights | the second fight writes **1,300,000 into the current HP** and leaves the maximum at 1,200,000 (4.3) | **File wins** (read directly), flagged not proved in play (live check L1) |
| G2 | Gamer Guides: Thundaja hits the whole party | the script aims it at one random living member, and the row's target byte is the single-target one (0x33); GameFAQs says "single-target only" | **File wins, and GameFAQs agrees** |
| G3 | StrategyWiki: Dark Ixion is "slower" in the second fight | AGI is not written; the second fight differs only in HP, STR, DEF, MAG, MDEF and the script | **File wins** |
| G4 | StrategyWiki lists Dark Ixion's Accuracy as 254 | the record's ACC is 250; **254 is the accuracy byte of his two Attack rows** (6.2) | the guide read the row, not the record |
| G5 | GameFAQs: Impulse shatters a Petrified character | Impulse's shatter byte is 0; it inflicts Petrify at 254 and the status step shatters only via a row's own shatter byte; the Bahamut/Dark Aeon Attack rows (0x410F, shatter 100) do | **File wins:** Impulse alone does not shatter; Dark Bahamut's Attack on a Petrified member does (open, live check L2) |
| G6 | Jegged: the Luck of Dark Bahamut and Dark Anima is "extremely high"; GameFAQs: Dark Bahamut's is "quite high" | LCK 102 and 85 (Dark Valefor 48, Ifrit 27, Ixion 36, Shiva 73) | agree in kind; GameFAQs names 102 for Bahamut and no Luck for Anima |
| G7 | Gamer Guides and GameFAQs: Heavenly Strike inflicts KO, Berserk and Confuse, and a Deathproof survivor is still Berserked and Confused | Heavenly Strike inflicts Death, Confuse and Berserk **each at 254 against its own byte**: a Ribbon blocks all three, a Deathproof only the first | agree |
| G8 | GameFAQs: "Gravity (Immune)" in every Dark Aeon's list | the +0x28 bit 1 is "immune to percentage damage" (the engine's fractional), which is what the guides call Gravity | agree |

## 8. What is not proved

1. **No script ran in the real engine.** The bytecode ran in the earlier lanes' interpreter with the real command rows; every [run] line is the script's own. The engine facts around it (the counter gate, the reaction filter, group and target resolution, the opening counters and the tie order) are the earlier lanes' (confidence B) and were not re-proved here.
2. **L1, Dark Ixion's second fight HP (1,300,000 over a maximum of 1,200,000).** Read from the script's write and from the engine's HP setter (no clamp); not seen on a bar. It is a one-battle live check or an engine run of `pp_AtelSetActorProp`; until then the chapter's data cites it as [bytes] and the guides' 1,200,000 as the record's maximum.
3. **L2, whether the cleanse precedes the death check** (Aerospark, Dark Shiva's Attack and the other cleanse rows) and whether Dark Bahamut's Attack on a Petrified member is a shatter: inherited from the first note (its 8 item 3, 6.2).
4. **Which stage a battle draws** (the stage ids 521 to 1068) and which area (0 or 1) a battle starts in; the camera work per aeon is presentation.
5. **The unlock conditions of each fight** (the field events' quest bits) and what room 223 holds after all eight (Penance's chapter): the guides' conditions are cited as [guide] only; the launch sites, flags and the finishing rule are [bytes].
6. **The unmapped values**, named by offset, never reproduced as byte runs (hard rule 8): the monster record's ten text offsets (+0x00 to +0x13) and +0x79 to +0x7F; loot +0x110 and +0x111 (128 in all six); the unmapped property 296 (Dark Valefor 2,000); the +0x1C flag bit 0x40000000 (set on Energy Ray, Energy Blast, Hellfire, Thor's Hammer, Diamond Dust, Mega Flare and Oblivion, but not on Impulse, Mega Graviton, Heavenly Strike or the plain Attacks, so it is **not** "the Overdrive flag": Energy Ray carries it); bit 10 (0x400) of the 1280 battle flag word; the rows' words at +0x10 to +0x15.
7. **[arith] figures** (section 5.3, 6): formulas applied by hand to the preset's stats; no criticals, no Protect or Shell unless stated, variance 1, Cheer and Focus ignored. The bench in the chapter measures the real thing.
8. **Whether the player's aeon of the same name can be summoned against its dark twin in play** is proved at the gate by the first note (section 9) and not seen on screen.

## 9. The fights, for the chapter (facts only; no number proposed)

| Aeon | Where [guide] | The trick | Counters / reactions | What beats it in the guides [guide] |
|---|---|---|---|---|
| Dark Valefor | the slope into Besaid village (after the airship) | her only big move is Energy Blast (about seven allowed hits fill the gauge: hits add 15); every other move is under 9,999 on a defended member | none | Auto-Life or an aeon as fodder; Overdrives (hers are 'always hits', and she dodges little) |
| Dark Ifrit | northern Sanubia, by the ruins of Home | **a counter on every hit** (his Attack, with a crit chance); Meteor Strike every turn (a KO or delay) | Attack on the last attacker | Auto-Haste, Protect, Shell; Auto-Life; an aeon for Hellfire; multi-hit Overdrives so there are few hits |
| Dark Ixion | the Thunder Plains, twice; **can be fled** | first fight: counters with an Attack that can miss (Sleep, Armor and Mental Break) and a single-target Aerospark that strips buffs; second: no counter, Thor's Hammer comes sooner (+10 a turn) | first fight only | Evasion plus Luck of 290 or more; Sleepproof or Ribbon; Auto-Life recast after Aerospark; an aeon for Thor's Hammer |
| Dark Shiva | the road to the Macalania temple | **speed**: AGI 255 and ranks 1 and 2; Heavenly Strike (Death, Berserk, Confuse); Diamond Dust 85,123 | none | Ribbon (or Deathproof, Berserkproof and Confuseproof); Auto-Haste; Auto-Protect; Quick Hit; an aeon for Diamond Dust |
| Dark Bahamut | the Beyond, the Zanarkand Dome | **Impulse on every fifth allowed hit** (Slow 255, Petrify, four Breaks); the highest Luck (102): the party hits 58 in 101 at Luck 60; Mega Flare 42,742 | Impulse | Ribbon or Stoneproof; Auto-Haste; Auto-Protect; counter-attacks do not count towards Impulse (an Evade and Counter or Counterattack party can wear it down); Dispel the Breaks; an aeon for Mega Flare |
| Dark Anima | the foot of Gagazet | **immune to all magic** and **absorbs the four elements**; 8,000,000 HP; Pain (Death 255), Mega Graviton (Doom), Oblivion (about 86,700, MP too) | none (but +5 on every hit, even counters) | Ribbon; Auto-Phoenix; Auto-Haste; physical hitters (Lulu's spells do nothing); an aeon for every Oblivion (the guides count seven) |

Party limits: three on the field (section 2.3); Escape and Flee disabled except for Dark Ixion; the first fight of the game's order is the player's choice (the guides: "in any order"), so the chapter's order is a pick (the plan). [guide] [bytes]
