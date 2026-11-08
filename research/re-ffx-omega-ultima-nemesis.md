# FFX Ultima Weapon, Omega Weapon and Nemesis (Omega Ruins and the Monster Arena): records, formations and AI read from the game's own files

**Game case: FFX only.** Ultima Weapon (`m99`, formation `omeg00_10`, Omega Ruins, first boss room), Omega Weapon (`m100`, `omeg01_10`, Omega Ruins, the end of the right-hand path) and Nemesis (`m276`, `zzzz02_76`, the Monster Arena's last "original" creation) exist only in FFX; FFX-2 has none of them. Part of the `re-parity` track (new chapters), wave-3 sequel of the Sanctuary Keeper and Spherimorph notes, whose method this note reuses. Drafted 2026-11-06 for program row 43 (`PLAN.md`). **Treeless: records, formations and AI only. No engine, data, AI or art file was changed; nothing here ran in a browser.**

**Source and tags** (as in `re-ffx-sanctuary-keeper.md` and `re-ffx-spherimorph.md`).

- **[bytes]** read from the game's own file by a script of this lane (Steam build 25501027, `FFX_Data.vbf`, unpacked read-only earlier and kept outside the repo, hard rule 8). **[disasm: file @offset]** read from the Atel disassembly; no script line is reproduced.
- **[run]** the real bytecode of `m99`, `m100` and `m276` ran in the small Atel interpreter of the earlier AI lanes (`sim.mjs`, `sim2.mjs`, used unchanged; this lane's driver adds a lookup of a command's damage type and HP class) against a mock battle with the real command-table rows; the two hidden counters are also computed **exactly** by dynamic programming over the stream-2 residues (modulo 3 gives residue 0 on 21,846 and residues 1 and 2 on 21,845 of 65,536 each). **[arith]** the repo's own kernels (`kernel/ctb.ts`, `kernel/damage.ts` of the clean tree, read only): variance 240 to 271, no criticals.
- **[note: X]** a checked note in this repo (`research/re-ffx-damage.md`, `re-ffx-rng-hit.md`, `re-ffx-zanmato-and-orders.md`, `ffx-combat-core.md`). **[guide: Jegged / GG]** a community guide, cited by name only (Jegged.com "Omega Ruins" and "Nemesis"; Gamer Guides "Ultima Weapon" and "Omega Weapon"), read 2026-11-06; nothing copied. **Samurai Gamers' pages for these three did not load (the address guess returned 404), and GameFAQs, StrategyWiki and the Final Fantasy wiki answered HTTP 403 (a browser check); the brief bars the browser. The tie-break "GameFAQs wins" was never needed (the files settled every conflict, and the two guides that loaded agree with them).** **[inferred]** not read directly.

Files used (size in bytes): monster files `m099` (132,960 on disk; the AI is **1,165 bytes of code**), `m100` (172,128; **1,002 bytes**), `m276` (171,652; **768 bytes**); formations `omeg00_10` (24,308; 19,257 bytes of code, camera work), `omeg01_10` (4,132; 734 bytes of code) and `zzzz02_76` (24,176; 19,234 bytes of code); kernel tables `monmagic1.bin`, `monmagic2.bin`, `command.bin`, `monster1.bin` to `monster3.bin`, `btl.bin`, `ctb_base.bin`, `a_ability.bin`. Each record in the monster file (chunk 2, 0x14 to 0x7F) equals the kernel row byte for byte. **The plan's "134 KB, 172 KB" scripts are file sizes, almost all model data.** Move and item names are the English names of the game's own tables.

## 0. The one-screen summary

- **Three monsters, three formations, three battles; none has a helper.** Escape and Flee are disabled for characters **and aeons** in the two Omega Ruins fights (`omeg00_10`, `omeg01_10`); the Nemesis formation disables nothing itself (the launching field event's flags were not read). All three start Normal where the formation writes a start (Ultima, Omega); the Nemesis formation writes none. Twelve aeon entries in each. [bytes] [disasm]
- **Ultima Weapon: 99,999 HP, DEF 60, MDEF 60, no element affinity at all, 1,165 bytes of AI.** A **fixed six-turn cycle** that depends on whether an aeon is on the field (section 4.1). Its Attack misses a party with Evasion 255 (accuracy 120 - EVA + LCK difference). Immune to everything except Silence and Darkness (byte 95: only a chance above 95 lands) and **Bribe is allowed** (Pendulum x99). [bytes] [run]
- **Omega Weapon: 999,999 HP, DEF 90, MDEF 80, absorbs all five elements, immune to every status, 1,002 bytes of AI.** Each turn a draw modulo 3 chooses **Attack (33.33 percent; adds 5 to a hidden counter)** or a **special (66.67 percent; adds 2 and advances a four-step cycle)**; **at the start of a turn with the counter at 30 or more it casts Nova on the whole front line** (mean 11.44 turns apart, never sooner than 7 turns nor later than 16). The cycle depends on whether an aeon is on the field. Omega's own **Nova is a monster row (0x4067, MAG-based, power 60), not Kimahri's Ronso Rage (0x3073, power 70)**. [bytes] [run] (4.2)
- **Nemesis: 10,000,000 HP, DEF 150, MDEF 150, Armored, absorbs all five, STR 255, MAG 255, AGI 200, 768 bytes of AI.** Its turn: a hidden counter that adds 3 on an Attack (draw mod 3 = 0) or 2 on any other turn and **casts Armageddon on the whole front line at 20 or more** (99,999 whatever the defence: mean 9.88 turns, never sooner than 8 nor later than 11); the other turns cycle **Ethereal Cannon (one target), Ultra Spark (all, plus Poison, Power Break, Slow, Curse), Attack**. **Every command of damage type "special" that hits it is answered by Ultima on the front line**: all Overdrives, Wakka's reels and shots, Mix grenades, Steal, Lancet, Jinx, Zanmato and items; a plain Attack, Quick Hit and every spell are not. [bytes] [run] (4.3)
- **The numbers that matter.** Against the repo's endgame preset (HP 9,999, DEF and MDEF 255, an `[estimate]`) **Ultima and Omega are harmless: the biggest hit is about 330** (Ultima's Holy, Omega's Ultima), and Ultima's Attack never lands. **Nemesis is not: an Attack 13,975 to 15,780, Ethereal Cannon 19,069 to 21,532, Ultra Spark 27,950 to 31,560, Ultima (the counter) 5,146 to 5,811, Armageddon 99,999 each** (kills 9,999-HP members through Protect, Shell and Shield alike). Against a mid-endgame cell the guides imply (HP 5,000, DEF 60, MDEF 50, an `[estimate]` of this note) Ultima does 1,759 to 7,888 and Omega 2,738 to 6,509 (their Nova 5,764 to 6,509). [arith] (6)
- **Rewards:** Ultima 20,000 gil, 40,000 AP (50,000 overkill), Lv. 3 Key Sphere x3, steal Door to Tomorrow x10 or x20, gear Double Overdrive and Break MP Limit; Omega 30,000 gil, 50,000 AP (60,000), Lv. 4 Key Sphere x3, steal Gambler's Spirit x30, gear Triple Overdrive and Break HP Limit, **Lancet on Omega teaches Kimahri Nova**; Nemesis 0 gil, 55,000 AP, Warp Sphere or Dark Matter, steal Lv. 4 Key Sphere or Warp Sphere, gear Break Damage Limit and Break HP Limit. [bytes]
- **Sources agree with the files** on every stat, the two cycles, the Nova counter and its +2/+5 rule, the Nemesis move list and the 99,999. They do not give: the aeon branch of the two cycles, the Armageddon counter's rule, the **Ultima counter on special commands**, or Ultima's Evasion-dependent Attack. (section 7)
- **Recommendation for the chapter shape and every pick is in `docs/plans/ch-weapon-review.md` (the draft beside this note).**

## 1. The monster records (a)

Offsets are record offsets (chunk 2; layout [note: re-ffx-dark-aeons.md 1; FFX-H02 3.1]). Height, model and hit box were not read.

### 1.1 Identity

| | Ultima Weapon | Omega Weapon | Nemesis |
|---|---|---|---|
| Monster file, record index | m99 | m100 | m276 |
| Monster word in the formation | 0x1063 | 0x1064 | 0x1114 |
| CTB icon / Doom byte | 20 / 99 | 20 / 222 | 21 / 255 |
| Death animation | "Boss" (body stays) | "Boss" | "Fiend" (dissipates) |
| Forced action (Provoke, immune) | Attack | Attack | none |
| Heavy, Tough (no recoil, no lift) | both | both | Tough only |

[bytes] [disasm: m099 @0x0015 to @0x0114; m100 @0x0015 to @0x0120; m276 @0x0006 to @0x00e1]

### 1.2 Stats

| Field | Ultima Weapon | Omega Weapon | Nemesis | Tag |
|---|---:|---:|---:|---|
| HP | 99,999 | 999,999 | 10,000,000 | [bytes] |
| MP | 99 | 999 | 9,999 | [bytes] |
| Overkill threshold | 13,560 | 66,666 | 99,999 | [bytes] |
| STR / DEF | 50 / 60 | 64 / 90 | 255 / 150 | [bytes] |
| MAG / MDEF | 45 / 60 | 57 / 80 | 255 / 150 | [bytes] |
| AGI / LCK / EVA / ACC | 32 / 15 / 0 / 0 | 38 / 15 / 0 / 0 | 200 / 0 / 0 / 150 | [bytes] |
| Tick speed, CTB per rank-3 action (plain / Hasted / Slowed) | 8: 24 / 12 / 48 | 7: 21 / 10 / 42 | 3: 9 / 4 / 18 | [arith] |
| Flag byte +0x28 | 0x1E: immune to Gravity-type damage, Life, Sensor, Scan-again | 0x1E: the same | 0x1F: the same **and Armored** | [bytes] |
| Flag byte +0x29 | 0x03: immune to CTB damage, to Slice (Bribe allowed) | 0x07: CTB, Slice, Bribe | 0x05: CTB, Bribe | [bytes] |
| Poison damage byte | 1 | 1 | 0 | [bytes] |
| Element absorb / immune / resist / weak | none | **absorbs and resists all five** | **absorbs all five** | [bytes] |
| Automatic statuses | none | none | none | [bytes] |
| Extra-immunity word | 0x0301: Scan, Eject, Auto-Life | the same | the same | [bytes] |
| Commands in the record (+0x50) | Core Energy 0x4022, Shimmering Rain 0x4023, Attack 0x407F | Core Energy, Shimmering Rain, Nova 0x4067, Flare 0x3052, Death 0x304F, Attack 0x407F | Attack 0x40F0, Ultima 0x40F3, Armageddon 0x40F4, Ethereal Cannon 0x40D8, Ultra Spark 0x40D9 | [bytes] |
| Commands the script actually uses | those three, plus Break 0x604F, Silence 0x606E, Confuse 0x6072, Sleep 0x6071 and the player-side **Holy 0x303F** | Core Energy, Shimmering Rain, **Attack 0x410F**, Nova, Break, Confuse, and the player-side **Ultima 0x3053** and **Demi 0x304E** | all five of its record | [disasm] |

(Omega's record lists Flare and Death but its script never casts them; its Attack in the script is the row 0x410F, not the record's 0x407F. Omega's "absorbs and resists" bytes both set: the damage pipeline's rule is that an absorbed bit wins over a resisted bit on the same bit, so every element heals it [note: re-ffx-damage.md 5].)

**Status bytes** (255 immune; otherwise the move's chance minus the byte; a 254-chance move lands on anything below 255; Threaten's byte is a success percentage and 0 is "never lands" [note: ffx-seymour-anima-macalania.md 0]): **Ultima Weapon**: everything 255 except **Silence 95, Darkness 95, Threaten 0**, and Shell, Protect, Reflect, the four Nul, Regen, Haste 0 (it can receive them; nothing casts them on it); **Omega Weapon** and **Nemesis**: everything 255 except Threaten 0 and the beneficial statuses 0. **Slow 255 on all three.** [bytes]

So: Silence and Darkness land on Ultima only from a chance above 95 (a 254-chance move such as Smoke Bomb always does); nothing else lands on any of the three; **Armor Break cannot remove Nemesis's Armored division** (Armor Break byte 255, and Piercing is the other way round it). [bytes] [arith]

### 1.3 Loot (chunk 4; layout [note: FFX-H02 3.4, 3.5])

| | Ultima Weapon | Omega Weapon | Nemesis |
|---|---|---|---|
| Gil / AP / AP on overkill | 20,000 / 40,000 / 50,000 | 30,000 / 50,000 / 60,000 | 0 / 55,000 / 55,000 |
| Normal drop | Lv. 3 Key Sphere x3 (x6 on overkill) | Lv. 4 Key Sphere x3 (x6) | Warp Sphere (common), Dark Matter (rare), x1 (x2) |
| Steal (common / rare) | Door to Tomorrow x10 / x20 | Gambler's Spirit x30 / x30 | Lv. 4 Key Sphere / Warp Sphere |
| Bribe | Pendulum x99, factor 99 (allowed) | Potion, **immune** | none |
| Gear (weapon ability / armour ability) | Double Overdrive / Break MP Limit | Triple Overdrive / Break HP Limit | Break Damage Limit / Break HP Limit |
| Learned-move word | none | Kimahri's Nova 0x3073 | Kimahri's Nova 0x3073 (file only; the guides name Omega only) |
| Zanmato level byte | 3 | 3 | **4** |
| Pilfer Gil / arena price | 20 / 30,000 | 30 / 45,000 | 0 / 25,000 |

[bytes] Jegged and Gamer Guides agree on gil, AP, drops, steals and gear except as in section 7. [guide]

## 2. The formations (b)

| | `omeg00_10` (Ultima) | `omeg01_10` (Omega) | `zzzz02_76` (Nemesis) |
|---|---|---|---|
| Battle id (area key << 16, then the formation number) | 590 << 16 + 10 = 38,666,250 (zone 1) | 591 << 16 + 10 = 38,731,786 (zone 1) | 603 << 16 + 76 = 39,518,284 |
| Block bytes | voice 1, byte 1 2, foot bank 12, in-water 0 | voice 1, byte 1 2, foot bank 12, in-water 0 | voice 0, byte 1 0, foot bank 5, in-water 0 |
| Escape / Flee | **off for all characters and aeons** | **off for all characters and aeons** | not written by the formation |
| Start type | Normal (3) | Normal (3) | none written |
| Map centre | none written | (22, 0, -35) | none written |
| Other | actor lights | actor lights, animation chain off, four map layers (8 visible, 9 to 11 hidden) | the Monster Arena capture flag and a farm call |
| Areas | 1 | **2** (the second: three party, one aeon, five monster slots stacked in height) | 1 |

[bytes] [disasm: omeg00_10 @0x0009 to @0x0015, @0x4ad7 to @0x4b34; omeg01_10 @0x0009 to @0x0021, @0x027c to @0x02d9; zzzz02_76 @0x4aba to @0x4b1d]

**Start positions** (chunk 3). **Ultima and Nemesis share the same table**: party (-35.1, 0, -21.1), (-51.2, 0, 11.0), (-43.8, 0, 41.7); twelve aeon entries (most at (-83.5, 0, -4.0), three spread at (-58.5, 0, -17.8), (-49.7, 0, 2.2), (-63.3, 0, 23.2)); the monster at (67.5, 0, 29.7); the camera work of the two files is the same size (about 19,250 bytes of code each), so one staging serves both. **Omega's table is its own**: party (77.7, 0, 8.0), (83.2, 0, -15.3), (77.9, 0, -41.5); twelve aeon entries around (70 to 100, 0, -10); the monster at (-25.0, 0, -39.3). Three party entries, never more. [bytes]

**How the game launches the fights:** Ultima on entering the first boss room, Omega on entering the glowing end of the right-hand path [guide: Jegged]; Nemesis from the Monster Arena's list once every other creation is beaten [guide: Jegged]; the field events were not read. [guide]

## 3. The engine facts the scripts lean on

- **Hooks.** Each monster has one AI worker (slot 61) binding onTurn, preTurn (empty), onTargeted (empty), onHit and onDeath, and a presentation worker (an onTargeted motion and a camera worker). **onTurn is the whole AI of Ultima and Omega.** Nemesis also uses onHit. [bytes] [disasm: m099 @0x0119, @0x037f to @0x0382; m100 @0x0125; m276 @0x00e6, @0x01bd]
- **Random draws.** `GetRandomValue()` is stream 2 masked to 16 bits: modulo 3 gives residue 0 on 21,846 and residues 1 and 2 on 21,845 of 65,536; modulo 2 splits 32,768 each. `findMatchingChr` is a uniform pick among the living, targetable members of the group (one stream-4 draw with two or more candidates). [run]
- **"On the field."** `countChrOverlap(front line, all aeons)` is the test of Ultima's and Omega's cycles: it is non-zero while any aeon is out. The test is made at the start of **every** turn, so the branch can change mid-cycle (the position in the cycle is kept). [run: aeon summoned and dismissed mid-cycle]
- **Cap rule** [note: re-ffx-damage.md 6]: 9,999, or 99,999 with Break Damage Limit, or forced to 99,999 by the command row's 0x80 bit: **Omega's Attack and every Nemesis move carry the bit; Ultima's moves and Omega's spells (Nova included) do not.**
- **Accuracy** [note: re-ffx-rng-hit.md 4]: accuracy formula 2 reads `byte - target EVA`, plus the user's Luck, minus the target's Luck, unclamped; formula 0 always hits. **Ultima's Attack (byte 120) is formula 2; Omega's and Nemesis's Attacks are formula 0.**
- **Damage types** [bytes]: 1 physical, 2 magical, 0 special. Every Overdrive, every aeon Overdrive, Wakka's reels and shots, Rikku's Mix results (grenades and their kin), Lancet, Steal, Jinx and Zanmato are type 0. Quick Hit, Delay Attack, Armor Break and the plain Attack are type 1; Bio, Dispel and Scan are type 2. 181 player rows that can target the enemy side are type 0 (list in the lane's folder). [bytes]

## 4. The AI [bytes] [disasm] [run]

### 4.1 Ultima Weapon (m99), onTurn

A turn counter v2 is raised by one each turn. **If any aeon is on the field** the cycle is: 1 Attack on a random living front-line member, 2 Core Energy on a random one, 3 **Shimmering Rain** on the whole front line, 4 Core Energy on a random one, 5 Attack on a random one, 6 Shimmering Rain on the front line (and the counter resets). **With no aeon on the field**: 1 Attack, 2 **one of Break (Petrify, 254), Silence or Confuse** on a random living member (a draw mod 3: 21,846 / 21,845 / 21,845 of 65,536), 3 Core Energy on a random one, 4 **one of Holy (a player-side spell), Sleep or Confuse** (draw mod 3), 5 Attack, 6 Shimmering Rain on the front line. [disasm: m099 @0x0120 to @0x037e] [run: both cycles, 14 turns each; the three draws of each status turn; an aeon summoned and dismissed between turns 2 and 5]

It has no counters, no phases, no thresholds: **a six-turn cycle is 144 CTB** (24 per action), and nothing the player does changes it except putting an aeon on the field. onDeath forces its "Die" action. [arith] [disasm: m099 @0x038f]

### 4.2 Omega Weapon (m100), onTurn

Two hidden counters: **v2 (the Nova counter)** and **v3 (the cycle position)**.

1. **If v2 is 30 or more** (tested first): reset v2 to 0 and cast **Nova on the whole front line**; the turn ends.
2. Otherwise a draw mod 3: **0 (21,846 of 65,536 = 33.334 percent): v2 += 5, Attack (0x410F) on a random living member**; **1 or 2 (66.666 percent): v2 += 2, v3 += 1**, then the cycle step v3:
   - **aeon on the field:** 1 Core Energy (random), 2 Shimmering Rain (front line), 3 Core Energy (random), 4 Shimmering Rain (front line) and v3 = 0;
   - **no aeon:** 1 Core Energy (random), 2 **Break or Confuse** (a draw mod 2; one random member), 3 Shimmering Rain (front line), 4 **the player-side Ultima or Demi** on the front line (a draw mod 2) and v3 = 0.

**The Nova counter, exact.** The counter starts at 0 and is tested before each turn. P(the k-th turn is a Nova): k = 7 0.14 percent, 8 0.55, 9 8.11, **10 26.18**, 11 9.10, **12 32.51**, **13 18.01**, 14 1.54, 15 3.51, 16 0.34 percent; **the mean is 11.443 turns between Novas** (the Nova turn included); the earliest is turn 7 (six Attacks in a row, 30 = 6 x 5), the latest turn 16 (fifteen specials, 30 = 15 x 2). The pattern of the specials repeats the four-step cycle between Novas; Attacks do not advance it. [run: draws all 0 gives Nova on turn 7; draws all 1 gives Nova on turn 16 with the no-aeon and the aeon cycles] [disasm: m100 @0x012c to @0x02ee]

onDeath forces its "Die" action. No counters on being hit. [disasm: m100 @0x02f8]

### 4.3 Nemesis (m276), onTurn and onHit

**onTurn.** Counter v2 (the Armageddon counter) and v3 (the cycle step, 0 to 2).

1. **If v2 is 20 or more:** reset to 0 and cast **Armageddon on the whole front line**; the turn ends.
2. Otherwise a draw mod 3: **0 (33.334 percent): v2 += 3, Attack on a random living member** (v3 unchanged); **1 or 2: v2 += 2**, then by v3: **0 -> Ethereal Cannon on a random living member (v3 = 1); 1 -> Ultra Spark on the front line (v3 = 2); 2 -> Attack on a random member (v3 = 0).**

**The Armageddon counter, exact.** P(the k-th turn is an Armageddon): k = 8 0.69 percent, 9 25.18, **10 59.83**, 11 14.31; **the mean is 9.878 turns** (earliest 8: seven Attacks; latest 11: ten specials). [run: draws all 0 gives Armageddon on turn 8; draws all 1 on turn 11 after the Ethereal Cannon, Ultra Spark, Attack cycle]

**onHit (the Ultima counter).** The script reads the damage type of the command that hit it: **1 (physical) or 2 (magical): nothing; anything else (0, special): cast Ultima (the monster row 0x40F3) on the whole front line.** It is raised once per action per target, so a multi-hit Overdrive is one Ultima. It does not test Threaten, HP 0 or `isCounterattackAllowed`. [disasm: m276 @0x01c0 to @0x01f2] [run: 12 commands of the three types]

What triggers it (type 0 and able to target the enemy): **all Overdrives** (the seven characters', the Furies, the reels and shots of Wakka, the aeons' and the Magus Sisters'), **Zanmato, Delta Attack, Mix results (every grenade and kin), Steal, Pilfer Gil, Lancet, Jinx, Threaten, Provoke, Talk and the item command**; it does not fire for Attack, Quick Hit, Delay Attack and Buster, Armor Break and the other Breaks, Mug, or any spell (Bio, Dispel, Scan and Slow included). [bytes] [run]

onDeath forces its "Die" action on itself unless a state property reads 3. [disasm: m276 @0x0202]

### 4.4 Cadence

Ultima acts every 24 CTB, Omega every 21, **Nemesis every 9 CTB (a Hasted party at AGI 255 acts every 4)**. A six-turn Ultima cycle is 144 CTB. Over one Armageddon interval (mean 9.88 Nemesis turns, about 89 CTB) a party member at AGI 255 under Auto-Haste acts about 22 times. [arith]

## 5. The move rows (c)

Rows of `monmagic1.bin` (0x4xxx), `monmagic2.bin` (0x6xxx) and `command.bin` (0x3xxx). Rank 3 for the monster rows; the player-side Ultima is rank 6 and Holy rank 4.

| Row | Id | Target | Damage | Formula / power | Hit | Statuses / notes | Cap | Tag |
|---|---|---|---|---|---|---|---|---|
| Ultima Attack | 0x407F | one | physical | f1 / 16 | formula 2, byte 120; crit | | 9,999 | [bytes] |
| Core Energy | 0x4022 | one | magical | f3 / 44 | always | | 9,999 | [bytes] |
| Shimmering Rain | 0x4023 | front line | special (type 0), HP | f3 / 30 | always | | 9,999 | [bytes] |
| Break (Petrify) | 0x604F | one | none | | always | **Petrify 254**; reflectable | n/a | [bytes] |
| Silence | 0x606E | one | none | | | Silence 100, 3 turns; reflectable | n/a | [bytes] |
| Confuse | 0x6072 | one | none | | | Confuse 100; reflectable | n/a | [bytes] |
| Sleep | 0x6071 | one | none | | | Sleep 100, 3 turns; reflectable | n/a | [bytes] |
| Holy (player-side) | 0x303F | one | magical, **Holy** | f3 / 100 | always | MP 85 in the row; reflectable | 9,999 | [bytes] |
| Omega Attack | 0x410F | one | physical | f1 / 16 | **always (formula 0)**; crit 25 | | **99,999** | [bytes] |
| **Omega Nova** | **0x4067** | front line | special (type 0), HP | **f3 / 60** | always | not Kimahri's Nova | 9,999 | [bytes] |
| Ultima (player-side) | 0x3053 | front line | magical | f3 / 70 | always | MP 90, rank 6 | 9,999 | [bytes] |
| Demi (player-side) | 0x304E | front line | magical | **f5 / 4: a quarter of current HP** | always | | n/a | [bytes] |
| Nemesis Attack | 0x40F0 | one | physical | f1 / 16 | always (formula 0); crit 10 | | 99,999 | [bytes] |
| Ethereal Cannon | 0x40D8 | one | magical | f3 / 255 | always | | 99,999 | [bytes] |
| Ultra Spark | 0x40D9 | front line | special, HP | f1 / 32 | always | **Poison, Power Break, Slow (254 each; Slow 254 turns) and Curse** | 99,999 | [bytes] |
| **Armageddon** | **0x40F4** | front line | special | **f2 / 36 (STR, defence ignored)** | always | | 99,999 | [bytes] |
| Ultima (monster) | 0x40F3 | front line | magical | f3 / 70 | always | pierces armor | 99,999 | [bytes] |

## 6. Numbers (arithmetic only; no engine ran)

Two example parties, both an `[estimate]`: **CAPS**, the repo's endgame preset (`src/data/ffx/builds/mirror-aeons.ts`: HP 9,999, MP 999, every other stat 255, Auto-Haste, Auto-Phoenix, Auto-Protect, Ribbon, Break Damage Limit on all weapons, Luck 60; the Dark Aeons chapter's party) and **MID**, a cell of this note chosen so the formulas reproduce the guides' damage lines (HP 5,000, DEF 60, MDEF 50, Evasion 30, Luck 20; the repo has no preset at this point, so this is **not** a build). [arith]

| Move | CAPS (HP 9,999) | MID (HP 5,000) |
|---|---:|---:|
| Ultima Attack (STR 50) | 105 to 119 (and it **never hits** Evasion 255: 120 - 255 + 15 - 60 < 0) | 2,310 to 2,608 (hit chance about 85 percent: 120 - 30 + 15 - 20) |
| Ultima Core Energy | 112 to 127 | 2,680 to 3,026 |
| Ultima Shimmering Rain, each | 74 to 83 | 1,759 to 1,986 |
| Ultima Holy | 294 to 332 | 6,986 to 7,888 |
| Omega Attack (STR 64; formula 0, always hits; crit doubles) | 221 to 249 | 4,825 to 5,448 |
| Omega Core Energy | 173 to 195 | 4,114 to 4,646 |
| Omega Shimmering Rain, each | 115 to 130 | 2,738 to 3,092 |
| **Omega Nova**, each (cap 9,999) | 242 to 274 | **5,764 to 6,509** |
| Omega Ultima, each | 287 to 324 | 6,837 to 7,720 |
| Omega Demi (a quarter of current HP) | 2,499 from full | 1,250 from full |
| Nemesis Attack | **13,975 to 15,780** | 99,999 |
| Nemesis Ethereal Cannon | **19,069 to 21,532** (Shell 9,534 to 10,766) | 99,999 |
| Nemesis Ultima (the counter), each | 5,146 to 5,811 (Shell 2,573 to 2,905) | 99,999 |
| Nemesis Ultra Spark, each | **27,950 to 31,560** | 99,999 |
| **Nemesis Armageddon**, each | **99,999** (uncapped 1.09 to 1.23 million; Protect and Shell do not matter) | 99,999 |

Protect halves physical and Shell magical before the cap; with Shell a full-HP member survives an Ethereal Cannon on 12 of the 32 variance values (37.5 percent; the Shelled range is 9,534 to 10,766 and 9,999 kills). **At the caps, Ultima and Omega cannot threaten the party; their own guides' numbers (Core Energy "upwards of 4,000", Shimmering Rain "around 2,500", Nova "6,000 plus") fit the MID cell, not the caps.** [arith]

**The party against them** (STR or MAG 255; Break Damage Limit lifts the cap to 99,999; Armored divides by 3 unless the weapon or command pierces): a plain Attack does 304,129 to 343,413 to Ultima, 229,594 to 259,250 to Omega (both capped), and **113,133 to 127,746 to Nemesis, 37,711 to 42,582 after the Armored division** (a Piercing weapon avoids the division; Armor Break cannot, Nemesis is immune). A MAG 255 Ultima (f3 p70; it carries no element, so no absorb applies) does 112,022 to 126,492 to Ultima Weapon, 93,392 to 105,456 to Omega and **41,670 to 47,053 to Nemesis**. **Hits needed at 99,999: Ultima Weapon 1, Omega 11, Nemesis 101** (at 9,999: 11, 101, 1,001); against the Armored Nemesis without Piercing about 250 plain hits. **The repo's endgame weapons carry no Piercing** (`ENDGAME_WEAPONS`), so against Nemesis a Piercing slot, a spell or an Overdrive is needed (the Overdrives set off the Ultima counter). [arith]

**The clock against Armageddon.** One Armageddon interval is about 9.88 Nemesis turns, 89 CTB; a Hasted AGI 255 member acts every 4 CTB, so **about 22 actions per member, 66 for three, between Armageddons**. 101 hits of 99,999 fit in about 1.5 intervals; 250 Armored hits fit in about four. Every Nemesis turn also kills (Attack, Ethereal Cannon and Ultra Spark each exceed 9,999 HP), so the party is dead every Nemesis turn unless Auto-Life or a Phoenix Down puts it back; **Armageddon removes even a Protect, a Shell and a Shield**. [arith]

## 7. Cross-check with the guides: agreement and the conflicts (the files win)

| Point | Files | Guides | Verdict |
|---|---|---|---|
| Ultima Weapon 99,999 HP, AP 40,000, overkill 13,560; Omega 999,999 HP, AP 50,000, overkill 66,666; Nemesis 10,000,000 HP, overkill 99,999, AP 55,000, gil 0 | yes | GG, Jegged | agree |
| Omega is 99,999 HP in the original and 999,999 in the International and HD | 999,999 (this build) | Jegged | agree (this is the HD figure) |
| Ultima: Attack, then Confuse, Silence or Break, then Core Energy, then Confuse, Sleep or Holy, then Attack, then Shimmering Rain, then repeats | the no-aeon cycle, exactly | GG | agree |
| Ultima's cycle with an aeon on the field | Attack, Core Energy, Rain, Core Energy, Attack, Rain | none | file only |
| Ultima's Attack "2,000 to 3,000", Core Energy "3,000 to over 9,999", Rain "around 2,500" | 2,310 to 2,608; 2,680 to 3,026 (cap 9,999); 1,759 to 1,986 against the MID cell | GG | consistent with a mid-endgame party; not with the caps |
| Break "removes buffs" | Break is Petrify (254) | GG | the file wins; Stoneproof stops it (GG agrees) |
| Bribe Ultima for Pendulum x99 | allowed; item and factor in the file | GG, Jegged | agree; **the price differs: about 2.4 to 2.5 million gil (GG), 2,000,000 in the HD edition (Jegged), 1,400,000 in the original**; the file holds the factor only: an estimate flagged, GameFAQs not readable |
| Omega: four phases of Core Energy, Confuse or Break, Shimmering Rain, Demi or Ultima; Attacks do not advance them | yes | GG | agree |
| The Nova counter: threshold 30, specials +2, Attacks +5; Nova "6,000 plus" | yes (tested at the start of a turn); 5,764 to 6,509 on MID | GG | agree |
| Omega absorbs all elements, immune to all ailments and Breaks | yes | GG | agree |
| Lancet on Omega teaches Nova | learned-move word 0x3073 on m100 (and on m276) | GG, Jegged | agree (Nemesis is file only) |
| Omega's aeon branch (two Core Energy, two Rain) | yes | none | file only |
| Nemesis: Attack, Ethereal Cannon (one target), Ultra Spark (all, with statuses), Armageddon (99,999 to all); Auto-Life nearly required | yes | Jegged | agree |
| Nemesis counters Overdrives and other special commands with Ultima | yes | **none** | file only: any guide that says "use Overdrives" omits the cost; Jegged's "use Quick Hit" fits |
| Nemesis steal Lv. 4 Key Sphere or Warp Sphere, drop Warp Sphere or Dark Matter | yes | Jegged | agree |
| Ultima gear Double Overdrive, Omega gear Triple Overdrive | file | none | file only |

## 8. What is not proved

- **Not run in the engine or the emulator.** The AIs ran in the Atel interpreter against a mock world; the game was not run.
- **Whether the Ultima counter is fired for a Zanmato that kills** (the order of the Zanmato's death against onHit) and **whether the no-damage special commands (Steal, Pilfer Gil, Jinx, Threaten, Provoke, Talk, an item) raise onHit at all against an immune target** were not run in the game; the list in 4.3 is what the script's type test would answer, if the engine raises the hit.
- **The launching events' battle flags** (the defeat rule, whether the Monster Arena allows Escape) were not read; only the formations were.
- **The second area of `omeg01_10`** (three party, one aeon, five stacked monster slots) is not explained; area 0 is assumed for the fight [inferred].
- **The Bribe price** (about 2.0 to 2.5 million gil) is not in the files; the sources differ.
- **Ghidra was not answering** during this lane; the stored decompile corpus supplied the one engine read.
- **The meaning of two properties** the scripts write (135, 294) was not mapped; both are presentation or death-handling and do not affect the AI.

## 9. The fights, for the chapter (facts only; no number proposed)

- **What they need that the engine may not have:** the aeon-on-the-field test (the Keeper and Spherimorph need it too); two hidden counters with their exact +2/+3/+5 rules and thresholds; Omega's two cycle branches; Nemesis's special-class reply (a damage-type read in onHit); the player-side Holy, Ultima and Demi cast by a monster; the 99,999 cap bit on every Nemesis move; **Ultra Spark's four statuses**; formula 2 and formula 0 attacks.
- **What they can reuse:** the endgame party, bench and chain of the Mirror Aeons chapter (`builds/mirror-aeons.ts`, `ai/dark-aeons*.ts`, `tools/mirror-aeons-bench.mjs`); the HP-hit counter patterns (Dark Bahamut, Spectral Keeper); formulas 1, 2, 3 and 5; Break Damage Limit; Auto-Life and Auto-Phoenix.
- **What is order-sensitive:** the counters are tested at the **start** of a turn (Nova and Armageddon take the whole turn); Omega's cycle advances only on specials; Ultima's counter v2 is a plain turn count; Nemesis's Ultima counter is raised per action, not per hit.
- **What is open:** the party for Acts I and II (the caps make them formalities), Zanmato (a Yojimbo line can end any of the three: levels 3, 3 and 4), the Piercing slot against an Armored Nemesis, and the Auto-Life supply.

## 10. Things that change PLAN.md

1. **R for row 43 is finished by this note for the AI:** the three AIs are 1,165, 1,002 and 768 bytes of code and read in full; the residual R is the live checks of section 8 (about two hours), not 14.
2. The plan said **"Nova's row is in `research/ffx-combat-core.md` (rank 7, power 70)"**: that is **Kimahri's** Ronso Rage Nova (0x3073, formula 15). **Omega's own Nova is a monster row, 0x4067, formula 3, power 60, MAG-based, capped at 9,999.**
3. The plan said **"Omega's four-stage cycle and hidden Nova counter come from the wiki only"**: both are now read from the file and **confirmed exactly** (counter +5 on an Attack, +2 on a special, Nova at 30; mean 11.44 turns), plus the aeon branch of the cycle and the start-of-turn test, which no guide states.
4. The plan said **"Nemesis is Ultima recoloured"**: only as a painting stand-in (a flagged compromise); **in the game it is a different monster** with a different AI, and the Ultima and Nemesis formations share one position table and one camera set, so **one arena serves both.**
5. **Ultima Weapon has no element affinity and Omega absorbs all five**: the plan's "Omega absorbs and resists all five" is right for Omega only.
6. **Nemesis answers every special-class command with Ultima** (all Overdrives and Mixes); the plan has no mention; it changes the party's toolkit and the bench.
7. **Zanmato levels 3, 3 and 4** are the row's winnability lever (RE for the Dark Aeons found a landed Zanmato ends a fight whatever its Death resistance).
8. Size: R14 B24 A16 I10 = 64 becomes **R3 B17 A16 I9 = 45** (the preflight).

## 11. How this was checked, and what was not

Scripts and outputs kept outside the repo in the lane's own folder: `rec.mjs` (record and loot decode), `dump.mjs` (disassembly and position tables), `m99.txt`, `m100.txt`, `m276.txt`, `btl-omeg00_10.txt`, `btl-omeg01_10.txt`, `btl-zzzz02_76.txt`, `pos-*.txt`, `rec-m99.out.txt`, `rec-m100.out.txt`, `rec-m276.out.txt`, `rows-43.out.txt`, `special-cmds.mjs` and its output (the special-class list), `t-weapons.mjs` and `t-weapons.out.txt` (the runs), `calc-43.mjs` and `calc-43.out.txt` (the arithmetic and the two exact counter distributions), `abil-names.mjs`, `web/` (the guide texts). Not done: any run of the game, any browser, any art or GPU work, any change to the repo.
