# FFX-2 damage: the base formulas, the per-target orchestrator, the element ladder and the chain counter

**Game case: FFX-2 only.** FFX has its own damage functions in its own exe (`research/re-ffx-*.md`); nothing here
is assumed to hold for FFX. Part of the `re-parity` track ([docs/plans/re-parity.md](../docs/plans/re-parity.md)).
Drafted 2026-10-08.

**Source note (applies to every statement below unless a line says otherwise):** FFX-2.exe, Steam build 25501027,
SHA-256 6EA7F142...CD69 (the HD Remaster's 32-bit executable, image base 0x00400000; every address below is a
virtual address in that live image). The Ghidra project the analysis lane uses holds an older copy of the exe whose
battle functions sit 0x20 to 0x30 higher (the base formula is 0x61b930 there, the orchestrator 0x6172e0); the bytes of
every function used here are identical in the two (checked by the analysis lane), and data addresses from 0xd28000 are
0x1000 higher in the older copy. Read in Ghidra 12.1.4, both the decompiler and the disassembly, and run in an x86-32
emulator. Everything is written in our own words: no game code and no game text is reproduced here.

| This note | Kernel (pure TypeScript, not wired into the engine) | Tests |
|---|---|---|
| §1 base damage 0x61b910 | `src/battle/ffx2/kernel/damage.ts` (+ `int32.ts`) | `tests/unit/parity-ffx2-damage.test.ts` |
| §2 the orchestrator 0x6172c0 | `kernel/pipeline.ts`, `pipeline-types.ts`, `settle.ts` | `parity-ffx2-pipeline.test.ts` |
| §3 the element ladder 0x618780 | `kernel/element.ts` | `parity-ffx2-element.test.ts` |
| §4 chain counter, HP and MP application | `kernel/apply.ts` | `parity-ffx2-pipeline.test.ts` |

## 0. How this was checked

1. Every function's decompile and **disassembly** were read for operand widths, signed or unsigned compares, the kind of
   shift, and whether a division is the compiler's multiply-by-a-magic-constant idiom. The decompiler writes the divide
   by 12 as "divide by 6, then by 2 with an odd sign fix"; the instructions show a plain truncating divide by 12 (a
   multiply by 0x2AAAAAAB, a shift, a sign fix), so the physical formulas have two truncating `/12` steps.
2. **Base formula 0x61b910:** 11,857 vectors the harness lane made by running the real machine code on generated inputs
   (`D:\Tools\ffx-parity\vectors\ffx2\base_damage.json`: all 25 formulas, out-of-range formulas, wild stats, the heal
   sign, a scripted RNG that logs the stream and the number of draws). The kernel matches every vector in value, draw
   count and stream. The harness lane's own independent Python port agrees with the kernel on the hand examples.
3. **Orchestrator 0x6172c0:** this lane built a Unicorn driver around the real function (Chr structures, command row,
   result buffer, the two globals it reads, the square-root import replaced by one instruction, the back-attack angle
   helper replaced by "return the angle I gave you") and ran **33,440 cases**: 3,000 and 30,000 random scenarios
   (seeds 20261008 and 777: every modifier switched on at random, three damage classes, ATB pool charging or
   recovering, gate failures, aided characters) and 440 directed ones (death-inflicting hits, a Petrified target with
   and without Shatter, a Haste or Slow rider that fails, aided characters at every aid count, the target-gate corners,
   wild magnitudes up to 2^31). The TypeScript kernel was compared on the three damage numbers, the flag word
   (low 9 bits), the surviving-class byte, the chain value, the back-attack flag, the estimate and the exact draws
   consumed: **no difference**. Deliberate bugs (floor-halving, no back attack, chain after element) were caught by the
   same comparison, so it is not vacuous. A 384-case reduced copy is `tests/fixtures/parity/ffx2/damage_target.json`.
4. The unit tests carry hand-worked examples (the arithmetic is in the comments); the pipeline examples were also run on
   the real orchestrator and gave exactly those numbers.

Not covered by (3): the geometry behind the back-attack test (an input to the kernel), the status rolls themselves (the
group 1 / group 2 status kernels own those, their outcome is an input here), the debug switches, and the two
bookkeeping counters (`blocked`, the result code) the HUD reads. Details in §7.

