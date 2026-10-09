# Re-parity W2: the FFX engine takes its turn order, statuses and per-turn ticks from the game's own kernels

Status: **built and committed on branch `re-parity-w2` (from `bd908802`), not merged, not deployed** (2026-10-09). Track `re-parity`
([plan](../plans/re-parity.md), [paper preflight](../plans/re-parity-review.md) row W2). Owner: Bailey.
**Game case: FFX only** (AGENTS.md rule 14). FFX-2 and FF7 do not import any module this batch touched; `ffx2-atb-golden` and `ff7-golden`
pass unchanged.

Bailey, 2026-10-08, the ask this track answers: "It needs to be a 1:1 parity." On 2026-10-09: "Full speed ahead you don't need to conserve".

Commits (all on `re-parity-w2`; nothing pushed):

| Commit | What |
|---|---|
| `608ee073` | The per-turn tick kernels (end of turn, start of turn with Regen and the stances, the Threaten link, Poison, Doom, action done) run against the exe's machine code; research note section 14 |
| `762415e2` | The measurement harness takes `PYREFLY_MEASURE_SEEDS` and `PYREFLY_MEASURE_CHAPTERS` |
| `e8ec8c2b` | The game's command records carry the CTB rank, the status chances and durations, the extra-status word, the stage buffs and the buff flags for 452 abilities; the fixture of the 979 records |
| `2928f5bb` | Checkpoint: the engine takes the turn order, status infliction and per-turn ticks from the kernels |
| `e052f8e7` | Checkpoint 2: the engine-level oracles for the status step and the ticks; Banish and the shatter through the step's decision |
| `788edf20` | Double HP and Double MP honour Break HP and MP Limit; a Doom command at a Doom-proof boss asks for no countdown; three stale status texts |
| `5a5ab8f0` | The chain carry: a Tonic's doubled pool is capped like the game's, so the seam carries the base maxima |
| `e54e7f19` | The tests that pinned the old turn order, status rolls or ticks pin what the game's code does, each with its reason |
| `0163b4b1`, `f11c892d` | Research note section 15 and the CONTRACT-CHANGES entry; the `advisor-note` seed |
| `09bf0adb` | `ffx-engine-golden` re-baselined |
| `717ed360` | The shatter chance is the command record's byte 0x2c |
| `9bd5b576` | A Regen that lands resets its holder's tick counter (found by the cause tally) |
| `214d8915` | The cause tally and its compare tool |

## What the engine does now

An action visits its targets and runs each target's hits in a row (W1). Everything the game decides about WHO acts and WHAT STATUS a
hit leaves is now the kernels', through `adapt/`:

- **The opening** (`adapt/ctb.ts#openingCtb`, `kernel/ctb-init.ts`): the game's 26 fixed draws, one per slot of the party, the aeons
  and the monsters in the game's order, empty slots and the bench included; none for a preemptive or ambush start. First Strike on
  any slot that wears it (a monster never does), Haste halves and Slow doubles the start value of every slot.
- **The clock** (`adapt/ctb.ts#advanceClock`, `kernel/ctb-scheduler.ts`): a BYTE counter per character slot counts down one point per
  tick; the engine jumps the ticks of a stretch with nobody ready in one step (proved equal to the scheduler kernel called once per
  tick). The next actor is the first ready character by the game's tie key: higher Agility first among the party and the aeons, then
  the monsters in formation order. Every ticked character also gains a Regen tick point.
- **Recovery** (`adapt/ctb.ts#charge`): `HasteSlow(tickSpeed(Agility) * max(rank, 1))` as a byte add, with the game's rank byte of the
  command (17 abilities changed rank, section 6). A revived character's counter is the base stored at the opening.
- **Delay Attack, Delay Buster, Haste, Slow and Threaten's delay** are the hit kernel's CTB class: added to the target's counter
  inside the hit and clamped to 0..255; Haste and Slow rescale the counter (formula 0xd) only when the status landed.
- **Status infliction** (`adapt/status.ts`, `adapt/status-apply.ts`): every hit that lands runs the game's step over a per-target
  hit record kept across the hits of an action: one draw per visited status with a chance byte (`% 101`, Threaten `% 100`), the 255 and
  254 rules, the exclusions, Petrify's wipe, the self-cast turn, no refresh, then the extra statuses, the shatter roll, the stage
  buffs and the buff flags. The record is written back after the damage with the events the engine always emitted.
