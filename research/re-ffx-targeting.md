# FFX battle targeting chain: Reflect, Cover, the random spread, Berserk, Confuse and Provoke (what the game code does)

**Game case: FFX only.** FFX-2 has its own spread routine (0x634E40) and its own counters in its own exe; none of these addresses exist there.
Part of the `re-parity` track ([docs/plans/re-parity.md](../docs/plans/re-parity.md)), release candidate 4, lane FFX-G (slices G-a and G-b); slice G-c (§7 and §8, counters and reach) in release candidate 9.
Condensed 2026-10-11 from the private working note FFX-G04 (written 2026-10-10 by the decompilation lane, revised after two independent checks); §7 and §8 added 2026-10-15 with five read-only checks of the exe made for slice G-c.

**Source note (applies to every statement below unless a line says otherwise):** FFX.exe, Steam build 25501027, SHA-256 0537B2A1...686D (the HD
Remaster's 32-bit executable, image base 0x00400000; every "VA" below is a virtual address in that image). Read in Ghidra, decompiler and
disassembly. Everything is written in our own words: no game code and no game text is reproduced here. The game was never run.

Labels: **emulated** (N vectors, 0 mismatches) = the game's own machine code was run in an x86-32 emulator on generated inputs, with the battle
generator scripted so each draw returns a chosen value and is logged with its stream, and an independent model written from the disassembly agreed on
every output, every changed field and every draw (stream and order); **read** = read in the decompiler or disassembler or scanned in the install's
data, not run; **inferred** = follows from read facts but nothing ran it. A statement under "Open" is never used as a fact.

| This note | Kernel (pure TypeScript) | Tests |
|---|---|---|
| §1 target builder: spread, Cover, Reflect | `src/battle/ffx/kernel/target-builder.ts`, `cover.ts` | `tests/unit/parity-ffx-target-builder.test.ts`, `parity-ffx-target-cover.test.ts` |
| §2 legal set, auto-target, group pick, picker | `kernel/legal-set.ts`, `kernel/target-world.ts` | `parity-ffx-target-sets.test.ts` |
| §3 forced turns | `kernel/forced-turn.ts` | `parity-ffx-target-forced.test.ts` |
| §5 engine wiring | `src/battle/ffx/target-build.ts`, `forced-turn.ts`, `adapt/target-world.ts` | `parity-ffx-engine-targets.test.ts` |
| §7 counters | `kernel/counter.ts` | `parity-ffx-counter-kernel.test.ts` |
| §8 counter wiring and reach | `src/battle/ffx/counter-chain.ts`, `adapt/counter.ts`, `reach.ts`, `kernel/command-reach-table.ts` | `parity-ffx-engine-counters.test.ts`, `parity-ffx-reach.test.ts` |

## 0. Functions

| Address | Role | Proof |
|---|---|---|
| 0x0078ba70 | build the target hits (per-target hit counts, random spread, Cover redirect, Reflect bounce); returns the mask of targets that reflected | emulated, 68,000 vectors |
| 0x0078eef0 | find the Cover for one target of one attacker | emulated, 28,000 vectors |
| 0x007845e0 | Tidus counter array (add a delta to counter 1 to 7, or read with delta 0) | emulated, 12,000 vectors |
| 0x007b24a0 | can-act (Petrified, Confuse/Berserk, asleep, Ejected, in battle, Provoke, Threaten) | emulated as a callee in the Cover, builder and queue vectors |
| 0x007acd40 | pick one target from a mask (streams 4, 5, 6) | emulated, 25,240 vectors, every residue class of 2 to 12 candidates |
| 0x00799820 | legal target set of a side for a user and a command | emulated, 28,000 vectors |
| 0x00799690 | reach of a command for a user | emulated, every u16 value of the command word for 38 user ids (2,490,368 vectors) |
| 0x007996d0 | auto-target mask by the command's own target type | emulated, 28,000 vectors |
| 0x00799910 | group pick (one populated enemy group, stream 5) | emulated, 16,000 vectors |
| 0x00799ac0 | Berserk / Confuse turn (queue the default attack) | emulated, 23,000 vectors |
| 0x00799d50 | Provoke turn | emulated, 23,000 vectors |

Slot numbering the code uses: party 0 to 7 (Tidus 0, Yuna 1, Auron 2, Kimahri 3, Wakka 4, Lulu 5, Rikku 6, slot 7 a guest), aeons 8 to 14, the three
Magus Sisters 15 to 17, monsters 0x14 to 0x1b. The Chr array holds ids 0 to 30; each Chr record is 0xf90 bytes. Fields the chain reads (offsets from the
character record): +0x4ff BattleDistance (s8), +0x504 enemy group (low three bits), +0x5c4 the slot that Provoked it, +0x5cb "keeps control when Provoked",
+0x5d0 current HP, +0x606 permanent status word (0x100 Confuse, 0x200 Berserk, 0x400 Provoke, 0x800 Threaten), +0x608 Sleep counter, +0x60d Reflect counter
(any non-zero value), +0x616 extra word (0x100 Eject, 0x1000 Guard, 0x2000 Sentinel), +0x62c equipment-given temporal statuses (0x20 Reflect), +0x6c6 default
attack command id, +0xdc8 in battle, +0xdcc dead, +0xdcd removed, +0xdce Petrified, +0xdd9 Targetable, +0xddd target class, +0xdde "only targetable by" id.
Command record fields: `Cmd+0x1a/0x1b` (bit 1 default aim is the opposite side; bits 2 and 3 target type 0 single, 1 group, 2 all, 3 self; bit 6 can target
the dead; bits 7 and 8 reach; bit 9 reach 3 for the actors 4, 8, 13; bits 10 and 11 may be aimed at ordinary / event-character actors), `Cmd+0x1c` bit 7
reflectable, bit 15 random spread, `Cmd+0x20` bits 0 and 1 the damage kind (1 physical, 2 magical), `Cmd+0x2b` the hit count.

## 1. The target builder (0x0078ba70; emulated)

Inputs: the user, the command record, the command id, the target mask the action carries and a running hit total. Outputs: for each of the 31 slots a
"targeted" count and a hit count, the final mask, the new total and the mask of targets that reflected.

1. **Hit counts.** A random-spread command (misc bit 15) clears every count and then, for each of its `Cmd+0x2b` hits, picks one target from the mask with
   **stream 5** (`value mod candidates`, candidates in ascending slot order, **no draw when only one candidate**) and adds a hit to it; the total grows by the hit
   count once. Every other command gives every target in the mask the command's hit count and grows the total by it for each target. Bit 31 of a mask is ignored;
   counts are bytes. **Every member of the mask is a target of the action even when no hit chose it.**
2. **Cover**, only for a command whose damage kind is physical (1) and whose target type is single. For each target in the mask: the user's own slot is never
   covered; for any other target the Cover search runs (§1.1); if it names someone else, that someone replaces the target in the mask, the holder takes the
   target's hit count (added to its own), the target's goes to 0, and when the holder is slot 0, the target is a party slot below 8 and the user is a monster,
   Tidus's counter for that slot goes up by one. **Cover is decided once, when the targets are built, not once per hit.**
3. **Reflect**, only for a reflectable command, for each target left in the mask in ascending slot order: if it has a non-zero Reflect counter or the equipment
   Reflect bit it is recorded as reflected, and
   - if it is on the **other side from the user**, the user takes over its hit count and becomes the target: no draw, no legality check;
   - if it is on the **same side as the user** (an ally, or the user itself), the legal target set (§2) of the **opposite** side is computed for this user and
     command, one target is picked from it with **stream 6** (one draw when two or more candidates) and takes the hit count; with none the hits are lost.
   The reflecting target's own count is zeroed. **A bounced spell never bounces again** (the replacement is not looked at, and bouncing does not use up the
   Reflect counter). Whoever ends up targeted is counted as targeted once more for every source that lands on it, gets the user as its last attacker and joins the
   final mask.

