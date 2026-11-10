// @vitest-environment jsdom
/**
 * The plates of a Special form as tap targets while a target is aimed (step D1 of the FFX-2 Special look; game case: FFX-2 only in what is seen: a row carries
 * `data-form-role` only in a form, and the three Special dresspheres exist only in FFX-2; the plumbing is optional and inert without a form).
 *
 * Template: `pr0264-touch-tap-aim.test.ts`. `PlateTaps` is one delegated click listener on the party list whose handler the command menu sets while a target cursor is live. It
 * writes NOTHING to the DOM (code-fit CF-01): no class, no attribute, no style, with or without a handler. The menu's handler acts like a click on the figure's own mark, for a plate
 * that is a candidate and for no other; a touch tap aims first and the second tap confirms, a mouse click confirms at once.
 *
 * Removal check: toggle a class on the list from `set` and the no-write case fails; drop the `targetIds.includes` check and the not-a-candidate case fails.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AtbSnapshot, AvailableCommand, BattleState, Command } from '../../src/battle/common/types.ts';
import { openCommandMenu } from '../../src/ui/ffx2/CommandMenu.ts';
import { PlateTaps } from '../../src/ui/ffx2/plateTap.ts';
import { formTargetOrder } from '../../src/ui/ffx2/specialRows.ts';
import { nextInput } from './helpers/specialDrive.ts';
import { formUp } from './helpers/specialFormState.ts';

const EMPTY: AtbSnapshot = { elapsedMs: 0, bars: [] };
const PLATES = ['yuna', 'floral-fallal-right-pistil', 'floral-fallal-left-pistil'] as const;

/** What a finger or a mouse sends before its click (the template's `press`). */
function press(pointerType: 'touch' | 'pen' | 'mouse'): void {
  const e = new Event('pointerdown');
  Object.defineProperty(e, 'pointerType', { value: pointerType });
  window.dispatchEvent(e);
}

/** A party list as the HUD draws a form: three plates, one ordinary row, and a plate whose id is no candidate of anything. */
function partyList(): HTMLElement {
  const list = document.createElement('div');
  list.className = 'ig-stat-list ffx2hud__party';
  const plate = (id: string, role: string): string => `<div class="ig-stat ig-stat--form" data-actor-id="${id}" data-form-role="${role}" data-form-special="floral-fallal"><span class="ig-stat__name">${id}</span></div>`;
  list.innerHTML = [plate('yuna', 'main'), plate('floral-fallal-right-pistil', 'right'), plate('floral-fallal-left-pistil', 'left'), plate('ghost', 'left'), '<div class="ig-stat" data-actor-id="rikku"><span class="ig-stat__name">rikku</span></div>'].join('');
  document.body.append(list);
  return list;
}
const nameOf = (list: HTMLElement, id: string): HTMLElement => list.querySelector<HTMLElement>(`[data-actor-id="${id}"] .ig-stat__name`)!;
const click = (el: Element): void => {
  el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
};

beforeEach(() => {
  document.body.innerHTML = '';
  vi.stubGlobal('requestAnimationFrame', () => 0);
  vi.stubGlobal('cancelAnimationFrame', () => {});
});
afterEach(() => vi.unstubAllGlobals());

describe('PlateTaps', () => {
  it('a click on a [data-form-role] plate calls the handler with its id; a click on an ordinary row, or with set(null), calls nothing', () => {
    const list = partyList();
    const taps = new PlateTaps();
    taps.bind(list);
    const handler = vi.fn();
    taps.set(handler);
    click(nameOf(list, 'floral-fallal-right-pistil'));
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith('floral-fallal-right-pistil');
    click(list.querySelector('[data-actor-id="yuna"]')!); // the plate itself, not a child
    expect(handler).toHaveBeenLastCalledWith('yuna');
    handler.mockClear();
    click(nameOf(list, 'rikku')); // an ordinary row has no data-form-role: never a target
    click(list); // the list itself
    expect(handler).not.toHaveBeenCalled();
    taps.set(null);
    click(nameOf(list, 'yuna'));
    expect(handler).not.toHaveBeenCalled();
    taps.dispose();
    taps.set(handler);
    click(nameOf(list, 'yuna'));
    expect(handler).not.toHaveBeenCalled(); // disposed: the listener is gone
  });

  it('bind, set and a click write no class, attribute or style: the list\'s outerHTML is the same before and after each, with and without a handler', () => {
    const list = partyList();
    const before = list.outerHTML;
    const taps = new PlateTaps();
    taps.bind(list);
    expect(list.outerHTML).toBe(before);
    taps.set(() => {});
    expect(list.outerHTML).toBe(before);
    click(nameOf(list, 'yuna'));
    click(nameOf(list, 'rikku'));
    expect(list.outerHTML).toBe(before);
    taps.set(null);
    click(nameOf(list, 'yuna'));
    expect(list.outerHTML).toBe(before);
    expect(list.className).toBe('ig-stat-list ffx2hud__party');
  });
});

