/**
 * Executing one submitted {@link Command}.
 *
 * Everything that costs a turn ends up here: the MP is paid, the ability is
 * resolved, reactions fire, and the actor's CTB counter is charged for the
 * action's rank. Switch is the exception — the incoming member **takes the turn
 * that is happening right now**, so it charges nothing [ffx-combat-core §1.7].
 */

import type { AbilityDef, Command, CombatantId, FFXCombatant, MinigameResult } from '../common/types.ts';
import { byteRoll } from '../common/rng.ts';
import { type Ctx, abilityOf, commandAbility, has, isAlive, rankOf, rtOf, tryActor } from './state.ts';
import { mpCostFor, resolveAbility, type ResolveOptions } from './abilities.ts';
import { applyMpDelta, ejectActor } from './hp.ts';
import { applyStatus } from './statuses.ts';
import { chargeTurn } from './turnQueue.ts';
import {
  FURY_MAX_CASTS,
  furyCastsFor,
  isMenuMarker,
  minigameParams,
  rollDefaultMinigame,
  spendOverdrive,
  timingBonusFrom,
} from './overdrive.ts';
import { dismissAeon, summonAeon } from './aeons.ts';
import { consumeBfaTalk } from './ai/index.ts';
import { ATTACK_ABILITY_ID, DEFEND_ABILITY_ID } from './registry.ts';

/** What executing a command did, so the engine loop knows how to proceed. */
export interface ExecutionResult {
  /** Rank to charge the actor's CTB with. `0` means the turn was not consumed. */
  rank: number;
  /** Set when the turn passes to another actor without a CTB charge (Switch). */
  handOffTo?: CombatantId;
  /** Set when the engine must stop and wait for a minigame outcome. */
  awaitingMinigame?: boolean;
  /**
   * Set when the command was refused outright — a menu marker that reached
   * `submit()`. The turn stays open so the player can choose again.
   */
  rejected?: boolean;
  /** Total HP damage the action dealt, for gauge and counter bookkeeping. */
  damageDealt: number;
  /** The ability that resolved, for trigger signals and counters. */
  def?: AbilityDef;
}

const NOTHING: ExecutionResult = { rank: 3, damageDealt: 0 };

/** Escape: `rng & 255 < 191`, i.e. 74.6% [ffx-combat-core §1.8]. */
function tryEscape(ctx: Ctx, actor: FFXCombatant, party: boolean): ExecutionResult {
  if (!ctx.rt.canEscape) {
    ctx.emit({ type: 'message', text: "Can't escape!", kind: 'system' });
    return { rank: 1, damageDealt: 0 };
  }
  // Flee always succeeds and ends the battle; Escape is per-character.
  const success = party ? true : byteRoll(ctx.rng) < 191;
  ctx.emit({ type: 'escape-attempt', actorId: actor.id, success, party });
  if (success && !party) ejectActor(ctx, actor, 'eject');
  return { rank: party ? 2 : 1, damageDealt: 0 };
}

/** Reshape an Overdrive by its minigame outcome [ffx-combat-core §5.3, §5.6, §5.7]. */
function shapeOverdrive(
  ctx: Ctx,
  user: FFXCombatant,
  def: AbilityDef,
  result: MinigameResult | undefined,
): { def: AbilityDef; options: ResolveOptions } {
  const options: ResolveOptions = { timing: timingBonusFrom(result, def) };
  if (!result) return { def, options };

  if (result.kind === 'tidus-timing' || result.kind === 'auron-sequence') {
    const success = result.kind === 'tidus-timing' ? result.timing.success : result.sequence.success;
    if (!success) {
      const failId = def.extra?.['failAbilityId'];
      const failDef = typeof failId === 'string' ? abilityOf(ctx, failId) : undefined;
      if (failDef) return { def: failDef, options };
    } else if (result.kind === 'auron-sequence' && result.sequence.targetImmuneToRider === true) {
      const immuneId = def.extra?.['immuneAbilityId'];
      const immuneDef = typeof immuneId === 'string' ? abilityOf(ctx, immuneId) : undefined;
      if (immuneDef) return { def: immuneDef, options };
    }
    return { def, options };
  }

  if (result.kind === 'wakka-reels' || result.kind === 'ladyluck-reels') {
    const reels = result.reels;
    // Three of a kind hits every enemy; two of a kind hits one random enemy.
    const shaped: AbilityDef = {
      ...def,
      targeting: reels.threeOfAKind ? 'all-enemies' : 'random-enemy',
      hits: reels.hits ?? def.hits,
    };
    return { def: shaped, options };
  }

  if (result.kind === 'lulu-fury') {
    // The spell rode in on `OverdriveCommand.id`, so `def` is already the
    // right `<spell>-fury` record; the result only says how far the stick
    // swept. Recompute `casts` from the swept angle when the UI reported one,
    // so the rotation cost is the engine's call and not the overlay's
    // [CONTRACT-CHANGES decision 9, ffx-combat-core §5.7].
    const swept = result.fury.sweptDegrees;
    const casts = swept > 0 ? furyCastsFor(def, user.stats.mag, swept) : Math.max(0, result.fury.casts);
    return { def, options: { ...options, hits: Math.min(FURY_MAX_CASTS, casts) } };
  }

  if (result.kind === 'kimahri-rage') {
    const rage = abilityOf(ctx, result.rage.rageId);
    if (rage) return { def: rage, options };
  }

  if (result.kind === 'rikku-mix' && result.mix.resultAbilityId) {
    const mix = abilityOf(ctx, result.mix.resultAbilityId);
    if (mix) return { def: mix, options };
  }

  return { def, options };
}

