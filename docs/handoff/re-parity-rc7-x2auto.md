# Re-parity RC7, lane X2-D: FFX-2's automatic statuses, SOS statuses, Berserker counters and Evade & Counter follow the game

Status: **built and committed on branch `re-parity-rc7-x2auto`, pushed, not merged, not deployed** (2026-10-13). Lane X2-D of
[the wiring plan](../plans/re-parity.md) (rows XD1 to XD6 of the draft plan `D:\Tools\ffx-parity\coverage\wiring-plan-draft-2026-10-11.md`; the source is
the private decompile note FFX2-G04, whose numbers are the ones in the proof fixtures below). Owner: Bailey. Base: `ab57f082`
(`origin/re-parity-rc6-ch2`: live r44a + the audio build + everything through RC6), merged up to `f6af1e3b` (the same branch's next commit, a handoff note only). **Game case: FFX-2 only** (AGENTS.md rule 14): no file of
`src/battle/ffx`, `src/data/ffx` or `src/battle/ff7` changed; `ffx-engine-golden` and `ff7-golden` import nothing this lane touched and pass unchanged.

Bailey, 2026-10-08: "It needs to be a 1:1 parity." 2026-10-09: "Your findings need to be implemented into live builds as the decompilation work progresses."
2026-10-13: "i'll go with all of your recommendations", "so it can go in live builds asap".

Nothing on a boss or a party was tuned (hard rule 6 and the lane brief). No shipped build wears a loadout that uses this lane, so **the shipped line does not move**
(12 and 500 seeds, every FFX-2 chapter, seed for seed). The lane is measured on three loadouts that do use it (section "Measurement"), and the one engine rule that rests on a point the note leaves open (a miss reaching the counter check, `COUNTER_AFTER_MISS`) is a named switch with its own measurement and a decision for Bailey.

Commits (all on `re-parity-rc7-x2auto`, on top of `ab57f082`):

| Commit | What |
|---|---|
| `94ff4872` | The kernels (`kernel/sos-layer.ts`, `kernel/counter-check.ts`) with the vector samples of FFX2-G04 as fixtures (`auto_layer.json`, `counter_check.json`), and their kernel test |
| `7d700e72` | The wiring: the girl's layer, the result applier, the counters, Evade & Counter, the dress change and the clock seams, with the engine-level proofs |
| `c5e0a5f9` | A guard the mutation pass found nothing pinned (a later strike of the same command), one redundant guard removed, and the variant-loadout measurement harness |
| `222a326c` | Merge of `origin/re-parity-rc6-ch2` (`f6af1e3b`, a note only: no battle code) |
| (the last commit) | This note, with the measurement, the ablations and the mutation pass re-run on the final tip |

## What the engine does now

| Piece | Where | What it is |
|---|---|---|
| The layer kernel | `kernel/sos-layer.ts` | HP state (the existing `hpState`, which the same note proved), the saturating add, the **automatic status copy** (0x636920) and the **SOS check** (0x6362E0) as pure functions on the game's own record (kept set, SOS set and flag, effective layer, the HP state it was made for). 89,184 vectors in the note, 0 mismatches; the fixture is a stratified 1,028 of them |
| The counter kernel | `kernel/counter-check.ts` | The **counter check** (0x641360) and its can-act test (0x6491D0): 30,000 vectors, 8,676 queue a counter, 0 mismatches; the fixture is 300 of them (92 queue) |
| The sources | `adapt/auto-rows.ts`, `adapt/auto-layer.ts` | Three small tables pair the engine's ids with the game's rows (dresspheres to job ids; four dressphere abilities and the three Berserker counters to their rows; the **16 accessories** the note lists to theirs), and the adapter builds a girl's list with the kernel's own job pairs (`jobAbilityGroup`), the tables with `applyAbilityEffects` and the ability words with `abilityWords`. A girl who holds no row gets **no layer at all** and is built exactly as before |
| The layer on the unit | `auto-layer.ts` | `unit.autoLayer` (the rows, the words, the three layers); `unit.autoStatuses` is now the **effective** layer, which the status kernels already read as "held by a permanent source" (so a Dispel cannot take it). A status the layer puts on carries `sourceAbilityId: 'auto-layer'` and no clock; only such a status is taken off when the layer lets go; a status a command inflicted stays its own (and, if its clock runs out while the layer holds the same status, becomes the layer's) |
| The switch points | `applied.ts`, `status-clock.ts`, `execute.ts`, `setup.ts` | The game's result applier calls, in order, the SOS check, the target's script and the counter check **after every applied result**: `resolve-strike.ts` now reports each result there (each strike that lands, one for a command that misses or has no effect, a drain's transfer to the drainer). The SOS check also runs after a Poison or Regen payout, the layer is rebuilt and copied (forced) after a dress change, and made at the start (forced, silent). Events: `status-add` / `status-remove` when the SOS set comes on or goes off |
| The counter | `applied.ts`, `engine-core.ts`, `engineHooks.ts#runPartyCounters` | A result that sets one off queues it (once per girl per action: a girl with a counter already waiting queues none); after the action the engine plays each as a free action: `action-start`, her Attack at the attacker alone, the `counter` event (cause `counterattack`, `evade-and-counter` or `magic-counter`), `action-end`; no change to her ATB. It reports to the enemy scripts as a party action's damage does, is not a turn, and sets off no counter of its own |
| Evade & Counter | `adapt/inputs.ts` (`evadesPhysical`) | The hit kernel already had the rule (a physical-only command on accuracy formula 1 or 2 misses a holder with no roll; asleep, petrified or Stopped lifts it; a target in hit reaction is still missed). Nothing fed it: it is fed now |

## Difference rows (FFX2-G04 section 8, plan rows XD1 to XD6): what changed

Game case for every row: **FFX-2 only**.

| Row | The game | What the build did | What it does now | Proof |
|---|---|---|---|---|
| XD1 accessories | 16 of 128 accessories keep a status or an SOS set (rows 0x8069, 0x806A to 0x806F, 0x8071, 0x8077, 0x8078, 0x807A, 0x809B, 0x8095, 0x8096, 0x809C) | 4 modelled (Moon, Shining, Defense Bracer, Adamantite) | **All 16**: Shmooth Shailing (Slow, kept), Moon / Shining / Defense Bracer and Adamantite (Shell / Protect / both), Star Bracer (Reflect), Recovery Bracer (Regen), Speed Bracer (Haste), Ragnarok (Spellspring), Bloodlust (Poison and Berserk), Wring (Poison and Haste), Minerva's Plate (Pointless), and the SOS ones: Wall Ring (Shell and Protect), Regen Bangle, Haste Bangle, Cat Nip (**Berserk, Damage 9999 and Slow together, only while HP is under a third**; nothing is kept) | `parity-ffx2-auto-sources.test.ts` (the table is exactly the 16 accessory rows of the game's data, as a multiset; Adamantite and Bloodlust are found by their stat lines), `parity-ffx2-auto-engine.test.ts` |
| XD1 dresspheres | Warrior (SOS Protect), Samurai (SOS Critical), Lady Luck (Critical, SOS Spellspring), Mascot (Auto-Shell, Auto-Protect), Berserker (Auto-Regen), Festivalist (SOS Regen, SOS Haste, SOS Wall) | inert markers | **Warrior, Samurai, Lady Luck's Critical, Mascot's two**, each only while the dressphere is worn and the ability mastered (the kernel's job pairs decide; the engine's own prerequisite is the game's, checked) | `parity-ffx2-auto-sources.test.ts`, the loadouts of `parity-ffx2-auto-engine.test.ts` |
| XD1 grids | 10 grids keep a status or an SOS set | not modelled | **Not wired** (listed below) | |
| XD2 | effective layer = kept set, plus the SOS set while HP state is 1 (HP x 3 < max HP, truncating, dead excluded); the copy and the check have no port | no SOS layer, no HP-state switch | Both, as above | 600 random runs against an oracle (below) |
| XD3 | Counterattack, Magic Counter, Evade & Counter are engine-side, no probability: the holder's own Attack at the attacker; only the Berserker dressphere lists them | markers no battle code acts on: **a Berserker's passives did nothing** | Wired as above | 400 random actions against an oracle, plus the hand cases |
| XD4 | a physical-only command with accuracy formula 1 or 2 misses a holder with no roll, unless her root is asleep, petrified or Stopped | `evadesPhysical: false` | wired | `parity-ffx2-auto-engine.test.ts` section 3 |
| XD5 | the reaction entry runs for every applied result | since AI-FFX2-b the per-result `onResult` exists | unchanged: `applied.ts` hands every result to the same hook; what is left of the row is Paragon's immediate-counter OFF option, which keeps its owner decision (D-146/TR12 = b) | |
| XD6 | Shuyin (m260) has Spellspring; four commands cost MP | no Spellspring, costs 0 | **Not changed**: no behaviour effect today, only a Spellspring icon on Shuyin. Listed for Bailey | |

## Findings now wired, and findings still only decompiled

| Finding (FFX2-G04) | State |
|---|---|
| 3.1 HP state | **Wired** (existing kernel; its answer now decides the layer) |
| 3.2 the automatic status copy, 3.3 the SOS check | **Wired**: at the start, after every applied result, after a Poison or Regen payout, after a dress change |
| 3.3 callers: "the stat setter when a script sets HP", the script rebuild handler, the forced copy after a script revive | **Only decompiled**: no engine script sets a girl's HP or statuses this way (the boss-AI lane writes its effects directly) |
| 3.4 the 16 accessories, Warrior, Samurai, Lady Luck's Critical, Mascot | **Wired** |
| 3.4 Berserker's Auto-Regen, Lady Luck's SOS Spellspring, the Festivalist, the 10 garment grids, Double HP and Double MP | **Only decompiled** (see "Open items") |
| 3.4 monster records (42 with automatic statuses) | **Matches** (the engine's enemies keep them in `autoStatuses`; Shuyin's is XD6) |
| 3.5 the ability words: Counterattack, Evade & Counter, Magic Counter | **Wired** |
| 3.5 the six words nothing sets or reads (Magic, Status Master, Drain Sword, Aspil Sword, Auto HP, Auto MP) | **Nothing to build**: the engine omits them, and so does the game's battle |
| 3.6 the counter check and the hit pass | **Wired** |
| 3.7 the party script, 3.8 the reaction record (player-side monsters 15 to 22) | **Nothing to port** for the five chapters: no party-side script logic exists in this build, and no chapter fields a player-side monster. Unbuilt, as the lane says |

## Engine rules that are the engine's own (not in the notes), and where each can be switched

1. **A miss reaches the counter check** (`constants.ts#COUNTER_AFTER_MISS`, on). The note says "whether a missed attack still reaches the counter check is not traced"; the AI note (`research/re-ffx2-ai-fallen-trema.md` 1.2, [H]) says the applier runs for a miss too, and the check has no hit test of its own. Counterattack and Evade & Counter therefore answer a miss; Magic Counter needs something to have landed, so a miss never gives it. One live check settles it. Measured with the switch off in the ablation of "Measurement" (NOMISSCTR).
2. **A counter changes nothing of the girl's ATB** (an `[estimate]`, like the enemy counters of Chapter XIII): the note does not say a queued counter costs a gauge.
3. **A fallen girl or a fallen attacker gets no counter** (the knock-out routine drops her queue).
4. **A Poison or Regen payout reaches the SOS check** (AI note 1.2 lists the engine-built ticks among the results the applier handles) but **not** the counter check (no note says it can).
5. **Haste in effect clears Slow** (the status recompute, `status-timers-set.ts`): a girl who keeps Slow (Shmooth Shailing) and has Haste (the layer's or cast) shows only Haste, and her Slow shows again when the Haste ends.
6. **Her counter reports to the enemy scripts as a party action** (`onDamaged`, `onTargeted`, the results tally) **but is not a turn** (`onTurnResolved` is not told) and has no Paragon `counter` answer of its own.

## Proofs and tests

Run from the worktree root with the tools by path, `TEMP` and `TMP` on `D:` (see "Re-run").

* **Kernels against the game's own answers**, `parity-ffx2-auto-layer.test.ts` (19 tests): the stratified fixtures, 400 HP states, 400 saturating adds, 132 copies (forced and not, states 0/1/2), 96 SOS checks (every call pattern), 300 counter checks (92 queue); and the note's hand examples (the 9,999 / 100 / 1-to-3 / 0 maximum, count 126 surviving a sum, SOS statuses vanishing at a KO and at a heal to a third).
* **The pairing against the game's tables**, `parity-ffx2-auto-sources.test.ts` (11 tests): the dresspheres' ids and the Attack command each runs; every paired row is in the job pairs of the dressphere that owns the ability, with the same prerequisite (Sentinel is 0x3064); the accessory table is exactly the 16 accessory rows that carry a kept or SOS row; the rows are the note's (Cat Nip is Berserk + Damage 9999 + Slow, SOS; nothing kept).
* **The wiring against an independent oracle**, `parity-ffx2-auto-engine.test.ts` (20 tests) on a real engine (`helpers/ffx2AutoRig.ts`; nothing imports `adapt/auto-*` or the layer): **600 random runs** of damage and healing on 11 loadouts (the HP replayed from the damage events, the layer's statuses and the announced adds and removes compared after every action; 300+ switches on, 300+ off, KOs reached); **400 random actions** on three girls with random counter loadouts and random states (sleep, petrify, stop, confuse, itchy) against the real pool of 100+ commands with a game row, the counters compared as a set, once per girl; every physical rolling command misses a holder and some hit a girl without the bit; the forced miss is lifted by sleep and Stop; no counter of a counter; no counter for a girl who falls to a later strike; a counter leaves her ATB alone; a Dispel takes none of the layer; a command's status stays hers when the layer lets go; a dress change rebuilds the list.
* **The clock seams**, `parity-ffx2-auto-clock.test.ts` (6 tests): SOS Regen turns itself off when its own healing takes her over a third; a permanent Poison takes her under and the SOS set comes on in that step; a cast Haste whose clock runs out while the layer holds Haste stays; Haste ending lets the layer's Slow show; a chained link opens with the layer made for her HP (a stale layer status goes, one still needed stays); a girl who now holds no row sheds the layer's statuses.
* **Mutation pass** (by hand, scratch, one textual change at a time, the four files run for each; `D:\Tools\ffx-parity\x2d\mut.py`): 30 faults run on the final tip (2026-10-13; log `x2d/mut_final.log`): the SOS state window and the saturating add, the forced-copy and flag guards, the notify flag, the counter check's multi-target, Magic-Counter-landed, Itchy and pending-system tests, a counter on herself, a counter of a counter, two counters from one action, a fallen girl or attacker countering, a Stopped girl countering, no SOS check after a result or a payout, no rebuild after a dress change, no layer at the start, an expired status not handed to the layer, Slow beside Haste, the layer letting go without saying so, a carried layer status staying, Cat Nip as the wrong row, the dressphere rule dropped, Evade & Counter not wired, a counter not marked a counter, everything landing for Magic Counter. **29 caught. One survived and is equivalent**: the SOS check's own early-out on a clear flag (a layer with the flag clear holds no SOS row, so the kernel's flag test, whose removal is mutant M4 and is caught, gives the same answer). Two of the 29 (a counter of a counter, a counter not marked a counter) are caught because the engine test file cannot finish, not by one assertion. The pass earned its keep once: its first form of the fallen-girl fault survived because a guard in `applied.ts` was redundant (`runPartyCounters` already drops a counter whose girl or attacker has fallen) and nothing pinned the real one; commit `c5e0a5f9` removed the redundant copy and added the test that pins it (caught now as M13b).
* `tsc --noEmit` clean. `node tools/orphans.mjs`: none of the lane's modules is listed. Files over 400 lines among those touched: none new; `engine-core.ts` is 390, `resolve-strike.ts` 387.

## Goldens

**None moved.** `ffx2-atb-golden` (Chapters 4 and 5, D = 0 and D = 1500, Wait, the speed lever), `den-of-woe-carry` (Chapters 5, 6 and XI, "byte-identical event logs to the base commit, seeds 1-8"), `ffx2-hit-closes-menu`, `ffx-engine-golden` and `ff7-golden` all pass unchanged. A girl who holds no row has no layer, so no draw, no event and no state of any shipped build changes; the shipped line is also seed-for-seed identical in the measurement below.

## Whole suite (once, 2026-10-14, on the tip before this note's commit)

`vitest run --maxWorkers=2` from the worktree root, `TEMP`/`TMP` on `D:`, about 25 minutes: **1,168 files: 1,131 passed, 22 failed, 15 skipped; 17,693 tests: 17,395 passed, 182 failed, 115 skipped, 1 todo.** The 22 failing files are exactly the art-only set `origin/re-parity-rc6-ch2` records for a worktree without `public/art` (22 files, 182 tests, the same numbers): `ui-portrait-face-crop` (145 tests), `art-ref-defaults` (4), `pause-remake` (3), `chapter-meta` (file), `chapter-meta-evrae` (3), `chapter-meta-ffx2-leblanc` (2), `chapter-meta-seymour-anima-macalania` (3), `cutscene-story-poses` (1), `party-face-manifest` (file), `chapters/chapters-6-7-8-enemy-sprite-manifest` (file), `chapters/den-of-woe-ship-content` (3), `chapters/den-of-woe-ship-scene` (1), `chapters/experiment-scene` (1), `chapters/fallen-aeons-ship-content` (2), `chapters/fallen-aeons-ship-scene` (1), `chapters/isaaru-ship` (3), `chapters/leblanc-art` (2), `chapters/leblanc-party-sprites` (file), `chapters/natus-ship-content` (2), `chapters/natus-ship-scene` (2), `chapters/trema-ship-content` (4), `chapters/yojimbo-content` (file). Every failure is an ENOENT on `public/art/...`, a missing `public/art/manifest.json` or "Reference image not found". Not fixed, by rule. No file of this lane fails, and the base's one load timeout (`party-prep-panels`) did not recur. This tree has 1,168 test files under `tests/unit` against 1,163 on the base: the lane adds five (the four parity files and the measurement file, which skips unless `PYREFLY_MEASURE` is set). The base note's own run counted 1,140 files and 17,303 tests; I did not reconcile that gap (it is not the `zz-*` scratch files: none is tracked or present here), but the failing set and the failing counts are the same. Before the suite: `tsc --noEmit` clean (2,964 worktree files checked) and the 8 target files (the four lane files, the three goldens and `den-of-woe-carry`) 90 of 90.

## Measurement

Method: `tests/unit/ffx2-parity-measure.test.ts` (the shipped line: the opening party of each chapter, the intended strategy, the whole chain) and `tests/unit/ffx2-auto-measure.test.ts` (the same path with a loadout that uses the lane), seeds 1 to 12 and 1 to 500, **before** = the base `origin/re-parity-rc6-ch2` (`ab57f082` for all battle code; `f6af1e3b` adds a note only; byte-compared against a scratch copy of its `src`) and **after** = this branch. Measure, never tune: nothing was adjusted to move a number. Scratch under `D:\Tools\ffx-parity\x2d` (outputs in `out/`, ablation copy in `abl/`).

**1. The shipped line does not move.** Every FFX-2 chapter, 12 and 500 seeds, base against after: the per-seed outcomes, the turn, minute and KO sums are **identical** (`identical` at 12 seeds, `identical` at 500).

| Chapter | wins of 12 (base = after) | wins of 500 (base = after) |
|---|---|---|
| bahamut | 12 | 500 |
| vegnagun-shuyin | 12 | 490 |
| leblanc | 12 | 500 |
| fallen-aeons | 12 | 500 |
| trema | 10 | 363 |
| den-of-woe | 12 | 500 |
| ixion-djose | 12 | 500 |

**2. Loadouts that use the lane (the movers).** Three loadouts laid on each chapter's opening party, base (no layer, no counters: the abilities are inert markers) against after, same seeds:

* `berserker`: all three girls in the Berserker dressphere with Counterattack, Magic Counter and Evade & Counter learned.
* `mixed`: Yuna a Berserker (the three counters), Rikku a Samurai with SOS Critical, Paine a Warrior with SOS Protect.
* `bangles`: the shipped dresspheres with a Wall Ring (SOS Wall), a Regen Bangle (SOS Regen) and a Haste Bangle (SOS Haste) on the three girls' second accessory slot.

`berserker`, base to after (a single number: unchanged). "Paired" counts the same seed: won both / won before and lost after / lost before and won after / lost both.

| Chapter | wins of 12 | wins of 500 | link 1 won (500) | party turns | engine turns | minutes | party KOs | paired (500) | counters played / SOS sets switched on (after, 500) |
|---|---|---|---|---|---|---|---|---|---|
| bahamut | 12 | 500 (100.0 to 100.0 percent) | 500 | 51.8 to 49.3 | 62.6 to 60.2 | 1.1 | 0 | 500 / 0 / 0 / 0 | counterattack 1503; SOS 0 |
| vegnagun-shuyin | 12 | 476 to 484 (95.2 to 96.8 percent) | 500 | 149.2 to 134.5 | 224 to 197.4 | 3.7 to 3.3 | 0.6 to 0.3 | 474 / 2 / 10 / 14 | counterattack 6876, magic-counter 2908; SOS 0 |
| leblanc | 12 | 500 (100.0 to 100.0 percent) | 500 | 52.7 to 39.3 | 70.7 to 54.2 | 1.3 to 0.9 | 0.1 to 0 | 500 / 0 / 0 / 0 | counterattack 5279, magic-counter 322; SOS 0 |
| fallen-aeons | 10 to 11 | 465 to 496 (93.0 to 99.2 percent) | 500 | 129.3 to 127.4 | 216.8 to 186.4 | 5.2 to 5.1 | 0.5 to 0.1 | 464 / 1 / 32 / 3 | counterattack 5058, magic-counter 6199; SOS 0 |
| trema | 11 to 9 | 291 to 327 (58.2 to 65.4 percent) | 457 to 455 | 173.4 to 165.5 | 276.6 to 261.8 | 9.4 to 8.7 | 1.4 to 1.2 | 218 / 73 / 109 / 100 | counterattack 13636, magic-counter 733; SOS 0 |
| den-of-woe | 12 | 500 (100.0 to 100.0 percent) | 500 | 36.1 to 26.7 | 48.2 to 34.9 | 0.8 to 0.6 | 0 | 500 / 0 / 0 / 0 | counterattack 2484, magic-counter 501; SOS 0 |
| ixion-djose | 12 | 500 (100.0 to 100.0 percent) | 500 | 40.5 to 29.2 | 54.2 to 39.1 | 1.6 to 1.1 | 0.2 to 0 | 500 / 0 / 0 / 0 | counterattack 2037, magic-counter 1993; SOS 0 |

`mixed`, base to after (a single number: unchanged). "Paired" counts the same seed: won both / won before and lost after / lost before and won after / lost both.

| Chapter | wins of 12 | wins of 500 | link 1 won (500) | party turns | engine turns | minutes | party KOs | paired (500) | counters played / SOS sets switched on (after, 500) |
|---|---|---|---|---|---|---|---|---|---|
| bahamut | 12 | 500 (100.0 to 100.0 percent) | 500 | 53.8 to 51.6 | 64.1 to 61.5 | 1.3 to 1.2 | 0 | 500 / 0 / 0 / 0 | counterattack 712; SOS 81 |
| vegnagun-shuyin | 8 to 11 | 393 to 417 (78.6 to 83.4 percent) | 500 | 165.8 to 162.6 | 260.9 to 250.1 | 4.7 to 4.5 | 2 to 1.6 | 359 / 34 / 58 / 49 | counterattack 2705, magic-counter 2097; SOS 1718 |
| leblanc | 12 | 500 (100.0 to 100.0 percent) | 500 | 59.7 to 55.7 | 80.9 to 74.7 | 1.5 to 1.4 | 0.4 | 500 / 0 / 0 / 0 | counterattack 2187, magic-counter 165; SOS 423 |
| fallen-aeons | 9 to 12 | 421 to 464 (84.2 to 92.8 percent) | 500 | 130.7 to 145.7 | 225.9 to 230.8 | 5.6 to 6.2 | 1 to 0.5 | 406 / 15 / 58 / 21 | counterattack 2880, magic-counter 3703; SOS 4027 |
| trema | 6 | 262 (52.4 to 52.4 percent) | 436 | 159.2 | 260.2 | 9.1 | 1.6 | 262 / 0 / 0 / 238 | none; SOS 569 |
| den-of-woe | 12 | 498 to 500 (99.6 to 100.0 percent) | 500 | 39 to 36.1 | 51.5 to 47.1 | 1 to 0.9 | 0 | 498 / 0 / 2 / 0 | counterattack 1177, magic-counter 171; SOS 69 |
| ixion-djose | 12 | 490 to 499 (98.0 to 99.8 percent) | 490 to 499 | 44.4 to 39.5 | 60.3 to 53 | 2 to 1.6 | 0.5 to 0.2 | 489 / 1 / 10 / 0 | counterattack 799, magic-counter 799; SOS 1087 |

`bangles`, base to after (a single number: unchanged). "Paired" counts the same seed: won both / won before and lost after / lost before and won after / lost both.

| Chapter | wins of 12 | wins of 500 | link 1 won (500) | party turns | engine turns | minutes | party KOs | paired (500) | counters played / SOS sets switched on (after, 500) |
|---|---|---|---|---|---|---|---|---|---|
| bahamut | 12 | 500 (100.0 to 100.0 percent) | 500 | 43.9 | 55.8 | 1.1 | 0 | 500 / 0 / 0 / 0 | none; SOS 192 |
| vegnagun-shuyin | 11 to 12 | 425 to 442 (85.0 to 88.4 percent) | 500 | 124.4 to 127.9 | 210.5 to 216 | 4.3 to 4.5 | 2 to 1.8 | 419 / 6 / 23 / 52 | none; SOS 2700 |
| leblanc | 12 | 500 (100.0 to 100.0 percent) | 500 | 67.5 to 67.6 | 93 to 93.2 | 1.9 | 0.7 | 500 / 0 / 0 / 0 | none; SOS 872 |
| fallen-aeons | 11 to 12 | 496 to 499 (99.2 to 99.8 percent) | 500 | 68.5 to 68.3 | 105.1 to 104.5 | 3 to 2.9 | 0.2 to 0.1 | 496 / 0 / 3 / 1 | none; SOS 1683 |
| trema | 0 | 25 to 29 (5.0 to 5.8 percent) | 36 to 39 | 74 to 75.7 | 127.7 to 130.7 | 4.1 to 4.2 | 3 | 23 / 2 / 6 / 469 | none; SOS 1344 |
| den-of-woe | 11 to 12 | 491 to 498 (98.2 to 99.6 percent) | 500 | 44.4 to 44.3 | 65.4 to 65.1 | 1.3 | 0.6 to 0.5 | 490 / 1 / 8 / 1 | none; SOS 1493 |
| ixion-djose | 12 | 500 (100.0 to 100.0 percent) | 500 | 27 | 37.2 | 1.1 | 0 | 500 / 0 / 0 / 0 | none; SOS 910 |

**3. Causes of the movers (ablation, 500 seeds).** Each switch turns one piece of the lane off in a scratch copy of the tree (never committed); the base and the full lane are the rows above.

`berserker` (NOCOUNTER: no counter is ever queued; NOMISSCTR: a miss reaches no counter check; NOEVADE: Evade & Counter forces no miss):

| Chapter | base: wins / party turns | all on: wins / party turns | NOCOUNTER: wins / party turns | NOMISSCTR: wins / party turns | NOEVADE: wins / party turns |
|---|---|---|---|---|---|
| vegnagun-shuyin | 476 / 149.2 | 484 / 134.5 | 476 / 149.7 | 484 / 138.5 | 484 / 134.6 |
| fallen-aeons | 465 / 129.3 | 496 / 127.4 | 464 / 129.1 | 495 / 140.7 | 492 / 129.1 |
| trema | 291 / 173.4 | 327 / 165.5 | 291 / 173.4 | 301 / 164.7 | 327 / 165.5 |

`mixed` (NOCOUNTER: no counter is queued, the SOS statuses stay, and Evade & Counter's forced miss stays; NOSOSROWS: the girls hold no SOS row, so the counters stay alone):

| Chapter | base: wins / party turns | all on: wins / party turns | NOCOUNTER: wins / party turns | NOSOSROWS: wins / party turns |
|---|---|---|---|---|
| vegnagun-shuyin | 393 / 165.8 | 417 / 162.6 | 396 / 166.9 | 414 / 162.7 |
| fallen-aeons | 421 / 130.7 | 464 / 145.7 | 455 / 134.3 | 458 / 147 |
| den-of-woe | 498 / 39 | 500 / 36.1 | 500 / 38.5 | 500 / 36.2 |
| ixion-djose | 490 / 44.4 | 499 / 39.5 | 495 / 42.7 | 496 / 40.6 |

`bangles` (NOSOSROWS: the three accessories' SOS rows are dropped from every list, so the layer exists but holds nothing):

| Chapter | base: wins / party turns | all on: wins / party turns | NOSOSROWS: wins / party turns |
|---|---|---|---|
| vegnagun-shuyin | 425 / 124.4 | 442 / 127.9 | 425 / 124.4 |
| fallen-aeons | 496 / 68.5 | 499 / 68.3 | 496 / 68.5 |
| trema | 25 / 74 | 29 / 75.7 | 25 / 74 |
| den-of-woe | 491 / 44.4 | 498 / 44.3 | 491 / 44.4 |

**4. Causes, mover by mover.**

* **`berserker` is the counters, nothing else.** With no counter ever queued (NOCOUNTER) the build returns to the base in Vegnagun and Shuyin (476) and Trema (291) and is one win short in Fallen Aeons (464 against 465: Evade & Counter's no-roll miss is still on in that row); with that forced miss off as well (NOCOUNTER and NOEVADE together, run on Vegnagun and Shuyin and on Fallen Aeons) the build equals the base **per seed and in every sum**, so nothing else in the lane touches a berserker line. Each counter is a free extra Attack at the attacker (6,876 and 2,908 of them over 500 Vegnagun and Shuyin chains; 5,058 and 6,199 in Fallen Aeons; 13,636 in Trema, about 27 a chain), so enemies fall sooner and the girls take fewer blows: party turns, engine turns and party KOs all drop (Fallen Aeons KOs 0.5 to 0.1, Trema 1.4 to 1.2). Chapters that were already 100 percent shorten by about a quarter (party turns: Leblanc 52.7 to 39.3, Den of Woe 36.1 to 26.7, Ixion and Djose 40.5 to 29.2; Bahamut by 5 percent). The wins that move, per piece: **a miss answered** (the engine's reading, open item 1) is worth 0 in Vegnagun and Shuyin (484 either way), 1 in Fallen Aeons (495 against 496) and 26 of Trema's 36 (301 against 327); **Evade & Counter's forced miss** is worth 4 in Fallen Aeons (492) and nothing elsewhere. In Trema the paired seeds are 218 won both ways, 73 won before and lost after, 109 lost before and won after, 100 lost both: a counter shifts every later draw of a seed, so single seeds flip in both directions, and the net is +36 of 500. Link 1 of the Trema chain (Paragon) stays at 457 and 455, so the lift is in the later links.
* **`mixed` is both halves.** Fallen Aeons 421 to 464: counters alone (the girls hold no SOS row) 458, SOS alone (no counter queued) 455, both 464. Vegnagun and Shuyin 393 to 417: counters alone 414, SOS alone 396. Ixion and Djose 490 to 499: 496 and 495. Den of Woe 498 to 500. The SOS half that moves a number is Paine's SOS Protect; Rikku's SOS Critical comes on (the SOS counts above) but changes nothing, because nothing in the build reads the Critical status (open item 8). Fallen Aeons runs longer after (party turns 130.7 to 145.7) because chains that used to end in a loss now play on to the win.
* **`mixed` on Trema is identical to the base, seed for seed** (262 of 500 both ways, every sum equal): the chapter's intended strategy changes Yuna and Paine to Dark Knight on their first turns, so the Berserker counters and the Warrior's SOS Protect are gone before a blow lands on them (seen with a single-seed run: two `spherechange` events to Dark Knight, no counter event), and Rikku's SOS Critical is the one SOS row left, which moves nothing. This is the strategy, not a hole in the layer.
* **`bangles` is the SOS statuses and nothing else, exactly.** With the three accessories' SOS rows dropped (NOSOSROWS) the layer still exists but holds nothing, and every chapter equals the base **per seed and in every sum** (Vegnagun and Shuyin 425, Fallen Aeons 496, Trema 25, Den of Woe 491): building a layer moves no draw and no event. With the rows, Vegnagun and Shuyin 425 to 442, Den of Woe 491 to 498, Fallen Aeons 496 to 499, Trema 25 to 29 (this loadout wins Trema 5 percent of the time, with or without the lane): the Wall Ring's Shell and Protect, the Regen Bangle's Regen and the Haste Bangle's Haste while a girl is under a third. The fast chapters barely move (Bahamut: +5 party turns, +0.09 minutes over 500 seeds).
* **The shipped line does not move** (section 1): no girl of a shipped build holds a row, so no layer is made, no draw is taken and no event is added.
* **What the measurement cannot show**: the shipped builds' players can reach the counters and the dresspheres' SOS rows only by spending AP on the Berserker, Warrior and Samurai; the variants above play that as if it had been done. The strategy used is the chapters' intended one (it changes dress, which sheds some loadouts, as in Trema); nothing was tuned to the lane.


## What the release driver would need

No new screen. What a player sees: a status icon appears and goes (Protect, Critical, Haste, Regen, Shell ...) as a girl crosses a third of her HP; a Berserker's counter plays the existing `counter` pose and lunge (the parry cue in voiced chapters) with her Attack banner; Evade & Counter shows the existing "evaded" miss. **Nothing in a shipped build equips an accessory of the list, but a player can reach the counters and the dresspheres' SOS rows by spending AP on the owned Berserker, Warrior and Samurai** (Chapter V's and the Via Infinito builds own them). A girl's counter has never been seen in the browser; before a build that gives a Berserker the abilities ships, look at one with the debug API (`window.__pyrefly`) or with `PYREFLY_X2D_VARIANT=berserker` of `tests/unit/ffx2-auto-measure.test.ts`.

## Stale text and mirrors

* `research/ffx2-combat-core.md` 1155 and 3078 (Cat Nip: the game's accessory lists only the SOS row, so nothing is permanent), 1464 to 1466 ("does not trigger on hit-all attacks": the test is the command ROW's multi-target and self-only bits, not the player's all-targets choice; a single-target spell the player casts on every enemy still counters; "attempt to evade": not a roll, a forced miss). Player-facing wording is Bailey's; not rewritten.
* `src/data/ffx2/abilities/berserker.ts` still marks the three counters `passive`; nothing reads that marker (the layer reads the ability ids), the help formatter and the Scan filter still do.
* The advisor and the enemy-intent panel run the real engine on clones, so they follow; the intent preview's resolve context has no counter queue, so a preview of an enemy swing shows no counter. Nothing stale found in `tools/` or `critic/`.

## Open items

1. **Whether a miss reaches the counter check** is the engine's reading of two notes (`constants.ts#COUNTER_AFTER_MISS`, on): FFX2-G04 open question 4 says the miss path "was not traced"; the AI note says the applier runs for a miss. One live check settles it: an Evade & Counter girl, one enemy swing at her that misses, does a counter follow? The ablation in "Measurement" shows what it is worth (Trema, all three girls Berserker: 327 wins of 500 with it, 301 without).
2. **A queued counter costs her no gauge** (an `[estimate]`): the note does not say. A live look (does her ATB bar move when her counter plays?) settles it.
3. **Findings still only decompiled, and why** (all FFX-2 only): the Berserker's own Auto-Regen and Lady Luck's SOS Spellspring (the engine has no ability by those names to learn, so there is nothing to pair a row to), the Festivalist's three SOS abilities and the Psychic dressphere (the engine has no ability table for them), the 10 garment grids that keep a status or an SOS set (the engine lays gates as colours, the game as numbered gate slots with conditions, a grid-lane job), Double HP and Double MP (stat doublers, the stats lane's), the rows that are a ward, a weapon touch or a cast-speed entry (status and menu lanes). 3.3's other callers (a script setting HP, the script rebuild handler, the forced copy after a script revive) have no engine script doing it today; 3.7 and 3.8 (the party script, the player-side monsters 15 to 22) have no counterpart in the five chapters.
4. **XD5's remainder**: Paragon's immediate-counter OFF option keeps its owner decision (D-146 / TR12 = b); nothing here changes it.
5. **XD6**: Shuyin's Spellspring (and his four MP costs) not built: it changes only a Spellspring icon on Shuyin today.
6. **The intent preview and the advisor**: they run the real engine on clones and so follow the layer, but the intent preview's resolve context has no counter queue, so a preview of an enemy swing shows no counter.
7. **The first browser look at a girl's counter**: it reuses the existing `counter` pose and lunge (the parry cue in voiced chapters) with her Attack banner but has never been seen on a screen; look at one with `PYREFLY_X2D_VARIANT=berserker` of `tests/unit/ffx2-auto-measure.test.ts` or the debug API before a build gives a Berserker the abilities.
8. **`Critical` has no battle effect of its own in the build today**: nothing reads the status (the game's Daredevil does). The layer puts it on and takes it off correctly (proved), and that is all it can do until something reads it; Samurai's SOS Critical therefore moves no measurement by itself (see "mixed" in "Measurement").
9. **Stale text**: listed in "Stale text and mirrors".

## Decisions for Bailey

1. **A miss and the counter** (open item 1): keep the engine's reading (a miss reaches the counter check: Counterattack and Evade & Counter answer it) or switch it off (`COUNTER_AFTER_MISS = false`) until a live check. Recommendation: keep it on (two notes agree on the applier; the check has no hit test of its own), and have the live check done when a driver is at the game.
2. **Content the engine lacks** (open item 3): the Berserker's own Auto-Regen, Lady Luck's SOS Spellspring, the Festivalist, the Psychic dressphere, the 10 grids. These are the game's own rows and not new design, but adding abilities and a dressphere to the build is new content (hard rule 10). Recommendation: the Auto-Regen and the SOS Spellspring when those abilities are added to their dresspheres' tables; the Festivalist and the grids with a grid or menu lane that has its own mockup.
3. **Shuyin's Spellspring** (XD6): skip until his four commands get their MP costs (it changes only an icon today). Recommendation: skip.
4. **Player-facing wording**: `research/ffx2-combat-core.md` says Cat Nip is permanent (the game's accessory lists only the SOS row), that a counter "does not trigger on hit-all attacks" (the game's test is the command row's multi-target bits, so a single-target spell cast at every enemy still counters), and that Evade & Counter "attempts to evade" (it is a forced miss, no roll). Whether the in-game help says the same is Bailey's wording. Recommendation: correct the notes now, and the help text when he next reviews it.
5. **For information, no decision**: when a player masters the three counters, the fights get shorter and the girls fall less (the measurement: Fallen Aeons 93.0 to 99.2 percent of 500, Trema 58.2 to 65.4 with three Berserkers). That is parity with the game, not a tuning; no boss or party number was touched.

## Re-run

From the worktree root (`D:\Final Fantasy\.claude\worktrees\re-parity-ai-ffx2-b`), Git Bash, tools by path, `TEMP` and `TMP` on `D:`:

```
export TEMP=D:/Tools/ffx-parity/tmp TMP=D:/Tools/ffx-parity/tmp
node "D:/Final Fantasy/node_modules/typescript/bin/tsc" --noEmit
node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run --maxWorkers=2 tests/unit/parity-ffx2-auto-layer.test.ts tests/unit/parity-ffx2-auto-engine.test.ts tests/unit/parity-ffx2-auto-sources.test.ts tests/unit/parity-ffx2-auto-clock.test.ts tests/unit/ffx2-atb-golden.test.ts tests/unit/chapters/den-of-woe-carry.test.ts tests/unit/ffx-engine-golden.test.ts tests/unit/ff7-golden.test.ts
node tools/orphans.mjs
```

The measurement (one chapter set, one variant; the same file runs on the base commit, where the counters are 0): `PYREFLY_MEASURE=1 PYREFLY_MEASURE_SEEDS=500 PYREFLY_X2D_VARIANT=berserker|mixed|bangles PYREFLY_MEASURE_CHAPTERS=ffx2-trema PYREFLY_MEASURE_OUT=<file> node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run --maxWorkers=1 tests/unit/ffx2-auto-measure.test.ts`, and for the shipped line `PYREFLY_MEASURE=1 PYREFLY_MEASURE_SEEDS=500 ... tests/unit/ffx2-parity-measure.test.ts`. The ablation switches were scratch edits (a copy of `src` and `tests` under `D:\Tools\ffx-parity\x2d\abl`, never committed) read from `PYREFLY_ABL`: `NOCOUNTER`, `NOMISSCTR`, `NOEVADE`, `NOSOS`. The mutation pass: `python D:\Tools\ffx-parity\x2d\mut.py` (one fault at a time; restores each file in a `finally`).

## CHANGELOG paragraph

**FFX-2 only.** The girls' automatic abilities now work the way the game's do. An accessory or dressphere ability that keeps a status on her for good (the Moon, Shining, Defense, Star, Recovery and Speed Bracers, Adamantite, Ragnarok, Bloodlust, Wring, Minerva's Plate, Shmooth Shailing, Lady Luck's Critical, the Mascot's Auto-Shell and Auto-Protect) now puts it on and keeps it, out of a Dispel's reach, and the SOS abilities (Warrior's SOS Protect, Samurai's SOS Critical, the Wall Ring, the Regen and Haste Bangles, Cat Nip) switch their statuses on when her HP drops under a third and off when she is healed past it, announced like any other status. The Berserker's Counterattack, Magic Counter and Evade & Counter, which did nothing until now, answer a blow with her own Attack at the attacker (Evade & Counter makes a physical swing miss her outright, with no roll). Nothing a shipped build wears uses these yet, so the chapters play exactly as before until a player masters the abilities or wears the accessories; with them, the fights get shorter and the girls fall less often.
