# FFX Dark Yojimbo, the Dark Magus Sisters, Penance and the aeon summon rules: a feasibility read from the game's own files

**Game case: FFX only.** The Dark Aeons, Penance, the player's Yojimbo and the Magus Sisters exist only in FFX (the HD Remaster carries the International content); FFX-2 has none of these and nothing here applies to it. Part of the `re-parity` track. Drafted 2026-10-15. Records and formation rows only, no full AI decode; no engine, data or AI code was changed.

**Source and tags.** Every statement is tagged:

- **[bytes]** read from the game's own file by a script of this lane (FFX_Data.vbf of the Steam build 25501027, files extracted read-only and kept outside the repo). A script's behaviour read from its disassembly is also [bytes]; no hook was run.
- **[note: X section]** taken from a checked note: a note in this repo (`research/...`) or one of the private coverage notes kept outside the repo (FFX-G08 aeon-side logic, FFX-G10 battle entry and hand-off, FFX-H02 monster, loot and formation layouts).
- **[inferred]** not read directly. Fields no note maps are given raw and never guessed (AGENTS.md hard rule 6).

Files used (size in bytes, SHA-256 prefix): monster files `m340` Dark Yojimbo (50,840, 82da17d4), `m341` Dark Cindy (55,592, 53cac21e), `m342` Dark Sandy (53,176, 58012d66), `m343` Dark Mindy (47,912, db183406), `m344` Penance (147,076, 54ebc070), `m345` Right Arm (20,824, 52d063e2), `m346` Left Arm (20,756, 4435d129), the possessed rows `m169` (51,084, ad2a5014), `m178` (56,532, 6bc2346e), `m179` (53,388, 563e0bcd), `m180` (47,764, 412046b6); formations `nagi05_70` to `_74` (7,156 / 6,900 / 6,900 / 6,900 / 7,028; 3a0b0a26, aa7c1276, d746a6d5, 03f837ca, 58dd948f), `kino00_70` (7,780, ba2a0b01), `kino01_70` to `_72` (7,396 each; e82fb469, f7d54c35, 140500fa), `kino05_70` (7,396, 9bffc1aa), `kino05_71` (7,972, 25e4c5aa), `hiku15_70` (12,872, ebce783b); kernel tables `btl.bin` (4,096, c4e27912), `monster2.bin` (17,717, d39a5a09), `monster3.bin` (35,867, 7978736a), `monmagic1.bin` (31a83925), `monmagic2.bin` (455be7f0), `a_ability.bin`; field events `nagi0500` (79,296, b2a53ecd), `kino0000` (115,392, d3178365), `kino0100` (114,112, 8e120aec), `kino0500` (88,704, 118fda05), `sins0700` (55,296, c4221df7). Move, item and ability names are the English names of the game's own tables (the US text copy of the same rows). No script text, decompiled code or game dialogue is reproduced; scripts are described only by what they do to the battle.

## 0. The one-screen summary

- **They exist.** Dark Yojimbo (m340), Dark Cindy (m341), Dark Sandy (m342), Dark Mindy (m343) are ordinary monster files with kernel rows, loot rows and formations; so are the other Dark Aeons (m334 Valefor, m335 Ifrit, m336 Ixion, m337 Shiva, m338 Bahamut, m339 Anima) and Penance (m344) with two arms (m345, m346). [bytes]
- **Where the files put them.** Dark Yojimbo: map `nagi05`, area key 430, five formations `nagi05_70` to `_74` (battle ids 0x01AE0046 to 0x01AE004A), all launched by the field event `nagi0500`. The Dark Magus Sisters: **not** the Gagazet map. Their formations are in the maps `kino00` (key 220), `kino01` (221) and `kino05` (225), launched by the events `kino0000`, `kino0100` and `kino0500`; the Gagazet map `mtgz01` holds Dark Anima (`mtgz01_70`). [bytes] That `nagi05` is the Cavern of the Stolen Fayth is [inferred] (the same map's event launches the Yojimbo trial formation `nagi05_10`, and the recruitment haggle is the next map's event [note: FFX-G08 3.5]); that `kino` is Mushroom Rock Road is [inferred] (the two Sinspawn Gui fights are `kino02_00` and `kino03_10` [note: FFX-G10 3.3]). No map name here is a game text; they are the file names.
- **Numbers (kernel rows; no record carries a level).**

| | Dark Yojimbo | Dark Cindy | Dark Sandy | Dark Mindy |
|---|---:|---:|---:|---:|
| HP | 1,600,000 | 3,000,000 | 2,500,000 | 2,000,000 |
| MP | 999 | 999 | 999 | 999 |
| STR / DEF / MAG / MDEF | 244 / 210 / 131 / 144 | 175 / 223 / 171 / 105 | 186 / 201 / 207 / 168 | 148 / 187 / 248 / 132 |
| AGI / LCK / EVA / ACC | 243 / 114 / 0 / 255 | 185 / 40 / 0 / 255 | 201 / 80 / 100 / 255 | 233 / 130 / 240 / 255 |
| AP (overkill AP) | 8,000 (10,000) | 10,000 (12,000) | 10,000 (12,000) | 10,000 (12,000) |
| Steal (common / rare) | Stamina Tonic x2 / Elixir | Return Sphere / Elixir | Friend Sphere / Elixir | Teleport Sphere / Elixir |

  All four: overkill threshold 99,999; drop Dark Matter (x1, x2 on an overkill) with the rare slot Master Sphere (x1, x2); gear drop chance 255; no gil; no element affinity of any kind; immune to Death, Zombie, Petrify, Poison, the four Breaks, Confuse, Berserk, Provoke, Sleep, Silence, Darkness and Slow; Threaten cannot land; Shell, Protect, Reflect, the four Nuls, Regen and Haste all land; immune to Scan, the four Distill statuses, Eject, Auto-Life, Doom, Life, Sensor, percentage damage, CTB damage, Slice and Bribe. [bytes] (section 2.)
