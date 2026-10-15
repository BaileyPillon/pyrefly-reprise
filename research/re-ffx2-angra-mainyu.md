# FFX-2 Angra Mainyu read from the game's own files: the rows, the formation, the start positions and the AI scripts

**Game case: FFX-2 only.** Angra Mainyu is an FFX-2 monster (rows of the FFX-2 kernel table `battle/kernel/monster.bin`, scenes `bika07_229`, `bika08_229`, `bika09_229`, `bika13_229`, `bika14_229`). Nothing here applies to FFX.
Written 2026-10-14 by a sub-agent of the RE parity session for the release driver, who is building the hidden FFX-2 chapter "Angra Mainyu" from the wiki and will re-pin it to these rows. Part of the `re-parity` track. Read-only: nothing in the game folder was changed, no game was run, no Ghidra call was made.

**What is in this note:** numbers read from the owner's own Steam copy. Monster, item and move names appear only as identifiers (the game's own name tables are how the rows were found). No descriptions, dialogue, script lines, decompiled code or other game text. Where a developer label matters it is translated in a few words and the file line number is given instead of the label.

Tags: **[bytes]** read from the kernel table files by this note's scripts; **[src]** read from the shipped plain-text AI source (file and line numbers); **[bin]** confirmed in the compiled package; **[note: file section]** a meaning that an earlier checked note proves; **[inferred]** reasoning from the above, not read directly; **unmapped** the value is given raw and no meaning is claimed (AGENTS.md hard rule 6).

## 0. Result in one screen

| Row (0-based) | Name in the game's own table | Role in the fight | Lv | HP | MP |
|---|---|---|---|---|---|
| **268** (id 0x110c) | Angra Mainyu | the boss, slot 1 of the formation | 47 | 333,444 | 9,999 |
| **269** (id 0x110d) | Zarich | companion, slot 3 | 36 | 5,440 | 9,999 |
| **270** (id 0x110e) | Tawrich | companion, slot 2 | 38 | 5,440 | 9,999 |

* **One formation family, five scenes.** `btl.txt` has five formation rows with exactly these three monsters (rows 1241 `bika08_229`, 1284 `bika07_229`, 1313 `bika09_229`, 1350 `bika14_229`, 1384 `bika13_229`). The monsters, scales and slot order are identical (boss, Tawrich, Zarich); only the battle-map label (variant 2b for `bika14_229`) and the last numeric block differ. The test rows 0270 to 0272 hold the three monsters one at a time.
* **Start positions are shipped** (`pos_*.psc`, byte-identical in all five scenes, and the same vectors in each compiled scene package): boss at (-45, -13); Yuna (23, 29), Rikku (33, 11), Paine (32, -9). The companions' spots are (0, 0), but both are linked to the boss's model by the boss's script, so they do not stand there (sections 7 and 8).
* **Rewards are the boss's only:** EXP 5,000, Gil 5,000, AP 30, Pilfer Gil figure 2,000, drop Ribbon (byte 255, both slots), steal Megalixir (byte 255, both slots). Zarich and Tawrich pay nothing.
* **The AI has a hidden scenario level (section 9).** All three scripts read a **save-data byte set by the Bikanel map scripts**. At levels 1, 2 and 3 the boss does nothing but wait, then ejects the party (Unnatural Selection) when its HP is at or below 90 / 70 / 50 percent of max (300,099 / 233,410 / 166,722) or after 1,600 polls; its **HP is carried between encounters in save data** and lifted back to a floor (90 / 80 / 60 percent) with DEF and MDEF set to 255. **The full fight (level 5, or any other value) is launched only by two scripted events** (maps `bika0800`, `bika1200`).
* **The full fight (section 9.5), per boss poll, in this order:** the first poll casts Perdition's Flame if HP is at least 80 percent (else it issues nothing); Osmose if MP is below 200; Full-Life on a dead Tawrich, then on a dead Zarich; Perdition's Flame when the poll counter reaches 15 (so polls 1, 8, 23, 38 ...); otherwise one roll of five: Flare (or Dispel when every girl has Reflect), Curaga on a companion, Bio, Demi, Demi. Flare is near-weighted among the girls without Reflect; Flame, Osmose, Bio and Demi go to the whole party.
* **Zarich** (full fight): Glimmer of Despair first, then six uniform-target Ga spells in the fixed order Firaga, Waterga, Thundaga, Blizzaga from a random start, then Glimmer again (7-poll cycle). **Tawrich**: seven Punches (near-weighted target, the only move that rolls to hit) then Bloody Breath (8-poll cycle).
* **Nothing reacts to a hit.** The reaction, menu and targeted entries are empty; the time-out block that every earlier boss script carries is dead code here too (section 9.9).
* **Both companions carry a permanent automatic status** (group-2 slots 15 and 16): by the damage note's address arithmetic these are the physical-immunity and magical-immunity counters (Zarich physical, Tawrich magical) [inferred, section 4.2].
* **A second stat block exists** in `monster2.bin` (boss Lv 56, HP 350,116, AGI 88) but all three rows have Oversoul type 0, so the only mechanism our notes know for selecting it is not triggered (section 5).
* **The repo holds no wiki numbers for Angra Mainyu to compare** (section 11): the three research files that mention him say only that he drops the Ribbon, which the row confirms.
* **Raw bytes for every unmapped column are in section 6; what is not proved is in section 12.**

## 1. Source block

| Item | Value |
|---|---|
| Archive | `FFX2_Data.vbf`, the Steam HD Remaster (FFX-2 half), the owner's own install, build 25501027 |
| Kernel tables [bytes] | `ffx_ps2/ffx2/master/jppc/battle/kernel/monster.bin` (96,596 bytes, SHA-256 starts 50964278e7b164e6), the English copy `new_uspc/battle/kernel/monster.bin` (119,716 bytes, 1831faed8e5c6f5b, which also carries the name text), and `monster2.bin` (jppc 87,842 bytes, 9327e6571d2f92ac; new_uspc 99,912 bytes, 2645ad692c415e3a). The same four files, hashes and table shape as in `re-ffx2-yojimbo-valefor.md` section 1 (header words, 370 rows of 200 bytes, row *i* at file offset `0x20 + 200 i`) |
| Locale copies [bytes] | bytes 8 to 199 of rows 268, 269 and 270 are identical in all ten locale copies of `monster.bin` and of `monster2.bin` (only the name and help references in the first eight bytes differ) |
| Formations [bytes] | `battle/kernel/btl.txt` (781,815 bytes, a2a9d7e0a28559f7), with `battle/header/monster.ath` (the monster symbols), `battle/kernel/btl.h` (the scene constants) |
| Scenes [bytes] | `battle/btl/<scene>/pos_<scene>.psc` (460 bytes, SHA-256 starts 08784e33c29d69f0, the same in all five), `<scene>.bin` (2,940 bytes each), `cam_<scene>.src` (60 bytes); `evt_*.src` and `scn_*.src` are 0 bytes in all five |
| Move rows [bytes] | `battle/kernel/monmagic.bin` (85,222 bytes, 35b432bbbec34bac) and `command.bin` (90,359 bytes, 6099fcff08194360) |
| Reader | our own VBF reader (standard library, opens the archive `rb`), run with `python -I`; the row parser is the one used for the earlier rows note. All three rows were also parsed by the earlier lane's independent parser (a separate program, same archive) and every field printed here is equal in both |

## 2. How the rows were identified

1. **The game's own name table** (English copy): row 268 decodes to Angra Mainyu, 269 to Zarich, 270 to Tawrich; no other row of either table carries these names, and no other row has model id 0x110c, 0x110d or 0x110e [bytes].
2. **The shipped symbol table** `battle/header/monster.ath` gives the ids 0x110c, 0x110d and 0x110e to the three "desert strongest boss" symbols 1, 2 and 3 (symbol 1 is the boss, 2 is Zarich, 3 is Tawrich) [bytes]. The AI sources `m268.src`, `m269.src` and `m270.src` are those three symbols' scripts [src].
3. **The formation table** `btl.txt` (section 7) names the three symbols together in five rows [bytes].
4. **Cross-check against the AI [src, bin]:** the ability list stored in each row equals, as a set, the move ids that the row's AI script queues (the boss's ten, Zarich's nine, Tawrich's two; the five time-out rows 0x4232 to 0x4236, section 9.9, are in no list).

## 3. Column map

