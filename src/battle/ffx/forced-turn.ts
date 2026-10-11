/**
 * A Provoked, Berserk or Confused actor's turn is not its own (re-parity RC4 lane FFX-G, slices G-a; **FFX only**).
 *
 * The game's turn start (`pp_BtlTurnStart`, FFX.exe 0x00792a90) tries Provoke, then Berserk, then Confuse, after Regen's tick and Doom's and only for an
 * actor that is not asleep; each queues the actor's **default attack** at a target set the auto-target builds (`kernel/forced-turn.ts`,
 * `research/re-ffx-targeting.md` section 3), and after any of them the actor neither runs its script nor opens a menu:
 *
 * - **Berserk** aims at the opposite side's legal set, **Confuse at its own side, the actor included** (it never swings across the field); a single-target
 *   attack picks one candidate on stream 4, with no draw when only one is left. An empty set drops the turn.
 * - **Provoke** sends the whole turn at the provoker. A provoker who is out of battle, dead or Petrified has the Provoke bit cleared first (the actor then
 *   acts normally); a monster that keeps control of its script ignores the forced attack (its script aims at the provoker itself, `target-build.ts#provokedAim`).
 *
 * The engine has one generic Attack for every actor (an enemy's own plain-Attack record is chosen when it resolves), so the forced action is that Attack.
 */

import type { Command, CombatantId, FFXCombatant } from '../common/types.ts';
import { pickDrawn } from '../common/streams.ts';
import { confuseBerserkTurn, provokeTurn } from './kernel/forced-turn.ts';
import { PermBit } from './kernel/status-types.ts';
import { slotsOf } from './kernel/target-world.ts';
import { type Ctx, abilityOf, alliesOf, has, isAlive, opponentsOf, statusOf, targetable, tryActor } from './state.ts';
import { removeStatus } from './statuses.ts';
import { ATTACK_ABILITY_ID } from './registry.ts';
import { FfxStream } from './adapt/streams.ts';
import { chainCommand, chainPick, chainSlotOf, chainWorld, idsOf } from './adapt/target-world.ts';
import { inActorOrder } from './ai/script-random.ts';

/** What a forced turn comes to. */
export type ForcedTurn =
  | { kind: 'none' }
  | { kind: 'dropped' }
  | { kind: 'attack'; targets: CombatantId[] };

const NONE: ForcedTurn = { kind: 'none' };
const DROPPED: ForcedTurn = { kind: 'dropped' };

/** Berserk and Confuse for an actor the game has no slot for (a test rig's): the same sets, picked by hand on stream 4. */
function unslotted(ctx: Ctx, actor: FFXCombatant, confused: boolean): ForcedTurn {
  const pool = confused ? alliesOf(ctx, actor).filter((c) => targetable(c) && isAlive(c)) : opponentsOf(ctx, actor);
  const picked = pickDrawn(ctx.rng.on(FfxStream.Picker), inActorOrder(ctx, pool));
  return picked === undefined ? DROPPED : { kind: 'attack', targets: [picked.id] };
}

/** The forced turn of an actor whose turn has just opened, if it has one. Clears the Provoke of an actor whose provoker is gone. */
export function forcedTurn(ctx: Ctx, actor: FFXCombatant): ForcedTurn {
  const provoked = has(actor, 'provoke');
  const berserk = has(actor, 'berserk');
  const confused = has(actor, 'confuse');
  if (!provoked && !berserk && !confused) return NONE;
  const attack = abilityOf(ctx, ATTACK_ABILITY_ID);
  const slot = chainSlotOf(ctx, actor);
  if (attack === undefined || slot === undefined) return berserk || confused ? unslotted(ctx, actor, !berserk && confused) : NONE;

  const world = chainWorld(ctx, actor, attack, false);
  const cmd = chainCommand(actor, attack, 1, false);
  const outcome = (ret: number, mask: number): ForcedTurn =>
    ret === -1 ? { kind: 'attack', targets: idsOf(world, mask) } : ret === -2 ? DROPPED : NONE;

  if (provoked) {
    const source = statusOf(actor, 'provoke')?.sourceId;
    const provoker = source === undefined ? undefined : tryActor(ctx, source);
    if (provoker !== undefined && chainSlotOf(ctx, provoker) !== undefined) {
      const turn = provokeTurn(world.slots, slot, cmd);
      if ((turn.perm & PermBit.Provoke) === 0) removeStatus(ctx, actor, 'provoke', 'expired');
      if (turn.ret !== 0) return outcome(turn.ret, turn.mask);
    }
  }
  if (berserk || confused) {
    const turn = confuseBerserkTurn(world.slots, slot, berserk ? 0 : 1, cmd, chainPick(ctx, world));
    return outcome(turn.ret, turn.mask);
  }
  return NONE;
}

/** The forced attack of an actor, as a command: the Berserk (or Confuse) swing, or an empty aim when the set is empty. */
export function forcedAttack(ctx: Ctx, actor: FFXCombatant, confused: boolean): Command {
  const slot = chainSlotOf(ctx, actor);
  const attack = abilityOf(ctx, ATTACK_ABILITY_ID);
  if (slot === undefined || attack === undefined) {
    const t = unslotted(ctx, actor, confused);
    return { kind: 'attack', targets: t.kind === 'attack' ? t.targets : [] };
  }
  const world = chainWorld(ctx, actor, attack, false);
  const turn = confuseBerserkTurn(world.slots, slot, confused ? 1 : 0, chainCommand(actor, attack, 1, false), chainPick(ctx, world));
  return { kind: 'attack', targets: turn.ret === -1 ? slotsOf(turn.mask).map((s) => world.at.get(s)?.id).filter((id): id is CombatantId => id !== undefined) : [] };
}
