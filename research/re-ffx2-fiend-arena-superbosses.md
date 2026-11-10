# FFX-2 Fiend Arena superbosses (Almighty Shinra and Major Numerus with its seven actors): rows 329 and 330 to 336, their scripts, the part structure and the sizes against the Level 99 line, read from the game's own files

**Game case: FFX-2 only.** Both are Fiend Arena fights of the International/HD FFX-2 (ATB, dresspheres, the FFX-2 kernel tables). Shinra is the FFX-2 boy; the Major Numerus is not an FFX monster (the FFX Ultima and Omega Weapons are other records); no FFX number is used.
Written 2026-11-09 by a Sonnet sub-agent of the Echoes of Spira driver (program plan row 53, `PLAN.md` of 2026-11-06, wave 56). **Treeless research: no repo file, no art, no engine or data file is changed; nothing deployed; the game was not run; no browser, no GPU, no Ghidra.** Authority (relayed words, verbatim): 2026-11-09 ~12:35 EST "Keep going please with everything you were doing finish the wendigo chapter also"; 2026-11-06 "implement all unimplemented chapters please" and "yes on all these too"; 2026-10-31 "you make the executive decisions for the next few days. i'll go with all of your recommendations." Every pick is a recommendation, "driver's call, his to overturn".

**What is in this note:** numbers and described behaviour from the owner's Steam copy (FFX-2 half of the HD Remaster), read with the earlier lanes' node tools (kept outside the repo). The sources for rows 329 to 336 were first extracted by the wave-2 lane of row 38, which also corrected the plan's rows 63 and 334 to 336. Names are the game's English name tables; **no dialogue, no script lines, no byte dumps**; developer labels are translated in a few words.

**Tags.** **[R]** read from a game file (kernel table, shipped AI source, compiled worker); **[I]** inferred; **[G]** a guide (Jegged FFX-2 Fiend Arena and bestiary, Gamer Guides FFX-2 HD "Demon Cup/Shinra's Cup" and "Farplane Cup"); **[calc]** arithmetic with the repo's formulas (`research/re-ffx2-damage.md` section 1), a size and not a claim; **[gap]** no source. **GameFAQs was tried for this note (HTTP 403, a Cloudflare challenge to a headless read; the browser is out of scope for treeless research), so Jegged and Gamer Guides stand in for it; where a guide and the game's own files differ, the files win (they are the game's data), and the difference is written in the "against the files" section. A GameFAQs read through the built-in browser remains owed if Bailey wants a third guide.**

## Summary for the driver

1. **Rows 334 to 336 are the Major Numerus's body, pod and tail**, not the Last Mission (confirmed, as `re-ffx2-farplane-cup.md` section 8 said): the four heads **Unum 330 (555,555 HP), Duo 331 (666,666), Tria 332 (666,666), Quattour 333 (777,777)** are the only things with real HP (the three parts have 1 HP and no moves). **Seven actors**: body = slot 1, Unum 2, Duo 3, Tria 4, Quattour 5, pod 6, tail 7 (inferred from the scripts' death and link tests). **Killing the last of the four heads sets the body and the pod to 0 HP: that ends the fight.** [R, I]
2. **Almighty Shinra** (row 329, Lv 99, 275,000 HP, every stat 255, Regen and Spellspring): a six-poll loop of **Clione (10 random hits, power 24), Attack, Ultima (or Final Impact under a quarter of his HP), Attack, Full Break (or Fireworks under half), Haste (or Final Impact when already hasted)**. The Gamer Guides' summary of the loop matches the script move for move. [R, G]
3. **The four heads each run their own loop** and all four act at once: Unum a seven-poll beat of physical Sparklers, Dispel, Shell and Protect upkeep on the monster side and a **Radis Command** (power 58, up to 99,999); Duo a nine-poll beat of coin-flip status and Black/White magic ending in **Venam Command** (poison, all); Tria a six-poll beat of the four -aga spells (or Holy) with **Fulmen Command** (power **255**, Thunder, all) and an Absorb; Quattour a nine-poll beat of Fireworks, **Mortis Command**, Absorb, **Meteor** and **Ultima**. [R]
4. **The Commands are the fight.** Each carries the 99,999 damage-limit bit and a 220 cast (about 4.5 s of warning). Against the repo's Lv 99 line a Fulmen Command is about **60,700 on a Dark Knight (10,710 HP)**, a Radis Command 29,800, a Mortis Command 18,900, a Venam Command 14,500. No Lv 99 girl survives one without Shell/Protect, Thunder-proofing or invulnerability. [calc]
5. **Elements:** the heads **null Fire, Ice, Thunder, Water and Gravity** and take Holy and non-elemental damage; Shinra nulls only Gravity. Shinra's DEF and MDEF are 255: only Defense-piercing attacks (Darkness, Fireworks) work, as the guide says. [R, G]
6. **How the game starts these fights is not in the tables** (no formation names rows 328 to 336; the same finding as the Cup note). The guides place them in the Fiend Arena: Shinra in the **Almighty Shinra Cup** (the Fiend World Cup after Omega Weapon), the Numerus as the **Farplane Cup's last team** (Jegged lists only "Unum"; Gamer Guides list all four parts). [R, G]
7. **Cost:** about 52 h against the plan's 72 (preflight section 9); research is done. The winnability is the open risk: the Lv 99 line as built probably cannot beat the Numerus, and the honest outcome may be a measured "options" sheet, as the Den of Woe's.