/** Resolve one command for `actor`. */
export function executeCommand(
  ctx: Ctx,
  actor: FFXCombatant,
  command: Command,
  autoResolveMinigames: boolean,
): ExecutionResult {
  switch (command.kind) {
    case 'attack':
    case 'ability':
    case 'item':
    case 'overdrive':
      break;
    case 'defend': {
      const def = abilityOf(ctx, DEFEND_ABILITY_ID);
      ctx.emit({ type: 'action-start', actorId: actor.id, command, abilityId: DEFEND_ABILITY_ID, abilityName: 'Defend', targets: [actor.id] });
      applyStatus(ctx, actor, actor, { status: 'defend', chance: 255, duration: 1 }, DEFEND_ABILITY_ID);
      ctx.emit({ type: 'action-end', actorId: actor.id });
      return { rank: rankOf(def), damageDealt: 0 };
    }
    case 'escape':
      ctx.emit({ type: 'action-start', actorId: actor.id, command, targets: [] });
      {
        const res = tryEscape(ctx, actor, command.extra?.mode === 'party');
        ctx.emit({ type: 'action-end', actorId: actor.id });
        return res;
      }
    case 'summon': {
      ctx.emit({ type: 'action-start', actorId: actor.id, command, abilityName: 'Summon', targets: [] });
      summonAeon(ctx, actor.id, command.id, false);
      ctx.emit({ type: 'action-end', actorId: actor.id });
      return { rank: 3, damageDealt: 0 };
    }
    case 'dismiss': {
      ctx.emit({ type: 'action-start', actorId: actor.id, command, abilityName: 'Dismiss', targets: [] });
      dismissAeon(ctx, 'command');
      ctx.emit({ type: 'action-end', actorId: actor.id });
      return { rank: 3, damageDealt: 0 };
    }
    case 'switch': {
      const { outId, inId } = command.extra;
      const outgoing = tryActor(ctx, outId);
      const incoming = tryActor(ctx, inId);
      if (!outgoing || !incoming) return NOTHING;
      const slotIndex = ctx.state.activeIds.indexOf(outId);
      if (slotIndex < 0) return NOTHING;
      ctx.state.activeIds[slotIndex] = inId;
      ctx.state.reserveIds = ctx.state.reserveIds.filter((id) => id !== inId).concat(outId);
      incoming.removed = false;
      incoming.slot = outgoing.slot;
      outgoing.removed = true;
      rtOf(ctx, inId).ctb = rtOf(ctx, outId).ctb;
      ctx.emit({ type: 'switch', outId, inId });
      // The incoming member takes the turn happening right now.
      return { rank: 0, handOffTo: inId, damageDealt: 0 };
    }
    case 'trigger': {
      ctx.emit({ type: 'action-start', actorId: actor.id, command, abilityName: 'Talk', targets: command.targets });
      if (command.id === 'talk') {
        const boss = ctx.state.enemyIds
          .map((id) => tryActor(ctx, id))
          .find((c): c is FFXCombatant => c !== undefined && isAlive(c) && !c.flags.isPart);
        if (boss) {
          const accepted = consumeBfaTalk({ ctx, self: boss, memory: rtOf(ctx, boss.id).ai });
          if (accepted) {
            const from = boss.overdrive?.gauge ?? 0;
            if (boss.overdrive) boss.overdrive.gauge = 0;
            ctx.emit({ type: 'overdrive-gauge', who: boss.id, from, to: 0, cause: 'talk' });
          }
        }
      }
      ctx.emit({ type: 'action-end', actorId: actor.id });
      return { rank: 3, damageDealt: 0 };
    }
    default:
      return NOTHING;
  }

  // The four ability-shaped commands.
  let def = commandAbility(ctx, command);
  if (!def) {
    ctx.emit({ type: 'message', text: `${actor.name} hesitates`, kind: 'system' });
    return NOTHING;
  }

  // A menu marker is a submenu label, not an action. The generic `'fury'` id
  // carries `formula: 'none'` and `hits: 0`, so resolving it would spend the
  // gauge on a silent no-op that reads as a UI bug. Refuse it, keep the turn
  // open, and say which ids are legal [CONTRACT-CHANGES decision 9].
  if (isMenuMarker(def)) {
    const choices = def.extra?.['resolvesToOneOf'];
    const detail = Array.isArray(choices) && choices.length > 0 ? ` Choose one of: ${choices.join(', ')}.` : '';
    ctx.emit({
      type: 'message',
      text: `${def.name} is a menu marker, not an action.${detail}`,
      kind: 'system',
    });
    return { rank: 0, rejected: true, damageDealt: 0 };
  }
  let options: ResolveOptions = {};

  if (command.kind === 'overdrive') {
    const kind = def.minigame;
    let extra = command.extra;
    if (kind && !extra) {
      const interactive = actor.controller === 'player' && !autoResolveMinigames;
      if (interactive) {
        ctx.rt.pendingMinigame = { actorId: actor.id, kind };
        ctx.emit({ type: 'minigame-request', who: actor.id, kind, params: minigameParams(ctx, def, actor) });
        return { rank: 0, awaitingMinigame: true, damageDealt: 0 };
      }
      extra = rollDefaultMinigame(ctx, kind, def, actor);
    }
    // Grand Summon is not an attack: it puts an aeon on the field with a
    // temporary full gauge, kept separate from the stored one [§5.4].
    if (extra?.kind === 'yuna-grand-summon') {
      ctx.emit({ type: 'action-start', actorId: actor.id, command, abilityId: def.id, abilityName: def.name, targets: [] });
      spendOverdrive(ctx, actor);
      summonAeon(ctx, actor.id, extra.grandSummon.aeonId, true);
      ctx.emit({ type: 'action-end', actorId: actor.id });
      ctx.rt.pendingMinigame = null;
      return { rank: rankOf(def), damageDealt: 0, def };
    }

    const shaped = shapeOverdrive(ctx, actor, def, extra);
    def = shaped.def;
    options = shaped.options;
    ctx.rt.pendingMinigame = null;
  }

  if (command.kind === 'item') {
    const count = ctx.rt.inventory.get(command.id) ?? 0;
    if (count <= 0) {
      ctx.emit({ type: 'message', text: 'No items left', kind: 'system' });
      return NOTHING;
    }
    ctx.rt.inventory.set(command.id, count - 1);
    const item = ctx.content.item(command.id);
    if (item) def = { ...def, targeting: item.targeting, name: item.name, category: 'item' };
    if (command.gilSpent !== undefined) {
      options = { ...options, gilSpent: Math.min(command.gilSpent, ctx.rt.gil) };
      ctx.rt.gil = Math.max(0, ctx.rt.gil - (command.gilSpent ?? 0));
    }
  }

  const cost = mpCostFor(actor, def);
  if (cost > 0) applyMpDelta(ctx, actor, cost, actor.id);

  ctx.emit({
    type: 'action-start',
    actorId: actor.id,
    command,
    abilityId: def.id,
    abilityName: def.name,
    targets: command.targets.slice(),
  });

  if (command.kind === 'overdrive') spendOverdrive(ctx, actor);

  const damageDealt = resolveAbility(ctx, actor, def, command.targets, options);
  ctx.emit({ type: 'action-end', actorId: actor.id });
  return { rank: rankOf(def), damageDealt, def };
}

