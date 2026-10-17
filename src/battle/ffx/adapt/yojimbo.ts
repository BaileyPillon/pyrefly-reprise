/**
 * The player's Yojimbo in the engine (re-parity lane FFX-K, row K2; **FFX only**): the seam between `kernel/yojimbo.ts` (the game's rules,
 * proven against FFX.exe) and the engine's combatants, streams and target picker. Nothing here is a rule of its own.
 *
 * - **State** ({@link YojimboRuntime}): the compatibility, the hire answer and how many actions of his have been parsed (the game's
 *   `Chr+0x6df`). A build that owns him must give the first two (`FFXPartyBuild.yojimbo`, no default); {@link initYojimbo} throws when it does not.
 *   The compatibility is mirrored into `state.flags['yojimbo:compatibility']` and the gil into `state.flags['yojimbo:gil']` after every change, so a chain
 *   carries both to the next link (`BattleScreenSetup.carryPartyForward`).
 * - **The turn start** ({@link yojimboTurnStart}): one draw on stream 17; a win makes the turn his own (a free attack), otherwise the menu opens.
 * - **Pay** ({@link payCommand}): the payment, the script's roll, the target pick, the payment taken when the action goes through, the whole gauge when
 *   the full-gauge bonus was taken.
 * - **Dismiss** and **the wipe**: compatibility -3 for a Dismiss as his first action, -10 when he is knocked out while out.
 *
 * **A group command is carried out on the whole list the pick returned.** The pick of Zanmato (0xb7, reach 1) is the game's auto-target: the legal enemies (in battle,
 * targetable, alive, distance 1 or less), ONE draw on stream 5 to choose one enemy group (a draw even when only one is populated, none when the set is empty), and
 * every legal member of that group; the command is then queued on that whole mask (`research/re-ffx-zanmato-and-orders.md` section 2). {@link commandOf} hands the
 * executor the list in ascending slot order and the `zanmato` ability row keeps it whole (`extra.groupTarget`), so a landed Zanmato kills every one of them. No draw
 * of its own is added: the executor builds the targets without one (no Cover, no Reflect bounce, no spread), and the hit then takes one status draw per target.
 *
 * What the engine reads for the script (`FFX-G08` sections 3.1 to 3.4): the highest Zanmato byte among the monsters on the field (the data's
 * `zanmatoLevel` minus 1, which the data files record as "byte + 1"; a monster with none counts as byte 0), his gauge in the aeon bar's 20 points, the
 * party's gil before the payment, Curse. **Not sourced and handled by reading** (marked [I] in the note): the "matching group" of the free attack's
 * Zanmato check is the monsters in the target set the pick just stored (the engine's monsters are all one group, `Chr+0x504` is not in our data), and
 * a command with no target set cannot be queued (so nothing is paid and no compatibility moves).
 */

import type { Command, FFXCombatant, FFXPartyBuild, YojimboBuild } from '../../common/types.ts';
import { aeonSpecialRequest, EventKind, YOJIMBO_DISMISS, YOJIMBO_PAY } from '../kernel/aeon-request.ts';
import { autoTargetMask } from '../kernel/legal-set.ts';
import {
  type YojimboHost,
  type YojimboInputs,
  type YojimboRun,
  YOJIMBO_COMMAND_B1A,
  YojimboCommand,
  dismissEvent,
  freeAttackEvent,
  payEvent,
  turnStartRoll,
  wipeEvent,
} from '../kernel/yojimbo.ts';
import { type Ctx, abilityOf, enemies, has } from '../state.ts';
import { FfxStream } from './streams.ts';
import { chainCommand, chainPick, chainSlotOf, chainWorld, combatantsOf, idsOf } from './target-world.ts';
import { holdsGrandSummon, unitOf } from './od-world.ts';

/** The engine id of the player's Yojimbo. */
export const YOJIMBO_ID = 'yojimbo';

/** The ability record each of the five rolled commands is carried out with. */
export const COMMAND_ABILITY: Readonly<Record<number, string>> = {
  [YojimboCommand.Daigoro]: 'daigoro',
  [YojimboCommand.Kozuka]: 'kozuka',
  [YojimboCommand.WakizashiOne]: 'wakizashi-single',
  [YojimboCommand.WakizashiAll]: 'wakizashi-multi',
  [YojimboCommand.Zanmato]: 'zanmato',
};

/** The player's Yojimbo's state for one battle. */
export interface YojimboRuntime {
  /** His compatibility, 0 to 255 (a global in the game: it persists between battles). */
  compat: number;
  /** The hire answer: 0, 1 or 2. */
  hire: number;
  /** Actions of his parsed so far in this battle (`Chr+0x6df`, saturating at 255). */
  parsed: number;
}

/** Does the party own the player's Yojimbo? */
export function ownsYojimbo(party: FFXPartyBuild): boolean {
  return party.aeons.some((a) => a.id === YOJIMBO_ID);
}

