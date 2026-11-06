# FFX-2 "Yuna's Ballad": the possessed Rikku and Paine of the Den of Woe (rows 254 to 257) read from the game's own files

**Game case: FFX-2 only.** The two fights are the first two of the five back-to-back Den of Woe battles: possessed **Rikku** (row 254, scene `kino13_228`) and possessed **Paine** (row 256, scene `kino13_229`), each with a weapon prop row (255 twice, 257 once). The other three (Baralai row 176, Gippal row 177, Nooj row 258) are the already-built chapter 15. Nothing here applies to FFX.
Written 2026-11-06 by a Sonnet sub-agent of the release driver (the program plan, row 40). **Treeless research: no repo file, no art, no engine or data file is changed; nothing deployed.** The game was not run; no browser, no GPU, no Ghidra. Authority (relayed words, verbatim): 2026-11-06 ~00:30 EST "implement all unimplemented chapters please"; ~00:55 EST "yes on all these too"; 2026-10-31 "you make the executive decisions for the next few days. i'll go with all of your recommendations." Every pick named here is a recommendation, "driver's call, his to overturn".

**What is in this note:** numbers read from the owner's own Steam copy; monster, item and move names as identifiers only; no descriptions, dialogue, script lines, decompiled code or raw byte dumps. **Tags:** **[R]** read from a game file or the shipped AI source / compiled script by this note's tools; **[E]** emulated or run (nothing here); **[I]** inferred; **unmapped** raw value, no meaning claimed (AGENTS.md hard rule 6). Engine rules are taken from earlier notes, cited `[note: file section]`.

## Summary for the driver

