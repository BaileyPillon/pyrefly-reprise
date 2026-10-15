# FFX Dark Yojimbo and the Dark Magus Sisters: records, formations and the AI read from the game's own files

**Game case: FFX only.** Dark Yojimbo, the Dark Magus Sisters and the whole Dark Aeon set exist only in FFX (the HD Remaster carries the International content); FFX-2 has none of them and nothing here applies to it. Part of the `re-parity` track. Drafted 2026-10-15. Records, formations and AI only: no engine, data or AI code was changed.

**Source and tags.** Every statement is tagged:

- **[bytes]** read from the game's own file by a script of this lane (FFX_Data.vbf of the Steam build 25501027, files extracted read-only and kept outside the repo). **[disasm: file @offset]** read from the disassembly of that file's program; the offset is a code offset inside the monster file (or formation file) program, as in `research/re-ffx-biran-yenke.md`. No script line is reproduced; scripts are described by what they do to the battle.
- **[run]** the hook was executed: the real bytecode of the monster file ran in the small Atel interpreter of the earlier AI lanes (the Seymour/Evrae lane's, used unchanged) against a mock battle with the real command-table rows, with exact tallies over the shared random result where a draw is involved. A run proves the script's own behaviour; it does not prove the engine facts around it (section 3).
- **[note: X section]** taken from a checked note: a note in this repo (`research/...`), `research/re-ffx-yojimbo-sisters-feasibility.md` (branch `re-ffx-yojimbo-sisters-feasibility`, 8892f8f6, called "the feasibility note" below, which this note re-reads and extends), or one of the private coverage notes kept outside the repo (FFX-G04 targeting and counters, FFX-G08 aeon-side logic, FFX-G10 battle entry and hand-off, FFX-H02 record layouts).
- **[inferred]** not read directly, or arithmetic on [bytes] constants. Fields no note maps are given raw and never guessed (AGENTS.md hard rule 6).

Files used (size in bytes, SHA-256 prefix): monster files `m340` Dark Yojimbo (50,840, 82da17d4), `m341` Dark Cindy (55,592, 53cac21e), `m342` Dark Sandy (53,176, 58012d66), `m343` Dark Mindy (47,912, db183406), `m116` the dog's file (2,996, f34e962d); formations `nagi05_70` to `_74` (7,156 / 6,900 / 6,900 / 6,900 / 7,028; 3a0b0a26, aa7c1276, d746a6d5, 03f837ca, 58dd948f), `kino00_70` (7,780, ba2a0b01), `kino01_70` to `_72` (7,396 each; e82fb469, f7d54c35, 140500fa), `kino05_70` (7,396, 9bffc1aa), `kino05_71` (7,972, 25e4c5aa); kernel tables `monmagic1.bin` (31,420, 31a83925), `btl.bin` (4,096, c4e27912) and the monster tables; field events `nagi0500` (79,296, b2a53ecd), `kino0000` (115,392, d3178365), `kino0100` (114,112, 8e120aec), `kino0500` (88,704, 118fda05); the executable FFX.exe (SHA-256 0537B2A1...686D) for a handful of engine addresses. The sizes and hashes of the monster, formation and event files equal those the feasibility note lists. Move and item names are the English names of the game's own tables.

## 0. The one-screen summary

- **Dark Yojimbo (m340) is five fights, `nagi05_70` to `_74`**, each a fresh 1,600,000-HP Dark Yojimbo with the same record and the same script; the only difference is one constant: how much his Overdrive gauge gains after each of his own turns (+6 / +10 / +16 / +20 / +26, battle ids 0x01AE0046 to 0x01AE004A). He is fast (AGI 243, one action every 9 ticks). Each turn: if the gauge is 100 or more, **Zanmato** on the whole front line; otherwise one stream-2 draw modulo 3 chooses **Wakizashi on the whole front line**, **Kozuka on one random living front-line character**, or the **dog order**, which makes the dog (m116) bite a random living front-line character. The gain is added **after every turn including the Zanmato turn**, so the gauge restarts at the tier's step, not at 0. Each hit event on him adds +2. Nothing else: no HP threshold, no phases, no reaction beyond the +2. [bytes] [disasm: m340 @0x0132, @0x02f0] [run]
- **The Dark Sisters (m341 Cindy, m342 Sandy, m343 Mindy) are six formations** (`kino00_70` and `kino01_70` the trio, `kino01_71` Cindy alone, `kino01_72` Mindy and Sandy, `kino05_70` Sandy alone, `kino05_71` Mindy alone). Each Sister's turn: (1) trio formations only, while all three live and all three gauges are 100 or more, **Cindy uses Delta Attack** on the whole front line and zeroes the three gauges, while Sandy and Mindy attack and keep their gauge at 100; (2) otherwise, with her own gauge at 100 or more, **Mega Graviton** on the whole front line and her gauge to 0; (3) otherwise a fair coin (stream 2, modulo 2) between her two basic moves (Cindy: Camisade or the dispelling attack 0x412B; Sandy: Razzia or Attack with Petrify; Mindy: Passado or Calamity), each adding 20 to her gauge. Each hit event on a Sister adds +5. The trio starts with all three gauges at 100, so in a normal start Delta Attack is the third enemy action of the battle; every other formation starts the gauge at 0 and the cycle is five basic turns then Mega Graviton. Killing one Sister ends Delta Attack for good. [bytes] [disasm: m341 @0x01d8, m342 @0x01b4, m343 @0x01d8] [run]
- **At the game's own numbers every damaging move is an instant KO on an aeon.** Against the minimum player-side aeon stats (section 6.3) Kozuka, Wakizashi, Zanmato and the dog's bite all exceed the 99,999 cap before any defence; Delta Attack deals 781,430 per hit (six hits); Razzia, Camisade and the Attack with Petrify exceed the cap; only Passado per hit (about 11,500 to 14,500) and Mega Graviton (7/16 of the target's maximum HP) do not. Zanmato, Delta Attack, Razzia and the dispelling attack 0x412B also carry the cleanse flag with an extra-status word, which by the record rules removes those statuses (Auto-Life, for the first three) from the target instead of inflicting them. The difficulty of a mirror chapter is therefore set by whatever the chapter scales, not by the tier or the formation alone. [inferred arithmetic on [bytes] rows] (section 6.3)
- **Rows are in section 1, formations in section 2 (with the recommendation and the numbers per option), the engine facts the scripts lean on in section 3, Dark Yojimbo's AI in section 4, the Sisters' AI in section 5, every move row in section 6, what is not proved in section 8.**

## 1. The monster records (a)

Offsets are record offsets (the monster file's chunk 2; byte-identical from 0x14 to 0x7F to the kernel row and to the English copy in chunk 6, checked for all five files). Layout [note: FFX-H02 3.1; re-ffx-biran-yenke.md 2].

### 1.1 Identity

| Piece | Identifier | Tag |
|---|---|---|
| Dark Yojimbo | m340, monster word 0x1154, model word 0x3008, CTB icon 21 | [bytes] |
| Dark Cindy / Sandy / Mindy | m341 / m342 / m343, words 0x1155 / 0x1156 / 0x1157, model words 0x3009 / 0x300A / 0x300B, CTB icon 20 | [bytes] |
| The dog (second slot of the five Dark Yojimbo formations) | m116, word 0x1074, model word 0x3017; the name table lists the file as Sinscale | [bytes] |
| Actor numbers | slot 0 is battle actor 20, slot 1 actor 21, slot 2 actor 22 [note: FFX-G10 3.3]. In the trio **Mindy is actor 20, Sandy 21, Cindy 22**; in `kino01_72` Mindy 20, Sandy 21; every solo formation has its Sister at actor 20; Dark Yojimbo is 20 and the dog 21 | [bytes] |

### 1.2 Stats

No monster record carries a level. The Zanmato byte (loot +0x112) is the only graded field: 4 for the four Dark rows, 0 for the dog [note: re-ffx-biran-yenke.md 1].

| Field | Dark Yojimbo m340 | Dark Cindy m341 | Dark Sandy m342 | Dark Mindy m343 | Dog m116 | Tag |
|---|---:|---:|---:|---:|---:|---|
| HP | 1,600,000 | 3,000,000 | 2,500,000 | 2,000,000 | 100 | [bytes] |
| MP | 999 | 999 | 999 | 999 | 1 | [bytes] |
| Overkill threshold | 99,999 | 99,999 | 99,999 | 99,999 | 300 | [bytes] |
| STR | 244 | 175 | 186 | 148 | 10 (the script writes **244** in the five Dark Yojimbo battles) | [bytes], [disasm: m116 @0x00f7 to 0x0179] |
| DEF | 210 | 223 | 201 | 187 | 0 | [bytes] |
| MAG | 131 | 171 | 207 | 248 | 0 | [bytes] |
| MDEF | 144 | 105 | 168 | 132 | 0 | [bytes] |
| AGI | 243 | 185 | 201 | 233 | 0 | [bytes] |
| LCK | 114 | 40 | 80 | 130 | 0 | [bytes] |
| EVA | 0 | 0 | 100 | 240 | 0 | [bytes] |
| ACC | 255 | 255 | 255 | 255 | 30 | [bytes] |
| Tick speed / rank-3 recovery (from AGI) | 3 / 9 | 3 / 9 | 3 / 9 | 3 / 9 | no turns | [note: re-ffx-ctb-status.md 1, 2], [inferred] for the figures |
| Flag byte +0x28 | 0x1E | 0x1E | 0x1E | 0x1E | 0x18 | [bytes] |
| Flag byte +0x29 | 0x07 | 0x07 | 0x07 | 0x07 | 0x06 | [bytes] |
| Poison damage byte (+0x2A) | 25 | 25 | 25 | 25 | 25 | [bytes] |
| Element absorb / immune / resist / weak (+0x2B to +0x2E) | 0 / 0 / 0 / 0 | same | same | same | 0 / 0 / 0 / 0 | [bytes] |
| Automatic statuses (permanent, temporary, extra: +0x48, +0x4A, +0x4C) | none | none | none | none | none | [bytes] |
| Extra-immunity word (+0x4E) | 0x432F | 0x432F | 0x432F | 0x432F | 0x0201 | [bytes] |
| Command list (+0x50) | 0x410A Zanmato, 0x4107 Kozuka, 0x4108 Wakizashi, 0x4109 Wakizashi, 0x410B Daigoro | 0x4106 Delta Attack, 0x4105 Mega Graviton, 0x4101 Camisade, 0x412B (name table: "Extra 44") | 0x4106 Delta Attack, 0x4105 Mega Graviton, 0x4100 Razzia, 0x4127 Attack | 0x4106 Delta Attack, 0x4105 Mega Graviton, 0x4102 Passado, 0x4104 Calamity | empty | [bytes] |
| Forced action (+0x70) / monster index (+0x72) | none / 340 | none / 341 | none / 342 | none / 343 | none / 116 | [bytes] |
| Doom counter (+0x77) / Arena index (+0x78) | 255 / 255 | 255 / 255 | 255 / 255 | 255 / 255 | 3 / 255 | [bytes] |
| Word at +0x7A (sound bank by the layout note) | 0x1120 | 0x1122 | 0x1121 | 0x1123 | 0x0000 | [bytes] |
| Unmapped +0x79, +0x7B to +0x7F | 00, 00 00 00 00 00 | same | same | same | 00, 00 00 00 00 00 | [bytes] |
| Unmapped +0x00 to +0x13 (text offsets) | 00 00 ad 00 0e 00 49 00 16 00 33 00 1b 00 57 00 24 00 33 00 | 00 00 76 00 0a 00 49 00 12 00 33 00 17 00 57 00 20 00 33 00 | 00 00 78 00 0a 00 49 00 12 00 33 00 17 00 57 00 20 00 33 00 | 00 00 75 00 0a 00 49 00 12 00 33 00 17 00 57 00 20 00 33 00 | 00 00 41 00 06 00 49 00 0e 00 33 00 13 00 55 00 1c 00 33 00 | [bytes] |

**Flag bytes.** +0x28 = 0x1E (the Dark rows): immune to percentage damage (bit 1), Life (bit 2), Sensor (bit 3) and the second Scan (bit 4); **not** armored, not immune to physical, magical or HP damage. +0x29 = 0x07: immune to CTB damage, Slice and Bribe. +0x4E = 0x432F: immune to Scan, Distill Power, Distill Mana, Distill Speed, Distill Ability, Eject, Auto-Life and Doom. The dog: +0x28 = 0x18 (Sensor, second Scan), +0x29 = 0x06 (Slice, Bribe), extra word 0x0201 (Scan, Auto-Life). [bytes]

**Status bytes** (255 immune; otherwise the move's chance minus the byte; Threaten's byte is a success percentage, so 0 can never land [note: re-ffx-biran-yenke.md 2]). All four Dark rows: 255 (immune) for Death, Zombie, Petrify, Poison, Power Break, Magic Break, Armor Break, Mental Break, Confuse, Berserk, Provoke, Sleep, Silence, Darkness and Slow; 0 (lands) for Shell, Protect, Reflect, Nul-Tide, Nul-Blaze, Nul-Shock, Nul-Frost, Regen and Haste; Threaten 0 (cannot land). The dog: 255 only for Confuse and Berserk; every other byte 0 (it is not targetable, so none of this is reachable). [bytes]

**Overkill.** The threshold field is 99,999 in all four Dark rows. With the per-hit cap at 99,999 an overkill needs the killing blow to exceed what is left by the whole threshold, so it looks effectively unreachable [inferred; engine use [note: research/ffx-evrae-airship.md]]; the overkill columns exist and are given below. [bytes]

### 1.3 Loot (chunk 4; layout [note: FFX-H02 3.4, 3.5])

Rewards are rolled once per dead monster [note: FFX-H02 3.5], so each Sister pays separately; the dog has no loot.

| Field | Dark Yojimbo | Dark Cindy | Dark Sandy | Dark Mindy | Tag |
|---|---|---|---|---|---|
| Gil | 0 | 0 | 0 | 0 | [bytes] |
| AP / AP on overkill | 8,000 / 10,000 | 10,000 / 12,000 | 10,000 / 12,000 | 10,000 / 12,000 | [bytes] |
| Learned-move word (+6) | 0 | 0 | 0 | 0 | [bytes] |
| Item chance bytes (slot 1 / slot 2), steal chance, gear chance | 255 / 0, 255, 255 | same | same | same | [bytes] |
| Normal drop, slot 1 (common x qty / rare x qty) | Dark Matter 0x2035 x1 / Master Sphere 0x2050 x1 | same | same | same | [bytes] |
| Overkill drop, slot 1 | Dark Matter x2 / Master Sphere x2 | same | same | same | [bytes] |
| Steal (common x qty / rare x qty) | Stamina Tonic 0x2043 x2 / Elixir 0x2008 x1 | Return Sphere 0x2060 x1 / Elixir x1 | Friend Sphere 0x2061 x1 / Elixir x1 | Teleport Sphere 0x2062 x1 / Elixir x1 | [bytes] |
| Bribe | immune (flag +0x29 bit 2), no item | same | same | same | [bytes] |
| Gear drop | base slot count 18, formula 1, critical bonus 6, power 16, extra-ability tries 20 | same | same | same | [bytes] |
| Gear ability pool, raw: weapon row (rows 0, 2, 4, ... 12 of the 14 owner rows, all identical) | 0x0000, 0x8019 x2, 0x8003 x2, 0x8005 x2, 0x8011 | 0x0000, 0x8019 x2, 0x800F, 0x8007 x2, 0x801A x2 | 0x0000, 0x8019 x2, 0x800F, 0x8005 x2, 0x8004 x2 | 0x0000, 0x8019 x2, 0x800F, 0x8006 x2, 0x800D x2 | [bytes] |
| Gear ability pool, raw: armour row (rows 1, 3, ... 13, all identical) | 0x0000, 0x8017 x3, 0x8052 x3, 0x8080 | 0x0000, 0x8017 x3, 0x800A x3, 0x8080 | 0x0000, 0x8017 x3, 0x8054 x3, 0x8080 | 0x0000, 0x8017 x3, 0x8056 x3, 0x8080 | [bytes] |
| +0x110, +0x111 (unmapped) / Zanmato byte (+0x112) / Pilfer-Nab Gil factor (+0x113) / Monster Arena price (+0x114) | 128, 128 / 4 / 0 / 0 | same | same | same | [bytes] |

The ability names the feasibility note gives for these raw ids (Break Damage Limit, Counterattack, Magic Counter, Overdrive to AP, Break HP Limit, Curseproof, Ribbon for Yojimbo; the Triple Overdrive, Alchemy, Gillionaire, Auto-Phoenix, Auto-Shell, Magic Booster, One MP Cost, Auto-Haste variants for the Sisters) stand [note: feasibility note 2]; they were not re-derived here.

### 1.4 The dog (m116)

The dog is a real monster file in the five Dark Yojimbo formations: a stand-in record (the kernel row the name table lists as Sinscale: 100 HP, 1 MP, STR 10, ACC 30, AGI 0, no commands) whose **script was written for these five battles**. Its setup, in every battle that uses the file: not required for victory, not shown on the CTB bar, no turns, death animation "boss" (the body stays), then not targetable; in the five Dark Yojimbo battle ids it also sets STR to 244 and leaves its birth animation alone (in any other battle id the setup hides its birth animation instead). Its turn function does nothing. Its hit function is its whole behaviour (section 4.4). [bytes] [disasm: m116 @0x0009 to 0x0185, @0x018a, @0x018b] [run]

## 2. The formations (b)

### 2.1 What the formations hold

Formation block (28 bytes; layout [note: FFX-H02 3.7]), area table of `btl.bin`, launching events. Battle id = (area key << 16) or formation number [note: FFX-G10 3.8].

| Formation | Battle id (hex / decimal) | Area key / stage id | Monster words by slot (actor) | Block bytes (voice, byte 1, foot-sound id, in-water) | Battle flag word | Tag |
|---|---|---|---|---|---|---|
| `nagi05_70` | 0x01AE0046 / 28,180,550 | 430 / 1080 | 0x1154 Dark Yojimbo (20), 0x1074 dog (21) | 0, 2, 5, 0 | 0x1500 | [bytes] |
| `nagi05_71` | 0x01AE0047 / 28,180,551 | 430 / 1066 | same | 0, 2, 5, 0 | 0x1500 | [bytes] |
| `nagi05_72` | 0x01AE0048 / 28,180,552 | 430 / 1080 | same | 0, 2, 5, 0 | 0x1500 | [bytes] |
| `nagi05_73` | 0x01AE0049 / 28,180,553 | 430 / 1066 | same | 0, 2, 5, 0 | 0x1500 | [bytes] |
| `nagi05_74` | 0x01AE004A / 28,180,554 | 430 / 1066 | same | 0, 2, 5, 0 | 0x1500 | [bytes] |
| `kino00_70` (trio) | 0x00DC0046 / 14,417,990 | 220 / 1035 | 0x1157 Mindy (20), 0x1156 Sandy (21), 0x1155 Cindy (22) | 0, 0, 5, 0 | 0x1800 | [bytes] |
| `kino01_70` (trio) | 0x00DD0046 / 14,483,526 | 221 / 1036 | same | 0, 0, 9, 0 | 0x1800 | [bytes] |
| `kino01_71` (Cindy) | 0x00DD0047 / 14,483,527 | 221 / 1036 | 0x1155 Cindy (20) | 0, 0, 9, 0 | 0x1800 | [bytes] |
| `kino01_72` (Mindy, Sandy) | 0x00DD0048 / 14,483,528 | 221 / 1036 | 0x1157 Mindy (20), 0x1156 Sandy (21) | 0, 0, 9, 0 | 0x1000 | [bytes] |
| `kino05_70` (Sandy) | 0x00E10046 / 14,745,670 | 225 / 1036 | 0x1156 Sandy (20) | 0, 0, 9, 0 | 0x1000 | [bytes] |
| `kino05_71` (Mindy) | 0x00E10047 / 14,745,671 | 225 / 1036 | 0x1157 Mindy (20) | 0, 0, 9, 0 | 0x1000 | [bytes] |

Every formation is listed in the area table as a zone with weight 0 (never a random encounter). Flag words, read in the launching events: 0x1500 (5376): low byte 0 (results panel requested at the hand-off), bit 9 (0x200) clear so **a defeat is a game over**, bit 8 (0x100) set so **no victory pose or fanfare**; 0x1800 (6144) and 0x1000 (4096): bits 8 and 9 clear (victory pose plays, a defeat is a game over); bits 0x400, 0x800 and 0x1000 are not decoded [note: FFX-G10 3.6]. Every launch uses transition 0 (Screen Shatter). [bytes] The stage ids alternate for Dark Yojimbo (1080 for tiers 1 and 3, 1066 for tiers 2, 4 and 5) and are 1035 / 1036 for the Sisters; what the ids draw was not read. [unproved]

### 2.2 What the formation scripts do

All eleven formation scripts do the same three things and nothing about the AI [bytes] [disasm: nagi05_70 @0x0003 to 0x0024, kino00_70 @0x0003 to 0x0027]:

1. **Escape (0x3003) and Flee (0x3018) are disabled for all characters and aeons.** Nothing else is disabled: Switch, the summon commands and everything else stay available. No script of these formations or of m340 to m343 ends the battle early; a battle ends on a win or on the engine's defeat rule.
2. **They call one unmapped call (`ct_7126`, shown with one argument) with the Dark Aeon's own aeon id**: 14 in the five Dark Yojimbo formations; 16, 15, 17 in the trio; 15 in `kino01_71`; 16 and 17 in `kino01_72`; 16 in `kino05_70`; 17 in `kino05_71`. The other Dark Aeon formations do the same with their own aeon (Valefor 8, Ifrit 9, Ixion 10, Shiva 11, Bahamut 12, Anima 13). The call's handler (FFX.exe VA 0x7A5260) forwards to a setter (VA 0x797090, through 0x7969B0 and 0x796670) that writes one byte of a four-byte group in an actor record and recomputes an "all four non-zero" byte. **The exact argument layout and what the byte gates were not decoded**; because the argument is always the aeon that matches the enemy, and because the Isaaru formations make the mirror aeon unavailable [note: re-ffx-ai-evrae-yojimbo-isaaru-sin.md 4.1], the most probable reading is that **the game forbids summoning the matching aeon against its Dark Aeon**. This is [inferred] and [unproved]; a chapter that puts the player's own aeons against their dark twins is departing from this rule if it holds.
3. **Random positions off** and a few actor-light presets; the rest is camera work per summoned aeon (cursor style, polar camera moves chosen with stream-2 draws) with no battle effect. The Dark Yojimbo formations additionally write **`SetAmbushState(Normal)`**; the Sisters' formations write no start state.

**Start type.** Dark Yojimbo: the formation writes Normal (3); tier 1 only (`nagi05_70`) the m340 script also writes Ambushed (2). By the order the earlier lane read, a monster script's write lands after the opening counters and can change only the intro scene [note: FFX-G10 3.2, open question 3 there]. The Sisters: no write, so the engine's roll stands: with no Initiative gear on a character in the battle 191/256 normal, 32/256 preemptive, 33/256 ambush; with Initiative 191 normal, 65 preemptive, no ambush [note: FFX-G10 (start-type roll), E n=589,824]. [bytes] / [note]

**Opening counters** (so who moves first) [note: re-ffx-ctb-status.md 3], [inferred] for the figures: each Dark Aeon has AGI 185 to 243 (tick speed 3), so its base counter is 9; a normal start sets a monster's counter to `base x 100 / (100 - draw mod 11)`, which is 9 (10 once in 11 draws); ties among monsters go to the lower actor number (Mindy, Sandy, Cindy; Dark Yojimbo). A party member of AGI 30 (tick 8) starts at 22 to 24 before the minimum is subtracted. A normal or ambush start therefore gives every Dark Aeon its first action, and a second one at tick 9, before a party-side aeon of AGI 30 to 42 acts at about tick 13 to 15; a preemptive start (Sisters only: 12.5 percent without Initiative gear) puts the party first.

### 2.3 Start positions (chunk 3; first block = area 0; each position x, y, z) [bytes]

| Formation | Party (3 entries) | Monsters by slot | Aeon positions |
|---|---|---|---|
| `nagi05_70` to `_74` (area 0 identical in `_70` and `_74`; the tier files differ only in the camera work) | (25.018, 0, -28.963), (0.061, 0, -35.045), (-21.878, 0, -31.690) | slot 0 Dark Yojimbo (-0.121, 0, 31.575); slot 1 the dog (19.782, 0, 28.898) | 12 entries; index 6 (-10.686, 0, -61.414) |
| `kino00_70`, `kino01_70` | (23.314, 0, -48.214), (3.314, 0, -39.414), (-17.686, 0, -43.414) | slot 0 Mindy (23.314, 0, 31.786); slot 1 Sandy (3.314, 0, 30.586); slot 2 Cindy (-17.686, 0, 36.586) | entries 7, 8, 9 equal the three party positions; the other nine are the single point (-0.866, 0, -45.309) |
| `kino01_71` | same | slot 0 Cindy (3.314, 0, 30.586) | same |
| `kino01_72` | same | slot 0 Mindy (13.314, 0, 31.786); slot 1 Sandy (-6.686, 0, 30.586) | same |
| `kino05_70`, `kino05_71` | same | slot 0 (3.314, 0, 30.586) | same |
| the same Sister files, area 1 (raw; which area a battle starts in was not traced) | (8.099, 10, 6.344), (11.099, 13, 9.344), (14.099, 16, 12.344) | five slots all at (-38.901, 2 to 6, 7.344) | one aeon position (1.099, 2, -2.656) |

Reading the aeon positions as indexed by the aeon's actor id minus 8 (so index 6 is Yojimbo and 7 to 9 are Cindy, Sandy, Mindy) fits the three Sisters standing on the three party positions [inferred]. Slots 2 to 5 of the Dark Yojimbo area 0 list (-23.419, 0, 43.786), (1.130, 0, 67.232), (9.130, 0, 52.232), (-0.870, 0, 25.232) are unused.

### 2.4 How the game launches each fight (who triggers which tier) [bytes]

**Dark Yojimbo is a ladder walked in one field map (the event `nagi0500`).** Five collision zones along the route each call one launch function of the same worker; the functions use a progress word whose bits record what is done (bit 4 tier 1, 8 tier 2, 16 tier 3, 32 tier 4, 64 tier 5) and the whole hunt starts from a sixth zone that sets the "hunt active" bit (1) and switches the five zones on:

| Zone (in route order) | Launches | Condition |
|---|---|---|
| 1st | `nagi05_70` (tier 1), sets bit 4 | hunt active and bit 2 set; the first contact with this zone plays an introduction scene (worker function 8) that sets bit 2, the next contact launches tier 1 |
| 2nd | `nagi05_71` (tier 2), sets bit 8 | hunt active |
| 3rd | `nagi05_72` (tier 3), sets bit 16 | hunt active and bit 16 clear |
| 4th | `nagi05_73` (tier 4, sets bit 32) **if bit 16 is set**, else `nagi05_72` (tier 3) | hunt active |
| 5th | `nagi05_74` (tier 5, sets bit 64) **if bit 32 is set**, else `nagi05_73` (tier 4) | hunt active |

So the fourth and fifth zones launch "the next tier not yet done"; a player who has won the earlier tiers meets 1 to 5 in order. After the last launch the event sets Dark Yojimbo's "done" bit (value 128 of the quest word) when tier 5 was fought, and a progress-word bit 128 otherwise (the tail was not traced further); when the done bits of all eight Dark Aeons are set, the last event warps to room 223. What sets the quest bit that allows the hunt (value 1 of the quest word) was not traced. Each tier is a new full-HP Dark Yojimbo: nothing writes HP, so nothing carries over. [bytes] / [unproved] for the quest condition

**The Sisters are launched from three maps.** `kino0000` (Sisters trio `kino00_70`, one launch); `kino0100` (trio `kino01_70`, or the pair `kino01_72` and Cindy alone `kino01_71`); `kino0500` (Sandy alone `kino05_70`, Mindy alone `kino05_71`). A per-map flag word records Mindy (bit 2), Sandy (bit 4) and Cindy (bit 8); the trio launch sets all three plus the "Sisters done" bit (128), the pair sets Mindy and Sandy, Cindy alone sets Cindy, and the done bit is set when all three are. The same warp to room 223 follows when the eight Dark Aeons are all done. [bytes]

### 2.5 Starting gauges and what is on the field at the start [run]

| Formation | Dark Aeon gauge at the start (current / maximum) | Bar shown | Dog / extras |
|---|---|---|---|
| `nagi05_70` to `_74` | Dark Yojimbo 0 / 100 (no write; the monster setup writes 0 [note: re-ffx-ai-evrae-yojimbo-isaaru-sin.md 3.1]) | yes | the dog is on the field, not targetable, no turns |
| `kino00_70`, `kino01_70` | **Mindy 100, Sandy 100, Cindy 100** (each script writes 100), maximum 100 | yes | none |
| `kino01_71`, `kino01_72`, `kino05_70`, `kino05_71` | 0 / 100 for each Sister present | yes | none |

Each of the four Dark rows also writes one unmapped property (number 296): 300 for Dark Yojimbo, 100 for Dark Cindy, 200 for Dark Mindy, none for Dark Sandy (Cindy and Mindy write it in every battle id; the number is unmapped in every checked note). Other setup writes are presentation only (hit-reaction dullness off, a "returns before the death animation" property, death animation: boss for Dark Yojimbo, "fiend" dissipation for the Sisters, model scale 1.3 for Cindy and 1.2 for Sandy). [bytes] [run]

### 2.6 Recommendation, with the numbers per option (the driver decides)

All turn counts below are the enemy's own turns; **an enemy turn is 9 ticks** (AGI 185 to 243 gives tick speed 3, every move has rank 3) and an enemy's first action is at tick 0. A player-side aeon of AGI 30 to 34 (tick 8) acts every 24 ticks, AGI 42 every 21 [note: feasibility note 5.5 for the minima; re-ffx-ctb-status.md 2]. The "player actions" figures come from an arithmetic timeline (one player aeon acting every 24 ticks from tick 24, each of its actions reaching the enemy once as one hit event, the enemy first acting at tick 0). [inferred arithmetic on [run] gauge rules]

**Act 1, Dark Yojimbo (HP 1,600,000 in every tier; only the gauge step differs):**

| Tier (formation, stage) | Gauge per own turn | First Zanmato (his turn / tick), no hits | Period (turns / ticks), no hits | With one player aeon acting every 24 ticks (+2 per hit) | Reading |
|---|---:|---|---|---|---|
| 1 `nagi05_70`, 1080 | +6 | 18th turn / tick 153 | 17 turns / 153 ticks | 16th turn / tick 135, after 5 player actions; then every 15 turns / 135 ticks (5 to 6 actions) | gentlest; the only tier whose script also writes Ambushed |
| 2 `nagi05_71`, 1066 | +10 | 11th / tick 90 | 10 / 90 | 11th / tick 90, after 3 actions; then every 10 turns / 90 ticks (4 actions) | **recommended default** |
| 3 `nagi05_72`, 1080 | +16 | 8th / tick 63 | 7 / 63 | 7th / tick 54, after 2 actions; then every 6 turns / 54 ticks (2 actions) | |
| 4 `nagi05_73`, 1066 | +20 | 6th / tick 45 | 5 / 45 | 6th / tick 45, after 1 action; then every 5 turns / 45 ticks (2 actions) | |
| 5 `nagi05_74`, 1066 | +26 | 5th / tick 36 | 4 / 36 | 5th / tick 36, after 1 action; then every 4 turns / 36 ticks (1 to 2 actions) | hardest |

Why tier 2: it leaves about four player actions between Zanmatos, which is the first spacing at which a player can read the gauge and plan; tiers 3 to 5 leave two or fewer; tier 1 is the safe fallback if the chapter scales the enemy's damage up rather than down. The tier sets only the Zanmato spacing; it does **not** change the other two thirds of his turns (Wakizashi on all, Kozuka on one, the dog's bite), which are each a one-hit KO at the game's own numbers (section 6.3). So "not too easy, not too hard" needs a scaling of damage, HP or both that is the chapter's own; the sourced numbers above are the part the game fixes. A Dark Yojimbo turn mix: 33.334% Wakizashi on all, 33.333% Kozuka on one, 33.333% dog order (exact tally over all 65,536 results), except on a turn that starts with the gauge at 100, which is always Zanmato. [run]

**Act 2, the Sisters:**

| Formation | Enemies (HP) | Start gauges | What happens first | Cadence |
|---|---|---|---|---|
| `kino05_71` Mindy alone, `kino05_70` Sandy alone, `kino01_71` Cindy alone | 2,000,000 / 2,500,000 / 3,000,000 | 0 | five basic turns (Mindy: Passado or Calamity; Sandy: Razzia or Attack; Cindy: Camisade or 0x412B), each +20 | **Mega Graviton on her 6th turn (tick 45)**, then every 6 turns / 54 ticks; each player action reaching her adds +5, which does not change the first one for a single aeon and moves the second to the 11th turn for three acting aeons |
| `kino01_72` Mindy and Sandy | 4,500,000 together | 0 and 0 | the two cycle independently, both on the same 9-tick beat: Mindy acts first, then Sandy | both reach Mega Graviton on their 6th turn (tick 45), then every 6 turns |
| `kino00_70` / `kino01_70` trio (the faithful mirror of three Sisters against three Sisters) | 7,500,000 together | **100, 100, 100** | **normal or ambush start (87.5 percent): Mindy and Sandy attack (their gauges stay at 100), then Cindy's first turn is Delta Attack on the whole front line, all inside the first 9 ticks and before any party-side aeon acts**; preemptive start (12.5 percent): the party acts first | after Delta Attack the three gauges are 0 and refill at +20 per turn: round 7 is Mindy and Sandy attacking at 100 and **Cindy's second Delta Attack**, then every 6 rounds / 54 ticks; no Mega Graviton while the three stay in step (hits add +5 each and can break the step; section 5.4) |
| trio with the gauges started at **0** (not a game formation: the scripts read the battle id, so the chapter would use the trio's battle id and write the three gauges to 0 after the setup) | 7,500,000 | 0, 0, 0 | five rounds of three basic turns (+20 each); round 6: Mindy and Sandy attack (gauge held at 100) and **Cindy uses Delta Attack at tick 45** | the gauges refill at +20 per turn, so the next Delta Attack is Cindy's 7th turn (6 rounds / 54 ticks after the first) and Delta Attack repeats every 6 rounds; Mega Graviton does not fire while all three live and stay in step, but each hit event adds +5, so a Sister hit more often than the others reaches 100 first and, with the other two below 100, uses Mega Graviton and drops out of step |

Advice: the pair `kino01_72` is the best fit for "not too easy, not too hard" as a game-sourced formation: two enemies, no Delta Attack, and a Mega Graviton on turn 6 that the player can see coming on the visible gauge. If the chapter must show three Sisters against three, the faithful trio is a wipe at its opening in 87.5 percent of normal starts at the game's own numbers (Delta Attack is the third enemy action), so it needs either the gauges started at 0 (above) or the Sisters' damage scaled; the first is the smaller departure from the game's data and keeps the signature move (Delta Attack at tick 45, after five rounds in which the player acts about twice per aeon). Killing one Sister disables Delta Attack for the rest of the trio fight, which is the player's counterplay and is worth keeping. Which Sister to kill first: Cindy (3,000,000 HP) is the only one who can throw Delta Attack, but the trio test also fails if Sandy or Mindy is dead, so the smallest HP (Mindy, 2,000,000) is the cheapest way to switch it off; Cindy dead also switches it off. [inferred from the scripts [run]; arithmetic [inferred]]

*Sections 3 to 8 (the engine facts, Dark Yojimbo's AI, the Sisters' AI, every move row, what is not proved) follow in the next commits of this branch.*