/** The compatibility is a whole number of the game's byte. */
function checkBuild(build: YojimboBuild): void {
  if (!Number.isInteger(build.compatibility) || build.compatibility < 0 || build.compatibility > 255) {
    throw new RangeError(`FFX engine: Yojimbo's compatibility must be a whole number from 0 to 255, not ${String(build.compatibility)}`);
  }
  if (build.hireAnswer !== 0 && build.hireAnswer !== 1 && build.hireAnswer !== 2) {
    throw new RangeError(`FFX engine: Yojimbo's hire answer must be 0, 1 or 2, not ${String(build.hireAnswer)}`);
  }
}

/**
 * Set the player's Yojimbo up from the build, or throw when the build owns him and does not say how he starts (no default exists in `src/battle`: the
 * image holds 0 and no initialiser was found). Called by `buildBattle`; inert for a build that does not list him.
 */
export function initYojimbo(ctx: Ctx, party: FFXPartyBuild): void {
  const owns = ownsYojimbo(party);
  if (!owns) {
    if (party.yojimbo !== undefined) throw new Error('FFX engine: the build gives `yojimbo` but does not list him in `aeons`');
    return;
  }
  if (party.yojimbo === undefined) {
    throw new Error("FFX engine: a build that owns Yojimbo must give `yojimbo: { compatibility, hireAnswer }` (his starting compatibility has no default anywhere in src/battle)");
  }
  checkBuild(party.yojimbo);
  ctx.rt.yojimbo = { compat: party.yojimbo.compatibility, hire: party.yojimbo.hireAnswer, parsed: 0 };
  mirror(ctx);
}

/** The state a chain carries: his compatibility, and the gil Pay has spent. */
function mirror(ctx: Ctx): void {
  const y = ctx.rt.yojimbo;
  if (!y) return;
  ctx.state.flags['yojimbo:compatibility'] = y.compat;
  ctx.state.flags['yojimbo:gil'] = ctx.rt.gil;
}

/** The game's Zanmato byte of a monster: the data's `zanmatoLevel` is the byte plus 1, and a monster that carries none is taken as byte 0. */
export function zanmatoByte(c: FFXCombatant): number {
  const level = c.enemy?.zanmatoLevel;
  return level === undefined ? 0 : Math.max(0, level - 1);
}

/** Where the last pick left its target set (the game stores it in `Chr+0xdc0`). */
interface Pick {
  command: number;
  mask: number;
  ids: string[];
  zan: number;
}

/** The script's world: his rolls on stream 17, the shared auto-target picker for `btlSetRandomTarget`, and the queueing of the chosen command. */
function hostFor(ctx: Ctx, actor: FFXCombatant, picked: Pick): YojimboHost {
  return {
    draw: () => ctx.rng.on(FfxStream.Yojimbo).int(0, 0x7fffffff),
    target: (command) => {
      const abilityId = COMMAND_ABILITY[command];
      const def = abilityId === undefined ? undefined : abilityOf(ctx, abilityId);
      if (def === undefined) throw new Error(`FFX engine: Yojimbo's command ${command.toString(16)} has no ability record '${String(abilityId)}' registered`);
      const slot = chainSlotOf(ctx, actor);
      if (slot === undefined) throw new Error('FFX engine: Yojimbo has no game slot');
      // BattleDistance is asked for: the command words below carry the game's own reach (Zanmato and Wakizashi on all: 1), so a foe at distance 2 or 3 is out of the legal set.
      const world = chainWorld(ctx, actor, def, false, true);
      // The picker reads the command record's byte `Cmd+0x1a` (single target 0x33 / 0xb3, group 0xb7, `FFX-G08` section 2); its side is 0, the opposite one.
      const cmd = { ...chainCommand(actor, def, 1, false), b1a: YOJIMBO_COMMAND_B1A[command] ?? 0 };
      const mask = autoTargetMask(world.slots, slot, command, 0, cmd, chainPick(ctx, world));
      const members = combatantsOf(world, mask);
      picked.command = command;
      picked.mask = mask;
      picked.ids = idsOf(world, mask);
      picked.zan = members.reduce((m, c) => Math.max(m, zanmatoByte(c)), 0);
      return mask !== 0;
    },
    // The queueing succeeds when the pick stored a target set for this very command.
    perform: (command) => picked.command === command && picked.mask !== 0,
  };
}

/** What the script reads. */
function inputsFor(ctx: Ctx, actor: FFXCombatant, given: number, picked: Pick): YojimboInputs {
  const y = ctx.rt.yojimbo!;
  const points = holdsGrandSummon(actor) ? 100 / unitOf(actor) : Math.floor((actor.overdrive?.gauge ?? 0) / unitOf(actor));
  return {
    compat: y.compat,
    given,
    gil: ctx.rt.gil,
    hire: y.hire,
    zanAll: enemies(ctx).reduce((m, c) => Math.max(m, zanmatoByte(c)), 0),
    zanGroup: () => picked.zan,
    odCur: points,
    odMax: 100 / unitOf(actor),
    curse: has(actor, 'curse') ? 1 : 0,
    turns: y.parsed,
    reaction: 0,
  };
}