The column map is the one in `re-ffx2-yojimbo-valefor.md` section 3 (it lives on the branch `re-ffx2-yojimbo-valefor` until that note is merged). In short, offsets from the start of the 200-byte row: +0x08 HP, +0x0c MP (u32); +0x10 level; +0x11 to +0x18 STR, DEF, MAG, MDEF, AGI, ACC, EVA, LCK; +0x19 thinking byte (never read) [note: re-ffx2-ai-fallen-trema.md section 1.6]; +0x1a special word [note: re-ffx2-damage.md 2.1, re-ffx2-atb-status.md 3.1 and 5]; +0x1c to +0x1f absorb, null, half, weak element bytes [note: re-ffx2-damage.md 3: bit 0 fire, 1 ice, 2 thunder, 3 water, 4 gravity, 5 holy]; +0x20 group-1 and +0x38 group-2 resist bytes (255 = immune) [note: re-ffx2-hit-status.md 4]; +0x50 and +0x54 automatic-status masks with the amounts from +0x58 [note: FFX2-G04 3.4, via the earlier rows note]; +0x70 ability list, 16 u16; +0x98 Oversoul type [note: re-ffx2-ai-fallen-trema.md 1.4]; +0x9c EXP, +0xa0 Gil, +0xa4 Pilfer Gil figure (i32); +0xa8 AP; +0xaa drop chance byte, +0xab steal chance byte; +0xac drop items, +0xb4 steal items, +0xbc bribe items (common id, count, rare id, count); +0xc4 Zantetsu byte [note: re-ffx2-commands.md 1].

The special word bits the game's own `monster.h` names: bit 0 ratio (immune to the percentage formulas), bit 1 damage-not-stop (a hit reaction does not slow the gauge), bit 2 live, bit 6 inv-atb (takes no ATB damage), bit 7 disable-Zantetsu, bit 8 Bribe (wairo), bit 9 magic-cancel (immune to Interrupt) [bytes: header]. Bit 10 has no accessor in the header.

## 4. The rows (`monster.bin`; every proved column)

### 4.1 Numbers

| Field | **Angra Mainyu (268)** | **Zarich (269)** | **Tawrich (270)** |
|---|---:|---:|---:|
| File offset of the row | 0xd180 | 0xd248 | 0xd310 |
| Level | 47 | 36 | 38 |
| HP | 333,444 | 5,440 | 5,440 |
| MP | 9,999 | 9,999 | 9,999 |
| STR | 73 | 70 | 85 |
| DEF | 124 | 0 | 99 |
| MAG | 97 | 25 | 42 |
| MDEF | 114 | 99 | 0 |
| AGI | 68 | 82 | 113 |
| ACC | 95 | 95 | 95 |
| EVA | 0 | 0 | 0 |
| LCK | 2 | 1 | 1 |
| Thinking byte (never read) | 0 | 0 | 0 |
| Special word | 0x7c3 | 0x7c3 | 0x7c3 |
| Special bits set | 0, 1, 6, 7, 8, 9, 10 | 0, 1, 6, 7, 8, 9, 10 | 0, 1, 6, 7, 8, 9, 10 |
| Element bytes (absorb / null / half / weak) | 0x00 / **0x10** / 0x00 / 0x00 | 0x00 / **0x10** / **0x2f** / 0x00 | 0x00 / **0x10** / 0x00 / 0x00 |
| Reading of the element bytes | null Gravity | null Gravity; half Fire, Ice, Thunder, Water and Holy | null Gravity |
| Automatic status, group 1 mask | 0 | 0 | 0 |
| Automatic status, group 2 mask / amount | 0 / none | **0x8000 (slot 15)** / 127 | **0x10000 (slot 16)** / 127 |
| Oversoul type | 0 | 0 | 0 |
| EXP | 5,000 | 0 | 0 |
| AP | 30 | 0 | 0 |
| Gil | 5,000 | 0 | 0 |
| Pilfer Gil figure | 2,000 | 0 | 0 |
| Drop chance byte | 255 | 0 | 0 |
| Drop, common / rare | Ribbon x1 (0x9056) / Ribbon x1 (0x9056) | none | none |
| Steal chance byte | 255 (always succeeds on its one attempt) | 0 | 0 |
| Steal, common / rare | Megalixir x1 (0x2009) / Megalixir x1 (0x2009) | none | none |
| Bribe slots | none | none | none |
| Zantetsu byte | 255 | 255 | 255 |
| Model id / motion-set id | 0x110c / 0x110c | 0x110d / 0x110d | 0x110e / 0x110e |

The special word has bit 10 set in all three rows of `monster.bin` and clear in all three of `monster2.bin` (section 5). Steal rule: a success is `draw % 255 < byte`, so 255 always succeeds, the rare slot is taken on 12.5 percent of successes, and one success clears the chance [note: re-ffx2-ai-leblanc-den-ixion.md 1.9]; here the common and rare slots hold the same item. The Pilfer Gil figure pays 50 to 100 percent of 2,000, once [same note].

### 4.2 Status resist bytes (255 = immune; every index not listed reads 0 and so lands)

**Group 1** (index meanings [note: re-ffx2-hit-status.md 4]; 17 and 18 are Itchy and Auto-Life [note: re-ffx2-ai-valefor.md 7.1, branch `re-ffx2-yojimbo-valefor`]): all three rows read 255 at **0 Death, 1 Petrify, 2 Sleep, 3 Silence, 4 Darkness, 5 Poison, 6 Confusion, 7 Berserk, 8 Curse, 10 Eject, 17 Itchy, 18 Auto-Life**. Index 9 (Defense), 15 (Always Critical) and the unmapped indexes 11 to 14, 16 and 19 to 23 read 0.

**Group 2** (index meanings [note: re-ffx2-hit-status.md 4]; which stage is which: only 7 STR, 9 DEF and 11 ACC are named [note: re-ffx2-ai-leblanc-den-ixion.md 2]):

| Row | 255 at | Reads 0 (lands) |
|---|---|---|
| 268 Angra Mainyu | 5 Slow, 6 Stop, 9 (the DEF stage), 10 (a stage, unnamed), 14 Doom | Shell, Protect, **Reflect**, Regen, Haste, stages 7, 8, 11, 12, 13, and 15 to 17 |
| 269 Zarich, 270 Tawrich | **2 Reflect**, 5 Slow, 6 Stop, 9, 10, 14 Doom | Shell, Protect, Regen, Haste, stages 7, 8, 11, 12, 13, and 15 to 17 |

**The companions' automatic statuses [inferred].** Group-2 status index *i* is the counter byte at character offset `0x438 + i` (Shell is 0x438, Protect 0x439 [note: re-ffx2-damage.md 2.1 steps 11 and 12; re-ffx2-hit-status.md 4.3]). The damage note's immunity bytes are 0x447 (physical), 0x448 (magical) and 0x449 (invincible). So slot 15 is the physical-immunity counter, slot 16 the magical-immunity counter and slot 17 the invincibility counter. Zarich's automatic mask is slot 15 and Tawrich's is slot 16, each with amount 127 (the largest signed byte; what the game does with the amount byte of an automatic status is not traced here, so "permanent" is an assumption). That reading matches the rows' defences (Zarich DEF 0 / MDEF 99, Tawrich DEF 99 / MDEF 0) and the two scripts' styles (Zarich a caster, Tawrich a puncher). **The slot meanings are not read from a status table here**; they follow from the address arithmetic only.

### 4.3 Ability lists (role: the set of commands the script queues; the order is the list's)

| Row | List |
|---|---|
| 268 Angra Mainyu | 0x412c Unnatural Selection, 0x412d Perdition's Flame, 0x412e Die, 0x406d Osmose, 0x30ba Full-Life (the revive spell), 0x3082 Demi, 0x3085 Bio, 0x30b5 Curaga, 0x30b8 Dispel, 0x3170 Flare |
| 269 Zarich | 0x412a Glimmer of Despair, 0x41ed Fira, 0x41f0 Watera, 0x41ef Thundara, 0x41ee Blizzara, 0x41f1 Firaga, 0x41f4 Waterga, 0x41f3 Thundaga, 0x41f2 Blizzaga |
| 270 Tawrich | 0x4129 Punch, 0x412b Bloody Breath |