**Notation.** `Chr+0xNNN` is an offset into the 0x17E0-byte battle character; `Cmd+0xNN` an offset into the command
row; `ActionRec+0xNN` an offset into the 0xCC-byte queued action. "Attacker" is the user, "target" the defender.
Stat bytes (STR, DEF, MAG, MDEF, Luck) are read as unsigned bytes; the five stage bytes are read as signed bytes (a
stage of +3 is a factor of 15/12, of -3 a factor of 9/12). All arithmetic is 32-bit: a product that does not fit
**wraps** (IMUL keeps the low 32 bits) and every `/` **truncates toward zero** (the shift forms add a bias for negative
numbers first). The engine's own integer helpers floor instead.

## 1. Base damage (0x61b910)

One call takes the attacker's and the target's numbers, the command row's formula byte and power byte, and returns
one signed 32-bit number (negative for a healing command). It is called once per damage class (HP, MP, ATB), once more
as a "preview" for the result's estimate field, and by the AI's damage estimator.

**The variance.** Unless the call is a preview, the function first draws one value from the attacker's "mode 0"
RNG stream (stream `id + 0x14` for a party slot, `id + 0xd` for a monster slot 15 to 30) and sets the variance
`v = (draw & 0x1f) + 0xf0`, which is 240 to 271 (out of 256). **The draw is made before the formula is looked at, so
formulas that never use `v` still consume one draw**; a preview uses `v = 0x100` and draws nothing.

Symbols: `L` attacker level (Chr+0x380, signed 32-bit); `STR`, `MAG` the attacker's bytes (+0x396, +0x398) and `STRst`,
`MAGst` their stages (+0x43f, +0x440); `DEF`, `MDEF` the target's bytes (+0x397, +0x399) and `DEFst`, `MDEFst` their
stages (+0x441, +0x442); `P` the power byte (Cmd+0x2b); `aHP`, `aMaxHP`, `aMP`, `aMaxMP` the attacker's HP and MP
(+0x3b4, +0x384, +0x3b8, +0x388); `tHP`, `tMaxHP` the **target pool** the caller passes (the target's HP for the HP
class, its MP for the MP class, its ATB pool for the ATB class). Every `*` wraps and every `/` truncates.

| Formula | What it is | Steps |
|---|---|---|
| 0 | physical | `a = ((STR+L)*STR*L)/1024 + STR`; `a = a*(270-DEF)/255`; `a = a*(STRst+12)/12`; `a = a*(12-DEFst)/12`; `r = ((a*P)/16*v)/256` |
| 1 | physical, no DEF | as 0 with the constant 270 in place of `270-DEF`; the DEF **stage** still applies |
| 2 | magic | `q = (MAG+2L)*P*P`; `a = q/64`; `a = a*(270-MDEF)/255`; `a = a*(MAGst+12)/12`; `a = a*(12-MDEFst)/12`; `r = (a*v)/256` |
| 3 | magic, no MDEF | as 2 with 270 in place of `270-MDEF`; the MDEF stage still applies |
| 4 | % of current HP | `r = (P*tHP)/16` |
| 5 | fixed | `r = P*50` |
| 6 | recovery magic | `q = (MAG+2L)*P*P`; `a = q/128`; `a = a*(MAGst+12)/12`; `r = (a*v)/256`. No defence term, no target stage |
| 7 | % of max HP | `r = (P*tMaxHP)/16` |
| 8 | fixed with variance | `r = ((v*P)*50)/256` |
| 9 | special magic | as 0 built on MAG: cubic term on MAG, `270-MDEF`, `MAGst`, `12-MDEFst` |
| 0xa | leave 1 HP | `r = tHP > 0 ? tHP-1 : 0` |
| 0xb | % of attacker max HP | `r = (P*aMaxHP)/16` |
| 0xc | amount curve (floating point) | with `A = float32(amount)` (ActionRec+0xb0), `s = float32(sqrt(A))`: `r = trunc(float32(22*A*s / (A + 20*s)))`, 0 when `amount <= 0`. The 22 and the 20 are doubles in the exe's data; the products run on the x87 stack at 53-bit precision (the runtime start-up sets that), the two `float32` roundings are stores to memory |
| 0xd | record field times power | `r = P * (target record +0x44)` for target ids below 0x17, else 0 |
| 0xe | P times 9999 | `r = P*9999` |
| 0xf | the power itself | `r = P` |
| 0x10 | variance times power | `r = (v*P)/256` |
| 0x11 | attacker missing HP | `r = ((aMaxHP-aHP)*P)/16` |
| 0x12 | power times level | `r = P*L` |
| 0x13 | attacker current HP | `r = (P*aHP)/16` |
| 0x14 | physical, DEF works for the attacker | as 0 with `(DEF+15)` in place of `(270-DEF)` and `(DEFst+12)` in place of `(12-DEFst)` |
| 0x15 | formula 0 scaled by the MP deficit | `r0` = formula 0's result; `r = (((aMaxMP-aMP)*r0) << 2) / aMaxMP`. The divide faults the CPU if `aMaxMP` is 0 |
| 0x16 | formula 0 plus a record field | `r = r0 + (attacker record +0x44)` for attacker ids below 0x17 |
| 0x17 | formula 0 plus 99999 | `r = r0 + 99999` when the attacker record field +0x40 is 0 and the attacker id is below 0x17 |
| 0x18 | delay | `r = (Cmd.flags_misc & 0x1000 ? 4000 : 0) + (flags_misc & 0x2000 ? 8000 : 0)` (the two rom.bin delay counts) |
| above 0x18 | nothing | `r = 0` |

