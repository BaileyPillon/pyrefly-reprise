# FFX-2 boss AI read from the game's own scripts: Bahamut and the five Vegnagun links

**Game case: FFX-2 only.** FFX has its own scripts and its own engine; they have their own notes. This note covers the
FFX-2 chapter `ffx2-bahamut` (Bahamut) and the five links of `ffx2-vegnagun-shuyin` (Tail, Leg with the three Nodes, Body
with the two Bulwarks, Head with the two Redoubts, Shuyin). Part of the `re-parity` track
([docs/plans/re-parity.md](../docs/plans/re-parity.md)), P6 (boss AI follows the scripts). Drafted 2026-10-08. Research
only: no engine or AI code is changed by this note.

**Source note (applies to every statement below unless a line says otherwise):** FFX2_Data.vbf Steam build 25501027
(FFX-2.exe SHA-256 6EA7F142...CD69). The AI is the developers' own script source shipped in the archive under
`ffx_ps2/ffx2/master/jppc/battle/mon/` (`m168.src` Bahamut, `m282.src` to `m293.src` the Vegnagun parts, `m260.src`
Shuyin), checked against the compiled package next to each one (`_mNNN/mNNN.bin`). Ability numbers are rows of
`battle/kernel/monmagic.bin` and `command.bin`; stats are rows of `monster.bin` (the JP and US copies of all three are
numerically identical, and the stat record inside each compiled package equals the kernel row). Engine behaviour is read
from FFX-2.exe in Ghidra 12.1.4 (the older copy; every function cited was compared instruction by instruction with the
live build and is the same) and, for four functions, run in an x86 emulator on the live executable. Everything is written in
our own words: no script text, no game text and no decompiled code is reproduced here.

## Main findings in one screen

1. **Bahamut casts Curse once, at his very first action, not once per loop.** After that the loop is 6 actions: Attack,
   Attack, Attack, Impulse, Impulse, Mega Flare, with the countdown between the second Impulse and Mega Flare.
2. **The countdown is 5 steps of 150 AI polls (750 polls), not 5 Bahamut turns.** A poll happens on every logic step
   while he is ready and the ATB clock runs; Haste and Slow on him do not change it; any action executing, and a girl's
   submenu in Wait mode, freeze it. Seconds depend on the logic rate (30 or 60 steps per second, unsettled): 25 s or 12.5 s.
3. **Mega Flare's table power is 14** (the same in the JP and US tables, nothing in the script changes it). Our 24 is a fit
   to anecdotes. With the table value the engine formula gives about 195 to 430 per girl before Shell.
4. **The generic "battle too long" block in every one of these scripts never runs.** Its guard is true only when no girl
   is alive and un-petrified, and the ATB clock does not step in that state. The only live fail clock is the Head fight's.
5. **The Head fight's fail clock is exactly 100**: one shared counter, raised by every phase-2 action poll of the Head and
   both Redoubts; Shuyin speaks at 20, 40, 60, 80 and the world ends on the Head's first poll at 100 or more. Our
   `HEAD_FIRE_AT_TURN = 240` is an estimate.
6. **Most single targets are not uniform random.** `searchr` weights living, targetable girls by closeness and facing
   (validated against the live code); `searchr_nop` is uniform. Several choices also prefer a girl who does not yet have
   the status being cast.
7. **Shuyin's special targeting is the girl wearing her Special 1 dressphere, on the Terror of Zanarkand turn only**, not
   "Yuna whenever she is alive".
8. **The Head's agility is set by its script**: 110 from battle start, 68 once phase 2 begins (the table says 36). The Redoubts
   never attack in phase 1, they only revive each other. In the Leg link the three Nodes start in three different colours
   (A red, B green, C yellow).

## 0. How this was checked, and how to read the tables

- **Script against binary.** The decompiled bytecode of the action entry (and the reaction and death entries where present)
  of Bahamut, the Tail, the Leg, Node A, the Body, both Bulwarks, the Head, both Redoubts and Shuyin has the same control flow,
  constants, thresholds and command ids as the source text. Nodes B and C differ from Node A only in the lines the text diff
  shows (start colour, height). Source line ranges are cited as `m168.src:85-90`.
- **Engine.** Call numbers of the script VM were recovered from the exe's own call table (battle group = the order of the
  game's header `btlatel.ath`) and each handler read. Four engine functions were run on the live exe with synthetic
  characters (only the random generator scripted): the group-mask builder (VA 0x6117b0), the target-search filter chain
  (VA 0x634e40), the weighted target pick (VA 0x634fd0, four geometries, exact match with the model in 1.4) and the thinking
  delay (VA 0x634170).
- **Confidence tags.** [H] source and binary agree and the engine part was read; [M] read from the code but not run or
  partly inferred; [L] open.
- **Notation.** A "poll" is one call of a monster's action entry. A "step" is one battle logic step. "Girl" is a party
  member (Yuna slot 0, Rikku slot 1, Paine slot 2). "Near-weighted" and "uniform" pick are defined in 1.4. Numbers are
  written as the files have them. Seconds are shown as "at 30/s" and "at 60/s" because the PC logic rate is not settled
  (the pacing code defines one step as two sixtieths of a second, the scene script that shows the Bahamut numbers
  comments 75 units as 2.5 s, which favours 30/s; no stopwatch measurement has been made).

## 1. How the engine runs these scripts (applies to every actor below)

### 1.1 Entries and polls [H]

