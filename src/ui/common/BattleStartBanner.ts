/**
 * The battle-start boss card — the approved Ink & Gold opening beat.
 *
 * Target: `docs/screenshots/mockups/A-battle-start.jpg`, spec
 * `docs/handoff/presentation-ink-and-gold.md` > Screens > "Battle start".
 * Critic round 02 #10 found it approved and never built: every fight cut
 * straight from the cutscene into the plain establishing shot, so the player
 * was never told, in the game's own voice, who they had just been put in front
 * of.
 *
 * One component for both games. The card is the same object in FFX and FFX-2 —
 * the difference is the accent token (`.ig--ffx2` repaints gold as pyre pink,
 * `src/ui/inkgold/tokens.css`) and the chapter eyebrow, which is what the
 * mockup itself varies. Nothing about the card's content is FFX-only, so
 * nothing here is gated on `game`.
 *
 * Rules it keeps:
 * - shown **once** per encounter, at the start, never between chained links;
 * - **never blocks input longer than the mockup implies** — it dismisses on
 *   any confirm/cancel/start press or a click, and auto-dismisses on its own
 *   hold (`HOLD_MS`), so the longest a player can be held is that hold;
 * - **reduced-motion safe** — the card still appears (it is information), the
 *   sweep does not (`battle-start-banner.css`'s media query);
 * - **instant under `speed: 'skip'`** — an automated run gets no card at all,
 *   which is what keeps the e2e budget honest.
 */

import './battle-start-banner.css';
import { escapeHtml } from './html.ts';
import { portraitImgHtml } from './portrait.ts';
import { romanNumeral } from './roman.ts';
import { artUrl } from '../../engine/PaintedArt.ts';

export interface BattleStartBannerMember {
  id: string;
  name: string;
}

export interface BattleStartBannerOptions {
  root: HTMLElement;
  /** Chapter number, for `CHAPTER III · …`. Omit to drop the eyebrow. */
  chapterNumber?: number;
  /** Where the fight happens, as the chapter record words it. */
  location?: string;
  /** The headline enemy. */
  bossName: string;
  /** The italic line under the rule — usually the chapter's subtitle. */
  subline?: string;
  /**
   * Painted combatant key for the ink side, e.g. `'seymour-flux'` — resolved
   * to `art/characters/<key>/idle.png`, the same file the diorama stages.
   */
  artKey?: string;
  /** Scene key for the dimmed backdrop behind the cutout. */
  backdropKey?: string;
  /** The party as the card lists it, left to right. */
  party?: readonly BattleStartBannerMember[];
  /** `'ffx2'` repaints the accent. */
  game?: 'ffx' | 'ffx2';
  /** How long the card holds with no input. */
  holdMs?: number;
}

/** Spec pace: the card is a beat, not a screen. */
export const BATTLE_START_HOLD_MS = 1900;
/** The fade the card leaves on; matches `.bstart`'s transition. */
const LEAVE_MS = 260;

/**
 * A name splits onto the mockup's two lines at its last space, so
 * "Braska's Final Aeon" reads `Braska's Final / Aeon` and "Bahamut" stays on
 * one. Matches the mockup's `Seymour / Flux`.
 */
export function splitBossName(name: string): string[] {
  const trimmed = name.trim();
  const cut = trimmed.lastIndexOf(' ');
  if (cut <= 0) return [trimmed];
  return [trimmed.slice(0, cut), trimmed.slice(cut + 1)];
}

export class BattleStartBanner {
  readonly el: HTMLElement;
  private readonly holdMs: number;
  private done: (() => void) | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private leaving = false;

  constructor(private readonly opts: BattleStartBannerOptions) {
    this.holdMs = opts.holdMs ?? BATTLE_START_HOLD_MS;

    const el = document.createElement('div');
    el.className = opts.game === 'ffx2' ? 'bstart ig ig--ffx2' : 'bstart ig';
    el.dataset['role'] = 'battle-start';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');

    const eyebrow =
      opts.chapterNumber !== undefined
        ? `<div class="bstart__eyebrow">CHAPTER ${romanNumeral(opts.chapterNumber)}${
            opts.location ? ` &middot; ${escapeHtml(opts.location.toUpperCase())}` : ''
          }</div>`
        : '';
    const name = splitBossName(opts.bossName)
      .map((line) => `<span>${escapeHtml(line)}</span>`)
      .join('');
    const subline = opts.subline ? `<p class="bstart__subline">${escapeHtml(opts.subline)}</p>` : '';
    const party = (opts.party ?? [])
      .map(
        (m) =>
          `<span class="bstart__member"><span class="bstart__tile">${
            portraitImgHtml(m.id, m.name) || escapeHtml(m.name.charAt(0).toUpperCase())
          }</span><span class="bstart__who">${escapeHtml(m.name)}</span></span>`,
      )
      .join('');

    el.innerHTML = `
      <div class="bstart__wash"></div>
      <div class="bstart__art"></div>
      <div class="bstart__wedge"></div>
      <div class="bstart__stripe"></div>
      <div class="bstart__panel">
        ${eyebrow}
        <h2 class="bstart__name">${name}</h2>
        <div class="bstart__rule"></div>
        ${subline}
      </div>
      <div class="bstart__skip">Any key</div>
      <div class="bstart__strip">
        <span class="bstart__party">${party}</span>
        <span class="bstart__go">Battle Start</span>
      </div>
    `;

    if (opts.artKey) {
      const art = el.querySelector('.bstart__art') as HTMLElement | null;
      // The same painting the diorama stages (`BattlePresenterArt.artUrlFor`),
      // so the boss on the card is the boss on the field.
      if (art) art.style.backgroundImage = `url(${artUrl(`art/characters/${opts.artKey}/idle.png`)})`;
    }
    if (opts.backdropKey) {
      const wash = el.querySelector('.bstart__wash') as HTMLElement | null;
      if (wash) wash.style.backgroundImage = `url(${artUrl(`art/backdrops/${opts.backdropKey}.png`)})`;
    }

    // A click anywhere dismisses, so a mouse or touch player is never stuck
    // waiting out the hold.
    el.addEventListener('pointerdown', () => this.dismiss());
    this.el = el;
  }

  /**
   * Mount the card and resolve once it is gone.
   *
   * Always resolves: the hold timer fires even if nothing is listening for
   * input, which is what stops the card from becoming another way for a
   * chapter to stall (round 02 #01 is the same shape of fault).
   */
  show(): Promise<void> {
    this.opts.root.appendChild(this.el);
    return new Promise<void>((resolve) => {
      this.done = resolve;
      this.timer = setTimeout(() => this.dismiss(), this.holdMs);
    });
  }

  /** True while the card is up and would answer a keypress. */
  get visible(): boolean {
    return !this.leaving && this.el.isConnected;
  }

  /** Take it down now. Idempotent. */
  dismiss(): void {
    if (this.leaving) return;
    this.leaving = true;
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
    this.el.classList.add('bstart--leaving');
    const finish = (): void => {
      this.el.remove();
      const done = this.done;
      this.done = null;
      done?.();
    };
    // The fade is cosmetic; the promise must settle even if the element is
    // torn down first (a screen exit races it).
    setTimeout(finish, LEAVE_MS);
  }
}
