# FFX-2 ATB gauge and status clocks: what the game code does

**Game case: FFX-2 only.** FFX is a CTB game with its own tick table, scheduler and status turns in its own exe; those have
their own notes (`research/re-ffx-ctb-status.md`). Part of the `re-parity` track
([docs/plans/re-parity.md](../docs/plans/re-parity.md)). Drafted 2026-10-08; corrected on 2026-10-09 from a measurement on the running
game ([re-ffx2-timing-measured.md](re-ffx2-timing-measured.md)): the logic rate is 29.97 steps a second (§1), a charge countdown is not
halved in play (§3.1, §3.5) and an effect animation does not stop the gauges (§2).

**Source note (applies to every statement below unless a line says otherwise):** FFX-2.exe Steam build 25501027
(SHA-256 6EA7F142...CD69), the HD Remaster's 32-bit executable, image base 0x00400000; every address below is the
virtual address in THAT (live) image. The functions were read in Ghidra 12.1.4, both the decompiler and the
disassembly, in the older copy of the exe (the same code sits 0x20 to 0x30 higher in the battle range; globals from 0x00d28000
up sit 0x1000 higher) and compared byte for byte with the live file by the anchor-map lane (90 of 91 anchors are identical; the
one that differs is the main frame function). The constants come from `battle/kernel/rom.bin` of the same Steam files (332 bytes,
SHA-256 30c36ec6...c6c3; a 0x20-byte header, then the `btl_rom` struct of the shipped `rom.h`, which the game loads to VA
0x00df7e74; the exe image itself holds zeros there), and the command costs from `battle/kernel/command.bin` (553 rows of 140
bytes, the party's commands) and `monmagic.bin` (567 rows of 136 bytes, the monsters'), read at the offsets the exe uses
(`Cmd+0x22` ATB cost, `+0x24` cast cost, `+0x5f` status times); the shipped `command.h` is an older layout and is not used. The
`new_uspc` and `jppc` copies of those two files hold identical cost fields. Everything is written in our own words: no game code
and no game text is reproduced here.

| This note | Kernel (pure TypeScript, not wired into the engine yet) | Tests |
|---|---|---|
| §3 speeds, recovery, thinking, charge, the state machine, the hand-off | `src/battle/ffx2/kernel/atb-clock.ts`, `atb-gauge.ts`, `atb-tick.ts` | `tests/unit/parity-ffx2-atb.test.ts` |
| §4 battle start (init, first strike, opening trim) | `kernel/atb-start.ts` | same |
| §5 delay, charge countdown, magic cancel | `kernel/atb-interrupt.ts` | same |
| §6 status clocks, Doom, Auto-Life, Defense | `kernel/status-timers.ts`, `status-timers-set.ts` | `tests/unit/parity-ffx2-status-timers.test.ts` |

## 0. How this was checked

