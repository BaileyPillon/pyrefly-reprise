# FFX Penance and its Left and Right Arms: every number from the game's own files, checked against the guides

**Game case: FFX only.** Penance exists in the International and HD Remaster releases of Final Fantasy X and nowhere else; FFX-2 has nothing like it and nothing here applies to it (AGENTS.md rule 14). Part of the `re-parity` track, drafted 2026-11-06 for the hidden Chapter XXXV preflight (`docs/plans/ch-penance-review.md`). It extends the "Penance, for size only" section of `research/re-ffx-yojimbo-sisters-feasibility.md` (section 7) into the whole record: the full AI, every move row with its formula, the clock numbers, the damage the moves do to a capped party, the Break limit facts, and a line-by-line check against four public guides. **No engine, data or AI code was changed by this note.**

## 0. The one-screen summary

- **Three actors in one formation `hiku15_70`.** Penance (m344, 12,000,000 HP) and two arms (m345 Right Arm, m346 Left Arm, 500,000 HP each). All three absorb all five elements (Fire, Ice, Thunder, Water, Holy), so elemental magic heals them. Penance starts with Protect on. [bytes]
- **Phase 1 (HP at or above three quarters, 9,000,000):** every turn of Penance is **Obliteration** on the whole front line (physical, power 24, Slow). **Phase 2** starts on the first damaging hit that leaves it below 9,000,000 (strictly below): it uses Separation on itself, loses Protect, gains Haste for one turn, and from then on every turn is **Immolation** on one random living member (physical, power 32, Armor Break and Mental Break, HP and MP) except when the **counter** reaches 20. [bytes] [run]
- **The counter** is one private variable: it adds 1 on every turn of Penance in phase 2 and 1 for every damaging action that reaches it in phase 2 (one per action and target, however many hits). At 20 or more, **Judgment Day** goes at the whole front line on that turn **only if both arms are up** (neither arm is in its revival wait), and the counter returns to 0; if an arm is down the turn is an Immolation and the counter keeps growing, so the first turn on which both arms are up spends it. Judgment Day deals 99,999 HP damage and drains all MP (999), as the guides say. [bytes] [run]
- **The arms revive.** An arm that dies while Penance lives uses Atrophy, is re-initialised from its record at **full HP**, becomes untargetable and hidden from the turn list, and writes a "down" flag the body reads. On its **next turn** it uses Regeneration, becomes targetable and visible, and clears the flag. By the clock numbers that is **12 ticks** after its death (section 5.3), against a Penance turn of 9 ticks. When Penance dies it forces its own Death and sets both arms to 0 HP. [bytes] [run] [derived]
- **The arms' moves.** Right Arm: Attack (power 36, Petrify), Calamity (no damage; Poison, the four Breaks, Silence, Darkness, Curse), Mighty Guard (Shell, Protect and Regen on Penance and the arms). Left Arm: a dispelling Attack (power 36, strips buffs and Auto-Life), Tera Graviton (12/16 of every member's maximum HP and Sleep, Silence, Darkness, Slow, Doom), Slowga. First turn: Strength and Agility to 255; second turn on: Haste. [bytes] [run]
- **What a capped party takes** (STR 255 against DEF 255, the repo's damage kernel): Obliteration 20,962 to 23,670, Immolation 27,950 to 31,560 (Auto-Protect halves; five Cheers on the target take a third off), an Armor-Broken member takes 99,999 from any of the physical moves, Judgment Day 99,999 to everyone. [derived] (section 4.2)
- **The Break limits** (section 6): a hit is capped at 9,999, or 99,999 with Break Damage Limit on the attacker; every Penance move row forces the 99,999 cap. The six-Quick-Hits-per-arm figure of the guides (500,000 / 99,999 = 5.00005, so six hits) is exactly what a Celestial weapon with its built-in Break Damage Limit does; **the engine models every weapon as the plain one (formula 1, power 16), so the Celestial rows (section 6.3) are the one data piece the chapter needs that the repo does not have.**

## 1. Sources, tags, files

| Tag | Meaning |
|---|---|
| **[bytes]** | read from the game's own file by the RE program's tools (the Steam build 25501027 archive, files extracted read-only and kept outside the repo). A script read as disassembly is [bytes]. |
| **[run]** | the script's real bytecode executed in the RE program's Atel interpreter against a mock battle (section 5.5); engine handlers behind it are the ones the earlier AI notes read in Ghidra. |
| **[derived]** | computed here from [bytes] by the repo's own kernels (`src/battle/ffx/kernel/damage.ts`, `kernel/ctb.ts`) or by arithmetic. |
| **[W: name]** | a public guide: Jegged (Penance page, jegged.com), GamerGuides (HD guide, Penance page), eip.gg (Penance guide), Game8 (Penance page, last updated 2020). **GameFAQs:** the HD Remaster walkthrough's Dark Aeons page and the boards answered 403 to a plain fetch, so GameFAQs is tagged [W: GameFAQs, search summary only] where a search result's summary of that walkthrough is the only reading; nothing rests on it alone. |
| **[inferred] / [unproved]** | stated as such. |

Files used (size in bytes, SHA-256 prefix): monster files `m344` Penance (147,076; 54ebc070), `m345` Right Arm (20,824; 52d063e2), `m346` Left Arm (20,756; 4435d129); formation `hiku15_70` (12,872; ebce783b); kernel tables `monmagic1.bin` (31,420; 31a83925, the monster command rows), `monster3.bin` (35,867; 7978736a, the monster records), `command.bin` (40,957; 88e6a63a, the player command rows), `weapon.bin` (3,386; 1ebc2df4, the weapon rows). Move names are the English names of the game's own tables (the US text copy of the same rows); no script text, decompiled code or dialogue is reproduced, and scripts are described only by what they do to the battle.

## 2. Where the pieces are

| Piece | Identifier | Tag |
|---|---|---|
| Penance / Right Arm / Left Arm | monster files m344 / m345 / m346; monster words 0x1158 / 0x1159 / 0x115A; models 4440 (Penance) and 4441 (both arms: one model) | [bytes] |
| Formation | `hiku15_70`: area key 395, stage 395, map `hiku15`, weight 0 in the zone table (never rolled at random); battle id would be 25,886,790 (0x018B0046) | [bytes] |
| The same map | holds the Evrae fight (`hiku15_00`), the airship deck fight of Chapter VIII | [bytes] |
| Start positions | party (-24.830, -35, 105.859), (-25.616, -35, 82.909), (-28.236, -35, 60.572); Penance (-150.801, 63, 90.078); Right Arm (-145.990, -8, 40.089); Left Arm (-150.678, -8, 138.949). Second start area: party (-35,-35,40), (-40,-35,80), (-45,-35,120); monsters (-370,-35,80), (-170,-35,80), (0,0,0) | [bytes] (section 7 of the feasibility note) |
| Formation script | sets the ambush state to Normal and nothing else about the rules: **Escape and Flee are not disabled**, there is no early-end call, no Talk command. The rest is the camera rigs per summoned aeon and the Separation scenes | [bytes] |
| How the battle is launched | **not found.** No literal launch of 0x018B0046 exists in the 377 field events read (20 variant event files of 397 were not read); a raw scan finds the constant only in one event file the disassembler cannot parse | [unproved] |
| What unlocks it | all eight Dark Aeons defeated (Dark Yojimbo five times in a row among them); a "Penance" destination then appears on the airship | [W: Jegged, eip.gg, GamerGuides, GameFAQs search summary]; the files do not say |

**The arena [inferred].** The formation lives in the airship map `hiku15` beside the Evrae fight and the party stands where the Evrae party stands (a deck), with the body 125 units away and 63 above it and the arms either side at -8: a giant seen from the deck. One guide places the spawn in the Calm Lands; the files place the fight on the airship map. The preflight uses the deck plate.

## 3. The monster records

Offsets are record offsets in the 0x80-byte kernel row (`monster3.bin`, byte-identical to the monster file's own copy, checked in the feasibility note for all eleven files).

| Field | Penance m344 | Right Arm m345 / Left Arm m346 (identical rows) | Tag |
|---|---|---|---|
| HP / MP / overkill threshold | 12,000,000 / 999 / 99,999 | 500,000 / 999 / 99,999 | [bytes] [W: Game8 agrees] |
| STR DEF MAG MDEF | 255 / 240 / 255 / 200 | 200 / 200 / 150 / 200 | [bytes] |
| AGI LCK EVA ACC | 255 / 10 / 0 / 255 | 150 / 10 / 120 / 255 | [bytes] |
| Elements (absorb / immune / resist / weak) | absorb Fire, Ice, Thunder, Water, Holy; the rest none | same | [bytes] [W: Game8 lists all five at -150 percent, its sign for absorb] |
| Status resistance (255 = immune) | Death, Zombie, Petrify, Poison, Power, Magic, Armor, Mental Break, Confuse, Berserk, Provoke, Sleep, Silence, Darkness, Slow: 255. Shell, Protect, Reflect, the four Nuls, Regen, Haste: 0 (they land). Threaten also reads 0 in the record, but the repo gives every boss `threatenChance: 0` (decision C-4 of `src/battle/ffx/ai/evrae-rules.ts`: Threaten defaults to immune), so it does not land here | same | [bytes] |
| Automatic status | **Protect** (temporary status, from the first turn) | none | [bytes] |
| Extra-status immunity | Scan, the four Distillers, Eject, Auto-Life, **Doom** | the same **without Doom**: an arm can be Doomed | [bytes] |
| Flag bytes +0x28 / +0x29 | 0x1E (immune to percentage damage, Life, Sensor, a second Scan) / 0x07 (immune to CTB damage, Slice, Bribe) | same | [bytes] |
| Poison damage byte | 25 | 25 | [bytes] |
| Doom countdown (+0x77) | 255 | 200 | [bytes] |
| Zanmato byte | 5 (Zanmato level 6) | 5 | [bytes] [W: Game8 lists Zanmato Lv. 6] |
| CTB icon / forced action / arena index | 21 / none / 255 | 22 / none / 255 | [bytes] |
| Command list (+0x50) | Attack 0x4000, Immolation 0x411F, Obliteration 0x4120, Judgment Day 0x4121, Separation 0x4122, Appearance 0x4123, Death 0x4124 | Right: Attack 0x4000, Regeneration 0x4125, Atrophy 0x4126, Attack 0x4127, Calamity 0x4104, Mighty Guard 0x412A. Left: Attack 0x4000, Regeneration, Atrophy, 0x412B (name table "Extra 44"), Tera Graviton 0x4129, Slowga 0x3039 | [bytes] |
| AP (overkill AP) | 60,000 (65,000) | 10,000 (12,000), paid on every death | [bytes] [W: eip.gg, Game8] |
| Drop | Master Sphere x3 (x6 on an overkill) | Dark Matter x1 / Master Sphere x1 | [bytes] [W: Jegged] |
| Steal | Elixir x1 / Megalixir x2 | Elixir x1 / Elixir x1 | [bytes] [W: Jegged] |
| Gear drop | chance 255; weapons draw Break Damage Limit, armour Ribbon | chance 0 | [bytes] (feasibility note, section 7) |
| Death animation / Tough / Heavy | "Boss" (the body stays, untargetable), Tough and Heavy on (no delay recoil, no lift-off) | the same | [bytes] (init of the three scripts) |

No record carries a level. The arms' Strength and Agility are rewritten to 255 on their first turn (5.2), so the Strength 255 and Agility 150 that one guide lists for the arms are the buffed Strength with the base Agility [W: Game8].

## 4. The moves

### 4.1 The rows (monster magic table 1, 92 bytes; layout `research/re-ffx-commands.md` section 1)

Accuracy formula 0 (always hits) on every row except Attack 0x4000: **every data row must set `canMiss: false`** (AGENTS.md rule 5). Rank 3 on every row. Cap column: `99,999` is flag-word-2 bit 0x80. [bytes]

| Id and name | Used by | Target | Class | Formula / power / hits | Damage type, flags | Statuses and extras |
|---|---|---|---|---|---|---|
| 0x4120 Obliteration | Penance, phase 1 | whole front line (0x3b) | HP | 1 (STR vs DEF) / 24 / 1 | physical, cap 99,999, shatter 100 | Slow 254, duration 254 |
| 0x411F Immolation | Penance, phase 2 | one (0x33) | **HP and MP** | 1 / 32 / 1 | physical, cap 99,999, shatter 100 | Armor Break 254, Mental Break 254 |
| 0x4121 Judgment Day | Penance, counter at 20 | whole front line | **HP and MP** | 15 (MAG cube, no defence) / 240 / 1 | **neither** physical nor magical (no Protect or Shell halving), cap 99,999 | none |
| 0x4122 Separation | Penance on itself, at the change | self | none | 0 | scene row, no effect | none |
| 0x4123 Appearance, 0x4124 Death | no hook calls Appearance; Penance forces Death at its death | self | none | 0 | scene rows, no effect | none |
| 0x4125 Regeneration, 0x4126 Atrophy | the arm's return and its death | self | none | 0 | scene rows, no effect | none |
| 0x4127 Attack (arm) | Right Arm, 1 in 3 turns (and when Penance has Regen) | one | HP | 1 / 36 / 1 | physical, can crit, crit bonus from gear, cap 99,999, shatter 100 | **Petrify 254** |
| 0x4104 Calamity | Right Arm, 1 in 3 | one | none | 3 / 0 / 1 | cap 99,999 (no damage: power 0) | Poison, Power Break, Magic Break, Armor Break, Mental Break, Silence, Darkness all 254 (Silence and Darkness duration 254); extra word 0x400 = **Curse** |
| 0x412A Mighty Guard | Right Arm, 1 in 3 when Penance has no Regen | the script's matching group (Penance, itself, and the Left Arm while it is up) | none | 3 / 0 / 1 | not damage | Shell 254, Protect 254, Regen 254, each duration 254 |
| 0x412B ("Extra 44") | Left Arm, 1 in 3 (and in two cases below) | one | HP | 1 / 36 / 1 | physical, can crit, crit bonus, **cleanse** (bit 5), cap 99,999, shatter 100 | removes Shell, Protect, Reflect, the four Nuls, Regen, Haste and (extra 0x200) Auto-Life [bytes + `research/re-ffx-dark-aeons.md` 6.2] |
| 0x4129 Tera Graviton | Left Arm, 1 in 3 | whole front line | HP | **8 (fraction of the target's maximum HP)** / 12 / 1 | **magical** (Shell halves), cap 99,999 | Sleep 254 (duration 99), Silence 254 (99), Darkness 254 (99), Slow 254 (254); extra word 0x4000 = **Doom** |
| 0x3039 Slowga | Left Arm, 1 in 3 when a member is not slowed | whole front line | CTB | 13 (target running CTB) / 16 / 1 | the player's own Slowga row | Slow chance 100, duration 254 |
| 0x4000 Attack | in all three lists, called by no hook | | HP | 1 / 16 / 1 | accuracy formula 2, byte 90, can crit | none |

### 4.2 What the moves do to a capped party [derived]

The repo's damage kernel (`kernel/damage.ts`, the game's 0x789bf0) with the variance factor V from 240 to 271, then the halvings and the cap by hand. Defender: DEF 255 and MDEF 255, HP 9,999, no weapon extras; "target Cheers 5" is Ultra Nul-All's effect. Auto-Protect halves a physical hit (Defense +20 percent, a separate armour ability, takes a further 20 percent off incoming physical damage).

| Move | no buff | Auto-Protect | Auto-Protect, 5 Cheers on the target | Armor-Broken target (DEF 0) |
|---|---:|---:|---:|---:|
| Obliteration | 20,962 to 23,670 | 10,481 to 11,835 | 6,987 to 7,890 | 99,999 |
| Immolation | 27,950 to 31,560 | 13,975 to 15,780 | 9,316 to 10,520 | 99,999 |
| Arm Attack 0x4127 / dispelling 0x412B (STR 255 after the first-turn write) | 31,443 to 35,505 | 15,721 to 17,752 | 10,481 to 11,835 | 99,999 |

- **Judgment Day**: 7,287,145 to 8,228,401 before the cap, so **99,999 to every member, always**; it also takes the MP (999). It is neither physical nor magical, so neither Protect nor Shell touches it, and a member at 99,999 maximum HP dies too (99,999 - 99,999 = 0). Only an Auto-Life revive (Auto-Phoenix, a Phoenix Down afterwards) keeps a member in the fight. [derived] [W: Jegged gives 99,999 damage and 999 MP; Game8 and eip.gg agree]
- **Tera Graviton**: 12/16 of the target's maximum HP: 7,499 on a 9,999-HP member (3,749 under Shell), 74,999 on a 99,999-HP member (37,499 under Shell). Doom starts at 5 for a party target. [derived] [W: GamerGuides "75 percent"]
- A single **Immolation** at DEF 255 is about 30,000 [W: a GameFAQs board post gives about the same] and an Armor-Broken member takes the 99,999 cap from the next physical hit [W: Jegged and the GameFAQs summary both say to Dispel anyone an Immolation hit]. With Auto-Protect, Defense +20 percent and five Cheers an Immolation is 7,453 to 8,416 against a 9,999-HP member (9,316 to 10,520 times 0.8). [derived]
- **What the party does to Penance** (a plain physical hit, STR 255, power 16): 19,964 to 22,542 on the body (DEF 240) before Protect, which halves it in phase 1; 49,245 to 55,606 on an arm (DEF 200). A non-elemental spell (formula 3, power 100, MAG 255) does 25,984 to 29,341 (MDEF 200); the five elements heal. [derived]

## 5. The AI

### 5.1 Variables

The scripts' `v` numbers are indices into each script's variable table. **Battle variables** are shared by the three scripts and the formation; **private** ones belong to one actor and start at 0. [bytes]

| Name used here | Where | Written by | Read by |
|---|---|---|---|
| RIGHT_DOWN (battle 0x04) | m344 v0, m345 v0 | Right Arm: 1 at its death, 0 at its return | Penance (Judgment Day gate) |
| LEFT_DOWN (battle 0x08) | m344 v1, m345 v1, m346 v0 | Left Arm: 1 at its death, 0 at its return | Penance (gate), Right Arm (Mighty Guard group) |
| PHASE2_A, PHASE2_B (battle 0x20, 0x24) | m344 v2, v3 | Penance: 0 at init, 1 at the change | nothing in these three scripts reads them (the formation's scenes may) |
| Penance private: target (v4), phase (v5: 0 phase 1, 1 phase 2), counter (v6) | m344 | Penance | Penance |
| Arm private: revival step (Right v4, Left v3), turn count (Right v6, Left v5), "was killed with Penance alive" (Right v7, Left v6), target and roll temporaries | m345, m346 | the arm | the arm |

### 5.2 Penance (m344), by hook [bytes] [run]

- **Init:** DeathAnimation "Boss", Tough, Heavy, the camera-animation swaps; PHASE2_A and PHASE2_B := 0.
- **onTurn:** phase 1 (private v5 = 0): Obliteration on the front line, nothing else, no counter. Phase 2: counter += 1; if the counter is below 20: Immolation on `findMatchingChr(front line, alive)` (stream 4, uniform over living members, no draw with one candidate). If it is 20 or more: when RIGHT_DOWN = 0 **and** LEFT_DOWN = 0: counter := 0 and Judgment Day on the front line; otherwise Immolation on a random living member.
- **onHit:** only when `LastDamageTakenHP` is above 0: in phase 1, if HP is **strictly below `(maxHP * 3) / 4`** (9,000,000): PHASE2_A := 1, PHASE2_B := 1, phase := 1, Separation on itself, Protect := 0, **Haste := 1** (a counter of 1: one turn of Haste [W: Jegged, eip.gg "one turn"]). In phase 2, every damaging hit adds 1 to the counter. `onHit` runs once per action per target, after the last hit record, so a six-hit Overdrive counts once. (Engine fact from the Evrae/Yojimbo lane: `pp_BtlApplyHitRecords`.)
- **onDeath:** forces its own Death (0x4124) and sets the HP of actors 21 and 22 (the arms) to 0.
- **onMove / others:** the function the move hook points at hides model part 3 and shows part 0; sound and motion calls. That part 3 is the lower body that falls away at the change is [inferred] (GamerGuides says the lower half falls off at that point). No counterattack, no Escape lock.
- **Run results (the interpreter, mock world, party of three):** 30 phase-1 turns = Obliteration x30 on the front line; HP 9,000,001 and exactly 9,000,000 after a damaging hit: nothing; 8,999,999: Separation, Protect 0, Haste 1, both battle flags 1, phase 1; a hit with `LastDamageTakenHP` 0: nothing. Judgment Day lands on its **20th phase-2 turn with no hits taken**, the 10th with one damaging action per own turn, the 7th with two, the 5th with three, the 4th with five; with either arm flagged down for 60 turns it never lands; with the Right Arm down for 24 turns the counter reaches 24 on Immolations and the first turn after the flag clears is Judgment Day, counter back to 0. Immolation targets over 3,000 draws: 989 / 1,012 / 999. [run]
- **Cross-check:** eip.gg describes a hidden counter that rises by 1 when Penance is hit and when it uses Immolation, and says that once it reads 19 with both arms alive the next turn is Judgment Day [W]: the same rule (the bytes add 1 at the start of the turn and test for 20). Jegged and GamerGuides: Judgment Day needs both arms alive and active [W]. The GameFAQs summary says Penance must never get a turn with both arms up, and that one arm up is fine [W]. All agree with the bytes.

### 5.3 The arms (m345 Right Arm, m346 Left Arm) [bytes] [run]

- **Init:** DeathAnimation "Boss", Tough, Heavy. The Left Arm's script also sets its own step variable (v4 = 1 in its table; unused in any branch read).
- **onTurn, normal state:** turn count += 1. Turn 1: Strength := 255 and Agility := 255 (before the action). Turn 2 and later: the same two writes plus **Haste := 1** each turn. Then a roll `GetRandomValue() mod 3` (stream 2):
  - **Right Arm:** 0: Attack 0x4127 on a random living member; 1: Calamity on a random living member; 2: if **Penance has Regen** then Attack 0x4127 on a random living member, else **Mighty Guard** on the group "all monsters", minus the Left Arm (actor 22) when LEFT_DOWN is set. Exact tallies over all 65,536 stream-2 results: Penance without Regen: Attack 21,846, Calamity 21,845, Mighty Guard 21,845; with Regen: Attack 43,691, Calamity 21,845. [run]
  - **Left Arm:** 0: dispelling Attack 0x412B on a random living member; 1: Tera Graviton on the front line; 2: if some front-line member is **not Slowed** then Slowga on the front line, else the dispelling Attack on a random living member. Tallies: no member slowed or one member free: 21,846 / 21,845 / 21,845; all three slowed: dispelling Attack 43,691, Tera Graviton 21,845. [run]
- **onDeath:** if **actor 20 (Penance) is alive**: forced Atrophy, `revive/reinitialize(self)` (re-initialised from the monster record: HP and MP full, statuses and stats back to the record, the kill rewards paid at the death; the engine handler: `research/re-ffx-ai-gui.md` section 6 [bytes, engine read, label B]), untargetable, hidden from the CTB list, revival step := 1, "killed with Penance alive" := 1, the arm's down flag := 1. If Penance is not alive: Atrophy only and no revival (an arm that was already in its revival wait gets neither).
- **onTurn, revival wait (step 1 or more):** step += 1; at 2: **Regeneration** on itself, targetable, visible, step := 0, turn count := 0, flags cleared, the down flag := 0. So the arm is back **at its very next turn**, after one turn spent on Regeneration; its first real action comes the turn after, with the writes of turn 1.
- **Run results:** both arms: death with Penance alive: Atrophy forced, reinitialise, targetable 0, visible 0, flag 1, HP back to 500,000; next turn: Regeneration, targetable 1, visible 1, flag 0; death after Penance is dead: Atrophy, no revival; Penance dies: Death forced, both arms to 0 HP. Turn 1: Strength 255, Agility 255, Haste 0; turn 2: Haste 1. [run]
- **Clock numbers [derived, the repo's CTB kernel]:** tick speed 3 at Agility 255, 4 at Agility 150; a rank-3 action costs 9 ticks plain, 4 Hasted, 18 Slowed at Agility 255 and 12 plain at Agility 150. A re-initialised arm's counter is set to its stored base, 12 ticks at Agility 150. **The arm returns 12 ticks after it dies; Penance's own turn is 9 ticks (4 on its one Hasted turn)**, so an arm is down for one Penance turn and sometimes two. After the Regeneration turn (12 ticks) the arm acts at Agility 255 (9 ticks) and Hasted from its second action (4). [W: Jegged and eip.gg say the arms return after a few turns, which reads as Penance's turns; GamerGuides puts about 9 ticks between Penance's turns, the same 9.]
- **Regen:** a holder is paid `(ticks since last payout * maxHP >> 8) + 100` at the start of any actor's turn (`research/re-ffx-ctb-status.md` section 14), so Mighty Guard's Regen heals Penance about **46,975 HP per tick** (12,000,000 / 256 + 100) [W: GamerGuides gives exactly 46,975] and an arm 2,053. The row's Regen duration byte is 254 (a counter of 254 does not tick down at the holder's turn starts, so the status lasts until dispelled; GamerGuides says ten turns, which fits an older table [inferred]).
- **Cross-check:** Jegged, eip.gg, Game8: the arms respawn at full HP after a few turns and keep respawning [W]; eip.gg: six Quick Hits kill an arm, which is 500,000 / 99,999 rounded up [W, derived]; Game8 and Jegged list the same moves; GamerGuides names the Left Arm's Tera Graviton "Mega-Graviton" [W: name differs, effect agrees with the row].

## 6. The Break limits

1. **Damage per hit.** The cap is 9,999, or 99,999 when the attacker has Break Damage Limit; a command row with flag bit 0x80 forces 99,999 whatever the attacker has (`research/re-ffx-damage.md` section 6). **Every damaging row of Penance and the arms has bit 0x80** (section 4.1), so a monster hit can reach 99,999.
2. **HP per member.** 9,999, or 99,999 with the armour ability Break HP Limit (`break-hp-limit` in the repo). Judgment Day kills at either (section 4.2). Immolation does 7,453 to 31,560 depending on buffs, an Armor-Broken member takes 99,999, so the limit only changes how many hits a member survives.
3. **What the guides say about it (they differ).** Jegged says neither Break HP Limit nor Ribbon is needed; its armour is Auto-Haste, Auto-Protect, Auto-Potion and Defense +20 percent, with Celestial weapons [W]. GamerGuides: keep HP at 9,999 for the extra armour slot; Ribbon, Auto-Haste, Auto-Protect, Auto-Potion; Stoneproof against the arm's Petrify [W]. eip.gg: max HP 99,999 if the limit is broken, else armour made for the fight [W]. GameFAQs boards (search summary): Break HP Limit is an alternative but needs a Dispel after each Immolation [W]. The repo's Ribbon does not stop the Breaks, Curse or Death (`types.ts` doc of `ribbon`), consistent with Immolation being the threat Ribbon cannot answer.
4. **Penance's own thresholds.** Overkill at 99,999 in one killing action (Master Sphere x6) [bytes]. Its gear drop is Break Damage Limit on a weapon and Ribbon on armour [bytes].
5. **The Celestial weapons carry Break Damage Limit.** `weapon.bin` rows 139 to 145 (the seven final Celestial weapons; layout from the community parser, documentation only) hold formula and power at +0x08 and +0x09 and four fixed abilities; the first is 0x8019, which the repo's gear table (`adapt/gear-ids.ts`) numbers 25, `break-damage-limit`. [bytes]

   | Row | Wielder | Formula (power 16, crit 3, 4 slots) | Fixed abilities (repo ids) |
   |---|---|---|---|
   | 139 | Tidus | 0x11 Celestial HP | Break Damage Limit, Triple Overdrive, Evade & Counter, Magic Counter |
   | 140 | Yuna | 0x12 Celestial MP | Break Damage Limit, Triple Overdrive, Double AP, One MP Cost |
   | 141 | Wakka | 0x11 | Break Damage Limit, Triple Overdrive, Double AP, Evade & Counter |
   | 142 | Kimahri | 0x11 | the same four as Wakka |
   | 143 | Auron | 0x13 Celestial low HP | Break Damage Limit, Triple Overdrive, First Strike, Counterattack |
   | 144 | Lulu | 0x12 | Break Damage Limit, Triple Overdrive, Magic Booster, One MP Cost |
   | 145 | Rikku | 0x11 | Break Damage Limit, Triple Overdrive, Double AP, Gillionaire |

   (Other rows carry the same flag but are not the final Celestials: rows 12 to 34 are the earlier story weapons, all formula 1, rows 135 and 136 are Tidus's Brotherhood and an earlier Caladbolg, formula 1, and row 122 is a Rikku row with formula 19; the other 75 plain weapon rows are formula 1 power 16 and seven are formula 1 power 64.) [bytes] The formulas 0x11 to 0x13 are in the repo's kernel (`kernel/damage.ts`) and need no defence term: Tidus at full HP does 485,809 to 548,560 before the cap (264,986 to 299,213 at half HP, 88,328 to 99,737 at a tenth), Auron's 0x13 at full HP 242,904 to 274,279, so **while the wielder has more than about a tenth of his HP every Celestial hit on Penance or an arm is 99,999** (Protect's halving still leaves more than the cap), and 500,000 / 99,999 = six hits an arm, 12,000,000 / 99,999 = 121 hits the body. [derived] The engine models every weapon as formula 1, power 16 (`adapt/hit.ts` 199 to 201).

## 7. Rewards

Penance pays 60,000 AP (65,000 on an overkill), Master Sphere x3 (x6 on an overkill), no gil; an arm pays 10,000 AP (12,000) and Dark Matter or a Master Sphere on **every death** (the kill rewards are rolled for each death that is not a silent removal), which is why the guides farm the arms. [bytes] [W: Jegged, eip.gg, Game8]. The "Perseverance" achievement is a store matter and out of scope.

## 8. The check against the guides (summary)

| Claim | Bytes | Guides |
|---|---|---|
| 12,000,000 HP, arms 500,000, 99,999 overkill, AP 60,000/10,000 | yes | Game8, eip.gg, Jegged, wiki figures all agree |
| Phase 2 at 9,000,000, Separation, one turn of Haste, Protect off | yes | Jegged, eip.gg, GameFAQs summary: after about 3,000,000 HP lost |
| Obliteration (all, Slow) then Immolation (one, Armor and Mental Break, MP) | yes | all four |
| Judgment Day: 99,999 HP and 999 MP, only with both arms up | yes | Jegged, eip.gg, Game8, GamerGuides |
| Counter: +1 per hit and per Immolation; Judgment Day at 20 | yes (the same counter, checked at the turn start) | eip.gg exact |
| Arms revive at full HP after a few turns | yes: 12 ticks | all; GamerGuides puts about 9 ticks between Penance's turns |
| Right Arm: Petrify attack, Calamity, Mighty Guard | yes | Jegged, Game8, GamerGuides, eip.gg |
| Left Arm: dispelling attack, Tera Graviton, Slowga | yes | Jegged, GamerGuides, eip.gg (Game8 names the Graviton "Mega-Graviton") |
| Mighty Guard: Protect, Shell, Regen on Penance and the arms | yes | Game8, eip.gg (GamerGuides says ten turns; the row says 254) |
| Stats table | yes | Game8 matches to the byte (arms' Strength 255 is the buffed value) |
| Death drops, steals | yes | Jegged, Game8 |
| Escape works; Yojimbo's Zanmato ends the fight | formation does not disable Escape; Zanmato byte 5 and Death immunity do not stop a landed Zanmato (`research/re-ffx-zanmato-and-orders.md` section 3) | GameFAQs summary |
| Where it is fought | airship map `hiku15` | guides: "Calm Lands" spawn; the files name the airship map |

## 9. What the engine needs (detail in the plan)

New rows and scripts: three enemy defs and one group (one `ChapterId`, number 35), the 13 rows the scripts call (Attack 0x4000 and Appearance 0x4123 sit in the command lists and no hook calls them; Calamity, the 0x4127 Attack and the dispelling 0x412B already exist as Dark Aeon rows in `src/data/ffx/enemies/dark-aeons-abilities.ts`, Slowga as the player's ability), a hook set for Penance (`onHit`) and a **death hook for the arms** (the engine has no `onDeath` hook; a hit death can ride `holdsDeath` plus `onHit`, a Doom death needs a poll like Macalania's), a battle-flag block for the two down flags and the phase, the arm revival state (reinitialise, hide, untargetable, keep the clock), `doomTurns: 200` on the arms, the Celestial weapon rows as an additive build field. `docs/plans/ch-penance-review.md` section 3.

## 10. What is not proved

1. **The launch of the battle** and the arena it is fought in (section 2).
2. **Whether a hidden arm keeps its CTB turn** with VisibleOnCTB 0: the re-initialise handler keeps GetsTurns and VisibleOnCTB as the script set them, which is what the script's own "next turn" wait needs [label B]; not run in the game.
3. **Initial CTB** of the three monsters and the order of the first turns.
4. **Haste on the arms**: the write is a counter of 1 each turn from the second; whether the delay of the action sees it before the end-of-turn tick takes it off is the engine's order of operations, not run.
5. **The Regen duration** (row byte 254 against the guide's 10 turns).
6. **Model heights** of m344 to m346 (no stature row): the on-screen size is an estimate until read.
7. **The PHASE2 battle flags** (0x20, 0x24): nothing in the three scripts reads them; the formation's scenes may.
8. **Run results are from the RE program's mock world**, not from the game or from this repo's engine; the engine's own run is owed by the chapter's tests.