After the switch, if the command row exists and `Cmd.flags_damage & 0x10`, the result is negated (a healing command).

Where the variance reaches the result: formulas 0 to 3, 6, 8, 9, 0x10 and 0x14 to 0x17. For 4, 5, 7, 0xa to 0xf, 0x11 to
0x13 and 0x18 the number is the same at every draw, but the draw still happens. Overflow: the cubic term of formula 0
reaches 8.9 million at Lv 99 and STR 255, the largest products stay below 2^31 for every in-game input, so the wrap is
only reachable with out-of-range numbers (the vectors include them and the kernel wraps like IMUL). The only
floating-point formula is 0xc. Formulas 0xd and 0x16/0x17 read the 0x80-byte per-character records (base 0xe006c0 live)
whose +0x40 and +0x44 fields are not named yet; the engine's Momentum and Finale rules look like their users, but that
is a guess (§7).

**Which formulas the shipped command tables use** (the 809 damaging rows of the player command table and the monster
magic table, from the analysis lane's table extract): formula 0: 327; 1: 34; 2: 110; 3: 8; 4: 57; 5: 34; 6: 16; 7: 91;
8: 43; 9: 59; 0xa: 11; 0xb: 1; 0xc: 1; 0xf: 2; 0x11: 2; 0x12: 9; 0x13: 1; 0x14: 1; 0x16: 1; 0x17: 1. Formulas 0xd, 0xe,
0x10 and 0x15 appear in no row; 31 rows carry the delay bits that force formula 0x18.

## 2. The per-target orchestrator (0x6172c0)

One call computes one target's result for one hit. Arguments: attacker id, attacker record, target id, target record,
`allFlag` (ActionRec+0x27), `amount` (ActionRec+0xb0), the command id, the command row, a 0x80-byte result buffer and a
mode (0 for a real hit; the damage estimator calls it with 2, and the debug byte passed by the normal caller is 0).
Any mode but 0 is a **preview**: variance 0x100 and no critical roll.

**The target gate.** The function does nothing but fill in the estimate when any of these fails: the target is in the
battle (commands 0x3181 and 0x31ea skip this test); a command with `flags_misc & 0x40000` needs a dead target; a command
without `flags_target & 0x40` needs a living one; the target's byte Chr+0x5ac is not 1 unless `flags_target & 0x400`.

**Classes.** `Cmd.damage_class` (Cmd+0x27) says which pools the command hurts: 1 HP, 2 MP, 4 ATB. A command whose
`flags_misc` has 0x1000 or 0x2000 (a delay) gets the ATB class added and uses formula 0x18 for it. If the power byte is
0 **no class is computed and no draw is made** (the class bits stay in the flag word). The classes run in the order
HP, MP, ATB. Element byte of the hit: the command's own (Cmd+0x2e), OR-ed with the attacker's weapon element (Chr+0x3af)
when `flags_misc & 0x10000`.

### 2.1 The HP class, in the order the instructions run it

1. **Base formula** (§1) with the HP pool; **aid scale**: for formulas 0 to 3 and 9 only, each *aided* character
   (a player-side monster: not a monster slot, save index byte Chr+0x11 in 15 to 22) multiplies by `(aidCount+1)/4`,
   truncated; `aidCount` is a HUD value, 3 by default, which is exactly x1. It never happens in an ordinary fight.
2. **Critical hit**, only if this is not a preview and `Cmd.flags_damage & 4`: the critical kernel rolls (`kernel/crit.ts`, spec in
   `research/re-ffx2-hit-status.md`); a critical doubles the number (32-bit add) and sets result flag 0x100. The roll is
   drawn from the **same mode-0 stream, right after the variance draw**.
3. **Berserk** (attacker status word 1 bit 0x80): `x*5/4`, truncated.
4. **Booster** (attacker auto-ability word Chr+0x650 bit 0x20, and the command's sub-menu category byte Cmd+0x0e is 1 or 2):
   `x*3/2`, truncated.
5. **Item doublers**, only for command ids 0x2000 to 0x2fff: a damaging item doubles with Element Master (Chr+0x650 bit
   0x200) if its element byte is non-zero, with Non-Element Master (bit 0x400) if it is zero; a healing item
   (`flags_damage & 0x10`) doubles with Medicine (bit 0x100) only for formulas 5 and 7.
6. **Species killers:** for each of the 16 bits that the target's species word (Chr+0x660) and the command's killer word
   (Cmd+0x78) share, `x << 2` (x4 per bit).
7. **Back attack,** physical class only (`flags_damage & 3 == 1`): if the angle between the target's facing and the attacker
   is beyond +-1.9634955 rad (112.5 degrees), `x*2` and result byte +0x31 is set.
8. **Chain,** only for a positive number whose target has a non-zero chain counter (Chr+0x5ad): `x = (counter+28)*x / 20`,
   truncated; the counter value is recorded in result +0x30. (§4.)
9. **Element ladder** (§3) on the hit's element byte.
10. **Percent immunity:** a positive number from formula 4 or 7 against a target with Chr+0x3a6 bit 0 becomes 0, the HP
    class is dropped from the surviving mask.
11. **Shell** (`flags_damage & 3 == 2`, Chr+0x438 non-zero): `x/2`, flag 0x20. **Protect** (`& 3 == 1`, Chr+0x439
    non-zero): `x/2`, flag 0x40. **Defense** (`& 3 == 1`, target status word 1 bit 0x200): a positive number becomes 1, a
    negative one -1, flag 8; zero stays 0.
12. **Immunity bytes,** positive numbers only: Chr+0x449 (invincible) or, by class, Chr+0x447 (physical) / Chr+0x448
    (magical) non-zero turns it into 0 and drops the HP class from the surviving mask.

A heal is a negative number all the way through; steps 8, 10 and 12 skip it, steps 3, 4, 6, 7 (doubling) and 11's halving
act on it with truncation toward zero.

**The order the brief expected versus the order the code uses:** the back attack comes before the chain (not after
Defense); the chain comes before the element step; the all-target halving comes after Shell, Protect, Defense and the
immunity bytes (§2.4), not before them.

### 2.2 The MP class

Base formula with the **target's MP and max MP** in the pool slots; aid scale; steps 4, 5 and 6 above (Booster, item
doublers, species killers). Then, for a positive number: it is **cut to the target's current MP**, and if still positive
the immunity bytes (step 12) zero it and drop the MP class. No Berserk, no critical hit, no back attack, no chain, no
element, no Shell or Protect. A negative number (an MP heal) is not cut.

### 2.3 The ATB class

Surviving-mask bit 4 is cleared first (always). Base formula with the **target's ATB pool** in the pool slots: while the
target is charging an action its remaining charge and the charge maximum, otherwise its remaining recovery and the
recovery maximum (remaining values below 0 read as 0; a charging action with maximum 0 falls back to recovery). Then the
aid scale and, for a positive number, the immunity bytes. Nothing else applies.

### 2.4 After the status rolls (`settle.ts`)

The rest of the function runs the status machinery (groups 1 and 2, Shatter, magic cancel, bribe, steal), which the status
kernels own. Five of its effects change the three numbers, in this order:

1. A group 2 **Haste or Slow rider that fails to land** (status index 4 or 5) zeroes the ATB number.
2. A **Petrified** target (status bit 2) whose result status mask still has Petrify and was not **Shattered** by this hit
   (mask bit 0x400) takes nothing: HP, MP and ATB are 0 and the surviving mask is cleared.
3. A target with Chr+0x3a6 bit 0x40 takes no ATB damage.
4. **All-target halving:** if `Cmd.flags_target & 0x80` and `ActionRec+0x27` is non-zero, HP, MP and ATB are each `x/2`,
   truncated toward zero (§5 for what sets that byte).
5. A hit whose result status mask has **Death** while the target is alive replaces the damage: all three numbers are 0, the
   class bits of the flag word are cleared.

Then the **Damage 9999** attacker status (word 1 bit 0x4000), if the HP class is still in the flag word: an HP number
from 1 to 9998 becomes 9999 and one from -1 to -9998 becomes -9999. Last, the **limit**: HP, MP and ATB are each clamped
to `-cap..cap`, where `cap` is 9999, or 99999 when the attacker's Chr+0x652 bit 0 (Break Damage Limit) is set; command
flag `flags_damage & 0x80` forces 99999, else `& 0x40` forces 9999. Results go to result +0x74 (HP), +0x78 (MP), +0x7c
(ATB); +0x70 holds the estimate.

### 2.5 Draws, in order

All from the attacker's mode-0 stream, one value each: the HP class variance; the critical roll (only if the command can
crit and it is a real hit); the MP class variance; the ATB class variance. A class the command does not use draws
nothing; a preview draws nothing; power 0 draws nothing. The status rolls use the attacker's **mode-2** stream (+0x20),
hit rolls mode 1 (+0x10): different streams never disturb each other.

