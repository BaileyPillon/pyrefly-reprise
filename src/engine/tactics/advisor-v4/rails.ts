/**
 * **Advisor v4: the in-flight rails' readings** (moved from `critic/bench/advisor-v3/metrics.ts`,
 * which re-exports them, so the scorecard and the game read one definition).
 *
 * - `simulateFor`: one command on the engines' own throwaway copy (`simulate*Command`, mid roll).
 * - `supportOnly`: a move that only helps allies (no damage, no status on an enemy).
 * - `duplicate`: a support move whose every effect a command in flight already delivers.
 *
 * Game case: **both** (`simulateFor`); the duplicate readings only ever fire on FFX-2, the only
 * game with a command in flight while another menu is open [research/ffx2-combat-core.md §1.1].
 */

import type { BattleState, Command, CombatantId } from '../../../battle/common/types.ts';
import type { SimOutcome } from '../../../battle/ffx/simulate.ts';
import { simulateFFXCommand } from '../../../battle/ffx/simulate.ts';
import { simulateFFX2Command } from '../../../battle/ffx2/simulate.ts';
import type { AdvisorOptions } from '../advisor.ts';

export function simulateFor(
  state: Readonly<BattleState>,
  actorId: CombatantId,
  command: Command,
  options: AdvisorOptions,
): SimOutcome | null {
  try {
    if (state.game === 'ffx2') {
      return simulateFFX2Command(state, actorId, command, {
        roll: 'mid',
        ...(options.ffx2?.abilities ? { abilities: options.ffx2.abilities } : {}),
        ...(options.ffx2?.items ? { items: options.ffx2.items } : {}),
      }) as SimOutcome | null;
    }
    return simulateFFXCommand(state, actorId, command, { roll: 'mid', ...(options.ffxContent ? { content: options.ffxContent } : {}) });
  } catch {
    return null;
  }
}

export const isAlly = (s: Readonly<BattleState>, id: CombatantId): boolean => s.combatants[id]?.side !== 'enemy';

export function supportOnly(s: Readonly<BattleState>, o: SimOutcome): boolean {
  if (o.damageToEnemies > 0) return false;
  if (o.statusChanges.some((c) => c.applied && !isAlly(s, c.targetId))) return false;
  const heals = Object.entries(o.hpDelta).some(([id, d]) => d < 0 && isAlly(s, id));
  return heals || o.revives.length > 0 || o.statusChanges.some((c) => isAlly(s, c.targetId));
}

export function duplicate(s: Readonly<BattleState>, top: SimOutcome, pend: SimOutcome[]): boolean {
  if (!supportOnly(s, top)) return false;
  const raised = new Set(pend.flatMap((p) => p.revives));
  const buffs = new Set(pend.flatMap((p) => p.statusChanges.filter((c) => c.applied).map((c) => `${c.targetId}:${c.status}`)));
  const cures = new Set(pend.flatMap((p) => p.statusChanges.filter((c) => !c.applied).map((c) => `${c.targetId}:${c.status}`)));
  if (!top.revives.every((id) => raised.has(id))) return false;
  for (const c of top.statusChanges) {
    if (!isAlly(s, c.targetId)) continue;
    if (!(c.applied ? buffs : cures).has(`${c.targetId}:${c.status}`)) return false;
  }
  for (const [id, d] of Object.entries(top.hpDelta)) {
    if (d >= 0 || !isAlly(s, id) || top.revives.includes(id)) continue;
    const u = s.combatants[id];
    if (!u || u.alive === false) continue;
    const missing = u.stats.maxHp - u.hp;
    const coming = pend.reduce((n, p) => n + Math.max(0, -(p.hpDelta[id] ?? 0)), 0);
    if (coming < missing) return false;
  }
  return true;
}
