# FFX-2 battle timing measured on the live game (2026-10-09)

**Game case: FFX-2 only.** Nothing here was measured in FFX (it is a CTB game with its own clock; `research/re-ffx-ctb-status.md`).
Part of the `re-parity` track ([docs/plans/re-parity.md](../docs/plans/re-parity.md)). This note checks the predictions of
[re-ffx2-atb-status.md](re-ffx2-atb-status.md), the spec of the ATB kernels (`src/battle/ffx2/kernel/atb-*.ts`), against the
running game, and records what the game did. Written 2026-10-09. Records only: no kernel, test or engine file changed.

**Source note (applies to every statement below):** Bailey's own Steam copy of FFX-2.exe, build 25501027 (SHA-256 6EA7F142...CD69;
the sampler compared the hash of the running process' image file with the live one when it attached and they matched). Bailey
gave the go-ahead on 2026-10-09 ("just open up the game for me and you do it please") and an agent played the game with the
keyboard only. Everything is written in our own words: no game code, game text or game file is reproduced here. The raw logs stay
on this PC, outside the repo (section 9).

## 1. Results at a glance

| Question | Answer | Samples |
|---|---|---|
| Logic steps per second | **29.97** (60 / 1.001 / 2): 0.033367 s a step. The 30-or-60 question is closed | 5,701 steps in 190.19 s, three battles |
| Is a charge countdown halved? | **No: it falls the full tick, 95 a step at Normal.** The charging flag `Chr+0xd65` stayed 0 during every countdown | 7 countdowns, 6 completed |
| Does an effect animation stop the gauges? | **No** for Attack, Fire and the monster casts seen. Only the Wait flag stopped them | 552 steps with an action executing, 719 with Wait |
| Recovery after a command | `cost_atb x 10000 / (AGI + 1)`, exact; a spell leaves 0 | 3 girls' Attacks, 4 monster values, 3 spells |
| Opening gauge, opening trim, preemptive strike | `((draw & 63) + 32) x full / 128`; trim `floor(2 x smallest / 3)`; preemptive: girls 0 | 13 of 13; 9 counters; 1 battle |
| Delay | A weak Delay hit sets the counter to exactly 4,000 and closes the menu | 3 hits |
| Girls' thinking | 0 | 3 girls, 3 battles |
| Speeds | tick 95, Hasted 99, halved 47 and 49 with the hit-reaction flag | 38,927 girl rows |

## 2. How it was measured

**The sampler.** A small Python program (ctypes, no add-ons) that opens the running game with `PROCESS_QUERY_LIMITED_INFORMATION` and
`PROCESS_VM_READ` and nothing else: it cannot write, suspend, inject or attach a debugger, and none of those calls is even
declared in it. It reads the 32-bit loader's module list to find the image base (this run: 0x00860000, 0x460000 above the file's
preferred 0x00400000) and rebases every address of the live build. Then it loops, about once a millisecond (1,214,211 passes between
3,037.6 s and 4,252.2 s after it started: 1.000 ms apart on average), reads the fields below and writes a row whenever a watched
value changes. Gaps of more than 5 ms: 9, 8 and 3 inside the three battles, the largest 17.8 ms (shorter than a step); 122 over the
whole run, the largest 212 ms (outside the battles). The game process used 22 to 26 percent of one core during the battles, so the
sampler did not starve it. (The load log's system-wide CPU counter read about 100 percent all the time; its meaning was not
checked, so nothing is claimed from it.)

**What it read.** Globals (live VAs): the logic step counter `0x00df8470`; the pacer block `0x00df6430` (its field counter at +0);
the battle state block `0x00df68a0` (state at +0, end result at +3); the flags block `0x00df7814` (action executing at +1, pause
level at +2, Wait at +3); the action manager header `0x00df6f90`; the config block `0x00dffce0` (ATB mode bit, ATB speed byte).
Per character (Chr array pointer at `0x00e0ebac`, stride 0x17E0): the gauge state `Chr+0xe68`, the recovery pair `+0x9d8` /
`+0x9dc`, the carry `+0x9e0`, the four speeds `+0x9e4` to `+0x9f0`, the thinking fields `+0x9f4` to `+0x9fc`, AGI `+0x39a`, HP and MP,
the Haste, Slow and Stop bytes, the flags `+0xe66`, `+0xd65` and `+0xd98`, and in the current action record the command id (`+0xa4`)
and the countdown pair (`+0xa8` remaining, `+0xac` maximum). Rows: 38,927 for the three girls and 4,163 for the monsters.

