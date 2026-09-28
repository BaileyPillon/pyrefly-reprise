# Handoff: advisor v3 (in-flight commands, revive priority)

Branch `advisor-v3` (worktree `D:/pyrefly-advisor-v3`), pushed, **not merged**. 2026-09-27.
Method check, scorecard and numbers: [docs/plans/advisor-v3-method-check.md](../plans/advisor-v3-method-check.md) §6a.

> **Bailey, 2026-09-27:** *"yes the advisor needs to be WAY WAY smarter please. it also needs to
> understand that if i select mega potion for example and executed that command then it needs to
> know that the mega potion is in progress so it shouldn't still tell me to mega potion."*

## Game case (rule 14)

- **In-flight commands: FFX-2 only.** ATB opens the next girl's menu while a command is still on
  its charge bar or held for a chain lock [research/ffx2-combat-core.md §1.1, §1.3, §1.7]; FFX's CTB
  resolves a command before the next turn [research/ffx-combat-core.md §1.1]. FF7 shows no advisor
  and was left alone.
- **Revive priority: both games** (a property of the advice). Measured: it changes FFX-2 results
  (XI, XV) and leaves every FFX chapter's wins where they were.

## What was built

| Piece | File | Notes |
|---|---|---|
| `FFX2Engine.fork(seed, rngState?)` | `src/battle/ffx2/engine.ts` (+ `ActingAbilities.copyFrom`, `menu-cancel.ts`) | One `structuredClone` of the mutable bundle, registries shared read-only, its own `SeededRng`. Nothing in a battle calls it. Not on the `BattleEngine` facade (no contract change). |
| The projected board | `src/engine/tactics/advisor-inflight.ts` | Fork, clock on (Active, top list), until every other girl's charging / held command has landed **or the next enemy moves**; replay to the step before the enemy. `null` (v2 reading) when nothing is in flight, the source is stale (`nextSeq` differs) or the girl choosing is down on it. |
| Switch, board wiring, same-move rule, revive priority | `src/engine/tactics/advisor-v3.ts` | `ADVISOR_V3 = true`; `AdvisorOptions.v3` overrides it per call. |
| Hooks | `src/engine/tactics/advisor.ts` | `AdvisorOptions.engine` / `.v3`; ranks on `boardFor(...)`; `repeatsInFlight` beside `spentAlready`; `withRaiseFirst` on the ordering. Cache keyed on the real board and the v3 flag. |
| Live wiring | `src/ui/ffx2/FFX2BattleHud.ts`, `src/app/screens/BattleScreenWiring.ts` | The FFX-2 HUD is constructed with the engine and hands it to the advisor (read and forked, never driven). The held command reaches the card for the first time. |
| Bench | `critic/bench/advisor-v3/drive.ts` | `liveAdvisorOptions` passes the engine like the HUD; `SCORECARD_V3=0/1`. |