Each monster has one script with an init section (run once at battle start) and entries for main (idle), action, reaction,
menu, targeted and death. The engine asks for an entry by kind: 0 action, 1 menu, 2 targeted, 3 reaction, 4 death (the
package's tag table `[2,4,5,3,6]` maps kinds to functions). While the ATB clock runs, a monster that has finished recovery
and thinking is "ready"; on that step the engine runs its menu entry (empty for all of these actors) and then its action
entry. If the action entry issues a command (`setdircom`), the monster leaves the ready state (cast, execute, recovery,
thinking). If it issues nothing, the monster stays ready and is polled again on the next step. So a counter that only the
action entry advances counts **steps** whenever the script sometimes issues nothing (Bahamut's countdown, the Redoubts'
idle phase, the Head's idle branches) and counts **turns** otherwise.

The clock steps only while: the battle is in its main state and the party is not wiped (a wiped or fully petrified party
stops it), no pause flag is set, no action is executing (any command being carried out freezes every gauge), and the Wait
flag is clear. Wait mode sets the flag only while a girl's menu is below the root command list. Active mode never sets it.
Haste (x21/20) and Slow (/2) change the speed of gauges but not whether a ready monster is polled.

After a command ends, recovery is `cost_atb x 10000 / (AGI + 1)` units (the command's own cost, the monster's AGI byte),
then thinking: `(draw mod T) + T/4` with T the monster record's thinking byte (0 for every actor here, so none) plus
exactly 30 steps for every party member who is dead or petrified (run on the live exe: 0, 30, 90 for none, one, three down). Charge time is `cost_cast x 10000 / (AGI + 1)`
units. Gauges fall by 95 units per step at Normal speed (Slow 70, Fast 120), halved while the monster is charging or in hit
reaction. Cadence of each actor's moves is in section 8.

### 1.2 What a command from a script is [H]

`setdircom(target, command)` turns the target group or character into a bit mask and queues the command on the monster,
unless the monster is stopped, asleep, petrified, confused, berserk or ejected (none of these actors can be). Scripted
commands carry no "all targets chosen" byte, so the engine's multi-target damage halving never applies to a boss ability.
Groups used: *all party* = every party-side character in the battle (KO'd ones included), *all monsters* = every monster in
the battle (dead ones included), *self*, a monster id (every living or dead copy in the battle), a single character.

### 1.3 Random numbers [H]

`random()` returns the low 16 bits of one draw of global stream 2 (it is forced even on one unrelated field map, 0x3b1,
which none of these fights uses). `random() % n` is therefore a plain uniform pick. All target searches use global stream 4.
Neither stream is the per-character stream used for hit rolls and damage variance.

### 1.4 Target searches [H, validated by emulation]

`searchr(group, stat, word)`: keep the members of the group that are alive (petrified counts as alive) and targetable (the
cursor flag), then keep those for whom the stat test is true, or false when the word is "not" (Curse, Poison, Petrify, Darkness,
Slow and Berserk were each tried on the live exe). No candidate gives the value 255 ("nothing"). With one candidate nothing
is drawn.

- **`searchr` (near mode, the macro used for most targets)** draws `r = value mod W`, `W` = sum of weights, in stream 4 and
  takes the first candidate in slot order (Yuna, Rikku, Paine) whose running weight sum reaches `r`. Weight of a candidate
  = `1 + floor(32768 / floor(cost + 1))`, `cost = (1 + d) x (1 + 2 x |a|)`, `d` = distance on the ground plane between boss
  and girl, `a` = angle (0 to pi) between the boss's facing and the direction to the girl. Because the scan uses `r <= sum`,
  the first slot owns one extra value and the last one fewer. Example, illustrative only (positions and facing at the time
  decide): boss at (0, 30) facing the party head-on, girls at (0, -20), (-17, -25), (17, -25) gives 47.6% / 26.2% / 26.2%;
  facing away gives 35.0% / 32.7% / 32.3%.
- **`searchr_nop`** is uniform: the `(value mod n)`-th candidate in slot order.
- A "far" mode exists (weight proportional to cost) but no script here uses it.
- Run on the live exe: 4 geometries, every value of `r`, all pick counts equal the model.

### 1.5 The reaction entry [H]

The reaction entry runs synchronously inside the hit application on that monster: after the result's HP, MP and statuses
are applied, once per hit per target, for any command from anybody (including poison and regeneration ticks, which are
results too). It sees: the attacker (`chr_reaction`, slot number), the attacker's command id, the HP damage of that result,
and three guards the scripts use: `getreaction` (true unless the monster is stopped, asleep, petrified, confused, berserk or
ejected, or the attacker is the monster itself), `checkactiondamage` (the result came from an ordinary action hit, not from
a poison or regeneration tick) and `stat_reaction_amount` (how many reaction-type commands the monster already has queued).
The command's "attack type" the Body records is `flags_damage & 3`: 1 physical only, 2 magical only, 3 or 0 anything else.
No script here reacts by element. No reaction here queues a counter command itself: they only set flags that a later action
poll reads.

### 1.6 The generic "battle too long" block (inert) [H]

Bahamut, Tail, Leg, Body and Shuyin start their action entry with a block that counts actions and, past 180/190/195/200
(Bahamut, Shuyin) or 230/240/245/250 (Tail, Leg, Body) actions, casts four warning messages and then a 12-hit random-target
fixed-damage Meteor (row 0x4236, formula 5 power 200, always 9,999) on the whole party, only in its own scene. It is guarded
by `countchr_player(all living un-petrified party, all human party members) == 0`. Run on the live exe: that count is 3 for a
full party, 2 with one down, and 0 only when every girl is dead or petrified, and in that state the ATB clock does not step,
so the action entry is not polled. **The block never executes in play.** For the Tail, Leg, Body and Shuyin the same guard
also hides the line that raises the action counter, so the counter never moves; Bahamut raises his counter elsewhere, but
only this block reads it.

### 1.7 Battle-local flags [M]

Scripts share `bf_*` variables declared in `battle/header/local.src` (Body and Bulwarks use `bf_keisuke00/01`, `bf_halu_00/02`;
the Head and Redoubts use the same names with other meanings). They live in the scene image loaded for each battle and have no
initial value in the declaration, so they start at 0 in each of the five links; this was not traced in the exe, but the Head
fight would not work if they carried over from the Body fight. The same names mean different things in links 3 and 4.

## 2. Bahamut (m168; chapter `ffx2-bahamut`; scene stbv05_229)

Record: HP 8,400, MP 9,999, Lv 20, STR 71, DEF 160, MAG 86, MDEF 10, AGI 86, ACC 95, EVA 0, LCK 3, thinking 0; immune to
Death, Petrify, Sleep, Silence, Darkness, Poison, Confusion, Berserk, Curse, blow-away, Stop and Doom; gravity null. Script:
`m168.src`; the number windows are scene events in `btl/stbv05_229/evt_stbv05_229.src:12-40`.

**Start.** The init section only disables moving and sets the death pattern; nothing else is set. The first gauge is 25% to
74% of the recovery of command 0x302d (8,045 units): 2,011 to 5,971 units, 21 to 63 steps; thinking is 0 for him.

### 2.1 Action entry, in the order the script tests (m168.src:48-337) [H]

| # | Condition | Action | Chance / RNG | Source |
|---|---|---|---|---|
| 0 | the generic block of 1.6 | never runs | | 50-83 |
| 1 | first action poll of the battle (flag unset) and some living, targetable girl lacks Curse | set the flag; Curse (0x4046) on one such girl; end of poll | near-weighted pick, stream 4 | 85-90, 211-215 |
| 1b | same poll, but every such girl already has Curse (or none exists) | set the flag; go on to the rotation in this same poll | | 85-90, 91-210 |
| 2 | countdown armed, poll counter below 150 after +1 | no command; stays ready | | 92-97, 219-224 |
| 3 | armed, counter reaches 150 | counter back to 0; step 1 of 5 (see 2.2) | | 98-141, 225-268 |
| 4 | not armed; attack counter +1 equals 1, 2 or 3 | Attack (0x41da) on one living, targetable girl without Poison; if all are poisoned, on any living targetable girl | near-weighted pick, stream 4 | 145-195, 272-322 |
| 5 | attack counter equals 4 | Impulse (0x409b) on all party | | 197-200, 324-327 |
| 6 | attack counter equals 5 | attack counter back to 0, arm the countdown, Impulse on all party | | 202-207, 329-334 |

The Curse branch is a one-time prefix: the flag is never cleared. The rotation text appears twice (inside the first-action
branch and in the else branch) with the same behaviour. Bahamut has no reaction, menu or targeted code; his death entry
queues his death command if a death reaction is allowed (m168.src:341-360).

**Cycle after the first action:** Attack, Attack, Attack, Impulse, Impulse (second one arms the countdown), 5 x 150 polls,
Mega Flare, then Attack again. Six actions per cycle; Curse never again. The counter `n_action` rises with each of these
actions but only the inert block reads it.

### 2.2 The countdown [H]

| Step | Polls since the second Impulse was queued and Bahamut became ready | Effect | Source |
|---|---|---|---|
| 1 | 150 | number window "5" (scene event 5) | 100-105 |
| 2 | 300 | window "4" | 108-113 |
| 3 | 450 | window "3" | 116-121 |
| 4 | 600 | window "2" | 124-129 |
| 5 | 750 | window "1", countdown disarmed, Mega Flare queued on all party | 130-136 |

Each number is a scene event of 75 script units (the scene script's own comment: 2.5 s). The window text itself is not
reproduced here. Counting starts when he is ready again after the second Impulse, that is after Impulse's charge (cost_cast
100 = 11,494 units), execution and recovery (cost_atb 80 = 9,195 units, 97 steps) plus thinking. 750 polls are 25.0 s at
30/s or 12.5 s at 60/s of **running clock**: every party action that executes, and every Wait-mode submenu, adds to the
real time. Nothing the party does shortens it and nothing speeds it up; there is no HP trigger. Mega Flare then charges
(cost_cast 120 = 13,793 units) and recovers (cost_atb 120 = 13,793 units).

### 2.3 Rows the script calls [H]

| Row | Name | Class / formula | Power | Hits | Accuracy | Cost (recovery / charge) | Notes |
|---|---|---|---|---|---|---|---|
| 0x41da | Attack | HP, formula 0 (physical) | 16 | 1 | accuracy formula 2 = attacker ACC byte (95); can crit, fixed 5%; Darkness cuts it | 100 / 0 | shatter 10 |
| 0x409b | Impulse | HP, formula 4 | 6 | 1 | never rolls | 80 / 100 | `target HP x 6 / 16` (37.5% of current HP, floor), all party; neither the physical nor the magical damage bit is set |
| 0x409c | Mega Flare | HP, formula 2 (magic) | 14 | 1 | never rolls | 120 / 120 | all party, magical bit set (Shell halves) |
| 0x4046 | Curse | statuses | | | chance byte 254 (lands unless immune) | 0 / 120 | Curse is group-1 status 8 |

**Impulse and Shell.** The engine halves for Shell only when the row has exactly the magical bit (and for Protect exactly the
physical bit); Impulse has neither, and formula 4 reads no attack stat, so Shell, Protect and Magic/Mental Break do not
change it. Our research file says otherwise.

**Mega Flare power.** The files give 14 (rows 0x409c of the JP and US tables are identical; the script passes no override;
the stat record in the package equals the kernel row). The engine formula for formula 2 is
`((MAG + 2 x Lv) x P x P >> 6) x (270 - MDEF) / 255 x stages x draw / 256`, draw 240 to 271, then Shell halves. For MAG 86,
Lv 20:

| P | Girl MDEF 0 | 11 | 20 | 50 | 132 |
|---|---|---|---|---|---|
| 14 (table) | 381-430 | 366-413 | 353-399 | 311-351 | 195-220 |
| 24 (our constant) | 1125-1270 | 1079-1218 | 1041-1176 | 916-1035 | 574-648 |

No other multiplier was found in the damage path for a scripted, non-crit, non-elemental magic hit. The two published
reports our constant was fitted to ("about 500 to 1,000", "around 1,000") do not match the table value. They may describe
several hits together (two Impulses take 61% of full HP before it); the one place a different level or MAG could enter, the
step that copies an enemy's stats into the battle character, was not traced [L]. Recommendation: use 14 and confirm with one
measured Mega Flare on a girl whose MDEF is known.

**Death:** Bahamut's death command is queued when a death reaction is allowed (not for a Doom, blow-away, bribe or steal-motivation death).

## 3. Link 1: Vegnagun Tail (m282; scene wegn01_229)

Record: HP 34,200, MP 9,999, Lv 41, STR 77, DEF 82, MAG 72, MDEF 76, AGI 115, LCK 3; standard ailment immunities, gravity
null, special flags 0x7c3. Init sets presentation and movement flags only. One action entry (m282.src:55-164). [H]

| # | Condition | Action | Chance / RNG | Source |
|---|---|---|---|---|
| 0 | generic block (1.6) | never runs | | 57-91 |
| 1 | voice flag unset | voice flag set; a Braska voice line (row 0x41d8, recovery 60, no effect); end | | 93-100 |
| 2 | opening-sweep stage = 0 | stage 1; Noli Me Tangere (0x412f) on all party (a near-weighted target search is also run and ignored: one stream-4 draw when 2+ girls live) | | 103-109 |
| 3 | HP below max/4 (8,550) and stage at most 2 | stage 3; Noli Me Tangere on all party (same ignored search) | | 112-120 |
| 4 | HP below max/4, stage 3, voice flag = 1 | voice flag 2; a Jecht voice line; end | | 121-141 |
| 5 | anything else | Tail Beam (0x4130) on one living, targetable girl | near-weighted, stream 4 | 142-160 |

The stage-2 sweep that the text seems to promise at half HP can never fire: its test sits inside the quarter-HP branch after
stage 3 is already set. Between half and quarter HP the Tail just beams. Death entry is empty.
Rows: Noli Me Tangere formula 5 power 25 = 1,250 fixed to each girl, physical bit (Protect halves), recovery 100, no charge.
Tail Beam formula 7 power 5 = 5/16 of the target's max HP (31.25%), no damage-type bit, charge 120, recovery 100.
Cadence at AGI 115: Beam charge 10,344 units (109 steps), recovery 8,620 (91 steps).

## 4. Link 2: Leg and the three Nodes (m283, m284-m286; scene wegn01_228)

### 4.1 Leg (m283) [H]

Record: HP 18,220, Lv 38, STR 13, DEF 13, MAG 18, MDEF 17, AGI 34, LCK 3. Only the Leg should have to die: the Nodes' existence
flag is off [M, inferred from the flag]. Action entry m283.src:59-226.

| # | Condition | Action | Chance / RNG | Source |
|---|---|---|---|---|
| 0 | generic block (1.6) | never runs | | 61-95 |
| 1 | poll counter (raised on every poll, before this ladder) is 2, 4, 5, 7, 10, 11, 12, 17 or 20 | a voice line (Jecht, Jecht, Auron, Braska, Jecht, Braska, Auron, Auron, Braska); end | | 99-173 |
| 2 | otherwise: turn counter +1 reaches 4 | counter 0; Vita Brevis (0x4131) on all party | | 175-181 |
| 3 | otherwise `random() % 4` = 0 | Break (0x3084, petrify 80) on one living, targetable, un-petrified girl; none: Absorb (0x4040) on any living targetable girl | 25% | 187-198 |
| 4 | = 1 | Berserk (0x406a, 75) on a girl without Berserk; none: Absorb | 25% | 200-211 |
| 5 | = 2 or 3 | Slow (0x406c, chance 130, 126 counts) on a girl without Slow; none: Absorb | 50% | 213-225 |

All the `searchr` picks are near-weighted. Sequence from the first poll: `1 . 1 . . 1 . V 1 . . . 1 1 V 1 . 1 1 . V` and then
`1 1 1 V` forever (1 = a status move, . = voice, V = Vita Brevis); our 26-step table is this sequence. Rows: Vita Brevis
formula 2 power 40, physical bit, strong ATB delay flag, charge 120, recovery 100; Absorb class 3 (HP and MP) formula 4
power 3, drains; Break, Slow have recovery 0. Cadence at AGI 34 is slow: Vita Brevis charge 34,285 units (361 steps),
recovery 28,571 (301 steps).

### 4.2 Nodes A, B, C (m284, m285, m286) [H]

Record (all three): HP 300,000, MP 9,999, Lv 52, STR 48, DEF 244, MAG 16, MDEF 244, AGI 41. They fly at three heights and
are "far" targets. Identical scripts except the starting colour: **A starts colour 1 (red), B colour 2 (green), C colour 3
(yellow)** (m284.src:41-46, m285.src:41-44, m286.src:41-44). Colour 1 gives auto physical-invincible, colour 3 auto
magic-invincible, colour 2 neither. Action entry m284.src:61-161, reaction 163-181.

| # | Condition | Action | Chance | Source |
|---|---|---|---|---|
| 1 | colour counter +1 reaches 5 or more | counter 0; colour 1 to 2 to 3 to 1; sets the colour effect level and the two invincibility flags; **no command this poll** | | 63-92 |
| 2 | colour 1 (red), `random() % 2` = 0 | Dies Irae (0x4133, 9 random-target physical hits, power 4) on all party | 50% | 97-104 |
| 3 | colour 1, = 1 | Missile (0x4132, 2 hits, power 9) on one living girl | 50% | 97-108 |
| 4 | colour 2 (green), `random() % 5` = 0 | Regen (0x30b6) on the Leg | 20% | 110-117 |
| 5 | = 1 | Shell (0x30bb) on the Leg | 20% | 118-121 |
| 6 | = 2 | Protect (0x30bc) on the Leg | 20% | 122-125 |
| 7 | = 3 or 4 | Cura (0x30b4) on the Leg | 40% | 126-129 |
| 8 | colour 3 (yellow), `random() % 5` = 0 | Flare (0x41fa) on one living girl | 20% | 136-140 |
| 9 | = 1 / 2 / 3 / 4 | Firaga / Waterga / Thundaga / Blizzaga (0x41f1, 0x41f4, 0x41f3, 0x41f2) on all party | 20% each | 141-156 |

Targets for the single-target attacks are `searchr_nop` (uniform). Recovery is 100 for the missiles and 0 for the spells,
casts 30 (missiles), 60 (support), 70 (the four -ga spells), 100 (Flare).

**Reaction (m284.src:163-181).** When all three guards of 1.5 hold and the result dealt more than 0 HP, the colour counter
gains 1. Hits that deal no damage (physical on red, magic on yellow) do nothing. Poison and regeneration ticks do not count.
The change itself happens on the Node's next poll once the counter is 5 or more. Death entry sets the effect level to 0.

## 5. Link 3: Body and the two Bulwarks (m287, m288, m289; scene wegn01_227)

### 5.1 Body (m287) [H]

Record: HP 33,040, Lv 43, STR 54, DEF 98, MAG 42, MDEF 108, AGI 35, LCK 4. Action entry m287.src:65-236.

| # | Condition | Action | Source |
|---|---|---|---|
| 0 | generic block (1.6) | never runs | 67-101 |
| 1 | first-line flag unset | an Auron voice line; end | 103-110 |
| 2 | second-line flag unset and `bf_halu_00 == 1` (a Bulwark has been hit by a girl) | a Jecht line; end | 116-130 |
| 3 | `bf_halu_02 >= 4` (the Bulwarks have answered 4 times) | stage 0, 1, 2: Braska, Jecht, Auron lines on three consecutive polls; then the counter is forced to 8 | 136-172 |
| 4 | core-shot counter `>= 3` | stage 0, 1: Braska, Jecht lines on two polls; then forced to 8 | 178-203 |
| 5 | energy counter `>= 3` | shot counter +1, energy 0, Memento Mori (0x413a) on all party | 209-215 |
| 6 | Right Bulwark dead | Full-Life (0x4069) on it | 218-221 |
| 7 | Left Bulwark dead | Full-Life on it | 222-227 |
| 8 | otherwise | energy +1, Charge Core (0x413b, no effect) on itself | 228-232 |

Cycle with both Bulwarks alive: Charge, Charge, Charge, Memento Mori. A revive replaces a charge (energy unchanged) and cannot
replace the shot; dead-Right is revived before dead-Left. Voice polls (60 recovery) are extra polls. Rows: Memento Mori formula
2 power 28, magical bit, all party, charge 30, recovery 100; Full-Life formula 7 power 16 = 100% of max HP, revives, charge 200
(585 steps at AGI 35), recovery 80; Charge Core no damage. A nonzero energy counter is not reset by anything else.

**Reaction (m287.src:238-283).** For every result applied to the Body from Yuna, Rikku or Paine: the "who" flag gets 1, 2 or 3
(Yuna, Rikku, Paine), and the "type" flag gets 1 if the attacker's current command has only the physical damage bit, 2 if
only the magical bit, 3 for anything else (both bits, neither bit: items, Charon, Darkness, the percent and Overdrive-style
commands). Last hit wins. Hits from monsters are ignored.
**Death entry (293-299):** sets monster slots 2 and 3 (the two Bulwarks in this scene) to 0 HP and queues the Body's death
command (0x413c).

### 5.2 Bulwarks (Right m288, Left m289) [H]

Record (both): HP 3,000, Lv 39, STR 72, DEF 58, MAG 48, MDEF 58, AGI 46, LCK 2. Death pattern "normal", existence flag off.
Action entry m288.src:49-140, m289.src:49-145; reaction 142-155 / 147-160.

1. **Pick the single target first** (51-95, same in both): by the "who" flag: 1 = Yuna if alive, 2 = Rikku, 3 = Paine, otherwise
   (or if that girl is dead) a uniform living girl (`searchr_nop`, one stream-4 draw when 2+ live). The flag is reset to 0
   whenever it was 1 to 3. This runs on every poll, even when the type flag is 0.
2. **Then act on the "type" flag** (97-138):

| Type flag | Right Bulwark | Left Bulwark |
|---|---|---|
| 0 (nothing logged) | `random() % 4`: 0 Shell (0x30bb) 25%, 1 Protect (0x30bc) 25%, 2-3 Regen (0x30b6) 50%, each on a uniform living monster | 0 Break (0x3084), 1 Doom (0x3086), 2 Bio (0x3085), 3 Dispel (0x30b8), 25% each, on a uniform living girl, one target |
| 1 (physical) | Physical attack detected (0x4136) on all party; flag 0; `bf_halu_02` +1 | same with 0x4138 |
| 2 (magical) | Magical attack detected (0x4137) on all party; flag 0; `bf_halu_02` +1 | same with 0x4139 |
| 3 (other) | Hostile activity detected (0x4134) on the single target picked in step 1; flag 0; `bf_halu_02` +1 | same with 0x4135 |

Rows: Physical attack detected formula 7 power 5 = 5/16 of each girl's max HP, physical bit, clears the girls' STR and DEF
stage bytes; Magical attack detected MP damage, formula 7 power 3 = 3/16 of max MP, magical bit, clears MAG and MDEF stages;
Hostile activity detected HP and MP damage 3/16 each, magical bit, clears Shell, Protect, Reflect, Regen and Haste. Charge
30, recovery 100. Idle spells have recovery 0. Cadence at AGI 46: answers 6,382 units charge (67 steps) + 21,276 recovery
(224 steps).
**Reaction:** any result from a girl sets `bf_halu_00` to 1 and adds 1 to `bf_halu_01`. No death code.

## 6. Link 4: Head and the two Redoubts (m290, m291, m292; scene wegn01_226)

The scene also holds a fourth monster (m293, a second "Shuyin" record with 80,000 HP) whose script does nothing and which
is not in the battle (cursor, existence and in-battle flags off). By their flags only the Head counts toward victory
(the Redoubts have the existence flag off) [M, inferred from the flags].

### 6.1 Head (m290) [H]

Record: HP 38,420, MP 99,999, Lv 57, STR 56, DEF 71, MAG 52, MDEF 59, AGI 36, LCK 4. Init: **AGI set to 110**, cursor flag
off (untargetable). Action entry m290.src:73-463. `bf_keisuke00` is the phase flag (0 = phase 1).

**Phase 1** (flag 0):

| # | Condition | Action | Chance | Source |
|---|---|---|---|---|
| 1 | first poll | a Shuyin voice line; end | | 75-85 |
| 2 | `bf_halu_00 >= 2` (the Redoubts have revived each other twice) | first time: a Jecht line; end. Later, each poll: `random() % 4 == 0` then stage 1: an Auron line; stage 2: two Braska lines queued back to back; stage 3: nothing | 25% per poll | 89-139 |
| 3 | both Redoubts alive | Pallida Mors (0x413d, formula 2 power 26, magical) on one living girl | `searchr_nop` uniform | 141-147 |
| 4 | exactly one Redoubt alive | nothing: idle poll every step | | 148-158 |
| 5 | both Redoubts dead | cursor flag on (targetable), phase flag 1, Acta Est Fabula (0x4144: revive and full heal, power 16, charge 80) on every other monster | | 160-167 |

**Phase 2** (flag nonzero), every poll sets AGI 68, then tests in order (each speaking line ends the poll):

| # | Condition | Action | Source |
|---|---|---|---|
| 1 | first phase-2 poll | Shuyin line; end (does not raise the clock) | 177-185 |
| 2 | third phase-2 poll | Jecht line; end (does not raise the clock) | 186-195 |
| 3 | (every other poll) shared counter `bf_keisuke01` +1 | | 198 |
| 4 | counter >= 100 | `setbattlefadeout_win(off)`, then the "blow-away speak" (row 0x41d9, status Blow chance 255) on all party; end. **The party is gone: game over / bad ending** | 203-210 |
| 5 | counter >= 80 / 60 / 40 / 20, each once | a Shuyin line; end | 212-262 |
| 6 | counter >= 51, once | a Braska line; end | 264-274 |
| 7 | HP below max/5, once; HP below max/2, once | an Auron line; a Jecht line; end | 276-298 |
| 8 | `random() % 5 == 0`, then `random() % 3` picks Auron / Jecht / Braska line, each only once | the line; end (if already used, the poll goes on) | 300-339 |
| 9 | both Redoubts dead | Acta Est Fabula on every other monster; end | 341-358 |
| 10 | HP band ladder | see below | 360-460 |

**Attack ladder** (strict "below" tests with integer thresholds 7,684 / 15,368 / 23,052 / 30,736): below max/5 first time
(stage <= 3): stage 4, Nemo Ante Mortem Beatus (0x4142, formula 2 power 30, all party, charge 120); below 2/5 (stage <= 2): stage
3, Nemo; below 3/5 (stage <= 1): stage 2, Nemo; below 4/5 (stage 0): stage 1, Nemo. In every band, when the stage test fails
or at or above 4/5: if the hit counter `mf_hangeki >= 15` then counter 0 and Odi et Amo (0x4140, formula 2 power 6, 16 hits at
random targets, also clears buffs and three boost statuses), else Mors Certa (0x4141, formula 2 power 12, all party, 80% each
of Silence, Darkness, Poison). Crossing several bands in one go fires one Nemo and skips the stages in between, so at most
four Nemo casts.

**Reaction (467-477):** in phase 2, every applied result that deals more than 0 HP adds 1 to the hit counter (per hit per
target). **Death entry (489-493):** queues the Head's death command (0x4143) on all party.

**The fail clock.** `bf_keisuke01` is shared: the Redoubts add 1 on every phase-2 action poll as well (6.2). Doom comes at
100 or more on the Head's first later poll. Shuyin's lines come at 20, 40, 60 and 80 (and one at the start of phase 1,
one at the start of phase 2, a Braska line at 51). Cadence at AGI 68: Mors Certa charge 17,391 units (183 steps) + recovery
14,492 (153 steps); in phase 1 at AGI 110: Pallida Mors recovery 9,009 (95 steps).

### 6.2 Redoubts (Right m291, Left m292) [H]

Record (both): HP 2,500, MP 99,999, Lv 40, STR 65, MAG 41, AGI 47, LCK 3. Right: DEF 133, MDEF 0. Left: DEF 0, MDEF 133.
Existence flag off. Action entry m291.src:51-174, m292.src:51-153.

- **Phase 1 (flag 0):** if the other Redoubt is dead, queue Full-Life (0x4069, charge 200 = 41,666 units, 439 steps at AGI
  47) on it and add 1 to `bf_halu_00`; otherwise **nothing** (idle poll every step). They never attack in phase 1.
- **Phase 2:** each poll: own turn counter +1 and shared clock +1. Other Redoubt alive: pick by the turn counter. Other
  Redoubt dead: if the revive counter is 2 or more, reset it and cast Full-Life on the twin (turn counter has still
  advanced), else revive counter +1 and attack as below. So with the twin dead the pattern is attack, attack, revive.

| Turn | Right (m291.src:74-113) | Left (m292.src:74-104) |
|---|---|---|
| 1 | Break (0x3084) on a girl who is not petrified (else any living) | MP beam (0x413f, MP damage, power 2) on one living girl |
| 2 | HP beam (0x413e, formula 0 physical power 16) on one living girl | Slow (0x406c) on a girl without Slow (else any living) |
| 3 | Blind (0x3178, chance 100) on a girl without Darkness (else any living) | Dispel (0x30b8) on one living girl |
| 4 or more | Flare (0x41fa) on one living girl; turn counter 0 | Demi (0x3082, formula 4 power 4 = 25% of current HP) on all party; turn counter 0 |

All Redoubt picks are `searchr_nop` (uniform; the "not" variants pick among girls lacking the status). **Death entries:**
turn counter set to 1 (Right, m291.src:188-201) or 0 (Left, m292.src:167-180); if the twin is also dead, the Head's cursor
flag is switched on at once (the Head becomes targetable at the second death, before it polls). Reaction, menu, targeted: empty.

## 7. Link 5: Shuyin (m260; scene wegn01_225)

Record: HP 23,850, MP 210, Lv 58, STR 47, DEF 132, MAG 42, MDEF 92, AGI 133, ACC 95, EVA 22, LCK 14; permanent Use-MP0 status.
The scene has three inert copies of the cannon parts (m305-m307, not in battle) and a weapon model. Action entry m260.src:69-340.

| # | Condition | Action | Chance / RNG | Source |
|---|---|---|---|---|
| 0 | generic block (1.6) | never runs | | 71-105 |
| 1 | line-gate flag 0 and `random() % 2 == 0` | gate set to 1; if HP below max/2: `random() % 7` picks one of 7 one-shot lines (Jecht x3, Auron x2, Braska x2); else `random() % 5` picks one of 5 (Jecht, Auron x2, Braska x2); an unused line is spoken and the poll ends; a used one falls through | 50% x (unused / pool) | 107-261 |
| 2 | line-gate flag 1 | gate back to 0 (no attempt this poll) | | 263-265 |
| 3 | turn counter +1 = 1 | Attack (0x41da) on a living girl | near-weighted | 270-274 |
| 4 | = 2 | Terror of Zanarkand (0x411b) on a living girl, near-weighted; **override: if Yuna's job is Floral Fallal the target is Yuna; then if Paine's is Full Throttle, Paine; then if Rikku's is Machina Maw, Rikku (later checks win)** | | 276-293 |
| 5 | = 3 | Attack | uniform | 296-300 |
| 6 | = 4 | Hit & Run (0x4119) on all party | | 303-306 |
| 7 | = 5 | Attack | uniform | 309-313 |
| 8 | = 6 | Spin Cut (0x4118) | uniform | 316-320 |
| 9 | = 7 | Attack | uniform | 323-327 |
| 10 | = 8 | counter 0; Force Rain (0x411a) on all party | | 329-332 |

The 8-turn cycle is Attack, Terror, Attack, Hit & Run, Attack, Spin Cut, Attack, Force Rain. A spoken line is a full poll
(command 0x41d8, recovery 60) that does not advance the cycle; a poll that spoke is always followed by a poll without an
attempt. Each line of a pool is spoken at most once. Rows: Attack as Bahamut's (power 16, ACC byte 95);
Terror of Zanarkand formula 1 power 10, 9 hits, no Defense term, single target, charge 100; Hit & Run formula 0 power 8,
6 hits at random targets, charge 100; Spin Cut formula 0 power 24, charge 100; Force Rain formula 2 power 20 magical, all party,
charge 100; recovery 0 for the four Limit moves. Cadence at AGI 133: Attack recovery 7,462 units (79 steps).
Floral Fallal, Full Throttle and Machina Maw are the in-game names of job ids 0x500f (Yuna), 0x5015 (Paine) and 0x5012 (Rikku),
each girl's first special dressphere. There is no Yuna-first rule anywhere in the script.

## 8. Cadence reference (units from the rows; steps at Normal speed, no halving)

Recovery = `cost_atb x 10000 / (AGI+1)`, charge = `cost_cast x 10000 / (AGI+1)`; 95 units per step. Halving while charging or in
hit reaction and the Haste, Slow factors are in 1.1. "Dialogue" rows are the speak commands (cost 60).

| Actor (AGI) | Move | Charge units (steps) | Recovery units (steps) |
|---|---|---|---|
| Bahamut (86) | Attack | 0 | 11,494 (121) |
| | Impulse | 11,494 (121) | 9,195 (97) |
| | Mega Flare | 13,793 (145) | 13,793 (145) |
| | Curse | 13,793 (145) | 0 |
| Tail (115) | Noli Me Tangere | 0 | 8,620 (91) |
| | Tail Beam | 10,344 (109) | 8,620 (91) |
| Leg (34) | Vita Brevis | 34,285 (361) | 28,571 (301) |
| | Break / Slow / Berserk | 22,857 / 25,714 / 28,571 | 0 / 0 / 22,857 |
| | Dialogue | 0 | 17,142 (180) |
| Node A-C (41) | missiles | 7,142 (75) | 23,809 (251) |
| | Cura, Regen, Shell, Protect | 14,285 (150) | 0 |
| | Flare / -ga spells | 23,809 (251) / 16,666 (175) | 0 |
| Body (35) | Memento Mori, Charge Core | 8,333 (88) | 27,777 (292) |
| | Full-Life | 55,555 (585) | 22,222 (234) |
| Bulwarks (46) | answers | 6,382 (67) | 21,276 (224) |
| Head (110 then 68) | Pallida Mors | 0 | 9,009 (95), then 14,492 (153) |
| | Nemo / Odi / Mors Certa | 10,810 (114), then 17,391 (183) | 9,009 (95), then 14,492 (153) |
| Redoubts (47) | Full-Life | 41,666 (439) | 16,666 (175) |
| | Lacrimosa (HP / MP) | 12,500 (132) | 20,833 (219) |
| Shuyin (133) | Attack | 0 | 7,462 (79) |
| | Limit moves | 7,462 (79) | 0 |

## 9. Open items, and what could not be decoded

- **Mega Flare against the anecdotes** [L]: the table says 14; see 2.3. The step that copies enemy stats into the battle
  character was not traced.
- **Logic rate** [L]: 30 or 60 steps per second; the pacing code and the scene comment point to 30/s.
- **Battle-local flags between the five links** [M]: assumed zero at each battle start.
- **Whether the number windows pause the clock** [M]: the gating flags were read; none is set by message windows, but this was
  not run.
- **Targets in practice** [L]: positions and facing at each poll decide the near-weighted odds; only starting positions of the
  Bahamut scene were used in the example.
- **Nodes B and C, Left Bulwark** [M]: compared with Node A and the Right Bulwark by text diff and by the compiled idle branch.
- **Animation and effect hit areas** (for example the "5 m" reach of the Bulwark answers in our data) come from effect
  collision data, not from the scripts, and were not read.
- Voice lines, camera and message text were not extracted and are not described beyond who speaks and when.

## 10. Differences from our AI

Row key: *game* = this note; *ours* = file:line in `src/battle/ffx2/`.

| # | Rule | Game (source) | Ours | Effect |
|---|---|---|---|---|
| B1 | Curse | cast once, on the very first action (m168.src:85-90) | every 12-action loop, step 1 (`ai/bahamut.ts:8,55-57`) | extra Curse every cycle |
| B2 | Loop shape | 6 actions per cycle: 3 Attack, 2 Impulse, Mega Flare (m168.src:145-207) | 12-action loop with 5 dead turns (`ai/bahamut.ts:4-14,33-37,64-76`) | wrong rhythm, wrong action count |
| B3 | Countdown unit | 5 x 150 AI polls on a running clock (m168.src:92-141) | 5 Bahamut turns; "Slowing him slows the countdown" (`ai/bahamut.ts:11,18-19`) | Slow/Haste must not change it; action animations and Wait submenus must freeze it |
| B4 | Numbers shown | 5,4,3,2,1 at polls 150..750, the 1 with the cast (evt_stbv05_229.src:12-40) | 5,4,3,2,1 over turns 7-11, then 0 with the cast (`ai/bahamut.ts:66-79`) | one extra display, timing |
| B5 | Attack / Curse target | near-weighted, unpoisoned first (Curse: un-Cursed first) | uniform random (`ai/bahamut.ts:43-46,56,59`) | central girl hit more, poison diverts |
| B6 | Mega Flare power | 14 (monmagic row 0x409c) | `MEGA_FLARE_CONSTANT = 24` (`constants.ts:272`, `abilities-core.ts:123`) | about 2.9 x the table damage |
| B7 | Impulse and Shell / Magic Break | not affected (no damage-type bit, formula 4 reads no stat) (row 0x409b) | the research file counts Shell and Magic Break against Impulse (research/ffx2-bahamut.md:144,490-491,570) | strategy text wrong |
| T1 | Tail HP trigger | only after the opening sweep, Sweep then a separate voice poll (m282.src:112-141) | checked before the opening turns; the voice is a bundled event (`ai/vegnagun.ts:47-51`) | edge timing, one turn |
| T2 | Tail Beam target | near-weighted (m282.src:158) | uniform (`ai/vegnagun.ts:15-18,59`) | |
| L1 | Leg status move | Break 25, Berserk 25, Slow 50 (m283.src:184-224) | one third each (`ai/vegnagun.ts:82-88`) | Slow twice as often |
| L2 | Leg target | near-weighted among girls lacking the status; fallback Absorb on any living (m283.src:188-224) | uniform among eligible (`ai/vegnagun.ts:90-94`) | |
| N1 | Node colour counter | change when the counter reaches 5 on a poll, that poll attacks nothing; hits count only if they deal HP damage (m284.src:63-92,165-173) | change at 4 and the same turn still attacks with the old colour; any hit counts (`ai/vegnagun.ts:139-148,193-196`) | colour changes too early and too often |
| N2 | Starting colours | A red, B green, C yellow (m284-m286.src:41-46) | all start red (`ai/vegnagun.ts:130-132`) | |
| N3 | Green support | Regen 20, Shell 20, Protect 20, Cura 40 (m284.src:111-129) | 25 each (`ai/vegnagun.ts:186`) | |
| C1 | Core voices | seven voice polls interleave (m287.src:103-203) | none | pacing |
| C2 | Bulwark idle | Right: Shell 25 / Protect 25 / Regen 50 on a uniform living monster; Left: one-target Break, Doom, Bio, Dispel (m288.src:101-118, m289.src:101-125) | Right: three spells at the Core only; Left: Break and Bio as party-wide (`ai/vegnagun-body.ts:87-98`) | |
| C3 | Bulwark answers | Physical/Magical on all party; Hostile on the logged attacker or a random girl (m288.src:121-137) | all three aimed at the logged attacker (`ai/vegnagun-body.ts:113-122`) | check whether the data file's all-enemies targeting overrides it |
| C4 | Core log | any result from a girl; type from damage bits (1,2 else 3) (m287.src:240-281) | damaging events only, class from `lastAttackClass` (`ai/vegnagun-body.ts:78-83`) | |
| H1 | Phase change | both Redoubts dead at the same time; one dead = Head idles (m290.src:141-168) | any Redoubt dead (`ai/vegnagun-head.ts:103-108`) | phase B starts far too early |
| H2 | Fail clock | shared counter, Head + both Redoubts, doom at 100, Shuyin lines at 20/40/60/80, Braska at 51 (m290.src:198-274) | 240 combined turns, line interval 48 (`ai/vegnagun-head.ts:125-164`, `constants.ts:302,305`) | clock 2.4 x too long |
| H3 | Head agility | 110 in phase 1, 68 in phase 2 (m290.src:48,173) | table 36 (`src/data/ffx2/enemies/vegnagun-head.ts:121`) | Head acts 3 x too slowly in phase 1 |
| H4 | Nemo thresholds | strict below; one Nemo per band, skipped bands are not paid back (m290.src:360-445) | `<=` fractions, one Nemo per crossed band in order (`ai/vegnagun-head.ts:39,72-78`) | |
| H5 | Hit counter | every applied HP-damaging result in phase 2 (m290.src:467-477) | per damage event (`ai/vegnagun-head.ts:166-168`) | check per-hit |
| H6 | Pallida Mors target | one living girl, uniform (m290.src:145-146) | passes no target (`ai/vegnagun-head.ts:110`) | check how the engine fills an empty target for a single-target ability |
| R1 | Redoubt cycle | Right: Break, HP beam, Blind, Flare (m291.src:76-113) | Right starts with the HP beam, Break last (`ai/vegnagun-head.ts:179-181`) | cycle phase off by one |
| R2 | Redoubt picks | status moves prefer a girl lacking the status (m291.src:77-107, m292.src:82-92) | uniform (`ai/vegnagun-head.ts:205`) | |
| R3 | Redoubt turn counter | advances on revive turns too; death resets it to 1 (Right) or 0 (Left) (m291.src:68,190) | advances only on attacks (`ai/vegnagun-head.ts:199-201`) | |
| R4 | Phase 1 idle | no command: polled every step, revive reacts within one step (m291.src:53-64) | null turn spends a normal turn (`ai/vegnagun-head.ts:188-189`) | revive latency |
| S1 | Shuyin target rule | the girl in her Special 1 dressphere, Terror turn only; all other picks near-weighted or uniform (m260.src:276-293) | Yuna whenever she is alive, every move (`ai/shuyin.ts:53-60`) | wrong target bias |
| S2 | Line interrupts | 50% attempt every other poll, pools of 5 and 7 one-shot lines (m260.src:107-266) | 1-in-10 and 1-in-14 per turn (`ai/shuyin.ts:45-48,62-79`) | |
| A1 | Impulse damage type | no physical and no magical bit (row 0x409b): Shell and Protect never apply | `damageType: 'magical'` (`data/ffx2/enemies/bahamut-abilities.ts:74-81`, `abilities-core.ts:85`) | Shell halves it in ours |
| A2 | Vita Brevis | physical bit only (row 0x4131; it uses the magic-stat formula): Protect halves, Shell does not | magical (`data/ffx2/enemies/vegnagun-abilities.ts:57`) | wrong halving buff |
| A3 | Noli Me Tangere, Left Lacrimosa | physical bit (rows 0x412f, 0x413f): Protect halves | 'other' (`vegnagun-abilities.ts:38`, `shuyin-abilities.ts:194`) | Protect would not halve them in ours |
| A4 | Terror of Zanarkand | neither bit (row 0x411b): Protect does not halve | physical (`shuyin-abilities.ts:357`) | |
| A5 | Bulwark answers | physical bit (0x4136, 0x4138), magical bit (0x4137, 0x4139, 0x4134, 0x4135) | 'other' with an `extra` class (`vegnagun-body-abilities.ts:79-119`) | check how the class is used |
| G1 | Generic time-out | never runs (1.6) | none | same behaviour, no action needed |
