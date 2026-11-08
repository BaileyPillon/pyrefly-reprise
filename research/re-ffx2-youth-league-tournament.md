# FFX-2 Youth League Tournament (Chapter 5, Mushroom Rock Road): Yaibal, Lucil, Elma and the seven fights, read from the game's own files

**Game case: FFX-2 only.** The tournament is the Chapter 5 mission "Youth League Tournament" of FFX-2 (ATB, dresspheres, the FFX-2 kernel tables `monster.bin`, `monmagic.bin`, `command.bin`, `item.bin`, the FFX-2 status set). Nothing here changes an FFX chapter and no FFX number is used. The three named people are rows 183 (Yaibal), 184 (Lucil) and 279 (Elma); five supporting rows (210, 211, 193, 214, 215) and two prop rows (186, 201) fill the seven fights.
Written 2026-11-06 by a Sonnet sub-agent of the release driver (row 42 of the release driver's 2026-11-06 program plan, wave 3). **Treeless research: no repo file, no art, no engine or data file is changed; nothing deployed; the game was not run; no browser, no GPU, no Ghidra.** Authority (relayed words, verbatim): 2026-11-06 ~00:30 EST "implement all unimplemented chapters please"; ~00:55 EST "yes on all these too"; 2026-10-31 "you make the executive decisions for the next few days. i'll go with all of your recommendations." Every pick named here is a recommendation, "driver's call, his to overturn".

**What is in this note:** numbers and described behaviour read from the owner's own Steam copy (FFX-2 half of the HD Remaster, build 25501027). Monster, item and move names appear only as identifiers (the game's English name tables); no dialogue, no script lines, no decompiled code and no byte dumps; developer labels are translated in a few words.

**Tags.** **[R]** read from a game file (kernel table, the shipped plain-text AI source, the compiled script, the event package) by this lane's tools; **[I]** inferred from [R] facts or from an earlier checked note; **[G]** a published guide (Jegged, Gamer Guides, DrSlice); **unmapped** the raw value is given and no meaning is claimed (AGENTS.md hard rule 6). Engine rules are taken from the earlier notes and cited `[note: file section]` (all in `research/` on `origin/main`: `re-ffx2-damage.md`, `re-ffx2-commands.md`, `re-ffx2-fallen-maesters.md`, `re-ffx2-ai-leblanc-den-ixion.md`, `ffx2-combat-core.md`, `ffx2-gippal-den-of-woe.md`).

## Summary for the driver

1. **The plan's "three rounds" is seven fights, and the files give the whole sequence.** Mushroom Rock Road's event package carries one function per battle and a chain of position triggers along the road. The order is **Yaibal with two League Warriors, then Mage-Mage-Veteran, Warrior-Veteran-Veteran, Slasher-Slasher-Master, four Veterans, Elma with two Veterans, then Lucil alone** (formation scenes `kino01_223, _220, _219, _218, _217, _221, _222`). Guides agree: "seven consecutive battles" (Gamer Guides), Yaibal first, Elma and Lucil at the end (Jegged). [R, G]
2. **Which fight "ends the tournament": Lucil's, the seventh.** Winning it runs the closing speech and leaves the road for the next map; winning any earlier fight continues. **Any non-victory result of any of the seven (defeat, or anything else but "won") runs the same short exit and returns the party to the road's start map: the tournament is not a game over.** What a retry keeps is not proven (section 8). [R for the branches, I for their meaning]
3. **Seams.** Acts 1 to 4 are four separate position-triggered fights with field walking between them (a menu is reachable); **acts 5, 6 and 7 are one scripted function with only dialogue between them: no field step, no menu.** The guide's advice "heal before engaging Lucil" is the seam. [R for the structure, G for the advice]
4. **The three named fighters are small, readable scripts.** Yaibal (Lv 26, 4,330 HP) is a sportsman: **he revives a knocked-out Yuna with a Phoenix Down and heals her with Hi-Potions**; otherwise he attacks, with a one-in-four party-wide "Sorry" grenade (468 to 529 a girl). Lucil (Lv 43, 7,324 HP) counts: **every fifth action is Harbinger (damage plus Doom, counter 4) on a girl who does not yet carry Doom**; between them she shells and protects herself with Curtains, throws each elemental Gem once (six hits of about 100) and a Gold Hourglass (Slow on the party) once, and drinks at most two Hi-Potions. Elma (row 279, Lv 36, 4,882 HP) opens with Not-So-Mighty Guard on her whole side, then casts the four -ra spells, Confuse, Sleep, Osmose and two grenades (Flash Bomb, Hush Grenade) at girls who lack Reflect. [R]
5. **The whole tournament is a walkover for the Chapter 5 build the repo already owns.** Against a Level 50 Dark Knight (DEF 139) the strongest single hit in the chain is Lucil's attack or Harbinger at 168 to 190; against a Level 50 White Mage (DEF 17, MDEF 155) 326 to 368; a girl has about 5,000 HP with a Crystal Bangle. The guides say the same ("easy fights", "a walkover"). The chapter's value is staging, not a difficulty curve; **no boss number is touched**. [R, I]
6. **The plan's engine gap "item-using enemy AI" is data, not engine.** Every thrown item is an enemy ability row in the way the Leblanc Syndicate's and the Den of Woe shades' are (`x2-<chapter>-<name>`); what is new is small: a few rows (the Ice, Lightning and Water Gems and the Gold Hourglass as enemy rows; Fire Gem, Hi-Potion, Phoenix Down, the Curtains already exist as item ids) and **one engine fact to check: an enemy command that heals or revives a girl** (Yaibal). "The outcome that ends the tournament" is a chapter-level rule, not an engine feature. [I]
7. **No time limit in these scenes.** The supporting rows carry a "battle too long" escalation (warnings, then a fixed 12,750 Self-Destruct Flare), but each script names the scenes it applies to, and none of `kino01_217` to `_223` is in any list. Elma's Chapter 2 script (row 185) has its own enrage (Time Up Meteor) in `kino01_229` only. [R]
8. **Row 185 is not part of this tournament.** Elma row 185 (Lv 22, 1,640 HP) is the **Chapter 2** miniboss, fought only if the Awesome Sphere went to New Yevon (`kino01_229`, with two League Warriors); the Chapter 5 tournament exists only on the Youth League path of the same Chapter 2 choice. The two paths exclude each other in one playthrough. The plan should list **row 279**, not 185, as the tournament's Elma. [R for the scene and rows, G for the path rule]
9. **Cup versions already read.** Rows 325 to 327 (Yaibal Lv 55, 64,400 HP; Lucil Lv 63, 71,000; Elma Lv 58, 62,000) are the arena (Fiend Arena "cup") copies with the same models, read in the Farplane Cup note (plan row 38). The Colosseum "Youth League Cup" of the guides is the Creature Create arena and its Speed Bracer prize; the repo's accessory table cites "Youth League Tournament" for that prize, which is the Colosseum cup, not this mission. [R, G]
10. **Cost.** Research (R) is done by this note (about 3 h; 1 h left for the live checks). Build is smaller than the plan's B18: nine small scripts (2.2 to 5.6 KB of source each, every one equal to its compiled worker), eight enemy records, about 30 ability rows, a seven-act chain on the Den of Woe pattern, no new mechanic. Suggested total about 33 h against the plan's 42 (preflight section 11).