## 0. Result in one screen (the row dump, kept outside the repo)

| Field | **Almighty Shinra (329)** | **Unum (330)** | **Duo (331)** | **Tria (332)** | **Quattour (333)** |
|---|---:|---:|---:|---:|---:|
| Id | 0x1149 | 0x114a | 0x114b | 0x114c | 0x114d |
| Level | 99 | 99 | 99 | 99 | 99 |
| HP / MP | 275,000 / 999 | 555,555 / 999 | 666,666 / 999 | 666,666 / 999 | 777,777 / 999 |
| STR / DEF / MAG / MDEF | 255 / 255 / 255 / 255 | 234 / 23 / 237 / 81 | 226 / 92 / 238 / 22 | 241 / 89 / 222 / 28 | 237 / 27 / 231 / 88 |
| AGI / ACC / EVA / LCK | 255 / 130 / 30 / 34 | 173 / 255 / 0 / 99 | 170 / 255 / 0 / 99 | 172 / 255 / 0 / 99 | 168 / 255 / 0 / 99 |
| Special word | 0x3db (bits 0, 1, 3, 4, 6, 7, 8, 9) | 0x7c3 (0, 1, 6, 7, 8, 9, 10) | 0x7c3 | 0x7c3 | 0x7c3 |
| Elements | null Gravity | null Fire, Ice, Thunder, Water, Gravity | the same | the same | the same |
| Automatic status | Use MP 0, **Regen** | Use MP 0 | Use MP 0 | Use MP 0 | Use MP 0 |
| Ailment walls | Death through Itchy 255, Reflect, Slow, Stop, all stage changes, Doom 255 | the same without Reflect | the same | the same | the same |
| Moves (waza) | Attack, Clione, Ultima, Meteor, Flare | Attack, Radis Command, Die, Thunder, Sleep, Haste, Slow | Attack, Venam Command, Die, ... | Attack, Fulmen Command, Die, ... | Attack, Mortis Command, Die, ... |
| EXP / Gil / Pilfer Gil / AP | 3,000 / 3,000 / 5,000 / 1 | 6,000 / 5,000 / 3,000 / 1 | the same | the same | the same |
| Drop / steal | Dark Matter x2 / Ragnarok x1; Turbo Ether x1 or x2 | Enterprise, Iron Duke x5; Mega-Potion x2, Megalixir | Invincible, Iron Duke x5; X-Potion x2, Megalixir | Enterprise, Iron Duke x5; Mega Phoenix x2, Megalixir | Invincible, Iron Duke x5; Elixir x2, Megalixir |
| Zantetsu byte | 255 | 255 | 255 | 255 | 255 |

**Body (334), pod (335), tail (336):** Lv 1, 1 HP, 1 in every stat, no moves, no loot; Eject, Itchy and Auto-Life 255. [R] Special-word bits as in the Cup note (0 percent-HP formulas do nothing, 1 hit reactions do not stop him, 6 no ATB damage, 7 no Zantetsu, 8 no Bribe, 9 immune to Interrupt; bit 10 unmapped): **delay, Interrupt and percent formulas do nothing to either boss.** The rows' Bribe slots are empty. Totals: the four heads hold **2,666,664 HP**; with Shinra 2,941,664.

## 1. Source block

