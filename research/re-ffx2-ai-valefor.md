# FFX-2 boss AI read from the game's own script: Valefor at Besaid Temple (monster row 164, formation 0393)

**DRAFT for the RE session to check and commit. Not committed anywhere.** Written 2026-10-14 by a sub-agent of the RE parity session,
for the release driver's chapter `ch-besaid-valefor` (hidden FFX-2 chapter 24, "Protect Besaid Temple!").

**Game case: FFX-2 only.** FFX has its own, different Valefor (its own record, its own engine); nothing here applies to FFX. Part of the `re-parity`
track, P6 (boss AI follows the scripts). Research only: no engine, AI or data file was changed.

**Output rule kept:** plain words and numbers. No script line, no decompiled code and no game text is reproduced; move and monster names appear
only as identifiers; line numbers and byte offsets say where each fact was read.

Tags: **[script]** read from the plain-text AI source `m164.src`; **[bin]** confirmed in the compiled package `_m164/m164.bin`; **[row]** read from the
kernel tables (`monster.bin`, `monmagic.bin`); **[note]** taken from an earlier checked note of this track; **[inferred]** reasoning, not read directly.

## Main findings in one screen

1. **The script is short and has no HP phases.** Valefor's whole behaviour is one gauge that rises by 5 on her own attack-class turns and by 5 on every
   result applied to her, plus a counter of how many Energy Rays she has fired since the last Energy Blast. Nothing reads her HP, MP or statuses.
2. **The gauge is tested BEFORE the turn's own gain, and Ray turns add nothing.** With nobody hitting her: six attack-class turns, Energy Ray (turn 7),
   six more, Energy Ray (turn 14), eight more, Energy Blast (turn 23), then the cycle starts over. The chapter's code fires the Rays on turns 6 and 12 and the
   Blast on turn 21.
3. **Per attack-class turn: one `random() % 3` draw; 0 = Sonic Wings (1 in 3), 1 or 2 = Attack (2 in 3).** The value 0 for Sonic Wings is now read, not guessed.
4. **Sonic Wings goes to the girl farthest from her on the ground plane, not to "the back slot".** The Besaid scene ships its start positions: boss (0, 26),
   Yuna (0, -27), Rikku (-12, -25), Paine (12, -25). Yuna is the farthest (53.00 against 52.39). The chapter's "highest slot" picks Paine, who is never the lone farthest.
5. **Energy Ray and Energy Blast are both aimed at the whole party, with identical target and misc flags.** No arc, cone or position test is in the script or in
   either move row; the "160 degrees" is not found anywhere in the data read. Both are charged casts (charge 120, recovery 100); Ray is magical type, **Blast has no damage type at all**.
6. **Sonic Wings never rolls to hit** (accuracy formula 0) although its type is physical; it is MP damage only (class MP), formula 0, power 2, charge 100, recovery 80.
7. **Group-1 resist slots 17 and 18 are Itchy and Auto-Life, and 369 of the 370 rows of `monster.bin` carry 255 in both.** The chapter should carry them.
8. **The "battle too long" block is dead code** (same guard as the other bosses, never true in play). Nothing in the script or the scene ends the fight except her HP or a wiped party.

## 0. Source block and how this was checked

