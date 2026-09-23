/**
 * **Doublecast**, resolved: one Black Magic spell, cast twice, for one turn.
 *
 * Sources: `research/ffx-combat-core.md` §7.4 row 41 — *"Two Blk Magic casts at
 * a fixed rank 3"*, MP *"0 (+ both spells' MP)"* — and
 * `research/ffx-bfa-yu-yevon.md` §4.2, whose preset recommendation grants
 * *"Doublecast + Firaga/Thundaga"* `[verified: 2 sources]`; §3.4.1's worked
 * example is *"Doublecast Firaga/Firaga"*, two damage instances in one action.
 *
 * Moved out of `execute.ts` (which routes here) when the self-aim defect was
 * fixed [critic round 09, PR-0125]. The command the menu offered for the
 * Doublecast row carried the row's own self placeholder as its aim —
 * `targets: ['lulu']`, no `wrappedId` — and this resolver took both the
 * fallback spell and that aim literally: Firaga twice on Lulu, a self-KO on
 * seeds 1 and 7. The menu now asks for the spell and its target
 * (`ui/ffx/CommandMenu.ts`, `AvailableCommand.wrapsCategory`); {@link aimFor}
 * is the engine's own guarantee that an offensive spell is never pointed back
 * at its caster by a self-only placeholder, whoever submitted it.
 *
 * **FFX only** [AGENTS.md rule 14]: Doublecast is Lulu's FFX ability, and the
 * only build that grants it is Chapter 3's `dreams-end`.
 *
 * Pure and deterministic like the rest of `battle/`: the one fallback pick uses
 * the battle's seeded RNG, exactly as `resolveTargets` does for an empty
 * aim.
 */

import type { AbilityDef, CombatantId, FFXCombatant, Targeting } from '../common/types.ts';
import { type Ctx, abilityOf, rankOf } from './state.ts';
import { mpCostFor, resolveAbility } from './abilities.ts';
import { applyMpDelta } from './hp.ts';
import { validTargets } from './targeting.ts';
import type { ExecutionResult } from './execute.ts';

/** Targeting values that point at the caster's opponents. */
const AIMS_AT_FOES = new Set<Targeting>(['single-enemy', 'all-enemies', 'random-enemy']);

/**
 * Resolve one Doublecast.
 *
 * `wrapped` is the spell the caller chose (`AbilityCommand.wrappedId`). It must
 * be Black Magic the caster has learned; a command without a usable one falls
 * back to the strongest spell the caster can pay for twice rather than being
 * refused, because refusing a row the menu offered is how a headless caller
 * ends up resubmitting it for ever. Both casts pay their own MP, as the ability
 * record's `extra.note` requires, and the pair costs a single rank-3 turn.
 */
export function resolveDoublecast(
  ctx: Ctx,
  actor: FFXCombatant,
  def: AbilityDef,
  wrapped: string | undefined,
  submitted: readonly CombatantId[],
): ExecutionResult {
  let spell = wrapped !== undefined ? abilityOf(ctx, wrapped) : undefined;
  if (spell && (spell.category !== 'blackmagic' || !actor.learnedAbilityIds.includes(spell.id))) spell = undefined;
  if (!spell) spell = strongestAffordableBlackMagic(ctx, actor);
  if (!spell) {
    ctx.emit({ type: 'message', text: `${actor.name} has no spell to double`, kind: 'system' });
    return { rank: rankOf(def), damageDealt: 0, def };
  }
  const targets = aimFor(ctx, actor, spell, submitted);
  const cost = mpCostFor(actor, spell);
  ctx.emit({
    type: 'action-start',
    actorId: actor.id,
    command: { kind: 'ability', id: def.id, targets: targets.slice(), wrappedId: spell.id },
    abilityId: spell.id,
    abilityName: `${def.name}: ${spell.name}`,
    targets: targets.slice(),
  });
  // Two casts. One id in `targets` sends both there; two send one each, which
  // is how the chapter's line takes both Yu Pagodas off the board in one turn
  // (§1.4). The spell is resolved from its own record, so everything it
  // carries — `canMiss: false` for all Black Magic [AGENTS.md hard rule 5],
  // its element, its reflectability — rides through unchanged.
  const aims: CombatantId[][] = targets.length >= 2 ? [[targets[0]!], [targets[1]!]] : [targets.slice(), targets.slice()];
  let dealt = 0;
  for (const at of aims) {
    if (cost > 0) {
      if (actor.mp < cost) break;
      applyMpDelta(ctx, actor, cost, actor.id);
    }
    dealt += resolveAbility(ctx, actor, spell, at);
  }
  ctx.emit({ type: 'action-end', actorId: actor.id });
  return { rank: rankOf(def), damageDealt: dealt, def: spell };
}

/**
 * Where the two casts go.
 *
 * **The safety net [PR-0125].** The Doublecast row targets its own caster
 * (`targeting: 'self'`) because the enemy is chosen inside it, so a caller that
 * submits the row as offered hands over `[casterId]` — or nothing. For a spell
 * that points at the caster's opponents that aim is a placeholder, not a
 * choice, and it is replaced by the spell's own legal targets: all of them for
 * a spell that hits every foe, otherwise one foe picked with the battle's seeded
 * RNG (the rule `resolveTargets` already applies to an empty aim). Any other aim
 * — a real foe, or an ally someone chose on purpose — is left exactly as
 * submitted.
 */
export function aimFor(
  ctx: Ctx,
  actor: FFXCombatant,
  spell: AbilityDef,
  submitted: readonly CombatantId[],
): CombatantId[] {
  if (!AIMS_AT_FOES.has(spell.targeting)) return submitted.slice();
  if (!submitted.every((id) => id === actor.id)) return submitted.slice();
  const legal = validTargets(ctx, actor, spell);
  if (legal.length === 0) return [];
  return spell.targeting === 'all-enemies' ? legal : [ctx.rng.pick(legal)];
}

/** The biggest Black Magic spell this caster knows and can pay for twice. */
function strongestAffordableBlackMagic(ctx: Ctx, actor: FFXCombatant): AbilityDef | undefined {
  let best: AbilityDef | undefined;
  for (const id of actor.learnedAbilityIds) {
    const d = abilityOf(ctx, id);
    if (!d || d.category !== 'blackmagic' || d.power <= 0) continue;
    if (mpCostFor(actor, d) * 2 > actor.mp) continue;
    if (!best || d.power > best.power) best = d;
  }
  return best;
}
