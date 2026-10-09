# FFX boss AI read from the game's own scripts: Yunalesca, Braska's Final Aeon, the Yu Pagodas, the possessed aeons, the Magus Sisters and Yu Yevon

**Game case: FFX only.** None of these fights exists in FFX-2; its bosses are scripted in its own files and get their own
notes. Part of the `re-parity` track ([docs/plans/re-parity.md](../docs/plans/re-parity.md)). Drafted 2026-10-08. Records
only: no engine or AI code was changed.

**Source note (applies to every statement below unless a line says otherwise):** FFX.exe and FFX_Data.vbf, Steam build
25501027 (FFX.exe SHA-256 0537B2A1...686D, the HD Remaster's 32-bit executable, image base 0x00400000). The scripts are
the compiled "Atel" programs inside the archive: one file per monster (`battle/mon/_mNNN/mNNN.bin`, chunk 0 the program,
chunk 1 the table that says which program function answers which engine event, chunk 2 the stat record), one file per
battle (`battle/btl/<place>/<place>.bin`) and one per area event (`event/obj/si/sins0600`, `sins0700`, `do/dome0600`),
all read from the live archive on E: (the 36 monster and battle files used and the kernel tables match the earlier lane's
extraction byte for byte). The engine functions that
run the scripts were read in Ghidra 12.1.4 (decompiler and bytes). Everything is written in our own words: no script
text, no dialogue and no decompiled code is reproduced here. Ability names are the game's own data names.

**How this was checked.** (1) Every rule was read from the disassembly and then re-read against a raw opcode dump of the
same bytes, because the disassembler prints jump targets without their pending stack pushes (this mattered once: the
shared join point that adds 1 to Yunalesca's cycle counter). (2) Every AI hook below was then *executed* in a small
private interpreter (not in the repo) against a mock party, with the game's real battle-RNG constants, and the tallies
matched the tables: for example the Form II heal rate with one Zombie came out 40.31% against 40.03% worked out by hand,
the Pagoda Curse split 69.18% and 29.24% against 68.97% and 28.98%. The mock proves the control flow, not the engine;
everything the engine does around the script is from the engine reads in §1.

**Notation.** `mNNN` is the monster file; `fK` is the function the file's table binds to an engine event; `@0xHHHH` is
a code offset inside that monster's program. "Front line" means every non-monster actor currently in battle, aeons
included. `v1, v2, ...` are the script's own variable slots (numbered as the file declares them); `bv0x..` is a *battle
variable*, shared by every actor in one battle. Confidence tags: **[run]** read and executed in the mock (monster programs);
**[read]** read from the disassembly and a raw opcode dump but not executed (battle and event files); **[eng]** read in the
executable; **[inf]** an inference that the sources do not state.

## 1. What the scripts rely on (engine facts, read in FFX.exe)

**1.1 The events a monster program answers** (slot numbers are the order of the file's function table; the engine raises
them through `pp_BtlActionRequest` 0x007aceb0, whose third argument is the slot) [eng]:

| Slot | Name | Raised by | When |
|---|---|---|---|
| 0 | onTurn | action executor 0x00792210 | the monster's own turn; the program queues up to four sub-actions |
| 1 | preTurn | turn start 0x00792a90 | before the turn proper |
| 2 | onTargeted | `FUN_007ad0c0` from the executor | at the start of each sub-action, once per target in its mask; apparently skipped for a target that already has a reaction queued (`FUN_007b0720`, read; its role is inferred) |
| 3 | onHit | `pp_BtlApplyHitRecords` 0x0078f060 | **once per target per sub-action, after the last hit record has been applied**, whether the hits damaged, missed, healed or only touched statuses (read in the code, not observed in play); it runs **before** the death check |
| 4 | onDeath | `pp_BtlDamageCheckDeath` 0x0078c740 | after the death check has found HP < 1 |
| 5 / 7 | onMove / postMove | move code | cosmetic here |
| 6 | postTurn | `pp_BtlActionDone` 0x007b20e0 | after the action |
| 8 | postPoison | `pp_BtlPoisonTick` 0x007afab0 | after a Poison tick |

Two consequences used all through this note. First, a script can refill HP inside onHit and the monster simply does not
die, because `pp_BtlDamageCheckDeath` decides death by "HP < 1" only afterwards (it is what Yunalesca's forms and the
Braska's Final Aeon transformation do). Second, "hit event" in these scripts means "action" (per target), not "hit": a
12-hit move is one event. A Doublecast is two sub-actions of one turn and therefore, on the reading of the executor, two
events; that was **not** run through the engine (§7).

**1.2 Random sources** [eng, run]:

- `GetRandomValue` (call 0xA9, stub at 0x00857680) is `battle RNG stream 2, & 0xFFFF`. Every script and actor shares
  stream 2. The programs then apply `mod 100`, `mod 3`, `mod 5`, `mod 2` or `mod 10` themselves. Because 65,536 is not a
  multiple of those numbers the odds are very slightly off the round figures; exact values are given where a rule uses
  them (`mod 100`: residues 0 to 35 occur 656 times, 36 to 99 occur 655 times).
- `findMatchingChr` (call 0x7010, handler 0x007a5af0 over `pp_BtlPickTarget` 0x007acd40) draws from **stream 4**, and only
  when more than one candidate remains: it takes `value mod count` and picks that many steps along the candidates in
  ascending actor id. With one candidate there is no draw; with none it returns 255.
- `GetRandomInRange` (0xA6) is also stream 2. The battle-script random op (`camRand`, streams 14 and 15) appears in these
  fights only inside camera code, never in an AI function.

**1.3 What `findMatchingChr(group, property, value, selector)` does** [eng, run]: the group (a spec, §1.4) is first cut
down to actors that are **alive** (property 4), then to actors that are **targetable** (property 0x52); then the
property is tested per actor: selector "Any/All" (0) keeps every actor whose property is non-zero, "Not" (bit 0x80) keeps
those whose property is zero, "Highest" (1) and "Lowest" (2) keep the actors with the extreme value, **ties all kept**.
The `value` argument is never used. Among the survivors the stream-4 pick above chooses one. So
`findMatchingChr(front line, isAlive, 0, Any)` is a uniform pick among living, targetable front-line actors.

**1.4 Actor specs** (`FUN_00794330`) [eng]: -14 front line (non-monster, in battle, not escaped); -15 monsters in battle;
-13 the script's own actor; -17 the last attacker (the actor recorded in Chr+0xDED by the last hit it took); -16 the
script's *matching group* (a mask built with `initializeMatchingGroupTo`, `addToMatchingGroup`,
`removeFromMatchingGroup`); -20 aeons in battle; -24 every non-monster, non-aeon actor whether or not it is in battle;
-6 -7 -8 the party slots Character #1 to #3, -9 to -12 the four reserves; a small number is that actor id (party 0 to 7,
aeons 8 to 17, monsters 20 and up, in formation order); a value 0x1000 + n selects the monster with index n. A group
target in `performCommand` hits **everyone in the mask** whatever the command's own single/multi flag says.

**1.5 Property reads** [eng]: `readBtlChrProperty(spec, property)` returns the **average** over the selected actors for
HP, MP, max HP, max MP, the stat bytes and the Overdrive bytes, and the **sum** for flags, status counters and
`LastDamageTakenHP`. Property 232 is the CTB counter. **Property 174 is mislabelled "Visible" in the public parser: the
write handler stores the value xor 1 into the actor's show flag, so 1 means hidden and 0 means shown.** Property 82 is
Targetable, 83 "visible on the CTB bar", 19 the current Overdrive gauge, 59 First Strike, 334 Permanent Auto-Life.

**1.6 `LastDamageTakenHP`** (property 166, Chr+0xD34) [eng]: zeroed at the start of each per-target calculation
(`pp_BtlCalcTarget`) and then **increased by every hit's HP result after the 9,999 cap (99,999 with Break Damage Limit)
but before the result is clamped to the target's remaining HP** (`pp_BtlCalcHit`, the store at the end of its per-class
loop). So it is the action's total damage *including overkill*, and negative for healing.

