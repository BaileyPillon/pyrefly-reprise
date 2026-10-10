# FFX-2 boss AI read from the game's own scripts: Shiva, the Magus Sisters, Anima, Paragon, the Oversoul Paragon and Trema

**Game case: FFX-2 only.** FFX has its own scripts and its own engine; they have their own notes. This note covers the
FFX-2 chapters `ffx2-fallen-aeons` (Shiva, the three Magus Sisters, Anima on the Road to the Farplane) and `ffx2-trema`
(Paragon in its normal and its Oversoul form, then Trema, on Cloister 100 of the Via Infinito). Part of the `re-parity`
track ([docs/plans/re-parity.md](../docs/plans/re-parity.md)), P6 (boss AI follows the scripts). Drafted 2026-10-08; the
logic rate, the clock during effects and the charge tick (main finding 8, the notation, 1.1, 1.7, 6.3, 6.4, section 9, row
O2, section 11) and the step counts (rounded up: section 8 and the inline counts) corrected on 2026-10-09 from the live
measurement ([re-ffx2-timing-measured.md](re-ffx2-timing-measured.md)). Research only: no engine or AI code is changed by
this note.

**Source note (applies to every statement below unless a line says otherwise):** FFX2_Data.vbf Steam build 25501027
(FFX-2.exe SHA-256 6EA7F142...CD69). The AI is the developers' own script source shipped in the archive under
`ffx_ps2/ffx2/master/jppc/battle/mon/` (`m167.src` Shiva, `m169.src` Anima, `m171.src` Cindy, `m172.src` Sandy, `m173.src`
Mindy, `m152.src` Paragon, `o152.src` the Oversoul Paragon, `m295.src` and `m328.src` Trema), checked against the compiled
package next to each one (`_mNNN/mNNN.bin`). Ability numbers are rows of `battle/kernel/monmagic.bin` and `command.bin`;
stats are rows of `monster.bin` and, for the Oversoul block, `monster2.bin`. Engine behaviour is read from FFX-2.exe in
Ghidra 12.1.4 (the older copy; its battle code was compared instruction by instruction with the live build by the
earlier lanes). The general engine rules (how a monster is polled, the random generator, the target searches, the
generic "battle too long" block, the hit and ATB rules) are in
[re-ffx2-ai-bahamut-vegnagun.md](re-ffx2-ai-bahamut-vegnagun.md) sections 1.1 to 1.7,
[re-ffx2-hit-status.md](re-ffx2-hit-status.md) and [re-ffx2-atb-status.md](re-ffx2-atb-status.md); this note
repeats only what it needs and adds the engine facts these six fights depend on (section 1). Everything is written in our
own words: no script text, no game text and no decompiled code is reproduced here.

## Main findings in one screen

1. **The Magus Sisters' Delta Attack is a handshake that only Cindy can finish.** Mindy and Sandy each raise a shared flag
   when their own gauge reaches 100; Cindy casts Delta Attack on her first poll in which her own gauge is 100 or more
   **and** both flags are up (`m171.src:86-101`). The flags drop only by that cast or by that sister's death. Our AI lets
   whichever sister polls first cast it (`magus-sisters.ts:91-94`).
2. **Every "action counter" rises on results, not on "being attacked".** The reaction entry runs once for every result
   applied to the actor: each strike that lands, each command that misses (one result for the whole command), status-only
   and zero-damage results, regeneration ticks and the result of a drain on the drainer. For Shiva and Anima it is guarded
   (not from themselves, not while stopped, asleep, petrified, confused, berserk or ejected); for the Sisters it is
   not guarded at all, so Cindy's own Guard, Regen and White Highwind on the Sisters raise their gauges by 5 each.
3. **Sandy, Cindy and Shiva use other odds than the community dumps.** Sandy: Razzia 1/3, Attack 2/3 (not 1/4, 3/4).
   Cindy: Camisade 2/5, Absorb, Demi and Regen 1/5 each (not 1/4 each). Shiva's "Triple Attack" is three separate polls
   with their own targets and no gauge gain after the first (`m167.src:86-99`).
4. **White Highwind needs no "alive" condition.** Cindy casts it (certain, no roll) when her own HP and both other sisters'
   HP are each below a quarter of their maximum; a fallen sister counts as below (`m171.src:114-124`).
5. **Trema's odds are the Fiend Arena ones in both versions.** Chain 1/2, Demi 1/6, Flare 1/12, Choking Mist, Beguiling
   Mire and Waning Moon 1/12 each; the story script and the arena script compile to the same decisions
   (`m295.src:85-130`, `m328.src`). Our story weights (Demi and Flare 1/8 each) are not in the files.
6. **Trema's HP triggers are ordered Ultima, then the quarter Meteor, then the half Meteor, and the quarter test also
   covers a skipped half Meteor.** If his HP falls through both Meteor thresholds before he gets to use the first, he casts
   one Meteor, not two (`m295.src:37-83`). The three-link chain is queued in one poll, so no trigger can interrupt it.
7. **The Oversoul Paragon acts on its HP every poll.** Below 40 percent it casts from the -aga pool; below 10 percent it
   opens with Final Impact once per fight, then a five-way pool; neither waits to be hit (`o152.src:87-95,194-272`).
   The "waits until hit" part is only the idle branch above 40 percent HP with MP.
8. **The idle limit is 1200 idle polls (the 1201st acts) and any result applied to it resets it** (hit, miss, status-only,
   its own drain). `wait` is a no-op in this build, so a poll is one logic step of a running ATB clock: 1,200 steps are
   40.04 s at the measured 29.97 steps a second (`o152.src:56,130-143`). *Corrected by the 2026-10-09 measurement
   ([re-ffx2-timing-measured.md](re-ffx2-timing-measured.md) section 3):* the first draft gave "40 s at 30 steps a second,
   20 s at 60" while the rate was unsettled; 20 s would need 60 steps a second, which the running game does not run.
9. **The Oversoul answers on its next poll, and its answers differ from our lists.** A girl's heal or buff that lands **on
   it** makes it cast Demi on the party every poll until a new result lands. A spell from a 32-command list is copied back
   at the caster alone. Anything else (physical attacks, items, Darkness) gets a Normal Attack at a **uniformly random
   girl, not at the attacker** (`o152.src:275-345`). Our copy list lacks Osmose, Blind, Sleep and Berserk, and our Demi
   list lacks Life and Full-Life.
10. **Normal Paragon's Big Bang is not an immediate counter.** Any result from a command whose damage type is "neither
    physical nor magical" (Darkness, Charon, Scan, Libra, Steal, Pilfer, items, 1000 Needles and dozens more) sets a flag;
    the next poll casts Big Bang instead of its scheduled move (`m152.src:49-53,103-122`).
11. **The Oversoul Paragon's physical misses are the ordinary accuracy race with ACC 95 and Luck 16**, not a flat rate; its
    Attack carries no status; its -aga spells take no all-targets halving (scripted commands carry no such byte).
12. **Spellspring is on both Trema and the Oversoul block** (record automatic status "Use MP 0", which the cost check reads):
    draining their MP does not stop their spells. The Oversoul script itself reads "MP is 0" and then only casts Osmose or Attacks.
13. **Unused or inert in these fights:** the generic "battle too long" block (Shiva, Anima and the Sisters have it, it can
    never run; Paragon and Trema do not have it), the Sisters' thinking byte 30 (never read), the Anima model-hide entry.

## 0. How this was checked, and how to read the tables

- **Script against binary.** The compiled action, reaction and death entries of every actor were disassembled with the
  REA lane's Atel disassembler (battle call names from the game's own header) and compared with the source text: same
  control flow, thresholds and command ids (the command id sets are equal; the one source-only id, the Oversoul's Copy Mode
  row, sits in commented-out lines). Trema's compiled arena script (`m328`) has exactly the decisions of the story script
  (`m295`), and the copy of it in the Oversoul slot of the same package is identical too.
- **Compiled functions run.** The disassembly was executed in a small interpreter with scripted state (HP, MP, gauges,
  flags, Reflect, the last command) and every `random() mod n` expanded exhaustively, which gave the exact outcome tables in
  the sections below (about 60 states; the output is in the working folder, not in the repo).
