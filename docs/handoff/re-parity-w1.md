# Re-parity W1: the FFX engine rolls hits, critical hits and damage through the game's own kernels

Status: **built and committed on branch `re-parity`, not merged, not deployed** (2026-10-08). Track `re-parity`
([plan](../plans/re-parity.md), [paper preflight](../plans/re-parity-review.md) row W1). Owner: Bailey.
**Game case: FFX only** (AGENTS.md rule 14). FFX-2 and FF7 do not import any module this batch touched;
`ffx2-atb-golden` and `ff7-golden` pass unchanged, and the FFX-2 rows of `combat-fixes-bench` are identical before and after.

Bailey, 2026-10-08, the ask this track answers: "It needs to be a 1:1 parity."

Commits (all on `re-parity`; nothing pushed):

| Commit | What |
|---|---|
| `b299697c` | The measurement harness, `tests/unit/ffx-parity-measure.test.ts` (`PYREFLY_MEASURE=1`) |
| `47798c50` | The game's command records on 451 abilities, `research/re-ffx-commands.md`, the adapter modules, the 979-row fixture |
| `960eb80e` | The engine wiring, the engine-level parity test, every pin the game's rules moved, the 18 goldens |
| `a4d043e4` | An enemy's plain Attack on a monster-side record (the possessed aeons' 0x6000), two inputs settled in the exe, Chapter III goldens |

## What the engine does now

