/**
 * The commands of the player's Yojimbo and the Magus Sisters (re-parity lane FFX-K; **FFX only**): the ids a chapter's screens send, the rows their menus
 * are built from and the executor that carries them out. Inert unless the build owns them (`FFXRuntime.yojimbo` / `.sisters`).
 *
 * **What a screen sends** (all are ordinary `Command`s, so the contract does not move):
 *
 * - **Pay**: `{ kind: 'ability', id: PAY_ABILITY_ID, targets: [], gilSpent: <the payment> }`. `gilSpent` is a whole number from 0 to the party's gil
 *   (`state.flags['yojimbo:gil']` holds what is left); 0 is the "pay nothing" branch (compatibility -20 and he leaves). Anything else is refused and the
 *   turn stays open. Which command the payment buys is the game's roll (`kernel/yojimbo.ts`), not the player's.
 * - **An order**: `{ kind: 'ability', id: <one of ORDER_IDS>, targets: [] }`, for one of the orders the sister's menu offered this turn.
 * - **Dismiss**: the ordinary `{ kind: 'dismiss', targets: [] }` (any sister's; Yojimbo's costs 3 compatibility if it is his first action).
 *
 * **Menus**: Yojimbo's is Pay and Dismiss (the two commands the game's requester knows; whether the game's menu holds more is the note's open question 3).
 * A sister's is the orders the game's menu builder offered at the start of her turn, then Dismiss. All eight orders have their handlers built: Combine powers
 * (`adapt/sisters.ts`) and the other seven (`adapt/sister-orders.ts`, the target search and the sixteen handlers proved on the game's own code); a row whose handler
 * were missing would be listed but disabled with a reason, so a screen never shows a button that does nothing.
 *
 * Labels are our own words for what the command does, not the game's text; a chapter's screens give the final wording.
 */

import type { AvailableCommand, Command, FFXCombatant } from '../common/types.ts';
import type { Ctx } from './state.ts';
import type { ExecutionResult } from './execute.ts';
import { SISTER_DISMISS, SisterOrder } from './kernel/sisters.ts';
import { dismissAeon } from './aeons.ts';
import { spendOverdrive } from './overdrive.ts';
import { isPlayerYojimbo, payCommand, yojimboDismiss } from './adapt/yojimbo.ts';
import { BUILT_ORDERS, combineOrder, isSister } from './adapt/sisters.ts';
import { sisterOrder } from './adapt/sister-orders.ts';

/** The ability id of Yojimbo's Pay. */
export const PAY_ABILITY_ID = 'yojimbo-pay';

/** One order command: its ability id, the game's command id, and a label in our words. */
interface OrderRow {
  command: number;
  id: string;
  label: string;
}

/** The eight orders (`0x3124` to `0x312B`), in the game's order. */
export const ORDERS: readonly OrderRow[] = [
  { command: SisterOrder.Free, id: 'sister-order-free', label: 'Free choice' },
  { command: SisterOrder.Repeat, id: 'sister-order-repeat', label: 'Repeat last' },
  { command: SisterOrder.Attack, id: 'sister-order-attack', label: 'Attack order' },
  { command: SisterOrder.CindyBig, id: 'sister-order-cindy-spells', label: 'Spell order (Cindy)' },
  { command: SisterOrder.CindySupport, id: 'sister-order-cindy-support', label: 'Revive and support (Cindy)' },
  { command: SisterOrder.Combine, id: 'sister-order-combine', label: 'Combine for the Delta Attack' },
  { command: SisterOrder.SandySupport, id: 'sister-order-sandy-support', label: 'Support order (Sandy)' },
  { command: SisterOrder.MindyDrain, id: 'sister-order-mindy-drain', label: 'Drain order (Mindy)' },
];

/** The ability ids of the eight orders. */
export const ORDER_IDS: readonly string[] = ORDERS.map((o) => o.id);

const orderOf = (id: string): OrderRow | undefined => ORDERS.find((o) => o.id === id);

const dismissRow = (user: FFXCombatant): AvailableCommand => ({
  command: { kind: 'dismiss', targets: [] },
  label: 'Dismiss',
  category: 'aeon',
  mpCost: 0,
  rank: 3,
  enabled: user.aeon?.dismissable !== false,
  validTargets: [],
});

/**
 * The menu of the player's Yojimbo or of a sister, or `null` for anyone else (the ordinary menu then applies).
 */
