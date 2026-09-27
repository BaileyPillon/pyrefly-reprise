// @vitest-environment jsdom
/**
 * Two coach-line placement defects found by iteration 1's checks (batch B4):
 *
 * - `t1-b5` (both games): at 390x844 a coach line took a tap meant for an
 *   enemy reticle. While an enemy is being aimed at, the line must let taps
 *   through (`coach-taps.css`).
 * - `t1-b3a` (FFX only, Chapter II): Auron's line sat over the intent slab's
 *   IF YOU ATTACK list at 1600x900. The line must step off the slab
 *   (`coachIntentAvoid.ts`), and stay put when it already misses it.
 *
 * The browser checks at those sizes are in `docs/handoff/iter2-b4.md`.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

import { keepMarkOffIntent } from '../../src/ui/coach/coachIntentAvoid.ts';

const COACH = join(dirname(fileURLToPath(import.meta.url)), '../../src/ui/coach');
const CSS = ['coach.css', 'coach-taps.css'].map((f) => readFileSync(join(COACH, f), 'utf8')).join('\n');

afterEach(() => {
  document.body.innerHTML = '';
  document.head.innerHTML = '';
});

describe('a coach line never eats a reticle tap (t1-b5, both games)', () => {
  function build(hudClass: string): HTMLElement {
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);
    const root = document.createElement('div');
    root.innerHTML = `<div class="${hudClass}"></div><div class="coach-layer"><div class="coach-mark" data-game="ffx"></div></div>`;
    document.body.appendChild(root);
    return root.querySelector('.coach-mark') as HTMLElement;
  }

  for (const [game, hud] of [['FFX', 'ffxhud ig'], ['FFX-2', 'ig ig--ffx2 ffx2hud']] as const) {
    it(`${game}: the line takes taps on the menu, and lets them through while an enemy is aimed at`, () => {
      const mark = build(hud);
      expect(getComputedStyle(mark).pointerEvents).toBe('auto');
      const hudEl = mark.closest('.coach-layer')!.previousElementSibling as HTMLElement;
      hudEl.classList.add(hud.includes('ffx2hud') ? 'ffx2hud--targeting-enemy' : 'ffxhud--targeting-enemy');
      expect(getComputedStyle(mark).pointerEvents).toBe('none');
    });
  }
});

describe("Auron's line steps off the intent slab (t1-b3a, FFX only)", () => {
  type Box = { left: number; top: number; width: number; height: number };
  function boxed(el: HTMLElement, b: Box): void {
    el.getBoundingClientRect = () =>
      ({ ...b, x: b.left, y: b.top, right: b.left + b.width, bottom: b.top + b.height, toJSON: () => b }) as DOMRect;
  }

  function scene(slab: Box): { host: HTMLElement; mark: HTMLElement } {
    const host = document.createElement('div');
    host.innerHTML = `<div class="eint"><div class="eint__panel"></div></div><div class="coach-layer"><div class="coach-mark"></div></div>`;
    document.body.appendChild(host);
    boxed(host, { left: 0, top: 0, width: 1600, height: 900 });
    boxed(host.querySelector('.eint__panel') as HTMLElement, slab);
    const mark = host.querySelector('.coach-mark') as HTMLElement;
    // The FFX line's `left: 28%; top: 11%` at 1600x900, 400 x 145.
    mark.style.left = '448px';
    mark.style.top = '99px';
    boxed(mark, { left: 448, top: 99, width: 400, height: 145 });
    return { host, mark };
  }

  it('moves the line clear of the slab when they overlap', () => {
    const { host, mark } = scene({ left: 600, top: 90, width: 420, height: 260 });
    expect(keepMarkOffIntent(mark, host)).toBe(true);
    const top = parseFloat(mark.style.top);
    const left = parseFloat(mark.style.left);
    const slab = { left: 600, top: 90, right: 1020, bottom: 350 };
    const moved = { left, top, right: left + 400, bottom: top + 145 };
    const overlap = moved.left < slab.right && slab.left < moved.right && moved.top < slab.bottom && slab.top < moved.bottom;
    expect(overlap).toBe(false);
    expect(moved.top).toBeGreaterThanOrEqual(0);
    expect(moved.bottom).toBeLessThanOrEqual(900);
  });

  it('leaves the line where it is when it already misses the slab, or there is no slab', () => {
    const { host, mark } = scene({ left: 1100, top: 90, width: 420, height: 260 });
    expect(keepMarkOffIntent(mark, host)).toBe(false);
    expect(mark.style.top).toBe('99px');
    host.querySelector('.eint__panel')!.remove();
    expect(keepMarkOffIntent(mark, host)).toBe(false);
  });
});
