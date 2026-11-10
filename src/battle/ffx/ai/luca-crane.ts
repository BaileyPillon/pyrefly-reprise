/**
 * **The Luca crane and the party's key to it** (FFX only; the hidden Oblitzerator chapter, number 50): the monster file `m133` and the formation script's Trigger Command **Use crane**
 * (`research/re-ffx-oblitzerator-crane.md` sections 2 and 4.5, "RE 2" and "RE 4.5"; read from the files and run in the earlier lanes' interpreter).
 *
 * The crane is a prop on the dock: **65,535 HP, no turns, off the CTB bar, no part of the victory** ({@link applyLucaSetup}), and a legal target. It **absorbs Thunder** and is immune to the other four elements and to every
 * status, so nothing a person casts at it does anything but this:
 *
 * - **The first two Thunder casts** (the player's own row 0x3043, `thunder`) are answered with a line ("responds"); **the third powers it** (the line "activated"). **One Thunder Fury** (`thunder-fury`, 0x307a) powers
 *   it at once. Thundara, Thundaga, every other Fury, a weapon with Thunder on it, Fire, a plain blow: nothing. After it is powered, a fourth Thunder does nothing.
 * - **Use crane** (0x3102, a Trigger Command the formation gives **Tidus alone**, from the start): on the unpowered crane it runs the "out of power" scene and does nothing else (the turn is spent, as for any
 *   refused trigger); on the powered crane it **queues the Crane row (0x6012) on the Oblitzerator as the crane's own free action** (15/16 of its current HP; `./oblitzerator.ts` ends its turns and counters when the row names
 *   it), removes the command from Tidus's list and makes the crane untargetable. The command is **not in the list once the crane is spent**.
 *
 * The game's crane does this from its `onTargeted` hook when the command names it; here the Trigger Command's handler ({@link applyUseCrane}) does what that hook does, because a trigger never reaches the ability
 * resolver's `onTargeted` (the Flooded Ways' Open lock and the Keeper's Move are the same). The menu row ({@link useCraneRows}) is built beside Defend, like theirs.
 *
 * ## The deviations and open readings, said (rule 6: none of them is a number)
 *
 * - **The lines are our own words** (the game's "The crane responds." and "Crane activated." are message rows and its scenes are battle dialogue; no text is copied): the banners are `script-trigger` callouts the chapter's
 *   `midScripts` answer (`story/scripts/oblitzerator.ts`).
 * - **Tidus's first-turn scene** (RE 2: scene A 2, "Tidus points out the crane") is one more such callout, once, on his first turn ({@link pointOutCrane}).
 * - **A refused or unpowered Use crane spends the turn**: the game's trigger commands are ordinary commands of rank 3; whether the unpowered use is refused before the turn is spent was not read (RE 8).
 */

import type { AvailableCommand, Command, FFXCombatant, TriggerCommand } from '../../common/types.ts';
import { type Ctx, isAlive, rtOf, tryActor } from '../state.ts';
import { registerAiScript } from './types.ts';
import { type HitReport, type UsedCommand, queueEmit, queueReaction, registerFormationPreTurn, registerScriptHooks } from './hooks.ts';
import {
  CRANE_DARK,
  CRANE_POWERED,
  CRANE_SPENT,
  OB_CALLOUTS,
  OB_CRANE_FLAG,
  OB_CRANE_ID,
  OB_CRANE_SCRIPT,
  OB_ENDED_FLAG,
  OB_GROUP_ID,
  OB_ID,
  OB_PHASE_FLAG,
  OB_POINTED_FLAG,
  OB_ROWS,
  OB_THUNDERS_FLAG,
  OB_USER_ID,
  THUNDERS_BEFORE_POWER,
  craneState,
  flagNumber,
} from './oblitzerator-rules.ts';

/** The crane never takes a turn (it is `ordersOnly`); a script is registered so nothing falls back to a plain Attack. */
registerAiScript(OB_CRANE_SCRIPT, () => null);

/** Is this the Number 4 Dock's formation: both actors are on the field. */
function inFormation(ctx: Ctx): boolean {
  return tryActor(ctx, OB_CRANE_ID) !== undefined && tryActor(ctx, OB_ID) !== undefined;
}

/**
 * The formation's opening state (RE 2 and the crane's own init, RE 4.5): the crane takes no turns and is no part of the victory (`ordersOnly` and `nonCombatant`, the way the Gate Locks and the Mortiphasm discs
 * are), and the state is written once. Called from `formation-commands.ts#applyFormationCommandDisables`; a no-op for every other formation.
 */
export function applyLucaSetup(ctx: Ctx, group: { id: string }): void {
  if (group.id !== OB_GROUP_ID) return;
  const flags = ctx.state.flags;
  flags[OB_PHASE_FLAG] = 0;
  flags[OB_ENDED_FLAG] = false;
  flags[OB_CRANE_FLAG] = CRANE_DARK;
  flags[OB_THUNDERS_FLAG] = 0;
  flags[OB_POINTED_FLAG] = false;
  if (tryActor(ctx, OB_CRANE_ID) === undefined) return;
  const rt = rtOf(ctx, OB_CRANE_ID);
  rt.ordersOnly = true;
  rt.nonCombatant = true;
}

