// @vitest-environment jsdom
// iter2 B6: the phone layout moves the enemy-move line off a guarded feature (the
// Vegnagun leg's lens at Chapter V link 2) and puts it back when the feature has gone.
// Game case: the mechanism is both; the only guarded feature is FFX-2's.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { installPhoneBattle, type PhoneBattleText } from '../../src/ui/common/phoneBattle.ts';
import type { GuardBox, GuardedPhoneField } from '../../src/ui/common/phoneBattleGuard.ts';

const TEXT: PhoneBattleText = {
  actor: 'Yuna', help: '', command: '', target: '', targetHp: '', targetFace: '', targeting: false, ally: false, sensor: false,
};

function rectOf(el: Element, r: { x: number; y: number; w: number; h: number }): void {
  (el as HTMLElement).getBoundingClientRect = () =>
    ({ left: r.x, top: r.y, right: r.x + r.w, bottom: r.y + r.h, width: r.w, height: r.h, x: r.x, y: r.y, toJSON: () => ({}) }) as DOMRect;
}

beforeEach(() => {
  document.body.innerHTML = '';
  (window as unknown as { matchMedia: unknown }).matchMedia = (query: string) => ({
    media: query, matches: true, addEventListener: () => undefined, removeEventListener: () => undefined,
  });
  Object.defineProperty(window, 'innerWidth', { value: 390, configurable: true });
});
afterEach(() => {
  const s = document.documentElement.style;
  s.removeProperty('--phud-line-left');
  s.removeProperty('--phud-line-maxw');
});

describe('phone line guard wiring', () => {
  it('moves the line right of the lens, then back when the lens is gone', () => {
    const hud = document.createElement('div');
    hud.className = 'ffx2hud';
    hud.innerHTML = '<div class="ffx2hud__enemies"></div><div class="eint"><div class="eint__panel"></div></div>';
    document.body.appendChild(hud);
    rectOf(hud.querySelector('.ffx2hud__enemies')!, { x: 0, y: 0, w: 390, h: 143 });
    rectOf(hud.querySelector('.eint__panel')!, { x: 10, y: 145, w: 370, h: 50 });
    let guards: GuardBox[] = [{ x: 124, y: 180, w: 49, h: 37 }];
    const field = {
      setRects: () => undefined, setState: () => undefined, setActor: () => undefined, frame: () => undefined, reset: () => undefined,
      guards: () => guards,
    } satisfies GuardedPhoneField;
    const pb = installPhoneBattle(hud, 'ffx2', () => TEXT, { field });
    pb.refresh();
    const s = document.documentElement.style;
    expect(s.getPropertyValue('--phud-line-left')).toBe('173px');
    expect(s.getPropertyValue('--phud-line-maxw')).toBe('207px');
    expect(document.documentElement.dataset['phudLineMoved']).toBe('');
    guards = [];
    pb.refresh();
    expect(s.getPropertyValue('--phud-line-left')).toBe('');
    expect(s.getPropertyValue('--phud-line-maxw')).toBe('');
    expect(document.documentElement.dataset['phudLineMoved']).toBeUndefined();
    pb.destroy();
  });

  it('the stylesheet reads the slot for the line and the folded chip', () => {
    const css = readFileSync(join(process.cwd(), 'src/ui/common/phone-battle-parts.css'), 'utf8');
    expect(css.match(/left: var\(--phud-line-left, 10px\) !important;/g)?.length).toBe(2);
    expect(css).toContain('max-width: var(--phud-line-maxw, calc(100% - 20px)) !important;');
    expect(css).toMatch(/\[data-phud-line-moved\] \.eint__body \{\s*-webkit-line-clamp: 5;/);
  });
});
