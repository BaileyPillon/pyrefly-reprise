# FFX base damage, the per-hit modifier chain and the damage cap: what the game code does

**Game case: FFX only.** FFX-2 has its own damage functions in its own exe; they get their own notes. Part of the
`re-parity` track ([docs/plans/re-parity.md](../docs/plans/re-parity.md)). Drafted 2026-10-08.

**Source note (applies to every statement below unless a line says otherwise):** FFX.exe, Steam build 25501027,
SHA-256 0537B2A1...686D (the HD Remaster's 32-bit executable, image base 0x00400000; every "VA" below is a virtual
address in that image). Read in Ghidra 12.1.4, both the decompiler and the disassembly. Everything is written in our
own words: no game code and no game text is reproduced here.

| This note | Kernel (pure TypeScript, not wired into the engine yet) | Tests |
|---|---|---|
| §1 integer rules | `src/battle/ffx/kernel/int32.ts` | `tests/unit/parity-ffx-int32.test.ts` |
| §2 base damage, formulas 1 to 0x17 | `kernel/damage.ts` | `parity-ffx-damage.test.ts` |
| §3 the pipeline of one hit, draw order, clamp | `kernel/hitdamage.ts`, `kernel/hittypes.ts`, `kernel/aftermath.ts` | `parity-ffx-hitdamage.test.ts`, `parity-ffx-element.test.ts` |
| §4 the modifier steps | `kernel/modifiers.ts` | `parity-ffx-modifiers.test.ts` |
| §5 elemental affinity, Nul-element check | `kernel/element.ts` | `parity-ffx-element.test.ts` |
| §6 the damage cap and the clamp | `kernel/aftermath.ts` | `parity-ffx-element.test.ts` |

## 0. How this was checked

1. Each function's decompile and disassembly were read for operand widths, signed or unsigned divides and shifts (the
   decompiler hides the difference between an arithmetic and a logical shift), and for the order of the multiplications
   and divisions. Where the compiler replaced a division by a multiply-and-shift sequence, the sequence was identified
   and its exactness checked in the emulator (§1).
2. The real machine code was run in an x86-32 emulator on generated inputs (the harness of the `re-parity` track), with
   only the RNG function, the stream helper, the hit roll, the status infliction and the hit-reaction code replaced, and
   every result compared with the TypeScript kernel:

   | Function | Vectors | Differences |
   |---|---:|---:|
   | base damage 0x789bf0, random inputs over all 25 formula slots, every mode, variance on and off, every status bit | 30,000 | 0 |
   | base damage, dense grids: every DEF byte and every MDF byte against 4 to 7 stat levels, the 32-bit wrap region | 70,368 | 0 |
   | elemental affinity 0x78a360 | 150,000 | 0 |
   | Nul-element check 0x78bfb0 | 50,000 | 0 |
   | party percent, scale override, Armored, Shield/Boost, Delay Attack, one at a time (24,000 each) | 120,000 | 0 |
   | the whole per-hit pipeline 0x78e630 (HP, MP and CTB classes, every modifier, statuses, clamp, running totals, the draw count) | 270,000 | 0 |

   About 155,000 of the pipeline vectors are hits that reach the damage classes; the rest are misses, "no effect",
   nullified hits and the like. A mutation check confirmed the vectors can tell the order of the steps apart: swapping
   the crit and Shield steps, Boost and Shield, the percent bonus and the element, the element and Armored, using floor
   instead of truncating division, a fixed 9999 cap, or taking the un-varied base before the hit reduces the running
   totals, each made between 55 and 4,400 of the 120,000 vectors fail (swapping steps that are the same operation, such as Berserk and
   Magic Booster, or the two halvings, changes nothing, as it should).
