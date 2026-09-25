# Chapter X (Seymour Natus): the shipped tactic's bench

**Game case: FFX only** (AGENTS.md rule 14). Measured 2026-09-25 by the Natus ship sub-agent
on branch `chapter-natus-ship-0925`. **Measure, never tune:** the numbers below are reported,
and nothing on the boss side moved (`docs/plans/chapter-natus-review.md` §9; memory
`boss-side-fix-needs-measured-options`).

## What was measured

- **The line:** the registered tactic `src/engine/tactics/seymour-natus.ts`, reached the way
  the game reaches it (`intendedStrategy` → `tacticFor`, so the auto-battle and the advisor
  play exactly this). It is the plan's intended line: Talk (Tidus, Auron, Yuna), Yuna Shells the
  three, Kimahri makes way for Auron, the aeon relay with Bahamut first, a Soft at once on a
  stone guardian, revive and heal, everyone else hits Natus, nobody casts Haste
  (research `ffx-seymour-natus-highbridge.md` §6.3 strategies 3, 4 and 7).
- **The record:** the chapter's own build and formation (`SEYMOUR_NATUS.buildRef`,
  `enemyGroupRef`), seeds 1 to 200, the real engine and data.
- **The wrong line:** the same line, but Tidus Hastes every active member first (strategy 7
  turned around: Haste on all three calls Desperado, verified: 3 sources).
- **For Bailey only:** the research's own strategy 7, Haste only Tidus and Auron.
- Source: `tests/unit/chapters/natus-shipped-bench.test.ts` (it prints this table on every run).

## The table

| Line | Wins | Mean turns | Reached phase 3 | Desperados / battle | Shatters / battle | Banishes | Natus HP left (mean) |
|---|---:|---:|---:|---:|---:|---:|---:|
| Shipped tactic (intended) | 116/200 (58.0 %) | 94.8 | 137 | 0.00 | 0.71 | 1000 | 6192 |
| Haste all three, then swing (wrong) | 153/200 (76.5 %) | 108.2 | 159 | 2.12 | 0.53 | 1000 | 4137 |
| Haste only Tidus and Auron (strategy 7) | 169/200 (84.5 %) | 80.2 | 175 | 0.00 | 0.49 | 1000 | 2445 |

The shipped row equals the plan bench's "intended" row (116/200, 94.8 turns, 137 reached phase
3, 0.71 shatters, 6,192 HP left: `natus-bench.test.ts`, Decisions section of the plan), so the
tactic is the line the plan measured, now wired to the game.

## Read-outs for Bailey (measured, not acted on)

1. **Haste on all three is not punished here once the rest of the line is right.** It calls
   Desperado about twice a battle and still wins 37 more seeds than the shipped line. The plan's
   wrong line (Haste all three with no Talk, aeon or Shell) loses all 200, so the thesis holds
   only against a line that is wrong in other ways too. The cause is not claimed (rule 3).
2. **The research's strategy 7, Haste only two, is the strongest line measured** (169/200, and
   it never calls Desperado). Making it the shipped tactic is a one-rule change to the tactic and
   the guide; it needs Bailey's yes (the plan picked "nobody Hastes" as the intended line).
3. **Provoke + Reflect still wins every seed** (plan bench, 200/200), and Poison-and-wait still
   loses every seed (0/200). Neither is a reason to touch the boss.
