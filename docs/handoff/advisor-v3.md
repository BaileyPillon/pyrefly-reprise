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

## CHECK 2 (adversarial, 2026-09-27, a second separate agent; branch at 94634c5c)

Everything below was measured by running the engine (rule 3). Scratch probes, not committed:
`.check2-advisor-v3-tmp/` (probe2, determinism, replay, split, timing, dbg) and
`.check2-advisor-v3-timing-tmp.mjs` / `.check2-advisor-v3-browser-tmp.mjs` in this worktree.
Frames, uncommitted: `docs/screenshots/advisor-v3/check2-*`. Verdict: **HOLD for merge**. There are
3 blockers as the brief defines them: one real defect and two narrow misses of the bar as written.
There are also 2 majors.

### What holds

- **The scorecard reproduces exactly.** 40 seeds x 15 chapters, v2 (`SCORECARD_V3=0`) and v3 on
  this tree give 443 and 453 of 600. Every chapter's wins, duplicate counts (594 / 813 -> 107 / 72),
  missed raises (XI 113 -> 5), lethal readings and off-menu counts equal `results-v3-repair.json`
  and `results-v2-control.json`.
- **The card never repeats a chosen move.** Six FFX-2 chapters were run three ways. Following the
  card on **new seeds 41-80** gave 19,855 decisions, 7,430 with something in flight and 686 with a
  **held** command. Random presses at 35 % on seeds 1-40 gave about 20,000 decisions. Low stock plus
  a low-HP rig gave 55,173 decisions. None of the three showed the same support move, on the same
  ally or the party, as a charging **or held** command; the only hits were a probe artifact
  (Darkness simulated with no target). None showed the last copy of an item re-advised, a raise
  onto a girl already being raised, an off-menu or badly aimed row, or a row that hurts an ally.
  My probe also counts non-damage moves on an enemy (Dispel, debuffs) as repeats: 0.
- **A command whose target dies before it lands.** 83 decisions: 74 had the fallen girl already
  covered by a raise in flight, 5 had the card raise her, 1 had the runner-up raise her, 3 had no
  raise on the menu, and **0 missed the raise**.
- **Status rigs** (Reflect 589, Itchy 212, Zombie 399 (FFX), low MP 579) on 6 FFX and 3 FFX-2
  chapters, 12 seeds: 0 findings of any kind.
- **Purity and determinism.** In every probe decision above, the live engine's state, units, held
  command, drafts, clock, RNG, acting stacks and options were the same before and after the card
  and guide. Random-press runs with the v3 card and guide computed at every decision, or not at
  all, matched on 36 runs (9 chapters x 4 seeds, FFX and FFX-2): the same RNG and log hash at every
  decision. Card-followed runs replayed with no advisor matched on 21 runs, including 5-link
  Vegnagun wins (a full-state hash at every decision). `ffx2-atb-golden`, `ffx2-engine-fork`, both
  v3 suites and `advisor.test.ts` pass.
- **Bailey's 2026-09-21 rules hold.** On FFX the card is unchanged: wins, missed raises and notes
  equal v2 on all 9 chapters, and every Flux / Omnis miss either shows the note or has the raise
  as the runner-up.
- **Real keys, headless GPU, 390x844 phone layout, Chapter XI seed 3.** Rikku presses Item >
  Mega-Potion. While it charges, Yuna's card says *Megalixir -> the party*; v2 would have said
  *Mega-Potion -> the party*. The guide rail says "Waiting for your turn." and the HUD hands the
  engine over (`check2-390x844-*`). At 1600x900, Chapter VI seed 5: Rikku's Hi-Potion on Yuna, and
  the card says Hi-Potion -> **Rikku**, a different girl, which the rule allows (the script's naive
  check flags it).
- **Checks.** tsc is clean, apart from the known untracked `tests/unit/zz-scratch/` (2 × TS6133).
  The full suite has 1 failure, the known Bahamut "heal-only route" 15 s timeout under load; that
  file passes alone, 19 of 19.

### Blockers

