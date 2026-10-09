# FFX Overdrive, AP, Steal, Pilfer Gil, Bribe, kill rewards and aeons: what the game code does

**Game case: FFX only.** FFX-2 has no Overdrive gauge, no aeons and no Bribe; its Trance, dressphere, Steal and Pilfer Gil code
sits in another exe and has its own notes. Part of the `re-parity` track ([docs/plans/re-parity.md](../docs/plans/re-parity.md)).
Drafted 2026-10-09.

**Source note (applies to every statement below unless a line says otherwise):** FFX.exe Steam build 25501027
(SHA-256 0537B2A1...686D), the HD Remaster's 32-bit executable, image base 0x00400000; every "VA" below is a virtual address in
that image. Read in Ghidra 12.1.4, both the decompiler and the disassembly. The data the code reads at run time comes from the
battle kernel folder of the same install: `ply_rom` (2,161 bytes), `ply_save` (3,098), `sum_assure` (2,420), `weapon` (3,386, the
gear table), `a_ability` (19,590), `command` (40,957). Everything is written in our own words: no game code and no game text is
reproduced here, only formulas, offsets, numbers and addresses.

| This note | Kernel (pure TypeScript, not wired into the engine yet) | Tests |
|---|---|---|
| §1 the Overdrive gauge: add, hooks of the 17 modes, learning counters, costs | `src/battle/ffx/kernel/overdrive.ts`, `overdrive-hooks.ts`, `overdrive-cost.ts` | `tests/unit/parity-ffx-overdrive.test.ts` |
| §2 AP: the curve, the award, the statistic counters, Overdrive to AP | `kernel/ap-award.ts` | `parity-ffx-overdrive.test.ts`, `parity-ffx-steal-rewards.test.ts` |
| §3 Steal, Pilfer Gil, Bribe, kill rewards, gear drop, AP settle | `kernel/steal-rewards.ts`, `drops.ts`, `gear-drop.ts` | `parity-ffx-steal-rewards.test.ts` |
| §4 aeons: stats, gear, the party around a summon, the wipe, recovery, the end-of-battle save, the Magus Sisters' joint-action CTB | `kernel/aeon-stats.ts`, `aeon-party.ts`, `battle-save.ts` | `parity-ffx-aeon-stats.test.ts`, `parity-ffx-aeon-party.test.ts` |
| §5 differences against the engine today | | |
| §6 what the engine has to supply | | |
| §7 open questions | | |
| §8 corrections to other notes, names for the anchor map | | |

## 0. How this was checked

1. Each function's decompile and disassembly were read for operand widths and signedness (the decompiler hides signed against
   unsigned compares and byte against word reads). The reads that mattered: the gauge, the AP total and the recovery counter are
   bytes or clamped 32-bit values; the Stoic, Comrade, Healer and aeon-taking gains divide **unsigned** and add 1 (Warrior and the aeon-dealing gain
   divide signed); the Hero test compares maximum HP
   with 20 times the reference damage as a signed number but with 3 times it as an unsigned one; the Bribe value is an unsigned
   divide of a product that wraps at 32 bits; an aeon's battle count is a 32-bit unsigned number (0x80000000 and above still gives
   the top tier).
