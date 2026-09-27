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