**1.7 Queueing** [eng]: `performCommand(spec, command)` queues a sub-action only if the actor passes the can-act test
(`pp_BtlCanAct` 0x007b24a0: not petrified, Confuse, Berserk, asleep, Eject, and not Provoked unless the actor keeps
control when provoked, not Threatened); `forcePerformCommand` skips that test. Calls made from onHit become reaction
actions (counters). A program may queue up to four sub-actions in one call.

**1.8 Battle ids** (`CurrentBattle()`, scene number in the high half): Yunalesca `dome06_00` 0x02090000; Braska's Final
Aeon `sins06_00` 0x024A0000; the possession battles `sins07_00` to `sins07_06` 0x024B0000 to 0x024B0006 (aeon actor id 8
to 14), the Magus Sisters `sins07_07` 0x024B0007, Yu Yevon `sins07_10` 0x024B000A.

## 2. Yunalesca (m130, `dome06_00`)

**2.1 Record.** One monster record serves all three forms. HP 132,000, MP 500, STR 20, DEF 50, MAG 30, MDF 50, AGI 40,
LCK 20, EVA 0, ACC 0; overkill threshold 10,000; no elemental affinities. Status resistance byte 255 (immune) for Death,
Zombie, Petrify, Poison, the four Breaks, Confuse, Berserk, Provoke, Sleep, Silence, Darkness and Slow; Threaten lands 25% of the time (that byte is a success rate, not a resistance);
Shell, Protect, Reflect, the four Nul statuses, Regen and Haste 0 (they land). Immune to fractional damage, Life, CTB
damage, Slice and Bribe, and to the extra statuses Distill (all four kinds), Eject, Auto-Life and Doom. Poison 25%; Doom
counter 99. Record commands: Metamorphosis (0x607E, 0x607F), Hellbiter (0x6080), Mind Blast (0x6081), Mega Death (0x6082).

**2.2 Battle setup.** `dome06_00` forces a Normal start and disables Escape and Flee for party members 0 to 6. The
monster's init (f0, @0x0185 to @0x0201): HP pool P = max HP; v7 := P x 4 / 11 (**48,000**, form II); v8 := P x 5 / 11
(**60,000**, form III); max HP := P x 2 / 11 and HP := that (**24,000**, form I); the battle variable bv0x4 (v0, the form
counter) := 0; six commands are added to her list: Hellbiter (0x60D1, the same record as 0x6080), Absorb (0x606D), Dispelling
Slap (0x607C), Cura, Curaga and Regen. All other variables start at 0 (the program never sets them; **[inf]**, assumed
zero-initialised private memory).

**2.3 Variables.** v0 (bv0x4) forms done; v1 current form (0 to 2); v2 cycle counter; v3 aeon sub-cycle; v4 the target
chosen on her last turn; v5 the last attacker; v6 the chosen command; v7, v8 the stored HP of forms II and III; v9 the
command that hit her; v10 its damage type; v11 aeon flag; v12 pending transformation (0, 1 or 2); v13 zombie weight.

**2.4 Turn order of decisions** (f2 onTurn @0x0209) [run]:

1. v12 = 1: forced Metamorphosis (0x607E) on herself, then Hellbiter (0x60D1) on the whole front line; v12 := 0
   (@0x0210). Two sub-actions in one turn.
2. v12 = 2: forced Metamorphosis (0x607F), then Mega Death on the whole front line; v12 := 0 (@0x024B).
3. v11 := 255 if at least one aeon is in battle, else 0 (@0x0288).
4. Branch on the form v1.

**2.5 Form I (v1 = 0), @0x02A8.** Strict alternation on v2, no aeon branch:

| v2 | Action | Target | Then |
|---|---|---|---|
| 0 | Dispelling Slap | random living, targetable front-line actor (stream 4 if two or more) | v2 := 1 |
| 1 | Absorb | the front-line actor with the **highest current HP** (ties random, stream 4) | v2 := 0 |

**2.6 Form II (v1 = 1), @0x02F2.**

| Condition | Action | Then |
|---|---|---|
| an aeon is in battle, v3 = 0 | Absorb on a random living actor (the aeon if alone) | v3 := 255, **v2 += 1** |
| an aeon is in battle, v3 ≠ 0 | Hellbiter (0x60D1) on the front line | v3 := 0, **v2 += 1** |
| no aeon, v2 = 0 (the turn after the entry turn) | random living target; Cura if `GetRandomValue mod 100 > 50` (48.97%) else Regen (51.03%) | v2 := 1 then +1, so **2** |
| no aeon, v2 ≠ 0 | Z = how many of Character #1 to #3 carry Zombie (alive or not, in battle or not). Pick the random living target first. Heal if `GetRandomValue mod 100 < 30 x Z + 10`: **10.01%, 40.03%, 70.02%, 100% for Z = 0, 1, 2, 3**; a heal is Cura if a second draw `mod 100 > 50` else Regen. Otherwise Hellbiter on the front line (the target draw is already spent) | v2 += 1, no wrap |

The aeon branch does **not** freeze v2: both aeon actions fall into the same join (@0x0426) that adds 1.

**2.7 Form III (v1 = 2), @0x043A.**

