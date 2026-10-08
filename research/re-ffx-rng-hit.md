# FFX battle RNG, hit check and critical check: what the game code does

**Game case: FFX only.** FFX-2 has its own generator and its own hit function in its own exe; they get their own
notes. Part of the `re-parity` track ([docs/plans/re-parity.md](../docs/plans/re-parity.md)). Drafted 2026-10-08.

**Source note (applies to every statement below unless a line says otherwise):** FFX.exe, Steam build 25501027,
SHA-256 0537B2A1...686D (the HD Remaster's 32-bit executable, image base 0x00400000; every "VA" below is a virtual
address in that image). Read in Ghidra 12.1.4, both the decompiler and the disassembly. Everything is written in
our own words: no game code and no game text is reproduced here.

| This note | Kernel (pure TypeScript, not wired into the engine yet) | Tests |
|---|---|---|
| §1 to §3 generator, streams, New Game seeding | `src/battle/ffx/kernel/rng.ts` | `tests/unit/parity-ffx-rng.test.ts` |
| §4 hit check | `src/battle/ffx/kernel/hit.ts` | `parity-ffx-hit.test.ts`, `parity-ffx-hit-flow.test.ts` |
| §5 critical check | `src/battle/ffx/kernel/crit.ts` | `parity-ffx-crit.test.ts` |
| §6 Escape and battle start | `src/battle/ffx/kernel/rolls.ts` | `parity-ffx-rolls.test.ts` |

## 0. How this was checked

1. Each function's decompile and disassembly were read for operand widths, signed or unsigned compares, and the
   kind of shift (the decompiler hides the difference between an arithmetic and a logical shift).
