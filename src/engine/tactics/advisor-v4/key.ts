/**
 * **Advisor v4: which board a search answered.** The worker searches a board it reached on its own
 * copy of the battle (pre-started at the previous press); the card may show that answer only on
 * the very board the menu opened on. The key reads everything the card reads: the engine's own
 * event counter (`nextSeq`: a board that moved cannot share it), the turn, the seed, whose menu,
 * every combatant's HP, MP and statuses, and the menu's rows.
 *
 * Game case: **both** (a reading of the shared `BattleState`).
 */

import type { AvailableCommand, BattleState, CombatantId } from '../../../battle/common/types.ts';

function mix(h: number, s: string): number {
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  return h;
}

/** A string that is equal for two boards exactly when the card would read them the same. */
export function boardKey(state: Readonly<BattleState>, actorId: CombatantId, commands: readonly AvailableCommand[]): string {
  let h = 2166136261;
  for (const id of Object.keys(state.combatants).sort()) {
    const c = state.combatants[id]!;
    h = mix(h, `${id}:${c.hp}:${c.mp}:${c.alive === false ? 0 : 1}:${Object.keys(c.statuses).sort().join(',')};`);
  }
  for (const r of commands) {
    h = mix(h, `${JSON.stringify(r.command)}:${r.enabled ? 1 : 0}:${r.validTargets.join(',')};`);
  }
  return `${state.game}|${state.seed}|${state.nextSeq}|${state.turn}|${actorId}|${h.toString(16)}`;
}