- **The ticks** (`adapt/ticks.ts`, `adapt/threaten.ts`): Regen pays every holder from its own tick counter at the start of any turn
  and counts down at the start of its holder's turn; the stances and the Threaten pair end at the start of a turn; Doom counts down
  from 5 (a monster's own byte); Sleep, Silence, Darkness, Shell, Protect, Reflect, Haste and Slow count down at the END of the
  holder's turn; Poison follows only an action whose results were applied.
- **Double HP and Double MP** (`statuses.ts`, `kernel/status-pool.ts`): capped at 9,999 and 999 (99,999 and 9,999 with Break HP /
  MP Limit), and removing the flag restores the stored base.

What stays the engine's own business: Reflect, Cover and Provoke, the events, the HP / MP / CTB application, revival, the Overdrive
gauges, the equipment reactions (Auto-Potion, Auto-Med, Auto-Phoenix, counters), KO and Auto-Life, Eject and the aeon leaving the field.
The draws are one engine draw per kernel draw from the engine's seeded stream; **adopting each game's own generator is the RNG lane's.**

Files: `adapt/{ctb,slots,status,status-apply,status-odds,threaten,ticks}.ts` (new), `runtime.ts` (new; `ActorRuntime` and `FFXRuntime`
moved out of `state.ts`, which crossed 400 lines), `hit-apply.ts`, `turnQueue.ts`, `statuses.ts`, `ticks.ts`, `kernel/turn-ticks*.ts`.

## 1. Every kernel input and its engine source

An input the engine cannot supply is an error, never a default. "Constant": the value is the game's and the reason is in the row.
"Ours": a number our data carries, not retuned.

**The opening counters** (`kernel/ctb-init.ts`, exe 0x78ded0; `adapt/ctb.ts#openingCtb`)

| Input | Engine source |
|---|---|
| start type (normal 0, preemptive 1, ambush 2) | `BattleSetup.condition`; the engine's `'scripted'` (a chain's later link) is a normal start, the game has no scripted one; absent = normal |
| the 31 character slots | `adapt/slots.ts`: Tidus 0, Yuna 1, Auron 2, Kimahri 3, Wakka 4, Lulu 5, Rikku 6; the aeons Valefor 8, Ifrit 9, Ixion 0xa, Shiva 0xb, Bahamut 0xc, Anima 0xd, Yojimbo 0xe, the Magus Sisters 0xf to 0x11; a monster is 0x14 plus its index in `BattleState.enemyIds` (the formation order, taken to be the game's monster slot order). A combatant with no slot is an error |
| Agility | `stats.agi`; 0 for an empty slot (its draw is spent and thrown away, as in the game) |
| Haste and Slow counters | the `haste` and `slow` statuses: 255 when permanent, else the turns left clamped to 1..254 |
| First Strike | the equipment auto-ability for a party member or an aeon; 0 for every monster (the exe zeroes a monster's auto-ability block) |
| in the battle | on the field and not `ordersOnly` (Yojimbo's dog owns no turn) |
| aeon flag | slots 8 to 0x11 |
| the draws | `ctx.rng.int(0, modulus - 1)` with the kernel's own modulus (`bonus + 1` for a party slot, 11 for a monster): 26 on a normal start |
| written back | `ActorRuntime.ctb` (the counter) and `.icv` (the base value stored for a revival) |

**The clock and the ready list** (`kernel/ctb-scheduler.ts`, 0x790fb0; `adapt/ctb.ts#schedulerView`)

| Input | Engine source |
|---|---|
| in the battle / dead / permanent word | on the field and not `ordersOnly`; not alive; `permWord` (only Petrify is read) |
| queued actions | 0: the engine runs an action to its end before it picks the next turn |
| counter, base value, Regen tick counter | `ActorRuntime.ctb`, `.icv`, `.regenTicks` |
| gets turns | true. While an aeon holds the field the party is simply not in the battle (section 7) |
| rank | constant 3: the scheduler resets it to 3 at counter 0, and the engine keeps an action's rank on the action |
| Agility (tie key) | `stats.agi`; the key is `(255 - AGI) * 256 + slot` for the party and aeons, `slot + 0x10000` for a monster |
| scheduler globals | not paused, no queued action, period 1, no debug switch, no script hold |

**Recovery, revival and a hit's CTB class** (0x78d1d0, 0x78d530, 0x78e0f0, 0x78e1e0)

| Input | Engine source |
|---|---|
| tick speed | `tickSpeed` of the combatant's live Agility (Agility below 1 reads 1) |
| the rank of the action | `rankOf(def)`: the ability's `rank`, which `attachCommandRecords` sets to the record's rank byte (0 means 3) for every recorded ability; a passed turn is 3 |
| Haste and Slow counters | as above |
| the running counter | `ActorRuntime.ctb` |
| a revived character's counter | `ActorRuntime.icv` |
| Delay Attack / Buster: the bits, the target's tick speed, `3 * tick` base, delay immunity | `flagsMisc` bits 13 and 14 of the record (derived from `weak-delay` / `strong-delay` for a record-less ability), `tickSpeedOf(target)`, `immunityFlags` `immune-to-delay` |
| Haste / Slow: the CTB class amount | formula 0xd with the ability's own `power` (ours: 8 and 16); the status step zeroes it when the status did not land |
| Threaten's delay | `delay + userCounter - targetCounter`, the delay being the recovery of the action's rank for the user |

**Status infliction** (`kernel/status-inflict.ts`, 0x78ae00; `adapt/status.ts#runStatusStep`)

| Input | Engine source |
|---|---|
| command type byte, `flagsMisc`, `flagsDamage` (cleanse bit 5) | the ability's game record; a record-less ability derives them from its own flags (`adapt/command.ts`) |
| the 25 chance bytes and the 13 duration bytes | the record's; a record-less ability: its `statusEffects` (one chance byte each, its duration) and `removesStatuses` (254) |
| the shatter chance | the record's byte 0x2c (`shatter`); a record-less ability: its `shatterChance` |
| wanted extra bits, stage mask and amount, buff flags | the record's; record-less: mapped from `statusEffects` |
| the weapon's bytes (command word bit 18) | `weaponStatusStrikes(user)` of a party user, the per-status maximum; none for anyone else |
| user and target id | the self-cast test only: the user is 0, the target is 0 when it is the user and 1 otherwise |
| user Agility, counter, rank, Haste, Slow, current command, auto word A | `stats.agi`, `ActorRuntime.ctb`, `rankOf(def)`, the statuses, `command.currentCommand`, Magic Booster 0x40 |
| target is a monster slot | `side === 'enemy'` |
| the 25 resistance bytes | `immunities` byte for byte (255 immune). Threaten's is an enemy's LIVE Threaten percent (`ActorRuntime.threatenChance`; 0 when immune; a party member's and an aeon's is 0). `immune-to-regen` is Regen 255 |
| live words (permanent, 13 counters, extra) | `permWord`, `temporalCounters`, `extraWord` as the ACTION began (the snapshot of the target's first hit). A KO'd member's Zombie bit is masked (the exe's death handler clears it; section 7) |
| equipment-given words | the statuses whose `permanent` is set |
| extra-status immunity word | the extra statuses whose immunity is 255 or more; Banish (`extra.bypassesAeonRibbon`) lifts the Eject bit on an aeon |
| special word | `specialWord` (the Life-immune bit is the one this step reads) |
| target counter | `ActorRuntime.ctb` |
| Doom's starting value | 5 for a party member or an aeon, `EnemyDef.doomTurns` for an enemy; read only when a Doom lands; an enemy that can be Doomed without it is an error |
| the hit record | the target's three words at its first hit of the action, edited by every hit, written back after the damage |
| the draws | `% 101` (Threaten `% 100`) per visited status with a chance byte, none for a cleansing command; one `% 101` for a Petrified record's shatter |

**Pools, stage buffs, buff flags** (`kernel/status-pool.ts`, `status-extra.ts`)

| Input | Engine source |
|---|---|
| the stored base maxima | `ActorRuntime.poolBaseHp` / `poolBaseMp`, set when a flag is first turned on (a chain's later link: the base maxima the seam carries) |
| maxima in force, HP, MP | `stats.maxHp`, `stats.maxMp`, `hp`, `mp` |
| the buff byte | the `max-hp-x2` (1) and `max-mp-x2` (2) statuses, plus 9,999 (8), always critical (0x10), Overdrive x1.5 / x2 |
| Break HP / MP Limit | `autoWordB`: the equipment abilities, bits 0x200 and 0x400 |
| stage stacks | the `cheer`, `aim`, `focus`, `reflex`, `luck`, `jinx` stacks, clamped 0..5 |

**The per-turn ticks** (`kernel/turn-ticks.ts`, 0x7af390, 0x7af4f0, 0x799cd0, 0x7afab0, 0x78e410; `adapt/ticks.ts`)

| Input | Engine source |
|---|---|
| on the field / dead / Petrified | `onField` and present; `!alive` or `ko`; `petrify` |
| HP, maximum HP | `hp`, `stats.maxHp` |
| permanent word, 13 counters, extra word | as above; a Nul status counts charges, a permanent one is 255 |
| equipment-given extra word | the statuses whose `permanent` is set |
| the Regen tick counter | `ActorRuntime.regenTicks` (counted by the clock, reset by a payout and by a Regen that lands) |
| Doom counter | the `doom` status's `turnsRemaining` |
| Poison percentage | 25 for a party member or an aeon; `EnemyDef.poisonTickPercent` for an enemy (an error when absent) |
| the Threaten pair | the target's `threaten` status carries the user's id; `adapt/threaten.ts` writes both ends onto the 31 slots |
| a turn that is being re-entered / the silent flag | constants false: the engine opens a turn once, and a Switch hands the open turn to the incoming member without a second tick; the flag is presentation |
| whether the action's results were applied | `onTurnEnd(ctx, actor, resultsApplied)`: false for a passed turn |

## 2. Data added

- **Command records** (`FFXCommandRecord`, additive, CONTRACT-CHANGES): `rank`, `chances`, `durations`, `extra`, `stage`, `buff` (`e8ec8c2b`) and
  `shatter` (`717ed360`), for the 452 recorded abilities (plus the four core ones in `registry.ts`), from the game's kernel tables;
  the fixture of all 979 records (`tests/fixtures/parity/ffx/command_status.json`, numbers only) and `research/re-ffx-commands.md`
  section 7. Six abilities were re-attached by their status bytes (section 7.1 there).
- **The ability's `rank`** is the record's rank byte now (`attachCommandRecords`), one source for the engine and the interface. 17
  abilities changed (section 6).
- **`EnemyDef.poisonTickPercent` and `EnemyDef.doomTurns`** were optional fields; they are read where the game reads them and an enemy
  that needs one and has none is an error. Every shipped enemy carries them or is immune.
- **Where our own status data differs from the record** (the record wins; `tests/unit/data-ffx-command-records.test.ts` pins every row):
  Provoke 100 (ours 254) and Threaten 100 (ours 255); Havoc Shot's Sleep, Silence and Darkness 254 (ours 100); Time Shot also slows;
  Full Life (Seymour's) cleanses only Death (ours also removed eight statuses and Doom); the possessed Yojimbo's Zanmato has no Death byte;
  Evrae's Stone Gaze slows for 100 (ours 254); and the shatter chances (7 of ours the record overrides, 148 plus the party's Attack the record adds).

## 3. Engine code replaced and deleted

No parallel path is left. Deleted: `applyStatus`, `removeStatuses`, `rollStatus`, `rollThreaten`, `consumeNulCharges`,
`tickDurationStatuses`, `DURATION_STATUSES`, `ESUNA_CURES`, `DISPEL_REMOVES`, `clearUntilNextTurnStatuses`, `inflictStatus` and its
kin, the scripted death roll of `scripted.ts`, `normalise`, `applyDelay`, `onHasteApplied`, `onSlowApplied`, `ICV_VARIANCE` and the
hand-built `ICV_BASE` (now the kernel's `tickSpeed`), `payRegen`, the `estimate.ts` copy of the landing rule, and the engine's own
Double HP / Double MP code. `turnQueue.ts` 350 -> 243 lines, `statuses.ts` 397 -> 173, `ticks.ts` 236 -> 183, `state.ts` 398 -> 230,
`math.ts` 108 -> 43. The removed exports of `src/battle/ffx/index.ts` and the new `ActorRuntime` fields are in `docs/CONTRACT-CHANGES.md`.

Mirrors: `ffx/estimate.ts#statusOdds` is the kernel's landing predicate counted over every roll the game can draw
(`adapt/status-odds.ts`), so the enemy-intent panel and the advisor (`engine/tactics/advisor-roll.ts`) cannot drift from the engine;
`ffx/simulate.ts` gives a preview's enemies their Threaten byte; `predictTurnOrder` plays the game's key and recovery forward. The
FFX-2 mirrors (`statusOddsFFX2`, `statusChanceLinear`) are W3's.

## 4. Tests changed, and why

| Test | Change | Game-code reason |
|---|---|---|
| `parity-ffx-engine-ctb-status` (new, 10 tests) | the engine's clock, opening counters, recovery, revive, Haste / Slow / Delay casts and the forecast against an independent oracle (`helpers/ffxEngineCtb.ts`) on generated fields: 400 for the clock, 300 for the opening, 300 for recovery, 60 for the revive counter, 300 for the forecast | the proof of the turn-order wiring |
| `parity-ffx-engine-status` (new, 9 tests) | 5,000 generated hits (the game's own records and fuzzed ones, 1 to 3 hits, party and enemy targets, Zombie, Petrify, Death, Eject, revival, Threaten, Doom, Double HP and MP, stage buffs, weapon strikes, the Regen tick counter) against the kernels run by an independent route | the proof of the status wiring |
| `parity-ffx-engine-ticks` (new, 2 tests) | 800 generated fields through the engine's start of turn, Doom and end of turn | the proof of the tick wiring |
| `parity-ffx-turn-ticks` and `fixtures/parity/ffx/turn_ticks_*.json` | the tick kernels against the exe's machine code | `608ee073` |
| `ffx-statuses` | rewritten on the real path (`helpers/ffxStatus.ts`); the rules the old file pinned kept, the changed ones re-pinned: Regen pays from the holder's tick counter and counts down at the START of its holder's turn, Poison 25 percent after an action whose results were applied, Doom from 5, the ticking list, Death against a living Zombie reads 254, Esuna read off the game's own record | the exe's tick and infliction functions |
| `ffx-ctb` | the clock counts every counter down (no minimum subtraction), Haste and Slow leave the counter alone when no cast moves it, Delay in the hit | `kernel/ctb*.ts` |
| `data-ffx-command-records` | the status bytes word for word, the difference lists, the 17 rank changes, the shatter bytes | section 2 |
| seeds re-pinned because the opening is 26 draws and the statuses draw too | `advisor-note` (Chapter 1 seeds 8 then 1), `advisor-plan-recovery` (seed 1), `advisor-v4-card` (seed 3's first menu is Kimahri's Zombie board), `guide-advisor-target-agreement` (Holy Water on Tidus opens seed 10), `ffx-round04-engine` (seed 3 -> 4; and its PR-0025 text check now pins that the denied-turn rank 3 cites the exe), `ffx-results-ap` (4 -> 2), `presenter-vitals-hp-ceiling` (seed 3), `presenter-vitals-sync`, `chapters/macalania-engine` (A-8 waits for a Multi- action that landed both hits: seed 1 -> 3), `chapters/evrae-engine` (an invincible party for the order queue; Petrify impossible for the Stone Gaze test) | each file names its seed and why |
| moved to the real status path (`helpers/ffxStatus.ts`: `giveStatus`, `inflict`) | `ffx-aeons`, `ffx-ai`, `ffx-chapter2`; `ffx-overdrive-menu-rows` (a preemptive start, so the order does not depend on the opening draws) | the old helpers were deleted with the engine's own formulas |
| `chapters/natus-bench` | the old midpoint party (not shipped) is unwinnable for both lines now, so "intended beats wrong" there is `>=`; the strict comparison stays on the shipped preset. Measured at the change (200 seeds): shipped preset intended 119 -> 110, **drain-farm 66 -> 0**, midpoint intended 5 -> 0; with the old ranks put back 113, 58 and 13 | Flare's rank (record `0x6079`) |
| `chapters/natus-engine` | Natus's Flare is rank 3 (the game's record 0x6079); the Mortibsorption loop repeats a missed Attack | record `0x6079` |
| `chapters/sin-fins-engine` | Petrify goes on Auron, not on the Tidus who also carries Zombie | a cleanse on a Petrified record works for Petrify only, and Zombie (status 1) is reached before Petrify (2) |
| `chapters/sin-carry`, `sin-carry-ceiling` | the seam carries the BASE maxima and the next link doubles them under the cap (9,999 for Auron under a Stamina Tonic, not 12,984) | `pp_BtlApplyDoubleHpMp` |
| `enemy-intent` | Mega Death on a living character reads 99 percent | the landing rule counted over the 101 rolls |
| `strategy-seymour-flux` | documented losses seeds 1, 7 and 20260916; the floors hold (10 of 40, 48 of 160, 9 early) | the new draws |
| `ffx-engine-golden` | all 18 digests, then Chapter II's two again (`09bf0adb`, `9bd5b576`) | section 8 |

Mutation checks, run again on the final code (a change made to the engine or an adapter in a scratch copy, the test files run, "caught" = a test
failed). CTB adapters 15 of 18: the three survivors cannot show in the engine (the draw callback is not keyed by stream, so an aeon's stream flag changes nothing; a permanent
Slow reads 255 or 254 alike; the Delay Buster bit of a DERIVED record is read only for an ability with no game record, and none ships with the flag). Status adapters 31 of 34
(5,000 hits): two anchors moved with the Doom fix and their mutations are the Doom set, 2 of 2 caught; the survivor is Magic Booster's word, which only the exe's Auto-Life bonus
flag reads and the engine has no use for. Tick adapters 15 of 18: the survivors are unobservable (a Doom counter read for a combatant with no Doom; a dead member counted
alive, whose HP is 0 and so is skipped anyway; the Threaten bit left on the USER when the target's link byte is missing, which the engine never reads back because it keeps
the pair on the target). Double HP and MP limits 5 of 6 (the survivor is the removal path, which is handed the byte already in force and recomputes nothing); the chain carry 3 of 3.
Two more, made after: the shatter chance read from the ability instead of the record, and the Regen reset removed: both caught by the status oracle.

## 5. Before and after

Harness: `tests/unit/ffx-parity-measure.test.ts` with `PYREFLY_MEASURE=1` (`PYREFLY_MEASURE_SEEDS=N`, `PYREFLY_MEASURE_CHAPTERS=a,b`,
`PYREFLY_MEASURE_OUT=<file>`): the shipped `intendedStrategy` through each FFX chapter's whole chain, seeds 1 to N. Before = the tree at
`bd908802` (the W1 engine, the table of `docs/handoff/re-parity-w1.md` section 5), after = `9bd5b576` (the engine; `214d8915` only added the tally). Causes: `tests/unit/ffx-parity-cause.test.ts`
and `tools/parity-cause-compare.mjs`.

**12 seeds** (wins / losses / party turns / party KOs, before -> after):

| Chapter | Wins | Losses | Party turns | Party KOs | Change |
|---|---|---|---|---|---|
| I Seymour Flux | 2 -> 2 of 12 (16.7% -> 16.7%) | 10 -> 10 | 24.7 -> 23.4 | 4.1 -> 4.8 | +0 (0.0 pts, 0.0 sd)  |
| II Yunalesca | 12 -> 12 of 12 (100.0% -> 100.0%) | 0 -> 0 | 134.6 -> 146.5 | 8.7 -> 9.5 | +0 (0.0 pts, 0.0 sd)  |
| III Braska's Final Aeon (7 links) | 12 -> 12 of 12 (100.0% -> 100.0%) | 0 -> 0 | 255.4 -> 256.1 | 5 -> 5 | +0 (0.0 pts, 0.0 sd)  |
| VII Anima and Macalania | 12 -> 10 of 12 (100.0% -> 83.3%) | 0 -> 2 | 50.6 -> 48.8 | 4.2 -> 4.9 | -2 (-16.7 pts, -1.5 sd) MOVED |
| VIII Evrae | 11 -> 12 of 12 (91.7% -> 100.0%) | 1 -> 0 | 66.8 -> 68.8 | 0.8 -> 0.7 | +1 (8.3 pts, 1.0 sd)  |
| IX Yojimbo | 9 -> 11 of 12 (75.0% -> 91.7%) | 3 -> 1 | 71 -> 78.3 | 6.8 -> 8.4 | +2 (16.7 pts, 1.1 sd) MOVED |
| X Seymour Natus | 9 -> 8 of 12 (75.0% -> 66.7%) | 3 -> 4 | 45.4 -> 44.8 | 0.8 -> 1.6 | -1 (-8.3 pts, -0.5 sd)  |
| XII Seymour Omnis | 7 -> 6 of 12 (58.3% -> 50.0%) | 5 -> 6 | 111 -> 98.6 | 14.9 -> 10.8 | -1 (-8.3 pts, -0.4 sd)  |
| XIV Isaaru (3 links) | 10 -> 10 of 12 (83.3% -> 83.3%) | 2 -> 2 | 30.5 -> 30.1 | 2.8 -> 2.6 | +0 (0.0 pts, 0.0 sd)  |
| XVII Sin: Fins and Core | 3 -> 7 of 12 (25.0% -> 58.3%) | 9 -> 5 | 303.3 -> 349.9 | 11 -> 10.3 | +4 (33.3 pts, 1.8 sd) MOVED |
| XVIII Sin: Face | 4 -> 5 of 12 (33.3% -> 41.7%) | 8 -> 7 | 64.4 -> 65.6 | 2 -> 1.8 | +1 (8.3 pts, 0.4 sd)  |

**500 seeds** (standard deviation of the difference of two samples; "real" = beyond 3, "borderline" = 2 to 3):

| Chapter | Wins | Losses | Party turns | Party KOs | Change |
|---|---|---|---|---|---|
| I Seymour Flux | 131 -> 144 of 500 (26.2% -> 28.8%) | 369 -> 356 | 27.2 -> 29.9 | 4.4 -> 4.5 | +13 (2.6 pts, 0.9 sd) noise |
| II Yunalesca | 499 -> 497 of 500 (99.8% -> 99.4%) | 1 -> 3 | 132.4 -> 135.4 | 8.2 -> 8.4 | -2 (-0.4 pts, -1.0 sd) noise |
| III Braska's Final Aeon (7 links) | 488 -> 476 of 500 (97.6% -> 95.2%) | 12 -> 24 | 257.7 -> 258.5 | 5.3 -> 5.6 | -12 (-2.4 pts, -2.0 sd) borderline |
| VII Anima and Macalania | 494 -> 493 of 500 (98.8% -> 98.6%) | 6 -> 7 | 50.5 -> 50.3 | 4.8 -> 4.8 | -1 (-0.2 pts, -0.3 sd) noise |
| VIII Evrae | 487 -> 480 of 500 (97.4% -> 96.0%) | 13 -> 20 | 68.8 -> 70.8 | 0.9 -> 1.1 | -7 (-1.4 pts, -1.2 sd) noise |
| IX Yojimbo | 427 -> 434 of 500 (85.4% -> 86.8%) | 73 -> 66 | 76.1 -> 76.4 | 7 -> 7.9 | +7 (1.4 pts, 0.6 sd) noise |
| X Seymour Natus | 389 -> 325 of 500 (77.8% -> 65.0%) | 111 -> 175 | 49.1 -> 50.3 | 1.3 -> 3.1 | -64 (-12.8 pts, -4.5 sd) real |
| XII Seymour Omnis | 290 -> 284 of 500 (58.0% -> 56.8%) | 210 -> 216 | 109.2 -> 107.5 | 11.6 -> 10.9 | -6 (-1.2 pts, -0.4 sd) noise |
| XIV Isaaru (3 links) | 424 -> 446 of 500 (84.8% -> 89.2%) | 76 -> 54 | 30.3 -> 30.2 | 2.7 -> 2.6 | +22 (4.4 pts, 2.1 sd) borderline |
| XVII Sin: Fins and Core | 280 -> 273 of 500 (56.0% -> 54.6%) | 220 -> 227 | 307.4 -> 312.9 | 8.1 -> 8.3 | -7 (-1.4 pts, -0.4 sd) noise |
| XVIII Sin: Face | 124 -> 117 of 500 (24.8% -> 23.4%) | 376 -> 383 | 64 -> 64 | 2.3 -> 2.3 | -7 (-1.4 pts, -0.5 sd) noise |

**Wider samples for the rows that were not clear** (2,000 seeds, the old engine against the new one): II Yunalesca 1,992 -> 1,994 (noise); **III Braska's
Final Aeon 1,958 -> 1,897 of 2,000 (97.9 -> 94.8 percent, -3.0 points, -5.2 sd: real)**; VIII Evrae 1,951 -> 1,951 (nothing); XIV Isaaru 1,704 -> 1,730 (+1.3 points, 1.2 sd:
noise, the 500-seed +22 was a two-sigma swing). The 12-seed flags (VII -2, IX +2, XVII +4) are sampling: 500 seeds say -1, +7 and -7.

Causes, from the cause tally (old engine against new, line by line; Chapters II, III, VIII, IX, X, XIV at 500 seeds, Chapter III again at 2,000, the other five at 500)
and from ablations (the wired engine with one change put back, 500 seeds unless said):

- **X Seymour Natus, real: 389 -> 325 of 500 (-12.8 points; party KOs a fight 1.3 -> 3.1). Cause: Natus's Flare is rank 3 in the game's record, 5 in our data.**
  It is cast 5.2 times a fight and not 2.9, and it is the only line that moved in the tally (KOs by Flare 1.23 -> 3.05 a fight; no other cause moved by more than 0.7).
  With the old ranks put back the new engine wins 387 of 500 (the old engine 389): the rank is 62 of the 64. The same rank takes the guide's **drain-farm line** (strategy 6, farming
  Mortibody kills so each Mortibsorption drains Natus) from 66 of 200 to none, and the old midpoint party from 5 to none (`chapters/natus-bench`); with the old rank back they are 58 and 13.
- **II Yunalesca: 499 -> 497.** The first run of the wired engine showed 492 of 500 and party KOs with no action resolving ("tick") at 3.89 a fight against 0.58: a Regen that
  landed did not reset its holder's tick counter, so a fresh Regen paid a full heal (a kill for a Zombie). Found with the tally, fixed in `9bd5b576`, pinned by the status oracle.
- **III Braska's Final Aeon, real: -3.0 points at 2,000 seeds, and all of it is link 1** (Braska's Final Aeon and the two Yu Pagodas: 42 -> 103 losses; every later link is won every time it is
  reached, 1,958 of 1,958 in the old engine and 1,897 of 1,897 in the new). What the tally shows in link 1: the fight takes 2.7 percent more ticks (824.6 -> 846.4 a fight) and every
  actor but Tidus takes 3 to 5 percent more turns; the Pagodas' Power Waves are 5.2 percent more frequent (44.5 -> 46.8 a fight), each adds 20 to the boss's Overdrive gauge, so his
  Overdrives and Blade Blitz come sooner (Ultimate Jecht Shot +9 percent, Blade Blitz +7 percent) and the party's KOs by Blade Blitz go 0.17 -> 0.38 and by Ultimate Jecht Shot
  0.08 -> 0.23 a fight; a Firaga does 1.5 percent less on average (the likely reason is Mental Break being stripped more often; not measured). That loop is clear; **its first cause is not isolated.** Single changes put back,
  2,000 seeds: the command ranks of the old data 1,897 (nothing), the old tie order 1,899 (+2), the old Haste / Slow rule (a Slow that fails still doubled the target's counter)
  1,916 (+19, 1.4 sd: inside the noise); at 500 seeds the aeon Defend rule, the old shatter numbers and the old finite-duration list moved nothing, and counting every tick the old clock
  dropped (its extra `normalise` calls) moved nothing either (981 of 1,000 in both). The slow uptime of a Pagoda is the same (70 and 79 percent of its turns) in both engines. The
  AI track for this chapter (`research/re-ffx-ai-yunalesca-bfa.md`, rows B1 to B7 replace the script weights and the gauge) changes exactly these numbers, so the honest next
  measurement is Chapter III after that track merges.
- **VIII Evrae: 487 -> 480 (500 seeds), 1,951 -> 1,951 (2,000): noise.** Putting the old Haste / Slow rule back gives 484; Stone Gaze's Slow back to 254 moves nothing.
- **IX Yojimbo: 427 -> 434: noise.** The Agility tie key is worth +19 here on its own (with the old slot order the new engine wins 415).
- **XIV Isaaru: 424 -> 446 at 500 seeds, +26 at 2,000: noise.** No line of the tally moved and no ablation moved it.
- **I, VII, XII, XVII, XVIII: noise** (+13, -1, -6, -7, -7 at 500 seeds). The tallies show only counts: the aeon's Defend is a no-op now (item 14 below; wins unchanged in every chapter
  with an aeon), one Eject event per Banish, `critical` events with the hit.

`combat-fixes-bench` (200 seeds a line): every FFX-2 row (Chapters IV to VI) is byte-for-byte identical before and after (the FFX-2 engine is untouched). FFX: Chapter I intended
53 -> 56 of 200, drain-farm 1 -> 0, wrong 0 -> 0; Chapter III link 1 intended 195 -> 191, the Provoke line 9 -> 14.

## 6. Behaviour changes, each from the game's code

Everything below is the exe's answer, put into the engine; none of it is a tuning decision.

1. **The opening.** 26 fixed draws in the game's order; the bench has counters (the old engine left them at 0); Haste halves and Slow
   doubles every slot's start value; First Strike on any slot (no monster has it); a chain's later link is a normal start. The jitter
   distribution is the same as before, so this moves replays and not difficulty.
2. **The clock and the order.** Counters count down one point per tick per character, the next actor is the first at 0 by the game's tie
   key (Agility first among the party and the aeons, then monsters in formation order; the old engine used a fixed list). In the old golden
   battles the key picked a different actor on 10 of 2,648 turns.
3. **Recovery** is `HasteSlow(tickSpeed * max(rank, 1))`, clamped to 0..255, with the game's rank byte. The ranks that changed:
   Wakka's four reels 3 -> 4, Fury's menu marker 5 -> 3, Passado 3 -> 5, Mix 6 -> 5, **Natus's Flare 5 -> 3**, and the nine aeon Attack rows (never
   reached, the generic Attack serves every aeon).
4. **Haste and Slow rescale the counter only when the status landed.** The old engine rescaled it even when the status failed: in the
   golden battles 6 of 12 Slow casts failed (4 on a Yu Pagoda, 2 on Evrae) and doubled the counter anyway.
5. **Delay Attack and Buster** add `tickSpeed * 3 / 2` and `tickSpeed * 3` inside the hit, with the 255 clamp; **Threaten** writes
   `delay + userCounter - targetCounter` into the target's counter at once and the pair is released at the start of whichever end's turn comes
   first, or by a death or a leaving.
6. **Status draws.** One draw per visited status with a chance byte, in status order, whatever the odds; none for a cleansing command. The
   landing rule is `roll < chance - resistance` (a chance of 100 against resistance 0 fails on the one roll of 100: Mega Death reads 99
   percent), 255 always lands, 254 lands unless immune, **Death against a living Zombie reads a resistance of 254** (so a chance of 254 or
   255 gets through and 253 and below fail).
7. **Exclusions and wipes.** Confuse, Berserk, Provoke and Threaten remove one another; Haste and Slow cancel each other and a permanent one
   cannot be displaced; Petrify wipes the thirteen counters (a permanent Haste or Slow too) and keeps the extra bits 0 to 5, 8 and 15; a status
   cast on oneself with a finite duration lasts one extra turn; a status that is already on is not refreshed; stage buffs cap at 5 and survive Petrify.
8. **A Petrified record refuses the statuses after Petrify in status order**, and a cleansing command works on a Petrified record only for Petrify
   itself. A Petrified monster is shattered at once (Petrify puts Death and Eject in its record). A Petrified party member meets the shatter roll of
   whatever hits it: one `% 101` draw spent whatever the command, and the command record's own chance decides.
9. **Durations tick on the game's list.** Sleep, Silence, Darkness, Shell, Protect, Reflect, Haste and Slow at the END of the holder's turn,
   Regen at the START of its holder's turn, the Nul statuses never. Shell with a counter of 100 loses one per turn end (the old engine ticked five
   statuses and left Shell, Protect, Reflect and Haste alone).
10. **Regen** pays EVERY holder `(own tick counter * maxHP >> 8) + 100` at the start of any turn (a Zombie takes it as damage), resets
    the counter on the payout and when a Regen lands, and counts down at the start of its holder's turn.
11. **Poison** takes `maxHP * percent / 100` (25 for the party and the aeons, the monster record's byte for an enemy) after an action whose results
    were applied; a sleeper's passed turn takes none.
12. **Doom** starts from 5 (the party) or the monster record's byte, counts down on the victim's own turn even while it sleeps, and kills at 0. A
    Doom command at a Doom-proof boss lands nothing and asks for no countdown.
13. **Double HP and Double MP** cap at 9,999 and 999 (99,999 and 9,999 with the Break limits) and removing the flag restores the stored base;
    a Tonic on Auron (6,492 HP) is 9,999, not 12,984.
14. **Extra statuses honour the immunity bit, whatever the chance byte.** The old engine let a chance of 255 override an immunity; the game's
    extra-status step has no roll and refuses a bit in the target's immunity word. **An aeon's Defend, Guard and Sentinel therefore land nothing**
    (the aeon's sourced Ribbon list includes them, `setup.ts#AEON_INNATE_IMMUNITIES`); the engine's aeon menu still offers Defend (section 10).
15. **Banish** is an ordinary Eject command that lands on an aeon (the Aeon Ribbon byte is not in the word it is handed). The status-add event for
    the Eject is emitted once, not twice.
16. **The event stream** keeps its shapes. Differences in counts: one Eject event per Banish (was two); the `critical` status event comes with
    the hit that took the HP under half (the status step refreshes it after every hit), where the old engine emitted 909 of Chapter III's 2,992
    of them (20 seeds) at the owner's next turn start (why the old engine lagged was not traced); and `turn-start.elapsedTicks` is the ticks the clock ran.

## 7. What was not done, and what could not be sourced

- **The KO status reset.** The death handler (VA 0x0079a190) clears the permanent word but Death (so Zombie too), the counters, the extra word
  (so Scan and Eject too), the stacks and the buff byte. The engine's `SURVIVES_KO` keeps `ko`, `scan`, `zombie` and `eject` on a member who
  dies, on the strength of `research/ffx-yunalesca.md` section 15.2 number 29 (the Hellbiter weighting reads Zombie on KO'd slots). The two
  cannot both hold; this track does not settle which the script reads (PR-0217, D-214), keeps the list, and shows the infliction step the word
  the exe would have (Death alone). Recommendation: have the Yunalesca AI lane check whether the weighting reads the permanent word at all, then
  drop Zombie and Scan from the list.
- **The aeon summon and dismissal counters** (`pp_BtlSummonCtb` 0x007b1aa0, the character refresh 0x007a89c0): read, not proven. The party's counters
  are frozen while an aeon holds the field and the aeon enters at 0; the party is not ticked meanwhile.
- **The party's Threaten release when it is summoned away** was not traced; the target meets the release at its own turn start, which comes right after.
- **Whether an equipment-given Haste or Slow comes back after Petrify** zeroes the record's counters (the temporal auto word `Chr+0x62c`).
- **The script hold of the scheduler** (the scene value 0x1ad and VA 0x0112c9d1) and **how long a tick lasts in real time**: the engine runs no frames.
- **The enemy formation order** is taken to be the game's monster slot order; it decides ties between enemies only.
- **The game's random streams.** One engine draw per kernel draw from the single seeded stream (the RNG lane).
- **Enemy resistance bytes** are the `immunities` of our enemy data (the P5 data wave), not read from the monster files here.
- **The Petrify and Scan change handlers** of the write-back (VA 0x0078e150, 0x007891b0) are presentation and animation state, and one rule: a Petrified
  character with HP below 1 gets the Eject bit. Not modelled.
- **Browser check.** No UI file changed and this worktree has no `public/art`, so the plan's real-input browser check (acceptance case 6) is left to
  the main session's validation. The CTB list shows `predictTurnOrder`'s rows, which the oracle covers.

## 8. Goldens

All 18 digests were re-baselined (`09bf0adb`), Chapter II's two again (`9bd5b576`). Old values are in git history (`bd908802`).

| Golden | Old digests (W1) | New digests | Outcome |
|---|---|---|---|
| seymour-flux#1 | 28692f2c | d6d988d5 | unchanged (defeat) |
| seymour-flux#7 | f923eb10 | 8aa995a1 | unchanged (defeat) |
| yunalesca#1 | 2327f640 | c290c94e | unchanged (victory) |
| yunalesca#7 | 4225415d | bf24ebdd | unchanged (victory) |
| braskas-final-aeon#1 | 567c3bf4 ea51a558 ba4a14f2 509fbd2 1ebf8f7c da4942b3 e84aa63 | 1c226807 67153004 4a4b7aa4 2093256d 4252bff8 9210c50b c12e2c6e | unchanged (victory x7) |
| braskas-final-aeon#7 | 2b85c492 f82347e2 42bd9a74 48d2e753 86304bae 7e4d660e cddd0f5d | a1681a38 36c3ca08 f02a6c2f e461cd79 3ea598fa 10aeab6a 1e1df139 | unchanged (victory x7) |
| seymour-anima-macalania#1 | 15ecc081 | 50d1cb36 | unchanged (victory) |
| seymour-anima-macalania#7 | 86868cbf | 3a5e47f6 | MOVED victory -> defeat |
| evrae-airship#1 | 14674509 | c3c29c19 | unchanged (victory) |
| evrae-airship#7 | 3c97dd63 | a42e3add | unchanged (victory) |
| yojimbo-cavern#1 | fce6b795 | 955b4cb | unchanged (victory) |
| yojimbo-cavern#7 | c3a419df | 5dd41cd1 | unchanged (victory) |
| seymour-natus#1 | d4682a0e | ba205c84 | unchanged (victory) |
| seymour-natus#7 | 2133d3d8 | 4dab376e | unchanged (victory) |
| seymour-omnis#1 | b7b53dbe | dfa46cb6 | unchanged (defeat) |
| seymour-omnis#7 | 1a2a42df | 421c74e9 | MOVED victory -> defeat |
| isaaru-via-purifico#1 | d916c9d0 bc11f7e3 42ea7beb | 70c30985 70d6e055 a372f3f0 | MOVED (third link victory -> defeat) |
| isaaru-via-purifico#7 | b073037f 584e6881 e0f5e2d6 | 36047a9f f5fb7559 87a76d9b | unchanged (victory x3) |

A flipped seed is not a change of difficulty (one sample): section 5 has the 500-seed rates. `ffx2-atb-golden` and `ff7-golden` pass unchanged.

## 9. Full suite

One run of the whole unit suite on `6171dedb` (`node vitest.mjs run`, 2026-10-09, after everything above except the `natus-bench` edit): **929 files, 898 passed, 24 failed,
7 skipped; 13,880 tests, 13,635 passed, 164 failed, 80 skipped, 1 todo.**

The 24 failing files:

- **21 need `public/art`**, which this worktree does not have (the same 21 as the W1 run, `docs/handoff/re-parity-w1.md` section 9): `ui-portrait-face-crop` (125 tests),
  `chapters/trema-ship-content` (4), `art-ref-defaults` (4), `pause-remake` (3), `chapters/isaaru-ship` (3), `chapters/den-of-woe-ship-content` (3),
  `chapter-meta-seymour-anima-macalania` (3), `chapter-meta-evrae` (3), `chapters/natus-ship-scene` (2), `chapters/natus-ship-content` (2), `chapters/leblanc-art` (2),
  `chapters/fallen-aeons-ship-content` (2), `chapter-meta-ffx2-leblanc` (2), `cutscene-story-poses` (1), `chapters/fallen-aeons-ship-scene` (1),
  `chapters/den-of-woe-ship-scene` (1), and five files that fail on import because `public/art/manifest.json` is missing: `party-face-manifest`, `chapters/yojimbo-content`,
  `chapters/leblanc-party-sprites`, `chapters/chapters-6-7-8-enemy-sprite-manifest`, `chapter-meta`.
- **2 time out at the 15-second default under the load of a full run and pass alone**: `strategy-ffx2-bahamut` ("heal-only route clears Mega Flare", an FFX-2 test; 8 s alone, the
  same file W1 listed) and `live-url-follows-host` (walks the tree; 0.2 s alone).
- **1 was this track's**: `chapters/natus-bench` ("the intended line beats the credibly wrong one ... at the old midpoint") failed with 0 against 0, because Natus's Flare is
  rank 3 now (section 5). Fixed in the commit after the run (the midpoint comparison is `>=`, with the measured numbers in the test); the file passes, 5 of 5.

Every other file passes, including all the parity tests, `ffx-engine-golden`, `ffx2-atb-golden` and `ff7-golden`. `node tools/orphans.mjs`: no FFX kernel module is left unimported
(the 26 `ffx2/kernel` files are W3's and W4's).

## 10. Decisions for Bailey

1. **Natus's Flare is rank 3 in the game, 5 in our data.** The game's own record is applied. Chapter X's win rate fell from 77.8 to 65.0
   percent (389 to 325 of 500) because Flare now comes about 5.2 times a fight and not 2.9 (section 5), and the guide's drain-farm line (strategy 6) falls from 33 percent
   to none on the 200-seed bench. Options: keep the game's answer
   (the 1:1 reading, and the recommendation), or give Flare a rank of our own, which is an invented number.
2. **Chapter III's first link is harder: 97.9 to 94.8 percent** (42 to 103 losses in 2,000 seeds, all in Braska's Final Aeon and the two Pagodas; section 5). No
   single change put back explains it (the largest, the old rule that a failed Slow still doubled the counter, is 19 wins of the 61, inside the noise), so the move is the sum of the
   engine's smaller exact answers and a feedback loop through the boss's gauge. Nothing was retuned. Recommendation: leave it, and measure the chapter again after the
   AI-YUNALESCA-BFA track merges, because that track replaces the very weights and gauge the loop runs through.
3. **An aeon's Defend now does nothing** (item 14 of section 6): our aeons are immune to Defend, Guard and Sentinel by sourced data and the
   game's extra-status step honours the immunity, where the old engine let the chance byte win. The game's aeons have no Defend command at all.
   Options: take the Defend row off the aeon menu (the game's menu; the recommendation), or leave a row that does nothing.
4. **The KO status reset and Zombie** (section 7): drop Zombie and Scan from `SURVIVES_KO` once the Yunalesca lane has checked the weighting.
5. **The command record's bytes now rule the status step** wherever our own data differed (section 2): Provoke and Threaten bytes, Havoc Shot,
   Time Shot's Slow, Seymour's Full Life, the possessed Zanmato, Evrae's Stone Gaze duration, and the shatter chances. Say if any of these should
   stay ours; each is one line of data.
6. **Stale text, not changed** (rule 6 and 10 cover game text): `ui/common/statusWords.ts` tells the player that a sleeper's "gauge [is] frozen, no
   turns" (the game's sleeper keeps a counter, reaches the front and loses the turn); `data/ffx/statuses/core.ts` says only "a physical hit" can shatter
   a Petrified target (any command with a shatter chance can); the pause screen's status help and the strategy guide were not read line by line.

## How to re-run

```
node "D:/Final Fantasy/node_modules/typescript/bin/tsc" --noEmit
node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run tests/unit/parity-*.test.ts tests/unit/ffx-engine-golden.test.ts tests/unit/data-ffx-command-records.test.ts tests/unit/ffx-statuses.test.ts tests/unit/ffx-ctb.test.ts
PYREFLY_MEASURE=1 PYREFLY_MEASURE_SEEDS=500 PYREFLY_MEASURE_OUT=out.json node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run tests/unit/ffx-parity-measure.test.ts
PYREFLY_MEASURE=1 PYREFLY_MEASURE_SEEDS=500 PYREFLY_MEASURE_CAUSE_OUT=causes.json node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run tests/unit/ffx-parity-cause.test.ts
node tools/parity-cause-compare.mjs old-causes.json causes.json seymour-natus
node tools/orphans.mjs
```

NOW.md is left to the main session (other agents are active in the tree).
