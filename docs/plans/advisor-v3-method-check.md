# Advisor v3: method check and scorecard

Written 2026-09-27 on branch `advisor-v3` (from main 340a750e). Rule 15 method check: the advisor
has been rebuilt twice for the same complaint, so this is written before a third attempt is built.
No product code changed in this step.

> **Bailey, 2026-09-27:** *"yes the advisor needs to be WAY WAY smarter please. it also needs to
> understand that if i select mega potion for example and executed that command then it needs to
> know that the mega potion is in progress so it shouldn't still tell me to mega potion."*

**Game case (rule 14).** "Smarter" is **both** FFX and FFX-2: it is a property of the advice, and
every defect below has an FFX or an FFX-2 instance or both. "A command in progress" is **FFX-2
only**: ATB lets a second girl's menu open while the first girl's command is still on its purple
charge bar or held for a chain lock [research/ffx2-combat-core.md §1.1, §1.3], while FFX's CTB
resolves a chosen command before the next turn opens [research/ffx-combat-core.md §1.1]. The FF7
HUD shows no advisor today (`buildAdvisorView` returns `null` for `ff7`), so FF7 is left alone.

---

## 1. Bailey's case, reproduced by running the engines

Scratch vitest (`tests/unit/zz-scratch/advisor-v3-repro.test.ts`, not committed). Every listed
FFX-2 chapter, seeds 1 to 20, a player who follows the card at human pace; the first time the
trigger holds, the girl is made to press the named command, and the next **other** girl's card is
read while that command is still charging.

| Forced command | Forced | Next menu opened while it still charged | Resolved before the next menu |
|---|---:|---:|---:|
| Mega-Potion (two or more girls under 75 %) | 80 | 50 | 30 |
| Phoenix Down on a fallen girl | 63 | 32 | 31 |
| One heal (Hi-Potion, Cura...) on the lowest girl | 117 | 80 | 37 |

What the card said, and what it read:

- **Mega-Potion charging, the next card names another party heal.** Chapter V seed 1: Paine is
  charging Mega-Potion; Yuna's card says **Mega-Potion -> the party, "Yuna is one hit from down"**.
  Yuna is at 218 / 2 488 with **+1 992 already on its way**. The card *sees* the Mega-Potion
  (`committedByAllies` records `uses: x2-mega-potion x1`) but does nothing with it: HP healing is
  deliberately not "covered" (`advisor-committed.ts`: "a second Hi-Potion still adds HP"), and the
  simulation, the forecast and the reason all read the HP as it stands, not as it will be. Other
  seeds name Megalixir -> the party with "Paine lives through Tail Beam" on HP the pending
  Mega-Potion already restores.
