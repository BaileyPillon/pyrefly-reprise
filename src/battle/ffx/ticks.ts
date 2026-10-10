/**
 * Turn-boundary effects and automatic reactions.
 *
 * Regen pays out at the **start of any unit's turn** — not only the carrier's —
 * which is what makes the `+100` addend matter and what the Yunalesca fight
 * weaponises against Zombied party members [ffx-combat-core §4.3].
 *
 * **The tick rules are the game's** (re-parity W2; FFX only): the start-of-turn tick (Regen's payout from each holder's own tick
 * counter, Regen's countdown, the stances, the Threaten pair), Doom's countdown, the end-of-turn counters and Poison are the
 * kernels of `kernel/turn-ticks.ts`, reached through `./adapt/ticks.ts`. What stays here is what the kernels do not model: the
 * Overdrive gauge's turn hooks, the Omnis and Sin hooks and the equipment reactions.
 */

import type { AbilityDef, CombatantId, FFXCombatant, ItemId } from '../common/types.ts';
import { type Ctx, has, isAlive, livingFriendlies, onField, spendItem, tryActor } from './state.ts';
import { refreshCriticalStatus } from './statuses.ts';
import { doomTurn, endOfTurn, startOfTurn } from './adapt/ticks.ts';
import { hasAuto } from './equipment.ts';
import { onTurnStartGauge } from './overdrive.ts';
import { ATTACK_ABILITY_ID } from './registry.ts';
import { runSinLivenessHooks } from './ai/sin-counters.ts';
import { runPostPoison, runPreTurn } from './ai/hooks.ts';

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
 * Everything that happens as a combatant's turn opens, in the game's order (`pp_BtlTurnStart`, VA 0x00792a90): the start-of-turn
 * tick, then the scripts' pre-turn hooks, then Doom, then the actor's own gauge hooks.
 *
 * The tick (VA 0x007af4f0): Regen pays every holder on the field `(its own tick counter * maxHP >> 8) + 100` (a Zombie takes it
 * as damage), the actor's Regen counter counts down, Defend, Guard, Sentinel, Shield and Boost end on the actor unless equipment
 * gives them, and the Threaten pair the actor belongs to is released. Doom's countdown (VA 0x00799cd0) goes down one; at 0 the
 * actor dies and its turn is over, which the caller sees as a dead actor.
 */
export function onTurnStart(ctx: Ctx, actor: FFXCombatant): void {
  startOfTurn(ctx, actor);
  // The scripts' preTurn hooks run at every turn start, after the start-of-turn tick and before Doom and the action request: the formation's
  // for everybody, then the actor's own script (re-parity, FFX only; `ai/hooks.ts`). Inert with none registered. That is the game's order:
  // its turn start calls the tick (VA 0x007af4f0), then requests the pre-turn entry of the scripts (VA 0x00792a90), then Doom's tick
  // (VA 0x00799cd0). The release-candidate line ran the hooks ahead of Regen's payout, before the tick was the game's.
  runPreTurn(ctx, actor);
  refreshCriticalStatus(ctx, actor);

  // Doom counts down on the victim's own turn, even while asleep or skipping.
  if (doomTurn(ctx, actor)) return;

  const soleSurvivor = actor.side !== 'enemy' && livingFriendlies(ctx).length === 1;
  onTurnStartGauge(ctx, actor, soleSurvivor);
}

/**
 * Everything that happens as a combatant's turn closes: the end-of-turn tick (VA 0x007af390: Sleep, Silence, Darkness, Shell,
 * Protect, Reflect, Haste and Slow count down one) and Poison, which only follows an action whose results were applied.
 * `resultsApplied` is false for a passed turn (a sleeper's), which takes no Poison damage (VA 0x007b20e0).
 */
export function onTurnEnd(ctx: Ctx, actor: FFXCombatant, resultsApplied = true): void {
  // (Nothing of Omnis's runs at a turn's end any more: his discs turn from the script's `onHit` and his affinity is
  // refreshed by the formation's pre-turn hook, `ai/seymour-omnis.ts`.)
  // The monster's postPoison hook runs right after its own Poison tick (Macalania's Seymour only): `endOfTurn` says
  // whether the tick damaged the actor.
  if (endOfTurn(ctx, actor, resultsApplied)) runPostPoison(ctx, actor);
  // Sin link 3 (FFX): once more after the counters and the tick, so a Genais KO inside the counter phase (Zombie +
  // its own Cura) frees the Core before the next menu, not an action later (CHECK 2 finding 2). A no-op elsewhere.
  runSinLivenessHooks(ctx);
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