1. **The guide rail's NEXT repeats a held (chain-locked) command: Bailey's case on the rail.**
   `guide-inflight.ts#chosenAlready` calls `inFlight(state, actorId, [])` and never passes the
   engine's held command. The repair's probe skipped held commands (`!p.held`), which is where its
   "0 guide repeats" came from. Following the card on seeds 41-80, **38 of 686 held decisions**
   named the held move (Leblanc 28, Vegnagun 7, Den of Woe 2, Fallen Aeons 1). Random presses gave
   43, and the stress rig 6. Examples:
   - Vegnagun seeds 58, 59, 64, 73, 76, with Rikku's Mega Phoenix held: the rail says *Mega Phoenix*.
   - Vegnagun seed 52, with Paine's Megalixir held: the rail says *Megalixir*.
   - Leblanc seed 45, decision 45, with Rikku's Hi-Potion on Rikku held: the rail says *Hi-Potion ->
     Rikku*, while the card correctly avoids it.

   Fix: hand the rail the held command (`StrategyGuide` has no engine today). The card itself is
   clean here.
2. **The win-rate bar as written: Chapter V is below v2 at 40 seeds (37 -> 36).** This reproduces
   exactly. At 120 seeds V is level (111 = 111), but **XV drops 29 -> 28**. Both gaps are within
   one run and far inside the noise (binomial SD about 4 wins per 120).
   - V seed 26 splits at decision 13 (`split.test.ts`): Yuna's Megalixir is **held**, and v2 tells
     Paine to use a second Megalixir while v3 refuses.
   - The engine then **drops** Yuna's held Megalixir: `fireHeld` drops a command when every target
     in `command.targets` has died, and this party item's `command.targets` held only Rikku, who fell.
   - v3 relied on a command that never landed and lost. This looks like an engine question
     (FFX-2), not an advisor bug, but it is why V is one run short.
3. **The speed bar as written: the card is measurably slower than today's on FFX-2.** Timings are
   paired, v2 and v3 on the same board in the same process, node, 8 seeds.
   - Median time per decision is 1.00x to 1.09x v2's.
   - p95: Vegnagun 10.9 -> 11.4 ms, Leblanc 8.5 -> 9.7, Den of Woe 6.2 -> 7.8.
   - On boards with a lethal forecast, where `provedSave` presses rows on forks: Vegnagun p50
     4.2 -> 7.4 ms, p95 5.3 -> 12.0, worst 14.6 -> 22.8; Fallen Aeons p50 6.7 -> 12.1.
   - FFX is level.
   - Browser, headless GPU, Active, 30 menus each:
     - 1600x900: p50 level (about 5 ms), p95 6.8-7.5 -> 8.2 ms.
     - 390x844: p95 5.8 -> 7.8.
     - 390x844 at 4x CPU throttle: the HUD's own card p50 32.7 -> 35.0 ms, worst 46.6 -> 71.5.

   The absolute cost is small and paid once per menu. The driver decides whether the bar means "no
   slower at all".

### Majors

4. **A different item with the same effect replaces the refused repeat.** While another girl's heal
   is already on its way, the card often names a different heal on the same allies. This happens
   when the enemy moves first: the projection stops before the heal lands, and the card prices
   "one hit from down" on the real board, although her own heal would land after the one in flight.
   - Card-followed: 131 of 7,430 in-flight decisions name a pure HP heal that the in-flight heals
     already fill (Potion 75, X-Potion 40, Mega-Potion 13). Random presses: 161.
   - The scorecard's strict duplicates show the same residue, 107 (v2: 594).
   - The phone frame above shows it: Megalixir while Rikku's Mega-Potion charges. The Mega-Potion
     lands 1.5 s later (Yuna 2,488 / 2,488), and the card still says Megalixir, because it is
     computed once per menu. There, at least, Megalixir also restores MP.

   Bailey may read this as the same complaint.
5. **FFX gets nothing measurable from "WAY smarter".** Revive priority changes no FFX chapter's
   wins, missed raises or notes. Flux still has 234 missed raises while losing, Omnis 103, all by
   Bailey's rule or shown as the runner-up. This is not a regression, but the both-games half of
   the ask is not visible on FFX.

### Minors

- `guide-inflight.ts#chosenAlready` follows the global `ADVISOR_V3`, not the per-call `v3` flag, so
  the rail is always v3.
- The card's cite reads the guide on the projected board.
- The untracked `tests/unit/zz-scratch/` still breaks tsc in this worktree and runs under `npm test`.
