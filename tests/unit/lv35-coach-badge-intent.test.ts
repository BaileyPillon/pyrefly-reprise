// @vitest-environment jsdom
/**
 * LV-35-01 (release 35 live check; game case: FFX-2 only, the badge is FFX-2's): at 390x844 in Chapter IV the
 * first-use line's pink "Gauges running · a command holds them" badge hangs 28 px above the slab
 * (`coach.css` `.coach-mark__running`, `top: -28px`). The step-off-the-intent-card solver measured the slab alone,
 * parked it 12 px under the card, and the badge printed over the card's last line by 10 to 16 px (5,632 px2 measured).
 * `markBox` is the slab plus its badge; FFX has no badge, so its box is the slab's.
 *
 * The browser proof (0 px2, 12 px clear, Chapters I and IV at 390x844) is in `docs/handoff/r37-ui-floor.md`.
 */

import { afterEach, describe, expect, it } from 'vitest';

import { keepMarkOffIntent, markBox } from '../../src/ui/coach/coachIntentAvoid.ts';

type Box = { left: number; top: number; width: number; height: number };
function boxed(el: HTMLElement, b: Box): void {
  el.getBoundingClientRect = () => ({ ...b, x: b.left, y: b.top, right: b.left + b.width, bottom: b.top + b.height, toJSON: () => b }) as DOMRect;
}

afterEach(() => {
  document.body.innerHTML = '';
});

/** The phone Chapter IV frame: card [10,60,370x70], line [25,142,340x160], badge [25,114,200x26] over it. */
function phone(withBadge: boolean): { host: HTMLElement; mark: HTMLElement; badge: HTMLElement | null } {
  const host = document.createElement('div');
  host.innerHTML = `<div class="eint"><div class="eint__panel"></div></div><div class="coach-layer"><div class="coach-mark">${withBadge ? '<div class="coach-mark__running">Gauges running</div>' : ''}</div></div>`;
  document.body.appendChild(host);
  boxed(host, { left: 0, top: 0, width: 390, height: 844 });
  boxed(host.querySelector('.eint__panel') as HTMLElement, { left: 10, top: 60, width: 370, height: 70 });
  const mark = host.querySelector('.coach-mark') as HTMLElement;
  mark.style.left = '25px';
  mark.style.top = '142px';
  boxed(mark, { left: 25, top: 142, width: 340, height: 160 });
  const badge = host.querySelector<HTMLElement>('.coach-mark__running');
  if (badge) boxed(badge, { left: 25, top: 114, width: 200, height: 26 });
  return { host, mark, badge };
}

describe('the phone coach line and its badge step off the intent card (LV-35-01, FFX-2 only)', () => {
  it('the box is the slab plus the badge above it; with no badge it is the slab', () => {
    const { mark } = phone(true);
    expect(markBox(mark)).toEqual({ left: 25, top: 114, right: 365, bottom: 302 });
    const none = phone(false);
    expect(markBox(none.mark)).toEqual({ left: 25, top: 142, right: 365, bottom: 302 });
  });

  it('moves the line until the badge, not only the slab, clears the card', () => {
    const { host, mark } = phone(true);
    // The slab alone is already clear (142 > 130): only the badge (114 to 140) is over the card (60 to 130).
    expect(keepMarkOffIntent(mark, host)).toBe(true);
    const slabTop = parseFloat(mark.style.top);
    const badgeBottom = slabTop - 2; // the badge hangs 28 px above and is 26 px tall
    expect(slabTop - 28).toBeGreaterThanOrEqual(130);
    expect(badgeBottom).toBeGreaterThan(130);
  });

  it('leaves a line whose badge already misses the card where it is', () => {
    const { host, mark, badge } = phone(true);
    boxed(mark, { left: 25, top: 170, width: 340, height: 160 });
    boxed(badge!, { left: 25, top: 142, width: 200, height: 26 });
    mark.style.top = '170px';
    expect(keepMarkOffIntent(mark, host)).toBe(false);
    expect(mark.style.top).toBe('170px');
  });
});