| Item | Value |
|---|---|
| Archive | `FFX2_Data.vbf` (Steam HD Remaster, FFX-2 half) read with the repo's node VBF reader; the sources first extracted by the wave-2 lane of row 38 and kept read-only outside the repo |
| AI sources [R] | `m329.src` (2,503 bytes; 7d73219758445929), `m330.src` (2,759; 080c9bc4fd043ded), `m331.src` (2,969; bb1043f7253132a6), `m332.src` (2,382; 436cdf1491cfbc18), `m333.src` (2,172; 1003ae8c510339bb), `m334.src` (1,140; 317331916140500c), `m335.src` (692; 132c6b2f57ef3969), `m336.src` (895; 8a67e921a73a9b58); compiled `_m329/m329.bin` (130,112; f189a8cb5d77e667), `_m330` (47,600; 87d4f4a41ca87aa7), `_m331` (48,464; 179ccdffce34d367), `_m332` (42,656; 39ad48c871b7bcee), `_m333` (48,176; b9dc2b5e62a65e01) |
| Checks | `cmp-src-bin.mjs` on worker 1: for 330 to 333 the command ids and the `random() % 2` moduli equal the source; for 329 the source also names Curaga and White Wind inside **commented-out** branches that the worker does not queue (the live ids are 7). No scene constant is named. **No script carries a "battle too long" block** |
| Formations | none names rows 328 to 336 (the formations dump is empty): the arena builds them outside `btl.txt` |

## 2. The part structure (Major Numerus)

* The body (`m334`) switches **its own cursor and existence off**, cannot move, and links the four heads to itself as armour, weapon, left hand and right hand, and slot 6 as a further part (element 22). The tail (`m336`) is the same: cursor and existence off. The **pod (`m335`) switches nothing off** and has no script lines: whether it can be targeted is unknown [gap]. [R]
* Each head's death handler counts the **other three heads**: Unum tests slots 3, 4 and 5; Duo tests 2, 4, 5; Tria 2, 3, 5; Quattour 2, 3, 4. When all three of the others are at 0 HP the dying head sets the **body (slot 1) and slot 6 to 0 HP** and plays the "Die" row (0x4211). The slot map follows: body 1, Unum 2, Duo 3, Tria 4, Quattour 5, pod 6, tail 7. [R, I]
* **The Farplane Cup's fourth win** lists the last team as "Outer Plane Envoy: Unum" (Jegged); Gamer Guides list the whole Major Numerus with the four parts. If the game really fields Unum alone in one mode, its death test passes at once (the other three are absent) and the fight is a single 555,555-HP head. [G; I]

## 3. The scripts (normal worker; `random() % 2` is stream 2; `searchr` near-weighted; **"the monsters" is the monster side**)

### 3.1 Almighty Shinra (`m329`)

A counter `count` (0). Each poll, a switch on `count`: **0** Clione on all; **1** Attack (no cancel) on a living girl; **2** if his HP is **under a quarter** of his maximum: Final Impact on all, else **Ultima** on all; **3** Attack; **4** if his HP is **under half**: Fireworks on all, else **Full Break** on a living girl; **5 (default)**: if he does **not have Haste**: Haste on himself, else Final Impact on all; then `count` := 0. Every other `count` ends with +1. No reaction, no timer, no random draw: **the loop is fully deterministic except the targets**. Fade-out death. [R]

His loop is **6 polls**; he acts every 1.4 s of recovery after an Attack and every 0.97 to 2.5 s of charge for the others (AGI 255: the cadence dump). He regenerates (Regen) and casts for free (Spellspring). [R, calc]

### 3.2 Unum (`m330`, seven polls, `count` 0 to 6)

0 **Radis Command** on a living girl; 1 **Sparkler** (power 24, ignores DEF) on a living girl; 2 **Dispel** on a living girl; 3 **Shell on all monsters if any monster lacks Shell**, else Sparkler; 4 **White Highwind on all monsters if his HP is under an eighth**, else Sparkler; 5 Sparkler; 6 (default) **Protect on all monsters if any monster lacks Protect**, else Sparkler; then `count` := 0. Death: the Numerus death rule (section 2). [R]

### 3.3 Duo (`m331`, nine polls, a coin flip `random() % 2` at each of the first eight)

0 **Black Sky** (10 hits spread, power 6, MP 80, all) or **Bio** (all, Poison 100); 1 **Flare** (power 55, one girl) or **Break** (Petrify 80, one); 2 **Ultima** (pcom 0x3171, power 70, all) or **Confuse** (100); 3 **Sleep** (75) or **Demi** (25 percent of current HP, all); 4 **Berserk** (75) or Black Sky; 5 **Blind** (75) or Flare; 6 Ultima or **Silence** (75); 7 **Slowga** (130) or Demi; 8 (default) **Venam Command** (power 30, all, Poison 254, 220 cast), `count` := 0. The status rows aim at "the girls" though the rows are single-target (the engine picks one). [R]

