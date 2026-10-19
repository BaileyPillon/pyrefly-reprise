/**
 * The BEHIND THE SCENES page's behaviour: the section tabs, the five cards, the scroll, the backdrop that follows the
 * reader, the keys. The markup is `html.ts`; the overlay it sits in, the keyboard claim and Esc are `titleInfo.ts`'s.
 *
 * Keys (Bailey, 2026-10-08: "Up/Down/PageUp/PageDown scroll the panel; Esc, Enter or the same letter closes it"): Up, Down,
 * PageUp and PageDown scroll; Left and Right turn a card while the two-minute summary is in view and jump a chapter
 * elsewhere; Home and End go to the ends; T and Enter close it. A tap or a click on a tab, a dot or a button does what it says.
 *
 * Game case: both.
 */

import { CHAPTERS } from './content.ts';

export interface BehindTheScenesHooks {
  /** Close the page (the title's overlay does the rest). */
  close(): void;
  reduceMotion(): boolean;
}

export interface BehindTheScenesPage {
  /** A key the title's overlay did not take itself (it takes Esc, X and Backspace). */
  onKey(e: KeyboardEvent): void;
  dispose(): void;
}

const CLOSE_KEYS: ReadonlySet<string> = new Set(['KeyT', 'Enter', 'NumpadEnter', 'Space', 'KeyZ']);
const LINE = 120;

export function mountBehindTheScenes(overlay: HTMLElement, hooks: BehindTheScenesHooks): BehindTheScenesPage {
  const scroller = overlay.querySelector<HTMLElement>('[data-role="info-scroll"]');
  const sections = Array.from(overlay.querySelectorAll<HTMLElement>('[data-bts-sec]'));
  const tabs = Array.from(overlay.querySelectorAll<HTMLElement>('[data-bts-go]'));
  const backdrops = Array.from(overlay.querySelectorAll<HTMLElement>('[data-bts-bg-file]'));
  const cards = Array.from(overlay.querySelectorAll<HTMLElement>('[data-bts-card]'));
  const dots = Array.from(overlay.querySelectorAll<HTMLElement>('[data-bts-go-card]'));
  const next = overlay.querySelector<HTMLElement>('[data-bts-card-step="1"]');
  const prev = overlay.querySelector<HTMLElement>('[data-bts-card-step="-1"]');
  const progress = overlay.querySelector<HTMLElement>('[data-bts-progress]');
  const deck = overlay.querySelector<HTMLElement>('.bts__deck');
  let card = 0;

  const behaviour = (): ScrollBehavior => (hooks.reduceMotion() ? 'auto' : 'smooth');

  /** The section the reader is in: the last one whose top is above 30 percent of the way down the window. */
  const activeId = (): string => {
    if (!scroller) return 'summary';
    const y = scroller.scrollTop + scroller.clientHeight * 0.3;
    let id = sections[0]?.dataset['btsSec'] ?? 'summary';
    for (const s of sections) if (s.offsetTop <= y) id = s.dataset['btsSec'] ?? id;
    return id;
  };

  const update = (): void => {
    if (!scroller) return;
    const id = activeId();
    for (const t of tabs) t.setAttribute('aria-current', t.dataset['btsGo'] === id ? 'true' : 'false');
    const section = sections.find((s) => s.dataset['btsSec'] === id);
    const file = id === 'summary' ? cards[card]?.dataset['btsBg'] : section?.dataset['btsBg'];
    for (const b of backdrops) b.classList.toggle('is-on', b.dataset['btsBgFile'] === file);
    const max = scroller.scrollHeight - scroller.clientHeight;
    if (progress) progress.style.width = `${max > 0 ? (scroller.scrollTop / max) * 100 : 0}%`;
  };

  const go = (id: string): void => {
    const section = sections.find((s) => s.dataset['btsSec'] === id);
    if (section && scroller) scroller.scrollTo({ top: Math.max(0, section.offsetTop - 4), behavior: behaviour() });
  };

  const showCard = (i: number): void => {
    card = Math.max(0, Math.min(cards.length - 1, i));
    cards.forEach((c, k) => {
      c.hidden = k !== card;
    });
    dots.forEach((d, k) => d.setAttribute('aria-current', k === card ? 'true' : 'false'));
    if (prev) prev.toggleAttribute('disabled', card === 0);
    if (next) next.textContent = card === cards.length - 1 ? 'The story' : 'Next';
    update();
  };

  const stepCard = (d: number): void => {
    // Past the last card the next step is the story itself.
    if (d > 0 && card === cards.length - 1) go(CHAPTERS[0]?.id ?? 'c1');
    else showCard(card + d);
  };

  const onClick = (e: Event): void => {
    const el = e.target instanceof Element ? e.target.closest<HTMLElement>('[data-bts-go], [data-bts-go-card], [data-bts-card-step]') : null;
    if (!el) return;
    if (el.dataset['btsGo']) go(el.dataset['btsGo']);
    else if (el.dataset['btsGoCard'] !== undefined) showCard(Number(el.dataset['btsGoCard']));
    else if (el.dataset['btsCardStep']) stepCard(Number(el.dataset['btsCardStep']));
  };

  // A swipe across the deck turns a card, as on a phone.
  let x0: number | null = null;
  let y0 = 0;
  const onTouchStart = (e: TouchEvent): void => {
    const t = e.touches[0];
    if (t) {
      x0 = t.clientX;
      y0 = t.clientY;
    }
  };
  const onTouchEnd = (e: TouchEvent): void => {
    const t = e.changedTouches[0];
    if (x0 === null || !t) return;
    const dx = t.clientX - x0;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(t.clientY - y0)) stepCard(dx < 0 ? 1 : -1);
    x0 = null;
  };

  overlay.addEventListener('click', onClick);
  scroller?.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  deck?.addEventListener('touchstart', onTouchStart, { passive: true });
  deck?.addEventListener('touchend', onTouchEnd, { passive: true });
  deck?.setAttribute('aria-live', 'polite');
  showCard(0);

  return {
    onKey(e: KeyboardEvent): void {
      const c = e.code;
      if (CLOSE_KEYS.has(c)) {
        e.preventDefault();
        if (!e.repeat) hooks.close();
        return;
      }
      if (!scroller) return;
      const page = Math.max(80, scroller.clientHeight - 60);
      if (c === 'ArrowUp' || c === 'KeyW') scroller.scrollBy({ top: -LINE });
      else if (c === 'ArrowDown' || c === 'KeyS') scroller.scrollBy({ top: LINE });
      else if (c === 'PageUp' || c === 'KeyF') scroller.scrollBy({ top: -page });
      else if (c === 'PageDown' || c === 'KeyR') scroller.scrollBy({ top: page });
      else if (c === 'Home') scroller.scrollTo({ top: 0, behavior: behaviour() });
      else if (c === 'End') scroller.scrollTo({ top: scroller.scrollHeight, behavior: behaviour() });
      else if (c === 'ArrowLeft' || c === 'KeyA' || c === 'ArrowRight' || c === 'KeyD') {
        const d = c === 'ArrowLeft' || c === 'KeyA' ? -1 : 1;
        const id = activeId();
        if (id === 'summary') stepCard(d);
        else {
          const at = CHAPTERS.findIndex((ch) => ch.id === id);
          const to = at + d;
          if (to < 0) go('summary');
          else if (to < CHAPTERS.length) go(CHAPTERS[to]?.id ?? id);
        }
      }
    },
    dispose(): void {
      overlay.removeEventListener('click', onClick);
      scroller?.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      deck?.removeEventListener('touchstart', onTouchStart);
      deck?.removeEventListener('touchend', onTouchEnd);
    },
  };
}
