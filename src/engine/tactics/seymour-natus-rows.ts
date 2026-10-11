/**
 * Row readers shared by Chapter X's lines (`./seymour-natus.ts`, `./seymour-natus-detours.ts`, `./seymour-natus-mirror.ts`).
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. A line only picks among the rows the engine offered: these helpers find a
 * row, aim it, and fall back to Defend, exactly as `./seymour-natus.ts` always did (they were its private helpers).
 */

import type { AvailableCommand, Command, CombatantId } from '../../battle/common/types.ts';

/** Seymour Natus's combatant id, mirrored from `src/battle/ffx/ai/seymour-natus-rules.ts` (`NATUS_ID`). */
export const SEYMOUR_NATUS_ID = 'seymour-natus';
/** Mortibody's id: listed with Natus so the tactic and the guide claim the same two ids. */
export const MORTIBODY_ID = 'mortibody';

/** The first enabled row of `kind` (and `id`, when given) that can aim at `target`, when given. */
export function offered(commands: AvailableCommand[], kind: Command['kind'], id?: string, target?: CombatantId): AvailableCommand | undefined {
  return commands.find(
    (c) =>
      c.enabled &&
      c.command.kind === kind &&
      (id === undefined || ('id' in c.command && c.command.id === id)) &&
      (target === undefined || c.validTargets.includes(target)),
  );
}

export function use(kind: 'ability' | 'item', id: string, target: CombatantId): Command {
  return { kind, id, targets: [target] } as Command;
}

export function defend(commands: AvailableCommand[]): Command {
  const r = offered(commands, 'defend');
  return r ? ({ ...r.command, targets: [] } as Command) : ({ kind: 'defend', targets: [] } as Command);
}

/** Attack Natus, or defend when the row is not there. */
export function hitNatus(commands: AvailableCommand[]): Command {
  return offered(commands, 'attack', undefined, SEYMOUR_NATUS_ID)
    ? ({ kind: 'attack', targets: [SEYMOUR_NATUS_ID] } as Command)
    : defend(commands);
}

/** The switch row that brings `inId` in for the actor, if it is offered. The incoming member takes the turn at once. */
export function switchTo(commands: AvailableCommand[], inId: string): Command | null {
  const swap = commands.find(
    (c) => c.enabled && c.command.kind === 'switch' && (c.command.extra as { inId?: string } | undefined)?.inId === inId,
  );
  return swap ? swap.command : null;
}
