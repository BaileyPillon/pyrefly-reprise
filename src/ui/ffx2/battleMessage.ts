import './battle-message.css';
import type { BattleEvent, BattleState, CombatantId } from '../../battle/common/types.ts';

/**
 * PR-0143 (round 11, FFX-2 only): the FFX-2 HUD's battle-message banner.
 *
 * The FFX-2 engine emits `message` events — "Rikku stole Budget Grenade!",
 * "Nothing was stolen!", "Rikku pilfered 1,500 gil!", "Ormi has no gil to
 * take", "Paine is Berserk — no command is available; the turn passes.",
 * "Not linked" (`src/battle/ffx2/steal.ts`, `engineHooks.ts`,
 * `spherechange.ts`) — and nothing drew them: the presenter's message bar is
 * `null` whenever a HUD is mounted (`BattleScreen.ts`, no factory is
 * registered) and `FFX2BattleHud.onEvent` had no `message` case. The player
 * learned what Rikku stole only by opening Items.
 *
 * **How it looks.** The approved FFX-2 battle tile
 * (`docs/screenshots/mockups/A-ffx2-battle.jpg`) has exactly one slot for a
 * line of battle text: the paper `.ig-banner`, right-anchored under
 * `.ig--ffx2` with the pink accent, which this HUD already uses for the charge
 * telegraph. The message is that banner. It sits at the banner's own top
 * (17.78 on the grid), just under the PR-0012 help band's row (0..17.33), and
 * top-right — the party column is bottom-right, so it never covers the rows
 * or the band. When a telegraph is up at the same time the message stacks
 * under it (`battle-message.css`) instead of replacing it.
 * `research/ffx-vs-ffx2-presentation.md` does not document where FFX-2 prints
 * battle messages, so the placement follows the approved tile, not canon.
 *
 * **Reading order.** As FFX's banner does (`FFXBattleHud.setMessage`): the
 * acting girl's name in serif italic (tracked from `action-start`, never
 * parsed out of the text), then the rest of the line in the chip, with an
 * exact `"<name> "` prefix trimmed so "Rikku stole Budget Grenade!" reads
 * "Rikku · STOLE BUDGET GRENADE!" and not "Rikku · RIKKU STOLE…".
 *
 * It never blocks playback: the presenter already holds `TIMING.message`
 * after every message event, and FFX-2's clock must not wait on the HUD.
 */

/** How long a message stays up after the last one, in ms. */
export const MESSAGE_HOLD_MS = 2200;

export interface MessageParts {
  /** The acting character's name, or `''` when no action has started yet. */
  name: string;
  /** The line itself, without a restated `"<name> "` prefix. */
  chip: string;
}

/** Split one message into the banner's name and chip. Pure. */
export function messageParts(text: string, actorName: string): MessageParts {
  const name = actorName.trim();
  const chip = name && text.startsWith(`${name} `) ? text.slice(name.length + 1) : text;
  return { name, chip };
}

/** The banner element and its hold timer. The HUD owns the stage it lives on. */
export class BattleMessageBanner {
  private el: HTMLElement | null = null;
  private actorId: CombatantId | null = null;
  private hideTimer = 0;

  /** Mount right after the telegraph, so the stacking rule in the CSS can see it. */
  mount(telegraph: HTMLElement): void {
    const el = document.createElement('div');
    el.className = 'ig-banner ffx2hud__message';
    el.dataset['role'] = 'battle-message';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.hidden = true;
    el.innerHTML = '<span class="ig-banner__name" data-role="name"></span><span class="ig-banner__chip" data-role="chip"></span>';
    telegraph.after(el);
    this.el = el;
  }

  /** The banner element, for the target plates' obstacle list; `null` before mount. */
  get element(): HTMLElement | null {
    return this.el;
  }

  /** `action-start` tracks the speaker; `message` shows the line. Everything else is ignored. */
  onEvent(event: BattleEvent, state: BattleState | null): void {
    if (event.type === 'action-start') {
      this.actorId = event.actorId;
      return;
    }
    if (event.type !== 'message') return;
    const name = this.actorId ? (state?.combatants[this.actorId]?.name ?? '') : '';
    this.show(messageParts(event.text, name));
  }

  show(parts: MessageParts): void {
    const el = this.el;
    if (!el) return;
    const nameEl = el.querySelector<HTMLElement>('[data-role="name"]')!;
    const chipEl = el.querySelector<HTMLElement>('[data-role="chip"]')!;
    nameEl.textContent = parts.name;
    nameEl.hidden = !parts.name;
    chipEl.textContent = parts.chip;
    chipEl.hidden = parts.chip.length === 0;
    el.hidden = false;
    window.clearTimeout(this.hideTimer);
    this.hideTimer = window.setTimeout(() => this.hide(), MESSAGE_HOLD_MS);
  }

  hide(): void {
    window.clearTimeout(this.hideTimer);
    if (this.el) this.el.hidden = true;
  }

  dispose(): void {
    this.hide();
    this.el?.remove();
    this.el = null;
    this.actorId = null;
  }
}