### 2.6 The estimate (result +0x70)

Always computed, even when the gate fails: the base formula in preview mode on the target's HP, with no modifier at all.
What reads it was not traced.

## 3. The element ladder (0x618780)

Inputs: the hit's element byte (8 bits) and the target's four bytes (Chr+0x3b0 absorb, +0x3b1 null, +0x3b2 half, +0x3b3
weak), one bit per element (bit 0 fire, 1 ice, 2 thunder, 3 water, 4 gravity, 5 holy; 6 and 7 are the remaining two). The
ladder, first rung that applies wins:

1. no element: unchanged.
2. **Weak:** for each of bits 0 to 6 shared by the attack and the weak byte, double (they compound). Bit 7 is special: if
   both have it the function returns the number doubled once more **at once**.
3. If any doubling happened, return.
4. **Neutral:** if any attack bit has no entry at all on the target (not null, not half, not absorb) the number is
   unchanged, whatever the other bits do. One neutral bit shields the hit from every resistance.
5. **Half:** a bit that is half and neither null nor absorb halves the number (truncating toward zero).
6. **Null:** a bit that is null and not absorb makes the number 0.
7. **Absorb:** any shared absorb bit negates the number (a hit becomes a heal, a heal a hit). A bit that is both null and
   absorb therefore absorbs.

