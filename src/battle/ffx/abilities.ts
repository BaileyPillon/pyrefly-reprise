/**
 * Generic resolution of one {@link AbilityDef}.
 *
 * Everything a combatant can do — Attack, a spell, an item, an aeon special, an
 * enemy action, an Overdrive — is an `AbilityDef` with a {@link FormulaKey},
 * some {@link ActionFlag}s and a list of {@link StatusApplication}s, and it all
 * resolves through here. Genuinely one-off rules hang off `AbilityDef.extra`
 * and are dispatched in `scripted.ts`.
 *
 * **The order of an action is the game's** (re-parity W1, FFX only; `research/re-ffx-rng-hit.md` section 7): the
 * game visits the targets one after another and runs each target's hits one after another, and inside a hit the
 * draws come hit roll, damage variance, critical roll. An action that picks a fresh random target for every hit
 * (Slice & Dice, the Furies, Multi-ra) has no fixed target to run the hits against, so it stays hit by hit.
 * The arithmetic of one hit is the game's own, in `adapt/hit.ts`; what the engine does around a hit is
 * `hit-apply.ts`.
 */

import type { AbilityDef, AbilityId, CombatantId, ElementId, FFXCombatant, StatusId } from '../common/types.ts';
import { idiv } from './math.ts';
import { type Ctx, has, hasFlag, rankOf, stacks } from './state.ts';
import type { TimingBonus } from './adapt/hit.ts';
import { drawsOf } from './adapt/draws.ts';
import { resolveElements } from './elements.ts';
import { hasAuto, weaponElements } from './equipment.ts';
import { ejectActor } from './hp.ts';
import { isPerHitRandom, nextHitTargets, resolveTargets } from './targeting.ts';
import { onTargeted } from './overdrive.ts';
import { revealTarget, sensorKind } from './sensor.ts';
import { type HitScope, newRecordBook, resolveOneHit } from './hit-apply.ts';

/** Knobs the caller can override per resolution. */
export interface ResolveOptions {
  /** Overrides `def.hits` (reels, Fury casts). */
  hits?: number;
  /** Overrides `def.power` (a resolved reel shot, a Bushido success/fail row). */
  power?: number;
  /** The §5.2 timed-input bonus. */
  timing?: TimingBonus | null;
  gilSpent?: number;
  /** Counters cost no turn and never chain further counters. */
  isCounter?: boolean;
  followUp?: boolean; // a follow-up row of the same action (Blitz Ace's "Last Hit", §5.3): targets already counted
  rowFor?: (target: FFXCombatant) => AbilityDef | undefined; // a per-target row (a Bushido Immune row, §5.5, od5)
  /**
   * Compute the **damage chain** with this combatant's stats instead of the
   * acting one's, while every other part of the action — the events, the
   * targeting, the Overdrive bookkeeping — stays with the actor whose turn it
   * is.
   *
   * Exists for one documented case: a two-actor rig where one actor owns the
   * turn slot and the animation and a *different* actor owns the stat block.
   * `research/ffx-seymour-flux.md` §5.4 settles that ambiguity for Cross Cleave
   * and Total Annihilation — both are rows in Seymour Flux's own decompiled
   * action list (`m142`, §3.1/§3.2) and are merely animated on the Mortiorchis,
   * so they must be computed with **his** Strength 30 / Magic 15 and not the
   * mount's 40/40. §4.4.2's "On attribution" paragraph states the shipping rule
   * in as many words: "the Mortiorchis actor owns the turn slot and the
   * animation; the Seymour actor owns the stats".
   *
   * Set from `AbilityDef.extra.statsFrom` in `execute.ts`; unset everywhere
   * else, so no other encounter changes. See `docs/CONTRACT-CHANGES.md`.
   */
  statsUser?: FFXCombatant;
}