## 0. Result in one screen

| Act | Scene (formation row) | Members (row, Lv, HP) | HP pool | EXP / Gil / AP |
|---:|---|---|---:|---|
| 1 | `kino01_223` (731) | **Yaibal** (183, 26, 4,330) + 2 League Warrior (210, 24, 422) | 5,174 | 640 / 340 / 3 |
| 2 | `kino01_220` (734) | 2 League Mage (214, 23, 1,020) + League Veteran (211, 33, 1,720) | 3,760 | 300 / 360 / 3 |
| 3 | `kino01_219` (735) | League Warrior (210) + 2 League Veteran (211) | 3,862 | 390 / 320 / 3 |
| 4 | `kino01_218` (736) | 2 League Slasher (193, 30, 1,650) + League Master (215, 32, 1,732) | 5,032 | 480 / 420 / 3 |
| 5 | `kino01_217` (737) | 4 League Veteran (211) | 6,880 | 640 / 400 / 4 |
| 6 | `kino01_221` (733) | **Elma** (279, 36, 4,882) + 2 League Veteran (211) | 8,322 | 2,120 / 700 / 4 |
| 7 | `kino01_222` (732) | **Lucil** (184, 43, 7,324) | 7,324 | 800 / 220 / 2 |
| | | **Total** | **40,354** | **5,370 / 2,760 / 22** |

Seam: after acts 1, 2, 3 and 4 the party walks the road (menu reachable) [I]; acts 5, 6 and 7 are chained with dialogue only [R]. Totals are `calc-42.mjs`. Props (HP 1, no action, visual only): row 186 Sword and row 201 Weapon, linked to the fighters by their scripts [R].

Source of every row: `monster.bin` rows at file offsets 0x8f18 (183), 0x8fe0 (184), 0x90a8 (185), 0xda18 (279), 0x96e8 (193), 0xa430 (210), 0xa4f8 (211), 0xa750 (214), 0xa818 (215) [R: `rows.mjs`, `dump-rows.mjs`].

## 1. Source block

| Item | Value |
|---|---|
| Archive | `FFX2_Data.vbf` (Steam HD Remaster, FFX-2 half, build 25501027) read with a node archive reader, read-only, extracted only into the lane's scratch space |
| Kernel tables [R] | `monster.bin` (96,596 bytes; 50964278e7b164e6), `monmagic.bin` (85,222; 35b432bbbec34bac), `command.bin` (90,359; 6099fcff08194360), `item.bin` (12,748; e7896df7ac6650bf), `btl.txt` (781,815; a2a9d7e0a28559f7): the same hashes as the Fallen Maesters, Bevelle and Farplane Cup notes. English names from `new_uspc/battle/kernel/monster.bin` (119,716) |
| AI sources [R] | `battle/mon/m183.src` (2,416 bytes; b601ac690d699f04), `m184.src` (3,444; 0fa7bcb52cc09f9f), `m185.src` (5,635; c71d5a5e7878c166), `m279.src` (2,895; 0a3a38cf87b56b5a), `m210.src` (2,786; 0442e9ace2a4b90c), `m211.src` (2,535; 015f8d6f2c961da0), `m193.src` (2,378; 269c3529cb26d8df), `m214.src` (4,113; 1fc01f614ebf9bf4), `m215.src` (3,796; bc39d183e3a51d29); props `m186`, `m201` (about 980 bytes each) |
| Compiled packages [R] | `battle/mon/_mNNN/mNNN.bin` for each (e.g. `_m183` 82,416 bytes, 750038b40b9e8027). **For these rows (below 300) worker 0 is the normal script** (the Oversoul copy of rows 300 and above does not exist here) |
| Event package [R] | `event/obj/ki/kino0100/kino0100.ebp` (123,712 bytes; f7540cd51c3419c1): the Mushroom Rock Road map script, 87 workers, 81,968 bytes of code |
| Scenes [R] | `battle/btl/kino01_217` to `_229` (scene files: empty `pos_*.psc` and `evt_*.src` on all; `scn_*` 0, 59 or 123 bytes) and `header/btl.h` (scene constants `btl_kino01_217` = 0x00dd00d9 to `_229` = 0x00dd00e5) |

