# FFX-2 dresspheres, garment grids and accessories: how they shape a battle, read from the game code

**Game case: FFX-2 only.** FFX has no dresspheres, garment grids or dress changes; its characters grow on the Sphere Grid and
its equipment is armour and weapons (see `research/re-ffx-commands.md` and the other `re-ffx-*` notes). Part of the `re-parity`
track ([docs/plans/re-parity.md](../docs/plans/re-parity.md)). Drafted 2026-10-08; the step rate (4.4 and open question 5)
settled on 2026-10-09 from the live measurement ([re-ffx2-timing-measured.md](re-ffx2-timing-measured.md)).

**Source note (applies to every statement below unless a line says otherwise):** FFX-2.exe Steam build 25501027 (SHA-256
6EA7F142...CD69), the HD Remaster's 32-bit executable, image base 0x00400000; every address below is the virtual address in THAT
(live) image. The functions were read in Ghidra 12.1.4, decompiler and disassembly, in the older copy of the exe (the same code sits
0x20 to 0x30 higher in the battle range; globals from 0x00d28000 up sit 0x1000 higher) and compared with the live file by the
anchor-map lane. The numbers come from `battle/kernel/*.bin` of the same Steam files, read at the offsets the exe uses: `job.bin`
(34 rows of 228 bytes, ids 0x5000 to 0x5021), `plate.bin` (64 rows of 128, 0x6000 to 0x603f), `accessory.bin` (128 rows of 84,
0x9000 to 0x907f), `a_ability.bin` (162 rows of 176, 0x8000 to 0x80a1), `ply_rom.bin` (23 rows of 8), `ply_save.bin` (23 rows of 128),
`command.bin` (554 rows of 140) and `important.bin`; the girl map (34 x 3 shorts) from the exe at VA 0x00d48288 (0x00d49288 in the
older copy). The `jppc` and `new_uspc` copies of every table hold identical numbers; only the text references differ. The shipped
`*.h` struct files are an older layout and were not used for offsets. Everything is written in our own words: no game code and no
game text is reproduced here (ability and dressphere names are used as labels only).

| This note | Kernel (pure TypeScript, not wired into the engine) | Tests |
|---|---|---|
| §1 the stat record: level, growth, bonus block, caps, pools, battle copy | `src/battle/ffx2/kernel/dressphere-stats.ts`, `dressphere-abilities.ts`, `dressphere-recalc.ts`; tables `dressphere-growth.ts`, `dressphere-rows.ts`, `dressphere-grids.ts` | `tests/unit/parity-ffx2-dressphere.test.ts`, `parity-ffx2-dressphere-vectors.test.ts` |
| §2 Spherechange, §3 garment grids | `kernel/spherechange.ts` | `tests/unit/parity-ffx2-spherechange.test.ts` |
| §4 auto-ability words, MP cost, rapid shot, the effect tables | `kernel/auto-ability.ts`, `ability-effects.ts`, table `ability-effects-data.ts` | the first and second files above |

## 0. How this was checked

