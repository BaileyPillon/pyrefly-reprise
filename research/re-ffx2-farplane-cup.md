# FFX-2 Farplane Cup duelists (Auron, Tidus, Seymour and the rest of the Fiend Arena block, rows 308 to 327) read from the game's own files: the rows, the identities, the AI scripts and what is not in the files

**Game case: FFX-2 only.** The duelists are rows of the FFX-2 kernel table `battle/kernel/monster.bin`: Brother 308, Buddy 309, Auron 311, Kimahri 313, Lulu 315, **Tidus 317**, Seymour 319, Baralai 321, Nooj 322, Gippal 323, Garik Ronso 324, Yaibal 325, Lucil 326, Elma 327, each with a "weapon" prop row (310, 312, 314, 316, 318, 320) where it has one. The FFX characters appear here as FFX-2 enemy rows with FFX-2 ability rows; nothing in this note changes an FFX chapter and no FFX number is used.
Written 2026-11-06 by a Sonnet sub-agent of the release driver (the release program's plan, row 38; it also hands rows 42, 47 and 59 their data). **Treeless research: no repo file, no art, no engine or data file is changed; nothing deployed.** The game was not run; no browser, no GPU, no Ghidra. Authority (relayed words, verbatim): 2026-11-06 ~00:30 EST "implement all unimplemented chapters please"; ~00:55 EST "yes on all these too"; 2026-10-31 "you make the executive decisions for the next few days. i'll go with all of your recommendations." Every pick named here is a recommendation, "driver's call, his to overturn".

**What is in this note:** numbers read from the owner's own Steam copy. Monster, item and move names appear only as identifiers (the game's English name tables); no descriptions, dialogue, script lines, decompiled code or raw byte dumps; developer labels are translated in a few words.

**Tags.** **[R]** read from a game file or from the shipped plain-text AI source / compiled script by this note's tools; **[E]** emulated or run (nothing here); **[I]** inferred from the above or from an earlier checked note; **unmapped** the raw value is given and no meaning is claimed (AGENTS.md hard rule 6). Engine rules are taken from the earlier notes and cited `[note: file section]`.

## Summary for the driver