(0x3xxx ids are rows of `command.bin`, 0x4xxx ids rows of `monmagic.bin`; the boss borrows six party command rows. Section 10 has every move's row.)

## 5. The second stat block (`monster2.bin`)

Same 370-row shape. Our notes use it for one thing: a monster whose Oversoul type has reached its kill count is rebuilt from it [note: re-ffx2-ai-fallen-trema.md 1.4]. **All three rows have Oversoul type 0 in `monster.bin`**, so nothing in our notes says the game reads these rows for these monsters; they are given so the numbers are on record.

| Field | 268 Angra Mainyu | 269 Zarich | 270 Tawrich |
|---|---:|---:|---:|
| Level / HP / MP | 56 / 350,116 / 9,999 | 43 / 5,712 / 9,999 | 46 / 5,712 / 9,999 |
| STR / DEF / MAG / MDEF | 73 / 124 / 97 / 114 (as `monster.bin`) | 70 / 0 / 25 / 99 (as) | 85 / 99 / 42 / 0 (as) |
| AGI / ACC / EVA / LCK | 88 / 95 / 0 / 3 | 107 / 95 / 0 / 1 | 147 / 95 / 0 / 1 |
| Special word | 0x3c3 (bit 10 clear) | 0x3c3 | 0x3c3 |
| Element bytes | null Gravity | null Gravity, half 0x2f | null Gravity |
| Automatic status group 1 | 0x2000 (slot 13, the Spellspring "Use MP 0" status [note: re-ffx2-ai-fallen-trema.md 1.2 item 12]) | 0x2000 | 0x2000 |
| Automatic status group 2 | none | 0x8000, amount 127 | 0x10000, amount 127 |
| Group-1 resist differences from `monster.bin` | Eject (10) reads 0 | Eject reads 0 | Eject reads 0 |
| Group-2 resist differences | Doom (14) reads 0 | Doom reads 0 | Doom reads 0 |
| EXP / AP / Gil / steal / drop / ability list / Zantetsu | all 0 or empty | all 0 | all 0 |

## 6. Unmapped columns (raw values)

| Field (bytes) | 268 | 269 | 270 |
|---|---|---|---|
| "basaku" word (+0x90) | unmapped (raw 0) | unmapped (raw 0) | unmapped (raw 0) |
| Sound id (+0x96) | unmapped (raw 4364, 0x110c) | unmapped (raw 4365) | unmapped (raw 4366) |
| Monster-type word (+0x9a) | unmapped (raw 0) | unmapped (raw 0) | unmapped (raw 0) |
| Special word bits 7, 8, 10 | unmapped (set; bits 7 and 8 are named in the header, their effects are not traced here) | same | same |
| Group-1 indexes 11 to 14, 16, 19 to 23 | unmapped (all read 0) | same | same |
| Group-2 stage 8 and stage 10 (which stat) | unmapped (stage 10 immune on all three; stage 8 lands) | same | same |
| Element bits 6 and 7 | unmapped (clear) | unmapped (clear) | unmapped (clear) |
| Name reference (+0x00) / help reference (+0x04) (English copy; identifiers only) | 0x0056858f / 0x01f9859c | 0x0034862b / 0x02e58632 | 0x003386e8 / 0x030386f0 |

The raw 200 bytes of each row (English copy; the other nine copies are equal from byte 8 on, only the first eight bytes, the name and help references, can differ):

```
monster.bin 268  8f8556009c85f901841605000f2700002f497c6172445f000200c30700100000ffffffffffffffffff00ff000000000000ffff00000000000000000000ffff0000ffff000000ff00000000000000000000000000000000000000000000000000000000000000000000000000000000002c412d412e416d40ba3082308530b530b830703100000000000000000000000000000c110c110c11000000008813000088130000d00700001e00ffff569001005690010009200100092001000000000000000000ff000000
monster.bin 269  2b8634003286e502401500000f2700002446001963525f000100c30700102f00ffffffffffffffffff00ff000000000000ffff00000000000000ff0000ffff0000ffff000000ff00000000000000000000000000008000000000000000000000000000000000007f00000000000000002a41ed41f041ef41ee41f141f441f341f241000000000000000000000000000000000d110d110d110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000ff000000
monster.bin 270  e8863300f0860303401500000f2700002655632a00715f000100c30700100000ffffffffffffffffff00ff000000000000ffff00000000000000ff0000ffff0000ffff000000ff0000000000000000000000000000000100000000000000000000000000000000007f0000000000000029412b410000000000000000000000000000000000000000000000000000000000000e110e110e11000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000ff000000
monster2.bin 268 e04f5600ed4f1900a45705000f27000038497c6172585f000300c30300100000ffffffffffffffffff0000000000000000ffff00000000000000000000ffff0000ffff000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c110c110c11000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
monster2.bin 269 f24f3400f94f1900501600000f2700002b460019636b5f000100c30300102f00ffffffffffffffffff0000000000000000ffff00000000000000ff0000ffff0000ffff0000000000000000000000000000200000008000000000000000000000000000000000007f0000000000000000000000000000000000000000000000000000000000000000000000000000000000000d110d110d11000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
monster2.bin 270 fe4f330006501900501600000f2700002e55632a00935f000100c30700100000ffffffffffffffffff0000000000000000ffff00000000000000ff0000ffff0000ffff000000000000000000000000000020000000000100000000000000000000000000000000007f00000000000000000000000000000000000000000000000000000000000000000000000000000000000e110e110e11000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
```

## 7. The formation (`btl.txt`)

Five formation rows hold the three monsters; the file lines are 1-based [bytes].

| Formation row | Name | File line | Battle map (translated label) | Scene constant | Slot 1 | Slot 2 | Slot 3 |
|---|---|---:|---|---|---|---|---|
| 1241 | `bika08_229` | 1253 | rock desert, Sanubia, first half, variant 1 | 0x032600e5 | row 268 | row 270 | row 269 |
| 1284 | `bika07_229` | 1296 | same | 0x032500e5 | row 268 | row 270 | row 269 |
| 1313 | `bika09_229` | 1325 | same | 0x032700e5 | row 268 | row 270 | row 269 |
| 1350 | `bika14_229` | 1362 | rock desert, Sanubia, first half, variant 2b | 0x032c00e5 | row 268 | row 270 | row 269 |
| 1384 | `bika13_229` | 1396 | same as 1241 | 0x032b00e5 | row 268 | row 270 | row 269 |

* Slot order: Angra Mainyu (slot 1), then **Tawrich (slot 2)**, then **Zarich (slot 3)**. The model scale before each monster symbol is 100 percent for all three. The boss's script links slot 2 to its left-hand model element and slot 3 to its right-hand element [src m268.src lines 36-37; bin 0x00c6, 0x00d2], so the companions ride on the boss model.
* Raw fields left unmapped: the six flag columns read 0 and so does the next one (the test rows read 6 there); the two numbers before the first scale read 80 and 0 (the Besaid and Cavern rows read 12, 0 and 30, 0); the last block reads (terrain label, then) 20, 290, 0, 580, 1080, 0, 0, 2040, 0, 290 in four rows and 20, 390, 0, 580, 1260, 0, 0, 2160, 0, 390 in row 1350. **Unmapped.**
* Test rows 0270, 0271 and 0272 (`zzzz02_68` to `zzzz02_70`, file lines 282 to 284) hold rows 268, 269 and 270 alone, on the test map.
* The compiled scene packages name the same constants: the boss's AI tests for exactly these five scene constants in its time-out block (section 9.9) [bin].

## 8. The scene and the start positions

### 8.1 The files [bytes]

All five scenes ship `pos_<scene>.psc` (460 bytes, **byte-identical in all five**, SHA-256 starts 08784e33c29d69f0), the compiled scene `<scene>.bin` (2,940 bytes each; the five are one template: `bika07` and `bika08` differ in 4 bytes, the scene's own number byte and three bytes of a stamp string, and `bika14_229` also differs in five numbers of a data block near the end of the package, next to numbers like those of the last block of its formation row; unmapped), `cam_<scene>.src` (60 bytes, which only includes a shared desert camera script that is not read here), and empty `evt_` and `scn_` sources (0 bytes). **The scene is not the empty template** (Besaid's was): its compiled package carries a small script of 426 code bytes [bin]. It hides two map layers at start, attaches the scene to the camera, and plays one camera approach (an opening polar camera move with a motion-blur effect, turned off in a second entry). It writes no stat, queues no command and tests nothing the AI reads [bin; inferred from the call list].

### 8.2 Start positions (ground plane x, height, z; the height is 0 for everyone) [bytes: pos file lines; bin: vectors]

| Who | Spot | Notes |
|---|---|---|
| Yuna (party slot 0) | (23, 29) | |
| Rikku (slot 1) | (33, 11) | |
| Paine (slot 2) | (32, -9) | |
| Player escape spots | (59, 8), (59, -11), (59, 18) | |
| **Angra Mainyu (monster slot 1)** | **(-45, -13)** | |
| Monster slot 2 (Tawrich) and slot 3 (Zarich) | (0, 0) and (0, 0) | both are linked to the boss's model elements by the boss's script, so these spots do not say where they stand [inferred; the link is [src] m268.src 36-37] |
| Monster escape spots | (0, 0) x 3 | |

Start directions are `0 0 0 0` for the party and no enemy direction is given, as in every other scene read so far [note: re-ffx2-ai-scene-positions.md], so the boss's facing at its first poll is the engine's default and is not known here. The compiled scene package holds the same vectors (16-byte records of x, height, z and a pad float, from offset 0xabc: the three party spots, the three party escape spots, the boss, then zeros) and they equal the text file in every scene [bin]. The map area offset is 0 and the map scale 1 on every axis.

Ground distance from the boss [arithmetic]: Yuna 79.93, Rikku 81.61, Paine 77.10 (for comparison, Besaid is 52 to 53 and Bahamut's scene 50).

### 8.3 What the geometry gives the near-weighted pick [inferred; model from re-ffx2-ai-bahamut-vegnagun.md 1.4]

The boss's Flare and Tawrich's Punch use the near-weighted target search (section 9.6). A candidate's weight is `1 + floor(32768 / floor(cost + 1))` with `cost = (1 + d)(1 + 2a)`, `d` the ground distance and `a` the angle between the searcher's facing and the direction to the girl. The facing is not shipped, so two bounds are given (Tawrich is attached to the boss, so his own position is also not known; the boss's numbers are the model):

| Alive | Facing the middle of the party (the earlier notes' worked example): Yuna / Rikku / Paine | Facing straight along +x (toward the girls' side): Yuna / Rikku / Paine |
|---|---|---|
| all three | 28.8 / 41.7 / 29.5 percent (weights 269, 391, 278) | 23.6 / 30.4 / 46.0 percent (weights 192, 249, 377) |
| Yuna down | 58.6 / 41.4 percent (Rikku, Paine) | 39.9 / 60.1 percent |
| Rikku down | 49.4 / 50.6 percent (Yuna, Paine) | 33.9 / 66.1 percent |
| Paine down | 40.9 / 59.1 percent (Yuna, Rikku) | 43.8 / 56.2 percent |

(The scan uses `r <= running sum`, so the first slot owns one extra value.) Girls move when they run in to attack and return; the file gives only the start formation.

## 9. The AI scripts (boss `m268`, Zarich `m269`, Tawrich `m270`)

### 9.1 Sources and checks

| Item | Value |
|---|---|
| AI sources [bytes] | `ffx_ps2/ffx2/master/jppc/battle/mon/m268.src` (8,807 bytes, SHA-256 starts 541b4eea836db046), `m269.src` (4,341; 84f8f6a9c219e557), `m270.src` (3,132; 865d3a5bd3983d50); presentation-only siblings `mt268/9/70.src` (2,616 each) and `mf268/9/70.txt` (1,862 each) |
| Compiled packages [bytes] | `.../mon/_m268/m268.bin` (81,888 bytes; e05539dcecf31098), `_m269/m269.bin` (56,016; f1acecdbd850a314), `_m270/m270.bin` (70,032; f5a8b6ef42b9cfb0); disassembled with the earlier lane's disassembler (kept outside the repo); offsets below are that tool's offsets inside the script chunk |
| Headers [bytes] | `battle/header/btlhead.src` (the script constants), `monmagic.ath`, `command.ath`, `btlatel.ath` |

Checks made:

* **Source against binary [bin].** The set of command ids each source queues equals the set in the disassembly: boss 15 ids (its ten plus the five time-out rows), Zarich 14 (nine plus five), Tawrich 7 (two plus five). The `random() % n` moduli are the same: boss 5 and 2, Zarich 4, Tawrich none. The HP fractions (9/10, 7/10, 5/10, 8/10, 6/10), the thresholds 1,600, 200, 15, 7, 8 and 100, the time-out stages 280/290/295/300, the stat numbers and the search arguments were then read side by side in the disassembly and are equal. The three save-data variables are in the compiled variable table.
* **Engine rules** (how a monster is polled, the two random streams, the target searches, the reaction entry, the dead time-out block, the target re-validation, monsters paying MP) are taken from the checked notes `re-ffx2-ai-bahamut-vegnagun.md` sections 1.1 to 1.7, `re-ffx2-ai-leblanc-den-ixion.md` section 1, `re-ffx2-ai-fallen-trema.md` section 1; no Ghidra call was made.
* **Rows.** All move rows were read byte by byte from `monmagic.bin` (offset `0x20 + 136 x (id - 0x4000)`) and `command.bin` (offset `0x20 + 140 x (id - 0x3000)`), with the column meanings of `re-ffx2-commands.md` section 1.

### 9.2 The three save-data values and the "scenario level" [bin: variable tables]

All three scripts read one **level** byte that is **not a battle variable but a save-data value** (offset 0xf08, one byte). It is set by the map before the battle is launched (section 9.3). The boss also keeps two more save-data values: a **first-encounter flag** (offset 0xf09, one byte; only tested for zero, written 80) and **its own HP** (offset 0xf04, four bytes). The rest are local counters (boss: first-poll switch, Perdition's Flame counter, loop counter, action count, time-out stage; Zarich: spell index, cycle counter, action count, time-out stage; Tawrich: cycle counter, action count, time-out stage). Locals start at 0 by the rule every earlier note assumes [note: re-ffx2-ai-fallen-trema.md 1.3].

What the level does (the source's own comments call the values 1, 2 and 3 scenario levels 1 to 3 and the default branch scenario level 5; the code treats 0, 4, 5 and anything else alike as the default):

| Level byte | Boss | Zarich | Tawrich |
|---|---|---|---|
| **1** | HP floor 90 percent; waits; Unnatural Selection at HP at or below 90 percent or after 1,600 polls | hidden and untargetable, never acts | hidden and untargetable, never acts |
| **2** | floor 80 percent restored when HP is below 70; waits; Unnatural Selection at or below 70 percent or after 1,600 polls | hidden and untargetable, never acts | hidden and untargetable; **Punch every poll** |
| **3** | floor 60 percent restored when HP is below 50; waits; Unnatural Selection at or below 50 percent or after 1,600 polls | hidden and untargetable; **casts a -ra spell every poll** | hidden and untargetable; **Punch every poll** |
| **0, 4, 5, any other** (the full fight) | the whole script of section 9.5 | the script of section 9.7 | the script of section 9.8 |

("Hidden and untargetable" = the cursor flag and the existence flag are switched off [src m269.src 43-44, m270.src 39-40; bin]. In the full fight only the existence flag is switched off, section 9.7.)

### 9.3 Who sets the level [bin: the Bikanel event packages `bika0700` to `bika1400`]

The eight Bikanel map event packages reference the level byte. (A scan of every file of the FFX-2 half of the archive under 40 MB for that variable-table entry found only these eight, one test map package `test04` that was not read, the three AI packages, and one card-game map archive whose match is a byte coincidence [inferred].) In each map the encounter site picks the level from a **save-data counter at offset 0xa00** (the same counter in all eight; it looks like the story-progress counter, which is not confirmed here): at or below **1,500 the level is 1; up to 2,900 it is 2; up to 3,900 it is 3; from 3,901 to 5,900 the site launches an ordinary formation of the same map family instead (for example `bika08_226`, Fly Eye and Killer Hound) and the level is not set; above 5,900 the level is 1 again.** The scene launched is the map's own Angra Mainyu scene:

| Map package | Scene launched at the ladder |
|---|---|
| `bika0700`, `bika1100` | `bika07_229` (0x032500e5) |
| `bika0800`, `bika1200` | `bika08_229` (0x032600e5) |
| `bika0900`, `bika1300` | `bika09_229` (0x032700e5) |
| `bika1000` | `bika13_229` (0x032b00e5) |
| `bika1400` | `bika14_229` (0x032c00e5) |

**The level 5 is set in two places only: map `bika0800` (once, in a story event, followed at once by the launch of `bika08_229`) and map `bika1200` (twice: once followed at once by the launch of `bika08_229`, and once at the start of a longer sequence that was not followed further)** [bin]. The launch there carries battle flags with the raw value 1281 (0x501); the ladder sites pass 0. **Which story chapter each counter range is, what the two level-5 events require, and what happens to the battle result after the party is ejected are not in these files** (section 12).

### 9.4 The boss's start section [src m268.src 32-104; bin w0.f0 0x0006-0x026b]

In order:

1. Presentation settings (motion constants and the like). The death pattern is "falls, cannot be raised" [src btlhead.src 693-694]. Move and jump flags are on, so it never moves.
2. **It links monster slot 2 (Tawrich) to its left-hand model element and slot 3 (Zarich) to its right-hand element** [src 36-37; bin 0x00c6, 0x00d2]. They ride on the boss's model.
3. **HP carry-over.** If the first-encounter flag is 0: store the current HP (the row's 333,444) in the HP variable and set the flag to 80. Otherwise: **set the boss's HP to the stored value.** So in a continuing save every battle starts at the HP it was stored with, which only changes at Unnatural Selection (section 9.5), never in the full fight.
4. Read the maximum HP, then by level (integer arithmetic, `max x n / 10`, max = 333,444): level 1: if HP is **below 300,099** set HP to 300,099; level 2: if HP is below **233,410** set HP to **266,755**; level 3: if HP is below **166,722** set HP to **200,066**. In each case it also sets the two stats the source calls vit and spirit to **255**. The header calls the stat-change slots of those two "defense adjustment" and "magic defense adjustment" [src btlhead.src 193-194], so they are DEF and MDEF [inferred]. A DEF or MDEF of 255 turns the term `(270 - stat) / 255` of the base formulas into 15/255, 5.9 percent of the unreduced number [note: re-ffx2-damage.md 1], **if** the stat set here is the one the formulas read [inferred]. Levels 0, 4, 5 and the rest change nothing.
5. The action counters and the time-out stage are set to 0.

### 9.5 The boss's action entry

**A. The time-out block** comes first in every script and never runs (section 9.9).

**B. Levels 1, 2 and 3: the capped fights [src 150-213; bin w0.f2 0x035c-0x04d8].** Each poll: the loop counter gains 1. If it has reached **1,600**, or HP is **at or below** 90 / 70 / 50 percent of max (300,099 / 233,410 / 166,722), the boss first stores its current HP in the save-data HP variable and then queues **Unnatural Selection on the whole party** (the action count gains 1). Otherwise **it queues nothing**, stays ready, and is polled again on the next step. Nothing else is in these levels: no attack, no spell, no other check. Unnatural Selection is instant (cost 0 / 0) and inflicts group-1 slot 10 (Eject) at chance 255 on every girl; chance 255 lands even through a resist of 255 [note: re-ffx2-hit-status.md 4.1], so a Ribbon does not stop it [inferred from that rule]. (Eject is skipped while the target's action-state mask has any bit other than 4 [note: re-ffx2-hit-status.md 4.2]; what those bits are is open there, and nothing here says whether it can happen to a girl at that moment.) After the 1,600th poll every following poll queues it again. At about one poll per step after the first gauge, 1,600 polls are 53.4 s [note: bahamut 1.1, timing-measured].

Consequences [inferred from the arithmetic]: at level 1 on a continuing save whose stored HP is at or below the line, the HP is restored to exactly 300,099 (or is already there) and the next test (at or below 300,099) is already true, so the boss ejects the party at its first poll (0.9 to 2.7 s after the start, section 9.11); on a fresh save (HP 333,444) the party has to take 33,345 HP off before it does. Level 2 restores to 266,755 and fires at 233,410 (33,345 to chew through); level 3 restores to 200,066 and fires at 166,722 (33,344). The stored HP is whatever the boss had when it cast Unnatural Selection, and the restore step of the next battle lifts a lower value back to the level's floor.

**C. Levels 0, 4, 5 and the rest: the full fight [src 214-310; bin w0.f2 0x04db-0x06ba].** Each poll starts with **the Flame counter gaining 1** (before anything else), then:

| # | Condition (tested in this order) | What he does | Flame counter | RNG | Source lines | Bin offsets |
|---|---|---|---|---|---|---|
| 1 | first poll only (the first-poll switch is still 0; it is set to 1 now), HP at least 80 percent of max (266,755) | **Perdition's Flame** on the whole party | set to 8 | none | 218-226 | 0x04ec-0x052c |
| 1b | first poll only, HP below 266,755 | **no command** (the poll ends; he stays ready and is polled again on the next step) | stays at its +1 | none | 227-230 | 0x052f |
| 2 | MP below 200 | **Osmose** on the whole party | no change | none | 234-238 | 0x053f-0x0555 |
| 3 | Tawrich is dead | **Full-Life** on Tawrich | no change | none | 241-245 | 0x0561-0x0577 |
| 4 | Zarich is dead | **Full-Life** on Zarich | no change | none | 248-252 | 0x0583-0x0599 |
| 5 | Flame counter at least 15 | **Perdition's Flame** on the whole party | set to 0 | none | 255-260 | 0x05a3-0x05bf |
| 6 | otherwise: one draw `random() % 5` | 0: Flare or Dispel (below); 1: Curaga (below); 2: Bio; 3 or 4: Demi | no change | stream 2 | 263-304 | 0x05c9-0x0699 |

* **Roll 0 (1 in 5):** a near-weighted search over the living, targetable girls **who do not have Reflect** [bin: search arguments stat 76 (Reflect), word 128 ("not"), mode 1 (near)]. If it finds one, **Flare** on her. If every living girl has Reflect (no candidate, value 255), **Dispel** on one living girl chosen uniformly (stream 4) [src 267-278; bin 0x05e5-0x0630].
* **Roll 1 (1 in 5):** a second draw `random() % 2` (stream 2): 0 = **Curaga on Zarich**, 1 = **Curaga on Tawrich** [src 282-292]. It casts even when both are at full HP.
* **Roll 2: Bio** on the whole party. **Rolls 3 and 4: Demi** on the whole party (so Demi is 2 in 5). The modulo bias of 65,536 over 5 is 0.002 points [inferred].
* The empty `else` of the first poll in row 1b is the only place the boss can issue nothing in the full fight.
* The Flame counter counts **polls**, including the Osmose, Full-Life and empty polls, and is tested after the other branches have declined; so a raise or an Osmose delays a due Flame by one poll each. The opening Flame resets the counter to 8, so the next Flame is the 7th poll after it; after every later Flame (counter 0) the Flame is every 15th poll.

### 9.6 Targeting [bin: the search macro arguments; note: bahamut 1.4, leblanc 1.3 and 1.12]

* **Whole-party commands** (Flame, Osmose, Bio, Demi, Unnatural Selection; Glimmer of Despair and Bloody Breath of the companions; Zarich's -ra spells at level 3) name the party group: every party-side character, fallen ones included. The single-target Osmose is aimed at the group too; a mask whose members are all valid is left alone by the target re-validation, so the effect is applied to each girl in the mask [note: leblanc-den-ixion 1.12; the all-valid case was run on the live exe; the hit on every member of a group-aimed single row is the note's reading, not run: M].
* **Near-weighted** (`searchr`, mode 1; weight `1 + floor(32768 / floor(cost + 1))`, `cost = (1 + d)(1 + 2a)`; stream 4; nothing is drawn with one candidate): the boss's **Flare** (candidates without Reflect) and **Tawrich's Punch** (all living girls). Odds at the shipped start formation: section 8.3 (boss; Tawrich's own position is not known).
* **Uniform** (`searchr_nop`, the `(value mod n)`-th candidate in slot order; stream 4): the boss's **Dispel**, and **every Zarich single-target spell in the full fight**.
* **By monster id** (every copy, living or dead): **Full-Life** and **Curaga** on Zarich or Tawrich.
* No script reads distance, positions or the party's levels, HP or MP; the only party state tested is Reflect, and alive-or-not for the uniform picks. The boss never targets itself.
* A "living" girl for these searches means "not flagged dead" (a petrified girl counts as alive) [note: leblanc-den-ixion 1.3].

### 9.7 Zarich (`m269`, slot 3) [src m269.src 28-195; bin w0.f0 0x0006-0x016d, w0.f2 0x017f-0x043c]

* **Start:** the death pattern is "falls, can be raised"; **the existence flag is switched off** [src 30, bin 0x00ba]; the title-position stat is set to 58 (presentation); move and jump flags on; counters 0. **One draw `random() % 4` (stream 2) at battle start sets her spell index (0 to 3)** and the cycle counter is set to 10. Levels 1 to 3 also switch her cursor flag off.
* **Existence flag off in the full fight:** the end-of-battle check skips monsters whose existence flag is off [note: re-ffx2-experiment.md, "the end-of-battle check, 0x61ef90"], so **the fight ends when Angra Mainyu falls whether or not she lives** [inferred]; she is still targetable (cursor on) in the full fight.
* **Level 1 and 2:** nothing. **Level 3:** every poll the spell index gains 1 and she casts on the whole party: index 1 Fira, 2 Watera, 3 Thundara, otherwise (4) index back to 0 and Blizzara.
* **Full fight (every other level), per poll:**

| # | Condition | Action | Cycle counter | Spell index | RNG | Source lines |
|---|---|---|---|---|---|---|
| 1 | her MP below 100 | **Glimmer of Despair** on the whole party | no change | no change | none | 146-150 |
| 2 | cycle counter (after +1) at least 7 | **Glimmer of Despair** on the whole party | set to 0 | no change | none | 153-160 |
| 3 | otherwise (spell index +1 first) | index 1 **Firaga**, 2 **Waterga**, 3 **Thundaga**, otherwise (4) index to 0 and **Blizzaga**; on one living girl chosen uniformly | +1 (done above) | as stated | stream 4 | 163-190 |

 The counter is tested after its own +1 and starts at 10, so her **first poll is Glimmer of Despair**, then **six spells** (counter 1 to 6), then Glimmer (counter 7), and so on: a **7-poll cycle of 6 spells and 1 Glimmer**. The four spells go round in the fixed order Firaga, Waterga, Thundaga, Blizzaga starting at a random point (the start-up draw: index 0 gives Firaga first, 1 Waterga, 2 Thundaga, 3 Blizzaga); the index is not reset by Glimmer. The MP gate (below 100) is not reachable in play unless the party drains her: she pays 24 MP per Ga spell and 0 for Glimmer, about 144 MP a cycle (six spells at 24) from 9,999 [note: leblanc-den-ixion 1.6; inferred arithmetic].

### 9.8 Tawrich (`m270`, slot 2) [src m270.src 26-133; bin w0.f0 0x0006-0x0151, w0.f2 0x0163-0x030a]

* **Start:** the death pattern is "falls, can be raised"; **the existence flag is switched off**; move and jump flags on; counters 0; levels 1 to 3 also switch the cursor flag off. No random draw.
* **Level 1:** nothing. **Levels 2 and 3:** **Punch** every poll on a living girl by the near-weighted search.
* **Full fight, per poll:** the cycle counter gains 1; if it is **at least 8** it is set to 0 and he casts **Bloody Breath** on the whole party; otherwise **Punch** on a living girl by the near-weighted search (stream 4). So his cycle is **7 Punches, then 1 Bloody Breath** (eight polls), starting with a Punch (the counter starts at 0). No MP test, no HP test.

### 9.9 Reaction, menu, targeted and death entries; the blocks that never run

* **Reaction, menu and targeted entries are empty in all three scripts** [src m268.src 315-325, m269.src 199-209, m270.src 137-147; bin]. Nothing in the fight reacts to a hit. No counter-attack, no change of behaviour at any HP in the full fight, no status test (only Reflect is searched), no element test.
* **Death entry:** the boss, if a death reaction is allowed, queues the **Die** row (0x412e) on itself [src 327-334; bin 0x06df-0x06eb]. Row 0x412e is not an attack (target flags 0x41: dead allowed, no damage class, no status). It is presentation. Zarich's and Tawrich's death entries are empty; they are raised by the boss (rows 3 and 4 of the table in 9.5).
* **The time-out block never runs.** Each script starts its action entry with the generic block that counts actions and, past 280, 290, 295 and 300 actions, would queue four message-only rows (0x4232 to 0x4235: no damage, recovery cost 50, physical-type flag) and then the 12-hit random-target fixed-damage row 0x4236 (formula 5, power 200: 9,999 a hit [note: bahamut 1.6]), but only in the five scenes `bika08_229`, `bika07_229`, `bika09_229`, `bika13_229` and `bika14_229`. It sits behind the guard "the count of living, unpetrified party members is 0", the same guard as in the other bosses, which is true only when no girl can act, and the ATB clock does not step then [note: bahamut 1.6, leblanc 1.8]. **Here the three scripts raise their action counters outside the guard (in every branch), so the counter does rise, but nothing reads it except this block. Nothing to implement.**
* Unused: the second roll variable, the scene variable and the reaction counter of each script are declared and never used.

### 9.10 Random streams [note: bahamut 1.3, hit-status 1.1]

* `random() % n`: global stream 2, the low 16 bits of one draw. The boss draws `% 5` once per full-fight poll that reaches the roll (rows 1 to 5 of the table draw nothing) and `% 2` after a roll of 1. Zarich draws `% 4` once, at battle start. Tawrich draws nothing. The levels 1 to 3 draw nothing.
* Target searches: global stream 4, a draw only with two or more candidates (Flare's near-weighted pick, Dispel's uniform pick, Zarich's picks, Tawrich's Punch pick).
* Hit rolls and damage variance: the per-character streams, as for every command. Only Tawrich's Punch rolls to hit (accuracy formula 1, byte 125); every other move of the three has accuracy formula 0 and never rolls [bytes, section 10].

### 9.11 The full fight in turns, and the cadence

Recovery after a command is `cost_atb x 10000 / (AGI + 1)` units, the charge before it fires is `cost_cast x 10000 / (AGI + 1)` units, 95 units a step at normal speed, 29.97 steps a second, steps rounded up [note: bahamut 1.1, timing-measured]. The first gauge is 25 to 74 percent of `70 x 10000 / (AGI + 1)` units, drawn once at the start. Thinking time is 0 plus 30 steps for every girl who is dead or petrified. All three have special bit 1, so a hit reaction does not slow their gauges. Animation time is on top of everything below and was not read.

| Actor (AGI) | First gauge | Move | Charge (units, steps, s) | Recovery (units, steps, s) |
|---|---|---|---|---|
| Angra Mainyu (68) | 2,536 to 7,506 units, 27 to 80 steps, 0.9 to 2.7 s | Flare, Full-Life | 14,492, 153, 5.11 | 0 |
| | | Demi, Bio | 11,594, 123, 4.10 | 0 |
| | | Osmose | 13,043, 138, 4.60 | 0 |
| | | Dispel, Curaga | 8,695, 92, 3.07 | 0 |
| | | Perdition's Flame | 17,391, 184, 6.14 | 14,492, 153, 5.11 |
| | | Unnatural Selection, Die | 0 | 0 |
| Zarich (82) | 2,108 to 6,240 units, 23 to 66 steps, 0.8 to 2.2 s | Glimmer of Despair | 14,457, 153, 5.11 | 9,638, 102, 3.40 |
| | | any -ra or -ga spell | 8,433, 89, 2.97 | 0 |
| Tawrich (113) | 1,535 to 4,543 units, 17 to 48 steps, 0.6 to 1.6 s | Punch | 1,754, 19, 0.63 | 7,017, 74, 2.47 |
| | | Bloody Breath | 10,526, 111, 3.70 | 7,017, 74, 2.47 |

(All the party-row spells carry a recovery cost of 0, so the boss polls again as soon as the charge and the animation are over; the Flame is the only boss move with a rest.)

**The boss's turns when nothing intervenes** (full HP, both companions alive, MP above 200) [src, arithmetic]: poll 1 Perdition's Flame (counter 8); polls 2 to 7 six rolls; **poll 8 Perdition's Flame** (counter reaches 15, then 0); then 14 rolls and a Flame, so the Flames are polls 1, 8, 23, 38, 53 and so on (**every 15th poll after the 8th**). With a restored HP below 266,755 poll 1 issues nothing and the Flames are polls 15, 30, 45 ... (13 rolls before the first). The mix of the rolls: Flare 20 percent (Dispel instead only if every girl has Reflect), Curaga 20 percent, Bio 20 percent, Demi 40 percent; a dead companion adds a Full-Life poll first (Tawrich before Zarich) and moves every later poll by one. With the casts above (3.07 to 5.11 s of charge each) a roll costs about 4 s, a Flame 11 s (charge and rest), animations excluded.

## 10. The moves (rows of `monmagic.bin` and `command.bin`)

Column meanings: `re-ffx2-commands.md` section 1. Damage class: bit 1 HP, bit 2 MP, bit 4 ATB. Formula glossary: `re-ffx2-damage.md` section 1 and `re-ffx2-ai-leblanc-den-ixion.md` 1.11. A physical-only row is reduced by Protect, a magical-only row by Shell, a row with neither bit by neither [note: leblanc-den-ixion 1.11]. The attacker term is the formula's attacker side before the target's defence term, stages and the variance (240 to 271 out of 256) [note: damage 1].

| Move (owner) | What it does | Type / accuracy / element | Statuses and amounts | Cost: recovery / charge / MP |
|---|---|---|---|---|
| **Unnatural Selection** 0x412c (boss, levels 1 to 3) | whole party; no damage (class 0, power 0) | neither type; formula 0, **never rolls**; no element | **Eject** (group-1 slot 10) chance **255** | 0 / 0 / 0 |
| **Perdition's Flame** 0x412d (boss, full fight) | **10 hits**, each on a random party member (random-target bit), each hit **3/16 of that girl's maximum HP** (formula 7, power 3), class HP | **physical**, never rolls, no crit flag, no element; Protect halves it, Shell does not | none | 100 / 120 / 0 |
| **Osmose** 0x406d (boss, MP below 200) | class **MP**, formula 4, power 3: **3/16 of each girl's current MP**, absorbed by the boss (the row's absorb bit); aimed at the whole party | neither type; never rolls; silenceable | none | 0 / 90 / 0 |
| **Full-Life** 0x30ba (boss, on a dead companion) | formula 7, power 16: heals **100 percent of maximum HP** and clears Death; target may be dead | magical type; never rolls; reflectable, silenceable | cleanse Death (slot 0) chance 254 | 0 / 100 / **60** |
| **Curaga** 0x30b5 (boss, roll 1) | formula 6, power 38: attacker term 2,154, **heals 2,019 to 2,280 HP** to the chosen companion; no defence term | magical type; never rolls; reflectable, silenceable; may target all | none | 0 / 60 / **20** |
| **Bio** 0x3085 (boss, roll 2) | no damage (class 0, formula 0, power 0); whole party | magical type; never rolls; reflectable, silenceable | **Poison** (slot 5) chance **100** | 0 / 80 / **16** |
| **Demi** 0x3082 (boss, rolls 3 and 4) | formula 4, power 4: **4/16 = 25 percent of each girl's current HP**, class HP; whole party | magical type; never rolls; silenceable; element bit 4 (**Gravity**) | none | 0 / 80 / **10** |
| **Dispel** 0x30b8 (boss, roll 0 when every girl has Reflect) | cleanse; one girl | magical type; never rolls; silenceable | cleanses group-1 slots 13, 14, 15, 18 and group-2 slots 0 to 4 (Shell, Protect, Reflect, Regen, Haste), chance 254, amount 127 | 0 / 60 / **12** |
| **Flare** 0x3170 (boss, roll 0) | formula 2, power 55: attacker term **9,027**; one girl; class HP; shatter 100 | magical type; never rolls; reflectable, silenceable; no element | none | 0 / 100 / **54** |
| **Die** 0x412e (boss, on death) | nothing (target flags 0x41: dead allowed) | | | 0 / 0 / 0 |
| **Glimmer of Despair** 0x412a (Zarich) | class **MP**, formula 2, power 8: attacker term 97; whole party | neither type; never rolls; no element | group-2 slots 7, 8, 9, 10 at chance 255 with steps **-1, -1, -2, -2** (slot 7 STR, slot 9 DEF [note: leblanc 2]; 8 and 10 unmapped) | 80 / 120 / 0 |
| **Fira, Watera, Thundara, Blizzara** 0x41ed, 0x41f0, 0x41ef, 0x41ee (Zarich, level 3) | formula 2, power 12: attacker term 218; whole party at level 3; shatter 20 | magical; never rolls; reflectable, silenceable; element Fire 0x1, Water 0x8, Thunder 0x4, Ice 0x2 | none | 0 / 70 / 12 |
| **Firaga, Waterga, Thundaga, Blizzaga** 0x41f1, 0x41f4, 0x41f3, 0x41f2 (Zarich) | formula 2, power 19: attacker term 547; one living girl (uniform); shatter 20 | as above | none | 0 / 70 / 24 |
| **Punch** 0x4129 (Tawrich) | formula 0, power 12: attacker term 472 (`472 x 12 / 16 = 354` before the DEF term); one girl, class HP | **physical**; **rolls to hit: accuracy formula 1, accuracy byte 125**; no crit flag; no element | none | 80 / 20 / 0 |
| **Bloody Breath** 0x412b (Tawrich) | formula 2, power 12: attacker term 265; whole party; class HP | **neither type** (damage flags 0): neither Shell nor Protect reduces it; never rolls | **Silence 254, Darkness 254, Poison 254** (slots 3, 4, 5), **Confusion 128** (slot 6) | 80 / 120 / 0 |

Status chances use the landing rule of `re-ffx2-hit-status.md` 4.1: a chance of 255 always lands; 254 lands unless the girl's resist byte is 255; any other value lands when `draw % 101 < chance + 5 x (attacker level - target level) - resist`. The attacker levels are 47 (boss), 36 (Zarich), 38 (Tawrich). The attacker terms use the row's level and MAG or STR: boss L47 MAG 97, Zarich L36 MAG 25, Tawrich L38 STR 85 MAG 42 [bytes; arithmetic]. The boss and the companions pay the MP costs above from their own 9,999 MP [note: leblanc-den-ixion 1.6, M].

The record-shaped numbers of every move row, and the raw unmapped bytes, are in the appendix.

## 11. Comparison with the repo's existing numbers

Searched on `r48-rc`: `research/`, `src/data/`, `docs/plans/`, `docs/handoff/`, `DECISIONS.md`, `docs/target/`. **The repo holds no wiki numbers for Angra Mainyu, Zarich or Tawrich** (no level, HP, stat, element, status, move or reward value, and no AI), and `src/` has no file for them. The few statements it does hold:

| Statement in the repo | Game | Verdict |
|---|---|---|
| `research/ffx2-bahamut.md` line 237 (the Ribbon's wiki page lists "Drop: Angra Mainyu") and `research/ffx2-vegnagun-shuyin.md` line 984 ("also drops from Angra Mainyu") | Ribbon x1 in both drop slots, drop chance byte 255 | **agree** |
| `docs/plans/next-content-2026-09-27.md` line 52: "FFX-2 only", "Bikanel, Ch. 5" | the five `bika*_229` scenes (Bikanel desert maps); no chapter number is stored in the files | **agree on the game and the place**; the chapter is not decidable here (the scripts use a save counter, section 9.3) |
| `DECISIONS.md` D-520 and D-536: "a real challenge fight at the end of the Bikanel Desert" | the full fight (level 5) is launched only by two scripted events, in maps `bika0800` and `bika1200`; the ladder encounters are capped fights | **consistent**, not decidable here |
| `docs/plans/next-content-2026-09-27.md` line 189 lists "Angra Mainyu (X-2) 4041096" | a source-list number (it sits among wiki page identifiers), not a stat | **not a game value**; ignore for pinning |

**Everything else in sections 4 to 10 is new to the repo.** For the driver's wiki-based chapter, the values to compare are the three columns of section 4.1 and the move table of section 10. In particular the wiki-style numbers most likely to differ from a first build are: AGI (68 / 82 / 113) and the recovery and charge costs (section 9.11); the two scripted caps (the level ladder) that make the lower-level fights end by ejection; the companions' immunities and their automatic statuses (section 4.2); Flare's Reflect test and the Dispel fallback; the Flame cadence (every 15th poll, opening on the first poll when HP is at least 80 percent); Zarich's 7-poll cycle and Tawrich's 8-poll cycle; and the 100-percent Full-Life revive of a fallen companion before anything else but the Osmose gate.

## 12. Open items (not proved here)

1. **Which story chapter each counter range of the ladder is** (1,500 / 2,900 / 3,900 / 5,900), and what the two level-5 events (maps `bika0800`, `bika1200`) require. The counter's name and the events' conditions were not traced.
2. **What the battle does after Unnatural Selection ejects the whole party** (an ordinary end, or a defeat), and what the map script does with the stored HP afterwards. The row and script only show that the HP is stored before the cast.
3. **Whether the companions' existence flag stays off in the full fight** (so that only the boss's death ends the battle), and whether they are drawn; only the script's set-up is read. "The fight ends when the boss falls" is inferred from the end-of-battle check described in `re-ffx2-experiment.md`.
4. **The meaning of group-2 slots 15 to 17** (inferred by address arithmetic as physical, magical and invincible immunity counters) and of the amount 127 on an automatic status.
5. **The boss's facing at its first poll** and **where the companions stand** (they are attached to model elements), so Tawrich's near-weighted odds cannot be given; the shipped girls' spots are the start formation only.
6. **Whether the stat numbers the boss sets to 255 are the DEF and MDEF the damage formulas read** (inferred from the header's names).
7. **Animation and effect lengths** of every move (only the cost columns were used), and the unmapped row bytes (appendix).
8. **Whether the game ever reads the `monster2.bin` rows** for these three monsters (Oversoul type 0).
9. **Special-word bits 7, 8 and 10** (7 and 8 are named in the game's header; their effects, and bit 10's, are not traced here), and the Bribe flag's bit [note: valefor AI 7.2].
10. **The raw values left unmapped**: section 6, the formation row's unmapped columns (section 7), the battle flags 1281 of the level-5 launch, the scene package's data block.
11. **Monsters paying MP** and the group-aimed single-target rows hitting each girl are the checked notes' readings (M), not run for this fight.
12. **A new game on a used save:** the HP variable and the first-encounter flag are save-data values; how they behave across a new game or a reset was not traced. A fresh save (flag 0) starts the boss at the row's 333,444 HP.

## 13. Notes cited

In the repo (`research/` on `r48-rc`): `re-ffx2-damage.md`, `re-ffx2-hit-status.md`, `re-ffx2-atb-status.md`, `re-ffx2-commands.md`, `re-ffx2-timing-measured.md`, `re-ffx2-ai-bahamut-vegnagun.md`, `re-ffx2-ai-leblanc-den-ixion.md`, `re-ffx2-ai-fallen-trema.md`, `re-ffx2-ai-scene-positions.md`, `re-ffx2-experiment.md`, `ffx2-bahamut.md`, `ffx2-vegnagun-shuyin.md`. On the branch `re-ffx2-yojimbo-valefor` (until merged): `re-ffx2-yojimbo-valefor.md` (the column map, section 3), `re-ffx2-ai-valefor.md` (Itchy and Auto-Life, the special word bits). Kept outside the repo: the coverage notes `FFX2-G04.md` (automatic statuses) and the extraction tools.

## Appendix: the move rows as numbers, and the raw bytes

Record-shaped numbers (the fields of `FFX2CommandRecord`; status maps are in section 10). File offsets are in the file named in the cell; the row sizes are 136 bytes (`monmagic.bin`) and 140 bytes (`command.bin`).

| Owner | Move | id | file offset | costAtb | costCast | costMp | flagsTarget | flagsMisc | flagsDamage | damageClass | formula | crit byte | accuracy byte | power | hits | shatter | element | killer |
|---|---|---|---|---:|---:|---:|---|---|---|---:|---:|---:|---:|---:|---:|---:|---|---:|
| Angra Mainyu | Unnatural Selection | 0x412c | 0x9f80 (monmagic) | 0 | 0 | 0 | 0x5 | 0x41000006 | 0x0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0x0 | 0 |
| Angra Mainyu | Perdition's Flame | 0x412d | 0xa008 (monmagic) | 100 | 120 | 0 | 0x17 | 0x41004006 | 0x1 | 1 | 7 | 0 | 0 | 3 | 10 | 0 | 0x0 | 0 |
| Angra Mainyu | Die | 0x412e | 0xa090 (monmagic) | 0 | 0 | 0 | 0x41 | 0x2 | 0x0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0x0 | 0 |
| Angra Mainyu | Osmose | 0x406d | 0x3a08 (monmagic) | 0 | 90 | 0 | 0x33 | 0x20208106 | 0x0 | 2 | 4 | 0 | 0 | 3 | 1 | 0 | 0x0 | 0 |
| Angra Mainyu | Full-Life | 0x30ba | 0x65d8 (command) | 0 | 100 | 60 | 0x71 | 0x20248087 | 0x32 | 1 | 7 | 0 | 0 | 16 | 1 | 0 | 0x0 | 0 |
| Angra Mainyu | Demi | 0x3082 | 0x4738 (command) | 0 | 80 | 10 | 0x437 | 0x20208006 | 0x2 | 1 | 4 | 0 | 0 | 4 | 1 | 0 | 0x10 | 0 |
| Angra Mainyu | Bio | 0x3085 | 0x48dc (command) | 0 | 80 | 16 | 0x437 | 0x20208086 | 0x2 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0x0 | 0 |
| Angra Mainyu | Curaga | 0x30b5 | 0x631c (command) | 0 | 60 | 20 | 0x4b1 | 0x20208087 | 0x12 | 1 | 6 | 0 | 0 | 38 | 1 | 0 | 0x0 | 0 |
| Angra Mainyu | Dispel | 0x30b8 | 0x64c0 (command) | 0 | 60 | 12 | 0x433 | 0x20208006 | 0x22 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0x0 | 0 |
| Angra Mainyu | Flare | 0x3170 | 0xc960 (command) | 0 | 100 | 54 | 0x433 | 0x20208086 | 0x2 | 1 | 2 | 0 | 0 | 55 | 1 | 100 | 0x0 | 0 |
| Zarich | Glimmer of Despair | 0x412a | 0x9e70 (monmagic) | 80 | 120 | 0 | 0x17 | 0x41000006 | 0x0 | 2 | 2 | 0 | 0 | 8 | 1 | 0 | 0x0 | 0 |
| Zarich | Fira | 0x41ed | 0x10608 (monmagic) | 0 | 70 | 12 | 0x4b3 | 0x20208086 | 0x2 | 1 | 2 | 0 | 0 | 12 | 1 | 20 | 0x1 | 0 |
| Zarich | Blizzara | 0x41ee | 0x10690 (monmagic) | 0 | 70 | 12 | 0x4b3 | 0x20208086 | 0x2 | 1 | 2 | 0 | 0 | 12 | 1 | 20 | 0x2 | 0 |
| Zarich | Thundara | 0x41ef | 0x10718 (monmagic) | 0 | 70 | 12 | 0x4b3 | 0x20208086 | 0x2 | 1 | 2 | 0 | 0 | 12 | 1 | 20 | 0x4 | 0 |
| Zarich | Watera | 0x41f0 | 0x107a0 (monmagic) | 0 | 70 | 12 | 0x4b3 | 0x20208086 | 0x2 | 1 | 2 | 0 | 0 | 12 | 1 | 20 | 0x8 | 0 |
| Zarich | Firaga | 0x41f1 | 0x10828 (monmagic) | 0 | 70 | 24 | 0x4b3 | 0x20208086 | 0x2 | 1 | 2 | 0 | 0 | 19 | 1 | 20 | 0x1 | 0 |
| Zarich | Blizzaga | 0x41f2 | 0x108b0 (monmagic) | 0 | 70 | 24 | 0x4b3 | 0x20208086 | 0x2 | 1 | 2 | 0 | 0 | 19 | 1 | 20 | 0x2 | 0 |
| Zarich | Thundaga | 0x41f3 | 0x10938 (monmagic) | 0 | 70 | 24 | 0x4b3 | 0x20208086 | 0x2 | 1 | 2 | 0 | 0 | 19 | 1 | 20 | 0x4 | 0 |
| Zarich | Waterga | 0x41f4 | 0x109c0 (monmagic) | 0 | 70 | 24 | 0x4b3 | 0x20208086 | 0x2 | 1 | 2 | 0 | 0 | 19 | 1 | 20 | 0x8 | 0 |
| Tawrich | Punch | 0x4129 | 0x9de8 (monmagic) | 80 | 20 | 0 | 0x33 | 0x4100000a | 0x1 | 1 | 0 | 0 | 125 | 12 | 1 | 0 | 0x0 | 0 |
| Tawrich | Bloody Breath | 0x412b | 0x9ef8 (monmagic) | 80 | 120 | 0 | 0x17 | 0x41000006 | 0x0 | 1 | 2 | 0 | 0 | 12 | 1 | 0 | 0x0 | 0 |

The raw bytes the notes do not map (animation ids, the caster animation byte, the menu bytes, and the bytes from +0x78 on), as stored:

| Move | id | animation ids (+0x08, +0x0a) | caster animation byte (+0x0c) | menu bytes (+0x0d, +0x0e, +0x0f) | +0x78 / +0x7a / +0x7b | +0x7c to +0x7f | tail from +0x80 |
|---|---|---|---|---|---|---|---|
| Unnatural Selection | 0x412c | 944, 944 | 24 | 0, 0, 0 | 0 / 0 / 2 | 0000d007 | 0303000000011400 |
| Perdition's Flame | 0x412d | 947, 947 | 27 | 0, 0, 0 | 0 / 0 / 1 | 0000d007 | 0a020a0000011400 |
| Die | 0x412e | 948, 948 | 33 | 0, 0, 0 | 0 / 0 / 0 | 0000d007 | 0000000000011400 |
| Osmose | 0x406d | 134, 134 | 3 | 0, 0, 0 | 0 / 0 / 1 | 00007101 | 0909070000013c00 |
| Full-Life | 0x30ba | 116, 116 | 3 | 0, 2, 2 | 0 / 0 / 11 | 0000ab01 | 0b0b06000001a0000a500000 |
| Demi | 0x3082 | 102, 102 | 3 | 0, 9, 9 | 0 / 0 / 1 | 00007301 | 0a0a13000001140006500000 |
| Bio | 0x3085 | 100, 100 | 3 | 0, 9, 9 | 0 / 0 / 7 | 00007801 | 1a1a260000011e0006500000 |
| Curaga | 0x30b5 | 112, 112 | 3 | 0, 2, 2 | 0 / 0 / 9 | 0000a601 | 06060000000150000a500000 |
| Dispel | 0x30b8 | 124, 124 | 3 | 0, 2, 2 | 0 / 0 / 10 | 0000a901 | 2727062600011e000a500000 |
| Flare | 0x3170 | 104, 104 | 3 | 0, 1, 1 | 0 / 0 / 2 | 00009f01 | 030300000001640000000000 |
| Glimmer of Despair | 0x412a | 946, 946 | 26 | 0, 0, 0 | 0 / 0 / 1 | 0000d007 | 09090e0000010a00 |
| Fira | 0x41ed | 82, 82 | 3 | 0, 1, 1 | 0 / 0 / 3 | 00009001 | 0f0f000000015000 |
| Blizzara | 0x41ee | 84, 84 | 3 | 0, 1, 1 | 0 / 0 / 4 | 00009201 | 1010000000011e00 |
| Thundara | 0x41ef | 86, 86 | 3 | 0, 1, 1 | 0 / 0 / 5 | 00009401 | 1111000000016400 |
| Watera | 0x41f0 | 88, 88 | 3 | 0, 1, 1 | 0 / 0 / 6 | 00009601 | 1212000000000000 |
| Firaga | 0x41f1 | 90, 90 | 3 | 0, 1, 1 | 0 / 0 / 3 | 00009801 | 0f0f000000000000 |
| Blizzaga | 0x41f2 | 92, 92 | 3 | 0, 1, 1 | 0 / 0 / 4 | 00009a01 | 1010000000000000 |
| Thundaga | 0x41f3 | 94, 94 | 3 | 0, 1, 1 | 0 / 0 / 5 | 00009c01 | 1111000000000000 |
| Waterga | 0x41f4 | 96, 96 | 3 | 0, 1, 1 | 0 / 0 / 6 | 00009e01 | 1212000000012800 |
| Punch | 0x4129 | 758, 758 | 3 | 0, 0, 0 | 0 / 0 / 0 | 0000d007 | 0101000000010a00 |
| Bloody Breath | 0x412b | 945, 945 | 25 | 0, 0, 0 | 0 / 0 / 7 | 0000d007 | 2603260000010a00 |