**Checks.** For all nine sources the set of queued command ids equals the compiled worker 0's, the `random() % n` moduli are equal (183: 3 and 4; 184: 8; 185: 3 and 4; 279: 3 and 11; 211: 5; 193: 6; 214: 2 and 5; 215: 2 and 4) and the scene constants named are equal (185: `kino01_229`; 210: `kino01_226`, `kino01_227` and Kilika `klyt00_224`, `_225`; 211: `klyt00_220`, `_221`; 193: `klyt00_220`; 214: `klyt00_225`; 215: `klyt00_221`) [R: `cmp-src-bin.mjs`, worker 0].

## 2. How the tournament was found

1. **Formations (`btl.txt`).** Rows 183 to 185 and 279 appear in eight formation rows: four test scenes (`zzzz01_83` to `_85`, `zzzz02_79`, one fighter and a weapon each) and **four real scenes on the map "Mushroom Rock Road side path, first half"**: `kino01_223` (Yaibal), `kino01_222` (Lucil), `kino01_221` (Elma 279), `kino01_229` (Elma 185). The scene family `kino01_217` to `_229` is the road's event battles. [R: `formations.mjs`]
2. **The launcher (found this time, unlike the cup rows).** Scanning all 669 event packages for the scene constants gives hits only in `testbattle.ebp` (the debug list) and **`kino0100.ebp`**: `kino01_217` to `_229` each appear once there. Disassembling that package [R: `ev-dis.mjs`]: the battle-start call (the one that takes a scene constant) is made from **worker 30**, one function per battle: functions 5, 7, 9, 11 and 14 start `_227`, `_226`, `_225`, `_224` and `_229` (the Chapter 2 soldiers and Elma 185); **functions 23, 25, 26, 27 and 28 start `_223`, `_220`, `_219`, `_218`, and (in one function) `_217`, `_221`, `_222`**. Function 28 is the only one that starts three battles.
3. **The order.** Workers 61 to 65 are position triggers (a box in map space, one function each) that request worker 30's functions 24, 25, 26, 27 and 28 in that order along the road (box centres at roughly 100, 290, 440, 550 and 750 along its long axis; function 24 is the talk with Yaibal and the accept-or-decline choice, function 23 his battle). The scene numbers also climb in difficulty (HP pools 5,174 → 3,760 → 3,862 → 5,032 → 6,880 → 8,322 → 7,324; Lucil is last by design). Together with the guides' "Yaibal first, Elma and Lucil towards the end" this fixes the order. [R, G]
4. **After each battle** the function reads the battle's result (one engine call) into a variable and switches: **value 2 continues, any other value runs the exit** (a fixed clean-up of the actors and the mission flag, then a transition back to the road's start map). The meaning "2 = victory" is read from the structure (the victory branch continues the story, the other branch leaves) and is [I]; the result codes themselves are unmapped.
5. **Progress counters.** The script writes a mission-progress pair into saved variables: 1 and 470 after Yaibal's win, 2 and 475 before Elma's fight, 3 and 480 before Lucil's, 4 after Lucil's. After Elma's win a flag bit is set that the dialogue before Lucil reads (so Lucil's introduction differs on a retry) [I]. What the numbers mean is unmapped.

## 3. Rows (`monster.bin`)

### 3.1 The three named fighters

| Field | **Yaibal (183)** | **Lucil (184)** | **Elma (279)** | Elma (185, Chapter 2) |
|---|---:|---:|---:|---:|
| Level | 26 | 43 | 36 | 22 |
| HP / MP | 4,330 / 48 | 7,324 / 370 | 4,882 / 870 | 1,640 / 450 |
| STR / DEF | 55 / 47 | 64 / 41 | 58 / 56 | 29 / 18 |
| MAG / MDEF | 12 / 10 | 24 / 40 | 41 / 80 | 77 / 48 |
| AGI / ACC / EVA / LCK | 71 / 95 / 0 / 8 | 120 / 95 / 42 / 10 | 94 / 95 / 44 / 8 | 73 / 95 / 31 / 12 |
| "Thinking" byte | 30 | 0 | 10 | 0 |
| Special word | 0x3c3 (bits 0, 1, 6, 7, 8, 9) | 0x3c3 | 0x3c3 | 0x3c3 |
| Elements (absorb / null / half / weak) | null Gravity | null Gravity | null Gravity | null Gravity |
| Automatic statuses | none | none | none | none |
| Resist bytes, group 1 (255 = immune) | Death, Petrify, Sleep, Silence, Berserk, Curse, Eject, Itchy, Auto-Life 255; **Darkness 20, Poison 20, Confusion 100** | all twelve 255 | all twelve 255 | all 255 except **Sleep 50** |
| Resist, group 2 | Slow, Stop, Doom 255 | same | same | same |
| EXP / Gil / Pilfer Gil / AP | 500 / 100 / 1,000 / 1 | 800 / 220 / 3,000 / 2 | 1,800 / 500 / 6,000 / 2 | 200 / 230 / 800 / 2 |
| Drop (byte 255: both slots) | Muscle Belt x1 | Circlet x1 | Chocobo Feather x2 / x3 | Wall Ring x1 |
| Steal (byte) | Chocobo Feather x1 / x2 (255) | Chocobo Feather x1 / x2 (255) | Healing Spring x2 / x3 (255) | Phoenix Down x3 / Mega Phoenix x2 (128) |
| Zantetsu byte | 10 | 10 | 12 | 10 |
| Model / motion id | 0x10b7 | 0x10b8 | 0x10b9 | 0x10b9 |
| File offset | 0x8f18 | 0x8fe0 | 0xda18 | 0x90a8 |

