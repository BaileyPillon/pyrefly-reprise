# FFX turn order (CTB) and status infliction: what the game code does

**Game case: FFX only.** FFX-2 times its turns with its own ATB gauge and has its own status functions in its own exe;
they get their own notes. Part of the `re-parity` track ([docs/plans/re-parity.md](../docs/plans/re-parity.md)).
Drafted 2026-10-08.

**Source note (applies to every statement below unless a line says otherwise):** FFX.exe Steam build 25501027
(SHA-256 0537B2A1...686D), the HD Remaster's 32-bit executable, image base 0x00400000; every "VA" below is a virtual
address in that image. Read in Ghidra 12.1.4, both the decompiler and the disassembly. The one data file the CTB code
reads at run time, the CTB base table `ctb_base.bin` (530 bytes, SHA-256 starts 72eaa7b3d049d8b1), comes from the
battle kernel folder of the same install's archive. Everything is written in our own words: no game code and no game
text is reproduced here.

| This note | Kernel (pure TypeScript; wired into the FFX engine in W2, see §15) | Tests |
|---|---|---|
| §1 the CTB base table, tick speed | `src/battle/ffx/kernel/ctb-table.ts`, `ctb.ts` | `tests/unit/parity-ffx-ctb.test.ts` |
| §2 action rank, recovery, Haste and Slow on a value, revive | `kernel/ctb.ts` | same |
| §3 opening counters of a battle | `kernel/ctb-init.ts` | same |
| §4 the scheduler, the tie key, the sort | `kernel/ctb-scheduler.ts`, `kernel/ctb.ts` | same |
| §5 CTB damage: Delay, Threaten, delay immunity, the Haste and Slow commands | `kernel/ctb.ts` (re-exports `aftermath.ts`), `kernel/damage.ts` formula 0xd | `parity-ffx-ctb.test.ts`, `parity-ffx-hitdamage.test.ts` |
| §6 status infliction and cleansing | `kernel/status-inflict.ts`, `kernel/status-types.ts` | `parity-ffx-status-inflict.test.ts` |
| §7 extra statuses, shatter, Doom, stage buffs, Double HP and MP | `kernel/status-extra.ts`, `kernel/status-pool.ts` | `parity-ffx-status-inflict.test.ts`, `parity-ffx-status-pool.test.ts` |
| §8 durations: where they come from and how they tick | tables in `status-types.ts`; the tick functions are ported in §14 | |
| §14 the per-turn ticks: end of turn, start of turn (Regen), the Threaten link, Poison, Doom, action done | `kernel/turn-ticks.ts` | `tests/unit/parity-ffx-turn-ticks.test.ts` |
| §9 every random draw, in one table | | |
| §10 differences against the engine today | | |
| §11 what the engine has to supply | | |
| §12 corrections to the anchor map, §13 open questions | | |

## 0. How this was checked

1. Each function's decompile and disassembly were read for operand widths and signedness (the decompiler hides the
   difference between a signed and an unsigned compare, between `movzx` and `movsx`, and between a truncating divide and
   a shift). The reads that mattered: the frame counter and its period are compared as **signed bytes**; the hold counter
   is a signed byte; "Haste halves" is a signed divide that truncates toward zero; every CTB counter is a byte and its
   adds wrap; the hit-record byte that feeds Double HP/MP is read with `movzx` (the decompile shows a signed char).