| Condition | Action | Then |
|---|---|---|
| an aeon in battle, v3 = 0 | Mind Blast variant 0x60F6 (Confuse 50% plus Curse) on the front line | v3 := 1 |
| aeon, v3 = 1 | Absorb on a random living actor | v3 := 2 |
| aeon, v3 = 2 | Osmose (0x607A) on the front line | v3 := 3 |
| aeon, v3 = 3 | Absorb on a random living actor | v3 := 0 |
| no aeon, v2 = 2 | Mind Blast (0x6081, Confuse 50%) on the front line | v2 := 3 |
| no aeon, v2 = 4 | **Mega Death** on the front line | v2 := 0 |
| no aeon, v2 = 0, 1 or 3 | weighted step as in form II but weight **20 x Z + 10** (**10.01%, 30.03%, 50.03%, 70.02%** for Z = 0 to 3), heal is **Curaga** if the second draw `mod 100 > 50` else Regen, otherwise Hellbiter (0x6080) on the front line | v2 += 1 |

So with no aeon the ring is: weighted, weighted, Mind Blast, weighted, Mega Death, then again; Mega Death comes on the
fifth ordinary turn after the entry turn (the entry turn itself is also a Mega Death). The aeon branch of form III does
not touch v2, so a summoned aeon postpones the ring without erasing its place.

**2.8 Draw order inside one weighted step** (form II/III): stream 4 (target, if two or more living) then stream 2 (heal
test) then, only on a heal, stream 2 (spell). The target draw happens even when Hellbiter wins.

**2.9 Reactions (f4 onHit @0x05EE)** [run]:

- The command that hit her is read first (v9); its damage type v10 is the low two bits of the command record's damage
  flags: 0 neither (items, specials), 1 physical, 2 magical, 3 both.
- If her HP is now 0: the form change (§2.10). No counter.
- Otherwise, if the last attacker is herself, nothing; else the counter below is queued at the last attacker (the queue
  refuses a target that is dead, so a dead attacker gets no counter, but the script does not test for it):

| Form | Condition | Counter on the attacker |
|---|---|---|
| I | type 1 and the Darkness counter of **v4** (her own last target, not the attacker) is 0 | Blind |
| I | type 2 and the Silence counter of **v4** is 0 | Silence |
| I | type 0 | Sleep (no gate) |
| I | type 3 | nothing |
| II | `GetRandomValue mod 100 > 50` (48.97%) | Dispelling Slap |
| III | always | Dispelling Slap |

v4 starts at 0, which is Tidus. A counter fails silently if she cannot act (Threaten and the like, §1.7). Because onHit
is per action, an evaded or zero-damage action counters too.

**2.10 Form changes** (HP = 0 after a hit): when v0 = 0 the program sets v0 := 1; max HP and HP := v7 (48,000); v1 := 1; v2,
v3 := 0; v12 := 1; her CTB := 0 and **each of Character #1 to #3 gets CTB + 1**; property 135 := 14; Tough and Heavy := 1;
scene 0 runs (it repeats the CTB writes after a wait). When v0 = 1: v0 := 2; HP := v8 (60,000); v1 := 2; counters reset;
v12 := 2; property 135 := 15; same CTB writes. When v0 = 2 nothing happens and she dies. **Nothing else is touched:
statuses, stat stages (Shell, Protect, Haste, Regen) and her stat bytes carry over, and damage beyond the form's remaining
HP is discarded.** The script does not clear any of her statuses.

**2.11 An engine special case for this fight** [eng, partly inferred]: in `pp_BtlSubHp` (0x0078E230), when the battle id is
0x02090000, her max HP is 24,000 or 48,000 and the Doublecast counter `DAT_0112CA15` is 1, a form dying sets
`DAT_011334C4`; `pp_BtlExecuteAction` then cancels the sub-action that follows (the second cast of the same Doublecast)
instead of letting it hit the next form. Which exact sub-action the counter marks was not traced.

**2.12 The Zombie interplay** in one line: Hellbiter (Zombie 100%) is her opener for forms II and III and her filler;
every Cura, Curaga and Regen she throws is a heal, which a Zombie target takes as damage; the more party slots carry
Zombie the more often she heals instead of Hellbiter (up to always, in form II with all three), and the Zombie slots
count even when that character is dead.

## 3. Braska's Final Aeon (m132, `sins06_00`)

**3.1 Record.** HP 60,000 (the first form), MP 100, STR 45, DEF 100, MAG 50, MDF 100, AGI 44, LCK 15, EVA 0, ACC 10;
overkill threshold 20,000; no affinities. Resistance 255 (immune): Death, Petrify, Sleep, Darkness, Regen, Slow;
Zombie 50, Silence 75, Poison 90; every other status 0 (lands). Immune to fractional damage, Life, CTB damage, Slice,
Bribe, Distill, Eject, Auto-Life, Doom. Doom counter 10. Record commands: Draws sword (0x6088), Blade Blitz (0x6089),
Triumphant Grasp (0x6085, 0x60C9), Ultimate Jecht Shot (0x6086), Jecht Beam (0x6084, 0x608A), Jecht Bomber (0x6087,
0x60C8), Left Arm Strike (0x60C6) and Left Arm Strike 2 (0x60C7).