## 4. The chain counter, HP and MP application (0x61b750, 0x61b830, 0x643d80)

The chain is a **byte on the target** (Chr+0x5ad), not a timer. Applying a positive HP number to a character adds 1 to
it (stopping at 99) and keeps the best value in Chr+0x5ae; a zero or negative number does nothing to it, so an immune hit,
a heal and a miss never extend a chain. The orchestrator reads the counter **before** the hit: counter `n > 0` multiplies a
positive number by `(n+28)/20`, truncated, so the first hit on a fresh target is x1, the second x1.45 (29/20), the third
x1.5, the 13th x2 and the 100th link x6.35 (127/20).

The per-step character update (0x643d80) resets the counter to 0 when the target is Stopped (Chr+0x43e non-zero) or
Petrified (status bit 2), or when **both** hit-reaction fields of its motion block (a byte at Chr+0xd98 and a dword at
Chr+0xd58) are 0: the chain lasts while the target is still reacting to the last hit. Its length in seconds is the
length of that animation, which is not a number in the exe. (Character ids 3 to 8 read the status of the girl they map
to: 3 and 4 -> 0, 5 and 6 -> 1, 7 and 8 -> 2.)

HP application: after the chain step, the running damage total (Chr+0x7c) grows by the number and is floored at 0, and HP
becomes `clamp(HP - n, 0, maxHP)`; negative numbers heal. MP application: `clamp(MP - n, 0, maxMP)`. ATB application (0x61b620,
not modelled) lengthens the charge or the recovery.