1. **The identities are settled from the files.** Row **317 is Tidus**: its developer symbol is "Enemy Tidus", the next row (318) is named "Tidus' Weapon", and the game's own voice setup for the arena fighters (a block of the system scene `system_01`) lists Brother, Buddy, Shinra, Auron, Kimahri, Lulu and Tidus together. The name field of row 317 is four bytes of 0x4f that our text decoder does not map; the same four bytes name row 280 (a Lv 1, 82 HP actor), so I read it as a hidden-name placeholder (the game shows a masked name) [I]. Rows 321 to 327 carry the developer tag the game uses for **post-clear versions** (the tag appears on rows 321 to 328 and on a run of rows from 341, the stronger copies of ordinary monsters): Baralai, Nooj, Gippal, Garik, Yaibal, Lucil, Elma are the cup versions of the Youth League/Crimson Squad people, not new characters. Row 328 (a second Trema row, Lv 99, 999,999 HP, tagged "Bevelle's strongest boss, post-clear") and 329 (Shinra) follow the block.
2. **The cup rows are used by no formation in the archive.** `btl.txt` (2,041 formation rows) never names rows 308 to 333; no scene package of the 2,542 scanned lists them (only `system_01`, the voice setup); the 669 event packages carry no instance that reads as a launcher (the ids appear by chance in the large dungeon packages). **How the game starts a cup duel is therefore not in the data tables I could read**; the likely cause is that the International/HD arena builds its formation from the executable or from a table I did not identify. This does **not** block a chapter: each duelist is a self-contained record plus a script, and a fixed single-fighter formation is all a chapter needs. It does mean **the cup's rounds, order, rewards and recruiting (Tidus and Auron "can join" in the wiki) are wiki-level only** and are not sourced here.
3. **The AI is small and exactly readable** (section 6). All 14 sources equal their compiled workers in command-id set and random moduli (checked by `cmp-src-bin.mjs`; the normal script is worker 1 of each package, worker 0 an unused Oversoul copy). Auron: a six-way draw (Shooting Star, Dragon Fang, Full Break, else Attack) that widens below a quarter of his HP; one X-Potion below an eighth. Tidus: **opens with Blitz Ace (9 hits)**, then keeps himself hasted with Hastega, and otherwise draws among Attack, Spiral Cut, Delay Buster (and a Blitz Ace again after more than four counted actions). Seymour: an eight-way draw of party spells (Demi, Black Sky, Meteor, Slowga, Dispel, Ultima, Confuse, a Shell/Protect/Break ladder, Magic and Strength Up).
4. **The FFX Overdrives are ordinary enemy ability rows** (the plan's "boss-side Overdrives of FFX characters in the ATB engine" open item): Auron's **Shooting Star 0x4208, Full Break 0x4206, Dragon Fang 0x4207**; Tidus's **Blitz Ace 0x4205, Spiral Cut 0x4203**; Seymour's **Meteor 0x4221, Slowga 0x421e**; Kimahri's **Jump 0x420d, Sunshine 0x420e, White Wind 0x4217, Mighty Guard 0x4218**; Lulu's **T. Fire/Blizzard/Thunder/Water 0x4209 to 0x420c**. They are rows of `monmagic.bin` that the existing enemy-command machinery reads; **no new engine kind is needed**, only data rows and scripts (section 9). Delay Buster (0x3070), Hastega (0x3177), Shin Zantetsu (0x3078), Fireworks (0x3076) are party rows (`command.bin`) that the scripts queue on the enemy side.
5. **The block is an endgame set.** Levels 55 to 75, HP 62,000 to 223,400, every record has the full ailment wall (Death through Eject at 255, Stop, Slow, Doom) and most carry Spellspring (Use MP 0, slot 13). **Lulu absorbs all six elements** (Fire, Ice, Thunder, Water, Gravity, Holy) and carries a permanent Reflect; **Brother absorbs the four elements; Buddy nulls them and Gravity; Seymour absorbs the four and Gravity and is weak to Holy.** The right party is the repo's Level 99 line (`src/data/ffx2/builds/via-infinito.ts`, sourced), not a Chapter 5 build.
6. **Size.** Row 38's three duels (Auron, Tidus, Seymour) are what the plan prices. The files make them cheaper in research and about as expensive in build as planned (three scripts of 3.4 to 4.2 KB, no new mechanic). The same note holds **everything rows 42, 47 and 59 need** (Yaibal/Lucil/Elma 325 to 327 and 183 to 185 are in rows 42; Garik 324 in row 47; Brother, Buddy, Kimahri, Lulu in row 59): their research (R) is already done by this note and can be struck from those rows.
7. **One thing that changes PLAN.md outside this row (section 8):** rows **334 to 336** ("Iutycyr Boss Body/Pod/Tail", HP 1) are not Last Mission; the AI sources call them "Enemy Yadonoki body / pod / tail" and the symbols are `Yadonoki boss body/pod/tail`, the same family as the four heads of rows 330 to 333 (**Unum, Duo, Tria, Quattour = Major Numerus**). They are the **seven-part Major Numerus** (4 heads + body + pod + tail). Plan row 63 ("Last Mission research first") is therefore mis-aimed; Major Numerus's real size is row 53's, and the Last Mission data is the separate `lastmiss/kernel/lm_monster.bin` table.

## 0. Result in one screen

| Row | Id | Name (the game's table) | Lv | HP | MP | AGI | Plan row |
|---:|---|---|---:|---:|---:|---:|---|
| 308 | 0x1134 | Brother | 71 | 89,500 | 0 | 193 | 59 |
| 309 | 0x1135 | Buddy | 66 | 76,200 | 0 | 184 | 59 |
| **311** | 0x1137 | **Auron** | 74 | 187,500 | 999 | 141 | **38** |
| 313 | 0x1139 | Kimahri | 70 | 223,400 | 999 | 137 | 59 |
| 315 | 0x113b | Lulu | 71 | 69,800 | 999 | 152 | 59 |
| **317** | 0x113d | **(masked name) = Tidus** | 73 | 136,200 | 257 | 224 | **38** |
| **319** | 0x113f | **Seymour** | 67 | 145,500 | 999 | 159 | **38** |
| 321 | 0x1141 | Baralai | 73 | 125,000 | 999 | 162 | 38 (block) |
| 322 | 0x1142 | Nooj | 75 | 178,000 | 999 | 156 | 38 (block) |
| 323 | 0x1143 | Gippal | 72 | 134,700 | 999 | 152 | 38 (block) |
| 324 | 0x1144 | Garik Ronso | 67 | 88,000 | 860 | 177 | 47 |
| 325 | 0x1145 | Yaibal | 55 | 64,400 | 85 | 194 | 42 |
| 326 | 0x1146 | Lucil | 63 | 71,000 | 999 | 184 | 42 |
| 327 | 0x1147 | Elma | 58 | 62,000 | 384 | 201 | 42 |

Props (HP 1, no action): 310 Buddy's Weapon, 312 Auron's Weapon, 314 Kimahri's Weapon, 316 Lulu's Weapon, 318 Tidus' Weapon, 320 Seymour's Weapon [R]. Source: `monster.bin` rows at file offsets 0xf0c0 (308) to 0xff98 (327) [R: `rows.mjs`, `dump-rows.mjs`]. **Plan row 38 says "Baralai/Nooj/Gippal row321 to 323" belong to the block: they do, and they are cup-strength copies of the Den of Woe shades; the plan assigns them to no chapter, see section 8.**

## 1. Source block

| Item | Value |
|---|---|
| Archive | `FFX2_Data.vbf` (Steam HD Remaster, FFX-2 half, build 25501027) read with our node VBF reader, unpacked only into a research scratch folder outside the repo by the row-37 archive reader (read-only) |
| Kernel tables [R] | the same hashes as `re-ffx2-fallen-maesters.md` section 1: `monster.bin` (96,596 bytes; 50964278e7b164e6), `monster2.bin` (87,842; 9327e6571d2f92ac), `monmagic.bin` (85,222; 35b432bbbec34bac), `command.bin` (90,359; 6099fcff08194360), `item.bin` (12,748; e7896df7ac6650bf), `btl.txt` (781,815; a2a9d7e0a28559f7), English copy `new_uspc/battle/kernel/monster.bin` (119,716; 1831faed8e5c6f5b) |
| AI sources [R] | `battle/mon/m308.src` (1,654 bytes; e9516c77b5738558), `m309.src` (2,324; 2a6f6beb7b67b3d1), `m311.src` (3,477; 6ebea61008015564), `m313.src` (4,759; c2f78c22af1a1e46), `m315.src` (3,991; bbb96c908e86d62f), `m317.src` (3,425; 9065a864de6973d4), `m319.src` (4,223; 391f7c38b4a7bd78), `m321.src` (3,246; f203d5d6a7cd4e4e), `m322.src` (2,319; 9aafe641f3b27c26), `m323.src` (2,708; 49355d686e04751f), `m324.src` (2,203; 93375d2a51581570), `m325.src` (3,506; 83f4425a58cbf1a7), `m326.src` (3,430; 1081361a3e217d75), `m327.src` (2,388; 84da47642f68ebb2); weapon props `m310`, `m312`, `m314`, `m316`, `m318`, `m320` (about 980 bytes each: they switch the actor's action, cursor and battle presence off) |
| Compiled packages [R] | `battle/mon/_mNNN/mNNN.bin` for all of them (e.g. `_m311` 51,104 bytes, 4368be742a88ee3a; `_m317` 59,328, 95b554eb4470d09d; `_m319` 57,136, 691b41746e3a7649); **worker 1 is the normal script, worker 0 the Oversoul copy** (unused: these rows' Oversoul type is 0) |
| Scene voice setup [R] | `battle/btl/system_01/scn_system_01.src` (538,303 bytes): ability-voice macros for the arena fighters (Brother, Buddy, Shinra, Auron, Kimahri, Lulu, Tidus); read for names only |

**Checks:** for each of the 14 sources the set of queued command ids equals the set in compiled worker 1, the `random() % n` moduli are equal (308: 4; 309: 7 and 8; 311: 6 and 8; 313: 2 and 8; 317: 4; 319: 8; 321: 6; 323: 2 and 5; 324: 4 and 6; 325: 3; 327: 6) and no source names a scene constant (these scripts test no scene) [R: `cmp-src-bin.mjs`].

## 2. How the rows were identified

1. **The English name table**: rows 308, 309, 311, 313, 315, 319, 321 to 327 decode to Brother, Buddy, Auron, Kimahri, Lulu, Seymour, Baralai, Nooj, Gippal, Garik Ronso, Yaibal, Lucil, Elma; no other row carries these exact rows' stats [R].
2. **Row 317** by three witnesses: (a) the developer symbol list `monster.ath` names the slot "Enemy Tidus" (the neighbours are "Enemy Auron", "Enemy Kimahri", "Enemy Lulu", "Enemy Seymour"); (b) row 318's English name is "Tidus' Weapon"; (c) the script title reads "Enemy Tidus thinking" and its moves are Tidus's FFX techniques (Blitz Ace, Spiral Cut, Delay Buster) [R]. The name field of row 317 itself is `<4f><4f><4f><4f>` in our decoder (four identical unmapped bytes). **This settles the plan's "inferred identity".**
3. **The cup tag.** Rows 321 to 328 and 341 to 354 carry a developer suffix ("clear-clear") that I read as "after the game is cleared": stronger copies placed after the original rows [I]. The block is: 308 to 320 the five arena fighters and their props, 321 to 327 the post-clear Youth League people, 328 Trema, 329 Shinra, 330 to 336 the Numerus parts (section 8).
4. **Weapons.** Each prop row's script sets "action off, cursor off, exists off, in-battle off" and is linked to its owner by the owner's script (`setchrlink ... weapon`): the props are visual only, not targets [R].

## 3. Column map

As in `re-ffx2-fallen-maesters.md` section 3 (+0x08 HP ... +0x1a special word, +0x1c to +0x1f absorb, null, half, weak, +0x20 and +0x38 resist bytes, +0x50 and +0x54 automatic-status masks, +0x70 ability list, +0xac drops, +0xb4 steals, +0xbc bribe). Special-word bits: 0 ratio, 1 damage-not-stop, 3 and 4 unnamed in the game's header, 6 no ATB damage, 7 disable-Zantetsu, 8 Bribe, 9 magic-cancel (immune to Interrupt).

## 4. The rows (`monster.bin`)

### 4.1 Numbers (the three named duelists, then the rest in short)

| Field | **Auron (311)** | **Tidus (317)** | **Seymour (319)** |
|---|---:|---:|---:|
| File offset of the row | 0xf318 | 0xf7c8 | 0xf958 |
| Level | 74 | 73 | 67 |
| HP / MP | 187,500 / 999 | 136,200 / 257 | 145,500 / 999 |
| STR / DEF | 199 / 198 | 188 / 173 | 156 / 102 |
| MAG / MDEF | 196 / 121 | 152 / 158 | 221 / 238 |
| AGI / ACC / EVA / LCK | 141 / 112 / 0 / 10 | **224** / 139 / 22 / 21 | 159 / 105 / 0 / 8 |
| Special word | 0x3db (bits 0, 1, 3, 4, 6, 7, 8, 9) | 0x3db | 0x2db (no Bribe bit) |
| Element bytes (absorb / null / half / weak) | 0 / 0 / 0 / 0 | 0 / 0 / 0 / 0 | **0x1f** / 0 / 0 / **0x20** |
| Reading | none | none | **absorbs Fire, Ice, Thunder, Water, Gravity; weak to Holy** |
| Automatic status g1 / g2 | 0x2000 (Use MP 0) / 0 | 0x2000 / 0 | 0x2000 / 0 |
| EXP / Gil / Pilfer Gil / AP | 1,600 / 900 / 1,000 / 1 | 1,500 / 750 / 2,000 / 1 | 1,300 / 1,000 / 2,000 / 1 |
| Drop, common / rare (id) | Mega Phoenix 0x2007 x2 / Bushido Lore 0x9063 x1 | X-Potion 0x2002 x2 / Sword Lore 0x9062 x1 | Turbo Ether 0x2005 x1 / Arcane Lore 0x9064 x1 |
| Steal byte 128; items | Mega Phoenix 0x2007 x1 / Elixir 0x2008 x1 | X-Potion 0x2002 x1 / Elixir 0x2008 x1 | Hi-Potion 0x2001 x18 / Elixir 0x2008 x1 |
| Bribe | none | none | Crystal Ball x1 / Soul of Thamasa x2 (the Bribe bit is clear) |
| Zantetsu byte | 220 | 220 | 180 |
| Model / motion id | 0x1137 | 0x113d | 0x113f |

**Resist bytes:** all three: group 1 at 255 for Death, Petrify, Sleep, Poison, Confusion, Berserk, Curse, Eject, Itchy, Auto-Life; **Silence reads 250 on Auron (and Garik)**, **Darkness reads 250 on Seymour**, 255 elsewhere (a byte of 250 lets a high-chance status land; the kernel's rule [note: hit-status 4.1] decides); group 2: Slow, Stop, Doom at 255 on all; **Tidus also Reflect at 255** (it cannot be given Reflect). Stat stages all land.

The other eleven rows in one table (Lv / HP / elements / resist differences / automatic statuses):

| Row | Lv / HP | Elements | Automatic statuses | Differences |
|---|---|---|---|---|
| 308 Brother | 71 / 89,500; MP 0 | **absorbs Fire, Ice, Thunder, Water** | g1 0x2000, **g2 0x8 = Regen** | steal X-Potion; EXP 1,400 |
| 309 Buddy | 66 / 76,200; MP 0 | **null Fire, Ice, Thunder, Water, Gravity** | **g2 0xc = Reflect + Regen** | drops Remedy x10 / White Tome |
| 313 Kimahri | 70 / 223,400 | none | g1 0x2000 | drops Mega-Potion x2 / Nature's Lore |
| 315 Lulu | 71 / 69,800; STR 26, MAG 243, MDEF 237 | **absorbs all six: Fire, Ice, Thunder, Water, Gravity, Holy** | **g2 0x4 = Reflect** | drops Turbo Ether x2 / Black Lore |
| 321 Baralai | 73 / 125,000 | null Gravity | g1 0x2000 | |
| 322 Nooj | 75 / 178,000 | null Gravity | g1 0x2000 | |
| 323 Gippal | 72 / 134,700 | null Gravity | g1 0x2000 | Reflect resist 255 |
| 324 Garik | 67 / 88,000; MP 860 | none | g1 0x2000 | Silence 250, **no Poison entry (Poison lands)**, steal byte 64 |
| 325 Yaibal | 55 / 64,400; MP 85; AGI 194 | none | none | steal byte 64; drops Champion Belt / Black Tome |
| 326 Lucil | 63 / 71,000; MDEF 141 | none | none | steal byte 64 |
| 327 Elma | 58 / 62,000; MP 384; AGI 201 | none | none | special 0x2db (no Bribe bit); bribe Supreme Gem x3 / x5 |

### 4.2 Ability lists (+0x70) against the commands the AI queues

For all 14 rows the compiled worker queues exactly the commands its source names (section 1); the record's technique list is the same set plus the item rows the AI throws (Auron's list holds Mega-Potion 0x2003 and X-Potion 0x2002; Tidus's Dispel Tonic 0x2038 and Hero Drink 0x203f; Seymour's list is 16 entries long) [R]. **No Oversoul type** (+0x98 reads 0) on any of the 14: the Oversoul worker is an unused copy.

## 5. Formations, scenes and the launch: what is not there

* `btl.txt` has **no row** whose slots name rows 308 to 333; the only formations holding rows 300 and above are test scenes (`zzzz03_00` to `_09`) and the Vegnagun/Insect rows [R: `formations.mjs`, all 2,041 rows resolved].
* Of the 2,542 compiled scene packages, **none** lists the cup rows as formation members; the rows' ids appear in the shared 51,136-byte package table (the same bytes in every such scene), in `system_01` (the voice setup) and by coincidence in a few others [R: `scan-scene-ids.mjs`].
* The `zzzz03_28` to `zzzz03_87` scenes in the `new_*` trees are font/text packs (a "FTCX" container), not formations [R].
* **Event packages**: 669 scanned for the ids; the large dungeon packages (`dn/dnfr*`, 1.6 MB) hold some of them as plain numbers with no launcher shape; no small package does [R/I].

**Consequence:** the cup is not a table I can read here. For a chapter: **one formation per duel, the duelist alone in slot 1 with its prop in a later slot, no escape**, the same shape as the Den of Woe shades; the arena, the camera and the rounds are our design (section 7 of the preflight). *To settle how the game builds the cup:* read `te/testbattle/testbattle.ebp` (the debug battle list, already shown to list the other scenes) and the HD executable's battle-start path with Ghidra read-only GETs (the FFX-2 server on :8090), which is outside this lane's tools.

## 6. The AI scripts (normal versions, worker 1)

### 6.1 Engine rules used

As in `re-ffx2-fallen-maesters.md` 7.1: a poll is one call of the action entry; **`random() % n`** is stream 2; **`searchr`** picks near-weighted (stream 4), **`searchr_nop`** uniform; a `switch` on a draw runs its cases in order; `chr_all_mon` is the monsters' own side (the duelist and its prop), `chr_all_ply` the girls; `stat_haste not` over the monster side returns the monsters **without** Haste. A poll that queues two commands runs both [note: leblanc-den-ixion 1.4]. The scripts here have **no time-out block** (the cup rows 308 to 327 do not carry the generic "battle too long" code) [R].

### 6.2 Auron (`m311`) [R: m311.src 14-130, compiled worker 1]

* **Start:** fade-out death; a counter `mf_count = 0` (the X-Potion flag); the weapon is linked.
* **Each poll:**
  1. **HP below an eighth of the maximum and the flag is 0** (`HP < floor(max / 8)`, 23,437 or less): **X-Potion on himself** (the row is formula 7 power 16 = 100 percent of max HP, but its damage flags carry the 9,999 cap, so it heals **at most 9,999**: 5 percent of Auron's 187,500), the flag set to 1. Once per fight.
  2. **Else HP below a quarter** (46,874 or less): one draw `% 8`: **0** = Shooting Star on the first of Yuna, Rikku, Paine who is alive and whose "death defence" stat is non-zero (the order is Yuna, then Rikku, then Paine; if none passes, **Shin Zantetsu on the whole party**); **1 and 5** = **Mega-Potion on his own side**; **2** = Shooting Star on a near-weighted living girl; **3** = Full Break on one; **4** = Dragon Fang on the party; **6 and 7** = Attack.
  3. **Else (a quarter or more):** one draw `% 6`: **0** Shooting Star on one, **1** Dragon Fang on the party, **2** Full Break on one, **3, 4, 5** Attack.
* So at full health: Shooting Star 1/6, Dragon Fang 1/6, Full Break 1/6, Attack 1/2.
* The reaction, menu, targeted and death entries are empty.
* "Death-defence stat non-zero" is the game's `stat_def_death` read for a girl; whether a non-zero value means "has any Death resistance" or "is not immune" is **unmapped** (the move it gates is an Eject at chance 254, section 7).

### 6.3 Tidus (`m317`) [R: m317.src 14-140, compiled worker 1]

* **Start:** fade-out death; `mf_count = 0`.
* **Poll 1 (count 0):** **Blitz Ace on a near-weighted living girl**; count becomes 1.
* **Every later poll:** first, is there any monster on his side **without Haste**? (a search over `chr_all_mon`, stat Haste, "not"):
  * **If someone lacks Haste:** if he has **Reflect** (impossible: his record is immune to Reflect, 4.1) a Dispel Tonic on himself; **otherwise Hastega on his own side**. So he re-hastes himself whenever Haste lapses (Hastega: Haste 254, counter 40).
  * **If he is hasted:** one draw `% 4`: **0** = if `HP < max / 3` Mega-Potion on his side (count +1) else Attack; **1** = if `HP < max / 3` Mega-Potion (count +1) else **Spiral Cut** (count +1); **2** = if the count is above 4 **Blitz Ace** (count back to 0) else **Delay Buster** (count +1); **3** = if `HP < max / 10` **Hero Drink on himself** (count +1) else Attack.
* So a hasted Tidus: Attack 25 + Spiral Cut 25 + Delay Buster 25 (until the count passes 4, then a Blitz Ace instead) + Attack 25 percent per poll, healing below a third, a Hero Drink below a tenth. Reflect immunity is why he never needs the Dispel.
* The reaction, menu, targeted and death entries are empty.

### 6.4 Seymour (`m319`) [R: m319.src 14-260, compiled worker 1]

* **Start:** fade-out death; two counters at 0 (named "strength up" and "magic up" but crossed: the one tested before **Magic Up** is the first, then Strength Up).
* **Each poll:** one draw `% 8`:
  * **0:** **Demi on the whole party** (25 percent of each girl's current HP).
  * **1:** if `HP < max / 2`: **Curaga on himself** (a **Dispel on himself instead if he has Reflect**); else a **Critical Attack** (crit byte 255: always a critical) on a near-weighted living girl.
  * **2:** if `HP < max / 2`: **Drain Attack** on a girl (absorbs); else **Black Sky on the party** (10 hits, power 6, MP 80).
  * **3:** if `HP < max / 2`: **Absorb** on a girl; else **Meteor** (12 hits, formula 9, power 8, MP 99) on the party.
  * **4:** if he lacks **Shell**: Shell on himself (or Dispel if he has Reflect); else if he lacks **Protect**: Protect (or Dispel); else **Break** (Petrify at chance 80), which the script aims at the whole party group although the row is single-target (so the engine picks one) [I].
  * **5:** **Magic Up** on himself until it has been cast **5 times**, then **Strength Up** until 5 times, then **Confuse** (chance 100) on the party group. (Each Up row writes the stage +2 for a counter of 2; five casts reach +10.)
  * **6:** if `HP < max / 2`: **Drain Attack**; else **Slowga on the party** (Slow 130, counter 126).
  * **7 (default):** if `HP < max / 4`: **Ultima on the party** (power 42, MP 90); else **Dispel on the party group** (removes Shell, Protect, Reflect, Regen, Haste and the four "always" statuses from a girl at chance 254).
* So per poll (above half HP): Demi 12.5, Critical Attack 12.5, Black Sky 12.5, Meteor 12.5, the buff ladder 12.5, the Up/Confuse line 12.5, Slowga 12.5, Dispel 12.5 percent. Below half HP four lines change: case 1 becomes the Curaga heal, case 2 a Drain Attack, case 3 an Absorb, case 6 a Drain Attack (so Critical Attack, Black Sky, Meteor and Slowga stop appearing); below a quarter the default line becomes Ultima. **Meteor (12 hits of about 2,192 spread over the girls) and Ultima (9,784 before MDEF) are the two big numbers.**
* Meteor is not reflectable; Black Sky is magical and not reflectable; Slowga, Demi (Gravity element) and Confuse are reflectable/blockable as in section 7.

### 6.5 The others (digests; not full build specs)

* **Brother (`m308`):** a 5-poll loop. Polls 1 to 4 (the counter below 4): one draw `% 4`; **0** = Machismo on himself **once** if `HP < max/4` (a 100 percent self-heal with Haste and STR up), else Quick Attack, **and then** the next test also queues a second command (Quick Attack, since the draw is not 1); **1** = Stormin' (6 hits, power 8) on a girl; **2, 3** = Quick Attack. Poll 5: **Partyin'** (power 48, the whole party, MP 38), the counter back to 0.
* **Buddy (`m309`):** `hp_per = HP x 10 / max` (0 to 10); a draw `% 7`; if `hp_per` is below it: **Mega-Potion on his side** (so below about 5/10 HP the odds rise; at full health never). Else a draw `% 8`: 0 and 1 = "Guess I'll hit ya" (power 32), 2 = "Sorry about that" (power 18, ATB 70), **3 = Supreme Gem on the party (468 to 529 each, formula 8 power 50)**, 4 = **Blessed Gem (8 hits of power 5: 46 to 52 each)**, 5 to 7 = Attack.
* **Kimahri (`m313`):** three HP bands. Below a third / between a third and two thirds / above: a draw `% 8` (the first two) or `% 2` (top band) choosing among White Wind K (a heal of 6/16 = 37.5 percent of max HP to his side that also cures six ailments), Jump (power 22), Sunshine (formula 9, power 20, the whole party, MP 42; used only when his counter is above 5 in the low band, above 12 in the middle band), Mighty Guard K (Shell and Protect on his side) when he lacks Shell, else Attack. The counter rises by one per poll in most branches.
* **Lulu (`m315`):** a nine-step loop on a counter (0 to 8): MP below a quarter first uses a Turbo Ether on herself; then 0 = Mega-Potion if `HP < max/3` else Flare (aimed at herself, MP 54); 1 to 4 = **T. Fire, T. Blizzard, T. Thunder, T. Water** (8 hits of power 7, formula 9, party-wide, MP 8) **only if no girl absorbs or nulls that element, else Flare**; 5 = Lunar Curtain item on his side if lacking Shell, else Flare; 6 = Light Curtain if lacking Protect, else Flare; 7 = Magic Up ×5 then Dispel on the party; 8 = Ultima if `HP < max/3` else Demi, then back to 0.
* **Baralai (`m321`):** the Bevelle Baralai's moves (Drill Shot, Glint, Looming Glacier, Chain Attack, Ultima, Magic/Strength Up, Mighty Guard K, a self heal) driven by a counter: **Drill Shot on every seventh poll** (after six counted polls, on a near-weighted girl), else a draw `% 6` among 0 = self-buff (Turbo Ether at low MP, then Strength Up ×5, Magic Up ×5, then Ultima), 1 = Glint (party), 2 = Looming Glacier, 3 = Chain Attack (one), 4 and 5 = Vigor (a self heal, 0x30b2) when `HP < max/3`, else Mighty Guard K on his side when he lacks Protect, else Attack.
* **Nooj (`m322`):** a five-poll loop on a counter: **Lightfall** (his "ultimate", formula 5 power 100 = a fixed 5,000 on the whole party, MP 30) → **Greedy Aura** on the party (HP and MP class, 3/16 of maximum) → Mega-Potion on himself if `HP < max/4`, else an Attack on a uniform girl → **Lightfall again if `HP < max/4`, else Fireworks** on the party → **Rippling Chroma** on one uniform girl; the counter then returns to 0. (The shade's cycle is different: this one opens with Lightfall.)
* **Gippal (`m323`):** `HP < max/4`: Hastega-like "all haste" item if he lacks Haste else Mortar on the party; `HP < max/2`: a draw `% 5` among Mega-Potion, Bullseye (party), Grinder (one), else Attack; else `% 2` Grinder / Attack.
* **Garik (`m324`):** a draw `% 6`. Below a third of his HP: draw above 2 = White Wind K on his side, draw 0 = Sunshine on the party, **draws 1 and 2 queue nothing**. Otherwise: Mighty Guard on his side if he lacks Shell, else a draw `% 4` among Fireworks (party), Bane Lance (one), Attack (two cases).
* **Yaibal (`m325`):** a 5-step loop on a counter (0 to 4, back to 0): step 0 Mega-Potion if `HP < max/4`, else Petrify Grenade on the party when no girl has a Petrify defence, else Attack; step 1 below half HP an item throw at a girl (two item symbols I could not resolve, drawn `% 3`), else an all-Haste item if he lacks Haste, else Attack; step 2 Supreme Gem on the party if `HP < max/8`, else Attack; step 3 Blessed Gem on one girl if `HP < max/4`, else Attack; step 4 Attack.
* **Lucil (`m326`):** a 7-step loop on a counter (0 to 6): 0 White Wind K on his side if `HP < max/4`, else Drain Attack; 1 Delay Shock; 2 MP Buster on the girl with the most MP (if she has MP), else Black Sky; 3 "Nonpareil" (an accuracy buff) on himself once, then "Heartless Attack" (leaves 1 HP, formula 0xa); 4 Fireworks on the party if some girl has a Death defence, else Shin Zantetsu on the party; 5 **Harbinger on a girl who does not yet have the death-sentence status**, else an Attack; 6 an all-Haste item if he lacks Haste, else Attack, counter to 0.
* **Elma (`m327`):** `HP < max/4`: Clean Slate (party row 0x307b, formula 7 power 4) on herself; else if she lacks Protect a Light Curtain item on her side, else if she lacks Shell a Lunar Curtain, else a draw `% 6` among Fireworks (party), Critical Attack, Supreme Gem on the party if `HP < max/2` else a Gold Hourglass (an ATB-class slowing item) on the party, and Attack (the rest).

(Digests of 321 to 327 are for rows 42 and 47 to refine; they were read once, not built.)

### 6.6 Turn cadence (rule of `re-ffx2-fallen-maesters.md` 7.8; `cadence.mjs`)

| Actor (AGI) | First gauge | Move | Charge (steps, s) | Recovery (steps, s) |
|---|---|---|---|---|
| Auron (141) | 13 to 39 steps, 0.43 to 1.30 s | Attack | 0 | 75, 2.50 |
| | | Shooting Star / Full Break | 60, 2.00 | 0 |
| | | Dragon Fang | 75, 2.50 | 0 |
| Tidus (224) | 9 to 25 steps, 0.30 to 0.83 s | Blitz Ace / Delay Buster / Hastega | 47, 1.57 | 0 |
| | | Spiral Cut | 43, 1.43 | 0 |
| Seymour (159) | 12 to 35 steps, 0.40 to 1.17 s | Demi | 53, 1.77 | 0 |
| | | Black Sky / Ultima | 66, 2.20 | 0 |
| | | Meteor | 79, 2.64 | 0 |

Tidus is the fastest actor in the block (AGI 224); all three have special bits 6 and 9 set (no ATB damage, no Interrupt), so **delay and Interrupt do nothing to the duelists**, except that Delay Buster-type delays are the duelist's own tools [R].

## 7. The moves (rows of `monmagic.bin`, `command.bin`, `item.bin`)

Column meanings: `re-ffx2-commands.md` section 1. Accuracy formula: 0 always hits, 1 race with the row byte, 2 race with the attacker's ACC, 3 and 4 unmapped (3 is Shooting Star's, 4 Death's). The attacker term is the formula's attacker side before the girl's defence, the stages and the variance [note: damage 1].

| Move (user) | What it does | Type / accuracy | Statuses | Cost: recovery / charge / MP | Attacker term |
|---|---|---|---|---|---|
| **Shooting Star** 0x4208 (Auron) | one target, power 18, class 0 (no HP damage) | accuracy formula 3; not reflectable | **Eject (Blow) at 254** | 0 / 80 / 12 | none |
| **Full Break** 0x4206 (Auron) | formula 0, power 20, one girl, shatter 100 | physical; race with ACC; crit 10 | **STR, MAG, DEF, MDEF stages down 2 each** (chance 100, counters -2) | 0 / 80 / 4 | `((199 + 74) ... )` as formula 0 = **4,124**, x20/16 = 5,155 |
| **Dragon Fang** 0x4207 (Auron) | formula 0, power 14, the whole party, shatter 100 | physical; always hits; crit 10 | none | 0 / 100 / 10 | 4,124, x14/16 = 3,608 |
| **Shin Zantetsu** 0x3078 (Auron, low HP) | party row (the whole party), physical | race with ACC | **Death at 80** | 60 / 40 / 32 | |
| **Blitz Ace** 0x4205 (Tidus) | formula 0, **power 10, 9 hits**, one girl, shatter 100 | physical; always hits; crit 10 | none | 0 / 100 / 40 | formula 0 = **3,686**, x10/16 = 2,303 per hit (x9) |
| **Spiral Cut** 0x4203 (Tidus) | formula 0, power 32, one girl, shatter 70 | physical; always hits; crit 15 | none | 0 / 90 / 10 | 3,686, x32/16 = 7,372 |
| **Delay Buster** 0x3070 (Tidus) | formula 0, power 18, one girl, shatter 100 | physical; race with ACC | delay (a Delay row) | 0 / 100 / 16 | 3,686, x18/16 = 4,146 |
| **Hastega** 0x3177 (Tidus) | his side | magical; reflectable | Haste 254, counter 40 | 0 / 100 / 32 | none |
| **Hero Drink** 0x203f (Tidus) | himself | item | slot 17 status 254, counter 20 | 40 / 40 / 0 | none |
| **Demi** 0x3082 (Seymour, Lulu) | the party, formula 4, power 4: 25 percent of current HP | magical; Gravity element | none | 0 / 80 / 10 | percent |
| **Black Sky** 0x3088 (Seymour, Lucil) | the party, **10 hits** spread over random girls, power 6, formula 0 (STR-built, magical for Shell), shatter 100 | magical; always hits | none | 0 / 100 / 80 | formula 0 on Seymour's STR 156 = 2,432, x6/16 = **912 per hit** |
| **Meteor** 0x4221 (Seymour) | the party, **12 hits** spread over random girls, formula 9, power 8 | magical; not reflectable | none | 0 / 120 / 99 | formula 9 on MAG 221 = 4,385, x8/16 = **2,192 per hit** |
| **Ultima** 0x41fb (Seymour, Lulu, Baralai) | the party, formula 2, power 42 | magical; shatter 100 | none | 0 / 100 / 90 | `(221 + 134) x 42 x 42 / 64` = **9,784** (Seymour); Lulu (MAG 243) 10,611 |
| **Slowga** 0x421e (Seymour) | the party, ATB class | magical; reflectable | Slow 130, counter 126 | 90 / 90 / 8 | |
| **Break** 0x3084 (Seymour) | one target | magical; reflectable | **Petrify at 80** | 0 / 80 / 20 | |
| **Confuse** 0x3083 (Seymour) | one target | magical; reflectable | Confusion at 100 | 0 / 80 / 12 | |
| **Dispel** 0x30b8 (Seymour, Lulu) | one target / the group | magical | strips Shell, Protect, Reflect, Regen, Haste and four "always" statuses at 254 | 0 / 60 / 12 | |

(The Black Sky and Ultima terms are the standard formula 0/2 shapes, shown for sizing only; the engine computes them from the record.) **Items:** X-Potion 0x2002 is formula 7 power 16 (100 percent of max HP) with the 9,999 cap bit, so at most 9,999; Mega-Potion 0x2003 is formula 5 power 40 (a fixed 2,000 to his whole side); Machismo (0x4200) and White Wind K (0x4217) are heal rows without the cap (100 percent and 37.5 percent of max HP). The duelists' healing is therefore small against their HP except Machismo, White Wind K and Vigor.

## 8. Against the candidate note and the wiki-level descriptions; what this changes in PLAN.md

| Statement | The files |
|---|---|
| Candidates note: "Farplane Cup: Auron, Tidus, Seymour (Fiend Arena, International/HD); standard character duels with their FFX Overdrives" | **agrees as to the characters and the techniques** (Shooting Star, Full Break, Dragon Fang, Blitz Ace, Spiral Cut, Meteor...). The FFX-2 rows are named after the FFX Overdrives; nothing implies a new engine feature |
| "after winning the Cup several times; recruited afterwards" | **not in the data I read** (no formation, no launcher) [wiki-level only] |
| Plan row 38: "Fiend Arena cup rows (inferred: one contiguous block of named duellists at Lv 55 to 75)" | **correct: rows 308 to 327, Lv 55 to 75** (the block is 308 to 336 including Trema, Shinra and the Numerus parts) |
| Plan row 38: "Tidus row317 ... identity inferred from the row before 'Tidus' Weapon'" | **settled** (section 2) |
| Plan row 38: "Baralai/Nooj/Gippal row321 to 323" with the cup | they are the post-clear copies of the shades (Lv 73/75/72, HP 125,000/178,000/134,700) and are **not assigned to any chapter** in the plan: **driver's pick: build them with this chapter as an optional second act group, or leave them out** (see the preflight) |
| Plan row 63: "rows 334 to 336 'Iutycyr Boss Body/Pod/Tail' (HP 1: real values set by script) and the mode was never read", "Last Mission research first" | **mis-aimed**: the AI sources 334/335/336 are titled "Enemy Yadonoki body / pod / tail" and the symbols are the Yadonoki-boss body, pod and tail, the same family as the four heads of rows 330 to 333 (Unum, Duo, Tria, Quattour = **Major Numerus**). **They are Major Numerus's seven parts** (row 53). The Last Mission has its own table (`lastmiss/kernel/lm_monster.bin`) and its 8 h research row should be re-aimed there, or dropped |
| Plan row 59 (Fiend Arena exhibitions): Brother, Buddy, Kimahri with Lulu, the Goon colours (355, 368, 369), Seymour | rows 308, 309, 313, 315 are read here; Seymour is row 319 (here); **the Goon colour rows 355, 368, 369 (Goon Black Lv 70 / 17,700, Goon Red Lv 71 / 18,880, Goon Purple Lv 69 / 15,800) are not read by this note** |
| Plan row 53: Almighty Shinra row 329 (275,000 HP, Lv 99, AGI 255) | its AI (`m329.src`, 2.5 KB) is extracted in the research scratch folder (outside the repo); not read further |

**The repo already holds** the FFX characters' paintings (`auron`, `tidus`, `kimahri`, `lulu` with full pose sets; Seymour as `seymour-guest`/`-macalania`/`-natus`/`-omnis`/`-flux`), the Gullwings' Level 99 line (`via-infinito.ts`), and the Den of Woe shades' AI. There is no cup data or AI code in `src` on `origin/main`.

## 9. What our engine would need (origin/main `cd4aee3ce`; no build)

**Existing and enough:** an AI script per actor (`ai/index.ts`; patterns `den-of-woe.ts`, `fallen-maesters-a.ts`); `lacking(status)`, near-weighted/uniform searches, `% n` draws (`ai/script-rolls.ts`); enemy item use (the Leblanc Syndicate goons use items; `x2-item-*` ids exist for Potion to Hero Drink, Grenade, Curtains, Soul Spring, Stamina Tonic, Three Stars: `research/re-ffx2-commands.md` "Items"); enemy automatic statuses (Reflect, Regen, Haste) as `EnemyDef.autoStatuses`; multi-hit rows (Black Sky, Meteor, Blitz Ace as hits); the Level 99 line.

**New or to check:**
1. **Data rows**: the three duelists' records plus their move rows (above) as command records; the party rows they queue (Delay Buster 0x3070, Hastega 0x3177, Shin Zantetsu 0x3078, Demi, Curaga, Dispel, Break, Confuse, Shell, Protect) already exist as player-ability ids; **verify the enemy-side use** of party rows (an enemy casting a "pcom").
2. **Item ids the duelists throw** (Mega-Potion, X-Potion, Hero Drink, Dispel Tonic 0x2038, Supreme Gem 0x2028, Blessed Gem 0x2027, Petrify Grenade 0x2018, Lunar/Light Curtain, Soul Spring 0x2037, Chocobo Wing 0x2030, Gold Hourglass 0x202b, Shining Gem 0x2026): only those used by rows 38 (Mega-Potion 0x2003, X-Potion 0x2002, Hero Drink 0x203f, Dispel Tonic 0x2038) are needed for this chapter; the rest for rows 42 and 59.
3. **Formula 3 accuracy** (Shooting Star) and **Eject at 254**: check the status kernel handles Eject on a girl (Death and Eject) and the formula-3 accuracy rule (unmapped here).
4. **Hasted-Tidus rule**: a search over the enemy side for "lacking Haste" (`lacking` over monsters, not girls); the `% 4` branch with a counter.
5. **Seymour's Reflect checks** (he has no Reflect in his record; the branch exists for the case he is given one); **absorb of five elements** (the engine's element absorb exists; Gravity absorb check).
6. **Chapter plumbing**: the shared tables (PLAN section 7); the door word `duelist` is pre-checked.
7. **Reflect redirect is not built** (known gap, Maesters T0 finding 1): irrelevant to the three duelists (Lulu's permanent Reflect and Buddy's matter for rows 59 only).

## 10. Open questions, and what a live check would settle

1. **How the game launches a cup duel, the rounds and the rewards** (section 5). *Settle by:* the debug list `testbattle.ebp`, Ghidra on the HD executable, or a live save of the HD Fiend Arena.
2. **The party the game expects** at the cup (Lv 99 line is the plan's; HP of the Lv 99 girls is 10,000 or so, see the Maesters handoff T0 finding 4). Auron's Dragon Fang with attacker term 4,159 is the first number to test against that HP; the build point stays an `[estimate]`.
3. **Whether Shooting Star's Eject lands on the Lv 99 girls** (Eject resist byte per girl; formula 3).
4. **`stat_def_death` (Auron's Shooting Star gate)**: what a non-zero value means.
5. **Row 328 (Trema's twin) and 329 (Shinra)**: not in this row; row 329's source is extracted.
6. **Rows 355, 368, 369** (the Goon colours) are not read.

## 11. Notes cited

In the repo (`research/` on `origin/main`): `re-ffx2-damage.md`, `re-ffx2-hit-status.md`, `re-ffx2-atb-status.md`, `re-ffx2-commands.md`, `re-ffx2-ai-leblanc-den-ixion.md`, `re-ffx2-fallen-maesters.md`, `re-ffx2-ai-bahamut-vegnagun.md`, `ffx2-gippal-den-of-woe.md`. Kept outside the repo (research scratch): the archive reader and the row, formation and event parsers, the source-versus-binary check, the cadence and hash tools, the three scan scripts, and the row data (`rows.json`, `rows.tsv`, `records.txt`).
