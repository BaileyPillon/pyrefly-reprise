// @vitest-environment jsdom
/**
 * FOC52-002 (the deep review of release 52; FFX only): in Chapter 28's target-select frame the Sensor card's one-line chip, `I POSSESSED VALEFOR`, was printed across the parked
 * `E ENEMY MOVE` chip at the top right. Aiming in a fight that has the Yu Pagodas (Chapter III and the hidden Chapter 28 built on it) folds the card to that chip and lifts it to
 * the floor of the top strip (`sensorAimFold.ts`), the strip the intent chip is parked in at the turn list's top-right corner; the card is kept off the turn list's NAMES
 * (`sensorCtbClear.ts`, PR-0233) but nothing kept it off that chip, so a card pushed right (the steer, a long name) landed on it.
 *
 * The numbers are the ones measured in a headless browser at 1600x900 with the door word `summon` (docs/screenshots/foc52-002/): the chip at x 1380 to 1545, y 97 to 123; the folded card at
 * x 1087 to 1316, y 100 to 126 (clear by 64 px), and with the steer's property forced to 110 px at x 1362 to 1591 (over the chip, 165 px of it); with the fix it comes to rest at x 1141 to 1370.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { ctbClearShift, keepSensorOffCtb } from '../../src/ui/ffx/sensorCtbClear.ts';

const SCALE = 2.5; // 1600x900 is 640x360 grid at 2.5
const GAP = 4 * SCALE;
const chipBox = { left: 1380, right: 1545, top: 97, bottom: 123 };

describe('ctbClearShift with the parked intent chip', () => {
  it('leaves the folded card where it rests: 64 px clear of the chip', () => {
    expect(ctbClearShift({ left: 1087, right: 1316, top: 100, bottom: 126 }, [chipBox], GAP)).toBe(0);
  });

  it('slides a card pushed right of its rest place left of the chip, with the gap (the measured case: 221 px)', () => {
    const shift = ctbClearShift({ left: 1362, right: 1591, top: 100, bottom: 126 }, [chipBox], GAP);
    expect(shift).toBeCloseTo(-221, 5);
    expect(1591 + shift).toBeCloseTo(chipBox.left - GAP, 5);
  });

  it('does nothing about a card in another row', () => {
    expect(ctbClearShift({ left: 1362, right: 1591, top: 413, bottom: 606 }, [chipBox], GAP)).toBe(0);
  });
});

describe('keepSensorOffCtb with the chip element', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    delete document.documentElement.dataset['phoneBattle'];
  });

  /** An element with a fixed box (jsdom lays nothing out), whose left edge follows `--ffx-sensor-cdx` the way the stylesheet's `calc(... + var(--ffx-sensor-cdx))` moves the card. */
  function boxed(el: HTMLElement, box: { left: number; top: number; width: number; height: number }, follow?: HTMLElement): HTMLElement {
    el.getBoundingClientRect = (): DOMRect => {
      const shift = follow ? (parseFloat(follow.style.getPropertyValue('--ffx-sensor-cdx')) || 0) * SCALE : 0;
      const left = box.left + shift;
      return { x: left, y: box.top, left, top: box.top, right: left + box.width, bottom: box.top + box.height, width: box.width, height: box.height, toJSON: () => ({}) } as DOMRect;
    };
    document.body.appendChild(el);
    return el;
  }

  function rig(cardLeft: number): { sensor: HTMLElement; ctb: HTMLElement; chip: HTMLElement } {
    const sensor = document.createElement('div');
    boxed(sensor, { left: cardLeft, top: 100, width: 229, height: 26 }, sensor);
    const ctb = document.createElement('div');
    boxed(ctb, { left: 1375, top: 124, width: 176, height: 377 });
    const name = document.createElement('span');
    name.className = 'ig-ctb__name';
    boxed(name, { left: 1415, top: 150, width: 40, height: 20 });
    ctb.appendChild(name);
    const chip = document.createElement('button');
    boxed(chip, { left: 1380, top: 97, width: 165, height: 26 });
    return { sensor, ctb, chip };
  }

  it('shifts a card that stands on the chip to the chip\'s left, by exactly what clears it', () => {
    const { sensor, ctb, chip } = rig(1362);
    keepSensorOffCtb(sensor, ctb, SCALE, chip);
    expect(sensor.style.getPropertyValue('--ffx-sensor-cdx')).toBe('-88.4px'); // 221 viewport px = 88.4 grid px
    // The next frame measures the card where the shift put it and keeps it there (no drift a step at a time).
    keepSensorOffCtb(sensor, ctb, SCALE, chip);
    expect(sensor.style.getPropertyValue('--ffx-sensor-cdx')).toBe('-88.4px');
    expect(sensor.getBoundingClientRect().right).toBeCloseTo(chip.getBoundingClientRect().left - GAP, 5);
  });

  it('leaves a card that rests clear of the chip alone', () => {
    const { sensor, ctb, chip } = rig(1087);
    keepSensorOffCtb(sensor, ctb, SCALE, chip);
    expect(sensor.style.getPropertyValue('--ffx-sensor-cdx')).toBe('');
  });

  it('without the chip, as before the fix, the card stays on it', () => {
    const { sensor, ctb } = rig(1362);
    keepSensorOffCtb(sensor, ctb, SCALE);
    expect(sensor.style.getPropertyValue('--ffx-sensor-cdx')).toBe('');
  });

  it('an intent chip that is not laid out (no box) moves nothing', () => {
    const { sensor, ctb } = rig(1362);
    const hidden = document.createElement('button');
    hidden.getBoundingClientRect = (): DOMRect => ({ x: 0, y: 0, left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0, toJSON: () => ({}) }) as DOMRect;
    keepSensorOffCtb(sensor, ctb, SCALE, hidden);
    expect(sensor.style.getPropertyValue('--ffx-sensor-cdx')).toBe('');
  });

  it('the phone has its own target card and the rule stands down there', () => {
    const { sensor, ctb, chip } = rig(1362);
    sensor.style.setProperty('--ffx-sensor-cdx', '-10px');
    document.documentElement.dataset['phoneBattle'] = '1';
    keepSensorOffCtb(sensor, ctb, SCALE, chip);
    expect(sensor.style.getPropertyValue('--ffx-sensor-cdx')).toBe('');
  });
});