**The play.** The Autosave slot "Bevelle - Via Infinito" (Chapter 5). The entrance lobby has no random encounters; the stairs
panel to the next floor does (the game rewrote its Autosave once at that area change). Party: Yuna, Rikku and Paine, level 99,
Mascot dressphere. Config: ATB speed Normal, ATB mode Wait (the HUD says "Active Mode" at the top command list and "Wait Mode" in
sub-menus and at the target cursor, as `re-ffx2-atb-status.md` section 2 predicts). Rikku carried Haste throughout (tick 99).
The game's settings file and the Autosave were restored byte for byte afterwards; the driver's log is in section 9.

| Battle | Sampler time | Enemy | What happened |
|---|---|---|---|
| 1 | 3,891.9 to 3,962.6 s (70.7 s) | one Iron Giant | All three girls ready 6.8 s after the start; Paine's first Attack killed it |
| 2 | 4,038.3 to 4,117.2 s (78.9 s) | two monsters (slots 15 and 16; names not recorded) | Paine's Fire killed slot 15, Rikku's Attack slot 16 |
| 3 | 4,157.1 to 4,197.8 s (40.7 s) | one Iron Giant | A preemptive strike; Yuna's Attack killed it |

## 3. The logic rate

* The step counter (`0x00df8470`) rose 5,701 times in 190.19 s over the three battles: runs of 2,118 steps in 70.67 s (29.970 a
  second, rms error 0.66 ms), 2,363 in 78.82 s (29.985, rms 8.1 ms: the run with the long frame below) and 1,220 in 40.71 s
  (29.970, rms 0.74 ms). Together 29.975 a second. In the 188 full one-second bins: 180 hold exactly 30 steps, 6 hold 29, 2 hold 31.
* The pacer's field counter rose by **exactly 2 per step** in each run (4,236 for 2,118 steps; 4,726 for 2,363; 2,440 for 1,220),
  at 59.94 to 59.96 fields a second. So the pacer plans one step per two fields (the nominal design) and the PC build's fields run at
  59.94 a second: 60 / 1.001 / 2 = 29.97003 steps a second. The fits (29.970, 29.985, 29.970) bracket it.
* Gaps between consecutive single steps: median 33.02 ms, mean 33.37 ms; 5,678 of 5,697 lie in 28 to 40 ms. A 60-a-second clock would
  put them near 16.7 ms. The 19 others (8 of 40 ms or more, 11 of under 28 ms) are long frames and the catch-ups after them, for
  example 63 ms and then 4.6 ms at 4,087.67 s; they lose nothing over a run. No gauge skipped a decrement there: it is the step
  counter itself that stretched.
* The recovery counters agree. 36 runs of a counter falling step after step: 3,476 steps in 116.007 s. In 33 of them the fall is
  29.957 to 29.982 steps a second at the tick in force (mean 29.972); at the Normal tick that is **2,847 units a second**. The other
  three are two Rikku runs that contain halved-tick steps and one run with a long frame. A monster's full refill of 10,638 units took
  112 steps = 3.736 to 3.737 s (14 runs); one of 16,666 units took 176 steps = 5.871 to 5.872 s (4 clean runs). 112 / 29.97003 =
  3.737 s and 176 / 29.97003 = 5.873 s.

Seconds are steps x 0.033367. The earlier "every time given both ways" (30 and 60) is closed; at 30 steps a second a figure was
0.1 percent too short.

## 4. Speeds, recovery, the opening and thinking

* **Speeds.** Config Normal gave raw, awake and active 95 and tick 95 for Yuna and Paine; Rikku's Haste gave 99 (95 x 21 / 20,
  truncated). The tick showed 47 (95 halved) and 49 (99 halved) on the rows where the hit-reaction flag `Chr+0xd98` was set:
  64 rows for Yuna, 106 for Rikku, 118 for Paine, give or take a one-step lag at each edge of the flag (25 rows in all). That is
  the hit-reaction halving of `MsChrSetDecTime`, confirmed. Slow was never on.