/** Charge the actor's counter for an action of `rank`, unless the turn was free. */
export function chargeForAction(ctx: Ctx, actorId: CombatantId, rank: number): void {
  if (rank <= 0) return;
  chargeTurn(ctx, actorId, rank);
}

/** Berserk restricts the actor to an auto-attack [ffx-combat-core §4.2]. */
export function berserkCommand(ctx: Ctx, actor: FFXCombatant): Command {
  const foes = actor.side === 'enemy' ? ctx.state.activeIds : ctx.state.enemyIds;
  const pool = foes.map((id) => tryActor(ctx, id)).filter((c): c is FFXCombatant => c !== undefined && isAlive(c));
  return { kind: 'attack', targets: pool.length > 0 ? [ctx.rng.pick(pool).id] : [] };
}

/** Confuse attacks a random target on **either** side [ffx-combat-core §4.2]. */
export function confusedCommand(ctx: Ctx, actor: FFXCombatant): Command {
  const pool = [...ctx.state.activeIds, ...ctx.state.enemyIds]
    .map((id) => tryActor(ctx, id))
    .filter((c): c is FFXCombatant => c !== undefined && isAlive(c) && c.id !== actor.id);
  return { kind: 'attack', targets: pool.length > 0 ? [ctx.rng.pick(pool).id] : [] };
}

/** True when the actor cannot choose for itself this turn. */
export function actsAutomatically(actor: FFXCombatant): boolean {
  return actor.controller === 'ai' || has(actor, 'confuse');
}

/** The ability id an Attack command resolves to. */
export const ATTACK_ID = ATTACK_ABILITY_ID;
