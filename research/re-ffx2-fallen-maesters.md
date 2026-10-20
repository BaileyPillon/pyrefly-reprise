# FFX-2 Fallen Maesters (Aranea, Black Elemental, Concherer, Chac) read from the game's own files: the rows, the four Via Infinito floor fights, the AI scripts and the Oversoul variants

**Game case: FFX-2 only.** The four monsters are rows of the FFX-2 kernel tables `battle/kernel/monster.bin` (and `monster2.bin`, the Oversoul block): Black Elemental row 69, Aranea row 221, Concherer row 232, Chac row 239. The floor fights are the scenes `stbv09_228`, `stbv09_227`, `stbv09_226` and `stbv09_225`. Nothing here applies to FFX.
Written 2026-10-19 by a sub-agent of the RE parity session for the release driver, who will bring a paper preflight and Bailey's arena and art pick before any build. Part of the `re-parity` track. **Research only: no engine, data or test file is changed.** Nothing in the game folder was changed, the game was not run, and Ghidra (the FFX-2 server on :8090) was used with read-only GETs only.

**What is in this note:** numbers read from the owner's own Steam copy. Monster, item and move names appear only as identifiers (the game's own name tables are how the rows were found). No descriptions, dialogue, script lines, decompiled code or raw byte dumps. Where a developer label matters it is translated in a few words and the file line number is given instead.

**Tags.** **[R]** read from a game file or from the shipped plain-text AI source / compiled script by one of this note's readers (the reader is named); **[E]** emulated or run (nothing in this note); **[I]** inferred from the above or from an earlier checked note, not read directly; **unmapped** the value is given raw and no meaning is claimed (AGENTS.md hard rule 6). Engine rules (how a monster is polled, the two random streams, the search macros, the landing rule for statuses, the damage formulas, the status clock) are taken from the earlier checked notes and are cited as `[note: file section]`.

## Summary for the driver

1. **The four fights are fixed, scripted, once-per-save events on Via Infinito floors 20, 40, 60 and 80** (Aranea, Black Elemental, Concherer, Chac). They are launched by one field-script worker of the map package `stbv0900` after a cutscene; a save-data bit is set after each battle returns, and the same bit gates the fight, so each happens once [R, section 6]. They are optional content (the whole dungeon is), not story. The same four species are also ordinary random encounters in the deepest encounter tables (`99x800`, `99x801`, `99x900`, `99x901`) [R rows; that these tables are the Via Infinito ladder is I, section 5.3].
2. **Records.** Black Elemental Lv 88, HP 9,999, MP 2,380; Aranea Lv 52, HP 18,280, MP 178; Concherer Lv 96, HP 343,280, MP 170; Chac Lv 98, HP 437,850, MP 820 (full tables in section 4). All four null Gravity and are immune to Death, Petrify, Sleep, Silence, Darkness, Poison, Confusion, Berserk, Curse, Slow, Stop and Doom. Black Elemental carries a permanent **Reflect**, Concherer a permanent **Shell and Protect** (record automatic statuses). Chac absorbs Thunder and is weak to Ice. Aranea, Concherer and Chac are immune to every stat stage change, Black Elemental is not.
3. **The AI is small and exactly readable** (sections 7 and 8). Aranea: every 5th poll Gooey End (Poison, Stop, STR and MAG down one stage), otherwise Attack 75 percent and the slow Spider Bite 25 percent. Black Elemental: a poll counter that makes every 3rd poll a Magic Up until it has cast five; otherwise a mix of Berserk, Ultima and Flare, and below a third of its HP a one-in-four Absorb on the girl with the most HP. Concherer: Gunk 25, Megaton Press 25, Attack 50 percent, **until a single result of 10,000 HP or more breaks its shell** (DEF and MDEF drop to 1, and from then on it only Attacks). Chac: a Heaven's Cataract every 6th poll, otherwise Stony Glare on two polls in three, **but a plain Attack only when exactly one girl is alive and unpetrified**.
4. **Five things the wiki-level descriptions do not say.** (a) Chac's Attack and Cataract carry a shatter byte of 100: **a petrified girl who is hit is destroyed** (Death and Eject, 100 in 101) [R + note hit-status 4.4]. (b) Concherer's shell break turns off Megaton Press and Gunk for the rest of the fight. (c) Megaton Press has no defence term and a 99,999 cap: about 55,000 to 62,000 damage, 28,000 to 31,000 with Protect. (d) Heaven's Cataract drops five stat stages (DEF, MDEF, ACC and two unmapped ones) by 10 each, i.e. to the floor of the scale, after about 10,000 damage to each girl (the wiki-level note in the repo names them DEF, MDEF, ACC, Evasion and Luck, so slots 12 and 13 are Evasion and Luck [I]). (e) **Chac is the one of the four with the "a hit does not slow the gauge" bit clear and the "no ATB damage" bit clear** (special word 0x99); the other three have both set. That fits the guides' delay-lock of Chac ("she never gets an attack in", `research/ffx2-combat-core.md` stagger table) [R for the bits, I for the link].
5. **Every one of the four has a second AI and a second stat block, the "Oversoul" version** (scripts `o069`, `o221`, `o232`, `o239`, rows of `monster2.bin`), selected by a global per-family kill counter (Elemental 16, Arachnid 8, Hermit 7, Basilisk 10). The Oversoul scripts carry the same floor-scene time-out blocks as the normal ones, so the version can appear in those scenes [I]. **Which version a floor fight uses depends on that counter at the time, which I could not read** (section 9). This is the main open question.
6. **Via Infinito-wide rules are mostly unread** (section 6.4): no script of the 1,455 monster and scene scripts sets Escape; the launch passes a battle-flags word 1,281 (0x501) that is the same word the Angra Mainyu level-5 launch passes and is unmapped; HP/MP carry-over is not stated in the files. The repo's wiki-level note says every floor has a blue glyph that fully heals and warps out, and that floors 81 to 99 throw the earlier bosses at you as escapable random encounters (`research/ffx2-trema.md` section 1.2, single source for the second part) [not read from the files].
7. **Engine (section 11).** Most of it exists: near-weighted and uniform searches, enemy automatic statuses, stat-stage clamps, the per-result reaction hook, shatter, the 99,999 cap flag. New: the Oversoul kill counter and switch, a per-result damage amount for Concherer's shell break, writing DEF and MDEF through the adapter, and the item/gil reads of the Oversoul scripts. No build is proposed here.
8. **Open questions and the live checks that settle them are in section 12.** The first live check to make is "which version of each floor boss do I get with my save" (a Lv 99 save at Bevelle - Via Infinito has fought many of every family).

## 0. Result in one screen

| Row (0-based) | Id | Name in the game's own table | Fixed fight | Lv | HP | MP | AGI |
|---|---|---|---|---:|---:|---:|---:|
| **69** | 0x1045 | Black Elemental | floor 40, scene `stbv09_227` | 88 | 9,999 | 2,380 | 255 |
| **221** | 0x10dd | Aranea | floor 20, scene `stbv09_228` | 52 | 18,280 | 178 | 72 |
| **232** | 0x10e8 | Concherer | floor 60, scene `stbv09_226` | 96 | 343,280 | 170 | 155 |
| **239** | 0x10ef | Chac | floor 80, scene `stbv09_225` | 98 | 437,850 | 820 | 164 |

