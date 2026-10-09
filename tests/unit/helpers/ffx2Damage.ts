/**
 * One FFX-2 hit through the engine's own resolver, for tests that want the number of a single strike
 * (re-parity W3; **FFX-2 only**).
 *
 * `src/battle/ffx2/formulas.ts` (a pure `computeDamage`) went with the parity wiring: a hit is now
 * `resolve-strike.ts` -> `kernel/pipeline.ts`. Several chapter tests asked the old function for "the damage of this
 * ability from this user on this target at roll R and chain N"; this helper answers the same question by running the
 * real `resolveAbility` on copies of the two units with a generator that hands out exactly the variance asked for, so what
 * a test pins is what the engine deals. The ability runs on its game row when it has one (`AbilityDef.ffx2Record`), else on
 * the row derived from its fields (`adapt/command.ts`). A hit roll is never taken as a miss: the generator answers 0.
 *
 * **Game case: FFX-2 only.**
 */

import { SeededRng } from '../../../src/battle/common/rng.ts';
import type { AbilityDef, BattleEvent, FFX2Combatant } from '../../../src/battle/common/types.ts';
import type { Ffx2Unit } from '../../../src/battle/ffx2/internal.ts';
import { resolveAbility } from '../../../src/battle/ffx2/resolve.ts';

/** A generator that gives the damage variance asked for (240 to 271), never a critical hit, and a roll of 0 to everything else. */
export class VarianceRng extends SeededRng {
  constructor(private readonly variance: number, private readonly crit = false) {
    super(0);
  }

  override int(min: number, max: number): number {
    if (min === 0 && max === 31) return this.variance - 240;
    if (min === 0 && max === 99) return this.crit ? 0 : 99;
    return 0;
  }
}

export interface HitCall {
  user: FFX2Combatant;
  target: FFX2Combatant;
  ability: AbilityDef;
  /** The chain counter the target is carrying (its window is opened). */
  chainCount?: number;
  /** Force a critical roll (the ability must be able to crit). */
  crit?: boolean;
  /** The variance, 240 to 271 (256 is x1.0). */
  randomRoll?: number;
  breaksDamageLimit?: boolean;
}

export interface HitOut {
  /** The first damage event's number (positive damage, negative healing); 0 when there was none. */
  amount: number;
  /** The MP taken from the target by the hit (the sum of its `mp-damage` events); 0 when none. */
  mp: number;
  affinity: string | undefined;
  capped: boolean;
  /** The number was refused: a null element (a damage event of 0 labelled immune) or an immunity (a miss event). */
  immune: boolean;
  events: BattleEvent[];
}

export function computeDamage(call: HitCall): HitOut {
  const same = call.user === call.target;
  const user = structuredClone(call.user) as Ffx2Unit;
  const target = same ? user : (structuredClone(call.target) as Ffx2Unit);
  if (!same) {
    if (user.id === target.id) target.id = `${target.id}-target`;
    target.side = call.ability.targeting.includes('ally') || call.ability.targeting === 'self' ? user.side : user.side === 'party' ? 'enemy' : 'party';
  }
  if (call.chainCount !== undefined && call.chainCount > 0) {
    target.chainCount = call.chainCount;
    target.chainWindowTicks = 100_000;
  }
  const events: BattleEvent[] = [];
  resolveAbility(
    {
      units: same ? [user] : [user, target],
      abilities: { get: () => undefined },
      rng: new VarianceRng(call.randomRoll ?? 256, call.crit === true),
      emit: (e: unknown) => events.push(e as BattleEvent),
      breaksDamageLimit: () => call.breaksDamageLimit === true,
    } as never,
    user,
    call.ability,
    [target.id],
  );
  const dmg = events.find((e) => e.type === 'damage' && e.targetId === target.id) as Extract<BattleEvent, { type: 'damage' }> | undefined;
  const refused = events.some((e) => e.type === 'miss' && e.reason === 'immune');
  return {
    amount: dmg ? dmg.amount : 0,
    mp: events.filter((e) => e.type === 'mp-damage' && e.targetId === target.id).reduce((sum, e) => sum + (e as Extract<BattleEvent, { type: 'mp-damage' }>).amount, 0),
    affinity: dmg?.affinity,
    capped: dmg?.capped === true,
    immune: refused || dmg?.affinity === 'immune',
    events,
  };
}