### 3.4 Tria (`m332`, six polls)

0 **Firaga** (all) or **Holy** (power 12, 8 hits, one girl, MP 85); 1 **Blizzaga** (all) or Holy; 2 **Fulmen Command** (power **255**, Thunder, all, 220 cast); 3 **Thundaga** or Holy; 4 **Waterga** or Holy; 5 (default) **Absorb** (3/16 of current HP and MP, one) on a living girl; `count` := 0. [R]

### 3.5 Quattour (`m333`, nine polls, no draw)

0 **Fireworks** (all); 1 **Mortis Command** (power 36, all); 2 **Absorb** (one); 3 **Meteor** (power 8, 12 hits spread, MP 99); 4 Fireworks; 5 Absorb; 6 **Ultima** (pcom 0x3171); 7 Fireworks; 8 (default) Absorb; `count` := 0. [R]

**Cadence [calc]:** the heads' recovery is short and their Commands charge 220 (134 to 138 steps, about **4.5 s**); Ultima/Black Sky 62 steps (2.1 s), Holy 61 (2.0 s), Meteor 75 (2.5 s), Sparkler 49 (1.6 s). Summing each head's charge times over its own loop gives cycles of about **13 s (Unum), 14 s (Tria), 20 s (Duo) and 24 s (Quattour)**, so the four heads reach a Command about once every **4 s** of battle between them: **there is nearly always one charging**. The girls have the 4.5 s charge of each to answer it (the cadence dump; recoveries after the casts are ignored, so these are lower bounds on the cycle). [calc, I]

## 4. The moves (the move dump; formulas `re-ffx2-damage.md` section 1; limit bit `flags_damage & 0x80` = 99,999, else 9,999)