2. The real machine code of every function below was run in the `re-parity` harness (Unicorn, x86-32, the exe's own
   addresses and the real CTB table loaded from the data file) on generated inputs, with only the RNG function replaced
   by a script (so every draw can be chosen and logged), and every result was compared with the TypeScript kernel. Two
   rounds with different seeds; the second was run by the lane that finished this work, with new random inputs and
   new scripted draws, and the kernels were not changed between the rounds:

   | Function | VA | Vectors per round | Differences |
   |---|---|---:|---:|
   | tick speed and opening bound, every Agility 0 to 259 plus 8 wild values | 0x7909c0, 0x790990 | 268 | 0 |
   | Haste and Slow on a value (counters 0, 1, 255; values from -2^31 to 2^31) | 0x78c150 | 3,843 | 0 |
   | recovery for a rank (ranks -5 to 255, Haste and Slow) | 0x78d1d0 | 3,276 | 0 |
   | tie-break key (31 ids, 16 Agilities) | 0x78f000 | 496 | 0 |
   | ready-list sort (up to 31 ids, equal and distinct Agilities) | 0x78d3e0 | 600 | 0 |
   | CTB amount applied to a counter | 0x78e1e0 | 378 | 0 |
   | rank of an action (command lookup replaced by a table of rank bytes) | 0x7895b0 | 700 | 0 |
   | stage buffs | 0x78d730 | 1,500 | 0 |
   | initial CTB: every start type, First Strike, Haste, Slow, aeon flags, draws and streams | 0x78ded0 | 1,200 | 0 |
   | scheduler: ready list, queued turn, tick, counters, hold, signed-byte edges | 0x790fb0 | 2,500 | 0 |
   | revive, the counter only | 0x78d530 | 400 | 0 |
   | status infliction and cleansing, all 25 statuses | 0x78ae00 | 36,000 | 0 |
   | extra statuses and shatter | 0x78b4e0 | 13,280 | 0 |
   | Double HP and Double MP (one round) | 0x78d270 | 12,048 | 0 |

   The status vectors check the draws as well: the kernel must call `draw` exactly as often as the machine did, on the
   machine's stream, and receive the machine's values. The vector files and the scripts that make them are outside the
   repo (`D:\Tools\ffx-parity\kernel-check-ctb-status\`; the second round and the checks below are in its `review\`).
   `tests/fixtures/parity/ffx/` holds stratified subsets of at most ~250 KB each, which the repo tests replay:
   `ctb_small.json` 2,484 vectors, `ctb_init.json` 129, `ctb_scheduler.json` 164, `status_inflict.json` 267,
   `status_extra.json` 395, `status_pool.json` 361. Each stored answer is the machine's own (status inputs were first
   cleaned of fields the function does not read for that vector and re-run, and the answer compared with the uncleaned
   run).
3. **Mutation check.** 104 single changes were made to a scratch copy of the kernels (a comparison turned from `<` to
   `<=`, a modulus of 101 turned into 100, a clamp removed, the Haste/Slow order swapped, a mask changed, a draw
   skipped, and so on) and the repo's parity tests run against each. 100 are caught by the repo tests. Four survive and
   all four are changes that cannot alter any answer: First Strike's zero applied after Haste instead of before it
   (0 / 2 = 0); the 31-bit mask the initial-CTB kernel puts on a draw (the game's draw never has bit 31); clearing the
   Threaten bit of a record when Haste lands (the code has just checked the bit is clear); and wrapping the doubled base
   HP to 32 bits before the clamp (the clamp wraps it anyway). The first run of the check found two real gaps in the
   fixtures (a never-written slot that is in the battle, and the bits of the extra word that Petrify keeps); both were
   closed with machine vectors (class `edge_*` in `ctb_init.json` and `status_inflict.json`) and hand-worked tests.
4. The facts that decide the tables were read straight from the image: the three status behaviour tables
   (VA 0x00c423e8, 0x00c42420, 0x00c42464), and from the data file the 255 records of the CTB table; the TypeScript
   constants were compared with both.

**Notation.** `Chr+0xNNN` is an offset into the battle character structure (stride 0xF90; the array pointer is at VA
0x011334d4; ids 0..7 party, 8..0x11 aeons, 0x14..0x1b monsters; the monster slots are `Chr(0x14 + k)`, the array
pointer at VA 0x01134468 being the same array 0x13740 bytes in). `Cmd+0xNN` is an offset into the 0x5c-byte command
record. `Rec+0xNN` is an offset into the 0x2c-byte hit record, a per-target snapshot of the target's statuses taken when
the action starts: `Rec+0x07` to `Rec+0x13` copy the thirteen turn counters `Chr+0x608` to `Chr+0x614` (so +0x07 is
Sleep and +0x12, +0x13 are Haste and Slow), `Rec+0x14` copies the permanent status word `Chr+0x606`, `Rec+0x16` the
extra status word `Chr+0x616`, `Rec+0x06` the buff byte `Chr+0x640`. All arithmetic is 32-bit; stat and counter bytes
are read as unsigned bytes. "User" is the attacker, "target" the defender.

## 1. The CTB base table and tick speed (VA 0x007909c0, 0x00790990, 0x007ab870)

`ctb_base.bin` is a table in the game's generic record format: a 20-byte header (one section: first record 0, last
record 254, record size 2, data at offset 20) and then 255 records of two bytes. The generic reader is VA 0x007ab870.

- **Tick speed** (0x007909c0) is byte 0 of record `clamp(AGI, 1, 255) - 1`: Agility 0 reads Agility 1's record. `AGI`
  is `Chr+0x5ac`, the current Agility byte, so 0 to 255 are the only inputs in play; the function itself clamps any
  32-bit number the same way (a negative number reads record 0, a number above 255 reads record 254).
- **Opening bound** (byte 1 of the same record; the pointer to the record is 0x00790990) is used only by the initial CTB
  of party members and aeons (§3).

The table, by plateau (identical to the engine's `ICV_BASE` breakpoints; all 255 rows of both bytes equal the engine's
`ICV_BASE` and `ICV_VARIANCE` tables, 0 mismatches):

| Agility | 1 | 2 | 3 | 4 | 5-6 | 7-9 | 10-11 | 12-14 | 15-16 | 17-18 | 19-22 | 23-28 | 29-34 | 35-43 | 44-61 | 62-97 | 98-169 | 170-255 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| tick speed | 28 | 26 | 24 | 20 | 16 | 15 | 14 | 13 | 12 | 11 | 10 | 9 | 8 | 7 | 6 | 5 | 4 | 3 |

The opening bound counts 1, 2, 3, ... inside each plateau (capped at 9), one step per Agility up to 43, one per 2 for
44 to 61, per 4 for 62 to 97, per 8 for 98 to 169 and per 16 for 170 to 255 (the last plateau ends at 6 because the table
ends). The full rows are `CTB_TICK_SPEED` and `CTB_ICV_BONUS` in `kernel/ctb-table.ts`.

## 2. Action rank, recovery, Haste and Slow on a value, revive

**Rank of an action** (0x007895b0; stored in `Chr+0xde8` by the damage orchestrator 0x007892e0 before any hit is worked
out, so a Threaten landing in that action sees it). An action holds up to two command ids. For each id that is not 0xff,
in order: if the user's byte `Chr+0x6de` is not 0 the id becomes 0x3028 (Copycat); the record for the id is looked up
(0x0078ce50: item, command, monster-magic 1 or 2 tables by the top nibble of the id); the scan **stops after** 0x3029
(Doublecast), 0x305f (Quick Pockets) or 0x311e (Mix). The rank is `Cmd+0x24` of the **last record found**, and **3** when
none was found or that byte is 0. So a Doublecast action costs Doublecast's own rank and ignores the spell's. Examples
from the game's tables: Attack 3, items 2, Escape 1, Haste 4, Hastega 6, Slow 3, Slowga 4, Mix 5.

**Haste and Slow on a value** (0x0078c150): `v = value`; if the Haste counter (`Chr+0x613`) is not 0, `v = v / 2`
(truncating toward zero); if the Slow counter (`Chr+0x614`) is not 0, `v = v * 2`; the result is clamped to 0..255.
Both can apply (half, then double: 85 gives 84, not 85). A counter of 255 (an equipment-given status) counts like any
other non-zero value.

**Recovery** (0x0078d1d0): `HasteSlow(tickSpeed(AGI) * max(rank, 1))`, with the actor's **current** Agility and the
Haste/Slow counters it has at that moment. A rank below 1 counts as 1. Examples: AGI 10 (tick 14) at rank 3 pays 42,
hasted 21, slowed 84; AGI 12 (tick 13) at rank 3 pays 39, hasted 19 (39 / 2 = 19.5), slowed 78; AGI 1 (tick 28) at rank
10 would be 280 and is clamped to 255.

**When it is paid** (0x007b20e0, action done): the actor's counter becomes `(counter + recovery) mod 256`, a **byte
add**. The Haste/Slow counters used are the ones after this action's own results were copied back, so a Haste an actor
casts on itself already halves the recovery of that same action. Nothing clamps this add; an actor normally acts at 0,
so its counter simply becomes the recovery.

**Revive** (0x0078d530): the counter is set to `Chr+0x65d`, the **stored** base value (`3 * tick speed` computed from
the Agility when the battle started or when the character was last refreshed by 0x007a89c0), not recomputed from the
present Agility. The same function puts HP at 1 if it was below 1 and clears the Death bit.

## 3. Opening counters of a battle (VA 0x0078ded0)

Called once per battle with the start type: 0 normal, 1 preemptive, 2 ambush; any other number behaves as normal (the
code tests `== 1` and `== 2`). The start type itself is rolled by 0x0078d090 (`kernel/rolls.ts`).

1. For **every one of the 31 slots**, `Chr+0x65d` (the base ICV) is set to `tickSpeed(AGI) * 3` as a byte.
2. Slots 0..0x11 (party 0..7, aeons 8..0x11), in id order, each get a starting value:
   - preemptive: 0; ambush: the base; normal: `base - draw % (bonus + 1)` where `bonus` is byte 1 of the slot's
     Agility record and the draw comes from the slot's mode 0 stream (`rngStreamIndex(id, 0, isAeon)`: party 20 + id,
     **every aeon 27**, the same stream as party slot 7);
   - a slot whose `Chr+0x6bc` has bit 1 (First Strike) is forced to 0 **after** the draw (the draw is still spent);
   - then Haste halves and Slow doubles the value (0x78c150 above), so both sides can be hasted or slowed at the start.
3. Monster slots 0x14..0x1b, in order: preemptive: the base; ambush: 0; normal: `base * 100 / (100 - draw % 11)` with
   a truncating divide (the monster is 0 to 10 percent slower than its base), the draw from stream `id + 8`; then First
   Strike, Haste and Slow exactly as above.
4. The smallest value among slots that are in the battle (`Chr+0xdc8`) and were written in steps 2 and 3 is taken, and
   **subtracted as a byte** from the counter of every slot in the battle, 0..0x1e. The function returns that minimum, or
   -1 when no written slot is in the battle. Two consequences that the vectors confirm: a slot the function never
   writes (0x12, 0x13, 0x1c to 0x1e) that is in the battle keeps its old counter minus the minimum as a byte (it wraps
   below 0), and with a minimum of -1 such a slot's counter goes **up by one**.

**The draws are not conditional on who is present.** A normal start spends 18 + 8 = 26 draws in a fixed order (slots
0..0x11, then the eight monster slots), empty slots included, and a preemptive or ambush start spends none. Every aeon
slot carries the aeon bit (bit 2 of `Chr+0x590`): the battle-start function 0x0079c110 runs the character initialiser
0x0079b4f0 for all eighteen party and aeon slots whether or not they are in the battle, and it copies the bit from
byte 0x10 of the party ROM record, which is set for slots 8..0x11 and clear for 0..7. So the ten aeon slots all draw
from stream 27, which therefore advances 11 times at battle start (slot 7 plus ten aeons).

Worked example (`parity-ffx-ctb.test.ts`): Tidus AGI 10 (tick 14, base 42, bound 1), Yuna AGI 12 (13, 39, 1), Auron AGI
15 (12, 36, 1), one monster AGI 5 (16, base 48), normal start, party draws 5, 8, 3 and monster draw 7: Tidus
`42 - 5 % 2 = 41`, Yuna `39 - 8 % 2 = 39`, Auron `36 - 3 % 2 = 35`, monster `4800 / (100 - 7 % 11) = 4800 / 93 = 51`;
the minimum is 35, so the counters are 6, 4, 0 and 16.

## 4. The scheduler (VA 0x00790fb0), the tie key (0x0078f000), the sort (0x0078d3e0)

The scheduler is called once per battle frame by `pp_BtlFrame` (0x00790c10). One call:

1. Does nothing (returns 0) when the pause byte (VA 0x0112a8e1) is set or an action is queued (VA 0x0112bde0 is not
   0); otherwise it always returns -1.
2. Clears the ready list and walks the 31 slots in id order. A slot is **ready** when it has no queued action
   (`Chr+0xde6` = 0), is in the battle (`Chr+0xdc8`), not dead (`Chr+0xdcc`), not Petrified (`Chr+0x606` bit 2), has
   counter 0 (`Chr+0x65c`) and gets turns (`Chr+0xdd6`). If the **script hold** is on when the first ready slot is found,
   the call ends there: no sort, no turn, no tick. The hold is: the scene value at VA 0x00c64ca0 equals 0x1ad, or the
   command in progress (VA 0x0112c8d8) is one of six ids (0x3022, 0x3108, 0x312c, 0x403c, 0x4125, 0x60bd; what the
   scene value and the six stand for was not traced), **and** the signed byte at VA 0x0112c9d1 is above 0.
3. The ready list is sorted by the tie key (below). If it is not empty, the first slot's turn is queued (0x007b2430
   adds one to `Chr+0xde6`) and the call ends: **nobody's counter moves on a call that found someone ready.**
4. If nobody is ready, the frame counter (byte VA 0x0112bde2) goes up by one; when it reaches the period (byte VA
   0x0112bde3, written once with 1 at 0x00781b61 in the start-up function 0x00781700; compared as signed bytes) it is
   reset to 0 and the **clock ticks**: every slot that has no queued action, is in the battle, is not dead and is not
   Petrified
   - gets its Regen tick counter (`Chr+0x6d2`) plus one, saturating at 255;
   - loses 1 from its counter; when the result is 0 or less the counter becomes 0, the rank `Chr+0xde8` is reset to 3,
     and, **if the slot does not get turns**, the counter is set back to its base `Chr+0x65d` instead; the debug
     switch at VA 0x0112a8fb makes a counter that would stay above 0 become 1.

So the CTB counters count down **one point per tick per character**; there is no "subtract the minimum" step after the
opening. A tick is one scheduler call (with a period of 1); the real time of a call is the frame period of the scene
loop and is **not** derivable from the exe alone.

**Tie key** (0x0078f000). Smaller goes first. A slot that is not a monster (`(id & 0xff) - 0x14 >= 8`: party and aeons):
`(255 - AGI) * 256 + id` (higher Agility first, equal Agility to the lower id). A monster (ids 0x14..0x1b): `id + 0x10000`
(after every party member and aeon, in id order). The sort is a selection sort with a strict `<`, so the first of equal
keys stays first (keys of distinct ids are never equal).

Example: Tidus (id 0, AGI 10), Yuna (1, 12), Auron (2, 15) and a monster (0x14) all at 0. Keys: Tidus `245 * 256 + 0 =
62720`, Yuna `243 * 256 + 1 = 62209`, Auron `240 * 256 + 2 = 61442`, monster `65556`. Order: Auron, Yuna, Tidus, monster.

## 5. CTB damage: Delay, Threaten, delay immunity, the Haste and Slow commands

CTB is the third damage **class** of a hit (class bit 4; HP is 1 and MP is 2). The per-hit pipeline is in
`research/re-ffx-damage.md` §3; the CTB-relevant steps, in its order:

1. **Base CTB damage** (class 4) with the command's formula; for Haste and Slow it is formula 0xd, below.
2. **Delay Attack / Delay Buster** (0x0078e0f0): `Cmd+0x1c` bit 0x2000 (k = 1, Delay Attack) or 0x4000 (k = 2, Delay
   Buster; the stronger wins) adds `tickSpeed(target AGI) * 3 * k / 2` (truncating) to the CTB amount and turns the CTB
   class on in the result word. Target AGI 10 gives 21 and 42; AGI 12 gives `13 * 3 / 2 = 19`.
3. **Threaten ignores delay** (0x0078bd50): when the CTB class is on and the target's **snapshot** (`Rec+0x14`) has
   the Threaten bit (0x800), the amount becomes 0 and the CTB class leaves the live-class word.
4. The status steps (§6, §7). Threaten's own landing writes the CTB amount; a failed Haste or Slow zeroes it.
5. **Delay immunity** (0x0078c180): a target with `Chr+0x5b9` bit 0 gets amount 0, unless the Threaten flag from step 4
   is set (Threaten's own delay bypasses it).
6. The amounts are clamped to ±9999 (±99999 with Break Damage Limit) with the other classes, recorded in the hit
   record, and applied after the action by 0x0078f060 through **`SubCtb`** (0x0078e1e0): `counter =
   clamp(counter + amount, 0, 255)`. A positive amount delays, a negative one hastens.

**Haste and Slow as commands.** There is no code that rescales a counter "when the status lands": the rescale is the
command's own CTB damage. Haste (command 0x3036), Hastega (0x3037) and the Chocobo Feather and Wing items are damage
class 4, formula **0xd**, power 8, with the heal flag; Slow (0x3038), Slowga (0x3039) are class 4, formula 0xd, power 16,
no heal flag; the Silver Hourglass is the same formula with power 8 and no heal flag. Formula 0xd is
`runningCtb * power / 16` (truncating), where `runningCtb` is `Chr+0x6ec`, the target's counter as the action started
(reduced by earlier hits of the same action). So Haste is `-(ctb * 8 / 16)` (halves, rounding the removed part down) and
Slow is `+ctb` (doubles); the sum is then clamped to 0..255 by `SubCtb`. Example: counter 45: Haste `45 * 8 / 16 = 22`,
counter 23; Slow, counter 90; counter 200 slowed would be 400 and is 255. Like every damage class the CTB class spends
its **variance draw** first (user's mode 0 stream), although formula 0xd ignores the value, so a Haste or Slow takes one
draw per target hit. **If the Haste or Slow status does not take effect, the CTB amount is set to 0** (§6), so the
counter does not move.

**Threaten's own CTB write** (inside 0x0078ae00, §6): the amount becomes `delay + userCounter - targetCounter`, with
`delay` the recovery (§2) of the user's Agility, Haste/Slow and the rank of the action in progress. The target's
counter therefore becomes `userCounter + delay`, which is exactly the counter the user will have when its own action
ends: the target is scheduled **at the same time as the user's next turn** (the tie key then orders them).

## 6. Status infliction and cleansing (VA 0x0078ae00)

Called once per hit per target by the per-hit pipeline (0x0078e630, call at 0x0078eb5a), after the damage classes and
before the extra-status step, unless a debug switch (VA 0x0112a906) is on. It edits the hit record `Rec`, not the
character; the game copies the record back after the damage is applied (0x0078f060). The step visits the 25 regular
statuses in order 0..24 (Death, Zombie, Petrify, Poison, Power Break, Magic Break, Armor Break, Mental Break, Confuse,
Berserk, Provoke, Threaten, Sleep, Silence, Darkness, Shell, Protect, Reflect, Nul-Tide, Nul-Blaze, Nul-Shock,
Nul-Frost, Regen, Haste, Slow). Status `i`'s **chance byte** is `Cmd+0x2e + i`, replaced by the larger of it and the
user's weapon byte `Chr+0x5de + i` when the command uses weapon properties (`Cmd+0x1c` bit 18). A status whose chance
byte is 0 is skipped entirely (no draw). The target's **resistance byte** is `Chr+0x641 + i`.

**Does it land?**

- A **cleansing** command (`Cmd+0x20` bit 5: Esuna, Dispel, Life, Phoenix Down, ...) always "lands" and **draws
  nothing**.
- Otherwise exactly **one draw** from the user's mode 2 stream is spent for the status, **before** the chance is
  looked at (so a chance of 255 or an immune target still costs one):
  - **Threaten (11)** is special: `draw % 100 < resistance byte`. The byte is a success percentage, not a resistance;
    a byte of 255 therefore always lands and a byte of 0 never does. A miss with a byte of 0 is treated as immune
    (see the pop-ups below).
  - every other status: `roll = draw % 101` (0 to 100). If it is Death and the **record** already has Zombie
    (`Rec+0x14` bit 1), the resistance is taken as 254. It lands when the chance is 255, **or** when the resistance is
    not 255 and (the chance is 254, **or** `roll < chance - resistance`, **or** the debug always-hit switch VA
    0x0112a90a is on). So chance 255 ignores everything, resistance 255 is immunity, chance 254 lands unless immune,
    and a chance of exactly 100 still fails on a roll of 100.
- A landing is refused outright when the debug never-hit switch (VA 0x0112a91f) is on.

**What landing does to the record** (first failing check wins; a refusal counts as "failed", below):

| Status | Refused when | Effect on the record |
|---|---|---|
| any of 0..11 | the record is Petrified, or the live word `Chr+0x606` already has the bit | |
| Death (0) | | bit set; `Chr+0x701` := 3 for command 0x30e2 (Zanmato), 4 for 0x3120 (the Doom kill) |
| Zombie, Poison, the four Breaks (1, 3 to 7) | | bit set |
| Petrify (2) | | the word becomes **only** Petrify; **all thirteen counters := 0** (permanent Haste or Slow included); extra word `&= 0x813f` (keeps Scan, the Distill bits, Eject, bit 15); a monster (id 0x14..0x1b at `Chr+0xc`), or any target when the battle flag VA 0x0112c9ce is set, also gets Death and Eject |
| Confuse (8) | `Chr+0x62a & 0xf00` (equipment-given Confuse/Berserk/Provoke/Threaten) | set, then `&= 0xf1ff` (removes Berserk, Provoke, Threaten) |
| Berserk (9) | same | set, `&= 0xf2ff` (removes Confuse, Provoke, Threaten) |
| Provoke (10) | same | set, `&= 0xf4ff` (removes Confuse, Berserk, Threaten); `Chr+0x5c4` := user id |
| Threaten (11) | same, or a Haste or Slow counter in the record is 255 | set, `&= 0xf8ff` (removes Confuse, Berserk, Provoke); **both** clock counters of the record := 0; the resistance byte becomes `max(1, byte * 7 / 10)` if it was not 0; result flag 4; `Chr+0x5c5` := user id; the CTB amount is written (§5); the Threaten flag is set |
| temporal (12..24) | the record is Petrified | see below |

**Temporal statuses** (12..24, Sleep to Slow) keep a turn counter in the record. The duration is `Cmd+0x47 + (i - 12)`,
replaced by the larger of it and the weapon byte `Chr+0x5f7 + (i - 12)` for a weapon command. On a self-cast
(user = target) the duration gains **1** when it is below 253 and the status ticks at the end of its holder's turn
(table flag 4, §8). A status is **not refreshed**: if the live counter `Chr+0x608 + (i - 12)` is above 0 the landing
fails. Then:

- Sleep: the counter is written and the Defend stance (extra bit 0x800) is cleared.
- Haste (23) and Slow (24): refused when either clock counter of the record is 255 or the record has Threaten; the
  counter is written, the **opposite** counter is cleared. A refusal (or a failed roll, or immunity) **sets the hit's CTB
  amount to 0**.
- the rest: the counter is written.

**Cleansing** a permanent status: refused on a Petrified record unless the status is Petrify itself; the bit must be in
the record and must not be equipment-given (`Chr+0x62a`); it is cleared. Removing Death counts as a revive. **Life on a
Zombie record kills it** (Death is set instead) unless the target is immune to Life (`Chr+0x5b8` bit 2). Cleansing a
temporal status **subtracts the duration byte from the counter** (clamped at 0); a counter of 0 or 255 is untouched
(a failure).

**Result counters.** Two arrays of eight integers (applied, removed) collect what happened: index 4 any change,
5 immune, 6 failed, 0/1 took effect without/with the class bit 0x40, 2 class bit 0x20, 7 class bit 0x80 (every bad
status), 3 in the removed array a revive. The class bits per status are the table bytes in `status-types.ts`
(`PERM_STATUS_FLAGS`, `TEMPORAL_STATUS_FLAGS`). A target with resistance 255 whose status did not land adds a pop-up
bit to the result word: Petrify 0x4000, Zombie 0x2000, Sleep 0x200, Silence 0x400, Darkness 0x800.

Worked examples (`parity-ffx-status-inflict.test.ts`): Poison with chance 100 against resistance 30 lands for a roll of
69 and not 70 (`roll < 70`); with resistance 0 it lands for 99 and not 100. A draw of `101 * 7 + 69` acts as 69, and a
raw draw with bit 31 set is cut to 31 bits first. Threaten with byte 70 lands for a draw of 69 and not 70, and the byte
becomes `70 * 7 / 10 = 49`.

## 7. Extra statuses, shatter, Doom, stage buffs, Double HP and MP

**Extra statuses** (0x0078b4e0, call at 0x0078eb7e) are the 16 bits of `Chr+0x616` (Scan 0, Distill Power 1, Distill Mana
2, Distill Speed 3, bit 4 unused, Distill Ability 5, Shield 6, Boost 7, Eject 8, Auto-Life 9, Curse 10, Defend 11, Guard
12, Sentinel 13, Doom 14). There is **no roll**. The wanted bits are `Cmd+0x54`, or for a weapon command the weapon's
`Chr+0x604` with bits 1 to 5 cleared when the command has any of them, OR `Cmd+0x54`.

1. **Shatter.** If the record is Petrified: **one draw** (user's mode 2 stream, `% 101`), spent whether or not the
   command has a shatter chance; `roll < Cmd+0x2c` adds Eject to the wanted bits and sets the Death bit in the record.
2. For each wanted bit, lowest first: a failure if the debug switch is on, or if the record is Petrified and neither
   Eject nor any of bits 0..5 is wanted. A **cleansing** command needs the bit in the record and not in the
   equipment-given word `Chr+0x62e`, then clears it (an Auto-Life also clears `Chr+0x5ca`). Otherwise: **immune** if the
   bit is in `Chr+0x65a`; **fails** if the character already has the bit (Scan, bit 0, can be re-applied) or if the
   equipment word has a Distill bit and a Distill bit is wanted; else it **lands**: a Distill bit clears the other four,
   Doom sets the countdown `Chr+0x5c8 := Chr+0x5c9` (the initial value: 5 for every party slot, the monster record's own
   byte for a monster), Eject also clears the Threaten bit, Auto-Life from a Magic Booster user (`Chr+0x6bc` bit 6) with
   a command of type 1 or 2 sets `Chr+0x5ca`.

**Stage buffs** (0x0078d730, call at 0x0078ebe7, not guarded by the debug switch): the six stacks Cheer, Aim, Focus,
Reflex, Luck, Jinx (`Chr+0x65e..0x663`) of the **target**; for each set bit of the low six of `Cmd+0x56` the stack gains
`max(Cmd+0x59, 1)` and is clamped to 0..5. No draw, and nothing in this function lowers a stack.

**Double HP and Double MP** (0x0078d270; callers: the hit-record copy-back 0x0078f060 with `Rec+0x06`, the status reset
0x0079a190 with 0, the party-stats builder 0x0079c5f0 with -1). The flags are bits 0 and 1 of the buff byte
`Chr+0x640` (the same byte holds Spellspring, the 9,999 hit, always-critical and the two Overdrive multipliers). The
third argument is a new byte to store, or a negative number for "no new byte": for each pool the old bit, the bit now in
force and whether a byte was given decide:

| bit in force | old bit | byte given | result |
|---|---|---|---|
| 1 | 1 | yes | nothing (already doubled) |
| 1 | any | no, or old bit 0 | maximum = `clamp(2 * base maximum, 0, cap)` |
| 0 | 0 | yes | nothing |
| 0 | any | no, or old bit 1 | maximum = the base maximum (`Chr+0x59c`, `0x5a0`), unclamped |

The current HP or MP is clamped to 0..maximum whenever the maximum is written. The caps are 9999 (HP) and 999 (MP),
raised to 99999 and 9999 by Break HP Limit and Break MP Limit (`Chr+0x6be` bits 9 and 10).

## 8. Durations: where they come from, how they tick

**Where a duration is written from.** The command record: byte `Cmd+0x47 + t` for temporal status `t` (§6), the weapon's
byte for a weapon command (larger wins). The game's tables show the conventions: **254 means "until removed"** (it is
never counted down) and is used by every player-cast Haste, Slow, Shell, Protect, Reflect and by the cure items;
**255** is the equipment-given permanent value; **Regen is 10** for the Regen spell (20 for some Mighty G versions);
the four Nul statuses carry **1**, which is one charge (their counters never tick); Sleep, Silence and Darkness from
weapons and items are 3 to 8; monster abilities use anything from 1 to 99.

**How they tick** (ported in §14; 0x007af390 and 0x007af4f0). The thirteen temporal counters have a behaviour byte
in the table at VA 0x00c42464 (byte 3 of 13 records): Sleep 0xac, Silence 0xcc, Darkness 0xcc, Shell 0x14, Protect 0x14,
Reflect 0x14, the four Nul 0x00, Regen 0x03, Haste 0x0c, Slow 0x8c. Bit 1 (value 1): the counter goes down at the
**start of its holder's own turn**; bit 4 (value 4): at the **end of its holder's own turn**; bits 2 and 8 fire an
event (a wake-up, a message) at those moments. A counter is only decremented while it is in 1..253, so 254 and 255 never
tick. So Sleep, Silence, Darkness, Shell, Protect, Reflect, Haste and Slow tick at the end of the holder's turn and
Regen at the start; the Regen **payout** is separate (0x007af4f0): at the start of *any* actor's turn every Regen holder
that is alive heals `(tickCounter * maxHP >> 8) + 100`, where the tick counter is the one the scheduler increments (§4).
Defend, Guard, Sentinel, Shield and Boost are cleared at the start of the holder's next turn unless equipment-given.

## 9. Every random draw, in one table

| Where | Draws | Stream | Expression |
|---|---|---|---|
| battle start type (0x0078d090) | 1 | 1 | `byte`, see `rolls.ts` |
| initial CTB, normal start (0x0078ded0) | 26, fixed order, present or not: slots 0..0x11, then 0x14..0x1b | slot's mode 0: party 20 + id, aeons 27, monsters id + 8 | party and aeon `draw % (bound + 1)`, monster `draw % 11` |
| initial CTB, preemptive or ambush | 0 | | |
| status infliction (0x0078ae00) | one per status with a non-zero chance byte, in order 0..24, none for a cleansing command | user's mode 2: 52 + id (aeon 59, monster id + 40) | Threaten `draw % 100`, the rest `draw % 101` |
| extra status (0x0078b4e0) | 1 if the record is Petrified, else 0 | user's mode 2 | `draw % 101 < Cmd+0x2c` |
| the CTB damage class of a hit (Haste, Slow and any command with class 4; `re-ffx-damage.md` §3) | 1 variance draw per hit when the command has power, after the HP and MP classes, unused by formula 0xd | user's mode 0 | `(draw & 31) + 240` |
| scheduler, tie key, Haste/Slow on a value, recovery, Delay's own amount, Threaten's CTB write, stage buffs, Double HP/MP, revive | none | | |

Order inside one hit (with `re-ffx-rng-hit.md` §7): hit check (mode 1), HP variance (mode 0), critical (mode 0), MP
variance, CTB variance, then the 25 statuses in order, then the shatter draw.

## 10. Differences against the engine today (main at 157562f8)

Wherever a row has numbers, the engine and the kernel were run on the same input (a temporary test, archived outside the
repo; for the end-of-turn tick, which is not a kernel, the table rule of §8 stands in for the game); the other rows are
read from the code. The frequencies come from playing the engine's own nine FFX chapters with the golden
line (the line `ffx-engine-golden.test.ts` plays), seeds 1 and 7, 18 battles and 2,648 turns, with the queue
instrumented. "Engine" is `src/battle/ffx/turnQueue.ts` unless another file is named; "game" is the kernel. None of this
has been changed; these are what the wiring batch has to settle.

| # | What | Where in the engine | Example (engine / game) | How often |
|---|---|---|---|---|
| C1 | **Ties.** The engine breaks ties with a fixed list (Tidus, Yuna, Auron, Kimahri, Wakka, Lulu, Rikku, aeons, enemies in formation order, Cid); the game orders party and aeons by Agility first (higher first), then id | `turnQueue.ts` 37 to 61, 120 | Tidus AGI 10, Yuna 12, Auron 15, a monster, all at 0: Tidus first / Auron, Yuna, Tidus, monster | 377 of 2,648 turns had the next actor tied with another; 76 of those involved two or more party or aeon members; in **10 turns (0.4 percent)** the game's key picks a different actor (Braska's Final Aeon 5, Anima 2, Yojimbo 2, Omnis 1). Assumes the engine's formation order is the game's monster slot order (not checked) |
| C2 | **Recovery has no clamp and Haste and Slow exclude each other** | `turnQueue.ts` 89 to 94 (no clamp; `else if` for Slow) | AGI 1, rank 10: 280 / 255; AGI 5 slowed, rank 8: 256 / 255; 85 with both counters set: 42 / 84 (half, then double) | Never in the 18 golden battles (largest counter 94, no recovery above 255); both counters at once is only possible through equipment |
| C3 | **Delay Attack and Buster add without the 255 clamp** | `turnQueue.ts` 147 | Yuna AGI 12 at counter 250, Delay Attack: 269 / 255 | Never in the golden battles (no counter above 94) |
| C4 | **Haste and Slow move the counter even when the status does not land.** The engine applies the formula-0xd amount in the damage step (`abilities.ts` 247 to 250) and only the status itself depends on the roll; the game zeroes the amount when Haste or Slow fails (already hasted or slowed, resisted, immune, Petrified, Threatened) | `abilities.ts` 247 to 250, 333; `turnQueue.ts` 157 to 166 | Slow (chance 100) on a target with resistance 100 at counter 30: 60 / 30; Haste on an ally who already has it, counter 40: 20 / 40; counter 200 slowed: 400 / 255 | 6 of the 12 Slow casts in the golden battles did not slow the target and **doubled its counter anyway**: 4 on a Yu Pagoda in Braska's Final Aeon (seed 7: 10 to 20, 14 to 28, 18 to 36, 15 to 30), 2 on Evrae (16 to 32, 2 to 4). None of the 41 Haste casts failed |
| C5 | **Opening Slow, monster Haste and monster First Strike are not applied.** The game halves and doubles every slot's start value and honours First Strike on any slot; the engine halves only friendlies, never doubles, and gives First Strike only to friendlies with the equipment ability | `turnQueue.ts` 196 to 203 | Tidus slowed at the start, three characters and a monster: 6 / 48 after the minimum; a hasted monster: 12 / 0 | Needs a combatant that starts hasted or slowed or a monster with First Strike; not measured |
| C6 | **The opening draws are not the game's.** One `int` per combatant present from one stream, versus 26 fixed-order draws from 18 slot streams (stream 27 eleven times). The jitter distribution is the same (bound table and `3b * 100 / (100 - d)` agree); the engine's `'scripted'` start (no jitter) is not a game concept and no chapter uses it | `turnQueue.ts` 182 to 208 | draw counts 4 / 26 | every battle (it matters for replay parity, P2 and P3, not for the numbers) |
| C7 | **Revive uses the current Agility**, the game the stored base from battle start | `turnQueue.ts` 169 to 173 | a revive after an Agility change | only if Agility changes mid-battle |
| C8 | **Threaten's delay is applied at the wrong time and by another mechanism.** The game adds `delay + userCounter - targetCounter` to the target's counter when it lands (so it ties the user's next turn); the engine leaves the counter and drops it to 0 when the user's next turn opens | `ticks.ts` 123 to 130 | Tidus AGI 10, rank 3, Threatens a monster at counter 20: stays 20 until released / 42 at once | Threaten never appears in the 18 golden battles |
| C9 | The tables agree: tick speed and opening bound for Agility 1 to 255 (0 mismatches against the game's data). Agility 0 differs (engine bound 0, game reads Agility 1's record: 1) but no combatant has it | `math.ts` 56 to 140 | | not a difference in play |
| S1 | **Draws.** The engine draws only for a status whose chance is below 254 against a resistance below 255, in the order of the ability's list; the game draws once for every status with a chance, in index order, and never for a cleansing command | `statuses.ts` 125 to 136 | Poison 255, Sleep 254, Slow 1: 1 draw / 3 | every multi-status command and every chance-254 buff or debuff (the Protect, Shell, Haste, Nul and Cheer lines of a battle); replay parity only |
| S2 | **Death against a living Zombie.** The engine raises the resistance to 255, so only chance 255 gets through; the game uses 254, so chance 254 also lands and 253 and below fail | `statuses.ts` 132 to 133 | Death with chance 254 on a Zombie: 0 of 400 land / lands | not measured; needs a monster Death with chance 254 (Death 0x404b, Hades Claws, Crush Spike, Passado, Heavenly Strike) on a Zombie |
| S3 | **Threaten byte of 255.** The engine calls it immune; the game's byte is a success percentage, so 255 always lands (a byte of 0 never lands, as in the engine's data) | `statuses.ts` 144 | byte 255: 0 of 400 / always | no shipped enemy uses 255 |
| S4 | **Confuse, Berserk, Provoke and Threaten exclude one another** (each removes the other three); the engine only lets Provoke and Threaten remove Berserk and Confuse | `statuses.ts` 205 to 209 | Provoke, Berserk, Confuse in turn: all three held / only Confuse | not measured; needs two of the four on one target |
| S5 | **Petrify** zeroes all thirteen counters, a permanent Haste or Slow included, and keeps the extra bits 0 to 5, 8 and 15; the engine keeps a permanent Haste or Slow | `statuses.ts` 231 to 234 | Petrify on a character with permanent Haste: Haste kept / wiped (whether equipment brings it back was not read) | Petrify landed 19 times in the golden battles; whether any target carried a permanent Haste was not checked |
| S6 | **Durations tick on a different list and at different moments.** The engine ticks Sleep, Silence, Darkness, Slow and Regen at the end of the holder's turn; the game ticks Sleep, Silence, Darkness, Shell, Protect, Reflect, Haste and Slow at the end, **Regen at the start**, and the Nul charges never | `statuses.ts` 29, 344 to 354 | Shell with a counter of 100 after five turn ends: 100 / 95; Haste with a counter of 4 after five: still there / gone after four | only finite counters matter: player spells use 254; finite Shell, Protect, Reflect and Haste come from monster spells (Mighty Guard with 6) |
| S7 | **Self-cast +1.** The engine never adds the extra turn | `statuses.ts` 96 to 110 | Silence of 3 cast on oneself: 3 / 4 | rare (a finite duration cast on oneself) |
| S8 | **Doom.** The game starts the countdown from `Chr+0x5c9` (5 for the party, the monster's own byte); the engine takes the ability's duration (254 for Kimahri's Overdrive and the Candle of Life, a placeholder) unless the enemy declares `doomTurns` | `statuses.ts` 222 to 224 | Doom on a party member: 254 turns / 5 | not measured (Doom landed twice in the golden battles; whether on an enemy with its own `doomTurns` was not checked) |
| S9 | **Double HP and MP.** The engine caps at 99999 and 9999 whatever the abilities, and removing the flag halves the current maximum; the game caps at 9999 and 999 unless Break HP or MP Limit, and removing it restores the stored base | `statuses.ts` 281 to 292 | base maximum 6000, Double HP: 12000 / 9999 | the golden battles applied Double HP 8 times; the cap bites only for a base above 4999 HP or 499 MP |
| S10 | Same in both: not refreshed while a counter is above 0; Haste and Slow cancel each other and a permanent one cannot be displaced; the chance-minus-resistance inequality and its 255 / 254 rules; stage buffs capped at 5 and surviving Petrify; Threaten's decay to 70 percent (never below 1) and its `draw % 100` | | | |

Not compared here: the order of draws inside a hit and the loop nesting (`re-ffx-rng-hit.md` §8 rows 8 and 9), the
ability ranks and chances in the engine's data against the game's command tables (data, wave P5), and the aeon summon
counters (open question 2).

## 11. What the engine has to supply to call the kernels

**CTB kernels** (`kernel/ctb*.ts`): the slot id of every combatant (party order Tidus 0, Yuna 1, Auron 2, Kimahri 3,
Wakka 4, Lulu 5, Rikku 6, then the aeons from 8 and the monsters from 0x14 in formation order), because the draw
streams, the aeon and monster tests and the tie key are all keyed by it; per slot the current Agility byte, the Haste
and Slow counters (any non-zero value counts, an equipment-given status is 255), the First Strike bit, in-battle, dead,
Petrified, the queued-action count, gets-turns, the counter, the stored base ICV, the Regen tick counter and the rank of
the last action; the scheduler globals (pause, queued actions, frame counter, period 1, the script hold); and the rank
byte of every command id (the engine's ability `rank` should be that byte, to be checked). Until the generator is
adopted (P3) a `draw(stream)` can hand back 31 bits from the engine's own stream while still being called with the
game's stream numbers and the game's call count.

**Status kernels** (`kernel/status-*.ts`): the command's 25 chance bytes and 13 duration bytes, shatter chance, extra
word, stage-buff mask and amount, and the cleanse, uses-weapon and type bits (plus the weapon's bytes for a weapon
command); the target's 25 resistance bytes (the engine's `immunities` map and `threatenChance` have to become bytes:
255 immune, and Threaten's byte is a success percentage), its live permanent word, 13 counters and extra word, the
equipment-given words, the extra-immunity word, the Life-immunity bit, Doom's initial value; and a **hit record**, the
snapshot of the permanent word, counters and extra word taken when the action starts and copied back to the combatant
after the action's damage is applied (the engine's named statuses with timers must be converted to and from it). The
result goes into `calcHitDamage` through `toStatusOutcome`; `provokedBy`, `threatenedBy`, `deathMarker`, `doomCounter`
and `bonusFlag` go back to the character, and the two counter arrays are presentation only.

**Double HP and MP** (`kernel/status-pool.ts`): the base maxima, the maxima in force, HP, MP, the buff byte and the
Break HP and MP Limit bits.

## 12. Corrections to the anchor map (`D:\Tools\ffx-parity\ffx\anchors.md`)

1. Anchor-map §7 says no code rescales the current CTB when Haste or Slow lands. It does, through the command's CTB
   damage class (this note §5); the hit step also zeroes that amount when the status fails.
2. Anchor-map §7 says the scheduler decrements "floor 0" and stops. Also: the rank resets to 3 at 0, a slot that does
   not get turns goes back to its base ICV, and the period and frame counter are compared as signed bytes.
3. Anchor-map §7, initial CTB: First Strike is applied after the draw (the draw is still spent), Haste and Slow apply
   to every slot, the 26 draws are made for empty slots too, and the final subtraction is a byte subtraction that also
   touches (and can wrap, or add one) the slots the function does not write.
4. Anchor-map §6, "a Petrified target takes no new statuses": the extra bits 0 to 5 and Eject still land on a
   Petrified record, and a cleanse works on a Petrified record only for Petrify itself.
5. Anchor-map §6, Death versus Zombie uses the **record's** Zombie bit (the snapshot taken when the action began), not
   the live word.
6. `pp_BtlActionRank` (0x007895b0): the scan stops after Doublecast (0x3029), Quick Pockets (0x305f) or Mix (0x311e),
   so the rank of such an action is that command's own.
7. `pp_BtlApplyDoubleHpMp` (0x0078d270): the hit-record byte it receives is unsigned (`movzx`); the two other callers
   pass 0 and -1.
8. `pp_BtlApplyStageBuffs` (0x0078d730) changes the **target's** stacks (the decompile hides the pointer the caller
   passes in a register).

## 13. Open questions

1. How long a tick lasts in real time: the scheduler runs once per frame of the battle scene loop; the frame rate was
   not derived. Also: the second reader of the scheduler globals, VA 0x007daed0, was not read.
2. The aeon summon and dismissal counters: `pp_BtlSummonCtb` (0x007b1aa0, low confidence in the anchor map) and the
   character refresh 0x007a89c0 (which sets the base ICV and the counter to `3 * tickSpeed`) were read but not proven.
3. What the scene value 0x1ad and the byte at VA 0x0112c9d1 stand for in the script hold.
4. Whether an equipment-given Haste or Slow comes back after a Petrify zeroes the record's counters (the temporal auto
   word `Chr+0x62c` is not applied in the functions read here).
5. ~~When the Threaten status ends and what removes `Chr+0x5c5`.~~ Answered in §14.3: at the start of the next turn of either end of the pair, and by the death handler.
6. Whether the engine's formation order of enemies is the game's monster slot order (it decides ties among enemies).
7. The ranks, chances and durations in the engine's ability data against the game's command tables.

## 14. The per-turn ticks: end of turn, start of turn, Regen, the Threaten link, Poison, Doom (ported in the W2 batch)

Added 2026-10-08 (re-parity W2). **Game case: FFX only.** Kernel `src/battle/ffx/kernel/turn-ticks.ts`; tests
`tests/unit/parity-ffx-turn-ticks.test.ts`; vectors `tests/fixtures/parity/ffx/turn_ticks_end.json`,
`turn_ticks_start.json`, `turn_ticks_misc.json`. Same source note as the top of this file (FFX.exe build 25501027), read in
Ghidra (decompile and disassembly), everything in our own words.

### 14.0 How it was checked

The real machine code of six functions was run in the emulator (the harness of §0), on generated inputs:

| Function | VA | Vectors per round | Differences |
|---|---|---:|---:|
| end-of-turn status tick | 0x007af390 | 9,000 | 0 |
| start-of-turn tick (Regen, stances, Threaten release) | 0x007af4f0 | 7,000 | 0 |
| the Threaten release on its own (the death handler and the leave-the-field function call it) | 0x0078e410 (with 0x0078e460) | 3,000 | 0 |
| Poison | 0x007afab0 | 5,000 | 0 |
| Doom | 0x00799cd0 | 4,000 | 0 |
| action done (recovery, end-of-turn tick, Poison marker) | 0x007b20e0 | 5,000 | 0 |

Two rounds with different seeds (66,000 vectors in all, 0 differences). The animation and presentation callees (damage
numbers, wake-up and recovery poses, the queue of a death or a Doom kill, the weak-HP refresh, the position maths of the
Threaten pose) are replaced by recorders whose arguments are part of every vector; the death check
(`pp_BtlDamageCheckDeath`) returns a scripted value; nothing else is replaced, so the real `pp_BtlSubHp`, the real
character lookup, the real CTB delay and the real end-of-turn tick run. **Every character structure (31 of them) was
filled with random bytes before each vector**, and only then were the fields the kernel models written, so a byte the
code reads that the kernel does not model would have shown as a difference. The byte offsets each function changes were
also recorded, over all vectors:

| Function | Offsets written | Meaning |
|---|---|---|
| end of turn | 0x608-0x60d, 0x613, 0x614 (counters); 0x433, 0x50e, 0x50f | the eight ticking counters; the wake-up pose request |
| start of turn | 0x5d0-0x5d3 (HP); 0x612 (Regen counter); 0x6d2; 0x616/0x617; 0x606-0x607 (Threaten bit); 0x5c5, 0x5c6; 0xdd0, 0xded | payouts; the actor's Regen count; tick counters; stances; the Threaten link; the damage-source id (the holder itself) |
| Threaten release | 0x607, 0x5c5, 0x5c6 | the Threaten bit and the two link bytes of both ends |
| Poison | 0x5d0-0x5d3; 0xdf8; 0x41c, 0x42b, 0x42c, 0x42e, 0xdd0, 0xded | HP; the skip flag cleared; presentation bookkeeping |
| Doom | 0x5c8 | the countdown, and nothing else |
| action done | 0x65c (CTB); 0x608-0x60d, 0x613, 0x614; 0xde4, 0xde6 (the queue index and count of the character); presentation | recovery; the end-of-turn tick |

The repo keeps stratified subsets (890 vectors: end of turn 240, action done 160, start of turn 120, Threaten release 90,
Poison 160, Doom 120) and the full sets stay under `D:\Tools\ffx-parity\kernel-check-turn-ticks\`. **Mutation check:** 50
single changes to the kernel (a comparison off by one, a bit swapped, a clamp removed, a step dropped) were run against
the repo tests; 46 were caught on the first run and the four survivors are two hand tests added (the tick counter's `& 0xff`:
the game reads one byte; the slot-31 bounds check) and two changes that cannot alter any answer ("reset the tick counter only
when a payout was made": a payout of `(x >> 8) + 100` is never 0 or less, so every holder that is reset is paid; and "the
actor's start-of-turn event needs its table bit": only Regen has the start-of-turn count bit, and it also has the event bit).

### 14.1 The end of a turn (VA 0x007af390)

Called by the action-done function (§14.4) **after** the actor's recovery has been added to its CTB counter, so the Haste or
Slow that runs out here still halved or doubled that last recovery. It does nothing to a character that is not on the field.
Otherwise the thirteen counters of §6 are walked in order; a counter of **1 to 253** whose behaviour byte (§8) has **bit 4**
counts down by one: Sleep, Silence, Darkness, Shell, Protect, Reflect, Haste, Slow. 254 ("until removed"), 255 (given by
equipment) and 0 never move. Regen (bit 1 only) and the four Nul statuses (no bits) are untouched. A counter whose byte also
has **bit 8** (Sleep, Silence, Darkness, Haste, Slow) fires a status event unless the character's silent flag (`Chr+0xdcb`)
is on; the event is presentation (the status icon timer). After the loop:

- a Sleep counter that was not 0 and now is wakes the sleeper (a pose request, action 0x1b) and the function **ends there**;
- otherwise a Silence or a Darkness that went from not 0 to 0 asks for a recovery pose.

Nothing else in the character is written. A Silence or Darkness that runs out therefore simply stops being a counter; the
engine's `status-remove` event for it is the same fact.

### 14.2 The start of a turn (VA 0x007af4f0)

Called from the turn dispatcher (`pp_BtlTurnStart`, 0x00792a90) when **any** character's turn begins, before Doom (§14.5)
and before the check for Sleep, Provoke, Berserk and Confuse. Its steps, in order:

1. **If the actor is on the field and the turn is not a re-entered one** (`Chr+0x716` is 0; the byte is set to 1 when a
   command is refused or a turn is handed over and the same turn is opened again, and cleared when the dispatcher is done):
   - **Regen pays every holder.** The 31 character slots are walked in id order (party 0 to 7, aeons 8 to 0x11, monsters 0x14
     to 0x1b). A slot whose Regen counter (`Chr+0x612`) is not 0, that is on the field, has **HP above 0**, is not dead
     (`Chr+0xdcc`) and is not Petrified (`Chr+0xdce`, the Petrify bit copied when a hit record is written back) gets
     `(Chr+0x6d2 * maxHP >> 8) + 100` (a 32-bit multiply and a logical shift; `Chr+0x6d2` is its own **tick counter**, the
     number of clock ticks since its last payout or since its Regen began). A Zombie takes the amount as damage, anyone else
     as healing; both are `pp_BtlSubHp`, `HP = clamp(HP - amount, 0, maxHP)`. A slot that met the conditions has its tick
     counter reset to 0, and so does every holder that was paid (the amount is never 0 or less, so these are the same slots).
   - **The actor's own start-of-turn counters** count down: a counter of 1 to 253 whose behaviour byte has **bit 1**. Only
     Regen has it (0x03), and its bit 2 fires the status event. So Regen counts down at the start of its HOLDER's turns, after
     the payouts of that same call: a Regen of 10 pays at 10 of its holder's own turn starts (and at every other turn start in
     between).
2. **Always, whatever the actor is doing:** Defend (extra bit 0x800), Guard (0x1000), Sentinel (0x2000), Shield (0x40) and
   Boost (0x80) end on the actor, unless the equipment gives the stance (`Chr+0x62e`). Defend, Sentinel and Shield also ask for
   a pose. This is the "until the user's next turn" rule of §7; the engine's `clearUntilNextTurnStatuses` is the same set.
3. **Always:** the Threaten release of §14.3.

The two guards in step 1 are `Chr+0xdc8` (on the field) and `Chr+0x716`; steps 2 and 3 run without them.

**The tick counter** `Chr+0x6d2` is what the clock adds to: every call of the scheduler that ticks (§4) adds 1, saturating at
255, to every character that has no queued action, is on the field, is not dead and is not Petrified. It is reset by the
payout above and when a Regen counter goes from 0 to something (the hit-record write-back and the equipment refresh both do
it). So a holder is paid for the ticks **it** has seen since its last payout, not for "the ticks since the last turn" of the
field; the two agree whenever the holder was eligible for all of them.

### 14.3 The Threaten link (VA 0x0078e410, 0x0078e460): answers open question 5

A Threaten that lands makes a **pair**: the target's permanent word gets bit 0x800 and `Chr+0x5c5` names the user (§6); the
write-back of the hit record then calls `fh_MsThreatProcess` (0x0078e460, Fahrenheit's name) with the bit set, which gives the
USER bit 0x800 too and sets the user's `Chr+0x5c6` to the target. Both ends therefore carry the bit and name each other.

It is released by `FUN_0078e410`, which runs at the end of **every** start-of-turn tick, in the death handler for the character
that dies, and in the function that takes a character off the field. For a character with the bit, `Chr+0x5c6` not 0xff means
it is the USER of a pair; otherwise it is the TARGET. In both cases the bit leaves BOTH ends, and both ends' two link bytes
become 0xff. So **a Threaten ends at the start of whichever end's turn comes first** (the user's, normally, because the target
was rescheduled to the user's own next counter, §5, and a party member sorts before a monster at a tie), and when either end
dies or leaves the field. Nothing else ever ends it: it has no counter, and a status command that clears bit 11 from the
record makes the write-back dissolve the link the same way (the bit is then clear).

A character holding the bit as the TARGET (link byte `Chr+0x5c6` = 0xff) is frozen by the animation code (rate 0) until then.
A target whose turn comes up first is released at that turn's start and **then takes its turn normally**: the game has no
rule that makes a threatened character lose a turn; the delay is the whole of the effect.

### 14.4 Poison and the action-done function (VA 0x007afab0, 0x007b20e0)

The recovery after an action is added by `pp_BtlActionDone`: for the queue entry that ends the turn (the entry's second byte
is 0) it does, **in this order**: `CTB += HasteSlow(tickSpeed(AGI) * max(rank, 1))` as a byte add (§2), then the end-of-turn
tick of §14.1, then the MP and Overdrive costs, then the **Poison marker**. The marker (the byte at VA 0x0112c9e4) is set to
the actor's id only when the call was made with its third argument non-zero, which only the results-applied function
(`pp_BtlApplyResults`) does, i.e. after an action whose results were applied, **not after a passed turn**, and only when the
actor has Poison (permanent bit 0x08), is not dead, is on the field and its `Chr+0xdf8` flag is clear (the flag a character
has while it is leaving the field). A sleeper's turn is passed with an empty action (argument 0), so **a poisoned sleeper takes
no Poison damage**. The rank of a passed turn is `Chr+0xde8` as the scheduler left it: it resets it to 3 every time the
counter reaches 0 (§4), so a passed turn costs a rank-3 recovery. That settles the engine's `[estimate]` of 3.

`pp_BtlPoisonTick` (0x007afab0) runs afterwards for each character and pays the one the marker names: damage
`Chr+0x5ba * maxHP / 100`, an unsigned 32-bit multiply and divide (`Chr+0x5ba` is 25 for every one of the 18 player and aeon
slots and the monster record's byte for a monster; for 25 the result equals `maxHP / 4` rounded down), through `pp_BtlSubHp`
(clamped at 0). It clears the marker whoever it named and clears `Chr+0xdf8`.

### 14.5 Doom (VA 0x00799cd0)

Called by the turn dispatcher right after the start-of-turn tick. With the Doom extra bit (0x4000), a turn that is not
re-entered and an action buffer to fill, a countdown (`Chr+0x5c8`) above 0 goes down by one; a countdown that is then 0 queues
the **Doom kill** (command 0x3120, whose Death carries the marker 4 of §6) as the doomed character's own action against itself
and the dispatcher stops there: the character does not take the turn it was given. A countdown that already stood at 0 kills
at once. The countdown starts from `Chr+0x5c9` when Doom lands (§7): 5 for every party slot, the monster record's byte for a
monster.

### 14.6 The order of a turn, from the dispatcher

`pp_BtlTurnStart` (0x00792a90), for the character whose turn the scheduler queued: the start-of-turn tick (§14.2) -> if the
character is not dead and the battle is not over: Doom (§14.5; if it fires the turn is over) -> a character with a Sleep
counter is passed (an empty action, whose end is the action-done call of §14.4 with no Poison marker) -> Provoke, then Berserk
(0x200) or Confuse (0x100) take their automatic action -> otherwise the player's menu or the monster's script. Whatever action
is taken ends in the action-done call, which charges the recovery, ticks the end-of-turn counters, and marks Poison.

### 14.7 Differences against the engine before the W2 batch

"Engine" is `src/battle/ffx/ticks.ts`, `statuses.ts` and `engine.ts` at `bd908802`.

| # | What | Engine | Game | How often |
|---|---|---|---|---|
| T1 | Regen payout size | `elapsedTicks` (the field's CTB clock since the last turn start) for every holder | the holder's own tick counter (reset at its last payout or when its Regen began; saturating at 255; frozen while off the field, dead or Petrified) | a Regen cast mid-way between two turn starts, a revive, a petrified or off-field holder |
| T2 | When Regen counts down | at the END of the holder's own turn (`DURATION_STATUSES`) | at the START of the holder's own turn, after the payout | every Regen |
| T3 | Which counters tick at the end of a turn | Sleep, Silence, Darkness, Slow, Regen | Sleep, Silence, Darkness, Shell, Protect, Reflect, Haste, Slow (not Regen) | finite Shell, Protect, Reflect and Haste (monster spells) |
| T4 | Poison on a passed turn | ticks (the pass path runs `afterAction`) | none: only after an action whose results were applied | a poisoned sleeper |
| T5 | Doom's countdown | the ability's duration byte (a 254 placeholder) unless the enemy declares `doomTurns` | `Chr+0x5c9`: 5 for the party | every Doom on the party |
| T6 | Doom with a counter already at 0 | not possible | kills at once | -- |
| T7 | Threaten | the target stays in the queue, loses its turn if it comes first (`canAct`), and its counter is set to 0 at release | the target's counter was set at landing to the user's own next counter; a release at either end's turn start; the target then acts normally | every Threaten |
| T8 | A KO'd user's Threaten | released at the target's next turn | released at once by the death handler | rare |
| T9 | Equipment-given stances | Defend, Guard, Sentinel, Shield, Boost removed even when permanent | kept when `Chr+0x62e` has the bit | an aeon with a permanent Shield |

### 14.8 Inputs these kernels need (engine side)

Per character: on the field, dead, Petrified, the silent flag, re-entered turn (0 in the engine: it opens a turn once and a
refused command keeps the same turn), HP and maximum HP, the permanent word (Zombie, Poison, Threaten bits), the thirteen
counters, the extra word and the equipment-given extra word, the Regen tick counter, the two Threaten link bytes, the Doom
countdown and the Poison percentage (25 for the party; the monster's own byte). For action done: the CTB counter, the rank of
the action, Agility, and whether the action's results were applied.

## 15. The engine wiring (W2): what the engine does now, and what it settled

Added 2026-10-09 (re-parity W2). **Game case: FFX only.** The kernels of §1 to §8 and §14 are wired into the FFX engine
(`src/battle/ffx/adapt/{ctb,slots,status,status-odds,status-apply,ticks,threaten}.ts`, `hit-apply.ts`, `turnQueue.ts`,
`ticks.ts`, `statuses.ts`); `docs/handoff/re-parity-w2.md` has every kernel input and the engine value it comes from.
Everything below is the engine's behaviour, proved against the kernels on generated input by
`tests/unit/parity-ffx-engine-ctb-status.test.ts`, `parity-ffx-engine-status.test.ts` and `parity-ffx-engine-ticks.test.ts`.

### 15.1 The differences of §10 and §14.7, and what the engine does with each

| # | Settled how | Engine, after W2 |
|---|---|---|
| C1 | the game's tie key | the ready list is sorted by `(255 - AGI) * 256 + slot` for the party and the aeons and `slot + 0x10000` for a monster (`adapt/ctb.ts#tieKeyOf`); the slot is the game's (`adapt/slots.ts`) |
| C2 | the kernel's recovery | `HasteSlow(tickSpeed(AGI) * max(rank, 1))` clamped to 0..255, added as a byte add; Haste and Slow cannot be on one character except through equipment, and then the kernel's rule decides |
| C3 | the hit kernel | Delay Attack and Buster are added inside the hit with the target's tick speed and clamp to 0..255 |
| C4 | the hit kernel | the formula-0xd amount (Haste, Slow) is zeroed when the status did not land (already held, resisted, immune, Petrified, Threatened), so the counter is moved only by a status that landed |
| C5 | the opening kernel | First Strike on any slot that has the auto-ability (monsters have none: the exe zeroes a monster's auto-ability block), Haste halves and Slow doubles the start value of every slot that carries them |
| C6 | the opening kernel | a normal start spends the 26 fixed draws in slot order (empty slots and the bench included), a preemptive or ambush start none; the draws come from the engine's one seeded stream until the game's own generators are adopted (plan P3) |
| C7 | the stored base | a revived character's counter is the base stored at the opening (`ActorRuntime.icv`), never recomputed from its present Agility |
| C8 | the hit kernel and the tick kernels | Threaten writes `delay + userCounter - targetCounter` into the target's counter when it lands and the pair is released by the start-of-turn tick (§14.3) or by the death or leave-the-field handler |
| C9 | none needed | the tables agreed |
| S1 | the infliction kernel | one draw per visited status that has a chance byte, in status order, `% 101` (Threaten `% 100`), spent whatever the odds; none for a cleansing command |
| S2 | the infliction kernel | Death against a living Zombie reads the record's Zombie bit and a resistance of 254 |
| S3 | `adapt/status.ts#resistBytesWith` | an enemy's Threaten byte is its live Threaten percent; 255 always lands, 0 never |
| S4 | the infliction kernel | Confuse, Berserk, Provoke and Threaten remove one another |
| S5 | the infliction kernel | Petrify wipes the thirteen counters, a permanent Haste or Slow included, and keeps the extra bits 0 to 5, 8 and 15 |
| S6 | `kernel/turn-ticks.ts`, `adapt/ticks.ts` | Sleep, Silence, Darkness, Shell, Protect, Reflect, Haste and Slow count down at the END of the holder's turn, Regen at the START; the Nul statuses never |
| S7 | the infliction kernel | a status cast on oneself with a finite duration lasts one extra turn |
| S8 | `adapt/status.ts#doomStart` | Doom starts from 5 for every party slot and from the monster record's byte (`EnemyDef.doomTurns`) for a monster; only a Doom that lands asks for it, and an enemy that can be Doomed without carrying one is an error |
| S9 | the pool kernel | Double HP and Double MP cap at 9,999 and 999, at 99,999 and 9,999 with Break HP Limit and Break MP Limit (the equipment abilities set `Chr+0x6be` bits 9 and 10), and removing the flag restores the stored base. A chain's later link hands the base maxima on with the status and the next battle rebuilds the doubled ones, as the party-stats builder does at battle start (the third argument "no new byte") |
| S10 | none needed | the same in both |
| T1 | the start-of-turn kernel | Regen pays every holder `(its own tick counter * maxHP >> 8) + 100` |
| T2 | the start-of-turn kernel | Regen counts down at the start of its holder's turn, after the payouts |
| T3 | the end-of-turn kernel | the eight ticking counters of §14.1 |
| T4 | the action-done kernel | Poison is charged only after an action whose results were applied; a sleeper's passed turn takes none |
| T5, T6 | the Doom kernel | the countdown starts from 5 (party) or the monster's byte; a countdown that is 0 kills at once |
| T7, T8 | the Threaten kernels | the target keeps its place, is released at the start of whichever end's turn comes first and then acts normally; either end's death or leaving releases the pair at once |
| T9 | the start-of-turn kernel | a stance the equipment gives (a permanent Shield, Boost, Defend, Guard or Sentinel) is not removed |

### 15.2 What the wiring found

1. **A KO runs the game's status reset.** The death handler calls the function at VA 0x0079a190, which clears the permanent
   word but Death (so **Zombie too**), the thirteen counters, the extra word (so Scan and Eject too), the six stacks and the
   buff byte. The engine's `SURVIVES_KO` list keeps `ko`, `scan`, `zombie` and `eject` on a member who dies, on the strength of
   `research/ffx-yunalesca.md` section 15.2 number 29 (the Hellbiter weighting reads Zombie on KO'd slots). The two cannot both
   hold for the character structure the script reads; this note does not settle which one the script reads, and the engine keeps
   its list (this is PR-0217, D-214, still open). The infliction step is shown the word the exe would have for a dead character
   (Death alone, `adapt/status.ts#recordOf`), so that Life on a KO'd member that the engine still shows as a Zombie stands it up
   instead of killing it. Recommendation: have the Yunalesca AI lane check whether the Hellbiter weighting reads the permanent
   word at all (or a copy taken before the reset), then drop Zombie and Scan from `SURVIVES_KO`.
2. **Banish is an ordinary Eject command that lands on an aeon.** The Aeon Ribbon the engine's data gives every aeon is an
   Eject-immunity byte of 255 in the extra-immune word; the Banish command (`extra.bypassesAeonRibbon`) is handed that word
   without the Eject bit. Nothing else changed for Seymour's Banish.
3. **A Petrified monster is shattered whatever its Eject immunity.** The record of a Petrified monster gets Death and Eject, and
   the step's decision is carried out with `ejectActor(..., force = true)`.
4. **A chain's later links are normal starts.** The engine's `'scripted'` start (no jitter) is not a game concept; each link of a
   chain is a new battle, and its opening counters are the 26 draws.
5. **The bench has counters.** Every party slot gets the draw and the start value the game gives it, reserve members included
   (the old engine left them at 0 and subtracted nothing from them).
6. **A weapon's status strikes are a set.** The weapon status bytes of a wielder are the per-status maxima of the strike
   auto-abilities it has; a repeated strike on one item adds nothing (the engine's equipment model is a set).
7. **A passed turn charges rank 3 because the scheduler leaves 3 there** (§14.4); it is no longer an `[estimate]`.
8. **A record is walked in status order, and a Petrified record refuses the rest.** Evrae's Stone Gaze carries Petrify at 100 and Slow at 255; on a target the Petrify takes, the Slow (status 24, after Petrify's 2) never lands, whatever its chance, and a cleansing command works on a Petrified record only for Petrify itself, so a target that carried both Zombie (1) and Petrify would keep the Zombie. The game never lets Petrify share a record with the other permanent statuses, so no shipped case has both.
9. **Kept as it was:** the aeon summon and dismissal counters (open question 2 of §13: the party's counters are frozen while an
   aeon holds the field and the aeon enters at 0), the Auto-Life revive amount, Reflect and Cover (the engine's own business), and
   the events' shape.
