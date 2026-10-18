# Re-parity RC10 X2-A, slice A (row XA6): FFX-2 action time per command, behind `ACTION_TIME_PER_COMMAND` (OFF)

Status: **built, tested, measured and committed on branch `re-parity-rc10-x2-action-time` (from `origin/re-parity-rc9-x2-hit-reaction-r52`, `7a1c0cb28`, the r53 base); pushed; not merged, not deployed; the switch is OFF** (written 2026-10-18). Tip: the commit that adds this note.
**Game case: FFX-2 only** (AGENTS.md rule 14), and why: FFX is CTB; it has no per-actor motion machines, no effect modules and no action-executing flag (note FFX2-G11 line 3). Nothing here touches an FFX file; `ffx-engine-golden` and `ff7-golden` run unchanged and green.
Sources: note `FFX2-G11` (sections 2, 3, 6, 7) and `FFX2-G01` (sections 8 and 9) in `D:\Tools\ffx-parity\coverage\ffx2\`; the live stopwatch session of 2026-10-09 (`research/re-ffx2-timing-measured.md`, three effect lengths); the game's own frame tables and motion macros, read as numbers.
Authority: Bailey, 2026-10-08 "It needs to be a 1:1 parity."; 2026-10-18 "keep going full speed". The house rule for a change that moves how a whole game plays: **build it behind a switch defaulted OFF, measure it, then ask Bailey once.** This lane built and measured; it did not turn the switch on. **No boss number and no party number was changed or added.** No random number is drawn by anything in this slice. The game was not run.
Paper preflight (critic-plan class DEEP): `docs/plans/re-parity-rc10-x2-action-time-review.md`, committed first.

| Commit | What |
|---|---|
| `33a627c9f` | the paper preflight |
| `bad512a4d` | data: clip lengths, motion-type bits, run numbers and command classes (`src/data/ffx2/action-frames.ts`, numbers only, generated) |
| `3fba9b990` | kernel: the span of one command (`src/battle/ffx2/kernel/action-span.ts`, pure) |
| `7b1bd9f63` | wiring: `finishAction` asks the span behind `ACTION_TIME_PER_COMMAND` (`src/battle/ffx2/action-span.ts`, `action-time.ts`, `execute.ts`; `reaction.ts` exports `ratioOf`) |
| `e6c4d713a` | tests: hand checks, switch-off digests against the base, the measurement test |
| later commits | the measurement knobs (run-up distance, a monster's hit time, effect scale), the Slow / Haste / Stop test, this note |

`engine-core.ts` and `internal.ts` (399 lines each on this base) are not touched; no file went over 400 lines (`action-span.ts` 213, `kernel/action-span.ts` 146, `action-frames.ts` 226, `execute.ts` 347). No contract file changed shape, so no CONTRACT-CHANGES entry.

## 0. In one paragraph (player words)

Today most FFX-2 fights give a command no time at all: the girl or the boss acts, and its gauge starts refilling the same instant (six fights give every command a flat three seconds instead). In the real game a command holds its user for as long as its animation plays: a girl's Attack is the wait for her idle pose to break, the run to the enemy and the swing up to the hit (about two seconds); a spell, an item or a special is the effect from the moment it is released to its end (Fire was measured at 2.5 s); a boss's cast is three to four and a half seconds, and its plain Attack runs from half a second (Nooj) to six (the Paragon) by its body. This slice makes every command hold its actor for that long, from the game's own animation tables, behind `ACTION_TIME_PER_COMMAND`, **OFF**. With it off every FFX-2 battle is byte for byte what it was (288 of 288 chain-plays compared with the base commit). **With it ON the party wins more in most chapters that move and loses a lot of one** (section 4): because a boss's cast holds the boss longer than a girl's action holds her, the bosses get fewer turns between the girls' turns, except where a boss's plain Attack is short and the girls' spells are not (Den of Woe at the Wait pace). Only three effect lengths are measured; every other is a labelled estimate, and the sensitivity arms show how much the answer leans on them.

## 1. What the span is made of

Game case: **FFX-2 only** (FFX is CTB; it has no per-actor motion machines, no effect modules and no action-executing flag). The span is how many logic steps (29.97 a second) a command keeps its actor EXECUTING after it resolves, through the existing countdown (`execute.ts#finishAction`, `gauge.executing`; the other units' gauges run meanwhile; the actor's recovery starts when it ends).

