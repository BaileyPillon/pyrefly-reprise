/**
 * Executing one submitted {@link Command}.
 *
 * Everything that costs a turn ends up here: the MP is paid, the ability is
 * resolved, reactions fire, and the actor's CTB counter is charged for the
 * action's rank. Switch is the exception — the incoming member **takes the turn
 * that is happening right now**, so it charges nothing [ffx-combat-core §1.7].
 */

import type { AbilityDef, Command, CombatantId, FFXCombatant } from '../common/types.ts';
import { byteRoll } from '../common/rng.ts';
import { type Ctx, abilityOf, canSwitchIn, commandAbility, has, isAlive, isSubmenuMarker, rankOf, rtOf, spendItem, tryActor } from './state.ts';
import { mpCostFor, resolveAbility, type ResolveOptions } from './abilities.ts';
import { applyMpDelta, ejectActor } from './hp.ts';
import { applyStatus } from './statuses.ts';
import { chargeTurn } from './turnQueue.ts';
import { isMenuMarker, minigameParams, rollDefaultMinigame, spendOverdrive } from './overdrive.ts';
import { shapeOverdrive } from './overdriveShape.ts';
import { dismissAeon, summonAeon } from './aeons.ts';
import { triggerHandler } from './ai/index.ts';
import { ATTACK_ABILITY_ID, DEFEND_ABILITY_ID } from './registry.ts';
import { revealForSensorAuto } from './sensor.ts';
import { resolveDoublecast } from './doublecast.ts';
import { carryOutOrder } from './orders.ts';

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