Draw order inside one call, always: every spread pick (stream 5, in hit order), then the Reflect picks (stream 6, ascending slot order of the reflecting targets).
Cover draws nothing. The only instruction that tests the Reflect counter in battle logic is in this function (read).

**Which commands bounce is a per-command record bit (misc bit 7), not a category.** 59 of 979 command records carry it, and it is applied to every target of the
command separately, so the ten reflectable multi-target records bounce too: Hastega 0x3037, Slowga 0x3039, the four Nul spells 0x302e to 0x3031, and the monster
Fire, Blizzard, Thunder and Water 0x6039 to 0x603c. Not flagged: Dispel 0x303d, Auto-Life 0x3040, Demi 0x304e and 0x3085, Ultima 0x3053 and 0x308a, Ultra Cure
0x30ae, Pray 0x3019, every Fury, every item, every Overdrive (read from the command table).

**Random spread** (misc bit 15): 51 records, listed in the source note: the Gems 0x2019, 0x201c, 0x201f, 0x2022 (5 hits), Farplane Wind 0x2033 (4), Slice and Dice
0x3061 (6), the seventeen sixteen-hit Furies 0x3078 to 0x3089 except Demi Fury 0x3085, the twenty records 0x3095 to 0x30a8 (3, 5, 6 or 9 hits), 0x30ec, Attack Reels
0x312e, Shining 0x40bf, Blitzball Rush 0x600c, Gatling Gun 0x6022 and the three Photon Spray records. None is reflectable.

