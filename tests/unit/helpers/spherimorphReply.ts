/**
 * Helpers of the hidden Spherimorph chapter's script tests (FFX only): run one command on it through the real damage path and read what the script asked for (`replyTo`). Test-only.
 */

import type { AbilityDef } from '../../../src/battle/common/types.ts';
import { resolveAbility } from '../../../src/battle/ffx/abilities.ts';
import { peekReactions, takeReaction } from '../../../src/battle/ffx/ai/hooks.ts';
import { SM_ROWS } from '../../../src/battle/ffx/ai/spherimorph-rules.ts';
import { SM, actor, ctxOf, flags, newEngine, stateOf } from './spherimorphDrive.ts';

export type Engine = ReturnType<typeof newEngine>;

/** What the script queued after one action on it: the row, who it is aimed at, and the state afterwards. */
export interface Reply {
  readonly kind: 'none' | 'attacker' | 'front' | 'shift';
  readonly row?: string;
  readonly targets?: readonly string[];
  readonly state: number;
  readonly shifts: number;
  /** What the hit did to its HP, from the battle's own log: `+` damage, `-` healed (an absorbed element), `0` no HP event. */
  readonly sign: '+' | '-' | '0';
}

export function drain(engine: Engine): void {
  const ctx = ctxOf(engine);
  while (takeReaction(ctx) !== undefined);
}

/** Run one command on Spherimorph through the real damage path and read what the script asked for. */
export function replyTo(engine: Engine, userId: string, def: AbilityDef): Reply {
  const ctx = ctxOf(engine);
  drain(engine);
  const logBefore = engine.state().log.length;
  resolveAbility(ctx, actor(engine, userId), def, [SM]);
  const amounts = engine.state().log.slice(logBefore).flatMap((e) => (e.type === 'damage' && e.targetId === SM ? [e.amount] : []));
  const sign: Reply['sign'] = amounts.length === 0 ? '0' : amounts.some((a) => a < 0) ? '-' : '+';
  const queued = peekReactions(ctx);
  const state = stateOf(engine);
  const shifts = (flags(engine)['sm.shifts'] as number) ?? 0;
  drain(engine);
  const first = queued.find((r) => r.kind === 'command'); // a hint banner (an 'emit') may be queued before the answer
  if (first === undefined || first.kind !== 'command') return { kind: 'none', state, shifts, sign };
  const command = first.command as { id?: string; targets: string[] };
  const row = command.id;
  if (row === SM_ROWS.shift) return { kind: 'shift', row, state, shifts, sign };
  const monsterSide = row !== undefined && row.startsWith('spherimorph-');
  return { kind: monsterSide ? 'front' : 'attacker', ...(row !== undefined ? { row } : {}), targets: command.targets, state, shifts, sign };
}

export const ability = (engine: Engine, id: string): AbilityDef => {
  const def = ctxOf(engine).content.ability(id);
  if (!def) throw new Error(`no ability ${id}`);
  return def;
};
