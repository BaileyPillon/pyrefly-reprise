import type { AvailableCommand, Command } from '../../battle/common/types.ts';
import { RawInputWatcher, wireClicks, type UiButton } from './rawInput.ts';
import { claimCancel, releaseCancel, releaseCancelAfterPress } from './cancelClaim.ts';

/**
 * The Evrae chapter's order widget — **THIS CHAPTER ONLY**.
 *
 * **Not an approved end state.** `docs/concepts/chapters/evrae/widget/options.json`
 * is Bailey's options round for O-3 (the order widget) and O-4 (reading NEAR vs
 * FAR without the HUD); Bailey has not picked. This file is built to the
 * orchestrator's recommendation — **option A's cascade-and-cost-preview widget**
 * — because a driver recommendation, not a Bailey pick, authored it
 * [AGENTS.md hard rule 9, "end state first"]. `docs/target/targets.json` records
 * this tile's `reaction.inferred` as "built to the driver's recommendation A +
 * C's staging, awaiting Bailey" and it is **never** marked approved. Option C's
 * half of the recommendation (re-staging the camera/backdrop for the NEAR/FAR
 * read with no persistent gauge) is scene-presentation work, not a HUD
 * element, and is owned by whoever wires `src/scenes/**` for this chapter —
 * see `docs/handoff/chapter-evrae-guide.md` for what is left open there.
 *
 * **Mounts only for this encounter.** {@link AirshipOrderWidget.applies} is the
 * single gate: it is true only once `BattleState.flags['airship.range']` is a
 * string (`'near' | 'far'`), which only `src/battle/ffx/ai/evrae-rules.ts` ever
 * sets (`docs/handoff/chapter-evrae-engine.md` §"Engine capabilities"). No
 * other chapter's flags carry that key, so mounting this widget can never
 * change any other chapter's screen. The live command flow reaches it through
 * `./AirshipOrders.ts` (the integrator's wiring, `docs/handoff/chapter-evrae.md`):
 * the two Trigger rows fold into one "Orders" row in the cascade, and choosing
 * it opens this widget; Esc goes back (the caller's `onCancel`).
 *
 * **The cost is the whole design** (`special-orders-evrae.ts`'s own header):
 * an order costs the speaking character's turn, executes on Cid's next turn
 * in place of a missile volley, and last order wins if two are queued before
 * he acts [research/ffx-evrae-airship.md §4.2]. The row for the range the ship
 * is *already* in is disabled and reads "Already near" / "Already far" — the
 * state is stated in words at the only moment it can be changed, answering
 * §12.3's "readable without the HUD" bar for players who have the panel open.
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

export interface AirshipOrderRow {
  id: 'pull-back' | 'close-in';
  /**
   * Player-facing label. Recommended copy, awaiting the same approval as the
   * widget itself: `special-orders-evrae.ts`'s own header names **"Pull
   * back"** and **"Close in"** over "Move in" (single-source and reads as the
   * player moving).
   */
  label: string;
  disabled: boolean;
  /** Shown in place of a cost preview when `disabled` — "Already near/far". */
  disabledReason?: string;
}

/** {@link AirshipOrderWidget.open}'s optional extras. */
export interface AirshipOrderOpenOptions {
  /** The order already standing (`state.flags['airship.order']`); its row reads "Ordered". */
  pending?: 'near' | 'far' | null;
  /** Called on Escape / X / Backspace. Without it, cancel does nothing (the widget must be answered). */
  onCancel?: () => void;
}

const ROWS: readonly Omit<AirshipOrderRow, 'disabled' | 'disabledReason'>[] = [
  { id: 'pull-back', label: 'Pull back' },
  { id: 'close-in', label: 'Close in' },
];