/** Resolve one command for `actor`. */
export function executeCommand(
  ctx: Ctx,
  actor: FFXCombatant,
  command: Command,
  autoResolveMinigames: boolean,
): ExecutionResult {
  // The player backed out of an open overlay and chose something else: the
  // suspended request is dead, so the *next* time they pick that Overdrive the
  // overlay opens again rather than being auto-rolled.
  if (ctx.rt.pendingMinigame?.actorId === actor.id && command.kind !== 'overdrive') {
    ctx.rt.pendingMinigame = null;
  }

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
      // The incoming member takes the turn happening right now [§1.7], so one
      // who cannot take a turn is refused rather than handed an open menu it
      // can never close. `commands.ts` already disables the row; this is the
      // engine refusing a command that never should have arrived.
      if (!canSwitchIn(incoming)) {
        ctx.emit({ type: 'message', text: `${incoming.name} cannot fight`, kind: 'system' });
        return { rank: 0, rejected: true, damageDealt: 0 };
      }
      ctx.state.activeIds[slotIndex] = inId;
      ctx.state.reserveIds = ctx.state.reserveIds.filter((id) => id !== inId).concat(outId);
      incoming.removed = false;
      incoming.slot = outgoing.slot;
      outgoing.removed = true;
      rtOf(ctx, inId).ctb = rtOf(ctx, outId).ctb;
      ctx.emit({ type: 'switch', outId, inId });
      // The bench is where a Sensor is usually parked, so the active three
      // changing is the moment to re-run the passive reveal
      // [ffx-combat-core §1.7, §9].
      revealForSensorAuto(ctx);
      // The incoming member takes the turn happening right now.
      return { rank: 0, handOffTo: inId, damageDealt: 0 };
    }
    case 'trigger': {
      // A Trigger Command is an authored, encounter-owned action, not an
      // ability: `id` names the trigger, and the catalog row of the same id is
      // read only for its label and its rank [types.ts `TriggerCommand`].
      const triggerDef = abilityOf(ctx, command.id);
      ctx.emit({
        type: 'action-start',
        actorId: actor.id,
        command,
        abilityId: command.id,
        abilityName: triggerDef?.name ?? 'Talk',
        targets: command.targets.slice(),
      });
      // Dispatch on the trigger id rather than on `id === 'talk'`. Both ends of
      // the engine hard-coded that literal until the Evrae chapter needed a
      // second flavour; `TriggerCommand.id` has always been an arbitrary string
      // [types.ts], so the table lives in `ai/index.ts` and no contract moved.
      const handler = triggerHandler(command.id);
      const accepted = handler ? handler.apply(ctx, actor) : false;
      // A refused trigger says so rather than spending a turn in silence, which
      // reads as a broken button — §1.6's third Talk is offered and
      // deliberately inert, and an order from someone who cannot give one is
      // never offered at all.
      if (!accepted) {
        const text = handler ? handler.rejectedMessage(actor) : `${actor.name} has nothing left to say`;
        ctx.emit({ type: 'message', text, kind: 'system' });
      }
      ctx.emit({ type: 'action-end', actorId: actor.id });
      return { rank: triggerDef ? rankOf(triggerDef) : 3, damageDealt: 0 };
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
  if (isMenuMarker(def) || isSubmenuMarker(def)) {
    const choices = def.extra?.['resolvesToOneOf'];
    const submenu = def.extra?.['opensSubmenu'];
    const detail = Array.isArray(choices) && choices.length > 0
      ? ` Choose one of: ${choices.join(', ')}.`
      : typeof submenu === 'string'
        ? ` It opens the ${submenu} list; choose an item from it.`
        : '';
    ctx.emit({
      type: 'message',
      text: `${def.name} is a menu marker, not an action.${detail}`,
      kind: 'system',
    });
    return { rank: 0, rejected: true, damageDealt: 0 };
  }
  // **Doublecast** [ffx-combat-core §7.4 row 41; ffx-bfa-yu-yevon §4.2
  // "grant ... Doublecast + Firaga/Thundaga", verified: 2 sources]. Only an
  // ability whose own record sets the flag takes this path; the wrapped spell
  // rides on `AbilityCommand.wrappedId`. See `./doublecast.ts`, which also
  // holds the PR-0125 guard against a self-only placeholder aim.
  if (command.kind === 'ability' && def.extra?.['castsTwoBlackMagicSpells'] === true) {
    return resolveDoublecast(ctx, actor, def, command.wrappedId, command.targets);
  }

  let options: ResolveOptions = {};

  if (command.kind === 'overdrive') {
    const kind = def.minigame;
    let extra = command.extra;
    if (kind && !extra) {
      // A request is only worth making **once**. `docs/CONTRACTS.md` says the
      // engine emits `minigame-request` and stops, and the UI re-submits the
      // same command with `extra` attached; it says nothing about what to do
      // when the same command comes back *bare*, and the old answer was to ask
      // again — forever. A presenter probe that re-submitted without an outcome
      // re-picked Spiral Cut 19,916 times and never advanced a tick.
      //
      // So a bare re-submit of the command this actor is already suspended on
      // is read as "nobody is going to play this": the engine rolls the outcome
      // itself from the seeded RNG, exactly as it does for an AI actor or a
      // headless run, and resolves the Overdrive. The gauge is spent either
      // way, which is what stops the loop.
      const pending = ctx.rt.pendingMinigame;
      const alreadyAsked =
        pending !== null &&
        pending.actorId === actor.id &&
        pending.kind === kind &&
        pending.abilityId === def.id;
      const interactive = actor.controller === 'player' && !autoResolveMinigames && !alreadyAsked;
      if (interactive) {
        ctx.rt.pendingMinigame = { actorId: actor.id, kind, abilityId: def.id };
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
    // The Mix selector survived the shaping, so no pair in the bag has a
    // recipe. `types.ts` names this case ("`null` when the pair has no recipe
    // — *Mix failed!*"), and the alternative is what shipped: a `formula:
    // 'none'`, `hits: 0` record resolving in silence with the gauge gone.
    // Refused, so the gauge is kept and the player chooses again.
    if (def.minigame === 'rikku-mix' && def.extra?.['consumesTwoItems'] === true) {
      ctx.emit({ type: 'message', text: 'Mix failed!', kind: 'system' });
      return { rank: 0, rejected: true, damageDealt: 0 };
    }
  }

  if (command.kind === 'item') {
    if (!spendItem(ctx, command.id)) {
      ctx.emit({ type: 'message', text: 'No items left', kind: 'system' });
      return NOTHING;
    }
    const item = ctx.content.item(command.id);
    if (item) def = { ...def, targeting: item.targeting, name: item.name, category: 'item' };
    if (command.gilSpent !== undefined) {
      options = { ...options, gilSpent: Math.min(command.gilSpent, ctx.rt.gil) };
      ctx.rt.gil = Math.max(0, ctx.rt.gil - (command.gilSpent ?? 0));
    }
  }

  // A two-actor rig where the stat block and the turn slot belong to different
  // combatants: `extra.statsFrom` names the actor whose stats the damage chain
  // reads [ffx-seymour-flux §5.4, §4.4.2 "On attribution"]. Everything else —
  // the events, the animation, the CTB charge — stays with `actor`, so the only
  // observable change is the number. Absent on every other ability, and a no-op
  // when it names the actor already taking the turn.
  const statsFrom = def.extra?.['statsFrom'];
  if (typeof statsFrom === 'string' && statsFrom !== actor.id) {
    const owner = tryActor(ctx, statsFrom);
    if (owner) options = { ...options, statsUser: owner };
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
  // A row that orders another actor to act (Yojimbo -> Daigoro): inert unless `extra.ordersActor` is set [orders.ts].
  carryOutOrder(ctx, actor, def, (who, cmd) => executeCommand(ctx, who, cmd, true).damageDealt);
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