- **Phoenix Down held, the next card raises the same girl.** Chapter V seeds 6 and 7: Paine's
  Phoenix Down is **held** (a chain lock, `FFX2Engine.heldCommand()`); Yuna's card says **Life ->
  Rikku, "Stands Rikku back up"**. `committedByAllies` is empty because the live HUD never passes
  `AdvisorOptions.queued` (`FFX2BattleHud`'s `advisor` option passes the registries only). The
  on-the-bar case works: a charging Phoenix Down is seen and the raise is not repeated.
- **One heal charging**: the next card heals the same girl again (Cura -> Yuna while Rikku's Potion
  on Yuna charges), which is not wasted (a Potion does not fill her), so it is not a duplicate by
  the strict reading; it is still priced on HP that is about to change.

**The Chapter XI Sisters (iter2-b6's finding), reproduced.** Sisters alone (= the FA3 retry), card
follower, human pace, 40 seeds: 33 / 40 wins; **130 decisions with Yuna down, a raise on the menu
in all 130, the card's top row raises in 0.** `reviveRisk` refuses none of them and the card prints
no note. The raise is always there, as the **runner-up**: *Mega Phoenix -> the party*, priced at
3 744 to 19 070, under a top row priced at -1 007 to 18 331. The top row is always the chapter's own
line (`source: 'tactic'`): `ffx2-fallen-aeons.ts` revives only on **Yuna's** turn ("yunaTurn",
Mega Phoenix / Phoenix Down / Life), so when Yuna is the one down the line never raises anybody, and
the v2 prior keeps the line on top unless a challenger proves `saves-from-lethal`. A player (and
every bench) presses the top row.

## 2. The scorecard (committed) and the v2 baseline

`critic/bench/advisor-v3/` (`drive.ts`, `metrics.ts`, `scorecard.test.ts`, `vitest.config.ts`):

```
npx vitest run --config critic/bench/advisor-v3/vitest.config.ts
SCORECARD_SEEDS=40 SCORECARD_DRIVERS=card,intended SCORECARD_TAG=baseline-v2   (the run below)
```

Every listed FFX and FFX-2 chapter from its registered record through its whole chain
(`setupForChapter`, `setupForNextLink`), engines built as the app builds them for an automated run.
**FFX-2 at the house human pace**: Wait split, 1.5 s a menu, 0.5 s on the top list with the clock
running, 1.0 s held (`docs/plans/fallen-aeons-bench.md`). The card is read when the menu opens (as
`MoveAdvisor.showDecision` does) with the options the live HUD passes, and its top row is pressed.
Readings (definitions in `metrics.ts`): **dup strict** = a support-only top row whose every effect
(heal to full, raise, ally status) a pending command already delivers; **dup same** = a support top
row with the same kind and id as a pending command (Bailey's words); **missed revive** = an ally
down, nothing pending raises them, a row raises them, the top row raises nobody (and the subset
**while losing**: living party HP fraction below the enemies'); **not on menu / bad aim**;
**lethal-save miss** = the forecast kills a living ally, some row keeps them alive
(`evaluate`'s `saves-from-lethal`), the top row does not. A purity test runs first: the same seeds
with the readings on and off end on the same log. Raw: `results-baseline-v2.json`. 5.5 minutes.

| Chapter | Game | Card wins | Line wins | Dup strict / pending decisions | Dup same | Missed revive / raise on menu (while losing) | Miss had the raise as runner-up / a note | Lost runs with a missed revive | Lethal: missed / savable / threats |
|---|---|---:|---:|---|---:|---|---|---:|---|
| I Seymour Flux | FFX | 22/40 | 17/40 | n/a | n/a | 450 / 548 (237) | 11 / 441 | 18 of 18 | 0 / 99 / 234 |
| II Yunalesca | FFX | 37/40 | 39/40 | n/a | n/a | 4 / 459 (3) | 0 / 4 | 1 of 3 | 0 / 0 / 945 |
| III Braska's Final Aeon | FFX | 39/40 | 39/40 | n/a | n/a | 8 / 14 (6) | 2 / 6 | 1 of 1 | 1 / 24 / 136 |
| IV Bahamut | FFX-2 | 40/40 | 40/40 | 0 / 908 | 0 | 0 / 0 | - | 0 | 0 / 0 / 0 |
| V Vegnagun | FFX-2 | 37/40 | 37/40 | **140 / 2 803** | **145** | 4 / 236 (2) | 2 / 2 | 2 of 3 | 29 / 349 / 349 |
| VI Leblanc | FFX-2 | 33/40 | 24/40 | **387 / 1 378** | **617** | 23 / 120 (19) | 12 / 11 | 3 of 7 | 23 / 269 / 364 |
| VII Anima, Macalania | FFX | 37/40 | 38/40 | n/a | n/a | 16 / 59 (9) | 12 / 4 | 2 of 3 | 21 / 111 / 542 |
| VIII Evrae | FFX | 40/40 | 40/40 | n/a | n/a | 1 / 36 (0) | 1 / 0 | 0 | 0 / 84 / 135 |
| IX Yojimbo | FFX | 40/40 | 33/40 | n/a | n/a | 2 / 18 (0) | 2 / 0 | 0 | 2 / 10 / 10 |
| X Natus | FFX | 36/40 | 37/40 | n/a | n/a | 1 / 13 (1) | 1 / 0 | 0 of 4 | 0 / 142 / 435 |
| XI Fallen Aeons | FFX-2 | 33/40 | 34/40 | 33 / 1 188 | 33 | **113 / 122 (38)** | **113 / 0** | **7 of 7** | 1 / 40 / 40 |
| XII Omnis | FFX | 25/40 | 27/40 | n/a | n/a | 188 / 395 (103) | 128 / 60 | 15 of 15 | 14 / 833 / 873 |
| XIII Trema | FFX-2 | 0/40 | 0/40 | 6 / 444 | 4 | 1 / 16 (0) | 1 / 0 | 1 of 40 | 0 / 2 / 2 |
| XIV Isaaru | FFX | **16/40** | **28/40** | n/a | n/a | 0 / 0 | - | 0 | 0 / 0 / 198 |
| XV Den of Woe | FFX-2 | 8/40 | 7/40 | 28 / 661 | 14 | 22 / 70 (21) | 21 / 1 | 14 of 32 | 8 / 51 / 51 |

Not on the menu and bad aim: **0 everywhere** (FOC22-02's fix holds). Fallbacks (a card with nothing
to press): 0 everywhere. Decision cost p50 / p95: 1.2 to 6.7 ms / 2.0 to 13.4 ms.

What the census says (`dup` pending -> top row, 40 seeds):

- **VI Leblanc**: Hi-Potion -> Hi-Potion x273, Potion -> Potion x158, two Hi-Potions -> a third x104.
  28 % of every decision with a command in flight names a heal that is already fully delivered.
- **V Vegnagun**: Mega-Potion -> Mega-Potion x52, X-Potion -> X-Potion x29, two Mega-Potions -> a
  third x14, Megalixir -> Megalixir x14. Bailey's report, 145 times in 40 runs.
- **XI**: 113 of 122 raise chances missed, every one with the raise as runner-up, and **all 7
  losses** carried one. **XII Omnis** and **XV Den of Woe** show the same shape (128 and 21 misses
  with the raise as runner-up).
- **I Seymour Flux**: 441 of 450 misses print a note: the card *refused* the raise under Bailey's
  2026-09-21 rules (the board kills them again at once). That is by rule, not a defect of this
  kind, and stays.
- **XIV Isaaru**: the card loses 12 more seeds than the chapter's own line, with no duplicate, no
  missed revive and no lethal miss: a strategy gap no per-turn rule names.

## 3. The current route, and why it stalled twice

The advisor is a **one-decision ranker with a pinned prior**: every legal row is resolved once on
the engine's own throwaway copy (`simulate*Command`), scored by a hand-weighted sum
(`scoreOutcome`: damage, kills, heals that prevent a KO, cures, minus MP...), adjusted by a 1.5-ply
term (the enemy's next telegraphed action applied to the HP our move leaves, `advisor-eval.ts`),
and the chapter's own line (`intendedStrategy`) is kept on top unless a challenger proves one fact,
`saves-from-lethal`. Rules then filter and reorder: the inert band, the Zombie guard, the committed
reading, the menu gate, the revive runner-up and its note.

It stalled twice for the same structural reason, and the scorecard shows it a third time:

1. **2026-09-18 to 09-21 (fix3, four passes; then v2):** each defect Bailey named (Poison Fang for
   Tidus, a KO'd Yuna ignored, "not aware turn by turn") was answered with a new rule or weight on
   the one-ply score. Each fix held for its named board and interacted with the prior: v2's own
   bench found a bare score override took Chapter 1 from 25 wins to 4, so the override was gated on
   one fact, which is exactly why the XI raise (priced 19 070) sits under a line priced -1 007.
2. **2026-09-22 to 09-27 (patches on v2):** PR-0088 added the committed reading (statuses, raises,
   stock) but not HP; the held command was added to the API and never wired; dedc7a08's FFX-2 revive
   weight measured **zero** change (XI 34/40 before and after) because the prior, not the weight,
   decides the top row.

The root cause is the **horizon and the state**, not a missing weight: the card asks "what does this
one press do to the board as it stands", while every open defect is about what happens *next* (the
heal already on its way, the healer who will not be raised by the line, the Isaaru fight lost over
many turns). The v2 handoff recorded why it stopped at 1.5 plies: "neither engine exposes a fork".
**That premise no longer holds; see §4.**

## 4. The fork, measured (feasibility for B and C)

Scratch probe (`tests/unit/zz-scratch/advisor-v3-fork-probe.test.ts`): a fork of each engine made
from outside with **one `structuredClone` of the engine's mutable bundle** (FFX: `ctx.state` +
`ctx.rt`; FFX-2: `battleState`, `units`, `gridNodes`, `drafts`, `held` + the menu-cancel stacks),
registries shared read-only, a **new `SeededRng`** of its own. Chapters I, III, V and XI, seeds 1 to
3, the chapter's line as the policy:

| Check | Result |
|---|---|
| **Fidelity**: a fork given a copy of the battle's RNG state, played to the end of the link, ends on the real run's log, byte for byte | 32 of 32 forks (I 8, III 9, V 8, XI 7) |
| **Purity**: the real run with a fork (and an 8-decision rollout) at every decision ends on the same log as the run without | all 12 runs |
| **Determinism**: two forks with the same search seed agree | 694 of 694 |
| **Cost** | fork 0.7 to 1.4 ms; an 8-decision rollout 1.5 to 2.5 ms |

A first attempt that reused `ffx/intent.ts#cloneCtx` failed fidelity (7 of 8 and 9 of 9 bad in
FFX) and determinism (24 bad): `cloneCtx` is a dry-run copy that shares the log and some runtime
objects (the aeon roster's combatants). One clone of the whole bundle fixes it, because
`structuredClone` keeps the aliasing between the runtime and the state. A real `fork(seed)` belongs
on each engine class in `src/battle/**` (additive, not on the `BattleEngine` facade, so not a
contract change), with the fidelity, purity and determinism checks above as its tests.

## 5. The alternatives, and the smallest test that tells them apart

- **(A) Targeted rule fixes.** A pending-action ledger (every charging and held command resolved on
  a copy first, so the card reasons on the HP, statuses, raises and stock *after* what is already
  in flight; wire `queued` in the FFX-2 HUD) and a revive priority (a raise the card itself priced
  higher than the line, for an ally the line will not raise, goes on top unless Bailey's refusal
  rule speaks). Cheap, per-turn, fixes both named defects. Does not touch Isaaru-type gaps.
- **(B) Short-horizon search.** For each of a handful of candidate rows, fork the engine, press it,
  play the next few decisions with the chapter's own line as the default policy (FFX: the known CTB
  order; FFX-2: every committed and charging command plus the ATB clock at human pace, which the
  fork carries for free), over two search seeds with common random numbers; score survival, the
  damage race and a link won or lost. Sees the in-flight Mega-Potion because the fork resolves it.
- **(C) Hybrid.** B, inside rails: only menu-legal rows; no duplicate of a pending command; Bailey's
  2026-09-21 rules kept (a refused revive stays refused; a `saves-from-lethal` top row is kept
  without search); the chapter's line always a candidate.

**The smallest test that tells them apart:** the scorecard on four chapters that each isolate one
failure: **XI** (missed revive), **VI Leblanc** and **V** (duplicates), **XIV Isaaru** (a strategy
gap no rule names), plus **I** and **III** as the FFX regression guard (I is Bailey's refusal rule,
III is won by a 40 % Slow that a median-roll search could undervalue). Prototype *policies* of A and
C (scratch, `tests/unit/zz-scratch/advisor-v3-proto.test.ts`; C with 10 candidates, 2 search seeds,
6 decisions deep) on 10 seeds, the same human pace; "pressed" columns count what the driver
actually pressed:

| Chapter | Driver | Wins | Links (avg) | Dup pressed | Missed revive pressed | Lethal miss pressed | ms a decision* |
|---|---|---:|---:|---:|---:|---:|---:|
| XI Fallen Aeons (FFX-2) | v2 card | 7/10 | 2.40 | 7 | 59 | 0 | 9.0 |
| | A | **10/10** | 3.00 | 0 | 0 | 2 | 11.2 |
| | C | **10/10** | 3.00 | 3 | 52 | 0 | 56.8 |
| VI Leblanc (FFX-2) | v2 card | 8/10 | 2.80 | 184 | 15 | 6 | 8.8 |
| | A | 9/10 | 2.90 | 0 | 0 | **25** | 12.6 |
| | C | 7/10 | 2.70 | 19 | 51 | 4 | 97.7 |
| V Vegnagun (FFX-2) | v2 card | 10/10 | 5.00 | 37 | 0 | 7 | 6.8 |
| | A | 10/10 | 5.00 | 6 | 0 | **17** | 11.7 |
| | C | **4/10** | 2.40 | 12 | 63 | 2 | 43.0 |
| XIV Isaaru (FFX) | v2 card | 3/10 | 2.30 | 0 | 0 | 0 | 1.8 |
| | A | 3/10 | 2.30 | 0 | 0 | 0 | 2.9 |
| | C | **5/10** | 2.50 | 0 | 0 | 0 | 12.0 |
| I Seymour Flux (FFX) | v2 card | 7/10 | 0.70 | 0 | 122 | 0 | 5.5 |
| | A | 7/10 | 0.70 | 0 | 129 | 4 | 8.9 |
| | C | 5/10 | 0.50 | 0 | 49 | 0 | 30.4 |
| III Braska's Final Aeon (FFX) | v2 card | 10/10 | 7.00 | 0 | 0 | 0 | 7.8 |
| | A | 10/10 | 7.00 | 0 | 0 | 0 | 10.8 |
| | C | **1/10** | 0.70 | 0 | 35 | 0 | 44.7 |

\* Wall time per decision including the readings themselves (about 5 ms of it), on a loaded machine.

What the prototypes say:

- **A fixes both named defects**: XI 7 -> 10 of 10 with no missed raise, duplicates pressed on V and
  VI 221 -> 6, no FFX chapter moves. **But it raised lethal misses** on VI (6 -> 25) and V (7 -> 17):
  it drops a heal because one is "already on its way", and the one on its way often lands too late.
  Measured with the fork (`tests/unit/zz-scratch/advisor-v3-timing.test.ts`, 10 seeds, three search
  seeds per duplicate, the clock run with the menu on the top list until every pending command has
  landed): **an enemy acts before the pending command lands in 42 of 111 samples on V and 242 of 552
  on VI, and an ally is KO'd first in 51 of 111 on V.** So "in progress" cannot be read as "done":
  the ledger has to project the board to the moment the in-flight commands land, enemy actions in
  between included. The fork does exactly that (2 to 7 ms a projection).
- **C (a naive search) is not a safe primary.** It is the only driver that moves Isaaru (3 -> 5 of
  10), and it wins XI fast, but it **loses Chapter III (10 -> 1 of 10) and Chapter V (10 -> 4)** and
  costs 12 to 98 ms a decision against v2's 15 ms (FFX) / 8 ms (FFX-2) budget. III is won by landing
  a 40 % Slow twice and V by a long chain; a six-decision horizon on a hand-made score cannot see
  either. Making it safe is a scoring and horizon research track (chain-aware score, the enemy's next
  two actions as the horizon, the card itself as the rollout policy, a latency plan), not a fix.

## 6. The choice

**A, computed on the engine fork: the "projected board" ledger plus revive priority, with Bailey's
2026-09-21 rules as they are.** B's search stays a later, separate track that may only break a tie
under rails, and only after it stops losing Chapters III and V on this scorecard.

What gets built (both games unless marked):

1. **`fork(seed)` on both engines** (`src/battle/ffx`, `src/battle/ffx2`: one `structuredClone` of the
   mutable bundle, its own `SeededRng`, the registries shared read-only). Additive, not on the
   `BattleEngine` facade. Tests: the fidelity, purity and determinism checks of §4, and every
   engine golden (`tests/unit/ffx2-atb-golden.test.ts` and the FFX/FFX-2 suites) byte-identical,
   because nothing in a battle calls it.
2. **The projected board (FFX-2 only).** Before the card ranks anything, a fork runs the clock with
   the menu on the top list until every charging and held command has landed (or the girl's menu
   would close), across two or three search seeds, and the card ranks on that board: the HP after
   the Mega-Potion, the girl the Phoenix Down stands up, the item count after the pending use, and
   the enemy hits that land first. A heal is a duplicate only when the projection shows it is not
   needed; when the enemy lands first, the second heal stays. FFX boards never carry a pending
   command, so this is a no-op there (asserted, as `advisor-committed.test.ts` does today).
3. **Wire the held command** (`AdvisorOptions.queued`, FFX-2 only): the presenter hands the HUD a
   read-only engine source, which the fork needs anyway.
4. **Revive priority** (both): when an active ally is down, nothing pending raises them, the
   chapter's line has no raise for them this turn, the card priced a raise above the line, and
   Bailey's refusal rule does not speak, the raise goes on top. The refused revive, the
   saves-from-lethal first and "only rows the menu offers" stay exactly as they are.

**Expected gain** (scorecard, 40 seeds, against `results-baseline-v2.json`): XI 33 -> 38 to 40 of 40
(the prototype went 7 -> 10 of 10; all 7 baseline losses carried a missed raise); VI 33 -> about 35;
duplicates 594 strict / 813 same-move across the FFX-2 chapters -> near 0, **with lethal misses no
higher than v2's** (V 29, VI 23, XV 8), which is the acceptance line the naive ledger failed;
missed revives on XI 113 -> 0, and on XII and XV (128 and 21 with the raise as runner-up) measured,
not assumed; every other chapter within one seed of its baseline, Chapters III and I included; p95
decision cost at most 25 ms. Not expected from A: Isaaru (16 of 40 against the line's 28), which is
the one open case for the later search track.

## 6a. Built and measured (2026-09-27, branch `advisor-v3`)

What was built differs from §6 in one place, and the difference was measured. The projection
first ran on through the enemy's turns until everything in flight had landed and ranked on the
worse of two sampled futures: on Chapter V (10 seeds) it lost 2 runs v2 won, once telling a girl a
*sampled* Tail Beam had KO'd to raise herself. The built projection runs the fork **until
everything in flight has landed or the next enemy moves, whichever is first** (one fixed seed; a
replay of the same fork to the step before the enemy moved). What landed is on the board the card
ranks; what did not is still in flight there, where the committed reading sees its cures, raises
and item use, and a new rule drops a support row that is **the same move** as one still in flight
(it cannot overtake it). Chapter V then went 10 of 10. The revive priority is built as §6 item 4,
including "the card priced the raise above the line"; the FFX-2 held command is read off the engine
(`engine` option), which the live HUD now passes.

**Scorecard, 40 seeds, v2 vs v3, same tree** (`SCORECARD_V3=0` / `1`; FFX-2 at Wait split 0.5 s top
/ 1.0 s held; raw `critic/bench/advisor-v3/results-v2-control.json`, `results-v3-run1.json`; the v2
control reproduces the baseline above exactly):

| Chapter | Game | Wins v2 → v3 | Dup strict / same v2 → v3 | Missed revive v2 → v3 | Lethal-save miss (current-board reading) v2 → v3 | p50 / p95 ms v2 → v3 |
|---|---|---|---|---|---|---|
| I Seymour Flux | FFX | 22 → 22 | n/a | 450 → 453 (441 → 449 refused with a note) | 0 → 0 | 3.4 / 4.8 → 3.5 / 4.6 |
| II Yunalesca | FFX | 37 → 37 | n/a | 4 → 4 | 0 → 0 | 2.0 / 3.0 → 1.9 / 2.9 |
| III Braska's Final Aeon | FFX | 39 → 39 | n/a | 8 → 8 | 1 → 1 | 4.3 / 6.9 → 4.3 / 6.4 |
| IV Bahamut | FFX-2 | 40 → 40 | 0 / 0 → 2 / 0 | 0 → 0 | 0 → 0 | 5.8 / 18.0 → 3.6 / 4.8 |
| V Vegnagun | FFX-2 | 37 → 37 | 140 / 145 → **25 / 14** | 4 → 3 | 29 → **97** | 6.2 / 12.2 → 6.1 / 11.3 |
| VI Leblanc | FFX-2 | 33 → **38** | 387 / 617 → **62 / 54** | 23 → 5 | 23 → **51** | 5.1 / 9.0 → 5.7 / 12.3 |
| VII Anima, Macalania | FFX | 37 → 37 | n/a | 16 → 16 | 21 → 21 | 2.5 / 5.0 → 2.5 / 5.1 |
| VIII Evrae | FFX | 40 → 40 | n/a | 1 → 1 | 0 → 0 | 1.8 / 2.7 → 1.8 / 2.7 |
| IX Yojimbo | FFX | 40 → 40 | n/a | 2 → 2 | 2 → 2 | 3.7 / 5.5 → 4.2 / 5.8 |
| X Natus | FFX | 36 → 36 | n/a | 1 → 1 | 0 → 0 | 2.7 / 4.1 → 2.7 / 4.3 |
| XI Fallen Aeons | FFX-2 | 33 → **37** | 33 / 33 → 9 / 2 | **113 → 5** | 1 → 8 | 5.8 / 9.9 → 4.5 / 7.4 |
| XII Omnis | FFX | 25 → 25 | n/a | 188 → 188 | 14 → 14 | 4.1 / 6.1 → 4.4 / 6.4 |
| XIII Trema | FFX-2 | 0 → 1 | 6 / 4 → 0 / 0 | 1 → 0 | 0 → 0 | 3.1 / 4.2 → 3.2 / 5.8 |
| XIV Isaaru | FFX | 16 → 16 | n/a | 0 → 0 | 0 → 0 | 0.8 / 1.3 → 0.9 / 1.5 |
| XV Den of Woe | FFX-2 | 8 → **12** | 28 / 14 → 16 / 5 | 22 → 12 | 8 → 28 | 3.8 / 5.3 → 4.1 / 5.8 |
| **All** | | **443 → 457 of 600** | **594 / 813 → 114 / 75** | | | worst p95 18.0 → 12.3 |

Better or equal on every chapter, better overall by 14 runs, so **`ADVISOR_V3` defaults ON**. Not on
the menu, bad aim, fallbacks: 0 everywhere. The purity check passes with the projection running.

**What did not go as §6 expected:**

- **The lethal-save reading went up** on the FFX-2 chapters (V 29 → 97, VI 23 → 51, XV 8 → 28): the
  acceptance line in §6 is **not met on this reading**. The reading prices every row as if it
  landed before the enemy, on the board as it stands; v3 ranks on the projected board. Classified on
  10 seeds (scratch): of V's 17 misses, 3 are safe once the charging command lands, 4 are still
  lethal after everything landed, and **10 are "the enemy moves before the charging heal lands"**;
  of VI's 9, 7 are safe on the projection. Wins did not drop anywhere (V 37 = 37, VI +5), which is
  the evidence the misses are mostly unsavable or already covered, but the 10 + 4 on V are the next
  thing to measure: whether any row the girl could press would land before that enemy move.
- **XII Omnis: 188 missed revives unchanged**, by the rails: every one sampled has a
  `saves-from-lethal` top row with the raise priced negative, or a refusal with a note (PR-0197).
- **XIV Isaaru** unchanged (16 against the line's 28), as §6 said: the later search track.
- Duplicates are not zero: most left are a different item for the same need (Hi-Potion charging ->
  Potion, Megalixir -> X-Potion) or the same single heal on a *different* girl (the census counts a
  same-id heal whoever it is aimed at; v3 drops it only on the same girl or the party). Bailey's
  exact case, the same move, fell from 813 to 75.

## 6b. Repair after the adversarial check (2026-09-27)

The check (docs/handoff/advisor-v3.md CHECK) held the branch on one blocker and four majors. All
five are fixed on this branch and proved by running the engine; details and probes in the handoff's
REPAIR section.

- **FB1** (Bailey's case after a projected landing): the same-move rule reads every command in
  flight on the **real** board, landed inside the projection or not (`advisor-v3.ts`
  `repeatsInFlight` / `alreadyOnItsWay`).
- **FM2** (ranking on a won battle): a projection whose fork ends the battle or link returns
  `null`; the v2 reading stands (`advisor-inflight.ts`).
- **FM3** (last item in flight): v2's stock rule runs on the real board again (`stockInFlight`).
- **FM4** (lethal saves): a saving row is pressed on 4 forks of the live battle with the top row and
  promoted when the girl lives in at least half the futures more (`advisor-lethal.ts`
  `provedSave`); when the enemy moves before what is in flight lands, the threat is read off the
  real board.
- **FM5** (guide NEXT): the strategy rail's NEXT drops the line's pick when another girl already
  charges the same support move (`guide-inflight.ts`); it then shows its existing idle line.

**Scorecard, 40 seeds, same tree** (`SCORECARD_V3=0/1`; FFX-2 at Wait split 0.5 s top / 1.0 s
held; raw `critic/bench/advisor-v3/results-v3-repair.json`, `results-v2-control-repair.json`; the
FFX-2 v2 control reproduces the baseline exactly and the FFX rows are untouched by every change):

| Chapter | Game | Wins v2 → v3 (575673ab) → **v3 repair** | Dup strict / same, v2 → repair | Missed revive v2 → repair | Lethal miss, arithmetic v2 → repair | Lethal miss, fork-tested v2 → repair |
|---|---|---|---|---|---|---|
| I Seymour Flux | FFX | 22 → 22 → **22** | n/a | 450 → 453 (449 with a note) | 0 → 0 | n/a |
| II Yunalesca | FFX | 37 → 37 → **37** | n/a | 4 → 4 | 0 → 0 | n/a |
| III Braska's Final Aeon | FFX | 39 → 39 → **39** | n/a | 8 → 8 | 1 → 1 | n/a |
| IV Bahamut | FFX-2 | 40 → 40 → **40** | 0 / 0 → 0 / 0 | 0 → 0 | 0 → 0 | 0 → 0 |
| V Vegnagun | FFX-2 | 37 → 37 → **36** | 140 / 145 → 28 / 9 | 4 → 5 | 29 → 97 | 0 → 2 |
| VI Leblanc | FFX-2 | 33 → 38 → **38** | 387 / 617 → 60 / 53 | 23 → 5 | 23 → 53 | 0 → 0 |
| VII Anima, Macalania | FFX | 37 → 37 → **37** | n/a | 16 → 16 | 21 → 21 | n/a |
| VIII Evrae | FFX | 40 → 40 → **40** | n/a | 1 → 1 | 0 → 0 | n/a |
| IX Yojimbo | FFX | 40 → 40 → **40** | n/a | 2 → 2 | 2 → 2 | n/a |
| X Natus | FFX | 36 → 36 → **36** | n/a | 1 → 1 | 0 → 0 | n/a |
| XI Fallen Aeons | FFX-2 | 33 → 37 → **37** | 33 / 33 → 6 / 1 | **113 → 5** | 1 → 7 | 0 → 0 |
| XII Omnis | FFX | 25 → 25 → **25** | n/a | 188 → 188 | 14 → 14 | n/a |
| XIII Trema | FFX-2 | 0 → 1 → **1** | 6 / 4 → 0 / 0 | 1 → 0 | 0 → 0 | 0 → 0 |
| XIV Isaaru | FFX | 16 → 16 → **16** | n/a | 0 → 0 | 0 → 0 | n/a |
| XV Den of Woe | FFX-2 | 8 → 12 → **9** | 28 / 14 → 13 / 9 | 22 → 13 | 8 → 26 | 1 → 0 |
| **All** | | **443 → 457 → 453 of 600** | **594 / 813 → 107 / 72** | | | **1 → 2** |

"Fork-tested" presses the top row and every row the arithmetic says saves the girl on 4 forks of
the live battle and runs to the enemy's hit; a miss is a saving row that keeps her alive in at
least half the futures more than the top row. The arithmetic column prices every row as if it
landed before the enemy, so it counts heals that cannot land in time; 170 of v3's 187 arithmetic
misses were "the top row does as well" on the forks.

**V and XV against v2, 120 seeds** (the same driver, scratch probe): V **111 vs 111**, XV **28 vs
29**. At 40 seeds V is one run short (36 vs 37): seed 26, traced by running both cards, parts ways
at decision 13, where **v2 advised a second Megalixir while Yuna's Megalixir was still charging**
(Bailey's case) and v3 advised X-Potion on Paine; that run later loses to a Noli Me Tangere. XV's
12 before the repair came from ranking on finished links (FM2): 28 vs 32 of 120 with and without
the guard, v2 29.

**Per decision, paired in the same process** (node, 10 seeds x 6 FFX-2 chapters, v2 and v3 on the
same board, alternating; p50 / p95 ms): IV 3.3 / 4.4 → 3.5 / 5.1, V 6.1 / 10.4 → 6.3 / 11.3,
VI 5.1 / 8.2 → 5.2 / 9.4, XI 5.8 / 10.0 → 5.9 / 10.2, XIII 3.8 / 5.5 → 3.8 / 5.5, XV 5.2 / 6.6 →
5.6 / 8.1: about 1.1x v2 at the p95 (the fork test runs only on a lethal forecast). In the
browser at 1600x900 the v3 card took 3.9 to 6.7 ms during the real-key check.

**Default.** `ADVISOR_V3` stays **ON**: better overall by 10 runs at 40 seeds, better or equal on
14 of 15 chapters, and V's one-run gap is the rule Bailey asked for, at parity over 120 seeds.
The method check's own bar (better or equal on every chapter at 40 seeds) is **not met on V by one
run**; the driver decides, and turning it off is one constant (`advisor-v3.ts`).

## 7. For Bailey

- Built on this branch (§6a): the card's *picks* change; no new line of text was added to it. A
  Mega-Potion on the way is no longer advised again, and the fallen White Mage at the Sisters is
  raised. Not merged into main; the handoff is `docs/handoff/advisor-v3.md`.
- The advisor card itself still has no approved target tile (rule 9): if v3 changes what the card
  *shows* (for example "Mega-Potion already on its way" as a line), that line gets options first.

## Files

```
critic/bench/advisor-v3/drive.ts               the chapter driver (both games, FFX-2 human pace)
critic/bench/advisor-v3/metrics.ts             the five readings
critic/bench/advisor-v3/scorecard.test.ts      the runner, purity check, table, JSON
critic/bench/advisor-v3/vitest.config.ts       runs it outside npm test
critic/bench/advisor-v3/results-baseline-v2.json  the baseline above (40 seeds, card and line)
docs/plans/advisor-v3-method-check.md          this file
```