- **Engine.** Handlers and helpers read in Ghidra (older copy): the ATB step and poll loop, the action request, the
  hit executor, the result applier (which asks the reaction entry), the reaction accessors, the command queue, the Oversoul
  switch, the cost check and the status recompute. The earlier lanes' emulator runs of the target search, thinking and
  damage functions are reused, not repeated.
- **Confidence tags.** [H] source, binary and engine part agree; [M] read from the code but not run, or inferred from
  structure; [L] open.
- **Notation.** A "poll" is one call of an actor's action entry. A "step" is one battle logic step. "Girl" is a party member
  (Yuna slot 0, Rikku 1, Paine 2). `random()` is a uniform pick (stream 2, low 16 bits; the modulo bias is below 0.01
  percentage points and ignored); target searches use stream 4 (`searchr` is near-weighted, `searchr_nop` uniform, a single
  candidate draws nothing). "Recovery" and "charge" are `cost x 10000 / (AGI + 1)` units, 95 units a step at Normal speed.
  Seconds are at the measured 29.97 steps a second, one step being 0.033367 s (corrected by the 2026-10-09 measurement,
  which closed the 30-or-60 question: [re-ffx2-timing-measured.md](re-ffx2-timing-measured.md) section 3). Step counts
  derived from units are rounded up, because the game's counter has to reach 0 or less and so needs the next whole step
  (a 16,666-unit refill took 176 steps on the running game; 16,666 / 95 = 175.4); a figure with a decimal point, such as a
  first-poll range, is the exact quotient and is left unrounded. Source line ranges are cited as `m167.src:86-91`.

## 1. Engine facts these fights depend on

### 1.1 A poll is one step; `wait` costs nothing [H for the code; the rate is measured, 29.97 a second]

An actor that has finished recovery and thinking is "ready"; on that step the engine runs its (empty) menu entry and then
its action entry. If the entry queues no command the actor falls back to the start of the ATB state machine, which
passes straight through "recovered" and "thought" and makes it ready again on the next step, so there is exactly one poll
per step while the clock runs (clock gates as in the earlier note, 1.1). The script call `wait(n)` has **no handler** in the
function table (entry 0 of the common table is empty) and completes at once, so the Oversoul's idle branch, which ends in
`wait(1)`, costs no extra time. Several `setdircom` calls in one poll each queue a command; the queue is a ring of eight
per actor, so Trema's three-link chain fits [H]; commands start in order as each finishes [M, queue consumer not traced].
Scripted commands carry **no all-targets byte** (the queue call passes zero for it), so the multi-target halving of
damage never applies to a boss ability, including the party spells the Oversoul borrows [H for the queue call, M that nothing
later sets the byte; this answers the open question in FINDINGS B3].

### 1.2 The reaction entry [H, drain transfer M]

It runs at the end of the result applier, so after the result's HP, MP and statuses are applied. The per-hit executor
sends all three hit determinations (hit, miss, no effect) through that applier, so the reaction runs:

- once per **strike that lands** (a three-hit command that hits is three results);
- once for a command that **misses** (a miss resolves all the remaining strikes on that target at once) and once for a
  "no effect" result;
- for results the engine builds itself: poison and regeneration ticks, and the result delivered to a **drainer** (the HP
  or MP taken by a drain-type command, such as Absorb, Osmose or Paragon's drain Attack, is applied to the user as a result
  of its own) [M for the drain path: the pending-result list was read, the consumer was followed only to the applier];
- whoever the attacker is, including the actor itself and its allies. Results aimed at a dead target the command cannot
  touch are skipped.

What the entry can read: the attacker's slot (`getchrnum(chr_reaction)` returns the attacker's character number: 0, 1, 2
for Yuna, Rikku, Paine; a monster attacker returns its record id, for example 4248 for Paragon, so any non-girl attacker
takes the "default" branch), the attacker's **current command id** (`getrecom`), that command's damage type
(`getcominfo(cmd, 1)` = the row's damage flags masked with 3: 1 physical only, 2 magical only, 0 neither; no row of
`command.bin` has both), and the guard `getreaction`, which is false when the actor is the attacker, or is stopped, asleep,
petrified, confused, berserk or ejected. Shiva and Anima test the guard; the Sisters, both Paragon scripts and Trema do not.

### 1.3 Variables start at 0 [M]

Each worker's own variables have no initial image in the package (the private-data offset in the worker header is 0) and no
init entry here sets a gauge or flag. The four shared battle flags the Sisters use (`bf_halu_00/01`, `bf_keisuke00/01`, at
offsets 4, 8, 0x24, 0x28 of the battle-local block declared in the game's header `local.src`) live in a block the battle
system provides, not in any package. The allocation was not traced in the exe; every consumer assumes 0 at the start (the
fights do not work otherwise) and the community dump agrees. Where this matters it is tagged [M].

### 1.4 Two scripts per Oversoul-capable monster [H]

The package of Paragon holds three workers: worker 0 is `o152.src` (Oversoul AI), worker 1 is `m152.src` (normal AI),
worker 2 is the motion script. The action request asks entry **0x44** for a monster, **0x45** when its Oversoul flag (Chr+0x3a9)
is set; the tag table maps 0x44 to worker 1 and 0x45 to worker 0, and kinds 0 to 4 (action, menu, targeted, reaction, death)
to functions 2, 4, 5, 3, 6 of that worker. So an Oversouled Paragon uses the Oversoul script for its reaction and death too.
The switch to the Oversoul block happens in the ATB step, when a recovery ends and the monster's Oversoul type has reached its
kill count (the "Weapon" type needs 10 kills, `oversoul.bin` row 0xa000) and no other monster of the type is Oversouled:
the monster is rebuilt from the second stat block (`monster2.bin`: HP 210,000, AGI 244, Luck 16, Spellspring) with HP and MP
refilled. That happens before any AI poll, so it is not an AI turn [H for the sequence, M for the animation time].

### 1.5 The cost check [H for the function, M for monsters]

A command's usability is checked when its charge completes: Silence blocks a silenceable row; MP below the row's cost fails
it; the status "Use MP 0" (Spellspring) sets the cost to 0. A failed check cancels the command. Trema's record (both
versions) and the Oversoul block carry that status in their automatic statuses; the normal Paragon record does not. How the
automatic status word reaches the effective status word was not traced [M].

### 1.6 The monster record's thinking byte is never read [H]

The routine that builds a monster's battle character copies level, STR, DEF, MAG, MDEF, AGI, ACC, EVA, LCK and the special
word, not the thinking byte, and the battle-start call that sets the thinking base always passes 0. The three Sisters'
"thinking 30" does nothing: only the fixed 30 steps per fallen or petrified girl are added after each command
([re-ffx2-atb-status.md](re-ffx2-atb-status.md) section 3.4).

### 1.7 Every actor here has the Damage-Not-Stop bit [H]

Special words 0x3c3 (Shiva, Anima, the Sisters, Trema) and 0x2db (Paragon) have bit 1 set, so a hit reaction never halves
their gauge. (Corrected by the 2026-10-09 measurement: this line ended "only charging does". The charging flag stayed 0
through all 7 charge countdowns measured on the running game, and they fell the full 95 units a step, so in play nothing
halves a charge: [re-ffx2-timing-measured.md](re-ffx2-timing-measured.md) section 6.)

## 2. Shiva (m167; story scene ikai09_229; arena scene crcr00_096)

Record: HP 14,800, MP 9,999, Lv 41, STR 69, DEF 74, MAG 58, MDEF 183, AGI 124, ACC 95, EVA 58, LCK 6; absorbs Ice, weak to
Fire, Gravity-immune; immune to Stop and Doom, Slow and the stat Breaks land. Init (`m167.src:28-42`) sets the death pattern
(falls, cannot be raised) and switches two motion-invincibility flags off; the arena scene overrides the EXP reward. The
generic block (`50-84`) is inert (section 1.6 of the earlier note: it needs every girl dead or petrified, and the clock then stops).