/** Power the crane (RE 4.5: `v0 = 1`, the motion level goes up, the line "activated"). */
function power(ctx: Ctx): void {
  ctx.state.flags[OB_CRANE_FLAG] = CRANE_POWERED;
  queueEmit(ctx, { type: 'script-trigger', name: OB_CALLOUTS.powered, payload: {} });
}

/**
 * The crane hears it was hit (RE 4.5 `onHit`), once per action: while it has no power, the player's Thunder is counted (two answers, the third powers it) and Thunder Fury powers it at once. Once powered or
 * spent, nothing. Only those two rows count: a Thundara, a Thundaga, another Fury or a Thunder weapon is some other row.
 */
function craneOnHit(ctx: Ctx, _self: FFXCombatant, used: UsedCommand, _report: HitReport): void {
  if (craneState(ctx) !== CRANE_DARK) return;
  if (used.def.id === OB_ROWS.thunder) {
    const heard = flagNumber(ctx, OB_THUNDERS_FLAG, 0);
    if (heard >= THUNDERS_BEFORE_POWER) {
      power(ctx);
      return;
    }
    ctx.state.flags[OB_THUNDERS_FLAG] = heard + 1;
    queueEmit(ctx, { type: 'script-trigger', name: heard === 0 ? OB_CALLOUTS.responds1 : OB_CALLOUTS.responds2, payload: {} });
  } else if (used.def.id === OB_ROWS.thunderFury) {
    power(ctx);
  }
}

registerScriptHooks(OB_CRANE_SCRIPT, { onHit: craneOnHit });

/** Tidus's first turn (RE 2: scene A 2, once): he points out the crane. */
function pointOutCrane(ctx: Ctx, actor: FFXCombatant): void {
  if (actor.id !== OB_USER_ID || !inFormation(ctx) || ctx.state.flags[OB_POINTED_FLAG] === true) return;
  ctx.state.flags[OB_POINTED_FLAG] = true;
  ctx.emit({ type: 'script-trigger', name: OB_CALLOUTS.point, payload: {} });
}
registerFormationPreTurn(pointOutCrane);

/** Is Use crane in this person's list at all: Tidus, in this formation, until the crane is spent (RE 2 adds it to character 0; the crane's script removes it). */
export function useCraneOffered(ctx: Ctx, user: FFXCombatant): boolean {
  return user.side === 'party' && user.id === OB_USER_ID && inFormation(ctx) && craneState(ctx) !== CRANE_SPENT;
}

/** The crane is a legal target now: standing, and not made untargetable by its own use. */
function craneTargetable(ctx: Ctx): boolean {
  const crane = tryActor(ctx, OB_CRANE_ID);
  return crane !== undefined && isAlive(crane) && crane.flags.untargetable !== true;
}

/** On offer now (not greyed): offered, and the crane can be named. */
export function useCraneAvailable(ctx: Ctx, user: FFXCombatant): boolean {
  return useCraneOffered(ctx, user) && craneTargetable(ctx);
}

/** The Use crane row of Tidus (a menu row beside Defend, like the Keeper's Move and the Flooded Ways' Open lock): none for anyone else or outside this formation. */
export function useCraneRows(ctx: Ctx, user: FFXCombatant): AvailableCommand[] {
  if (!useCraneOffered(ctx, user)) return [];
  const aimable = craneTargetable(ctx);
  const row: AvailableCommand = {
    command: { kind: 'trigger', id: OB_ROWS.useCrane, targets: [] },
    label: 'Use crane',
    category: 'special',
    mpCost: 0,
    rank: 3,
    enabled: aimable,
    validTargets: aimable ? [OB_CRANE_ID] : [],
    targeting: 'single-enemy',
    help: 'Put the crane to work on the machine. It costs the turn, and the crane needs power first.',
  };
  if (!aimable) row.disabledReason = 'The crane is spent';
  return [row];
}

/**
 * The crane's `onTargeted` for Use crane (RE 4.5), run by the Trigger Command's handler. **Unpowered**: the "out of power" line and nothing else. **Powered**: the Crane row on the Oblitzerator as the crane's own
 * free action, the command spent (it leaves Tidus's list) and the crane untargetable. Returns false only when the command does not name a standing crane (the executor then says so and the turn is spent).
 */
export function applyUseCrane(ctx: Ctx, _user: FFXCombatant, command?: TriggerCommand): boolean {
  const crane = tryActor(ctx, OB_CRANE_ID);
  if (crane === undefined || !isAlive(crane) || command?.targets[0] !== OB_CRANE_ID || craneState(ctx) === CRANE_SPENT) return false;
  if (craneState(ctx) === CRANE_DARK) {
    queueEmit(ctx, { type: 'script-trigger', name: OB_CALLOUTS.noPower, payload: {} });
    return true;
  }
  ctx.state.flags[OB_CRANE_FLAG] = CRANE_SPENT;
  crane.flags.untargetable = true;
  const lift: Command = { kind: 'ability', id: OB_ROWS.lift, targets: [OB_ID] };
  queueReaction(ctx, OB_CRANE_ID, lift, { forced: true, byId: OB_ID, requiresAlive: OB_ID });
  return true;
}
