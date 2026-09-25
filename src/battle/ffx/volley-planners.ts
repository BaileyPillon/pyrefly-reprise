/**
 * **Volley planners**: who decides what a volley row casts.
 *
 * A volley is one enemy turn that casts several spells, each with its own row,
 * element and target, all with the caster's own stats (`./volley.ts`). The row
 * itself carries no spells; the encounter that owns it registers a planner
 * here, keyed by the row's id, and the resolver asks it at cast time.
 *
 * Kept apart from the resolver on purpose: this module imports nothing but
 * types, so an AI script can register its planner at load time without
 * pulling the resolver (and the damage chain behind it) into an import cycle.
 *
 * Pure data plumbing, DOM-free and deterministic [AGENTS.md hard rule 1].
 * **FFX only** [AGENTS.md rule 14]: Chapter XII, Seymour Omnis, is the one user.
 */

import type { AbilityId, CombatantId, FFXCombatant } from '../common/types.ts';
import type { Ctx } from './state.ts';

/** One cast of a volley: the row it resolves and the target it is aimed at. */
export interface VolleyCast {
  abilityId: AbilityId;
  targetId: CombatantId;
}

/** Plans a volley for `caster` on the live board. May draw from `ctx.rng`. */
export type VolleyPlanner = (ctx: Ctx, caster: FFXCombatant) => VolleyCast[];

/** `AbilityDef.extra` key: `true` marks a volley row. */
export const VOLLEY_KEY = 'volley';

const PLANNERS = new Map<AbilityId, VolleyPlanner>();

/** Register the planner for one volley row. */
export function registerVolleyPlanner(abilityId: AbilityId, planner: VolleyPlanner): void {
  PLANNERS.set(abilityId, planner);
}

/** The planner for a volley row, if one is registered. */
export function volleyPlanner(abilityId: AbilityId): VolleyPlanner | undefined {
  return PLANNERS.get(abilityId);
}
