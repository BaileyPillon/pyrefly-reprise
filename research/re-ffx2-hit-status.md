# FFX-2 battle RNG, hit check, critical check, status infliction and theft: what the game code does

**Game case: FFX-2 only.** FFX has its own generator, its own hit function and its own tables in its own exe; they
have their own notes (`research/re-ffx-rng-hit.md`). Part of the `re-parity` track
([docs/plans/re-parity.md](../docs/plans/re-parity.md)). Drafted 2026-10-08.

**Source note (applies to every statement below unless a line says otherwise):** FFX-2.exe Steam build 25501027
(SHA-256 6EA7F142...CD69), the HD Remaster's 32-bit executable, image base 0x00400000; every address below is the
virtual address in THAT (live) image. The functions were read in Ghidra 12.1.4, both the decompiler and the
disassembly, in the older copy of the exe (the same code sits 0x20 to 0x30 higher in the battle range) and compared
byte for byte with the live file by the anchor-map lane (90 of 91 anchors are identical; the one that differs is the
main frame function). Everything is written in our own words: no game code and no game text is reproduced here.

| This note | Kernel (pure TypeScript, not wired into the engine yet) | Tests |
|---|---|---|
| §1 generator, streams, battle-start seeding | `src/battle/ffx2/kernel/rng.ts` | `tests/unit/parity-ffx2-rng.test.ts` |
| §2 hit / evade | `kernel/hit.ts`, `hitFormulas.ts`, `hitPlan.ts` | `parity-ffx2-hit.test.ts` |
| §3 critical hit | `kernel/crit.ts` | `parity-ffx2-crit.test.ts` |
| §4 status infliction, shatter | `kernel/status.ts`, `statusTypes.ts`, `statusGroup1.ts`, `statusGroup2.ts` | `parity-ffx2-status.test.ts` |
| §5 Steal, Pilfer Gil, Bribe | `kernel/steal.ts` | `parity-ffx2-steal.test.ts` |

## 0. How this was checked

