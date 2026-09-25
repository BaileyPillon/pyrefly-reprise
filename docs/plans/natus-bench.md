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

## Re-bench after Bailey's pick (2026-09-25, strategy 7 shipped)

**Bailey, 2026-09-25 ~18:30 EDT: "All your recommendations"**, which took read-out 2 above: the
chapter's tactic and guide now teach the research's strategy 7, quoted from
`research/ffx-seymour-natus-highbridge.md` §6.3 row 7: "**Haste only two** party members (three
triggers Desperado)" (wiki + GameFAQs + Jegged, `[verified: 3 sources]`). The research does not
name the two; the line Hastes **Tidus and Auron**, the two swords Talk makes stronger (§6.2). That
pick of the two is ours, the same as the bench line Bailey saw. **Game case: FFX only** (the
Highbridge, Mortibody's Desperado and the CTB Haste are FFX's; research §0.3).

- **The change (a tactic and words, no boss number moved):** `src/engine/tactics/seymour-natus.ts`
  gains rule 9: on a turn Tidus would swing at Natus, while fewer than two active members have Haste,
  he casts Haste on the first of Tidus and Auron without it. The guide's rule 3 now reads "Haste
  Tidus and Auron, and no one else" (short: "Haste Tidus and Auron, never a third"), a Haste hint
  explains the row, and the pause tip ends "Haste only Tidus and Auron".
- **The re-bench, 200 seeds** (`tests/unit/chapters/natus-shipped-bench.test.ts`, same record and
  seeds as above). The wrong line is now built on the new shipped line, so it moved a little; the
  no-Haste row is the shipped tactic with its Haste turned back into the swing, and it reproduces the
  first table's shipped row exactly.

| Line | Wins | Mean turns | Reached phase 3 | Desperados / battle | Shatters / battle | Banishes | Natus HP left (mean) |
|---|---:|---:|---:|---:|---:|---:|---:|
| **Shipped tactic: Haste only Tidus and Auron (strategy 7)** | **169/200 (84.5 %)** | 80.2 | 175 | 0.00 | 0.49 | 1000 | 2445 |
| Haste all three, then swing (wrong) | 157/200 (78.5 %) | 102.2 | 165 | 2.05 | 0.47 | 1000 | 3772 |
| Nobody Hastes (the line it replaced) | 116/200 (58.0 %) | 94.8 | 137 | 0.00 | 0.71 | 1000 | 6192 |

- **169/200, as expected,** and equal to the first table's strategy 7 row in every column: the
  shipped tactic is the line Bailey picked, now reached through `intendedStrategy` (the auto-battle
  and the advisor). It never calls Desperado.
- `tests/unit/chapters/natus-ship-content.test.ts` pins the rule on the real engine: only Tidus casts
  Haste, only on Tidus or Auron, and over twenty whole battles no three active members are ever Hasted
  at once and Desperado is never called.
- Read-out 1 still holds against the new line (Hasting all three wins 157, fewer than strategy 7's
  169, but more than nobody Hasting). The cause is not claimed and the boss is not touched.
