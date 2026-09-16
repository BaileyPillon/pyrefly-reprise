/**
 * Turn-boundary effects and automatic reactions.
 *
 * Regen pays out at the **start of any unit's turn** — not only the carrier's —
 * which is what makes the `+100` addend matter and what the Yunalesca fight
 * weaponises against Zombied party members [ffx-combat-core §4.3].
 */

import type { AbilityDef, CombatantId, FFXCombatant, ItemId } from '../common/types.ts';
import { idiv } from './math.ts';
import { type Ctx, allCombatants, has, isAlive, livingFriendlies, onField, statusOf, tryActor } from './state.ts';
import { dealDamage, healOutsideChain, koActor } from './hp.ts';
import { clearUntilNextTurnStatuses, refreshCriticalStatus, removeStatus, tickDurationStatuses } from './statuses.ts';
import { hasAuto } from './equipment.ts';
import { onTurnStartGauge } from './overdrive.ts';
import { ATTACK_ABILITY_ID } from './registry.ts';

/** Potions Auto-Potion reaches for, weakest first [ffx-combat-core §9]. */
const AUTO_POTION_ORDER: readonly ItemId[] = ['potion', 'hi-potion', 'x-potion'];

/** Revival items Auto-Phoenix reaches for. */
const AUTO_PHOENIX_ORDER: readonly ItemId[] = ['phoenix-down', 'mega-phoenix'];

/** Status cures Auto-Med reaches for, and what each fixes. */
const AUTO_MED_ORDER: ReadonlyArray<readonly [ItemId, string]> = [
  ['eye-drops', 'darkness'],
  ['echo-screen', 'silence'],
  ['antidote', 'poison'],
  ['holy-water', 'zombie'],
  ['remedy', 'any'],
];

/**
 * Regen's payout: `HP += floor(elapsedTicks * maxHP / 256) + 100`, for every
 * unit carrying it, at the start of any unit's turn. The sign flips on a
 * Zombie, which is the attrition engine of the Yunalesca fight.
 */
export function payRegen(ctx: Ctx, elapsedTicks: number): void {
  for (const c of allCombatants(ctx)) {
    if (!has(c, 'regen') || !isAlive(c)) continue;
    const amount = idiv(elapsedTicks * c.stats.maxHp, 256) + 100;
    if (has(c, 'zombie')) {
      dealDamage(ctx, c, amount, { element: 'none', crit: false, hitIndex: 0, hitCount: 1 });
    } else {
      healOutsideChain(ctx, c, amount, 'regen');
    }
  }
}

/** Everything that happens as a combatant's turn opens. */
export function onTurnStart(ctx: Ctx, actor: FFXCombatant, elapsedTicks: number): void {
  payRegen(ctx, elapsedTicks);
  clearUntilNextTurnStatuses(ctx, actor);
  refreshCriticalStatus(ctx, actor);

  // Doom counts down on the victim's own turn, even while asleep or skipping.
  const doom = statusOf(actor, 'doom');
  if (doom && doom.turnsRemaining !== null) {
    doom.turnsRemaining -= 1;
    ctx.emit({ type: 'status-tick', targetId: actor.id, status: 'doom', remaining: doom.turnsRemaining });
    if (doom.turnsRemaining <= 0) {
      removeStatus(ctx, actor, 'doom', 'expired');
      koActor(ctx, actor, actor.id);
      return;
    }
  }

  const soleSurvivor = actor.side !== 'enemy' && livingFriendlies(ctx).length === 1;
  onTurnStartGauge(ctx, actor, soleSurvivor);

  // A Threatened enemy's Threaten drops when its own turn comes round.
  const threaten = statusOf(actor, 'threaten');
  if (threaten) removeStatus(ctx, actor, 'threaten', 'expired');
}

/** Everything that happens as a combatant's turn closes. */
export function onTurnEnd(ctx: Ctx, actor: FFXCombatant): void {
  tickDurationStatuses(ctx, actor);

  // Poison: `maxHP // 4` for characters; enemies use their own percentage.
  if (has(actor, 'poison') && isAlive(actor)) {
    const percent = actor.enemy?.poisonTickPercent;
    const amount =
      percent !== undefined ? idiv(actor.stats.maxHp * percent, 100) : idiv(actor.stats.maxHp, 4);
    if (amount > 0) {
      dealDamage(ctx, actor, amount, { element: 'none', crit: false, hitIndex: 0, hitCount: 1 });
    }
  }
}

