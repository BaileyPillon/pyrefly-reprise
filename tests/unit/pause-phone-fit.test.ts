// @vitest-environment jsdom
/**
 * R13-05 (`critic/reviews/a999d133-focused.md`): on the FFX-2 phone pause the
 * GARMENT GRID row printed over the chapter caption. `phoneFit.ts` lifts the
 * phone body only as far as the objective demands, never above the tab strip,
 * and never outside the phone stylesheet.
 *
 * The boxes below are the ones measured at 390x844 on the dev build before the
 * fix (`measure-before-all.json` in the track's scratch): body top 438.9, FFX-2
 * member body bottom 713.6, FFX member body bottom 673.6, objective top about
 * 692, tab strip bottom about 88.
 *
 * Game case: both (shared pause plumbing).
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

import { fitPhoneBody, phoneLift, PHONE_AIR, PHONE_LIFT_VAR } from '../../src/app/screens/pause/phoneFit.ts';

const OBJ_TOP = 692;
const TABS_BOTTOM = 88;

describe('phoneLift: rise only as far as the objective demands', () => {
  it('FFX-2 member tab (five IN THIS FIGHT rows): lifts by the overrun plus the air', () => {
    const lift = phoneLift({ top: 438.9, bottom: 713.6 }, OBJ_TOP, TABS_BOTTOM);
    expect(lift).toBeCloseTo(713.6 - (OBJ_TOP - PHONE_AIR), 5);
  });

  it('FFX member tab (three rows) already clears: no lift', () => {
    expect(phoneLift({ top: 438.9, bottom: 673.6 }, OBJ_TOP, TABS_BOTTOM)).toBe(0);
  });

  it('never rises above the tab strip plus the air', () => {
    const lift = phoneLift({ top: 200, bottom: 900 }, OBJ_TOP, TABS_BOTTOM);
    expect(lift).toBe(200 - (TABS_BOTTOM + PHONE_AIR));
  });

  it('a body already at the ceiling does not move (and never moves down)', () => {
    expect(phoneLift({ top: 100, bottom: 900 }, OBJ_TOP, TABS_BOTTOM)).toBe(0);
  });
});

type Box = { top: number; bottom: number; height: number; left: number; right: number; width: number };
const box = (top: number, bottom: number): Box => ({ top, bottom, height: bottom - top, left: 20, right: 370, width: 350 });

function pause(bodyBox: (lifted: boolean) => Box, objBox = box(OBJ_TOP, 800)): { root: HTMLElement; body: HTMLElement } {
  const root = document.createElement('div');
  root.className = 'pause';
  root.innerHTML = `<nav data-role="tabs"></nav><div data-role="body"></div><div data-role="obj"></div>`;
  document.body.appendChild(root);
  const body = root.querySelector<HTMLElement>('[data-role="body"]')!;
  const at = (el: Element, get: () => Box): void => {
    (el as HTMLElement).getBoundingClientRect = () => get() as DOMRect;
  };
  at(root, () => box(0, 844));
  at(root.querySelector('[data-role="tabs"]')!, () => box(40, TABS_BOTTOM));
  at(body, () => bodyBox(body.style.getPropertyValue(PHONE_LIFT_VAR) !== ''));
  at(root.querySelector('[data-role="obj"]')!, () => objBox);
  return { root, body };
}

function phone(on: boolean): void {
  window.matchMedia = ((q: string) => ({ matches: on && q.includes('620px'), media: q })) as unknown as typeof window.matchMedia;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('fitPhoneBody', () => {
  it('under the phone stylesheet: sets the lift the objective demands', () => {
    phone(true);
    const { root, body } = pause(() => box(438.9, 713.6));
    const lift = fitPhoneBody(root);
    expect(lift).toBeCloseTo(37.6, 1);
    expect(body.style.getPropertyValue(PHONE_LIFT_VAR)).toBe('37.6px');
  });

  it('is idempotent: it measures without its own lift each time', () => {
    phone(true);
    // Measured with the lift on, the body would look clear; the fit must not believe that.
    const { root, body } = pause((lifted) => (lifted ? box(401.3, 676) : box(438.9, 713.6)));
    fitPhoneBody(root);
    fitPhoneBody(root);
    expect(body.style.getPropertyValue(PHONE_LIFT_VAR)).toBe('37.6px');
  });

  it('drops a lift that is no longer needed (another tab, a shorter member)', () => {
    phone(true);
    let tall = true;
    const { root, body } = pause(() => (tall ? box(438.9, 713.6) : box(438.9, 673.6)));
    fitPhoneBody(root);
    tall = false;
    expect(fitPhoneBody(root)).toBe(0);
    expect(body.style.getPropertyValue(PHONE_LIFT_VAR)).toBe('');
  });

  it('above 620 px it never lifts, whatever the boxes say', () => {
    phone(false);
    const { root, body } = pause(() => box(438.9, 713.6));
    expect(fitPhoneBody(root)).toBe(0);
    expect(body.style.getPropertyValue(PHONE_LIFT_VAR)).toBe('');
  });

  it('with the panels hidden (H: nothing laid out) it does nothing', () => {
    phone(true);
    const { root } = pause(() => box(0, 0), box(0, 0));
    expect(fitPhoneBody(root)).toBe(0);
  });
});

describe('pause-phone.css', () => {
  const file = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src', 'ui', 'common', 'pause-phone.css');
  const css = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  it('reads the lift inside the phone media query only', () => {
    const at = css.indexOf('@media (max-width: 620px)');
    expect(at).toBeGreaterThan(-1);
    expect(css.indexOf('--pu-phone-lift')).toBeGreaterThan(at);
    expect(css.slice(0, at)).not.toMatch(/\.pause__body\s*\{/);
  });
});