export class AirshipOrderWidget {
  readonly el: HTMLElement;
  private index = 0;
  private rows: AirshipOrderRow[] = [];
  private commands: AvailableCommand[] = [];
  private volleysLeft = 0;
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
   * `commands` is the two Trigger rows the engine already offers
   * (`kind: 'trigger'`, `id: 'pull-back' | 'close-in'`) — this widget never
   * invents a command, only presents the two legal ones with the copy and
   * cost preview the raw menu row does not carry. `volleysLeft` drives the
   * three-pip readout (`state.flags['airship.missilesLeft']`).
   */
  open(
    commands: AvailableCommand[],
    range: 'near' | 'far',
    volleysLeft: number,
    opts: AirshipOrderOpenOptions = {},
  ): Promise<Command> {
    this.commands = commands.filter((c) => c.command.kind === 'trigger');
    this.volleysLeft = volleysLeft;
    this.onCancel = opts.onCancel ?? null;
    this.rows = ROWS.map((r) => {
      const target = r.id === 'pull-back' ? 'far' : 'near';
      const already = target === range;
      // The standing order, when there is one and the ship has not flown it
      // yet: giving it again would burn a turn for nothing (last order wins).
      const standing = !already && opts.pending === target;
      const offered = this.commands.some((c) => c.command.kind === 'trigger' && c.command.id === r.id && c.enabled);
      return {
        ...r,
        disabled: already || standing || !offered,
        disabledReason: already ? `Already ${range}` : standing ? 'Ordered' : undefined,
      };
    });
    this.index = this.rows.findIndex((r) => !r.disabled);
    if (this.index < 0) this.index = 0;
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
      let next = this.index;
      for (let i = 0; i < n; i++) {
        next = (next + (b === 'up' ? -1 : 1) + n) % n;
        if (!this.rows[next]?.disabled) break;
      }
      this.index = next;
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
    if (!row || row.disabled) return;
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
  static orderChipHtml(orderId: 'pull-back' | 'close-in'): string {
    const label = ROWS.find((r) => r.id === orderId)?.label ?? orderId;
    return `<span class="ffx-airship-order__chip" title="${escapeHtml(label)} — Cid's next turn">ORDER</span>`;
  }

  /**
   * Option A's two parts: the rows in the cascade (each tagged "Trigger", or
   * why it is greyed), and under them the ivory cost slab for the highlighted
   * order. An order forgoes Cid's next volley; it does not spend one from the
   * rack (`evrae-rules.ts#applyQueuedOrder`), so the pips count the rack.
   */
  private render(): void {
    const pips = Array.from(
      { length: 3 },
      (_, i) => `<i class="${i < this.volleysLeft ? 'ffx-airship-order__pip--live' : 'ffx-airship-order__pip--spent'}"></i>`,
    ).join('');
    const rows = this.rows
      .map((r, i) => {
        const selected = i === this.index;
        const cls = ['ig-cmd', 'ffx-cmd--trigger', selected ? 'ig-cmd--selected' : '', r.disabled ? 'ig-cmd--disabled' : '']
          .filter(Boolean)
          .join(' ');
        const tag = r.disabled
          ? `<span class="ffx-airship-order__already">${escapeHtml(r.disabledReason ?? '')}</span>`
          : `<span class="ffx-airship-order__tag">Trigger</span>`;
        return `<div class="${cls}" style="margin-left:calc(var(--ig-cascade-step) * ${i})" data-ui-action="${i}"><span class="ffx-cmd--trigger__label">${escapeHtml(r.label)}</span>${tag}</div>`;
      })
      .join('');
    const live = this.rows[this.index];
    const slab =
      live && !live.disabled
        ? `<div class="ffx-airship-order__slab"><span class="ffx-airship-order__slab-title">This order costs</span>` +
          `<span class="ffx-airship-order__cost">Turn now &middot; Cid's next turn &middot; 1 volley</span>` +
          `<span class="ffx-airship-order__left"><span class="ffx-airship-order__pips">${pips}</span>Volleys left ${this.volleysLeft}</span></div>`
        : '';
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