/** Does this combatant have a counter that fires against `def`? */
function counterAbilityFor(c: FFXCombatant, def: AbilityDef): string | undefined {
  if (def.damageType === 'physical') {
    if (hasAuto(c, 'counterattack') || hasAuto(c, 'evade-and-counter')) return 'counterattack';
  }
  if (def.damageType === 'magical' && hasAuto(c, 'magic-counter')) return 'magic-counter';
  return undefined;
}

/** The first item in `order` the party actually has. */
function firstAvailable(ctx: Ctx, order: readonly ItemId[]): ItemId | undefined {
  for (const id of order) {
    if ((ctx.rt.inventory.get(id) ?? 0) > 0) return id;
  }
  return undefined;
}

function consumeItem(ctx: Ctx, id: ItemId): boolean {
  const count = ctx.rt.inventory.get(id) ?? 0;
  if (count <= 0) return false;
  ctx.rt.inventory.set(id, count - 1);
  return true;
}

/**
 * Automatic reactions after an action resolved: Counterattack, Magic Counter,
 * Auto-Potion, Auto-Med and Auto-Phoenix. All fire with `ctb = 0`, so they cost
 * no turn [ffx-combat-core §9].
 *
 * Returns the counter-attacks to resolve; the engine runs them so that
 * `abilities.ts` does not have to import the turn loop.
 */
export function collectReactions(
  ctx: Ctx,
  attacker: FFXCombatant,
  def: AbilityDef,
  affected: readonly CombatantId[],
): Array<{ actorId: CombatantId; targetId: CombatantId; abilityId: string; cause: string }> {
  const out: Array<{ actorId: CombatantId; targetId: CombatantId; abilityId: string; cause: string }> = [];
  if (def.flags.includes('is-counter')) return out;

  for (const id of affected) {
    const c = tryActor(ctx, id);
    if (!c || !onField(c)) continue;

    // Auto-Potion: damage left the wearer below 50% of max HP.
    if (isAlive(c) && hasAuto(c, 'auto-potion') && c.hp * 2 < c.stats.maxHp) {
      const item = firstAvailable(ctx, AUTO_POTION_ORDER);
      if (item && consumeItem(ctx, item)) {
        out.push({ actorId: c.id, targetId: c.id, abilityId: item, cause: 'auto-potion' });
        continue;
      }
    }
    // Auto-Med: a curable ailment landed.
    if (isAlive(c) && hasAuto(c, 'auto-med')) {
      for (const [item, status] of AUTO_MED_ORDER) {
        if (status !== 'any' && !has(c, status as never)) continue;
        if ((ctx.rt.inventory.get(item) ?? 0) <= 0) continue;
        if (consumeItem(ctx, item)) {
          out.push({ actorId: c.id, targetId: c.id, abilityId: item, cause: 'auto-med' });
          break;
        }
      }
    }
    // Counterattack / Magic Counter, aimed back at the aggressor.
    const counter = counterAbilityFor(c, def);
    if (counter && isAlive(c) && isAlive(attacker) && attacker.id !== c.id) {
      out.push({ actorId: c.id, targetId: attacker.id, abilityId: ATTACK_ABILITY_ID, cause: counter });
    }
  }

  // Auto-Phoenix: an ally is KO'd and the wearer did not die to the same blow.
  for (const c of livingFriendlies(ctx)) {
    if (!hasAuto(c, 'auto-phoenix')) continue;
    const downed = ctx.state.activeIds
      .map((id) => tryActor(ctx, id))
      .find((a): a is FFXCombatant => a !== undefined && !isAlive(a) && onField(a));
    if (!downed) continue;
    const item = firstAvailable(ctx, AUTO_PHOENIX_ORDER);
    if (item && consumeItem(ctx, item)) {
      out.push({ actorId: c.id, targetId: downed.id, abilityId: item, cause: 'auto-phoenix' });
    }
  }
  return out;
}

