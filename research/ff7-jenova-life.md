# Research note: Jenova LIFE at the Forgotten Capital (FF7 only), program row 44

**Game case (hard rule 14): FF7 only.** The original *Final Fantasy VII* (1997) boss at the end of Disc 1. Nothing here applies to FFX or FFX-2, and FF7 Remake / Rebirth numbers (94,772 HP, Lifeclinger, Emergent) are a different fight and are not used. Written 2026-11-06 by a Sonnet sub-agent of the release driver (wave 3, FF7 lane, row 44). **No browser, no GPU, no engine run, no FF7 game files** (none exist on this PC). Authority (relayed words, verbatim, from the program plan): Bailey 2026-11-06 ~00:30 EST "implement all unimplemented chapters please"; ~00:55 EST "yes on all these too"; 2026-10-31 "you make the executive decisions for the next few days. i'll go with all of your recommendations." Every pick is a recommendation, "driver's call, his to overturn".

Companion: `docs/plans/ch-jenova-life-review.md` (the paper preflight). Scratch arithmetic: `tools/ff7-jenova-paper.mjs` and its output `research/ff7-jenova-life-paper.txt` (standalone, imports nothing).

## 0. Verdict and what this lane could and could not read

**The boss record, its three attacks and its whole AI are known to the digit from sources that agree.** Three corrections to the earlier Lifestream Encore research (LE; a separate repo, `docs/research/*.md`) are settled (section 8), one of them the "Blue Light costs 8 MP, not 0" the program plan names. **What stays unread: Terence Fergusson's *Battle Mechanics* and the Jenova entry of his *Enemy Mechanics* as primary text.** GameFAQs answers HTTP 403 to every automated fetch (the Battle Mechanics and Enemy Mechanics pages were each tried), the gopher mirror the search engine knows (Enemy and Party Mechanics) returns an error page on every variant of its address, the Final Fantasy Wiki answers 402 (one search-engine snippet quoting its enemy-attack list is the only wiki text seen), and the archive tool is blocked in this lane. The Guard Scorpion lane (2026-09-27) read all three guides in a browser pane and saved its findings in `research/ff7-battle-core.md` ("core") and in `docs/plans/next-content-2026-09-27.md` section 2 ("PL"); this note uses those two as the Fergusson-derived layer and says so on every row. The unread parts are listed as questions with exact wording in section 11, a fifteen-minute job for anyone with a browser.

## 1. Sources and how each number is tagged

