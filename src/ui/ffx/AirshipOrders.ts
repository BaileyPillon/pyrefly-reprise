import type { AvailableCommand, BattleState, Command } from '../../battle/common/types.ts';
import {
  AIRSHIP_MISSILES,
  AIRSHIP_ORDER,
  AIRSHIP_RANGE,
  CID_ID,
  MISSILE_COUNT,
  ORDER_CLOSE_IN,
  ORDER_PULL_BACK,
} from '../../battle/ffx/ai/evrae-rules.ts';
import { AirshipOrderWidget } from './AirshipOrderWidget.ts';

/**
 * **Where the Evrae order widget meets the real command menu — THIS CHAPTER ONLY.**
 *
 * **Game case: FFX only** [AGENTS.md rule 14]: Trigger Commands, the CTB queue
 * and Cid's own turn are FFX; the airship flags are set by
 * `src/battle/ffx/ai/evrae-rules.ts` and nothing else.
 *
 * Built to the driver's recommendation (option A's cascade and cost preview,
 * `docs/concepts/chapters/evrae/widget/`), **not** a Bailey pick: INFERRED in
 * `docs/target/targets.json` ("Evrae's order/range widget (FFX)").
 *
 * What it does, and the one rule that keeps every other chapter unchanged:
 * - {@link AirshipOrders.choose} is a pass-through (`openMenu(commands)`,
 *   untouched) unless `state.flags['airship.range']` is `'near'` or `'far'`
 *   **and** the menu offers the two order rows. Only the Evrae encounter ever
 *   sets that flag (`AirshipOrderWidget.applies`).
 * - When it applies, the two Trigger rows fold into **one** cascade row,
 *   "Orders"; choosing it opens {@link AirshipOrderWidget} in the command area
 *   (the two rows, "Already near/far", the cost preview with the volley pips).
 *   Cancel goes back to the menu. The command returned is the engine's own
 *   `TriggerCommand`, unmodified.
 * - {@link AirshipOrders.dockChip} clamps the gold ORDER chip onto Cid's CTB
 *   tile while an order is standing (option A, step 4).
 *
 * The row label "Orders" is this integration's own copy (the widget's two rows
 * carry the approved "Pull back" / "Close in", D-020 Q9); recorded as inferred.
 */
export class AirshipOrders {
  readonly widget = new AirshipOrderWidget();

  /** The widget's element, for the HUD to place in its command area. */
  get el(): HTMLElement {
    return this.widget.el;
  }

  /**
   * Ask for a command. `openMenu` is the HUD's ordinary command menu; it is
   * called with `commands` exactly as given for every battle without the
   * airship range, so no other chapter's menu changes.
   */
  async choose(
    commands: AvailableCommand[],
    state: BattleState | null,
    openMenu: (commands: AvailableCommand[]) => Promise<Command>,
  ): Promise<Command> {
    const range = state?.flags[AIRSHIP_RANGE];
    const orders = commands.filter(isOrderRow);
    if (!AirshipOrderWidget.applies(range) || orders.length === 0) return openMenu(commands);

    const folded = airshipMenuRows(commands, state?.flags);
    for (;;) {
      const picked = await openMenu(folded);
      if (!isOrderCommand(picked)) return picked;
      const order = await this.openWidget(orders, range, state);
      if (order) return order;
      // Cancelled: back to the cascade, same decision — two frames later, so
      // the menu opening at its top row (which frees Esc at once) cannot hand
      // the same Esc press to the pause menu (`cancelClaim.ts`).
      await afterFrames(2);
    }
  }

  /** Put the ORDER chip on Cid's CTB tile while an order is standing. Idempotent. */
  dockChip(ctbRoot: HTMLElement, state: BattleState | null): void {
    const cidRow = ctbRoot.querySelector<HTMLElement>(`[data-actor="${CID_ID}"]`);
    if (!cidRow) return;
    cidRow.querySelector('.ffx-airship-order__chip')?.remove();
    const order = state?.flags[AIRSHIP_ORDER];
    if (order !== 'far' && order !== 'near') return;
    cidRow.insertAdjacentHTML(
      'afterbegin',
      AirshipOrderWidget.orderChipHtml(order === 'far' ? ORDER_PULL_BACK : ORDER_CLOSE_IN),
    );
  }

  /** The decision went away (an action is resolving, the fight ended): take the widget down. */
  abandon(): void {
    if (!this.widget.el.hidden) this.widget.hide();
  }

  dispose(): void {
    this.widget.dispose();
  }

  private openWidget(
    orders: AvailableCommand[],
    range: 'near' | 'far',
    state: BattleState | null,
  ): Promise<Command | null> {
    const volleys = state?.flags[AIRSHIP_MISSILES];
    const left = typeof volleys === 'number' ? Math.max(0, Math.min(MISSILE_COUNT, volleys)) : MISSILE_COUNT;
    const standing = state?.flags[AIRSHIP_ORDER];
    return new Promise<Command | null>((resolve) => {
      void this.widget
        .open(orders, range, left, {
          pending: standing === 'far' || standing === 'near' ? standing : null,
          onCancel: () => resolve(null),
        })
        .then(resolve);
    });
  }
}

/** Resolve after `n` animation frames (a macrotask each where there is no rAF). */
function afterFrames(n: number): Promise<void> {
  return new Promise((resolve) => {
    const step = (left: number): void => {
      if (left <= 0) return resolve();
      if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => step(left - 1));
      else setTimeout(() => step(left - 1), 0);
    };
    step(n);
  });
}

/**
 * The list the cascade paints on this board: the two orders folded into one
 * "Orders" row in the airship battle, `commands` itself in every other one.
 * Exported so the advisor card's "in Orders" chip is checked against the stack
 * the player actually sees (`tests/unit/advisor-menu.test.ts`).
 */
export function airshipMenuRows(
  commands: AvailableCommand[],
  flags: Readonly<Record<string, unknown>> | undefined,
): AvailableCommand[] {
  const orders = commands.filter(isOrderRow);
  if (!AirshipOrderWidget.applies(flags?.[AIRSHIP_RANGE]) || orders.length === 0) return commands;
  return foldOrders(commands, orders);
}

function isOrderRow(c: AvailableCommand): boolean {
  return isOrderCommand(c.command);
}

function isOrderCommand(c: Command): boolean {
  return c.kind === 'trigger' && (c.id === ORDER_PULL_BACK || c.id === ORDER_CLOSE_IN);
}

/**
 * The menu with the two order rows replaced by one "Orders" row, at the first
 * one's place. The row is the first enabled order's own `AvailableCommand`
 * relabelled (both orders share a rank, so the CTB preview the menu draws while
 * it is highlighted is the true one). No enabled order, no row.
 */
function foldOrders(commands: AvailableCommand[], orders: AvailableCommand[]): AvailableCommand[] {
  const first = orders.find((o) => o.enabled);
  // Option A, step 1: "on anyone else's turn they are not there" — the engine
  // offers the rows greyed ("Not your call") to the four who cannot give an
  // order; the cascade drops them instead.
  const row: AvailableCommand | null = first ? { ...first, label: 'Orders' } : null;
  const out: AvailableCommand[] = [];
  let placed = false;
  for (const c of commands) {
    if (!isOrderRow(c)) out.push(c);
    else if (!placed) {
      if (row) out.push(row);
      placed = true;
    }
  }
  return out;
}