- **Dark Yojimbo is five fights, not one.** The event launches `nagi05_70`, `_71`, `_72`, `_73`, `_74` in turn, each a fresh 1,600,000-HP Dark Yojimbo; what changes is how fast his Overdrive gauge fills: +6, +10, +16, +20, +26 per own turn (Zanmato on the whole front line at 100), plus +2 per hit he takes. His whole turn is a three-way roll (Wakizashi on all, Kozuka on one, or his dog) unless the gauge is full. Escape and Flee are disabled for all characters and aeons. [bytes] (section 4.1.)
- **The Dark Sisters are six formations.** Three together (`kino00_70`, `kino01_70`, all three gauges start at 100, so the opening move is the joint Delta Attack), Cindy alone (`kino01_71`), Sandy and Mindy (`kino01_72`), Sandy alone (`kino05_70`), Mindy alone (`kino05_71`). Their AI branches on the battle id. Escape and Flee are disabled in all six. [bytes] (sections 3 and 4.2.)
- **Aeon rules, in player terms** (section 5): a summon parks the whole party and puts the aeon in with its own 20-point Overdrive gauge; the three Sisters arrive together as a party of three with three gauges; Combine powers needs all three full and able to act; a dismissal brings the party back and revives a fallen Sister to 1 HP; a wipe (everyone on the aeon side down) does not end the battle, leaves the aeons out for 9 to 31 battles and is not a Game Over. Our engine has the summon and dismiss kernel, but **not** the Sisters wired, nor Yojimbo's hire answer, compatibility, Pay or free attack (section 5.6).
- **(b) The final battle does include Yuna's own Yojimbo and Magus Sisters when she has them.** After Braska's Final Aeon, one field event loops over the aeons in the party, shows the player a menu, removes the chosen aeon from the party and launches that aeon's possession battle (`sins07_00` to `_06` for the aeons 8 to 14, Yojimbo being 14; `sins07_07` for the three Sisters together); the **player picks the order**, not the game. Each possessed aeon copies the stats of the player's own aeon. The possessed rows (`m169` Yojimbo, `m178` to `m180` the Sisters) are placeholders. The repo's Chapter III build leaves Yojimbo and the Sisters out on purpose. [bytes], [note: re-ffx-ai-yunalesca-bfa.md 5] (section 6.)
- **(c) Penance exists:** Penance (m344, 12,000,000 HP, absorbs all five elements, Protect on from the start, which its script turns off when its HP falls below three quarters) with a Right Arm and a Left Arm (m345, m346; 500,000 HP each, also absorb all five elements), formation `hiku15_70` (area key 395, stage 395). Its battle is not launched by a literal id in any of the 377 field events read. (section 7.)

## 1. Where the pieces are

| Piece | Identifier | Tag |
|---|---|---|
| Dark Yojimbo | monster file m340, monster word 0x1154 | [bytes] |
| Dark Cindy / Sandy / Mindy | m341 / m342 / m343, words 0x1155 / 0x1156 / 0x1157 | [bytes] |
| Penance, Right Arm, Left Arm | m344 / m345 / m346, words 0x1158 / 0x1159 / 0x115A | [bytes] |
| Other Dark Aeons (for the census) | m334 Valefor `bsil07_70`, m335 Ifrit `bika03_70`, m336 Ixion `kami03_70` and `_71`, m337 Shiva `mcyt00_70`, m338 Bahamut `dome06_70`, m339 Anima `mtgz01_70` | [bytes] |
| Dark Yojimbo formations | `nagi05_70` to `_74`; area key 430; battle ids 28,180,550 to 28,180,554 (0x01AE0046 to 0x01AE004A) | [bytes], id rule [note: FFX-G10 3.8] |
| Dark Sisters formations | `kino00_70` (key 220, id 14,417,990), `kino01_70` (221, 14,483,526), `kino01_71` (14,483,527), `kino01_72` (14,483,528), `kino05_70` (key 225, 14,745,670), `kino05_71` (14,745,671) | [bytes] |
| Penance formation | `hiku15_70`; area key 395; battle id would be 25,886,790 (0x018B0046) | [bytes] |
| Launching events | `nagi0500` (five launches of Dark Yojimbo, one of the Yojimbo trial `nagi05_10`), `kino0000` (one), `kino0100` (three), `kino0500` (two) | [bytes] |
| Where the records live | monster file chunk 2 (0x80 bytes, byte-identical from 0x14 to 0x7F to the kernel row and to the English copy in chunk 6, checked for all eleven files), chunk 4 loot (0x118 bytes plus a tail), chunk 0 AI | [bytes], layout [note: FFX-H02 3.1] |
| Area census | 8 Dark Aeon groups in 11 formation files plus Penance; each listed only as a zone with weight 0 in `btl.bin`, so none can be rolled as a random encounter | [bytes] |

No monster record carries a level (the Zanmato byte at loot +0x112 is the only graded field; it is 4 for all four Dark rows and 5 for Penance and both arms) [note: re-ffx-biran-yenke.md 1].

## 2. The monster records (a)

Offsets are record offsets. Where a column is missing the four rows are identical.

| Field | Dark Yojimbo m340 | Dark Cindy m341 | Dark Sandy m342 | Dark Mindy m343 | Tag |
|---|---|---|---|---|---|
| HP / MP / overkill threshold | 1,600,000 / 999 / 99,999 | 3,000,000 / 999 / 99,999 | 2,500,000 / 999 / 99,999 | 2,000,000 / 999 / 99,999 | [bytes] |
| STR / DEF / MAG / MDEF | 244 / 210 / 131 / 144 | 175 / 223 / 171 / 105 | 186 / 201 / 207 / 168 | 148 / 187 / 248 / 132 | [bytes] |
| AGI / LCK / EVA / ACC | 243 / 114 / 0 / 255 | 185 / 40 / 0 / 255 | 201 / 80 / 100 / 255 | 233 / 130 / 240 / 255 | [bytes] |
| Flags +0x28 / +0x29 | 0x1E / 0x07 | same | same | same | [bytes] |
| Poison damage byte (+0x2A) | 25 | same | same | same | [bytes] |
| Elements absorb / immune / resist / weak (+0x2B to +0x2E) | 0 / 0 / 0 / 0 | same | same | same | [bytes] |
| Automatic statuses (permanent, counter, extra) | none, none, none | same | same | same | [bytes] |
| Extra-immunity word (+0x4E) | 0x432F | same | same | same | [bytes] |
| Command list (+0x50) | 0x410A Zanmato, 0x4107 Kozuka, 0x4108 Wakizashi, 0x4109 Wakizashi, 0x410B Daigoro | 0x4106 Delta Attack, 0x4105 Mega Graviton, 0x4101 Camisade, 0x412B (the name table shows a placeholder, "Extra 44") | 0x4106 Delta Attack, 0x4105 Mega Graviton, 0x4100 Razzia, 0x4127 Attack | 0x4106 Delta Attack, 0x4105 Mega Graviton, 0x4102 Passado, 0x4104 Calamity | [bytes] |
| Forced action (+0x70) / monster index (+0x72) | none / 340 | none / 341 | none / 342 | none / 343 | [bytes] |
| Model word (+0x74) | 0x3008 | 0x3009 | 0x300A | 0x300B | [bytes] |
| CTB icon (+0x76) / Doom counter (+0x77) / Arena index (+0x78) | 21 / 255 / 255 | 20 / 255 / 255 | 20 / 255 / 255 | 20 / 255 / 255 | [bytes] |
| Word at +0x7A (sound bank, by the layout note) | 0x1120 | 0x1122 | 0x1121 | 0x1123 | [bytes]; the values equal the monster words of the player-side rows m288, m290, m289, m291 [inferred link] |
| Unmapped: +0x00 to +0x13 (text offsets) | 00 00 ad 00 0e 00 49 00 16 00 33 00 1b 00 57 00 24 00 33 00 | 00 00 76 00 0a 00 49 00 12 00 33 00 17 00 57 00 20 00 33 00 | 00 00 78 00 0a 00 49 00 12 00 33 00 17 00 57 00 20 00 33 00 | 00 00 75 00 0a 00 49 00 12 00 33 00 17 00 57 00 20 00 33 00 | [bytes] |
| Unmapped: +0x79, +0x7B to +0x7F | 00, then 00 00 00 00 00 | same | same | same | [bytes] |