/**
 * The real White Pollen row of a part (the heal of the form: `validTargets` are the three plates), made a ONE-target pick: the engine marks it `all-allies`, which the menu aims as a
 * group at once, and no row in the form's menus is both a one-target pick and lists the plates, so the plates' own order and taps would never be reached. Dropping the group `targeting`
 * is an input to the menu, never game data; the row, its label and its `validTargets` are the engine's.
 */
function realHeal(): { row: AvailableCommand; state: BattleState } {
  const up = formUp('yuna', { mastered: true });
  for (let i = 0; i < 300; i++) {
    const d = nextInput(up.engine);
    if (d === null) break;
    const found = d.commands.find((c) => c.enabled && c.command.kind === 'ability' && c.label === 'White Pollen' && PLATES.every((id) => c.validTargets.includes(id)));
    if (found) {
      const { targeting: _group, ...row } = found;
      return { row: row as AvailableCommand, state: up.engine.state() as BattleState };
    }
    up.engine.submit({ kind: 'defend', targets: [] });
  }
  throw new Error('no White Pollen row lists all three plates');
}

describe('the command menu with the plate taps (the real commands of a heal inside a form)', () => {
  const HEAL = realHeal();
  const X: Record<string, number> = { yuna: 900, 'floral-fallal-right-pistil': 500, 'floral-fallal-left-pistil': 100 }; // the plates' projected x run against their order

  function open(opts: { order?: boolean } = {}) {
    const list = partyList();
    const taps = new PlateTaps();
    const set = vi.spyOn(taps, 'set');
    taps.bind(list);
    const container = document.createElement('div');
    const layer = document.createElement('div');
    document.body.append(container, layer);
    const result: Promise<Command> = openCommandMenu({
      container, targetLayer: layer, commands: [HEAL.row], previewRank: () => EMPTY, onPreview: () => {}, actorName: 'Yuna',
      project: (id) => ({ x: X[id] ?? 700, y: 260 }),
      plateTaps: taps,
      ...(opts.order ? { targetOrder: (ids: readonly string[]) => formTargetOrder(HEAL.state, ids) } : {}),
    });
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter' }));
    return { list, taps, set, layer, result };
  }
  const active = (layer: HTMLElement): string | undefined => layer.querySelector<HTMLElement>('[data-target-id]:not(.ffx-target--dim)')?.dataset['targetId'];
  const settled = (p: Promise<unknown>): Promise<boolean> => Promise.race([p.then(() => true), new Promise<boolean>((r) => setTimeout(() => r(false), 30))]);

  it('a touch tap on a candidate plate aims it, a second tap on it confirms', async () => {
    const { list, layer, result } = open({ order: true });
    expect(active(layer)).toBe('yuna');
    press('touch');
    click(nameOf(list, 'floral-fallal-left-pistil'));
    expect(await settled(result)).toBe(false);
    expect(active(layer)).toBe('floral-fallal-left-pistil');
    press('touch');
    click(nameOf(list, 'floral-fallal-left-pistil'));
    expect(await settled(result)).toBe(true);
    expect((await result).targets).toEqual(['floral-fallal-left-pistil']);
  });

  it('a mouse click on a candidate plate confirms at once', async () => {
    const { list, result } = open({ order: true });
    press('mouse');
    click(nameOf(list, 'floral-fallal-right-pistil'));
    expect(await settled(result)).toBe(true);
    expect((await result).targets).toEqual(['floral-fallal-right-pistil']);
  });

  it('a plate that is not a candidate does nothing, on a click and on a tap', async () => {
    const { list, layer, result } = open({ order: true });
    const was = active(layer);
    press('mouse');
    click(nameOf(list, 'ghost'));
    press('touch');
    click(nameOf(list, 'ghost'));
    click(nameOf(list, 'rikku'));
    expect(await settled(result)).toBe(false);
    expect(active(layer)).toBe(was);
  });

  it('the menu sets the handler while it lives and clears it on cleanup, and the list is never written', async () => {
    const { list, set, result } = open({ order: true });
    const before = list.outerHTML;
    expect(set).toHaveBeenCalled();
    expect(set.mock.calls[0]![0]).toBeTypeOf('function');
    press('mouse');
    click(nameOf(list, 'yuna'));
    await result;
    expect(set.mock.calls.at(-1)![0]).toBeNull();
    expect(list.outerHTML).toBe(before);
  });

  it('with targetOrder given, the first showSingle order follows it (main, right, left); without it, the cursor\'s own rule starts at the left-most plate', () => {
    const withOrder = open({ order: true });
    expect(active(withOrder.layer)).toBe('yuna');
    document.body.innerHTML = '';
    const without = open();
    expect(active(without.layer)).toBe('floral-fallal-left-pistil');
  });

  it('and the keyboard walks the plates in the order main, right, left', () => {
    const { layer } = open({ order: true });
    const seen = [active(layer)];
    for (let i = 0; i < 3; i++) {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowRight' }));
      seen.push(active(layer));
    }
    expect(seen).toEqual(['yuna', 'floral-fallal-right-pistil', 'floral-fallal-left-pistil', 'yuna']);
  });
});