/** MP cost after Magic Booster, One MP Cost and Half MP Cost [ffx-combat-core §9]. */
export function mpCostFor(user: FFXCombatant, def: AbilityDef): number {
  if (has(user, 'mp-cost-zero')) return 0;
  if (user.side === 'enemy') return 0;
  let cost = def.mpCost;
  if (hasAuto(user, 'magic-booster') && (def.category === 'blackmagic' || def.category === 'whitemagic')) {
    cost *= 2;
  }
  if (hasAuto(user, 'one-mp-cost')) return cost > 0 ? 1 : 0;
  if (hasAuto(user, 'half-mp-cost')) cost = idiv(cost, 2);
  return cost;
}

/** Silence blocks Wht/Blk Magic and Summon — never an Overdrive [ffx-combat-core §4.2]. */
export function blockedBySilence(user: FFXCombatant, def: AbilityDef): boolean {
  if (!has(user, 'silence')) return false;
  return def.category === 'blackmagic' || def.category === 'whitemagic' || def.category === 'summon';
}

function elementFor(elements: readonly ElementId[]): ElementId {
  return elements.length > 0 ? (elements[0] as ElementId) : 'none';
}

/**
 * Resolve one action end to end.
 *
 * Returns the total HP damage dealt (positive) so callers can drive Overdrive
 * gauges, the BFA Talk counter and mid-battle triggers.
 */
export function resolveAbility(
  ctx: Ctx,
  user: FFXCombatant,
  def: AbilityDef,
  chosenTargets: readonly CombatantId[],
  options: ResolveOptions = {},
): number {
  const hitCount = Math.max(0, options.hits ?? def.hits);
  const perHitRandom = isPerHitRandom(def.targeting);
  const elements = resolveElements(user, def, weaponElements(user));

  let targets = resolveTargets(ctx, user, def, chosenTargets);
  if (targets.length === 0 && def.targeting !== 'self') return 0;

  // A gauge that fills on **being targeted** (a heal or a debuff counts) is paid here, once per action and
  // not again for a follow-up row, before any hit resolves. Inert unless `gaugePerTargeting` is set [overdrive.ts].
  if (options.followUp !== true) for (const t of targets) onTargeted(ctx, t, user);

  const scope: HitScope = {
    ctx,
    user,
    def,
    options,
    draws: drawsOf(ctx.rng),
    primaryElement: elementFor(def.element.length > 0 ? def.element : elements),
    totalHits: perHitRandom ? hitCount : hitCount * Math.max(1, targets.length),
    hitIndex: 0,
    totalDealt: 0,
    rank: rankOf(def),
    records: newRecordBook(),
  };

  if (perHitRandom) {
    for (let h = 0; h < hitCount; h++) {
      targets = nextHitTargets(ctx, user, def, h, targets);
      for (const target of targets) resolveOneHit(scope, target);
    }
  } else {
    for (const target of targets) {
      for (let h = 0; h < hitCount; h++) resolveOneHit(scope, target);
    }
  }

  // Scan opens the info panel. It is emitted **after** the hits, so the whole of it is pure
  // information: a reveal rolls nothing and therefore cannot move the seeded RNG by one draw
  // [ffx-combat-core §9, `sensor.ts`]. The FFX data marks Scan with the `scan` status, which until now nothing read.
  const reveals = sensorKind(def);
  if (reveals) {
    for (const target of targets) revealTarget(ctx, user.id, target, reveals);
  }

  // Self-Destruct removes the user once the hits have landed.
  if (hasFlag(def, 'destroys-user')) ejectActor(ctx, user, 'eject');
  return scope.totalDealt;
}

/** The ability an item resolves to, with the item's own targeting applied. */
export function itemAbility(ctx: Ctx, itemId: AbilityId): AbilityDef | undefined {
  const item = ctx.content.item(itemId);
  const effect = ctx.content.itemEffect(itemId);
  if (!effect) return undefined;
  if (!item) return effect;
  return { ...effect, targeting: item.targeting, name: item.name, category: 'item' };
}

/** Cheer / Focus / Aim / Reflex / Luck / Jinx already at five stacks are inert. */
export function stackBuffMaxed(target: FFXCombatant, status: StatusId): boolean {
  return stacks(target, status) >= 5;
}