| Row | Name | Class / formula | Power | Hits | Accuracy | Recovery / charge | Notes |
|---|---|---|---|---|---|---|---|
| 0x4000 | Attack | HP, formula 0 | 16 | 1 | formula 2 = Shiva's ACC byte (95); fixed 5% crit | 100 / 0 | physical |
| 0x4100 | Chain Attack | HP, formula 0 | 12 | 1 | never rolls | 0 / 0 | physical; the "Triple Attack" |
| 0x41f2 | Blizzaga | HP, formula 2 | 19 | 1 | never rolls | 0 / 70 | Ice, magical, MP 24 |
| 0x4099 | Heavenly Strike | HP and MP, formula 4 | 8 | 1 | never rolls | 80 / 100 | 8/16 of current HP and MP; Stop chance 30 |
| 0x409a | Diamond Dust | HP, formula 2 | 26 | 1 | never rolls | 200 / 120 | all party, magical, no element |

### 2.1 The action entry, in the order the script tests (m167.src:48-158) [H]

| # | Condition | Action | Chance | Source |
|---|---|---|---|---|
| 0 | generic block | never runs | | 50-84 |
| 1 | chain counter = 2 | counter 0; Chain Attack on a uniform living girl | | 86-91 |
| 2 | chain counter = 1 | counter 2; Chain Attack on a uniform living girl | | 94-99 |
| 3 | gauge >= 100 (tested before any addition) | gauge 0; Diamond Dust on all party | | 102-106 |
| 4 | otherwise gauge +3, and the new gauge >= 65 | `random() mod 4`: 0 Heavenly Strike; 1 chain counter 1 and Chain Attack; 2 or 3 Blizzaga (each on a uniform living girl) | 25 / 25 / 50 | 109-131 |
| 5 | otherwise (new gauge < 65) | 0 Heavenly Strike; 1 Blizzaga; 2 or 3 Attack | 25 / 25 / 50 | 133-153 |

Run on the compiled script: with the gauge at 60 the poll uses the early table (63 after adding), at 62 or more the late
table. So the late table starts on the first poll whose gauge before adding is 62 or higher; in a run with no hits that is
the 22nd poll. The Diamond Dust poll adds nothing (the gauge is reset first), and the poll after a chain start is a
continuation that does not look at the gauge, so a chain can postpone Diamond Dust by up to two polls.

**Reaction (m167.src:160-167):** if the guard is true, gauge +5. Per result (1.2), so a three-hit command that lands adds
15, a miss adds 5, and so does a status attempt she resists (a "no effect" result). The guard is false for results she
causes herself and while she is asleep, petrified, confused, berserk or ejected (she is immune to most of these).
**Death (177-184):** queues her death command when a death reaction is allowed.

**Numbers:** without hits Diamond Dust comes on the 35th poll (gauge 102); every result is worth 1.67 polls. First poll
after the start: 14.7 to 43.7 steps (opening counter, before the opening trim and the first-strike roll).

## 3. The Magus Sisters (Cindy m171, Sandy m172, Mindy m173; story scene ikai09_228; arena scene crcr00_098)

Records: Cindy HP 12,240, Lv 46, STR 38, DEF 172, MAG 9, MDEF 133, AGI 72, EVA 4, LCK 4. Sandy HP 10,330, Lv 45, STR 40, DEF
83, MAG 17, MDEF 84, AGI 83, EVA 33, LCK 4. Mindy HP 9,788, Lv 44, STR 28, DEF 72, MAG 8, MDEF 121, AGI 89, EVA 76, LCK 4;
all ACC 95, MP 9,999, thinking byte 30 (unused, 1.6). Death pattern: falls, cannot be raised, so a fallen sister never
returns.

| Row | Name | Class / formula | Power | Hits | Accuracy | Recovery / charge | Notes |
|---|---|---|---|---|---|---|---|
| 0x41da | Attack (Sandy) | HP, formula 0 | 16 | 1 | formula 2, ACC 95; fixed 5% crit | 100 / 0 | physical |
| 0x40a6 | Razzia (Sandy) | HP, formula 2 | 16 | 1 | never rolls | 0 / 0 | magical |
| 0x40a7 | Camisade (Cindy) | HP, formula 0 | 16 | 1 | never rolls | 0 / 0 | no damage-type bit |
| 0x4040 | Absorb (Cindy) | HP and MP, formula 4 | 3 | 1 | never rolls | 40 / 100 | 3/16 of current; drains to Cindy |
| 0x3082 | Demi (Cindy) | HP, formula 4 | 4 | 1 | never rolls | 0 / 80 | all party, 25% of current HP, magical |
| 0x30b6 | Regen (Cindy) | status | | | | 0 / 60 | MP 40 |
| 0x4086 | Not-So-Mighty Guard | status | | | | 80 / 120 | Protect (126), Shell (126), Regen (50) on all sisters |
| 0x4088 | White Highwind | HP, formula 7 | 6 | 1 | | 80 / 120 | 6/16 of max HP; clears ailments and stat drops |
| 0x40a9 | Delta Attack | formula 10 | 1 | 1 | never rolls | 200 / 0 | all party; the research file's effect is 1 HP and 0 MP (formula 10 not decoded here) |
| 0x40a8 | Passado (Mindy) | HP, formula 4 | 1 | 15 | never rolls | 0 / 0 | physical bit |
| 0x41f1-4 | Firaga, Blizzaga, Thundaga, Waterga (Mindy) | HP, formula 2 | 19 | 1 | never rolls | 0 / 70 | one element each, MP 24 |

### 3.1 The shared handshake [H]

Four battle-wide flags are involved: Mindy's flag and Mindy's reset flag (`bf_keisuke00`, `bf_halu_00`), Sandy's flag and
Sandy's reset flag (`bf_keisuke01`, `bf_halu_01`); every sister also has her own gauge.

1. **Own gauge.** Each sister's gauge gains 5 at the top of every one of her own polls (Cindy: after the Delta test, see
   below) and 5 on every reaction (3.4).
2. **Raising the flag.** After adding, Mindy sets her flag when her gauge is 100 or more; Sandy likewise (poll and reaction
   both do it, `m173.src:90-95,133-138`, `m172.src:90-95,119-124`). Nothing lowers a flag except Cindy's cast and that sister's
   own death (`m173.src:150-152`, `m172.src:136-138`).
3. **Casting.** Cindy, at the start of a poll (before any addition), if her own gauge is 100 or more **and** both flags are up:
   her gauge goes to 0, both flags drop, both reset flags go up, Delta Attack on all party, end of poll (`m171.src:86-101`).
   If her gauge is 100 or more but a flag is missing, she carries on and keeps gaining 5 a poll (the gauge has no ceiling).
4. **Reset.** At the start of her next poll or her next reaction, whichever comes first, a sister whose reset flag is up sets
   her gauge to 0 and lowers the flag, then adds 5 as usual (`m173.src:84-88,127-131`, `m172.src:84-88,113-117`). So after Delta
   Attack Mindy and Sandy show 5, not 0, at their next event; Cindy's own reset is immediate.
5. **Disarming.** Killing Sandy or Mindy lowers her flag for good, so Delta Attack can never fire again; killing Cindy does
   the same because only Cindy casts it. The shared death command ends the fight when the last of the three falls (each
   sister's death entry checks the other two).

Twenty polls of her own (nothing else adding) bring a sister to 100; the first Guard alone gives each sister +5 on top
(three results, one each).

### 3.2 Cindy's action entry (m171.src:48-150) [H]

| # | Condition | Action | Chance | Source |
|---|---|---|---|---|
| 0 | generic block | never runs | | 50-84 |
| 1 | gauge >= 100, and both Mindy's and Sandy's flags up | gauge 0, flags handled as in 3.1; Delta Attack on all party; end | | 86-101 |
| 2 | otherwise gauge +5 and turn counter +1; turn counter >= 8 | turn counter 0; Not-So-Mighty Guard on all monsters | | 103-111 |
| 3 | else, Cindy's HP, Sandy's HP and Mindy's HP each below max/4 | White Highwind on all monsters; end | certain | 114-124 |
| 4 | else `random() mod 5`: 0 | Absorb on a uniform living girl | 20% | 129-132 |
| 5 | 1 | Demi on all party | 20% | 134-136 |
| 6 | 2 | Regen on a uniform **living monster** (any sister, herself included) | 20% | 138-141 |
| 7 | 3 or 4 | Camisade on a uniform living girl | 40% | 143-146 |

The turn counter starts at **7** (`m171.src:36`), so Cindy's first action is the Guard; then seven actions of rows 3 to 7,
then the Guard again. A Delta Attack poll does not advance the counter. "Below max/4" uses integer division of each sister's
own maximum (3,060 / 2,582 / 2,447 for Cindy / Sandy / Mindy at full records; strict "below"), and a fallen sister has HP 0,
which counts as below. With Sandy and Mindy down, Cindy alone under a quarter casts White Highwind on every poll until she is
above it.

### 3.3 Sandy and Mindy [H]

Sandy (`m172.src:46-109`): after the reset, gain and flag steps of 3.1, `random() mod 3`: 0 Razzia, 1 or 2 Attack, each on a
uniform living girl: **Razzia 1/3, Attack 2/3**. Mindy (`m173.src:46-123`): after the same steps she picks a uniform living
girl first, then `random() mod 6`: 0 Firaga, 1 Blizzaga, 2 Thundaga, 3 Waterga, 4 or 5 Passado: **Passado 1/3, each spell
1/6**. Both reactions repeat the reset, gain and flag steps (`m172.src:111-126`, `m173.src:125-140`).

### 3.4 What a result does to a sister [H, drain M]

Their reaction has no guard (1.2) and Cindy's only line is "gauge +5". So every result counts once: a girl's strike that
lands, a girl's miss, a status or Dispel, a Regen tick on that sister (a Regen counter of 50 lasts about 790 steps and ticks
every 16,000 units after a random first phase, so **four ticks** per uninterrupted application: +20 [M, from the
status-clock rules in re-ffx2-atb-status.md section 6]), and every cast **by Cindy on a sister**: the Guard puts +5 on each
of the three (herself included), Regen +5 on its target, White Highwind +5 on each.
Cindy's own Absorb also reaches her as a result (the drain), which matches the community dump's "+5 more when she uses
Absorb" [M].

