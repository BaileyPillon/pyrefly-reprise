# Re-parity RC10 X2-A, slice A (row XA6): FFX-2 action time per command, behind `ACTION_TIME_PER_COMMAND` (OFF)

Status: **built, tested, measured and committed on branch `re-parity-rc10-x2-action-time` (from `origin/re-parity-rc9-x2-hit-reaction-r52`, `7a1c0cb28`, the r53 base); pushed; not merged, not deployed; the switch is OFF** (written 2026-10-18). **The independent check of 2026-10-18 (`D:\Tools\ffx-parity\rc10\xa6-check.md`) failed it on three items and found the engine, the data and the switch-off proof sound; this version fixes the three: a red data-citation test (a `§` reference and all six estimates are now in the data header), the Den of Woe explanation and the recommendation resting on it (rewritten from the check's evidence and a follow-up investigation, sections 4.2, 4.4 and 5), and the incomplete list of Bailey's superseded 3-second picks (all six formations by name, section 5); plus the non-blocking items (the girl's hit time labelled, a list of about 8 stopwatch readings with Darkness first, the girls'-default sign-robustness result, a recommendation with the honest uncertainty).** **Update 2026-10-19: the measured values (Darkness, a Potion, the game's own first-hit frames) are in the data and the tables are rerun: see section 9 (the switch is still OFF; the recommendation is rewritten there).** Tip: the commit that adds section 9.
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
| later commits | the measurement knobs (run-up distance, a monster's hit time, effect scale), the Slow / Haste / Stop test, the first version of this note (`dd928a1df`) |
| `eba6bd476` | fix B1 of the check: the data header cites `§` sections and lists all six estimates; the girl's hit time is labelled where it is used (comments only) |
| the commit that adds this version | fixes B2 and B3 and the non-blocking items (this note only) |
| `0ea7b0ba1` | rerun, data: the read first-hit frames (31 girl + 22 monster sets, 6 ambiguous), Darkness 83 and items 80 (data, one adapter line, hand checks) |
| the commit that adds section 9 | the rerun tables, the Den of Woe sweep, the recommendation (this note only) |

`engine-core.ts` and `internal.ts` (399 lines each on this base) are not touched; no file went over 400 lines (`action-span.ts` 212, `kernel/action-span.ts` 149, `action-frames.ts` 233, `execute.ts` 347). No contract file changed shape, so no CONTRACT-CHANGES entry.

## 0. In one paragraph (player words)

Today most FFX-2 fights give a command no time at all: the girl or the boss acts, and its gauge starts refilling the same instant (six fights give every command a flat three seconds instead). In the real game a command holds its user for as long as its animation plays: a girl's Attack is the wait for her idle pose to break, the run to the enemy and the swing up to the hit (about two seconds); a spell, an item or a special is the effect from the moment it is released to its end (Fire was measured at 2.5 s); a boss's cast is three to four and a half seconds, and its plain Attack runs from half a second (Nooj) to six (the Paragon) by its body. This slice makes every command hold its actor for that long, from the game's own animation tables, behind `ACTION_TIME_PER_COMMAND`, **OFF**. With it off every FFX-2 battle is byte for byte what it was (432 of 432 chain-plays compared with the base commit, at three paces). **With it ON the party wins more in the chapters that move, and loses a lot of one** (section 4): a boss's cast holds the boss longer than a girl's action holds her, so the bosses get fewer turns between the girls' turns (Vegnagun +26 of 500 at the Wait pace, Trema +90, Tourist Trap +60, Angra Mainyu +107, the last two against their flat 3 s). The exception is Den of Woe at the Wait pace (-127 of 500): with the switch on the two Dark Knights are still in their 2.5-second cast animation when Nooj, brought under 3,000 HP by their volley, starts his one Lightfall (5,000 to everyone), so the scripted line's Hero Drink cannot be drunk in time and the party falls; how bad it is depends on the player's menu pace (0 to -53 of 200, -11 percent averaged) and on two estimated cast lengths landing near each other (section 4.2). Only three effect lengths are measured, and **Darkness, 35 to 41 percent of all actions in four of the six moving chapters, is not one of them**; every other is a labelled estimate, and the sensitivity arms show how much the answer leans on them.

## 1. What the span is made of

Game case: **FFX-2 only** (FFX is CTB; it has no per-actor motion machines, no effect modules and no action-executing flag). The span is how many logic steps (29.97 a second) a command keeps its actor EXECUTING after it resolves, through the existing countdown (`execute.ts#finishAction`, `gauge.executing`; the other units' gauges run meanwhile; the actor's recovery starts when it ends).

| Command kind (the row's sequence class, note FFX2-G01 section 8.2) | Span in steps | Per body? |
|---|---|---|
| **Physical** (classes 1, 0xD to 0x14, 0x1D, 0x25, 0x26, 0x2B: Attack, the guns, Steal, the physical specials) | idle break + run-up + the `attack_00` clip up to the hit (the clip's END is taken as the hit, for a girl and a monster alike: an **estimate**, section 2) | idle clip, run speed, start distance and attack clip are the body's |
| **Charge kind** (classes 2 to 4, 0x15 to 0x1C, 0x1F to 0x24, 0x29, 0x2C to 0x2F: spells, skills, items, specials, No Love Lost) | the effect module's length from the release; plus, for a girl's command with no countdown (cost 0), her idle break and cast-start clip; plus a monster's idle break when its motion type carries a start-wait bit | the effect is per effect id (3 measured, class defaults for the rest), not per body |
| **Nothing** (Defend, Escape, Wait-class, resident magic, the Sandals, a refused item, class 0 menu stubs) | 0 | |

Rules (all in `kernel/action-span.ts`; the game's stages are in note FFX2-G11 section 2):
1. A physical command completes at its LAST HIT, not when its follow-through and return clips end (those only hold the next command's start); so the clip is `attack_00` (the macro waits "until the attack lands"). Where inside the clip the hit falls is not read (no hit-signal frames are extracted), so the span takes the END of the clip as the hit time, for a girl's clip and a monster's alike: an **estimate**, an upper bound (section 2).
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
| Every other effect's length (485 of the 488 rows: only Fire's two rows 0x30a5 and 0x41e9 and Lingering Gaze's 0x4020 carry a measured one; Umbral Gaze's own row 0x401f and Strength Up's 0x41db are in no chapter's data) | 75 for a girl's command, 94 for an enemy's | the nearest measured class (Fire for the girls; the monsters' median of five) | **ESTIMATE** |
| The run-up | `ceil((52.4 - start distance) / run speed x 29.97)` steps; 52.4 field units | the median girl-to-nearest-monster distance over FFX2-G07's 35 scenes; the macro's speed read as units a second, no acceleration ramp, no turning | **ESTIMATE** (a lower bound) |
| The idle break before a command | half the idle clip | the phase of the idle clip when the command starts is a script random pick; the expectation keeps every random stream where it was | **ESTIMATE** |
| The hit time inside the `attack_00` clip, **a monster's and a girl's alike** | the end of the clip | the macro waits "until the attack lands"; the hit-signal frames of the attack clips are not extracted (FFX2-G01 8.7) and most monster `attack_00` clips carry none, so the clip's end is an upper bound on the hit. A girl's attack clips run 2 to 40 frames (a small effect, not varied by any arm); a monster's run up to 138 (the Paragon) | **ESTIMATE** (a monster's: sensitivity arms below; a girl's: no arm) |
| Whether Haste shortens an effect module | no (the effect is left unscaled) | nothing says it does (FFX2-G11 2.2 item 3) | **UNKNOWN**, left unscaled |
| An item's class and effect length | an item is not a command row: it runs on the fallback class with the girl default of 75 steps | open item 7; items are 4 to 7 percent of all actions in the moving chapters | **ESTIMATE** |
| Hand check against the live attack lengths | Yuna 41, Paine 59, Rikku 17 (cut short) steps, choice to completion, dressphere not recorded | the model gives Yuna 61, Rikku 53, Paine 58 if all three wore the Mascot; Paine agrees, Yuna is 20 steps (0.7 s) long | consistency check, not a calibration |

**The estimates, all six** (the same list stands in the header of `src/data/ffx2/action-frames.ts`): (1) every effect length but the three measured, (2) the run-up, (3) the idle break, (4) the hit time at the end of the attack clip (girl and monster), (5) Haste leaving effects unscaled (UNKNOWN), (6) an item's fallback class. **Darkness is not one of the three measured effects** (section 6); it is 35 to 41 percent of all actions in four of the six chapters this switch moves, and it runs on Fire's 75 steps.

Nothing is tuned. No boss or party number changed. The generator is `D:\Tools\ffx-parity\coverage\ffx2\FFX2-G11\gen_action_frames.py`; it reads the game's extracted tables on Bailey's PC and writes `src/data/ffx2/action-frames.ts`, so the repo holds numbers only.

## 3. Proofs

| Proof | What | Result |
|---|---|---|
| Hand checks | `tests/unit/ffx2-action-span.test.ts` (23 tests): the kernel's terms by hand, three girls (Yuna 61, Rikku 53 and Hasted 27, Paine 58) and three bosses (Bahamut 43, Leblanc 17, Trema 66), the casts (Fire 75; Bahamut's special 117; No Love Lost 108), Haste, Slow, Stop, the precedence of the switches, the engine's countdown (the enemy's later turns start later with the switch on) | all pass |
| Switch off is the base | the SHIPPED strategy plays every FFX-2 chapter's whole chain (12 chapters, seeds 1 to 12, bench, human and Active pace; 432 chain-plays) on the base commit `7a1c0cb28` (a `git archive` export) and on this tree; one SHA-1 of every link's whole event log | **432 of 432 identical** (non-trivial: wins and losses both present). 60 of the digests are pinned in `tests/fixtures/parity/ffx2/action_span_off.json` and checked by `ffx2-action-span-off.test.ts` |
| Goldens | `ffx2-atb-golden` (6), `ffx-engine-golden` (18), `ff7-golden` (3), `ffx2-hit-reaction-wiring` (17), `fallen-aeons-action-time` (5), `parity-ffx2-stat-setter-engine` (32) | all pass, unchanged |
| After the check's fixes | `tsc --noEmit` clean; the lane's three test files, the three goldens (ffx2-atb, ffx-engine, ff7), the 60 pinned switch-off digests and all eight `data-ffx2-*` files (2,236 tests in those nine files, the citations test now green) pass; the env-gated measurement test ran for the overlay sanity below; `orphans.mjs` lists none of the new modules; the only code change is comments, and a 12-seed switch-off identity (432 of 432 chain-plays identical, seeds 25 to 36, all 12 chapters at the bench, Wait and Active paces, victories and defeats both present; the base overlay shown live: Trema at the Wait pace with the arm on records 0 spans in the overlay and 267,113 party span steps in the tree) was re-run on the final tree against the base built in-process (the check's overlay method, no second tree) | all pass |
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
| XV Valefor | 500 -> 500 | +0 | 0 / 0 (p=1.000) | 0.2 -> 0.1 | 2.1 -> 1.9 | 37.7 -> 37.6 | 16.3 -> 14.0 | 2.45 | 3.62 |
| XVI Angra Mainyu | 24 -> 369 | +345 | 4 / 349 (p=0.000) ** | 9.7 -> 5.0 | 8.6 -> 9.7 | 141.7 -> 181.2 | 142.0 -> 119.9 | 2.49 | 4.50 |

#### bench: whole-chain first-try wins, switch off (base) -> on, 500 seeds unless noted

| Chapter | wins base -> on | change | seeds W->L / L->W (p) | KOs/seed | minutes/seed | party actions/seed | enemy actions/seed | mean span party action (s) | mean span enemy action (s) |
|---|---|---|---|---|---|---|---|---|---|
| IV Bahamut | 500 -> 500 | +0 | 0 / 0 (p=1.000) | 0.0 -> 0.0 | 1.2 -> 1.8 | 45.4 -> 45.1 | 12.3 -> 13.8 | 2.46 | 2.56 |
| V Vegnagun+Shuyin | 482 -> 497 | +15 | 2 / 17 (p=0.000) ** | 1.2 -> 0.8 | 3.6 -> 4.7 | 98.9 -> 100.8 | 63.1 -> 54.5 | 2.14 | 3.46 |
| VI Leblanc | 500 -> 499 | -1 | 1 / 0 (p=1.000) | 1.0 -> 1.4 | 2.2 -> 3.3 | 80.9 -> 81.0 | 28.1 -> 35.6 | 2.09 | 1.76 |
| IX Fallen Aeons | 500 -> 500 | +0 | 0 / 0 (p=1.000) | 0.1 -> 0.1 | 2.2 -> 2.1 | 47.6 -> 48.4 | 24.7 -> 22.8 | 2.30 | 3.24 |
| X Trema | 336 -> 410 | +74 | 47 / 121 (p=0.000) ** | 1.4 -> 1.3 | 8.7 -> 9.8 | 169.7 -> 203.4 | 119.0 -> 152.1 | 2.39 | 2.51 |
| XII Den of Woe | 499 -> 497 | -2 | 3 / 1 (p=0.625) | 0.4 -> 0.3 | 1.1 -> 1.5 | 33.3 -> 30.7 | 15.5 -> 13.4 | 2.49 | 2.16 |
| XIII Ixion | 500 -> 500 | +0 | 0 / 0 (p=1.000) | 0.0 -> 0.0 | 1.3 -> 1.2 | 28.1 -> 28.6 | 10.9 -> 10.8 | 2.47 | 2.63 |
| XI Experiment | 272 -> 274 | +2 | 9 / 11 (p=0.824) | 1.7 -> 1.6 | 0.9 -> 1.2 | 25.3 -> 24.8 | 8.1 -> 8.9 | 2.35 | 1.70 |
| XIV Tourist Trap | 464 -> 483 | +19 | 10 / 29 (p=0.003) ** | 0.5 -> 0.2 | 2.2 -> 2.0 | 47.4 -> 47.6 | 26.5 -> 22.3 | 2.44 | 2.93 |
| XV Valefor | 500 -> 500 | +0 | 0 / 0 (p=1.000) | 0.1 -> 0.1 | 1.7 -> 1.5 | 38.7 -> 38.8 | 12.9 -> 10.8 | 2.33 | 3.63 |
| XVI Angra Mainyu | 447 -> 496 | +49 | 4 / 53 (p=0.000) ** | 3.0 -> 0.4 | 7.6 -> 5.9 | 169.8 -> 153.0 | 103.1 -> 60.4 | 2.39 | 4.50 |

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
| XV Valefor | 500 | 500 | - |
| XVI Angra Mainyu | 24 | 369 | - |

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

**In general.** A girl's action holds her 2.1 to 2.5 seconds (her Attack 1.9 to 2.1 s, a spell, an item or a special 2.5 s, which is Fire's measured 75 steps); a boss's holds it 1.7 to 4.5 s, by body and by command: a cast is the 94-step estimate and, for a body that waits for an idle pose before it starts, up to two seconds more; a plain Attack is the idle wait, the run and the swing. So where a boss's actions are longer than a girl's, the girls get relatively more turns, and where they are shorter, fewer. The two sides are slowed together and the fights run longer (Bahamut 1.3 to 1.9 minutes at the human pace, Leblanc 2.7 to 3.7); what changes the odds is the difference between the two sides' spans. At the bench pace (no menu time) only the four chapters whose enemy spans are long move: V +15, X +74, XIV +19, XVI +49 of 500; Den of Woe is -2.

- **V Vegnagun and Shuyin: 463 -> 489 (human), 417 -> 468 (Active), p below 0.001.** The parts' casts hold them 3.5 s each (the 94-step estimate plus the idle pose the part waits for) against 2.1 s for a girl: the enemy acts 73 -> 62 times a fight, the girls are knocked out 1.7 -> 1.1 times. Ablation: the cast spans alone give it (198 of 200 against 184); the physical spans alone cost 5.
- **X Trema: 288 -> 378 (human), 167 -> 337 (Active), p below 0.001.** Both links already carry the flat 3 s. Trema's three moves are class 1 attacks that take 2.2 s and a girl's action 2.4 s, so Trema gets 0.8 s and a girl 0.6 s back on every action; and the Paragon's plain Attack, whose swing clip is 138 frames, holds it 5.9 s (the clip's end taken as the hit): the Paragon strikes far less often. Diagnostic on 100 seeds, human: link 1 (the Paragon) 59 -> 87 wins, girls knocked out 1.28 -> 0.43 a fight; link 2 (Trema) 51 of 59 -> 76 of 87 reaching it. Its sign survives every soft-term variant (143 to 158 of 200 against 114; section 4.4), but its size is the most exposed to the "clip is the hit time" reading: half the clip gives 144.
- **XII Den of Woe: 498 -> 371 at the human pace (128 seeds lost, 1 gained, p below 0.001), 452 -> 488 at Active, 499 -> 497 at the bench pace.** The baseline has no action time. **The first version of this note blamed the held menu clock and Nooj's plain Attack; the independent check (xa6-check) refuted both, and a follow-up investigation (2026-10-18, event logs of 200 seeds at every menu split, base against on) found what it is.** In player words, then the evidence.
  - **What happens.** Nooj has one big move, **Lightfall: 5,000 to everyone, once, when he is at 2,999 HP or less; it lands 4.6 s after he starts it.** The only answer is a Hero Drink (Invincible), which the scripted line drinks (Yuna, and any girl at 5,000 HP or less) while Nooj is at 4,500 HP or less and Lightfall has not started, so a girl's menu must open in that gap. Without the switch a Dark Knight's menu opens one step after her Darkness lands (median 1 step), so in every one of 147 Lightfall fights at the 0.5 / 1.0 s split a girl's menu opens in that gap. **With the switch on, the two Dark Knights (Rikku and Paine) cast Darkness together and the two hits land close together (18 steps apart in the seed below), taking Nooj from about 10,000 HP to under 3,000 in one volley, and from that moment each of them is still in her 2.5-second cast animation (her next menu opens a median of 76 steps after her cast lands: the 75-step span plus the step it takes) while Nooj starts Lightfall a median of 23 steps (0.8 s) after the volley.** In 86 of 130 Lightfall fights no girl's menu opened before Lightfall started (the menu opens a median of 52 steps, 1.7 s, after the volley); with no Invincible in place two Dark Knights at about 3,000 HP die to the 5,000 and the party falls: **53 of the 54 defeats at this split are a Lightfall that killed all three girls, the 54th killed two and Nooj finished the third.** Event log of seed 6, link 3 (Nooj), 0.5 / 1.0 s split: switch on: Rikku and Paine start Darkness at 635 and 650 (Nooj 10,086 HP), the hits land at 774 and 792 (3,131 and 4,093; Nooj 2,862), Nooj starts Lightfall at 813, the first girl's menu is open again at 850, Lightfall lands at 952 and Yuna, Rikku and Paine fall at once. Switch off, same seed: the hits land at 619, 662, 761 and 804 (Nooj 12,402, 9,271, 6,448, 3,414, 760), Rikku decides at 762 and Paine at 805 and each drinks a Hero Drink, Nooj starts Lightfall at 832, Invincible is in place on Rikku at 880 and Paine at 937, Lightfall lands at 971 and only Yuna falls. Over 200 seeds at this split (link 3, base -> on): Nooj acts 10.6 -> 8.1 times, the girls 17.1 -> 14.5, girls knocked out 0.60 -> 1.20 a fight, the link takes 38 -> 44 s.
  - **Why the menu split matters (a lock between two rhythms; supported by the sweeps below, not isolated by one intervention).** With the switch on, Nooj's Rippling Chroma and Greedy Aura each come 221 steps (7.4 s) after the move before (116 steps of cast: the 94-step enemy default plus his 22-step idle wait; and 105 steps of recovery), and the Dark Knights' Darkness-to-Darkness cycle is 211, 216, 228, 237, 246 and 262 steps at 0, 250, 500, 750, 1000 and 1500 ms of running menu time (the running part is spent in each of the three girls' menus every round; the held part adds none, which is why the held submenu does not matter by itself). At 250 and 500 ms the two cycles are within 5 to 7 steps and the volley keeps landing just before Nooj's next move: he starts Lightfall a median of 46 and 23 steps after it, against a girl's menu at 53 and 52, and the girls lose 50 and 53 of 200. At the other splits the cycles are 10 steps or more apart, the volley lands at a different point each round (a median of 64, 141, 110 and 72 steps before Lightfall at 0, 750, 1000 and 1500 ms) and the girls' menu wins the race in 104 of 113, 103 of 141, 135 of 135 and 135 of 150 fights. **The worst point follows the cycle, not the menu time:** with the girls' cast default at 94 or 112 steps (the check's overlay of `EFFECT_STEPS_PARTY_ESTIMATE`) the worst of the points measured (-53 of 200 at a Dark Knight cycle of 229 steps, -62 at 239) sits at 250 ms for 94 and at 0 ms for 112 instead of 500, its neighbours lose 14 to 36, and well away from it the result is level with the base or better (default 94: 199 of 200 at 750 and 1000 ms; default 112: 193 against 181 with everything running; table in 4.4). A random jitter of each menu's running part does not unlock it, because the lock is on the mean cycle: each menu drawn from 0.25 to 0.75 s loses 198 -> 162, from 0 to 1.0 s 200 -> 165.
  - **What it is not.** **Not the held menu clock** (the whole 1.5 s menu held gives 200 -> 199); **not Nooj's Attack** (his 16-frame clip holds him 0.5 s; "Nooj's Attack at 60 frames" gives 200 of 200 only at this one split, hurts at the all-held split (166 of 200), and 60 frames is not a reachable value for him: his clip is 16 frames and 60 is shared by 17 of the 36 bodies, Nooj, Angra Mainyu and Tawrich among them, which looks like a placeholder the game overwrites after the first hit; half the clip leaves 153 of 200); **not a defect in the new code**: the span is charged once (a Dark Knight's menu opens 76 steps after her cast lands, 75 plus the step it takes), it runs only while the clock runs (a held menu advances no steps), her charge before the cast is 126 steps with the switch on and off alike, and the switch-off identity is unchanged (section 3). A longer girls' cast default does not remove it: it moves the bad menu pace (4.4). Ablation: neither part alone does it (physical only 200 of 200, casts only 186, both 146 of 200).
  - **What would remove it, and what that says.** The loss disappears if the scripted line drinks earlier: **with the Hero Drink trigger raised from Nooj at 4,500 HP to 12,000 the switch-on result at this split is 198 of 200 (17,500: 197; 9,000: 148, because the Dark Knights' last menu before the volley sees Nooj at about 10,000)**, run as an overlay on the line's constant; no file was changed. The trigger is the line's own number (`DRINK_FROM` in `src/engine/tactics/ffx2-den-of-woe.ts`, marked "our line, not data"), tuned to a world where a spell frees its caster at once. In the game with action time a player who does not drink until Nooj is nearly down is too late at some paces; one who drinks at about half his HP is not. That is a change in what the fight asks of a human, not a measured fact about the game; two things that may make the model harder on the girls than the game are named in section 8 (the hit lands at the START of the effect, B2, so a caster waits for the whole effect after her damage, where the game may land the damage partway through it; and the unmeasured Darkness length). **Whether the real fight locks like this is unknown: it needs Darkness and Nooj's two casts measured.**
- **XIV Tourist Trap: 423 -> 483 (human), 339 -> 466 (Active).** Flat 3 s baseline. Yojimbo's and Daigoro's actions average 2.9 s and a girl's 2.5 s, so the girls get 0.5 s back on every action and the bosses almost nothing: the enemy acts 29.0 -> 23.8 times a fight, the girls are knocked out 0.8 -> 0.2 times. The cast spans alone give it (195 of 200 against 170).
- **XVI Angra Mainyu: 383 -> 490 (human).** Flat 3 s baseline. Angra Mainyu's Full-Life and Tawrich's Punch hold them **4.5 s** each (the 94-step estimate plus the 41-step idle pose of a body that waits for it) against 3 s flat, and the girls 2.4 s: diagnostic (100 seeds, human): the enemy acts 113 -> 69 times a fight, the girls are knocked out 4.2 -> 0.8, the fight is 491 -> 392 s, link wins 74 -> 98. Cast spans alone give it (196 of 200 against 142).
- **XI the Experiment (hidden): 235 -> 244 (human, p = 0.049), 228 -> 224 (Active, noise).** Within noise for practical purposes.
- **Not moved:** IV Bahamut, IX the Fallen Aeons, XIII Ixion and XV Valefor are won 500 of 500 or within two seeds either way (Valefor holds 3.6 s a cast against the flat 3, Ixion 2.6); VI Leblanc is 500 of 500 at the human pace (472 -> 500 at Active: the trio's actions are short, 1.8 s, and the girls' 2.2 s).

### 4.3 Ablation (200 seeds, human pace)

Read the table above. **The cast spans carry the gains: V (198 of 200 casts-only, 197 both), XIV (195, 194) and XVI (196, 196); the physical spans alone are neutral or negative** (V 179, XIV 155); the pair is not a sum (Den of Woe: +1 and -13 alone, -53 together). For the six flat-time chains `phys` and `cast` also drop the flat 3 s on the part that is off, which is why Trema reads 60 and 3 there: compare with `none` (Trema 10 of 200 with no action time at all, Tourist Trap 163, Angra Mainyu 171).

### 4.4 Sensitivity of the soft terms (200 seeds, human pace, the six chapters the main table moves)

| Chapter | base | none (no action time) | on | run-up 0 | run-up x2 | monster hit at normal-attack estimate | monster hit at half the clip | effects x0.8 | effects x1.25 |
|---|---|---|---|---|---|---|---|---|---|
| V Vegnagun+Shuyin | 184 | - | 197 | 198 | 197 | 195 | 197 | 194 | 199 |
| X Trema | 114 | 10 | 158 | 144 | 143 | 158 | 144 | 146 | 149 |
| XII Den of Woe | 199 | - | 146 | 148 | 140 | 200 | 153 | 153 | 156 |
| XI Experiment | 88 | - | 93 | 93 | 93 | 94 | 92 | 85 | 92 |
| XIV Tourist Trap | 170 | 163 | 194 | 194 | 195 | 193 | 194 | 193 | 194 |
| XVI Angra Mainyu | 142 | 171 | 196 | 196 | 196 | 196 | 196 | 198 | 197 |

Reading it: **four movers keep their sign under every variant**: V (194 to 199 against 184), XIV (193 to 195 against 170), XVI (196 to 198 against 142) and Trema (143 to 158 against 114, and 139 to 143 with the girls' cast default at 112 and 94; the effect length and the monster hit time move its size by a dozen). **Den of Woe is the one that is not sign-robust**: its result depends on the menu pace and on the Dark Knights' cast length (the tables below), not on Nooj's hit time (the macro-estimate arm gives 200 of 200 at one pace and hurts at another). The run-up, the least known term, matters little anywhere (none at all against twice the distance moves no chapter by more than 14 wins of 200). The Experiment is noise in every arm.

#### Den of Woe: the menu-pace sweep (200 seeds, whole chain, switch off -> on)

The Wait engine, 1.5 s of menu per decision split into a **running** part (the top list, the clock runs) and a **held** part (a submenu, the clock is held). Reproduced seed for seed by the independent check and by this lane's event-log runs; the last four columns are from the event logs (switch on; the base opens a girl's menu a median 1 step after the volley at every split).

| running / held (ms) | base | on | lost / gained | Dark Knight cycle (steps) | Nooj starts Lightfall, median steps after the volley | a girl's menu, median steps after the volley | a girl's menu before Lightfall |
|---|---|---|---|---|---|---|---|
| 0 / 1500 (all held) | 200 | 199 | 1 / 0 | 211 | 64 | 56 | 104 of 113 |
| 100 / 1400 | 200 | 189 | 11 / 0 | (check's run) | | | |
| 250 / 1250 | 200 | 150 | 50 / 0 | 216 | 46 | 53 | 64 of 110 |
| **500 / 1000 (the "human" pace)** | 199 | **146** | 53 / 0 | 228 | **23** | 52 | **44 of 130** |
| 750 / 750 | 198 | 185 | 15 / 2 | 237 | 141 | 76 | 103 of 141 |
| 1000 / 500 | 199 | 199 | 1 / 1 | 246 | 110 | 73 | 135 of 135 |
| 1500 / 0 (all running, Active-like) | 181 | 198 | 2 / 19 | 262 | 72 | 76 | 135 of 150 |

The change averages -21 of 200 (-11 percent) over the six Wait splits from 0 to 1000 ms, -53 at the worst, +17 with everything running. Reading the "volley" as the hit that takes Nooj to 4,500 HP or less (for the girls' menu) or to 2,999 or less (for Lightfall); the cycle is the median step count from one Dark Knight Darkness to her next.

#### Den of Woe: the girls' cast default moves the bad pace (wins of 200, switch on; base on the first row)

The girls' unmeasured cast default (`EFFECT_STEPS_PARTY_ESTIMATE`, 75 steps from Fire) raised to 94 and 112 in an overlay file; nothing else changes.

| girls' default | 0 ms | 250 | 500 | 750 | 1000 | 1500 (all running) |
|---|---|---|---|---|---|---|
| base (no action time) | 200 | 200 | 199 | 198 | 199 | 181 |
| 75 (as built) | 199 | 150 | 146 | 185 | 199 | 198 |
| 94 | - | 147 | 163 (check) | 199 | 199 | - |
| 112 | 138 | 176 | 185 (check) | 184 | 171 | 193 |

A longer default helps the 500 ms pace and hurts a different one: the worst point is -53 to -62 of 200 for each default, at a Dark Knight cycle of 216 to 239 steps. So no single default removes the loss; **the loss is where the Dark Knights' cycle meets Nooj's**, and where that is depends on the unmeasured Darkness length.

#### The four other movers keep their sign when the girls' cast default is longer (wins of 200; independent check, overlay of the girls' default alone)

The earlier effect-scale arms scaled both sides together, so they could not test what these gains depend on: a boss's cast (94) being longer than a girl's action (75, from Fire alone). This arm tests it directly (switch on, as built / girls' default 94 / 112):

| Chapter, pace | base | on (75) | 94 | 112 |
|---|---|---|---|---|
| V Vegnagun and Shuyin, Wait | 184 | 197 | 195 | 194 |
| X Trema, Wait | 114 | 158 | 143 | 139 |
| XIV Tourist Trap, Wait | 170 | 194 | 193 | 186 |
| XVI Angra Mainyu, Wait | 142 | 196 | 195 | 185 |
| XVI Angra Mainyu, Active | 11 | 150 | 100 | 49 |

The sign holds in all four movers even with the girls' casts 50 percent longer than Fire; the size shrinks, Angra Mainyu at Active most (+139, +89, +38).

## 5. Decision for Bailey: turn `ACTION_TIME_PER_COMMAND` on or not

The switch is `ACTION_TIME_PER_COMMAND` in `src/battle/ffx2/action-time.ts` (`false`). Turning it on is one line; with it on, the flat 3 seconds that six formations carry give way to the span. **Those six flat times are Bailey's own picks.** All six formations by name, with the decision rows (read from `docs/target/decisions.json` on origin/main, titles quoted):

| Formation with the flat 3 s (this handoff's label) | Bailey's row | The row's title |
|---|---|---|
| Fallen Aeons: the three Road links, Shiva, the Magus Sisters and Anima (IX) | D-187 (2026-09-26), reaffirmed by D-197 (2026-09-26) | D-187: "Chapter XI (FFX-2), Fallen Aeons: option A, 3 s of action time on the three Road links only (159/200, 79.5 % at human pace); the chapter is listed". D-197: "FOC18-01 accepted: Chapter XI keeps option A (3 s Road action time), the disclosed Shiva/Anima trade-off stands" |
| Trema: the Cloister links, the Oversoul Paragon and Trema (X) | D-151 (2026-09-25) | "Chapter XIII (Trema): option 1 (Oversoul Paragon, Split_Infinity's kit) plus option 3 (Cloister-link action time at 3 s) adopted as the fight's shape" |
| Djose Ixion (XIII) | D-269 (2026-09-27) | "Djose Ixion: the 3-second action time ON (FFX-2 only)" |
| Tourist Trap (XIV) and Valefor at Besaid (XV) | D-846 (2026-10-14) | "The new chapters keep the three-second action time between enemy moves, for consistency with his per-chapter picks (Tourist Trap and Valefor at Besaid; FFX-2 only)" |
| Angra Mainyu (XVI) | D-857 (2026-10-15) | "Angra Mainyu keeps the three extra seconds of action time between enemy moves, as the Tourist Trap and Valefor do (FFX-2 only)" |

All six are Bailey's blanket "all your recommendations" (or "I'll go with all of your recommendations") to a recommendation the driver had stated, not individually argued picks; the rows record that. The decision rows number the chapters differently from the labels above (D-151 says "Chapter XIII (Trema)", D-187 "Chapter XI"), so go by the names. The data files for Valefor and Angra Mainyu still say "kept by precedent, awaiting Bailey's pick" although D-846 and D-857 are his "keep it" (a comment only; not touched here). D-857's own text records that Angra Mainyu measured 1 of 20 on the Active clock and that the focused review found it very hard (F939-03, disclosed; D-867); this switch takes it from 24 to 369 of 500 at Active.

First-try wins of 500, whole chain, base -> on:

| Chapter | Wait pace (human) | Active | Bench | What it comes from | What it leans on |
|---|---|---|---|---|---|
| IV Bahamut | 500 -> 500 (+0) | 500 -> 500 (+0) | 500 -> 500 (+0) | no move; the fight takes longer (1.3 -> 1.9 min) | firm |
| V Vegnagun and Shuyin | 463 -> 489 (+26) | 417 -> 468 (+51) | 482 -> 497 (+15) | the parts' casts hold them 3.5 s against a girl's 2.1 s; the enemy acts 17 percent less | sign robust under every variant, incl. a longer girls' default (4.4) |
| VI Leblanc | 500 -> 500 (+0) | 472 -> 500 (+28) | 500 -> 499 (-1) | no move at the Wait pace; at Active the trio's short actions (1.8 s) against the girls' 2.2 s help the girls | small |
| IX Fallen Aeons | 498 -> 500 (+2) | 497 -> 500 (+3) | 500 -> 500 (+0) | no move (500 or within two seeds) | firm |
| X Trema | 288 -> 378 (+90) | 167 -> 337 (+170) | 336 -> 410 (+74) | flat 3 s gives way: Trema gets 0.8 s and a girl 0.6 s back per action; the Paragon's plain Attack holds it 5.9 s | sign robust (also with the girls' default at 94 and 112: 143 and 139 of 200 against 114); size leans on the Paragon's 138-frame swing (144 of 200 at half) |
| XII Den of Woe | 498 -> 371 (-127) | 452 -> 488 (+36) | 499 -> 497 (-2) | **a lock between the Dark Knights' Darkness cycle and Nooj's cast cycle at some menu paces** (section 4.2): the casters are still casting when Nooj starts Lightfall; -53 of 200 at the worst pace, -11 percent averaged over six paces, +17 with everything running | **not sign-robust**: the pace and the unmeasured Darkness length (the bad pace moves with it), and the scripted line's Hero Drink trigger (12,000 instead of 4,500 gives 198 of 200 at the 0.5 / 1.0 s pace) |
| XIII Ixion | 500 -> 500 (+0) | 499 -> 500 (+1) | 500 -> 500 (+0) | no move (500 of 500) | firm |
| XI the Experiment | 235 -> 244 (+9) | 228 -> 224 (-4) | 272 -> 274 (+2) | within noise | firm |
| XIV Tourist Trap | 423 -> 483 (+60) | 339 -> 466 (+127) | 464 -> 483 (+19) | flat 3 s gives way: the girls get 0.5 s back per action, Yojimbo and Daigoro almost none | sign robust under every variant, incl. a longer girls' default (194, 193, 186 of 200 against 170) |
| XV Valefor | 500 -> 500 (+0) | 500 -> 500 (+0) | 500 -> 500 (+0) | no move (500 of 500) | firm |
| XVI Angra Mainyu | 383 -> 490 (+107) | 24 -> 369 (+345) | 447 -> 496 (+49) | Angra Mainyu's and Tawrich's casts hold them 4.5 s against 3 s flat: the enemy acts 113 -> 69 times a fight | sign robust under every variant, incl. a longer girls' default (196, 195, 185 of 200 against 142; at Active it shrinks 150 -> 100 -> 49 against a base of 11) |

**The honest state of what is known.** Known: the direction (a command holds its user while its animation plays, which is the 1:1 reading), the machinery (switch off is the base byte for byte, 432 of 432 plus the independent check's 432 of 432 on new seeds; 16 of 16 mutants caught; the goldens unchanged), and that V, X, XIV and XVI gain under every variant tried. Not known: the sizes, which lean on estimates (every effect length but three, the hit time at the end of each attack clip, the run-up, the idle break; section 2) and above all on **Darkness, 35 to 41 percent of all actions in four of the six moving chapters and not one of the three measured effects**; and whether Den of Woe really loses at a human pace, which depends on Darkness's length and on Nooj's two casts' lengths (both estimates) landing where the lock sits.

**The three options.**
- **A. Turn it ON now, as provisional.** The four sign-robust gains arrive (V, X, XIV, XVI; the last at Active from 24 to 369 of 500); six of Bailey's flat 3 s picks are superseded; Den of Woe at the Wait pace reads 371 of 500 (worst pace -53 of 200) until Darkness and Nooj's casts are measured; the CHANGELOG paragraph (section 7) says provisional. If Bailey chooses this, the line's Hero Drink trigger is the one scripted number to look at (section 8 item 8); it is not game data and was not changed here.
- **B. Leave it OFF.** Nothing changes; the "no time at all" baseline stays, which is the least faithful of the three readings and leaves Angra Mainyu at 24 of 500 on the Active clock.
- **C. Measure first, then decide (recommended).** About 8 stopwatch readings (section 6), **Darkness first** (it touches four of the six moving chapters and sets where Den of Woe's bad pace sits), plus Nooj's Rippling Chroma if Den of Woe's size is to be trusted; then the numbers replace the estimates, the tables here are re-run from the same scripts, and the switch goes on with measured values or stays off for a stated reason. The switch is one line, so waiting costs only time. If the session cannot happen soon, A is defensible: four chapters improve under every variant and the one that may lose is disclosed.

1. **The direction is the 1:1 reading.** In the game a command holds its actor for the time its animation plays, and the base commit's "no time at all" is the least faithful of the three readings (the flat 3 s is the middle one).
2. **Four of the five chapters it moves keep their sign under every soft-term variant** (the run-up none or doubled, a monster's hit at half its clip or at the macro's estimate, every effect 20 percent shorter or 25 percent longer, and the girls' cast default 50 percent longer): V (+26 of 500 at the Wait pace, +51 at Active), X Trema (+90, +170), XIV (+60, +127), XVI (+107, and +345 at Active, where the chapter was 24 of 500). They get easier for the girls because a boss's cast (3.5 to 4.5 s) holds the boss longer than a girl's action holds her (2.1 to 2.5 s), and three of them (X, XIV, XVI) were on the flat 3 s that held both sides alike. That is a balance change Bailey should expect: the party wins more in the long fights.
3. **The one hazard is Den of Woe at the Wait pace: 498 -> 371 of 500 (-127).** It is neutral at the bench pace (-2) and +36 at Active. The earlier reading of this note (the held menu clock; "one stopwatch reading of Nooj's Attack settles it"; "it disappears at the macro's estimate of his Attack") was wrong: the held-clock hypothesis is refuted (200 -> 199 with the whole menu held), Nooj's Attack at 60 frames rescues it only at one split and 60 is not a reachable value for him (his clip is 16 frames), and the cause is the lock described in 4.2. Its size is pace-dependent (0 to -53 of 200) and moves with the unmeasured Darkness length.
4. **It supersedes six of Bailey's own 3-second picks** (the default here; the table above names them). Keeping them (`on-keep`) is the base itself for those six chains, because every link carries the flat, so there is no third option to measure; `supersedeFormation: false` exists for a test.
5. **If Bailey wants it ON now:** say so in the CHANGELOG as provisional (section 7), and expect Den of Woe at the Wait pace to read 371 of 500 until Darkness and Nooj's casts are measured. No boss or party number changes either way.

## 6. What a live measurement would settle (note FFX2-G11 section 7), in the order that moves these numbers

The measurement above is only as good as its soft terms. The smallest set of readings that turns the estimates which move outcomes into measurements is **about 8 stopwatch readings** (or one file reading plus the 5 casts below), in order of leverage by the census of the commands the moving chapters run (independent check of this slice, 15 seeds a chapter, Wait pace, switch ON; the census script is `variants/census.test.ts` in the check's evidence). The read-only sampler of the 2026-10-09 session (Bailey's OK for the screen) does all of them:

1. **Darkness** (the Dark Knight's, row 0x307f, effect 844), one cast, release to completion. **This is the biggest unmeasured share:** it is 17 to 21 percent of all actions for each of the two girls who use it, **35 to 41 percent together in four of the six moving chapters** (Trema 37, Angra Mainyu 35, Tourist Trap 41, Den of Woe 41 percent, recounted from the check's census file; its report rounds the range as 34 to 41) and 25 percent in Vegnagun and Shuyin. It is not one of the three measured effects; today it runs on Fire's 75 steps.
2. **Angra Mainyu's Full-Life** (row 0x30ba, effect 116) and **Tawrich's Punch** (row 0x4129, effect 758): about 24 percent of the Angra Mainyu chapter's actions, today on the enemy default of 94. **One Cure** (effect 110) and **one Potion** (a Mega-Potion or an X-Potion; items run on the fallback class): the next 10 to 15 percent. Curaga, Esuna and Protect are neighbours of Cure but need their own reading unless the effect modules are decoded. **One Hasted cast** of any of them settles whether Haste shortens an effect (UNKNOWN today).
3. **Nooj's Attack and the Paragon's Attack**, command start to completion at a known distance, or, the cheaper route, the hit-signal frames inside their `attack1_00` clips, which note FFX2-G01's `signals.py` can read by length match (one file reading that would settle every body's hit time, a girl's included, at once). These two fix the sizes of Den of Woe and Trema (Nooj's clip is 16 frames, the Paragon's 138). Add one of Trema's three plain attacks (a 10-frame clip).
4. The count: Darkness (1) + Full-Life and Punch (2) + a Cure (1) + a Potion (1) + Nooj's and the Paragon's Attack (2) + one Hasted cast (1) = 8 readings.
5. **Idle-break waits** (G11 item 3): queue entry to start gate for one boss with the bits (Leblanc: idle 28 / 56) and a girl's cast. The idle break (half a clip) was varied by no arm; it is a labelled expectation and the next candidate if a result still looks wrong.
6. The run-up can wait: the builder's arms move no chapter by more than 14 of 200 for it.
7. The group-2 counter freeze (item 2) and the No Love Lost trace (item 1) belong to slice B1 and to XE1 / XE3, not to this slice.

A decode of the effect modules (note FFX2-G11 slice C) would replace all the cast readings but is the large job.

## 7. CHANGELOG paragraph (for the case Bailey turns the switch on; lanes never write CHANGELOG.md)

- **FFX-2, how long an action takes:** every command now holds its user for the time its animation takes, from the game's own animation tables, instead of taking no time (or, in six fights, a flat three seconds). A girl's Attack is the wait for her idle pose to break, the run to the target and the swing up to the hit; a spell, item or special is the effect from the moment it is released to its end, about two and a half seconds for a girl's and three to four and a half for a boss's; a boss's plain Attack takes from half a second (Nooj) to six (the Paragon) by its body. Haste halves the animation parts and not the effect. Other units' gauges keep filling while one acts. **Provisional:** only three effect lengths (Fire, Umbral Gaze, Strength Up) are measured in the real game, and the Dark Knight's Darkness is not one of them; every other uses the nearest of them, and the run-up, the idle wait and where an attack lands inside its swing are estimates, so the fights this moves (see the table in the handoff; Den of Woe at some menu paces gets harder because Nooj's Lightfall now catches the Dark Knights mid-cast) will move again when the stopwatch session measures the rest. No boss or party number was changed.

## 8. Open items

1. **The decision** of section 5: Bailey's word on `ACTION_TIME_PER_COMMAND` (on now, off, or measure first), and, with it ON, whether the six formations' flat 3 s (Fallen Aeons' Road links D-187 / D-197, Trema's Cloister links D-151, Djose Ixion D-269, Tourist Trap and Valefor at Besaid D-846, Angra Mainyu D-857) give way to the span (the default here) or stay (`supersedeFormation: false`; measured as `on-keep`, which is the base itself because every link of those chains carries the flat).
2. **Effect lengths** beyond the three measured (section 6 item 1); the largest single lever (`on-fx80` / `on-fx125` in section 4), and **Darkness above all** (35 to 41 percent of all actions in four of the six moving chapters; it also decides where Den of Woe's bad pace sits).
3. **The hit time inside `attack_00`, a monster's and a girl's** (section 6 item 3): the clip's end is an upper bound for both; the `on-hit-half` arm shows the cost of the doubt for a monster, no arm varies a girl's (her clips run 2 to 40 frames). Reading the hit-signal frames of the attack clips (`signals.py` in the FFX2-G01 folder) would settle every body at once.
4. **The run-up**: lower bound, no acceleration ramp, no turning, a fixed 52.4-unit distance for every fight (the real one is per scene and per target); the `on-norun` / `on-far` arms bound it. The girls' physical specials (classes 5 to 0xC and 0xD to 0x14, which play `spN` clips) use the plain attack clip: unmodelled.
5. **Not in this slice, named so nobody assumes it:** B1 (the global executing flag that freezes group-2 counters and Poison / Regen during a cast; a parity change for every spell), **B2 (hits at their real steps; the party still sees every hit at the command's start and the actor then waits: this matters for Den of Woe, where the model lands a Dark Knight's damage when her effect starts and then holds her for the whole effect, so her menu opens later after the damage than in the game, if the game's hit falls partway through the effect; not measured)**, the flinch that replays a cast's start clip (XA9), the one-cast-at-a-time release, blends between clips, the guard clip for Defend (a Defend owes 0), Trigger Happy and Lady Luck's reels (class 0x28 and the wrapper rows owe 0 or the fired ability's span).
6. **XE1 / XE3** (Leblanc's No Love Lost): with the switch ON the combo has a span (94 steps plus a 14-step idle break at the gate), so the trio's invincibility byte and the Act III revive become observable; neither rule was coded here (they belong to X2-C and the stat-setter handoff).
7. Items run on the fallback class (2) with the girl default of 75 steps: the item rows (0x2xxx) are not command rows; their real effect lengths are unread. Items are 4 to 7 percent of all actions in the moving chapters.
8. **Den of Woe's scripted line** (`DRINK_FROM = 4500` in `src/engine/tactics/ffx2-den-of-woe.ts`, "our line, not data"): its Hero Drink trigger is tuned to a world where a spell frees its caster at once. If the switch goes on, the line (and the guide that teaches it) would need to drink earlier (a trigger of 12,000 gives 198 of 200 at the 0.5 / 1.0 s pace, run as an overlay; no file was changed). That is a content and tuning change for Bailey's yes (AGENTS.md rules 6 and 10), not made here.
9. **Comments in `src/data/ffx2` for Valefor and Angra Mainyu** still say "kept by precedent, awaiting Bailey's pick" although D-846 and D-857 are his "keep it" for them (comment only; other lanes' files, not touched).
10. **Housekeeping from the independent check:** `withActionSpanKnobs*` is a global mutable setter exported from a production module (measurement only; the `finally` restores it; sequential use only), harmless now but a test helper would be tidier; the girls' non-Mascot motion sets rest on the inferred dressphere-slot order (casts with a countdown, Darkness, Cure and Fire, do not use those clips); the check re-ran the switch-off identity (432 of 432 on seeds 13 to 24) and the cells of section 4, not the mutation pass or the 500-seed ablation.

## 9. Rerun with measured values (2026-10-19)

Written 2026-10-19 on top of the commit `0ea7b0ba1` (the data and the hand checks). **The switch `ACTION_TIME_PER_COMMAND` is still OFF.** Game case: **FFX-2 only** (FFX is CTB and has no effect modules or motion machines); no FFX file, no `ffx-engine-golden`, no `ff7-golden` line changed. No boss or party number changed and no random number is drawn. The game was not run by this rerun; its inputs are numbers read from the game's own motion data (note `FFX2-G12`, 2026-10-18) and the live session of 2026-10-19 (`live/2026-10-18-live-session.md`). Sections 1 to 8 above describe the first version's numbers and stay as the record; this section replaces the estimates that were measured and re-states the decision.

### 9.0 In one paragraph (player words)

Several of the softest guesses are now numbers. A girl's plain Attack lands a few frames later than the clip's end for two of the three Mascot girls (Yuna 12, Paine 11; Rikku 4), a boss's plain Attack lands where its motion data says (Nooj 17, Trema 6, Tawrich 34, Bahamut 41, Leblanc 8, **the Oversoul Paragon 33 where the first version held it for the whole 138-frame swing**), Darkness lasts 83 steps from release instead of Fire's 75, and an item (a Potion) 80. The answer to "does the switch help" does not change direction anywhere: Vegnagun and Shuyin, Trema, Tourist Trap and Angra Mainyu still get easier for the girls at every pace, by about the same amount, except that **Trema gets a good deal smaller at the bench pace (+74 to +27 of 500) because the Paragon strikes again about as often as before the switch**, and **Den of Woe now loses at the bench pace too (-2 to -115 of 500)**, because a longer Darkness moves the Dark Knights' rhythm into the zone where Nooj's Lightfall lands before the Hero Drink is in place. If the scripted line drinks its Hero Drink earlier (Nooj at 12,000 HP, not 4,500), Den of Woe is level with the base at every pace tried (194 to 200 of 200).

### 9.1 What went into the data (`src/data/ffx2/action-frames.ts`, regenerated by `gen_action_frames.py`, which now reads `FFX2-G12/hit-roster.json`)

| Label | Count | What |
|---|---|---|
| [R] read, one candidate | 31 girl sets, 22 monster sets (of 54 and 36) | `GIRL_HIT_FRAMES` / `MONSTER_HIT_FRAMES`: the first hit-type signal of the attack clips, in frames from the start of `attack1_00` (a signal in `attack1_01` counts as the length of `attack1_00` plus its frame). Replaces the clip-end estimate. |
| [R~] read, several same-length programs disagree | 4 girl sets (0x6: 6 or 18; 0x2e: 12 or 14; 0x45: 24 or 32; 0x3d0: 28 or 34), 2 monster sets (0x1082: 5 or 7; 0x111a: 31 or 32) | the lowest candidate is taken, the candidates are in a comment beside it |
| [I] estimate kept | 19 girl sets, 12 monster sets | no hit signal found: the end of the `attack1_00` clip stays, labelled an upper bound |
| [M] measured, new | Darkness (effect 844) 83 steps; every item 80 steps | `MEASURED_EFFECT_STEPS[844] = 83` (81 from the begin event, which comes 2 steps after release; one cast, two targets, both hit in the same step); `ITEM_EFFECT_STEPS = 80` (a Potion, three casts, 79, 79, 80). An item's ability carries a casting countdown, so a Potion's span is exactly 80 (a test pins it). |
| [M] measured, unchanged | Fire 75 (read twice now: 2026-10-09 and 2026-10-19, both unhasted); Umbral Gaze 94; Strength Up 84 | |
| not entered | Hayate 77 (row 0x307c, effect 834), the Dark Knight dress change 38 (Berserker 80), Haste's duration 789 steps | measured, but the engine takes them from the class default or models no span for them; entering them is a later step |

Hit times and the spans they give, old (first version) to new (steps; 29.97 a second):

| Body | Hit, old (clip end) -> new | Plain Attack span, old -> new |
|---|---|---|
| Yuna, Mascot | 8 -> 12 | 61 -> 65 |
| Rikku, Mascot | 6 -> 4 | 53 -> 51 (Hasted 27 -> 26) |
| Paine, Mascot | 10 -> 11 | 58 -> 59 |
| Nooj | 16 -> 17 | 16 -> 17 (0.53 s -> 0.57 s) |
| the Oversoul Paragon | 138 -> 33 | 178 -> 73 (5.9 s -> 2.4 s: its idle wait 40 + the swing up to the hit) |
| Trema | 10 -> 6 | 66 -> 62 |
| Tawrich | 32 -> 34 | 32 -> 34 |
| Bahamut | 43 -> 41 | 43 -> 41 |
| Leblanc | 3 -> 8 | 17 -> 22 |

A multi-hit command is still taken at its **first** hit, not its last (an estimate, a few frames at most for these bodies). The measurement-arm names in `ActionSpanKnobs.monsterHit` are now `'read'` (production), `'estimate'` and `'half'`; the last two ignore the read frames (they are the earlier clip-as-hit sensitivity arms and are not used here). Hand checks and new tests: `tests/unit/ffx2-action-span.test.ts` (25 tests; Yuna 65, Rikku 51 and Hasted 26, Paine 59, Bahamut 41, Leblanc 22, Trema 62, a body with no hit read keeps its clip, Darkness 83, a Potion 80).

### 9.2 Does the engine's action time include a wait in the game's queue before a cast begins? No.

From the code: each unit counts its **own** `gauge.executing` countdown (`logic-step.ts`, `execute.ts#finishAction`), "which every other gauge ignores" (`action-time.ts`); there is no shared action manager, so an action begins the step it is chosen (a cast, the step its countdown ends) and its span is its own length only. The live session saw a Darkness sit **53 steps in the manager's queue before it began** (and the HP cost paid when it began), most likely behind a monster's Umbral Gaze (consistent, not isolated; the same 114-step reading of 2026-10-09 is the other sighting). So **a real cast can wait behind another action's effect, once measured at 53 to 57 steps (1.8 to 1.9 s); the model has no such wait, and none was built.** The direction of the error is that real casts are slower than the model's when a monster is casting at the same time, which would favour the bosses; the size is unmeasured. (Also stated in the header of `action-span.ts`.)

### 9.3 The six chapters, old and new (500 seeds per cell; base = the switch OFF, unchanged; old on = section 4; new on = this rerun)

Whole-chain first-try wins of 500. "change" is against the base.

| Chapter | Wait pace (human): base -> old on -> new on | change old -> new | Active: base -> old -> new | change | Bench: base -> old -> new | change |
|---|---|---|---|---|---|---|
| V Vegnagun and Shuyin | 463 -> 489 -> 490 | +26 -> +27 | 417 -> 468 -> 459 | +51 -> +42 | 482 -> 497 -> 489 | +15 -> +7 (p=0.17) |
| VI Leblanc | 500 -> 500 -> 500 | 0 -> 0 | 472 -> 500 -> 497 | +28 -> +25 | 500 -> 499 -> 500 | -1 -> 0 |
| X Trema | 288 -> 378 -> 357 | +90 -> +69 | 167 -> 337 -> 302 | +170 -> +135 | 336 -> 410 -> 363 | +74 -> +27 (p=0.046) |
| XII Den of Woe | 498 -> 371 -> 376 | -127 -> -122 | 452 -> 488 -> 483 | +36 -> +31 | 499 -> 497 -> **384** | -2 -> **-115** |
| XIV Tourist Trap | 423 -> 483 -> 481 | +60 -> +58 | 339 -> 466 -> 460 | +127 -> +121 | 464 -> 483 -> 484 | +19 -> +20 |
| XVI Angra Mainyu | 383 -> 490 -> 491 | +107 -> +108 | 24 -> 369 -> 348 | +345 -> +324 | 447 -> 496 -> 500 | +49 -> +53 |

Every new cell except Leblanc at the Wait and bench paces (no move) and V at the bench pace is significant at p below 0.05 by the sign test of the seeds that changed (new column: V 5 lost / 32 gained, Trema 64 / 133, Den of Woe 123 / 1, Tourist Trap 10 / 68, Angra Mainyu 6 / 114, all at the Wait pace). What moved it (Wait pace, base -> old -> new, per seed):

| Chapter | party KOs | minutes | enemy actions | mean span of a girl's action (s) | mean span of a boss's action (s) |
|---|---|---|---|---|---|
| V | 1.7 -> 1.1 -> 1.2 | 4.1 -> 5.2 -> 5.6 | 73.3 -> 61.7 -> 66.0 | 2.14 -> 2.37 | 3.46 -> 3.43 |
| VI | 1.4 -> 1.7 -> 1.6 | 2.7 -> 3.7 -> 3.7 | 36.7 -> 42.0 -> 42.3 | 2.11 -> 2.16 | 1.79 -> 1.86 |
| X | 1.7 -> 1.5 -> 1.7 | 8.3 -> 9.9 -> 10.0 | 113.6 -> 154.2 -> 165.2 | 2.39 -> 2.62 | 2.51 -> 2.19 |
| XII | 0.6 -> 1.2 -> 1.1 | 1.3 -> 1.6 -> 1.6 | 18.9 -> 14.9 -> 14.9 | 2.49 -> 2.68 | 2.21 -> 2.21 |
| XIV | 0.8 -> 0.2 -> 0.2 | 2.4 -> 2.1 -> 2.1 | 29.0 -> 23.8 -> 23.9 | 2.46 -> 2.64 | 2.94 -> 2.81 |
| XVI | 4.1 -> 1.0 -> 1.1 | 8.3 -> 6.7 -> 7.0 | 115.1 -> 71.4 -> 76.1 | 2.43 -> 2.60 | 4.50 -> 4.50 |

**What changed and why, in player words.**
- **A girl's action got longer by 0.05 to 0.23 s** in every chapter: Darkness is 83 steps, not Fire's 75; a Potion is 80; Yuna's and Paine's Attacks land 1 to 4 frames later. A boss's cast did not change (the 94-step estimate and the idle wait are unchanged; Angra Mainyu's Full-Life and Tawrich's Punch still hold them 4.5 s). So the girls lose a little of the head start the first version gave them: **V, Active and bench gains shrink by 8 to 9, Angra Mainyu at Active by 21 (345 -> 324 of 500, from a base of 24), Tourist Trap by 2 to 6.** None changes direction.
- **Trema got smaller (Wait +90 -> +69, Active +170 -> +135, bench +74 -> +27).** The first version held the Oversoul Paragon for its whole 138-frame swing (5.9 s) on every Attack; the motion data says it lands at frame 33, so it now holds 2.4 s and strikes again about as often as it did with no action time (the bosses of this chain act 113.6 times a fight with no action time, 154.2 in the first version, 165.2 now, at the Wait pace). The girls' hold is also a little longer. At the bench pace what remains is the 3-second flat time giving way: only +27 (p=0.046).
- **Leblanc's** own Attack hits later (frame 8, not 3), so it is 22 steps, not 17; nothing moves at the Wait pace (500 of 500), +25 at Active.
- **Den of Woe at the bench pace went from -2 to -115 of 500.** Not new code and not a new rule: Darkness is 8 steps longer than the Fire-based guess, which shifts the Dark Knights' cast cycle by 8 steps, and 8 steps is enough to move it from where the first version's bad zone was to where the bench pace sits (9.5).

### 9.4 Sensitivity left in (200 seeds, Wait pace; every effect length, the measured ones included, times 0.8 and 1.25)

| Chapter | base | on (measured) | effects x0.8 | effects x1.25 |
|---|---|---|---|---|
| V Vegnagun and Shuyin | 184 | 196 | 195 | 195 |
| X Trema | 114 | 131 | 143 | 144 |
| XII Den of Woe | 199 | 152 | 151 | 157 |
| XIV Tourist Trap | 170 | 191 | 193 | 196 |
| XVI Angra Mainyu | 142 | 196 | 199 | 197 |

The four gains keep their sign under a 20 percent shorter or 25 percent longer set of effects (the unmeasured Cure, Full-Life, Punch and the enemy casts sit in this range); Den of Woe keeps its loss (-42 to -48 of 200). The run-up and the idle break (both still estimates) were varied only in the first version's arms (no chapter moved more than 14 of 200).

### 9.5 Den of Woe: the menu-pace sweep again (200 seeds, whole chain, switch off -> on, measured values)

The Wait engine, 1.5 s of menu per decision split into a **running** part (the top list; the clock runs) and a **held** part (a submenu; the clock is held), as in 4.4. 0 / 0 is no menu time at all (the bench pace). "old on" is 4.4's table (Darkness on Fire's 75); the base is unchanged.

| running / held (ms) | base | old on | **new on** | new lost / gained |
|---|---|---|---|---|
| 0 / 0 (bench) | 200 | not run (500-seed bench: 499 -> 497) | **160** | 40 / 0 |
| 0 / 1500 | 200 | 199 | **160** | 40 / 0 |
| 50 / 1450 | 200 | not run | **160** | 40 / 0 |
| 100 / 1400 | 200 | 189 | **134** | 66 / 0 |
| 250 / 1250 | 200 | 150 | **139** | 61 / 0 |
| 500 / 1000 (the "human" pace) | 199 | 146 | **152** | 48 / 1 |
| 750 / 750 | 198 | 185 | **197** | 3 / 2 |
| 1000 / 500 | 199 | 199 | **200** | 0 / 1 |
| 1250 / 250 | 191 | not run | **197** | 3 / 9 |
| 1500 / 0 (all running) | 181 | 198 | **195** | 4 / 18 |

Averaged over the six Wait splits from 0 to 1000 ms (0, 100, 250, 500, 750, 1000): **-36 of 200 (-18 percent) with the measured values, against -21 (-11 percent) in the first version; the worst point -66 (was -53)**, and the bad zone (losses of 20 or more) now covers the top-list times from 0 to 500 ms (the bench pace included) instead of 250 to 500 ms; from 750 ms up it is level. The 500-seed cells above (human 498 -> 376, bench 499 -> 384, Active 452 -> 483) agree with these 200-seed ones.

- **Why (the same lock as 4.2, moved by 8 steps).** The Dark Knights' Darkness-to-Darkness cycle was 211, 216, 228, 237, 246 and 262 steps at 0, 250, 500, 750, 1000 and 1500 ms of running menu time with Darkness on 75 steps; Darkness is now 83, so each is 8 longer (219, 224, 236, 245, 254, 270, [I] by that arithmetic, not re-measured from event logs), and Nooj's cast cycle (Rippling Chroma and Greedy Aura 7.4 s apart, unchanged: his casts are still the 94-step default, only his Attack moved from 16 to 17 frames) did not move. The worst zone follows the Dark Knights' cycle, which is where 4.2 said it would sit once Darkness was measured. The bench pace's cycle (219) lands inside the zone the first version's 500 ms pace (228) was in.
- **Does a 2-step uncertainty in Darkness matter?** No: with Darkness at 85 (the live report's own 84 to 85 if the begin gap is as long as the 4 steps its one cast showed after the manager's state change), 200 seeds: 0/0 154 (160), 250 ms 136 (139), 500 ms 157 (152), 750 ms 199 (197), all running 193 (195); the shape is the same (overlay on the measured constant; no file changed).
- **What removes it (overlay, no file changed): the scripted line drinks its Hero Drink earlier.** `DRINK_FROM` in `src/engine/tactics/ffx2-den-of-woe.ts` ("our line, not data") from 4,500 to 12,000, switch on against switch off **on the same line** (200 seeds): bench 200 -> 200, 250 ms 200 -> 198, 500 ms 200 -> 195, 750 ms 199 -> 198, 1000 ms 200 -> 199, all running 200 -> 194, **Active ATB 200 -> 194**. Level with the base at every pace tried, the worst -6 of 200; and the base on that line is better than on today's at the all-running pace (200 against 181). **This is a change to what the fight asks of a human (drink when Nooj is at about half his health, not when he is nearly down), a content/tuning change that needs Bailey's separate yes (AGENTS.md rules 6 and 10); I did not make it.**

### 9.6 Proofs

| Proof | Result |
|---|---|
| Switch OFF is identical | the 60 pinned digests of the pre-lane base (`tests/fixtures/parity/ffx2/action_span_off.json`, `ffx2-action-span-off.test.ts`) pass; and a 12-seed spot check against `586ede9a5` (the three changed files rebuilt from that commit and mapped in-process, no worktree or copy): 4 chapters (Vegnagun and Shuyin, Trema, Den of Woe, Angra Mainyu) x seeds 1 to 12 x 3 paces (Wait, Active, bench) = **144 of 144 chain-plays identical** (110 victories and 34 defeats among them). The overlay is live: with the switch ON, Trema at the Wait pace, 6 seeds, gives 84,918 party span steps on `586ede9a5` and 61,789 on the tip. |
| Goldens unchanged | `ffx2-atb-golden` (6), `ffx-engine-golden` (18), `ff7-golden` (3) pass |
| Types, tests | `tsc --noEmit` clean; `ffx2-action-span` (25), `ffx2-action-span-off` (60 pins) and all eight `data-ffx2-*` files (2,234 tests, the citations test green with the new `§` references) pass; 2,288 tests in the 14 files run together |
| Nothing else | no new module (`orphans.mjs` not affected); `action-frames.ts` 322 lines, no source file near 400 |

### 9.7 Decision for Bailey, updated

| | State |
|---|---|
| The switch | `ACTION_TIME_PER_COMMAND = false`; turning it on is one line |
| Measured now | Fire 75 (twice), Darkness 83 (one cast, two targets), a Potion 80, Umbral Gaze 94, Strength Up 84; the first-hit frame of 53 body sets' Attacks (read from the game's motion data) |
| Still estimated | every other effect length (75 for a girl's, 94 for an enemy's: Cure, Full-Life, Punch, Nooj's three casts, every item but the Potion); the hit time of 31 body sets (clip end); a multi-hit command taken at its first hit; the run-up (a lower bound); the idle break (half a clip); whether Haste shortens an effect (the data says only the throw wait should); a cast's wait in the game's queue (9.2, not modelled) |

**Recommendation: ON now, as provisional, with one decision attached.** Why: the three measurements that were the most-used guesses (Darkness 35 to 41 percent of all actions in four of the six chapters, the Paragon's swing, the girls' Attack) are numbers now, and none flipped a sign; the four gains (V, X Trema, XIV, XVI) hold at all three paces and under a 20 percent shorter or 25 percent longer set of effects; Active ATB, where most of the fights were easier to lose, gains in every one of the six (+25 to +324 of 500). **The attached decision is Den of Woe:** the scripted line loses 23 to 24 percent of 500 at the Wait and bench paces with the switch on (and gains 31 at Active), and the loss disappears if the line drinks its Hero Drink at 12,000 HP (9.5). So the choices are:
- **A. ON, and the Den of Woe line drinks earlier in the same release** (the recommended pair; the line change needs Bailey's separate yes, and the guide that teaches it changes with it);
- **B. ON alone:** four chapters easier, Den of Woe harder at the Wait pace (the changelog says so);
- **C. MEASURE MORE first:** the one reading that would most change the Den of Woe answer is Nooj's Rippling Chroma and Greedy Aura (his cast cycle sets where the bad zone sits); the one that most changes the biggest gain is Angra Mainyu's Full-Life and Tawrich's Punch (about a quarter of that chapter's actions, today the 94-step default);
- **D. OFF:** nothing changes; Angra Mainyu stays at 24 of 500 on the Active clock.

The honest uncertainty: Den of Woe's size rests on Nooj's three casts (estimated) and on Darkness measured once at two targets (a 2-step change does not move it); the queue wait (9.2) is unmodelled and would favour the bosses. The Paragon's hit is read from the data, not watched in a live fight.

### 9.8 Live readings still owed (the plan's "AFTER SESSION 5")

1. **Cure** (effect 110): neither Mascot girl's menu has a White Magic row; needs a girl in a White Mage dressphere (and then Curaga, Esuna, Protect are neighbours that need their own reading unless the effect modules are decoded).
2. **A Hasted Fire:** Hayate, then Fire inside 26 s (Haste lasted 789 steps = 26.3 s at ratio 512); expected about 6 steps shorter than 75 (the throw wait only, `FFX2-G12` 6); settles whether Haste shortens an effect.
3. **Angra Mainyu's Full-Life** (effect 116).
4. **Tawrich's Punch** (effect 758, the block-player module `FFX2-G12` could not decode).
Also useful: a **one-target Darkness with nothing queued** (separates the two-target caveat and the 2-step begin gap from the 83), an item other than the Potion, and Nooj's Rippling Chroma and Greedy Aura (if Den of Woe's size is to be trusted).

### 9.9 How this was run

Files (outside the repo, per-lane scratch deleted at the end; the result rows below are reproducible from the commit): the generator `D:\Tools\ffx-parity\coverage\ffx2\FFX2-G11\gen_action_frames.py` (now also reads `FFX2-G12\hit-roster.json`; `python -I gen_action_frames.py <repo> <ids.out> <out.ts>`, `ids.out` from `D:\Tools\ffx-parity\rc10\x2-action-time\proof\`); the 500-seed cells are `tests/unit/ffx2-action-span-measure.test.ts` (arm `on`; the base rows are the first version's, unchanged because the switch is off); the Den of Woe sweep and the two overlays use the menu-split harness of the independent check (`rc10/xa6-check-evidence/variants/den.test.ts`). Two vitest workers at most; the game was not run.
