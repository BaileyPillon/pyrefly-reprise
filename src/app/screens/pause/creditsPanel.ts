/**
 * The credits panel the OPTIONS tab's CREDITS row opens (D-305: Bailey,
 * 2026-09-30, option O1; approved frames `docs/concepts/credits-2026-09-30/
 * o1-panel*.jpg`).
 *
 * It takes the place of the two columns and the objective line, on the same
 * side of the painting the chrome already stands on, and leaves the tab strip,
 * the brand line and the painting exactly where they were. Its own two prompts
 * replace `Esc RESUME` / `H painting only`: `Esc BACK` (a button: pointer and
 * touch) and `UP / DOWN SCROLL`. The list scrolls natively under a wheel or a
 * finger, and by a step on Up / Down (keys, D-pad, stick), smooth unless
 * REDUCE MOTION is on.
 *
 * Nothing here is a setting and nothing touches the save: the row is a button.
 *
 * Game case: both. The panel is shared chrome; the group headings take the
 * pause's own accent (`--pu-accent` = `--ig-accent`), gold under FFX and pyre
 * pink under FFX-2 (`.ig--ffx2`), the same way the pause's other accents do.
 */

import { escapeHtml } from '../../../ui/common/html.ts';
import { CREDIT_GROUPS, FAN_NOTICE, LICENCE_LINKS, type CreditEntry } from '../../credits/creditsData.ts';
import '../../../ui/common/pause-credits.css';

/** The root class that swaps the columns, objective and prompts for the panel. */
export const CREDITS_OPEN_CLASS = 'pause--credits';
/** The `data-action` the panel's `Esc BACK` prompt fires. */
export const CREDITS_CLOSE_ACTION = 'pause:credits:close';

function entryHtml(e: CreditEntry): string {
  const cls = e.required ? 'pause__credit pause__credit--req' : 'pause__credit';
  const note = e.note ? `<span class="pause__credit-note">${escapeHtml(e.note)}</span>` : '';
  return (
    `<div class="${cls}">` +
    `<span class="pause__credit-t">${escapeHtml(e.title)}</span>` +
    `<span class="pause__credit-by">${escapeHtml(e.by)} <b>${escapeHtml(e.licence)}</b></span>` +
    `${note}</div>`
  );
}

/** The whole panel, prompts included. Pure: `data -> string`. */
export function creditsHtml(): string {
  const groups = CREDIT_GROUPS.map(
    (g) =>
      `<h4 class="pause__credits-group" data-group="${escapeHtml(g.id)}">${escapeHtml(g.heading)}</h4>` +
      g.entries.map(entryHtml).join(''),
  ).join('');
  return (
    `<section class="pause__credits" role="dialog" aria-label="Credits">` +
    `<h3 class="pause__credits-h">Credits</h3>` +
    `<div class="pause__credits-scroll" data-role="credits-scroll" tabindex="-1">` +
    `${groups}<p class="pause__credit-note pause__credits-licences">${escapeHtml(LICENCE_LINKS)}</p>` +
    `<p class="pause__credits-notice">${escapeHtml(FAN_NOTICE)}</p></div></section>` +
    `<div class="pause__back pause__credits-back" data-action="${CREDITS_CLOSE_ACTION}" role="button" tabindex="0">` +
    `<span class="pause__key">Esc</span>Back</div>` +
    `<div class="pause__hide pause__credits-hint" aria-hidden="true">Up / Down&nbsp;&nbsp;scroll</div>`
  );
}

export class CreditsPanel {
  private readonly root: HTMLElement;
  private readonly layer: HTMLElement;
  private readonly scroller: HTMLElement | null;
  private readonly reduceMotion: () => boolean;

  /** @param root the pause view's root: the element the `pause--*` classes live on. */
  constructor(root: HTMLElement, reduceMotion: () => boolean) {
    this.root = root;
    this.reduceMotion = reduceMotion;
    const host = root.querySelector<HTMLElement>('[data-role="ui"]') ?? root;
    this.layer = document.createElement('div');
    this.layer.className = 'pause__credits-layer';
    this.layer.dataset['role'] = 'credits';
    this.layer.innerHTML = creditsHtml();
    host.appendChild(this.layer);
    this.scroller = this.layer.querySelector<HTMLElement>('[data-role="credits-scroll"]');
    this.scroller?.addEventListener('scroll', this.onScroll, { passive: true });
    root.classList.add(CREDITS_OPEN_CLASS);
    this.onScroll();
    // Screen readers and a Tab key land in the list, not behind it.
    this.scroller?.focus({ preventScroll: true });
  }

  /** One step of Up / Down: most of a screenful, so nothing is skipped. */
  scroll(dir: 1 | -1): void {
    const s = this.scroller;
    if (!s) return;
    const step = Math.max(48, Math.round(s.clientHeight * 0.6));
    const behavior: ScrollBehavior = this.reduceMotion() ? 'auto' : 'smooth';
    if (typeof s.scrollBy === 'function') s.scrollBy({ top: dir * step, behavior });
    else s.scrollTop += dir * step;
    this.onScroll();
  }

  /** The fades say which way there is more to read. */
  private readonly onScroll = (): void => {
    const s = this.scroller;
    if (!s) return;
    const max = s.scrollHeight - s.clientHeight;
    this.layer.classList.toggle('pause__credits-layer--above', s.scrollTop > 1);
    this.layer.classList.toggle('pause__credits-layer--below', max - s.scrollTop > 1);
  };

  snapshot(): Record<string, unknown> {
    const s = this.scroller;
    return {
      open: true,
      scrollTop: s ? Math.round(s.scrollTop) : 0,
      scrollMax: s ? Math.max(0, s.scrollHeight - s.clientHeight) : 0,
      groups: CREDIT_GROUPS.map((g) => g.id),
    };
  }

  dispose(): void {
    this.scroller?.removeEventListener('scroll', this.onScroll);
    this.layer.remove();
    this.root.classList.remove(CREDITS_OPEN_CLASS);
  }
}