**Death entries (m171.src:166-187, m172.src:136-159, m173.src:150-173):** Sandy and Mindy lower their flag first; each then
queues the shared Die command (0x40b4) only if both of the others are dead.

First poll after the start: Cindy 25.2 to 74.9 steps, Sandy 21.9 to 65.1, Mindy 20.5 to 60.7 (opening counters, before the
trim and the first-strike roll).

## 4. Anima (m169; story scene ikai09_227; arena scene crcr00_097)

Record: HP 36,000, MP 9,999, Lv 43, STR 32, DEF 84, MAG 33, MDEF 42, AGI 133, ACC 95, EVA 0, LCK 5; halves Fire, Ice,
Thunder and Water, weak to Holy, Gravity-immune. Init (`m169.src:29-45`) disables movement and jumping. A separate "model
setup" entry (`51-55`) hides one model part and has no effect on play.

| Row | Name | Class / formula | Power | Hits | Accuracy | Recovery / charge | Notes |
|---|---|---|---|---|---|---|---|
| 0x409d | Anima Attack | HP, formula 3 | 10 | 1 | never rolls | 100 / 0 | no damage-type bit (Protect and Shell do not halve); Poison chance 25 |
| 0x409e | Pain | HP, formula 2 | 16 | 1 | never rolls | 80 / 100 | magical; Silence, Darkness, Itchy (120 each) and a stat-down status each |
| 0x409f | Oblivion | HP, formula 0 | 5 | 16 | never rolls | 200 / 200 | physical bit, all party |

| # | Condition | Action | Chance | Source |
|---|---|---|---|---|
| 0 | generic block | never runs | | 59-93 |
| 1 | gauge >= 100 | gauge 0; Oblivion on all party | | 95-99 |
| 2 | else gauge +5; `random() mod 5` = 0 | Pain on a uniform living girl | 20% | 102-109 |
| 3 | = 1 to 4 | Anima Attack on a uniform living girl | 80% | 110-114 |

**Reaction (119-126):** guard true -> gauge +5 (per result, 1.2). **Numbers:** without hits Oblivion is the 21st poll
(20 ordinary polls of +5); each result is worth one poll. First poll after the start: 13.7 to 40.8 steps.

## 5. Paragon, normal form (m152 worker 1; Via Infinito scene stbv09_224; arena scenes crcr00_114, crcr01_014)

Record: HP 200,000, MP 9,999, Lv 99, STR 244, DEF 88, MAG 244, MDEF 89 (our data has 88), AGI 188, **ACC 95** (our data has
0), EVA 0, LCK 13; immune to the usual ailments (Death, Petrify, Sleep, Silence, Darkness, Poison, Confusion, Berserk,
Curse), Eject, Itchy, Slow, Stop, Doom, the stat Breaks and Gravity. Init (`m152.src:28-40`): cannot be raised; the arena
scene overrides the EXP reward. No generic block, no HP trigger, no timer.

| Row | Name | Class / formula | Power | Hits | Accuracy | Recovery / charge | Notes |
|---|---|---|---|---|---|---|---|
| 0x41df | Attack (poison) | HP, formula 0 | 16 | 1 | never rolls; fixed 5% crit | 100 / 0 | Poison chance 100 |
| 0x41e3 | Attack (poison and confuse) | HP, formula 0 | 16 | 1 | never rolls | 100 / 0 | Poison always, Confusion chance 120 |
| 0x41e2 | Attack (itchy) | HP, formula 0 | 16 | 1 | never rolls | **60** / 0 | Itchy always |
| 0x41e5 | Attack (pierce) | HP, formula 1 | 16 | 1 | never rolls | 100 / 0 | ignores Defense |
| 0x41e7 | Attack (drain) | HP, formula 0 | 16 | 1 | never rolls | 100 / 0 | drain transfer to Paragon |
| 0x40ec | Genesis | HP, formula 2 | 44 | 1 | never rolls | 80 / 120 | all party, MP 38, clears buffs |
| 0x40ed | Big Bang | HP, formula 2 | 250 | 1 | never rolls | 80 / 120 | all party, MP 40, breaks the 9,999 limit |

### 5.1 The action entry (m152.src:46-101) [H]

| # | Condition | Action | Chance / RNG | Source |
|---|---|---|---|---|
| 1 | the Big Bang flag is up | flag down; Big Bang on all party; the alternation does **not** advance | | 49-53 |
| 2 | else alternation flag = 0 | flag 1; `random() mod 4`: 0 Attack (poison), 1 Attack (poison and confuse), 2 Attack (itchy), 3 Attack (pierce), each on one living girl picked with **`searchr`** | 25% each, near-weighted target | 56-82 |
| 3 | else (alternation flag = 1) | flag 0; `random() mod 2`: 0 Attack (drain) on a `searchr` girl, 1 Genesis on all party | 50 / 50 | 83-98 |

**Reaction (m152.src:103-122):** reads the attacker's current command and its damage type; physical-only or magical-only
does nothing; **neither bit** sets the Big Bang flag. No guard, no HP check, so a miss, a status-only or a zero-damage result
counts too, as does any attacker. The flag waits for Paragon's next poll: Big Bang replaces whichever move was due, once,
however many results set the flag. **Which commands set it:** every command whose damage flags have neither the physical nor
the magical bit. Of the party's rows that can target an enemy, about 80 are of that kind, among them Darkness, Charon, Absorb,
Energy Blast, Bad Breath, 1000 Needles, Blaster, Zantetsu, Spare Change, Mix, Scan, Libra, Steal, Pilfer Gil, Pilfer HP,
Pilfer MP, Steal Will, Bribe, Eject, the dice and reels, the bombs and the Soul Spring family; attacks and every spell have a
bit and do not. **Death (132-146):** queues the Die command (0x403c) unless a global flag named for the Ultima Weapon
hand-over is 1; nothing in these scripts sets it [M].

**Targets.** Only the five single-target Attacks use `searchr` (near-weighted by distance and facing). Illustration only,
from the scene's start formation (boss at (25, 0); girls at (-71, 0), (-71, 21), (-71, -21), boss facing the party): weights
335 / 230 / 230 give about **42.3% / 28.9% / 28.8%** for Yuna, Rikku, Paine; positions change during play.

**Numbers:** Attack recovery 100 = 5,291 units (56 steps); the Itchy Attack 60 = 3,174 (34 steps); Genesis and Big Bang
recovery 80 = 4,232 (45), charge 120 = 6,349 (67). First poll after the start: 9.7 to 28.9 steps.

## 6. Oversoul Paragon (m152 worker 0 = `o152.src`; scenes stbv09_224, crcr00_114, crcr01_014)