## 5. What sets ActionRec+0x27 (the "all targets" byte)

It is the **all-targets choice** of the queued action. Writers: (1) the battle HUD's command packet carries one byte per
command and the packet-to-action function copies it in (0x6410a0), so a girl who picks "all" for a command that allows it
sets it; (2) `pp_action_enqueue` (0x649130) stores its fourth argument there: the Berserk autopilot (0x6490d0) and the dice
roll (0x645580) pass 0, Confusion (0x649350) passes `rng(mode 0) & 1` when the chosen command has `flags_target & 0x80`
and 0 otherwise; (3) commands the **monster AI scripts** issue are built by 0x634cd0, which zero-fills the action record
and never writes +0x27. The byte is read by the target-mask expander (a single-target command with the byte set becomes a
multi-target one) and by the orchestrator's halving. Consequence: **only player-chosen all-target casts and Confusion
halve; scripted boss commands (Bahamut's Mega Flare, the Oversoul's borrowed spells, every monster-table row) never do**,
even where the row carries the 0x80 flag (64 rows do: 51 player commands and 13 monster magic rows).

## 6. Engine versus the game, as of main 157562f8

`src/battle/ffx2/formulas.ts` is a float chain with one truncation at the end (line 316). The tests below compared its
`computeDamage` with the kernel over 4,000 random samples per row (a temporary test, deleted); "differ" counts samples
whose integer results are not equal, "material" those that differ by at least 3% and at least 2.

| # | Where (engine) | Engine | Game | How often |
|---|---|---|---|---|
| 1 | `formulas.ts:69,84,249,251,263-276,282,316` | float chain, one `Math.trunc` at the end | an integer truncation after every `/` (1024, 255, 12, 12, 16, 256; 64 or 128 for magic) | no modifier: strength 70% of samples differ (2.8% materially), magic 44% (0.7%), special-magic 70% (2.6%), healing 19% (0%); the engine's magnitude is never smaller; mean 1 to 3 points, max 28. With a modifier on the same hit: 52 to 88% differ (crit 83%, Berserk 87%, back attack 85%, chain 88%, weak 84%) |
| 2 | `formulas.ts:287` | the variance multiplies every family except `extra.noVariance` | variance only in formulas 0 to 3, 6, 8, 9, 0x10, 0x14 to 0x17; the percent formulas 4 and 7, fixed 5, 0xa, 0xb, 0xe, 0xf, 0x11 to 0x13 never use it | `percent-current` 30% differ (16% materially), `percent-total` 8.5%, `fractional` 7% (the rest hit the 9,999 cap), `fixed-no-variance` 87%. Shipped abilities on these keys: 20 + 25 + 4 + 6 = 55 of the 285 damaging ones. At roll 256 all of them match exactly. (`fixed` is formula 8 and is right.) |
| 3 | `formulas.ts:168,172,257,270` | `piercing-strength` / `piercing-magic` skip the 270/255 factor and the target's stage | formulas 1 and 3 use the constant 270 (x1.0588) and still apply the target's DEF / MDEF stage | 80% and 69% materially; Lv 20, STR 71, power 16: engine 197, game 208; with DEF stage +3 engine 197, game 156. 13 shipped abilities |
| 4 | `formulas.ts:308,311-312` + `execute.ts:283` | multi-target x0.5 as step 15, before Protect/Shell, only for the player's Black/White magic with an all-targeting; each factor a float | halving after Shell, Protect, Defense and the immunities, `/2` toward zero on HP, MP and ATB, for any command with `flags_target & 0x80` when the player chose "all" (64 rows have the flag) | rounding only: about 24% of magic samples differ by exactly 1 (engine higher) with Shell or a multi-target cast alone, 11.9% with both |
| 5 | `formulas.ts:322` | Defend clamps a physical hit of 2 or more to 1; a heal is never clamped | a positive physical hit becomes exactly 1 and a negative one exactly -1 | 0.7% of hits (values 1 vs 0 after rounding); heals: only a physical heal on a Defending target (rare) |
| 6 | `formulas.ts:325` | Damage 9999 snaps `0 < amount < 9999` only | snaps 1 to 9998 and also -1 to -9998 (a heal becomes -9999) | a healer with the status: engine -252, game -9999 for the same Cure; 82% of samples of that case |
| 7 | `formulas.ts:301`, `chain.ts:37-40`, `constants.ts:116-117` | `1.4 + 0.05n` as a float, applied at step 13 | `(n+28)/20` on the integer number | same value, but the float sum is 1.5499999999999998 at n = 3: base 20 gives 30, game 31. 378 of 39,600 (chain, base) pairs lose a point |
| 8 | `formulas.ts:304` | element priority absorb, immune, weak, resist; weaknesses compound | weak first (and it returns), then the neutral-bit shield, half, null, absorb | single-element hits: identical apart from rounding; a multi-element attack differs (weak plus absorb: engine absorbs, game doubles). No shipped ability has two elements |
| 9 | `formulas.ts:194-195` | `user-max-hp` is `maxHp * power / 10` | formula 0xb is `P * aMaxHP / 16` | a unit mismatch in the data, not the rule (power 20 gives 4,000 in the engine and 2,500 in the game); 1 shipped ability (Charon) |
| 10 | `chain.ts:65-103`, `resolve.ts:168` | a 2 s (3 s after a crit) window on the global clock; the counter increments on every registered hit | a byte counter that increments only when a positive HP number is applied and resets when the target's hit reaction ends or it is Stopped or Petrified | zero-damage and healing hits already skip the chain (D-242 agrees with the exe); the 2 s / 3 s have no counterpart in the exe |
| 11 | `resolve.ts:123-127` | draws crit, then the randomiser, from the one engine stream | variance, then the crit roll, from the attacker's mode-0 stream; hit rolls and status rolls on other streams | every seeded replay differs; distribution identical |
| 12 | `formulas.ts:231-360` | one HP number per hit | three classes with their own draws (HP, MP, ATB), item doublers, Medicine, aided characters, Break Damage Limit as a flag | the MP and ATB classes are special-cased in the engine (`mpOnly`, `aeon-effects.ts`) |