| Move (user) | Row | Formula, power | Target | Notes |
|---|---|---|---|---|
| Clione (Shinra) | 0x4210 | f0, 24, **10 hits** spread on random girls | all | cast 180, MP 30 (free), crit 10, shatter 80 |
| Final Impact (Shinra) | 0x41c4 | **f7, 2 (1/8 of max HP and MP), 14 hits** spread | all | class 3 (HP and MP); the row carries the physical bit, so **Protect halves it** in the pipeline (the guide calls it unblockable; the repo's Paragon chapter already pins "Protect halves it, as the row"); **the repo already has this row** (`paragon-os-final-impact`, `command-records/enemies.ts`) |
| Ultima (Shinra) | 0x41fb | f2, 42 | all | MP 90 (free), cast 100 |
| Full Break (Shinra) | 0x4206 | f0, 20 | one | STR, MAG, DEF, MDEF stage down 2 each (100 percent) |
| Fireworks | 0x3076 | f1 (ignores DEF), 24 | all | cast 90; party row |
| Haste (Shinra) | 0x3176 | status | self | Haste 254, count 50 |
| Radis Command (Unum) | 0x421a | f1, 58 | one | cast 220; **limit 99,999** |
| Sparkler | 0x3075 | f1, 24 | one | cast 80 |
| Dispel, Shell, Protect | 0x30b8, 0x30bb, 0x30bc | status | one / monsters | |
| White Highwind (Unum) | 0x4088 | f7, 6 (37.5 percent heal) | monsters | also cures six ailments, stage ups |
| Venam Command (Duo) | 0x421b | f1, 30 | all | Poison 254; limit 99,999 |
| Black Sky | 0x3088 | f0, 6, 10 hits spread | all | MP 80; **exists in the Cup chapter** |
| Bio, Flare, Break, Confuse, Sleep, Berserk, Blind, Silence, Demi, Slowga, Ultima (0x3171) | 0x3085, 0x3170, 0x3084, 0x3083, 0x406e, 0x406a, 0x406f, 0x4071, 0x3082, 0x421e, 0x3171 | | | as in the Cup and Trema chapters; Ultima 0x3171 is power 70 |
| Fulmen Command (Tria) | 0x421c | **f0, 255**, Thunder | all | cast 220; limit 99,999 |
| Holy | 0x3172 | f2, 12, **8 hits**, Holy | one | MP 85 |
| Firaga, Blizzaga, Thundaga, Waterga | 0x30ad to 0x30b0 | f2, 21 | all | MP 24 each |
| Mortis Command (Quattour) | 0x421d | f1, 36 | all | cast 220; limit 99,999 |
| Meteor (Quattour) | 0x4221 | f9, 8, 12 hits spread | all | MP 99 |
| Absorb | 0x4040 | **f4, 3 (3/16 of current HP and MP)**, class 3 | one | ATB 40, cast 100 |

## 5. Sizes against the repo's Level 99 line (the size calculation, kept outside the repo; Yuna and Paine Dark Knights 10,710 HP, DEF 151, MDEF 105; Rikku an Alchemist 5,106 HP, DEF 52, MDEF 35; Crystal Bangle on all)

| Move | Dark Knight | Alchemist |
|---|---:|---:|
| Shinra Clione, per hit (10 hits, about 3.3 per girl) | 6,287 | 9,999 (cap) |
| Shinra Attack | 4,191 | 7,678 |
| Shinra Ultima | 8,078 | 9,999 |
| Shinra Full Break | 5,239 | 9,598 |
| Shinra Fireworks | 9,999 (cap) | 9,999 |
| Final Impact, per hit; per girl on average | 1,338; about 6,240 (58 percent of max HP) | 638; about 2,980 |
| Radis / Venam / Mortis Command (limit 99,999) | 29,811 / 14,546 / 18,903 | the same (f1 ignores DEF) |
| **Fulmen Command** | **60,704** | 99,999 |
| Duo Ultima, Flare | 9,999 (cap) | 9,999 |
| Tria Holy (per hit, 8), Firaga family | 611; 1,872 | 870; 2,667 |
| Quattour Meteor, per hit (12) | 2,458 | 3,501 |
| Quattour Absorb on a full Dark Knight | 2,008 | |

**What this says [calc, I]:** (1) Shinra is a fight an Alchemist's Miracle Drink or a Protect-and-Shell opening makes survivable: his heaviest moves are 4,000 to 8,000 a hit before Protect, and the Guide's advice (Mighty Guard first; Dark Knight Darkness, which ignores his 255 DEF) fits the numbers. Darkness is about 6,370 a hit per enemy for a Lv 99 Dark Knight (f1, power 20), so 275,000 HP is about 43 hits; Break Damage Limit matters only past 9,999. (2) **The Numerus is not survivable by the Lv 99 line as the repo builds it**: its four Commands are lethal in one hit through Protect (30,000 halved is still three times a Dark Knight's HP), the heads' 2.67M HP take a Dark Knight 420 or more Darkness hits to chew through, and the guide's own answer is invulnerability (Miracle Drink, "assume 30 minutes"; Invincible and Iron Duke gear, a Speed Bracer, Nonpareil five times). **The engine models Miracle Drink** (`x2-mix-miracle-drink`, all allies Invincible, duration 15, in `data/ffx2/abilities/mix-results.ts`; the Den's Hero Drink at count 20 is 10.6 s, so 15 is about 8 s, **not** the guide's half hour) and Final Wall/Mega Cocktail, but not the Via Infinito build's missing kit (Valiant Lustre, Higher Power, Stamina Tonic), nor Iron Duke, Invincible or Speed Bracer gear (unchecked). With the Alchemist (Rikku) re-casting every 8 s the fight is a loop of Mixes, which the bench can measure. The honest build is the Den of Woe's: build, measure, and give Bailey the options sheet.

## 6. Guides against the files

| Statement | The files |
|---|---|
| Gamer Guides: Shinra's loop is Clione, Attack, Ultima or Final Impact (25 percent), Attack, Full Break or Fireworks (50 percent), Haste or Final Impact, loop; Auto-Regen and Spellspring | **agrees move for move** (thresholds 1/4 and 1/2, the Haste test) |
| Gamer Guides: Clione is ten random hits each 1.5x Attack; Final Impact is 14 unblockable hits of 1/8 max HP/MP | Clione agrees (power 24 against 16); Final Impact agrees in size (f7 power 2 over 16) but **the row has the physical bit, so Protect halves it** (the repo pins this for the Paragon): the guide's "unblockable" is read as "not evadable" |
| Jegged: Shinra is 275,000 HP, Lv 99, every stat 255, evasion 30; he joins after the Almighty Shinra Cup, and Omega Weapon must be released and defeated first | agrees with the row; the cup sequence is **not in the files** |
| Gamer Guides: Unum's pattern (Command, Sparkler, Dispel, the Shell and Protect upkeep with Sparkler as the fallback, White Highwind under an eighth) | **agrees** (the game's name table spells it Radis Command) |
| Gamer Guides: Duo, Tria, Quattour's lists (including "Venom", "Mortus", "Quartum") | agree with the scripts; the table spells **Venam, Mortis, Quattour** |
| Jegged: the Farplane Cup's last team is a single "Outer Plane Envoy: Unum" | the files hold all four heads; either a single-head mode or Jegged's shorthand; the death test supports both |
| Gamer Guides: Fulmen Command is power 255, the strongest attack in the game | agrees (f0 power 255) |

## 7. Engine and art facts (checked against `origin/main` bc93b1fdd by reading)

* **Already in the repo:** the Cup chapter (`src/battle/ffx2/ai/farplane-cup.ts`, `data/ffx2/enemies/farplane-cup*.ts`, `builds/farplane-cup.ts` = `viaInfinitoBuild`), Trema's rows (Flare 0x3170, Ultima 0x3171, Meteor 0x4128, Demi), Black Sky, Dispel, Shell, Protect, Break, Confuse, Absorb-type rows, the Paragon's **Final Impact** (`paragon-os-final-impact`, 0x41c4), the multi-hit spread (`flags_misc & 0x4000`, Black Sky, Meteor), the 99,999 damage-limit bit, `restoresPartyOnEntry`, parts that die together (Sin's parts, Vegnagun's four-part chain). **New rows:** Clione, the four Commands, Holy (0x3172) and White Highwind (0x4088, also Ms. Goon's row) if the repo lacks them (T0 checks); Full Break exists in the Cup. **New scripts:** five (Shinra and the four heads) and the death rule.
* **Engine gaps, named:** (1) a monster-side "any ally lacks Shell/Protect" search (Unum) — the helpers (`lacking`, `girls`) cover the girls; (2) **seven actors in one formation** with four HP bars and three hidden parts (the HUD for Sin's/Vegnagun's parts is the template; the maximum enemy count of the FFX-2 engine is not checked) and the **"last head dead ends the fight"** rule; (3) **invulnerability and Thunder-proofing** for the girls: Miracle Drink exists in the engine (about 8 s a cast, see section 5); Thunder-proof accessories (NulShock Ring and kin) and the longer-lasting gear of the guide are a kit decision for Bailey, not engine work; (4) the status layer against a Lv 99 party (Cup note T0 finding a: only chances 254/255 land) matters for Duo's Sleep/Berserk/Blind/Silence/Confuse/Break.
* **Plate:** the Fiend Arena has none; the Cup chapter used the Den of Woe's own stage as a flagged stand-in (DU5); the Cup's preflight took the `farplane` plate first and its builder moved off it for a reason written in `docs/handoff/ch-farplane-cup.md` DU5. A stage for seven actors needs room: the Den stage's boss spot and the Vegnagun room are the nearest.
* **Paintings:** none for Shinra (a boy in a Gullwings-like outfit with a mascot-sized frame; `ffx2-experiment` is not him), **none for the four heads or the body** (a large multi-part boss: the Vegnagun and Sin parts are the staging precedent); the Numerus would be four large head paintings plus a body piece. The plan's "A20" holds.
* **Music:** `boss-trema` (the Fiend Arena's superboss cue, the Cup chapter's), `victory-ffx2`, field bed `scene-bevelle-underground`; flagged (rule 13).

## 8. Open items

| # | Item | Decision |
|---:|---|---|
| U1 | How the arena launches the fights, the cups' rounds and the recruiting | not in the files; fixed formations, no cup (the Cup chapter's DU1 and DU8) |
| U2 | Whether the pod is a targetable piece | unknown; hidden like the body and tail (they switch themselves off) |
| U3 | Whether the Numerus ever appears as Unum alone | Jegged says so for the Farplane Cup's 4th win; not built |
| U4 | The party the arena expects | the Lv 99 line (Gamer Guides use it); the level and kit remain an `[estimate]` |
| U5 | Special-word bit 10 of the heads | unmapped; no behaviour claimed |
| U6 | Whether "any monster lacks Shell" in Unum's test counts the body, pod and tail | unknown; the engine searches the living, existing monsters |
| U7 | The group status 23 and other unmapped rows of the Die row | not needed |

## Files

This note and the paper preflight (`docs/plans/ch-fiend-superbosses-review.md`). The row dump, the move dump, the cadence dump, the formations dump and the size calculation it cites are kept in the research folder outside the repo and are not committed (decompile and disassembly dumps never are).