Source for the table: `monster.bin` rows at file offsets 0x3608, 0xacc8, 0xb560, 0xbad8 [R: `ffx2-monster.mjs`, the earlier lane's parser; fields printed here are the same in all ten locale copies from byte 8 on]. Floors from the event package (section 6.2).

## 1. Source block

| Item | Value |
|---|---|
| Archive | `FFX2_Data.vbf` (Steam HD Remaster, FFX-2 half; the owner's own install, build 25501027; the file's SHA-256 starts b041a507c22de62a) read with our own VBF reader (`D:\Tools\rea\tools\vbf.mjs`), never unpacked outside `D:\Tools\ffx-parity` |
| Kernel tables [R] | `ffx_ps2/ffx2/master/jppc/battle/kernel/monster.bin` (96,596 bytes, SHA-256 starts 50964278e7b164e6), `monster2.bin` (87,842; 9327e6571d2f92ac), `oversoul.bin` (726; 452649ec7b478c5b), `btl.txt` (781,815; a2a9d7e0a28559f7), `monmagic.bin` (85,222; 35b432bbbec34bac), `command.bin` (90,359; 6099fcff08194360); the English copy `new_uspc/battle/kernel/monster.bin` (119,716; 1831faed8e5c6f5b) carries the name text. The same files and table shape as in `re-ffx2-angra-mainyu.md` section 1 (370 rows of 200 bytes, row *i* at `0x20 + 200 i`) |
| Locale copies [R] | bytes 8 to 199 of rows 69, 221, 232 and 239 are identical in all ten locale copies of `monster.bin` and of `monster2.bin` (only the name and help references differ) |
| AI sources [R] | `battle/mon/m069.src` (5,945 bytes; SHA-256 starts f9e2c1d2caecbda5), `m221.src` (2,149; d1f53cd9ecee32c7), `m232.src` (2,820; 14bbe4a0efb5cf71), `m239.src` (2,369; 620f3420c532e7de); the Oversoul scripts `o069.src` (3,095; 1ac6ed4724f67370), `o221.src` (4,393; 9715d4acf3006db5), `o232.src` (4,376; 94bd9d1c4bfd220f), `o239.src` (3,867; ec4026e62ab066c2); the shared macros `y_mon01.src` (15,343; bc9a0eb56e907083); the presentation siblings `mt*.src`, `mf*.txt` and `_m*/mm*.src` (motion only, not read further) |
| Compiled packages [R] | `battle/mon/_m069/m069.bin` (34,592 bytes; ecd3bee300a00eab), `_m221/m221.bin` (93,040; 43c4bf6094701f0c), `_m232/m232.bin` (172,720; 4814085b31c89262), `_m239/m239.bin` (65,248; b002e28fbc9f2020); disassembled with the earlier lane's disassembler (`x2dis.mjs`, kept outside the repo). Each package holds three workers: **worker 0 is the Oversoul script, worker 1 the normal script, worker 2 the motion script** (the layout of `re-ffx2-ai-fallen-trema.md` 1.4) |
| Scenes and formations [R] | `battle/kernel/btl.txt` with `battle/header/monster.ath` (symbols) and `battle/kernel/btl.h` (scene constants); `battle/btl/stbv09_225..229/` (the compiled scene packages, 10,148 bytes each for 225 to 228; the `pos_` entries of 225 to 228 are empty, Trema's is 398 bytes) |
| Floor event [R] | `event/obj/st/stbv0900/stbv0900.ebp` (the Via Infinito boss-floor map script), read with the earlier lane's event disassembler (`ev-dis.mjs`) and its argument-count table |
| Engine facts [R] | Ghidra on the older copy (:8090, read-only GETs), D addresses (the live build's battle code is byte-identical, 0x20 to 0x30 lower): the monster KO resolver `pp_ko_resolve` D 0x6424e0, the Oversoul counter add D 0x61c1a0, the Oversoul switch check D 0x61c290 (called from `pp_atb_chr_step` at D 0x634c3d), the Oversoul flag setter D 0x61c650, the character rebuild D 0x626940, the stat getter `pp_btl_get_stat` D 0x637420; the counter table is at D 0xe01640 |

Checks made on the sources: for all eight scripts the set of command ids the source queues equals the set in the compiled worker (m-scripts against worker 1, o-scripts against worker 0), and the `random() % n` moduli are the same in source and binary (Black Elemental 4, 2, 2, 3 repeated; Aranea 4; Concherer 4; Chac 4 and 3; the Oversoul scripts 4 and 5, 9, 5, 7) [R: `cmpbin.mjs`, kept outside the repo]. The thresholds of Black Elemental's normal worker (turn counter 3, Magic Up count 4, max HP divided by 3) and Chac's (counter 6, the alive-minus-petrified test) were read side by side in the disassembly and are equal.

## 2. How the rows were identified

1. **The game's own name table** (English copy): row 69 decodes to Black Elemental, 221 to Aranea, 232 to Concherer, 239 to Chac; no other row of either table carries these names [R].
2. **The formation table** `btl.txt`: the four monster symbols (developer labels, translated: Elemental 7, Spider 2, Snail Boss 2 and Basilisk 3) sit alone in the formation rows `stbv09_227`, `_228`, `_226` and `_225` (section 5) [R].
3. **The AI source headers** carry the same developer names (the sources are named for the symbols above) and the motion siblings name the species (`mm239.src` says Basilisk, `mm232.src` the snail boss) [R].
4. **Cross-check against the ability list.** The record's technique list (+0x70) equals the AI's command set for Black Elemental only; for the other three it differs in the way section 4.3 shows. The AI's own ids (verified in the compiled worker) are the ones used in this note [R].

## 3. Column map

The column map is the one of `re-ffx2-angra-mainyu.md` section 3 (offsets from the start of the 200-byte row: +0x08 HP, +0x0c MP, +0x10 level, +0x11 to +0x18 STR, DEF, MAG, MDEF, AGI, ACC, EVA, LCK; +0x19 thinking byte (never read); +0x1a special word; +0x1c to +0x1f absorb, null, half, weak element bytes (bit 0 Fire, 1 Ice, 2 Thunder, 3 Water, 4 Gravity, 5 Holy); +0x20 group-1 and +0x38 group-2 resist bytes (255 immune); +0x50 and +0x54 automatic-status masks with their amounts from +0x58; +0x70 ability list of 16 u16; +0x98 Oversoul type; +0x9c EXP, +0xa0 Gil, +0xa4 Pilfer Gil figure, +0xa8 AP, +0xaa drop chance byte, +0xab steal chance byte, +0xac drop items, +0xb4 steal items, +0xbc bribe items (common id, count, rare id, count), +0xc4 the Zantetsu byte). The special word bits the game's `monster.h` names: bit 0 ratio (immune to percentage formulas), bit 1 damage-not-stop, bit 6 inv-atb (takes no ATB damage), bit 7 disable-Zantetsu, bit 8 Bribe, bit 9 magic-cancel (immune to Interrupt); bits 3 and 4 have no name in the header. Group-2 stage slots: 7 STR, 8 MAG, 9 DEF, 10 MDEF, 11 ACC [note: damage 1 and leblanc-den-ixion 2 for 7, 9, 11; the Magic Up and Glimmer of Despair rows write slot 8 and 10 as MAG and MDEF, I], 12 and 13 unmapped in the files (the wiki-level list of Heaven's Cataract in `research/ffx2-trema.md` section 1.2, "Def, MDef, Acc, Eva, Luck", makes them Evasion and Luck [I]).

## 4. The rows (`monster.bin`; every proved column)

### 4.1 Numbers

| Field | **Black Elemental (69)** | **Aranea (221)** | **Concherer (232)** | **Chac (239)** |
|---|---:|---:|---:|---:|
| File offset of the row | 0x3608 | 0xacc8 | 0xb560 | 0xbad8 |
| Level | 88 | 52 | 96 | 98 |
| HP | 9,999 | 18,280 | 343,280 | 437,850 |
| MP | 2,380 | 178 | 170 | 820 |
| STR / DEF | 11 / 250 | 74 / 44 | 152 / 122 | 254 / 152 |
| MAG / MDEF | 255 / 254 | 63 / 12 | 163 / 122 | 88 / 166 |
| AGI / ACC / EVA / LCK | 255 / 95 / 0 / 3 | 72 / 95 / 0 / 16 | 155 / 95 / 0 / 8 | 164 / 95 / 0 / 14 |
| Thinking byte (never read) | 30 | 0 | 0 | 0 |
| Special word | 0x253 | 0x25b | 0x2db | 0x99 |
| Special bits set | 0, 1, 4, 6, 9 | 0, 1, 3, 4, 6, 9 | 0, 1, 3, 4, 6, 7, 9 | 0, 3, 4, 7 |
| Element bytes (absorb / null / half / weak) | 0 / **0x10** / 0 / 0 | 0 / **0x10** / 0 / 0 | 0 / **0x10** / 0 / 0 | **0x04** / **0x10** / 0 / **0x02** |
| Reading | null Gravity | null Gravity | null Gravity | **absorbs Thunder**, null Gravity, **weak to Ice** |
| Automatic status, group 1 mask | 0 | 0 | 0 | 0 |
| Automatic status, group 2 mask / amount | **0x4 (slot 2, Reflect)** / 127 | 0 | **0x3 (slots 0 and 1, Shell and Protect)** / 127 each | 0 |
| Oversoul type | 0xa006 Elemental | 0xa00b Arachnid | 0xa008 Hermit | 0xa014 Basilisk |
| EXP / Gil / Pilfer Gil figure | 770 / 380 / 1,000 | 4,000 / 800 / 2,200 | 6,000 / 1,200 / 3,000 | 2,200 / 750 / 3,300 |
| AP | 1 | 1 | 1 | 1 |
| Drop chance byte | 255 | 255 | 255 | 255 |
| Drop, common / rare | Mana Tonic x1 / Tetra Gloves x1 | Stamina Tonic x1 / Mythril Bangle x1 | Blessed Gem x1 / Crystal Gloves x1 | Shining Gem x1 / Pixie Dust x1 |
| Steal chance byte | 64 | 64 | 64 | 64 |
| Steal, common / rare | Ether x1 / Rune Bracer x1 | Turbo Ether x1 / Kinesis Badge x1 | Elixir x1 / Elixir x2 | Ether x1 / Ether x2 |
| Bribe slots (the Bribe bit is clear on all four) | Arcane Lore x1 / x1 | Black Lore x5 / Sword Tome x8 | White Lore x28 / Bushido Tome x30 | Supreme Gem x3 / Supreme Gem x6 |
| Zantetsu byte | 30 | 80 | 200 | 90 |
| Model id / motion-set id | 0x1045 / 0x1044 | 0x10dd / 0x1084 | 0x10e8 / 0x109b | 0x10ef / 0x1058 |

Steal rule [note: re-ffx2-ai-leblanc-den-ixion.md 1.9]: a success is `draw % 255 < byte`, so a byte of 64 succeeds 25.1 percent of the time on each attempt, the rare slot is taken on 12.5 percent of successes. The Pilfer Gil figure pays 50 to 100 percent of itself, once. Drop byte 255 always drops (common or rare slot by the drop rule of the same note).

### 4.2 Status resist bytes (255 = immune; every index not listed reads 0 and so lands)

**Group 1** (index meanings [note: hit-status 4; 17 and 18 are Itchy and Auto-Life, valefor-ai 7.1]): 255 at **0 Death, 1 Petrify, 2 Sleep, 3 Silence, 4 Darkness, 5 Poison, 6 Confusion, 7 Berserk, 8 Curse, 17 Itchy, 18 Auto-Life** on all four. **10 Eject** reads 100 (Black Elemental), 100 (Aranea), 255 (Concherer), 90 (Chac). Index 9 (Defense), 15 (Always Critical) and the unmapped indexes read 0.

**Group 2:**

| Row | 255 at | Reads 0 (lands) |
|---|---|---|
| 69 Black Elemental | 5 Slow, 6 Stop, 14 Doom | Shell, Protect, **Reflect**, Regen, Haste, **all seven stat stages (7 to 13)**, and 15 to 17 |
| 221 Aranea | 5 Slow, 6 Stop, **7 to 13 (every stat stage)**, 14 Doom | Shell, Protect, Reflect, Regen, Haste |
| 232 Concherer | the same as Aranea | the same as Aranea |
| 239 Chac | the same as Aranea | the same as Aranea |

A command whose chance byte is 255 lands even through a resist of 255 (the landing rule, [note: hit-status 4.1]); one at 254 does not. So **Chac's Stony Glare (row 0x401c, Petrify at 255) turns a girl to stone even if her own resist byte for Petrify is 255**, Gooey End's Poison and Stop (254) do not get past a resist of 255, and Aranea's STR and MAG stage drops (255) do.

### 4.3 Ability lists (+0x70) against the commands the AI queues

| Row | The record's list (in order) | What the compiled AI queues (worker 1) | Difference |
|---|---|---|---|
| 69 Black Elemental | 0x304b Absorb, 0x406a Berserk, 0x41dd Magic Up, 0x3171 Ultima, 0x3170 Flare | the same five | none |
| 221 Aranea | 0x40c7 Spider Attack, 0x40c9 Gooey End, 0x40ca Spider Bite | 0x4003 Attack, 0x40ca Spider Bite, 0x40c9 Gooey End | the list holds Spider Attack (0x40c7); the AI uses a different Attack row (0x4003) |
| 232 Concherer | 0x400e Attack, 0x40ba Megaton Press, 0x40b9 Gunk, 0x40bd Die, 0x40bc Broken shell 2 | 0x400e, 0x40ba, 0x40b9, 0x40bb Broken shell | the list holds Die (0x40bd) and "Broken shell 2" (0x40bc); the reaction queues "Broken shell" (0x40bb) |
| 239 Chac | 0x400e Attack, 0x401c Stony Glare, 0x41fc Heaven's Cataract | 0x400e, 0x401c, **0x405a Heaven's Cataract** | the list holds the milder Cataract row (0x41fc: power 14, steps -1, no MP, no 99,999 bit); the AI queues the strong one (0x405a: power 58, steps -10, 12 MP, cap 99,999) |

The AI ids are what is queued (verified in the compiled worker), so the numbers below use them. What the technique list of a record is read for (Libra, the bestiary, capture) is not traced; **the list is not the AI's command set** for three of the four [R].

### 4.4 The Oversoul block (`monster2.bin`, same rows)

Used when the Oversoul switch rebuilds the monster from the second block (section 9.1).

| Field | **Black Elemental (69)** | **Aranea (221)** | **Concherer (232)** | **Chac (239)** |
|---|---:|---:|---:|---:|
| Level / HP / MP | 99 / 10,998 / 2,380 | 62 / 33,394 / 178 | 99 / 360,444 / 170 | 99 / 459,743 / 820 |
| STR / DEF / MAG / MDEF | 11 / 250 / 255 / 254 (as normal) | 104 / 44 / 93 / 12 | 152 / 122 / 163 / 122 (as normal) | 254 / 152 / 88 / 166 (as normal) |
| AGI / ACC / EVA / LCK | 255 / 95 / 0 / 4 | 115 / 95 / 0 / 20 | 202 / 95 / 0 / 10 | 213 / 95 / 0 / 18 |
| Special word | 0x253 (as normal) | 0x25b (as normal) | 0x2db (as normal) | 0x99 (as normal) |
| Element bytes | null Gravity | null Gravity | null Gravity | absorb Thunder, null Gravity, weak Ice (as normal) |
| Automatic status g1 | 0x2000 (slot 13, the Spellspring "Use MP 0" status [note: fallen-trema 1.2]) | 0x2000 | 0x2000 | 0x2000 |
| Automatic status g2 | none (**no Reflect**) | none | 0x3 (Shell, Protect), 127 | none |
| Resist differences from the normal row | Eject 110; stage slots: only 8 (MAG) is 255 | Eject 110 | as normal | Eject 120 |
| EXP / Gil / Pilfer / AP | 1,200 / 1,200 / 1,800 / 2 | 7,500 / 2,500 / 4,200 / 2 | 9,000 / 3,000 / 6,300 / 2 | 950 / 2,200 / 5,300 / 2 |
| Drop (common / rare) | Mana Tonic x2 / Tetra Guard x1 | Stamina Tonic x2 / Crystal Bangle x1 | Crystal Gloves x1 / Crystal Gloves x2 | Shining Gem x2 / Crystal Ball x1 |
| Steal chance byte; items | 32; Ether x1 / Rune Bracer x2 | 32; Turbo Ether x2 / Kinesis Badge x2 | 32; Elixir x1 / Elixir x2 | 32; Ether x1 / Ether x2 |
| Bribe | Arcane Lore x1 / x2 | Sword Tome x10 / x16 | Bushido Tome x30 / x40 | Supreme Gem x10 / x12 |
| Zantetsu byte | 40 | 100 | 220 | 120 |
| Record list | 0x30be Full-Cure, 0x30b6 Regen, 0x30ad Firaga, 0x30b0 Waterga, 0x30ae Blizzaga, 0x30af Thundaga, 0x3171 Ultima | 0x4003, 0x419b Tempus Laxit, 0x41d7 Dual Catalyst, 0x40ca, 0x30ad, 0x30b0, 0x30ae, 0x30af, 0x418e 10000 Gil Smoosher | 0x400e, 0x41b0 Slurp, 0x3082 Demi, 0x41a6 Radular Grudge, 0x30af, 0x3170, 0x40bc, 0x40bd | 0x4175 Hunter's Gaze, 0x41df Attack, 0x4173 Destroy Soft, 0x4172 MP Break, 0x4058 Stony Glare (254), 0x4174 Destroy Remedy |

[R: `monster2.bin` rows at the same offsets; the Oversoul Paragon's block is the earlier precedent, `re-ffx2-ai-fallen-trema.md` 1.4.] The Oversoul rows' AI command sets are those of `o069`, `o221`, `o232`, `o239` (section 9); for Aranea and Chac the record list again differs from the script (Chac's list holds Stony Glare 0x4058 at chance 254, the script queues 0x401c at 255).

## 5. The formations and the scenes

### 5.1 The floor rows (`btl.txt`; file lines are 1-based) [R]

| Formation row | Name | File line | Scene constant | Slot 1 | Model scale | Battle map (translated label) | Six flag columns |
|---|---|---:|---|---|---:|---|---|
| 1889 | `stbv09_228` | 1901 | 0x034800e4 | row 221 Aranea | 125 percent | artificial-parts map, set b | all clear |
| 1890 | `stbv09_227` | 1902 | 0x034800e3 | row 69 Black Elemental | 200 percent | the same | all clear |
| 1891 | `stbv09_226` | 1903 | 0x034800e2 | row 232 Concherer | 115 percent | the same | all clear |
| 1892 | `stbv09_225` | 1904 | 0x034800e1 | row 239 Chac | 150 percent | the same | all clear |
| (1888 Trema `stbv09_229`, 1893 Paragon `stbv09_224`) | | 1900, 1905 | 0x034800e5, 0x034800e0 | rows 295, 152 | 100 | the same | all clear |

* **Each floor fight has one enemy: no adds, no companions.** The remaining monster slots hold -1 (empty) in all four rows [R].
* The scale before the monster symbol is a model scale in percent [note: angra-mainyu 7: "the model scale before each monster symbol"]; the Black Elemental is drawn at twice its size.
* The six flag columns that follow the name are all clear in these rows and in every other story boss row read (Angra Mainyu, Trema, Paragon, the Fallen Aeons, Ixion, Vegnagun's links); the ordinary encounter rows of the same file set exactly one of them (for example `bsil07_000`, `99x800_004`). Their meaning is **unmapped**. The seventh column reads 0 everywhere, and the two numbers after the map label read 30, 0 in these rows and 30, 1 in the ordinary `99x` rows (also unmapped).
* **The scenes are templates** (10,148 bytes each; the four packages differ in 9 to 12 bytes, the scene's own number and a stamp), their `scn_` script includes only the shared light script and halts, and the `pos_` entry is empty: **no start positions are shipped for the four floors**, unlike Trema's scene (party at (30, 0, 0), (25, 0, 18), (25, 0, -18); enemy at (-25, 0, 0)). The default placement of the battle map (the developer label translates as "artificial parts, set b", shared by every `stbv09` row) is therefore what the fight uses [R; the default positions themselves are not read].
* Rows with the same species elsewhere: the test rows `zzzz00_69` (row 71, file line 83), `zzzz02_21` (223, line 235), `zzzz02_32` (234, line 246) and `zzzz02_39` (241, line 253) hold one monster each on the test map; and the **ladder rows of section 5.3**.

### 5.2 Context: the rest of the `stbv09` family [R]

`stbv09_229` Trema (m295), `_224` Paragon (m152), `_223` Tonberry (m114), `_222` Elder Drake (m57, scale 200), `_221` Tonberry (m114) with Mega Tonberry (m115, scale 400). The Paragon and Trema launches are in the same worker as the four floors (section 6.2); the three others are launched by the maps `stbv1000` to `stbv1400` and are not part of this chapter.

### 5.3 The same species in the ordinary encounter ladder [R rows; the reading is I]

`btl.txt` has 144 rows named `99xNNN_MMM`, in 29 families whose monsters get steadily stronger: `99x000` (Divebeak, Ahriman, Quadricorn, Nashorn ...), `99x001` and `99x002` (Boris, Yellow, Red and White Elemental, Behemoth, Guardian Beast ...), `99x100` (Gold Elemental), `99x301` (Blue Elemental, Gucumatz), `99x600` (Dark Elemental), up to the last four families:

| Family | Species in it (level) |
|---|---|
| `99x800` (7 rows) | Lacerta (72), **Chac (98)**, Mushroom Cloud (81), Elder Drake (62), **Aranea (52)**, **Black Elemental (88)**, **Concherer (96)** |
| `99x801` (7 rows) | Lacerta, Insect Matriarch (78), Critical Bug (78), Elder Drake, Aranea, Black Elemental, Concherer |
| `99x900`, `99x901` (8 rows each) | Lacerta, Mushroom Cloud, Black Elemental, Elder Drake, Insect Matriarch, Critical Bug, Aranea, Concherer (some paired with a second monster) |

No field map names these scene constants: only the debug package `testbattle` names the first id of the `99x800`, `99x801`, `99x900` and `99x901` families (0x03b40000, 0x03b50000, 0x03ba0000, 0x03bb0000) and none of the 3,496 scanned event, battle and monster packages names any other id of those four families (the range scanned was 0x03b00000 to 0x03bfffff, which holds exactly these four families; the lower families were not scanned) [R: `scan-ints.mjs`]. They carry the ordinary-encounter flag pattern. **I read them as the Via Infinito's random-encounter ladder (one family per band of floors, the deepest bands holding these four species)** [I]. The repo's wiki-level note agrees on the last bands: "floors 81 to 99 also throw the earlier bosses at you as random encounters, which you can escape" (`research/ffx2-trema.md` section 1.2, single source). The SinirothX formation table that note cites also lists the floor scenes as "Bevelle - Secret Dungeon, BOSS 224-229", the rows read here. If that is right, Aranea, Black Elemental, Concherer and Chac also appear as ordinary encounters on the late floors, with the same rows and scripts as the floor fights; only the scene differs (the time-out block of section 7.6 is armed in the `stbv09` scenes only). The launcher that picks a family from the floor was not found (a computed id) and is **unread**.

## 6. Via Infinito rules: what the floor implies

### 6.1 The package

`event/obj/st/stbv0900/stbv0900.ebp` has 38 workers. **Worker 31 is the boss-floor script.** It reads: `v6`, a save-data value at offset 0x14c (the floor counter [I]); `v9`, two save-data bytes at 0x170 and 0x171 (one bit per fight, below); `v19`, an event-local byte (0x21) that another worker sets; `v0`, a save-data stage marker at 0xa6e that takes the values 2, 3, 7 to 12 around the fights; `v4`, a save-data byte at 0xf0c that is 1 during the Paragon fight [R: `ev-dis.mjs --vars`].

### 6.2 What is launched on which floor [R]

The script has two entries. **Entry A** switches on `v6` (the floor counter) with the cases 20, 40, 60, 80 and 100 and plays the full cutscene before the battle. **Entry B** switches on `v19` with the cases 20, 80, 99 and 100 and jumps straight to the launch of the same four fights (no case for 40 and 60). What sets `v19` was not traced. In each fight the battle-flags call (event call id 0x14a with arguments 1,281, 0, 0) comes first, then the battle launch (call id 0x7002, which the earlier lane's notes name `btlExe`) with the scene constant and a second argument 0.

| Floor | Scene (constant) | Gate: bit tested before the cutscene | Bit set after the battle returns | Offset of the launch |
|---|---|---|---|---|
| 20 | `stbv09_228` Aranea (0x034800e4 = 55,050,468) | save byte 0x170, bit 3 (0x08) clear | the same bit | 0xa596 |
| 40 | `stbv09_227` Black Elemental (55,050,467) | 0x170, bit 5 (0x20) clear | the same bit | 0xae10 |
| 60 | `stbv09_226` Concherer (55,050,466) | 0x170, bit 7 (0x80) clear | the same bit | 0xaf6f |
| 80 | `stbv09_225` Chac (55,050,465) | 0x171, bit 1 (0x02) clear | the same bit | 0xba1f |
| 99 / 100 | `stbv09_224` Paragon (55,050,464) | 0x171, bit 3 (0x08) clear | the same bit | 0xbe28 |
| 100 | `stbv09_229` Trema (55,050,469) | (after the Paragon sequence) | 0x171, bit 4 (0x10), at the end | 0xd3ba |

* **They are fixed encounters: yes, one fight per floor, once per save.** The gate bit is set on the first line after the battle call returns, before any cutscene that follows, and nothing in the worker tests the battle's outcome first, so a fight that was **fled or lost** (if that can happen, section 6.4) would still set the bit if the call returned [R; I for what a defeat does: the package has no game-over code, so the engine must handle it].
* Floor 100 also holds a second launch of the Paragon with battle flags 0 (offset 0x30f8, worker 20; its init tests the Trema bit and floor 100, and a roll of 0 to 99 in front of it only chooses between two lead-ins) [R for the offsets, I for the gate]; it is outside this chapter.
* **Story or optional:** the Via Infinito is the Chapter 5 optional dungeon [candidates note, W and J]; nothing in the package ties the four floors to a story marker other than the stage marker `v0` they write.

### 6.3 What the launch passes

The battle-flags word is **1,281 (0x501) before each of the six scripted boss launches** and 0 before the one post-Trema Paragon rematch. The same word 1,281 is passed by the Angra Mainyu level-5 launches [note: angra-mainyu 9.3], and its bits are **unmapped** there too. Its handler (event call 0x14a) was not located in the engine, so what the bits do (Escape, intro, music, rewards) is not read.

### 6.4 Via Infinito-wide rules: what was checked, and what is unread

| Question | Answer from the files |
|---|---|
| Are floors 20, 40, 60, 80 fixed encounters? | **Yes**, section 6.2 [R]. |
| Is the party carried over (HP and MP not restored between floors)? | **Not stated in the files.** The package launches the battle straight from the cutscene with no call I could name that heals; the field funcspace has no name table, so a restore among the unnamed calls cannot be excluded. FFX-2 keeps HP and MP between battles unless something restores them [I, general behaviour of the game, not read here]. The repo's wiki-level note (`research/ffx2-trema.md` section 1.2: wiki, GamerGuides and NightMare185) says **every floor has a blue glyph that fully heals and can warp the party out**, and that the Paragon-to-Trema step is the one place with no heal [not read from the files]. The live check is cheap (section 12). |
| Is Escape allowed? | **Unread for the four floor fights.** (The wiki-level note says the random encounters on floors 81 to 99 can be escaped; it says nothing about the floor fights.) No monster or scene script of the archive sets the escape mode (a scan of 1,455 scripts: every `m###.src`, `o###.src`, `scn_*.src`, `evt_*.src`); the formation rows carry no distinguishing flag (all clear, as for every other story boss); the launch word 1,281 is unmapped. |
| Items, dressphere changes | **Unread.** Nothing in the four AI scripts, the scene scripts or the launch limits them; the Oversoul scripts of Aranea and Chac read the party's gil and items (section 9.3). |
| Moogle statues, save spheres, any dungeon-wide rule set by the field scripts | **Unread.** Only the boss-floor worker was read; the other 37 workers of `stbv0900` and the maps between floors were not. |
| Party | The three girls in the party slots (Yuna, Rikku, Paine); the floor scenes ship no party rule [R, section 5.1]. |

## 7. The AI scripts (normal versions, worker 1)

### 7.1 Engine rules used

How a monster is polled, the random streams, the search macros and the generic "battle too long" block are as in `re-ffx2-ai-bahamut-vegnagun.md` 1.1 to 1.7 and `re-ffx2-ai-fallen-trema.md` 1. In short: a poll is one call of the action entry; **`random() % n`** uses stream 2 (the low 16 bits of one draw); **`searchr`** keeps the living, targetable girls (a petrified girl counts as living) who pass the stat test and picks one near-weighted by distance and facing, stream 4, **`searchr_nop`** picks uniformly in slot order, stream 4; with one candidate nothing is drawn; no candidate gives "nothing"; `max` keeps all candidates tied for the extreme [note: leblanc-den-ixion 1.3]. A group stat read (`getstat` of the party group) **returns a count of the members for which the flag is set** (alive: not flagged dead; stone: petrified) [R: the stat getter D 0x637420, flag stats add one per member and return the sum]. The reaction entry runs once per result applied to the monster, after the HP and statuses are in, and sees the HP damage of that result [note: bahamut 1.5]. Stage changes clamp at -10 to +10 [note: hit-status 4.3]. A stat store to 0 stores 1 (the setter clamps to 1..255) [R: `kernel/stat-setter.ts:165-176` on the repo, the game's rule].

### 7.2 Aranea (`m221`, scene `stbv09_228`) [R: m221.src 42-102, compiled worker 1]

* **Start:** the death pattern is pyreflies; no stat is set (an EXP override is armed in one arena scene, `crcr00_048`, which is not this fight). The poll counter starts at 0.
* **Each poll:** the counter gains 1 first. At 5 or more it is set to 0 and she casts **Gooey End on the whole party**. Otherwise one draw `random() % 4`: **0 = Spider Bite, 1 to 3 = Attack**, each on one living girl picked **near-weighted** (stream 4).
* **So her polls run: 4 Attack/Bite polls, Gooey End, 4, Gooey End, ...** (Gooey End on polls 5, 10, 15 ...). Per non-Gooey poll: Attack 75, Bite 25 percent.
* The reaction, menu, targeted and death entries are empty. The time-out block is armed in `stbv09_228` only (section 7.6).

### 7.3 Black Elemental (`m069`, scene `stbv09_227`) [R: m069.src 82-272, compiled worker 1]

* **Start:** pyreflies death pattern, flies (gravity and fly flags on, height special 0), moves off, the targeting cursor on the waist element (presentation). Its record carries a permanent **Reflect** (section 4.1).
* **State:** a turn counter and a Magic Up counter, both 0.
* **Each poll:**
  1. The turn counter gains 1.
  2. If its HP is **below a third of its maximum** (`HP < floor(max / 3)`; 3,333 for 9,999): one draw `random() % 4`; **0 = Absorb**, aimed at **the living girl with the most current HP** (a first near-weighted `searchr` over the living girls makes its draw and is discarded; then the girls tied for the highest HP are searched near-weighted). **1 to 3** go on to step 3. At or above a third, step 3 directly.
  3. **The schedule.** If the turn counter is at least 3: set it to 0; if the Magic Up counter is above 4 (five casts done) go to the mix (step 4); else add 1 to the Magic Up counter and cast **Magic Up on itself**. If the turn counter is below 3: the mix.
  4. **The mix.** Draw `random() % 2`. **0:** a near-weighted search for a living girl **without Berserk**; if there is one, **Berserk** on her; if there is none, draw `% 2`: 0 = **Ultima** on the whole party, 1 = **Flare** on a living girl (uniform). **1:** draw `% 3`: 0 = **Ultima** on the whole party, 1 or 2 = **Flare** on a living girl (uniform).
* **So the first polls are:** mix, mix, Magic Up, mix, mix, Magic Up, ... five Magic Ups on polls 3, 6, 9, 12 and 15; from poll 16 on every poll is a mix. (Absorb replaces any poll's schedule step with a 1-in-4 chance once its HP is below 3,333; it does not reset the counters, but the turn counter has already gained 1 on that poll, so an Absorb poll shifts the rhythm by one.)
* **The mix when some living girl lacks Berserk (the usual case): Berserk 50, Flare 33.3, Ultima 16.7 percent.** When every living girl already has Berserk: Ultima 41.7, Flare 58.3 percent. Berserk lands with probability `(75 + 5 x (88 - girl level) - resist) / 101` [note: hit-status 4.1]: 19.8 percent against a Lv 99 girl with no resist.
* **Ultima is not reflectable** (its row lacks the reflectable bit, 0x80, which Flare has) [R, section 8]: a girl's Reflect does not turn it back. Flare is reflectable. Both are silenceable.
* **Magic Up** writes the MAG stage of the caster by +2 per cast (clamped to +10), five casts reaching +10 and a MAG factor of 22/12 (1.83) [R row; note: damage 1 for the stage factor].
* **MP:** it pays Ultima 90, Flare 54, Berserk 6, Absorb 3 from its 2,380; an average mix costs about 36 MP [I, arithmetic], so about 65 mixes before it runs dry unless Absorb refills it. What the game does when a charge completes with too little MP: the cast is cancelled [note: fallen-trema 1.5, monsters M].
* The reaction, menu, targeted and death entries are empty. Time-out block armed in `stbv09_227` only.

### 7.4 Concherer (`m232`, scene `stbv09_226`) [R: m232.src 85-127, compiled worker 1]

* **Start:** pyreflies death pattern, jump and move flags on, **the "no damage tag" flag on** (unmapped, presentation-side [I]). Record automatic **Shell and Protect**. Shell-broken flag 0.
* **Each poll, shell intact:** draw `random() % 4`: **0 = Gunk**, aimed at a living girl by the **uniform** search; **1 = Megaton Press**, uniform; **2 or 3 = Attack**, near-weighted. Shell broken: **Attack only**, near-weighted.
* **The reaction entry (the only reaction in the four scripts):** for every result applied to it, if the **HP damage of that result is at least 10,000** and the shell flag is still 0: the flag is set, **DEF and MDEF are stored as 0, which the setter turns into 1**, and the "Broken shell" row (0x40bb, no effect, presentation) is queued on itself [R]. The check is on **one result** (one strike of a command), not on a command's total; the Protect and Shell it carries halve a physical or a magical hit, so the raw hit must be about 20,000.
* The death entry is empty in the normal script (the Oversoul script queues its own, section 9.3). Time-out block armed in `stbv09_226` only (thresholds 230, 240, 245, 250).
* **Megaton Press is a plain physical hit with no defence term, accuracy formula 0 (always hits) and a 99,999 cap** (section 8): attacker term 3,686 times 254 over 16 = 58,515 before the girl's DEF *stage* and the variance (240 to 271 over 256), so **about 55,000 to 62,000** (28,000 to 31,000 through Protect). It kills any girl whose HP is below that. There is no "one-hit chance" rule in the script: the 25 percent per poll is the chance, until the shell breaks.
* **Gunk** is magic-class MP damage of 16/16 of **the girl's maximum MP** (all of it) plus Poison at 254; it costs the caster 4 MP.

### 7.5 Chac (`m239`, scene `stbv09_225`) [R: m239.src 26-111, compiled worker 1 offsets 0x0422-0x0662]

* **Start:** pyreflies death pattern. **One draw `random() % 4` (stream 2) at battle start sets the poll counter to 0, 1, 2 or 3.**
* **Each poll:** the counter gains 1 first.
  1. **Counter at 6 or more:** reset to 0 and **Heaven's Cataract on the whole party.** (So the first Cataract is on poll 6, 5, 4 or 3 for the start values 0, 1, 2, 3, then every 6th poll.)
  2. **Otherwise** read two group counts: the number of living girls (petrified count as living) and the number of petrified girls. **If their difference is exactly 1** (one girl is alive and not petrified): **Attack** on a living girl, near-weighted (**the candidates include the petrified**).
  3. **Otherwise** draw `random() % 3`: **0 = Attack** (the same near-weighted pick over the living, petrified included); **1 or 2 = Stony Glare** on a living girl **who is not petrified**, near-weighted.
* **That is the rule behind "she never uses Stony Glare when only one girl is left":** the test is *alive minus petrified equals 1*, so it also fires when three girls live and two are already stone. With two or more standing girls, two polls in three (while the Cataract is not due) are a Stony Glare.
* **Stony Glare** (row 0x401c): Petrify at chance **255** (through any resist, section 4.2), charge 120, no MP, no recovery. **Attack** (row 0x400e, shatter byte 100) **on a petrified girl shatters her** (Death and Eject, `draw % 101 < 100`) [note: hit-status 4.4], and so does **Heaven's Cataract** (shatter byte 100, aimed at the whole party, petrified girls included) [I that an all-party command reaches the petrified, because it names the whole party group; R for the shatter byte].
* **Heaven's Cataract** (row 0x405a): magic, power 58, attacker term **14,927** (before the girl's MDEF term and the variance), cap 99,999, so about 9,400 to 10,600 against MDEF 99, **and the stages DEF, MDEF, ACC and the two slots 12 and 13 (Evasion and Luck by the wiki-level list [I]) are each set down by 10 (chance 255)**, i.e. to the -10 floor [R; the stage clamp is note hit-status 4.3]. After that every physical hit does 22/12 times the normal damage and every magic hit likewise to that girl. 12 MP of her 820.
* The reaction, menu, targeted and death entries are empty. Time-out block armed in `stbv09_225` only (thresholds 280, 290, 295, 300).

### 7.6 The generic "battle too long" block (inert) [R]

Each of the four scripts (normal and Oversoul) starts its action entry with the block of the other FFX-2 bosses: it counts actions and, past 160 / 170 / 175 / 180 (Aranea, Black Elemental), 230 / 240 / 245 / 250 (Concherer) or 280 / 290 / 295 / 300 (Chac), would queue four message-only rows (0x4232 to 0x4235) and then the 12-hit random-target fixed Meteor (row 0x4236, formula 5, power 200, 9,999 a hit [note: bahamut 1.6]) on the party, **only in the monster's own `stbv09` scene** and only behind the guard "no girl is alive and unpetrified", which is the same guard as in the other bosses and does not run in play [note: bahamut 1.6, leblanc 1.8]. Nothing to implement.

### 7.7 Random streams

`random() % n`: stream 2, the low 16 bits of one draw. Aranea draws `% 4` once per non-Gooey poll. Black Elemental draws `% 4` on a low-HP poll, then `% 2`, `% 2` or `% 3` in the mix (one draw `% 2` first, then one of `% 2`/`% 3`; a draw `% 2` more when no girl lacks Berserk). Concherer draws `% 4` per intact-shell poll. Chac draws `% 4` once at the start, `% 3` on a poll that reaches step 3. Searches: stream 4 (a draw only with two or more candidates; the Absorb pair makes its first, discarded, draw only with two or more living girls). Hit rolls and damage variance use the per-character streams [note: bahamut 1.3, hit-status 1.1].

### 7.8 Turn cadence (normal versions)

Recovery after a command is `cost_atb x 10000 / (AGI + 1)` units, the charge before it fires is `cost_cast x 10000 / (AGI + 1)` units, 95 units a step at normal speed, 29.97 steps a second, steps rounded up; the first gauge is 25 to 74 percent of `70 x 10000 / (AGI + 1)` units, drawn once at the start; 30 more steps of thinking are added for every girl who is dead or petrified [note: bahamut 1.1, timing-measured; angra-mainyu 9.11] (the thinking byte of the record is never read, note fallen-trema 1.6). Animation time is on top and was not read. Black Elemental, Aranea and Concherer have bit 9 (immune to Interrupt), bit 6 (no ATB damage) and bit 1 (a hit reaction does not slow the gauge) set; **Chac has none of the three** (special word 0x99: bits 0, 3, 4, 7) [R]. Whether bit 1 matters in play is open (note fallen-trema 1.7); bits 6 and 9 bear on any Interrupt or ATB-damage move the girls use on Chac [I].

| Actor (AGI) | First gauge | Move | Charge (units, steps, s) | Recovery (units, steps, s) |
|---|---|---|---|---|
| Black Elemental (255) | 683 to 2,023 units, 8 to 22 steps, 0.27 to 0.73 s | Ultima, Flare, Berserk | 3,906, 42, 1.40 | Ultima, Flare 0; Berserk 3,125, 33, 1.10 |
| | | Absorb | 3,125, 33, 1.10 | 0 |
| | | Magic Up | 781, 9, 0.30 | 0 |
| Aranea (72) | 2,397 to 7,095 units, 26 to 75 steps, 0.87 to 2.50 s | Attack | 0 | 13,698, 145, 4.84 |
| | | Spider Bite | 24,657, 260, 8.68 | 0 |
| | | Gooey End | 1,369, 15, 0.50 | 0 |
| Concherer (155) | 1,121 to 3,320 units, 12 to 35 steps, 0.40 to 1.17 s | Attack | 0 | 6,410, 68, 2.27 |
| | | Megaton Press | 5,128, 54, 1.80 | 5,128, 54, 1.80 |
| | | Gunk | 7,692, 81, 2.70 | 0 |
| Chac (164) | 1,060 to 3,139 units, 12 to 34 steps, 0.40 to 1.13 s | Attack | 0 | 6,060, 64, 2.14 |
| | | Stony Glare | 7,272, 77, 2.57 | 0 |
| | | Heaven's Cataract | 7,272, 77, 2.57 | 4,848, 52, 1.74 |

Melee hit frames in the attack clips [R: `FFX2-G12/hit-roster.json`, clip frames]: Aranea 7 (set 0x1084, `attack_01`), Concherer 56 (0x109b, `attack_01`), Chac 6 (0x1058, `attack_00`); the Black Elemental's motion set (0x1044) has no hit signal found (it only casts). These are inputs for the action-time work, not used elsewhere in this note.

## 8. The moves (rows of `monmagic.bin` and `command.bin`)

Column meanings: `re-ffx2-commands.md` section 1. Damage class: bit 1 HP, bit 2 MP. Damage-flag bits: 1 physical, 2 magical, 0x40 cap 9,999, 0x80 cap 99,999, 0x10 heals. Accuracy formula: 0 always hits, 1 the race with the row's accuracy byte, 2 the race with the attacker's ACC [note: hit-status 2.1]. The attacker term is the formula's attacker side before the girl's defence term, the stages and the variance (240 to 271 out of 256) [note: damage 1; `kernel/damage.ts:236-243` for formula 9]; level, STR and MAG are those of section 4. A physical-only row is reduced by Protect, a magical-only row by Shell [note: leblanc-den-ixion 1.11].

| Move (user) | What it does | Type / accuracy / element | Statuses and amounts | Cost: recovery / charge / MP | Attacker term |
|---|---|---|---|---|---|
| **Attack** 0x4003 (Aranea) | 2 hits of power 8, one girl, formula 0 | physical; race with ACC; crit 5 percent (fixed); shatter 10; Darkness cuts it | none | 100 / 0 / 0 | 547, x8/16 = 273 per hit |
| **Spider Bite** 0x40ca (Aranea) | formula 1 (no DEF term), power 32, one girl | physical; always hits; no crit | none | 0 / 180 / 0 | 547, x32/16 = 1,094 |
| **Gooey End** 0x40c9 (Aranea) | whole party; formula 8 (fixed, with variance): 140 to 158 HP | neither type; always hits | **Poison 254; Stop 254 for a counter of 25; STR stage -1 (255); MAG stage -1 (255)** | 0 / 10 / 0 | 140 to 158 |
| **Absorb** 0x304b (Black Elemental) | HP and MP damage together (class 3), formula 9 (a MAG cubic), power 8, one girl, **absorbed by the user** (row bit 0x100); shatter 20 | magical-shaped; always hits; silenceable | none | 0 / 80 / 3 | 7,771 (MAG cubic), x8/16 = 3,885 |
| **Ultima** 0x3171 (Black Elemental) | formula 2, power 70, whole party; shatter 100 | magical; always hits; **not reflectable**; silenceable | none | 0 / 100 / 90 | 32,998 |
| **Flare** 0x3170 (Black Elemental) | formula 2, power 55, one girl; shatter 100 | magical; always hits; reflectable, silenceable | none | 0 / 100 / 54 | 20,371 |
| **Berserk** 0x406a (Black Elemental) | status only, one girl | magical; reflectable, silenceable | Berserk 75 | 80 / 100 / 6 | none |
| **Magic Up** 0x41dd (Black Elemental) | itself | | MAG stage +2 (255) | 0 / 20 / 0 | none |
| **Attack** 0x400e (Concherer, Chac) | formula 0, power 32, one girl | physical; race with ACC; crit 15 percent (fixed); **shatter 100**; Darkness cuts it | none | 100 / 0 / 0 | Concherer 3,686, x32/16 = 7,372; Chac 8,810, x32/16 = 17,620 |
| **Megaton Press** 0x40ba (Concherer) | formula 1, power 254, one girl, **cap 99,999** | physical; always hits | none | 80 / 80 / 0 | 3,686, x254/16 = 58,515 |
| **Gunk** 0x40b9 (Concherer) | class MP, formula 7, power 16: **all of the girl's maximum MP**; one girl | neither type; always hits | Poison 254 | 0 / 120 / 4 | 16/16 of max MP |
| **Broken shell** 0x40bb (Concherer) | effect-less row on itself (presentation) | | | 0 / 0 / 0 | none |
| **Stony Glare** 0x401c (Chac) | status only, one girl | always hits | **Petrify 255** | 0 / 120 / 0 | none |
| **Heaven's Cataract** 0x405a (Chac) | formula 2, power 58, whole party; shatter 100; **cap 99,999** | magical; always hits | **stages 9 to 13 (DEF, MDEF, ACC, Evasion and Luck [I]) -10 each (255)** | 80 / 120 / 12 | 14,927 |

The status chances use the landing rule of `re-ffx2-hit-status.md` 4.1: 255 always lands, 254 lands unless the girl's resist byte is 255, any other value lands when `draw % 101 < chance + 5 x (attacker level - girl level) - resist`. Attacker levels: Aranea 52, Black Elemental 88, Concherer 96, Chac 98. The cost columns are the AI's rows (the record lists' other rows are in the appendix).

## 9. The Oversoul versions

### 9.1 When a monster becomes an Oversoul [R: Ghidra reads, D addresses; the counter's lifetime is I]

* Each of the four records has an **Oversoul type** (section 4.1), the family in the game's `oversoul.bin`: **Elemental 16, Arachnid 8, Hermit 7, Basilisk 10** (the kill counts). Families: Elemental = Yellow, White, Red, Gold, Blue, Dark and Black Elemental (rows 63 to 69); Arachnid = Boris and Aranea; Hermit = the two Shell Shockers (rows 155, 360) and Concherer; Basilisk = Kukulcan, Gucumatz and Chac (rows 88, 89, 239) [R: row scan].
* **The counter.** A global table of 64 u16 counters (D 0xe01640), one per family. **Every monster KO** (the KO resolver, once per KO of a monster that is not itself an Oversoul and not a kill of one kind the code skips) **adds 1 to its family's counter, capped at the family's count.** An Oversoul's own death sets its family's counter back to 0.
* **The switch.** In the ATB step of each monster the game checks: it has a family, the family has a count, the counter has reached it (or a debug flag is on), and **no other monster of that family in the battle is already an Oversoul**. If so, the Oversoul flag is set, an effect plays, the monster is **rebuilt from the `monster2.bin` row with HP and MP refilled** and the AI request now asks the Oversoul worker [note: fallen-trema 1.4; the reads above].
* **For a boss fought alone the counter must already be at its cap when the battle starts**, because nothing else of the family dies in the fight; then the switch happens at its first ATB step. If the Oversoul flag is set the fight uses the stat block of section 4.4 and the scripts of 9.3.
* **Where the counter lives and whether it is saved is not proved.** Its direct references are in five small functions only (the add D 0x61c1a0, the switch check D 0x61c290, the flag setter D 0x61c650, and a read and a write accessor D 0x61c450 and D 0x61c700 that the script stat calls use; no save or load routine references it by name), so I read it as **a per-session counter that starts at 0 each time the game is launched and persists across battles** until an Oversoul of the family dies [I]. A bulk clear at battle start or a save-copy by struct base would not show as a reference to the table and was not excluded. This decides how often the floor bosses are Oversouls: see section 12.
* Plausibility check [I]: the Elemental family has seven species in the ladder from the first bands (Yellow, Red, White, Gold, Blue Elemental) and needs 16 kills; the Basilisk family needs 10 and Kukulcan and Gucumatz are in `99x102` and `99x301`; the Arachnid family needs 8 but only Boris (`99x001`) and Aranea belong to it; the Hermit family needs 7 and has Shell Shocker in `99x202`.

### 9.2 What the Oversoul rows look like

Section 4.4. Common points: Level 99 (Aranea 62), the Spellspring status (Use MP 0) on every one, a higher AGI (Concherer 202 against 155, Chac 213 against 164, Aranea 115 against 72), Black Elemental **without Reflect**, and HP of 10,998 / 33,394 / 360,444 / 459,743.

### 9.3 The Oversoul scripts (paraphrased; `o069`, `o221`, `o232`, `o239` = worker 0 of each package) [R: sources and compiled workers]

The shared macros (`y_mon01.src`): "do this move once" queues the move the first time and never again (the flag variable is set), taking a near-weighted living girl as the target (a draw is made even for an all-party move); "how much HP percent" is the float ratio HP / max HP, and 1 when the actor does not exist.

* **Oversoul Black Elemental (`o069`).** At the start: nothing but debug prints. Each poll: (1) if its HP is under 50 percent and it has not done so before, **Full-Cure on itself** (cure of 100 percent of max HP, 99 MP; the "done" flag is never reset); (2) if it has no Regen, a 1-in-4 draw queues **Regen on itself**, and the poll **goes on** (no return) so a second command is queued in the same poll; (3) one draw `% 5`: **Firaga, Thundaga, Waterga, Blizzaga (each on the whole party, power 21, attacker term 3,121) or Ultima (whole party, attacker term 34,682)**, one fifth each. It never casts Flare, Berserk, Magic Up or Absorb.
* **Oversoul Aranea (`o221`).** A free-running thread (the main entry) adds 1 to her STR and MAG every 100th pass of the thread once enabled (one pass is one `wait(1)`, about one logic step [I]; the pass counter wraps at 2,000). Polls: (1) once, **Dual Catalyst on herself** (the "do once" macro returns after queueing it); (2) from the second poll the growth thread is enabled, and once **Tempus Laxit** on the whole party (Stop at 254, counter 40); (3) at HP under 10 percent, Tempus Laxit once more (its own flag); (4) at HP under 50 percent, once, **10,000 Gil Smoosher** on a living girl, *only if* the script's `checkfriend` test is false (an ally test, exact meaning unread), no girl wears the Samurai or Gambler job and **the party holds more than 70,000 gil** (otherwise a plain attack); (5) otherwise one draw `% 9`: 0 to 3 = **Firaga, Blizzaga, Thundaga, Waterga on the whole party**; 4 and 5 = **Spider Bite**; 6 to 8 = **Spider Attack** (2 hits of power 16, race with the row's byte 95). The Smoosher's row is an ordinary 2-hit physical attack of power 2 (attacker term 1,149 at STR 104); the gil effect is not in the row [unmapped].
* **Oversoul Concherer (`o232`).** There is no shell mechanic in the action (the flag is never set). HP ratio from the float division: over 70 percent, **phase 1:** once **Slurp** (Itchy at 254, a MAG-shaped hit of power 4), then each poll `% 5`: 0 = Thundaga, 1 = Flare (each on one living girl, near-weighted), else Attack on a uniform pick. From 70 percent down, **phase 2:** once **Demi** (25 percent of the current HP of **one** near-weighted girl: the "do once" macro aims at a single girl), then `% 5`: 0 = Slurp, else Attack (near-weighted). At 25 percent or less, **phase 3:** once **Demi** again (its own flag, one girl), once at 5 percent or less **Radular Grudge** (Silence, Darkness, Poison and Confusion at 254; physical power 5), then `% 5`: 0 = Thundaga on the whole party, 1 = **Flare on the whole party**, 2 = Slurp, else Attack. Its death entry queues the broken-shell row and then the Die row (the shell flag is never set). It keeps the "no damage tag" flag.
* **Oversoul Chac (`o239`).** **No Heaven's Cataract.** Per poll, in this order: (1) once, if more than one girl is in the battle and more than one is alive, **Stony Glare** (255) on a near-weighted living girl; (2) while its "twice in a row" counter is under 2 it adds 1 and **tries Destroy Remedy**; (3) otherwise one draw `% 7`: 0 = a near-weighted living girl; if her HP is at most half, **Hunter's Gaze** on her (leaves her at **1 HP**, formula 0xa), else Attack; 1 = **Destroy Soft** (aimed at a Golden Needle) ; 2 = **Destroy Remedy** (aimed at a Remedy); 3 = **MP Break** (physical, MP damage, power 9); 4 = Stony Glare on a girl the script's "not dead or stone" stat keeps (the unpetrified living) [I from the stat's name]; 5 and 6 = **Attack** (power 16, Poison at 100, it never rolls). Destroy Soft and Destroy Remedy are tried only when **the `checkfriend` test is false, no girl wears the Gunner-family job the script names (Power Gunner), and the party owns at least one of the item**; otherwise the poll becomes a plain Attack. Their rows are physical attacks of power 5; the script flags each as "done" for the effect module, which presumably deletes the item (not read). Its death entry clears those two flags.
* **Reaction, menu and targeted entries are empty in all four Oversoul scripts** (the Black Elemental's death entry is empty too). Every Oversoul script has the same time-out block for its own scene (section 7.6).

## 10. Against the candidate note and the wiki-level descriptions

| Statement (candidates note, section 4.2: wiki and Jegged) | The files |
|---|---|
| Aranea: a stronger Boris; bite; Gooey End fan that inflicts Poison and Stop | **agree**, plus STR and MAG stage -1 on Gooey End, and the Bite is a slow 8.7 s charge (section 7.2) |
| Black Elemental: very high Defense and Magic Defense, low HP; Flare and Ultima; MP siphon; Ultima ignores Reflect; absorbs HP when low | **agree** (DEF 250, MDEF 254, HP 9,999; Absorb is HP and MP together and is cast at one in four below a third of its HP). New: its own **permanent Reflect**, Berserk as the most frequent cast, and Magic Up as the third poll |
| Concherer: very high HP, Auto-Protect and Auto-Shell; one-hit Megaton Press on a chance; Gunk drains MP and poisons | **agree** (Shell and Protect are record statuses; Press is 25 percent a poll; Gunk takes all the MP and Poisons). New: the shell break at one result of 10,000 or more, which also ends Press and Gunk |
| Chac: Stony Glare petrifies through immunities; delay-lock her turns; Heaven's Cataract; never Stony Glare if only one is alive | **agree** (Stony Glare is 255; the rule is "alive minus petrified is 1"; Cataract every 6th poll). New: shatter on a petrified girl, the -10 stage drops, the random start of the counter |
| (none) | the Oversoul scripts and blocks (section 9) |

**The repo already holds wiki-level lines for the four** (`research/ffx2-trema.md` section 1.2 and its source table: Aranea Lv 52 / 18,280, Black Elemental Lv 88 / 9,999, Concherer Lv 96 / 343,280, Chac Lv 98 / 437,850; "4 turns of Attack or Bite, then Gooey End"; "Megaton Press (DC 254, ignores Defense), Gunk (MP to 0, Poison)"; "Stony Glare (Petrify through any protection), Heaven's Cataract (-10 levels to Def, MDef, Acc, Eva, Luck)"; a reward chest with Cat Nip and Speed Bracer after the Black Elemental). **Every level and HP agrees with the rows, and each description agrees with the script** (Aranea's 4-then-Gooey-End is the counter of section 7.2, Press ignoring Defense is formula 1, Gunk's MP to 0 is 16/16 of max MP, Cataract's five stages are slots 9 to 13). No game number in that note needs correcting. There is no data or AI code for the four in `src` on `origin/main`; `DECISIONS.md` D-1039 names the chapter. Everything else in sections 4 to 9 (the stats, elements, resist bytes, the Reflect, Shell and Protect, the exact poll order and probabilities, the shell-break, the shatter, the Oversoul versions) is new to the repo. The same note's "leave out the other four Great Cloister bosses" recommendation is superseded by D-1039.

## 11. What our engine would need (origin/main `f86e8f3e9`; no build)

All paths are on `origin/main`. **Existing and enough:**

| Need | Where it exists |
|---|---|
| An AI script per actor, registered by id | `src/battle/ffx2/ai/index.ts:63-89` (`SCRIPTS`) and `:94` (`aiScriptFor`); the pattern is `ai/angra-mainyu.ts` |
| Near-weighted and uniform searches, `lacking(status)`, "highest HP" pick, `% n` draws | `ai/script-rolls.ts:72` (`searchUniform`), `:157` (`searchNear`), `:166` (`lacking`), `:54` (`scriptModCtx`), `:265` (`extremePick`) |
| Permanent statuses on an enemy (Reflect, Shell, Protect) | `EnemyDef.autoStatuses`, `setup.ts:187-205`, `internal.ts:115-116`, `status-clock.ts:92` (kept through a Dispel). Used so far only for Spellspring; that Reflect redirects a girl's spell aimed at an enemy is **unverified** (`kernel/hit.ts:32` describes the redirect) |
| Stat stages -10 to +10, slots 7 to 13 | `kernel/statusGroup2.ts:19`, `adapt/slots.ts:36-37` (`STAGE_FIRST` 7, `STAGE_LAST` 13) |
| The 99,999 cap flag of a row | `resolve-strike.ts:136` with the ability flag `always-break-damage-limit` (`common/types.ts:1333`) |
| Shatter (a hit on a petrified target) | `adapt/command.ts:92-93,247` |
| Whole-party and single-target commands, charge and recovery from AGI | `atb-engine.ts`, `kernel/atb-gauge.ts:101` |
| The reaction entry per result | `AiScript.onResult(ctx, source, ability)`, `internal.ts:362` |
| The party's items | `ctx.flags['inventory:<id>']`, `adapt/item-ledger.ts:1-14` |
| The Level 99 party and the Via Infinito scene | `src/data/ffx2/builds/via-infinito.ts`, the Cloister 100 scene (the Trema/Paragon chapter) |

**New mechanics (what I found missing):**

1. **Shell break on one result of 10,000 HP or more** (Concherer). `onResult` has no damage amount; `onDamaged(ctx, source, amount, hits)` (`internal.ts:343`) gives the *total* of an action. The game tests each result, so a multi-hit action needs the per-result amount (an additive field).
2. **Writing DEF and MDEF.** The kernel setter already has the two rows with the clamp to 1 (`kernel/stat-setter.ts:79,81,165-176`), but the adapter maps only HP, the death pattern and AGI (`adapt/stat-setter.ts:35,65,73`) and throws on any other store (line 54). Two cases to add.
3. **The Oversoul kill counter and switch** (all four). The engine has the Oversoul Paragon only as an authored OFF option started directly (`ai/index.ts:32-33`, `ai/paragon-oversoul.ts`); there is no family counter, no ATB-step check, no rebuild from a second block with HP and MP refilled. The data side would need the second stat block of section 4.4 as separate enemy defs and the four Oversoul scripts. **This is the biggest piece**, and the one whose behaviour is least certain (section 12).
4. **Group counts for Chac's rule** (alive minus petrified is 1): `lacking(girls, 'petrify')` gives the unpetrified; the count is trivial, but the plain Attack's candidate list must **include petrified girls** and Stony Glare's must exclude them (one list each).
5. **Shatter reaching petrified girls from an all-party command** (Cataract): check that a petrified girl stays in the target mask of a party-wide command and that the shatter draw is made for her (`adapt/command.ts` and the hit kernel).
6. **A per-battle default placement** for scenes with no shipped positions; the other chapters read the shipped `pos` files.
7. **Item and gil reads** in the Oversoul Aranea and Chac scripts (the party's gil, and "owns a Remedy / Golden Needle"); the item reads exist, the gil read is not seen. Their effect rows delete an item or take gil; neither effect is modelled.
8. **Chac's missing gauge slow-down** (special bit 1 clear): the other FFX-2 bosses have it set; no engine switch for this bit was seen (`internal.ts` has none), the effect on play is itself open (note fallen-trema 1.7).

**Per chapter, normal versions only:** Aranea needs none of the eight (the cheapest of the four); Black Elemental needs only the check that its permanent Reflect works on an enemy; Concherer needs 1 and 2; Chac needs 4 and 5 (and 8 if the slow-down matters). **Any Oversoul variant** needs 3, and 7 for Aranea and Chac.

## 12. Open questions, and what a live check would settle

The live saves are Via Infinito based (the Autosave at "Bevelle - Via Infinito", 103:43, all girls Lv 99).

1. **Which version (normal or Oversoul) does each floor boss have?** Depends on the family counter (section 9.1). *Live check:* load the save, fight floor 20 and read the Aranea's HP (18,280 normal against 33,394 Oversoul) and its first moves; repeat per floor; and watch for the Oversoul message. Better: a read-only memory read of the counter table (D 0xe01640; code addresses of the live build are 0x20 to 0x30 lower, the live data address has to be looked up) before each floor, which settles whether the counter survives a save/load and a restart.
2. **Does the counter reset at battle start, at a save/load, or only at an Oversoul's death?** Same read.
3. **Is Escape allowed on the four floors?** Open the Flee command on floor 20. Also settles what the 0x501 battle-flags word does for Escape.
4. **Do HP and MP carry over between floors, and is anything restored by the cutscenes?** The wiki-level note says the heal glyph is optional; read the party's HP/MP just before and just after the floor-20 cutscene to see whether the script restores anything.
5. **Are the four species escapable ordinary encounters on the late floors, as the wiki-level note says** (`99x800`, `99x801`, `99x900`, `99x901`), and from which floor does the band start? Walk floors 70 to 99 and note the formations.
6. **Concherer:** what damage per result breaks the shell in play (10,000 after Protect and Shell halve it, section 7.4)? A strong single hit on floor 60 shows the Broken-shell message.
7. **Chac:** does Attack on a petrified girl shatter her, and is a petrified girl a candidate of the plain Attack? (Section 7.5.)
8. **Black Elemental:** the reflect (its permanent Reflect against a girl's Fire) and the speed of its mix cadence (about one poll every 1.4 s); does Ultima ignore the girls' Reflect?
9. **What `stat_no_damage_exe_flag` (Concherer), the unmapped stage slots 12 and 13, special bits 3 and 4, the Zantetsu byte and the 0x501 launch word mean.** The first four are presentation or mapping gaps; none changes the AI above.
10. **Gooey End's Stop counter of 25** in seconds (about 395 steps if it ticks at the awake speed, about 13 s [I from note atb-status 6.5]).
11. **What the Oversoul scripts' effect modules do** (Destroy Remedy, Destroy Soft, 10,000 Gil Smoosher): the rows carry no item or gil effect; the modules were not read.
12. **The launcher of the `99x` ladder** (how the floor picks a family) and **the unread 37 workers of `stbv0900`** (Moogle statues, dungeon rules).

## 13. Notes cited

In the repo (`research/` on `origin/main`): `re-ffx2-damage.md`, `re-ffx2-hit-status.md`, `re-ffx2-atb-status.md`, `re-ffx2-commands.md`, `re-ffx2-timing-measured.md`, `re-ffx2-ai-bahamut-vegnagun.md`, `re-ffx2-ai-leblanc-den-ixion.md`, `re-ffx2-ai-fallen-trema.md`, `re-ffx2-ai-valefor.md`, `re-ffx2-angra-mainyu.md`, `re-ffx2-experiment.md`, `ffx2-trema.md` (section 1.2, the wiki-level floor table), `ffx2-combat-core.md` (the stagger table). Kept outside the repo: the coverage notes `FFX2-G12/hit-roster.json` (hit frames) and `FFX2-G05.md` (the script stat table), the extraction tools of `D:\Tools\ffx-parity\new-chapters\ffx2-experiment\tools`, and this lane's scripts.

## Appendix: the move rows as numbers

Record-shaped numbers (the fields of `FFX2CommandRecord`; status maps are in section 8). File offsets are in the file named in the cell; row sizes are 136 bytes (`monmagic.bin`) and 140 bytes (`command.bin`). The first nine rows are the normal scripts' moves, the rest the Oversoul scripts' and the record lists' (the milder Cataract 0x41fc, Spider Attack 0x40c7, Broken shell 2, Die) and the time-out rows.

| Move | id | file offset | costAtb | costCast | costMp | flagsTarget | flagsMisc | flagsDamage | damageClass | formula | crit byte | accuracy byte | power | hits | shatter | element |
|---|---|---|---:|---:|---:|---|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| Absorb | 0x304b | 0x2924 (command) | 0 | 80 | 3 | 0x33 | 0x40200106 | 0x0 | 3 | 9 | 0 | 0 | 8 | 1 | 20 | 0x0 |
| Demi | 0x3082 | 0x4738 (command) | 0 | 80 | 10 | 0x437 | 0x20208006 | 0x2 | 1 | 4 | 0 | 0 | 4 | 1 | 0 | 0x10 |
| Firaga | 0x30ad | 0x5ebc (command) | 0 | 70 | 24 | 0x4b3 | 0x20208086 | 0x2 | 1 | 2 | 0 | 0 | 21 | 1 | 20 | 0x1 |
| Blizzaga | 0x30ae | 0x5f48 (command) | 0 | 70 | 24 | 0x4b3 | 0x20208086 | 0x2 | 1 | 2 | 0 | 0 | 21 | 1 | 20 | 0x2 |
| Thundaga | 0x30af | 0x5fd4 (command) | 0 | 70 | 24 | 0x4b3 | 0x20208086 | 0x2 | 1 | 2 | 0 | 0 | 21 | 1 | 20 | 0x4 |
| Waterga | 0x30b0 | 0x6060 (command) | 0 | 70 | 24 | 0x4b3 | 0x20208086 | 0x2 | 1 | 2 | 0 | 0 | 21 | 1 | 20 | 0x8 |
| Regen | 0x30b6 | 0x63a8 (command) | 0 | 60 | 40 | 0x431 | 0x20208086 | 0x2 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0x0 |
| Full-Cure | 0x30be | 0x6808 (command) | 0 | 120 | 99 | 0x431 | 0x20208087 | 0x32 | 1 | 7 | 0 | 0 | 16 | 1 | 0 | 0x0 |
| Flare | 0x3170 | 0xc960 (command) | 0 | 100 | 54 | 0x433 | 0x20208086 | 0x2 | 1 | 2 | 0 | 0 | 55 | 1 | 100 | 0x0 |
| Ultima | 0x3171 | 0xc9ec (command) | 0 | 100 | 90 | 0x437 | 0x21208006 | 0x2 | 1 | 2 | 0 | 0 | 70 | 1 | 100 | 0x0 |
| Attack | 0x4003 | 0x1b8 (monmagic) | 100 | 0 | 0 | 0x33 | 0x60010052 | 0xd | 1 | 0 | 5 | 200 | 8 | 2 | 10 | 0x0 |
| Attack | 0x400e | 0x790 (monmagic) | 100 | 0 | 0 | 0x33 | 0x20010052 | 0xd | 1 | 0 | 15 | 200 | 32 | 1 | 100 | 0x0 |
| Stony Glare | 0x401c | 0xf00 (monmagic) | 0 | 120 | 0 | 0x33 | 0x60000006 | 0x0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0x0 |
| Stony Glare (list of the Oversoul Chac) | 0x4058 | 0x2ee0 (monmagic) | 0 | 140 | 16 | 0x33 | 0x60000006 | 0x0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0x0 |
| Heaven's Cataract | 0x405a | 0x2ff0 (monmagic) | 80 | 120 | 12 | 0x37 | 0x60000006 | 0x82 | 1 | 2 | 0 | 0 | 58 | 1 | 100 | 0x0 |
| Berserk | 0x406a | 0x3870 (monmagic) | 80 | 100 | 6 | 0x433 | 0x20208086 | 0x2 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0x0 |
| Gunk | 0x40b9 | 0x6268 (monmagic) | 0 | 120 | 4 | 0x33 | 0x6 | 0x0 | 2 | 7 | 0 | 0 | 16 | 1 | 0 | 0x0 |
| Megaton Press | 0x40ba | 0x62f0 (monmagic) | 80 | 80 | 0 | 0x33 | 0x40000006 | 0x81 | 1 | 1 | 0 | 0 | 254 | 1 | 0 | 0x0 |
| Broken shell | 0x40bb | 0x6378 (monmagic) | 0 | 0 | 0 | 0x1 | 0x41000002 | 0x0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0x0 |
| Broken shell 2 | 0x40bc | 0x6400 (monmagic) | 0 | 0 | 0 | 0x41 | 0x41000002 | 0x0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0x0 |
| Die | 0x40bd | 0x6488 (monmagic) | 0 | 0 | 0 | 0x41 | 0x41000002 | 0x0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0x0 |
| Spider Attack | 0x40c7 | 0x69d8 (monmagic) | 100 | 0 | 0 | 0x33 | 0x6001004a | 0xd | 1 | 0 | 10 | 95 | 16 | 2 | 0 | 0x0 |
| Gooey End | 0x40c9 | 0x6ae8 (monmagic) | 0 | 10 | 0 | 0x17 | 0x60000006 | 0x0 | 1 | 8 | 0 | 0 | 3 | 1 | 0 | 0x0 |
| Spider Bite | 0x40ca | 0x6b70 (monmagic) | 0 | 180 | 0 | 0x13 | 0x61000006 | 0x0 | 1 | 1 | 0 | 0 | 32 | 1 | 0 | 0x0 |
| MP Break | 0x4172 | 0xc4b0 (monmagic) | 100 | 0 | 0 | 0x13 | 0x2000004e | 0xd | 2 | 0 | 10 | 95 | 9 | 1 | 10 | 0x0 |
| Destroy Soft | 0x4173 | 0xc538 (monmagic) | 100 | 0 | 0 | 0x13 | 0x21000006 | 0xd | 1 | 0 | 10 | 0 | 5 | 1 | 10 | 0x0 |
| Destroy Remedy | 0x4174 | 0xc5c0 (monmagic) | 100 | 0 | 0 | 0x13 | 0x21000006 | 0xd | 1 | 0 | 10 | 0 | 5 | 1 | 10 | 0x0 |
| Hunter's Gaze | 0x4175 | 0xc648 (monmagic) | 100 | 120 | 0 | 0x13 | 0x60000046 | 0x0 | 1 | 10 | 0 | 0 | 0 | 1 | 0 | 0x0 |
| 10,000 Gil Smoosher | 0x418e | 0xd390 (monmagic) | 100 | 0 | 0 | 0x13 | 0x1000006 | 0xd | 1 | 0 | 10 | 0 | 2 | 2 | 10 | 0x0 |
| Tempus Laxit | 0x419b | 0xda78 (monmagic) | 100 | 0 | 0 | 0x7 | 0x40000046 | 0x0 | 1 | 0 | 0 | 0 | 2 | 1 | 0 | 0x0 |
| Radular Grudge | 0x41a6 | 0xe050 (monmagic) | 100 | 0 | 0 | 0x13 | 0x46 | 0x1 | 1 | 0 | 0 | 0 | 5 | 1 | 0 | 0x0 |
| Slurp | 0x41b0 | 0xe5a0 (monmagic) | 100 | 120 | 0 | 0x13 | 0x4e | 0xe | 1 | 0 | 10 | 95 | 4 | 1 | 0 | 0x0 |
| Dual Catalyst | 0x41d7 | 0xfa58 (monmagic) | 50 | 0 | 0 | 0xd | 0x46 | 0x1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0x0 |
| Magic Up | 0x41dd | 0xfd88 (monmagic) | 0 | 20 | 0 | 0xd | 0x10200006 | 0x0 | 0 | 0 | 0 | 0 | 0 | 1 | 10 | 0x0 |
| Attack (Oversoul Chac) | 0x41df | 0xfe98 (monmagic) | 100 | 0 | 0 | 0x33 | 0x60000042 | 0xd | 1 | 0 | 5 | 95 | 16 | 1 | 10 | 0x0 |
| Heaven's Cataract (the milder row of the record list) | 0x41fc | 0x10e00 (monmagic) | 80 | 120 | 0 | 0x37 | 0x60000006 | 0x2 | 1 | 2 | 0 | 0 | 14 | 1 | 100 | 0x0 |
| Battle too long: Angry (first of the four warning rows) | 0x4232 | 0x12ab0 (monmagic) | 50 | 0 | 0 | 0x13 | 0x46 | 0x1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0x0 |
| Time Up: Meteor | 0x4236 | 0x12cd0 (monmagic) | 0 | 0 | 0 | 0x17 | 0x41204006 | 0x0 | 1 | 5 | 0 | 0 | 200 | 12 | 0 | 0x0 |

The status maps of the rows named in section 8 (group 1 index = chance, group 2 index = chance with the signed step in brackets): Gooey End g1 5 = 254, g2 6 = 254 (25), 7 = 255 (-1), 8 = 255 (-1); Berserk g1 7 = 75; Magic Up g2 8 = 255 (+2); Gunk g1 5 = 254; Stony Glare 0x401c g1 1 = 255; Heaven's Cataract 0x405a g2 9 to 13 = 255 (-10 each); the milder 0x41fc g2 9 to 13 = 255 (-1 each); Tempus Laxit g2 6 = 254 (40); Slurp g1 17 = 254; Radular Grudge g1 3 to 6 = 254; Full-Cure cleanses g1 1 to 8, 16, 17 and g2 5, 6 at 254; Regen g2 3 = 254 (50); Attack (Oversoul Chac) g1 5 = 100 [R: `moves.mjs`].
