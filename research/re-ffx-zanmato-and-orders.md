# FFX: what a landed Zanmato does, and the Magus Sisters' orders (from the game's own code, scripts and files)

**Game case: FFX only.** The player's Yojimbo, his Zanmato, the possessed Yojimbo and the Magus Sisters' order commands exist only in FFX; FFX-2 has none of these rows and nothing here applies to it. Part of the `re-parity` track, written 2026-10-15 for the release driver who builds the hidden chapters "Dark Mirror" (27: the player's Yojimbo and Magus Sisters against their Dark twins) and "The Last Summoning" (28: the last two aeons against Yu Yevon's chain, then possessed). Research only: no engine, data, AI or test file was changed.

**Part 1 (Zanmato) is complete. Part 2 (the Sisters' orders) follows in the next commit of this branch.**

**Source and tags.** Every statement carries one:

- **[harness]** the game's own machine code (`FFX.exe`, Steam build 25501027, SHA-256 starting 0537B2A1) run in the Unicorn harness with only the random-number function scripted; presentation, queue and loot helpers are hooked and their calls recorded. The game was never run.
- **[disasm]** read from the disassembly of the executable, or of a battle script's bytecode (1,224 battle scripts: every monster file and every formation file of the install, plus the two battle-system scripts).
- **[data]** read from the install's own kernel tables and monster files (the copies used were compared by SHA-256 prefix with the archive itself).
- **[note: X]** taken from a checked note: FFX-G02 (KO and death), FFX-G04 (targeting), FFX-G08 (aeon-side logic), FFX-H02 (record layouts), `research/re-ffx-ctb-status.md`, `research/re-ffx-ai-yunalesca-bfa.md`, `research/re-ffx-last-summoning.md`.
- **[inferred]** follows from read facts, nothing ran it.

No script text, decompiled code or game dialogue is reproduced. Command names are the English names of the game's own tables, used as identifiers.

## 0. The answers in one screen (Part 1)

1. **Whom a landed Zanmato hits: every legal enemy of ONE enemy group.** When Yojimbo's script chooses the player's Zanmato (command 0x30E2) the random-target native builds the legal set of the other side (every monster in the battle, not removed, targetable, not dead, battle distance 1 or less), picks one group of it (the group byte of the monster, 0 to 7) with one stream-5 draw, and the action's mask is all legal members of that group. Every member gets the hit. All the monsters of chapters 27 and 28 (Dark Aeons, possessed aeons, Yu Pagodas, Braska's Final Aeon, Yu Yevon) are group 0, so in practice it is every legal enemy. It is not "the first target". [harness 1,500 vectors; disasm] (section 2)
2. **The Slice flag does nothing in this build, and Death immunity does not stop Zanmato.** The command record has no Slice flag; "Slice" is the monster record's bit (flag byte +0x29 bit 1, `Chr+0x5B8` bit 9; the game's own property name is "disable Zanmato"). No instruction of the battle code reads it; the only reader is the script property getter, and none of the 1,224 battle scripts reads or writes that property. The Zanmato row's only status is Death at chance 255, and the infliction rule lands a chance of 255 whatever the resistance byte is (255 included), so Death-immune, Zombie and Slice-immune targets all die: HP 0, KO, every status and Auto-Life wiped, the monster leaves the battle. No miss, no "no effect", no damage instead, no fixed amount. [harness 16,384 cross vectors + 4,096 paired bit-flip runs, 0 differences; disasm] (sections 3 and 4)
3. **No HP-to-1 and no fixed-damage path in the player's row**: damage class 0 (no HP, MP or CTB), zero damage in all 300 sampled vectors. The "stay at 1 HP" reactions exist only in a few ordinary monsters' scripts (Zu, Stratoavis, Magic Urn) and those scripts return early when the used command is 0x30E2, so Zanmato overrides them. [harness; disasm] (section 4)
4. **The possessed Yojimbo's Zanmato is a different row (0x60E2)**: HP damage, fixed formula 6, power 200, so 200 x 50 = 10,000 cut to **9,999 on each front-line actor**, no status, no Death. Run on the real code: 9,999 in all 63 variants (target HP 1 to 50,000; Protect, Shell, Defend, Sentinel, Auto-Life; stats 1 to 255), one HP-variance draw per target. [harness; data] (section 5)

## 1. The four Zanmato rows [data]

All four read from the install's kernel tables (the command table 0x3000 and the two monster-magic tables 0x4000 and 0x6000). "Type" is `(Cmd+0x1A >> 2) & 3`: 0 single, 1 group, 2 all of the chosen side; "reach" is `(u16 at Cmd+0x1A >> 7) & 3`.