1. The decompile and disassembly of every function were read for operand widths, signed or unsigned compares, and the kind of
   division (the decompiler shows the compiler's multiply-by-magic-number as a plain division). The constants were read from the
   shipped files, not from a FAQ.
2. The real machine code of each function was run in an x86-32 emulator (Unicorn, `D:\Tools\ffx-parity\harness`) on generated
   inputs over the real kernel tables, with only the random generator replaced (it is never drawn) and, for the dress refresh, the
   command-table builder and the presentation calls. Every result was compared with the kernels. **No differences**, in 64,900 vectors:

   | Function (live VA) | Vectors |
   |---|---|
   | `CalculateStats` 0x0060d6f0: random inputs; a sweep of every dressphere x the three girls x levels 1, 50, 99 | 6,000; 306 |
   | `MsCalcChrLevel` 0x00617120, `HpScale` / `MpScale` 0x0060b540 / 0x0060b580, the record keep-ratio 0x0060eca0 | 3,000, 3,000, 3,000 |
   | the girl map 0x0061ddc0 (554 of 600: an index of 0x22 or more reads past the table, never stored), `IsSpecial` 0x0061dd70 | 554, 400 |
   | the whole record recompute `RecalcSaveStats` 0x0060e2d0 (list, pools, maxima, thresholds, bytes, words), with random equipment, mastery, key items and gate slots | 6,000 |
   | the ability list 0x00629570 with random mastery; with EVERYTHING mastered and every key item, and with NOTHING mastered, for every dressphere | 6,000; 240 |
   | `MsCheckAbility` 0x00629260: numbers, the six compound sets, commands, abilities, key items, every other category | 2,600 |
   | `MsSetRamChrParam` 0x00627590, the max-HP/MP recompute 0x00636560, the HP state 0x00619fc0 | 4,000, 4,000, 2,000 |
   | the immune-status sweep 0x00624cc0, the MP cost 0x0061acd0 | 4,000, 4,000 |
   | the dress command row 0x00625130 with its recovery 0x00634110, the rapid-shot countdown 0x00754ef0 | 600, 600 (1,144 checks) |
   | the in-battle refresh 0x00625de0 (mode 1 and mode 0) | 4,000 |
   | the garment-grid gate evaluation 0x005f4170 | 4,000 |
   | the ability-to-character tables 0x00626a20: real rows; SYNTHETIC rows (the harness overwrites rows with full-range bytes so every saturation rule runs) | 4,000; 2,600 |

   Not run (read only, marked "read" below): the grid-menu code, `kyJobChangeAfter`, the start of the change (`pp_cmd_start`), the
   rewards, AP gain and counter checks, the rapid-shot opener, anything of the motion scripts, and the player-side monsters' branch
   of `CalculateStats` and the bonus block.
3. Every table in the kernels hashes to the value computed from the decoded game files (eight digests: growth, level curve, girl
   map, auto-ability rows, accessory rows, grid rows, dressphere ability lists, effect fields); the test fails on one wrong cell.
4. A deliberate one-line fault was put into the kernels 193 times (a constant, a comparison, a mask, a clamp, an order, a table
   cell); the repo's own tests (hand-worked examples, digests and the fixtures) caught 184. The 9 that survived are not faults: the
   record-number guard `>= 23` against `> 23` (no 23rd curve row exists either way), `& 0xfff` against `& 0xff` on the girl map
   (every value is 0x50xx), the level used by accessory conditions (every accessory condition is 0), the 0xff plate id contributing
   nothing, the low byte against the low 12 bits of a plate id below 64, the gate evaluation skipping condition 0 and conditions
   from 0x100 (it answers false for both anyway), `(1 + 2c) / 2` against `(0 + 2c) / 2` for the Magic Booster with Half MP Cost, and
   a ward byte of exactly 0xfe (254 either way).
5. The tests in the repo carry hand-worked examples (the arithmetic is in the comments) and fixture blocks that load
   `tests/fixtures/parity/ffx2/dressphere_{stats,battle,recalc,lists,refresh,effects,gate}.json` (a stratified pick of each
   function's vectors, every branch represented, each under 250 KB). Scripts and the full vector files stay outside the repo in
   `D:\Tools\ffx-parity\kernel-check-dressphere\`.

**Notation.** `Chr+0xNNN` is an offset into the battle character structure (stride 0x17E0, 31 entries; array pointer at VA
0x00e0ebac). `Rec+0xNN` is an offset into the save record (0x80 bytes each, 23 records from VA 0x00e006c0). `Cmd+0xNN` is an offset
into the command row. All arithmetic is 32-bit; divisions round toward zero. Save records 0 to 2 are Yuna, Rikku and Paine; 3 and 4
are the pods of Yuna's Special, 5 and 6 Rikku's, 7 and 8 Paine's (the child records read their parent's experience); 9 to 14 are not girls (named rows in the shipped initial data, for example Kogoro, Ghiki,
Flurry); **15 to 22 are the player-side monsters**.

## 1. The stat record

### 1.1 What the record holds

| `Rec+` | Field |
|---|---|
| 0x04, 0x08 | HP bonus, MP bonus (s32): added to the dressphere's HP and MP |
| 0x0c to 0x13 | eight bonus bytes: Strength, Defense, Magic, Magic Defense, Agility, Luck, Evasion, Accuracy |
| 0x14, 0x18 | experience, experience needed for the next level |
| 0x1c, 0x20, 0x24, 0x28 | HP, MP, maximum HP, maximum MP |
| 0x2c | in the party |
| 0x2d to 0x34 | the final stat bytes: Strength, Defense, Magic, Magic Defense, Agility, **Accuracy, Evasion, Luck** (note: not the bonus order) |
| 0x35 | level sync (highest level the monsters' per-level gains were applied up to) |
| 0x36 | dressphere as stored (the girl map turns it into the girl's own variant) |
| 0x38, 0x3a, 0x3c | garment grid (0xff none), two accessories (0xffff none) |
| 0x50, 0x52, 0x54 | the three auto-ability words, rebuilt on every recompute |
| 0x56 | the dressphere the stats were last built for |

The initial rows (`ply_save.bin`) start every girl with bonus fields 0, grid 0 (First Steps), no accessories and HP 9,999 / MP 999
(clamped by the first recompute); Yuna begins as a Gunner, Rikku as a Thief, Paine as a Warrior.

### 1.2 Level (`MsCalcChrLevel`, 0x00617120)

The experience that leaves level L is `T(L) = ((a * (L + 1) + b) * L * L) / 10`, with `[a, b]` from `ply_rom.bin` bytes +5 and +6: Yuna
(14, 20), Rikku (13, 14), Paine (12, 30). The level is the first L from 1 to 98 whose `T(L)` the (signed) experience does not reach;
99 when it reaches `T(98)` = 1,350,322 for Yuna. The next-level field gets the last `T` computed (0 at level 99). Records 3 and 4 use
Yuna's record and curve, 5 and 6 Rikku's, 7 and 8 Paine's, and the threshold is written to the parent's record. A record number of 23
or more answers level 1 and writes nothing. Example: Yuna reaches level 20 at 10,830 experience (`T(19) = 300 * 361 / 10`), level 21 at 12,560.

### 1.3 Growth (`CalculateStats`, 0x0060d6f0)

Everything is integer arithmetic, each division truncating. With the dressphere's HP bytes `[a, d, c]`, MP bytes `[a, d, c]` and eight
stat rows `[a, d1, c, d2, d3]` (job row `+0x0e`, `+0x11`, `+0x14` + 5 per stat):

```
HP   = a*L - (L*L*10)/d + c
MP   = (a*L)/10 - (L*L)/d + c
stat = L/d1 - ((L*L/16)/d2)/d3 + (a*L)/10 + c
```

The stat rows are in the file order Strength, Defense (the file calls it vitality), Magic, Magic Defense (spirit), Agility (dexterity),
Evasion (avoid), Accuracy (hit), Luck; the function's output is `[HP, MP, STR, DEF, MAG, MDEF, AGI, ACC, EVA, LCK]`. When any of the
three HP bytes is 0 the growth part is skipped and the ten numbers stay 0. The save record's bonus fields are then added (HP bonus,
MP bonus, and the eight bytes in the order of 1.1). The girl map first turns the stored dressphere into her own variant (rows 0xc, 0xe,
0xf to 0x1b and 0x1d to 0x1f give each girl a different id: the Trainer, the Mascot, the Specials and their pods, the Festivalist). The Attack command of the dressphere (`job +0x0c`) is also the command
Berserk and a counter-attack use: 0x302c for the ranged dresspheres and the casters, 0x302d melee, Mascot and Songstress, 0x302e
Thief, 0x302f Trainer, 0x3030 / 0x312f / 0x3031 for the three Specials.

Worked example, Gunner at level 20 (HP bytes 42, 70, 79; MP bytes 16, 188, 18): HP = 840 - 4000/70 + 79 = 840 - 57 + 79 = **862**;
MP = 32 - 400/188 + 18 = 32 - 2 + 18 = **48**; the ten numbers are 862, 48, 46, 29, 24, 21, 51, 122, 2, 14. At level 99: 2,837, 124,
137, 59, 73, 59, 57, 132, 6, 24.

HP and MP constants of all 34 dresspheres (the eight stat rows are in `kernel/dressphere-growth.ts`):

| id | dressphere | worn by | Attack cmd | HP a, d, c | MP a, d, c |
|---|---|---|---|---|---|
| 0x5000 | (none) | anyone | - | 42, 70, 79 | 16, 188, 18 |
| 0x5001 | Gunner | anyone | 0x302c | 42, 70, 79 | 16, 188, 18 |
| 0x5002 | Gun Mage | anyone | 0x302c | 36, 88, 72 | 31, 173, 38 |
| 0x5003 | Alchemist | anyone | 0x302c | 38, 76, 80 | 15, 177, 14 |
| 0x5004 | Warrior | anyone | 0x302d | 46, 183, 103 | 22, 150, 16 |
| 0x5005 | Samurai | anyone | 0x302d | 38, 133, 78 | 26, 180, 18 |
| 0x5006 | Dark Knight | anyone | 0x302d | 58, 175, 173 | 32, 155, 85 |
| 0x5007 | Berserker | anyone | 0x302d | 66, 100, 113 | 16, 200, 14 |
| 0x5008 | Songstress | anyone | 0x302d | 28, 185, 58 | 33, 99, 36 |
| 0x5009 | Black Mage | anyone | 0x302c | 27, 193, 73 | 42, 155, 48 |
| 0x500a | White Mage | anyone | 0x302c | 28, 177, 75 | 39, 122, 44 |
| 0x500b | Thief | anyone | 0x302e | 44, 73, 70 | 22, 122, 33 |
| 0x500c / 0x5018 / 0x5019 | Trainer (Yuna / Rikku / Paine) | one girl each | 0x302f | 46, 70, 85 | 26, 130, 32 |
| 0x500d | Lady Luck | anyone | 0x302c | 35, 77, 77 | 33, 143, 40 |
| 0x500e / 0x501a / 0x501b | Mascot (Yuna / Rikku / Paine) | one girl each | 0x302d | 81, 67, 90 / 80, 68, 115 / 79, 70, 100 | 58, 97, 99 / 59, 96, 100 / 61, 38, 80 |
| 0x500f | Floral Fallal (Yuna's Special) | Yuna | 0x3030 | 72, 130, 180 | 66, 40, 60 |
| 0x5010, 0x5011 | its two pistils | pods | 0x302c | 51, 120, 80 | 40, 60, 80 |
| 0x5012 | Machina Maw (Rikku's Special) | Rikku | 0x312f | 66, 130, 200 | 55, 70, 40 |
| 0x5013, 0x5014 | its smasher and crusher | pods | 0x302c | 54, 85, 80 | 40, 100, 20 |
| 0x5015 | Full Throttle (Paine's Special) | Paine | 0x3031 | 70, 150, 220 | 10, 240, 2 |
| 0x5016, 0x5017 | its two wings | pods | 0x302c | 59, 70, 100 | 30, 120, 80 |
| 0x501c | Psychic | anyone | 0x302c | 48, 58, 80 | 44, 99, 40 |
| 0x501d to 0x501f | Festivalist (Yuna / Rikku / Paine) | one girl each | 0x302e / 0x302d / 0x302c | 55, 57, 74 / 54, 57, 74 / 61, 57, 76 | 48, 68, 31 / 44, 66, 31 / 31, 177, 31 |
| 0x5020, 0x5021 | Freelancer, Leblanc Goon | anyone | 0x302d | 42, 70, 79 (a copy of Gunner's) | 16, 188, 18 |

### 1.4 The bonus block (`0x00618e90`, contribution 0x0061be70)

The recompute builds 30 integers: slots 0 to 9 are the first layer of the `up_status` arrays (HP %, MP %, then flat Strength,
Defense, Magic, Magic Defense, Agility, Accuracy, Evasion, Luck), slots 10 to 19 a second layer that only a player-side monster's
dressphere fills (always 0 for a girl), slots 20 to 29 the Special scale terms. Contributions are added in this order: the two accessory
slots, each listed auto-ability, then the garment grid.

* an accessory (`Rec+0x3a`, `+0x3c`, category 9): adds its `up_status` (row `+0x0e`) **unless the dressphere is a Special**;
* an auto-ability (category 8): adds its `up_status` (row `+0x1a`), always;
* the garment grid (category 6): adds its `up_status` (row `+0x1b`), unless Special; for a Special it instead writes the grid's node count
  (row `+0x18`) into slots 20 to 25.

The **list of abilities** comes from `0x00629570` for kind 8 (auto-abilities), from these groups in this order, each duplicate dropped
unless the ability row's special byte (`+0x14`) has bit 2, value 4 (the "+5 to +30" stat abilities may repeat), the list holding at most 64:

1. the dressphere's own sixteen (prerequisite, ability) pairs (job row `+0x3c`): an ability is listed when its prerequisite is met and, if the
   pair has a prerequisite, the ability itself is mastered; a Special's main unit (0x500f, 0x5012, 0x5015) uses only this group and the gate
   slots, every other dressphere (the pods included) uses all four;
2. the girl's eight gate-ability slots (VA 0x00df7ff0 + 0x10 per girl, 0xff empty), filled by the grid code (§3);
3. the garment grid's eight (condition, ability) pairs (`plate +0x28`), tested with level 0, so only a pair with **condition 0** (the always-on
   abilities) passes; the gate conditions come in through group 2;
4. the two accessories' pairs (`accessory +0x18`, `+0x1c`), conditions tested with the girl's level.

The prerequisite test is `MsCheckAbility` (0x00629260, arguments chr, condition, level): a command or ability id (categories 3, 4, 8)
is met when mastered (AP has reached its cost; category 4 is always met); category 7 (0x7000 + n) when key item n (0 to 127) is held;
the conditions 0x100 to 0x105 need a whole set mastered (0x100: the four commands 0x3069 to 0x306c; 0x101: abilities 0x8006 and 0x8007;
0x102: 0x802d, 0x8031, 0x8035, 0x8039; 0x103: 0x3200 to 0x3203; 0x104: 0x3206 to 0x3209; 0x105: 0x320c to 0x320f); anything else is a
number, met unless `level < number && level > -1` (a level of -1 means "do not test", the menu's view). "Mastered" is AP at the
cost, so these cost 0 and are always mastered: 28 of the 162 auto-abilities (0x807c to 0x8096 and 0x809c), and 385 command ids (0x3000 to 0x301e,
0x3025 to 0x302b, 0x317c to 0x3180, 0x3182 to 0x31e5, 0x31f0 to 0x31f3, and 0x3212 upward, which includes the ids past the end of the
554-row table, read as row 0).

### 1.5 The final stage (the tail of `RecalcSaveStats`, 0x0060e2d0)

With the ten numbers `c[0..9]` of 1.3 and the block `B[0..29]`:

1. **A Special dressphere** (any of the nine ids of the three Specials and their pods) multiplies every number by `(B[20+k] + 25) / 25`,
   `B[20..25]` being the grid's node count and `B[26..29]` 0: **2 nodes x1.08, 4 nodes x1.16, 6 nodes x1.24** on HP, MP, Strength, Defense, Magic and
   Magic Defense (the other four terms are 0, so Agility, Accuracy, Evasion and Luck are unchanged). The scale uses the node count of the
   plate stored in the record being rebuilt.
2. HP takes two percent layers one after the other: `hp1 = c0 + c0 * B[10] / 100`, then `hp2 = hp1 + hp1 * B[0] / 100`; MP the same with
   `B[11]`, `B[1]`. A negative percent truncates toward zero (1,003 at -40% loses 401 and stays 602).
3. Each of the eight stats adds `B[10+k] + B[k]`.
4. Clamps: maximum HP 1 to 9,999 (99,999 when the first word has Break HP Limit, bit 14), maximum MP 1 to 999 (9,999 with Break MP
   Limit, bit 15), the seven stats 1 to 255, Evasion 0 to 255. The words are the OR of the rows of every listed ability (§4.1) and are read
   in the same pass, so a Break limit takes effect in the build that lists it.
5. If the dressphere differs from `Rec+0x56` the record's HP and MP follow the ratio rule (1.6); `Rec+0x56` takes the new dressphere. The level
   sync byte only ever goes up.

Worked examples (level 20 Yuna, Gunner, no grid): nothing equipped gives HP 862, MP 48 and bytes 46, 29, 24, 21, 51, 122, 2, 14
(Strength, Defense, Magic, Magic Defense, Agility, Accuracy, Evasion, Luck). A Crystal Bangle (HP +100%) gives 862 + 862 * 100 / 100 = **1,724**; a
Hour of Need grid adds Defense +10 and Magic Defense +10 to those two bytes; the accessory with HP -40%, MP -40%, Strength +60, Magic -50, Magic Defense -50 gives
HP 862 - 344 = **518** (the 344.8 truncates), MP 48 - 19 = 29, Strength 106, Magic 1, Magic Defense 1. A level 20 Floral Fallal (base HP 1,590, MP 182) on a
6-node grid gives HP 1,590 * 31 / 25 = **1,971** and MP 225.

### 1.6 Pools, the battle copy, the maximum recompute

* **Ratio rule** (`HpScale` / `MpScale`, 0x0060b540 / 0x0060b580, the record version 0x0060eca0): the new value of a pool whose maximum moves from
  `oldMax` to `newMax` is `(oldMax/2 + value * newMax) / oldMax` (`oldMax` raised to 1, so it rounds to the nearest), **except that a result
  below 1 for a pool that was above 0 gives back the old value, not 1**. The record then clamps both pools to 0..maximum. Example: 400 of 862
  HP becomes 465 of 1,002; 5 of 5,000 with a new maximum of 100 stays 5.
* **Battle copy** (`MsSetRamChrParam`, 0x00627590): the pools, maxima and the three words are copied as they are (no clamp); the eight stat
  bytes are the record's bytes plus the signed script-adjust bytes `Chr+0x39e` to `+0x3a5`, clamped 1..255 (Evasion 0..255); `Chr+0x656` takes
  the dressphere's Attack command and `Chr+0x66f` the "wears a Special" flag. The adjust bytes are written only by battle scripts (stat ids
  0x13 to 0x1a).
* **Maximum HP and MP** (0x00636560): `max = clamp(factor * base, 0, cap)` with factor 2 under Double HP (status bit 0x800, Double MP 0x1000),
  cap 9,999 (999 for MP), 99,999 (9,999) with the Break limit, 999,999,999 for a monster carrying `Chr+0x3ad`; HP and MP are then clamped into
  0..max. The cap therefore applies twice: Double HP cannot lift a girl past 9,999 without Break HP Limit.
* **HP state** (0x00619fc0): 2 when HP is below 1, 1 when `HP * 3 / max` rounds to 0 (under a third), else 0; the SOS abilities test it.

### 1.7 What writes the bonus bytes

Only two writers exist. The first is a menu action (0x0076fe70, called from 0x0076b7b0 and 0x0076fd30). It adds an item's block (item row `+0x90`,
`+0x94` ints, `+0x98` to `+0x9f` bytes) or an accessory's tail block (accessory row `+0x44`, `+0x48`, `+0x4c` to `+0x53`) to the chosen record:
each byte saturates at 255 and is skipped once the record's final stat byte is already 255; the HP and MP bonus add only while the
maximum is below its cap and the bonus itself is below the cap. It also teaches the row's ability or command (item `+0x8e`, accessory `+0x42`; the
learn check 0x0076c3b0 refuses records below 3) and ends with `RecalcSaveStats`. I take it to be the player-side monsters' feeding screen, because that
learn check refuses records 0 to 2 and the screen copies a 0x38e-word monster block for records above 2. The second writer is **case 0xf3 of a command switch**
at 0x0065bfe0 (a debug or script handler), which calls 0x0060bdb0 and so sets every record to the debug maximum (HP and MP bonus 99,999 / 9,999, all
eight bytes 255). The shipped initial rows are all 0. So a girl's bonus fields are 0 in normal play (the feeding screen works on the player-side
monsters, records 15 to 22; I did not prove it can never be pointed at a girl). The blocks exist on 13 items (ten healing items and three tonics or
tablets) and 21 accessories.

## 2. Spherechange (dress commands 0x5000 and up)

### 2.1 The command and who may use it

Every id 0x5000 to 0x5fff (category 5) gets the same command row from the lookup 0x00625130: the lookup ORs two flag words into a shared scratch row and
changes nothing else (target flags 0x4d, miscellaneous flags 0x03e00000), so the row has **no ATB cost, no cast cost, no MP, no damage class**.
Curse (status word 1, bit 8) makes every 0x5xxx command unusable (0x0061a840). The girl's dress state in the scripts: BEFORE_JOB (`Chr+0x868`),
AFTER_JOB (`+0x86a`), DRESS_UP_FLAG (`+0x69`), SPECIAL_JOB (is the new dressphere a Special).

### 2.2 The start (`pp_cmd_start`, 0x006402c0, the category-5 branch; read)

1. clears Itch (bit 17 of the applied mask `Chr+0x450`, then `MsSetStatus` recomputes the effective word): **a dress change cures Itch**;
2. stores the dressphere she wears (`Chr+0x86a`) at `Chr+0x86c` and the new one (girl map applied) at `Chr+0x86e`;
3. asks 0x00622070 for the animation. A 2-bit config setting (`VA 0x00dffce0 >> 14 & 3`) picks the variant for an ordinary change: 3 plays none, 2 one shared
   short effect (0x2de), 0 and 1 the dress's own three effects (variant 1 puts the third in place of the first); the first time a dress is left or entered (its use counter, VA 0x00e0572c, is 0)
   the setting is forced to 0 unless a debug flag is set; a change into or out of a Special takes a branch of its own. The choice goes into the scratch row's two effect shorts
   (`Cmd+0x08`, `+0x0a`, not a cost). The animation's length is in motion data, not in the exe;
4. runs as a **class-2 charged command** (`pp_charge_start`) with a cast cost of 0, and sets the girl's pose state to normal (`MsSetChrWeak`, 0x0061b060).

Nothing in this code sets an invulnerability, Protect, Shell or any status. Whether the motion script protects her during the animation is not in
the exe (open question).

### 2.3 The ATB gauge

`MsATBgetRestTime` (0x00634110) gives `recovery = cost_atb * 10000 / (AGI + 1) + carry`, clamped 0..99,999, with `carry = Chr+0x9e0` (the overshoot kept
from the previous action). The dress row's `cost_atb` is 0, so **the recovery after a change is only the carry** (normally 0), and a girl's thinking time is 0 in play
(`research/re-ffx2-atb-status.md` §3.4): the change costs no gauge time; only the animation takes time. (The 600 emulated rows confirm the row and the recovery
for every dressphere, AGI and carry.) There is no "gauge reset to empty" in this path.

### 2.4 The landing (0x00647ab0) and the refresh (0x00625de0), in order

1. `kyJobChangeAfter` (0x005f51a0, §3.3): marks the nodes and gates crossed and re-evaluates the gate abilities (or wipes everything on entering a Special);
2. the two dresses' use counters are incremented (0 to 99 per girl, kind and dress; 0x0060b310) and the animation choice reads them, the girl's saved dressphere is set (`MsSetSaveJob`, 0x0060e1f0), and the refresh runs with mode 1 (a dress change; mode 0 is the AP-gain path, 0x00635590):
   remember the character's HP, MP and maxima; **rebuild the record** (§1); **copy it into the character** (`MsSetRamChrParam`); rebuild the element/status
   tables from the new ability list (§4.2); **sweep the statuses** the new immunities remove; rebuild the command table (not in the kernel); recompute the
   maxima (`0x00636560`, with Double HP/MP and the limits); then set **HP and MP from the remembered values with the ratio rule** of 1.6 and clamp to 0..maximum
   (mode 0 gives the remembered values back instead);
3. the girl then goes on with the normal command-complete path (§2.3).

The sweep (0x00624cc0) acts when the girl is alive and not Ejected (status bit 10): every group-1 status whose resistance byte is now 255 is cleared from the
applied mask except the two whose flag word has bit 0x200 (Death and Eject), and every group-2 status with a resistance byte of 255 has its counter set to 0.
Statuses otherwise stay: Haste, Slow, Double HP (which doubles the new maximum), and so on.

Worked example, Gunner to Warrior at level 20 with 400 of 862 HP and 20 of 48 MP: the Warrior's maxima are HP 46 * 20 - 4000/183 + 103 = 1,002, MP 44 - 2 + 16 = 58; HP = (431 +
400 * 1,002) / 862 = **465**, MP = (24 + 20 * 58) / 48 = **24**. Under Double HP the HP maximum is 2,004 and HP becomes 930. A girl at 0 HP stays at 0.

### 2.5 Per-battle rules

* Gate bonuses, the nodes worn and the "all dresspheres worn" mark live in per-girl tables outside the battle character (§3), so a KO or a revival does not reset them (I did not search every
  writer of those tables).
* At the start of a battle (0x0060b810) a girl whose record holds a Special dressphere is put back into the dress she wore before the form (`Return Normal Job`, 0x005f58d0, from the table at VA
  0x00df5d60 + 4 * chr), and if her record still holds a Special after that it is rewritten to her Gunner. A girl never starts a battle in a Special form.
* A girl cannot change while Cursed; there is no limit on the number of changes in the code read.

### 2.6 The Special dresspheres

* **When the form is offered** (the grid scene start, 0x005f4800, VA 0x00df5ea8): every dressphere node of the girl's grid has been worn (0x005eb920 tests a bit per node)
  AND the party owns at least one of **her** Special spheres (a signed count at VA 0x00dffd1c, indexed by the Special's job number 0x0f, 0x12, 0x15; the count lives in the party's item
  table, `0x0060c6e0`). Choosing it commits with mode 1 and remembers the dressphere to return to (`VA 0x00df5d60 + 4 * chr`); leaving a Special commits with mode 2.
* **The form:** the girl's own record takes the Special's job id (main unit); the two pods are the CHILD records (3 and 4, 5 and 6, 7 and 8), found by `MsGetPartChr` (3 + 2 * girl + k) and
  `MsGetChrNum`; each is a separate battle body with its own HP, command menu and gauge. Their stats come from the same recompute with their own dressphere row and their own record
  (the shipped initial pod rows hold grid 0, whose node count is 6; whether play rewrites it is open).
* **Unlock key items** (`important.bin`): Aurora Rain (0x3f) makes Floral Fallal's Break HP Limit learnable and Twilight Rain (0x3e) its Break Damage Limit; Machina Reactor (0x41) and
  Machina Booster (0x40) the same for Machina Maw; Corpus Invictus (0x43) and Victor Primoris (0x42) for Full Throttle. Each is a prerequisite pair `(0x7000 + n, ability)` and the ability
  still needs its AP (20). The Specials also learn Double HP and Triple HP (both +100% of base HP, so together x3) and always carry Ribbon.
* Accessories and the grid's `up_status` do not apply to a Special main unit (1.4).

## 3. Garment grids

### 3.1 A grid row (`plate.bin`)

`+0x18` u16 the node count (also the Special scale term), `+0x1b` ten bytes of always-on `up_status`, `+0x28` eight (condition, ability) pairs, condition 255 blank. The
64 grids, their equip bonuses and gate pairs are in `kernel/dressphere-grids.ts`; for example Vanguard (0x6001, 5 nodes): equip Strength +5, Magic +5; gate 3 and 4 Strength +5,
gate 1 and 2 Magic +5. Hour of Need (0x6006): Defense +10 and Magic Defense +10, then +10 per gate. Scourgebane (0x601c, 5 nodes): two "-proof" abilities at each of its four gates (all eight
slots when all four are crossed). Highroad Winds (0x6009): First Strike always on, Slowproof at gate 2, Stopproof at gate 1, SOS Haste when every gate is crossed. A pair whose
ability id is a command (0x30xx) puts that command into the same slot (the command lists read it; the auto-ability list ignores it).

### 3.2 Gate conditions and how the slots are written (`0x005f4170`)

Conditions: 1 to 4 one gate each; 5 gates 1 and 2; 6 gates 3 and 4; 7 gates 1, 2 and 3; 100 every gate; 101 every dressphere of the grid worn; 102 both; 0 (always on) and 255 are skipped
here, anything else prints an "unknown type" notice and adds nothing. The evaluation sets the girl's slot count to 0, then walks the eight pairs **in plate order** and appends the
ability of each satisfied condition at the next slot (at most 8). **Slots past the new count keep their old contents** (the whole array of eight is what the ability list reads). Gate numbers
1 to 4 are positions in the grid layout; their colours live in the layout.

### 3.3 After a change (`kyJobChangeAfter`, 0x005f51a0)

Each girl has a pending-change record (VA 0x00df6048 + 0x20 per girl: mode, new dressphere, up to two nodes and two gates crossed). The mode is 0 for an ordinary move, 1 for entering a Special,
2 for leaving one. Mode 0 marks the nodes and gates the move crossed (the marks are bits, so crossing again changes nothing) and runs the evaluation above; mode 1 clears every node mark (64) and gate mark (32) and empties
the slots, so the grid's progress starts over; mode 2 does nothing. The node marks are stored per girl (64 entries each).

### 3.4 What is not decoded

The grid's nodes, links and gate positions are in the menu file `menu_plate.bin` as compressed entries ("plate decode buff"); they were not decoded. The kernel therefore takes the gates already crossed as an
input (`Ffx2GateState`), not a route.

## 4. Auto-abilities and accessories

### 4.1 The three words (`Chr+0x650`, `+0x652`, `+0x654`)

Each auto-ability row has three u16 masks (`+0xa4`, `+0xa6`, `+0xa8`); the recompute ORs them over the listed abilities and the battle code tests bits. The bits, with what reads them:

| Word | Bit | Ability | What the code does |
|---|---|---|---|
| 0 | 0x0001 | First Strike | `MsChrAtbInit` (0x00634700) zeroes the girl's starting recovery counter (unless she is dead or petrified): she is ready at once |
| 0 | 0x0002 | Initiative | feeds the preemptive-strike term of `MsCalcFirstAttack` (0x00618b60) |
| 0 | 0x0004 / 0x0008 | Counterattack / Evade & Counter | physical counters (0x00641360); 0x0008 also read in the evade branch (0x00641500) |
| 0 | 0x0010 | Magic Counter | the magical counter (class 2 commands) |
| 0 | 0x0020 | Magic Booster | damage x3/2 and MP cost x2 for commands of menu category 1 or 2 (0x006172c0, 0x0061acd0) |
| 0 | 0x0040 | More Encounters | field only |
| 0 | 0x0100 / 0x0200 / 0x0400 | Chemist / Elementalist / Physicist | item damage or healing x2 (see below) |
| 0 | 0x1000 / 0x2000 | Double AP / Triple AP | AP gain x2 / x3 (both x6), 0x00635590 |
| 0 | 0x4000 / 0x8000 | Break HP Limit / Break MP Limit | the caps of 1.5 and 1.6 |
| 1 | 0x0001 | Break Damage Limit | the damage cap 9,999 becomes 99,999 (0x006172c0) |
| 1 | 0x0002 | Butterfingers | the reward routine (0x006244c0) sets a third reward value to 8; what it is was not resolved |
| 1 | 0x0010 / 0x0020 / 0x0040 | Gillionaire / Double Items / Double EXP | rewards x2 (gil, item drops, experience), 0x006244c0 |
| 1 | 0x0200 | Item Hunter | adds 0x40 to a drop-rate term in the same routine |
| 1 | 0x0400 | Piercing Magic | the caster ignores Reflect (`pp_reflect_redirect`, 0x00619dd0) |
| 1 | 0x0800 / 0x1000 | HP Stroll / MP Stroll | field |
| 1 | 0x2000 | No Encounters | field |
| 1 | 0x4000 / 0x8000 | Trigger Happy 1 / 2 | the rapid-shot window (4.4) |
| 2 | 0x0001 / 0x0002 | Scan 1 / Scan 2 | the scan level (0x00629910) |
| 2 | 0x0004 / 0x0008 | Half MP Cost / One MP Cost | 4.3 |

The three item doublers: when a command in the item range (0x2xxx) is not marked (`Cmd+0x1c` bit 0x10), its damage doubles with **Physicist** if the element is none or **Elementalist** if it has one;
a marked one (the healing items) doubles with **Chemist** only for the HP-restore and MP-restore formulas (classes 5 and 7). Several abilities are word bits only: for example Double All sets Double AP,
Chemist, Elementalist, Physicist, Gillionaire, Double Items and Double EXP.

**First Strike and Initiative are the other way round from `research/re-ffx2-atb-status.md` and `kernel/atb-start.ts`**, which call bit 0 "Initiative" and bit 1 "First Strike". The game's own text
names bit 0 First Strike (0x8000) and bit 1 Initiative (0x8001); the effects described there are right, only the names are swapped (§6).

### 4.2 What an ability does to the battle character (`0x00626a20`, with the cast writer `0x00627d60`)

The tables start empty (the set-up clears them) and each listed ability adds into them, in list order. Offsets are into the character:

| Table | `Chr+` | Rule per ability |
|---|---|---|
| element masks | 0x3af to 0x3b3 (weapon element, absorb, null, half, weak) | OR |
| cast-speed entries | 0x5af count, 0x5b0 ids, 0x5b8 percents | up to 4 entries; the same id adds its signed percent, kept within -100..100 (below -100 stores -100); a fifth id, an id of 0 or a percent of 0 is ignored |
| weapon status, group 1 | 0x3bc | add; the sum stops at 253; a value of 254 or more on either side is a ceiling that wins |
| weapon status, group 2 | 0x3d4 | signed add, clamped 0..253; same ceiling rule |
| turn counts | 0x3ec | signed; per status the range is 0..125 for the statuses whose group-2 flag word has the counter bit (0x4) and -10..+10 for the others (the stat stages); a value above the range is kept (the larger wins), so the "Auto" count 126 stays 126 |
| wards, groups 1 and 2 | 0x404, 0x41c | add; the sum stops at 254; 255 is immunity and wins |
| kept statuses | 0x534 mask, 0x538 counts | an ordinary row ORs its group-1 mask and combines the counts of the group-2 statuses it names (mask at row `+0x88`); the "Auto," abilities carry the count 126 |
| SOS statuses | 0x518 mask, 0x51c counts, flag 0x66c | a row with special bit 0 sets the flag and does the same into the SOS set; the SOS set is the one the low-HP check (HP state 1, 1.6) is meant to switch on; that switch was not traced |

Row offsets: element bytes `+0x15` to `+0x19`, cast type `+0x10` and percent `+0x12`, weapon chances `+0x24` and `+0x3c`, wards `+0x54` and `+0x6c`, kept masks `+0x84` and `+0x88`, counts `+0x8c`.
The status indexes are the game's own: group 1 index 0 Death, 1 Petrify, 2 Sleep, 3 Silence, 4 Darkness, 5 Poison, 6 Confusion, 7 Berserk, 8 Curse, 9 Defense, 10 Eject, 16 Pointless, 17 Itch.
Spellspring (auto mask bit 13) is the "free MP" status read by the MP cost; "Double HP / Double MP" as grid abilities 0x8098 / 0x8099 keep the statuses with bits 0x800 / 0x1000, while 0x8072 / 0x8073 are +100% HP in the
bonus block (a dressphere ability).

### 4.3 MP cost (`MsGetCommandMp`, 0x0061acd0)

`cost = (add + mult * base) / div` with an unsigned division. Spellspring (status bit 13) makes the base 0. A command paid in HP (misc flag 0x10000000) is untouched. Half MP Cost sets `add = 1, div = 2`
(rounds up); One MP Cost (when the base is not 0) sets `base = 1, div = 1, add = 0` and cancels the halving; Magic Booster for a menu category of 1 or 2 sets `mult = 2, add = 0`. So with a base of 20:
Half 10, One 1, Booster 40, Half + Booster 20, One + Booster 2.

### 4.4 The Gunner's rapid-shot window (opener 0x00647590, countdown 0x00754ef0)

The opener runs once per command (flag `Chr+0x664`) when the command arms a window (`Chr+0x663`): level 2 if word 1 has bit 15, else 1 if bit 14, else 0, and hands `rapid_shot[level]` (rom table, VA 0x00df7e8c)
to the HUD: **180, 220 or 260 in hundredths of a second** (the HUD shows `S:CC`). The countdown runs once per logic step from the HUD update (0x0075e110, inside 0x0061e440): each step adds 30 to a
hundredths accumulator and 1 to the elapsed count, up to four times, until the accumulator passes 99 (then it keeps the remainder), so a step advances the elapsed count by 3 or 4 and every three
steps by 10. The window ends on the first step whose elapsed count passes the total, or one step earlier when the walk lands exactly on the total and the display jitter (0 to 3) draws 0: **54 to 55, 66 to
67 and 78 to 79 steps** from an accumulator of 0 (1.80 to 1.84 s, 2.20 to 2.24 s, 2.60 to 2.64 s at the measured 29.97 steps a second, one step being 0.033367 s; corrected by the 2026-10-09 measurement, which closed the 30-or-60 question and replaced "1.80 to 1.83 s, 2.20 to 2.23 s, 2.60 to 2.63 s at 30 steps a second": `research/re-ffx2-timing-measured.md` section 3, `research/re-ffx2-atb-status.md` §1).

### 4.5 Other readers worth knowing

* **AP** (0x00635590): the AP gained is x2 with Double AP and x3 with Triple AP (x6 for both), 0 under Pointless (status 16, `Chr+0x436` bit 0, which also stops experience); it is added to the per-battle total `Chr+0x670` (capped at `Chr+0x674`, 99); if something was mastered,
  the refresh runs in mode 0.
* **Counters** (0x00641360): physical commands need word 0 bit 2 or 3, magical ones (class 2) need bit 4; the counter command is `Chr+0x656` (the dressphere's Attack command); skipped when the action record's flags 0xc are set.
* **Limits:** the damage cap is 9,999, 99,999 with word 1 bit 0 or the command's own flag, so Break Damage Limit sits beside Break HP Limit (word 0 bit 14) and Break MP Limit (bit 15).

## 5. Where the engine differs from the game

The engine files are those of the `src/battle/ffx2` layer. Numbers below come from running the engine's functions and the kernels side by side (scratch scripts `diverge*.mjs`). "Anchor level" means a (dressphere, level) row of the
engine's table.

| # | Engine | Game | Concrete input: engine result, game result | Responsible line |
|---|---|---|---|---|
| D1 | Stats are wiki anchors at Lv 20/24/28/45/50 (and 99 for six dresspheres), interpolated | The exact integer growth of 1.3 | Over the 64 anchor rows (640 cells) the engine HP matches the game in all 64, but the other nine stats differ in 334 of 576 cells. Gunner Lv 20: engine MP 51, DEF 30, MDEF 30, AGI 53, ACC 123, EVA 4, LCK 15; game MP 48, DEF 29, MDEF 21, AGI 51, ACC 122, EVA 2, LCK 14. Per stat (rows differing of 64, largest gap): MP 6 (5), STR 11 (2), DEF 52 (13), MAG 20 (6), MDEF 47 (11), AGI 54 (3), ACC 49 (3), EVA 56 (3), LCK 39 (2); the engine is mostly the higher | `src/battle/ffx2/dressphere-stats.ts:33-131` (`ANCHORS`) |
| D2 | Levels outside the anchors are linear interpolation or extrapolation, rounded | The integer chain | 154 (dressphere, level) rows over levels 10 to 99: none identical. Mascot, anchored at Lv 45 and 50 only: Lv 20 engine HP 1,763, MP 220, DEF 134; game HP 1,651, MP 211, DEF 132. Lv 99 HP, engine minus game: Mascot 7,040 against 6,647 (+393), Trainer +377, Thief +363, Lady Luck +340, Berserker +260, Samurai +206 | `dressphere-stats.ts:140-165` (`interpolate`, `Math.round(lerp(...))` at :162) |
| D3 | A dressphere with no table (Psychic, Festivalist, Freelancer) falls back to Gunner's shape | Each has its own row | Psychic Lv 30: engine HP 1,206, MP 65, MDEF 36; game HP 1,365, MP 163, MDEF 141 | `dressphere-stats.ts:134`, `:175` |
| D4 | A Special's main unit is Mascot's stats x (0.8 + 0.1 * (nodes - 2)); the pods are fixed fractions of Mascot's (HP x0.35, MP x0.5, DEF/MDEF x0.6) | Each part has its own growth row (1.3) and the whole stat set is scaled by (nodes + 25) / 25 for **both** the main unit and the pods (each by its own record's grid) | Floral Fallal Lv 20 on 6 nodes: engine HP 2,116, DEF 161, MAG 84; game HP 1,971, DEF 52, MAG 100. 2 nodes: engine x0.8 (HP 1,410), game x1.08 (HP 1,717). Right Pistil Lv 20: engine HP 617, DEF 80; game (unscaled) HP 1,067, DEF 43 | `dressphere-stats.ts:194-221` (`sdspPartStats`) |
| D5 | `statAtLevel` (unused at runtime) is `floor(lv*A + lv/D + B - lv^2/Q)` in floats, with fitted constants | Truncating integer terms | Over levels 1 to 99, 14 dresspheres, 10 stats (13,860 cells) the fit differs in 5,786; mostly by 1, with gaps up to 36 (Strength) and 21 (MP). Gunner Lv 60 DEF: fit 52, game 53; Warrior Lv 99 HP: fit 4,121, game 4,122 | `src/data/ffx2/dresspheres/growth.ts:47-50` |
| D6 | Accessory percent is `Math.floor(maxHp * (1 + p))` with p summed in floats | `hp + hp * pct / 100`, integer, truncating | White Mage Lv 24, HP 715, Titanium Bangle (+40%): engine 1,000 (715 * 1.4 = 1,000.9999999999999), game **1,001**; White Mage Lv 99 MP 350 with a Silver Bracer: engine 489, game 490. 581 of 132,000 HP inputs (1 to 12,000, eleven bangle combinations) differ | `src/battle/ffx2/accessories.ts:131-132` |
| D7 | No cap after accessories; stats floor at 0 | Maximum HP 9,999 (99,999 with Break HP Limit), MP 999, stats 255, floors of 1 | Dark Knight Lv 99 (HP 5,355) with two Crystal Bangles: engine **16,065**, game 9,999; Warrior Lv 99 with Adamantite, Crystal Gloves, Mythril Gloves: engine DEF 332, game 255 | `accessories.ts:125`, `:131-135` |
| D8 | 33 of the 128 accessories are modelled, as stats and pool percents only | Each row also carries abilities (wards, Auto statuses, element strikes/eaters, First Strike, Magic Booster, Half MP, Triple AP, the Break limits) and some take stats away | Bloodlust (HP -40%, MP -40%, Strength +60, Magic -50, Magic Defense -50) is not in the table: a Lv 20 Gunner stays HP 862 / MAG 24, the game gives HP 518 / MAG 1. Sprint Shoes (Agility +10, First Strike), Gold Hairpin (Magic +20, Half MP Cost), Soul of Thamasa (Magic +15, Magic Booster), AP Egg (Luck +15, Triple AP), Enterprise (Break HP Limit) contribute nothing | `accessories.ts:51-98`, header `:28-33` |
| D9 | Gates are colours (red, green, blue, yellow); a bonus needs a set of colours; `perGate` repeats a bonus once per distinct gate passed | Gate numbers 1 to 4 with conditions 1 to 7 and 100 to 102; the abilities are looked up per pair in plate order | The stat totals with every gate passed match the game for 18 of the 19 modelled grids (and the equip-only totals for all 19) | `src/battle/ffx2/garment-grids.ts:24`, `:166-181` |
| D10 | White Signet pays MAG +10 per gate; The End, Highroad Winds and Heart of Flame have no always-on ability | White Signet (0x602c) gives Magic +15 at each of the four gates (60, not 40, in total), plus Turbo White Magic when every gate is crossed. The End (0x603b) always carries Break HP Limit, Highroad Winds (0x6009) First Strike, Heart of Flame (0x600b) Fire Eater | White Signet, 4 gates: engine MAG +40, game +60; Highroad Winds at battle start: engine no First Strike, game First Strike (ready at once) | `garment-grids.ts:111-120` |
| D11 | Every grid is a ring of its node count with the gates on successive links | The real layout (which node touches which, where each gate sits) is in the undecoded menu file | cannot be compared; the engine's adjacency and routes are an estimate | `garment-grids.ts:26-36` |
| D12 | A change empties the gauge: `ticks = 0`, `required = baseRequired(agi)`, `charging = null` | The row's ATB cost is 0: recovery is the carry only (2.3) | Gunner (AGI 41) after a change: engine refills an Attack-sized gauge (16,666 ticks, 5.56 s, `research/re-ffx2-atb-status.md` divergence rows 1 and 4); game recovery = the carry (0 for a fresh action), thinking 0 | `src/battle/ffx2/spherechange.ts:121-124` |
| D13 | The pools keep their ratio: `max(alive ? 1 : 0, round(newMax * hp / oldMax))` | `(oldMax/2 + hp * newMax) / oldMax`, and a result under 1 gives back the OLD value | 5 of 5,000 HP with a new maximum of 100: engine **1**, game **5**; the two agree on 398,852 of 398,864 sampled inputs | `spherechange.ts:62-66` |
| D14 | Trigger Happy is a press count (0 to 16) from the presentation; the window is not modelled | A 1.80 / 2.20 / 2.60 s window (4.4), level from Trigger Happy 1 and 2 | -- | `src/battle/ffx2/minigames.ts:27` |

Where the engine already agrees: Curse blocks a change, a change cures Itch, Special Dress Up needs every grid node worn and the Special owned (the wheel UI, `src/ui/ffx2/SpherechangeWheel.ts:98-100`; the game counts the Special spheres in the item table), `hasAttack: false` for Songstress, White Mage and Black Mage (their job lists hold no unconditional Attack pair; Berserk and counters still use their
`Chr+0x656`), the equip and gate stat numbers of 18 grids, every accessory stat number in its table, and the HP column of every anchor row. In `src/battle/ffx2/dresspheres.ts` the `hasAttack` flags are the
only facts this note can check; `longRange` and `attackHits` belong to the command rows and the damage notes, and were not compared here.

## 6. Anchor-map and note corrections

* `research/re-ffx2-atb-status.md` §4 and `kernel/atb-start.ts`: bit 0 of `Chr+0x650` is **First Strike** and bit 1 **Initiative** in the game's text; those two files call bit 0 "Initiative" (`ABILITY_LEAD`)
  and bit 1 "First Strike". The effects described there are right, only the names are swapped.
* `research/re-ffx2-atb-status.md` (§3.2 RECOVER, "what else stops a gauge", and the knock-out paragraph) says a dress change sets the hold `Chr+0xe72`, cites "Changing dress (0x0061c650)" and names a "special-garment
counter" 0x0061c270. Those belong to the **Oversoul** mechanism, not to a dress change: the toggle is live 0x0061c630 (0x0061c650 is its address in the older copy; it flips `Chr+0x3a9`, an id at `Chr+0x3aa` indexes
  a 0x40-entry gauge table and the 54-row `oversoul.bin`), the counter 0x0061c270 is that mechanism's threshold check, and the routine that stores 1 into `Chr+0xe72` is live 0x00623590 (0x006235c0 in the older copy), called by that
  toggle. The change code I read (2.2, 2.4) never writes `Chr+0xe72`. The ATB conclusion stands for another reason: the dress row's ATB cost is 0 (2.3).
* The dress command start clears **Itch** (status 17), not a "Change Clothes" status.
* Berserk's command is `Chr+0x656` (the dressphere's Attack command), not a fixed 0x3001.
* The engine's tile claim "stats are a function of (dressphere x level) only" holds for the standard dresspheres, but a girl's record also carries the bonus fields (0 for girls) and accessories, grid and abilities shape the numbers (1.4).

## 7. Open questions

1. **The grid layout** (nodes, links, gate colours and positions) is in compressed entries of `menu_plate.bin` and was not decoded; the engine's rings stay an estimate.
2. **The Special's scale in play:** the community "worked blocks" for Floral Fallal on a 6-node grid (HP 1,931 at Lv 25, 3,587 at Lv 50) equal the unscaled rows (1,932 and 3,588), not the x1.24 the recompute gives (2,395 and 4,449). The exe path is proven by
   emulation; whether the pods' and the main unit's records hold the plate that the scale reads when the form is active was not traced (the initial pod rows hold grid 0, 6 nodes). Needs a live look.
3. **Where the walk resets between battles** for a girl not wearing a Special: only the Special case (2.5) was found.
4. **Invulnerability** during the dress animation: nothing in the exe sets it; the motion scripts were not read.
5. **The step rate** is settled: 29.97 a second (60 / 1.001 / 2), measured on the running game on 2026-10-09 (`research/re-ffx2-timing-measured.md` section 3), so the rapid-shot window is 1.80 to 1.84, 2.20 to 2.24 and 2.60 to 2.64 s and every other timer is steps x 0.033367 s. (This entry used to read "30 or 60 a second".)
6. **What the community stat tables measured:** the engine anchors differ from the raw growth by a small positive offset on most stats (Gunner MDEF +9 to +11 at Lv 20 to 50); a loadout (grid, accessories, bonus bytes) may explain it.
7. **Butterfingers** and the third reward value (4.1); the player-side monsters' branch of `CalculateStats` and the bonus block; the command-table rebuild on a change.