### 1.1 Cover (0x0078eef0; emulated, with the counter array 0x007845e0)

The candidate slots are 0x14 to 0x1b when the target is a monster, otherwise 0 to 0x11. A slot is a candidate when it is not the attacker and not the target, is in
battle, has Guard or Sentinel in the extra word, has the dead flag clear and can act (can-act with in-battle, not-Provoked and not-Threatened all required, so it also
blocks Confuse, Berserk, Provoke, Threaten, Sleep, Petrify and Eject). Its score is its current HP as a signed number, **doubled when it has Sentinel**; then, **if the
target is slot 0, plus half (toward zero) of that candidate's Tidus counter**; and **if the candidate is slot 0, plus half of the target's counter** (at most one of
the two terms applies). The search keeps the first candidate whose score is strictly higher than the best so far, starting from -1, so the **lowest slot wins ties**
and a candidate with a negative score never wins. With no candidate the target covers itself. No random element. The counter array: seven unsigned words for party
slots 1 to 7, a sum above 0x0ffffffe is returned but not stored, a request for index 0 or above 7 returns 0 and changes nothing, a delta of 0 reads. Counter updates:
+1 on a Tidus cover (above); and in the per-target step (read), when the user is slot 0 and the target is a party slot, the target's counter gets +1 if the sum of
that target's HP changes in the action is a net heal and -1 (not below 0) if it is a net HP loss.

## 2. Legal target set, auto-target and group pick