| Command kind (the row's sequence class, note FFX2-G01 section 8.2) | Span in steps | Per body? |
|---|---|---|
| **Physical** (classes 1, 0xD to 0x14, 0x1D, 0x25, 0x26, 0x2B: Attack, the guns, Steal, the physical specials) | idle break + run-up + the `attack_00` clip up to the hit | idle clip, run speed, start distance and attack clip are the body's |
| **Charge kind** (classes 2 to 4, 0x15 to 0x1C, 0x1F to 0x24, 0x29, 0x2C to 0x2F: spells, skills, items, specials, No Love Lost) | the effect module's length from the release; plus, for a girl's command with no countdown (cost 0), her idle break and cast-start clip; plus a monster's idle break when its motion type carries a start-wait bit | the effect is per effect id (3 measured, class defaults for the rest), not per body |
| **Nothing** (Defend, Escape, Wait-class, resident magic, the Sandals, a refused item, class 0 menu stubs) | 0 | |

Rules (all in `kernel/action-span.ts`; the game's stages are in note FFX2-G11 section 2):
1. A physical command completes at its LAST HIT, not when its follow-through and return clips end (those only hold the next command's start); so the clip is `attack_00` (the macro waits "until the attack lands").
2. A girl's tag script always begins by waiting for the idle clip's break; a monster only when its motion type has `idle_wait` or `energy_attack` (physical), `chant_start_wait` or `idle_wait` (charge kinds), or, for class 0x1F, `magic_throw_wait` at the start gate.
3. The idle break is an EXPECTATION: half the idle clip (the phase is a script random pick; no draw is made, so every random stream stays where it was).
4. The run-up applies to the bodies with a run bit (every girl job but Yuna's Special body, and the monsters whose motion type has `attack_run_00_01` / `attack_run_01`) and to the classes with a return; it is `ceil((D - start distance) / run speed x 29.97)` steps with D = 52.4 field units.
5. Haste (ratio 2.0) halves every clip term (idle break, run-up, attack, cast-start). It is NOT applied to the effect length. Slow slows only the stance loops, so it doubles only the idle break. Stop and Petrify owe 0.
6. Precedence of switches: an engine option wins; then with `ACTION_TIME_PER_COMMAND` ON the span (a formation's flat 3 s is superseded); then the formation's flat time; then the global flat estimate.

## 2. Where every number comes from, and what is an estimate

| What | Value | Source | Label |
|---|---|---|---|
| Clip lengths (`idle1`, `attack1_00`, `magic2_00`, `skill_00`, `item_00`) of 54 girl and 36 monster motion sets | frames, one frame = one step at ratio 1.0 | the game's frame tables, FFX2-G01 section 8.3 (agree with the banks' own programs: 145 of 145 monster and 51 of 51 girl sets checked) | READ |
| Motion-type bits, run speed, attack-start distance of each monster body; the three girls' run speed (40 / 44 / 38) and start distance (15 / 5 / 15) | bits, field units | the monsters' and girls' motion macros, FFX2-G01 sections 8.4 to 8.6 | READ |
| Which girl job blocks run | all but Yuna's Special body (slot 15, motion type 0x10) | FFX2-G01 section 8.4 | READ |
| Each command row's sequence class and effect id (488 rows) | class byte at +0x0C, first effect id | the game's command and monster-command tables | READ |
| Release-to-completion of three effects | Fire (effect 76) 75 steps; Umbral Gaze (effect 176) 94, 94, 94 steps; Strength Up (effect 368) 84 steps | the live stopwatch session of 2026-10-09 (FFX2-G11 section 2.3, H01 section 5.3) | MEASURED (one body each) |
| Every other effect's length | 75 for a girl's command, 94 for an enemy's | the nearest measured class (Fire for the girls; the monsters' median of five) | **ESTIMATE** |
| The run-up | `ceil((52.4 - start distance) / run speed x 29.97)` steps; 52.4 field units | the median girl-to-nearest-monster distance over FFX2-G07's 35 scenes; the macro's speed read as units a second, no acceleration ramp, no turning | **ESTIMATE** (a lower bound) |
| The idle break before a command | half the idle clip | the phase of the idle clip when the command starts is a script random pick; the expectation keeps every random stream where it was | **ESTIMATE** |
| A monster's hit time inside `attack_00` | the end of the clip | the macro waits "until the attack lands"; most monster `attack_00` clips carry no hit signal (FFX2-G01 8.7), so the clip's end is an upper bound on the hit | **ESTIMATE** (sensitivity arms below) |
| Whether Haste shortens an effect module | no (the effect is left unscaled) | nothing says it does (FFX2-G11 2.2 item 3) | **UNKNOWN**, left unscaled |
| Hand check against the live attack lengths | Yuna 41, Paine 59, Rikku 17 (cut short) steps, choice to completion, dressphere not recorded | the model gives Yuna 61, Rikku 53, Paine 58 if all three wore the Mascot; Paine agrees, Yuna is 20 steps (0.7 s) long | consistency check, not a calibration |

Nothing is tuned. No boss or party number changed. The generator is `D:\Tools\ffx-parity\coverage\ffx2\FFX2-G11\gen_action_frames.py`; it reads the game's extracted tables on Bailey's PC and writes `src/data/ffx2/action-frames.ts`, so the repo holds numbers only.

## 3. Proofs

| Proof | What | Result |
|---|---|---|
| Hand checks | `tests/unit/ffx2-action-span.test.ts` (23 tests): the kernel's terms by hand, three girls (Yuna 61, Rikku 53 and Hasted 27, Paine 58) and three bosses (Bahamut 43, Leblanc 17, Trema 66), the casts (Fire 75; Bahamut's special 117; No Love Lost 108), Haste, Slow, Stop, the precedence of the switches, the engine's countdown (the enemy's later turns start later with the switch on) | all pass |
| Switch off is the base | the SHIPPED strategy plays every FFX-2 chapter's whole chain (12 chapters, seeds 1 to 12, bench and human pace; 288 chain-plays) on the base commit `7a1c0cb28` (a `git archive` export) and on this tree; one SHA-1 of every link's whole event log | **288 of 288 identical** (non-trivial: wins and losses both present). 60 of the digests are pinned in `tests/fixtures/parity/ffx2/action_span_off.json` and checked by `ffx2-action-span-off.test.ts` |
| Goldens | `ffx2-atb-golden` (6), `ffx-engine-golden` (18), `ff7-golden` (3), `ffx2-hit-reaction-wiring` (17), `fallen-aeons-action-time` (5), `parity-ffx2-stat-setter-engine` (32) | all pass, unchanged |
| Types, orphans | `tsc --noEmit` clean; `node tools/orphans.mjs` lists neither new module | clean |
| Mutation pass | 16 deliberate faults applied one at a time to a copy of the tree (Haste scaling the effect; the idle break a whole clip, then rounded down; a girl not waiting; every class running; the run-up rounded down; Slow read on the wrong clip; No Love Lost dropped from the casts; a monster always waiting; the two effect defaults swapped; an engine option losing to the span; the switch off still computing spans; the played command dropped at the wiring; the formation test inverted; a girl with a countdown adding the cast-start clip; one wrong clip in the data) | **16 of 16 caught** by the unit file |

## 4. Measurement: the switch ON against the switch OFF, three paces, 500 seeds; ablation; sensitivity

### 4.0 Method

The SHIPPED `intendedStrategy` plays each chapter's whole chain through the app's own path (`registerBattleContent`, `setupForChapter`, `setupForNextLink`, minigames auto-resolved) on seeds 1 to 500 (`tests/unit/ffx2-action-span-measure.test.ts`, `tests/unit/helpers/ffx2ChainPlay.ts`), with the switch OFF (`base`: the engine of the base commit, proved byte for byte) and ON (`on`), at three paces: **human** = the default Wait with its split (1.5 s a menu, 0.5 s on the top list with the clock running, the rest inside a submenu with the clock held); **Active** = Active ATB, 1.5 s a menu with the clock running; **bench** = zero decision time (what the goldens use). The decision times are authored measurement inputs, not game data. The eleven distinct FFX-2 chapters run; `exp-leblanc` is an exact duplicate of Chapter VI (the hit-reaction lane's rows were identical at two paces) and is not run. **Measure, never tune**: no boss or party number moved.

Arms: `base` (OFF); `on` (ON; a formation's flat 3 s is superseded); `on-keep` (ON; a formation's flat 3 s kept: for the six chains that carry it **this is the base itself**, because every link of those chains carries the flat, so the rows are identical to `base` and the arm only shows that); `phys` and `cast` (ON with only the physical spans / only the charge-kind spans; a formation's flat 3 s is gone in both, so for the six flat-time chains read them against `none`, ON with both parts off, i.e. no action time at all); and the sensitivity arms `on-norun` / `on-far` (the run-up distance taken to 0 / doubled), `on-hit` (a monster's hit at the macro's normal-attack-frames estimate when later than its clip), `on-hit-half` (half its clip), `on-fx80` / `on-fx125` (every effect length x0.8 / x1.25).

Columns: "wins" is whole-chain first-try wins of 500; "W->L / L->W" counts seeds that went from a win to a loss and the reverse (two-sided sign test p); "mean span" is the mean steps the per-command rule gave the actions of a side, in seconds; "party / enemy actions" are actions finished per seed.

**For the six chains with a flat 3 s (IX, X, XIII, XIV, XV, XVI) the baseline is already the flat 3 s on every command**, so their "base -> on" rows are the flat time giving way to the per-command span; for the other five (IV, V, VI, XI, XII) the baseline is no action time at all.

### 4.1 The tables

Generated by `D:\Tools\ffx-parity\rc10\x2-action-time\analyze.mjs` from the result files in that folder (one JSON file per chapter, pace, arm and seed range).

#### human: whole-chain first-try wins, switch off (base) -> on, 500 seeds unless noted

| Chapter | wins base -> on | change | seeds W->L / L->W (p) | KOs/seed | minutes/seed | party actions/seed | enemy actions/seed | mean span party action (s) | mean span enemy action (s) |
|---|---|---|---|---|---|---|---|---|---|
| IV Bahamut | 500 -> 500 | +0 | 0 / 0 (p=1.000) | 0.0 -> 0.0 | 1.3 -> 1.9 | 43.9 -> 43.9 | 13.3 -> 15.0 | 2.48 | 2.51 |
| V Vegnagun+Shuyin | 463 -> 489 | +26 | 5 / 31 (p=0.000) ** | 1.7 -> 1.1 | 4.1 -> 5.2 | 102.6 -> 103.4 | 73.3 -> 61.7 | 2.14 | 3.46 |
| VI Leblanc | 500 -> 500 | +0 | 0 / 0 (p=1.000) | 1.4 -> 1.7 | 2.7 -> 3.7 | 84.9 -> 83.4 | 36.7 -> 42.0 | 2.11 | 1.79 |
| IX Fallen Aeons | 498 -> 500 | +2 | 0 / 2 (p=0.500) | 0.1 -> 0.1 | 2.5 -> 2.3 | 50.8 -> 49.1 | 29.2 -> 25.1 | 2.31 | 3.26 |
| X Trema | 288 -> 378 | +90 | 58 / 148 (p=0.000) ** | 1.7 -> 1.5 | 8.3 -> 9.9 | 152.4 -> 193.1 | 113.6 -> 154.2 | 2.39 | 2.51 |
| XII Den of Woe | 498 -> 371 | -127 | 128 / 1 (p=0.000) ** | 0.6 -> 1.2 | 1.3 -> 1.6 | 34.6 -> 29.9 | 18.9 -> 14.9 | 2.49 | 2.21 |
| XIII Ixion | 500 -> 500 | +0 | 0 / 0 (p=1.000) | 0.0 -> 0.0 | 1.4 -> 1.3 | 28.6 -> 28.3 | 12.1 -> 11.7 | 2.47 | 2.61 |
| XI Experiment | 235 -> 244 | +9 | 4 / 13 (p=0.049) ** | 2.0 -> 1.8 | 1.0 -> 1.4 | 25.8 -> 25.4 | 9.2 -> 9.8 | 2.37 | 1.69 |
| XIV Tourist Trap | 423 -> 483 | +60 | 9 / 69 (p=0.000) ** | 0.8 -> 0.2 | 2.4 -> 2.1 | 46.2 -> 47.6 | 29.0 -> 23.8 | 2.46 | 2.94 |
| XV Valefor | 500 -> 500 | +0 | 0 / 0 (p=1.000) | 0.2 -> 0.1 | 1.8 -> 1.7 | 38.6 -> 39.1 | 14.3 -> 12.0 | 2.37 | 3.63 |
| XVI Angra Mainyu | 383 -> 490 | +107 | 7 / 114 (p=0.000) ** | 4.1 -> 1.0 | 8.3 -> 6.7 | 172.3 -> 157.1 | 115.1 -> 71.4 | 2.43 | 4.50 |

#### active: whole-chain first-try wins, switch off (base) -> on, 500 seeds unless noted

| Chapter | wins base -> on | change | seeds W->L / L->W (p) | KOs/seed | minutes/seed | party actions/seed | enemy actions/seed | mean span party action (s) | mean span enemy action (s) |
|---|---|---|---|---|---|---|---|---|---|
| IV Bahamut | 500 -> 500 | +0 | 0 / 0 (p=1.000) | 0.0 -> 0.0 | 1.7 -> 2.3 | 44.8 -> 45.5 | 16.7 -> 17.6 | 2.50 | 2.65 |
| V Vegnagun+Shuyin | 417 -> 468 | +51 | 16 / 67 (p=0.000) ** | 2.6 -> 1.5 | 5.0 -> 6.2 | 98.3 -> 103.8 | 90.1 -> 74.1 | 2.15 | 3.52 |
| VI Leblanc | 472 -> 500 | +28 | 0 / 28 (p=0.000) ** | 2.6 -> 2.1 | 4.0 -> 4.8 | 94.0 -> 90.2 | 65.3 -> 60.2 | 2.16 | 1.81 |
| IX Fallen Aeons | 497 -> 500 | +3 | 0 / 3 (p=0.250) | 0.2 -> 0.1 | 3.2 -> 2.9 | 56.1 -> 54.8 | 37.3 -> 32.8 | 2.28 | 3.28 |
| X Trema | 167 -> 337 | +170 | 40 / 210 (p=0.000) ** | 2.3 -> 1.9 | 6.7 -> 11.2 | 105.9 -> 185.4 | 89.8 -> 172.3 | 2.39 | 2.49 |
| XII Den of Woe | 452 -> 488 | +36 | 12 / 48 (p=0.000) ** | 1.3 -> 0.5 | 1.7 -> 1.9 | 36.1 -> 31.8 | 27.0 -> 18.2 | 2.49 | 2.19 |
| XIII Ixion | 499 -> 500 | +1 | 0 / 1 (p=1.000) | 0.1 -> 0.0 | 1.6 -> 1.6 | 29.5 -> 29.6 | 14.5 -> 14.9 | 2.48 | 2.58 |
| XI Experiment | 228 -> 224 | -4 | 13 / 9 (p=0.523) | 2.2 -> 2.2 | 1.3 -> 1.7 | 25.2 -> 25.0 | 11.1 -> 11.8 | 2.40 | 1.67 |
| XIV Tourist Trap | 339 -> 466 | +127 | 14 / 141 (p=0.000) ** | 1.4 -> 0.4 | 2.9 -> 2.7 | 46.9 -> 50.1 | 36.1 -> 29.6 | 2.47 | 2.94 |
| XV Valefor | (not run: on missing) | | | | | | | | |
| XVI Angra Mainyu | (not run: base missing: on missing) | | | | | | | | |

#### bench: whole-chain first-try wins, switch off (base) -> on, 500 seeds unless noted

| Chapter | wins base -> on | change | seeds W->L / L->W (p) | KOs/seed | minutes/seed | party actions/seed | enemy actions/seed | mean span party action (s) | mean span enemy action (s) |
|---|---|---|---|---|---|---|---|---|---|
| IV Bahamut | (not run: base missing: on missing) | | | | | | | | |
| V Vegnagun+Shuyin | (not run: base missing: on missing) | | | | | | | | |
| VI Leblanc | (not run: base missing: on missing) | | | | | | | | |
| IX Fallen Aeons | (not run: base missing: on missing) | | | | | | | | |
| X Trema | (not run: base missing: on missing) | | | | | | | | |
| XII Den of Woe | (not run: base missing: on missing) | | | | | | | | |
| XIII Ixion | (not run: base missing: on missing) | | | | | | | | |
| XI Experiment | (not run: base missing: on missing) | | | | | | | | |
| XIV Tourist Trap | (not run: base missing: on missing) | | | | | | | | |
| XV Valefor | (not run: base missing: on missing) | | | | | | | | |
| XVI Angra Mainyu | (not run: base missing: on missing) | | | | | | | | |

#### human: the formation flat time kept (on-keep) against superseded (on), 500 seeds

| Chapter | base | on (span replaces the flat 3 s) | on-keep (flat 3 s kept) | on vs on-keep W->L / L->W (p) |
|---|---|---|---|---|
| IX Fallen Aeons | 498 | 500 | 498 | 0 / 2 (p=0.500) |
| X Trema | 288 | 378 | 288 | 58 / 148 (p=0.000) |
| XIII Ixion | 500 | 500 | 500 | 0 / 0 (p=1.000) |
| XIV Tourist Trap | 423 | 483 | 423 | 9 / 69 (p=0.000) |
| XV Valefor | 500 | 500 | 500 | 0 / 0 (p=1.000) |
| XVI Angra Mainyu | 383 | 490 | 383 | 7 / 114 (p=0.000) |

#### active: on-keep, 500 seeds

| Chapter | base | on | on-keep |
|---|---|---|---|
| IX Fallen Aeons | 497 | 500 | - |
| X Trema | 167 | 337 | - |
| XIII Ixion | 499 | 500 | - |
| XIV Tourist Trap | 339 | 466 | - |
| XV Valefor | 500 | - | - |
| XVI Angra Mainyu | - | - | - |

#### Ablation: 200 seeds, human pace, whole-chain wins (the first 200 seeds), one part at a time

| Chapter | base | physical spans only | cast spans only | both (on) |
|---|---|---|---|---|
| IV Bahamut | 200 | 200 | 200 | 200 |
| V Vegnagun+Shuyin | 184 | 179 | 198 | 197 |
| VI Leblanc | 200 | 200 | 200 | 200 |
| IX Fallen Aeons | 198 | 172 | 200 | 200 |
| X Trema | 114 | 60 | 3 | 158 |
| XII Den of Woe | 199 | 200 | 186 | 146 |
| XIII Ixion | 200 | 200 | 200 | 200 |
| XI Experiment | 88 | 84 | 92 | 93 |
| XIV Tourist Trap | 170 | 155 | 195 | 194 |
| XV Valefor | 200 | 200 | 200 | 200 |
| XVI Angra Mainyu | 142 | 171 | 196 | 196 |

Ablation, party KOs / minutes per seed (first-200 arms run on their own; base and on are the 500-seed rows, per seed):

| Chapter | base | physical only | cast only | on |
|---|---|---|---|---|
| IV Bahamut | 0.0 KO, 1.3 min | 0.0 KO, 1.3 min | 0.0 KO, 1.9 min | 0.0 KO, 1.9 min |
| V Vegnagun+Shuyin | 1.7 KO, 4.1 min | 1.7 KO, 4.2 min | 1.3 KO, 5.0 min | 1.1 KO, 5.2 min |
| VI Leblanc | 1.4 KO, 2.7 min | 1.7 KO, 3.2 min | 1.5 KO, 3.2 min | 1.7 KO, 3.7 min |
| IX Fallen Aeons | 0.1 KO, 2.5 min | 0.9 KO, 1.7 min | 0.1 KO, 2.4 min | 0.1 KO, 2.3 min |
| X Trema | 1.7 KO, 8.3 min | 2.4 KO, 3.8 min | 5.5 KO, 4.9 min | 1.5 KO, 9.9 min |
| XII Den of Woe | 0.6 KO, 1.3 min | 0.5 KO, 1.2 min | 0.5 KO, 1.6 min | 1.2 KO, 1.6 min |
| XIII Ixion | 0.0 KO, 1.4 min | 0.0 KO, 1.0 min | 0.0 KO, 1.3 min | 0.0 KO, 1.3 min |
| XI Experiment | 2.0 KO, 1.0 min | 2.0 KO, 1.0 min | 1.9 KO, 1.4 min | 1.8 KO, 1.4 min |
| XIV Tourist Trap | 0.8 KO, 2.4 min | 1.1 KO, 1.7 min | 0.2 KO, 2.1 min | 0.2 KO, 2.1 min |
| XV Valefor | 0.2 KO, 1.8 min | 0.0 KO, 1.2 min | 0.2 KO, 1.5 min | 0.1 KO, 1.7 min |
| XVI Angra Mainyu | 4.1 KO, 8.3 min | 3.5 KO, 5.1 min | 0.9 KO, 6.6 min | 1.0 KO, 6.7 min |

### 4.2 What moved, and why, in player words

**In general.** A girl's action holds her 2.1 to 2.5 seconds (her Attack 1.9 to 2.1 s, a spell, an item or a special 2.5 s, which is Fire's measured 75 steps); a boss's holds it 1.7 to 4.5 s, by body and by command: a cast is the 94-step estimate and, for a body that waits for an idle pose before it starts, up to two seconds more; a plain Attack is the idle wait, the run and the swing. So where a boss's actions are longer than a girl's, the girls get relatively more turns, and where they are shorter, fewer. The two sides are slowed together and the fights run longer (Bahamut 1.3 to 1.9 minutes at the human pace, Leblanc 2.7 to 3.7); what changes the odds is the difference between the two sides' spans.

- **V Vegnagun and Shuyin: 463 -> 489 (human), 417 -> 468 (Active), p below 0.001.** The parts' casts hold them 3.5 s each (the 94-step estimate plus the idle pose the part waits for) against 2.1 s for a girl: the enemy acts 73 -> 62 times a fight, the girls are knocked out 1.7 -> 1.1 times. Ablation: the cast spans alone give it (198 of 200 against 184); the physical spans alone cost 5.
- **X Trema: 288 -> 378 (human), 167 -> 337 (Active), p below 0.001.** Both links already carry the flat 3 s. Trema's three moves are class 1 attacks that take 2.2 s and a girl's action 2.4 s, so each side gets about 0.6 s back per action; and the Paragon's plain Attack, whose swing clip is 138 frames, holds it 5.9 s (the clip's end taken as the hit): the Paragon strikes far less often. Diagnostic on 100 seeds, human: link 1 (the Paragon) 59 -> 87 wins, girls knocked out 1.28 -> 0.43 a fight; link 2 (Trema) 51 of 59 -> 76 of 87 reaching it. **This is the chapter most exposed to the "clip is the hit time" reading** (see the `on-hit-half` row).
- **XII Den of Woe: 498 -> 371 at the human pace (128 seeds lost, 1 gained, p below 0.001) but 452 -> 488 at Active.** The baseline has no action time. All of the loss is Nooj's link (diagnostic, 100 seeds, human: link 3 99 -> 71 wins; the party takes 16,254 -> 18,934 damage a fight, 0.69 -> 1.26 girls knocked out, and acts 16.5 -> 13.6 times against Nooj's 9.9 -> 7.9). Nooj's plain Attack is a 16-frame swing and holds him **0.5 s**; the girls' Darkness, Cura and Protect hold them 2.5 s. At the Wait pace the girls' menu time is held and costs nothing, so in the base the girls were acting almost for free; with action time each spell now costs her 2.5 s of which the clock runs free while Nooj needs half a second. Ablation: neither part alone does it (physical only 200 of 200, casts only 186, both 146 of 200). **The sign depends on the girls' spell length, which is the estimate (75 steps for a spell nobody measured).**
- **XIV Tourist Trap: 423 -> 483 (human), 339 -> 466 (Active).** Flat 3 s baseline. Yojimbo's and Daigoro's actions average 2.9 s and a girl's 2.5 s, so the girls get 0.5 s back on every action and the bosses almost nothing: the enemy acts 29.0 -> 23.8 times a fight, the girls are knocked out 0.8 -> 0.2 times. The cast spans alone give it (195 of 200 against 170).
- **XVI Angra Mainyu: 383 -> 490 (human).** Flat 3 s baseline. Angra Mainyu's Full-Life and Tawrich's Punch hold them **4.5 s** each (the 94-step estimate plus the 41-step idle pose of a body that waits for it) against 3 s flat, and the girls 2.4 s: diagnostic (100 seeds, human): the enemy acts 113 -> 69 times a fight, the girls are knocked out 4.2 -> 0.8, the fight is 491 -> 392 s, link wins 74 -> 98. Cast spans alone give it (196 of 200 against 142).
- **XI the Experiment (hidden): 235 -> 244 (human, p = 0.049), 228 -> 224 (Active, noise).** Within noise for practical purposes.
- **Not moved:** IV Bahamut, IX the Fallen Aeons, XIII Ixion and XV Valefor are won 500 of 500 or within two seeds either way (Valefor holds 3.6 s a cast against the flat 3, Ixion 2.6); VI Leblanc is 500 of 500 at the human pace (472 -> 500 at Active: the trio's actions are short, 1.8 s, and the girls' 2.2 s).