Special-word bits as in the Farplane Cup note (section 3: 0 ratio, 1 damage-not-stop, 6 no ATB damage, 7 disable-Zantetsu, 8 Bribe, 9 magic-cancel): **delay and Interrupt do nothing to these three** [note: Farplane Cup 6.6]. All four rows are immune to Slow, Stop and Doom, so the girls' Slow, Stop and Doom spells are wasted on them. Yaibal is the one named fighter that can be Darkened, Poisoned (both 20) or Confused (100) — read as "20 and 100 are chance bytes, not immunity" by the kernel's rule [note: re-ffx2-hit-status 4.1].
Ability lists (`+0x70`) are the commands each AI queues plus the item rows it throws (section 6). No Oversoul type on any of them (the field reads 0).

### 3.2 The supporting rows

| Row | Name | Lv / HP / MP | STR / DEF / MAG / MDEF / AGI | Special / resist | EXP / Gil / AP | Drop / steal |
|---:|---|---|---|---|---|---|
| 210 | League Warrior | 24 / 422 / 26 | 41 / 53 / 12 / 3 / 58 | 0x80; Sleep, Curse, Itchy, Auto-Life 255 | 70 / 120 / 1 | Hi-Potion, Grenade x2 / the same (steal byte 255); bribe M-Bomb |
| 211 | League Veteran | 33 / 1,720 / 42 | 42 / 54 / 17 / 6 / 68 | 0x80; Death 50, Petrify 50 | 160 / 100 / 1 | Hi-Potion x1 / x2 (byte 128); steal M-Bomb, L-Bomb (64) |
| 193 | League Slasher | 30 / 1,650 / 58 | 38 / 30 / 16 / 0 / 82 | 0x80; Silence 255 | 160 / 140 / 1 | Hi-Potion; steal M-Bomb, L-Bomb |
| 214 | League Mage | 23 / 1,020 / 420 | 29 / 2 / 22 / 52 / 73 | 0x80 | 70 / 130 / 1 | Hi-Potion, Phoenix Down; steal Ether, Amulet |
| 215 | League Master | 32 / 1,732 / 670 | 32 / 18 / 43 / 56 / 76 | 0x80; Death 50, Petrify 50 | 160 / 140 / 1 | Ether; steal Phoenix Down x1 / x2 |
| 186 / 201 | Sword / Weapon | 1 / 1 / 1 | all 1 | 0 | 0 | none (props) |

All five fighters have bit 7 only (disable-Zantetsu) in their special word: **none of the five is immune to delay or Interrupt, and none has the cup rows' ailment wall** [R]. No elements, no automatic statuses. Full dumps: `dump-named.out.txt`, `dump-mob.out.txt`.

## 4. The formations

| Scene | Formation row | Slots (scale 100 each) | Props |
|---|---:|---|---|
| `kino01_223` | 731 | Yaibal, League Warrior, League Warrior | three Swords (slots 5 to 7) |
| `kino01_220` | 734 | League Mage, League Mage, League Veteran | two Weapons, one Sword |
| `kino01_219` | 735 | League Warrior, League Veteran, League Veteran | three Swords |
| `kino01_218` | 736 | League Slasher, League Slasher, League Master | three Weapons |
| `kino01_217` | 737 | League Veteran x4 | four Swords |
| `kino01_221` | 733 | Elma (279), League Veteran, League Veteran | one Weapon, two Swords |
| `kino01_222` | 732 | Lucil | one Weapon |
| `kino01_229` (Chapter 2, not this chapter) | 718 | League Warrior x2, Elma (185) | two Swords, one Weapon |

Map: battle map 1036, "Mushroom Rock Road side path (first half)"; ground type "wasteland". The six condition flags are all off for these scenes (a random encounter on the same map has one on, and the last three fields read 1, 1, 1 where these read 1, 0, 0); **what the flags mean (escape allowed? game over?) is unmapped**. The tail values (bgm number 879, the same for every scene on this map including the random battles, then camera numbers) are unmapped. **No start positions exist** (every `pos_*.psc` is empty and the compiled scene file of `kino01_217` to `_220`, `_222`, `_223` is the generic 2,060- or 10,148-byte one): aim picks that the game weights by closeness use uniform picks here, as in the Tourist Trap and Leblanc notes [note: Tourist Trap re-review].

## 5. The AI scripts (normal versions, worker 0) 

Engine rules as in [note: re-ffx2-ai-leblanc-den-ixion 1.4; fallen-maesters 7.1]: a poll is one call of the action entry; `random() % n` is stream 2; `searchr` is the near-weighted search (stream 4), `searchr_nop` uniform; a branch that does not test a condition draws nothing. "A girl" is Yuna, Rikku or Paine; "own side" is the monster side.

### 5.1 Yaibal (`m183`) [R: m183.src 48 to 106]

