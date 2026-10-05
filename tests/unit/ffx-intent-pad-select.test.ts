// @vitest-environment jsdom
/**
 * Release 39, FFX only: the pad's Triangle is Defend at the FFX command menu, so the enemy-move slab's pad toggle moved
 * to Select.
 *
 * The original's Triangle at the command menu is Defend (`research/ffx-defend-input-2026-10-04.md`, four GameFAQs
 * sources), and the build now names it on a tab under the command window (`src/ui/ffx/defendControl.ts`). The slab
 * (`src/ui/common/EnemyIntent.ts`) toggled on the same standard button 3 and its chip told a pad player "Triangle", so
 * a press meant for the slab spent a turn and flipped the read-out, and the chip named the button that ends the turn.
 * Our extra yields to the original's input. FFX-2 lists Defend as a row, its Triangle is free, and it keeps the old
 * button and the old word.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EnemyIntentPanel } from '../../src/ui/common/EnemyIntent.ts';
import { INTENT_HINT_ITEM } from '../../src/ui/common/ControlsHint.ts';
import { FFXBattleHud } from '../../src/ui/ffx/FFXBattleHud.ts';
import { FFX2BattleHud } from '../../src/ui/ffx2/FFX2BattleHud.ts';

const TRIANGLE = 3;
const SELECT = 8;

let pad: Array<{ pressed: boolean }> = [];
let plugged = true;
const live: Array<{ unmount(): void }> = [];

beforeEach(() => {
  pad = Array.from({ length: 17 }, () => ({ pressed: false }));
  plugged = true;
  Object.defineProperty(navigator, 'getGamepads', {
    configurable: true,
    writable: true,
    value: () => (plugged ? [{ connected: true, buttons: pad, axes: [0, 0] }] : []),
  });
});

afterEach(() => {
  while (live.length) live.pop()!.unmount();
  document.body.innerHTML = '';
});

/** Press and release a pad button across the panel's own per-frame poll: one press, edge-only. */
function tap(panel: EnemyIntentPanel, index: number): void {
  pad[index]!.pressed = true;
  panel.update(0.016);
  panel.update(0.016); // still held: nothing more
  pad[index]!.pressed = false;
  panel.update(0.016);
}

/** The key word the chip prints (its `<b>`): `E`, `Triangle`, `Select`. */
function chip(root: ParentNode): string {
  return (root.querySelector('[data-role="enemy-intent-toggle"] b')?.textContent ?? '').trim();
}

function hudRoot<T extends { mount(root: HTMLElement): void; unmount(): void }>(hud: T): HTMLElement {
  const root = document.createElement('div');
  document.body.appendChild(root);
  hud.mount(root);
  live.push(hud);
  return root;
}

function bare(): { panel: EnemyIntentPanel; overlay: HTMLElement } {
  const overlay = document.createElement('div');
  document.body.appendChild(overlay);
  let on = false;
  const panel = new EnemyIntentPanel({ game: 'ffx', readVisible: () => on, writeVisible: (v) => void (on = v) });
  panel.mount(overlay, { host: overlay, scale: () => 2.5, project: () => ({ x: 800, y: 400 }), avoid: () => [] });
  live.push(panel);
  return { panel, overlay };
}

describe('a panel mounted with no option keeps Triangle (what FFX-2 does)', () => {
  it('button 3 toggles it, button 8 does not, and the chip says Triangle', () => {
    const { panel, overlay } = bare();
    expect(chip(overlay)).toBe(INTENT_HINT_ITEM.gamepad);
    tap(panel, SELECT);
    expect(panel.isVisible).toBe(false);
    tap(panel, TRIANGLE);
    expect(panel.isVisible).toBe(true);
  });
});

describe('FFX: the slab is on Select, and Triangle is left to Defend', () => {
  function released(hud: FFXBattleHud): void {
    hud.setVisible(false); // the opening's take-down, then its hand-back: the slab is live (see ffx-intent-opening-hold)
    hud.setVisible(true);
  }

  it('the pad\'s Triangle does not touch the slab; Select toggles it, one press once', () => {
    const hud = new FFXBattleHud();
    hudRoot(hud);
    released(hud);
    const panel = hud.enemyIntent;
    const start = panel.isVisible;
    tap(panel, TRIANGLE);
    expect(panel.isVisible, 'Triangle must not flip the read-out').toBe(start);
    tap(panel, SELECT);
    expect(panel.isVisible).toBe(!start);
    tap(panel, SELECT);
    expect(panel.isVisible).toBe(start);
  });

  it('the chip names Select for a pad player, and still E for a keyboard player', () => {
    const hud = new FFXBattleHud();
    const root = hudRoot(hud);
    released(hud);
    hud.enemyIntent.setVisible(!hud.enemyIntent.isVisible); // any toggle re-prints the chip
    hud.enemyIntent.setVisible(!hud.enemyIntent.isVisible);
    expect(chip(root)).toBe('Select');

    plugged = false;
    hud.enemyIntent.setVisible(!hud.enemyIntent.isVisible);
    hud.enemyIntent.setVisible(!hud.enemyIntent.isVisible);
    expect(chip(root)).toBe('E');
  });

  it('the chip already says Select when the HUD mounts with a pad connected', () => {
    const hud = new FFXBattleHud();
    const root = hudRoot(hud);
    expect(chip(root)).toBe('Select');
  });
});

describe('FFX-2: unchanged (its menu lists Defend as a row; Triangle is free)', () => {
  it('Triangle toggles the slab, Select does not, and the chip says Triangle', () => {
    const hud = new FFX2BattleHud();
    const root = hudRoot(hud);
    const panel = hud.enemyIntent;
    const start = panel.isVisible;
    tap(panel, SELECT);
    expect(panel.isVisible).toBe(start);
    tap(panel, TRIANGLE);
    expect(panel.isVisible).toBe(!start);
    expect(chip(root)).toBe('Triangle');
  });
});

describe('a panel handed to another battle forgets the last HUD\'s button', () => {
  it('after unmount the default is Triangle again', () => {
    const overlay = document.createElement('div');
    document.body.appendChild(overlay);
    let on = false;
    const panel = new EnemyIntentPanel({ game: 'ffx', readVisible: () => on, writeVisible: (v) => void (on = v) });
    const opts = { host: overlay, scale: () => 2.5, project: () => ({ x: 0, y: 0 }), avoid: () => [] };
    panel.mount(overlay, { ...opts, padToggle: { index: SELECT, label: 'Select' } });
    panel.unmount();
    panel.mount(overlay, opts);
    live.push(panel);
    tap(panel, SELECT);
    expect(panel.isVisible).toBe(false);
    tap(panel, TRIANGLE);
    expect(panel.isVisible).toBe(true);
  });
});
