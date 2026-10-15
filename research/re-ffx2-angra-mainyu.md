# FFX-2 Angra Mainyu read from the game's own files: the rows, the formation, the start positions (and the AI, next commit)

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

* **One formation family, five scenes.** `btl.txt` has five formation rows with exactly these three monsters (rows 1241 `bika08_229`, 1284 `bika07_229`, 1313 `bika09_229`, 1350 `bika14_229`, 1384 `bika13_229`). The monsters, scales and slot order are identical; only the battle-map label (variant 2b for `bika14_229`) and the last numeric block differ. The four standalone test rows 0270 to 0272 (`zzzz02_68` to `zzzz02_70`) hold the three monsters one at a time.
* **Start positions are shipped** (`pos_*.psc`, byte-identical in all five scenes, and the same vectors in each compiled scene package): boss at (-45, -13); Yuna (23, 29), Rikku (33, 11), Paine (32, -9). The companions' spots are (0, 0), but both are linked to the boss's model by the boss's script, so they do not stand there (sections 7 and 8).
* **Rewards are the boss's only:** EXP 5,000, Gil 5,000, AP 30, Pilfer Gil figure 2,000, drop Ribbon (byte 255, both slots), steal Megalixir (byte 255, both slots). Zarich and Tawrich pay nothing.
* **Both companions carry a permanent automatic status** (group-2 slots 15 and 16): by the damage note's address arithmetic these are the physical-immunity and magical-immunity counters (Zarich physical, Tawrich magical) [inferred, section 4.2].
* **A second stat block exists** in `monster2.bin` (boss Lv 56, HP 350,116, AGI 88) but all three rows have Oversoul type 0, so the only mechanism our notes know for selecting it is not triggered (section 5).
* **The repo holds no wiki numbers for Angra Mainyu to compare** (section 11): the three research files that mention him say only that he drops the Ribbon, which the row confirms.
* **Raw bytes for every unmapped column are in section 6.**

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

(Sections 9 to 13, the AI decode, the move rows, the comparison with the repo and the open items, are the next commit of this branch.)