**Legal set** (0x00799820; emulated): take the side's slots (-14: every party-side slot that is in battle and not removed; -15: every monster that is), then remove
every slot that fails any of: Targetable is 0; the target class forbids the command (class 0 needs usage bit 0x400, class 1 needs 0x800, class 2 never, any other value
is not filtered; an "only targetable by" id other than 0xff and other than this command's turns a non-zero class into never); BattleDistance above the command's reach and
the slot is not the user; the dead flag set and the command lacks bit 0x40. **Bit 0x40 is "can target the dead", not "hits flying".**

**Reach** (0x00799690): the two-bit field at bits 7 and 8 of the u16 at `Cmd+0x1a`, except that a command with bit 0x200 has reach 3 for the actors 4, 8 and 13 only.

**Picker** (0x007acd40): the candidates are the set bits 0 to 30 of the mask, ascending; none reports 0xff and draws nothing, one reports it and draws nothing, n >= 2
draws once from the given stream and takes the candidate of rank `value mod n` (the value is the stream's 31-bit output). **Group pick** (0x00799910): count the mask's
members per enemy group (0 to 7); with no member return 0 and draw nothing; otherwise **always draw once from stream 5** (also when one group is populated), take the
populated group of rank `value mod populated groups` in ascending order and return all mask members of that group.

**Auto-target** (0x007996d0) for a user, a command and a side: the side is the argument, or, when negative, the command's (opposite side when `Cmd+0x1a` bit 1 is set, own
side when clear). For a party user a non-zero side means own side and zero means monsters; for a monster user it is the other way round. By target type: single, one
candidate by the picker on **stream 4**; group, the group pick (stream 5); all, the whole set; self, the user alone.

## 3. Forced turns (0x00799ac0, 0x00799d50; emulated)

The turn start (read) runs after Regen's tick and Doom's, and only for an actor that is not asleep. It tries **Provoke** (permanent bit 0x400) first, then **Berserk**
(0x200), then **Confuse** (0x100); after a Berserk or Confuse call, and after a Provoke call that returns non-zero, the actor neither runs its script nor opens a menu.
Each call queues the actor's **default attack** (`Chr+0x6c6`):

- **Berserk aims at the opposite side, Confuse at its own side, the actor included.** Confuse never swings across the field. A single-target default attack picks one
  candidate on stream 4 (none drawn with one); a group-target one picks a populated group on stream 5; an all-target one takes the whole set; a self-target one the actor.
  When the attack id is 0 or the set is empty the turn is dropped (an empty record is queued and the actor does nothing).
- **Provoke** is a forced turn, not a redirect. The provoker is tested first: one that is out of battle, has the dead flag set or is Petrified has the Provoke bit
  cleared and nothing is queued (the call returns 0 and the script runs), whatever else is true of the actor. Only after that passes does a non-zero "keeps control when
  Provoked" byte make the actor ignore the forced attack (the bit stays set). Otherwise the legal set of the **provoker's** side is built for the default attack; if it does
  not contain the provoker the record is empty; else a single or self default attack goes to the provoker alone, a group one to the legal members of the provoker's group,
  an all-target one to the whole legal set. No draw anywhere in the Provoke turn.

## 4. Streams

Stream 4 is the single-target auto-pick (the Berserk and Confuse pick, a script's random-target call), stream 5 the spread and the group pick, stream 6 the Reflect
bounce. They are constants in each call, not per actor. (`anchors.md` of the earlier lane had the Berserk/Confuse pick on stream 5: wrong.)

## 5. What the engine did, and what changed (RC4 lane FFX-G, slices G-a and G-b)

| # | Rule | Engine before | Wired in |
|---|---|---|---|
| G1 | Reflect destination | a random living member of the side opposite the holder, always | the target builder (§1 step 3): back to the caster for an opposite-side holder |
| G2 | Which commands bounce | the `reflectable` flag, never an all-target row | the record bit, per target (Hastega, Slowga, the Nul spells, the monster elementals, Life, Full-Life and Scan bounce) |
| G3 | Cover choice | party side: the first Guard or Sentinel holder, no can-act test; enemy side: the highest HP with the Guard mark | the best score of §1.1, lowest slot on ties, must be able to act, for either side |
| G4 | Cover timing | re-decided for every hit | once per action, when the targets are built |
| G5 | Enemy Cover's can-act | in the turn queue, not asleep, not Threatened | also not Confused, Berserk or Provoked |
| G6 | Random spread | a fresh pick for every hit from the living, always one draw | all picks first from the action's target set, a draw only with two or more candidates (stream 5), zero-hit members still targets |
| G7 | Confuse | a random living actor of either side except the actor | own side only, the actor included (stream 4 for a single-target default attack) |
| G8 | Berserk | a random foe, always one draw, no legality | the opposite side's legal set, stream 4 only with two or more candidates |
| G9 | Provoke | replaced the target of whatever the script chose | the Provoked actor's whole turn becomes its default attack at the provoker (the script does not run); a gone provoker clears the bit; scripts that keep control are unchanged |
| G14 | Tidus counters | none | the seven counters of §1.1 |

## 6. Open (not used as facts)

1. Which actors, in which scripts, set the target class, the "only targetable by" id or Targetable 0 for part of a fight: the engine's `untargetable` and `hidden`
   flags are its approximation, and the class test is not modelled (G13: needs script data).
2. What a spread hit does to a target that is already dead when its turn comes (the hits are fixed up front; the per-hit step was not run end to end).
3. The Tidus counter reader (0x007b7d00, largest counter among slots 0 to 6): its caller, through a call table, was not traced.
4. Whether the counters (the global array) carry across battles: the engine starts them at 0 in every battle (the game's array is global, reset point not read).
5. Which monsters set "keeps control when Provoked": the engine reads it from the boss scripts' notes (`research/re-ffx-ai-seymour.md` m126 init, `re-ffx-ai-yunalesca-bfa.md`
   section 1.7, `re-ffx-ai-gui.md` section 5); for every other monster in the project it is taken as 0.
6. Counters (G10, G11), the chain flag, reach beyond the Chapter XII path (G12) and the multi-hit counter queue: answered and built in slice G-c, §7 and §8 (2026-10-15).

## 7. Counters (0x0078c1d0, 0x0079e340, 0x0078d8d0; emulated, 28,000 + 20,000 + 14,000 vectors)

**The order of the game.** A command is worked out **before it is applied**: the command orchestrator (0x007892e0) builds the targets (§1), then for each target the per-target
step (0x00789740) loops **all** of the target's hits through the per-hit pipeline (0x0078e630), which writes one hit record per hit. Only afterwards are the records applied,
**one hit per call** (0x0078f060, read). Two calls of the counter-kind function sit in the per-hit pipeline: one at the start (it never arms; its answer feeds the hit check) and one
at the end.

- **Kind** (0x0078c1d0). 0 when the command is not single-target (target-type bits 0), when the attacker's `Chr+0xdf1` is non-zero (the attacker is itself running a reaction: 1 for every
  queued reaction, 0 for a turn), when attacker and target are the same id, or when the byte at VA 0x0112ca12 is 0 (1 at every battle start; only eleven Belgemine duel scenes write 0,
  none a chapter of the project). Otherwise by damage kind: physical, Evade and Counter (bit 0x10 of `Chr+0x6bc`) gives **2** and wins over Counterattack (0x08, kind **1**); magical,
  Magic Counter (0x20) gives 1; any other kind gives 0. Kind 2 is the forced miss of the hit check, in a check that rolls only (§1 of the source note, unchanged).
- **Arming.** The end-of-hit call arms the target's one "counter armed" byte (`Chr+0x6dc`) when the kind is not 0 and the command is harmful. The call is made for a hit, a miss, a
  forced miss and a Nul-nullified hit; **not** for the "no effect" outcome (the hit check's first answer, a Phoenix Down on a living target). The byte is one byte: a second hit of the
  same command arms it again, which counts for nothing once it has been cleared.
- **Harmful** (0x0079e340): never with the restorative flag (`Cmd+0x20` bit 4); otherwise any damage class (`Cmd+0x23` and 7: HP, MP, CTB); or a non-zero chance of any of the twelve
  permanent statuses (all flagged); or a non-zero chance **and** a non-zero duration for Sleep, Silence, Darkness or Slow (the four temporal statuses flagged); or an Eject, Curse or Doom
  bit of the extra-status word (`Cmd+0x54`). Haste, Shell, Protect, Reflect, Regen and the Nul spells do not count. The flags are bit 7 of byte 3 of each status's behaviour entry, read from the game's own tables.
- **Queue** (0x0078d8d0), called by every apply call whose target is armed: when the holder **can act** (the can-act of §1.1 with in-battle, not-Provoked and not-Threatened required) it
  queues an action record: actor the holder, command the holder's `Chr+0x6c6`, target mask the attacker alone (bit `id & 31`), priority 0, kind 1 (a reaction); **the armed byte is cleared
  whether or not it queued**. There is no chance roll and no draw anywhere in the chain. The death check at the end of the apply call removes a dying holder's queued actions.

**Open question 10 of the source note, answered by reading (2026-10-15).** The per-target step computes every hit of a target before any is applied, so the armed byte is set once, by
the hits together; the first apply call queues the counter and clears the byte; the later apply calls of the same command find it clear. **A target answers once per command, whatever
its hit count.** (Each sub-command of an action, e.g. each spell of a Doublecast, is its own calculation and its own answer.) A row whose script names one target per hit is one command per hit.

**Open question 4 of the source note, answered by reading (2026-10-15).** A scan of every memory operand with the displacement 0x6dd and 0x446 in the whole executable finds one reader of
`Chr+0x6dd`: the character's position getter (0x007948e0), which adds an offset to the world position when the byte is set; its writers are the target builder, the death check, this queue
and the end of the apply call. `Chr+0x446` is the script property `stat_command_type` (id 0xe0), read by the animation and camera helpers (0x007b75c0 to 0x007b77c0, 0x007dbee0) and the
script getter. **Neither changes a rule: they are presentation.**

**Row 17 (the holder's own default attack), answered by reading.** The character initialiser (0x0079b4f0) writes the **constant 0x3000** into `Chr+0x6c6` in its non-monster branch (VA
0x0079b68d: every party member and every aeon) and the monster's record word `R+0x70` in its monster branch (VA 0x0079ba19); a scan of the whole executable for stores through the field's offset finds no other writer, and four readers (the Berserk damage step, this queue, the Berserk and Confuse turn, the Provoke turn). So the note's "aeons differ" is wrong: an aeon's counter is
also the 0x3000 Attack. Only a monster has an own default attack, and no monster holds a counter: the monster branch zero-fills `Chr+0x6bc` (the zero-fill covers 0x540 to 0x72b), so a
monster could hold one only if its script wrote the auto-ability property; no script of the project's formations is known to.

## 8. Reach as a 4-level rule, and what the engine does now (RC9 lane FFX-G slice G-c)

**Reach** (0x00799690, §2) is read from the record's target word (`Cmd+0x1a` and `Cmd+0x1b`). `kernel/command-reach-table.ts` carries the word of all 979 records of the game's command
table (counts by reach 204 / 8 / 638 / 129, as the source note gives; a test pins them), and `reach.ts#reachOf` reads it. A command can pick a target when its reach is at least the target's
BattleDistance, or when the target is the user. The distances the project knows: Sinspawn Gui's head **1**; the four Mortiphasm discs **2** (the formation script's battle-start worker writes
BattleDistance 2 on each disc: sins03_00 offsets 0xc23e, 0xc26e, 0xc29e, 0xc2ce, lines 9906 to 9918 of its disassembly, read; recorded in `research/re-ffx-ai-seymour.md` section 5.1); Sin's Genais Core **3** until Genais falls, then 0
(`research/re-ffx-ai-evrae-yojimbo-isaaru-sin.md`, Genais and the Core).

| # | Rule | Engine before | Wired in |
|---|---|---|---|
| G10 | When a counter fires | counters only for targets that took HP damage above 0 or MP damage; no single-target, harmful or can-act test; answered while asleep, Threatened, Petrified ...; a multi-target command's damaging hits counted | the chain above: armed by every outcome but "no effect", single-target and harmful commands only, can-act at the first hit, once per command, never against a reaction (`counter-chain.ts`) |
| G11 | The counter command | the generic Attack | unchanged in effect: the holder's own default attack is 0x3000 for every party member and aeon (§7), which is the engine's generic Attack; a monster holds no counter |
| G12 | Reach | Gui head: "reach 0 falls short"; Chapter XII discs and the Genais Core: `outOfMeleeReach` ("physical only from Wakka, Valefor, Anima, Mindy; every non-physical command reaches") | the 4-level rule with the distances above. Visible: Steal and the reach-1 commands no longer reach a disc; items and Valefor's Energy Ray (reach 2) no longer reach the Core while Genais stands |
