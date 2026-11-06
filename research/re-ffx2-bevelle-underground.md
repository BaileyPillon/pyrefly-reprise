# FFX-2 Bevelle Underground guardians (Georapella, Precepts Guard, Baralai) read from the game's own files: the rows, the floor-3 and floor-7 fights, the AI scripts and the Oversoul variants

**Game case: FFX-2 only.** The three monsters are rows of the FFX-2 kernel tables `battle/kernel/monster.bin` (and `monster2.bin`, the Oversoul block): Georapella row 262, Precepts Guard row 263, Baralai (the first, living one) row 175. The fights are the scenes `stbv03_228` (Georapella), `stbv03_227` (Precepts Guard) and `stbv06_229` (Baralai). Nothing here applies to FFX: the FFX Via Purifico guardians (Geosgaeno, Evrae Altana, plan row 36) are different monsters in a different engine; the only thing the two games share is that the FFX-2 script carries the developer label of the FFX monster (section 2).
Written 2026-11-06 by a Sonnet sub-agent of the release driver (the chapter program's plan, row 37). **Treeless research: no repo file, no art, no engine or data file is changed; nothing deployed.** Nothing in the game folder was changed, the game was not run, no browser, no GPU, Ghidra was not used. Authority (relayed words, verbatim): 2026-11-06 ~00:30 EST "implement all unimplemented chapters please"; ~00:55 EST "yes on all these too"; 2026-10-31 "you make the executive decisions for the next few days. i'll go with all of your recommendations." Every pick named here is a recommendation, "driver's call, his to overturn".

**What is in this note:** numbers read from the owner's own Steam copy. Monster, item and move names appear only as identifiers (the game's own English name tables are how the rows were found). No descriptions, dialogue, script lines, decompiled code or raw byte dumps; where a developer label matters it is translated in a few words and the file line is given instead.

**Tags.** **[R]** read from a game file or from the shipped plain-text AI source / compiled script by this note's tools (named); **[E]** emulated or run (nothing in this note); **[I]** inferred from the above or from an earlier checked note, not read directly; **unmapped** the value is given raw and no meaning is claimed (AGENTS.md hard rule 6). Engine rules (how a monster is polled, the random streams, the search macros, the damage formulas, the status landing rule, the turn cadence) are taken from the earlier checked notes and cited as `[note: file section]`.

## Summary for the driver

