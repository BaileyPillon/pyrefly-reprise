/**
 * `A`, `B`, `C`... — the suffix FFX gives **duplicates of one enemy**, in
 * formation order inside that name group.
 *
 * It is not a formation index. A formation of Seymour Flux and Mortiorchis is
 * two different enemies, so neither carries a letter; a formation with two Yu
 * Pagodas shows "Yu Pagoda A" and "Yu Pagoda B" while Yu Yevon beside them
 * stays plain. Grouping is by **display name**, because that is the string the
 * letter is appended to on the CTB tile and on the targeting name plate — two
 * records that read the same on screen have to be told apart, and two that read
 * differently never need it.
 *
 * Read from the formation's **roster** (`state.enemyIds`), which holds every
 * enemy record whether it is standing, dead or sent, so one Pagoda dying never
 * renames the other (round 04 PR-0023). `turnQueue.ts#letterTags` caches this
 * per battle for the CTB tile; the move advisor and the strategy panel read the
 * same rule from state, so the card's "Slow → Yu Pagoda B" is the tile's and
 * the name plate's B (critic round 13 PR-0208).
 *
 * Pure and state-only, so `src/engine/tactics` can read it without an engine.
 * FFX only: FFX-2's ATB HUD names its own rows.
 */

import type { BattleState, CombatantId } from '../common/types.ts';

export function letterTagsOf(state: Readonly<BattleState>): Map<CombatantId, string> {
  const byName = new Map<string, CombatantId[]>();
  for (const id of state.enemyIds) {
    const e = state.combatants[id];
    if (e === undefined) continue;
    const group = byName.get(e.name);
    if (group) group.push(id);
    else byName.set(e.name, [id]);
  }
  const tags = new Map<CombatantId, string>();
  for (const group of byName.values()) {
    if (group.length < 2) continue; // a unique enemy never gains a letter
    group.forEach((id, i) => tags.set(id, String.fromCharCode(65 + i)));
  }
  return tags;
}
