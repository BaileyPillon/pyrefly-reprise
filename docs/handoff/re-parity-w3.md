# Re-parity W3: the FFX-2 engine rolls hits, critical hits, damage, statuses and theft through the game's own kernels

Status: **built and committed on branch `re-parity`, not merged, not deployed** (2026-10-09). Track `re-parity`
([plan](../plans/re-parity.md), [paper preflight](../plans/re-parity-review.md) row W3, method: [re-parity-w1](re-parity-w1.md)). Owner: Bailey.
**Game case: FFX-2 only** (AGENTS.md rule 14). FFX and FF7 do not import any module this batch touched; `ffx-engine-golden` and
`ff7-golden` pass unchanged.

Bailey, 2026-10-08, the ask this track answers: "It needs to be a 1:1 parity." (2026-10-08 22:42: "Full speed ahead you don't need to conserve".)

Commits (all on `re-parity`; nothing pushed):

| Commit | What |
|---|---|
| `72caa348` | The measurement harness `tests/unit/ffx2-parity-measure.test.ts`: seed ranges, one letter per seed, the sums behind the means |
| `bde447b1` | The research note `research/re-ffx2-commands.md` and the numbers-only fixtures it cites (205 command rows, 33 monster rows with their command lists, the two difference lists) |
| `6839c4b2` | The wiring: the engine, the 240 + 44 command records and 33 monster rows on the abilities and enemies, the adapters, the wiring test with its oracle, the data tests, every pin and golden the game's rules moved, the contract entry |
| (this note) | `docs/handoff/re-parity-w3.md` |

## What the engine does now

An FFX-2 action is resolved in the game's two stages (`resolve-strike.ts`, the module header has the long version):

1. **Hit determination, once per action record** (`kernel/hit.ts`, exe 0x641500). Every target, in ascending slot order, gets its accuracy
   roll for the command's accuracy formula (0 never rolls; 1 and 2 the race; 3 to 5 the instant-effect chance; 6 Bribe; 7 level^6), and the
   hits are planned: each target takes the command's hit count, or, for a command that spreads its hits (a row with the random-target bit,
   or an ability the engine aims at a random target), each hit goes to one target picked from fixed stream 5. A target that misses takes no
   strike; the engine says so once.
2. **Strikes, one per hit event** (`pp_action_hit_event`). At each hit event every target with hits left takes one strike, in ascending slot
   order. One strike is `pp_dmg_calc_target`: `kernel/pipeline.ts` (the HP, MP and ATB classes: base formula and its variance draw, the
   critical roll, Berserk, the modifier chain, back attack, chain, element ladder, Shell / Protect / Defense, immunities), then
   `kernel/status.ts` (every status with a chance byte, group 1 then group 2), the shatter roll on a Petrified target, the Bribe reward,
   `kernel/settle.ts` (the all-target halving, Death replacing damage, the Damage 9999 snap, the limit), then Steal and Pilfer Gil
   (`kernel/steal.ts`); and the result is applied (HP with the chain counter, MP, the statuses, the stolen item or gil).

The draws come in the game's order, one engine draw per kernel draw (`adapt/draws.ts`: the variance is `int(0, 31)`, a hit roll the range
its formula reduces, a critical roll `int(0, 99)`, a status roll `int(0, 100)`, the steal rolls their own), so the seeded stream and the
advisor's roll policy keep working. **Adopting the game's own generator is a separate decision for Bailey (plan P3) and is not made here.**

The engine keeps what is not the kernels' job: the MP and HP costs, Charon's cost, a sequence of stages (No Love Lost), reveals (Scan,
Libra), KO / Auto-Life / revival (`resolve-hp.ts`), the events (shape unchanged), the chain WINDOW (the game's counter is kept, the reset is
section 7, item 1), the engine-only statuses with no slot in the game's tables (the hidden Delay effect, Action-cancel; `resolve-status.ts`), the
Charon, Bullseye and Dud riders, and everything in batch W4 (the ATB gauge, charge, recovery, the status timers, Poison and Regen).
Files: `resolve.ts` (the action), `resolve-strike.ts` (hits and strikes, new), `resolve-status.ts` (the result buffer back to statuses,
new), `resolve-hp.ts`, `steal.ts` (the theft, rewritten on the kernels), `chain.ts`, `hit.ts` (the read-only odds), `adapt/{command, inputs,
words, slots, draws, preview, attack-records}.ts` (engine state to kernel inputs, new), `fallback-records.ts`, `intent.ts`,
`engine/tactics/advisor-roll.ts`.

## 1. Every kernel input and its engine source

W1's method: an input the engine cannot supply is never defaulted silently. It is either data this batch added from the game's tables (the
monster rows: Accuracy 95 where the data carried 0 and the engine invented 104, the status resist bytes, the steal byte, the Pilfer Gil
figure) or a constant whose reason is in its row below. The two defaults left in the adapters (a unit with no level reads 1; an enemy
with no monster row reads its immunity flags) only serve test fixtures: `tests/unit/data-ffx2-monster-records.test.ts` pins that every enemy and
part of the seven chapters has both a row and a level. Where the table says "ours", the value is a number our data carries and it is not retuned.

### Hit determination (`kernel/hit.ts`, exe 0x641500; `adapt/inputs.ts` `hitAttacker`, `hitTarget`)

| Input | Engine source |
|---|---|
| attacker and target slot id (stream selector, the Petrify rule) | `assignSlotIds`: the party 0.., the enemies 15.., each side by its `slot` then its position |
| levels `Chr+0x380` | `unit.level` (a girl's build level, an enemy's `level`); 1 when absent, which no chapter unit relies on (pinned) |
| Luck `Chr+0x39b`, Evasion `+0x39c`, Accuracy `+0x39d` | `stats.luck`, `stats.eva`, `stats.acc`, rounded and clamped to a byte. A girl: ours (the dressphere tables, `research/re-ffx2-dressphere.md` §5 D1 says where they differ from the game's stat builder). An enemy: the monster row's, 95 for all |
| the three stages (Accuracy `+0x443`, Evasion `+0x444`, Luck `+0x445`) | Up level less Down level of `accu-*`, `eva-*`, `luck-*`, clamped to -10..+10 |
| attacker Darkness | the `darkness` status |
| command: id, accuracy formula, Darkness bit, accuracy byte, power, hits, physical-only, random targets | the game row (`ffx2Record`), else the row derived from the ability's fields. **Rule 5** turns a magical row's formula into 0 unless the ability says `canMiss: true` (`ruleFive`); an ability the engine aims at a random target adds the spread bit |
| action: repeat count and limit | constants 0 and 3 (the command start sets them; `research/re-ffx2-hit-status.md` §7 open question 2) |
| action: amount `ActionRec+0xb0` | `AbilityCommand.gilSpent` (Bribe, Spare Change) |
| hits override | the minigame's hit total (Trigger Happy's presses, a dice roll) |
| target asleep / petrified / stopped | the `sleep`, `petrify`, `stop` statuses |
| target Evade & Counter (`Chr+0x650` bit 8) | constant false: the auto-ability is not modelled and no chapter's build equips it |
| target in hit reaction (`Chr+0xd98`) | `isChained(target)`: the chain window is open. A stand-in (section 7, item 1) |
| aided (a player-side monster) and the aid count | constant false and the default 3 (x1): no chapter fields one |
| target max HP, accumulated Bribe `Chr+0x67c` | `stats.maxHp`; `Ffx2Unit.bribeAccumulated`, written back from formula 6's result |
| Bribe immune (`Chr+0x3a7` bit 1) | the monster row's special word bit 9, else the `immune-to-bribe` flag |
| Eject / Death / Petrify resist (`+0x40e`, `+0x404`, `+0x405`) | the target's resist table, slots 10, 0, 1 |
| the level^6 resist byte `Chr+0x66b` | the monster row's `zantetsu`; 0 for a girl |

### Critical check (`kernel/crit.ts`, exe 0x617210)

| Input | Engine source |
|---|---|
| can crit, fixed chance, crit byte | the row's damage flags 0x4 and 0x8 and byte `Cmd+0x29`; the kernel is only asked when the pipeline's row can crit |
| attacker slot id (the stream) | `assignSlotIds` |
| both Luck bytes and Luck stages | as above |
| Always Critical (status word 1 bit 0x8000) | the `guaranteed-critical` status |

### Damage pipeline (`kernel/pipeline.ts` and `settle.ts`, exe 0x6172c0)