1. **Three fixed, once-per-save fights in the Bevelle Underground.** Georapella and Precepts Guard (both floor 3, after separate cutscenes) are launched by the floor-3 map package `stbv0300` (first launch sites: worker 35, functions 3 and 2; three more call sites in other workers were not read); Baralai (the normal one, row 175) by the floor-7 package `stbv0700` [R: scene-constant scan of 669 event packages, then the floor-3 package read with the event disassembler]. Each sets a saved bit when the battle returns, so each happens once [R for Precepts Guard bit 0x80 of save word v10[0] and Georapella bit 0x01 of v10[1]; I for "once": the bit also gates the fight, the same shape as the Maesters floors]. The launch passes battle-flags word 1,280 (0x500) for both floor-3 fights [R]. The story counter the package tests (values 2,760 to 2,900) is unmapped.
2. **Records.** Georapella Lv 17, HP 4,420, MP 9,999, STR 62 DEF 38 MAG **1** MDEF 62, AGI 74; Precepts Guard Lv 21, HP 3,680, MP 9,999, STR 32 DEF 62 MAG 34 MDEF 38, AGI 63; Baralai Lv 24, HP 3,380, MP 540, STR 71 DEF 42 MAG 54 MDEF 4, **AGI 135, Evasion 33**. Georapella and Precepts Guard null Gravity and are **weak to Holy**; both are immune (255) to Death, Petrify, Sleep, Silence, Darkness, Poison, Confusion, Berserk, Curse and Eject, Georapella also to Stop and Doom, Precepts Guard also to Slow, Stop and Doom (section 4.2). Baralai is weak to nothing, nulls Gravity, and unlike the shade (row 176) **can be blinded** (Darkness is not in his resist list).
3. **The AI is small and exactly readable** (section 6). Georapella: a fixed four-spell cycle of party-wide Ga spells (Thundaga, Waterga, Firaga, Blizzaga in that order) that starts at a random point of the cycle; its MP is 9,999 so the "Osmose below 25 MP" line never fires in practice. Precepts Guard: per poll Demi (a quarter of every girl's current HP) one time in three, otherwise a draw of five between Slow on the party, Death on one girl, Osmose, Drain, and Bio (which is queued before a Drain). Baralai: a seven-poll cycle (Attack, Attack, Glint on the party, three Chain Attacks, Attack, Looming Glacier, then Demi on the party or an Attack), **plus a hit counter: after 10 results applied to him the next poll is Drill Shot, 75 percent of the target's maximum HP**, and below a quarter of his HP a one-in-four extra Absorb.
4. **Five things the wiki-level descriptions do not say.** (a) **Drill Shot is formula 7, power 12: 12/16 = 75 percent of the target's *maximum* HP, no defence term, no variance** (Protect halves it, being a physical-only row); the target is the girl whose result was the latest one on Baralai, else a random living girl. The counter here is **10** (the Den of Woe shade, row 176, is 8: `research/ffx2-gippal-den-of-woe.md` G-5 chose 8 and said the guides repeat the Bevelle number, which this file now confirms as 10 [R]). (b) Georapella's MAG is **1**: its Ga spells hit with an attacker term of 197 only (power 19, `(MAG + 2L) x P x P / 64`), so they are a modest tax, not the killer; the party is paid back by its 4,420 HP and a 3.3 s charge. (c) **Looming Glacier takes all of the target's maximum MP (formula 7, power 16, MP class) and Stops her (Stop 254, counter 126)**, aimed at the girl with the most MP among those not already stopped. (d) **Georapella can be Slowed, Precepts Guard cannot** (Slow is in its resist list), and both guardians **take ATB damage and can be interrupted** (special bits 6 and 9 clear; Baralai has both set, so he cannot). (e) **The Oversoul scripts `o262` and `o263` exist but their families have a single member each (kill counts 4 and 6)**, so the Oversoul version cannot be reached in a normal run [I]: do not build it (section 4.4).
5. **Row 176 (the Den of Woe Baralai) is already built** (chapter 15, `src/battle/ffx2/ai/den-of-woe.ts`). The plan's row 37 text "Baralai row175 / row176" therefore means one new fight (row 175) and one existing one: **only row 175 is new.** Its script is the same shape as the shade's with a simpler cycle and no Regen/Silence/Guard branch, so the existing Baralai code is the template [R: both scripts read; ids of the two compiled workers equal their sources].
6. **Engine (section 9).** Almost everything exists. New: three enemy records and their move rows as data; the hit counter (a small variant of the existing burst counter, threshold 10 and aimed at the latest attacker); a three-spell cycle with a random start; the Precepts Guard double-queue (Bio then Drain). **Reflect redirect is not built in the engine** (known gap, `docs/handoff/ch-maesters.md` T0 finding 1): the guardians' Ga spells are reflectable, so a Reflect on a girl is inert here. No build is proposed.
7. **Open questions and what settles them are in section 10.** The ones that change a pick: which party level the floors 3 and 7 expect (the build is the Bahamut chapter's, Yuna 23 / Rikku 24 / Paine 25, an `[estimate]` for these earlier floors), and whether the player may use Reflect against the Ga spells.

## 0. Result in one screen

| Row (0-based) | Id | Name in the game's own table | Fixed fight | Lv | HP | MP | AGI |
|---|---|---|---|---:|---:|---:|---:|
| **262** | 0x1106 | Georapella | floor 3, scene `stbv03_228` (0x02cc00e4) | 17 | 4,420 | 9,999 | 74 |
| **263** | 0x1107 | Precepts Guard | floor 3, scene `stbv03_227` (0x02cc00e3) | 21 | 3,680 | 9,999 | 63 |
| **175** | 0x10af | Baralai | floor 7, scene `stbv06_229` (0x02cf00e5) | 24 | 3,380 | 540 | 135 |
| (176) | 0x10b0 | Baralai (Den of Woe) | `kino13_227`, **already built** | 52 | 12,220 | 720 | 112 |

Source for the table: `monster.bin` rows at file offsets 0xccd0, 0xcd98, 0x88d8 and 0x89a0 [R: `rows.mjs`, this lane's parser, the same 200-byte layout as the Maesters note]. Floors from the event packages (section 5.3).

## 1. Source block

| Item | Value |
|---|---|
| Archive | `FFX2_Data.vbf` (Steam HD Remaster, FFX-2 half; the owner's own install, build 25501027) read with our own node VBF reader, unpacked read-only into a scratch folder outside the repo by the lane's `x2read.mjs` (it refuses any other output folder) |
| Kernel tables [R] | `ffx_ps2/ffx2/master/jppc/battle/kernel/monster.bin` (96,596 bytes, SHA-256 starts 50964278e7b164e6), `monster2.bin` (87,842; 9327e6571d2f92ac), `monmagic.bin` (85,222; 35b432bbbec34bac), `command.bin` (90,359; 6099fcff08194360), `item.bin` (12,748; e7896df7ac6650bf), `oversoul.bin` (726; 452649ec7b478c5b), `btl.txt` (781,815; a2a9d7e0a28559f7), `btl.h` (71,056; 342f38330880f2c4); the English copy `new_uspc/battle/kernel/monster.bin` (119,716; 1831faed8e5c6f5b) carries the name text. Same files, same hashes as `re-ffx2-fallen-maesters.md` section 1 (the 200-byte rows, row *i* at `0x20 + 200 i`) |
| AI sources [R] | `battle/mon/m262.src` (2,476 bytes; 460ab68f99399007), `m263.src` (3,260; c0fd096ceceb76bc), `m175.src` (5,567; 9b174efac9809cbc), `m176.src` (5,665; 8af10ca373365400, for comparison only), the Oversoul scripts `o262.src` (4,313; c8949bbf73acafcd) and `o263.src` (4,097; 244dbf26ce025cd4), the shared macros `y_mon01.src` (15,343; bc9a0eb56e907083) |
| Compiled packages [R] | `battle/mon/_m262/m262.bin` (169,888; d0858e7974fe1bb8), `_m263/m263.bin` (88,496; b3db81478f00f8ca), `_m175/m175.bin` (78,576; dd1b63d650ddabcb); disassembled with the earlier lane's `x2dis.mjs` (copied to `tools/`). **Worker layout:** for 262 and 263 (which have an Oversoul type) worker 0 is the Oversoul script, worker 1 the normal script; for 175 (no Oversoul type) worker 0 is the normal script and worker 1 the motion script |
| Scenes [R] | `battle/btl/stbv03_228/`, `stbv03_227/`, `stbv06_229/` (compiled scene package plus `pos_`, `scn_`, `evt_`, `cam_` sources); `battle/header/monster.ath` (symbols), `monmagic.ath`, `command.ath`, `item.ath` (command symbols) |
| Event packages [R] | `event/obj/st/stbv0300/stbv0300.ebp` (102,784 bytes), `stbv0700/stbv0700.ebp` (59,392) located by a scan of all 669 `.ebp` for the 32-bit scene constants; `stbv0300` disassembled with `ev-dis.mjs` and the measured argument-count table `nin-event.json` (both from the earlier FFX-2 experiment lane's tools) |

**Checks made on the sources:** for `m262`, `m263` and `m175` (and `m176`) the set of command ids the source queues equals the set in the compiled worker, the `random() % n` moduli are the same (262: 4; 263: 3 and 5; 175: 4) and the scene constant tested is the same one (`cmp-src-bin.mjs`, this lane). For the Oversoul scripts the same holds for `o263`; `o262` differs only in that the binary's growth thread uses a modulus of 100 where the source's action entry uses 6 (a different entry of the same worker; no effect on the normal fight).

## 2. How the rows were identified

1. **The game's own name table** (English copy): row 262 decodes to Georapella, 263 to Precepts Guard, 175 and 176 both to Baralai; no other row carries these names [R].
2. **The formation table** `btl.txt` (2,041 rows): `stbv03_228` (formation row 1415) holds row 262 alone; `stbv03_227` (1416) row 263 alone; `stbv06_229` (1436) row 175 with row 298 (a "WEAPON" prop, slot 5) [R]. The test rows `zzzz02_62`, `zzzz02_63`, `zzzz01_75` repeat the same monsters one by one (debug scenes).
3. **The developer labels** in `monster.ath`: row 262 is the symbol the developers also use for the FFX monster Geosgaeno (the script's title says "Geosgaeno thinking"), row 263 is "Guardian Beast 3" (the script is titled "Guardian Beast 3 thinking"; rows 162 and 361, the Guardian Beast of plan row 51, are the same family's earlier numbers), rows 175 and 176 "Baralai 1 (normal)" and "Baralai 2 (pyreflies)" [R]. This is what the wiki means by "they echo Geosgaeno and the Keeper": it is a naming echo; the script is its own.
4. **Cross-check against the ability list.** The record's technique list (+0x70) equals the AI's command set for all three except the death rows (the record lists the Die row, the script queues it from the death entry) [R].

## 3. Column map

The column map is the one of `re-ffx2-angra-mainyu.md` section 3 as used in `re-ffx2-fallen-maesters.md` section 3 (offsets from the start of the 200-byte row: +0x08 HP, +0x0c MP, +0x10 level, +0x11 to +0x18 STR, DEF, MAG, MDEF, AGI, ACC, EVA, LCK; +0x1a special word; +0x1c to +0x1f absorb, null, half, weak element bytes (bit 0 Fire, 1 Ice, 2 Thunder, 3 Water, 4 Gravity, 5 Holy); +0x20 group-1 and +0x38 group-2 resist bytes (255 immune); +0x50 and +0x54 automatic-status masks; +0x70 ability list of 16 u16; +0x98 Oversoul type; +0x9c EXP, +0xa0 Gil, +0xa4 Pilfer Gil, +0xa8 AP, +0xaa drop chance byte, +0xab steal chance byte, +0xac drop items, +0xb4 steal items, +0xbc bribe items, +0xc4 Zantetsu byte). Special-word bits: 0 ratio (immune to percentage formulas), 1 damage-not-stop, 6 no ATB damage, 7 disable-Zantetsu, 8 Bribe, 9 magic-cancel (immune to Interrupt).

## 4. The rows (`monster.bin`; every proved column)

### 4.1 Numbers

| Field | **Georapella (262)** | **Precepts Guard (263)** | **Baralai (175)** |
|---|---:|---:|---:|
| File offset of the row | 0xccd0 | 0xcd98 | 0x88d8 |
| Level | 17 | 21 | 24 |
| HP / MP | 4,420 / 9,999 | 3,680 / 9,999 | 3,380 / 540 |
| STR / DEF | 62 / 38 | 32 / 62 | 71 / 42 |
| MAG / MDEF | **1** / 62 | 34 / 38 | 54 / 4 |
| AGI / ACC / EVA / LCK | 74 / 95 / 0 / 0 | 63 / 95 / 0 / 0 | **135** / 95 / **33** / 4 |
| Thinking byte (never read) | 20 | 20 | 0 |
| Special word | 0x183 | 0x183 | 0x3c3 |
| Special bits set | 0, 1, 7, 8 | 0, 1, 7, 8 | 0, 1, 6, 7, 8, 9 |
| Element bytes (absorb / null / half / weak) | 0 / **0x10** / 0 / **0x20** | 0 / **0x10** / 0 / **0x20** | 0 / **0x10** / 0 / 0 |
| Reading | null Gravity, **weak Holy** | null Gravity, **weak Holy** | null Gravity |
| Automatic status g1 / g2 masks | 0 / 0 | 0 / 0 | 0 / 0 |
| Oversoul type | 0xa02b (family kill count 4) | 0xa020 (kill count 6) | none |
| EXP / Gil / Pilfer Gil | 800 / 1,000 / 1,300 | 700 / 800 / 1,600 | 1,000 / 1,300 / 2,000 |
| AP | 1 | 1 | **10** |
| Drop byte (255 = always) | 255 | 255 | 255 |
| Drop, common / rare (id) | NulTide Ring 0x902e x1 / the same | Regen Bangle 0x905a x1 / the same | Pearl Necklace 0x904e x1 / the same |
| Steal byte; items (id) | 128; Water Gem 0x2024 x1 / x2 | 128; Mana Tablet 0x203a x1 / x2 | 255; Charm Bangle 0x9072 x1 / the same |
| Bribe slots | none | none | none |
| Zantetsu byte | 80 | 100 | 100 |
| Model id / motion id | 0x1106 / 0x1106 | 0x1107 / 0x1107 | 0x10af / 0x10af |

Steal rule [note: re-ffx2-ai-leblanc-den-ixion.md 1.9]: a success is `draw % 255 < byte`, so a byte of 128 succeeds on half the attempts, 255 always; the rare slot is taken on 12.5 percent of successes; the Pilfer Gil figure pays 50 to 100 percent of itself, once. Drop byte 255 always drops. **Item ids are read from the rows and named from the US item, accessory and important tables** (`tools/idnames.mjs`): the Maesters handoff listed "no id in any table of this repo" for such names; the ids here fill that gap for these three (0x902e, 0x905a, 0x904e, 0x9072, 0x2024, 0x203a). The weapon props are row 298 ("WEAPON", HP 1, no script action) for Baralai's staff [R].

### 4.2 Status resist bytes (255 = immune; every index not listed reads 0 and so lands)

**Group 1** (index meanings [note: hit-status 4; 17 and 18 are Itchy and Auto-Life]): Georapella and Precepts Guard: 255 at **0 Death, 1 Petrify, 2 Sleep, 3 Silence, 4 Darkness, 5 Poison, 6 Confusion, 7 Berserk, 8 Curse, 10 Eject, 17 Itchy, 18 Auto-Life**. Baralai (175): the same **except Darkness (4) reads 0**: he can be blinded; Death 255, Eject 255. (The Den of Woe shade, row 176, has Darkness at 255.)

**Group 2:** Georapella: 255 at **6 Stop, 14 Doom** (**Slow lands**, Shell, Protect, Reflect, Regen, Haste, every stage 7 to 13 read 0). Precepts Guard: 255 at **5 Slow, 6 Stop, 14 Doom**. Baralai: 255 at **5 Slow, 6 Stop, 14 Doom**; all seven stat stages land on all three.

A command whose chance byte is 255 lands even through a resist of 255; one at 254 does not (the landing rule [note: hit-status 4.1]). So the girls' Death spells and Petrify do not work on any of the three; Darkness works on Baralai (and darkens his Attack, accuracy formula 2, but not his other rows); Slow works on Georapella only.

### 4.3 Ability lists (+0x70) against the commands the AI queues

| Row | The record's list (in order) | What the compiled AI queues | Difference |
|---|---|---|---|
| 262 Georapella | 0x41f1 Firaga, 0x41f2 Blizzaga, 0x41f4 Waterga, 0x41f3 Thundaga, 0x406d Osmose, 0x40de Die | the same six (the Die row from the death entry) plus the generic time-out rows | none |
| 263 Precepts Guard | 0x3082 Demi, 0x406d Osmose, 0x3085 Bio, 0x3087 Death, 0x406c Slow, 0x3081 Drain, 0x40dd Die | the same seven | none |
| 175 Baralai | 0x41da Attack, 0x4100 Chain Attack, 0x4101 Glint, 0x4102 Looming Glacier, 0x4103 Drill Shot, 0x3082 Demi, 0x4040 Absorb | the same seven | none |

### 4.4 The Oversoul block (`monster2.bin`, same rows) and why it is out of reach

| Field | **Georapella (262)** | **Precepts Guard (263)** |
|---|---:|---:|
| Level / HP / MP | 24 / 6,641 / 9,999 | 33 / 7,864 / 9,999 |
| STR / DEF / MAG / MDEF | 62 / 38 / 12 / 62 | 78 / 62 / 34 / 38 |
| AGI / ACC / EVA / LCK | 96 / 95 / 0 / 0 | 82 / 95 / 0 / 0 |
| Automatic status g1 | 0x2000 (slot 13, Use MP 0) | 0x2000 |
| Resist differences | + Stage STR 255 | + Stage MAG 255 |
| EXP / Gil / Pilfer / AP | 1,600 / 1,500 / 3,000 / 2 | 1,500 / 1,200 / 3,600 / 2 |
| Drop / steal | Water Gem x3 / x4; steal byte 255, Short Circuit x1 | Mana Tonic x3 / x4; steal byte 255, Recovery Bracer x1 |
| Record list | Attack, Firaga, Blizzaga, Waterga, Thundaga, Power Catalyst | Attack, Magic Catalyst, Anti-Dressphere, Fire, Water, Blizzard, Thunder, Die |

[R: `monster2.bin` rows at the same offsets.] The family table `oversoul.bin` gives **Georapella's family (type 0xa02b) a kill count of 4 and Precepts Guard's (0xa020) a kill count of 6**, and **each family has exactly one member in the 370 rows** (a scan of the Oversoul-type column). The switch rule (a family counter that rises by one per KO of a member, capped at the count, read in `re-ffx2-fallen-maesters.md` 9.1) therefore needs 4 (6) earlier KOs of the very same monster; each is fought once per save at one fixed place. **The Oversoul version cannot occur in a normal run** [I; the counter's lifetime is itself I in the Maesters note]. The Oversoul scripts are paraphrased in section 6.7 only so that nobody wonders what they do. **Do not build them.**

## 5. The formations and the scenes

### 5.1 The rows (`btl.txt`; file lines 1-based) [R]

| Formation row | Name | File line | Scene constant | Slots | Scale | Battle map (translated label) |
|---|---|---:|---|---|---:|---|
| 1415 | `stbv03_228` | 1427 | 0x02cc00e4 | slot 1 row 262 | 100 percent | "Under-Bevelle exterior" |
| 1416 | `stbv03_227` | 1428 | 0x02cc00e3 | slot 1 row 263 | 100 | the same |
| 1436 | `stbv06_229` | 1448 | 0x02cf00e5 | slot 1 row 175, slot 5 row 298 (prop) | 100 | "artificial parts" |
| (1807) | `kino13_227` | 1819 | 0x02c500e3 | slot 1 row 176, slot 5 row 202 (prop) | 100 | "natural parts b" (the Den of Woe) |

The six flag columns are all clear (no special rule) for all four. The neighbours in the same family are the Bahamut floor (`stbv05_229`, row 168, "before the Great Existence"), the ordinary encounters (`stbv03_040` ... `_084`, `stbv06_020` ... `_084`) and the floor-3 fights of row 46 (YSLS-99: `stbv03_226`, `_225`, `_223`) and row 47 (YSLS-Zero: `stbv03_224`; the plan's row 51 monster).

### 5.2 The scenes

* **`stbv03_228` (Georapella)** ships a start-position file: the three girls at (-43, 0, 29), (-50, 0, 10), (-27, 0, 43), Georapella at (4.4, 0, -3.2), no escape positions [R: `pos_stbv03_228.psc`]. It is the only one of the three with positions; the `searchr` near-weighting of Georapella's single-target Osmose therefore has real inputs (it practically never fires).
* **`stbv03_227` (Precepts Guard)** and **`stbv06_229` (Baralai)** ship empty position files: the other chapters' lanes used a named constant of a neighbouring scene as an `[inferred]` stand-in; here the same family neighbour `stbv03_228` for 227, and the Bahamut scene `stbv05_229` for 229, are the obvious ones, flagged as such.
* The three scene scripts carry no battle-specific code (the compiled scene packages are 2,188, 2,060 and 51,136 bytes; the 51,136-byte one is the shared big package every scene of that size has).

### 5.3 Where they are launched [R: event packages; R/I as marked]

| Package | Fight | What was read |
|---|---|---|
| `st/stbv0300/stbv0300.ebp` | Precepts Guard (0x02cc00e3) at offset 0x86b9 and 0xd420; Georapella (0x02cc00e4) at 0x87f5, 0xe8cd and 0xe919 | the battle-start call (`call_7002(scene, 0)`) after a camera/cutscene block; flags word 1,280 is passed first; the saved bit 0x80 of `v10[0]` is set after the Precepts Guard fight returns and bit 0x01 of `v10[1]` after Georapella's; the story counter `v0` is tested against 2,760 / 2,800 / 2,810 / 2,900 (unmapped) |
| `st/stbv0700/stbv0700.ebp` | Baralai 1 (0x02cf00e5) at 0xd70 (first hit of the constant) | not disassembled (time box) |
| `te/testbattle/testbattle.ebp` | the debug menu lists all of them | not read further |

The offsets above are script offsets of the disassembly. The first launch sites of the two floor-3 fights are two functions (2 and 3) of one worker (number 35) of the map package, Precepts Guard's first in the file; the three later call sites (0xd420, 0xe8cd, 0xe919, in other workers) and the order in which the player meets the two were not worked out (the branch tests are on the story counter and on the saved bits) [open, section 10]. **The build point is Chapter 2** in story terms: the existing `src/data/ffx2/builds/bevelle.ts` header says the Bahamut fight at the bottom of this dungeon is "Chapter 2, Limbo" by three independent sources and that the chapter label stays 4 [note: repo `bevelle.ts` header].

## 6. The AI scripts (normal versions)

### 6.1 Engine rules used

How a monster is polled, the random streams, the search macros and the generic "battle too long" block are as in `re-ffx2-ai-bahamut-vegnagun.md` 1.1 to 1.7 and `re-ffx2-fallen-maesters.md` 7.1: a poll is one call of the action entry; **`random() % n`** uses stream 2 (the low 16 bits of one draw); **`searchr`** keeps the living, targetable girls (a petrified girl counts as living) who pass the stat test and picks one **near-weighted** by distance and facing (stream 4), **`searchr_nop`** picks uniformly in slot order (stream 4); with one candidate nothing is drawn; no candidate gives "nothing"; `chr_own_target` is the candidate set of the last search; `max` keeps all candidates tied for the extreme. The reaction entry runs once per result applied to the monster by anyone but itself, after the HP and statuses are in; `getreaction` is true unless the monster is stopped, asleep, petrified, confused, berserk or ejected [note: bahamut 1.5]. A command queued by `setdircom` goes on the monster's queue; a poll that queues two commands runs both without a new poll in between [note: leblanc-den-ixion 1.4].

### 6.2 Georapella (`m262`, scene `stbv03_228`) [R: m262.src 14-130, compiled worker 1]

* **Start:** the "do-nothing" death pattern (the developer comment next to it says pyreflies), shadow off; one draw `random() % 4` stores the attack counter (0 to 3) at battle start.
* **Each poll:** (1) the time-out block (6.5), inert. (2) **If its MP is below 25** (never in practice: 9,999 MP, 24 per cast; reachable only if the girls drain MP): **Osmose** on the living girl with the most MP (**corrected in section 12, item 6: no discarded first search here**; the tied-highest, searched near-weighted). (3) Otherwise the counter gains 1 and: 1 = **Thundaga**, 2 = **Waterga**, 3 = **Firaga**, anything else (4) = counter back to 0 and **Blizzaga**, each **on the whole party**.
* **So the order is Thundaga, Waterga, Firaga, Blizzaga, repeating, and which one comes first is the start draw:** start 0 gives Thundaga first, 1 Waterga, 2 Firaga, 3 Blizzaga, each 25 percent. There is no other move: no Attack, no status, no heal.
* The reaction, menu and targeted entries are empty; the death entry queues the Die row if the death-reaction flag is on.
* **Weak to Holy** and null Gravity (4.1). Slow lands on it (4.2), which doubles the interval between its spells.

### 6.3 Precepts Guard (`m263`, scene `stbv03_227`) [R: m263.src 14-176, compiled worker 1]

* **Start:** the "do-nothing" death pattern (the developer comment next to it says the body falls and cannot be Raised), shadow off. No state variable beyond the time-out ones.
* **Each poll, in order:** (1) the time-out block, inert. (2) **MP below 35** (never in practice): Osmose on the girl with the most MP. (3) **One draw `% 3`: 0 = Demi on the whole party** and the poll ends (33.3 percent). (4) Otherwise one draw `% 5` (call it r), then:
  * **r = 0:** if some girl lacks Poison, take the girls lacking Poison; among them a near-weighted pick of one who also lacks Reflect; if there is one, **Bio** on her (queued now). The poll then **continues** to the chain below.
  * **r = 1:** **Slow on the whole party**.
  * **r not 1:** if some girl lacks Reflect (a party-wide test), then: **r = 2 Death on one living girl (uniform), r = 3 Osmose on one living girl (uniform), r = 0 or 4 Drain on one living girl (uniform)**. If every girl has Reflect nothing is queued here.
* **So per poll (when no girl has Reflect and at least one lacks Poison):** Demi 33.3 percent; Slow 13.3; Death 13.3; Osmose 13.3; Drain 26.7 (half of these preceded by a Bio on a girl who lacks Poison and Reflect); Bio never appears alone. Death lands at chance 254 with accuracy formula 4 (the status kernel decides; a girl with Death-proofing is safe) [R row; the landing percentage is not recomputed here].
* The reaction, menu and targeted entries are empty; death entry as for Georapella.

### 6.4 Baralai, the first one (`m175`, scene `stbv06_229`) [R: m175.src 14-257, compiled worker 0]

* **Start:** death pattern "no Raise"; his staff (row 298, slot 5) is linked to his hand and a ninth actor to his armour slot (presentation).
* **State:** a turn counter (starts 0), the burst counter (starts 0).
* **Each poll, in order:**
  1. The time-out block (6.5), inert.
  2. **Below a quarter of his HP** (`HP < floor(max / 4)`, i.e. 844 or less; 3,380 / 4 = 845): one draw `% 4`; **0 = Absorb** (HP and MP together, power 3, absorbed by him) on a near-weighted living girl, **queued in addition to** this poll's normal command (no return).
  3. **If the burst counter is 10 or more:** it goes to 0 and **Drill Shot** is queued on **the girl who made the latest result on him if she is alive, else a near-weighted living girl**; the poll takes no cycle step.
  4. Otherwise the turn counter gains 1 and: **1 Attack, 2 Attack, 3 Glint** (the whole party), **4 Chain Attack x3** (see below), **5 Attack, 6 Looming Glacier**, **7 (the default branch) the counter returns to 0 and: if his MP is below 40 an Attack, else Demi on the whole party**. Attacks are on a near-weighted living girl.
  * **Chain Attack x3 (poll 4 of the seven)**: with exactly one girl alive, a plain Attack instead. With more than one: three Chain Attack commands queued at fixed girls: strike 1 Yuna (if not alive then Paine, else Rikku), strike 2 Rikku (else Paine, else Yuna), strike 3 Paine (else Yuna, else Rikku) [R: slot checks by name]. Each strike is power 12.
  * **Looming Glacier (poll 6)**: aimed at the girl with the most MP among those not already in Stop (a discarded search over the not-stopped girls, then the highest MP); drains all of her maximum MP and Stops her (254, counter 126).
* **Reaction entry:** if `getreaction` holds, the burst counter gains 1: **once per result applied to him by anyone but himself**, every landing strike, a miss or no-effect result counting one [note: leblanc-den-ixion 1.5; the same entry as the shade]. At 10 the next poll is the Drill Shot.
* **So the first polls are:** Attack, Attack, Glint, Chain x3, Attack, Glacier, Demi, then Attack, Attack, Glint ... a seven-poll cycle, interrupted by Drill Shot whenever ten results have landed on him since the last one. The cycle step is not advanced by the Drill Shot poll or by the Absorb extra.
* **Differences from the Den of Woe shade (m176):** no Regen, no Silence, no Not-So-Mighty Guard branch; the threshold is 10 (shade 8); the low-HP line is a quarter (shade a third); Looming Glacier here targets by MP among the not-stopped, as the shade's does.

### 6.5 The generic "battle too long" block (inert) [R]

Each of the three scripts starts its action entry with the block of the other FFX-2 bosses: past 180 / 190 / 195 / 200 actions in its own scene it would queue four message-only rows (0x4232 to 0x4235) and then the 12-hit random-target fixed Meteor (row 0x4236, formula 5, power 200, 9,999 a hit) on the party, **only in its own `stbv03` / `stbv06` scene** and only behind the guard "no girl is alive and unpetrified", which does not run in play [note: bahamut 1.6, leblanc 1.8]. Nothing to implement.

### 6.6 Random streams

`random() % n`: stream 2, the low 16 bits of one draw. Georapella draws `% 4` once at the start. Precepts Guard draws `% 3` per poll and `% 5` when Demi is not chosen. Baralai draws `% 4` per poll below a quarter of his HP. Searches: stream 4 (a draw only with two or more candidates). Hit rolls and variance use the per-character streams [note: bahamut 1.3, hit-status 1.1].

### 6.7 The Oversoul scripts (not buildable, paraphrased for completeness) [R: sources]

* **`o262` (Oversoul Georapella):** once, "Power Catalyst" on itself (row 0x41d5, a time-passing power-up), after which a free-running thread adds 1 to its **STR every 100th pass** (the pass counter wraps at 2,000). Each poll: the HP ratio (1.0 at full) sets a modulus `15 - 10 x ratio` (5 at full HP, up to 15 near death), one draw modulo it: 0 = Thundaga, 1 = Waterga, 2 = Blizzaga, 3 = Firaga (the party-scale player rows 0x30af, 0x30b0, 0x30ae, 0x30ad, power 21), anything else = **Attack aimed at the whole party**. At full HP that is 20 percent each; at half HP the four spells are 10 percent each and the Attack 60.
* **`o263` (Oversoul Precepts Guard):** once, "Magic Catalyst" on itself (row 0x41d6); once, "Anti-Dressphere" on the whole party (row 0x41a7, strips dress effects), and a second time under 5 percent HP. Each poll: modulus `10 x ratio + 4` (14 at full HP, 4 near death), 0 = Thunder, 1 = Water, 2 = Blizzard, 3 = Fire (party-wide, the basic spells of the record), else an Attack on a near-weighted living girl. No Demi, Bio, Slow, Death or Drain.
Both would need the kill counter (a new engine seam) for no gain: **skip them**.

### 6.8 Turn cadence (normal versions; rule of `re-ffx2-fallen-maesters.md` 7.8)

Recovery after a command is `cost_atb x 10000 / (AGI + 1)` units, the charge before it fires is `cost_cast x 10000 / (AGI + 1)` units, 95 units a step at normal speed, 29.97 steps a second, steps rounded up; the first gauge is 25 to 74 percent of `70 x 10000 / (AGI + 1)` units, drawn once at the start; 30 more steps of thinking per dead or petrified girl [note: bahamut 1.1, timing-measured; angra-mainyu 9.11]. Animation time is on top and was not read. Computed by `tools/cadence.mjs`.

| Actor (AGI) | First gauge | Move | Charge (units, steps, s) | Recovery (units, steps, s) |
|---|---|---|---|---|
| Georapella (74) | 2,333 to 6,907 units, 25 to 73 steps, 0.83 to 2.44 s | the four Ga spells | 9,333, 99, 3.30 | 0 |
| | | Osmose | 12,000, 127, 4.24 | 0 |
| Precepts Guard (63) | 2,734 to 8,094 units, 29 to 86 steps, 0.97 to 2.87 s | Demi / Bio / Death | 12,500, 132, 4.40 | 0 |
| | | Slow / Osmose | 14,062, 149, 4.97 | 0 |
| | | Drain | 10,937, 116, 3.87 | 0 |
| Baralai 1 (135) | 1,287 to 3,809 units, 14 to 41 steps, 0.47 to 1.37 s | Attack | 0 | 7,352, 78, 2.60 |
| | | Glint | 14,705, 155, 5.17 | 0 |
| | | Looming Glacier | 10,294, 109, 3.64 | 0 |
| | | Drill Shot | 7,352, 78, 2.60 | 0 |
| | | Demi | 5,882, 62, 2.07 | 0 |
| | | Absorb | 7,352, 78, 2.60 | 2,941, 31, 1.03 |

Special bits: Georapella and Precepts Guard have bit 6 (no ATB damage) and bit 9 (immune to Interrupt) **clear**, so a delay or an Interrupt works on them; Baralai has both set [R]. Georapella's and Precepts Guard's bit 1 (a hit does not slow the gauge) is set, Baralai's too [R].

## 7. The moves (rows of `monmagic.bin` and `command.bin`)

Column meanings: `re-ffx2-commands.md` section 1. Damage class: bit 1 HP, bit 2 MP, bit 4 ATB. Accuracy formula: 0 always hits, 1 the race with the row's accuracy byte, 2 the race with the attacker's ACC [note: hit-status 2.1]. The attacker term is the formula's attacker side before the girl's defence term, the stages and the variance (240 to 271 out of 256) [note: damage 1]; level, STR and MAG are those of section 4. A physical-only row is reduced by Protect, a magical-only row by Shell.

| Move (user) | What it does | Type / accuracy / element | Statuses | Cost: recovery / charge / MP | Attacker term |
|---|---|---|---|---|---|
| **Firaga / Blizzaga / Thundaga / Waterga** 0x41f1 / f2 / f3 / f4 (Georapella) | whole party, formula 2, power 19, shatter 20 | magical; always hits; reflectable and silenceable; Fire / Ice / Thunder / Water | none | 0 / 70 / 24 | `(1 + 34) x 361 / 64` = **197** |
| **Osmose** 0x406d (Georapella, Precepts Guard) | MP class (2), formula 4, power 3: 3/16 of the target's current MP, taken by the user | no type; always hits; reflectable | none | 0 / 90 / 0 | percent of current MP |
| **Demi** 0x3082 (Precepts Guard, Baralai) | whole party, formula 4, power 4: **25 percent of each girl's current HP** | magical; Gravity element (null on Gravity-immune); not reflectable | none | 0 / 80 / 10 | percent of current HP |
| **Bio** 0x3085 (Precepts Guard) | whole party, no damage | magical; reflectable | Poison at 100 | 0 / 80 / 16 | none |
| **Slow** 0x406c (Precepts Guard) | whole party (the row is single, the AI aims it at the group), ATB class, formula 4, power 16 | magical; reflectable | Slow 130, counter 126 | 0 / 90 / 8 | percent of the target's ATB pool |
| **Death** 0x3087 (Precepts Guard) | one girl | magical; reflectable; accuracy formula 4 | Death at 254 | 0 / 80 / 24 | none |
| **Drain** 0x3081 (Precepts Guard) | formula 9 (special magic), power 12, one girl, absorbed by the user | magical; reflectable | none | 0 / 70 / 8 | `((34 + 21) x 34 x 21) / 1024 + 34` = 72, x12/16 |
| **Attack** 0x41da (Baralai) | 1 hit, power 16, formula 0 | physical; race with ACC; crit 5 percent; shatter 10; Darkness cuts it | none | 100 / 0 / 0 | `((71 + 24) x 71 x 24) / 1024 + 71` = **229** |
| **Chain Attack** 0x4100 (Baralai) | 1 hit, power 12, formula 0, one girl; queued three times | physical; always hits (accuracy formula 0) | none | 0 / 0 / 0 | 229, x12/16 |
| **Glint** 0x4101 (Baralai) | whole party, formula 0, power 20 | physical; always hits | none | 0 / 200 / 0 | 229, x20/16 |
| **Looming Glacier** 0x4102 (Baralai) | MP class, formula 7, power 16: **all of the target's maximum MP** | no type; always hits | **Stop 254, counter 126** | 0 / 140 / 0 | percent of max MP |
| **Drill Shot** 0x4103 (Baralai) | formula 7, power 12: **75 percent of the target's maximum HP**, no defence, no variance, physical-only | physical; always hits; not crit | none | 0 / 100 / 0 | percent of max HP |
| **Absorb** 0x4040 (Baralai) | HP and MP together (class 3), formula 4, power 3, absorbed by him | no type | none | 40 / 100 / 0 | percent of current HP and MP |

Percent formulas: formula 4 is `P x current / 16`, formula 7 is `P x maximum / 16` [note: damage 1]. Positive formula 4 and 7 results are zeroed against a target with special bit 0 (the girls have none).

## 8. Against the wiki-level descriptions and the repo's notes

| Statement | The files |
|---|---|
| Wiki / candidates note: "they echo Geosgaeno and the Keeper" | **a naming echo only** (the FFX-2 script carries the FFX monster's developer label; the behaviour is its own, section 6) |
| Baralai (Bevelle): "Drill Shot after ten hits" (guides; also the Den of Woe note G-5 "the guides repeat the Bevelle number") | **agrees: 10 here, 8 for the shade** |
| Candidates note, row 37 text: "Drill Shot after a hit count: hooks exist" | **agrees**; `ai/den-of-woe.ts` already counts results per attacker for the shade and aims the Drill Shot at the latest attacker |
| Wiki: Georapella "casts the elemental Ga spells in rotation" | **agrees** and adds that the first spell is a random point of the rotation (start draw) |
| Wiki: Precepts Guard "casts Demi, Death and Slow" | **agrees**; adds Osmose, Drain and the Bio-before-Drain double queue, and the exact 1/3, 2/15 ... weights |
| Repo `research/ffx2-gippal-den-of-woe.md`, Rikku's "1/3 Normal Attack" (a different row, section for row 40) | not this note's subject |

**The repo already holds** the Bahamut chapter's party (`src/data/ffx2/builds/bevelle.ts`, Yuna 23 / Rikku 24 / Paine 25), a `bevelle-underground` scene and plate, a `baralai-shade` painting and the shade's AI. There is no data or AI code for rows 262, 263 or 175 in `src` on `origin/main`.

## 9. What our engine would need (origin/main `cd4aee3ce`; no build)

**Existing and enough:** an AI script per actor registered by id (`src/battle/ffx2/ai/index.ts`, `SCRIPTS`; pattern `ai/den-of-woe.ts`, `ai/fallen-maesters-a.ts`); near-weighted and uniform searches, `lacking(status)`, a highest-MP pick, `% n` draws (`ai/script-rolls.ts`); the result-counting reaction hook with the latest attacker (`AiScript.onResults`, used by the shade's Drill Shot, `den-of-woe.ts` D3 and D4); two queued commands per poll (the shade's low-HP Regen is exactly this); the percent-of-current and percent-of-maximum formulas (4 and 7); Stop and Slow with counters; Poison; the Death status at 254; the Ga spells (magic, party-wide).

**New or to check:**

1. **Data rows** for 262, 263, 175: enemy defs (stats above), command records for Firaga/Blizzaga/Thundaga/Waterga (party-scale rows 0x41f1 to 0x41f4, power 19, MP 24), Osmose, Demi, Bio, Slow (monster version 0x406c), Death, Drain, the Baralai set (Chain Attack, Glint, Looming Glacier, Drill Shot, Absorb). Several already exist for the shade (0x4100 to 0x4103, 0x4040); verify by id, do not duplicate.
2. **Georapella's start draw and the four-spell rotation** (a counter state, S).
3. **Precepts Guard's chain** (the `% 3` then `% 5` draws; the Bio-then-Drain double queue; the "every girl has Reflect" gates). The Reflect gates read `lacking(girls, 'reflect')`; **the Reflect redirect itself is not built** in the engine, so a girl with Reflect is only a gate here (known gap; do not tune).
4. **Baralai 1's cycle and burst counter** at threshold 10 (a variant of the shade's script; S).
5. **Slow on a boss that lands** (Georapella) and **Interrupt / delay on bosses** (bits 6 and 9 clear): the ATB engine reads bit 6 and bit 1 from the record [Maesters handoff N8]; bit 9 (Interrupt immunity) should be checked.
6. **Item ids** (section 4.1) so the drops are real rows (kill-rewards pattern).
7. **A per-fight position set** for `stbv03_227` and `stbv06_229` (empty position files): use Georapella's positions as the named stand-in and flag it `[inferred]`.
8. **Chapter plumbing** (the 12 to 15 shared tables, PLAN section 7): one integrator commit per wave.

## 10. Open questions, and what a live check would settle

1. **Which of the two floor-3 fights comes first**, and what the story counter values (2,760, 2,800, 2,810, 2,900) mean. *Settle by:* reading the rest of worker 35 of `stbv0300` or a live walk of floor 3.
2. **The party the game expects here** (levels, dresspheres). Wiki-level: Chapter 2. The repo's `bevelleBuild` is the Bahamut build point (23 / 24 / 25); floors 3 and 7 are earlier in the same dungeon, so the levels there may be a few lower. *Settle by:* a live save at floor 3 (read the girls' levels) or leave the estimate flagged and measure (never tune a boss).
3. **Can the girls Slow Georapella and delay the guardians?** (4.2 and 6.8 say yes.) *Settle by:* one live attempt.
4. **Do the Ga spells bounce off a Reflect girl** (reflectable bit set)? The engine does not redirect (known gap). *Settle by:* the live game.
5. **The launch word 1,280** (0x500) and whether Escape is allowed in these fights [Maesters Q3 shape]. *Settle by:* open the Flee command on floor 3.
6. **Baralai 1's floor (7) launch** (`stbv0700`) was not disassembled: check whether it is preceded by a dialogue that changes the girls' state (Reflect, items) and whether the fight is skippable.
7. **Whether Precepts Guard or Georapella can be Interrupted in play** (bit 9 clear) and what bit 3 and bit 4 (unnamed in the game's header, set on none of the three) mean. Presentation or mapping gaps; none changes the AI above.
8. **What the Oversoul counter does between fights** (the Maesters note Q1/Q2) matters here only for the unreachable families; it is not needed.

## 11. Notes cited

In the repo (`research/` on `origin/main`): `re-ffx2-damage.md`, `re-ffx2-hit-status.md`, `re-ffx2-atb-status.md`, `re-ffx2-commands.md`, `re-ffx2-timing-measured.md`, `re-ffx2-ai-bahamut-vegnagun.md`, `re-ffx2-ai-leblanc-den-ixion.md` (sections 4.2 and 8 for the shade), `re-ffx2-ai-fallen-trema.md`, `re-ffx2-fallen-maesters.md` (the template and the Oversoul rule), `ffx2-gippal-den-of-woe.md`, `ffx2-bahamut.md`. Kept outside the repo (the lane's tools folder): `x2read.mjs` (archive reader), `rows.mjs`, `dump-rows.mjs`, `formations.mjs`, `scan-events.mjs`, `ffx2-src-moves.mjs`, `cmp-src-bin.mjs`, `cadence.mjs`, `sha.mjs`, `idnames.mjs`, copies of `x2dis.mjs`, `ev-dis.mjs`, `nin-event.json`; the data files in the lane's data folder (`rows.json`/`rows.tsv` for all 370 rows, `records-block1.txt`, `records-block2.txt`, `ev-stbv0300.txt`).

## 12. Corrections found by the chapter lane (2026-11-06, `docs/handoff/ch-bevelle-guardians.md`)

Added after the build read the three rows and the three shipped sources again; nothing above was changed.

1. **Baralai (row 175) can be poisoned as well as blinded** (section 4.2 and the summary name only Darkness): the row's group-1 byte for Poison (index 5) reads 0 as well. Pinned by `tests/fixtures/parity/ffx2/bevelle_guardians_rows.json` (`resist1` has no index 4 and no index 5 for `x2-baralai`).
2. **The Precepts Guard's Bio (section 6.3, r = 0)** goes to *any living girl without Reflect*, not to a girl who also lacks Poison: the source tests "does some girl lack Poison" with a search whose pick it throws away, then searches the living for a girl lacking Reflect. The Bio is then followed, in the same poll, by the Drain of the second block (r = 0 is not 1).
3. **Discarded searches draw.** Every `searchr` whose pick the script throws away (the Poison test, the Reflect test before Death, Osmose and Drain, the first search of the "most MP" pair) still draws from the search stream when it had two or more candidates. This changes which numbers come next, never what a move does.
4. **The count callout at nine is ours**, not the game's; the game shows no counter (BG4).
5. **Measured on the engine, not in the game:** Death (254, accuracy formula 4) landed on 30 of 30 seeds on a girl with no protection (the party has no Death-proofing and the engine has no Reflect redirect); Drill Shot is exactly `floor(max HP x 12 / 16)` with no variance (517 on Yuna, 1,379 on Rikku, 1,279 on Paine at the Chapter 2 levels), halved by Protect (the physical-only bit), not by Shell.
6. **Georapella's Osmose has no discarded first search** (section 6.2's "a discarded near-weighted search first" holds for the Precepts Guard and Baralai only; and correction 3's "the first search of the 'most MP' pair" names those two): `m262.src` lines 82 to 86 hold the single `searchr(chr_own_target, stat_mp, max)` and nothing before it, where `m263.src` 80 to 81 and `m175.src` 213 to 214 have a `searchr` first. The candidate set that lone search runs over is unread (nothing in `m262.src` sets it), so the engine takes the living girls, `[inferred]`; one draw only when two girls tie for the most MP. The branch is dead in play (9,999 MP, 24 a cast).
7. **Death's guard in the game is Reflect, worn by every girl**: `m263.src` 126 to 129 skips the Death, Osmose and Drain block only when no girl lacks Reflect ("everyone has Reflect"); the Bahamut preset's builds learn no Reflect (`src/data/ffx2/builds/bevelle.ts`), and the engine has no Reflect redirect, so in this chapter the story's words say only "raise her" (item 5).
