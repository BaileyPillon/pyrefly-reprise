# Re-parity RC9, lane FFX-G slice G-c (counters, the holder's default attack, reach as a 4-level rule): the engine answers a hit the way the game does

Status: **built, tested, measured and pushed on branch `re-parity-rc9-ffx-counters`; not merged, not deployed** (2026-10-16). Cut from `origin/r49-rc` (`f939b87f`). **Game case: FFX only** (AGENTS.md rule 14): FFX-G04 says FFX-2 has its own counters
(`FFX2-G04`, lane X2-D) and its own reach; none of these addresses exist there. `src/battle/ffx2`, `src/data/ffx2`, `src/battle/ff7` and `src/audio` are untouched (`git diff origin/r49-rc..HEAD` on them is empty); `ffx-engine-golden`, `ffx2-atb-golden` and `ff7-golden`
pass unchanged. Owner: Bailey. His words, as the brief quoted them: 2026-10-08 "It needs to be a 1:1 parity."; 2026-10-15 "keep going please all of this reverse engineering needs to be incorporated into our game" and "keep going please full speed ahead". Deploys need his word.
The first agent built and pushed the kernels and the wiring on 2026-10-15 and was paused mid-way; the lane was finished on 2026-10-16 (tests confirmed, a wider mutation pass, a digest-level measurement, the sources re-read, this note).
Sources: the checked decompile notes `D:\Tools\ffx-parity\coverage\ffx\FFX-G04.md` (rows 15, 17 and 19) and `FFX-H02.md` (line 82), the plan lane FFX-G of `wiring-plan-draft-2026-10-11.md` (slice G-c), and read-only checks of the executable made for this slice
(section 3). Condensed in [`research/re-ffx-targeting.md`](../../research/re-ffx-targeting.md) sections 7 and 8. Paper preflight: [`docs/plans/re-parity-rc9-ffx-counters-review.md`](../plans/re-parity-rc9-ffx-counters-review.md).

## 0. In one paragraph