* **Recovery value.** `cost_atb x 10000 / (AGI + 1)` was exact everywhere it could be checked. The girls' Attack (cost 70) set 18,421
  (AGI 37), 10,447 (AGI 66) and 9,459 (AGI 73). Monsters: 10,638 (cost 100, AGI 93), 16,666 (cost 100, AGI 59), 12,500 and 7,446
  (cost 70, AGI 55 and 93). A spell leaves 0: Paine's Fire (0x30a5) and the monsters' casts 0x401f and 0x41db set recovery and
  maximum 0. The overshoot stays in the counter as the note says: 10,638 - 112 x 95 = -2, 16,666 - 176 x 95 = -54; the girls' counters
  sat at -6, -52 and -71 until the next command.
* **Ready in the step the counter crosses 0.** Each girl's state went 1 (recovering) to 4 (menu open) in one step, with no thinking
  step in between: her thinking and thinking-base fields read 0 in all 17,760 in-battle rows (the thinking tick read 1 in 17,733
  of them), so thinking is 0, as predicted.
* **Opening gauge.** `((draw & 63) + 32) x full / 128` reproduced all 13 first-seen counters exactly (battle 1: Yuna, Rikku,
  Paine, Giant; battle 2: the three girls and two monsters; battle 3: the three girls and the Giant). The draws it implies
  (draw & 63): 50, 51, 63, 61 | 11, 24, 16, 43, 41 | 51, 12, 5, 62. For example the Giant at AGI 93 opened at 5,409 of 7,446 (61).
* **Opening trim.** In the step the battle starts running, `floor(2 x smallest / 3)` came off every counter, monsters included:
  battle 1 smallest 5,409, trim 3,606: Yuna 11,800 to 8,099, Rikku 6,774 to 3,069, Paine 7,020 to 3,319, Giant 5,409 to 1,708 (each
  is start - 3,606 - the first tick). Battle 2 smallest 3,547, trim 2,364: the three girls 6,188 / 4,570 / 3,547 to 3,729 / 2,107 /
  1,088, the two monsters 7,324 / 6,653 to 4,865 / 4,194. 9 counters in 2 battles, all exact.
* **Preemptive strike (battle 3).** At step 38 the 31-slot reset set the three girls to 0 and the Giant to 7,096: (113 + 9) x
  7,446 / 128 rounded down, so `draw & 15` was 9. The trim then found a smallest counter of 0 and took nothing off (the Giant's
  first running step was 7,096 to 7,001), and all three menus opened in the first running step (step 121). The ambush branch was
  not seen.

## 5. Delay hits

Three times the Iron Giant's Attack landed on Rikku (girl 1) while her menu was open (battle 1: steps 331 and 838; battle 3: step
1,087). Each time her state went 4 to 0 with the counter set to **exactly 4,000** (her maximum stayed 10,447) and her HP fell (13, 13
and 26), in the same step in which the Giant's command completed and its own recovery was set. That is the `apply_atb_damage` branch
for a character that is neither charging nor executing: 4,000 is the weak Delay amount,
and positive damage closes the menu and sends her back to IDLE. In the first two she was ready again after 48 steps (1.601 and
1.602 s). The tick was halved (99 to 49) for 14 and 15 of those 48 steps, which is what makes 48: 14 x 49 + 34 x 99 = 4,052, where
an unhalved count is 41. The third was cut off by the end of the battle after 7 steps. The command that carried the Delay was not
recorded, and "weak" is inferred from the amount.

## 6. Charge countdowns and what follows

All seven countdowns the sampler saw ran at the **full tick**: every one of their decrements was 95. The charging flag `Chr+0xd65`
stayed 0 for all of them.

