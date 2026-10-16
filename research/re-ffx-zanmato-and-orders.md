# FFX: what a landed Zanmato does, and the Magus Sisters' orders (from the game's own code, scripts and files)

**Game case: FFX only.** The player's Yojimbo, his Zanmato, the possessed Yojimbo and the Magus Sisters' order commands exist only in FFX; FFX-2 has none of these rows and nothing here applies to it. Part of the `re-parity` track, written 2026-10-15 for the release driver who builds the hidden chapters "Dark Mirror" (27: the player's Yojimbo and Magus Sisters against their Dark twins) and "The Last Summoning" (28: the last two aeons against Yu Yevon's chain, then possessed). Research only: no engine, data, AI or test file was changed.

**Part 1 (Zanmato, sections 0 to 7) and Part 2 (the Magus Sisters' orders, sections 8 to 17) are both in this note.**

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
1. **Target rule of the row `zanmato` (aeon abilities):** its `targeting` is `single-enemy`, and the engine's aim step (`aimOf` in `targeting.ts`) cuts a single-target row's named list to its first entry, which is why only the first picked target dies [inferred from reading the engine; not run]. The engine already has the flag for "the script names exactly who is hit": give the row `extra.groupTarget: true` (the possessed aeons' group specials and Yu Yevon's Gravija carry it), so that **the action keeps the whole list the pick returned (every legal enemy of the chosen group), in ascending slot order**, one hit each. Reach, Targetable and the dead test were already applied by the pick.
2. **Status:** keep Death at chance 255 as the only status (from the record). The status step must keep the game's order: one draw per target before the chance is read, **chance 255 lands regardless of the Death resistance byte, Zombie, the special word and the extra immunity word**. The ability's `extra.deathChance` / `ignoresAllResistance` keys stay unread (the comment already says so).
3. **Immunity checks:** none. In particular **do not make a Slice-immune or Death-immune target immune to this row**; the data's "immune to Slice" can stay as a label with no rule behind it. The only refusal is a Petrified record (then the row's shatter chance 100 applies) and a target that is already dead (never in the set).
4. **Outcome of the hit:** the target dies like any KO (HP 0, KO reset, a monster leaves the battle, Auto-Life holders revive at a quarter of maximum HP via the queued revive). No damage numbers, no overkill, no HP-to-1.
5. **The Dark Yojimbo's own Zanmato (row 0x410A, the dark-aeons note):** a Strength-formula damage row, power 250, cap 99,999, that **cleanses Auto-Life** (so no revive); the Dark Yojimbo's script aims it at the whole front line.
6. **What the bench must know:** against the four Dark Aeons (Death resistance 255, Slice, Zanmato byte 4, HP 1.6 to 3 million) a landed Zanmato **ends the fight at once** under the game's own rules. How often Yojimbo picks it is the Pay roll with the monster penalty of byte 4 (the Last Summoning note, branch re-ffx-last-summoning, section 8: not possible below a motivation of 85 without a full gauge; 12.5 percent per Pay at the extreme and about 44 percent with a full gauge; never from a free attack). Whether the chapter keeps that (1:1) or deliberately removes it is Bailey's call; if removed, it is a labelled departure, not a game rule.