| Row | Used by | Damage class | Formula / power / hits | Type / reach | Status | Other fields |
|---|---|---|---|---|---|---|
| **0x30E2** (command table) | the player's Yojimbo, when his roll picks it | **0 (none)** | 1 / 0 / 1 | **group** / 1 | **Death 255** (the only one) | accuracy formula 0 (never rolls), piercing, not reflectable, no crit, shatter chance **100**, rank 3, flag word 0x44010006, no extra statuses, no weapon properties |
| **0x60E2** (monster magic 2) | the possessed Yojimbo (added to his list at battle start) | HP | **6 / 200** / 1 | group / 2 | none | damage kind "neither", accuracy formula 0, not reflectable, shatter 0, same flag word 0x44010006, no cap flag |
| 0x4085 (monster magic 1) | Yojimbo of the Cavern of the Stolen Fayth | HP | 6 / 200 / 1 | all / 2 | none | same fields as 0x60E2 except the target byte |
| 0x410A (monster magic 1) | Dark Yojimbo | HP | **1 / 250** / 1 | all / 2 | none | Strength formula, damage kind "neither", **cap 99,999 flag**, **cleansing flag with the extra-status mask Auto-Life (0x200)**, shatter 100 |

The flag word's bit 30 (0x40000000) is set on the Zanmato rows and on the Delta Attack row (not on Wakizashi). A search of the battle code for a test of that mask finds none; the one instruction that uses the mask copies the bit into the command record built for the aeon arrival action. It is not a Slice flag [disasm]. The command record carries no field that names Slice, in any of the four rows [data].

## 2. Q1(a): whom a landed Zanmato hits

How the player's Yojimbo reaches it [note: FFX-G08 3.2, 3.3; disasm]: the roll (stream 17, thresholds in FFX-G08) names Zanmato; the script calls the random-target native with the command id; the native reads the record's target byte, derives the side (the opposite one for byte 0xB7), and calls the shared auto-target function, which stores the mask in the actor's saved target cell. The script then performs the command on the saved cell ("the matching group"). The same cell is what the free attack's Zanmato-byte check and the Pay script's second pass read as "the matching group".

The auto-target function for a group-type command [disasm; harness 1,500 vectors, 0 mismatches against an independent model written from the notes]:

1. The legal set of the side: every monster in the battle and not removed, then those that are **Targetable** (`Chr+0xDD9` non-zero), whose target class allows an ordinary actor (the row has the 0x400 usage bit, so class 0 passes), whose **battle distance is 1 or less** (the row's reach is 1), and that are **not dead** (the row lacks the dead-target bit).
2. If the set is empty: mask 0, no draw (Yojimbo then uses Wakizashi on all, FFX-G08).
3. Otherwise ONE draw on **stream 5** (always, even when only one group is populated): the populated groups in ascending group order, the chosen group is the one of rank (value mod number of populated groups), and the mask is **all members of the legal set that belong to that group** (group = `Chr+0x504`, low three bits).
4. The executor then builds the action's targets from the mask: hit count 1 each; **no Cover** (it concerns single-target physical rows only), **no Reflect bounce** (the row is not reflectable), no random spread; accuracy formula 0 means the hit check never rolls, so no Evade-and-Counter forced miss either; a group-type row never arms a counter. [harness; note: FFX-G04 4.3]

The group byte is written by very few scripts (five monster files, m113, m120, m134, m135 and m138, and two formation files, sins03_00 and znkd09_00), **none of them among the fights of chapters 27 and 28**: those foes are all group 0 [disasm of all 1,224 scripts]. Result for the chapters: **one stream-5 draw, then every legal enemy**. A monster that is hidden or untargetable at that moment (a Pagoda during its revive countdown, the helper actor, the dog stand-in after his first turn) is not in the set [note: re-ffx-ai-yunalesca-bfa.md 4, last-summoning 1.3].

In the harness the set size was 0 to 8 monsters with random groups (1 to 3), random distance 0 to 3, random Targetable and dead flags; in the 1,064 vectors where one group was populated, all the legal monsters died; in the 317 where several were, exactly the chosen group died and nobody else changed.

## 3. Q1(b): the Slice flag, Death immunity, and what a landed Zanmato does to a target

**The kill, step by step** [harness 7,700+ end-to-end vectors through the real calculator and the real hit applier; disasm]:

1. **Hit check:** none (accuracy formula 0). No draw. The "no effect" outcome is not set on the row.
2. **Status step:** one draw per target, in ascending slot order, on the user's own status stream (Yojimbo, an aeon: stream 66; a monster user has its own), taken before the chance is looked at. Death at chance **255** lands when the chance byte is 255, **before the resistance byte decides anything**: a chance of 255 ignores every resistance, and a resistance of 255 only blocks chances below 255 [note: `research/re-ffx-ctb-status.md` section 6; disasm; harness]. So a Death resistance of 0, 100, 254 or 255 all give the same result, and so does a Zombie target (whose resistance would be taken as 254). The only refusals are a record that is Petrified or one that already holds Death. The marker byte `Chr+0x701` is set to 3 ("Zanmato kill"; 2 is Bribe, 4 the Doom kill). That marker is read by the death check (copied to `Chr+0x700`), by the loot roll (the only value it tests there is 2) and by the KO cue chooser (presentation); it changes no rule [disasm].
3. **Extra-status step:** only for a Petrified record: the row's shatter chance of 100 means a roll below 100 out of 0 to 100 adds Eject and Death (the statue breaks); the roll is spent on every Petrified target. [harness: 99 and below shattered, 100 did not]
4. **Hit applier:** the Death bit appearing in the record sets HP to 0; the death check runs once the target's last hit is in (one hit): dead flag, the KO reset (Zombie, Poison, Petrify, the Breaks, Confuse, Berserk, Provoke, Threaten, every counter, Scan, Distill, Eject, **Auto-Life**, Doom and the rest are wiped), a monster is taken out of the battle (`Chr+0xDC8` := 0), the script scheduler is told of the death (request kind 4), the loot roll runs normally, then the Auto-Life check (the holder is revived by the queued revive command 0x311F at a quarter of maximum HP) and Auto-Phoenix. [harness; note: FFX-G02 3.1]
5. **No overkill bonus** (no HP damage was dealt, so the overkill counter is untouched) [harness: the hit record's damage fields are all 0].

**The Slice flag** [harness; disasm]:

- It is bit 1 of the monster record's flag byte +0x29 (88 monster records carry it; FFX-H02), which lands in the battle character's special word `Chr+0x5B8` as bit 9. The game's own property table calls it "disable Zanmato" (script property 0x10B); the community parser calls it "Slice".
- **Static:** a sweep of the whole code section for any access to that word finds these readers of its other bits (armored, ratio, Life, Sensor, the three damage immunities, the CTB immunity at +0x5B9 bit 0, Bribe 0x400) and **two readers of bit 9, both inside the script property getter**: its generic switch (the case for property 0x10B) and a small second copy of that getter whose only reference is the getter table. Nothing else in the code reads it; the writers are the generic property setter. **No script reads or writes property 0x10B**: all 1,224 battle scripts (361 monster files, 863 formation files, including both battle-system scripts) were disassembled and searched [disasm].
- **Dynamic:** a read trace on `Chr+0x5B8` and `+0x5B9` during a whole Zanmato (target pick, calculator, applier) records **no read at all**; the same trace on a plain physical command records its immunity tests, so the trace works. The Death resistance byte is read once per target, in the status roll. [harness]
- **Differential:** for every one of the 2,048 combinations of the 11 special-word bits and both Death resistances 0 and 255 (4,096 vectors), the vector was run again with only bit 9 flipped: **the target's HP, dead flag, permanent and extra status words, the random draws, the helper calls recorded during the apply, and the whole hit record were identical in all 4,096 pairs.** [harness]
- Conclusion: in this build **Slice immunity has no effect on the player's Zanmato**. Nothing the Dark Aeons, the possessed aeons, the Pagodas, Braska's Final Aeon or Yu Yevon carry in that bit changes what a landed Zanmato does.
- **Same for Death immunity:** Death resistance 255 on all four Dark Aeon rows and on every possessed aeon does not stop it (chance 255 beats it).

**The full cross, against an independent model** [harness]: the model is the rule above, written from the status and death-check notes (Death lands on a target that is not Petrified; HP 0, dead, permanent word reduced to the Death bit, extra word cleared, marker 3, monster out of the battle; one Auto-Life revive per holder that died). Vector sets, all with 0 mismatches:

| Set | Vectors | What varies | Result |
|---|---|---|---|
| Full cross, 1 / 2 / 3 / 8 targets | 4 x 4,096 = **16,384** (57,344 target outcomes) | target 1: all 2,048 combinations of the 11 special-word bits x Death resistance {0, 255}; the other targets: seeded random words and resistances {0, 100, 254, 255} | all 57,344 targets dead, 0 mismatches |
| Mixed states, 1 / 2 / 3 / 4 / 8 targets | 1,800 (5,600 targets) | living, Zombie, Auto-Life, Zombie + Auto-Life, Doom, Scan; HP 1 to 1,000,000; random immunity words | all dead; one Auto-Life revive per holder; 0 mismatches |
| Pick, calculator, applier | 1,500 | 0 to 8 monsters, groups 1 to 3, distance 0 to 3, Targetable and dead flags, Death resistance, special word | mask = legal members of the model-chosen group; exactly 1 stream-5 draw when a legal monster exists, none otherwise; members dead, others unchanged; 2,443 Slice-immune targets seen, 2,443 killed |
| Bit 9 flipped | 4,096 pairs | see above | 0 differences |
| No damage in the row | 300 | random words and resistances | HP, MP, CTB and unvaried damage all 0 |
| Petrified statue | 4 | the shatter roll 0, 50, 99, 100 | dead for 0, 50, 99; alive for 100 |
| Possessed row 0x60E2 | 63 | section 5 | 9,999 each; 0 mismatches |

## 4. Q1(c): HP to 1, fixed damage, and other target classes

- **HP to 1:** nothing in the player's row, the status step, the applier or the death check sets HP to 1 for a Death-immune or Slice-immune target. [harness; disasm]
- **Fixed damage:** the player's row does none (class 0). Fixed damage exists only in the **monster** rows: 0x60E2 and 0x4085 (formula 6, 9,999) and 0x410A (Strength formula, capped at 99,999). [data; harness]
- **Survive-at-1-HP reactions** are scripts of a few ordinary monsters (Zu, m045, and Stratoavis, m300): below a third of their HP they set their HP to 1 and fly ("Landing"). Their on-hit scripts, and those of the two Magic Urns (m202, m255), test the used command and **return without reacting when it is 0x30E2**: Zanmato kills them anyway. [disasm of the monster scripts; none of them is a chapter foe]
- **Scripts that do react to the player's Zanmato** among the chapter foes: only the two **Yu Pagodas**, whose on-hit script treats a Zanmato as exactly their current pool, so a landed Zanmato "destroys" a Pagoda (HP 0; hidden and untargetable for 1 to 3 of its own turns; it returns with the absorbed pool) [note: re-ffx-ai-yunalesca-bfa.md 4.3]. **Braska's Final Aeon**'s first form: HP 0 resets him to his second form's pool, whatever killed the first form [note: last-summoning 8.3]. The Dark Aeons (m340 to m343), the possessed aeons (m163 to m169, m178 to m180) and Yu Yevon (m176) have **no** reaction to the used command: Death simply lands. [disasm: none of those scripts tests the used command]

## 5. Q1(d): the possessed Yojimbo's Zanmato is a different row

- **Which row:** 0x60E2 of the monster-magic-2 table (section 1). The possessed Yojimbo gets it added to his command list at battle start and performs it on the whole front line when his gauge is full [note: last-summoning 6; disasm]. It is not the player's 0x30E2.
- **What it does** [harness]: HP damage by the **fixed** formula: power 200 x 50 = 10,000, cut to **9,999** per target. Over 63 variants (target HP 1, 5,000, 9,998, 9,999, 10,000, 20,000, 50,000; plain, Protect, Shell, Defend, Sentinel, Protect + Shell + Defend, Auto-Life, party stats 1 and 255), the hit was 9,999 every time: **Protect, Shell, Defend, Sentinel and the target's stats do not change it** (damage kind "neither"). A target at 9,999 or less dies (an Auto-Life holder is revived by the queued revive); more than that, it loses exactly 9,999. Three front-liners at 20,000, 9,999 and 9,000 (the last with Auto-Life): 10,001 left, dead, dead plus one queued revive; **one HP-variance draw per target on the monster user's own stream** (stream 28 for actor slot 20), no status draw, nothing else. No Death, no status.
- **Why it is a separate row:** the file shows the choice, not the reason. The player-side command is a Death status (damage class 0) from the command table; the possessed copy carries a damage row from the monster-magic table, so the party can survive it if it has more than 9,999 HP, and the chain's permanent Auto-Life still works against it. That the designers wanted a survivable hit is [inferred]; that the two rows are different, with different tables, classes, formulas and statuses, is [data].
- **Related, confirmed by running:** the Dark Yojimbo's own Zanmato is a third row (0x410A), not 0x30E2. At the Dark Yojimbo's Strength 244 against a Defense 60, it dealt **99,999 to the front-liner tested and stripped Auto-Life before the death check**: the hit record's extra word came out 0 and **no Auto-Life revive was queued** (harness, three variants: Auto-Life holder at 99,999 HP, no Auto-Life, Auto-Life holder at 3,000 HP; all dead). Chapter permanent Auto-Life therefore does not save anyone from the Dark Yojimbo's Zanmato. [harness; data: cleansing flag with the Auto-Life mask]

## 6. What the two chapters need from the engine (in words)

The engine on the branch already has, per `adapt/yojimbo.ts`, the pick (the game's auto-target mask, with the target ids), the command roll and the second pass; its status step already follows the game's rule for a chance of 255 and binds the player's record (`chances: [[0, 255]]`, `shatter: 100`, class 0, flag word 0x44010006) to the ability `zanmato`. What is missing is on the ability rows and the executor's target handling:

**Chapter 27 (Dark Mirror), the player's Yojimbo:**
1. **Target rule of the row `zanmato` (aeon abilities):** its `targeting` is `single-enemy`, so the executor keeps one target of the list the pick stored. It must be the group type: **the action keeps the whole list the pick returned (every legal enemy of the chosen group), in ascending slot order**, one hit each.
2. **Status:** keep Death at chance 255 as the only status (from the record). The status step must keep the game's order: one draw per target before the chance is read, **chance 255 lands regardless of the Death resistance byte, Zombie, the special word and the extra immunity word**. The ability's `extra.deathChance` / `ignoresAllResistance` keys stay unread (the comment already says so).
3. **Immunity checks:** none. In particular **do not make a Slice-immune or Death-immune target immune to this row**; the data's "immune to Slice" can stay as a label with no rule behind it. The only refusal is a Petrified record (then the row's shatter chance 100 applies) and a target that is already dead (never in the set).
4. **Outcome of the hit:** the target dies like any KO (HP 0, KO reset, a monster leaves the battle, Auto-Life holders revive at a quarter of maximum HP via the queued revive). No damage numbers, no overkill, no HP-to-1.
5. **The Dark Yojimbo's own Zanmato (row 0x410A, the dark-aeons note):** a Strength-formula damage row, power 250, cap 99,999, that **cleanses Auto-Life** (so no revive); the Dark Yojimbo's script aims it at the whole front line.
6. **What the bench must know:** against the four Dark Aeons (Death resistance 255, Slice, Zanmato byte 4, HP 1.6 to 3 million) a landed Zanmato **ends the fight at once** under the game's own rules. How often Yojimbo picks it is the Pay roll with the monster penalty of byte 4 (the Last Summoning note, branch re-ffx-last-summoning, section 8: not possible below a motivation of 85 without a full gauge; 12.5 percent per Pay at the extreme and about 44 percent with a full gauge; never from a free attack). Whether the chapter keeps that (1:1) or deliberately removes it is Bailey's call; if removed, it is a labelled departure, not a game rule.

**Chapter 28 (The Last Summoning):**
7. **The possessed Yojimbo's row `possessed-yojimbo-zanmato`** (the engine's record id 0x60E2 with `damageClass: 1`, but the ability carries Death at 255 and "ignores resistance"): change the ability to the HP row of section 5: **fixed formula (6), power 200, 9,999 cap, no status, no Death, no accuracy roll, the whole front line**, one HP-variance draw per target on the monster's stream, unaffected by Protect, Shell, Defend or Sentinel.
8. **The player's Yojimbo against the possessed aeons and the Pagodas:** a landed 0x30E2 kills a possessed aeon (no reaction in its script); each Pagoda is "destroyed" by its own on-hit script (pool reset, hidden 1 to 3 turns); Braska's Final Aeon's first form resets to the second.

## 7. What stays unproved

1. **Presentation scripts.** The motion and effect scripts that animate Zanmato (and the death cue chooser) were not traced; one of them might read the Slice bit to decide the slice effect on a target. They apply no rule: the kill is the Death status, run in full above.
2. **The queue and the executor wrapper.** The run covers the target pick, the calculator (builder, per-target pipeline, per-hit pipeline) and the hit applier per target slot; the applier's driver loop (one call per slot) and the executor's range check were modelled as plain steps (the legal set already applies the reach and dead tests), not run as one block. The command roll and the script that queues the command are FFX-G08's.
3. **Other builds.** Everything is the Steam HD build 25501027. The PS2 and older builds may honour the Slice flag; this build does not.
4. **Monsters not run:** the Yu Pagodas' and Braska's Final Aeon's on-hit scripts were read (and described in the cited notes), not run against a landed Zanmato here.
5. **Unmapped:** the flag word's bit 30 and bit 26 on the Zanmato rows (no reader in the battle logic; bit 26 is tested once in the action set-up, effect not traced).
6. **The "why"** of the separate possessed row (section 5) is inferred.

## Part 2: the Magus Sisters' orders

*To follow in the next commit of this branch.*