### 4.3 Ablation (200 seeds, human pace)

Read the table above. For the five chapters with no baseline action time the parts are clean: **casts carry V, and for the six flat-time chains the casts carry XIV and XVI**; the physical spans alone are neutral or a little negative; the pair is not a sum (Den of Woe: +1 and -13 alone, -53 together). For the six flat-time chains `phys` and `cast` also drop the flat 3 s on the part that is off, so compare them with `none`.

### 4.4 Sensitivity of the soft terms (200 seeds, human pace, the six chapters the main table moves)

| Chapter | base | none (no action time) | on | run-up 0 | run-up x2 | monster hit at normal-attack estimate | monster hit at half the clip | effects x0.8 | effects x1.25 |
|---|---|---|---|---|---|---|---|---|---|
| V Vegnagun+Shuyin | 184 | - | 197 | - | - | - | - | - | - |
| X Trema | 114 | - | 158 | - | - | - | - | - | - |
| XII Den of Woe | 199 | - | 146 | - | - | - | - | - | - |
| XI Experiment | 88 | - | 93 | - | - | - | - | - | - |
| XIV Tourist Trap | 170 | - | 194 | - | - | - | - | - | - |
| XVI Angra Mainyu | 142 | - | 196 | - | - | - | - | - | - |

## 5. Decision for Bailey: turn `ACTION_TIME_PER_COMMAND` on or not

