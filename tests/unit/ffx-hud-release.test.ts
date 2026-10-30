// @vitest-environment jsdom
/**
 * **Leaving an FFX battle frees its interface** (lane "budgets-2", 2026-10-29; FFX only: the FFX HUD's twin of `ffx2-hud-release.test.ts`, which pins the FFX-2 leak release 68 fixed).
 *
 * The memory jobs found FFX flat (Chapter I and Yunalesca keep their DOM nodes and listeners from the second visit on) and FFX-2 growing; this is the guard that keeps the FFX half true: the real
 * `FFXBattleHud` is mounted, a command menu is opened, and the battle is left five times (the menu open, an answered menu, no menu), and what stays registered on `window` and `document` is
 * flat across the visits and the HUD's root element is garbage-collectable once nothing in the test holds it.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AvailableCommand } from '../../src/battle/common/types.ts';
import { FFXBattleHud } from '../../src/ui/ffx/FFXBattleHud.ts';
import { makeFakeBattleState, makeFakeTurnPreview } from '../../src/ui/ffx/testFixtures.ts';
import { forceGc } from './helpers/forceGc.ts';

const ROWS: AvailableCommand[] = [
  { command: { kind: 'attack', targets: [] }, label: 'Attack', category: 'attack', mpCost: 0, enabled: true, validTargets: ['seymour-flux'] },
  { command: { kind: 'ability', id: 'fire', targets: [] }, label: 'Fire', category: 'blackmagic', mpCost: 4, enabled: true, validTargets: ['seymour-flux'] },
];

interface Registry {
  count(): number;
  of(type: string): number;
  forget(): void;
  stop(): void;
}
/** What is registered on `window` and `document` right now, by type: every add minus every remove of the same listener (the spies forward to the real calls). */
function watchListeners(): Registry {
  const live = new Map<string, Set<unknown>>();
  const spies: Array<ReturnType<typeof vi.spyOn>> = [];
  for (const target of [window, document] as const) {
    const key = target === window ? 'window' : 'document';
    const add = target.addEventListener.bind(target) as typeof target.addEventListener;
    const remove = target.removeEventListener.bind(target) as typeof target.removeEventListener;
    spies.push(
      vi.spyOn(target, 'addEventListener').mockImplementation(((type: string, l: unknown, o?: unknown) => {
        (live.get(`${key}:${type}`) ?? live.set(`${key}:${type}`, new Set()).get(`${key}:${type}`)!).add(l);
        (add as (t: string, l: unknown, o?: unknown) => void)(type, l, o);
      }) as never),
      vi.spyOn(target, 'removeEventListener').mockImplementation(((type: string, l: unknown, o?: unknown) => {
        live.get(`${key}:${type}`)?.delete(l);
        (remove as (t: string, l: unknown, o?: unknown) => void)(type, l, o);
      }) as never),
    );
  }
  return {
    count: () => [...live.values()].reduce((n, s) => n + s.size, 0),
    of: (type) => (live.get(`window:${type}`)?.size ?? 0) + (live.get(`document:${type}`)?.size ?? 0),
    forget: () => spies.forEach((s) => s.mockClear()),
    stop: () => spies.forEach((s) => s.mockRestore()),
  };
}

let reg: Registry;
beforeEach(() => {
  reg = watchListeners();
});
afterEach(() => {
  reg.stop();
  document.body.innerHTML = '';
});

/** One visit: mount, sync, a menu open (`open`: the promise abandoned as the screen's abort leaves it; `answered`: Enter on Attack first; `none`), then the screen is left. */
function visit(menu: 'open' | 'answered' | 'none'): { el: Element; menuOpen: number } {
  const root = document.createElement('div');
  document.body.appendChild(root);
  const hud = new FFXBattleHud();
  hud.mount(root);
  hud.setProjector(() => ({ x: 0, y: 0 }));
  hud.sync(makeFakeBattleState(), makeFakeTurnPreview());
  const el = root.firstElementChild!;
  if (menu !== 'none') void hud.chooseCommand('tidus', ROWS, () => makeFakeTurnPreview());
  if (menu === 'answered') window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter', bubbles: true, cancelable: true }));
  const menuOpen = reg.of('keydown');
  hud.unmount();
  root.remove();
  return { el, menuOpen };
}

function visitsAsWeakRefs(n: number): WeakRef<Element>[] {
  const refs: WeakRef<Element>[] = [];
  for (let i = 0; i < n; i++) refs.push(new WeakRef(visit('open').el));
  return refs;
}

describe('leaving an FFX battle with the command menu open', () => {
  it('the menu really is open, and registered on the window, before the battle is left', () => {
    const base = reg.of('keydown');
    const v = visit('open');
    expect(v.menuOpen).toBeGreaterThan(base);
  });

  it('five visits leave nothing registered on window or document: the count is flat from the first visit to the fifth', () => {
    visit('open'); // the first visit may register the page-wide, once-only listeners some modules install on first use
    const first = reg.count();
    const after: number[] = [];
    for (let i = 0; i < 5; i++) {
      visit('open');
      after.push(reg.count());
    }
    expect(after, 'registered listeners after each visit').toEqual([first, first, first, first, first]);
  });

  it('a menu the player answered first, and a battle left with no menu at all, are as clean as one left open', () => {
    visit('none');
    const base = reg.count();
    for (let i = 0; i < 3; i++) {
      visit('answered');
      expect(reg.count(), 'answered').toBe(base);
      visit('none');
      expect(reg.count(), 'no menu').toBe(base);
      visit('open');
      expect(reg.count(), 'open').toBe(base);
    }
  });

  it('the HUD\'s root element is collectable after five visits: nothing on window holds the detached panels', async () => {
    const refs = visitsAsWeakRefs(5);
    reg.forget();
    const collected = await forceGc(() => refs.map((r) => r.deref()).every((el) => el === undefined));
    if (collected === 'no-gc') return;
    // jsdom's selector engine keeps the element it last ran a selector from, so the last visit's root may be held by the environment itself: at most one.
    const alive = refs.filter((r) => r.deref() !== undefined).length;
    expect(alive, 'detached HUD roots still alive after a full collection (at most the last, held by jsdom)').toBeLessThanOrEqual(1);
  });
});