**What it is.** After ten kills of the Weapon type the next Paragon is rebuilt from `monster2.bin` when its first recovery
ends (1.4): HP 210,000, MP 9,999, Lv 99, STR 244, DEF 88, MAG 244, **MDEF 89, AGI 244, ACC 95, LCK 16**, EVA 0, the
**Spellspring** automatic status, same immunities, EXP 13,000. It uses worker 0 for action, reaction and death.

| Row | Name | Class / formula | Power | Hits | Accuracy | Recovery / charge | Notes |
|---|---|---|---|---|---|---|---|
| 0x41da | Attack | HP, formula 0 | 16 | 1 | **formula 2: ACC 95**, fixed 5% crit | 100 / 0 | physical, **no status** |
| 0x4038 | Judgment | HP, formula 2 | 22 | 1 | never rolls | 40 / 120 | single target, breaks the 9,999 limit |
| 0x40ec / 0x40ed | Genesis / Big Bang | as 5 | 44 / 250 | 1 | never rolls | 80 / 120 | all party |
| 0x41c4 | Final Impact | HP and MP, formula 7 | 2 | **14** | never rolls | 100 / 120 | physical bit (Protect halves), 1/8 of max HP and MP per hit, random targets |
| 0x30ad/ae/af/b0 | Firaga, Blizzaga, Thundaga, Waterga | HP, formula 2 | 21 | 1 | never rolls | 0 / 70 | all party |
| 0x3171 / 0x3172 | Ultima / Holy | HP, formula 2 | 70 / 12 x8 | | never rolls | 0 / 100 | Ultima all party; Holy single |
| 0x317b | Osmose | MP, formula 9 | 6 | 1 | never rolls | 0 / 70 | single |
| 0x3082 | Demi | HP, formula 4 | 4 | 1 | never rolls | 0 / 80 | all party |
| 0x30b8 | Dispel | status | | | | 0 / 60 | all party |

### 6.1 Decisions of the action entry, in order (o152.src:79-272) [H]

The "answer state" is a variable the reaction sets (6.2): 0 nothing, 1 copy, 2 normal, 3 Demi. It starts at 0.

| # | Condition | Action | Chance | Source |
|---|---|---|---|---|
| 1 | HP / max HP (32-bit float) < 0.1 | HP row B below | | 87-91 |
| 2 | HP / max HP < 0.4 | HP row A below | | 92-95 |
| 3 | MP = 0 | MP-0 branch: `random() mod 2`: 0 Osmose, 1 Attack, each on a uniform living girl | 50 / 50 | 98-101,173-186 |
| 4 | answer state 0 | **idle branch**, 6.3 | | 102-105,130-143 |
| 5 | answer state 2 | state 0; Attack on a uniform living girl | | 106-108,123-128 |
| 6 | answer state 3 | Demi on all party; **state stays 3** | | 110-112,188-191 |
| 7 | state 1 and the remembered attacker slot is 255 | as row 5 | | 114-117 |
| 8 | state 1 otherwise | state 0; the remembered command at the remembered attacker's slot alone | | 118-121 |

Rows 1 and 2 come first and act on every poll, hit or not: below 40 percent HP the answer states are never reached. Float
comparison detail: the ratio is computed in 32-bit floats and tested strictly, so with 210,000 HP "below 10 percent" is HP of
20,999 or less and "below 40 percent" is 83,999 or less; exactly 21,000 or 84,000 is not below.

**HP row A (below 40 percent, o152.src:194-229):** a Reflect on any girl (any party member; the status is read over the
group) -> Dispel on all party; MP = 0 -> the MP-0 branch; else `random() mod 8`: 0 Firaga, 1 Thundaga, 2 Blizzaga, 3 Waterga
(each on all party), 4 to 7 Attack on a uniform living girl: **1/8 each spell, 1/2 Attack**.

**HP row B (below 10 percent, o152.src:231-272):** Reflect -> Dispel on all party; MP = 0 -> the MP-0 branch; **once per
fight** (a flag that is never cleared) Final Impact on all party (the macro also draws and discards one near-weighted target
search, one stream-4 draw when two or more girls live); afterwards `random() mod 5`: 0 Ultima (all), 1 Holy (uniform girl),
2 Judgment (uniform girl), 3 Genesis (all), 4 Big Bang (all): **1/5 each**. A Reflect up at that moment sends Dispel before
Final Impact, so the one-time cast waits for a poll with no Reflect and MP above 0.

### 6.2 The reaction entry (o152.src:275-354) [H]

On **every** result applied to it (1.2): the idle counter goes to 0 and a scratch value to 1000; then by the attacker.

| Attacker | Attacker's current command | State set | Source |
|---|---|---|---|
| Yuna, Rikku or Paine | one of the 11 heal and buff commands below | "Demi" (3) | 286-301 |
| Yuna, Rikku or Paine | one of the 32 magic commands below | "copy" (1): attacker slot and command remembered | 302-335 |
| Yuna, Rikku or Paine | anything else (Attack, abilities, items, Darkness, Charon, Scan...) | "normal" (2) | 339 |
| anyone else (a monster, Paragon itself, a pet) | | "normal" (2), attacker slot 255 | 341-344 |

- **Heal and buff list (11):** Cure, Cura, Curaga, Full-Cure, Regen, Esuna, Life, Full-Life, Shell, Protect, Reflect.
- **Copy list (32):** Fire, Fira, Firaga, Blizzard, Blizzara, Blizzaga, Thunder, Thundara, Thundaga, Water, Watera, Waterga,
  Flare, Ultima, Holy, Demi, Confuse, Silence, Sleep, Blind, Berserk, Bio, Break, Doom, Death, Drain, MP Absorb, Osmose, Dispel,
  Haste, Hastega, Supernova. Black Sky is not on it.

The answer is made on **Paragon's next poll** (rows 5 to 8 of 6.1), never at once. Only the **last** result before that poll counts.
A heal that targets a girl produces no result on Paragon, so only a heal or buff aimed **at Paragon** starts the Demi loop
(which then repeats every poll, with the two HP rows and the MP-0 branch still ahead of it, until another result lands on it).
A copied spell goes to the attacker alone, as a scripted command with no halving, at the party row's own cost 0 (Spellspring).
A copied drain (MP Absorb, Osmose, Drain) hands its transfer back to Paragon as a result of its own; the attacker is then
Paragon itself, so the reaction sets "normal" and a free Attack on a random girl follows [M, from the drain path in 1.2].

### 6.3 The idle branch and its clock (o152.src:130-171) [H]

State "nothing", HP at or above 40 percent, MP above 0: if the idle counter is **1200 or more** it goes to 0 and Paragon acts;
otherwise the counter gains 1, the call `wait(1)` returns at once, and the poll ends without a command. So the action comes on the
**1201st** consecutive idle poll. When it acts: Reflect on any girl -> Dispel on all party; else `random() mod 3`: 0 Judgment
(uniform girl), 1 Genesis (all), 2 Big Bang (all). The counter is reset by the reaction (any result, 6.2) and the answer polls do
not add to it. Polls come once per step while the ATB clock runs (1.1): **1200 steps = 40.04 s of running clock at the
measured 29.97 steps a second**; every Wait-mode submenu adds to the real time, while a party action's animation did not
stop the clock for the commands measured (a girl's Attack and Fire, four monster casts). (Corrected by the 2026-10-09
measurement, which replaces "40 s at 30/s, 20 s at 60/s" and "every party action that executes adds to the real time":
[re-ffx2-timing-measured.md](re-ffx2-timing-measured.md) sections 3 and 7.) The community dump's "20 seconds" is 1200 frames
at 60 a second; the running game does not step at 60 a second.

### 6.4 The named estimates of `OVERSOUL_ESTIMATES`, answered from the files

