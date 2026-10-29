// @vitest-environment jsdom
/**
 * **Leaving an FFX-2 battle frees its interface** (release 68, the leak the measuring lanes found in live release 67; FFX-2 only, FFX is flat).
 *
 * Under Active ATB a girl's command menu is open almost all the time. `openCommandMenu` (`src/ui/ffx2/CommandMenu.ts`) puts a `keydown` listener on `window` and hands its teardown to
 * `deps.onOpen`, which `FFX2BattleHud` keeps as `closeMenu`. `FFX2BattleHud.unmount` (what `BattleScreen.releaseParts` calls when a battle is left by the pause menu's Chapter select, Restart or
 * Quit, or by the end of the fight) never ran it, so the listener stayed on `window` for good, and its closure (`deps.onSelection`, `deps.panels`, ...) held the whole HUD, its panels, the strategy
 * guide, the F1 layer and every detached node under them: +480 DOM nodes and +16 to +18 listeners a visit, Chapter IV 1,213 to 3,148 nodes over five visits.
 *
 * These tests build the real HUD with a real menu open and tear it down five times, and assert that what stays registered on `window` and `document` is flat across the visits and that the
 * HUD's root element is garbage-collectable once nothing in the test holds it.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FFX2BattleHud } from '../../src/ui/ffx2/FFX2BattleHud.ts';
import type { AtbSnapshot, AvailableCommand, BattleState, FFX2Combatant } from '../../src/battle/common/types.ts';
import { forceGc } from './helpers/forceGc.ts';

function girl(id: string, name: string): FFX2Combatant {
  return {
    id, name, side: 'party', spriteKey: id,
    stats: { hp: 1000, mp: 100, str: 10, def: 10, mag: 10, mdef: 10, agi: 10, luck: 10, eva: 10, acc: 10, maxHp: 1000, maxMp: 100 },
    hp: 1000, mp: 80, statuses: {}, affinities: {}, immunities: {}, immunityFlags: [], controller: 'player', alive: true, removed: false, slot: 0, flags: {}, level: 46,
    dresspheres: { current: 'white-mage', owned: ['white-mage'], garmentGrid: { id: 'tempered-will', nodePosition: 0, passedGates: [], wornThisBattle: [] }, abilitiesLearned: {} },
    atb: { ticks: 0, required: 16000, gauge: 0, charging: null, recovery: 0 },
    accessories: [], chainCount: 0, chainWindowTicks: 0,
  };
}

const STATE = (): BattleState => ({
  game: 'ffx2', combatants: { yuna: girl('yuna', 'Yuna') }, activeIds: ['yuna'], reserveIds: [], enemyIds: [], aeonId: null, turn: 1, ticks: 0, log: [], nextSeq: 1,
  triggers: [], firedTriggerIds: [], result: null, seed: 3, flags: {},
});
const SNAPSHOT: AtbSnapshot = { elapsedMs: 0, bars: [{ actorId: 'yuna', fill: 1, required: 16000, ready: true, charge: null, state: 'normal' }] };
const ROW: AvailableCommand = { command: { kind: 'attack', targets: [] }, label: 'Attack', category: 'attack', mpCost: 0, enabled: true, validTargets: [] };

/** What is registered on `window` and `document` right now, by `type`: every add minus every remove of the same listener (the spies forward to the real calls). */
interface Registry {
  count(): number;
  of(type: string): number;
  /** Drop the spies' record of every call's arguments (a spy keeps the listeners it was handed, which would hold the HUD for the collection test). */
  forget(): void;
  stop(): void;
}
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

/**
 * One visit to Chapter IV's battle: mount, a girl's menu open (`open`: the promise abandoned, as the screen's abort leaves it; `answered`: the player confirmed Attack first; `none`: no menu),
 * then the screen is left. Returns the HUD's root element and how many `keydown` listeners were registered just before the battle was left.
 */
function visit(menu: 'open' | 'answered' | 'none'): { el: Element; menuOpen: number } {
  const root = document.createElement('div');
  document.body.appendChild(root);
  const hud = new FFX2BattleHud();
  hud.mount(root);
  hud.sync(STATE(), SNAPSHOT);
  const el = root.firstElementChild!;
  if (menu !== 'none') void hud.chooseCommand('yuna', [ROW], () => SNAPSHOT);
  if (menu === 'answered') window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter', bubbles: true, cancelable: true }));
  const menuOpen = reg.of('keydown');
  hud.unmount();
  root.remove();
  return { el, menuOpen };
}

/** `n` visits with the menu open, as weak references to the HUD roots (nothing here holds them once it returns). */
function visitsAsWeakRefs(n: number): WeakRef<Element>[] {
  const refs: WeakRef<Element>[] = [];
  for (let i = 0; i < n; i++) refs.push(new WeakRef(visit('open').el));
  return refs;
}

describe('leaving an FFX-2 battle with the command menu open (Active ATB)', () => {
  it('the menu really is open, and holds a keydown listener on window, before the battle is left', () => {
    const base = reg.of('keydown');
    const v = visit('open');
    expect(v.menuOpen).toBeGreaterThan(base);
  });

  it('five visits leave nothing registered on window or document: the listener count is flat from the first visit to the fifth', () => {
    const before = reg.count();
    const keydown = reg.of('keydown');
    const after: number[] = [];
    for (let i = 0; i < 5; i++) {
      visit('open');
      after.push(reg.count());
    }
    expect(after, 'registered listeners after each visit').toEqual([before, before, before, before, before]);
    expect(reg.of('keydown')).toBe(keydown);
  });

  it('a menu the player answered first, and a battle left with no menu at all, are as clean as one left open: the same flat count', () => {
    const before = reg.count();
    for (let i = 0; i < 3; i++) {
      visit('answered');
      expect(reg.count(), 'answered').toBe(before);
      visit('none');
      expect(reg.count(), 'no menu').toBe(before);
    }
  });

  it('the HUD\'s root element is collectable after five visits: no closure on window holds the detached panels any more', async () => {
    const refs = visitsAsWeakRefs(5); // in a plain function: a suspended async frame keeps its last temporaries alive
    reg.forget();
    const collected = await forceGc(() => refs.map((r) => r.deref()).every((el) => el === undefined));
    if (collected === 'no-gc') return; // the runner cannot force a collection: the listener counts above are the proof
    // jsdom's selector engine (nwsapi `selectResolvers`) keeps the element it last ran a selector from, so the LAST visit's root may be held by the test environment itself: at most one. Before the repair
    // all five were alive (the leak grew with the visits); with the menu closed on unmount none of the earlier four is.
    const alive = refs.filter((r) => r.deref() !== undefined).length;
    expect(alive, 'detached HUD roots still alive after a full collection (at most the last, held by jsdom)').toBeLessThanOrEqual(1);
  });
});
