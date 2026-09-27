import type { BattleState, CombatantId } from '../../battle/common/types.ts';
import { ENEMY_GROUPS_BY_ID } from '../../data/ffx2/index.ts';

/**
 * The name a player-facing plate prints for a combatant: its name on the board,
 * else the name its FFX-2 data record gives it, else `''`. **Never the raw id**
 * (critic round 13 PR-0175: a plate read `vegnagun-leg` on link 5, where the Leg
 * is no longer on the board).
 *
 * **FFX-2 only** [AGENTS.md rule 14]: the FFX-2 HUD's plates and cursor.
 */
export function displayNameOf(state: Readonly<BattleState> | null | undefined, id: CombatantId | null | undefined): string {
  if (!id) return '';
  const onBoard = state?.combatants[id]?.name;
  if (onBoard) return onBoard;
  return dataNames().get(id) ?? '';
}

let cache: Map<string, string> | null = null;

/** Every FFX-2 enemy and part id to its data name, built once. */
function dataNames(): Map<string, string> {
  if (cache) return cache;
  cache = new Map();
  for (const group of Object.values(ENEMY_GROUPS_BY_ID)) {
    for (const e of [...group.enemies, ...(group.parts ?? [])]) {
      if (!cache.has(e.id) && e.name) cache.set(e.id, e.name);
    }
  }
  return cache;
}