| Code | Source | State here |
|---|---|---|
| EM | Fergusson, *The FF7 Enemy Mechanics* v1.11 (GameFAQs 31903) | not re-read; reached through PL and LE |
| BM | Fergusson, *The FF7 Battle Mechanics* v1.10 (GameFAQs 22395) | **not read**; reached through core only |
| PM | Fergusson, *FF7 Party Mechanics* v1.10 (GameFAQs 36775) | not re-read; reached through LE `party.md` |
| GC | Gamer Corner Guides: pages `monsters/jenova-life`, `monster-abilities/blue-light`, `/blue-flame`, `spells/reflect`, the table `spells:monsterId.176` | read here |
| SR | FF7 Speedrun wiki, "Jenova LIFE" (stat block, the AI script in Fergusson's shape) | read here |
| JG | Jegged, "Forgotten Capital" walkthrough | read here |
| SG, CR | Samurai Gamers boss guide; a player write-up (caneandrinse) | read here; low weight (SG is wrong on absorb) |
| PL | `docs/plans/next-content-2026-09-27.md` section 2, "Jenova LIFE's data, from Fergusson v1.11" | read here |
| LE | Lifestream Encore `enemies.md` section 4, `party.md` section 7, `scenes.md` section 6, `formulas.md` (6.6, 7, 8, 9) | read here |
| core | `research/ff7-battle-core.md` (formulas, ATB, rows, Limit, Materia, the corrections to LE) | read here |

Tags as in core section 0.1: `[verified: N sources]` (the Final Fantasy Wiki counts once; text that cites Fergusson is not independent of him), `[single source]`, `[derived]` (computed here from named inputs), `[estimate]` ("our estimate" to Bailey), `[unsourced]`, `[conflict]`.

## 2. The encounter

- **Where and when:** the altar of the Forgotten Capital (the City of the Ancients), the end of Disc 1, right after Aeris's death. Normal battle, **cannot be escaped**, no pre-emptive strike (GC "Type"); one enemy, its row 1 (GC). `[verified: 3 sources: GC; LE enemies 4 header; SR "end of Disc 1"]`. The Guard Scorpion lane took the start as Normal for a fixed story battle (core 2.4 `[estimate]`); the same reading holds here.
- **Party:** the player's own three; the earlier research and the 09-27 plan both use Cloud with Tifa and Barret (PL: "Cloud plus any two ... Tifa and Barret are defensible"). A player report puts its party "around Level 35" (CR); LE builds the fight for **Lv 38** (average 37 to 40, scenes.md header). `[estimate]` for the preset, see section 9.
- **Music:** "Aerith's Theme" plays through the scene, the fight and the burial; there is no boss theme and no change at the battle's start `[verified: 2 sources: LE scenes 6 (wiki-sourced), CR]`. **No victory pose** `[single source: LE enemies 4.7, scenes 6]`.
- **Difficulty intent:** the fight is one of the easiest bosses; the usual reading is that it spares the player a second viewing of the death scene after a Game Over `[single source: LE scenes 6 F, "most plausibly"; an inference, not a statement of the developers]`. The Water Ring (an accessory) makes the holder impossible to KO `[verified: 2 sources: JG "cannot be KO'd"; LE enemies 4.2]`; JG says it was picked up in Corel Valley.

## 3. The record (Jenova LIFE)

| Field | Value | Tag |
|---|---|---|
| Level | 50 | `[verified: 4 sources: GC, SR, SG, LE]` |
| HP / MP | **10,000 / 300** | `[verified: 3 sources: GC, SR, LE]` |
| Attack | 128 (physical base P = 1,128: `128 + [178/32] * [6400/32]`); she has no physical attack, so P is never used | GC prints "128 (1128)" `[verified: 2 sources; derived check]` |
| Magic attack | 40 (magic base **M = 540** = `6 * (40 + 50)`) | `[verified: 3 sources: GC, SR, LE; derived check]` |
| Defense (internal) | **110** (the wiki's 55 is halved for display, LE 0.1) | `[verified: 3 sources]` |
| Magic defense | **290** | `[verified: 3 sources: GC, SR, LE]` |
| Defense% / Dex / Luck | 10 / 140 / 40 | `[verified: 3 sources]` |
| EXP / AP / gil | 4,000 / 350 / 1,500 | `[verified: 3 sources: GC, SR, LE]` |
| Drop | **Wizard Bracelet, certain (chance class 63 of 63)** | `[verified: 2 sources: SR "100%"; PL "(100%)"]`; **LE's "63/255, about 24.7%" is wrong**, section 8 item 2 |
| Steal / Morph | none / none | `[single source: LE enemies 4.1]` |
| Enemy Skill | Aqualung (learnable) | `[verified: 3 sources: GC, LE, SG]` |

**Elements** (affinity levels in core 6.2): **Water: absorbs** `[verified: 3 sources: GC "Absorbs: Water", SR "Water -100%", LE "verified exactly"]` (SG's "Absorbs: None" is wrong); **Earth: weak, x2** `[verified: 4 sources: GC, SR 200%, SG, LE]`; **Gravity: void** `[verified: 4 sources]`. Everything else normal, hidden physical elements included (LE 4.2). GC also prints "Resists: Gravity, Water" beside "Absorbs: Water"; read as a page artifact (the resolution order of core 4.6 puts Absorb above Resist).

**Status immunities** `[verified: 2 sources: GC, LE]`: Sleep, Small, Confusion, Silence, Frog, **Stop**, Berserk, Poison, Petrify, Slow-numb, Manipulate, Death, Death-sentence; LE adds Peerless and Seizure `[single source]`. **Not immune** (by absence from the list, `[derived]`): Paralysed, Darkness, Slow, Sadness, Fury. LE draws the consequence that Cloud's Cross-slash (100% Paralysed) lands and Deathblow is a guaranteed critical on a paralysed target `[derived; the critical rule is not in core]`.

## 4. Abilities

| Ability | MP | Power (of M = 540) | Attack% | Target | Element | Reflectable | Tag |
|---|---:|---|---:|---|---|---|---|
| Blue Light | **8** | 7/8x (power byte 14) | 100 | one | Water (and Shout) | not listed by GC | MP `[verified: 2 sources: PL (EM), FFW snippet]`; power `[verified: 3 sources: GC, LE, PL]`; Shout `[single source: PL]` |
| Blue Flame | 12 | 1x (16) | 100 | one | Water | not listed | `[verified: 3 sources: GC, LE, PL]` |
| Aqualung | 34 | 3 1/4x (52) | 100 | all | Water | **yes** | `[verified: 3 sources]` |
| Reflect | 30 | none | always hits | self | none | no | `[verified: 3 sources: GC, LE, PL]` |

All three attacks are the Magical formula (`[(Power * (512 - MDf) * M) / (16 * 512)]`, core 4.2). Blue Light, Blue Flame and Aqualung are the only things she does besides Reflect; **there is no Stop in her kit** (she is immune to it, LE 4.3).

**Gamer Corner's reference-target oracle** (a flat Defense / MDf 140 target, no variance, LE 0.3.1): Blue Light **344**, Blue Flame **392**, Aqualung **850** (the all-target 2/3 already applied). Recomputed here: 343 (the formula gives `[14 * 372 * 540 / 8192]` = 343; GC floors at a different point, the +-1 drift LE 0.3.1 warns of), 392, 850. **Aqualung's 850 includes the 2/3 split although Aqualung cannot toggle between one and all targets**, while core 4.5 step 8 says a Magical hit splits only when the ability toggles; the oracle wins (two sources print it), so the engine needs a per-ability split flag, see the preflight.

**Blue Light's MP is the correction the program plan names.** LE read Gamer Corner's missing MP field as zero ("her only free move"); the Guard Scorpion lane's reading of Fergusson (PL) and the Final Fantasy Wiki's enemy-attack list both say 8. With 8 MP she has no free move at all, and her 300 MP is the only budget she has: **at 7 MP or less she cannot do anything she scripts.**

## 5. Her AI, in behaviour (the same shape in SR and LE; PL agrees on the dial)

- **Setup:** a counter `Count` starts at a uniform draw of 0, 1, 2 or 3; a dial `SpclChance` starts at 5.
- **Main (each of her turns):** `Count` 0 or 1: Blue Light on a random opponent; then a 1-in-`SpclChance` roll for a **second Blue Light on another random opponent in the same turn**; `Count` goes up by one. `Count` 2: Blue Flame on a random opponent; then a 1-in-`SpclChance` roll sends `Count` to 3, otherwise back to 0. `Count` 3: **Aqualung on all opponents**, `Count` back to 0. So the cycle is Blue Light, Blue Light, Blue Flame and, one time in `SpclChance`, Aqualung, entered at a random point (she can open with Aqualung one battle in four).
- **Counter, general (after any action against her):** `SpclChance` = 5 above 75% HP, 4 at 75% or less, 3 at 50% or less, 2 at 25% or less. One variable raises both the chance of the double Blue Light and the chance that Blue Flame becomes Aqualung: 1 in 5 at full health, 1 in 2 under a quarter. `[verified: 3 sources: SR, LE, PL]`
- **Counter, magical (when a magical attack hits her):** if she has no Reflect status and at least 30 MP, she casts Reflect on herself. `[verified: 2 sources: SR, LE; CR and JG describe the same behaviour from play]`. It fires after the spell has resolved, so **the first magic hit of the battle lands**; every later reflectable spell bounces until Reflect is removed. LE says Magic Hammer counts as magical; that is plausible (its formula is magical) and unproved.
- **What the scripts do not say:** whether the General counter fires on a miss; what she does when her MP is below the cost of the chosen attack (section 6); how "random opponent" treats a KO'd member (the engine's Guard Scorpion script draws among the living, core 12 estimate).

## 6. The rules this fight leans on

| Rule | State | Where it stands |
|---|---|---|
| Magical damage, variance, Weak x2 after variance, Absorb toggles Restorative (she **heals** from Water), caps | **sourced**; already in the FF7 engine | core 4.2, 4.5, 4.6 `[single source: BM]` |
| Barrier / MBarrier halve physical / magical damage (step 9), 127 V-Units | sourced | core 4.5 step 9; LE formulas 7.2 |
| **Reflect, the status:** a reflectable spell aimed at the holder is turned back at the **caster** (a spell cast by an opponent of the holder) | `[verified: 3 sources: LE formulas 6.6 (from BM), CR "bounces the magic back at the caster", JG "bounce back at your party"]` | the damage is recomputed against the caster (LE 6.6) `[single source]` |
| Reflect lasts until it is removed (DeBarrier, DeSpell) | JG and CR imply it; LE 6.6 words "up to four bounces per casting per character, then it is exhausted" | **`[conflict]` on whether the status is spent**; GC says "reflect magic spells back up to 4 times". The reading used here: the **status is not spent; one spell can bounce at most four times** between two Reflect holders. Q1 below. |
| Reflect itself, Demi, Comet, Ultima, summons and items are not reflectable; Aqualung, Magic Hammer, Matra Magic, Quake, Bolt, Fire, Ice, Cure ... are | sourced | LE formulas 6.6 `[single source]`; GC (Reflect not reflectable) |
| An enemy needs the MP for what it uses | sourced in part: the Final Fantasy Wiki marks an attack costing 65,535 MP as one an enemy "does not use naturally" for lack of MP | what a script does when the chosen attack is unaffordable is `[unsourced]`; the engine (Guard Scorpion's `payFor`) makes the turn fail |
| Counter, magical, fires on "any magical attack" | Cloud's **Blade Beam** is "treated as a magical attack" when one enemy is on screen (LE party 9.1, from PM; its multipliers were re-checked against Jegged, this clause was not): it would set the counter off `[single source for the clause; the effect on the counter is derived]` | a test for the AI |
| Armour MD% (the miss check on her magic) | `[unsourced]` for the Diamond Bangle, Gold Armlet, Wizard Bracelet; her Hit% is 130, so only MD% can make her miss | estimate 0, flagged |

## 7. The scene around it (LE `scenes.md` 6, the OG canon layer only)

OG order: the party sleeps in a shell house; Cloud wakes ("it's not an excuse. I feel it in my soul"); the altar; Aerith kneels at the top of the stepping-stone pillars; Cloud climbs alone, draws his sword on her and fights his own arm until the others' shouts stop him; Sephiroth drops from above and the Masamune goes through her; the White Materia rolls into the water; his speech ends unfinished ("Because, Cloud. You are ..."); the fight; the finishing line from the wrong mouth ("... a puppet"); the farewells; Cloud carries her into the lake `[verified: 2 sources: LE (Yinza script), JG for the scene's order]`. Details that are LE's **design**, not canon (scenes.md tags them): the player's two-option refusal, the invented Sephiroth line "She is not lost. She is distributed.", a persistent letterbox through the battle, full Limit gauges at the start (a Rebirth import), a soft-fail resume, an MP bar on the boss.

## 8. Corrections to the earlier research (do not copy these)

1. **Blue Light costs 8 MP, not 0** (LE enemies 4.3 and 4.4; also the sentences "her only free move", "at 0 MP she can only ever use Blue Light" and the Magic Hammer strategy built on them). Sources in section 4. Consequence: at 7 MP or less she is helpless, not reduced to Blue Light.
2. **The Wizard Bracelet is a certain drop**, not 24.7% (LE enemies 4.1 "63/255"): 63 is the chance class out of 63, the same misreading core 15.2 already corrected for the Assault Gun. PL and SR both say 100%.
3. **Aqualung is not a "two-cast kill" on Cloud** (LE formulas 5.7): one cast does 969 to 1,034 on Cloud (MDf 59) and two do 1,938 to 2,068 against his 2,435 HP; **three** are needed at full health (`research/ff7-jenova-life-paper.txt` B). With MBarrier one cast is 484 to 517.
4. **LE party 7's Materia are mislabelled:** it lists "Lightning Lv3 *Bolt2* (about 19,000 AP)", "Ice Lv3 *Ice2*", "Fire Lv3 *Fire2*", while its own AP table (3.5; the same in formulas 6.1) makes Lv2 = Bolt2 at 2,000 AP and **Lv3 = Bolt3 at 18,000 AP**, and its justification calls Bolt3 "firmly out of reach" at 15,000 to 25,000 AP. A build must be written from AP through the table (section 9), not from the spell labels.
5. The program plan says two LE errors are to be corrected; the second named in PL (Safer's beat-3 physical is 1.5x Base) belongs to row 56, not here.

## 9. The party at Lv 38 (the build point, all `[estimate]` as a preset, the stats sourced through LE from PM)

LE `party.md` section 2 gives the median of 4,001 runs of PM's level-up algorithm; section 7 builds the three at Lv 38 (design). Pools below follow the engine's rule (sum the Materia percentages once, truncate toward zero) on those builds; the other columns are LE's "effective" row.

| | HP | MP | Att | At% | MAt | Def | MDf | Dex (total) | Limit | Weapon | Row |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|---|---|
| Cloud | 2,435 | 360 | 107 | 100 | 78 | 113 | 59 | 36 | Level 2: Blade Beam, Climhazzard | Murasame (Att 51, At% 100) | front |
| Tifa | 1,948 | 308 | 116 | 112 | 66 | 98 | 54 | 43 | Level 3: Beat Rush to Dolphin Blow | Diamond Knuckle (Att 51, At% 112) | front |
| Barret | 2,368 | 295 | 94 | 100 | 64 | 121 | 62 | 33 | Level 3: Satellite Beam, Angermax | Heavy Vulcan (Att 39, Long Range) | back |

Notes. (a) LE prints Cloud "about 2,436" and no HP for Tifa and Barret; Tifa's and Barret's pools are computed here (Tifa three light Materia, -6%; Barret four, -8%) `[derived]`. (b) The Wutai assumption (Murasame 6,500 g, Diamond Knuckle 5,800 g) is LE's open question 4; the Wutai-free swap (Butterfly Edge, Tiger Fang) costs about 12 Attack each. (c) The accessories (Ribbon, Power Wrist, Talisman) and armour (Diamond Bangle, Gold Armlet) are bought by Disc 1 per LE 3.3 and 3.4 `[single source: LE, cross-checked in its verification log]`. (d) **Realistic AP** (15,000 to 25,000 on the main Materia, LE 7) puts Restore at Regen (17,000), Fire/Ice/Lightning at Lv3 (18,000) and Earth, bought at Kalm or Junon for 1,500 gil (GC `materia/earth`), at Quake2 (6,000 AP) or Quake3 (22,000). (e) Ribbon on Cloud means Darkness/Slow/Paralysed cannot touch him, which only matters to her script if it had status moves; it has none. (f) LE's Barret carries Cover Lv3, Tifa Counter Attack: reactions are a system the FF7 engine does not have (preflight section 3, row 10).

**The clock** at Battle Speed 128 (core 2.1 to 2.3, `research/ff7-jenova-life-paper.txt` D): NormalSpeed `RU((36 + 43 + 33) / 3) + 50` = 88; Cloud fills in 371 ticks, Tifa 342, Barret 384, **Jenova 227** (`[140 * 182 / 88]` = 289 per tick, no +50 for enemies). **She acts 1.61 times as often as an average member** (1.86 party actions per Jenova turn). A tick is about 1/30 s `[estimate, core Q1]`.

**What she does to that party** (`research/ff7-jenova-life-paper.txt` B, no armour MD%): Blue Light 389 to 422, Blue Flame 444 to 483, **Aqualung 964 to 1,046 on each of the three** (3,108 at the top of the range against 6,751 party HP); halved by MBarrier. **What the party does to her:** Attack 451 to 482 (Cloud), 488 to 521 (Tifa), 395 to 422 (Barret, back row, Long Range); Quake2 on the weakness 846 to 904 for 28 MP; Bolt3 1,131 to 1,207; Limits: Climhazzard 1,980 to 2,112, Blade Beam 1,584 to 1,690, Tifa's five-hit chain 3,663 to 3,908, Satellite Beam (auto-critical) 1,732 to 1,848. A reflected Bolt2 hits its caster for 721 to 769, a reflected Quake2 for 865 to 923.

## 10. What the paper arithmetic says about the fight (not the bench; `research/ff7-jenova-life-paper.txt` E)

A standalone model (the formulas above, the ATB of core 2.3, zero player decision time, Cure2 or Hi-Potion below 45% HP, 10 Phoenix Downs and 15 Hi-Potions `[estimate]`), 2,000 seeds per policy:

| Player model | Wins | Per win |
|---|---:|---|
| Physical Attack and Limits, heals at 45% | 99.5% | about 100 s, 13 Jenova turns, 1.3 Aqualungs, all three standing |
| The same, Cloud opens with Quake2 | 99.7% | the weakness adds one hit: Reflect is up after it |
| A distracted player (half Attack, 30% an element spell whatever Reflect says, 20% Defend, heals at 25%) | **72.5%** | about 170 s, 23 Jenova turns, 6 reflected casts |
| Every member casts a 22 MP spell every turn into the Reflect | 0% | the bounces kill the caster in three to four casts |

So the fight is easy for anyone who attacks, not easy for a player who ignores the Reflect (correct as a lesson, and the thing "beatable by a party playing badly" has to be measured against). The weakness to Earth is worth one free hit, not a plan; her real vulnerability is MP (300, and she must keep 30 for the Reflect counter), which only Magic Hammer or Mindblow (Barret's Level 1-2 Limit; the preset bakes Level 3, LE 8.4) touch.

## 11. Open questions, with the exact reading that settles each (about fifteen minutes with a browser)

1. **BM, the Reflect section:** (a) is the status spent after use or only a single spell's bounces limited to four; (b) the bounce target (the caster, or a random member of the caster's side) for single-target and for all-target spells; (c) whether the recomputed damage uses the caster's stats against the caster; (d) whether a reflected Cure on a Reflect ally also bounces.
2. **BM / EM:** what an enemy script does when it picks an ability whose MP it cannot pay (skips, falls through to another action, wastes the turn).
3. **EM, the Jenova entry:** confirm Blue Light 8 MP and the "Shout" element, the reflectable flag of each attack, the row, and the exact drop line ("Win: 100% Wizard Bracelet").
4. **BM:** does Counter - General fire on a miss; does Counter - Magical fire on Blade Beam (one enemy), on a status spell, on a healing spell cast at her.
5. **PM:** armour MD% of the Diamond Bangle, Gold Armlet, Wizard Bracelet and Mythril Armlet; the Hi-Potion / Ether / Elixir / Grenade rows; whether the Blade Beam splash exists with one enemy.
6. **Destruct and Barrier:** JG says "DeSpell" removes her Reflect, LE and CR say "DeBarrier" (LE formulas 7.4 lists both as curing Reflect); no effect on the preset unless Destruct is carried.

## 12. Sources actually read

GC `monsters/jenova-life`, `monster-abilities/blue-light` and `/blue-flame`, `spells/reflect`, `materia/earth`, the table `spells:monsterId.176`; SR "Jenova LIFE"; JG "Forgotten Capital" (Disc 1, 23); SG "Jenova LIFE boss guide"; CR (player write-up, Battle 5); the search engine's quotation of the Final Fantasy Wiki enemy-attack list; and, in the repo trees, `research/ff7-battle-core.md`, `research/ff7-guard-scorpion.md`, `docs/plans/next-content-2026-09-27.md`, and Lifestream Encore's `enemies.md`, `party.md`, `scenes.md`, `formulas.md`. Not retrievable: GameFAQs (403), the gopher mirror, the Final Fantasy Wiki (402), StrategyWiki (403), the archive tool.