/** The ability command the roll's winner is carried out with, aimed at the set the pick stored. */
function commandOf(run: YojimboRun, picked: Pick): Command | null {
  if (!run.queued) return null;
  const id = COMMAND_ABILITY[run.command];
  return id === undefined || picked.ids.length === 0 ? null : { kind: 'ability', id, targets: picked.ids.slice() };
}

const newPick = (): Pick => ({ command: 0, mask: 0, ids: [], zan: 0 });

/** A parsed action of his (the counter saturates at 255). */
function parsed(ctx: Ctx): void {
  const y = ctx.rt.yojimbo!;
  y.parsed = Math.min(255, y.parsed + 1);
}

/** Is this combatant the player's Yojimbo under the game's rules? */
export function isPlayerYojimbo(ctx: Ctx, c: FFXCombatant): boolean {
  return ctx.rt.yojimbo !== undefined && c.id === YOJIMBO_ID && c.side === 'aeon';
}

/**
 * The start of his turn (`0x00792120`, then the script's event 0): one draw on stream 17 decides whether the turn is his own. Returns `null` when the
 * menu should open, else the free attack: its command, or `command: null` when the roll chose one nobody could be aimed at (the turn passes).
 */
export function yojimboTurnStart(ctx: Ctx, actor: FFXCombatant): { command: Command | null } | null {
  if (!isPlayerYojimbo(ctx, actor)) return null;
  const y = ctx.rt.yojimbo!;
  if (turnStartRoll(0xe, 0, y.compat, () => ctx.rng.on(FfxStream.Yojimbo).int(0, 0x7fffffff)) === 0) return null;
  const picked = newPick();
  const run = freeAttackEvent(inputsFor(ctx, actor, 0, picked), hostFor(ctx, actor, picked));
  y.compat = run.compat;
  parsed(ctx);
  mirror(ctx);
  return { command: commandOf(run, picked) };
}

/** What a Pay came to. */
export interface PayOutcome {
  /** The command the roll chose, aimed; `null` when none could be queued. */
  command: Command | null;
  /** A payment of nothing: he dismisses himself (compatibility -20). */
  dismissSelf: boolean;
  /** The run, for the log. */
  run: YojimboRun;
  /** The gil taken. */
  paid: number;
}

/**
 * Pay `amount` gil (the request maps the command to event 9 first; `0x7b2980`). The script runs before the payment is taken (it reads the gil as it
 * stands); the payment is taken when the chosen command was queued, if the party can afford it; the full-gauge bonus spends the whole gauge whether
 * or not anything was queued. `spend` carries the gauge out (the engine's `spendOverdrive`).
 */
export function payCommand(ctx: Ctx, actor: FFXCombatant, amount: number, spend: (c: FFXCombatant) => void): PayOutcome {
  const request = aeonSpecialRequest(0xe, 0, [YOJIMBO_PAY, 0xffff]);
  if (request === null || request.kind !== EventKind.Pay) throw new Error('FFX engine: the requester no longer maps Pay to event 9');
  const y = ctx.rt.yojimbo!;
  const picked = newPick();
  const run = payEvent(inputsFor(ctx, actor, amount, picked), hostFor(ctx, actor, picked));
  y.compat = run.compat;
  parsed(ctx);
  if (run.gaugeBonus) spend(actor);
  const dismissSelf = amount <= 0;
  let paid = 0;
  if (run.queued && amount > 0 && ctx.rt.gil - amount >= 0) {
    ctx.rt.gil -= amount;
    paid = amount;
  }
  mirror(ctx);
  return { command: dismissSelf ? null : commandOf(run, picked), dismissSelf, run, paid };
}

/** His Dismiss as an action (event 10): compatibility -3 when no action of his has been parsed yet, then the action is parsed. */
export function yojimboDismiss(ctx: Ctx): void {
  const request = aeonSpecialRequest(0xe, 0, [YOJIMBO_DISMISS, 0xffff]);
  if (request === null || request.kind !== EventKind.Dismiss) throw new Error('FFX engine: the requester no longer maps his Dismiss to event 10');
  const y = ctx.rt.yojimbo!;
  y.compat = dismissEvent(y.compat, y.parsed).compat;
  parsed(ctx);
  mirror(ctx);
}

/** He is knocked out while he is out (event 11): compatibility -10. */
export function yojimboWiped(ctx: Ctx): void {
  const y = ctx.rt.yojimbo;
  if (!y) return;
  y.compat = wipeEvent(y.compat).compat;
  mirror(ctx);
}

/** His state for the tests and the advisor: a copy. */
export function yojimboStateOf(ctx: Ctx): YojimboRuntime | undefined {
  return ctx.rt.yojimbo === undefined ? undefined : { ...ctx.rt.yojimbo };
}