2. The real machine code of every function below was run in the `re-parity` harness (Unicorn, x86-32, the exe's own addresses, the
   install's real data tables loaded into the emulated memory) on generated inputs, with only the battle RNG function replaced by a
   script, so every draw can be chosen and logged, and, for the party transitions, a short list of presentation functions replaced by
   recorders (§4.9). Every result was compared with the TypeScript kernel. Two rounds with different seeds for every function; the
   kernels were not changed between the rounds. The aeon family (§4) was added in a third and fourth set: a set with the real gear
   table and counts up to 2^32 - 1, and small worlds for the party transitions.

   | Function | VA | Round 1 | Round 2 | Other sets | Differences |
   |---|---|---:|---:|---:|---:|
   | gauge add with every multiplier and Overdrive to AP | 0x7b1590 | 5,000 | 5,000 | | 0 |
   | learning counter of a mode | 0x7b10c0 | 1,800 | 1,800 | | 0 |
   | HP-change hook (Warrior, Comrade, Stoic, Healer, aeon) | 0x7b0d50 | 5,200 | 5,200 | | 0 |
   | death hook (Avenger, Slayer, Hero) | 0x7b0f80 | 1,500 | 1,500 | | 0 |
   | outcome hook (Tactician, Victim, Dancer, Rook) | 0x7b12c0 | 1,600 | 1,600 | | 0 |
   | turn hook (Ally, Sufferer, Daredevil, Loner) | 0x7b13c0 | 1,500 | 1,500 | | 0 |
   | victory hook (Victor), escape hook (Coward) | 0x7b1540, 0x7b1090 | 700 | 700 | | 0 |
   | after-action change, reference damage, AP curve, statistic counter | 0x7afb60, 0x78d790, 0x784e90, 0x785a00 | 3,800 | 3,800 | | 0 |
   | paying costs, Grand Summon gauge hold (with Tidus's learning inside) | 0x78e5a0, 0x7b06e0 | 2,100 | 2,100 | | 0 |
   | **Overdrive total** | | **23,200** | **23,200** | | **0** |
   | item steal | 0x78b760 | 4,200 | 4,200 | | 0 |
   | Pilfer Gil | 0x78b920 | 3,600 | 3,600 | | 0 |
   | Bribe | 0x78bdd0 | 4,000 | 4,000 | | 0 |
   | kill rewards (six classes: normal, overkill, bribed, Distill, language, everything at once) | 0x7990d0 | 5,200 | 5,200 | | 0 |
   | gear drop | 0x798c10 | 2,600 | 2,600 | | 0 |
   | AP award, reward-list add, end-of-battle AP settle | 0x798a00, 0x798ac0, 0x798b70 | 5,700 | 5,700 | | 0 |
   | **Steal and rewards total** | | **25,300** | **25,300** | | **0** |
   | aeon branch of the party stat builder (real rows, random rows, plausible game states) | 0x7860f0 | 6,200 | 6,200 | | 0 |
   | the same with the real gear table and battle counts from 2^31 - 31 to 2^32 - 1 | 0x7860f0 | | | 1,500 | 0 |
   | joint-action CTB of the Magus Sisters | 0x7b1aa0 | 1,800 | 1,800 | | 0 |
   | party transitions: summon, arrival swap, dismissal, restore, return, wipe, Switch (scenarios of 1 to 5 operations, the whole world compared after each: 40,237 operations in all) | 0x7adf90, 0x7ade10, 0x7adae0, 0x7aef20, 0x7aeec0, 0x7adf10, 0x78e0a0 | 3,000 | 6,000 | 6,000 (small worlds) | 0 |
   | can this aeon be summoned | 0x79a080 | | | 3,000 | 0 |
   | end-of-battle save with the aeon rebuild | 0x785fc0 | 2,000 | 2,000 | | 0 |
   | **Aeon total** | | | | **39,500** | **0** |

   Everything together: **136,500 machine runs, 0 differences.** The draws are checked as well wherever a function draws: the
   kernel must call `draw` as often as the machine did, on the machine's stream, and receive the machine's values. The vector
   files and the scripts that make them are outside the repo (`D:\Tools\ffx-parity\kernel-check-od-steal-aeon\`). The repo holds
   stratified subsets (at most ~280 KB a file) that its tests replay: `od_add.json` 1,233 vectors, `od_events.json` 412,
   `od_hp_change.json` 301, `od_misc.json` 1,007, `steal_item.json` 726, `steal_gil_bribe.json` 778, `drops_small.json` 1,481,
   `drops_rolls.json` 252, `drops_gear.json` 247, `aeon_stats.json` 429, `aeon_summon.json` 316, `aeon_party.json` 220,
   `aeon_settle.json` 86, `aeon_unavailable.json` 598: 7,486 vectors. Each stored answer is the machine's own.
3. **Mutation check of the aeon kernels.** 81 single changes were made to the three aeon kernels, one at a time (a divisor, a
   clamp, a bit mask, a flag, an off-by-one, a swapped field, a removed line), and the two aeon test files run against each. All 81
   are caught. One survivor appeared in the first pass (the final counter reset of a Switch is redundant with the first one unless
   the newcomer was removed for good); a hand-worked test and a machine check closed it. The Overdrive and Steal kernels were not
   mutation-checked in this pass.
4. **Independent oracle.** `parity-ffx-aeon-stats.test.ts` also runs the stat kernel against a second reading of the same rules,
   written in the test with plain arithmetic and none of the kernel's helpers, on 400 generated situations (real and random
   coefficient rows, every tier, bonuses, equipment percents and caps): 0 differences.
5. **Memory audit of the party transitions.** The machine runs of the summon, the arrival swap, the dismissal, the wipe and the
   Switch were repeated with a comparison of **every byte** of the 31 battle character structures and of the battle, save and
   reward globals before and after each operation (500 scenarios). The bytes that change and that the kernel does not model are
   all presentation or queue bookkeeping (§4.9); nothing that decides a turn, a number or a status is missing.

**Notation.** `Chr+0xNNN` is an offset into the battle character structure (stride 0xF90; the array pointer is at VA 0x011334d4;
ids 0..7 party, 8..0x11 aeons, 0x14..0x1b monsters). `Save+0xNN` is an offset into the 0x94-byte party save record (VA 0x0113205c
+ id * 0x94; ids 0..0x11, the aeons being 8..0x11). `Cmd+0xNN` is an offset into the 0x5c-byte command record. A **slot** is a
character id. All arithmetic is 32-bit; stat and counter bytes are read as unsigned bytes. "User" is whoever acts, "target" the
one hit.

## 1. The Overdrive gauge

### 1.1 State and scale

Per character: the mode `Chr+0x5bb`, the gauge `Chr+0x5bc` and the gauge maximum `Chr+0x5bd`, all bytes, copied from `Save+0x38`,
`+0x39` and `+0x3a` at battle start (and written back at the end, §4.8). The party starts the game in mode 2 (Stoic), gauge 0,
maximum **100**, with only the Stoic bit learned. An **aeon** has mode 0x13, gauge 0 and maximum **20**; a monster has mode 0
and maximum 100. So the aeons do not "fill five times as fast on a 100 scale": the game's aeon gauge is 20 points wide and its
gains are small integers of that scale.

Every Overdrive of a party member costs the whole gauge (the cost byte `Chr+0x6cd` is the maximum, §1.8); an aeon's Overdrive costs
its 20. The gauge is a byte: nothing here is a fraction.

### 1.2 The gauge add (VA 0x007b1590)

`OdAdd(slot, amount)` adds to the gauge and returns the amount applied. It does nothing (and returns the input) when the global
switch at VA 0x0112a916 is set, or the character has Curse (extra word bit 0x400), is dead or is Petrified. Otherwise, in order:

1. one multiplier from the auto-ability word `Chr+0x6be`: **x3** with bit 0x2, else **x2** with bit 0x1, else **x2 while the
   weak level is at least 1** (HP below half) with bit 0x4;
2. **x3/2** (truncating) with the buff flag 0x20 of `Chr+0x640`; 3. **x2** with the buff flag 0x40;
4. **zero** with Shield (extra word bit 0x40) - on **any** character; 5. **x2** with Boost (extra word bit 0x80) - on any character;
6. with the Overdrive to AP bit (0x8) of `Chr+0x6be`, the amount becomes AP instead (§2.4) and the applied amount is 0.

The gauge becomes `clamp(gauge + amount, 0, maximum)`; when that raised it to exactly the maximum, the fourth statistic counter of the
save record goes up (§2.3). **Shield and Boost are not aeon-only rules in the code, and Boost doubles; the "x1.5" in the wiki is
the damage side of Boost.** The weak level (VA 0x0078bf00) is 3 at HP 0 or below, 2 below a quarter, 1 below a half (`HP * 4 / max`
truncated, below 2), else 0.

### 1.3 The 17 modes and the aeons' own mode

Six hooks decide who gains what, each called by the code named. Each runs the **learning counter** (§1.4) of the mode it concerns
for the characters it concerns, whether or not the character has that mode, and only then adds the gain for a character that does.
The gain always goes through the add of §1.2.

| # | Mode | Hook (called by) | Trigger | Gain |
|--:|---|---|---|---|
| 0 | Warrior | 0x7b0d50 (every hit record, before the HP changes) | a party member or aeon hits a monster with a command that carries the "charges Overdrive" bit (`Cmd+0x1c` bit 24) | `min(hp * 10 / ref + 1, 16)` |
| 1 | Comrade | 0x7b0d50 | a monster damages a party member or aeon; every **other** party member in the battle (0 to 6) | `hp * 20 / (victim's max HP) + 1` |
| 2 | Stoic | 0x7b0d50 | a monster damages the character itself | `hp * 30 / max HP + 1` |
| 3 | Healer | 0x7b0d50 | a party member or aeon heals another non-monster | `min(heal, missing HP) * 16 / (target's max HP) + 1` |
| 4 | Tactician | 0x7b12c0 (after the HP changed) | a party member or aeon hits a monster and the hit applied at least one harmful status (the record's signed count above 0) | +16 |
| 5 | Victim | 0x7b12c0 | a monster hits a party member or aeon and the hit applied at least one harmful status (its learning counter runs for a dead target too) | +16 |
| 6 | Dancer | 0x7b12c0 | a monster's hit on a party member or aeon missed (record bit 0) | +16 |
| 7 | Avenger | 0x7b0f80 (the death handler) | a monster kills a party member or aeon; every **other** party member in the battle | +30 |
| 8 | Slayer | 0x7b0f80 | a party member or aeon kills a monster | +20 |
| 9 | Hero | 0x7b0f80 | the same, when the monster's max HP is above 3 times the killer's reference damage (unsigned) | +20 |
| 10 | Rook | 0x7b12c0 | Shell or Protect reduced a monster's hit on a party member or aeon (record bit 1) | +10 |
| 11 | Victor | 0x7b1540 (the battle-end state) | the battle is won; every party member in the battle, **dead or not** | +20 |
| 12 | Coward | 0x7b1090 (a successful flee) | the character fled | +10 |
| 13 | Ally | 0x7b13c0 (the scheduler, for each queued turn) | the start of its own turn | +3 |
| 14 | Sufferer | 0x7b13c0 | its turn starts with Zombie, Poison, Confuse, Sleep, Silence, Darkness, Slow or Doom | +16 |
| 15 | Daredevil | 0x7b13c0 | its turn starts with HP below half (weak level 1 or more) | +5 |
| 16 | Loner | 0x7b13c0 | its turn starts and no other slot among 0 to 0x11 is in the battle, takes turns, is alive and is not Petrified | +16 |
| 0x13 | Aeon | 0x7b0d50 | **taking**: a monster hits it (a miss counts, healing does not); **dealing**: it hits a monster with a "charges Overdrive" command | taking `base * 18 / max HP + 1` (`base` is the hit record's base damage before elements and modifiers); dealing `((hp * 16) / ref) / 10 + 1`, no cap |

Details that matter when wiring: the hit's HP change `hp` is the signed amount of one hit record (positive damage, negative healing,
0 a miss); the divisions of the Stoic, Comrade, Healer and aeon-taking gains are unsigned (Warrior's and the aeon-dealing one signed) and the
`+ 1` is added to the quotient, so **a hit of any size gives at least 1**; `ref` is the character's reference damage (§1.5); Hero's learning counter runs when the monster's max HP is above 20
times the reference or at least 10,000, a looser test than its gain test; Stoic's and Comrade's counters run on every damaging
monster hit, Healer's on every heal of someone else; the Warrior counter runs only when the command carries the Overdrive bit.
The modes the shipped builds use are Stoic (17 times), Warrior (8), Healer (4), Comrade (3) and Victor (2); the aeons use the Aeon
row. Avenger, Slayer, Hero, Coward, Tactician, Victim, Dancer, Rook, Ally, Sufferer, Daredevil and Loner are not in any shipped
build, which keeps their differences against the engine (§5) inert in the chapters.

### 1.4 The learning counters (VA 0x007b10c0)

A mode is learned by seeing its event in enough battles: the first time the event happens in a battle (the slot's per-battle bit
`Chr+0x6f0` for the mode is clear), the bit is set and the character's counter for the mode (`Save+0x60`, one u16 per mode, the
number of battles still needed) goes down by one, never below 0; reaching 0 when the mode is not yet learned raises the "learned"
flag. A counter of 0xffff never counts. Nothing happens in demo mode (VA 0x0112c9e5 not 0), for ids above 6, for modes above 16, or
for a dead or Petrified character (the Victim and Dancer and Rook counters run for dead characters too). The starting counters of
the new game (`ply_save` records 0 to 6):

| | Warrior | Comrade | Stoic | Healer | Tactician | Victim | Dancer | Avenger | Slayer | Hero | Rook | Victor | Coward | Ally | Sufferer | Daredevil | Loner |
|---|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|
| Tidus | 150 | 300 | 0 | 80 | 75 | 100 | 250 | 100 | 100 | 50 | 120 | 120 | 600 | 600 | 120 | 170 | 60 |
| Yuna | 200 | 240 | 0 | 60 | 100 | 80 | 200 | 80 | 110 | 50 | 110 | 150 | 900 | 500 | 100 | 90 | 180 |
| Auron | 100 | 220 | 0 | 200 | 110 | 120 | 200 | 120 | 80 | 40 | 120 | 200 | 1000 | 450 | 160 | 260 | 35 |
| Kimahri | 120 | 100 | 0 | 100 | 60 | 130 | 130 | 100 | 120 | 45 | 120 | 120 | 700 | 300 | 100 | 200 | 90 |
| Wakka | 160 | 100 | 0 | 110 | 80 | 100 | 200 | 100 | 90 | 50 | 120 | 160 | 400 | 350 | 110 | 140 | 110 |
| Lulu | 300 | 100 | 0 | 170 | 75 | 110 | 300 | 150 | 130 | 70 | 120 | 200 | 980 | 480 | 130 | 150 | 45 |
| Rikku | 140 | 100 | 0 | 70 | 90 | 90 | 200 | 90 | 100 | 50 | 120 | 140 | 450 | 320 | 125 | 110 | 170 |

All seven start in Stoic (mode 2) with learned bits `0x4`. Which learned mode a character uses is chosen in the menu (not read here); the engine's builds name one
mode per member and have no learning at all (§5, O7).

### 1.5 The reference damage (VA 0x0078d790)

`Chr+0x6f4`: the larger of the base damage of formula 0xe (Strength, cubic, no defence) and of formula 0x14 (Magic, cubic) at power
16 against the character itself, with no variance. It is set at battle start and whenever a script changes Strength or Magic. The
engine's `estimatedDamage` gives exactly the same number for every Strength and Magic from 1 to 255 in steps of 3 (7,225 pairs, 0
differences), so the Warrior ratio is the same; only the rounding around it differs (§5, O1).

### 1.6 The scripted after-action change (VA 0x007afb60)

When a battle script has armed it (`Chr+0x714`), after an action the gauge moves by the signed byte `Chr+0x728 + (flag & 1)` and the
energy byte `Chr+0x6e1` by `Chr+0x726 + (flag & 1)`, each clamped (gauge to 0..max, energy to 0..100); the flag byte is set by the
hit code when the action did something (VA 0x0078bf50). None of the shipped fights read so far arms it for the party.

### 1.7 Death

Only an **aeon** loses its gauge when it dies (the death handler, VA 0x0078c740, writes 0 to `Chr+0x5bc` for aeon slots); a party
member keeps the gauge through a KO. The same handler counts the kill (statistic counter 1) and the death (counter 2), rolls the
monster's drops (§3.4) and calls the Avenger, Slayer and Hero hook.

### 1.8 Paying for an Overdrive, Grand Summon, Tidus's learning, Entrust

`PayCosts` (VA 0x0078e5a0), at the end of an action: MP goes down by `Chr+0x6cc` (clamped to 0..9999), the gauge by `Chr+0x6cd`
(clamped to 0..max). When an Overdrive cost was paid, the gauge saved for a Grand Summon is put back (VA 0x007b06b0) and Tidus's
Overdrive learning runs; both cost bytes are cleared. **Grand Summon** (command 0x3118, the action that contains it) first saves
the user's gauge and holds it at its maximum (VA 0x007b06e0), so the 100-point cost can be paid whatever the gauge was and Yuna's own
gauge comes back as it was. **Tidus's four Overdrives** are learned by use count: Spiral Cut (0x3060) at 0 uses, Slice & Dice
(0x3061) at 10, Energy Rain (0x3062) at 30, Blitz Ace (0x3063) at 80 (table at VA 0x00c43948, learned bits 0 to 3 of the word at VA
0x011307fc; the counter is at VA 0x0113083c and goes up for each Overdrive he pays for). **Entrust** (the transfer flag, bit 25 of
`Cmd+0x1c`, in `pp_BtlApplyHitRecords`): the user's whole gauge is added to the target's, clamped to the target's maximum, and the
user's becomes 0, unless the target is Petrified.

## 2. AP

### 2.1 The curve (VA 0x00784e90)

`ply_rom` carries four numbers per party member: bytes `+0x11` (a), `+0x12` (b), `+0x13` (c) and a u32 at `+0x14` (the cap). For
**all seven party members and slot 7 the row is a = 2, b = 0, c = 5, cap = 22,000**. With `n` the sum of the two level bytes
`Save+0x3b` and `Save+0x3c`, the value of the next step is `c * (n + 1) + a * n^3 / 100 + b * n^2 / 10` (each division truncating)
for `n` up to 100, and the cap above 100. That is `5 * (n + 1) + n^3 / 50`. The engine's `apForLevel` is the same expression with
`min(..., 22000)`; they differ only at `n` = 101 (21,116 engine, 22,000 game) and 102 (21,739 / 22,000), levels the game does not
offer.

### 2.2 The award (VA 0x00798a00)

`AwardAp(slot, ap, other)` adds AP to the character's running total for this battle (`0x02310f20 + 4 * slot`, clamped to
0..999,999,999) and returns the gil multiplier chain: nothing happens (`other` is returned) when `Chr+0xdcd` is set. The AP is 0
with the No AP ability (bit 0x40 of `Chr+0x6be`). Only a character that is in the battle and not dead gets Triple AP (bit 0x20, x3,
checked first) or Double AP (bit 0x10, x2) applied, and only such a character can turn the returned multiplier into 2 (Gillionaire,
bit 0x4000); a reserve or dead character receives the plain AP.

### 2.3 The statistic counters (VA 0x00785a00)

Four u32 counters per party member (`Save+0x50`, `+0x54`, `+0x58`, `+0x5c`): battles fought (0), kills (1), deaths (2), Overdrive
gauges filled (3). A bump adds 1 and clamps to 0..999,999,999 as a **signed** number, so a counter at 0x7fffffff or more stops
counting; nothing is counted in demo mode 2. These are the numbers of the status menu. **They are not the battle count of the
aeon formula**, which is a separate global (§4.1).

### 2.4 Overdrive to AP

With the Overdrive to AP bit, `OdAdd` never raises the gauge: it computes `q = curve * amount / maximum` (signed, truncating; a
maximum of 0 faults), converts it to a float, multiplies by the character's AP factor `Chr+0x70c` (1.0 at battle start), truncates it
to AP, awards it (§2.2) and multiplies the AP factor by 0.9, so every use pays 10 percent less.

## 3. Steal, Pilfer Gil, Bribe and the kill rewards

### 3.1 Item steal (VA 0x0078b760)

Inputs: the monster's loot record (0x118 bytes, `Chr+0xf88`): `+0x0a` the steal chance (0 to 255), `+0x24` and `+0x26` the common and
the rare item ids (an item has the high nibble 2), `+0x28` and `+0x29` their quantities; the thief's auto-ability word; the number
of the action's hits that missed this target; the target's count of earlier steals (`Chr+0xdeb`). The item is stealable only when
the chance and the common quantity are not 0, the common id is an item and the battle is not in demo mode 2. The success roll is
`draw(stream 10) % 255 < chance` (a debug switch can force it) and **a miss cancels the steal after the roll has been drawn**. On
success the chance becomes `chance * 50 / 100` (never below 1), the rarity roll `draw(stream 11) & 0xff` below **0x20** (12.5
percent; **0x80** with bit 7 of the auto-ability word, Pickpocket; always with bit 8, Master Thief) takes the rare item when its
quantity is not 0 and its id is an item, else the common one, the target's steal count goes up (stopping at 255), Rikku's counter
goes up (achievement at 200) and the item goes straight into the party inventory. A failed roll changes nothing, so a failed steal
retries at unchanged odds. (In the build language 11 a Rename Card becomes two Gambler's Spirits; no other language changes
anything.) **The chance never reaches 0**: from 255 it runs 255, 127, 63, 31, 15, 7, 3, 1, 1, 1 ... (100, 49.8, 24.7, 12.2, 5.9,
2.7, 1.2, 0.4, 0.4 percent).

### 3.2 Pilfer Gil (VA 0x0078b920)

The chance lives on the **target character** (`Chr+0x712`, a signed 16-bit value, 255 at battle start for every character) and halves
after every success the same way. `gilFactor` is the loot record's byte `+0x113` (0 = nothing to pilfer; the call then reports -1).
The roll is `draw(10) % 255 < chance` (a miss cancels it), then a second draw from stream 10 gives the amount
`floor(floor((draw % 101 + 100) * factor * 100 / 200) * chance / 255)` and the new chance is `max(1, chance * 50 / 100)`. The gil goes
to the party when the hit is applied. Nab Gil is Pilfer Gil with an attack in front of it.

### 3.3 Bribe (VA 0x0078bdd0)

Only a command whose misc word has bit 31 does anything. The value is `(paid + offered) * 256 / maxHP / 20 - 64` (an **unsigned**
divide of a product that wraps at 32 bits), where `paid` is the gil already given to this monster (`Chr+0x704`, **kept across
attempts**); the roll is the low byte of one draw from the target's mode-2 stream (§3.7); it works when `roll < value` (signed)
and gil was offered, unless the target has the Bribe-immune bit (`Chr+0x5b8` bit 0x400) or is asleep, in which case the immune
counter goes up instead. Success sets the death marker `Chr+0x701` to 2 (the monster leaves bribed), stores the value in `Chr+0x708`
and sets the Eject bit of the record's extra word. The gil offered is added to `paid` (clamped to 999,999,999) in every case. Read
in gil: the chance is 0 below 5 times the monster's max HP and 100 percent from 25 times it; the engine's data comment has the same
formula but forgets that the gil already paid counts (language 11 has a special case for monster 0x10ef).

### 3.4 Kill rewards (VA 0x007990d0)

Called by the death handler for a death that has a loot record (a party slot's record is never filled, so only a monster's death gives
anything). In order:

1. **AP**: the monster's AP, or its overkill AP (`+2`, `+4` of the loot record), is awarded to **each of the slots 0 to 0x11** through
   the award of §2.2, and the gil multiplier chain starts at 1 (2 once a living in-battle member has Gillionaire).
2. A **bribed** monster (marker 2) gives no gil; it leaves `clamp(trunc(bit + sqrt(value) * factor / 16 * r / 25), 1, 99)` of its
   bribe item (`+0x2a`, factor `+0x2c`), with `r = draw % 11 + 20` and `bit` the low bit of the next draw, both from the **killer's**
   mode-0 stream.
3. Any other monster: gil `= clamp(multiplier * gil + gil so far, 0, 999,999,999)` (no overkill effect); then for each of **two item
   slots** a stream-10 roll `% 255` below the slot's chance byte (`+8`, `+9`) gives an item: a stream-11 low byte below 0x20 picks
   the slot's rare entry, else its common one; an **overkill** reads a separate list (`+0x18` items and quantities) instead of the
   normal one (`+0xc`); a **Distill** bit on the monster (power, mana, speed, ability, in that priority) replaces the item with the
   matching sphere and keeps the quantity. The reward list holds eight stacks of up to 99.
4. Then one more stream-10 roll `% 255` against the gear chance `+0x0b` (§3.5).

### 3.5 The gear drop (VA 0x00798c10)

Six or more draws in this order: stream 12 (the owner), stream 12 (weapon or armor, the low bit), stream 12 twice (the slot count and
the extra-ability count, from the low three bits), then one stream-13 draw for each ability it tries to add. Owner: with `n` the number
of members who have joined plus 3 when the killer is a party member, the owner is the first joined member whose running count exceeds
`draw % n`, else the killer. Slots `= clamp(trunc((slotBase + (a & 7) - 4) / 4), 1, 4)`, tries `= trunc((abilityBase + (b & 7) - 4) / 8)`;
the gear starts with its row's first ability, each try picks one of the other seven by `draw % 7`, skipping an empty one or one whose
ability group is already on the gear, and stops once the slots are full. The name and model of the finished gear are cosmetic.

### 3.6 The AP settle (VA 0x00798b70)

When a battle ends, every slot 0 to 0x11 that never took a command other than Switch, is dead or is Petrified loses the AP it earned
(the value goes back to the one stored at the start); every slot that was in the battle has its battles-fought counter bumped.

### 3.7 Every random draw, in one table

| Event | Draws, in order | Stream |
|---|---|---|
| item steal | success roll; if it succeeds, the rarity roll | 10; 11 |
| Pilfer Gil | success roll; if it succeeds, the amount | 10; 10 |
| Bribe | one draw | the target's mode-2 stream (`pp_BtlRngStreamIndex(target, 2)`) |
| kill of a bribed monster | the quantity factor, then the extra-point bit | the killer's mode-0 stream |
| kill of any other monster | per item slot a chance roll (and a rarity roll after a success); then the gear roll | 10 (11 after a success); 10 |
| gear drop | owner, type, slot count, ability count, then one per try | 12, 12, 12, 12, 13 ... |

## 4. Aeons

### 4.1 Where an aeon's numbers live, and when they are rebuilt

An aeon is a party-save slot (8 Valefor, 9 Ifrit, 10 Ixion, 11 Shiva, 12 Bahamut, 13 Anima, 14 Yojimbo, 15 Cindy, 16 Sandy,
17 Mindy). Its maximum HP and MP are `Save+0x24` and `+0x28`, its eight stats the bytes `Save+0x2f` to `+0x36`, its two gear ids
`Save+0x2d` and `+0x2e`. They are **rebuilt**, not kept: at the end of every battle, for the ten aeons (the end-of-battle save,
§4.8), and outside a battle whenever the menu changes anything that can matter (a wrapper rebuilds all 18 slots, VA 0x00786900,
called from the menu code; an equipment change inside a battle, VA 0x007ad820, rebuilds the one member). At battle start the
numbers are copied into the battle character (§4.6). So the stats an aeon has **in** battle `k` were built at the end of battle
`k - 1` from Yuna's stats at that moment and the battle count then.

**The battle count** is a global dword at VA 0x011307a4. It goes up by one at the **start** of every battle (the battle manager,
VA 0x00783020, state 7 or 10, right after the start type is rolled) while it is below 0x0fffffff and demo mode is off; every
battle counts: boss fights, fights fled from, fights before Yuna joined. (A second increment sits in the random-encounter code,
VA 0x00780d10, in one variant of the encounter fade; it was read, not traced, §7.) The research's "encounters count" is this number.

### 4.2 Yuna's raw stats (VA 0x00785b60)

For a party member below 8: HP is the save record's HP (`Save+4`) plus 50 per unit of the stat-bonus record's HP, MP is `Save+8`
plus 5 per unit, and each of the eight stats (STR, DEF, MAG, MDEF, AGI, LUCK, EVA, ACC) is the sum of the save byte (`Save+0xc` to
`+0x13`) and the bonus byte (**two bytes added, not wrapped to a byte**, 0 to 510). The bonus record (base VA 0x01135e00, 0x1c bytes
a member) is what the Sphere Grid fills.

### 4.3 The formulas (the aeon branch of VA 0x007860f0)

1. Yuna's HP and MP are clamped to 0..9999 and 0..999, her STR, DEF, MAG, MDEF, AGI, LUCK and ACC to 1..255 and her EVA to 0..255.
2. `S = HP / 100 + MP / 10 + ACC + EVA + AGI + MDEF + MAG + DEF + STR` of those clamped values (Luck is not in it; both divisions
   truncate).
3. The aeon's `ply_rom` record gives 18 bytes from `+0x18`: `hpPerSum`, `hpPerHp`, `mpPerSum`, `mpPerMp`, then a (divisor, multiplier)
   pair for STR, DEF, MAG, MDEF, AGI, EVA and ACC. `HP = hpPerHp * YunaHP / 100 + hpPerSum * S`;
   `MP = mpPerMp * YunaMP / 100 + mpPerSum * S / 10`; each stat `= S / divisor + multiplier * YunaStat / 10`. Every division
   truncates after its own product. Luck is not computed here.
4. **The minimum by battle count** (§4.4): from the second tier on, each of HP, MP, STR, DEF, MAG, MDEF, ACC, EVA and AGI is at least
   the `sum_assure` value for the aeon and its tier.
5. The aeon's own bonuses (`Save+4`, `+8`, `+0xc` to `+0x13`, the Aeon's Soul spheres) are added; Luck is **Yuna's Luck plus the aeon's
   Luck byte**.
6. The **equipment percents** (§4.5) are applied: for each of 14 entries (STR, DEF, MAG, MDEF, AGI, LUCK, EVA, ACC, HP, MP and four
   damage modifiers) `x + x * pct / 100` with the summed percent of every ability whose mask names it.
7. Caps: HP 9,999 (99,999 with Break HP Limit), MP 999 (9,999 with Break MP Limit), each stat 1..255 (EVA 0..255); the aeon's current HP
   and MP are clamped to the new maxima. The four damage-modifier percents go to VA 0x02311240 + 4 * slot.

This is the research's `aeon = max(x, y) + z` model, with `x` the minimum and `y` the from-Yuna value, to the unit: the engine's
coefficient table (`AEON_STAT_COEFFICIENTS`) equals the game's bytes in all 90 pairs (10 aeons x 9 stats), and `AEON_CANONICAL_STATS`
equals the kernel's output for the research's three declared Yuna profiles and battle counts in all 300 numbers (§5, A1).

### 4.4 The battle-count minimum (`sum_assure`)

200 records, ten per tier for 20 tiers; the record for an aeon in a tier is `slot + (5 * tier - 9) * 2`. The tier is `floor(count / 30)`
(unsigned), at most 20; tier 0 (under 30 battles) has no minimum. Each record is HP and MP (u16) and seven stat bytes (STR, DEF, MAG,
MDEF, ACC, EVA, AGI). The first and the last tier, which are the research's floor table:

| Aeon | Tier 1 (30 to 59 battles): HP MP STR DEF MAG MDEF ACC EVA AGI | Tier 20 (600 and more): the same |
|---|---|---|
| Valefor | 725 24 18 23 21 23 11 19 10 | 2,225 71 45 66 64 69 20 42 34 |
| Ifrit | 857 23 19 29 21 21 11 10 9 | 3,067 68 46 84 62 62 20 22 30 |
| Ixion | 891 25 20 26 20 29 12 11 8 | 3,021 74 47 74 61 87 21 24 26 |
| Shiva | 820 26 19 17 23 24 11 32 14 | 2,680 80 42 48 70 71 20 66 52 |
| Bahamut | 1,210 35 23 27 18 28 11 20 10 | 4,340 103 50 79 55 84 20 44 34 |
| Anima | 1,410 45 33 26 22 23 11 20 9 | 5,090 130 65 74 66 69 20 44 30 |
| Yojimbo | 1,030 0 29 25 16 23 19 59 9 | 3,064 0 61 73 48 69 38 122 30 |
| Cindy | 2,190 46 28 32 21 28 11 20 10 | 8,410 142 60 94 64 84 20 44 34 |
| Sandy | 1,790 35 42 26 24 28 13 17 10 | 6,910 103 69 76 73 84 22 38 34 |
| Mindy | 1,237 58 23 24 28 28 12 23 12 | 4,887 178 50 70 85 84 21 50 42 |

### 4.5 Equipment: percents, words and caps

Each aeon wears two pieces of gear (a weapon and an armor, ids `Save+0x2d`, `+0x2e`, rows of the 153-entry `weapon` table, 0x16 bytes
each), each with four ability slots naming an `a_ability` record. The record gives a percent (`+0x55`), a mask over the 14 entries
(`+0x56`, u16) and three flag words (`+0x62`, `+0x64`, `+0x66`) that are OR-ed into the save record (`Save+0x4a`, `+0x4c`, `+0x4e`).
Word 2 bit 9 (0x200) is Break HP Limit and bit 10 (0x400) Break MP Limit. The starting gear of the ten aeons (gear ids in
brackets) carries no percent at all, only words:

| Aeon | Weapon | Armor |
|---|---|---|
| Valefor (0x0c, 0x0d) | one ability: the Aeon Ribbon record (0x807b) | slots 1, 3, 4: a word-A bit, Break HP Limit, Break MP Limit |
| Ifrit (0x0e, 0x0f), Ixion (0x10, 0x11), Shiva (0x12, 0x13), Yojimbo (0x18, 0x19) | Pierce (0x800b) and the Ribbon | the same, with Fire, Thunder and Ice absorb (Ifrit, Ixion, Shiva) in slot 2; Yojimbo none |
| Bahamut (0x14, 0x15), Anima (0x16, 0x17), Cindy (0x1c, 0x1d), Sandy (0x1e, 0x1f), Mindy (0x20, 0x21) | Pierce, the Ribbon and **Break Damage Limit** (0x8019, word 2 bit 11) | slots 1, 2, 3: a word-A bit, Break HP Limit, Break MP Limit |

### 4.6 What an aeon's battle character gets from its gear (VA 0x0079c5f0, run for each aeon)

`pp_BtlInitChr` treats every id that is not a monster alike, so an aeon's battle character is built by the same party-stats function
as a party member's: the save numbers are copied, the stat bonus bytes `Chr+0x5b0` to `+0x5b7` (zero unless something sets them) are
added, and the effect of **each piece of gear** is summed. Read by running the function for each aeon with its starting gear:

* the **equipment crit bonus** `Chr+0x5d8` is **6** for every aeon (3 from the weapon row, 3 from the armor row). The aeon Attack and
  Special commands carry the "crit bonus from equipment" bit, so an aeon's critical chance is `Luck - target Luck + 6`;
* the element absorb mask `Chr+0x5da`: 1 for Ifrit, 4 for Ixion, 2 for Shiva, 0 for the others;
* auto-ability word A `Chr+0x6bc`: 0x2001 for every aeon but Valefor (0x1): Pierce on nine aeons, **not on Valefor**;
* auto-ability word B `Chr+0x6be`: 0x600 (Break HP and MP Limit) for all, 0xe00 (**plus Break Damage Limit**) for Bahamut, Anima,
  Cindy, Sandy and Mindy: every hit of those five can exceed 9,999, not only Mega Flare and Oblivion;
* the **Aeon Ribbon** record: resistance 255 (immune) to Death, Zombie, Petrify, Poison, the four Breaks, Confuse, Berserk, Provoke,
  Sleep, Silence, Darkness and Slow, and the extra-immunity word `Chr+0x65a` = 0x793f: Scan, the four Distill statuses, Eject, Defend,
  Guard, Sentinel and Doom. Threaten's byte is 0, and for Threaten the byte is a success percentage (the status kernel's rule,
  `research/re-ffx-ctb-status.md` §6), so **Threaten never lands on an aeon either**. Shell, Protect, Reflect, Regen, Haste, the Nuls,
  Shield, Boost, Auto-Life and Curse are not covered;
* the weapon formula and power (`Chr+0x5c1`, `+0x5c7`) are Strength 16 as for a party member.

### 4.7 Summon, arrival, dismissal, wipe

The commands: Summon (0x3117 one aeon, 0x3118 Grand Summon) and the Magus Sisters (0x30ff) call the **summon** (VA 0x007adf90); the
Dismiss commands (0x3056, 0x3057) queue a dismissal action; Switch (0x3002) calls the **swap** (VA 0x007adae0) directly. In words:

* **A character takes turns, ticks its counters and counts as being in the fight only while its in-battle byte `Chr+0xdc8` is set**
  (the scheduler's ready test and tick test both read it, `research/re-ffx-ctb-status.md` §4). Everything below is about that byte and
  about two parked copies of the party lists.
* **Summon.** The in-battle bytes of slots 0 to 0x11 are copied to a second byte (`Chr+0xdc9`) and the party order table is copied; the
  active list (7 ids at VA 0x0112c895, 0xff = empty) is copied to a parked list (VA 0x0112c89c). Every member of the list except the
  summoner **leaves** (in-battle byte 0, "has left" byte `Chr+0xdf8` = 1, whoever it provoked is released, a Threaten link of its own is
  broken at both ends). The summoner then leaves and the aeon arrives in its list position: the summoner is marked away (`Chr+0xdcb`,
  `+0x1a`), the aeon records its summoner (`Chr+0x6d1`) and the global "aeon" and "summoner" bytes are set; the aeon's counter is
  set to 0; a Grand Summon saves the aeon's gauge and fills it. The Magus Sisters instead take list positions 0 to 2 together, whichever
  one was asked for, and each records the summoner. The function ends by queueing the **arrival action** for the aeon, and that queueing
  swaps the lists and the in-battle bytes once. After that swap **the party's in-battle bytes are back to 1 and the aeon's is 0**: the
  party is still in the fight for the scheduler.
* **Arrival.** When the arrival action starts (the per-character command state machine, VA 0x00788480, special-action kind 1) the same
  swap runs again: now the aeon (all three sisters) is in the battle and the party is not, the active list is the aeon's, and the party's
  list and order table are parked. The aeon's counter was already set to 0 inside the summon (it acts next); the party's counters, HP
  and statuses are not touched: they stay exactly as they were. The summoner keeps the recovery it was charged for the Summon action
  (the swap never writes a leaver's counter).
* **The "summon CTB"** (VA 0x007b1aa0) is a different thing from what its name says. Its only caller is the same state machine, for a
  special-action kind 8, and the only action that carries kind 8 is the one command 0x3129 queues (VA 0x007ae2e0): Cindy performing
  Delta Attack (0x30ea) for all three Magus Sisters. At that action's start the acting sister's counter becomes 0 and every **other**
  member of the active list (the two other sisters) takes over the action's target mask, the two action flag bytes and the MP and
  Overdrive cost bytes, and gets the recovery of the action's rank as its counter (its own Agility, Haste and Slow). A single summoned
  aeon never goes through it. (Read from the call graph and the state machine; command 0x3129 was identified from its handler, not from
  a name.)
* **Dismissal.** The Dismiss command queues the action (kind 3), and when it ends the game calls **dismiss with the revive** (VA
  0x007aef20): each member of the active list gets its held gauge back, is **revived to 1 HP** if its HP is below 1 (a Magus Sister who fell
  while another stood), and leaves; then the parked lists are put back (VA 0x007aeec0), every member of the restored list comes back
  into the battle (VA 0x007adf10: the summoner as a returning summoner, no longer away; the others as new arrivals, counted for the
  rewards again and flagged for the arrival animation), and the aeon and summoner bytes are cleared. **Nobody's counter changes on the way
  back** (only a revive sets it to the stored base).
* **The wipe.** When the battle-end status function (VA 0x007928d0) reports that nobody on the active list is left standing while an
  aeon is out, the battle does **not** end: the wipe (VA 0x0078e0a0) sets every member of the active list to 0 HP and its recovery counter
  `Chr+0x6d8` to `ply_rom +0x2b` plus 1, and the aeon is dismissed **without** the revive (kind 2). The party returns; it is not a Game
  Over. Only an aeon's death clears its gauge (§1.7).
* **Availability** (VA 0x0079a080, the summon menu): an aeon can be summoned when its HP is above 0, its "can be summoned" byte
  `Chr+0xdd4` is set, it was not removed for good and its recovery counter is 0.

### 4.8 Recovery counters and the end-of-battle save (VA 0x00785fc0)

The recovery value of each aeon is `ply_rom +0x2b`: Valefor **8**, Ifrit **12**, Ixion **20**, Shiva **20**, Bahamut **24**, Anima
**24**, Yojimbo **24**, Cindy, Sandy and Mindy **30**. The end-of-battle save, in order: the parked party lists are restored; the first
three entries of the active list and the 17-entry order table are remembered for the next battle (VA 0x011307e8, 0x011307eb); then for
slots 0 to 0x11 the gear ids, HP, MP, recovery counter and Overdrive mode, gauge and maximum go into the save record: a character at 0
HP or below **with no recovery counter is saved at 1 HP**; one with a counter keeps its HP, the counter goes down by one, and the battle
that brings it to 0 saves the character at the **old** maximum HP and MP (full); HP and MP are clamped to the record's maxima; finally the
ten aeons are rebuilt (§4.3), which lowers or raises the maxima and clamps the HP and MP that were just written. So an aeon wiped in
battle `k` is unavailable in battles `k + 1` to `k + recovery` (8 battles for Valefor) and is available at full HP and MP from the battle
after that. An aeon's HP and MP otherwise persist between battles (no refill), as the research says.

### 4.9 How the party transitions were run, and the memory audit

The summon, swap, dismissal and wipe functions queue animations and start script events for the characters that come and go. The
vectors replace those functions (the Atel event starters, the model, pose and animation helpers, the "monsters present" refresh, the
animation-record queue) by recorders that return 0, and run with the action queue empty, so the queued arrival action is never
executed: the vector's `arrive` operation calls the arrival's lists swap itself, and `drain` stands for "the queued actions finish".
What those replaced functions write, found by comparing **every byte** of the 31 character structures and of the battle, save and
reward globals before and after each operation:

* character bytes the kernel models: the in-battle byte and its parked copy, "has left", "summoner away" and its presentation twin, the
  summoner id, the arrival flag, "removed for good", dead, HP, the counter and the stored base, the permanent status word (Provoke and
  Threaten bits), the provoker and the two Threaten link bytes, the gauge, its maximum, the held gauge and its flag, Petrified, the
  recovery counter and its value, "can be summoned";
* character bytes it does not model: the formation position (`Chr+0x4fc` to `+0x4fe`, `+0x509` to `+0x50b`, `+0x511`: the newcomer takes
  the leaver's position), the direction-change and appear-motion flags (`+0x41c`, `+0x43d`), and the action-queue bookkeeping
  (`+0xde6`, `+0xde7`, `+0x716`); the leaver's **queued actions are completed without being executed** when it leaves (VA 0x007b20b0 runs the
  action-done step, VA 0x007b20e0, for every queued action of the leaver except the one it is performing: each is taken off the queue and
  charged its recovery and costs; read, not run, because the vectors' queue is empty);
* globals not modelled: the queue itself (VA 0x0112aa80 and 0x0112ac70 on), the queue counters (0x0112bde0, 0x0112bde1) and a "party
  changed" flag (0x0112c9f5).

None of those decides a number, a status or a turn in a boss fight, but a wiring must remember that **the queued actions of a
character that leaves a fight are completed without being executed** (recovery and costs charged).

## 5. Differences against the engine today (worktree `re-parity` at 029d49c7)

Where a row has numbers, the engine and the kernel (or the data) were run on the same input in a scratch driver kept outside the repo
(`D:\Tools\ffx-parity\kernel-check-od-steal-aeon\_eng.mjs`, `_eng2.mjs`, `cmp_aeon_engine.mjs`); the other rows are read from the
code and marked "read". "Engine" is `src/battle/ffx/overdrive.ts`, `steal.ts`, `results.ts`, `aeons.ts`, `setup.ts` and
`src/data/ffx/aeons/index.ts` unless another file is named. The frequencies are from playing the engine's nine FFX chapters with
the golden line (`ffx-engine-golden.test.ts`'s line), seeds 1 and 7: 18 chains, 2,395 turns, the event log tallied. None of this
has been changed; these are what a wiring batch has to settle. All rows are **FFX only**.

### Overdrive

| # | What | Where in the engine | Example (engine / game) | How often |
|---|---|---|---|---|
| O1 | **Rounding.** The engine adds the unrounded percent (floored at the end) and never the `+ 1`; the game divides first and adds 1 to the quotient, so every hit gives at least 1 | `overdrive.ts` 154 to 183 | Tidus (1,000 HP) takes 150: 4 / 5. Yuna is a Comrade: 3 / 4. Warrior deals 55 against reference 115: 4 / 5; deals 999: 16 / 16 | every gain of a Stoic, Warrior or Comrade: 182 Stoic, 160 Warrior and 18 Comrade gains in the 18 chains; each one is 1 point (of 100) short, or short by a share of one |
| O2 | **Healer** gains from the heal capped at the missing HP; the engine uses the whole heal, "even at full HP" | `overdrive.ts` 186 to 189 | Yuna heals Tidus 500 at 800/1,000: 8 / 4. At 1,000/1,000: 8 / 1. 100 at 900/1,000: 1 / 2 | 60 gains in the chains (Yunalesca, Braska's Final Aeon, Natus, Omnis, Yojimbo): the engine's Healer fills about twice as fast on a big heal |
| O3 | **The aeon gauge** is 20 points wide in the game, with its own gains; the engine uses a 100-point scale with the Stoic gain times 5 on a hit taken and the Warrior gain (capped at 16) times 5 on a hit dealt | `overdrive.ts` 88 to 96, 154 to 183 | aeon (2,500 HP) hit for 500 base: 30 of 100 / 4 of 20 (20 of 100). It deals 600 at reference 280: 80 of 100 / 4 of 20 | 67 aeon-damage and 62 aeon-attack events in the chains. The engine's aeon gauge fills about 1.5 times as fast on a hit taken and **up to 4 times as fast on a hit dealt** |
| O4 | **Shield and Boost** apply to any character in the game (Shield zeroes every gain, Boost **doubles** it); the engine applies them to aeons only, Shield as zero and Boost as x1.5 | `overdrive.ts` 103 to 109 | a Stoic hit of 150 while Shielded: 4 / 0; while Boosted: 4 / 10 | Shield and Boost are aeon commands, so only the aeon case is live: the x1.5 against x2 |
| O5 | **Avenger, Slayer, Hero and Coward never fire** in the engine (no call site); Tactician, Victim, Dancer and Rook fire on the engine's own conditions (a fixed status list, a miss, a Shell or Protect) and not on "the hit applied a harmful status" | `overdrive.ts` 41 to 69, `hit-apply.ts` 96 to 136, 272 to 275 | a Slayer kills a monster: 0 / +20 | no shipped build uses any of these twelve modes (read) |
| O6 | **SOS Overdrive** (x2 below half HP, bit 0x4) is "gain only while Critical" in the engine, so no gain at all above half HP; **Overdrive to AP** gives nothing; the game gives AP | `overdrive.ts` 105 to 106 | SOS Overdrive at full HP, a Stoic hit of 150: 0 / 5 | no shipped build wears them (read) |
| O7 | **Modes are fixed per build.** The game's modes are learned from the counters of §1.4 and chosen in a menu | builds | Tidus learns Warrior after 150 battles with the event | n/a in the chapters |
| O8 | **Identical:** the reference damage (7,225 of 7,225 Strength/Magic pairs), Daredevil's trigger (HP below half), Sufferer's status list, the Ally +3, the Victor +20 (the engine pays the active members, the game the members in the battle: the same three), the gauge clearing on an aeon's death (and only an aeon's) | | | |

### Steal, Pilfer Gil, Bribe

| # | What | Where in the engine | Example (engine / game) | How often |
|---|---|---|---|---|
| S1 | **The chance schedule.** The engine halves a percent (100) and rolls `0..99`; the game halves a byte (255) and rolls `0..254`, never below 1 | `steal.ts` 82 to 90 | chance after 0 to 9 steals: 100, 50, 25, 12, 6, 3, 1, 0, 0, 0 / 100, 49.8, 24.7, 12.2, 5.9, 2.7, 1.2, 0.4, 0.4, 0.4 percent | every steal: all 14 boss tables use `baseChance: 100` for the game's byte 255. The first four steals agree to within 0.5 points; from the eighth the engine can never steal again |
| S2 | **A miss cancels a steal** after the draws; the engine's Steal cannot miss (`canMiss: false`) | `steal.ts`, data | Steal at an evasive monster: succeeds / may fail | read |
| S3 | **Pilfer Gil, Nab Gil and Bribe have no resolver**: the data rows carry strings (`stealRoll`, `bribeRoll`) that nothing reads (hard rule 4 again); Mug is the only member of the family wired | `steal.ts` 58 to 60 | Pilfer Gil: spends a turn with no gil / `floor(floor((draw % 101 + 100) * factor * 100 / 200) * chance / 255)` | read; the shipped chapters do not use them (no `gilFactor` in the data) |
| S4 | **Bribe forgets the gil already paid** in the engine's data comment (`gil * 256 / maxHP / 20 - 64`); the game uses paid plus offered | `special-rikku.ts` | three offers of 8,000 gil to a monster with 2,000 HP: 0, 0, 0 percent (the offer alone gives value -13) / 0, 14.8, 34.8 percent (paid plus offered: -13, 38, 89 out of 256) | read |
| S5 | **Identical:** the rarity thresholds (0x20, 0x80 with Pickpocket, always with Master Thief), a failed steal changing nothing, the item reaching the inventory at once | | | |

### Rewards

| # | What | Where in the engine | Example (engine / game) | How often |
|---|---|---|---|---|
| R1 | **Items.** The game rolls two item slots per monster (`draw % 255` against a chance byte, then a 1-in-8 rare pick among the slot's two items), reads a separate list on an overkill, and replaces drops with spheres under Distill; the engine rolls each listed drop against a percent and doubles the counts on an overkill | `results.ts` 35 to 53 | an overkilled monster: counts x2 / its own overkill list | every victory; the per-boss loot records were not read in this lane (§7), so the size is unknown |
| R2 | **Gil** is doubled by a living in-battle Gillionaire and clamped; the engine adds the listed gil | `results.ts` 40 to 45 | gil 1,000 with Gillionaire: 1,000 / 2,000 | no shipped build wears Gillionaire (read) |
| R3 | **AP** goes to every slot 0 to 0x11 with Double, Triple and No AP, then is taken back for slots that never acted, are dead or Petrified; the engine's rule is the same in spirit (alive, not KO or Petrified, at least one turn) with no auto-abilities | `results.ts` 74 to 104 | a Triple AP member: x1 / x3 | no shipped build wears them (read) |
| R4 | **Gear drops** (a chance byte per monster, six or more draws) do not exist in the engine, whose drops are items | `results.ts` | a boss with a gear chance: nothing / a weapon or armor for a random joined member | per boss; not read |
| R5 | `apForLevel` equals the game's curve except at levels 101 and 102 (21,116 and 21,739 against 22,000) | `results.ts` 18 to 20 | | unreachable |

### Aeons

| # | What | Where in the engine | Example (engine / game) | How often |
|---|---|---|---|---|
| A1 | **Stat rows: no difference.** `AEON_STAT_COEFFICIENTS` equals the game's bytes in 90 of 90 pairs; the rows the chapters carry (`AEON_CANONICAL_STATS`, the Gagazet, Zanarkand and Inside Sin rows) equal the kernel's output for the research's declared Yuna and battle count in 300 of 300 numbers (Flux N = 250, Yunalesca N = 300, Braska N = 360). What is not the game's: there is **no live formula** (the rows are three static blocks), the Yuna profiles are authored presets (`[estimate]`), and the Aeon's Soul bonuses and the equipment percents are not modelled | `data/ffx/aeons/index.ts`, `builds/*.ts` | Valefor HP at N = 250: 1,530 / 1,530 | every chapter with aeons |
| A2 | **Recovery counters.** One value of 3 battles for every aeon, "authored, no source publishes a figure"; the game has 8, 12, 20, 20, 24, 24, 24 and 30 (x3). `reviveCountdown` is set and read but nothing in `src/battle` counts it down | `aeons.ts` 22, 109 | Valefor KO'd: back after 3 / after 8 battles | every aeon KO: 33 'ko' and 10 'banished' dismissals in the 18 chains |
| A3 | **The summoner's recovery is erased.** `thawParty` puts back each member's counter as it was when the aeon came, which for the summoner is before her Summon recovery was charged; the game keeps the recovery. Engine, run: Yuna at Agility 20 summons (rank 3), is charged 30, and after the dismissal her counter is 0; game, from §4.7 (no swap or dismissal writes the summoner's counter) and the rank-3 recovery of the CTB note: 30 | `aeons.ts` 45 to 55 | 0 / 30 | every summon: 51 in the chains. She acts at once after the aeon leaves instead of after the summon's recovery |
| A4 | **Aeon equipment is missing**: crit bonus +6 on aeon commands (engine 0), Pierce on nine of ten aeons (none), Break Damage Limit on Bahamut, Anima and the Magus Sisters (none), Break HP and MP Limit (none). The elemental absorbs are modelled (`AEON_INNATE_AFFINITIES`), through a table in `setup.ts` | `setup.ts` 94 to 142 | an Ifrit Attack against a Luck-15 monster: crit chance 2 / 8 percent points; a Bahamut hit that computes above 9,999: 9,999 / the full amount | every aeon physical hit; Pierce matters against Armored enemies |
| A5 | **Identical:** the immunities. The engine's 22 (Death, Zombie, Petrify, Poison, the four Breaks, Confuse, Berserk, Provoke, Threaten, Sleep, Silence, Darkness, Slow, Doom, Eject, Scan, Defend, Guard, Sentinel) are exactly the game's effective 22 (16 resistance bytes of 255 or, for Threaten, of 0 percent, and six extra-status bits); the only difference is the four Distill statuses, which the engine does not have. Curse and Delay are open in both | `setup.ts` 94 to 117 | | |
| A6 | **The summon is one instant**: the engine freezes the party and sets the aeon's counter to 0 at once; the game parks the party first and takes it out of the turn list when the arrival action starts. The effect is the same for one aeon; the Magus Sisters (three at once, `ctx.state.aeonId` a single id; their joint Delta Attack handing the other two the costs and the rank's recovery, §4.7) cannot be represented | `aeons.ts` 64 to 88 | | the Sisters are in no shipped build |
| A7 | **Dismiss**: the game revives a fallen member of the dismissed list to 1 HP (the Magus Sisters case), the engine does not; the queued actions of the leavers (not the current one) are completed without being executed in the game, their recovery and costs charged (read) | `aeons.ts` 96 to 115 | | the Sisters only |
| A8 | `aeonEntryDelay` (exported, never called) says a freshly summoned aeon enters with a rank-3 delay; the game's counter for it is 0 | `aeons.ts` 138 to 141 | `baseCtb(agi) * 3` / 0 | dead code |
| A9 | **Identical:** a KO'd aeon's gauge is zeroed (and only an aeon's), a wipe returns the party and is not a Game Over, HP and MP persist between battles, the aeon acts next after arrival, the Grand Summon's temporary gauge and the restore of the held one | | | |

## 6. What the engine has to supply to call the kernels

**Overdrive** (`kernel/overdrive*.ts`): per slot the mode, gauge and maximum (100 for the party, 20 for aeons), maximum HP and HP,
the permanent, Sleep, Silence, Darkness and Slow state, the extra word (Shield, Boost, Curse, Doom bits), the buff flags, the
auto-ability word B, the per-battle learning bits, the reference damage, the AP factor, in-battle, dead, AP-blocked, Petrified and
gets-turns; per party member the learning counters, learned bits, the two level bytes and the AP curve row; the hit's signed HP
change, its base damage and its "charges Overdrive" gate, the harmful-status count and the outcome bits of its record; the
turn-start call for every queued turn; the flee, victory and death calls. The engine's gauge has to move to bytes (and the aeons'
to 20).

**AP and rewards** (`kernel/ap-award.ts`, `drops.ts`, `gear-drop.ts`): the loot record of every monster (gil, AP, overkill AP, two
chance bytes, the gear chance, the item and quantity lists for a normal kill and for an overkill, the bribe item and factor, the
slot and ability bases, the ability rows by owner and type, the steal chance, items and quantities, the Pilfer factor), the Distill
bits of the monster, the killer's slot and streams, who has joined, the ability groups, and the `acted`, in-battle, dead and
Petrified flags per slot. The engine's `rewards.drops` (percent and counts) has to be replaced by the record.

**Steal, Pilfer Gil and Bribe** (`kernel/steal-rewards.ts`): the loot record, the thief's auto-ability word, the number of missed
hits, the target's steal count and gil chance and gil paid, its max HP and special bits and sleep state, the command's misc word,
the gil offered and the draws on streams 10, 11 and the target's mode-2 stream.

**Aeons** (`kernel/aeon-stats.ts`, `aeon-party.ts`, `battle-save.ts`): Yuna's save record and bonus record (HP, MP, eight stat bytes;
the Sphere Grid is what fills the bonus); the global battle count; per aeon its `ply_rom` row (18 bytes and the recovery value), its
`sum_assure` row for the tier, its own bonus bytes, current HP and MP, gear ids (and through them the ability effects: percents,
masks and three words each), recovery counter; for the party transitions the active list, the parked list, the party order table and
its copy, the globals (summon active, aeon, summoner, Grand Summon, current actor, the dead mask), the reward flags and, per
character, the bytes listed in §4.9 (the in-battle byte and its parked copy are the central ones). The two level bytes, the Sphere
Grid's bonus record and a battle counter do not exist in the engine today.

## 7. Open questions

1. **The two level bytes** (`Save+0x3b`, `+0x3c`) behind the AP curve. The engine's `sLv` plays the role of their sum; what the second
   byte is (a carry? a bonus level?) was not traced.
2. The second battle-counter increment in the random-encounter code (VA 0x00780d10, the fade variant): read, not traced; it may
   double count in one encounter type.
3. The per-boss loot records (gil, AP, overkill AP, the two item slots and the overkill lists, the steal chance and items, the gear
   chance) of the engine's boss groups were not read; R1, R2 and R4 have no size until they are. The engine's boss steal tables all
   say "byte 255".
4. The **queued-action completion** of a character that leaves (VA 0x007b20b0, §4.9) and the formation positions were left out of the kernels
   (§4.9).
5. VA 0x007a89c0 (a script command that re-initialises a set of characters from their save records, revives them and sets the
   counter and its stored base to three times the tick speed) was run once in the emulator for a party slot, with the presentation calls
   recorded, and swept over all 256 values of the saved Agility byte: the counter and its stored base are both `3 * tickSpeed(Agility)`
   (84 at Agility 1, 30 at 20) in 256 of 256, so `kernel/ctb.ts`'s tick speed already gives it and no kernel was added; the rest of the
   copy (HP and MP from the save, the statuses cleared) was not ported. Its only caller is a script command (VA 0x007a7400).
6. VA 0x007871f0, called when an aeon dies with a certain save flag, looks like an event cue (a trophy); not traced.
7. The Aeon Ribbon record's second effect word (`+0x60`, 0x793f) is decoded here only as the extra-status immunity word; the
   Distill statuses are not modelled by the engine.
8. Whether the research's Yuna profiles (§6.4.2 of `ffx-combat-core.md`) are what Bailey wants for each chapter is a decision, not a
   fact; the kernel makes any profile exact.

## 8. Corrections to other notes, and names for the anchor map (`D:\Tools\ffx-parity\ffx\anchors.md`)

**Corrections to the other notes.**

* `research/re-ffx-commands.md` §5 (and `docs/handoff/re-parity-w1.md`, the input table row for `Chr+0x5d8`) say the equipment crit
  bonus is 0 "for every monster and aeon". The monster half stands. For an **aeon** it is **6**: `pp_BtlInitChr` runs the party-stats
  function for every id that is not a monster, and an aeon wears two pieces of gear with a crit byte of 3 each (§4.6, run in the
  emulator for all ten aeons). The same function gives nine aeons Pierce and five of them Break Damage Limit, which the damage
  adapter's `autoWordA` and `autoWordB` cannot see because an engine aeon has no equipment.
* The anchor map's caller list for `pp_BtlSummonCtb` (0x007b1aa0) is wrong: its only caller is VA 0x00788500 inside the per-character
  command state machine (0x00788480), and the name says "summon" for what is the Magus Sisters' joint-action CTB (§4.7).

**Names worth putting in the anchor map** (all FFX.exe build 25501027; the names are ours):

| VA | Name | What |
|---|---|---|
| 0x00788480 | command state machine | one pass over the 31 characters per frame, switching on the state byte `Chr+0xdfb`; state 1 starts an action and the special-action kind `Chr+0xdea` picks the aeon steps: 1 the arrival swap, 8 the joint-action CTB |
| 0x007ae370 | special-command handler | Escape 0x3003, Switch 0x3002, Summon 0x3117 and 0x3118, Magus Sisters 0x30ff, Dismiss 0x3056 and 0x3057, and 0x3129 (queues the sisters' joint action) |
| 0x007adf90 | summon | parks the party, brings in the aeon or the three sisters, queues the arrival action |
| 0x007ade10 | swap active and parked party state | lists, order table and the in-battle bytes |
| 0x007adae0 | swap one member out and one in | Switch, the summon, the return of the party |
| 0x007aef20, 0x007aeec0, 0x007adf10 | dismiss, restore the parked lists, return the party | |
| 0x007ae1a0, 0x007ae2e0, 0x007af060 | queue the arrival or dismissal action (mode 0, 1, 2 gives kind 1, 3, 2), queue the sisters' joint action (kind 8), choose the animation and kind | |
| 0x0078e0a0, 0x0079a080 | aeon wipe, aeon unavailable | |
| 0x007928d0, 0x007917d0, 0x007911e0 | battle-end status, battle-end state, end-of-action processing (the dismissals run here) | |
| 0x00785fc0, 0x00786900, 0x007ad820 | end-of-battle save with the aeon rebuild, rebuild all 18 party slots (menu), equipment change inside a battle | |
| 0x0079c5f0 | battle-start copy of a party slot into its character | stats, then the effect of each piece of gear (crit bonus, element bytes, auto-ability words, resistance bytes, the extra-immunity word) |
| 0x007a89c0 | character refresh | a script command (via 0x007a7400): re-initialise from the save, revive, counter and stored base to three times the tick speed |
| 0x00783020 | battle manager | the global battle count goes up here at battle start |
| 0x00780d10 | random-encounter roll | a second increment of the battle count in one variant |
