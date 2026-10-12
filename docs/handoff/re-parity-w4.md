# Re-parity W4: the FFX-2 engine runs on the game's logic step, its gauges, charge and recovery, Delay, and status clocks

Status: **built and committed on branch `re-parity` (pushed), not merged, not deployed** (2026-10-10). Track `re-parity`
([plan](../plans/re-parity.md), [paper preflight](../plans/re-parity-review.md) row W4, method: [re-parity-w1](re-parity-w1.md), the W3
handoff [re-parity-w3](re-parity-w3.md) before it). Owner: Bailey. **Game case: FFX-2 only** (AGENTS.md rule 14). Nothing under `src/battle/ffx`,
`src/data/ffx`, `src/battle/ff7` or `src/data/ff7` is in these commits, `ffx-engine-golden` and `ff7-golden` pass unchanged, and
`src/app/SaveData.ts` is byte-identical to the base (section 9, "Save data").

Bailey, 2026-10-08, the ask this track answers: "It needs to be a 1:1 parity." 2026-10-09: "Your findings need to be implemented into live builds as the
decompilation work progresses." 2026-10-09 (his answer on timing): the timing session in FFX-2, "Yes, now".

Base: `931613a8` (= `origin/re-parity-rc1`, the code of live release 39.4.3). Commits, all on `re-parity`:

