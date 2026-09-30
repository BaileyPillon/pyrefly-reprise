/**
 * The target plate's note for a party member who is a living **Zombie**. **FFX only** (FFX-2's
 * sources and data define no Zombie; `FFX2StatusId` has none).
 *
 * fb-0929 (Bailey's friend: "Hi potion killed kimahri instead of healing lol", Chapter I). The
 * engine was right: a Zombie takes every HP restorative as damage and every revival as a KO
 * (research/ffx-combat-core.md: "Hi-Potion on a Zombie therefore deals exactly 1 000 damage";
 * "revival items *kill* it"). The plate said only "Kimahri". The documented help contract for "a
 * party target" is "name, and any statuses spelled out in words, not icons"
 * (research/visual-bible.md §3.16), so a Zombie target now reads "Zombie", and when the command
 * would hurt it, what it will do: the engine's own preview of this exact command on this exact
 * board (`simulateFFXCommand`, the real resolve path), never a number made up here.
 */

import type { AvailableCommand, BattleState, Command, CombatantId } from '../../battle/common/types.ts';
import { simulateFFXCommand } from '../../battle/ffx/simulate.ts';

/** Undefined unless `targetId` is a living Zombie on the party's side. */
export function zombieTargetNote(
  state: Readonly<BattleState> | null | undefined,
  actorId: CombatantId | null | undefined,
  targetId: CombatantId,
  cmd: AvailableCommand,
): string | undefined {
  const target = state?.combatants[targetId];
  if (!state || !target || target.side === 'enemy' || !target.alive) return undefined;
  if (!(target.statuses as Record<string, unknown>)['zombie']) return undefined;
  if (!actorId || state.game !== 'ffx') return 'Zombie';

  const command = { ...cmd.command, targets: [targetId] } as Command;
  let out: ReturnType<typeof simulateFFXCommand> = null;
  try {
    out = simulateFFXCommand(state, actorId, command, { roll: 'mid' });
  } catch {
    out = null;
  }
  if (!out) return 'Zombie';
  if (out.kills.includes(targetId)) return 'Zombie: this KOs';
  const lost = out.hpDelta[targetId] ?? 0;
  if (lost > 0) {
    // An item's number is fixed; a spell's varies with the damage roll, so it reads as "about".
    const about = cmd.category === 'item' ? '' : '~';
    return `Zombie: ${about}${lost.toLocaleString('en-US')} damage`;
  }
  return 'Zombie';
}