**3.2 Battle setup** [read; the monster's own init [run]]. The event forces the party **Yuna, Tidus, Auron** into the front
line (Wakka, Kimahri, Lulu and Rikku as reserves, Seymour absent), no result screen, no victory dance, no battle theme.
`sins06_00`'s own init (w0.f0):
Escape and Flee disabled for everyone; the eight shared battle variables bv0x4 to bv0x20 := 0; the **Talk** command (0x3105)
is added to Tidus; start type forced Normal; the start hook shows (property 174 := 0) every monster. The monster's init
(f0 @0x0125): flags (RetainsControlWhenProvoked, Tough, "show Overdrive bar"); Overdrive gauge := 0; **v12 := 120,000**
(form II HP), **v13 := v12 / 2 = 60,000**; v15 (the form-II opener flag) := 0 and bv0x4 to bv0x20 := 0 (v11, the script's
gauge copy, is never set and starts at 0).

**3.3 Variables.** bv0x4 (v0) set by a Pagoda to 255 or 128 when it takes a turn; bv0x14 (v4) and bv0x20 (v7) message
flags for scenes; **bv0x18 (v5) phase: 0, 1, 2**; bv0x1C (v6) Talk pending; v10 the command last aimed at him; **v11
Overdrive gauge**; v12 and v13 above; v15 form-II opener (255 set at the change); v16 show-parts flag; v17 "gauge-full action
already queued" flag.

**3.4 Turn (f4 onTurn @0x0304)** [run]. First the phase table, then the common tail.

| Phase v5 | Draw | Action (target) | Gauge |
|---|---|---|---|
| 0 | `GetRandomValue mod 3` = 0 (33.33%) | Jecht Beam 0x6084 (random living) | +2 |
| 0 | 1 or 2 (66.67%) | Left Arm Strike 0x60C6 (random living) | +2 |
| 1 | `mod 5` = 0 (20.00%) | Jecht Beam 0x608A (random living) | +3 |
| 1 | 2 or 4 (40.00%) | Blade Blitz 0x6089 (front line) | +3 |
| 1 | 1 or 3 (40.00%) | Left Arm Strike 2 0x60C7 (random living) | +3 |
| 1, first turn after the change (v15 = 255) | any draw is still taken | **Blade Blitz** on the front line, v15 := 0 | +3 |
| 2 | `mod 3` = 0 (33.33%) | Jecht Beam 0x608A (random living) | +3 |
| 2 | 1 or 2 (66.67%) | Blade Blitz (front line) | +3 |

Common tail (@0x046A):

1. If the **property copy** of the Overdrive gauge is at least 100 (it is written from v11 at the end of each hook, so the
   increment just added this turn is not seen until next turn): an aeon in battle gives Jecht Bomber (0x6087 in phase 0,
   0x60C8 otherwise) on a random living actor; no aeon gives, by phase, Triumphant Grasp (0x6085) on a random living,
   **non-petrified** actor, Triumphant Grasp 2 (0x60C9) the same way, or Ultimate Jecht Shot (0x6086) on the front line.
   Then v11 := 0, v17 := 0, property := 0.
2. If a Talk is pending (v6 = 255): v6 := 0, v11 := 0, v17 := 0, forced **Special 2** (an empty action) on himself,
   property := 0, bv0x20 := 255, scene 3, and the turn ends (this replaces step 1's action).
3. Otherwise, if Provoked and the target is a single actor, the target becomes the provoker (he keeps control when
   provoked, §1.7); then the action is queued.
4. If v11 > 100: v11 := 100 and, if v17 = 0, v17 := 255, **Special 1** on himself and scene 1. Property := v11. If v11 = 0
   (an Overdrive was just spent) **Special 2** is queued after the action.

Order of draws: stream 2 (the phase roll), then stream 4 if the chosen move needs a random target (the draw happens in
the roll's branch, before the Overdrive override); an Overdrive turn then adds its own stream-4 draw for its target.

**3.5 Gauge accounting** [run]: +2 (phase 0) or +3 (phases 1 and 2) on his own turn, exactly, before the Overdrive test;
**+5 on every hit event** (f6 onHit @0x05FF) from any command that is not a Power Wave, clamped at 100; **Power Wave
(0x608B) with the gauge below 100: +15 if bv0x4 is 0, else +20**; crossing 100 clamps and fires Special 1 once (scene 2
for a Power Wave, scene 1 otherwise). There is no randomness in any of it. bv0x4 is set to 255 or 128 by a Pagoda at
the start of every turn it takes and is cleared only by the Pagoda-revival scene, so the +15 case needs that scene to
have run with no Pagoda turn since (**[inf]**: a Pagoda's own Power Wave is always preceded by its turn start). The
variable v10 read by onHit is the command stored by the **previous onTargeted** (f5 @0x05E8), not re-read.

**3.6 Talk** [run]. onTargeted with Talk (0x3105) runs scene 4 (the dialogue scene). The scene does nothing if Tidus is
dead. First Talk: v6 := 255 (bv0x1C), Talk is disabled for Tidus. Second: the same. Third: only dialogue, then Talk is
removed. When BFA then loses its turn (§3.4 step 2) scene 3 re-enables Talk. So: two charges, battle-wide; the gauge is
cleared when his next turn starts (not when Talk is used), the pending Overdrive is cancelled, and the third Talk has no effect.

**3.7 Transformation** (f7 @0x06E3, reached from the end of onHit and from postPoison): if phase 0 and HP = 0: HP := 1,
**max HP and HP := 120,000**, "will die" flag := 0, **STR := STR + 5** (45 to 50), phase := 1, Tough := 1, v15 := 255,
v16 := 255, forced "Draws sword" on himself. The gauge, v17 and the Talk charges are **not** reset. If phase 1 and HP is
**below** 60,000: phase := 2 (latched; healing back does not undo it). From phase 1 on (HP 0 with v5 not 0) nothing refills him and he dies.

**3.8 Parts.** On the move the program hides four model parts and shows them after (cosmetic).

## 4. The Yu Pagodas (m173 = chr 22 in `sins06_00`, m174 = chr 21; both scripts are the same program)

**4.1 Record.** HP 65,535 in the record, **replaced by 5,000** in the init (v8); MP 5,000; STR 1, DEF 0, MAG 20, MDF 50, AGI 40
(set to **30** in every `sins07` battle), LCK 15. Immune to everything except Threaten (0), Haste (0) and Slow (resist 50);
immune to Life, Scan-again, Slice and Bribe; extra-status immunities Scan, Eject, Auto-Life, Doom. `MustBeKilledForBattleEnd`
:= 0. Commands in the record: Power Wave 0x608B (the BFA version) and 0x60D2 (aeon and Yu Yevon version). Power Wave:
fixed heal of 1,500 (formula 6, power 30) with the cleanse flag; 0x608B removes Zombie, Poison, the four Breaks, Silence,
Darkness and Slow, 0x60D2 removes Zombie, Poison and Reflect. m173's init also adds Curse (0x607B) and Osmose (0x607A) to
both Pagodas.

**4.2 Turn (f2 onTurn)** [run]. First act: bv0x4 := 255 (m173) or 128 (m174).

1. **Reviving:** if v4 (revive countdown) is above 0: v4 -= 1; at 0 the Pagoda becomes targetable and visible on the CTB
   again, Tough := 1, its Slow status := 0, v2 := 1, scene 0; the turn ends. No command is issued.
2. **Partner up** (the other Pagoda's "visible on CTB" property is non-zero):
   - `sins06_00`: Power Wave 0x608B on BFA (monster 0x1084), always.
   - `sins07_00` to `_06`: Power Wave 0x60D2 on the aeon (actor 20) **only if the aeon's Overdrive gauge is below 100**;
     otherwise the program queues whatever target and command its previous turn left in v5 and v6, which is normally the
     same Power Wave again.
   - `sins07_07` (Magus Sisters): the matching group is all monsters minus actors 23, 24, 25; Power Wave 0x60D2 on the
     living sister with the **lowest Overdrive gauge** (ties random), and no command at all if that lowest gauge is 100.
   - `sins07_10` (Yu Yevon): Power Wave 0x60D2 on Yu Yevon (monster 0x10B0), always.
3. **Partner down:** a random living front-line target; m173: Curse if `GetRandomValue mod 100 > 30` (**68.97%**) else
   Osmose; m174: Curse if `mod 100 > 70` (**28.98%**) else Osmose. Draws: stream 4 then stream 2.

**4.3 Being hit (f3 onHit @0x03FD)** [run, with §1.6]:

- Zanmato (0x30E2): v7 := v8 (treated as exactly the current pool). Any other command that does not affect HP is ignored;
  otherwise, if `LastDamageTakenHP` is above 0, v7 += it (heals never subtract).
- If HP is now 0 (the Pagoda has been "destroyed"): **v8 := v7; max HP and HP := v8; v7 := 0**, so it returns with the
  damage it absorbed in the life that just ended (overkill included; each hit capped at 9,999, or 99,999 for an attacker
  with Break Damage Limit); then, only if it was
  still targetable: v4 := **1 if it is Slowed, else 2 or 3 (2 + `GetRandomValue mod 100 < 50`: 49.9% / 50.1%)**; bv0xC
  (bv0x8 for m174) := 255; Targetable := 0; "visible on CTB" := 0; and, if the main enemy is still alive (any of the three
  sisters in the Magus fight), the destruction-message scene 1 (bv0x20 := 2 first in the BFA and Yu Yevon fights).

So the Pagodas are never really dead; the revive delay is **v4 of their own turns** (they keep taking turns, invisibly), not
a tick count, and the new HP compounds across lives.

**4.4 Talk on a Pagoda** (f4 onTargeted): bv0x20 := 4 and scene 3 (a message); no other effect.

**4.5 Start of a `sins07` battle** (battle start hook): both Pagodas' CTB := 24. They start hidden (birth animation
"hidden") in `sins07_00` to `_07` and visible in `sins07_10`; the possessed actor's first turn shows them (§5.5).

## 5. The possession chain (`sins0700.ebp`, the `sins07_*` battles)

**5.1 Order.** The event (w26) builds the bitfield of aeons currently in the party (`getActiveAeonsBitfield`: actor ids 8
to 15, i.e. Valefor, Ifrit, Ixion, Shiva, Bahamut, Anima, Yojimbo and the Magus Sisters) and then loops: while the bitfield
is non-empty it shows a menu of the remaining aeons, the **player chooses which one to fight next**, that aeon (and for the
Magus Sisters also Sandy and Mindy) is removed from the party, and the matching battle is launched (8 to `sins07_00`, 9 to
`_01`, 10 to `_02`, 11 to `_03`, 12 to `_04`, 13 to `_05`, 14 to `_06`, 15 to `_07`). After the last one the event launches
Yu Yevon (`sins07_10`). No HP/MP restore call was found in the three events, so party HP, MP and statuses carry across
every link. Battle flags: no victory dance, no battle theme; the game-over flag is not disabled in the aeon battles [read].

**5.2 Per battle, for the party** (`sins07_*` init, identical in all nine) [read]: Escape and Flee disabled; shared
variables cleared; **Permanent Auto-Life** (property 334) on every non-monster, non-aeon actor (the party members);
the Auto-Life command 0x311F gets its own animation. Each party member has an onHit handler (workers at slots 41 to 47, Tidus
to Rikku): when the command that hit them was Auto-Life their **CTB := 0**, so a revived character acts next. The engine
re-applies the Auto-Life status after a permanent holder is revived or at battle start (`FUN_0078deb0`), and the revive
itself is command 0x311F (formula 8, power 4: 25% of max HP, floor 1).

**5.3 Per battle, start hook** [read]: the possessed actor gets First Strike and CTB 0, both Pagodas CTB 24, and each of
Character #1 to #3 and the reserves CTB + 1 (the aeon's own init adds another +1, so +2 in total if both run before the
first turn). In the Magus battle the
sisters are chr 20 Mindy, 21 Sandy, 22 Cindy: only Cindy gets First Strike and CTB 0, the other two sisters and both
Pagodas get CTB 24. In `sins07_10` the hook writes the first Pagoda's CTB twice (0 then 24) and never writes Yu Yevon's own
CTB, so his opening CTB is whatever the engine computed for him (First Strike is set).

**5.4 Setup common to the seven aeons** (init, e.g. m163 f0) [run]: Overdrive mode 19 "aeons only", bar shown; the actor
takes the **player's own aeon's** STR, DEF, MAG, MDF, AGI, EVA, ACC and max HP (read from actor 8 Valefor, 9 Ifrit, 10 Ixion,
11 Shiva, 12 Bahamut, 13 Anima, 14 Yojimbo), HP := that max HP, name := the aeon's. LCK stays the record's 0, MP the record's 1.
First Strike := 1, CTB := 0, party and reserve CTB + 1. Kernel records add: immune (255) to Death, Zombie, Petrify, Poison,
the four Breaks, Confuse, Berserk, Provoke, Sleep, Silence, Darkness and Slow; Shell, Protect, Reflect, the Nul statuses,
Regen and Haste land; Ifrit **absorbs Fire**, Ixion **absorbs Thunder**, Shiva **absorbs Ice**, the rest have no affinity;
immune to Scan, Eject, Auto-Life, Doom, Slice and Bribe; Poison 25%. The Overdrive gauge starts at 0.

**5.5 The turn (f2, per aeon) and its gauge** [run]:

- **First turn:** a no-effect Summon action and the no-effect "Possessed by Yu Yevon" action; both Pagodas shown (property
  174 := 0). No attack.
- **Later turns, gauge below 100** (v3 re-read from the Overdrive property): pick a random living front-line target; then:

| Aeon | 50% (draw `mod 100 < 50`) | otherwise |
|---|---|---|
| Valefor (m163) | Sonic Wings 0x60D3 | Sonic Wings if the target has Counter or Evade-and-Counter, else Attack 0x6000 |
| Ifrit (m164) | Meteor Strike 0x60D6 | same split with Meteor Strike |
| Ixion (m165) | Aerospark 0x60D8 | same with Aerospark |
| Shiva (m166) | Heavenly Strike 0x60DA | same with Heavenly Strike |
| Bahamut (m167) | **Impulse 0x60DC on the whole front line** | Impulse (still all) if the target has a counter, else Attack on that target |
| Anima (m168) | none: **always Pain 0x60DE** on the random target, Attack is never used | |
| Yojimbo (m169) | `mod 2`: Kozuka 0x60E0 or Wakizashi 0x60E1 (50/50), never Attack | |

  The result is that Valefor, Ifrit, Ixion, Shiva attack with Attack in 50% x (target has no counter) of turns.
- **Gauge on an own non-Overdrive turn:** +`GetRandomValue mod 10` (0 to 9, flat), and at 100 a message scene.
- **Overdrive turn** (property at least 100): Valefor forced Energy Blast 0x60D4 if the player's Valefor knows Energy Blast
  (checked at init) else forced Energy Ray 0x60D5, on the front line; Ifrit Hellfire 0x60D7; Ixion Thor's Hammer 0x60D9; Shiva
  Diamond Dust 0x60DB; Bahamut Mega Flare 0x60DD; Anima Oblivion 0x60DF; Yojimbo Zanmato 0x60E2 (added to him at init); all
  on the front line, gauge := 0 (Valefor forced, the rest ordinary `performCommand`).
- **onHit gauge** (f4): ignored if HP is 0, the gauge is already at least 100, or the command does not affect HP; otherwise
  +`mod 10` (0 to 9); and for **Power Wave 0x60D2** a second draw plus 15: **+15 to +33 in total (mean 24)** (Yojimbo: +5
  instead of +15, so 5 to 14); the gauge clamps at 100 with a message scene. Counted per action per aeon, hits that
  miss included.
- Death: the actor remains as a body (boss death animation).

**5.6 The Magus Sisters** (`sins07_07`; m178 Cindy chr 22, m179 Sandy chr 21, m180 Mindy chr 20; stats copied from actors
15, 16, 17; Overdrive max 100 each) [run]:

- **Cindy (f3 onTurn):** first turn the same Summon/Possessed pair. After that: if **all three sisters are alive and each has
  a gauge of at least 100**: queue **Delta Attack (0x60E6)** on the front line (her postTurn then sets the three gauges
  to 0). Else if her HP is below `(max HP / 3) x 2` (integer): **Drain** on the highest-HP front-line actor. Else, with
  Sandy's and Mindy's HP percent (255 if dead): if either is at most 50, **Curaga** on the one with the lower percent (a
  tie goes to Mindy); otherwise **Camisade** on a random living target. Gauge: +`mod 10` per own turn, clamps above 100.
  Her onTargeted (f5): if the command aimed at her is Special 1 (queued by Sandy or Mindy), she flags the Delta Attack,
  queues it on the front line and zeroes her gauge; she also stores her Reflect counter so that a Power Wave that strips
  it can be undone (onHit puts it back).
- **Sandy (f3):** skip the turn if hidden (property 174 is 1). If all three gauges are at least 100: Special 1 on Cindy
  (this triggers Cindy's Delta Attack through her onTargeted). Else if Cindy lives and has no Reflect: **Reflect on Cindy**.
  Else Haste on a random sister without Haste (a discarded `findMatchingChr` on Reflect still consumes a stream-4 draw);
  if all are Hasted: **Razzia** on a random living target. Gauge +`mod 10` per turn.
- **Mindy (f3):** same hidden test and Special 1 test. If Cindy lives and has Reflect: **Flare on Cindy** (it bounces onto
  the party). Otherwise Passado 0x60E5 if `mod 100 > 50` (48.97%) else Flare, on a random living target.
- **Gauge on hit** (all three): per hit event +`mod 10` + **10** (10 to 19), and for a Power Wave a further +`mod 10` + **30**
  (about 40 to 58 in total). Each sister's death hides her bar and makes her untargetable.
- The Pagodas are chr 23 and 24; the Power Wave rule is in §4.2. How Sandy and Mindy become un-hidden (scene 2 sets all
  monsters' property 174 to 0) was not traced to its trigger (§7).

## 6. Yu Yevon (m176, `sins07_10`)

**6.1 Record.** HP 99,999, MP 1, STR 1, DEF 0, MAG 200, MDF 0, AGI 44, LCK 0, EVA 0, ACC 0; overkill 99,999; no affinities. Immune
(255): Death, Petrify, Confuse, Berserk, Provoke, Sleep, Silence, Darkness; Zombie, Poison, the Breaks, Shell, Protect,
Reflect, Regen, Haste and Slow all land (resistance 0). Immune to Scan, Eject, Auto-Life, Slice and Bribe; **not** immune to
fractional damage or Life. Poison 10%; Doom counter 3. The record has no commands; the init adds Curaga, Ultima, Osmose (0x607A)
and Gravija (0x6083).

**6.2 Turn (f2 @0x0107)** [run]:

1. If v3 = 255 (set by the Osmose turn): **Ultima** on the front line, v2 := 0, v3 := 0.
2. Else on his very first turn only (v1 = 0): v1 := 255 and **no action**. This is the only idle turn; there is no
   alternating no-op.
3. Else if v2 is at least 7: for each of Character #1, #2, #3 that is alive, **Osmose (single target) on that character**
   (up to three sub-actions in one turn), then v3 := 255.
4. Else: matching group := the front line plus himself (actor 20); **Gravija (75% of current HP) on that group**. The two
   Pagodas are not in it.

**6.3 The Curaga counter (f3 onHit @0x01AF)** [run]:

- ignored if the last attacker is himself (so his own Gravija never counts); a dead attacker does not stop it;
- if the command was Power Wave 0x60D2: **Zombie := 0 and Reflect := 0** on him;
- ignored unless `LastDamageTakenHP` (§1.6) is above 0, so a heal (the Power Wave heal included), a miss and a zero-damage
  action do not count. The test comes **after** the status strip, and a heal that lands on a Zombie is inverted into
  damage: a Pagoda's Power Wave on a **Zombie** Yu Yevon is 1,500 damage, **does count** (v2 += 1) and draws a Curaga, which
  by then heals him normally because the Zombie has just been stripped [run];
- otherwise v2 += 1 and he casts **Curaga on himself** as a reaction.

So one counter per action that dealt him HP damage. A Poison tick raises postPoison, which his program does not use, so
it never counts. v2 is only reset by the Ultima turn; counters taken between the Osmose turn and the Ultima turn are wasted.
onDeath (f4): a forced no-effect "Command 254".

## 7. Not decoded, and confidence

**Confidence.** High for every table in §2 to §6 (read, re-read against raw opcodes, executed) and for §1 (decompiled
handlers). Medium for §2.11, for the unhide trigger of Sandy and Mindy, and for the claim that a Doublecast raises two hit
events (V4). The mock world is not the engine: anything that depends on how the engine orders the queued sub-actions
(for instance the order in which a Pagoda's death and a revive scene resolve) is read, not run.

**Not decoded.**

1. The CTB charged for a turn on which a program queues nothing (the Pagodas' hidden turns, Yu Yevon's first turn).
2. Whether the second cast of a Doublecast raises its own onHit event (the executor keys the pending slot by sub-action
   index, which suggests yes) and the exact counter in §2.11.
3. What un-hides Sandy and Mindy (scene 2 does it, but no AI function queues that scene).
4. The meaning of properties 135, 217, 238, 295 and 296, and of `SetBattleFlags` bits 0x4, 0x800 and 0x10000.
5. `btlSetAnimaChainOff(1)`, set at the start of every one of these battles.
6. Whether private variables are zeroed by the engine (every script relies on it).
7. The text and camera scenes (they set only message flags and animations).

**Doom and Doublecast.** No AI function in these fights inflicts Doom, casts Doublecast or branches on either. Doom enters
only through the records (the immunities and the starting Doom counters: Yunalesca 99, BFA 10, Pagodas and Yu Yevon 3), and
Doublecast only through the engine's hit-event cadence (§1.1) and the Yunalesca special case (§2.11).

**Next steps for the engine lane (not done here):** replace the BFA estimates with §3, rebuild Yu Yevon's turn from §6,
give the Pagodas their per-fight targeting and compounding revival, switch the chain to the player's own order, and raise
reactions once per action per target including misses.

## 8. Offset index (where each rule lives)

Hook entry points of each monster's AI worker (the worker bound to the monster-AI slot; offsets are inside `mNNN.bin`'s
program chunk). Rule offsets used in the sections above are inside these functions.

| File | Actor | init | onTurn | preTurn | onTargeted | onHit | onDeath | postTurn / other |
|---|---|---|---|---|---|---|---|---|
| m130 | Yunalesca | f0 @0x001B | f2 @0x0209 | | f3 @0x05ED (empty) | f4 @0x05EE | f5 @0x084D (empty) | |
| m132 | Braska's Final Aeon | f0 @0x0125 | f4 @0x0304 | f2 @0x02D2 (empty) | f5 @0x05E8 | f6 @0x05FF | | f7 @0x06E3 postPoison (also the tail of onHit), f3 onMove, f8 postMove |
| m173 | Yu Pagoda (chr 22 in `sins06_00`) | f0 @0x0000 | f2 @0x0199 | | f4 @0x05B3 | f3 @0x03FD | | |
| m174 | Yu Pagoda (chr 21) | f0 @0x0000 | f2 @0x0175 | | f4 @0x058F | f3 @0x03D9 | | |
| m176 | Yu Yevon | f0 @0x0000 | f2 @0x0107 | | | f3 @0x01AF | f4 @0x0213 | |
| m163 | possessed Valefor | f0 @0x0000 | f2 @0x02D6 | | | f4 @0x03F0 | f5 @0x047C | f3 @0x03E3 postTurn |
| m164 | possessed Ifrit | f0 @0x0000 | f2 @0x02C1 | | | f4 @0x03DD | f5 @0x0469 | f3 @0x03C4 postTurn |
| m165 | possessed Ixion | f0 @0x0012 | f2 @0x02C1 | | | f4 @0x03C5 | f5 @0x0451 | f3 @0x03B8 postTurn |
| m166 | possessed Shiva | f0 @0x0000 | f2 @0x02AF | | | f4 @0x03B3 | | f3 @0x03A6 postTurn |
| m167 | possessed Bahamut | f0 @0x0000 | f2 @0x02C7 | | | f4 @0x03CB | | f3 @0x03BE postTurn |
| m168 | possessed Anima | f0 @0x0012 | f3 @0x0334 | | | f5 @0x03F4 | f6 @0x0480 | f4 @0x03E7 postTurn |
| m169 | possessed Yojimbo | f0 @0x0000 | f2 @0x02C4 | | | f4 @0x03DE | | f3 @0x03B5 postTurn |
| m178 | Cindy | f0 @0x0000 | f3 @0x030A | f2 @0x02F1 | f5 @0x052A | f6 @0x0566 | f7 @0x0612 | f4 @0x04F5 postTurn |
| m179 | Sandy | f0 @0x0000 | f3 @0x0246 | f2 @0x022D | | f5 @0x038D | f6 @0x0435 | f4 @0x0380 postTurn |
| m180 | Mindy | f0 @0x0000 | f3 @0x0246 | f2 @0x022D | | f5 @0x0358 | f6 @0x0400 | f4 @0x034B postTurn |

Rule offsets, for the larger programs. **m130:** entry turns @0x0210 and @0x024B; aeon flag @0x0288; form I @0x02A8; form II
@0x02F2 (aeon branch @0x02FC, weighted branch @0x0374, shared "+1" join @0x0426); form III @0x043A (aeon ring @0x0440,
five-turn ring @0x04D3); perform @0x05E9; onHit: damage type @0x05F1, HP-zero test @0x060D, transition I @0x0617 and II
@0x06C6, counters @0x0792 to @0x084C. **m132:** init @0x0125 to @0x02CD; phase dispatch @0x0307; phase 0 @0x030B; phase 1
@0x0364; phase 2 @0x03F8; Overdrive branch @0x046A; Talk branch @0x052A; queue @0x0590; overflow @0x0593; onHit Power Wave
@0x060E, other hits @0x0676; transformation @0x06F8; phase 2 test @0x077E. **m173/m174:** revive countdown @0x019C
(m173) / @0x0178 (m174); battle switch @0x01FD / @0x01D9; accumulation @0x0404 / @0x03E0; revive branch @0x044E / @0x042A.
**m176:** Ultima @0x010E; first-turn skip @0x0127; Osmose chain @0x013A; Gravija @0x0199; onHit attacker test @0x01BB, Power
Wave @0x01CC, damage test @0x01EE, counter @0x01FF. **m163:** first turn @0x02DD; Overdrive @0x031A; normal turn @0x035E;
gauge @0x03B5; onHit @0x03F3. **m178:** first turn @0x0311; Delta Attack test @0x0398; Drain @0x03C6; heal/Camisade @0x03F0;
postTurn reset @0x04FC; onTargeted Special 1 @0x0531; onHit @0x0569.

## 9. Where our AI differs from the game

Our files: `src/battle/ffx/ai/yunalesca.ts`, `forms.ts`, `ai/braskas-final-aeon.ts`, `ai/yu-yevon.ts`, `ai/reactions.ts`,
`setup.ts`, `hp.ts`, and the data in `src/data/ffx/enemies/braskas-final-aeon.ts` (`data` below). "Ours" cites file and line
as read in the `re-parity` worktree on 2026-10-08. Across the board our engine draws from one seeded generator
(`ctx.rng.int`, `rng.pick`) where the game draws from fixed streams (§1.2); that is a parity item for the RNG lane, not
repeated per row.

| # | Rule | Game (reference) | Ours | Effect |
|---|---|---|---|---|
| Y1 | Form II turns while an aeon is out | v2 still gains 1 per aeon turn (m130 @0x0426 join) | counter frozen (`yunalesca.ts:114-122`, header comment 13-14) | after the aeon leaves, the game has skipped the "guaranteed heal" turn (v2 = 0) whenever an aeon turn came first; ours has not |
| Y2 | Target picks | stream 4, only with two or more candidates; pick = draw mod count along ascending ids; "Highest" ties are random | `rng.pick` on every pick, even for one candidate (`yunalesca.ts:31-37`); "Highest" ties go to the first listed (`40-49`) | draw count and tie behaviour |
| Y3 | Form I counter by damage type | Sleep only for type 0; type 3 (both) does nothing | everything not physical or magical is Sleep (`yunalesca.ts:205-206`) | rare |
| Y4 | Counter gate before her first action | v4 starts as actor 0 (Tidus) | no remembered target means no gate (`yunalesca.ts:195-203`) | only if Tidus carries Darkness or Silence at that moment |
| Y5 | When a counter fires | after every action that applied a hit record to her, evaded or zero-damage included, from any attacker but herself | only enemies in `damagedEnemyIds`, player-side attackers only (`reactions.ts:84-129`) | an evaded or zero-damage action counters in the game |
| Y6 | Doublecast across a form change | the engine cancels the follow-up cast when a form dies in the first (§2.11) | not modelled (`forms.ts:23-62`) | the second cast would hit the new form |
| B1 | Overdrive gauge gains | +2 (phase 0) or +3 (phases 1 and 2) on his turn; +5 per hit event; +20 per Power Wave (+15 when bv0x4 is 0); no randomness | 0 to 10 per damaging action and 0 to 10 per turn (`braskas-final-aeon.ts:146, 160`; header table marked estimate) | the whole Overdrive economy |
| B2 | Move weights | phase 0: Beam 1/3, Strike 2/3; phase 1: Beam 1/5, Blitz 2/5, Strike 2 2/5; phase 2: Beam 1/3, Blitz 2/3; forced Blitz opener in phase 1 | 75/25; 60/25/15; 25/75 (`:100-116`, marked estimates) | replace the estimates with §3.4 |
| B3 | Phase 2 | latched once HP is below 60,000 after a hit | recomputed every turn as HP at most half (`:141`) | healing above 60,000 undoes ours, not the game's |
| B4 | Form-II opener | consumed on the first phase-1 turn even when Talk or an Overdrive replaces the action | kept until a weighted turn (`:162-165`) | rare |
| B5 | When the Overdrive fires | tested against the stored gauge, so the turn the gauge reaches 100 is not an Overdrive turn; an empty Special 2 follows the move | spent the same turn the gauge reads 100 (`:154-157`) | one-turn timing; the extra empty action |
| B6 | Overdrive targets | Jecht Bomber, Triumphant Grasp: one random living actor (not petrified for Grasp); Ultimate Jecht Shot: the front line | targets left empty (`:122-129`) | target rule must be explicit |
| B7 | Talk | flag set when Talk resolves; gauge cleared and pending Overdrive cancelled when his next turn starts; third Talk is text only; scene needs Tidus alive | gauge cleared at once, two charges (`:263-277`) | timing of the clear; the Tidus-alive condition |
| P1 | Pagoda Power Wave target | BFA always; aeon fights only while the aeon's gauge is below 100 (otherwise last turn's command repeats); Magus: lowest-gauge sister, none if all full; Yu Yevon always | the boss while the sibling lives, always (`:183-199`) | gauge feed in the aeon and Magus fights |
| P2 | Pagoda choice when alone | m173 Curse 68.97%, m174 Curse 28.98% | by slot parity, deterministic (`:208`) | the whole split |
| P3 | Revive delay | 2 or 3 of the Pagoda's own turns (50/50), 1 if Slowed | fixed 63 or 72 ticks (`data:117`) | timing and the Slow shortening |
| P4 | Revive HP | the damage absorbed in the life just ended, so it compounds across lives | 5,000 plus the killing blow's excess every time (`hp.ts:98-111`) | second and later revivals |
| P5 | Power Wave gauge on an aeon | +15 to +33; Yojimbo +5 to +14; sisters +40 to +58 | 15 to 30 (`:196`) | |
| A1 | Order of the aeon battles | the player picks from a menu of the aeons in the party; Yojimbo and the Magus Sisters included; the chosen aeon leaves the party first | fixed acquisition order (`data:147, 389`; `ids.ts:230-241`) | choice and which aeons stay summonable |
| A2 | Magus Sisters | one battle: three sisters and two Pagodas | three separate battles (`data:389`) | |
| A3 | Mirrored stats | STR, DEF, MAG, MDF, AGI, EVA, ACC, max HP; LCK stays 0, MP stays 1 | all stats, Luck 1, MP mirrored (`setup.ts:249-262`) | |
| A4 | Affinities and Slow | Ifrit absorbs Fire, Ixion Thunder, Shiva Ice; all immune to Slow | none (`data:310`) | |
| A5 | Move choice | per-aeon tables in §5.5; Anima and Yojimbo never use Attack; Bahamut's Impulse hits everyone; a target with a counter draws the special | 50% a random ordinary ability, else Attack (`:251-254`) | |
| A6 | Overdrive gains | own turn 0 to 9; hit event 0 to 9; Power Wave 15 to 33; sisters 10 to 19 per hit | `rng.int(0, 10)` for each (`:232-235`) | |
| A7 | Revived party member | CTB := 0 after the Auto-Life action | re-enters with a rank-3 delay (`hp.ts:203-208`) | acts later than in the game |
| A8 | Opening order | possessed actor CTB 0 and First Strike, Pagodas 24, party +2 | not modelled | who acts first |
| V1 | Yu Yevon's idle turns | only the first turn is skipped | alternates a no-op with Gravija (`yu-yevon.ts:45-47`) | Gravija comes twice as often in the game |
| V2 | Gravija group | the front line plus himself; the Pagodas are not in it | "every combatant", Pagodas included (`yu-yevon.ts:48-56`) | the Pagodas are never hit by it |
| V3 | Osmose | single-target Osmose on each living Character #1 to #3 (up to three actions), then Ultima next turn | one party-wide Osmose (`yu-yevon.ts:36`) | |
| V4 | What counts as a counter trigger | each action (or Doublecast sub-action) that dealt him HP damage, whoever the attacker, never himself | one per player-side action in `damagedEnemyIds` (`reactions.ts`, `yu-yevon.ts:65-72`) | zero-damage actions, Doublecast |
| V5 | A Pagoda's Power Wave on a **Zombie** Yu Yevon | the inverted heal is 1,500 damage, so it counts (v2 += 1) and draws a Curaga | never provokes a counter: enemy-side attackers return early (`reactions.ts:81`; the same exclusion is stated in the `yu-yevon.ts` header, line 13) | the Zombie route: each Power Wave on a Zombie Yu Yevon advances the Osmose/Ultima count in the game |

**What already agrees with the game** (no change needed): Yunalesca's three HP pools (24,000, 48,000, 60,000), the CTB writes
at a form change, the entry Metamorphosis plus Hellbiter or Mega Death, the weights 10+30Z and 10+20Z, the 49% and 51%
splits, Mega Death on the fifth ordinary turn, the Form III aeon ring, the Form I gate quirk (§2.9); BFA's 60,000 and
120,000 pools, Strength 45 to 50, the gauge carrying across the transformation, the two effective Talk charges, the
Triumphant Grasp / Bomber / Ultimate Jecht Shot choice by phase and aeon; the Pagodas' 5,000 HP, AGI 40 and 30, the 1,500
fixed heal and the +20 gauge; the aeons' first-turn non-action and Overdrive-on-full-gauge; Yu Yevon's threshold of seven
counters, the Ultima turn after Osmose, the exclusion of his own Gravija and of a healing Power Wave from the counter,
and the permanent Auto-Life with its 25% revive (`hp.ts`).