3. The vector files and the scripts that make them are outside the repo (`D:\Tools\ffx-parity\kernel-check\`, with
   the generator specs in `specs\` and `reduce_vectors.py`). `tests/fixtures/parity/ffx/` holds stratified subsets of at
   most ~300 KB each (`base_damage.json` 551 vectors, `calc_hit.json` 212, `element_mod.json` 1,070, `small_mods.json`
   1,350), which the tests replay. A vector's `in` object has the shape of the kernel's input.

**Notation.** `Chr+0xNNN` is an offset into the battle character structure (stride 0xF90; ids 0..7 party, 8..0x11 aeons,
0x14..0x1b monsters). `Cmd+0xNN` is an offset into the 0x5c-byte command record. `Rec+0xNN` is an offset into the
0x2c-byte hit record, a per-target snapshot of the target's statuses taken when the action starts (`Rec+0x07` to
`Rec+0x13` copy the thirteen turn counters `Chr+0x608` to `Chr+0x614`: +0x07 Sleep, +0x0a Shell, +0x0b Protect, +0x0d to
+0x10 the four Nul counters; `Rec+0x14` copies the permanent status word `Chr+0x606`; `Rec+0x16` the extra status word
`Chr+0x616`). "User" is the attacker, "target" the defender, "class" a damage class (1 HP, 2 MP, 4 CTB).

## 1. Integer rules

Everything is 32-bit integer arithmetic on registers.

* **Products wrap.** A product past 2^31 turns negative (IMUL keeps the low 32 bits). Section 7 lists where that can
  actually happen.
* **Division by 2, 4, 16, 32 and 256 rounds toward zero**, not toward minus infinity: the compiler adds `2^k - 1` to a
  negative value before the arithmetic shift. This is why negative values (healing, and a Zombie turning a heal into
  damage) cut the same way as positive ones. The engine's own helpers floor.
* **Divisions by 3, 6, 10, 11, 15, 100 and 730 are signed** and also truncate toward zero. The game uses a
  multiply-by-reciprocal sequence in place of each; every one of them equalled an exact truncating division in all
  the emulator vectors (several hundred thousand, including values near +-2^31). The party percent "taken" step divides by
  -100, which the compiler writes with a negative reciprocal; it truncates toward zero too.
* **Unsigned steps** (a logical shift or an unsigned multiply-high): formula 0xa (`>> 4`), formula 0x10 (`/ 10`) and
  formulas 0x11 to 0x13 (`/ 110`, `/ 60`, `>> 4`, `>> 8`), the HP% and MP% divisions inside 0x11 to 0x13. A wrapped
  product is read there as a large positive number.
* A divide by zero (a user with 0 max HP in formulas 0x11 and 0x13, 0 max MP in 0x12) faults in the game; the kernel
  throws.
* Stat bytes (STR, DEF, MAG, MDF, the stack counters) are read as unsigned bytes; HP, MP and the running totals as
  signed 32-bit numbers.

## 2. Base damage (VA 0x789bf0)

One call computes the base damage of one hit for one damage class. Inputs: user, target, the command record (may be
absent), the formula number, the power byte, the target's permanent-status snapshot word (only its low byte is read),
the mode (1 HP, 2 MP, 4 CTB), a "variance on" flag, and a default value.

**Set-up, in order**

1. The stream index for the user's mode 0 stream is looked up (`Chr+0x0c`, see `research/re-ffx-rng-hit.md`).
2. DEF is `Target+0x5a9` and MDF `Target+0x5ab`. The mode picks a "saved" value and a "maximum": mode 1 the running HP
   (`Target+0x6e4`) and max HP (`+0x594`), mode 2 the running MP (`+0x6e8`) and max MP (`+0x598`), mode 4 the running
   CTB (`+0x6ec`) and base CTB (`+0x65d`); any other mode gives 0 and 0.
3. If a command is present and its damage class (`Cmd+0x23`) has the HP bit, then snapshot bit 0x40 (Armor Break) sets
   DEF to 0 and bit 0x80 (Mental Break) sets MDF to 0. Neither is "floored at 1": a target with a natural DEF of 0 uses
   the term for 0.
4. **The variance factor `V`**: if the variance flag is on, **one RNG draw is taken here, before the formula switch,
   whatever the formula**, and `V = (draw & 31) + 240` (240 to 271); otherwise `V = 256` and nothing is drawn.
5. The formula byte picks the case (1 to 0x17). Formula 0, or anything above 0x17, returns the default value.

**Building blocks.** `cube(s) = (s * s * s) / 32 + 30` (division toward zero, the product 32-bit). `dt(x)`, the defence
term, `= 730 - (51 * x - (x * x) / 11) / 10`: 730 at 0, 725 at 1, 632 at 20, 498 at 50, 311 at 100, 74 at 200, 21 at
255. `reduce(a, b, stack) = (((b * a) / 730) * (15 - stack)) / 15`, the shared tail of formulas 1 and 3.

**The 23 formulas**, in the order the game performs the operations. All signed 32-bit unless marked U. `power` is the
power byte, `cheer`/`focus` the stacks (`Chr+0x65e`, `Chr+0x660`), `V` as above.

| # | Name (community enum) | Result |
|---:|---|---|
| 1 | Strength vs DEF | `x = reduce(cube(user.cheer + user.STR), dt(DEF), target.cheer)`; `r = ((x * power) / 16 * V) / 256` |
| 2 | Strength, DEF ignored | `r = ((cube(user.cheer + user.STR) * power) / 16 * V) / 256` (the target's Cheer is not used) |
| 3 | Magic vs MDF | `s = user.focus + user.MAG`; `q = ((s*s / 6 + power) * power) / 4`; `x = reduce(q, dt(MDF), target.focus)`; `r = (x * V) / 256` |
| 4 | Magic, MDF ignored | `r = (q * V) / 256` with `q` as in 3 (the target's Focus is not used) |
| 5 | Fraction of the running value | `r = (saved * power) / 16`, no variance (saved per mode) |
| 6 | Fixed | `r = power * 50` |
| 7 | Healing | `r = ((((user.MAG + user.focus + power) / 2) * V) * power) / 256` (the target's Focus is not used) |
| 8 | Fraction of the maximum | `r = (max * power) / 16` (max per mode) |
| 9 | Fixed with variance | `r = (V * power * 50) / 256` |
| 0xa | Target max MP | `r = (target.maxMP * power) >> 4` (U), whatever the mode |
| 0xb | Target base CTB | `r = (target.baseCTB * power) / 16` |
| 0xc | Target running MP | `r = (target.runningMP * power) / 16` |
| 0xd | Target running CTB | `r = (target.runningCTB * power) / 16` |
| 0xe | STR cube, no DEF | `r = (cube(user.STR) * power) / 16` (no Cheer, no variance); returns at once (see below) |
| 0xf | MAG cube | `r = ((cube(user.focus + user.MAG) * power) / 16 * V) / 256`; no defence, no target stack |
| 0x10 | User max HP | `r = (user.maxHP * power) / 10` (U) |
| 0x11 | Celestial HP | `h = user.HP * 100 / user.maxHP` (U); `r = ((((h + 10) * cube(user.cheer + user.STR)) / 110 * power) >> 4) * V >> 8` (U throughout) |
| 0x12 | Celestial MP | as 0x11 with `h = user.MP * 100 / user.maxMP` |
| 0x13 | Celestial Auron | as 0x11 with `(130 - h) * cube(...)` divided by 60 instead of `(h + 10) * ...` by 110 |
| 0x14 | MAG cube, no DEF | `r = (cube(user.MAG) * power) / 16`, no Focus, no variance; returns at once |
| 0x15 | Gil offered | `r = gilOffered / 10` (the signed global at VA 0x0112be90) |
| 0x16 | Save-record counter | `r = counter * power` where the counter is the field at +0x54 of the TARGET's party-save record (indexed by the target's id) when the target id is below 0x12, else the default value. The earlier anchor map reads it as a kill count (the two Karma commands). |
| 0x17 | Power * 9999 | `r = power * 9999` |

**Sign.** If a command is present, its flags (`Cmd+0x20`) have bit 4 (a healing command) and the snapshot does **not**
have Zombie (low-byte bit 1 of the snapshot word, value 2), the result is negated: healing is negative, and a Zombie
target takes the same number as damage. Formulas 0xe and 0x14 return before this step (and before writing the DEF and
MDF out-values), so they are never negated. The function also stores the DEF and MDF it used through two optional
pointers; the pipeline keeps them for the hit-reaction code only.

**Data.** Of the 979 command, item and monster-magic records the earlier lane decoded, the formulas in use are 0
(none), 1 to 9, 0xd, 0xf, 0x10, 0x15, 0x16 and 0x17. Formulas 0xa, 0xb, 0xc, 0xe, 0x11, 0x12, 0x13 and 0x14 are used by
no record (0xe and 0x14 are called directly with power 16 to compute the Overdrive "reference damage" for the
Warrior mode, command absent). Potion is formula 6 power 4 (200), Phoenix Down formula 8 power 8 (half of max HP).

## 3. The pipeline of one hit (VA 0x78e630)

Called once per hit of an action against one target. Inputs: user and target ids and structures, the command record and
id, the target's hit record, three counters. In order:

1. **Source of formula, power and element.** If the command uses weapon properties (`Cmd+0x1c` bit 0x40000, for
   example the plain Attack), the formula is `User+0x5c1`, the power `User+0x5c7` and the element `User+0x5d9 | Cmd+0x2d`;
   otherwise `Cmd+0x28`, `Cmd+0x2a` and `Cmd+0x2d`.
2. **Counter kind** (Counterattack / Evade & Counter) is worked out; not part of the damage kernels.
3. **Nul-element check** (§5). If it nullifies the hit: the record's outcome byte becomes 2, the result word is the
   command's damage class, nothing else happens (no hit roll, no draw).
4. **Hit roll** (`research/re-ffx-rng-hit.md` §4): 1 miss (outcome byte 1, miss counter, result word 0), 2 no effect
   (miss counter, outcome byte 0), 0 hit.
5. **A hit** with a non-zero power computes the classes:
   * **HP class** (command damage class has bit 1): the physical side effects (waking a sleeper, curing Confuse; not
     damage), then base damage with mode 1 and the **sixteen steps of §4 in order**.
   * **MP class** (result word bit 2): base damage with mode 2 (a fresh variance draw), then Magic Booster, then Alchemy,
     then, if the value is positive and above the target's running MP, it becomes the running MP, then the absorb flip.
   * **CTB class** (result word bit 4): the live-class word loses bit 4; base damage with mode 4 (a fresh variance
     draw), then the absorb flip.
   The MP and CTB classes get none of the HP steps (no Shield, Shell, crit, element, Armored, ...).
6. **Delay attacks** (§6), then Threaten's cancellation of delay.
7. **Status infliction** (`0x78ae00`, `0x78b4e0`; not in these kernels, passed in as a result).
8. **Petrified**, **delay immunity**, **newly dead** overrides (§6).
9. Stage buffs, Bribe and the reaction code (not damage).
10. **The clamp** (§6), the running totals, the overkill bit, and last the **un-varied HP base** written to `Rec+0x1c`:
    base damage with mode 1, variance off, snapshot 0 (so no Armor/Mental Break zeroing), computed **after** the clamp has
    reduced the running totals, so for formulas 5, 0xc and 0xd it reads the values left by this hit. It draws nothing,
    and is computed even for a miss.

**Order of the random draws** in one hit: Nul check (none) -> hit roll -> HP variance draw -> critical roll (only when
`Cmd+0x20` bit 2 is set; it is a draw from the same stream, `research/re-ffx-rng-hit.md` §5) -> MP variance draw (if
the MP class runs) -> CTB variance draw (if the CTB class runs) -> status rolls. Every variance draw is made whether or
not the formula uses it; none is made when variance is off. The kernel takes its randomness through callbacks so that
these draws happen in this order.

**Result word** (hit record +0x18): bits 1, 2, 4 are the command's classes; 0x08 Defend halved the hit; 0x10 Sentinel
halved it; 0x20 Shell halved it; 0x40 Protect halved it; 0x80 overkill; 0x100 critical; 0x8000 Shield quartered it;
the status steps add their own bits. A newly dead target clears bits 1, 2 and 4.

## 4. The sixteen steps of the HP class

All values are signed 32-bit and negative for healing. Addresses are of the step's function.

| # | Step (VA) | What it does |
|---:|---|---|
| 1 | base damage (0x789bf0) | §2, mode 1, the target snapshot's low byte |
| 2 | Shield / Boost (0x78c530) | the TARGET's current extra statuses (`Chr+0x616`): bit 0x40 (Shield stance) divides by 4 toward zero, sets flag 0x8000 and `Target+0x6da`; then bit 0x80 (Boost stance) multiplies by 3/2. Shield is first. |
| 3 | Shell (0x78adc0) | a magical command (`Cmd+0x20 & 3 == 2`) and a non-zero Shell counter in the record (+0x0a): divide by 2 toward zero, flag 0x20, hit marked reduced |
| 4 | Protect (0x78ad40) | a physical command (`& 3 == 1`) and a non-zero Protect counter (+0x0b): divide by 2, flag 0x40, hit marked reduced |
| 5 | critical hit (0x789690) | only when `Cmd+0x20` bit 2 is set (the roll is described in `research/re-ffx-rng-hit.md` §5); a critical hit doubles the value (32-bit add) and sets flag 0x100 |
| 6 | Berserk (0x78c0b0) | user permanent status bit 0x200 and the executing command id (`User+0xf5c`) equal to the user's default attack (`User+0x6c6`, 16-bit compare): x 3/2. Any other command is untouched. |
| 7 | Magic Booster / Auto-Life (0x78c580) | command id 0x311f: if `User+0x5ca` is non-zero, clear it and x 3/2; otherwise, user auto-ability word A (`User+0x6bc`) bit 0x40 and command type byte (`Cmd+0x17`) 1 or 2: x 3/2 |
| 8 | Alchemy (0x78c5f0) | word A bit 0x200, command id 0x2000 to 0x2fff, `Cmd+0x20` bit 4, resolved formula 6 or 8: x 2 |
| 9 | party percent (0x7891e0) | physical or magical command: if the user's "dealt" byte is non-zero, `v + v * dealt / 100`; then if the target's "taken" byte is non-zero, `v - v * taken / 100` (each product truncated toward zero before it is added or subtracted; the second works on the first's result). The four bytes per character are at VA 0x02311240 (user: bytes 0 and 1, target: bytes 2 and 3). |
| 10 | ratio immunity (0x78ad80) | resolved formula 5 or 8 and target special bit 2 (`Chr+0x5b8`): the value becomes 0, the HP bit leaves the live-class word, the immunity counter ticks |
| 11 | absorb flip (0x78a200) | `Cmd+0x1c` bit 0x100 and exactly one of {user permanent status bit 1 (Zombie, current), target snapshot bit 1}: negate |
| 12 | element (0x78a360) | §5 |
| 13 | Armored (0x78a830) | target special bit 0 set, **and** none of: `Cmd+0x1c` bit 0x10000 (the command pierces armor), user word A bit 0x2000 (Pierce), snapshot Armor Break (bit 0x40): divide by 3 toward zero. The damage type is not looked at: a spell is divided too unless its command carries the pierce bit. |
| 14 | Defend / Sentinel (0x78a7d0) | a physical command and the record's extra statuses (+0x16) have 0x800 (Defend) or 0x2000 (Sentinel): divide by 2, `Target+0x6da` set, flag 0x08 (Defend, also when both) or 0x10 |
| 15 | user Power / Magic Break (0x789290) | physical command and user permanent bit 0x10, or magical and bit 0x20: divide by 2 |
| 16 | damage immunity (0x78aac0) | target special bit 0x20 (physical), 0x40 (magical) or 0x80 (all): the value becomes 0, the HP bit leaves the live-class word |
| 17 | scale override (0x78bd90) | if `User+0xd26` is set: `dmg * (a + 2b) / (2b)` with `a = User+0xd2c` and `b = User+0xd30` single-precision floats, in x87 double precision, the damage rounded to single first, truncated to int. Set by the Overdrive timing code (Wakka's reel result and the hit-event timing); the same shape as the engine's timed-input bonus. A zero `b` gives 0x80000000. |

(Step 1 plus sixteen modifiers; the numbering is the position in the call order.)

Properties worth stating: nested truncating divisions commute (`(x/2)/2 == x/4`), but a multiplication by 3/2 or 2 and a
division do not, so the order of steps 2 to 9, 12 and 13 changes results in the last digit. Steps 3, 4, 9, 14, 15 and
16 are the only ones that look at the damage type; Berserk, Magic Booster, Alchemy and Armored look at the command instead.

## 5. Elemental affinity (VA 0x78a360) and the Nul-element check (VA 0x78bfb0)

**Element bits:** 1 fire, 2 ice, 4 thunder, 8 water, 0x10 holy; 0x20, 0x40, 0x80 are handled identically. The target has
four byte masks over the same bits: absorb (`Chr+0x5da`), null (`+0x5db`), resist (`+0x5dc`), weak (`+0x5dd`). With a
command element of 0 the value is unchanged. Otherwise, in this order:

1. every element bit of the command that the target is **weak** to multiplies the value by 3/2 (truncating each time);
   bits 0x01 to 0x40 in ascending order, then 0x80. If any weakness applied, that is the result: nothing below is read.
2. else, if any element bit of the command has **none** of null, resist, absorb on the target (a neutral bit), the value
   is unchanged;
3. else, if some bit is **resisted** and neither nulled nor absorbed: divide by 2 toward zero;
4. else, if some bit is **nulled** and not absorbed: 0;
5. else every bit is absorbed: negate.

So a resisted bit beats an absorbed bit, and a nulled bit beats an absorbed bit, on a multi-element command. (The earlier
anchor map states the opposite order; the emulator confirms this one.) Two weak bits compound as 3/2 then 3/2 with a
truncation in between (5 -> 7 -> 10), not as a single 2.25.

**Nul check.** Only fire (Nul-Blaze, `Rec+0x0e`), ice (Nul-Frost, +0x10), thunder (Nul-Shock, +0x0f) and water (Nul-Tide,
+0x0d) are counted. The hit is nullified when at least one of those is in the command and **every** one that is has a
non-zero counter; then each of those counters below 0xfe loses 1 (0xfe and 0xff never tick). Holy and the other bits are
ignored.

## 6. After the classes, and the clamp

**Delay Attack / Delay Buster (0x78e0f0).** `Cmd+0x1c` bit 0x4000 (Buster, k = 2) wins over bit 0x2000 (Attack, k = 1): the
CTB damage gains `tickSpeed(target AGI) * 3 * k / 2` (truncating) and result flag 4 is set. The tick speed comes from the
CTB table (0x7909c0); the kernel takes it as an input.

**Threaten (0x78bd50).** If flag 4 is on and the snapshot has Threaten (0x800), the CTB damage becomes 0 and bit 4 leaves
the live-class word.

**Status result.** The infliction step may change the snapshot words, add bits to the result word, and write the CTB
damage (Threaten); it also leaves a bypass flag. The kernel takes these as a `StatusOutcome`.

**Petrified (0x78ba30).** If the target was Petrified before (snapshot bit 4) and still is afterwards, and the record's
extra word does not have its bit 8 (the high byte's bit 0, Eject), all three damages become 0.

**Delay immunity (0x78c180).** With flag 4 on, `Target+0x5b9` bit 0 set and no bypass flag, the CTB damage becomes 0.

**Newly dead (0x78c480).** If bit 0 of the permanent status was clear before and is set after, all three damages become 0
and bits 1, 2, 4 leave the result word.

**The clamp** (end of 0x78e630):

* `cap = 9999`, or 99999 if the user has Break Damage Limit (`User+0x6be` bit 0x800); then `Cmd+0x20` bit 0x80 forces
  99999 and, if it is not set, bit 0x40 forces 9999.
* If the user's buff flags (`User+0x640`) have bit 8 ("every hit deals 9999") and the result word still has the HP bit,
  an HP value from 1 to 9998 becomes 9999 and one from -9998 to -1 becomes -9999; anything larger is left for the cap.
* Each of the three values is clamped to -cap..cap, stored in the record (+0x20, +0x24, +0x28), subtracted from the target's
  running total (`Target+0x6e4`, +0x6e8, +0x6ec), and the running total is then floored at 0. A heal raises it, with no
  ceiling.
* If `Target+0x5a4` (the overkill threshold, read at the start of the hit) minus the HP value is 0 or less, result bit
  0x80 is set. (A threshold of 0 therefore always sets it.)

## 7. Where 32-bit wraparound can happen

* **The last product of formulas 1, 2 and 0xf** (`value * V` after the `* power / 16`): the largest `V` is 271, so
  it wraps when the value before `V` exceeds about 7.92 million. At STR 255 with no Cheer, formula 2 (which ignores
  DEF) wraps from power 245 up and formula 1 does so against a DEF of 0; with 5 Cheer stacks from power 231. At STR 200
  or less no power wraps. The shipped data has two commands above these thresholds: the monster Zanmato
  (formula 1, power 250) and Judgment Day (formula 0xf, power 240).
* Formula 3 and 4 (the largest intermediate is about 5.4e8), 5 and 8 (running HP 99,999 times power 255), 9, 7 and 0x17
  cannot wrap with byte-sized inputs. Formula 0x16 multiplies a save-record counter by the power; it wraps for very large
  counters.
* Later steps: the critical doubling from 2^30 up; x 3/2 from about 7.2e8; the party percent product `byte * value` from
  8,421,505; `power * 9999` never.
* The kernel reproduces every one of these with `Math.imul`, truncating division and the explicit unsigned steps.

## 8. Corrections to the earlier anchor map, and open questions

Corrections (each confirmed by the emulator):

1. **Absorb flip** (0x78a200): the two bits are the USER's current Zombie bit and the TARGET snapshot's Zombie bit (the
   map said "target Zombie XOR the hit flags say absorbed").
2. **Element order**: resist beats null beats absorb across different bits (the map said absorb > null > resist); weakness
   anywhere decides it; one neutral bit leaves the whole hit unchanged.
3. **Un-varied base** (`Rec+0x1c`) is computed after the clamp reduced the running totals, with the snapshot 0.
4. **Armored** does not check the damage type, only the command's pierce bit (`Cmd+0x1c` bit 0x10000).
5. The **9999 buff** only rewrites 1..9998 and -9998..-1, and only while the result word has the HP bit.
6. **Formulas 0xe and 0x14** return before the heal sign and before writing DEF/MDF; the **variance draw is made even for
   the formulas that ignore it**.
7. **Petrified no-damage**: the exception is the record's Eject bit, not a "shatter".

Open questions:

* The party percent bytes (VA 0x02311240) are filled by the party-stat builder from equipment; the mapping from
  auto-ability to byte was not traced. The kernel takes the four bytes as input.
* The sources of `User+0x5ca` (the Auto-Life flag), `User+0x640` bit 8 (the 9999 buff) and the timing floats are set by
  other code (the Auto-Life infliction, the Mix command that grants the buff, the reel and Overdrive timing code).
* The status infliction (0x78ae00, 0x78b4e0) is another slice; this one takes its result.
* Debug switches in the pipeline (no variance, never crit, always 1 / 9999 / 99999 damage, no statuses) are not modelled.
* The `int[3]` accumulator the caller may pass (decremented by each class's damage) is not modelled.
* Formula 0x16's counter: the anchor map calls it a kill count; the semantics are not independently confirmed.

## 9. How the shipped engine differs today

As read at commit 157562f8 (2026-10-08): `src/battle/ffx/formulas.ts`, `math.ts`, `elements.ts`, `equipment.ts`. The engine
and the kernels were run on the same inputs over broad grids (scripts `div_*.ts` in `D:\Tools\ffx-parity\kernel-check\scripts`);
this is the summary. Delete it when the wiring lands.

**Equal.** The base formulas for STR, MAG, piercing, special magic and healing agree bit for bit with no stacks over 2.3
million comparisons (every STR x DEF pair from 1 to 255, MAG against 86 MDF values, five powers, five variance rolls). So do
the single modifiers Shield, Boost, Protect, Shell, Defend, Sentinel, Power/Magic Break, Berserk on the plain attack,
Magic Booster, Alchemy on formula 6/8 items, one weak/resist/null/absorb element, a Zombie target on a heal, the caps and
Break Damage Limit, and the user's 9999 buff.

**Different** (engine result / game-code result on the example; the engine lines are at 157562f8):

| # | Difference | Engine | Example | How often |
|---:|---|---|---|---|
| 1 | a natural DEF or MDF of 0 is raised to 1 | formulas.ts:117, 122 | Attack STR 4, power 4, DEF 0: 6 / 7; STR 20, power 16, DEF 0: 278 / 280 | every hit on such a target; 28% of sampled physical and 42% of magic stat points |
| 2 | the target's Cheer/Focus reduce formulas 2, 4, 0xf and 7, which have no such term | formulas.ts:134-146, 253 | Cure power 24, MAG 40, target Focus 5: -512 / -768; piercing-magic power 16, MAG 10, Focus 1: 111 / 120 | every hit with at least one stack |
| 3 | multi-element rule: strongest affinity and one x2.25, against weak > neutral bit > resist > null > absorb and 3/2 per bit | elements.ts:25-44, formulas.ts:303-307 | fire+ice, STR 40: [resist, none] 878 / 1757; [weak, absorb] -1757 / 2635; [absorb, resist] -1757 / 878; [absorb, null] -1757 / 0; [weak, weak] 3953 / 3952; a 5-point hit with two weaknesses 11 / 10 | 33 of 50 two-element and 212 of 250 three-element affinity combinations; two weak elements change 21% of Attack hits by 1 |
| 4 | order of the chain: crit first, Boost before Shield, element before Protect/Shell, percent bonuses after the element | formulas.ts:296-355 | on a 7-point hit crit + Shield 3 / 2, Shield + Boost 2 / 1; Shell + weak on 3: 2 / 1; +10% dealt + weak on 9: 14 / 13 | an ordinary mix of hits (10% crits, 10% Protect/Shell, 35% elemental): 3.2% of Attack, 3.7% of black magic, 0.3% of Cure and Demi, 0% of Potion; 98 to 99% of them by exactly 1 |
| 5 | Armored only for physical damage; the game looks at the command's pierce bit | formulas.ts:335-342 | magic power 12, MAG 8, MDF 1 on an Armored target: 60 / 20; with the bit set on the command 60 / 60 | the shipped data sets the bit on 24 of the 25 party spells, so only commands without it (Requiem) |
| 6 | `damage-9999` fires when the TARGET carries it | formulas.ts:372-377 | STR 8, DEF 5 on such a target: 9999 / 41 | every hit on such a target |
| 7 | Berserk multiplies every physical command of the user | formulas.ts:313 | a non-default command: 363 / 242 | only when a Berserk user acts outside the forced attack |
| 8 | Magic Booster for every magical ability; Alchemy for every healing item | formulas.ts:319, 325 | a magical command of type 0: 1242 / 828 | spells outside types 1 and 2; the CTB feathers (formula 0xd) |
| 9 | formulas 0xa, 0xb, 0xc, 0xe, 0x11 to 0x14 and 0x16 do not exist | formulas.ts:208-250 | Karma (two monster commands) | |

Not compared as numbers: the engine's `percent-current` reads the target's HP, the game the running value that falls hit by
hit; the engine has no un-varied base, no Chr+0x6e4 copies and no result word; the Overdrive timing bonus is the same
sum in integers where the game truncates a float product.

## 10. What the engine has to supply to call the kernels

The kernels take plain numbers named after the game's fields. Today's engine does not hold most of them, so the wiring
step (a separate, reviewed batch) has to build them:

* the **hit record**: the target's permanent and extra status words as they were when the action started, the Shell,
  Protect and four Nul counters, refreshed as statuses land;
* the target's **running HP, MP and CTB**, reduced after every hit of the action (the kernel returns the new values),
  which formulas 5, 0xc and 0xd read;
* the **command record bits**: the damage class, the type byte, the element byte, the absorb, Delay Attack/Buster,
  pierce-armor and weapon-properties bits of `Cmd+0x1c`, and the heal, crit, equipment-crit-bonus and 9999/99999 bits of
  `Cmd+0x20`;
* on the user: the id of the command being executed and of the default attack, the Auto-Life flag, the weapon's formula,
  power and element, auto-ability words A and B (Magic Booster, Alchemy, Pierce, Break Damage Limit), the buff flag
  for "every hit deals 9999", and the timing floats;
* the party percent bytes and the target's tick speed (from the CTB table);
* the result of the status infliction as a `StatusOutcome`, and callbacks for the three random inputs
  (`draw`, `hit`, `crit`) so the draws come in the order of §3.
