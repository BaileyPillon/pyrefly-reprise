import type { AvailableCommand, Command } from '../../battle/common/types.ts';
import { ORDER_CANCEL, ORDER_CLOSE_IN, ORDER_PULL_BACK } from '../../battle/ffx/ai/evrae-rules.ts';
import { RawInputWatcher, wireClicks, type UiButton } from './rawInput.ts';
import { claimCancel, releaseCancel, releaseCancelAfterPress } from './cancelClaim.ts';

/**
 * The Evrae chapter's order widget — **THIS CHAPTER ONLY**.
 *
 * **Approved shape, one order at a time.** Bailey picked option A with C's staging on 2026-09-23 (D-032: the Trigger rows in the
 * cascade, the cost preview, the ORDER chip), and on 2026-10-09 said "Yes, match the game" to the game's own rule: the airship
 * offers **one order at a time** — Pull back while the ship is NEAR, Close in (the game's "Move in") while it is FAR, Cancel while
 * an order is standing — so the widget lists exactly the rows the engine offers (`src/battle/ffx/ai/evrae-rules.ts#orderOnOffer`)
 * and nothing greyed ("Already near/far" and "Ordered" are gone with the redundant order they refused). The cascade, the cost slab
 * and the ORDER chip are as approved.
 *
 * **Mounts only for this encounter.** {@link AirshipOrderWidget.applies} is the
 * single gate: it is true only once `BattleState.flags['airship.range']` is a
 * string (`'near' | 'far'`), which only `src/battle/ffx/ai/evrae-rules.ts` ever
 * sets (`docs/handoff/chapter-evrae-engine.md` §"Engine capabilities"). No
 * other chapter's flags carry that key, so mounting this widget can never
 * change any other chapter's screen. The live command flow reaches it through
 * `./AirshipOrders.ts` (the integrator's wiring, `docs/handoff/chapter-evrae.md`):
 * the order rows fold into one "Orders" row in the cascade, and choosing
 * it opens this widget; Esc goes back (the caller's `onCancel`).
 *
 * **The cost is the whole design** (`special-orders-evrae.ts`'s own header):
 * an order costs the speaking character's turn and executes on Cid's next turn
 * in place of a missile volley [research/ffx-evrae-airship.md §4.2]. Cancel
 * costs the turn alone, and gives Cid his next turn back.
 *
 * **14 px type floor.** This HUD is authored on the 640×360 grid every other
 * `src/ui/ffx/*.ts` component uses (`ffx-hud.css`'s own header) and scaled to
 * fill the screen; `src/ui/inkgold/screens.css` documents its own sizes
 * against a 2.25× reference scale in a trailing comment (`font-size: 6.22px;
 * /* 14 *\/`), so 14 real px is 6.22 grid px. Every label and value below sizes
 * at or above that floor; see `ffx-hud.css`'s `.ffx-airship-order` rules.
 *
 * **Keyboard reachable.** Wired through the same {@link RawInputWatcher} every
 * other menu overlay in `src/ui/ffx/` uses (`TriggerPrompt.ts`): arrow keys /
 * WASD move the selection, Enter/Space/Z confirms, Escape/X/Backspace cancels
 * back to whatever the caller passed as `onCancel`.
 */

type OrderId = typeof ORDER_PULL_BACK | typeof ORDER_CLOSE_IN | typeof ORDER_CANCEL;

interface OrderRow {
  id: OrderId;
  /**
   * Player-facing label: **"Pull back"** and **"Close in"** over the game's "Move in"
   * (`special-orders-evrae.ts`: D-020 Q9, the owner's own words), and the game's "Cancel".
   */
  label: string;
}

/** `open`'s optional extras. */
export interface AirshipOrderOpenOptions {
  /** Called on Escape / X / Backspace. Without it, cancel does nothing (the widget must be answered). */
  onCancel?: () => void;
}

/** The three orders in the order they are listed in (at most one is ever on offer). */
const ROWS: readonly OrderRow[] = [
  { id: ORDER_PULL_BACK, label: 'Pull back' },
  { id: ORDER_CLOSE_IN, label: 'Close in' },
  { id: ORDER_CANCEL, label: 'Cancel' },
];