The switch is `ACTION_TIME_PER_COMMAND` in `src/battle/ffx2/action-time.ts` (`false`). Turning it on is one line; with it on, a formation's flat 3 s (Chapters IX, X, XIII, XIV, XV, XVI: D-151, D-187/D-197, D-269) gives way to the span.

| Chapter | Wait pace (human) | Active | Bench | What it comes from | How soft |
|---|---|---|---|---|---|
| IV Bahamut | 500 -> 500 (+0) | 500 -> 500 (+0) | not run | no move; the fight takes longer (1.3 -> 1.9 min) | firm |
| V Vegnagun and Shuyin | 463 -> 489 (+26) | 417 -> 468 (+51) | not run | the parts' casts hold them 3.5 s against a girl's 2.1 s; the enemy acts 17 percent less | effect length (94 default) |
| VI Leblanc | 500 -> 500 (+0) | 472 -> 500 (+28) | not run | no move at the Wait pace; the trio's short actions (1.8 s) against the girls' 2.2 s help the girls at Active | run-up, idle break |
| IX Fallen Aeons | 498 -> 500 (+2) | 497 -> 500 (+3) | not run | no move (500 or within two seeds) | firm |
| X Trema | 288 -> 378 (+90) | 167 -> 337 (+170) | not run | flat 3 s gives way: the girls and Trema get 0.6 s back per action, the Paragon's plain Attack holds it 5.9 s | monster hit time inside a 138-frame swing |
| XII Den of Woe | 498 -> 371 (-127) | 452 -> 488 (+36) | not run | Nooj's Attack holds him 0.5 s, the girls' spells 2.5 s: he acts relatively more, and at the Wait pace the girls' free menu time is gone | girls' spell length (75 default), Nooj's hit time |
| XIII Ixion | 500 -> 500 (+0) | 499 -> 500 (+1) | not run | no move (500 of 500) | firm |
| XI the Experiment | 235 -> 244 (+9) | 228 -> 224 (-4) | not run | within noise | firm |
| XIV Tourist Trap | 423 -> 483 (+60) | 339 -> 466 (+127) | not run | flat 3 s gives way: the girls get 0.5 s back per action, Yojimbo and Daigoro almost none | effect length |
| XV Valefor | 500 -> 500 (+0) | not run | not run | no move (500 of 500) | firm |
| XVI Angra Mainyu | 383 -> 490 (+107) | not run | not run | Angra Mainyu's and Tawrich's casts hold them 4.5 s against 3 s flat: the enemy acts 113 -> 69 times a fight | effect length (94 default) |