**Chapter 28 (The Last Summoning):**
7. **The possessed Yojimbo's row `possessed-yojimbo-zanmato`** (`braskas-final-aeon-abilities.ts`; its command record is already the game's 0x60E2 with `damageClass: 1`, but the ability still carries formula `none`, power 0, targeting `all-enemies` and a `ko` status at chance 255): change the ability to the HP row of section 5: `formula` `fixed-no-variance` (the game's formula 6), `power` 200, `damageType` `other` (damage kind "neither"), **no `statusEffects` entry**, `canMiss` false, `targeting` `all-enemies` kept together with `extra.groupTarget: true` for the front line the script names. The 9,999 cap comes from the damage chain (the row has no Break Damage Limit flag). **One HP-variance draw per target** is spent on the monster user's own stream although the formula ignores its value [harness: three draws for three front-liners]. The result is 9,999 on each front-line actor, unchanged by Protect, Shell, Defend or Sentinel [harness]; a target at 9,999 or less is KO'd by the ordinary death check, and an Auto-Life holder is revived.
8. **The player's Yojimbo against the possessed aeons and the Pagodas:** a landed 0x30E2 kills a possessed aeon (no reaction in its script); each Pagoda is "destroyed" by its own on-hit script (pool reset, hidden 1 to 3 turns); Braska's Final Aeon's first form resets to the second.

## 7. What stays unproved

1. **Presentation scripts.** The motion and effect scripts that animate Zanmato (and the death cue chooser) were not traced; one of them might read the Slice bit to decide the slice effect on a target. They apply no rule: the kill is the Death status, run in full above.
2. **The queue and the executor wrapper.** The run covers the target pick, the calculator (builder, per-target pipeline, per-hit pipeline) and the hit applier per target slot; the applier's driver loop (one call per slot) and the executor's range check were modelled as plain steps (the legal set already applies the reach and dead tests), not run as one block. The command roll and the script that queues the command are FFX-G08's.
3. **Other builds.** Everything is the Steam HD build 25501027. The PS2 and older builds may honour the Slice flag; this build does not.
4. **Monsters not run:** the Yu Pagodas' and Braska's Final Aeon's on-hit scripts were read (and described in the cited notes), not run against a landed Zanmato here.
5. **Unmapped:** the flag word's bit 30 and bit 26 on the Zanmato rows (no reader in the battle logic; bit 26 is tested once in the action set-up, effect not traced).
6. **The "why"** of the separate possessed row (section 5) is inferred.

## Part 2: the Magus Sisters' orders

Game case: **FFX only** (FFX-2 has no Magus Sisters). Read from the battle-system script's three sister workers (worker 60 Cindy, 61 Sandy, 62 Mindy of the system script, whose eight to nine functions are the menu builder and the order handlers), from the natives they call, and from the executable's code behind those natives. Gains, the standing order's roll and the menu are the earlier lane's proven rules [note: FFX-G08 6.2 to 6.4, emulated and run on the game's script VM]; this part adds what that note left as "read only": the **target search** (the usable test, the filters, the pick), every **order handler** and **Mindy's Reflect combo**. Tags used here besides the ones above: **[VM]** the game's own script virtual machine running the sisters' worker bytecode, with the natives answered by a Python world (as FFX-G08 did); the search and the handlers are proven in section 15 (24,000 vectors and 24,000 runs, 0 mismatches each).

## 8. The answers in one screen (Part 2)

1. **The eight orders** (the game's own names, command ids `0x3124` to `0x312B`): `0x3124` **Do as you will.** (free choice), `0x3125` **One more time.** (repeat), `0x3126` **Fight!**, `0x3127` **Go, go!** (Cindy only), `0x3128` **Help each other!** (Cindy only), `0x3129` **Combine powers!** (all three; built), `0x312A` **Defense!** (Sandy only), `0x312B` **Are you all right?** (Mindy only); Dismiss is `0x3056`. There is no order called Reflect: casting Reflect is the first step of Sandy's free choice. The seven orders still to build are all but Combine powers. Each command is mapped by the requester to a script event of the choosing sister's own worker (events 13 to 20) [disasm; note: FFX-G08 6.1].
2. **What an order is.** One handler function of that sister. It clears the **standing order** (every handler but "One more time"), stores a **class** number, and walks a **fixed list of candidate commands**. A candidate is one *search*: (a) she can use the command (a target set exists and she can pay the MP; Delta Attack also needs a full gauge), (b) the **chance roll** against a threshold that is an expression of her **motivation M** (one stream-18 draw, `(draw & 0xFF) < threshold`; a negative threshold is "always" with no draw), (c) a target passes the **property filter** (one stream-4 draw only when more than one passes). The **first** candidate that passes is queued and its gain pair (gauge, motivation) is written; when none passes she loses motivation (5; Combine powers 10; Mindy's "Are you all right?" 1) and performs the rest command `0x312C` on herself. [disasm; harness; VM]
3. **The target filters are tiny**: "all monsters" or "my side" or "my side except me" or "Cindy alone" as the candidate set, and one of nine tests (always, dead, has Auto-Life, has Reflect, HP full, has all four Nuls, has Shell or Reflect, has Protect or Reflect, has Haste or Reflect), each optionally negated (section 10). The group-type spells (Pray, Ultima, NulAll) are aimed at the whole stored group, the rest at the picked slot.
4. **The standing order is one global shared by the three sisters.** "One more time" (after a successful roll of `(M + 150)/256` for Cindy, `(M + 120)/256` for Sandy and Mindy) sets it to the sister's **last performed command** and re-enters the chain of her **last class**; from then on every roll of that chain passes **only for that command** (no draw), except a threshold below 0, which still passes. A failed repeat roll clears it and runs the class-1 chain (her special, then Attack). Every other handler clears it first, so it stands from the repeat handler to the next handler of any sister. (sections 11 and 12)
5. **Mindy's free choice has a second mode**: when **Cindy is alive and has Reflect and no order stands**, she casts **one or two spells at Cindy** (so they bounce onto the enemies), stores them, and "One more time" replays the stored list. (section 14)
6. **What the engine needs:** a search function with the three tests and the two draws in this order, the nine filter tests, the candidate chains of sections 11 and 14, the per-sister private state (last command, class, Mindy's stored list), and the 4-argument gain pair of the repeat. The earlier lane's menu, requester, standing-order roll and gain kernels are the right base. (section 16)

## 9. The search, step by step (native `btlGetCommandTargetSearch`, 0x7A37E0, with 0x7A8B40, 0x7A8AD0, 0x7A8F60, 0x7ACD40) [disasm; harness, section 15.1]

Inputs: the acting sister, a command, a **targeting code T**, a property P, a flag F (0 or 128 in every call the Sisters make), a chance C. It returns the picked slot, or 255 for "none".

1. **Candidate set and "can she use it".** The set for T: **0** = the monster side (selector "all monsters"), **1** = her own side (the party-side slots that are in the battle and not removed: while the Sisters are out, the three sisters, a fallen one included), **0x101** = her own side without herself, **0x200 + k** = slot k alone (527 = 0x20F = Cindy). The legal-set rules then cut it as for any command: Targetable, target class, **reach** (a target whose battle distance exceeds the command's reach is cut: Attack, Camisade, Razzia and Passado have reach 0, spells and Pray reach 3, Delta Attack reach 1), and the **dead** flag (cut unless the command has the dead-target bit: Life and Full-Life have it) [note: FFX-G04 4.4]. The set is stored as her saved target mask. Then "can she use it": an Overdrive-cost command (Delta Attack, 20) needs her gauge at its maximum and no Curse; a silenceable command fails while she is Silenced; and her **MP** must cover the command's MP cost (aeons pay MP; the specials cost 0). If the set is empty or she cannot use it, the search ends with 255 and **no draw**.
2. **The chance roll.** C below 0: passes, no draw. Otherwise, if the command is not 0 and a standing order stands: passes exactly when the command is the standing one, **no draw**. Otherwise **one draw on stream 18**: passes when `(draw & 0xFF)` is below C (a C of 256 or more always passes, but the draw is still spent). A failed roll ends the search with 255.
3. **The pick.** For each slot of the saved mask in ascending order the property P is read on that slot alone; with F = 128 the test is negated. If no slot passes: 255. If one passes: that one, **no draw**. If several pass: **one draw on stream 4**, the pick is the one of rank (value mod n) in ascending slot order. (F values 1 and 2, "highest" and "lowest" of the property, are in the code and unused by the Sisters.)
4. **The stored target mask** follows the command's own type: single = the mask of all candidates that passed the filter; group = those plus every member of the candidate set in the group of the lowest passing slot (monsters and sisters are all group 0 here, so in practice the whole set); all = the whole set; self = her. It is stored as her saved target mask. The handler then queues a single-target command against the **picked slot** the search returned, and the group-type spells (Pray, Ultima, NulAll) against the **stored mask** (it passes "the matching group"); the rest command goes to "self".

Draw order in one search: roll (stream 18), then pick (stream 4). A search that fails in step 1 or 2 draws nothing further. Searches are tried in the order of the tables below, so the number of draws of an order depends on which candidates were usable.

## 10. The nine property tests [disasm of the property getter; harness, section 15.1]

| P | Test (true when) | Used for |
|---|---|---|
| 92 | always (it counts the slot) | every attack and offensive spell on monsters |
| 242 | the slot's dead flag is set | Life and Full-Life on a fallen sister |
| 152 | extra-status bit 9 (Auto-Life) is set; negated: "has none" | Auto-Life |
| 50 | the Reflect counter is non-zero; negated: "has none" | Sandy's Reflect on Cindy |
| 283 | HP is at or above maximum HP; negated: "hurt" | the Cure family (own side except herself) |
| 285 | the four Nul counters (Tide, Blaze, Shock, Frost) are all non-zero; negated: "lacks at least one" | NulAll |
| 286 | the Shell counter or the Reflect counter is non-zero; negated | Shell |
| 287 | the Protect counter or the Reflect counter is non-zero; negated | Protect |
| 288 | the Haste counter or the Reflect counter is non-zero; negated | Haste |

(The menu builders also read 281, "near death": HP below half of maximum HP, summed over the front line, and 282, the count of sisters ready for Combine powers.) A sister with Reflect is never given Shell, Protect or Haste; a sister without Reflect keeps being offered them until she has the status.

## 11. The seven orders, sister by sister [disasm; VM, section 15.2]

Notation: **M** = the sister's motivation (0 to 100); `x div y` is integer division; "monsters" = T 0, "side" = T 1, "others" = T 0x101; **(g, m)** = the gain pair the candidate writes (gauge, motivation); "rest" = the rest command `0x312C` ("Taking a break...", no effect) on herself after a loss of 5 (or as stated). Command ids and MP costs are the game's: Attack 0x3000 (reach 0), Camisade 0x30E5, Razzia 0x30E7, Passado 0x30E9 (reach 0, 0 MP), Pray 0x3019, Lancet 0x3020, Cure 0x302B (4 MP), Cura 0x302C (10), Curaga 0x302D (20), Life 0x3034 (18), Full-Life 0x3035 (60), Haste 0x3036 (8), Shell 0x303A (10), Protect 0x303B (12), Reflect 0x303C (14), Auto-Life 0x3040 (97), Fira/Blizzara/Thundara/Watera 0x3045 to 0x3048 (8), Firaga/Blizzaga/Thundaga/Waterga 0x3049 to 0x304C (16), Bio 0x304D (10), Death 0x304F (20), Drain 0x3050 (12), Osmose 0x3051 (0), Flare 0x3052 (54), Ultima 0x3053 (90), NulAll 0x312D (4), Delta Attack 0x30EA (needs a full gauge).

### 11.1 Cindy (worker 60)

| Order (event) | Class | Candidates in order: command / targets / filter / chance, then (g, m) | Fallback |
|---|---:|---|---|
| **Do as you will** 0x3124 (13) | 0 | 1. Auto-Life / side / not 152 / M + 50 (3, 10). 2. Full-Life / side / 242 / (50 + M) div 2 (2, 6). 3. Life / side / 242 / (200 + M) div 2 (1, 5). 4. Attack / monsters / 92 / M (1, 2). 5. Flare / monsters / 92 / M div 8 (2, 6). 6. **Only if** a plain roll `(draw & 0xFF) < 128` (stream 18, drawn always) passes **or an order stands**: the spells Firaga, Thundaga, Blizzaga, Waterga in that order, each as a search on monsters / 92 / M div 2 (1, 2). | (0, -5) and rest |
| **One more time** 0x3125 (14) | last class | roll `(M + 150)/256` plain: pass = write the pair (2, 4 / 0, -6), standing := her last command, re-enter her last class below (class 0 or none = the free choice above); fail = standing := 0, class := 1. | class 1 chain on failure |
| (class 1, the failed repeat) | 1 | Camisade / monsters / 92 / M (1, 2); Attack / monsters / 92 / -1 (1, 2). | (0, -5) and rest |
| **Fight!** 0x3126 (15) | 2 | Camisade / monsters / 92 / 20 + M (2, 4); Attack / monsters / 92 / 150 + M (1, 3). | (0, -5) and rest |
| **Go, go!** 0x3127 (16) | 3 | 1. **If HP is below max HP, or an order stands**: Pray / side / 92 / `(maxHP - HP) * 256 div maxHP`, aimed at the stored group (1, 1). 2. **If MP is below max MP, or an order stands**: Osmose / monsters / 92 / `(maxMP - MP) * 256 div maxMP` (1, 1). 3. Attack / monsters / 92 / 2M (1, 2). 4. **Only if** a plain roll `(draw & 0xFF) < M div 2` passes **or an order stands**: Ultima / monsters / 92 / M - 80, aimed at the stored group (5, 10); Flare / monsters / 92 / M div 8 (2, 6); Drain / monsters / 92 / M div 2 (2, 6); the spells Blizzaga, Waterga, Thundaga, Firaga in that order, each / monsters / 92 / M (1, 2); Attack / monsters / 92 / -1 (1, 2). 5. Camisade / monsters / 92 / M (3, 5). | (0, -5) and rest |
| **Help each other!** 0x3128 (17) | 4 | Full-Life / side / 242 / M (1, 2); Life / side / 242 / 150 + M (1, 1); Auto-Life / side / not 152 / 50 + M (3, 10); then Cure, Cura, Curaga in that order, each / **others** / not 283 (hurt) / M div 2 (1, 2); then Camisade / monsters / 92 / M (3, 5). | (0, -5) and rest |
| **Combine powers** 0x3129 (18) | none | standing := 0; Delta Attack / monsters / 92 / 200 + M: pass = remember the target mask for the joint action, (0, +10); fail = (0, -10) and rest. | (0, -10) and rest |

### 11.2 Sandy (worker 61)

| Order (event) | Class | Candidates | Fallback |
|---|---:|---|---|
| **Do as you will** 0x3124 (13) | 0 | 1. **Reflect on Cindy**: Reflect / Cindy alone (527) / not 50 / M + 200 (2, 2). 2. Razzia / monsters / 92 / 128 (1, 2). 3. Attack / monsters / 92 / -1 (1, 2). | (0, -5) and rest |
| **One more time** 0x3125 (14) | last class | roll `(M + 120)/256`: pass = pair (2, 4 / 0, -6), standing := her last command, re-enter her last class (class 0 = the free choice); fail = standing := 0, class := 1, steps 2 and 3 of the free choice. | steps 2, 3 |
| **Fight!** 0x3126 (15) | 2 | Razzia / monsters / 92 / M + 50 (2, 4); Attack / monsters / 92 / M + 180 (1, 3). | (0, -5) and rest |
| **Defense!** 0x312A (19) | 5 | 1. Shell / side / not 286 / M + 50 (1, 2). 2. Protect / side / not 287 / M + 50 (1, 2). 3. Haste / side / not 288 / M (1, 2). 4. NulAll / side / not 285 / M + 50, aimed at the stored group (1, 2). 5. Cure / others / not 283 / M div 4 (1, 2). 6. Cura / others / not 283 / M div 6 (1, 2). 7. Curaga / others / not 283 / M div 8 (1, 2). 8. Razzia / monsters / 92 / M (2, 2). 9. Attack / monsters / 92 / M (1, 2). | (0, -5) and rest |
| **Combine powers** 0x3129 (18) | none | as Cindy's. | (0, -10) and rest |

### 11.3 Mindy (worker 62)

| Order (event) | Class | Candidates | Fallback |
|---|---:|---|---|
| **Do as you will** 0x3124 (13) | 0 | The two modes of section 14: **the Reflect combo** (Cindy alive and with Reflect, no order standing, or a replay of the stored list), else Passado / monsters / 92 / M + 100 (1, 3); Attack / monsters / 92 / M + 100 (1, 3). | (0, -5) and rest |
| **One more time** 0x3125 (14) | last class | roll `(M + 120)/256`: pass = pair (2, 4 / 0, **-15**), standing := her last command, re-enter her last class (class 0 = the free choice, which **replays the stored list** if one is stored); fail = standing := 0, **stored list cleared**, class := 1 (Passado / monsters / 92 / 128 (1, 2); Attack / monsters / 92 / M + 100 (1, 3)). | class 1 on failure |
| **Fight!** 0x3126 (15) | 2 | Passado / monsters / 92 / M + 30 (2, 4); Attack / monsters / 92 / M + 180 (1, 3). | (0, -5) and rest |
| **Are you all right?** 0x312B (20) | 6 | 1. Lancet / monsters / 92 / M div 2 (2, 3). 2. Drain / monsters / 92 / `(maxHP - HP) * 256 div (2 * maxHP)` (2, 3). 3. Osmose / monsters / 92 / `(maxMP - MP) * 256 div (2 * maxMP)` (2, 3). | **(0, -1)** and rest |
| **Combine powers** 0x3129 (18) | none | as Cindy's. | (0, -10) and rest |

**Quirks the runs confirm** [VM]: (1) a threshold below 0 always passes with no draw, so **Ultima's M - 80 is negative for M below 80**: with M under 80 Ultima is chosen without a roll whenever the gate of "Go, go!" is open and she has the 90 MP; (2) in the gates written "a plain roll passes or an order stands" the plain roll is **drawn first and always** (stream 18), the standing order is read after; (3) "One more time" re-enters the stored class; a class with no case (the free choice, a class the sister never uses, and the Combine handlers, which store none) re-enters her free choice; (4) the Combine handlers set no last command and leave Mindy's stored list alone, and every other Mindy handler (Fight!, Are you all right?, the free choice) resets the stored count first; (5) Mindy's stored list holds **two** entries.

### 11.4 Which orders each sister is offered [note: FFX-G08 6.4, run on the game VM, 9,000 runs]

Cindy: Do as you will; One more time (from her second action); Fight! when a plain roll `< M + 50` passes; Go, go! when a roll `< 128` passes; Help each other! when a roll `< 200` passes; Combine powers while all three sisters are ready; Dismiss. Sandy: Do as you will; One more time; Fight! when `< M + 150`; Defense! when anyone on the front line is below half HP, **or** a roll `< 128` passes (both are evaluated, so the draw is always taken); Combine; Dismiss. Mindy: Do as you will; One more time; Fight! when `< M + 150`; Are you all right? when HP or MP is below a quarter and a roll `< 200` passes, else below half and a roll `< 128` passes; Combine; Dismiss. The menu's rolls are plain (they ignore the standing order).

## 12. The standing order and how it persists [disasm; VM; note: FFX-G08 6.2]

- **One 16-bit global (the command id) for all three sisters.** Written only by the handlers: "One more time" stores the sister's **last performed command**; every other handler (and the Combine handlers) stores 0 first; a failed repeat roll stores 0. The sister's "last command" is a private variable set whenever the handler performs a command, **the rest command included**; it is not set by the Combine handlers, and it starts at 0.
- **Effect.** The roll of every search whose threshold is 0 or above passes only for the standing command, with no draw; a threshold below 0 passes anyway; the handler's own gates (Cindy's roll of 128 and of M div 2) are *plain* rolls, drawn whatever stands, but they are followed by "or an order stands", so under a standing order those gates are open. The menu's rolls ignore it.
- **Persistence.** It stands from the repeat handler's start until the next handler of *any* sister begins (which clears it). The 2-argument gain calls are suppressed while it stands, so the pair the repeat handler wrote (section 13) is the one the finished action applies. Whether the global is cleared between battles is unchecked [note: FFX-G08 open question 6].
- **Class.** Each handler stores its class (Cindy 0 free, 1 fallback, 2 Fight, 3 Go go, 4 Help; Sandy 0, 1, 2, 5 Defense; Mindy 0, 1, 2, 6 Are you all right) *before* searching; the repeat re-enters the chain of the stored class, and any class without a case (0, and the Combine handlers, which store none) re-enters the free choice.

## 13. Motivation and gauge [note: FFX-G08 6.3, emulated 20,000 vectors]

Each candidate that passes writes a pair with the 2-argument call (gauge change, motivation change) into both the positive and the negative column, **only while no order stands**; the repeat handler writes its own 4-argument pair, always: (gauge +2, motivation +4) when the repeated action had a real effect, (0, -6) when it had none (**Mindy: -15**). The finished action applies the column chosen by whether it had a real effect, clamping the gauge to 0..max and the motivation to 0..100. Gauge gains are small (1 to 5 per action; Delta Attack costs 20), so Combine powers needs each sister at her full gauge after many actions; motivation moves by 1 to 10 per action and falls by 5 on a rest. The start value of the motivation is not in the code [unproved].

## 14. Mindy's free choice and the Reflect combo [disasm; VM, section 15.2]

"Do as you will" for Mindy starts by clearing the order, the stored list and the class. Then, **if Cindy (slot 15) is alive**:

1. **A stored list exists** (only possible when the chain was entered through "One more time", which does not clear it): for each stored command in the order stored, search it on **Cindy alone** with threshold -1 (always usable if she can pay the MP; no roll) and queue it at once; then the order is done. No gain call is made and her "last command" is unchanged.
2. **No stored list, Cindy has Reflect, and no order stands**: first one plain roll `(draw & 0xFF) < M` decides the number of spells, **2 if it passes, else 1**. For each spell, one search at a time, all **on Cindy alone**, the first that passes is queued immediately: Flare / threshold M div 2 (2, 3); else Bio then Death / each M div 2 (2, 2); else the eight spells Firaga, Thundaga, Waterga, Blizzaga, Fira, Thundara, Watera, Blizzara in that order / each M (1, 2); else Drain / M (0, 1). A spell that was found is added to the stored list (up to two) and queued; a round that finds nothing adds nothing. When at least one spell was found, the order ends here and the list stays stored.
3. Otherwise (Cindy dead or without Reflect, an order standing, or nothing found): Passado / monsters / 92 / M + 100 (1, 3); Attack / monsters / 92 / M + 100 (1, 3); else (0, -5) and rest.

Because the spells are aimed at Cindy and Cindy has Reflect, the target builder bounces each reflectable spell onto a random monster (stream 6, one draw when there are two or more legal candidates) [note: FFX-G04 4.1]: Mindy's spells hit the enemy at no cost to Cindy. The two queued spells each finish as their own action, so the one gain pair the last successful search left is applied after each of them [inferred from the after-action rule in section 13]. Sandy's free choice is what puts Reflect on Cindy (step 1, threshold M + 200).

## 15. Proof (Part 2)

**15.1 The search on the real code [harness].** The three functions the search native calls in its order (the candidate set with the usable test, the chance roll, the property-filtered pick with the stored target mask; behind them the selector, the legal-set builder, the picker, the property getter and the group expansion) were run on the real code of the executable, with only the random-number function scripted. Worlds: the three sisters (alive or fallen, random MP, Silence, Reflect, Shell, Protect, Haste, the four Nul counters, Auto-Life, Curse, gauge) and 0 to 4 monsters (battle distance 0 to 3, Targetable, dead and removed flags); the 33 command rows the orders use; the six targeting codes (0, 1, 0x101 and the three sisters alone); the nine properties with and without negation; thresholds from -1 to 300; a standing order of none, the command itself or another command. Compared with an independent model written from the disassembly: the usable mask, the roll result, the picked slot, the stored target mask, and the sequence of random streams drawn.

| | Count |
|---|---:|
| Vectors | **24,000**, **0 mismatches** |
| Reached the roll (a usable candidate set) | 11,339 (the rest had no candidate or too little MP) |
| Failed the roll | 4,592, of which 1,943 were blocked by a standing order for another command (no draw) |
| Reached the pick | 6,747: no passing target 2,994, one 2,415, several 1,338 (a stream-4 draw each) |
| Draws seen | 6,151 on stream 18, 1,338 on stream 4, in that order within a search |
| Each of the nine properties | 2,611 to 2,707 vectors |

**15.2 The handlers on the script VM [VM].** Each of the sixteen order handlers (Cindy events 13 to 18, Sandy 13, 14, 15, 18, 19, Mindy 13, 14, 15, 18, 20) was run 1,500 times on the game's own script VM against an independent model of the chains of sections 11 and 14. The natives were a Python world: the chance roll with its true rule, the search as an oracle (usable flag per command, candidate list, the same two draws; its semantics are 15.1), the gain calls, the standing-order store and load, the command buffer (a first-in first-out list of 16), the perform call (recorded), and the property reads (inputs: motivation, HP, MP, whether Cindy is alive and has Reflect). The sister's private variables (last command, class including values she never uses, repeat flag, Mindy's stored list and count) started random, and a standing order stood at the start of about a third of the runs. Compared per run: the ordered sequence of rolls (with their draws), searches (all five arguments and the result), gain calls, standing-order writes, performs and Delta Attack target calls, and the private variables afterwards.

| | Count |
|---|---:|
| Runs | **24,000**, **0 mismatches** |
| Ended by performing a command | 21,285 |
| Ended with the rest command | 9,222 |
| Began with a standing order | 8,104 |
| Mindy free choices that cast the Reflect combo | 748 |
| Repeats that replayed Mindy's stored list | 217 |

## 16. What the engine needs for the orders [words]

The branch's lane FFX-K already has the menu builder, the requester's mapping of the eight commands, the standing-order roll, the gain kernels and the Combine handler (`kernel/sisters.ts`, `adapt/sisters.ts`, `aeon-commands.ts`). The seven orders add:

1. **A search function** with the order of section 9: candidate set by the targeting code (0, 1, 0x101, 0x200 + slot) through the engine's legal-target rules (Targetable, reach by command, the dead-target bit), the usable test (MP for aeons, silence for silenceable rows, full gauge and no Curse for Delta Attack), the roll (stream 18; the three cases: a negative threshold passes, a standing order passes only its own command, otherwise a plain draw; thresholds can be negative, as Ultima's M - 80 is for M below 80), the filtered pick (stream 4 only when more than one passes), the final mask by command type (single, group, all, self), and the saved target mask.
2. **The nine filter tests** of section 10, each with its negation. Counters are the engine's Shell, Protect, Reflect, Haste and Nul statuses; "dead" is the KO flag; "Auto-Life" the extra status.
3. **The candidate chains** of sections 11 and 14 as data (about sixteen chains in all): per sister and order, an ordered list of (command, targeting, filter, threshold expression, gain pair), the gated blocks ("only if a plain roll passes or an order stands") and the fallback (the loss and the rest command `0x312C`, a no-effect action on herself).
4. **Per-sister private state across turns**: last performed command (the rest command included), the stored class, and for Mindy the stored spell list (cleared at the start of her free choice and by a failed repeat). The standing order stays the single global of the existing kernel.
5. **The repeat's 4-argument gain pair** (+2 / +4 positive, 0 / -6 negative, Mindy -15) and the suppression of the 2-argument pairs while an order stands (already in the kernel).
6. **Reflect-bounce of Mindy's spells off Cindy** needs the engine's existing Reflect rule for a reflectable spell aimed at an ally who has Reflect (random opposing target, stream 6).
7. **The spells and specials the lists use must be castable by the sisters**: Camisade, Razzia, Passado (reach 0), Attack, the Cure family, Life, Full-Life, Auto-Life, Haste, Shell, Protect, Reflect, NulAll, Pray, Lancet, Drain, Osmose, Bio, Death, Flare, Ultima, the eight elemental spells and the rest command.

## 17. What stays unproved (Part 2)

1. The **property reads and the queue**: the handler runs answer the property reads (motivation, HP, MP, Cindy's state) and the perform call from a Python world, so what the executor then does with a queued command is not part of the proof; the search itself is (15.1).
2. The **starting motivation** and gauge of a freshly summoned sister (the only writers are the after-action step and the script property setter; no initialiser was found) and whether the standing order is cleared between battles.
3. The behaviour of the **queue and the executor** for the commands the handlers queue (priorities, the order of the two spells of Mindy's combo, what the executor does with a command whose target vanished before it runs) was not run.
4. The **Dark Magus Sisters'** own AI is a different set of scripts (the dark-aeons note); nothing here applies to them.
5. The cure/support searches were read for a **sister who has just died**: the dead sisters leave the candidate set except for Life and Full-Life, which is how the code reads; the engine's KO rules for aeons decide the rest.
