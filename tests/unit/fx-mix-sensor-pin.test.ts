// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SensorPin } from '../../src/engine/fx/mix/sensorPin.ts';
import { SENSOR_HOME } from '../../src/engine/fx/mix/colossusPin.ts';

/**
 * Where FFX's Sensor card stands while Seymour Natus's pinned colossus master does (FFX only, Chapter X; PR-0331): two CSS custom properties the stylesheet
 * adds to the card's own `left` and `top` (`ffx-hud.css`), written when the table says and removed the moment it stops, so the HUD's own steer
 * (`--ffx-sensor-dx`, the target cursor) and the rail clear (`--ffx-sensor-cdx`) are never touched.
 */
let card: HTMLElement;

beforeEach(() => {
  document.body.innerHTML = '<div class="ffxhud__stage"><div class="ffx-sensor"></div></div>';
  card = document.querySelector<HTMLElement>('.ffx-sensor')!;
});
afterEach(() => {
  document.body.innerHTML = '';
});

describe('SensorPin', () => {
  it('writes the move from the stylesheet\'s own place, in grid px', () => {
    const pin = new SensorPin();
    pin.update([410, 4]);
    expect(card.style.getPropertyValue('--ffx-sensor-px')).toBe(`${410 - SENSOR_HOME[0]}.0px`);
    expect(card.style.getPropertyValue('--ffx-sensor-py')).toBe(`${4 - SENSOR_HOME[1]}.0px`);
  });

  it('removes both the moment there is no pin, and does nothing to the other two properties', () => {
    const pin = new SensorPin();
    card.style.setProperty('--ffx-sensor-dx', '12px');
    card.style.setProperty('--ffx-sensor-cdx', '-3px');
    pin.update([410, 4]);
    pin.update(null);
    expect(card.style.getPropertyValue('--ffx-sensor-px')).toBe('');
    expect(card.style.getPropertyValue('--ffx-sensor-py')).toBe('');
    expect(card.style.getPropertyValue('--ffx-sensor-dx')).toBe('12px');
    expect(card.style.getPropertyValue('--ffx-sensor-cdx')).toBe('-3px');
  });

  it('writes once for one place (nothing every frame) and again for another', () => {
    const pin = new SensorPin();
    let writes = 0;
    const set = card.style.setProperty.bind(card.style);
    card.style.setProperty = (name: string, value: string | null, priority?: string): void => {
      writes++;
      set(name, value, priority);
    };
    pin.update([410, 4]);
    const first = writes;
    for (let i = 0; i < 30; i++) pin.update([410, 4]);
    expect(writes).toBe(first);
    pin.update([300, 4]);
    expect(writes).toBeGreaterThan(first);
    expect(card.style.getPropertyValue('--ffx-sensor-px')).toBe(`${300 - SENSOR_HOME[0]}.0px`);
  });

  it('writes it again if the HUD replaced the card (a new fight in the same page)', () => {
    const pin = new SensorPin();
    pin.update([410, 4]);
    document.body.innerHTML = '<div class="ffxhud__stage"><div class="ffx-sensor"></div></div>';
    const fresh = document.querySelector<HTMLElement>('.ffx-sensor')!;
    pin.update([410, 4]);
    expect(fresh.style.getPropertyValue('--ffx-sensor-px')).toBe(`${410 - SENSOR_HOME[0]}.0px`);
  });

  it('is harmless with no card in the page (the phone, FFX-2) and clears on dispose', () => {
    document.body.innerHTML = '';
    const none = new SensorPin();
    expect(() => none.update([410, 4])).not.toThrow();
    expect(() => none.dispose()).not.toThrow();
    document.body.innerHTML = '<div class="ffx-sensor"></div>';
    const el = document.querySelector<HTMLElement>('.ffx-sensor')!;
    const pin = new SensorPin();
    pin.update([410, 4]);
    expect(el.style.getPropertyValue('--ffx-sensor-px')).not.toBe('');
    pin.dispose();
    expect(el.style.getPropertyValue('--ffx-sensor-px')).toBe('');
    expect(el.style.getPropertyValue('--ffx-sensor-py')).toBe('');
  });
});