| Input | Engine source |
|---|---|
| command: id, category, target flags, misc flags, damage flags, damage classes, formula, power, element byte, species killers | the row (or derived). The all-target flag `ActionRec+0x27` is set when the user is a girl, the row can target all (`Cmd+0x10` bit 0x80) and the ability is an `all-*` pick; **a scripted monster command never halves** (the exe's monster scripts never write the byte) |
| attacker id, HP, max HP, MP, max MP | the actor's slot id; live `hp`, `mp` and `stats.maxHp`, `stats.maxMp` |
| attacker STR and MAG bytes and stages | `stats.str`, `stats.mag`; `str-*`, `mag-*` statuses |
| attacker status word 1 (Berserk 0x80, Damage 9999 0x4000) | `statusWord1`: one bit per group 1 status the unit carries |
| attacker auto-ability word `Chr+0x650` (Booster 0x20, Medicine 0x100, Element Master 0x200, Non-Element Master 0x400) | constant 0: the engine models no auto-ability but Break Damage Limit |
| attacker `Chr+0x652` bit 0 (Break Damage Limit) | `ResolveContext.breaksDamageLimit(user)` (a Garment Grid gate or an accessory, cached on the girl), or the cast's authored `always-break-damage-limit` flag: the monster rows read so far carry no such word and eleven moves the FAQs say break the limit have no 0x80 in their row (note section 4), so the flag stands in for a monster's word |
| attacker weapon element `Chr+0x3af` | constant 0: the engine has no weapon element |
| target HP, max HP, MP, max MP, DEF and MDEF bytes and stages | live values; `stats.def`, `stats.mdef`; `def-*`, `mdef-*` statuses |
| target status word 1 (Defense 0x200, Petrify 2) | `statusWord1` |
| target element bytes (absorb, null, half, weak) | `affinityBytes`: `absorb`, `immune`, `resist`, `weak` per element (fire 1, ice 2, thunder 4, water 8, gravity 0x10, holy 0x20) |
| target Shell and Protect counters (`Chr+0x438`, `+0x439`) | 1 when the status is on |
| target immune to physical / magical / everything (`+0x447`, `+0x448`, `+0x449`) | the `null-physical`, `null-magic`, `invincible` statuses |
| target special word (`+0x3a6`: bit 0 percent, bit 6 ATB) | the monster row's word when the enemy carries one, else built from `immunityFlags` |
| target species mask (`+0x660`) | the monster row's `species`; 0 for a girl |
| target chain counter before the hit (`+0x5ad`) | `chainBefore(target)`: the running counter while its window is open, 0 when it is Stopped or Petrified or the window has closed |
| target in battle / dead | `!removed` / `!alive` |
| target `Chr+0x5ac` | constant 0 (its meaning is not pinned in the exe; 0 never blocks a target) |
| target ATB pool | the charge (remaining, total) while charging, else the recovery; computed, not applied (batch W4) |
| the three save-record fields formulas 0xd, 0x16, 0x17 read | constant 0: no reachable row uses those formulas |
| back attack | constant false: the engine has no facing, so **never a back attack** (`research/re-ffx2-commands.md` §9) |
| preview | false: the advisor's previews use the odds functions (`adapt/preview.ts`), which draw nothing |

### Status rolls and the shatter (`kernel/status.ts`, `statusGroup1.ts`, `statusGroup2.ts`)

| Input | Engine source |
|---|---|
| the two 24-byte chance tables, the amounts, the cleanse bit, the "uses the character's properties" bit | the row |
| attacker id and level; the weapon's tables | slot id and level; zeros: the engine has no weapon statuses |
| target level, status word 1, the two resist tables | as above; `immunities` by slot (a stat stage's Up and Down share a slot) |
| the protect mask (`Chr+0x570 \| 0x4fc`) and the two permanent layers | the statuses a unit carries from `EnemyDef.autoStatuses` (Chapter XIII's Spellspring); nothing else is a permanent source |
| the action-state mask `FUN_00632630` | constant 0: its low bits are not pinned (`research/re-ffx2-hit-status.md` §7 question 1) and the engine has no matching state, so no target counts as acting |
| the starting result buffer | `initialStatusResult` of the target's statuses (`pp_result_init`) |
| the shatter roll | whether the target was Petrified at the start of the strike, the row's byte, the attacker's slot |

The kernels' result buffer is made the unit's statuses by `resolve-status.ts` (a new bit becomes an applied status with the row's duration or
stacks; a cleared bit a removal; a stage's signed step becomes the Up or Down status with that many stacks). A status the 24-slot tables
cannot hold (the engine's hidden Delay effect and Action-cancel, Shattering) is rolled by the engine with the same landing rule, one
`% 101` draw each, after the kernels' statuses.

### Theft (`kernel/steal.ts`, `steal.ts`)

| Input | Engine source |
|---|---|
| steal chance byte `Chr+0x6ad`, common and rare slots | `rewards.steal.stealRate` (the monster row's byte; the `/255` figure of the authored percentage where no row exists), 0 once `stolenFrom`; the item and quantity of `rewards.steal.common` / `rare` (the item ids are ours) |
| the Sticky Fingers (0x30c4) and Master Thief (0x30c5) rolls | the command id of the row |
| Pilfer Gil chance `Chr+0x6ae` and figure `+0x6a8` | 255 (every monster's), 0 once `gilPilfered`; the monster row's figure in `rewards.stolenGil` |
| Bribe slots and the stored threshold | the `rewards.bribe` item in slot 0, slot 1 empty; the threshold formula 6 stored on the unit |
| the party's gil for a Bribe | the `gil` flag when the host sets one (the offer is free without a wallet) |

## 2. Data added

`AbilityDef.ffx2Record` (`FFX2CommandRecord`: the command row, 14 fields the kernels read, plus the three status tables and, for Russian Roulette, a
`pickOne`), one per ability the seven chapters can reach: **240 abilities** in `src/data/ffx2/command-records/` (24 items, 61 party
skills and 155 enemy actions, Russian Roulette's five rows among them), attached in place where the catalog is assembled (`src/data/ffx2/index.ts`), and **44 more** on the engine's
fallback table (`src/battle/ffx2/fallback-records.ts`: Bahamut's, the Vegnagun chain's and Shuyin's moves, which the AI scripts submit by
these ids); together **193 distinct rows** of the game's `item.bin`, `command.bin` and `monmagic.bin` (Russian Roulette's five among
them), **205** with the party's seven Attack rows, the one monster Attack row nothing else uses and the four rows a monster runs in place of an ability's own (`FFX2MonsterRecord.commands`, `research/re-ffx2-commands.md` section 7.0). The party's generic Attack is resolved per dressphere (`adapt/attack-records.ts`, seven rows);
a monster's own Attack is its record's `plainAttack`. 18 abilities of ours have no row (a passive, a menu marker, a script counter); any
ability outside the seven chapters' reach keeps working on a row derived from its fields (`deriveRecord`, which reads the flags exactly as
the old engine did). Source, matching method, the table of ability id to row and every place our numbers differ:
`research/re-ffx2-commands.md`; the rows themselves (numbers only): `tests/fixtures/parity/ffx2/command_rows.json`; the data test pins every
attached record word for word.

`EnemyDef.ffx2Record` (`FFX2MonsterRecord`): the game's monster row for all **32** enemies and parts of the seven chapters
(`src/data/ffx2/monster-records/`, `monster_rows.json`). `attachMonsterRecords` lays it on where each group is defined and corrects in place
what the kernels read: **Accuracy 95** (the data carried 0 and the engine invented 104), the status resist bytes (including Reflect no longer
resisted by the Sisters, Anima and Trema, Sleep no longer resisted by the Logos of room 2, Leblanc's STR/DEF/**Accuracy** stages where the data
said Luck), the item-steal byte (**128** for the 50 % bosses, 255 for the Goons) and the figure Pilfer Gil takes (560, 160, 200, 580 in
Chapter VI, where the data had none). The percent, Delay and Bribe immunities are read from the row's special word by the kernels. Nothing
else is touched: levels, HP and the stat bytes stay as authored, and `research/re-ffx2-commands.md` §7.2 lists where they differ.

`AbilityCommand.gilSpent` (additive): the gil a Lady Luck Bribe offers (`ActionRec+0xb0`). `CONTRACT-CHANGES.md` has the entry.

## 3. Engine code replaced and deleted

No parallel formula path is left. Deleted: `formulas.ts` (364 lines: `computeDamage`, the float chain, `hitPercent` / `critPercent` as the
old points race, `resolveAffinity`, the randomiser), `aeon-effects.ts` (122: the `setHpTo`, `mpFractionOfCurrent`, `mpFractionOfMax` rules,
now the rows' formula 0xa and their MP classes), `resolve-targets.ts` (110: the per-hit target pick and `applyRiders`), the old
`resolveTheft`, `statusChanceLinear` / `Quartic` / `Sextic` (`statuses.ts`), `registerHit`, `peekChainCount` and `cannotEvade` (`chain.ts`),
`ENEMY_BASE_ACCURACY` and the three accuracy constants it fed (`constants.ts`), and the old per-hit loop of `resolve.ts` (315 lines to 155,
the rest is `resolve-strike.ts`). `hit.ts` (100 to 36 lines) is now the read-only odds the HUD and advisor print; they come from the kernels
(`adapt/preview.ts`), so the printed percentage is the chance the game's own rule gives. The exports `computeDamage`, `critPercent`,
`hitPercent`, `defenseTerm`, `magicBase`, `physicalBase`, `randomiserRoll`, `resolveAffinity`, `specialMagicBase`, `registerHit`,
`cannotEvade`, `statusChanceLinear`, `statusChanceQuartic`, `statusChanceSextic` and the types `DamageContext`, `DamageResult` left
`src/battle/ffx2/index.ts`; `critPercent` and `hitPercent` came back from `hit.ts` with the same signature, and `bumpChain`,
`chainBefore`, `isRestorative`, `critProbability`, `hitProbability`, `statusProbability`, `statusProbabilityBetween` are new
(`docs/CONTRACT-CHANGES.md`). Mirrors that follow: `intent.ts` `statusOddsFFX2` (the game's landing rule, per command row),
`engine/tactics/advisor-roll.ts` `ffx2StatusPercent`, `simulate.ts` (the roll policy treats the new draw ranges as branch rolls).

## 4. Tests: new, changed, and why

Every changed expectation carries a comment in the test itself that starts "Re-parity W3" and gives the cause. None was loosened to pass:
each pin that moved is either the game's answer where the old test pinned our authored number, or a seed whose story changed with the
draw order (a seeded replay is a different replay, not a different rule).

### New

| File | What it proves |
|---|---|
| `tests/unit/parity-ffx2-engine-wiring.test.ts` (16 tests) with `helpers/ffx2WiringRig.ts` and `helpers/ffx2WiringOracle.ts` | The real resolver (`resolveAbility`) against an independent oracle that imports nothing from `adapt/` or the resolver and runs the kernels the way the game runs a command. 600 generated situations drawn from the 240 chapter abilities and the 44 fallback ones (more than 120 distinct commands seen): same draws in the same order and count, same events, same units afterwards (HP, MP, KO and eject state, status words, chain byte, stolen item and gil). Then the draws of the common commands, Russian Roulette's pick, target order and one strike per hit event, the derived row equal to the same words written out, the Attack row by dressphere, the ATB pool, and the printed odds equal to the frequency of the rolls over every draw value. A Bribe block runs 300 situations on the game's Bribe row (0x30f0, written out: no chapter reaches it) with the gil offered, the threshold stored on the target, the reward from its slot and the wallet, and a derived cleanse is checked against timed statuses. The situations are written in the game's terms (stat bytes, signed stage steps, status bits, element masks). 29 deliberate faults were put into the engine one at a time (below): 28 are caught; the survivor is an unreachable edge. |
| `tests/unit/data-ffx2-command-records.test.ts` | Every attached record equals its row in `tests/fixtures/parity/ffx2/command_rows.json` word for word; every chapter-reachable ability has a record, or is one of the 18 listed as having none; the ability-to-row differences equal `ability_differences.json` (so a new or fixed difference has to be seen); no reachable physical row is held by rule 5; Roulette is five rows. |
| `tests/unit/data-ffx2-monster-records.test.ts` | Every enemy of the seven chapters has its monster row and a level (`monster_rows.json`), and the corrected authored fields (Accuracy 95, the resist bytes, the steal byte, the Pilfer Gil figure) equal the row; the stat differences left alone equal `monster_differences.json`. |
| `tests/unit/helpers/ffx2Damage.ts` | A test-side `computeDamage` that runs the damage kernels for tests that used to call the deleted float chain. |
| `tests/fixtures/parity/ffx2/{command_rows,ability_differences,monster_rows,monster_differences}.json` | Numbers only (rule 8): the game's rows and monster rows (with each monster's command list), read from its data tables with the research lane's readers, and the differences against our own numbers. |

### Changed

| File | Change | Cause |
|---|---|---|
| `ffx2-formulas.test.ts` | Rewritten to drive `resolveAbility` on the kernels' integer chain; expected numbers computed by hand in the game's order | the float chain (`formulas.ts`) is deleted; integer truncation after every step, variance only on the formulas that use it, chain before element |
| `ffx2-statuses.test.ts` | The status-infliction describe block rebuilt on the game's landing rule (255 beats a resist of 255, a resist of 255 never, 254 always, else `draw % 101 < chance + 5 x level gap - resist`) | the three hand-written percentages are gone |
| `ffx2-steal.test.ts` | Steal, Pilfer Gil and Bribe asserted inside the strike on fixed streams 10 and 11 | the rolls and the Pilfer Gil figure (half to all, times `chance / 255`) are the kernel's |
| `ffx2-chain.test.ts` | The counter is the game's byte: read before the hit, `(n + 28) / 20`, +1 only for a positive HP number, capped at 99, cleared by Stop and Petrify | `chain.ts` rewritten on the byte; the window stands in for hit reaction (section 7, item 1) |
| `ffx2-all-target-hits.test.ts` | `immuneHitsSkipChain` is no longer read; an immune hit never opens a chain, a damaging one does | the game's byte rises only when a positive HP number is applied |
| `ffx2-magic-never-misses.test.ts` | A numeric `accuracy` is no longer a flat percentage; a row's byte is the base of formula 1 and a magical row with a record rolls its record's formula (0: never) | `hitPercent` is the kernel's odds; `research/re-ffx2-hit-status.md` §2.1 |
| `ffx2-ability-flags.test.ts` | `adds-equipment-crit` and `inherits-weapon-properties` removed from the "unread flags" list | `deriveRecord` reads both now |
| `ffx2-ally-heal-accuracy.test.ts` | A `wrong-state` miss (Phoenix Down on a living girl) is not a hit roll | PR-0075 is about the roll; seed 30 of chapter 4 now runs long enough to reach it |
| `ffx2-lady-luck-reels.test.ts` | A `message` event counts as a spin that did something | seed 6's Magic Reels now lands Esuna on a party with nothing to cure |
| `ffx2-status-locks.test.ts` | pinned seed 31 -> 1 | seed 31 ends in a party defeat before the sleep wears off (21 of the first 40 seeds do) with the row's Accuracy 95 and the new draw order |
| `ffx2-bahamut-lone-healer.test.ts` | No "after" when she never changes dressphere | seed 5 now curses her and Bahamut wipes her first |
| `ffx2-active-atb.test.ts` | seed 7 -> 1 | seed 7 now has a Leg move land inside the 2 s and close the open menu; 19 of the first 20 seeds settle |
| `ffx2-vegnagun-reflect-immunity.test.ts` | seeds 1 to 25 minus 1, 7, 11, 22, 23 | Yuna is wiped before she acts on those seeds; the test asserts "on every seed she acts" |
| `intent-random-target.test.ts` | first seed whose first menu predicts the Kick, not seed 1 | Shiva's pick depends on the stream |
| `data-ffx2-vegnagun-chain.test.ts` | the steal tables read the game's byte (128 for the 50 % bosses, 32 for Shuyin) | `monster-records` replaces the `/255` figure derived from the authored percentage |
| `data-ffx2-vegnagun-stat-immunities.test.ts` | "Magical attack detected" takes its fraction off MP | it is the game's MP-class row |
| `chapters/den-of-woe-engine.test.ts`, `fallen-aeons-engine.test.ts`, `trema-engine.test.ts`, `trema-kit.test.ts` | fixture `acc` 95; each girl starts at full MP; Sisters and Anima no longer resist Reflect; Delta Attack leaves MP alone; one variance per damage class | the game's monster row (Accuracy 95, the resist bytes), the MP clamp `clamp(MP - n, 0, max)`, the row for Delta Attack, the pipeline's per-class draw |
| `chapters/leblanc-engine.test.ts` | Leblanc resists the STR, DEF and Accuracy stages (not Luck); Supercollider and the Dark Knight's Darkness never roll; No Love Lost is the piercing physical formula; Russian Roulette is five rows | the game's rows (research note §4 and §7.1) |
| `chapters/trema-ai.test.ts` | Reflect left the resist list; the TR-G2 block (the Dark Knight's Darkness against Evasion 99) pinned the old hit race and is replaced by the finding that Darkness never rolls | row 0x307f has accuracy formula 0; listed for Bailey (section 10) |
| `chapters/leblanc-white-wind.test.ts` | imports `computeDamage` from the test helper | the float chain is deleted |
| `chapters/fallen-aeons-ship-story.test.ts` | Shiva's Stop: 400 seeds (the first landing at seed 43), was 40 | Stop lands on Yuna about 2 fights in 100 under the game's roll (7 in 400), was about 7 in 100; the rider's byte is 30 and the level gap is 41 against 46, so 5 in 101 a landed Heavenly Strike |
| `strategy-ffx2-bahamut.test.ts` | the routes re-measured over seeds 1 to 30: Shell route 25 wins (bar 28 -> 20), Magic Break route 2 (floor 28 -> an upper bar of 6), heal-only route 14 (bar 1 -> 8); the shipped line still wins 40 of 40 | Impulse is an untyped move in the game's row, so Shell no longer halves it and a lowered Magic stat no longer scales it (about 191 a hit under Shell before, about 292 now); the Magic Break route is ground down (see section 10) |
| `chapters/trema-oversoul.test.ts` | the Paragon's Accuracy 95; its physicals roll accuracy formula 2 against the girls' Luck and Evasion (0 % against the Rabite's Foot builds, over 90 % against a bare girl); Final Impact lands 10 to 14 of its 14 hits (a girl who falls mid-action drops the rest, they are not re-aimed) | the game's row 0x4000 (the one the Oversoul's own list names) and the planning of hits before any damage; listed for Bailey (section 10) |
| `chapters/ixion-engine.test.ts` | Ixion's Accuracy 95; the Hammer's lowest roll 934, not 935 | the monster row; the exe's integer chain truncates after the variance step |
| `advisor-plan.test.ts`, `advisor-v3-inflight.test.ts` | decision floor 10 -> 5 on the Vegnagun chain's seed 1; 12 -> 24 seeds to find a board with two girls under 75 % | the stream moved: the menu-mashing driver's party is wiped after 10 decisions on seed 1; the board is found within 20 seeds |
| `advisor-v3-final.test.ts` | the two boards the file finds by running the engine move seed: the held Phoenix Down at the Den of Woe 62 -> 4, the held Megalixir at Vegnagun 52 -> 15 | found again by running the engine over the seeds in order (rule 3); the rules they check are unchanged |
| `intent-committed-cast.test.ts` | link 5's first menu is searched for over seeds 1 to 40 (the first on which Shuyin has Terror of Zanarkand on the bar), not pinned to seed 1 | the draw order moved the stream; the case needs the board, not the number |
| `strategy-ffx2-leblanc.test.ts` | the shipped line's median 25 turns -> at most 30; No Love Lost fires up to 14 times in 20 seeds (11 now, 2 before) but every run still ends 20/20 with all three standing; careless mashing no longer loses every seed at D = 0 (22 of 40 win; it still loses every seed at D = 1500 and 4000) and the shipped line clears the mission at D = 1500 in at least 8 of 20 | the game types the Grenade physical, so Leblanc's Protect halves the workhorse; listed for Bailey (section 10) |
| `ui-ffx2-battle-message.test.ts` | the Pilfer Gil banner prints the amount the engine took (1,267 on this seed, between 750 and 1,500), not a fixed 1,500 | the kernel takes half to all of the figure by a draw (the old engine took all of it) |
| `ffx2-parity-measure.test.ts` | seed ranges `a-b`, per-seed letters, the sums behind the means, usage totals | so a 500-seed run can be split across processes and merged exactly |


### Mutation check of the wiring test

The kernels were proven against the game's machine code by emulation in earlier batches (`parity-ffx2-*.test.ts`). The wiring test proves
the part left: that the engine gives the kernels the right inputs, in the right order, and applies the answers. It compares the whole run
(the sequence of draws the engine asks for, by range and count; the events; the end state of every unit) with an oracle written from the
game's terms, so a wrong translation of an engine fact into a kernel input shows as a difference. To check that it does, one deliberate
fault at a time was put into the engine (the original file read first and written back after each run), and the test was run
(`D:\Tools\ffx-parity\w3-final\mutate.mjs`, scratch):

| Fault put into the engine | Tests that failed | Verdict |
|---|---|---|
| M01: the critical roll draws 0..98 instead of 0..99 | 2 of 16 | killed |
| M02: the shatter roll is drawn on every strike, not only on a petrified target | 7 of 16 | killed |
| M03: targets visited in descending slot order | 2 of 16 | killed |
| M04: a scripted monster command is halved like a player pick | 1 of 16 | killed |
| M05: only the first hit event of a multi-hit command is played | 2 of 16 | killed |
| M06: the chain counter rises by two | 5 of 16 | killed |
| M07: Russian Roulette always runs its first row | 2 of 16 | killed |
| M08: the Thief's Attack runs the sword row (one hit of power 16) | 1 of 16 | killed |
| M09: a status roll draws 0..99 instead of 0..100 | 3 of 16 | killed |
| M10: the variance draw is 1..31 | 7 of 16 | killed |
| M11: a removed (ejected) target is still in the battle for the target gate | 0 of 16 | survived |
| M12: Shell never halves a magical hit | 1 of 16 | killed |
| M13: a stat stage reads with the opposite sign | 2 of 16 | killed |
| M14: the steal success roll draws 0..255 instead of 0..254 | 1 of 16 | killed |
| M15: a chained target is no longer forced to be hit | 1 of 16 | killed |
| M16: the attacker Strength byte reads Magic | 4 of 16 | killed |
| M17: the status roll sees the attacker as level 1 | 3 of 16 | killed |
| M18: a girl halves any row that can target all, even when she aimed at one | 2 of 16 | killed |
| M19: a Stopped or Petrified target keeps its chain counter | 1 of 16 | killed |
| M21: Darkness on the attacker is not seen by the hit check | 1 of 16 | killed |
| M22: Nul-physical never refuses a physical hit | 1 of 16 | killed |
| M23: the printed critical odds ignore the attacker Luck stage | 1 of 16 | killed |
| M24: the ATB class ignores a charging target | 1 of 16 | killed |
| M25: the Bribe reward ignores the threshold the accuracy stored on the target | 2 of 16 | killed |
| M26: a Bribe does not spend the gil it offers | 2 of 16 | killed |
| M27: the hit determination is not told how much gil the Bribe offers | 3 of 16 | killed |
| M28: the target forgets what it has been bribed so far | 1 of 16 | killed |
| M29: the Bribe reward finds the slot of the target empty | 2 of 16 | killed |
| M30: Pilfer Gil finds the enemy with no gil | 1 of 16 | killed |

M11 is an unreachable edge, not a gap: the target gate's in-battle flag differs from 1 only after an Eject lands in the middle of a
multi-hit action, and no command of the seven chapters carries an Eject rider (Russian Roulette's five game rows have none; the authored
Eject belonged to our six-outcome reading). The other 28 are killed by one to seven of the 16 tests each. (An earlier run left one more
survivor, the ATB pool the Delay class reads, until a direct test of it was added; M24 is that fault. M20 of that run, the same fault,
is dropped from the list.)

## 5. Before and after

Harness: `tests/unit/ffx2-parity-measure.test.ts` with `PYREFLY_MEASURE=1` (commit 32229ad1; this batch adds seed ranges, per-seed letters and
sums so a run can be split across processes and merged exactly): the shipped `intendedStrategy` through each FFX-2 chapter's whole chain
(every link, the real party build, the chapter's own triggers, minigames auto-resolved), seeds 1 to 12 and 1 to 500: wins, losses, mean
party turns, mean party KOs, mean game minutes. Before = the engine at 37cd5348 played from an untouched copy (byte-identical to it in
every file the FFX-2 engine imports); after = this working tree. "Minutes" are the engine's own clock
(3,000 ticks a second); batch W4 moves that clock, so read them as pace, not as game time.

| Chapter | Wins | Losses | Party turns | Party KOs | Minutes | Flag |
|---|---|---|---|---|---|---|
| IV Bahamut | 12 of 12 | 0 | 47.3 -> 42.9 | 0 | 1.7 -> 1.6 |  |
| V Vegnagun and Shuyin (6 links) | 12 of 12 | 0 | 122.6 -> 107.9 | 2.6 -> 5.3 | 4.9 -> 4.6 |  |
| VI Leblanc Syndicate (3 acts) | 12 of 12 | 0 | 62.2 -> 63.8 | 0.8 -> 0.4 | 1.8 -> 1.9 |  |
| XI Fallen Aeons (Road) | 10 -> 12 of 12 | 2 -> 0 | 71.4 -> 49.9 | 0.8 -> 0.1 | 4.2 -> 2.6 | MOVED +2 |
| XIII Paragon and Trema | 0 -> 3 of 12 | 12 -> 9 | 89.9 -> 93.5 | 3.1 -> 2.7 | 4.3 -> 5.6 | MOVED +3 |
| XV Den of Woe | 8 -> 6 of 12 | 4 -> 6 | 37.4 -> 30.6 | 3.4 -> 2.8 | 1.7 -> 1.4 | MOVED -2 |
| XVI Ixion at Djose | 12 of 12 | 0 | 37.5 -> 26.7 | 0.1 -> 0 | 2.2 -> 1.5 |  |

A 12-seed sample has a standard deviation of about 1.7 wins near half, so most of the flagged moves are noise or small effects. The same
line over 500 seeds, old engine against new:

| Chapter | Old wins | New wins | Change | Reading | Party turns | Party KOs | Minutes |
|---|---|---|---|---|---|---|---|
| IV Bahamut | 500 (100.0%) | 500 (100.0%) | +0 (+0.0 points) | noise | 47.5 -> 42.2 | 0 -> 0.0 | 1.7 -> 1.5 |
| V Vegnagun and Shuyin (6 links) | 474 (94.8%) | 430 (86.0%) | -44 (-8.8 points) | real (-4.7 sd) | 122 -> 97.3 | 3.1 -> 5.5 | 4.9 -> 4.1 |
| VI Leblanc Syndicate (3 acts) | 488 (97.6%) | 491 (98.2%) | +3 (+0.6 points) | noise (0.7 sd) | 65.8 -> 57.2 | 0.8 -> 0.6 | 1.9 -> 1.6 |
| XI Fallen Aeons (Road) | 430 (86.0%) | 490 (98.0%) | +60 (+12.0 points) | real (7.0 sd) | 74.7 -> 50.2 | 0.6 -> 0.1 | 4.2 -> 2.6 |
| XIII Paragon and Trema | 36 (7.2%) | 213 (42.6%) | +177 (+35.4 points) | real (12.9 sd) | 103.3 -> 118.8 | 3.3 -> 2.2 | 5.3 -> 7.3 |
| XV Den of Woe | 274 (54.8%) | 234 (46.8%) | -40 (-8.0 points) | borderline (-2.5 sd) | 34.1 -> 31.1 | 2.3 -> 2.5 | 1.6 -> 1.4 |
| XVI Ixion at Djose | 497 (99.4%) | 500 (100.0%) | +3 (+0.6 points) | noise (1.7 sd) | 35.9 -> 26.5 | 0.1 -> 0.0 | 2.1 -> 1.5 |

Chapters IV, VI and XVI do not move (their party turns fall because the party kills sooner). Four move. The golden of the human-paced arm says the
same of Chapter V: the shipped line at D = 1,500 ms a menu wins 2 of 10 seeds (it won 4); Chapter IV's 10 of 10 and the D = 0 arms' 20 of 20 hold.

### Causes: ablations (one piece of the wiring put back, same line, 500 seeds)

The harness is copied with mocks (`D:\Tools\ffx-parity\w3-final\run-abl.mjs`, scratch): "rows" puts every ability, every dressphere's Attack
and every monster's Attack back on the row derived from our own numbers (the engine's old reading, `deriveRecord`); "Accuracy 104" the
old invented enemy Accuracy; "old critical chance" a quarter of the Luck gap; "no chain multiplier" and "no forced hit" take the chain
bonus and the hit-reaction stand-in out; "enemies never crit" keeps their draw and drops the result.

| Arm | V Vegnagun | XI Fallen Aeons | XIII Paragon, Trema | XV Den of Woe |
|---|---|---|---|---|
| old engine | 474 | 430 | 36 | 274 |
| as built | 430 | 490 | 213 | 234 |
| every game row -> our numbers | 485 | 437 | 90 | 214 |
| old critical chance | 415 | 490 | 106 | 242 |
| Accuracy 104 for every enemy | 426 | 493 | 200 | 236 |
| rows + Accuracy 104 + old critical chance | 482 | 444 | 59 | 217 |
| no chain multiplier | 408 | 498 | 196 | 309 |
| no forced hit inside a chain window | 432 | 491 | 213 | 247 |
| enemies never crit | 431 | 490 | 219 | 242 |
| Mega Flare at the row's power 14 | 430 | 490 | 213 | 234 |

Minutes and party KOs a run, old / as built / rows put back: V 4.9 and 3.1 / 4.1 and 5.5 / 4.8 and 2.8; XI 4.2 and 0.6 / 2.6 and 0.1 / 3.9 and 0.5;
XIII 5.3 and 3.3 / 7.3 and 2.2 / 4.8 and 3.4; XV 1.6 and 2.3 / 1.4 and 2.5 / 1.5 and 2.6.

- **V Vegnagun and Shuyin, 474 -> 430 (real).** It is the rows: with our own numbers back the chapter is 485 wins, 4.8 minutes and 2.8 KOs a run,
  the old engine's figures. The biggest single rows (each put back alone, 500 seeds): the Leg's Berserk is a chance byte of 255, which lands through
  a resist of 255 where our 75 did not (-30 wins), the Mega Phoenix row (-19), the Leg's Slow (-10). The new critical rule and the chain bonus on the
  party's own hits help it (+15 and +22).
- **XI Fallen Aeons, 430 -> 490 (real), 4.2 -> 2.6 minutes.** Also the rows: with our numbers back it is 437 wins and 3.9 minutes. The Dark Knight's
  Darkness is most of it (+39 wins): the row never rolls to hit and keeps the piercing formula's 270/255 term, so it deals 3,806 a hit where
  ours dealt 2,449; Shiva falls sooner and acts half as often (her Kick 2,339 -> 1,355 uses).
- **XIII Paragon and Trema, 36 -> 213 (real).** Two causes that overlap: the critical rule (old chance back: 106) and the rows (our numbers back: 90).
  Alone, Final Impact (the row types it physical, so Protect halves it: 1,734 -> 888 a hit) is worth +95 wins and Soul Spring (the row hits HP and
  MP and drains both: about 1,007 a hit) +84. With all three put back it is 59, still above the old 36, which leaves the integer chain and the
  other rule changes about 23 wins. The Paragon's Attack misses the Rabite's Foot builds every time (decision 4).
- **XV Den of Woe, 274 -> 234 (borderline, -2.5 sd).** The rows help the party here (+20); what moves the chapter down is the enemy side: under
  the exe's integer formula and the rows' critical bytes the shades hit 5 to 12 % harder per hit (Nooj's Attack 269 -> 301, Baralai's 231 -> 251,
  Gippal's 223 -> 236) and 5 to 10 % of those hits are critical (none were), while the party's Darkness gains 6 % and healing is equal. The
  chain bonus on the girls the shades hit several times costs the party 75 wins (309 without it). No single row explains it; the largest are
  Baralai's Glint (+22), Gippal's Grinder (+16), the Dark Knight's Darkness (+15), Looming Glacier (+14) and Nooj's Attack (-12, a hit that now misses
  17.6 % and crits 10.5 %).
- **Leblanc, Ixion, Bahamut:** no mover. Mega Flare at the row's power 14 changes nothing the intended line sees in Chapter IV (500 of 500 either
  way, no KO; 68.7 a hit at 24, 22.8 at 14 with Shell up).

A defect found by this work: the first leave-one-out run said that putting Remedy's row back cost 276 wins in Chapter V. It was not the row: the
derived row (the engine's old reading, used for any ability with no game row) cleansed a timed status with an amount of 1, which only shaves a
step off a counter, so a derived Remedy left Slow and Stop standing. The game's cleanse rows carry 127. Fixed in `deriveRecord`, pinned by the
wiring test, and every arm that uses derived rows was run again.

### Per ability (old -> new, over all seven chapters and 500 seeds each)

Uses, miss rate, critical rate of the hits that landed, average damage of a landed hit (negative = healing). The rows below are the ones that
moved most or are the chapters' workhorses; `PYREFLY_MEASURE_USAGE=<file>` writes the whole table.

| Ability | Uses | Miss % | Crit % | Average damage |
|---|---|---|---|---|
| Attack (every girl) | 54415 -> 46483 | 1.5 -> 2.3 | 11.4 -> 44.0 | 2163 -> 2321 |
| Dark Knight Darkness | 73060 -> 79464 | 11.4 -> 0.0 | 0 -> 0 | 2449 -> 3806 |
| Dark Knight Black Sky | 6891 -> 6338 | 0 -> 0 | 0 -> 0 | 300 -> 675 |
| Warrior Armor Break | 6420 -> 5808 | 0.2 -> 0.2 | 1.9 -> 7.6 | 213 -> 225 |
| Gunner Cheap Shot | 2990 -> 2995 | 0 -> 0 | 2.2 -> 10.8 | 130 -> 163 |
| X-Potion (item) | 9620 -> 5658 | 0.3 -> 0 | 0 -> 0 | -5256 -> -5432 |
| Megalixir (item) | 3716 -> 4042 | 0 -> 0 | 0 -> 0 | -6649 -> -7446 |
| Cura (White Mage) | 7603 -> 8414 | 0.6 -> 0 | 0 -> 0 | -720 -> -573 |
| Grenade (item) | 2864 -> 2887 | 0.1 -> 0 | 3.9 -> 0 | 260 -> 252 |
| Paragon's Attack (Oversoul) | 17075 -> 9950 | 49.4 -> 100 | 0 -> 0 | 1306 -> 0 |
| Paragon's Final Impact | 500 -> 500 | 0 -> 0 | 0 -> 0 | 1734 -> 888 |
| Paragon's Genesis | 169 -> 156 | 0 -> 0 | 0 -> 0 | 3384 -> 6690 |
| Trema's Dying Star | 1789 -> 8243 | 0 -> 0 | 0 -> 20.3 | 400 -> 480 |
| Trema's Beguiling Mire | 294 -> 1353 | 70.2 -> 83.5 | 0 -> 18.0 | 515 -> 618 |
| Bahamut's Impulse | 2548 -> 2085 | 0 -> 0 | 0 -> 0 | 71 -> 345 |
| Anima's Stare | 5725 -> 6126 | 0 -> 0 | 0 -> 0 | 106 -> 202 |
| Vegnagun's Tail Beam | 9226 -> 3729 | 9.8 -> 0 | 0 -> 0 | 1450 -> 1467 |
| Vegnagun's Noli Me Tangere | 1000 -> 989 | 9.2 -> 0 | 0 -> 0 | 1247 -> 1250 |
| Bulwark's Hostile activity detected | 2671 -> 1961 | 9.2 -> 0 | 0 -> 0 | 1093 -> 947 |
| Memento Mori | 4 -> 22 | 0 -> 0 | 0 -> 0 | 750 -> 400 |
| Shiva's Kick | 2339 -> 1355 | 6.2 -> 16.3 | 0 -> 5.4 | 173 -> 214 |
| Sandy's Attack | 2594 -> 1737 | 6.3 -> 14.2 | 0 -> 4.5 | 144 -> 153 |
| Ixion's Attack | 5341 -> 3744 | 4.7 -> 14.1 | 0 -> 4.5 | 85 -> 93 |
| Nooj's Attack | 4339 -> 4227 | 11.2 -> 17.6 | 0 -> 10.5 | 269 -> 301 |
| Ormi's Shield Bash | 4586 -> 3569 | 22.7 -> 30.3 | 0 -> 5.1 | 105 -> 108 |
| Ormi's Supercollider | 1022 -> 634 | 8.0 -> 0 | 0 -> 0 | 437 -> 451 |
| Logos' Double Shot | 2360 -> 1685 | 12.4 -> 2.6 | 0 -> 19.7 | 29 -> 16 |
| Logos' Hail of Bullets | 195 -> 116 | 0 -> 0 | 0 -> 0 | 137 -> 15 |
| Logos' Russian Roulette | 209 -> 119 | 0 -> 0 | 0 -> 0 | 247 -> 12 |
| Leblanc's Fira | 268 -> 243 | 0 -> 0 | 0 -> 0 | 194 -> 160 |
| Fem-Goon's Fire | 40 -> 43 | 0 -> 0 | 0 -> 0 | 70 -> 53 |

The shifts that matter are the rows' (the Dark Knight's Darkness, Impulse, Stare, Hail of Bullets and Russian Roulette are other moves than
the data described), the critical rule (the party's Attack crits four times as often, and monsters crit where their row says so) and the hit
rule (the girls' Luck and Evasion now count against every physical hit with an accuracy formula: the Paragon cannot touch a Rabite's Foot girl, Ixion,
Sandy and Shiva miss two to three times as often, Nooj and Ormi's Shield Bash one and a half; moves with accuracy formula 0 never miss any more: Tail Beam, Noli Me Tangere, Supercollider).

## 6. Behaviour changes, each from the game's code

Everything below is the exe's answer (the kernels' own tests prove each function; `research/re-ffx2-hit-status.md` and
`research/re-ffx2-damage.md` say how), put into the engine; none of it is a tuning decision.

1. **Draw order.** Every target's hit roll first (the attacker's hit stream), then per strike, per target, in ascending slot order: the HP
   class variance, the critical roll (only for a row that can crit), the MP class variance, the ATB class variance, one status roll for every
   status with a chance byte (group 1 then group 2, even for a chance of 254 or 255 and even for an immune target), the shatter roll only on a
   Petrified target, then the theft rolls. The old order was hit, critical, randomiser, riders, per hit. Moves every seeded replay.
2. **The hit roll is the game's.** Each command's accuracy formula decides: 0 never rolls (67 of the 68 item rows, and 41 of our abilities
   that rolled; 165 of 397 physical rows in all), 1 and 2 are the points race `LCK_a + base - LCK_t - EVA_t + 5 x (2 x (ACC stage - EVA
   stage) - LCK stage_t + LCK stage_a)` against `draw % 101` with **no clamp** (a threshold of 100 still fails one time in 101), Darkness
   divides the base by four only for a flagged command, a sleeping, Petrified or Stopped target (and one in hit reaction) is always hit,
   a hit is decided **once per target per record**, not per strike. The monsters' Accuracy is the row's 95, not the invented 104.
3. **Critical hits.** `LCK_a - LCK_t + 5 x (stage difference)` against `draw % 100`, no division and no clamp (the old engine used a quarter of
   the Luck gap: a girl at Luck 60 against 25 crit 8 % of the time, now 35 %); a row can carry its own chance byte, which replaces the rule;
   Always Critical forces it; **a spell cannot crit** unless its row says so and then draws nothing otherwise.
4. **Damage.** Integers with a truncation after every step (the old engine multiplied floats and truncated once: 70 % of ordinary
   physical hits differed, up to 27 points); the variance applies only to the formulas that use it (the percent-of-HP, fixed, 9999 and
   leave-1-HP formulas take none, but still consume their draw); the two piercing formulas keep the 270/255 term and the target's DEF or MDEF
   stage; a heal is not scaled by Magic Defense; the modifier order is the game's (Berserk, Booster, the item doublers, species killers,
   back attack, **chain before element**, the element ladder, Shell or Protect, the Defense clamp to exactly 1, the immunity bytes, then the
   all-target halving, Death replacing damage, the Damage 9999 snap (heals too) and the limit); the chain is `(n + 28) / 20` on the integer;
   the element ladder is weak (compounding, and it returns), then one neutral bit shields the hit, then half, null, absorb.
5. **All-target halving** is the player's choice on a row that can target all (`ActionRec+0x27`); an enemy's scripted multi-target
   command is **never** halved (Bahamut's Mega Flare, the Oversoul's borrowed spells), and Shell, Protect and the immunity bytes act before it.
6. **Statuses.** One landing rule for every rider and both groups: a chance byte of 255 always lands (even through a resist of 255), then a
   resist of 255 never, then 254 always, else `draw % 101 < chance + 5 x (attacker level - target level) - resist`. A stat stage adds the
   row's signed step (Power Break is -2) to the stage, clamped to -10..+10; Haste, Slow and Stop cancel one another; Petrify clears
   everything else; a Haste or Slow that fails to land zeroes the ATB number of the same hit. The three hand-written percentages
   (linear, quartic, sextic) are gone: Death, Petrify, Eject and Zantetsu are decided by accuracy formulas 3 to 5 and 7 before any status.
7. **Steal, Pilfer Gil, Bribe** run inside the strike on fixed streams 10 and 11: a successful steal clears the enemy's steal byte (one per
   enemy); Pilfer Gil takes between half and all of the enemy's figure, scaled by `chance / 255` (the old engine took the whole figure with no
   roll); a Bribe is accuracy formula 6 (the gil offered against the target's max HP) and pays out `sqrt(threshold)`-scaled.
8. **The chain counter** is the game's byte on the target: read before the hit (`n > 0` multiplies a positive number by `(n + 28) / 20`),
   raised by one only when a positive HP number is applied (capped at 99), cleared when the target is Stopped or Petrified. An immune
   hit, a heal and a miss never extend it. The combatant's `chainCount` is therefore one higher than before for the same hit (two landed
   hits: 2, where it was 1); the `chain` event still carries the counter the hit READ, so the HUD flourish is unchanged. The pause
   screen's "Chain xN" reads the byte.
9. **MP is clamped**: the game's MP application is `clamp(MP - n, 0, max MP)`, so an MP number can no longer take a girl above her maximum.
10. **The rows.** 116 of the 284 abilities with a record differ from the ability's own numbers (`research/re-ffx2-commands.md` §4); the row
    plays. The ones that change how a chapter plays: Russian Roulette is five rows with Death and Petrify at 30; the Dark Knight's Darkness
    and Ormi's Supercollider never roll; Delta Attack leaves MP alone; No Love Lost is the piercing physical formula; Impulse is untyped
    (Shell does not halve it, Magic Break does not scale it); Noli Me Tangere is exactly 1,250 and physical (Protect halves it); Vita
    Brevis is physical; items never roll.

## 7. What was not done, and what could not be sourced

1. **The chain's reset needs the hit-reaction state the engine lacks.** The game keeps the counter while the target is still reacting to the
   last hit and clears it when the reaction ends (the length is an animation, not a number in the exe); it also forces a hit on a reacting
   target. The engine has neither a reaction nor its length, so the 2 s window (3 s after a critical, `ffx2-combat-core` §1.7, a
   `[verified: 2 sources]` figure from the old engine) stands in for both: the counter lives while the window is open and a target inside
   it counts as in hit reaction for the accuracy formulas 1 and 2. This is the closest faithful source we have, written down as open.
2. **Back attack**: needs the angle between the target's facing and the attacker; the engine has no facing, so the kernel's flag is always
   false: **never a back attack**. Every scripted boss fight is front-on, so the x2 would not have fired in the intended line anyway.
3. **The ATB class** (Delay, Slow's ATB part, the Chocobo Feather) is computed, and its variance draw is taken in the game's place, but the number
   is not applied to the gauge: the charge, recovery and interruption path is batch W4's.
4. **Stats of the girls** (Strength, Magic, Defense, Magic Defense, Luck, Evasion, Accuracy) come from our dressphere tables; the dressphere
   lane measured where they differ from the game's stat builder (`research/re-ffx2-dressphere.md` §5 D1: HP exact, the other nine stats
   differ in 334 of 576 anchor cells, mostly higher in ours). The Accuracy, Evasion and Luck that the hit and critical kernels read are among
   them. Wiring the stat builder is a separate batch; until then every hit chance and crit chance is the game's rule on our stats.
5. **Monster levels, HP and stat bytes** stay as authored (§7.2 of the research note lists the seven enemies whose level or stat bytes differ from the row, for example Ormi's
   Strength 53 against 80 and Dr. Goon's 20 against 35). Only what the kernels read as a status/steal/flag input is corrected from the row.
6. **Auto-abilities and accessories' status halves**: the engine models none but Break Damage Limit and the immunities `kit.ts` sets, so the
   Booster, Medicine, Element Master and Non-Element Master words are 0, Evade & Counter is absent, and Adamantite's constant Protect and
   Shell (worn by Rikku in Chapter XIII's build) is not applied; the Trema chapter is therefore harder than the game's by that Protect and Shell.
7. **Not modelled, before or after:** Confusion's all-target coin flip (the game aims a confused girl's command at all targets with
   probability 1/2 when the row can) and the Reflect redirect (`pp_reflect_redirect`, fixed stream 6): the FFX-2 engine has no Reflect bounce.
8. **The action-state mask** the status functions read (`FUN_00632630`) and `Chr+0x5ac` are not pinned in the exe; both are 0, which never
   blocks a status or a target.
9. **Weapons**: the engine has no weapon element or weapon status, so the "uses the character's properties" bit adds nothing.
10. **Abilities outside the seven chapters' reach** (the dresspheres no build teaches, items nobody carries) keep the row derived from
    their own fields, as the old engine read them; they have no record and nothing reaches them in the shipped chapters.
11. **Draw counts the engine adds**: the engine's own statuses with no slot in the game's tables (the hidden Delay effect, Action-cancel,
    Shattering) take one `% 101` draw each, after the kernels' statuses; the game does not have those statuses as statuses (its Delay is the
    ATB class). They go with batch W4.
12. **Browser check.** No UI file changed (the HUD reads the same events and the same odds functions) and this worktree has no `public/art`,
    so the plan's real-input browser check (acceptance case 6) is left to the main session's validation.
13. **Bribe has no ability of ours to run it.** The wiring is built and proved (accuracy formula 6 with `AbilityCommand.gilSpent`, the threshold
    stored on the target, the reward from its slot, the wallet), but no ability of the seven chapters is a Bribe command; Lady Luck's Bribe
    (`x2-lady-luck-bribe`, the game's row 0x30f0) has no record attached and stays the no-op it always was. Attaching the row makes it a working
    command (new play: rule 10). The same holds for Spare Change (row 0x307d, the gil formula).
14. **The engine keeps one Bribe item per monster** (`rewards.bribe.item`, slot 0); the game's row has two slots with its own item ids
    (`FFX2MonsterRecord.bribe`, unread).
15. **The IC-1 switch is dead but still there.** `Ffx2EngineOptions.immuneHitsSkipChain`, `ResolveContext.immuneHitsSkipChain` and the constant
    `IMMUNE_HITS_SKIP_CHAIN` are unread (the game's chain byte rises only on a positive HP number, so an immune hit never opens a window);
    they stay so the older benches compile (`ffx2-engine-fixes-bench`, `iter2-b1-bench`, `ffx2-menu-cancel-delay`). Removing them means
    dropping those benches' arms.
16. **The chain window is in the old engine ticks** (2 s = 6,000 ticks at 3,000 a second, 3 s after a critical). Batch W4 moves the clock to the
    game's logic step (29.97 a second): the window must stay 2 and 3 real seconds until a hit-reaction state replaces it.
17. **Monster Break Damage Limit.** A monster's cap is 99,999 only when the cast's authored flag says so (eleven moves; their rows carry no
    99,999 bit and the monster layout read so far has no word for it). Strictly by the rows those eleven moves cap at 9,999.
18. **A derived row is the engine's old reading of an ability's own fields**, used only for abilities with no game row (outside the seven
    chapters' reach, and in tests). One defect was found in it while attributing the measurement and fixed: its cleanse amount for timed statuses was 1
    (a cleanse subtracts the amount from the counter), so a derived Remedy left Slow and Stop standing; it is 127 now, as in the game's cleanse rows.
19. **Moves our data gives a monster that the game's list does not have** (found by the audit of every ability row against the monster's own
    command list, `tests/unit/data-ffx2-monster-records.test.ts`): Shiva's Kick, Logos' Hail of Bullets in the second room, Ormi's Concussive
    move in the second room; and scripted moves that are not in the list but may be issued (the sisters' joint Delta Attack, Trema's Demi, three
    Oversoul phase moves, Nooj's Attack). They are named in the test's exception list for the AI batches to confirm.

## 8. Goldens

Four tests pin the FFX-2 engine's full event logs by hash. The engine now draws in the game's order and rolls every hit through the kernels,
so every seeded replay is a different replay and every hash moved; the outcomes are what matter, and they are listed. The old hashes are in
git at `029d49c7`.

| Golden | Pins | Hashes moved | Outcomes, old -> new |
|---|---|---|---|
| `ffx2-atb-golden` | Chapter IV and the whole Chapter V chain, seeds 1 to 20 at D = 0, seeds 1 to 10 at the Active D = 1500 | all 60 | Chapter IV D = 0: 20 of 20 -> 20 of 20. Chapter V D = 0: 20 of 20 -> 20 of 20. Chapter IV Active: 10 of 10 -> 10 of 10. Chapter V Active: 4 of 10 -> 2 of 10 (seeds 4 and 7) |
| `ffx2-hit-closes-menu` | Chapters IV, V and VI at D = 0 under the Wait split, seeds 1 to 3 | all 9 | all nine are victories and no menu is ever closed; Chapters IV and V equal the atb golden's seeds 1 to 3 again |
| `ffx2-menu-cancel-delay` | Chapters IV, V and VI at human pace, Active and the Wait split, seeds 1 to 3, with the menu-cancel switch off (18) and on (18) | all 36 | the eighteen "release 17" hashes are no longer release 17's logs (the option now only turns the menu-cancel rule off, `immuneHitsSkipChain` is not read); they are pinned as the current engine with the three release-17 options forced off, and still differ from the default's |
| `chapters/den-of-woe-carry` | the first link of Chapters 5, 6, XI (Road) and the Sisters, seeds 1 to 8 | all 32 | Chapter 5's eight equal the atb golden's seeds 1 to 8 again |
| `ffx-engine-golden`, `ff7-golden` | the FFX and FF7 engines | none | unchanged, pass |

The comments in each file say the same, with the cause, in the style of the earlier re-pins.

## 9. Full suite and the other checks

- `node "D:/Final Fantasy/node_modules/typescript/bin/tsc" --noEmit`: clean.
- `node tools/orphans.mjs`: 61 orphaned modules, none of them this batch's. The FFX-2 kernels still unwired are the next batches' (`atb*`,
  `status-timers*`, `auto-ability`, `dressphere-*`, `spherechange`, `ability-effects*`), and `src/battle/ffx2/fixtures.ts` is a test fixture. Every
  kernel this batch wired (rng, int32, intops, hit, hitFormulas, hitPlan, crit, damage, element, pipeline, pipeline-types, settle, apply, status,
  statusGroup1, statusGroup2, statusTypes, steal) is reachable from `src/main.ts`.
- One run of the whole unit suite, at the end: 935 files, 14,055 tests (2026-10-09, `6839c4b2`'s tree before one hash was re-pinned): 913 files passed, 22 failed. 21 of the 22 need `public/art`, which this worktree
  does not have (the same 21 files fail on the untouched tree before W3: `art-ref-defaults`, `chapter-meta*` (4), `cutscene-story-poses`, `party-face-manifest`,
  `pause-remake`, `ui-portrait-face-crop` (125 tests), `chapters/chapters-6-7-8-enemy-sprite-manifest`, `den-of-woe-ship-content`, `den-of-woe-ship-scene`,
  `fallen-aeons-ship-content`, `fallen-aeons-ship-scene`, `isaaru-ship`, `leblanc-art`, `leblanc-party-sprites`, `natus-ship-content`, `natus-ship-scene`,
  `trema-ship-content`, `yojimbo-content`). The 22nd was one Chapter VI hash in `ffx2-menu-cancel-delay` (seed 3, split arm) that the per-fight rows moved after
  the targeted runs; it is re-pinned in the same commit and the four golden files (`ffx2-atb-golden`, `ffx2-hit-closes-menu`, `ffx2-menu-cancel-delay`,
  `chapters/den-of-woe-carry`) were re-run green. Earlier targeted runs of the 469 FFX-2 files and of the 163 other files the changes reach agreed.
- FFX and FF7 are untouched: no file of `src/battle/ffx`, `src/data/ffx`, `src/battle/ff7` or their tests is in the W3 commits, and
  `ffx-engine-golden` and `ff7-golden` pass unchanged (the full run includes them).
- Source files stay under 400 lines except the two that were already over before this batch: `src/battle/ffx2/intent.ts` (719 lines
  before, 733 now; the mirror change is +14) and the contract file `src/battle/common/types.ts` (2,747 before, 2,855 now). `simulate.ts` is
  399.

## 10. Decisions for Bailey

Nothing was retuned: every shift below is the game's own answer on our stat tables, reported with its cause. All are FFX-2 only. The
recommendation comes first in each.

1. **Chapter difficulty under the game's rules (section 5).** The shipped line wins, of 500 seeds: Chapter XIII (Paragon and Trema) 36 -> 213
   (7 % -> 43 %), Chapter XI (Fallen Aeons) 430 -> 490, Chapter V (Vegnagun and Shuyin) 474 -> 430, Chapter XV (Den of Woe) 274 -> 234;
   Chapters IV, VI and XVI do not move. At the human-paced Active arm (D = 1,500 ms a menu) Chapter V's shipped line wins 2 of 10 seeds (it
   won 4). **Keep them** (they are the 1:1 reading); the alternative is a number of our own on a boss or a party stat, which needs your
   word. Chapter XIII moves most (earlier plans tracked its winnability): the intended line now wins 43 % of seeds.
1b. **Chapter IV's researched routes.** The FAQs' three ways through Bahamut (`strategy-ffx2-bahamut`) clear it on, of 30 seeds: the Shell route 25
   (was 28), the heal-only route 14 (was 1), and the Magic Break route 2 (was 28): Impulse is an untyped move in the game's row, so Shell does not
   halve it and a lowered Magic does not shrink it, and a party with no Shell and no cure is ground down. The shipped line (Shell and the Breaks
   together) still wins 40 of 40. The in-game guide does not recommend the Magic Break route; **keep**.
2. **AGENTS.md rule 5 (magic never misses) against the rows.** The game rolls accuracy on 6 of its 199 damaging magical rows: Enchanted
   Ammo (0x3035, formula 2, the shooter's own Accuracy), the three Deaths (0x3087, 0x3129, 0x3228: formula 4) and MP Crush and Slurp
   (0x415c, 0x41b0, formula 1, byte 95). Two are in our chapters. **Keep both as they are**: Enchanted Ammo rolls (its `canMiss: true` is the
   one sourced exception and the row agrees); the Dark Knight's Death (0x3087) stays held at never rolls, so its Death chance byte (254)
   and the target's resist decide. The game's formula 4 would land it about half the time on a non-immune target near the caster's level;
   every boss of the seven chapters resists Death at 255, so you never see the difference (`research/re-ffx2-commands.md` section 8).
3. **Mega Flare's power, 24 (ours) or 14 (the row).** Held at 24, as the AI preflight says. Measured on the intended line of Chapter IV
   with Shell up: 68.7 a hit at 24, 22.8 at 14; 500 of 500 wins and no KO either way. **Your call; recommended 14** (the game's number), with the AI batch.
3b. **The same question for the eleven moves our data says break the 9,999 limit** (Mega Flare, Tail Beam, Noli Me Tangere, Vita
   Brevis, Memento Mori, Nemo Ante Mortem Beatus, Dying Star, Final Impact, Lightfall, Aerospark, Ixion's Attack): their rows carry no
   99,999 bit and the monster layout read so far has no break-the-limit word, so the cast's authored flag stands in and they still break it.
   Strictly by the rows they would cap at 9,999. **Keep the flag** until the monster layout is read for the word.
4. **Chapter XIII's physicals cannot land on the Rabite's Foot builds.** The Paragon's Attack (row 0x4000) is accuracy formula 2, the
   Paragon's own Accuracy 95 plus Luck 16 against the girl's Luck and Evasion; with Luck 111 or 112 the sum is below zero and the Attack
   misses every time (old engine: half the time at the flat 50 % estimate, unread now). Trema's own moves with an accuracy byte (Beguiling
   Mire, Choking Mist: formula 1) miss 71 to 84 % of the time (68 to 70 % before), and the Dark Knight's Darkness never rolls whatever
   Trema's Evasion (row 0x307f is formula 0), so the TR-G2 problem and the plan's Rabite's Foot answer to it never existed. **Keep**: it is the game's rule and the "luck dodges it" build is
   how the chapter is meant to be played; say if you want the flat estimate back (`OVERSOUL_ESTIMATES.physicalHitPercent`, unread). The same row
   carries no Itchy (SinirothX lists none; one wiki line says the Attack causes it, `OVERSOUL_ESTIMATES.attackItchy`, now unread): the Paragon's
   Attack no longer makes a girl Itchy. The row has the "uses the character's properties" bit, so a weapon status the engine does not model could carry it.
5. **Chapter VI: the Grenade is a physical move in the game's row**, so Leblanc's Protect halves the shipped line's workhorse, Logos lives
   past Leblanc's third turn and No Love Lost fires on 11 of 20 seeds (2 before). Careless mashing now wins the three-act mission on 22 of 40
   seeds at D = 0 (it lost 12 of 12); at a human pace (D = 1,500 and 4,000 ms) it still loses every seed. **Keep**; the strategy test
   says what is true now.
6. **Monster levels, HP and stat bytes stay as authored; the rows differ on 7 enemies** (the five of Chapter VI's first two acts, Shiva's
   Agility 119 against 124 and Trema's 129 against 128; `research/re-ffx2-commands.md` section 7.2 has them, for example Ormi Strength 53
   against 80 and Dr. Goon's 20 against 35). **Recommended: adopt the rows in a measured batch of their own** (that is what 1:1 means); changing them here
   would have mixed two causes in the measurement.
7. **The girls' stat tables.** Strength, Magic, Defense, Magic Defense, Luck, Evasion and Accuracy come from our dressphere tables, which
   differ from the game's stat builder in 334 of 576 anchor cells, mostly higher (`research/re-ffx2-dressphere.md` section 5, D1). The
   hit and critical kernels read Luck, Evasion and Accuracy, so every printed chance is the game's rule on our numbers: the shipped
   line's Attack crits 44 % of the time (11 % before). **Recommended next: wire the stat builder** (W-dressphere), then re-measure.
8. **Hit reaction.** The game forces a hit on a target that is still reacting and clears its chain counter when the reaction ends; the
   reaction's length is an animation, not a number in the exe. The 2 s window (3 s after a critical, an old `[verified: 2 sources]` figure) stands
   in for both. Switching the forced hit off moves no chapter by more than 13 wins of 500, the chain multiplier off moves Den of Woe by 75.
   **Recommended: measure the reaction with the read-only sampler** in the timing session (it is W4's neighbour) and replace the window.
9. **Rules the game has and the engine does not model, each new play for rule 10:** a back attack (x2 from behind; needs facing: "never"),
   Confusion's all-target coin flip, the Reflect bounce (fixed stream 6), weapon elements and weapon statuses, Evade & Counter, and every
   auto-ability but Break Damage Limit (Booster, Medicine, Element Master, Non-Element Master; Adamantite's constant Protect and Shell,
   which Chapter XIII's build wears, so that chapter is harder than the game's by exactly that). **Recommended: a yes to the auto-abilities
   as their own batch (they are in the dressphere note), no to facing.**
10. **Lady Luck's Bribe and Spare Change** have no game row attached because no chapter reaches them (section 7, items 13 and 14).
    **Recommended: attach 0x30f0 and 0x307d when a chapter teaches Lady Luck.**
11. **Hidden status draws.** The engine's own statuses with no slot in the game's tables (the hidden Delay effect, Action-cancel, Shattering)
    take one `% 101` draw each after the kernels'; the game has no such statuses (its Delay is the ATB class). They leave with W4.

## 11. How to re-run

From the worktree root (`D:\Final Fantasy\.claude\worktrees\re-parity`), tools by path, never `npx`:

```
node "D:/Final Fantasy/node_modules/typescript/bin/tsc" --noEmit
node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run tests/unit/parity-ffx2-engine-wiring.test.ts tests/unit/data-ffx2-command-records.test.ts tests/unit/data-ffx2-monster-records.test.ts
node tools/orphans.mjs
```

The measurement (`tests/unit/ffx2-parity-measure.test.ts`, off unless `PYREFLY_MEASURE=1`):

```
PYREFLY_MEASURE=1 PYREFLY_MEASURE_SEEDS=12 PYREFLY_MEASURE_OUT=after-12.json PYREFLY_MEASURE_USAGE=after-12-usage.json \
  node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run tests/unit/ffx2-parity-measure.test.ts
```

`PYREFLY_MEASURE_SEEDS` is a count (`500` plays seeds 1 to 500) or a range (`251-500`); `PYREFLY_MEASURE_CHAPTERS=ffx2-trema,ffx2-leblanc`
narrows the run. Every row carries `perSeed` (one letter a seed, W won the whole chain, L lost, U unresolved) and the `sums` behind
the means, so a 500-seed run can be split across processes and merged exactly. All seven chapters on 12 seeds take about 12 seconds;
500 seeds of one chapter take about 20 to 40 seconds (the machine was quiet).

An ablation puts one piece of the wiring back and plays the same line: the harness is copied with mocks (the game's rows off, all or
one ability's; the old invented Accuracy 104; the old critical chance; the chain multiplier off; the hit-reaction forced hit off;
enemies never critical; `megaflare14` puts the row's Mega Flare power in) so a mover can be attributed to a cause. The generator,
runners and merge tools are scratch outside the repo (`D:\Tools\ffx-parity\w3-logs\make-ablate.mjs`, `D:\Tools\ffx-parity\w3-final\`
`run-after.mjs`, `run-abl.mjs`, `run-each.mjs`, `summarize-*.mjs`); the numbers they produced are in section 5.

To read a row: `tests/fixtures/parity/ffx2/command_rows.json` (by id), the table of ability to row in `research/re-ffx2-commands.md` section 3,
and the ability's record in `src/data/ffx2/command-records/` or `src/battle/ffx2/fallback-records.ts`. To see why an ability differs from
its row: `ability_differences.json` or section 4 of the note.

NOW.md is left to the main session (other agents are active in the tree).