| Commit | What |
|---|---|
| `1c322352` | Data and contract: every command row the seven chapters can run carries `costAtb` (`Cmd+0x22`), `costCast` (`Cmd+0x24`) and `magicCancel` (`Cmd+0x7a`); `StatusInstance` gains `counter` and `accumulator`; the shared types document the game's units and the logic step; the CONTRACT-CHANGES entry; `research/re-ffx2-atb-status.md` section 10 |
| `51a1e59e` | The engine: the logic step, the gauges, charge, recovery, thinking, the opening, Delay, the magic cancel, the knock-out reset, the status clocks (new `clock.ts`, `atb-engine.ts`, `atb-open.ts`, `logic-step.ts`, `status-clock.ts`, `lookahead.ts`; `menu-cancel.ts` and the old arithmetic deleted) |
| `1b168572` | Speed only (the step loop reads statuses without rebuilding the kernel tables) and one fix (a cancelled cast recovers by its own command's ATB cost) |
| `66acd262` | The engine-level parity tests: the engine against an independent oracle of the game's ATB and status process |
| `d12641f8` | Benches, harness and fixtures that turned ticks into seconds or built a unit by hand |
| `33e6cf59` | Every FFX-2 test and golden that moved, each with its cause in the file |
| `29bfd7f2` | The facts the mutation check found the generated battles could not see (Berserk pick, Regen payout, the HUD bar, the opening's draw ranges, the trim) |
| `d98751ec` | One advisor case the full-suite run found: a held Phoenix Down needs a chained confirmer at the game's gauge, so the case chains her as `advisor-v3-final` does |
| (this note) | `docs/handoff/re-parity-w4.md` |

## What the engine does now

The clock is the game's **logic step**, 29.97 a second (60 / 1.001 / 2, measured on Bailey's running game on 2026-10-09,
`research/re-ffx2-timing-measured.md` section 3), and the Config ATB speed is the game's 70 / 95 / 120 units a step; the 3,000-ticks-a-second clock and
its x0.746 / 1 / x1.262 factors are gone. `FFX2Engine.tick(ms)` turns real milliseconds into whole steps (the remainder waits for the next call) and
runs `logicStep` (`logic-step.ts`) once per step, in the game's order (`pp_battle_logic_step`, exe 0x0061e440):

1. the chain windows (they stand in for the game's hit reaction, as in W3);
2. the ATB process (`kernel/atb-tick.ts`): the three speeds of every character (Haste x21/20, Slow /2, zero when stopped, asleep or petrified, halved only
   in a hit reaction), recovery, thinking, the ready list (lowest counter first), Defense cleared when a recovery ends;
3. the action dispatcher: a command in its action time counts down, then every cast on the purple bar counts down at its caster's full tick and fires
   in the step its counter reaches 0;
4. the status process (`kernel/status-timers.ts`): the counters of 1,500 units, the Sleep / Confusion / Berserk timers, Poison and Regen at 16,000 units for
   `(8 x max HP) >> 8`, Doom, Auto-Life.

The step does not choose a command. A girl's menu, a monster's script and a Berserked girl's pick are answered by the engine after the step, in the game's
ready-list order. A command ends (for the gauge) when the engine resolves it, plus the action time when one is on (`action-time.ts`, an estimate, off by
default); `completeCommand` is `MsCommandComplete`: the recovery is the ended command's `cost_atb x 10000 / (AGI + 1)` plus the Delay carry, and a monster adds
30 steps for every fallen girl. Casting is `cost_cast x 10000 / (AGI + 1)` counted down at the full tick (the halving never happened on the running game).
Delay is `apply_atb_damage` (flat 4,000 or 8,000 ATB damage that sets a recovering or thinking unit back, closes a ready girl's menu, banks into the next recovery
of a unit that is executing, lengthens a cast on the bar), the magic cancel is `magic_cancel`, the opening is `MsChrAtbInit` / `MsCalcFirstAttack` with the
two-thirds trim, and a knock-out is `MsChrAtbInit(chr, 1, -1)`.

The method is W1's: **one engine draw per kernel draw**, every input of every kernel named with the engine field it comes from (section 1), nothing defaulted
silently, the replaced code deleted (section 3), and an engine-level parity test against an oracle that runs the kernels the way the game does (section 4).
`atb-engine.ts` is the one place engine state becomes the kernels' inputs and their answers become engine state.

## 1. Every kernel input and its engine source

W1's method: an input the engine cannot supply is never defaulted silently. It is either data added from the game's tables (the cost fields of
the command rows) or a constant whose reason is in its row below. `atb-engine.ts` is the one place engine state becomes the kernels' inputs and
their answers become engine state; `atb-open.ts` does the same for the battle's opening and `status-clock.ts` for the status process.
"Chr+0x..." names the field of the game's character the engine field stands for (`research/re-ffx2-atb-status.md`).

### The ATB process (`kernel/atb-tick.ts` `atbTick`, `kernel/atb-clock.ts` `atbSpeeds`; `atb-engine.ts` `kernelUnit`, `runAtbProcess`)

| Input | Engine source |
|---|---|
| slot id (the visiting order, the stream selector) | `assignSlotIds`: the party 0.., the enemies 15.., each side by its `slot` then its position; `Ffx2Gauge.slot` |
| `atbEnabled` | always true: every unit in `units` takes part (the game disables the slots nobody stands in) |
| `inBattle`, `dead` | `!unit.removed`, `!unit.alive` |
| `condemned` (`Chr+0xe67`, a Doom victim waiting for Death) | always false: the engine KOs a Doom victim in the step the counter runs out, where the game queues Death (command 0x3026) and plays it a few steps later |
| `held` (`Chr+0xe72`, a dress change holds the gauge) | always false: the engine's dressphere change resolves at once and ends with the Attack row's recovery |
| `state` (`Chr+0xe68`) | `Ffx2Gauge.state` |
| `recovery` (`Chr+0x9d8`) | `AtbState.recovery` |
| `thinking` (`Chr+0x9f4`), `thinkingTick` | `Ffx2Gauge.thinking`; the tick is the game's fixed 1 |
| `pendingAnimation`, `motion` (`Chr+0x669`, `Chr+0xd96`: the ready test) | always false: motion-system flags the engine has no equivalent of |
| speed: Haste, Slow (`Chr+0x43c`, `+0x43d`) | the unit has the status (`haste` and `slow` exclude each other in `applyStatus`, as the game's status recompute does) |
| speed: stop state (`MsStatCheckStop`) | `stopStateOf`: asleep 4, petrified 2, Stopped 1 |
| speed: charging halving (`Chr+0xd65`) | always false: the flag stayed 0 through all 7 charge countdowns on the running game (`research/re-ffx2-timing-measured.md` section 6) |
| speed: hit reaction (`Chr+0xd98`) | `Ffx2Gauge.hitReaction > 0`: started at 15 steps (`HIT_REACTION_STEPS`) by a damaging hit that opens or extends a chain window; see section 7, item 1 |
| speed: Damage-Not-Stop (`Chr+0x3a6` bit 1) | the monster row's special-flag word & 2 (`specialWord`); the party has no row, so its bit is 0 (a girl always flinches) |
| `mode` | girl 1, monster 2 (no player-side monsters in the seven chapters) |
| `berserk` | a Berserked GIRL is handed the Berserk pick (state 8); a Berserked monster keeps running its script, as before W4 |
| `confused` | always false: Confusion's own pick (state 7) is not modelled (W3 handoff section 7 item 7); a confused girl keeps her menu |
| Config speed and the clock flags | `baseSpeedOf(speed)` (70 / 95 / 120); `FFX2_CLOCK_OPEN` (running, no pause); the Wait flag stays the engine's own hold (`active.ts clockHeldByMenu`) outside the step, where the game stops the clock |
| the hand-off requests (`MsActionRequest`) | answered "no command yet": a girl's menu opens (4), a monster waits for its script (5); the engine then decides, in the ready list's order (`Ffx2Gauge.readyKey`) |

### Command end, thinking (`kernel/atb-gauge.ts` `commandComplete`; `atb-engine.ts` `completeCommand`)

| Input | Engine source |
|---|---|
| `costAtb` (`Cmd+0x22`) | `adapt/command.ts commandCosts`: the row's `costAtb` (a derived row, for an ability with no game row: its own 70 or 140 for `2xRT`). Not from a row: a spherechange, an Escape, a Defend, a Trigger and an AI turn that played no command end with the Attack row's 70 (`ATB_BASE_VALUE`); the dressphere change's own cost was not read |
| `agi` (`Chr+0x39a`) | `statByte(stats.agi)`, 0 to 255 |
| `carry` (`Chr+0x9e0`) | `Ffx2Gauge.carry` (Delay taken while executing) |
| thinking base `T` (`Chr+0x9f8`) | 0, the game's value in play, so no thinking draw is ever made (the draw callback throws if asked) |
| monster party counts (`pp_btl_get_stat`) | `partyCountsOf`: the first three party units, "in battle" = not removed, "standing" = alive and not Petrified |
| when the command ends | the moment the engine resolves it, plus `gauge.executing` logic steps when an action time is on (`action-time.ts`, off by default); the game plays its animation first (section 7, item 2) |

### Charge, Delay, magic cancel, knock-out (`kernel/atb-gauge.ts` `chargeTime`; `atb-interrupt.ts`; `atb-start.ts` `atbInit`)

| Input | Engine source |
|---|---|
| `costCast` (`Cmd+0x24`) | the row's `costCast`, stored as 0 for a row whose caster animation is not a cast class (only Mix, 0x3058); derived rows keep the 16 / 26 / 39 tiers |
| cut entries (`Chr+0x5b0..`) | one entry naming the command with the girl's Garment Grid "wait down" percent (`waitDownPercent`), applied to every cast of hers; the auto-ability tables that say which commands each gate covers are not decoded |
| the countdown tick | the caster's own `gauge.speeds.tick` (the full tick); gate open; battle-end pending false (the engine checks the end after each step) |
| `apply_atb_damage` target state | `state`, `recovery`, `recoveryMax`, `carry`, `charging` (the unit has a cast on the bar), `chargeRemaining`, `chargeMax`; `chargeReleased` always 0 (a due cast fires in the step it comes due, so none waits on the bar) |
| the Delay amount | the damage pipeline's ATB class result (`resolve-strike.ts`: `settled.atb`; flat 4,000 or 8,000 for a row with the Delay bits, a percent of the target's current wait for the monsters' Slow row) |
| `magic_cancel` | the row's `magicCancel` (`Cmd+0x7a`); target immune = special word bit 9; the target's action is "a cast of class 2 to 4 not yet released" exactly when it has a cast on the bar; draw from the attacker's stream (`critDraw`, 0..99) |
| knock-out reset (`MsChrAtbInit(chr, 1, -1)`) | `resetGaugeOnKo`: costAtb 70, random start off, thinking base -1, no Initiative; one draw (0..63), from the unit's own stream, made whether it is used or not |

### The opening (`kernel/atb-start.ts`; `atb-open.ts openBattleGauges`)

| Input | Engine source |
|---|---|
| per-character init `(chr, 0, 0)` | every unit in slot order, party first: costAtb 70 (the Attack row), carry 0, `randomStart` (false only for a continuation link), dead or Petrified, `lead` false (Initiative is an auto-ability the engine does not model), monster or not; one draw `rng.int(0, 63)` standing for `draw & 63` |
| the preemptive / ambush result | preset by the setup's `condition` (`'preemptive'` 1, `'ambush'` 2); for `'normal'` rolled only when `Ffx2EngineOptions.rollFirstAttack` is on (default off: section 7, item 3); First Strike count 0 (auto-ability not modelled); the sides' average Agility bytes; two draws `rng.int(0, 255)`; then 31 reset draws `rng.int(0, 15)` for all 31 slots in order |
| the opening trim | every unit's slot, ATB-enabled, in battle, not dead, not Petrified, with its recovery |
| a continuation link (`condition: 'scripted'`, not a separate battle) | every wait whole and no trim, as it always opened ("zero"): the sources do not say what the game does there |

### The status process (`kernel/status-timers.ts` `statusProcess`; `status-clock.ts timerChr`)

| Input | Engine source |
|---|---|
| status word 1 (`Chr+0x434`), the applied mask (`Chr+0x450`) | `statusWord1`; applied = the group 1 statuses that carry a timer |
| timers (`Chr+0x454 + 4i`) | `StatusInstance.ticksRemaining` of Sleep (150,000), Confusion and Berserk (200,000) |
| counters (`Chr+0x4b4 + i`), accumulators (`Chr+0x4cc + 2i`) | `StatusInstance.counter`, `.accumulator` of the group 2 timed statuses |
| Poison / Regen accumulators, periods, damage | `Ffx2Gauge.poisonAcc`, `regenAcc`; 16,000 / 16,000 and 8 / 8 from `FFX2_STATUS_ROM` (`rom.bin`); the Regen byte is the status' counter (or 1) |
| max HP | `stats.maxHp` |
| raw, awake and active speeds | the speeds the ATB process wrote earlier in the same step (`Ffx2Gauge.speeds`) |
| stop state | `stopStateOf`; `condemned` false (see above) |
| what a landed status starts | `statuses.ts clockFor`: Sleep / Confusion / Berserk get their `off_count` whatever the command said; a timed group 2 status gets the counter the kernels computed from the command row's amount (1 to 125); an application with no amount is "until cured" (no clock); a Poison or Regen that appears draws its first-tick phase `rng.int(0, 4000)` (`resolve-status.ts`, `MsSetStatus`) |
| the expiry and payout effects | an expiry removes the status (event `status-remove`, reason `expired`); a lost count is a `status-tick` event; a Poison payout is damage through `applyHpDelta` (it can KO), a Regen payout `heal(..., 'regen')`; Doom running out KOs the victim at once |

## 2. Data added

The kernels needed two numbers of every command that the damage rows of W3 did not carry. They were read from the same Steam files as the rest of the row
(`command.bin` for the party's commands, the item table for the items, `monmagic.bin` for the monsters'), at the offsets
`research/re-ffx2-atb-status.md` section 3 names, and are pinned numbers-only (rule 8) in `tests/fixtures/parity/ffx2/command_rows.json` (205 rows: 24 items,
77 party commands, 104 monster commands).

| Field | Game field | What it does in the engine |
|---|---|---|
| `FFX2CommandRecord.costAtb` | `Cmd+0x22` | the recovery the command leaves: `costAtb x 10000 / (AGI + 1)` (Attack 70, every item 40, Steal 50, Trigger Happy 120, the Warrior's Breaks 0, the party's spells 0, the monsters' commands 20 to 200, mostly 100) |
| `FFX2CommandRecord.costCast` | `Cmd+0x24` | the cast: `costCast x 10000 / (AGI + 1)` counted down at the full tick (Fire, Fira and Firaga are all 70; the monsters' casts run from 20 to 160); stored as 0 for a row whose caster animation is not a cast class (only Mix, 0x3058) |
| `FFX2CommandRecord.magicCancel` | `Cmd+0x7a` | the chance, out of 100, that a hit of this row aborts a cast on the bar |
| `StatusInstance.counter`, `.accumulator` | `Chr+0x4b4+i`, `Chr+0x4cc+2i` | a group 2 timed status' counter (1 to 125) and the units banked toward the next count; `ticksRemaining` of a Sleep, Confusion or Berserk is the game's 150,000 / 200,000 / 200,000 timer |

`tests/unit/data-ffx2-command-records.test.ts` pins every attached record against the fixture word for word, pins the rows the chapters lean on
(Attack 70 / 0, Fire 0 / 70, an item 40 / 40, Steal 50 / 0, Trigger Happy 120 / 0, the four Breaks 0 / 70), checks that Mix is the only row with a cast cost that
never charges, and that every record the engine can run carries both costs. A record built by the engine itself (an ability with no game row) keeps its own recovery
(70, or 140 for `2xRT`) and its 16 / 26 / 39 charge tier; no command a chapter runs lacks a row. `AtbState`, `chainWindowTicks`, `elapsedTicks` and `BattleState.ticks`
keep their names and now mean the game's units and logic steps: the CONTRACT-CHANGES entry of 2026-10-10 lists every field and every export that left the `ffx2` index.

## 3. Engine code replaced and deleted

No parallel path is left. Deleted: `menu-cancel.ts` (the "only a Delay hit closes a menu" switch), the old gauge arithmetic of `gauges.ts` (240 lines to 98: the
fill-and-bank gauge, the x4.16 bank, the charge tiers as a rate, `applyDelayEffect`, `applyActionCancel`), the old status clocks of `statuses.ts` (296 to 217:
`durationToTicks`, `advanceStatuses`, `ticksUntilStatusEvent`, the 0.53 s duration unit), `payStatusClocks` and `notifyRegen` (`engineHooks.ts` 295 to 237), the
look-ahead arithmetic of `active.ts` (`closesOpenMenu`, `substepTicks`, `soonestEventTicks`; 322 to 252), and the constants they fed (`constants.ts` 244 to 210:
`TICK_RATE_BASE`, `ATB_SPEED_MULTIPLIER`, `STATUS_CLOCKS_HELD_AT`, `BAR_INTERNAL_MAX`, the Haste and Slow multipliers, `SLOW_CHARGE_VALUE_MULTIPLIER`, the
Poison and Regen constants, `MENU_CANCEL_ONLY_DELAY_ABILITIES`). The engine's own hidden statuses `delay-effect` and `action-cancel` (one `% 101` draw each in W3's
note) are gone: the game's Delay is the ATB class. New: `clock.ts` (49 lines), `atb-engine.ts` (323), `atb-open.ts` (126), `logic-step.ts` (85), `status-clock.ts` (176),
`lookahead.ts` (87). Mirrors that follow: `intent.ts` names the next enemy in the ready-list order and reads `gaugeSteps`; `resolve-hp.ts` resets a knocked-out unit's gauge;
`resolve-status.ts` and `statuses.ts` start the game's clock for a landed status; `adapt/command.ts` supplies the two costs; `src/ui/common/resultsMath.ts` converts a
result's tick count at the logic step. Source files stay under 400 lines except `intent.ts` (733 lines before, 740 now: +7 for the ready-list order; it was already
over) and the contract file `types.ts`.

## 4. Tests: new, changed, and why

Every changed expectation carries a comment in the test itself that starts "Re-parity W4" and gives the cause. None was loosened to pass: each pin that moved is
either the game's answer where the old test pinned our authored number, or a seed whose story changed with the gauge (a seeded replay is a different replay, not a
different rule).

### New

| File | What it proves |
|---|---|
| `tests/unit/parity-ffx2-engine-atb.test.ts` with `helpers/ffx2AtbRig.ts`, `helpers/ffx2AtbOracle.ts` | **250 generated battles** (three girls on a real build at level 10 to 99, one to three monsters of Agility 5 to 255, the three Config speeds, an opening of any condition, scripts of commands with ATB cost and cast cost, an action time of 0, 1.5 or 3 s, and happenings between steps: a status lands or is cured, a Delay hit, a hit that flinches) are played through the real `FFX2Engine`, one logic step at a time, and through an oracle that runs the kernels the way the game does (`atbTick`, `commandComplete`, `chargeTick`, `applyAtbDamage`, `statusProcess`, written from the game's terms) and imports nothing from the engine's gauge, opening, step or status-clock modules. After EVERY step the two traces must agree on every character's gauge state, recovery counter and maximum, thinking time, delay carry, tick, charge, action time, HP, Poison and Regen accumulators and status clocks, and on the events the clocks make (an expiry, a lost count, a Poison or Regen payout, a knock-out); the draws are checked too (both sides draw from the engine's seed in the order the game asks, so one draw too many or too few shows as a different opening or knock-out wait a long way on) |
| `tests/unit/parity-ffx2-engine-atb-hand.test.ts` (22) | hand-worked cases whose arithmetic is in the comments: the clock (60 / 1.001 / 2 steps a second, whole steps from milliseconds with the remainder carried), the speeds (70 / 95 / 120, Haste x21/20 truncated, Slow halved, zero when stopped), the recovery of Attack at AGI 41 (16,666 units, 176 steps), a cast of Fire at AGI 73 (9,459 units, 100 steps, then a recovery of 0), the girl's wait-down gate, thinking 30 steps per fallen girl, the opening and the preemptive and continuation openings, Shell 20 counts = 316 steps, Haste 20 = 304, the Sleep timer that lands exactly on 0 at Fast (never ends) against a Hasted sleeper (1,191 steps), Doom 5 counts = 422 steps (14.08 s), Poison and Regen's period, and Delay and the knock-out; the fast `stopStateOf` equals the kernel's `stopStateOfWord` for every mix of Sleep, Petrify and Stop |
| `tests/unit/parity-ffx2-engine-interrupt.test.ts` (9) | a damaging hit halves the target's tick for 15 steps (a monster whose row says reactions do not slow it still flinches but keeps its tick); Delay as the game does it: a ready girl's menu closed and her counter exactly 4,000 (as measured), the monsters' Slow row delays by her CURRENT wait, a girl with nothing left to wait is not moved, a plain hit leaves the menu alone; a hit with a cancel chance aborts a cast on the bar and the caster recovers by THAT command's own ATB cost (the fault of commit `1b168572`), a hit with none leaves it; Defense lasts until the recovery that follows it ends |
| `tests/unit/parity-ffx2-engine-lookahead.test.ts` | 80 generated battles: after every step nothing observable happens before `stepsUntilNextEvent` says it can (the look-ahead is a lower bound) |
| `tests/unit/parity-ffx2-engine-measured.test.ts` (2) | the live game replayed through the engine (`research/re-ffx2-timing-measured.md`): three weak Delay hits on a Hasted girl with her menu open leave the counter at exactly 4,000 and she is ready again after 48 steps (14 or 15 of them halved); a Hasted girl pays her recovery at 99 a step, 2,967 units a second |
| `tests/unit/parity-ffx2-engine-ready-order.test.ts` (4) | the ready list is served lowest recovery counter first, ties by slot (a girl at -10 and a monster at -85 in the same step: the monster) |
| `tests/unit/parity-ffx2-engine-roll.test.ts` | 700 seeds: the engine's opening says preemptive exactly when the game's formula does, on the engine's own two draws |
| `tests/unit/helpers/ffx2MenuCancel.ts` | tells the menu tests which abilities are the Delay ones (the deleted `menu-cancel.ts`' list, as test data) |

The wiring test of W3 (`parity-ffx2-engine-wiring`, 16 tests, with its rig and oracle) was extended: the oracle now models the knock-out reset (`pp_ko_resolve` calls
`MsChrAtbInit`, which draws once), the Poison / Regen first-tick phase draw (`MsSetStatus`), the group 2 counter of a timed status, and the ATB pool the Delay class
reads (`atb-engine.ts applyDelay`).

### Changed

| File(s) | Change | Cause |
|---|---|---|
| `ffx2-atb-golden`, `ffx2-hit-closes-menu`, `ffx2-menu-cancel-delay`, `chapters/den-of-woe-carry` | all hashes re-pinned once | section 8 |
| `ffx2-gauges`, `ffx2-atb-speed`, `ffx2-active-atb`, `ffx2-active-measure`, `ffx2-berserk-zero-rows`, `ffx2-spherechange`, `target-frame-hold`, `ffx2-wait-split`, `helpers/fallenAeonsUnits` | rewritten on the game's counters: "ready" is state 4 of the gauge, a recovery is a counter in units, the speed table is 70 / 95 / 120, a second is 30 steps at every speed (Fast takes more off each gauge per step, it does not run the clock faster), a dressphere change ends with the Attack row's recovery | the gauge is the game's |
| `ffx2-statuses`, `ffx2-status-locks`, `ffx2-chain`, `iter2-b1-rules`, `chapters/trema-fixes`, `chapters/den-of-woe-engine`, `chapters/fallen-aeons-ai`, `helpers/ffx2WiringRig` | durations are counters of 1,500 units; Sleep / Confusion / Berserk are timers on the raw speed; Regen pays max HP / 32 every 16,000 units (169 steps at 95 from phase 0); a chain window is 60 or 90 steps; PR-0108 ("Fast holds Sleep") is no longer a rule the engine states, it is the arithmetic of a timer that lands on 0; every ailment is timed by the game's clock with or without the group's old flag | status clocks are the game's |
| `ffx2-hit-closes-menu`, `ffx2-menu-cancel-delay` | the `closesOpenMenu` block is deleted; a Delay hit closes the menu AND pushes the gauge back (counter 4,000 or 8,000); the menu returns when it has run out | `apply_atb_damage`, measured on the running game |
| `ffx2-ability-flags` | the Charon line's decision cap 40,000 -> 2,500; two timeouts raised | the line ends in a stalemate when only Yuna is left (a White Mage with no Attack row heals more than Bahamut hits at the game's pace); 2,500 decisions are 65,000 steps, 36 game minutes, where the old line won in about 13 turns |
| `strategy-ffx2-bahamut` | mashing Attack into Defense 160 no longer loses reliably (Bahamut left with 647 to 3,157 of his 8,400, 1 of 30 seeds wins); the unmitigated Darkness line stalls undecided at 6,000 decisions on 30 of 30 seeds instead of being wiped; the researched routes re-measured | the party gets more swings in before the Mega Flare cadence; the lone White Mage outheals it (section 10) |
| `strategy-ffx2-leblanc`, `chapters/den-of-woe-bench`, `den-of-woe-options-bench`, `den-of-woe-ship-story`, `fallen-aeons-bench`, `chapters/trema-retry-flow`, `chapters/trema-options`, `chapters/trema-oversoul` | the careless Leblanc line wins one human-paced run (D = 1500, seed 15); the Den of Woe's ranking claims are recorded and no longer asserted (every cell is 72 to 100 of 100); the Sisters forgive the wrong line too; a retry runs 0 to 12 menus; the action time is the actor's own EXECUTING countdown in steps | measured, section 5 |
| `advisor-v3-final`, `advisor-v3-repair`, `enemy-intent`, `guide-advisor-target-agreement`, `ffx2-wait-split`, `ui-ffx2-battle-message` | seeds and boards re-found by running the engine (rule 3): the seed on which the held Megalixir or Phoenix Down is the only command in flight, link 3's board, Black Sky as Paine's first decision, the Pilfer Gil draw (870 now, 1,267 before) | the gauge is a different replay of every seed; the rules they check are unchanged |
| `ffx2-formulas`, `ffx2-ai-bahamut`, `ffx2-engine`, `ffx2-ally-heal-accuracy`, `ffx2-berserk-zero-rows`, benches | hand-built units carry `newGauge(0)`; `3000` ticks a second -> `STEPS_PER_SECOND`; decisions 3,000 -> 1,000 where Chapter 4's self-healing party now outheals Bahamut | mechanical |
| `ui-common-results` | an FFX-2 tick count converts at 29.97 steps a second: 3,000 steps is 100.1 s | `FFX2_MS_PER_TICK` |

### Mutation check of the engine-level tests

The kernels were proven against the game's machine code by emulation in earlier batches (`research/re-ffx2-atb-status.md` section 0: 100 to 24,529 vectors a function,
200 whole-battle lifecycles of 61,200 steps and 210 status lifecycles of 139,400 steps, 79 of 82 faults put into the kernels caught). The engine-level files prove the part
left: that the engine gives the kernels the right inputs, in the right order, and applies their answers. To check that they would notice a wrong translation, one deliberate fault
at a time was put into the engine (the original file read first, backed up, and written back in a `finally`; `D:\Tools\ffx-parity\w4-final\mutate.mjs`, scratch) and the engine-level files
were run (the generated battles at 60 scenarios, the committed default is 250):

| # | Fault put into the engine | Result |
|---|---|---|
| M01 | the charging halving applies to a cast (the rule the running game never showed) | killed (2 of 40) |
| M02 | a hit reaction never halves the tick | killed (5 of 40) |
| M03 | the Damage-Not-Stop bit reads the wrong way round | killed (5 of 40) |
| M04 | a monster is opened a menu like a girl | killed (1 of 40) |
| M05 | a Berserked monster is handed to the Berserk pick | survived the 7 files; killed after the adapter tests (1 of 64) |
| M06 | the Delay carry is not paid with the next recovery | killed (1 of 40) |
| M07 | a monster does not wait 30 steps for every fallen girl | killed (2 of 40) |
| M08 | a Delay hit finds the cast already released | killed (2 of 40) |
| M09 | a knocked-out character gets a random opening wait instead of the whole gauge | killed (2 of 40) |
| M10 | the girl's cast-speed gate bonus is ignored | killed (1 of 40) |
| M11 | the charge countdown asks the kernel for the charging halving | killed (4 of 40) |
| M12 | a normal battle opens with every wait whole | killed (2 of 40) |
| M13 | the opening draw is 0..62 | killed (2 of 40) |
| M14 | preemptive and ambush swapped | killed (2 of 40) |
| M15 | the preemptive roll draws 0..254 | survived the 7 files; killed after the adapter tests (1 of 64) |
| M16 | a reset draw is 0..14 | killed (1 of 40) |
| M17 | the opening trim is not applied | killed (2 of 40) |
| M18 | the trim counts dead and removed characters as the smallest wait | survived the 7 files; killed after the adapter tests (1 of 64) |
| M19 | Defense is never cleared at the end of a recovery | killed (1 of 40) |
| M20 | two units ready in the same step are served in slot order | killed (2 of 40) |
| M21 | a hit reaction never wears off | killed (3 of 40) |
| M22 | the action time counts down while a cast is still charging | survived: equivalent (see below) |
| M23 | the gauges are settled before the status clocks run | survived: equivalent (see below) |
| M24 | a cast that comes due never fires | killed (2 of 40) |
| M25 | Poison and Regen bank the active speed instead of the awake one | killed (1 of 40) |
| M26 | a Doom victim is not knocked out | killed (2 of 40) |
| M27 | a Regen payout heals one too many | survived the 7 files; killed after the adapter tests (1 of 64) |
| M28 | the look-ahead overshoots a recovery by one step | killed (1 of 40) |
| M29 | the look-ahead overshoots a status count by three steps | killed (1 of 40) |
| M30 | the bar fills against the last recovery, not the standard wait | survived the 7 files; killed after the adapter tests (1 of 64) |
| M31 | a character still thinking counts as ready | killed (1 of 40) |
| M32 | the Poison / Regen first-tick phase draws one fewer value | survived the 7 files; killed after the adapter tests (2 of 64) |
| M33 | a hit reaction lasts 14 steps, not 15 | killed (2 of 40) |
| M34 | the logic rate is 30 a second | killed (1 of 40) |
| M35 | a knock-out does not reset the gauge | killed (3 of 40) |
| M36 | a cancelled cast leaves no recovery | killed (1 of 40) |
| M37 | a Sleep timer starts one unit too long | killed (3 of 40) |

**Result: 35 of 37 faults die; two survive and are equivalent.** Eight survived the first seven files; six died when `parity-ffx2-engine-adapters.test.ts` (new) and the W3 wiring test were added to the run: M05 (the generated battles never
berserk a monster), M15 (a range whose top value rarely changes a result, only the count and the range show it), M18 (nobody is dead or ejected at an opening), M27 (nothing is hurt before
it regens), M30 (the generated battles do not read the HUD bar) and M32 (the W3 wiring test checks the draw range of every command). The two that remain:

- **M22** (a unit counts its action time down while a cast is on the bar): `gauge.executing` is only set by `finishAction`, after the cast has fired and `charging` was cleared, and a unit
  that is executing cannot start another command, so `executing > 0` and `charging !== null` never hold together. `parity-ffx2-engine-adapters.test.ts` asserts it for every unit at every
  step of a 4,000-step run with an action time on and casts all through it; the guard in `logic-step.ts` is defensive.
- **M23** (the gauges are settled before the status clocks run instead of after): `settleGauges` acts on a girl whose menu is open and who can no longer act, and on a unit with a
  command in flight that is Stopped, petrified or ejected. A status clock only removes statuses (an expiry cannot make any of those true) or knocks a unit out (Doom, Poison), and a
  knock-out already idles the gauge itself (`resetGaugeOnKo`), so the order is not observable.

## 5. Before and after

Measured with `tests/unit/ffx2-parity-measure.test.ts` (W3's harness, its clock now `STEPS_PER_SECOND`): for each FFX-2 chapter, the SHIPPED `intendedStrategy` plays the whole chain
through the app's own path (the real party build, the chapter's mid-battle triggers, every link, minigames auto-resolved) at zero decision time, on seeds 1 to 12 and 1 to 500.
**Before** is `931613a8` (run before any W4 edit, 2026-10-10 00:23). **After** is the final tree (run 2026-10-10 22:45 on the engine of commit `1b168572` and later); the per-seed letters
and the sums of all 3,500 chain runs are identical to the same rows measured at 13:42, before the last engine edits, which is why the ablations below (run on that engine) are valid
for this one. "Seconds" is the mean game time of one whole chain at zero decision time, i.e. the engine's clock without the game's animations (section 7, item 2): before,
ticks / 3,000; after, steps / 29.97. A chapter whose wins move by 2 or more of 12 is a mover and is explained below.

### Seeds 1 to 12

| Chapter | wins before | wins after | first link before / after | party turns before / after | engine turns before / after | KOs before / after | seconds before / after |
|---|---|---|---|---|---|---|---|
| IV Bahamut | 12/12 | 12/12 | 12 / 12 | 42.2 / 44.4 | 69 / 57.6 | 0 / 0 | 92 / 68 |
| V Vegnagun and Shuyin | 12/12 | 12/12 | 12 / 12 | 107.9 / 107.5 | 217.4 / 160.3 | 5.3 / 6.1 | 273 / 219 |
| VI Leblanc | 12/12 | 12/12 | 12 / 12 | 63.8 / 62.9 | 97.6 / 82.4 | 0.4 / 0.3 | 111 / 103 |
| XI Fallen Aeons | 12/12 | 12/12 | 12 / 12 | 49.9 / 48.9 | 88.1 / 77.1 | 0.1 / 0.1 | 155 / 125 |
| XIII Paragon and Trema | 3/12 | 6/12 | 4 / 6 | 93.5 / 122.2 | 196.8 / 227.3 | 2.7 / 2.3 | 338 / 369 |
| XV Den of Woe | 6/12 | 12/12 | 12 / 12 | 30.6 / 31.4 | 65.5 / 46.6 | 2.8 / 0.3 | 85 / 58 |
| XVI Ixion and Djose | 12/12 | 12/12 | 12 / 12 | 26.7 / 26.5 | 43.7 / 36.6 | 0 / 0 | 91 / 66 |

### Seeds 1 to 500

| Chapter | wins before | wins after | first link before / after | party turns before / after | engine turns before / after | KOs before / after | seconds before / after |
|---|---|---|---|---|---|---|---|
| IV Bahamut | 500/500 | 500/500 | 500 / 500 | 42.1 / 44.6 | 68.7 / 57.7 | 0 / 0 | 91 / 69 |
| V Vegnagun and Shuyin | 430/500 | 496/500 | 497 / 500 | 97.3 / 109.1 | 198.3 / 162.7 | 5.5 / 6.8 | 246 / 224 |
| VI Leblanc | 491/500 | 498/500 | 500 / 500 | 57.2 / 60.9 | 83.5 / 79.4 | 0.6 / 0.3 | 98 / 99 |
| XI Fallen Aeons | 490/500 | 500/500 | 500 / 500 | 50.2 / 47.9 | 88.9 / 73.2 | 0.1 / 0.1 | 158 / 122 |
| XIII Paragon and Trema | 213/500 | 199/500 | 237 / 220 | 118.9 / 105.5 | 240 / 200 | 2.2 / 2.3 | 435 / 322 |
| XV Den of Woe | 234/500 | 500/500 | 500 / 500 | 31.1 / 31.3 | 66.2 / 46.6 | 2.5 / 0.2 | 85 / 57 |
| XVI Ixion and Djose | 500/500 | 500/500 | 500 / 500 | 26.5 / 27 | 43.1 / 37.4 | 0 / 0 | 90 / 68 |

**Movers.** At 12 seeds: Chapter XIII 3 -> 6 and Chapter XV 6 -> 12. At 500 seeds: Chapter XV 234 -> 500, Chapter V 430 -> 496, Chapter XI 490 -> 500, Chapter VI 491 -> 498,
Chapter XIII 213 -> 199; Chapters IV and XVI stay at 500. A chain gets a quarter to a third shorter in Chapters IV, XI, XIII, XV and XVI, 9 percent shorter in Chapter V and no shorter in Chapter VI (98 -> 99 s).

### Causes: ablations (one piece of the wiring put back, same line, 500 seeds)

Each column puts one piece of the new gauge back to the old engine's reading and plays the same line on the same 500 seeds (`W4_ABL`, section 11). `castM` / `castP`: the monsters' (or the
party's) cast cost back to the ability's old 16 / 26 / 39 tier; `costM` / `costP`: their recovery back to the ability's old 70 (140 for 2xRT); `delay`: a hit of the ATB class moves
nothing and closes no menu; `hr`: no hit reaction; `think`: a monster never waits for a fallen girl; `open`: the old opening (a fill of 0 to 60 percent of the standard wait, no trim).
Each cell is wins of 500 (and the mean seconds of a chain).

| Chapter | after (all in) | castM | castP | costM | costP | delay | hr | think | open |
|---|---|---|---|---|---|---|---|---|---|
| IV Bahamut | 500 (69 s) | 500 (71 s) | 500 (18 s) | 500 (69 s) | 500 (147 s) | 500 (69 s) | 500 (68 s) | 500 (69 s) | 500 (71 s) |
| V Vegnagun and Shuyin | 496 (224 s) | 119 (169 s) | 500 (124 s) | 500 (217 s) | 406 (371 s) | 496 (223 s) | 500 (200 s) | 439 (225 s) | 496 (226 s) |
| VI Leblanc | 498 (99 s) | 344 (119 s) | 500 (52 s) | 500 (102 s) | 487 (125 s) | 499 (99 s) | 500 (99 s) | 500 (99 s) | 498 (102 s) |
| XI Fallen Aeons | 500 (122 s) | 488 (133 s) | 500 (87 s) | 499 (120 s) | 495 (187 s) | 500 (122 s) | 500 (123 s) | 500 (122 s) | 500 (124 s) |
| XIII Paragon and Trema | 199 (322 s) | 199 (321 s) | 252 (288 s) | 199 (323 s) | 173 (477 s) | 199 (322 s) | 205 (329 s) | 194 (322 s) | 185 (307 s) |
| XV Den of Woe | 500 (57 s) | 1 (157 s) | 500 (36 s) | 499 (58 s) | 283 (109 s) | 500 (57 s) | 500 (59 s) | 500 (57 s) | 500 (60 s) |
| XVI Ixion and Djose | 500 (68 s) | 500 (70 s) | 500 (46 s) | 500 (68 s) | 496 (112 s) | 500 (68 s) | 500 (67 s) | 500 (68 s) | 500 (69 s) |

What moved each chapter:

- **Chapter XV (Den of Woe) 234 -> 500.** The monsters' casts. Put the old tiers back for the monsters and the party wins **1 of 500** (157 s a fight); put the party's old recovery
  back and it wins 283. The game's cost_cast for the Den's monsters (20 to 160, divided by their Agility + 1) keeps their big moves apart far longer than the 16 / 26 / 39 tiers did.
  No Den number, boss or party, was touched.
- **Chapter V (Vegnagun and Shuyin) 430 -> 496.** The same cause: monster casts back to the tiers gives 119 of 500. The party's recovery (every command leaves its own cost) is the other
  half: put the old 70 back after every command and it wins 406 and a fight lasts 371 s instead of 224. The hit reaction costs it 4 wins (500 without it), and a monster that does not wait
  30 steps for a fallen girl wins 57 more fights (439 with thinking off), so that wait is a real help to the party.
- **Chapter XI (Fallen Aeons) 490 -> 500** and **Chapter VI (Leblanc) 491 -> 498.** Monster casts again (488 and 344 with the tiers back), the party's recovery next (495 and 487).
- **Chapter XIII (Paragon and Trema) 213 -> 199.** The one chapter that gets a little harder. The party's casts at the game's cost cost it wins: with the old tiers for the party it wins 252
  (so the game's 70-unit spells, 5.9 s at Agility 41, are worth -53 to the party), the party's own recovery cost gives 26 back (173 with the old 70), and the new opening 14 (185 without).
  Net -14, and the first link is won 220 of 500 against 237.
- **Chapters IV and XVI** do not move (500 of 500; Chapter XVI loses 4 wins only with the party's old recovery back).
- **Fight length.** The party's recovery explains it: a spell now leaves 0 and its wait is the cast (5.9 s at Agility 41), where the old engine charged a 1.3 to 3.1 s cast and then 70 more units
  of recovery (5.9 s). Put the old recovery back and a fight lasts 1.1 to 2.2 times as long (Chapter IV 147 s against 69, Chapter XV 109 against 57, Chapter XIII 477 against 322). The Config speed
  is not the cause: 70 / 95 / 120 against the old x0.746 / 1 / x1.262 is within 1 percent at Slow and Fast, and the old waits were 5 percent shorter at Normal.
- Delay, the opening and the hit reaction move nothing by more than 6 wins of 500 anywhere except Chapter XIII's opening (14 wins).

### Sensitivity: the animation time the engine does not play (section 7, item 2)

`action-time.ts` makes every command stay EXECUTING for a number of seconds before its recovery starts (the E4 estimate). As shipped it is 3 s on Chapter XI's three Road links, Chapter XIII's
two links and Chapter XVI's Djose link and off elsewhere; an engine option overrides the formation, so the 3 s column equals "as shipped" for those three chapters (wins and seconds, to the digit).

| Chapter | as shipped | 1.5 s everywhere | 3 s everywhere |
|---|---|---|---|
| IV Bahamut | 500 (69 s) | 500 (90 s) | 500 (112 s) |
| V Vegnagun and Shuyin | 496 (224 s) | 500 (223 s) | 500 (262 s) |
| VI Leblanc | 498 (99 s) | 497 (131 s) | 472 (161 s) |
| XI Fallen Aeons | 500 (122 s) | 497 (103 s) | 500 (122 s) |
| XIII Paragon and Trema | 199 (322 s) | 163 (232 s) | 199 (322 s) |
| XV Den of Woe | 500 (57 s) | 500 (78 s) | 439 (83 s) |
| XVI Ixion and Djose | 500 (68 s) | 500 (56 s) | 500 (68 s) |

This is a lever, not a measurement: no source gives an animation length (the measured ones run from 17 steps for Rikku's Attack to 59 for Paine's, and 75 to 114 for the effect of a cast that has
finished counting down). A 3 s animation for every command would make Leblanc's chain 161 s and the Den a 439-of-500 fight.

### Human pace

The Active arm at 1.5 s a menu (`ffx2-atb-golden`, seeds 1 to 10): Chapter IV 10 of 10 (as before), Chapter V **6 of 10** (2 of 10 after W3; 4 of 10 before it). The Wait split and Wait arms equal the D = 0
arrays, 20 of 20 in both chapters. The Den of Woe at a human pace is won 72 to 100 times in 100 in every cell of `den-of-woe-options-bench` (the Chapter V kit with the Lightfall prep is the one under 90),
and the careless Leblanc line wins one of 40 human-paced runs.

## 6. Behaviour changes, each from the game's code

Each is the game's rule (`research/re-ffx2-atb-status.md`, `research/re-ffx2-timing-measured.md`) where the engine used to have an
estimate. FFX-2 only. None retunes a boss or party number: the rows' costs are the game's data.

1. **The clock.** One logic step is 1/29.97 s (measured). The Config ATB speed is 70 / 95 / 120 units a step; the old 3,000 ticks a second with
   x0.746 / 1 / x1.262 is gone. At Normal that is 2,847 units a second against the old 3,000 (every old wait was about 5 percent shorter); the Slow setting is x0.737 (was
   x0.746), Fast x1.263 (was x1.262).
2. **Recovery is the command's own cost.** `cost_atb x 10000 / (AGI + 1)` of the command that just ended, plus the Delay it took while executing. Attack
   70; every item 40; Steal 50; Trigger Happy 120; the Warrior's four Breaks 0; the party's spells 0 (their wait is the cast); the monsters' commands 20 to 200
   (100 on most). It used to be 70 for every command (140 for `2xRT`), the same for monsters.
3. **A cast is the command's cast cost.** `cost_cast x 10000 / (AGI + 1)` counted down at the caster's full tick (the halving never happened on the
   running game). Fire, Fira and Firaga are all 70 (5.9 s at AGI 41), where the old tiers gave 1.3, 2.1 and 3.1 s [estimate]; Slow no longer quadruples a cast (x2,
   the speed only). The monsters' casts run from 20 to 160.
4. **The opening.** `((draw & 63) + 32) x full / 128` of the standard wait left (25 to 74 percent), then two thirds of the smallest wait come off
   everyone: the first to act waits about 0.7 s, where the old opening took about 2.9 s. A preemptive strike or an ambush resets all 31 slots (one draw each);
   a continuation link of a chain still opens with every wait whole.
5. **The ready list.** Units that run out of recovery in the same step are served lowest counter first (the one that overshot most), ties by slot, where the
   engine served the party first and then the enemies, each by slot.
6. **Thinking.** A girl thinks 0 steps; a monster waits 30 steps for every girl who is down (dead or Petrified) when its command ends.
7. **Hit reaction.** A hit that deals HP damage halves the target's tick for 15 steps (about 0.5 s), unless its monster row says reactions do not slow it
   (every boss). The length is the one measured after a weak Delay hit (48 steps for 4,000 units at 99 and 49); for other hits it is a stand-in (section 7, item 1).
8. **Delay and the magic cancel.** A Delay row deals flat ATB damage (4,000 weak, 8,000 strong) that sets a recovering or thinking unit back, closes a ready
   girl's menu (the counter becomes exactly 4,000, as measured), banks into the next recovery of a unit that is executing, and lengthens, never cancels, a
   cast on the bar. A row with a cancel chance (`Cmd+0x7a`) aborts a cast on the bar. The hidden engine statuses `delay-effect` and `action-cancel` are gone.
9. **Status clocks.** A timed status (Shell, Protect, Reflect, Regen, Haste, Slow, Stop, the immunities) holds a counter of 1 to 125 from the command row's
   amount and loses a count for every 1,500 units of its owner's active speed (a Hasted owner pays faster, a Slowed owner slower, a sleeping owner not at all);
   Doom counts 10,000 units and the victim dies when the counter runs out (the Doom row's N is five counts less one: 422 steps, 14.08 s). Sleep, Confusion
   and Berserk run a timer of 150,000 / 200,000 / 200,000 units on the raw speed; a Sleep timer that lands exactly on 0 (the Fast setting's 120, or 60) never
   wakes. PR-0108's switch is now just this arithmetic. A status with no amount in the row ("until cured") has no clock; Chapter XIII's
   `timedAilmentDefaults` is no longer read.
10. **Poison and Regen.** Every 16,000 units of the awake speed (168 steps, 5.6 s), `(8 x max HP) >> 8` (1/32, no minimum), with a random first phase of 0 to
   4,000 units; Poison's payout in a step skips Regen's. It was 3 percent every 3 s [estimate].
11. **Knock-out.** A KO drops the unit's command in flight (a cast on the bar goes) and resets its counter to the whole standard wait, which a revived unit pays;
   Auto-Life revives it at 25 percent. Defense lasts until the recovery that follows it ends.
12. **Chain windows** keep 2 s and 3 s (60 and 90 steps) and the HUD bar fills as the counter falls against the standard wait.
13. **Result screen.** `FFX2_MS_PER_TICK` is the logic step (33.37 ms); a result's tick count is steps.

## 7. What was not done, and what could not be sourced

1. **The hit reaction's length (15 steps) is one measurement used for every hit.** The game halves a character's tick while it is in a hit reaction
   (`Chr+0xd98`), a motion-system state whose length is not a number in the exe. The running game showed it after a weak Delay hit (48 steps for 4,000 units at
   99 and 49: 14 or 15 of the steps halved), and that is the length the engine uses for every hit that deals HP damage to a unit whose row does not exempt it.
   The reaction of another attack, of a critical hit, of a spell is not measured. Section 5 has the ablation (the reaction off).
2. **The animation of a command.** In the game a command ends when its animation does, and only then does the recovery start; the measured lengths
   run from 17 steps (Rikku's Attack) to 59 (Paine's), 57 steps for the Iron Giant's Attack, and 75 to 114 for the effect of a cast that has finished
   counting down (`research/re-ffx2-timing-measured.md` sections 6 and 8, a handful of commands). The engine resolves a command at the moment it is chosen (or released)
   and starts the recovery then, so every fight is shorter than the game's by the animations. `action-time.ts` (the E4 estimate: one length for every
   command, off unless an engine option or the formation turns it on) is the only lever; section 5 shows what 1.5 s and 3 s do. Setting real lengths needs a
   per-command table measured with the read-only sampler (a decision for Bailey, section 10).
3. **The preemptive / ambush roll for a `'normal'` opening is off** (`Ffx2EngineOptions.rollFirstAttack`, default false). The seven chapters are story
   battles; whether the game presets their opening is not in the sources we have, and rolling it would put a preemptive strike or an ambush into about
   one fight in six at equal Agility (8.2 percent preemptive, 7.6 percent ambush). `condition: 'preemptive'` and `'ambush'` are the game's PRESET results and always apply (the whole path is under test with the option on).
4. **What the game's sequence scripts do with a cast.** The scripts release a cast through `CHANT_REST` and can write the recovery pair directly
   (script stats 229 to 232); they were not decoded. The engine fires a cast in the step its countdown reaches 0 (the running game showed the effect begin in that
   step) and gives the command its row's ATB cost afterwards (0 for the party's spells; Paine's Fire left 0 on the running game, one cast).
5. **Auto-abilities and the girl's cast-speed gates.** The auto-ability tables that say which commands a "wait down" gate shortens are not decoded, so the
   engine applies the girl's single banked percent to every cast of hers (a stand-in; `atb-engine.ts castTime`). Initiative (`ABILITY_LEAD`, a ready-at-once start) and
   First Strike are not modelled either, so `lead` is false and the First Strike count 0.
6. **Dress changes.** The dressphere change ends with the Attack row's 70 as its ATB cost (the change's own cost was not read), and the game's gauge hold
   (`Chr+0xe72`) is not modelled: the engine's change resolves at once.
7. **Confusion's own pick (state 7)** is not modelled (W3 section 7, item 7): a confused girl keeps her menu. A Berserked monster keeps running its
   script.
8. **A Doom victim** is KO'd in the step the counter runs out, where the game queues Death (command 0x3026) on the victim and plays it a few steps later.
9. **The start-of-command switch (which caster animations charge).** `research/re-ffx2-atb-status.md` section 10 says it: read once from the disassembly and its
   table, **not covered by an emulator vector set**; one row (Mix, 0x3058) has a cast cost and is stored as not charging. It is the least proven part of this batch.
10. **Rows outside the chapters.** A record built by the engine itself (an ability with no game row) keeps its own recovery (70, or 140 for `2xRT`) and its
   16 / 26 / 39 charge tier; no command a chapter runs lacks a row (`tests/unit/data-ffx2-command-records.test.ts` counts them).
11. **Pause levels.** The game's pause level 2 (a party exchange running) and 1 (one scripted case) are not modelled; the Wait and Wait-split holds are the
   engine's own (`active.ts`), outside the step, and are the only thing that stops every gauge, as measured.
12. **Browser check.** No UI file changed but `resultsMath.ts` (a constant), and this worktree has no `public/art`, so the plan's real-input browser check is left
   to the main session's validation. The HUD reads the same events and the same gauge snapshot (`AtbSnapshot`, unchanged in shape: `fill`, `required`, `ready`, `charge`).
13. **`src/battle/ffx2/intent.ts` is over the 400-line rule** (733 lines before W4, 740 now: +7 for the ready-list order); it was already over, and the
    contract file `src/battle/common/types.ts` too. Every other file W4 touched is under 400.

## 8. Goldens

Four test files pin the FFX-2 engine's full event logs by hash. The clock, every wait and every status clock changed, so every seeded replay is a different replay
and every hash moved; the outcomes are what matter, and they are listed. The old hashes are in git at `931613a8`. Re-pinned once, in `33e6cf59`.

| Golden | Pins | Hashes moved | Outcomes, old -> new |
|---|---|---|---|
| `ffx2-atb-golden` | Chapter IV and the whole Chapter V chain, seeds 1 to 20 at D = 0, seeds 1 to 10 at the Active D = 1500 (60 hashes) | all 60 | Chapter IV D = 0: 20 of 20 -> 20 of 20. Chapter V D = 0: 20 of 20 -> 20 of 20. Chapter IV Active: 10 of 10 -> 10 of 10. Chapter V Active: 2 of 10 (after W3; 4 of 10 before it) -> **6 of 10**: a human who takes 1.5 s a menu is no longer behind a boss whose casts were far too fast. The Wait arm still equals the D = 0 arrays and a Wait engine switched to Active still equals the Active arrays (both asserted) |
| `ffx2-hit-closes-menu` | Chapters IV, V and VI at D = 0 under the Wait split, seeds 1 to 3 | all 9 | all victories, no menu is ever closed at D = 0; Chapters IV and V equal the atb golden's seeds 1 to 3 again |
| `ffx2-menu-cancel-delay` | Chapters IV, V and VI at human pace, Active and the Wait split, seeds 1 to 3 | all 18 | the switch and its option are deleted with `menu-cancel.ts` (the game's rule is the engine's), so the 18 "release 17" replay hashes beside them are not reproducible and are not kept; the 18 of the default are re-pinned |
| `chapters/den-of-woe-carry` | the first link of Chapters 5, 6, XI (Road) and the Sisters, seeds 1 to 8 (32 hashes) | all 32 | Chapter 5's eight equal the atb golden's seeds 1 to 8 again, Chapter 6's first three equal `ffx2-hit-closes-menu`'s |
| `ffx-engine-golden`, `ff7-golden` | the FFX and FF7 engines | none | unchanged, pass |

The comments in each file say the same with the cause, in the style of the earlier re-pins.

## 9. Full suite and the other checks

- `node "D:/Final Fantasy/node_modules/typescript/bin/tsc" --noEmit`: clean (exit 0), at the final commit.
- One run of the whole unit suite, at the end (`--maxWorkers=4`, the repo's default config, tree `29bfd7f2`): **1,018 files, 15,392 tests: 989 files and 15,108 tests passed, 7 files and
  101 tests skipped, 22 files and 182 tests failed**, in 28.7 minutes on a PC that was also running other lanes' work. 21 of the 22 failing files need `public/art`, which this
  worktree does not have (the same 21 the W3 note lists: `art-ref-defaults`, `chapter-meta`, `chapter-meta-evrae`, `chapter-meta-ffx2-leblanc`, `chapter-meta-seymour-anima-macalania`,
  `cutscene-story-poses`, `party-face-manifest`, `pause-remake`, `ui-portrait-face-crop` (145 of the 182), `chapters/chapters-6-7-8-enemy-sprite-manifest`, `den-of-woe-ship-content`,
  `den-of-woe-ship-scene`, `fallen-aeons-ship-content`, `fallen-aeons-ship-scene`, `isaaru-ship`, `leblanc-art`, `leblanc-party-sprites`, `natus-ship-content`, `natus-ship-scene`,
  `trema-ship-content`, `yojimbo-content`). The 22nd, `advisor-v3-inflight` (one test), is a real finding of this run and is fixed in `d98751ec`: the case "a Phoenix Down held for a chain
  lock" searched the engine's boards for one where the old card would raise the same girl, and at the game's gauge none turns up (250 seeds of Chapter V, 40 of each other chapter); it now
  chains the girl who confirms it, as `advisor-v3-final` does, and the file passes (4 of 4, 33 s). `ffx-engine-golden` and `ff7-golden` pass unchanged; `ffx2-atb-golden`,
  `ffx2-hit-closes-menu`, `ffx2-menu-cancel-delay` and `den-of-woe-carry` pass on their new pins.
- **Re-run on the final tree (`d98751ec` and the handoff, resumed session 2026-10-11 01:55 to 02:26, `--maxWorkers=4`, no `public/art`)**: tsc clean; the whole unit suite once: **1,018 files, 15,392 tests: 990 files and
  15,109 tests passed, 7 files and 101 tests skipped, 1 todo, 21 files and 181 tests failed**, in 31.1 minutes. The 21 failing files are exactly the 21 art-only files listed above (every failure is an
  `ENOENT` on `public/art` or an art-existence assertion; `advisor-v3-inflight` passes). The 13 engine-level, data and golden files (`parity-ffx2-engine-*` x9, `data-ffx2-command-records`,
  `ffx2-atb-golden`, `ffx-engine-golden`, `ff7-golden`) pass 109 of 109 on their own in 31 s. The 12-seed measurement re-run gives the section 5 rows to the digit, and the 500-seed re-run (354 s) gives the same per-seed win/loss
  letters as the stored `after-500.json` for all seven chapters (so the section 5 tables stand).
- Before the full run, the test files the lane changed or added were run twice: 59 files on 2026-10-10 at 19:05 (638 tests passed, 1 failed: the magic-cancel recovery that `1b168572` fixed), and
  the 42 files changed since on 22:00 to 23:30, where the only failures were per-test timeouts on a machine running about sixty other node processes: `ffx2-ability-flags`, `den-of-woe-bench`, `fallen-aeons-bench`,
  `strategy-ffx2-bahamut`, `ffx2-ally-heal-accuracy`, `ffx2-atb-speed`, `fallen-aeons-ship-story`, and three files whose worker did not start in time (`trema-retry-flow`, `advisor-v3-final`, `ui-ffx2-battle-message`); every one of them passes in the full run above, the seven timed ones at 8 s, 378 s, 355 s, 80 s, 17 s, 7 s and 19 s). Two Charon
  benches in `ffx2-ability-flags` got longer timeouts for that reason (30 s -> 120 s and 240 s); the 200-seed benches keep theirs. **A run on a saturated PC fails those timeouts; the heavy FFX-2 benches
  are now 10 to 30 times slower than at `931613a8`** (`trema-options-bench` 32 s -> 721 s, `fallen-aeons-ship-bench` 22 s -> 677 s, `den-of-woe-bench` 17 s -> 378 s, `fallen-aeons-bench` 11 s -> 355 s, `ixion-bench`
  9 s -> 232 s, `strategy-ffx2-bahamut` 2 s -> 80 s; the release candidate 1 suite run took 5.4 minutes (323 s, 1,010 files, with the art present, a quieter PC) and this one 28.7), which is the per-step cost of section 10, item 10.

**Save data.** `src/app/SaveData.ts` is **byte-identical to the base** (`git hash-object` gives `fb32e768` for the working file, for `HEAD` and for `931613a8`); `git status` lists
it as modified only because of a stale stat entry in this worktree's index (`git diff` on it is empty), and it is not staged in any commit of this lane. No save schema and
no migration changed, so this batch is **not** in the save-data class of AGENTS.md. What a saved game holds that this batch could have touched, and why it is unaffected:
`bestTimeMs` and `playTimeMs` are wall-clock milliseconds, not engine ticks (the result screen converts an FFX-2 tick count only as a last resort when no wall clock exists,
`resultsMath.ts perTick`, and that conversion is now the logic step); `ffx2AtbSpeed` is `'slow' | 'normal' | 'fast'` and means the same setting (it now selects 70 / 95 /
120 units a step instead of a multiplier of a 3,000-a-second clock); `ffx2Atb` (`'active' | 'wait'`) is unchanged. No battle state is saved for FFX-2. `bestTurns` is a count of turns (the engine plays fewer of them now: Chapter IV 57.7 a chain against 68.7), so an old record is simply easier to beat; nothing stored changes meaning. One stale comment
in `SaveData.ts` still names `ATB_SPEED_MULTIPLIER` (an export this batch removed); it is left as it is, so the file stays untouched (listed in section 10).

**Other checks.** `node "D:/Final Fantasy/node_modules/typescript/bin/tsc" --noEmit`: clean. `node tools/orphans.mjs`: 53 orphaned modules, none of them this batch's; the FFX-2
ATB and status-timer kernels (`atb*`, `status-timers*`) left the orphan list because the engine imports them now (the kernels still unwired are the next batches':
`auto-ability`, `dressphere-*`, `spherechange`, `ability-effects*`). FFX and FF7 are untouched: `git diff 931613a8 HEAD --stat -- src/battle/ffx src/data/ffx src/battle/ff7
src/data/ff7` is empty, and the only files outside `src/battle/ffx2`, `src/data/ffx2`, tests, docs and research are `src/battle/common/types.ts` (additive; the contract entry
is in `docs/CONTRACT-CHANGES.md`) and `src/ui/common/resultsMath.ts` (one constant).

## 10. Decisions for Bailey

Nothing was retuned: every shift below is the game's own answer on our stat tables, reported with its cause. All are FFX-2 only. The recommendation comes first in each.

1. **Chapter difficulty under the game's gauge (section 5).** The shipped line wins, of 500 seeds: Chapter XV (Den of Woe) 234 -> 500 (47 % -> 100 %), Chapter V (Vegnagun and
   Shuyin) 430 -> 496, Chapter XI (Fallen Aeons) 490 -> 500, Chapter VI (Leblanc) 491 -> 498, Chapter XIII (Paragon and Trema) 213 -> 199 (43 % -> 40 %); Chapters IV and
   XVI (Ixion) stay at 500. The causes are two pieces of the gauge (section 5, ablations): the **monsters' casts** now count down at the game's own cost (20 to 160, against
   our old 16 / 26 / 39 tiers), which gives the party far more time between a boss's big moves (the Den falls to 1 of 500 with them put back), and the **party's recovery**
   is each command's own cost (the party's spells leave 0, an item 40, Attack 70). **Keep** (the 1:1 reading). The alternative is a number of our own on a boss or a party
   stat, which needs your word and which this lane never does. Chapter XV is now a fight the shipped line wins every time at bench speed and 72 to 100 times in 100 at a
   human pace; if "a fair, winnable chapter" should mean harder than that, it is a separate decision about our own stat tables (the girls' stats differ from the game's
   builder, W3 item 7), not about the gauge.
2. **Fights are shorter than the game's by the animations.** The game plays an animation before a command ends (measured: 17 to 59 steps for an Attack, 75 to 114 for the
   effect of a cast that has finished counting down) and only then starts the recovery; the engine resolves a command at the moment it is chosen (or released) and starts
   the recovery then. `action-time.ts` is the only lever (one length for every command, off by default). Section 5 shows what 1.5 s and 3 s do. **Recommended: a second timing
   session that reads (never writes) the game and fills a per-command table of animation lengths**, then switch the table on. It needs your yes to run the game's reader again.
3. **The preemptive / ambush roll for a `'normal'` opening is off** (`rollFirstAttack`, default false). The seven chapters' opening conditions are not in the sources we
   have, and rolling would put a preemptive strike or an ambush into about one fight in six (8.2 % and 7.6 % at equal Agility). `condition: 'preemptive'` / `'ambush'` always
   apply. **Recommended: leave it off** until a source says which battles roll.
4. **The hit reaction is 15 steps for every hit** (the length measured after a weak Delay hit; the exe holds none). It is the one stand-in left in the gauge; switching it off
   moves Vegnagun by 4 wins of 500 and Leblanc by 2 (section 5). **Recommended: measure the reaction per hit type with the same read-only sampler as item 2.**
5. **Auto-abilities and the girl's cast-speed gates are not modelled** (Initiative, First Strike, the "wait down" gate per skillset): the engine applies the girl's single banked
   percent to every cast of hers and has no Initiative. Each is new play for rule 10. **Recommended: a yes to them as their own batch** (the dressphere note has the tables).
6. **Chapter IV's tactics changed character.** Mashing Attack into Defense 160 now leaves Bahamut with 647 to 3,157 of his 8,400 HP (1 of 30 seeds wins), and the unmitigated
   Darkness line stalls undecided on 30 of 30 seeds (the lone White Mage outheals the Mega Flare cadence) where both used to lose reliably. **Keep**; the strategy tests say what
   is true now. "Should Chapter IV be harder" is the same question as item 1.
7. **Chapter VI's careless line wins one human-paced run** (D = 1500, seed 15, of 40; it won none) and 8 of the first 12 at D = 0 (after W3 it won 22 of 40). **Keep.**
8. **Chapter XIII's `timedAilmentDefaults` is no longer read.** Every ailment is timed by the game's clock: Sleep, Confusion and Berserk by their timers, Stop, Slow and the rest by
   the command row's counter (a derived row with no amount gets 125). The field stays in the type and in the four formations that carry it. **Keep.**
9. **Rules the engine still approximates**, none a new play (section 7): a dress change ends with the Attack row's 70 and resolves at once (the game holds the gauge), a Doom
   victim dies in the step the counter runs out (the game queues Death a few steps later), Confusion's own pick (state 7) is not modelled. **Recommended: leave them until a chapter
   depends on one.**
10. **Test speed.** A step is run one at a time (about 23 microseconds with the usual seven units), so a simulated game-second costs about 6 times what the old event-skipping engine
    cost (the 500-seed harness: 50 s -> about 280 s on the same 3,500 chain runs). The heavy benches (`den-of-woe-bench`, `fallen-aeons-bench`, `trema-options-bench`, the 200-seed
    ones) take minutes where they took seconds, and several of their per-test timeouts fail on a machine that is also running other lanes' work (section 9). Nothing in the live game
    is near a budget: one battle second is 30 steps, 0.7 ms, and the move advisor's card (which looks ahead on forks of the engine) took 31 to 35 ms on average and 140 to 240 ms at worst
    per decision in Chapters IV, V and XV (seed 3, an idle PC). **Recommended: keep the exact per-step
    loop** (it is what makes the engine 1:1) **and, if the suite time matters, let the benches run fewer seeds by default**; say so and I will.

## 11. How to re-run

From the worktree root (`D:\Final Fantasy\.claude\worktrees\re-parity`), tools by path, never `npx`:

```
node "D:/Final Fantasy/node_modules/typescript/bin/tsc" --noEmit
node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run --maxWorkers=4 tests/unit/parity-ffx2-engine-atb.test.ts tests/unit/parity-ffx2-engine-atb-hand.test.ts \
  tests/unit/parity-ffx2-engine-interrupt.test.ts tests/unit/parity-ffx2-engine-lookahead.test.ts tests/unit/parity-ffx2-engine-measured.test.ts \
  tests/unit/parity-ffx2-engine-ready-order.test.ts tests/unit/parity-ffx2-engine-roll.test.ts tests/unit/parity-ffx2-engine-wiring.test.ts \
  tests/unit/data-ffx2-command-records.test.ts tests/unit/ffx2-atb-golden.test.ts tests/unit/ffx-engine-golden.test.ts tests/unit/ff7-golden.test.ts
node tools/orphans.mjs
```

`PYREFLY_W4_SCENARIOS=<n>` sets the number of generated battles of the ATB and look-ahead tests (250 and 80 by default).

The measurement (`tests/unit/ffx2-parity-measure.test.ts`, off unless `PYREFLY_MEASURE=1`; the harness is W3's, its clock now `STEPS_PER_SECOND`):

```
PYREFLY_MEASURE=1 PYREFLY_MEASURE_SEEDS=12 PYREFLY_MEASURE_OUT=after-12.json PYREFLY_MEASURE_USAGE=after-12-usage.json \
  node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run --maxWorkers=1 tests/unit/ffx2-parity-measure.test.ts
```

`PYREFLY_MEASURE_SEEDS` is a count (`500` plays seeds 1 to 500) or a range (`251-500`); `PYREFLY_MEASURE_CHAPTERS=ffx2-trema,ffx2-leblanc` narrows the run. All seven
chapters on 12 seeds take about 15 s, on 500 seeds about 5 minutes (a quiet machine).

The **before** side is the same command on `931613a8` (the harness at that commit counts 3,000 ticks a second, so its "minutes" are game minutes too); the rows are kept in
`D:\Tools\ffx-parity\w4-measure\before-12.json`, `before-500.json` and `before-500-usage.json`. An **ablation** puts one piece of the wiring back and plays the same line:
`D:\Tools\ffx-parity\w4-final\make-abl.mjs` writes `tests/unit/zz-w4-measure-abl.tmp.test.ts`, a copy of the harness with `vi.mock` layers (nothing in the engine is
edited), switched by `W4_ABL=costP,costM,castP,castM,delay,hr,think,open` (the party's or monsters' recovery or cast back to the ability's old value, no Delay, no hit reaction, a monster
that never waits for a fallen girl, the old 0-to-60-percent opening) and `W4_ACT=<seconds>` (every command executes for that long: the E4 estimate). Runners and summaries are scratch
outside the repo (`D:\Tools\ffx-parity\w4-measure\run-abl.sh`, `run-act.sh`). The **mutation check** is `D:\Tools\ffx-parity\w4-final\mutate.mjs [idPrefix]`: it puts one fault
at a time into the engine (each file read first, backed up under `mut/backup/`, written back in a `finally`), runs the engine-level files (the seven, the adapters test and the wiring test) and prints the count that failed.

To read a command's costs: `tests/fixtures/parity/ffx2/command_rows.json` (by id), `research/re-ffx2-atb-status.md` section 3.3 and section 10, and the ability's record in
`src/data/ffx2/command-records/` or `src/battle/ffx2/fallback-records.ts`.

NOW.md, CHANGELOG.md, ACTIONS and DECISIONS are left to the main session (other agents are active in the tree).

## CHANGELOG paragraph (FFX-2 only)

**FFX-2:** battles now keep time the way the game does, read from Bailey's Steam copy and checked against it. A fight runs on the game's own clock of about 30 steps a second, and the ATB speed setting (Slow, Normal, Fast) is the game's own 70, 95 and 120 a step. After a command each girl waits that command's own recovery (an attack 70, an item 40, a Steal 50, Trigger Happy 120, and spells nothing at all, because a spell's wait is its cast). A cast takes the game's cast time (Fire, Fira and Firaga all take about six seconds at Rikku's speed), counted at full speed even while she is Slowed; only a hit that does damage slows a girl, for about half a second. Monsters wait a beat longer after each command for every girl who is down. A battle opens with the game's randomised gauges, so the first to act waits under a second, and a preemptive strike or an ambush still fills one side. A Delay hit pushes a gauge back by the game's 4,000 or 8,000 and closes a menu you have open, and a monster's cancelling hit can break a cast. Haste, Slow, Shell, Protect, Reflect, Regen and the other timed statuses wear off on the game's counters (a Hasted girl's run faster, a sleeping girl's stand still), Sleep, Confusion and Berserk on their own long timers, Doom after 10 to 14 seconds, and Poison and Regen pay one thirty-second of max HP every 5.6 seconds. Most fights come out a quarter to a third shorter, because a spell no longer waits out a cast and then a full recovery on top. Difficulty moved, measured and not tuned: the Den of Woe, Vegnagun and Shuyin, the Fallen Aeons and Leblanc are easier (the monsters' big spells take the game's long cast times, which gives the party room), Paragon and Trema a little harder, Bahamut and Ixion unchanged, and Chapter V at a menu-reading pace is easier too. No boss or party number was changed. FFX is untouched.
