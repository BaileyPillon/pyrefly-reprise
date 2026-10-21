// @vitest-environment jsdom
/**
 * Release 61, the conference demo (decision 169); FFX only (the Sensor plate is FFX's): the enemy plate folds and reopens with the left stick's press (L3, standard button 10) as well as `I`.
 * Its chip carries both halves (the key and the pad's button), shown by the player's last input.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SensorPanel } from '../../src/ui/ffx/SensorPanel.ts';
import { setRawInputSuspended } from '../../src/ui/ffx/rawInput.ts';
import { makeFakeCombatants } from '../../src/ui/ffx/testFixtures.ts';

const boss = makeFakeCombatants()['seymour-flux']!;
let pad: Array<{ pressed: boolean }> = [];

beforeEach(() => {
  pad = Array.from({ length: 17 }, () => ({ pressed: false }));
  Object.defineProperty(navigator, 'getGamepads', {
    configurable: true,
    writable: true,
    value: () => [{ connected: true, buttons: pad, axes: [0, 0] }],
  });
});

afterEach(() => {
  setRawInputSuspended(false);
  document.body.innerHTML = '';
});

function press(panel: SensorPanel, index: number): void {
  pad[index]!.pressed = true;
  panel.update(0.016);
  panel.update(0.016); // still held: nothing more
  pad[index]!.pressed = false;
  panel.update(0.016);
}

describe('the Sensor plate by pad', () => {
  it('L3 folds an open plate and reopens it, one press once', () => {
    const p = new SensorPanel();
    p.mount();
    document.body.appendChild(p.el);
    p.focus(boss);
    expect(p.isFolded).toBe(false);
    press(p, 10);
    expect(p.isFolded).toBe(true);
    press(p, 10);
    expect(p.isFolded).toBe(false);
    p.unmount();
  });

  it('no other button touches it (Back is the booth reset; R3 is the enemy-move slab)', () => {
    const p = new SensorPanel();
    p.mount();
    p.focus(boss);
    for (const index of [0, 1, 2, 3, 6, 7, 8, 9, 11]) press(p, index);
    expect(p.isFolded).toBe(false);
    p.unmount();
  });

  it('is deaf under the pause, like every HUD pad watcher', () => {
    const p = new SensorPanel();
    p.mount();
    p.focus(boss);
    setRawInputSuspended(true);
    press(p, 10);
    expect(p.isFolded).toBe(false);
    p.unmount();
  });

  it('does nothing while no plate is up', () => {
    const p = new SensorPanel();
    p.mount();
    press(p, 10);
    expect(p.el.hidden).toBe(true);
    p.unmount();
  });

  it('the chip carries the key (I) and the left stick press (L3) in one `<b>`', () => {
    const p = new SensorPanel();
    p.focus(boss);
    const chip = p.el.querySelector('[data-role="sensor-toggle"]')!;
    expect(chip.querySelector('.kh-k')?.textContent).toBe('I');
    expect(chip.querySelector('.kh-p .pg')?.getAttribute('data-pg')).toBe('l3');
  });
});