export class AirshipOrderWidget {
  readonly el: HTMLElement;
  private index = 0;
  private rows: OrderRow[] = [];
  private commands: AvailableCommand[] = [];
  /** `null` in a fight where Cid fires nothing (the Sin Fins, S-19): no pip strip and no volley in the cost. */
  private volleysLeft: number | null = 0;
  private resolve: ((c: Command) => void) | null = null;
  private onCancel: (() => void) | null = null;
  private readonly watcher = new RawInputWatcher((b) => this.onButton(b));
  private unwireClicks: (() => void) | null = null;

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'ig-cmd-stack ffx-airship-order';
    this.el.hidden = true;
  }

  /**
   * The single mount gate. `range` is `state.flags['airship.range']` read
   * as-is; every other chapter's flags never carry that key, so this is
   * `false` everywhere else in the game.
   */
  static applies(range: unknown): range is 'near' | 'far' {
    return range === 'near' || range === 'far';
  }

  /**
   * `commands` is the Trigger rows the engine offers (`kind: 'trigger'`, `id: 'pull-back' | 'close-in' | 'cancel-order'`): the
   * widget lists the **enabled** ones, which is the one on offer, with the copy and cost preview the raw menu row does not carry.
   * It never invents a command. `volleysLeft` drives the three-pip readout (`state.flags['airship.missilesLeft']`); `null` draws
   * no pip strip and leaves the volley out of the cost, for a fight in which Cid fires nothing (the Sin Fins, research/ffx-sin.md
   * §2.5 S-19; plan REVIEW must-change 4). Evrae always passes a number, so its widget is unchanged.
   */
  open(commands: AvailableCommand[], volleysLeft: number | null, opts: AirshipOrderOpenOptions = {}): Promise<Command> {
    this.commands = commands.filter((c) => c.enabled && c.command.kind === 'trigger');
    this.rows = ROWS.filter((r) => this.commands.some((c) => c.command.kind === 'trigger' && c.command.id === r.id));
    this.volleysLeft = volleysLeft;
    this.onCancel = opts.onCancel ?? null;
    this.index = 0;
    this.el.hidden = false;
    this.render();
    this.watcher.attach();
    // Esc is this widget's back button while it is open (and only when the
    // caller gave it somewhere to go back to), not the pause menu's.
    if (this.onCancel) claimCancel();
    this.unwireClicks = wireClicks(this.el, (action) => this.choose(Number(action)));
    return new Promise<Command>((resolve) => {
      this.resolve = resolve;
    });
  }

  private onButton(b: UiButton): void {
    if (b === 'up' || b === 'down') {
      const n = this.rows.length;
      if (n > 0) this.index = (this.index + (b === 'up' ? -1 : 1) + n) % n;
      this.render();
    } else if (b === 'confirm') {
      this.choose(this.index);
    } else if (b === 'cancel' && this.onCancel) {
      const cancel = this.onCancel;
      this.close();
      // Released a frame later, so the same Esc press cannot also open the
      // pause menu (`cancelClaim.ts` has the race).
      releaseCancelAfterPress();
      cancel();
    }
  }

  /**
   * Take the widget down without choosing: input off, hidden, the pending
   * promise dropped. For a decision that was abandoned elsewhere (an action
   * already resolving, the battle ending).
   */
  hide(): void {
    const owned = this.onCancel !== null;
    this.close();
    if (owned) releaseCancel();
  }

  private close(): void {
    this.watcher.detach();
    this.unwireClicks?.();
    this.unwireClicks = null;
    this.el.hidden = true;
    this.resolve = null;
    this.onCancel = null;
  }

  private choose(i: number): void {
    const row = this.rows[i];
    if (!row) return;
    const cmd = this.commands.find((c) => c.command.kind === 'trigger' && c.command.id === row.id);
    if (!cmd) return;
    const owned = this.onCancel !== null;
    this.watcher.detach();
    this.unwireClicks?.();
    this.el.hidden = true;
    this.onCancel = null;
    if (owned) releaseCancel();
    const resolve = this.resolve;
    this.resolve = null;
    resolve?.(cmd.command);
  }

  /** A gold "ORDER" chip for `FFXBattleHud`/`CtbList` to dock on Cid's CTB tile — this widget draws it but never docks it itself, so wiring is one line in the integrator's commit rather than a dependency on `CtbList.ts`'s internals. */
  static orderChipHtml(orderId: typeof ORDER_PULL_BACK | typeof ORDER_CLOSE_IN): string {
    const label = ROWS.find((r) => r.id === orderId)?.label ?? orderId;
    return `<span class="ffx-airship-order__chip" title="${escapeHtml(label)} — Cid's next turn">ORDER</span>`;
  }

  /**
   * Option A's two parts: the row on offer in the cascade (tagged "Trigger"), and
   * under it the ivory cost slab for the highlighted order. An order forgoes Cid's
   * next volley; it does not spend one from the rack (`evrae-rules.ts#applyQueuedOrder`),
   * so the pips count the rack. Cancel costs the turn alone and gives Cid his turn back.
   */
  private render(): void {
    const volleys = this.volleysLeft;
    const pips = volleys === null ? '' : Array.from(
      { length: 3 },
      (_, i) => `<i class="${i < volleys ? 'ffx-airship-order__pip--live' : 'ffx-airship-order__pip--spent'}"></i>`,
    ).join('');
    const rows = this.rows
      .map((r, i) => {
        const cls = ['ig-cmd', 'ffx-cmd--trigger', i === this.index ? 'ig-cmd--selected' : ''].filter(Boolean).join(' ');
        return `<div class="${cls}" style="margin-left:calc(var(--ig-cascade-step) * ${i})" data-ui-action="${i}"><span class="ffx-cmd--trigger__label">${escapeHtml(r.label)}</span><span class="ffx-airship-order__tag">Trigger</span></div>`;
      })
      .join('');
    const live = this.rows[this.index];
    let slab = '';
    if (live?.id === ORDER_CANCEL) {
      slab =
        `<div class="ffx-airship-order__slab"><span class="ffx-airship-order__slab-title">Cancelling costs</span>` +
        `<span class="ffx-airship-order__cost">Turn now &middot; Cid keeps his turn</span></div>`;
    } else if (live) {
      // No rack (the Sin Fins, S-19): the cost is the two turns, and nothing is left to count.
      const cost = volleys === null ? "Turn now &middot; Cid's next turn" : "Turn now &middot; Cid's next turn &middot; 1 volley";
      const left = volleys === null ? '' : `<span class="ffx-airship-order__left"><span class="ffx-airship-order__pips">${pips}</span>Volleys left ${volleys}</span>`;
      slab =
        `<div class="ffx-airship-order__slab"><span class="ffx-airship-order__slab-title">This order costs</span>` +
        `<span class="ffx-airship-order__cost">${cost}</span>${left}</div>`;
    }
    this.el.innerHTML = rows + slab;
  }

  dispose(): void {
    this.watcher.detach();
    this.unwireClicks?.();
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