**What the flag bytes say.** +0x28 = 0x1E: bit 1 immune to percentage damage, bit 2 immune to Life, bit 3 immune to Sensor, bit 4 the second-Scan immunity; **not** armored and not immune to physical, magic or HP damage. +0x29 = 0x07: immune to CTB damage, Slice and Bribe. +0x4E = 0x432F: Scan, Distill Power, Distill Mana, Distill Speed, Distill Ability, Eject, Auto-Life, Doom. Layout [note: FFX-H02 3.1]. [bytes]

**Status bytes** (255 immune; otherwise the move's chance minus the byte; Threaten's byte is a success percentage, so a byte of 0 can never land [note: re-ffx-biran-yenke.md 2]). Identical in all four: 255 for Death, Zombie, Petrify, Poison, Power Break, Magic Break, Armor Break, Mental Break, Confuse, Berserk, Provoke, Sleep, Silence, Darkness, Slow; 0 for Shell, Protect, Reflect, Nul-Tide, Nul-Blaze, Nul-Shock, Nul-Frost, Regen, Haste; Threaten 0. [bytes]

**Overkill.** The threshold field is 99,999 in all four. How the engine uses it is [note: research/ffx-evrae-airship.md, "overkill threshold on the killing blow"]; with the in-game per-hit cap at 99,999 (the Dark rows' own moves carry the cap-99,999 flag), an overkill needs the killing blow to exceed what is left by the whole threshold, so it looks effectively unreachable [inferred]. The overkill AP and drop columns exist and are given below. [bytes]

**Loot rows** (chunk 4; layout [note: FFX-H02 3.1, 3.5]). Identical unless a cell says otherwise:

| Field | Value |
|---|---|
| Gil | 0 |
| AP / AP on overkill | Dark Yojimbo 8,000 / 10,000; each Sister 10,000 / 12,000 |
| Learned-move word (+6) | 0 (nothing to learn) |
| Item chance bytes (slot 1 / slot 2) / steal chance / gear chance | 255 / 0 / 255 / 255 |
| Normal drop, slot 1 | common Dark Matter x1, rare Master Sphere x1 (rare when the second draw's low byte is below 0x20, 1 in 8) |
| Overkill drop, slot 1 | Dark Matter x2, Master Sphere x2 |
| Steal (common x quantity / rare x quantity) | Yojimbo: Stamina Tonic x2 / Elixir x1. Cindy: Return Sphere x1 / Elixir x1. Sandy: Friend Sphere x1 / Elixir x1. Mindy: Teleport Sphere x1 / Elixir x1 |
| Bribe | immune (flag +0x29 bit 2), no Bribe item |
| Gear drop | base slot count 18, formula 1, critical bonus 6, power 16, extra-ability tries 20; the ability rows repeat one pair: Yojimbo weapons draw from Break Damage Limit, Counterattack, Magic Counter, Overdrive to AP and armour from Break HP Limit, Curseproof, Ribbon; Cindy weapons from Break Damage Limit, Triple Overdrive, Alchemy, Gillionaire and armour from Break HP Limit, Auto-Phoenix, Ribbon; Sandy weapons from Break Damage Limit, Triple Overdrive, Magic Counter, Evade and Counter and armour from Break HP Limit, Auto-Shell, Ribbon; Mindy weapons from Break Damage Limit, Triple Overdrive, Magic Booster, One MP Cost and armour from Break HP Limit, Auto-Haste, Ribbon (all 14 owner rows hold the same pool; ability names from the game's ability table) |
| +0x110, +0x111 (unmapped) | 128, 128 |
| Pilfer / Nab Gil factor (+0x113) / Monster Arena price (+0x114) | 0 / 0 |

Rewards are rolled once per dead monster [note: FFX-H02 3.5], so each Sister pays her own AP and items; three Sisters killed give three Dark Matter rolls at 255 (always). [inferred arithmetic]

**The moves the records carry** (row ids and fields from `monmagic1`; formula numbers are those of `research/re-ffx-damage.md`; accuracy formula 0 is "always hits" [note: re-ffx-commands.md]; cap 99,999 means the row lifts the 9,999 damage cap; rank is the CTB cost class). All are [bytes]:

| Move (id) | Used by | Type / formula / power / hits | Statuses and notes |
|---|---|---|---|
| Zanmato (0x410A) | Yojimbo's Overdrive | neither-type / 1 / 250 / 1, cap 99,999 | no status; the row has the "cleanses" flag and an Auto-Life extra word; the script aims it at the whole front line |
| Wakizashi (0x4108 one; 0x4109) | Yojimbo | physical / 1 / 32 and 28 / 1, cap 99,999 | no status; 0x4109 is the one the script aims at the whole front line |
| Kozuka (0x4107) | Yojimbo | physical / 1 / 16 / 1, cap 99,999 | Power, Magic, Armor, Mental Break at chance 254 and Slow at 254 (duration 254) |
| Daigoro (0x410B in the record; the script uses 0x4086) | Yojimbo | 0x410B: neither / 1 / 8 / 1; 0x4086: no damage (a presentation row) | 0x410B: Petrify 254 and Poison 254 |
| Delta Attack (0x4106) | all three Sisters | neither / 15 (MAG cube) / 80 / 6 hits, can crit, cap 99,999 | the joint attack; Auto-Life extra word and "cleanses" flag |
| Mega Graviton (0x4105) | all three Sisters | magical / 8 / 7 / 1 | Sleep, Silence, Darkness, Slow at 254 (Sleep and Silence and Darkness duration 99, Slow 254), Doom flag |
| Camisade (0x4101) / Razzia (0x4100) | Cindy / Sandy | physical / 4 / 100 / 1 | no status (Razzia carries the Auto-Life extra word) |
| Attack (0x4127) | Sandy | physical / 1 / 36 / 1, can crit | Petrify 254 |
| Passado (0x4102) | Mindy | neither / 1 / 4 / **15 hits**, can crit | Death 254 on each hit |
| Calamity (0x4104) | Mindy | neither / 3 / 0 / 1 | Poison, the four Breaks, Silence, Darkness at 254 and the Curse flag |
| 0x412B | Cindy (in her list) | physical / 1 / 36 / 1, can crit | Shell, Protect, Reflect, the four Nuls, Regen, Haste at 254 (duration 254) |

Accuracy: every row above except Attack (0x4000, used by Penance) carries accuracy formula 0 (always hit) [bytes]; any later data row for them must therefore set `canMiss: false` (AGENTS.md hard rule 5). Nothing is decided here. Monsters pay no MP [note: re-ffx-ai-seymour.md 1.2].

## 3. The formations (a)

**Formation block** (28 bytes; layout [note: FFX-H02 3.7]) and the battlefield (stage) id from the area table (the zone that lists the formation) [bytes]:

| Formation | Battle id | Monster words (slots 0 to 7) | Block bytes 0 to 3 (voice, byte 1, foot-sound id, in-water) | Stage id |
|---|---|---|---|---|
| `nagi05_70` | 0x01AE0046 | 0x1154 0x1074 | 0, 2, 5, 0 | 1080 |
| `nagi05_71` | 0x01AE0047 | 0x1154 0x1074 | 0, 2, 5, 0 | 1066 |
| `nagi05_72` | 0x01AE0048 | 0x1154 0x1074 | 0, 2, 5, 0 | 1080 |
| `nagi05_73` | 0x01AE0049 | 0x1154 0x1074 | 0, 2, 5, 0 | 1066 |
| `nagi05_74` | 0x01AE004A | 0x1154 0x1074 | 0, 2, 5, 0 | 1066 |
| `kino00_70` | 0x00DC0046 | 0x1157 0x1156 0x1155 | 0, 0, 5, 0 | 1035 |
| `kino01_70` | 0x00DD0046 | 0x1157 0x1156 0x1155 | 0, 0, 9, 0 | 1036 |
| `kino01_71` | 0x00DD0047 | 0x1155 | 0, 0, 9, 0 | 1036 |
| `kino01_72` | 0x00DD0048 | 0x1157 0x1156 | 0, 0, 9, 0 | 1036 |
| `kino05_70` | 0x00E10046 | 0x1156 | 0, 0, 9, 0 | 1036 |
| `kino05_71` | 0x00E10047 | 0x1157 | 0, 0, 9, 0 | 1036 |

Slot 0 is battle actor 20, slot 1 is 21, slot 2 is 22 [note: FFX-G10 3.3]. So in the trio formations **Mindy is actor 20, Sandy 21, Cindy 22**; the second slot of the Dark Yojimbo formations (word 0x1074) is the **Sinscale** file m116 used as a stand-in for his dog, as the possessed-Yojimbo fight does [note: re-ffx-ai-yunalesca-bfa.md 5.7]; the Dark Yojimbo script aims his dog move at actor 21 [bytes]. Byte 1 of the block is 2 in 75 files of the game and is "never 1 in the data" [note: FFX-H02 3.7]; its meaning is not mapped. Every formation lists a zone with weight 0 only (never a random encounter) and a stage id that is not the same for all five Dark Yojimbo tiers (1080 / 1066 / 1080 / 1066 / 1066, two different arenas).

**Rules the formation scripts write** [bytes]:

- Dark Yojimbo (all five): a normal start (`SetAmbushState(Normal)`), **Escape (0x3003) and Flee (0x3018) disabled for all characters and aeons**, random positions off. Nothing else is disabled: **Switch and the summon commands stay available**. The monster script of tier 1 (`nagi05_70`) additionally sets the **ambushed** start for that battle id only (the monster's write lands after the opening counters, so it changes the intro only [note: FFX-G10 3.2]).
- The Sisters (all six): Escape and Flee disabled for all characters and aeons, random positions off; no start-state write (the roll stands). Nothing else disabled.
- No script of these eleven formations or of m340 to m343 ends the battle early (no end-battle call); a battle ends on a win, or on the engine's defeat rule. [bytes]

**Battle flag words in the launching events** [bytes], meaning of the bits [note: FFX-G10 3.6]:

| Fight | Flag word | Reading |
|---|---|---|
| all five Dark Yojimbo launches | 0x1500 | low byte 0: the hand-off requests the results panel; bit 9 (0x200) clear: **a defeat is a game over**; bit 8 (0x100) set: **no victory pose or fanfare**; bits 0x400 and 0x1000 not decoded |
| `kino00_70`, `kino01_70`, `kino01_71` | 0x1800 | low byte 0 (results panel); bits 8 and 9 clear: victory pose plays, a defeat is a game over; bits 0x800 and 0x1000 not decoded |
| `kino01_72`, `kino05_70`, `kino05_71` | 0x1000 | the same without the 0x800 bit |
| every launch | transition 0 (Screen Shatter) | [bytes] |

After a win the events set a progress bit and go on; when the flags for the whole set of Dark Aeons are all set, the last event warps to room 223, which is the map `kino03` in the area table [bytes]. What that room does was not read. [unproved]

**Start positions** (the formation's position table, chunk 3: per area a set of four-float positions x, y, z, w; the first block is the party's three starts, the monsters' by slot, and 12 aeon positions) [bytes]:

| | Party (3 entries) | Monsters by slot | Aeon positions |
|---|---|---|---|
| `nagi05_70` and `_74` area 0 (identical) | (25.018, 0, -28.963), (0.061, 0, -35.045), (-21.878, 0, -31.690) | slot 0 Dark Yojimbo (-0.121, 0, 31.575); slot 1 the dog stand-in (19.782, 0, 28.898); slots 2 to 5 listed (-23.419, 0, 43.786), (1.130, 0, 67.232), (9.130, 0, 52.232), (-0.870, 0, 25.232), unused | 12 entries; index 6 (-10.686, 0, -61.414) |
| `kino00_70` and `kino01_70` area 0 | (23.314, 0, -48.214), (3.314, 0, -39.414), (-17.686, 0, -43.414) | slot 0 Mindy (23.314, 0, 31.786); slot 1 Sandy (3.314, 0, 30.586); slot 2 Cindy (-17.686, 0, 36.586) | entries 7, 8, 9 equal the three party positions; the other nine are the single point (-0.866, 0, -45.309) |
| `kino01_71` area 0 | same | slot 0 Cindy (3.314, 0, 30.586) | same |
| `kino01_72` area 0 | same | slot 0 Mindy (13.314, 0, 31.786); slot 1 Sandy (-6.686, 0, 30.586) | same |
| `kino05_70`, `kino05_71` area 0 | same | slot 0 (3.314, 0, 30.586) | same |
| the same files, area 1 (raw) | (8.099, 10, 6.344), (11.099, 13, 9.344), (14.099, 16, 12.344) | five slots all at (-38.901, 2 to 6, 7.344); one aeon position (1.099, 2, -2.656) | |

Reading the aeon positions as indexed by the aeon's actor id minus 8 (so index 6 is Yojimbo and 7 to 9 are Cindy, Sandy, Mindy) fits the three Sisters standing on the three party positions: [inferred]. Which area a battle starts in (area 0 is the default) was not traced. [unproved]

## 4. What the scripts do (words only; not a full decode)

### 4.1 Dark Yojimbo (m340) [bytes]

- **Setup.** His Overdrive bar is shown with a maximum of 100; his body stays on death but cannot be targeted; hit reactions are dull; no write sets his current gauge, so it starts at 0 [inferred from the absence of a write]. One unmapped property (number 296) is set to 300 at battle start. There is no HP or stat write, so every tier starts him at the record's 1,600,000.
- **Turn.** If his gauge is 100 or more: Zanmato (0x410A) on the whole front line, gauge back to 0. Otherwise one roll of the script stream (a value modulo 3; stream 2 [note: re-ffx-ai-yunalesca-bfa.md 1.2]): 0 Wakizashi (0x4109) on the whole front line, 1 Kozuka (0x4107) on the first living front-line character, 2 the dog move (0x4086, the no-damage presentation row) aimed at the second slot.
- **Gauge fill, after each of his own turns.** The amount depends on the battle id: tier 1 (`nagi05_70`) +6, tier 2 +10, tier 3 +16, tier 4 +20, tier 5 +26; capped at 100. A hit event on him adds +2 when the engine's counter-allowed test passes (what the test reads was not traced). So Zanmato comes after about 17 turns in tier 1 and 4 turns in tier 5, with each hit taken shortening it. [inferred arithmetic from the constants]
- **Death.** The script overrides the death animation with his Die command. No other reaction.
- **Why five fights.** The event `nagi0500` launches the five formations in order, each by a different function (a progress variable records which tier was done; the fourth and fifth launches pick the next tier that is not yet done). Each launch has the flag word 0x1500. After the last win a progress bit is set; when all Dark Aeon bits are set a warp to room 223 follows. That each tier is a new full-HP fight is [bytes] (no HP carries over: nothing writes HP); that the player must win each to proceed is [inferred] from the game-over bit. The conditions under which the player reaches each tier's function were not traced. [unproved]

### 4.2 The Dark Sisters (m341, m342, m343) [bytes]

- **Setup.** In the trio formations `kino00_70` and `kino01_70` every Sister's Overdrive bar is shown with a maximum of 100 and **her current gauge is set to 100 (full)**. In the other four formations the bar and maximum are set but no current value. Cindy's unmapped property 296 is set to 100 and Mindy's to 200 in the same branches.
- **Cindy**, in `kino00_70`: if all three Sisters' gauges are 100 or more she zeroes the three gauges and queues Delta Attack on the whole front line. Her script for the other battle ids has a second branch: when her own gauge is 100 or more she uses Mega Graviton on the whole front line (gauge to 0), otherwise a roll between Camisade on a living front-line character and a further branch that was not read.
- **Sandy and Mindy**, in `kino00_70`: the script first tests that all three Sisters are alive and every gauge is 100; only then does it choose, by a one-in-two roll, between two moves (Sandy: Razzia 0x4100 or Attack 0x4127; Mindy: Passado 0x4102 or Calamity 0x4104) and add 20 to its own gauge (capped at the maximum); when the test fails the script continues to later branches (the branches for the other battle ids) that were not read.
- **The AI is battle-id dependent**: the scripts test the battle id (the trio at `kino00_70` / `kino01_70`, then the solo and pair formations) before choosing. The rest of the decision trees (their gauge arithmetic, the Mega Graviton gate, the hit reactions) were not read in full. [unproved]
- For comparison the **possessed** Sisters of the final battle use Cindy: Delta Attack, Drain, Curaga, Camisade; Sandy: Reflect, Haste, Razzia; Mindy: Passado, Flare [note: re-ffx-ai-yunalesca-bfa.md 5.6]; the Dark versions are separate scripts with other moves (Calamity, Mega Graviton, Camisade, Passado).

### 4.3 Related, cheaper opponents in the same tables (for scale only) [bytes]

The player-side aeon rows are monster files too: Yojimbo m288 (HP 33,000, MP 2,000), Sandy m289 (35,000 / 3,000), Cindy m290 (48,000 / 8,000), Mindy m291 (20,000 / 7,000). They are the opponents of the optional aeon contests: `lmyt01_05` holds Belgemine (m250), Yojimbo (m288) and the dog (m266); `lmyt01_07` holds Belgemine with Mindy, Sandy and Cindy; the area is key 446 (map `lmyt01`, stage 1063). The Yojimbo trial formation `nagi05_10` (the chapter formation in [note: FFX-G10 3.3]) holds m249 (a second opponent file), Yojimbo (m288) and the dog (m266). These are the non-Dark versions; their scripts were not read here.

## 5. The aeon summon and dismiss rules for Yojimbo and the Sisters (d), in player terms

Sources: [note: FFX-G08 3 and 5 and 6] (the aeon-side logic, run on the game's own code and script VM) and [note: research/re-ffx-overdrive-steal-aeons.md 1.1, 4.1 to 4.8]. Aeon actor ids: Valefor 8, Ifrit 9, Ixion 10, Shiva 11, Bahamut 12, Anima 13, **Yojimbo 14, Cindy 15, Sandy 16, Mindy 17**.

### 5.1 Summon and arrival

- **One aeon** is summoned by Summon (0x3117) or Grand Summon (0x3118); **the three Sisters** by their own command (0x30FF). [note: re-ffx-overdrive-steal-aeons.md 4.7]
- **Who leaves the field.** Every party member on the active list except the summoner leaves, then the summoner leaves and the aeon takes the summoner's place; the whole party is parked, not removed: its HP, MP, statuses and recovery counters are frozen exactly as they were. [note: FFX-G08 5]
- **The aeon acts next** (its counter is set to 0); an arrival action runs first. [note: FFX-G08 5]
- **The Sisters are a party of three.** Whichever Sister the summon names, all three arrive together in list positions 0 to 2 in the order Cindy, Sandy, Mindy, and each records the summoner. The battle then runs three characters with three turn counters. [note: FFX-G08 5]
- **Availability** of an aeon in the summon menu: HP above 0, its "can be summoned" byte set, not removed for good, recovery counter 0. [note: re-ffx-overdrive-steal-aeons.md 4.7]

### 5.2 Overdrive gauges

- **Each aeon has its own gauge, 20 points wide** (mode 0x13; the party's is 100); an aeon's Overdrive costs the whole 20. Each Sister has her own gauge. [note: re-ffx-overdrive-steal-aeons.md 1.1, 1.8]
- **Gains.** An aeon that takes a hit from a monster gains `base x 18 / its max HP + 1` (a miss counts, healing does not); one that deals a hit with a command that charges the gauge gains `((hp x 16) / ref) / 10 + 1`, uncapped. [note: re-ffx-overdrive-steal-aeons.md 1.3 table, row "0x13 Aeon"]
- **A Grand Summon** fills the aeon's gauge for the summon and puts the old value back on the dismissal. [note: FFX-G08 5]
- **A knocked-out aeon's gauge goes to 0**; only aeons lose their gauge on death. [note: re-ffx-overdrive-steal-aeons.md 1.7]
- **The Sisters' extra changes.** After every finished action the game adds signed bytes to her gauge and to her **motivation** (0 to 100), the amounts set by the action's own script call: typically gauge +1 and motivation +2, Auto-Life +3 / +10, Ultima +5 / +10, Delta Attack 0 / +10; when nothing could be done the Sister loses 5 motivation (Combine powers 10) and rests. [note: FFX-G08 6.3, 6.5]

### 5.3 Orders and Combine powers (the Sisters)

- Eight order commands 0x3124 to 0x312B: free choice, repeat the last command (from the second turn), attack order, plus Cindy's heal-and-big-spell and revive-and-support orders, Sandy's Shell/Protect/Haste order, Mindy's drain order, and **Combine powers** (Delta Attack). [note: FFX-G08 6.1]
- **Combine powers is offered only while all three Sisters are alive, uncursed, able to act (not Petrified, asleep, confused, berserk, provoked, threatened, ejected) and each has a full gauge**; it pays the 20-point gauge on all three; Cindy performs the Delta Attack (0x30EA, rank 5) and the other two take the same target, flags and costs and a counter of `HasteSlow(tick(own AGI) x 5)` (examples: AGI 40 gives 35, AGI 100 gives 20). Delta Attack is the only user of this path. [note: FFX-G08 6.4, 6.6]
- A standing order makes a Sister accept only that command in her searches; the free-choice order clears it. The Sisters' chances depend on their motivation `M`: attack order at `M + 50` out of 256 for Cindy, `M + 150` for Sandy and Mindy, and so on. [note: FFX-G08 6.2, 6.4]

### 5.4 Swapping, dismissing, knocking out

- **Switch (0x3002)** is the same list swap in mode 0, for party members. The notes cover the swap function and the Dismiss and Summon commands but not an aeon menu, so changing from one aeon to another is read as Dismiss then Summon [inferred]. [note: FFX-G08 5]
- **Dismiss** is an action (special kind 3); when it ends each aeon-side member gets its held gauge back, a member at 0 HP is **revived to 1 HP** (this is how a Sister who fell while another stood comes back), and the parked party returns: the summoner as a returning summoner, the others as new arrivals, with **no counter changed on the way back**. [note: FFX-G08 5; re-ffx-overdrive-steal-aeons.md 4.7]
- **Yojimbo's dismissal as his first action** (nothing parsed yet in the battle) costs compatibility 3; **Yojimbo knocked out or Petrified while he is out** costs 10 and is the wipe (below). [note: FFX-G08 3.4]
- **Knocking out one Sister** does not end her side: she stays down at 0 HP with gauge 0, the other two fight on, Combine powers disappears from every menu, and a dismissal revives her to 1 HP. The wipe needs all three down. [note: FFX-G08 5, 6.4; re-ffx-overdrive-steal-aeons.md 4.7]
- **The wipe.** When nobody on the active list is standing while an aeon is out, the battle does **not** end: every member of the aeon side is set to 0 HP with a recovery counter, the aeon is dismissed without the revive, and the party returns; it is **not** a Game Over. [note: FFX-G08 5]
- **Recovery after a wipe.** The counter is set to the aeon's recovery value plus 1: Yojimbo **24** (so 25), each Sister **30** (31); for comparison Valefor 8, Ifrit 12, Ixion 20, Shiva 20, Bahamut 24, Anima 24. It drops by one at the end of each battle; the battle that brings it to 0 saves the aeon at full HP and MP. [note: re-ffx-overdrive-steal-aeons.md 4.7, 4.8]

### 5.5 Yojimbo's own rules (the player's side)

[note: FFX-G08 1, 3, 4] (run on the game's script VM; 0 mismatches):

- **Free attack.** At the start of his normal turns the game draws once (stream 17); he acts on his own when `(draw & 255) < compatibility div 4` (0 of 256 at compatibility 0 to 3, 32 of 256 at 128, 63 of 256 at 255); otherwise the player's menu opens.
- **Pay (0x3123).** The payment becomes a motivation number: `4 x (floor(log2 gil) - 2)` from 8 gil (every doubling adds 4), plus `compatibility div 10`, scaled by the hire answer (0, 1, 2) and by the highest Zanmato byte among the monsters, plus 20 with a full gauge; one six-bit draw is added and the roll decides: under 32 Daigoro, under 48 Kozuka, under 63 Wakizashi (one), up to 79 Wakizashi (all), **80 and over Zanmato**. A monster with a Zanmato byte above 0 and a first roll that is not Zanmato gives a second roll without the penalty whose Zanmato becomes Wakizashi on all.
- **The monster penalty**: for hire answers 0 and 1 the motivation is divided by `L + 1`, `L` the highest Zanmato byte; for answer 2 multiplied by 0.8 (L 0 to 2), 0.4 (3 to 5), 0.267 (6, 7). **All four Dark rows have `L` = 4, Penance and its arms 5** (section 2). [bytes for L; inferred application]
- **Compatibility** (0 to 255): Daigoro -1, Kozuka 0, Wakizashi (one) +1, Wakizashi (all) +3, Zanmato +4, a Pay of 0 gil -20, a first-action dismissal -3, Yojimbo knocked out while out -10. The starting value is not found in the files (open in the note; the community says 128).
- **Hire price and answer.** The recruitment haggle starts at 300,000, 270,000 or 250,000 gil by the first reply, then counters by 20 percent of the gap; the answer (0, 1, 2) stays for the whole game. [note: FFX-G08 3.5]
- **Player-side stats.** An aeon's stats are rebuilt from Yuna's at every battle's end with a minimum by battle count; the last tier (600 battles and over) minima, as HP / MP / STR / DEF / MAG / MDEF / ACC / EVA / AGI: Yojimbo 3,064 / 0 / 61 / 73 / 48 / 69 / 38 / 122 / 30; Cindy 8,410 / 142 / 60 / 94 / 64 / 84 / 20 / 44 / 34; Sandy 6,910 / 103 / 69 / 76 / 73 / 84 / 22 / 38 / 34; Mindy 4,887 / 178 / 50 / 70 / 85 / 84 / 21 / 50 / 42. The Sisters carry Break Damage Limit on their starting gear; Yojimbo does not. [note: re-ffx-overdrive-steal-aeons.md 4.3 to 4.6]

### 5.6 What our engine has for all of this

[note: FFX-G08 9] at `origin/re-parity-rc4`, and a look at `origin/r49-rc` for the files named:

| Piece | State |
|---|---|
| Summon, arrival, dismiss, wipe, Switch kernel (`src/battle/ffx/kernel/aeon-party.ts`, adapter `adapt/aeon-party.ts`, carried out in `aeons.ts`) | Present; matches the game on 18,864 machine operations [note] |
| Joint-action counters (`kernel/aeon-stats.ts`, `summonCtb`) | Present; no caller in `src` (tests only) [note] |
| Three Sisters in one battle | **Not wired**: the engine has one `aeonId`; the three-aeon path of the kernel is never fed [note: FFX-G08 9 D3] |
| Yojimbo's hire answer, compatibility, Pay, free attack, command roll | **Absent** (the catalogue has a Yojimbo entry with four attack ids and Zanmato as the Overdrive) [note: D5]; one command id differs: the all-target Wakizashi is 0x30E1, the data row carries 0x30E0 [note: D6] |
| The Sisters' orders, standing order, motivation, per-Sister menus | **Absent** [note: D8] |
| Builds | No chapter build owns Yojimbo or the Sisters [note: D7]; `dreams-end.ts` leaves them out on purpose and ships their possessed data for a player who owns them (section 6) |
| Dismiss as a queued action; wipe for three | Timing not modelled; the wipe test treats any single aeon KO as a wipe, which is wrong for three Sisters [note: D9, D10] |

## 6. The final battle against Yu Yevon's possessed aeons (b)

### 6.1 How the chain picks and orders the aeons [bytes]

The field event `sins0700` (worker 26) runs after Braska's Final Aeon (`sins06_00`):

1. It reads the set of aeons in the party (`getActiveAeonsBitfield`; actor ids 8 to 15, that is Valefor, Ifrit, Ixion, Shiva, Bahamut, Anima, **Yojimbo (14)** and **the Magus Sisters (15, as one entry)** [note: re-ffx-ai-yunalesca-bfa.md 5.1]).
2. While the set is not empty it shows a message with a choice built from the set; **the player chooses**; the chosen aeon is removed from the party (`removePartyMember`) and a switch on the aeon id (8 to 15) launches that aeon's battle; the set is then read again.
3. For the Sisters (id 15) the event also removes Sandy (16) and Mindy (17), so all three leave together and one battle holds the three.
4. When the set is empty it launches Yu Yevon (`sins07_10`, 0x024B000A) with the flag word 0x10D01.

| Aeon (id) | Battle id | Formation | Flag word 0x10504 destination (room, 21) |
|---|---|---|---|
| Valefor (8) | 0x024B0000 | `sins07_00` | 622 |
| Ifrit (9) | 0x024B0001 | `sins07_01` | 623 |
| Ixion (10) | 0x024B0002 | `sins07_02` | 625 |
| Shiva (11) | 0x024B0003 | `sins07_03` | 624 |
| Bahamut (12) | 0x024B0004 | `sins07_04` | 626 |
| Anima (13) | 0x024B0005 | `sins07_05` | 628 |
| **Yojimbo (14)** | 0x024B0006 | `sins07_06` | 627 |
| **Magus Sisters (15, with 16 and 17)** | 0x024B0007 | `sins07_07` | 629 |
| Yu Yevon | 0x024B000A | `sins07_10` | (flag word 0x10D01) |

Flag word 0x10504: low byte 4 is the "move task" with the two extra arguments as the destination; bit 9 (0x200) clear, so a defeat is a game over [note: FFX-G10 3.6]. No restore call for HP, MP or statuses was found in the three events, so the party's HP, MP and statuses **carry across every link** [note: re-ffx-ai-yunalesca-bfa.md 5.1]. The chain does not require the player to own Yojimbo or the Sisters; **they appear only if Yuna has them in the party**. [note: 5.1]

### 6.2 The possessed rows [bytes], behaviour [note: re-ffx-ai-yunalesca-bfa.md 5.4 to 5.6]

| Row | HP / MP / overkill | STR DEF MAG MDEF AGI LCK EVA ACC | Command list | Notes |
|---|---|---|---|---|
| m169 possessed Yojimbo | 169 / 1 / 169 | 7 0 0 0 0 0 2 10 | 0x60CF Death, 0x60EC "Possessed by Yu Yevon" | Doom counter 10, CTB icon 14, Zanmato byte 2 |
| m178 possessed Cindy | 2,000 / 1 / 2,000 | 1 1 1 0 1 0 1 0 | 0x60EF Death, 0x60EE "Possessed by Yu Yevon" | Doom counter 3, CTB icon 21, Zanmato byte 3 |
| m179 possessed Sandy | 2,000 / 1 / 2,000 | 1 0 0 0 0 0 0 0 | same | the same |
| m180 possessed Mindy | 2,000 / 1 / 2,000 | 1 0 0 0 0 0 0 0 | same | the same |

All four: no loot (gil, AP, items, steal and gear chances 0); immune to Death, Zombie, Petrify, Poison, the four Breaks, Confuse, Berserk, Provoke, Sleep, Silence, Darkness and Slow; Shell, Protect, Reflect, the Nuls, Regen, Haste land; extra immunity word 0x4301 for Yojimbo and the Sisters (Scan, Eject, Auto-Life, Doom); no element affinity. [bytes] These rows are **placeholders**: at the start of each battle the script copies the **player's own aeon's** STR, DEF, MAG, MDEF, AGI, EVA, ACC and max HP into the possessed actor (Yojimbo from actor 14; the Sisters from actors 15, 16, 17), sets HP to that maximum, and uses the aeon's name. [note: re-ffx-ai-yunalesca-bfa.md 5.4, 5.6] So the strength of the possessed Yojimbo and Sisters follows how the player built them.

The moves they use, from the move rows [bytes] and the script reading [note: 5.5, 5.6]:

- **Possessed Yojimbo.** Each turn Kozuka (0x60E0) or Wakizashi (0x60E1) at 50/50, never Attack; both formula 1, power 14, can crit, pierce Armored. His Overdrive at 100 is Zanmato (0x60E2: formula 6, power 200, whole front line), added to his list at battle start. His dog stand-in is a Sinscale model in actor 23 that the script hides after his first turn; its Daigoro branch cannot be reached. Gauge on his own turn +0 to 9; on a hit +0 to 9, with Power Wave +5 to +14 instead of +15 to +33.
- **Possessed Sisters** (one battle with the two Yu Pagodas and the dummy Nishida actor): Cindy Delta Attack (0x60E6: formula 15, power 10, 6 hits, front line) when all three gauges are 100 or more, else Drain on the highest-HP front-line actor if her HP is below two thirds, else Curaga on a Sister at or below 50 percent, else Camisade (0x60E3, formula 1, power 21); Sandy Reflect on Cindy, Haste on a Sister without it, or Razzia (0x60E4, power 21); Mindy Flare or Passado (0x60E5, formula 1, power 2, 15 hits). Each Sister's gauge gains 10 to 19 per hit and about 40 to 58 from a Power Wave. [note]
- **Opening order.** The possessed actor gets First Strike and CTB 0, both Pagodas CTB 24; in the Sisters' battle only Cindy gets First Strike and CTB 0. Party and reserves CTB +1. [note: 5.3]

### 6.3 What the repo ships for this

- `src/data/ffx/builds/dreams-end.ts` on `origin/r49-rc`: the build is the Chapter III Dream's End party (Tidus, Yuna, Auron); its aeons array is the five mandatory aeons only, and its header states that **Anima, Yojimbo and the Magus Sisters are intentionally absent** ("assume absent for the default preset") although their possessed-aeon data ships for a player who owns them. [bytes of the repo file]
- `src/data/ffx/enemies/braskas-final-aeon-abilities.ts` on `origin/r49-rc`: possessed ability records exist for Yojimbo (`possessed-yojimbo-daigoro`, `possessed-yojimbo-zanmato`) and Cindy, Sandy, Mindy (Camisade, Delta Attack, Razzia, Passado). Two of them **differ from the game's rows**: the Yojimbo record is named for Daigoro with power 10 (taken, per its own comment, from `research/ffx-combat-core.md` section 6.3), whereas the files give the possessed Yojimbo Kozuka and Wakizashi (power 14, never the dog) with Zanmato as his Overdrive; and Passado is described there as a 15-hit flurry, which agrees with the rows (power 2, 15 hits). No data was changed here. [bytes] vs [bytes of the repo file]
- The order of the aeon battles in the repo is a fixed acquisition order and the Sisters are three separate battles, against the game's player-chosen order and one three-Sister battle [note: re-ffx-ai-yunalesca-bfa.md 9, rows A1 and A2].

## 7. Penance (c), for size only

**Existence and place.** Penance is m344 with a Right Arm (m345) and a Left Arm (m346) in formation `hiku15_70` (area key 395, map `hiku15`, stage id 395, block bytes voice 0, byte 1 = 0, foot-sound id 8, in-water 0, words 0x1158 0x1159 0x115A). The area lists it as a zone with weight 0 (never rolled). The same map holds the Evrae fight (`hiku15_00`), launched by `hiku1500`. No literal launch of battle id 25,886,790 (0x018B0046) exists in the 377 field events read (20 variant event files of the game's 397 were not read); a raw byte scan finds that constant only in the event file `matu0000`, which the disassembler could not parse, so whether it is a launch there is unknown. How the game starts the Penance battle was not found. [bytes] / [unproved]

| Field | Penance m344 | Arm m345 / m346 (identical rows) | Tag |
|---|---|---|---|
| HP / MP / overkill | 12,000,000 / 999 / 99,999 | 500,000 / 999 / 99,999 | [bytes] |
| STR DEF MAG MDEF AGI LCK EVA ACC | 255 240 255 200 255 10 0 255 | 200 200 150 200 150 10 120 255 | [bytes] |
| Elements absorb / immune / resist / weak | absorb all five (raw 31), others 0 | absorb all five (raw 31) | [bytes] |
| Automatic statuses | counter word 0x10: **Protect on from the start** | none | [bytes] |
| Status bytes | same pattern as the Dark Aeons (immune to the same 15, Threaten 0, the buffs land) | same | [bytes] |
| Flags +0x28 / +0x29 / extra-immunity | 0x1E / 0x07 / 0x432F | 0x1E / 0x07 / 0x032F (no Doom immunity) | [bytes] |
| Doom counter | 255 | 200 | [bytes] |
| Commands | Attack 0x4000, Immolation 0x411F, Obliteration 0x4120, Judgment Day 0x4121, Separation 0x4122, Appearance 0x4123, Death 0x4124 | m345: Attack, Regeneration 0x4125, Atrophy 0x4126, Attack 0x4127, Calamity 0x4104, Mighty Guard 0x412A; m346: Attack, Regeneration, Atrophy, 0x412B, Tera Graviton 0x4129, Slowga 0x3039 | [bytes] |
| AP (overkill AP) | 60,000 (65,000) | 10,000 (12,000) | [bytes] |
| Drop | Master Sphere x3 (x6 on an overkill) in both slots of slot 1 | Dark Matter x1 / Master Sphere x1 | [bytes] |
| Steal | Elixir x1 / Megalixir x2 | Elixir x1 / Elixir x1 | [bytes] |
| Gear drop | chance 255, base slots 24, formula 1, crit 10, power 16, tries 20; weapons draw Break Damage Limit, armour Ribbon | chance 0 (not rolled), rows empty | [bytes] |
| Zanmato byte | 5 | 5 | [bytes] |

**Moves** (rows; formula numbers as in section 2) [bytes]: Immolation formula 1 power 32 with Armor Break and Mental Break at 254; Obliteration formula 1 power 24 with Slow at 254; Judgment Day formula 15 (MAG cube) power 240 at a group; Attack formula 1 power 16 with accuracy formula 2 and byte 90; Separation, Appearance and Death are scene rows with no effect (dead targets allowed).

**What its script does, in one paragraph** (rows only; not a full decode) [bytes]: while its HP is at three quarters of its maximum or more, every turn is Obliteration on the whole front line; the first damaging hit that leaves it below three quarters makes it use Separation on itself, turns its Protect off and its Haste on and sets two shared battle variables the arms can read. After that every turn is Immolation on a random living front-line character, except that Judgment Day goes at the front line once a counter of its turns and the hits it takes reaches 20 and two other shared battle variables both read 0 (what sets them was not traced). At its death it forces its own Death and sets both arms to 0 HP. Escape is **not** disabled by the formation script or by m344 (only `SetAmbushState(Normal)` is written). The formation has no early-end call. In the formation block, byte 1 is 0. Size: three actors (12,000,000 + 2 x 500,000 HP = 13,000,000 HP of targets, the body and arms all absorbing every element), start positions in the table of section 3 style: party (-24.830, -35, 105.859), (-25.616, -35, 82.909), (-28.236, -35, 60.572); Penance (-150.801, 63, 90.078), Right Arm (-145.990, -8, 40.089), Left Arm (-150.678, -8, 138.949); area 1 (raw) party (-35, -35, 40), (-40, -35, 80), (-45, -35, 120), monsters (-370, -35, 80), (-170, -35, 80), (0, 0, 0).

## 8. What this means for choosing the encounter ([inferred]; no build is proposed here)

- **As enemies, the data is complete for Dark Yojimbo and the Dark Sisters.** Rows, loot, formations, start positions, the battle flags and the AI of Dark Yojimbo are small and now readable (three moves, a gauge, five tiers). The Sisters need the rest of three scripts read before they can be reproduced (their gauge arithmetic and per-formation branches).
- **As the player's own aeons, Yojimbo and the Sisters are not in the engine.** A chapter that puts a player Yojimbo and Sisters against a Dark or possessed enemy needs the compatibility / Pay / free-attack rules, the Sisters' three-aeon wiring, orders, motivation and Combine powers built first; the checked note supplies every rule and number for that.
- **Scale.** The Dark rows have 1.6 to 3 million HP; the player-side aeons are capped at 9,999 per hit unless they carry Break Damage Limit (the Sisters do, Yojimbo does not [note: re-ffx-overdrive-steal-aeons.md 4.5]), so Yojimbo needs on the order of 160 capped hits against Dark Yojimbo: [inferred arithmetic].
- **Tie to the chapter order.** The three kinds of encounter have different launch rules: Dark Yojimbo is a five-fight chain with a fixed flag word 0x1500 (no victory pose), the Sisters are single fights with a flag word of 0x1000 or 0x1800 (victory pose), the final battle is a player-ordered chain with a fixed game-over rule.

## 9. What is not proved, and what would prove it

1. **No hook was run.** The three AI programs (m340 to m343, m344) were read as disassembly, not executed; a run in the earlier lanes' Atel interpreter would turn the [bytes] AI lines into run results.
2. **Which tier the player meets first and what unlocks each** (`nagi0500`): the five launches are in five event functions; the conditions that call each function were not traced. Same for the Sisters' six formations (`kino0000`, `kino0100`, `kino0500`).
3. **The starting gauge of Dark Yojimbo** is inferred from the absence of a write; the starting gauge of the Sisters in the non-trio formations is likewise.
4. **The "counter allowed" test** in his hit reaction: what it reads.
5. **Property 296** (set to 300, 100, 200 in these scripts) is unmapped.
6. **How Penance's battle is launched** (no literal id in the 377 events read) and what room 223 holds after the Dark Aeons are done.
7. **The start area (0 or 1)** of each formation and what area 1 is for.
8. **Kernel monster-file equality** was checked for all eleven monster files against the kernel row and the English copy (identical); the Steam build's files were compared with the earlier lanes' copies only by the shared kernel hashes (`btl.bin`, `monmagic1.bin`, `monmagic2.bin` match the earlier note's prefixes).
9. **The Sisters' individual order trees** (free choice and the rest) are read in the checked note [FFX-G08 6.5] but Mindy's long branch was "not worked through" there.
10. Everything tagged [note] is as proved in its own note; none was re-run here.
