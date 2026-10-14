# FFX-2 monster rows read from the game: Yojimbo, Daigoro and Valefor

**Game case: FFX-2 only.** These are rows of the FFX-2 kernel table `battle/kernel/monster.bin`: the Cavern of the Stolen Fayth fight (mission "Tourist Trap") and the Besaid Temple fight (mission "Protect Besaid Temple!"). Nothing here applies to FFX: FFX's Yojimbo is a different record in a different file (`research/ffx-yojimbo.md` §2; FFX `m288`), and FFX's Valefor is another one.
Written 2026-10-14 by the RE parity session for the release driver, who is building the two hidden FFX-2 chapters (`ch-tourist-trap`, `ch-besaid-valefor`). Read-only: nothing in the game folder was changed, no game was run, no Ghidra call was made.

**What is in this note:** numbers read from the owner's own Steam copy. Monster names, item names and move names appear only as identifiers (the game's own name tables are how the rows were found). No descriptions, dialogue, decompiled code or other game text.

Tags: **[bytes]** read from the file by this note's scripts; **[N: file §]** a column meaning that an earlier checked note proves; **[this]** proved here by the values equalling an independent source in the same positions; **unmapped** the value is given raw and no meaning is claimed (AGENTS.md hard rule 6).

## 0. Result in one screen

| Row (0-based) | Name in the game's own table | What it is | Lv | HP | MP |
|---|---|---|---|---|---|
| **164** (id 0x10a4) | Valefor | Besaid Temple, formation 0393 `bsyt05_229` | 22 | 8,430 | 9,999 |
| **170** (id 0x10aa) | Yojimbo | Cavern of the Stolen Fayth, formation 1847 `nagi05_229`, slot 1 | 36 | 22,000 | 9,999 |
| **174** (id 0x10ae) | Daigoro | the same formation, slot 2 (Daigoro is **its own record**) | 30 | 1 | 1 |
| 363 (id 0x116b) | Valefor (second record, same model 0x10a4) | in no `btl.txt` formation row; stronger numbers | 48 | 38,000 | 9,999 |