| Estimate (`ai/paragon-oversoul.ts`) | Ours | The files |
|---|---|---|
| `physicalHitPercent` (:47) | flat 50 | the formula-2 race of row 0x41da: base ACC 95 plus LCK 16 against the girl's Luck, Evasion and stage terms (no fixed rate) |
| `idleSeconds` (:53) | 20 s | 1200 idle polls, the 1201st acts; 40.04 s of running clock at the measured 29.97 steps a second (corrected by the 2026-10-09 measurement; it read "40 s at 30/s, 20 s at 60/s"); reset by any result (6.3) |
| `magicBelow` (:59) | 4/10 | strict float test of HP / max HP < 0.4, acting on every poll (6.1) |
| `finalBelow` (:60) | 1/10 | strict float test < 0.1 |
| `finalImpactHits` (:62) | 14 | 14 |
| `finalImpactReducible` (:64) | false | true: the row has the physical bit, so Protect halves it |
| `agaOnAll` (:66) | true | true, and no all-targets halving |
| `attackItchy` (:68) | true | false: the row has no status |
| `answerTiming` (:74) | immediate | next poll |
| `attackBWakesOn` (:80) | any party cast | only a heal or buff that lands on Paragon |
| `lowHpActsEveryTurn` (:89) | false | true |
| `thinkingPeriod` (:91) | 0 | the byte is never read; same |

Not named in the estimates but also fixed by the files: the copy and heal lists (6.2), the Normal-Attack answer at a random girl
(6.2), the MP-0 branch (6.1), Final Impact's place after the Reflect and MP rows (6.1), and that the Oversoul switch is not a
turn (1.4).

## 7. Trema (m295 story, scene stbv09_229; m328 arena, scenes crcr01_036 and zzzz03_28)

Record (both): HP 999,999, MP 999, Lv 99, STR, DEF, MAG, MDEF 255, AGI 128, ACC 95, **EVA 99**, LCK 26, **Spellspring**
automatic status, immune to the usual ailments, Slow, Stop, Doom, the Breaks and Gravity. Init (`m295.src:22-29`): cannot be
raised (the arena version fades out instead). No generic block, no timer, no reaction, no death code. Story EXP 10,000, AP 50; arena EXP 2,000, AP 1.

| Row | Name | Class / formula | Power | Hits | Accuracy | Recovery / charge | Notes |
|---|---|---|---|---|---|---|---|
| 0x40d1 | Dying Star | HP, formula 0 | 3 | 3 | never rolls | 0 / 0 | physical, crit 20 |
| 0x40d2 | Falling Leaf | HP, formula 0 | 1 | 3 | never rolls | 0 / 0 | |
| 0x40d3 | Thundering Wave | HP, formula 0 | 4 | 3 | never rolls | **120** / 0 | |
| 0x40d4 | Beguiling Mire | HP, formula 0 | **5** | 3 | **formula 1, base 95** | 80 / 0 | Stop chance 120 |
| 0x40d5 | Waning Moon | MP, formula 4 | 5 | 3 | **formula 1, base 120** | 80 / 0 | 5/16 of current MP per hit |
| 0x40d6 | Choking Mist | HP, formula 0 | 4 | 3 | **formula 1, base 100** | 80 / 0 | Poison always |
| 0x3170 | Flare | HP, formula 2 | 55 | 1 | never rolls | 0 / 100 | single, MP 54 |
| 0x3082 | Demi | HP, formula 4 | 4 | 1 | never rolls | 0 / 80 | all party |
| 0x3171 | Ultima | HP, formula 2 | 70 | 1 | never rolls | 0 / 100 | all party, MP 90 |
| 0x4128 | Meteor | HP, formula 7 | 2 | **12** | never rolls | 100 / 120 | random targets, magical bit, 1/8 of max HP per hit |

### 7.1 The action entry (m295.src:35-132) [H]

| # | Condition | Action | Chance | Source |
|---|---|---|---|---|
| 1 | HP < max/6 (integer division: 166,666) and the Ultima flag = 0 | flag 1; Ultima on all party; end | | 37-51 |
| 2 | HP < max/4 (249,999) and the Meteor counter <= 1 | counter 2; Meteor on all party; end | | 53-67 |
| 3 | HP < max/2 (499,999) and the Meteor counter = 0 | counter 1; Meteor on all party; end | | 69-83 |
| 4 | else `random() mod 2` = 0 | **three commands in this one poll**, each with its own uniform target: Dying Star, Falling Leaf, Thundering Wave | 12/24 | 85-94 |
| 5 | else `random() mod 2` = 0, then a uniform girl, then `random() mod 3`: 0 Waning Moon, 1 Beguiling Mire, 2 Choking Mist | | 2/24 each | 97-116 |
| 6 | else `random() mod 3` = 0 | Flare on a uniform girl | 2/24 | 119-123 |
| 7 | else | Demi on all party | **4/24** | 124-128 |

All strict "below" tests on the current HP. The flags start at 0, are never cleared, and the order matters:

- HP can pass several thresholds between two polls. At 249,998 or less with nothing cast yet the quarter branch sets the Meteor
  counter to 2, so **one** Meteor is cast and the half-HP Meteor is skipped for good.
- At 166,665 or less the Ultima comes first, then the Meteor (if the counter allows), then the normal rows.
- A trigger does not interrupt the chain: the three links are queued together, each trigger waits for the next poll, which
  comes after the Thundering Wave's recovery.

Nothing in the script reads MP. With Spellspring the costs are 0, so draining his MP changes nothing [M for the status
reaching the effective word]. Trema has no reaction: nothing he does depends on what the party does apart from HP.
After the chain Trema recovers for 120 = 9,302 units (98 steps); after the three-hit fists 80 = 6,201 (66 steps). First poll
after the start: 14.3 to 42.4 steps. **Versions:** the compiled story and arena scripts have identical decision code; the
files hold one row for each move (Beguiling Mire power 5 in both).

## 8. Cadence reference (units from the rows; steps at Normal speed, no charge halving, rounded up)

Recovery = `cost_atb x 10000 / (AGI+1)`, charge = `cost_cast x 10000 / (AGI+1)`; 95 units per step, for a charge as well as
a recovery (a charge is not halved in play, 1.7). Only the moves these actors use. Thinking after each command is only the
30 steps per fallen girl (1.6). Steps are the units divided by 95 and **rounded up**, because the game's counter has to
reach 0 or less (corrected by the 2026-10-09 measurement: the first draft rounded to the nearest step and printed, for
example, 33 for the 3,174 units of the Itchy Attack, which take 34).

| Actor (AGI) | Move | Charge units (steps) | Recovery units (steps) |
|---|---|---|---|
| Shiva (124) | Attack | 0 | 8,000 (85) |
| | Chain Attack | 0 | 0 |
| | Blizzaga | 5,600 (59) | 0 |
| | Heavenly Strike | 8,000 (85) | 6,400 (68) |
| | Diamond Dust | 9,600 (102) | 16,000 (169) |
| Anima (133) | Anima Attack | 0 | 7,462 (79) |
| | Pain | 7,462 (79) | 5,970 (63) |
| | Oblivion | 14,925 (158) | 14,925 (158) |
| Cindy (72) | Guard / White Highwind | 16,438 (174) | 10,958 (116) |
| | Absorb | 13,698 (145) | 5,479 (58) |
| | Demi | 10,958 (116) | 0 |
| | Regen | 8,219 (87) | 0 |
| | Camisade | 0 | 0 |
| | Delta Attack | 0 | 27,397 (289) |
| Sandy (83) | Attack | 0 | 11,904 (126) |
| | Razzia | 0 | 0 |
| Mindy (89) | Firaga, Blizzaga, Thundaga, Waterga | 7,777 (82) | 0 |
| | Passado | 0 | 0 |
| Paragon (188) | Attack | 0 | 5,291 (56) |
| | Itchy Attack | 0 | 3,174 (34) |
| | Genesis, Big Bang | 6,349 (67) | 4,232 (45) |
| Oversoul (244) | Attack | 0 | 4,081 (43) |
| | Judgment | 4,897 (52) | 1,632 (18) |
| | Genesis, Big Bang | 4,897 (52) | 3,265 (35) |
| | Final Impact | 4,897 (52) | 4,081 (43) |
| | -aga spells, Osmose | 2,857 (31) | 0 |
| | Demi | 3,265 (35) | 0 |
| | Ultima, Holy | 4,081 (43) | 0 |
| | Dispel | 2,448 (26) | 0 |
| Trema (128) | Dying Star, Falling Leaf | 0 | 0 |
| | Thundering Wave | 0 | 9,302 (98) |
| | Waning Moon, Beguiling Mire, Choking Mist | 0 | 6,201 (66) |
| | Flare, Ultima | 7,751 (82) | 0 |
| | Demi | 6,201 (66) | 0 |
| | Meteor | 9,302 (98) | 7,751 (82) |