| Item | Value |
|---|---|
| Archive | `FFX2_Data.vbf`, Steam HD Remaster build 25501027 (FFX-2.exe SHA-256 6EA7F142...CD69), the owner's own install. Read with our own reader `vbf.py` (standard library, opens `rb`), run with `python -I`. |
| AI source | `ffx_ps2/ffx2/master/jppc/battle/mon/m164.src` (3,786 bytes, SHA-256 starts 81cc9df5742d6734), with `mt164.src` (2,696) beside it; the motion and frame files `mf164.txt` (1,870) and `_m164/mm164.src`, `_m164/mt164.src` hold only presentation settings (motion macros, frame counts, hover height) |
| Compiled package | `.../mon/_m164/m164.bin` (94,848 bytes, SHA-256 starts 67c445a38b0e3fff), disassembled with the Leblanc-den lane's `x2dis.mjs`; offsets below are that tool's offsets inside the script chunk |
| Kernel tables | `battle/kernel/monster.bin` (96,596 bytes, SHA-256 50964278...ec504, equal to the hash in `re-ffx2-yojimbo-valefor.md` section 1), `battle/kernel/monmagic.bin` (85,222 bytes, SHA-256 35b432bb...3279); move rows read with the lane's `ffx2-abil.mjs` / `moves.mjs`, and again byte by byte for the five moves below |
| Scene | `battle/btl/bsyt05_229/pos_bsyt05_229.psc` (409 bytes) and `bsyt05_229.bin` (2,188 bytes). The event, scene and camera `.src` files of this scene are 0 bytes in this build. |
| Headers | `battle/header/btlhead.src`, `btlmot.ath`, `monmagic.ath`; `battle/kernel/monster.h`, `command.h` (the game's own names for the special bits and the 24 status slots) |

Checks made:

- **Script against binary [bin]:** the set of command ids the source issues (ten) equals the set in the disassembly of the action, reaction and death entries; the three
  `% 3` moduli are the same; the gauge thresholds (30, 60, 100), the ray-count tests (at most 0, at most 1), the four `+5` additions, the two target-search
  calls and the time-out thresholds (180, 190, 195, 200) are the same. The scene constant the script tests equals the header's value for `bsyt05_229` (0x005900e5).
- **Row 164 re-read independently [row]:** all 200 bytes of `monster.bin` row 164 (file offset 0x8040) equal the raw bytes printed in `re-ffx2-yojimbo-valefor.md` section 5, and every decoded field equals that note and the chapter's data (section 9).
- **Move rows read byte by byte [row]** at `monmagic.bin` offset `0x20 + 136 x (id - 0x4000)`: Energy Ray 0x4d28, Sonic Wings 0x4db0, Energy Blast 0x4e38, Attack (0x41da) 0xfbf0, Die (0x40ad) 0x5c08, the five time-out rows 0x12ab0 to 0x12cd0. Column meanings are those of `re-ffx2-commands.md` section 1.
- **Engine rules** (how a monster is polled, the two random streams, the target searches, what a reaction sees, the dead time-out block, the target re-validation) are taken from the checked notes `re-ffx2-ai-bahamut-vegnagun.md` sections 1.1 to 1.6, `re-ffx2-ai-leblanc-den-ixion.md` section 1, `re-ffx2-ai-fallen-trema.md` section 1; no Ghidra call was made.

## 1. The script, entry by entry

### 1.1 Variables and start [script m164.src:16-36; bin w0.f0 0x00bd-0x00c9]

Eight variables are declared; seven survive compilation. In plain words: a target slot, a roll, the **gauge**, the **ray count**, an action counter and a warning
stage (both used only by the dead time-out block), and one unused counter. The start section sets the last three to 0; the gauge and the ray count are never set
by the script, so they start at 0 by the rule every earlier note assumes [note: fallen-trema 1.3, M; inferred for these two].
The start section also sets the motion macros, marks her as unable to be raised once defeated, flying and hovering [script 28-32; bin 0x0006-0x00b7]; these are presentation settings.

### 1.2 The action entry, in the order it tests [script 44-157; bin w0.f2 0x00d0-0x032c]

| # | Condition (tested in this order) | What she does | Gauge | Ray count | RNG | Script lines | Bin offsets |
|---|---|---|---|---|---|---|---|
| 0 | the time-out block | never runs (section 6) | | | | 46-80 | 0x00de-0x0198 |
| 1 | gauge is 100 or more | **Energy Blast** on all party members; gauge to 0, ray count to 0 | reset, no +5 | reset | none | 83-88 | 0x01a0-0x01b8 |
| 2 | gauge is 60 or more, and ray count is 0 or 1 | **Energy Ray** on all party members | no change | +1 | none | 91-97 | 0x01c2-0x01e2 |
| 3 | gauge is 60 or more, ray count is 2 or more | attack-class turn (below) | +5 | | one `random() % 3`, plus a target search | 98-112 | 0x01ec-0x0242 |
| 4 | gauge is 30 to 59, and ray count is 0 | **Energy Ray** on all party members | no change | +1 | none | 116-122 | 0x024c-0x026c |
| 5 | gauge is 30 to 59, ray count is 1 or more | attack-class turn | +5 | | as 3 | 123-137 | 0x0276-0x02cc |
| 6 | gauge is under 30 | attack-class turn | +5 | | as 3 | 139-153 | 0x02d6-0x0329 |

**Attack-class turn [script 100-111, 125-136, 141-152; bin 0x01ec-0x0242, 0x0276-0x02cc, 0x02d6-0x0329]:** the gauge gains 5 first; then one draw `random() % 3`
(the low 16 bits of one draw of the scripts' global stream, [note: bahamut 1.3]); **0 = Sonic Wings** on the girl chosen by the "farthest" search (section 4), **1 or 2 = Attack** (the plain row 0x41da, the "no cancel" form) on the girl chosen by the near-weighted search of all living, targetable girls. So 1 in 3 and 2 in 3 [script, bin]; the modulo bias of 65,536 over 3 is below 0.002 points [inferred].

Facts that follow from the table [script, bin]:

- **The gauge is read before the turn's own gain.** A turn that finds 30 or more fires the Ray and gains nothing; the turn after it gains again.
- **Ray turns and the Blast turn add nothing.** Only the three attack-class branches add 5.
- **Two rays per cycle, in two steps of the ray count:** the first is allowed at 30 or more (count 0), the second at 60 or more (count 1). If results push the gauge from under 30 straight to 60 or more, she fires the two Rays on her next two turns in a row. If the gauge reaches 100 first, the Blast comes at once and the unfired Rays are dropped (the Blast test is first).
- The Blast turn resets both the gauge and the ray count at the poll, before the Blast is cast; results that land on her while it charges already count toward the next cycle's gauge [inferred from the order of the reset and the reaction entry].

### 1.3 The reaction entry [script 159-166; bin w0.f3 0x0330-0x033d]

Run once for every result applied to her (each strike that lands, each miss, each no-effect result), after the result is applied [note: leblanc-den-ixion 1.2, fallen-trema 1.2]. If the guard `getreaction` holds (the attacker is not herself, and she is not stopped, asleep, petrified, confused, berserk or ejected) the **gauge gains 5**. It issues no command. Row 164 makes her immune to Stop, Sleep, Petrify, Confusion, Berserk and Eject, so in this fight the guard fails only for her own results.

### 1.4 Menu and targeted entries [script 168-174; bin w0.f4 0x033e, w0.f5 0x033f]

Both empty. Being targeted changes nothing; only a result applied to her changes the gauge.

### 1.5 The death entry [script 176-183; bin w0.f6 0x0343-0x034f]

If a death reaction is allowed, she queues the command row 0x40ad (the "Die" row of her list) on herself. Row 0x40ad is not an attack: no damage class, no power, target flags 0x41 (dead allowed, self), and one group-1 status chance (254) at slot 23, which no note maps [row monmagic 0x5c08]. The start section marks her as unable to be raised. Nothing here changes the battle's outcome: her defeat ends the fight [inferred].

### 1.6 What the script does not have [script, whole file]

No HP threshold, no MP test, no status test of her own, no phase, no first-turn special, no scripted dialogue or camera call, no counter-attack from the reaction, no use of the party's levels. The scene's compiled script is the empty template of the Ixion scene (2,188 bytes, 19 bytes differ from it: the name and a few indexes), so the scene adds no event either [bin; inferred].

## 2. The cycle in turns

Her turn numbers when nobody applies a result to her (gauge +5 per attack-class turn only) [script; arithmetic]:

| Turns | Action |
|---|---|
| 1 to 6 | attack-class turns, gauge 5 to 30 |
| 7 | Energy Ray (gauge 30, ray count 1) |
| 8 to 13 | attack-class turns, gauge 35 to 60 |
| 14 | Energy Ray (gauge 60, ray count 2) |
| 15 to 22 | attack-class turns, gauge 65 to 100 |
| 23 | Energy Blast, gauge and ray count back to 0 |

So a cycle is 23 turns: 20 attack-class (on average 6.7 Sonic Wings and 13.3 Attacks), 2 Rays, 1 Blast. Every result applied to her counts like one of her own attack-class turns (+5), so the party's hits bring the Rays and the Blast forward: with 1 result per turn the Rays come at turns 4 and 8 and the Blast at 12; with 2 results per turn, turns 3, 6 and the Blast at 9; with 3 results per turn, 3 and 5 and the Blast at 7 [arithmetic on the table above; results counted between her turns, none during her own cast].

Her first action is an attack-class turn (gauge 0 to 5, then the roll): there is no scripted opening move [script].

## 3. The moves (rows of `monmagic.bin`)

Column meanings: `re-ffx2-commands.md` section 1. Costs are the ATB columns: recovery after the move = `cost_atb x 10000 / (AGI + 1)` units, charge before it fires = `cost_cast x 10000 / (AGI + 1)` units, 95 units a step at normal speed, 29.97 steps a second [note: bahamut 1.1, timing-measured]. Her AGI byte is 125.

| Move (id, row offset) | Target flags | Misc flags | Damage flags | Class | Formula | Power | Hits | Accuracy | Element | Status / delay / push | Recovery cost / charge cost |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Attack 0x41da (0xfbf0) | 0x33 single | 0x60000052 | 0xd: physical, can crit, crit byte 5, Darkness applies | HP | 0 | 16 | 1 | formula 2: the attacker's own ACC (95) race | none | none; shatter 10 | 100 / 0 |
| Energy Ray 0x4091 (0x4d28) | 0x17 multi | 0x41200006 | 0x2: magical | HP | 2 (magic, MDEF term) | 20 | 1 | formula 0: never rolls | none | none | 100 / 120 |
| Sonic Wings 0x4092 (0x4db0) | 0x13 single | 0x41200006 | 0x1: physical | **MP** | 0 (physical, DEF term) | 2 | 1 | **formula 0: never rolls** | none | none | 80 / 100 |
| Energy Blast 0x4093 (0x4e38) | 0x17 multi | 0x41200006 | **0x0: neither physical nor magical** | HP | 2 (magic, MDEF term) | 25 | 1 | formula 0: never rolls | none | none | 100 / 120 |

All [row]. Reading of the columns [note]:

- **Type bits.** A physical-only row is reduced by Protect; a magical-only row by Shell; a row with neither bit is reduced by neither [note: leblanc-den-ixion 1.11]. So **Shell halves Energy Ray and not Energy Blast.** (Ixion's Aerospark and the other aeons' Overdrives are the same kind of row.)
- **Targets.** The two multi-target rows have no "can target all" bit (0x80), and a scripted command carries no all-targets byte, so no multi-target halving applies [note: bahamut 1.2]. The script aims both at the whole party; a charged command keeps a fallen girl in its mask and skips her when the hits land [note: leblanc-den-ixion 1.12, skip M].
- **No arc, no row, no push.** The target flags and the misc flags of Energy Ray and Energy Blast are identical; the script uses the same whole-party group for both. No status chance, no amount, no Delay bit (0x1000, 0x2000), no random-spread bit (0x4000), no reflect bit (0x80: Reflect does not bounce any of the three) in any of the three rows [row]. A 160 degree arc is therefore not in the script or the move rows; if the game has it, it is in effect or animation data, which was not read [not found].
- **Unmapped bytes, given raw:** row bytes +0x7b (Ray 2, Sonic Wings 1, Blast 2), +0x7e/+0x7f (0x07d0 on all three), +0x80 to +0x87 (Ray `03 03 00 00 00 01 1e 00`, Sonic Wings `09 02 09 00 00 01 3c 00`, Blast `03 03 00 00 00 01 14 00`), animation ids at +0x08 (0x96, 0x95, 0x97) and the caster animation byte at +0x0c (3 for all three) [row, unmapped]. The cancel-chance byte (+0x7a) and the species-killer mask (+0x78) are 0.
- **Sonic Wings is MP damage.** Class bit 2 is the MP pool; the damage is the physical formula (formula 0) with power 2, applied to the target's MP. It cannot crit (no crit bit).

### 3.1 Cadence (arithmetic on the costs, AGI 125, rounded up to whole steps as the earlier notes do) [inferred]

| Move | Charge | Recovery |
|---|---|---|
| Attack | none | 7,936 units = 84 steps = 2.80 s |
| Sonic Wings | 7,936 units = 84 steps = 2.80 s | 6,349 units = 67 steps = 2.24 s |
| Energy Ray / Energy Blast | 9,523 units = 101 steps = 3.37 s | 7,936 units = 84 steps = 2.80 s |

Her first gauge is 25 to 74 percent of 5,555 units (70 x 10,000 / 126), 15 to 44 steps [note: leblanc-den-ixion 1.4]. Thinking time is 0 plus 30 steps for every girl who is dead or petrified. Her special word has bit 1, so a hit reaction does not slow her gauge. Animation time is on top of these and was not read for her.

## 4. Targeting and positions

### 4.1 The scene [row/file: pos_bsyt05_229.psc, byte-identical to the Ixion scene's position file]

Start positions on the ground plane (x, z): **Valefor (0, 26); Yuna (0, -27); Rikku (-12, -25); Paine (12, -25)**. Start directions are all zero (the engine's default).
Ground distance from Valefor [arithmetic]: Yuna 53.000; Rikku 52.393; Paine 52.393.

### 4.2 Sonic Wings: the farthest girl [script 104-105 and the two repeats; bin 0x0215, 0x029f, 0x02ff]

One search over the party, keeping the living, targetable girls, then keeping those with the greatest value of the distance stat. The stat is the ground distance minus the sum of both body radii, cut to a whole number [note: leblanc-den-ixion 1.3]. Ties keep all tied girls and the pick among them is the near-weighted pick on stream 4; a single farthest girl draws nothing. The radii are not read here.

What that gives at the start formation [inferred, from the file's positions and the note's rule]:

- Yuna is 0.607 farther than Rikku and Paine, who are exactly equal. If the cut separates Yuna from the two (for most radius sums), **Yuna is the only farthest girl and takes every Sonic Wings**. If the cut merges the three values (the difference is 0.607 of a unit, so roughly 39 in 100 radius values, with equal girl radii), the three are tied and the near-weighted pick applies (4.3: Yuna 41.9, Rikku 29.1, Paine 29.0 percent).
- **Paine is never the lone farthest.**
- With Yuna down, Rikku and Paine are exactly tied: a near-weighted pick between two symmetric girls (50.1 / 49.9 percent with the note's scan rule).
- Girls move when they run in for a melee attack and return; the file gives only the start formation, which is the model [inferred].

### 4.3 The Attack: near-weighted, not uniform [script 109-110, 134-135, 150-151; bin 0x0236, 0x02c0, 0x0320]

The search macro used is the near-weighted one (`searchr`, mode 1) over all living, targetable girls, stream 4, no draw with one candidate [bin: arguments (party group, stat 55, word 0, mode 1)]. A candidate's weight is `1 + floor(32768 / floor(cost + 1))`, `cost = (1 + d) x (1 + 2a)` [note: bahamut 1.4]. With the file's positions and the boss facing the middle of the party (the earlier notes' worked example) [inferred]:

| Alive | Yuna | Rikku | Paine |
|---|---|---|---|
| all three | 41.9 % | 29.1 % | 29.0 % |
| Yuna down | | 50.1 % | 49.9 % |
| Rikku down | 59.1 % | | 41.0 % |
| Paine down | 59.1 % | 41.0 % | |

(weights 596, 415, 415; exact scan with `r <= running sum`, so the first slot owns one extra value.)

### 4.4 Energy Ray and Energy Blast: the whole party [script 87, 96, 121; bin 0x01b5, 0x01df, 0x0269]

Both are queued on the whole party group. That group includes fallen girls (a mask of every party-side character) [note: bahamut 1.2]; a charged command is not repaired when only some targets are gone, and the hit skips a fallen girl [note: leblanc-den-ixion 1.12]. So the effective set is every girl alive when the hits land.

## 5. Random streams [note: bahamut 1.3, hit-status 1.1]

- **`random() % 3`:** global stream 2, low 16 bits of one draw, one per attack-class turn, none on Ray or Blast turns [script, bin].
- **Target searches:** global stream 4: the Attack's near-weighted pick (a draw only with two or more candidates), Sonic Wings' pick (a draw only on a tie) [script, bin].
- **Hit rolls and damage:** the per-character streams, as for every command. Only the Attack rolls to hit (ACC 95, formula 2) and can crit [row].

## 6. The time-out block is dead code [script 46-80; bin 0x00de-0x0198; note: bahamut 1.6, leblanc-den-ixion 1.8]

The block counts her actions and, past 180, 190, 195 and 200, would queue four message-only warning rows (0x4232 to 0x4235: no damage, recovery cost 50) and then a 12-hit random-target fixed-damage Meteor on the party (row 0x4236: formula 5, power 200, hits 12, random spread; damage 9,999 per hit [note: bahamut 1.6]) when the scene is `bsyt05_229`. It sits behind the guard "the count of living, un-petrified party members is 0" - the same guard, with the same two constants, as in the Ixion and Leblanc scripts, where it was run on the live exe: the count is 0 only when no girl can act, and the ATB clock does not step then. The counter's own increment is inside the guard. **It never runs.** Nothing to implement.

## 7. The record, row 164 (cross-check) [row, equal to `re-ffx2-yojimbo-valefor.md`]

Level 22; HP 8,430; MP 9,999; STR 97, DEF 76, MAG 11, MDEF 20, AGI 125, ACC 95, EVA 25, LCK 3; thinking byte 0; special word 0x3c3; element bytes absorb 0, null 0x10 (Gravity), half 0, weak 0; group-1 resist 255 at slots 0 to 8, 10, 17 and 18; group-2 resist 255 at 6 (Stop) and 14 (Doom); automatic statuses none; moves 0x41da, 0x4091, 0x4092, 0x4093, 0x40ad; EXP 1,500; Gil 1,200; Pilfer Gil 1,500; AP 15; drop byte 255, Moon Bracer x1 (0x905c) common and rare; steal byte 128, Healing Spring x4 common and x6 rare (0x2034); no Bribe slot; Zantetsu byte 80.
Every value equals the chapter's data (`valefor.ts`, `records-valefor.ts`) except what section 8 lists.

### 7.1 Group-1 slots 17 and 18: Itchy and Auto-Life [row, note]

- **The game's own header names the 24-slot status table** (`command.h`, the per-status chance accessors, the same index space as the resist bytes): slot 16 "EXP 0" (the engine's Pointless), slot 17 "change clothes" (Itchy: the girl must change dressphere), slot 18 "relife" (Auto-Life).
- **Rows agree.** Slot 17 is carried by Pain (chance 120) and by the "Attack (itchy)" row 0x41e2 (254), and cleansed together with slot 16 by Esuna, Remedy and the other cure rows. Slot 18 is inflicted by the two Auto-Life rows (0x3173, 0x31c8: 254) and cleansed by Dispel (0x30b8) and Dispel Tonic.
- **The exe agrees on 18:** the KO routine's Auto-Life test reads status bit 0x40000 (bit 18) [note: atb-status section 6, `status-timers-set.ts` `pp_has_auto_life`, VA 0x0061a800]. For 17 the kernel treats it as the status that Confusion, Berserk and Curse clear and that clears them [note: hit-status 4.2], which is how Itchy behaves in play (cleared by Confusion).
- **The engine's slot table is right** (`adapt/slots.ts`: 16 pointless, 17 itchy, 18 auto-life). Its header comment calls 16 "EXP 0" and 17 "Change Clothes": the same statuses under the game's labels.
- **255 in both slots is the table's default for monsters.** In `monster.bin` 369 of 370 rows have slot 16 = 0, slot 17 = 255, slot 18 = 255; the one exception is row 0 (a placeholder: HP 1, Lv 1). `monster2.bin` is the same (369 of 370). Daigoro (row 174) carries them too. Every other aeon record in the repo carries 17: 255 and 18: 255 already.
- **What it means in play:** a resist of 255 blocks every chance byte but 255. The party has no ability that inflicts Itchy or Auto-Life on an enemy (Auto-Life rows target one ally; Itchy is carried only by monster rows), so the bytes are inert for this fight; but the record is the game's, and leaving them out turns "immune" into "lands" for the two slots.

### 7.2 The special word 0x3c3 [row, header]

Bits set: 0, 1, 6, 7, 8, 9. The game's own `monster.h` names them: bit 0 "ratio" (immune to the percent formulas), bit 1 "damage not stop" (a hit reaction does not slow her), bit 6 "inv atb" (no ATB damage), **bit 7 "disable Zantetsu"**, **bit 8 "wairo" (Bribe)**, **bit 9 "magic cancel"** (immune to Interrupt); bit 2 "live" is clear. The two earlier notes read bit 9 differently (`atb-status` section 5: magic cancel, which matches this header; `hit-status` section 2.3 and 6: Bribe-immune, `Chr+0x3a7` bit 1, which is the same bit 9). The header suggests the Bribe flag is bit 8. **Either way both bits are set on row 164, so she is immune to Bribe and to Interrupt whichever bit is which.** One line for the RE session: the engine's `inputs.ts` reads bit 0x200 as Bribe-immune (`bribeImmune`); the header says that is the magic-cancel bit.

## 8. What is open

1. The body radii of Valefor and of the three girls (the distance stat subtracts them), the cut (floor or truncation) and whether the girls stand at their start spots at each poll. Until they are read, "Yuna is the farthest, or the three are tied" is the strongest statement [inferred].
2. The boss's facing at the start (start direction is 0 0 0 0, the engine's default) for the near-weighted odds.
3. Whether any effect or animation data restricts who an Energy Ray hits (the "160 degree arc"): not in the rows or the script.
4. What row bytes +0x7b, +0x7e and +0x80 to +0x87 of the three moves do; which of her motion frames (`mf164.txt`: three long special motions of 212, 212, 508 and 252 frames) belongs to which move.
5. The gauge and ray count start at 0 by assumption, as in every earlier note.

## 9. Differences from `valefor.ts` and the data files at e047e179

Branch `origin/ch-besaid-valefor` e047e179 (the four reviewed files are unchanged at the later tip 440a1a22). Files: `src/battle/ffx2/ai/valefor.ts` (AI), `src/data/ffx2/enemies/valefor.ts` (data), `.../valefor-abilities.ts` (abilities), `src/data/ffx2/monster-records/records-valefor.ts` (record). Most severe first.

| # | Where | The code does | The game does | Fix in words | Sev. |
|---|---|---|---|---|---|
| D1 | AI `valefor.ts:93-102` | Adds 5 to the gauge on every poll that is not the Blast (Ray polls included) and then tests 30 and 60 on the new value: Rays on turns 6 and 12, Blast on turn 21 (no results) | Reads the gauge first; Ray turns and the Blast turn add nothing: Rays on turns 7 and 14, Blast on turn 23 (sections 1.2, 2) | Test the three thresholds on the gauge as it stands, and add 5 only inside the attack-class branch (after the Ray and Blast tests). A ray count (0, 1, 2) can replace the two flags: first Ray when gauge 30 or more and count 0, second when 60 or more and count 1 or less; reset both at the Blast | major |
| D2 | AI `valefor.ts:74-78` (`furthestGirl`), `:104` | Sonic Wings goes to the highest slot among the living (Paine first) | Goes to the greatest ground distance (minus radii) among the living: at the start formation Yuna 53.00 vs Rikku/Paine 52.39; Paine is never the lone farthest (section 4.2) | Add the Besaid scene to `SCENES` (`script-rolls.ts`: boss (0, 26); girls (0, -27), (-12, -25), (12, -25), identical to the Ixion scene) and pick by distance with ties kept: Yuna when alive (or the three tied until the radii are read), and with Yuna down a near-weighted pick between Rikku and Paine. Tag [inferred] until the radii are read | major |
| D3 | abilities `valefor-abilities.ts:61-72` (Sonic Wings) | `canMiss` unset on a physical ability: the derived row rolls accuracy formula 2 (the Attack's race) and Darkness applies | Accuracy formula 0: **never rolls**; misc 0x41200006 has no Darkness bit (section 3) | Mark Sonic Wings `canMiss: false`, or give it the game's row (appendix); fix the header comment (`:22`) and preflight section 3 ("only the Attack rolls") | major |
| D4 | abilities `valefor-abilities.ts:85-96` (Energy Blast), `:22-24` | Typed magical, so Shell halves it | Damage flags 0: neither physical nor magical; **neither Shell nor Protect reduces it** (section 3). Energy Ray is magical (Shell halves it) | Give Energy Blast the game's row (appendix) so its type bits are 0, or mark the ability untyped if the data layer has such a form | major |
| D5 | abilities `valefor-abilities.ts:28-96`, record `records-valefor.ts:16-18` | No `chargeTicks` or `recoveryTicks` on Ray, Wings or Blast: derived cost 70 and charge 0, so all three fire with no wind-up and recover in 1.97 s | Charge 120 / recovery 100 (Ray, Blast); charge 100 / recovery 80 (Wings). Ray and Blast have a 3.37 s charge, recovery 2.80 s (Wings 2.80 s charge, 2.24 s recovery) (section 3.1) | Add a `commands` entry per move to `MONSTER_RECORDS_VALEFOR` (or the three rows to `command-records/enemies.ts` as the Ixion rows are); the fields are in the appendix. The "survive Energy Blast" objective then has its telegraph | major |
| D6 | AI `valefor.ts:105`, `:34` | Attack target: uniform among the living girls | Near-weighted by closeness and facing (section 4.3) | With D2's `SCENES` row, use `searchNear` (as Bahamut's script does) instead of `pickGirl`; odds in section 4.3 | minor |
| D7 | record `records-valefor.ts:12-14, 30`; data `valefor.ts:36-40` | Leaves group-1 slots 17 and 18 out "because unmapped"; the engine then sees Itchy and Auto-Life as not resisted | Slots 17 and 18 are Itchy and Auto-Life (section 7.1) and carry 255 on 369 of 370 rows, every other aeon record included | Add `17: 255, 18: 255` to `resist1`; rewrite the three comments. No engine change. If a test pins their absence, change the test | minor |
| D8 | data `valefor.ts:36-41, 96`; record `:13-14`; preflight section 2 | Says bit 9 is "contested" and leaves Interrupt and Bribe undecided | Bits 8 and 9 are both set and the game's header names them Bribe and magic cancel (section 7.2); bit 7 (Zantetsu disabled) is set too | State that she is immune to Interrupt and Bribe and that Zantetsu is disabled; add `'action-cancel': 255` as Bahamut's data does (the kernel path already reads bit 9 from the record). Bribe has no slot to give anyway | minor |
| D9 | player text `chapter-meta-ffx2-valefor-besaid.ts:9, 35-36`; advisor `ffx2-valefor-besaid.ts:10-12` | "Shell halves Energy Ray and Energy Blast"; "Sonic Wings drains MP from the back of the line"; "every move of hers stirs the count" | Shell halves the Ray only; Sonic Wings goes to Yuna (the farthest) at the start formation; only attack-class turns (not Ray or Blast) and results on her raise the gauge | Reword; the White Mage is the girl whose MP is drained, which the advisor's Ether rule already assumes | minor |
| D10 | comments `valefor.ts:1-8, 63-64`, `valefor-abilities.ts:18-21`, `records-valefor.ts:16-20`, preflight sections 2.1, 2.4-2.7, 3 | Say the script is unread and tag the roll value, the counter marks, "+5 per result" and the thresholds `[model]`; the abilities header says no crit flag on the Attack | All of these are read: roll 0 = Sonic Wings, marks 30/60/100, +5 per result with the guard, thresholds first (sections 1 to 2). The Attack runs on the record's row 0x41da, which does carry crit byte 5 and shatter 10 | Re-tag them `[script]` with the line ranges of this note; correct the Attack comment | note |

**Agree** (checked against the script, rows or row 164): roll `% 3`, 0 = Sonic Wings (1 in 3), 1 or 2 = Attack (2 in 3); threshold values 30, 60, 100; the Blast test first and read before any gain; the Blast resets the counter; +5 per own attack-class turn; +5 per result applied to her, from anyone but herself, with the guard; no draw on Ray or Blast turns; the draws are on the script and search streams; Ray and Blast aimed at every living girl, hits 1, no element, never miss, no multi-target halving; Sonic Wings single target, 1 hit, MP damage, no element, no status; powers 16, 2, 20, 25; formulas strength (Attack, Wings) and magic (Ray, Blast); Ray is magical type; no HP phases; Level, HP, MP, the eight stats, ACC, EVA, LCK; the status list at slots 0 to 8, 10 and Stop, Doom; Gravity nulled; no other element byte; special bits 0 and 6; EXP, AP, Gil, Pilfer Gil, drop, steal items, steal byte; the plain Attack row 0x41da on the record; row 363 unused; FFX-2 only.

**In the chapter but not in the game:** a gain of 5 on Ray polls; Rays on turns 6 and 12 and the Blast on turn 21; the "highest slot" Sonic Wings target; the Blast being Shell-able; a Sonic Wings hit roll; Ray and Blast firing without a charge; the "160 degree arc" (nowhere in the data read; harmless because every girl is in front of her).

**In the game but not in the chapter:** the charge and recovery costs of the three moves; the near-weighted Attack target; the distance-based Sonic Wings target; Itchy and Auto-Life immunity (slots 17, 18); the Interrupt and Bribe immunity statement and the disabled-Zantetsu bit; the Die row at death (cosmetic, slot 23 unmapped); the dead time-out block (nothing to build).

### Appendix: the three move rows as numbers, in the shape of `FFX2CommandRecord`

For the record's `commands` map (keyed by ability id) or `command-records/enemies.ts`. Fields not listed (status maps, `magicCancel`) are absent or 0 on these rows [row].

| Ability id | id | costAtb | costCast | category | flagsTarget | flagsMisc | flagsDamage | damageClass | formula | critByte | accuracy | power | hits | shatter | element | killer |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `x2-valefor-energy-ray` | 0x4091 | 100 | 120 | 0 | 0x17 | 0x41200006 | 0x2 | 1 | 2 | 0 | 0 | 20 | 1 | 0 | 0 | 0 |
| `x2-valefor-sonic-wings` | 0x4092 | 80 | 100 | 0 | 0x13 | 0x41200006 | 0x1 | 2 | 0 | 0 | 0 | 2 | 1 | 0 | 0 | 0 |
| `x2-valefor-energy-blast` | 0x4093 | 100 | 120 | 0 | 0x17 | 0x41200006 | 0x0 | 1 | 2 | 0 | 0 | 25 | 1 | 0 | 0 | 0 |

(Compare Ixion's Thor's Hammer 0x4097 and Aerospark 0x4096 in `command-records/enemies.ts`: the same flag words, the same pattern of charge 120 or 100, and the same "no damage type" row for Aerospark.)