1. **The plan's word "shades" is wrong for this row; they are the *possessed* friends, and the fight is Yuna against them.** The wiki-level repo note (`research/ffx2-gippal-den-of-woe.md` section 2 and 4.4) already says: Shuyin's pyreflies possess Rikku and Paine, who attack **Yuna alone** ("Yuna's Ballad"), then rejoin her, and then the shades of Baralai, Gippal and Nooj rise. The files agree on everything they can show: the two scripts are the girls' own names ("Rikku thinking", "Paine thinking") with the **fade-out death** (not the pyrefly dissolve of the shades), and both launches are the first two `call_7002` sites of the Den event, one after the other with no scene change [R, section 5]. **Whether the party is exactly one girl is not shown by any file I could read** (the scene position files are empty); it rests on the wiki, GamerGuides and Split_Infinity [wiki-level, 3 sources, from the repo note].
2. **Records.** Rikku Lv 53, HP 7,800, MP 92, STR 42 DEF 31 MAG 39 **MDEF 82**, AGI 82, ACC 95, **EVA 18**, LCK 12. Paine Lv 58, HP 9,200, MP 55, STR 56 **DEF 70** MAG 16 **MDEF 7**, AGI 51, ACC 95, EVA 0, LCK 10. Both null Gravity, are weak to nothing, immune (255) to Death, Petrify, Silence, Poison, Curse, Eject, Itchy, Auto-Life, Stop and Doom, **and can be put to Sleep, blinded, confused, enraged and slowed** (those bytes read 0) [R]. EXP 800, Gil 200, AP 3 each; drops Black Lore (0x9066) and Champion Belt (0x901a); steals Bushido Lore (0x9063) and Sword Lore (0x9062). **No Oversoul type** on either.
3. **Rikku's script is a one-line draw; Paine's has no draw at all.** Rikku, every poll `random() % 10`: **0 to 3 = a throwing item at one living girl** (Bomb Core Fire / Arctic Wind Ice / Lightning Marble Thunder / Dragon Scale Water, each **281 to 317**, constant), **4 and 5 = Grenade on the whole party (187 to 211)**, **6 to 9 = Spider Attack** (two hits of power 16). That is **40 percent Attack, 20 Grenade, 10 each for the four elemental items**; the wiki-level numbers in the repo note (1/3, 2/9, 1/9 x4: a draw of nine) are **slightly off the script's draw of ten** [R: `m254.src`, `random() % 10` in source and binary]. Paine: **Attack on the living girl with the most current HP, every poll**; with Yuna alone that is Yuna, and the note's "a second version only under Berserk" is the record's Berserk-attack field (row 256's +0x90 reads the plain Attack).
4. **Their record lists hold the *weak* versions of the items** (Rikku's list: Bomb Fragment, Electro Marble, Fish Scale, Antarctic Wind, Budget Grenade, formula 16 power 80 / 20 = **75 to 84 and 18 to 21**); the script throws the strong versions. The wiki's "under Confuse she uses the weak versions" is exactly the record list (a confused actor picks from its list) [R for the two lists; I for the confusion rule]. A chapter that wants this must let Confuse pick from the record list: a detail the Den shades never needed.
5. **Cadence is slow, especially Paine's.** Paine (AGI 51) recovers 203 steps (6.77 s) after every Attack; Rikku (AGI 82) 127 steps (4.24 s) after an Attack, and an item costs her 51 steps charge plus 51 steps recovery (1.70 s each). Rikku's damage is mostly **constant** (items 281 to 317, Grenade 187 to 211), so Yuna's own Defense and Shell/Protect only matter for Spider Attack and Grenade.
6. **Engine: the one new thing is a one-girl party.** `FFX2PartyBuild.members` is a fixed 3-tuple (`src/battle/common/types.ts:2969`); `setup.ts` builds units with `party.members.forEach` (`:295`) and `activeIds: party.members.map` (`:336`), so the core may accept a shorter list at run time, but the type, the HUD slots and the presenter's formation positions assume three [R: origin/main `cd4aee3ce`; T0 probe owed]. This turns the plan's "Engine: none" and 14 h filler into about 24 h. The AI itself is tiny (two scripts).
7. **The Den chapter is not touched.** Chapter 15 (the three shades) stays as it is; this row builds a separate hidden chapter (door word `wraith`, number 40) whose two links are the duels. Alternative (rejected as the default because it changes a shipped chapter and its measured bench): prefix Rikku and Paine as links 0 and 1 of chapter 15.

## 0. Result in one screen

| Row | Id | Name | Fight | Lv | HP | MP | AGI | Props |
|---:|---|---|---|---:|---:|---:|---:|---|
| **254** | 0x10fe | Rikku | `kino13_228` (0x02c500e4), slot 1 | 53 | 7,800 | 92 | 82 | row 255 in slots 5 and 6 |
| **256** | 0x1100 | Paine | `kino13_229` (0x02c500e5), slot 1 | 58 | 9,200 | 55 | 51 | row 257 in slot 5 |
| (255, 257) | 0x10ff, 0x1101 | WEAPON | props | 1 | 1 | 1 | 1 | no action, no cursor, not in battle |

Source for the table: `monster.bin` rows at file offsets 0xc690, 0xc758, 0xc820, 0xc8e8 [R: the lane's row readers].

## 1. Source block

| Item | Value |
|---|---|
| Archive | `FFX2_Data.vbf` (Steam HD Remaster, FFX-2 half, build 25501027), our node VBF reader, unpacked read-only into a scratch folder outside the repo by the lane's own reader |
| Kernel tables [R] | the hashes of `re-ffx2-fallen-maesters.md` section 1: `monster.bin` (50964278e7b164e6), `monster2.bin` (9327e6571d2f92ac), `monmagic.bin` (35b432bbbec34bac), `command.bin` (6099fcff08194360), `item.bin` (e7896df7ac6650bf), `btl.txt` (a2a9d7e0a28559f7) |
| AI sources [R] | `battle/mon/m254.src` (2,370 bytes; 11b4be0a0d5b83fa), `m256.src` (2,319; 29ee05888da5a38d), the props `m255.src` (970; f12b2d30fea40029) and `m257.src` (967; 0bfd76f45c198b04); for comparison `m176.src`, `m177.src`, `m258.src` |
| Compiled packages [R] | `_m254/m254.bin` (48,496; e77ffa11d1e3586e), `_m256/m256.bin` (46,688; 21afcc0fc40b6af8); neither has an Oversoul type, so **worker 0 is the normal script** (the layout rule of `fallen-maesters` 1) |
| Scenes and event [R] | `battle/btl/kino13_225` to `_229` (compiled scene packages 51,136 / 2,060 bytes, empty `pos_` files); `event/obj/ki/kino1300/kino1300.ebp` (97,472 bytes), disassembled with the lane's event disassembler and a measured argument-count table (kept outside the repo) |

**Checks:** for `m254` and `m256` the set of queued command ids equals the compiled worker's (Rikku 11 ids, Paine 6), the `random() % n` modulus is the same (Rikku 10, Paine none) and the scene constant tested (0x02c500e4 / 0x02c500e5) is the same [R: the lane's source-against-binary comparison].

## 2. How the rows were identified

1. **The English name table:** rows 254 and 256 decode to Rikku and Paine; rows 255 and 257 to WEAPON; no other row carries them [R].
2. **The formations** `kino13_228` (formation row 1806: slot 1 row 254, slots 5 and 6 row 255) and `kino13_229` (1805: slot 1 row 256, slot 5 row 257); the neighbours `kino13_227` (row 176 + prop 202), `_226` (row 177 + prop 204), `_225` (row 258 + prop 259) are the three already-built shades [R: the lane's formation reader]. Rows 254 to 261 also have debug scenes `zzzz02_54` to `_61`.
3. **The scripts' titles** read "Rikku thinking" and "Paine thinking"; the props "Rikku weapon thinking", "Paine weapon thinking" [R]. The repo note's `[estimate]` that the extra `Weapon[..]` formation entries "are almost certainly the bosses' weapon props, not targets" is now `[R]`: the prop scripts switch the actor's action, cursor, existence and in-battle flags off.
4. **The row for the plan's "shade rows to find in the kernel":** there are none; the Den's "shades" are rows 176, 177, 258. Rikku and Paine are rows 254 and 256.

## 3. Column map

As in `re-ffx2-fallen-maesters.md` section 3.

## 4. The rows

### 4.1 Numbers

| Field | **Rikku (254)** | **Paine (256)** |
|---|---:|---:|
| File offset | 0xc690 | 0xc820 |
| Level | 53 | 58 |
| HP / MP | 7,800 / 92 | 9,200 / 55 |
| STR / DEF | 42 / **31** | 56 / **70** |
| MAG / MDEF | 39 / **82** | 16 / **7** |
| AGI / ACC / EVA / LCK | 82 / 95 / **18** / 12 | 51 / 95 / 0 / 10 |
| Special word | 0x3c3 (bits 0, 1, 6, 7, 8, 9) | 0x3c3 |
| Elements (absorb / null / half / weak) | 0 / 0x10 / 0 / 0 | 0 / 0x10 / 0 / 0 |
| Reading | null Gravity | null Gravity |
| Automatic statuses | none | none |
| Oversoul type | none | none |
| EXP / Gil / Pilfer Gil / AP | 800 / 200 / 300 / 3 | 800 / 200 / 300 / 3 |
| Drop (id) | Black Lore 0x9066 x1 (both slots) | Champion Belt 0x901a x1 (both) |
| Steal byte 128; item (id) | Bushido Lore 0x9063 x1 | Sword Lore 0x9062 x1 |
| Bribe slots; Zantetsu byte | none; 80 | none; 80 |
| Model / motion id | 0x10fe | 0x1100 |
| Berserk attack (+0x90) | 0x40c7 Spider Attack | 0x4000 Attack |

Drop byte 255 always drops; the steal rule is `draw % 255 < byte` (128: half the attempts) [note: leblanc-den-ixion 1.9]. Special bits 6 and 9 are **set**: no ATB damage and no Interrupt (the delay-lock does not work on them); bit 1 (a hit does not slow the gauge) set; bit 8 (Bribe) set with no bribe items.

### 4.2 Status resist bytes

**Group 1 (255):** Death, Petrify, Silence, Poison, Curse, Eject, Itchy, Auto-Life. **Group 1 reads 0 (lands): Sleep, Darkness, Confusion, Berserk.** **Group 2 (255):** Stop, Doom; **Slow lands**; Shell, Protect, Reflect, Regen, Haste and all seven stat stages land (the same on both rows) [R]. This matches the repo note's "Sleep, Darkness, Confuse, Berserk, Slow land" for the pair (`ffx2-gippal-den-of-woe.md` section 3 table). It is what makes the duels answerable by Yuna alone: Sleep, Slow, Confuse and Berserk all land.

### 4.3 Ability lists (+0x70) against the commands the AI queues

| Row | The record's list | What the compiled AI queues | Difference |
|---|---|---|---|
| 254 Rikku | 0x40c7 Spider Attack, 0x2019 Bomb Fragment, 0x201f Electro Marble, 0x2022 Fish Scale, 0x201c Antarctic Wind, 0x2010 Budget Grenade | 0x40c7, **0x201a Bomb Core, 0x201d Arctic Wind, 0x2020 Lightning Marble, 0x2023 Dragon Scale, 0x2011 Grenade** (the strong versions) | the list holds the weak items; the AI throws the strong ones |
| 256 Paine | 0x41da Attack | 0x41da | none |

## 5. The formations and the launch

* **Scenes:** `kino13_228` and `kino13_229` (formation rows 1806 and 1805, file lines 1818 and 1817 of `btl.txt`), the map "natural parts b" (the Den), six flag columns clear, model scale 100 percent; **no start positions** (the `pos_` files are empty); compiled scene packages of 2,060 bytes [R].
* **Launch:** both from `event/obj/ki/kino1300/kino1300.ebp`. Script offset 0x5731: battle-flags word 1,281 (0x501, the unmapped word the Angra Mainyu level-5 and Via Infinito launches also pass), then the battle call for 0x02c500e4 (Rikku); after the return a block of presentation calls, then offset 0x5916 the call for 0x02c500e5 (Paine); the three shade launches follow later at 0x6244 (0x02c500e3 Baralai), 0x62e3 (…e2 Gippal), 0x6382 (…e1 Nooj) [R]. Before the first launch the script switches many actors off (a block of hide/disable calls for the cast ids 0 to 8 and 15 to 22), consistent with a reduced party [I]; **how it limits the party to Yuna was not decoded** (several unresolved calls surround the launches, for instance one with the arguments 3 and 0 right after the Rikku battle) [open, section 10].
* **The five are consecutive** (no field scene between the Rikku and Paine launches) [R], matching the repo note's "five bosses without a break" (wiki, 4 sources).

## 6. The AI scripts

### 6.1 Engine rules used

As in `re-ffx2-fallen-maesters.md` 7.1: a poll is one call of the action entry; `random() % n` is stream 2; `searchr` near-weighted (stream 4), `searchr_nop` uniform; with one candidate nothing is drawn; `max` keeps all candidates tied for the extreme [note: leblanc-den-ixion 1.3]. **With Yuna alone every search has one candidate, so no stream-4 draw is consumed.**

### 6.2 Rikku (`m254`, scene `kino13_228`) [R: m254.src 14-131, compiled worker 0]

* **Start:** fade-out death pattern (not the pyrefly dissolve); two prop actors linked to her (a weapon and a second prop).
* **Each poll:** (1) the generic time-out block, inert (6.4). (2) A target is picked **first**: a near-weighted living girl (the draw is made even for the party-wide throws). (3) One draw `random() % 10`: **0 = Bomb Core, 1 = Arctic Wind, 2 = Lightning Marble, 3 = Dragon Scale** (each at the picked girl); **4 and 5 = Grenade on the whole party**; **6, 7, 8, 9 = Spider Attack** at the picked girl.
* So 10 percent each for the four elemental items, 20 percent Grenade, 40 percent Spider Attack. There is no state, no HP branch, no status test. The reaction, menu, targeted and death entries are empty.
* **Under Confusion** a confused actor draws from its record list instead [I], which holds the weak items (4.3).

### 6.3 Paine (`m256`, scene `kino13_229`) [R: m256.src 14-140, compiled worker 0]

* **Start:** fade-out death; up to four weapon props linked by slot (only slot 5 exists here).
* **Each poll:** the time-out block (inert); then a near-weighted search over living girls and, among them, **the girl with the highest current HP** (ties kept), and **Attack** on her. Nothing else. No draw.

### 6.4 The generic "battle too long" block (inert) [R]

Each script starts its action entry with the block of the other FFX-2 bosses: past 180 / 190 / 195 / 200 actions in its own scene it would queue four message rows (0x4232 to 0x4235) and the 12-hit Meteor (0x4236, 9,999 a hit) on the party, only in `kino13_228` / `kino13_229`, and only behind the guard "no girl is alive and unpetrified", which does not run in play [note: bahamut 1.6, leblanc 1.8]. Nothing to implement.

### 6.5 Turn cadence (rule of `re-ffx2-fallen-maesters.md` 7.8)

| Actor (AGI) | First gauge | Move | Charge (steps, s) | Recovery (steps, s) |
|---|---|---|---|---|
| Rikku (82) | 23 to 66 steps, 0.77 to 2.20 s | Spider Attack | 0 | 127, 4.24 |
| | | any item throw (ATB 40, charge 40) | 51, 1.70 | 51, 1.70 |
| Paine (51) | 36 to 105 steps, 1.20 to 3.50 s | Attack | 0 | 203, 6.77 |

So Rikku acts about every 3.4 s (item) or 4.2 s (Attack); Paine every 6.8 s. No time is added for dead or petrified girls with a one-girl party except while Yuna is down (the fight is then over). Animation time was not read.

## 7. The moves

| Move (user) | What it does | Type / accuracy / element | Statuses | Cost: recovery / charge / MP | Attacker term |
|---|---|---|---|---|---|
| **Spider Attack** 0x40c7 (Rikku) | formula 0, **2 hits of power 16**, one girl | physical; race with the row's accuracy byte (95); crit 10 percent | none | 100 / 0 / 0 | `((42 + 53) x 42 x 53) / 1024 + 42` = **248** per hit before DEF |
| **Bomb Core** 0x201a / **Arctic Wind** 0x201d / **Lightning Marble** 0x2020 / **Dragon Scale** 0x2023 (Rikku, items) | formula 8 power 6: `v x 6 x 50 / 256` = **281 to 317**, one girl | no type bit (neither Shell nor Protect); Fire / Ice / Thunder / Water | none | 40 / 40 / 0 | fixed |
| **Grenade** 0x2011 (Rikku, item) | formula 8 power 4: **187 to 211**, the whole party | physical bit (Protect halves it) | none | 40 / 40 / 0 | fixed |
| **Attack** 0x41da (Paine) | 1 hit, power 16, formula 0, one girl | physical; race with ACC (95); crit 5 percent; shatter 10 | none | 100 / 0 / 0 | `((56 + 58) x 56 x 58) / 1024 + 56` = **417** before DEF |

The weak variants (record list, Confusion only): Bomb Fragment 0x2019 / Antarctic Wind 0x201c / Electro Marble 0x201f / Fish Scale 0x2022 (formula 16 power 80: 75 to 84) and Budget Grenade 0x2010 (formula 16 power 20: 18 to 21, the whole party) [R: `item.bin` rows].

## 8. Against the repo's notes and the wiki-level descriptions

| Statement | The files |
|---|---|
| PLAN row 40: "Rikku and Paine shades (filler)... extends the Den of Woe set"; "shade rows to find in the kernel" | **possessed friends, not shades; rows 254 and 256**; the fights are solo-Yuna duels (wiki), which makes the engine need (one-girl party) the real cost |
| Repo note section 3: Rikku Lv 53, 7,800 HP, Paine Lv 58, 9,200 HP, MP, EXP, AP, gil | **all agree with the rows** |
| Repo note 4.4: Rikku "1/3 Normal Attack, 2/9 Grenade, 1/9 each elemental item" | **the script draws out of ten: 4/10, 2/10, 1/10 x4** (small difference) |
| Repo note 4.4: Rikku's "Normal Attack is two hits (DC 16 x 2)" | **agrees** (power 16, 2 hits) |
| Repo note 4.4: Rikku items "281 to 317 to one, constant" and Grenade "187 to 211" | **agree** (formula 8 with the variance 240 to 271) |
| Repo note 4.4: "Under Confuse she uses the weak versions (18 to 21 and 75 to 84)" | **agrees with the record list** (4.3) |
| Repo note 4.4: Paine "one attack, a sword strike (DC 16) that does not stagger; a second version only under Berserk" | **agrees** (the Berserk-attack field is the plain Attack row 0x4000; "does not stagger" is not in the files) |
| Repo note 3: Rikku evasion 18 (and 23 for Gippal) | **agrees** (EVA 18; Paine 0) |
| Repo note 4.4: "Rikku and Paine join her for the last three" | not in the data I read |

**The repo already holds** the Den of Woe chapter (15) with `denOfWoePartyBuild` (the Chapter V preset with both kit options on), the Den scene and plate, the shade paintings, Rikku and Paine party paintings in many dresspheres. There is no data or AI code for rows 254 to 257 in `src` on `origin/main`.

## 9. What our engine would need (origin/main `cd4aee3ce`; no build)

**Existing and enough:** an AI script per actor (`ai/index.ts`; pattern `ai/den-of-woe.ts`); `% n` draws and near-weighted search (`ai/script-rolls.ts`); enemy item throws (the Leblanc Syndicate goons use items; the item rows are ids 0x2000 + n, `re-ffx2-commands.md` "Items"); formula 8 and formula 16 rows; the Den scene (`scenes/den-of-woe.ts`, plate `den-of-woe`).

**New or to check:**
1. **A one-girl party.** `FFX2PartyBuild.members` is a 3-tuple type (additive change to a contract file; `docs/CONTRACT-CHANGES.md` entry); `setup.ts` already iterates `party.members` (data-driven); the HUD (three party slots), the presenter's formation positions (only slot 0), `PartyPrep` (not needed: the chapter has no prep), the tactic/guide code and the end-of-battle check must tolerate one member. **A T0 probe (a Vitest that builds a one-member party and runs a few polls) settles the core in under an hour.**
2. **Data rows** for the two enemies and the nine moves/items above; the strong items as command records (ids 0x201a, 0x201d, 0x2020, 0x2023, 0x2011) and the Confusion list (the weak ones) if the engine's confusion picks from the record list (check).
3. **Yuna's kit:** the Den build's Yuna (`denOfWoePartyBuild`, level 54 with the kit option) or a dedicated build; no source gives the level for the duels (repo note G-12). *Driver's pick:* Yuna from `denOfWoePartyBuild` (the same build point, the chapter 15 numbers), flagged `[estimate]`.
4. **HP carried between the two links** (the game does not heal between the five fights per the repo note): a link seam of the kind the Den already uses (`checkpointOnEntry` option) or a plain carry.
5. **The two weapon-prop actors per fight** (Rikku has two, Paine one): presentation only (a painted pose, no target).
6. **Chapter plumbing** (PLAN section 7).

## 10. Open questions, and what a live check would settle

1. **Party size in the duels** (one girl by the wiki): how the event limits it (the unresolved calls around the launches at 0x5731 and 0x5916, and the block of actor switches before 0x5731). *Settle by:* decoding that worker or a live replay of the Den.
2. **Does HP/MP carry** from Rikku to Paine, and is Yuna restored between? *Settle by:* a live read of Yuna's HP after the Rikku fight.
3. **Which items does the confused Rikku throw** (record list or the script's strong list)? *Settle by:* one Confuse live.
4. **What the unmapped launch word 1,281 does** (also in the Angra Mainyu and Via Infinito launches).
5. **Music**, **camera**, **the possession effect** (presentation; a build-lane question).

## 11. Notes cited

In the repo (`research/` on `origin/main`): `ffx2-gippal-den-of-woe.md` (sections 2, 3, 4.4, 5, 8), `re-ffx2-ai-leblanc-den-ixion.md` (section 4 for the shades), `re-ffx2-damage.md`, `re-ffx2-hit-status.md`, `re-ffx2-atb-status.md`, `re-ffx2-commands.md`, `re-ffx2-fallen-maesters.md`, `re-ffx2-ai-bahamut-vegnagun.md`. The lane's readers and its decoded tables are kept outside the repo; `tests/fixtures/parity/ffx2/yunas_ballad_rows.json` holds the numbers the chapter uses, read again from the same files.