| Who | Command | AGI | cost_cast | Maximum (units) | Steps at 95 | Steps if halved (47) | Left at the end | Seconds |
|---|---|---|---|---|---|---|---|---|
| Paine | Fire 0x30a5 | 73 | 70 | 9,459 | 100 | 202 | -41 | 3.34 |
| Slot 15 (x4 completed) | 0x401f | 55 | 100 | 17,857 | 188 | 380 | -3 | 6.27 |
| Slot 15 (5th; it stopped when Paine's Fire killed the monster) | 0x401f | 55 | 100 | 17,857 | 111 seen | | | |
| Slot 16 | 0x41db | 59 | 20 | 3,333 | 36 | 71 | -87 | 1.20 |

(The monsters' first decrement came before the sampler saw the maximum, so 187 and 35 decrements were logged for 188 and 36 steps; the
leftover -3 and -87 confirm the counts: 17,857 - 188 x 95 = -3, 3,333 - 36 x 95 = -87.) The step counts are `ceil(maximum / 95)`.
The kernel's rule "the tick is halved while charging" is therefore a statement about the function, not about play: the function
does halve when `Chr+0xd65` is set, and the flag stayed 0 through every countdown.

**When the flag does come on.** For slot 15 only, in each of its 4 completed casts: 20 steps after the count reached 0 (40 in the third
cast, whose count ended while slot 16's effect was still playing), for 69 steps (2.30 s), and the tick showed 47 for those steps. Nothing
used it: the monster was executing (state 9), its recovery counter stood at -75 or 0 and its countdown was finished. Paine's Fire and
slot 16's cast never set it. What sets the flag stays with the motion system (open question 4 of the ATB note).

**Release.** In Paine's Fire the count reached 0 at step 1,983 (100 steps after the choice at step 1,883). In that same step her MP was
paid (852 to 848), the action-executing flag rose, and the effect began; it played for **75 steps (2.50 s)**; at step 2,058 the
command completed with recovery 0 and maximum 0, and at step 2,059 her menu was open again. The whole command took 175 steps =
5.84 s. The action-executing flag also rose in the step the count reached 0 for slot 15's casts 1, 2 and 4 and for slot 16's cast; the
third cast of slot 15 ended its count while slot 16's effect was already playing. Effect lengths, from the end of the count to the end
of the command: slot 15 94, 94, 114 and 94 steps (3.14, 3.14, 3.80 and 3.14 s); slot 16 84 steps (2.80 s). `Chr+0xe66` (called the
charging flag in section 5 of the ATB note) was 1 from the choice to the end of **every** command, plain Attacks included (their
countdown pair stayed 0 / 0), so it means "a command is in flight"; the Delay rule's extra test (a non-zero maximum) is what makes it
a charge test.

## 7. The clock during effects, and Wait

* The action-executing flag (VA `0x00df7815`) was 1 in five runs, all in battle 2: 95, 95, 192, 95 and 76 steps (slot 15's casts 1, 2
  and 4, slot 16's cast followed by slot 15's third, and Paine's Fire), 552 steps by the per-step count. Plain Attacks never raised
  it: Paine's, Rikku's and Yuna's, and the monsters' ordinary Attacks. No gauge and no countdown stopped for it:
  * during Paine's 75-step Fire effect, slot 16's recovery counter fell 75 times by 95 each (7,261 to 136);
  * slot 15's 188-step countdown of its third cast ran 77 steps through slot 16's 84-step effect, 187 decrements of 95 with no gap;
  * a monster's recovery counter was falling on 374 of the 546 effect steps with Wait clear (on the other 172 no recovery counter was
    running to watch), and on none of them did a running counter stand still.
  Everything in the clock gate that the ATB note reads as stopping the gauges while an effect plays (`exec` = 1) therefore did not
  happen for these commands, so `exec` stayed 0 for Attack, Fire and the monster casts seen. The party's own gauges went through
  the same loop and the same global gate; they were all waiting for input while these effects played, so that is an inference.
* The Wait flag stopped everything: 731 rows, 719 steps. A counter moved on none of them except the step in which the flag came on.
  Example: slot 16's counter froze for 22 steps (4,111.80 to 4,112.57 s) while Rikku's Attack was being chosen. The girls' recovery
  decrements while Wait or a pause flag was non-zero: 0 of 338. The step counter itself kept running through Wait, so the rate in
  section 3 is not a count of unpaused time.
* Not measured: whether any command raises `exec` to 1 or 2, a girl's gauge during a monster's effect, the status clocks.

## 8. Also seen

* **Command lengths.** From the choice to the completion: Paine's Attack 59 steps (1.97 s), Yuna's 41 (1.37 s), Rikku's 17 (0.57 s);
  all three killed the last enemy, so the last two may be cut by the victory. The Iron Giant's Attack (0x4047, cost 100, AGI 93): its
  counter fell 112 steps, then 57 steps (1.902 to 1.904 s) passed until its next recovery was set, in 14 of 14 cycles; so one cycle is 169
  steps = 5.639 s. After its 176-step recovery the other monster (0x4000) took 15 to 26 steps before its next recovery was set (3 cycles).
* **Rikku's Haste** held the whole time, and her recoveries counted at 99 (2,967 units a second).
* **The pacer's field counter outside the battles** is not a clean clock: it was reset downward twice (-453 at 3,966.4 s and -3,181 at
  4,143.8 s, both between battles) and jumped up by 26 once, which is why an earlier table printed a whole-run average of 64.18 units a
  second. Inside the battles it is the clean 59.94 of section 3.

## 9. What this corrects, and what is still open

**Corrected by this measurement** (the notes are updated where marked):

* `re-ffx2-atb-status.md` section 1 and every "@30 / @60" figure: the rate is 29.97; updated in that note.
* The same note's section 3.1, 3.5, 7 and 8 rows 7 to 9: "the tick is halved while charging" does not happen in play (flag 0); updated.
* The same note's section 2, 5 and 9: an effect animation does not stop the gauges for the commands seen; updated.
* `re-ffx2-ai-leblanc-den-ixion.md` finding 10, 1.10, E1 and the goon's "twice as long" charge: updated.
* Still carrying the old statements and not touched by this lane (line numbers as of the commit that adds this note):
  `re-ffx2-ai-bahamut-vegnagun.md` (main finding 2, the notation paragraph, 1.1, 2.2 and section 9: "30 or 60", "halved while charging",
  "any action executing freezes it"), `re-ffx2-ai-fallen-trema.md` (lines 50, 86, 428 to 437, 543 and 617: both rates, and "every
  party action that executes adds to the real time"), `re-ffx2-dressphere.md` (lines 398 and 452: the rapid-shot window at "30 or 60"),
  `docs/plans/re-parity-review.md` (the W4 row, line 120: "the real-seconds conversion waits for the 30-or-60 lane"), and the kernel's
  `STEPS_PER_SECOND_CANDIDATES` ([30, 60]) with the docblocks in `atb-clock.ts`, `atb.ts` and `status-timers.ts`. The kernel
  arithmetic needs no change; pass 60 / 1.001 / 2 to `stepsToSeconds`. The kernel tests keep their 30 and 60 examples (they check
  arithmetic, not the rate).

**Still open**

1. A girl's full refill after an Attack: every Attack ended its battle, so the counters were set to the exact values (18,421, 10,447,
   9,459) but never counted down. The formula and the clock are confirmed separately; the combination was not clocked.
2. `exec`: which commands, if any, raise the command check's first output (stop the clock) or its second (hold an action). The sampler
   read the action manager's count, not the function's outputs.
3. Mega Flare's damage at Bahamut (the table says power 14, our engine 24; `re-ffx2-ai-bahamut-vegnagun.md` section 2.3): the drive never
   reached that fight and this lane measured timing only.
4. The status clocks (Sleep, Haste, Poison and the rest), the Slow and Fast settings, Slow on a character, a pure Active mode and the
   ambush branch were not exercised.
5. What sets `Chr+0xd65`: seen on a monster during a cast animation, never during a countdown, never on the girl.

**Where the data is.** `D:\Tools\ffx-hd\observe\2026-10-09-ffx2-timing\` (outside the repo, local only): `sampler.py`, the analysis scripts,
`run2\` (samples.csv, monsters.csv, the derived CSVs, `tables.md`, `extra.md`, `gates.txt`, `analysis2.json`) and `drive\log.md`
(the agent's log of keys, clock times, the settings file and save handling).
