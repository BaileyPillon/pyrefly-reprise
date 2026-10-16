import type { AvailableCommand, BattleState, Command } from '../../battle/common/types.ts';
import { PAY_ABILITY_ID } from '../../battle/ffx/aeon-commands.ts';
import { paymentFor } from '../../engine/tactics/last-summoning.ts';
import { YojimboPayWidget } from './YojimboPayWidget.ts';

/**
 * **Where the player's Yojimbo's amount panel meets the real command menu — THE HIDDEN LAST SUMMONING ONLY** (FFX only; AGENTS.md rule 14).
 *
 * Yojimbo's menu is Pay and Dismiss, and the engine's Pay row carries `gilSpent: 0`, which is the "pay nothing" branch (he leaves). So choosing Pay in the ordinary menu must not submit that row as it stands: it asks
 * how much first. {@link YojimboPay.choose} is a pass-through (`openMenu(commands)`, untouched) unless the menu offers the Pay row of the engine (`yojimbo-pay`), which only the player's Yojimbo ever has; then it
 * runs the same loop the Evrae orders do (`./AirshipOrders.ts`): the menu, then on Pay the panel; **cancel goes back to the menu, the same decision**; and the command returned is the engine's own Pay row with the
 * payment in `gilSpent`.
 *
 * The panel opens on the move advisor's own payment (`paymentFor`, `engine/tactics/last-summoning.ts`: the smallest power of two that reaches a motivation of 63, or the largest the purse allows), so pressing Enter
 * is the line's recommendation and the digits can be changed from there.
 */
export class YojimboPay {
  readonly widget = new YojimboPayWidget();

  /** The panel's element, for the HUD to place in its command area. */
  get el(): HTMLElement {
    return this.widget.el;
  }

  async choose(
    commands: AvailableCommand[],
    state: BattleState | null,
    openMenu: (commands: AvailableCommand[]) => Promise<Command>,
  ): Promise<Command> {
    if (!commands.some(isPayRow)) return openMenu(commands);
    for (;;) {
      const picked = await openMenu(commands);
      if (!isPayCommand(picked)) return picked;
      const purse = numberFlag(state, 'yojimbo:gil');
      const suggested = paymentFor(purse, numberFlag(state, 'yojimbo:compatibility'));
      const paid = await this.widget.ask(purse, suggested);
      if (paid !== null) return { ...picked, gilSpent: paid } as Command;
      // Cancelled: back to his menu, same decision, two frames later so the menu opening cannot hand the same Esc press to the pause menu (`cancelClaim.ts`).
      await afterFrames(2);
    }
  }

  /** The decision went away (an action is resolving, the fight ended): take the panel down. */
  abandon(): void {
    this.widget.hide();
  }

  dispose(): void {
    this.widget.dispose();
  }
}

const isPayCommand = (c: Command): boolean => c.kind === 'ability' && c.id === PAY_ABILITY_ID;
const isPayRow = (r: AvailableCommand): boolean => r.enabled && isPayCommand(r.command);

function numberFlag(state: BattleState | null, key: string): number {
  const v = state?.flags[key];
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
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
