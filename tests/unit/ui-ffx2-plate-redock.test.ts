// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AtbSnapshot, AvailableCommand } from '../../src/battle/common/types.ts';
import type { TargetRect } from '../../src/ui/ffx/TargetCursor.ts';
import { overlapArea, plateBox } from '../../src/ui/ffx/targetCursorParts.ts';
import { openCommandMenu } from '../../src/ui/ffx2/CommandMenu.ts';
import { slabPanels } from '../../src/ui/ffx2/intentBoard.ts';
import { keepPlateDocked } from '../../src/ui/ffx2/plateRedock.ts';

/**
 * FFX-2 only (Chapter 5, Vegnagun link 3, D-044 with the Body on option C's
 * spot): the field plate that names a Bulwark docks clear of the enemy-intent
 * slab, and re-docks when the slab settles after the target view opened.
 *
 * The verifier's frame (1600x900, clean HEAD 3bac7ea6): the slab settled under
 * the Body at x 745-1117, y 470-720, and the Left Bulwark plate, docked under its
 * ring against the snapshot taken when the view opened, covered "ACTS NEXT".
 * Geometry below is that frame.
 */
const RING_L = { x: 1069, y: 358, w: 80, h: 111 };
const SLAB = { x: 745, y: 471, w: 375, h: 249 };
const CHIP = { x: 1044, y: 450, w: 76, h: 19 };
const TOP_RIGHT_SLAB = { x: 1014, y: 75, w: 375, h: 249 };

let frames: Array<() => void> = [];
function tick(n = 1): void {
  for (let i = 0; i < n; i++) {
    const run = frames;
    frames = [];
    for (const f of run) f();
  }
}

let saved: { w: number; h: number };
beforeEach(() => {
  document.body.innerHTML = '';
  frames = [];
  vi.stubGlobal('requestAnimationFrame', (f: () => void) => {
    frames.push(f);
    return frames.length;
  });
  saved = { w: window.innerWidth, h: window.innerHeight };
  Object.defineProperty(window, 'innerWidth', { value: 1600, configurable: true });
  Object.defineProperty(window, 'innerHeight', { value: 900, configurable: true });
});
afterEach(() => {
  vi.unstubAllGlobals();
  Object.defineProperty(window, 'innerWidth', { value: saved.w, configurable: true });
  Object.defineProperty(window, 'innerHeight', { value: saved.h, configurable: true });
});

function rectOf(el: HTMLElement, r: TargetRect): void {
  el.getBoundingClientRect = () =>
    ({ left: r.x, top: r.y, right: r.x + r.w, bottom: r.y + r.h, width: r.w, height: r.h, x: r.x, y: r.y, toJSON: () => ({}) }) as DOMRect;
}

describe('slabPanels', () => {
  it('names the slab and its E HIDE chip, and skips what is not laid out', () => {
    const root = document.createElement('div');
    const panel = document.createElement('div');
    panel.className = 'eint__panel';
    const chip = document.createElement('button');
    chip.className = 'eint__toggle';
    const hidden = document.createElement('div');
    hidden.className = 'eint__panel';
    root.append(panel, chip, hidden);
    rectOf(panel, SLAB);
    rectOf(chip, CHIP);
    expect(slabPanels(root)).toEqual([SLAB, CHIP]);
  });
});

describe('keepPlateDocked', () => {
  function fake() {
    const el = document.createElement('div');
    document.body.append(el);
    return { el, setPanels: vi.fn<(panels: readonly TargetRect[]) => void>(), reposition: vi.fn<() => void>() };
  }

  it('re-docks when a panel moves, and not for a sub-step sway', () => {
    const cursor = fake();
    let slab = TOP_RIGHT_SLAB;
    keepPlateDocked(cursor, () => [slab], () => true);
    tick();
    expect(cursor.reposition).toHaveBeenCalledTimes(1);
    slab = { ...TOP_RIGHT_SLAB, y: TOP_RIGHT_SLAB.y + 3 };
    tick(3);
    expect(cursor.reposition).toHaveBeenCalledTimes(1);
    slab = SLAB;
    tick();
    expect(cursor.reposition).toHaveBeenCalledTimes(2);
    expect(cursor.setPanels).toHaveBeenLastCalledWith([SLAB]);
  });

  it('does nothing while not aiming, and stops once the cursor leaves the page', () => {
    const cursor = fake();
    let aiming = false;
    keepPlateDocked(cursor, () => [SLAB], () => aiming);
    tick(3);
    expect(cursor.reposition).not.toHaveBeenCalled();
    aiming = true;
    tick();
    expect(cursor.reposition).toHaveBeenCalledTimes(1);
    cursor.el.remove();
    tick();
    expect(frames).toHaveLength(0);
  });
});

describe('the FFX-2 command menu keeps the Bulwark plate off the intent slab (D-044 link 3)', () => {
  const commands: AvailableCommand[] = [
    {
      command: { kind: 'attack', targets: [] },
      label: 'Attack',
      category: 'attack',
      mpCost: 0,
      enabled: true,
      validTargets: ['bulwark-l'],
    },
  ];
  const EMPTY: AtbSnapshot = { elapsedMs: 0, bars: [] };

  it('re-docks above the ring once the slab settles under the Body', () => {
    let slab: TargetRect[] = [TOP_RIGHT_SLAB];
    const container = document.createElement('div');
    const targetLayer = document.createElement('div');
    document.body.append(container, targetLayer);
    void openCommandMenu({
      container,
      targetLayer,
      commands,
      previewRank: () => EMPTY,
      project: () => null,
      projectRect: () => RING_L,
      nameOf: () => 'Left Bulwark',
      panels: () => slab,
      onPreview: () => {},
      actorName: 'Rikku',
    });
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter', bubbles: true, cancelable: true }));
    const plate = (): HTMLElement => targetLayer.querySelector<HTMLElement>('.ffx-target__plate')!;
    expect(plate().className).toContain('ffx-target__plate--below');

    slab = [SLAB, CHIP];
    tick();
    expect(plate().className).toContain('ffx-target__plate--above');
    const box = plateBox('above', parseFloat(plate().style.left), parseFloat(plate().style.top), 148, 34); // dockFor's width for 'Left Bulwark'
    for (const p of slab) expect(overlapArea(box, p)).toBe(0);
  });
});