## 9. Open items, and what could not be decoded

- **Logic rate**: settled, 29.97 steps a second (60 / 1.001 / 2), measured on the running game on 2026-10-09; the earlier
  [L] entry ("30 or 60 steps per second; every seconds figure carries both") is closed, and every seconds figure above is
  at that rate ([re-ffx2-timing-measured.md](re-ffx2-timing-measured.md) section 3).
- **Battle-local variables start at 0** [M]: allocation not traced (1.3).
- **Command queue consumer** [M]: that the three Trema links start back to back and what separates them was read from the ring
  and its processor but not run.
- **Drain transfers as reactions** [M]: Absorb, Osmose and the drain Attack deliver the drain to the user through the pending
  result list; the consumer was followed to the applier but not run.
- **Whether the Oversoul transformation holds the ATB while it plays** [L]: it is not an AI poll, but the effect call is made
  at the end of the first recovery and its duration was not read.
- **Spellspring reaching the effective status word** [M]: the record word is stored in the battle character; the check that
  zeroes costs reads the effective word.
- **Cost check for monsters** [M]: read at the end of a charge (all actors); the no-charge path checks only party-issued
  commands as far as the start routine shows.
- **The death hand-over flag in Paragon's death entry** [M]: a global named for the Ultima/Omega fights; not set here.
- **Positions and facing** for Paragon's near-weighted picks: only the start formation was used.
- **Animation and effect hit areas** (the arcs of Genesis and Big Bang, Oblivion's 16 hits across the party) belong to
  effect data and were not read.
- Voice lines, camera work and message text were not extracted.

## 10. Differences from our AI

Row key: *game* = this note; *ours* = file:line in `src/battle/ffx2/` (paths below that start with `ai/` are in
`src/battle/ffx2/ai/`; `data/` is `src/data/ffx2/enemies/`). The research files whose claims these rows correct are
`research/ffx2-fallen-aeons.md` (sections 4.1 to 4.3) and `research/ffx2-trema.md` (sections 4.1, 4.2, 12.2).

| # | Rule | Game (source) | Ours | Effect |
|---|---|---|---|---|
| F1 | Shiva's Triple Attack | three consecutive polls of Chain Attack (power 12, no recovery), each with its own uniform target; the follow-ups add no gauge and skip the Diamond Dust test (m167.src:86-99) | one ability `x2-shiva-triple-attack` with no target, decided like any other move (`ai/fallen-aeons.ts:91-94`) | target spread, a gauge checked once per chain, and Diamond Dust cannot be postponed by a chain in ours |
| F2 | Which table the gauge picks | tested after adding 3: late table from a pre-add gauge of 62 (m167.src:109-111) | tested before adding: late table from 65 (`ai/fallen-aeons.ts:88,93`) | the late table starts one poll earlier in the game on the plain +3 path |
| F3 | What raises the counter | every result applied to the actor, per strike, including misses, status-only and zero-damage results, from anyone but herself, while the guard holds (m167.src:160-167, m169.src:119-126) | once per enemy per party action, hostile events only (`ai/fallen-aeons.ts:47-56`, `engineHooks.ts:165-188`) | a multi-hit command is +5 per strike in the game, +5 once in ours |
| M1 | Who casts Delta Attack, and when | only Cindy, on her first poll with gauge >= 100 and both Mindy's and Sandy's flags up; the flags drop only by the cast or that sister's death (m171.src:86-101, m172.src:92-95, m173.src:92-95) | whichever living sister polls first with all three gauges >= 100 (`ai/magus-sisters.ts:91-94`) | the cast waits for Cindy's poll (AGI 72), the slowest of the three |
| M2 | Delta Attack reset | Cindy's gauge 0 at once; the other two at their next poll or reaction, then +5 (m172.src:84-88, m173.src:84-88) | all three to 0 at once (`ai/magus-sisters.ts:92`) | Mindy and Sandy start the next count at 5 |
| M3 | Sandy's odds | Razzia 1/3, Attack 2/3 (m172.src:97-107) | 3/4 Attack, 1/4 Razzia (`ai/magus-sisters.ts:56`) | Razzia 33 percent against 25 |
| M4 | Cindy's odds | Camisade 2/5; Absorb, Demi, Regen 1/5 each (m171.src:126-147) | 1/4 each (`ai/magus-sisters.ts:75-82`) | Camisade 40 percent against 25 |
| M5 | White Highwind | certain on a non-Guard poll when Cindy's, Sandy's and Mindy's HP are each below their max/4; a fallen sister counts as below; no "alive" test (m171.src:114-124) | needs all three alive and each below a quarter (`ai/magus-sisters.ts:71-74`) | with both others down the game's Cindy heals herself on every poll while under a quarter |
| M6 | What raises a sister's gauge | +5 per own poll, +5 per result of any kind, allies' casts included (Guard, Regen, White Highwind), Regen ticks and drains (m172.src:111-126, m173.src:125-140, m171.src:152-156) | own turn, party-hostile actions once, Regen ticks, Cindy's Absorb (`ai/magus-sisters.ts:78,97,108-111`) | Cindy's Guard alone gives +5 to each of the three every eighth action in the game; nothing in ours |
| M7 | Regen's length | counter 50, about 790 steps, four ticks (rows 0x4086, 0x30b6) | lasts until cured or dispelled (`data/magus-sisters-abilities.ts:130,146`) | in ours a sister regenerates, and gains +5 per tick, for the whole fight |
| M8 | Thinking byte 30 | never read (1.6) | unset (`data/magus-sisters.ts:14-16`) | same behaviour, no action |
| A1 | Anima | same shape as ours; counter per F3 | `ai/fallen-aeons.ts:111-130` | F3 only |
| P1 | When Big Bang answers | on Paragon's **next poll**, replacing the move that was due, once however many results set the flag (m152.src:49-53) | at once, out of turn, as a counter (`ai/paragon.ts:70-74`, `engineHooks.ts:278-295`) | in the game Big Bang never lands between two of its moves |
| P2 | What sets it | any result (hit, miss, status-only, zero damage) from a command with neither damage bit: Darkness, Charon, Scan, Libra, Steal, the Pilfers, Mix, items, Spare Change... (m152.src:103-122; about 80 party rows) | only a damaging or MP-taking hit of the engine class `'none'` (`ai/paragon.ts:71`) | Scan, Libra, Steal and a miss of any such command trigger it in the game, not in ours |
| P3 | Single-target picks | near-weighted by distance and facing, the central girl favoured (m152.src:60-81,86-97) | uniform (`ai/paragon.ts:39-42,60,68`) | about 42 / 29 / 29 percent at the start formation instead of a third each |
| P4 | Which Attack is which | case 1 poison and confuse, case 2 itchy (m152.src:62-81) | index 1 itchy, index 2 confuse (`ai/paragon.ts:32-37`) | same odds; the Itchy Attack recovers in 60 against 100 |
| P5 | The MP gate | none in the script; a Genesis or Big Bang started with MP below 38 or 40 fails when its charge ends (1.5) | blocks Genesis and the counter at 0 MP (`ai/paragon.ts:49-51,64-67,72`) | a failed cast spends its charge in the game and passes the turn in ours |
| P6 | Stats | MDEF 89, ACC 95 (monster.bin) | MDEF 88, ACC 0 (`data/paragon.ts:50,54`) | no effect on the normal form (its attacks never roll) |
| O1 | Physical miss rate | the ordinary race: threshold = 16 + 95 - girl's Luck - Evasion + stage terms, roll 0 to 100 (row 0x41da, formula 2); the Oversoul block has ACC 95, LCK 16 | flat 50 percent (`ai/paragon-oversoul.ts:47`); ACC 0 in the data (`data/paragon-oversoul.ts:167`) | high-Luck girls dodge far more than half; low-Luck girls far less |
| O2 | The idle limit | 1200 idle polls (the 1201st acts), counted only in idle polls, reset by any result | 20 s of engine ticks (60,000 at `TICK_RATE_BASE` 3,000) since the last result or answer (`ai/paragon-oversoul.ts:53,214`; `constants.ts:16`) | the game's 1200 steps are 114,000 ATB units at Normal speed: 38 s on our 3,000-a-second scale, and 40.04 s of real time at the measured 29.97 steps a second (2,847 units a second): about 1.9 times ours on the engine's scale and 2.0 in real seconds (corrected by the 2026-10-09 measurement; it compared 2,850 a second "if it runs 30 steps a second") |
| O3 | HP thresholds | strict float tests: < 0.4 and < 0.1 of max HP (o152.src:87-95) | `<` on the same fractions (`ai/paragon-oversoul.ts:59-60,212`) | the same, checked at 84,000 and 21,000 |
| O4 | Acting at low HP | every poll, hit or not (o152.src:87-95,194-272) | waits to be hit; `lowHpActsEveryTurn` false (`ai/paragon-oversoul.ts:89,212-213`) | the HP rows are the main behaviour below 40 percent |
| O5 | Final Impact | 14 hits, never rolls, random targets, once per fight, after the Reflect and MP rows, physical bit so Protect halves, 1/8 of max HP and MP (row 0x41c4; o152.src:243) | 14 hits, once, not reducible (`ai/paragon-oversoul.ts:62-64,186-189`) | `finalImpactReducible` should be true |
| O6 | When the answer comes | next poll (o152.src:79-121) | immediate (`ai/paragon-oversoul.ts:74`) | answers never land out of turn |
| O7 | Which results count | any result on it: misses, status-only, its own drain results, a spell it reflected (o152.src:275-354) | party actions aimed at it (`engineHooks.ts:213-232`) | its own drains and bounced spells are missing |
| O8 | What starts the Demi loop | a heal or buff landing **on Paragon**; Life and Full-Life included (o152.src:286-301) | any party heal or buff cast anywhere (`ai/paragon-oversoul.ts:80,224-229`); list without Life and Full-Life (`:100-103`) | `attackBWakesOn` should be `'aimed-at-paragon'` |
| O9 | The copy list | 32 commands (6.2) | Black Magic category plus arcana, MP Absorb, Dispel, Haste, Hastega, Holy, Supernova (`ai/paragon-oversoul.ts:94-99,106-111`) | Osmose, Blind, Sleep (`x2-shared-osmose/-blind/-sleep`) and Berserk (`x2-berserker-berserk`) are copied in the game and answered with a Normal Attack in ours; Silence (row 0x3179) has no counterpart I found |
| O10 | The Normal-Attack answer | a **uniform random girl**, not the attacker (o152.src:123-128) | at the attacker (`ai/paragon-oversoul.ts:128-144`) | the hitter is not singled out |
| O11 | Attack status | none (row 0x41da) | Itchy (`ai/paragon-oversoul.ts:68`) | `attackItchy` should be false |
| O12 | MP 0 | `random() mod 2`: Osmose or Attack every poll, ahead of the answer rows (o152.src:98-101,173-186) | no such branch | Osmose is its refill |
| O13 | -aga spells | on all party, no all-targets halving (1.1) | all party (`ai/paragon-oversoul.ts:66`) | same |
| O14 | The first turn | no AI turn is spent on the Oversoul switch (1.4) | the first decision returns nothing (`ai/paragon-oversoul.ts:200-205`) | one wasted turn in ours |
| O15 | Thinking period | unused (1.6) | 0 | same |
| T1 | Story Trema's odds | Demi 4/24, Flare 2/24, Mist, Mire, Moon 2/24 each, chain 12/24 (m295.src:85-128; the compiled story script equals the arena script) | story table Demi 3/24, Flare 3/24 (`ai/trema.ts:77`); the arena table is right (`:84`) | the story Demi is 1/8 in ours, 1/6 in the game |
| T2 | Trigger order | Ultima first, then the quarter Meteor (which also swallows a skipped half Meteor), then the half Meteor (m295.src:37-83) | fixed order half, quarter, Ultima, one per turn (`ai/trema.ts:34-38,93-101`) | two Meteors in ours where the game casts one when HP falls past both thresholds between polls |
| T3 | The chain | three commands queued in one poll, targets rolled then, no trigger can fall inside (m295.src:85-94) | one link per turn, triggers checked between links (`ai/trema.ts:93-111`) | a due trigger splits the chain in ours |
| T4 | MP gate | none (Spellspring zeroes the costs; the script never reads MP) | a rolled spell he cannot afford fails (`ai/trema.ts:50-60`) | draining his MP stops spells in ours only |
| T5 | Story Beguiling Mire | power 5 (one row, 0x40d4) | power 4 for the story version (`data/trema-abilities.ts:98`) | data, 20 percent less damage |
| G1 | Generic "battle too long" block | present in Shiva, Anima and the Sisters but never runs; absent in Paragon and Trema | none | same behaviour, no action |

## 11. FINDINGS B1 (D:\Tools\rea\FINDINGS.md), line by line

| B1 statement | Verdict | Detail |
|---|---|---|
| The AI is plain text in the archive (o152.src, m152.src, m295.src, m328.src). | **Confirmed.** | All four match their compiled packages; `o152` is worker 0 and `m152` worker 1 of the Paragon package, entries 0x45 and 0x44; `m295` and `m328` decide identically. |
| HP thresholds 0.1 and 0.4 are tested first, every poll. | **Confirmed.** | Float32 ratio, strict: with 210,000 HP the tests are 20,999 and 83,999 or less. A Reflect-on-any-girl Dispel and the MP-0 branch come before the pools inside each HP row. |
| Below 40% it acts every turn without waiting to be hit, so `lowHpActsEveryTurn` should be true. | **Confirmed.** | Rows 1 and 2 run before the answer state is read, and the idle branch is only reached above 40 percent. |
| The idle limit is 1200 AI polls. | **Confirmed, refined.** | The counter is tested before it is incremented, so the 1201st idle poll acts. Only idle polls count; a result of any kind (hit, miss, status, its own drain) resets it. |
| At 30 polls per second that is 40 s; SinirothX's 20 s would need 60 polls per second; the wiki's 2.5 minutes has no support. | **Confirmed; the rate is measured (29.97 a second).** | A poll is one logic step of a running ATB clock, and `wait(1)` is a no-op in this build, so no hidden stretching. 1,200 polls are 40.04 s at the measured 29.97 steps a second; 20 s is exactly 1200 frames at 60 a second, which the running game does not step at. 2.5 minutes would need about 4,500 steps and is not in the script. (Corrected by the 2026-10-09 measurement; this row read "rate still open" and gave "4,500 steps at 30/s".) |
| The reaction block only records the party's last action; the answer is issued on its next ready poll (`answerTiming: 'next-turn'`). | **Confirmed.** | Also for normal Paragon's Big Bang, which replaces the move due on the next poll. |
| The "Attack b" answer is Demi (0x3082) on all girls, repeated until she does something else. | **Confirmed, refined.** | The list is 11 commands (Cure, Cura, Curaga, Full-Cure, Regen, Esuna, Life, Full-Life, Shell, Protect, Reflect), only those that land **on Paragon** count, and the Demi repeats every poll until another result lands on Paragon (any command). |
| Final Impact is 14 hits, never rolls to hit, picks random targets. | **Confirmed.** | Row 0x41c4: 14 hits, no accuracy roll, random-target flag, 1/8 of max HP and MP, **physical bit (Protect halves)**, cast once per fight. |
| Drop the flat 50% physical miss rate. | **Confirmed.** | Row 0x41da uses formula 2 with the actor's ACC byte; the Oversoul block's ACC is 95 and Luck 16. The research file's "Accuracy 0" (from the community dump) disagrees with the record; its Luck 16 agrees. |
| Trema's three attacks use their own accuracy bytes: 95, 120 and 100. | **Confirmed, named.** | Beguiling Mire 95, Waning Moon 120, Choking Mist 100; the fists, Meteor, Flare, Ultima and Demi never roll. |
| B2: enemy ACC is 95 for nearly everything and 107 to 121 for the Fallen Aeons. | **Confirmed for 95; the 107 to 121 are the arena aeons.** | Shiva, Anima, the Sisters, Paragon, the Oversoul block and Trema are all 95; the records at 107 to 121 are the arena Valefor, Ifrit, Ixion and Bahamut (m363 to m366). |
| B3: the 0.5 all-target factor needs an action byte at +0x27; what sets it was not found; the Oversoul's borrowed girl spells may be halved. | **Answered: not halved.** | A scripted command is queued with that byte at 0, so no boss ability, borrowed or not, is halved (1.1). |