Rules kept: saves-from-lethal first, Bailey's 2026-09-21 refused revive with its note (PR-0197),
only rows the menu offers (FOC22-02). No new text on the card (rule 9: a line such as "Mega-Potion
on the way" needs options first).

## Results (40 seeds, v2 → v3, same tree)

Wins: I 22 → 22, II 37 → 37, III 39 → 39, IV 40 → 40, V 37 → 37, **VI 33 → 38**, VII 37 → 37,
VIII 40 → 40, IX 40 → 40, X 36 → 36, **XI 33 → 37**, XII 25 → 25, XIII 0 → 1, XIV 16 → 16,
**XV 8 → 12**: **443 → 457 of 600**, no chapter lower. Duplicates (strict / same move, FFX-2):
594 / 813 → 114 / 75. XI missed raises 113 → 5. Decision cost p95 at most 12.3 ms in node (v2's
worst 18.0); in the browser 4 to 8 ms, **33 ms at 4x CPU throttle** (a phone proxy, one sample),
once per menu.

## Checks run

- `tests/unit/advisor-v3-inflight.test.ts`: found by running the engine, boards where **v2**
  repeated the command in flight: Mega-Potion charging, Phoenix Down **held** (chain lock), a single
  heal charging, a buff charging; v3 does not repeat any.
- `tests/unit/ffx2-engine-fork.test.ts`: fidelity (a fork with the battle's random state ends on
  the real log), determinism (same seed agrees; the battle's stream untouched), purity (the v3 card
  at every decision, projections running, leaves Chapters V and VI on the same log).
- `tests/unit/advisor.test.ts` Chapter 2: the raise-over-line promotion is the second licensed
  exception (Mega Phoenix over Attack at Yunalesca); `phone-battle-hud.test.ts` source check
  updated for the HUD's constructor argument.
- Goldens: `tests/unit/ffx2-atb-golden.test.ts` and the engine suites pass unchanged.
- Real keys, headless GPU, 1600x900, Chapter XI seed 1 (`docs/screenshots/advisor-v3/`): the party
  hurt (a fixture), Rikku presses Item > Mega-Potion; Yuna's menu opens while it charges; **v2 would
  say Mega-Potion -> the party, the card on screen says Turbo Ether -> Yuna** (Yuna at 13 / 206 MP;
  the projection shows the Mega-Potion landing first); the HUD hands the advisor the engine
  (`report-ffx2-fallen-aeons-s1.json`). Frame 2 caught the card mid-fade (A-15 action fade); frame 3
  is 1.5 s later.

## Open

1. **The lethal-save reading rose** (V 29 → 97, VI 23 → 51, XV 8 → 28) although no chapter lost a
   win: the reading prices rows on the current board, v3 on the projection. 10 of V's 17 sampled
   misses are "the enemy moves before the charging heal lands". Next: measure whether any row could
   land before that enemy move (charge times), and make the reading projection-aware.
2. **The strategy guide's NEXT is not in-flight aware.** In the same frame the guide rail still says
   "Yuna: Mega-Potion -> the party" while Rikku's Mega-Potion charges (it is the chapter's line on
   the current board). Bailey may read that as the same complaint. The same `boardFor` would serve
   it; not done (a different panel, and a sync-time cost to measure first).