Each poll tests Yuna first (the script names her, Paine and Rikku):
* **Yuna is KO'd:** draw `% 3`: 0 = Attack a living girl (near-weighted); 1 and 2 (**two thirds**) = **Phoenix Down on Yuna** (item row 0x2006: formula 7, power 4 = 25 percent of her maximum HP, with the Death-status cure: a revive).
* **Yuna alive with HP below a quarter of her maximum:** draw `% 3`: 0 = Attack Paine if Paine is alive, else Rikku if alive, else **Hi-Potion on Yuna**; 1 and 2 = **Hi-Potion on Yuna** (item 0x2001: formula 5, power 20 = a fixed 1,000).
* **Else:** draw `% 4`: 0 = **"Sorry" grenade on the whole party** (0x40fc: formula 8, power 10, 80 charge, no recovery: 468 to 529 a girl); 1, 2, 3 = Attack a living girl (near-weighted).
So at full health: Attack 75 percent, grenade 25 percent. The script **spares Yuna** (it heals or revives her and, when she is low, aims the sword at another girl) but leaves her a possible target of an ordinary attack and of the grenade. No guide mentions the heal or revive; it is read from the script alone [R]. The reaction, menu, targeted and death entries are empty.

### 5.2 Lucil (`m184`) [R: m184.src 55 to 178]

* **A counter rises by one each poll; on the fifth it resets and she uses Harbinger** on a near-weighted girl **who does not carry Doom**; if every girl already has Doom she Attacks instead. Harbinger = row 0x40ff: formula 0, power 16, always hits (accuracy formula 0), crit 15, MP 6, no charge, 100 recovery, **Doom at 254, counter 4**. So Harbinger is every fifth poll, from the fifth.
* **Polls 1 to 4**, tested in this order, the first that fires ends the poll (each test whose condition holds draws one `% 8`, a 1-in-8 chance):
  1. HP below a quarter: **Hi-Potion on herself** (1,000), at most **twice** in the fight (a counter of such polls; the third and later fall through).
  2. no Shell: 1 in 8, **Lunar Curtain** (item 0x2031: Shell on her side).
  3. no Protect: 1 in 8, **Light Curtain** (0x2032: Protect).
  4. **Fire Gem** (0x201b), then **Ice Gem** (0x201e), then **Lightning Gem** (0x2021), then **Water Gem** (0x2024): each 1 in 8 and **once per fight** (a flag each); the party, **six hits of formula 8, power 2: 93 to 105 each**, spread over random girls, elemental, 70 shatter, 40 charge.
  5. **Gold Hourglass** (0x202b: Slow 100 on the party, counter 100): 1 in 8, once per fight.
  6. else Attack on a near-weighted girl.
* With all seven options live about 61 percent of her non-Harbinger polls begin as one of them (1 − (7/8)^7); the share falls as Gems and the Hourglass are spent. The guide's list (Gems about 100 a hit, Harbinger, Gold Hourglass, the Curtains, Hi-Potion for 1,000) is the same set [G].
* Attack here is the "no-cancel" Attack row (0x41da); the reaction, menu, targeted and death entries are empty.

### 5.3 Elma, Chapter 5 (`m279`) [R: m279.src 49 to 124]

