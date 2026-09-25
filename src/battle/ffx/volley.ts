/**
 * **Volleys**: one enemy turn, several spells.
 *
 * Seymour Omnis casts **four spells a turn**, one per Mortiphasm disc, each of
 * its disc's element, at -ra or -ga by how many discs show it
 * [ffx-seymour-omnis §4.1, verified: 4 sources]. None of the engine's existing
 * seams fits (`docs/plans/chapter-omnis-review.md` O-G3):
 *
 * - an `AiScript` returns **one** `Command`;
 * - Doublecast (`./doublecast.ts`) resolves one Black Magic spell twice;
 * - ordered actions (`./orders.ts`) make **another** actor act with **its own**
 *   stats, and a disc's Magic is 1.
 *
 * So a volley is a row whose `extra.volley` is `true`. The AI submits the row;
 * {@link resolveVolley} asks the row's registered planner
 * (`./volley-planners.ts`) for the casts and resolves each one as an ordinary
 * action of the caster — its own `action-start` / `action-end`, the caster's
 * Magic, the spell's own element, reflectability and shatter — so the
 * presenter plays four spells and the damage chain is the shipped one. The
 * whole volley costs the caster **one** turn at the row's rank.
 *
 * A cast whose planned target has fallen by the time it resolves goes to a
 * random living member instead (the row's own empty-aim rule); the volley
 * stops if the caster falls to a bounced spell. Both are our reading.
 *
 * Inert unless a row sets `extra.volley`: no shipped row before Chapter XII
 * does, so every other battle's event log is unchanged. Deterministic and
 * DOM-free [AGENTS.md hard rule 1]. **FFX only** [AGENTS.md rule 14].
 */

import type { AbilityDef, CombatantId, FFXCombatant } from '../common/types.ts';
import { type Ctx, abilityOf, isAlive, rankOf, tryActor } from './state.ts';
import { resolveAbility } from './abilities.ts';
import type { ExecutionResult } from './execute.ts';
import { VOLLEY_KEY, volleyPlanner } from './volley-planners.ts';

export { VOLLEY_KEY };

/** True for a row the executor must resolve as a volley. */
export function isVolley(def: AbilityDef): boolean {
  return def.extra?.[VOLLEY_KEY] === true;
}

/** Resolve one volley row for `actor`. */
export function resolveVolley(ctx: Ctx, actor: FFXCombatant, def: AbilityDef): ExecutionResult {
  const plan = volleyPlanner(def.id)?.(ctx, actor) ?? [];
  let dealt = 0;
  for (const cast of plan) {
    if (!isAlive(actor)) break;
    const spell = abilityOf(ctx, cast.abilityId);
    if (!spell) continue;
    const planned = tryActor(ctx, cast.targetId);
    // A fallen target: the spell's own empty-aim rule picks a living one.
    const aim: CombatantId[] = planned && isAlive(planned) ? [planned.id] : [];
    ctx.emit({
      type: 'action-start',
      actorId: actor.id,
      command: { kind: 'ability', id: spell.id, targets: aim.slice() },
      abilityId: spell.id,
      abilityName: spell.name,
      targets: aim.slice(),
    });
    dealt += resolveAbility(ctx, actor, spell, aim);
    ctx.emit({ type: 'action-end', actorId: actor.id });
  }
  return { rank: rankOf(def), damageDealt: dealt, def };
}
