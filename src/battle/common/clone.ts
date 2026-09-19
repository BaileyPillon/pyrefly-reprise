/**
 * One deep copy, for the seam where shipped data becomes live battle state.
 *
 * `ENEMY_GROUPS_BY_ID`, the party builds and the chapter trigger lists are
 * **module singletons**: `src/data/ffx/index.ts` and `src/data/ffx2/index.ts`
 * export the same `EnemyGroupDef` objects to every caller, and
 * `src/data/encounters.ts` hands the same `FFXPartyBuild` to every run of a
 * chapter. Both engines' `init()` used to copy those records field by field,
 * and both missed the same kind of leaf — the arrays and objects one level
 * further down. Audited by walking a freshly built `BattleState` and asking
 * which of its objects were **reference-identical** to something reachable
 * from the shipped records, every chapter leaked:
 *
 * | Chapter | Shared with the shipped data |
 * |---|---|
 * | 1, 2, 3 (FFX) | every member's `equipment.weapon.autoAbilities` and `equipment.armor.autoAbilities`; the boss's `enemy.rewards.steal` and `.bribe`; Braska's Final Aeon's `enemy.forms[1].statOverrides` |
 * | 4, 5 (FFX-2) | every girl's `dresspheres.abilitiesLearned`; the boss's whole `enemy.forms` array and whole `enemy.rewards` object |
 *
 * Nothing in the shipped engines writes through those particular leaves
 * *today*, which is why the bug reads as intermittent rather than constant —
 * but `advanceForm` already writes `forms[n].hp` on the FFX side, `hp.ts`
 * writes `part.stats.maxHp`, and `scripted.ts` writes the Mortiorchis's
 * `stats.maxHp` down the 4,000 / 3,000 / 2,000 / 1,000 Mortibsorption ladder.
 * One of those finding an uncloned leaf makes a battle's outcome depend on
 * what ran before it in the same process, which is exactly the class of defect
 * `docs/handoff/builda-flow.md` reported against Chapter 1 at a fixed seed.
 * A battle owns its own copy of its records, and the shipped data is
 * read-only.
 *
 * `structuredClone` where the runtime has it (Node 17+, every browser we
 * target), JSON otherwise — the same two-step `src/battle/ffx/intent.ts` and
 * `src/battle/ffx2/simulate.ts` already use for `BattleState`. Both are safe
 * here because every type this is applied to is JSON-pure: `EnemyGroupDef`,
 * `FFXPartyBuild`, `FFX2PartyBuild` and `MidBattleTrigger` hold only numbers,
 * strings, booleans, arrays and plain objects.
 */

/** A deep copy that shares no object with `value`. */
export function cloneData<T>(value: T): T {
  const structured = (globalThis as { structuredClone?: <V>(v: V) => V }).structuredClone;
  if (typeof structured === 'function') return structured(value);
  return JSON.parse(JSON.stringify(value)) as T;
}