`gil` (formula 0xc), `special-magic` and `healing` match apart from rounding: `22*A*sqrt(A) / (A + 20*sqrt(A))` is
algebraically the engine's `22*gil / (sqrt(gil) + 20)`, and the engine's `healing` differs from the game only by the
missing truncation (19% of samples differ by 1 at a random roll, 0 at roll 256).

## 7. Not pinned, and what the anchor map got wrong or left open

- **Anchor map corrections.** Formula 0xc is not "sqrt(amount)": it is the float32 curve in §1 (the harness lane found it
  too). The decompiler's "A/6/2" in the physical formulas is a truncating divide by 12. The anchor's order for the HP class
  has the all-target halving after the immunity bytes (right), but it does not say that the back attack is before the chain,
  that the chain needs a positive number, that the MP number is cut to the target's MP before the immunity check, that
  the ATB class feeds the target's ATB pool into the base formula, or that a failed Haste/Slow rider zeroes the ATB number.
- **Record fields +0x40 and +0x44** (formulas 0xd, 0x16, 0x17): which game quantities they are is unknown.
- **Formula 0xc's `amount`** is ActionRec+0xb0; what puts a value there (a gil-throw command, presumably) is not traced.
- **The back-attack geometry:** the threshold (+-1.9634955 rad) is known; the angle itself comes from positions and
  facing and is an input.
- **Chr+0x5ac:** only its effect (blocks targeting when 1) is known.
- **Result code and `blocked`:** the byte at result +1 and the "no effect" counter (`blocked` in the kernel) feed the HUD's
  miss/ineffective display; the kernel keeps `surviving` (compared with the emulator) and `blocked` (not compared).
- **x87 precision:** formula 0xc assumes the 53-bit control word the harness sets (the vectors agree).
- **Debug switches** (force damage 1 / 10000 / 100000, block a side's damage, force critical) are ignored.
- **ATB application** (0x61b620), the status rolls, magic cancel, steal and bribe are separate kernels or out of scope.