* **First poll:** **Not-So-Mighty Guard on all monsters** (row 0x4086: Shell, Protect and Regen, counters 126, 126 and 50, 10 MP, 120 charge, 80 recovery): herself **and both League Veterans** (Leblanc's script casts a move of the same name on her side [note: re-ffx2-ai-leblanc-den-ixion §3]).
* **Later polls:** look for a girl **without Reflect** (near-weighted among those who lack it).
  * **No such girl (all three reflect):** draw `% 3`: 0 = Attack a living girl; 1, 2 = **Dispel** on a uniformly drawn living girl (row 0x30b8).
  * **Otherwise** the chosen girl gets one of `% 11`: **0 Fira, 1 Blizzara, 2 Thundara, 3 Watera** (formula 2, power 12, 12 MP, 70 charge, reflectable), **4 Flash Bomb on the party** (Darkness 50), **5 Confuse** (75), **6 Hush Grenade on the party** (Silence 50), **7 Sleep** (75), **8 Osmose** on the girl with the most MP (among living girls), **9 and 10 Attack** on a living girl (near-weighted; accuracy formula 1 against 130, no crit).
* So per poll: each spell 1/11, each status move 1/11, Osmose 1/11, Attack 2/11. The elemental rows carry the "multiple" target bit; the script aims them at the one chosen girl and the engine rule is that `setdircom` does not read the row's target flags [I, note: Tourist Trap re-review]; the same four spells, aimed at the whole party group, appear in the Mage and Master scripts below.

### 5.4 The supporting scripts (digests) [R]

* **League Warrior (`m210`):** looks for an own-side unit under a quarter of its HP; none: Attack a living girl; one: **Hi-Potion on that unit**, unless this Warrior has itself been stolen from (then Attack). (Its "battle too long" block does not run in `kino01_217` to `_223`, section 7.)
* **League Veteran (`m211`):** draw `% 5`: 0 = **Critical Attack** (row 0x4015: crit byte 255, always a critical, always hits) on the **lowest-HP** living girl; 1 to 4 = Attack a living girl (near-weighted).
* **League Slasher (`m193`):** draw `% 6`: 0 = **Flash Bomb on the party** (Darkness 50); 1 to 5 = Attack.
* **League Mage (`m214`):** MP below 27: Attack; otherwise draw `% 5`: 0 = **Confuse** on a girl who is not confused (if every girl is confused: Demi on the party when MP is 36 or more, else Attack); 1 = Fira, 2 = Watera, 3 = Blizzara, 4 = Thundara, **each with a coin: one uniformly drawn girl or the whole party** (rows 0x41ed to 0x41f0, 12 MP). Demi = row 0x3082: 25 percent of current HP, party.
* **League Master (`m215`):** at battle start draws one element for the whole fight (`% 4`: 0 Thundara, 1 Fira, 2 Watera, 3 Blizzara); MP below 12: Attack; otherwise casts **its element**, each time a coin between one uniform girl and the whole party.

## 6. The moves (rows of `monmagic.bin`, `command.bin`, `item.bin`)

Columns as in `re-ffx2-commands.md` section 1. Accuracy formula 0 always hits. "Recovery / charge" are the row's ATB-cost and cast-time bytes.

| Move (user) | What it does | Accuracy / type | Statuses | Recovery / charge / MP |
|---|---|---|---|---|
| **Attack** 0x4000 (Yaibal, mob) | formula 0, power 16, one girl | race with ACC (formula 2, 95); crit 5, shatter 10 | none | 100 / 0 / 0 |
| **Attack** 0x41da (Lucil) | the same, no-cancel | the same | none | 100 / 0 / 0 |
| **Attack** 0x40e3 (Elma) | formula 0, power 16 | race with ACC 130 (formula 1), no crit | none | 100 / 0 / 0 |
| **Critical Attack** 0x4015 (Veteran) | formula 0, power 16 | always hits; crit 255; shatter 100 | none | 100 / 0 / 0 |
| **Harbinger** 0x40ff (Lucil) | formula 0, power 16, one girl | always hits; crit 15 | **Doom 254, counter 4** | 100 / 0 / 6 |
| **"Sorry" grenade** 0x40fc (Yaibal) | formula 8, power 10, party | always hits | none | 0 / 80 / 0 (a monster-command row, not an item row) |
| **Phoenix Down** 0x2006 (Yaibal) | formula 7, power 4: 25 percent of max HP; revives | formula 0 | Death cure 254 | 40 / 40 / 0 |
| **Hi-Potion** 0x2001 (Yaibal, Lucil, Warrior) | formula 5, power 20: fixed 1,000 | formula 0 | none | 40 / 40 / 0 |
| **Lunar / Light Curtain** 0x2031 / 0x2032 (Lucil) | Shell / Protect on her side (counter 100) | | Shell / Protect 254 | 40 / 40 / 0 |
| **Fire / Ice / Lightning / Water Gem** 0x201b / 0x201e / 0x2021 / 0x2024 (Lucil) | formula 8, power 2, **6 hits**, party; element Fire 1, Ice 2, Thunder 4, Water 8 | always hits; shatter 70 | none | 40 / 40 / 0 |
| **Gold Hourglass** 0x202b (Lucil) | the party, ATB class formula 4, power 16 | | **Slow 100, counter 100** | 40 / 40 / 0 |
| **Not-So-Mighty Guard** 0x4086 (Elma 279) | her whole side | magical | Shell 254 / Protect 254 / Regen 254, counters 126 / 126 / 50 | 80 / 120 / 10 |
| **Fira / Blizzara / Thundara / Watera** 0x41ed / 0x41ee / 0x41ef / 0x41f0 (Elma, Mage, Master) | formula 2, power 12; elements 1 / 2 / 4 / 8 | magical, reflectable; shatter 20 | none | 0 / 70 / 12 |
| **Flash Bomb** 0x40fd (Elma, Slasher) | formula 8, power 1, party | always hits | Darkness 50 | 0 / 80 / 0 |
| **Hush Grenade** 0x40fe (Elma) | formula 8, power 1, party | always hits | Silence 50 | 0 / 80 / 0 |
| **Confuse** 0x4070 / **Sleep** 0x406e (Elma, Mage) | one girl | reflectable | Confusion 75 / Sleep 75 | 60 / 60 / 12 and 8 |
| **Osmose** 0x406d (Elma) | formula 4, power 3, MP class | | | 0 / 90 / 0 |
| **Dispel** 0x30b8 (Elma) | one girl | magical | strips Shell, Protect, Reflect, Regen, Haste and the four "always" statuses (254) | 0 / 60 / 12 |
| **Demi** 0x3082 (Mage) | party, formula 4, power 4: 25 percent of current HP | magical, Gravity | none | 0 / 80 / 10 |
| Chapter 2 only (Elma 185): **Haste** 0x406b, **Slow** 0x406c, **Thunder** 0x41eb (power 7, 4 MP) | | | Haste 130, Slow 130 | |
| Kilika / Mushroom `kino01_226` and `_227` only (Warrior, Veteran, Slasher, Mage, Master): the "battle too long" ladder 0x4002, 0x4011, 0x4234, 0x4235, then **Self-Destruct Flare** 0x4237 (formula 5, power 255 = 12,750, one girl) | | | | not used in this chapter |

**Item throws are enemy rows.** The game gives each thrower the same row an ordinary item has (the ability list of rows 183 and 184 names the item ids); the existing engine pattern for such a thrower is an enemy ability record per throw (`x2-den-gippal-potion-plus`, `x2-leblanc-flash-bomb`, `x2-leblanc-hush-grenade` exist on `origin/main`), so nothing here needs an "item-using enemy" mechanism [I].

## 7. Turn cadence and damage sizing (`calc-42.mjs`)

Cadence by the rule of `re-ffx2-fallen-maesters.md` 7.8 (units = cost x 10,000 / (AGI + 1); 95 units a step; 29.97 steps a second):

| Actor (AGI) | First gauge | Move | Charge | Recovery |
|---|---|---|---|---|
| Yaibal (71) | 0.87 to 2.54 s | Attack | 0 | 147 steps, 4.90 s |
| | | Hi-Potion / Phoenix Down | 59 steps, 1.97 s | 59 steps, 1.97 s |
| | | "Sorry" grenade | 117 steps, 3.90 s | 0 |
| Lucil (120) | 0.53 to 1.53 s | Attack / Harbinger | 0 | 87 steps, 2.90 s |
| | | any item (Gem, Curtain, Hourglass, Hi-Potion) | 35 steps, 1.17 s | 35 steps, 1.17 s |
| Elma 279 (94) | 0.67 to 1.94 s | Attack | 0 | 111 steps, 3.70 s |
| | | Fira, Blizzara, Thundara, Watera | 78 steps, 2.60 s | 0 |
| | | Not-So-Mighty Guard | 133 steps, 4.44 s | 89 steps, 2.97 s |
| | | Flash Bomb, Hush Grenade | 89 steps, 2.97 s | 0 |
| Mob (AGI 58 to 82) | 0.77 to 3.10 s | Attack | 0 | 4 to 6 s |

Damage, formulas of `re-ffx2-damage.md` section 1, variance 240 to 271 of 256, against the Level 50 dressphere rows of `ffx2-vegnagun-shuyin.md` 6.2 (the real build's numbers come from the engine; these bracket it). A girl with a Crystal Bangle has about 5,000 HP (a Dark Knight 2,931 base, doubled) `[estimate]`:

| Hit | vs Dark Knight (DEF 139, MDEF 96) | vs White Mage (DEF 17, MDEF 155) |
|---|---:|---:|
| Yaibal Attack | 80 to 91 | 155 to 175 |
| Lucil Attack / Harbinger | 168 to 190 | 326 to 368 |
| Elma (279) Attack | 119 to 134 | 231 to 261 |
| Elma (279) Fira/Blizzara/Thundara/Watera | 162 to 183 | 106 to 120 |
| League Warrior, Veteran, Slasher, Mage, Master Attack (lowest to highest of the five) | 29 (Mage) to 77 (Veteran) | 57 (Mage) to 149 (Veteran) |
| League Master / Mage element spell | 152 to 172 / 97 to 110 | 101 to 114 / 64 to 73 |
| Gem (per hit, six) / "Sorry" per girl / grenades | 93 to 105 / 468 to 529 / 46 to 52 | the same (fixed) |
| Demi at 5,000 HP | 1,250 | 1,250 |

**The largest single threat to a Level 50 girl is a thousand-point Demi or the "Sorry" grenade; Harbinger's Doom (counter 4 of 10,000 units: about 14 s for an owner at the baseline speed by the engine's duration model, longer for a slow girl such as a Dark Knight [note: the duration model in `src/battle/common/types.ts`]) is the only mechanic that can kill outright.** The whole seven-act pool is 40,354 HP.

**No time limit in this chapter.** The "battle too long" blocks of the supporting scripts apply only to the scenes they name: `kino01_226` and `kino01_227` (Chapter 2 soldiers) and the Kilika Forest scenes `klyt00_220` to `_225`. The Chapter 5 scenes `kino01_217` to `_223` are in none of the lists, and Elma's Chapter 5 script (`m279`) has no counter at all. [R]

## 8. The mission as the event package runs it

* **Gate:** the tournament exists only on the Youth League path of the Chapter 2 choice (the Awesome Sphere to the Youth League) [G: Gamer Guides, DrSlice]; on the New Yevon path Chapter 5's Mushroom Rock Road has no tournament. The game keeps that choice in its save; **this repo does not** (the same reason plan row 47 gives for Garik). The chapter must fix the Youth League path as its precondition.
* **Start:** a talk with Yaibal ends in a two-way choice ("You bet!" or not); declining leaves [R, G].
* **Acts 1 to 4:** separate triggers on the road (section 2). [R]
* **Acts 5 to 7:** one function, dialogue between the fights. [R]
* **Defeat or any non-victory:** exit to the start map, the mission flag cleared; no game over. After the **last** fight's non-victory a short loss line plays first [R for the branch, I for "defeat"]. Whether the party's HP is restored on the exit, whether the already-beaten acts are fought again and whether Flee is offered are **unmapped** (the formation flags are unread; no guide says; the combat-core note records that nothing is sourced about the seam [note: ffx2-combat-core 10.2]).
* **Victory:** after Lucil, a speech, a state counter of 4, a transition to the next map; the guides add the Mission Complete card and an "Episode Complete" (Mascot Dressphere from Buddy afterwards if every location was Complete) and Nooj's Sphere from Lucil at the headquarters [G].
* **Rewards in the files:** only the per-fighter EXP, Gil, AP, drops and steals above. The tournament gives no item of its own [G]. (The Speed Bracer is the Colosseum Youth League Cup's fourth prize.) [G]

## 9. Against the guides

| Statement | The files |
|---|---|
| Gamer Guides: "essentially seven consecutive battles"; "the next three battles are more difficult and with no breaks in-between" | **agrees**: seven functions; acts 5 to 7 are one function |
| Jegged: "beginning with Yaibal, and then Elma and Lucil towards the end", "easy fights" | **agrees** (order; sizing in section 7) |
| Gamer Guides: Lucil Lv-less table: HP 7,324, MP 370, EXP 800, Gil 220, AP 2, Gravity immune; steal Chocobo Feather; drop Circlet | **equal** to row 184 |
| Gamer Guides on Lucil's moves: Attack, Fire/Ice/Lightning/Water Gems (six hits, about 100), Harbinger (damage plus Doom), Gold Hourglass, Light and Lunar Curtain, Hi-Potion for 1,000 | **equal** to row 184's list and the script; the guide omits the every-fifth-poll rhythm and the two-Hi-Potion cap |
| Gamer Guides (Chapter 2): Elma 1,840 HP / 450 MP; another guide: 1,640 | **the row says 1,640**; 1,840 is a typo; Gil 230, EXP 200, AP 2, steals Phoenix Down and Mega Phoenix, drop Wall Ring all equal |
| Gamer Guides: League Warrior 422 HP, 26 MP, EXP 70, Gil 120, AP 1; Hi-Potion and 2 Grenades | **equal** to row 210 |
| Gamer Guides/Jegged: Yaibal and Elma (Chapter 5) have no stat table | numbers **from the files only** [R] |
| Wiki-level plan text: "item-throwers" | **confirmed** (section 6); the Phoenix Down on a KO'd Yuna is in no guide |
| The plan: "Elma row185 (1,640 HP, Lv 22) / row279" in the tournament | **row 279 only**; row 185 is the Chapter 2 New Yevon-path fight in `kino01_229` |

GameFAQs pages answered HTTP 403 to the lane's fetch, so nothing was read there; no conflict needed it (every guide number that exists equals the files).

## 10. What this changes in the program plan (and next to it)

1. **Row 42's description**: not "three rounds" but **seven acts** (scenes and rows in section 0); the fighters are rows 183, 184, **279**, 210, 211, 193, 214, 215 (props 186, 201); **row 185 leaves the row** (a Chapter 2 fight; optional prelude, see the preflight YL1); "item-throwers" is data; "an outcome that ends the tournament" is the seventh act's win, a defeat anywhere returns to the start.
2. **Row 42's engine line**: remove "item-using enemy AI, an 'ends the tournament' outcome"; add "one T0 check: an enemy command that heals or revives a girl".
3. **Row 42's art line**: "three humans new" becomes **three named humans (Yaibal, Lucil, Elma) plus two mob bodies (a melee League fighter in three colours, a League mage in two)**, no existing painting fits (the Leblanc goons are Syndicate, not League).
4. **Row 42's size**: R8 B18 A8 I8 = 42 becomes about **R1 B17 A8 I7 = 33** (the research is spent here).
5. **Row 38 (Farplane Cup)**: the cup versions of Yaibal, Lucil and Elma (rows 325 to 327, same models 0x10b7 to 0x10b9) can reuse this chapter's three paintings: build row 42 first, or share the art budget.
6. **Row 47 (Garik)**: the road's Youth fighters (Ronso Youth row 181, Garik 182) are formations `mtgz10_228` and `_229` on Mt. Gagazet, not on this road; nothing here changes row 47. (The Kilika Forest `klyt00_220` to `_229` family reuses the same League rows: not planned, not read.)
7. **Section 8 (door words)**: `youth` was re-checked against the 15-row `CHAPTER_DOORS` of `origin/main` 4310f6b63 (unchanged since the plan's check) and the plan's other 31 words: still accepted (it begins with `y`, ends with `h`; no word of the table begins with `h` or ends with `y`, and no suffix of `youth` — h, th, uth, outh — begins another word).
8. **Section 6 (hosts)**: unchanged; the chapter needs one code lane and the art budget of one painter lane.

## 11. Open questions, and what a live check would settle

1. **Defeat, retry and Flee** (section 8): what HP the exit leaves, whether beaten acts repeat, whether Flee is offered. *Settle by:* the formation flag columns of `btl.txt` through Ghidra read-only GETs (the FFX-2 server), or a live play of the Youth League path with a deliberate loss.
2. **Yaibal's Phoenix Down on a KO'd Yuna and the Hi-Potion on her** are read from the script. *Settle by:* a live play (let Yuna fall in the first act) or the engine's first test (preflight T0).
3. **The party level at the real tournament**: the game sets none; the players' levels at Mushroom Rock Road in Chapter 5 vary. The sourced Chapter 5 band is 43 to 52 [note: ffx2-combat-core 5.1b]; the preset `farplaneBuild` is 46 / 48 / 50. No source gives a tournament-specific build; `[estimate]`.
4. **Row 211's Critical Attack on "the lowest-HP girl"** means the lowest current HP, not the lowest fraction (`stat_hp min`); read from the script, unmapped as to ties.
5. **The "thinking byte"** (30 for Yaibal, the Warrior, Veteran, Slasher, Mage, Master; 10 for Elma 279; 0 for Lucil) and the **bgm number 879** are unmapped.
6. **The Doom counter's real length** at the girls' speeds: counter 4 of 10,000 units by the engine's duration model; the engine's own `doomTurns` reading is the Maesters note's open item.

## 12. Notes cited

In the repo (`research/` and `src/` on `origin/main` 4310f6b63): `re-ffx2-damage.md`, `re-ffx2-commands.md`, `re-ffx2-hit-status.md`, `re-ffx2-atb-status.md`, `re-ffx2-ai-leblanc-den-ixion.md`, `re-ffx2-fallen-maesters.md`, `ffx2-combat-core.md`, `ffx2-gippal-den-of-woe.md`, `ffx2-vegnagun-shuyin.md`, `ffx2-leblanc-syndicate.md`; `src/data/ffx2/builds/farplane.ts` and `den-of-woe.ts`, `src/data/ffx2/enemies/den-of-woe*.ts`, `src/battle/ffx2/ai/den-of-woe.ts`, `leblanc-syndicate.ts`, `script-rolls.ts`, `src/battle/ffx2/targeting.ts`. Guides read 2026-11-06: Jegged (Chapter 5 and Chapter 1 Mushroom Rock Road), Gamer Guides (Chapter 5 "Mushroom Rock", "Mushroom Rock - Youth League", Chapter 2 "Mushroom Rock", the Colosseum Youth League Cup), DrSlice (Chapter 5 Mushroom Rock), Samurai Gamers (Mushroom Rock part). Kept outside the repo (the lane's scratch space): `tools/` (archive reader, row and formation parsers, source-vs-binary check, event disassembler, event hash, move lister, cadence, `calc-42.mjs`), `data/` (rows, dumps, move table, calc output, the event disassembly, the scene scan, hashes), `web/` (the guide pages as text, read only).