export function aeonMenuRows(ctx: Ctx, user: FFXCombatant): AvailableCommand[] | null {
  if (isPlayerYojimbo(ctx, user)) {
    return [
      {
        command: { kind: 'ability', id: PAY_ABILITY_ID, targets: [], gilSpent: 0 },
        label: 'Pay',
        category: 'aeon',
        mpCost: 0,
        rank: 3,
        enabled: true,
        validTargets: [],
        help: 'The payment is the command row\'s `gilSpent`, from 0 to the gil the party has.',
      },
      dismissRow(user),
    ];
  }
  if (!isSister(ctx, user)) return null;
  const menu = ctx.rt.sisters!.menu;
  const offered = menu !== null && menu.actorId === user.id ? menu.orders : [SISTER_DISMISS];
  const rows: AvailableCommand[] = [];
  for (const cmd of offered) {
    if (cmd === SISTER_DISMISS) {
      rows.push(dismissRow(user));
      continue;
    }
    const o = ORDERS.find((x) => x.command === cmd);
    if (o === undefined) continue;
    const built = BUILT_ORDERS.has(cmd);
    const row: AvailableCommand = {
      command: { kind: 'ability', id: o.id, targets: [] },
      label: o.label,
      category: 'aeon',
      mpCost: 0,
      enabled: built,
      validTargets: [],
    };
    if (!built) row.disabledReason = 'Not built';
    rows.push(row);
  }
  return rows;
}

const refuse = (ctx: Ctx, text: string): ExecutionResult => {
  ctx.emit({ type: 'message', text, kind: 'system' });
  return { rank: 0, rejected: true, damageDealt: 0 };
};

/**
 * Carry out a command of the player's Yojimbo or of a sister, or `null` when it is not one of theirs (the ordinary executor then runs it). `run` carries
 * a command out through the ordinary executor: the command the roll chose, the Delta Attack.
 */
export function executeAeonCommand(ctx: Ctx, actor: FFXCombatant, command: Command, run: (who: FFXCombatant, command: Command) => ExecutionResult): ExecutionResult | null {
  if (isPlayerYojimbo(ctx, actor)) {
    if (command.kind === 'dismiss') {
      yojimboDismiss(ctx); // the penalty for leaving before he has done anything; the ordinary Dismiss follows
      return null;
    }
    if (command.kind !== 'ability' || command.id !== PAY_ABILITY_ID) return null;
    const amount = command.gilSpent ?? 0;
    if (!Number.isInteger(amount) || amount < 0 || amount > ctx.rt.gil) return refuse(ctx, 'That payment is more than the party has');
    ctx.emit({ type: 'action-start', actorId: actor.id, command, abilityName: 'Pay', targets: [] });
    const pay = payCommand(ctx, actor, amount, (c) => spendOverdrive(ctx, c));
    ctx.emit({ type: 'action-end', actorId: actor.id });
    if (pay.dismissSelf) {
      // A payment of nothing: the script queues his own Dismiss (compatibility -20 was taken by the Pay).
      const leave: Command = { kind: 'dismiss', targets: [] };
      ctx.emit({ type: 'action-start', actorId: actor.id, command: leave, abilityName: 'Dismiss', targets: [] });
      dismissAeon(ctx, 'command');
      ctx.emit({ type: 'action-end', actorId: actor.id });
      return { rank: 3, damageDealt: 0 };
    }
    if (pay.command === null) return { rank: 3, damageDealt: 0 };
    const done = run(actor, pay.command);
    return { rank: done.rank > 0 ? done.rank : 3, damageDealt: done.damageDealt, ...(done.def ? { def: done.def } : {}) };
  }

  if (isSister(ctx, actor) && command.kind === 'ability') {
    const order = orderOf(command.id);
    if (order === undefined) return null;
    const menu = ctx.rt.sisters!.menu;
    if (menu === null || menu.actorId !== actor.id || !menu.orders.includes(order.command)) return refuse(ctx, `${order.label} was not offered this turn`);
    if (!BUILT_ORDERS.has(order.command)) return refuse(ctx, `${order.label} is not built yet`);
    ctx.emit({ type: 'action-start', actorId: actor.id, command, abilityName: order.label, targets: [] });
    const result =
      order.command === SisterOrder.Combine
        ? combineOrder(ctx, actor, (who, cmd) => run(who, cmd))
        : sisterOrder(ctx, actor, order.command, (who, cmd) => run(who, cmd));
    ctx.emit({ type: 'action-end', actorId: actor.id });
    return { rank: result.rank, damageDealt: result.damageDealt };
  }
  return null;
}
