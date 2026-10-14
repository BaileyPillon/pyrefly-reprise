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
 *
 * **The targets are built once, before any hit** (re-parity RC4 lane FFX-G; the game's `pp_BtlBuildTargetHits`, `target-build.ts`): a random-target
 * row deals its hits over the whole set (every pick first, stream 5), Cover (Guard, Sentinel) is decided per target, and a Reflecting target sends a
 * reflectable command back (to the caster for a holder on the other side, to a random member of the other side for one on the caster's own).
 * Each target then runs its hits in a row.
 */

import type { AbilityDef, AbilityId, CombatantId, ElementId, FFXCombatant, StatusId } from '../common/types.ts';
import { type Ctx, has, hasFlag, rankOf, stacks } from './state.ts';
import type { TimingBonus } from './adapt/hit.ts';
import { drawsOf } from './adapt/draws.ts';
import { streamsOf } from './adapt/streams.ts';
import { resolveElements } from './elements.ts';
import { weaponElements } from './equipment.ts';
import { SILENCE_GATED, mpCost } from './kernel/command-gate.ts';
import { gateRecordOf, mpChrOf } from './adapt/command-gate.ts';
import { ejectActor, settleDeferredDeath } from './hp.ts';
import { listensToHit, runOnHit, runOnTargeted } from './ai/hooks.ts';
import { resolveCommand } from './adapt/command.ts';
import { aimedTargets, isPerHitRandom, resolveTargets, scriptAimsAt } from './targeting.ts';
import { buildAction, buildAimedAction, provokedAim } from './target-build.ts';
import { bondAdd } from './kernel/cover.ts';
import { bondOf, chainSlotOf } from './adapt/target-world.ts';
import { removePlannedHits } from './adapt/overdrive-result.ts';
import { gaugeOnOutcome } from './gauge.ts';
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
  /**
   * The hits the game PLANS for a random-target Overdrive whose result may take some away (re-parity RC4 lane B; `adapt/overdrive-result.ts`):
   * the menu record's full hit count, spread over the targets one pick at a time before the minigame ends. `hits` is then what is left
   * after the result's removal (Slice and Dice's Fail, Lulu's Fury with fewer casts), taken one hit at a time from the targets holding the
   * most (stream 16), and the rest land target by target in character order. Absent: the action plans exactly `hits`, hit by hit.
   */
  spreadHits?: number;
}

/**
 * The MP the user pays for this ability: the game's (re-parity RC7 lane L-CMD, `kernel/command-gate.ts#mpCost`; FFX only). Half MP Cost halves it **rounding
 * up** (Esuna 5 costs 3, Scan 1 costs 1) unless the Magic Booster doubles a Black or White Magic spell, in which case the doubling takes the round-up away;
 * One MP Cost makes any cost above 0 equal 1, and the Booster then doubles it (2 on a spell); Spellspring makes it 0. A monster pays no MP.
 */
export function mpCostFor(user: FFXCombatant, def: AbilityDef): number {
  if (user.side === 'enemy') return 0;
  return mpCost(gateRecordOf(def), mpChrOf(user));
}

/**
 * Silence blocks the commands whose record carries the Silence flag (bit 0x20000 of the record's flag word): all 22 White and 19 Black Magic
 * records of the command table (Scan and Esuna among them) and the monster records that carry it. **Not** Summon, Grand Summon, Doublecast or an Overdrive
 * (re-parity RC7 lane L-CMD, `kernel/command-gate.ts#usableCost`; FFX only). An ability with no game record is gated by its category, as before.
 */
export function blockedBySilence(user: FFXCombatant, def: AbilityDef): boolean {
  if (!has(user, 'silence')) return false;
  return (gateRecordOf(def).flagsMisc & SILENCE_GATED) !== 0;
}

function elementFor(elements: readonly ElementId[]): ElementId {
  return elements.length > 0 ? (elements[0] as ElementId) : 'none';
}

/**
 * The targets the hit records have landed on are done: each one's script hears of the action once
 * (`onHit`), **before** its death is decided, and a lethal hit that nothing saved then kills (re-parity,
 * `research/re-ffx-ai-seymour.md` section 1.1; FFX only). Inert for a target with no script hooks.
 * Targets are visited in the order of their **last** hit record, as the game applies them.
 */
function finishTouched(scope: HitScope): void {
  const { ctx, user, def } = scope;
  const done = [...scope.touched.values()].sort((a, b) => a.last - b.last);
  scope.touched.clear();
  for (const { target, hpBefore, lastDamage } of done) {
    tidusCounter(ctx, user, target, hpBefore);
    // A follow-up row (Blitz Ace's Last Hit) is part of the action its main row already announced: one `onHit` per action.
    if (scope.options.followUp !== true && listensToHit(target)) {
      const affectsHp = (resolveCommand(def, user).record.damageClass & 1) !== 0;
      runOnHit(ctx, { def, user }, target, { hpBefore, lostHp: target.hp < hpBefore, lastDamage, affectsHp });
    }
    settleDeferredDeath(ctx, target, user.id, lastDamage);
  }
}

/**
 * The per-target step's Tidus counter update (VA 0x00789740, read; `research/re-ffx-targeting.md` section 1.1): when Tidus (slot 0) acts on a
 * party slot 1 to 7, that slot's counter goes up by one if the sum of its HP changes in the action is a net heal, and down by one (not below 0)
 * if it is a net loss. The counters weigh into the Cover score (`kernel/cover.ts`).
 */
function tidusCounter(ctx: Ctx, user: FFXCombatant, target: FFXCombatant, hpBefore: number): void {
  if (chainSlotOf(ctx, user) !== 0) return;
  const slot = chainSlotOf(ctx, target);
  if (slot === undefined || slot < 1 || slot > 7) return;
  const net = target.hp - hpBefore;
  const bond = bondOf(ctx);
  if (net > 0) bondAdd(bond, slot, 1);
  else if (net < 0) bond[slot] = Math.max(0, (bond[slot] ?? 0) - 1);
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

  // A row the script aims (`extra.scriptAims`, re-parity) goes where the command names, one command per hit; no pick is drawn for it. Every other
  // random-target row is a spread: its action carries the whole set and the hits are dealt over it (G6).
  const aimed = perHitRandom && scriptAimsAt(def) && chosenTargets.length > 0;
  const spread = perHitRandom && !aimed;
  const rawNamed = aimed ? aimedTargets(ctx, def, chosenTargets) : resolveTargets(ctx, user, def, chosenTargets);
  // A Provoked monster that keeps control of its script aims its single-target rows at the provoker (G9); any other Provoked monster never gets here.
  const targets = provokedAim(ctx, user, def, rawNamed);
  if (targets.length === 0 && def.targeting !== 'self') return 0;

  // A gauge that fills on **being targeted** (a heal or a debuff counts) is paid here, once per action and
  // not again for a follow-up row, before any hit resolves. Inert unless `gaugePerTargeting` is set [overdrive.ts].
  if (options.followUp !== true) for (const t of targets) onTargeted(ctx, t, user);
  // The targets' scripts hear the command named them (`onTargeted`), before any damage. A follow-up row is the same action.
  // This comes before the targets are built: a script's `onTargeted` may put the Guard on a Guardian that the Cover of this very action finds.
  if (options.followUp !== true) runOnTargeted(ctx, { def, user }, targets);

  // The targets, built once, with the hits each takes.
  const aimedChosen = targets === rawNamed ? chosenTargets : targets.map((t) => t.id);
  // An Overdrive that plans its hits over the targets before the result takes some away (`ResolveOptions.spreadHits`, RC4 lane B): the builder
  // deals the menu record's FULL hit count over the set first (every pick on stream 5), then the result removes the missing ones from the
  // targets holding the most (stream 16, `adapt/overdrive-result.ts#removePlannedHits`), and the rest land target by target in character order.
  const planned = spread && options.spreadHits !== undefined && options.spreadHits >= hitCount && hitCount > 0;
  const plannedHits = planned ? (options.spreadHits as number) : hitCount;
  const built = aimed ? buildAimedAction(ctx, user, def, aimedChosen, hitCount) : buildAction(ctx, user, def, targets, plannedHits, spread);
  const plan = planned ? removePlannedHits(ctx, built.targets, plannedHits - hitCount) : undefined;

  const scope: HitScope = {
    ctx,
    user,
    def,
    options,
    draws: drawsOf(ctx.rng, streamsOf(ctx, user)),
    primaryElement: elementFor(def.element.length > 0 ? def.element : elements),
    totalHits: perHitRandom ? hitCount : hitCount * Math.max(1, targets.length),
    hitIndex: 0,
    totalDealt: 0,
    rank: rankOf(def),
    records: newRecordBook(),
    touched: new Map(),
  };

  // A reflecting target's hits go elsewhere: the reflecting target runs the outcome hook once per hit, as a hit that a Shell, Protect or Nul
  // turned aside (VA 0x00789030: Rook); hits with nobody left to land on are lost, and the engine says so as it always did.
  for (const { holder, hits } of built.bounced) for (let k = 0; k < hits; k++) gaugeOnOutcome(ctx, user, holder, 0, 2);
  for (const { holder, hits } of built.lost) {
    for (let k = 0; k < hits; k++) {
      ctx.emit({ type: 'miss', targetId: holder.id, sourceId: user.id, reason: 'nullified' });
      scope.hitIndex++;
    }
  }

  if (plan) {
    // A planned Overdrive (RC4 lane B): the hits left after the result's removal land target by target in character order.
    for (const { target, hits } of plan) {
      for (let h = 0; h < hits; h++) resolveOneHit(scope, target);
      finishTouched(scope);
    }
  } else if (perHitRandom) {
    // A spread (or a script-aimed row): the hit records of the whole action are in before any target's script hears of it.
    for (const { target, hits } of built.targets) for (let h = 0; h < hits; h++) resolveOneHit(scope, target);
    finishTouched(scope);
  } else {
    for (const { target, hits } of built.targets) {
      for (let h = 0; h < hits; h++) resolveOneHit(scope, target);
      finishTouched(scope);
    }
  }

  // Scan opens the info panel. It is emitted **after** the hits, so the whole of it is pure
  // information: a reveal rolls nothing and therefore cannot move the seeded RNG by one draw
  // [ffx-combat-core §9, `sensor.ts`]. The FFX data marks Scan with the `scan` status, which until now nothing read.
  const reveals = sensorKind(def);
  if (reveals) {
    for (const { target } of built.targets) revealTarget(ctx, user.id, target, reveals);
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