* **Every number the repo and the wiki carry for Valefor (row 164) and Yojimbo (row 170) equals the game's row**: level, HP, every stat and every reward value agree (section 6). The two stats the Tourist Trap preflight had to estimate are now read: **Yojimbo Accuracy 95, Evasion 0**.
* **Daigoro has a real row** (the repo had only placeholders): Lv 30, HP 1, MP 1, STR 42, DEF 50, MAG 61, MDEF 106, AGI 120, ACC 95, EVA 0, LCK 7, no rewards, no ability list.
* Differences that matter (section 6): Yojimbo's own move list holds Kozuka, Wakizashi twice, Zanmato and a Die row, **no Daigoro move**; the wiki's "Reflect" immunity is not in the record (Reflect resist byte 0); Valefor nulls Gravity (the repo's Valefor row says "neutral"); Valefor's MP is 9,999 (not in the repo).

## 1. Source block

| Item | Value |
|---|---|
| Archive | `FFX2_Data.vbf`, the Steam HD Remaster (FFX-2 half), the owner's own install, 17,867,755,272 bytes, 137,386 files |
| Files inside it | `ffx_ps2/ffx2/master/jppc/battle/kernel/monster.bin` (96,596 bytes, entry offset 17,862,709,038, SHA-256 `50964278e7b164e6c93f51b2bbacad054104e3142ef47f05f726e3377e3ec504`) and the English copy `ffx_ps2/ffx2/master/new_uspc/battle/kernel/monster.bin` (119,716 bytes, SHA-256 `1831faed8e5c6f5b47a9ab577f8e9b2f905cf31b7486e387a22fe020a343558a`). Both are the same table; the English copy also carries the name text. Also read: `monster2.bin` (jppc 87,842 B, SHA-256 `9327e6571d2f92ac86d70268d698dfe146b17976c14260b3594e8534142c23b9`; new_uspc 99,912 B, `2645ad692c415e3af5aa06b7f9932b80c9315ec88b66ff77c5be1828eecac80d`) |
| Table shape [bytes] | 32-byte header of eight u32 words: version 1 at 0x00; minimum index 0 at 0x0c; **maximum index 369** at 0x10; record size 200 at 0x14; text offset 74,000 at 0x18; data offset 32 at 0x1c. Then rows 0 to 369 of 200 bytes (**370 rows**: "369" is the header's last index), row *i* at file offset `0x20 + 200 i`; the name text starts at file offset `0x20 + 74,000` |
| Locale copies [bytes] | `master/jppc` and the nine `new_*pc` copies (jp, us, sp, kr, it, fr, de, cn, ch) of `monster.bin` **and** `monster2.bin`: bytes 8 to 199 of all 370 rows are identical in all ten copies, for both tables (only the name and help text references differ). So the numbers do not depend on the locale |
| Second copy of the game [bytes] | a second install of the same Steam build (`FFX2_Data.vbf`, 17,867,755,892 bytes) gives byte-identical files for all 20 tables above (same SHA-256) |
| Reader | our own VBF reader (standard library only, opens the archive `rb`): `vbf.py`, kept outside the repo with its layout notes (`gamefiles.md` §1). Row parser and dumpers, also outside the repo (`extract_kernel.py`, `lib_mon.py`, `dump_rows.py`, `formations.py`), run with `python -I` |
| Independent check | a second parser written by an earlier lane (`mon-dump.mjs`, kept outside the repo, run on its own extraction of the same archive) prints the same values for rows 164, 170, 174 and 363 |
| Struct layout | the shipped `battle/kernel/monster.h` (the `btl_monster` struct) matches the 200-byte rows field for field (`gamefiles.md` §3); offsets below are from that order and from the offsets earlier notes use (record `+0xa4` Pilfer Gil, `+0xab` steal chance byte, `+0x50` automatic-status mask) |

## 2. How each row was identified

1. **The game's own name table.** Each row starts with a name reference (u32; its low 16 bits are an offset into the text region of the English copy). Decoding it gives `Valefor` (row 164), `Yojimbo` (170), `Daigoro` (174) and a second `Valefor` (363). No other row of `monster.bin` or `monster2.bin` is named Valefor, Yojimbo or Daigoro, and no other row has model id 0x10a4, 0x10aa or 0x10ae.
2. **The shipped symbol table** `battle/header/monster.ath` gives the same ids by label: `m_敵ヴァルファーレ` = 0x10a4, `m_敵ヨウジンボウ` = 0x10aa, `m_犬２` = 0x10ae (Daigoro), and for row 363 `m_敵ヴァルファーレクリクリ` = 0x116b (the Valefor label with a suffix; rows 364 to 366 carry the same suffix on Ifrit, Ixion and Bahamut).
3. **The formation table** `battle/kernel/btl.txt` (2,054 lines; 370 monster labels resolved through `monster.ath`):
   * formation **0393 `bsyt05_229`**, battle map label `bmap_ビサイド寺院試練の間` (a Besaid temple room; the research file names this formation "Besaid Temple - Fayth - BOSS 229 Valefor 1"): one monster, row 164;
   * formation **1847 `nagi05_229`**, battle map label `bmap_メーガスダンジョンc`: slot 1 row 170 (Yojimbo), slot 2 row 174 (Daigoro). This is the pair `research/ffx2-fallen-aeons.md` §0.3 gives as "Cavern of Stolen Fayth - BOSS 229 Yojimbo 1 Daigoro 1";
   * **row 363 is in no formation row** of `btl.txt` (only the zzzz test rows 0166, 0172, 0176 name rows 164, 170, 174). `FFX2-G01` §4.4 lists "Valefor 4459" (= 0x116b) with the same move family, so the row is known to the checked notes; which fight uses it is **not established here**.
4. **The wiki and the guide values** as a pointer only: the numbers in sections 4 and 5 are the bytes. Row 164 equals SinirothX's Chapter 3 Valefor (Lv 22, HP 8,430, ...) and row 170 equals the wiki's Yojimbo (Lv 36, HP 22,000, ...) in every field the sources give (section 6), which also settles which row is the Chapter 3 Valefor against the Lv 48 one.

## 3. Column map

Offsets are from the start of the 200-byte row. "Proved" means an earlier checked note uses the column with this meaning, or this note's equality check below does.

| Bytes | Field | Proof |
|---|---|---|
| +0x00 u32, +0x04 u32 | name reference, help reference | identifiers only. Low 16 bits = offset into the text region; the upper bits are unmapped. The help text is not used here |
| +0x08 u32, +0x0c u32 | **HP, MP** | `gamefiles.md` §4 (8 Vegnagun rows equal the research, 48 values); this note: HP and MP equal the wiki for Yojimbo |
| +0x10 | **Level** | same |
| +0x11 .. +0x18 | **STR, DEF, MAG, MDEF, AGI, ACC, EVA, LCK** (one byte each) | the RE record tables (`re-ffx2-ai-leblanc-den-ixion.md` §2, `re-ffx2-ai-bahamut-vegnagun.md`, `re-ffx2-ai-fallen-trema.md`) use this order; **[this]** the order is confirmed independently by 7 values for Valefor (STR 97, DEF 76, MAG 11, MDEF 20, AGI 125, EVA 25, LCK 3, SinirothX) and 6 for Yojimbo (STR 44, MAG 61, DEF 50, MDEF 106, AGI 120, LCK 7, wiki), each landing on the right byte |
| +0x19 | thinking byte | `re-ffx2-ai-fallen-trema.md` §1.6: a record field that the battle never reads. Value given for completeness |
| +0x1a u16 | **special word** | bit 0: immune to percentage-HP formulas 4 and 7 (`re-ffx2-damage.md` §2.1); bit 1: a hit reaction does not slow its gauge (`re-ffx2-atb-status.md` §3.1); bit 6: takes no ATB damage (`re-ffx2-damage.md` §2.4); bit 9: immune to magic cancel (`re-ffx2-atb-status.md` §5, `FFX2-G01` §4.4). Bits 2, 7 and 8 are **unmapped** (the shipped header names bit 7 `disable_zan` and bit 8 `wairo`, effects not traced). Open: `re-ffx2-hit-status.md` §2.3 and §6 call the same bit 9 (`Chr+0x3a7` bit 1) the Bribe-immune flag, which contradicts the ATB note and `FFX2-G01`; the Bribe flag is not assumed to be either bit here |
| +0x1c .. +0x1f | **absorb, null, half, weak** element bytes | `re-ffx2-damage.md` §3 (bit 0 fire, 1 ice, 2 thunder, 3 water, 4 gravity, 5 holy; 6 and 7 unmapped) |
| +0x20 .. +0x37 | **group-1 resist bytes**, 24 of them (255 = immune) | `re-ffx2-hit-status.md` §4: 0 Death, 1 Petrify, 2 Sleep, 3 Silence, 4 Darkness, 5 Poison, 6 Confusion, 7 Berserk, 8 Curse, 9 Defense, 10 Eject, 15 Always Critical, 17 a status that clears Confusion, Berserk and Curse. Indexes 11 to 14, 16 and 18 to 23 are unmapped |
| +0x38 .. +0x4f | **group-2 resist bytes**, 24 of them | same §4: 0 Shell, 1 Protect, 2 Reflect, 3 Regen, 4 Haste, 5 Slow, 6 Stop, 7 to 13 the seven stat stages, 14 Doom, 15 to 17 the immunities. Which stage is which: only 7 STR, 9 DEF, 11 ACC are named (`re-ffx2-ai-leblanc-den-ixion.md` §2). Indexes 18 to 23 unmapped |
| +0x50 i32, +0x54 i32, +0x58 .. +0x6f | automatic-status masks (group 1, group 2) and their counts | `FFX2-G04` §3.4 (monster records: mask at `+0x50`, group-2 mask at `+0x54`, counts from `+0x58`; Spellspring = group-1 bit 13) |
| +0x70 .. +0x8f | ability list, 16 x u16 | the ids resolve by the convention the notes use for `0x41da` Attack and `0x40e5` Supercollider (a `0x4xxx` id is a row of `monmagic.bin`, a `0x3xxx` id a row of `command.bin`, row = low 12 bits). **What the game reads the list for is not traced**; the names are given as identifiers |
| +0x90 | "basaku" word | unmapped |
| +0x92 | model id | `gamefiles.md` §2 (model = `chr/mon/m<row>`; id 0x1000 + row) |
| +0x94 | motion-set id | agrees with the motion sets `FFX2-G01` §7.3 tabulates (Valefor 0x10a4, Yojimbo 0x10aa) |
| +0x96 | sound id | unmapped |
| +0x98 | Oversoul type | `re-ffx2-ai-fallen-trema.md` §1.4 (the type that selects the second stat block; 0 = none) |
| +0x9a | monster-type word | unmapped (all four rows read 0) |
| +0x9c i32, +0xa0 i32 | **EXP, Gil** | `gamefiles.md` §4, `FFX2-G03` §5.1 |
| +0xa4 i32 | **Pilfer Gil figure** | `re-ffx2-ai-leblanc-den-ixion.md` §1.9: `floor((draw % 101 + 100) x figure / 200)`, 50 to 100 percent of the figure, once per monster |
| +0xa8 u16 | **AP** | `gamefiles.md` §4 |
| +0xaa, +0xab | **drop chance byte, steal chance byte** | steal: `re-ffx2-ai-leblanc-den-ixion.md` §1.9 (succeeds when `draw % 255` is below the byte: 128 = 50.2 percent, 255 = always; the rare slot is taken on 12.5 percent of successes). Drop: read on the same 0 to 255 scale in `FFX2-G03` §5.1; the drop roll itself is not traced in our notes |
| +0xac, +0xb4, +0xbc: 4 x u16 each | **drop items, steal items, bribe items**: (common id, count, rare id, count) | `gamefiles.md` §4, `FFX2-G03` §5.1. Ids: high nibble 2 = `item`, 9 = `accessory`; names from the US tables |
| +0xc4 | Zantetsu byte | value only: the notes report it per boss (`re-ffx2-ai-leblanc-den-ixion.md` §2); what it feeds is not traced |
| +0xc5, +0xc6 u16 | reserved | the shipped header calls them `reserve1`, `reserve2`; both 0 here |

## 4. The rows (monster.bin; every proved column)

Stats are the bytes. Percentages are the notes' formulas on the bytes.

| Field | **Valefor (164)** | **Yojimbo (170)** | **Daigoro (174)** | Valefor, second record (363) |
|---|---:|---:|---:|---:|
| File offset of the row | 0x8040 | 0x84f0 | 0x8810 | 0x11bb8 |
| Level | 22 | 36 | 30 | 48 |
| HP | 8,430 | 22,000 | 1 | 38,000 |
| MP | 9,999 | 9,999 | 1 | 9,999 |
| STR | 97 | 44 | 42 | 124 |
| DEF | 76 | 50 | 50 | 99 |
| MAG | 11 | 61 | 61 | 84 |
| MDEF | 20 | 106 | 106 | 55 |
| AGI | 125 | 120 | 120 | 167 |
| ACC | 95 | 95 | 95 | 108 |
| EVA | 25 | 0 | 0 | 31 |
| LCK | 3 | 7 | 7 | 11 |
| Thinking byte (never read) | 0 | 0 | 1 | 0 |
| Special word | 0x3c3 | 0x3c3 | 0x0 | 0x3c3 |
| Special bits set | 0, 1, 6, 7, 8, 9 | 0, 1, 6, 7, 8, 9 | none | 0, 1, 6, 7, 8, 9 |
| Element bytes (absorb / null / half / weak) | 0x00 / **0x10** / 0x00 / 0x00 | 0x00 / **0x10** / 0x00 / 0x00 | all 0x00 | 0x00 / **0x10** / 0x00 / 0x00 |
| (0x10 = bit 4 = Gravity) | null Gravity | null Gravity | none | null Gravity |
| Automatic statuses (masks 1 and 2) | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |
| Oversoul type | 0 | 0 | 0 | 0 |
| EXP | 1,500 | 2,000 | 0 | 1,800 |
| AP | 15 | 15 | 0 | 1 |
| Gil | 1,200 | 1,500 | 0 | 1,000 |
| Pilfer Gil figure | 1,500 | 2,000 | 0 | 1,500 |
| Drop chance byte | 255 | 255 | 0 | 255 |
| Drop, common / rare | Moon Bracer x1 / Moon Bracer x1 (0x905c) | Recovery Bracer x1 / Recovery Bracer x1 (0x9060) | none | Wall Ring x1 (0x9057) / Moon Bracer x1 (0x905c) |
| Steal chance byte | 128 (50.2 %) | 128 (50.2 %) | 0 | 32 (12.5 %) |
| Steal, common / rare | Healing Spring x4 / x6 (0x2034) | Power Wrist x1 / x1 (0x9008) | none | Wall Ring x1 (0x9057) / Defense Bracer x1 (0x905f) |
| Bribe slots | none | none | none | none |
| Zantetsu byte | 80 | 120 | 0 | 100 |
| Model id / motion-set id | 0x10a4 / 0x10a4 | 0x10aa / 0x10aa | 0x10ae / 0x10ae | 0x10a4 / 0x10a4 |

**Group-1 resist bytes** (255 = immune; every index not listed reads 0 and so lands):

| Row | 255 at |
|---|---|
| 164, 170, 363 | 0 Death, 1 Petrify, 2 Sleep, 3 Silence, 4 Darkness, 5 Poison, 6 Confusion, 7 Berserk, 8 Curse, 10 Eject, and indexes 17 and 18. Index 9 (Defense) and 15 (Always Critical) read 0 |
| 174 (Daigoro) | 8 Curse, and indexes 17 and 18. Everything else, Death included, reads 0 |

**Group-2 resist bytes** (255 = immune):

| Row | 255 at | Reads 0 (lands) |
|---|---|---|
| 164 Valefor | 6 Stop, 14 Doom | Shell, Protect, Reflect, Regen, Haste, Slow, all seven stat stages (7 to 13), 15 to 17 |
| 170 Yojimbo | 5 Slow, 6 Stop, 7 to 13 (all seven stat stages), 14 Doom | Shell, Protect, **Reflect**, Regen, Haste, 15 to 17 |
| 174 Daigoro | none | all |
| 363 Valefor | 5 Slow, 6 Stop, 7, 8, 9, 10 (four stage bytes), 14 Doom | Shell, Protect, Reflect, Regen, Haste, stage bytes 11 to 13, 15 to 17 |

**Ability lists** (role untraced; names are the rows' own identifiers, ids as stored):

| Row | List |
|---|---|
| 164 Valefor | 0x41da Attack, 0x4091 Energy Ray, 0x4092 Sonic Wings, 0x4093 Energy Blast, 0x40ad Die |
| 170 Yojimbo | 0x40a1 Kozuka, 0x40a2 Wakizashi, 0x40a3 Wakizashi, 0x40a4 Zanmato, 0x40b2 Die |
| 174 Daigoro | empty (all 16 slots 0) |
| 363 Valefor | 0x306e Excalibur, 0x4206 Full Break, 0x308d Crackdown, 0x4092 Sonic Wings, 0x3027 Energy Ray, 0x3028 Energy Blast, 0x40ad Die |

(`FFX2-G01` §4.4 notes that the "Die" rows in the aeon records are not attacks.)

## 5. Unmapped columns (raw values)

| Field (bytes) | 164 Valefor | 170 Yojimbo | 174 Daigoro | 363 Valefor |
|---|---|---|---|---|
| "basaku" word (+0x90) | unmapped (raw value 0) | unmapped (raw value 0) | unmapped (raw value 0) | unmapped (raw value 16384, 0x4000) |
| Sound id (+0x96) | unmapped (raw value 4260) | unmapped (raw value 4266) | unmapped (raw value 4270) | unmapped (raw value 4260) |
| Monster-type word (+0x9a) | unmapped (raw value 0) | unmapped (raw value 0) | unmapped (raw value 0) | unmapped (raw value 0) |
| Special word bit 7 and bit 8 | unmapped (set) | unmapped (set) | unmapped (clear) | unmapped (set) |
| Group-1 resist indexes 17 and 18 | unmapped (raw value 255, 255) | unmapped (raw value 255, 255) | unmapped (raw value 255, 255) | unmapped (raw value 255, 255) |
| Element bits 6 and 7 | unmapped (clear) | unmapped (clear) | unmapped (clear) | unmapped (clear) |
| Name reference (+0x00) | 0x005a5a8c | 0x00535bad | 0x00425c6f | 0x005aaff1 |
| Help reference (+0x04) | 0x010b5a94 | 0x00df5bb5 | 0x00195c77 | 0x010baff9 |

The raw 200 bytes of each row (English copy; the other nine copies are equal from byte 8 on, only the first eight bytes, the name and help references, can differ):

```
164  8c5a5a00945a0b01ee2000000f27000016614c0b147d5f190300c30300100000ffffffffffffffffff00ff000000000000ffff0000000000000000000000ff00000000000000ff0000000000000000000000000000000000000000000000000000000000000000000000000000000000da41914092409340ad40000000000000000000000000000000000000000000000000a410a410a41000000000dc050000b0040000dc0500000f00ff805c9001005c9001003420040034200600000000000000000050000000
170  ad5b5300b55bdf00f05500000f270000242c323d6a785f000700c30300100000ffffffffffffffffff00ff000000000000ffff00000000000000000000ffffffffffffffffffff0000000000000000000000000000000000000000000000000000000000000000000000000000000000a140a240a340a440b240000000000000000000000000000000000000000000000000aa10aa10aa1000000000d0070000dc050000d00700000f00ff8060900100609001000890010008900100000000000000000078000000
174  6f5c4200775c190001000000010000001e2a323d6a785f0007010000000000000000000000000000ff0000000000000000ffff0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000ae10ae10ae10000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
363  f1af5a00f9af0b01709400000f270000307c635437a76c1f0b00c30300100000ffffffffffffffffff00ff000000000000ffff00000000000000000000ffffffffffff000000ff00000000000000000000000000000000000000000000000000000000000000000000000000000000006e3006428d30924027302830ad400000000000000000000000000000000000000040a410a410a4100000000008070000e8030000dc0500000100ff20579001005c900100579001005f900100000000000000000064000000
```

### 5.1 monster2.bin (the second stat block), same four rows

`monster2.bin` has the same 370-row shape. Our notes use it for one thing: a monster whose Oversoul type has reached its kill count is rebuilt from it (`re-ffx2-ai-fallen-trema.md` §1.4, the Oversoul Paragon). **All four rows here have Oversoul type 0 in `monster.bin`**, so nothing in our notes says the game reads these rows for these monsters; they are given so the numbers are on record.

| Field | 164 Valefor | 170 Yojimbo | 174 Daigoro | 363 Valefor |
|---|---:|---:|---:|---:|
| Level / HP / MP | 26 / 8,852 / 9,999 | 43 / 33,600 / 9,999 | 2 / 1 / 1 | 1 / 1 / 1 |
| STR / DEF / MAG / MDEF | 97 / 76 / 11 / 20 | 44 / 50 / 61 / 106 | 1 / 1 / 1 / 1 | 1 / 1 / 1 / 1 |
| AGI / ACC / EVA / LCK | 163 / 95 / 31 / 3 | 156 / 95 / 0 / 9 | 1 / 95 / 1 / 1 | 183 / 115 / 1 / 1 |
| Automatic status mask 1 | 0x2000 (bit 13, Spellspring per `FFX2-G04`) | 0x2000 | 0x2000 | 0 |
| EXP / AP / Gil / Pilfer, drop and steal bytes, items, Zantetsu, ability list | all 0 or empty | all 0 or empty | all 0 or empty | all 0 or empty |
| Group-1 resist differences from `monster.bin` | index 10 (Eject) reads 0 | index 10 (Eject) reads 0 | indexes 6 and 7 also read 255 (index 8, 17 and 18 as in `monster.bin`) | none |
| Group-2 resist differences from `monster.bin` | none | index 14 (Doom) reads 0 | none | none |

## 6. Comparison with the repo and the wiki

Sources compared: `research/ffx2-fallen-aeons.md` §7.1 (SinirothX, wiki: Valefor), `research/ffx-yojimbo.md` §8.2 (wiki, FFExodus: Yojimbo), and the Tourist Trap preflight (`docs/plans/ch-tourist-trap-review.md` on branch `ch-tourist-trap`: Yojimbo and Daigoro as the build uses them). "Agree" means equal as numbers.

### 6.1 Valefor, row 164 (Besaid Temple)

| Field | Game row | Repo / wiki | Verdict |
|---|---|---|---|
| Level | 22 | 22 | agree |
| HP | 8,430 | 8,430 | agree |
| STR / MAG / DEF / MDEF | 97 / 11 / 76 / 20 | 97 / 11 / 76 / 20 | agree |
| AGI / EVA / LCK | 125 / 25 / 3 | 125 / 25 / 3 | agree |
| EXP / AP / Gil / Pilfer | 1,500 / 15 / 1,200 / 1,500 | 1,500 / 15 / 1,200 / 1,500 | agree |
| Elements | no absorb, half or weak; null Gravity | "neutral" | agree on the four classic elements; the Gravity null is not in the repo row |
| Breaks and Slow | all seven stage bytes and Slow read 0 | "land" | agree |
| Drop | Moon Bracer (common and rare), byte 255 | Moon Bracer | agree (the byte is new) |
| Steal | Healing Spring x4, rare x6, byte 128 | Healing Spring x4 (rare x6) | agree (the byte is new) |
| MP | 9,999 | not stated | new |
| ACC | 95 | not stated | new (95, like every actor in the earlier RE notes) |
| Status immunities | Death, Petrify, Sleep, Silence, Darkness, Poison, Confusion, Berserk, Curse, Eject, Stop, Doom | not stated | new |
| Abilities | Attack, Energy Ray, Sonic Wings, Energy Blast, Die | Normal Attack, Sonic Wings, Energy Ray, Energy Blast | agree |

### 6.2 Yojimbo, row 170 (Cavern of the Stolen Fayth)

| Field | Game row | Repo / wiki | Verdict |
|---|---|---|---|
| Level | 36 | 36 | agree |
| HP / MP | 22,000 / 9,999 | 22,000 / 9,999 | agree |
| STR / MAG / DEF / MDEF / AGI / LCK | 44 / 61 / 50 / 106 / 120 / 7 | 44 / 61 / 50 / 106 / 120 / 7 | agree |
| EVA | 0 | 0 (preflight estimate) | agree, now read |
| ACC | 95 | 95 (preflight estimate) | agree, now read |
| EXP / AP / Gil / Pilfer | 2,000 / 15 / 1,500 / 2,000 | 2,000 / 15 / 1,500 / 2,000 | agree |
| Drop | Recovery Bracer (common and rare) | Recovery Bracer (common and rare) | agree |
| Steal | Power Wrist (common and rare), byte 128 | Power Wrist (common and rare), rate 128 | agree |
| Zantetsu | 120 | "zantetsu = 120" | agree |
| Immune: Silence, Sleep, Darkness, Poison, Confuse, Berserk, Curse, Petrify, Eject, Death | group-1 bytes 255 | listed | agree |
| Immune: Slow, Stop, Doom, every stat modifier | group-2 bytes 255 (5, 6, 7 to 13, 14) | listed | agree |
| Immune: Gravity | element null bit 4 | listed | agree |
| Immune: fractional damage | special bit 0 (percentage-HP formulas) | listed | consistent (matched by the notes' bit meaning, not by name) |
| Immune: Delay | special bit 6 (no ATB damage) | listed | consistent (same) |
| Immune: Interrupt | special bit 9 (magic cancel) | listed | consistent (same) |
| Immune: **Reflect** | group-2 index 2 (Reflect) reads **0**; no other column found | listed | **differ**: the record does not make Yojimbo immune to the Reflect status. What the wiki means by the word is not established |
| Immune: Bribe | special bit 8 or 9 (open, section 3) | listed | not decidable here |
| Immune: Multi-attack | no column identified | listed | not decidable here |
| Abilities | Kozuka, Wakizashi, Wakizashi, Zanmato, Die | Wakizashi A and B, Daigoro, Kozuka, Zanmato | **differ**: **no Daigoro entry** in Yojimbo's list. The two Wakizashi entries match A and B |
| Where the dog is | its own record, row 174, slot 2 of formation 1847 | "Daigoro as a separate body" (preflight, SinirothX) | agree: the dog is a record of its own |

### 6.3 Daigoro, row 174

| Field | Game row | Repo | Verdict |
|---|---|---|---|
| Everything | Lv 30, HP 1, MP 1, STR 42, DEF 50, MAG 61, MDEF 106, AGI 120, ACC 95, EVA 0, LCK 7, thinking byte 1, special word 0, immune to Curse (group-1 index 8) and group-1 indexes 17 and 18, no rewards, no ability list, model and motion 0x10ae | placeholders, "none in the research for the FFX-2 body" (preflight §1 item 5) | new: the placeholders can be replaced |

### 6.4 Valefor, row 363

No repo or wiki value is on file for it. It is listed so a later fight that uses it does not read the Chapter 3 row by mistake: HP 38,000 against 8,430, Lv 48 against 22, ACC 108 against 95.

## 7. Open items

1. Which fight uses row 363 (no `btl.txt` formation names it).
2. What the ability list, the "basaku" word, the sound id and the type word are read for; what special bits 7 and 8 do; the Bribe flag (bit 8 or 9); the group-1 indexes 17 and 18.
3. Whether the wiki's "Reflect" and "Multi-attack" immunities for Yojimbo live in a column outside the record or are wiki wording.
4. Daigoro's attack: it is not in Yojimbo's list and the dog's list is empty, so the dog's move comes from its script (row 174's AI), which was not read here.
5. Whether the game ever reads `monster2.bin` rows for these four monsters (their Oversoul type is 0).

## 8. Notes cited

In the repo (`research/`): `re-ffx2-damage.md`, `re-ffx2-hit-status.md`, `re-ffx2-atb-status.md`, `re-ffx2-ai-leblanc-den-ixion.md`, `re-ffx2-ai-fallen-trema.md`, `re-ffx2-ai-bahamut-vegnagun.md`, `ffx2-fallen-aeons.md`, `ffx-yojimbo.md`. Kept outside the repo: the coverage notes `FFX2-G01.md`, `FFX2-G03.md`, `FFX2-G04.md`, and `gamefiles.md`.

## 9. AI scripts (not decompiled here)

No dump of the AI scripts of FFX-2 rows 164, 170, 174 or 363 exists in our analysis folders (kept outside the repo). (The files `ffx-yunalesca-bfa\allmon\m164.txt`, `m170.txt`, `m174.txt` and `dis\m164.txt`, `m174.txt` are FFX monsters with the same numbers, not these.) The scripts are in the archive, as plain-text sources and compiled packages:

* `ffx_ps2/ffx2/master/jppc/battle/mon/m164.src` (3,786 bytes), `m170.src` (3,566), `m174.src` (1,045), `m363.src` (2,331);
* compiled: `.../mon/_m164/m164.bin` (94,848), `_m170/m170.bin` (105,024), `_m174/m174.bin` (41,264), `_m363/m363.bin` (94,400), with `mm###.src` and `mt###.src` beside each;
* tools that read them: the Leblanc-den lane's `x2dis.mjs` (disassembler, kept outside the repo), `moves.mjs` (every move a source uses with its full row), `cmp-src-bin.mjs`; the lane's notes `...\NOTES.md`.
