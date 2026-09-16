/**
 * The AI script contract.
 *
 * A script is a pure function from "whose turn is it, and what does the board
 * look like" to one {@link Command}. Returning `null` means the actor
 * deliberately passes — Seymour's alternation guard and the Mortiorchis's
 * charge turns both need that, and the engine still charges rank-3 recovery so
 * a pass costs a turn.
 *
 * Scripts are keyed by `EnemyDef.aiScriptId` (or `EnemyForm.aiScriptId`, which
 * wins when present), so a data agent can re-point a boss at a different
 * rotation without touching the engine.
 */

import type { AbilityId, Command, CombatantId, FFXCombatant } from '../../common/types.ts';
import type { Ctx } from '../state.ts';
import { rtOf } from '../state.ts';

/** Everything an AI script may read. */
export interface AiContext {
  ctx: Ctx;
  /** The enemy taking the turn. */
  self: FFXCombatant;
  /** Per-actor scratch memory, persisted for the battle. */
  memory: Record<string, number | string | boolean>;
}

/** One boss rotation. */
export type AiScript = (ai: AiContext) => Command | null;

const SCRIPTS = new Map<string, AiScript>();

/** Register a rotation under an `aiScriptId`. */
export function registerAiScript(id: string, script: AiScript): void {
  SCRIPTS.set(id, script);
}

/** Look up a rotation. */
export function getAiScript(id: string): AiScript | undefined {
  return SCRIPTS.get(id);
}

/** Every registered script id, for debugging. */
export function registeredAiScriptIds(): string[] {
  return [...SCRIPTS.keys()].sort();
}

/** Build an {@link AiContext} for an actor. */
export function aiContextFor(ctx: Ctx, self: FFXCombatant): AiContext {
  return { ctx, self, memory: rtOf(ctx, self.id).ai };
}

/** Read a numeric memory slot, defaulting to 0. */
export function num(memory: AiContext['memory'], key: string, fallback = 0): number {
  const v = memory[key];
  return typeof v === 'number' ? v : fallback;
}

/** Read a boolean memory slot. */
export function flag(memory: AiContext['memory'], key: string): boolean {
  return memory[key] === true;
}

/**
 * Build an ability command, falling back to a plain Attack when the ability is
 * not registered yet — the data agents are filling `src/data/ffx` concurrently
 * and a half-written table must not crash a battle.
 */
export function use(ai: AiContext, id: AbilityId, targets: CombatantId[] = []): Command {
  if (ai.ctx.content.ability(id)) return { kind: 'ability', id, targets };
  return { kind: 'attack', targets };
}

/** True when the ability exists in the registry. */
export function known(ai: AiContext, id: AbilityId): boolean {
  return ai.ctx.content.ability(id) !== undefined;
}