An action visits its targets one after another and runs each target's hits in a row (the game's order; an action that
picks a fresh random target for every hit stays hit by hit). One hit is `adapt/hit.ts#resolveHit` ->
`kernel/hitdamage.ts#calcHitDamage`: the Nul check, the hit roll, the HP / MP / CTB base damage with its variance, the
sixteen-step modifier chain, the critical roll, the cap. The draws come in the game's order, hit roll, variance, critical
roll, one engine draw per kernel draw (`adapt/draws.ts`: the variance is `int(0, 31)`, the percent roll `int(0, 100)`; the
kernels' own `& 31` and `% 101` pass through), so the seeded stream and the advisor's roll policy keep working. **Adopting
the game's own RNG generator is a separate decision for Bailey (plan P3) and is not made here.**

The engine keeps what is not the kernels' job: Reflect, Cover and Provoke, the events (shape unchanged), the HP / MP / CTB
application, revival, the drain heal, the Overdrive gauges, the status rolls and removals and Delay (both batch W2), shatter
and the scripted extras. Files: `abilities.ts` (the action loop), `hit-apply.ts` (one hit's engine business, new),
`adapt/{draws,words,command,affinity,hit,preview}.ts` (engine state to kernel inputs), `accuracy.ts`, `formulas.ts`,
`elements.ts`, `math.ts` (thin read-only views for the advisor, the intent panel and the tests).

## 1. Every kernel input and its engine source

An input the engine cannot supply is an error, never a default. Where the table says "constant", the value is the game's and
the reason is in the row; where it says "ours", the value is a number our data carries and it is not retuned.

**Hit check** (`kernel/hit.ts`, exe 0x78a890)

| Input | Engine source |
|---|---|
| command flag word (accuracy formula, Darkness, no effect on the living) | the ability's game record `AbilityDef.record.flagsMisc` with the Delay bits cleared; an ability with no record: derived from `canMiss`, `accuracy`, the user's side, `affected-by-darkness`, `misses-if-target-alive`; an enemy's generic Attack: its `plainAttack` record, else derived |
| command accuracy byte (formulas 1 and 2) | ours (`AbilityDef.accuracy`; 44 rows differ from the game's, listed in the data test); an enemy's `plainAttack.accuracy`; absent for formula 1 or 2 is an error, pinned by a data test |
| user Accuracy (formulas 3 to 7) | `stats.acc`. Read only by the party's Attack; no shipped enemy ability has a record with formula 3 or higher (checked) |
| user and target Luck | `stats.luck`, the raw byte (the old engine floored the target's at 1) |
| user Darkness | the `darkness` status is present |
| user Aim and Luck stacks, target Reflex and Jinx stacks | the stack counts of those statuses |
| target Evasion | `stats.eva` |
| target status word, sleep counter, petrify flag | `permWord(target)`, the `sleep` status |
| counter kind 2 (Evade & Counter) | the target wears the auto-ability, the command is physical and single-target, not a counter, not aimed at oneself (the exe's `pp_BtlCounterKind`, 0x78c1d0, read through Ghidra) |

**Critical check** (`kernel/crit.ts`, exe 0x789690)

| Input | Engine source |
|---|---|
| command damage flag word (can crit, takes the equipment's bonus) | `AbilityDef.record.flagsDamage` |
| command crit byte | ours (`AbilityDef.bonusCrit`); an enemy's `plainAttack.critBonus` |
| user Luck stack, target Jinx stack | stack counts |
| user equipment crit bonus (`Chr+0x5d8`) | the equipped weapon's and armour's `bonusCrit` for the party; **0 for every monster, settled in the exe** (research/re-ffx-commands.md section 5); **6 for every aeon (corrected by re-parity W5, 2026-10-10: an aeon wears two fixed pieces of gear, crit byte 3 each; docs/handoff/re-parity-w5.md)** |
| always-critical buff | the `guaranteed-critical` status -> buff flag 0x10 |

**Per-hit pipeline** (`kernel/hitdamage.ts`, exe 0x78e630)

| Input | Engine source |
|---|---|
| user Strength, Magic, Cheer, Focus, HP, MP, max HP, max MP | `statsUser.stats` (the actor, except the one documented two-actor rig), `cheer` and `focus` stacks |
| user permanent status word | `permWord`: ko, zombie, petrify, poison, the four Breaks, confuse, berserk, provoke, threaten; a combatant that is down but still on the field counts as dead |
| user auto-ability words | Magic Booster 0x40, Alchemy 0x200, Pierce 0x2000; Break Damage Limit 0x800 |
| user buff flags | `damage-9999` -> 8, `guaranteed-critical` -> 0x10 |
| default-attack command id, current command id | constant 0x3000 (what Berserk multiplies); the record's id, or 0x3000 for the generic Attack |
| `Chr+0x5ca` bonus flag | constant 0: only command 0x311f (the game's own Auto-Life revival) consumes it, and no ability of ours is that record |
| weapon formula, power, element | constant Strength 16 (`Chr+0x5c1` = 1 and `Chr+0x5c7` = 0x10 are set that way for the party and for monsters, settled in the exe; all 23 weapon-command records and our abilities carry 1 and 16, pinned by a data test); the element is the weapon's strike auto-abilities |
| party percent bytes, dealt and taken | `offensiveBonusPercent`, `defensiveBonusPercent` (the best tier of the equipped Strength, Magic, Defense and Magic Defense auto-abilities) |
| timed-input scale | the Overdrive timing payload |
| target Defense, Magic Defense, Cheer, Focus, max HP, max MP | `stats`, stacks |
| target running HP, MP, CTB | the live values; CTB from `rtOf` |
| target tick speed and base CTB | `ICV_BASE` for its Agility; base CTB is three ticks |
| target extra status word | shield, boost, eject, auto-life, curse, defend, guard, sentinel, doom, scan |
| target special word (Armored, immune to fractions, to physical, to magical, to all) | `immunityFlags` |
| target immune to Delay, overkill threshold | `immunityFlags`; `enemy.rewards.overkillThreshold` (the party: the largest int) |
| target element masks (absorb, null, resist, weak) | `affinities` as the game's four byte masks (fire 1, ice 2, thunder 4, water 8, holy 0x10) |
| target id and save counter | constants 0xff and 0: read by damage formula 0x16 only, which no ability of ours has (`FORMULA_NUMBER` cannot produce it; pinned) |
| command type, damage flag word, damage classes | the record (or derived) |
| command formula, power, element | ours (formula key -> the game's number; `AbilityDef.power`, or the caller's override for reels, Fury tiers and Bushido rows; the element list as a mask) |
| hit record: permanent and extra words, Shell, Protect, Nul counters | the target's statuses; Nul 0 none, 0xff permanent, else the charges left, written back after the check |
| gil offered | `ResolveOptions.gilSpent` |
| user id | constant 0: it only picks an RNG stream and the damage code never reads it |

Not in the pipeline's inputs here: the status result (`HitInput.status`, batch W2; the engine's own status rolls run after the
damage draws, which is the game's order).

## 2. Data added

`AbilityDef.record` (`FFXCommandRecord`: type byte, the two flag words, damage classes), one per ability, from the game's
kernel tables, in `src/data/ffx/command-records/`: 451 abilities (77 items, 221 party and aeon commands, 153 boss and enemy
actions), attached in place where the catalog is assembled (`src/data/ffx/index.ts`). Source, matching method and the table
of ability id -> record id: `research/re-ffx-commands.md`; the 979 records themselves (numbers only):
`tests/fixtures/parity/ffx/command_records.json`; the data test pins every attached record word for word. Three abilities
of ours have no record and keep the engine's own reading, derived from their flags: `close-in` (an Evrae chapter Trigger
Command), `mac-seymour-idle` (a scripted idle line), `omnis-volley` (the engine's wrapper for the four disc spells, which
have their own records). `EnemyDef.plainAttack` (new member, additive, CONTRACT-CHANGES): the five possessed aeons carry the
game's monster-side Attack, record 0x6000.

The formula, power, element, hit count, accuracy byte and crit byte stay the ability's own and are not retuned. Where they
differ from the game's record, the engine keeps ours and the 44 rows are listed (`KNOWN_DIFFERENCES` in
`tests/unit/data-ffx-command-records.test.ts`, `research/re-ffx-commands.md` section 4). The ones that matter most are the
`[estimate]` accuracy bytes on attacks the game never rolls (accuracy formula 0): Cross Cleave 100, Left Arm Strike 100 (both),
Jecht Beam, Jecht Bomber (both), Ultimate Jecht Shot, Mortibsorption, Dispelling Slap. The bytes are now unread.

## 3. Engine code replaced and deleted

No parallel formula path is left. Deleted: `baseDamage`, `damageSkeleton`, `offensiveStat`, `defensiveStat`, `poolOf`,
`DamagePool`, `ifloor`, `mulDivFloor`, `mitigation`, the old hit table and hit sum, the old crit sum, the old per-ability
resolver in `abilities.ts` (419 lines -> 161, the rest is `hit-apply.ts`), `formulas.ts` 393 -> 86 lines. `critChance` lost its
fourth argument. `docs/CONTRACT-CHANGES.md` has the three entries (`AbilityDef.record`; the removed exports and the draw
order; `FFXPlainAttack`).

## 4. Tests changed, and why

| Test | Change | Game-code reason |
|---|---|---|
| `parity-ffx-engine-wiring` (new, 13 tests) | the engine's own `resolveAbility` against an independent oracle (`helpers/ffxEngineWiring.ts`, which imports nothing from `adapt/`) on 400 generated situations: same draws in the same order and count, same outcome, amounts, crit flag, affinity, HP, MP, CTB and Nul charges; targets outer, hits inner; derived records equal the same words written out; the previews equal the kernels; the plain-Attack rule (5 tests). Mutation-checked: four tests fail with the plain-Attack rule off | the proof of the wiring |
| `ffx-engine-golden` | all 18 digests re-baselined, then Chapter III's two again | "game-code parity" (table in section 8) |
| `ffx-formulas` | imports the kernel's `defTerm`; a natural Defense 0 is no longer raised to 1: STR 20 / power 16 / variance 16 -> 280, not 278 | the exe's base-damage function (0x789bf0) reads the byte unchanged |
| `data-ffx-tables-abilities` | Cross Cleave and Left Arm Strike (both) move from "still rolls accuracy" to "always hits" | their records (0x6074, 0x60c6, 0x60c7) carry accuracy formula 0 |
| `strategy-seymour-flux` | floors 15/40 -> 8/40 (measured 10), 73/160 -> 40/160 (measured 45), early losses 2 -> 12 (measured 9); documented losses are seeds 1, 7, 42, bounded by turn >= 8 | Cross Cleave never misses (record 0x6074) |
| `advisor-degenerate-boards`, `advisor-floor` | wins 19 -> 11 floor (measured 12/40); boards with somebody down 100 -> 60 floor (measured 86, was 120) | the same Cross Cleave answer; restoring only its old formula gives 18/40 |
| `advisor-v4-card` | seed 3's first menu is a Zombie board and the search now clears it (Holy Water on Yuna) where it slowed Seymour | the whole engine's numbers (unchanged with Cross Cleave restored); the card's own rule says the same |
| seed pins moved by the new draw order | `ffx-aeon-no-items` (1 -> 2), `ffx-results-ap` (7 -> 4), `advisor-note` (seed 1 -> seeds 18 and 2), `advisor-plan-recovery` and `advisor-sentence` (Chapter I runs seeds 11 and 2), `advisor` (1,2,3 -> 2,3,4), `guide-advisor-target-agreement` (42 -> 9), `chapters/evrae-engine` (7 -> 4), `chapters/isaaru-duel` (14 -> 15), `chapters/macalania-engine` (2 -> 1) | each file names its seed and why |
| `data-ffx-command-records` | new in `47798c50`; two tests added in `a4d043e4` for the possessed Attack | records equal the game's table |

Run state of this tree: `tsc` is clean for everything this batch touched (the FFX-2 agent's untracked, in-progress files under
`src/battle/ffx2/kernel/dressphere-*.ts` had a compile error of their own while this was written); all 24 `parity-*.test.ts` pass
(887 pass, 12 skipped, run together with the goldens and the data test); of 419 FFX-related test files all pass except the
art-only ones and one FFX-2 test that times out under parallel load. The full-suite result is in section 9.

## 5. Before and after

Harness: `tests/unit/ffx-parity-measure.test.ts` with `PYREFLY_MEASURE=1` (`PYREFLY_MEASURE_OUT=<file>` writes JSON): the
shipped `intendedStrategy` through each FFX chapter's whole chain, seeds 1 to 12, wins / losses / mean party turns / mean party
KOs. Before = the tree at `47798c50` (the engine as it was), after = `a4d043e4`.

| Chapter | Wins | Losses | Party turns | Party KOs | Flag |
|---|---|---|---|---|---|
| I Seymour Flux | 7 -> 2 of 12 | 5 -> 10 | 43.7 -> 24.7 | 3.8 -> 4.1 | MOVED -5 |
| II Yunalesca | 12 of 12 | 0 | 128.3 -> 134.6 | 7.2 -> 8.7 |  |
| III Braska's Final Aeon (7 links) | 12 of 12 | 0 | 249.2 -> 255.4 | 5 |  |
| VII Anima and Macalania | 11 -> 12 of 12 | 1 -> 0 | 49.5 -> 50.6 | 5.1 -> 4.2 |  |
| VIII Evrae | 12 -> 11 of 12 | 0 -> 1 | 65.3 -> 66.8 | 0.4 -> 0.8 |  |
| IX Yojimbo | 11 -> 9 of 12 | 1 -> 3 | 78.4 -> 71 | 7.3 -> 6.8 | MOVED -2 |
| X Seymour Natus | 6 -> 9 of 12 | 6 -> 3 | 42.1 -> 45.4 | 0.6 -> 0.8 | MOVED +3 |
| XII Seymour Omnis | 10 -> 7 of 12 | 2 -> 5 | 124.3 -> 111 | 16.6 -> 14.9 | MOVED -3 |
| XIV Isaaru (3 links) | 12 -> 10 of 12 | 0 -> 2 | 31.3 -> 30.5 | 2.5 -> 2.8 | MOVED -2 |
| XVII Sin: Fins and Core | 8 -> 3 of 12 | 4 -> 9 | 313 -> 303.3 | 7.5 -> 11 | MOVED -5 |
| XVIII Sin: Face | 4 of 12 | 8 | 64.3 -> 64.4 | 2 |  |

A 12-seed sample has a standard deviation of about 1.7 wins near half, so most of the flagged moves are sampling noise. The
same line over 500 seeds, old engine against new (`agg.mjs`-style scratch driver, not in the repo; the numbers are
reproducible with the harness and a seed range):

| Chapter | Old wins | New wins | Change | Reading |
|---|---|---|---|---|
| I Seymour Flux | 267 (53.4%) | 131 (26.2%) | -136 (-27.2 points) | real (-8.8 sd) |
| II Yunalesca | 498 (99.6%) | 499 (99.8%) | +1 (0.2 points) | noise (0.6 sd) |
| III Braska's Final Aeon (7 links) | 487 (97.4%) | 488 (97.6%) | +1 (0.2 points) | noise (0.2 sd) |
| VII Anima and Macalania | 482 (96.4%) | 494 (98.8%) | +12 (2.4 points) | borderline (2.5 sd) |
| VIII Evrae | 488 (97.6%) | 487 (97.4%) | -1 (-0.2 points) | noise (-0.2 sd) |
| IX Yojimbo | 428 (85.6%) | 427 (85.4%) | -1 (-0.2 points) | noise (-0.1 sd) |
| X Seymour Natus | 393 (78.6%) | 389 (77.8%) | -4 (-0.8 points) | noise (-0.3 sd) |
| XII Seymour Omnis | 281 (56.2%) | 290 (58.0%) | +9 (1.8 points) | noise (0.6 sd) |
| XIV Isaaru (3 links) | 434 (86.8%) | 424 (84.8%) | -10 (-2.0 points) | noise (-0.9 sd) |
| XVII Sin: Fins and Core | 269 (53.8%) | 280 (56.0%) | +11 (2.2 points) | noise (0.7 sd) |
| XVIII Sin: Face | 151 (30.2%) | 124 (24.8%) | -27 (-5.4 points) | borderline (-1.9 sd); the ablation below names the cause |

Causes, from the per-ability old-against-new table (hits, misses, crits, average damage of every ability over the 500 seeds)
and from ablations (the wired engine with one change put back):

- **I Seymour Flux, real: 267 -> 131 of 500.** Cross Cleave never misses (record 0x6074 has accuracy formula 0; our byte of
  100 is marked `[estimate]` in `seymour-flux-abilities.ts`): it missed 27% of the time and misses none now. Putting back only
  that one formula gives 239 of 500, so it is 108 of the 136; the rest is small shifts spread over the party's side (below).
  `combat-fixes-bench` shows the same chapter: intended 112 -> 53 of 200, drain-farm 15 -> 1.
- **XVIII Sin: Face, small and real: 151 -> 124 of 500 (-5.4 points).** Spells no longer crit: the can-crit bit is clear on
  every White and Black Magic record. Lulu's Firaga and Thundaga lose their 3 to 5% crits, about 3% of the party's damage. The ablation
  that puts the old crit flags back returns 149 of 500.
- **VII Anima and Macalania, small: 482 -> 494 of 500.** The aeon specials (Aerospark, Heavenly Strike, Sonic Wings...) have
  accuracy formula 0: they missed 14 to 18% and miss none now.
- **IX Yojimbo (-2 of 12), X Natus (+3), XII Omnis (-3), XIV Isaaru (-2), XVII Sin Fins and Core (-5): sampling noise** (500
  seeds: -1, -4, +9, -10, +11). The ability-level changes in them are real and are listed below (Daigoro's attack no longer
  crits; Mortibody's Shattering Claw deals nothing to a petrified target).
- II, III, VIII: no movement. Chapter III's possessed aeons now miss about half their plain Attacks (the record's formula
  2 on a byte of 90 against the party's Evasion), and Braska's Final Aeon's Left Arm Strikes never miss; the chapter still wins
  488 of 500.

`combat-fixes-bench` (200 seeds a line): every FFX-2 row (Chapters IV to VI) is byte-for-byte identical before and after.
FFX: Chapter I intended 112 -> 53, drain-farm 15 -> 1, wrong 0 -> 0; Chapter III link 1 intended 194 -> 195, provoke line
39 -> 9 (Braska's Left Arm Strikes no longer miss).

## 6. Behaviour changes, each from the game's code

Everything below is the exe's answer, put into the engine; none of it is a tuning decision.

1. **Draw order.** Hit roll, then variance, then critical roll, per hit; targets outer, hits inner (the old order was hit,
   critical, variance, and hits outer). Moves every seeded replay.
2. **The hit roll is the game's.** Each command's accuracy formula (0 never rolls: every spell, item, Overdrive, aeon special and
   several boss attacks; 1 to 7 as the record says), the nine-entry table, Aim and Reflex x10, Luck and Jinx stacks one point each, the
   target's raw Luck, Darkness dividing a flagged command's accuracy by 10 (the old engine's Luck exception for Darkness is not in the exe),
   Evade & Counter making a physical single-target hit miss.
3. **Critical hits.** Only commands whose record can crit (no spell can; physical skills the game marks do, for example
   Kimahri's Jump now crits). Luck and Jinx stacks count one point each in the crit sum (the old engine counted ten). A command with the
   equipment-bonus bit takes the equipment's bonus and a monster has none, so Daigoro's attack (17% crit before) and Braska's Final
   Aeon's Triumphant Grasp (7%) no longer crit.
4. **Damage.** (The differences the paper preflight found in the old chain, `docs/plans/re-parity-review.md` section 2, are gone because the
   chain is now the kernel's.) The modifier chain in the game's order (3 to 4% of ordinary hits were off by one); a natural Defense of 0 is not raised
   to 1; Cheer and Focus apply only to the formulas that have a term for them (Cure with Focus 5 on the target: -512 against -768);
   Armored follows the command's pierce bit, not the damage type; the 9999 buff is read from the user; Berserk multiplies the default
   attack only; Magic Booster and Alchemy apply where the game says; the multi-element ladder (absorb fire plus resist ice halves,
   it does not absorb); the party percent bytes apply to every physical and magical command, heals included (a Full Life on a
   member wearing Magic Defense +10% restores 1,350 of 1,500); nine formulas the old engine lacked.
5. **Petrified targets take no damage** (the exe's petrified-no-damage step): Mortibody's Shattering Claw deals 0 to a stoned party
   member, shatters it on the roll, and its average damage fell 21%.
6. **Multi-hit, multi-target actions** run target by target; per-hit random-target actions (Slice & Dice, the Furies, Multi-ra) stay hit
   by hit.
7. **Nul-element counters** follow the game's check: a hit the Nul covers ticks that element's counter by one (a permanent Nul, 0xff,
   never ticks), and only such a hit does.
8. **An enemy's plain Attack** is a monster-side record: the possessed aeons' is 0x6000 (miss about half), any other enemy that
   attacks with the generic command keeps today's reading.

## 7. What was not done, and what could not be sourced

- **Aeon plain Attack.** The engine has one generic Attack for every actor and an aeon's runs on the party's record 0x3000, as before.
  The game's six aeon records (0x30cb to 0x30db) use accuracy formulas 5 and 6 (the user's Accuracy x2.5 or x1.5) and powers 14
  (Valefor, Shiva) and 16; they are attached to the `*-attack` abilities of the aeon files, which no command reaches. Routing them
  is a separate game-visible change (Valefor's and Shiva's Attack would drop from power 16 to 14) and is Bailey's call.
- **Status infliction, the turn queue, Delay** (W2). The Delay Attack and Buster bits are cleared from the word the kernels read so
  the queue's own delay is not charged twice; 4 abilities' record bits differ from the data's `weak-delay` and `strong-delay` flags.
- **Kernels still unwired** (`node tools/orphans.mjs`): `kernel/ctb*.ts`, `status-inflict.ts`, `status-extra.ts`, `status-pool.ts`
  (W2), `rolls.ts` (Escape and battle-start rolls), `rng.ts` (the game's generator; plan P3).
- **Possessed aeons' Luck.** Our mirror forces Luck 1 (the wiki); the game's record keeps 0 (`research/re-ffx-ai-yunalesca-bfa.md`
  section 5.4). One point of hit chance; left as it was.
- **Other enemies' generic Attack.** No sourced record is attached to a confused or script-less enemy; none in a shipped chapter
  reaches that path.
- **Browser check.** No UI file changed and this worktree has no `public/art`, so the plan's real-input browser check (acceptance case 6)
  is left to the main session's validation.

## 8. Goldens

The 18 digests (the full log of every link, fnv-hashed) were re-baselined in `960eb80e`; Chapter III's two again in `a4d043e4`. Old values are in git history (`2815f1e1`).

| Golden | Old digests | New digests | Outcome |
|---|---|---|---|
| seymour-flux#1 | d5fd8bf4 | 28692f2c | unchanged (defeat) |
| seymour-flux#7 | 420e8126 | f923eb10 | MOVED victory -> defeat |
| yunalesca#1 | b20edebb | 2327f640 | unchanged (victory) |
| yunalesca#7 | 2b4ba8df | 4225415d | unchanged (victory) |
| braskas-final-aeon#1 | ca3f7569 e41be697 128fa095 d57abcc1 4c3a1fd4 2ec2be2f 2e29d25c | 567c3bf4 ea51a558 ba4a14f2 509fbd2 1ebf8f7c da4942b3 e84aa63 | unchanged (victory x7) |
| braskas-final-aeon#7 | c1e3482 90fc8d41 918adb39 ad58d940 abbc417b 9621c0d7 3bcdda13 | 2b85c492 f82347e2 42bd9a74 48d2e753 86304bae 7e4d660e cddd0f5d | unchanged (victory x7) |
| seymour-anima-macalania#1 | fb27d3f2 | 15ecc081 | unchanged (victory) |
| seymour-anima-macalania#7 | ab704669 | 86868cbf | unchanged (victory) |
| evrae-airship#1 | ebf9b7c4 | 14674509 | unchanged (victory) |
| evrae-airship#7 | 73022786 | 3c97dd63 | unchanged (victory) |
| yojimbo-cavern#1 | 354ac345 | fce6b795 | unchanged (victory) |
| yojimbo-cavern#7 | 13a3322e | c3a419df | unchanged (victory) |
| seymour-natus#1 | 6fe6bbe1 | d4682a0e | MOVED defeat -> victory |
| seymour-natus#7 | 4be27cc4 | 2133d3d8 | MOVED defeat -> victory |
| seymour-omnis#1 | 354e0ace | b7b53dbe | MOVED victory -> defeat |
| seymour-omnis#7 | ac28e23c | 1a2a42df | unchanged (victory) |
| isaaru-via-purifico#1 | a9b7568a 5be7c9ed 32b8ae86 | d916c9d0 bc11f7e3 42ea7beb | unchanged (victory x3) |
| isaaru-via-purifico#7 | cc3291bd a32106b5 3c5d0bb6 | b073037f 584e6881 e0f5e2d6 | unchanged (victory x3) |

## 9. Full suite

One run of the whole unit suite on `a4d043e4` (`node vitest.mjs run`, 2026-10-08): **924 files, 896 passed, 22 failed, 6 skipped;
13,790 tests, 13,548 passed, 162 failed, 79 skipped, 1 todo.**

**All 22 failing files are failures that exist without this batch and none touches the FFX engine:**

- 21 files need `public/art`, which this worktree does not have (the paintings are gitignored on main and live in the main tree):
  `ui-portrait-face-crop` (125 tests), `chapters/trema-ship-content` (4), `art-ref-defaults` (4), `pause-remake` (3),
  `chapters/isaaru-ship` (3), `chapters/den-of-woe-ship-content` (3), `chapter-meta-seymour-anima-macalania` (3),
  `chapter-meta-evrae` (3), `chapters/natus-ship-scene` (2), `chapters/natus-ship-content` (2), `chapters/leblanc-art` (2),
  `chapters/fallen-aeons-ship-content` (2), `chapter-meta-ffx2-leblanc` (2), `cutscene-story-poses` (1),
  `chapters/fallen-aeons-ship-scene` (1), `chapters/den-of-woe-ship-scene` (1), and five files that fail on import
  because `public/art/manifest.json` is missing: `party-face-manifest`, `chapters/yojimbo-content`,
  `chapters/leblanc-party-sprites`, `chapters/chapters-6-7-8-enemy-sprite-manifest`, `chapter-meta`.
- 1 file, `strategy-ffx2-bahamut` ("heal-only route clears Mega Flare"), times out at the 15-second default under the parallel
  load of a full run and passes alone in 11 seconds. It is an FFX-2 test; the FFX-2 engine is untouched.

The baseline run of the same suite before the wiring (scratch log of 16:56, 920 files) fails the same 22 files plus
`parity-ffx-element` (two tests, since fixed by the kernel lane): 23 failing files, 164 failing tests. Nothing this batch
touched fails.

## 10. Decisions for Bailey

1. **Chapter I's difficulty.** The game's own record makes Cross Cleave unevadable, so the shipped line wins 26% of seeds (it won 53%).
   Options: keep the game's answer (the 1:1 reading, and the recommendation), or give Cross Cleave an accuracy of our own, which is an
   invented number. Nothing was retuned.
2. **Aeon plain Attack** (section 7): route it to the aeon's own record, or keep the party's.
3. **The game's RNG** (plan P3): adopt each game's own generator and stream map, seeded from our seed. It moves every seeded golden
   and replay again.

## How to re-run

```
node "D:/Final Fantasy/node_modules/typescript/bin/tsc" --noEmit
node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run tests/unit/parity-*.test.ts tests/unit/ffx-engine-golden.test.ts tests/unit/data-ffx-command-records.test.ts
PYREFLY_MEASURE=1 PYREFLY_MEASURE_OUT=out.json node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run tests/unit/ffx-parity-measure.test.ts
PYREFLY_MEASURE=1 node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run tests/unit/combat-fixes-bench.test.ts
node tools/orphans.mjs
```

NOW.md is left to the main session (other agents are active in the tree).