2. The 68 + 68 generator constants and the nine accuracy-table bytes were compared with the live image's bytes.
3. The real machine code of each function was run in an x86-32 emulator on generated inputs, with only the RNG
   function replaced by a script, and every result compared with the TypeScript kernel:
   - hit check 0x0078a890: 10,606 vectors from the harness lane (all eight formulas, every flag, Darkness, wild
     stat bytes): no differences;
   - generator 0x007988f0: 3,300 vectors, 6,000 draws (single draws and sequences): no differences, and the
     vector file's tables equal the kernel's;
   - this lane's own runs: critical check 0x00789690 (6,000 vectors, 3,266 of them critical), stream index
     0x0078d210 (930), Escape 0x0078a780 (3,000), start type 0x0078d090 (4,000), seed LCG 0x007989a0 (2,000),
     New Game seeding 0x00798890 (200): no differences.

   The vector files live outside the repo (`D:\Tools\ffx-parity\vectors\ffx\` for the harness lane's; this lane's
   own runs, scripts and the temporary comparison tests are in `D:\Tools\ffx-parity\kernel-check-rng-hit\`). The
   tests in the repo carry hand-worked examples (the arithmetic is in the comments) and, for the generator, values
   from an independent Python restatement; each has a skipped block that loads
   `tests/fixtures/parity/ffx/<name>.json` (`rng_next.json`, `hit_check.json`, `crit_check.json`) as soon as the
   harness lane copies a reduced set in.

**Notation.** `Chr+0xNNN` is an offset into the battle character structure (stride 0xF90; the array pointer is
at VA 0x011334d4; ids 0..7 party, 8..0x11 aeons, 0x14..0x1b monsters). `Cmd+0xNN` is an offset into the 0x5c-byte
command record. `Rec+0xNN` is an offset into the 0x2c-byte hit record, a per-target snapshot of the target's
statuses taken when the action starts (offsets +0x07 to +0x13 copy the thirteen turn counters Chr+0x608 to
Chr+0x614, so +0x07 is Sleep; +0x14 copies the permanent status word Chr+0x606, so bit 2 is Petrify). All
arithmetic is 32-bit; stat bytes are read as unsigned bytes. "User" is the attacker, "target" the defender.

## 1. The generator (VA 0x007988f0)

There are 68 independent streams. Stream `s` has a 32-bit multiplier `mult[s]`, a 16-bit xor word `xor16[s]`, and a
32-bit state `state[s]` that lives at VA 0x01135ee0 + 4 s (the tables are at VA 0x00c42208, u32 x 68, and
VA 0x00c42318, u16 x 68). One draw from stream `s`:

1. `v` = the low 32 bits of `mult[s] * state[s]`, then `v` = `v` xor `xor16[s]`;
2. the new state is `(v read as a signed 32-bit number, shifted right by 16 with the sign extended) + (v shifted
   left by 16)`, taken modulo 2^32;
3. the value returned is the new state with bit 31 cleared (`& 0x7fffffff`), a 31-bit number.

The state keeps all 32 bits; only the returned value loses bit 31. The sign-extending right shift is the part a
port gets wrong most easily: when `v` has bit 31 set, the high half of the sum is filled with ones. One stream's
sequence never depends on another's.

`mult` (streams 0 to 67, row by row):

```
2100005341 1700015771  247163863  891644838 1352476256 1563244181 1528068162  511705468
1739927914  398147329 1278224951   20980264 1178761637  802909981 1130639188 1599606659
 952700148 3396196519 3196988222 2281486437 3956199176 3669510832 2245220818 3744577563
4289582524 4166158527 2538937745 1379661854  904938180 3085472738 2618609593 3007056977
1653802906  393811311 3470047556 1837641861  946029195 1248183957 2610891421 2186571037
3613140984 1003979812 1607786269 3709632975 1285195346 1997056081 4188279064 1881479866
 476193932  307456100 1290745818  162507240 4081158231 3158990066 3022661821 1484222417
2735092238 1407627502 1206176750 2757619202  638891383  581678511 1164589165 2858346782
1412081670 2756775946 4009990320  706005400
```

`xor16` (streams 0 to 67):

```
10259 24563 11177 56952 46197 49826 27077  1257 44164 56565
31009 46618 64397 46089 58119 13090 19496 47700 21163 16247
  574 18658 60495 42058 40532 13649  8049 25369  9373 48949
23157 32735 29605 44013 16623 15090 43767 51346 28485 39192
40085 32893 41400  1267 15436 33645 37189 58137 16264 59665
53663 11528 37584 18427 59827 49457 22922 24212 62787 56241
55318  9625 57622  7580 56469 49208 41671 36458
```

Worked example (stream 20 from state 1): `mult[20]` = 3956199176 = 0xEBCECF08 and `xor16[20]` = 574 = 0x023E, so
`v` = 0xEBCECD36, which is -338768586 as a signed number; shifted right by 16 with sign extension that is
-5170 = 0xFFFFEBCE; `v` shifted left by 16 is 0xCD360000; the new state is 0xCD35EBCE = 3442863054 and the value
returned is 0x4D35EBCE = 1295379406.

## 2. Which stream a roll uses (VA 0x0078d210)

The function takes a character id and a purpose ("mode") and returns the stream:

- mode 1 adds 16 to the base and mode 2 adds 32; any other mode adds 0;
- **monsters** (ids 0x14 to 0x1b: the low byte minus 0x14 is below 8) use `id + 8`, i.e. streams 28 to 35
  (44 to 51 for mode 1, 60 to 67 for mode 2); this test comes first;
- otherwise **an aeon** (bit 2 of Chr+0x590, the character's gender-bit byte) uses stream 27, shared by every aeon
  and by party slot 7 (so 27, 43, 59);
- otherwise a **party member** uses `id + 20`, streams 20 to 27 (36 to 43, 52 to 59).

Purposes (the callers of this function, all read here): mode 0 is the damage variance draw, the critical draw, the
initial CTB draw, the Escape roll, and two draws the drops function spends and discards; mode 1 is the
hit-or-evade roll; mode 2 is status infliction, the extra-status roll and the Bribe roll. The stream is always the
**user's** (the attacker's) for hit and critical rolls.

Streams that do not depend on a character, with how each was established:

| Stream | Used for | Established |
|---|---|---|
| 1 | battle start type (§6); also the encounter group choice | start type read here (VA 0x0078d090); group choice from the anchor map |
| 2 | script random: `GetRandomInRange(n)` = `(value & 0xffff) * n >> 16`, `GetRandomValue` = `value & 0xffff`; one stream shared by every script and actor | read here (VA 0x00857400) |
| 9 | hit-reaction and other cosmetic rolls | read here (VA 0x0078f060) |
| 10, 11 | steal success and amount; rare steal; loot | read here (VA 0x0078b760, 0x0078b920, 0x007990d0) |
| 12, 13 | gear and item drops | read here (VA 0x00798c10) |
| 14, 15 | battle-script random op: stream `14 + (argument & 1)`, raw 31-bit value | read here (VA 0x007b89a0) |
| 16 | monster action-list shuffle | read here (VA 0x007b7170) |
| 17 | Yojimbo roll | read here (VA 0x00792120) |
| 0, 3, 5, 6, 18, 19 | encounter step roll; misc; random target; Reflect bounce target; script debug op; an action-resolution helper | **anchor map only, not re-read** (callers 0x00780d10, 0x0079d430, 0x007acd40 whose stream is an argument, 0x007a8ad0, 0x007b1b50) |

## 3. New Game seeding (VA 0x00798890, 0x007989a0, 0x00798950)

The generator is seeded in exactly one place, the New Game function (VA 0x00786b00). (Whether the 68 states are
stored in a save file was **not checked**; see §9.) The recipe:

1. The clock XOR: the XOR of eight bytes of a clock reading, plus 1, so 1 to 256 (VA 0x00798950).
2. `arg` = the sum of two of the game's globals (VA 0x01330210 and 0x011307dc), a 32-bit number.
3. The seed product `k` = `clockXor * (arg + 1)` modulo 2^32.
4. The LCG word starts at `k * 0x420c56d7 + 0x2e0a` (mod 2^32). A second word, `k * 0x599e67e6 + 0x301d`, is
   stored beside it and **nothing ever reads it**.
5. One LCG step is taken and thrown away, then 68 steps fill streams 0 to 67 in order; each state is the step's
   result masked to 31 bits (so every freshly seeded state is below 2^31).

One LCG step (VA 0x007989a0): `t` = `word * 0x5d588b65 + 0x3c35` (mod 2^32); the new word is
`(t as a signed number >> 16, sign-extended) + (t << 16)` (mod 2^32), the same shape as a generator draw; the
step returns the new word masked to 31 bits.

Worked example (k = 1): the word starts at 0x420C84E1; the discarded step gives 0xD3FA456E; the first kept step
gives 0x5A9B5940, so stream 0 starts at 1520130368, and stream 1 at 846530240.

## 4. The hit check (VA 0x0078a890)

Called once per hit, per target, by the per-hit damage pipeline (VA 0x0078e630), right after the Nul-element
check. Arguments: the user's Chr, the target's Chr, the command record, the target's hit record, and the counter
kind (VA 0x0078c1d0: 2 when the target has Evade & Counter and the command is a physical single-target command
aimed at somebody else). It returns **0 hit, 1 miss, 2 no effect**. Steps, in the exe's order:

1. **No effect.** If `Cmd+0x1c` bit 23 (0x800000) is set and the target is neither Dead nor Zombie
   (`Chr+0x606 & 3 == 0`; a Petrified-only target counts as living here), return 2. No draw.
2. **Accuracy formula** `f = (Cmd+0x1c >> 3) & 7` (bits 3 to 5; the other flag bits do not matter). `f = 0`
   returns 0 (hit) with no draw: every spell, item and Overdrive.
3. **Sleeping or Petrified targets are hit without a roll:** `Rec+0x07 != 0` (Sleep counter at the snapshot) or
   `Rec+0x14` bit 2 (Petrify). The live state of the target is not what is read. No draw.
4. Debug switch "never hit" (VA 0x0112a91f) returns 1. No draw. (Off in normal play.)
5. **One draw**, from the user's mode 1 stream; `roll = value mod 101`, 0 to 100. The draw happens whatever the
   chance turns out to be.
6. **The base of the formula**: `f` = 1 or 2: the command's accuracy byte `Cmd+0x29`; `f` = 3 or 4: the user's ACC
   (`Chr+0x5af`); `f` = 5: ACC * 5 / 2 rounded down; `f` = 6: ACC * 3 / 2 rounded down; `f` = 7: ACC / 2 rounded
   down.
7. **The accuracy term.** For `f` in {1, 3, 5, 6, 7} (the table formulas):
   `index = floor(base * 2 / 5) - target EVA + 10`, clamped to 0..8, and the term is `table[index]` with
   `table = {25, 30, 30, 40, 40, 50, 60, 80, 100}` (nine signed bytes at VA 0x00c421f0). For `f` in {2, 4}:
   `term = base - target EVA` (target EVA is `Chr+0x5ae`), with no table and no clamp, so it can be negative or
   above 100.
8. **Darkness.** If `Cmd+0x1c` bit 6 (0x40) is set and the user's Darkness counter (`Chr+0x60a`) is not zero, the
   term is divided by 10 as a C integer division, which **truncates toward zero** (-15 / 10 = -1). There is no
   Luck exception.
9. **The percentage:**
   `percent = term + target jinx stack + user LCK + 10 * (user Aim stack - target Reflex stack) - target LCK + user Luck stack`
   with offsets: user LCK `Chr+0x5ad`, Aim `Chr+0x65f`, Luck stack `Chr+0x662`; target LCK `Chr+0x5ad`, Reflex
   `Chr+0x661`, Jinx `Chr+0x663`. The target's LCK is the **raw byte** (0 subtracts 0). Each stack counts one point
   per stack (the stack bytes are 0 to 5). The sum is not clamped.
10. **Result.** A hit needs `roll < percent` **and** counter kind not equal to 2; otherwise it is a miss. The debug
    switch "always hit" (VA 0x0112a90a) turns any such miss into a hit. So a chance of exactly 100 still misses on a
    roll of 100, and only 101 or more never misses; 0 or less never hits.

Draws: none for `f = 0`, "no effect", Sleep, Petrify, or the debug never-hit switch; otherwise exactly one. Evade &
Counter (counter kind 2) forces the miss **after** the draw.

Worked examples (arithmetic in `parity-ffx-hit.test.ts`): `f` = 3, ACC 60, target EVA 31: `floor(120/5) = 24`,
`24 - 31 + 10 = 3`, `table[3] = 40`; with user LCK 25, target LCK 12, Aim 2, Reflex 1, Luck stack 3, Jinx 4:
`25 + (4 + 40) + (10 - 12 + 3) = 70`. Blind: `40 / 10 = 4`, so `25 + (4 + 4) + 1 = 34`.

What the shipped command tables use (979 records across the item, command and monster-command tables, from the
anchor lane's table dump): accuracy formula 0 for 883, formula 2 for 67 (monster attacks: accuracy bytes from 60
to 254, and three records with 0), formula 3 for 23 (the player Attack family, the Breaks, Mug, Quick Hit, the
Extract and Nab Gil abilities, all flagged for Darkness), formula 5 for 2 and formula 6 for 4 (the six aeon
Attack commands, not flagged for Darkness). **Formulas 1, 4 and 7 appear in no shipped command**, though the
function handles them. 55 of the 67 monster attacks and all 23 formula-3 commands are flagged for Darkness.

## 5. The critical check (VA 0x00789690)

Called by the per-hit pipeline in the HP-damage branch (damage class bit 1, power not zero), after Shield/Boost
and Shell/Protect and before Berserk; the pipeline skips the call when the debug "never crit" switch (VA
0x0112a909) is on. Arguments: user's Chr, target's Chr, command record, a pointer to the hit record's class mask,
and the damage so far. Returns the damage, doubled on a critical hit.

1. If `Cmd+0x20` bit 2 (0x04) is clear the command cannot crit: the damage is returned unchanged. **No draw**, and
   not even the always-critical buff applies.
2. **One draw**, from the user's mode 0 stream (the same stream as the damage variance draw); `roll = value mod 101`.
3. `bonus` = `Chr+0x5d8` (the user's equipment crit bonus) if `Cmd+0x20` bit 3 (0x08) is set, else `Cmd+0x27`.
   For party members `Chr+0x5d8` is the sum of the crit bytes of the two equipped items, weapon and armour (set
   up by the party-stats function, VA 0x0079c5f0).
4. `chance = user Luck stack (Chr+0x662) - target LCK + target Jinx stack (Chr+0x663) + user LCK + bonus`, in
   32-bit signed arithmetic (negative chances are possible). **Luck and Jinx stacks count one point each**, like the
   hit check; the stack bytes are 0 to 5 (the stage-buff function, VA 0x0078d730, clamps them to that range, and the
   only other code found touching them is a reset, VA 0x0079a190; the script property table has no entry for
   them). The target's LCK is the raw byte.
5. It is a critical hit when `roll < chance`, **or** the user's buff byte `Chr+0x640` has bit 4 (0x10) set, **or** the
   debug "always crit" switch (VA 0x0112a90d) is on. A critical hit ORs 0x100 into the hit record's class mask and
   doubles the damage (a plain 32-bit add, so it wraps).

A chance of exactly 100 still fails on a roll of 100; the always-critical buff still draws, the draw just no
longer decides.

Worked example: command bonus 3, user LCK 18, target LCK 10, no stacks: `0 - 10 + 0 + 18 + 3 = 11`; a roll of 10
crits, 11 does not. With Luck stack 5 and Jinx stack 3: `5 - 10 + 3 + 18 + 3 = 19`.

## 6. Escape and how a battle starts

**Single-character Escape** (VA 0x0078a780; command 0x3003 per the anchor map): the draw comes first, from the escaper's mode 0
stream, and is cut to its low byte `b`. Success needs the battle's escape flag (a signed byte at VA 0x0112c9ff)
not equal to 1 (1 means "cannot escape"), the debug never-hit switch off, and either `b < 0xbf` (191 of 256) or
the flag equal to 2 ("always"). So the draw is spent even in a battle that cannot be escaped.

**Battle start type** (VA 0x0078d090, one call site, VA 0x00783020, passing X = 0x20): one draw from stream 1,
`r` = its low byte. If any character in the battle (ids 0 to 0x11, in-battle byte `Chr+0xdc8` set) has the
Initiative flag (bit 2 of byte +0x4a of its record in the player-save array at VA 0x0113205c, stride 0x94), then
`r = r - (X + 1)` as a signed number. The result is **ambush** if `r >= 255 - X`, else **preemptive** if `r < X`,
else **normal**. With X = 32 that is 32 of 256 preemptive and 33 of 256 ambush; with Initiative it is 65 of 256
preemptive and never an ambush. A script override stored at VA 0x0112a923 is applied by the caller, not by this
function.

## 7. Where the rolls sit in one hit (draw order)

Per action the game visits the target slots in ascending order, 0 to 30, and inside each target runs its hits one
after another (VA 0x007892e0, 0x00789740). One hit (VA 0x0078e630) draws in this order:

1. the hit check (user, mode 1), if the command rolls and the target is not asleep or petrified;
2. the HP-class base damage (VA 0x00789bf0), which draws the damage variance (user, mode 0) **first thing, for
   every damage formula**, even one that ignores variance (read here only for the draw order; the damage lane
   owns the formula);
3. the critical check (user, mode 0), if the command can crit;
4. the MP-class and CTB-class base damage, each with its own variance draw (user, mode 0), when those classes are
   set;
5. one status roll per status with a non-zero chance, then the shatter roll (per the anchor map, mode 2).

So on one stream, the variance draw comes **before** the critical draw.

## 8. Differences found against the engine (at main 157562f8, `accuracy.ts` and friends)

Rows 1 to 6 were run on both sides with identical inputs (a temporary test, deleted after use); rows 7 to 12 are
read from the code. "Engine" is `src/battle/ffx/accuracy.ts` unless another file is named; "game" is the kernel.
These are the changes the wiring batch has to make; none has been made.

| # | What | Where in the engine | Example (engine / game) |
|---|---|---|---|
| 1 | Target LCK is floored at 1 in the hit and crit sums and in the Darkness test; the game subtracts the raw byte. Only matters for a target with LCK 0: the game clamps party LCK to at least 1, no enemy in the engine's data has 0 today, and the monsters' real LCK values were not read | `accuracy.ts` 49, 57, 83 | formula 3, ACC 100, EVA 40, user LCK 18, target LCK 0: hit 117 / 118. Crit with the same LCKs and bonus 3: 20 / 21 |
| 2 | A Luck lead of 90 or more cancels Darkness (a wiki claim, single source); the game has no such rule | `accuracy.ts` 46 to 51 | blind user LCK 100 vs target LCK 5, ACC 100, EVA 40: 195 / 105 |
| 3 | Darkness divides with a floor (`floor(floor(0.4 x) / 4)`); the game truncates toward zero. Equal for x >= 0, different when accuracy is below EVA | `accuracy.ts` 50 | blind monster, accuracy 60, EVA 75, target LCK 5: -7 / -6; EVA 95: -9 / -8 |
| 4 | Aeon Attack accuracy formulas 5 (x2.5) and 6 (x1.5) are never applied: the data carries `extra.accuracyMultiplier` but no code reads it | `src/data/ffx/aeons/abilities-core*.ts`; nothing in `src/battle` | formula 5, ACC 100, EVA 60, LCK 10/10: 25 / 100; formula 6, EVA 45: 50 / 100 |
| 5 | **Luck and Jinx stacks add 10 per stack to the crit chance; the game adds 1.** (`ffx-combat-core` §2.9, §2.12, §11 C6 say 10 and call it single-source; the disassembly shows plain adds of the 0..5 stack bytes) | `accuracy.ts` 81, 83 | Luck stack 2: 31 / 13; Jinx stack 2: 31 / 13; Luck 5 and Jinx 5: 111 / 21 |
| 6 | Evade & Counter does not force a miss: it is treated as a Counterattack, so the attack still rolls its normal chance and lands | `ticks.ts` 156; no forced miss in `abilities.ts` | counter kind 2, chance 108: rolls and hits / always misses (after the draw) |
| 7 | A user with `guaranteed-critical` skips the crit draw; the game draws once for every crit-capable command | `abilities.ts` 189 | draws 0 / 1 |
| 8 | Draw order inside a hit: hit, crit, variance; the game does hit, variance, crit, and variance and crit share a stream | `abilities.ts` 178, 190, 193 | order |
| 9 | Loop nesting: hits outside, targets inside; the game goes target slot by target slot, hits inside | `abilities.ts` 143 to 145 | only multi-hit, multi-target actions |
| 10 | Generator: one shared mulberry32 float stream and `rng.int(0, 100)`; the game uses 68 streams and `31-bit mod 101` (rolls 0 to 33 are likelier by one part in 21 million). A decision for Bailey (P3) | `common/rng.ts` | whole replays move |
| 11 | Escape: no draw when the battle cannot be escaped, no "always escape" state; party Flee always succeeds (the game's group flee, VA 0x007ada60, was not read) | `execute.ts` 49 to 60 | draws 0 / 1 |
| 12 | Battle start type is taken from the setup data and never rolled (right for bosses; the game rolls 32/33 in 256 for random encounters) | `turnQueue.ts` 182 | out of scope for the five bosses |

Not a difference: the engine's `canMiss: false` and "enemy action with no accuracy byte" shortcuts, the sleeping
and petrified auto-hit, the 40 percent of ACC (`floor(0.4 acc)` and `floor(2 acc / 5)` agree for every ACC from 0 to
640), the table, Aim/Reflex at 10 per stack, Luck and Jinx at 1 per stack in the **hit** sum, and the hit-roll
direction (`roll < chance`).

## 9. Open questions

1. **Does a save file store the 68 states?** Only the generator and the New Game function touch the state array
   by its own address, but a save routine could copy a larger block that contains it; this was not traced. It
   decides what "the seed" means for a faithful P3 (replays across load).
2. Streams 0, 3, 5, 6, 18 and 19 come from the anchor map and were not re-read (§2).
3. Group Flee (VA 0x007ada60) and the encounter step roll (VA 0x00780d10) were not read.
4. Which aeon uses formula 5 and which 6 follows the research file (Valefor and Shiva x2.5; the others x1.5); the
   command records 0x30cb, 0x30cf, 0x30d2, 0x30d5, 0x30d8, 0x30db hold two formula 5 and four formula 6, but the
   mapping from record to aeon was not read from the player-command table.
5. `Chr+0x5d8` for monsters (probably 0) was not checked.
6. The decision on item 5 of §8 is a game-behaviour change (crit chance from stacks), recorded here because the
   engine's research file claims the opposite; per the plan the exe is the higher authority.
