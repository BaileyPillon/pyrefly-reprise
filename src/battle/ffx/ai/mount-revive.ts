/**
 * **A mount that cannot die: Mortiorchis (Chapter I) and Mortibody (Chapter X).**
 * **Game case: FFX only** [AGENTS.md rule 14]; the rule is the same in both fights
 * (`research/re-ffx-ai-seymour.md` sections 2.5 and 4.5).
 *
 * The mount's `onHit` runs **before** the engine's death check. When the action left it at 0 HP, the
 * script sets its HP **and max HP** to the revive value (4,000 the first time; the value then drops
 * by 1,000 each time, to a floor of 1,000), and unless its master is already down queues
 * Mortibsorption on him: the master takes the mount's max HP, which is the value it just came back
 * at (D-06: 4,000, 3,000, 2,000, 1,000, 1,000 ...). The mount never dies in the game, so nothing a
 * KO clears is cleared: a Power Break, a Haste or a Slow on it survives.
 *
 * **What the player sees stays what Bailey picked** (D-094, the KO-and-revive strip): the presenter's
 * `'returns'` departure keys on a `ko` and a `part-destroyed` event, then fades the figure back in on
 * the Mortibsorption `heal`. Those two events are therefore still emitted, as the cue of the fall; the
 * combatant itself is never KO'd (no `ko` status, still alive, HP restored in the same hook).
 */

import type { CombatantId, FFXCombatant } from '../../common/types.ts';
import { type Ctx, tryActor } from '../state.ts';
import { MORTIORCHIS_DECAY, MORTIORCHIS_MIN_MAX_HP } from '../scripted.ts';
import { queueDrain } from './hooks.ts';

/**
 * The mount fell: put it back, and queue the drain.
 *
 * @param reviveKey the `BattleState.flags` key of this mount's revive value
 * @param firstRevive the value it comes back at the first time (the script's private variable at battle start)
 * @param byId whose action took it to 0 HP, for the fall cue
 */
export function reviveMount(
  ctx: Ctx,
  mount: FFXCombatant,
  hostId: CombatantId,
  reviveKey: string,
  firstRevive: number,
  byId: CombatantId,
): void {
  const stored = ctx.state.flags[reviveKey];
  const reviveHp = typeof stored === 'number' ? stored : firstRevive;
  ctx.emit({ type: 'ko', targetId: mount.id, sourceId: byId });
  if (mount.flags.isPart) {
    ctx.emit({
      type: 'part-destroyed',
      partId: mount.id,
      ...(mount.flags.partOf !== undefined ? { ownerId: mount.flags.partOf } : {}),
    });
  }
  mount.stats.maxHp = reviveHp;
  mount.hp = reviveHp;
  const host = tryActor(ctx, hostId);
  if (!host || host.hp <= 0) return; // "if its master's HP is 0, stop": no drain, and the value is not lowered
  ctx.state.flags[reviveKey] = Math.max(MORTIORCHIS_MIN_MAX_HP, reviveHp - MORTIORCHIS_DECAY);
  queueDrain(ctx, mount.id, hostId);
}
