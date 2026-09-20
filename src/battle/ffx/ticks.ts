/**
 * Turn-boundary effects and automatic reactions.
 *
 * Regen pays out at the **start of any unit's turn** — not only the carrier's —
 * which is what makes the `+100` addend matter and what the Yunalesca fight
 * weaponises against Zombied party members [ffx-combat-core §4.3].
 */

import type { AbilityDef, CombatantId, FFXCombatant, ItemId } from '../common/types.ts';
import { idiv } from './math.ts';
import { type Ctx, allCombatants, has, isAlive, livingFriendlies, onField, rtOf, spendItem, statusOf, tryActor } from './state.ts';
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
 * What a Remedy answers — the `'any'` row of {@link AUTO_MED_ORDER}.
 *
 * Auto-Med only fires **when the wearer actually has one of these**. Without
 * this list the `'any'` row matched unconditionally, so an Auto-Med wearer
 * threw a Remedy away on **every single hit that touched them**, healthy or
 * not: Auron carries Auto-Med in the Dream's End build and burned the whole
 * six-Remedy bag inside the first minute of Chapter 3, which mattered from the
 * moment item counts started carrying between links of the chain (see
 * `state.ts spendItem`). Petrify is on the list deliberately — Left-Arm Strike
 * carries `shatter 100`, so a Remedy on the turn the beam lands is the answer
 * `ffx-bfa-yu-yevon §4.4` names for a character without Stoneproof.
 */
const REMEDY_CURES: readonly string[] = [
  'darkness',
  'silence',
  'poison',
  'zombie',
  'petrify',
  'sleep',
  'confuse',
  'berserk',
  'slow',
  'curse',
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

  releaseThreatenFrom(ctx, actor);

  // A Threaten whose user has left the field (KO'd, dismissed, ejected) can
  // never reach the release above, so it is released here instead — §4.2's
  // "KO-ing the user removes Threaten", generalised to any way of leaving.
  const own = statusOf(actor, 'threaten');
  if (own) {
    const user = own.sourceId === undefined ? undefined : tryActor(ctx, own.sourceId);
    if (!user || !isAlive(user)) removeStatus(ctx, actor, 'threaten', 'expired');
  }
}

/**
 * Threaten "lasts until the **user's** next turn, and the target's next turn is
 * then scheduled **immediately after** the user's" [ffx-combat-core §4.2].
 *
 * So the release is keyed to the *user* opening a turn, not to the target
 * reaching one — the target reaching one is precisely what Threaten prevents.
 * `StatusInstance.sourceId` exists for this rule. The reschedule is modelled by
 * dropping the freed target's counter to the field minimum, which after the
 * caller's `normalise()` is the acting user's own 0: the user finishes its
 * action, its counter grows by its recovery, and the target is then the lowest
 * on the field.
 */
function releaseThreatenFrom(ctx: Ctx, user: FFXCombatant): void {
  for (const c of allCombatants(ctx)) {
    const threaten = statusOf(c, 'threaten');
    if (!threaten || threaten.sourceId !== user.id) continue;
    removeStatus(ctx, c, 'threaten', 'expired');
    rtOf(ctx, c.id).ctb = 0;
  }
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
  return spendItem(ctx, id);
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
        const wanted = status === 'any' ? REMEDY_CURES.some((st) => has(c, st as never)) : has(c, status as never);
        if (!wanted) continue;
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