The engine decided a counter after the action, from the targets that "took damage", with no test for single target, harmful command or can-act, and asked a boss's forced turns (Berserk, Confuse, Provoke) of the generic Attack even when the monster has none.
It also had two shapes of reach: the Sinspawn Gui's "reach 0 falls short" and the Chapter XII flag "physical only from Wakka, Valefor, Anima, Mindy; every non-physical command reaches", which let Auron's and Tidus's Overdrives (filed as `other`) through. Now each hit tells the
counter chain what it came to; a hit arms its target's counter for every outcome but "no effect", the first armed hit decides (can the holder act?) and the holder answers once per command with its own default attack; a monster takes its record's forced-action word as
its default attack (0 for nearly every boss); and a command reaches a foe when its reach, read from the game's 979 command rows, is at least the foe's BattleDistance (the discs 2, Sin's Genais Core 3). No boss or party number moved. **One chapter's line moves, Chapter XVII
(section 6), for a reason that is the game's: Auron's Dragon Fang no longer hits the Core while Genais stands. On 500 seeds of each of the 14 FFX chapters (the 11 listed and the 3 hidden), the whole-chain event logs of 6,558 of 7,000 seeds are byte for byte the base's;
the other 442 are all Chapter XVII, all from link 3 on, and reverting that one rule brings every one of them back.**

## 1. Commits (oldest first, on `re-parity-rc9-ffx-counters`)

| Commit | What | Case |
|---|---|---|
| `70551ae0` | The paper preflight and the research note sections 7 and 8; three stale lines of `ffx-combat-core.md` dated | FFX only; docs |
| `f4d60a5e` | The kernels: `kernel/counter.ts` (counter kind, harmful, queue), `kernel/command-reach-table.ts` (979 target words), `kernel/forced-action-table.ts`; three fixtures (1,830 of the game's own vectors); the kernel test. Wired to nothing | FFX only |
| `a5543c28` | The wiring: `counter-chain.ts`, `adapt/counter.ts`, `hit-apply.ts`, `engine-end.ts`, `runtime.ts`, `intent.ts`, `ticks.ts` (`collectReactions` goes), `reach.ts`, `targeting.ts`, the Omnis discs and the Core; the engine tests; the contract entry | FFX only |
| `8a1d5b97` | A test fix: the merged-hooks probe takes the distance off the Mortiphasm discs and Sin's Genais Core (five tests of `re-parity-ai-merged-hooks` failed in the first full suite since the wiring: the probe is a command with no record, the plain Attack, reach 0) | FFX only; tests |
| `4a119e5b` | The finishing pass: this note (the mutation pass, the measurement, the disclosures, the open items, the CHANGELOG paragraph) and `tests/unit/parity-ffx-counters-seam.test.ts` (6 tests) | FFX only; docs and tests |
| (the commit after it) | This note's section 12 (the whole suite), the merge test and the guides line | FFX only; docs |

## 2. The rows (plan id, note row, what the engine did, what it does now)

| Plan | Note | What the engine did | What it does now |
|---|---|---|---|
| G10 | row 15 (:284; :21) | `collectReactions` after the action, for every target that took HP damage above 0 or MP damage (a miss or a forced miss never); no single-target, harmful or can-act test, so it also countered the damaging hits of group commands and answered while asleep, Threatened, Petrified, Confused, Berserk or Provoked | every hit that is **not a "no effect" outcome** arms its target (a hit, a miss, a forced miss and a Nul-nullified hit all do) when the kind is not 0 and the command is **harmful**; the kind needs a **single-target** command, an attacker that is **not itself in a reaction** and another actor; the first armed hit of a command decides: if the holder **can act** it queues its answer, **once per command** whatever the hit count; a holder the action then kills answers nothing (`counter-chain.ts`, `kernel/counter.ts`) |
| G11 | row 17 (:286) | the generic Attack | party members and aeons: the constant 0x3000 (read, section 3): **no change in effect**. A monster: its record's forced-action word, 0 for 172 of 361 monsters and for every boss of the story chapters but the Gui: the Berserk, Confuse and Provoke turns of a boss with word 0 are **dropped**, and a monster with word 0 could not answer a counter (`adapt/target-world.ts#defaultAttackOf`, `kernel/forced-action-table.ts`) |
| G12 | row 19 rest (:288) | Gui head: reach-0 commands fall short; discs and Core: `outOfMeleeReach` | the 4-level rule against BattleDistance, for all three (`reach.ts#reachOf`, `targeting.ts#reachesTarget`): Gui head 1, discs **2**, Genais's Core **3** then 0 |
| (oq 10) | :325 | "the engine answers once per target per action" | **confirmed by reading**: the game also answers once per target per command |
| (oq 4) | :319 | open | **answered, presentation only** (section 3) |
| (oq 5) | :320 | open | untouched: the Tidus-counter reader concerns G14 only, and no row of this slice reads it |

### 2b. The plan's blockers (FFX-G04 open questions 4, 5 and 10): what became of each

The plan lane FFX-G lists three blockers for the slice ("none blocks G-a or G-b"). For each: the row it touches, whether it was **built**, **settled by the harness** (the game's own code run in the emulator) or **settled by reading** (the decompile or a scan of the executable), or **left out**, and why.

| Open question | Row it touches | Outcome | How, and why |
|---|---|---|---|
| **oq 10**: how many counters a multi-hit action queues | G10 | **built**; settled **by reading**, not by the harness | The orchestrator `pp_BtlCalcCommand` (0x007892e0) runs `pp_BtlCalcTarget` (0x00789740) for every target, and that loops **all** the target's hits through `pp_BtlCalcHit` (0x0078e630) before any is applied; the apply call `pp_BtlApplyHitRecords` (0x0078f060) applies **one hit per call** and, after each, runs the queue when the armed byte is set; the queue clears the byte whether or not it queued. So a target answers once per command. Read by the first agent and re-read in the finishing pass from the three decompiled texts; the whole per-hit pipeline has never been run in the harness (FFX-G04 oq 11 stays open), so this is a read, not an emulation. Wired as `counter-chain.ts#noteCounterHit` (`HitScope.answered`); pinned by `parity-ffx-engine-counters` ("a three-hit blow is answered once") and the mutants `cc-once`, `cc-has-check` |
| **oq 4**: what `Chr+0x6dd` and `Chr+0x446` do | G10 (the queue writes `+0x6dd` from `+0x446`; Cover and the death check clear it) | **settled by reading**; **left out of the engine** (no rule) | A linear scan of the whole `.text` section (2,760,405 instructions, read only; re-run in the finishing pass with the same result): `+0x6dd` has four writers (the target builder, the death check, the queue, the end of the apply call) and one reader, the position getter 0x007948e0, which adds an offset to the world position when the byte is set; `+0x446` is the script property `stat_command_type` (id 0xe0), read by the queue (to choose the `+0x6dd` value), the animation and camera helpers and the script getter. Presentation. No project boss script is known to read property 0xe0 (the AI lanes' notes name none) |
| **oq 5**: the Tidus-counter reader 0x007b7d00 | G14 (landed in RC4), none of G10 to G12 | **left out** | Its caller goes through a call table and was never traced, so what the game does with "the slot with the largest counter" is unknown. Nothing in this slice reads it; the seven counters themselves are wired (RC4, they feed the Cover score) and untouched |

## 3. Reads of the executable made for this slice (all read only, nothing run; scripts in `D:\Tools\ffx-parity\rc9\ffx-counters\`)

1. **How many counters a multi-hit action queues** (oq 10). `pp_BtlCalcCommand` (0x007892e0) runs `pp_BtlCalcTarget` (0x00789740) for every target, and that loops **all** the target's hits through `pp_BtlCalcHit` (0x0078e630) before any is applied;
   the armed byte (`Chr+0x6dc`) is one byte. `pp_BtlApplyHitRecords` (0x0078f060) then applies **one hit per call** and, once the hit is in, runs the queue if the byte is set; the queue clears the byte whether or not it queued. So a target answers once per command.
2. **What `Chr+0x6dd` and `Chr+0x446` do** (oq 4). A linear scan of the whole `.text` section (2,760,405 instructions) for memory operands with those displacements: `+0x6dd` has one reader, the position getter 0x007948e0 (it adds an offset to the world position
   when the byte is set); `+0x446` is the script property `stat_command_type` (id 0xe0), read by the animation and camera helpers and the script getter. Presentation, no rule.
3. **The holder's default attack** (row 17). The character initialiser 0x0079b4f0 writes the constant 0x3000 into `Chr+0x6c6` in its non-monster branch (0x0079b68d) and `R+0x70` in its monster branch (0x0079ba19); the same scan for stores through the field's offset
   (0x6c6 and the base-relative 0x186) finds **no other writer**; the readers are the Berserk damage step, the counter queue, the Berserk/Confuse turn and the Provoke turn. So the note's "aeons differ" is wrong: aeons are 0x3000.
4. **The Mortiphasm discs' BattleDistance.** The formation script `sins03_00`'s battle-start worker (w21.f0) writes BattleDistance 2 on each disc (offsets 0xc23e, 0xc26e, 0xc29e, 0xc2ce, lines 9906 to 9918 of the private AI-lane disassembly). The discs' own init writes none. *(Correction, post-r51: this lane cited `research/re-ffx-ai-seymour.md` section 5 or 5.1 for the value in three places, but that note did not carry it; it has since been added to section 5.1, and the three citations now name the script lines.)* The Core's 3 and its 0 after Genais are the AI lane's earlier read.
5. **Monsters with no default attack.** The forced-action word of the 361 monster records (the FFX-H02 census): 172 carry 0, 84 carry 0x4000 (the monster Attack), the rest their own; of our 40 distinct enemies, 33 are matched to a monster file by the H02 engine comparison (31 of them carry 0, the Gui pair 0x6000), Biran's is Bulldoze 0x60A5 and Yenke's none
   (`research/re-ffx-biran-yenke.md`), and five are not matched yet (the four possessed aeons other than Valefor, and Pterya).

**Re-checked in the finishing pass (2026-10-16), by reading only.** (a) The scan of item 2 was re-run (`scan_disp.py 0x6dd 0x446 0x6c6 0x6dc`, 2,760,405 instructions): the same readers and writers; it also shows `+0x6dc` has exactly one setter (inside the counter-kind function, 0x0078c24e), one clearer (the queue,
0x0078d95f) and one reader that decides (the apply call, 0x0078f53d), and `+0x6c6` four readers (0x0078c0cb, the queue, the Berserk/Confuse turn, the Provoke turn). (b) The decompiled apply function (0x0078f060) was read again: the queue call sits after the one-hit apply block, inside the "hits left" test, as item 1 says.
(c) The decompiled per-hit pipeline (0x0078e630) was read again for FFX-G04 oq 11: the hit check's answer 1 (a miss, a forced miss included) falls through to the arming call; only the answer 2 ("no effect") jumps over it; a Nul-nullified hit arms when the first kind call gave a kind other than 0. The claim that a miss arms the counter holds.

## 4. How it is built

- **Kernels** (`src/battle/ffx/kernel/`, pure, no DOM, no `three`, no draw anywhere in the chain; rule 1): `counter.ts` (`counterKind` 0x0078c1d0, `isHarmful` 0x0079e340, `queueCounter` 0x0078d8d0, `armsCounter`), `command-reach-table.ts` (the target word of every row of the game's command table, 979), `forced-action-table.ts`
  (our enemy id to the monster's forced-action word; Biran and Yenke from the research note).
- **Adapter** (`adapt/counter.ts`): the engine's ability and combatants as the kernel's words: the target type and damage kind from `chainCommand`/`resolveCommand`, the harmful words from the record's `chances`, `durations` and `extra`, the target's auto-ability word from its gear, "the attacker is in a reaction" from `FFXRuntime.inReaction`.
- **Seam** (`counter-chain.ts`): `resolveOneHit` now returns what the hit came to and tells the chain; `noteCounterHit` arms and decides at the first armed hit; the answers queue in `FFXRuntime.counters`; `engine-end.ts#afterAction` runs them where the equipment counters ran (after the boss counters and the scripts' queued reactions, before the item
  reactions); `adapt/reactions.ts#cancelReactionsOf` marks a dying holder's counter lost. `intent.ts` copies the queue for a dry run.
- **Reach** (`reach.ts#reachOf`, `targeting.ts#reachesTarget`): `commandReach` of the kernel (already proven in RC4) on the record's target word; an ability with no record stands for the command it is (item reach 2, spell 3, a physical command the plain Attack). The Chapter XII flag is no longer read (kept in the type; contract entry).
- **Files under 400 lines**: the largest new file is 263 (the table); `hit-apply.ts` 335, `targeting.ts` 321. `types.ts` (3,011) and `intent.ts` (742) were over the limit before this slice and grew by comments and two lines. **No retune**: no boss or party number is touched (`git diff origin/r49-rc..HEAD -- src/data` is one flag on the discs).

## 5. Proofs and mutants

| Test file | What it proves |
|---|---|
| `tests/unit/parity-ffx-counter-kernel.test.ts` (12 tests) | the three kernel functions equal the game's machine code on **1,830 vectors** (840 counter-kind with the armed byte, 550 harmful, 440 queue; stratified from 28,000 + 20,000 + 14,000), plus the note's example E10 and the rules in words |
| `tests/unit/parity-ffx-engine-counters.test.ts` (16 tests) | the engine equals an **independent oracle** on **4,000 generated boards** (answers, cause, once per command, can-act incl. a sleeper woken by a landed physical hit, a reaction attacker, no-effect, Nul, harmless and harmful statuses incl. Doom, group commands, a lethal blow, a holder dead earlier in the action, a gone attacker), and the named cases through `afterAction` |
| `tests/unit/parity-ffx-reach.test.ts` (20 tests) | the table has all 979 rows with the note's counts (204 / 8 / 638 / 129), agrees with the hand-written reach-0 set on every shipped party and aeon command, the reach of the commands the note lists, Wakka/Valefor/Anima's gift, twelve named commands against distances 0 to 3, the discs |
| `tests/unit/parity-ffx-default-attack.test.ts` (6 tests) | the word table covers every shipped enemy but the five unmatched, the bosses' 0, the Gui's 0x6000, Biran/Yenke; a Berserk, Confused or Provoked boss with word 0 is dropped; Biran swings; a holder with word 0 answers nothing |
| `tests/unit/parity-ffx-counters-seam.test.ts` (6 tests; added in the finishing pass) | what the generated boards do not reach: a dry run (`cloneCtx`) starts with the queued counters and queues into a list of its own; an `is-counter` ability meets no counter outside the reaction phase; a holder that is down when the answers come swings at nobody; the reach for a user with no slot and for abilities with no record |
| updated | `chapters/omnis-engine`, `chapters/sin-core-engine` (two tests rewritten: a Grenade and an Energy Ray can no longer be aimed at the Core while Genais stands), `re-parity-ai-sin-core`, `re-parity-ai-merged-hooks` (the probe; `8a1d5b97`). Each change carries its cause in a comment |

**Mutation check: 73 one-rule changes of the production code, 73 caught.** Two batches, run by `mutate2.mjs` in a scratch copy of the tip (so the worktree was never edited): 38 from the first agent (`mutants-def.mjs`, re-run at the tip) and 35 from the finishing pass (`mutants-3-def.mjs`; every `from` string checked to occur exactly once by `check-mutants.mjs`). Each mutant is run against
the lane's test files and, for the data and chapter ones, the chapter engine tests, and counts as caught only when at least one **assertion** fails (a crash of the suite does not count; none was needed). Eight survived a first pass and are caught after the tests added for them: the first agent's five (the harmful test's extra-status word, the lost-counters filter, a counter queued for a character that already died this action,
the gone-attacker check, the same-side reach rule) and three of the finishing pass (`ad-is-counter-flag`, `end-holder-alive`, `intent-clone-counters`), which `parity-ffx-counters-seam.test.ts` kills. "Caught by" lists the test files that failed.

| Mutant | Rule it breaks | Result | Caught by |
|---|---|---|---|
| `ck-target-type` | G10: only a single-target command meets a counter | caught | counter-kernel, engine-counters |
| `ck-reaction` | G10: never against an attacker that is itself in a reaction | caught | counter-kernel, engine-counters |
| `ck-self` | G10: never against itself | caught | counter-kernel, engine-counters |
| `ck-switch` | G10: the duel switch turns counters off | caught | counter-kernel |
| `ck-counter-outranks` | G10: Evade and Counter wins over Counterattack | caught | counter-kernel |
| `ck-magic-by-counterattack` | G10: only Magic Counter answers a magical command | caught | counter-kernel, engine-counters |
| `ck-kind-mask` | G10: the damage kind is the low two bits of the damage word | caught | counter-kernel, engine-counters |
| `harm-restorative` | G10: a restorative command is never harmful | caught | counter-kernel |
| `harm-damage-class` | G10: any damage class is harmful (HP, MP, CTB) | caught | counter-kernel |
| `harm-permanent` | G10: a permanent status with a chance is harmful | caught | counter-kernel |
| `harm-duration` | G10: a temporal status needs a duration to be harmful | caught | counter-kernel |
| `harm-temporal-set` | G10: Sleep, Silence, Darkness and Slow are the harmful temporal statuses | caught | counter-kernel, engine-counters |
| `harm-first-temporal` | G10: the temporal statuses start at status number 12 | caught | counter-kernel, engine-counters |
| `harm-extra` | G10: Eject, Curse and Doom are the harmful extra statuses | caught | counter-kernel, engine-counters |
| `arm-no-effect` | G10: the "no effect" outcome arms nothing | caught | counter-kernel, engine-counters |
| `arm-kind` | G10: a hit arms only when the counter kind is not 0 | caught | counter-kernel, engine-counters |
| `arm-harmful` | G10: a hit arms only when the command is harmful | caught | counter-kernel, engine-counters |
| `queue-can-act` | G10: a holder that cannot act forgets the counter | caught | counter-kernel, engine-counters |
| `queue-mask` | G10: the answer is aimed at the attacker alone | caught | counter-kernel |
| `queue-priority` | G10: the answer is queued at priority 0 | caught | counter-kernel |
| `queue-kind` | G10: the answer is a reaction (kind 1), so it can itself never be countered | caught | counter-kernel |
| `queue-actor` | G10: the answer is made by the holder | caught | counter-kernel |
| `queue-command` | G11: the answer is the holder's own default attack | caught | counter-kernel, default-attack |
| `ad-word-evade` | G10: Evade and Counter is a counter ability | caught | engine-counters |
| `ad-word-magic` | G10: Magic Counter is a counter ability | caught | engine-counters |
| `ad-word-counterattack` | G10: Counterattack is a counter ability | caught | default-attack, engine-counters |
| `ad-reaction` | G10: the attacker is in a reaction while the engine runs reactions | caught | engine-counters |
| `ad-is-counter-flag` | G10: an ability flagged is-counter is a reaction wherever it is run | survived the first pass; caught after the added test | counters-seam |
| `ad-cause` | the answer to a magical command is Magic Counter's | caught | engine-counters |
| `ad-kind-target-word` | G10: the target type of the command comes from its record | caught | engine-counters |
| `ad-kind-damage` | G10: the damage kind of the command comes from its record | caught | engine-counters |
| `ad-harmful-chances` | G10: harmful reads the record's status chances | caught | engine-counters |
| `ad-harmful-extra` | G10: harmful reads the record's extra-status word | survived the first pass (first agent); caught after the added test | engine-counters |
| `ad-harmful-damage-class` | G10: harmful reads the record's damage class | caught | default-attack, engine-counters |
| `ad-harmful-durations` | G10: harmful reads the record's status durations | caught | engine-counters |
| `cc-once` | G10/oq 10: a target answers once per command | caught | engine-counters |
| `cc-has-check` | G10: once a target has been decided for in a command, its later hits decide nothing | caught | engine-counters |
| `cc-can-act` | G10: the holder must be able to act | caught | engine-counters |
| `cc-command-zero` | G11: a holder whose default attack is word 0 queues nothing | caught | default-attack |
| `cc-attacker` | G10: the answer is aimed at the attacker | caught | engine-counters |
| `cc-lost` | G10: a holder the action killed answers nothing | survived the first pass (first agent); caught after the added test | engine-counters |
| `cc-reaction-deaths` | a counter queued for a character that already died this action is lost | survived the first pass (first agent); caught after the added test | engine-counters |
| `cc-take-clears` | G10: the queue is emptied when the action has taken its counters | caught | engine-counters |
| `cancel-counters` | G10: the death check removes a dying holder's counter | caught | engine-counters |
| `end-aggressor-alive` | G10: the answer needs a standing attacker | survived the first pass (first agent); caught after the added test | engine-counters |
| `end-holder-alive` | G10: a holder that is down when the answers come does not swing | survived the first pass; caught after the added test | counters-seam |
| `end-event` | G10: the answer is announced as a counter event | caught | engine-counters |
| `intent-clone-counters` | G10: a dry run copies the queued counters, so its hits cannot queue into the battle's list | survived the first pass; caught after the added test | counters-seam |
| `hit-reaction-forced-miss` | G10: a reaction never meets Evade and Counter's forced miss | caught | engine-counters |
| `hit-counter-hook` | G10: every hit tells the counter chain what it came to | caught | default-attack, engine-counters |
| `hit-noeffect-outcome` | G10: a hit that came to "no effect" reports it | caught | engine-counters |
| `hit-miss-outcome` | G10: a miss reports that it came to a miss, which arms the counter | caught | engine-counters |
| `hit-nullified-outcome` | G10: a Nul-nullified hit reports itself, which arms the counter | caught | engine-counters |
| `hit-final-outcome` | G10: a hit that landed reports itself, which arms the counter | caught | default-attack, engine-counters |
| `tw-defatk` | G11: the forced turns read the combatant's own default attack | caught | default-attack |
| `da-unmatched` | G11: an enemy with no matched monster file keeps the generic Attack | caught | default-attack |
| `fa-gui` | G11: the Sinspawn Gui has the monster Attack as its default attack | caught | default-attack |
| `fa-biran` | G11: Biran Ronso has Bulldoze as his default attack | caught | default-attack |
| `fa-boss` | G11: a story boss (Seymour Flux) has no default attack | caught | default-attack |
| `reach-strict` | G12: a command reaches a target when its reach is at least the distance | caught | reach |
| `reach-no-slot` | G12: Wakka, Valefor and Anima reach by their actor number | caught | reach |
| `reach-unknown-user` | G12: a user the game has no slot for has no special reach | caught | reach |
| `reach-same-side` | G12: a same-side target is always reachable | survived the first pass (first agent); caught after the added test | reach |
| `reach-stand-in-magic` | G12: a spell with no record of its own is reach 3 | caught | reach |
| `reach-stand-in-item` | G12: an item with no record of its own is reach 2 | caught | reach |
| `reach-stand-in-physical` | G12: a physical ability with no record of its own is the plain Attack | caught | reach |
| `reach-record-first` | G12: an ability with a record reads the record's own target word | caught | reach |
| `table-steal` | G12: Steal has reach 0 in the game's table | caught | reach |
| `table-attack` | G12: the plain Attack has reach 0 (and 3 for Wakka, Valefor, Anima) | caught | reach |
| `disc-distance` | G12: the Mortiphasm discs are at distance 2 | caught | reach, omnis-engine |
| `core-distance` | G12: Sin's Genais Core is at distance 3 | caught | re-parity-ai-sin-core, sin-core-engine |
| `core-setup` | G12: the Core is put out of reach while Genais stands | caught | re-parity-ai-sin-core, sin-core-engine |
| `core-release` | G12: the Core's distance is 0 once Genais falls | caught | re-parity-ai-sin-core, sin-core-engine |

Not mutated, and why: the cheap early exit in `adapt/counter.ts#armedCause` (a target with no counter word) is an optimisation, equivalent to the full test; the `reactor.id === aggressor.id` guard in `afterAction` cannot fire (the kernel never arms a self-hit); the `distance <= 0` test of `reachesTarget` is equivalent to `< 0` because a reach is never below 0.

## 6. The goldens and the measurement

### 6.1 Goldens

`ffx-engine-golden` (18 digests: seeds 1 and 7 of nine chapters), `ffx2-atb-golden` (6 tests) and `ff7-golden` (3) pass on the pins they had at the base: **nothing is re-baselined** (`git diff origin/r49-rc..HEAD` on the three files is empty). Chapter XVII, the one chapter whose line moves, is not among its nine chapters; Chapter XII is, and its two pinned seeds meet no command that the new reach rule refuses (and no chapter of the golden meets a counter).

### 6.2 How it was measured

Two scratch copies of the sources (`git archive`; no worktree, no `dist`): one cut from `origin/r49-rc` (the base) and one from this branch's tip, each with a `node_modules` junction. The same runner plays the shipped line (`intendedStrategy`) through every link of a chapter's chain, as `ffx-parity-measure.test.ts` and the golden do, and records per seed the outcome, party turns, engine
turns, party KOs and the **SHA-1 digest of every link's whole event log** (JSON, every field). Fourteen chapters: the eleven listed FFX chapters and the three hidden FFX ones (Sinspawn Gui, Biran and Yenke, Fayth). The numbers agree with the first agent's `base-12.json` and `base-500.json` runs of the same base. Tooling: `zz-digest.test.ts`, `digest-compare.mjs`, `digest-md.mjs`,
`classify-diff.mjs`, `logdiff.mjs` in `D:\Tools\ffx-parity\rc9\ffx-counters\`.

### 6.3 Twelve seeds, base against tip (seeds 1 to 12)

Where one number stands in a cell, base and tip are equal. **158 of 168 seeds have a byte-identical event log in every link**; the ten that differ are Chapter XVII, seeds 1 to 5, 7, 8, 10, 11 and 12, all from link 3 on.

| Chapter | Seeds | Wins | Party turns (mean) | Engine turns (mean) | Party KOs (mean) | Identical event logs |
|---|---:|---|---|---|---|---|
| I `seymour-flux` | 12 | 12 | 53.3 | 73.2 | 1.1 | 12 of 12 |
| II `yunalesca` | 12 | 12 | 148.5 | 210.7 | 12 | 12 of 12 |
| III `braskas-final-aeon` | 12 | 11 | 240.1 | 386.2 | 5.5 | 12 of 12 |
| VII `seymour-anima-macalania` | 12 | 12 | 54.2 | 87.9 | 4.8 | 12 of 12 |
| VIII `evrae-airship` | 12 | 12 | 70.9 | 88.6 | 0.7 | 12 of 12 |
| IX `yojimbo-cavern` | 12 | 11 | 65.3 | 92.5 | 3.6 | 12 of 12 |
| X `seymour-natus` | 12 | 11 | 35 | 51.5 | 2.4 | 12 of 12 |
| XII `seymour-omnis` | 12 | 11 | 91.5 | 124.3 | 0.8 | 12 of 12 |
| XIV `isaaru-via-purifico` | 12 | 11 | 37.6 | 83.3 | 3 | 12 of 12 |
| XVII `sin-fins-core` | 12 | 11 | 310 -> 308.2 | 395.7 -> 394.7 | 1.7 -> 1.8 | **2 of 12** |
| XVIII `sin-face` | 12 | 12 | 45.5 | 50.5 | 0 | 12 of 12 |
| hidden `sinspawn-gui` | 12 | 12 | 82.2 | 113.1 | 0.9 | 12 of 12 |
| hidden `biran-yenke` | 12 | 12 | 16.5 | 36.7 | 0 | 12 of 12 |
| hidden `exp-fayth` | 12 | 12 | 70.9 | 88.6 | 0.7 | 12 of 12 |

### 6.4 Five hundred seeds, base against tip (seeds 1 to 500, every chapter)

The first agent measured the base at 500 seeds for the eleven listed chapters but the tip only for Chapters XII and XVII, by outcome, turns and KOs; the finishing pass did the tip for all fourteen chapters at the level of the whole event log. **6,558 of 7,000 seeds are byte-identical; every one of the 442 that differ is Chapter XVII link 3.**

| Chapter | Seeds | Wins | Party turns (mean) | Engine turns (mean) | Party KOs (mean) | Identical event logs |
|---|---:|---|---|---|---|---|
| I `seymour-flux` | 500 | 500 | 52 | 70.8 | 0.9 | 500 of 500 |
| II `yunalesca` | 500 | 453 | 157.7 | 224 | 13.6 | 500 of 500 |
| III `braskas-final-aeon` | 500 | 479 | 232.1 | 373 | 5.4 | 500 of 500 |
| VII `seymour-anima-macalania` | 500 | 470 | 54.7 | 86.7 | 4.7 | 500 of 500 |
| VIII `evrae-airship` | 500 | 488 | 71 | 89.8 | 0.7 | 500 of 500 |
| IX `yojimbo-cavern` | 500 | 493 | 67.4 | 95.9 | 3.9 | 500 of 500 |
| X `seymour-natus` | 500 | 483 | 33.5 | 48.3 | 1.7 | 500 of 500 |
| XII `seymour-omnis` | 500 | 462 | 95.3 | 129.1 | 0.8 | 500 of 500 |
| XIV `isaaru-via-purifico` | 500 | 452 | 38.2 | 84.4 | 2.9 | 500 of 500 |
| XVII `sin-fins-core` | 500 | **437 -> 428** | 296.4 -> 296.8 | 382.9 -> 383.4 | 3 | **58 of 500** |
| XVIII `sin-face` | 500 | 500 | 45.3 | 50.3 | 0 | 500 of 500 |
| hidden `sinspawn-gui` | 500 | 496 | 80.6 | 110.5 | 0.6 | 500 of 500 |
| hidden `biran-yenke` | 500 | 500 | 16.6 | 36.9 | 0 | 500 of 500 |
| hidden `exp-fayth` | 500 | 488 | 71 | 89.8 | 0.7 | 500 of 500 |

### 6.5 The one move, and its cause (Chapter XVII, link 3)

- **What moves.** 442 of 500 seeds differ, every one first in **link 3** (Sinspawn Genais and Sin's Core; links 1 and 2 are byte-identical on all 500 seeds). Wins 437 -> 428 of 500 (87.4 -> 85.6 percent; z = -0.83, inside the noise of 500 fights): 27 seeds flip from a win to a defeat and 18 from a defeat to a win (a coin-flip split of the 45 that flip: two-sided exact p = 0.23). Every defeat the chapter has is in link 3 apart from four early ones that
  both trees share: 59 -> 68 of 500. Party turns 296.4 -> 296.8, party KOs 3 -> 3. No boss or party number changed.
- **The cause.** On the ten moved seeds of the twelve, the first differing event is the same: Auron's **Dragon Fang** in link 3. The party's own Overdrive records have reach 0 (Dragon Fang is record 0x3065, target word 0x0407: reach 0; the note's section 5.2) and Sin's Genais Core sits at BattleDistance 3 while Genais stands, so Dragon Fang no longer picks the Core: its two hits (Genais and the Core, as the old
  "every non-physical command reaches" flag let it) become one, on Genais (`damage ... hitCount 2` against `hitCount 1`; `classify-diff.mjs`). From there the fight parts. The line wins fewer fights because it no longer gets the Core's share of every Dragon Fang.
- **The proof that it is the only cause.** A third scratch tree is the tip with exactly two files put back to the base's (`targeting.ts` and `ai/sin-genais-core-rules.ts`: the old Core rule): all **500 of 500** Chapter XVII seeds are byte-identical to the base again (12 of 12 on the first pass). So the Core's reach rule is the whole of the move; the counter chain (G10) and the default attack (G11) move no seed of any chapter, and the
  discs (Chapter XII) and the Gui's head do not move one either (500 of 500 each).
- **Why no other chapter can move through this rule.** Only three bodies carry a BattleDistance (the Gui's head 1, the four discs 2, the Core 3); no other chapter's target set meets `reachesTarget`'s new branch. And no shipped build wears Counterattack, Evade and Counter or Magic Counter (no file under `src/data/ffx/builds` names one; the party-prep screen shows the gear, it does not change it), so the counter chain is armed by nothing in the shipped chapters.

## 7. Disclosures in player words (FFX only)

1. **Chapter XVII, Sin's Core while Genais stands.** Only commands that reach far can aim at the Core until Genais falls: spells, Lancet, and the Attack of Wakka, Valefor and Anima. Auron's Dragon Fang (and every other Overdrive of the party) no longer hits the Core: it strikes Genais alone. Items and Valefor's Energy Ray cannot be aimed at the Core either. The fight's recommended
   line wins 428 of 500 simulated fights instead of 437 (87.4 to 85.6 percent; inside the noise). Nothing was tuned.
2. **Chapter XII, the Mortiphasm discs.** Steal, Spare Change, the party's own Overdrives and most aeon Overdrives (Hellfire, Thor's Hammer, Diamond Dust, Mega Flare, Zanmato and the Magus Sisters' Delta Attack) can no longer be aimed at a disc; spells, Lancet, items, the reels, Valefor's Energy Ray and Energy Blast, and the Attack of Wakka, Valefor and Anima still can. The recommended line plays the same on all 500 simulated fights (every fight's log is the base's).
3. **Counters.** Counterattack, Evade and Counter and Magic Counter now follow the game. Any single-target attack that could hurt arms the counter, including an attack that misses (and the miss Evade and Counter forces) and a spell Nul turned aside; healing, buffs, attacks on a whole group or party, and attacks that do nothing at all never do. The wearer answers once per attack, however many hits it
   has, with its own normal Attack at the attacker, only if it can still act after the first hit (not asleep, petrified, confused, berserk, provoked, threatened or ejected) and is still standing when the attack ends. A counter is never answered by another counter. **No shipped build wears these abilities, so no chapter plays differently today.**
4. **Berserk, Confuse and Provoke on a monster.** A monster the game gives no attack of its own (nearly every boss) loses the turn these would have forced on it instead of swinging a generic Attack; a Provoked boss whose script keeps control is unchanged. The recommended lines never inflict these on a boss, and no measured fight reached it.

## 8. Open items

1. **Five enemies have no monster file matched** (the four possessed aeons other than Valefor, and Pterya): they keep the generic Attack as their default attack. The match is research in the private census (FFX-H02), not a game decision.
2. **The identity of a default attack is not resolved.** The word decides whether a monster has one; the engine still resolves every default attack as its one generic `attack` (an enemy's own plain-Attack record where the data carries it). Biran's Bulldoze (0x60A5) and the Gui's 0x6000 are not run as those commands on a forced turn.
3. **Reaction order.** The game queues a counter at priority 0 (item reactions 0x30, Auto-Life 0x40; the priority of a boss script's queued command was not decoded). The engine keeps the old order: boss counters, scripts' queued reactions, equipment counters, item reactions. Latent: no counter wearer in a shipped build.
4. **Two commands in one action** (Doublecast): each command is its own calculation and answer in the game (`pp_BtlCalcCommand` takes the command index; the target keeps two hit-record books); the engine answers each. Whether the queue insert (0x007929b0, and the check inside 0x007b0a30) refuses a second record of one holder was not traced (FFX-G04 oq 10, last sentence). Latent.
5. **When the decision is taken.** The game queues at the first *applied* hit; the engine decides at the first *arming* hit. They differ only if an earlier hit of the same command did not arm and a later hit changes the holder's state, which no rule of the shipped data does (a "no effect" is the same for every hit of one target). Latent.
6. **Out of the model:** the byte at 0x0112ca12 (0 only in the eleven Belgemine duel scenes, none a chapter of the project); an auto-ability a monster's own script would write into `Chr+0x6bc` (none of the project's formation scripts is known to); FFX-G04 oq 5 (the Tidus-counter reader) and oq 11 (the whole per-hit pipeline has never been run in the harness; the control flow was re-read, section 3).
7. **`CombatantFlags.outOfMeleeReach` and `REACHES_OUT_OF_MELEE`** are no longer read by any engine (kept in the type and as documentation; contract entry). A later cleanup may remove them once nothing cites them.
8. **Merge hot spots** with the other RC9 lanes. A test merge of this branch with each sibling (`git merge-tree`, nothing written) conflicts only on `docs/CONTRACT-CHANGES.md` (every lane adds its entry at the top: keep both), plus two adjacent-addition conflicts with `re-parity-rc9-ffx-rewards`: `runtime.ts` (the import lines) and `intent.ts` (the lines `cloneCtx` copies): keep both.
   `re-parity-rc9-x2-grids` merges clean; `types.ts` and `index.ts` merge by themselves with every sibling. Files to read when merging: `hit-apply.ts`, `engine-end.ts`, `targeting.ts`, `runtime.ts`, `ticks.ts`; `src/battle/ffx/index.ts` loses the export `collectReactions` (nothing imported it but `engine-end.ts`).
9. **The guides need no change.** The Chapter XVII guide already says "while it lives, blades cannot reach the Core" and the Chapter XII guide "only Wakka can reach a disc with a blow"; the rule now enforces what they say (the old engine let Overdrives through).
10. **A heavy-load note.** In the finishing pass the full suite was run while the machine was at 100 percent CPU; see section 12 for the files that timed out and the single re-runs.

**Decisions for Bailey** (none blocks the merge):

- **Chapter XVII's line.** The recommended line spends Dragon Fang while Genais stands, as before; under the game's rule that no longer reaches the Core (section 6.5). Keeping the line as it is costs about two points of win rate in the simulation. Holding Dragon Fang until Genais falls would be a change to the line (an idea, rule 10): I have not built or measured it. Recommendation: leave the line, and decide when the chapter's guide text is next reviewed.
- **Nothing here is tuned.** If Bailey would rather the Core stay reachable by Overdrives, that is a departure from the game's rule (a data override on the Core's BattleDistance), not a fix; not recommended.

## 9. The three states

| | decompiled | wired | live |
|---|---|---|---|
| counter kind, arming, harmful test, queue (G10) | yes: 0x0078c1d0, 0x0079e340, 0x0078d8d0 emulated, 62,000 vectors; the order of calculation and application read | yes, this branch | no |
| the holder's default attack (G11) | yes: the initialiser's two stores read, the field's four readers listed; the forced-action words read for 361 monsters | yes for the 35 enemies with a word, the generic Attack for the five unmatched | no |
| reach as a 4-level rule (G12) | yes: 0x00799690 emulated exhaustively (RC4); the 979 target words read | yes, this branch | no |

## 10. CHANGELOG paragraph (plain words; for the main session to paste, not edited into `CHANGELOG.md` here)

**FFX only.** Counters, reach and a monster's own attack now follow the game's code. Counterattack, Evade and Counter and Magic Counter answer a hit the way the game decides it: any single-target attack that could hurt arms the counter, including one that misses (and the miss Evade and Counter forces), while healing, buffs, attacks on a whole group and attacks that do nothing never do; the wearer answers once per attack, however many hits it has, with its own normal Attack, only if it can still act, and a counter never meets another counter. No build in the game wears these abilities yet, so no chapter plays differently through them today. A command now reaches a far target only when its own reach, read from the game's 979 commands, is at least the target's distance: the Mortiphasm discs in Chapter XII sit at distance 2 and Sin's Core in Chapter XVII at distance 3 until Genais falls, so Steal, Spare Change and most Overdrives can no longer be aimed at a disc, and Auron's Dragon Fang, items and Valefor's Energy Ray no longer reach the Core while Genais stands (spells, Lancet and the Attack of Wakka, Valefor and Anima still do). The recommended line wins 428 of 500 simulated fights at Chapter XVII instead of 437, which is within the noise, and every other chapter plays out identically on all 500. A monster the game gives no attack of its own, nearly every boss, now loses the turn Berserk, Confuse or Provoke would have forced on it. Nothing about any boss or party member's numbers changed.

## 11. Re-run commands (repo root of the worktree; Node 24; TEMP and TMP on D:, here the per-lane folder `D:/Tools/ffx-parity/tmp/ffx-counters`)

```
node "D:/Final Fantasy/node_modules/typescript/bin/tsc" --noEmit -p .
TEMP=D:/Tools/ffx-parity/tmp/ffx-counters TMP=D:/Tools/ffx-parity/tmp/ffx-counters node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run --maxWorkers=2 tests/unit/parity-ffx-counter-kernel.test.ts tests/unit/parity-ffx-engine-counters.test.ts tests/unit/parity-ffx-reach.test.ts tests/unit/parity-ffx-default-attack.test.ts tests/unit/parity-ffx-counters-seam.test.ts
TEMP=... TMP=... node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run --maxWorkers=2 tests/unit/ffx-engine-golden.test.ts tests/unit/ffx2-atb-golden.test.ts tests/unit/ff7-golden.test.ts
node tools/orphans.mjs
```

Tooling outside the repo (`D:\Tools\ffx-parity\rc9\ffx-counters\`): `export-counter.mjs <repo>` re-exports the three fixtures from the note's vector files; `gen-reach-table.mjs <repo>` and `gen-forced-table.mjs <repo>` regenerate the two tables; `scan_disp.py` is the read-only scan of the executable (`<venv python> -I scan_disp.py 0x6dd 0x446`). Mutation:
`mutants-def.mjs` and `mutants-3-def.mjs` write the two mutant lists, `check-mutants.mjs <repo> <list>` checks that every `from` string occurs once, `mutate2.mjs <repo> <list> <out>` runs them (run it in a scratch copy of the tree, never in a shared worktree), `mutants-table2.mjs` renders the table. Measurement: copy the sources of the base and of the tip into two scratch folders with
`git archive <ref> src vitest.config.ts package.json tsconfig.json | tar -x -C <dir>`, junction `node_modules`, copy `zz-digest.test.ts` into `<dir>/tests/unit/`, run it there with `ZZ_SEEDS=1-500 ZZ_OUT=<file>` (and `ZZ_CHAPTERS=a,b` to pick chapters, `ZZ_DUMP=chapter:seed` plus `ZZ_DUMPDIR` to keep a run's full logs), then
`digest-compare.mjs base.json after.json`, `digest-md.mjs` for the tables, `classify-diff.mjs` and `logdiff.mjs` for the first differing event. The older `compare.mjs`, `ablate*.mjs` (temporary switches that put every file back byte for byte) and `mutate.mjs` are the first agent's.

## 12. The whole suite

Run on 2026-10-16 in this worktree (`public/art` is the local art, so the art tests judge this disk), `--maxWorkers=2`, with every test file run once, in two parts because the first was already running when the second was begun: part 1 is the 303 files of `tests/unit/chapters/`, `tests/unit/parity-ffx*`, `tests/unit/re-parity*` and the three golden files; part 2 is the other 966.
The new seam test, which part 1 had not collected, was run on its own (6 passed) and again in the final confirmation below. The machine was at 100 percent CPU for the whole run (other sessions). Together: 1,270 files and 19,979 tests.

| Part | Files | Tests | Failures |
|---|---|---|---|
| 1 (3,228 s) | 303: 297 passed, 6 skipped | 4,587 passed, 38 skipped | none |
| 2 (1,887 s) | 966: 950 passed, 9 skipped, 7 failed | 15,302 passed, 36 skipped, 1 todo, 9 failed | three timeouts under load and six art-only, below |

- **Three timeouts under load, not failures of a rule.** `advisor-floor.test.ts`: "holds across 4. Bahamut" (22.5 s), "2. Lady Yunalesca" (21.0 s) and "3. Braska's Final Aeon" (18.5 s) hit the 15 s default while the machine was saturated. The file run alone passes **22 of 22** (85 s; the slowest test 11.9 s).
- **Six art-only failures** (the painted art on this disk differs from the hashes the tests lock; `public/art` is gitignored and local; none touches the engine): `exp-leblanc` (Chapter VI's paintings, sha256), `engine/pose-install-0926`, `engine/pose-install-0930`, `engine/pose-install-songstress-0929`, `engine/pose-install-thief-0926` (the Rikku and item paintings, sha256) and `engine/pose-scale-art` (104 poses measured against art that changed).
  The first agent's full run of 2026-10-15 had the same six and nothing else once the merged-hooks probe was fixed.
- **Final confirmation after the last edit:** `tsc --noEmit` clean; the five lane files, `omnis-engine`, `sin-core-engine`, `re-parity-ai-sin-core`, `re-parity-ai-merged-hooks`, `ffx-engine-golden` and `ff7-golden`: 11 files, 206 tests, all passed (`ffx2-atb-golden` passed in part 1 and on its own earlier: 6 tests).
- No dev or preview server was started by this lane; the scratch trees and the per-lane TEMP were removed at the end (the evidence files are kept in `D:\Tools\ffx-parity\rc9\ffx-counters\results-2026-10-16\`).
