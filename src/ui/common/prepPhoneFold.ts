/**
 * PR-0295 at phone width, option PREP-A: the behaviour half of the stacked prep page (the markup half is
 * `prepPhoneKit.ts`). Both games; the eight tab panels are shared.
 *
 * - **Folding.** A section header is a button for a finger. The open or folded state lives in the DOM (a section's
 *   `is-open` class), so a redraw for another party member reads it back instead of keeping a second copy.
 * - **Keys.** The prep screen's keys stay the shell's (Up and Down walk the party, Left and Right the tabs, Enter
 *   begins, Esc goes back). On the stacked page two more are free, as they are on the CHAPTER tab: L1 and R1 (PageUp,
 *   PageDown, F, R, pad LB and RB) page the page, and Triangle (Tab, Shift, Q, pad Y) opens every folded section or
 *   folds them all, so nothing the fold hides is out of reach of a keyboard or a pad. None of them is bound on the
 *   desktop board, and none of them is touched there: `phoneKeys` does nothing unless the page is the scroller.
 */

import type { InputSnapshot } from '../../app/Input.ts';

/** The pinned START BATTLE dock's height (`party-prep-phone.css`), which a page step keeps clear of. */
const DOCK_PX = 92;
const PAGE_AIR_PX = 24;

/** `.prep` when it is a phone-width stacked page (the media query makes it `overflow-y: auto`; the desktop board is hidden). */
export function phonePage(from: Element | null): HTMLElement | null {
  const page = from?.closest<HTMLElement>(".prep[data-phone='page']") ?? null;
  return page && getComputedStyle(page).overflowY === 'auto' ? page : null;
}

/** Set a section open or folded and say so to a screen reader. */
export function setSectionOpen(section: HTMLElement, open: boolean): void {
  section.classList.toggle('is-open', open);
  section.querySelector('[data-fold-head]')?.setAttribute('aria-expanded', open ? 'true' : 'false');
}

/** Every section under `host`, keyed. */
function sectionsOf(host: ParentNode): HTMLElement[] {
  return [...host.querySelectorAll<HTMLElement>('[data-fold]')];
}

/** The open state of every section now on the page, by key. Empty before the first draw. */
export function readOpen(host: ParentNode): Map<string, boolean> {
  return new Map(sectionsOf(host).map((s) => [s.dataset['fold'] ?? '', s.classList.contains('is-open')] as const));
}

/** Whether `key` is open: what the page says if it has the key, the section's default otherwise. */
export function isOpen(state: ReadonlyMap<string, boolean>, key: string, dflt: boolean): boolean {
  return state.get(key) ?? dflt;
}

/** Open every folded section, or, when none is folded, fold them all. Returns true when everything is now open. */
export function toggleAllSections(host: ParentNode): boolean {
  const all = sectionsOf(host);
  if (!all.length) return false;
  const openAll = all.some((s) => !s.classList.contains('is-open'));
  for (const s of all) setSectionOpen(s, openAll);
  return openAll;
}

/**
 * The phone page's host inside a panel's container: it sits beside the panel's desktop markup (which it never touches),
 * is hidden everywhere the stacked page is not on, and carries the fold listener.
 */
export function appendPhoneHost(root: HTMLElement): HTMLElement {
  const host = document.createElement('div');
  host.className = 'prph';
  root.appendChild(host);
  wireFold(host);
  return host;
}

/** One listener per host: a tap on a section header folds or unfolds its section. Safe to call twice. */
export function wireFold(host: HTMLElement): void {
  if (host.dataset['foldWired'] === '1') return;
  host.dataset['foldWired'] = '1';
  host.addEventListener('click', (e) => {
    const head = (e.target as Element | null)?.closest<HTMLElement>('[data-fold-head]');
    const section = head?.closest<HTMLElement>('[data-fold]');
    if (!head || !section || !host.contains(section)) return;
    setSectionOpen(section, !section.classList.contains('is-open'));
  });
}

/** Scroll the stacked page one screen's worth of its own content (what the pinned bar and dock leave visible). */
export function pagePhone(page: HTMLElement, dir: 1 | -1): boolean {
  const bar = (page.querySelector<HTMLElement>('.prep__tabs')?.offsetHeight ?? 0) + (page.querySelector<HTMLElement>('.prep__roster')?.offsetHeight ?? 0);
  const step = Math.max(120, page.clientHeight - bar - DOCK_PX - PAGE_AIR_PX);
  const max = page.scrollHeight - page.clientHeight;
  const next = Math.max(0, Math.min(max, page.scrollTop + dir * step));
  if (Math.abs(next - page.scrollTop) < 0.5) return false;
  page.scrollTop = next;
  // `scroll` fires on the next frame; the MORE BELOW cue should not wait for it.
  page.dispatchEvent(new Event('scroll'));
  return true;
}

/**
 * The stacked page's keys, for a panel's `handleInput`: L1 and R1 page, Triangle folds or opens every section.
 * Does nothing (and consumes nothing) unless the page is the phone-width scroller. Never claims the frame.
 */
export function phoneKeys(input: InputSnapshot, host: HTMLElement | null): boolean {
  const page = phonePage(host);
  if (!host || !page) return false;
  if (input.consume('r1')) pagePhone(page, 1);
  if (input.consume('l1')) pagePhone(page, -1);
  if (input.consume('triangle')) toggleAllSections(host);
  return false;
}