1. The decompile and disassembly of every function were read for operand widths, signed or unsigned compares, and the kind of
   division (the decompiler shows the compiler's multiply-by-magic-number as a plain division). The constants were read from
   the shipped files, not from a FAQ.
2. The real machine code of each function was run in an x86-32 emulator (Unicorn, via the harness in
   `D:\Tools\ffx-parity\harness`) on generated inputs, with only these replaced: the random generator (scripted), the
   command-row lookup (a dictionary of rows), the magic-execution tracker (its two outputs scripted), the debug print, the
   HUD and presentation routines, the script / AI / Confusion / Berserk requests (their answers scripted), and, for single
   functions, the status recompute. Every result was compared with the kernels. **No differences**, in:

   | Function (live VA) | Vectors |
   |---|---|
   | `MsChrSetDecTime` 0x006349f0 | 6,000 |
   | `MsStatCheckStop` 0x006430c0, `MsATBActiveCheck` 0x00633f60, `MsSetATBwait` 0x00634ab0, `atb_can_tick` 0x00634ad0, config index 0x0060c5e0 | 400, 3,000, 200, 300, 100 |
   | `MsATBgetRestTime` 0x00634110, `atb_charge_time` 0x00644520 | 3,000, 3,000 |
   | `MsATBgetThinkingTime` 0x00634170 (with the real `pp_btl_get_stat` team counts) | 20,115 |
   | `MsCommandComplete` 0x00640190 | 9,138 |
   | `atb_chr_step` 0x00634b10, `MsChrATBprocess` 0x006343a0 (all 31 slots, the ready list, the hand-off and the polls) | 8,000, 4,000 |
   | `MsChrAtbInit` 0x00634700, `MsChrAtbReset` 0x00634870 | 12,000, 12,000 |
   | `MsCalcFirstAttack` 0x00618b60 (with its 31 real resets), the opening trim 0x00634280 | 9,605, 2,000 |
   | `apply_atb_damage` 0x0061b620, `charge_start` 0x00644f10, `charge_tick` 0x00644770 | 6,000, 1,455, 2,000 |
   | `magic_cancel` 0x00618dd0 (the harness lane's vectors, `D:\Tools\ffx-parity\vectors\ffx2\magic_cancel.json`) | 24,529 |
   | `MsStatusProcess` 0x00636e80 (all 31 slots) | 8,000 |
   | `MsSetStatus` 0x00636c70, `pp_status_expire` 0x00636660, `MsResetDefenseStatus` 0x006368d0, `pp_has_auto_life` 0x0061a800 | 7,722, 300, 300, 300 |
   | whole-battle lifecycles: the real ATB process, command ends, delay and hit reactions, 200 to 400 steps each (61,200 in all), checked at the opening counters, on every step and on the draws used | 200 sequences |
   | status lifecycles: the real speeds, status process and `MsSetStatus` with statuses inflicted between steps, 300 to 1,500 steps each (139,400 in all), checked at the start, at every event, on every step and on the draws used | 150 + 60 sequences |

   545 `charge_start` vectors with a debug switch set were left out (the three debug switches are not modelled).
3. A deliberate one-line fault was put into the kernel 82 times (each file, each rule above: a constant, a comparison, a mask,
   a clamp, an order); the vectors caught 79. The 3 that survived are not faults: `best <= 0` against `best < 0` in the opening
   trim (a smallest wait of exactly 0 subtracts 0 either way), the order of the 0x40 and 0x80 tests in the group 2 speed
   choice (no status has both bits), and which copy of the applied mask the "Sleep ended" count looks at (the count is only
   ever compared with 0).
4. The tests in the repo carry hand-worked examples (the arithmetic is in the comments), and fixture blocks that load
   `tests/fixtures/parity/ffx2/atb_*.json`, `status_process.json`, `status_set.json`, `status_sequence.json` (a stratified
   pick of each function's vectors, every branch represented). Scripts and the full vector files stay outside the repo in
   `D:\Tools\ffx-parity\kernel-check-atb\`.
5. The running game (2026-10-09). A read-only sampler on Bailey's Steam FFX-2 logged the clock, the gauges and the character
   structures through three battles and compared them with this note ([re-ffx2-timing-measured.md](re-ffx2-timing-measured.md)). Most
   of it matched: the speeds, the recovery formula, the opening gauge and trim, the preemptive reset, Delay, thinking 0 and the Wait
   flag. Three things did not and are corrected below: the logic rate is 29.97 steps a second (§1), a charge countdown is not halved
   in play (§3.1, §3.5), and an effect animation does not stop the gauges (§2).

**Notation.** `Chr+0xNNN` is an offset into the battle character structure (stride 0x17E0, 31 entries; array pointer at VA
0x00e0ebac). Slots 0 to 14 are the party side (the three girls use 0 to 2), 15 to 30 are monsters. `Cmd+0xNN` is an offset into
the command row, `Rec+0xNN` into the 0xCC-byte action record. All arithmetic is 32-bit; divisions round toward zero.

## 1. Units, steps and seconds

The game never converts to seconds. It counts in **units** and takes a fixed amount of units off a counter every **logic step**
(one pass of `pp_battle_logic_step`, 0x0061e440). The amount is the character's speed, set by the Config "ATB speed" and by Haste,
Slow and Stop: **Slow 70, Normal 95, Fast 120** units a step (`rom.bin` `ATB_speed`, struct field at VA 0x00df7e98; a config
byte above 2 reads as Normal).

**A logic step lasts 1/29.97 s = 0.033367 s: measured on the running game on 2026-10-09**
([re-ffx2-timing-measured.md](re-ffx2-timing-measured.md) section 3). The frame pacer (0x00606900) counts real time in "fields" and plans
one step per two fields; its field counter rose by exactly 2 per step, at 59.94 fields a second, and the step counter (VA 0x00df8470)
rose 5,701 times in 190.19 s over three battles (29.975 a second; 180 of 188 one-second bins hold exactly 30 steps). That is
60 / 1.001 / 2 = 29.97003 steps a second, and every time below is steps x 0.033367. Before the measurement this note could not tell 30
from 60: the pacer runs one step even when fewer than two fields have elapsed, so a main frame function called once per display frame
would have run 60 steps a second and one called every second frame 30, and the platform loop was not traced; every time was given both
ways. The 60 column is gone and the 30 column became 29.97 (about 0.1 percent longer). One outside datum fits neither: the engine's
research cites a worked example of AGI 42 and a 70-cost action as 16,279 ticks and 5.42 s (`research/ffx2-combat-core.md` §1.2, a
single source), and the game's 16,279 units are 172 steps = 5.74 s. The kernel works in steps only; `stepsToSeconds(steps, rate)` takes
the rate as an argument, so pass 60 / 1.001 / 2 (its candidate list [30, 60] predates the measurement).

| Quantity | Units | Speed | Steps | Seconds at 29.97 steps/s |
|---|---|---|---|---|
| Units per second at Normal / Slow / Fast | 95 / 70 / 120 a step | | | 2,847 / 2,098 / 3,596 |
| Recovery after Attack (cost 70), AGI 41 | 16,666 | 95 | 176 | 5.87 |
| the same at AGI 255 | 2,734 | 95 | 29 | 0.97 |
| the same Hasted / Slowed | 16,666 | 99 / 47 | 169 / 355 | 5.64 / 11.85 |
| the same at the Slow / Fast setting | 16,666 | 70 / 120 | 239 / 139 | 7.97 / 4.64 |
| A cast of cost 70 at AGI 41 (the full tick: measured, not halved) | 16,666 | 95 | 176 | 5.87 |
| Sleep | 150,000 | 95 | 1,579 | 52.69 |
| Confusion, Berserk | 200,000 | 95 | 2,106 | 70.27 |
| One count of a flag-4 status (Shell, Haste, ...) | 1,500 | 95 | 15.8 | 0.53 |
| One Doom count | 10,000 | 95 | 105.3 | 3.51 |
| Poison / Regen period | 16,000 | 95 | 168.4 | 5.62 |
| Delay, weak / strong | 4,000 / 8,000 | 95 | 42.1 / 84.2 | 1.40 / 2.81 |
| A monster's wait per fallen girl | 30 steps | | 30 | 1.00 |

(The step counts of a recovery are rounded up: the counter must reach 0 or less.)

## 2. The logic step and the clock gate

Per step, in this order (`pp_battle_logic_step`): the battle-end evaluation (0x0061ef70, which sets VA 0x00df68a3); the **ATB
process** (§3, `MsChrATBprocess` 0x006343a0); the **action dispatcher** (0x00644ed0: the charge countdown first, and it stores
whether an action is executing at VA 0x00df7815); the **status process** (§6, 0x00636e80). Nothing else changes a gauge or a
status clock, except the writers listed in §5.

Whether time runs is decided by a handful of globals (all live VAs):

| Global | Meaning | Written by |
|---|---|---|
| 0x00df7816 | pause level (non-zero stops everything) | 0x006316d0 sets 2 while a party exchange runs, 0x00631390 sets 1 for one scripted case, 0x00631200 clears a 2 once the checks 0x00647c90 and 0x0060ac30 report nothing pending |
| 0x00df68a4, 0x00df7814 | two more pause flags | only ever written 0 (at battle start, 0x0060790f and 0x0060788f): they never pause in this build |
| 0x00df7817 | Wait | `MsSetATBwait` 0x00634ab0, fed by the HUD control 0x0075e200 |
| 0x00df68a0 | battle state (1 = running) | the battle state machine |
| 0x00df68a3 | battle-end result, non-zero when the fight is over: 1 the party is gone, 3 nobody of it stands, 2 or 4 no enemy is left alive and unpetrified (2 when the byte at VA 0x00df84ad is set), or the preset byte at VA 0x00df84b5 | 0x0061ef70, every step (while a pause flag is set it just returns the preset) |
| 0x00df7815 | an action is executing | the action dispatcher, end of its pass |
| `MsMagicCheckCommandExe` 0x00644b80, two outputs | `exec`: 1 for the effect sequence of some commands (which ones is open: it stayed 0 through Attack, Fire and four monster casts on the running game), 2 for a hard pause; `hold`: 1 when that action is held by its own state | reads the action manager block at 0x00df6f90 |

`MsATBActiveCheck(id, mask)` (0x00633f60) is the gate every consumer asks. Its core is: the three flags above and Wait are 0
and `exec` is not 2. Extra conditions by mask bit: 1 the battle is in its running state with no pending end; 2 no action is
executing; 4 `exec` is 0; 8 `hold` is 0. The callers use **1** for the group 1 status timers, **7** for the group 2 counters,
Poison and Regen, and **4** for the charge countdown. For a command that raises `exec` to 1, every gauge, the charge countdown and the group 2 clocks would stand still while its effect
sequence plays and the group 1 timers (Sleep, Confusion, Berserk) would keep running; while an action is executing only the group 2
clocks and Poison / Regen wait. **On the running game no command seen raised `exec`.** The action-executing flag (0x00df7815) was 1
for 552 steps, covering the effects of Paine's Fire and four monster casts, and every gauge and a charge countdown went on falling
through them (a monster's recovery fell 75 times by 95 during Fire's 75-step effect; a 188-step countdown ran through 77 steps of
another monster's effect); plain Attacks never raised the flag. Only the Wait flag stopped the gauges (719 steps). Which commands, if
any, raise `exec` is open (§9). The ATB process itself needs the core, the running state
without a pending end, and `exec` exactly 0; an IDLE character additionally needs `hold` 0 to start recovering.

**Wait** (`MsSetATBwait`, 0x00634ab0): the flag is the value the HUD control passes (1) when the Config ATB mode is Wait (bit 11 of
the config word at VA 0x00dffce0), and 0 otherwise. The HUD control passes 1 when a girl is choosing and the HUD menu stack depth is
not 0: the depth is -1 with no menu, 0 for the top command list, 1 or more in a sub-menu or the target cursor. So in Wait mode the
clock keeps running while the top list is open and stops below it; in Active mode it never stops for menus.

## 3. The gauge of one character

### 3.1 Speeds (`MsChrSetDecTime`, 0x006349f0)

Run for every slot at the top of the ATB process (a slot with ATB disabled gets all zeros). With `base` = `ATB_speed[config]`:

```
s      = base;   if Haste (Chr+0x43c != 0):  s = s * 21 / 20;   if Slow (Chr+0x43d != 0) and s > 1:  s = s / 2
raw    = s                                                    Chr+0x9f0
awake  = 0 if petrified or Stopped, else s                    Chr+0x9ec   (asleep keeps it)
active = 0 if petrified, Stopped or asleep, else awake        Chr+0x9e8
tick   = active, halved (only when active > 1) if charging (Chr+0xd65) or in a hit reaction (Chr+0xd98) unless the
         Damage-Not-Stop bit (Chr+0x3a6 bit 1) is set                                                  Chr+0x9e4
```

Haste is applied before Slow. At Normal: Haste 95 -> 99 (99.75 truncated), Slow 47 (47.5); at Slow 70 -> 73 and 35; at Fast 126
and 60. The stop state is `MsStatCheckStop` (0x006430c0) of the character's ROOT (`Chr+0x16`): 4 asleep (status bit 4), 2 petrified
(bit 2), 1 Stopped (the byte `Chr+0x43e`); a condemned Doom victim (`Chr+0xe67`) no longer counts as asleep. The **tick** pays recovery
and the charge countdown; thinking is paid by the fixed **thinking tick** (`Chr+0x9fc`, always 1: the battle start stores it at VA
0x00df781c), so it does not speed up with Haste or slow down with Slow; **raw / awake / active** feed the status clocks (§6). A
character with both Haste and Slow never exists in play (the status recompute clears Slow when Haste is on, §6.2); the formula
above would give (base × 21 / 20) / 2 for it.

**Measured on the running game** (2026-10-09; [re-ffx2-timing-measured.md](re-ffx2-timing-measured.md) sections 4 and 6). The hit-reaction
halving is real: the tick read 47 (95 halved) and 49 (Rikku's Hasted 99 halved) while `Chr+0xd98` was set (64, 106 and 118 rows for the
three girls, with a one-step lag at each edge). **The charging halving did not happen:** `Chr+0xd65` stayed 0 through all 7 charge
countdowns (a girl's Fire and six monster casts), and they fell by the full tick, 95 a step at Normal. One monster's flag did come on,
for 69 steps during each of 4 cast animations, after its countdown had ended; its tick showed 47 then and nothing was counting on it.
So in play only the hit reaction halves the tick. The function above, which halves for either flag, is unchanged (it matches the game
on 6,000 vectors); what sets the flag belongs to the motion system (§9, question 4).

### 3.2 States (`Chr+0xe68`)

0 IDLE, 1 RECOVER, 2 THINK, 3 READY, 4 a girl's command menu is open, 5 a monster's script is asked every step, 6 a player-side
monster's AI is asked, 7 Confused, 8 Berserk, 9 a command is queued or executing. `Chr+0xe69` is the mode set at battle start: 1 girl,
2 monster, 3 player-side monster (`pp_is_aided_chr`: not a monster slot and a save index of 15 to 22).

### 3.3 Recovery (`MsATBgetRestTime`, 0x00634110)

```
recovery = clamp( cost_atb * 10000 / (AGI + 1) + carry,  0, 99999 )          carry = Chr+0x9e0, then reset to 0
```

`cost_atb` is `Cmd+0x22` (unsigned 16 bits) of the command that just ended, `AGI` the byte `Chr+0x39a`. Both counters `Chr+0x9d8`
(remaining) and `+0x9dc` (maximum) are set to it. **The cost belongs to the command**, not to the character. In the shipped tables
Attack (0x302d) costs 70. `command.bin` (the party's 553 commands): 84 rows have an ATB cost (50 in 25 rows, 80 in 21, 70 in 17, 180
in 10, 100 in 5, 60 in 3, 120 in 2, 200 in 1), 423 have a cast cost, only 10 have both and 56 have neither. The fire spells with MP
cost 4, 12 and 24 (0x30a5, 0x30a9, 0x30ad, by element, formula and MP; taken to be Fire, Fira and Firaga) have an ATB cost of 0 and
a cast cost of 70 each. `monmagic.bin` (the monsters' 567 commands): 325 rows have an ATB cost (16 distinct values from 20 to 200;
100 in 184 rows, 80 in 49), 308 have a cast cost and 135 have both. So a spell's recovery after the cast is 0 for the party and its
wait is the cast; a monster's command can have a recovery and a cast.

### 3.4 Thinking (`MsATBgetThinkingTime`, 0x00634170)

```
T = Chr+0x9f8;   t = (T > 0) ? draw % T + T / 4 : 0          one purpose-0 draw, only when T > 0
monsters: t += (girls in the active party and in the battle - how many of them are alive and not petrified) * 30
```

`T` is written only by `MsChrAtbInit`, from its caller's third argument, and every battle-start call passes 0: **in play T is
0**, so a girl never thinks and a monster thinks 30 steps for every fallen girl (dead or petrified) of the three active ones. The
active party is the three slot ids at VA 0x00df8436 (0xff = empty), counted if the slot is in the battle (`Chr+0x1784`) and not
hidden (`Chr+0x1792`); a slot listed twice counts once.

### 3.5 Charge (`atb_charge_time` 0x00644520, `charge_start` 0x00644f10, `charge_tick` 0x00644770)

```
base = cost_cast * 10000 / (AGI + 1)                                    cost_cast = Cmd+0x24
sum  = the percents (Chr+0x5b8 + k, signed bytes; ids at Chr+0x5b0 + 2k, count at +0x5af, at most 4) of the cut entries that name this
       command, or whose own row is a category entry (menu flags & 0xf8) while this row has no low menu bits (flags & 7 == 0) and
       the same sub-menu category
time = base if sum == 0, else (100 - clamp(sum, -100, 100)) * base / 100          a negative sum lengthens it, up to twice
```

A command of a cast class (2 to 4, chosen by the sequence class of the row) starts a charge when it begins executing: a tag is taken
from the allocator (0x0062d950; none free, no charge), then `Rec+0xa8` (remaining) and `Rec+0xac` (maximum) are both set to the time (0
if `Rec+0x2f` is set). Every step, while the gate for mask 4 allows and the remaining time is above 0, it falls by the caster's
**tick** (the full speed in play: the halving of §3.1 never applied to a countdown on the running game). If the battle end is pending and the caster is not in a stop state, the maximum is taken off
as well, so every cast resolves at once. **The cast is released by the sequence scripts**, which read the remaining time as the
script stat `CHANT_REST` (stat id 231; `CHANT_REST_SET` 232, `ATB_REST` 229, `ATB_REST_SET` 230 read the recovery pair); no numeric
test of the remaining time was found in the executor, and the scripts were not decoded (§9). **Measured on the running game:** the
countdown fell the full tick; in the five countdowns that ended with no other effect playing, the action-executing flag rose in the
step the count reached 0, the command's MP was paid in that step (Paine's Fire: 852 to 848), the effect then played (75 steps for Fire,
84 to 114 for the monster casts) and a spell ended with recovery 0; Paine's menu was open one step after her command ended. The
scripts are still undecoded (§9).

### 3.6 The per-character step (`atb_chr_step`, 0x00634b10)

Slots with ATB disabled or condemned are skipped. For the rest, one step:

* **IDLE (0):** if the idle gate holds (the core, running without a pending end, `hold` 0), the state becomes RECOVER and the RECOVER
  block runs in the same step.
* **RECOVER (1):** needs `atb_can_tick` (0x00634ad0: in the battle, alive, tick not 0, not held by `Chr+0xe72`, which a dress change
  sets). If the counter is above 0 it falls by the tick; if it is still above 0 the step ends. Otherwise the recovery has ended:
  Defense is cleared (`MsResetDefenseStatus`, §6.8), two bookkeeping routines run (the special-garment counter, 0x0061c270, and a
  presentation routine, 0x006363d0), and the state becomes THINK in the same step.
* **THINK (2):** the ready test (0x00636330: a pending status animation, `Chr+0x669`, with the motion flag `Chr+0xd96` holds the
  character back; otherwise it clears the pending word) runs; if thinking is above 0 it falls by the thinking tick and the step ends;
  otherwise, if the ready test allowed it, the character can tick and fewer than 31 are listed, it becomes READY (3) and is appended
  to the ready list.
* States 3 to 9 are left alone.

The counter is **not** decremented once it is 0 or below, so the overshoot of the last subtraction stays in it (a negative number), and
a counter that is already 0 or below when RECOVER is entered ends at once, in that step. The same happens to a monster that declined to
act (§3.7).

### 3.7 The ready list and the hand-off (`MsChrATBprocess`, 0x006343a0)

After every slot has stepped, the ready list is served **lowest recovery counter first** (the most negative, i.e. the one whose last
subtraction overshot most; ties keep slot order). For each, the hand-off request `MsActionRequest(id, 0xff, 1, 1)` (0x006352d0) asks the
script (a girl's party script, a monster's AI script) for a command. If it produced one the state is 9. Otherwise: Confusion (status bit
0x40) sets 7 and Berserk (0x80) sets 8 (Berserk wins), neither opens a menu; else by mode, 1 sets 4 and opens the girl's menu, 2 sets 5, 3
sets 6; any other mode stays READY. (A flag at VA 0x00e12434 would leave Confused and Berserk characters in READY; the only code that
sets it is a three-line wrapper at 0x006340e0 that nothing calls. Two debug bytes force mode 1; they are off in play.)

Then every slot in state 5, 6, 7 or 8 is asked **once per step**, in slot order: 5 the script request, 6 the AI request, 7 the Confusion
pick (`pp_confuse_action`), 8 the Berserk attack (`pp_MsAutoBerserkProcess`). The answer is written back as the state: **9 if a command
was produced or is already queued, otherwise 0 (IDLE)**; the AI request of state 6 sets its own state (2, THINK, with a thinking time of its
candidate count plus 10, when it declines). So a monster that became ready and whose script declines is asked twice in that step (state
5 from the hand-off, then the poll), goes back to IDLE, restarts a recovery that is already below 0 on the next step, and is ready and
asked again: it polls about once a step until it acts.

### 3.8 When a command ends (`MsCommandComplete`, 0x00640190)

It is the completion callback registered with the character's command queue (0x00626fe4 hands it to 0x0062c950) and is called by the queue
code (0x0062d120) when the last outstanding normal command of the queue has finished. The queue code puts `Chr+0xe68` back to **IDLE (0)**
just before; the function itself sets only the counters and its return value (1 living, 0 dead) is ignored:

```
dead: nothing is written.   alive:  recovery = recoveryMax = MsATBgetRestTime(id, the command that ended)   thinking = MsATBgetThinkingTime(id)
```

The rest time is computed first and the thinking draw (if T > 0) second; then the script is asked for its next step
(`MsActionRequest(id, 0xff, 6, 0)`). A girl's menu answer sets state 9 through the HUD packet code (0x006410a0, from state 4).

## 4. Battle start

**`MsChrAtbInit(chr, flag, thinkingBase)` (0x00634700).** Always draws one value first (purpose-0 stream, even when it is not used).

```
full  = clamp( carry + cost_atb(command 0x302d) * 10000 / (AGI + 1),  0, 99999 )         (Attack, cost 70 in the shipped table); carry consumed
start = full
if flag == 0 and the character is neither dead nor petrified:   start = ((draw & 0x3f) + 0x20) * full / 128          25 to 74 percent of full
if the character is neither dead nor petrified and has Initiative (ABILITY_LEAD, Chr+0x650 bit 0):  start = 0             ready at once
mode  = monster 2, player-side monster 3, else 1;   Chr+0x9f8 = thinkingBase if it is >= 0;   thinking = MsATBgetThinkingTime
state = IDLE
```

So the opening counter is a number of units still to wait, not a fill. Callers: every character in play at battle load with `(chr, 0, 0)`
(the party's three from 0x00626910, called at 0x006272a4, every monster from 0x00627820, called at 0x0060a8d3); a girl joining by the
party exchange (0x006318f0) with `(chr, 0, -1)`; and **a knock-out** (`pp_ko_resolve`, 0x006424b0) with `(chr, 1, -1)`, which sets her counter
to the full gauge, so a revived character waits a whole recovery. Changing dress (0x0061c650) does not touch the gauge.

**The preemptive / ambush roll (`MsCalcFirstAttack`, 0x00618b60),** run once by the battle state machine (0x00609e12) after the opening
counters are set, unless a result was preset (VA 0x00df84a5): two draws, both from fixed stream 1, taken up front.

```
P = average AGI byte of the party-side slots in the battle (integer mean, 0 if none);  n = how many of them hold First Strike (Chr+0x650 bit 1)
if n != 0:  P = (n + 3) * P / 2          then  P = P + 1;   M = average AGI of the monsters in battle + 1
a = draw1 & 255,  b = draw2 & 255
preemptive (1) if  a + (P * 100 / M) / 5  >= 255;   else ambush (2) if n == 0 and  b + (M * 100 / P) / 5  >= 255;   else normal (0)
```

At equal AGI the party strikes first on 21 of 256 values of `a` (8.2 percent; 8.1 percent measured over 100,000 random rolls) and is ambushed
on 7.6 percent. With a result of 1 or 2 `MsChrAtbReset(slot, kind)` (0x00634870) is called for **all 31 slots in order, one draw each**, whether or
not anyone stands there: the side that struck first gets kind 0, the other kind 1.

```
r = draw & 15;   kind 0:  r = 0 for a girl, base 0;     kind 1:  base 113 (0x71)
counter = (base + r) * full / 128          written unless the character has Initiative or is dead or petrified
```

So after a preemptive strike each girl is ready at once and each monster has 88 to 100 percent of a full wait; after an ambush the girls
have 88 to 100 percent and a monster 0 to 11.7 percent.

**The opening trim (0x00634280, not in the anchor map).** Called once from the battle state machine (0x00609e4d), after the roll and just
before the battle enters its running state. It finds the **smallest** recovery counter among the characters that take part in the ATB, are in the
battle and are not dead; if that is above 0 it subtracts `floor(2 * smallest / 3)` from the counter of **every** slot that is not dead or
petrified (in the battle or not, no clamp). The first character to act therefore starts with a third of its wait left. Example, three girls
at AGI 41 and one monster (opening counters drawn, no preemptive strike or ambush): the first character to act waits on average 20.8 steps
(0.69 s at 29.97 steps/s), the first girl 25.2 steps (0.84 s), and a unit 47.0 steps (1.57 s) on average, measured
over 20,000 draws with the kernels.

**Measured on the running game** ([re-ffx2-timing-measured.md](re-ffx2-timing-measured.md) section 4). The opening counter fitted
`((draw & 63) + 32) * full / 128` on all 13 characters of three battles. In the step the battle started running the trim was exact on
9 counters in 2 battles (smallest 5,409: 3,606 off every counter; smallest 3,547: 2,364 off), monsters included. In the third battle
a preemptive strike reset the three girls to 0 and the Iron Giant to 7,096 ((113 + 9) * 7,446 / 128), the trim found a smallest
counter of 0 and took nothing off, and all three girls opened their menus in the first running step. The ambush branch was not seen.

## 5. Interrupting a wait

**Delay damage (`apply_atb_damage`, 0x0061b620).** The Delay commands deal a flat amount: **4,000 (weak) or 8,000 (strong)** units
(`rom.bin` `delay_count`, read by formula 0x18 of the base-damage function; the damage pipeline may scale it like any ATB damage). For the
target:

* **charging** (flag `Chr+0xe66` set, maximum non-zero, the cast not released): remaining becomes `clamp(max(remaining, 0) + dmg, 0, 99999)`
  and the maximum grows to match; the cast is lengthened, never cancelled; a negative amount shortens it;
* **executing** (state 9): a positive amount is added to the carry `Chr+0x9e0`, paid with the next recovery; nothing else changes;
* otherwise: the recovery counter becomes `clamp(max(recovery, 0) + dmg, 0, 99999)` (the maximum grows to match) and a positive amount
  also closes the girl's open menu and sets the state to IDLE, so a character that was ready or thinking recovers again from the new counter.
  Two debug switches would skip it; they are off.

**Measured on the running game** ([re-ffx2-timing-measured.md](re-ffx2-timing-measured.md) section 5): three weak-Delay hits on a girl whose
menu was open set her counter to exactly 4,000, closed the menu (state 4 to 0) and left the maximum alone; she was ready again after 48
steps, 14 or 15 of them at the halved hit-reaction tick (99 to 49).

**Magic cancel (`magic_cancel`, 0x00618dd0).** For a command whose cancel chance byte (`Cmd+0x7a`) is non-zero: a target with
`Chr+0x3a6` bit 9 is immune (no draw); otherwise one draw from the ATTACKER's purpose-2 stream, `roll = draw % 100`, and the target's current
action (found through its root) is cancelled when it is a command (type 3) of class 2 to 4 that has not been released, the call's block mask is 0
and `roll < chance` (so 100 or more always cancels). The draw is made before the other conditions are looked at.

**What else stops a gauge:** a dead character is not ticked (`atb_can_tick`); a dress change holds the gauge (`Chr+0xe72`); a Stopped, asleep or
petrified character has a tick of 0 (§3.1); the clock gate (§2). On the running game nothing but the Wait flag stopped a gauge: an
effect animation did not (§2). The anchor map also records that applying a result cancels a character's queued
commands on death, sleep and stop (`pp_result_apply`); that was not modelled here. The ATEL scripts can set the recovery pair and the charge pair
directly (script stats 229 to 232); whether the sequences of the five bosses' commands do was not read.

## 6. Status clocks

### 6.1 The constants (`rom.bin`, loaded to VA 0x00df7e74)

`poison_time` 16,000, `poison_damage` 8, `regen_time` 16,000, `regen_damage` 8 (copied into `Chr+0x68c`, `+0x694`, `+0x690`, `+0x698` when the
character is built), `count_value` {1,500, 10,000}, `off_count` (VA 0x00df7ea8): **Sleep 150,000, Confusion 200,000, Berserk 200,000**, every
other group 1 status 0. The group 2 flag word of status `i` is the 16-bit word at VA 0x00d48804 + 6 i (`MsCheckStatCount`, 0x006218c0): bit 4
a 1,500-unit count (Shell, Protect, Reflect: 5; Regen, Haste: 4; Slow: 0x24; Stop 0x5a4; the immunities 15 to 17: 4), bit 8 the 10,000-unit
count that ends in death (Doom, index 14: 0x68), bit 0x40 count at the awake speed, bit 0x80 at the raw speed; the stat stages (7 to 13) have none.

### 6.2 Where a timer starts (`MsSetStatus`, 0x00636c70)

Called after any change (and by the status process when something counted). In order: the effective word `Chr+0x434` = `+0x570 | +0x550 |
+0x4fc | +0x450`; each stage byte `Chr+0x438 + i` = the saturating sum (`pp_clamp_add`, 0x00624d60, -125 to 125, an operand already above the
limit is returned as the larger) of the four layers `+0x4b4 + i`, `+0x500 + i`, `+0x574 + i`, `+0x554 + i`; if the Stop byte is non-zero Haste and Slow
are cleared, else if Haste is non-zero Slow is cleared; the callbacks for a changed petrify, death or eject bit; a Poison bit that has **just
appeared** draws `draw % (poison_period / 4 + 1)` (purpose 0) into the Poison accumulator, then a Regen byte that was 0 and is not now does the
same for Regen: a random first-tick phase of 0 to 4,000 units; every bit that has just appeared in the effective word loads its `off_count` into
`Chr+0x454 + 4 i`; the status link is refreshed if the caller asked and the stop state changed; max HP and MP are recomputed. The timers and
counters count the APPLIED layer (`+0x450`, `+0x4b4`); permanent sources only appear in the effective word.

### 6.3 What the status process skips and gates (`MsStatusProcess`, 0x00636e80)

Per slot: skipped unless it is in the battle, not hidden, has HP above 0, is not dead and is **not petrified**. The three speeds of §3.1
are read from the character and the stop state is asked again, so a status that landed earlier in the same step counts. Then:

| Part | Gate | Runs at |
|---|---|---|
| group 1 timers (§6.4) | mask 1 | raw |
| group 2 counters (§6.5) | mask 7 | active; Stop raw; Doom awake |
| Poison, Regen (§6.6) | mask 7 | awake |

and, if any timer or counter moved, `MsSetStatus(id, 0xff, 1, 1)`, a display refresh, and, if anything expired, `MsStatusEffectCheck` and a notice
to the display code (`0xc` if a group 1 timer ran out while the Sleep bit was still set, which includes Sleep's own expiry; otherwise `2`).

| State | Gauge | Sleep / Confusion / Berserk timers | Shell ... Slow, immunities | Stop counter | Doom | Poison, Regen |
|---|---|---|---|---|---|---|
| asleep | frozen | run | frozen | runs | runs | run |
| Stopped | frozen | run | frozen | runs | frozen | frozen |
| petrified | frozen, skipped by the status process: **everything frozen** | | | | | |
| dead | not ticked, skipped by the status process | | | | | |
| condemned (Doom ran out) | skipped by the ATB step; no longer counts as asleep | | | | | |

### 6.4 Group 1 timers

For each bit set in the applied mask `Chr+0x450` whose timer `Chr+0x454 + 4 i` is above 0: `timer = timer - raw` (32-bit); if the result is below
0 the timer becomes 0 and the bit is cleared. **Only Sleep, Confusion and Berserk have a timer; Poison, Silence, Darkness, Curse and the rest never
expire by time.** A timer that lands **exactly on 0** keeps its bit and is never looked at again (the test is "above 0"): that happens when the
speed divides the start value, which for Sleep (150,000) means a per-step raw speed of 120 (Config Fast) or 60 (Fast and Slowed). Sleep at the Fast
setting therefore never wakes by itself, which is the "Sleep never ends at Fast" behaviour the engine already carries as PR-0108 (from a single
source). Every other raw speed wakes it: Slow setting (70) after 2,143 steps, Normal (95) after 1,579, Hasted (99) after 1,516, Slowed (47) after
3,192, Fast and Hasted (126) after 1,191, Slow setting and Hasted (73) after 2,055, Slow setting and Slowed (35) after 4,286. Confusion and
Berserk (200,000) end at every speed that occurs (none divides it).

### 6.5 Group 2 counters

A counter `Chr+0x4b4 + i` from **1 to 125** whose status has flag 4 or 8 and is above its floor (0, or 1 for Doom) adds its speed (§6.1 flags) to a **signed
16-bit** accumulator `Chr+0x4cc + 2 i`; when the accumulator reaches the step (1,500, or 10,000 for flag 8) and the speed is not 0, the step is subtracted
(the remainder carries) and the counter loses 1, clamped to floor..125. Reaching the floor expires the status; for Doom that condemns the character. A counter
of 0, 126 or more, or negative, and the stat stages, never count; **a Doom counter of exactly 1 never counts**. A row's `status_time[i]` is the starting
counter (inflicting adds it, clamped to 0..125): Haste with 20 lasts 316 steps; Shell with 3 expires on step 48 (the 4,500 units need 47.4 steps and the
remainder carries).

### 6.6 Poison and Regen

Each step Poison (status bit 5 of the effective word) and then Regen (stage byte `Chr+0x43b` non-zero) adds the **awake** speed to its accumulator
(`Chr+0x684`, `+0x688`); when it is **above** the period (`+0x68c`, `+0x690`: 16,000) the period is subtracted and one tick of `(factor * maxHP) >> 8`
(unsigned shift of the 32-bit product, factor 8 = 1/32 of `Chr+0x384`, the current max HP) is delivered through `MsDamageBufferExe` (0x006422a0): damage
for Poison, the negative of it (healing) for Regen. There is no minimum (a max HP below 32 gives 0). **If Poison ticks, Regen is not looked at that step**
and its accumulator does not advance. The first tick comes 16,000 minus a random phase of 0 to 4,000 units after infliction; after that every 168.4 steps on
average.

### 6.7 Doom (`pp_status_expire`, 0x00636660) and Auto-Life (`pp_has_auto_life`, 0x0061a800)

When a flag-8 status runs out and the character is not already condemned: `Chr+0xe67` = 1, the HUD menu is closed (0x00634010 with 3), and command **0x3026** is
queued on the character itself with its own bit as the target mask. The shipped row 0x3026 inflicts Death at chance 255. A character condemned this way is skipped by
the ATB step and no longer counts as asleep. Doom counts: the shipped player Doom (0x3086) has `status_time` 5, the monster Doom (0x4073) 4: (5 - 1) * 10,000 units
is 422 steps (14.08 s at 29.97 steps/s), (4 - 1) * 10,000 is 316 steps (10.54 s).

Auto-Life: after the KO routine has marked a character dead (`Chr+0x1787`) it asks `pp_has_auto_life`: dead, `Chr+0x2d8` zero (the characters that leave on death are
not revivable), the Auto-Life status (bit 0x40000) and not ejected (0x400). If it holds, command **0x3025** is queued on the character itself; the revive is that
command's row. Nothing counts down.

### 6.8 Defense (`MsResetDefenseStatus`, 0x006368d0)

Called when a recovery ends (§3.6) and by the KO routine: if the effective word has Defense (bit 9), the bit is cleared from the APPLIED mask only and `MsSetStatus` runs.

## 7. Corrections and additions to the anchor map

Corrections to entries of `D:\Tools\ffx-parity\ffx2\anchors.md`:

* `pp_MsATBActiveCheck`: mask bit 1, which the entry calls "Active mode", is the running battle state with no pending end (VA 0x00df68a0 equal to 1 and
  0x00df68a3 zero); there is also a mask bit 8 (the second output of the magic check); the core stops for a hard pause (the first output equal to 2) as
  well. Two of the pause flags the entry lists (VA 0x00df68a4 and 0x00df7814) are only ever written 0 in this build (§2).
* `pp_MsATBgetThinkingTime`: in play the base T is 0 (its only writer stores the argument of its caller, and every battle-start call passes 0), so a girl
  neither thinks nor draws, and a monster adds 30 steps for every fallen girl (§3.4). The entry's formula only applies when T is above 0.
* `pp_MsCommandComplete`: it does not set the gauge state. The queue code (0x0062d120) puts the state back to IDLE just before it calls it (§3.8).
* `pp_charge_tick`: the countdown needs the gate with mask 4 (the command check's first output 0) and a remaining time above 0, and a pending battle end
  subtracts the maximum as well (§3.5). The tick it subtracts is the caster's tick, which `MsChrSetDecTime` halves while `Chr+0xd65` is set; on the
  running game that flag stayed 0 through every countdown, so in play the countdown falls the full tick (§3.1).
* The `Chr+0xe68` state list gains 5 (a monster's script is asked), 6 (a player-side monster's AI), 7 (Confused) and 8 (Berserk); states 5 to 8 are polled
  once a step and write their answer back as the state (§3.7).
* `pp_MsCalcFirstAttack` and `pp_MsChrAtbInit`: the formulas, the arguments of every caller and the fact that the resets run for all 31 slots, occupied or
  not, are in §4.
* `pp_hud_ctrl`: the "menu stack depth" it tests is -1 with no menu, 0 for the top command list and 1 or more inside a sub-menu or the target cursor, so Wait
  mode stops the clock only below the top list (§2).
* `MsMagicCheckCommandExe`: the reading that its first output is 1 while a command's effect sequence plays does not hold on the running game
  for Attack, Fire and the monster casts seen: the gauges and a countdown kept falling (§2).

Additions:

* **New function, the opening trim at 0x00634280** (the older copy's `FUN_006342b0`), called once from the battle state machine at 0x00609e4d: it subtracts two
  thirds of the smallest wait from every character at battle start (§4).
* The group 2 speed choice by flag word: flag 0x40 wins over 0x80; Stop counts at the raw speed, Doom at the awake speed, everything else at the active speed
  (§6.1). A group 1 timer that lands exactly on 0 never expires (§6.4); a Doom counter of exactly 1 never counts (§6.5); Poison's tick skips Regen for that
  step and has no minimum (§6.6); the group 2 accumulators are signed 16-bit and the counters signed bytes.
* `MsMagicCheckCommandExe`'s first output, when a command raises it, stops the ATB, the charge and the group 2 clocks but not the group 1 timers (§2);
  no command seen on the running game raised it.
* The base speed at VA 0x00df7818 is written by `pp_battle_start` and, in the older copy, also by a developer debug-menu entry (0x0065c010, labelled "ATB")
  and by an environment-file loader (0x006641a0); neither runs in play.
* Table layouts: the `rom.bin` fields sit at the addresses in §1 and §6.1, matching the shipped `rom.h`. The shipped `command.h` describes an older 132-byte
  row; the `command.bin` rows are 140 bytes (`monmagic.bin` 136) and use the exe's offsets (`Cmd+0x22` ATB cost, `+0x24` cast cost, `+0x5f` status times), so
  the header cannot be used to read them.

## 8. Where the engine differs today

Measured on 2026-10-08 by running the engine's own functions (`atbTicks`, `baseRequired`, `advanceGauge`, `tickMultiplier`, `chargeTicksFor`, `durationToTicks`,
`advanceStatuses`) and the kernels on the same inputs (temporary comparison test, archived as
`D:\Tools\ffx-parity\kernel-check-atb\zz-tmp-ffx2-atb-divergence.test.ts.txt` with its output). Seconds are at the measured 29.97 steps a second (the 2026-10-08 draft gave 30 and 60, written "@30 / @60"; the 60 figures are gone);
"E/G" is the engine's time over the game's. Nothing was changed. The engine's lines are in `src/battle/ffx2/`.

| # | Engine today | The game | Measured |
|---|---|---|---|
| 1 | One fixed clock, 3,000 ticks a second (`constants.ts:16`, `gauges.ts:51-56`, `157-160`, `engine.ts:314`) | 95 units a step: 2,847 a second at 29.97 steps/s | Attack recovery, AGI 41: engine 16,666 ticks = 5.555 s; game 16,666 units = 176 steps = 5.873 s (E/G 0.946) |
| 2 | Config speed ×0.746 / 1 / ×1.262 (`constants.ts:30`) | 70 / 95 / 120 units a step: ×0.737 / 1 / ×1.263 | Slow setting: engine 7.442 s; game 239 steps = 7.975 s. Fast: engine 4.402 s; game 139 steps = 4.638 s |
| 3 | Haste ×1.05, Slow ×0.5 on the tick rate (`constants.ts:91-94`, `gauges.ts:70-75`); if a unit somehow has both, Slow wins (`gauges.ts:72`) | Haste 95 -> 99 (×1.042; 73/70 and 126/120 at the other settings), Slow 47/95 = ×0.495 (35/70 and 60/120 at the others), both truncated; the status recompute never leaves both: Haste clears Slow | Recovery above: Hasted engine 5.291 s, game 169 steps = 5.639 s; Slowed engine 11.111 s, game 355 steps = 11.845 s |
| 4 | Every command refills the fixed value 70 (`baseRequired`, `gauges.ts:86-88`, `constants.ts:79`), plus 70 more for a `2xRT` row (`gauges.ts:98-101`) | recovery = the command's own `cost_atb`: Attack 70; the party's spells 0 (their wait is the cast; whether a sequence script adds a recovery afterwards is open, §9); the party's other commands 50 to 200; the monsters' commands 20 to 200 | by table (§3.3): the party's 84 commands with a cost hold 50 (25 rows), 80 (21), 70 (17), 180 (10), 100 (5), 60 (3), 120 (2), 200 (1); a Fire, Fira or Firaga recovery is 0 where the engine gives 70 |
| 5 | Gauge fills to `required` and keeps banking to 4.16× (`gauges.ts:115-117`, `178-181`) | a down-counter with no bank; overshoot only orders simultaneous readies | by reading |
| 6 | Ready actors in a fixed order, party by slot then monsters by slot (`results.ts:19-25`) | most negative recovery counter first, ties by slot | a girl at -10 and a monster at -85 reaching 0 in the same step: engine the girl, game the monster |
| 7 | Charge value tiers 16 / 26 / 39 [estimate] at the same rate as recovery (`constants.ts:101-103`, `gauges.ts:104-112`) | cost_cast of the row (Fire, Fira and Firaga all 70), paid at the full tick (measured) | AGI 41: engine 3,809 / 6,190 / 9,285 ticks = 1.27 / 2.06 / 3.10 s; game 16,666 units at tick 95 = 176 steps = 5.87 s for all three (the tiers do not come from this field; §9); measured: Paine's Fire (AGI 73, 9,459 units) counted down in 100 steps = 3.34 s, then played a 75-step effect |
| 8 | Slow doubles the charge VALUE as well as halving the rate: net ×4 (`gauges.ts:109`, `constants.ts:97`) | Slow halves the speed only (charging does not halve it again): ×2 | Slowed caster, tier 16: engine 5.08 s; game 355 steps = 11.85 s against 176 unslowed |
| 9 | No hit-reaction slow | a hit reaction halves the tick (unless the Damage-Not-Stop bit); charging does not | measured: after a weak Delay hit a girl's counter of 4,000 took 48 steps, 14 or 15 of them at the halved tick, where an unhalved count is 41 |
| 10 | Opening bars `floor(required * rand(0..60) / 100)` filled (`setup.ts:233`) | 25 to 74 percent of the full wait left, then two thirds of the smallest taken off everyone (§4) | AGI 41, three girls and a monster, 20,000 draws: first actor engine 2.87 s, game 20.8 steps = 0.69 s; first girl 3.04 s vs 25.2 steps = 0.84 s; mean unit 3.89 s vs 47.0 steps = 1.57 s; measured: all 13 opening counters of three battles fit the formula exactly and the trim was exact on 9 counters |
| 11 | Preemptive / ambush come from the encounter; the winner full, the loser empty (`setup.ts:225-227`) | rolled at battle start (8.1 percent preemptive, 7.6 percent ambush at equal AGI); the loser has 88 to 100 percent, the winner 0 (girls) or 0 to 11.7 percent (monsters) | monster after a preemptive strike: engine 16,666 ticks of wait, game 14,712 to 16,666 units; measured: one preemptive strike, the girls at 0 and the Iron Giant at 7,096 of 7,446 |
| 12 | Delay and cancel exist as `applyDelayEffect` (empties a percentage of the filled gauge, or shortens a charge by a percentage, never below 1) and `applyActionCancel` (drops any charge and clears gauge and recovery) (`gauges.ts:199`, `211`), but no ability calls them | Delay adds a flat 4,000 or 8,000 units to the recovery or the charge; magic cancel is a per-command chance (`Cmd+0x7a`) that cancels a cast of class 2 to 4 that has not been released | weak Delay 1.40 s, strong 2.81 s; a recovering girl with 5,000 left gets 9,000 and goes IDLE; measured: three weak Delay hits set a ready girl's counter to exactly 4,000 and closed her menu |
| 13 | An enemy's thinking hook (`thinkingTicks`, `active.ts:135`) is set to 0 at setup (`setup.ts:160`) and nothing raises it; the `thinkingPeriod` data field is read by nothing; no term depends on the party | the base T is 0 in play too, but a monster waits 30 steps for every dead or petrified girl of the three active ones (counted when its command ends), in addition to its recovery | 1.00 s each, 3.00 s with all three down; measured: the girls' thinking is 0 |
| 14 | Status duration = `round(value × 0.53 × 3000)` ticks (`constants.ts:174`, `statuses.ts:130-133`) | counts of 1,500 units at the active speed; Sleep, Confusion, Berserk 150,000 / 200,000 at the raw speed | Haste 20: engine 10.60 s; game 316 steps = 10.54 s. Sleep (engine 97): 51.41 s vs 1,579 steps = 52.69 s. Berserk and Confusion (133): 70.49 s vs 2,106 steps = 70.27 s |
| 15 | Doom is an ordinary timed status; Vegnagun's Doom has duration 9 = 4.77 s (`abilities-vegnagun.ts:238`) | (N - 1) counts of 10,000 units, then Death (0x3026); the shipped Doom rows have N = 5 (player, 0x3086) and 4 (monster, 0x4073); which row Vegnagun's own Doom uses was not traced | N = 5: 422 steps = 14.08 s; N = 4: 316 steps = 10.54 s; N = 9 would be 843 steps = 28.1 s |
| 16 | Remaining durations drain at ×0.5 / ×1.053 on a Slowed / Hasted unit (`statuses.ts:142-145`, `constants.ts:178-179`), and keep draining while asleep | the active speed (47/95, 99/95); the group 2 counters are **frozen while asleep** | a sleeping girl's Haste (20): engine 10,000 ticks left -> 6,842 after 1 s; game counter still 20 after 30 steps |
| 17 | Sleep's clock is held for every unit at the Fast setting (PR-0108, `constants.ts:36-46`, applied in `engine-core.ts:138-142` by Config speed only) | a timer that lands on exactly 0 stays: raw speed 120 (Fast) or 60 (Fast and Slowed); Fast and Hasted (126) wakes after 1,191 steps | the engine's Fast rule matches the game for a plain or Slowed sleeper and is wrong for a Hasted one, which the game wakes after 39.7 s; every other speed wakes (§6.4) |
| 18 | Poison / Regen every 3 s [estimate] (`constants.ts:182`) for `max(1, floor(0.03 maxHP))` (`statuses.ts:305`) | every 16,000 units (168.4 steps) for `floor(maxHP / 32)`, no minimum, random first-tick phase, Poison's tick skips Regen's step | max HP 1,234: engine 37 per 3 s (12.3 a second); game 38 per 5.62 s = 6.8 a second. Max HP 31: 1 vs 0. 9,999: 299 vs 312. 60,000: 1,800 vs 1,875 |

The largest gaps are row 10 (the opening wait is about four times shorter in the game) and row 7 (a cast counts down for 5.9 s at AGI 41,
against the engine's 1.3 to 3.1 s; how the sequence scripts release the cast is still open question 2 of §9, but on the running game the
effect began in the step the count reached 0), then rows 13 and 18. Rows 1 to 3 and 14 are within about 7 percent of the engine at the
measured rate; the rate no longer blocks wiring them.

## 9. Open questions

1. **The logic rate** (§1) is settled: 29.97 steps a second, measured on the running game on 2026-10-09.
2. **The cast times a player sees.** The shipped rows give Fire, Fira and Firaga the same cast cost (70) and an ATB cost of 0, which at the full tick is 176 steps (5.87 s at
   29.97 steps/s) for AGI 41; the engine's tiers (16, 26, 39 [estimate], from the FAQs) cannot be derived from this field. The release of a cast is done by the sequence
   scripts through `CHANT_REST`; they were not decoded. Until they are, the kernels give the countdown exactly and say nothing about when the cast fires (on the running game
   the effect began in the step the count reached 0). The same scripts can write the recovery pair (`ATB_REST_SET`); the party's recovery after a spell is 0 by the table's
   ATB cost and was 0 after Paine's Fire on the running game (one cast); other spells were not measured.
3. `MsMagicCheckCommandExe` (0x00644b80): which command animations raise `exec`, and for how long. The kernels take its two outputs as inputs. On the running game
   `exec` stayed 0 through the effects of Attack, Fire and four monster casts (§2); no command seen raised it.
4. What sets `Chr+0xd65` (charging), `Chr+0xd98` (hit reaction), `Chr+0xd96` and `Chr+0x669` (the ready test), `Chr+0xe72` (held): the motion system; the kernels take them as inputs. On the running game `Chr+0xd65` stayed 0 through every charge countdown, came on for 69 steps in a
   monster's cast animation and never came on for the girl's Fire; `Chr+0xd98` halved the tick as read.
5. Whether the sequences of the five bosses' commands, and of the party's casts, write the gauge directly (script stats 229 to 232).
6. The debug switches (VA 0x00df68b8 to 0x00df68bf: skip Delay, freeze a gauge, zero the charge numbers, skip thinking; 0x00df68c6: no charge; and the
   debug-menu and environment-file writers of the base speed, §7) are off in play and not modelled.
7. Player-side monsters (state 6, the AI request) were not decoded and cannot occur in the five chapters.