1. The decompile and the disassembly of every function were read for operand widths, signed or unsigned compares and
   the kind of shift or division (the decompiler hides the difference between an arithmetic and a logical shift, and
   shows the compiler's multiply-by-magic-number as a plain division).
2. The generator constants, the two status flag-word tables and every floating-point constant were read from the live
   image (not from the older copy).
3. The real machine code of each function was run in an x86-32 emulator (Unicorn, via the harness in
   `D:\Tools\ffx-parity\harness`) on generated inputs, with only the RNG function replaced by a script, and every
   result compared with the kernels. No differences in any of:
   - hit check 0x00641500: 23,670 vectors from the harness lane (all eight formulas, every forced rule, Darkness,
     aid scale, debug switches) and 3,000 vectors of this lane for the random-target spread (which calls the real
     0x00634e40);
   - generator 0x0061e270: 3,300 harness vectors; seeding 0x0061e1b0: 300 vectors of this lane;
   - critical check 0x00617210: 12,000 harness vectors and 6,000 of this lane;
   - status rolls 0x00619230 (group 1) and 0x00619700 (group 2): 13,269 and 13,744 harness vectors, plus 12,000 each of
     this lane (every status index, cleanse, both layers, weapon tables, the stop gate, the debug switches);
   - theft 0x00619c10, 0x00619d10, 0x00616fb0: 9,000, 6,000 and 5,000 vectors of this lane;
   - the starting result buffer (`pp_result_init`, 0x0061b1c0, which `initialStatusResult` mirrors): 200 random cases.

   A deliberate one-line fault in the kernel was caught by the matching vector set each of the six times it was tried.
   The vector files stay outside the repo (`D:\Tools\ffx-parity\vectors\ffx2\` for the harness lane's; this lane's
   own scripts and vector files are in `D:\Tools\ffx-parity\kernel-check\ffx2-hit-status\`). The tests in the repo carry
   hand-worked examples (the arithmetic is in the comments), values from independent Python restatements, rows picked
   from the emulator runs for the theft kernels, and a skipped block per function that loads
   `tests/fixtures/parity/ffx2/<name>.json` as soon as a reduced vector set is copied in.

**Notation.** `Chr+0xNNN` is an offset into the battle character structure (stride 0x17E0, 31 entries; array pointer
at VA 0x00e0ebac). Slot ids 0 to 14 are the party side (the three girls use 0 to 2), 15 to 30 are monsters. `Cmd+0xNN`
is an offset into the command row, `Rec+0xNN` into the 0xCC-byte action record, `Res+0xNN` into the 0x80-byte result
buffer. All arithmetic is 32-bit; stat bytes are unsigned unless called "signed" (the stage bytes are signed). "Attacker"
is the character acting, "target" the defender.

## 1. The generator (VA 0x0061e270)

There are 68 independent streams. Stream `s` has a signed 32-bit multiplier `mult[s]` (table at VA 0x00d48360), a 16-bit
addend `add[s]` (VA 0x00d48470) and a 32-bit state `state[s]` (VA 0x00e103f0 + 4 s). One draw from stream `s`:

1. `n` = `mult[s] * state[s] * 5 + add[s] + 1`, modulo 2^32 (read as signed);
2. the new state is `(n shifted right by 16, sign extended) + (n shifted left by 16)`, modulo 2^32;
3. the value returned is the new state with bit 31 cleared (`& 0x7fffffff`), a 31-bit number. Callers reduce it with
   `% N` (signed) or `& mask`.

The sign-extending shift is the part a port gets wrong: when `n` has bit 31 set the high half of the sum is filled with
ones, so the step is not a 16-bit rotation (a rotation fails half of the emulated calls). The tables are in
`kernel/rng.ts`; checksums to verify them: the 68 multipliers sum to 17,365,042,817 (27 of them are negative) and the
68 addends to 2,330,260. They are byte-identical in the older exe copy. (They are not FFX's tables: many entries agree, some
differ by one, and the formula differs; neither game's table may stand in for the other.)

### 1.1 Which stream a roll uses (VA 0x0061adb0)

For a character `c` and a purpose `p`:

```
base   = c + 0x14      if c is a party slot (0 to 14)
         c + 0x0d      if c is a monster slot (15 to 30)
stream = base + 0x10 * (p == 1) + 0x20 * (p == 2)          (any other p is p = 0)
```

| Purpose | Used for |
|---|---|
| 0 | damage variance, the critical roll, ATB start / reset / thinking time, Confusion and AI picks, Gambler dice, Poison and Regen phase, the gil reward factor |
| 1 | the hit-or-evade roll (§2) |
| 2 | status infliction (§4), the shatter roll, magic cancel |

Roll streams are the ATTACKER's, not the target's. A few rolls use fixed streams: 1 first strike / ambush, 5 random-target
hits and team picks, 6 the Reflect redirect, 10 and 11 Steal, Pilfer Gil, Bribe and KO rewards (§5), plus 9, 14, 15, 16 and
17 for effects. (The full caller map is section 5 of the anchor map.)

**Anchor-map gap, found here:** a monster in slot 23 to 30 rolling purpose 2 gets stream 68 to 75, past the 68-entry
tables; the game then reads multipliers and states from the memory after them and writes the new state there. No fight
with five or fewer monsters is near it (the bosses sit in the low slots), so the kernel refuses such a stream with a
RangeError instead of inventing what lies beyond.

### 1.2 Seeding (VA 0x0061e1b0, called once when a battle loads)

1. The game builds an 8-byte clock record (seconds, minutes, hours, day, month and the low byte of the year in six of the
   bytes; bytes 0 and 4 are never written, so they hold whatever the stack held) and XORs the eight bytes into one byte `f`.
2. `p = (f + 1) * (arg + 1)` (32-bit), where `arg` is the save's seed plus a configuration word.
3. A word `side = p * 0x599e67e6 + 0x301d` is stored at VA 0x00d4835c (nothing in the stream code reads it).
4. `x = 0x8e81d427 - p * 0x4913002d`, then `x = (x >> 16) + (x << 16)` (arithmetic shift, as above).
5. 68 times: `v = x * 0x5d588b65 + 0x3c35`, `x = (v >> 16) + (v << 16)`, and `state[k] = x & 0x7fffffff`; `x` is left at
   VA 0x00d48358.

So a real battle starts from one of at most 256 state sets per `arg`. The loop alone (`seedStatesFromX` in the kernel)
accepts any starting `x`, which is how a run seed could feed the real generator later.

## 2. Hit and evade (`pp_hit_determine`, VA 0x00641500)

Called with (attacker slot, action record, hits override). For every set bit of the record's target mask (ascending slot
order) it decides one result byte at `Rec+0x31+t`: 0 hit, 1 miss, 2 no effect, counts them in `Rec+0x2c`, `+0x2d`, `+0x2e`,
plans the hits (§2.5), and returns the OR of the target masks (also stored in the attacker). If the record links to a next
record (`Rec+0xc8`) the whole function repeats for it. The **hit is decided once per target per record**, not once per
strike: every strike the command later plays on that target reads the same result byte.

### 2.1 The accuracy formula and the draw

`f` = bits 3 to 5 of the command row's misc flags (`Cmd+0x14`). Every formula ends in the same signed compare:
**hit iff (roll < threshold or forced-hit) and not forced-miss.**

| f | roll | threshold | draw |
|---|---|---|---|
| 0 | none | none: always hits (only the debug miss switch stops it) | none |
| 1 | `draw % 101` | the race below with base = the command's Accuracy byte (`Cmd+0x2a`) | 1 |
| 2 | `draw % 101` | the race with base = the attacker's own ACC stat (`Chr+0x39d`) | 1 |
| 3 | constant 128 | `(draw & 0x7f) + q`, resist byte = Eject (`Chr+0x40e`) | 1 |
| 4 | constant 128 | the same with the Death resist (`Chr+0x404`) | 1 |
| 5 | constant 128 | the same with the Petrify resist (`Chr+0x405`) | 1 |
| 6 | `draw & 0xff`; the command 0x31da rolls 0 | the Bribe threshold (§2.3) | 1, none for 0x31da |
| 7 | `draw & 0x3ff` | the level^6 threshold (§2.4) | 1 |

The draw comes from the attacker's purpose-1 stream, one per target that gets as far as the formula, **before** the
immunity of formulas 3 to 6 is looked at. Thresholds are not clamped (they can be negative or above 100); the roll of
formulas 1 and 2 is 0 to 100, so a threshold of 100 still fails one time in 101 and a threshold of 101 never fails.

**The race (formulas 1 and 2):**

```
threshold = LCK_a + base - LCK_t - EVA_t + 5 * (2 * (ACCstage_a - EVAstage_t) - LCKstage_t + LCKstage_a)
```

`LCK` is `Chr+0x39b`, `EVA` is `Chr+0x39c`, the three stages are the signed bytes `Chr+0x443` (Accuracy), `+0x444` (Evasion)
and `+0x445` (Luck). **Darkness:** if the attacker has Darkness (status word 1, bit 0x10) AND the command's misc flags have
bit 0x40, `base` is first divided by four (rounding toward zero). **Aid scale:** for a target that is a player-side monster
(`pp_is_aided_chr`: not a monster slot, `Chr+0x11` between 15 and 22), the threshold becomes
`trunc((aid + 1) * threshold / 4)` with `aid` the short at VA 0x011b85c4 (0 to 5, default 3, so x1); ordinary targets are not
scaled.

### 2.2 Formulas 3, 4, 5: the instant-effect chance

```
q = (((((lvA^2 * power) * power) * 100) / lvT) / lvT) / (r + 5)) / (r + 5)
```

in SIGNED 64-bit integer steps (each division truncates toward zero), with `lvA` the attacker's level (`Chr+0x380`), `lvT` the
target's level clamped to at least 1, `power` the command row byte `Cmd+0x2b` and `r` the target's resist byte. Only the **low
32 bits** of `q` are kept, as a signed int, and the threshold is `(draw & 0x7f) + int32(q)`. With the roll fixed at 128 the
effect lands exactly when `(draw & 0x7f) + q >= 129`: `q >= 129` always, `q = 2` only on a draw & 0x7f of 127, `q <= 1` never.
`r = 255` is immune: result 2 (no effect), counted in `Rec+0x2e`. For a level-99 attacker with power 255 against a level-1
target at resist 0, `q` is 2,549,240,100, which does not fit in a signed 32-bit number: the low word is negative and the effect cannot land.

### 2.3 Formula 6: the Bribe threshold

```
base      = 128 for the command 0x31da, else -64
acc       = clamp(old + amount, 0, 999999999)      old = Chr+0x67c, amount = Rec+0xb0 (the add wraps at 32 bits first)
threshold = trunc( min( float32( float32(acc) * 256 / float32(max(maxHP, 1)) / 5 + base ), 1e9 ) )
```

(`maxHP` is `Chr+0x384`.) `Chr+0x67c` is set to `acc` and `Chr+0x680` to the threshold on EVERY evaluation, immune or not,
hit or not. The roll is `draw & 0xff`, except command 0x31da, which rolls 0 and draws nothing. An amount below 1 forces a miss
(the draw is still made); a target with the Bribe-immune flag (`Chr+0x3a7` bit 1) is result 2. Each multiple of
the target's max HP in `acc` adds 51.2 to the threshold: 1.25 times or less cannot work (threshold 0 or less), 2 times gives 38
(15 in 100), 5 times gives 192 (three in four), and 6.25 times or more always works. The command 0x31da skips the roll and always works.

### 2.4 Formula 7: the level^6 roll

```
threshold = trunc( float32( lvA^6 / lvT / lvT / lvT / (r + 10) / (r + 10) / (floor(r / 20) + 1) ) )
```

with `lvA` and `lvT` converted to float32 first, `r` the byte at `Chr+0x66b`, the power built by five multiplications and every
step rounded in 53-bit x87 arithmetic, then rounded to float32 once at the end. A threshold of 2^31 or more converts to the
hardware's "integer indefinite" value (negative) and never hits; a negative attacker level gives the same result as its absolute
value (an even power). The roll is `draw & 0x3ff` (0 to 1023), so a threshold of 1024 or more always hits.

**Floating-point assumption.** Formulas 6 and 7 (and the Bribe reward in §5) are x87 code. The run-time start-up of the exe
sets 53-bit precision (the harness found the call), the exe imports Direct3D 11 (not Direct3D 9, which would switch the
thread to 24-bit precision), and the float-to-int helper uses the SSE2 truncating convert. JavaScript doubles plus
`Math.fround` at the places the code stores to a float reproduce that exactly. The one residual doubt is a third-party DLL
(audio, UI middleware) changing the control word on the battle thread; nothing suggests it, and no vector has ever shown it.

### 2.5 Forced outcomes (formulas 1 and 2 only)

In this order:

1. If the target's ROOT character (`Chr+0x16`; the target itself for an ordinary unit) is **asleep** (status bit 4),
   **petrified** (status bit 2) or **stopped** (the byte `Chr+0x43e` non-zero), the hit is forced. A sleeping girl is always hit,
   whatever her Luck and Evasion.
2. Otherwise, if the command is physical-only (`Cmd+0x1c & 3` is exactly 1) and the target has the "Evade & Counter" ability
   (`Chr+0x650` bit 8), the hit is forced to **miss**. (Not applied when the debug force-hit switch is on.)
3. A target in hit reaction (`Chr+0xd98` or `+0xd99` non-zero) is forced to be **hit**.
4. A record that has been determined `Rec+0xa7` times already (`Rec+0xa6 >= Rec+0xa7`) is forced to **miss**, and a forced miss
   beats a forced hit. The command start sets the counters to 0 and 3.

Formulas 0 and 3 to 7 apply none of these.

### 2.6 Planning the hits

`hits` is the caller's override when it is above 0 (a signed compare), else the command's byte `Cmd+0x2c`. For an ordinary
command every target in the mask is planned `hits` strikes (stored as a byte at `Rec+0x6f+t`, even for a target decided as a
miss or no effect) and `Rec+0x2b` is the byte-truncated total. For a command that spreads its hits (misc flag 0x4000) each of the
`hits` strikes picks one target with the random-target search: the candidates are the set bits of the mask in ascending slot order;
with one candidate there is **no draw**, with none there is no pick, and with two or more there is one draw from fixed stream 5 and
the `(draw % count)`-th candidate is chosen. Afterwards every target with no planned strike has its result set to miss (the
hit/miss counters are not corrected).

## 3. Critical hit (`pp_dmg_crit`, VA 0x00617210)

Called by the damage orchestrator for a real hit (not a preview). In order:

1. If the command's damage flags (`Cmd+0x1c`) do not have bit 4, return the damage unchanged: **no draw**.
2. Otherwise draw once from the attacker's **purpose-0** stream (the stream of the attacker's own slot id, `Chr+0x0c`) and take
   `r % 100` (0 to 99). The draw is made before anything else is looked at and on every call that can crit.
3. `chance` = the command's own byte `Cmd+0x29` when the damage flags have bit 8, otherwise
   `LCK_a - LCK_t + 5 * (LCKstage_a - LCKstage_t)` (unsigned Luck bytes, signed stage bytes). An int: it can be negative or above 100,
   with no clamp and no division.
4. It is a critical hit when `roll < chance` (signed), or the attacker has Always Critical (status word 1 bit 0x8000) whatever the
   roll, or the debug switch at VA 0x00df68cc is non-zero. **Correction to the anchor map:** that switch FORCES crits, it does not
   block them.
5. A critical hit doubles the damage (a 32-bit add) and sets bit 0x100 in the result flag word.

## 4. Status infliction

A command carries two 24-entry chance tables (`Cmd+0x2f` for group 1, `Cmd+0x47` for group 2) and a 24-entry signed amount table
(`Cmd+0x5f`); the target has a resist table for each (`Chr+0x404`, `Chr+0x41c`; 255 = immune). The attacker's weapon has matching
tables (`Chr+0x3bc`, `+0x3d4`, amounts `+0x3ec`). Group 1 is the on/off ailments (index 0 Death, 1 Petrify, 2 Sleep, 3 Silence,
4 Darkness, 5 Poison, 6 Confusion, 7 Berserk, 8 Curse, 9 Defense, 10 Eject, 15 Always Critical, 17 a status that clears
Confusion, Berserk and Curse). Group 2 is the timed and staged ones (0 Shell, 1 Protect, 2 Reflect, 3 Regen, 4 Haste, 5 Slow,
6 Stop, 7 to 13 the stat stages, 14 Doom, 15 to 17 the immunities).

### 4.1 The landing rule, for both groups (functions 0x00619230 and 0x00619700)

For each status in index order with a chance byte `c` above 0 (after raising `c` to the weapon's byte when the command's
character-properties flag, `Cmd+0x14` bit 0x10000, is set):

1. Unless the command is a cleanse (`Cmd+0x1c` bit 0x20), **one draw from the attacker's purpose-2 stream, `roll = draw % 101`,
   made first, for every such status**, even when `c` is 254 or 255 or the target is immune. A cleanse makes no draw.
2. It lands when `c == 255`, or when the resist `r` is not 255 and (`c == 254` or `roll < c + 5 * (lvA - lvT) - r`). A cleanse always
   lands. So 255 beats a resist of 255, 254 does not, and a computed chance of 100 still fails one time in 101.
3. A status the scripted "check stop" condition covers (Petrify and Sleep in group 1, Stop in group 2) reads as `r = 255` while
   that condition holds, whatever `c` is. The condition is the byte at VA 0x00df848c being non-zero with the byte at VA
   0x00df848d equal to the target's slot (the helper at 0x0062e4b0 returns the short at 0x00df8486 plus 1), or a non-zero last
   argument to the roll function. It is false in ordinary play; the kernels take it as the boolean `stopGate`.

### 4.2 Group 1 (what a landed roll does)

Common refusals when inflicting on the main layer: nothing is added to a petrified target or to a result set that is petrified;
a status the target already has is skipped; Petrify and Eject (flag word bit 0x100) are skipped while the target's action-state
mask has any bit other than 4 (`FUN_00632630`: bit 2 comes from the helper the anchor map reads as "petrified or Stopped", bits 0 and 1
from counters in the command-queue header and the charging flag; their exact meaning is open, see §7). Then, by status:

| Status | Rule |
|---|---|
| Death (0), Sleep, Silence, Darkness, Poison, Defense, the rest | the bit is set in the result set |
| Confusion (6) | refused if the protect mask (`Chr+0x570 | Chr+0x4fc`) holds 0xc0 or 0x20000; sets 0x40 and clears 0x80 and 0x20000 |
| Berserk (7) | the same refusal; sets 0x80 and clears 0x40 and 0x20000 |
| Curse (8) | that refusal and also a protect-mask 0x100; sets 0x100, clears 0x20000 |
| 17 (0x20000) | the same two refusals; sets 0x20000, clears 0x40, 0x80, 0x100 |
| Eject (10) | sets 0x400 (and clears 0x2) |
| Petrify (1) | refused if the target or the result set has Eject; the set becomes just 0x2, the group 2 counters in the result are zeroed, and a monster slot also gets 0x400 |

A **cleanse** clears the bit from the result set when the target has it (a petrified target can only be cleansed of Petrify); a
status held by a permanent source (the protect mask) is cleared from the set but reported as unchanged. With the **secondary
layer** flag (`Res+0x10`, from `Cmd+0x18 & 2`) the bit goes into the secondary set (`Res+0x50`) with none of those checks and a
cleanse takes it out of there. An immune result (not landed, `r == 255`) adds a display flag to the result word for Petrify
(0x4000), Sleep (0x200), Silence (0x400) and Darkness (0x800).

### 4.3 Group 2

Nothing is added to a petrified target or result set. For a **timed** status (flag word bit 0x4 or 0x8: Shell to Slow, Stop, Doom,
the immunities) inflicting adds the amount to the result counter, clamped to 0 to 125, and is refused when the status is already in
effect (`Chr+0x438+i` non-zero), when the action-state mask is non-zero and the status is Stop (bit 0x100; group 1 ignores bit 4
of the mask, group 2 does not), or, for Haste, Slow and Stop,
when a permanent source already holds any of Haste, Slow, Stop (`Chr+0x504..0x506` or `Chr+0x578..0x57a`). Haste zeroes the Slow and
Stop counters, Slow zeroes Haste and Stop, Stop zeroes Haste and Slow. A cleanse subtracts the amount (clamped to 0 to 125) and needs a
counter of 1 to 126 and no permanent source (`Chr+0x500+i`, `Chr+0x574+i`). A **stat stage** (indices 7 to 13) adds the signed amount
to the stage, clamped to -10 to +10; an unchanged stage counts as an attempt that changed nothing, a step of 0 or less as a removal;
a cleanse sets a non-zero stage to 0. With the secondary layer the amount byte goes into `Res+0x54+i` when it is empty. When a Haste
or Slow attempt (index 4 or 5) changes nothing (not landed, already in effect, refused), the damage orchestrator's ATB delta is zeroed.

The weapon's amount replaces the row's amount when it is larger in magnitude.

### 4.4 Shatter (inside `pp_dmg_calc_target`, after the status rolls)

A target that is **petrified** at the start of the action is struck again: one draw from the attacker's purpose-2 stream, and when
`draw % 101 < Cmd+0x2d` the result set gains 0x401 (Death and Eject). A target that is not petrified makes no draw.

### 4.5 Not modelled

The display bookkeeping (`Res+0x12..0x18` weights and the nine-slot counters the result-kind and AI code read) changes no game state.

## 5. Steal, Pilfer Gil and Bribe

All three draw from FIXED streams (10 and 11), not the thief's own.

**Steal item (VA 0x00619c10)**, for a command whose misc flags have 0x200: the target's steal chance byte `Chr+0x6ad` is zeroed
(nothing to steal) when it is 0 or the common slot is empty (`Chr+0x6b8` item or `+0x6ba` quantity zero). One draw from stream 10 is
always made; `draw % 255 < chance` succeeds (the command 0x30c4, Sticky Fingers, masks the roll to 0, so any chance of 1 or more
succeeds). On success one draw from stream 11 follows: the rare slot (`Chr+0x6bc`, `+0x6be`) is taken when `draw & 0xff < 32` (one in
eight; the command 0x30c5, Master Thief, masks the roll to 0, so always) and the rare slot has both an item and a quantity; otherwise
the common slot. The result carries the item id and quantity (quantity -1: an attempt that failed with something to steal; 0: nothing
to steal). Applying a success zeroes the chance byte (one steal per enemy) and counts it.

**Pilfer Gil (VA 0x00619d10)**, for a command whose damage flags have 0x100: with the gil chance byte `Chr+0x6ae` or the figure
`Chr+0x6a8` zero the result is -1 and NO draw is made. Otherwise one draw from stream 10: `draw % 255 < chance` succeeds; then a
second draw from stream 10, `s = draw % 101`, and the amount is `floor(floor((s + 100) * gil / 200) * chance / 255)` in unsigned 32-bit
steps (the first product wraps once `(s + 100) * gil` reaches 2^32: gil 21,474,837 with `s = 100` gives 0). So a success takes between half and all of the figure, scaled again by
`chance / 255`. A success that rounds to 0 gives nothing. Applying a positive amount gives the party the gil and zeroes the chance byte.

**Bribe.** Whether it works is accuracy formula 6 (§2.3). The reward (VA 0x00616fb0) is for a command with misc flag 0x4000000: one
draw from stream 11, slot 1 if `draw & 0xff < 64` else slot 0, and the other slot if the chosen one has no item (at `Chr+0x6c0 + 4k`,
quantity at `+0x6c2 + 4k`). With an item: a draw from stream 10, `f = draw % 11 + 20`, and a draw from stream 10, `d = draw & 1`; the
quantity is `clamp(trunc(float32(float32(sqrt(threshold)) * quantity * 0.0625 * f / 25 + d)), 1, 99)` where `threshold` is the value
formula 6 stored at `Chr+0x680`. A negative threshold gives a NaN root and a quantity of 1. The bribed monster is flagged to leave
(`Res+0x34 |= 0x400`).

## 6. Corrections and additions to the anchor map

- The critical debug byte forces crits (§3).
- Streams 68 and above exist for monster slots 23 to 30 on purpose 2 (§1.1).
- The accuracy formula 7 resist byte is `Chr+0x66b`; formula 6 is the Bribe (the immunity flag is `Chr+0x3a7` bit 1) and it stores its
  result for the Bribe reward to read (§2.3, §5).
- A hit is decided once per target per record, not per strike (§2).
- Group 1 and group 2 draw for every status with a chance byte, before any other test (§4.1); 255 beats a resist of 255.
- Pilfer Gil makes no draw when it has nothing to take; Steal always draws stream 10 (§5).
- Status flag-word bit 0x400 marks the statuses gated by the scripted "check stop" condition (Petrify, Sleep, Stop) and 0x100 those
  refused while the target is mid-action (Petrify, Eject, Stop).
- Of the REA ability table's damaging abilities, formula 0 (never rolls) covers 165 of 397 physical rows and 211 of 217 magical rows,
  so "physical always rolls" and "magic never rolls" are each wrong for a large or small block of rows (anchor map §4.2).

## 7. Open questions

1. `FUN_00632630(target, 0, 0)` (the action-state mask passed to both status functions): what exactly sets its low two bits for a
   target in an ordinary fight. The kernels take the mask as an input; an adapter that passes 0 never blocks Petrify, Eject or Stop.
2. `Rec+0xa6` / `+0xa7` for records the monster AI queues: only the command start was seen setting them (0 and 3). The kernel takes
   them as inputs; an adapter should pass (0, 3).
3. The accuracy formula, Accuracy byte and power of each ability, and each monster's ACC, level, Luck, Evasion, resist bytes, steal
   chances and bribe slots, are data the engine does not carry (it invents `ENEMY_BASE_ACCURACY` 104 and a single steal rate): they
   come from the kernel `.bin` tables (P5), not from these functions.
4. Whether player-side monsters (the aid scale) can occur in the five chapters: assumed not.

## 8. Where the engine differs today

Measured on 2026-10-08 by running the engine's own functions (`hitPercent`, `critPercent`, `statusChanceLinear`) and, for the
rows marked "resolver", the real `resolveAbility` / `resolveTheft` over 20,000 seeds, against the kernels, on the same inputs. A
"grid" is a fixed set of stat combinations; "differs" counts grid points whose probability is not equal. Nothing was changed.

| # | Engine today | The game | Measured |
|---|---|---|---|
| 1 | Hit roll `rng.int(0, 99) >= accuracy` with the percent clamped to 0..100 and no roll at 100 (`resolve.ts:117-118`, `hit.ts:83`) | roll `% 101` against an unclamped threshold: 100 fails one time in 101 | 80-point grid: hit chance differs at 62 (77.5%), mean 0.46 points, max 0.99 (90% vs 89.11%; 100% vs 99.01%). The thresholds themselves are equal at every point; resolver: 70.23% observed vs 70.00% rule |
| 2 | A foe with Accuracy 0 gets `ENEMY_BASE_ACCURACY` 104 (`hit.ts:62`) | the foe's own ACC stat (`Chr+0x39d`) from its record | data, not a formula |
| 3 | Magic never rolls unless a row says `canMiss: true`; every physical row rolls (`hit.ts:52`) | each row's own formula: 211 of 217 damaging magical rows never roll, 6 do; 165 of 397 damaging physical rows never roll (anchor map, REA table) | by table |
| 4 | Darkness divides Accuracy for any physical row or flagged row (`hit.ts:63`) | only rows whose misc flags have 0x40 | by table |
| 5 | Sleep and Stop zero the target's Evasion but its Luck term stays (`hit.ts:76`); Petrify is not special | Sleep, Petrify, Stop and hit reaction force a hit; Evade & Counter forces a physical miss | weak attacker (Accuracy 5, Luck 3) vs a sleeping Luck-20 target: engine 0%, game 100% |
| 6 | One hit check per strike (`resolve.ts:100-118`) | one per target per action record | by reading |
| 7 | Crit chance `clamp(floor((LCK_a - LCK_t) / 4) + bonusCrit, 0, 100)` (`hit.ts:98-99`) | `LCK_a - LCK_t + 5 * stage difference`, no division, no clamp; a row's own byte REPLACES it; Always Critical forces it | 35-point grid: differs at 20 (57%), mean 23.8 points; Luck 60 vs 25: engine 8% (resolver 7.70%) vs game 35%; Luck 100 vs 10: 22% vs 90%; `bonusCrit` 33 at Luck 60 vs 25: 41% vs 33%; the `guaranteed-critical` status is never read (`resolve.ts:124`): 0% vs 100% |
| 8 | Status roll only when the chance is below 100, `rng.int(0, 99) >= chance`; chance 254 or more reads as 100; resist 255 blocks even chance 255 (`resolve-targets.ts:65-78`) | `% 101`, a draw for every status with a chance; chance 255 lands even against resist 255 | 390-point grid: differs at 84 (21.5%), mean 1.39 points; chance 255 vs resist 255: engine 0%, game 100%; resolver: 75.20% vs 74.26% (chance 75), 54.96% vs 54.46% (chance 130, level diff -5, resist 50) |
| 9 | Death, Petrify, Eject and Zantetsu-type rows use the linear status chance; `statusChanceQuartic` and `statusChanceSextic` (`statuses.ts:163-185`) are exported and called by nothing | accuracy formulas 3, 4, 5 and 7 (§2.2, §2.4) decide those rows before any status roll | not wired |
| 10 | Steal: `rng.int(0, 254) < byte`, rare `rng.int(0, 7) === 0`, the guaranteed and force-rare modes skip their draw, a rare drop is taken even from an empty rare slot (`steal.ts:107-113`) | same probabilities; stream 10 is always drawn, stream 11 on success; the rare slot needs an item and a quantity | resolver: byte 40 / 128 / 255 gives 15.66% / 50.50% / 100% vs 15.69% / 50.20% / 100%; rare share 12.6% vs 12.5% |
| 11 | Pilfer Gil takes the whole figure, once, with no roll (`steal.ts:126-134`) | needs a chance roll against a gil chance byte (not in the engine's data); amount `(s + 100) / 200 * figure * chance / 255` | figure 1000: gil chance 255 gives 1000 vs 750 on average; 128: 1000 vs 188.7 per try (success 50.2%); 40: 1000 vs 18.4 (15.7%) |
| 12 | One seeded stream; hit, crit, randomiser, riders in one fixed order | 68 streams keyed to the attacker and the purpose; all hit decisions of a record first | P3 |

The numbers behind rows 1, 7, 8, 10 and 11 can be regenerated with the temporary comparison test described in
`D:\Tools\ffx-parity\kernel-check\ffx2-hit-status\README.md`.
