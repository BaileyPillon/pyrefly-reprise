/**
 * Executing one submitted {@link Command}.
 *
 * Everything that costs a turn ends up here: the MP is paid, the ability is
 * resolved, reactions fire, and the actor's CTB counter is charged for the
 * action's rank. Switch is the exception — the incoming member **takes the turn
 * that is happening right now**, so it charges nothing [ffx-combat-core §1.7].
 */

import type { AbilityDef, Command, CombatantId, FFXCombatant } from '../common/types.ts';
import { type Ctx, abilityOf, canSwitchIn, commandAbility, has, isSubmenuMarker, rankOf, rtOf, tryActor } from './state.ts';
import { mpCostFor, resolveAbility, type ResolveOptions } from './abilities.ts';
import { applyMpDelta } from './hp.ts';
import { chargeTurn } from './turnQueue.ts';
import { isMenuMarker, minigameParams, rollDefaultMinigame, spendOverdrive } from './overdrive.ts';
import { tryEscape } from './escape.ts';
import { aimGate, costGate, fizzle } from './command-start.ts';
import { forcedAttack } from './forced-turn.ts';
import { shapeOverdrive } from './overdriveShape.ts';
import { itemAbility, payForItem } from './item-use.ts';
import { type MixOutcome, mixFailed } from './mix.ts';
import { dismissAeon, summonAeon } from './aeons.ts';
import { triggerHandler } from './ai/index.ts';
import { ATTACK_ABILITY_ID, DEFEND_ABILITY_ID } from './registry.ts';
import { revealForSensorAuto } from './sensor.ts';
import { resolveDoublecast } from './doublecast.ts';
import { carryOutOrder } from './orders.ts';
import { isVolley, resolveVolley } from './volley.ts';
import { duelRefusalFor } from './aeon-duel.ts';
import { defendRefused } from './formation-flags.ts';
import { executeAeonCommand } from './aeon-commands.ts';

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

  // An aeon duel (Chapter XIV; `./aeon-duel.ts`): the menu greys these rows,
  // and one that arrives anyway is refused with the same reason, the turn kept
  // open. `undefined`, so a no-op, in every other battle.
  const refusal = duelRefusalFor(ctx, actor, command);
  if (refusal !== undefined) {
    ctx.emit({ type: 'message', text: refusal, kind: 'system' });
    return { rank: 0, rejected: true, damageDealt: 0 };
  }

  // A Defend in a formation that switched it off (`formation-flags.ts`) is refused, the turn kept open; the menu never offers it, so this is the engine refusing a command that never should have arrived.
  if (defendRefused(ctx, actor, command)) return { rank: 0, rejected: true, damageDealt: 0 };

  // The player's Yojimbo's and the Magus Sisters' own commands (re-parity lane FFX-K, `aeon-commands.ts`); `null` for everyone else, whose command goes on.
  const aeonResult = executeAeonCommand(ctx, actor, command, (who, cmd) => executeCommand(ctx, who, cmd, true));
  if (aeonResult !== null) return aeonResult;

  switch (command.kind) {
    case 'attack':
    case 'ability':
    case 'item':
    case 'overdrive':
      break;
    case 'defend': {
      const def = abilityOf(ctx, DEFEND_ABILITY_ID);
      ctx.emit({ type: 'action-start', actorId: actor.id, command, abilityId: DEFEND_ABILITY_ID, abilityName: 'Defend', targets: [actor.id] });
      // Defend is a command like any other, with the game's own record (the Defend stance in the extra-status word): it
      // runs through the same hit and status steps, aimed at the actor.
      if (def) resolveAbility(ctx, actor, def, [actor.id]);
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
      if (ctx.rt.noSwitch === true) {
        ctx.emit({ type: 'message', text: 'Switch is disabled in this battle', kind: 'system' });
        return { rank: 0, rejected: true, damageDealt: 0 };
      }
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
        ? ` It opens the ${submenu} menu; choose an item from it.`
        : '';
    ctx.emit({
      type: 'message',
      text: `${def.name} is a menu marker, not an action.${detail}`,
      kind: 'system',
    });
    return { rank: 0, rejected: true, damageDealt: 0 };
  }
  // The cost check the game runs as a sub-action starts (re-parity RC7 lane L-CMD, `command-start.ts`): Silence, the MP and the Overdrive gauge are
  // read again, and a refusal pays nothing.
  if (!costGate(actor, def, command.kind === 'overdrive')) return fizzle(ctx, actor, command, false);
  // **Doublecast** [ffx-combat-core §7.4 row 41; ffx-bfa-yu-yevon §4.2
  // "grant ... Doublecast + Firaga/Thundaga", verified: 2 sources]. Only an
  // ability whose own record sets the flag takes this path; the wrapped spell
  // rides on `AbilityCommand.wrappedId`. See `./doublecast.ts`, which also
  // holds the PR-0125 guard against a self-only placeholder aim.
  if (command.kind === 'ability' && def.extra?.['castsTwoBlackMagicSpells'] === true) {
    return resolveDoublecast(ctx, actor, def, command.wrappedId, command.targets);
  }
  // **A volley**: several spells in one enemy turn (Seymour Omnis's four disc
  // spells, Chapter XII) — inert unless the row sets `extra.volley` [volley.ts].
  if (command.kind === 'ability' && isVolley(def)) return resolveVolley(ctx, actor, def);

  let options: ResolveOptions = {};
  let finisher: AbilityDef | undefined;
  let mix: MixOutcome | undefined;

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
    finisher = shaped.finisher;
    mix = shaped.mix;
    ctx.rt.pendingMinigame = null;
    // A Mix that found nobody to aim at has already cost both ingredients; it spends no gauge and no hit (`mix.ts`).
    if (mix?.failed) return mixFailed(ctx);
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
    // The item's own targeting and name; an aeon has no Item command. Nothing is paid yet: the range filter below needs the item's targeting.
    const set = itemAbility(ctx, actor, command, def);
    if (!set.ok) return set.result;
    def = set.def;
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

  // The range filter the game runs as the sub-action starts: a named target that is gone, out of reach or dead is dropped and nobody takes its place; with no
  // one left the command does not start, and nothing below (the item, the MP, the gauge) is paid.
  // A Mix's targets are the game's auto-target's, not the command's (the player does not aim a Mix): the executor's filter sees the ones it picked. The Mix's ingredients
  // are already gone and stay gone when the filter refuses (FFX-G05 3.1: the resolver spends them; the executor's refund of the result record finds nothing to return).
  const aim = mix !== undefined && mix.targets.length > 0 ? mix.targets : command.targets;
  const gate = aimGate(ctx, actor, def, aim, options.hits ?? def.hits);
  if (!gate.ok) return fizzle(ctx, actor, command, gate.outOfReach);

  if (command.kind === 'item') {
    const paid = payForItem(ctx, actor, command, options);
    if (!paid.ok) return paid.result;
    options = paid.options;
  }

  const cost = mpCostFor(actor, def);
  if (cost > 0) applyMpDelta(ctx, actor, cost, actor.id);

  ctx.emit({
    type: 'action-start',
    actorId: actor.id,
    command,
    abilityId: def.id,
    abilityName: def.name,
    targets: aim.slice(),
  });

  if (command.kind === 'overdrive') spendOverdrive(ctx, actor);

  let damageDealt = resolveAbility(ctx, actor, def, aim, options);
  // Blitz Ace's success-only "Last Hit" (row 274, 24 x 1) lands after the volley, in the same action [§5.3].
  // **Which hits the timing factor reaches is OPEN** (`FFX-G01` row 22b, open question 4; lane FFX-B4, not built): the game applies it only to the hits
  // its result handler recalculates. For the three Swordplay moves that is every hit (they start before the animation) and the engine matches; for
  // Blitz Ace it is the last pending hit, so the eight kicks would go unscaled and only this finisher would carry `options.timing` [I: the start gate
  // admits only categories 0x20, 0x25, 0x30 and 0x40, so the animation script starts this controller]; for Bushido it depends on where the script
  // starts it. That needs a read of the animation scripts or a look at the running game; until then every hit of the ability carries the factor.
  if (finisher) damageDealt += resolveAbility(ctx, actor, finisher, command.targets, { ...options, followUp: true });
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

/**
 * Berserk restricts the actor to an auto-attack at the opposite side [ffx-combat-core §4.2], and Confuse sends it at its own side, itself included
 * (`forced-turn.ts`; the game's auto-target, FFX.exe 0x007996d0: one candidate by the picker on stream 4, none drawn with one). An empty set aims at
 * nobody. The turn start (`engine.ts`) goes through `forcedTurn`, which also covers Provoke; these two stay as the single swing a test can ask for.
 */
export function berserkCommand(ctx: Ctx, actor: FFXCombatant): Command {
  return forcedAttack(ctx, actor, false);
}

/** Confuse attacks a random target of **its own side, the actor included** (`forced-turn.ts`). */
export function confusedCommand(ctx: Ctx, actor: FFXCombatant): Command {
  return forcedAttack(ctx, actor, true);
}

/** True when the actor cannot choose for itself this turn: an AI actor, or one whose turn is forced (Provoke, Berserk, Confuse). */
export function actsAutomatically(actor: FFXCombatant): boolean {
  return actor.controller === 'ai' || has(actor, 'confuse') || has(actor, 'berserk') || has(actor, 'provoke');
}

/** The ability id an Attack command resolves to. */
export const ATTACK_ID = ATTACK_ABILITY_ID;