**Recommendation: leave it OFF for now and run the stopwatch session of section 6 first; turn it ON after.** Why:
1. The direction is right (every action takes the time of its animation: that is the 1:1 reading, and the base commit's "no time at all" is the least faithful of the three), and the machinery is proved (switch off is the base, byte for byte; 16 of 16 mutants caught).
2. But the SIZES lean on three estimates that one session settles: the girls' spell length (75 steps for every spell but Fire; the Dark Knight's Darkness alone is a third of all girl actions in the measured fights), a monster's hit time inside its attack clip (the clip's end is an upper bound), and the run-up. The sensitivity table shows which chapters change sign when they move.
3. It would move the shipped balance a great deal at once: one chapter loses 127 of 500 first-try wins at the Wait pace (XII), five gain 26 to 170, and it supersedes six of Bailey's own 3-second picks.
4. If Bailey wants it on before the session, the least-risk choice is **ON with the flat times superseded** (the default here), because "keep the flat time" is the base itself for those six chains; and say so in the CHANGELOG (section 7) as provisional.

## 6. What a live measurement would settle (note FFX2-G11 section 7), in the order that moves these numbers

The measurement above is only as good as three soft terms. The read-only sampler of the 2026-10-09 session (Bailey's OK for the screen) settles them:

1. **Effect lengths of the commands the chapters use** (G11 section 7 item 5). One number for every spell would be a lie; the span uses 75 steps for every girl command and 94 for every enemy command that is not one of three measured. The most-used commands in the measured fights, by cast count, are the Dark Knight's Darkness (row 0x307f, effect 844), Cura, Curaga, Protect, Shell, the Potions, Angra Mainyu's Full-Life, Tawrich's Punch, Gippal's Grinder and Nooj's Rippling Chroma; Fire, Fira, Firaga, Thunder, Blizzard and Cure are the list in H01 section 12. Release step to completion for each, one Hasted.
2. **Attack spans** (item 4): command start, run-up start, hit signal, completion, for a girl and for a monster at a known distance. Above all one long-clip monster (the Paragon's `attack_00` is 138 frames; the span takes the whole clip as the hit time, 5.9 s) and one short one (Nooj, 16 frames, 0.5 s). This settles the clip-is-the-hit-time reading and the run-up in one session.
3. **Idle-break waits** (item 3): queue entry to start gate for one boss with the bits (Leblanc: idle 28 / 56) and a girl's cast.
4. **Haste on an effect** (item 6): one Hasted cast, release to end.
5. The group-2 counter freeze (item 2) and the No Love Lost trace (item 1) belong to slice B1 and to XE1 / XE3, not to this slice.

## 7. CHANGELOG paragraph (for the case Bailey turns the switch on; lanes never write CHANGELOG.md)

- **FFX-2, how long an action takes:** every command now holds its user for the time its animation takes, from the game's own animation tables, instead of taking no time (or, in six fights, a flat three seconds). A girl's Attack is the wait for her idle pose to break, the run to the target and the swing up to the hit; a spell, item or special is the effect from the moment it is released to its end, about two and a half seconds for a girl's and three to four and a half for a boss's; a boss's plain Attack takes from half a second (Nooj) to six (the Paragon) by its body. Haste halves the animation parts and not the effect. Other units' gauges keep filling while one acts. **Provisional:** only three effect lengths (Fire, Umbral Gaze, Strength Up) are measured in the real game; every other uses the nearest of them, and the run-up and the idle wait are estimates, so the fights this moves (see the table in the handoff) will move again when the stopwatch session measures the rest. No boss or party number was changed.

## 8. Open items

1. **The decision** of section 5: Bailey's word on `ACTION_TIME_PER_COMMAND`, and, with it ON, whether the six formations' flat 3 s (D-151, D-187/D-197, D-269) give way to the span (the default here) or stay (`supersedeFormation: false`; measured as `on-keep`, which is the base itself because every link of those chains carries the flat).
2. **Effect lengths** beyond the three measured (section 6 item 1); the largest single lever (`on-fx80` / `on-fx125` in section 4).
3. **A monster's hit time inside `attack_00`** (section 6 item 2): the clip's end is an upper bound; the `on-hit-half` arm shows the cost of the doubt.
4. **The run-up**: lower bound, no acceleration ramp, no turning, a fixed 52.4-unit distance for every fight (the real one is per scene and per target); the `on-norun` / `on-far` arms bound it. The girls' physical specials (classes 5 to 0xC and 0xD to 0x14, which play `spN` clips) use the plain attack clip: unmodelled.
5. **Not in this slice, named so nobody assumes it:** B1 (the global executing flag that freezes group-2 counters and Poison / Regen during a cast; a parity change for every spell), B2 (hits at their real steps; the party still sees every hit at the command's start and the actor then waits), the flinch that replays a cast's start clip (XA9), the one-cast-at-a-time release, blends between clips, the guard clip for Defend (a Defend owes 0), Trigger Happy and Lady Luck's reels (class 0x28 and the wrapper rows owe 0 or the fired ability's span).
6. **XE1 / XE3** (Leblanc's No Love Lost): with the switch ON the combo has a span (94 steps plus a 14-step idle break at the gate), so the trio's invincibility byte and the Act III revive become observable; neither rule was coded here (they belong to X2-C and the stat-setter handoff).
7. Items run on the fallback class (2) with the girl default of 75 steps: the item rows (0x2xxx) are not command rows; their real effect lengths are unread.
