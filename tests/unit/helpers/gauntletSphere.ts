/**
 * Helpers of the hidden Gauntlet chapter's Greater Sphere tests (FFX only; chapter 54, act 5): an engine on its formation, the state set by hand, and `replyTo`, which runs one command on it through the real damage
 * path and reads what the script asked for. The pattern of `spherimorphReply.ts`. Test-only.
 */

import type { AbilityDef, BattleEngine, FFXCombatant } from '../../../src/battle/common/types.ts';
import { resolveAbility } from '../../../src/battle/ffx/abilities.ts';
import { peekReactions, takeReaction } from '../../../src/battle/ffx/ai/hooks.ts';
import { applyState } from '../../../src/battle/ffx/ai/spherimorph-rules.ts';
import { GAUNTLET_ROWS as ROW, SPHERE_SHIFTS_FLAG, SPHERE_STATE_FLAG } from '../../../src/battle/ffx/ai/gauntlet-rules.ts';
import { actor, ctxOf, flags, newEngine } from './gauntletDrive.ts';
import type { SphereReply } from './gauntletSphereMatrix.ts';

export const SPHERE = 'greater-sphere';
export type Engine = ReturnType<typeof newEngine>;

export const sphereEngine = (seed = 1): Engine => newEngine(seed, 'greater-sphere');
export const sphere = (engine: BattleEngine): FFXCombatant => actor(engine, SPHERE);
export const stateOf = (engine: BattleEngine): number => flags(engine)[SPHERE_STATE_FLAG] as number;
export const shiftsOf = (engine: BattleEngine): number => (flags(engine)[SPHERE_SHIFTS_FLAG] as number | undefined) ?? 0;

/** Set the state the way the script does (flag and affinities), so a test starts from a known weakness. */
export function setState(engine: BattleEngine, state: number): void {
  flags(engine)[SPHERE_STATE_FLAG] = state;
  applyState(sphere(engine), state);
}

/** Drop whatever reactions the last action queued. */
export function drain(engine: BattleEngine): void {
  const ctx = ctxOf(engine);
  while (takeReaction(ctx) !== undefined);
}

export const abilityOf = (engine: BattleEngine, id: string): AbilityDef => {
  const def = ctxOf(engine).content.ability(id);
  if (!def) throw new Error(`no ability ${id}`);
  return def;
};

/** What the script queued after one action on it. */
export interface Reply {
  /** The matrix's notation: `ultima:front`, `press:front`, `shift`, `flare:one`, `<aga>:front` (the player-side row) or `none`. */
  readonly reply: SphereReply | string;
  readonly row?: string;
  readonly targets?: readonly string[];
  readonly state: number;
  readonly shifts: number;
  /** What the hit did to its HP, from the battle's own log: `+` damage, `-` healed (an absorbed element), `0` no HP event. */
  readonly sign: '+' | '-' | '0';
}

const AGA = new Set<string>([ROW.firaga, ROW.blizzaga, ROW.thundaga, ROW.waterga]);

/** Run one command on the Greater Sphere through the real damage path and read what the script asked for. */
export function replyTo(engine: Engine, userId: string, def: AbilityDef): Reply {
  const ctx = ctxOf(engine);
  drain(engine);
  const logBefore = engine.state().log.length;
  resolveAbility(ctx, actor(engine, userId), def, [SPHERE]);
  const amounts = engine.state().log.slice(logBefore).flatMap((e) => (e.type === 'damage' && e.targetId === SPHERE ? [e.amount] : []));
  const sign: Reply['sign'] = amounts.length === 0 ? '0' : amounts.some((a) => a < 0) ? '-' : '+';
  const queued = peekReactions(ctx);
  const state = stateOf(engine);
  const shifts = shiftsOf(engine);
  drain(engine);
  const first = queued.find((r) => r.kind === 'command');
  if (first === undefined || first.kind !== 'command') return { reply: 'none', state, shifts, sign };
  const command = first.command as { id?: string; targets: string[] };
  const row = command.id ?? '';
  const out = { row, targets: command.targets, state, shifts, sign };
  if (row === ROW.elementalShift) return { reply: 'shift', ...out };
  if (row === ROW.ultima) return { reply: 'ultima:front', ...out };
  if (row === ROW.hydraulicPress) return { reply: 'press:front', ...out };
  if (row === ROW.flare) return { reply: 'flare:one', ...out };
  if (AGA.has(row)) return { reply: `${row}:front`, ...out };
  return { reply: `(${row})`, ...out };
}
