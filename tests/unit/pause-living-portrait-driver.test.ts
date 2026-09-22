// @vitest-environment jsdom
import { describe, expect, it, vi, afterEach } from 'vitest';
import { LivingPortraitDriver } from '../../docs/concepts/pause-until-dawn/prototype-v2/src/driver.ts';

/** jsdom has no `fetch` and no WebGL2 — both are exercised here deliberately: the
 * driver seam must degrade to the stand-in rig and a no-op renderer rather than
 * throwing, since that is exactly the environment this suite runs in. */
function makePlate(): HTMLImageElement {
  const img = document.createElement('img');
  Object.defineProperty(img, 'naturalWidth', { value: 832 });
  Object.defineProperty(img, 'naturalHeight', { value: 1216 });
  document.body.appendChild(img.ownerDocument.createElement('div')).appendChild(img);
  return img;
}

async function flush(times = 3): Promise<void> {
  for (let i = 0; i < times; i++) await Promise.resolve();
}

describe('LivingPortraitDriver (the PortraitStage seam)', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('mount() inserts a canvas over the plate without throwing, even with no fetch/WebGL', async () => {
    const plate = makePlate();
    const driver = new LivingPortraitDriver({ assetBaseUrl: './art/', rigUrl: './art/rig.json' });
    expect(() => driver.mount(plate, 'yuna-x2')).not.toThrow();
    await flush();
    const canvas = plate.parentElement?.querySelector('canvas[data-living-portrait]');
    expect(canvas).toBeTruthy();
    expect(plate.style.visibility).toBe('hidden');
    driver.dispose();
  });

  it('setGaze/blink/setExpression are callable before and after mount, and never throw', async () => {
    const driver = new LivingPortraitDriver({ assetBaseUrl: './art/', rigUrl: './art/rig.json' });
    expect(() => driver.setGaze(0.5, -0.2)).not.toThrow();
    expect(() => driver.blink()).not.toThrow();
    expect(() => driver.setExpression('determined')).not.toThrow();
    const plate = makePlate();
    driver.mount(plate, 'yuna-x2');
    await flush();
    expect(() => driver.setGaze(-1, 1)).not.toThrow();
    expect(() => driver.blink()).not.toThrow();
    expect(() => driver.setExpression('hurt')).not.toThrow();
    driver.dispose();
  });

  it('falls back to the stand-in rig when rig.json 404s or fetch is unavailable (both true in this environment)', async () => {
    const driver = new LivingPortraitDriver({ assetBaseUrl: './art/', rigUrl: './art/rig.json' });
    const plate = makePlate();
    driver.mount(plate, 'yuna-x2');
    await flush(10);
    expect(driver.snapshot().standIn).toBe(true);
    driver.dispose();
  });

  it('an unknown expression name falls back to normal rather than throwing', () => {
    const driver = new LivingPortraitDriver({ assetBaseUrl: './art/', rigUrl: './art/rig.json' });
    expect(() => driver.setExpression('bogus-state')).not.toThrow();
    expect(driver.snapshot().expression).toBe('normal');
  });

  it('dispose() removes the canvas and stops the loop, and is idempotent', async () => {
    const plate = makePlate();
    const driver = new LivingPortraitDriver({ assetBaseUrl: './art/', rigUrl: './art/rig.json' });
    driver.mount(plate, 'yuna-x2');
    await flush();
    driver.dispose();
    expect(plate.parentElement?.querySelector('canvas[data-living-portrait]')).toBeNull();
    expect(() => driver.dispose()).not.toThrow();
  });
});
