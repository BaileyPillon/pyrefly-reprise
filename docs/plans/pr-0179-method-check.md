# PR-0179 method check (rule 15): the Gagazet aeon rows

Written 2026-09-26 before any build, as RUBRIC §8 asks of an issue open at major in rounds 12
and 13. Paper only. **Game case: FFX only** (Yuna's aeons; FFX-2 has no summons). Chapters that
read these rows: I (Seymour Flux) and IX (Yojimbo) through `src/data/ffx/builds/gagazet.ts`;
X (Natus, `highbridge.ts` takes Bahamut from this preset) and XIV (Isaaru, `via-purifico.ts`
inherits it), both shipped by Bailey's D-186 as they are.

## The issue as the critic measures it

`gagazet.ts:427-433` ships Valefor 738, Ifrit 988, Ixion 983, Shiva 878, Bahamut 1,398 HP, an
invented ~0.55x of the sourced rows. `research/ffx-combat-core.md` §6.4.3 (Mt. Gagazet block,
N = 250) gives 1,530 / 2,075 / 2,055 / 1,830 / 2,935, and `research/ffx-isaaru-bevelle.md` §5.1
P3, "the weakest the aeons can be" at 180-209 battles, gives Bahamut 2,139. Acceptance: the rows
equal a sourced preset, and every chapter that inherits them is re-benched.

## The current route, and why it stalled

- Round 12's fix was "replace the five rows with §6.4.3 and re-bench". Nobody built it, because it
  collides with two standing rules: **never tune a boss number** does not apply (these are the
  player's aeons), but **D-186** approved Chapter XIV *as shipped* (125/200) and the aeon rows are
  part of what shipped. Replacing them silently would overturn an owner decision.
- Round 13's fix became "put the choice to Bailey once". It was never put: no sheet carried it,
  because the only question anyone could write was abstract ("sourced rows or keep?"), with no
  numbers for what each answer does to I, IX, X and XIV. `attempts: 0`. It is stalled on the
  missing measurement, not on code (a five-line data change).

## Alternatives

1. **Keep asking in the abstract.** Rejected: two rounds show it does not get asked, and Bailey
   answers bundled sheets with "all your recommendations", which is only safe when every item has
   measured consequences.
2. **Change method: the boss-side rule** (memory `boss-side-fix-needs-measured-options`): build
   each sourced answer as an OFF switch, measure each at human pace, then ask once with the table.
   - **Arm (a):** §6.4.3 Gagazet rows in `gagazet.ts`, X and XIV inherit them.
   - **Arm (b):** §6.4.3 Gagazet rows in `gagazet.ts`, X and XIV keep D-186's shipped rows, labelled
     `[estimate]` with the reason (Highbridge and the Via Purifico come before Gagazet in the story,
     so a Gagazet-count row is the wrong era for them anyway).
   - **Arm (c):** the Isaaru P3 floor for XIV only (Bahamut 2,139 and the P3 row), everything else
     as (b).
   - Arm (0), today, stays the default until Bailey picks, and stays reachable as a switch value.

## The smallest test that tells them apart

The existing benches, run once per arm, headless, seeds 1-200, at the human-pace harness each
chapter already uses: `tests/unit/strategy-seymour-flux.test.ts` (I),
`tests/unit/chapters/yojimbo-bench.test.ts` (IX), `tests/unit/chapters/natus-shipped-bench.test.ts`
(X) and `tests/unit/chapters/isaaru-tactic-bench.test.ts` (XIV, the 125/200 D-186 figure). Report first-try
and within-five per chapter per arm, and the aeon's own survival turns in XIV (Bahamut's duel is
where 1,398 vs 2,139 vs 2,935 matters; in I, Banish makes HP nearly irrelevant, §6.1, and round 12
measured 16 vs 17 of 40). If every arm stays inside the D-186 band for XIV and moves I and IX by
less than the bench's own variance, the question collapses to "sourced or not" and the answer is
arm (a) by rule 6.

## Recommendation

**Change method, then ask once.** Batch 1 builds arms (a), (b) and (c) as OFF values of one
switch in `src/data/ffx/builds/` (no boss number touched, the D-186 rows untouched while OFF),
benches the four chapters, and the driver sends queue item 6 with the table and the recommendation
**arm (a)**. PR-0179 closes when the chosen arm is ON and the inheriting chapters are re-benched.
