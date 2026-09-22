# Paper preflight: FFX-2 heals and recovery items on a friendly target never roll the hit check (PR-0075)

Paper preflight under `critic/RUBRIC.md` §4 / AGENTS.md rule 15, written **before** any product
code. Track: `ffx2-item-accuracy`. `node tools/critic-plan.mjs --paths src/battle/ffx2/formulas.ts`
answers **DEEP** ("FFX-2 ATB engine is a shared system"; chapters ffx2-bahamut,
ffx2-vegnagun-shuyin). Answers critic round 08 **PR-0075** and the release-09 verifier's refutation
("PR-0075 is NOT fixed and was never built"). Written 2026-09-22 by the release-09 repair agent.

**Verdict: PROCEED**, one guard in the hit check, no data change.

## 1. Game case (rule 14): FFX-2 only

FFX already has the carve-out: `src/battle/ffx/accuracy.ts` returns `null` (ALWAYS) for every
non-physical action, "a Cure or a Phoenix Down never whiffs" [`research/ffx-combat-core.md` §2.11].
FFX-2's `hitPercent` (`src/battle/ffx2/formulas.ts`) has no such guard, so the two engines differ
without a written reason (CHK-020). The change is FFX-2 only; `src/battle/ffx/**` is not touched.

## 2. What the sources say, and what they do not

- `research/ffx2-combat-core.md` §2.6 decodes the hit check as an **attacker-versus-defender**
  points race (`attackerScore - defenderScore`, Evasion and Luck on the defender) `[single source,
  calculator-derived]`. Its rules table lists the cases that produce "MISS": the roll exceeding
  `hitPercent`, and re-applying a status already present. Nothing in §2.6 applies it to a friendly
  target, and no source in `research/` describes a Cure, Pray or Potion missing an ally.
- The §2.9.1 ability tables that carry an *Accuracy* column give **"Stat"** (use §2.6) to every
  hostile row and **"—"** to every ally-support row (Samurai Nonpareil, No Fear, Hayate; Berserker
  Berserk), i.e. no hit check. The White Mage and Alchemist tables have no Accuracy column at all.
- **Not sourced, and not decided here:** whether a friendly heal can miss in retail under any
  condition (Reflect bouncing is modelled elsewhere and untouched). The reading taken is the
  narrowest one the sources support: the §2.6 race is an attack's check; a restorative action on
  your own side has no defender to race.

## 3. What is true today (measured by running the engine, rule 3)

- Verifier probe `critic/scratch/release-09/probe/self-heal.probe.ts` (200 seeds a chapter):
  chapter 4 = 172 party-to-party `miss`/`evaded` events over 5,988 item uses and 1,775 heals
  (Potion yuna->yuna 62, paine->paine 52, Cure yuna->yuna 49, paine->paine 9); chapter 5 link 1
  = 33 (Pray yuna->yuna 15, Potion yuna->yuna 10). `hitPercent` is 96 % for 37 of 53
  self-targeted heal/item abilities.
- `execute.ts` spends the item before `resolveAbility`, so an "evaded" X-Potion is lost.
- Enemy same-side heals in the shipped and registered chapters: Node Cura -> Leg is already 100 %
  (probe `zz-node.probe.ts`); Leblanc's White Wind is `canMiss: false`; every enemy revive is
  `misses-if-target-alive`, which returns before the hit check. So a guard keyed on the **side**,
  not on "party", changes no enemy behaviour that can happen today.

## 4. The change

In `hitPercent`, after the explicit `accuracy` / `canMiss` / `formula: 'none'` guards and before the
points race: **return 100 when `user.side === target.side` and the action is restorative** —
`flags` includes `heals`, or `formula === 'healing'`, or `category === 'item'` (the Alchemist stash
and every inventory item). That spelling matches `computeDamage`'s own `heals` test, so the two
cannot drift.

- Hostile actions on an ally (a Confused girl's Attack, Berserk) still roll: they are not
  restorative. Cross-side heals (none ship) still roll.
- Item spending before the roll: with the guard, no friendly item can be "evaded", so no item is
  lost to a miss on an ally. An item thrown at an enemy (none ships that can miss) keeps today's
  order; whether retail refunds it is unsourced and left alone.
- The damage preview (`previewHitChance`) reads the same function, so the card shows 100 % too.
- House rule 7: `formulas.ts` is at 399 lines. The hit check and criticals (§2.5 / §2.6) move to a
  new `src/battle/ffx2/hit.ts`, re-exported from `formulas.ts` so no importer changes.

## 5. Tests (each fails on today's code first)

`tests/unit/ffx2-ally-heal-accuracy.test.ts`, real data, no DOM:

- **A1** every restorative FFX-2 ability and item used by each girl of the chapter 4 and chapter 5
  builds on herself and on each ally is 100 %, including with the user blinded and the target at
  EVA Up x10.
- **A2** a hostile action on an ally still rolls (blinded Attack on an ally < 100 %), and §2.6's
  worked 88 % example is unchanged.
- **A3** engine run, 40 seeds chapter 4 + 40 seeds chapter 5 link 1, a driver that heals herself
  every turn: zero `miss` events whose source and target are both party members.

## 6. What moves, and how it is checked

| Risk | Check |
|---|---|
| Seeded replays move | They must, where a friendly heal rolled: a landed heal consumes no roll, so the stream shifts from the first friendly heal on. `tests/unit/ffx2-atb-golden.test.ts` is re-pinned with this reason written beside it. |
| Chapter 4/5 balance | Re-run `PYREFLY_MEASURE=1 tests/unit/ffx2-active-measure.test.ts`; D=0 must stay 40/40 in both chapters (a landed heal can only help the party; the seeded stream does shift, so medians may move). |
| Enemy behaviour | §3's probe: no shipped enemy same-side heal changes. |
| FFX | `git diff -- src/battle/ffx` stays empty; the full suite. |