3. XIV Isaaru (16 vs the line's 28) is the search track's (§5 C); XII's missed raises stand by the
   rails.
4. `tests/unit/strategy-ffx2-bahamut.test.ts` "heal-only route" failed once in the full suite under
   load and passes alone (engine-only test, untouched by this branch).
5. Merge, release and the deep review are the driver's (combat presentation; `critic-plan`).

## CHECK (adversarial, 2026-09-27, a separate agent; branch at 575673ab)

Everything below was measured by running the engine (rule 3). Scratch probes live in
`.check-advisor-v3-tmp/` in this worktree and are not committed. Verdict: **HOLD for merge** on
one blocker (Bailey's own case still happens) and four majors.

### What holds

- **Scorecard reproduces exactly.** Rerun of 40 seeds x 15 chapters, v2 and v3 on this tree: every
  chapter's wins match the builder's table (v2 443, v3 457 of 600; no chapter lower), and so do
  the duplicate counts (V 25/14, VI 62/54, XI 9/2, XV 16/5) and the missed raises (XI 113 -> 5).
- **Purity and determinism.** 5 probe sweeps, about 60,000 decisions (FFX-2 and FFX, including
  random presses to create every kind of pending action: heals, party heals, raises, buffs, Dispel,
  items, attacks, two girls committing at once): the live engine's state, units, held command,
  drafts, clock and RNG state were identical before and after every v3 card. 32 runs (8 chapters,
  4 seeds) with the v3 card computed at every decision or never: identical logs and RNG state at
  every decision. `ffx2-atb-golden`, `ffx2-engine-fork` and every engine suite pass; the branch
  touches no engine test.
- **Menu rows.** 0 off-menu or badly aimed rows in any sweep, including runs that injected Reflect
  (1,031), Itchy (452), Zombie (540, FFX) and low MP (1,047) on the probe's own engine.
- **Covered raises.** 0 cases where the card raised a girl a pending command was already raising.
- **Checks.** tsc clean on the branch (the untracked `tests/unit/zz-scratch/` adds two TS6133
  errors in this worktree only). Full suite: 1 failure, the known Bahamut "heal-only route"
  timeout under load; it passes alone with the golden and fork suites.
- **Time per decision, paired in the same process (v2 and v3 on the same board, alternating).**
  Node, 10 seeds x 6 FFX-2 chapters: p50 / p95 equal to within 0.1 ms overall (worst v3 p95
  9.2 ms, Vegnagun); on boards with something in flight v3 is 1.0-1.1x v2 at the median and
  1.4-1.7x at the p95 of the per-board ratio. Browser, headless GPU, Vite dev: 1600x900 v3 p50
  4.5-5.4 ms, p95 <= 8.0; 390x844 p50 4.4-6.4, p95 <= 9.5; 390x844 at 4x CPU throttle p50 29-32,
  p95 34-42 for both v2 and v3. Parity, not the speed-up the table implies (v2's 18.0 ms p95 was
  one noisy row).

### Blocker

1. **Bailey's own case still happens.** Clean card-following, 40 seeds x 6 FFX-2 chapters, 7,192
   decisions with a command in flight: 6 top rows are the same move on the same target as a
   command still charging, 5 of them **Mega-Potion at Chapter V** (seeds 12, 22, 37, 38, 39: Rikku
   charging Mega-Potion, Paine's card says Mega-Potion). The projection lands the first one before
   the enemy moves (Rikku 2,421 -> 4,475 of 5,652, Paine 3,666 -> 5,712 of 5,862), no threat is
   forecast, and the card still spends a second Mega-Potion because it "Puts 1,327 HP back". The
   module note says "Bailey's Mega-Potion is never advised twice"; it is. Same shape at Leblanc
   (seed 15, random-press sweep): Paine's Potion and Rikku's Hi-Potion both charging on Yuna, Yuna's
   card says Potion -> Yuna. Cause: `repeatsInFlight` only looks at commands still in flight on the
   **projected** board, so a command that lands inside the projection is never checked; the rule
   needs to run against the real board's in-flight list too (or price the top-up against the
   chapter line, not against nothing).

### Majors

2. **The card ranks on a finished battle.** In 207 of 19,352 clean decisions the fork's battle (or
   link) is already won when the projection stops (a charging or held hit finishes the boss), and
   the card ranks rows on a board with no enemy: Megalixir "7,207 HP back" at Vegnagun seed 1,
   Mega-Potions, Pray, Hi-Potions where v2 said Attack; once (Bahamut seed 12, low-stock sweep)
   **Drain -> Yuna**, hitting an ally. Inventory carries to the next link, so this burns rare items.
   `projectBoard` should return `null` (the v2 reading) when the fork ends the battle.
3. **The last item already in flight is advised again (a v2 rule lost).** With the last Hi-Potion
   charging (Leblanc seed 13), v2 said Potion -> Paine (`stockSpokenFor`); v3 says Hi-Potion ->
   Yuna, because on the projected board the item has landed, nothing is in flight and the stock
   check sees no committed use. 6 cases in the random-press sweep, 11 in the low-stock sweep
   (Grenade, Potion, Hi-Potion). The engine then resolves the second copy at 0 stock (execute.ts
   clamps at 0 and carries on), so it "works" in the engine but not by the menu's own count.
4. **Lethal saves (Bailey's 2026-09-21 rule), open item 1, re-read on the projected board.** Of
   v3's 184 real-board misses (V 97, VI 51, XV 28, XI 8), 70 are still misses on the very board the
   card ranked on (V 51, VI 8, XV 9, XI 2), 85 were no threat there, 13 had no projection, 14
   were unsavable. v2's real-board total was 61. So most of the rise is not a measuring artifact;
   it needs a charge-time-aware check before merge.
5. **The strategy guide's NEXT line is still not in-flight aware** (open item 2). Bailey reads the
   guide rail and the card together; the guide saying "Mega-Potion" while one charges is the same
   complaint.

### Minors

- `tests/unit/advisor.test.ts` Chapter 2: a raise override no longer has to say "the long plan
  is still"; it is a looser check, not only a new exception.
- `advisor.ts` (1,785 -> 1,812 lines) and `FFX2BattleHud.ts` (1,252 -> 1,262) grew past the 400-line
  rule (both were already over; the new logic itself is in new modules).
- Untracked `tests/unit/zz-scratch/` in this worktree would run under `npm test` here and breaks tsc.

## REPAIR (2026-09-27, one cycle after the CHECK)

Every item was reproduced and its fix proved by running the engine (rule 3). Game case: the
in-flight rules (FB1, FM2, FM3, FM5) and the fork-tested lethal save (FM4) are **FFX-2 only** (only
ATB opens a menu while a command is in flight, research/ffx2-combat-core.md §1.1; FFX's CTB orders
turns exactly); the FFX rows of the scorecard are unchanged. Scratch probes (not committed) live in
`.repair-advisor-v3-tmp/` in this worktree.

| Finding | Fix | File |
|---|---|---|
| FB1, Bailey's case after a projected landing | The same-move rule reads every command in flight on the **real** board (`boardFor(...).inFlightNow`), landed inside the projection or not. | `advisor-v3.ts` (`repeatsInFlight`, `alreadyOnItsWay`) |
| FM2, ranking on a won battle | A projection whose fork ends the battle (or a link) returns `null`: the v2 reading stands. | `advisor-inflight.ts` |
| FM3, last item in flight | v2's stock rule runs again, on the real board. | `advisor-v3.ts` (`stockInFlight`) |
| FM4, lethal saves | `provedSave`: when the forecast names a girl the enemy kills, the top row and up to 3 saving rows are pressed on 4 forks of the live battle (fixed seeds) and run to the enemy's hit; a saving row goes on top only when she lives in at least half the futures more. The top row is tested even when it claims the save. When the enemy moves before what is in flight lands, the threat is read off the real board (the projection stops a step early, where the enemy's charge can already be off its bar and the projected forecast read "No action"). | `advisor-lethal.ts` (new), `advisor.ts` |
| FM5, guide NEXT | The rail's NEXT drops the chapter line's pick when another girl already charges the same support move (same target, or the party); read off the data tables, no engine needed. | `guide-inflight.ts` (new), `guide.ts`, `targetLabel.ts` (`targetingFor` exported) |

Also: `ForkedBattle` gained `submit` (the fork only); `AdvisorOptions.v3Rules` switches one v3 rule
off for tests and ablations (the HUD never passes it; a call carrying it skips the plan cache).

### Proof

- **Sweeps, 6 FFX-2 chapters x 40 seeds** (the check's own probe, extended with a guide-rail check):
  card followed (19,097 decisions, 7,098 with a command in flight), 35 % random presses (18,355 /
  7,209) and low stock (10,718 / 3,669): **0** same move on the same girl or the party as a
  command in flight (the check found 6 in the same card-followed run, and 14 and 2 in its smaller
  random-press and low-stock runs), **0** last-copy items (the check: 6 and 11), **0** guide NEXT
  repeats, 0 raises onto a girl already being raised, 0 off-menu or badly aimed rows, 0 rows that
  hurt an ally, **0** purity differences (live state, held command, clock and RNG before and after
  every card).
- **`tests/unit/advisor-v3-repair.test.ts`** (5 tests, found by running the engine, each board
  chosen where the rule is what changes the card: the v3 card with `v3Rules.onItsWay: false`
  names the move): a Mega-Potion that lands inside the projection; a Grenade whose last copy is in
  flight (A/B on one board: with a spare the card names it, without one it does not); a projection
  whose fork wins the battle returns `null`; the guide's NEXT for a line pick already charging is
  `null` where the v2 panel named it; `provedSave` is deterministic, leaves the live engine's
  state, log, RNG and held command alone, and its pick keeps the girl alive at least as often as
  the line on 8 forks it never sampled. Mutation check: with the result guard or the guide rule
  removed the matching tests fail.
- **Lethal saves, fork-tested** (V, VI, XI, XV, 40 seeds): v3 before the repair 6 real misses of
  187 arithmetic ones; after it **2 of 183**; v2 1 of 61 on its own path.
- **Scorecard** (40 seeds, same tree; table in the method check §6b): **443 → 453 of 600**
  (v3 before the repair 457: XV's +4 came from ranking on finished links, FM2). Every chapter
  better or equal **except V, 36 vs 37**; at 120 seeds V is **111 vs 111** and XV 28 vs 29. V's
  seed 26 parts ways where v2 advised a second Megalixir while Yuna's was still charging
  (Bailey's case) and v3 advised X-Potion on Paine; that run later loses to Noli Me Tangere.
  Duplicates (strict / same move): 594 / 813 → 107 / 72. XI missed raises 113 → 5.
- **Time per decision** (paired, node): about 1.1x v2 at the p95, worst v3 p95 11.3 ms (V; v2
  10.4); browser 1600x900 3.9 to 6.7 ms.
- **Real keys, headless GPU, 1600x900, port 7501** (`docs/screenshots/advisor-v3/repair-*`):
  Chapter XI seed 1, Rikku presses Item > Mega-Potion, Yuna's menu opens while it charges: v2
  would say *Mega-Potion -> the party*, the card says *Turbo Ether -> Yuna*, the guide rail no
  longer says Mega-Potion (it shows its idle line), the HUD hands the advisor the engine.
  Chapter IV seed 1: Rikku's Hi-Potion on Yuna charging; v2 would say *Hi-Potion -> Yuna*, the card
  says *Hi-Potion -> Paine* ("Paine lives through Mega Flare"), a different girl, which the rule
  allows (the script's naive "label appears" check flagged it; it is the complementary heal).
  Chapter V seeds 12 and 22: no attempt caught the landed-projection shape by keys before the
  fixture's low HP ended the run; that shape is proved by the engine test above. Server stopped.
- tsc clean (the untracked `tests/unit/zz-scratch/` still adds its two errors in this worktree
  only); the full suite passes except the known Bahamut "heal-only route" timeout under load (it
  passes alone, 8.3 s); goldens and the fork suite pass; orphans: the same 24 as main.

### Still open

1. **Default switch.** `ADVISOR_V3` stays ON (better overall by 10, 14 of 15 chapters better or
   equal, V at parity over 120 seeds, and V's gap is Bailey's own rule). The brief's bar, better or
   equal on every chapter at 40 seeds, is **not met on V by one run**: the driver decides; off is
   one constant in `advisor-v3.ts`.
2. **The guide rail's idle line.** When NEXT is dropped because the line's pick is already
   charging, the rail shows its existing "Waiting for your turn." while it is her turn. A line such
   as "Mega-Potion on the way" is new text and needs options first (rule 9).
3. The fork-tested lethal reading still has 2 misses on V (Vigor or Pray over a Curtain before an
   Attack): four sampled futures are noisy; more samples cost time on a phone.
4. XIV Isaaru (16 vs the line's 28) and XII's missed raises by the rails, as before.
5. `advisor.ts` (now about 1,830 lines) and `FFX2BattleHud.ts` are over the 400-line rule as they
   were before; the new logic is in new modules.
